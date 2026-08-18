import { authHeaders } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type GameType =
  | "KANBAN"
  | "QUIZ"
  | "PUZZLE"
  | "PHRASE_A_TROU"
  | "SCENARIO"
  | "MOTS_CROISES"
  | "HISTOIRE"
  | "DIALOGUE";

export type StepKind = "GAME" | "CONTENT";

export type ContentType = "INFO" | "IMAGE" | "VIDEO";

// Contenu d'un step : champs de jeu (title/instructions) OU champs de sous-étape de contenu
export type StepContent = {
  title?: string;
  instructions?: string;
  contentType?: ContentType;
  body?: string;
  imageUrl?: string;
  videoUrl?: string;
  caption?: string;
  // Scénario : active le mode "bouclier mental" (jauge à points, on avance à chaque choix)
  shieldMode?: boolean;
};

export type AdminStep = {
  id: string;
  kind: StepKind;
  order: number;
  gameType: GameType | null;
  mascotteImage: string | null;
  content: StepContent | null;
  moduleId: string;
  gameData: AdminGameData[];
  module?: {
    id: string;
    slug: string;
    title: string;
    mascotte: string | null;
    colorPrimary: string | null;
    colorSecondary: string | null;
  };
};

export type AdminGameData = {
  id?: string;
  questionData: Record<string, unknown>;
  correctAnswer?: Record<string, unknown> | null;
  hints?: Record<string, unknown> | null;
};

export type CreateStepPayload = {
  moduleId: string;
  kind?: StepKind;
  gameType?: GameType;
  order: number;
  mascotteImage?: string;
  content?: StepContent;
  gameData?: AdminGameData[];
};

export type UpdateStepPayload = {
  order?: number;
  mascotteImage?: string;
  content?: StepContent;
  gameData?: AdminGameData[];
};

// ── Endpoints ────────────────────────────────────────────────────────────────

export async function fetchStep(id: string): Promise<AdminStep> {
  const res = await fetch(`${API}/api/step/${id}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Étape introuvable");
  return res.json();
}

export async function createStep(payload: CreateStepPayload): Promise<AdminStep> {
  const res = await fetch(`${API}/api/step`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la création de l'étape");
  }
  return res.json();
}

export async function updateStep(
  id: string,
  payload: UpdateStepPayload,
): Promise<AdminStep> {
  const res = await fetch(`${API}/api/step/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la mise à jour");
  }
  return res.json();
}

