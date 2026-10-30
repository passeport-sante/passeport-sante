"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FolderOpen, ImageIcon, Video } from "lucide-react";
import { fetchDocumentThemes, type DocumentTheme } from "@/lib/documents";

export default function DocumentsPage() {
  const [themes, setThemes] = useState<DocumentTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDocumentThemes()
      .then(setThemes)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="brand-container py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-[#1A1A1A]">Documents</h1>
        <p className="text-gray-400 text-sm">Les affiches et vidéos de chaque thème</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => {
            const images = theme.documents.filter((d) => d.type === "image").length;
            const videos = theme.documents.length - images;
            return (
              <Link
                key={theme.id}
                href={`/dashboard/documents/${theme.slug}`}
                className="flex items-start gap-3 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
                  style={{ background: theme.colorPrimary ?? "#1B6B8A" }}
                >
                  <FolderOpen size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-[#1A1A1A] text-sm leading-tight">{theme.title}</p>
                  {theme.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{theme.category.name}</p>
                  )}
                  <p className="flex items-center gap-3 text-xs font-semibold text-gray-500 mt-2">
                    <span className="flex items-center gap-1"><ImageIcon size={13} /> {images}</span>
                    <span className="flex items-center gap-1"><Video size={13} /> {videos}</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
