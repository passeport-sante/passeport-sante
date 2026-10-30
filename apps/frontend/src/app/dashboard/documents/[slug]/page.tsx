"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { fetchDocumentThemes, type DocumentTheme } from "@/lib/documents";

export default function DocumentThemePage() {
  const { slug } = useParams<{ slug: string }>();
  const [theme, setTheme] = useState<DocumentTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDocumentThemes()
      .then((themes) => setTheme(themes.find((t) => t.slug === slug) ?? null))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const images = theme?.documents.filter((d) => d.type === "image") ?? [];
  const videos = theme?.documents.filter((d) => d.type === "video") ?? [];

  return (
    <div className="brand-container py-6 sm:py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/documents"
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">{theme?.title ?? "Documents"}</h1>
          {theme?.category && <p className="text-gray-400 text-sm">{theme.category.name}</p>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : !theme ? (
        <p className="text-sm text-gray-400">Ce thème n&apos;existe pas.</p>
      ) : theme.documents.length === 0 ? (
        <p className="text-sm text-gray-400">Aucun document pour ce thème.</p>
      ) : (
        <div className="space-y-8">
          {images.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#1A1A1A] mb-3">Affiches</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-all"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={doc.url} alt={doc.title} loading="lazy" className="w-full aspect-[3/4] object-contain bg-gray-100" />
                    <p className="px-3 py-2.5 text-xs font-semibold text-[#1A1A1A] leading-snug">
                      {doc.title || "Affiche"}
                    </p>
                  </a>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#1A1A1A] mb-3">Vidéos</h2>
              <div className="space-y-2">
                {videos.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#EBF4F8] flex items-center justify-center shrink-0">
                      <Play size={16} className="text-[#1B6B8A]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{doc.title || "Vidéo"}</p>
                      <p className="text-xs text-gray-400 truncate">{doc.url}</p>
                    </div>
                    <ExternalLink size={15} className="text-gray-400 shrink-0" />
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
