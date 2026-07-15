"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export type ClassifyItem = { id: string; text: string };

type Props = {
  title?: string;
  subtitle?: string;
  items: ClassifyItem[];
  onValidate: (result: { vraiIds: string[]; fauxIds: string[] }) => void;
};

type Zone = "pending" | "vrai" | "faux";

export function QuestionClassify({
  title = "A CLASSER",
  subtitle = "Glisser les cartes dans la bonne colonne",
  items,
  onValidate,
}: Props) {
  const [zones, setZones] = useState<Record<string, Zone>>(
    Object.fromEntries(items.map((i) => [i.id, "pending"]))
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const inZone = (zone: Zone) => items.filter((i) => zones[i.id] === zone);

  const drop = (zone: Zone) => {
    if (!draggingId) return;
    setZones((prev) => ({ ...prev, [draggingId]: zone }));
    setDraggingId(null);
  };

  const allClassified = inZone("pending").length === 0;

  const dropProps = (zone: Zone) => ({
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: () => drop(zone),
  });

  const dragItem = (id: string, zone: Zone) => (
    <div
      key={id}
      draggable
      onDragStart={() => setDraggingId(id)}
      className={`rounded-full px-3 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 cursor-grab select-none transition-transform active:scale-95 break-words ${
        zone === "pending" ? "bg-white/75 w-full text-center" : "bg-white/80"
      }`}
    >
      {items.find((i) => i.id === id)!.text}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full h-full px-3 sm:px-8 py-4 sm:py-6 gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-1">
        <Heart size={36} className="text-white/25 sm:hidden" />
        <Heart size={44} className="text-white/25 hidden sm:block" />
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center">{title}</h2>
        <p className="text-white/60 text-xs sm:text-sm text-center">{subtitle}</p>
      </div>

      {/* Colonnes */}
      <div className="flex gap-2 sm:gap-6 w-full flex-1">
        {/* Vrai */}
        <div
          className="flex-1 min-w-0 border-2 border-green-400 bg-green-300/30 rounded-2xl sm:rounded-3xl p-2 sm:p-4 flex flex-col gap-2 sm:gap-3"
          {...dropProps("vrai")}
        >
          <p className="text-white font-black text-lg sm:text-2xl">Vrai</p>
          {inZone("vrai").map((i) => dragItem(i.id, "vrai"))}
        </div>

        {/* Centre : items non classés + bouton */}
        <div
          className="flex-1 min-w-0 flex flex-col items-center gap-2 sm:gap-3"
          {...dropProps("pending")}
        >
          {inZone("pending").map((i) => dragItem(i.id, "pending"))}

          <button
            onClick={() =>
              onValidate({
                vraiIds: inZone("vrai").map((i) => i.id),
                fauxIds: inZone("faux").map((i) => i.id),
              })
            }
            disabled={!allClassified}
            className="mt-auto bg-green-500 hover:bg-green-600 disabled:bg-green-500/40 disabled:cursor-not-allowed text-white font-black py-3 px-5 sm:py-4 sm:px-10 rounded-2xl text-sm sm:text-lg transition-colors w-full sm:w-auto"
          >
            Valider
          </button>
        </div>

        {/* Faux */}
        <div
          className="flex-1 min-w-0 border-2 border-red-400 bg-red-300/20 rounded-2xl sm:rounded-3xl p-2 sm:p-4 flex flex-col gap-2 sm:gap-3 items-end"
          {...dropProps("faux")}
        >
          <p className="text-white font-black text-lg sm:text-2xl">Faux</p>
          {inZone("faux").map((i) => dragItem(i.id, "faux"))}
        </div>
      </div>
    </div>
  );
}
