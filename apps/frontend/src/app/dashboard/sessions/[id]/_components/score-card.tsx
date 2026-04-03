interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  bg?: string;
}

export function ScoreCard({ label, value, sub, color = "#1B6B8A", bg = "#EBF4F8" }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-4xl font-black" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-sm text-gray-400">{sub}</p>}
      <div className="mt-2 h-1 w-12 rounded-full" style={{ background: color, opacity: 0.4 }} />
    </div>
  );
}
