"use client";

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export function NextButton({ onClick, disabled = false }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed group"
    >
      <div className="bg-[#0F3A5C]/80 backdrop-blur-sm rounded-2xl px-5 py-3 group-hover:bg-[#0F3A5C] transition-colors">
        <span className="text-white text-2xl font-black">&gt;&gt;</span>
      </div>
      <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">
        suivant
      </span>
    </button>
  );
}
