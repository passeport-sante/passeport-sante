"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Shield } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

type NavItem = { href: string; label: string; exact: boolean; adminOnly?: boolean };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Vue Générale", exact: true },
  { href: "/dashboard/sessions/terminated", label: "Sessions Terminées", exact: false },
  { href: "/dashboard/stats", label: "Statistiques école", exact: false },
  { href: "/dashboard/modules", label: "Modules", exact: false, adminOnly: true },
  { href: "/dashboard/comptes", label: "Comptes", exact: false, adminOnly: true },
];

type UserProfile = {
  name: string;
  email: string;
  role?: "ADMIN" | "TRAINER";
  organization?: { name: string };
};

function decodeJwt(token: string): { sub: string } {
  return JSON.parse(atob(token.split(".")[1]!));
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/sign-in");
      return;
    }

    setReady(true);

    try {
      const { sub } = decodeJwt(token);
      fetch(`${API}/api/user/${sub}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => setUser(data))
        .catch(() => {});
    } catch {}
  }, [router]);

  // Garde-fou : un éducateur qui tape l'URL /dashboard/modules/* est renvoyé sur le dashboard
  useEffect(() => {
    if (!user) return;
    if (
      (pathname.startsWith("/dashboard/modules") || pathname.startsWith("/dashboard/comptes")) &&
      user.role !== "ADMIN"
    ) {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#2A8970] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  const visibleNav = NAV.filter((item) => !item.adminOnly || user?.role === "ADMIN");
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Navbar — même style que l'accueil */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="brand-container py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-3">
            <Image
              src="/assets/logo/logo-passeport.png"
              alt="Logo"
              width={120}
              height={38}
              className="h-9 w-auto object-contain"
            />
            <span className="text-lg font-black tracking-wide">
              <span className="text-blue-600">PASSEPORT</span>{" "}
              <span className="text-brand-green">SANTÉ</span>
            </span>
          </Link>

          {/* Navigation centrale */}
          <nav className="flex items-center bg-gray-100 rounded-full p-1 gap-1">
            {visibleNav.map(({ href, label, exact, adminOnly }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-white text-[#1B6B8A] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {adminOnly && (
                    <Shield
                      size={13}
                      className={active ? "text-[#1B6B8A]" : "text-amber-500"}
                      strokeWidth={2.5}
                    />
                  )}
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="shrink-0 flex items-center gap-3">
            {user && (
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {isAdmin ? "Administrateur" : "Enseignant"}
                </p>
                <p className="text-xs text-gray-400">{user.name}</p>
              </div>
            )}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                isAdmin
                  ? "bg-amber-50 border-amber-300/50"
                  : "bg-[#EBF4F8] border-[#1B6B8A]/20"
              }`}
            >
              {isAdmin ? (
                <Shield size={18} className="text-amber-600" strokeWidth={2.5} />
              ) : (
                <User size={20} className="text-[#1B6B8A]" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main>{children}</main>
    </div>
  );
}
