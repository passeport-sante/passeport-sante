# Module Vaccination — Contenu détaillé des 5 steps

> Document de cadrage **contenu uniquement**. Aucune ligne de code n'est modifiée ici.
> Il décrit, pour chacun des 5 steps, le jeu choisi, le mapping avec le texte source, et les données exactes (items, bonnes réponses, explications) prêtes à être reportées dans le seed / l'éditeur.

## Vue d'ensemble

5 sections du texte = 5 steps = 5 mini-jeux (chacun utilisé une fois). Ordre pédagogique : **comprendre → déconstruire → mémoriser → appliquer → valider**.

| Step | Section du texte | Jeu (`GameType`) | Intention |
|------|------------------|------------------|-----------|
| 1 | Qu'est-ce que la vaccination ? | `PUZZLE` | Comprendre le mécanisme (noob → warrior) |
| 2 | Pourquoi se faire vacciner ? | `KANBAN` | Déconstruire les idées reçues (Vrai / Intox) |
| 3 | Quels vaccins entre 11 et 14 ans ? | `PHRASE_A_TROU` | Mémoriser le calendrier vaccinal |
| 4 | C'est quoi le papillomavirus ? | `SCENARIO` | Appliquer en situation réelle (HPV) |
| 5 | Questionnaire final | `QUIZ` | Valider tous les acquis |

Formats `content` / `questionData` / `correctAnswer` repris tels qu'attendus par le seed existant.

---

## Step 1 — `PUZZLE` · Qu'est-ce que la vaccination ?

**Source** : section 1 — « Un vaccin, c'est quoi ? » + l'aside « Concrètement, comment ça marche ? » (version *noob* → version *warrior*).

**Pourquoi un puzzle** : le mécanisme immunitaire est une **suite logique d'étapes**. Le joueur reconstitue comment le corps apprend à se défendre. C'est plus parlant qu'une définition figée.

### `step.content`
```json
{
  "title": "Comment agit un vaccin dans ton corps ?",
  "instructions": "Remets les étapes dans l'ordre pour comprendre comment ton corps apprend à se défendre"
}
```
- `mascotteImage`: `mascotte5.png`

### `questionData`
```json
{
  "title": "Comment agit un vaccin dans ton corps ?",
  "items": [
    { "id": "a", "text": "Le vaccin présente au corps la maladie en version « noob » (inoffensive)" },
    { "id": "b", "text": "Ton système immunitaire l'analyse et apprend à la reconnaître" },
    { "id": "c", "text": "Il fabrique des anticorps adaptés et les garde en mémoire" },
    { "id": "d", "text": "Si la vraie maladie « warrior » arrive, ton corps sait déjà la combattre" }
  ]
}
```

### `correctAnswer`
```json
{ "order": ["a", "b", "c", "d"] }
```

