"use client";

// Panneau d'accessibilité « Aa » du parcours élève.
//
// Trois réglages, proposés à tout le monde sans qu'il faille le demander :
//  - une police plus lisible (Atkinson Hyperlegible, avec un peu plus
//    d'espacement entre lettres, mots et lignes) ;
//  - une taille de texte plus grande, sur deux paliers ;
//  - la lecture à voix haute : l'élève touche un texte pour l'entendre.
//
// Les réglages sont posés en attributs sur <html> et appliqués par
// globals.css : aucun des 12 mini-jeux n'a eu besoin d'être modifié. Ils sont
// mémorisés en localStorage — ce sont des préférences d'affichage, pas des
// données à protéger.
//
// La voix est la synthèse vocale du navigateur : gratuite, sans fichier à
// enregistrer, et tout nouveau contenu de module est lu sans rien faire. Son
// timbre dépend de l'appareil.

import { useCallback, useEffect, useRef, useState } from "react";
import { Type, Volume2, X, Minus, Plus } from "lucide-react";

type Prefs = { police: boolean; taille: 0 | 1 | 2; voix: boolean; voixNom: string | null };

const CLE = "a11y_prefs";
const DEFAUT: Prefs = { police: false, taille: 0, voix: false, voixNom: null };

// Éléments dont on lit le texte quand l'élève les touche en mode voix.
const LISIBLES =
  'h1, h2, h3, h4, p, li, label, button, a, td, th, [draggable="true"], [data-a11y-lire]';

function lirePrefs(): Prefs {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...DEFAUT, ...(JSON.parse(brut) as Partial<Prefs>) } : DEFAUT;
  } catch {
    return DEFAUT;
  }
}

export function voixFrancaises(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith("fr"))
    .sort((a, b) => qualite(b) - qualite(a));
}

// Toutes les voix françaises ne se valent pas, et de loin. Les voix « Natural »
// de Microsoft (Edge) et « Google français » (Chrome) sont proches d'une vraie
// voix ; les voix locales de Windows (Hortense, Paul) sonnent robotiques. On
// classe donc les voix disponibles plutôt que de prendre la première venue.
function qualite(v: SpeechSynthesisVoice): number {
  let note = 0;
  if (/natural|neural|wavenet|studio/i.test(v.name)) note += 8;
  if (/google/i.test(v.name)) note += 6;
  if (!v.localService) note += 3; // les voix en ligne sont les mieux synthétisées
  if (v.lang.toLowerCase() === "fr-fr") note += 2;
  if (v.default) note += 1;
  return note;
}

