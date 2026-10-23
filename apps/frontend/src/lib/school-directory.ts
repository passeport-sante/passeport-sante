// Recherche d'un collège dans l'annuaire de l'Éducation nationale, via le
// backend (GET /api/directory/colleges) : c'est le serveur qui interroge
// data.education.gouv.fr, pour qu'une politique de sécurité, un réseau filtrant
// ou un bloqueur côté navigateur ne bloque pas la recherche.

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type DirectoryCollege = {
  uai: string;
  name: string;
  city: string;
  postalCode: string;
  department: string; // "54", "2A", "971"
  status: string | null; // "Public" / "Privé"
};

// Recherche plein texte (nom, ville, académie, numéro UAI…) parmi les collèges ouverts.
export async function searchColleges(query: string, signal?: AbortSignal): Promise<DirectoryCollege[]> {
  const terms = query.trim();
  if (terms.length < 3) return [];
  const token = localStorage.getItem("access_token") ?? "";
  const res = await fetch(`${API}/api/directory/colleges?${new URLSearchParams({ q: terms })}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  if (!res.ok) throw new Error("Annuaire indisponible");
  return res.json();
}