> ⚠️ Remplace le puzzle actuel « ordre du RDV vaccinal » (prendre RDV → carnet → injection → 15 min d'attente). Le mécanisme immunitaire colle mieux à la section 1. Le contenu « RDV vaccinal » peut être conservé en réserve ailleurs si besoin.

---

## Step 2 — `KANBAN` · Pourquoi est-il important de se faire vacciner ?

**Source** : section 2 + l'idée clé de la section 1 (« se protéger soi-même **mais aussi** sa famille et son entourage ») + l'aside « éradication ».

**Pourquoi un kanban** : le « pourquoi » se travaille en **démontant les idées reçues**. Le joueur trie Vrai / Intox.

### `step.content`
```json
{
  "title": "Vrai ou Intox ?",
  "instructions": "Classe chaque affirmation dans la bonne catégorie"
}
```
- `mascotteImage`: `mascotte5.png`

### `questionData`
```json
{
  "items": [
    "Les vaccins protègent toute la communauté",
    "Un vaccin peut donner la maladie",
    "Se faire vacciner protège aussi sa famille et son entourage",
    "Seuls les bébés ont besoin de vaccins",
    "La généralisation des vaccins a permis d'éradiquer certaines maladies",
    "Les vaccins sont inutiles si on est en bonne santé"
  ],
  "categories": ["Vrai", "Intox"]
}
```

### `correctAnswer`
```json
{
  "Les vaccins protègent toute la communauté": "Vrai",
  "Un vaccin peut donner la maladie": "Intox",
  "Se faire vacciner protège aussi sa famille et son entourage": "Vrai",
  "Seuls les bébés ont besoin de vaccins": "Intox",
  "La généralisation des vaccins a permis d'éradiquer certaines maladies": "Vrai",
  "Les vaccins sont inutiles si on est en bonne santé": "Intox"
}
```

---

## Step 3 — `PHRASE_A_TROU` · Quels vaccins entre 11 et 14 ans ?

**Source** : sections 3 (« Qui doit se faire vacciner », vaccins recommandés DTP / méningocoques / HPV, calendrier vaccinal) + l'aside « Savais-tu que… » (2002 polio, 2006 HPV).

**Pourquoi une phrase à trou** : c'est du **factuel à mémoriser** (noms de vaccins, âges, dates).

### `step.content`
```json
{
  "title": "Le calendrier vaccinal",
  "instructions": "Complète les phrases avec les bons mots"
}
```
- `mascotteImage`: `mascotte5.png`

### Plusieurs phrases (une `gameData` par phrase, comme dans le seed actuel)

**Phrase A — les 3 vaccins**
```json
{
  "questionData": {
    "phrase": "Entre 11 et 14 ans, les trois vaccins recommandés sont le ___, les ___ et le ___.",
    "options": ["DTP", "méningocoques C", "HPV", "grippe", "hépatite B", "rage"]
  },
  "correctAnswer": { "blanks": ["DTP", "méningocoques C", "HPV"] }
}
```

**Phrase B — qui + à partir de quel âge**
```json
{
  "questionData": {
    "phrase": "La vaccination concerne ___, et à partir de ___ ans certains vaccins doivent être refaits pour renforcer la protection.",
    "options": ["tout le monde", "seulement les bébés", "11", "18", "les asthmatiques", "6"]
  },
  "correctAnswer": { "blanks": ["tout le monde", "11"] }
}
```

**Phrase C — la polio (aside « Savais-tu que »)**
```json
{
  "questionData": {
    "phrase": "En ___, la poliomyélite a été déclarée éradiquée en ___.",
    "options": ["2002", "1995", "Europe", "France", "2010", "Afrique"]
  },
  "correctAnswer": { "blanks": ["2002", "Europe"] }
}
```

> Note : DTP = Diphtérie, Tétanos, Polio (+ coqueluche). Le texte source liste « Diphtérie, tétanos, polio, coqueluche » — on garde l'acronyme DTP pour rester court dans le jeu.

---

## Step 4 — `SCENARIO` · C'est quoi le papillomavirus ?

**Source** : section 4 — HPV (6 cancers, transmission lors de contacts intimes, recommandé dès 11 ans), « Qui se fait vacciner ? » (filles **et** garçons), « Où ? » (collège, pharmacie, médecin, infirmière).

**Pourquoi un scénario** : le HPV se prête à une **mise en situation sociale** (idée reçue d'un ami) — application concrète.

### `step.content`
```json
{
  "title": "Que ferais-tu ?",
  "instructions": "Choisis la meilleure réaction face à cette situation"
}
```
- `mascotteImage`: `mascotte5.png`

### `questionData`
```json
{
  "situation": "Ton ami pense que le vaccin contre le Papillomavirus (HPV) n'est que pour les filles et qu'en tant que garçon, il n'en a pas besoin. Que lui réponds-tu ?",
  "choices": [
    { "id": "a", "text": "Tu as raison, ce vaccin est réservé aux filles." },
    { "id": "b", "text": "Le HPV concerne tout le monde : les garçons aussi peuvent contracter et transmettre le virus. Le vaccin les protège aussi." },
    { "id": "c", "text": "De toute façon, les vaccins ne servent à rien." },
    { "id": "d", "text": "Tu peux attendre d'avoir 18 ans pour en parler à ton médecin." }
  ]
}
```

### `correctAnswer`
```json
{
  "choiceId": "b",
  "explanation": "Le HPV peut provoquer six types de cancer et se transmet lors de contacts intimes. Le vaccin est recommandé dès 11 ans pour les filles ET les garçons : tout le monde peut être touché et transmettre le virus. On peut se faire vacciner chez un médecin, en pharmacie, ou à l'infirmerie du collège."
}
```

> L'explication réinjecte volontairement les infos « qui » (filles + garçons) et « où » (médecin / pharmacie / collège) de la section 4 pour ne rien perdre du contenu source.

---

## Step 5 — `QUIZ` · Questionnaire final

**Source** : section 5 — les 4 questions récap + « Puis-je me faire vacciner au collège ? » (Oui, gratuit, accord des familles) + l'encart « Ce que je retiens ».

**Pourquoi un quiz** : c'est l'évaluation finale qui rebalaie les 4 thèmes du module.

### `step.content`
```json
{
  "title": "Quiz final",
  "instructions": "Teste toutes tes connaissances sur la vaccination"
}
```
- `mascotteImage`: `mascotte5.png`

### `questionData` — 5 questions
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "La vaccination, comment ça marche ?",
      "options": [
        { "id": "a", "text": "Elle guérit une maladie déjà attrapée" },
        { "id": "b", "text": "Elle présente la maladie en version inoffensive pour que le corps apprenne à la combattre" },
        { "id": "c", "text": "Elle remplace les défenses naturelles du corps" },
        { "id": "d", "text": "Elle empêche définitivement d'être malade de quoi que ce soit" }
      ],
      "explanation": "Le vaccin présente au corps une version « noob » de la maladie. Le système immunitaire fabrique des anticorps et les garde en mémoire, prêt à combattre la version « warrior »."
    },
    {
      "id": "q2",
      "text": "À quoi sert la vaccination ?",
      "options": [
        { "id": "a", "text": "À se protéger soi-même uniquement" },
        { "id": "b", "text": "À se protéger soi-même ET son entourage" },
        { "id": "c", "text": "À soigner un rhume plus vite" },
        { "id": "d", "text": "À rien si on est en bonne santé" }
      ],
      "explanation": "On se fait vacciner pour se protéger soi-même, mais aussi pour protéger sa famille et son entourage. La généralisation des vaccins a même permis d'éradiquer certaines maladies."
    },
    {
      "id": "q3",
      "text": "Qui se fait vacciner ?",
      "options": [
        { "id": "a", "text": "Seulement les bébés" },
        { "id": "b", "text": "Seulement les personnes asthmatiques" },
        { "id": "c", "text": "Tout le monde, avec des rappels dès 11 ans" },
        { "id": "d", "text": "Seulement les adultes" }
      ],
      "explanation": "La vaccination concerne tout le monde. À partir de 11 ans, certains vaccins doivent être refaits pour renforcer la protection."
    },
    {
      "id": "q4",
      "text": "Quels vaccins sont recommandés entre 11 et 14 ans ?",
      "options": [
        { "id": "a", "text": "Grippe, rage et hépatite A" },
        { "id": "b", "text": "DTP, méningocoques C et HPV" },
        { "id": "c", "text": "Aucun vaccin à cet âge" },
        { "id": "d", "text": "Seulement le vaccin contre la varicelle" }
      ],
      "explanation": "Entre 11 et 14 ans, le calendrier recommande le rappel DTP (diphtérie, tétanos, polio, coqueluche), les méningocoques et le HPV."
    },
    {
      "id": "q5",
      "text": "Puis-je me faire vacciner contre le papillomavirus au collège ?",
      "options": [
        { "id": "a", "text": "Oui, c'est gratuit et accessible à tous les élèves (avec l'accord des familles)" },
        { "id": "b", "text": "Non, c'est interdit au collège" },
        { "id": "c", "text": "Oui, mais seulement pour les filles" },
        { "id": "d", "text": "Non, il faut obligatoirement aller à l'hôpital" }
      ],
      "explanation": "Oui : la vaccination HPV au collège est gratuite, évite de prendre rendez-vous et permet à tous les élèves d'y avoir accès. Les familles doivent donner leur accord au préalable."
    }
  ]
}
```

### `correctAnswer`
```json
{ "answers": { "q1": "b", "q2": "b", "q3": "c", "q4": "b", "q5": "a" } }
```

---

## Ce que je retiens (écran de fin — contenu narratif)

À afficher en fin de module (pas un jeu) :

- Un vaccin aide ton corps à se défendre.
- Plusieurs vaccins sont recommandés à 11 ans (DTP, méningocoques, HPV).
- Se faire vacciner, c'est aussi penser aux autres.
- C'est remboursé par la sécurité sociale et ça peut se faire au collège.

---

## Décisions à valider avant code

1. **Réordonnancement** : on passe de l'ordre seed actuel (Kanban → Phrase → Puzzle → Scénario → Quiz) au nouvel ordre Puzzle → Kanban → Phrase → Scénario → Quiz. OK ?
2. **Step 1** : on remplace le puzzle « RDV vaccinal » par le puzzle « mécanisme immunitaire ». OK ?
3. **Step 3** : on garde **3 phrases à trou** (3 vaccins / qui+âge / polio 2002). Ou on en réduit à 1 ?
4. **Dates 2002 & 2006** : intégrées dans la phrase à trou (option retenue) plutôt qu'un 6ᵉ step, pour respecter la règle 5 sections = 5 steps. OK ?
