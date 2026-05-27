"use client";

import { X, ListTodo, HelpCircle, ListOrdered, Type, MessageCircle } from "lucide-react";
import { GAME_TYPE_META, type GameType } from "@/lib/steps-admin";

const ICONS: Record<GameType, React.ReactNode> = {
  KANBAN: <ListTodo size={22} />,
  QUIZ: <HelpCircle size={22} />,
  PUZZLE: <ListOrdered size={22} />,
  PHRASE_A_TROU: <Type size={22} />,
  SCENARIO: <MessageCircle size={22} />,
};

const ORDER: GameType[] = ["KANBAN", "QUIZ", "PUZZLE", "PHRASE_A_TROU", "SCENARIO"];

interface Props {
  open: boolean;
  onCancel: () => void;
  onSelect: (gameType: GameType) => void;
}

export function GameTypePicker({ open, onCancel, onSelect }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">Quel type d&apos;étape ?</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Choisissez la mécanique pédagogique adaptée à votre contenu
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ORDER.map((gt) => {
            const meta = GAME_TYPE_META[gt];
            return (
              <button
                key={gt}
                onClick={() => onSelect(gt)}
                className="flex items-start gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-gray-200 text-left transition-all hover:shadow-md group"
                style={{ background: meta.bg }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: meta.color }}
                >
                  {ICONS[gt]}
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
  );
}
