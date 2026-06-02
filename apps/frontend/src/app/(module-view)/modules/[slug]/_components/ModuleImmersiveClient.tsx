"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { GameProgress } from "@/components/rive/GameProgress";
import { createGuestStudent, setGuestStudentId, getGuestStudentId } from "@/lib/modules";

interface ModuleData {
  id: string;
  title: string;
  slug: string;
  mascotte: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  category: { name: string } | null;
  steps: { id: string; order: number; gameType: string | null; kind?: "GAME" | "CONTENT" }[];
}
interface Props {
  module: ModuleData;
}

const MAX_LEVEL = 5;

const RIVE_FILES: Record<string, string> = {
  vaccination: "/assets/rive/progressbar_vaccination.riv",
  sommeil: "/assets/rive/progressbar_sommeil.riv",
  "bien-manger": "/assets/rive/progressbar_alimentation.riv",
  cyberharcelement: "/assets/rive/progressbar_addiction.riv",
  "hygiene-bucco": "/assets/rive/progressbar_sexualite.riv",
};

function getRiveFile(slug: string): string {
  return RIVE_FILES[slug] ?? "/assets/rive/progressbar_vaccination.riv";
}


const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 520;
const STEP_X_ARTBOARD = [95, 228.5, 370, 502, 640];
const STEP_Y_ARTBOARD = [218, 145, 218, 145, 218];
const ARTBOARD_HEIGHT = 320;
const ARTBOARD_WIDTH = 750;
const BUBBLE_WIDTH = 320;

// Rive renders the artboard with uniform "contain" scale — width is the limiting axis.
const RIVE_SCALE = CANVAS_WIDTH / ARTBOARD_WIDTH; // 1.6
// Vertical offset from letterboxing (artboard rendered shorter than canvas height)
const RIVE_Y_OFFSET = (CANVAS_HEIGHT - ARTBOARD_HEIGHT * RIVE_SCALE) / 2;
// Horizontal offset to reach the mascot/circle center from the artboard X anchor
const MASCOT_CENTER_X_OFFSET = 40;

function mascotCenterX(level: number): number {
  return (
    (STEP_X_ARTBOARD[level - 1] ?? 75.5) * RIVE_SCALE + MASCOT_CENTER_X_OFFSET
  );
}

function getBubbleLeft(level: number): number {
  const cx = mascotCenterX(level);
  const left = cx - BUBBLE_WIDTH / 2;
  return Math.max(10, Math.min(CANVAS_WIDTH - BUBBLE_WIDTH - 10, left));
}

function getBubbleTriangleLeft(level: number): number {
  const cx = mascotCenterX(level);
  const pos = cx - getBubbleLeft(level) - 8;
  return Math.max(16, Math.min(BUBBLE_WIDTH - 32, pos));
}

function getStepCanvasPos(index: number) {
  return {
    x: (STEP_X_ARTBOARD[index] ?? 0) * RIVE_SCALE,
    y: (STEP_Y_ARTBOARD[index] ?? 0) * RIVE_SCALE + RIVE_Y_OFFSET,
  };
}

function resolveMascotte(raw: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("/") || raw.startsWith("http")) return raw;
  return `/assets/mascotte/${raw}`;
}