export async function deleteStep(id: string): Promise<void> {
  const res = await fetch(`${API}/api/step/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression");
}

export async function reorderSteps(
  items: { id: string; order: number }[],
): Promise<void> {
  const res = await fetch(`${API}/api/step/reorder`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ items }),
  });
  if (!res.ok) throw new Error("Erreur lors du réordonnancement");
}

// ── Métadonnées d'affichage par GameType ────────────────────────────────────

export const GAME_TYPE_META: Record<
  GameType,
  {
    label: string;
    short: string;
    color: string;
    bg: string;
    description: string;
  }
> = {
  KANBAN: {
    label: "Tri en colonnes",
    short: "Kanban",
    color: "#7C3AED",
    bg: "#F5F3FF",
    description: "Les élèves glissent des affirmations dans des catégories (ex. Vrai/Intox).",
  },
  QUIZ: {
    label: "Quiz",
    short: "Quiz",
    color: "#1B6B8A",
    bg: "#EBF4F8",
    description: "Une série de questions à choix avec retour immédiat.",
  },
  PUZZLE: {
    label: "Remise en ordre",
    short: "Puzzle",
    color: "#D97706",
    bg: "#FFF7ED",
    description: "Replacer des étapes dans le bon ordre chronologique.",
  },
  PHRASE_A_TROU: {
    label: "Phrase à trous",
    short: "Phrase",
    color: "#DB2777",
    bg: "#FDF2F8",
    description: "Compléter une phrase en glissant les bons mots dans les trous.",
  },
  SCENARIO: {
    label: "Mise en situation",
    short: "Scénario",
    color: "#2A8970",
    bg: "#ECFDF5",
    description: "Face à une situation, choisir la meilleure réaction.",
  },
  MOTS_CROISES: {
    label: "Mots croisés",
    short: "Mots croisés",
    color: "#0891B2",
    bg: "#ECFEFF",
    description: "Remplir une grille de mots croisés à partir de définitions.",
  },
  HISTOIRE: {
    label: "Histoire",
    short: "Histoire",
    color: "#9333EA",
    bg: "#FAF5FF",
    description: "Remettre dans l'ordre les vignettes (image + texte) d'un récit.",
  },
  DIALOGUE: {
    label: "Dialogue interactif",
    short: "Dialogue",
    color: "#4F46E5",
    bg: "#EEF2FF",
    description: "Une histoire à embranchements : les choix de l'élève mènent à différentes fins.",
  },
};

// ── Métadonnées d'affichage des sous-étapes de contenu ──────────────────────

export const CONTENT_TYPE_META: Record<
  ContentType,
  { label: string; short: string; color: string; bg: string; description: string }
> = {
  INFO: {
    label: "Le saviez-vous ?",
    short: "Info",
    color: "#0EA5E9",
    bg: "#F0F9FF",
    description: "Un encart d'information complémentaire à lire (pas de jeu).",
  },
  IMAGE: {
    label: "Image",
    short: "Image",
    color: "#16A34A",
    bg: "#F0FDF4",
    description: "Afficher une image en plein écran (via URL).",
  },
  VIDEO: {
    label: "Vidéo",
    short: "Vidéo",
    color: "#E11D48",
    bg: "#FFF1F2",
    description: "Intégrer une vidéo YouTube ou Vimeo (via URL).",
  },
};

export function defaultContentForType(contentType: ContentType): StepContent {
  switch (contentType) {
    case "INFO":
      return { contentType, title: "Le saviez-vous ?", body: "Saisis ici l'information à transmettre aux élèves." };
    case "IMAGE":
      return { contentType, title: "", imageUrl: "", caption: "" };
    case "VIDEO":
      return { contentType, title: "", videoUrl: "", caption: "" };
  }
}

// ── Gabarits par défaut quand on crée un step vide ──────────────────────────

export function defaultContentFor(gameType: GameType): { title: string; instructions: string } {
  const map: Record<GameType, { title: string; instructions: string }> = {
    KANBAN: { title: "Vrai ou Intox ?", instructions: "Classe chaque affirmation dans la bonne catégorie" },
    QUIZ: { title: "Quiz", instructions: "Réponds à toutes les questions" },
    PUZZLE: { title: "Dans le bon ordre !", instructions: "Remets les étapes dans l'ordre correct" },
    PHRASE_A_TROU: { title: "Complète la phrase", instructions: "Glisse les bons mots dans les trous" },
    SCENARIO: { title: "Que ferais-tu ?", instructions: "Choisis la meilleure réaction face à cette situation" },
    MOTS_CROISES: { title: "Mots croisés", instructions: "Remplis la grille à partir des définitions" },
    HISTOIRE: { title: "Raconte l'histoire", instructions: "Remets les vignettes dans l'ordre du récit" },
    DIALOGUE: { title: "L'histoire dont tu es le héros", instructions: "Fais tes choix et découvre où ils te mènent" },
  };
  return map[gameType];
}

export function defaultGameDataFor(gameType: GameType): AdminGameData[] {
  switch (gameType) {
    case "KANBAN":
      return [
        {
          questionData: {
            categories: ["Vrai", "Intox"],
            items: ["Affirmation 1", "Affirmation 2"],
          },
          correctAnswer: {
            "Affirmation 1": "Vrai",
            "Affirmation 2": "Intox",
          },
        },
      ];
    case "QUIZ":
      return [
        {
          questionData: {
            questions: [
              {
                id: "q1",
                text: "Première question ?",
                options: [
                  { id: "a", text: "Réponse A" },
                  { id: "b", text: "Réponse B" },
                ],
              },
            ],
          },
          correctAnswer: { answers: { q1: "a" } },
        },
      ];
    case "PUZZLE":
      return [
        {
          questionData: {
            title: "Reconstitue l'ordre",
            items: [
              { id: "a", text: "Étape 1" },
              { id: "b", text: "Étape 2" },
            ],
          },
          correctAnswer: { order: ["a", "b"] },
        },
      ];
    case "PHRASE_A_TROU":
      return [
        {
          questionData: {
            phrase: "Complète cette ___ avec le bon mot.",
            options: ["phrase", "vidéo", "image"],
          },
          correctAnswer: { blanks: ["phrase"] },
        },
      ];
    case "SCENARIO":
      return [
        {
          questionData: {
            situation: "Décris ici la situation à laquelle l'élève fait face.",
            choices: [
              { id: "a", text: "Première réaction" },
              { id: "b", text: "Deuxième réaction" },
            ],
          },
          correctAnswer: { choiceId: "a", explanation: "Explique pourquoi c'est la bonne réponse." },
        },
      ];
    case "MOTS_CROISES":
      return [
        {
          questionData: {
            words: [
              { id: "w1", answer: "NON", clue: "Ce qu'il faut savoir dire face à la pression", row: 0, col: 0, dir: "H" },
              { id: "w2", answer: "NICOTINE", clue: "Produit du tabac qui rend dépendant", row: 0, col: 0, dir: "V" },
            ],
          },
          correctAnswer: {},
        },
      ];
    case "HISTOIRE":
      return [
        {
          questionData: {
            title: "Remets l'histoire dans l'ordre",
            items: [
              { id: "a", text: "Début de l'histoire", imageUrl: "" },
              { id: "b", text: "Suite de l'histoire", imageUrl: "" },
            ],
          },
          correctAnswer: { order: ["a", "b"] },
        },
      ];
    case "DIALOGUE":
      return [
        {
          questionData: {
            startId: "s1",
            scenes: [
              {
                id: "s1",
                text: "Dans la cour, un groupe se moque de Tom à cause de ses chaussures. Que fais-tu ?",
                choices: [
                  { id: "c1", text: "Je ris avec le groupe", goto: "s2" },
                  { id: "c2", text: "Je vais voir Tom", goto: "e_good" },
                ],
              },
              {
                id: "s2",
                text: "Tom baisse la tête, il a l'air vraiment triste. Et là ?",
                choices: [
                  { id: "c3", text: "Je continue comme si de rien", goto: "e_bad" },
                  { id: "c4", text: "Je m'arrête et je le défends", goto: "e_good" },
                ],
              },
            ],
            endings: [
              { id: "e_good", text: "Tu as soutenu Tom. Ton geste compte plus que tu ne crois.", tone: "good" },
              { id: "e_bad", text: "Personne n'a aidé Tom aujourd'hui. Rejoue pour voir ce que tu pouvais changer.", tone: "bad" },
            ],
          },
          correctAnswer: { bestEndingId: "e_good" },
        },
      ];
  }
}

// ── Dialogue interactif : types partagés éditeur ⇆ jeu ───────────────────────

export type DialogueTone = "good" | "neutral" | "bad";

export type DialogueChoice = {
  id: string;
  text: string;
  goto: string; // id d'une scène OU d'une fin
};

export type DialogueScene = {
  id: string;
  text: string;
  choices: DialogueChoice[];
};

export type DialogueEnding = {
  id: string;
  text: string;
  tone: DialogueTone;
};

export type DialogueData = {
  startId: string;
  scenes: DialogueScene[];
  endings: DialogueEnding[];
};

// ── Mots croisés : types et construction de grille (partagés jeu ⇆ éditeur) ──

export type CrosswordDir = "H" | "V";

export type CrosswordWord = {
  id: string;
  answer: string;
  clue: string;
  row: number;
  col: number;
  dir: CrosswordDir;
  /**
   * Placement forcé par l'administrateur. Les mots automatiques (manual absent
   * ou false) voient leurs row/col/dir recalculés par autoLayoutCrossword ;
   * les mots manuels sont posés tels quels et servent d'ancrage aux autres.
   */
  manual?: boolean;
};

export type CrosswordCell = {
  r: number;
  c: number;
  solution: string;      // lettre attendue (normalisée A-Z)
  number?: number;       // numéro affiché si la case démarre un mot
  conflict?: boolean;    // deux mots imposent des lettres différentes
};

// Normalise une lettre pour la comparaison : majuscule, sans accent, A-Z uniquement.
export function normalizeLetter(ch: string): string {
  return ch
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Z]/g, "");
}

export function normalizeAnswer(answer: string): string {
  return [...answer].map(normalizeLetter).join("");
}

// Construit la grille à partir des mots : dimensions, cases (clé "r,c"), numéros, conflits.
export function computeCrossword(words: CrosswordWord[]): {
  rows: number;
  cols: number;
  cells: Map<string, CrosswordCell>;
  conflicts: number;
} {
  const cells = new Map<string, CrosswordCell>();
  let rows = 0;
  let cols = 0;
  let conflicts = 0;

  for (const w of words) {
    const letters = normalizeAnswer(w.answer);
    for (let i = 0; i < letters.length; i++) {
      const r = w.dir === "V" ? w.row + i : w.row;
      const c = w.dir === "H" ? w.col + i : w.col;
      if (r < 0 || c < 0) continue;
      const key = `${r},${c}`;
      const letter = letters[i]!;
      const existing = cells.get(key);
      if (existing) {
        if (existing.solution !== letter) {
          existing.conflict = true;
          conflicts++;
        }
      } else {
        cells.set(key, { r, c, solution: letter });
      }
      rows = Math.max(rows, r + 1);
      cols = Math.max(cols, c + 1);
    }
  }

  // Numérotation des cases de départ (parcours haut→bas, gauche→droite)
  const starts = new Set(words.map((w) => `${w.row},${w.col}`));
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${r},${c}`;
      if (starts.has(key) && cells.has(key)) {
        n++;
        cells.get(key)!.number = n;
      }
    }
  }

  return { rows, cols, cells, conflicts };
}

