"use client";
import React, { useMemo, useState } from "react";
import type { CashflowGiorno } from "../../hooks/useFinanze";

// fliwoX palette (Home V2)
const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const GREEN_SOFT = "#D5EBE0";
const RED = "#C73E1D";
const RED_DARK = "#8E2A14";
const RED_SOFT = "#F8DCD3";
const TEXT = "#1B3A5C";
const MUTED = "#5C6B7A";
const BORDER = "#E5EAF0";
const BG_SOFT = "#F7F9FB";

type Granularita = "giorno" | "mese" | "trim" | "anno";

interface Bucket {
  key: string;          // identificatore (yyyy-mm-dd / yyyy-mm / yyyy-Q / yyyy)
  label: string;        // testo breve sotto la barra
  labelFull: string;    // testo drill-down ("Maggio 2026")
  in: number;
  out: number;
  eventi: CashflowGiorno["eventi"];
}

interface Props {
  cashflow: CashflowGiorno[];
}

const MESI_BREVI = ["G", "F", "M", "A", "M", "G", "L", "A", "S", "O", "N", "D"];
const MESI_LUNGHI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function fmtEuro(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000) return (n / 1000).toFixed(1).replace(".", ",") + "k";
  return Math.round(n).toString();
}

function fmtEuroFull(n: number): string {
  return new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 }).format(n);
}

// === Aggregazione cashflow per granularità ===
function aggrega(cashflow: CashflowGiorno[], g: Granularita): Bucket[] {
  if (!cashflow || cashflow.length === 0) return [];

  if (g === "giorno") {
    // ultimi 30 giorni
    return cashflow.slice(0, 30).map((c) => {
      const d = new Date(c.data);
      return {
        key: c.data,
        label: String(d.getDate()),
        labelFull: d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" }),
        in: c.in_atteso,
        out: c.out_atteso,
        eventi: c.eventi,
      };
    });
  }

  // Aggregazione mese / trim / anno
  const map = new Map<string, Bucket>();
  cashflow.forEach((c) => {
    const d = new Date(c.data);
    let key = "";
    let label = "";
    let labelFull = "";
    if (g === "mese") {
      key = `${d.getFullYear()}-${d.getMonth()}`;
      label = MESI_BREVI[d.getMonth()];
      labelFull = `${MESI_LUNGHI[d.getMonth()]} ${d.getFullYear()}`;
    } else if (g === "trim") {
      const q = Math.floor(d.getMonth() / 3) + 1;
      key = `${d.getFullYear()}-Q${q}`;
      label = `Q${q}`;
      labelFull = `Trimestre Q${q} ${d.getFullYear()}`;
    } else {
      key = `${d.getFullYear()}`;
      label = key;
      labelFull = `Anno ${key}`;
    }

    if (!map.has(key)) {
      map.set(key, { key, label, labelFull, in: 0, out: 0, eventi: [] });
    }
    const b = map.get(key)!;
    b.in += c.in_atteso;
    b.out += c.out_atteso;
    b.eventi.push(...c.eventi);
  });

  return Array.from(map.values());
}

