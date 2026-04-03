"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { fetchSessions, closeSession } from "@/lib/dashboard";
import type { SessionSummary } from "@/lib/dashboard";
import { SessionCard } from "./_components/session-card";
import { SessionsTable } from "./_components/sessions-table";
import { StatsRow } from "./_components/stats-row";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    fetchSessions(token)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  async function handleClose(id: string) {
    const token = localStorage.getItem("access_token") ?? "";
    await closeSession(id, token);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: false } : s))
    );
  }

  const active = sessions.filter((s) => s.isActive);
  const terminated = sessions.filter((s) => !s.isActive);

  return (
    <div className="p-8 space-y-8 min-h-screen">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Tableau de bord</h1>
          <p className="text-gray-400 text-sm mt-1">Gérez vos sessions de diagnostic</p>
        </div>
        <Link
          href="/dashboard/sessions/new"
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl shadow hover:opacity-90 transition-opacity"
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
          {/* Stats */}
          <StatsRow sessions={sessions} />

          {/* Sessions actives */}
          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Sessions actives
              {active.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-full">
                  {active.length}
                </span>
              )}
            </h2>
            {active.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-sm">Aucune session active.</p>
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
                {active.map((s) => (
                  <SessionCard key={s.id} session={s} onClose={handleClose} />
                ))}
              </div>
            )}
          </section>

          {/* Sessions terminées */}
          <section>
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">
              Sessions terminées
              {terminated.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                  {terminated.length}
                </span>
              )}
            </h2>
            <SessionsTable sessions={terminated} />
          </section>
        </>
      )}
    </div>
  );
}
