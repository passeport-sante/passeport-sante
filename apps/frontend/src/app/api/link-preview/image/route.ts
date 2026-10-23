import { NextResponse } from "next/server";

// Relais de vignette.
//
// Le lecteur vidéo du parcours ne charge jamais d'image depuis le site tiers :
// une miniature chargée par le navigateur de l'élève lui transmettrait déjà son
// adresse IP, avant tout consentement. On fait donc passer la vignette par
// notre serveur, qui est le seul à contacter le site d'origine.

const HOTES_INTERNES =
  /^(localhost$|127\.|10\.|192\.168\.|169\.254\.|\[?::1\]?$|172\.(1[6-9]|2\d|3[01])\.)/i;

const TYPES_AUTORISES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

export async function GET(request: Request) {
  const brut = new URL(request.url).searchParams.get("url");
  if (!brut) return new NextResponse("Paramètre url manquant", { status: 400 });

  let cible: URL;
  try {
    cible = new URL(brut);
  } catch {
    return new NextResponse("URL invalide", { status: 400 });
  }
  if (cible.protocol !== "https:" || HOTES_INTERNES.test(cible.hostname)) {
    return new NextResponse("URL non autorisée", { status: 400 });
  }

  try {
    const reponse = await fetch(cible, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PasseportSante/1.0)" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 86400 },
    });
    const type = reponse.headers.get("content-type")?.split(";")[0]?.trim() ?? "";
    if (!reponse.ok || !TYPES_AUTORISES.includes(type)) {
      return new NextResponse("Image indisponible", { status: 502 });
    }

    return new NextResponse(reponse.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Image indisponible", { status: 502 });
  }
}
