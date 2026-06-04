"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
    <div className="p-8 space-y-8 min-h-screen">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez vos sessions</p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
        >
          <Plus size={17} />
          Nouvelle session
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <StatsRow sessions={diagSessions} />

          {/* ── Sessions diagnostic actives ── */}
          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Sessions diagnostic
              {diagActive.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-full">
                  {diagActive.length}
                </span>
              )}
            </h2>
            {diagActive.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-gray-400 text-sm">Aucune session diagnostic active.</p>
                <Link
                  href="/dashboard/sessions/new"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
                  style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
                >
                  <Plus size={16} />
                  Créer une session
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {diagActive.map((s) => (
                  <SessionCard key={s.id} session={s} onClose={handleClose} />
                ))}
              </div>
            )}
          </section>

          {/* ── Sessions modules actives ── */}
          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Sessions modules
              {moduleActive.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                  {moduleActive.length}
                </span>
              )}
            </h2>
            {moduleActive.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-gray-400 text-sm">Aucune session module active.</p>
                <Link
                  href="/dashboard/sessions/new"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 text-white text-sm font-semibold rounded-xl"
                  style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
                >
                  <Plus size={16} />
                  Créer une session
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {moduleActive.map((s) => (
                  <ModuleSessionCard key={s.id} session={s} onClose={handleCloseModule} />
                ))}
              </div>
            )}
          </section>

          {/* ── Sessions terminées ── */}
          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Sessions terminées
              {(diagTerminated.length + moduleTerminated.length) > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                  {diagTerminated.length + moduleTerminated.length}
                </span>
              )}
            </h2>
            <SessionsTable sessions={diagTerminated} moduleSessions={moduleTerminated} />
          </section>
        </>
      )}
    </div>
  );
}
