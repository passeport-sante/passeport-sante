"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, X } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

type Answer = "vrai" | "faux";
interface Card { id: string; text: string; answer: Answer; explanation?: string }

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: { questionData: { cards: Card[] } }[];
  module: {
    id: string;
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

const THRESHOLD = 110; // px de balayage pour valider

export function SwipeGame({ step }: { step: StepData }) {
  const router = useRouter();

  const cards = step.gameData?.[0]?.questionData?.cards ?? [];
  const total = cards.length;

  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState<null | { choice: Answer; correct: boolean }>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [dragX, setDragX] = useState(0);

  const dragRef = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });

  const primaryColor = step.module.colorPrimary ?? "#0EA5E9";
  const bottomColor = step.module.colorSecondary ?? "#0c2a3a";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const card = cards[index];
  const isLast = index === total - 1;

  function answer(choice: Answer) {
    if (answered || !card) return;
    const correct = card.answer === choice;
    setDragX(choice === "vrai" ? 600 : -600);
    setAnswered({ choice, correct });
    if (correct) setScore((s) => s + 1);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { cardId: card.id, choice },
        isCorrect: correct,
      }).catch(() => {});
    }
  }

  function next() {
    setDragX(0);
    setAnswered(null);
    if (isLast) setFinished(true);
    else setIndex((i) => i + 1);
  }

  // ── Balayage (pointer) ──────────────────────────────────────────────────────
  function onPointerDown(e: React.PointerEvent) {
    if (answered) return;
    dragRef.current = { startX: e.clientX, active: true };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.active) return;
    setDragX(e.clientX - dragRef.current.startX);
  }
  function onPointerUp() {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    if (dragX > THRESHOLD) answer("vrai");
    else if (dragX < -THRESHOLD) answer("faux");
    else setDragX(0);
  }

  const Header = (
    <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
      <Link href={`/modules/${step.module.slug}`} className="flex items-center gap-2 md:gap-3 text-gray-700 hover:opacity-70 transition-opacity shrink-0">
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <ArrowLeft size={18} />
        </div>
        <span className="hidden sm:inline font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
      </Link>
      <div className="text-center min-w-0">
        <h1 className="font-black text-base md:text-xl text-gray-900 truncate">{step.content?.title ?? "Vrai ou Faux ?"}</h1>
        <p className="hidden sm:block text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
      </div>
      <div className="text-gray-400 font-bold text-sm shrink-0">
        Étape <span className="text-gray-900 text-lg md:text-xl font-black">{gameLevel}</span> / {totalGameLevels}
      </div>
    </header>
  );

  // ── Écran final ─────────────────────────────────────────────────────────────
  if (finished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-8 text-center">
          <div className="text-7xl">{pct >= 70 ? "🎉" : "💪"}</div>
          <h2 className="text-2xl md:text-3xl font-black text-white">{score} / {total} bonnes réponses</h2>
          <div className="w-full max-w-md h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <button
            onClick={() => goToNextStep(router, step.module.slug, step.module.steps, step.order)}
            className="mt-2 px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95"
            style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)" }}
          >
            Continuer →
          </button>
        </main>
      </div>
    );
  }

  const tilt = Math.max(-15, Math.min(15, dragX / 12));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
      {Header}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-6">
        {/* Progression */}
        <div className="flex items-center gap-2">
          {cards.map((_, i) => (
            <div key={i} className="h-2 rounded-full transition-all duration-300" style={{ width: i === index ? "28px" : "10px", background: i < index ? "#fff" : i === index ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.25)" }} />
          ))}
          <span className="text-white/60 text-xs font-bold ml-1">{index + 1} / {total}</span>
        </div>

        {/* Carte */}
        <div className="relative w-full max-w-md h-64 select-none" style={{ touchAction: "none" }}>
          {/* Indices gauche/droite */}
          <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
            <span className="text-white/40 text-xs font-black uppercase -rotate-90 tracking-widest">← Faux</span>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none">
            <span className="text-white/40 text-xs font-black uppercase rotate-90 tracking-widest">Vrai →</span>
          </div>

          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="absolute inset-x-6 top-0 bottom-0 bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center p-6 text-center cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateX(${dragX}px) rotate(${tilt}deg)`,
              transition: dragRef.current.active ? "none" : "transform 0.35s ease",
              borderTop: answered ? `6px solid ${answered.correct ? "#16A34A" : "#DC2626"}` : "6px solid transparent",
            }}
          >
            {/* Feedback de balayage */}
            {!answered && dragX > 40 && <span className="absolute top-3 right-4 text-emerald-500 font-black">VRAI</span>}
            {!answered && dragX < -40 && <span className="absolute top-3 left-4 text-red-500 font-black">FAUX</span>}
            <p className="text-gray-800 text-lg md:text-xl font-bold leading-relaxed">{card?.text}</p>
          </div>
        </div>

        {/* Feedback après réponse */}
        {answered ? (
          <div className="w-full max-w-md bg-white/95 rounded-2xl px-6 py-4 shadow-lg text-center space-y-1">
            <p className="font-black text-sm" style={{ color: answered.correct ? "#16A34A" : "#DC2626" }}>
              {answered.correct ? "Bonne réponse ✓" : `Raté — c'était « ${card?.answer === "vrai" ? "Vrai" : "Faux"} »`}
            </p>
            {card?.explanation && <p className="text-gray-600 text-sm leading-relaxed">{card.explanation}</p>}
            <button
              onClick={next}
              className="mt-2 px-8 py-2.5 rounded-xl text-white font-black text-sm"
              style={{ background: primaryColor }}
            >
              {isLast ? "Voir mon score →" : "Suivant →"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <button
              onClick={() => answer("faux")}
              className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
              aria-label="Faux"
            >
              <X size={28} strokeWidth={3} />
            </button>
            <button
              onClick={() => answer("vrai")}
              className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
              aria-label="Vrai"
            >
              <Check size={28} strokeWidth={3} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
