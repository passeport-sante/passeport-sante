"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Layers } from "lucide-react";
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

type StatusFilter = "all" | "active" | "inactive";
type SortKey = "recent" | "alpha" | "steps";

const SELECT_CLASS =
  "h-9 text-[13px] bg-white border border-gray-200 rounded-lg px-3 pr-8 focus:outline-none focus:border-gray-400 text-gray-700 appearance-none cursor-pointer";

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

  const hasFilters = !!query || categoryId !== "all" || status !== "all";

  return (
    <div className="px-8 py-10 max-w-[1200px] mx-auto space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight">
            Modules
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {modules.length} module{modules.length > 1 ? "s" : ""}
            {modules.length > 0 && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                {modules.filter((m) => m.isActive).length} actif
                {modules.filter((m) => m.isActive).length > 1 ? "s" : ""}
              </>
            )}
          </p>
        </div>
        <Link
          href="/dashboard/modules/new"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Nouveau module
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-white border border-gray-200 text-[13px] focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
          />
        </div>

        <SelectChevron>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </SelectChevron>

        <SelectChevron>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className={SELECT_CLASS}
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </SelectChevron>

        <SelectChevron>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={SELECT_CLASS}
          >
            <option value="recent">Récents</option>
            <option value="alpha">A → Z</option>
            <option value="steps">Plus d&apos;étapes</option>
          </select>
        </SelectChevron>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-[#1A1A1A] rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="border border-red-200 rounded-lg p-4 text-sm text-red-700 bg-red-50">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          onReset={() => {
            setQuery("");
            setCategoryId("all");
            setStatus("all");
          }}
          hasFilters={hasFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
    </div>
  );
}

// ── Sous-composants ─────────────────────────────────────────────────────────

function SelectChevron({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        width="10"
        height="10"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function EmptyState({
  onReset,
  hasFilters,
}: {
  onReset: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-xl py-16 text-center bg-white">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <Layers size={18} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-[#1A1A1A]">
        {hasFilters ? "Aucun résultat" : "Aucun module"}
      </p>
      <p className="text-[13px] text-gray-500 mt-1">
        {hasFilters
          ? "Essayez d'ajuster votre recherche ou vos filtres."
          : "Créez votre premier module pour commencer."}
      </p>
      <div className="mt-5 inline-flex items-center gap-2">
        {hasFilters ? (
          <button
            onClick={onReset}
            className="h-8 px-3 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50"
          >
            Réinitialiser
          </button>
        ) : (
          <Link
            href="/dashboard/modules/new"
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-[#1A1A1A] text-white text-[13px] font-medium rounded-lg hover:bg-black"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nouveau module
          </Link>
        )}
      </div>
    </div>
  );
}
