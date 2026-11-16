import { BadGatewayException, Injectable, Logger } from "@nestjs/common";

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

// Secours : le même annuaire, publié par le ministère sur data.gouv.fr (API tabulaire).
const FALLBACK_URL =
  "https://tabular-api.data.gouv.fr/api/resources/b22f04bf-64a8-495d-b8bb-d84dbc4c7983/data/";
const FALLBACK_COLUMNS =
  "Identifiant_de_l_etablissement,Nom_etablissement,Nom_commune,Code_postal,Code_departement,Statut_public_prive";
// Mots trop courants pour filtrer (presque tous les noms commencent par "Collège").
const FALLBACK_STOPWORDS = new Set(["college", "les", "des", "sur", "saint"]);

type FallbackRecord = {
  Identifiant_de_l_etablissement: string;
  Nom_etablissement: string;
  Nom_commune: string;
  Code_postal: string;
  Code_departement: string;
  Statut_public_prive: string | null;
};

// Minuscules sans accents, pour comparer "Epinal" et "Épinal".
function fold(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

@Injectable()
export class DirectoryService {
  private readonly logger = new Logger(DirectoryService.name);

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
    } catch (err) {
      // Source principale en échec (ex. : 401 de data.education.gouv.fr en nov. 2026) :
      // on retombe sur la copie du même annuaire publiée sur data.gouv.fr.
      this.logger.warn(`data.education.gouv.fr en échec (${(err as Error).message}), secours data.gouv.fr`);
      try {
        return await this.searchCollegesFallback(terms);
      } catch (fallbackErr) {
        this.logger.warn(`Secours data.gouv.fr en échec (${(fallbackErr as Error).message})`);
        throw new BadGatewayException("Annuaire indisponible");
      }
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

  // Secours : API tabulaire de data.gouv.fr sur le CSV de l'annuaire. Elle n'a pas
  // de recherche plein texte : chaque mot est cherché dans le nom et dans la commune
  // (insensible à la casse, sensible aux accents, 50 lignes max par requête), puis on
  // garde les collèges qui contiennent tous les mots. UAI et code postal : correspondance exacte.
  private async searchCollegesFallback(terms: string): Promise<DirectoryCollege[]> {
    const words = terms.split(/\s+/).filter((w) => w.length >= 3 && !FALLBACK_STOPWORDS.has(fold(w)));
    if (words.length === 0) return [];

    // L'API est lente (plusieurs secondes par requête) : on n'interroge que les 2 mots
    // les plus longs, les plus discriminants. Tous les mots servent au filtrage final.
    const queried = [...words].sort((a, b) => b.length - a.length).slice(0, 2);
    const filters: [string, string][] = [];
    for (const word of queried) {
      if (/^\d{7}[a-z]$/i.test(word)) filters.push(["Identifiant_de_l_etablissement__exact", word.toUpperCase()]);
      else if (/^\d{5}$/.test(word)) filters.push(["Code_postal__exact", word]);
      else filters.push(["Nom_etablissement__contains", word], ["Nom_commune__contains", word]);
    }

    const signal = AbortSignal.timeout(15000);
    const batches = await Promise.all(
      filters.map(async ([filter, value]) => {
        const params = new URLSearchParams({
          libelle_nature__exact: "COLLEGE",
          etat__exact: "OUVERT",
          [filter]: value,
          columns: FALLBACK_COLUMNS,
          page_size: "50",
        });
        const res = await fetch(`${FALLBACK_URL}?${params}`, { signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return ((await res.json()) as { data?: FallbackRecord[] }).data ?? [];
      }),
    );

    const folded = words.map(fold);
    const byUai = new Map<string, FallbackRecord>();
    for (const r of batches.flat()) {
      const haystack = fold(
        `${r.Nom_etablissement} ${r.Nom_commune} ${r.Identifiant_de_l_etablissement} ${r.Code_postal}`,
      );
      if (folded.every((w) => haystack.includes(w))) byUai.set(r.Identifiant_de_l_etablissement, r);
    }

    return [...byUai.values()].slice(0, 8).map((r) => ({
      uai: r.Identifiant_de_l_etablissement,
      name: r.Nom_etablissement,
      city: r.Nom_commune,
      postalCode: r.Code_postal,
      department: normalizeDepartment(r.Code_departement),
      status: r.Statut_public_prive,
    }));
  }
}
