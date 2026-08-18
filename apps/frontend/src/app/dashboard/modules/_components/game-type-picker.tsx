"use client";

import { X, ListTodo, HelpCircle, ListOrdered, Type, MessageCircle, Grid3x3, BookOpen, Route, GalleryHorizontalEnd, SlidersHorizontal, Lightbulb, Image as ImageIcon, Video } from "lucide-react";
import {
  GAME_TYPE_META,
  CONTENT_TYPE_META,
  type GameType,
  type ContentType,
} from "@/lib/steps-admin";

const GAME_ICONS: Record<GameType, React.ReactNode> = {
  KANBAN: <ListTodo size={22} />,
  QUIZ: <HelpCircle size={22} />,
  PUZZLE: <ListOrdered size={22} />,
  PHRASE_A_TROU: <Type size={22} />,
  SCENARIO: <MessageCircle size={22} />,
  MOTS_CROISES: <Grid3x3 size={22} />,
  HISTOIRE: <BookOpen size={22} />,
  DIALOGUE: <Route size={22} />,
  SWIPE: <GalleryHorizontalEnd size={22} />,
  CURSEUR: <SlidersHorizontal size={22} />,
};

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  INFO: <Lightbulb size={22} />,
  IMAGE: <ImageIcon size={22} />,
  VIDEO: <Video size={22} />,
};

const GAME_ORDER: GameType[] = ["KANBAN", "QUIZ", "SWIPE", "CURSEUR", "PUZZLE", "HISTOIRE", "DIALOGUE", "PHRASE_A_TROU", "SCENARIO", "MOTS_CROISES"];
const CONTENT_ORDER: ContentType[] = ["INFO", "IMAGE", "VIDEO"];

// Choix renvoyé : étape de jeu (comptée), sous-étape de contenu, ou sous-étape de jeu (non comptée)
export type StepPick =
  | { kind: "GAME"; gameType: GameType }
  | { kind: "CONTENT"; contentType: ContentType }
  | { kind: "GAME_SUBSTEP"; gameType: GameType };

interface Props {
  open: boolean;
  onCancel: () => void;
  onSelect: (pick: StepPick) => void;
}

export function GameTypePicker({ open, onCancel, onSelect }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">Ajouter une étape</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Une étape de jeu (comptée dans la progression) ou une sous-étape de contenu
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Étapes de jeu */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Étape de jeu</p>
          <div className="grid grid-cols-2 gap-3">
            {GAME_ORDER.map((gt) => {
              const meta = GAME_TYPE_META[gt];
              return (
                <button
                  key={gt}
                  onClick={() => onSelect({ kind: "GAME", gameType: gt })}
                  className="flex items-start gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 text-left transition-all hover:shadow-md group"
                  style={{ background: meta.bg }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: meta.color }}
                  >
                    {GAME_ICONS[gt]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {meta.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sous-étapes de jeu (non comptées) */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Sous-étape de jeu{" "}
            <span className="font-medium normal-case text-gray-400">(non comptée dans la progression)</span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            {GAME_ORDER.map((gt) => {
              const meta = GAME_TYPE_META[gt];
              return (
                <button
                  key={gt}
                  onClick={() => onSelect({ kind: "GAME_SUBSTEP", gameType: gt })}
                  className="flex items-start gap-3 p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-left transition-all hover:shadow-sm group"
                  style={{ background: `${meta.bg}` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
                    style={{ background: meta.color }}
                  >
                    {GAME_ICONS[gt]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: meta.color }}>{meta.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Bonus / non compté</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sous-étapes de contenu */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            Sous-étape de contenu{" "}
            <span className="font-medium normal-case text-gray-400">(non comptée comme étape principale)</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CONTENT_ORDER.map((ct) => {
              const meta = CONTENT_TYPE_META[ct];
              return (
                <button
                  key={ct}
                  onClick={() => onSelect({ kind: "CONTENT", contentType: ct })}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 text-left transition-all hover:shadow-md group"
                  style={{ background: meta.bg }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: meta.color }}
                  >
                    {CONTENT_ICONS[ct]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: meta.color }}>
                      {meta.label}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {meta.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
