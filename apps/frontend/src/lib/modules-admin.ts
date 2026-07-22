import { authHeaders, getToken } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type AdminModule = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  duration: number | null;
  mascotte: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  colorCard: string | null;
  colorCardSecondary: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; slug: string; color: string | null } | null;
  _count: { steps: number; moduleSessions: number };
};

export type AdminModuleDetail = AdminModule & {
  organizationId: string;
  categoryId: string | null;
  steps: {
    id: string;
    kind: "GAME" | "CONTENT";
    order: number;
    gameType: string | null;
    content: Record<string, unknown> | null;
  }[];
};

export type CategoryLite = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
};

export type CreateModulePayload = {
  title: string;
  description?: string;
  slug: string;
  duration?: number;
  mascotte?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorCard?: string;
  colorCardSecondary?: string;
  organizationId: string;
  categoryId?: string;
  isActive?: boolean;
};

export type UpdateModulePayload = Partial<Omit<CreateModulePayload, "organizationId">>;

export async function fetchAdminModules(): Promise<AdminModule[]> {
  const res = await fetch(`${API}/api/modules?admin=true`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Impossible de charger les modules");
  const raw = (await res.json()) as Partial<AdminModule>[];
  // Normalise — au cas où le backend renvoie un format minimal (ex: route /modules standard)
  return raw.map((m) => ({
    id: m.id ?? "",
    title: m.title ?? "Sans titre",
    description: m.description ?? null,
    slug: m.slug ?? "",
    duration: m.duration ?? null,
    mascotte: m.mascotte ?? null,
    colorPrimary: m.colorPrimary ?? null,
    colorSecondary: m.colorSecondary ?? null,
    colorCard: m.colorCard ?? null,
    colorCardSecondary: m.colorCardSecondary ?? null,
    isActive: m.isActive ?? true,
    createdAt: m.createdAt ?? new Date().toISOString(),
    updatedAt: m.updatedAt ?? new Date().toISOString(),
    category: m.category ?? null,
    _count: m._count ?? { steps: 0, moduleSessions: 0 },
  }));
}

export async function fetchAdminModule(id: string): Promise<AdminModuleDetail> {
  const res = await fetch(`${API}/api/modules/${id}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Module introuvable");
  return res.json();
}

export async function createModule(payload: CreateModulePayload): Promise<AdminModuleDetail> {
  const res = await fetch(`${API}/api/modules`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la création");
  }
  return res.json();
}

export async function updateModule(id: string, payload: UpdateModulePayload): Promise<AdminModuleDetail> {
  const res = await fetch(`${API}/api/modules/${id}`, {
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

export async function duplicateModule(id: string): Promise<AdminModuleDetail> {
  const res = await fetch(`${API}/api/modules/${id}/duplicate`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur lors de la duplication");
  return res.json();
}

export async function deleteModule(id: string): Promise<void> {
  const res = await fetch(`${API}/api/modules/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Erreur lors de la suppression");
  }
}

// Vérifie si un slug est déjà utilisé par un autre module (pour validation live à la création/édition)
export async function isSlugTaken(slug: string): Promise<boolean> {
  const res = await fetch(`${API}/api/modules/slug/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => null);
  return !!data;
}

export async function fetchCategories(): Promise<CategoryLite[]> {
  // L'endpoint /api/modules?grouped=true renvoie déjà les catégories avec leurs modules.
  // On extrait juste les méta des catégories ici.
  const res = await fetch(`${API}/api/modules?grouped=true`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const groups: { id: string; name: string; slug: string; color: string | null }[] = await res.json();
  return groups.map(({ id, name, slug, color }) => ({ id, name, slug, color }));
}

// Helpers UX ─────────────────────────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Palettes pré-définies cohérentes par thématique
export const COLOR_PRESETS: { name: string; colors: { colorPrimary: string; colorSecondary: string; colorCard: string; colorCardSecondary: string } }[] = [
  {
    name: "Santé",
    colors: { colorPrimary: "#1618a3", colorSecondary: "#c9ae15", colorCard: "#f7fcdc", colorCardSecondary: "#f1f7bb" },
  },
  {
    name: "Sommeil",
    colors: { colorPrimary: "#7C3AED", colorSecondary: "#1e1b4b", colorCard: "#f9f5ff", colorCardSecondary: "#f3e8ff" },
  },
  {
    name: "Hygiène",
    colors: { colorPrimary: "#0891B2", colorSecondary: "#0C2340", colorCard: "#e0f7fa", colorCardSecondary: "#b2ebf2" },
  },
  {
    name: "Numérique",
    colors: { colorPrimary: "#DB2777", colorSecondary: "#4a044e", colorCard: "#fce7f3", colorCardSecondary: "#fbcfe8" },
  },
  {
    name: "Nutrition",
    colors: { colorPrimary: "#D97706", colorSecondary: "#14290A", colorCard: "#ffedd5", colorCardSecondary: "#fed7aa" },
  },
];
