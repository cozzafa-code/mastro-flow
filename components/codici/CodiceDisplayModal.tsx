"use client";
// MASTRO CODES - Modal display codice generato
// Mostra QR (Google Chart API) + Code128 (bwip-js CDN) + link condivisibile + azioni
import * as React from "react";

const C = {
  card: "#FFFFFF",
  cardSoft: "#F8FAFC",
  ink: "#0A1628",
  sub: "#64748B",
  subLight: "#94A3B8",
  border: "#E2E8F0",
  navy: "#1E3A5F",
  green: "#065F46",
  greenTint: "#ECFDF5",
};

const TIPO_LABEL: Record<string, string> = {
  commessa: "Commessa", vano: "Vano", pezzo_cnc: "Pezzo CNC", collo: "Collo",
  articolo: "Articolo", cantiere: "Cantiere", documento: "Documento",
  macchina: "Macchinario", furgone: "Furgone", fornitore_esterno: "Fornitore",
};

interface Props {
  codice: any;
  tipo: string;
  onClose: () => void;
}

export default function CodiceDisplayModal({ codice, tipo, onClose }: Props) {
  const short = codice?.short || "";
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/c/${short}`
    : `/c/${short}`;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&margin=10`;
  const code128Url = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(short)}&code=Code128&dpi=120&imagetype=Png&translate-esc=true`;

  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.open(`/etichette/${codice.entita_id || codice.id}`, "_blank");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          title: `Codice ${TIPO_LABEL[tipo] || tipo} ${short}`,
          text: `Apri il codice ${short}`,
          url,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15, 27, 45, 0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: 20, backdropFilter: "blur(4px)",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.card, borderRadius: 16,
          width: "100%", maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: "16px 22px",
          background: `linear-gradient(135deg, ${C.navy} 0%, #0F1B2D 100%)`,
          color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#93B0CF", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Codice generato ✓
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
              {TIPO_LABEL[tipo] || tipo}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: 9,
            background: "rgba(255,255,255,0.12)", border: "none",
            cursor: "pointer", fontSize: 22, fontWeight: 700, color: "#fff",
          }}>×</button>
        </div>

        {/* SHORT */}
        <div style={{
          padding: "16px 22px 8px",
          background: C.greenTint,
          borderBottom: `1px solid ${C.border}`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.green, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>
            Codice short
          </div>
          <div style={{
            fontSize: 28, fontWeight: 800, color: C.ink,
            fontFamily: "monospace", letterSpacing: 2,
          }}>{short}</div>
        </div>

        {/* QR */}
        <div style={{ padding: 22, textAlign: "center" }}>
          <div style={{
            display: "inline-block",
            padding: 12, background: "#fff",
            border: `1px solid ${C.border}`, borderRadius: 12,
          }}>
            <img
              src={qrUrl}
              alt={`QR ${short}`}
              width={220} height={220}
              style={{ display: "block" }}
            />
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.sub, marginTop: 8, letterSpacing: 0.4 }}>
            Scansiona per aprire la vista contestuale
          </div>
        </div>

        {/* Code128 */}
        <div style={{ padding: "0 22px 16px", textAlign: "center" }}>
          <div style={{
            padding: 10, background: "#fff",
            border: `1px solid ${C.border}`, borderRadius: 10,
          }}>
            <img
              src={code128Url}
              alt={`Code128 ${short}`}
              style={{ maxWidth: "100%", display: "block", margin: "0 auto" }}
            />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, marginTop: 6, letterSpacing: 0.4 }}>
            Barcode Code128 (compatibile lettori industriali)
          </div>
        </div>

        {/* LINK */}
        <div style={{ padding: "0 22px 16px" }}>
          <div style={{
            background: C.cardSoft, borderRadius: 10,
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 8,
            border: `1px solid ${C.border}`,
          }}>
            <div style={{
              flex: 1, minWidth: 0, fontSize: 11,
              fontFamily: "monospace", color: C.sub, fontWeight: 600,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{url}</div>
            <button
              onClick={handleCopyLink}
              style={{
                padding: "5px 10px",
                background: copied ? C.green : C.navy,
                color: "#fff", border: "none", borderRadius: 6,
                fontSize: 10, fontWeight: 800, cursor: "pointer",
                whiteSpace: "nowrap", letterSpacing: 0.4,
              }}
            >{copied ? "✓ COPIATO" : "COPIA"}</button>
          </div>
        </div>

        {/* AZIONI */}
        <div style={{
          padding: "12px 22px 18px",
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
        }}>
          <button
            onClick={handlePrint}
            style={{
              padding: "11px 14px",
              background: C.cardSoft, color: C.ink,
              border: `1px solid ${C.border}`, borderRadius: 10,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              letterSpacing: 0.3,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >🖨️ Stampa A4</button>
          <button
            onClick={handleShare}
            style={{
              padding: "11px 14px",
              background: C.navy, color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
              letterSpacing: 0.3,
              boxShadow: "0 2px 8px rgba(30,58,95,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >📤 Condividi</button>
        </div>
      </div>
    </div>
  );
}
