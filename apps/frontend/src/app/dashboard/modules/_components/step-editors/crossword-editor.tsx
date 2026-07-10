"use client";

import { useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { EditorShell, SectionHeader, Field, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import {
  computeCrossword,
  normalizeAnswer,
  shortId,
  type AdminStep,
  type AdminGameData,
  type CrosswordWord,
} from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

function wordsFromStep(step: AdminStep): CrosswordWord[] {
  const qd = step.gameData?.[0]?.questionData as { words?: CrosswordWord[] } | undefined;
  if (qd?.words?.length) return qd.words;
  return [
    { id: shortId(), answer: "NON", clue: "Ce qu'il faut savoir dire face à la pression", row: 0, col: 0, dir: "H" },
    { id: shortId(), answer: "NICOTINE", clue: "Produit du tabac qui rend dépendant", row: 0, col: 0, dir: "V" },
  ];
}

export function CrosswordEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [words, setWords] = useState<CrosswordWord[]>(() => wordsFromStep(step));

  const { rows, cols, cells, conflicts } = useMemo(() => computeCrossword(words), [words]);

  const validationError = useMemo(() => {
    if (words.length === 0) return "Ajoutez au moins un mot";
    for (const [i, w] of words.entries()) {
      if (normalizeAnswer(w.answer).length < 2) return `Mot ${i + 1} : réponse trop courte (min. 2 lettres)`;
      if (!w.clue.trim()) return `Mot ${i + 1} : définition manquante`;
      if (w.row < 0 || w.col < 0) return `Mot ${i + 1} : coordonnées invalides`;
    }
    if (conflicts > 0) return "Des mots se croisent sur des lettres différentes (cases rouges)";
    return null;
  }, [words, conflicts]);

  function update(id: string, patch: Partial<CrosswordWord>) {
    setWords((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }
  function addWord() {
    setWords((ws) => [...ws, { id: shortId(), answer: "", clue: "", row: 0, col: 0, dir: "H" }]);
  }
  function removeWord(id: string) {
    setWords((ws) => ws.filter((w) => w.id !== id));
  }

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            words: words.map((w) => ({
              id: w.id,
              answer: w.answer.trim(),
              clue: w.clue.trim(),
              row: w.row,
              col: w.col,
              dir: w.dir,
            })),
          },
          correctAnswer: {},
        },
      ],
    });
  }

  const CELL = 28;

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
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        {/* Liste des mots */}
        <div className="space-y-3">
          <SectionHeader title="Mots" count={words.length} onAdd={addWord} addLabel="Mot" color={color} />

          {words.map((w, idx) => (
            <div key={w.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                  MOT {idx + 1}
                </span>
                <button onClick={() => removeWord(w.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Réponse">
                  <input
                    type="text"
                    value={w.answer}
                    onChange={(e) => update(w.id, { answer: e.target.value })}
                    placeholder="NICOTINE"
                    className={`${INPUT_CLASS} uppercase font-mono`}
                  />
                </Field>
                <Field label="Sens">
                  <div className="flex gap-1.5">
                    {(["H", "V"] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => update(w.id, { dir: d })}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
                          w.dir === d ? "text-white" : "bg-white text-gray-500 border border-gray-200"
                        }`}
                        style={w.dir === d ? { background: color } : undefined}
                      >
                        {d === "H" ? "→ Horiz." : "↓ Vert."}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>

              <Field label="Définition">
                <input
                  type="text"
                  value={w.clue}
                  onChange={(e) => update(w.id, { clue: e.target.value })}
                  placeholder="Produit du tabac qui rend dépendant"
                  className={INPUT_CLASS}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Ligne (départ)">
                  <input
                    type="number"
                    min={0}
                    value={w.row}
                    onChange={(e) => update(w.id, { row: Math.max(0, Number(e.target.value) || 0) })}
                    className={INPUT_CLASS}
                  />
                </Field>
                <Field label="Colonne (départ)">
                  <input
                    type="number"
                    min={0}
                    value={w.col}
                    onChange={(e) => update(w.id, { col: Math.max(0, Number(e.target.value) || 0) })}
                    className={INPUT_CLASS}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {/* Aperçu de la grille */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Aperçu</p>
          <div className="bg-white border border-gray-200 rounded-xl p-3 overflow-auto">
            {rows === 0 ? (
              <p className="text-xs text-gray-400 italic p-4">La grille apparaîtra ici.</p>
            ) : (
              <div className="relative" style={{ width: cols * CELL, height: rows * CELL }}>
                {[...cells.values()].map((cell) => (
                  <div
                    key={`${cell.r},${cell.c}`}
                    className="absolute flex items-center justify-center text-xs font-black rounded-sm border"
                    style={{
                      left: cell.c * CELL,
                      top: cell.r * CELL,
                      width: CELL,
                      height: CELL,
                      background: cell.conflict ? "#FEE2E2" : "#fff",
                      borderColor: cell.conflict ? "#DC2626" : "#D1D5DB",
                      color: cell.conflict ? "#B91C1C" : "#1A1A1A",
                    }}
                  >
                    {cell.number && (
                      <span className="absolute top-0 left-0.5 text-[7px] font-bold text-gray-400 leading-none">
                        {cell.number}
                      </span>
                    )}
                    {cell.solution}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed max-w-[220px]">
            Ligne/Colonne = case de départ (0 = coin haut-gauche). Les mots doivent partager la même
            lettre à chaque croisement (sinon la case passe en rouge).
          </p>
        </div>
      </div>
    </EditorShell>
  );
}
