// ======================================================================
// MASTRO ERP - Vano Detail / Constants
// Estratto da components/VanoDetailPanel.tsx (refactor S2)
// ======================================================================

export const STATO_MISURE = [
  { id: "provvisorie", label: "Provvisorie", color: "#D08008", bg: "#D0800818", icon: "", desc: "Misure non ancora verificate" },
  { id: "verificate",  label: "Verificate",  color: "#D08008", bg: "#D0800815", icon: "", desc: "Verificate sul posto, non ancora confermate" },
  { id: "confermate",  label: "Confermate",  color: "#1A9E73", bg: "#1A9E7315", icon: "", desc: "Misure definitive - preventivo sbloccato" },
  { id: "da_rivedere", label: "Da rivedere", color: "#DC4444", bg: "#DC444415", icon: "", desc: "Rilevate discrepanze - ricontrollare" },
] as const;

export const getStatoMisure = (v: any) =>
  STATO_MISURE.find(s => s.id === (v?.statoMisure || "provvisorie")) || STATO_MISURE[0];
