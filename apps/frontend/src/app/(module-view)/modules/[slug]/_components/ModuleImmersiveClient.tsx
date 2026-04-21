"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { GameProgress } from "@/components/rive/GameProgress";

interface ModuleData {
  title: string;
  slug: string;
  colorPrimary: string | null;
  colorSecondary: string | null;
  category: { name: string } | null;
}

interface Props {
  module: ModuleData;
}

const MAX_LEVEL = 5;

const RIVE_FILES: Record<string, string> = {
  "vaccination":      "/assets/rive/progressbar_vaccination.riv",
  "sommeil":          "/assets/rive/progressbar_sommeil.riv",
  "bien-manger":      "/assets/rive/progressbar_alimentation.riv",
  "cyberharcelement": "/assets/rive/progressbar_addiction.riv",
  "hygiene-bucco":    "/assets/rive/progressbar_sexualite.riv",
};

function getRiveFile(slug: string): string {
  return RIVE_FILES[slug] ?? "/assets/rive/progressbar_vaccination.riv";
}
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 520;

// Positions X des steps dans l'artboard Rive (artboard ~750 unités de large)
const STEP_X_ARTBOARD = [75.5, 228.5, 395.5, 547.5, 709];
const ARTBOARD_WIDTH = 750;
const BUBBLE_WIDTH = 320;

// Bulle centrée horizontalement au-dessus de la mascotte, dans les limites du canvas
function getBubbleLeft(level: number): number {
  const scale = CANVAS_WIDTH / ARTBOARD_WIDTH;
  const mascotCenterX = STEP_X_ARTBOARD[level - 1] * scale + 40;
  const left = mascotCenterX - BUBBLE_WIDTH / 2;
  return Math.max(10, Math.min(CANVAS_WIDTH - BUBBLE_WIDTH - 10, left));
}

// Position du triangle en bas de la bulle, pointant vers le centre de la mascotte
function getBubbleTriangleLeft(level: number): number {
  const scale = CANVAS_WIDTH / ARTBOARD_WIDTH;
  const mascotCenterX = STEP_X_ARTBOARD[level - 1] * scale + 40;
  const bubbleLeft = getBubbleLeft(level);
  const pos = mascotCenterX - bubbleLeft - 8;
  return Math.max(16, Math.min(BUBBLE_WIDTH - 32, pos));
}

export function ModuleImmersiveClient({ module }: Props) {
  const [level, setLevel] = useState<1 | 2 | 3 | 4 | 5>(1);
  const storageKey = `module_level_${module.slug}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (parsed >= 1 && parsed <= MAX_LEVEL)
        setLevel(parsed as 1 | 2 | 3 | 4 | 5);
    }
  }, [storageKey]);

  const primaryColor = module.colorPrimary ?? "#D97706";
  const bottomColor = module.colorSecondary ?? "#14290A";
  const pct = Math.round(((level - 1) / (MAX_LEVEL - 1)) * 100);

  const bubbleLeft = getBubbleLeft(level);
  const triangleLeft = getBubbleTriangleLeft(level);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {/* ── Navbar custom ── */}
      <header className="shrink-0 flex items-center justify-between px-8 py-5 bg-white">
        {/* Gauche : retour */}
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

        {/* Centre : titre */}
        <div className="text-center text-gray-900">
          <h1 className="font-black text-xl tracking-wide">{module.title}</h1>
          {module.category && (
            <p className="text-sm text-gray-400 mt-0.5">
              {module.category.name}
            </p>
          )}
        </div>

        {/* Droite : progression globale */}
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

      {/* ── Contenu principal ── */}
      <main className="flex-1 flex items-center justify-center pb-6">
        {/* Conteneur Rive + bulle alignés ensemble */}
        <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {/* Bulle de dialogue — au-dessus de la mascotte */}
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
              Bienvenue dans mon module ! Je vais t'apprendre énormément de
              chose utile pour toi !
            </p>
            {/* Triangle pointant vers le bas (vers la mascotte) */}
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
          <GameProgress level={level} src={getRiveFile(module.slug)} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        </div>
      </main>
    </div>
  );
}
