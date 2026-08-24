"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";
import { BODY_ZONES, normalizeBodyZoneId, type BodyZoneId } from "@/lib/steps-admin";

interface Benefit { id: string; text: string; zoneIds: BodyZoneId[]; matchAny: boolean }

// Le schéma du corps a changé plusieurs fois (zones génériques → détaillées →
// regroupées) : du contenu jamais réédité peut encore stocker l'ancien format
// (`zoneId` singulier, ou des ids de zones qui n'existent plus). On normalise
// systématiquement à la lecture pour que ça marche quand même dans le jeu.
type RawBenefit = { id?: string; text?: string; zoneId?: string; zoneIds?: string[]; matchAny?: boolean };

function normalizeBenefits(raw: RawBenefit[]): Benefit[] {
  return raw.map((b, i) => {
    const rawZones = b.zoneIds?.length ? b.zoneIds : b.zoneId ? [b.zoneId] : [];
    const zoneIds = Array.from(new Set(rawZones.map(normalizeBodyZoneId)));
    return {
      id: b.id ?? `b${i}`,
      text: b.text ?? "",
      zoneIds: zoneIds.length ? zoneIds : ["corps"],
      matchAny: b.matchAny ?? false,
    };
  });
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: { questionData: { benefits: RawBenefit[] } }[];
  module: {
    id: string;
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

// Illustration partagée par tous les modules (schéma fixe, pas d'upload par
// module), fournie par l'utilisateur.
const CORPS_IMAGE_URL = "/assets/corps/corps-humain.jpg";

// Chaque famille a sa propre teinte au repos (comme sur le schéma dessiné
// précédent) : ça donne un indice visuel — organes en rosé/bleu, muscles en
// crème — sans révéler la réponse, et ça évite que les points du torse
// (poumons/cœur/pectoraux, proches les uns des autres) se confondent.
const ZONE_COLOR: Partial<Record<BodyZoneId, string>> = {
  tete: "#FBD8B4",
  coeur: "#FCA5A5",
  poumons: "#93C5FD",
  pectoraux: "#FDE1B8",
  bras: "#FDE1B8",
  abdos: "#FDE1B8",
  jambes: "#FDE1B8",
  os: "#D1D5DB",
};

// Position d'un point cliquable en % de l'image (indépendant de la taille
// d'écran). Une zone peut avoir plusieurs points (gauche/droite) : cliquer
// l'un ou l'autre compte pour cette zone. Positions estimées visuellement —
// affiner avec ?calibrate=1 (clique sur l'image, les coordonnées s'affichent
// dans la console).
const HOTSPOTS: { zoneId: BodyZoneId; x: number; y: number }[] = [
  { zoneId: "tete", x: 50, y: 6 },
  { zoneId: "poumons", x: 38, y: 19 },
  { zoneId: "poumons", x: 62, y: 19 },
  { zoneId: "coeur", x: 50, y: 24 },
  { zoneId: "pectoraux", x: 28, y: 29 },
  { zoneId: "pectoraux", x: 72, y: 29 },
  { zoneId: "bras", x: 15, y: 38 },
  { zoneId: "bras", x: 85, y: 38 },
  { zoneId: "abdos", x: 50, y: 40 },
  { zoneId: "jambes", x: 39, y: 60 },
  { zoneId: "jambes", x: 61, y: 60 },
  { zoneId: "os", x: 39, y: 80 },
  { zoneId: "os", x: 61, y: 80 },
];

// Légende affichée aux élèves : la couleur d'un point donne une famille
// (organe / muscle / os) sans révéler quelle zone précise c'est.
const LEGEND: { color: string; label: string }[] = [
  { color: ZONE_COLOR.tete!, label: "Tête / Cerveau" },
  { color: ZONE_COLOR.coeur!, label: "Cœur" },
  { color: ZONE_COLOR.poumons!, label: "Poumons" },
  { color: ZONE_COLOR.bras!, label: "Muscles" },
  { color: ZONE_COLOR.os!, label: "Os" },
];

export function CorpsGame({ step }: { step: StepData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const calibrate = searchParams.get("calibrate") === "1";
  const imageRef = useRef<HTMLDivElement>(null);
  const draggingIndex = useRef<number | null>(null);

  const benefits = normalizeBenefits(step.gameData?.[0]?.questionData?.benefits ?? []);
  const total = benefits.length;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [foundForSelected, setFoundForSelected] = useState<Set<BodyZoneId>>(new Set());
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [wrongZone, setWrongZone] = useState<BodyZoneId | null>(null);
  // Copie modifiable des points, éditée en mode calibrage (glisser-déposer).
  const [points, setPoints] = useState(HOTSPOTS);
  const [copied, setCopied] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#E11D48";
  const bottomColor = step.module.colorSecondary ?? "#3f0d16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const selectedBenefit = benefits.find((b) => b.id === selectedId) ?? null;
  const pool = benefits.filter((b) => !solvedIds.has(b.id));
  const solvedZones = new Set(benefits.filter((b) => solvedIds.has(b.id)).flatMap((b) => b.zoneIds));
  const allSolved = total > 0 && solvedIds.size === total;

  function selectBenefit(id: string) {
    setSelectedId((cur) => (cur === id ? null : id));
    setFoundForSelected(new Set());
    setWrongZone(null);
  }

  function clickZone(zoneId: BodyZoneId) {
    if (!selectedBenefit) return;
    if (!selectedBenefit.zoneIds.includes(zoneId)) {
      setWrongZone(zoneId);
      setTimeout(() => setWrongZone(null), 500);
      return;
    }
    if (foundForSelected.has(zoneId)) return;

    const next = new Set(foundForSelected);
    next.add(zoneId);

    if (selectedBenefit.matchAny || next.size >= selectedBenefit.zoneIds.length) {
      const nextSolved = new Set(solvedIds);
      nextSolved.add(selectedBenefit.id);
      setSolvedIds(nextSolved);
      setSelectedId(null);
      setFoundForSelected(new Set());
      const guestStudentId = getGuestStudentId(step.module.slug);
      if (guestStudentId) {
        submitQuizResponse({
          guestStudentId,
          stepId: step.id,
          moduleId: step.module.id,
          userAnswer: { benefitId: selectedBenefit.id, zoneIds: Array.from(next) },
          isCorrect: true,
        }).catch(() => {});
      }
    } else {
      setFoundForSelected(next);
    }
  }

  function clampPct(v: number) {
    return Math.min(100, Math.max(0, v));
  }

  function updatePointFromEvent(index: number, clientX: number, clientY: number) {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clampPct(((clientX - rect.left) / rect.width) * 100);
    const y = clampPct(((clientY - rect.top) / rect.height) * 100);
    setPoints((prev) => prev.map((p, i) => (i === index ? { ...p, x, y } : p)));
  }

  function startDrag(index: number) {
    if (!calibrate) return;
    draggingIndex.current = index;
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (draggingIndex.current === null) return;
    updatePointFromEvent(draggingIndex.current, e.clientX, e.clientY);
  }

  function stopDrag() {
    draggingIndex.current = null;
  }

  function copyConfig() {
    const code = points
      .map((p) => `  { zoneId: "${p.zoneId}", x: ${p.x.toFixed(1)}, y: ${p.y.toFixed(1)} },`)
      .join("\n");
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const Header = (
    <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
      <Link href={`/modules/${step.module.slug}`} className="flex items-center gap-2 md:gap-3 text-gray-700 hover:opacity-70 transition-opacity shrink-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <ArrowLeft size={18} />
        </div>
        <span className="hidden sm:inline font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
      </Link>
      <div className="text-center min-w-0">
        <h1 className="font-black text-base md:text-xl text-gray-900 truncate">{step.content?.title ?? "Où se trouve le bienfait ?"}</h1>
        <p className="hidden sm:block text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
      </div>
      <div className="text-gray-400 font-bold text-sm shrink-0">
        Étape <span className="text-gray-900 text-lg md:text-xl font-black">{gameLevel}</span> / {totalGameLevels}
      </div>
    </header>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
      {Header}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="text-white/70 text-xs font-bold">{solvedIds.size}/{total} placés</span>
          {calibrate && <span className="text-amber-300 text-xs font-bold">· Mode calibrage : glisse les points</span>}
        </div>

        {calibrate && (
          <button
            onClick={copyConfig}
            className="px-4 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold shadow-md"
          >
            {copied ? "Copié ✓" : "Copier la config"}
          </button>
        )}

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full max-w-3xl justify-center">
          {/* Corps */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div
              ref={imageRef}
              className="relative w-48 md:w-60 aspect-[3143/7792] bg-white rounded-3xl shadow-xl p-2 overflow-hidden touch-none"
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrag}
              onPointerLeave={stopDrag}
            >
              <div className="relative w-full h-full">
                <Image src={CORPS_IMAGE_URL} alt="Schéma du corps humain" fill className="object-contain pointer-events-none select-none" priority />
              </div>

              {points.map((h, i) => {
                const solved = solvedZones.has(h.zoneId);
                const found = foundForSelected.has(h.zoneId);
                const wrong = wrongZone === h.zoneId;
                const bg = wrong ? "#DC2626" : solved ? "#16A34A" : found ? "#F59E0B" : (ZONE_COLOR[h.zoneId] ?? "#D1D5DB");
                return (
                  <button
                    key={i}
                    onPointerDown={() => startDrag(i)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!calibrate) clickZone(h.zoneId);
                    }}
                    aria-label={BODY_ZONES.find((z) => z.id === h.zoneId)?.label ?? h.zoneId}
                    className={`absolute w-6 h-6 md:w-7 md:h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md transition-all ${calibrate ? "cursor-grab active:cursor-grabbing ring-2 ring-white/80" : ""}`}
                    style={{ left: `${h.x}%`, top: `${h.y}%`, background: bg }}
                  >
                    {(solved || found) && <Check size={14} className="text-white mx-auto" />}
                    {calibrate && (
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 text-[9px] font-bold text-white bg-black/60 px-1 rounded whitespace-nowrap">
                        {h.zoneId}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Légende des couleurs, pour que les élèves comprennent ce que représente un point */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 max-w-[240px]">
              {LEGEND.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/70">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>

          {/* Liste des bienfaits + zone "corps entier" */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {pool.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBenefit(b.id)}
                  className="px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all"
                  style={
                    selectedId === b.id
                      ? { background: "#fff", color: primaryColor, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", transform: "scale(1.04)" }
                      : { background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)" }
                  }
                >
                  {b.text}
                </button>
              ))}
              {pool.length === 0 && (
                <p className="text-white/60 text-sm font-semibold">Tous les bienfaits sont placés 🎉</p>
              )}
            </div>

            {/* Zone "corps entier" à part : globale, pas localisée sur le schéma */}
            <button
              onClick={() => clickZone("corps")}
              disabled={!selectedId}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
              style={{
                background: solvedZones.has("corps") || foundForSelected.has("corps")
                  ? "#16A34A"
                  : wrongZone === "corps"
                    ? "#DC2626"
                    : "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "2px dashed rgba(255,255,255,0.5)",
              }}
            >
              {BODY_ZONES.find((z) => z.id === "corps")?.emoji} Corps entier (bienfaits généraux)
              {(solvedZones.has("corps") || foundForSelected.has("corps")) && <Check size={16} />}
            </button>

            {selectedBenefit && (
              <p className="text-white/70 text-xs font-semibold text-center md:text-left">
                {selectedBenefit.zoneIds.length > 1
                  ? selectedBenefit.matchAny
                    ? "Clique n'importe laquelle des zones concernées"
                    : `Trouve les ${selectedBenefit.zoneIds.length} zones concernées (${foundForSelected.size}/${selectedBenefit.zoneIds.length})`
                  : "Clique la zone du corps où ce bienfait agit"}
              </p>
            )}
          </div>
        </div>

        {allSolved && (
          <button
            onClick={() => goToNextStep(router, step.module.slug, step.module.steps, step.order)}
            className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)" }}
          >
            Continuer →
          </button>
        )}
      </main>
    </div>
  );
}
