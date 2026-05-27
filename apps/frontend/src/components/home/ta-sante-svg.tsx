import type { CSSProperties } from "react";

type TaSanteSvgProps = {
  className?: string;
  style?: CSSProperties;
};

/**
 * "Ta santé" rendu en SVG : grand bold sans-serif, gradient vert → bleu,
 * inner shadow vert (params Figma : X=0 Y=4 Blur=100 Spread=14 Color=#25760C).
 */
export function TaSanteSvg({ className, style }: TaSanteSvgProps) {
  return (
    <svg
      viewBox="0 0 760 180"
      className={className}
      style={style}
      role="img"
      aria-label="Ta santé"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient vert → bleu sur les lettres */}
        <linearGradient id="ts-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4CAF50" />
          <stop offset="55%" stopColor="#5FA6C0" />
          <stop offset="100%" stopColor="#1F6F8B" />
        </linearGradient>

        {/* Inner shadow vert — reproduction de l'effet Figma
            X=0, Y=4, Blur=100, Spread=14, Color=#25760C 100% */}
        <filter
          id="ts-inner-shadow"
          x="-25%"
          y="-25%"
          width="150%"
          height="150%"
        >
          {/* 1. Flood la couleur de l'ombre */}
          <feFlood floodColor="#25760C" floodOpacity="1" result="floodColor" />
          {/* 2. On garde uniquement ce qui est OUTSIDE le texte source */}
          <feComposite
            in="floodColor"
            in2="SourceAlpha"
            operator="out"
            result="outside"
          />
          {/* 3. On blur ce halo extérieur */}
          <feGaussianBlur in="outside" stdDeviation="14" result="blurred" />
          {/* 4. Offset Y=4 */}
          <feOffset in="blurred" dx="0" dy="4" result="offset" />
          {/* 5. On clip pour ne garder que la partie qui retombe dans le texte */}
          <feComposite
            in="offset"
            in2="SourceAlpha"
            operator="in"
            result="innerShadow"
          />
          {/* 6. Merge source + inner shadow */}
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="innerShadow" />
          </feMerge>
        </filter>
      </defs>

      <text
        x="0"
        y="128"
        fontWeight="900"
        fontSize="140"
        fill="url(#ts-gradient)"
        filter="url(#ts-inner-shadow)"
        letterSpacing="-3"
        style={{
          fontFamily:
            "var(--font-display), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        Ta santé
      </text>
    </svg>
  );
}
