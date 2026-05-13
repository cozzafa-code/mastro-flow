"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrdineConCommessa, RigaOrdine, RigaVerificata } from "./ordini-types";
import { buildRigheVerificate, calcolaProgressoRicezione, calcolaScostamento, salvaRicezione } from "./ordini-helpers";

const C = {
  navy: "#1A2A47",
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

interface Props {
  ordineId: string;
  onClose: () => void;
  onCompletato: (ordineId: string) => void;
  onOpenAnomalia: (riga: RigaVerificata, qtaRichiesta: number, codice: string, descrizione: string) => void;
}

export default function RicezioneMerceSheet({ ordineId, onClose, onCompletato, onOpenAnomalia }: Props) {
  const [ordine, setOrdine] = useState<OrdineConCommessa | null>(null);
  const [righe, setRighe] = useState<RigaOrdine[]>([]);
  const [rv, setRv] = useState<RigaVerificata[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ddtNumero, setDdtNumero] = useState("");
  const [ddtData, setDdtData] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("ordini_fornitore")
        .select("*, commessa:commesse(code, cliente, cognome)")
        .eq("id", ordineId).single();
      if (!mounted) return;
      if (error) { console.error(error); setLoading(false); return; }
      const o: any = data;
      setOrdine({
        ...o,
        commessa_code: o.commessa?.code,
        commessa_cliente: o.commessa?.cliente,
        commessa_cognome: o.commessa?.cognome,
      });
      const rr: RigaOrdine[] = ((o.righe as any[]) || []).map((r: any, i: number) => ({
        id: r.id || String(i),
        codice: r.codice || r.codice_articolo || "",
        descrizione: r.descrizione || "",
        qta_richiesta: Number(r.qta_richiesta || 0),
        prezzo_unitario: Number(r.prezzo_unitario || 0),
        totale_riga: Number(r.totale_riga || 0),
        unita: r.unita || "pz",
        vano_id: r.vano_id,
        categoria: r.categoria,
      }));
      setRighe(rr);
      const prev = (o.righe_verificate as any[]) || [];
      setRv(buildRigheVerificate(rr, prev as RigaVerificata[]));
      setDdtNumero(o.ddt_numero || "");
      if (o.ddt_data) setDdtData(String(o.ddt_data).slice(0, 10));
      setNote(o.ricezione_note || "");
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [ordineId]);

  const progresso = useMemo(() => calcolaProgressoRicezione(rv), [rv]);
  const scostamento = useMemo(() => calcolaScostamento(rv), [rv]);

  const filtered = useMemo(() => {
    if (!query.trim()) return righe;
    const q = query.toLowerCase();
    return righe.filter(r =>
      (r.codice || "").toLowerCase().includes(q) ||
      (r.descrizione || "").toLowerCase().includes(q)
    );
  }, [righe, query]);

  function markTuttiOk() {
    setRv(rv.map((r, i) => ({
      ...r,
      qta_arrivata: r.qta_richiesta,
      qta_pendente: 0,
      arrivato_ok: true,
      stato: "ok",
    })));
  }

  function aggiornaQta(rigaId: string, qta: number, qtaRichiesta: number) {
    setRv(rv.map(r => {
      if (r.id !== rigaId) return r;
      const arrivata = Math.max(0, Math.min(qta, qtaRichiesta));
      const pendente = qtaRichiesta - arrivata;
      return {
        ...r,
        qta_arrivata: arrivata,
        qta_pendente: pendente,
        arrivato_ok: true,
        stato: pendente === 0 ? "ok" : "parziale",
        backorder: pendente > 0 ? "attendi" : r.backorder,
      };
    }));
  }

  async function handleConferma() {
    if (busy || !ordine) return;
    if (!ddtNumero.trim()) { alert("Numero DDT obbligatorio"); return; }
    if (!ddtData) { alert("Data DDT obbligatoria"); return; }
    setBusy(true);
    const res = await salvaRicezione(ordine.id, rv, { numero: ddtNumero, data: ddtData }, { note: note || null });
    setBusy(false);
    if (res.ok) onCompletato(ordine.id);
    else alert("Errore salvataggio: " + (res.error || ""));
  }

  if (loading || !ordine) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(26,42,71,0.55)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>Caricamento ricezione...</div>
      </div>
    );
  }

  const allOk = progresso.fatti === progresso.totale && progresso.pendenti === 0;
  const someOk = progresso.fatti > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,42,71,0.55)", zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100vh", background: C.white, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header ordine={ordine} onClose={onClose} progresso={progresso} righeTot={righe.length} onTuttiOk={markTuttiOk} query={query} setQuery={setQuery} />
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
          {filtered.map((r) => (
            <Riga
              key={r.id}
              riga={r}
              verifica={rv.find(v => v.id === r.id)!}
              expanded={expandedId === r.id}
              onToggle={() => setExpandedId(expandedId === r.id ? null : r.id)}
              onQta={(q) => aggiornaQta(r.id, q, r.qta_richiesta)}
              onWarn={() => onOpenAnomalia(rv.find(v => v.id === r.id)!, r.qta_richiesta, r.codice || "", r.descrizione)}
            />
          ))}
          <DocSection ddtNumero={ddtNumero} setDdtNumero={setDdtNumero} ddtData={ddtData} setDdtData={setDdtData} note={note} setNote={setNote} />
          <Totali ordine={ordine} progresso={progresso} scostamento={scostamento} />
        </div>
        <ActionBar busy={busy} allOk={allOk} someOk={someOk} onConferma={handleConferma} />
      </div>
    </div>
  );
}

