"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { EditorShell, Field, SectionHeader, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import type { AdminStep, AdminGameData } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

type Item = { text: string; correct: string };

export function KanbanEditor({ step, color, onSave }: Props) {
  const initial = step.gameData?.[0];
  const initialCategories = (initial?.questionData as { categories?: string[] } | undefined)?.categories ?? ["Vrai", "Intox"];
  const initialItemsArr = (initial?.questionData as { items?: string[] } | undefined)?.items ?? [];
  const initialCorrect = (initial?.correctAnswer as Record<string, string> | undefined) ?? {};
  const initialItems: Item[] = initialItemsArr.map((text) => ({ text, correct: initialCorrect[text] ?? initialCategories[0] ?? "" }));

  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [categories, setCategories] = useState<string[]>(initialCategories);
  const [items, setItems] = useState<Item[]>(initialItems.length ? initialItems : [{ text: "", correct: initialCategories[0] ?? "" }]);

  const validationError = useMemo(() => {
    if (categories.length < 2) return "Il faut au moins 2 catégories";
    if (new Set(categories.map((c) => c.trim().toLowerCase())).size !== categories.length) return "Les catégories doivent être uniques";
    if (categories.some((c) => !c.trim())) return "Toutes les catégories doivent avoir un nom";
    if (items.length === 0) return "Ajoutez au moins une affirmation";
    if (items.some((i) => !i.text.trim())) return "Toutes les affirmations doivent être renseignées";
    if (items.some((i) => !categories.includes(i.correct))) return "Chaque affirmation doit être assignée à une catégorie";
    return null;
  }, [categories, items]);

  const isDirty = true; // pour la v1, on autorise toujours d'enregistrer

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(initial?.id ? { id: initial.id } : {}),
          questionData: {
            categories: categories.map((c) => c.trim()),
            items: items.map((i) => i.text.trim()),
          },
          correctAnswer: Object.fromEntries(items.map((i) => [i.text.trim(), i.correct])),
        },
      ],
    });
  }

  function addCategory() {
    setCategories((cs) => [...cs, ""]);
  }
  function updateCategory(idx: number, val: string) {
    setCategories((cs) => cs.map((c, i) => (i === idx ? val : c)));
    // Si une catégorie est renommée, propager dans items
    setItems((its) => its.map((it) => (it.correct === categories[idx] ? { ...it, correct: val } : it)));
  }
  function removeCategory(idx: number) {
    if (categories.length <= 2) return;
    const removed = categories[idx];
    setCategories((cs) => cs.filter((_, i) => i !== idx));
    // Réassigner les items qui pointaient vers cette catégorie
    setItems((its) => its.map((it) => (it.correct === removed ? { ...it, correct: categories.find((c, i) => i !== idx) ?? "" } : it)));
  }

  function addItem() {
    setItems((its) => [...its, { text: "", correct: categories[0] ?? "" }]);
  }
  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((its) => its.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((its) => its.filter((_, i) => i !== idx));
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
      isDirty={isDirty}
      validationError={validationError}
    >
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        {/* Catégories — 2/5 */}
        <div className="md:col-span-2 space-y-3">
          <SectionHeader
            title="Catégories"
            count={categories.length}
            onAdd={categories.length < 4 ? addCategory : undefined}
            color={color}
          />
          <div className="space-y-2">
            {categories.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: color }}>
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={c}
                  onChange={(e) => updateCategory(idx, e.target.value)}
                  placeholder={`Catégorie ${idx + 1}`}
                  className={INPUT_CLASS}
                />
                {categories.length > 2 && (
                  <button onClick={() => removeCategory(idx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Min. 2 catégories, max. 4. Ex. "Vrai" / "Intox" pour un Vrai-Intox.
          </p>
        </div>

        {/* Affirmations — 3/5 */}
        <div className="md:col-span-3 space-y-3">
          <SectionHeader
            title="Affirmations à classer"
            count={items.length}
            onAdd={addItem}
            color={color}
          />
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 flex items-start gap-2 group">
                <span className="text-[11px] font-bold text-gray-400 mt-2">{idx + 1}</span>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItem(idx, { text: e.target.value })}
                    placeholder="Saisis une affirmation..."
                    className={INPUT_CLASS}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-gray-500">Bonne réponse :</span>
                    <div className="flex flex-wrap gap-1.5">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateItem(idx, { correct: c })}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                            item.correct === c
                              ? "text-white shadow-sm"
                              : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                          }`}
                          style={item.correct === c ? { background: color } : {}}
                        >
                          {c || "—"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={() => removeItem(idx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                  <Trash2 size={14} />
                </button>
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
        </div>
      </div>
    </EditorShell>
  );
}
