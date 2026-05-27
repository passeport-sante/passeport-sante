"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Power,
  Trash2,
} from "lucide-react";
import type { AdminModule } from "@/lib/modules-admin";

interface Props {
  module: AdminModule;
  onDuplicate: (id: string) => void;
  onToggleActive: (m: AdminModule) => void;
  onDelete: (m: AdminModule) => void;
}

export function AdminModuleCard({ module, onDuplicate, onToggleActive, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const color = module.colorPrimary ?? "#1A1A1A";

  return (
    <Link
      href={`/dashboard/modules/${module.id}/edit`}
      className={`group relative flex flex-col gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] transition-all overflow-hidden ${
        module.isActive ? "" : "opacity-60"
      }`}
    >
      {/* Accent latéral à la couleur du module */}
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: color }} />

      {/* Header — mascotte + titre + menu */}
      <div className="flex items-start gap-3">
        {module.mascotte ? (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: `${color}10` }}
          >
            <Image
              src={`/assets/mascotte/${module.mascotte}`}
              alt=""
              width={34}
              height={34}
              className="object-contain"
            />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-lg shrink-0"
            style={{ background: `${color}12` }}
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#1A1A1A] text-[15px] truncate">
            {module.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {module.category?.name ?? "Sans catégorie"}
            {module.duration && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                {module.duration} min
              </>
            )}
          </p>
        </div>

        {/* Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700 -mt-0.5 -mr-1"
            aria-label="Plus d'actions"
          >
            <MoreHorizontal size={16} />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-1 z-10 bg-white rounded-lg shadow-md border border-gray-200 py-1 min-w-[170px]"
              onClick={(e) => e.preventDefault()}
            >
              <MenuItem
                icon={<Pencil size={13} />}
                label="Modifier"
                onClick={() => setMenuOpen(false)}
                as={Link}
                href={`/dashboard/modules/${module.id}/edit`}
              />
              <MenuItem
                icon={<Copy size={13} />}
                label="Dupliquer"
                onClick={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  onDuplicate(module.id);
                  setMenuOpen(false);
                }}
              />
              <MenuItem
                icon={<Power size={13} />}
                label={module.isActive ? "Désactiver" : "Activer"}
                onClick={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  onToggleActive(module);
                  setMenuOpen(false);
                }}
              />
              <div className="h-px bg-gray-100 my-1" />
              <MenuItem
                icon={<Trash2 size={13} />}
                label="Supprimer"
                danger
                onClick={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  onDelete(module);
                  setMenuOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {module.description && (
        <p className="text-[13px] text-gray-600 leading-relaxed line-clamp-2">
          {module.description}
        </p>
      )}

      {/* Footer — métadonnées + statut */}
      <div className="flex items-center justify-between gap-3 text-[11px] text-gray-500 pt-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-2">
          <span>
            <span className="font-semibold text-[#1A1A1A]">{module._count.steps}</span> étapes
          </span>
          <span className="text-gray-300">·</span>
          <span>
            <span className="font-semibold text-[#1A1A1A]">{module._count.moduleSessions}</span> sessions
          </span>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
          {module.isActive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700">Actif</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="text-gray-400">Inactif</span>
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  as,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: (e?: React.MouseEvent) => void;
  danger?: boolean;
  as?: typeof Link;
  href?: string;
}) {
  const className = `w-full flex items-center gap-2 px-3 py-1.5 text-[13px] transition-colors text-left ${
    danger
      ? "text-red-600 hover:bg-red-50"
      : "text-gray-700 hover:bg-gray-50"
  }`;
  if (as && href) {
    return (
      <Link href={href} className={className} onClick={onClick as React.MouseEventHandler}>
        <span className={danger ? "text-red-500" : "text-gray-400"}>{icon}</span>
        {label}
      </Link>
    );
  }
  return (
    <button className={className} onClick={(e) => onClick?.(e)}>
      <span className={danger ? "text-red-500" : "text-gray-400"}>{icon}</span>
      {label}
    </button>
  );
}
