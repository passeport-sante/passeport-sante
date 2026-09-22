"use client";

import { useState } from "react";
import { GraduationCap, School } from "lucide-react";
import { APERCUS, Diaporama } from "./_components/previews";

type Audience = "eleve" | "enseignant";

type Etape = {
  titre: string;
  texte: string;
  apercu: { barre: string; frames: { src: string; legende: string }[] };
  badge?: string;
};

const ETAPES: Record<Audience, Etape[]> = {
  eleve: [
    {
      titre: "Entre le code de ta classe",
      texte:
        "Ton professeur t'écrit un code au tableau. Tu le saisis sur la page d'accueil et c'est tout : pas de compte à créer, pas de mot de passe à retenir. Tes réponses restent anonymes.",
      apercu: APERCUS.code,
    },
    {
      titre: "Avance étape par étape",
      texte:
        "Un module se compose de cinq mini-jeux, avec des affiches et des vidéos entre les deux. Chaque étape terminée ouvre la suivante, et tu peux revenir sur celles que tu as déjà faites.",
      apercu: APERCUS.parcours,
    },
    {
      titre: "Joue, trompe-toi, recommence",
      texte:
        "Trier, relier, glisser des cartes, répondre à un quiz : chaque jeu s'explique en une phrase. Une erreur n'est jamais bloquante, le jeu te donne un indice et tu réessayes.",
      apercu: APERCUS.jeu,
    },
    {
      titre: "Récupère ton attestation",
      texte:
        "À la fin du module, une attestation à ton nom s'affiche. Tu peux la télécharger ou l'imprimer pour la garder.",
      apercu: APERCUS.attestation,
    },
  ],
  enseignant: [
    {
      titre: "Crée une session pour ta classe",
      texte:
        "Depuis le tableau de bord, tu choisis un module et une classe. La plateforme génère un code : tu l'écris au tableau, et les élèves entrent avec.",
      apercu: APERCUS.session,
    },
    {
      titre: "Suis la séance en direct",
      texte:
        "Pendant que la classe joue, tu vois où en est chaque élève. Pratique pour repérer ceux qui décrochent et pour savoir quand lancer la mise en commun.",
      apercu: APERCUS.suivi,
    },
    {
      titre: "Consulte les résultats",
      texte:
        "Les sessions terminées gardent la trace de ce qui a été joué. Les statistiques de l'école montrent les modules les plus suivis et les notions les moins bien acquises.",
      apercu: APERCUS.stats,
    },
  ],
};

const ONGLETS: { id: Audience; label: string; icone: React.ReactNode }[] = [
  { id: "eleve", label: "Je suis élève", icone: <GraduationCap size={16} /> },
  { id: "enseignant", label: "Je suis enseignant", icone: <School size={16} /> },
];

export default function Tutoriel() {
  const [audience, setAudience] = useState<Audience>("eleve");

  return (
    <div className="relative overflow-hidden">
      <div className="circle-hero-mauve" />
      {/* Même remontée que sur la page contact : en position basse, le cercle est
          tranché net par l'overflow-hidden à la jointure avec le footer. */}
      <div className="circle-about-green !bottom-16" />

      {/* Hero */}
      <section className="relative z-10 brand-container pt-10 md:pt-16 pb-6 md:pb-10">
        <h1 className="text-3xl md:text-5xl font-black text-gray-900">
          Comment ça <span className="text-brand-green">marche</span> ?
        </h1>
        <p className="mt-4 text-lg md:text-xl text-gray-500 max-w-2xl leading-relaxed">
          Quelques minutes suffisent pour prendre en main la plateforme, que tu sois élève ou
          que vous encadriez une classe.
        </p>

        {/* Bascule élève / enseignant */}
        <div
          role="tablist"
          aria-label="Choisir son profil"
          className="mt-8 inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-100"
        >
          {ONGLETS.map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={audience === o.id}
              onClick={() => setAudience(o.id)}
              className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${
                audience === o.id
                  ? "bg-brand-dark-green text-white shadow"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {o.icone}
              {o.label}
            </button>
          ))}
        </div>
      </section>

      {/* Étapes */}
      <section className="relative z-10 brand-container pb-20 md:pb-32 space-y-10 md:space-y-16">
        {ETAPES[audience].map((etape, i) => (
          <div
            key={etape.titre}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-14 items-center ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 shrink-0 rounded-full bg-brand-green/10 text-brand-dark-green font-black flex items-center justify-center">
                  {i + 1}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-gray-900">{etape.titre}</h2>
              </div>
              {etape.badge && (
                <span className="inline-block mt-3 ml-12 text-[11px] font-bold uppercase tracking-wider text-brand-dark-green bg-brand-green/10 rounded-full px-3 py-1">
                  {etape.badge}
                </span>
              )}
              <p className="mt-4 ml-12 text-gray-500 leading-relaxed">{etape.texte}</p>
            </div>

            <Diaporama barre={etape.apercu.barre} frames={etape.apercu.frames} />
          </div>
        ))}

        {/* Aide */}
        <div className="rounded-[28px] bg-white shadow-[0_4px_30px_rgba(0,0,0,0.07)] p-6 md:p-10 text-center">
          <h2 className="text-xl md:text-2xl font-black text-gray-900">
            Il te reste une question ?
          </h2>
          <p className="mt-3 text-gray-500">
            Écris-nous, on répond sous 48 heures ouvrées.
          </p>
          <a
            href="/contact"
            className="inline-block mt-6 px-8 py-3.5 bg-brand-dark-green text-white font-bold rounded-full text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            Nous contacter
          </a>
        </div>
      </section>
    </div>
  );
}
