"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitKanbanResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { items: string[]; categories: string[] };
    correctAnswer: Record<string, string>;
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

export function KanbanGame({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const items = gameData?.questionData?.items ?? [];
  const categories = gameData?.questionData?.categories ?? [];
  const correctAnswer = gameData?.correctAnswer ?? {};

  const [assignments, setAssignments] = useState<Record<string, string | null>>(
    () => Object.fromEntries(items.map((item) => [item, null]))
  );
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null); // "pool" | category name

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const unassigned = items.filter((item) => assignments[item] === null);
  const assignedCount = items.length - unassigned.length;
  const allAssigned = unassigned.length === 0;

  // ── Drag handlers ────────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, item: string) {
    e.dataTransfer.setData("text/plain", item);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, zone: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(zone);
  }

  function onDragLeave() {
    setDragOver(null);
  }

  function onDropCategory(e: React.DragEvent, category: string) {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (!item) return;
    setAssignments((prev) => ({ ...prev, [item]: category }));
    setDragOver(null);
  }

  function onDropPool(e: React.DragEvent) {
    e.preventDefault();
    const item = e.dataTransfer.getData("text/plain");
    if (!item) return;
    setAssignments((prev) => ({ ...prev, [item]: null }));
    setDragOver(null);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleSubmit() {
    const correct = items.every((item) => assignments[item] === correctAnswer[item]);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitKanbanResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: assignments as Record<string, string>,
        isCorrect: correct,
      }).catch(() => {});
    }
    setOverlay({ show: true, isCorrect: correct });
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      setAssignments(Object.fromEntries(items.map((item) => [item, null])));
    } else {
      goToNextStep(router, step.module.slug, step.module.steps, step.order);
    }
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
          <span className="font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
        </Link>

        <div className="text-center">
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Trie les éléments"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-4">
        {/* Progression dots */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {items.map((item) => (
              <div
                key={item}
                className="w-3 h-3 rounded-full transition-all duration-300"
                style={{ background: assignments[item] !== null ? "#fff" : "rgba(255,255,255,0.3)" }}
              />
            ))}
          </div>
          <span className="text-white/70 text-xs font-bold">
            {assignedCount}/{items.length} placés
          </span>
        </div>

        {/* Pool */}
        <div
          onDragOver={(e) => onDragOver(e, "pool")}
          onDragLeave={onDragLeave}
          onDrop={onDropPool}
          className="flex flex-wrap gap-3 justify-center max-w-2xl min-h-[72px] w-full rounded-2xl p-3 transition-all duration-200"
          style={{
            background: dragOver === "pool" ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
            border: `2px dashed ${dragOver === "pool" ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)"}`,
            boxShadow: dragOver === "pool" ? "0 0 0 4px rgba(255,255,255,0.08)" : "none",
          }}
        >
          {unassigned.length === 0 ? (
            <p className="text-white/30 text-sm font-semibold self-center">
              Tous les éléments sont placés
            </p>
          ) : (
            unassigned.map((item) => (
              <div
                key={item}
                draggable
                onDragStart={(e) => onDragStart(e, item)}
                className="px-5 py-3 rounded-2xl font-bold text-sm cursor-grab active:cursor-grabbing select-none shadow-md transition-transform active:scale-95"
                style={{ background: "rgba(255,255,255,0.95)", color: "#1A1A1A" }}
              >
                {item}
              </div>
            ))
          )}
        </div>

        <p className="text-white/50 text-xs font-semibold tracking-wide">
          ↓ Glisse vers une catégorie
        </p>

        {/* Colonnes catégories */}
        <div className="flex gap-4 w-full max-w-2xl">
          {categories.map((category) => {
            const categoryItems = items.filter((item) => assignments[item] === category);
            const isOver = dragOver === category;

            return (
              <div
                key={category}
                onDragOver={(e) => onDragOver(e, category)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDropCategory(e, category)}
                className="flex-1 min-h-[150px] rounded-3xl p-4 transition-all duration-200"
                style={{
                  background: isOver ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)",
                  border: `2px dashed ${isOver ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}`,
                  boxShadow: isOver ? "0 0 0 4px rgba(255,255,255,0.08)" : "none",
                  transform: isOver ? "scale(1.02)" : "scale(1)",
                }}
              >
                <p className="text-white font-black text-center mb-3 tracking-widest uppercase text-xs">
                  {category}
                </p>
                <div className="flex flex-col gap-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm cursor-grab active:cursor-grabbing select-none flex items-center justify-between transition-transform active:scale-95"
                      style={{ background: "rgba(255,255,255,0.92)", color: "#1a1a1a" }}
                    >
                      <span>{item}</span>
                      <span className="text-xs opacity-30 ml-2">⠿</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allAssigned}
          className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
          style={{
            background: allAssigned ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            border: `2px solid ${allAssigned ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
            opacity: allAssigned ? 1 : 0.5,
          }}
        >
          Valider mon tri
        </button>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          overlay?.isCorrect
            ? "Tu as parfaitement classé tous les éléments. Continue comme ça !"
            : "Certains éléments ne sont pas dans la bonne catégorie. Relis bien chaque colonne et réessaie !"
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={overlay?.isCorrect ? "Continuer →" : "Réessayer"}
      />
    </div>
  );
}
