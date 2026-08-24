"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type Prim =
  | { shape: "circle"; cx: number; cy: number; r: number }
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect"; x: number; y: number; width: number; height: number; rx: number }
  | { shape: "polygon"; points: string };

interface ZoneRegion {
  zoneId: BodyZoneId;
  center: { x: number; y: number };
  idleFill: string;
  parts: Prim[];
}

function heartParts(cx: number, cy: number): Prim[] {
  return [
    { shape: "circle", cx: cx - 6, cy: cy - 3, r: 7 },
    { shape: "circle", cx: cx + 6, cy: cy - 3, r: 7 },
    { shape: "polygon", points: `${cx - 12},${cy - 2} ${cx + 12},${cy - 2} ${cx},${cy + 14}` },
  ];
}

// Membre effilé (bras/jambe) : plus large en haut, plus étroit en bas, capuchons
// arrondis aux deux bouts. Construit à partir de primitives déjà sûres
// (polygone + cercles), pour éviter les tracés de courbes hasardeux.
function limbParts(topCx: number, topY: number, topR: number, botCx: number, botY: number, botR: number): Prim[] {
  return [
    {
      shape: "polygon",
      points: `${topCx - topR},${topY} ${topCx + topR},${topY} ${botCx + botR},${botY} ${botCx - botR},${botY}`,
    },
    { shape: "circle", cx: topCx, cy: topY, r: topR },
    { shape: "circle", cx: botCx, cy: botY, r: botR },
  ];
}

// Profil du torse (moitié droite, du cou à l'entrejambe) : décalage horizontal
// depuis le centre (x=100) + hauteur. Répété en miroir pour la moitié gauche,
// ce qui garantit une silhouette parfaitement symétrique.
const TORSO_PROFILE: { dx: number; y: number }[] = [
  { dx: 10, y: 64 }, // cou
  { dx: 44, y: 78 }, // épaule
  { dx: 40, y: 105 }, // poitrine
  { dx: 30, y: 140 }, // amorce de taille
  { dx: 24, y: 168 }, // taille
  { dx: 30, y: 190 }, // amorce de hanche
  { dx: 34, y: 205 }, // hanche
  { dx: 8, y: 215 }, // entrejambe
];

function torsoPolygonPoints(): string {
  const right = TORSO_PROFILE.map((p) => `${100 + p.dx},${p.y}`);
  const left = [...TORSO_PROFILE].reverse().map((p) => `${100 - p.dx},${p.y}`);
  return [...right, ...left].join(" ");
}

function boneParts(cx: number, cy: number): Prim[] {
  return [
    { shape: "rect", x: cx - 4, y: cy - 14, width: 8, height: 28, rx: 4 },
    { shape: "circle", cx: cx - 5, cy: cy - 14, r: 5.5 },
    { shape: "circle", cx: cx + 5, cy: cy - 14, r: 5.5 },
    { shape: "circle", cx: cx - 5, cy: cy + 14, r: 5.5 },
    { shape: "circle", cx: cx + 5, cy: cy + 14, r: 5.5 },
  ];
}

// 8 zones (+ "corps entier" en bouton à part) : chaque famille a sa propre
// teinte pastel au repos pour rester lisible d'un coup d'œil, plutôt que des
// blocs blancs qui se confondent entre eux et avec le fond.
const ORGAN = "#FCA5A5"; // cœur / poumons — rosé
const LUNG = "#93C5FD"; // poumons — bleu doux
const MUSCLE = "#FDE1B8"; // pectoraux / bras / abdos / jambes — crème chaud
const BONE = "#E5E7EB"; // os — gris clair
const SKIN = "#FBD8B4"; // tête

const ZONE_REGIONS: ZoneRegion[] = [
  { zoneId: "tete", center: { x: 100, y: 42 }, idleFill: SKIN, parts: [{ shape: "circle", cx: 100, cy: 42, r: 26 }] },

  { zoneId: "poumons", center: { x: 90, y: 108 }, idleFill: LUNG, parts: [{ shape: "ellipse", cx: 90, cy: 108, rx: 8, ry: 24 }] },
  { zoneId: "poumons", center: { x: 110, y: 108 }, idleFill: LUNG, parts: [{ shape: "ellipse", cx: 110, cy: 108, rx: 8, ry: 24 }] },
  { zoneId: "coeur", center: { x: 98, y: 116 }, idleFill: ORGAN, parts: heartParts(98, 116) },

  { zoneId: "pectoraux", center: { x: 68, y: 118 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 68, cy: 118, rx: 13, ry: 19 }] },
  { zoneId: "pectoraux", center: { x: 132, y: 118 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 132, cy: 118, rx: 13, ry: 19 }] },

  { zoneId: "bras", center: { x: 43, y: 136 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 43, cy: 136, rx: 14, ry: 30 }] },
  { zoneId: "bras", center: { x: 157, y: 136 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 157, cy: 136, rx: 14, ry: 30 }] },

  { zoneId: "abdos", center: { x: 100, y: 178 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 100, cy: 178, rx: 24, ry: 30 }] },

  { zoneId: "jambes", center: { x: 81, y: 290 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 81, cy: 290, rx: 14, ry: 58 }] },
  { zoneId: "jambes", center: { x: 119, y: 290 }, idleFill: MUSCLE, parts: [{ shape: "ellipse", cx: 119, cy: 290, rx: 14, ry: 58 }] },

  { zoneId: "os", center: { x: 81, y: 355 }, idleFill: BONE, parts: boneParts(81, 355) },
  { zoneId: "os", center: { x: 119, y: 355 }, idleFill: BONE, parts: boneParts(119, 355) },
];

