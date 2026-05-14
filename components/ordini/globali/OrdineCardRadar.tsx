"use client";

import { OrdineConCommessa, OrdineStato } from "../ordini-types";

interface Props {
  ord: OrdineConCommessa;
  onClick: () => void;
  onQrClick: () => void;
}

export default function OrdineCardRadar({ ord, onClick, onQrClick }: Props) {
  const stato = (ord.stato as OrdineStato) || "bozza";
  const isRitardo = isInRitardo(ord);

  const colors = getColors(stato, isRitardo);
  const progress = computeProgress(ord);
  const scadenza = formatScadenza(ord);
  const commessaCode = (ord as any).commessa?.code || "—";
  const cognome = (ord as any).commessa?.cognome || (ord as any).commessa?.cliente || "—";
  const portaleAttivo = (ord as any).portale_token != null;

  return (
    <div onClick={onClick} style={{
      background: "#fff", borderRadius: 13, marginTop: 8,
      overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      position: "relative", cursor: "pointer",
      borderTop: `3px solid ${colors.border}`
    }}>
      <div onClick={(e) => { e.stopPropagation(); onQrClick(); }} style={{
        position: "absolute", top: 7, right: 8, width: 30, height: 30,
        background: portaleAttivo ? "#1A2A47" : "#fff",
        border: "1.5px solid #1A2A47", borderRadius: 7,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", zIndex: 1
      }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor"
          style={{ color: portaleAttivo ? "#28A0A0" : "#1A2A47" }}>
          <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm15 0h-2v2h2v-2zm-2 2h-2v2h2v-2zm-2-2h-2v2h2v-2zm4 0h-2v2h2v-2zm-4 4h2v-2h-2v2z" />
        </svg>
      </div>

      <div style={{
        padding: "6px 12px", display: "flex", alignItems: "center",
        justifyContent: "space-between", fontSize: 9.5, fontWeight: 800,
        letterSpacing: "0.7px", textTransform: "uppercase",
        background: colors.stripBg, color: colors.stripFg
      }}>
        <span>{colors.stripText}{portaleAttivo ? " · Portale attivo" : ""}</span>
        <span style={{
          fontFamily: "SF Mono, Menlo, monospace",
          color: "#5A6478", letterSpacing: "0.4px"
        }}>{ord.numero || ord.id.substring(0, 12)}</span>
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 10, marginBottom: 10
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 15, fontWeight: 800, color: "#1A2A47",
              lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", paddingRight: 36
            }}>{(ord as any).fornitore_nome || "—"}</div>
            <div style={{
              fontSize: 9.5, color: "#8893A8",
              marginTop: 2, fontWeight: 600
            }}>{(ord as any).fornitore_categoria || ""}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{
              fontSize: 17, fontWeight: 800, color: "#1A2A47",
              lineHeight: 1
            }}>EUR {formatNum(ord.totale_imponibile || 0)}</div>
            <div style={{
              fontSize: 8.5, color: "#8893A8", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 3
            }}>{progress.totRighe} righe</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          <Quad icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              {isRitardo ? <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></> :
                <rect x="3" y="4" width="18" height="18" rx="2" />}
            </svg>
          } lbl={isRitardo ? "Scaduto" : "Scadenza"} val={scadenza} valColor={isRitardo ? "#C44545" : "#1A2A47"} />
          <Quad icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
            </svg>
          } lbl="Commessa" val={`${commessaCode} ${cognome}`} valColor="#1A2A47" />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            flex: 1, height: 5, background: "#E8EAF0",
            borderRadius: 99, overflow: "hidden"
          }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: colors.progressFill,
              width: `${progress.pct}%`
            }} />
          </div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: "#1A2A47" }}>
            {progress.received}/{progress.totRighe}
          </div>
        </div>
      </div>
    </div>
  );
}

function Quad({ icon, lbl, val, valColor }: any) {
  return (
    <div style={{
      padding: "7px 9px", background: "#F4F6FA",
      borderRadius: 7, display: "flex", alignItems: "center", gap: 7
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: 6, background: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, color: "#5A6478", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
      }}>
        <div style={{ width: 11, height: 11 }}>{icon}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 8, fontWeight: 800, letterSpacing: "0.5px",
          color: "#8893A8", textTransform: "uppercase", lineHeight: 1
        }}>{lbl}</div>
        <div style={{
          fontSize: 10.5, fontWeight: 800, color: valColor,
          marginTop: 2, lineHeight: 1.1, overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap"
        }}>{val}</div>
      </div>
    </div>
  );
}

function isInRitardo(o: OrdineConCommessa): boolean {
  if (!o.data_consegna_richiesta) return false;
  if (["arrivato", "verificato"].includes(o.stato || "")) return false;
  return new Date(o.data_consegna_richiesta) < new Date();
}

function getColors(stato: OrdineStato, isRitardo: boolean) {
  if (isRitardo) return { border: "#C44545", stripBg: "linear-gradient(180deg,#F5DADA,#fff)", stripFg: "#A33333", stripText: "Scaduto", progressFill: "#C44545" };
  switch (stato) {
    case "arrivato":
    case "verificato":
      return { border: "#1F5A3F", stripBg: "linear-gradient(180deg,#D8EBDF,#fff)", stripFg: "#1F5A3F", stripText: "Completo", progressFill: "#1F5A3F" };
    case "in_transito":
    case "confermato":
      return { border: "#E8B05C", stripBg: "linear-gradient(180deg,#FBF0DC,#fff)", stripFg: "#8B6926", stripText: "In transito", progressFill: "linear-gradient(90deg,#E8B05C,#28A0A0)" };
    case "arrivato_parziale":
      return { border: "#E8B05C", stripBg: "linear-gradient(180deg,#FFE9C7,#fff)", stripFg: "#8B6926", stripText: "Parziale", progressFill: "#E8B05C" };
    case "inviato":
      return { border: "#3F7AC4", stripBg: "linear-gradient(180deg,#E3EDF9,#fff)", stripFg: "#2D5A8C", stripText: "Inviato", progressFill: "#3F7AC4" };
    case "bozza":
    default:
      return { border: "#8893A8", stripBg: "linear-gradient(180deg,#EEF2F7,#fff)", stripFg: "#5A6478", stripText: "Bozza", progressFill: "#8893A8" };
  }
}

function computeProgress(o: OrdineConCommessa): { pct: number; received: number; totRighe: number } {
  const righeRaw = (o as any).righe;
  const totRighe = Array.isArray(righeRaw) ? righeRaw.length : (o.numero_righe || 0);
  let received = 0;
  if (Array.isArray((o as any).righe_verificate)) {
    received = (o as any).righe_verificate.filter((r: any) => r.stato === "ok" || r.stato === "parziale").length;
  }
  if (o.stato === "arrivato" || o.stato === "verificato") received = totRighe;
  return { pct: totRighe > 0 ? (received / totRighe) * 100 : 0, received, totRighe };
}

function formatScadenza(o: OrdineConCommessa): string {
  if (!o.data_consegna_richiesta) return "—";
  const d = new Date(o.data_consegna_richiesta);
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

function formatNum(v: number): string {
  return v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
