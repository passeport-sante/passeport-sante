"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { GameProgress } from "@/components/rive/GameProgress";
import { mascotteUrl } from "@/lib/mascotte";
import { ensureGuestStudentId, fetchProgress } from "@/lib/modules";
import { ModuleCertificatePdf } from "./ModuleCertificatePdf";

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



const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 520;
const STEP_X_ARTBOARD = [95, 228.5, 370, 502, 640];
const STEP_Y_ARTBOARD = [218, 145, 218, 145, 218];
const ARTBOARD_HEIGHT = 320;
const ARTBOARD_WIDTH = 750;

// Rive renders the artboard with uniform "contain" scale — width is the limiting axis.
const RIVE_SCALE = CANVAS_WIDTH / ARTBOARD_WIDTH; // 1.6
// Vertical offset from letterboxing (artboard rendered shorter than canvas height)
const RIVE_Y_OFFSET = (CANVAS_HEIGHT - ARTBOARD_HEIGHT * RIVE_SCALE) / 2;

// Mascotte & bulle de dialogue
const MASCOTTE_SIZE = 185;         // hauteur de la mascotte (agrandie)
const MASCOTTE_HALF_W = 62;        // demi-largeur visuelle approx. (image portrait)
const BUBBLE_WIDTH = 300;
const BUBBLE_HEIGHT_EST = 150;     // estimation pour le placement vertical
const BUBBLE_GAP = 22;             // écart entre la mascotte et la bulle

function getStepCanvasPos(index: number) {
  return {
    x: (STEP_X_ARTBOARD[index] ?? 0) * RIVE_SCALE,
    y: (STEP_Y_ARTBOARD[index] ?? 0) * RIVE_SCALE + RIVE_Y_OFFSET,
  };
}

// La bulle est placée SUR LE CÔTÉ de la mascotte (le canvas est large mais court,
// impossible d'empiler mascotte + bulle verticalement sans chevauchement selon l'étape).
// À droite si la place le permet, sinon à gauche ; centrée verticalement sur la mascotte.
function getBubbleLayout(mascotteX: number, mascotteCenterY: number) {
  const rightLeft = mascotteX + MASCOTTE_HALF_W + BUBBLE_GAP;
  const placeRight = rightLeft + BUBBLE_WIDTH <= CANVAS_WIDTH - 10;
  const left = placeRight
    ? rightLeft
    : mascotteX - MASCOTTE_HALF_W - BUBBLE_GAP - BUBBLE_WIDTH;
  const top = Math.max(
    8,
    Math.min(CANVAS_HEIGHT - 8 - BUBBLE_HEIGHT_EST, mascotteCenterY - BUBBLE_HEIGHT_EST / 2),
  );
  // Position verticale du triangle, relative au haut de la bulle, pointant vers la mascotte
  const triangleTop = Math.max(16, Math.min(BUBBLE_HEIGHT_EST - 28, mascotteCenterY - top - 8));
  return { left, top, placeRight, triangleTop };
}

