"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Copy, Check, BookOpen, Link2 } from "lucide-react";
import type { ModuleSessionSummary } from "@/lib/dashboard";

interface Props {
  session: ModuleSessionSummary;
  onClose: (id: string) => void;
}

export function ModuleSessionCard({ session, onClose }: Props) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const students = session._count.guestStudents;
  const color = session.module.colorPrimary ?? "#1A1A1A";

  function copyCode(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(session.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function copyUrl(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(session.accessUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  return (
    <Link
      href={`/dashboard/module-sessions/${session.id}`}
      className="group relative flex flex-col gap-3.5 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] transition-all overflow-hidden"
    >
      {/* Accent latéral à la couleur du module */}
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}12`, color }}
        >
          <BookOpen size={15} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A] truncate">{session.className}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            <span className="font-medium" style={{ color }}>{session.module.title}</span>
            <span className="mx-1.5 text-gray-300">·</span>
            {new Date(session.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 pt-1 shrink-0">
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
        <span
          className="font-mono font-semibold tracking-wider text-[13px] flex-1"
          style={{ color }}
        >
          {session.accessCode}
        </span>
        <button
          onClick={copyCode}
          className="text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Copier le code"
        >
          {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
        <button
          onClick={copyUrl}
          className="text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Copier le lien"
        >
          {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Link2 size={14} />}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
        <Users size={12} />
        <span className="font-semibold text-[#1A1A1A]">{students}</span>
        élève{students > 1 ? "s" : ""}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <span
          className="flex-1 inline-flex items-center justify-center h-8 text-[13px] font-medium rounded-lg border transition-colors"
          style={{
            color,
            background: `${color}0d`,
            borderColor: `${color}26`,
          }}
        >
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
