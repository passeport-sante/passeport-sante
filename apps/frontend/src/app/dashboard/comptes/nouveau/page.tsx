"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, EyeOff, Building2, Plus, Shield, User, RefreshCw } from "lucide-react";
import {
  fetchOrganizations,
  createOrganization,
  createAccount,
  generatePassword,
  type Organization,
  type UserRole,
} from "@/lib/admin-users";
import type { DirectoryCollege } from "@/lib/school-directory";
import { CollegeSearch } from "../_components/college-search";

export default function NouveauComptePage() {
  const router = useRouter();
  const token = typeof window !== "undefined" ? (localStorage.getItem("access_token") ?? "") : "";

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailWarning, setEmailWarning] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("TRAINER");
  const [orgId, setOrgId] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCity, setNewOrgCity] = useState("");
  const [newOrgPostalCode, setNewOrgPostalCode] = useState("");
  const [newOrgUai, setNewOrgUai] = useState<string | null>(null);
  const [manualOrg, setManualOrg] = useState(false);
  const [orgNotice, setOrgNotice] = useState<string | null>(null);

  // Collège choisi dans l'annuaire (null : on vide pour en choisir un autre).
  // S'il existe déjà sur la plateforme, on le sélectionne au lieu d'en créer un doublon.
  function fillNewOrg(college: DirectoryCollege | null) {
    setOrgNotice(null);
    if (college) {
      const existing = orgs.find((o) => o.uai === college.uai);
      if (existing) {
        setCreatingOrg(false);
        setOrgId(existing.id);
        setOrgNotice(`« ${existing.name} » existe déjà sur la plateforme : il a été sélectionné.`);
        return;
      }
    }
    setNewOrgUai(college?.uai ?? null);
    setNewOrgName(college?.name ?? "");
    setNewOrgCity(college?.city ?? "");
    setNewOrgPostalCode(college?.postalCode ?? "");
  }
  const [creatingOrg, setCreatingOrg] = useState(false);

  useEffect(() => {
    fetchOrganizations(token)
      .then((data) => { setOrgs(data); if (data[0]) setOrgId(data[0].id); })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let finalOrgId = orgId;

      if (creatingOrg) {
        if (!newOrgName.trim()) { setError("Nom de l'établissement requis"); setLoading(false); return; }
        if (!newOrgCity.trim()) { setError("Ville de l'établissement requise"); setLoading(false); return; }
        if (!/^\d{5}$/.test(newOrgPostalCode)) { setError("Le code postal doit contenir 5 chiffres"); setLoading(false); return; }
        const org = await createOrganization(token, newOrgName.trim(), {
          city: newOrgCity.trim(),
          postalCode: newOrgPostalCode,
          ...(newOrgUai ? { uai: newOrgUai } : {}),
        });
        setOrgs((prev) => [...prev, org]);
        finalOrgId = org.id;
      }

      if (!finalOrgId) { setError("Sélectionne ou crée un établissement"); setLoading(false); return; }

      const { emailSent } = await createAccount(token, { name, email, password, role, organizationId: finalOrgId });
      if (emailSent) {
        router.push("/dashboard/comptes");
      } else {
        // Compte bien créé mais email non parti : on reste sur la page pour que
        // l'admin puisse transmettre le mot de passe manuellement (encore affiché).
        setEmailWarning(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="brand-container py-10 max-w-2xl">
      {/* ── En-tête ── */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Retour
      </button>

      <h1 className="text-2xl font-black text-gray-900 mb-8">Créer un compte</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Rôle ── */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700">Rôle</label>
          <div className="grid grid-cols-3 gap-3">
            {(["TRAINER", "COLLABORATEUR", "ADMIN"] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  role === r
                    ? "border-[#1B6B8A] bg-[#EBF4F8] text-[#1B6B8A]"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {r === "ADMIN" ? <Shield size={16} className="text-amber-500" /> : <User size={16} />}
                {r === "TRAINER" ? "Établissement" : r === "COLLABORATEUR" ? "Collaborateur" : "Administrateur"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Le collaborateur voit et teste tous les modules (même non publiés), sans pouvoir les modifier ni gérer les comptes.
          </p>
        </div>

        {/* ── Nom ── */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-bold text-gray-700">Nom complet</label>
          <input
            id="name" type="text" required value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Prénom Nom"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-[#1B6B8A]"
          />
        </div>

        {/* ── Email ── */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-bold text-gray-700">Adresse email</label>
          <input
            id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemple@etablissement.fr"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-[#1B6B8A]"
          />
        </div>

        {/* ── Mot de passe ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-bold text-gray-700">Mot de passe</label>
            <button
              type="button"
              onClick={() => { setPassword(generatePassword()); setShowPwd(true); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#1B6B8A] hover:text-[#2A8970] transition-colors"
            >
              <RefreshCw size={12} /> Générer
            </button>
          </div>
          <div className="relative">
            <input
              id="password" type={showPwd ? "text" : "password"} required value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-12 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-[#1B6B8A]"
            />
            <button
              type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-gray-400">Min. 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial</p>
        </div>

        {/* ── Établissement ── */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Building2 size={14} className="text-[#1B6B8A]" /> Établissement
          </label>

          {!creatingOrg ? (
            <div className="flex gap-2">
              <select
                value={orgId}
                onChange={(e) => { setOrgId(e.target.value); setOrgNotice(null); }}
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-[#1B6B8A]"
              >
                <option value="" disabled>Sélectionner un établissement</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCreatingOrg(true)}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:border-[#1B6B8A] hover:text-[#1B6B8A] transition-colors whitespace-nowrap"
              >
                <Plus size={15} /> Nouveau
              </button>
            </div>
          ) : (
            <div className="space-y-2 p-4 rounded-2xl border-2 border-[#1B6B8A]/30 bg-[#EBF4F8]/50">
              <p className="text-xs font-bold text-[#1B6B8A]">Nouvel établissement</p>

              {newOrgUai ? (
                // Collège choisi dans l'annuaire : tout est rempli, rien à saisir.
                <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-white">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{newOrgName}</p>
                    <p className="text-xs text-gray-400">
                      {newOrgCity} ({newOrgPostalCode}) · UAI {newOrgUai}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillNewOrg(null)}
                    className="text-xs font-semibold text-[#1B6B8A] hover:underline shrink-0"
                  >
                    Changer
                  </button>
                </div>
              ) : !manualOrg ? (
                <>
                  <CollegeSearch onSelect={fillNewOrg} onUnavailable={() => setManualOrg(true)} autoFocus />
                  <button
                    type="button"
                    onClick={() => setManualOrg(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Établissement absent de l&apos;annuaire ? Saisir à la main
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text" value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Nom de l'établissement"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
                  />
                  <div className="grid grid-cols-[1fr_9rem] gap-2">
                    <input
                      type="text" value={newOrgCity}
                      onChange={(e) => setNewOrgCity(e.target.value)}
                      placeholder="Ville"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
                    />
                    <input
                      type="text" inputMode="numeric" maxLength={5} value={newOrgPostalCode}
                      onChange={(e) => setNewOrgPostalCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="Code postal"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
                    />
                  </div>
                  <p className="text-xs text-gray-400">Le département est déduit du code postal, pour les statistiques.</p>
                  <button
                    type="button"
                    onClick={() => setManualOrg(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    Rechercher dans l&apos;annuaire
                  </button>
                </>
              )}

              {orgs.length > 0 && (
                <button
                  type="button"
                  onClick={() => { setCreatingOrg(false); fillNewOrg(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Utiliser un établissement existant
                </button>
              )}
            </div>
          )}
          {orgNotice && !creatingOrg && (
            <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">{orgNotice}</p>
          )}
        </div>

        {/* ── Erreur ── */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-2xl">{error}</p>
        )}

        {/* ── Avertissement email non envoyé ── */}
        {emailWarning ? (
          <div className="space-y-3">
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-100 px-4 py-3 rounded-2xl">
              Le compte a bien été créé, mais l&apos;email de bienvenue n&apos;a pas pu être
              envoyé. Transmets le mot de passe ci-dessus manuellement à l&apos;utilisateur.
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/comptes")}
              className="w-full py-4 bg-[#1B6B8A] text-white font-bold rounded-full text-sm shadow-lg hover:opacity-90 transition-opacity"
            >
              Retour à la liste des comptes
            </button>
          </div>
        ) : (
          /* ── Submit ── */
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-[#1B6B8A] text-white font-bold rounded-full text-sm shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Création en cours…" : "Créer le compte"}
          </button>
        )}
      </form>
    </div>
  );
}
