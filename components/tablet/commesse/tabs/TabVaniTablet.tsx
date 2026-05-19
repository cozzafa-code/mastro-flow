"use client";
import * as React from "react";
import { TT, cardStyle } from "../../design-system";
import { Icon } from "../../icons";

type StatoVano = "rilevato" | "preventivato" | "produzione" | "montato";
type FormaVano = "rect" | "arch" | "shaped";

interface Vano {
  id: string;
  codice: string;
  nome: string;
  larghezza: number; // mm
  altezza: number;   // mm
  sistema: string;
  forma: FormaVano;
  pezzi: number;
  stato: StatoVano;
  valore: string;
  preventivato: boolean;
}

const STATI: Record<StatoVano, { label: string; tint: keyof typeof TINTS }> = {
  rilevato:     { label: "Rilevato",     tint: "amber" },
  preventivato: { label: "Preventivato", tint: "blue"  },
  produzione:   { label: "Produzione",   tint: "teal"  },
  montato:      { label: "Montato",      tint: "green" },
};

const TINTS = {
  amber: TT.amber, blue: TT.blue, teal: TT.teal, green: TT.green,
} as const;

const DATA: Vano[] = [
  { id: "v1", codice: "V-001", nome: "Soggiorno - Finestra principale", larghezza: 1800, altezza: 1400, sistema: "Aluplast IDEAL 7000", forma: "rect",   pezzi: 2, stato: "produzione",   valore: "€ 1.890", preventivato: true },
  { id: "v2", codice: "V-002", nome: "Soggiorno - Porta finestra",      larghezza: 1600, altezza: 2300, sistema: "Aluplast IDEAL 7000", forma: "rect",   pezzi: 2, stato: "produzione",   valore: "€ 2.340", preventivato: true },
  { id: "v3", codice: "V-003", nome: "Cucina - Finestra",                larghezza: 1200, altezza: 1300, sistema: "Aluplast IDEAL 7000", forma: "rect",   pezzi: 2, stato: "produzione",   valore: "€ 1.420", preventivato: true },
  { id: "v4", codice: "V-004", nome: "Cucina - Portafinestra balcone", larghezza: 900,  altezza: 2300, sistema: "Aluplast IDEAL 7000", forma: "rect",   pezzi: 1, stato: "produzione",   valore: "€ 1.560", preventivato: true },
  { id: "v5", codice: "V-005", nome: "Camera 1 - Finestra arco",       larghezza: 1400, altezza: 1600, sistema: "Aluplast ENERGETO",   forma: "arch",   pezzi: 2, stato: "preventivato", valore: "€ 1.980", preventivato: true },
  { id: "v6", codice: "V-006", nome: "Camera 2 - Finestra",             larghezza: 1200, altezza: 1300, sistema: "Aluplast IDEAL 7000", forma: "rect",   pezzi: 2, stato: "preventivato", valore: "€ 1.380", preventivato: true },
  { id: "v7", codice: "V-007", nome: "Bagno padronale - Vasistas",      larghezza: 800,  altezza: 600,  sistema: "Aluplast IDEAL 7000", forma: "rect",   pezzi: 1, stato: "rilevato",     valore: "€ 580",   preventivato: false },
  { id: "v8", codice: "V-008", nome: "Ingresso - Sopraluce sagomato",   larghezza: 2000, altezza: 800,  sistema: "Aluplast IDEAL 7000", forma: "shaped", pezzi: 1, stato: "rilevato",     valore: "€ 1.300", preventivato: false },
];

export interface TabVaniTabletProps {
  onOpenVano?: (id: string) => void;
  onAddVano?: () => void;
}

