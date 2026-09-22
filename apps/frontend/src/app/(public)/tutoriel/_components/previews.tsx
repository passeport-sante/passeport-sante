"use client";

// Aperçus animés du tutoriel.
//
// Ce sont de vraies captures de la plateforme, prises écran par écran, que le
// composant enchaîne en fondu : l'aperçu ressemble donc exactement au site, et
// reste un simple diaporama d'images (aucune vidéo à héberger).
//
// Les captures vivent dans /public/assets/tutoriel. Pour les refaire après une
// refonte visuelle, rejouer le script de capture Playwright décrit dans le
// compte rendu : même parcours, une image par état.

import Image from "next/image";
import { useEffect, useState } from "react";

export type Frame = { src: string; legende: string };

// Un écran de l'application, dans un cadre de navigateur, dont les états
// s'enchaînent en boucle. `barre` est ce qu'affiche la barre d'adresse.
export function Diaporama({
  barre,
  frames,
  intervalMs = 2600,
}: {
  barre: string;
  frames: Frame[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (frames.length < 2) return;
    // Réglage système « réduire les animations » : on reste sur la première image.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % frames.length), intervalMs);
    return () => clearInterval(id);
  }, [frames.length, intervalMs]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden select-none">
      {/* Barre de fenêtre */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="ml-2 text-[11px] font-semibold text-gray-400 truncate">{barre}</span>
      </div>

      {/* Les images sont superposées : celle qui est active passe en opacité 1. */}
      <div className="relative aspect-[1280/760] bg-gray-100">
        {frames.map((f, i) => (
          <Image
            key={f.src}
            src={f.src}
            alt={f.legende}
            fill
            sizes="(max-width: 1024px) 100vw, 620px"
            priority={i === 0}
            className={`object-cover transition-opacity duration-700 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      {/* Légende de l'image courante + pastilles de progression */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-gray-100 bg-white">
        <p className="text-[11px] font-semibold text-gray-500 truncate">
          {frames[index]?.legende}
        </p>
        {frames.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            {frames.map((f, i) => (
              <button
                key={f.src}
                type="button"
                aria-label={f.legende}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-brand-green" : "w-1.5 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const D = "/assets/tutoriel";

export const APERCUS = {
  code: {
    barre: "lepasseportsante.fr/session",
    frames: [
      { src: `${D}/eleve-code-1.jpg`, legende: "L'écran d'entrée : un champ, rien d'autre." },
      { src: `${D}/eleve-code-2.jpg`, legende: "Le code saisi, il n'y a plus qu'à commencer." },
    ],
  },
  parcours: {
    barre: "Module Vaccination",
    frames: [
      { src: `${D}/eleve-carte-1.jpg`, legende: "Au départ, seule la première étape est ouverte." },
      { src: `${D}/eleve-carte-2.jpg`, legende: "Chaque étape terminée ouvre la suivante." },
      { src: `${D}/eleve-carte-3.jpg`, legende: "Le module se parcourt en cinq étapes." },
    ],
  },
  jeu: {
    barre: "Module Vaccination · Quiz final",
    frames: [
      { src: `${D}/eleve-jeu-1.jpg`, legende: "Une question, plusieurs réponses possibles." },
      { src: `${D}/eleve-jeu-2.jpg`, legende: "On choisit, on valide." },
      { src: `${D}/eleve-jeu-3.jpg`, legende: "La correction explique pourquoi." },
    ],
  },
  attestation: {
    barre: "Module Vaccination · Fin",
    frames: [
      { src: `${D}/eleve-fin-1.jpg`, legende: "L'attestation se télécharge en fin de module." },
    ],
  },
  session: {
    barre: "Tableau de bord · Nouvelle session",
    frames: [
      { src: `${D}/prof-session-2.jpg`, legende: "On choisit le type de session, puis le module." },
    ],
  },
  suivi: {
    barre: "Tableau de bord · Vue générale",
    frames: [
      {
        src: `${D}/prof-session-1.jpg`,
        legende: "Chaque session affiche son code et l'avancement de la classe.",
      },
    ],
  },
  stats: {
    barre: "Tableau de bord · Résultats",
    frames: [
      { src: `${D}/prof-resultats-1.jpg`, legende: "Les sessions terminées gardent leurs résultats." },
      { src: `${D}/prof-stats-1.jpg`, legende: "Les statistiques agrègent toutes les classes." },
    ],
  },
} satisfies Record<string, { barre: string; frames: Frame[] }>;
