"use client";

type Option = { id: string; label: string };

type Props = {
  question: string;
  options: Option[];
  selected: string | null;
  onSelect: (id: string) => void;
};

export function QuestionMcq({ question, options, selected, onSelect }: Props) {
  const cols = options.length <= 2 ? 2 : options.length <= 4 ? 2 : 3;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* Question */}
      <div
        className="bg-[#1A527A] rounded-2xl px-10 py-7 w-full text-center"
        style={{ boxShadow: "0 0 40px rgba(78,175,90,0.35), 0 8px 32px rgba(0,0,0,0.25)" }}
      >
        <p className="text-2xl font-black text-white leading-snug">{question}</p>
      </div>

      {/* Options */}
      <div
        className="grid gap-4 w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {options.map((opt, i) => {
          const isSelected = selected === opt.id;
          const isLastOdd = i === options.length - 1 && options.length % cols !== 0;

          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="rounded-2xl px-6 py-7 font-bold text-xl text-white text-center transition-all duration-200"
              style={{
                background: isSelected ? "#2A6B8A" : "#1A527A",
                border: `2px solid ${isSelected ? "#4CAF5A" : "rgba(76,175,90,0.4)"}`,
                boxShadow: isSelected ? "0 0 16px rgba(76,175,90,0.3)" : "none",
                transform: isSelected ? "scale(1.02)" : "scale(1)",
                ...(isLastOdd && { gridColumn: "1 / -1", maxWidth: "50%", margin: "0 auto", width: "100%" }),
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
