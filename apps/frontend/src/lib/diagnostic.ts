const API_PUBLIC   = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:5000";
const API_INTERNAL = process.env.API_INTERNAL_URL     ?? "http://localhost:5000";

// ── Types ─────────────────────────────────────────────────────────────────────

export type QuestionType = "TRUE_FALSE" | "MCQ" | "MCQ_MULTI" | "OPEN" | "CLASSIFY";

export type Question = {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: Record<string, any> | null;
  order: number;
};

export type DiagnosticSession = {
  id: string;
  className: string;
  accessCode: string;
  accessUrl: string;
  isActive: boolean;
};

// ── API ───────────────────────────────────────────────────────────────────────

export async function getSessionByCode(
  code: string,
  { internal = false } = {},
): Promise<DiagnosticSession | null> {
  const base = internal ? API_INTERNAL : API_PUBLIC;
  const res = await fetch(`${base}/api/diagnostic/session/by-code/${code}`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${API_PUBLIC}/api/diagnostic/question`);
  if (!res.ok) throw new Error("Impossible de charger les questions");
  return res.json();
}

export async function createGuestStudent(diagnosticSessionId: string): Promise<string> {
  const res = await fetch(`${API_PUBLIC}/api/guest-studend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ diagnosticSessionId }),
  });
  if (!res.ok) throw new Error("Impossible de créer l'élève");
  const data = await res.json();
  return data.id;
}

// ── Reprise après une sortie de page ──────────────────────────────────────────
//
// L'identifiant de l'élève est gardé dans son navigateur, par session : s'il
// recharge la page, revient en arrière ou ferme l'onglet, il reprend son
// diagnostic au lieu de compter comme un nouvel élève.

const guestKey = (sessionId: string) => `diagnostic_guest_${sessionId}`;

export function getStoredGuestId(sessionId: string): string | null {
  try {
    return localStorage.getItem(guestKey(sessionId));
  } catch {
    return null;
  }
}

export function storeGuestId(sessionId: string, id: string): void {
  try {
    localStorage.setItem(guestKey(sessionId), id);
  } catch {
    // Navigation privée ou stockage bloqué : on continue sans reprise possible.
  }
}

export type GuestProgress = { answeredQuestionIds: string[]; completed: boolean };

// null : élève inconnu pour cette session (supprimé, autre session…).
export async function fetchGuestProgress(
  sessionId: string,
  guestId: string,
): Promise<GuestProgress | null> {
  const res = await fetch(`${API_PUBLIC}/api/diagnostic/response/progress/${sessionId}/${guestId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Impossible de retrouver ta progression");
  return res.json();
}

export async function submitResponse(payload: {
  questionId: string;
  userAnswer: Record<string, any>;
  guestStudentId: string;
  sessionId: string;
  timing?: number;
}): Promise<void> {
  const res = await fetch(`${API_PUBLIC}/api/diagnostic/response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Ta réponse n'a pas pu être enregistrée");
}
