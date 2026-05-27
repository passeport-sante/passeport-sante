import Link from "next/link";
import Image from "next/image";
import { ArrowRight, KeyRound } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="brand-container">
        <div className="relative rounded-[40px] lg:rounded-[60px] overflow-hidden bg-brand-green text-white p-10 lg:p-16">
          {/* Texture pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1.2px, transparent 1.2px)",
              backgroundSize: "22px 22px",
            }}
          />

          {/* Grand halo coin haut-droit */}
          <div
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)",
              transform: "translate(30%, -40%)",
            }}
          />

          {/* "+" décoratifs */}
          <div className="absolute top-8 right-12 text-white/40 animate-float-soft">
            <svg width="32" height="32" viewBox="-12 -12 24 24" fill="none">
              <line
                x1="-10"
                y1="0"
                x2="10"
                y2="0"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <line
                x1="0"
                y1="-10"
                x2="0"
                y2="10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="relative grid grid-cols-12 gap-8 items-center">
            <div className="col-span-12 lg:col-span-8">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] mb-5 bg-white/15 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-white" />
                Prêt·e ?
              </div>
              <h2 className="font-display text-5xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">
                Ton parcours
                <br />
                t&apos;attend.
              </h2>
              <p className="text-white/90 text-lg lg:text-xl max-w-xl leading-relaxed">
                Pas besoin de compte pour commencer. Choisis un thème, fais le
                quiz, et garde ton passeport. Promis,{" "}
                <strong className="underline decoration-2 underline-offset-4">
                  c&apos;est court
                </strong>{" "}
                et c&apos;est pour toi.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/sign-in"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-brand-ink text-white font-bold rounded-full text-base hover:bg-black transition-colors"
                >
                  Commencer maintenant
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/session"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full text-base border border-white/30 transition-colors"
                >
                  <KeyRound size={16} />
                  J&apos;ai un code de session
                </Link>
              </div>
            </div>

            {/* Mascotte côté droit, légèrement débordante */}
            <div className="col-span-12 lg:col-span-4 hidden lg:flex items-end justify-center relative">
              <div className="absolute -bottom-16 -right-4">
                <Image
                  src="/assets/mascotte/mascotte-bouclier.png"
                  alt=""
                  width={320}
                  height={400}
                  className="drop-shadow-2xl animate-float-soft"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
