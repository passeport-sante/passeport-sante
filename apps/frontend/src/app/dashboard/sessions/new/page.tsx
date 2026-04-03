"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Stethoscope, BookOpen, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type SessionType = "diagnostic" | "module" | null;

type Module = {
  id: string;
  title: string;
  description: string | null;
  colorPrimary: string | null;
  duration: number | null;
};

function decodeJwt(token: string): { sub: string } {
  return JSON.parse(atob(token.split(".")[1]));
}

export default function NewSessionPage() {
  const router = useRouter();

  const [type, setType] = useState<SessionType>(null);
  const [className, setClassName] = useState("");
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (type !== "module") return;
    setLoadingModules(true);
    fetch(`${API}/api/modules`)
      .then((r) => r.json())
      .then(setModules)
      .catch(() => {})
      .finally(() => setLoadingModules(false));
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!className.trim() || !type) return;
    if (type === "module" && !selectedModuleId) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token") ?? "";
      const { sub: userId } = decodeJwt(token);

      const userRes = await fetch(`${API}/api/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error("Impossible de récupérer le profil utilisateur");
      const user = await userRes.json();

      const endpoint =
        type === "diagnostic"
          ? `${API}/api/diagnostic/session`
          : `${API}/api/modules/session`;

      const body =
        type === "diagnostic"
          ? { className: className.trim(), createdByUserId: userId, organizationId: user.organizationId }
          : { className: className.trim(), moduleId: selectedModuleId, createdByUserId: userId, organizationId: user.organizationId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Erreur lors de la création de la session");

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    className.trim().length > 0 &&
    type !== null &&
    (type === "diagnostic" || selectedModuleId !== null);

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Nouvelle session</h1>
          <p className="text-gray-400 text-sm">Créez une session pour votre classe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Étape 1 — Type de session */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <p className="text-sm font-bold text-[#1A1A1A]">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs mr-2" style={{ background: "#1B6B8A" }}>1</span>
            Type de session
          </p>
          <div className="grid grid-cols-2 gap-3">
            {/* Diagnostic */}
            <button
              type="button"
              onClick={() => { setType("diagnostic"); setSelectedModuleId(null); }}
              className={`relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all ${
                type === "diagnostic"
                  ? "border-[#1B6B8A] bg-[#EBF4F8]"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              {type === "diagnostic" && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#1B6B8A] flex items-center justify-center">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EBF4F8" }}>
                <Stethoscope size={20} className="text-[#1B6B8A]" />
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-sm">Diagnostic</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                  61 questions fixes — santé, numérique, bien-être
                </p>
              </div>
            </button>

            {/* Module */}
            <button
              type="button"
              onClick={() => setType("module")}
              className={`relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all ${
                type === "module"
                  ? "border-[#2A8970] bg-[#EBF6F3]"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              {type === "module" && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2A8970] flex items-center justify-center">
                  <Check size={11} className="text-white" strokeWidth={3} />
                </span>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EBF6F3" }}>
                <BookOpen size={20} className="text-[#2A8970]" />
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A] text-sm">Module</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">
                  Choisissez un module thématique de la plateforme
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Étape 2 — Choix du module (si type = module) */}
        {type === "module" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <p className="text-sm font-bold text-[#1A1A1A]">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs mr-2" style={{ background: "#2A8970" }}>2</span>
              Choisir un module
            </p>

            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : modules.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Aucun module disponible.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                {modules.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModuleId(m.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      selectedModuleId === m.id
                        ? "border-[#2A8970] bg-[#EBF6F3]"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: m.colorPrimary ?? "#2A8970" }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1A1A1A] text-sm leading-tight">{m.title}</p>
                      {m.duration && (
                        <p className="text-xs text-gray-400 mt-0.5">{m.duration} min</p>
                      )}
                    </div>
                    {selectedModuleId === m.id && (
                      <Check size={14} className="text-[#2A8970] shrink-0 ml-auto" strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Étape finale — Nom de la classe */}
        {type !== null && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
            <p className="text-sm font-bold text-[#1A1A1A]">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs mr-2" style={{ background: "#1B6B8A" }}>
                {type === "diagnostic" ? "2" : "3"}
              </span>
              Nom de la classe
            </p>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Ex : 5ème A, Terminale B..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8970] focus:border-transparent transition"
              required
            />
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 px-5 py-3 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl text-center hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #1B6B8A, #2A8970)" }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Création..." : "Créer la session"}
          </button>
        </div>
      </form>
    </div>
  );
}
