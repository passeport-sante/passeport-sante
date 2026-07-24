/**
 * Upload d'images vers Cloudinary.
 *
 * On passe par la route Next `/api/upload` (même origine) qui relaie le fichier
 * côté serveur : l'appel direct à api.cloudinary.com est bloqué par la CSP de
 * production. Le back-office envoie l'original sans le redimensionner — les
 * dimensions de rendu sont appliquées à la livraison via les transformations
 * d'URL (imageUrlAt).
 */

const IMAGE_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/webp", "image/jpeg"];

/** Envoie le fichier et retourne l'URL sécurisée. Lève une erreur explicite sinon. */
export async function uploadImageFile(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Format non supporté : utilisez un PNG, un JPEG ou un WebP.");
  }
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    throw new Error(`Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 8 Mo.`);
  }

  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Échec de l'upload");
  }
  return data.url as string;
}

const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";

/**
 * URL d'affichage redimensionnée d'une image Cloudinary.
 * Les URLs externes (ou non Cloudinary) sont renvoyées telles quelles.
 */
export function imageUrlAt(url: string, width: number, height: number): string {
  const marker = url.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (marker === -1) return url;
  const head = url.slice(0, marker + CLOUDINARY_UPLOAD_MARKER.length);
  const tail = url.slice(marker + CLOUDINARY_UPLOAD_MARKER.length);
  return `${head}w_${width},h_${height},c_fill,f_auto,q_auto/${tail}`;
}
