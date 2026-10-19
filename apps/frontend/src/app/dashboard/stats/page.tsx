"use client";

import { useEffect, useState } from "react";
import { Users, Layers, Activity, FileText } from "lucide-react";
import { fetchSessions, fetchModuleSessions, CLASS_LEVELS } from "@/lib/dashboard";
import type { SessionSummary, ModuleSessionSummary, ClassLevel } from "@/lib/dashboard";
import { StatsRow } from "../_components/stats-row";

const ALL = "all";
const NO_LEVEL = "none"; // anciennes sessions dont le niveau n'a pas pu être déduit

type ModuleBreakdown = {
  id: string;
  title: string;
  color: string;
  sessions: number;
  students: number;
};

export default function StatsPage() {
  const [allSessions, setAllSessions] = useState<SessionSummary[]>([]);
  const [allModuleSessions, setAllModuleSessions] = useState<ModuleSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>(ALL);
  const [levelFilter, setLevelFilter] = useState<string>(ALL);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    Promise.all([fetchSessions(token), fetchModuleSessions(token)])
      .then(([diag, mod]) => {
        setAllSessions(diag);
        setAllModuleSessions(mod);
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

  // ── Filtres année scolaire / niveau ─────────────────────────────────────────
  const schoolYears = [...new Set([...allSessions, ...allModuleSessions].map((s) => s.schoolYear))]
    .sort()
    .reverse();
  const hasUnknownLevel = [...allSessions, ...allModuleSessions].some((s) => s.level === null);
  const matches = (s: { schoolYear: string; level: ClassLevel | null }) =>
    (yearFilter === ALL || s.schoolYear === yearFilter) &&
    (levelFilter === ALL || (levelFilter === NO_LEVEL ? s.level === null : s.level === levelFilter));
  const sessions = allSessions.filter(matches);
  const moduleSessions = allModuleSessions.filter(matches);

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

      {/* Filtres */}
      <div className="flex flex-wrap items-end gap-3">
        <FilterSelect label="Année scolaire" value={yearFilter} onChange={setYearFilter}>
          <option value={ALL}>Toutes les années</option>
          {schoolYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Niveau" value={levelFilter} onChange={setLevelFilter}>
          <option value={ALL}>Tous les niveaux</option>
          {CLASS_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
          {hasUnknownLevel && <option value={NO_LEVEL}>Non renseigné</option>}
        </FilterSelect>
        {(yearFilter !== ALL || levelFilter !== ALL) && (
          <button
            onClick={() => { setYearFilter(ALL); setLevelFilter(ALL); }}
            className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-[#1B6B8A] transition-colors"
          >
            Réinitialiser
          </button>
        )}
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

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2A8970]"
      >
        {children}
      </select>
    </label>
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
