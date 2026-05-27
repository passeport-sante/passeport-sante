"use client";

import Link from "next/link";
import { Users, Copy, Check, Stethoscope } from "lucide-react";
import { useState } from "react";
import type { SessionSummary } from "@/lib/dashboard";
import { TOTAL_DIAGNOSTIC_QUESTIONS } from "@/lib/dashboard";

interface Props {
  session: SessionSummary;
  onClose: (id: string) => void;
}

export function SessionCard({ session, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const students = session._count.guestStudents;
  const responses = session._count.diagnosticResponses;
  const progress =
    students > 0
      ? Math.min(100, Math.round((responses / (students * TOTAL_DIAGNOSTIC_QUESTIONS)) * 100))
      : 0;

  function copyCode(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(session.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Link
      href={`/dashboard/sessions/${session.id}`}
      className="group relative flex flex-col gap-3.5 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] transition-all overflow-hidden"
    >
      {/* Accent latéral diagnostic */}
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-600" />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Stethoscope size={15} className="text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] truncate">{session.className}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            <span className="font-medium text-blue-700">Diagnostic</span>
            <span className="mx-1.5 text-gray-300">·</span>
            {new Date(session.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 pt-1">
          <span className="relative flex items-center justify-center">
            <span className="absolute w-2 h-2 rounded-full bg-emerald-500/40 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          Active
        </span>
      </div>

      {/* Code */}
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
        <span className="text-[11px] text-gray-500">Code</span>
        <span className="font-mono font-semibold text-[#1A1A1A] tracking-wider text-[13px] flex-1">
          {session.accessCode}
        </span>
        <button
          onClick={copyCode}
          className="text-gray-400 hover:text-blue-600 transition-colors"
          aria-label="Copier le code"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Stats + Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            <span className="font-semibold text-[#1A1A1A]">{students}</span>
            élève{students > 1 ? "s" : ""}
            <span className="text-gray-300 mx-1">·</span>
            <span className="font-semibold text-[#1A1A1A]">{responses}</span> réponses
          </span>
          <span className="font-bold text-blue-600 text-[13px] tabular-nums">{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <span className="flex-1 inline-flex items-center justify-center h-8 text-[13px] font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-200 transition-colors">
          Voir les résultats
        </span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose(session.id);
          }}
          className="h-8 px-3 text-[13px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clôturer
        </button>
      </div>
    </Link>
  );
}
