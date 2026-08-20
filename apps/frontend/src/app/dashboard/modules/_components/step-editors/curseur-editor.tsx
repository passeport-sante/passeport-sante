"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, MessageSquare, Target, Ruler } from "lucide-react";
import { EditorShell, SectionHeader, Field, INPUT_CLASS, TEXTAREA_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, curseurDisplayValue, type AdminStep, type AdminGameData, type CurseurItem, type CurseurMode } from "@/lib/steps-admin";

const MODE_META: Record<CurseurMode, { label: string; icon: typeof MessageSquare }> = {
  opinion: { label: "Opinion", icon: MessageSquare },
  estimation: { label: "Estimation", icon: Target },
  precis: { label: "Précis", icon: Ruler },
};

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: { content: { title?: string; instructions?: string }; gameData: AdminGameData[] }) => Promise<void>;
}

function itemsFromStep(step: AdminStep): CurseurItem[] {
  const qd = step.gameData?.[0]?.questionData as { items?: CurseurItem[] } | undefined;
  if (qd?.items?.length) {
    return qd.items.map((it) => ({
      id: it.id ?? shortId(),
      text: it.text ?? "",
      leftLabel: it.leftLabel ?? "Pas du tout",
      rightLabel: it.rightLabel ?? "Tout à fait",
      mode: it.mode === "estimation" || it.mode === "precis" ? it.mode : "opinion",
      target: typeof it.target === "number" ? it.target : it.mode === "precis" ? 0 : 50,
      tolerance: typeof it.tolerance === "number" ? it.tolerance : 15,
      valueMin: typeof it.valueMin === "number" ? it.valueMin : 0,
      valueMax: typeof it.valueMax === "number" ? it.valueMax : 100,
      unit: it.unit ?? "",
      step: typeof it.step === "number" ? it.step : 1,
    }));
  }
  return [{ id: shortId(), text: "", leftLabel: "Pas du tout", rightLabel: "Tout à fait", mode: "opinion", target: 50, tolerance: 15, valueMin: 0, valueMax: 100, unit: "", step: 1 }];
}

