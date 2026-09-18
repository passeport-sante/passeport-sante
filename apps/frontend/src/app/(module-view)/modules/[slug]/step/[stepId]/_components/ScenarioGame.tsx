"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { FeedbackOverlay } from "@/components/modules/FeedbackOverlay";
import { getGuestStudentId, submitQuizResponse } from "@/lib/modules";
import { goToNextStep, gameProgress, type FlowStep } from "@/lib/step-flow";

interface Choice {
  id: string;
  text: string;
  points?: number;
}

interface StepData {
  id: string;
  order: number;
  content: { title: string; instructions: string; shieldMode?: boolean };
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
  const shieldMode = !!step.content?.shieldMode;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<{ show: boolean; isCorrect: boolean } | null>(null);

  // Mode bouclier
  const [shieldPoints, setShieldPoints] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const primaryColor = step.module.colorPrimary ?? "#16A34A";
  const bottomColor = step.module.colorSecondary ?? "#052e16";
  const { level: gameLevel, total: totalGameLevels } = gameProgress(step.module.steps, step.order);

  const gameData = allGameData[currentIndex];
  const situation = gameData?.questionData?.situation ?? "";
  const choices = gameData?.questionData?.choices ?? [];
  const correctChoiceId = gameData?.correctAnswer?.choiceId ?? "";
  const explanation = gameData?.correctAnswer?.explanation ?? "";
  const isLastItem = currentIndex === total - 1;

