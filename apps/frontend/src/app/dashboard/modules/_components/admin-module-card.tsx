"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MoreVertical,
  Pencil,
  Copy,
  Power,
  Trash2,
  Layers,
  Users,
  Clock,
  Download,
  Loader2,
  Play,
} from "lucide-react";
import type { AdminModule } from "@/lib/modules-admin";
import { mascotteUrl } from "@/lib/mascotte";
import { downloadModuleExport } from "@/lib/module-export";

interface Props {
  module: AdminModule;
  // false pour un collaborateur : lecture seule, il peut uniquement tester.
  canManage?: boolean;
  onDuplicate: (id: string) => void;
  onToggleActive: (m: AdminModule) => void;
  onDelete: (m: AdminModule) => void;
}

export function AdminModuleCard({ module, canManage = true, onDuplicate, onToggleActive, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleExport() {
    setExporting(true);
    try {
      await downloadModuleExport(module.id, module.slug);
      setMenuOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'export");
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const color = module.colorPrimary ?? "#1B6B8A";
  const mascotteSrc = mascotteUrl(module.mascotte, "thumb");

  return (
    <div className="group relative bg-white rounded-xl border border-gray-200 flex flex-col hover:border-gray-300 transition-colors">
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header : icône, titre, statut, menu */}
        <div className="flex items-start gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: module.colorCard ?? `${color}15` }}
          >
            {mascotteSrc ? (
              <Image
                src={mascotteSrc}
                alt={module.title}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <Layers size={18} style={{ color }} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-[#1A1A1A] text-base truncate">{module.title}</h3>
            </div>
            {module.category && (
              <p className="text-xs font-medium mt-0.5" style={{ color: module.category.color ?? "#9CA3AF" }}>
                {module.category.name}
              </p>
            )}
          </div>

          {/* Statut + Menu */}
          <div className="flex items-center gap-1.5 shrink-0">
            {module.isActive ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Actif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                Inactif
              </span>
            )}

            {canManage && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
                aria-label="Plus d'actions"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[180px]">
                  <Link
                    href={`/dashboard/modules/${module.id}/edit`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Pencil size={14} className="text-gray-400" />
                    Modifier
                  </Link>
                  <button
                    onClick={() => { onDuplicate(module.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Copy size={14} className="text-gray-400" />
                    Dupliquer
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
                  >
                    {exporting ? (
                      <Loader2 size={14} className="text-gray-400 animate-spin" />
                    ) : (
                      <Download size={14} className="text-gray-400" />
                    )}
                    Exporter le contenu
                  </button>
                  <button
                    onClick={() => { onToggleActive(module); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Power size={14} className="text-gray-400" />
                    {module.isActive ? "Désactiver" : "Activer"}
                  </button>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={() => { onDelete(module); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>

        {/* Description */}
        {module.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            {module.description}
          </p>
        )}

        {/* Métadonnées */}
        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1 border-t border-gray-50">
          <span className="flex items-center gap-1">
            <Layers size={12} />
            <span className="font-semibold text-[#1A1A1A]">{module._count.steps}</span>
            étapes
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            <span className="font-semibold text-[#1A1A1A]">{module._count.moduleSessions}</span>
            sessions
          </span>
          {module.duration && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {module.duration} min
              </span>
            </>
          )}
        </div>

        {/* CTA : Modifier (admin) ou Tester (collaborateur) */}
        {canManage ? (
          <Link
            href={`/dashboard/modules/${module.id}/edit`}
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: color }}
          >
            <Pencil size={13} />
            Modifier
          </Link>
        ) : (
          <Link
            href={`/modules/${module.slug}`}
            target="_blank"
            className="mt-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: color }}
          >
            <Play size={13} />
            Tester
          </Link>
        )}
      </div>
    </div>
  );
}
