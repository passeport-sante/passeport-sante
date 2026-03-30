import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">

      <div className="circle-hero-green" />
      <div className="circle-hero-mauve" />

      <div className="relative z-10 h-full brand-container">
        <div className="grid grid-cols-2 gap-16 items-center min-h-[calc(100vh-72px)]">

          <div className="space-y-8">
            <div className="leading-none">
              <h1 className="text-8xl font-black text-[#1A1A1A]">Mieux</h1>
              <h1 className="text-8xl font-black text-[#1A1A1A]">Comprendre pour</h1>
              <h1 className="text-8xl font-black text-brand-green">Mieux grandir.</h1>
            </div>
            <p className="text-gray-600 text-xl max-w-lg leading-relaxed">
              Une plateforme interactive dédiée à la prévention pour les jeunes.
              Découvre nos modules sur la santé, le numérique et la gestion des risques.
            </p>
            <div className="flex flex-wrap gap-4 items-center">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-3 px-10 py-5 bg-brand-dark-green text-white font-bold rounded-full text-base shadow-lg hover:opacity-90 transition-opacity"
              >
                Commencer le parcours <ArrowRight size={20} />
              </Link>
              <Link
                href="/modules"
                className="inline-flex items-center px-10 py-5 bg-white text-gray-600 font-semibold rounded-full text-base border-2 border-gray-200 hover:border-gray-300 transition-colors"
              >
                Voir les thèmes
              </Link>
            </div>
          </div>

          <div className="flex justify-center items-center">
            <Image
              src="/assets/mascotte/mascotte-bouclier.png"
              alt="Mascotte prévention"
              width={540} height={540}
              className="drop-shadow-2xl"
              priority
            />
          </div>

        </div>
      </div>
    </section>
  );
}
