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
    if (pathname.startsWith("/dashboard/modules") && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [user, pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="brand-container py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center gap-3">
            <Image
              src="/assets/logo/logo-passeport.png"
              alt="Logo"
              width={120}
              height={38}
              className="h-8 w-auto object-contain"
            />
            <span className="text-[15px] font-bold tracking-wide">
              <span className="text-blue-600">PASSEPORT</span>{" "}
              <span className="text-brand-green">SANTÉ</span>
            </span>
          </Link>

          {/* Navigation centrale */}
          <nav className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {visibleNav.map(({ href, label, exact, adminOnly }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                    active
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {adminOnly && (
                    <Shield
                      size={12}
                      className={active ? "text-blue-600" : "text-gray-400"}
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
                <p className="text-[13px] font-semibold text-[#1A1A1A]">
                  {user.name}
                </p>
                <p className="text-[11px] text-gray-500 flex items-center justify-end gap-1">
                  {isAdmin && (
                    <Shield size={9} className="text-blue-600" strokeWidth={2.5} />
                  )}
                  {isAdmin ? "Administrateur" : "Enseignant"}
                </p>
              </div>
            )}
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              {isAdmin ? (
                <Shield size={16} className="text-gray-600" strokeWidth={2.5} />
              ) : (
                <User size={17} className="text-gray-600" />
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
