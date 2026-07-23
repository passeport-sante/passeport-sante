"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2, Plus, GripVertical, Upload, ImageOff, Loader2 } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, type AdminStep, type AdminGameData } from "@/lib/steps-admin";
import { uploadImageFile } from "@/lib/upload";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

type Scene = { id: string; text: string; imageUrl: string };
type Histoire = {
  id?: string;
  title: string;
  scenes: Scene[]; // ordre de saisie = ordre correct du récit
};

function histoireFromGameData(gd: AdminGameData): Histoire {
  const qd = gd.questionData as { title?: string; items?: Partial<Scene>[] };
  const ca = gd.correctAnswer as { order?: string[] } | undefined;
  const scenes = (qd?.items ?? []).map((it) => ({
    id: it.id ?? shortId(),
    text: it.text ?? "",
    imageUrl: it.imageUrl ?? "",
  }));
  const order = ca?.order;
  const sorted = order
    ? [...scenes].sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
    : scenes;
  return { id: gd.id, title: qd?.title ?? "", scenes: sorted };
}

function emptyHistoire(): Histoire {
  return {
    title: "Remets l'histoire dans l'ordre",
    scenes: [
      { id: shortId(), text: "Début de l'histoire", imageUrl: "" },
      { id: shortId(), text: "Suite de l'histoire", imageUrl: "" },
    ],
  };
}

export function HistoireEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [histoires, setHistoires] = useState<Histoire[]>(
    step.gameData?.length ? step.gameData.map(histoireFromGameData) : [emptyHistoire()],
  );

  const validationError = useMemo(() => {
    if (histoires.length === 0) return "Ajoutez au moins une histoire";
    for (const [idx, h] of histoires.entries()) {
      if (h.scenes.length < 2) return `Histoire ${idx + 1} : au moins 2 vignettes`;
      if (h.scenes.some((s) => !s.text.trim())) return `Histoire ${idx + 1} : chaque vignette doit avoir un texte`;
      if (h.scenes.some((s) => !s.imageUrl.trim())) return `Histoire ${idx + 1} : chaque vignette doit avoir une image`;
    }
    return null;
  }, [histoires]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: histoires.map((h) => ({
        ...(h.id ? { id: h.id } : {}),
        questionData: {
          title: h.title.trim(),
          items: h.scenes.map((s) => ({ id: s.id, text: s.text.trim(), imageUrl: s.imageUrl.trim() })),
        },
        correctAnswer: { order: h.scenes.map((s) => s.id) },
      })),
    });
  }

  function addHistoire() {
    setHistoires((hs) => [...hs, emptyHistoire()]);
  }
  function updateHistoire(idx: number, patch: Partial<Histoire>) {
    setHistoires((hs) => hs.map((h, i) => (i === idx ? { ...h, ...patch } : h)));
  }
  function removeHistoire(idx: number) {
    setHistoires((hs) => hs.filter((_, i) => i !== idx));
  }
  function addScene(idx: number) {
    setHistoires((hs) =>
      hs.map((h, i) => (i === idx ? { ...h, scenes: [...h.scenes, { id: shortId(), text: "", imageUrl: "" }] } : h)),
    );
  }
  function updateScene(idx: number, sceneId: string, patch: Partial<Scene>) {
    setHistoires((hs) =>
      hs.map((h, i) =>
        i === idx ? { ...h, scenes: h.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch } : s)) } : h,
      ),
    );
  }
  function removeScene(idx: number, sceneId: string) {
    setHistoires((hs) =>
      hs.map((h, i) => {
        if (i !== idx) return h;
        if (h.scenes.length <= 2) return h;
        return { ...h, scenes: h.scenes.filter((s) => s.id !== sceneId) };
      }),
    );
  }
  function reorderScenes(idx: number, fromId: string, toId: string) {
    setHistoires((hs) =>
      hs.map((h, i) => {
        if (i !== idx) return h;
        const from = h.scenes.findIndex((s) => s.id === fromId);
        const to = h.scenes.findIndex((s) => s.id === toId);
        if (from < 0 || to < 0) return h;
        return { ...h, scenes: arrayMove(h.scenes, from, to) };
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
      <SectionHeader title="Histoires" count={histoires.length} onAdd={addHistoire} addLabel="Histoire" color={color} />
      <p className="text-[11px] text-gray-400 -mt-2">
        Chaque vignette porte une image et un texte. L'ordre de saisie ci-dessous est l'ordre correct du
        récit ; glissez ⠿ pour le corriger. L'élève verra les vignettes mélangées.
      </p>

      <div className="space-y-4">
        {histoires.map((h, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                HISTOIRE {idx + 1}
              </span>
              <button onClick={() => removeHistoire(idx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>

            <input
              type="text"
              value={h.title}
              onChange={(e) => updateHistoire(idx, { title: e.target.value })}
              placeholder="Énoncé de l'histoire"
              className={INPUT_CLASS}
            />

            <ScenesSortable
              histoireIdx={idx}
              scenes={h.scenes}
              color={color}
              onUpdate={updateScene}
              onRemove={removeScene}
              onReorder={reorderScenes}
            />

            <button
              onClick={() => addScene(idx)}
              className="w-full py-1.5 text-xs font-semibold text-gray-500 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus size={12} />
              Ajouter une vignette
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addHistoire}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouvelle histoire
      </button>
    </EditorShell>
  );
}

// ── Vignettes réordonnables ─────────────────────────────────────────────────

function ScenesSortable({
  histoireIdx,
  scenes,
  color,
  onUpdate,
  onRemove,
  onReorder,
}: {
  histoireIdx: number;
  scenes: Scene[];
  color: string;
  onUpdate: (idx: number, sceneId: string, patch: Partial<Scene>) => void;
  onRemove: (idx: number, sceneId: string) => void;
  onReorder: (idx: number, fromId: string, toId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(histoireIdx, String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {scenes.map((s, i) => (
            <SortableScene
              key={s.id}
              scene={s}
              order={i + 1}
              color={color}
              canRemove={scenes.length > 2}
              onChange={(patch) => onUpdate(histoireIdx, s.id, patch)}
              onRemove={() => onRemove(histoireIdx, s.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableScene({
  scene,
  order,
  color,
  canRemove,
  onChange,
  onRemove,
}: {
  scene: Scene;
  order: number;
  color: string;
  canRemove: boolean;
  onChange: (patch: Partial<Scene>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      onChange({ imageUrl: await uploadImageFile(file) });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-start gap-2 bg-white border border-gray-200 rounded-lg p-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none p-0.5 mt-1"
      >
        <GripVertical size={14} />
      </button>

      <span
        className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-1"
        style={{ background: `${color}15`, color }}
      >
        {order}
      </span>

      {/* Aperçu de l'image */}
      <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
        {scene.imageUrl.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scene.imageUrl.trim()} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImageOff size={16} className="text-gray-300" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <input
          type="text"
          value={scene.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={`Texte de la vignette ${order}`}
          className={INPUT_CLASS}
        />
        <div className="flex items-center gap-1.5">
          <input
            type="url"
            value={scene.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            placeholder="URL de l'image"
            className={`${INPUT_CLASS} text-xs`}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold text-white shrink-0 disabled:opacity-60 transition-opacity hover:opacity-90"
            style={{ background: color }}
          >
            {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {uploading ? "Envoi…" : "Importer"}
          </button>
        </div>
        {uploadError && <p className="text-[11px] text-red-500">{uploadError}</p>}
      </div>

      {canRemove && (
        <button onClick={onRemove} className={`${ICON_BUTTON_CLASS} mt-1`} aria-label="Supprimer">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
