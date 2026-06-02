"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ModuleForm } from "../_components/module-form";
import {
  createModule,
  fetchCategories,
  type CategoryLite,
  type CreateModulePayload,
} from "@/lib/modules-admin";
import { decodeJwt, getToken } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL ?? "${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}";

export default function NewModulePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const payload = decodeJwt<{ sub: string }>(token);
    if (!payload) return;

    Promise.all([
      fetchCategories().catch(() => [] as CategoryLite[]),
      fetch(`${API}/api/user/${payload.sub}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ])
      .then(([cats, user]) => {
        setCategories(cats);
        setOrganizationId(user?.organizationId ?? null);
      })
      .finally(() => setReady(true));
  }, []);

  async function handleSubmit(payload: CreateModulePayload | Partial<CreateModulePayload>) {
    if (!organizationId) throw new Error("Impossible de récupérer votre organisation");
    const created = await createModule({
      ...(payload as CreateModulePayload),
      organizationId,
      isActive: false,
    });
    router.push(`/dashboard/modules/${created.id}/edit`);
  }

  if (!ready) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/modules"
          className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Nouveau module</h1>
          <p className="text-gray-400 text-sm">
            Créez un module — vous pourrez ajouter ses étapes ensuite
          </p>
        </div>
      </div>

      <ModuleForm
        categories={categories}
        submitLabel="Créer le module"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/modules")}
      />
    </div>
  );
}
