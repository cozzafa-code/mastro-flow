"use client";
import * as React from "react";

// =========================================================
// AvatarGradient - silhouette utente con gradient pastello
// =========================================================
// Usato in: sidebar user-card, topbar avatar, lista team.
// Senza foto reale - placeholder elegante.
//
// PRESET: 5 gradient pastello pre-configurati (a..e).
// Custom: passa <AvatarGradient from="..." to="..." />
// =========================================================

const PRESETS: Record<string, [string, string]> = {
  a: ["#FCD34D", "#F97316"], // giallo->arancio
  b: ["#A7F3D0", "#2DD4BF"], // menta->teal
  c: ["#F9A8D4", "#C4B5FD"], // rosa->viola
  d: ["#93C5FD", "#A78BFA"], // azzurro->viola
  e: ["#86EFAC", "#60A5FA"], // verde->blu
  default: ["#A7F3D0", "#60A5FA"], // menta->azzurro (default)
};

export interface AvatarGradientProps {
  size?: number;
  preset?: keyof typeof PRESETS;
  from?: string;
  to?: string;
  rounded?: boolean; // se true: cerchio. Default true.
  className?: string;
  style?: React.CSSProperties;
}

let _idCounter = 0;
const nextId = () => `avgrad_${++_idCounter}`;

export default function AvatarGradient({
  size = 36,
  preset = "default",
  from,
  to,
  rounded = true,
  className,
  style,
}: AvatarGradientProps) {
  const gradId = React.useMemo(() => nextId(), []);
  const [c1, c2] = from && to ? [from, to] : PRESETS[preset] || PRESETS.default;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        borderRadius: rounded ? "50%" : 8,
        flexShrink: 0,
        display: "block",
        ...style,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
      </defs>
      <rect width="36" height="36" fill={`url(#${gradId})`} />
      <circle cx="18" cy="14" r="6" fill="white" opacity="0.95" />
      <path
        d="M5 32 c0,-7 5,-12 13,-12 s13,5 13,12"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}