export default function CalendarioTimelineFinanze({ cashflow }: Props) {
  const [gran, setGran] = useState<Granularita>("mese");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const buckets = useMemo(() => aggrega(cashflow, gran), [cashflow, gran]);

  // Massimo per scalare le barre
  const maxVal = useMemo(() => {
    let m = 0;
    buckets.forEach((b) => {
      m = Math.max(m, b.in, b.out);
    });
    return m || 1;
  }, [buckets]);

  // Bucket selezionato (default: primo non vuoto se nulla scelto)
  const selected = useMemo(() => {
    if (selectedKey) return buckets.find((b) => b.key === selectedKey) || null;
    return buckets.find((b) => b.in > 0 || b.out > 0) || buckets[0] || null;
  }, [buckets, selectedKey]);

  const totIn = buckets.reduce((s, b) => s + b.in, 0);
  const totOut = buckets.reduce((s, b) => s + b.out, 0);
  const saldo = totIn - totOut;

  // Limite colonne visibili
  const cols = gran === "giorno" ? Math.min(buckets.length, 30) : buckets.length;
  const gridCols = `repeat(${cols}, 1fr)`;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8, color: NAVY, textTransform: "uppercase" }}>
          Timeline Entrate/Uscite
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: NAVY, padding: "3px 10px", background: BG_SOFT, borderRadius: 6 }}>
          {new Date().getFullYear()}
        </div>
      </div>

      {/* Switch granularità */}
      <div style={{ display: "flex", gap: 2, background: "#F1F4F7", padding: 2, borderRadius: 8, marginBottom: 10 }}>
        {(["giorno", "mese", "trim", "anno"] as Granularita[]).map((g) => (
          <button key={g} onClick={() => { setGran(g); setSelectedKey(null); }} style={{
            flex: 1, padding: "5px 0", fontSize: 10, fontWeight: 700,
            color: gran === g ? NAVY : MUTED,
            background: gran === g ? "#fff" : "transparent",
            border: "none", borderRadius: 6, cursor: "pointer",
            boxShadow: gran === g ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            textTransform: "capitalize",
          }}>{g === "trim" ? "Trim" : g}</button>
        ))}
      </div>

      {/* Grid barre */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 3, alignItems: "center", height: 120, padding: "6px 0", borderBottom: "1px dashed " + BORDER, position: "relative" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: NAVY, opacity: 0.3 }} />
        {buckets.slice(0, cols).map((b) => {
          const isAct = selected?.key === b.key;
          const hIn = Math.max((b.in / maxVal) * 50, b.in > 0 ? 3 : 0);
          const hOut = Math.max((b.out / maxVal) * 50, b.out > 0 ? 3 : 0);
          return (
            <div key={b.key} onClick={() => setSelectedKey(b.key)} style={{
              display: "flex", flexDirection: "column", alignItems: "stretch", height: "100%",
              justifyContent: "center", gap: 1, cursor: "pointer", position: "relative",
            }}>
              <div style={{
                height: `${hIn}%`, minHeight: b.in > 0 ? 2 : 0,
                background: isAct ? AMBER : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
                borderRadius: "2px 2px 0 0",
                outline: isAct ? `1.5px solid #fff` : "none", outlineOffset: -1,
              }} />
              <div style={{
                height: `${hOut}%`, minHeight: b.out > 0 ? 2 : 0,
                background: isAct ? AMBER : `linear-gradient(0deg, ${RED}, ${RED_DARK})`,
                borderRadius: "0 0 2px 2px",
                outline: isAct ? `1.5px solid #fff` : "none", outlineOffset: -1,
              }} />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 3, marginTop: 5 }}>
        {buckets.slice(0, cols).map((b) => (
          <div key={b.key} style={{ fontSize: 8, fontWeight: 700, color: selected?.key === b.key ? TEAL : MUTED, textAlign: "center" }}>
            {b.label}
          </div>
        ))}
      </div>

      {/* Footer totali periodo */}
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BG_SOFT}` }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: GREEN, lineHeight: 1 }}>+{fmtEuro(totIn)}</div>
          <div style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.4, marginTop: 2, textTransform: "uppercase" }}>Entrate</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: RED, lineHeight: 1 }}>-{fmtEuro(totOut)}</div>
          <div style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.4, marginTop: 2, textTransform: "uppercase" }}>Uscite</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: saldo >= 0 ? NAVY : RED, lineHeight: 1 }}>
            {saldo >= 0 ? "+" : ""}{fmtEuro(saldo)}
          </div>
          <div style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.4, marginTop: 2, textTransform: "uppercase" }}>Saldo</div>
        </div>
      </div>

      {/* Drill-down */}
      {selected && (
        <div style={{ marginTop: 10, padding: 10, background: BG_SOFT, borderRadius: 10, border: `1px dashed ${BORDER}` }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: NAVY, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 6 }}>
            {selected.labelFull} · {selected.eventi.length} mov.
          </div>
          {selected.eventi.length === 0 && (
            <div style={{ fontSize: 11, color: MUTED, padding: "8px 0", textAlign: "center" }}>
              Nessun movimento nel periodo
            </div>
          )}
          {selected.eventi.slice(0, 8).map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: i < Math.min(selected.eventi.length, 8) - 1 ? `1px solid ${BORDER}` : "none", fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", display: "inline-flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6,
                  background: e.direzione === "in" ? GREEN_SOFT : RED_SOFT,
                  color: e.direzione === "in" ? GREEN : RED,
                  fontWeight: 800, fontSize: 11,
                }}>{e.direzione === "in" ? "+" : "−"}</span>
                <span style={{ fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.descrizione}
                </span>
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: e.direzione === "in" ? GREEN : RED, flexShrink: 0, marginLeft: 6 }}>
                {e.direzione === "in" ? "+" : "-"}{fmtEuroFull(Math.abs(e.importo))}
              </span>
            </div>
          ))}
          {selected.eventi.length > 8 && (
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, textAlign: "center", padding: "6px 0" }}>
              +{selected.eventi.length - 8} altri movimenti
            </div>
          )}
        </div>
      )}
    </div>
  );
}
