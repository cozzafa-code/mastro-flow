// Index pubblico modulo magazzino TOP 80
// Importa: import { ModuloMagazzino } from "@/components/magazzino";

export { default as ModuloMagazzino } from "./ModuloMagazzino";
export { default as VistaArticoli } from "./VistaArticoli";
export { default as VistaMovimenti } from "./VistaMovimenti";
export { default as VistaRiordini } from "./VistaRiordini";
export { default as VistaInventario } from "./VistaInventario";
export { default as VistaMappa } from "./VistaMappa";
export { default as VistaCycleCount } from "./VistaCycleCount";
export { default as VistaLabor } from "./VistaLabor";
export { default as OrdineRapido30s } from "./OrdineRapido30s";
export { default as ScannerQR } from "./ScannerQR";

// Set1 = ABC + GroupBuying + WavePicking
export { VistaAbcAnalysis, VistaGroupBuying, VistaWavePicking } from "./VisteMagazzinoSet1";
// Set2 = QcHold + Resi + DockSlots + CrossDock
export { VistaQcHold, VistaResi, VistaDockSlots, VistaCrossDock } from "./VisteMagazzinoSet2";
