"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Lightbulb, Image as ImageIcon, Video } from "lucide-react";
import {
  GAME_TYPE_META,
  CONTENT_TYPE_META,
  type GameType,
  type ContentType,
} from "@/lib/steps-admin";

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  INFO: <Lightbulb size={13} />,
  IMAGE: <ImageIcon size={13} />,
  VIDEO: <Video size={13} />,
};

interface Props {
  id: string;
  kind: "GAME" | "CONTENT";
  gameNumber: number | null;
  gameType: GameType | null;
  contentType: ContentType | null;
  title: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableStepItem({
  id,
  kind,
  gameNumber,
  gameType,
  contentType,
  title,
  selected,
  onSelect,
  onDelete,
}: Props) {
  const isContent = kind === "CONTENT";
  const meta = isContent
    ? CONTENT_TYPE_META[contentType ?? "INFO"]
    : GAME_TYPE_META[gameType ?? "QUIZ"];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    borderColor: selected ? meta.color : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
        selected
          ? "bg-white shadow-sm"
          : isContent
            ? "bg-gray-50/60 hover:bg-gray-50 border-transparent"
            : "bg-white hover:bg-gray-50 border-transparent"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="p-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
        aria-label="Réordonner"
      >
        <GripVertical size={16} />
      </button>

      {/* Numéro d'étape (jeux) ou puce de sous-étape (contenu) */}
      {isContent ? (
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${meta.color}15`, color: meta.color }}
          title="Sous-étape de contenu"
        >
          {CONTENT_ICONS[contentType ?? "INFO"]}
        </span>
      ) : (
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0"
          style={{ background: `${meta.color}15`, color: meta.color }}
        >
          {gameNumber}
        </span>
      )}

      {/* Badge type */}
      <span
        className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shrink-0"
        style={
          isContent
            ? { background: `${meta.color}20`, color: meta.color }
            : { background: meta.color, color: "white" }
        }
      >
        {isContent ? "SOUS-ÉTAPE" : meta.short.toUpperCase()}
      </span>

      {/* Titre */}
      <span className="text-sm font-semibold text-[#1A1A1A] truncate flex-1">
        {title || (
          <span className="text-gray-400 italic">{isContent ? meta.label : "Sans titre"}</span>
        )}
      </span>

      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
        aria-label="Supprimer l'étape"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
