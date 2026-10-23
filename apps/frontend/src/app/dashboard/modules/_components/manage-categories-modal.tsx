"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, Loader2, Check, Pencil } from "lucide-react";
import {
  fetchAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type AdminCategory,
} from "@/lib/modules-admin";

const PRESET_COLORS = [
  "#1B6B8A", "#2A8970", "#7C3AED", "#D97706",
  "#DB2777", "#0891B2", "#E11D48", "#16A34A",
];

interface Props {
  open: boolean;
  onClose: () => void;
  // Appelé après toute modification pour que la liste de modules se rafraîchisse.
  onChanged: () => void;
}

export function ManageCategoriesModal({ open, onClose, onChanged }: Props) {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]!);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setCategories(await fetchAdminCategories());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [categories],
  );

  async function handleCreate() {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      await createCategory({ name, color: newColor });
      setNewName("");
      await refresh();
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(cat: AdminCategory) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color ?? PRESET_COLORS[0]!);
  }

  async function saveEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    setBusyId(id);
    try {
      await updateCategory(id, { name, color: editColor });
      setEditingId(null);
      await refresh();
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(cat: AdminCategory) {
    const warn =
      cat._count.modules > 0
        ? `« ${cat.name} » contient ${cat._count.modules} module(s). Ils ne seront pas supprimés mais passeront en « sans catégorie ». Continuer ?`
        : `Supprimer la catégorie « ${cat.name} » ?`;
    if (!confirm(warn)) return;
    setBusyId(cat.id);
    try {
      await deleteCategory(cat.id);
      await refresh();
      onChanged();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A1A]">Gérer les catégories</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ajoutez, renommez ou supprimez les rubriques de rangement des modules.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={22} />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune catégorie pour l&apos;instant.</p>
          ) : (
            sorted.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                {editingId === cat.id ? (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
                      autoFocus
                    />
                    <ColorRow value={editColor} onChange={setEditColor} />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-xs font-semibold text-gray-500 rounded-lg hover:bg-gray-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveEdit(cat.id)}
                        disabled={busyId === cat.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-50"
                        style={{ background: "#1B6B8A" }}
                      >
                        {busyId === cat.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color ?? "#9CA3AF" }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{cat.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {cat._count.modules} module{cat._count.modules > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200"
                      aria-label="Renommer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      disabled={busyId === cat.id}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Supprimer"
                    >
                      {busyId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Ajout */}
        <div className="p-5 border-t border-gray-100 space-y-3 bg-gray-50/60 rounded-b-2xl">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Nouvelle catégorie</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nom de la catégorie"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={15} />}
              Ajouter
            </button>
          </div>
          <ColorRow value={newColor} onChange={setNewColor} />
        </div>
      </div>
    </div>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full transition-transform ${value.toLowerCase() === c.toLowerCase() ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"}`}
          style={{ background: c }}
          aria-label={`Couleur ${c}`}
        />
      ))}
      <label className="w-6 h-6 rounded-full border border-gray-300 overflow-hidden cursor-pointer relative" title="Couleur personnalisée">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-[150%] h-[150%] -top-1 -left-1 cursor-pointer"
        />
      </label>
    </div>
  );
}
