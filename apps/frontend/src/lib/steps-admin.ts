import { authHeaders } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}";

export type GameType =
  | "KANBAN"
  | "QUIZ"
  | "PUZZLE"
  | "PHRASE_A_TROU"
  | "SCENARIO";

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
  }
}

// ── Utilitaire : générer un id court pour les items (options, choix) ─────────

export function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

// ── Vidéo : normalise un lien YouTube/Vimeo en URL d'intégration (embed) ─────
// Accepte aussi une URL d'embed déjà valide. Renvoie null si non reconnu.
export function toEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;

  // YouTube : watch?v=, youtu.be/, /embed/, /shorts/
  const yt =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;

  // Vimeo : vimeo.com/123456789 ou player.vimeo.com/video/123456789
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  // Déjà une URL d'embed http(s) → on la garde telle quelle
  if (/^https?:\/\//.test(url)) return url;

  return null;
}
