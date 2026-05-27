import type { SessionSummary } from "@/lib/dashboard";

interface Props {
  sessions: SessionSummary[];
}

export function StatsRow({ sessions }: Props) {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.isActive).length;
  const totalStudents = sessions.reduce((acc, s) => acc + s._count.guestStudents, 0);
  const totalResponses = sessions.reduce((acc, s) => acc + s._count.diagnosticResponses, 0);

  const stats: { label: string; value: number; highlight?: boolean }[] = [
    { label: "Sessions totales", value: totalSessions },
    { label: "Sessions actives", value: activeSessions, highlight: true },
    { label: "Élèves", value: totalStudents },
    { label: "Réponses collectées", value: totalResponses },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
      {stats.map(({ label, value, highlight }, i) => (
        <div
          key={label}
          className={`px-5 py-4 ${i > 0 ? "border-l border-gray-200" : ""} ${
            highlight ? "bg-blue-50/40" : ""
          }`}
        >
          <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
            {highlight && (
              <span className="relative flex items-center justify-center">
                <span className="absolute w-2 h-2 rounded-full bg-emerald-500/40 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
            {label}
          </p>
          <p
            className={`text-[28px] font-bold mt-1 tabular-nums leading-none tracking-tight ${
              highlight ? "text-blue-600" : "text-[#1A1A1A]"
            }`}
          >
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}
