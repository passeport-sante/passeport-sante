"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Loader2, Save } from "lucide-react";
import { GAME_TYPE_META, type AdminStep } from "@/lib/steps-admin";

export const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm outline-none transition-all focus:bg-white focus:border-transparent focus:ring-2 focus:ring-[#1B6B8A]/30 placeholder:text-gray-400";

export const TEXTAREA_CLASS = INPUT_CLASS + " min-h-[80px] leading-relaxed";

export const ICON_BUTTON_CLASS =
  "p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors";

interface ShellProps {
  step: AdminStep;
  color: string;
  // Champs "métadonnées" partagés (title + instructions)
  title: string;
  instructions: string;
  onChangeTitle: (v: string) => void;
  onChangeInstructions: (v: string) => void;
  // Sauvegarde
  onSave: () => Promise<void>;
  isDirty: boolean;
  validationError?: string | null;
  children: React.ReactNode;
}

export function EditorShell({
  step,
  color,
  title,
  instructions,
  onChangeTitle,
  onChangeInstructions,
  onSave,
  isDirty,
  validationError,
  children,
}: ShellProps) {
  const meta = GAME_TYPE_META[step.gameType ?? "QUIZ"];
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);

  async function handleSaveClick() {
    if (saving || !isDirty || !!validationError) return;
    setSaving(true);
    try {
      await onSave();
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

  // Cmd/Ctrl + S pour sauvegarder
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
  }, [isDirty, validationError, saving]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
            style={{ background: meta.color, color: "white" }}
          >
            {meta.short.toUpperCase()}
          </span>
          <span className="text-sm font-bold text-[#1A1A1A] truncate">
            {meta.label}
          </span>
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
          {justSaved ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <Check size={12} />
              Enregistré
            </span>
          ) : isDirty ? (
            <span className="text-xs text-amber-600 font-semibold">
              Modifications non sauvegardées
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5">
        {/* Métadonnées titre + instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Titre de l'étape">
            <input
              type="text"
              value={title}
              onChange={(e) => onChangeTitle(e.target.value)}
              placeholder={meta.label}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Consigne">
            <input
              type="text"
              value={instructions}
              onChange={(e) => onChangeInstructions(e.target.value)}
              placeholder="Ce que l'élève doit faire"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <hr className="border-gray-100" />

        {/* Éditeur spécifique GameType */}
        {children}
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
          disabled={!isDirty || saving || !!validationError}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: color }}
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function SectionHeader({
  title,
  count,
  onAdd,
  addLabel = "Ajouter",
  color,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
  addLabel?: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
        {title}
        {count !== undefined && (
          <span className="ml-1.5 text-gray-400 font-semibold">({count})</span>
        )}
      </h4>
      {onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors"
          style={{ background: `${color}15`, color }}
        >
          + {addLabel}
        </button>
      )}
    </div>
  );
}