export function ModuleImmersiveClient({ module }: Props) {
  const mascotteSrc = resolveMascotte(module.mascotte);
  const [riveLevel, setRiveLevel] = useState<number | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState<number | null>(null);
  const [showNextBtn, setShowNextBtn] = useState(false);
  const [showCompleteBtn, setShowCompleteBtn] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const storageKey = `module_level_${module.slug}`;
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // Si l'élève arrive depuis /session avec un sessionId, on crée son GuestStudent
    const sessionId = searchParams.get("sessionId");
    if (sessionId && !getGuestStudentId(module.slug)) {
      createGuestStudent(sessionId)
        .then((id) => setGuestStudentId(module.slug, id))
        .catch(() => {});
    }

    const unlocked = Math.min(
      Math.max(parseInt(localStorage.getItem(storageKey) ?? "1", 10), 1),
      MAX_LEVEL,
    );
    const fromParam = searchParams.get("from");

    setUnlockedLevel(unlocked);

    const completeParam = searchParams.get("complete");

    if (completeParam) {
      // Dernier step terminé : on arrive directement sur l'overlay de fin
      router.replace(`/modules/${module.slug}`, { scroll: false });
      setRiveLevel(unlocked);
      setShowCompleteOverlay(true);
    } else if (fromParam) {
      router.replace(`/modules/${module.slug}`, { scroll: false });
      const from = Math.min(Math.max(parseInt(fromParam, 10), 1), MAX_LEVEL);
      setRiveLevel(from < unlocked ? from : Math.max(1, unlocked - 1));
      setShowNextBtn(true);
    } else {
      setRiveLevel(unlocked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNextStep() {
    if (!unlockedLevel) return;
    setRiveLevel(unlockedLevel);
    setShowNextBtn(false);
    if (unlockedLevel === MAX_LEVEL) {
      setTimeout(() => setShowCompleteBtn(true), 1500);
    }
  }

  const primaryColor = module.colorPrimary ?? "#D97706";
  const bottomColor = module.colorSecondary ?? "#14290A";

  const displayedRiveLevel = (riveLevel ?? 1) as 1 | 2 | 3 | 4 | 5;
  const displayedUnlocked = unlockedLevel ?? 1;
  const pct = Math.round(((displayedUnlocked - 1) / (MAX_LEVEL - 1)) * 100);

  const bubbleLeft = getBubbleLeft(displayedRiveLevel);
  const triangleLeft = getBubbleTriangleLeft(displayedRiveLevel);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {/* Navbar */}
      <header className="shrink-0 flex items-center justify-between px-8 py-5 bg-white">
        <Link
          href="/modules"
          className="flex items-center gap-3 text-gray-700 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">
            Retour aux modules
          </span>
        </Link>

        <div className="text-center text-gray-900">
          <h1 className="font-black text-xl tracking-wide">{module.title}</h1>
          {module.category && (
            <p className="text-sm text-gray-400 mt-0.5">
              {module.category.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 text-gray-700">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
            Progression Global
          </span>
          <div className="w-44 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: primaryColor }}
            />
          </div>
          <div
            className="w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <span className="font-black text-sm">{pct}%</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center justify-center pb-6 gap-6">
        <div
          className="relative"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
        >
          {/* Bulle de dialogue */}
          <div
            className="absolute z-10 rounded-2xl px-7 py-5 shadow-xl transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              top: 20,
              left: bubbleLeft,
              width: BUBBLE_WIDTH,
            }}
          >
            <p className="font-semibold text-[#1A1A1A] text-base leading-relaxed text-center">
              Bienvenue dans mon module ! Je vais t&apos;apprendre énormément de
              chose utile pour toi !
            </p>
            <div
              className="absolute -bottom-2.5 w-0 h-0"
              style={{
                left: triangleLeft,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "10px solid rgba(255,255,255,0.92)",
              }}
            />
          </div>

          {/* Animation Rive */}
          {riveLevel !== null && (
            <GameProgress
              level={displayedRiveLevel}
              src={getRiveFile(module.slug)}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
          )}

          {/* Zones cliquables — uniquement les étapes de jeu (les sous-étapes de contenu n'ont pas de cercle) */}
          {module.steps
            .filter((s) => (s.kind ?? "GAME") === "GAME")
            .sort((a, b) => a.order - b.order)
            .map((step, index) => {
              const pos = getStepCanvasPos(index);
              // Déblocage par rang parmi les jeux (1..5), pas par l'order global
              const isUnlocked = index + 1 <= displayedUnlocked;
              const R = 58;

              const zoneStyle: React.CSSProperties = {
                width: R * 2,
                height: R * 2,
                left: pos.x - R,
                top: pos.y - R,
              };

              return isUnlocked ? (
                <Link
                  key={step.id}
                  href={`/modules/${module.slug}/step/${step.id}`}
                  className="absolute z-20 rounded-full hover:scale-110 transition-transform"
                  style={zoneStyle}
                  title={`Étape ${index + 1}`}
                />
              ) : (
                <div
                  key={step.id}
                  className="absolute z-20 rounded-full cursor-not-allowed"
                  style={zoneStyle}
                />
              );
            })}
        </div>

        {/* Bouton étape suivante */}
        {showNextBtn && (
          <button
            onClick={handleNextStep}
            className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all hover:scale-105 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.95)",
              color: primaryColor,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            Étape suivante
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        )}
      </main>

      {/* Overlay de fin de module */}
      {showCompleteOverlay && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Mascotte */}
          {mascotteSrc && (
            <div
              className="mb-6"
              style={{ filter: "drop-shadow(0 16px 48px rgba(0,0,0,0.4))" }}
            >
              <Image
                src={mascotteSrc}
                alt="Mascotte"
                width={220}
                height={220}
                className="object-contain"
                style={{
                  animation:
                    "bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              />
            </div>
          )}

          {/* Card */}
          <div
            className="flex flex-col items-center gap-5 rounded-3xl px-12 py-10 max-w-lg w-full mx-4 text-center"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
            }}
          >
            <div className="text-5xl">🎉</div>
            <h2 className="font-black text-3xl text-gray-900">Bravo !</h2>
            <p className="text-gray-600 text-lg leading-relaxed font-semibold">
              Tu as terminé le module{" "}
              <span style={{ color: primaryColor }}>{module.title}</span> !
              <br />
              J&apos;espère que tu as appris plein de choses et que tu t&apos;es
              bien amusé !
            </p>

            <Link
              href="/modules"
              className="mt-2 px-10 py-3.5 rounded-2xl font-black text-white text-base transition-all hover:scale-105 active:scale-95"
              style={{
                background: primaryColor,
                boxShadow: `0 6px 20px ${primaryColor}66`,
              }}
            >
              Retour aux modules
            </Link>
          </div>

          <style>{`
            @keyframes bounce-in {
              from { opacity: 0; transform: scale(0.5) translateY(40px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
