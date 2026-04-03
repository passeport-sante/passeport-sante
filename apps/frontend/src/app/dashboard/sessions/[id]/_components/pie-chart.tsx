interface Slice {
  count: number;
  color: string;
}

interface Props {
  slices: Slice[];
  size?: number;
}

export function PieChart({ slices, size = 120 }: Props) {
  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="#F0F4F8" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={10} fill="#9CA3AF">
          –
        </text>
      </svg>
    );
  }

  // Single-slice case: full circle
  if (slices.filter((s) => s.count > 0).length === 1) {
    const single = slices.find((s) => s.count > 0)!;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={single.color} />
      </svg>
    );
  }

  let currentAngle = -Math.PI / 2; // start from top
  const paths: { d: string; color: string }[] = [];

  for (const slice of slices) {
    if (slice.count === 0) continue;
    const angle = (slice.count / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    paths.push({
      d: `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`,
      color: slice.color,
    });

    currentAngle = endAngle;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={1.5} />
      ))}
    </svg>
  );
}