// ── Mots croisés : placement automatique ────────────────────────────────────
//
// L'admin ne saisit qu'une réponse et une définition : les coordonnées sont
// dérivées ici. On pose le mot le plus long, puis chaque mot suivant est croisé
// sur une lettre commune d'un mot déjà placé, en refusant les placements qui
// colleraient deux mots parallèles (ce qui créerait des mots parasites).
// Les mots qu'aucun croisement ne peut accueillir sont empilés sous la grille.

type PlacedWord = { id: string; r: number; c: number; dir: CrosswordDir; letters: string };

/** PRNG déterministe : une même graine redonne la même grille. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Teste un placement et renvoie le nombre de croisements, ou null si invalide.
 * Invalide = lettre incompatible, mot collé bout à bout, ou lettre non croisée
 * ayant un voisin perpendiculaire (les deux mots formeraient un bloc illisible).
 */
function placementScore(
  grid: Map<string, string>,
  letters: string,
  r: number,
  c: number,
  dir: CrosswordDir,
): number | null {
  const dr = dir === "V" ? 1 : 0;
  const dc = dir === "H" ? 1 : 0;

  if (grid.has(`${r - dr},${c - dc}`)) return null;
  if (grid.has(`${r + dr * letters.length},${c + dc * letters.length}`)) return null;

  let crossings = 0;
  for (let i = 0; i < letters.length; i++) {
    const rr = r + dr * i;
    const cc = c + dc * i;
    const occupant = grid.get(`${rr},${cc}`);
    if (occupant) {
      if (occupant !== letters[i]) return null;
      crossings++;
    } else if (grid.has(`${rr + dc},${cc + dr}`) || grid.has(`${rr - dc},${cc - dr}`)) {
      return null;
    }
  }
  return crossings;
}

