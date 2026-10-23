"use client";

import { useEffect, useState } from "react";
import { fetchSessions, fetchModuleSessions, deleteSession, deleteModuleSession } from "@/lib/dashboard";
import type { SessionSummary, ModuleSessionSummary } from "@/lib/dashboard";
import { SessionsTable } from "../../_components/sessions-table";

export default function TerminatedSessionsPage() {
  const [terminated, setTerminated] = useState<SessionSummary[]>([]);
  const [terminatedModules, setTerminatedModules] = useState<ModuleSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    Promise.all([
      fetchSessions(token),
      fetchModuleSessions(token),
    ])
      .then(([diag, mod]) => {
        setTerminated(diag.filter((s) => !s.isActive));
        setTerminatedModules(mod.filter((s) => !s.isActive));
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, type: "diagnostic" | "module") {
    const token = localStorage.getItem("access_token") ?? "";
    if (type === "diagnostic") {
      await deleteSession(id, token);
      setTerminated((prev) => prev.filter((s) => s.id !== id));
    } else {
      await deleteModuleSession(id, token);
      setTerminatedModules((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Sessions Terminées</h1>
        <p className="text-gray-400 text-sm mt-1">Historique de toutes vos sessions clôturées</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <SessionsTable sessions={terminated} moduleSessions={terminatedModules} onDelete={handleDelete} />
      )}
    </div>
  );
}
