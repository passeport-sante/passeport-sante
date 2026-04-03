import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { SessionSummary } from "@/lib/dashboard";

interface Props {
  sessions: SessionSummary[];
}

export function SessionsTable({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-center text-gray-400 py-10 text-sm">Aucune session terminée pour le moment.</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Classe</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Code</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Élèves</th>
            <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Réponses</th>
            <th className="px-6 py-4" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr
              key={s.id}
              className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${i === sessions.length - 1 ? "border-b-0" : ""}`}
            >
              <td className="px-6 py-4 font-semibold text-[#1A1A1A]">{s.className}</td>
              <td className="px-6 py-4">
                <span className="font-mono text-[#1B6B8A] text-xs font-bold tracking-wider">{s.accessCode}</span>
              </td>
              <td className="px-6 py-4 text-gray-500">
                {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="px-6 py-4 text-gray-700 font-semibold">{s._count.guestStudents}</td>
              <td className="px-6 py-4 text-gray-700">{s._count.diagnosticResponses}</td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/dashboard/sessions/${s.id}`}
                  className="inline-flex items-center gap-1.5 text-[#1B6B8A] hover:text-[#2A8970] font-semibold transition-colors"
                >
                  Résultats <ExternalLink size={13} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