export default function TabVaniTablet({ onOpenVano, onAddVano }: TabVaniTabletProps) {
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
            8 vani
          </div>
          <span style={{ fontSize: 11, color: TT.text3 }}>&middot;</span>
          <div style={{ fontSize: 12, color: TT.text2 }}>
            13 pezzi totali &middot; 6 preventivati
          </div>
        </div>
        <button
          onClick={onAddVano}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 12px",
            background: TT.surface,
            color: TT.teal[500],
            border: `1px solid ${TT.teal[100]}`,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
          }}
        >
          <Icon name="plus" size={13} color={TT.teal[500]} strokeWidth={2.4} />
          Aggiungi vano
        </button>
      </div>

      {/* Grid 2 colonne */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {DATA.map((v) => (
          <VanoCard key={v.id} vano={v} onOpen={() => onOpenVano?.(v.id)} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// VanoCard
// ============================================================

interface VanoCardProps {
  vano: Vano;
  onOpen?: () => void;
}

function VanoCard({ vano, onOpen }: VanoCardProps) {
  const s = STATI[vano.stato];
  const ramp = TINTS[s.tint];
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={cardStyle({
        padding: 14,
        cursor: "pointer",
        display: "flex",
        gap: 14,
        alignItems: "stretch",
        borderColor: hover ? TT.teal[100] : TT.border,
        boxShadow: hover ? "0 4px 12px rgba(20,184,166,0.10)" : TT.shadowSm,
        transition: "all 0.12s",
      })}
    >
      {/* Miniatura schema */}
      <div
        style={{
          width: 92,
          height: 92,
          background: TT.bgSoft,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          border: `1px solid ${TT.border}`,
        }}
      >
        <VanoSchema forma={vano.forma} larghezza={vano.larghezza} altezza={vano.altezza} pezzi={vano.pezzi} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Riga 1: codice + stato badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: 11,
            fontWeight: 700,
            color: TT.text2,
            background: TT.bgSoft,
            padding: "2px 6px",
            borderRadius: 5,
          }}>
            {vano.codice}
          </span>
          <span style={{
            display: "inline-flex",
            padding: "2px 7px",
            background: ramp[100],
            color: ramp[500],
            borderRadius: 12,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}>
            {s.label}
          </span>
        </div>

        {/* Riga 2: nome */}
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: TT.text1,
          letterSpacing: "-0.15px",
          marginBottom: 6,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {vano.nome}
        </div>

        {/* Riga 3: dimensioni + sistema */}
        <div style={{ fontSize: 11, color: TT.text2, marginBottom: 4 }}>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {vano.larghezza} × {vano.altezza} mm
          </span>
          <span style={{ color: TT.text3, margin: "0 6px" }}>&middot;</span>
          <span>{vano.pezzi} pz</span>
        </div>

        <div style={{ fontSize: 11, color: TT.text3, marginBottom: 8 }}>
          {vano.sistema}
        </div>

        {/* Riga 4: valore + chevron */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <div style={{
            fontSize: 14,
            fontWeight: 800,
            color: TT.text1,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.3px",
          }}>
            {vano.valore}
          </div>
          <Icon
            name="chevronRight"
            size={14}
            color={hover ? TT.teal[500] : TT.text3}
            strokeWidth={2.2}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VanoSchema - SVG miniatura forma vano
// ============================================================

function VanoSchema({
  forma, larghezza, altezza, pezzi,
}: { forma: FormaVano; larghezza: number; altezza: number; pezzi: number }) {
  const padding = 6;
  const maxW = 80;
  const maxH = 80;
  const aspect = larghezza / altezza;
  let w = maxW, h = maxH;
  if (aspect > 1) {
    h = maxW / aspect;
  } else {
    w = maxH * aspect;
  }
  const x = (maxW - w) / 2 + padding;
  const y = (maxH - h) / 2 + padding;
  const stroke = TT.text2;
  const sw = 1.5;

  return (
    <svg width="92" height="92" viewBox="0 0 92 92">
      {/* Forma */}
      {forma === "rect" && (
        <rect x={x} y={y} width={w} height={h} fill="none" stroke={stroke} strokeWidth={sw} />
      )}
      {forma === "arch" && (
        <>
          <rect x={x} y={y + w * 0.25} width={w} height={h - w * 0.25} fill="none" stroke={stroke} strokeWidth={sw} />
          <path
            d={`M ${x} ${y + w * 0.25} Q ${x + w / 2} ${y - w * 0.05}, ${x + w} ${y + w * 0.25}`}
            fill="none" stroke={stroke} strokeWidth={sw}
          />
        </>
      )}
      {forma === "shaped" && (
        <polygon
          points={`${x},${y + h * 0.4} ${x + w * 0.3},${y} ${x + w * 0.7},${y} ${x + w},${y + h * 0.4} ${x + w},${y + h} ${x},${y + h}`}
          fill="none" stroke={stroke} strokeWidth={sw}
        />
      )}

      {/* Divisione anta verticale (1 sola se pezzi >= 2) */}
      {pezzi >= 2 && forma !== "shaped" && (
        <line
          x1={x + w / 2} y1={forma === "arch" ? y + w * 0.05 : y}
          x2={x + w / 2} y2={y + h}
          stroke={TT.text3}
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      )}

      {/* Apertura (freccia angolare) */}
      <path
        d={`M ${x + 4} ${y + h - 4} L ${x + w / 2 - 4} ${y + 4}`}
        stroke={TT.teal[400]}
        strokeWidth={1}
        fill="none"
      />
    </svg>
  );
}
