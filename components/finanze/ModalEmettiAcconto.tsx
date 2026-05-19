// components/finanze/ModalEmettiAcconto.tsx
// Modal post-creazione fattura acconto: Anteprima PDF | Invia al cliente
// Solo Invia persiste stato='inviata' via /api/fatture/invia

import React, { useState } from "react";

const TEAL = "#28A0A0";
const TEAL_DEEP = "#1a6b6b";
const NAVY = "#1E3A5F";
const BORDER = "#C8E4E4";
const MUTED = "#5C6B7A";
const BG = "#F4F1EA";
const GREEN = "#10B981";

interface Fattura {
  id: string;
  numero?: number;
  numeroFull?: string;
  importo: number;
  cliente?: string;
  cognome?: string;
  tipo?: string;
  stato?: string;
}

interface Props {
  fattura: Fattura;
  aziendaId: string;
  onClose: () => void;
  onAnteprimaPDF: (fattura: Fattura) => void;
  onInviata: (fatturaId: string) => void;
}

export default function ModalEmettiAcconto({
  fattura,
  aziendaId,
  onClose,
  onAnteprimaPDF,
  onInviata,
}: Props) {
  const [inviando, setInviando] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);

  const handleInvia = async () => {
    setInviando(true);
    setErrore(null);
    try {
      const r = await fetch("/api/fatture/invia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aziendaId,
          fatturaId: fattura.id,
          canale: "manuale",
        }),
      });
      const j = await r.json();
      if (!r.ok || j.error) {
        setErrore(j.error || "Errore invio fattura");
        setInviando(false);
        return;
      }
      onInviata(fattura.id);
      onClose();
    } catch (e: any) {
      setErrore(e.message || "Errore rete");
      setInviando(false);
    }
  };

  const fmtEur = (n: number) =>
    n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,27,45,0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: BG,
          borderRadius: "18px 18px 0 0",
          width: "100%",
          maxWidth: 480,
          padding: "20px 18px 24px",
        }}
      >
        {/* HEADER */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 900,
              color: GREEN,
              letterSpacing: 0.8,
              marginBottom: 4,
            }}
          >
            FATTURA CREATA - BOZZA
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: NAVY }}>
            {fattura.numeroFull || "Fattura " + (fattura.numero || "")}
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>
            {fattura.cliente} {fattura.cognome || ""} - EUR {fmtEur(fattura.importo)}
          </div>
        </div>

        {/* MESSAGGIO */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: "14px 14px",
            border: "1px solid " + BORDER,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, color: NAVY, lineHeight: 1.5 }}>
            La fattura e stata salvata come <b>bozza</b> sul sistema.
            <br />
            Puoi vederne l&apos;anteprima PDF, o inviarla al cliente per richiedere il pagamento.
          </div>
        </div>

        {errore && (
          <div
            style={{
              background: "#FEE",
              border: "1px solid #FCA5A5",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#991B1B",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {errore}
          </div>
        )}

        {/* AZIONI */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button
            onClick={() => onAnteprimaPDF(fattura)}
            disabled={inviando}
            style={{
              padding: "14px 0",
              background: "#fff",
              color: NAVY,
              border: "1.5px solid " + BORDER,
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: inviando ? "not-allowed" : "pointer",
              opacity: inviando ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            Anteprima PDF
          </button>
          <button
            onClick={handleInvia}
            disabled={inviando}
            style={{
              padding: "14px 0",
              background: inviando ? MUTED : TEAL_DEEP,
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: inviando ? "wait" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {inviando ? "Invio..." : "Invia al cliente"}
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={inviando}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px 0",
            background: "transparent",
            color: MUTED,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Chiudi (resta in bozza)
        </button>
      </div>
    </div>
  );
}
