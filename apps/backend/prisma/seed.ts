import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { seedMascottes } from "./mascottes";

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
      color: "#16A34A",
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
      color: "#DB2777",
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
      color: "#D97706",
      order: 3,
    },
  });
  console.log(
    " Catégories créées:",
    catSante.name,
    catNumerique.name,
    catNutrition.name,
  );

  // ─── Mascottes ────────────────────────────────────────────────────────────────
  // Catalogue initial des visuels livrés dans public/assets/mascotte/.
  // La liste vit dans prisma/mascottes.ts (source unique), aussi utilisée par le
  // seed dédié prisma/seed-mascottes.ts pour peupler la prod sans re-seeder tout.
  const mascottesCount = await seedMascottes(prisma);
  console.log(` ${mascottesCount} mascottes créées`);

  // ─── Modules ──────────────────────────────────────────────────────────────────
  const moduleVaccination = await prisma.module.upsert({
    where: { slug: "vaccination" },
    update: { colorPrimary: "#1618a3", colorSecondary: "#c9ae15" },
    create: {
      id: "seed-module-1",
      title: "Vaccination",
      description: "Comment ça marche ? Pour qui ? Quand ? Où ?",
      slug: "vaccination",
      duration: 20,
      isActive: true,
      mascotte: "mascotte5.png",
      colorPrimary: "#1618a3",
      colorSecondary: "#c9ae15",
      colorCard: "#f7fcdc",
      colorCardSecondary: "#f1f7bb",
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
      colorCard: "#f9f5ff",
      colorCardSecondary: "#f3e8ff",
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
      colorCard: "#e0f7fa",
      colorCardSecondary: "#b2ebf2",
      organizationId: org.id,
      categoryId: catSante.id,
    },
  });

  const moduleCyber = await prisma.module.upsert({
    where: { slug: "ecrans" },
    update: { colorPrimary: "#DB2777", colorSecondary: "#4a044e" },
    create: {
      id: "seed-module-4",
      title: "Ecrans",
      description:
        "Identifier, réagir et se protéger face au harcèlement en ligne.",
      slug: "ecrans",
      duration: 25,
      isActive: true,
      mascotte: "mascotte6.png",
      colorPrimary: "#DB2777",
      colorSecondary: "#4a044e",
      colorCard: "#fce7f3",
      colorCardSecondary: "#fbcfe8",
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
      colorCard: "#ffedd5",
      colorCardSecondary: "#fed7aa",
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
    update: {
      gameType: "KANBAN",
      order: 1,
      content: {
        title: "Vrai ou Intox ?",
        instructions: "Classe chaque affirmation dans la bonne catégorie",
      },
    },
    create: {
      id: "seed-step-1",
      gameType: "KANBAN",
      order: 1,
      mascotteImage: "mascotte5.png",
      content: {
        title: "Vrai ou Intox ?",
        instructions: "Classe chaque affirmation dans la bonne catégorie",
      },
      moduleId: moduleVaccination.id,
    },
  });

  const stepPhraseATrou = await prisma.step.upsert({
    where: { id: "seed-step-2" },
    update: {
      gameType: "PHRASE_A_TROU",
      order: 2,
      content: {
        title: "Le calendrier vaccinal",
        instructions: "Complète les phrases avec les bons mots",
      },
    },
    create: {
      id: "seed-step-2",
      gameType: "PHRASE_A_TROU",
      order: 2,
      mascotteImage: "mascotte5.png",
      content: {
        title: "Le calendrier vaccinal",
        instructions: "Complète les phrases avec les bons mots",
      },
      moduleId: moduleVaccination.id,
    },
  });

  const stepPuzzle = await prisma.step.upsert({
    where: { id: "seed-step-3" },
    update: {
      gameType: "PUZZLE",
      order: 3,
      content: {
        title: "Dans le bon ordre !",
        instructions:
          "Replace les étapes d'une vaccination dans l'ordre correct",
      },
    },
    create: {
      id: "seed-step-3",
      gameType: "PUZZLE",
      order: 3,
      mascotteImage: "mascotte5.png",
      content: {
        title: "Dans le bon ordre !",
        instructions:
          "Replace les étapes d'une vaccination dans l'ordre correct",
      },
      moduleId: moduleVaccination.id,
    },
  });

  await prisma.step.upsert({
    where: { id: "seed-step-4" },
    update: {
      gameType: "SCENARIO",
      order: 4,
      content: {
        title: "Que ferais-tu ?",
        instructions: "Choisis la meilleure réaction face à cette situation",
      },
    },
    create: {
      id: "seed-step-4",
      gameType: "SCENARIO",
      order: 4,
      mascotteImage: "mascotte5.png",
      content: {
        title: "Que ferais-tu ?",
        instructions: "Choisis la meilleure réaction face à cette situation",
      },
      moduleId: moduleVaccination.id,
    },
  });

  await prisma.step.upsert({
    where: { id: "seed-step-5" },
    update: {
      gameType: "QUIZ",
      order: 5,
      content: {
        title: "Quiz final",
        instructions: "Teste toutes tes connaissances sur la vaccination",
      },
    },
    create: {
      id: "seed-step-5",
      gameType: "QUIZ",
      order: 5,
      mascotteImage: "mascotte5.png",
      content: {
        title: "Quiz final",
        instructions: "Teste toutes tes connaissances sur la vaccination",
      },
      moduleId: moduleVaccination.id,
    },
  });
  console.log(" Steps créés: KANBAN, PHRASE_A_TROU, PUZZLE, SCENARIO, QUIZ");

  // ─── Game Data ────────────────────────────────────────────────────────────────

  // Step 1 — Kanban : Vrai ou Intox sur la vaccination
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-1" },
    update: {
      questionData: {
        items: [
          "Les vaccins protègent toute la communauté",
          "Un vaccin peut donner la maladie",
          "Le vaccin HPV concerne filles et garçons",
          "Seuls les bébés ont besoin de vaccins",
          "La polio a été éradiquée grâce aux vaccins",
          "Les vaccins sont inutiles si on est en bonne santé",
        ],
        categories: ["Vrai", "Intox"],
      },
      correctAnswer: {
        "Les vaccins protègent toute la communauté": "Vrai",
        "Un vaccin peut donner la maladie": "Intox",
        "Le vaccin HPV concerne filles et garçons": "Vrai",
        "Seuls les bébés ont besoin de vaccins": "Intox",
        "La polio a été éradiquée grâce aux vaccins": "Vrai",
        "Les vaccins sont inutiles si on est en bonne santé": "Intox",
      },
    },
    create: {
      id: "seed-gamedata-1",
      questionData: {
        items: [
          "Les vaccins protègent toute la communauté",
          "Un vaccin peut donner la maladie",
          "Le vaccin HPV concerne filles et garçons",
          "Seuls les bébés ont besoin de vaccins",
          "La polio a été éradiquée grâce aux vaccins",
          "Les vaccins sont inutiles si on est en bonne santé",
        ],
        categories: ["Vrai", "Intox"],
      },
      correctAnswer: {
        "Les vaccins protègent toute la communauté": "Vrai",
        "Un vaccin peut donner la maladie": "Intox",
        "Le vaccin HPV concerne filles et garçons": "Vrai",
        "Seuls les bébés ont besoin de vaccins": "Intox",
        "La polio a été éradiquée grâce aux vaccins": "Vrai",
        "Les vaccins sont inutiles si on est en bonne santé": "Intox",
      },
      stepId: stepKanban.id,
    },
  });

  // Step 2 — Phrase à trou : Le calendrier vaccinal
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-2" },
    update: {
      questionData: {
        phrase:
          "Le vaccin contre le Papillomavirus est recommandé pour les ___ et les ___, entre ___ et ___ ans.",
        options: ["filles", "garçons", "11", "14", "6", "18"],
      },
      correctAnswer: { blanks: ["filles", "garçons", "11", "14"] },
    },
    create: {
      id: "seed-gamedata-2",
      questionData: {
        phrase:
          "Le vaccin contre le Papillomavirus est recommandé pour les ___ et les ___, entre ___ et ___ ans.",
        options: ["filles", "garçons", "11", "14", "6", "18"],
      },
      correctAnswer: { blanks: ["filles", "garçons", "11", "14"] },
      stepId: stepPhraseATrou.id,
    },
  });

  // Step 3 — Puzzle #1 : Ordre des étapes d'une vaccination
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-3" },
    update: {
      questionData: {
        title: "Reconstitue l'ordre des étapes d'une vaccination",
        items: [
          { id: "a", text: "Le médecin vérifie ton carnet de santé" },
          { id: "b", text: "Tu reçois l'injection du vaccin" },
          { id: "c", text: "Tu prends rendez-vous chez le médecin" },
          {
            id: "d",
            text: "Tu patientes 15 min pour surveiller les réactions",
          },
        ],
      },
      correctAnswer: { order: ["c", "a", "b", "d"] },
    },
    create: {
      id: "seed-gamedata-3",
      questionData: {
        title: "Reconstitue l'ordre des étapes d'une vaccination",
        items: [
          { id: "a", text: "Le médecin vérifie ton carnet de santé" },
          { id: "b", text: "Tu reçois l'injection du vaccin" },
          { id: "c", text: "Tu prends rendez-vous chez le médecin" },
          {
            id: "d",
            text: "Tu patientes 15 min pour surveiller les réactions",
          },
        ],
      },
      correctAnswer: { order: ["c", "a", "b", "d"] },
      stepId: stepPuzzle.id,
    },
  });

  // Step 4 — Scénario : Mon ami pense que le HPV ne concerne pas les garçons
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-4" },
    update: {
      questionData: {
        situation:
          "Ton ami pense que le vaccin contre le Papillomavirus n'est que pour les filles et qu'en tant que garçon, il n'en a pas besoin. Que lui réponds-tu ?",
        choices: [
          { id: "a", text: "Tu as raison, ce vaccin est réservé aux filles." },
          {
            id: "b",
            text: "Le HPV concerne tout le monde. Les garçons aussi peuvent contracter et transmettre le virus.",
          },
          { id: "c", text: "De toute façon, les vaccins ne servent à rien." },
          {
            id: "d",
            text: "Tu peux attendre d'avoir 18 ans pour en parler à ton médecin.",
          },
        ],
      },
      correctAnswer: {
        choiceId: "b",
        explanation:
          "Depuis 2023, le vaccin HPV est recommandé pour les filles ET les garçons entre 11 et 14 ans. Les garçons peuvent contracter le Papillomavirus et le transmettre, la vaccination les protège aussi.",
      },
    },
    create: {
      id: "seed-gamedata-4",
      questionData: {
        situation:
          "Ton ami pense que le vaccin contre le Papillomavirus n'est que pour les filles et qu'en tant que garçon, il n'en a pas besoin. Que lui réponds-tu ?",
        choices: [
          { id: "a", text: "Tu as raison, ce vaccin est réservé aux filles." },
          {
            id: "b",
            text: "Le HPV concerne tout le monde. Les garçons aussi peuvent contracter et transmettre le virus.",
          },
          { id: "c", text: "De toute façon, les vaccins ne servent à rien." },
          {
            id: "d",
            text: "Tu peux attendre d'avoir 18 ans pour en parler à ton médecin.",
          },
        ],
      },
      correctAnswer: {
        choiceId: "b",
        explanation:
          "Depuis 2023, le vaccin HPV est recommandé pour les filles ET les garçons entre 11 et 14 ans. Les garçons peuvent contracter le Papillomavirus et le transmettre, la vaccination les protège aussi.",
      },
      stepId: "seed-step-4",
    },
  });

  // Step 2 — Phrase à trou #2 : La polio
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-2b" },
    update: {
      questionData: {
        phrase: "En ___, la poliomyélite a été déclarée éradiquée en ___.",
        options: ["2002", "1995", "Europe", "France", "2010", "Afrique"],
      },
      correctAnswer: { blanks: ["2002", "Europe"] },
    },
    create: {
      id: "seed-gamedata-2b",
      questionData: {
        phrase: "En ___, la poliomyélite a été déclarée éradiquée en ___.",
        options: ["2002", "1995", "Europe", "France", "2010", "Afrique"],
      },
      correctAnswer: { blanks: ["2002", "Europe"] },
      stepId: stepPhraseATrou.id,
    },
  });

  // Step 2 — Phrase à trou #3 : Les trois vaccins 11-14 ans
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-2c" },
    update: {
      questionData: {
        phrase:
          "Entre 11 et 14 ans, les trois vaccins recommandés sont le ___, les ___ et le ___.",
        options: [
          "DTP",
          "méningocoques C",
          "HPV",
          "grippe",
          "hépatite B",
          "rage",
        ],
      },
      correctAnswer: { blanks: ["DTP", "méningocoques C", "HPV"] },
    },
    create: {
      id: "seed-gamedata-2c",
      questionData: {
        phrase:
          "Entre 11 et 14 ans, les trois vaccins recommandés sont le ___, les ___ et le ___.",
        options: [
          "DTP",
          "méningocoques C",
          "HPV",
          "grippe",
          "hépatite B",
          "rage",
        ],
      },
      correctAnswer: { blanks: ["DTP", "méningocoques C", "HPV"] },
      stepId: stepPhraseATrou.id,
    },
  });

  // Step 3 — Puzzle #2 : Comment agit un vaccin dans le corps
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-3b" },
    update: {
      questionData: {
        title: "Comment agit un vaccin dans ton corps ?",
        items: [
          {
            id: "a",
            text: "Le vaccin introduit une forme inoffensive de l'agent pathogène",
          },
          {
            id: "b",
            text: "Ton système immunitaire détecte l'agent et fabrique des anticorps",
          },
          {
            id: "c",
            text: "Les anticorps restent dans ta mémoire immunitaire",
          },
          { id: "d", text: "Si le vrai virus arrive un jour, tu es protégé !" },
        ],
      },
      correctAnswer: { order: ["a", "b", "c", "d"] },
    },
    create: {
      id: "seed-gamedata-3b",
      questionData: {
        title: "Comment agit un vaccin dans ton corps ?",
        items: [
          {
            id: "a",
            text: "Le vaccin introduit une forme inoffensive de l'agent pathogène",
          },
          {
            id: "b",
            text: "Ton système immunitaire détecte l'agent et fabrique des anticorps",
          },
          {
            id: "c",
            text: "Les anticorps restent dans ta mémoire immunitaire",
          },
          { id: "d", text: "Si le vrai virus arrive un jour, tu es protégé !" },
        ],
      },
      correctAnswer: { order: ["a", "b", "c", "d"] },
      stepId: stepPuzzle.id,
    },
  });

  // Step 4 — Scénario #2 : petite sœur qui a peur de la piqûre
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-4b" },
    update: {
      questionData: {
        situation:
          "Ta petite sœur de 12 ans doit recevoir son vaccin contre les méningocoques mais elle a très peur de la piqûre et refuse d'y aller. Qu'est-ce que tu lui dis ?",
        choices: [
          {
            id: "a",
            text: "C'est pas grave, tu n'es pas obligée de te vacciner.",
          },
          {
            id: "b",
            text: "La piqûre fait un peu mal mais c'est rapide. Ce vaccin te protège d'une maladie grave qui peut être mortelle.",
          },
          {
            id: "c",
            text: "Les vaccins c'est pour les bébés, à ton âge t'en as plus besoin.",
          },
          {
            id: "d",
            text: "Tu peux attendre d'être grande pour décider toi-même.",
          },
        ],
      },
      correctAnswer: {
        choiceId: "b",
        explanation:
          "La méningite à méningocoque C peut être très grave, voire mortelle. Le vaccin reste la meilleure protection. La piqûre ne dure qu'un instant et vaut vraiment la peine !",
      },
    },
    create: {
      id: "seed-gamedata-4b",
      questionData: {
        situation:
          "Ta petite sœur de 12 ans doit recevoir son vaccin contre les méningocoques mais elle a très peur de la piqûre et refuse d'y aller. Qu'est-ce que tu lui dis ?",
        choices: [
          {
            id: "a",
            text: "C'est pas grave, tu n'es pas obligée de te vacciner.",
          },
          {
            id: "b",
            text: "La piqûre fait un peu mal mais c'est rapide. Ce vaccin te protège d'une maladie grave qui peut être mortelle.",
          },
          {
            id: "c",
            text: "Les vaccins c'est pour les bébés, à ton âge t'en as plus besoin.",
          },
          {
            id: "d",
            text: "Tu peux attendre d'être grande pour décider toi-même.",
          },
        ],
      },
      correctAnswer: {
        choiceId: "b",
        explanation:
          "La méningite à méningocoque C peut être très grave, voire mortelle. Le vaccin reste la meilleure protection. La piqûre ne dure qu'un instant et vaut vraiment la peine !",
      },
      stepId: "seed-step-4",
    },
  });

  // Step 5 — Quiz final (5 questions)
  await prisma.gameData.upsert({
    where: { id: "seed-gamedata-5" },
    update: {
      questionData: {
        questions: [
          {
            id: "q1",
            text: "Qu'est-ce qu'un vaccin ?",
            options: [
              {
                id: "a",
                text: "Un médicament qui guérit les maladies déjà contractées",
              },
              {
                id: "b",
                text: "Une préparation qui entraîne le système immunitaire à reconnaître un agent pathogène",
              },
              {
                id: "c",
                text: "Un complément alimentaire pour booster ses défenses",
              },
              {
                id: "d",
                text: "Un traitement uniquement réservé aux personnes malades",
              },
            ],
            explanation:
              "Un vaccin prépare ton système immunitaire à reconnaître et combattre un agent pathogène, sans te rendre malade.",
          },
          {
            id: "q2",
            text: "En 2002, quelle maladie a été éradiquée en Europe grâce aux vaccins ?",
            options: [
              { id: "a", text: "La grippe" },
              { id: "b", text: "La varicelle" },
              { id: "c", text: "La poliomyélite (polio)" },
              { id: "d", text: "La rougeole" },
            ],
            explanation:
              "La poliomyélite a été déclarée éradiquée en Europe en 2002 grâce à la vaccination massive mise en place depuis les années 1950.",
          },
          {
            id: "q3",
            text: "Quels vaccins sont recommandés entre 11 et 14 ans ?",
            options: [
              { id: "a", text: "Grippe, rage et hépatite A" },
              { id: "b", text: "DTP, méningocoques C et HPV" },
              { id: "c", text: "Aucun vaccin à cet âge" },
              { id: "d", text: "Seulement le vaccin contre la varicelle" },
            ],
            explanation:
              "Entre 11 et 14 ans, le calendrier vaccinal recommande le rappel DTP (diphtérie, tétanos, polio), le vaccin méningocoques C et le vaccin HPV.",
          },
          {
            id: "q4",
            text: "Qui doit se faire vacciner contre le Papillomavirus (HPV) ?",
            options: [
              { id: "a", text: "Uniquement les filles" },
              { id: "b", text: "Uniquement les garçons" },
              { id: "c", text: "Les filles et les garçons" },
              { id: "d", text: "Personne avant 18 ans" },
            ],
            explanation:
              "Depuis 2023, la vaccination HPV est recommandée pour tous — filles et garçons — entre 11 et 14 ans, car le virus peut toucher et se transmettre par les deux.",
          },
          {
            id: "q5",
            text: "Où peut-on se faire vacciner ?",
            options: [
              { id: "a", text: "Uniquement à l'hôpital" },
              {
                id: "b",
                text: "Chez le médecin, en pharmacie, à l'infirmerie du collège ou avec l'infirmière scolaire",
              },
              {
                id: "c",
                text: "Seulement dans un laboratoire d'analyses médicales",
              },
              {
                id: "d",
                text: "Nulle part avant 18 ans sans accord des parents",
              },
            ],
            explanation:
              "La vaccination est accessible dans de nombreux endroits : chez le médecin généraliste, en pharmacie, à l'infirmerie du collège et auprès de l'infirmière scolaire.",
          },
        ],
      },
      correctAnswer: {
        answers: { q1: "b", q2: "c", q3: "b", q4: "c", q5: "b" },
      },
    },
    create: {
      id: "seed-gamedata-5",
      questionData: {
        questions: [
          {
            id: "q1",
            text: "Qu'est-ce qu'un vaccin ?",
            options: [
              {
                id: "a",
                text: "Un médicament qui guérit les maladies déjà contractées",
              },
              {
                id: "b",
                text: "Une préparation qui entraîne le système immunitaire à reconnaître un agent pathogène",
              },
              {
                id: "c",
                text: "Un complément alimentaire pour booster ses défenses",
              },
              {
                id: "d",
                text: "Un traitement uniquement réservé aux personnes malades",
              },
            ],
            explanation:
              "Un vaccin prépare ton système immunitaire à reconnaître et combattre un agent pathogène, sans te rendre malade.",
          },
          {
            id: "q2",
            text: "En 2002, quelle maladie a été éradiquée en Europe grâce aux vaccins ?",
            options: [
              { id: "a", text: "La grippe" },
              { id: "b", text: "La varicelle" },
              { id: "c", text: "La poliomyélite (polio)" },
              { id: "d", text: "La rougeole" },
            ],
            explanation:
              "La poliomyélite a été déclarée éradiquée en Europe en 2002 grâce à la vaccination massive mise en place depuis les années 1950.",
          },
          {
            id: "q3",
            text: "Quels vaccins sont recommandés entre 11 et 14 ans ?",
            options: [
              { id: "a", text: "Grippe, rage et hépatite A" },
              { id: "b", text: "DTP, méningocoques C et HPV" },
              { id: "c", text: "Aucun vaccin à cet âge" },
              { id: "d", text: "Seulement le vaccin contre la varicelle" },
            ],
            explanation:
              "Entre 11 et 14 ans, le calendrier vaccinal recommande le rappel DTP (diphtérie, tétanos, polio), le vaccin méningocoques C et le vaccin HPV.",
          },
          {
            id: "q4",
            text: "Qui doit se faire vacciner contre le Papillomavirus (HPV) ?",
            options: [
              { id: "a", text: "Uniquement les filles" },
              { id: "b", text: "Uniquement les garçons" },
              { id: "c", text: "Les filles et les garçons" },
              { id: "d", text: "Personne avant 18 ans" },
            ],
            explanation:
              "Depuis 2023, la vaccination HPV est recommandée pour tous — filles et garçons — entre 11 et 14 ans, car le virus peut toucher et se transmettre par les deux.",
          },
          {
            id: "q5",
            text: "Où peut-on se faire vacciner ?",
            options: [
              { id: "a", text: "Uniquement à l'hôpital" },
              {
                id: "b",
                text: "Chez le médecin, en pharmacie, à l'infirmerie du collège ou avec l'infirmière scolaire",
              },
              {
                id: "c",
                text: "Seulement dans un laboratoire d'analyses médicales",
              },
              {
                id: "d",
                text: "Nulle part avant 18 ans sans accord des parents",
              },
            ],
            explanation:
              "La vaccination est accessible dans de nombreux endroits : chez le médecin généraliste, en pharmacie, à l'infirmerie du collège et auprès de l'infirmière scolaire.",
          },
        ],
      },
      correctAnswer: {
        answers: { q1: "b", q2: "c", q3: "b", q4: "c", q5: "b" },
      },
      stepId: "seed-step-5",
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

  console.log("\n Seeding terminé !");
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
