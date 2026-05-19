// ═══════════════════════════════════════════
// MASTRO ERP — Barrel exports
// Importa tutto da qui: import { ... } from "./mastro"
// ═══════════════════════════════════════════

// Data
export { THEMES } from "./data/themes";
export type { ThemeKey } from "./data/themes";
export * from "./data/constants";
export * from "./data/demo-data";

// Types
export type * from "./data/types";

// Pure functions
export * from "./lib/calcoli";
export * from "./lib/pdf-generators";
export { estraiDatiPDF } from "./lib/pdf-extraction";

// UI
export { Ico, ICO } from "./ui/Ico";

// Hooks
export { default as useDragOrder } from "./hooks/useDragOrder";
