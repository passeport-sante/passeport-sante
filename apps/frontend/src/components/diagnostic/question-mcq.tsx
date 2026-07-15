"use client";

type Option = { id: string; label: string };

type Props = {
  question: string;
  options: Option[];
  selected: string | null;
  onSelect: (id: string) => void;
};

export function QuestionMcq({ question, options, selected, onSelect }: Props) {
  const wide = options.length >= 6 && options.length % 3 !== 2;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Question */}
      <div
        className="bg-[#1A527A] rounded-2xl px-6 py-6 sm:px-10 sm:py-7 w-full text-center"
        style={{ boxShadow: "0 0 40px rgba(78,175,90,0.35), 0 8px 32px rgba(0,0,0,0.25)" }}
      >
        <p className="text-xl sm:text-2xl font-black text-white leading-snug">{question}</p>
      </div>

      {/* Options — 1 col (mobile) → 2 → 3 (si beaucoup d'options) */}
      <div className={`grid gap-3 sm:gap-4 w-full grid-cols-1 sm:grid-cols-2 ${wide ? "lg:grid-cols-3" : ""}`}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="rounded-2xl px-4 py-5 sm:px-6 sm:py-7 font-bold text-base sm:text-xl text-white text-center transition-all duration-200"
              style={{
                background: isSelected ? "#2A6B8A" : "#1A527A",
                border: `2px solid ${isSelected ? "#4CAF5A" : "rgba(76,175,90,0.4)"}`,
                boxShadow: isSelected ? "0 0 16px rgba(76,175,90,0.3)" : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
