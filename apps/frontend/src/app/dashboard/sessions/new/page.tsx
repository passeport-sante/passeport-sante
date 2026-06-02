"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Stethoscope, BookOpen, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}";

type SessionType = "diagnostic" | "module" | null;

type Module = {
  id: string;
  title: string;
  description: string | null;
  colorPrimary: string | null;
  duration: number | null;
};

function decodeJwt(token: string): { sub: string } {
  return JSON.parse(atob(token.split(".")[1]!));
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
          : `${API}/api/module-sessions`;

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
    <div className="px-8 py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-[22px] font-semibold text-[#1A1A1A] tracking-tight">
            Nouvelle session
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Créez une session pour votre classe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Étape 1 — Type de session */}
        <Section step={1} title="Type de session">
          <div className="grid grid-cols-2 gap-3">
            <ChoiceCard
              icon={<Stethoscope size={18} className="text-gray-600" />}
              title="Diagnostic"
              description="61 questions fixes — santé, numérique, bien-être"
              selected={type === "diagnostic"}
              onClick={() => {
                setType("diagnostic");
                setSelectedModuleId(null);
              }}
            />
            <ChoiceCard
              icon={<BookOpen size={18} className="text-gray-600" />}
              title="Module"
              description="Choisissez un module thématique de la plateforme"
              selected={type === "module"}
              onClick={() => setType("module")}
            />
          </div>
        </Section>

        {/* Étape 2 — Choix du module */}
        {type === "module" && (
          <Section step={2} title="Choisir un module">
            {loadingModules ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : modules.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-6">Aucun module disponible.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {modules.map((m) => {
                  const selected = selectedModuleId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedModuleId(m.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                        selected
                          ? "border-blue-600 bg-blue-50/50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: m.colorPrimary ?? "#9CA3AF" }}
                      />
                      <span className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-[#1A1A1A] truncate">{m.title}</p>
                        {m.duration && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{m.duration} min</p>
                        )}
                      </span>
                      {selected && <Check size={13} className="text-blue-600 shrink-0" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* Étape finale — Nom de la classe */}
        {type !== null && (
          <Section step={type === "diagnostic" ? 2 : 3} title="Nom de la classe">
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Ex : 5ème A, Terminale B..."
              className="w-full h-10 px-3 rounded-lg bg-white border border-gray-200 text-[13px] focus:outline-none focus:border-gray-400 placeholder:text-gray-400"
              required
            />
          </Section>
        )}

        {error && (
          <p className="text-[13px] text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center h-10 px-4 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Création..." : "Créer la session"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({
  step,
  title,
  children,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <p className="text-[13px] font-semibold text-[#1A1A1A] flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold">
          {step}
        </span>
        {title}
      </p>
      {children}
    </div>
  );
}

function ChoiceCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-start gap-2.5 p-4 rounded-lg border text-left transition-colors ${
        selected
          ? "border-blue-600 bg-blue-50/50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {selected && (
        <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
          <Check size={10} className="text-white" strokeWidth={3} />
        </span>
      )}
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[#1A1A1A]">{title}</p>
        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
