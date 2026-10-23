"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
  explanation?: string;
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { questions: Question[] };
    // Une réponse par question, historiquement une string, désormais un tableau
    // (multi-réponses). Les deux formats sont acceptés en lecture.
    correctAnswer: { answers: Record<string, string | string[]> };
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

// Normalise une réponse correcte (string historique ou string[]) en tableau.
function toIds(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}
// Égalité d'ensembles (tout ou rien) : mêmes ids, quel que soit l'ordre.
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((id) => sb.has(id));
}

export function QuizGame({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const questions = gameData?.questionData?.questions ?? [];
  const correctAnswers = gameData?.correctAnswer?.answers ?? {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);
  const [finished, setFinished] = useState(false);
  const startTimeRef = useRef(Date.now());

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);
  const hasNextStep = step.module.steps.some((s) => s.order > step.order);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Une question à choix multiple attend plusieurs bonnes réponses.
  const currentCorrectIds = currentQuestion ? toIds(correctAnswers[currentQuestion.id]) : [];
  const isMulti = currentCorrectIds.length > 1;

  const score = Object.entries(userAnswers).filter(([qId, ans]) =>
    sameSet(ans, toIds(correctAnswers[qId])),
  ).length;
  const total = questions.length;
  const passed = total > 0 && score / total >= 0.7;

  // Choix multiple → on coche/décoche ; choix unique → on remplace la sélection.
  function handleSelect(optId: string) {
    setSelected((prev) => {
      if (!isMulti) return [optId];
      return prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId];
    });
  }

  function handleConfirm() {
    if (selected.length === 0 || !currentQuestion) return;
    const isCorrect = sameSet(selected, currentCorrectIds);
    const timing = Math.round((Date.now() - startTimeRef.current) / 1000);
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: selected }));

    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { questionId: currentQuestion.id, answer: selected },
        isCorrect,
        timing,
      }).catch(() => {});
    }

    startTimeRef.current = Date.now();
    setOverlay({ show: true, isCorrect });
  }

  function handleOverlayClose() {
    setOverlay(null);
    if (isLastQuestion) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected([]);
    }
  }

  function handleContinue() {
    goToNextStep(router, step.module.slug, step.module.steps, step.order);
  }

  function handleRetry() {
    setCurrentIndex(0);
    setSelected([]);
    setUserAnswers({});
    setFinished(false);
    setOverlay(null);
  }

  const overlayExplanation = currentQuestion?.explanation
    ?? (overlay?.isCorrect
      ? "C'est bien ça ! Tu maîtrises ce sujet."
      : "Ce n'est pas la bonne réponse. Retiens bien cette information pour la prochaine fois !");

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
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Quiz final"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-8 py-6">
        {!finished ? (
          <>
            {/* Barre de progression */}
            <div className="w-full max-w-2xl flex flex-col gap-2">
              <div className="flex justify-between text-white/70 text-xs font-semibold">
                <span>Question {currentIndex + 1} / {total}</span>
                <span>{Math.round((currentIndex / total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20">
                <div
                  className="h-2 rounded-full bg-white transition-all duration-500"
                  style={{ width: `${(currentIndex / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-2xl w-full shadow-xl">
              <p className="text-gray-800 text-lg font-semibold leading-relaxed">
                {currentQuestion?.text}
              </p>
              {isMulti && (
                <p className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: primaryColor }}>
                  Plusieurs réponses possibles
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 w-full max-w-2xl">
              {currentQuestion?.options.map((option) => {
                const isSel = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
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
                    {option.text}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleConfirm}
              disabled={selected.length === 0}
              className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
              style={{
                background: selected.length ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                border: `2px solid ${selected.length ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
                opacity: selected.length ? 1 : 0.5,
              }}
            >
              Valider ma réponse
            </button>
          </>
        ) : (
          /* Écran de score final */
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            {passed ? (
              <>
                <Trophy size={80} className="text-yellow-300" />
                <h2 className="text-4xl font-black text-white">Félicitations !</h2>
              </>
            ) : (
              <>
                <div className="text-6xl">😅</div>
                <h2 className="text-3xl font-black text-white">Presque !</h2>
              </>
            )}

            <p className="text-white/80 text-xl font-semibold">
              {score} / {total} bonnes réponses
            </p>

            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-700"
                style={{
                  width: `${(score / total) * 100}%`,
                  background: passed ? "#fde047" : "rgba(255,255,255,0.6)",
                }}
              />
            </div>

            {!passed && (
              <p className="text-white/60 text-sm">Il faut au moins 70% pour valider.</p>
            )}

            {passed ? (
              <button
                onClick={handleContinue}
                className="px-10 py-3.5 rounded-2xl text-white font-black text-base hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
              >
                {hasNextStep ? "Étape suivante →" : "Terminer le module →"}
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="px-10 py-3.5 rounded-2xl text-white font-black text-base hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
              >
                Réessayer le quiz
              </button>
            )}
          </div>
        )}
      </main>

      {/* Overlay mascotte sur chaque question */}
      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={overlayExplanation}
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={isLastQuestion ? "Voir mon score →" : "Question suivante →"}
      />
    </div>
  );
}
