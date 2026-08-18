"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, Check, X } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, type AdminStep, type AdminGameData, type SwipeCard, type SwipeAnswer } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: { content: { title?: string; instructions?: string }; gameData: AdminGameData[] }) => Promise<void>;
}

function cardsFromStep(step: AdminStep): SwipeCard[] {
  const qd = step.gameData?.[0]?.questionData as { cards?: SwipeCard[] } | undefined;
  if (qd?.cards?.length) {
    return qd.cards.map((c) => ({
      id: c.id ?? shortId(),
      text: c.text ?? "",
      answer: c.answer === "faux" ? "faux" : "vrai",
      explanation: c.explanation,
    }));
  }
  return [{ id: shortId(), text: "", answer: "vrai" }];
}

export function SwipeEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [cards, setCards] = useState<SwipeCard[]>(() => cardsFromStep(step));

  const validationError = useMemo(() => {
    if (cards.length === 0) return "Ajoutez au moins une carte";
    for (const [i, c] of cards.entries()) {
      if (!c.text.trim()) return `Carte ${i + 1} : l'affirmation est vide`;
    }
    return null;
  }, [cards]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            cards: cards.map((c) => ({
              id: c.id,
              text: c.text.trim(),
              answer: c.answer,
              explanation: c.explanation?.trim() || undefined,
            })),
          },
          correctAnswer: {},
        },
      ],
    });
  }

  function addCard() {
    setCards((cs) => [...cs, { id: shortId(), text: "", answer: "vrai" }]);
  }
  function update(id: string, patch: Partial<SwipeCard>) {
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
      <SectionHeader title="Cartes" count={cards.length} onAdd={addCard} addLabel="Carte" color={color} />
      <p className="text-[11px] text-gray-400 -mt-2">
        Une affirmation par carte. L&apos;élève balaye à droite pour <b>Vrai</b>, à gauche pour <b>Faux</b>.
      </p>

      <div className="space-y-3">
        {cards.map((c, idx) => (
          <div key={c.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                CARTE {idx + 1}
              </span>
              <button onClick={() => removeCard(c.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>

            <input
              type="text"
              value={c.text}
              onChange={(e) => update(c.id, { text: e.target.value })}
              placeholder="Affirmation (ex : Faire du sport, c'est forcément en club.)"
              className={INPUT_CLASS}
            />

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mr-1">Réponse :</span>
              {(["faux", "vrai"] as SwipeAnswer[]).map((a) => {
                const active = c.answer === a;
                const bg = a === "vrai" ? "#16A34A" : "#DC2626";
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => update(c.id, { answer: a })}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      active ? "text-white" : "bg-white text-gray-500 border border-gray-200"
                    }`}
                    style={active ? { background: bg } : undefined}
                  >
                    {a === "vrai" ? <Check size={13} /> : <X size={13} />}
                    {a === "vrai" ? "Vrai (→)" : "Faux (←)"}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={c.explanation ?? ""}
              onChange={(e) => update(c.id, { explanation: e.target.value })}
              placeholder="Explication affichée après la réponse (facultatif)"
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
