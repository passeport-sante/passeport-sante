"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, X, Check } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, TEXTAREA_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, type AdminStep, type AdminGameData } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

type Option = { id: string; text: string };
type Question = {
  id: string;
  text: string;
  options: Option[];
  correctIds: string[];
  explanation?: string;
};

// Une bonne réponse était stockée comme string ; désormais on accepte string[].
// Ce helper absorbe les deux formats pour les quiz déjà enregistrés.
function toIds(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.filter(Boolean);
  return value ? [value] : [];
}

export function QuizEditor({ step, color, onSave }: Props) {
  const initial = step.gameData?.[0];
  const initialQuestions: Question[] = (() => {
    const raw = (initial?.questionData as { questions?: Question[] } | undefined)?.questions ?? [];
    const correct = ((initial?.correctAnswer as { answers?: Record<string, string | string[]> } | undefined)?.answers) ?? {};
    return raw.map((q) => ({
      id: q.id ?? shortId(),
      text: q.text ?? "",
      options: (q.options ?? []).map((o) => ({ id: o.id ?? shortId(), text: o.text ?? "" })),
      correctIds: toIds(correct[q.id]),
      explanation: (q as Question).explanation,
    }));
  })();

  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [questions, setQuestions] = useState<Question[]>(
    initialQuestions.length
      ? initialQuestions
      : [{ id: shortId(), text: "", options: [{ id: shortId(), text: "" }, { id: shortId(), text: "" }], correctIds: [] }],
  );

  const validationError = useMemo(() => {
    if (questions.length === 0) return "Ajoutez au moins une question";
    for (const [idx, q] of questions.entries()) {
      if (!q.text.trim()) return `Question ${idx + 1} : le libellé est vide`;
      if (q.options.length < 2) return `Question ${idx + 1} : au moins 2 réponses`;
      if (q.options.some((o) => !o.text.trim())) return `Question ${idx + 1} : toutes les réponses doivent être renseignées`;
      if (q.correctIds.length === 0) return `Question ${idx + 1} : indiquez au moins une bonne réponse`;
    }
    return null;
  }, [questions]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(initial?.id ? { id: initial.id } : {}),
          questionData: {
            questions: questions.map((q) => ({
              id: q.id,
              text: q.text.trim(),
              options: q.options.map((o) => ({ id: o.id, text: o.text.trim() })),
              explanation: q.explanation?.trim() || undefined,
            })),
          },
          correctAnswer: {
            // Toujours un tableau : une seule bonne réponse = tableau à un élément.
            answers: Object.fromEntries(questions.map((q) => [q.id, q.correctIds])),
          },
        },
      ],
    });
  }

  function addQuestion() {
    setQuestions((qs) => [
      ...qs,
      { id: shortId(), text: "", options: [{ id: shortId(), text: "" }, { id: shortId(), text: "" }], correctIds: [] },
    ]);
  }
  function updateQuestion(qIdx: number, patch: Partial<Question>) {
    setQuestions((qs) => qs.map((q, i) => (i === qIdx ? { ...q, ...patch } : q)));
  }
  function removeQuestion(qIdx: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== qIdx));
  }
  function addOption(qIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, { id: shortId(), text: "" }] } : q)),
    );
  }
  function updateOption(qIdx: number, oIdx: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { ...o, text } : o)) } : q,
      ),
    );
  }
  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) return q;
        const removedId = q.options[oIdx]?.id;
        return {
          ...q,
          options: q.options.filter((_, j) => j !== oIdx),
          correctIds: q.correctIds.filter((id) => id !== removedId),
        };
      }),
    );
  }
  // Coche/décoche une option comme bonne réponse (plusieurs possibles).
  function toggleCorrect(qIdx: number, optId: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              correctIds: q.correctIds.includes(optId)
                ? q.correctIds.filter((id) => id !== optId)
                : [...q.correctIds, optId],
            }
          : q,
      ),
    );
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
      <SectionHeader title="Questions" count={questions.length} onAdd={addQuestion} addLabel="Question" color={color} />

      <div className="space-y-3">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: color }}
              >
                {qIdx + 1}
              </span>
              <textarea
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
                placeholder="Énoncé de la question"
                className={TEXTAREA_CLASS}
                rows={2}
              />
              <button onClick={() => removeQuestion(qIdx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2 pl-8">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-400">
                  Cochez la ou les bonnes réponses
                </p>
                {q.correctIds.length > 1 && (
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                    style={{ background: color }}
                  >
                    Plusieurs bonnes réponses
                  </span>
                )}
              </div>
              {q.options.map((o, oIdx) => {
                const isCorrect = q.correctIds.includes(o.id);
                return (
                  <div key={o.id} className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCorrect(qIdx, o.id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCorrect ? "text-white" : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={isCorrect ? { background: color, borderColor: color } : {}}
                      title={isCorrect ? "Bonne réponse (cliquer pour retirer)" : "Marquer comme bonne réponse"}
                    >
                      {isCorrect && <Check size={12} strokeWidth={3} />}
                    </button>
                    <input
                      type="text"
                      value={o.text}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Réponse ${oIdx + 1}`}
                      className={INPUT_CLASS}
                    />
                    {q.options.length > 2 && (
                      <button onClick={() => removeOption(qIdx, oIdx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => addOption(qIdx)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <Plus size={12} />
                Réponse
              </button>
            </div>

            {/* Explanation */}
            <div className="pl-8">
              <input
                type="text"
                value={q.explanation ?? ""}
                onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                placeholder="Explication facultative (affichée après la réponse)"
                className={INPUT_CLASS + " text-xs"}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouvelle question
      </button>
    </EditorShell>
  );
}
