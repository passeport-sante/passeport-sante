"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, ImageUp, Loader2, Save } from "lucide-react";
import { Field, INPUT_CLASS, TEXTAREA_CLASS } from "./editor-shell";
import {
  CONTENT_TYPE_META,
  toEmbedUrl,
  type AdminStep,
  type AdminGameData,
  type ContentType,
  type StepContent,
} from "@/lib/steps-admin";
import { uploadImageFile } from "@/lib/upload";
import { VideoEmbed } from "@/components/modules/VideoEmbed";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: { content: StepContent; gameData?: AdminGameData[] }) => Promise<void>;
}

export function ContentEditor({ step, color, onSave }: Props) {
  const contentType: ContentType = step.content?.contentType ?? "INFO";
  const meta = CONTENT_TYPE_META[contentType];

  const [title, setTitle] = useState(step.content?.title ?? "");
  const [body, setBody] = useState(step.content?.body ?? "");
  const [imageUrl, setImageUrl] = useState(step.content?.imageUrl ?? "");
  const [videoUrl, setVideoUrl] = useState(step.content?.videoUrl ?? "");
  const [caption, setCaption] = useState(step.content?.caption ?? "");

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  async function handleFileUpload(file: File) {
    setUploading(true);
    try {
      // Passe par /api/upload (voir lib/upload.ts) : l'appel direct à Cloudinary
      // est bloqué par la CSP. Le helper redimensionne aussi l'image avant envoi.
      const url = await uploadImageFile(file);
      setImageUrl(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  }

  const validationError = useMemo(() => {
    if (contentType === "INFO" && !body.trim()) return "Saisissez le texte de l'information";
    if (contentType === "IMAGE" && !imageUrl.trim()) return "Renseignez l'URL de l'image";
    if (contentType === "VIDEO") {
      if (!videoUrl.trim()) return "Renseignez l'URL de la vidéo";
      if (!toEmbedUrl(videoUrl)) return "Lien vidéo non reconnu (YouTube ou Vimeo attendu)";
    }
    return null;
  }, [contentType, body, imageUrl, videoUrl]);

  function buildContent(): StepContent {
    const base: StepContent = { contentType, title: title.trim() };
    if (contentType === "INFO") base.body = body.trim();
    if (contentType === "IMAGE") {
      base.imageUrl = imageUrl.trim();
      base.caption = caption.trim();
    }
    if (contentType === "VIDEO") {
      base.videoUrl = videoUrl.trim();
      base.caption = caption.trim();
    }
    return base;
  }

  async function handleSaveClick() {
    if (saving || !!validationError) return;
    setSaving(true);
    try {
      await onSave({ content: buildContent() });
      setJustSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setJustSaved(false), 2200);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSaveClick();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationError, saving, title, body, imageUrl, videoUrl, caption]);

  const embed = contentType === "VIDEO" ? toEmbedUrl(videoUrl) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
            style={{ background: meta.color, color: "white" }}
          >
            SOUS-ÉTAPE
          </span>
          <span className="text-sm font-bold text-[#1A1A1A] truncate">{meta.label}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {step.module?.slug && (
            <Link
              href={`/modules/${step.module.slug}/step/${step.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <ExternalLink size={11} />
              Tester
            </Link>
          )}
          {justSaved && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <Check size={12} />
              Enregistré
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        <Field label="Titre" hint="Affiché en haut de l'écran (facultatif)">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={meta.label}
            className={INPUT_CLASS}
          />
        </Field>

        {contentType === "INFO" && (
          <Field label="Texte de l'information">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ce que les élèves vont lire…"
              className={TEXTAREA_CLASS}
              rows={5}
            />
          </Field>
        )}

        {contentType === "IMAGE" && (
          <>
            <Field label="URL de l'image" hint="Colle un lien ou uploade depuis ton appareil">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://… ou /assets/…"
                  className={INPUT_CLASS + " flex-1"}
                  disabled={uploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImageUp size={14} />}
                  {uploading ? "Upload…" : "Uploader"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </Field>
            <Field label="Légende" hint="Facultative">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Légende sous l'image"
                className={INPUT_CLASS}
              />
            </Field>
            {imageUrl.trim() && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl.trim()}
                alt="Aperçu"
                className="max-h-64 rounded-xl border border-gray-200 object-contain mx-auto"
              />
            )}
          </>
        )}

        {contentType === "VIDEO" && (
          <>
            <Field label="URL de la vidéo" hint="YouTube ou Vimeo (lien de partage ou d'intégration)">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Légende" hint="Facultative">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Légende sous la vidéo"
                className={INPUT_CLASS}
              />
            </Field>
            {embed && <VideoEmbed url={embed} title="Aperçu vidéo" accent={color} />}
          </>
        )}
      </div>

      {/* Footer save bar */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {validationError ? (
            <span className="text-red-500 font-semibold">{validationError}</span>
          ) : (
            <span className="text-gray-400">Astuce : ⌘S / Ctrl+S pour enregistrer</span>
          )}
        </div>
        <button
          onClick={handleSaveClick}
          disabled={saving || !!validationError}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: color }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
