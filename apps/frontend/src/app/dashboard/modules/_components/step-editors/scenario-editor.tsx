"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, Check, X } from "lucide-react";
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

type Choice = { id: string; text: string };
type Scenario = {
  id?: string;
  situation: string;
  choices: Choice[];
  correctId: string;
  explanation: string;
};

function scenarioFromGameData(gd: AdminGameData): Scenario {
  const qd = gd.questionData as { situation?: string; choices?: Choice[] };
  const ca = gd.correctAnswer as { choiceId?: string; explanation?: string } | undefined;
  return {
    id: gd.id,
    situation: qd?.situation ?? "",
    choices: (qd?.choices ?? []).map((c) => ({ id: c.id ?? shortId(), text: c.text ?? "" })),
    correctId: ca?.choiceId ?? "",
    explanation: ca?.explanation ?? "",
  };
}

function emptyScenario(): Scenario {
  return {
    situation: "",
    choices: [
      { id: shortId(), text: "" },
      { id: shortId(), text: "" },
    ],
    correctId: "",
    explanation: "",
  };
}

export function ScenarioEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [scenarios, setScenarios] = useState<Scenario[]>(
    step.gameData?.length ? step.gameData.map(scenarioFromGameData) : [emptyScenario()],
  );

  const validationError = useMemo(() => {
    if (scenarios.length === 0) return "Ajoutez au moins un scénario";
    for (const [idx, s] of scenarios.entries()) {
      if (!s.situation.trim()) return `Scénario ${idx + 1} : la situation est vide`;
      if (s.choices.length < 2) return `Scénario ${idx + 1} : au moins 2 choix`;
      if (s.choices.some((c) => !c.text.trim())) return `Scénario ${idx + 1} : tous les choix doivent être renseignés`;
      if (!s.correctId || !s.choices.find((c) => c.id === s.correctId)) return `Scénario ${idx + 1} : indiquez la bonne réponse`;
    }
    return null;
  }, [scenarios]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: scenarios.map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        questionData: {
          situation: s.situation.trim(),
          choices: s.choices.map((c) => ({ id: c.id, text: c.text.trim() })),
        },
        correctAnswer: {
          choiceId: s.correctId,
          explanation: s.explanation.trim() || undefined,
        },
      })),
    });
  }

  function addScenario() {
    setScenarios((ss) => [...ss, emptyScenario()]);
  }
  function updateScenario(idx: number, patch: Partial<Scenario>) {
    setScenarios((ss) => ss.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function removeScenario(idx: number) {
    setScenarios((ss) => ss.filter((_, i) => i !== idx));
  }
  function addChoice(sIdx: number) {
    setScenarios((ss) =>
      ss.map((s, i) => (i === sIdx ? { ...s, choices: [...s.choices, { id: shortId(), text: "" }] } : s)),
    );
  }
  function updateChoice(sIdx: number, cIdx: number, text: string) {
    setScenarios((ss) =>
      ss.map((s, i) =>
        i === sIdx ? { ...s, choices: s.choices.map((c, j) => (j === cIdx ? { ...c, text } : c)) } : s,
      ),
    );
  }
  function removeChoice(sIdx: number, cIdx: number) {
    setScenarios((ss) =>
      ss.map((s, i) => {
        if (i !== sIdx) return s;
        if (s.choices.length <= 2) return s;
        const removedId = s.choices[cIdx]?.id;
        return {
          ...s,
          choices: s.choices.filter((_, j) => j !== cIdx),
          correctId: s.correctId === removedId ? "" : s.correctId,
        };
      }),
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
      <SectionHeader title="Scénarios" count={scenarios.length} onAdd={addScenario} addLabel="Scénario" color={color} />

      <div className="space-y-4">
        {scenarios.map((s, sIdx) => (
          <div key={sIdx} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span
                className="px-2 py-1 rounded-md text-[10px] font-bold text-white"
                style={{ background: color }}
              >
                SCÉNARIO {sIdx + 1}
              </span>
              <button onClick={() => removeScenario(sIdx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>

            <textarea
              value={s.situation}
              onChange={(e) => updateScenario(sIdx, { situation: e.target.value })}
              placeholder="Décrivez la situation à laquelle l'élève fait face..."
              className={TEXTAREA_CLASS}
              rows={3}
            />

            {/* Choix */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Choix possibles</p>
              {s.choices.map((c, cIdx) => {
                const isCorrect = s.correctId === c.id;
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <button
                      onClick={() => updateScenario(sIdx, { correctId: c.id })}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isCorrect ? "text-white" : "border-gray-300 hover:border-gray-400"
                      }`}
                      style={isCorrect ? { background: color, borderColor: color } : {}}
                      title="Marquer comme bonne réponse"
                    >
                      {isCorrect && <Check size={12} strokeWidth={3} />}
                    </button>
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => updateChoice(sIdx, cIdx, e.target.value)}
                      placeholder={`Choix ${cIdx + 1}`}
                      className={INPUT_CLASS}
                    />
                    {s.choices.length > 2 && (
                      <button onClick={() => removeChoice(sIdx, cIdx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => addChoice(sIdx)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
              >
                <Plus size={12} />
                Choix
              </button>
            </div>

            {/* Explanation */}
            <textarea
              value={s.explanation}
              onChange={(e) => updateScenario(sIdx, { explanation: e.target.value })}
              placeholder="Explication affichée après la réponse (facultatif)"
              className={TEXTAREA_CLASS + " text-xs"}
              rows={2}
            />
          </div>
        ))}
      </div>

      <button
        onClick={addScenario}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouveau scénario
      </button>
    </EditorShell>
  );
}
