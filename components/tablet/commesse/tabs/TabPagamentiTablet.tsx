"use client";
import * as React from "react";
import { TT, cardStyle } from "../../design-system";
import { Icon } from "../../icons";

type StatoRata = "pagata" | "in_scadenza" | "da_pagare" | "scaduta";

interface Rata {
  id: string;
  numero: number;
  descrizione: string;
  tipo: "Acconto" | "SAL" | "Saldo" | "Extra";
  scadenza: string;
  importo: number;
  stato: StatoRata;
  dataPagamento?: string;
  metodo?: string;
}

const STATI: Record<StatoRata, { label: string; tint: keyof typeof TINTS }> = {
  pagata:      { label: "Pagata",       tint: "green"  },
  in_scadenza: { label: "In scadenza",  tint: "amber"  },
  da_pagare:   { label: "Da pagare",    tint: "blue"   },
  scaduta:     { label: "Scaduta",      tint: "red"    },
};

const TINTS = {
  green: TT.green, amber: TT.amber, blue: TT.blue, red: TT.red, teal: TT.teal,
} as const;

const DATA: Rata[] = [
  { id: "r1", numero: 1, descrizione: "Acconto alla firma del contratto",  tipo: "Acconto", scadenza: "28 marzo 2026",  importo: 3735, stato: "pagata",      dataPagamento: "30 marzo 2026", metodo: "Bonifico" },
  { id: "r2", numero: 2, descrizione: "Acconto inizio produzione",          tipo: "Acconto", scadenza: "10 aprile 2026", importo: 3735, stato: "pagata",      dataPagamento: "12 aprile 2026", metodo: "Bonifico" },
  { id: "r3", numero: 3, descrizione: "SAL al completamento montaggio 50%", tipo: "SAL",     scadenza: "5 maggio 2026",  importo: 2490, stato: "in_scadenza" },
  { id: "r4", numero: 4, descrizione: "Saldo finale a consegna lavoro",     tipo: "Saldo",   scadenza: "20 maggio 2026", importo: 2490, stato: "da_pagare" },
  { id: "r5", numero: 5, descrizione: "Costi aggiuntivi sopralluogo extra", tipo: "Extra",   scadenza: "1 maggio 2026",  importo: 350,  stato: "scaduta" },
];

const TOTALE = DATA.reduce((s, r) => s + r.importo, 0);
const INCASSATO = DATA.filter((r) => r.stato === "pagata").reduce((s, r) => s + r.importo, 0);
const DA_INCASSARE = TOTALE - INCASSATO;
const PCT = Math.round((INCASSATO / TOTALE) * 100);

const fmt = (n: number) => `€ ${n.toLocaleString("it-IT")}`;

export interface TabPagamentiTabletProps {
  onRegistraPagamento?: (id: string) => void;
  onAggiungiRata?: () => void;
}

