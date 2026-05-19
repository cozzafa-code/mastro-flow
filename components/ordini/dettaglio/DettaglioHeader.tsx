"use client";

import { OrdineConCommessa } from "../ordini-types";

interface Props {
  ord: OrdineConCommessa;
  onClose: () => void;
  onMenu: () => void;
  onApriCommessa: () => void;
}

export default function DettaglioHeader({ ord, onClose, onMenu, onApriCommessa }: Props) {
  const numero = ord.numero || ord.id.substring(0, 12);
  const fornitore = (ord as any).fornitore_nome || "—";
  const commessaCode = (ord as any).commessa?.code || "—";
  const cognome = (ord as any).commessa?.cognome || (ord as any).commessa?.cliente || "—";
  const tot = (ord as any).totale_euro || 0;
  const nRighe = ((ord as any).righe || []).length || (((ord as any).righe || []).length) || 0;

  return (
    <div style={{
      position: "sticky", top: 0,
      background: "linear-gradient(180deg,#1A2A47 0%,#243558 100%)",
      color: "#fff", padding: "12px 14px 14px", zIndex: 60,
      boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div onClick={onClose} style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "rgba(255,255,255,0.1)", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 18, color: "#fff", flexShrink: 0, cursor: "pointer"
        }}>✕</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "1.5px",
            color: "#E8B05C", textTransform: "uppercase", lineHeight: 1
          }}>Ordine Fornitore</div>
          <div style={{
            fontSize: 17, fontWeight: 800, color: "#fff",
            marginTop: 4, lineHeight: 1.1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>{fornitore}</div>
          <div style={{
            fontSize: 10, color: "rgba(255,255,255,0.6)",
            fontFamily: "SF Mono, Menlo, monospace", letterSpacing: "0.5px",
            marginTop: 2
          }}>{numero}</div>
        </div>
        <div onClick={onMenu} style={{
          width: 36, height: 36, display: "flex", alignItems: "center",
          justifyContent: "center", color: "#fff", cursor: "pointer", fontSize: 20
        }}>⋯</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <div onClick={onApriCommessa} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 10px", background: "rgba(232,176,92,0.18)",
          color: "#FBF0DC", borderRadius: 8,
          fontWeight: 700, letterSpacing: "0.3px", cursor: "pointer"
        }}>
          <svg width={11} height={11} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
          </svg>
          {commessaCode} - {cognome}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 16, fontWeight: 800, color: "#fff" }}>
          EUR {formatNum(tot)}
        </div>
      </div>

      <div style={{
        display: "flex", gap: 14, marginTop: 8, fontSize: 11.5,
        color: "rgba(255,255,255,0.85)"
      }}>
        <span><strong style={{ color: "#fff" }}>{nRighe}</strong> righe</span>
        {(ord as any).consegna_prevista && (
          <>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>scadenza <strong style={{ color: "#fff" }}>
              {new Date((ord as any).consegna_prevista).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
            </strong></span>
          </>
        )}
      </div>
    </div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
