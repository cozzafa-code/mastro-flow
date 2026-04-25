"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

type StatoOrd = "bozza" | "inviato" | "confermato" | "in_consegna" | "ricevuto" | "annullato";
type Filtro = "tutti" | "in_attesa" | "consegna_prossima" | "ricevuti" | "ritardo";

interface Ordine {
  id: string;
  numero: string;
  fornitore: string;
  fornitoreLogo: string; // colore avatar
  data: string;
  consegnaPrevista: string;
  giorniRitardo: number;
  pezzi: number;
  importo: number;
  stato: StatoOrd;
  commesse: string[];
  categoria: string;
}

const STATI: Record<StatoOrd, { label: string; tint: keyof typeof TINTS }> = {
  bozza:       { label: "Bozza",       tint: "slate"  },
  inviato:     { label: "Inviato",     tint: "blue"   },
  confermato:  { label: "Confermato",  tint: "violet" },
  in_consegna: { label: "In consegna", tint: "amber"  },
  ricevuto:    { label: "Ricevuto",    tint: "green"  },
  annullato:   { label: "Annullato",   tint: "red"    },
};

const TINTS = {
  slate: TT.slate, blue: TT.blue, violet: TT.violet,
  amber: TT.amber, green: TT.green, red: TT.red, orange: TT.orange, teal: TT.teal,
} as const;

const FILTRI: { id: Filtro; label: string; count: number; tint?: keyof typeof TINTS }[] = [
  { id: "tutti",              label: "Tutti",              count: 18                 },
  { id: "in_attesa",          label: "In attesa",          count: 6, tint: "blue"    },
  { id: "consegna_prossima",  label: "Consegna prossima",  count: 4, tint: "amber"   },
  { id: "ricevuti",           label: "Ricevuti",           count: 7, tint: "green"   },
  { id: "ritardo",            label: "In ritardo",         count: 1, tint: "red"     },
];

const fmt = (n: number) => `€ ${n.toLocaleString("it-IT")}`;

const DATA: Ordine[] = [
  { id: "o1",  numero: "OF-2026-024", fornitore: "Aluplast Italia",       fornitoreLogo: "blue",   data: "21 apr 2026", consegnaPrevista: "5 mag 2026",  giorniRitardo: 0,  pezzi: 13, importo: 4890,  stato: "in_consegna", commesse: ["C-2026-051"],          categoria: "Profili PVC" },
  { id: "o2",  numero: "OF-2026-023", fornitore: "Aluplast Italia",       fornitoreLogo: "blue",   data: "20 apr 2026", consegnaPrevista: "2 mag 2026",  giorniRitardo: 0,  pezzi: 24, importo: 8240,  stato: "confermato",  commesse: ["C-2026-053"],          categoria: "Profili PVC" },
  { id: "o3",  numero: "OF-2026-022", fornitore: "Schuco Italia",         fornitoreLogo: "amber",  data: "18 apr 2026", consegnaPrevista: "30 apr 2026", giorniRitardo: 0,  pezzi: 6,  importo: 2150,  stato: "confermato",  commesse: ["C-2026-052"],          categoria: "Profili Alluminio" },
  { id: "o4",  numero: "OF-2026-021", fornitore: "Saint-Gobain Glass",    fornitoreLogo: "violet", data: "15 apr 2026", consegnaPrevista: "28 apr 2026", giorniRitardo: 0,  pezzi: 32, importo: 5680,  stato: "in_consegna", commesse: ["C-2026-049","C-2026-050"], categoria: "Vetri" },
  { id: "o5",  numero: "OF-2026-020", fornitore: "Maico Hardware",        fornitoreLogo: "green",  data: "12 apr 2026", consegnaPrevista: "22 apr 2026", giorniRitardo: 3,  pezzi: 48, importo: 1450,  stato: "in_consegna", commesse: ["C-2026-049","C-2026-050"], categoria: "Ferramenta" },
  { id: "o6",  numero: "OF-2026-019", fornitore: "Aluplast Italia",       fornitoreLogo: "blue",   data: "10 apr 2026", consegnaPrevista: "20 apr 2026", giorniRitardo: 0,  pezzi: 18, importo: 6320,  stato: "ricevuto",    commesse: ["C-2026-048"],          categoria: "Profili PVC" },
  { id: "o7",  numero: "OF-2026-018", fornitore: "Twin Systems",          fornitoreLogo: "teal",   data: "8 apr 2026",  consegnaPrevista: "18 apr 2026", giorniRitardo: 0,  pezzi: 8,  importo: 3450,  stato: "ricevuto",    commesse: ["C-2026-047"],          categoria: "Profili Alluminio" },
  { id: "o8",  numero: "OF-2026-017", fornitore: "Saint-Gobain Glass",    fornitoreLogo: "violet", data: "5 apr 2026",  consegnaPrevista: "16 apr 2026", giorniRitardo: 0,  pezzi: 24, importo: 4280,  stato: "ricevuto",    commesse: ["C-2026-046","C-2026-047"], categoria: "Vetri" },
];

const KPI_TOP: { label: string; value: string; tint: keyof typeof TINTS; icon: IconName }[] = [
  { label: "Ordini attivi",      value: "11",           tint: "blue",   icon: "ordini"      },
  { label: "Valore in attesa",   value: "€ 28.910", tint: "amber",  icon: "contabilita" },
  { label: "Consegne 7gg",       value: "5",            tint: "violet", icon: "calendario"  },
  { label: "In ritardo",         value: "1",            tint: "red",    icon: "bell"        },
];

