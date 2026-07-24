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

// Le reverse-proxy de production plafonne la taille du corps de requête (413
// « Request Entity Too Large ») : on redimensionne côté navigateur avant l'envoi.
// 1600px couvre tous les usages (mascotte ~760px, vignettes plus petit) et le
// WebP préserve la transparence des mascottes.
const MAX_EDGE_PX = 1600;
const WEBP_QUALITY = 0.85;

/** Envoie le fichier et retourne l'URL sécurisée. Lève une erreur explicite sinon. */
export async function uploadImageFile(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Format non supporté : utilisez un PNG, un JPEG ou un WebP.");
  }
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    throw new Error(`Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 8 Mo.`);
  }

  const payload = await downscaleImage(file);

  const fd = new FormData();
  fd.append("file", payload);

  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(res.status === 413 ? "Image trop volumineuse pour le serveur." : data.error ?? "Échec de l'upload");
  }
  return data.url as string;
}

/**
 * Réduit une image à MAX_EDGE_PX sur son plus grand côté et la ré-encode en
 * WebP. Renvoie l'original si la conversion échoue ou n'apporte rien (le
 * serveur reste protégé par sa propre limite de taille dans ce cas).
 */
async function downscaleImage(file: File): Promise<Blob> {
  if (typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    // On garde le résultat seulement s'il est plus léger que l'original.
    if (blob && blob.size > 0 && blob.size < file.size) {
      return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
    }
    return file;
  } catch {
    return file;
  }
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
