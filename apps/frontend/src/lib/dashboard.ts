const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const TOTAL_DIAGNOSTIC_QUESTIONS = 61;

// ── Types ─────────────────────────────────────────────────────────────────────

export type SessionUser = { id: string; name: string; email?: string };

export type SessionSummary = {
  id: string;
  className: string;
  accessCode: string;
  accessUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUser: SessionUser;
  _count: { guestStudents: number; diagnosticResponses: number };
};

export type QuestionMeta = {
  id: string;
  questionText: string;
  questionType: string;
  order: number;
  options: Record<string, unknown> | null;
  correctAnswer: Record<string, unknown> | null;
};

export type ResponseEntry = {
  id: string;
  isCorrect: boolean | null;
  userAnswer: Record<string, unknown>;
  questionId: string;
  guestStudentId: string;
  question: QuestionMeta;
};

export type SessionDetail = Omit<SessionSummary, "_count"> & {
  createdByUser: SessionUser;
  _count: { guestStudents: number; diagnosticResponses: number };
  diagnosticResponses: ResponseEntry[];
};

// ── Answer distribution ───────────────────────────────────────────────────────

export type AnswerSlice = {
  label: string;
  count: number;
  isCorrect: boolean | null;
};

export type QuestionStats = {
  question: QuestionMeta;
  totalAnswered: number;
  slices: AnswerSlice[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export async function fetchSessions(token: string): Promise<SessionSummary[]> {
  const res = await fetch(`${API}/api/diagnostic/session`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Impossible de charger les sessions");
  return res.json();
}

export async function fetchSessionDetail(id: string, token: string): Promise<SessionDetail | null> {
  const res = await fetch(`${API}/api/diagnostic/session/${id}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function closeSession(id: string, token: string): Promise<void> {
  await fetch(`${API}/api/diagnostic/session/${id}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify({ isActive: false }),
  });
}

// ── Extraction défensive de la réponse ────────────────────────────────────────
// Gère les deux formats : { answer: "texte" } et l'ancien { answer: { answer: "texte" } }
function extractScalarAnswer(userAnswer: Record<string, unknown>): string {
  const raw = userAnswer.answer;
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  // ancien format double-wrappé : { answer: { answer: "texte" } }
  if (typeof raw === "object") {
    const inner = (raw as Record<string, unknown>).answer;
    if (inner === null || inner === undefined) return "";
    return String(inner);
  }
  return String(raw);
}

function extractArrayAnswer(userAnswer: Record<string, unknown>): string[] {
  const raw = userAnswer.answers;
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

// ── Compute per-question distribution ─────────────────────────────────────────

export function computeQuestionStats(responses: ResponseEntry[]): QuestionStats[] {
  const map = new Map<string, { question: QuestionMeta; responses: ResponseEntry[] }>();

  for (const r of responses) {
    if (!map.has(r.questionId)) {
      map.set(r.questionId, { question: r.question, responses: [] });
    }
    map.get(r.questionId)!.responses.push(r);
  }

  return Array.from(map.values())
    .sort((a, b) => a.question.order - b.question.order)
    .map(({ question, responses: qResponses }) => {
      const slices = buildSlices(question, qResponses);
      return { question, totalAnswered: qResponses.length, slices };
    });
}

function buildSlices(question: QuestionMeta, responses: ResponseEntry[]): AnswerSlice[] {
  const type = question.questionType;

  if (type === "OPEN") return [];

  if (type === "TRUE_FALSE") {
    const correct = (question.correctAnswer as { answer?: string } | null)?.answer ?? null;
    const choices: string[] = (question.options as { choices?: string[] } | null)?.choices ?? ["OUI", "NON"];
    const counts: Record<string, number> = {};
    for (const r of responses) {
      const ans = extractScalarAnswer(r.userAnswer);
      if (ans) counts[ans] = (counts[ans] ?? 0) + 1;
    }
    return choices.map((label) => ({
      label,
      count: counts[label] ?? 0,
      isCorrect: correct !== null ? label === correct : null,
    }));
  }

  if (type === "MCQ") {
    const choices: string[] = (question.options as { choices?: string[] } | null)?.choices ?? [];
    const correct = (question.correctAnswer as { answer?: string } | null)?.answer ?? null;
    const counts: Record<string, number> = {};
    for (const r of responses) {
      const ans = extractScalarAnswer(r.userAnswer);
      if (ans) counts[ans] = (counts[ans] ?? 0) + 1;
    }
    const seen = new Set<string>();
    const slices: AnswerSlice[] = [];
    for (const label of choices) {
      seen.add(label);
      slices.push({ label, count: counts[label] ?? 0, isCorrect: correct !== null ? label === correct : null });
    }
    // réponses inattendues (format inconnu) — on les ignore silencieusement
    return slices;
  }

  if (type === "MCQ_MULTI") {
    const choices: string[] = (question.options as { choices?: string[] } | null)?.choices ?? [];
    const correctAnswers: string[] = (question.correctAnswer as { answers?: string[] } | null)?.answers ?? [];
    const counts: Record<string, number> = {};
    for (const r of responses) {
      for (const ans of extractArrayAnswer(r.userAnswer)) {
        counts[ans] = (counts[ans] ?? 0) + 1;
      }
    }
    return choices.map((label) => ({
      label,
      count: counts[label] ?? 0,
      isCorrect: correctAnswers.includes(label),
    }));
  }

  if (type === "CLASSIFY") {
    const correct = responses.filter((r) => r.isCorrect === true).length;
    const incorrect = responses.filter((r) => r.isCorrect === false).length;
    return [
      { label: "Bien classé", count: correct, isCorrect: true },
      { label: "Mal classé", count: incorrect, isCorrect: false },
    ];
  }

  return [];
}

export function computeAvgScore(responses: ResponseEntry[]): number {
  const graded = responses.filter((r) => r.isCorrect !== null);
  if (graded.length === 0) return 0;
  const correct = graded.filter((r) => r.isCorrect === true).length;
  return Math.round((correct / graded.length) * 100);
}
