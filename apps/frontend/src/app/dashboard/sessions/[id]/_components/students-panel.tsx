"use client";

import { useState } from "react";
import { EyeOff, RotateCcw, Trash2 } from "lucide-react";
import { deleteStudent, setStudentExcluded } from "@/lib/dashboard";
import type { DiagnosticStudent } from "@/lib/dashboard";

interface Props {
  sessionId: string;
  students: DiagnosticStudent[];
  totalQuestions: number;
  onChanged: () => Promise<void>;
}

// Les élèves restent anonymes : on les numérote par ordre d'arrivée.
export function StudentsPanel({ sessionId, students, totalQuestions, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; label: string } | null>(null);
  const [error, setError] = useState("");

  const token = () => localStorage.getItem("access_token") ?? "";

  async function run(id: string, action: () => Promise<void>) {
    setBusyId(id);
    setError("");
    try {
      await action();
      await onChanged();
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue");
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirm) return;
    const { id } = confirm;
    await run(id, () => deleteStudent(sessionId, id, token()));
    setConfirm(null);
  }

  if (students.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10 text-sm">Aucun élève n&apos;a encore rejoint cette session.</p>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto">
      {error && (
        <p role="alert" className="px-6 py-3 text-sm font-semibold text-red-600 bg-red-50 border-b border-red-100">
          {error}
        </p>
      )}
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Élève</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Arrivée</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Réponses</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Statut</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {students.map((s, i) => {
            const label = `Élève ${i + 1}`;
            const excluded = s.excludedAt !== null;
            const busy = busyId === s.id;
            return (
              <tr
                key={s.id}
                className={`border-b border-gray-50 last:border-b-0 transition-colors ${
                  excluded ? "bg-gray-50 text-gray-400" : "hover:bg-gray-50"
                }`}
              >
                <td className={`px-6 py-4 font-semibold ${excluded ? "line-through" : "text-[#1A1A1A]"}`}>{label}</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(s.createdAt).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-6 py-4 font-semibold text-gray-700">
                  {s._count.diagnosticResponses}/{totalQuestions}
                </td>
                <td className="px-6 py-4">
                  {excluded ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-500">
                      Exclu des stats
                    </span>
                  ) : s.completedAt ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Terminé
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                      En cours
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => run(s.id, () => setStudentExcluded(sessionId, s.id, !excluded, token()))}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-[#1B6B8A] hover:bg-[#EBF4F8] transition-colors disabled:opacity-50"
                      title={excluded ? "Recompter cet élève dans les stats" : "Ne plus compter cet élève (test, doublon…)"}
                    >
                      {excluded ? <RotateCcw size={14} /> : <EyeOff size={14} />}
                      {excluded ? "Réintégrer" : "Exclure"}
                    </button>
                    <button
                      onClick={() => setConfirm({ id: s.id, label })}
                      disabled={busy}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {confirm && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Supprimer cet élève ?</h2>
            <p className="text-sm text-gray-500">
              <strong>{confirm.label}</strong> et toutes ses réponses seront définitivement supprimés. Pour
              simplement ne plus le compter, préférez « Exclure ».
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={busyId !== null}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={busyId !== null}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {busyId !== null ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
