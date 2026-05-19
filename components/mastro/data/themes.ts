// MASTRO ERP — Temi
import type { Theme } from "./types";

/* == TEMI == */
const THEMES = {
  chiaro: {
    name: "Chiaro", emoji: "☀️",
    bg: "#f5f5f7", bg2: "#ffffff", card: "#ffffff", card2: "#f8f8fa",
    bdr: "#e5e5ea", bdrL: "#d1d1d6", text: "#1d1d1f", sub: "#86868b", sub2: "#aeaeb2",
    acc: "#0066cc", accD: "#0055aa", accLt: "rgba(0,102,204,0.08)", accBg: "linear-gradient(135deg,#0066cc,#0055aa)",
    grn: "#34c759", grnLt: "rgba(52,199,89,0.08)",
    red: "#ff3b30", redLt: "rgba(255,59,48,0.08)",
    orange: "#ff9500", orangeLt: "rgba(255,149,0,0.08)",
    blue: "#007aff", blueLt: "rgba(0,122,255,0.08)",
    purple: "#af52de", purpleLt: "rgba(175,82,222,0.08)",
    cyan: "#32ade6", cyanLt: "rgba(50,173,230,0.08)",
    cardSh: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
    cardShH: "0 4px 12px rgba(0,0,0,0.08)",
    r: 12, r2: 16
  },
  scuro: {
    name: "Scuro", emoji: "🌙",
    bg: "#000000", bg2: "#1c1c1e", card: "#1c1c1e", card2: "#2c2c2e",
    bdr: "#38383a", bdrL: "#48484a", text: "#f2f2f7", sub: "#8e8e93", sub2: "#636366",
    acc: "#0a84ff", accD: "#0070e0", accLt: "rgba(10,132,255,0.12)", accBg: "linear-gradient(135deg,#0a84ff,#0070e0)",
    grn: "#30d158", grnLt: "rgba(48,209,88,0.12)",
    red: "#ff453a", redLt: "rgba(255,69,58,0.12)",
    orange: "#ff9f0a", orangeLt: "rgba(255,159,10,0.12)",
    blue: "#0a84ff", blueLt: "rgba(10,132,255,0.12)",
    purple: "#bf5af2", purpleLt: "rgba(191,90,242,0.12)",
    cyan: "#64d2ff", cyanLt: "rgba(100,210,255,0.12)",
    cardSh: "0 1px 3px rgba(0,0,0,0.3)",
    cardShH: "0 4px 12px rgba(0,0,0,0.4)",
    r: 12, r2: 16
  },
  oceano: {
    name: "Oceano", emoji: "🌊",
    bg: "#0f1923", bg2: "#162231", card: "#1a2a3a", card2: "#1f3040",
    bdr: "#2a3f55", bdrL: "#345070", text: "#e8ecf0", sub: "#7a90a5", sub2: "#4a6070",
    acc: "#4fc3f7", accD: "#29b6f6", accLt: "rgba(79,195,247,0.12)", accBg: "linear-gradient(135deg,#4fc3f7,#29b6f6)",
    grn: "#66bb6a", grnLt: "rgba(102,187,106,0.12)",
    red: "#ef5350", redLt: "rgba(239,83,80,0.12)",
    orange: "#ffa726", orangeLt: "rgba(255,167,38,0.12)",
    blue: "#42a5f5", blueLt: "rgba(66,165,245,0.12)",
    purple: "#ab47bc", purpleLt: "rgba(171,71,188,0.12)",
    cyan: "#26c6da", cyanLt: "rgba(38,198,218,0.12)",
    cardSh: "0 1px 3px rgba(0,0,0,0.25)",
    cardShH: "0 4px 12px rgba(0,0,0,0.35)",
    r: 12, r2: 16
  }
};


export type ThemeKey = keyof typeof THEMES;
