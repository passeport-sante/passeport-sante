"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { phrase: string; options: string[] };
    correctAnswer: { blanks: string[] };
  }[];
  module: {
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: { id: string; order: number }[];
  };
}

export function PhraseATrou({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const phrase = gameData?.questionData?.phrase ?? "";
  const options = gameData?.questionData?.options ?? [];
  const correctBlanks = gameData?.correctAnswer?.blanks ?? [];

  const parts = phrase.split("___");
  const blankCount = parts.length - 1;

  const [filled, setFilled] = useState<(string | null)[]>(
    Array(blankCount).fill(null)
  );
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const totalSteps = step.module.steps.length;

  const usedOptions = filled.filter(Boolean) as string[];
  const nextBlankIndex = filled.findIndex((f) => f === null);

  function handleOptionClick(word: string) {
    if (submitted) return;
    if (usedOptions.includes(word)) {
      // Retirer le mot si déjà placé
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
    if (submitted) return;
    setFilled((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  function handleSubmit() {
    const correct = correctBlanks.every((w, i) => w === filled[i]);
    setIsCorrect(correct);
    setSubmitted(true);
  }

  function handleRetry() {
    setFilled(Array(blankCount).fill(null));
    setSubmitted(false);
  }

  function handleContinue() {
    const nextLevel = step.order + 1;
    const key = `module_level_${step.module.slug}`;
    const stored = parseInt(localStorage.getItem(key) ?? "1", 10);
    if (nextLevel > stored) localStorage.setItem(key, String(nextLevel));
    router.push(`/modules/${step.module.slug}`);
  }

  const allFilled = filled.every((f) => f !== null);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
      {/* Navbar */}
      <header className="shrink-0 flex items-center justify-between px-8 py-5 bg-white">
        <Link
          href={`/modules/${step.module.slug}`}
          className="flex items-center gap-3 text-gray-700 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">
            {step.module.title}
          </span>
        </Link>

        <div className="text-center">
          <h1 className="font-black text-xl text-gray-900">
            {step.content?.title ?? "Phrase à trou"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape{" "}
          <span className="text-gray-900 text-xl font-black">{step.order}</span>
          {" "}/ {totalSteps}
        </div>
      </header>

      {/* Zone de jeu */}
      <main className="flex-1 flex flex-col items-center justify-center gap-10 px-8">
        {!submitted ? (
          <>
            {/* Phrase avec blancs */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-2xl w-full shadow-xl">
              <p className="text-gray-800 text-lg font-semibold leading-loose text-center">
                {parts.map((part, i) => (
                  <span key={i}>
                    {part}
                    {i < blankCount && (
                      <button
                        onClick={() => handleBlankClick(i)}
                        className="inline-flex items-center justify-center min-w-[130px] h-9 rounded-xl border-2 px-3 font-bold text-sm transition-all mx-1"
                        style={
                          filled[i]
                            ? { borderColor: primaryColor, background: primaryColor, color: "#fff" }
                            : { borderColor: "rgba(0,0,0,0.2)", background: "rgba(0,0,0,0.04)", color: "#9ca3af" }
                        }
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
                    className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
                    style={
                      isUsed
                        ? { background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.4)", border: "2px solid rgba(255,255,255,0.2)", textDecoration: "line-through" }
                        : { background: "rgba(255,255,255,0.9)", color: "#1A1A1A", border: "2px solid transparent" }
                    }
                  >
                    {word}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allFilled}
              className="px-10 py-3 rounded-2xl text-white font-black text-base transition-opacity"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                border: "2px solid rgba(255,255,255,0.4)",
                opacity: allFilled ? 1 : 0.4,
              }}
            >
              Valider ma réponse
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center">
            {isCorrect ? (
              <>
                <CheckCircle size={80} className="text-white" />
                <h2 className="text-3xl font-black text-white">Parfait !</h2>
                <p className="text-white/80 text-lg">Tu as complété la phrase correctement.</p>
                <button
                  onClick={handleContinue}
                  className="px-10 py-3 rounded-2xl text-white font-black text-base hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
                >
                  Continuer →
                </button>
              </>
            ) : (
              <>
                <XCircle size={80} className="text-white/80" />
                <h2 className="text-3xl font-black text-white">Pas tout à fait...</h2>
                <p className="text-white/80 text-lg">Essaie encore !</p>
                <button
                  onClick={handleRetry}
                  className="px-10 py-3 rounded-2xl text-white font-black text-base hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
                >
                  Réessayer
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
