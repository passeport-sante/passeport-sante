"use client";

type Props = {
  question: string;
  selected: boolean | null;
  onAnswer: (value: boolean) => void;
};

export function QuestionOuiNon({ question, selected, onAnswer }: Props) {
  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-2xl">
      {/* Question */}
      <div
        className="bg-[#1A527A]/80 backdrop-blur-sm rounded-2xl px-12 py-8 w-full text-center"
        style={{ boxShadow: "0 0 40px rgba(78,175,90,0.35), 0 8px 32px rgba(0,0,0,0.25)" }}
      >
        <p className="text-3xl font-black text-white leading-snug">{question}</p>
      </div>

      {/* Boutons */}
      <div className="flex gap-8">
        <button
          onClick={() => onAnswer(true)}
          className={`w-52 h-28 rounded-2xl font-black text-4xl text-white border-4 transition-all duration-200 ${
            selected === true
              ? "bg-green-500/80 border-green-400 scale-105"
              : "bg-green-500/30 border-green-400 hover:bg-green-500/50"
          }`}
        >
          OUI
        </button>
        <button
          onClick={() => onAnswer(false)}
          className={`w-52 h-28 rounded-2xl font-black text-4xl text-white border-4 transition-all duration-200 ${
            selected === false
              ? "bg-red-400/70 border-red-400 scale-105"
              : "bg-red-400/20 border-red-400 hover:bg-red-400/40"
          }`}
        >
          NON
        </button>
      </div>
    </div>
  );
}
