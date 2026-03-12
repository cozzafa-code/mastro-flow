"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — PreventivoModal v2 (tab-based, clean UX)
// ═══════════════════════════════════════════════════════════
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FM, tipoToMinCat, TIPOLOGIE_RAPIDE } from "./mastro-constants";

export default function PreventivoModal() {
  const {
    T, S, PIPELINE,
    showPreventivoModal, setShowPreventivoModal,
    selectedCM, setSelectedCM, cantieri, setCantieri,
    selectedVano, setSelectedVano, vanoStep, setVanoStep,
    sistemiDB, vetriDB, coprifiliDB, lamiereDB,
    fattureDB, setFattureDB, montaggiDB, setMontaggiDB,
    ordiniFornDB, setOrdiniFornDB, squadreDB, problemi,
    showCalMontaggi, setShowCalMontaggi,
    calMontaggiTarget, setCalMontaggiTarget,
    showFirmaModal, setShowFirmaModal,
    calcolaTotaleCommessa, getVaniAttivi, setFaseTo,
    ORDINE_STATI, renderCalendarioMontaggi,
    ordineDetail, setOrdineDetail,
    generaPreventivoPDF, generaPDFMisure, creaFattura, generaFatturaPDF,
    inviaWhatsApp, inviaEmail, creaOrdineFornitore, ricalcolaOrdine, updateOrdine,
    calcolaScadenzaPagamento, generaOrdinePDF, generaConfermaFirmataPDF,
    inviaOrdineFornitore, creaMontaggio, generaTrackingCliente,
    aziendaInfo,
  } = useMastro();

  if (!showPreventivoModal || !selectedCM) return null;
  const c = selectedCM;
  const updateCMp = (field, val) => {
    setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
    setSelectedCM(p => ({ ...p, [field]: val }));
  };

  // Tab state
  const [tab, setTab] = useState<"preventivo"|"produzione"|"fatture"|"montaggio">("preventivo");

  // Modal importo fattura
  const [fatturaModal, setFatturaModal] = useState<{tipo:string,importo:string}|null>(null);
  const totCommessa = calcolaTotaleCommessa(c);
  const apriModalFattura = (tipo: string) => {
    const giaPagato = fattureDB.filter(f => f.cmId === c.id).reduce((s, f) => s + (f.importo || 0), 0);
    const suggerito = tipo === "acconto"
      ? Math.round(totCommessa * 0.3).toString()
      : tipo === "saldo"
        ? Math.round(totCommessa - giaPagato).toString()
        : Math.round(totCommessa).toString();
    setFatturaModal({ tipo, importo: suggerito });
  };
  const confermaFattura = () => {
    if (!fatturaModal) return;
    const importo = parseFloat(fatturaModal.importo);
    if (!importo || importo <= 0) return;
    const f = creaFattura(c, fatturaModal.tipo, importo);
    generaFatturaPDF(f);
    setFatturaModal(null);
  };

  // Calcoli preventivo
  const vaniAttivi = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []).filter((v: any) => !v.eliminato);
  const calcolaVano = (v) => {
    const m = v.misure || {}; const lc = (m.lCentro || 0) / 1000, hc = (m.hCentro || 0) / 1000;
    const mq = lc * hc; const settore = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.settore || "serramenti";
    if (settore !== "serramenti" && settore !== "persiane" && settore !== "tapparelle" && settore !== "zanzariere" && settore !== "tendesole") {
      return { tot: v.prezzoManuale ?? 0, mq, sysRec: null, settore };
    }
    const sysRec = sistemiDB.find(s => (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema);
    const minCat = tipoToMinCat(v.tipo || "F1A");
    const minimoMq = sysRec?.minimiMq?.[minCat] || 0;
    const mqCalc = (minimoMq > 0 && mq > 0 && mq < minimoMq) ? minimoMq : mq;
    const prezzoMq = sysRec ? (sysRec.prezzi?.[minCat] || 0) : 0;
    const tot = prezzoMq * mqCalc * (v.pezzi || 1);
    return { tot, mq, sysRec, settore };
  };
  const vaniCalc = vaniAttivi.map(v => ({ ...v, calc: calcolaVano(v) }));
  const totale = vaniCalc.reduce((s, v) => s + v.calc.tot, 0);
  const scontoVal = totale * parseFloat(c.sconto || 0) / 100;
  const imponibile = totale - scontoVal;
  const iva = imponibile * 0.10;
  const totIva = imponibile + iva;

  // Blocchi
  const vaniSenzaSistema = vaniCalc.filter(v => !v.calc.sysRec && !v.sistema && v.calc.settore === "serramenti");
  const vaniSenzaMisure = vaniCalc.filter(v => !(v.misure?.lCentro) || !(v.misure?.hCentro));
  const vaniNonConfermati = vaniCalc.filter(v => (v.statoMisure || "provvisorie") !== "confermate");
  const bloccatoPerMisure = vaniNonConfermati.length > 0;
  const dtConf = aziendaInfo?.disegnoTecnico || {};
  const DISEGNO_DEFAULT: Record<string, boolean> = { serramenti: true, fabbro: true, pergole: true, porte: false, zanzariere: false, tendaggi: false, tapparelle: false };
  const vaniSenzaDisegno = vaniCalc.filter(v => {
    const settore = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.settore || "serramenti";
    const obb = settore in dtConf ? dtConf[settore] : (DISEGNO_DEFAULT[settore] ?? false);
    if (!obb) return false;
    return !(v.disegno && (v.disegno.pagine?.length > 0 || v.disegno.paths?.length > 0)) && !v.pdfFornitore;
  });
  const bloccatoPerDisegno = vaniSenzaDisegno.length > 0;
  const bloccato = bloccatoPerMisure || bloccatoPerDisegno;
  const hasWarnings = vaniSenzaSistema.length > 0 || vaniSenzaMisure.length > 0;

  // Badge fatture
  const fattureCommessa = fattureDB.filter(f => f.cmId === c.id);
  const ordiniCommessa = ordiniFornDB.filter(o => o.cmId === c.id);
  const montaggiCommessa = montaggiDB.filter(m => m.cmId === c.id);
  const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";

  const TABS = [
    { id: "preventivo", ico: "📄", label: "Preventivo", badge: bloccato ? "🔒" : null },
    { id: "produzione", ico: "🏭", label: "Produzione", badge: c.trackingStato ? "●" : null },
    { id: "fatture", ico: "💰", label: "Fatture", badge: fattureCommessa.length > 0 ? fattureCommessa.length.toString() : null },
    { id: "montaggio", ico: "🔧", label: "Montaggio", badge: montaggiCommessa.length > 0 ? montaggiCommessa.length.toString() : null },
  ] as const;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && setShowPreventivoModal(false)}>
      <div style={{ background: T.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "92vh", display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{c.code} — {c.cliente} {c.cognome || ""}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>€{totIva.toFixed(2)} <span style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>IVA inclusa</span></div>
          </div>
          <div onClick={() => setShowPreventivoModal(false)}
            style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: T.sub }}>✕</div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: "flex", gap: 0, padding: "10px 16px 0", flexShrink: 0, borderBottom: `1px solid ${T.bdr}` }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id as any)}
              style={{ flex: 1, textAlign: "center", padding: "8px 4px", cursor: "pointer", borderBottom: tab === t.id ? `2.5px solid ${T.acc}` : "2.5px solid transparent", position: "relative" }}>
              <div style={{ fontSize: 16 }}>{t.ico}</div>
              <div style={{ fontSize: 9, fontWeight: tab === t.id ? 800 : 500, color: tab === t.id ? T.acc : T.sub }}>{t.label}</div>
              {t.badge && (
                <div style={{ position: "absolute", top: 4, right: 8, minWidth: 16, height: 16, borderRadius: 8, background: t.badge === "🔒" ? "#DC4444" : T.acc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", padding: "0 3px" }}>
                  {t.badge}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Contenuto scrollabile ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 24px" }}>

          {/* ════════════════════════════════ TAB: PREVENTIVO ══ */}
          {tab === "preventivo" && <>

            {/* Blocchi critici in cima */}
            {bloccatoPerMisure && (
              <div style={{ background: "#DC444410", border: "1.5px solid #DC444440", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#DC4444", marginBottom: 6 }}>🔒 Misure non confermate</div>
                {vaniNonConfermati.map(v => (
                  <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#DC4444", padding: "3px 0" }}>
                    <span>• {v.nome} — {v.statoMisure === "da_rivedere" ? "⚠️ Da rivedere" : "✏️ Provvisorie"}</span>
                    <span onClick={() => { setShowPreventivoModal(false); setSelectedVano(v); setVanoStep(0); }} style={{ color: "#007aff", fontWeight: 700, cursor: "pointer" }}>Vai →</span>
                  </div>
                ))}
              </div>
            )}
            {bloccatoPerDisegno && (
              <div style={{ background: "#3B7FE010", border: "1.5px solid #3B7FE040", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#3B7FE0", marginBottom: 6 }}>📐 Disegno tecnico mancante</div>
                {vaniSenzaDisegno.map(v => (
                  <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "#3B7FE0", padding: "3px 0" }}>
                    <span>• {v.nome} — {TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo}</span>
                    <span onClick={() => { setShowPreventivoModal(false); setSelectedVano(v); setVanoStep(1); }} style={{ color: "#007aff", fontWeight: 700, cursor: "pointer" }}>Disegna →</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sconto + Note */}
            <div style={{ background: T.bg, borderRadius: 12, padding: 12, marginBottom: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}>SCONTO %</div>
                <input type="number" value={c.sconto || 0} onChange={e => updateCMp("sconto", e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 15, fontWeight: 700, textAlign: "right", boxSizing: "border-box", background: T.card, color: T.text }} />
              </div>
              <div style={{ gridColumn: "1/3" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}>NOTE / CONDIZIONI</div>
                <textarea value={c.notePreventivo || ""} onChange={e => updateCMp("notePreventivo", e.target.value)}
                  placeholder="Condizioni, garanzie, tempi consegna..." rows={2}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, resize: "none", boxSizing: "border-box", fontFamily: "inherit", background: T.card, color: T.text }} />
              </div>
            </div>

            {/* Voci */}
            <div style={{ background: T.bg, borderRadius: 12, marginBottom: 10, overflow: "hidden" }}>
              <div style={{ padding: "10px 12px 6px", fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Voci commessa</div>
              {vaniCalc.length === 0
                ? <div style={{ fontSize: 12, color: T.sub, textAlign: "center", padding: 16 }}>Nessun vano</div>
                : vaniCalc.map((v, i) => (
                  <div key={v.id} style={{ padding: "8px 12px", borderTop: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v.nome || "Vano " + (i + 1)}
                        {v.calc.tot === 0 && v.calc.settore === "serramenti" && <span style={{ marginLeft: 6, fontSize: 8, background: "#DC4444", color: "#fff", padding: "1px 5px", borderRadius: 3 }}>MANCA SISTEMA</span>}
                      </div>
                      <div style={{ fontSize: 10, color: T.sub }}>{v.tipo} · {v.misure?.lCentro || 0}×{v.misure?.hCentro || 0} mm · {v.calc.mq.toFixed(2)} mq · ×{v.pezzi || 1}</div>
                      {v.calc.sysRec && <div style={{ fontSize: 9, color: "#007aff", marginTop: 2 }}>{v.sistema}</div>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: v.calc.tot === 0 ? "#DC4444" : T.text }}>€{v.calc.tot.toFixed(0)}</div>
                  </div>
                ))
              }
            </div>

            {/* Totale */}
            <div style={{ background: T.bg, borderRadius: 12, padding: 14, marginBottom: 14 }}>
              {parseFloat(c.sconto || 0) > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ff9500", marginBottom: 4 }}><span>Sconto {c.sconto}%</span><span>− €{scontoVal.toFixed(2)}</span></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 4 }}><span>Imponibile</span><span>€{imponibile.toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 10 }}><span>IVA 10%</span><span>€{iva.toFixed(2)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 900, paddingTop: 10, borderTop: `2px solid ${T.text}` }}>
                <span>TOTALE</span><span style={{ color: T.acc }}>€{totIva.toFixed(2)}</span>
              </div>
            </div>

            {/* Firma cliente */}
            {c.firmaCliente
              ? <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 14, border: "1.5px solid #34c759", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span>✅</span><span style={{ fontSize: 12, fontWeight: 700, color: "#1a9e40" }}>Firmato {c.dataFirma}</span>
                  <div onClick={() => { setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, firmaCliente: null, dataFirma: null } : x)); setSelectedCM(p => ({ ...p, firmaCliente: null, dataFirma: null })); }}
                    style={{ marginLeft: "auto", fontSize: 11, color: "#ff3b30", cursor: "pointer" }}>✕ Rimuovi</div>
                </div>
                <img src={c.firmaCliente} style={{ width: "100%", maxHeight: 70, objectFit: "contain", background: "#fff", borderRadius: 8 }} alt="" />
              </div>
              : <button onClick={() => { setShowPreventivoModal(false); setShowFirmaModal(true); }}
                style={{ width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid #34c759", background: "#f0fdf4", color: "#1a9e40", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                ✍️ Firma cliente sul telefono
              </button>
            }

            {/* CTA principale */}
            <button onClick={() => { if (!bloccato) generaPreventivoPDF(c); }}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", fontFamily: "inherit", cursor: bloccato ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 8,
                background: bloccato ? "linear-gradient(135deg,#DC4444,#b83030)" : hasWarnings ? "#8e8e93" : "linear-gradient(135deg,#007aff,#0055cc)",
                boxShadow: (!bloccato && !hasWarnings) ? "0 4px 16px rgba(0,122,255,0.35)" : "none",
                opacity: bloccato ? 0.85 : 1 }}>
              {bloccatoPerMisure ? "🔒 Conferma le misure prima" : bloccatoPerDisegno ? "📐 Disegno tecnico mancante" : hasWarnings ? "⚠️ Genera PDF (dati incompleti)" : "📄 Genera & Scarica PDF"}
            </button>

            {/* Azioni secondarie */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button onClick={() => generaPDFMisure(c)}
                style={{ flex: 1, padding: 11, borderRadius: 10, border: "1.5px solid #5856d6", background: "#5856d615", color: "#5856d6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📐 PDF Misure
              </button>
              <button onClick={() => {
                const upd = { ...c, confermato: true, dataConferma: new Date().toLocaleDateString("it-IT"), stato: "conferma" };
                setCantieri(cs => cs.map(x => x.id === c.id ? upd : x)); setSelectedCM(upd);
              }} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1.5px solid ${c.confermato ? "#34c759" : "#af52de"}`, background: c.confermato ? "#34c75915" : "#af52de15", color: c.confermato ? "#34c759" : "#af52de", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {c.confermato ? `✅ Confermato` : "✍️ Conferma ordine"}
              </button>
            </div>

            {/* Invio */}
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => inviaWhatsApp(c, c.confermato ? "conferma" : "preventivo")}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #25d366", background: "#25d36615", color: "#25d366", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                💬 WhatsApp
              </button>
              <button onClick={() => inviaEmail(c, c.confermato ? "conferma" : "preventivo")}
                style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #007aff", background: "#007aff15", color: "#007aff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📧 Email
              </button>
            </div>
          </>}

          {/* ════════════════════════════════ TAB: PRODUZIONE ══ */}
          {tab === "produzione" && <>

            {/* Tracking */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 10, textTransform: "uppercase" }}>Stato produzione</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[
                  { id: "ordinato", l: "Ordinato", ico: "📦", c: "#ff9500" },
                  { id: "produzione", l: "In Prod.", ico: "🏭", c: "#5856d6" },
                  { id: "pronto", l: "Pronto", ico: "✅", c: "#34c759" },
                  { id: "consegnato", l: "Consegnato", ico: "🚛", c: "#007aff" },
                  { id: "montato", l: "Montato", ico: "🔧", c: "#30b0c7" },
                ].map((st, i) => {
                  const steps = ["ordinato", "produzione", "pronto", "consegnato", "montato"];
                  const curIdx = steps.indexOf(c.trackingStato || "");
                  const stIdx = steps.indexOf(st.id);
                  const isActive = stIdx <= curIdx;
                  const isCurrent = st.id === c.trackingStato;
                  return (
                    <div key={st.id} onClick={() => {
                      const upd = { ...c, trackingStato: st.id, [`tracking_${st.id}_data`]: new Date().toLocaleDateString("it-IT") };
                      setCantieri(cs => cs.map(x => x.id === c.id ? upd : x)); setSelectedCM(upd);
                    }} style={{ flex: 1, padding: "10px 2px", borderRadius: 8, textAlign: "center", cursor: "pointer", background: isActive ? st.c + "20" : T.bg, border: `1.5px solid ${isCurrent ? st.c : isActive ? st.c + "40" : T.bdr}` }}>
                      <div style={{ fontSize: 18 }}>{st.ico}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: isActive ? st.c : T.sub, marginTop: 2 }}>{st.l}</div>
                      {isActive && c[`tracking_${st.id}_data`] && <div style={{ fontSize: 7, color: st.c + "99" }}>{c[`tracking_${st.id}_data`]}</div>}
                    </div>
                  );
                })}
              </div>
              {c.trackingStato && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.sub }}>
                  <span>Data prevista consegna:</span>
                  <input type="date" value={c.dataPrevConsegna || ""} onChange={e => {
                    const upd = { ...c, dataPrevConsegna: e.target.value };
                    setCantieri(cs => cs.map(x => x.id === c.id ? upd : x)); setSelectedCM(upd);
                  }} style={{ padding: "4px 8px", fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.bg, color: T.text }} />
                </div>
              )}
            </div>

            {/* Invio stato */}
            {c.trackingStato && (
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <button onClick={() => inviaWhatsApp(c, "stato")}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #25d366", background: "#25d36615", color: "#25d366", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  💬 Invia aggiornamento
                </button>
                <button onClick={() => generaTrackingCliente(c)}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #5856d6", background: "#5856d615", color: "#5856d6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  📱 Pagina tracking
                </button>
              </div>
            )}

            {/* Ordini fornitore */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>📦 Ordini Fornitore</div>
              <button onClick={() => { const ord = creaOrdineFornitore(c); setOrdineDetail(ord.id); }}
                style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #ff2d55", background: "#ff2d5515", color: "#ff2d55", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                + Nuovo Ordine
              </button>
            </div>

            {ordiniCommessa.length === 0
              ? <div style={{ fontSize: 11, color: T.sub, textAlign: "center", padding: 20, background: T.bg, borderRadius: 10 }}>Nessun ordine fornitore</div>
              : ordiniCommessa.map(o => {
                const st = ORDINE_STATI.find(s => s.id === o.stato) || ORDINE_STATI[0];
                const isOpen = ordineDetail === o.id;
                const isLate = o.consegna?.prevista && new Date(o.consegna.prevista) < new Date() && o.stato !== "consegnato";
                return (
                  <div key={o.id} style={{ marginBottom: 8 }}>
                    <div onClick={() => setOrdineDetail(isOpen ? null : o.id)}
                      style={{ padding: "12px 14px", borderRadius: 10, cursor: "pointer", background: T.bg, border: `1.5px solid ${isLate ? "#ff3b30" : st.color}30` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{st.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700 }}>{o.fornitore?.nome || "Fornitore da inserire"} <span style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>N.{o.numero}/{o.anno}</span></div>
                            <div style={{ fontSize: 9, color: T.sub }}>{new Date(o.dataOrdine).toLocaleDateString("it-IT")} · {o.righe?.length || 0} articoli · €{fmt(o.totaleIva || 0)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700, background: st.color + "20", color: st.color }}>{st.label}</span>
                          <span style={{ fontSize: 12, color: T.sub, transform: isOpen ? "rotate(180deg)" : "none", transition: "all .2s" }}>▼</span>
                        </div>
                      </div>
                      {isLate && <div style={{ fontSize: 9, color: "#ff3b30", fontWeight: 700, marginTop: 4 }}>⚠️ Consegna in ritardo — Prevista: {new Date(o.consegna.prevista).toLocaleDateString("it-IT")}</div>}
                    </div>

                    {isOpen && (
                      <div style={{ marginTop: 4, padding: 12, background: T.bg, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
                        {/* Fornitore */}
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#ff2d55", marginBottom: 6, textTransform: "uppercase" }}>Fornitore</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
                          <input value={o.fornitore?.nome || ""} onChange={e => updateOrdine(o.id, "fornitore.nome", e.target.value)} placeholder="Nome fornitore" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit", gridColumn: "1/3", background: T.card, color: T.text }} />
                          <input value={o.fornitore?.referente || ""} onChange={e => updateOrdine(o.id, "fornitore.referente", e.target.value)} placeholder="Referente" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit", background: T.card, color: T.text }} />
                          <input value={o.fornitore?.tel || ""} onChange={e => updateOrdine(o.id, "fornitore.tel", e.target.value)} placeholder="Telefono" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card, color: T.text }} />
                          <input value={o.fornitore?.email || ""} onChange={e => updateOrdine(o.id, "fornitore.email", e.target.value)} placeholder="Email" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card, color: T.text }} />
                        </div>

                        {/* Articoli */}
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700, color: "#ff2d55", marginBottom: 6, textTransform: "uppercase" }}>
                          <span>Articoli</span>
                          <span onClick={() => { const r = { id: "r_" + Math.random().toString(36).slice(2, 8), desc: "", misure: "", qta: 1, prezzoUnit: 0, totale: 0 }; updateOrdine(o.id, "righe", [...(o.righe || []), r]); }} style={{ color: "#007aff", cursor: "pointer" }}>+ Aggiungi</span>
                        </div>
                        {(o.righe || []).map((r, ri) => (
                          <div key={r.id} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 9, color: T.sub, width: 14 }}>{ri + 1}</span>
                            <input value={r.desc} onChange={e => { const rr = [...o.righe]; rr[ri] = { ...rr[ri], desc: e.target.value }; updateOrdine(o.id, "righe", rr); }} placeholder="Descrizione" style={{ flex: 2, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, fontFamily: "inherit", background: T.card, color: T.text }} />
                            <input value={r.misure} onChange={e => { const rr = [...o.righe]; rr[ri] = { ...rr[ri], misure: e.target.value }; updateOrdine(o.id, "righe", rr); }} placeholder="LxH" style={{ width: 50, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, background: T.card, color: T.text }} />
                            <input type="number" value={r.qta || ""} onChange={e => { const rr = [...o.righe]; rr[ri] = { ...rr[ri], qta: parseInt(e.target.value) || 0 }; updateOrdine(o.id, "righe", rr); }} placeholder="Q" style={{ width: 30, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "center", background: T.card, color: T.text }} />
                            <input type="number" value={r.prezzoUnit || ""} onChange={e => { const rr = [...o.righe]; rr[ri] = { ...rr[ri], prezzoUnit: parseFloat(e.target.value) || 0 }; updateOrdine(o.id, "righe", rr); setTimeout(() => ricalcolaOrdine(o.id), 50); }} placeholder="€" style={{ width: 50, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "right", background: T.card, color: T.text }} />
                            <span style={{ fontSize: 9, fontWeight: 700, width: 50, textAlign: "right" }}>€{fmt(r.qta * r.prezzoUnit)}</span>
                            <span onClick={() => { const rr = o.righe.filter((_, i) => i !== ri); updateOrdine(o.id, "righe", rr); setTimeout(() => ricalcolaOrdine(o.id), 50); }} style={{ fontSize: 12, cursor: "pointer", color: T.red }}>✕</span>
                          </div>
                        ))}
                        <div style={{ textAlign: "right", fontSize: 13, fontWeight: 800, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.bdr}` }}>TOTALE €{fmt(o.totaleIva || 0)}</div>

                        {/* Consegna */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 12, marginBottom: 10 }}>
                          <div><div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>Consegna prevista</div><input type="date" value={o.consegna?.prevista || ""} onChange={e => updateOrdine(o.id, "consegna.prevista", e.target.value)} style={{ width: "100%", padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card, color: T.text }} /></div>
                          <div><div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>Consegna effettiva</div><input type="date" value={o.consegna?.effettiva || ""} onChange={e => { updateOrdine(o.id, "consegna.effettiva", e.target.value); if (e.target.value) updateOrdine(o.id, "stato", "consegnato"); }} style={{ width: "100%", padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card, color: T.text }} /></div>
                        </div>

                        {/* Azioni ordine */}
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => generaOrdinePDF(o)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "1.5px solid #007aff", background: "#007aff15", color: "#007aff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📄 PDF</button>
                          <button onClick={() => inviaOrdineFornitore(o, "email")} style={{ padding: 8, borderRadius: 8, border: "1.5px solid #5856d6", background: "#5856d615", color: "#5856d6", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📧</button>
                          <button onClick={() => inviaOrdineFornitore(o, "whatsapp")} style={{ padding: 8, borderRadius: 8, border: "1.5px solid #25d366", background: "#25d36615", color: "#25d366", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>💬</button>
                          <button onClick={() => { if (confirm("Eliminare ordine?")) setOrdiniFornDB(prev => prev.filter(x => x.id !== o.id)); }} style={{ padding: 8, borderRadius: 8, border: "1.5px solid #ff3b30", background: "#ff3b3015", color: "#ff3b30", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                        </div>
                        {(() => { const m = totCommessa - (o.totale || 0); const p = totCommessa > 0 ? Math.round(m / totCommessa * 100) : 0; return o.totale > 0 ? <div style={{ marginTop: 8, padding: 8, background: m > 0 ? "#34c75910" : "#ff3b3010", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700 }}><span style={{ color: T.sub }}>Margine</span><span style={{ color: m > 0 ? "#34c759" : "#ff3b30" }}>€{fmt(m)} ({p}%)</span></div> : null; })()}
                      </div>
                    )}
                  </div>
                );
              })
            }
          </>}

          {/* ════════════════════════════════ TAB: FATTURE ══ */}
          {tab === "fatture" && <>
            {/* Emetti fattura */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[{ tipo: "acconto", label: "+ Acconto", c: "#ff9500" }, { tipo: "saldo", label: "+ Saldo", c: "#34c759" }, { tipo: "unica", label: "+ Unica", c: "#007aff" }].map(b => (
                <button key={b.tipo} onClick={() => apriModalFattura(b.tipo)}
                  style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${b.c}`, background: b.c + "15", color: b.c, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {b.label}
                </button>
              ))}
            </div>

            {/* Lista fatture */}
            {fattureCommessa.length === 0
              ? <div style={{ fontSize: 12, color: T.sub, textAlign: "center", padding: 24, background: T.bg, borderRadius: 12 }}>Nessuna fattura emessa</div>
              : fattureCommessa.map(f => (
                <div key={f.id} style={{ background: T.bg, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800 }}>N.{f.numero}/{f.anno} · {f.tipo.toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{f.dataISO ? new Date(f.dataISO + "T12:00:00").toLocaleDateString("it-IT") : f.data} · Scad: {f.scadenza ? new Date(f.scadenza + "T12:00:00").toLocaleDateString("it-IT") : "—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: f.pagata ? "#34c759" : T.text }}>€{f.importo?.toLocaleString("it-IT") || 0}</span>
                    <div onClick={() => setFattureDB(prev => prev.map(x => x.id === f.id ? { ...x, pagata: !x.pagata, dataPagamento: !x.pagata ? new Date().toLocaleDateString("it-IT") : null } : x))}
                      style={{ padding: "4px 10px", borderRadius: 6, background: f.pagata ? "#34c75920" : "#ff3b3020", color: f.pagata ? "#34c759" : "#ff3b30", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                      {f.pagata ? "✅ Pagata" : "⏳ Da pagare"}
                    </div>
                    <div onClick={() => generaFatturaPDF(f)} style={{ fontSize: 18, cursor: "pointer" }}>📄</div>
                  </div>
                </div>
              ))
            }

            {/* Riepilogo incassi */}
            {fattureCommessa.length > 0 && (() => {
              const incassato = fattureCommessa.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
              const daIncassare = fattureCommessa.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
              return (
                <div style={{ background: T.bg, borderRadius: 12, padding: 14, marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span style={{ color: T.sub }}>Incassato</span><span style={{ color: "#34c759", fontWeight: 700 }}>€{incassato.toLocaleString("it-IT")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span style={{ color: T.sub }}>Da incassare</span><span style={{ color: "#ff9500", fontWeight: 700 }}>€{daIncassare.toLocaleString("it-IT")}</span></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800, paddingTop: 8, borderTop: `1px solid ${T.bdr}` }}><span>Totale fatturato</span><span>€{(incassato + daIncassare).toLocaleString("it-IT")}</span></div>
                </div>
              );
            })()}

            {/* Dati fiscali */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}>🏛 Dati fiscali cliente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[["cf", "Codice Fiscale"], ["piva", "P.IVA"], ["sdi", "Codice SDI"], ["pec", "PEC"], ["email", "Email"]].map(([field, label]) => (
                  <div key={field}>
                    <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>{label}</div>
                    <input style={{ ...S.input, fontSize: 11, padding: "6px 8px", width: "100%", boxSizing: "border-box" }} placeholder={label} value={c[field] || ""} onChange={e => { const upd = { ...c, [field]: e.target.value }; setCantieri(cs => cs.map(x => x.id === c.id ? upd : x)); setSelectedCM(upd); }} />
                  </div>
                ))}
              </div>
            </div>
          </>}

          {/* ════════════════════════════════ TAB: MONTAGGIO ══ */}
          {tab === "montaggio" && <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Pianificazione</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => { const m = creaMontaggio(c); setCalMontaggiTarget(m.id); setShowCalMontaggi(true); }}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #30b0c7", background: "#30b0c715", color: "#30b0c7", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Pianifica</button>
                <button onClick={() => { setCalMontaggiTarget(null); setShowCalMontaggi(!showCalMontaggi); }}
                  style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: showCalMontaggi ? T.acc + "15" : "transparent", color: showCalMontaggi ? T.acc : T.sub, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📅 Calendario</button>
              </div>
            </div>

            {showCalMontaggi && (
              <div style={{ marginBottom: 14 }}>
                {calMontaggiTarget && <div style={{ fontSize: 11, color: T.acc, fontWeight: 600, marginBottom: 8, textAlign: "center" }}>👆 Clicca su uno slot per assegnare data e squadra</div>}
                {renderCalendarioMontaggi(calMontaggiTarget || undefined)}
              </div>
            )}

            {montaggiCommessa.length === 0
              ? <div style={{ fontSize: 12, color: T.sub, textAlign: "center", padding: 24, background: T.bg, borderRadius: 12 }}>Nessun montaggio pianificato</div>
              : montaggiCommessa.map(m => {
                const sq = squadreDB.find(s => s.id === m.squadraId);
                return (
                  <div key={m.id} style={{ background: T.bg, borderRadius: 12, padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      <select value={m.squadraId} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, squadraId: e.target.value } : x))} style={{ ...S.select, flex: 1 }}>
                        {squadreDB.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                      </select>
                      <select value={m.durata} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, durata: e.target.value } : x))} style={{ ...S.select, width: 110 }}>
                        <option value="mezza">½ giornata</option>
                        <option value="giornata">1 giornata</option>
                        <option value="2giorni">2 giorni</option>
                        <option value="3giorni">3 giorni</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="date" value={m.data} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, data: e.target.value } : x))} style={{ flex: 1, padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card, color: T.text }} />
                      <input type="time" value={m.oraInizio} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, oraInizio: e.target.value } : x))} style={{ width: 80, padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card, color: T.text }} />
                      <div onClick={() => { const s = m.stato === "pianificato" ? "in_corso" : m.stato === "in_corso" ? "completato" : "pianificato"; setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, stato: s } : x)); }}
                        style={{ padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 9, fontWeight: 700, background: m.stato === "completato" ? "#34c75920" : m.stato === "in_corso" ? "#ff950020" : T.card, color: m.stato === "completato" ? "#34c759" : m.stato === "in_corso" ? "#ff9500" : T.sub, border: `1px solid ${m.stato === "completato" ? "#34c759" : m.stato === "in_corso" ? "#ff9500" : T.bdr}` }}>
                        {m.stato === "completato" ? "✅ Fatto" : m.stato === "in_corso" ? "🔧 In corso" : "📅 Pianif."}
                      </div>
                      <div onClick={() => setMontaggiDB(prev => prev.filter(x => x.id !== m.id))} style={{ fontSize: 14, cursor: "pointer", color: T.red }}>🗑</div>
                    </div>
                    {sq && <div style={{ fontSize: 10, color: sq.colore, fontWeight: 600, marginTop: 6 }}>👷 {sq.nome}: {sq.membri?.join(", ")}</div>}
                    {m.data && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>📅 {new Date(m.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} ore {m.oraInizio}</div>}
                  </div>
                );
              })
            }
          </>}

        </div>
      </div>

      {/* ── Modal importo fattura ── */}
      {fatturaModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={e => e.target === e.currentTarget && setFatturaModal(null)}>
          <div style={{ background: T.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 340, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              {fatturaModal.tipo === "acconto" ? "💰 Fattura Acconto" : fatturaModal.tipo === "saldo" ? "✅ Fattura Saldo" : "🧾 Fattura Unica"}
            </div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 20 }}>Totale commessa: <b style={{ color: T.text }}>€{Math.round(totCommessa).toLocaleString("it-IT")}</b></div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Importo (€)</div>
            <input type="number" autoFocus value={fatturaModal.importo}
              onChange={e => setFatturaModal(f => f ? { ...f, importo: e.target.value } : null)}
              onKeyDown={e => e.key === "Enter" && confermaFattura()}
              style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: `2px solid ${T.acc}`, fontSize: 24, fontWeight: 800, textAlign: "right", boxSizing: "border-box", fontFamily: FM, background: T.bg, color: T.text, marginBottom: 16 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setFatturaModal(null)} style={{ flex: 1, padding: 14, borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.bg, color: T.sub, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
              <button onClick={confermaFattura} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: fatturaModal.tipo === "acconto" ? "#ff9500" : fatturaModal.tipo === "saldo" ? "#34c759" : "#007aff", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                📄 Genera PDF
              </button>
            </div>
          </div>
        </div>
      )}
    );
}
