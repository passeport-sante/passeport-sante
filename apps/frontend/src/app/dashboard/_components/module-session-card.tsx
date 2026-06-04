"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Copy, Check, BookOpen, Link2, ExternalLink } from "lucide-react";
import type { ModuleSessionSummary } from "@/lib/dashboard";

interface Props {
  session: ModuleSessionSummary;
  onClose: (id: string) => void;
}

export function ModuleSessionCard({ session, onClose }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const students = session._count.guestStudents;
  const color = session.module.colorPrimary ?? "#1D4ED8";

  function copyCode() {
    navigator.clipboard.writeText(session.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyUrl() {
    navigator.clipboard.writeText(session.accessUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${color}18` }}
          >
            <BookOpen size={16} style={{ color }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[#1A1A1A] text-base truncate">{session.className}</h3>
            <p className="text-xs font-medium truncate" style={{ color }}>
              {session.module.title}
            </p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      </div>

      {/* Code */}
      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2.5">
        <span className="text-gray-400 text-xs">Code :</span>
        <span className="font-mono font-bold tracking-widest text-sm flex-1" style={{ color }}>
          {session.accessCode}
        </span>
        <button onClick={copyCode} className="text-gray-400 hover:text-gray-600 transition-colors" title="Copier le code">
          {copiedCode ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
        </button>
        <button onClick={copyUrl} className="text-gray-400 hover:text-gray-600 transition-colors ml-1" title="Copier le lien élèves">
          {copiedUrl ? <Check size={15} className="text-emerald-500" /> : <Link2 size={15} />}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Users size={15} />
        <span className="font-semibold text-[#1A1A1A]">{students}</span>
        <span>élève{students > 1 ? "s" : ""}</span>
        <span className="text-gray-300 mx-1">·</span>
        <span className="text-xs text-gray-400">
          {new Date(session.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/dashboard/module-sessions/${session.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          style={{ background: color }}
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
