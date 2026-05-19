"use client";
// components/MaterialiPanel.tsx v2 - 3 tab + filtri ordini
import React, { useState, useMemo } from "react";
import { useOrdiniMateriali, type OrdineRow } from "../hooks/useOrdiniMateriali";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D", BG = "#EEF8F8";
const TEAL = "#28A0A0", TEXT = "#0F1F33", MUTED = "#5C6B7A";

type Tab = "per_commessa" | "tutti" | "magazzino";

const STATO_COLORS: Record<string, { bg: string; fg: string; lbl: string }> = {
  bozza:       { bg: "#F1F4F7", fg: "#5C6B7A", lbl: "BOZZA" },
  inviato:     { bg: "#DBEAFE", fg: "#1E3A8A", lbl: "INVIATO" },
  confermato:  { bg: "#FEF3C7", fg: "#92400E", lbl: "CONFERMATO" },
  in_transito: { bg: "#FEF3C7", fg: "#92400E", lbl: "IN TRANSITO" },
  arrivato:    { bg: "#D1FAE5", fg: "#065F46", lbl: "ARRIVATO" },
  completato:  { bg: "#D1FAE5", fg: "#065F46", lbl: "COMPLETATO" },
  annullato:   { bg: "#FEE2E2", fg: "#991B1B", lbl: "ANNULLATO" },
};

const fmtEur = (n: number) => "€ " + (Number(n) || 0).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "—";

function getAziendaId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("mastro:aziendaId") || localStorage.getItem("mastro:aziendaId") || "ccca51c1-656b-4e7c-a501-55753e20da29";
}

export default function MaterialiPanel({ onBack, onApriCommessa }: any) {
  const [tab, setTab] = useState<Tab>("per_commessa");
  const aziendaId = getAziendaId();
  const { ordini, loading, error, reload } = useOrdiniMateriali(aziendaId);

  // Stats
  const stats = useMemo(() => {
    const totali = ordini.length;
    const bozze = ordini.filter(o => o.stato === "bozza" || o.bozza).length;
    const inTransito = ordini.filter(o => ["inviato", "confermato", "in_transito"].includes(o.stato)).length;
    const arrivati = ordini.filter(o => ["arrivato", "completato"].includes(o.stato)).length;
    const valoreTot = ordini.reduce((s, o) => s + o.totale_euro, 0);
    return { totali, bozze, inTransito, arrivati, valoreTot };
  }, [ordini]);

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, padding: "14px 16px 22px", borderRadius: "0 0 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={onBack} style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.12)", color: "#FFF", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 9, letterSpacing: 1.2, fontWeight: 600 }}>GESTIONE MATERIALI</div>
            <div style={{ color: "#FFF", fontSize: 18, fontWeight: 600, marginTop: 2 }}>Ordini & Magazzino</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Stat label="TOTALI" val={stats.totali} sub={`${stats.bozze} bozze`} />
          <Stat label="IN TRANSITO" val={stats.inTransito} sub="da consegnare" warn={stats.inTransito > 0} />
          <Stat label="VALORE" val={fmtEur(stats.valoreTot).replace("€ ", "€")} sub={`${stats.arrivati} arrivati`} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#FFF", margin: "-14px 14px 0", padding: 4, borderRadius: 12, display: "flex", gap: 2, boxShadow: "0 4px 14px rgba(15,31,51,0.1)", position: "relative", zIndex: 5 }}>
        <TabBtn active={tab === "per_commessa"} onClick={() => setTab("per_commessa")}>Per Commessa</TabBtn>
        <TabBtn active={tab === "tutti"} onClick={() => setTab("tutti")} count={ordini.length}>Tutti</TabBtn>
        <TabBtn active={tab === "magazzino"} onClick={() => setTab("magazzino")}>Magazzino</TabBtn>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: MUTED }}>Caricamento…</div> :
       error ? <div style={{ margin: 14, padding: 14, background: "#FEE2E2", color: "#991B1B", borderRadius: 10 }}>{error}</div> :
       tab === "per_commessa" ? <PerCommessa ordini={ordini} onApriCommessa={onApriCommessa} onReload={reload} /> :
       tab === "tutti" ? <TuttiOrdini ordini={ordini} onApriCommessa={onApriCommessa} /> :
       <MagazzinoView />}
    </div>
  );
}

