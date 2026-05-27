"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { AdminModule } from "@/lib/modules-admin";

interface Props {
  module: AdminModule | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteModuleModal({ module, onCancel, onConfirm }: Props) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmText("");
    setError(null);
  }, [module]);

  if (!module) return null;

  const sessionCount = module._count.moduleSessions;
  const canConfirm = confirmText.trim() === module.slug;

  async function handleConfirm() {
    if (!canConfirm) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#1A1A1A]">Supprimer ce module ?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cette action est irréversible. Le module <span className="font-semibold text-[#1A1A1A]">{module.title}</span> sera définitivement supprimé.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {sessionCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">{sessionCount} session{sessionCount > 1 ? "s" : ""} référence{sessionCount > 1 ? "nt" : ""} ce module.</p>
            <p className="text-xs mt-0.5">La suppression échouera tant que ces sessions existent. Désactivez le module à la place.</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-600">
            Pour confirmer, tapez <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-red-600">{module.slug}</span>
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={module.slug}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent"
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
