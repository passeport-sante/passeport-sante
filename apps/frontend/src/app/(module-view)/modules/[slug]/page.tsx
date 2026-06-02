import { notFound } from "next/navigation";
import { ModuleImmersiveClient } from "./_components/ModuleImmersiveClient";

type ModuleDetail = {
  id: string;
  title: string;
  slug: string;
  mascotte: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  colorCard: string | null;
  colorCardSecondary: string | null;
  category: { id: string; name: string; slug: string } | null;
  steps: { id: string; order: number; gameType: string }[];
};

async function getModule(slug: string): Promise<ModuleDetail | null> {
  try {
    const base = process.env.API_INTERNAL_URL ?? "http://localhost:5000";
    const res = await fetch(`${base}/api/modules/slug/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const module = await getModule(slug);

  if (!module) notFound();

  return <ModuleImmersiveClient module={module} />;
}
