import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { SessionSummary, ModuleSessionSummary } from "@/lib/dashboard";

interface Props {
  sessions: SessionSummary[];
  moduleSessions?: ModuleSessionSummary[];
}

export function SessionsTable({ sessions, moduleSessions = [] }: Props) {
  const totalCount = sessions.length + moduleSessions.length;

  if (totalCount === 0) {
    return (
      <p className="text-center text-gray-400 py-10 text-sm">Aucune session terminée pour le moment.</p>
    );
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
          {sessions.map((s, i) => {
            const isLast = i === sessions.length - 1 && moduleSessions.length === 0;
            return (
              <tr
                key={s.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isLast ? "border-b-0" : ""}`}
              >
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
                  {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-gray-700 font-semibold">{s._count.guestStudents}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/sessions/${s.id}`}
                    className="inline-flex items-center gap-1.5 text-[#1B6B8A] hover:text-[#2A8970] font-semibold transition-colors"
                  >
                    Résultats <ExternalLink size={13} />
                  </Link>
                </td>
              </tr>
            );
          })}

          {moduleSessions.map((s, i) => {
            const color = s.module?.colorPrimary ?? "#6B7280";
            const isLast = i === moduleSessions.length - 1;
            return (
              <tr
                key={s.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isLast ? "border-b-0" : ""}`}
              >
                <td className="px-6 py-4">
                  <p className="font-semibold text-[#1A1A1A]">{s.className}</p>
                  {s.module ? (
                    <p className="text-xs font-medium mt-0.5" style={{ color }}>{s.module.title}</p>
                  ) : (
                    <p className="text-xs font-medium mt-0.5 text-gray-400 italic">Module supprimé</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className="px-2 py-0.5 text-xs font-semibold rounded-full"
                    style={{ background: `${color}18`, color }}
                  >
                    Module
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-mono text-xs font-bold tracking-wider" style={{ color }}>{s.accessCode}</span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </td>
                <td className="px-6 py-4 text-gray-700 font-semibold">{s._count.guestStudents}</td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/dashboard/module-sessions/${s.id}`}
                    className="inline-flex items-center gap-1.5 font-semibold transition-colors hover:opacity-70"
                    style={{ color }}
                  >
                    Résultats <ExternalLink size={13} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