function writeToGrid(grid: Map<string, string>, p: PlacedWord): void {
  const dr = p.dir === "V" ? 1 : 0;
  const dc = p.dir === "H" ? 1 : 0;
  for (let i = 0; i < p.letters.length; i++) {
    grid.set(`${p.r + dr * i},${p.c + dc * i}`, p.letters[i]!);
  }
}

/**
 * Recalcule les coordonnées des mots automatiques autour des mots manuels.
 * `seed` permet de proposer une autre disposition à saisie identique.
 * Renvoie les mots (même ordre qu'en entrée) et les ids n'ayant aucun croisement.
 *
 * Le placement glouton dépend fortement de l'ordre d'essai : on en tente
 * plusieurs et on garde la meilleure (le moins de mots isolés, puis la grille
 * la plus compacte). L'admin n'a donc pas à cliquer « Régénérer » pour obtenir
 * un résultat correct — le bouton ne sert qu'à explorer d'autres dispositions.
 */
export function autoLayoutCrossword(
  words: CrosswordWord[],
  seed = 1,
): { words: CrosswordWord[]; isolated: string[] } {
  const ATTEMPTS = 12;
  let best: { result: ReturnType<typeof layoutCrosswordOnce>; score: number } | null = null;

  for (let i = 0; i < ATTEMPTS; i++) {
    const result = layoutCrosswordOnce(words, seed * 7919 + i);
    const { rows, cols } = computeCrossword(result.words);
    // Priorité absolue au nombre de mots isolés, puis à la compacité.
    const score = -result.isolated.length * 1000 - (rows * cols) / 10 - Math.abs(rows - cols);
    if (!best || score > best.score) best = { result, score };
  }

  return best!.result;
}

