"use client";

type Props = {
  question: string;
  value: number;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  onChange: (value: number) => void;
};

export function QuestionSlider({
  question,
  value,
  min = 1,
  max = 10,
  minLabel = "Reposé",
  maxLabel = "Épuisé",
  onChange,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* Question */}
      <div className="bg-[#1A527A]/80 backdrop-blur-sm rounded-2xl px-12 py-8 w-full text-center">
        <p className="text-3xl font-black text-white leading-snug">{question}</p>
      </div>

      {/* Valeur affichée */}
      <span className="text-9xl font-black text-white leading-none">{value}</span>

      {/* Slider */}
      <div className="w-full px-2">
        <style>{`
          .diag-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: grab;
            border: 3px solid #2A8970;
          }
          .diag-slider::-moz-range-thumb {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #ffffff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: grab;
            border: 3px solid #2A8970;
          }
        `}</style>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="diag-slider w-full h-5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #0F3A5C ${pct}%, rgba(255,255,255,0.3) ${pct}%)`,
          }}
        />
        <div className="flex justify-between mt-3 text-white/80 text-sm font-semibold">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
        <p className="text-center text-white/60 text-sm mt-1">
          Intensité de {min} à {max}
        </p>
      </div>
    </div>
  );
}
