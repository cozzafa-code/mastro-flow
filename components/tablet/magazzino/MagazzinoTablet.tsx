"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";

type Categoria = "tutte" | "profili" | "vetri" | "ferramenta" | "guarnizioni" | "accessori";
type StatoStock = "ok" | "basso" | "critico" | "esaurito";

interface Articolo {
  id: string;
  codice: string;
  nome: string;
  descrizione: string;
  categoria: Exclude<Categoria, "tutte">;
  scorta: number;
  scortaMin: number;
  unita: string;
  prezzoMedio: number;
  ubicazione: string;
}

const CAT_DEF: Record<Exclude<Categoria, "tutte">, { label: string; tint: keyof typeof TINTS }> = {
  profili:     { label: "Profili",      tint: "blue"   },
  vetri:       { label: "Vetri",        tint: "violet" },
  ferramenta:  { label: "Ferramenta",   tint: "amber"  },
  guarnizioni: { label: "Guarnizioni",  tint: "teal"   },
  accessori:   { label: "Accessori",    tint: "green"  },
};

const TINTS = {
  blue: TT.blue, violet: TT.violet, amber: TT.amber,
  teal: TT.teal, green: TT.green, red: TT.red, slate: TT.slate, orange: TT.orange,
} as const;

const FILTRI: { id: Categoria; label: string; count: number }[] = [
  { id: "tutte",       label: "Tutte",       count: 124 },
  { id: "profili",     label: "Profili",     count: 38  },
  { id: "vetri",       label: "Vetri",       count: 22  },
  { id: "ferramenta",  label: "Ferramenta",  count: 31  },
  { id: "guarnizioni", label: "Guarnizioni", count: 18  },
  { id: "accessori",   label: "Accessori",   count: 15  },
];

