"use client";

import { useEffect, useState } from "react";
import { History, RotateCcw, Loader2, User } from "lucide-react";
import {
  fetchModuleVersions,
  restoreModuleVersion,
  type ModuleVersionListItem,
} from "@/lib/modules-admin";

interface Props {
  moduleId: string;
  onRestored: () => Promise<void> | void;
}

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function VersionHistoryTab({ moduleId, onRestored }: Props) {
  const [items, setItems] = useState<ModuleVersionListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchModuleVersions(moduleId);
      setItems(res.items);
      setNextCursor(res.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await fetchModuleVersions(moduleId, nextCursor);
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleRestore(versionId: string) {
    setRestoringId(versionId);
    setConfirmId(null);
    try {
      await restoreModuleVersion(moduleId, versionId);
      await onRestored();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la restauration");
    } finally {
      setRestoringId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center text-sm text-gray-400">
        <History size={28} className="mx-auto mb-3 text-gray-300" />
        Aucune version antérieure enregistrée pour ce module.
        <br />
        Un historique se constitue automatiquement à chaque modification.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <ul className="space-y-2">
        {items.map((v) => (
          <li
            key={v.id}
            className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A1A1A]">{DATE_FORMAT.format(new Date(v.createdAt))}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <User size={11} />
                {v.createdByUser?.name ?? "Système"}
              </p>
            </div>

            {confirmId === v.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-700 max-w-[220px]">
                  Les modifications faites depuis et les réponses des élèves liées aux étapes
                  actuelles seront perdues.
                </span>
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoringId === v.id}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-60"
                >
                  {restoringId === v.id ? "Restauration…" : "Confirmer"}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(v.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <RotateCcw size={12} />
                Restaurer
              </button>
            )}
          </li>
        ))}
      </ul>

      {nextCursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full py-2.5 text-sm font-semibold text-gray-500 rounded-xl border border-dashed border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-60"
        >
          {loadingMore ? "Chargement…" : "Charger plus"}
        </button>
      )}
    </div>
  );
}
