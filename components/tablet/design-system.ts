// =========================================================
// MASTRO TABLET - DESIGN SYSTEM
// =========================================================
// Token fliwoX versione HD pastello tenue (Apr 2026).
// IMMUTABILE - approvato da Fabio su mockup dashboard tablet.
//
// USO:
//   import { TT } from "@/components/tablet/design-system";
//   <div style={{ background: TT.bg, color: TT.text }} />
//
// TT = "Tablet Tokens" - separato dal mobile T per evitare collisioni.
// =========================================================

export const TT = {
  // -------- Sfondi & superfici --------
  bg: "#F8FAFC",
  bgSoft: "#EEF2F6",      // sfondo app (un tono sotto il bg cards)
  surface: "#FFFFFF",
  surface2: "#F8FAFC",

  // -------- Testi --------
  text1: "#0F172A",        // titoli, valori KPI
  text2: "#475569",        // body
  text3: "#94A3B8",        // disabled / hint

  // -------- Bordi --------
  border: "#EDF1F5",
  borderStrong: "#E2E8F0",

  // -------- Pastel ramps - 300/400/500 + tinte 50/100 --------
  teal:   { 300: "#5EEAD4", 400: "#2DD4BF", 500: "#14B8A6", 50: "#F0FDFA", 100: "#CCFBF1" },
  orange: { 300: "#FDBA74", 400: "#FB923C", 500: "#F97316", 50: "#FFF7ED", 100: "#FFEDD5" },
  green:  { 300: "#86EFAC", 400: "#4ADE80", 500: "#22C55E", 50: "#F0FDF4", 100: "#DCFCE7" },
  blue:   { 300: "#93C5FD", 400: "#60A5FA", 500: "#3B82F6", 50: "#EFF6FF", 100: "#DBEAFE" },
  amber:  { 300: "#FCD34D", 400: "#FBBF24", 500: "#F59E0B", 50: "#FFFBEB", 100: "#FEF3C7" },
  red:    { 300: "#FCA5A5", 400: "#F87171", 500: "#EF4444", 50: "#FEF2F2", 100: "#FEE2E2" },
  violet: { 300: "#C4B5FD", 400: "#A78BFA", 500: "#8B5CF6", 50: "#F5F3FF", 100: "#EDE9FE" },
  pink:   { 300: "#F9A8D4", 400: "#F472B6", 500: "#EC4899", 50: "#FDF2F8", 100: "#FCE7F3" },
  slate:  { 300: "#CBD5E1", 400: "#94A3B8", 500: "#64748B" },

  // -------- Topbar (sfondo scuro logo) --------
  logoBg: "#1E293B",

  // -------- Shadows soft pastello --------
  shadowSm: "0 1px 2px rgba(15,23,42,0.04)",
  shadowMd: "0 2px 6px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.03)",
  shadowLg: "0 8px 24px rgba(15,23,42,0.06)",

  // -------- Radius --------
  rXs: 6,
  rSm: 8,
  rMd: 12,
  rLg: 16,

  // -------- Typography --------
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontFeatures: "'cv11','ss01'",
  textRendering: "geometricPrecision" as const,

  // -------- Layout fixed --------
  sidebarW: 224,
  topbarH: 64,
  contentMaxW: 1280,
} as const;

// =========================================================
// MAPPATURA COLORI MODULI SIDEBAR (15 voci)
// Ogni voce ha il suo colore pastel-400 nell'icona quadrata.
// =========================================================

export const MODULE_COLORS: Record<string, string> = {
  dashboard:    TT.teal[400],
  calendario:   TT.violet[400],
  commesse:     TT.orange[400],
  sopralluoghi: TT.red[400],
  produzione:   TT.blue[400],
  montaggi:     TT.green[400],
  ordini:       TT.orange[400],
  magazzino:    TT.amber[400],
  clienti:      TT.violet[400],
  contabilita:  TT.pink[400],
  fiscale:      TT.green[400],
  team:         TT.teal[400],
  ops:          TT.teal[400],
  ai:           TT.blue[400],
  impostazioni: TT.orange[400],
};

// =========================================================
// HELPERS
// =========================================================

/** Stile base per ogni card del tablet. */
export const cardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surface,
  border: `1px solid ${TT.border}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowSm,
  ...extra,
});

/** Stile base body. Aggancia font-feature + rendering precision. */
export const bodyStyle: React.CSSProperties = {
  fontFamily: TT.fontFamily,
  color: TT.text1,
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
  textRendering: TT.textRendering,
  fontFeatureSettings: TT.fontFeatures,
};
