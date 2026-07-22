"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { mascotteUrl, MASCOTTE_MAX_UPLOAD_BYTES } from "@/lib/mascotte";
import {
  createMascotte,
  deleteMascotte,
  fetchMascottes,
  uploadMascotteFile,
  type Mascotte,
} from "@/lib/mascottes-admin";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export function MascottePicker({ value, onChange }: Props) {
  const [mascottes, setMascottes] = useState<Mascotte[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMascottes()
      .then(setMascottes)
      .catch((e) => setError(e instanceof Error ? e.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadMascotteFile(file);
      // Le label par défaut reprend le nom du fichier, sans extension : c'est
      // rarement parfait mais toujours plus parlant qu'un identifiant Cloudinary.
      const label = file.name.replace(/\.[^.]+$/, "");
      const created = await createMascotte(label, url);
      setMascottes((prev) => [...prev, created]);
      onChange(created.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function handleDelete(m: Mascotte) {
    if (
      !confirm(
        `Retirer « ${m.label} » du catalogue ?\n\nLes modules qui l'utilisent déjà continueront de l'afficher — elle disparaît seulement des choix proposés ici.`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await deleteMascotte(m.id);
      setMascottes((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de la suppression");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 size={14} className="animate-spin" />
        Chargement des mascottes…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {mascottes.map((m) => {
          const selected = value === m.url;
          const src = mascotteUrl(m.url, "thumb");
          return (
            <div key={m.id} className="relative group">
              <button
                type="button"
                onClick={() => onChange(m.url)}
                title={m.label}
                className={`w-full relative aspect-square rounded-xl border-2 p-2 transition-all ${
                  selected
                    ? "border-[#2A8970] bg-[#EBF6F3]"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200"
                }`}
              >
                {selected && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#2A8970] flex items-center justify-center">
                    <Check size={9} className="text-white" strokeWidth={3} />
                  </span>
                )}
                {src && (
                  <Image
                    src={src}
                    alt={m.label}
                    width={60}
                    height={60}
                    className="w-full h-full object-contain"
                  />
                )}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(m)}
                title="Retirer du catalogue"
                className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 size={10} className="text-red-500" />
              </button>
            </div>
          );
        })}

        {/* Tuile d'ajout */}
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-400 transition-all hover:border-[#2A8970] hover:text-[#2A8970] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Plus size={16} />
              <span className="text-[10px] font-medium">Ajouter</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      <p className="text-xs text-gray-400">
        PNG ou WebP à fond transparent, {MASCOTTE_MAX_UPLOAD_BYTES / 1024 / 1024} Mo maximum.
        L&apos;image est redimensionnée automatiquement à l&apos;affichage — inutile de la
        préparer.
      </p>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
