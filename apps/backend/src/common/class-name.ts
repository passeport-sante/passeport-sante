import { ClassLevel } from "@prisma/client";

// Harmonisation du nom d'une session à la création, en complément du formulaire
// (apps/frontend/src/lib/class-name.ts, même règle : les garder alignés).
// Volontairement prudente : seuls les noms de la forme « niveau + lettre ou numéro »
// cohérents avec le niveau choisi sont réécrits ("3ème a", "3eA", "3ieme B" → "3e A").
// Tout le reste est conservé tel quel : nom personnalisé, numéro de division ("302"),
// ou chiffre différent du niveau (on ne devine pas lequel des deux est juste).

const LEVEL_DIGIT: Record<ClassLevel, string> = {
  SIXIEME: "6",
  CINQUIEME: "5",
  QUATRIEME: "4",
  TROISIEME: "3",
};

export function normalizeClassName(className: string, level: ClassLevel | null | undefined): string {
  const trimmed = className.trim().replace(/\s+/g, " ");
  if (!level) return trimmed;

  const plain = trimmed.normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Variantes les plus longues d'abord ("eme" avant "e").
  const match = plain.match(/^([3-6])\s*(?:ieme|eme|ime|em|e)\s*([a-z]{1,2}|\d{1,2})$/i);
  if (!match || match[1] !== LEVEL_DIGIT[level]) return trimmed;

  const division = /^[a-z]+$/i.test(match[2]!) ? match[2]!.toUpperCase() : match[2]!;
  return `${match[1]}e ${division}`;
}
