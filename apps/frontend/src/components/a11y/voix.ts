// Synthèse vocale partagée par le panneau d'accessibilité et le rappel de
// consigne : choix de la voix, lecture, et lecture des préférences de l'élève.

export const CLE_PREFS = "a11y_prefs";

export type Prefs = {
  police: boolean;
  taille: 0 | 1 | 2;
  voix: boolean;
  voixNom: string | null;
};

export const PREFS_DEFAUT: Prefs = { police: false, taille: 0, voix: false, voixNom: null };

export function lirePrefs(): Prefs {
  try {
    const brut = localStorage.getItem(CLE_PREFS);
    return brut ? { ...PREFS_DEFAUT, ...(JSON.parse(brut) as Partial<Prefs>) } : PREFS_DEFAUT;
  } catch {
    return PREFS_DEFAUT;
  }
}

// La lecture à voix haute est-elle activée par l'élève ?
export function voixActivee(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && lirePrefs().voix;
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
export function nomLisibleVoix(v: SpeechSynthesisVoice): string {
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

// Lit un texte. Sans nom de voix, on reprend celle choisie par l'élève, sinon
// la meilleure disponible.
export function lireAVoixHaute(texte: string, nomVoix?: string | null) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const propre = texte.replace(/\s+/g, " ").trim();
  if (!propre) return;
  const u = new SpeechSynthesisUtterance(propre);
  u.lang = "fr-FR";
  u.rate = 0.95;
  u.pitch = 1;
  const dispo = voixFrancaises();
  const choisie = nomVoix !== undefined ? nomVoix : lirePrefs().voixNom;
  const v = (choisie ? dispo.find((x) => x.name === choisie) : undefined) ?? dispo[0];
  try {
    if (v) u.voice = v;
  } catch {
    // Voix devenue invalide (désinstallée, changement de profil…) : on lit quand
    // même avec la voix par défaut du système plutôt que de rester muet.
  }
  synth.speak(u);
}
