"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Shield, User, Building2, Search } from "lucide-react";
import { fetchAllUsers, deleteAccount, type AccountUser } from "@/lib/admin-users";

function RoleBadge({ role }: { role: "ADMIN" | "TRAINER" }) {
  return role === "ADMIN" ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
      <Shield size={11} /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#1B6B8A]">
      <User size={11} /> Formateur
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

export default function ComptesPage() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AccountUser | null>(null);

  const token = typeof window !== "undefined" ? (localStorage.getItem("access_token") ?? "") : "";

  async function load() {
    try {
      const data = await fetchAllUsers(token);
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(user: AccountUser) {
    await deleteAccount(token, user.id);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    setConfirmDelete(null);
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const admins = users.filter((u) => u.role === "ADMIN").length;
  const trainers = users.filter((u) => u.role === "TRAINER").length;

  return (
    <div className="brand-container py-10 space-y-8">
      {/* ── En-tête ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Gestion des comptes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {users.length} compte{users.length > 1 ? "s" : ""} —{" "}
            {admins} admin{admins > 1 ? "s" : ""}, {trainers} formateur{trainers > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/comptes/nouveau"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B6B8A] text-white text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          Créer un compte
        </Link>
      </div>

      {/* ── Recherche ── */}
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

      {/* ── Table ── */}
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
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Créé le</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Initials name={u.name} />
                      <div>
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-4 text-gray-600">
                    {u.organization?.name ?? <span className="text-gray-300 italic">—</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => setConfirmDelete(u)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal confirmation suppression ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center space-y-4">
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
        </div>
      )}
    </div>
  );
}
