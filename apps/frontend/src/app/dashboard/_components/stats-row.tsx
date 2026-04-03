import { Activity, CheckCircle, Users, BarChart2 } from "lucide-react";
import type { SessionSummary } from "@/lib/dashboard";

interface Props {
  sessions: SessionSummary[];
}

export function StatsRow({ sessions }: Props) {
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.isActive).length;
  const totalStudents = sessions.reduce((acc, s) => acc + s._count.guestStudents, 0);
  const totalResponses = sessions.reduce((acc, s) => acc + s._count.diagnosticResponses, 0);

  const stats = [
    {
      label: "Sessions totales",
      value: totalSessions,
      icon: BarChart2,
      color: "#1B6B8A",
      bg: "#EBF4F8",
    },
    {
      label: "Sessions actives",
      value: activeSessions,
      icon: Activity,
      color: "#2A8970",
      bg: "#EBF6F3",
    },
    {
      label: "Élèves total",
      value: totalStudents,
      icon: Users,
      color: "#4CAF5A",
      bg: "#EDF7EE",
    },
    {
      label: "Réponses collectées",
      value: totalResponses,
      icon: CheckCircle,
      color: "#6366F1",
      bg: "#EEEEFD",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
            <Icon size={22} style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-black text-[#1A1A1A]">{value}</p>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
