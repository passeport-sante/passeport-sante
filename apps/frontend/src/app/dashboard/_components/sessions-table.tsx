"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import type { SessionSummary, ModuleSessionSummary } from "@/lib/dashboard";

type DeleteType = "diagnostic" | "module";

interface Props {
  sessions: SessionSummary[];
  moduleSessions?: ModuleSessionSummary[];
  // Si fourni, affiche un bouton de suppression définitive par ligne.
  onDelete?: (id: string, type: DeleteType) => Promise<void>;
}

export function SessionsTable({ sessions, moduleSessions = [], onDelete }: Props) {
  const totalCount = sessions.length + moduleSessions.length;
  const [confirm, setConfirm] = useState<{ id: string; type: DeleteType; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (totalCount === 0) {
    return (
      <p className="text-center text-gray-400 py-10 text-sm">Aucune session terminée pour le moment.</p>
    );
  }

  async function handleConfirmDelete() {
    if (!confirm || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(confirm.id, confirm.type);
      setConfirm(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Classe</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Type</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Code</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Élèves</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0">
              <td className="px-6 py-4 font-semibold text-[#1A1A1A]">{s.className}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-0.5 bg-[#EBF4F8] text-[#1B6B8A] text-xs font-semibold rounded-full">
                  Diagnostic
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="font-mono text-[#1B6B8A] text-xs font-bold tracking-wider">{s.accessCode}</span>
              </td>
              <td className="px-6 py-4 text-gray-500">
                {new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td className="px-6 py-4 text-gray-700 font-semibold">{s._count.guestStudents}</td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/dashboard/sessions/${s.id}`}
                    className="inline-flex items-center gap-1.5 text-[#1B6B8A] hover:text-[#2A8970] font-semibold transition-colors"
                  >
                    Résultats <ExternalLink size={13} />
                  </Link>
                  {onDelete && (
                    <button
                      onClick={() => setConfirm({ id: s.id, type: "diagnostic", label: s.className })}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {moduleSessions.map((s) => {
            const color = s.module?.colorPrimary ?? "#6B7280";
            return (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-b-0">
                <td className="px-6 py-4">
                  <p className="font-semibold text-[#1A1A1A]">{s.className}</p>
                  {s.module ? (
                    <p className="text-xs font-medium mt-0.5" style={{ color }}>{s.module.title}</p>
                  ) : (
                    <p className="text-xs font-medium mt-0.5 text-gray-400 italic">Module supprimé</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full" style={{ background: `${color}18`, color }}>
                    Module
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold tracking-wider" style={{ color }}>{s.accessCode}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-6 py-4 text-gray-700 font-semibold">{s._count.guestStudents}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/dashboard/module-sessions/${s.id}`}
                      className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:opacity-70"
                      style={{ color }}
                    >
                      Résultats <ExternalLink size={13} />
                    </Link>
                    {onDelete && (
                      <button
                        onClick={() => setConfirm({ id: s.id, type: "module", label: s.className })}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
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
            <h2 className="text-lg font-black text-gray-900">Supprimer cette session ?</h2>
            <p className="text-sm text-gray-500">
              La session <strong>{confirm.label}</strong> et tous ses résultats seront définitivement
              supprimés. Cette action est irréversible.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirm(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
