"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

interface Props {
  name: string;
  // Enregistre le nouveau nom ; rejette en cas d'échec (le champ reste ouvert).
  onRename: (name: string) => Promise<void>;
  className?: string;
}

// Nom de session suivi d'une petite icône crayon : clic → champ éditable.
// Entrée enregistre, Échap annule. Fonctionne aussi pour une session clôturée.
export function SessionName({ name, onRename, className = "" }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  function start() {
    setValue(name);
    setError(false);
    setEditing(true);
  }

  async function save() {
    const next = value.trim();
    if (!next || next === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(false);
    try {
      await onRename(next);
      setEditing(false);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <span className={`group inline-flex items-center gap-1.5 max-w-full ${className}`}>
        <span className="truncate">{name}</span>
        <button
          type="button"
          onClick={start}
          className="shrink-0 p-1 rounded-md text-gray-300 hover:text-[#1B6B8A] hover:bg-[#EBF4F8] transition-colors"
          title="Renommer la session"
          aria-label={`Renommer la session ${name}`}
        >
          <Pencil size={13} />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void save();
          if (e.key === "Escape") setEditing(false);
        }}
        disabled={saving}
        maxLength={60}
        aria-label="Nouveau nom de la session"
        className={`w-36 px-2 py-0.5 rounded-lg border text-sm font-semibold text-[#1A1A1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#2A8970] ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="p-1 rounded-md text-[#2A8970] hover:bg-[#EBF6F3] transition-colors disabled:opacity-50"
        title="Enregistrer"
        aria-label="Enregistrer le nom"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        disabled={saving}
        className="p-1 rounded-md text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-50"
        title="Annuler"
        aria-label="Annuler le renommage"
      >
        <X size={14} />
      </button>
    </span>
  );
}
