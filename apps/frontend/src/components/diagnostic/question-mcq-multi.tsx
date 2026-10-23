"use client";

type Option = { id: string; label: string };

type Props = {
  question: string;
  options: Option[];
  selected: string[];
  onToggle: (id: string) => void;
};

export function QuestionMcqMulti({ question, options, selected, onToggle }: Props) {
  const wide = options.length >= 6 && options.length % 3 !== 2;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Question */}
      <div
        className="bg-[#1A527A] rounded-2xl px-6 py-6 sm:px-10 sm:py-7 w-full text-center"
        style={{ boxShadow: "0 0 40px rgba(78,175,90,0.35), 0 8px 32px rgba(0,0,0,0.25)" }}
      >
        <p className="text-xl sm:text-2xl font-black text-white leading-snug">{question}</p>
        <p className="text-white/50 text-sm mt-2 font-medium">Plusieurs réponses possibles</p>
      </div>

      {/* Options — 1 col (mobile) → 2 → 3 */}
      <div className={`grid gap-3 sm:gap-4 w-full grid-cols-1 sm:grid-cols-2 ${wide ? "lg:grid-cols-3" : ""}`}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className="rounded-2xl px-4 py-4 sm:px-6 sm:py-6 font-bold text-base sm:text-lg text-white text-left flex items-center gap-3 sm:gap-4 transition-all duration-200"
              style={{
                background: isSelected ? "#2A6B8A" : "#1A527A",
                border: `2px solid ${isSelected ? "#4CAF5A" : "rgba(76,175,90,0.4)"}`,
                boxShadow: isSelected ? "0 0 16px rgba(76,175,90,0.3)" : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
              }}
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors"
                style={{
                  background: isSelected ? "#4CAF5A" : "rgba(255,255,255,0.1)",
                  border: `2px solid ${isSelected ? "#4CAF5A" : "rgba(255,255,255,0.3)"}`,
                }}
              >
                {isSelected && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
