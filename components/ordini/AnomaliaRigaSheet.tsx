"use client";

import React, { useState } from "react";
import type { BackorderAction, MotivoAnomalia, RigaVerificata } from "./ordini-types";

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
  riga: RigaVerificata;
  qtaRichiesta: number;
  codice: string;
  descrizione: string;
  prezzoUnitario: number;
  onClose: () => void;
  onConferma: (updated: Partial<RigaVerificata>) => void;
}

const MOTIVI: { id: MotivoAnomalia; label: string; ico: string }[] = [
  { id: "mancano", label: "Mancano", ico: "minus" },
  { id: "danneggiati", label: "Danneggiati", ico: "x" },
  { id: "sbagliati", label: "Sbagliati", ico: "q" },
  { id: "altro", label: "Altro", ico: "dot" },
];

const BACKORDER_OPTS: { id: BackorderAction; name: string; desc: (mancanti: number) => string }[] = [
  { id: "attendi", name: "Attendi resto", desc: (m) => "Ordine resta aperto · " + m + " in attesa" },
  { id: "chiudi", name: "Chiudi così", desc: (_m) => "Accetta scostamento e procedi" },
  { id: "nuovo_ordine", name: "Altro fornitore", desc: (m) => "Crea nuovo OF con " + m + " pz" },
];

