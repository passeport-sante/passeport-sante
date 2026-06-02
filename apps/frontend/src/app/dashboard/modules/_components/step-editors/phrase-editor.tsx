"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, X } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, TEXTAREA_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import type { AdminStep, AdminGameData } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

type Phrase = {
  id?: string;
  phrase: string;
  options: string[];
  blanks: string[];
};

function phraseFromGameData(gd: AdminGameData): Phrase {
  const qd = gd.questionData as { phrase?: string; options?: string[] };
  const ca = gd.correctAnswer as { blanks?: string[] } | undefined;
  return {
    id: gd.id,
    phrase: qd?.phrase ?? "",
    options: qd?.options ?? [],
    blanks: ca?.blanks ?? [],
  };
}

function emptyPhrase(): Phrase {
  return { phrase: "Complète cette ___.", options: ["phrase"], blanks: ["phrase"] };
}

function countBlanks(phrase: string): number {
  return (phrase.match(/___/g) ?? []).length;
}

export function PhraseEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [phrases, setPhrases] = useState<Phrase[]>(
    step.gameData?.length ? step.gameData.map(phraseFromGameData) : [emptyPhrase()],
  );

  const validationError = useMemo(() => {
    if (phrases.length === 0) return "Ajoutez au moins une phrase";
    for (const [idx, p] of phrases.entries()) {
      const n = countBlanks(p.phrase);
      if (n === 0) return `Phrase ${idx + 1} : utilisez ___ pour marquer les trous`;
      if (p.blanks.length !== n) return `Phrase ${idx + 1} : ${n} trou(s) mais ${p.blanks.length} bonne(s) réponse(s)`;
      if (p.blanks.some((b) => !b.trim())) return `Phrase ${idx + 1} : toutes les bonnes réponses doivent être remplies`;
      if (p.options.length < n) return `Phrase ${idx + 1} : au moins ${n} option(s)`;
      if (p.options.some((o) => !o.trim())) return `Phrase ${idx + 1} : toutes les options doivent être remplies`;
      // s'assurer que chaque bonne réponse est dans les options
      for (const b of p.blanks) {
        if (!p.options.includes(b)) return `Phrase ${idx + 1} : la réponse "${b}" doit figurer dans les options`;
      }
    }
    return null;
  }, [phrases]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: phrases.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        questionData: {
          phrase: p.phrase.trim(),
          options: p.options.map((o) => o.trim()),
        },
        correctAnswer: { blanks: p.blanks.map((b) => b.trim()) },
      })),
    });
  }

  function addPhrase() {
    setPhrases((ps) => [...ps, emptyPhrase()]);
  }
  function updatePhrase(idx: number, patch: Partial<Phrase>) {
    setPhrases((ps) => ps.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function removePhrase(idx: number) {
    setPhrases((ps) => ps.filter((_, i) => i !== idx));
  }
  function syncBlanks(idx: number, phrase: string) {
    const n = countBlanks(phrase);
    setPhrases((ps) =>
      ps.map((p, i) => {
        if (i !== idx) return p;
        const blanks = [...p.blanks];
        while (blanks.length < n) blanks.push("");
        blanks.length = n;
        return { ...p, phrase, blanks };
      }),
    );
  }
  function updateBlank(idx: number, bIdx: number, val: string) {
    setPhrases((ps) =>
      ps.map((p, i) => (i === idx ? { ...p, blanks: p.blanks.map((b, j) => (j === bIdx ? val : b)) } : p)),
    );
  }
  function addOption(idx: number) {
    setPhrases((ps) => ps.map((p, i) => (i === idx ? { ...p, options: [...p.options, ""] } : p)));
  }
  function updateOption(idx: number, oIdx: number, val: string) {
    setPhrases((ps) =>
      ps.map((p, i) => (i === idx ? { ...p, options: p.options.map((o, j) => (j === oIdx ? val : o)) } : p)),
    );
  }
  function removeOption(idx: number, oIdx: number) {
    setPhrases((ps) => ps.map((p, i) => (i === idx ? { ...p, options: p.options.filter((_, j) => j !== oIdx) } : p)));
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
      <SectionHeader title="Phrases" count={phrases.length} onAdd={addPhrase} addLabel="Phrase" color={color} />

      <div className="space-y-4">
        {phrases.map((p, idx) => {
          const n = countBlanks(p.phrase);
          return (
            <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                  PHRASE {idx + 1}
                </span>
                <button onClick={() => removePhrase(idx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Phrase avec ___ pour les trous
                </label>
                <textarea
                  value={p.phrase}
                  onChange={(e) => syncBlanks(idx, e.target.value)}
                  placeholder="Le vaccin contre le ___ est recommandé entre ___ et ___ ans."
                  className={TEXTAREA_CLASS}
                  rows={2}
                />
                <p className="text-[11px] text-gray-400">
                  {n} trou{n !== 1 ? "s" : ""} détecté{n !== 1 ? "s" : ""}
                </p>
              </div>

              {n > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Bonnes réponses (dans l'ordre)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {p.blanks.slice(0, n).map((b, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: color }}>
                          {bIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => updateBlank(idx, bIdx, e.target.value)}
                          placeholder={`Réponse trou ${bIdx + 1}`}
                          className={INPUT_CLASS}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Options à proposer (bonnes réponses + distracteurs)
                </label>
                <div className="flex flex-wrap gap-2">
                  {p.options.map((o, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1">
                      <input
                        type="text"
                        value={o}
                        onChange={(e) => updateOption(idx, oIdx, e.target.value)}
                        placeholder="mot"
                        className="text-xs bg-transparent outline-none w-24"
                      />
                      <button onClick={() => removeOption(idx, oIdx)} className="text-gray-300 hover:text-red-500" aria-label="Supprimer">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addOption(idx)}
                    className="px-2 py-1 text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                  >
                    <Plus size={11} />
                    Option
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addPhrase}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouvelle phrase
      </button>
    </EditorShell>
  );
}
