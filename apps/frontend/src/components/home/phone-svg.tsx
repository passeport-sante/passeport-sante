import type { CSSProperties, ReactNode } from "react";

type PhoneSvgProps = {
  className?: string;
  style?: CSSProperties;
  /** Contenu à placer dans l'écran du téléphone (image, vidéo, etc.). Si absent, écran vide / transparent. */
  screen?: ReactNode;
  /** Couleur du contour. */
  stroke?: string;
  /** Couleur des "+" décoratifs autour. */
  accent?: string;
};

/**
 * SVG téléphone vectoriel style "doodle main levée", format compact.
 * Le screen est rendu via un foreignObject HTML pour accueillir n'importe quel contenu (image/video).
 * Dimensions intrinsèques: 360x440 (ratio ~0.51, format court/compact).
 */
export function PhoneSvg({
  className,
  style,
  screen,
  stroke = "#1F6F8B",
  accent = "#1F6F8B",
}: PhoneSvgProps) {
  return (
    <svg
      viewBox="0 0 360 440"
      className={className}
      style={style}
      role="img"
      aria-label="Téléphone illustré"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ── "+" décoratifs autour ────────────────────────────── */}
      <g stroke={accent} strokeWidth="4" strokeLinecap="round" fill="none">
        {/* gros + haut-droite */}
        <g transform="translate(312 70) rotate(8)">
          <line x1="-18" y1="0" x2="18" y2="0" />
          <line x1="0" y1="-18" x2="0" y2="18" />
        </g>
        {/* + moyen droite */}
        <g transform="translate(330 175) rotate(-12)">
          <line x1="-12" y1="0" x2="12" y2="0" />
          <line x1="0" y1="-12" x2="0" y2="12" />
        </g>
        {/* + petit droite-bas */}
        <g transform="translate(322 310) rotate(20)" strokeWidth="3.5">
          <line x1="-8" y1="0" x2="8" y2="0" />
          <line x1="0" y1="-8" x2="0" y2="8" />
        </g>
        {/* + gros gauche-bas */}
        <g transform="translate(34 360) rotate(-18)">
          <line x1="-22" y1="0" x2="22" y2="0" />
          <line x1="0" y1="-22" x2="0" y2="22" />
        </g>
        {/* + moyen gauche-milieu */}
        <g transform="translate(20 230) rotate(15)">
          <line x1="-14" y1="0" x2="14" y2="0" />
          <line x1="0" y1="-14" x2="0" y2="14" />
        </g>
        {/* + petit gauche-haut */}
        <g transform="translate(36 120) rotate(-8)" strokeWidth="3.5">
          <line x1="-9" y1="0" x2="9" y2="0" />
          <line x1="0" y1="-9" x2="0" y2="9" />
        </g>
        {/* + très petit haut-gauche */}
        <g transform="translate(78 50) rotate(25)" strokeWidth="3">
          <line x1="-6" y1="0" x2="6" y2="0" />
          <line x1="0" y1="-6" x2="0" y2="6" />
        </g>
        {/* + petit bas-droite-2 */}
        <g transform="translate(300 395) rotate(-5)" strokeWidth="3.5">
          <line x1="-10" y1="0" x2="10" y2="0" />
          <line x1="0" y1="-10" x2="0" y2="10" />
        </g>
      </g>  
      {/* ── Corps du téléphone (compact, ratio ~0.51) ─────────── */}
      <path
        d="
          M 110 30
          C 105 30, 92 32, 88 48
          C 86 56, 86 72, 86 92
          L 86 360
          C 86 382, 92 395, 112 398
          C 130 401, 152 402, 180 402
          C 208 402, 230 401, 248 398
          C 268 395, 274 382, 274 360
          L 274 92
          C 274 72, 274 56, 272 48
          C 268 32, 255 30, 250 30
          Z
        "
        fill="white"
        stroke={stroke}
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* ── Encoche speaker (en haut) ─────────────────────────── */}
      <line
        x1="155"
        y1="58"
        x2="205"
        y2="58"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* ── Bouton home (en bas) ──────────────────────────────── */}
      <circle
        cx="180"
        cy="372"
        r="12"
        fill="none"
        stroke={stroke}
        strokeWidth="4"
      />

      {/* ── Zone "écran" : prête à accueillir une vidéo plus tard.
              Pour le moment : entièrement vide / transparente. */}
      {screen ? (
        <>
          <rect
            x="93"
            y="78"
            width="174"
            height="278"
            rx="14"
            ry="14"
            fill="white"
          />
          <foreignObject x="93" y="78" width="174" height="278">
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "14px",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {screen}
            </div>
          </foreignObject>
        </>
      ) : null}
    </svg>
  );
}
