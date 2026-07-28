"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Layers, FolderCog } from "lucide-react";
import {
  fetchAdminModules,
  duplicateModule,
  updateModule,
  deleteModule,
  fetchCategories,
  type AdminModule,
  type CategoryLite,
} from "@/lib/modules-admin";
import { AdminModuleCard } from "./_components/admin-module-card";
import { DeleteModuleModal } from "./_components/delete-module-modal";
import { ManageCategoriesModal } from "./_components/manage-categories-modal";

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "recent" | "alpha" | "steps";

export default function AdminModulesPage() {
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const [toDelete, setToDelete] = useState<AdminModule | null>(null);
  const [manageCategories, setManageCategories] = useState(false);

  async function refresh() {
    try {
      const [mods, cats] = await Promise.all([fetchAdminModules(), fetchCategories()]);
      setModules(mods);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDuplicate(id: string) {
    try {
      await duplicateModule(id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de duplication");
    }
  }

  async function handleToggleActive(m: AdminModule) {
    setModules((prev) =>
      prev.map((x) => (x.id === m.id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      await updateModule(m.id, { isActive: !m.isActive });
    } catch (err) {
      // revert
      setModules((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, isActive: m.isActive } : x)),
      );
      alert(err instanceof Error ? err.message : "Impossible de modifier le statut");
    }
  }

  async function handleConfirmDelete() {
    if (!toDelete) return;
    await deleteModule(toDelete.id);
    setToDelete(null);
    await refresh();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = modules.filter((m) => {
      if (categoryId !== "all" && m.category?.id !== categoryId) return false;
      if (status === "active" && !m.isActive) return false;
      if (status === "inactive" && m.isActive) return false;
      if (q) {
        const hay = `${m.title} ${m.description ?? ""} ${m.slug}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === "alpha") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === "steps") {
      list = [...list].sort((a, b) => b._count.steps - a._count.steps);
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }
    return list;
  }, [modules, query, categoryId, status, sort]);

  const counts = useMemo(
    () => ({
      total: modules.length,
      active: modules.filter((m) => m.isActive).length,
      inactive: modules.filter((m) => !m.isActive).length,
    }),
    [modules],
  );

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Modules</h1>
          <p className="text-gray-400 text-sm mt-1">
            Créez et personnalisez les contenus pédagogiques
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setManageCategories(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FolderCog size={16} />
            Catégories
          </button>
          <Link
            href="/dashboard/modules/new"
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
          >
            <Plus size={17} />
            Nouveau module
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 rounded-xl border border-gray-200 bg-white divide-x divide-gray-100 text-center sm:text-left">
        <StatTile label="Modules" value={counts.total} icon={<Layers size={16} />} />
        <StatTile label="Actifs" value={counts.active} accent="emerald" />
        <StatTile label="Inactifs" value={counts.inactive} accent="gray" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap items-center gap-2 sticky top-[72px] z-30">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un module..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-transparent"
          />
        </div>

        {/* Category chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <FilterChip
            active={categoryId === "all"}
            onClick={() => setCategoryId("all")}
            label="Toutes catégories"
          />
          {categories.map((c) => (
            <FilterChip
              key={c.id}
              active={categoryId === c.id}
              onClick={() => setCategoryId(c.id)}
              label={c.name}
              dotColor={c.color ?? undefined}
            />
          ))}
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="text-sm bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
        >
          <option value="all">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-sm bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
        >
          <option value="recent">Récents</option>
          <option value="alpha">A → Z</option>
          <option value="steps">Plus d&apos;étapes</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onReset={() => { setQuery(""); setCategoryId("all"); setStatus("all"); }} hasFilters={!!query || categoryId !== "all" || status !== "all"} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <AdminModuleCard
              key={m.id}
              module={m}
              onDuplicate={handleDuplicate}
              onToggleActive={handleToggleActive}
              onDelete={(mod) => setToDelete(mod)}
            />
          ))}
        </div>
      )}

      <DeleteModuleModal
        module={toDelete}
        onCancel={() => setToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <ManageCategoriesModal
        open={manageCategories}
        onClose={() => setManageCategories(false)}
        onChanged={refresh}
      />
    </div>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "gray";
  icon?: React.ReactNode;
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-600"
      : accent === "gray"
      ? "text-gray-500"
      : "text-[#1B6B8A]";
  return (
    <div className="p-4 flex items-center gap-3">
      {icon && <div className={`${color}`}>{icon}</div>}
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dotColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dotColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active
          ? "bg-[#1B6B8A] text-white shadow-sm"
          : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
      }`}
    >
      {dotColor && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dotColor }}
        />
      )}
      {label}
    </button>
  );
}

function EmptyState({ onReset, hasFilters }: { onReset: () => void; hasFilters: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#EBF4F8] flex items-center justify-center mx-auto mb-4">
        <Layers size={20} className="text-[#1B6B8A]" />
      </div>
      <p className="text-base font-semibold text-[#1A1A1A]">
        {hasFilters ? "Aucun module ne correspond" : "Aucun module pour le moment"}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {hasFilters
          ? "Essayez d'ajuster vos filtres ou votre recherche."
          : "Créez votre premier module pour commencer."}
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        {hasFilters && (
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200"
          >
            Réinitialiser
          </button>
        )}
        <Link
          href="/dashboard/modules/new"
          className="inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl"
          style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
        >
          <Plus size={15} />
          Nouveau module
        </Link>
      </div>
    </div>
  );
}
