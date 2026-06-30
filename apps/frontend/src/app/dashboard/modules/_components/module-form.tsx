"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BarChart3, Check, Loader2, Sparkles } from "lucide-react";
import { GameProgress } from "@/components/rive/GameProgress";
import {
  AVAILABLE_MASCOTTES,
  COLOR_PRESETS,
  SLUG_REGEX,
  isSlugTaken,
  slugify,
  type AdminModuleDetail,
  type CategoryLite,
  type CreateModulePayload,
  type UpdateModulePayload,
} from "@/lib/modules-admin";

export type ModuleFormValues = {
  title: string;
  description: string;
  slug: string;
  duration: number | "";
  categoryId: string;
  mascotte: string;
  colorPrimary: string;
  colorSecondary: string;
  colorCard: string;
  colorCardSecondary: string;
};

const INPUT_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none transition-all focus:bg-white focus:border-transparent focus:ring-2 focus:ring-[#1B6B8A]/30 placeholder:text-gray-400";

const DEFAULTS: ModuleFormValues = {
  title: "",
  description: "",
  slug: "",
  duration: 20,
  categoryId: "",
  mascotte: AVAILABLE_MASCOTTES[0] ?? "",
  colorPrimary: "#1B6B8A",
  colorSecondary: "#2A8970",
  colorCard: "#EBF4F8",
  colorCardSecondary: "#D6E9F0",
};

interface Props {
  categories: CategoryLite[];
  initial?: AdminModuleDetail | null;
  submitLabel: string;
  onSubmit: (
    payload: CreateModulePayload | UpdateModulePayload,
  ) => Promise<void>;
  onCancel: () => void;
}

export function ModuleForm({
  categories,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ModuleFormValues>(() =>
    initial
      ? {
          title: initial.title,
          description: initial.description ?? "",
          slug: initial.slug,
          duration: initial.duration ?? "",
          categoryId: initial.categoryId ?? "",
          mascotte: initial.mascotte ?? AVAILABLE_MASCOTTES[0] ?? "",
          colorPrimary: initial.colorPrimary ?? "#1B6B8A",
          colorSecondary: initial.colorSecondary ?? "#2A8970",
          colorCard: initial.colorCard ?? "#EBF4F8",
          colorCardSecondary: initial.colorCardSecondary ?? "#D6E9F0",
        }
      : DEFAULTS,
  );

  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Auto-slug à partir du titre tant que l'utilisateur n'a pas édité le slug manuellement
  useEffect(() => {
    if (slugTouched) return;
    setValues((v) => ({ ...v, slug: slugify(v.title) }));
  }, [values.title, slugTouched]);

  const slugValid = SLUG_REGEX.test(values.slug);
  const titleValid = values.title.trim().length >= 2;
  const formValid = titleValid && slugValid && slugStatus !== "taken" && slugStatus !== "checking";

  // Vérifie en direct (avec un léger délai) si le slug est déjà pris par un autre module
  useEffect(() => {
    if (!slugValid || values.slug === initial?.slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timer = setTimeout(() => {
      isSlugTaken(values.slug)
        .then((taken) => setSlugStatus(taken ? "taken" : "available"))
        .catch(() => setSlugStatus("idle"));
    }, 400);
    return () => clearTimeout(timer);
  }, [values.slug, slugValid, initial?.slug]);

  function update<K extends keyof ModuleFormValues>(key: K, val: ModuleFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function applyPreset(idx: number) {
    const preset = COLOR_PRESETS[idx];
    if (!preset) return;
    setValues((v) => ({ ...v, ...preset.colors }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        slug: values.slug.trim(),
        duration: values.duration === "" ? undefined : Number(values.duration),
        categoryId: values.categoryId || undefined,
        mascotte: values.mascotte || undefined,
        colorPrimary: values.colorPrimary,
        colorSecondary: values.colorSecondary,
        colorCard: values.colorCard,
        colorCardSecondary: values.colorCardSecondary,
      };
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Colonne formulaire (3/5) */}
      <div className="lg:col-span-3 space-y-5">
        {/* Section Identité */}
        <Section
          step={1}
          title="Identité"
          subtitle="Le nom et la présentation du module"
          accent="#1B6B8A"
        >
          <Field label="Titre" required>
            <input
              type="text"
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Ex: Vaccination"
              className={INPUT_CLASS}
              required
            />
          </Field>

          <Field
            label="Slug (URL)"
            hint={
              slugValid && slugStatus === "checking"
                ? "Vérification de la disponibilité…"
                : slugValid && slugStatus === "available"
                ? "✓ Ce slug est disponible"
                : "Identifiant unique en kebab-case. Auto-généré à partir du titre."
            }
            error={
              !slugValid && values.slug.length > 0
                ? "Format invalide — utilisez uniquement des lettres minuscules, chiffres et tirets"
                : slugStatus === "taken"
                ? "Ce slug est déjà utilisé par un autre module"
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">/modules/</span>
              <input
                type="text"
                value={values.slug}
                onChange={(e) => { setSlugTouched(true); update("slug", slugify(e.target.value)); }}
                placeholder="vaccination"
                className={`${INPUT_CLASS} flex-1 font-mono ${slugStatus === "taken" ? "ring-2 ring-red-300" : ""}`}
                required
              />
            </div>
          </Field>

          <Field label="Description" hint="Affichée sous le titre dans le catalogue élève">
            <textarea
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Comment ça marche ? Pour qui ? Quand ?"
              rows={3}
              className={INPUT_CLASS}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Durée estimée (min)">
              <input
                type="number"
                min={1}
                value={values.duration}
                onChange={(e) => update("duration", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="20"
                className={INPUT_CLASS}
              />
            </Field>

            <Field label="Catégorie">
              <select
                value={values.categoryId}
                onChange={(e) => update("categoryId", e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* Section Apparence */}
        <Section
          step={2}
          title="Apparence"
          subtitle="Mascotte et couleurs du module"
          accent="#2A8970"
        >
          {/* Palettes */}
          <Field
            label="Palettes prêtes"
            hint="Appliquez 4 couleurs cohérentes d'un clic"
          >
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(i)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-xs font-semibold text-gray-700 transition-colors"
                >
                  <span className="flex">
                    <span className="w-3 h-4 rounded-l" style={{ background: p.colors.colorPrimary }} />
                    <span className="w-3 h-4" style={{ background: p.colors.colorSecondary }} />
                    <span className="w-3 h-4 rounded-r" style={{ background: p.colors.colorCard }} />
                  </span>
                  {p.name}
                </button>
              ))}
            </div>
          </Field>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-3">
            <ColorPicker
              label="Couleur principale"
              value={values.colorPrimary}
              onChange={(v) => update("colorPrimary", v)}
            />
            <ColorPicker
              label="Couleur secondaire"
              value={values.colorSecondary}
              onChange={(v) => update("colorSecondary", v)}
            />
            <ColorPicker
              label="Fond de card"
              value={values.colorCard}
              onChange={(v) => update("colorCard", v)}
            />
            <ColorPicker
              label="Fond secondaire"
              value={values.colorCardSecondary}
              onChange={(v) => update("colorCardSecondary", v)}
            />
          </div>

          {/* Mascotte picker */}
          <Field label="Mascotte" hint="Choisissez le personnage qui accompagne le module">
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_MASCOTTES.map((m) => {
                const selected = values.mascotte === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update("mascotte", m)}
                    className={`relative aspect-square rounded-xl border-2 p-2 transition-all ${
                      selected
                        ? "border-[#2A8970] bg-[#EBF6F3]"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2A8970] flex items-center justify-center">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <Image
                      src={`/assets/mascotte/${m}`}
                      alt={m}
                      width={60}
                      height={60}
                      className="w-full h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-5 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!formValid || submitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Enregistrement..." : submitLabel}
          </button>
        </div>
      </div>

      {/* Colonne aperçu (2/5), sticky */}
      <div className="lg:col-span-2">
        <div className="lg:sticky lg:top-[160px] space-y-3">
          {/* Aperçu carte module */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <Sparkles size={13} className="text-amber-500" />
            Aperçu en direct
          </div>
          <ModuleCardPreview values={values} />
          <p className="text-xs text-gray-400 leading-relaxed">
            Voici ce que verront vos éducateurs et élèves dans le catalogue.
          </p>

          {/* Aperçu barre de progression */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider pt-4 mt-2 border-t border-gray-100">
            <BarChart3 size={13} className="text-[#1B6B8A]" />
            Barre de progression
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden relative">
            <GameProgress
              level={1}
              src="/assets/rive/progressbar_default_enchenced.riv"
              stepColor={values.colorPrimary}
              width={340}
              height={145}
            />
            {values.mascotte && (
              <div className="absolute bottom-2 left-2 w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                <Image
                  src={`/assets/mascotte/${values.mascotte}`}
                  alt="mascotte"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Mascotte et couleur des steps appliquées en temps réel.
          </p>
        </div>
      </div>

    </form>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Section({
  step,
  title,
  subtitle,
  accent,
  children,
}: {
  step: number;
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shrink-0"
          style={{ background: accent }}
        >
          {step}
        </span>
        <div>
          <h2 className="text-base font-bold text-[#1A1A1A]">{title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="space-y-4 pl-10">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-400">{hint}</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
          style={{ padding: 0 }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono outline-none text-gray-700"
        />
      </div>
    </div>
  );
}

function ModuleCardPreview({ values }: { values: ModuleFormValues }) {
  const title = values.title.trim() || "Titre du module";
  const description = values.description.trim() || "Une courte description apparaîtra ici une fois renseignée.";
  return (
    <div
      className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
      style={{ background: values.colorCard }}
    >
      <div
        className="h-2 w-full"
        style={{ background: `linear-gradient(90deg, ${values.colorPrimary}, ${values.colorSecondary})` }}
      />
      <div className="p-5 flex items-start gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: values.colorCardSecondary }}
        >
          {values.mascotte && (
            <Image
              src={`/assets/mascotte/${values.mascotte}`}
              alt="mascotte"
              width={56}
              height={56}
              className="object-contain"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-base" style={{ color: values.colorPrimary }}>
            {title}
          </h3>
          {values.duration !== "" && (
            <p className="text-[11px] mt-0.5" style={{ color: values.colorSecondary }}>
              ⏱ {values.duration} min
            </p>
          )}
          <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>
      </div>
      <div
        className="px-5 py-3 text-xs font-semibold text-white text-center"
        style={{ background: values.colorPrimary }}
      >
        Découvrir le module →
      </div>
    </div>
  );
}

function lightenHex(hex: string, t = 0.35): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lr = Math.round(r + (255 - r) * t).toString(16).padStart(2, "0");
  const lg = Math.round(g + (255 - g) * t).toString(16).padStart(2, "0");
  const lb = Math.round(b + (255 - b) * t).toString(16).padStart(2, "0");
  return `#${lr}${lg}${lb}`;
}

function ProgressStepsPreview({ color, mascotte }: { color: string; mascotte: string }) {
  const light = lightenHex(color);
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 flex flex-col items-center gap-4">
      <div className="flex items-center gap-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center">
            <div
              className="w-10 h-10 rounded-full shadow-sm flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: i === 1
                  ? `radial-gradient(circle at 38% 35%, ${light}, ${color})`
                  : "#d1d5db",
              }}
            >
              {i === 1 ? <Check size={14} strokeWidth={3} /> : i}
            </div>
            {i < 5 && (
              <div className="w-8 h-1 rounded-full" style={{ background: "#e5e7eb" }} />
            )}
          </div>
        ))}
      </div>
      {mascotte && (
        <Image
          src={`/assets/mascotte/${mascotte}`}
          alt="mascotte"
          width={72}
          height={72}
          className="object-contain"
        />
      )}
    </div>
  );
}

