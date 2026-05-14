"use client";
import React, { useState, useMemo } from "react";
import RigaFatturaProRow, { type RigaFatturaPro, type RigaTipo, TIPI_META } from "./RigaFatturaPro";
import { Sez, Field, Row2, Check, Tag, RiepRow, vtBtn } from "./ModalNuovaFatturaProHelpers";
import SezioneClienteCommessa from "./SezioneClienteCommessa";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const TEAL_SOFT = "#D6F0F0";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const RED = "#C73E1D";
const MUTED = "#5C6B7A";
const BORDER = "#E5EAF0";
const BG_SOFT = "#F7F9FB";
const BG_APP = "#7A8A9A";

interface Props {
  aziendaId: string;
  commessaCode?: string;
  commessaId?: string;
  onClose: () => void;
  onCrea: (payload: NuovaFatturaPayload) => Promise<void>;
}

export interface NuovaFatturaPayload {
  tipo_documento_sdi: string;
  cliente: string;
  cliente_piva?: string;
  cliente_cf?: string;
  cliente_indirizzo?: string;
  cliente_citta?: string;
  cliente_provincia?: string;
  cliente_email?: string;
  cliente_sdi?: string;
  commessa_code?: string;
  data_emissione: string;
  data_scadenza?: string;
  modalita_pagamento?: string;
  perc_acconto?: number;
  righe: RigaFatturaPro[];
  ecobonus_tipo?: string;
  sconto_in_fattura: boolean;
  genera_dichiarazione_fornitore: boolean;
  bollo: number;
  causale_forfettario?: string;
  riepilogo_iva: { aliquota: number; imponibile: number; imposta: number }[];
  bene_significativo_calc?: any;
  totale_imponibile: number;
  totale_iva: number;
  totale: number;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

const TIPI_DOC = [
  { v: "TD01", l: "Fattura", s: "Standard" },
  { v: "TD02", l: "Acconto", s: "Acc. su corr." },
  { v: "TD06", l: "Saldo", s: "Parcella" },
  { v: "TD07", l: "Semplif.", s: "< €400" },
];

const ECOBONUS_OPT = [
  { v: "", l: "Nessuno" },
  { v: "ecobonus_50", l: "Ecobonus 50%" },
  { v: "ecobonus_65", l: "Ecobonus 65%" },
  { v: "bonus_casa_50", l: "Bonus Casa 50%" },
];

export default function ModalNuovaFatturaPro({ aziendaId, commessaCode, commessaId, onClose, onCrea }: Props) {
  const [tipoDoc, setTipoDoc] = useState("TD01");
  const [cliente, setCliente] = useState("");
  const [piva, setPiva] = useState("");
  const [cf, setCf] = useState("");
  const [indirizzo, setIndirizzo] = useState("");
  const [email, setEmail] = useState("");
  const [codSdi, setCodSdi] = useState("0000000");
  const [commessa, setCommessa] = useState(commessaCode || "");
  const [dataEm, setDataEm] = useState(new Date().toISOString().split("T")[0]);
  const [dataScad, setDataScad] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
  const [modPag, setModPag] = useState("Bonifico bancario");
  const [percAcconto, setPercAcconto] = useState<number>(0);
  const [righe, setRighe] = useState<RigaFatturaPro[]>([]);
  const [ecobonus, setEcobonus] = useState("");
  const [scontoFattura, setScontoFattura] = useState(false);
  const [genDichForn, setGenDichForn] = useState(false);
  const [compatta, setCompatta] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calcoli
  const calc = useMemo(() => {
    // imponibili per aliquota
    const byIva = new Map<number, { imponibile: number; imposta: number }>();
    let valoreSerramenti = 0;
    let valoreServizi = 0;
    righe.forEach((r) => {
      const imp = +(r.quantita * r.prezzo_unitario * (1 - r.sconto_pct / 100)).toFixed(2);
      const iva = +(imp * r.iva_pct / 100).toFixed(2);
      const cur = byIva.get(r.iva_pct) || { imponibile: 0, imposta: 0 };
      cur.imponibile = +(cur.imponibile + imp).toFixed(2);
      cur.imposta = +(cur.imposta + iva).toFixed(2);
      byIva.set(r.iva_pct, cur);
      if (r.tipo === "serramento") valoreSerramenti += imp;
      else valoreServizi += imp;
    });
    const riepilogo = Array.from(byIva.entries())
      .map(([aliquota, v]) => ({ aliquota, imponibile: v.imponibile, imposta: v.imposta }))
      .sort((a, b) => b.aliquota - a.aliquota);
    const totImp = riepilogo.reduce((s, x) => s + x.imponibile, 0);
    const totIva = riepilogo.reduce((s, x) => s + x.imposta, 0);
    // Bollo €2 se imponibile > 77,47 e regime forfettario o esente
    const bollo = totImp > 77.47 ? 2 : 0;
    const totale = +(totImp + totIva + bollo).toFixed(2);
    // Regola beni significativi: servizi > bene → tutto al 10%
    const beneSign = {
      valore_bene: valoreSerramenti,
      valore_servizi: valoreServizi,
      regola_triggered: valoreServizi > valoreSerramenti,
    };
    return { riepilogo, totImp, totIva, bollo, totale, beneSign };
  }, [righe]);

  function addRiga(tipo: RigaTipo) {
    const meta = TIPI_META[tipo];
    setRighe((rs) => [...rs, {
      id: uid(),
      tipo,
      descrizione: "",
      quantita: 1,
      prezzo_unitario: 0,
      iva_pct: meta.iva,
      sconto_pct: 0,
    }]);
  }

  const valido = cliente.trim().length > 0 && righe.length > 0 && dataEm.length === 10;

  async function submit() {
    if (!valido || submitting) return;
    setSubmitting(true);
    try {
      await onCrea({
        tipo_documento_sdi: tipoDoc,
        cliente: cliente.trim(),
        cliente_piva: piva.trim() || undefined,
        cliente_cf: cf.trim() || undefined,
        cliente_indirizzo: indirizzo.trim() || undefined,
        cliente_email: email.trim() || undefined,
        cliente_sdi: codSdi.trim() || undefined,
        commessa_code: commessa.trim() || undefined,
        data_emissione: dataEm,
        data_scadenza: dataScad || undefined,
        modalita_pagamento: modPag,
        perc_acconto: percAcconto || undefined,
        righe,
        ecobonus_tipo: ecobonus || undefined,
        sconto_in_fattura: scontoFattura,
        genera_dichiarazione_fornitore: genDichForn,
        bollo: calc.bollo,
        causale_forfettario: "Operazione effettuata ai sensi dell'art.1 c.54-89 L.190/2014. Imposta non applicata.",
        riepilogo_iva: calc.riepilogo,
        bene_significativo_calc: calc.beneSign,
        totale_imponibile: calc.totImp,
        totale_iva: calc.totIva,
        totale: calc.totale,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,31,51,0.7)", zIndex: 10000, display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: BG_APP, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(40,160,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: TEAL }}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1={12} y1={18} x2={12} y2={12} /><line x1={9} y1={15} x2={15} y2={15} /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, letterSpacing: 1.2, color: TEAL, fontWeight: 700, textTransform: "uppercase" }}>Nuova fattura PRO</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginTop: 1 }}>Emetti fattura cliente</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} /></svg>
            </button>
          </div>
        </div>

        {/* Body scroll */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 90px" }}>

          {/* Tipo documento */}
          <Sez tit="Tipo documento">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
              {TIPI_DOC.map((t) => (
                <button key={t.v} onClick={() => setTipoDoc(t.v)} style={{
                  padding: "8px 4px", borderRadius: 7, fontFamily: "inherit",
                  background: tipoDoc === t.v ? TEAL : "#F1F4F7",
                  color: tipoDoc === t.v ? "#fff" : MUTED,
                  border: `1.5px solid ${tipoDoc === t.v ? TEAL_DARK : "transparent"}`,
                  fontSize: 9.5, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
                  textAlign: "center", lineHeight: 1.2,
                }}>
                  <div>{t.v}</div>
                  <div style={{ fontSize: 7.5, fontWeight: 700, opacity: 0.8, marginTop: 2 }}>{t.s}</div>
                </button>
              ))}
            </div>
          </Sez>

          <SezioneClienteCommessa
            cliente={cliente} setCliente={setCliente}
            piva={piva} setPiva={setPiva}
            cf={cf} setCf={setCf}
            indirizzo={indirizzo} setIndirizzo={setIndirizzo}
            email={email} setEmail={setEmail}
            codSdi={codSdi} setCodSdi={setCodSdi}
            commessa={commessa} setCommessa={setCommessa}
          />
          {/* Voci fattura */}
          <Sez tit={`Voci fattura · ${righe.length}`} right={
            <div style={{ display: "flex", gap: 2, background: "#F1F4F7", padding: 2, borderRadius: 7 }}>
              <button onClick={() => setCompatta(true)} style={vtBtn(compatta)}>Compatta</button>
              <button onClick={() => setCompatta(false)} style={vtBtn(!compatta)}>Dettaglio</button>
            </div>
          }>
            {righe.length === 0 && (
              <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11.5, fontStyle: "italic" }}>
                Nessuna voce. Aggiungi qui sotto.
              </div>
            )}
            {righe.map((r) => (
              <RigaFatturaProRow
                key={r.id}
                riga={r}
                modalitaCompatta={compatta}
                onChange={(nv) => setRighe((rs) => rs.map((x) => x.id === r.id ? nv : x))}
                onDelete={() => setRighe((rs) => rs.filter((x) => x.id !== r.id))}
              />
            ))}

            {/* Bottoni aggiungi tipologie */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5, marginTop: 6 }}>
              {([
                ["serramento", "+ SERR."],
                ["parte_staccata", "+ PARTE"],
                ["posa", "+ POSA"],
                ["opera_complementare", "+ OPERA"],
                ["spesa_professionale", "+ PROF."],
              ] as [RigaTipo, string][]).map(([t, l]) => (
                <button key={t} onClick={() => addRiga(t)} style={{
                  padding: "8px 4px", background: "#fff",
                  border: `1.5px dashed ${TEAL}`, borderRadius: 8,
                  color: TEAL_DARK, fontSize: 9, fontWeight: 800,
                  cursor: "pointer", letterSpacing: 0.2, textTransform: "uppercase",
                  fontFamily: "inherit",
                }}>{l}</button>
              ))}
            </div>
            <button onClick={() => addRiga("libera")} style={{
              marginTop: 8, padding: 11, width: "100%",
              border: `1.5px dashed ${TEAL}`, background: TEAL_SOFT, borderRadius: 9,
              color: TEAL_DARK, fontSize: 11, fontWeight: 800,
              letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer",
              fontFamily: "inherit",
            }}>+ Aggiungi voce libera</button>
          </Sez>

          {/* Alert bene significativo */}
          {calc.beneSign.valore_bene > 0 && (
            <div style={{
              padding: "9px 11px", borderRadius: 9, fontSize: 11, fontWeight: 600,
              marginBottom: 9, lineHeight: 1.4,
              background: calc.beneSign.regola_triggered ? "#FBF0DC" : "#E3EDF9",
              color: calc.beneSign.regola_triggered ? "#8B6926" : NAVY,
              borderLeft: `3px solid ${calc.beneSign.regola_triggered ? AMBER : "#2D5A8C"}`,
            }}>
              <b>Regola beni significativi:</b> bene €{calc.beneSign.valore_bene.toFixed(0)} · servizi €{calc.beneSign.valore_servizi.toFixed(0)}.
              {calc.beneSign.regola_triggered
                ? " Servizi superano bene → considera IVA 10% su tutto."
                : " IVA standard sulle righe."}
            </div>
          )}

          {/* Bonus */}
          <Sez tit="Bonus fiscali">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4, marginBottom: 8 }}>
              {ECOBONUS_OPT.map((e) => (
                <button key={e.v} onClick={() => setEcobonus(e.v)} style={{
                  padding: "7px 6px", borderRadius: 7, fontFamily: "inherit",
                  background: ecobonus === e.v ? TEAL : "#F1F4F7",
                  color: ecobonus === e.v ? "#fff" : MUTED,
                  border: `1px solid ${ecobonus === e.v ? TEAL_DARK : "transparent"}`,
                  fontSize: 10, fontWeight: 700, cursor: "pointer",
                }}>{e.l}</button>
              ))}
            </div>
            <Check label="Sconto in fattura (cessione credito)" value={scontoFattura} onChange={setScontoFattura} />
            <Check label="Genera dichiarazione fornitore (PDF)" value={genDichForn} onChange={setGenDichForn} />
          </Sez>

