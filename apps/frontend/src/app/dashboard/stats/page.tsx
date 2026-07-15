"use client";

import { useEffect, useState } from "react";
import { Users, Layers, Activity, FileText } from "lucide-react";
import { fetchSessions, fetchModuleSessions } from "@/lib/dashboard";
import type { SessionSummary, ModuleSessionSummary } from "@/lib/dashboard";
import { StatsRow } from "../_components/stats-row";

type ModuleBreakdown = {
  id: string;
  title: string;
  color: string;
  sessions: number;
  students: number;
};

export default function StatsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [moduleSessions, setModuleSessions] = useState<ModuleSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    Promise.all([fetchSessions(token), fetchModuleSessions(token)])
      .then(([diag, mod]) => {
        setSessions(diag);
        setModuleSessions(mod);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Diagnostic ──────────────────────────────────────────────────────────────
  const diagStudents = sessions.reduce((a, s) => a + s._count.guestStudents, 0);
  const diagResponses = sessions.reduce((a, s) => a + s._count.diagnosticResponses, 0);
  const diagAvgStudents = sessions.length > 0 ? Math.round(diagStudents / sessions.length) : 0;
  const diagAvgResponses = diagStudents > 0 ? Math.round(diagResponses / diagStudents) : 0;

  // ── Modules ───────────────────────────────────────────────────────────────
  const moduleStudents = moduleSessions.reduce((a, s) => a + s._count.guestStudents, 0);
  const moduleActive = moduleSessions.filter((s) => s.isActive).length;

  // Répartition par module
  const byModule = new Map<string, ModuleBreakdown>();
  for (const s of moduleSessions) {
    const key = s.module?.id ?? "unknown";
    const existing = byModule.get(key);
    if (existing) {
      existing.sessions += 1;
      existing.students += s._count.guestStudents;
    } else {
      byModule.set(key, {
        id: key,
        title: s.module?.title ?? "Module supprimé",
        color: s.module?.colorPrimary ?? "#1B6B8A",
        sessions: 1,
        students: s._count.guestStudents,
      });
    }
  }
  const moduleBreakdown = [...byModule.values()].sort((a, b) => b.students - a.students);
  const maxStudents = Math.max(1, ...moduleBreakdown.map((m) => m.students));

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Statistiques école</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d&apos;ensemble de votre établissement</p>
      </div>

      {/* Vue d'ensemble combinée */}
      <StatsRow sessions={sessions} moduleSessions={moduleSessions} />

      {/* ── Section Modules ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
          <Layers size={18} className="text-[#1B6B8A]" />
          Modules
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniStat label="Sessions modules" value={moduleSessions.length} color="#1B6B8A" icon={Layers} />
          <MiniStat label="Sessions actives" value={moduleActive} color="#2A8970" icon={Activity} />
          <MiniStat label="Élèves (modules)" value={moduleStudents} color="#4CAF5A" icon={Users} />
        </div>

        {/* Répartition par module */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Répartition des élèves par module
          </p>
          {moduleBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune session module pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {moduleBreakdown.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-semibold text-gray-700">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                      {m.title}
                    </span>
                    <span className="text-gray-400">
                      {m.students} élève{m.students > 1 ? "s" : ""} · {m.sessions} session{m.sessions > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${(m.students / maxStudents) * 100}%`, background: m.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Section Diagnostic ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
          <FileText size={18} className="text-[#6366F1]" />
          Diagnostic
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniStat label="Sessions diagnostic" value={sessions.length} color="#6366F1" icon={FileText} />
          <MiniStat label="Élèves (diagnostic)" value={diagStudents} color="#4CAF5A" icon={Users} />
          <MiniStat label="Élèves / session" value={diagAvgStudents} color="#1B6B8A" icon={Users} sub="en moyenne" />
          <MiniStat label="Réponses / élève" value={diagAvgResponses} color="#2A8970" icon={FileText} sub="en moyenne" />
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  icon: Icon,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof Users;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={15} style={{ color }} />
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
