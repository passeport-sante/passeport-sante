"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { toEmbedUrl } from "@/lib/steps-admin";
import { VideoEmbed } from "@/components/modules/VideoEmbed";
import { goToNextStep, type FlowStep } from "@/lib/step-flow";

interface StepData {
  id: string;
  order: number;
  content: {
    contentType?: "INFO" | "IMAGE" | "VIDEO";
    title?: string;
    body?: string;
    imageUrl?: string;
    videoUrl?: string;
    caption?: string;
  } | null;
  module: {
    id: string;
    slug: string;
    title: string;
    colorPrimary: string | null;
    colorSecondary: string | null;
    steps: FlowStep[];
  };
}

export function ContentPanel({ step }: { step: StepData }) {
  const router = useRouter();
  const content = step.content ?? {};
  const contentType = content.contentType ?? "INFO";

  const primaryColor = step.module.colorPrimary ?? "#0EA5E9";
  const bottomColor = step.module.colorSecondary ?? "#0c2a3a";
  const embed = contentType === "VIDEO" ? toEmbedUrl(content.videoUrl ?? "") : null;

  // Les affiches contiennent du texte : elles ont besoin de toute la largeur
  // disponible, et d'un plein écran pour rester lisibles sur petit écran.
  const isImage = contentType === "IMAGE" && !!content.imageUrl;
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  function handleContinue() {
    goToNextStep(router, step.module.slug, step.module.steps, step.order);
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
          className="flex items-center gap-3 text-gray-700 hover:opacity-70 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center">
            <ArrowLeft size={18} />
          </div>
          <span className="font-bold text-sm tracking-widest uppercase">{step.module.title}</span>
        </Link>
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
          Le saviez-vous ?
        </span>
      </header>

      {/* Contenu */}
      <main
        className={`flex-1 flex flex-col items-center justify-center gap-6 px-4 md:px-8 overflow-y-auto ${
          isImage ? "py-5" : "py-8"
        }`}
      >
        <div
          className={`w-full rounded-3xl space-y-4 ${
            isImage ? "max-w-5xl px-4 py-5 md:px-6" : "max-w-3xl px-8 py-8 space-y-5"
          }`}
          style={{ background: "rgba(255,255,255,0.96)", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
        >
          {content.title && (
            <h1 className="font-black text-2xl md:text-3xl text-center" style={{ color: primaryColor }}>
              {content.title}
            </h1>
          )}

          {contentType === "INFO" && content.body && (
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap text-center">
              {content.body}
            </p>
          )}

          {isImage && (
            <figure className="space-y-2">
              <button
                type="button"
                onClick={() => setZoomed(true)}
                aria-label="Afficher l'image en plein écran"
                className="group relative block w-full rounded-2xl cursor-zoom-in focus:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={content.imageUrl}
                  alt={content.caption ?? content.title ?? "Illustration"}
                  className="w-full max-h-[78vh] object-contain rounded-2xl"
                />
                <span
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white text-xs font-bold opacity-90 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.55)" }}
                >
                  <Maximize2 size={13} strokeWidth={2.5} />
                  Agrandir
                </span>
              </button>
              {content.caption && (
                <figcaption className="text-center text-sm text-gray-500">{content.caption}</figcaption>
              )}
            </figure>
          )}

          {contentType === "VIDEO" &&
            (embed ? (
              <figure className="space-y-2">
                <VideoEmbed url={embed} title={content.title} accent={primaryColor} />
                {content.caption && (
                  <figcaption className="text-center text-sm text-gray-500">{content.caption}</figcaption>
                )}
              </figure>
            ) : (
              <p className="text-center text-gray-400 text-sm">Vidéo indisponible.</p>
            ))}
        </div>

        <button
          onClick={handleContinue}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all hover:scale-105 active:scale-95"
          style={{
            background: "rgba(255,255,255,0.95)",
            color: primaryColor,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          Continuer
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </main>

      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={content.caption ?? content.title ?? "Image en plein écran"}
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 cursor-zoom-out"
          style={{ background: "rgba(0,0,0,0.92)" }}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Fermer le plein écran"
            className="absolute top-4 right-4 w-11 h-11 rounded-full text-white flex items-center justify-center transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <X size={22} strokeWidth={2.5} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.imageUrl}
            alt={content.caption ?? content.title ?? "Illustration"}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-xl cursor-default"
          />
        </div>
      )}
    </div>
  );
}
