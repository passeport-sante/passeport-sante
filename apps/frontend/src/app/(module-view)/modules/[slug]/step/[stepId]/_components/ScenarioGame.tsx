"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface Choice {
  id: string;
  text: string;
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { situation: string; choices: Choice[] };
    correctAnswer: { choiceId: string; explanation?: string };
  }[];
  module: {
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: { id: string; order: number }[];
  };
}

export function ScenarioGame({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const situation = gameData?.questionData?.situation ?? "";
  const choices = gameData?.questionData?.choices ?? [];
  const correctChoiceId = gameData?.correctAnswer?.choiceId ?? "";
  const explanation = gameData?.correctAnswer?.explanation ?? "";

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const totalSteps = step.module.steps.length;

  function handleSubmit() {
    setIsCorrect(selected === correctChoiceId);
    setSubmitted(true);
  }

  function handleRetry() {
    setSelected(null);
    setSubmitted(false);
  }

  function handleContinue() {
    const nextLevel = step.order + 1;
    const key = `module_level_${step.module.slug}`;
    const stored = parseInt(localStorage.getItem(key) ?? "1", 10);
    if (nextLevel > stored) localStorage.setItem(key, String(nextLevel));
    router.push(`/modules/${step.module.slug}`);
  }

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
            {step.content?.title ?? "Que ferais-tu ?"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape{" "}
          <span className="text-gray-900 text-xl font-black">{step.order}</span>
          {" "}/ {totalSteps}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-8 py-6">
        {!submitted ? (
          <>
            {/* Situation card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-2xl w-full shadow-xl">
              <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
                Situation
              </p>
              <p className="text-gray-800 text-lg font-semibold leading-relaxed">
                {situation}
              </p>
            </div>

            {/* Choices */}
            <div className="flex flex-col gap-3 w-full max-w-2xl">
              {choices.map((choice) => {
                const isSelected = selected === choice.id;
                return (
                  <button
                    key={choice.id}
                    onClick={() => setSelected(choice.id)}
                    className="w-full text-left px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
                    style={
                      isSelected
                        ? {
                            background: "#fff",
                            color: primaryColor,
                            outline: `3px solid #fff`,
                            transform: "scale(1.02)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                          }
                        : {
                            background: "rgba(255,255,255,0.15)",
                            color: "#fff",
                            border: "2px solid rgba(255,255,255,0.3)",
                          }
                    }
                  >
                    {choice.text}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="px-10 py-3 rounded-2xl text-white font-black text-base transition-opacity"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                border: "2px solid rgba(255,255,255,0.4)",
                opacity: selected ? 1 : 0.4,
              }}
            >
              Valider mon choix
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center max-w-xl">
            {isCorrect ? (
              <>
                <CheckCircle size={80} className="text-white" />
                <h2 className="text-3xl font-black text-white">Bien joué !</h2>
                {explanation && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5">
                    <p className="text-white/90 text-base leading-relaxed">{explanation}</p>
                  </div>
                )}
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
                {explanation && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-8 py-5">
                    <p className="text-white/90 text-base leading-relaxed">{explanation}</p>
                  </div>
                )}
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
