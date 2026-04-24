"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GripVertical } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";

interface PuzzleItem {
  id: string;
  text: string;
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { title: string; items: PuzzleItem[] };
    correctAnswer: { order: string[] };
  }[];
  module: {
    slug: string;
    title: string;
    mascotte?: string | null;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: { id: string; order: number }[];
  };
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function PuzzleGame({ step }: { step: StepData }) {
  const router = useRouter();

  const gameData = step.gameData?.[0];
  const items = gameData?.questionData?.items ?? [];
  const correctOrder = gameData?.correctAnswer?.order ?? [];

  const [cards, setCards] = useState<PuzzleItem[]>(() => shuffle(items));
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);
  const dragIndex = useRef<number | null>(null);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const totalSteps = step.module.steps.length;

  function onDragStart(index: number) {
    dragIndex.current = index;
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const newCards = [...cards];
    const moved = newCards.splice(dragIndex.current, 1)[0];
    if (!moved) return;
    newCards.splice(index, 0, moved);
    dragIndex.current = index;
    setCards(newCards);
  }

  function onDragEnd() {
    dragIndex.current = null;
  }

  function handleSubmit() {
    const userOrder = cards.map((c) => c.id);
    const isCorrect = correctOrder.every((id, i) => id === userOrder[i]);
    setOverlay({ show: true, isCorrect });
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      setCards(shuffle(items));
    } else {
      const nextLevel = step.order + 1;
      const key = `module_level_${step.module.slug}`;
      const stored = parseInt(localStorage.getItem(key) ?? "1", 10);
      if (nextLevel > stored) localStorage.setItem(key, String(nextLevel));
      const isLast = step.order === totalSteps;
      router.push(isLast
        ? `/modules/${step.module.slug}?complete=true`
        : `/modules/${step.module.slug}?from=${step.order}`
      );
    }
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
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
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Reconstitue la scène"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="text-gray-400 font-bold text-sm">
          Étape <span className="text-gray-900 text-xl font-black">{step.order}</span> / {totalSteps}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <p className="text-white/70 text-sm font-semibold">
          Glisse les cartes pour les remettre dans le bon ordre
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xl">
          {cards.map((card, index) => (
            <div
              key={card.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 cursor-grab active:cursor-grabbing select-none transition-all"
              style={{
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              }}
            >
              <GripVertical size={20} className="text-gray-300 shrink-0" />
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0"
                style={{ background: primaryColor }}
              >
                {index + 1}
              </span>
              <p className="text-gray-800 font-medium text-sm leading-relaxed flex-1">
                {card.text}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-2 px-10 py-3.5 rounded-2xl text-white font-black text-base hover:opacity-90 transition-opacity"
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(8px)",
            border: "2px solid rgba(255,255,255,0.5)",
          }}
        >
          Valider mon ordre
        </button>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          overlay?.isCorrect
            ? "Tu as reconstitué la scène dans le bon ordre. Impressionnant !"
            : "L'ordre n'est pas encore le bon. Réfléchis à la logique de chaque étape et réessaie !"
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={overlay?.isCorrect ? "Continuer →" : "Réessayer"}
      />
    </div>
  );
}
