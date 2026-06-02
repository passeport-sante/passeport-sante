"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { toEmbedUrl } from "@/lib/steps-admin";
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

  function handleContinue() {
    goToNextStep(router, step.module.slug, step.module.steps, step.order);
  }

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: `linear-gradient(160deg, ${primaryColor} 0%, ${bottomColor} 100%)` }}
    >
      {/* Navbar */}
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
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400">
          Le saviez-vous ?
        </span>
      </header>

      {/* Contenu */}
      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-8 py-8 overflow-y-auto">
        <div
          className="w-full max-w-3xl rounded-3xl px-8 py-8 space-y-5"
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

          {contentType === "IMAGE" && content.imageUrl && (
            <figure className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.imageUrl}
                alt={content.caption ?? content.title ?? "Illustration"}
                className="w-full max-h-[55vh] object-contain rounded-2xl"
              />
              {content.caption && (
                <figcaption className="text-center text-sm text-gray-500">{content.caption}</figcaption>
              )}
            </figure>
          )}

          {contentType === "VIDEO" &&
            (embed ? (
              <figure className="space-y-2">
                <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "16 / 9" }}>
                  <iframe
                    src={embed}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={content.title ?? "Vidéo"}
                  />
                </div>
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
    </div>
  );
}
