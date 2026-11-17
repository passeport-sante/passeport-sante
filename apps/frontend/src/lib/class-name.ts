// Construction automatique du nom d'une session à partir du niveau choisi
// et de la lettre / du numéro de la classe, pour des noms homogènes ("3e A").
// Même règle côté serveur : apps/backend/src/common/class-name.ts (les garder alignés).
//
//   niveau 3e + "A" / "a" / "3ème A" / "3eA" → "3e A"
//   niveau 3e + "2"                         → "3e 2"
//   niveau 3e + "302"                       → "302" (numéro de division officiel, gardé tel quel)

export type BuiltClassName = {
  name: string; // "" si rien à construire
  // Le nom suggère un autre niveau que celui choisi (ex. niveau 4e + "302").
  levelMismatch: string | null; // chiffre du niveau suggéré ("3"), sinon null
};

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// levelDigit : "6", "5", "4" ou "3" (premier caractère du libellé "6e"…).
export function buildClassName(levelDigit: string, raw: string): BuiltClassName {
  const input = raw.trim().replace(/\s+/g, " ");
  if (!input) return { name: "", levelMismatch: null };

  // Numéro de division à 3 chiffres (301, 402…) : nom officiel, on le garde.
  if (/^\d{3}$/.test(input)) {
    return { name: input, levelMismatch: input[0] !== levelDigit ? input[0]! : null };
  }

  // Le prof a tapé le nom complet ("3ème A", "4eme B", "3eA") : on ne garde que la lettre / le numéro.
  // Variantes les plus longues d'abord ("eme" avant "e"), sinon "3eme A" serait coupé après "3e".
  const plain = stripAccents(input);
  if (/^[3-6]\s*(?:ieme|eme|ime|em|e)?$/i.test(plain)) return { name: "", levelMismatch: null }; // "3e" seul : pas de classe
  const prefix = plain.match(/^([3-6])\s*(?:ieme|eme|ime|em|e)?\s*(?=[a-z0-9])/i);
  let division = input;
  let levelMismatch: string | null = null;
  if (prefix && prefix[0].length < plain.length) {
    division = input.slice(prefix[0].length).trim();
    if (prefix[1] !== levelDigit) levelMismatch = prefix[1]!;
  }

  const normalized = /^[a-z]+$/i.test(division) ? division.toUpperCase() : division;
  return { name: `${levelDigit}e ${normalized}`, levelMismatch };
}
