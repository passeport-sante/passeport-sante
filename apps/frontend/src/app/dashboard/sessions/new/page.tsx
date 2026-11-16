"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Loader2, Stethoscope, BookOpen, Check, School, Pencil, Wand2 } from "lucide-react";
import { CLASS_LEVELS } from "@/lib/dashboard";
import type { ClassLevel } from "@/lib/dashboard";
import { fetchOrganizations, type Organization } from "@/lib/admin-users";
import { buildClassName } from "@/lib/class-name";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type SessionType = "diagnostic" | "module" | null;

type Module = {
  id: string;
  title: string;
  description: string | null;
  teacherNote: string | null;
  colorPrimary: string | null;
  duration: number | null;
};

function decodeJwt(token: string): { sub: string; role?: string } {
  return JSON.parse(atob(token.split(".")[1]!));
}

export default function NewSessionPage() {
  const router = useRouter();

  const [type, setType] = useState<SessionType>(null);
  // Lettre ou numéro de la classe ("A", "302") : le nom est construit avec le niveau.
  const [className, setClassName] = useState("");
  // Nom libre, pour les établissements qui ont leur propre façon de nommer.
  const [useCustomName, setUseCustomName] = useState(false);
  const [customName, setCustomName] = useState("");
  const [level, setLevel] = useState<ClassLevel | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [error, setError] = useState("");
  // Un admin n'appartient à aucun établissement scolaire : il doit choisir celui de la
  // session, sinon elle serait rattachée à son organisation et perdue pour l'établissement.
  const [isAdmin, setIsAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? "";
    let role: string | undefined;
    try {
      role = decodeJwt(token).role;
    } catch {
      return;
    }
    if (role !== "ADMIN") return;
    setIsAdmin(true);
    fetchOrganizations(token)
      .then((orgs) => setOrganizations([...orgs].sort((a, b) => a.name.localeCompare(b.name, "fr"))))
      .catch(() => setError("Impossible de charger les établissements"));
  }, []);

  useEffect(() => {
    if (type !== "module") return;
    setLoadingModules(true);
    fetch(`${API}/api/modules`)
      .then((r) => r.json())
      .then(setModules)
      .catch(() => {})
      .finally(() => setLoadingModules(false));
  }, [type]);

  const levelDigit = CLASS_LEVELS.find((l) => l.value === level)?.label[0] ?? "";
  const built = levelDigit ? buildClassName(levelDigit, className) : { name: "", levelMismatch: null };
  const finalName = useCustomName ? customName.trim() : built.name;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalName || !type || !level) return;
    if (type === "module" && !selectedModuleId) return;
    if (isAdmin && !organizationId) return;

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

      const sessionOrganizationId = isAdmin ? organizationId : user.organizationId;
      const body =
        type === "diagnostic"
          ? { className: finalName, level, createdByUserId: userId, organizationId: sessionOrganizationId }
          : { className: finalName, level, moduleId: selectedModuleId, createdByUserId: userId, organizationId: sessionOrganizationId };

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

  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  const canSubmit =
    finalName.length > 0 &&
    level !== null &&
    type !== null &&
    (type === "diagnostic" || selectedModuleId !== null) &&
    (!isAdmin || organizationId !== "");

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/dashboard"
          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1A1A1A]">Nouvelle session</h1>
          <p className="text-gray-400 text-sm">Créez une session pour votre classe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Admin uniquement — Établissement de la session (obligatoire) */}
        {isAdmin && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <label htmlFor="session-organization" className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A]">
              <School size={16} className="text-[#1B6B8A]" />
              Établissement
            </label>
            <p className="text-xs text-gray-400">
              La session et ses résultats seront rattachés à cet établissement.
            </p>
            <select
              id="session-organization"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8970] focus:border-transparent transition"
            >
              <option value="" disabled>
                Choisir un établissement…
              </option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.city ? `${o.name} — ${o.city}` : o.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Étape 1 — Type de session */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
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
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
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

            {selectedModule?.teacherNote && (
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900 leading-snug whitespace-pre-line">{selectedModule.teacherNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Étape finale — Nom de la classe */}
        {type !== null && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
            <p className="text-sm font-bold text-[#1A1A1A]">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs mr-2" style={{ background: "#1B6B8A" }}>
                {type === "diagnostic" ? "2" : "3"}
              </span>
              Classe
            </p>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Niveau</p>
              <div className="flex flex-wrap gap-2">
                {CLASS_LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    aria-pressed={level === l.value}
                    className={`px-3.5 py-1.5 rounded-full border-2 text-sm font-semibold transition-all ${
                      level === l.value
                        ? "border-[#1B6B8A] bg-[#EBF4F8] text-[#1B6B8A]"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            {useCustomName ? (
              <>
                <label htmlFor="session-custom-name" className="block text-xs font-semibold text-gray-500 pt-1">
                  Nom personnalisé
                </label>
                <input
                  id="session-custom-name"
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex : Atelier santé 3e"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8970] focus:border-transparent transition"
                  required
                />
              </>
            ) : (
              <>
                <label htmlFor="session-division" className="block text-xs font-semibold text-gray-500 pt-1">
                  Lettre ou numéro de la classe
                </label>
                <input
                  id="session-division"
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ex : A, B, 302…"
                  maxLength={20}
                  className="w-full sm:w-56 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#2A8970] focus:border-transparent transition"
                  required
                />
              </>
            )}

            <div className="flex items-baseline gap-2.5 flex-wrap px-4 py-3 rounded-xl bg-gray-50">
              <span className="text-xs font-semibold text-gray-500">Nom de la session</span>
              <span className={`text-lg font-black ${finalName ? "text-[#1A1A1A]" : "text-gray-300"}`}>
                {finalName || (!useCustomName && !level ? "Choisissez le niveau" : "—")}
              </span>
            </div>

            {!useCustomName && built.levelMismatch && (
              <p className="flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle size={14} className="shrink-0 mt-px" />
                Ce nom correspond à une {built.levelMismatch}e : vérifiez le niveau choisi.
              </p>
            )}

            <button
              type="button"
              onClick={() => setUseCustomName((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B6B8A] hover:text-[#2A8970] transition-colors"
            >
              {useCustomName ? <Wand2 size={13} /> : <Pencil size={13} />}
              {useCustomName ? "Revenir au nom automatique" : "Personnaliser le nom"}
            </button>
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
