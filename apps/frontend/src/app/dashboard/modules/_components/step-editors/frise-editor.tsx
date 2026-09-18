"use client";

import { useMemo, useRef, useState } from "react";
import { Trash2, Plus, ImageOff, Loader2, Upload } from "lucide-react";
import { EditorShell, SectionHeader, Field, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { uploadImageFile } from "@/lib/upload";
import {
  shortId,
  friseGraduations,
  normalizeFriseData,
  FRISE_MAX_GRADUATIONS,
  FRISE_DEFAULT_LINK_LABEL,
  type AdminStep,
  type AdminGameData,
  type FriseCard,
  type FriseData,
} from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: { content: { title?: string; instructions?: string }; gameData: AdminGameData[] }) => Promise<void>;
}

function CardImageField({ value, color, onChange }: { value: string; color: string; onChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      onChange(await uploadImageFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="flex items-start gap-2">
      <div className="w-14 h-14 rounded-lg bg-white border border-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
        {value.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.trim()} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={16} className="text-gray-300" />
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image de la carte (facultatif)"
            className={`${INPUT_CLASS} text-xs`}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold text-white shrink-0 disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? "Envoi…" : "Importer"}
          </button>
        </div>
        {error && <p className="text-[11px] text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export function FriseEditor({ step, color, onSave }: Props) {
  const initial = normalizeFriseData(step.gameData?.[0]?.questionData as Partial<FriseData> | undefined);

  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [axisLabel, setAxisLabel] = useState(initial.axisLabel);
  const [min, setMin] = useState(initial.min);
  const [max, setMax] = useState(initial.max);
  const [stepSize, setStepSize] = useState(initial.step);
  const [linkLabel, setLinkLabel] = useState(initial.linkLabel);
  const [cards, setCards] = useState<FriseCard[]>(
    initial.cards.length ? initial.cards : [{ id: shortId(), text: "", value: initial.min }],
  );

  const graduations = useMemo(() => friseGraduations(min, max, stepSize), [min, max, stepSize]);

  const validationError = useMemo(() => {
    if (max <= min) return "La fin de la frise doit être supérieure au début";
    if (!(stepSize > 0)) return "Le pas doit être positif";
    if (graduations.length === 0)
      return `Trop de graduations : ${FRISE_MAX_GRADUATIONS} maximum, choisis un pas plus grand`;
    if (cards.length < 2) return "Ajoutez au moins 2 cartes";
    for (const [i, c] of cards.entries()) {
      if (!c.text.trim()) return `Carte ${i + 1} : le texte est vide`;
      if (!graduations.includes(c.value)) return `Carte ${i + 1} : choisis une position sur la frise`;
      if (c.link?.trim() && !/^https?:\/\/\S+$/i.test(c.link.trim()))
        return `Carte ${i + 1} : le lien doit être une adresse web complète (https://…)`;
    }
    return null;
  }, [min, max, stepSize, graduations, cards]);

  const hasLinks = cards.some((c) => c.link?.trim());

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            axisLabel: axisLabel.trim(),
            min,
            max,
            step: stepSize,
            linkLabel: linkLabel.trim() || FRISE_DEFAULT_LINK_LABEL,
            cards: cards.map((c) => ({
              id: c.id,
              text: c.text.trim(),
              value: c.value,
              explanation: c.explanation?.trim() || undefined,
              imageUrl: c.imageUrl?.trim() || undefined,
              link: c.link?.trim() || undefined,
            })),
          },
          correctAnswer: {},
        },
      ],
    });
  }

  function addCard() {
    setCards((cs) => [...cs, { id: shortId(), text: "", value: graduations[0] ?? min }]);
  }
  function update(id: string, patch: Partial<FriseCard>) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeCard(id: string) {
    setCards((cs) => cs.filter((c) => c.id !== id));
  }

  return (
    <EditorShell
      step={step}
      color={color}
      title={title}
      instructions={instructions}
      onChangeTitle={setTitle}
      onChangeInstructions={setInstructions}
      onSave={handleSave}
      isDirty={true}
      validationError={validationError}
    >
      <SectionHeader title="La frise" color={color} />
      <div className="space-y-3">
        <Field label="Intitulé de la frise" hint="Affiché au-dessus de la frise pour dire ce que mesurent les graduations.">
          <input
            type="text"
            value={axisLabel}
            onChange={(e) => setAxisLabel(e.target.value)}
            placeholder="Ex : Années d'études après le bac"
            className={INPUT_CLASS}
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Début">
            <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value) || 0)} className={INPUT_CLASS} />
          </Field>
          <Field label="Fin">
            <input type="number" value={max} onChange={(e) => setMax(Number(e.target.value) || 0)} className={INPUT_CLASS} />
          </Field>
          <Field label="Pas">
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={stepSize}
              onChange={(e) => setStepSize(Number(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </Field>
        </div>
        <p className="text-[11px] text-gray-400">
          {graduations.length > 0
            ? `${graduations.length} graduations : ${graduations.slice(0, 6).join(", ")}${graduations.length > 6 ? ", …" : ""}`
            : `Aucune graduation valide (${FRISE_MAX_GRADUATIONS} maximum).`}
        </p>
        <Field
          label="Texte du bouton de lien"
          hint={
            hasLinks
              ? "Affiché dans la pop-up d'une carte bien placée, si elle a un lien."
              : "Utilisé seulement pour les cartes qui ont un lien."
          }
        >
          <input
            type="text"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder={FRISE_DEFAULT_LINK_LABEL}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

      <SectionHeader title="Cartes à placer" count={cards.length} onAdd={addCard} addLabel="Carte" color={color} />
      <p className="text-[11px] text-gray-400 -mt-2">
        L&apos;élève pose chaque carte sur la bonne graduation. Plusieurs cartes peuvent partager la même position. Les cartes lui
        sont présentées mélangées.
      </p>

      <div className="space-y-3">
        {cards.map((c, idx) => (
          <div key={c.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                CARTE {idx + 1}
              </span>
              <button onClick={() => removeCard(c.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer" disabled={cards.length <= 2}>
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <input
                type="text"
                value={c.text}
                onChange={(e) => update(c.id, { text: e.target.value })}
                placeholder="Ex : Médecin généraliste"
                className={INPUT_CLASS}
              />
              <select
                value={graduations.includes(c.value) ? c.value : ""}
                onChange={(e) => update(c.id, { value: Number(e.target.value) })}
                aria-label={`Position de la carte ${idx + 1}`}
                className={INPUT_CLASS + " w-28"}
              >
                <option value="" disabled>
                  Position
                </option>
                {graduations.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <CardImageField value={c.imageUrl ?? ""} color={color} onChange={(url) => update(c.id, { imageUrl: url })} />

            <input
              type="url"
              value={c.link ?? ""}
              onChange={(e) => update(c.id, { link: e.target.value })}
              placeholder="Lien (facultatif) — ex. https://www.onisep.fr/ressources/univers-metier/metiers/…"
              className={INPUT_CLASS + " text-xs"}
            />

            <input
              type="text"
              value={c.explanation ?? ""}
              onChange={(e) => update(c.id, { explanation: e.target.value })}
              placeholder="Explication affichée après la correction (facultatif)"
              className={INPUT_CLASS + " text-xs"}
            />
          </div>
        ))}
      </div>

      <button
        onClick={addCard}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouvelle carte
      </button>
    </EditorShell>
  );
}