function Header({ ordine, onClose, progresso, righeTot, onTuttiOk, query, setQuery }: any) {
  return (
    <div style={{ background: "linear-gradient(180deg, " + C.greenSoft + " 0%, " + C.white + " 100%)", borderBottom: "1px solid " + C.border, padding: "12px 14px 10px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <button onClick={onClose} style={{ width: 32, height: 32, background: C.white, border: "1px solid " + C.borderStrong, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 32px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: C.greenBright, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 5, marginBottom: 1 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.greenBright }} />
            Scarico merce
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ordine.fornitore}</div>
          <div style={{ fontSize: 10, color: C.navyDim, fontWeight: 600, marginTop: 1, display: "flex", gap: 5, alignItems: "center" }}>
            <span style={{ background: C.whiteOff, fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4, color: C.navyDim }}>{ordine.numero}</span>
            {ordine.commessa_code && <span style={{ background: C.amberSoft, color: C.amberDark, padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{ordine.commessa_code}</span>}
            <span>{righeTot} art.</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 11px", background: C.navy, color: C.white, borderRadius: 10, display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{progresso.fatti}/{progresso.totale} articoli</div>
          <div style={{ fontSize: 9, opacity: 0.7, textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 700 }}>
            {progresso.problemi > 0 && <>{progresso.problemi} anomalie · </>}{progresso.totale - progresso.fatti} da fare
          </div>
        </div>
        <div style={{ width: 70, height: 5, background: "rgba(255,255,255,0.18)", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: progresso.pct + "%", background: C.greenBright, borderRadius: 3 }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 30, textAlign: "right" }}>{progresso.pct}%</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, background: C.whiteOff, border: "1.5px solid " + C.borderStrong, borderRadius: 9, padding: "7px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.navyFaint} strokeWidth={2.2} strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cerca codice..." style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 12, fontWeight: 600, color: C.navy, fontFamily: "inherit" }} />
        </div>
        <button onClick={onTuttiOk} style={{ background: C.greenBright, color: C.white, border: "none", borderRadius: 9, padding: "7px 11px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.3, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          Tutti OK
        </button>
      </div>
    </div>
  );
}

function Riga({ riga, verifica, expanded, onToggle, onQta, onWarn }: any) {
  const stato: string = verifica?.motivo ? "problema" : (verifica?.stato === "parziale" ? "parziale" : verifica?.arrivato_ok ? "ok" : "vuoto");
  const bg = stato === "ok" ? "linear-gradient(90deg, " + C.greenSoft + " 0%, transparent 60%)" : stato === "parziale" ? "linear-gradient(90deg, " + C.amberSoft + " 0%, transparent 60%)" : stato === "problema" ? "linear-gradient(90deg, " + C.redSoft + " 0%, transparent 60%)" : C.white;
  const borderLeft = stato === "parziale" ? "3px solid " + C.amber : stato === "problema" ? "3px solid " + C.red : "none";
  const codBg = stato === "ok" ? C.white : stato === "parziale" ? C.white : stato === "problema" ? C.white : C.whiteOff;
  const codBd = stato === "ok" ? C.greenBright : stato === "parziale" ? C.amber : stato === "problema" ? C.red : C.borderStrong;
  const codFg = stato === "ok" ? C.green : stato === "parziale" ? C.amberDark : stato === "problema" ? C.red : C.navy;
  const qtaBg = stato === "ok" ? C.greenBright : stato === "parziale" ? C.amber : stato === "problema" ? C.red : C.white;
  const qtaFg = stato === "ok" || stato === "problema" ? C.white : stato === "parziale" ? C.navy : C.navy;
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 8, padding: "10px " + (borderLeft !== "none" ? 11 : 14) + "px", background: bg, borderBottom: "1px solid " + C.border, borderLeft }}>
        <div style={{ fontFamily: "monospace", background: codBg, border: "1px solid " + codBd, color: codFg, padding: "4px 7px", borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.3, whiteSpace: "nowrap" }}>{riga.codice || "—"}</div>
        <div style={{ minWidth: 0, lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{riga.descrizione}</div>
          <div style={{ fontSize: 9, fontWeight: 700, color: stato === "ok" ? C.green : stato === "parziale" ? C.amberDark : stato === "problema" ? C.red : C.navyDim, marginTop: 1, textTransform: "uppercase", letterSpacing: 0.3 }}>
            {stato === "ok" ? "✓ Arrivati" : stato === "parziale" ? "Manca " + verifica.qta_pendente + " " + (riga.unita || "pz") : stato === "problema" ? "⚠ " + (verifica.motivo || "") : (riga.unita || "pz") + " · €" + (riga.prezzo_unitario || 0) + "/" + (riga.unita || "pz")}
          </div>
        </div>
        <div onClick={onToggle} style={{ background: qtaBg, color: qtaFg, border: "2px solid " + qtaBg, borderRadius: 10, padding: "5px 9px", textAlign: "center", minWidth: 56, cursor: "pointer" }}>
          <div style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {stato === "vuoto" ? "—/" + riga.qta_richiesta : verifica.qta_arrivata + "/" + riga.qta_richiesta}
          </div>
          <div style={{ fontSize: 8, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.85, marginTop: 1 }}>{riga.unita || "pz"}</div>
        </div>
        <button onClick={onWarn} style={{ width: 30, height: 30, borderRadius: 9, background: stato === "problema" ? C.white : stato === "parziale" ? C.white : C.whiteOff, border: "1.5px solid " + (stato === "problema" ? C.red : stato === "parziale" ? C.amber : C.borderStrong), color: stato === "problema" ? C.red : stato === "parziale" ? C.amberDark : C.navyFaint, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </button>
      </div>
      {expanded && <StepperInline riga={riga} verifica={verifica} onQta={onQta} onClose={onToggle} />}
    </>
  );
}

function StepperInline({ riga, verifica, onQta, onClose }: any) {
  const cur = verifica.qta_arrivata || 0;
  const tot = riga.qta_richiesta;
  return (
    <div style={{ background: C.navy, color: C.white, padding: "11px 14px", borderBottom: "1px solid " + C.border }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.10)", padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{riga.codice || "—"}</span>
          <div style={{ fontSize: 11, fontWeight: 800, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{riga.descrizione}</div>
          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 1, fontWeight: 700 }}>Ord. {tot} · €{riga.prezzo_unitario}/{riga.unita || "pz"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <button onClick={() => onQta(Math.max(0, cur - 1))} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.20)", color: C.white, borderRadius: 8, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>−</button>
          <div style={{ fontSize: 20, fontWeight: 800, fontVariantNumeric: "tabular-nums", minWidth: 32, textAlign: "center" }}>{cur}</div>
          <button onClick={() => onQta(Math.min(tot, cur + 1))} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.10)", border: "1.5px solid rgba(255,255,255,0.20)", color: C.white, borderRadius: 8, fontSize: 16, fontWeight: 800, cursor: "pointer" }}>+</button>
          <span style={{ fontSize: 12, opacity: 0.5 }}>/</span>
          <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>{tot}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
        {[0, Math.floor(tot / 4), Math.floor(tot / 2), Math.floor(tot * 3 / 4), tot].filter((v, i, a) => a.indexOf(v) === i).map(q => (
          <button key={q} onClick={() => { onQta(q); if (q === tot) onClose(); }} style={{ flex: 1, background: q === tot ? C.greenBright : q === cur ? C.amber : "rgba(255,255,255,0.10)", color: q === cur && q !== tot ? C.navy : C.white, border: "1px solid " + (q === tot ? C.greenBright : q === cur ? C.amber : "rgba(255,255,255,0.18)"), borderRadius: 6, padding: 6, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
            {q}{q === tot ? " ✓" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

function DocSection({ ddtNumero, setDdtNumero, ddtData, setDdtData, note, setNote }: any) {
  return (
    <>
      <div style={{ padding: "14px 18px 8px 18px", fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Documenti consegna</div>
      <div style={{ padding: "0 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Field label="N° DDT" req value={ddtNumero} onChange={setDdtNumero} />
        <Field label="Data DDT" req value={ddtData} onChange={setDdtData} type="date" />
      </div>
      <div style={{ padding: "14px 18px 8px 18px", fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.6 }}>Note (opzionale)</div>
      <div style={{ padding: "0 14px" }}>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Note ricezione..." style={{ width: "100%", background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 10, padding: "9px 11px", fontSize: 12, color: C.navy, fontFamily: "inherit", resize: "vertical", outline: "none" }} />
      </div>
    </>
  );
}

function Field({ label, req, value, onChange, type }: any) {
  return (
    <div style={{ background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 9, padding: "7px 10px" }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: C.navyFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 }}>{label} {req && <span style={{ color: C.red }}>*</span>}</div>
      <input type={type || "text"} value={value} onChange={e => onChange(e.target.value)} style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: C.navy, width: "100%", fontFamily: "inherit", background: "transparent", fontVariantNumeric: "tabular-nums" }} />
    </div>
  );
}

function Totali({ ordine, progresso, scostamento }: any) {
  const isScostNeg = scostamento.scostamento < 0;
  return (
    <div style={{ margin: "12px 14px 8px 14px", padding: "11px 13px", background: C.navy, color: C.white, borderRadius: 11 }}>
      <Row l={"Ordinato (" + progresso.totale + " art.)"} v={"€" + Math.round(scostamento.ordinato)} />
      <Row l="Ricevuto effettivo" v={"€" + Math.round(scostamento.ricevuto)} />
      {scostamento.scostamento !== 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0 0 0", marginTop: 5, borderTop: "1px solid rgba(255,255,255,0.20)", fontSize: 15, fontWeight: 800 }}>
          <span>{progresso.pendenti > 0 ? "In backorder" : "Scostamento"}</span>
          <span style={{ color: isScostNeg ? "#FFD9A0" : "#B5DCC5", fontVariantNumeric: "tabular-nums" }}>€{Math.abs(Math.round(scostamento.scostamento))}</span>
        </div>
      )}
      {progresso.totale - progresso.fatti > 0 && (
        <div style={{ fontSize: 9, fontWeight: 700, opacity: 0.6, textAlign: "center", marginTop: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
          {progresso.totale - progresso.fatti} articoli da controllare
        </div>
      )}
    </div>
  );
}

function Row({ l, v }: any) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", fontSize: 11 }}>
      <span style={{ opacity: 0.85, fontWeight: 700 }}>{l}</span>
      <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{v}</span>
    </div>
  );
}

function ActionBar({ busy, allOk, someOk, onConferma }: any) {
  const label = allOk ? "Conferma tutto" : someOk ? "Conferma parziale" : "Salva bozza";
  const bg = allOk ? C.greenBright : someOk ? C.amber : C.navyFaint;
  const fg = someOk && !allOk ? C.navy : C.white;
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.white, padding: "12px 14px 16px 14px", borderTop: "1px solid " + C.border, display: "flex", gap: 7, boxShadow: "0 -4px 16px rgba(26, 42, 71, 0.08)", zIndex: 5 }}>
      <button onClick={onConferma} disabled={busy} style={{ flex: 1, padding: "13px 12px", borderRadius: 11, background: bg, color: fg, border: "none", fontSize: 14, fontWeight: 800, cursor: busy ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        {busy ? "Salvataggio..." : label}
      </button>
    </div>
  );
}
