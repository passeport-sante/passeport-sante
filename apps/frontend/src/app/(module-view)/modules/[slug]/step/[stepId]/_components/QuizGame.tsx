"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, XCircle, Trophy } from "lucide-react";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  options: Option[];
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { questions: Question[] };
    correctAnswer: { answers: Record<string, string> };
  }[];
  module: {
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: { id: string; order: number }[];
  };
}

export function QuizGame({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const questions = gameData?.questionData?.questions ?? [];
  const correctAnswers = gameData?.correctAnswer?.answers ?? {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const totalSteps = step.module.steps.length;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const score = Object.entries(userAnswers).filter(
    ([qId, ans]) => correctAnswers[qId] === ans
  ).length;
  const total = questions.length;
  const passed = total > 0 && score / total >= 0.7;

  function handleConfirm() {
    if (!selected || !currentQuestion) return;
    setUserAnswers((prev) => ({ ...prev, [currentQuestion.id]: selected }));
    setConfirmed(true);
  }

  function handleNext() {
    if (isLastQuestion) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setConfirmed(false);
    }
  }

  function handleRetry() {
    setCurrentIndex(0);
    setSelected(null);
    setConfirmed(false);
    setUserAnswers({});
    setFinished(false);
  }

  function handleContinue() {
    const nextLevel = step.order + 1;
    const key = `module_level_${step.module.slug}`;
    const stored = parseInt(localStorage.getItem(key) ?? "1", 10);
    if (nextLevel > stored) localStorage.setItem(key, String(nextLevel));
    router.push(`/modules/${step.module.slug}`);
  }

  const isAnswerCorrect =
    confirmed && currentQuestion && correctAnswers[currentQuestion.id] === selected;

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
            {step.content?.title ?? "Quiz final"}
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
        {!finished ? (
          <>
            {/* Progress bar */}
            <div className="w-full max-w-2xl flex flex-col gap-2">
              <div className="flex justify-between text-white/70 text-xs font-semibold">
                <span>Question {currentIndex + 1} / {total}</span>
                <span>{Math.round(((currentIndex) / total) * 100)}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20">
                <div
                  className="h-2 rounded-full bg-white transition-all"
                  style={{ width: `${(currentIndex / total) * 100}%` }}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-10 py-8 max-w-2xl w-full shadow-xl">
              <p className="text-gray-800 text-lg font-semibold leading-relaxed">
                {currentQuestion?.text}
              </p>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-3 w-full max-w-2xl">
              {currentQuestion?.options.map((option) => {
                const isSelected = selected === option.id;
                const isCorrectOption = correctAnswers[currentQuestion.id] === option.id;

                let style: React.CSSProperties = {
                  background: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.3)",
                };

                if (confirmed) {
                  if (isCorrectOption) {
                    style = { background: "#22c55e", color: "#fff", border: "2px solid #16a34a" };
                  } else if (isSelected && !isCorrectOption) {
                    style = { background: "#ef4444", color: "#fff", border: "2px solid #dc2626" };
                  } else {
                    style = { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", border: "2px solid rgba(255,255,255,0.15)" };
                  }
                } else if (isSelected) {
                  style = { background: "#fff", color: primaryColor, outline: `3px solid #fff`, transform: "scale(1.02)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" };
                }

                return (
                  <button
                    key={option.id}
                    onClick={() => { if (!confirmed) setSelected(option.id); }}
                    className="w-full text-left px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
                    style={style}
                    disabled={confirmed}
                  >
                    {option.text}
                  </button>
                );
              })}
            </div>

            {/* Feedback + action */}
            {confirmed ? (
              <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                <div className="flex items-center gap-2">
                  {isAnswerCorrect
                    ? <CheckCircle size={22} className="text-green-300" />
                    : <XCircle size={22} className="text-red-300" />}
                  <span className="text-white font-bold text-sm">
                    {isAnswerCorrect ? "Bonne réponse !" : "Pas tout à fait..."}
                  </span>
                </div>
                <button
                  onClick={handleNext}
                  className="px-10 py-3 rounded-2xl text-white font-black text-base hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
                >
                  {isLastQuestion ? "Voir mon score →" : "Question suivante →"}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className="px-10 py-3 rounded-2xl text-white font-black text-base transition-opacity"
                style={{
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  border: "2px solid rgba(255,255,255,0.4)",
                  opacity: selected ? 1 : 0.4,
                }}
              >
                Valider ma réponse
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center max-w-md">
            {passed ? (
              <>
                <Trophy size={80} className="text-yellow-300" />
                <h2 className="text-4xl font-black text-white">Félicitations !</h2>
                <p className="text-white/80 text-xl font-semibold">
                  {score} / {total} bonnes réponses
                </p>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-yellow-300 transition-all"
                    style={{ width: `${(score / total) * 100}%` }}
                  />
                </div>
                <p className="text-white/70 text-sm">Tu as terminé ce module avec succès !</p>
                <button
                  onClick={handleContinue}
                  className="px-10 py-3 rounded-2xl text-white font-black text-base hover:opacity-90"
                  style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)" }}
                >
                  Terminer le module →
                </button>
              </>
            ) : (
              <>
                <XCircle size={80} className="text-white/80" />
                <h2 className="text-3xl font-black text-white">Presque...</h2>
                <p className="text-white/80 text-xl font-semibold">
                  {score} / {total} bonnes réponses
                </p>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-white/60 transition-all"
                    style={{ width: `${(score / total) * 100}%` }}
                  />
                </div>
                <p className="text-white/70 text-sm">Il faut au moins 70% pour valider. Réessaie !</p>
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
