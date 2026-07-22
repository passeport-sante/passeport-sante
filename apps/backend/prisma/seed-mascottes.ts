import { PrismaClient } from "@prisma/client";
import { seedMascottes } from "./mascottes";

// Seed dédié aux mascottes de base, sans toucher au reste des données.
// À lancer en prod après une migration pour peupler le catalogue :
//   ./node_modules/.bin/ts-node prisma/seed-mascottes.ts
// Idempotent : rejouable à chaque déploiement sans effet de bord.
const prisma = new PrismaClient();

async function main() {
  const count = await seedMascottes(prisma);
  console.log(`✅ ${count} mascottes de base insérées / mises à jour.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
