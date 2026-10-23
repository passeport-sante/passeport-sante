"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

type Tone = "good" | "neutral" | "bad";
interface Choice { id: string; text: string; goto: string }
interface Scene { id: string; text: string; choices: Choice[] }
interface Ending { id: string; text: string; tone: Tone }

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string };
  gameData: {
    questionData: { startId: string; scenes: Scene[]; endings: Ending[] };
    correctAnswer: { bestEndingId?: string };
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

const TONE: Record<Tone, { emoji: string; title: string; badge: string }> = {
  good: { emoji: "🛡️", title: "Bravo !", badge: "Bonne fin" },
  neutral: { emoji: "🤔", title: "Pas mal…", badge: "Fin neutre" },
  bad: { emoji: "💭", title: "Aïe…", badge: "À éviter" },
};

export function DialogueGame({ step }: { step: StepData }) {
  const router = useRouter();

  const data = step.gameData?.[0]?.questionData;
  const scenes = useMemo(() => data?.scenes ?? [], [data]);
  const endings = useMemo(() => data?.endings ?? [], [data]);
  const sceneById = useMemo(() => new Map(scenes.map((s) => [s.id, s])), [scenes]);
  const endingById = useMemo(() => new Map(endings.map((e) => [e.id, e])), [endings]);

  const [currentId, setCurrentId] = useState(data?.startId ?? scenes[0]?.id ?? "");
  const [steps, setSteps] = useState(0); // nombre de choix faits (pour la barre)

  const primaryColor = step.module.colorPrimary ?? "#4F46E5";
  const bottomColor = step.module.colorSecondary ?? "#1e1b4b";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const scene = sceneById.get(currentId);
  const ending = endingById.get(currentId);

  function choose(c: Choice) {
    setSteps((n) => n + 1);
    const target = c.goto;
    // Sécurité : si la destination n'existe plus, on tombe sur la 1ʳᵉ fin.
    if (sceneById.has(target) || endingById.has(target)) {
      setCurrentId(target);
    } else {
      setCurrentId(endings[0]?.id ?? "");
    }
    if (endingById.has(target)) recordEnding(target);
  }

  function recordEnding(endingId: string) {
    const e = endingById.get(endingId);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId && e) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { endingId, tone: e.tone },
        isCorrect: e.tone === "good",
      }).catch(() => {});
    }
  }

  function replay() {
    setCurrentId(data?.startId ?? scenes[0]?.id ?? "");
    setSteps(0);
  }

  const Header = (
    <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
      <Link
        href={`/modules/${step.module.slug}`}
        className="flex items-center gap-2 md:gap-3 text-gray-700 hover:opacity-70 transition-opacity flex-1 basis-0 min-w-9 md:min-w-10"
      >
        <div className="w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <ArrowLeft size={18} />
        </div>
        <span className="hidden sm:inline truncate font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
      </Link>
      <div className="text-center min-w-0">
        <h1 className="font-black text-base md:text-xl text-gray-900 truncate">
          {step.content?.title ?? "L'histoire dont tu es le héros"}
        </h1>
        <p className="hidden sm:block text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
      </div>
      <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
        Étape <span className="text-gray-900 text-lg md:text-xl font-black">{gameLevel}</span> / {totalGameLevels}
      </div>
    </header>
  );

  // ── Écran de fin ────────────────────────────────────────────────────────────
  if (ending) {
    const t = TONE[ending.tone];
    return (
      <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-8 text-center">
          <div className="text-7xl">{t.emoji}</div>
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-white/20 text-white border border-white/40">
            {t.badge}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">{t.title}</h2>
          <p className="text-white/90 text-base md:text-lg font-semibold max-w-md leading-relaxed">{ending.text}</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <button
              onClick={replay}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.4)" }}
            >
              <RotateCcw size={16} /> Rejouer
            </button>
            <button
              onClick={() => goToNextStep(router, step.module.slug, step.module.steps, step.order)}
              className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all hover:scale-105 active:scale-95"
              style={{ background: "rgba(255,255,255,0.25)", border: "2px solid rgba(255,255,255,0.6)" }}
            >
              Continuer →
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── Écran de scène ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}>
      {Header}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-8 py-6">
        {steps > 0 && (
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">
            {steps} choix fait{steps > 1 ? "s" : ""}
          </p>
        )}

        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 md:px-10 py-6 md:py-8 max-w-2xl w-full shadow-xl">
          <p className="text-gray-800 text-lg font-semibold leading-relaxed whitespace-pre-wrap">
            {scene?.text ?? "Cette histoire n'a pas encore de contenu."}
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-2xl">
          {scene?.choices.map((c) => (
            <button
              key={c.id}
              onClick={() => choose(c)}
              className="w-full text-left px-5 md:px-6 py-4 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-100"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "2px solid rgba(255,255,255,0.3)" }}
            >
              {c.text}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
