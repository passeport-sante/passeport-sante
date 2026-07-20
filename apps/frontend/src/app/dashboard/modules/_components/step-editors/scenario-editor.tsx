"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, Check, X, Shield } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, TEXTAREA_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, type AdminStep, type AdminGameData, type StepContent } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: StepContent;
    gameData: AdminGameData[];
  }) => Promise<void>;
}

type Choice = { id: string; text: string; points: number };
type Scenario = {
  id?: string;
  situation: string;
  choices: Choice[];
  correctId: string;
  explanation: string;
};

function scenarioFromGameData(gd: AdminGameData): Scenario {
  const qd = gd.questionData as { situation?: string; choices?: { id?: string; text?: string; points?: number }[] };
  const ca = gd.correctAnswer as { choiceId?: string; explanation?: string } | undefined;
  return {
    id: gd.id,
    situation: qd?.situation ?? "",
    choices: (qd?.choices ?? []).map((c) => ({ id: c.id ?? shortId(), text: c.text ?? "", points: c.points ?? 0 })),
    correctId: ca?.choiceId ?? "",
    explanation: ca?.explanation ?? "",
  };
}

function emptyScenario(): Scenario {
  return {
    situation: "",
    choices: [
      { id: shortId(), text: "", points: 0 },
      { id: shortId(), text: "", points: 0 },
    ],
    correctId: "",
    explanation: "",
  };
}

// Choix avec le plus de points (pour renseigner correctAnswer même en mode bouclier)
function bestChoiceId(s: Scenario): string {
  return s.choices.reduce((best, c) => (c.points > (s.choices.find((x) => x.id === best)?.points ?? -Infinity) ? c.id : best), s.choices[0]?.id ?? "");
}

export function ScenarioEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [shieldMode, setShieldMode] = useState(!!step.content?.shieldMode);
  const [scenarios, setScenarios] = useState<Scenario[]>(
    step.gameData?.length ? step.gameData.map(scenarioFromGameData) : [emptyScenario()],
  );

  const validationError = useMemo(() => {
    if (scenarios.length === 0) return "Ajoutez au moins un scénario";
    for (const [idx, s] of scenarios.entries()) {
      if (!s.situation.trim()) return `Scénario ${idx + 1} : la situation est vide`;
      if (s.choices.length < 2) return `Scénario ${idx + 1} : au moins 2 choix`;
      if (s.choices.some((c) => !c.text.trim())) return `Scénario ${idx + 1} : tous les choix doivent être renseignés`;
      if (shieldMode) {
        if (!s.choices.some((c) => c.points > 0)) return `Scénario ${idx + 1} : indiquez les points (au moins un choix > 0)`;
      } else if (!s.correctId || !s.choices.find((c) => c.id === s.correctId)) {
        return `Scénario ${idx + 1} : indiquez la bonne réponse`;
      }
    }
    return null;
  }, [scenarios, shieldMode]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim(), shieldMode },
      gameData: scenarios.map((s) => ({
        ...(s.id ? { id: s.id } : {}),
        questionData: {
          situation: s.situation.trim(),
          choices: s.choices.map((c) => ({ id: c.id, text: c.text.trim(), points: c.points })),
        },
        correctAnswer: {
          choiceId: shieldMode ? bestChoiceId(s) : s.correctId,
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
      ss.map((s, i) => (i === sIdx ? { ...s, choices: [...s.choices, { id: shortId(), text: "", points: 0 }] } : s)),
    );
  }
  function updateChoice(sIdx: number, cIdx: number, patch: Partial<Choice>) {
    setScenarios((ss) =>
      ss.map((s, i) =>
        i === sIdx ? { ...s, choices: s.choices.map((c, j) => (j === cIdx ? { ...c, ...patch } : c)) } : s,
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
      {/* Toggle mode bouclier mental */}
      <label className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={shieldMode}
          onChange={(e) => setShieldMode(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#2A8970]"
        />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-bold text-[#1A1A1A]">
            <Shield size={14} style={{ color }} />
            Mode « bouclier mental »
          </span>
          <span className="block text-xs text-gray-500 mt-0.5">
            Chaque choix rapporte des points. Une jauge de bouclier monte/descend, l'élève avance à chaque choix
            (pas de « réessayer »), et un score final s'affiche. Idéal pour les CPS.
          </span>
        </span>
      </label>

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
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {shieldMode ? "Choix et points" : "Choix possibles"}
              </p>
              {s.choices.map((c, cIdx) => {
                const isCorrect = s.correctId === c.id;
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    {shieldMode ? (
                      <input
                        type="number"
                        value={c.points}
                        onChange={(e) => updateChoice(sIdx, cIdx, { points: Math.round(Number(e.target.value) || 0) })}
                        title="Points de bouclier apportés par ce choix"
                        className="w-14 shrink-0 px-2 py-2 rounded-lg bg-white border border-gray-200 text-sm text-center outline-none focus:ring-2 focus:ring-[#2A8970]/30"
                      />
                    ) : (
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
                    )}
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => updateChoice(sIdx, cIdx, { text: e.target.value })}
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
              {shieldMode && (
                <p className="text-[11px] text-gray-400">
                  Points conseillés : le meilleur choix (CPS) = 2, un choix moyen = 1, un mauvais choix = 0.
                </p>
              )}
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
