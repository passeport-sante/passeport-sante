"use client";

import { useMemo, useState } from "react";
import { Trash2, RefreshCw, Lock, Unlock, AlertTriangle } from "lucide-react";
import { EditorShell, SectionHeader, Field, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import {
  autoLayoutCrossword,
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
  if (qd?.words?.length) return qd.words.map((w) => ({ ...w, manual: w.manual ?? false }));
  return [
    { id: shortId(), answer: "NON", clue: "Ce qu'il faut savoir dire face à la pression", row: 0, col: 0, dir: "H" },
    { id: shortId(), answer: "NICOTINE", clue: "Produit du tabac qui rend dépendant", row: 0, col: 0, dir: "V" },
  ];
}

export function CrosswordEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [words, setWords] = useState<CrosswordWord[]>(() => wordsFromStep(step));
  // Change à chaque « Régénérer » pour proposer une autre disposition.
  const [seed, setSeed] = useState(1);

  // Les coordonnées affichées et enregistrées sont toujours celles du calcul :
  // le state ne porte que la saisie (réponse, définition, éventuel forçage).
  const { words: laidOut, isolated } = useMemo(() => autoLayoutCrossword(words, seed), [words, seed]);
  const { rows, cols, cells, conflicts } = useMemo(() => computeCrossword(laidOut), [laidOut]);

  const validationError = useMemo(() => {
    if (words.length === 0) return "Ajoutez au moins un mot";
    for (const [i, w] of words.entries()) {
      if (normalizeAnswer(w.answer).length < 2) return `Mot ${i + 1} : réponse trop courte (min. 2 lettres)`;
      if (!w.clue.trim()) return `Mot ${i + 1} : définition manquante`;
    }
    if (conflicts > 0) return "Des mots placés manuellement se croisent sur des lettres différentes (cases rouges)";
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
  // Passer en manuel part du placement automatique courant : l'admin ajuste
  // au lieu de repartir de (0,0).
  function toggleManual(id: string) {
    setWords((ws) =>
      ws.map((w) => {
        if (w.id !== id) return w;
        if (w.manual) return { ...w, manual: false };
        const auto = laidOut.find((x) => x.id === id);
        return { ...w, manual: true, row: auto?.row ?? w.row, col: auto?.col ?? w.col, dir: auto?.dir ?? w.dir };
      }),
    );
  }

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            words: laidOut.map((w) => ({
              id: w.id,
              answer: w.answer.trim(),
              clue: w.clue.trim(),
              row: w.row,
              col: w.col,
              dir: w.dir,
              manual: w.manual ?? false,
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

          <p className="text-[11px] text-gray-400 -mt-1">
            Saisissez la réponse et sa définition : la grille se construit toute seule en croisant les
            mots. Utilisez « Régénérer » pour une autre disposition.
          </p>

          {words.map((w, idx) => {
            const auto = laidOut.find((x) => x.id === w.id);
            const isIsolated = isolated.includes(w.id);
            return (
              <div key={w.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                      MOT {idx + 1}
                    </span>
                    {auto && normalizeAnswer(w.answer).length >= 2 && (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {auto.dir === "H" ? "→" : "↓"} L{auto.row} · C{auto.col}
                      </span>
                    )}
                    {isIsolated && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                        <AlertTriangle size={11} />
                        aucun croisement
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleManual(w.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                        w.manual ? "text-white" : "bg-white text-gray-400 border border-gray-200 hover:text-gray-600"
                      }`}
                      style={w.manual ? { background: color } : undefined}
                      title={w.manual ? "Replacer automatiquement" : "Fixer la position à la main"}
                    >
                      {w.manual ? <Lock size={11} /> : <Unlock size={11} />}
                      {w.manual ? "Manuel" : "Auto"}
                    </button>
                    <button onClick={() => removeWord(w.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <Field label="Réponse">
                  <input
                    type="text"
                    value={w.answer}
                    onChange={(e) => update(w.id, { answer: e.target.value })}
                    placeholder="NICOTINE"
                    className={`${INPUT_CLASS} uppercase font-mono`}
                  />
                </Field>

                <Field label="Définition">
                  <input
                    type="text"
                    value={w.clue}
                    onChange={(e) => update(w.id, { clue: e.target.value })}
                    placeholder="Produit du tabac qui rend dépendant"
                    className={INPUT_CLASS}
                  />
                </Field>

                {/* Placement forcé — masqué tant que le mot est en automatique */}
                {w.manual && (
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-200">
                    <Field label="Ligne">
                      <input
                        type="number"
                        min={0}
                        value={w.row}
                        onChange={(e) => update(w.id, { row: Math.max(0, Number(e.target.value) || 0) })}
                        className={INPUT_CLASS}
                      />
                    </Field>
                    <Field label="Colonne">
                      <input
                        type="number"
                        min={0}
                        value={w.col}
                        onChange={(e) => update(w.id, { col: Math.max(0, Number(e.target.value) || 0) })}
                        className={INPUT_CLASS}
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
                            {d === "H" ? "→" : "↓"}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Aperçu de la grille */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Aperçu</p>
            <button
              onClick={() => setSeed((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: color }}
            >
              <RefreshCw size={12} />
              Régénérer
            </button>
          </div>

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

          {isolated.length > 0 && (
            <p className="inline-flex items-start gap-1.5 text-[11px] text-amber-600 max-w-[220px] leading-relaxed">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              {isolated.length} mot{isolated.length > 1 ? "s" : ""} sans lettre commune avec les autres :
              placé{isolated.length > 1 ? "s" : ""} à part sous la grille.
            </p>
          )}

          <p className="text-[11px] text-gray-400 leading-relaxed max-w-[220px]">
            Les mots se croisent automatiquement sur leurs lettres communes. Passez un mot en
            « Manuel » pour figer sa position : les autres se replaceront autour.
          </p>
        </div>
      </div>
    </EditorShell>
  );
}
