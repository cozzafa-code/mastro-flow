"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

const TINTS = {
  green: TT.green, red: TT.red, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, teal: TT.teal,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

const fmt = (n: number) => `€ ${n.toLocaleString("it-IT")}`;

interface MeseDato {
  mese: string;
  fatturato: number;
  costi: number;
}

const MESI: MeseDato[] = [
  { mese: "Nov",  fatturato: 18450, costi: 12200 },
  { mese: "Dic",  fatturato: 22300, costi: 14800 },
  { mese: "Gen",  fatturato: 19850, costi: 13100 },
  { mese: "Feb",  fatturato: 24100, costi: 15200 },
  { mese: "Mar",  fatturato: 28900, costi: 17400 },
  { mese: "Apr",  fatturato: 24850, costi: 16200 },
];

interface Fattura {
  numero: string;
  cliente: string;
  data: string;
  importo: number;
  stato: "pagata" | "in_attesa" | "scaduta";
}

const FATT_EMESSE: Fattura[] = [
  { numero: "FE-2026-052", cliente: "Marino Edilizia",   data: "23 apr", importo: 8450,  stato: "pagata"    },
  { numero: "FE-2026-051", cliente: "Verdi Giuseppe",    data: "22 apr", importo: 3735,  stato: "pagata"    },
  { numero: "FE-2026-050", cliente: "Bianchi Maria",     data: "21 apr", importo: 3450,  stato: "in_attesa" },
  { numero: "FE-2026-049", cliente: "Rossi & Co.",       data: "18 apr", importo: 9450,  stato: "in_attesa" },
  { numero: "FE-2026-048", cliente: "Esposito Franco",   data: "10 apr", importo: 1240,  stato: "scaduta"   },
];

const FATT_RICEVUTE: Fattura[] = [
  { numero: "FR-2026-118", cliente: "Aluplast Italia",     data: "21 apr", importo: 4890, stato: "in_attesa" },
  { numero: "FR-2026-117", cliente: "Schuco Italia",       data: "18 apr", importo: 2150, stato: "pagata"    },
  { numero: "FR-2026-116", cliente: "Saint-Gobain Glass",  data: "15 apr", importo: 5680, stato: "pagata"    },
  { numero: "FR-2026-115", cliente: "Maico Hardware",      data: "12 apr", importo: 1450, stato: "in_attesa" },
];

interface Pagamento {
  data: string;
  cliente: string;
  metodo: string;
  importo: number;
  tipo: "incasso" | "uscita";
}

const PAGAMENTI: Pagamento[] = [
  { data: "Oggi 11:30",      cliente: "Verdi Giuseppe",     metodo: "Bonifico",      importo: 2490,  tipo: "incasso" },
  { data: "Oggi 09:15",      cliente: "Schuco Italia",      metodo: "Bonifico USC",  importo: 2150,  tipo: "uscita"  },
  { data: "Ieri 16:42",      cliente: "Marino Edilizia",    metodo: "Assegno",       importo: 8450,  tipo: "incasso" },
  { data: "Ieri 10:20",      cliente: "Saint-Gobain",       metodo: "Bonifico USC",  importo: 5680,  tipo: "uscita"  },
  { data: "23 apr",          cliente: "Bianchi Maria",      metodo: "POS",           importo: 1500,  tipo: "incasso" },
];

const STATO_FATT: Record<Fattura["stato"], { label: string; tint: keyof typeof TINTS }> = {
  pagata:    { label: "Pagata",    tint: "green"  },
  in_attesa: { label: "In attesa", tint: "amber"  },
  scaduta:   { label: "Scaduta",   tint: "red"    },
};

export default function ContabilitaTablet() {
  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Contabilità
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            Aprile 2026 &middot; € 24.850 fatturato &middot; € 16.200 costi &middot; margine 28%
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnSecondario}>
            <Icon name="documento" size={13} color={TT.text2} strokeWidth={2.2} />
            Esporta PDF
          </button>
          <button style={btnPrimario(TT.pink[400], TT.pink[300])}>
            <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
            Nuova fattura
          </button>
        </div>
      </div>

      {/* KPI 6 INDICATORI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
        <KpiMini label="Fatturato"     value="€ 24850"  delta="+15%" tint="green"  icon="trendUp"     />
        <KpiMini label="Incassato"     value="€ 18650"  delta="75%"  tint="teal"   icon="check"       />
        <KpiMini label="Da incassare"  value="€ 6200"   delta="2 in scadenza" tint="amber" icon="bell" />
        <KpiMini label="Costi"         value="€ 16200"  delta="+8%"  tint="orange" icon="ordini"      />
        <KpiMini label="Margine"       value="28%"          delta="+4pt" tint="violet" icon="contabilita" />
        <KpiMini label="Cassa"         value="€ 12450"  delta=""     tint="blue"   icon="contabilita" />
      </div>

      {/* GRAFICO 6 MESI */}
      <div style={cardStyle({ padding: "16px 20px", marginBottom: 14 })}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
              Andamento 6 mesi
            </div>
            <div style={{ fontSize: 11, color: TT.text3 }}>
              Fatturato vs Costi
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
            <Legend color={TT.green[400]} label="Fatturato" />
            <Legend color={TT.amber[400]} label="Costi" />
          </div>
        </div>
        <BarChart data={MESI} />
      </div>

      {/* GRID 3 PANEL */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <FatturePanel titolo="Fatture emesse" data={FATT_EMESSE} tint="green" icon="contabilita" />
        <FatturePanel titolo="Fatture ricevute" data={FATT_RICEVUTE} tint="orange" icon="ordini" />
        <PagamentiPanel data={PAGAMENTI} />
      </div>
    </div>
  );
}

