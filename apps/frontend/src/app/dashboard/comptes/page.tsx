"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Plus, Trash2, Shield, User, Building2, Search,
  MoreVertical, KeyRound, Ban, CheckCircle2, Copy, Check, MailCheck, MailX,
} from "lucide-react";
import {
  fetchAllUsers, deleteAccount, resetUserPassword, setSuspended,
  fetchOrganizations, deleteOrganization,
  type AccountUser, type Organization,
} from "@/lib/admin-users";

function RoleBadge({ role }: { role: "ADMIN" | "TRAINER" }) {
  return role === "ADMIN" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Shield size={11} /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#1B6B8A]">
      <User size={11} /> Établissement
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (
    <div className="w-9 h-9 rounded-full bg-[#EBF4F8] flex items-center justify-center text-[#1B6B8A] text-xs font-black shrink-0">
      {letters.toUpperCase()}
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      {children}
    </div>,
    document.body,
  );
}

export default function ComptesPage() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AccountUser | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());

  const [resetModal, setResetModal] = useState<{ user: AccountUser; newPassword: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Gestion des établissements
  const [orgsModal, setOrgsModal] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgDeleting, setOrgDeleting] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? (localStorage.getItem("access_token") ?? "") : "";

  useEffect(() => { setMounted(true); }, []);

  async function load() {
    try {
      const data = await fetchAllUsers(token);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function openOrgsModal() {
    setOrgError(null);
    setOrgsModal(true);
    try {
      setOrgs(await fetchOrganizations(token));
    } catch {
      setOrgError("Impossible de charger les établissements.");
    }
  }

  async function handleDeleteOrg(id: string) {
    setOrgError(null);
    setOrgDeleting(id);
    try {
      await deleteOrganization(token, id);
      setOrgs((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setOrgError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    } finally {
      setOrgDeleting(null);
    }
  }

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      const portalEl = portalMenuRef.current;
      const buttonEl = buttonRefs.current.get(menuOpen!);
      if (
        portalEl && !portalEl.contains(e.target as Node) &&
        buttonEl && !buttonEl.contains(e.target as Node)
      ) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  function handleToggleMenu(userId: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (menuOpen === userId) {
      setMenuOpen(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    setMenuOpen(userId);
  }

  async function handleDelete(user: AccountUser) {
    await deleteAccount(token, user.id);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setConfirmDelete(null);
  }

  async function handleResetPassword(user: AccountUser) {
    setMenuOpen(null);
    setActionLoading(true);
    try {
      const { password, emailSent } = await resetUserPassword(token, user.id);
      setResetModal({ user, newPassword: password, emailSent });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleSuspend(user: AccountUser) {
    setMenuOpen(null);
    setActionLoading(true);
    try {
      await setSuspended(token, user.id, !user.isSuspended);
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u),
      );
    } finally {
      setActionLoading(false);
    }
  }

  function copyPassword(pwd: string) {
    navigator.clipboard.writeText(pwd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const admins = users.filter((u) => u.role === "ADMIN").length;
  const trainers = users.filter((u) => u.role === "TRAINER").length;

  const menuUser = users.find((u) => u.id === menuOpen) ?? null;

  return (
    <div className="brand-container py-10 space-y-8">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Gestion des comptes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} compte{users.length > 1 ? "s" : ""} —{" "}
            {admins} admin{admins > 1 ? "s" : ""}, {trainers} établissement{trainers > 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openOrgsModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-full hover:bg-gray-50 transition-colors"
          >
            <Building2 size={16} />
            Établissements
          </button>
          <Link
            href="/dashboard/comptes/nouveau"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B6B8A] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Créer un compte
          </Link>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un compte…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B6B8A]/30 focus:border-[#1B6B8A]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
            <User size={32} strokeWidth={1.5} />
            <p className="text-sm font-medium">Aucun compte trouvé</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Compte</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Rôle</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Building2 size={13} /> Établissement</span>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Créé le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-gray-50/50 transition-colors ${u.isSuspended ? "opacity-60" : ""}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Initials name={u.name} />
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-4 text-gray-600">
                    {u.organization?.name ?? <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-4 py-4">
                    {u.isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-600">
                        <Ban size={10} /> Suspendu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={10} /> Actif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      ref={(el) => { buttonRefs.current.set(u.id, el); }}
                      onClick={(e) => handleToggleMenu(u.id, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        menuOpen === u.id
                          ? "bg-gray-100 text-gray-700"
                          : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                      disabled={actionLoading}
                    >
                      <MoreVertical size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Dropdown menu via Portal (échappe le overflow-hidden de la table) ── */}
      {mounted && menuOpen && menuPos && menuUser && createPortal(
        <div
          ref={portalMenuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 9998 }}
          className="w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1"
        >
          <button
            onClick={() => handleResetPassword(menuUser)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <KeyRound size={14} className="text-[#1B6B8A]" />
            Réinitialiser le mot de passe
          </button>
          <button
            onClick={() => handleToggleSuspend(menuUser)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
              menuUser.isSuspended
                ? "text-emerald-600 hover:bg-emerald-50"
                : "text-orange-600 hover:bg-orange-50"
            }`}
          >
            <Ban size={14} />
            {menuUser.isSuspended ? "Réactiver le compte" : "Suspendre temporairement"}
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => { setMenuOpen(null); setConfirmDelete(menuUser); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Supprimer le compte
          </button>
        </div>,
        document.body,
      )}

      {/* ── Modal mot de passe réinitialisé ── */}
      {mounted && resetModal && (
        <Modal>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EBF4F8] flex items-center justify-center shrink-0">
                <KeyRound size={20} className="text-[#1B6B8A]" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">Mot de passe réinitialisé</h2>
                <p className="text-xs text-gray-400">{resetModal.user.name}</p>
              </div>
            </div>
            {resetModal.emailSent ? (
              <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <MailCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700">
                  Un email contenant le nouveau mot de passe a été envoyé à{" "}
                  <strong className="break-all">{resetModal.user.email}</strong>.
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <MailX size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  L&apos;email n&apos;a pas pu être envoyé. Transmettez le mot de passe manuellement à l&apos;utilisateur.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Le mot de passe ne sera plus affiché après fermeture.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-3">
              <span className="flex-1 font-mono text-sm font-bold text-[#1A1A1A] tracking-wider break-all">
                {resetModal.newPassword}
              </span>
              <button
                onClick={() => copyPassword(resetModal.newPassword)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
              >
                {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              </button>
            </div>
            <button
              onClick={() => { setResetModal(null); setCopied(false); }}
              className="w-full py-2.5 bg-[#1B6B8A] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal confirmation suppression ── */}
      {mounted && confirmDelete && (
        <Modal>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Supprimer ce compte ?</h2>
            <p className="text-sm text-gray-500">
              Le compte de <strong>{confirmDelete.name}</strong> sera définitivement supprimé.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:opacity-90 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal gestion des établissements ── */}
      {mounted && orgsModal && (
        <Modal>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EBF4F8] flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-[#1B6B8A]" />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900">Établissements</h2>
                <p className="text-xs text-gray-400">Supprimer un établissement vide</p>
              </div>
            </div>

            {orgError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{orgError}</p>
            )}

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 -mx-2">
              {orgs.length === 0 ? (
                <p className="text-sm text-gray-400 italic px-2 py-4">Aucun établissement.</p>
              ) : (
                orgs.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 px-2 py-3">
                    <span className="text-sm font-semibold text-gray-800 truncate">{o.name}</span>
                    <button
                      onClick={() => handleDeleteOrg(o.id)}
                      disabled={orgDeleting === o.id}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Supprimer cet établissement"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setOrgsModal(false)}
              className="w-full py-2.5 bg-[#1B6B8A] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
            >
              Fermer
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
