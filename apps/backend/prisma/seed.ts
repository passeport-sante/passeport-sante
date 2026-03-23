import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Add your seed data here
  // Example:
  // const org = await prisma.organization.create({
  //   data: {
  //     name: 'Ecole Primaire de Test',
  //     description: 'Pour le developpement',
  //   },
  // });

  console.log('Seeding completed');
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
