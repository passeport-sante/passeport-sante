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

export async function submitResponse(payload: {
  questionId: string;
  userAnswer: Record<string, any>;
  guestStudentId: string;
  sessionId: string;
  timing?: number;
}): Promise<void> {
  await fetch(`${API_PUBLIC}/api/diagnostic/response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
