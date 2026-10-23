"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Backpack } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitKanbanResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string; freeMode?: boolean; minRequired?: number };
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
  // Affiche le vert/rouge par étiquette après validation, tant que l'utilisateur n'a rien redéplacé
  const [verified, setVerified] = useState(false);
  // Laisse le temps de voir les couleurs avant que la modale n'apparaisse
  const [revealing, setRevealing] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const unassigned = items.filter((item) => assignments[item] === null);
  const assignedCount = items.length - unassigned.length;
  const allAssigned = unassigned.length === 0;

  // Mode libre (panier) : pas de bonne/mauvaise réponse, il faut juste un minimum
  // d'items dans la 1ère catégorie (le "sac") pour valider.
  const freeMode = !!step.content?.freeMode;
  const minRequired = step.content?.minRequired ?? 1;
  const bagCategory = categories[0];
  const collectedCount = items.filter((item) => assignments[item] === bagCategory).length;
  const canSubmit = freeMode ? collectedCount >= minRequired : allAssigned;

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
    if (revealing) return;
    const item = e.dataTransfer.getData("text/plain");
    if (!item) return;
    setVerified(false);
    setAssignments((prev) => ({ ...prev, [item]: category }));
    setDragOver(null);
  }

  function onDropPool(e: React.DragEvent) {
    e.preventDefault();
    if (revealing) return;
    const item = e.dataTransfer.getData("text/plain");
    if (!item) return;
    setVerified(false);
    setAssignments((prev) => ({ ...prev, [item]: null }));
    setDragOver(null);
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  function handleSubmit() {
    if (revealing) return;

    // Mode libre : pas de correction, on valide dès que le minimum est atteint.
    if (freeMode) {
      const guestStudentId = getGuestStudentId(step.module.slug);
      if (guestStudentId) {
        submitKanbanResponse({
          guestStudentId,
          stepId: step.id,
          moduleId: step.module.id,
          userAnswer: assignments as Record<string, string>,
          isCorrect: true,
        }).catch(() => {});
      }
      setOverlay({ show: true, isCorrect: true });
      return;
    }

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
    setVerified(true);
    setRevealing(true);
    // On laisse voir la couleur de chaque étiquette avant d'afficher la modale
    setTimeout(() => {
      setRevealing(false);
      setOverlay({ show: true, isCorrect: correct });
    }, 1200);
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      // On renvoie au pool uniquement les étiquettes mal placées ; les bonnes restent (surlignées en vert)
      setAssignments((prev) =>
        Object.fromEntries(
          items.map((item) => [item, prev[item] === correctAnswer[item] ? prev[item]! : null]),
        ),
      );
    } else {
      goToNextStep(router, step.module.slug, step.module.steps, step.order);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
      {/* Navbar */}
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
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Trie les éléments"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-5 px-4 md:px-8 py-4">
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
            {freeMode ? `${collectedCount}/${minRequired} dans ton sac` : `${assignedCount}/${items.length} placés`}
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
            const isBag = freeMode && category === bagCategory;

            return (
              <div
                key={category}
                onDragOver={(e) => onDragOver(e, category)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDropCategory(e, category)}
                className="relative flex-1 min-h-[150px] rounded-3xl p-4 transition-all duration-200 overflow-hidden"
                style={{
                  background: isOver ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.1)",
                  border: `2px dashed ${isOver ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}`,
                  boxShadow: isOver ? "0 0 0 4px rgba(255,255,255,0.08)" : "none",
                  transform: isOver ? "scale(1.02)" : "scale(1)",
                }}
              >
                {/* Filigrane sac à dos : matérialise visuellement le "panier" en mode libre */}
                {isBag && (
                  <Backpack
                    size={96}
                    className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none"
                    style={{ color: "#fff" }}
                  />
                )}
                <p className="relative text-white font-black text-center mb-3 tracking-widest uppercase text-xs flex items-center justify-center gap-1.5">
                  {isBag && <Backpack size={13} />}
                  {category}
                </p>
                <div className="relative flex flex-col gap-2">
                  {categoryItems.map((item) => {
                    const isRight = assignments[item] === correctAnswer[item];
                    const resultStyle = freeMode
                      ? { background: "rgba(255,255,255,0.92)", color: "#1a1a1a" }
                      : verified
                        ? isRight
                          ? { background: "#16A34A", color: "#fff" }
                          : { background: "#DC2626", color: "#fff" }
                        : { background: "rgba(255,255,255,0.92)", color: "#1a1a1a" };
                    return (
                      <div
                        key={item}
                        draggable={!revealing}
                        onDragStart={(e) => onDragStart(e, item)}
                        className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm cursor-grab active:cursor-grabbing select-none flex items-center justify-between transition-transform active:scale-95"
                        style={resultStyle}
                      >
                        <span>{item}</span>
                        <span className="text-xs opacity-30 ml-2">⠿</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || revealing}
          className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
          style={{
            background: canSubmit ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            border: `2px solid ${canSubmit ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"}`,
            opacity: canSubmit && !revealing ? 1 : 0.5,
          }}
        >
          {freeMode ? "Valider mon sac" : "Valider mon tri"}
        </button>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          freeMode
            ? "Ton sac est prêt ! Ce sont toutes de bonnes façons de bouger."
            : overlay?.isCorrect
              ? "Tu as parfaitement classé tous les éléments. Continue comme ça !"
              : "Les étiquettes en rouge sont mal classées, celles en vert sont bonnes et restent en place. Réessaie pour corriger !"
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={overlay?.isCorrect ? "Continuer →" : "Réessayer"}
      />
    </div>
  );
}
