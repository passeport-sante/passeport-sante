import { PrismaClient } from "@prisma/client";

// Catalogue initial des mascottes livrées dans public/assets/mascotte/.
// Référencées par nom de fichier (pas par URL Cloudinary) : le helper
// mascotteUrl() côté front gère les deux formats. Les mascottes ajoutées par
// les admins depuis le back-office arrivent ensuite avec une URL Cloudinary.
//
// Source unique de vérité — importée à la fois par le seed complet (seed.ts)
// et par le seed dédié (seed-mascottes.ts) pour éviter toute divergence.
export const BASE_MASCOTTES = [
  { label: "Mme Étoile", url: "Mme-etoile.png", order: 1 },
  { label: "Petit Savon", url: "Petit-savon.png", order: 2 },
  { label: "Butternut", url: "Butternut-mascotte.png", order: 3 },
  { label: "Bouclier", url: "mascotte-bouclier.png", order: 4 },
  { label: "Santé mentale", url: "Sante-mental.png", order: 5 },
  { label: "Système de santé", url: "mascotte-sys-sante.png", order: 6 },
  { label: "Empathie", url: "empathie-mascotte.png", order: 7 },
  { label: "Mascotte 1", url: "mascotte1.png", order: 8 },
  { label: "Mascotte 2", url: "mascote2.png", order: 9 },
  { label: "Mascotte 3", url: "mascotte3.png", order: 10 },
  { label: "Mascotte 4", url: "mascotte4.png", order: 11 },
  { label: "Mascotte 5", url: "mascotte5.png", order: 12 },
  { label: "Mascotte 6", url: "mascotte6.png", order: 13 },
];

/**
 * Insère (ou met à jour) les mascottes de base. Idempotent : upsert par `url`,
 * donc rejouable sans risque de doublon. Ne touche jamais aux mascottes
 * uploadées par les admins (URL différente).
 */
export async function seedMascottes(prisma: PrismaClient): Promise<number> {
  for (const m of BASE_MASCOTTES) {
    await prisma.mascotte.upsert({
      where: { url: m.url },
      update: { label: m.label, order: m.order },
      create: m,
    });
  }
  return BASE_MASCOTTES.length;
}