export function CurseurEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [items, setItems] = useState<CurseurItem[]>(() => itemsFromStep(step));

  const validationError = useMemo(() => {
    if (items.length === 0) return "Ajoutez au moins une affirmation";
    for (const [i, it] of items.entries()) {
      if (!it.text.trim()) return `Affirmation ${i + 1} : le texte est vide`;
      if (!it.leftLabel.trim() || !it.rightLabel.trim()) return `Affirmation ${i + 1} : les deux extrémités doivent être nommées`;
      if (it.mode === "precis") {
        const min = it.valueMin ?? 0;
        const max = it.valueMax ?? 100;
        if (max <= min) return `Affirmation ${i + 1} : la valeur de droite doit être supérieure à celle de gauche`;
        const target = it.target ?? min;
        if (target < min || target > max) return `Affirmation ${i + 1} : la bonne réponse doit être comprise dans l'échelle`;
        if (!it.step || it.step <= 0) return `Affirmation ${i + 1} : le pas de graduation doit être positif`;
      }
    }
    return null;
  }, [items]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            items: items.map((it) => ({
              id: it.id,
              text: it.text.trim(),
              leftLabel: it.leftLabel.trim(),
              rightLabel: it.rightLabel.trim(),
              mode: it.mode,
              ...(it.mode === "estimation"
                ? {
                    target: it.target ?? 50,
                    tolerance: it.tolerance ?? 15,
                    valueMin: it.valueMin ?? 0,
                    valueMax: it.valueMax ?? 100,
                    unit: it.unit?.trim() || undefined,
                  }
                : it.mode === "precis"
                  ? {
                      // Precis : target en valeur RÉELLE (pas en %), aucune tolérance.
                      target: it.target ?? it.valueMin ?? 0,
                      valueMin: it.valueMin ?? 0,
                      valueMax: it.valueMax ?? 100,
                      unit: it.unit?.trim() || undefined,
                      step: it.step ?? 1,
                    }
                  : {}),
            })),
          },
          correctAnswer: {},
        },
      ],
    });
  }

  function addItem() {
    setItems((xs) => [
      ...xs,
      { id: shortId(), text: "", leftLabel: "Pas du tout", rightLabel: "Tout à fait", mode: "opinion", target: 50, tolerance: 15, valueMin: 0, valueMax: 100, unit: "", step: 1 },
    ]);
  }
  function update(id: string, patch: Partial<CurseurItem>) {
    setItems((xs) => xs.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function removeItem(id: string) {
    setItems((xs) => xs.filter((it) => it.id !== id));
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
      <SectionHeader title="Affirmations" count={items.length} onAdd={addItem} addLabel="Affirmation" color={color} />
      <p className="text-[11px] text-gray-400 -mt-2">
        <b>Opinion</b> = pas de bonne réponse (l&apos;élève donne son avis). <b>Estimation</b> = le curseur doit tomber dans une
        zone acceptée (fait approximatif, ex. une durée moyenne). <b>Précis</b> = une échelle graduée avec une seule bonne
        réponse exacte, sans marge (ex. un nombre d&apos;années fixe).
      </p>

      <div className="space-y-4">
        {items.map((it, idx) => (
          <div key={it.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                N° {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                {(["opinion", "estimation", "precis"] as CurseurMode[]).map((m) => {
                  const Icon = MODE_META[m].icon;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update(it.id, { mode: m })}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        it.mode === m ? "text-white" : "bg-white text-gray-400 border border-gray-200 hover:text-gray-600"
                      }`}
                      style={it.mode === m ? { background: color } : undefined}
                    >
                      <Icon size={11} />
                      {MODE_META[m].label}
                    </button>
                  );
                })}
                <button onClick={() => removeItem(it.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <textarea
              value={it.text}
              onChange={(e) => update(it.id, { text: e.target.value })}
              placeholder="Affirmation ou question (ex : « Bouger, c'est réservé aux sportifs. » Es-tu d'accord ?)"
              className={TEXTAREA_CLASS}
              rows={2}
            />

            <div className="grid grid-cols-2 gap-2">
              <Field label="Étiquette gauche">
                <input type="text" value={it.leftLabel} onChange={(e) => update(it.id, { leftLabel: e.target.value })} placeholder="Pas du tout" className={INPUT_CLASS} />
              </Field>
              <Field label="Étiquette droite">
                <input type="text" value={it.rightLabel} onChange={(e) => update(it.id, { rightLabel: e.target.value })} placeholder="Tout à fait" className={INPUT_CLASS} />
              </Field>
            </div>

            {it.mode === "estimation" && (
              <div className="space-y-3 pt-1 border-t border-gray-200">
                {/* Bornes réelles de l'échelle : c'est ce qui permet d'afficher une
                    vraie valeur ("62 min") à l'élève plutôt qu'un pourcentage muet. */}
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Valeur à gauche">
                    <input
                      type="number"
                      value={it.valueMin ?? 0}
                      onChange={(e) => update(it.id, { valueMin: Number(e.target.value) || 0 })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Valeur à droite">
                    <input
                      type="number"
                      value={it.valueMax ?? 100}
                      onChange={(e) => update(it.id, { valueMax: Number(e.target.value) || 0 })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Unité">
                    <input
                      type="text"
                      value={it.unit ?? ""}
                      onChange={(e) => update(it.id, { unit: e.target.value })}
                      placeholder="min, ans, h…"
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Bonne réponse</span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: "#0D9488" }}>
                    {curseurDisplayValue(it, it.target ?? 50)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={it.target ?? 50}
                  onChange={(e) => update(it.id, { target: Number(e.target.value) })}
                  className="w-full accent-[#0D9488]"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Tolérance acceptée</span>
                  <span className="text-[11px] font-mono text-gray-500">
                    ± {Math.round(((it.tolerance ?? 15) / 100) * ((it.valueMax ?? 100) - (it.valueMin ?? 0)))} {it.unit ?? ""}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={it.tolerance ?? 15}
                  onChange={(e) => update(it.id, { tolerance: Number(e.target.value) })}
                  className="w-full accent-gray-400"
                />

                <p className="text-[11px] text-gray-400">
                  Zone acceptée : {curseurDisplayValue(it, Math.max(0, (it.target ?? 50) - (it.tolerance ?? 15)))} – {curseurDisplayValue(it, Math.min(100, (it.target ?? 50) + (it.tolerance ?? 15)))}
                </p>
              </div>
            )}

            {it.mode === "precis" && (
              <div className="space-y-3 pt-1 border-t border-gray-200">
                {/* Échelle graduée : contrairement à l'estimation, il n'y a qu'UNE
                    seule bonne réponse exacte — pas de zone de tolérance. */}
                <div className="grid grid-cols-4 gap-2">
                  <Field label="Valeur à gauche">
                    <input
                      type="number"
                      value={it.valueMin ?? 0}
                      onChange={(e) => update(it.id, { valueMin: Number(e.target.value) || 0 })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Valeur à droite">
                    <input
                      type="number"
                      value={it.valueMax ?? 100}
                      onChange={(e) => update(it.id, { valueMax: Number(e.target.value) || 0 })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Pas">
                    <input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={it.step ?? 1}
                      onChange={(e) => update(it.id, { step: Math.max(0.1, Number(e.target.value) || 1) })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Unité">
                    <input
                      type="text"
                      value={it.unit ?? ""}
                      onChange={(e) => update(it.id, { unit: e.target.value })}
                      placeholder="ans, min…"
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>

                <Field label="La bonne réponse (valeur exacte)">
                  <input
                    type="number"
                    min={it.valueMin ?? 0}
                    max={it.valueMax ?? 100}
                    step={it.step ?? 1}
                    value={it.target ?? it.valueMin ?? 0}
                    onChange={(e) => update(it.id, { target: Number(e.target.value) })}
                    className={INPUT_CLASS}
                  />
                </Field>

                <p className="text-[11px] text-gray-400">
                  L&apos;élève verra une règle graduée par pas de {it.step ?? 1} {it.unit ?? ""} entre {it.valueMin ?? 0} et{" "}
                  {it.valueMax ?? 100} {it.unit ?? ""} : seule la valeur exacte ({it.target ?? it.valueMin ?? 0} {it.unit ?? ""})
                  sera acceptée.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addItem}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouvelle affirmation
      </button>
    </EditorShell>
  );
}
