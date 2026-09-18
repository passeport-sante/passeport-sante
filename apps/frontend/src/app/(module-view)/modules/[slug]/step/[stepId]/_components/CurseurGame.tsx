"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";
import { curseurDisplayValue, curseurPercentToReal, curseurStepPercent } from "@/lib/steps-admin";

type Mode = "opinion" | "estimation" | "precis";
interface Item {
  id: string;
  text: string;
  leftLabel: string;
  rightLabel: string;
  mode: Mode;
  target?: number;
  tolerance?: number;
  valueMin?: number;
  valueMax?: number;
  unit?: string;
  step?: number;
  explanation?: string;
}

// Ticks de la règle graduée (mode "precis") — positions en % le long de la piste.
// Plafonné pour éviter un mur de traits sur une échelle très large.
function preciseTicks(item: Item): number[] {
  const min = item.valueMin ?? 0;
  const max = item.valueMax ?? 100;
  const step = item.step ?? 1;
  const range = max - min;
  if (range <= 0 || step <= 0) return [];
  const count = Math.round(range / step) + 1;
  if (count > 41) return [];
  return Array.from({ length: count }, (_, i) => (i * step * 100) / range);
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: { questionData: { items: Item[] } }[];
  module: {
    id: string;
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

export function CurseurGame({ step }: { step: StepData }) {
  const router = useRouter();

  const items = step.gameData?.[0]?.questionData?.items ?? [];
  const total = items.length;
  const scoredCount = items.filter((it) => it.mode !== "opinion").length;

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState(50);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#0D9488";
  const bottomColor = step.module.colorSecondary ?? "#0f2e2b";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const item = items[index];
  const isLast = index === total - 1;
  const isEstimation = item?.mode === "estimation";
  const isPrecis = item?.mode === "precis";

  // Estimation : une zone acceptée (cible ± tolérance, en %).
  const target = item?.target ?? 50;
  const tol = item?.tolerance ?? 15;
  const zoneMin = Math.max(0, target - tol);
  const zoneMax = Math.min(100, target + tol);

  // Precis : une échelle graduée, une seule valeur réelle exacte attendue —
  // on compare après avoir calé sur le pas, pour absorber le flottant du slider.
  const preciseTarget = item?.target ?? item?.valueMin ?? 0;
  const preciseTargetPct = item ? (preciseTarget - (item.valueMin ?? 0)) / ((item.valueMax ?? 100) - (item.valueMin ?? 0) || 1) * 100 : 0;
  const preciseSelectedReal = item
    ? (() => {
        const min = item.valueMin ?? 0;
        const step = item.step ?? 1;
        const real = curseurPercentToReal(item, value);
        return Math.round((real - min) / step) * step + min;
      })()
    : 0;
  const preciseCorrect = isPrecis && Math.abs(preciseSelectedReal - preciseTarget) < (item?.step ?? 1) / 2;

  const correct = isEstimation ? value >= zoneMin && value <= zoneMax : isPrecis ? preciseCorrect : false;

  function validate() {
    if (answered || !item) return;
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { itemId: item.id, value, mode: item.mode },
        isCorrect: item.mode === "opinion" ? true : correct,
      }).catch(() => {});
    }
  }

  function next() {
    if (isLast) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setValue(50);
      setAnswered(false);
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
        <h1 className="font-black text-base md:text-xl text-gray-900 truncate">{step.content?.title ?? "Place le curseur"}</h1>
        <p className="hidden sm:block text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
      </div>
      <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
        Étape <span className="text-gray-900 text-lg md:text-xl font-black">{gameLevel}</span> / {totalGameLevels}
      </div>
    </header>
  );

  // ── Écran final ─────────────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-8 text-center">
          <div className="text-7xl">{scoredCount > 0 ? "🎯" : "💬"}</div>
          <h2 className="text-2xl md:text-3xl font-black text-white">
            {scoredCount > 0 ? `${score} / ${scoredCount} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""}` : "Merci pour tes réponses !"}
          </h2>
          <button
            onClick={() => goToNextStep(router, step.module.slug, step.module.steps, step.order)}
            className="mt-2 px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)" }}
          >
            Continuer →
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
      {Header}
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4 md:px-8 py-6">
        {/* Progression */}
        <div className="flex items-center gap-2">
          {items.map((_, i) => (
            <div key={i} className="h-2 rounded-full transition-all duration-300" style={{ width: i === index ? "28px" : "10px", background: i < index ? "#fff" : i === index ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }} />
          ))}
          <span className="text-white/60 text-xs font-bold ml-1">{index + 1} / {total}</span>
        </div>

        {/* Affirmation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 md:px-10 py-6 md:py-8 max-w-2xl w-full shadow-xl text-center">
          {isEstimation && (
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Estimation</p>
          )}
          {isPrecis && (
            <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: primaryColor }}>Échelle précise — une seule bonne réponse</p>
          )}
          <p className="text-gray-800 text-lg font-semibold leading-relaxed">{item?.text}</p>
        </div>

        {/* Curseur */}
        <div className="w-full max-w-xl space-y-3">
          <div className="flex justify-between text-white/80 text-sm font-semibold">
            <span>{item?.leftLabel}</span>
            <span>{item?.rightLabel}</span>
          </div>

          {!answered ? (
            <div className="relative pt-8">
              {/* Bulle de valeur, suit le pouce : sans elle on glisse "à l'aveugle". */}
              <div
                className="absolute -top-1 -translate-x-1/2 px-2.5 py-1 rounded-lg text-xs font-black shadow whitespace-nowrap"
                style={{ left: `${value}%`, background: "#fff", color: primaryColor }}
              >
                {item ? curseurDisplayValue(item, value) : value}
              </div>
              {/* Graduations de la règle (mode précis uniquement) */}
              {isPrecis && item && (
                <div className="relative h-2 mb-1">
                  {preciseTicks(item).map((pct, i) => (
                    <div
                      key={i}
                      className="absolute top-0 w-px h-2 bg-white/40"
                      style={{ left: `${pct}%` }}
                    />
                  ))}
                </div>
              )}
              <input
                type="range"
                min={0}
                max={100}
                step={isPrecis && item ? curseurStepPercent(item) : 1}
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full h-3 cursor-pointer"
                style={{ accentColor: "#fff" }}
              />
            </div>
          ) : (
            // Piste statique révélée : zone/valeur correcte + marqueur de l'élève.
            <div className="relative pt-8">
              <div
                className="absolute -top-1 -translate-x-1/2 px-2.5 py-1 rounded-lg text-xs font-black shadow whitespace-nowrap"
                style={{ left: `${value}%`, background: "#fff", color: isEstimation || isPrecis ? (correct ? "#16A34A" : "#DC2626") : primaryColor }}
              >
                {item ? curseurDisplayValue(item, value) : value}
              </div>
              {isPrecis && item && (
                <div className="relative h-2 mb-1">
                  {preciseTicks(item).map((pct, i) => (
                    <div key={i} className="absolute top-0 w-px h-2 bg-white/40" style={{ left: `${pct}%` }} />
                  ))}
                </div>
              )}
              <div className="relative h-3 rounded-full bg-white/25">
                {isEstimation && (
                  <div
                    className="absolute h-full rounded-full"
                    style={{ left: `${zoneMin}%`, width: `${zoneMax - zoneMin}%`, background: "rgba(255,255,255,0.85)" }}
                  />
                )}
                {isPrecis && !correct && (
                  // La bonne réponse, isolée (pas de zone : une seule valeur compte).
                  <div
                    className="absolute -top-1.5 w-6 h-6 rounded-full border-2 border-white"
                    style={{ left: `calc(${preciseTargetPct}% - 12px)`, background: "#16A34A" }}
                  />
                )}
                <div
                  className="absolute -top-1.5 w-6 h-6 rounded-full border-2 border-white shadow"
                  style={{ left: `calc(${value}% - 12px)`, background: isEstimation || isPrecis ? (correct ? "#16A34A" : "#DC2626") : primaryColor }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Feedback / action */}
        {answered ? (
          <div className="w-full max-w-xl bg-white/95 rounded-2xl px-6 py-4 shadow-lg text-center space-y-1">
            {isEstimation ? (
              <p className="font-black text-sm" style={{ color: correct ? "#16A34A" : "#DC2626" }}>
                {correct
                  ? "Dans la bonne zone ✓"
                  : `À côté — la bonne réponse est autour de ${item ? curseurDisplayValue(item, target) : target}`}
              </p>
            ) : isPrecis ? (
              <p className="font-black text-sm" style={{ color: correct ? "#16A34A" : "#DC2626" }}>
                {correct
                  ? "Exact ✓"
                  : `La bonne réponse exacte est ${item?.target ?? preciseTarget} ${item?.unit ?? ""}`}
              </p>
            ) : (
              <p className="font-black text-sm" style={{ color: primaryColor }}>Merci, ton avis compte 💬</p>
            )}
            {item?.explanation && <p className="text-gray-600 text-sm leading-relaxed">{item.explanation}</p>}
            <button onClick={next} className="mt-2 px-8 py-2.5 rounded-xl text-white font-black text-sm" style={{ background: primaryColor }}>
              {isLast ? "Terminer →" : "Suivant →"}
            </button>
          </div>
        ) : (
          <button
            onClick={validate}
            className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
            style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.6)" }}
          >
            Valider
          </button>
        )}
      </main>
    </div>
  );
}
