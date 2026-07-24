import { authHeaders } from "./auth";
import { validateMascotteFile } from "./mascotte";
import { uploadImageFile } from "./upload";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type Mascotte = {
  id: string;
  label: string;
  url: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMascottes(): Promise<Mascotte[]> {
  const res = await fetch(`${API}/api/mascotte`, { cache: "no-store" });
  if (!res.ok) throw new Error("Impossible de charger les mascottes");
  return res.json();
}

export async function createMascotte(label: string, url: string): Promise<Mascotte> {
  const res = await fetch(`${API}/api/mascotte`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ label, url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de l'ajout de la mascotte");
  }
  return res.json();
}

export async function deleteMascotte(id: string): Promise<void> {
  const res = await fetch(`${API}/api/mascotte/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la suppression");
  }
}

/**
 * Envoie le fichier sur Cloudinary et retourne l'URL sécurisée.
 *
 * L'upload passe par la route Next `/api/upload` (voir lib/upload.ts) : l'appel
 * direct à Cloudinary est bloqué par la CSP de production. On uploade l'original
 * sans le redimensionner — les dimensions de rendu sont appliquées à la
 * livraison par mascotteUrl(). La validation mascotte (PNG/WebP transparents)
 * reste faite ici avant l'envoi.
 */
export async function uploadMascotteFile(file: File): Promise<string> {
  const validationError = validateMascotteFile(file);
  if (validationError) throw new Error(validationError);
  return uploadImageFile(file);
}
