"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

/**
 * Carte vidéo pour les plateformes qui refusent l'intégration.
 *
 * Lumni, par exemple, renvoie `frame-ancestors https://www.lumni.fr` : son
 * lecteur ne peut pas s'afficher chez nous, l'élève ne verrait qu'un cadre
 * vide. On présente donc la vidéo comme une carte — vignette, titre, durée —
 * qui s'ouvre dans un nouvel onglet.
 *
 * La vignette passe par notre serveur (/api/link-preview/image) : chargée
 * directement, elle transmettrait l'adresse IP de l'élève au site tiers, ce que
 * le lecteur intégré évite déjà soigneusement.
 */

type Apercu = {
  titre: string | null;
  image: string | null;
  site: string | null;
  dureeSecondes: number | null;
};

function formaterDuree(secondes: number | null): string | null {
  if (!secondes) return null;
  const min = Math.floor(secondes / 60);
  const s = secondes % 60;
  if (min === 0) return `${s} s`;
  return s === 0 ? `${min} min` : `${min} min ${String(s).padStart(2, "0")}`;
}

export function VideoLinkCard({
  url,
  title,
  accent = "#1B6B8A",
}: {
  url: string;
  title?: string;
  accent?: string;
}) {
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let annule = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!annule) {
          setApercu(data);
          setChargement(false);
        }
      })
      .catch(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [url]);

  // Le titre saisi dans l'admin prime : c'est celui que l'enseignant a choisi.
  const titre = title || apercu?.titre || "Voir la vidéo";
  const duree = formaterDuree(apercu?.dureeSecondes ?? null);
  const site = apercu?.site ?? new URL(url).hostname.replace(/^www\./, "");
  const vignette = apercu?.image
    ? `/api/link-preview/image?url=${encodeURIComponent(apercu.image)}`
    : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full overflow-hidden rounded-2xl bg-gray-900 shadow-lg transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
      aria-label={`Ouvrir la vidéo « ${titre} » sur ${site}, dans un nouvel onglet`}
    >
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
        {/* Fond dégradé : visible pendant le chargement, et si le site ne
            fournit aucune vignette. */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(150deg, ${accent} 0%, #0f172a 100%)` }}
        />
        {vignette && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={vignette}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-70"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
            <Play size={26} className="ml-1" style={{ color: accent }} fill={accent} />
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-5 text-white">
          <p className="font-black text-base md:text-lg leading-tight line-clamp-2">{titre}</p>
          <p className="mt-1.5 flex items-center gap-2 text-[12px] text-white/80">
            <ExternalLink size={13} />
            <span>
              {chargement ? "Chargement…" : `Sur ${site}`}
              {duree && ` · ${duree}`}
            </span>
          </p>
        </div>
      </div>

      <p className="px-4 py-2.5 text-[11px] text-white/60 bg-black/40">
        Cette vidéo s&apos;ouvre dans un nouvel onglet : {site}{" "}
        n&apos;autorise pas la lecture depuis un autre site.
      </p>
    </a>
  );
}
