// =========================================================
// MASTRO TABLET - DESIGN SYSTEM (allineato al mobile)
// =========================================================
// Stesse chiavi di prima per non rompere i 64 consumer.
// Valori = tema 2 di mastro-constants.tsx (navy + light).
// Header navy #1E3A5F, bg #F8FAFC, card #FFFFFF.
// =========================================================

export const TT = {
  // -------- Sfondi & superfici (mobile light) --------
  bg: "#F8FAFC",
  bgSoft: "#F1F5F9",
  bgGradient: "radial-gradient(ellipse 1200px 800px at 50% 0%, #F8FAFC 0%, #F1F5F9 100%)",
  surface: "#FFFFFF",
  surface2: "#F8FAFC",
  surfaceGlass: "rgba(255,255,255,0.85)",
  surfaceTint: "rgba(30,58,95,0.04)",

  // -------- Testi (mobile) --------
  text1: "#0F172A",
  text2: "#64748B",
  text3: "#94A3B8",
  text4: "#CBD5E1",

  // -------- Bordi (mobile) --------
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  borderGlass: "rgba(15,23,42,0.06)",

  // -------- Accent navy (mobile pri/acc #1E3A5F) --------
  // Mappato sulla scala teal[*] per non cambiare gli import
  teal: {
    50: "#F1F5F9", 100: "#E2EAF2", 200: "#C5D5E5", 300: "#8FA9C7",
    400: "#1E3A5F", 500: "#16294A", 600: "#0F1B2D", 700: "#0A1320", 800: "#050A14",
  },

  // -------- Palette accent per chip bottom-nav e moduli --------
  // Toni dello screenshot: home=teal, commesse=lavanda, agenda=rosa, talk=beige, team=verde
  orange: {
    50: "#FFF7E8", 100: "#FFE8B8", 200: "#FFD580", 300: "#F2B852",
    400: "#E8A020", 500: "#C2820F", 600: "#946408", 700: "#6E4B05", 800: "#4D3303",
  },
  green: {
    50: "#ECFDF5", 100: "#D1FAE5", 200: "#A7F3D0", 300: "#6EE7B7",
    400: "#10B981", 500: "#065F46", 600: "#064E3B", 700: "#053E2F", 800: "#042E23",
  },
  blue: {
    50: "#EFF6FF", 100: "#DBEAFE", 200: "#BFDBFE", 300: "#93C5FD",
    400: "#3B7FE0", 500: "#2563EB", 600: "#1D4ED8", 700: "#1E40AF", 800: "#1E3A8A",
  },
  amber: {
    50: "#FFFBEB", 100: "#FEF3C7", 200: "#FDE68A", 300: "#FCD34D",
    400: "#F59E0B", 500: "#D97706", 600: "#B45309", 700: "#92400E", 800: "#78350F",
  },
  red: {
    50: "#FEF2F2", 100: "#FEE2E2", 200: "#FECACA", 300: "#FCA5A5",
    400: "#DC4444", 500: "#B91C1C", 600: "#991B1B", 700: "#7F1D1D", 800: "#601515",
  },
  violet: {
    50: "#F5F3FF", 100: "#EDE9FE", 200: "#DDD6FE", 300: "#C4B5FD",
    400: "#AF52DE", 500: "#8B5CF6", 600: "#7C3AED", 700: "#6D28D9", 800: "#5B21B6",
  },
  pink: {
    50: "#FDF2F8", 100: "#FCE7F3", 200: "#FBCFE8", 300: "#F9A8D4",
    400: "#EC4899", 500: "#DB2777", 600: "#BE185D", 700: "#9D174D", 800: "#831843",
  },
  slate: {
    50: "#F8FAFC", 100: "#F1F5F9", 200: "#E2E8F0", 300: "#CBD5E1",
    400: "#94A3B8", 500: "#64748B", 600: "#475569", 700: "#334155", 800: "#1E293B",
  },

  // -------- Topbar logo (navy mobile) --------
  logoBg: "#1E3A5F",
  logoBgGradient: "linear-gradient(135deg, #1E3A5F 0%, #0F1B2D 100%)",

  // -------- Shadow chirurgiche (light mode) --------
  shadowXs: "0 1px 1.5px rgba(15,23,42,0.04)",
  shadowSm: "0 1px 2px rgba(15,23,42,0.04), 0 1px 1px rgba(15,23,42,0.02)",
  shadowMd: "0 2px 4px rgba(15,23,42,0.03), 0 4px 8px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.02)",
  shadowLg: "0 4px 8px rgba(15,23,42,0.04), 0 12px 24px rgba(15,23,42,0.06), 0 2px 4px rgba(15,23,42,0.02), inset 0 1px 0 rgba(255,255,255,0.6)",
  shadowXl: "0 8px 16px rgba(15,23,42,0.05), 0 24px 48px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.03), inset 0 1px 0 rgba(255,255,255,0.7)",
  shadowGlow: (color: string) => `0 0 0 1px ${color}, 0 4px 12px ${color}`,

  // -------- Radius --------
  rXs: 6, rSm: 9, rMd: 13, rLg: 17, rXl: 22, r2xl: 28,

  // -------- Typography --------
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif",
  fontFeatures: "cv11 1, ss01 1, cv02 1, cv03 1, cv04 1, ss02 1, ss03 1",
  textRendering: "geometricPrecision" as const,

  // -------- Layout --------
  sidebarW: 240,
  sidebarWCollapsed: 72,
  topbarH: 68,
  contentMaxW: 1440,
} as const;

// =========================================================
// COLORI MODULI (per chip/badge/accent moduli)
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

export const cardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surface,
  border: `1px solid ${TT.border}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowSm,
  ...extra,
});

export const cardGlass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surfaceGlass,
  border: `1px solid ${TT.borderGlass}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowMd,
  backdropFilter: "blur(24px) saturate(180%)" as any,
  WebkitBackdropFilter: "blur(24px) saturate(180%)" as any,
  ...extra,
});

export const bodyStyle: React.CSSProperties = {
  fontFamily: TT.fontFamily,
  color: TT.text1,
  background: TT.bg,
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
  textRendering: TT.textRendering,
  fontFeatureSettings: TT.fontFeatures,
  letterSpacing: "-0.011em",
};
