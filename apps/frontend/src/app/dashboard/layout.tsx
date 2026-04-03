"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const NAV = [
  { href: "/dashboard", label: "Vue Générale", exact: true },
  { href: "/dashboard/sessions/terminated", label: "Sessions Terminées", exact: false },
  { href: "/dashboard/stats", label: "Statistiques école", exact: false },
];

type UserProfile = { name: string; email: string; organization?: { name: string } };

function decodeJwt(token: string): { sub: string } {
  return JSON.parse(atob(token.split(".")[1]));
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
            {NAV.map(({ href, label, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    active
                      ? "bg-white text-[#1B6B8A] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="shrink-0 flex items-center gap-3">
            {user && (
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-[#1A1A1A]">Enseignant</p>
                <p className="text-xs text-gray-400">{user.name}</p>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-[#EBF4F8] border-2 border-[#1B6B8A]/20 flex items-center justify-center">
              <User size={20} className="text-[#1B6B8A]" />
            </div>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main>{children}</main>
    </div>
  );
}