          {/* Riepilogo IVA */}
          <Sez tit="Riepilogo IVA">
            <div style={{ background: BG_SOFT, borderRadius: 9, padding: "9px 11px" }}>
              {calc.riepilogo.map((r) => (
                <React.Fragment key={r.aliquota}>
                  <RiepRow lbl={<><Tag pct={r.aliquota} />Imponibile</>} val={`€ ${r.imponibile.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`} />
                  <RiepRow lbl={<><Tag pct={r.aliquota} />Imposta</>} val={`€ ${r.imposta.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`} />
                </React.Fragment>
              ))}
              {calc.bollo > 0 && <RiepRow lbl={<span>Bollo</span>} val={`€ ${calc.bollo.toFixed(2)}`} />}
              <RiepRow lbl="TOTALE FATTURA" val={`€ ${calc.totale.toLocaleString("it-IT", { minimumFractionDigits: 2 })}`} big />
            </div>
          </Sez>

          {/* Pagamento */}
          <Sez tit="Pagamento">
            <Row2>
              <Field label="Data emissione *" value={dataEm} onChange={setDataEm} type="date" />
              <Field label="Data scadenza" value={dataScad} onChange={setDataScad} type="date" />
            </Row2>
            <Row2>
              <Field label="Modalità" value={modPag} onChange={setModPag} />
              <Field label="% Acconto" value={String(percAcconto)} onChange={(v) => setPercAcconto(Number(v) || 0)} type="number" />
            </Row2>
          </Sez>
        </div>

        {/* Footer */}
        <div style={{ background: "#fff", padding: "10px 12px", display: "flex", gap: 8, borderTop: `1px solid ${BORDER}`, boxShadow: "0 -4px 12px rgba(0,0,0,0.1)" }}>
          <button onClick={onClose} disabled={submitting} style={{
            flex: 1, padding: 11, borderRadius: 9, background: "#F1F4F7", color: MUTED, border: "none",
            fontSize: 12, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase", cursor: "pointer",
            fontFamily: "inherit",
          }}>Annulla</button>
          <button onClick={submit} disabled={!valido || submitting} style={{
            flex: 2, padding: 11, borderRadius: 9,
            background: valido ? TEAL : "#C8D2DE", color: "#fff", border: "none",
            fontSize: 12, fontWeight: 800, letterSpacing: 0.3, textTransform: "uppercase",
            cursor: valido ? "pointer" : "not-allowed", fontFamily: "inherit",
          }}>{submitting ? "Creazione..." : "Salva e invia SDI"}</button>
        </div>
      </div>
    </div>
  );
}
