const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function createGuestStudent(sessionId: string): Promise<string> {
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

export function getGuestStudentId(slug: string): string | null {
  return sessionStorage.getItem(`module_guest_${slug}`);
}

export function setGuestStudentId(slug: string, id: string): void {
  sessionStorage.setItem(`module_guest_${slug}`, id);
}
