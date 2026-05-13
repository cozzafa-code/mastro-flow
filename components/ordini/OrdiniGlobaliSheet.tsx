"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { OrdineConCommessa, OrdineStato } from "./ordini-types";
import { STATO_LABEL } from "./ordini-types";
import { computeKpi, fetchOrdiniByAzienda, filtraOrdini, gruppoOrdineBy } from "./ordini-helpers";

const C = {
  navy: "#1A2A47",
  navy2: "#243558",
  navyDim: "#5A6478",
  navyFaint: "#8B95A8",
  white: "#FFFFFF",
  whiteOff: "#F5F7FA",
  border: "rgba(26, 42, 71, 0.10)",
  borderStrong: "rgba(26, 42, 71, 0.18)",
  amber: "#E8B05C",
  amberDark: "#8C5E1A",
  amberSoft: "#FBF0DC",
  green: "#1F5A3F",
  greenBright: "#2B7A52",
  greenSoft: "#D8EBDF",
  red: "#C44545",
  redSoft: "#F5DADA",
};

type Filtro = "tutti" | "urgenti" | "bloccanti" | "aperti";
type Raggruppa = "stato" | "fornitore" | "commessa" | "data";

interface Props {
  aziendaId: string;
  onClose: () => void;
  onApriOrdine: (ordineId: string) => void;
  onNuovoOrdine: () => void;
}

