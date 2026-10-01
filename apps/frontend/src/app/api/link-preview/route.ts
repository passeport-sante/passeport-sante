import { NextResponse } from "next/server";

// Aperçu d'une page vidéo qu'on ne peut pas intégrer (Lumni et consorts).
//
// On lit les balises de partage de la page — celles que les réseaux sociaux
// utilisent pour leurs aperçus — et on renvoie de quoi composer une carte
// cliquable : vignette, titre, durée.
//
// Les pages visées sont des contenus publics déjà affichés aux élèves ; on se
// limite malgré tout à https et on refuse les adresses internes, pour qu'une
// URL saisie dans l'admin ne puisse pas servir à sonder le réseau du serveur.

const HOTES_INTERNES =
  /^(localhost$|127\.|10\.|192\.168\.|169\.254\.|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i;

export type ApercuLien = {
  url: string;
  titre: string | null;
  image: string | null;
  description: string | null;
  site: string | null;
  dureeSecondes: number | null;
};

function baliseMeta(html: string, propriete: string): string | null {
  // Les balises s'écrivent indifféremment property="og:title" ou name="og:title",
  // et l'ordre des attributs varie d'un site à l'autre.
  const motif = new RegExp(
    `<meta[^>]+(?:property|name)=["']${propriete}["'][^>]*>`,
    "i",
  );
  const balise = html.match(motif)?.[0];
  if (!balise) return null;
  // On capture le guillemet ouvrant pour s'arrêter sur le même : sinon une
  // apostrophe dans le texte couperait la valeur (« C'est quoi… » → « C »).
  const contenu = balise.match(/content=(["'])([\s\S]*?)\1/i)?.[2];
  return contenu ? decodeHtml(contenu) : null;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// Les durées des pages vidéo sont au format ISO 8601 (« PT1M42S »).
function dureeIsoEnSecondes(iso: string | null): number | null {
  if (!iso) return null;
  const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, h, mn, s] = m;
  const total = Number(h ?? 0) * 3600 + Number(mn ?? 0) * 60 + Number(s ?? 0);
  return total > 0 ? total : null;
}

export async function GET(request: Request) {
  const brut = new URL(request.url).searchParams.get("url");
  if (!brut) {
    return NextResponse.json({ error: "Paramètre url manquant" }, { status: 400 });
  }

  let cible: URL;
  try {
    cible = new URL(brut);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }
  if (cible.protocol !== "https:" || HOTES_INTERNES.test(cible.hostname)) {
    return NextResponse.json({ error: "URL non autorisée" }, { status: 400 });
  }

  try {
    const reponse = await fetch(cible, {
      headers: {
        // Sans en-tête de navigateur, plusieurs sites renvoient une page vide.
        "User-Agent":
          "Mozilla/5.0 (compatible; PasseportSante/1.0; +https://lepasseportsante.fr)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
      // La vignette d'une vidéo ne change pas : on garde la réponse une journée.
      next: { revalidate: 86400 },
    });
    if (!reponse.ok) {
      return NextResponse.json({ error: "Page injoignable" }, { status: 502 });
    }

    const html = (await reponse.text()).slice(0, 400_000);
    const apercu: ApercuLien = {
      url: cible.toString(),
      titre: baliseMeta(html, "og:title") ?? html.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() ?? null,
      image: baliseMeta(html, "og:image"),
      description: baliseMeta(html, "og:description"),
      site: baliseMeta(html, "og:site_name") ?? cible.hostname.replace(/^www\./, ""),
      dureeSecondes: dureeIsoEnSecondes(
        baliseMeta(html, "og:video:duration") ??
          html.match(/"duration"\s*:\s*"(PT[^"]+)"/)?.[1] ??
          null,
      ),
    };

    return NextResponse.json(apercu, {
      headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({ error: "Lecture impossible" }, { status: 502 });
  }
}
