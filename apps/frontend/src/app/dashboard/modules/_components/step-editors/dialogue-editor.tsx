"use client";

import { useMemo, useState } from "react";
import { Trash2, Plus, Flag, Play, AlertTriangle, ArrowRight } from "lucide-react";
import { EditorShell, INPUT_CLASS, TEXTAREA_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import {
  shortId,
  type AdminStep,
  type AdminGameData,
  type StepContent,
  type DialogueScene,
  type DialogueEnding,
  type DialogueData,
  type DialogueTone,
} from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: { content: StepContent; gameData: AdminGameData[] }) => Promise<void>;
}

const TONE_META: Record<DialogueTone, { label: string; color: string; emoji: string }> = {
  good: { label: "Bonne fin", color: "#16A34A", emoji: "✅" },
  neutral: { label: "Fin neutre", color: "#D97706", emoji: "🟡" },
  bad: { label: "À éviter", color: "#DC2626", emoji: "🔴" },
};

function dataFromStep(step: AdminStep): DialogueData {
  const qd = step.gameData?.[0]?.questionData as Partial<DialogueData> | undefined;
  if (qd?.scenes?.length) {
    return {
      startId: qd.startId ?? qd.scenes[0]!.id,
      scenes: qd.scenes.map((s) => ({
        id: s.id ?? shortId(),
        text: s.text ?? "",
        choices: (s.choices ?? []).map((c) => ({ id: c.id ?? shortId(), text: c.text ?? "", goto: c.goto ?? "" })),
      })),
      endings: (qd.endings ?? []).map((e) => ({ id: e.id ?? shortId(), text: e.text ?? "", tone: e.tone ?? "neutral" })),
    };
  }
  // Gabarit minimal si on part de zéro.
  const s1 = shortId();
  const eGood = shortId();
  return {
    startId: s1,
    scenes: [{ id: s1, text: "", choices: [{ id: shortId(), text: "", goto: eGood }] }],
    endings: [{ id: eGood, text: "", tone: "good" }],
  };
}

// Scènes/fins atteignables depuis le départ, pour signaler le contenu mort.
function reachableIds(data: DialogueData): Set<string> {
  const seen = new Set<string>();
  const sceneById = new Map(data.scenes.map((s) => [s.id, s]));
  const stack = [data.startId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const scene = sceneById.get(id);
    if (scene) for (const c of scene.choices) if (c.goto) stack.push(c.goto);
  }
  return seen;
}

