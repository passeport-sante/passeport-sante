/**
 * Upload d'images vers Cloudinary depuis le navigateur (preset non signé).
 *
 * Le back-office envoie l'original sans le redimensionner : les dimensions de
 * rendu sont appliquées à la livraison via les transformations d'URL.
 */

const IMAGE_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/webp", "image/jpeg"];

/** Envoie le fichier et retourne l'URL sécurisée. Lève une erreur explicite sinon. */
export async function uploadImageFile(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return Promise.reject(new Error("Format non supporté : utilisez un PNG, un JPEG ou un WebP."));
  }
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    return Promise.reject(
      new Error(`Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 8 Mo.`),
    );
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    throw new Error("Cloudinary n'est pas configuré (variables NEXT_PUBLIC_CLOUDINARY_*)");
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error("Échec de l'upload Cloudinary");

  const data = await res.json();
  if (!data.secure_url) throw new Error("Réponse Cloudinary inattendue");
  return data.secure_url as string;
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
