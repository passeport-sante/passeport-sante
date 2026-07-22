import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { mascotteUrl } from "@/lib/mascotte";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Module = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  duration: number | null;
  mascotte: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  colorCard: string | null;
  colorCardSecondary: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  modules: Module[];
};


// Couleurs de repli si la BDD ne renvoie pas de couleurs
const FALLBACK_PRIMARY   = "#EDF3FF";
const FALLBACK_SECONDARY = "#C7DCFF";

// ── Composant ─────────────────────────────────────────────────────────────────

export function BubbleCard({ module }: { module: Module }) {
  const mascotteSrc  = mascotteUrl(module.mascotte, "card");
  const bgLeft       = module.colorCard      ?? module.colorPrimary   ?? FALLBACK_PRIMARY;
  const bgLeftCircle = module.colorCardSecondary ?? module.colorSecondary ?? FALLBACK_SECONDARY;

  return (
    <article className="group flex bg-white rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out hover:-translate-y-1 h-[200px]">

      {/* ── Zone mascotte ── fond clipé séparé + mascotte centrée */}
      <div className="relative w-[38%] flex-shrink-0 flex items-center justify-center p-3">

        {/* Fond coloré — clipé aux coins arrondis, ne contient PAS la mascotte */}
        <div
          className="absolute inset-0 rounded-l-[28px] overflow-hidden"
          style={{ background: bgLeft }}
          aria-hidden="true"
        >
          <div
            className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full opacity-70"
            style={{ background: bgLeftCircle }}
          />
        </div>

        {/* Mascotte — centrée dans la zone */}
        {mascotteSrc && (
          <div className="relative z-20 w-full h-full transition-transform duration-500 ease-in-out group-hover:-translate-y-1.5">
            <Image
              src={mascotteSrc}
              alt={module.title}
              fill
              className="object-contain object-center"
            />
          </div>
        )}
      </div>

      {/* ── Zone contenu ── */}
      <div className="flex flex-col justify-between flex-1 px-6 py-5">

        {/* Titre + durée */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[18px] font-bold text-[#6B7A99] leading-snug line-clamp-2">
            {module.title}
          </h2>
          {module.duration && (
            <div className="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-bold uppercase text-gray-400 tracking-wide mt-0.5">
              <Clock size={13} strokeWidth={2.5} />
              <span>{module.duration} min</span>
            </div>
          )}
        </div>

        {/* Description */}
        {module.description && (
          <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-3 mt-2">
            {module.description}
          </p>
        )}

        {/* Bouton */}
        <div className="flex justify-end mt-3">
          <Link
            href={`/modules/${module.slug}`}
            className="inline-flex items-center gap-2 bg-[#EEF2F7] hover:bg-[#E1E7EF] text-[#5A6A7E] px-4 py-2 rounded-xl text-[12px] font-semibold transition-colors duration-200"
          >
            Découvrir le module
            <ArrowRight
              size={14}
              strokeWidth={2.5}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

      </div>
    </article>
  );
}
