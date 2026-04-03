"use client";

import { useEffect, useState } from "react";
import { fetchSessions } from "@/lib/dashboard";
import type { SessionSummary } from "@/lib/dashboard";
import { StatsRow } from "../_components/stats-row";

export default function StatsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    fetchSessions(token)
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalStudents = sessions.reduce((acc, s) => acc + s._count.guestStudents, 0);
  const totalResponses = sessions.reduce((acc, s) => acc + s._count.diagnosticResponses, 0);
  const avgPerSession =
    sessions.length > 0 ? Math.round(totalStudents / sessions.length) : 0;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#1A1A1A]">Statistiques école</h1>
        <p className="text-gray-400 text-sm mt-1">Vue d&apos;ensemble de votre établissement</p>
      </div>

      <StatsRow sessions={sessions} />

      {/* Stats complémentaires */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Élèves par session (moyenne)
          </p>
          <p className="text-4xl font-black text-[#1B6B8A]">{avgPerSession}</p>
          <p className="text-sm text-gray-400 mt-1">élèves en moyenne</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Réponses par élève (moyenne)
          </p>
          <p className="text-4xl font-black text-[#2A8970]">
            {totalStudents > 0 ? Math.round(totalResponses / totalStudents) : 0}
          </p>
          <p className="text-sm text-gray-400 mt-1">questions répondues par élève</p>
        </div>
      </div>
    </div>
  );
}
