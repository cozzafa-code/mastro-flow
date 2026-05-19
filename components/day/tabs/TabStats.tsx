"use client";

import { useMemo } from "react";
import { useStats, type StatsPeriodo, type Ripartizione } from "@/hooks/useStats";

const PERIODI: { v: StatsPeriodo; lbl: string }[] = [
  { v: "oggi",      lbl: "Oggi" },
  { v: "settimana", lbl: "Settimana" },
  { v: "mese",      lbl: "Mese" },
  { v: "trimestre", lbl: "3 mesi" },
];

const CATEGORIA_COLORE: Record<string, string> = {
  mastro:  "#28A0A0",
  vita:    "#1D9E75",
  lidia:   "#EF9F27",
  risolto: "#7F77DD",
  deep:    "#1E8080",
  pausa:   "#5DCAA5",
};

function fmtH(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h${m}m`;
}

export function TabStats() {
  const { loading, periodo, setPeriodo, kpi, fasce, ripartizione, topCommesse, pattern } = useStats();

  return (
    <div style={{
      flex: 1, overflowY: "auto",
      display: "flex", flexDirection: "column",
      background: "#F4F6F5",
    }}>
      {/* HEADER VERDE */}
      <div style={{
        position: "relative",
        padding: "16px 18px 14px",
        color: "#fff",
        background: "linear-gradient(135deg, #6BD9B0 0%, #1D9E75 50%, #0F8060 100%)",
        boxShadow: "0 4px 14px rgba(29,158,117,0.25)",
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 65%)",
          pointerEvents: "none",
        }}/>

        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", opacity: 0.9 }}>
            Stats & pattern
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, marginTop: 2, textShadow: "0 2px 5px rgba(0,0,0,0.18)" }}>
            La tua produttivita
          </div>
        </div>

        {/* S1-S4 · Selettore periodo */}
        <div style={{
          position: "relative", marginTop: 14,
          display: "inline-flex", padding: 3, borderRadius: 10,
          background: "rgba(0,0,0,0.18)",
        }}>
          {PERIODI.map((p) => {
            const active = periodo === p.v;
            return (
              <button key={p.v} type="button" onClick={() => setPeriodo(p.v)}
                style={{
                  padding: "5px 12px", borderRadius: 7, border: 0, cursor: "pointer",
                  background: active ? "#fff" : "transparent",
                  color: active ? "#04342C" : "#fff",
                  fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3,
                  boxShadow: active ? "0 2px 6px rgba(0,0,0,0.18)" : undefined,
                  fontFamily: "inherit",
                }}>{p.lbl}</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "12px 16px 24px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* S5-S8 · 4 KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <KPICard
            label="Ore Deep"
            value={kpi ? fmtH(kpi.ore_deep * 60) : "0h"}
            delta={kpi?.ore_deep_delta ?? 0}
            tone="verde"
            ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>}
          />
          <KPICard
            label="Task chiusi"
            value={String(kpi?.task_chiusi ?? 0)}
            delta={kpi?.task_chiusi_delta ?? 0}
            tone="teal"
            ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>}
          />
          <KPICard
            label="CM toccate"
            value={String(kpi?.cm_toccate ?? 0)}
            tone="viola"
            ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V8l7-5 7 5v13"/></svg>}
          />
          <KPICard
            label="Energia tot"
            value={fmtH(kpi?.energia_totale_min ?? 0)}
            tone="ambra"
            ico={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>}
          />
        </div>

        {/* S9-S11 · Bar chart fascia oraria */}
        <Section title="Energia per fascia oraria">
          <BarChartFasce fasce={fasce} />
          <BestFascia fasce={fasce} />
        </Section>

        {/* S12-S13 · Pie ripartizione */}
        {ripartizione.length > 0 && (
          <Section title="Ripartizione tempo">
            <PieChartCategorie data={ripartizione} />
            <Legenda data={ripartizione} />
          </Section>
        )}

        {/* S14-S16 · Top commesse */}
        {topCommesse.length > 0 && (
          <Section title="Top commesse del periodo">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topCommesse.map((c, i) => (
                <CommessaRow key={c.cm_id} idx={i + 1} c={c} />
              ))}
            </div>
          </Section>
        )}

        {/* S17-S21 · Pattern */}
        {pattern.length > 0 && (
          <Section title="Pattern automatici">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pattern.map((p, i) => <PatternCard key={i} p={p} />)}
            </div>
          </Section>
        )}

        {/* Empty pattern · 3 mesi minimi */}
        {pattern.length === 0 && !loading && (
          <div style={{
            padding: 18, borderRadius: 13,
            background: "rgba(29,158,117,0.08)",
            border: "1px dashed rgba(29,158,117,0.3)",
            fontSize: 11, fontWeight: 700, color: "#04342C", textAlign: "center", lineHeight: 1.5,
          }}>
            I pattern automatici ("lavori meglio 9-11") arrivano dopo<br/>
            qualche giorno di utilizzo · servono dati per imparare
          </div>
        )}

        {loading && (
          <div style={{
            padding: 24, textAlign: "center", borderRadius: 14,
            fontSize: 12, fontWeight: 700, color: "#5A7878",
          }}>Caricamento stats...</div>
        )}
      </div>
    </div>
  );
}


// ============== KPICard ==============
function KPICard({ label, value, delta = 0, tone, ico }: {
  label: string; value: string; delta?: number;
  tone: "verde" | "teal" | "viola" | "ambra";
  ico: JSX.Element;
}) {
  const TONE: Record<string, { bg: string; fg: string; iconBg: string }> = {
    verde:  { bg: "linear-gradient(145deg, rgba(93,202,165,0.15), rgba(29,158,117,0.05))", fg: "#1D9E75", iconBg: "linear-gradient(145deg, #6BD9B0, #1D9E75)" },
    teal:   { bg: "linear-gradient(145deg, rgba(58,189,189,0.15), rgba(40,160,160,0.05))",  fg: "#1E8080", iconBg: "linear-gradient(145deg, #3ABDBD, #1E8080)" },
    viola:  { bg: "linear-gradient(145deg, rgba(175,169,236,0.15), rgba(127,119,221,0.05))", fg: "#7F77DD", iconBg: "linear-gradient(145deg, #B5B0EE, #7F77DD)" },
    ambra:  { bg: "linear-gradient(145deg, rgba(250,199,117,0.15), rgba(239,159,39,0.05))", fg: "#EF9F27", iconBg: "linear-gradient(145deg, #FAC775, #EF9F27)" },
  };
  const t = TONE[tone];
  const showDelta = delta !== 0;
  const positive = delta > 0;

  return (
    <div style={{
      padding: "12px 14px",
      background: "#fff", borderRadius: 14,
      boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 9,
          background: t.iconBg, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 3px 8px ${t.fg}55`,
        }}>{ico}</div>
        {showDelta && (
          <span style={{
            padding: "2px 6px", borderRadius: 5,
            background: positive ? "rgba(29,158,117,0.14)" : "rgba(220,68,68,0.14)",
            color: positive ? "#04342C" : "#7F1D1D",
            fontSize: 9.5, fontWeight: 900, letterSpacing: 0.3,
          }}>{positive ? "+" : ""}{delta}</span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#0F2525", letterSpacing: -0.6, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 3, fontSize: 9.5, fontWeight: 800, color: "#5A7878", letterSpacing: 0.4, textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}


// ============== Section ==============
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      padding: "12px 14px",
      background: "#fff", borderRadius: 14,
      boxShadow: "0 2px 6px rgba(13,31,31,0.05)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}


// ============== BarChartFasce ==============
function BarChartFasce({ fasce }: { fasce: { ora: number; minuti_deep: number }[] }) {
  const max = useMemo(() => Math.max(...fasce.map((f) => f.minuti_deep), 1), [fasce]);
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", gap: 2,
      height: 90, padding: "4px 0",
    }}>
      {fasce.map((f) => {
        const h = max > 0 ? (f.minuti_deep / max) * 100 : 0;
        const intense = f.minuti_deep === max && max > 0;
        return (
          <div key={f.ora} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{
              width: "100%",
              height: `${Math.max(h, 2)}%`,
              borderRadius: 3,
              background: intense
                ? "linear-gradient(180deg, #1D9E75, #0F8060)"
                : f.minuti_deep > 0 ? "rgba(29,158,117,0.7)" : "rgba(200,228,228,0.6)",
              minHeight: 2,
            }} />
            <span style={{ fontSize: 7.5, fontWeight: 700, color: intense ? "#0F8060" : "#8FA8A8", letterSpacing: 0.2 }}>
              {f.ora}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BestFascia({ fasce }: { fasce: { ora: number; minuti_deep: number }[] }) {
  const best = useMemo(() => {
    let max = 0; let bestOra = -1;
    fasce.forEach((f) => { if (f.minuti_deep > max) { max = f.minuti_deep; bestOra = f.ora; } });
    return max > 30 ? { ora: bestOra, min: max } : null;
  }, [fasce]);
  if (!best) return null;
  return (
    <div style={{
      marginTop: 8, padding: "6px 9px", borderRadius: 8,
      background: "rgba(29,158,117,0.10)",
      fontSize: 11, fontWeight: 800, color: "#04342C",
      letterSpacing: -0.05,
      display: "flex", alignItems: "center", gap: 7,
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.4"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>
      Rendi meglio dalle {best.ora}-{best.ora + 1} · {fmtH(best.min)} di deep
    </div>
  );
}


// ============== PieChartCategorie ==============
function PieChartCategorie({ data }: { data: Ripartizione[] }) {
  const total = data.reduce((s, x) => s + x.minuti, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const slices = data.map((d) => {
    const start = (cumulative / total) * 360;
    cumulative += d.minuti;
    const end = (cumulative / total) * 360;
    return { ...d, start, end, color: CATEGORIA_COLORE[d.categoria] ?? "#5A7878" };
  });

  const conicGrad = slices.map((s) =>
    `${s.color} ${s.start}deg ${s.end}deg`
  ).join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
      <div style={{
        position: "relative",
        width: 130, height: 130,
        borderRadius: "50%",
        background: `conic-gradient(${conicGrad})`,
        boxShadow: "0 4px 14px rgba(13,31,31,0.08)",
      }}>
        <div style={{
          position: "absolute", inset: 22,
          borderRadius: "50%",
          background: "#fff",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 0 1px 4px rgba(13,31,31,0.1)",
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0F2525", letterSpacing: -0.5 }}>
            {fmtH(total)}
          </div>
          <div style={{ fontSize: 8, fontWeight: 800, color: "#5A7878", letterSpacing: 0.5, textTransform: "uppercase" }}>
            totale
          </div>
        </div>
      </div>
    </div>
  );
}

function Legenda({ data }: { data: Ripartizione[] }) {
  const total = data.reduce((s, x) => s + x.minuti, 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 6 }}>
      {data.map((d) => {
        const col = CATEGORIA_COLORE[d.categoria] ?? "#5A7878";
        const pct = total > 0 ? Math.round((d.minuti / total) * 100) : 0;
        return (
          <div key={d.categoria} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: col, flexShrink: 0 }}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 900, color: "#0F2525", letterSpacing: -0.05, textTransform: "uppercase" }}>
                {d.categoria}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#5A7878" }}>
                {fmtH(d.minuti)} · {pct}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ============== CommessaRow ==============
function CommessaRow({ idx, c }: { idx: number; c: { cm_id: string; code: string | null; cliente: string | null; cognome: string | null; minuti: number; eventi: number } }) {
  const lbl = `${c.code ?? ""} · ${(c.cliente ?? "").trim()} ${(c.cognome ?? "").trim()}`.trim();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 10,
      background: "rgba(244,246,245,0.6)",
      border: "1px solid rgba(200,228,228,0.5)",
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: 7,
        background: idx <= 3
          ? "linear-gradient(145deg, #FAC775, #EF9F27)"
          : "rgba(200,228,228,0.6)",
        color: idx <= 3 ? "#fff" : "#5A7878",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 900,
        boxShadow: idx <= 3 ? "0 2px 6px rgba(239,159,39,0.4)" : undefined,
        flexShrink: 0,
      }}>{idx}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#0F2525", letterSpacing: -0.1,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {lbl}
        </div>
        <div style={{ fontSize: 9.5, fontWeight: 700, color: "#5A7878", marginTop: 1 }}>
          {c.eventi} {c.eventi === 1 ? "evento" : "eventi"}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, color: "#1E8080", letterSpacing: -0.1, flexShrink: 0 }}>
        {fmtH(c.minuti)}
      </div>
    </div>
  );
}


// ============== PatternCard ==============
function PatternCard({ p }: { p: { tipo: string; titolo: string; sottotitolo: string; icona: string } }) {
  const ico = p.icona === "clock"
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;

  return (
    <div style={{
      padding: "11px 13px", borderRadius: 12,
      background: "linear-gradient(135deg, rgba(93,202,165,0.18), rgba(29,158,117,0.08))",
      border: "1px solid rgba(29,158,117,0.25)",
      borderLeft: "3px solid #1D9E75",
      display: "flex", alignItems: "flex-start", gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "linear-gradient(145deg, #6BD9B0, #1D9E75)",
        color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 3px 8px rgba(29,158,117,0.4)",
        flexShrink: 0,
      }}>{ico}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#04342C", letterSpacing: -0.1 }}>
          {p.titolo}
        </div>
        <div style={{ marginTop: 2, fontSize: 10, fontWeight: 700, color: "#0F8060", letterSpacing: 0.1 }}>
          {p.sottotitolo}
        </div>
      </div>
    </div>
  );
}
