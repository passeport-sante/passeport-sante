"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GripVertical, ImageOff } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitPuzzleResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

interface Scene {
  id: string;
  text: string;
  imageUrl?: string;
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { title: string; items: Scene[] };
    correctAnswer: { order: string[] };
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

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function HistoireGame({ step }: { step: StepData }) {
  const router = useRouter();

  const allGameData = step.gameData ?? [];
  const total = allGameData.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);
  const dragIndex = useRef<number | null>(null);

  const primaryColor = step.module.colorPrimary ?? "#9333EA";
  const bottomColor = step.module.colorSecondary ?? "#3B0764";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const gameData = allGameData[currentIndex];
  const scenes = gameData?.questionData?.items ?? [];
  const correctOrder = gameData?.correctAnswer?.order ?? [];
  const isLastStory = currentIndex === total - 1;

  const [cards, setCards] = useState<Scene[]>(() => shuffle(scenes));

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

    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitPuzzleResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { order: userOrder, storyIndex: currentIndex },
        isCorrect,
      }).catch(() => {});
    }

    setOverlay({ show: true, isCorrect });
  }

  function handleOverlayClose() {
    const isCorrect = overlay?.isCorrect ?? false;
    setOverlay(null);
    if (!isCorrect) {
      setCards(shuffle(scenes));
    } else if (!isLastStory) {
      const nextScenes = allGameData[currentIndex + 1]?.questionData?.items ?? [];
      setCards(shuffle(nextScenes));
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
          className="flex items-center gap-3 text-gray-700 hover:opacity-70 transition-opacity flex-1 basis-0 min-w-0"
        >
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
        </Link>

        <div className="text-center min-w-0">
          <h1 className="font-black text-xl text-gray-900">{step.content?.title ?? "Raconte l'histoire"}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
        </div>

        <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
          Étape <span className="text-gray-900 text-xl font-black">{gameLevel}</span> / {totalGameLevels}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-6">
        {/* Progression inter-histoires */}
        {total > 1 && (
          <div className="flex items-center gap-2">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === currentIndex ? "32px" : "12px",
                  background:
                    i < currentIndex ? "#fff" : i === currentIndex ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
            <span className="text-white/60 text-xs font-bold ml-1">
              {currentIndex + 1} / {total}
            </span>
          </div>
        )}

        {gameData?.questionData?.title && (
          <p className="text-white/80 text-sm font-semibold text-center max-w-xl">
            {gameData.questionData.title}
          </p>
        )}

        <p className="text-white/50 text-xs font-semibold">
          Glisse les vignettes pour reconstituer l'histoire
        </p>

        {/* Vignettes — en ligne (chronologie) dès qu'il y a la place, empilées sinon */}
        <div className="flex flex-col md:flex-row md:flex-wrap items-stretch justify-center gap-3 w-full max-w-5xl">
          {cards.map((card, index) => (
            <div
              key={card.id}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragEnd={onDragEnd}
              className="flex md:flex-col items-center md:items-stretch gap-3 md:gap-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none transition-all md:w-[200px]"
              style={{ background: "rgba(255,255,255,0.92)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}
            >
              {/* Image */}
              <div className="relative w-24 h-24 md:w-full md:h-32 shrink-0 bg-gray-100 flex items-center justify-center">
                {card.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <ImageOff size={22} className="text-gray-300" />
                )}
                <span
                  className="absolute top-1.5 left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black"
                  style={{ background: primaryColor }}
                >
                  {index + 1}
                </span>
              </div>

              {/* Texte */}
              <div className="flex items-center gap-2 flex-1 px-3 py-3">
                <GripVertical size={18} className="text-gray-300 shrink-0" />
                <p className="text-gray-800 font-medium text-sm leading-relaxed">{card.text}</p>
              </div>
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
          Valider mon histoire
        </button>
      </main>

      <FeedbackOverlay
        show={overlay?.show ?? false}
        isCorrect={overlay?.isCorrect ?? false}
        explanation={
          overlay?.isCorrect
            ? "Tu as reconstitué l'histoire dans le bon ordre. Bravo !"
            : "L'histoire n'est pas encore dans le bon ordre. Observe bien les images et réessaie !"
        }
        mascotte={step.module.mascotte}
        primaryColor={primaryColor}
        onClose={handleOverlayClose}
        closeLabel={overlay?.isCorrect ? (isLastStory ? "Continuer →" : "Histoire suivante →") : "Réessayer"}
      />
    </div>
  );
}
