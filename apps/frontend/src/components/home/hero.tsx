import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CSSProperties } from "react";
import { PhoneSvg } from "./phone-svg";
import { PhoneVideo } from "./phone-video";
import { TaSanteSvg } from "./ta-sante-svg";

const INK = "#0F1B2D";

// Reflet spéculaire blanc commun (haut-gauche) — donne l'effet sphère vitrée
const GLOSS =
  "radial-gradient(circle at 38% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.35) 16%, rgba(255,255,255,0) 46%)";

// Helper : fond glossy = reflet + corps blanc translucide au centre, couleur repoussée au bord
// (alpha en hex 8 chiffres : 66 ≈ 40%, b3 ≈ 70%)
function glossyBg(mid: string, edge: string) {
  return (
    `${GLOSS}, radial-gradient(circle at 50% 44%, ` +
    `rgba(255,255,255,0.92) 0%, ` +
    `rgba(255,255,255,0.6) 42%, ` +
    `${mid}66 72%, ` +
    `${edge}b3 100%)`
  );
}

const circlesStyles: Record<string, CSSProperties> = {
  wrap: { position: "relative", width: 470, height: 280 },
  fills: { position: "absolute", inset: 0, isolation: "isolate" },
  circle: {
    position: "absolute",
    width: 245,
    height: 175,
    borderRadius: "50%",
  },
  // Bulles glossy : reflet + volume radial + inner shadow colorée (profondeur) + ombre portée douce
  circleTop: {
    background: glossyBg("#7FB8D9", "#5891ba"),
    top: 0,
    left: 88,
    boxShadow:
      "inset 0 3px 36px 2px #5891ba, 0 14px 30px -14px rgba(15,27,45,0.28)",
  },
  circleBL: {
    background: glossyBg("#3E6A9C", "#2f527a"),
    top: 95,
    left: 0,
    boxShadow:
      "inset 0 3px 36px 2px #2f527a, 0 14px 30px -14px rgba(15,27,45,0.28)",
  },
  circleMR: {
    background: glossyBg("#9CC084", "#79a35f"),
    top: 75,
    left: 225,
    boxShadow:
      "inset 0 3px 36px 2px #79a35f, 0 14px 30px -14px rgba(15,27,45,0.28)",
  },
  label: {
    position: "absolute",
    width: 180,
    textAlign: "center",
    zIndex: 5,
  },
  labelTop: { top: 25, left: 120 },
  labelBL: { top: 150, left: 30 },
  labelMR: { top: 110, left: 255 },
  title: {
    margin: "0 0 6px",
    fontSize: 14,
    fontWeight: 800,
    color: INK,
    letterSpacing: "-0.01em",
  },
  text: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.35,
    color: INK,
    fontWeight: 500,
  },
};

