"use client";

import Link from "next/link";
import { Users, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { SessionSummary } from "@/lib/dashboard";
import { TOTAL_DIAGNOSTIC_QUESTIONS } from "@/lib/dashboard";

interface Props {
  session: SessionSummary;
  onClose: (id: string) => void;
  totalQuestions?: number;
}

export function SessionCard({ session, onClose, totalQuestions }: Props) {
  const [copied, setCopied] = useState(false);

  const students = session._count.guestStudents;
  const responses = session._count.diagnosticResponses;
  const questionsPerStudent = totalQuestions && totalQuestions > 0 ? totalQuestions : TOTAL_DIAGNOSTIC_QUESTIONS;
  const progress =
    students > 0 ? Math.min(100, Math.round((responses / (students * questionsPerStudent)) * 100)) : 0;

  function copyCode() {
    navigator.clipboard.writeText(session.accessCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[#1A1A1A] text-lg truncate">{session.className}</h3>
          <p className="text-gray-400 text-xs mt-0.5">
            {new Date(session.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      </div>

      {/* Code */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
        <span className="text-gray-400 text-xs">Code :</span>
        <span className="font-mono font-bold text-[#1B6B8A] tracking-widest text-sm flex-1">
          {session.accessCode}
        </span>
        <button onClick={copyCode} className="text-gray-400 hover:text-[#1B6B8A] transition-colors">
          {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Users size={15} />
          <span className="font-semibold text-[#1A1A1A]">{students}</span>
          <span>élève{students > 1 ? "s" : ""}</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="text-gray-500">
          <span className="font-semibold text-[#1A1A1A]">{responses}</span> réponses
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span title={`${responses} réponses sur ${students * questionsPerStudent} attendues (${students} élève(s) × ${questionsPerStudent} questions)`}>
            Complétion moyenne
          </span>
          <span className="font-semibold text-[#2A8970]">{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #1B6B8A, #2A8970)",
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/dashboard/sessions/${session.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#1B6B8A] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <ExternalLink size={14} />
          Voir les résultats
        </Link>
        <button
          onClick={() => onClose(session.id)}
          className="px-4 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Clôturer
        </button>
      </div>
    </div>
  );
}
