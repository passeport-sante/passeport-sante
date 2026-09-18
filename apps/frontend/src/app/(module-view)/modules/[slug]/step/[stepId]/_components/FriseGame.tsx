"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X, MoveHorizontal, ExternalLink, Info } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";
import { friseGraduations, normalizeFriseData, type FriseCard, type FriseData } from "@/lib/steps-admin";
import { imageUrlAt } from "@/lib/upload";

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: { questionData: Partial<FriseData> }[];
  module: {
    id: string;
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

// Chaque graduation est une colonne qui ne contient que ses propres cartes :
// c'est ce qui empêche deux cartes posées sur des graduations voisines de se
// chevaucher. Les colonnes se partagent la largeur disponible sans descendre
// sous ce minimum ; en dessous (téléphone, frise très longue) la frise défile.
// Les deux valeurs doivent rester identiques dans les classes ci-dessous
// (Tailwind ne peut pas générer une classe à partir d'une variable).
const SLOT_CLASS = "min-w-[92px] md:min-w-[80px]";
const TRACK_CLASS = "min-w-[calc(var(--slots)*92px)] md:min-w-[calc(var(--slots)*80px)]";

// Durée pendant laquelle les cartes fausses tremblent avant de revenir dans la
// pioche : assez long pour que l'élève voie lesquelles étaient fausses.
const SHAKE_MS = 1000;
// Nombre d'erreurs sur une même carte avant de montrer sa bonne graduation, pour
// qu'aucun élève ne reste bloqué indéfiniment.
const HELP_AFTER_FAILS = 2;

type Hint = "further" | "closer";

// Mélange déterministe (identique serveur/client, donc sans décalage
// d'hydratation) : les cartes sont souvent saisies dans l'ordre chronologique,
// les présenter telles quelles donnerait la réponse.
function hashOf(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return h;
}

// Autorise un retour à la ligne juste après le point médian de l'écriture
// inclusive (« Infirmier·ère ») : sinon, dans une colonne étroite, le mot se
// coupe n'importe où (« Infirmier·èr / e »).
function breakable(text: string): string {
  return text.replace(/·/g, "·​");
}

// Le lien est saisi par un admin mais rendu dans un href : on n'accepte que du
// web, jamais un « javascript: ».
function safeLink(link: string | undefined): string | null {
  return link && /^https?:\/\//i.test(link) ? link : null;
}

type DropTarget = number | "pool" | null;

function dropTargetAt(x: number, y: number): DropTarget {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  const col = el.closest<HTMLElement>("[data-frise-value]");
  if (col) return Number(col.dataset.friseValue);
  if (el.closest("[data-frise-pool]")) return "pool";
  return null;
}

export function FriseGame({ step }: { step: StepData }) {
  const router = useRouter();
  const data = normalizeFriseData(step.gameData?.[0]?.questionData);
  const graduations = useMemo(() => friseGraduations(data.min, data.max, data.step), [data.min, data.max, data.step]);
  const cards = useMemo(
    () => [...data.cards].sort((a, b) => hashOf(a.id + a.text) - hashOf(b.id + b.text)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step.id],
  );
  const total = cards.length;

  const [placements, setPlacements] = useState<Record<string, number>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Cartes validées justes : elles ne bougent plus.
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [justLocked, setJustLocked] = useState<Set<string>>(new Set());
  const [firstTry, setFirstTry] = useState<Set<string>>(new Set());
  const [fails, setFails] = useState<Record<string, number>>({});
  const [hints, setHints] = useState<Record<string, Hint>>({});
  const [shaking, setShaking] = useState<Set<string>>(new Set());
  const [hasValidated, setHasValidated] = useState(false);
  const [popupId, setPopupId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const [overflowing, setOverflowing] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);
  // Le clic qui suit un glisser ne doit pas être pris pour une sélection. On ne
  // peut pas attendre ce clic pour lever le blocage : la carte déposée change de
  // place dans le DOM et le navigateur ne l'envoie souvent jamais. D'où une
  // fenêtre de temps, limitée à la carte glissée, plutôt qu'un drapeau.
  const ignoreClick = useRef<{ id: string; until: number } | null>(null);
  const submitted = useRef(false);

  const primaryColor = step.module.colorPrimary ?? "#65A30D";
  const bottomColor = step.module.colorSecondary ?? "#1a2e05";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const busy = shaking.size > 0;
  const pool = cards.filter((c) => placements[c.id] === undefined);
  const complete = total > 0 && locked.size === total;
  const canValidate = !busy && !complete && pool.length === 0;
  const isCorrect = (c: FriseCard) => placements[c.id] === c.value;
  const selectedCard = cards.find((c) => c.id === selectedId) ?? null;
  const popupCard = cards.find((c) => c.id === popupId) ?? null;

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setOverflowing(el.scrollWidth > el.clientWidth + 4);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [graduations.length]);

  useEffect(() => {
    if (!popupId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPopupId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popupId]);

  function place(id: string, value: number) {
    setPlacements((p) => ({ ...p, [id]: value }));
    setSelectedId(null);
  }

  function unplace(id: string) {
    setPlacements((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    setSelectedId(null);
  }

  function canMove(id: string) {
    return !busy && !locked.has(id);
  }

  // ── Glisser (souris et doigt) ────────────────────────────────────────────────
  // Un appui sans déplacement reste un simple clic (sélection) : c'est ce qui
  // permet aussi de jouer en « je touche la carte, puis la graduation ».

  function onCardPointerDown(e: React.PointerEvent<HTMLButtonElement>, id: string) {
    if (!canMove(id)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { id, startX: e.clientX, startY: e.clientY, moved: false };
  }

  function onCardPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const p = pointer.current;
    if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.startX, e.clientY - p.startY) < 6) return;
    p.moved = true;
    setDrag({ id: p.id, x: e.clientX, y: e.clientY });
    const target = dropTargetAt(e.clientX, e.clientY);
    setHoverValue(typeof target === "number" ? target : null);

    if (e.clientY < 80) window.scrollBy(0, -14);
    else if (e.clientY > window.innerHeight - 80) window.scrollBy(0, 14);
    const sc = scrollerRef.current;
    if (sc) {
      const r = sc.getBoundingClientRect();
      if (e.clientY > r.top && e.clientY < r.bottom) {
        if (e.clientX < r.left + 48) sc.scrollLeft -= 16;
        else if (e.clientX > r.right - 48) sc.scrollLeft += 16;
      }
    }
  }

  function onCardPointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    const p = pointer.current;
    pointer.current = null;
    if (!p?.moved) return;
    ignoreClick.current = { id: p.id, until: performance.now() + 150 };
    const target = dropTargetAt(e.clientX, e.clientY);
    if (target === "pool") unplace(p.id);
    else if (typeof target === "number") place(p.id, target);
    setDrag(null);
    setHoverValue(null);
  }

  function onCardPointerCancel() {
    pointer.current = null;
    setDrag(null);
    setHoverValue(null);
  }

  function onCardClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const ignore = ignoreClick.current;
    if (ignore && ignore.id === id && performance.now() < ignore.until) return;
    // Une carte validée ne se déplace plus : la toucher ouvre sa fiche.
    if (locked.has(id)) {
      setPopupId(id);
      return;
    }
    if (!canMove(id)) return;
    setSelectedId((cur) => (cur === id ? null : id));
  }

  function onSlotClick(value: number) {
    if (selectedId && canMove(selectedId)) place(selectedId, value);
  }

  function onPoolClick() {
    if (selectedId && placements[selectedId] !== undefined) unplace(selectedId);
  }

  // ── Validation ───────────────────────────────────────────────────────────────

  function validate() {
    if (!canValidate) return;
    setSelectedId(null);
    setHasValidated(true);

    // Seule la première tentative est enregistrée : c'est elle qui mesure ce que
    // l'élève savait avant d'avoir eu des indices.
    if (!submitted.current) {
      submitted.current = true;
      const guestStudentId = getGuestStudentId(step.module.slug);
      if (guestStudentId) {
        for (const c of cards) {
          submitQuizResponse({
            guestStudentId,
            stepId: step.id,
            moduleId: step.module.id,
            userAnswer: { cardId: c.id, value: placements[c.id] },
            isCorrect: isCorrect(c),
          }).catch(() => {});
        }
      }
    }

    const candidates = cards.filter((c) => !locked.has(c.id));
    const right = candidates.filter(isCorrect);
    const wrong = candidates.filter((c) => !isCorrect(c));

    if (right.length) {
      const ids = right.map((c) => c.id);
      setLocked((prev) => new Set([...prev, ...ids]));
      setFirstTry((prev) => new Set([...prev, ...right.filter((c) => !fails[c.id]).map((c) => c.id)]));
      setJustLocked(new Set(ids));
      setTimeout(() => setJustLocked(new Set()), 600);
    }

    if (wrong.length) {
      const nextHints = Object.fromEntries(
        wrong.map((c) => [c.id, (c.value > (placements[c.id] ?? data.min) ? "further" : "closer") as Hint]),
      );
      setShaking(new Set(wrong.map((c) => c.id)));
      setTimeout(() => {
        setPlacements((p) => {
          const next = { ...p };
          for (const c of wrong) delete next[c.id];
          return next;
        });
        setHints((h) => ({ ...h, ...nextHints }));
        setFails((f) => ({ ...f, ...Object.fromEntries(wrong.map((c) => [c.id, (f[c.id] ?? 0) + 1])) }));
        setShaking(new Set());
      }, SHAKE_MS);
    }
  }

  const Header = (
    <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
      <Link href={`/modules/${step.module.slug}`} className="flex items-center gap-2 md:gap-3 text-gray-700 hover:opacity-70 transition-opacity flex-1 basis-0 min-w-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <ArrowLeft size={18} />
        </div>
        <span className="hidden sm:inline font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
      </Link>
      <div className="text-center min-w-0">
        <h1 className="font-black text-base md:text-xl text-gray-900 truncate">{step.content?.title || "Place sur la frise"}</h1>
        <p className="hidden sm:block text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
      </div>
      <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
        Étape <span className="text-gray-900 text-lg md:text-xl font-black">{gameLevel}</span> / {totalGameLevels}
      </div>
    </header>
  );

  // Fonction de rendu et non composant : un composant déclaré ici serait recréé
  // à chaque rendu (donc à chaque mouvement pendant un glisser), ce qui démonte
  // la carte et lui fait perdre la capture du pointeur.
  function renderCard(card: FriseCard, where: "pool" | "frise") {
    const selected = selectedId === card.id;
    const dragging = drag?.id === card.id;
    const isLocked = locked.has(card.id);
    const isShaking = shaking.has(card.id);
    const hint = where === "pool" ? hints[card.id] : undefined;

    // Sélection très marquée : au doigt, c'est le seul retour que l'élève a
    // entre « je touche la carte » et « je touche la graduation ».
    let style: React.CSSProperties;
    if (isLocked) style = { background: "#16A34A", color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
    else if (isShaking) style = { background: "#DC2626", color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" };
    else if (selected)
      style = { background: primaryColor, color: "#fff", boxShadow: "0 0 0 3px #fff, 0 10px 24px rgba(0,0,0,0.3)" };
    else style = { background: "#fff", color: "#1f2937", boxShadow: "0 4px 14px rgba(0,0,0,0.14)" };

    return (
      <button
        key={card.id}
        type="button"
        onPointerDown={(e) => onCardPointerDown(e, card.id)}
        onPointerMove={onCardPointerMove}
        onPointerUp={onCardPointerUp}
        onPointerCancel={onCardPointerCancel}
        onClick={(e) => onCardClick(e, card.id)}
        aria-pressed={selected}
        aria-label={isLocked ? `${card.text} : bien placé, voir la fiche` : undefined}
        className={`shrink-0 rounded-2xl overflow-hidden text-center select-none transition-transform ${
          where === "pool" ? "w-[124px]" : "w-full max-w-[100px]"
        } ${canMove(card.id) ? "cursor-grab active:cursor-grabbing touch-none" : isLocked ? "cursor-pointer" : "cursor-default"} ${
          selected ? "-translate-y-1 scale-105" : ""
        } ${dragging ? "opacity-40" : ""} ${isShaking ? "frise-shake" : ""} ${
          justLocked.has(card.id) ? "frise-pop" : ""
        } focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70`}
        style={style}
      >
        {card.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrlAt(card.imageUrl, 248, 160)}
            alt=""
            draggable={false}
            className={`w-full object-cover pointer-events-none ${where === "pool" ? "h-20" : "h-12 md:h-14"}`}
          />
        )}
        {/* Icône au-dessus du texte : dans une colonne étroite, chaque pixel de
            largeur compte pour que le nom reste lisible. */}
        <span
          className={`flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 font-bold leading-tight ${
            where === "pool" ? "text-xs md:text-[13px]" : "text-[11px] md:text-xs"
          }`}
        >
          {isLocked && (
            <span className="flex items-center gap-1">
              <Check size={13} strokeWidth={3} />
              <Info size={12} strokeWidth={2.5} className="opacity-80" />
            </span>
          )}
          {isShaking && <X size={13} strokeWidth={3} />}
          <span className="line-clamp-3 hyphens-auto [overflow-wrap:anywhere]">{breakable(card.text)}</span>
        </span>
        {hint && (
          <span className="block py-1 text-[11px] font-black" style={{ background: "#FEF3C7", color: "#92400E" }}>
            {hint === "further" ? "Plus loin →" : "← Moins loin"}
          </span>
        )}
      </button>
    );
  }

  const dragged = drag ? cards.find((c) => c.id === drag.id) : null;
  const trackStart = `color-mix(in srgb, ${primaryColor} 45%, white)`;

  let poolHint: string;
  if (busy) poolHint = "Vérification…";
  else if (selectedCard)
    poolHint =
      placements[selectedCard.id] !== undefined
        ? "Touche une autre graduation pour la déplacer, ou cette zone pour la retirer."
        : "Touche maintenant la bonne graduation sur la frise.";
  else if (hasValidated && pool.length > 0)
    poolHint = "Ces cartes étaient mal placées. Suis l'indice sous chacune d'elles !";
  else poolHint = "Glisse une carte sur la frise, ou touche-la puis touche la graduation.";

  const counter = hasValidated
    ? `${locked.size}/${total} validée${locked.size > 1 ? "s" : ""}`
    : `${total - pool.length}/${total} placée${total - pool.length > 1 ? "s" : ""}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
      <style>{`
        @keyframes frise-shake {
          0%, 100% { transform: translateX(0) rotate(0); }
          15% { transform: translateX(-7px) rotate(-3deg); }
          30% { transform: translateX(7px) rotate(3deg); }
          45% { transform: translateX(-5px) rotate(-2deg); }
          60% { transform: translateX(5px) rotate(2deg); }
          75% { transform: translateX(-2px); }
        }
        @keyframes frise-pop {
          0% { transform: scale(0.85); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .frise-shake { animation: frise-shake 0.5s ease-in-out 2; }
        .frise-pop { animation: frise-pop 0.45s ease-out; }
        @media (prefers-reduced-motion: reduce) {
          .frise-shake, .frise-pop { animation: none; }
        }
      `}</style>

      {Header}

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-5 px-4 md:px-8 py-6">
        <p className="text-center text-white/80 text-xs font-bold">{counter}</p>

        {/* Pioche */}
        {!complete && (
          <div
            data-frise-pool
            onClick={onPoolClick}
            className="rounded-3xl px-4 py-4 space-y-3"
            style={{ background: "rgba(0,0,0,0.15)", border: "2px dashed rgba(255,255,255,0.35)" }}
          >
            <p className="text-white text-xs font-black uppercase tracking-widest text-center">Cartes à placer</p>
            <div className="flex flex-wrap justify-center gap-3 min-h-[52px]">
              {pool.map((c) => renderCard(c, "pool"))}
              {pool.length === 0 && (
                <p className="self-center text-white/70 text-sm font-semibold">Toutes les cartes sont sur la frise.</p>
              )}
            </div>
            <p className="text-white/80 text-xs leading-relaxed text-center">{poolHint}</p>
          </div>
        )}

        {/* Frise */}
        <div className="bg-white rounded-3xl shadow-xl pt-5 pb-3">
          {data.axisLabel && (
            <p className="text-xs md:text-sm font-black uppercase tracking-widest text-center px-4" style={{ color: primaryColor }}>
              {data.axisLabel}
            </p>
          )}
          {overflowing && (
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-gray-400 mt-1">
              <MoveHorizontal size={13} />
              Fais défiler la frise
            </p>
          )}

          <div ref={scrollerRef} className="overflow-x-auto px-3 md:px-5 pb-2">
            <div className={`flex pr-4 ${TRACK_CLASS}`} style={{ "--slots": graduations.length } as React.CSSProperties}>
              {graduations.map((v, i) => {
                const placedHere = cards.filter((c) => placements[c.id] === v);
                // Coup de pouce : après plusieurs erreurs, la bonne place d'une
                // carte s'affiche en pointillés tant qu'elle n'y est pas.
                const helpHere = cards.filter(
                  (c) => c.value === v && (fails[c.id] ?? 0) >= HELP_AFTER_FAILS && !locked.has(c.id) && placements[c.id] !== v,
                );
                const hovered = hoverValue === v;
                const targeted = !!selectedCard && canMove(selectedCard.id);
                const isFirst = i === 0;
                const isLast = i === graduations.length - 1;
                const occupied = placedHere.length > 0 || helpHere.length > 0;
                const borderColor = hovered || targeted ? trackStart : "transparent";
                const borderStyle = hovered ? "solid" : "dashed";

                return (
                  <div
                    key={v}
                    data-frise-value={v}
                    onClick={() => onSlotClick(v)}
                    className={`flex-1 flex flex-col items-center cursor-pointer ${SLOT_CLASS}`}
                  >
                    {/* Colonne des cartes, au-dessus de la graduation */}
                    <div
                      className="w-full flex-1 flex flex-col items-center justify-end gap-2 px-1 pt-3 min-h-[150px] md:min-h-[190px] rounded-t-2xl"
                      style={{
                        background: hovered
                          ? `color-mix(in srgb, ${primaryColor} 20%, white)`
                          : targeted
                            ? `color-mix(in srgb, ${primaryColor} 6%, white)`
                            : "transparent",
                        borderTop: `2px ${borderStyle} ${borderColor}`,
                        borderLeft: `2px ${borderStyle} ${borderColor}`,
                        borderRight: `2px ${borderStyle} ${borderColor}`,
                      }}
                    >
                      {placedHere.map((c) => renderCard(c, "frise"))}
                      {helpHere.map((c) => (
                        <div
                          key={`help-${c.id}`}
                          className="w-full max-w-[100px] rounded-2xl overflow-hidden text-center"
                          style={{ border: "2px dashed #16A34A", color: "#15803D", background: "#F0FDF4" }}
                        >
                          <span className="block px-1 pt-1 text-[10px] font-black leading-tight">Coup de pouce</span>
                          <span className="block px-1.5 pb-1.5 text-[11px] md:text-xs font-bold leading-tight line-clamp-3 hyphens-auto [overflow-wrap:anywhere]">
                            {breakable(c.text)}
                          </span>
                        </div>
                      ))}
                      {/* Tige qui relie la pile de cartes à la frise */}
                      <span className="w-1 h-4 rounded-full shrink-0" style={{ background: occupied ? trackStart : "transparent" }} />
                    </div>

                    {/* La frise elle-même */}
                    <div className="relative w-full h-10 flex items-center justify-center">
                      <span
                        className={`absolute h-3.5 top-1/2 -translate-y-1/2 ${isFirst ? "left-1/2 rounded-l-full" : "left-0"} right-0`}
                        style={{
                          background: `linear-gradient(90deg, ${trackStart}, ${primaryColor})`,
                          backgroundSize: `${graduations.length * 100}% 100%`,
                          backgroundPosition: `${graduations.length > 1 ? (i / (graduations.length - 1)) * 100 : 0}% 0`,
                        }}
                      />
                      {isLast && (
                        <span
                          className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-0 h-0"
                          style={{
                            borderTop: "13px solid transparent",
                            borderBottom: "13px solid transparent",
                            borderLeft: `18px solid ${primaryColor}`,
                          }}
                        />
                      )}
                      <span
                        className={`relative w-6 h-6 rounded-full bg-white transition-transform ${hovered ? "scale-125" : ""}`}
                        style={{ border: `5px solid ${primaryColor}`, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClick(v);
                      }}
                      disabled={!selectedCard || !canMove(selectedCard.id)}
                      aria-label={selectedCard ? `Placer « ${selectedCard.text} » sur ${v}` : `Graduation ${v}`}
                      className="mt-1 text-xl md:text-2xl font-black tabular-nums disabled:cursor-default focus:outline-none focus-visible:underline"
                      style={{ color: hovered ? primaryColor : "#1f2937" }}
                    >
                      {v}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {locked.size > 0 && (
            <p className="text-center text-[11px] md:text-xs font-bold text-gray-400 px-4 pt-1">
              Touche une carte verte pour découvrir sa fiche.
            </p>
          )}
        </div>

        {complete && (
          <div className="frise-pop bg-white rounded-3xl shadow-xl px-5 py-5 md:px-7 text-center space-y-1">
            <p className="font-black text-lg md:text-xl" style={{ color: "#16A34A" }}>
              Frise complète !
            </p>
            <p className="text-sm text-gray-600">
              <strong>
                {firstTry.size}/{total}
              </strong>{" "}
              carte{total > 1 ? "s" : ""} bien placée{firstTry.size > 1 ? "s" : ""} du premier coup
              {firstTry.size === total ? " : un sans-faute !" : "."}
            </p>
          </div>
        )}

        <div className="flex justify-center pb-4">
          {complete ? (
            <button
              onClick={() => goToNextStep(router, step.module.slug, step.module.steps, step.order)}
              className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)" }}
            >
              Continuer →
            </button>
          ) : (
            <button
              onClick={validate}
              disabled={!canValidate}
              className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)" }}
            >
              Valider ma frise
            </button>
          )}
        </div>
      </main>

      {dragged && drag && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 w-[112px] rounded-2xl overflow-hidden text-center bg-white shadow-2xl rotate-3"
          style={{ left: drag.x, top: drag.y, color: primaryColor }}
        >
          {dragged.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrlAt(dragged.imageUrl, 248, 160)} alt="" className="w-full h-16 object-cover" />
          )}
          <span className="block px-2 py-2 text-xs font-bold leading-tight line-clamp-3">{dragged.text}</span>
        </div>
      )}

      {popupCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={popupCard.text}
          onClick={() => setPopupId(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="frise-pop w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
            {popupCard.imageUrl && (
              // Fond teinté : ce format d'image n'est demandé qu'à l'ouverture, sans
              // lui la pop-up paraît cassée (bloc blanc) le temps du chargement.
              <div className="w-full h-44" style={{ background: `color-mix(in srgb, ${primaryColor} 12%, white)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrlAt(popupCard.imageUrl, 768, 400)} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-black text-gray-900 leading-tight">{popupCard.text}</h2>
                <button
                  type="button"
                  onClick={() => setPopupId(null)}
                  aria-label="Fermer"
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-300"
                >
                  <X size={18} />
                </button>
              </div>
              <p
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold"
                style={{ background: `color-mix(in srgb, ${primaryColor} 12%, white)`, color: primaryColor }}
              >
                {popupCard.value}
                {data.axisLabel ? ` · ${data.axisLabel}` : ""}
              </p>
              {popupCard.explanation && <p className="text-sm text-gray-600 leading-relaxed">{popupCard.explanation}</p>}
              {safeLink(popupCard.link) && (
                <a
                  href={safeLink(popupCard.link)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-white font-black transition-opacity hover:opacity-90"
                  style={{ background: primaryColor }}
                >
                  {data.linkLabel}
                  <ExternalLink size={16} strokeWidth={2.5} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
