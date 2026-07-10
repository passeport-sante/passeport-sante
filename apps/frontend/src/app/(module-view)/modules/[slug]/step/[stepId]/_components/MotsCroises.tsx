"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";
import { computeCrossword, normalizeLetter, type CrosswordWord } from "@/lib/steps-admin";

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { title?: string; words: CrosswordWord[] };
  }[];
  module: {
    id: string;
    slug: string;
    title: string;
    mascotte?: string | null;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

export function MotsCroises({ step }: { step: StepData }) {
  const router = useRouter();

  const words = step.gameData?.[0]?.questionData?.words ?? [];
  const primaryColor = step.module.colorPrimary ?? "#0891B2";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  // Grille + métadonnées dérivées des mots
  const { rows, cols, cells } = useMemo(() => computeCrossword(words), [words]);

  // Orientations qui passent par chaque case (pour choisir le sens de saisie)
  const cellDirs = useMemo(() => {
    const map = new Map<string, { h: boolean; v: boolean }>();
    for (const w of words) {
      const len = [...w.answer].map(normalizeLetter).join("").length;
      for (let i = 0; i < len; i++) {
        const r = w.dir === "V" ? w.row + i : w.row;
        const c = w.dir === "H" ? w.col + i : w.col;
        const key = `${r},${c}`;
        const cur = map.get(key) ?? { h: false, v: false };
        if (w.dir === "H") cur.h = true; else cur.v = true;
        map.set(key, cur);
      }
    }
    return map;
  }, [words]);

  // Listes de définitions, triées par numéro
  const { across, down } = useMemo(() => {
    const num = (w: CrosswordWord) => cells.get(`${w.row},${w.col}`)?.number ?? 0;
    const a = words.filter((w) => w.dir === "H").map((w) => ({ ...w, n: num(w) })).sort((x, y) => x.n - y.n);
    const d = words.filter((w) => w.dir === "V").map((w) => ({ ...w, n: num(w) })).sort((x, y) => x.n - y.n);
    return { across: a, down: d };
  }, [words, cells]);

  const [entries, setEntries] = useState<Record<string, string>>({});
  const [dir, setDir] = useState<"H" | "V">("H");
  const [verified, setVerified] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const activeKeys = [...cells.keys()];
  const filledCount = activeKeys.filter((k) => entries[k]).length;
  const allFilled = filledCount === activeKeys.length && activeKeys.length > 0;

  function focusCell(r: number, c: number) {
    inputRefs.current[`${r},${c}`]?.focus();
  }

  function handleFocus(r: number, c: number) {
    const d = cellDirs.get(`${r},${c}`);
    if (d?.h && !d.v) setDir("H");
    else if (d?.v && !d.h) setDir("V");
  }

  function handleChange(r: number, c: number, raw: string) {
    if (revealing) return;
    const ch = normalizeLetter(raw.slice(-1));
    setVerified(false);
    setEntries((prev) => ({ ...prev, [`${r},${c}`]: ch }));
    if (ch) {
      const nr = dir === "V" ? r + 1 : r;
      const nc = dir === "H" ? c + 1 : c;
      if (cells.has(`${nr},${nc}`)) focusCell(nr, nc);
    }
  }

  function handleKeyDown(r: number, c: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !entries[`${r},${c}`]) {
      const pr = dir === "V" ? r - 1 : r;
      const pc = dir === "H" ? c - 1 : c;
      if (cells.has(`${pr},${pc}`)) focusCell(pr, pc);
    }
  }

  function cellStyle(key: string): React.CSSProperties {
    const solution = cells.get(key)!.solution;
    if (!verified) {
      return { borderColor: "rgba(0,0,0,0.15)", background: "#fff", color: "#1A1A1A" };
    }
    const val = normalizeLetter(entries[key] ?? "");
    if (val && val === solution) return { borderColor: "#16A34A", background: "#DCFCE7", color: "#166534" };
    return { borderColor: "#DC2626", background: "#FEE2E2", color: "#B91C1C" };
  }

  function handleSubmit() {
    if (revealing || !allFilled) return;
    const correct = activeKeys.every((k) => normalizeLetter(entries[k] ?? "") === cells.get(k)!.solution);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { grid: entries },
        isCorrect: correct,
      }).catch(() => {});
    }
    setVerified(true);
    setRevealing(true);
    setTimeout(() => {
      setRevealing(false);
      setOverlay({ show: true, isCorrect: correct });
    }, 1200);
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      // On garde les lettres correctes, on efface uniquement les fausses
      setEntries((prev) => {
        const next: Record<string, string> = {};
        for (const k of activeKeys) {
          if (normalizeLetter(prev[k] ?? "") === cells.get(k)!.solution) next[k] = prev[k]!;
        }
        return next;
      });
    } else {
      goToNextStep(router, step.module.slug, step.module.steps, step.order);
    }
  }

  const CELL = 40;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
        <Link
          href={`/modules/${step.module.slug}`}
          className="flex items-center gap-3 text-gray-700 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
        </Link>

        <div className="text-center">
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Mots croisés"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 overflow-auto flex flex-col lg:flex-row items-start justify-center gap-8 px-8 py-6">
        {/* Grille */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl shrink-0">
          <div className="overflow-auto">
            <div
              className="relative"
              style={{ width: cols * CELL, height: rows * CELL }}
            >
              {Array.from({ length: rows }).map((_, r) =>
                Array.from({ length: cols }).map((_, c) => {
                  const key = `${r},${c}`;
                  const cell = cells.get(key);
                  if (!cell) return null;
                  return (
                    <div
                      key={key}
                      className="absolute"
                      style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }}
                    >
                      {cell.number && (
                        <span className="absolute top-0 left-0.5 text-[9px] font-bold text-gray-400 leading-none pointer-events-none z-10">
                          {cell.number}
                        </span>
                      )}
                      <input
                        ref={(el) => { inputRefs.current[key] = el; }}
                        value={entries[key] ?? ""}
                        onChange={(e) => handleChange(r, c, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(r, c, e)}
                        onFocus={() => handleFocus(r, c)}
                        disabled={revealing}
                        maxLength={1}
                        autoCapitalize="characters"
                        inputMode="text"
                        className="w-full h-full text-center font-black text-lg uppercase rounded-md border-2 outline-none focus:ring-2 focus:ring-offset-0 transition-colors"
                        style={cellStyle(key)}
                      />
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          {/* Sens de saisie */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-xs text-gray-400 font-semibold">Sens :</span>
            <button
              onClick={() => setDir((d) => (d === "H" ? "V" : "H"))}
              className="px-3 py-1 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: primaryColor }}
            >
              {dir === "H" ? "→ Horizontal" : "↓ Vertical"}
            </button>
            <span className="text-xs text-gray-400 ml-2">{filledCount}/{activeKeys.length}</span>
          </div>
        </div>

        {/* Définitions */}
        <div className="flex flex-col gap-5 w-full max-w-sm text-white">
          {across.length > 0 && (
            <div>
              <p className="font-black uppercase tracking-widest text-xs mb-2 text-white/70">Horizontal</p>
              <ul className="space-y-1.5">
                {across.map((w) => (
                  <li key={w.id} className="text-sm leading-snug">
                    <span className="font-bold">{w.n}.</span> {w.clue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {down.length > 0 && (
            <div>
              <p className="font-black uppercase tracking-widest text-xs mb-2 text-white/70">Vertical</p>
              <ul className="space-y-1.5">
                {down.map((w) => (
                  <li key={w.id} className="text-sm leading-snug">
                    <span className="font-bold">{w.n}.</span> {w.clue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!allFilled || revealing}
            className="mt-2 px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all self-start"
            style={{
              background: allFilled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: `2px solid ${allFilled ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
              opacity: allFilled && !revealing ? 1 : 0.5,
            }}
          >
            Valider la grille
          </button>
        </div>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          overlay?.isCorrect
            ? "Bravo, la grille est complète et correcte !"
            : "Les cases en rouge sont fausses, les vertes sont bonnes et restent en place. Réessaie !"
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={overlay?.isCorrect ? "Continuer →" : "Réessayer"}
      />
    </div>
  );
}