export function DialogueEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [data, setData] = useState<DialogueData>(() => dataFromStep(step));

  const { startId, scenes, endings } = data;

  // Options du menu « mène à » : toutes les scènes puis toutes les fins.
  const gotoOptions = useMemo(
    () => [
      ...scenes.map((s, i) => ({ id: s.id, label: `Scène ${i + 1}` })),
      ...endings.map((e, i) => ({ id: e.id, label: `Fin ${i + 1} · ${TONE_META[e.tone].label}` })),
    ],
    [scenes, endings],
  );

  const reachable = useMemo(() => reachableIds(data), [data]);
  const validIds = useMemo(() => new Set([...scenes.map((s) => s.id), ...endings.map((e) => e.id)]), [scenes, endings]);

  const validationError = useMemo(() => {
    if (scenes.length === 0) return "Ajoutez au moins une scène";
    if (endings.length === 0) return "Ajoutez au moins une fin";
    if (!scenes.some((s) => s.id === startId)) return "Choisissez la scène de départ";
    for (const [i, s] of scenes.entries()) {
      if (!s.text.trim()) return `Scène ${i + 1} : le texte est vide`;
      if (s.choices.length === 0) return `Scène ${i + 1} : ajoutez au moins un choix`;
      for (const [j, c] of s.choices.entries()) {
        if (!c.text.trim()) return `Scène ${i + 1}, choix ${j + 1} : texte manquant`;
        if (!c.goto || !validIds.has(c.goto)) return `Scène ${i + 1}, choix ${j + 1} : destination manquante`;
      }
    }
    for (const [i, e] of endings.entries()) {
      if (!e.text.trim()) return `Fin ${i + 1} : le texte est vide`;
    }
    if (!endings.some((e) => e.tone === "good")) return "Ajoutez au moins une « bonne fin »";
    return null;
  }, [scenes, endings, startId, validIds]);

  async function handleSave() {
    const bestEndingId = endings.find((e) => e.tone === "good")?.id ?? "";
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: [
        {
          ...(step.gameData?.[0]?.id ? { id: step.gameData[0].id } : {}),
          questionData: {
            startId,
            scenes: scenes.map((s) => ({
              id: s.id,
              text: s.text.trim(),
              choices: s.choices.map((c) => ({ id: c.id, text: c.text.trim(), goto: c.goto })),
            })),
            endings: endings.map((e) => ({ id: e.id, text: e.text.trim(), tone: e.tone })),
          },
          correctAnswer: { bestEndingId },
        },
      ],
    });
  }

  // ── Mutations ────────────────────────────────────────────────────────────────
  const patch = (p: Partial<DialogueData>) => setData((d) => ({ ...d, ...p }));

  function addScene() {
    const s: DialogueScene = { id: shortId(), text: "", choices: [{ id: shortId(), text: "", goto: "" }] };
    patch({ scenes: [...scenes, s] });
  }
  function updateScene(id: string, text: string) {
    patch({ scenes: scenes.map((s) => (s.id === id ? { ...s, text } : s)) });
  }
  function removeScene(id: string) {
    if (scenes.length <= 1) return;
    const nextScenes = scenes.filter((s) => s.id !== id);
    // Nettoie les choix qui pointaient vers la scène supprimée.
    const cleaned = nextScenes.map((s) => ({
      ...s,
      choices: s.choices.map((c) => (c.goto === id ? { ...c, goto: "" } : c)),
    }));
    patch({ scenes: cleaned, startId: startId === id ? (cleaned[0]?.id ?? "") : startId });
  }
  function addChoice(sceneId: string) {
    patch({
      scenes: scenes.map((s) =>
        s.id === sceneId ? { ...s, choices: [...s.choices, { id: shortId(), text: "", goto: "" }] } : s,
      ),
    });
  }
  function updateChoice(sceneId: string, choiceId: string, p: Partial<{ text: string; goto: string }>) {
    patch({
      scenes: scenes.map((s) =>
        s.id === sceneId
          ? { ...s, choices: s.choices.map((c) => (c.id === choiceId ? { ...c, ...p } : c)) }
          : s,
      ),
    });
  }
  function removeChoice(sceneId: string, choiceId: string) {
    patch({
      scenes: scenes.map((s) =>
        s.id === sceneId ? { ...s, choices: s.choices.filter((c) => c.id !== choiceId) } : s,
      ),
    });
  }
  function addEnding() {
    patch({ endings: [...endings, { id: shortId(), text: "", tone: "neutral" }] });
  }
  function updateEnding(id: string, p: Partial<DialogueEnding>) {
    patch({ endings: endings.map((e) => (e.id === id ? { ...e, ...p } : e)) });
  }
  function removeEnding(id: string) {
    if (endings.length <= 1) return;
    const nextEndings = endings.filter((e) => e.id !== id);
    const cleaned = scenes.map((s) => ({
      ...s,
      choices: s.choices.map((c) => (c.goto === id ? { ...c, goto: "" } : c)),
    }));
    patch({ endings: nextEndings, scenes: cleaned });
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
      <p className="text-[11px] text-gray-400">
        Construis une histoire à embranchements : chaque scène propose des choix qui mènent à une autre
        scène ou à une fin. Les « bonnes fins » félicitent l&apos;élève, les autres l&apos;invitent à rejouer.
      </p>

      {/* ── Scènes ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#1A1A1A]">Scènes</h3>
        <span className="text-xs text-gray-400">{scenes.length}</span>
      </div>

      <div className="space-y-4">
        {scenes.map((s, sIdx) => {
          const isStart = s.id === startId;
          const unreachable = !reachable.has(s.id);
          return (
            <div key={s.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                    SCÈNE {sIdx + 1}
                  </span>
                  <button
                    onClick={() => patch({ startId: s.id })}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      isStart ? "text-white" : "bg-white text-gray-400 border border-gray-200 hover:text-gray-600"
                    }`}
                    style={isStart ? { background: "#16A34A" } : undefined}
                    title="Marquer comme scène de départ"
                  >
                    <Play size={11} />
                    {isStart ? "Départ" : "Définir départ"}
                  </button>
                  {unreachable && !isStart && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                      <AlertTriangle size={11} /> jamais atteinte
                    </span>
                  )}
                </div>
                <button onClick={() => removeScene(s.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer la scène" disabled={scenes.length <= 1}>
                  <Trash2 size={14} />
                </button>
              </div>

              <textarea
                value={s.text}
                onChange={(e) => updateScene(s.id, e.target.value)}
                placeholder="Décris la scène (ce que voit / vit l'élève)…"
                className={TEXTAREA_CLASS}
                rows={2}
              />

              <div className="space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Choix</p>
                {s.choices.map((c, cIdx) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.text}
                      onChange={(e) => updateChoice(s.id, c.id, { text: e.target.value })}
                      placeholder={`Choix ${cIdx + 1}`}
                      className={INPUT_CLASS + " flex-1"}
                    />
                    <ArrowRight size={14} className="text-gray-300 shrink-0" />
                    <select
                      value={validIds.has(c.goto) ? c.goto : ""}
                      onChange={(e) => updateChoice(s.id, c.id, { goto: e.target.value })}
                      className="shrink-0 max-w-[150px] px-2 py-2 rounded-lg bg-white border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-[#4F46E5]/30"
                    >
                      <option value="">— mène à… —</option>
                      {gotoOptions
                        .filter((o) => o.id !== s.id) // pas de renvoi sur soi-même
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => removeChoice(s.id, c.id)}
                      className={ICON_BUTTON_CLASS}
                      aria-label="Supprimer le choix"
                      disabled={s.choices.length <= 1}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addChoice(s.id)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <Plus size={12} /> Choix
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addScene}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} /> Nouvelle scène
      </button>

      {/* ── Fins ── */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-[#1A1A1A] inline-flex items-center gap-1.5">
          <Flag size={14} style={{ color }} /> Fins possibles
        </h3>
        <span className="text-xs text-gray-400">{endings.length}</span>
      </div>

      <div className="space-y-3">
        {endings.map((e, eIdx) => {
          const unreachable = !reachable.has(e.id);
          return (
            <div key={e.id} className="bg-gray-50 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded-md text-[10px] font-bold text-white"
                    style={{ background: TONE_META[e.tone].color }}
                  >
                    FIN {eIdx + 1}
                  </span>
                  <div className="flex gap-1">
                    {(Object.keys(TONE_META) as DialogueTone[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateEnding(e.id, { tone: t })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                          e.tone === t ? "text-white" : "bg-white text-gray-400 border border-gray-200 hover:text-gray-600"
                        }`}
                        style={e.tone === t ? { background: TONE_META[t].color } : undefined}
                      >
                        {TONE_META[t].emoji} {TONE_META[t].label}
                      </button>
                    ))}
                  </div>
                  {unreachable && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">
                      <AlertTriangle size={11} /> jamais atteinte
                    </span>
                  )}
                </div>
                <button onClick={() => removeEnding(e.id)} className={ICON_BUTTON_CLASS} aria-label="Supprimer la fin" disabled={endings.length <= 1}>
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea
                value={e.text}
                onChange={(ev) => updateEnding(e.id, { text: ev.target.value })}
                placeholder="Message de fin affiché à l'élève…"
                className={TEXTAREA_CLASS}
                rows={2}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={addEnding}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} /> Nouvelle fin
      </button>
    </EditorShell>
  );
}
