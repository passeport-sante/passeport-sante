const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function auth(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "TRAINER";

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  organization: { id: string; name: string } | null;
};

export type Organization = {
  id: string;
  name: string;
  description?: string | null;
};

export type CreateAccountPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  organizationId: string;
};

// ── Users ─────────────────────────────────────────────────────────────────────

export async function fetchAllUsers(token: string): Promise<AccountUser[]> {
  const res = await fetch(`${API}/api/user`, { headers: auth(token) });
  if (!res.ok) throw new Error("Impossible de charger les comptes");
  return res.json();
}

export async function createAccount(
  token: string,
  payload: CreateAccountPayload,
): Promise<AccountUser> {
  const res = await fetch(`${API}/api/user`, {
    method: "POST",
    headers: auth(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la création");
  }
  return res.json();
}

export async function deleteAccount(token: string, id: string): Promise<void> {
  await fetch(`${API}/api/user/${id}`, { method: "DELETE", headers: auth(token) });
}

// ── Organizations ─────────────────────────────────────────────────────────────

export async function fetchOrganizations(token: string): Promise<Organization[]> {
  const res = await fetch(`${API}/api/organization`, { headers: auth(token) });
  if (!res.ok) throw new Error("Impossible de charger les établissements");
  return res.json();
}

export async function createOrganization(
  token: string,
  name: string,
): Promise<Organization> {
  const res = await fetch(`${API}/api/organization`, {
    method: "POST",
    headers: auth(token),
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Erreur lors de la création de l'établissement");
  return res.json();
}