export default function TabPagamentiTablet({ onRegistraPagamento, onAggiungiRata }: TabPagamentiTabletProps) {
  const prossima = DATA.find((r) => r.stato === "in_scadenza" || r.stato === "scaduta") || DATA.find((r) => r.stato === "da_pagare");

  return (
    <div>
      {/* SUMMARY CARD - 4 KPI mini + progress bar */}
      <div style={cardStyle({ padding: "18px 22px", marginBottom: 14 })}>
        <div style={{ display: "flex", gap: 28, marginBottom: 16 }}>
          <SummaryItem label="Totale commessa" value={fmt(TOTALE)} tint="slate" />
          <Divider />
          <SummaryItem label="Incassato" value={fmt(INCASSATO)} tint="green" />
          <Divider />
          <SummaryItem label="Da incassare" value={fmt(DA_INCASSARE)} tint="amber" />
          <Divider />
          {prossima && (
            <SummaryItem
              label="Prossima rata"
              value={fmt(prossima.importo)}
              sub={prossima.scadenza}
              tint="blue"
            />
          )}
        </div>

        {/* Progress bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11, color: TT.text2, fontWeight: 600 }}>
            <span>Avanzamento incassi</span>
            <span style={{ color: TT.green[500], fontWeight: 700 }}>{PCT}%</span>
          </div>
          <div style={{ height: 8, background: TT.bgSoft, borderRadius: 4, overflow: "hidden", position: "relative" }}>
            <div
              style={{
                height: "100%",
                width: `${PCT}%`,
                background: `linear-gradient(90deg, ${TT.green[400]}, ${TT.teal[400]})`,
                borderRadius: 4,
                transition: "width 0.4s",
              }}
            />
          </div>
        </div>
      </div>

      {/* Toolbar rate */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
          {DATA.length} rate
        </div>
        <button
          onClick={onAggiungiRata}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "7px 12px",
            background: TT.surface,
            color: TT.teal[500],
            border: `1px solid ${TT.teal[100]}`,
            borderRadius: 8,
            fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
          }}
        >
          <Icon name="plus" size={13} color={TT.teal[500]} strokeWidth={2.4} />
          Aggiungi rata
        </button>
      </div>

      {/* Lista rate */}
      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        {DATA.map((r, i) => (
          <RataRow
            key={r.id}
            rata={r}
            isLast={i === DATA.length - 1}
            onRegistra={() => onRegistraPagamento?.(r.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SummaryItem
// ============================================================

function SummaryItem({
  label, value, sub, tint,
}: { label: string; value: string; sub?: string; tint: "slate" | "green" | "amber" | "blue" }) {
  const color =
    tint === "slate" ? TT.text1 :
    tint === "green" ? TT.green[500] :
    tint === "amber" ? TT.amber[500] :
    TT.blue[500];

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 800, color,
        letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums",
        lineHeight: 1, whiteSpace: "nowrap",
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: TT.text3, marginTop: 4, fontWeight: 500 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, background: TT.border }} />;
}

// ============================================================
// RataRow
// ============================================================

interface RataRowProps {
  rata: Rata;
  isLast: boolean;
  onRegistra?: () => void;
}

function RataRow({ rata, isLast, onRegistra }: RataRowProps) {
  const s = STATI[rata.stato];
  const ramp = TINTS[s.tint];
  const isPagata = rata.stato === "pagata";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: isLast ? "none" : `1px solid ${TT.border}`,
      }}
    >
      {/* Numero */}
      <div
        style={{
          width: 38, height: 38, borderRadius: 10,
          background: ramp[100], color: ramp[500],
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, fontVariantNumeric: "tabular-nums",
          flexShrink: 0,
        }}
      >
        {isPagata ? <Icon name="check" size={18} color={ramp[500]} strokeWidth={2.8} /> : rata.numero}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{
            fontSize: 9, fontWeight: 700, color: TT.text3,
            letterSpacing: "0.5px", textTransform: "uppercase",
            fontFamily: "monospace",
          }}>
            {rata.tipo} #{rata.numero}
          </span>
          <span style={{
            display: "inline-flex",
            padding: "1px 7px",
            background: ramp[100],
            color: ramp[500],
            borderRadius: 999,
            fontSize: 9, fontWeight: 700,
            letterSpacing: "0.3px", textTransform: "uppercase",
          }}>
            {s.label}
          </span>
        </div>
        <div style={{
          fontSize: 13, fontWeight: 600, color: TT.text1,
          letterSpacing: "-0.1px",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {rata.descrizione}
        </div>
        <div style={{ fontSize: 11, color: TT.text3, marginTop: 2 }}>
          {isPagata ? (
            <>Pagata il {rata.dataPagamento} {rata.metodo && <>&middot; {rata.metodo}</>}</>
          ) : (
            <>Scadenza: {rata.scadenza}</>
          )}
        </div>
      </div>

      {/* Importo */}
      <div style={{
        fontSize: 16, fontWeight: 800,
        color: isPagata ? TT.green[500] : TT.text1,
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.4px",
        whiteSpace: "nowrap",
        minWidth: 100, textAlign: "right",
      }}>
        {fmt(rata.importo)}
      </div>

      {/* Azione */}
      {!isPagata && (
        <button
          onClick={onRegistra}
          style={{
            padding: "6px 12px",
            background: TT.teal[400],
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            whiteSpace: "nowrap",
            letterSpacing: "-0.05px",
          }}
        >
          Registra incasso
        </button>
      )}
      {isPagata && (
        <div style={{ width: 110 }} />
      )}
    </div>
  );
}
