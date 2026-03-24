import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Organisation ────────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: 'seed-org-1' },
    update: {},
    create: {
      id: 'seed-org-1',
      name: 'Académie de Prévention',
      description: 'Organisation de test pour le développement',
      logo: 'https://placeholder.com/logo.png',
    },
  });
  console.log('✅ Organisation créée:', org.name);

  // ─── Utilisateurs ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@prevention.com' },
    update: {},
    create: {
      email: 'admin@prevention.com',
      name: 'Admin Principal',
      password: await bcrypt.hash('Admin123!', 10),
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: 'formateur@prevention.com' },
    update: {},
    create: {
      email: 'formateur@prevention.com',
      name: 'Jean Dupont',
      password: await bcrypt.hash('Trainer123!', 10),
      role: 'TRAINER',
      organizationId: org.id,
    },
  });
  console.log('✅ Utilisateurs créés:', admin.email, trainer.email);

  // ─── Module ──────────────────────────────────────────────────────────────────
  const module = await prisma.module.upsert({
    where: { id: 'seed-module-1' },
    update: {},
    create: {
      id: 'seed-module-1',
      duration: 45,
      isActive: true,
      organizationId: org.id,
    },
  });
  console.log('✅ Module créé:', module.id);

  // ─── Steps ───────────────────────────────────────────────────────────────────
  const stepKanban = await prisma.step.upsert({
    where: { id: 'seed-step-1' },
    update: {},
    create: {
      id: 'seed-step-1',
      gameType: 'KANBAN',
      order: 1,
      mascotteImage: 'mascotte_happy.png',
      content: { title: 'Trie les dangers', instructions: 'Place chaque danger dans la bonne catégorie' },
      moduleId: module.id,
    },
  });

  const stepQuiz = await prisma.step.upsert({
    where: { id: 'seed-step-2' },
    update: {},
    create: {
      id: 'seed-step-2',
      gameType: 'QUIZ',
      order: 2,
      mascotteImage: 'mascotte_question.png',
      content: { title: 'Quiz de prévention', instructions: 'Réponds aux questions' },
      moduleId: module.id,
    },
  });

  const stepPuzzle = await prisma.step.upsert({
    where: { id: 'seed-step-3' },
    update: {},
    create: {
      id: 'seed-step-3',
      gameType: 'PUZZLE',
      order: 3,
      mascotteImage: 'mascotte_puzzle.png',
      content: { title: 'Reconstitue la scène', instructions: 'Replace les éléments dans le bon ordre' },
      moduleId: module.id,
    },
  });
  console.log('✅ Steps créés: KANBAN, QUIZ, PUZZLE');

  // ─── Game Data ────────────────────────────────────────────────────────────────
  await prisma.gameData.upsert({
    where: { id: 'seed-gamedata-1' },
    update: {},
    create: {
      id: 'seed-gamedata-1',
      questionData: {
        items: ['Casque à vélo', 'Téléphone en conduisant', 'Ceinture de sécurité', 'Vitesse excessive'],
        categories: ['Sécurité', 'Danger'],
      },
      correctAnswer: {
        'Casque à vélo': 'Sécurité',
        'Téléphone en conduisant': 'Danger',
        'Ceinture de sécurité': 'Sécurité',
        'Vitesse excessive': 'Danger',
      },
      hints: { hint1: 'Pense à ce qui protège vs ce qui met en danger' },
      stepId: stepKanban.id,
    },
  });

  await prisma.gameData.upsert({
    where: { id: 'seed-gamedata-2' },
    update: {},
    create: {
      id: 'seed-gamedata-2',
      questionData: {
        question: 'À quelle distance doit-on se tenir derrière un cycliste ?',
        options: ['1 mètre', '3 mètres', '5 mètres', '10 mètres'],
      },
      correctAnswer: { answer: '1 mètre' },
      hints: { hint1: 'Pense au temps de réaction' },
      stepId: stepQuiz.id,
    },
  });
  console.log('✅ Game data créée');

  // ─── Module Session ───────────────────────────────────────────────────────────
  const session = await prisma.moduleSession.upsert({
    where: { accessCode: 'TEST2024' },
    update: {},
    create: {
      className: 'CM2 - École Pasteur',
      accessCode: 'TEST2024',
      accessUrl: 'http://localhost:3000/session/TEST2024',
      isActive: true,
      moduleId: module.id,
      createdByUserId: trainer.id,
      organizationId: org.id,
    },
  });
  console.log('✅ Session créée avec le code:', session.accessCode);

  // ─── Guest Students ───────────────────────────────────────────────────────────
  const students = await Promise.all([
    prisma.guestStudent.upsert({
      where: { id: 'seed-student-1' },
      update: {},
      create: { id: 'seed-student-1', gender: 'M', age: 10, sessionId: session.id },
    }),
    prisma.guestStudent.upsert({
      where: { id: 'seed-student-2' },
      update: {},
      create: { id: 'seed-student-2', gender: 'F', age: 11, sessionId: session.id },
    }),
    prisma.guestStudent.upsert({
      where: { id: 'seed-student-3' },
      update: {},
      create: { id: 'seed-student-3', gender: 'M', age: 10, sessionId: session.id },
    }),
  ]);
  console.log('✅ Élèves créés:', students.length);

  // ─── Diagnostic Session ───────────────────────────────────────────────────────
  const diagSession = await prisma.diagnosticSession.upsert({
    where: { accessCode: 'DIAG2024' },
    update: {},
    create: {
      className: 'CM2 - École Pasteur',
      accessCode: 'DIAG2024',
      accessUrl: 'http://localhost:3000/diagnostic/DIAG2024',
      isActive: true,
      createdByUserId: trainer.id,
      organizationId: org.id,
    },
  });

  // ─── Diagnostic Questions ─────────────────────────────────────────────────────
  await prisma.diagnosticQuestion.upsert({
    where: { id: 'seed-question-1' },
    update: {},
    create: {
      id: 'seed-question-1',
      questionText: 'Que doit-on porter obligatoirement à vélo ?',
      questionType: 'MCQ',
      options: { choices: ['Un casque', 'Des gants', 'Un gilet', 'Des lunettes'] },
      correctAnswer: { answer: 'Un casque' },
      order: 1,
    },
  });

  await prisma.diagnosticQuestion.upsert({
    where: { id: 'seed-question-2' },
    update: {},
    create: {
      id: 'seed-question-2',
      questionText: 'Peut-on traverser au feu rouge pour piéton ?',
      questionType: 'TRUE_FALSE',
      options: { choices: ['Vrai', 'Faux'] },
      correctAnswer: { answer: 'Faux' },
      order: 2,
    },
  });
  console.log('✅ Questions diagnostic créées');

  console.log('\n🎉 Seeding terminé !');
  console.log('─────────────────────────────');
  console.log('Admin     :', admin.email, '/ Admin123!');
  console.log('Formateur :', trainer.email, '/ Trainer123!');
  console.log('Session   : code =', session.accessCode);
  console.log('Diagnostic: code =', diagSession.accessCode);
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
