"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, BODY_ZONES, type AdminStep, type AdminGameData, type CorpsBenefit, type BodyZoneId } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: { content: { title?: string; instructions?: string }; gameData: AdminGameData[] }) => Promise<void>;
}

function benefitsFromStep(step: AdminStep): CorpsBenefit[] {
  const qd = step.gameData?.[0]?.questionData as { benefits?: CorpsBenefit[] } | undefined;
  if (qd?.benefits?.length) {
    return qd.benefits.map((b) => ({
      id: b.id ?? shortId(),
      text: b.text ?? "",
      zoneId: BODY_ZONES.some((z) => z.id === b.zoneId) ? b.zoneId : "tete",
    }));
  }
  return [{ id: shortId(), text: "", zoneId: "tete" }];
}

export function CorpsEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [benefits, setBenefits] = useState<CorpsBenefit[]>(() => benefitsFromStep(step));

  const validationError = useMemo(() => {
    if (benefits.length === 0) return "Ajoutez au moins un bienfait";
    for (const [i, b] of benefits.entries()) {
      if (!b.text.trim()) return `Bienfait ${i + 1} : le texte est vide`;
    }
    return null;
  }, [benefits]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            benefits: benefits.map((b) => ({ id: b.id, text: b.text.trim(), zoneId: b.zoneId })),
          },
          correctAnswer: {},
        },
      ],
    });
  }

  function addBenefit() {
    setBenefits((bs) => [...bs, { id: shortId(), text: "", zoneId: "tete" }]);
  }
  function update(id: string, patch: Partial<CorpsBenefit>) {
    setBenefits((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function removeBenefit(id: string) {
    setBenefits((bs) => bs.filter((b) => b.id !== id));
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
      <SectionHeader title="Bienfaits" count={benefits.length} onAdd={addBenefit} addLabel="Bienfait" color={color} />
      <p className="text-[11px] text-gray-400 -mt-2">
        Le schéma du corps est fixe (6 zones). Pour chaque bienfait, choisis la zone où l&apos;élève doit le placer.
      </p>

      <div className="space-y-3">
        {benefits.map((b, idx) => (
          <div key={b.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                BIENFAIT {idx + 1}
              </span>
              <button onClick={() => removeBenefit(b.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer" disabled={benefits.length <= 1}>
                <Trash2 size={14} />
              </button>
            </div>

            <input
              type="text"
              value={b.text}
              onChange={(e) => update(b.id, { text: e.target.value })}
              placeholder="Ex : Cœur plus endurant"
              className={INPUT_CLASS}
            />

            <div className="flex flex-wrap gap-1.5">
              {BODY_ZONES.map((z) => {
                const active = b.zoneId === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => update(b.id, { zoneId: z.id as BodyZoneId })}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      active ? "text-white" : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                    }`}
                    style={active ? { background: color } : undefined}
                  >
                    <span>{z.emoji}</span>
                    {z.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addBenefit}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouveau bienfait
      </button>
    </EditorShell>
  );
}
