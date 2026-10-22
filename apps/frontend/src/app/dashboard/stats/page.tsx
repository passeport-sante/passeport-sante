"use client";

import { useEffect, useMemo, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { FileDown, Users, Layers, FileText, Target, CheckCircle2 } from "lucide-react";
import { CLASS_LEVELS, slicesFromCounts } from "@/lib/dashboard";
import type { ClassLevel, QuestionStats } from "@/lib/dashboard";
import { fetchStats, departmentLabel } from "@/lib/stats";
import type { StatsFilters, StatsResult, StatsModule } from "@/lib/stats";
import { QuestionResultCard } from "../sessions/[id]/_components/question-result-card";
import { StatsPdfDocument } from "./_components/StatsPdfDocument";
import { GAME_TYPE_LABEL } from "./_components/labels";

const NO_LEVEL = "NONE"; // anciennes sessions dont le niveau n'a pas pu être déduit

function readRole(): string | null {
  try {
    const token = localStorage.getItem("access_token") ?? "";
    return JSON.parse(atob(token.split(".")[1]!)).role ?? null;
  } catch {
    return null;
  }
}

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

export default function StatsPage() {
  const [filters, setFilters] = useState<StatsFilters>({});
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);

  useEffect(() => {
    const role = readRole();
    setIsGlobal(role === "ADMIN" || role === "COLLABORATEUR");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchStats(filters, localStorage.getItem("access_token") ?? "")
      .then((data) => { if (!cancelled) setStats(data); })
      .catch((err: Error) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  // Changer un filtre « parent » vide les filtres qui en dépendent
  // (département → établissement → classe ; année / niveau → classe).
  function update(patch: StatsFilters) {
    setFilters((f) => {
      const next = { ...f, ...patch };
      if ("department" in patch) next.organizationId = undefined;
      if ("department" in patch || "organizationId" in patch || "schoolYear" in patch || "level" in patch) {
        next.className = undefined;
      }
      return next;
    });
  }

  const questionStats: QuestionStats[] = useMemo(
    () =>
      (stats?.diagnostic.questions ?? []).map((q) => ({
        question: q.question,
        totalAnswered: q.totalAnswered,
        slices: slicesFromCounts(q.question, q.answerCounts, q.correctCount, q.incorrectCount),
      })),
    [stats],
  );

  const orgOptions = useMemo(
    () =>
      (stats?.filters.organizations ?? []).filter(
        (o) => !filters.department || o.department === filters.department,
      ),
    [stats, filters.department],
  );

  const filtersLabel = useMemo(() => {
    if (!stats) return "";
    const parts: string[] = [];
    if (filters.department) parts.push(`Département ${departmentLabel(filters.department)}`);
    const org = stats.filters.organizations.find((o) => o.id === filters.organizationId);
    if (org) parts.push(org.name);
    else if (stats.scope === "organization" && stats.filters.organizations[0]) parts.push(stats.filters.organizations[0].name);
    if (filters.className) parts.push(`Classe ${filters.className}`);
    if (filters.level) {
      parts.push(
        filters.level === NO_LEVEL
          ? "Niveau non renseigné"
          : `Niveau ${CLASS_LEVELS.find((l) => l.value === filters.level)?.label}`,
      );
    }
    parts.push(filters.schoolYear ? `Année ${filters.schoolYear}` : "Toutes les années");
    if (stats.scope === "global" && !filters.department && !filters.organizationId) parts.unshift("Tous les établissements");
    return parts.join(" · ");
  }, [stats, filters]);

  if (!stats && loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <p className="p-8 text-sm text-red-500">{error || "Statistiques indisponibles."}</p>;
  }

  const { diagnostic: d, modules: m } = stats;
  const hasFilters = Object.values(filters).some(Boolean);
  const fileSlug = filtersLabel.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Statistiques</h1>
          <p className="text-gray-400 text-sm mt-1">{filtersLabel}</p>
        </div>
        <PDFDownloadLink
          document={<StatsPdfDocument stats={stats} questionStats={questionStats} filtersLabel={filtersLabel} />}
          fileName={`statistiques-${fileSlug || "export"}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <button
              disabled={pdfLoading || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-[#EBF4F8] text-[#1B6B8A] hover:bg-[#DCEBF2] transition-colors disabled:opacity-50"
            >
              <FileDown size={15} />
              {pdfLoading ? "Génération…" : "Exporter en PDF"}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      {/* Filtres */}
      <div
        className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-end gap-x-3 gap-y-6 ${
          stats.filters.classFilterEnabled ? "" : "pb-8"
        }`}
      >
        {isGlobal && (
          <>
            <FilterSelect label="Département" value={filters.department ?? ""} onChange={(v) => update({ department: v || undefined })}>
              <option value="">Tous les départements</option>
              {stats.filters.departments.map((dep) => (
                <option key={dep} value={dep}>{departmentLabel(dep)}</option>
              ))}
            </FilterSelect>
            <FilterSelect label="Établissement" value={filters.organizationId ?? ""} onChange={(v) => update({ organizationId: v || undefined })}>
              <option value="">Tous les établissements</option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}{o.city ? ` (${o.city})` : ""}</option>
              ))}
            </FilterSelect>
          </>
        )}
        <FilterSelect label="Année scolaire" value={filters.schoolYear ?? ""} onChange={(v) => update({ schoolYear: v || undefined })}>
          <option value="">Toutes les années</option>
          {stats.filters.schoolYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </FilterSelect>
        <FilterSelect label="Niveau" value={filters.level ?? ""} onChange={(v) => update({ level: (v || undefined) as ClassLevel | "NONE" | undefined })}>
          <option value="">Tous les niveaux</option>
          {CLASS_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
          <option value={NO_LEVEL}>Non renseigné</option>
        </FilterSelect>
        <FilterSelect
          label="Classe"
          value={filters.className ?? ""}
          onChange={(v) => update({ className: v || undefined })}
          disabled={!stats.filters.classFilterEnabled}
          hint={!stats.filters.classFilterEnabled ? "Choisissez d'abord un établissement" : undefined}
        >
          <option value="">Toutes les classes</option>
          {stats.filters.classes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </FilterSelect>
        {hasFilters && (
          <button
            onClick={() => setFilters({})}
            className="px-3 py-2 text-sm font-semibold text-gray-500 hover:text-[#1B6B8A] transition-colors"
          >
            Réinitialiser
          </button>
        )}
        {loading && <div className="w-5 h-5 mb-2 border-2 border-[#2A8970] border-t-transparent rounded-full animate-spin" />}
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      {/* Chiffres clés */}
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${loading ? "opacity-50" : ""}`}>
        <MiniStat label="Élèves (diagnostic)" value={d.students} sub={`${d.completed} ont terminé · ${d.sessions} session${d.sessions > 1 ? "s" : ""}`} color="#1B6B8A" icon={Users} />
        <MiniStat label="Score moyen diagnostic" value={pct(d.avgScore)} sub={`${d.responses} réponses`} color="#4CAF5A" icon={Target} />
        <MiniStat label="Élèves (modules)" value={m.students} sub={`${m.sessions} session${m.sessions > 1 ? "s" : ""}`} color="#2A8970" icon={Layers} />
        <MiniStat label="Réussite modules" value={pct(m.successRate)} sub={`${m.responses} réponses`} color="#6366F1" icon={CheckCircle2} />
      </div>

      <div className={`space-y-6 md:space-y-8 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {/* Tableau comparatif */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {stats.breakdownBy === "organization" ? "Par établissement" : "Par classe"}
          </h2>
          {stats.breakdown.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune session pour ces filtres.</p>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {[
                      stats.breakdownBy === "organization" ? "Établissement" : "Classe",
                      "Sessions diag.",
                      "Élèves diag.",
                      "Score diag.",
                      "Sessions modules",
                      "Élèves modules",
                      "Réussite modules",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 font-semibold text-gray-400 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.breakdown.map((row) => (
                    <tr key={`${row.label}|${row.sublabel}`} className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1A1A1A]">{row.label}</p>
                        {row.sublabel && <p className="text-xs text-gray-400">{row.sublabel}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.diagSessions}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.diagStudents} <span className="text-xs text-gray-400">({row.diagCompleted} terminés)</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#4CAF5A]">{pct(row.diagAvgScore)}</td>
                      <td className="px-4 py-3 text-gray-600">{row.moduleSessions}</td>
                      <td className="px-4 py-3 text-gray-600">{row.moduleStudents}</td>
                      <td className="px-4 py-3 font-bold text-[#6366F1]">{pct(row.moduleSuccessRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Modules */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
            <Layers size={18} className="text-[#1B6B8A]" />
            Modules
          </h2>
          {m.modules.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune session de module pour ces filtres.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {m.modules.map((mod) => (
                <ModuleCard key={mod.module.id} mod={mod} />
              ))}
            </div>
          )}
        </section>

        {/* Diagnostic */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
            <FileText size={18} className="text-[#6366F1]" />
            Diagnostic — résultats par question
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">{questionStats.length}</span>
          </h2>
          {questionStats.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune réponse au diagnostic pour ces filtres.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {questionStats.map((qs, i) => (
                <QuestionResultCard key={qs.question.id} stats={qs} index={i + 1} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ModuleCard({ mod }: { mod: StatsModule }) {
  const color = mod.module.colorPrimary ?? "#1B6B8A";
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-[#1A1A1A]">{mod.module.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {mod.students} élève{mod.students > 1 ? "s" : ""} · {mod.completed} ont terminé · {mod.sessions} session{mod.sessions > 1 ? "s" : ""}
          </p>
        </div>
        <span className="text-2xl font-black" style={{ color }}>{pct(mod.successRate)}</span>
      </div>
      <div className="space-y-2">
        {mod.steps.map((st) => (
          <div key={st.step.id} className="space-y-1">
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-gray-600 truncate">
                <span className="font-semibold">Étape {st.step.order}</span> ·{" "}
                {st.step.content?.title ?? GAME_TYPE_LABEL[st.step.gameType ?? ""] ?? st.step.gameType}
              </span>
              <span className="shrink-0 text-gray-400">
                {st.attempts > 0 ? `${pct(st.successRate)} · ${st.attempts} tentative${st.attempts > 1 ? "s" : ""}` : "aucune réponse"}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${st.successRate ?? 0}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  disabled,
  hint,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative flex flex-col gap-1 min-w-[160px]" title={hint}>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2A8970] disabled:bg-gray-50 disabled:text-gray-400"
      >
        {children}
      </select>
      {/* Hors du flux : la colonne garde la hauteur des autres filtres, qui restent alignés. */}
      {hint && <span className="absolute left-0 top-full mt-1 whitespace-nowrap text-[11px] text-gray-400">{hint}</span>}
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
  value: number | string;
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
