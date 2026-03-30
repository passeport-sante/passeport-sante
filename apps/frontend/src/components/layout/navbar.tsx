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

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="brand-container py-5 flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image
            src="/assets/logo/logo-passeport.png"
            alt="Logo"
            width={140}
            height={44}
            className="h-11 w-auto object-contain"
          />
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

        <Link
          href="/sign-in"
          className="shrink-0 px-8 py-3 bg-brand-green text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-md text-sm"
        >
          Faire le quiz
        </Link>
      </div>
    </header>
  );
}
