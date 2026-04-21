import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Organisation ────────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: "seed-org-1" },
    update: {},
    create: {
      id: "seed-org-1",
      name: "Académie de Prévention",
      description: "Organisation de test pour le développement",
      logo: "https://placeholder.com/logo.png",
    },
  });
  console.log(" Organisation créée:", org.name);

  // ─── Utilisateurs ────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@prevention.com" },
    update: {},
    create: {
      email: "admin@prevention.com",
      name: "Admin Principal",
      password: await bcrypt.hash("Admin123!", 10),
      role: "ADMIN",
      organizationId: org.id,
    },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "formateur@prevention.com" },
    update: {},
    create: {
      email: "formateur@prevention.com",
      name: "Jean Dupont",
      password: await bcrypt.hash("Trainer123!", 10),
      role: "TRAINER",
      organizationId: org.id,
    },
  });
  console.log(" Utilisateurs créés:", admin.email, trainer.email);

  // ─── Catégories ───────────────────────────────────────────────────────────────
  const catSante = await prisma.category.upsert({
    where: { slug: "sante-bien-etre" },
    update: {},
    create: {
      id: "seed-cat-1",
      name: "Santé & Bien-être",
      slug: "sante-bien-etre",
      order: 1,
    },
  });

  const catNumerique = await prisma.category.upsert({
    where: { slug: "securite-numerique" },
    update: {},
    create: {
      id: "seed-cat-2",
      name: "Sécurité numérique",
      slug: "securite-numerique",
      order: 2,
    },
  });

  const catNutrition = await prisma.category.upsert({
    where: { slug: "alimentation-nutrition" },
    update: {},
    create: {
      id: "seed-cat-3",
      name: "Alimentation & Nutrition",
      slug: "alimentation-nutrition",
      order: 3,
    },
  });
  console.log(
    " Catégories créées:",
    catSante.name,
    catNumerique.name,
    catNutrition.name,
  );

  // ─── Modules ──────────────────────────────────────────────────────────────────
  const moduleVaccination = await prisma.module.upsert({
    where: { slug: "vaccination" },
    update: { colorPrimary: "#16A34A", colorSecondary: "#052e16" },
    create: {
      id: "seed-module-1",
      title: "Vaccination",
      description: "Comment ça marche ? Pour qui ? Quand ? Où ?",
      slug: "vaccination",
      duration: 20,
      isActive: true,
      mascotte: "mascotte1.png",
      colorPrimary: "#16A34A",
      colorSecondary: "#052e16",
      organizationId: org.id,
      categoryId: catSante.id,
    },
  });

  const moduleSommeil = await prisma.module.upsert({
    where: { slug: "sommeil" },
    update: { colorPrimary: "#7C3AED", colorSecondary: "#1e1b4b" },
    create: {
      id: "seed-module-2",
      title: "Sommeil",
      description:
        "Pourquoi bien dormir est essentiel à ta santé physique et mentale.",
      slug: "sommeil",
      duration: 15,
      isActive: true,
      mascotte: "Mme-etoile.png",
      colorPrimary: "#7C3AED",
      colorSecondary: "#1e1b4b",
      organizationId: org.id,
      categoryId: catSante.id,
    },
  });

  const moduleHygiene = await prisma.module.upsert({
    where: { slug: "hygiene-bucco" },
    update: { colorPrimary: "#0891B2", colorSecondary: "#0C2340" },
    create: {
      id: "seed-module-3",
      title: "Hygiène buco-dentaire",
      description:
        "Les bons gestes pour prendre soin de tes dents au quotidien.",
      slug: "hygiene-bucco",
      duration: 15,
      isActive: true,
      mascotte: "Petit-savon.png",
      colorPrimary: "#0891B2",
      colorSecondary: "#0C2340",
      organizationId: org.id,
      categoryId: catSante.id,
    },
  });

  const moduleCyber = await prisma.module.upsert({
    where: { slug: "cyberharcelement" },
    update: { colorPrimary: "#DB2777", colorSecondary: "#4a044e" },
    create: {
      id: "seed-module-4",
      title: "Cyberharcèlement",
      description:
        "Identifier, réagir et se protéger face au harcèlement en ligne.",
      slug: "cyberharcelement",
      duration: 25,
      isActive: true,
      mascotte: "empathie-mascotte.png",
      colorPrimary: "#DB2777",
      colorSecondary: "#4a044e",
      organizationId: org.id,
      categoryId: catNumerique.id,
    },
  });

  const moduleManger = await prisma.module.upsert({
    where: { slug: "bien-manger" },
    update: { colorPrimary: "#D97706", colorSecondary: "#14290A" },
    create: {
      id: "seed-module-5",
      title: "Bien manger",
      description: "Les bases d'une alimentation équilibrée adaptée à ton âge.",
      slug: "bien-manger",
      duration: 20,
      isActive: true,
      mascotte: "Butternut-mascotte.png",
      colorPrimary: "#D97706",
      colorSecondary: "#14290A",
      organizationId: org.id,
      categoryId: catNutrition.id,
    },
  });
  console.log(
    " Modules créés:",
    moduleVaccination.title,
    moduleSommeil.title,
    moduleHygiene.title,
    moduleCyber.title,
    moduleManger.title,
  );

  // ─── Steps (module vaccination) ───────────────────────────────────────────────
  const stepKanban = await prisma.step.upsert({
    where: { id: "seed-step-1" },
    update: {},
    create: {
      id: "seed-step-1",
      gameType: "KANBAN",
      order: 1,
      mascotteImage: "mascotte_happy.png",
      content: {
        title: "Trie les dangers",
        instructions: "Place chaque danger dans la bonne catégorie",
      },
      moduleId: moduleVaccination.id,
    },
  });

  const stepQuiz = await prisma.step.upsert({
    where: { id: "seed-step-2" },
    update: {},
    create: {
      id: "seed-step-2",
      gameType: "QUIZ",
      order: 2,
      mascotteImage: "mascotte_question.png",
      content: {
        title: "Quiz de prévention",
        instructions: "Réponds aux questions",
      },
      moduleId: moduleVaccination.id,
    },
  });

  await prisma.step.upsert({
    where: { id: "seed-step-3" },
    update: {},
    create: {
      id: "seed-step-3",
      gameType: "PUZZLE",
      order: 3,
      mascotteImage: "mascotte_puzzle.png",
      content: {
        title: "Reconstitue la scène",
        instructions: "Replace les éléments dans le bon ordre",
      },
      moduleId: moduleVaccination.id,
    },
  });
  console.log(" Steps créés: KANBAN, QUIZ, PUZZLE");

  // ─── Game Data ────────────────────────────────────────────────────────────────
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-1" },
    update: {},
    create: {
      id: "seed-gamedata-1",
      questionData: {
        items: [
          "Casque à vélo",
          "Téléphone en conduisant",
          "Ceinture de sécurité",
          "Vitesse excessive",
        ],
        categories: ["Sécurité", "Danger"],
      },
      correctAnswer: {
        "Casque à vélo": "Sécurité",
        "Téléphone en conduisant": "Danger",
        "Ceinture de sécurité": "Sécurité",
        "Vitesse excessive": "Danger",
      },
      hints: { hint1: "Pense à ce qui protège vs ce qui met en danger" },
      stepId: stepKanban.id,
    },
  });

  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-2" },
    update: {},
    create: {
      id: "seed-gamedata-2",
      questionData: {
        question: "À quelle distance doit-on se tenir derrière un cycliste ?",
        options: ["1 mètre", "3 mètres", "5 mètres", "10 mètres"],
      },
      correctAnswer: { answer: "1 mètre" },
      hints: { hint1: "Pense au temps de réaction" },
      stepId: stepQuiz.id,
    },
  });
  console.log(" Game data créée");

  // ─── Module Session ───────────────────────────────────────────────────────────
  const session = await prisma.moduleSession.upsert({
    where: { accessCode: "TEST2024" },
    update: {},
    create: {
      className: "CM2 - École Pasteur",
      accessCode: "TEST2024",
      accessUrl: "http://localhost:3000/session/TEST2024",
      isActive: true,
      moduleId: moduleVaccination.id,
      createdByUserId: trainer.id,
      organizationId: org.id,
    },
  });
  console.log(" Session créée avec le code:", session.accessCode);

  // ─── Guest Students ───────────────────────────────────────────────────────────
  const students = await Promise.all([
    prisma.guestStudent.upsert({
      where: { id: "seed-student-1" },
      update: {},
      create: {
        id: "seed-student-1",
        gender: "M",
        age: 10,
        sessionId: session.id,
      },
    }),
    prisma.guestStudent.upsert({
      where: { id: "seed-student-2" },
      update: {},
      create: {
        id: "seed-student-2",
        gender: "F",
        age: 11,
        sessionId: session.id,
      },
    }),
    prisma.guestStudent.upsert({
      where: { id: "seed-student-3" },
      update: {},
      create: {
        id: "seed-student-3",
        gender: "M",
        age: 10,
        sessionId: session.id,
      },
    }),
  ]);
  console.log(" Élèves créés:", students.length);

  // ─── Diagnostic Session ───────────────────────────────────────────────────────
  const diagSession = await prisma.diagnosticSession.upsert({
    where: { accessCode: "DIAG2024" },
    update: {},
    create: {
      className: "CM2 - École Pasteur",
      accessCode: "DIAG2024",
      accessUrl: "http://localhost:3000/diagnostic/DIAG2024",
      isActive: true,
      createdByUserId: trainer.id,
      organizationId: org.id,
    },
  });

  // ─── Diagnostic Questions ─────────────────────────────────────────────────────
  const diagnosticQuestions = [
    // ── Données personnelles ──────────────────────────────────────────────────
    {
      id: "dq-001",
      order: 1,
      questionText: "Es-tu ?",
      questionType: "MCQ",
      options: { choices: ["Une fille", "Un garçon"] },
      correctAnswer: null,
    },
    {
      id: "dq-002",
      order: 2,
      questionText: "Dans quelle classe es-tu ?",
      questionType: "MCQ",
      options: { choices: ["6ème", "5ème", "4ème", "3ème"] },
      correctAnswer: null,
    },
    {
      id: "dq-003",
      order: 3,
      questionText: "Dans quel établissement es-tu scolarisé(e) ?",
      questionType: "OPEN",
      options: null,
      correctAnswer: null,
    },
    // ── Sommeil ───────────────────────────────────────────────────────────────
    {
      id: "dq-004",
      order: 4,
      questionText: "À quelle heure te couches-tu en semaine ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Entre 20h-21h",
          "Entre 21h-22h",
          "Entre 22h-23h",
          "Après 23h",
        ],
      },
      correctAnswer: null,
    },
    {
      id: "dq-005",
      order: 5,
      questionText: "En moyenne combien d'heures dors-tu par nuit en semaine ?",
      questionType: "MCQ",
      options: { choices: ["Moins de 6h", "6h-8h", "8h-10h"] },
      correctAnswer: null,
    },
    {
      id: "dq-006",
      order: 6,
      questionText:
        "Y a-t-il des écrans dans ta chambre (téléphone, télévision, console de jeux…) ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-007",
      order: 7,
      questionText:
        "À ton avis, de combien d'heures de sommeil as-tu besoin par nuit ?",
      questionType: "MCQ",
      options: { choices: ["Entre 8 et 10h", "Entre 6 et 8h", "Moins de 6h"] },
      correctAnswer: { answer: "Entre 8 et 10h" },
    },
    {
      id: "dq-008",
      order: 8,
      questionText: "Ne pas être sur les écrans avant de dormir, tu essaies ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-009",
      order: 9,
      questionText:
        "Faire un temps calme (lecture, musique douce…) tu le fais ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-010",
      order: 10,
      questionText:
        "Faire ses devoirs au dernier moment avant d'aller se coucher ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Je pratique !", "Non !"] },
      correctAnswer: null,
    },
    {
      id: "dq-011",
      order: 11,
      questionText: "Jouer aux jeux vidéo avant de dormir ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-012",
      order: 12,
      questionText: "Se connecter aux réseaux sociaux avant de dormir ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-013",
      order: 13,
      questionText: "Fais-tu du sport ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-014",
      order: 14,
      questionText: "Une douche, tous les 2 jours au maximum ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-015",
      order: 15,
      questionText: "Grignoter des friandises avant de dormir ?",
      questionType: "MCQ",
      options: { choices: ["Ça m'arrive", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-016",
      order: 16,
      questionText: "Dîner après 21h ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-017",
      order: 17,
      questionText: "Dors-tu dans le calme ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-018",
      order: 18,
      questionText: "Vrai ou faux ? (Info / Intox sur le sommeil)",
      questionType: "CLASSIFY",
      options: {
        items: [
          {
            id: "c1",
            text: "Le sommeil n'a aucun impact sur la vie quotidienne",
          },
          { id: "c2", text: "Le sommeil favorise la croissance" },
          {
            id: "c3",
            text: "Le sommeil favorise la concentration en classe et sur le travail",
          },
          {
            id: "c4",
            text: "Trop dormir empêche de suivre l'actualité des réseaux sociaux",
          },
          { id: "c5", text: "Le sommeil permet d'être de bonne humeur" },
          { id: "c6", text: "Le sommeil permet d'éviter les conflits" },
          { id: "c7", text: "Trop dormir empêche d'être performant en sport" },
        ],
      },
      correctAnswer: {
        vrai: ["c2", "c3", "c5", "c6"],
        faux: ["c1", "c4", "c7"],
      },
    },
    // ── Alimentation ─────────────────────────────────────────────────────────
    {
      id: "dq-019",
      order: 19,
      questionText: "Combien de repas prends-tu par jour ?",
      questionType: "MCQ",
      options: { choices: ["Aucun", "1", "2", "3", "4", "4 ou plus"] },
      correctAnswer: null,
    },
    {
      id: "dq-020",
      order: 20,
      questionText: "Consommes-tu des sodas pendant la journée ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Pas tous les jours", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-021",
      order: 21,
      questionText: "Consommes-tu une fois par jour des légumes ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-022",
      order: 22,
      questionText:
        "Consommes-tu des sucreries, biscuits, chips pendant la journée ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Pas tous les jours", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-023",
      order: 23,
      questionText: "Consommes-tu une fois par jour des fruits ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-024",
      order: 24,
      questionText: "Combien de verres d'eau estimes-tu boire par jour ?",
      questionType: "MCQ",
      options: { choices: ["+5", "3-5", "1-3", "Aucun"] },
      correctAnswer: null,
    },
    {
      id: "dq-025",
      order: 25,
      questionText:
        "Combien de fois par semaine consommes-tu des repas de type fast food ?",
      questionType: "MCQ",
      options: { choices: ["Jamais", "1/semaine", "2/semaine", "+2/semaine"] },
      correctAnswer: null,
    },
    {
      id: "dq-026",
      order: 26,
      questionText:
        "Selon toi, combien de portions de fruits et légumes par jour devrais-tu consommer ?",
      questionType: "MCQ",
      options: { choices: ["1-3", "5", "Aucune"] },
      correctAnswer: { answer: "5" },
    },
    {
      id: "dq-027",
      order: 27,
      questionText:
        "Quelle quantité d'eau, selon toi, dois-tu consommer par jour ?",
      questionType: "MCQ",
      options: { choices: ["1 verre", "0.5L", "1L", "1.5L", "Aucune"] },
      correctAnswer: { answer: "1.5L" },
    },
    {
      id: "dq-028",
      order: 28,
      questionText: "Pour toi, qu'est-ce qu'un repas équilibré ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Il doit comporter les 7 familles d'aliments",
          "Il doit comporter uniquement des fruits et des légumes",
          "Il ne doit pas comporter de protéine (œuf, viande, poisson)",
        ],
      },
      correctAnswer: { answer: "Il doit comporter les 7 familles d'aliments" },
    },
    // ── Hygiène ───────────────────────────────────────────────────────────────
    {
      id: "dq-029",
      order: 29,
      questionText: "Combien de fois par semaine te laves-tu ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Tous les jours",
          "1 jour sur 2",
          "1 à 2 fois par semaine",
          "Jamais",
        ],
      },
      correctAnswer: null,
    },
    {
      id: "dq-030",
      order: 30,
      questionText: "Combien de fois par jour te laves-tu les dents ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Jamais",
          "De temps en temps quand j'y pense",
          "1/jour",
          "2/jour",
          "3/jour",
        ],
      },
      correctAnswer: { answer: "2/jour" },
    },
    {
      id: "dq-031",
      order: 31,
      questionText:
        "Selon toi, que se passe-t-il si on ne se brosse pas les dents tous les jours ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Il ne se passe rien",
          "On a mauvaise haleine",
          "On a des caries",
          "On risque de les perdre",
        ],
      },
      correctAnswer: {
        answers: [
          "On a mauvaise haleine",
          "On a des caries",
          "On risque de les perdre",
        ],
      },
    },
    {
      id: "dq-032",
      order: 32,
      questionText:
        "Selon toi, quelles sont les conséquences d'un manque d'hygiène ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "L'hygiène protège des maladies",
          "L'hygiène évite la transmission des virus",
          "L'hygiène a des effets négatifs sur mon rapport avec les autres",
          "L'hygiène peut provoquer des problèmes de santé",
        ],
      },
      correctAnswer: {
        answers: [
          "L'hygiène protège des maladies",
          "L'hygiène évite la transmission des virus",
          "L'hygiène a des effets négatifs sur mon rapport avec les autres",
          "L'hygiène peut provoquer des problèmes de santé",
        ],
      },
    },
    {
      id: "dq-033",
      order: 33,
      questionText: "Changes-tu de vêtements tous les jours ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    // ── Activité physique ─────────────────────────────────────────────────────
    {
      id: "dq-034",
      order: 34,
      questionText: "Pratiques-tu une activité physique en dehors du collège ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Quelquefois", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-035",
      order: 35,
      questionText: "Si oui, combien de fois par semaine ?",
      questionType: "MCQ",
      options: { choices: ["1 fois", "2 fois", "2 et +"] },
      correctAnswer: null,
    },
    {
      id: "dq-036",
      order: 36,
      questionText: "Quels sont les bienfaits d'une activité physique ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Aucune",
          "Allongement de l'espérance de vie",
          "Être de bonne humeur",
          "Éviter la prise de poids",
          "Cela permet d'avoir des copains",
          "Cela permet de ne pas trop manger",
        ],
      },
      correctAnswer: {
        answers: [
          "Allongement de l'espérance de vie",
          "Être de bonne humeur",
          "Éviter la prise de poids",
          "Cela permet d'avoir des copains",
        ],
      },
    },
    {
      id: "dq-037",
      order: 37,
      questionText:
        "Combien de temps faut-il faire de sport par semaine pour rester en forme ?",
      questionType: "MCQ",
      options: { choices: ["20 minutes", "1h", "2h"] },
      correctAnswer: { answer: "1h" },
    },
    // ── Santé / Vaccins / Addictions ──────────────────────────────────────────
    {
      id: "dq-038",
      order: 38,
      questionText:
        "Connais-tu les vaccinations importantes à effectuer entre 11 ans et 14 ans ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-039",
      order: 39,
      questionText:
        "Parmi ces vaccins, quels sont les deux importants entre 11 et 14 ans ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Grippe",
          "Covid",
          "Hépatite B",
          "Papillomavirus",
          "La rage",
          "Le VIH",
          "DTP et Coqueluche",
        ],
      },
      correctAnswer: { answers: ["Hépatite B", "Papillomavirus"] },
    },
    {
      id: "dq-040",
      order: 40,
      questionText: "As-tu déjà fumé ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Jamais",
          "Cigarettes",
          "Chicha",
          "Vapoteuse",
          "Puff",
          "Cannabis",
        ],
      },
      correctAnswer: null,
    },
    {
      id: "dq-041",
      order: 41,
      questionText: "As-tu déjà bu de l'alcool ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-042",
      order: 42,
      questionText: "Qu'est-ce qu'une addiction ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Une chose dont on ne peut pas se passer",
          "Je ne sais pas",
          "Une maladie",
          "Une bonne note",
        ],
      },
      correctAnswer: {
        answers: ["Une chose dont on ne peut pas se passer", "Une maladie"],
      },
    },
    {
      id: "dq-043",
      order: 43,
      questionText:
        "Quelles sont les conséquences de la cigarette, de la drogue, de l'alcool ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Aucune conséquence",
          "Apparition de maladies graves",
          "Être en forme",
          "Mieux dormir",
          "Être plus performant à l'école",
          "S'isoler, ne plus voir ses amis",
        ],
      },
      correctAnswer: {
        answers: [
          "Apparition de maladies graves",
          "S'isoler, ne plus voir ses amis",
        ],
      },
    },
    // ── Numérique ─────────────────────────────────────────────────────────────
    {
      id: "dq-044",
      order: 44,
      questionText: "Combien de temps passes-tu sur ton téléphone par jour ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Je n'en ai pas",
          "Entre 1h et 2h",
          "Entre 2h et 3h",
          "Plus de 3h",
          "Je ne peux pas l'utiliser en semaine",
        ],
      },
      correctAnswer: null,
    },
    {
      id: "dq-045",
      order: 45,
      questionText:
        "Que se passe-t-il si tu passes trop de temps sur les écrans ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Rien",
          "S'isoler, ne plus voir sa famille",
          "Avoir le sommeil perturbé",
          "Être de mauvaise humeur",
          "Mieux réussir à l'école",
        ],
      },
      correctAnswer: {
        answers: [
          "S'isoler, ne plus voir sa famille",
          "Avoir le sommeil perturbé",
          "Être de mauvaise humeur",
        ],
      },
    },
    {
      id: "dq-046",
      order: 46,
      questionText:
        "As-tu déjà vu des images ou des vidéos à caractère pornographique ?",
      questionType: "TRUE_FALSE",
      options: { choices: ["Oui", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-047",
      order: 47,
      questionText:
        "À quel âge, en France, avons-nous le droit de regarder des contenus à caractère pornographique ?",
      questionType: "MCQ",
      options: { choices: ["18 ans", "21 ans"] },
      correctAnswer: { answer: "18 ans" },
    },
    {
      id: "dq-048",
      order: 48,
      questionText:
        "Parmi ces dangers des réseaux sociaux, selon toi, quel est le plus grand ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Le cyber harcèlement",
          "Rencontrer des personnes malveillantes",
          "Trouver de fausses informations",
          "L'isolement social",
        ],
      },
      correctAnswer: null,
    },
    // ── Puberté ───────────────────────────────────────────────────────────────
    {
      id: "dq-049",
      order: 49,
      questionText:
        "Quels changements physiques ou psychologiques ont lieu au moment de la puberté chez les filles ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Apparition des règles",
          "Acné",
          "Production de spermatozoïdes",
          "Prise de poids et de taille",
          "Élargissement du bassin",
        ],
      },
      correctAnswer: {
        answers: [
          "Apparition des règles",
          "Acné",
          "Prise de poids et de taille",
          "Élargissement du bassin",
        ],
      },
    },
    {
      id: "dq-050",
      order: 50,
      questionText:
        "Quels changements physiques ou psychologiques ont lieu au moment de la puberté chez les garçons ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Développement de la poitrine",
          "Acné",
          "Mue de la voix",
          "Élargissement des épaules",
          "Prise de poids et de taille",
          "Libération de l'ovule",
        ],
      },
      correctAnswer: {
        answers: [
          "Acné",
          "Mue de la voix",
          "Élargissement des épaules",
          "Prise de poids et de taille",
        ],
      },
    },
    // ── Bien-être / Sécurité ──────────────────────────────────────────────────
    {
      id: "dq-051",
      order: 51,
      questionText: "Te sens-tu en sécurité au collège ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Pas toujours", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-052",
      order: 52,
      questionText: "Te sens-tu en sécurité chez toi ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Pas toujours", "Non"] },
      correctAnswer: null,
    },
    {
      id: "dq-053",
      order: 53,
      questionText:
        "Peux-tu te confier à quelqu'un lorsque tu te sens triste ou malheureux(se) ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Non", "Pas toujours"] },
      correctAnswer: null,
    },
    {
      id: "dq-054",
      order: 54,
      questionText: "Si oui, à qui peux-tu te confier ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Ta famille",
          "Tes amis",
          "Tes professeurs",
          "Le ou la CPE",
          "L'infirmière",
          "La psychologue de l'éducation nationale",
          "L'assistante sociale",
          "Les assistants d'éducation",
        ],
      },
      correctAnswer: null,
    },
    {
      id: "dq-055",
      order: 55,
      questionText: "As-tu des problèmes pour t'endormir ?",
      questionType: "MCQ",
      options: { choices: ["Non", "Parfois", "Oui"] },
      correctAnswer: null,
    },
    {
      id: "dq-056",
      order: 56,
      questionText: "Te sens-tu bien dans ton corps ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Non", "Parfois"] },
      correctAnswer: null,
    },
    {
      id: "dq-057",
      order: 57,
      questionText: "Te sens-tu gêné(e) par le regard des autres ?",
      questionType: "MCQ",
      options: { choices: ["Non", "Parfois", "Oui"] },
      correctAnswer: null,
    },
    {
      id: "dq-058",
      order: 58,
      questionText: "As-tu confiance en toi ?",
      questionType: "MCQ",
      options: { choices: ["Oui", "Non", "Parfois"] },
      correctAnswer: null,
    },
    // ── Valeurs / Connaissances ───────────────────────────────────────────────
    {
      id: "dq-059",
      order: 59,
      questionText: "Selon toi, qu'est-ce que le harcèlement ?",
      questionType: "MCQ",
      options: {
        choices: [
          "Une violence répétée qui peut être verbale, physique ou psychologique",
          "Une dispute entre son copain ou sa copine",
          "Une bagarre",
          "Je ne sais pas",
        ],
      },
      correctAnswer: {
        answer:
          "Une violence répétée qui peut être verbale, physique ou psychologique",
      },
    },
    {
      id: "dq-060",
      order: 60,
      questionText: "Pour toi, que signifie la notion de consentement ?",
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Je ne sais pas",
          "Que deux personnes soient d'accord pour décider ou faire quelque chose",
          "Être d'accord avec l'autre",
          "Ne pas forcer l'autre à faire quelque chose",
        ],
      },
      correctAnswer: {
        answers: [
          "Que deux personnes soient d'accord pour décider ou faire quelque chose",
          "Ne pas forcer l'autre à faire quelque chose",
        ],
      },
    },
    {
      id: "dq-061",
      order: 61,
      questionText: 'Pour toi, que signifie "être en bonne santé" ?',
      questionType: "MCQ_MULTI",
      options: {
        choices: [
          "Se faire soigner quand on est malade",
          "Ne pas tomber malade",
          "Prendre soin de sa santé régulièrement",
          "Avoir une bonne hygiène de vie (sport, alimentation…)",
        ],
      },
      correctAnswer: {
        answers: [
          "Prendre soin de sa santé régulièrement",
          "Avoir une bonne hygiène de vie (sport, alimentation…)",
        ],
      },
    },
  ];

  for (const q of diagnosticQuestions) {
    await prisma.diagnosticQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: q as any,
    });
  }
  console.log(` ${diagnosticQuestions.length} questions diagnostic créées`);

  console.log("\n🎉 Seeding terminé !");
  console.log("─────────────────────────────");
  console.log("Admin     :", admin.email, "/ Admin123!");
  console.log("Formateur :", trainer.email, "/ Trainer123!");
  console.log("Session   : code =", session.accessCode);
  console.log("Diagnostic: code =", diagSession.accessCode);
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
