// Annuaire de l'éducation (data.education.gouv.fr) : API publique de l'État,
// sans clé, ouverte au navigateur (CORS). Sert à choisir un collège existant
// au lieu de saisir nom / ville / code postal à la main.

const DIRECTORY_URL =
  "https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records";

export type DirectoryCollege = {
  uai: string;
  name: string;
  city: string;
  postalCode: string;
  department: string; // "54", "2A", "971"
  status: string | null; // "Public" / "Privé"
};

type DirectoryRecord = {
  identifiant_de_l_etablissement: string;
  nom_etablissement: string;
  nom_commune: string;
  code_postal: string;
  code_departement: string;
  statut_public_prive: string | null;
};

// L'annuaire écrit "054", "02A", "971" : on revient à "54", "2A", "971".
function normalizeDepartment(code: string): string {
  return code.length === 3 && code.startsWith("0") ? code.slice(1) : code;
}

// Recherche plein texte (nom, ville, académie, numéro UAI…) parmi les collèges ouverts.
export async function searchColleges(query: string, signal?: AbortSignal): Promise<DirectoryCollege[]> {
  const terms = query.trim().replace(/"/g, "");
  if (terms.length < 3) return [];
  const params = new URLSearchParams({
    where: `libelle_nature="COLLEGE" and etat="OUVERT" and "${terms}"`,
    select:
      "identifiant_de_l_etablissement,nom_etablissement,nom_commune,code_postal,code_departement,statut_public_prive",
    limit: "8",
  });
  const res = await fetch(`${DIRECTORY_URL}?${params}`, { signal });
  if (!res.ok) throw new Error("Annuaire indisponible");
  const data: { results: DirectoryRecord[] } = await res.json();
  return data.results.map((r) => ({
    uai: r.identifiant_de_l_etablissement,
    name: r.nom_etablissement,
    city: r.nom_commune,
    postalCode: r.code_postal,
    department: normalizeDepartment(r.code_departement),
    status: r.statut_public_prive,
  }));
}