export function Hero() {
  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden">
      {/* Halo vert (haut gauche) — on garde, on enlève le mauve */}
      <div className="circle-hero-green -translate-y-6" />

      {/* SVG décoratifs — 1 et 2 plus gros, 2 remonté */}
      <DecoSvg src="/assets/background/1.svg" className="-top-[17%] -right-[16%] w-[760px] opacity-30" rot={-6} />
      <DecoSvg src="/assets/background/2.svg" className="top-[14%] -right-[12%] w-[740px] opacity-30" rot={10} />
      <DecoSvg src="/assets/background/3.svg" className="top-[60%] -right-[10%] w-[640px] opacity-30" rot={-4} />
      <DecoSvg src="/assets/background/4.svg" className="-bottom-[-14%] -right-[15%] w-[580px] opacity-30" rot={8} />

      <div className="relative z-10 brand-container flex flex-col min-h-[calc(100vh-72px)]">
        {/* ─── Zone TITRE ──────────────────────────────────────── */}
        <div className="relative pt-6 pb-2">
          <div className="max-w-full lg:max-w-[58%]">
            <h1 className="font-display text-[clamp(2rem,7vw,4.5rem)] font-black text-brand-ink leading-none lg:whitespace-nowrap tracking-tight">
              Ton corps, tes choix
            </h1>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mt-6 md:mt-10 max-w-lg">
              Marre qu&apos;on te dise quoi faire sans t&apos;expliquer pourquoi&nbsp;?
              Ici, c&apos;est toi qui prends les commandes. Mon Passeport Santé,
              ce n&apos;est pas un cours de plus, c&apos;est ton outil perso pour
              comprendre comment tu fonctionnes et devenir le seul expert de ta
              propre vie.
            </p>
          </div>

          {/* "Ta santé" — SVG : bold sans-serif, gradient vert→bleu, inner shadow vert,
                          + blur vert dégradé tout autour (drop-shadows empilés) */}
          <div
            className="absolute select-none pointer-events-none hidden lg:block"
            style={{
              top: "50px",
              left: "calc(44% + 8px)",
              transform: "rotate(-8deg)",
              transformOrigin: "left center",
              width: "37vw"
            }}
          >
            <TaSanteSvg className="w-full h-auto" />
          </div>
        </div>

        {/* ─── Zone INFÉRIEURE : 3 colonnes ───────────────────── */}
        <div className="flex flex-col lg:flex-row flex-1 items-center lg:items-start gap-8 pb-10 pt-4">
          {/* Colonne 1 : téléphone avec vidéo mascotte */}
          <div className="flex-shrink-0">
            <PhoneSvg
              className="w-[220px] sm:w-[280px] lg:w-[320px] h-auto"
              stroke="#1F6F8B"
              accent="#1F6F8B"
              screen={<PhoneVideo />}
            />
          </div>

          {/* Colonne 2 : "C'est quoi" + 3 bulles venn — remontée */}
          <div className="flex-1 space-y-3 lg:-mt-4 text-center lg:text-left">
            <h2 className="font-display text-2xl font-extrabold text-brand-ink leading-snug">
              C&apos;est quoi le{" "}
              <span className="text-brand-green">passeport santé&nbsp;?</span>
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed max-w-[400px] mx-auto lg:mx-0">
              Parce que la santé, ce n&apos;est pas juste « ne pas être malade ».
              C&apos;est avoir l&apos;énergie pour tes projets, comprendre tes
              émotions et savoir faire des choix qui TE font du bien.
            </p>

            {/* Version mobile : liste simple des 3 atouts (le venn en px ne tient pas) */}
            <div className="lg:hidden space-y-3 pt-2 text-left">
              {[
                { t: "Zéro pression", d: "Teste tes connaissances sans notes, juste pour toi." },
                { t: "Prends le pouvoir", d: "Plus tu en sais, moins on peut décider à ta place." },
                { t: "Deviens incollable", d: "Démonte les idées reçues et les fake news des réseaux." },
              ].map((it) => (
                <div key={it.t} className="bg-white/70 rounded-2xl px-4 py-3 shadow-sm">
                  <h3 className="font-bold text-brand-ink text-sm">{it.t}</h3>
                  <p className="text-gray-600 text-sm mt-0.5">{it.d}</p>
                </div>
              ))}
            </div>

            {/* 3 cercles overlappants — desktop uniquement */}
            <div style={circlesStyles.wrap} className="hidden lg:block">
              <div style={circlesStyles.fills} aria-hidden="true">
                <div
                  style={{ ...circlesStyles.circle, ...circlesStyles.circleTop }}
                />
                <div
                  style={{ ...circlesStyles.circle, ...circlesStyles.circleBL }}
                />
                <div
                  style={{ ...circlesStyles.circle, ...circlesStyles.circleMR }}
                />
              </div>

              <div style={{ ...circlesStyles.label, ...circlesStyles.labelTop }}>
                <h3 style={circlesStyles.title}>Zéro pression</h3>
                <p style={circlesStyles.text}>
                  Teste tes connaissances
                  <br />
                  sans notes, juste pour toi.
                </p>
              </div>
              <div style={{ ...circlesStyles.label, ...circlesStyles.labelBL }}>
                <h3 style={circlesStyles.title}>Prends le pouvoir</h3>
                <p style={circlesStyles.text}>
                  Plus tu en sais, moins on
                  <br />
                  peut décider à ta place.
                </p>
              </div>
              <div style={{ ...circlesStyles.label, ...circlesStyles.labelMR }}>
                <h3 style={circlesStyles.title}>Deviens incollable</h3>
                <p style={circlesStyles.text}>
                  Démonte les idées reçues
                  <br />
                  et les fake news qui
                  <br />
                  traînent sur les réseaux.
                </p>
              </div>
            </div>
          </div>

          {/* Colonne 3 : CTAs */}
          <div className="flex-shrink-0 flex flex-col gap-4 w-full sm:w-auto lg:mt-12">
            <Link
              href="/sign-in"
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 lg:py-5 bg-brand-dark-green text-white font-bold rounded-full text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              Commencer le parcours
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              href="/modules"
              className="inline-flex items-center justify-center px-8 py-4 lg:py-5 bg-white text-brand-ink font-bold rounded-2xl text-base border-2 border-blue-200 hover:border-blue-500 hover:text-blue-500 transition-colors whitespace-nowrap"
            >
              Voir les thèmes
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Petit composant SVG décoratif positionné absolu ─────── */
function DecoSvg({
  src,
  className,
  rot = 0,
}: {
  src: string;
  className?: string;
  rot?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={{ transform: `rotate(${rot}deg)`, zIndex: 1 }}
    >
      <img src={src} alt="" className="w-full h-auto select-none" />
    </div>
  );
}