// ============== TAB PER COMMESSA ==============
function PerCommessa({ ordini, onApriCommessa, onReload }: any) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const gruppi = useMemo(() => {
    const map: Record<string, OrdineRow[]> = {};
    ordini.forEach((o: OrdineRow) => {
      const k = o.commessa_id || "_none";
      if (!map[k]) map[k] = [];
      map[k].push(o);
    });
    return Object.entries(map).map(([cm_id, ords]) => ({
      cm_id,
      code: ords[0]?.commessa_code || "?",
      cliente: ords[0]?.commessa_cliente || "?",
      ordini: ords,
      totale: ords.reduce((s, o) => s + o.totale_euro, 0),
      inTransito: ords.filter(o => ["inviato", "confermato", "in_transito"].includes(o.stato)).length,
    })).sort((a, b) => b.code.localeCompare(a.code));
  }, [ordini]);

  if (gruppi.length === 0) return <Empty label="Nessun ordine fornitore" />;

  return (
    <div style={{ padding: 14 }}>
      {gruppi.map(g => {
        const open = expanded.has(g.cm_id);
        return (
          <div key={g.cm_id} style={{ background: "#FFF", borderRadius: 12, marginBottom: 10, overflow: "hidden", boxShadow: "0 2px 8px rgba(15,31,51,0.06)" }}>
            <div onClick={() => {
              const n = new Set(expanded);
              n.has(g.cm_id) ? n.delete(g.cm_id) : n.add(g.cm_id);
              setExpanded(n);
            }} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{g.code} · {g.cliente}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {g.ordini.length} ordini · {fmtEur(g.totale)}
                  {g.inTransito > 0 && <span style={{ color: "#92400E", marginLeft: 6 }}>· {g.inTransito} in transito</span>}
                </div>
              </div>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            {open && (
              <div style={{ borderTop: `1px solid #E5EAF0`, background: "#F8FAFA" }}>
                {g.ordini.map((o: OrdineRow) => <OrdineRiga key={o.id} o={o} />)}
                {onApriCommessa && (
                  <button onClick={() => onApriCommessa(g.cm_id)} style={{ width: "100%", padding: 10, background: "transparent", color: TEAL, border: "none", borderTop: `1px solid #E5EAF0`, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    → APRI COMMESSA {g.code}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============== TAB TUTTI ==============
function TuttiOrdini({ ordini, onApriCommessa }: any) {
  const [filtroStato, setFiltroStato] = useState<string>("tutti");
  const [filtroFornitore, setFiltroFornitore] = useState<string>("tutti");
  const [sortBy, setSortBy] = useState<"data_desc" | "data_asc" | "importo_desc" | "importo_asc">("data_desc");

  const fornitori = useMemo(() => Array.from(new Set(ordini.map((o: OrdineRow) => o.fornitore))).sort(), [ordini]);

  const filtered = useMemo(() => {
    let arr = [...ordini];
    if (filtroStato !== "tutti") arr = arr.filter((o: OrdineRow) => o.stato === filtroStato);
    if (filtroFornitore !== "tutti") arr = arr.filter((o: OrdineRow) => o.fornitore === filtroFornitore);
    arr.sort((a: OrdineRow, b: OrdineRow) => {
      if (sortBy === "data_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "data_asc")  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "importo_desc") return b.totale_euro - a.totale_euro;
      return a.totale_euro - b.totale_euro;
    });
    return arr;
  }, [ordini, filtroStato, filtroFornitore, sortBy]);

  return (
    <div style={{ padding: 14 }}>
      {/* Filtri stato */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 10, paddingBottom: 4 }}>
        {["tutti","bozza","inviato","confermato","in_transito","arrivato"].map(s => (
          <button key={s} onClick={() => setFiltroStato(s)} style={{
            padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: filtroStato === s ? NAVY : "#FFF",
            color: filtroStato === s ? "#FFF" : MUTED,
            fontSize: 11, fontWeight: 700, whiteSpace: "nowrap"
          }}>{s === "tutti" ? "Tutti" : (STATO_COLORS[s]?.lbl || s.toUpperCase())}</button>
        ))}
      </div>
      {/* Filtri fornitore + sort */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <select value={filtroFornitore} onChange={e => setFiltroFornitore(e.target.value)} style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid #E5EAF0", fontSize: 11, background: "#FFF", color: TEXT }}>
          <option value="tutti">Tutti i fornitori</option>
          {fornitori.map(f => <option key={f as string} value={f as string}>{f as string}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ flex: 1, padding: 9, borderRadius: 8, border: "1px solid #E5EAF0", fontSize: 11, background: "#FFF", color: TEXT }}>
          <option value="data_desc">Più recenti</option>
          <option value="data_asc">Più vecchi</option>
          <option value="importo_desc">Importo ↓</option>
          <option value="importo_asc">Importo ↑</option>
        </select>
      </div>
      {/* Lista */}
      {filtered.length === 0 ? <Empty label="Nessun ordine corrisponde ai filtri" /> :
        <div style={{ background: "#FFF", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(15,31,51,0.06)" }}>
          {filtered.map((o: OrdineRow, i: number) => <OrdineRiga key={o.id} o={o} showCommessa />)}
        </div>}
    </div>
  );
}

// ============== RIGA ORDINE ==============
function OrdineRiga({ o, showCommessa }: { o: OrdineRow; showCommessa?: boolean }) {
  const col = STATO_COLORS[o.stato] || STATO_COLORS.bozza;
  return (
    <div style={{ padding: "11px 14px", borderBottom: "1px solid #E5EAF0", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>#{o.numero}</div>
          <div style={{ fontSize: 12, color: MUTED }}>·</div>
          <div style={{ fontSize: 12, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.fornitore}</div>
          {o.urgente && <span style={{ background: "#FEE2E2", color: "#991B1B", fontSize: 8, padding: "1px 5px", borderRadius: 4, fontWeight: 700 }}>URGENTE</span>}
        </div>
        <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
          {showCommessa && <>{o.commessa_code} · </>}
          {fmtDate(o.created_at)}{o.consegna_prevista && <> · consegna {fmtDate(o.consegna_prevista)}</>} · {o.n_righe} {o.n_righe === 1 ? "art." : "art."}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{fmtEur(o.totale_euro)}</div>
        <div style={{ display: "inline-block", marginTop: 3, padding: "2px 6px", borderRadius: 5, background: col.bg, color: col.fg, fontSize: 8, fontWeight: 800, letterSpacing: 0.3 }}>{col.lbl}</div>
      </div>
    </div>
  );
}

// ============== TAB MAGAZZINO (placeholder per ora) ==============
function MagazzinoView() {
  return (
    <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>📦</div>
      <div style={{ fontWeight: 700, color: TEXT, fontSize: 14, marginBottom: 6 }}>Modulo Magazzino</div>
      <div>Scorte, articoli e movimenti<br/>in arrivo nelle prossime versioni</div>
    </div>
  );
}

// ============== HELPERS ==============
function Stat({ label, val, sub, warn }: any) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "8px 10px" }}>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
      <div style={{ color: warn ? "#FBBF24" : "#FFF", fontSize: 18, fontWeight: 700, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>{val}</div>
      <div style={{ color: warn ? "#FBBF24" : "rgba(255,255,255,0.6)", fontSize: 9, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function TabBtn({ active, onClick, count, children }: any) {
  return (
    <div onClick={onClick} style={{ flex: 1, textAlign: "center", padding: "9px 0", fontSize: 11, fontWeight: 600, color: active ? "#FFF" : MUTED, background: active ? NAVY : "transparent", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
      <span>{children}</span>
      {count != null ? <span style={{ background: active ? "rgba(255,255,255,0.2)" : "#F1F4F7", color: active ? "#FFF" : MUTED, fontSize: 9, padding: "1px 5px", borderRadius: 5, fontWeight: 700 }}>{count}</span> : null}
    </div>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: "center", color: MUTED, fontSize: 12 }}>{label}</div>;
}
