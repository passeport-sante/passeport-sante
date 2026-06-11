"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Layers, Eye, EyeOff, Info } from "lucide-react";
import { ModuleForm } from "../../_components/module-form";
import { StepsTab } from "../../_components/steps-tab";
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

type Tab = "info" | "steps";

export default function EditModulePage({ params }: PageProps) {
  const { id } = usePromise(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get("tab") === "steps" ? "steps" : "info";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [module, setModule] = useState<AdminModuleDetail | null>(null);
  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedColor, setSavedColor] = useState<string | null>(null);

  async function refresh() {
    try {
      const [mod, cats] = await Promise.all([
        fetchAdminModule(id),
        fetchCategories().catch(() => [] as CategoryLite[]),
      ]);
      setModule(mod);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function switchTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "steps") url.searchParams.set("tab", "steps");
    else url.searchParams.delete("tab");
    window.history.replaceState({}, "", url.toString());
  }

  async function handleSubmit(payload: UpdateModulePayload) {
    const updated = await updateModule(id, payload);
    setModule(updated);
    setSavedColor(updated.colorPrimary ?? null);
    setTimeout(() => setSavedColor(null), 4000);
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

  const stepCount = module.steps?.filter((s) => s.kind === "GAME").length ?? 0;

  return (
    <div className={`p-8 ${tab === "steps" ? "max-w-[1400px]" : "max-w-6xl"}`}>
      {/* Toast de confirmation sauvegarde */}
      {savedColor !== null && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-xl animate-in slide-in-from-top-2">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: savedColor }} />
          Sauvegardé ! colorPrimary = {savedColor}
        </div>
      )}
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
              slug : <span className="font-mono">{module.slug}</span>
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

      {/* Onglets */}
      <div className="border-b border-gray-200 mb-6 flex items-center gap-1">
        <TabButton
          active={tab === "info"}
          onClick={() => switchTab("info")}
          icon={<Info size={13} />}
          label="Informations"
        />
        <TabButton
          active={tab === "steps"}
          onClick={() => switchTab("steps")}
          icon={<Layers size={13} />}
          label="Étapes"
          badge={stepCount}
        />
      </div>

      {/* Contenu */}
      {tab === "info" ? (
        <ModuleForm
          categories={categories}
          initial={module}
          submitLabel="Enregistrer les modifications"
          onSubmit={handleSubmit}
          onCancel={() => router.push("/dashboard/modules")}
        />
      ) : (
        <StepsTab
          moduleId={id}
          colorPrimary={module.colorPrimary ?? "#1B6B8A"}
          steps={module.steps}
          onChange={refresh}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold flex items-center gap-1.5 -mb-px border-b-2 transition-colors ${
        active
          ? "text-[#1B6B8A] border-[#1B6B8A]"
          : "text-gray-400 border-transparent hover:text-gray-600"
      }`}
    >
      {icon}
      {label}
      {badge !== undefined && (
        <span
          className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
            active ? "bg-[#1B6B8A]/10 text-[#1B6B8A]" : "bg-gray-100 text-gray-500"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
