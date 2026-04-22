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
    questionData: { items: string[]; categories: string[] };
    correctAnswer: Record<string, string>;
  }[];
  module: {
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: { id: string; order: number }[];
  };
}

export function KanbanGame({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const items = gameData?.questionData?.items ?? [];
  const categories = gameData?.questionData?.categories ?? [];
  const correctAnswer = gameData?.correctAnswer ?? {};

  // { item -> category | null }
  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => Object.fromEntries(items.map((item) => [item, null]))
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const totalSteps = step.module.steps.length;

  const unassigned = items.filter((item) => assignments[item] === null);
  const allAssigned = unassigned.length === 0;

  function handleItemClick(item: string) {
    if (submitted) return;
    setSelected((prev) => (prev === item ? null : item));
  }

  function handleCategoryClick(category: string) {
    if (submitted || !selected) return;
    setAssignments((prev) => ({ ...prev, [selected]: category }));
    setSelected(null);
  }

  function handleRemoveFromCategory(item: string) {
    if (submitted) return;
    setAssignments((prev) => ({ ...prev, [item]: null }));
  }

  function handleSubmit() {
    const correct = items.every((item) => assignments[item] === correctAnswer[item]);
    setIsCorrect(correct);
    setSubmitted(true);
  }

  function handleRetry() {
    setAssignments(Object.fromEntries(items.map((item) => [item, null])));
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
            {step.content?.title ?? "Trie les éléments"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape{" "}
          <span className="text-gray-900 text-xl font-black">{step.order}</span>
          {" "}/ {totalSteps}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-6">
        {!submitted ? (
          <>
            <p className="text-white/80 text-sm font-semibold">
              {selected
                ? `"${selected}" sélectionné — clique sur une catégorie`
                : "Clique sur un élément puis sur sa catégorie"}
            </p>

            {/* Items non assignés */}
            {unassigned.length > 0 && (
              <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                {unassigned.map((item) => (
                  <button
                    key={item}
                    onClick={() => handleItemClick(item)}
                    className="px-5 py-3 rounded-2xl font-semibold text-sm transition-all shadow-lg"
                    style={
                      selected === item
                        ? { background: "#fff", color: primaryColor, outline: `3px solid #fff`, transform: "scale(1.05)" }
                        : { background: "rgba(255,255,255,0.9)", color: "#1A1A1A" }
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Colonnes catégories */}
            <div className="flex gap-6 w-full max-w-2xl">
              {categories.map((category) => {
                const categoryItems = items.filter(
                  (item) => assignments[item] === category
                );
                const isTarget = selected !== null;

                return (
                  <div
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="flex-1 min-h-[160px] rounded-3xl p-4 transition-all"
                    style={{
                      background: isTarget
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(255,255,255,0.12)",
                      border: isTarget
                        ? "2px dashed rgba(255,255,255,0.7)"
                        : "2px dashed rgba(255,255,255,0.3)",
                      cursor: isTarget ? "pointer" : "default",
                    }}
                  >
                    <p className="text-white font-black text-center mb-3 tracking-wide uppercase text-sm">
                      {category}
                    </p>
                    <div className="flex flex-col gap-2">
                      {categoryItems.map((item) => (
                        <button
                          key={item}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromCategory(item);
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/90 text-gray-800 font-semibold text-sm text-left hover:bg-white transition-colors"
                        >
                          {item} ✕
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allAssigned}
              className="px-10 py-3 rounded-2xl text-white font-black text-base transition-opacity"
              style={{
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                border: "2px solid rgba(255,255,255,0.4)",
                opacity: allAssigned ? 1 : 0.4,
              }}
            >
              Valider mon tri
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 text-center">
            {isCorrect ? (
              <>
                <CheckCircle size={80} className="text-white" />
                <h2 className="text-3xl font-black text-white">Excellent !</h2>
                <p className="text-white/80 text-lg">Tu as tout bien trié.</p>
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