export default function OrdiniFornitoriTablet() {
  const [filtro, setFiltro] = React.useState<Filtro>("tutti");
  const [search, setSearch] = React.useState("");

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Ordini fornitori
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            18 ordini totali questo mese &middot; 11 attivi &middot; € 28.910 in attesa
          </div>
        </div>
        <button
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            background: TT.orange[400],
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: "0 2px 8px rgba(251,146,60,0.30)",
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo ordine
        </button>
      </div>

      {/* KPI ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, marginBottom: 14 }}>
        {KPI_TOP.map((k) => {
          const ramp = TINTS[k.tint];
          return (
            <div key={k.label} style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
              <div style={{
                width: 38, height: 38,
                borderRadius: 10,
                background: ramp[400],
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={k.icon} size={18} color="#fff" strokeWidth={2.2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: ramp[500], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {k.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FILTRI + SEARCH */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {FILTRI.map((f) => {
            const ramp = f.tint ? TINTS[f.tint] : null;
            const isActive = f.id === filtro;
            return (
              <div
                key={f.id}
                onClick={() => setFiltro(f.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isActive ? (ramp ? ramp[400] : TT.text1) : TT.surface,
                  color: isActive ? "#fff" : TT.text2,
                  border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {f.label}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
                  color: isActive ? "#fff" : (ramp ? ramp[500] : TT.text3),
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {f.count}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative", width: 220 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={13} color={TT.text3} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca ordine, fornitore..."
            style={{
              width: "100%", height: 36,
              padding: "0 12px 0 34px",
              background: TT.surface,
              border: `1px solid ${TT.borderStrong}`,
              borderRadius: 10,
              fontSize: 12, fontFamily: TT.fontFamily,
              color: TT.text1, outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* TABELLA ORDINI */}
      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: TT.bgSoft }}>
              <Th>Ordine</Th>
              <Th>Fornitore</Th>
              <Th>Categoria</Th>
              <Th align="center">Pezzi</Th>
              <Th align="right">Importo</Th>
              <Th>Consegna</Th>
              <Th>Stato</Th>
              <Th width="40px" />
            </tr>
          </thead>
          <tbody>
            {DATA.map((o) => (
              <OrdineRow key={o.id} ordine={o} />
            ))}
          </tbody>
        </table>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "12px 16px",
          borderTop: `1px solid ${TT.border}`,
          background: TT.bgSoft,
          fontSize: 11,
          color: TT.text3,
        }}>
          <span>Mostro 8 di 18 ordini</span>
          <span style={{ fontWeight: 700, color: TT.text1 }}>
            Totale visualizzato: {fmt(DATA.reduce((s, o) => s + o.importo, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OrdineRow
// ============================================================

function OrdineRow({ ordine }: { ordine: Ordine }) {
  const stato = STATI[ordine.stato];
  const ramp = TINTS[stato.tint];
  const ritardo = ordine.giorniRitardo > 0;
  const fornitoreRamp = TINTS[ordine.fornitoreLogo as keyof typeof TINTS] || TINTS.slate;
  const [hover, setHover] = React.useState(false);

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? ramp[50] : "transparent",
        cursor: "pointer",
        borderTop: `1px solid ${TT.border}`,
        transition: "background 0.1s",
      }}
    >
      <Td>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>
            {ordine.numero}
          </div>
          <div style={{ fontSize: 10, color: TT.text3, marginTop: 2 }}>
            {ordine.data}
          </div>
        </div>
      </Td>
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: 7,
            background: fornitoreRamp[400],
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800,
            flexShrink: 0,
            letterSpacing: "-0.3px",
          }}>
            {ordine.fornitore.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: TT.text1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              letterSpacing: "-0.05px",
            }}>
              {ordine.fornitore}
            </div>
            <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
              {ordine.commesse.join(", ")}
            </div>
          </div>
        </div>
      </Td>
      <Td>
        <span style={{
          display: "inline-flex",
          padding: "2px 8px",
          background: TT.bgSoft,
          color: TT.text2,
          border: `1px solid ${TT.border}`,
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 600,
        }}>
          {ordine.categoria}
        </span>
      </Td>
      <Td align="center">
        <div style={{ color: TT.text2, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          {ordine.pezzi}
        </div>
      </Td>
      <Td align="right">
        <div style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
          {fmt(ordine.importo)}
        </div>
      </Td>
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11,
            color: ritardo ? TT.red[500] : TT.text2,
            fontWeight: ritardo ? 700 : 500,
          }}>
            {ordine.consegnaPrevista}
          </span>
          {ritardo && (
            <span style={{
              padding: "1px 5px",
              background: TT.red[100],
              color: TT.red[500],
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 800,
            }}>
              +{ordine.giorniRitardo}g
            </span>
          )}
        </div>
      </Td>
      <Td>
        <span style={{
          display: "inline-flex",
          padding: "2px 8px",
          background: ramp[100],
          color: ramp[500],
          borderRadius: 12,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
        }}>
          {stato.label}
        </span>
      </Td>
      <Td align="center">
        <Icon name="chevronRight" size={14} color={hover ? ramp[500] : TT.text3} strokeWidth={2} />
      </Td>
    </tr>
  );
}

function Th({ children, align, width }: { children?: React.ReactNode; align?: "left" | "center" | "right"; width?: string }) {
  return (
    <th style={{
      padding: "10px 14px",
      textAlign: align || "left",
      fontSize: 10,
      fontWeight: 700,
      color: TT.text3,
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      width,
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td style={{ padding: "10px 14px", textAlign: align || "left", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}
