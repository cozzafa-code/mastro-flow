"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrdineConCommessa, OrdineStato } from "./ordini-types";
import { STATO_LABEL } from "./ordini-types";
import { inviaOrdine } from "./ordini-helpers";

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

interface Props {
  ordineId: string;
  onClose: () => void;
  onRicevi: (ordineId: string) => void;
  onApriCommessa?: (commessaId: string) => void;
}

export default function OrdineDettaglioSheet({ ordineId, onClose, onRicevi, onApriCommessa }: Props) {
  const [ordine, setOrdine] = useState<OrdineConCommessa | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await supabase
        .from("ordini_fornitore")
        .select("*, commessa:commesse(code, cliente, cognome, indirizzo)")
        .eq("id", ordineId)
        .single();
      if (mounted) {
        if (error) console.error("[OrdineDettaglio]", error);
        const o: any = data;
        setOrdine(o ? {
          ...o,
          commessa_code: o.commessa?.code,
          commessa_cliente: o.commessa?.cliente,
          commessa_cognome: o.commessa?.cognome,
        } : null);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [ordineId]);

  async function handleInvia() {
    if (!ordine || busy) return;
    setBusy(true);
    const res = await inviaOrdine(ordine.id);
    setBusy(false);
    if (res.ok) {
      setOrdine({ ...ordine, stato: "inviato", inviato_at: new Date().toISOString() });
    } else {
      alert("Errore: " + (res.error || "invio fallito"));
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26, 42, 71, 0.55)", zIndex: 50, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, height: "100vh", background: C.white, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <CloseBtn onClick={onClose} />
        {loading || !ordine ? (
          <div style={{ padding: 40, textAlign: "center", color: C.navyFaint, fontSize: 13, fontWeight: 700 }}>Caricamento...</div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", paddingBottom: 100 }}>
              <DetailHead ordine={ordine} onApriCommessa={onApriCommessa} />
              <Stepper stato={ordine.stato as OrdineStato} />
              <InfoConsegna ordine={ordine} />
              <RigheArticoli ordine={ordine} />
              <TotaleBlock ordine={ordine} />
              <Documenti ordine={ordine} />
            </div>
            <ActionBar ordine={ordine} busy={busy} onRicevi={() => onRicevi(ordine.id)} onInvia={handleInvia} />
          </>
        )}
      </div>
    </div>
  );
}

function CloseBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, background: "rgba(255,255,255,0.95)", border: "1px solid " + C.borderStrong, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.navy, zIndex: 10, boxShadow: "0 2px 6px rgba(26, 42, 71, 0.10)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  );
}