export default function AnomaliaRigaSheet({ riga, qtaRichiesta, codice, descrizione, prezzoUnitario, onClose, onConferma }: Props) {
  const [qtaArrivata, setQtaArrivata] = useState<number>(riga.qta_arrivata || 0);
  const [motivo, setMotivo] = useState<MotivoAnomalia>(riga.motivo || "mancano");
  const [backorder, setBackorder] = useState<BackorderAction>(riga.backorder || "attendi");
  const [note, setNote] = useState<string>(riga.note || "");
  const mancanti = Math.max(0, qtaRichiesta - qtaArrivata);
  const totalePerso = mancanti * prezzoUnitario;

  function handleConferma() {
    onConferma({
      qta_arrivata: qtaArrivata,
      qta_pendente: mancanti,
      arrivato_ok: true,
      stato: mancanti === 0 ? "ok" : "problema",
      motivo: mancanti === 0 ? null : motivo,
      backorder,
      note: note || null,
    });
  }

  const quickValues = Array.from(new Set([0, Math.floor(qtaRichiesta / 4), Math.floor(qtaRichiesta / 2), Math.floor(qtaRichiesta * 3 / 4), qtaRichiesta])).filter(v => v >= 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,42,71,0.65)", zIndex: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 420, maxHeight: "92vh", background: C.white, borderRadius: "20px 20px 0 0", overflowY: "auto", position: "relative", padding: "14px 16px 20px 16px" }}>
        <div style={{ width: 40, height: 4, background: C.navyFaint, borderRadius: 2, margin: "0 auto 12px auto" }} />
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, background: C.whiteOff, border: "none", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.navy }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.red }} />
          Anomalia ricezione
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.navy, lineHeight: 1.2, marginBottom: 3 }}>{descrizione}</div>
        <div style={{ fontSize: 11, color: C.navyDim, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "monospace", background: C.whiteOff, padding: "1px 6px", borderRadius: 5, fontSize: 10, fontWeight: 800, color: C.navy }}>{codice || "—"}</span>
          €{prezzoUnitario}/pz
        </div>

        <div style={{ background: C.whiteOff, border: "1px solid " + C.borderStrong, borderRadius: 12, padding: "11px 13px", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.navyFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1 }}>Ordinato</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums" }}>{qtaRichiesta} pz</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.navyFaint, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 1 }}>Tot ord.</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums" }}>€{qtaRichiesta * prezzoUnitario}</div>
          </div>
        </div>

        <div style={{ background: C.white, border: "2px solid " + C.red, borderRadius: 14, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center", marginBottom: 8 }}>Quanti pezzi sono arrivati?</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, alignItems: "center", marginBottom: 12 }}>
            <button onClick={() => setQtaArrivata(Math.max(0, qtaArrivata - 1))} style={{ width: 42, height: 42, borderRadius: 12, background: C.whiteOff, border: "2px solid " + C.borderStrong, fontSize: 22, fontWeight: 800, color: C.navy, cursor: "pointer" }}>−</button>
            <div style={{ fontSize: 38, fontWeight: 800, color: C.navy, fontVariantNumeric: "tabular-nums", letterSpacing: -1, minWidth: 80, textAlign: "center", lineHeight: 1 }}>{qtaArrivata}</div>
            <button onClick={() => setQtaArrivata(Math.min(qtaRichiesta, qtaArrivata + 1))} style={{ width: 42, height: 42, borderRadius: 12, background: C.whiteOff, border: "2px solid " + C.borderStrong, fontSize: 22, fontWeight: 800, color: C.navy, cursor: "pointer" }}>+</button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, textAlign: "center", marginBottom: 8, color: C.navyDim }}>
            su {qtaRichiesta} ordinati · {mancanti > 0 ? <b style={{ color: C.red }}>mancano {mancanti}</b> : <b style={{ color: C.green }}>tutto OK</b>}
          </div>
          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
            {quickValues.map(q => (
              <button key={q} onClick={() => setQtaArrivata(q)} style={{ flex: 1, padding: "7px 8px", borderRadius: 8, background: qtaArrivata === q ? C.red : C.whiteOff, color: qtaArrivata === q ? C.white : C.navy, border: "1.5px solid " + (qtaArrivata === q ? C.red : C.borderStrong), fontSize: 11, fontWeight: 800, cursor: "pointer" }}>{q}</button>
            ))}
          </div>
        </div>

        {mancanti > 0 && (
          <>
            <div style={{ fontSize: 10, fontWeight: 800, color: C.navyDim, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 7 }}>Cos'è successo?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
              {MOTIVI.map(m => {
                const active = motivo === m.id;
                return (
                  <button key={m.id} onClick={() => setMotivo(m.id)} style={{ padding: "11px 8px", borderRadius: 10, background: active ? C.redSoft : C.white, color: active ? C.red : C.navy, border: "1.5px solid " + (active ? C.red : C.borderStrong), fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 22, height: 22, background: active ? C.red : C.whiteOff, color: active ? C.white : C.navyDim, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 22px" }}>
                      <MotivoIcon name={m.ico} />
                    </div>
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div style={{ background: C.amberSoft, border: "1.5px solid " + C.amber, borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.amberDark, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Cosa fare con i {mancanti} mancanti?
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {BACKORDER_OPTS.map(b => {
                  const active = backorder === b.id;
                  return (
                    <div key={b.id} onClick={() => setBackorder(b.id)} style={{ background: active ? C.amberSoft : C.white, border: "1.5px solid " + (active ? C.amberDark : "transparent"), borderRadius: 9, padding: "9px 11px", display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.white, border: "2px solid " + (active ? C.amberDark : C.borderStrong), flex: "0 0 18px", position: "relative" }}>
                        {active && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: C.amberDark }} />}
                      </div>
                      <div style={{ flex: 1, lineHeight: 1.2 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: C.navy }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: C.navyDim, fontWeight: 600, marginTop: 1 }}>{b.desc(mancanti)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {backorder === "chiudi" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: C.red, textAlign: "center", marginTop: 8, padding: "5px 10px", background: C.redSoft, borderRadius: 6 }}>
                  Scostamento: −€{totalePerso.toFixed(2)}
                </div>
              )}
            </div>
          </>
        )}

        <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Note opzionali..." style={{ width: "100%", background: C.white, border: "1.5px solid " + C.borderStrong, borderRadius: 10, padding: "9px 11px", fontSize: 12, color: C.navy, fontFamily: "inherit", resize: "vertical", outline: "none", marginBottom: 12 }} />

        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={onClose} style={{ flex: "0 0 80px", padding: 12, borderRadius: 11, background: C.whiteOff, color: C.navy, border: "1.5px solid " + C.borderStrong, fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Annulla</button>
          <button onClick={handleConferma} style={{ flex: 1, padding: 12, borderRadius: 11, background: mancanti > 0 ? C.red : C.greenBright, color: C.white, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Conferma {qtaArrivata}/{qtaRichiesta}
          </button>
        </div>
      </div>
    </div>
  );
}

function MotivoIcon({ name }: { name: string }) {
  if (name === "minus") return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>;
  if (name === "x") return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>;
  if (name === "q") return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/></svg>;
}
