"use client";

import { OrdineConCommessa } from "../ordini-types";

interface Props {
  ord: OrdineConCommessa;
  ricevuti: number;
  totRighe: number;
  onClose: () => void;
  onMenu: () => void;
  onApriCommessa: () => void;
}

export default function RicezioneHeader({ ord, ricevuti, totRighe, onClose, onMenu, onApriCommessa }: Props) {
  const numero = ord.numero || ord.id.substring(0, 12);
  const fornitore = (ord as any).fornitore_nome || "—";
  const commessaCode = (ord as any).commessa?.code || "—";
  const cognome = (ord as any).commessa?.cognome || (ord as any).commessa?.cliente || "—";
  const pct = totRighe > 0 ? (ricevuti / totRighe) * 100 : 0;

  return (
    <>
      <div style={{
        position: "sticky", top: 0,
        background: "linear-gradient(180deg,#1A2A47 0%,#243558 100%)",
        color: "#fff", padding: "14px 16px 16px", zIndex: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div onClick={onClose} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(255,255,255,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "#fff", flexShrink: 0, cursor: "pointer"
          }}>✕</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "1.5px",
              color: "#E8B05C", textTransform: "uppercase", lineHeight: 1
            }}>Ricezione Merce</div>
            <div style={{
              fontSize: 16, fontWeight: 700, color: "#fff",
              marginTop: 4, lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
            }}>{numero} - {fornitore}</div>
          </div>
          <div onClick={onMenu} style={{
            width: 36, height: 36, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#fff", fontSize: 20, cursor: "pointer"
          }}>⋯</div>
        </div>
      </div>

      <div style={{
        padding: "10px 16px 12px",
        background: "linear-gradient(180deg,#243558 0%,#1A2A47 100%)",
        color: "#fff", fontSize: 12
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div onClick={onApriCommessa} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", background: "rgba(232,176,92,0.18)",
            color: "#FBF0DC", borderRadius: 8,
            fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer"
          }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
            {commessaCode} - {cognome}
          </div>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>
            EUR {formatNum(ord.totale_imponibile || 0)}
          </div>
        </div>
      </div>

      <div style={{
        margin: "12px 16px 0", padding: 12, background: "#fff",
        borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", color: "#5A6478", textTransform: "uppercase" }}>
            Avanzamento ricezione
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A2A47" }}>
            {ricevuti}/{totRighe}
          </div>
        </div>
        <div style={{ height: 8, background: "#E8EAF0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg,#1F5A3F,#28A0A0)",
            width: `${pct}%`, transition: "width 0.3s"
          }} />
        </div>
      </div>
    </>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