function DetailHead({ ordine, onApriCommessa }: any) {
  const dataCreato = ordine.created_at ? new Date(ordine.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : "";
  return (
    <div style={{ padding: "14px 52px 16px 18px", background: "linear-gradient(180deg, " + C.amberSoft + " 0%, " + C.white + " 100%)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ background: C.white, color: C.navy, padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: 0.5, fontFamily: "monospace", border: "1px solid " + C.borderStrong }}>{ordine.numero || "—"}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: C.amberDark, textTransform: "uppercase", letterSpacing: 0.5 }}>creato {dataCreato}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, letterSpacing: -0.4, marginBottom: 5, lineHeight: 1.1 }}>{ordine.fornitore}</div>
      <div style={{ fontSize: 12, color: C.navyDim, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {ordine.commessa_code ? (
          <span onClick={() => ordine.commessa_id && onApriCommessa?.(ordine.commessa_id)} style={{ background: C.amberSoft, color: C.amberDark, padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 800, letterSpacing: 0.3, cursor: onApriCommessa ? "pointer" : "default" }}>{ordine.commessa_code}</span>
        ) : (
          <span style={{ background: "rgba(26,42,71,0.08)", color: C.navy, padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 800, letterSpacing: 0.3 }}>SCORTA MAGAZZINO</span>
        )}
        {ordine.commessa_cliente && <span>{ordine.commessa_cliente} {ordine.commessa_cognome || ""}</span>}
      </div>
      <FlagRow ordine={ordine} />
    </div>
  );
}

function FlagRow({ ordine }: any) {
  const flags: any[] = [];
  const statoStyles: any = {
    errore: { bg: C.redSoft, fg: C.red, bd: C.red },
    da_ordinare: { bg: C.white, fg: C.red, bd: C.red },
    inviato: { bg: C.amberSoft, fg: C.amberDark, bd: C.amber },
    in_transito: { bg: C.amberSoft, fg: C.amberDark, bd: C.amber },
    confermato: { bg: "rgba(26,42,71,0.08)", fg: C.navy, bd: C.navy },
    arrivato: { bg: C.greenSoft, fg: C.green, bd: C.greenBright },
    arrivato_parziale: { bg: C.amber, fg: C.navy, bd: C.amber },
    bozza: { bg: C.whiteOff, fg: C.navyDim, bd: C.borderStrong },
  };
  const sty = statoStyles[ordine.stato] || statoStyles.inviato;
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
      <span style={{ background: sty.bg, color: sty.fg, border: "1.5px solid " + sty.bd, padding: "4px 9px", borderRadius: 6, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {STATO_LABEL[ordine.stato as OrdineStato] || ordine.stato}
      </span>
      {ordine.bloccante && <span style={{ background: C.red, color: C.white, padding: "4px 9px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>BLOCCANTE</span>}
      {ordine.urgente && <span style={{ background: C.amber, color: C.navy, padding: "4px 9px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>URGENTE</span>}
      {ordine.categoria_materiale && <span style={{ background: C.whiteOff, color: C.navy, padding: "4px 9px", borderRadius: 6, fontSize: 9, fontWeight: 800, letterSpacing: 0.5, border: "1px solid " + C.borderStrong }}>{ordine.categoria_materiale}</span>}
    </div>
  );
}

function Stepper({ stato }: { stato: OrdineStato }) {
  const isDaOrdinare = stato === "da_ordinare" || stato === "approvazione";
  const steps = [
    { id: "bozza", l: isDaOrdinare ? "Da ord." : "Bozza" },
    { id: "inviato", l: "Inviato" },
    { id: "confermato", l: "Conferm." },
    { id: "in_transito", l: "In viaggio" },
    { id: "arrivato", l: "Arrivato" },
  ];
  const order: Record<string, number> = { bozza: 0, da_ordinare: 0, approvazione: 0, inviato: 1, confermato: 2, in_transito: 3, arrivato: 4, arrivato_parziale: 4, verificato: 4 };
  const currIdx = order[stato] ?? 0;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: C.whiteOff, borderBottom: "1px solid " + C.border, position: "relative" }}>
      {steps.map((s, i) => {
        const done = i < currIdx;
        const curr = i === currIdx;
        const bg = done ? C.greenBright : curr ? C.amber : C.white;
        const bd = done ? C.greenBright : curr ? C.amber : C.borderStrong;
        const fg = done ? C.white : curr ? C.navy : C.navyFaint;
        return (
          <div key={s.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1, position: "relative", zIndex: 1 }}>
            {i > 0 && <div style={{ position: "absolute", top: 11, left: "-50%", right: "50%", height: 2, background: done || curr ? C.greenBright : C.borderStrong, zIndex: 0 }} />}
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: bg, border: "2px solid " + bd, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: fg, position: "relative", zIndex: 1, boxShadow: curr ? "0 0 0 4px rgba(232, 176, 92, 0.25)" : "none" }}>
              {done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : curr ? "●" : i + 1}
            </div>
            <div style={{ fontSize: 8, fontWeight: 800, color: done ? C.green : curr ? C.amberDark : C.navyDim, textTransform: "uppercase", letterSpacing: 0.4, textAlign: "center" }}>{s.l}</div>
          </div>
        );
      })}
    </div>
  );
}

function InfoConsegna({ ordine }: any) {
  const data = ordine.consegna_prevista ? new Date(ordine.consegna_prevista).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : "Da definire";
  const today = new Date().toDateString();
  const isOgggi = ordine.consegna_prevista && new Date(ordine.consegna_prevista).toDateString() === today;
  return (
    <>
      <SectionTit>Consegna prevista</SectionTit>
      <div style={{ padding: "0 14px 6px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <InfoCell label="Data" value={isOgggi ? "Oggi · " + data : data} tone={isOgggi ? "amber" : "neutral"} />
        <InfoCell label="Tipo" value={ordine.consegna_tipo === "cantiere" ? "In cantiere" : "Magazzino"} />
        {ordine.consegna_indirizzo && <InfoCell label="Indirizzo" value={ordine.consegna_indirizzo} full />}
        {ordine.referente_fornitore && <InfoCell label="Referente" value={ordine.referente_fornitore} />}
        {ordine.metodo_pagamento && <InfoCell label="Pagamento" value={ordine.metodo_pagamento} />}
      </div>
    </>
  );
}

function InfoCell({ label, value, full, tone }: any) {
  return (
    <div style={{ background: C.whiteOff, borderRadius: 9, padding: "9px 11px", border: "1px solid " + C.border, gridColumn: full ? "1 / -1" : undefined }}>
      <div style={{ fontSize: 8, fontWeight: 800, color: C.navyFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: tone === "amber" ? C.amberDark : C.navy, fontVariantNumeric: "tabular-nums", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function RigheArticoli({ ordine }: any) {
  const righe = (ordine.righe as any[]) || [];
  return (
    <>
      <SectionTit>Articoli ({righe.length})</SectionTit>
      <div style={{ padding: "0 14px" }}>
        {righe.length === 0 ? (
          <div style={{ padding: "18px 12px", textAlign: "center", background: C.amberSoft, border: "1.5px dashed " + C.amber, borderRadius: 11, color: C.amberDark, fontSize: 12, fontWeight: 700, lineHeight: 1.4 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Nessun articolo in questo ordine</div>
            <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>Modifica l'ordine per aggiungere le righe del materiale</div>
          </div>
        ) : righe.map((r: any, i: number) => (
          <div key={r.id || i} style={{ display: "flex", alignItems: "center", background: C.whiteOff, borderRadius: 10, padding: "10px 12px", marginBottom: 5, border: "1px solid " + C.border, gap: 9 }}>
            <div style={{ background: C.amberSoft, color: C.amberDark, width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, flex: "0 0 22px" }}>{i + 1}</div>
            <div style={{ flex: 1, lineHeight: 1.2, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.descrizione || "—"}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.navyDim, fontVariantNumeric: "tabular-nums" }}>
                {r.qta_richiesta || 0}{r.unita ? " " + r.unita : " pz"} × €{r.prezzo_unitario || 0}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums" }}>€{Math.round(Number(r.totale_riga || 0))}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function TotaleBlock({ ordine }: any) {
  const tot = Number(ordine.totale_euro || 0);
  const ivaPct = 22;
  const imponibile = tot / (1 + ivaPct / 100);
  const iva = tot - imponibile;
  return (
    <div style={{ margin: "10px 14px 12px 14px", padding: "12px 14px", background: C.navy, color: C.white, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
        <span style={{ opacity: 0.85, fontWeight: 700 }}>Imponibile</span>
        <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>€{imponibile.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
        <span style={{ opacity: 0.85, fontWeight: 700 }}>IVA {ivaPct}%</span>
        <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>€{iva.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 0 0", marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.20)", fontSize: 16, fontWeight: 800 }}>
        <span>TOTALE</span>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>€{tot.toFixed(2)}</span>
      </div>
      {ordine.stato === "arrivato" && Number(ordine.scostamento_costo || 0) !== 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0 0 0", marginTop: 4, fontSize: 11 }}>
          <span style={{ opacity: 0.85 }}>Scostamento</span>
          <span style={{ fontWeight: 800, color: Number(ordine.scostamento_costo) < 0 ? "#FFB8B8" : "#B5DCC5", fontVariantNumeric: "tabular-nums" }}>€{Number(ordine.scostamento_costo).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

function Documenti({ ordine }: any) {
  const docs: any[] = [];
  if (ordine.pdf_url) docs.push({ name: "Ordine " + (ordine.numero || "") + ".pdf", meta: "PDF · " + (ordine.inviato_at ? "Inviato" : "Bozza"), url: ordine.pdf_url });
  if (ordine.ddt_numero) docs.push({ name: "DDT " + ordine.ddt_numero, meta: ordine.ddt_data ? new Date(ordine.ddt_data).toLocaleDateString("it-IT") : "DDT consegna" });
  if (ordine.fattura_numero) docs.push({ name: "Fattura " + ordine.fattura_numero, meta: "€" + Number(ordine.importo_fatturato || 0).toFixed(2) });
  if (docs.length === 0) return null;
  return (
    <>
      <SectionTit>Documenti</SectionTit>
      <div style={{ padding: "0 14px 14px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
        {docs.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 10, padding: "10px 12px", gap: 10, cursor: d.url ? "pointer" : "default" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.amberSoft, color: C.amberDark, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 32px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.navy }}>{d.name}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.navyDim, marginTop: 1 }}>{d.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SectionTit({ children }: any) {
  return <div style={{ padding: "14px 18px 6px 18px", fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.6 }}>{children}</div>;
}

function ActionBar({ ordine, busy, onRicevi, onInvia }: any) {
  const isBozza = ordine.stato === "bozza" || ordine.stato === "da_ordinare";
  const isInTransito = ordine.stato === "inviato" || ordine.stato === "in_transito" || ordine.stato === "confermato";
  const isArrivato = ordine.stato === "arrivato" || ordine.stato === "arrivato_parziale" || ordine.stato === "verificato";
  let primaryLabel = "Ricevi merce";
  let primaryBg = C.greenBright;
  let primaryAction: () => void = onRicevi;
  if (isBozza) {
    primaryLabel = busy ? "Invio..." : "Invia ora";
    primaryBg = C.navy;
    primaryAction = onInvia;
  } else if (isArrivato) {
    primaryLabel = "Vedi ricezione";
    primaryBg = C.greenBright;
  }
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: C.white, padding: "12px 14px 16px 14px", borderTop: "1px solid " + C.border, display: "flex", gap: 8, boxShadow: "0 -4px 16px rgba(26, 42, 71, 0.08)", zIndex: 5 }}>
      <button style={{ padding: "12px 14px", borderRadius: 12, background: C.whiteOff, color: C.navy, border: "1.5px solid " + C.borderStrong, fontSize: 13, fontWeight: 800, cursor: "pointer", flex: "0 0 100px" }}>Modifica</button>
      <button onClick={primaryAction} disabled={busy} style={{ flex: 1, padding: "12px 14px", borderRadius: 12, background: primaryBg, color: C.white, border: "none", fontSize: 13, fontWeight: 800, cursor: busy ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          {isBozza ? <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/> : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
        </svg>
        {primaryLabel}
      </button>
      <button style={{ width: 44, background: C.whiteOff, border: "1.5px solid " + C.borderStrong, color: C.navy, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12, cursor: "pointer" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    </div>
  );
}
