"use client";

import { useMemo, useState } from "react";
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
import { Trash2, Plus, GripVertical } from "lucide-react";
import { EditorShell, SectionHeader, INPUT_CLASS, ICON_BUTTON_CLASS } from "./editor-shell";
import { shortId, type AdminStep, type AdminGameData } from "@/lib/steps-admin";

interface Props {
  step: AdminStep;
  color: string;
  onSave: (payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) => Promise<void>;
}

type Item = { id: string; text: string };
type Puzzle = {
  id?: string;
  title: string;
  items: Item[]; // ordre = bonne réponse
};

function puzzleFromGameData(gd: AdminGameData): Puzzle {
  const qd = gd.questionData as { title?: string; items?: Item[] };
  const ca = gd.correctAnswer as { order?: string[] } | undefined;
  const items = (qd?.items ?? []).map((it) => ({ id: it.id ?? shortId(), text: it.text ?? "" }));
  // Réordonner items selon correctAnswer.order si présent
  const order = ca?.order;
  const sorted = order
    ? [...items].sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
      })
    : items;
  return { id: gd.id, title: qd?.title ?? "", items: sorted };
}

function emptyPuzzle(): Puzzle {
  return {
    title: "Reconstitue l'ordre",
    items: [
      { id: shortId(), text: "Étape 1" },
      { id: shortId(), text: "Étape 2" },
    ],
  };
}

export function PuzzleEditor({ step, color, onSave }: Props) {
  const [title, setTitle] = useState(step.content?.title ?? "");
  const [instructions, setInstructions] = useState(step.content?.instructions ?? "");
  const [puzzles, setPuzzles] = useState<Puzzle[]>(
    step.gameData?.length ? step.gameData.map(puzzleFromGameData) : [emptyPuzzle()],
  );

  const validationError = useMemo(() => {
    if (puzzles.length === 0) return "Ajoutez au moins un puzzle";
    for (const [idx, p] of puzzles.entries()) {
      if (p.items.length < 2) return `Puzzle ${idx + 1} : au moins 2 étapes`;
      if (p.items.some((it) => !it.text.trim())) return `Puzzle ${idx + 1} : toutes les étapes doivent être renseignées`;
    }
    return null;
  }, [puzzles]);

  async function handleSave() {
    await onSave({
      content: { title: title.trim(), instructions: instructions.trim() },
      gameData: puzzles.map((p) => ({
        ...(p.id ? { id: p.id } : {}),
        questionData: {
          title: p.title.trim(),
          items: p.items.map((it) => ({ id: it.id, text: it.text.trim() })),
        },
        correctAnswer: { order: p.items.map((it) => it.id) },
      })),
    });
  }

  function addPuzzle() {
    setPuzzles((ps) => [...ps, emptyPuzzle()]);
  }
  function updatePuzzle(idx: number, patch: Partial<Puzzle>) {
    setPuzzles((ps) => ps.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function removePuzzle(idx: number) {
    setPuzzles((ps) => ps.filter((_, i) => i !== idx));
  }
  function addItem(idx: number) {
    setPuzzles((ps) =>
      ps.map((p, i) => (i === idx ? { ...p, items: [...p.items, { id: shortId(), text: "" }] } : p)),
    );
  }
  function updateItem(idx: number, itemId: string, text: string) {
    setPuzzles((ps) =>
      ps.map((p, i) =>
        i === idx ? { ...p, items: p.items.map((it) => (it.id === itemId ? { ...it, text } : it)) } : p,
      ),
    );
  }
  function removeItem(idx: number, itemId: string) {
    setPuzzles((ps) =>
      ps.map((p, i) => {
        if (i !== idx) return p;
        if (p.items.length <= 2) return p;
        return { ...p, items: p.items.filter((it) => it.id !== itemId) };
      }),
    );
  }
  function reorderItems(idx: number, fromId: string, toId: string) {
    setPuzzles((ps) =>
      ps.map((p, i) => {
        if (i !== idx) return p;
        const oldIndex = p.items.findIndex((it) => it.id === fromId);
        const newIndex = p.items.findIndex((it) => it.id === toId);
        if (oldIndex < 0 || newIndex < 0) return p;
        return { ...p, items: arrayMove(p.items, oldIndex, newIndex) };
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
      <SectionHeader title="Puzzles" count={puzzles.length} onAdd={addPuzzle} addLabel="Puzzle" color={color} />
      <p className="text-[11px] text-gray-400 -mt-2">
        L'ordre dans lequel vous saisissez les étapes ci-dessous est l'ordre correct. Glissez ⠿ pour réordonner. L'élève les verra mélangées.
      </p>

      <div className="space-y-4">
        {puzzles.map((p, idx) => (
          <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2 py-1 rounded-md text-[10px] font-bold text-white" style={{ background: color }}>
                PUZZLE {idx + 1}
              </span>
              <button onClick={() => removePuzzle(idx)} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
                <Trash2 size={14} />
              </button>
            </div>

            <input
              type="text"
              value={p.title}
              onChange={(e) => updatePuzzle(idx, { title: e.target.value })}
              placeholder="Énoncé du puzzle"
              className={INPUT_CLASS}
            />

            <PuzzleItemsSortable
              puzzleIdx={idx}
              items={p.items}
              color={color}
              onUpdate={updateItem}
              onRemove={removeItem}
              onReorder={reorderItems}
            />

            <button
              onClick={() => addItem(idx)}
              className="w-full py-1.5 text-xs font-semibold text-gray-500 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus size={12} />
              Ajouter une étape
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addPuzzle}
        className="w-full py-2 text-xs font-semibold text-gray-500 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-colors inline-flex items-center justify-center gap-1.5"
      >
        <Plus size={13} />
        Nouveau puzzle
      </button>
    </EditorShell>
  );
}

// ── Sortable items dans un puzzle ───────────────────────────────────────────

function PuzzleItemsSortable({
  puzzleIdx,
  items,
  color,
  onUpdate,
  onRemove,
  onReorder,
}: {
  puzzleIdx: number;
  items: Item[];
  color: string;
  onUpdate: (idx: number, itemId: string, text: string) => void;
  onRemove: (idx: number, itemId: string) => void;
  onReorder: (idx: number, fromId: string, toId: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(puzzleIdx, String(active.id), String(over.id));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {items.map((it, itIdx) => (
            <SortableRow
              key={it.id}
              id={it.id}
              order={itIdx + 1}
              text={it.text}
              color={color}
              canRemove={items.length > 2}
              onChange={(text) => onUpdate(puzzleIdx, it.id, text)}
              onRemove={() => onRemove(puzzleIdx, it.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  id,
  order,
  text,
  color,
  canRemove,
  onChange,
  onRemove,
}: {
  id: string;
  order: number;
  text: string;
  color: string;
  canRemove: boolean;
  onChange: (text: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2 py-1"
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none p-0.5">
        <GripVertical size={14} />
      </button>
      <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: `${color}15`, color }}>
        {order}
      </span>
      <input
        type="text"
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Étape ${order}`}
        className="flex-1 text-sm bg-transparent outline-none"
      />
      {canRemove && (
        <button onClick={onRemove} className={ICON_BUTTON_CLASS} aria-label="Supprimer">
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
