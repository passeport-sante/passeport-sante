export type UserRole = "ADMIN" | "TRAINER";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organization?: { id: string; name: string };
};

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") ?? "";
}

export function decodeJwt<T = { sub: string; role?: UserRole }>(token: string): T | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    return JSON.parse(atob(part)) as T;
  } catch {
    return null;
  }
}

export function authHeaders(token?: string): HeadersInit {
  const t = token ?? getToken();
  return {
    Authorization: `Bearer ${t}`,
    "Content-Type": "application/json",
  };
}
