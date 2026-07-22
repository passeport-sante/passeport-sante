import { authHeaders } from "./auth";
import { validateMascotteFile } from "./mascotte";

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
 * On uploade l'original sans le redimensionner : les dimensions de rendu sont
 * appliquées à la livraison par mascotteUrl(). Ça évite d'imposer un format à
 * l'admin tout en garantissant qu'aucun composant ne sert l'original brut.
 */
export async function uploadMascotteFile(file: File): Promise<string> {
  const validationError = validateMascotteFile(file);
  if (validationError) throw new Error(validationError);

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