function layoutCrosswordOnce(
  words: CrosswordWord[],
  seed: number,
): { words: CrosswordWord[]; isolated: string[] } {
  const rand = mulberry32(seed);
  const grid = new Map<string, string>();
  const placed = new Map<string, PlacedWord>();
  const isolated: string[] = [];

  // Sans mot manuel, la grille flotte librement et sera recadrée à la fin ; on
  // s'autorise donc les coordonnées négatives pendant le calcul. Dès qu'un mot
  // est fixé à la main, tout recadrage déplacerait ce mot sous les yeux de
  // l'admin : on interdit alors de sortir par le haut ou par la gauche.
  const hasManual = words.some((w) => w.manual && normalizeAnswer(w.answer).length >= 2);

  // Les mots manuels sont posés d'abord : ils forment le socle que les mots
  // automatiques viennent croiser. Un mot manuel en conflit reste où il est —
  // computeCrossword le signalera en rouge dans l'aperçu.
  for (const w of words) {
    const letters = normalizeAnswer(w.answer);
    if (!w.manual || letters.length < 2) continue;
    const p: PlacedWord = { id: w.id, r: Math.max(0, w.row), c: Math.max(0, w.col), dir: w.dir, letters };
    placed.set(w.id, p);
    writeToGrid(grid, p);
  }

  // Mots longs d'abord : ils offrent le plus de lettres à croiser. À longueur
  // égale l'ordre dépend de la graine, ce qui fait varier « Régénérer ».
  const auto = words
    .filter((w) => !w.manual && normalizeAnswer(w.answer).length >= 2)
    .map((w) => ({ w, jitter: rand() }))
    .sort(
      (a, b) =>
        normalizeAnswer(b.w.answer).length - normalizeAnswer(a.w.answer).length || a.jitter - b.jitter,
    )
    .map(({ w }) => w);

  for (const w of auto) {
    const letters = normalizeAnswer(w.answer);

    if (placed.size === 0) {
      const p: PlacedWord = { id: w.id, r: 0, c: 0, dir: "H", letters };
      placed.set(w.id, p);
      writeToGrid(grid, p);
      continue;
    }

    let best: { p: PlacedWord; score: number } | null = null;

    for (const anchor of placed.values()) {
      const adr = anchor.dir === "V" ? 1 : 0;
      const adc = anchor.dir === "H" ? 1 : 0;
      const dir: CrosswordDir = anchor.dir === "H" ? "V" : "H";

      for (let j = 0; j < anchor.letters.length; j++) {
        const pr = anchor.r + adr * j;
        const pc = anchor.c + adc * j;
        for (let i = 0; i < letters.length; i++) {
          if (letters[i] !== anchor.letters[j]) continue;
          const r = dir === "V" ? pr - i : pr;
          const c = dir === "H" ? pc - i : pc;
          if (hasManual && (r < 0 || c < 0)) continue;

          const crossings = placementScore(grid, letters, r, c, dir);
          if (crossings === null || crossings === 0) continue;

          // Compacité : on pénalise l'agrandissement de la grille et les
          // grilles très allongées, pour un rendu proche du carré.
          let minR = r;
          let maxR = r + (dir === "V" ? letters.length - 1 : 0);
          let minC = c;
          let maxC = c + (dir === "H" ? letters.length - 1 : 0);
          for (const key of grid.keys()) {
            const [kr, kc] = key.split(",").map(Number) as [number, number];
            minR = Math.min(minR, kr);
            maxR = Math.max(maxR, kr);
            minC = Math.min(minC, kc);
            maxC = Math.max(maxC, kc);
          }
          const rows = maxR - minR + 1;
          const cols = maxC - minC + 1;
          // Le bruit ne dépasse jamais le poids d'un croisement : il départage
          // les placements de qualité voisine sans dégrader la grille.
          const score = crossings * 100 - (rows + cols) - Math.abs(rows - cols) + rand() * 12;

          if (!best || score > best.score) {
            best = { p: { id: w.id, r, c, dir, letters }, score };
          }
        }
      }
    }

    if (best) {
      placed.set(w.id, best.p);
      writeToGrid(grid, best.p);
    } else {
      isolated.push(w.id);
    }
  }

  // Mots sans croisement possible : empilés sous la grille, une ligne vide entre
  // chacun pour qu'ils restent des mots distincts et lisibles.
  let nextRow = 0;
  let leftCol = 0;
  for (const key of grid.keys()) {
    const [kr, kc] = key.split(",").map(Number) as [number, number];
    nextRow = Math.max(nextRow, kr + 1);
    leftCol = Math.min(leftCol, kc);
  }
  for (const id of isolated) {
    const w = words.find((x) => x.id === id)!;
    const letters = normalizeAnswer(w.answer);
    nextRow += 1;
    const p: PlacedWord = { id, r: nextRow, c: leftCol, dir: "H", letters };
    placed.set(id, p);
    writeToGrid(grid, p);
    nextRow += 1;
  }

  // Recadrage sur le coin haut-gauche, sauf si un mot manuel doit rester à la
  // position exacte saisie par l'admin.
  let minR = Infinity;
  let minC = Infinity;
  for (const p of placed.values()) {
    minR = Math.min(minR, p.r);
    minC = Math.min(minC, p.c);
  }
  const offR = hasManual || !Number.isFinite(minR) ? 0 : minR;
  const offC = hasManual || !Number.isFinite(minC) ? 0 : minC;

  return {
    words: words.map((w) => {
      const p = placed.get(w.id);
      if (!p) return w;
      return { ...w, row: p.r - offR, col: p.c - offC, dir: p.dir };
    }),
    isolated,
  };
}

// ── Utilitaire : générer un id court pour les items (options, choix) ─────────

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

// ── Vidéo : normalise un lien YouTube/Vimeo en URL d'intégration (embed) ─────
// Accepte aussi une URL d'embed déjà valide. Renvoie null si non reconnu.
//
// On produit des URLs « respectueuses de la vie privée » : youtube-nocookie.com
// (pas de cookie tant que la vidéo n'est pas lue) et `dnt=1` pour Vimeo. Couplé
// au chargement différé de <VideoEmbed/>, aucune donnée ne part vers le tiers
// avant le clic de l'utilisateur (conformité CNIL). Le frame-src de la CSP doit
// donc autoriser youtube-nocookie.com et player.vimeo.com.
export function toEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  // YouTube : watch?v=, youtu.be/, /embed/, /shorts/, nocookie
  const yt =
    url.match(/(?:youtube(?:-nocookie)?\.com\/watch\?v=|youtu\.be\/|youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`;

  // Vimeo : vimeo.com/123456789 ou player.vimeo.com/video/123456789
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1`;

  // Déjà une URL d'embed http(s) → on la garde telle quelle
  if (/^https?:\/\//.test(url)) return url;

  return null;
}
