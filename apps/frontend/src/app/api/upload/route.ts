import { NextRequest, NextResponse } from "next/server";

/**
 * Relais d'upload d'images vers Cloudinary.
 *
 * L'upload direct navigateur → Cloudinary est bloqué par la CSP de production
 * (`connect-src 'self' …`), qui n'autorise pas api.cloudinary.com. On fait donc
 * transiter le fichier par cette route Next, servie sur la même origine, qui le
 * relaie côté serveur — les requêtes serveur ne sont pas soumises à la CSP du
 * navigateur. On garde le preset non signé : aucun secret n'est requis.
 */

const IMAGE_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/webp", "image/jpeg"];

export async function POST(req: NextRequest) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) {
    console.error("[upload] Variables NEXT_PUBLIC_CLOUDINARY_* manquantes");
    return NextResponse.json({ error: "Cloudinary n'est pas configuré" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté : utilisez un PNG, un JPEG ou un WebP." },
      { status: 400 },
    );
  }
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(1)} Mo). Maximum 8 Mo.` },
      { status: 400 },
    );
  }

  const upstream = new FormData();
  upstream.append("file", file);
  upstream.append("upload_preset", preset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: upstream,
    });
    if (!res.ok) {
      console.error("[upload] Cloudinary a répondu", res.status);
      return NextResponse.json({ error: "Échec de l'upload Cloudinary" }, { status: 502 });
    }
    const data = await res.json();
    if (!data.secure_url) {
      return NextResponse.json({ error: "Réponse Cloudinary inattendue" }, { status: 502 });
    }
    return NextResponse.json({ url: data.secure_url as string });
  } catch (err) {
    console.error("[upload] Erreur réseau vers Cloudinary :", err);
    return NextResponse.json({ error: "Échec de l'upload" }, { status: 502 });
  }
}