export function ModuleImmersiveClient({ module }: Props) {
  const mascotteSrc = mascotteUrl(module.mascotte, "card");
  const [riveLevel, setRiveLevel] = useState<number | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState<number | null>(null);
  const [showNextBtn, setShowNextBtn] = useState(false);
  const [showCompleteBtn, setShowCompleteBtn] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);
  const [pdfMounted, setPdfMounted] = useState(false);
  // Fin de module telle que la connaît le serveur. `verifieParServeur` reste
  // faux tant qu'il n'a pas répondu : on ne prive personne de son attestation
  // à cause d'un incident réseau.
  const [moduleTermine, setModuleTermine] = useState(false);
  const [verifieParServeur, setVerifieParServeur] = useState(false);

  // Mise à l'échelle du canvas (1200px) pour tenir sur tous les écrans
  const [canvasScale, setCanvasScale] = useState(1);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = canvasWrapRef.current;
    function update() {
      const w = el?.clientWidth ?? 0;
      // Ne jamais mettre l'échelle à 0 : si la largeur n'est pas encore connue, on garde 1 (visible)
      if (w > 0) setCanvasScale(Math.min(1, w / CANVAS_WIDTH));
    }
    update();
    // ResizeObserver : recalcule quand la mise en page est prête (fiable en prod), + fallback resize fenêtre
    const ro = typeof ResizeObserver !== "undefined" && el ? new ResizeObserver(update) : null;
    if (ro && el) ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const searchParams = useSearchParams();
  const router = useRouter();
  const storageKey = `module_level_${module.slug}`;
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    // L'élève reste anonyme : on lui attribue simplement un GuestStudent, qui
    // porte ses réponses et sa progression. Avec un sessionId (entrée par le
    // code de la classe) il est rattaché à la séance ; sans, il est créé sans
    // session et ne compte donc dans aucune statistique de classe.
    const sessionId = searchParams.get("sessionId");

    const unlocked = Math.min(
      Math.max(parseInt(localStorage.getItem(storageKey) ?? "1", 10), 1),
      MAX_LEVEL,
    );
    const fromParam = searchParams.get("from");

    setUnlockedLevel(unlocked);

    // Le serveur a le dernier mot sur l'avancement et sur la fin de module :
    // le stockage local n'est qu'un affichage immédiat, et l'attestation ne
    // s'obtient plus en tapant ?complete=true dans la barre d'adresse.
    void ensureGuestStudentId(module.slug, sessionId).then(async (guestId) => {
      if (!guestId) return;
      const etat = await fetchProgress(guestId, module.id);
      if (!etat) return;
      const niveau = Math.min(Math.max(etat.unlockedLevel, 1), MAX_LEVEL);
      setUnlockedLevel(niveau);
      try {
        localStorage.setItem(storageKey, String(niveau));
      } catch {}
      setModuleTermine(etat.isCompleted);
      setVerifieParServeur(true);
    });

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

  useEffect(() => { if (showCompleteOverlay) setPdfMounted(true); }, [showCompleteOverlay]);

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

  const mascottePos = getStepCanvasPos(displayedRiveLevel - 1);
  const mascotteTop = Math.max(10, mascottePos.y - MASCOTTE_SIZE - 10);
  const mascotteCenterY = mascotteTop + MASCOTTE_SIZE / 2;
  const bubble = getBubbleLayout(mascottePos.x, mascotteCenterY);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{
        background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {/* Navbar */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-3 md:py-5 bg-white">
        <Link
          href="/modules"
          className="flex items-center gap-2 md:gap-3 text-gray-700 hover:opacity-70 transition-opacity shrink-0"
        >
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="hidden sm:inline font-bold text-sm tracking-widest uppercase">
            Retour aux modules
          </span>
        </Link>

        <div className="text-center text-gray-900 min-w-0">
          <h1 className="font-black text-base md:text-xl tracking-wide truncate">{module.title}</h1>
          {module.category && (
            <p className="hidden sm:block text-sm text-gray-400 mt-0.5">
              {module.category.name}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 text-gray-700 shrink-0">
          <span className="hidden lg:inline text-xs font-bold tracking-widest uppercase text-gray-400">
            Progression Global
          </span>
          <div className="hidden sm:block w-24 lg:w-44 h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: primaryColor }}
            />
          </div>
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <span className="font-black text-xs md:text-sm">{pct}%</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center justify-center pb-6 gap-6 overflow-hidden">
        <div ref={canvasWrapRef} className="w-full flex justify-center">
        <div style={{ width: CANVAS_WIDTH * canvasScale, height: CANVAS_HEIGHT * canvasScale }}>
        <div
          className="relative"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, transform: `scale(${canvasScale})`, transformOrigin: "top left" }}
        >
          {/* Bulle de dialogue — placée sur le côté de la mascotte */}
          <div
            className="absolute z-10 rounded-2xl px-6 py-4 shadow-xl transition-all duration-500"
            style={{
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              top: bubble.top,
              left: bubble.left,
              width: BUBBLE_WIDTH,
            }}
          >
            <p className="font-semibold text-[#1A1A1A] text-base leading-relaxed text-center">
              Bienvenue dans mon module ! Je vais t&apos;apprendre énormément de
              chose utile pour toi !
            </p>
            {/* Triangle pointant horizontalement vers la mascotte */}
            <div
              className="absolute w-0 h-0"
              style={{
                top: bubble.triangleTop,
                ...(bubble.placeRight
                  ? {
                      left: -10,
                      borderTop: "10px solid transparent",
                      borderBottom: "10px solid transparent",
                      borderRight: "10px solid rgba(255,255,255,0.92)",
                    }
                  : {
                      right: -10,
                      borderTop: "10px solid transparent",
                      borderBottom: "10px solid transparent",
                      borderLeft: "10px solid rgba(255,255,255,0.92)",
                    }),
              }}
            />
          </div>

          {/* Animation Rive */}
          {riveLevel !== null && (
            <GameProgress
              level={displayedRiveLevel}
              src="/assets/rive/progressbar_default_enchenced.riv"
              stepColor={module.colorPrimary ?? undefined}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
          )}

          {/* Mascotte HTML overlay positionnée sur le step actuel */}
          {mascotteSrc && riveLevel !== null && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: mascottePos.x,
                top: mascotteTop,
                transform: "translateX(-50%)",
                zIndex: 5,
                transition: "left 0.6s cubic-bezier(0.34,1.56,0.64,1), top 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mascotteSrc}
                alt="mascotte"
                style={{ height: MASCOTTE_SIZE, width: "auto", maxWidth: "none", display: "block" }}
                className="drop-shadow-lg"
              />
            </div>
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
        </div>
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

            {/* Attestation : réservée à un module réellement terminé */}
            {verifieParServeur && !moduleTermine ? (
              <p className="mt-2 text-sm text-gray-500 font-semibold">
                Termine toutes les étapes du module pour obtenir ton attestation.
              </p>
            ) : pdfMounted ? (
              <PDFDownloadLink
                document={
                  <ModuleCertificatePdf
                    moduleTitle={module.title}
                    categoryName={module.category?.name ?? null}
                    color={primaryColor}
                    date={new Date().toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  />
                }
                fileName={`attestation-${module.slug}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button
                    className="mt-2 flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm border-2 transition-all hover:scale-105 active:scale-95"
                    style={{ borderColor: primaryColor, color: primaryColor, background: "rgba(255,255,255,0.9)" }}
                  >
                    {pdfLoading
                      ? <><Loader2 size={15} className="animate-spin" /> Génération…</>
                      : <><Download size={15} /> Télécharger mon attestation</>
                    }
                  </button>
                )}
              </PDFDownloadLink>
            ) : (
              <div
                className="mt-2 flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-bold text-sm border-2 opacity-50"
                style={{ borderColor: primaryColor, color: primaryColor, background: "rgba(255,255,255,0.9)" }}
              >
                <Loader2 size={15} className="animate-spin" /> Préparation…
              </div>
            )}

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