const fmt = (n: number) => `€ ${n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DATA: Articolo[] = [
  { id: "a1",  codice: "AL-7000-01",   nome: "Profilo telaio fisso",         descrizione: "Aluplast IDEAL 7000 - bianco",   categoria: "profili",    scorta: 142, scortaMin: 50, unita: "m",  prezzoMedio: 18.40, ubicazione: "A-12" },
  { id: "a2",  codice: "AL-7000-02",   nome: "Profilo anta",                 descrizione: "Aluplast IDEAL 7000 - bianco",   categoria: "profili",    scorta: 28,  scortaMin: 40, unita: "m",  prezzoMedio: 22.80, ubicazione: "A-13" },
  { id: "a3",  codice: "AL-7000-03",   nome: "Profilo montante centrale",    descrizione: "Aluplast IDEAL 7000",            categoria: "profili",    scorta: 0,   scortaMin: 20, unita: "m",  prezzoMedio: 19.20, ubicazione: "A-14" },
  { id: "a4",  codice: "VT-44.2-LE",   nome: "Vetrocamera 44.2 Low-E",        descrizione: "Saint-Gobain Climaplus",         categoria: "vetri",      scorta: 18,  scortaMin: 10, unita: "mq", prezzoMedio: 64.50, ubicazione: "B-03" },
  { id: "a5",  codice: "VT-33.1-AC",   nome: "Vetro acustico stratificato",  descrizione: "Saint-Gobain Stadip Silence",    categoria: "vetri",      scorta: 6,   scortaMin: 8,  unita: "mq", prezzoMedio: 89.90, ubicazione: "B-04" },
  { id: "a6",  codice: "MA-DK-WH",     nome: "Maniglia DK bianca",           descrizione: "Maico Mover - bianco RAL 9016",  categoria: "ferramenta", scorta: 86,  scortaMin: 30, unita: "pz", prezzoMedio: 12.80, ubicazione: "C-08" },
  { id: "a7",  codice: "MA-DK-AN",     nome: "Maniglia DK antracite",        descrizione: "Maico Mover - antracite",         categoria: "ferramenta", scorta: 4,   scortaMin: 25, unita: "pz", prezzoMedio: 14.20, ubicazione: "C-09" },
  { id: "a8",  codice: "FR-SCISS-2",   nome: "Forbice 2 ante DKL",            descrizione: "Maico Multi - 600-800",          categoria: "ferramenta", scorta: 45,  scortaMin: 20, unita: "pz", prezzoMedio: 28.50, ubicazione: "C-10" },
  { id: "a9",  codice: "GU-EPDM-12",   nome: "Guarnizione EPDM nera",         descrizione: "Sezione 12mm - bobina 100m",     categoria: "guarnizioni",scorta: 8,   scortaMin: 5,  unita: "rotolo", prezzoMedio: 42.00, ubicazione: "D-02" },
  { id: "a10", codice: "AC-CUS-WH",    nome: "Cuscinetto distanziatore",     descrizione: "PVC bianco - 4x6mm",             categoria: "accessori",  scorta: 320, scortaMin: 100,unita: "pz", prezzoMedio: 0.18,  ubicazione: "E-01" },
];

interface Movimento {
  id: string;
  tipo: "carico" | "scarico";
  articolo: string;
  qta: number;
  unita: string;
  data: string;
  riferimento: string;
}

const MOVIMENTI: Movimento[] = [
  { id: "mv1", tipo: "scarico", articolo: "Profilo anta IDEAL 7000",   qta: 24,  unita: "m",  data: "Oggi 11:30",     riferimento: "C-2026-051" },
  { id: "mv2", tipo: "carico",  articolo: "Maniglia DK bianca",         qta: 50,  unita: "pz", data: "Oggi 09:15",     riferimento: "OF-2026-024" },
  { id: "mv3", tipo: "scarico", articolo: "Vetrocamera 44.2 Low-E",     qta: 4.8, unita: "mq", data: "Ieri 16:42",     riferimento: "C-2026-050" },
  { id: "mv4", tipo: "scarico", articolo: "Forbice 2 ante DKL",         qta: 8,   unita: "pz", data: "Ieri 14:20",     riferimento: "C-2026-049" },
  { id: "mv5", tipo: "carico",  articolo: "Profilo telaio IDEAL 7000",  qta: 80,  unita: "m",  data: "23 apr 10:00",   riferimento: "OF-2026-023" },
];

const KPI_TOP: { label: string; value: string; tint: keyof typeof TINTS; icon: IconName }[] = [
  { label: "Articoli totali",  value: "124",          tint: "amber",  icon: "magazzino"   },
  { label: "Valore stock",     value: "€ 48.230", tint: "green",  icon: "contabilita" },
  { label: "Sotto soglia",     value: "8",            tint: "amber",  icon: "bell"        },
  { label: "Esauriti",         value: "2",            tint: "red",    icon: "x"           },
];

export default function MagazzinoTablet() {
  const [filtro, setFiltro] = React.useState<Categoria>("tutte");
  const [search, setSearch] = React.useState("");

  const filtered = filtro === "tutte" ? DATA : DATA.filter((a) => a.categoria === filtro);

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Magazzino
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            124 articoli &middot; valore € 48.230 &middot; 8 sotto soglia &middot; 2 esauriti
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btnSecondario}>
            <Icon name="documento" size={13} color={TT.text2} strokeWidth={2.2} />
            Inventario
          </button>
          <button style={btnPrimario(TT.amber[400], TT.amber[300])}>
            <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
            Aggiungi articolo
          </button>
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        {KPI_TOP.map((k) => {
          const ramp = TINTS[k.tint];
          return (
            <div key={k.label} style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
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

      {/* LAYOUT 2 COLONNE */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, alignItems: "flex-start" }}>
        {/* SX - filtri + lista */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
              {FILTRI.map((f) => {
                const ramp = f.id !== "tutte" ? TINTS[CAT_DEF[f.id as Exclude<Categoria,"tutte">].tint] : null;
                const isActive = f.id === filtro;
                return (
                  <div
                    key={f.id}
                    onClick={() => setFiltro(f.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 11px",
                      background: isActive ? (ramp ? ramp[400] : TT.text1) : TT.surface,
                      color: isActive ? "#fff" : TT.text2,
                      border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {f.label}
                    <span style={{
                      background: isActive ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
                      color: isActive ? "#fff" : (ramp ? ramp[500] : TT.text3),
                      fontSize: 9, fontWeight: 700,
                      padding: "1px 6px", borderRadius: 999,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {f.count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ position: "relative", width: 200 }}>
              <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
                <Icon name="search" size={13} color={TT.text3} strokeWidth={2} />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca codice, nome..."
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

          {/* Tabella articoli */}
          <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
              <thead>
                <tr style={{ background: TT.bgSoft }}>
                  <Th>Articolo</Th>
                  <Th>Categoria</Th>
                  <Th align="center">Ubicaz.</Th>
                  <Th align="right">Scorta</Th>
                  <Th align="right">Stato</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <ArticoloRow key={a.id} articolo={a} />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DX - movimenti */}
        <SidebarMovimenti />
      </div>
    </div>
  );
}

// ============================================================
// ArticoloRow
// ============================================================

function ArticoloRow({ articolo }: { articolo: Articolo }) {
  const cat = CAT_DEF[articolo.categoria];
  const catRamp = TINTS[cat.tint];

  // Calcolo stato stock
  const stato: StatoStock =
    articolo.scorta === 0 ? "esaurito" :
    articolo.scorta < articolo.scortaMin * 0.5 ? "critico" :
    articolo.scorta < articolo.scortaMin ? "basso" :
    "ok";

  const statoMeta = {
    ok:       { label: "OK",       tint: TT.green },
    basso:    { label: "Basso",    tint: TT.amber },
    critico:  { label: "Critico",  tint: TT.red   },
    esaurito: { label: "Esaurito", tint: TT.red   },
  };
  const sm = statoMeta[stato];
  const pct = Math.min(100, (articolo.scorta / Math.max(1, articolo.scortaMin)) * 100);
  const [hover, setHover] = React.useState(false);

  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? sm.tint[50] : "transparent",
        cursor: "pointer",
        borderTop: `1px solid ${TT.border}`,
      }}
    >
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            borderRadius: 7,
            background: catRamp[100],
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            color: catRamp[500],
            fontSize: 9, fontWeight: 800,
            letterSpacing: "0.3px",
            fontFamily: "monospace",
          }}>
            {articolo.categoria.substring(0, 3).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: TT.text3, fontWeight: 600, marginBottom: 1 }}>
              {articolo.codice}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 700, color: TT.text1,
              letterSpacing: "-0.1px",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 280,
            }}>
              {articolo.nome}
            </div>
            <div style={{
              fontSize: 10, color: TT.text3, marginTop: 1,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: 280,
            }}>
              {articolo.descrizione}
            </div>
          </div>
        </div>
      </Td>
      <Td>
        <span style={{
          padding: "2px 8px",
          background: catRamp[100],
          color: catRamp[500],
          borderRadius: 12,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.2px",
          textTransform: "uppercase",
        }}>
          {cat.label}
        </span>
      </Td>
      <Td align="center">
        <span style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: TT.text2,
          fontWeight: 600,
          padding: "2px 6px",
          background: TT.bgSoft,
          borderRadius: 4,
        }}>
          {articolo.ubicazione}
        </span>
      </Td>
      <Td align="right">
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: sm.tint[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px", lineHeight: 1 }}>
            {articolo.scorta.toLocaleString("it-IT")} <span style={{ fontSize: 10, color: TT.text3, fontWeight: 600 }}>{articolo.unita}</span>
          </div>
          <div style={{ fontSize: 9, color: TT.text3, marginTop: 2 }}>
            min: {articolo.scortaMin} {articolo.unita}
          </div>
        </div>
      </Td>
      <Td align="right">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{
            padding: "2px 8px",
            background: sm.tint[100],
            color: sm.tint[500],
            borderRadius: 999,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}>
            {sm.label}
          </span>
          <div style={{ width: 80, height: 3, background: TT.bgSoft, borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${pct}%`,
              background: sm.tint[400],
              borderRadius: 2,
            }} />
          </div>
        </div>
      </Td>
    </tr>
  );
}

