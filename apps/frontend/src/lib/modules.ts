const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function createGuestStudent(sessionId?: string): Promise<string> {
  const res = await fetch(`${API}/api/guest-studend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) throw new Error("Impossible de créer le profil élève");
  const data = await res.json();
  return data.id as string;
}

export async function submitKanbanResponse(payload: {
  guestStudentId: string;
  stepId: string;
  moduleId: string;
  userAnswer: Record<string, string>;
  isCorrect: boolean;
}): Promise<void> {
  await fetch(`${API}/api/response/kanban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitQuizResponse(payload: {
  guestStudentId: string;
  stepId: string;
  moduleId: string;
  userAnswer: Record<string, unknown>;
  isCorrect: boolean;
  timing?: number;
}): Promise<void> {
  await fetch(`${API}/api/response/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function submitPuzzleResponse(payload: {
  guestStudentId: string;
  stepId: string;
  moduleId: string;
  userAnswer: Record<string, unknown>;
  isCorrect: boolean;
}): Promise<void> {
  await fetch(`${API}/api/response/puzzle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ─── Identité de l'élève invité ───────────────────────────────────────────────
//
// Pas de compte ni de mot de passe : l'élève est un GuestStudent créé côté
// serveur, dont on garde seulement l'identifiant. Il vit en localStorage (et
// non plus en sessionStorage) pour que la progression survive à la fermeture
// d'un onglet ; l'ancienne clé de session est encore lue, le temps que les
// séances en cours se terminent.

const guestKey = (slug: string) => `module_guest_${slug}`;

export function getGuestStudentId(slug: string): string | null {
  try {
    return localStorage.getItem(guestKey(slug)) ?? sessionStorage.getItem(guestKey(slug));
  } catch {
    return null;
  }
}

export function setGuestStudentId(slug: string, id: string): void {
  try {
    localStorage.setItem(guestKey(slug), id);
  } catch {
    // Navigation privée ou stockage bloqué : on continue sans mémoriser.
  }
}

// Renvoie l'élève invité du module, en le créant si besoin. Un élève qui
// découvre un module hors séance n'a pas de sessionId : le GuestStudent est
// alors créé sans session, donc sans effet sur les compteurs des classes.
export async function ensureGuestStudentId(
  slug: string,
  sessionId?: string | null,
): Promise<string | null> {
  const existant = getGuestStudentId(slug);
  if (existant) return existant;
  try {
    const id = await createGuestStudent(sessionId ?? undefined);
    setGuestStudentId(slug, id);
    return id;
  } catch {
    return null;
  }
}

// ─── Progression, tenue par le serveur ────────────────────────────────────────

export interface ProgressState {
  unlockedLevel: number;
  isCompleted: boolean;
  totalLevels: number;
}

export async function fetchProgress(
  guestStudentId: string,
  moduleId: string,
): Promise<ProgressState | null> {
  try {
    const res = await fetch(
      `${API}/api/modules/progress/state?guestStudentId=${encodeURIComponent(
        guestStudentId,
      )}&moduleId=${encodeURIComponent(moduleId)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as ProgressState;
  } catch {
    return null;
  }
}

// Déclare une étape terminée. Le serveur vérifie qu'une réponse existe pour le
// jeu concerné avant d'ouvrir le niveau suivant.
//
// Les jeux envoient leur réponse sans l'attendre : elle peut donc arriver après
// cet appel, et le serveur répond alors « pas encore jouée ». On réessaie
// quelques fois, sinon l'élève resterait bloqué sur une course perdue.
export async function completeStep(
  guestStudentId: string,
  stepId: string,
  essais = 4,
): Promise<ProgressState | null> {
  for (let essai = 0; essai < essais; essai++) {
    try {
      const res = await fetch(`${API}/api/modules/progress/step`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestStudentId, stepId }),
      });
      if (res.ok) return (await res.json()) as ProgressState;
      // 400 = la réponse du jeu n'est pas encore en base ; on laisse du temps.
      if (res.status !== 400) return null;
    } catch {
      // Réseau : même traitement, on retente.
    }
    await new Promise((r) => setTimeout(r, 600 * (essai + 1)));
  }
  return null;
}
