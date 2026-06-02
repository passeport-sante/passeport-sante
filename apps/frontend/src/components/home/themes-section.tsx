import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Theme = {
  emoji: string;
  title: string;
  body: string;
  color: string;
  tag: string;
};

const THEMES: Theme[] = [
  {
    emoji: "🌙",
    title: "Sommeil",
    body: "Pourquoi tu dors mal le dimanche soir, et comment hacker ça.",
    color: "#7FB8D9",
    tag: "Énergie",
  },
  {
    emoji: "📱",
    title: "Écrans",
    body: "TikTok, doomscroll, FOMO. Comprendre l'algo pour reprendre la main.",
    color: "#C8B6E2",
    tag: "Vie numérique",
  },
  {
    emoji: "🥑",
    title: "Alimentation",
    body: "Sortir du « bon vs mauvais ». Ce que ton corps demande, pour de vrai.",
    color: "#9CC084",
    tag: "Au quotidien",
  },
  {
    emoji: "🧠",
    title: "Santé mentale",
    body: "Stress, anxiété, charge mentale : nommer pour mieux désamorcer.",
    color: "#E8A6A6",
    tag: "Émotions",
  },
  {
    emoji: "🚬",
    title: "Addictions",
    body: "Tabac, alcool, vape. Les vraies infos, sans morale ni jugement.",
    color: "#F3D27A",
    tag: "Substances",
  },
  {
    emoji: "💞",
    title: "Vie affective",
    body: "Consentement, relations, sexualité : poser les bases qui comptent.",
    color: "#3E6A9C",
    tag: "Liens",
  },
];

export function ThemesSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-brand-ink text-white">
      {/* Background pattern dots */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* "+" décoratifs */}
      <div className="absolute top-12 right-12 text-brand-coral opacity-50">
        <PlusDeco size={28} rot={-12} />
      </div>
      <div className="absolute bottom-20 left-10 text-brand-lemon opacity-50">
        <PlusDeco size={20} rot={18} />
      </div>

      <div className="relative z-10 brand-container">
        {/* Header */}
        <div className="grid grid-cols-12 gap-8 mb-16 items-end">
          <div className="col-span-12 lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] mb-6"
              style={{ color: "#9CC084" }}
            >
              <span className="w-2 h-2 rounded-full bg-[#9CC084]" />
              12 thèmes au programme
            </div>
            <h2 className="font-display text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight">
              Tout ce qui te
              <br />
              <span className="text-brand-green italic font-handwritten">
                concerne vraiment.
              </span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <p className="text-white/70 leading-relaxed">
              Chaque module est court, indépendant, et conçu avec des pros de la
              prévention. Pas de blabla, pas de leçon — juste l&apos;info dont
              tu as besoin, quand tu en as besoin.
            </p>
          </div>
        </div>

        {/* Grille thèmes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {THEMES.map((t) => (
            <Link
              key={t.title}
              href="/modules"
              className="group relative bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 rounded-3xl p-7 transition-all overflow-hidden"
            >
              {/* Accent color blob */}
              <div
                className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-40 transition-opacity"
                style={{ background: t.color }}
              />

              <div className="relative flex items-start justify-between mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                  style={{ background: t.color }}
                >
                  {t.emoji}
                </div>
                <ArrowUpRight
                  size={20}
                  className="text-white/40 group-hover:text-white group-hover:-translate-y-1 group-hover:translate-x-1 transition-all"
                />
              </div>

              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: t.color }}
              >
                {t.tag}
              </div>
              <h3 className="font-display text-2xl font-extrabold mb-3 leading-tight">
                {t.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{t.body}</p>
            </Link>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 pt-8 border-t border-white/10">
          <div className="text-white/60 text-sm">
            ... et 6 autres thèmes à découvrir
          </div>
          <Link
            href="/modules"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-ink font-bold rounded-full hover:bg-brand-green hover:text-white transition-colors"
          >
            Voir tous les thèmes
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlusDeco({ size, rot }: { size: number; rot: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="-12 -12 24 24"
      style={{ transform: `rotate(${rot}deg)` }}
      fill="none"
    >
      <line
        x1="-10"
        y1="0"
        x2="10"
        y2="0"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="0"
        y1="-10"
        x2="0"
        y2="10"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
