import { BadGatewayException, Injectable } from "@nestjs/common";

// Annuaire de l'éducation (data.education.gouv.fr), API publique de l'État.
// Interrogé par le serveur plutôt que par le navigateur : une politique de
// sécurité (CSP), un réseau filtrant ou un bloqueur de publicité côté
// utilisateur ne peuvent plus empêcher la recherche.
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

@Injectable()
export class DirectoryService {
  // Recherche plein texte (nom, ville, académie, numéro UAI…) parmi les collèges ouverts.
  // Filtre sur libelle_nature (sans accent) : "Collège" accentué passe mal dans la requête.
  async searchColleges(query: string): Promise<DirectoryCollege[]> {
    const terms = query.trim().replace(/"/g, "");
    if (terms.length < 3) return [];

    const params = new URLSearchParams({
      where: `libelle_nature="COLLEGE" and etat="OUVERT" and "${terms}"`,
      select:
        "identifiant_de_l_etablissement,nom_etablissement,nom_commune,code_postal,code_departement,statut_public_prive",
      limit: "8",
    });

    let data: { results?: DirectoryRecord[] };
    try {
      const res = await fetch(`${DIRECTORY_URL}?${params}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = (await res.json()) as { results?: DirectoryRecord[] };
    } catch {
      throw new BadGatewayException("Annuaire indisponible");
    }

    return (data.results ?? []).map((r) => ({
      uai: r.identifiant_de_l_etablissement,
      name: r.nom_etablissement,
      city: r.nom_commune,
      postalCode: r.code_postal,
      department: normalizeDepartment(r.code_departement),
      status: r.statut_public_prive,
    }));
  }
}
