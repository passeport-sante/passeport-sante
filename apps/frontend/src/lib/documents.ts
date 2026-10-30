import { authHeaders } from "./auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type ModuleDocument = {
  id: string;
  type: "image" | "video";
  title: string;
  url: string;
};

export type DocumentTheme = {
  id: string;
  title: string;
  slug: string;
  colorPrimary: string | null;
  category: { name: string } | null;
  documents: ModuleDocument[];
};

export async function fetchDocumentThemes(): Promise<DocumentTheme[]> {
  const res = await fetch(`${API}/api/modules/documents`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Impossible de charger les documents");
  return res.json();
}
