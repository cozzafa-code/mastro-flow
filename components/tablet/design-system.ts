// =========================================================
// MASTRO TABLET - DESIGN SYSTEM HD v3 (ultra-tenue lucido)
// =========================================================
// Palette pastello ultra-raffinata per effetto premium "Apple-grade".
// =========================================================

export const TT = {
  // -------- Sfondi & superfici --------
  bg: "#FBFCFE",                      // bg principale neutro chiaro
  bgSoft: "#F4F7FA",                  // soft cards interne
  bgGradient: "radial-gradient(ellipse 1200px 800px at 50% 0%, #F8FAFC 0%, #F1F5F9 100%)",
  surface: "#FFFFFF",
  surface2: "#FCFDFE",
  surfaceGlass: "rgba(255,255,255,0.78)",
  surfaceTint: "rgba(248,250,252,0.55)",

  // -------- Testi (contrasti raffinati per HD readability) --------
  text1: "#0F172A",                   // titoli (deep slate)
  text2: "#475569",                   // body
  text3: "#94A3B8",                   // hint
  text4: "#CBD5E1",                   // disabled

  // -------- Bordi (ultra-sottili) --------
  border: "#EEF2F6",                  // bordi principali (quasi invisibili)
  borderStrong: "#E1E7EE",            // bordi visibili
  borderGlass: "rgba(15,23,42,0.05)",

  // -------- Pastel ramps ULTRA-TENUE --------
  // 50/100: saturazione -30%, luminosita' max
  // 200: NUOVO intermedio (pastello "vero")
  // 300/400: saturazione raffinata (-15% vs v2)
  // 500/600/700: deep per gradient e testi su sfondo chiaro
  // 800: NUOVO ultra-deep
  teal: {
    50: "#F2FCFB", 100: "#DAF6F2", 200: "#A8E5DD", 300: "#6DCFC2",
    400: "#3DB8AA", 500: "#1F9D8E", 600: "#168276", 700: "#13675F", 800: "#0F4F49",
  },
  orange: {
    50: "#FFF9F2", 100: "#FFEEDA", 300: "#F8B380", 400: "#EF9354",
    500: "#DD7530", 600: "#BF5F22", 700: "#9A4B1B", 200: "#FCD3B0", 800: "#7A3A14",
  },
  green: {
    50: "#F2FCF5", 100: "#DAF7E1", 200: "#ABEBBC", 300: "#7CDC93",
    400: "#52C76C", 500: "#2EAC4C", 600: "#218E3C", 700: "#1A6D2F", 800: "#155324",
  },
  blue: {
    50: "#F2F8FF", 100: "#DAEAFD", 200: "#AECDFA", 300: "#83AEF2",
    400: "#5A8DE6", 500: "#356DD0", 600: "#2455B0", 700: "#1B4289", 800: "#143266",
  },
  amber: {
    50: "#FFFBF0", 100: "#FEF1CE", 200: "#FBE093", 300: "#F4C44E",
    400: "#E5A91E", 500: "#C68D11", 600: "#A2730F", 700: "#7E5A0D", 800: "#604509",
  },
  red: {
    50: "#FEF5F5", 100: "#FCE3E3", 200: "#F8BFBF", 300: "#F09797",
    400: "#E37272", 500: "#CE5050", 600: "#AE3E3E", 700: "#8B3030", 800: "#6A2424",
  },
  violet: {
    50: "#F7F5FE", 100: "#EBE6FC", 200: "#D2C7F8", 300: "#B5A4F2",
    400: "#9784E8", 500: "#7864D6", 600: "#604EB6", 700: "#4A3D90", 800: "#372D6E",
  },
  pink: {
    50: "#FDF6FA", 100: "#FBE7F1", 200: "#F5C7DD", 300: "#EDA1C5",
    400: "#DF7BA9", 500: "#C75F8E", 600: "#A64B72", 700: "#823859", 800: "#5F2942",
  },
  slate: {
    50: "#F8FAFC", 100: "#EDF1F5", 200: "#D5DEE7", 300: "#B5C2CF",
    400: "#7E8DA0", 500: "#576779", 600: "#42505F", 700: "#2F3A47", 800: "#1F2731",
  },

  // -------- Topbar logo --------
  logoBg: "#0B1220",
  logoBgGradient: "linear-gradient(135deg, #1E293B 0%, #0B1220 100%)",

  // -------- Shadow CHIRURGICHE (4 layer per profondita' Apple-grade) --------
  shadowXs: "0 1px 1.5px rgba(15,23,42,0.04)",
  shadowSm:
    "0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.02)",
  shadowMd:
    "0 2px 4px rgba(15,23,42,0.03), 0 4px 8px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.02)",
  shadowLg:
    "0 4px 8px rgba(15,23,42,0.04), 0 12px 24px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
  shadowXl:
    "0 8px 16px rgba(15,23,42,0.05), 0 24px 48px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
  shadowGlow: (color: string) => `0 0 0 1px ${color}, 0 4px 12px ${color}`,

  // -------- Radius (premium) --------
  rXs: 6,
  rSm: 9,
  rMd: 13,
  rLg: 17,
  rXl: 22,
  r2xl: 28,

  // -------- Typography HD --------
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontFeatures:
    "'cv11' 1, 'ss01' 1, 'cv02' 1, 'cv03' 1, 'cv04' 1, 'ss02' 1, 'ss03' 1",
  textRendering: "geometricPrecision" as const,

  // -------- Layout --------
  sidebarW: 240,
  sidebarWCollapsed: 72,
  topbarH: 68,
  contentMaxW: 1440,
} as const;

// =========================================================
// COLORI MODULI
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

/** Card style HD - shadow + bordo neutro premium. */
export const cardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surface,
  border: `1px solid ${TT.border}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowSm,
  ...extra,
});

/** Card glass - effetto vetro premium. */
export const cardGlass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surfaceGlass,
  border: `1px solid ${TT.borderGlass}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowMd,
  backdropFilter: "blur(24px) saturate(180%)" as any,
  WebkitBackdropFilter: "blur(24px) saturate(180%)" as any,
  ...extra,
});

/** Body style HD massimo. */
export const bodyStyle: React.CSSProperties = {
  fontFamily: TT.fontFamily,
  color: TT.text1,
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
  textRendering: TT.textRendering,
  fontFeatureSettings: TT.fontFeatures,
  letterSpacing: "-0.011em",
};
