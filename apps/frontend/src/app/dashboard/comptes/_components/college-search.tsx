"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchColleges } from "@/lib/school-directory";
import type { DirectoryCollege } from "@/lib/school-directory";

interface Props {
  onSelect: (college: DirectoryCollege) => void;
  // Appelé quand l'annuaire ne répond pas, pour basculer sur la saisie manuelle.
  onUnavailable?: () => void;
  autoFocus?: boolean;
}

// Champ de recherche dans l'annuaire de l'Éducation nationale.
export function CollegeSearch({ onSelect, onUnavailable, autoFocus }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryCollege[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const onUnavailableRef = useRef(onUnavailable);
  onUnavailableRef.current = onUnavailable;

  // Recherche 300 ms après la dernière frappe ; une frappe plus récente annule la précédente.
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setError("");
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      searchColleges(query, controller.signal)
        .then((r) => { setResults(r); setError(""); })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          setResults([]);
          setError("L'annuaire ne répond pas. Vous pouvez saisir l'établissement à la main.");
          onUnavailableRef.current?.();
        })
        .finally(() => { if (!controller.signal.aborted) setSearching(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const tooShort = query.trim().length < 3;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search" value={query} autoFocus={autoFocus}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom du collège, ville ou numéro UAI…"
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
        />
        {searching && <Loader2 size={15} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#1B6B8A]" />}
      </div>

      {error && <p className="text-xs text-amber-600">{error}</p>}

      {!tooShort && !searching && !error && results.length === 0 && (
        <p className="text-xs text-gray-400">Aucun collège trouvé. Essayez avec la ville, ou saisissez-le à la main.</p>
      )}

      {results.length > 0 && (
        <ul className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-50">
          {results.map((c) => (
            <li key={c.uai}>
              <button
                type="button"
                onClick={() => { onSelect(c); setQuery(""); setResults([]); }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#EBF4F8] transition-colors"
              >
                <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.city} ({c.postalCode}) · {c.status ?? "—"} · UAI {c.uai}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
