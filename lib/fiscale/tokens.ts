// lib/fiscale/tokens.ts
// Design tokens unificati per tutto il modulo fiscale (Centro Comando / RILIEVO MISURE)

export const FISCALE_TOKENS = {
  darkBg: "#0D1F1F",
  teal: "#28A0A0",
  tealSoft: "#EEF8F8",
  lightBg: "#EEF8F8",
  cardBg: "#FFFFFF",
  border: "#C8E4E4",
  textDark: "#0D1F1F",
  textSub: "#6A8484",
  radius: 10,
  radiusSmall: 8,
  spacing: 10,
};

export const DETR_LABEL: Record<string, string> = {
  "50": "Ristrutt. 50%",
  "65": "Ecobonus 65%",
  "75": "Bonus Barriere 75%",
};

export const TEMPLATE_MAP: Record<string, string> = {
  "50": "checklist_50",
  "65": "checklist_65",
  "75": "checklist_75",
};