// ============================================================
// KpiMini - 6 colonne, piu' compatto
// ============================================================

function KpiMini({ label, value, delta, tint, icon }: { label: string; value: string; delta: string; tint: keyof typeof TINTS; icon: IconName }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 12px" })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: TT.text3, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" }}>
          {label}
        </span>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: ramp[100],
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={11} color={ramp[500]} strokeWidth={2.4} />
        </div>
      </div>
      <div style={{
        fontSize: 16, fontWeight: 800,
        color: ramp[500],
        letterSpacing: "-0.4px",
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 9, color: TT.text3, fontWeight: 600, marginTop: 4 }}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ============================================================
// BarChart - 6 mesi, doppia barra
// ============================================================

function BarChart({ data }: { data: MeseDato[] }) {
  const max = Math.max(...data.flatMap((d) => [d.fatturato, d.costi]));
  const H = 130;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: H + 30 }}>
      {data.map((d) => {
        const hF = (d.fatturato / max) * H;
        const hC = (d.costi / max) * H;
        return (
          <div key={d.mese} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              display: "flex",
              gap: 4,
              alignItems: "flex-end",
              height: H,
              width: "100%",
              justifyContent: "center",
            }}>
              <div style={{
                width: "40%",
                maxWidth: 24,
                height: hF,
                background: `linear-gradient(180deg, ${TT.green[400]}, ${TT.green[500]})`,
                borderRadius: "4px 4px 0 0",
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  top: -16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 9,
                  fontWeight: 700,
                  color: TT.green[500],
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {Math.round(d.fatturato/1000)}k
                </div>
              </div>
              <div style={{
                width: "40%",
                maxWidth: 24,
                height: hC,
                background: `linear-gradient(180deg, ${TT.amber[300]}, ${TT.amber[400]})`,
                borderRadius: "4px 4px 0 0",
              }} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: TT.text2, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              {d.mese}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span style={{ color: TT.text2, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// ============================================================
// FatturePanel
// ============================================================

function FatturePanel({ titolo, data, tint, icon }: { titolo: string; data: Fattura[]; tint: keyof typeof TINTS; icon: IconName }) {
  const ramp = TINTS[tint];
  const tot = data.reduce((s, f) => s + f.importo, 0);
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden", height: "100%" })}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: ramp[50],
        borderBottom: `1px solid ${ramp[100]}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: ramp[400],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={icon} size={12} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: ramp[500], letterSpacing: "-0.1px" }}>
            {titolo}
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums" }}>
          {fmt(tot)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {data.map((f, i) => {
          const sm = STATO_FATT[f.stato];
          const smRamp = TINTS[sm.tint];
          return (
            <div
              key={f.numero}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${TT.border}`,
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: TT.text3, fontWeight: 700, marginBottom: 2 }}>
                  {f.numero}
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: TT.text1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {f.cliente}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{
                    padding: "1px 6px",
                    background: smRamp[100], color: smRamp[500],
                    borderRadius: 999,
                    fontSize: 8, fontWeight: 700,
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {sm.label}
                  </span>
                  <span style={{ fontSize: 9, color: TT.text3 }}>
                    {f.data}
                  </span>
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800,
                color: TT.text1,
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}>
                {fmt(f.importo)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PagamentiPanel
// ============================================================

function PagamentiPanel({ data }: { data: Pagamento[] }) {
  const tot = data.reduce((s, p) => s + (p.tipo === "incasso" ? p.importo : -p.importo), 0);
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden", height: "100%" })}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: TT.teal[50],
        borderBottom: `1px solid ${TT.teal[100]}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: TT.teal[400],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="contabilita" size={12} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.teal[500], letterSpacing: "-0.1px" }}>
            Pagamenti recenti
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800,
          color: tot >= 0 ? TT.green[500] : TT.red[500],
          fontVariantNumeric: "tabular-nums",
        }}>
          {tot >= 0 ? "+" : ""}{fmt(tot)}
        </div>
      </div>
      <div>
        {data.map((p, i) => {
          const isIn = p.tipo === "incasso";
          const ramp = isIn ? TT.green : TT.amber;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderTop: i === 0 ? "none" : `1px solid ${TT.border}`,
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: ramp[100],
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={isIn ? "plus" : "chevronRight"} size={12} color={ramp[500]} strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: TT.text1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  letterSpacing: "-0.05px",
                }}>
                  {p.cliente}
                </div>
                <div style={{ fontSize: 9, color: TT.text3, marginTop: 2 }}>
                  {p.data} &middot; {p.metodo}
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800,
                color: isIn ? TT.green[500] : TT.red[500],
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}>
                {isIn ? "+" : "−"}{fmt(p.importo)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// btn helpers
// ============================================================

const btnSecondario: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "9px 12px",
  background: TT.surface,
  color: TT.text2,
  border: `1px solid ${TT.borderStrong}`,
  borderRadius: 10,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: TT.fontFamily,
};

function btnPrimario(bg: string, shadow: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "9px 14px",
    background: bg,
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: TT.fontFamily,
    boxShadow: `0 2px 8px ${shadow}`,
  };
}
