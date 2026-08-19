"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";
import { BODY_ZONES, type BodyZoneId } from "@/lib/steps-admin";

interface Benefit { id: string; text: string; zoneId: BodyZoneId }

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

// Zones du corps positionnées sur un viewBox 200x380 — formes simples (cercles,
// ellipses, rectangles arrondis), aucune donnée de tracé complexe à maintenir.
type BodyShape =
  | { zoneId: BodyZoneId; shape: "circle"; cx: number; cy: number; r: number }
  | { zoneId: BodyZoneId; shape: "ellipse"; cx: number; cy: number; rx: number; ry: number }
  | { zoneId: BodyZoneId; shape: "rect"; x: number; y: number; width: number; height: number; rx: number };

const ON_BODY_SHAPES: BodyShape[] = [
  { zoneId: "tete", shape: "circle", cx: 100, cy: 40, r: 28 },
  { zoneId: "poumons", shape: "ellipse", cx: 100, cy: 112, rx: 32, ry: 20 },
  { zoneId: "coeur", shape: "circle", cx: 92, cy: 155, r: 13 },
  { zoneId: "muscles", shape: "rect", x: 28, y: 85, width: 24, height: 110, rx: 12 },
  { zoneId: "muscles", shape: "rect", x: 148, y: 85, width: 24, height: 110, rx: 12 },
  { zoneId: "os", shape: "rect", x: 66, y: 222, width: 26, height: 130, rx: 13 },
  { zoneId: "os", shape: "rect", x: 108, y: 222, width: 26, height: 130, rx: 13 },
];
// Torse en arrière-plan (non cliquable, juste le contour).
const TORSO = { x: 58, y: 72, width: 84, height: 150, rx: 26 };

export function CorpsGame({ step }: { step: StepData }) {
  const router = useRouter();

  const benefits = step.gameData?.[0]?.questionData?.benefits ?? [];
  const total = benefits.length;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [wrongZone, setWrongZone] = useState<BodyZoneId | null>(null);

  const primaryColor = step.module.colorPrimary ?? "#E11D48";
  const bottomColor = step.module.colorSecondary ?? "#3f0d16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const pool = benefits.filter((b) => !solvedIds.has(b.id));
  const solvedZones = new Set(benefits.filter((b) => solvedIds.has(b.id)).map((b) => b.zoneId));
  const allSolved = total > 0 && solvedIds.size === total;

  function selectBenefit(id: string) {
    setSelectedId((cur) => (cur === id ? null : id));
    setWrongZone(null);
  }

  function clickZone(zoneId: BodyZoneId) {
    if (!selectedId) return;
    const benefit = benefits.find((b) => b.id === selectedId);
    if (!benefit) return;
    if (benefit.zoneId === zoneId) {
      const nextSolved = new Set(solvedIds);
      nextSolved.add(benefit.id);
      setSolvedIds(nextSolved);
      setSelectedId(null);
      setWrongZone(null);
      const guestStudentId = getGuestStudentId(step.module.slug);
      if (guestStudentId) {
        submitQuizResponse({
          guestStudentId,
          stepId: step.id,
          moduleId: step.module.id,
          userAnswer: { benefitId: benefit.id, zoneId },
          isCorrect: true,
        }).catch(() => {});
      }
    } else {
      setWrongZone(zoneId);
      setTimeout(() => setWrongZone(null), 500);
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
          <svg viewBox="0 0 200 380" className="w-40 md:w-52 shrink-0" role="img" aria-label="Schéma du corps humain">
            <rect {...TORSO} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
            {ON_BODY_SHAPES.map((s, i) => {
              const solved = solvedZones.has(s.zoneId);
              const wrong = wrongZone === s.zoneId;
              const fill = wrong ? "#DC2626" : solved ? "#16A34A" : "rgba(255,255,255,0.9)";
              const commonProps = {
                fill,
                stroke: "#fff",
                strokeWidth: 2,
                onClick: () => clickZone(s.zoneId),
                className: "cursor-pointer transition-colors duration-200",
                style: { opacity: selectedId ? 1 : 0.85 },
              };
              const center =
                s.shape === "rect" ? { x: s.x + s.width / 2, y: s.y + s.height / 2 } : { x: s.cx, y: s.cy };
              return (
                <g key={i}>
                  {s.shape === "circle" && <circle cx={s.cx} cy={s.cy} r={s.r} {...commonProps} />}
                  {s.shape === "ellipse" && <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...commonProps} />}
                  {s.shape === "rect" && <rect x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} {...commonProps} />}
                  {solved && (
                    <text x={center.x} y={center.y + 5} textAnchor="middle" fontSize={16} fill="#fff" className="pointer-events-none select-none">
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

            {/* Zone "corps entier" à part : ambiguë en overlay sur le schéma */}
            <button
              onClick={() => clickZone("corps")}
              disabled={!selectedId}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
              style={{
                background: solvedZones.has("corps") ? "#16A34A" : wrongZone === "corps" ? "#DC2626" : "rgba(255,255,255,0.15)",
                color: "#fff",
                border: "2px dashed rgba(255,255,255,0.5)",
              }}
            >
              {BODY_ZONES.find((z) => z.id === "corps")?.emoji} Corps entier (bienfaits généraux)
              {solvedZones.has("corps") && <Check size={16} />}
            </button>

            {selectedId && (
              <p className="text-white/70 text-xs font-semibold text-center md:text-left">
                Clique la zone du corps où ce bienfait agit
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