export default function OrdiniGlobaliSheet({ aziendaId, onClose, onApriOrdine, onNuovoOrdine }: Props) {
  const [ordini, setOrdini] = useState<OrdineConCommessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const [query, setQuery] = useState("");
  const [collapsedArrivati, setCollapsedArrivati] = useState(true);
  const [raggruppa, setRaggruppa] = useState<Raggruppa>("stato");

  useEffect(() => {
    let mounted = true;
    fetchOrdiniByAzienda(aziendaId).then(d => {
      if (mounted) {
        setOrdini(d);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, [aziendaId]);

  const filtered = useMemo(() => filtraOrdini(ordini, filtro, query), [ordini, filtro, query]);
  const kpi = useMemo(() => computeKpi(ordini), [ordini]);
  const gruppi = useMemo(() => gruppoOrdineBy(filtered), [filtered]);
  const totaleGestire = kpi.da_ordinare + kpi.in_arrivo;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26, 42, 71, 0.55)", zIndex: 40, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100vh", background: C.white, display: "flex", flexDirection: "column" }}>
        <Header
          totale={ordini.length}
          gestire={totaleGestire}
          kpi={kpi}
          onClose={onClose}
          onAdd={onNuovoOrdine}
        />
        <FiltersBar filtro={filtro} setFiltro={setFiltro} query={query} setQuery={setQuery} kpi={kpi} totale={ordini.length} raggruppa={raggruppa} setRaggruppa={setRaggruppa} />
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 90 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: C.navyFaint, fontSize: 13, fontWeight: 700 }}>Caricamento...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.navyFaint, fontSize: 13, fontWeight: 700 }}>Nessun ordine trovato</div>
          ) : (
            <>
              <GroupedList ordini={filtered} raggruppa={raggruppa} collapsedArrivati={collapsedArrivati} onToggleArrivati={() => setCollapsedArrivati(v => !v)} onApri={onApriOrdine} gruppi={gruppi} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ totale, gestire, kpi, onClose, onAdd }: any) {
  return (
    <div style={{ background: "linear-gradient(135deg, " + C.navy2 + " 0%, " + C.navy + " 100%)", color: C.white, padding: "12px 14px 14px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button onClick={onClose} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 10, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Ordini fornitori</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>{totale} totali · {gestire} da gestire</div>
        </div>
        <button onClick={onAdd} style={{ width: 36, height: 36, background: C.amber, color: C.navy, border: "none", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 8px rgba(232, 176, 92, 0.4)" }}>+</button>
      </div>
      <KpiGrid kpi={kpi} />
    </div>
  );
}

function KpiGrid({ kpi }: any) {
  const cells = [
    { n: kpi.da_ordinare, l: "Da ordinare", tone: "red" },
    { n: kpi.in_arrivo, l: "In arrivo", tone: "amber" },
    { n: kpi.arrivati, l: "Arrivati", tone: "green" },
    { n: "€" + Math.round(kpi.totale_aperti_euro / 100) / 10 + "k", l: "Aperti", tone: "neutral" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
      {cells.map((c, i) => {
        const bg = c.tone === "red" ? "rgba(196,69,69,0.20)" : c.tone === "amber" ? "rgba(232,176,92,0.15)" : c.tone === "green" ? "rgba(43,122,82,0.20)" : "rgba(255,255,255,0.08)";
        const bd = c.tone === "red" ? "rgba(196,69,69,0.40)" : c.tone === "amber" ? "rgba(232,176,92,0.35)" : c.tone === "green" ? "rgba(43,122,82,0.40)" : "rgba(255,255,255,0.15)";
        const col = c.tone === "red" ? "#FFB8B8" : c.tone === "amber" ? "#FFD9A0" : c.tone === "green" ? "#B5DCC5" : C.white;
        return (
          <div key={i} style={{ background: bg, border: "1px solid " + bd, borderRadius: 10, padding: "7px 5px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: col, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{c.n}</div>
            <div style={{ fontSize: 8, fontWeight: 800, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.4, color: "rgba(255,255,255,0.75)" }}>{c.l}</div>
          </div>
        );
      })}
    </div>
  );
}

function FiltersBar({ filtro, setFiltro, query, setQuery, kpi, totale, raggruppa, setRaggruppa }: any) {
  const segs: { id: string; label: string }[] = [
    { id: "stato", label: "Stato" },
    { id: "fornitore", label: "Fornitore" },
    { id: "commessa", label: "Commessa" },
    { id: "data", label: "Data" },
  ];
  const chips: { id: Filtro; label: string; count: number; tone?: string }[] = [
    { id: "tutti", label: "Tutti", count: totale },
    { id: "urgenti", label: "Urgenti", count: 0, tone: "red" },
    { id: "bloccanti", label: "Bloccanti", count: kpi.da_ordinare, tone: "red" },
    { id: "aperti", label: "Aperti", count: totale - kpi.arrivati },
  ];
  return (
    <div style={{ padding: "10px 14px", borderBottom: "1px solid " + C.border, background: C.white }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "rgba(26, 42, 71, 0.05)", borderRadius: 9, padding: 3, marginBottom: 8 }}>
        {segs.map(s => {
          const active = raggruppa === s.id;
          return (
            <button key={s.id} onClick={() => setRaggruppa(s.id)} style={{ padding: "7px 4px", borderRadius: 7, background: active ? C.white : "transparent", color: active ? C.navy : C.navyDim, fontSize: 11, fontWeight: active ? 800 : 700, textAlign: "center", cursor: "pointer", border: "none", boxShadow: active ? "0 1px 3px rgba(26, 42, 71, 0.10)" : "none" }}>{s.label}</button>
          );
        })}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cerca numero, fornitore, commessa..."
        style={{ width: "100%", padding: "8px 12px", background: C.whiteOff, border: "1.5px solid " + C.borderStrong, borderRadius: 9, fontSize: 12, color: C.navy, fontFamily: "inherit", outline: "none", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none" as any }}>
        {chips.map(c => {
          const active = filtro === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFiltro(c.id)}
              style={{
                padding: "5px 10px",
                borderRadius: 7,
                background: active ? C.navy : C.white,
                color: active ? C.white : C.navyDim,
                border: "1.5px solid " + (active ? C.navy : C.borderStrong),
                fontSize: 11,
                fontWeight: 800,
                whiteSpace: "nowrap",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {c.label} <span style={{ background: active ? "rgba(255,255,255,0.20)" : "rgba(26,42,71,0.10)", padding: "0 5px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{c.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({ icon, tone, label, count, collapsed, onToggle, children }: any) {
  const tones: any = {
    red: { bg: C.redSoft, fg: C.red },
    amber: { bg: C.amberSoft, fg: C.amberDark },
    green: { bg: C.greenSoft, fg: C.green },
    navy: { bg: "rgba(26,42,71,0.10)", fg: C.navy },
  };
  const t = tones[tone] || tones.navy;
  return (
    <div style={{ padding: "0 10px", marginBottom: 8 }}>
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 6px", cursor: onToggle ? "pointer" : "default" }}>
        <div style={{ width: 22, height: 22, borderRadius: 7, background: t.bg, color: t.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} />
        </div>
        <div style={{ flex: 1, fontSize: 11, fontWeight: 800, color: C.navy, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
        <div style={{ background: C.white, border: "1px solid " + C.borderStrong, borderRadius: 6, padding: "1px 7px", fontSize: 10, fontWeight: 800, color: C.navy }}>{count}</div>
        {onToggle !== undefined && (
          <div style={{ width: 22, height: 22, color: C.navyDim, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Icon({ name }: { name: string }) {
  if (name === "alert") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  if (name === "clock") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  if (name === "check") return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>;
}

function OrdineCard({ ordine, onClick }: { ordine: OrdineConCommessa; onClick: () => void }) {
  const isBloccante = ordine.bloccante || ordine.stato === "errore";
  const isUrgente = ordine.urgente;
  const isParziale = ordine.stato === "arrivato_parziale";
  const borderLeft = isBloccante ? "3px solid " + C.red : isUrgente ? "3px solid " + C.amber : isParziale ? "3px solid " + C.amber : "1px solid " + C.border;
  const statoStyles: any = {
    errore: { bg: C.redSoft, fg: C.red, bd: C.red },
    da_ordinare: { bg: C.white, fg: C.red, bd: C.red },
    inviato: { bg: C.amberSoft, fg: C.amberDark, bd: C.amber },
    in_transito: { bg: C.amberSoft, fg: C.amberDark, bd: C.amber },
    confermato: { bg: "rgba(26,42,71,0.08)", fg: C.navy, bd: C.navy },
    arrivato: { bg: C.greenSoft, fg: C.green, bd: C.greenBright },
    arrivato_parziale: { bg: C.amber, fg: C.navy, bd: C.amber },
    verificato: { bg: C.greenSoft, fg: C.green, bd: C.greenBright },
  };
  const sty = statoStyles[ordine.stato] || statoStyles.inviato;
  return (
    <div onClick={onClick} style={{
      background: C.white,
      borderLeft,
      borderTop: "1px solid " + C.border,
      borderRight: "1px solid " + C.border,
      borderBottom: "1px solid " + C.border,
      borderRadius: 12,
      padding: "10px 12px",
      marginBottom: 5,
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(26, 42, 71, 0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ background: C.whiteOff, padding: "2px 6px", borderRadius: 5, fontSize: 9, fontWeight: 800, color: C.navyDim, letterSpacing: 0.3, fontFamily: "monospace" }}>{ordine.numero || "—"}</span>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 800, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ordine.fornitore}</div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums" }}>€{Math.round(Number(ordine.totale_euro || 0))}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {ordine.commessa_code ? (
          <span style={{ background: C.amberSoft, color: C.amberDark, padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{ordine.commessa_code}</span>
        ) : (
          <span style={{ background: "rgba(26,42,71,0.08)", color: C.navy, padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>SCORTA</span>
        )}
        {ordine.commessa_cliente && (
          <span style={{ fontSize: 10, color: C.navyDim, fontWeight: 700 }}>{ordine.commessa_cliente} {ordine.commessa_cognome || ""}</span>
        )}
        <span style={{ background: sty.bg, color: sty.fg, border: "1.5px solid " + sty.bd, padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3 }}>
          {STATO_LABEL[ordine.stato as OrdineStato] || ordine.stato}
        </span>
        {isBloccante && <span style={{ background: C.red, color: C.white, padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 800, letterSpacing: 0.4 }}>BLOCCA</span>}
        {isUrgente && !isBloccante && <span style={{ background: C.amber, color: C.navy, padding: "1px 5px", borderRadius: 3, fontSize: 8, fontWeight: 800, letterSpacing: 0.4 }}>URGENTE</span>}
      </div>
    </div>
  );
}

function GroupedList({ ordini, raggruppa, collapsedArrivati, onToggleArrivati, onApri, gruppi }: any) {
  if (raggruppa === "stato") {
    return (
      <>
        {gruppi.bloccanti.length > 0 && (
          <Section icon="alert" tone="red" label="Bloccanti" count={gruppi.bloccanti.length}>
            {gruppi.bloccanti.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
          </Section>
        )}
        {gruppi.inAttesa.length > 0 && (
          <Section icon="clock" tone="amber" label="In attesa" count={gruppi.inAttesa.length}>
            {gruppi.inAttesa.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
          </Section>
        )}
        {gruppi.altri.length > 0 && (
          <Section icon="dot" tone="navy" label="Altri" count={gruppi.altri.length}>
            {gruppi.altri.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
          </Section>
        )}
        {gruppi.arrivati.length > 0 && (
          <Section icon="check" tone="green" label="Arrivati" count={gruppi.arrivati.length} collapsed={collapsedArrivati} onToggle={onToggleArrivati}>
            {!collapsedArrivati && gruppi.arrivati.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
          </Section>
        )}
      </>
    );
  }
  if (raggruppa === "fornitore") {
    const byForn: Record<string, any[]> = {};
    for (const o of ordini) {
      const k = o.fornitore || "—";
      if (!byForn[k]) byForn[k] = [];
      byForn[k].push(o);
    }
    const entries = Object.entries(byForn).sort((a, b) => b[1].length - a[1].length);
    return (
      <>
        {entries.map(([forn, list]) => (
          <Section key={forn} icon="dot" tone="navy" label={forn} count={list.length}>
            {list.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
          </Section>
        ))}
      </>
    );
  }
  if (raggruppa === "commessa") {
    const byCom: Record<string, any[]> = {};
    for (const o of ordini) {
      const k = o.commessa_code || "SCORTA";
      if (!byCom[k]) byCom[k] = [];
      byCom[k].push(o);
    }
    const entries = Object.entries(byCom).sort((a, b) => a[0].localeCompare(b[0]));
    return (
      <>
        {entries.map(([com, list]) => (
          <Section key={com} icon="dot" tone="amber" label={com} count={list.length}>
            {list.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
          </Section>
        ))}
      </>
    );
  }
  // data
  const byData: Record<string, any[]> = {};
  for (const o of ordini) {
    const d = o.consegna_prevista || o.created_at;
    const k = d ? new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : "Senza data";
    if (!byData[k]) byData[k] = [];
    byData[k].push(o);
  }
  return (
    <>
      {Object.entries(byData).map(([data, list]) => (
        <Section key={data} icon="dot" tone="navy" label={data} count={list.length}>
          {list.map((o: any) => <OrdineCard key={o.id} ordine={o} onClick={() => onApri(o.id)} />)}
        </Section>
      ))}
    </>
  );
}
