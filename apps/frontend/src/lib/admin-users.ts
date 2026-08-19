const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function auth(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "TRAINER" | "COLLABORATEUR";

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isSuspended: boolean;
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

// ── Password generator ────────────────────────────────────────────────────────

export function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const specials = "!@#$%&*";
  const all = upper + lower + digits + specials;

  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]!;
  const required = [pick(upper), pick(digits), pick(specials)];
  const rest = Array.from({ length: 5 }, () => pick(all));
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }
  return chars.join("");
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function fetchAllUsers(token: string): Promise<AccountUser[]> {
  const res = await fetch(`${API}/api/user`, { headers: auth(token) });
  if (!res.ok) throw new Error("Impossible de charger les comptes");
  return res.json();
}

// Le backend crée le compte ET envoie un email de bienvenue avec les identifiants.
// `emailSent` indique si cet email est bien parti.
export async function createAccount(
  token: string,
  payload: CreateAccountPayload,
): Promise<AccountUser & { emailSent: boolean }> {
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
  const res = await fetch(`${API}/api/user/${id}`, { method: "DELETE", headers: auth(token) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la suppression du compte");
  }
}

// Le mot de passe est généré côté serveur, stocké haché, et envoyé par email
// au destinataire. On récupère le mot de passe en clair (affiché une fois dans
// la modale) et le statut d'envoi de l'email.
export async function resetUserPassword(
  token: string,
  id: string,
): Promise<{ password: string; emailSent: boolean }> {
  const res = await fetch(`${API}/api/user/${id}/reset-password`, {
    method: "POST",
    headers: auth(token),
  });
  if (!res.ok) throw new Error("Erreur lors de la réinitialisation");
  return res.json();
}

export async function setSuspended(
  token: string,
  id: string,
  isSuspended: boolean,
): Promise<void> {
  const res = await fetch(`${API}/api/user/${id}`, {
    method: "PATCH",
    headers: auth(token),
    body: JSON.stringify({ isSuspended }),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour");
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

// Suppression bloquée côté backend si l'établissement contient encore des données
// (le message d'erreur explique alors quoi supprimer d'abord).
export async function deleteOrganization(token: string, id: string): Promise<void> {
  const res = await fetch(`${API}/api/organization/${id}`, {
    method: "DELETE",
    headers: auth(token),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la suppression de l'établissement");
  }
}
