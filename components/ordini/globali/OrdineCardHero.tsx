"use client";

import { OrdineConCommessa } from "../ordini-types";

interface Props {
  ord: OrdineConCommessa;
  onClick: () => void;
  onScan: () => void;
}

export default function OrdineCardHero({ ord, onClick, onScan }: Props) {
  const stato = ord.stato || "bozza";
  const numero = ord.numero || ord.id.substring(0, 12);
  const fornitore = (ord as any).fornitore_nome || "—";
  const commessaCode = (ord as any).commessa?.code || "—";
  const cognome = (ord as any).commessa?.cognome || (ord as any).commessa?.cliente || "—";

  const heroBg = stato === "arrivato" || stato === "verificato" ? "linear-gradient(135deg,#2D6B4A 0%,#1F5A3F 100%)" :
    stato === "in_transito" ? "linear-gradient(135deg,#243558 0%,#1A2A47 100%)" :
      stato === "bozza" ? "linear-gradient(135deg,#5A6478 0%,#3F485A 100%)" :
        "linear-gradient(135deg,#243558 0%,#1A2A47 100%)";

  const righeArr = ((ord as any).righe || []) as any[];
  const totRighe = righeArr.length || (((ord as any).righe || []).length) || 0;
  const received = ((ord as any).righe_verificate || []).filter((r: any) => r.stato === "ok").length;

  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 15, marginTop: 8,
      overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", cursor: "pointer"
    }}>
      <div style={{ padding: "10px 12px 12px", color: "#fff", position: "relative", overflow: "hidden", background: heroBg }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 7, position: "relative", zIndex: 1
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "1px",
            color: "rgba(255,255,255,0.6)",
            fontFamily: "SF Mono, Menlo, monospace"
          }}>{numero}</div>
          <div style={{
            padding: "2px 7px", background: "rgba(255,255,255,0.18)",
            color: "#fff", borderRadius: 5, fontSize: 8.5, fontWeight: 800,
            letterSpacing: "0.4px", textTransform: "uppercase"
          }}>{stato.replace("_", " ")}</div>
        </div>
        <div style={{
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", gap: 9, position: "relative", zIndex: 1
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{fornitore}</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: 600 }}>
              {totRighe} righe
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#E8B05C", lineHeight: 1 }}>
              EUR {formatNum((ord as any).totale_euro || 0)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 12px 9px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
        <Stat num={`${received}/${totRighe}`} lbl="Ricevuti" />
        <Stat num="0" lbl="Anomalie" />
        <Stat num="—" lbl="Δ Prezzo" />
      </div>

      <div style={{
        padding: "9px 12px", borderTop: "1px dashed #E8EAF0",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 7,
        background: "#FAFBFD"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
          <span style={{
            padding: "3px 8px", background: "#1A2A47",
            color: "#E8B05C", borderRadius: 5,
            fontSize: 9.5, fontWeight: 800, letterSpacing: "0.4px"
          }}>{commessaCode}</span>
          <span style={{
            fontSize: 10.5, color: "#5A6478", fontWeight: 700,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>{cognome}</span>
        </div>
        <div onClick={(e) => { e.stopPropagation(); onScan(); }} style={{
          padding: "5px 10px", background: "#28A0A0", color: "#fff",
          borderRadius: 7, fontSize: 9.5, fontWeight: 800,
          letterSpacing: "0.5px", textTransform: "uppercase",
          display: "inline-flex", alignItems: "center", gap: 4,
          boxShadow: "0 2px 6px rgba(40,160,160,0.3)", cursor: "pointer"
        }}>Scan</div>
      </div>
    </div>
  );
}

function Stat({ num, lbl }: { num: string; lbl: string }) {
  return (
    <div style={{ textAlign: "center", padding: "7px 4px", background: "#F4F6FA", borderRadius: 8 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#1A2A47", lineHeight: 1 }}>{num}</div>
      <div style={{
        fontSize: 7.5, fontWeight: 800, color: "#8893A8",
        textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 3
      }}>{lbl}</div>
    </div>
  );
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
