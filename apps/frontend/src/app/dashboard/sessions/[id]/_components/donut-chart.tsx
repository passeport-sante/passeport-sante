interface Props {
  correct: number;
  total: number;
  size?: number;
}

export function DonutChart({ correct, total, size = 72 }: Props) {
  const r = (size / 2) * 0.7;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = total === 0 ? 0 : correct / total;
  const stroke = pct * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0F4F8" strokeWidth={size * 0.12} />
      {total > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2A8970"
          strokeWidth={size * 0.12}
          strokeDasharray={`${stroke} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}
      <text
        x={cx}
        y={cy + size * 0.07}
        textAnchor="middle"
        fontSize={size * 0.2}
        fontWeight="800"
        fill="#1A1A1A"
      >
        {total === 0 ? "–" : `${Math.round(pct * 100)}%`}
      </text>
    </svg>
  );
}
