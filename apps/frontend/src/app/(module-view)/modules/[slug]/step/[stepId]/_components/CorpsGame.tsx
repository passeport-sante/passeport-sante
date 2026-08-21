"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";
import { BODY_ZONES, type BodyZoneId } from "@/lib/steps-admin";

interface Benefit { id: string; text: string; zoneIds: BodyZoneId[] }

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: { questionData: { benefits: Benefit[] } }[];
  module: {
    id: string;
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

// Primitives d'une zone : chaque zone peut être composée de plusieurs formes
// simples (ex. le cœur = 2 cercles + un triangle, l'os = une barre + 4 têtes
// rondes) pour rester lisible sans jamais tracer de contour complexe à la main.
type Prim =
  | { shape: "circle"; cx: number; cy: number; r: number }
  | { shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { shape: "rect"; x: number; y: number; width: number; height: number; rx: number }
  | { shape: "polygon"; points: string };

interface ZoneRegion {
  zoneId: BodyZoneId;
  center: { x: number; y: number };
  parts: Prim[];
}

function heartParts(cx: number, cy: number): Prim[] {
  return [
    { shape: "circle", cx: cx - 6, cy: cy - 3, r: 7 },
    { shape: "circle", cx: cx + 6, cy: cy - 3, r: 7 },
    { shape: "polygon", points: `${cx - 12},${cy - 2} ${cx + 12},${cy - 2} ${cx},${cy + 14}` },
  ];
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

// Centre du corps : x=110. Chaque zone paire (gauche/droite) est déclarée deux
// fois avec le même zoneId : cliquer l'une ou l'autre compte pour cette zone.
// Les zones "organes" (cœur, poumons) sont ajoutées APRÈS les pectoraux dans le
// tableau pour rester cliquables par-dessus, comme sur un vrai schéma en coupe.
const ZONE_REGIONS: ZoneRegion[] = [
  { zoneId: "tete", center: { x: 110, y: 40 }, parts: [{ shape: "circle", cx: 110, cy: 40, r: 25 }] },

  { zoneId: "trapezes", center: { x: 84, y: 72 }, parts: [{ shape: "ellipse", cx: 84, cy: 72, rx: 11, ry: 13 }] },
  { zoneId: "trapezes", center: { x: 136, y: 72 }, parts: [{ shape: "ellipse", cx: 136, cy: 72, rx: 11, ry: 13 }] },

  { zoneId: "epaules", center: { x: 62, y: 92 }, parts: [{ shape: "circle", cx: 62, cy: 92, r: 15 }] },
  { zoneId: "epaules", center: { x: 158, y: 92 }, parts: [{ shape: "circle", cx: 158, cy: 92, r: 15 }] },

  { zoneId: "pectoraux", center: { x: 88, y: 122 }, parts: [{ shape: "ellipse", cx: 88, cy: 122, rx: 19, ry: 23 }] },
  { zoneId: "pectoraux", center: { x: 132, y: 122 }, parts: [{ shape: "ellipse", cx: 132, cy: 122, rx: 19, ry: 23 }] },

  { zoneId: "poumons", center: { x: 96, y: 104 }, parts: [{ shape: "ellipse", cx: 96, cy: 104, rx: 8, ry: 16 }] },
  { zoneId: "poumons", center: { x: 124, y: 104 }, parts: [{ shape: "ellipse", cx: 124, cy: 104, rx: 8, ry: 16 }] },
  { zoneId: "coeur", center: { x: 105, y: 122 }, parts: heartParts(105, 122) },

  { zoneId: "biceps", center: { x: 48, y: 140 }, parts: [{ shape: "ellipse", cx: 48, cy: 140, rx: 13, ry: 23 }] },
  { zoneId: "biceps", center: { x: 172, y: 140 }, parts: [{ shape: "ellipse", cx: 172, cy: 140, rx: 13, ry: 23 }] },
  { zoneId: "triceps", center: { x: 34, y: 140 }, parts: [{ shape: "ellipse", cx: 34, cy: 140, rx: 6, ry: 20 }] },
  { zoneId: "triceps", center: { x: 186, y: 140 }, parts: [{ shape: "ellipse", cx: 186, cy: 140, rx: 6, ry: 20 }] },

  { zoneId: "abdos", center: { x: 110, y: 185 }, parts: [{ shape: "ellipse", cx: 110, cy: 185, rx: 26, ry: 32 }] },
  { zoneId: "obliques", center: { x: 78, y: 185 }, parts: [{ shape: "ellipse", cx: 78, cy: 185, rx: 9, ry: 26 }] },
  { zoneId: "obliques", center: { x: 142, y: 185 }, parts: [{ shape: "ellipse", cx: 142, cy: 185, rx: 9, ry: 26 }] },

  { zoneId: "avant_bras", center: { x: 40, y: 215 }, parts: [{ shape: "ellipse", cx: 40, cy: 215, rx: 11, ry: 28 }] },
  { zoneId: "avant_bras", center: { x: 180, y: 215 }, parts: [{ shape: "ellipse", cx: 180, cy: 215, rx: 11, ry: 28 }] },

  { zoneId: "fessiers", center: { x: 90, y: 245 }, parts: [{ shape: "ellipse", cx: 90, cy: 245, rx: 15, ry: 16 }] },
  { zoneId: "fessiers", center: { x: 130, y: 245 }, parts: [{ shape: "ellipse", cx: 130, cy: 245, rx: 15, ry: 16 }] },

  { zoneId: "quadriceps", center: { x: 90, y: 300 }, parts: [{ shape: "ellipse", cx: 90, cy: 300, rx: 15, ry: 38 }] },
  { zoneId: "quadriceps", center: { x: 130, y: 300 }, parts: [{ shape: "ellipse", cx: 130, cy: 300, rx: 15, ry: 38 }] },
  { zoneId: "ischios", center: { x: 74, y: 300 }, parts: [{ shape: "ellipse", cx: 74, cy: 300, rx: 6, ry: 34 }] },
  { zoneId: "ischios", center: { x: 146, y: 300 }, parts: [{ shape: "ellipse", cx: 146, cy: 300, rx: 6, ry: 34 }] },

  { zoneId: "mollets", center: { x: 90, y: 365 }, parts: [{ shape: "ellipse", cx: 90, cy: 365, rx: 12, ry: 28 }] },
  { zoneId: "mollets", center: { x: 130, y: 365 }, parts: [{ shape: "ellipse", cx: 130, cy: 365, rx: 12, ry: 28 }] },

  { zoneId: "os", center: { x: 90, y: 400 }, parts: boneParts(90, 400) },
  { zoneId: "os", center: { x: 130, y: 400 }, parts: boneParts(130, 400) },
];

// Silhouette statique en arrière-plan (non cliquable) : blocs arrondis qui se
// chevauchent (épaules, hanches, bras, jambes) plutôt qu'un simple rectangle.
const SILHOUETTE = {
  shoulders: { x: 54, y: 60, width: 112, height: 120, rx: 42 },
  hips: { x: 72, y: 150, width: 76, height: 90, rx: 30 },
  armLeft: { x: 28, y: 85, width: 40, height: 150, rx: 20 },
  armRight: { x: 152, y: 85, width: 40, height: 150, rx: 20 },
  legLeft: { x: 68, y: 235, width: 48, height: 180, rx: 24 },
  legRight: { x: 104, y: 235, width: 48, height: 180, rx: 24 },
};

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

  const benefits = step.gameData?.[0]?.questionData?.benefits ?? [];
  const total = benefits.length;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Zones déjà trouvées pour le bienfait EN COURS de sélection (remises à zéro
  // à chaque changement de bienfait sélectionné).
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
    if (foundForSelected.has(zoneId)) return; // déjà trouvée pour ce bienfait

    const next = new Set(foundForSelected);
    next.add(zoneId);

    if (next.size >= selectedBenefit.zoneIds.length) {
      // Toutes les zones de ce bienfait ont été trouvées.
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
          <svg viewBox="0 0 220 430" className="w-48 md:w-64 shrink-0" role="img" aria-label="Schéma détaillé du corps humain">
            {/* Silhouette statique, non cliquable */}
            <g fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.3)" strokeWidth={2}>
              <rect {...SILHOUETTE.legLeft} />
              <rect {...SILHOUETTE.legRight} />
              <rect {...SILHOUETTE.armLeft} />
              <rect {...SILHOUETTE.armRight} />
              <rect {...SILHOUETTE.shoulders} />
              <rect {...SILHOUETTE.hips} />
            </g>

            {ZONE_REGIONS.map((region, i) => {
              const solved = solvedZones.has(region.zoneId);
              const found = foundForSelected.has(region.zoneId);
              const wrong = wrongZone === region.zoneId;
              const fill = wrong ? "#DC2626" : solved ? "#16A34A" : found ? "#F59E0B" : "rgba(255,255,255,0.9)";
              return (
                <g
                  key={i}
                  onClick={() => clickZone(region.zoneId)}
                  className="cursor-pointer transition-colors duration-200"
                  style={{ opacity: selectedId ? 1 : 0.85 }}
                >
                  {region.parts.map((part, j) =>
                    renderPrim(part, `${i}-${j}`, { fill, stroke: "#fff", strokeWidth: 1.25 })
                  )}
                  {(solved || found) && (
                    <text
                      x={region.center.x}
                      y={region.center.y + 4}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#fff"
                      className="pointer-events-none select-none"
                    >
                      ✓
                    </text>
                  )}
                </g>
              );
            })}
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
                  ? `Trouve les ${selectedBenefit.zoneIds.length} zones concernées (${foundForSelected.size}/${selectedBenefit.zoneIds.length})`
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
