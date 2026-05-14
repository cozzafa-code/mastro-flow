"use client";

import { OrdineStato } from "../ordini-types";

interface Props {
  stato: string;
  onModifica: () => void;
  onInvia: () => void;
  onRicevi: () => void;
  onAnnulla: () => void;
}

export default function DettaglioAzioniBar({ stato, onModifica, onInvia, onRicevi, onAnnulla }: Props) {
  const showInvia = stato === "bozza";
  const showRicevi = ["inviato", "confermato", "in_transito", "arrivato_parziale"].includes(stato);
  const showModifica = stato === "bozza";
  const showAnnulla = !["arrivato", "verificato", "annullato"].includes(stato);

  return (
    <div style={{
      position: "fixed", bottom: 100, left: 14, right: 14,
      background: "#fff", borderRadius: 14, padding: 10,
      display: "flex", gap: 8,
      boxShadow: "0 -4px 20px rgba(0,0,0,0.15)", zIndex: 50
    }}>
      {showModifica && (
        <Btn label="Modifica" onClick={onModifica} variant="ghost" />
      )}
      {showAnnulla && !showModifica && (
        <Btn label="Annulla" onClick={onAnnulla} variant="ghost" />
      )}
      {showInvia && (
        <Btn label="Invia al fornitore" onClick={onInvia} variant="primary" full />
      )}
      {showRicevi && (
        <Btn label="Ricevi merce" onClick={onRicevi} variant="primary" full
          icon={
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          } />
      )}
    </div>
  );
}

function Btn({ label, onClick, variant, full, icon }: any) {
  const styles: Record<string, any> = {
    primary: {
      background: "linear-gradient(180deg,#28A0A0 0%,#1a6b6b 100%)",
      color: "#fff",
      boxShadow: "0 3px 10px rgba(40,160,160,0.35)"
    },
    ghost: {
      background: "#F4F6FA",
      color: "#1A2A47",
      border: "1px solid #E0E5EE"
    }
  };
  return (
    <div onClick={onClick} style={{
      flex: full ? 1 : "0 0 auto",
      padding: "12px 16px", borderRadius: 10,
      fontSize: 13, fontWeight: 800, letterSpacing: "0.5px",
      textTransform: "uppercase", display: "flex",
      alignItems: "center", justifyContent: "center", gap: 6,
      cursor: "pointer", ...styles[variant]
    }}>
      {icon}
      {label}
    </div>
  );
}
