"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, MessageSquare, Target } from "lucide-react";
import { EditorShell, SectionHeader, Field, INPUT_CLASS, TEXTAREA_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, type AdminStep, type AdminGameData, type CurseurItem, type CurseurMode } from "@/lib/steps-admin";

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
      mode: it.mode === "estimation" ? "estimation" : "opinion",
      target: typeof it.target === "number" ? it.target : 50,
      tolerance: typeof it.tolerance === "number" ? it.tolerance : 15,
    }));
  }
  return [{ id: shortId(), text: "", leftLabel: "Pas du tout", rightLabel: "Tout à fait", mode: "opinion", target: 50, tolerance: 15 }];
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
              // Cible/tolérance uniquement pertinentes en mode estimation.
              ...(it.mode === "estimation"
                ? { target: it.target ?? 50, tolerance: it.tolerance ?? 15 }
                : {}),
            })),
          },
          correctAnswer: {},
        },
      ],
    });
  }

  function addItem() {
    setItems((xs) => [...xs, { id: shortId(), text: "", leftLabel: "Pas du tout", rightLabel: "Tout à fait", mode: "opinion", target: 50, tolerance: 15 }]);
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
        <b>Opinion</b> = pas de bonne réponse (l&apos;élève donne son avis). <b>Estimation</b> = le curseur doit tomber dans la bonne zone.
      </p>

      <div className="space-y-4">
        {items.map((it, idx) => (
          <div key={it.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                N° {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                {(["opinion", "estimation"] as CurseurMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update(it.id, { mode: m })}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      it.mode === m ? "text-white" : "bg-white text-gray-400 border border-gray-200 hover:text-gray-600"
                    }`}
                    style={it.mode === m ? { background: color } : undefined}
                  >
                    {m === "opinion" ? <MessageSquare size={11} /> : <Target size={11} />}
                    {m === "opinion" ? "Opinion" : "Estimation"}
                  </button>
                ))}
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
              <div className="space-y-2 pt-1 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Bonne zone</span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {Math.max(0, (it.target ?? 50) - (it.tolerance ?? 15))} – {Math.min(100, (it.target ?? 50) + (it.tolerance ?? 15))} / 100
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
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Cible (0–100)">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={it.target ?? 50}
                      onChange={(e) => update(it.id, { target: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Field label="Tolérance (±)">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={it.tolerance ?? 15}
                      onChange={(e) => update(it.id, { tolerance: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
                      className={INPUT_CLASS}
                    />
                  </Field>
                </div>
                <p className="text-[11px] text-gray-400">
                  0 = tout à gauche, 100 = tout à droite. La réponse est juste si le curseur tombe dans la zone.
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