  const pts = (c: Choice) => c.points ?? 0;
  const scenarioMax = (i: number) =>
    Math.max(0, ...(allGameData[i]?.questionData?.choices ?? []).map(pts));
  const totalMax = useMemo(
    () => Math.max(1, allGameData.reduce((s, _gd, i) => s + scenarioMax(i), 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total],
  );
  const shieldPct = Math.max(0, Math.min(100, Math.round((shieldPoints / totalMax) * 100)));

  // ── Mode normal ──────────────────────────────────────────────────────────────
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

  // ── Mode bouclier ────────────────────────────────────────────────────────────
  function handleSubmitShield() {
    if (!selected || answered) return;
    const choice = choices.find((c) => c.id === selected);
    const gained = pts(choice ?? { id: "", text: "" });
    const best = scenarioMax(currentIndex);
    setShieldPoints((p) => p + gained);
    const guestStudentId = getGuestStudentId(step.module.slug);
    if (guestStudentId) {
      submitQuizResponse({
        guestStudentId,
        stepId: step.id,
        moduleId: step.module.id,
        userAnswer: { choiceId: selected, scenarioIndex: String(currentIndex), points: gained },
        isCorrect: gained >= best && best > 0,
      }).catch(() => {});
    }
    setAnswered(true);
  }

  function handleNextShield() {
    if (!isLastItem) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  }

  const gainedNow = answered ? pts(choices.find((c) => c.id === selected) ?? { id: "", text: "" }) : 0;

  const Header = (
    <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white">
      <Link
        href={`/modules/${step.module.slug}`}
        className="flex items-center gap-2 md:gap-3 text-gray-700 hover:opacity-70 transition-opacity flex-1 basis-0 min-w-0"
      >
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <ArrowLeft size={18} />
        </div>
        <span className="hidden sm:inline font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
      </Link>

      <div className="text-center min-w-0">
        <h1 className="font-black text-base md:text-xl text-gray-900 truncate">
          {step.content?.title ?? (shieldMode ? "Le bouclier mental" : "Que ferais-tu ?")}
        </h1>
        <p className="hidden sm:block text-sm text-gray-400 mt-0.5">{step.content?.instructions}</p>
      </div>

      <div className="flex-1 basis-0 text-right text-gray-400 font-bold text-sm whitespace-nowrap">
        Étape <span className="text-gray-900 text-lg md:text-xl font-black">{gameLevel}</span> / {totalGameLevels}
      </div>
    </header>
  );

  // ── Écran final (mode bouclier) ──────────────────────────────────────────────
  if (shieldMode && finished) {
    const msg =
      shieldPct >= 80
        ? "Bouclier solide ! Tes compétences psycho-sociales te protègent bien face aux risques."
        : shieldPct >= 50
        ? "Bon bouclier — continue à muscler tes CPS (en parler, esprit critique, savoir dire non)."
        : "Bouclier fragile — pense à mobiliser tes CPS pour te protéger davantage.";
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
      >
        {Header}
        <main className="flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 py-8 text-center">
          <Shield size={72} className="text-white drop-shadow" />
          <h2 className="text-2xl md:text-3xl font-black text-white">Ton bouclier mental</h2>
          <div className="text-6xl md:text-7xl font-black text-white">{shieldPct}%</div>
          <div className="w-full max-w-md h-4 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-white transition-all duration-700" style={{ width: `${shieldPct}%` }} />
          </div>
          <p className="text-white/85 text-base md:text-lg font-semibold max-w-md">{msg}</p>
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

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
      {Header}

      <main className="flex-1 flex flex-col items-center justify-center gap-6 md:gap-8 px-4 md:px-8 py-6">
        {/* Jauge bouclier (mode bouclier) */}
        {shieldMode && (
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between text-white/80 text-xs font-bold uppercase tracking-widest mb-1.5">
              <span className="flex items-center gap-1.5"><Shield size={14} /> Bouclier mental</span>
              <span>{shieldPct}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${shieldPct}%` }} />
            </div>
          </div>
        )}

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
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl px-6 md:px-10 py-6 md:py-8 max-w-2xl w-full shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: primaryColor }}>
            Situation
          </p>
          <p className="text-gray-800 text-lg font-semibold leading-relaxed">{situation}</p>
        </div>

        {/* Choix */}
        <div className="flex flex-col gap-3 w-full max-w-2xl">
          {choices.map((choice) => {
            const isSel = selected === choice.id;
            // En mode bouclier, après réponse : surligne le choix retenu
            const revealed = shieldMode && answered && isSel;
            return (
              <button
                key={choice.id}
                onClick={() => { if (!(shieldMode && answered)) setSelected(choice.id); }}
                disabled={shieldMode && answered}
                className="w-full text-left px-5 md:px-6 py-4 rounded-2xl font-semibold text-sm transition-all"
                style={
                  isSel
                    ? {
                        background: "#fff",
                        color: primaryColor,
                        outline: `3px solid rgba(255,255,255,0.6)`,
                        transform: revealed ? "scale(1)" : "scale(1.02)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      }
                    : {
                        background: "rgba(255,255,255,0.15)",
                        color: "#fff",
                        border: "2px solid rgba(255,255,255,0.3)",
                        opacity: shieldMode && answered ? 0.5 : 1,
                      }
                }
              >
                {choice.text}
              </button>
            );
          })}
        </div>

        {/* Mode bouclier : feedback après réponse */}
        {shieldMode && answered && (
          <div className="w-full max-w-2xl bg-white/95 rounded-2xl px-6 py-4 shadow-lg text-center space-y-1">
            <p className="font-black text-sm" style={{ color: primaryColor }}>
              {gainedNow > 0 ? `+${gainedNow} pour ton bouclier 🛡️` : "Ce choix ne renforce pas ton bouclier."}
            </p>
            {explanation && <p className="text-gray-600 text-sm leading-relaxed">{explanation}</p>}
          </div>
        )}

        {/* Bouton d'action */}
        {shieldMode ? (
          answered ? (
            <button
              onClick={handleNextShield}
              className="px-10 py-3.5 rounded-2xl text-white font-black text-base transition-all"
              style={{ background: "rgba(255,255,255,0.25)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.6)" }}
            >
              {isLastItem ? "Voir mon bouclier →" : "Situation suivante →"}
            </button>
          ) : (
            <button
              onClick={handleSubmitShield}
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
          )
        ) : (
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
        )}
      </main>

      {/* Overlay uniquement en mode normal */}
      {!shieldMode && (
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
      )}
    </div>
  );
}