// Les noms système sont longs et techniques (« Microsoft Denise Online
// (Natural) - French (France) ») : on les raccourcit pour la liste.
function nomLisibleVoix(v: SpeechSynthesisVoice): string {
  // « Google » est gardé : c'est le nom de la voix, pas celui de l'éditeur.
  const nom = v.name
    .replace(/^Microsoft\s+/i, "")
    .replace(/\s*-\s*Fren(ch|ça).*$/i, "")
    .replace(/\bOnline\b/gi, "")
    .replace(/\((Natural|Neural)\)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return /natural|neural|google/i.test(v.name) ? `${nom || "Voix"} — naturelle` : nom || v.name;
}

function parler(texte: string, nomVoix?: string | null) {
  const synth = window.speechSynthesis;
  synth.cancel();
  const propre = texte.replace(/\s+/g, " ").trim();
  if (!propre) return;
  const u = new SpeechSynthesisUtterance(propre);
  u.lang = "fr-FR";
  u.rate = 0.95;
  u.pitch = 1;
  const dispo = voixFrancaises();
  const v = (nomVoix ? dispo.find((x) => x.name === nomVoix) : undefined) ?? dispo[0];
  try {
    if (v) u.voice = v;
  } catch {
    // Voix devenue invalide (débranchée, changement de profil…) : on lit quand
    // même avec la voix par défaut du système plutôt que de rester muet.
  }
  synth.speak(u);
}

export function AccessibilityPanel() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAUT);
  const [ouvert, setOuvert] = useState(false);
  const [voixDispo, setVoixDispo] = useState(false);
  const [listeVoix, setListeVoix] = useState<SpeechSynthesisVoice[]>([]);
  const panneauRef = useRef<HTMLDivElement>(null);

  // Chargement des préférences et de la disponibilité de la synthèse vocale.
  useEffect(() => {
    setPrefs(lirePrefs());
    const dispo = typeof window !== "undefined" && "speechSynthesis" in window;
    setVoixDispo(dispo);
    if (!dispo) return;
    // La liste des voix arrive souvent après coup, d'où l'écoute de l'événement.
    const charger = () => setListeVoix(voixFrancaises());
    charger();
    window.speechSynthesis.addEventListener("voiceschanged", charger);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", charger);
  }, []);

  // Application des réglages sur <html>, retirés en quittant le parcours
  // élève pour ne pas déborder sur le reste du site.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.a11yPolice = prefs.police ? "lisible" : "";
    html.dataset.a11yTaille = String(prefs.taille);
    html.dataset.a11yVoix = prefs.voix ? "on" : "";
    try {
      localStorage.setItem(CLE, JSON.stringify(prefs));
    } catch {}
    return () => {
      delete html.dataset.a11yPolice;
      delete html.dataset.a11yTaille;
      delete html.dataset.a11yVoix;
    };
  }, [prefs]);

  // Mode voix : un toucher sur un texte le lit. L'écoute est en phase de
  // capture et n'empêche rien : le clic continue de sélectionner la carte ou
  // de valider la réponse, comme d'habitude.
  useEffect(() => {
    if (!prefs.voix || !voixDispo) return;
    function surClic(e: MouseEvent) {
      const cible = e.target as HTMLElement | null;
      if (!cible || panneauRef.current?.contains(cible)) return;
      const el = cible.closest<HTMLElement>(LISIBLES);
      const texte = el?.innerText?.trim();
      if (texte && texte.length <= 600) parler(texte, prefs.voixNom);
    }
    document.addEventListener("click", surClic, true);
    return () => {
      document.removeEventListener("click", surClic, true);
      window.speechSynthesis.cancel();
    };
  }, [prefs.voix, prefs.voixNom, voixDispo]);

  // Échap ferme le panneau.
  useEffect(() => {
    if (!ouvert) return;
    const surTouche = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(false);
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [ouvert]);

  const maj = useCallback((p: Partial<Prefs>) => setPrefs((a) => ({ ...a, ...p })), []);

  // Lit le titre et la consigne de l'écran courant (le bandeau du haut).
  function lireConsigne() {
    const bandeau = document.querySelector("header");
    const titre = (bandeau?.querySelector("h1, h2")?.textContent ?? "").trim();
    const consigne = (bandeau?.querySelector("h1 + p, h2 + p, p")?.textContent ?? "").trim();
    // Pas de point ajouté derrière un titre déjà ponctué (« Vrai ou Intox ? »).
    const liaison = /[.!?…:]$/.test(titre) ? " " : ". ";
    parler(consigne ? `${titre}${liaison}${consigne}` : titre, prefs.voixNom);
  }

  const actifs = Number(prefs.police) + Number(prefs.taille > 0) + Number(prefs.voix);

  return (
    <div ref={panneauRef} className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {ouvert && (
        <div
          role="dialog"
          aria-label="Réglages de lecture"
          className="w-[min(320px,calc(100vw-2rem))] rounded-2xl bg-white shadow-2xl border border-gray-100 p-5 space-y-5 text-gray-800"
        >
          <div className="flex items-center justify-between">
            <p className="font-black text-base">Réglages de lecture</p>
            <button
              type="button"
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Police lisible */}
          <Interrupteur
            icone={<Type size={16} />}
            titre="Police plus lisible"
            detail="Lettres plus distinctes et mieux espacées."
            actif={prefs.police}
            onChange={(v) => maj({ police: v })}
          />

          {/* Taille du texte */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Taille du texte</p>
              <p className="text-xs text-gray-500">
                {["Normale", "Grande", "Très grande"][prefs.taille]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Réduire le texte"
                disabled={prefs.taille === 0}
                onClick={() => maj({ taille: (prefs.taille - 1) as Prefs["taille"] })}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                aria-label="Agrandir le texte"
                disabled={prefs.taille === 2}
                onClick={() => maj({ taille: (prefs.taille + 1) as Prefs["taille"] })}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Lecture à voix haute */}
          {voixDispo ? (
            <div className="space-y-3">
              <Interrupteur
                icone={<Volume2 size={16} />}
                titre="Lecture à voix haute"
                detail="Touche un texte pour l'entendre."
                actif={prefs.voix}
                onChange={(v) => maj({ voix: v })}
              />
              {prefs.voix && (
                <>
                  {/* Choix de la voix. Les plus naturelles sont proposées en
                      premier ; la liste dépend du navigateur et du poste. */}
                  {listeVoix.length > 1 && (
                    <div className="space-y-1.5">
                      <label htmlFor="a11y-voix" className="text-xs font-bold text-gray-500">
                        Voix
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          id="a11y-voix"
                          value={prefs.voixNom ?? listeVoix[0]?.name ?? ""}
                          onChange={(e) => {
                            maj({ voixNom: e.target.value });
                            parler("Bonjour, je vais lire les textes avec toi.", e.target.value);
                          }}
                          className="flex-1 min-w-0 rounded-xl border border-gray-200 bg-gray-50 text-sm px-3 py-2"
                        >
                          {listeVoix.map((v) => (
                            <option key={v.name} value={v.name}>
                              {nomLisibleVoix(v)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          aria-label="Écouter cette voix"
                          onClick={() =>
                            parler("Bonjour, je vais lire les textes avec toi.", prefs.voixNom)
                          }
                          className="w-10 h-10 shrink-0 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Volume2 size={15} />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={lireConsigne}
                    className="w-full rounded-full bg-brand-dark-green text-white text-sm font-bold py-2.5 flex items-center justify-center gap-2 hover:opacity-90"
                  >
                    <Volume2 size={15} />
                    Lire la consigne
                  </button>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              La lecture à voix haute n&apos;est pas disponible sur ce navigateur.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label="Réglages de lecture"
        className="relative w-12 h-12 rounded-full bg-white text-gray-900 shadow-lg border border-gray-200 font-black text-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        Aa
        {actifs > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-green text-white text-[11px] font-bold flex items-center justify-center">
            {actifs}
          </span>
        )}
      </button>
    </div>
  );
}

function Interrupteur({
  icone,
  titre,
  detail,
  actif,
  onChange,
}: {
  icone: React.ReactNode;
  titre: string;
  detail: string;
  actif: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="flex items-start gap-2.5">
        <span className="mt-0.5 text-brand-dark-green">{icone}</span>
        <span>
          <span className="block text-sm font-bold">{titre}</span>
          <span className="block text-xs text-gray-500">{detail}</span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={actif}
        onClick={() => onChange(!actif)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          actif ? "bg-brand-green" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            actif ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}
