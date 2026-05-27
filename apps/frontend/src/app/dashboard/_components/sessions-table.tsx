import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { SessionSummary, ModuleSessionSummary } from "@/lib/dashboard";

interface Props {
  sessions: SessionSummary[];
  moduleSessions?: ModuleSessionSummary[];
}

export function SessionsTable({ sessions, moduleSessions = [] }: Props) {
  const totalCount = sessions.length + moduleSessions.length;

  if (totalCount === 0) {
    return (
      <p className="text-center text-gray-500 text-[13px] py-10">
        Aucune session terminée pour le moment.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/60 text-left">
            <th className="px-5 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Classe</th>
            <th className="px-5 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Type</th>
            <th className="px-5 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Code</th>
            <th className="px-5 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Date</th>
            <th className="px-5 py-2.5 font-medium text-gray-500 text-[11px] uppercase tracking-wider">Élèves</th>
            <th className="px-5 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => {
            const isLast = i === sessions.length - 1 && moduleSessions.length === 0;
            return (
              <tr
                key={s.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isLast ? "border-b-0" : ""}`}
              >
                <td className="px-5 py-3 font-medium text-[#1A1A1A]">{s.className}</td>
                <td className="px-5 py-3">
                  <span className="text-gray-600">Diagnostic</span>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-[12px] text-gray-700 tracking-wider">
                    {s.accessCode}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3 text-gray-700 tabular-nums">{s._count.guestStudents}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/dashboard/sessions/${s.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Résultats <ArrowRight size={12} />
                  </Link>
                </td>
              </tr>
            );
          })}

          {moduleSessions.map((s, i) => {
            const color = s.module.colorPrimary ?? "#1A1A1A";
            const isLast = i === moduleSessions.length - 1;
            return (
              <tr
                key={s.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isLast ? "border-b-0" : ""}`}
              >
                <td className="px-5 py-3">
                  <p className="font-medium text-[#1A1A1A]">{s.className}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    {s.module.title}
                  </p>
                </td>
                <td className="px-5 py-3">
                  <span className="text-gray-600">Module</span>
                </td>
                <td className="px-5 py-3">
                  <span className="font-mono text-[12px] text-gray-700 tracking-wider">
                    {s.accessCode}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500">
                  {new Date(s.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-5 py-3 text-gray-700 tabular-nums">{s._count.guestStudents}</td>
                <td className="px-5 py-3 text-right">
                  <Link
                    href={`/dashboard/module-sessions/${s.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Résultats <ArrowRight size={12} />
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
