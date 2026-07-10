"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

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
    id: string;
    slug: string;
    title: string;
    mascotte?: string | null;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

export function ScenarioGame({ step }: { step: StepData }) {
  const router = useRouter();

  const allGameData = step.gameData ?? [];
  const total = allGameData.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const gameData = allGameData[currentIndex];
  const situation = gameData?.questionData?.situation ?? "";
  const choices = gameData?.questionData?.choices ?? [];
  const correctChoiceId = gameData?.correctAnswer?.choiceId ?? "";
  const explanation = gameData?.correctAnswer?.explanation ?? "";
  const isLastItem = currentIndex === total - 1;

  function handleSubmit() {
    const isCorrect = selected === correctChoiceId;
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { choiceId: selected!, scenarioIndex: String(currentIndex) },
        isCorrect,
      }).catch(() => {});
    }
    setOverlay({ show: true, isCorrect });
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      setSelected(null);
    } else if (!isLastItem) {
      setSelected(null);
      setCurrentIndex((i) => i + 1);
    } else {
      goToNextStep(router, step.module.slug, step.module.steps, step.order);
    }
  }

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
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Que ferais-tu ?"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-8 py-6">
        {/* Progression inter-scénarios */}
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

        {/* Carte situation */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-2xl w-full shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
            Situation
          </p>
          <p className="text-gray-800 text-lg font-semibold leading-relaxed">{situation}</p>
        </div>

        {/* Choix */}
        <div className="flex flex-col gap-3 w-full max-w-2xl">
          {choices.map((choice) => {
            const isSel = selected === choice.id;
            return (
              <button
                key={choice.id}
                onClick={() => setSelected(choice.id)}
                className="w-full text-left px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
                style={
                  isSel
                    ? {
                        background: "#fff",
                        color: primaryColor,
                        outline: `3px solid rgba(255,255,255,0.6)`,
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
          className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
          style={{
            background: selected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            border: `2px solid ${selected ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
            opacity: selected ? 1 : 0.5,
          }}
        >
          Valider mon choix
        </button>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          explanation ||
          (overlay?.isCorrect
            ? "Excellent choix !"
            : "Ce n'était pas la meilleure réaction. Réfléchis à ce qui protège le mieux dans cette situation.")
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={
          overlay?.isCorrect
            ? isLastItem
              ? "Continuer →"
              : "Situation suivante →"
            : "Réessayer"
        }
      />
    </div>
  );
}
