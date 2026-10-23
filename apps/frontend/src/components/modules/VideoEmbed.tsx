"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * Lecteur vidéo « click-to-load » (conforme RGPD / CNIL).
 *
 * Tant que l'utilisateur n'a pas cliqué, AUCUNE requête n'est envoyée à YouTube
 * ou Vimeo : on n'affiche qu'une façade locale (dégradé + bouton lecture). Le
 * clic vaut consentement explicite et monte alors l'iframe. La miniature n'est
 * volontairement pas chargée depuis le tiers, ce qui transmettrait déjà l'IP.
 *
 * `url` est déjà en mode « no-cookie » / `dnt` (voir toEmbedUrl).
 */
export function VideoEmbed({
  url,
  title,
  accent = "#1B6B8A",
}: {
  url: string;
  title?: string;
  accent?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const provider = /youtube/.test(url) ? "YouTube" : /vimeo/.test(url) ? "Vimeo" : "un service tiers";

  // Une fois le consentement donné, on relance la lecture automatiquement
  // (autorisé car déclenché par le clic de l'utilisateur).
  const playUrl = url + (url.includes("?") ? "&" : "?") + "autoplay=1";

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900" style={{ aspectRatio: "16 / 9" }}>
      {loaded ? (
        <iframe
          src={playUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title ?? "Vidéo"}
        />
      ) : (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="group absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-3 text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          style={{ background: `linear-gradient(150deg, ${accent} 0%, #0f172a 100%)` }}
          aria-label={`Lire la vidéo${title ? ` : ${title}` : ""}`}
        >
          <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
            <Play size={26} className="ml-1" style={{ color: accent }} fill={accent} />
          </span>
          <span className="font-bold text-sm">Lire la vidéo</span>
          <span className="text-[11px] text-white/70 max-w-[80%] text-center leading-relaxed">
            En cliquant, le contenu sera chargé depuis {provider}, ce qui peut déposer des cookies.
          </span>
        </button>
      )}
    </div>
  );
}
