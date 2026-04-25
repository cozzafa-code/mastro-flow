// =========================================================
// MASTRO TABLET - DESIGN SYSTEM HD v2
// =========================================================
// Token fliwoX HD lucido pastello - upgrade Apr 2026.
// Palette piu' raffinata, shadow stratificate, glass effect.
// =========================================================

export const TT = {
  // -------- Sfondi & superfici (gradient subliminali) --------
  bg: "#FAFCFE",                      // bg principale piu' chiaro
  bgSoft: "#F1F5F9",                  // soft per cards interne
  bgGradient: "radial-gradient(ellipse at top, #F8FAFC 0%, #EEF2F6 100%)",
  surface: "#FFFFFF",
  surface2: "#FAFCFE",
  surfaceGlass: "rgba(255,255,255,0.85)",  // glass per overlay
  surfaceTint: "rgba(248,250,252,0.65)",   // glass tintata bg

  // -------- Testi (contrasti raffinati) --------
  text1: "#0B1220",                   // titoli (piu' freddo)
  text2: "#475569",                   // body
  text3: "#94A3B8",                   // hint
  text4: "#CBD5E1",                   // disabled

  // -------- Bordi (piu' sottili) --------
  border: "#EBF0F5",                  // bordi principali
  borderStrong: "#DCE3EB",            // bordi visibili
  borderGlass: "rgba(15,23,42,0.06)", // bordi glass

  // -------- Pastel ramps RAFFINATE --------
  // 50/100 piu' tenui. 300/400/500 saturazione ridotta.
  // Aggiunto 600/700 per gradient deep.
  teal: {
    50: "#F0FDFC", 100: "#CDFAF6", 300: "#5DD3C5",
    400: "#2DBFAF", 500: "#14A599", 600: "#0F8A82", 700: "#0E6F69",
  },
  orange: {
    50: "#FFF8F1", 100: "#FFE9D5", 300: "#FBB877",
    400: "#F59849", 500: "#EA7B22", 600: "#D06517", 700: "#A85013",
  },
  green: {
    50: "#F0FDF4", 100: "#D5FBDF", 300: "#7CE092",
    400: "#48CE6E", 500: "#22B055", 600: "#1A9046", 700: "#176B38",
  },
  blue: {
    50: "#F0F7FF", 100: "#D9EBFF", 300: "#85B6F7",
    400: "#5C97F2", 500: "#3478E0", 600: "#225EC2", 700: "#1A4D9E",
  },
  amber: {
    50: "#FFFBEB", 100: "#FEF1C7", 300: "#FACA50",
    400: "#F2B321", 500: "#DA9810", 600: "#B57C0E", 700: "#8E620C",
  },
  red: {
    50: "#FEF3F3", 100: "#FDDFDF", 300: "#F58A8A",
    400: "#EE6868", 500: "#DC4848", 600: "#BC3838", 700: "#962E2E",
  },
  violet: {
    50: "#F6F4FF", 100: "#ECE7FF", 300: "#B6A6FB",
    400: "#9982F4", 500: "#7E62E0", 600: "#664CC2", 700: "#4F3D9C",
  },
  pink: {
    50: "#FDF4F9", 100: "#FBE4F2", 300: "#F296CD",
    400: "#E776B9", 500: "#D45A9E", 600: "#B14782", 700: "#893566",
  },
  slate: {
    50: "#F8FAFC", 100: "#EBF0F5", 300: "#BCC6D2",
    400: "#8696A8", 500: "#5E6E81", 600: "#475568", 700: "#2F3A4A",
  },

  // -------- Topbar logo --------
  logoBg: "#0B1220",
  logoBgGradient: "linear-gradient(135deg, #1E293B 0%, #0B1220 100%)",

  // -------- Shadow STRATIFICATE (3 layer per profondita' premium) --------
  shadowXs: "0 1px 2px rgba(15,23,42,0.04)",
  shadowSm: "0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.03)",
  shadowMd: "0 4px 8px rgba(15,23,42,0.04), 0 2px 4px rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.03)",
  shadowLg: "0 12px 24px rgba(15,23,42,0.06), 0 6px 12px rgba(15,23,42,0.04), 0 2px 4px rgba(15,23,42,0.03)",
  shadowXl: "0 24px 48px rgba(15,23,42,0.08), 0 12px 24px rgba(15,23,42,0.05), 0 4px 8px rgba(15,23,42,0.03)",
  shadowGlow: (color: string) => `0 0 0 1px ${color}, 0 4px 12px ${color}`,

  // -------- Radius (piu' generosi premium) --------
  rXs: 6,
  rSm: 8,
  rMd: 12,
  rLg: 16,
  rXl: 20,
  r2xl: 24,

  // -------- Typography --------
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontFeatures: "'cv11','ss01','cv02','cv03'",
  textRendering: "geometricPrecision" as const,

  // -------- Layout --------
  sidebarW: 240,                      // leggermente piu' largo
  sidebarWCollapsed: 72,              // portrait collapsed
  topbarH: 68,                        // un pelo piu' alto (premium)
  contentMaxW: 1440,                  // wide-screen support
} as const;

// =========================================================
// COLORI MODULI SIDEBAR
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

/** Card style HD - shadow stratificata + bordo sottile glass-tint. */
export const cardStyle = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surface,
  border: `1px solid ${TT.border}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowSm,
  ...extra,
});

/** Card glass: sfondo semi-trasparente + backdrop blur (effetto vetro). */
export const cardGlass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: TT.surfaceGlass,
  border: `1px solid ${TT.borderGlass}`,
  borderRadius: TT.rLg,
  boxShadow: TT.shadowMd,
  backdropFilter: "blur(20px) saturate(180%)" as any,
  WebkitBackdropFilter: "blur(20px) saturate(180%)" as any,
  ...extra,
});

/** Body style con font rendering HD. */
export const bodyStyle: React.CSSProperties = {
  fontFamily: TT.fontFamily,
  color: TT.text1,
  WebkitFontSmoothing: "antialiased" as const,
  MozOsxFontSmoothing: "grayscale" as const,
  textRendering: TT.textRendering,
  fontFeatureSettings: TT.fontFeatures,
  letterSpacing: "-0.01em",
};

// =========================================================
// HOOKS
// =========================================================

/**
 * Restituisce true se il viewport e' in modalita' portrait (< 1024px width).
 * Usato per collassare la sidebar e ridurre KPI columns.
 */
export function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = (typeof window !== "undefined")
    ? require("react").useState(window.innerWidth < 1024)
    : require("react").useState(false);

  (typeof window !== "undefined" ? require("react").useEffect : () => {})(
    () => {
      const handler = () => setIsPortrait(window.innerWidth < 1024);
      handler();
      window.addEventListener("resize", handler);
      window.addEventListener("orientationchange", handler);
      return () => {
        window.removeEventListener("resize", handler);
        window.removeEventListener("orientationchange", handler);
      };
    },
    []
  );

  return isPortrait;
}
