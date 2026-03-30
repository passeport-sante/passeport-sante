import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-brand-bg">
      <div className="brand-container py-8 flex items-center justify-between">

        {/* Liens */}
        <div className="flex items-center text-sm text-gray-500">
          <Link href="/politique-confidentialite" className="hover:text-gray-900 transition-colors">
            Politique de confidentialité
          </Link>
          <span className="mx-4 text-gray-300">|</span>
          <Link href="/conditions-generales" className="hover:text-gray-900 transition-colors">
            Conditions Générales
          </Link>
          <span className="mx-4 text-gray-300">|</span>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            Contact
          </Link>
        </div>

        {/* Logos partenaires */}
        <div className="flex items-center gap-8">
          <Image src="/assets/logo/logo-ars.png" alt="ARS Île-de-France" width={100} height={48} className="h-12 w-auto object-contain" />
          <Image src="/assets/logo/logo-ac-versailles.png" alt="Académie de Versailles" width={80} height={48} className="h-12 w-auto object-contain" />
          <Image src="/assets/logo/logo-codes95.png" alt="CODES 95" width={120} height={48} className="h-12 w-auto object-contain" />
        </div>

      </div>
    </footer>
  );
}
