import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";

const CIRCLE_BLUE = "#7FB8D9";
const CIRCLE_NAVY = "#3E6A9C";
const CIRCLE_SAGE = "#9CC084";
const INK = "#0F1B2D";

const circlesStyles: Record<string, CSSProperties> = {
  wrap: { position: "relative", width: 470, height: 280 },
  fills: { position: "absolute", inset: 0, isolation: "isolate" },
  circle: { position: "absolute", width: 245, height: 175, borderRadius: "50%", opacity: 0.78, mixBlendMode: "multiply" },
  circleTop: { background: CIRCLE_BLUE, top: 0, left: 88 },
  circleBL:  { background: CIRCLE_NAVY, top: 95, left: 0 },
  circleMR:  { background: CIRCLE_SAGE, top: 75, left: 225 },
  label: { position: "absolute", width: 180, textAlign: "center", zIndex: 5 },
  labelTop: { top: 25,  left: 120 },
  labelBL:  { top: 150, left: 30  },
  labelMR:  { top: 110, left: 255 },
  title: { margin: "0 0 6px", fontSize: 14, fontWeight: 800, color: INK, letterSpacing: "-0.01em" },
  text:  { margin: 0, fontSize: 14, lineHeight: 1.35, color: INK, fontWeight: 500 },
};

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      <div className="circle-hero-green -translate-y-6" />
      <div className="circle-hero-mauve" />

      <div className="relative z-10 brand-container flex flex-col min-h-[calc(100vh-72px)]">

        {/* Zone titre */}
        <div className="relative pt-6 pb-2">
          <div className="max-w-[58%]">
            <h1 className="text-[clamp(2.5rem,4.2vw,4.5rem)] font-black text-[#1A1A1A] leading-none whitespace-nowrap">
              Ton corps, tes choix
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mt-10 max-w-lg">
              Marre qu&apos;on te dise quoi faire sans t&apos;expliquer pourquoi ?
              Ici, c&apos;est toi qui prends les commandes. Mon Passeport Santé, ce n&apos;est pas un cours de plus,
              c&apos;est ton outil perso pour comprendre comment tu fonctionnes et devenir le seul expert de ta propre vie.
            </p>
          </div>

          <h1
            className="absolute top-1 right-55 font-black text-brand-green leading-none select-none pointer-events-none"
            style={{
              fontSize: "6rem",
              transform: "rotate(-12deg)",
              transformOrigin: "right center",
              filter: "drop-shadow(2px 4px 10px rgba(0,0,0,0.25))",
            }}
          >
            Ta santé
          </h1>
        </div>

        {/* Zone inférieure */}
        <div className="flex flex-1 items-center gap-8 pb-10">

          {/* Mascotte */}
          <div className="flex-shrink-0">
            <Image
              src="/assets/mascotte/mascotte-bouclier.png"
              alt="Mascotte prévention"
              width={370}
              height={450}
              className="drop-shadow-2xl"
              priority
            />
          </div>

          {/* Centre : C'est quoi + 3 bulles */}
          <div className="flex-1 space-y-3">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] leading-snug">
              C&apos;est quoi le{" "}
              <span className="text-brand-green">passeport santé ?</span>
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-[400px]">
              Parce que la santé, ce n&apos;est pas juste « ne pas être malade ». C&apos;est avoir
              l&apos;énergie pour tes projets, comprendre tes émotions et savoir faire des
              choix qui TE font du bien.
            </p>

            {/* Three overlapping circles */}
            <div style={circlesStyles.wrap}>
              <div style={circlesStyles.fills} aria-hidden="true">
                <div style={{ ...circlesStyles.circle, ...circlesStyles.circleTop }} />
                <div style={{ ...circlesStyles.circle, ...circlesStyles.circleBL }} />
                <div style={{ ...circlesStyles.circle, ...circlesStyles.circleMR }} />
              </div>

              <div style={{ ...circlesStyles.label, ...circlesStyles.labelTop }}>
                <h3 style={circlesStyles.title}>Zéro pression</h3>
                <p style={circlesStyles.text}>Teste tes connaissances<br />sans notes, juste pour toi.</p>
              </div>
              <div style={{ ...circlesStyles.label, ...circlesStyles.labelBL }}>
                <h3 style={circlesStyles.title}>Prends le pouvoir</h3>
                <p style={circlesStyles.text}>Plus tu en sais, moins on<br />peut décider à ta place.</p>
              </div>
              <div style={{ ...circlesStyles.label, ...circlesStyles.labelMR }}>
                <h3 style={circlesStyles.title}>Deviens incollable</h3>
                <p style={circlesStyles.text}>Démonte les idées reçues<br />et les fake news qui<br />traînent sur les réseaux.</p>
              </div>
            </div>
          </div>

          {/* Boutons — droite */}
          <div className="flex-shrink-0 flex flex-col gap-4 -mt-40">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-3 px-8 py-5 bg-brand-dark-green text-white font-bold rounded-full text-base shadow-lg hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Commencer le parcours <ArrowRight size={18} />
            </Link>
            <Link
              href="/modules"
              className="inline-flex items-center justify-center px-8 py-5 bg-white text-gray-700 font-bold rounded-2xl text-base border-2 border-gray-200 hover:border-brand-dark-green hover:text-brand-dark-green transition-colors whitespace-nowrap"
            >
              Voir les thèmes
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
