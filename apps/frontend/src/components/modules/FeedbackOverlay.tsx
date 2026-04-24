"use client";

import Image from "next/image";

interface Props {
  show: boolean;
  isCorrect: boolean;
  explanation?: string;
  mascotte?: string | null;
  primaryColor?: string;
  onClose: () => void;
  closeLabel?: string;
}

export function FeedbackOverlay({
  show,
  isCorrect,
  explanation,
  mascotte,
  primaryColor = "#16A34A",
  onClose,
  closeLabel,
}: Props) {
  if (!show) return null;

  const label = closeLabel ?? (isCorrect ? "Continuer →" : "Réessayer");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-0">
      {/* Fond flouté */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panneau qui monte du bas */}
      <div
        className="relative w-full max-w-lg mx-4 mb-8 rounded-3xl overflow-visible shadow-2xl animate-slide-up"
        style={{ background: "#fff" }}
      >
        {/* Mascotte qui dépasse en haut */}
        {mascotte && (
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-36 h-36">
            <Image
              src={`/assets/mascotte/${mascotte}`}
              alt="mascotte"
              fill
              className="object-contain object-bottom drop-shadow-xl"
            />
          </div>
        )}

        <div className="pt-20 pb-8 px-8 flex flex-col items-center gap-4 text-center">
          {/* Badge correct / incorrect */}
          <span
            className="text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full"
            style={
              isCorrect
                ? { background: "#dcfce7", color: "#16a34a" }
                : { background: "#fee2e2", color: "#dc2626" }
            }
          >
            {isCorrect ? "Bonne réponse !" : "Oh zut !"}
          </span>

          <h3 className="text-2xl font-black text-gray-900">
            {isCorrect ? "Bravo !" : "Pas tout à fait..."}
          </h3>

          {explanation && (
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              {explanation}
            </p>
          )}

          <button
            onClick={onClose}
            className="mt-2 w-full py-4 rounded-2xl text-white font-black text-base transition-opacity hover:opacity-90"
            style={{ background: primaryColor }}
          >
            {label}
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>
    </div>
  );
}
