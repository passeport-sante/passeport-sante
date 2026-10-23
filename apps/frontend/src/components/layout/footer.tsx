import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-brand-bg">
      <div className="brand-container py-6 md:py-8 flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Liens */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-500">
          <Link href="/tutoriel" className="hover:text-gray-900 transition-colors">
            Tutoriel
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/politique-confidentialite" className="hover:text-gray-900 transition-colors">
            Politique de confidentialité
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/conditions-generales" className="hover:text-gray-900 transition-colors">
            Conditions Générales
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            Contact
          </Link>
        </div>

        {/* Logos partenaires */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
          <Image src="/assets/logo/logo-ars.png" alt="ARS Île-de-France" width={100} height={48} className="h-9 sm:h-12 w-auto object-contain" />
          <Image src="/assets/logo/logo-ac-versailles.png" alt="Académie de Versailles" width={80} height={48} className="h-9 sm:h-12 w-auto object-contain" />
          <Image src="/assets/logo/logo-codes95.png" alt="CODES 95" width={120} height={48} className="h-9 sm:h-12 w-auto object-contain" />
        </div>

      </div>
    </footer>
  );
}
