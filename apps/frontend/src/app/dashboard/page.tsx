"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Stethoscope, BookOpen } from "lucide-react";
import {
  fetchSessions,
  closeSession,
  fetchModuleSessions,
  closeModuleSession,
} from "@/lib/dashboard";
import type { ModuleSessionSummary, SessionSummary } from "@/lib/dashboard";
import { SessionCard } from "./_components/session-card";
import { ModuleSessionCard } from "./_components/module-session-card";
import { SessionsTable } from "./_components/sessions-table";
import { StatsRow } from "./_components/stats-row";

export default function DashboardPage() {
  const [diagSessions, setDiagSessions] = useState<SessionSummary[]>([]);
  const [moduleSessions, setModuleSessions] = useState<ModuleSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    Promise.all([fetchSessions(token), fetchModuleSessions(token)])
      .then(([diag, mod]) => {
        setDiagSessions(diag);
        setModuleSessions(mod);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleClose(id: string) {
    const token = localStorage.getItem("access_token") ?? "";
    await closeSession(id, token);
    setDiagSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: false } : s)),
    );
  }

  async function handleCloseModule(id: string) {
    const token = localStorage.getItem("access_token") ?? "";
    await closeModuleSession(id, token);
    setModuleSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: false } : s)),
    );
  }

  const diagActive = diagSessions.filter((s) => s.isActive);
  const diagTerminated = diagSessions.filter((s) => !s.isActive);
  const moduleActive = moduleSessions.filter((s) => s.isActive);
  const moduleTerminated = moduleSessions.filter((s) => !s.isActive);

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight">
            Tableau de bord
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos sessions
          </p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nouvelle session
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <StatsRow sessions={diagSessions} />

          {/* ── Sessions diagnostic actives ── */}
          <Section
            title="Sessions diagnostic"
            count={diagActive.length}
            empty={
              <EmptyBlock
                icon={<Stethoscope size={18} className="text-gray-400" />}
                title="Aucune session diagnostic active"
                cta="Créer une session"
                href="/dashboard/sessions/new"
              />
            }
            isEmpty={diagActive.length === 0}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {diagActive.map((s) => (
                <SessionCard key={s.id} session={s} onClose={handleClose} />
              ))}
            </div>
          </Section>

          {/* ── Sessions modules actives ── */}
          <Section
            title="Sessions modules"
            count={moduleActive.length}
            empty={
              <EmptyBlock
                icon={<BookOpen size={18} className="text-gray-400" />}
                title="Aucune session module active"
                cta="Créer une session"
                href="/dashboard/sessions/new"
              />
            }
            isEmpty={moduleActive.length === 0}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {moduleActive.map((s) => (
                <ModuleSessionCard key={s.id} session={s} onClose={handleCloseModule} />
              ))}
            </div>
          </Section>

          {/* ── Sessions terminées ── */}
          {(diagTerminated.length + moduleTerminated.length) > 0 && (
            <Section
              title="Sessions terminées"
              count={diagTerminated.length + moduleTerminated.length}
              isEmpty={false}
            >
              <SessionsTable sessions={diagTerminated} moduleSessions={moduleTerminated} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  children,
  empty,
  isEmpty,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  empty?: React.ReactNode;
  isEmpty: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <h2 className="text-[16px] font-bold text-[#1A1A1A] tracking-tight">{title}</h2>
        {count > 0 && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold tabular-nums">
            {count}
          </span>
        )}
      </div>
      {isEmpty ? empty : children}
    </section>
  );
}

function EmptyBlock({
  icon,
  title,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 py-10 text-center">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <p className="text-[13px] text-gray-600">{title}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 mt-4 h-8 px-3 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={14} strokeWidth={2.5} />
        {cta}
      </Link>
    </div>
  );
}