// Silhouette statique en arrière-plan (non cliquable) : un torse à la vraie
// forme de sablier (épaules → taille → hanches) plutôt que des rectangles
// empilés, et des membres effilés plutôt que des tubes à section constante.
const SILHOUETTE_ARMS: Prim[] = [
  ...limbParts(150, 82, 15, 150, 218, 10), // bras droit
  ...limbParts(50, 82, 15, 50, 218, 10), // bras gauche
];
const SILHOUETTE_LEGS: Prim[] = [
  ...limbParts(119, 210, 17, 119, 365, 11), // jambe droite
  ...limbParts(81, 210, 17, 81, 365, 11), // jambe gauche
];

// Petites touches décoratives (non cliquables) pour que le schéma ressemble à
// un vrai petit personnage plutôt qu'à un diagramme froid : mains, pieds, visage.
const HANDS_FEET = [
  { cx: 50, cy: 224, r: 9 }, // main gauche
  { cx: 150, cy: 224, r: 9 }, // main droite
  { cx: 81, cy: 370, r: 10 }, // pied gauche
  { cx: 119, cy: 370, r: 10 }, // pied droit
];

function renderPrim(part: Prim, key: string, extraProps: { fill: string; stroke: string; strokeWidth: number }) {
  switch (part.shape) {
    case "circle":
      return <circle key={key} cx={part.cx} cy={part.cy} r={part.r} {...extraProps} />;
    case "ellipse":
      return <ellipse key={key} cx={part.cx} cy={part.cy} rx={part.rx} ry={part.ry} {...extraProps} />;
    case "rect":
      return <rect key={key} x={part.x} y={part.y} width={part.width} height={part.height} rx={part.rx} {...extraProps} />;
    case "polygon":
      return <polygon key={key} points={part.points} {...extraProps} />;
  }
}

export function CorpsGame({ step }: { step: StepData }) {
  const router = useRouter();

  const benefits = normalizeBenefits(step.gameData?.[0]?.questionData?.benefits ?? []);
  const total = benefits.length;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [foundForSelected, setFoundForSelected] = useState<Set<BodyZoneId>>(new Set());
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [wrongZone, setWrongZone] = useState<BodyZoneId | null>(null);

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
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full max-w-3xl justify-center">
          {/* Corps */}
          <svg viewBox="0 0 200 400" className="w-44 md:w-56 shrink-0" role="img" aria-label="Schéma du corps humain">
            <defs>
              <filter id="corps-shadow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#000" floodOpacity="0.18" />
              </filter>
            </defs>

            <g fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.45)" strokeWidth={2.5} strokeLinejoin="round">
              {SILHOUETTE_LEGS.map((p, i) => renderPrim(p, `leg-${i}`, { fill: "rgba(255,255,255,0.14)", stroke: "rgba(255,255,255,0.45)", strokeWidth: 2.5 }))}
              {SILHOUETTE_ARMS.map((p, i) => renderPrim(p, `arm-${i}`, { fill: "rgba(255,255,255,0.14)", stroke: "rgba(255,255,255,0.45)", strokeWidth: 2.5 }))}
              <polygon points={torsoPolygonPoints()} />
            </g>

            <g filter="url(#corps-shadow)">
              {ZONE_REGIONS.map((region, i) => {
                const solved = solvedZones.has(region.zoneId);
                const found = foundForSelected.has(region.zoneId);
                const wrong = wrongZone === region.zoneId;
                const fill = wrong ? "#DC2626" : solved ? "#16A34A" : found ? "#F59E0B" : region.idleFill;
                return (
                  <g
                    key={i}
                    onClick={() => clickZone(region.zoneId)}
                    className="cursor-pointer transition-colors duration-200"
                  >
                    {region.parts.map((part, j) =>
                      renderPrim(part, `${i}-${j}`, { fill, stroke: "#fff", strokeWidth: 2 })
                    )}
                    {region.zoneId === "tete" && (
                      <g className="pointer-events-none">
                        <circle cx={92} cy={38} r={2.6} fill="#3f2a1f" />
                        <circle cx={108} cy={38} r={2.6} fill="#3f2a1f" />
                        <path d="M90,49 Q100,55 110,49" stroke="#3f2a1f" strokeWidth={2.2} fill="none" strokeLinecap="round" />
                      </g>
                    )}
                    {(solved || found) && (
                      <text
                        x={region.center.x}
                        y={region.center.y + 4}
                        textAnchor="middle"
                        fontSize={12}
                        fill="#fff"
                        className="pointer-events-none select-none"
                      >
                        ✓
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            <g fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.7)" strokeWidth={1.5} className="pointer-events-none">
              {HANDS_FEET.map((h, i) => (
                <circle key={i} cx={h.cx} cy={h.cy} r={h.r} />
              ))}
            </g>
          </svg>

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
