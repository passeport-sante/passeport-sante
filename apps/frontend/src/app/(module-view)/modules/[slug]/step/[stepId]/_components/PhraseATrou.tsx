"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { phrase: string; options: string[] };
    correctAnswer: { blanks: string[] };
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

export function PhraseATrou({ step }: { step: StepData }) {
  const router = useRouter();

  const allGameData = step.gameData ?? [];
  const total = allGameData.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const gameData = allGameData[currentIndex];
  const phrase = gameData?.questionData?.phrase ?? "";
  const options = gameData?.questionData?.options ?? [];
  const correctBlanks = gameData?.correctAnswer?.blanks ?? [];

  const parts = phrase.split(/_{2,}/);
  const blankCount = parts.length - 1;
  const isLastItem = currentIndex === total - 1;

  const [filled, setFilled] = useState<(string | null)[]>(() => Array(blankCount).fill(null));
  // Résultat trou-par-trou de la dernière validation, visible tant que l'utilisateur n'a rien retouché
  const [verified, setVerified] = useState(false);
  const [lastResult, setLastResult] = useState<boolean[]>([]);
  // Le temps de laisser voir le vert/orange/rouge avant que la modal n'arrive
  const [revealing, setRevealing] = useState(false);

  const usedOptions = filled.filter(Boolean) as string[];
  const nextBlankIndex = filled.findIndex((f) => f === null);
  const allFilled = filled.every((f) => f !== null);
  const filledCount = filled.filter(Boolean).length;

  function handleOptionClick(word: string) {
    if (overlay?.show || revealing) return;
    setVerified(false);
    if (usedOptions.includes(word)) {
      setFilled((prev) => prev.map((f) => (f === word ? null : f)));
      return;
    }
    if (nextBlankIndex === -1) return;
    setFilled((prev) => {
      const next = [...prev];
      next[nextBlankIndex] = word;
      return next;
    });
  }

  function handleBlankClick(index: number) {
    if (overlay?.show || revealing) return;
    setVerified(false);
    setFilled((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function handleSubmit() {
    if (revealing) return;
    const results = filled.map((f, i) => f === correctBlanks[i]);
    const correct = results.every(Boolean);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { blanks: filled.filter((b): b is string => b !== null).join(','), phraseIndex: currentIndex.toString() },        isCorrect: correct,
      }).catch(() => {});
    }
    setLastResult(results);
    setVerified(true);
    setRevealing(true);
    // On laisse le temps de voir la couleur de chaque trou avant d'afficher la modal
    setTimeout(() => {
      setRevealing(false);
      setOverlay({ show: true, isCorrect: correct });
    }, 1200);
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      // On garde les trous déjà corrects (et leur surlignage vert), on ne vide que ceux qui sont faux
      setFilled((prev) => prev.map((f, i) => (f === correctBlanks[i] ? f : null)));
    } else if (!isLastItem) {
      const nextGD = allGameData[currentIndex + 1];
      const nextPhrase = nextGD?.questionData?.phrase ?? "";
      const nextBlankCount = nextPhrase.split(/_{2,}/).length - 1;
      setFilled(Array(nextBlankCount).fill(null));
      setVerified(false);
      setCurrentIndex((i) => i + 1);
    } else {
      goToNextStep(router, step.module.slug, step.module.steps, step.order);
    }
  }

  function blankStyle(i: number) {
    if (!verified) {
      return filled[i]
        ? { borderColor: primaryColor, background: primaryColor, color: "#fff", transform: "scale(1.02)" }
        : { borderColor: "rgba(0,0,0,0.15)", background: "rgba(0,0,0,0.03)", color: "#9ca3af" };
    }
    if (lastResult[i]) {
      return { borderColor: "#16A34A", background: "#16A34A", color: "#fff" };
    }
    // Bon mot, mais pas dans cette case
    if (filled[i] && correctBlanks.includes(filled[i] as string)) {
      return { borderColor: "#F59E0B", background: "#F59E0B", color: "#fff" };
    }
    return filled[i]
      ? { borderColor: "#DC2626", background: "#DC2626", color: "#fff" }
      : { borderColor: "#DC2626", background: "rgba(220,38,38,0.08)", color: "#DC2626" };
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
        <Link
          href={`/modules/${step.module.slug}`}
          className="flex items-center gap-3 text-gray-700 hover:opacity-70 transition-opacity flex-1 basis-0 min-w-9 md:min-w-10"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="hidden sm:inline truncate font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
        </Link>

        <div className="text-center min-w-0">
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Phrase à trou"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-8 py-6">
        {/* Progression inter-phrases */}
        {total > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? "32px" : "12px",
                  background: i < currentIndex ? "#fff" : i === currentIndex ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
            <span className="text-white/60 text-xs font-bold ml-1">
              {currentIndex + 1} / {total}
            </span>
          </div>
        )}

        {/* Progression des blancs */}
        <div className="flex items-center gap-2">
          {Array.from({ length: blankCount }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-2 rounded-full transition-all duration-300"
              style={{ background: filled[i] ? "#fff" : "rgba(255,255,255,0.25)" }}
            />
          ))}
          {blankCount > 0 && (
            <span className="text-white/60 text-xs font-bold ml-2">
              {filledCount}/{blankCount}
            </span>
          )}
        </div>

        {/* Phrase avec blancs */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-2xl w-full shadow-xl">
          <p className="text-gray-800 text-lg font-semibold leading-loose text-center">
            {parts.map((part, i) => (
              <span key={i}>
                {part}
                {i < blankCount && (
                  <button
                    onClick={() => handleBlankClick(i)}
                    className="inline-flex items-center justify-center min-w-[130px] h-10 rounded-xl border-2 px-3 font-black text-sm transition-all mx-1.5"
                    style={blankStyle(i)}
                  >
                    {filled[i] ?? "_ _ _"}
                  </button>
                )}
              </span>
            ))}
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-3 justify-center max-w-xl">
          {options.map((word) => {
            const isUsed = usedOptions.includes(word);
            return (
              <button
                key={word}
                onClick={() => handleOptionClick(word)}
                className="px-6 py-3 rounded-2xl font-bold text-sm transition-all"
                style={
                  isUsed
                    ? {
                        background: "rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.35)",
                        border: "2px solid rgba(255,255,255,0.15)",
                        textDecoration: "line-through",
                        transform: "scale(0.95)",
                      }
                    : {
                        background: "rgba(255,255,255,0.92)",
                        color: "#1A1A1A",
                        border: "2px solid transparent",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }
                }
              >
                {word}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allFilled || revealing}
          className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
          style={{
            background: allFilled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            border: `2px solid ${allFilled ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
            opacity: allFilled ? 1 : 0.5,
          }}
        >
          Valider ma réponse
        </button>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          overlay?.isCorrect
            ? "Tu as complété la phrase correctement. Bon travail !"
            : "Les trous en rouge sont incorrects, les trous en vert sont bons et restent en place. Réessaie pour les corriger !"
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={
          overlay?.isCorrect
            ? isLastItem
              ? "Continuer →"
              : "Phrase suivante →"
            : "Réessayer"
        }
      />
    </div>
  );
}
