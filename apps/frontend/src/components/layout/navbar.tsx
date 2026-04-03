"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Accueil" },
    { href: "/modules", label: "Modules" },
    { href: "/contact", label: "Contact" },
  ];

  const isLoggedIn =
    typeof window !== "undefined" && !!localStorage.getItem("access_token");

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="brand-container py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0 flex items-center gap-3">
          <Image
            src="/assets/logo/logo-passeport.png"
            alt="Logo"
            width={140}
            height={44}
            className="h-11 w-auto object-contain"
          />
          <span className="text-xl font-black tracking-wide">
            <span className="text-blue-600">PASSEPORT</span>{" "}
            <span className="text-brand-green">SANTÉ</span>
          </span>
        </Link>
        <nav className="flex items-center gap-12 flex-1 justify-center">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`font-semibold text-lg transition-colors pb-0.5 ${
                  isActive
                    ? "text-blue-600 border-b-2 border-blue-500"
                    : "text-gray-900 hover:text-gray-600"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        {isLoggedIn ? (
          <>
            <Link
              href="/dashboard"
              className="shrink-0 px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
            >
              Tableau de bord
            </Link>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("access_token");
                sessionStorage.clear();
                window.location.href = "/";
              }}
              className="shrink-0 px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link
              href="/diagnostic"
              className="shrink-0 px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
            >
              Rejoindre
            </Link>
            <Link
              href="/sign-in"
              className="shrink-0 px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
