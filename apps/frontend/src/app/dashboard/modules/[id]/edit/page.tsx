"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Layers, Eye, EyeOff, Sparkles } from "lucide-react";
import { ModuleForm } from "../../_components/module-form";
import {
  fetchAdminModule,
  updateModule,
  fetchCategories,
  type AdminModuleDetail,
  type CategoryLite,
  type UpdateModulePayload,
} from "@/lib/modules-admin";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditModulePage({ params }: PageProps) {
  const { id } = usePromise(params);
  const router = useRouter();

  const [module, setModule] = useState<AdminModuleDetail | null>(null);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAdminModule(id),
      fetchCategories().catch(() => [] as CategoryLite[]),
    ])
      .then(([mod, cats]) => {
        setModule(mod);
        setCategories(cats);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload: UpdateModulePayload) {
    const updated = await updateModule(id, payload);
    setModule(updated);
  }

  async function handleToggleActive() {
    if (!module) return;
    const updated = await updateModule(id, { isActive: !module.isActive });
    setModule(updated);
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="p-8 max-w-3xl">
        <Link
          href="/dashboard/modules"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft size={14} />
          Retour aux modules
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm text-red-700">
          {error ?? "Module introuvable"}
        </div>
      </div>
    );
  }

  const stepCount = module.steps?.length ?? 0;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/modules"
            className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#1A1A1A]">{module.title}</h1>
              {module.isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-[11px] font-bold rounded-full">
                  Inactif
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Modifiez les informations du module — slug : <span className="font-mono">{module.slug}</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleToggleActive}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
            module.isActive
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          }`}
        >
          {module.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
          {module.isActive ? "Désactiver" : "Activer"}
        </button>
      </div>

      {/* Onglets — pour l'instant un seul (Informations). L'onglet Étapes arrive prochainement. */}
      <div className="border-b border-gray-200 mb-6 flex items-center gap-1">
        <div className="px-4 py-2 text-sm font-semibold text-[#1B6B8A] border-b-2 border-[#1B6B8A] -mb-px">
          Informations
        </div>
        <div className="px-4 py-2 text-sm font-medium text-gray-400 flex items-center gap-1.5 cursor-not-allowed" title="Disponible prochainement">
          <Layers size={13} />
          Étapes
          <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold">
            {stepCount}
          </span>
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold">
            <Sparkles size={10} />
            Bientôt
          </span>
        </div>
      </div>

      <ModuleForm
        categories={categories}
        initial={module}
        submitLabel="Enregistrer les modifications"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/dashboard/modules")}
      />
    </div>
  );
}
