/**
 * Résolution d'URL des mascottes.
 *
 * Le champ `mascotte` d'un module contient deux formats selon son âge :
 *  - legacy : un nom de fichier livré avec le build ("mascotte1.png")
 *  - upload : une URL Cloudinary absolue
 *
 * Ce helper absorbe la différence pour qu'aucun composant n'ait à la connaître,
 * et centralise les dimensions de rendu — auparavant implicites dans chaque
 * composant, ce qui faisait servir des PNG de 2814x1536 dans un cadre de 380px.
 */

/** Dimensions de rendu par usage. `c_fit` préserve le ratio ET la transparence. */
export const MASCOTTE_SIZES = {
  /** Carte de module — cadre CSS 380x600, x2 pour les écrans HiDPI. */
  card: { width: 760, height: 1200 },
  /** Vignette de sélection dans le back-office. */
  thumb: { width: 240, height: 380 },
  /** Overlay de feedback en cours de jeu. */
  overlay: { width: 480, height: 760 },
  /**
   * Texture injectée dans le .riv. Rive décode l'image en mémoire GPU, donc
   * la source doit être petite : un original 2814x1536 coûterait ~17 Mo de VRAM
   * pour un rendu à 400px.
   */
  rive: { width: 400, height: 640 },
} as const;

export type MascotteSize = keyof typeof MASCOTTE_SIZES;

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/**
 * URL d'affichage d'une mascotte, redimensionnée pour l'usage demandé.
 * Retourne null si aucune mascotte n'est définie, pour que l'appelant puisse
 * garder son rendu conditionnel habituel.
 */
export function mascotteUrl(
  value: string | null | undefined,
  size: MascotteSize = "card",
): string | null {
  if (!value) return null;

  // Legacy : chemin absolu déjà résolu, ou simple nom de fichier servi depuis
  // public/assets/mascotte/. Dans les deux cas aucune transformation n'est possible.
  if (value.startsWith("/")) return value;
  if (!value.startsWith("http")) return `/assets/mascotte/${value}`;

  const marker = value.indexOf(CLOUDINARY_UPLOAD_MARKER);
  // URL absolue non-Cloudinary (ou format inattendu) : on la sert telle quelle.
  if (marker === -1) return value;

  const { width, height } = MASCOTTE_SIZES[size];
  const head = value.slice(0, marker + CLOUDINARY_UPLOAD_MARKER.length);
  const tail = value.slice(marker + CLOUDINARY_UPLOAD_MARKER.length);
  return `${head}w_${width},h_${height},c_fit,f_auto,q_auto/${tail}`;
}

/** Poids maximum accepté à l'upload, avant transformation Cloudinary. */
export const MASCOTTE_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Valide un fichier avant upload. Retourne un message d'erreur ou null.
 *
 * La transparence est la seule contrainte que Cloudinary ne peut pas rattraper :
 * une mascotte sur fond opaque s'affiche en rectangle collé sur la carte. On ne
 * peut pas inspecter les pixels ici, mais imposer PNG/WebP écarte le JPEG qui
 * est toujours opaque — c'est l'essentiel des cas.
 */
export function validateMascotteFile(file: File): string | null {
  if (!["image/png", "image/webp"].includes(file.type)) {
    return "Format non supporté : utilisez un PNG ou un WebP à fond transparent (le JPEG ne gère pas la transparence).";
  }
  if (file.size > MASCOTTE_MAX_UPLOAD_BYTES) {
    return `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 8 Mo.`;
  }
  return null;
}
