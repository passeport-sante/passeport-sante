import Image from "next/image";

const STEPS = [
  {
    n: "01",
    title: "Choisis un thème",
    body: "Sommeil, écrans, émotions, alimentation… 12 univers à explorer dans l'ordre que tu veux.",
    color: "#9CC084",
  },
  {
    n: "02",
    title: "Joue, teste, démonte",
    body: "Quiz, phrases à trous, scénarios. Pas de notes, juste pour comprendre — vraiment.",
    color: "#7FB8D9",
  },
  {
    n: "03",
    title: "Repars avec ton passeport",
    body: "Garde tes acquis, suis ta progression, et reviens quand tu veux. C'est ton outil, à toi.",
    color: "#E8A6A6",
  },
];

export function AboutSection() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Halo blob bas-gauche */}
      <div
        className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "var(--color-circle-green)", opacity: 0.6 }}
      />
      <div
        className="absolute top-[40%] -right-24 w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: "var(--color-circle-blue)", opacity: 0.45 }}
      />

      <div className="relative z-10 brand-container">
        {/* Header éditorial : kicker + titre + intro */}
        <div className="grid grid-cols-12 gap-8 mb-16 lg:mb-24">
          <div className="col-span-12 lg:col-span-5">
            <div className="kicker mb-6">Comment ça marche</div>
            <h2 className="font-display text-5xl lg:text-6xl font-black text-brand-ink leading-[0.95] tracking-tight">
              C&apos;est quoi <br />
              le <span className="accent-handwritten">passeport</span> ?
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="text-lg text-gray-600 leading-relaxed">
              Un parcours numérique interactif qui t&apos;accompagne sur les grands
              enjeux santé : pas en mode magistral, en mode{" "}
              <strong className="text-brand-ink">on-explore-ensemble</strong>.
              Modules courts, indépendants, et taillés pour ta vie réelle.
            </p>
          </div>
        </div>

        {/* Timeline 3 étapes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {STEPS.map((s, i) => (
            <article
              key={s.n}
              className="relative group"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Numéro géant outline */}
              <div
                className="font-display font-black leading-none select-none"
                style={{
                  fontSize: "9rem",
                  WebkitTextStroke: `2px ${s.color}`,
                  color: "transparent",
                  letterSpacing: "-0.05em",
                }}
              >
                {s.n}
              </div>

              {/* Trait décoratif */}
              <div
                className="h-1 w-16 rounded-full mb-5 -mt-4 transition-all group-hover:w-24"
                style={{ background: s.color }}
              />

              <h3 className="font-display text-2xl font-extrabold text-brand-ink mb-3">
                {s.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-base">
                {s.body}
              </p>

              {/* Connector line (sauf dernier) */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-16 -right-3 w-6 h-px">
                  <svg viewBox="0 0 24 4" className="w-full h-1">
                    <path
                      d="M 0 2 L 22 2"
                      stroke={s.color}
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Pull-quote éditorial */}
        <div className="mt-24 lg:mt-32 max-w-4xl mx-auto relative">
          <div
            className="font-display text-brand-dark-green opacity-20 absolute -top-12 -left-2 select-none"
            style={{ fontSize: "9rem", lineHeight: 1, fontWeight: 900 }}
            aria-hidden
          >
            “
          </div>
          <blockquote className="font-display text-3xl lg:text-4xl font-bold text-brand-ink leading-snug relative">
            La santé, ce n&apos;est pas juste « ne pas être malade ».
            C&apos;est avoir l&apos;énergie pour tes projets,{" "}
            <span className="text-brand-dark-green">
              comprendre tes émotions
            </span>{" "}
            et savoir faire des choix qui TE font du bien.
          </blockquote>
          <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
            <Image
              src="/assets/mascotte/mascotte-bouclier.png"
              alt=""
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div>
              <div className="font-bold text-brand-ink">L&apos;équipe Passeport Santé</div>
              <div>CODES 95 · Académie de Versailles · ARS Île-de-France</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
