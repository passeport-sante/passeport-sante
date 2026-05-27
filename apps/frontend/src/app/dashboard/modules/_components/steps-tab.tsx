"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Loader2, Layers, ExternalLink } from "lucide-react";
import {
  fetchStep,
  createStep,
  updateStep,
  deleteStep,
  reorderSteps,
  defaultContentFor,
  defaultGameDataFor,
  GAME_TYPE_META,
  type AdminStep,
  type AdminGameData,
  type GameType,
} from "@/lib/steps-admin";
import { GameTypePicker } from "./game-type-picker";
import { SortableStepItem } from "./sortable-step-item";
import { StepEditor } from "./step-editors/step-editor";

interface StepLite {
  id: string;
  order: number;
  gameType: string;
  content: Record<string, unknown> | null;
}

interface Props {
  moduleId: string;
  colorPrimary: string;
  steps: StepLite[];
  onChange: () => Promise<void> | void;
}

export function StepsTab({ moduleId, colorPrimary, steps: initialSteps, onChange }: Props) {
  const [steps, setSteps] = useState<StepLite[]>(initialSteps);
  const [selectedId, setSelectedId] = useState<string | null>(initialSteps[0]?.id ?? null);
  const [current, setCurrent] = useState<AdminStep | null>(null);
  const [loadingStep, setLoadingStep] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    setSteps(initialSteps);
  }, [initialSteps]);

  // Charge le step sélectionné
  useEffect(() => {
    if (!selectedId) {
      setCurrent(null);
      return;
    }
    let cancelled = false;
    setLoadingStep(true);
    fetchStep(selectedId)
      .then((s) => {
        if (cancelled) return;
        setCurrent(s);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingStep(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    setSteps(reordered); // optimiste

    try {
      await reorderSteps(reordered.map((s) => ({ id: s.id, order: s.order })));
      await onChange();
    } catch (err) {
      // revert
      setSteps(initialSteps);
      alert(err instanceof Error ? err.message : "Échec du réordonnancement");
    }
  }

  async function handleAddStep(gameType: GameType) {
    setShowPicker(false);
    const nextOrder = (steps.at(-1)?.order ?? 0) + 1;
    try {
      const created = await createStep({
        moduleId,
        gameType,
        order: nextOrder,
        content: defaultContentFor(gameType),
        gameData: defaultGameDataFor(gameType),
      });
      await onChange();
      setSelectedId(created.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la création");
    }
  }

  async function handleDeleteStep(stepId: string) {
    try {
      await deleteStep(stepId);
      if (selectedId === stepId) {
        const remaining = steps.filter((s) => s.id !== stepId);
        setSelectedId(remaining[0]?.id ?? null);
      }
      await onChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleSaveStep(payload: {
    content: { title?: string; instructions?: string };
    gameData: AdminGameData[];
  }) {
    if (!current) return;
    const updated = await updateStep(current.id, payload);
    setCurrent(updated);
    await onChange();
  }

  const orderedSteps = useMemo(
    () => [...steps].sort((a, b) => a.order - b.order),
    [steps],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Liste sortable — 2/5 */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
            <Layers size={15} className="text-gray-400" />
            Étapes du module
            <span className="text-xs font-semibold text-gray-400">({orderedSteps.length})</span>
          </h3>
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
            style={{ background: colorPrimary }}
          >
            <Plus size={13} />
            Ajouter
          </button>
        </div>

        {orderedSteps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm font-semibold text-[#1A1A1A]">Aucune étape</p>
            <p className="text-xs text-gray-400 mt-1">
              Ajoutez une première étape pour commencer à composer le module
            </p>
            <button
              onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-white text-sm font-semibold rounded-xl"
              style={{ background: colorPrimary }}
            >
              <Plus size={14} />
              Créer une étape
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={orderedSteps.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {orderedSteps.map((s) => {
                  const title = (s.content as { title?: string } | null)?.title ?? "";
                  return (
                    <SortableStepItem
                      key={s.id}
                      id={s.id}
                      order={s.order}
                      gameType={s.gameType as GameType}
                      title={title}
                      selected={selectedId === s.id}
                      onSelect={() => setSelectedId(s.id)}
                      onDelete={() => setConfirmDelete(s.id)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Éditeur — 3/5 */}
      <div className="lg:col-span-3">
        {!selectedId ? (
          <EmptyEditor color={colorPrimary} />
        ) : loadingStep || !current ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <StepEditor
            key={current.id}
            step={current}
            color={colorPrimary}
            onSave={handleSaveStep}
          />
        )}
      </div>

      {/* Modals */}
      <GameTypePicker
        open={showPicker}
        onCancel={() => setShowPicker(false)}
        onSelect={handleAddStep}
      />

      {confirmDelete && (
        <ConfirmDeleteStep
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDeleteStep(confirmDelete)}
        />
      )}
    </div>
  );
}

function EmptyEditor({ color }: { color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: `${color}15`, color }}
      >
        <Layers size={20} />
      </div>
      <p className="text-base font-semibold text-[#1A1A1A]">
        Sélectionnez une étape
      </p>
      <p className="text-sm text-gray-400 mt-1">
        Choisissez une étape à gauche pour éditer son contenu, ou ajoutez-en une nouvelle.
      </p>
    </div>
  );
}

function ConfirmDeleteStep({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-[#1A1A1A]">Supprimer cette étape ?</h2>
        <p className="text-sm text-gray-500">
          Les données de jeu associées seront définitivement perdues.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