// ============================================================
// SidebarMovimenti
// ============================================================

function SidebarMovimenti() {
  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
          Movimenti recenti
        </div>
        <div style={{ fontSize: 10, color: TT.amber[500], fontWeight: 700, cursor: "pointer" }}>
          Tutti &rsaquo;
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {MOVIMENTI.map((m) => {
          const isCarico = m.tipo === "carico";
          const ramp = isCarico ? TT.green : TT.amber;
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                gap: 9,
                padding: "8px 10px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderRadius: 8,
              }}
            >
              <div style={{
                width: 26, height: 26,
                borderRadius: 7,
                background: ramp[400],
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon
                  name={isCarico ? "plus" : "chevronRight"}
                  size={12}
                  color="#fff"
                  strokeWidth={2.6}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    color: ramp[500],
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {isCarico ? "Carico" : "Scarico"}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>
                    {isCarico ? "+" : "−"}{m.qta} {m.unita}
                  </span>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: TT.text1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  letterSpacing: "-0.05px",
                }}>
                  {m.articolo}
                </div>
                <div style={{ fontSize: 10, color: TT.text3, marginTop: 2 }}>
                  {m.data} &middot; <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{m.riferimento}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Helpers
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

function Th({ children, align }: { children?: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <th style={{
      padding: "10px 12px",
      textAlign: align || "left",
      fontSize: 10,
      fontWeight: 700,
      color: TT.text3,
      letterSpacing: "0.6px",
      textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left" | "center" | "right" }) {
  return (
    <td style={{ padding: "10px 12px", textAlign: align || "left", verticalAlign: "middle" }}>
      {children}
    </td>
  );
}
