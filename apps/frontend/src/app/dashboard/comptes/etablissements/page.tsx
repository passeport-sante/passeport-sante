"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Building2, Search, Pencil, Trash2, BadgeCheck, AlertTriangle, X } from "lucide-react";
import {
  fetchOrganizations,
  deleteOrganization,
  updateOrganizationLocation,
  type Organization,
} from "@/lib/admin-users";
import { CollegeSearch } from "../_components/college-search";

type Filter = "all" | "todo" | "linked";

type Edit = {
  id: string;
  city: string;
  postalCode: string;
  uai: string | null;
  initialUai: string | null; // pour signaler une dissociation en attente
  pickedName: string | null; // nom de la fiche choisie dans l'annuaire (pour vérifier le bon collège)
};

// Gestion des établissements : rattachement à l'annuaire de l'Éducation nationale
// (UAI, ville, code postal → département pour les statistiques) et suppression
// des établissements vides. Réservée aux admins (garde du layout sur /dashboard/comptes).
export default function EtablissementsPage() {
  const token = typeof window !== "undefined" ? (localStorage.getItem("access_token") ?? "") : "";

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [edit, setEdit] = useState<Edit | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchOrganizations(token)
      .then(setOrgs)
      .catch(() => setError("Impossible de charger les établissements."))
      .finally(() => setLoading(false));
  }, [token]);

  const todoCount = orgs.filter((o) => !o.uai).length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orgs.filter((o) => {
      if (filter === "todo" && o.uai) return false;
      if (filter === "linked" && !o.uai) return false;
      if (!q) return true;
      return [o.name, o.city, o.postalCode, o.uai].some((v) => (v ?? "").toLowerCase().includes(q));
    });
  }, [orgs, search, filter]);

  function startEdit(o: Organization) {
    setError(null);
    setEdit({
      id: o.id,
      city: o.city ?? "",
      postalCode: o.postalCode ?? "",
      uai: o.uai ?? null,
      initialUai: o.uai ?? null,
      pickedName: null,
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    if (!edit.city.trim()) { setError("La ville est obligatoire."); return; }
    if (!/^\d{5}$/.test(edit.postalCode)) { setError("Le code postal doit contenir 5 chiffres."); return; }
    setError(null);
    setSaving(true);
    try {
      const updated = await updateOrganizationLocation(token, edit.id, {
        city: edit.city.trim(),
        postalCode: edit.postalCode,
        uai: edit.uai, // null : dissocie de la fiche de l'annuaire
      });
      // La réponse ne contient pas les compteurs : on garde ceux de la liste.
      setOrgs((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      setEdit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteOrganization(token, confirmDelete.id);
      setOrgs((prev) => prev.filter((o) => o.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      setConfirmDelete(null);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="brand-container py-10 space-y-6">
      <Link href="/dashboard/comptes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ChevronLeft size={16} /> Gestion des comptes
      </Link>

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Building2 size={22} className="text-[#1B6B8A]" /> Établissements
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {orgs.length} établissement{orgs.length > 1 ? "s" : ""}
          {todoCount > 0 && (
            <>
              {" — "}
              <span className="font-semibold text-amber-600">
                {todoCount} à rattacher à l&apos;annuaire
              </span>{" "}
              (sans rattachement, ils n&apos;apparaissent pas dans les filtres des statistiques)
            </>
          )}
        </p>
      </div>

      {/* Recherche + filtre */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher (nom, ville, code postal, UAI)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-[#1B6B8A]"
          />
        </div>
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 text-sm font-semibold">
          {(
            [
              { key: "all", label: "Tous" },
              { key: "todo", label: `À rattacher (${todoCount})` },
              { key: "linked", label: "Rattachés" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === f.key ? "bg-[#EBF4F8] text-[#1B6B8A]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-16">Aucun établissement trouvé.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Établissement</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Localisation</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Annuaire</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Contenu</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const c = o._count;
                  const sessions = (c?.diagnosticSessions ?? 0) + (c?.moduleSessions ?? 0);
                  const isEmpty = !!c && c.users === 0 && sessions === 0 && c.modules === 0;
                  const editing = edit?.id === o.id;
                  return (
                    <Fragment key={o.id}>
                      <tr className={`border-b border-gray-50 ${editing ? "bg-[#EBF4F8]/40" : "hover:bg-gray-50/60"}`}>
                        <td className="px-6 py-4 font-semibold text-gray-900">{o.name}</td>
                        <td className="px-4 py-4 text-gray-600">
                          {o.postalCode ? (
                            <>
                              {o.city} ({o.postalCode})
                              {o.department && <span className="text-gray-400"> · dép. {o.department}</span>}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Non renseignée</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {o.uai ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <BadgeCheck size={12} /> UAI {o.uai}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={12} /> À rattacher
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs">
                          {c
                            ? `${c.users} compte${c.users > 1 ? "s" : ""} · ${sessions} session${sessions > 1 ? "s" : ""}${c.modules ? ` · ${c.modules} module${c.modules > 1 ? "s" : ""}` : ""}`
                            : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => (editing ? setEdit(null) : startEdit(o))}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1B6B8A] hover:bg-[#EBF4F8] transition-colors"
                            >
                              {editing ? <X size={14} /> : <Pencil size={14} />}
                              {editing ? "Fermer" : o.uai ? "Modifier" : "Rattacher"}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(o)}
                              disabled={!isEmpty}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300 disabled:cursor-not-allowed"
                              title={isEmpty ? "Supprimer cet établissement" : "Impossible : l'établissement contient encore des comptes, des sessions ou des modules"}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Panneau de modification, sur toute la largeur du tableau */}
                      {editing && edit && (
                        <tr className="border-b border-gray-100 bg-[#EBF4F8]/40">
                          <td colSpan={5} className="px-6 pb-6 pt-2">
                            <div className="grid gap-6 lg:grid-cols-2">
                              <div className="space-y-2">
                                <p className="text-sm font-bold text-gray-700">1. Retrouver le collège dans l&apos;annuaire</p>
                                <p className="text-xs text-gray-500">
                                  Le choix remplit la ville, le code postal et le numéro UAI.
                                </p>
                                <CollegeSearch
                                  autoFocus
                                  onSelect={(college) =>
                                    setEdit({
                                      ...edit,
                                      city: college.city,
                                      postalCode: college.postalCode,
                                      uai: college.uai,
                                      pickedName: college.name,
                                    })
                                  }
                                />
                              </div>

                              <form onSubmit={handleSave} className="space-y-3">
                                <p className="text-sm font-bold text-gray-700">2. Vérifier puis enregistrer</p>

                                {edit.uai ? (
                                  <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-white">
                                    <div className="text-xs">
                                      <p className="font-semibold text-emerald-700 flex items-center gap-1">
                                        <BadgeCheck size={13} /> Fiche officielle : UAI {edit.uai}
                                      </p>
                                      {edit.pickedName && <p className="text-gray-500 mt-0.5">{edit.pickedName}</p>}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEdit({ ...edit, uai: null, pickedName: null })}
                                      className="text-xs font-semibold text-red-500 hover:underline shrink-0"
                                      title="Retirer le lien avec cette fiche (mauvais collège choisi)"
                                    >
                                      Dissocier
                                    </button>
                                  </div>
                                ) : edit.initialUai ? (
                                  <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-800">
                                    <p>Sera dissocié de la fiche UAI {edit.initialUai} à l&apos;enregistrement.</p>
                                    <button
                                      type="button"
                                      onClick={() => setEdit({ ...edit, uai: edit.initialUai })}
                                      className="font-semibold text-[#1B6B8A] hover:underline shrink-0"
                                    >
                                      Annuler
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    Pas de fiche de l&apos;annuaire : vous pouvez saisir la ville et le code postal à la main.
                                  </p>
                                )}

                                <div className="grid grid-cols-[1fr_8rem] gap-2">
                                  <label className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-500">Ville</span>
                                    <input
                                      type="text" required value={edit.city}
                                      onChange={(e) => setEdit({ ...edit, city: e.target.value })}
                                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
                                    />
                                  </label>
                                  <label className="space-y-1">
                                    <span className="text-xs font-semibold text-gray-500">Code postal</span>
                                    <input
                                      type="text" required inputMode="numeric" maxLength={5} value={edit.postalCode}
                                      onChange={(e) => setEdit({ ...edit, postalCode: e.target.value.replace(/\D/g, "") })}
                                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30"
                                    />
                                  </label>
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setEdit(null)}
                                    className="px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50"
                                  >
                                    Annuler
                                  </button>
                                  <button
                                    type="submit" disabled={saving}
                                    className="px-5 py-2.5 rounded-full bg-[#1B6B8A] text-white text-sm font-bold hover:opacity-90 disabled:opacity-50"
                                  >
                                    {saving ? "Enregistrement…" : "Enregistrer"}
                                  </button>
                                </div>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation de suppression */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Supprimer cet établissement ?</h2>
            <p className="text-sm text-gray-500">
              <strong>{confirmDelete.name}</strong> sera définitivement supprimé. Il ne contient ni compte, ni session, ni module.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
