"use client";

// Rappel de consigne du parcours élève.
//
// L'ARS a relevé que les consignes sont peu visibles : elles tiennent en une
// ligne grise sous le titre, et un élève qui hésite en cours de jeu n'a aucun
// moyen de les relire. Ce composant ajoute un bouton « ? » permanent qui les
// réaffiche en grand, et les montre d'office la première fois qu'un élève
// ouvre une étape donnée.
//
// Comme le panneau d'accessibilité, il est monté une seule fois pour tout le
// parcours et lit le bandeau de l'écran courant : aucun des 12 mini-jeux n'a
// besoin de le connaître, et un nouveau jeu en profitera sans rien faire.

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, Volume2, X } from "lucide-react";
import { lireAVoixHaute, voixActivee } from "./voix";

const CLE_VUES = "consignes_vues";

// Étapes déjà ouvertes par cet élève : la consigne ne s'affiche d'office
// qu'une fois par étape, pour ne pas devenir un obstacle à chaque passage.
function dejaVue(stepId: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(CLE_VUES) ?? "[]") as string[]).includes(stepId);
  } catch {
    return false;
  }
}

function marquerVue(stepId: string): void {
  try {
    const vues = JSON.parse(localStorage.getItem(CLE_VUES) ?? "[]") as string[];
    if (!vues.includes(stepId)) {
      // On borne la liste : inutile de garder l'historique complet d'un poste
      // partagé entre plusieurs classes.
      localStorage.setItem(CLE_VUES, JSON.stringify([...vues, stepId].slice(-200)));
    }
  } catch {
    // Stockage indisponible : la consigne s'affichera à chaque passage, ce qui
    // reste préférable à une erreur.
  }
}

// ─── Couleur du module ────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const VERT_DEFAUT = "#228b22"; // brand-dark-green, si le module n'a pas de couleur
const couleursConnues = new Map<string, string>();

async function couleurDuModule(slug: string): Promise<string> {
  const enCache = couleursConnues.get(slug);
  if (enCache) return enCache;
  try {
    const res = await fetch(`${API}/api/modules/slug/${encodeURIComponent(slug)}`);
    if (!res.ok) return VERT_DEFAUT;
    const data = (await res.json()) as { colorPrimary?: string | null };
    const couleur = lisibleSurBlanc(data.colorPrimary) ? data.colorPrimary! : VERT_DEFAUT;
    couleursConnues.set(slug, couleur);
    return couleur;
  } catch {
    return VERT_DEFAUT;
  }
}

// Certaines couleurs de module sont très claires (le jaune de Vaccination, par
// exemple) : en fond d'un bouton à texte blanc, elles seraient illisibles. On
// ne garde donc que les couleurs suffisamment sombres.
function lisibleSurBlanc(hex?: string | null): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const v = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Luminance perçue (ITU-R BT.601), 0 = noir, 255 = blanc.
  return 0.299 * r + 0.587 * v + 0.114 * b < 170;
}

// Le bandeau de chaque écran porte le titre de l'étape et sa consigne.
function lireBandeau(): { titre: string; consigne: string } | null {
  const bandeau = document.querySelector("header");
  const titre = bandeau?.querySelector("h1, h2")?.textContent?.trim() ?? "";
  const consigne =
    bandeau?.querySelector("h1 + p, h2 + p")?.textContent?.trim() ?? "";
  if (!titre && !consigne) return null;
  return { titre, consigne };
}

export function ConsignePanel() {
  const pathname = usePathname();
  const [contenu, setContenu] = useState<{ titre: string; consigne: string } | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [couleur, setCouleur] = useState(VERT_DEFAUT);
  const etapeRef = useRef<string | null>(null);

  const stepId = pathname?.match(/\/step\/([^/]+)/)?.[1] ?? null;
  const slug = pathname?.match(/\/modules\/([^/]+)/)?.[1] ?? null;

  // Le modal reprend la couleur du module en cours, comme le reste du parcours.
  useEffect(() => {
    if (!slug) return;
    let annule = false;
    void couleurDuModule(slug).then((c) => {
      if (!annule) setCouleur(c);
    });
    return () => {
      annule = true;
    };
  }, [slug]);

  // Le bandeau est rendu par le jeu, parfois après un chargement de données :
  // on le relit tant qu'il n'a rien donné, puis on s'arrête.
  useEffect(() => {
    if (!stepId) {
      setContenu(null);
      return;
    }
    let essais = 0;
    const id = setInterval(() => {
      const lu = lireBandeau();
      essais++;
      if (lu || essais > 20) {
        clearInterval(id);
        setContenu(lu);
        // Première visite de cette étape : on montre la consigne d'office.
        if (lu?.consigne && etapeRef.current !== stepId && !dejaVue(stepId)) {
          etapeRef.current = stepId;
          marquerVue(stepId);
          setOuvert(true);
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [stepId]);

  // Changement d'étape : on referme ce qui était ouvert.
  useEffect(() => {
    setOuvert(false);
  }, [stepId]);

  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  const lire = useCallback(() => {
    if (!contenu) return;
    const liaison = /[.!?…:]$/.test(contenu.titre) ? " " : ". ";
    lireAVoixHaute(
      contenu.consigne ? `${contenu.titre}${liaison}${contenu.consigne}` : contenu.titre,
    );
  }, [contenu]);

  if (!stepId || !contenu) return null;

  return (
    <>
      {/* Bouton permanent, à gauche du bouton « Aa » */}
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label="Revoir la consigne"
        // Sur téléphone, les deux boutons flottants sont empilés : côte à côte,
        // ils mordaient sur le bouton de validation, centré en bas de l'écran.
        className="fixed bottom-20 right-4 sm:bottom-4 sm:right-20 z-40 w-12 h-12 rounded-full bg-white text-gray-900 shadow-lg border border-gray-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <HelpCircle size={22} />
      </button>

      {ouvert && (
        <div
          className="fixed inset-0 z-[45] flex items-center justify-center p-4"
          style={{ background: "rgba(15,27,45,0.55)" }}
          onClick={() => setOuvert(false)}
        >
          <div
            role="dialog"
            aria-label="Consigne"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 md:p-8 text-center space-y-4 border-t-8"
            style={{ borderTopColor: couleur }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold uppercase tracking-wider rounded-full px-3 py-1"
                style={{ color: couleur, background: `${couleur}1a` }}
              >
                Ce qu&apos;il faut faire
              </span>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <h2 className="text-2xl font-black text-gray-900">{contenu.titre}</h2>
            {contenu.consigne && (
              <p className="text-lg text-gray-600 leading-relaxed">{contenu.consigne}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {voixActivee() && (
                <button
                  type="button"
                  onClick={lire}
                  className="flex-1 rounded-full border-2 border-gray-200 text-gray-700 font-bold text-sm py-3 flex items-center justify-center gap-2 hover:bg-gray-50"
                >
                  <Volume2 size={16} />
                  Écouter
                </button>
              )}
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="flex-1 rounded-full text-white font-bold text-sm py-3 hover:opacity-90"
                style={{ background: couleur }}
              >
                C&apos;est parti !
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
