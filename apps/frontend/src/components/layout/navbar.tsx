"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, UserKey, Menu, X } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(!!localStorage.getItem("access_token"));
  }, []);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: "/", label: "Accueil" },
    { href: "/modules", label: "Modules" },
    { href: "/contact", label: "Contact" },
  ];

  function logout() {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    window.location.href = "/";
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="brand-container py-4 md:py-5 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center gap-2 md:gap-3">
          <Image
            src="/assets/logo/logo-passeport.png"
            alt="Logo"
            width={140}
            height={44}
            className="h-9 md:h-11 w-auto object-contain"
          />
          <span className="text-base md:text-xl font-black tracking-wide">
            <span className="text-brand-blue">PASSEPORT</span>{" "}
            <span className="text-brand-green">SANTÉ</span>
          </span>
        </Link>

        {/* Nav centrale — desktop */}
        <nav className="hidden md:flex items-center gap-8 lg:gap-12 flex-1 justify-center">
          {links.map(({ href, label }) => {
            const isActive = mounted && pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`font-semibold text-base lg:text-lg transition-colors pb-0.5 ${
                  isActive
                    ? "text-brand-blue border-b-2 border-brand-blue"
                    : "text-gray-900 hover:text-gray-600"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Actions — desktop */}
        <div className="hidden md:flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="shrink-0 px-6 lg:px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
              >
                Tableau de bord
              </Link>
              <button type="button" onClick={logout} className="text-gray-900 hover:text-gray-600 transition-colors">
                <LogIn size={28} strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/session"
                className="shrink-0 px-6 lg:px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
              >
                Rejoindre
              </Link>
              <Link
                href="/sign-in"
                className={`transition-colors ${
                  mounted && pathname === "/sign-in" ? "text-brand-blue" : "text-gray-900 hover:text-gray-600"
                }`}
              >
                <UserKey size={28} strokeWidth={2} />
              </Link>
            </>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 -mr-2 text-gray-800"
          aria-label="Menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Panneau mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="brand-container py-4 flex flex-col gap-1">
            {links.map(({ href, label }) => {
              const isActive = mounted && pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`py-3 px-2 rounded-lg font-semibold text-lg ${
                    isActive ? "text-brand-blue bg-brand-blue/5" : "text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-3">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    className="w-full text-center px-6 py-3 bg-brand-green text-white font-semibold rounded-full shadow-md"
                  >
                    Tableau de bord
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-full"
                  >
                    <LogIn size={20} /> Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/session"
                    className="w-full text-center px-6 py-3 bg-brand-green text-white font-semibold rounded-full shadow-md"
                  >
                    Rejoindre une session
                  </Link>
                  <Link
                    href="/sign-in"
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-full"
                  >
                    <UserKey size={20} /> Se connecter
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
