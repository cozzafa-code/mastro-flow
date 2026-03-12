"use client";
// @ts-nocheck
// MASTRO ERP — PreventivoModal v3 (anteprima focalizzata)
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FM, tipoToMinCat, TIPOLOGIE_RAPIDE } from "./mastro-constants";

export default function PreventivoModal() {
  const {
    T, S,
    showPreventivoModal, setShowPreventivoModal,
    selectedCM, setSelectedCM, cantieri, setCantieri,
    setSelectedVano, setVanoStep,
    sistemiDB, aziendaInfo,
    showFirmaModal, setShowFirmaModal,
    calcolaTotaleCommessa, setFaseTo,
    generaPreventivoPDF, generaPDFMisure,
    inviaWhatsApp, inviaEmail,
    generaPreventivoCondivisibile,
  } = useMastro();

  if (!showPreventivoModal || !selectedCM) return null;
  const c = selectedCM;
  const updCM = (field, val) => {
    setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
    setSelectedCM(p => ({ ...p, [field]: val }));
  };

  // Calcoli
  const vaniAttivi = (c.rilievi?.[0]?.vani || c.vani || []).filter((v: any) => !v.eliminato);
  const calcolaVano = (v) => {
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000, hc = (m.hCentro || 0) / 1000;
    const mq = lc * hc;
    const settore = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.settore || "serramenti";
    if (!["serramenti","persiane","tapparelle","zanzariere","tendesole"].includes(settore)) {
      return { tot: (v.prezzoManuale ?? 0) * (v.pezzi || 1), mq, sistema: null };
    }
    const sysRec = sistemiDB.find(s => (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema);
    const minCat = tipoToMinCat(v.tipo || "F1A");
    const minimoMq = sysRec?.minimiMq?.[minCat] || 0;
    const mqCalc = (minimoMq > 0 && mq > 0 && mq < minimoMq) ? minimoMq : mq;
    const prezzoMq = sysRec?.prezzi?.[minCat] || 0;
    return { tot: prezzoMq * mqCalc * (v.pezzi || 1), mq, sistema: sysRec };
  };
  const vaniCalc = vaniAttivi.map(v => ({ ...v, calc: calcolaVano(v) }));
  const subtot = vaniCalc.reduce((s, v) => s + v.calc.tot, 0);
  const scontoVal = subtot * parseFloat(c.sconto || 0) / 100;
  const imponibile = subtot - scontoVal;
  const ivaPerc = c.ivaPerc || 10;
  const ivaAmt = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaAmt;
  const fmt = (n: number) => n.toFixed(2).replace(".", ",");

  // Blocchi
  const vaniNonConf = vaniCalc.filter(v => (v.statoMisure || "provvisorie") !== "confermate");
  const bloccatoMisure = vaniNonConf.length > 0;
  const dtConf = aziendaInfo?.disegnoTecnico || {};
  const DT_DEFAULT: Record<string, boolean> = { serramenti: true, fabbro: true, pergole: true, porte: false, zanzariere: false, tendaggi: false, tapparelle: false };
  const vaniSenzaDT = vaniCalc.filter(v => {
    const settore = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.settore || "serramenti";
    const obb = settore in dtConf ? dtConf[settore] : (DT_DEFAULT[settore] ?? false);
    if (!obb) return false;
    return !(v.disegno && (v.disegno.pagine?.length > 0 || v.disegno.paths?.length > 0)) && !v.pdfFornitore;
  });
  const bloccatoDT = vaniSenzaDT.length > 0;
  const bloccato = bloccatoMisure || bloccatoDT;

  // Fase pipeline
  const faseIndex = (f) => ["sopralluogo","preventivo","conferma","ordini","produzione","posa","collaudo","chiusura"].indexOf(f);
  const puo_avanzare = c.preventivoInviato && faseIndex(c.fase) < faseIndex("conferma");

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={e => e.target === e.currentTarget && setShowPreventivoModal(false)}
    >
      <div style={{ background: T.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "flex-start", gap: 10, borderBottom: `1px solid ${T.bdr}`, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginBottom: 2 }}>{c.code} · {c.cliente} {c.cognome || ""}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>€{fmt(totIva)}</div>
            <div style={{ fontSize: 10, color: T.sub }}>Imponibile €{fmt(imponibile)} + IVA {ivaPerc}% €{fmt(ivaAmt)}</div>
          </div>
          <div onClick={() => setShowPreventivoModal(false)}
            style={{ width: 30, height: 30, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: T.sub, flexShrink: 0 }}>✕</div>
        </div>

        {/* Scrollabile */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px 28px" }}>

          {/* Blocchi critici */}
          {bloccatoMisure && (
            <div style={{ background: "#DC444412", border: "1.5px solid #DC444450", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#DC4444", marginBottom: 4 }}>🔒 Misure non confermate</div>
              {vaniNonConf.map(v => (
                <div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#DC4444", padding: "2px 0" }}>
                  <span>• {v.nome}</span>
                  <span onClick={() => { setShowPreventivoModal(false); setSelectedVano(v); setVanoStep(0); }} style={{ color: "#007aff", fontWeight: 700, cursor: "pointer" }}>Vai →</span>
                </div>
              ))}
            </div>
          )}
          {bloccatoDT && (
            <div style={{ background: "#3B7FE012", border: "1.5px solid #3B7FE050", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#3B7FE0", marginBottom: 4 }}>📐 Disegno tecnico mancante</div>
              {vaniSenzaDT.map(v => (
                <div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3B7FE0", padding: "2px 0" }}>
                  <span>• {v.nome}</span>
                  <span onClick={() => { setShowPreventivoModal(false); setSelectedVano(v); setVanoStep(1); }} style={{ color: "#007aff", fontWeight: 700, cursor: "pointer" }}>Disegna →</span>
                </div>
              ))}
            </div>
          )}

          {/* Voci */}
          <div style={{ marginBottom: 14 }}>
            {vaniCalc.map((v, i) => (
              <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "9px 0", borderBottom: `1px solid ${T.bdr}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                    {v.nome || "Vano " + (i + 1)}
                    {v.pezzi > 1 && <span style={{ fontSize: 10, color: T.sub, marginLeft: 4 }}>×{v.pezzi}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>
                    {v.tipo} · {v.misure?.lCentro || 0}×{v.misure?.hCentro || 0} mm · {v.calc.mq.toFixed(2)} mq
                    {v.calc.sistema && <span style={{ color: "#007aff", marginLeft: 4 }}>{v.sistema}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: v.calc.tot === 0 ? "#DC4444" : T.text, marginLeft: 8 }}>
                  €{fmt(v.calc.tot)}
                </div>
              </div>
            ))}
          </div>

          {/* Totale */}
          <div style={{ background: T.bg, borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            {parseFloat(c.sconto || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ff9500", marginBottom: 4 }}>
                <span>Sconto {c.sconto}%</span><span>− €{fmt(scontoVal)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 3 }}>
              <span>Imponibile</span><span>€{fmt(imponibile)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, marginBottom: 10 }}>
              <span>IVA {ivaPerc}%</span><span>€{fmt(ivaAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 900, borderTop: `2px solid ${T.text}`, paddingTop: 10 }}>
              <span>TOTALE</span><span style={{ color: T.acc }}>€{fmt(totIva)}</span>
            </div>
          </div>

          {/* Note */}
          {c.notePreventivo && (
            <div style={{ background: T.bg, borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: T.text, marginBottom: 4, fontSize: 10, textTransform: "uppercase" }}>Note e condizioni</div>
              {c.notePreventivo}
            </div>
          )}

          {/* Firma */}
          {c.firmaCliente ? (
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 14, border: "1.5px solid #34c759", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1a9e40" }}>✅ Firmato {c.dataFirma}</span>
                <span onClick={() => { updCM("firmaCliente", null); updCM("dataFirma", null); }} style={{ marginLeft: "auto", fontSize: 10, color: "#ff3b30", cursor: "pointer" }}>✕ rimuovi</span>
              </div>
              <img src={c.firmaCliente} style={{ width: "100%", maxHeight: 60, objectFit: "contain", background: "#fff", borderRadius: 6 }} alt="" />
            </div>
          ) : (
            <button onClick={() => { setShowPreventivoModal(false); setShowFirmaModal(true); }}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid #34c759", background: "#f0fdf4", color: "#1a9e40", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              ✍️ Firma cliente sul telefono
            </button>
          )}

          {/* CTA principale */}
          <button
            onClick={async () => {
              if (bloccato) return;
              generaPreventivoPDF(c);
              const url = await generaPreventivoCondivisibile?.(c);
              updCM("preventivoInviato", true);
              updCM("dataPreventivoInvio", new Date().toISOString().split("T")[0]);
              if (url) updCM("linkPreventivo", url);
            }}
            style={{
              width: "100%", padding: 16, borderRadius: 12, border: "none", fontFamily: "inherit",
              cursor: bloccato ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 800, color: "#fff",
              marginBottom: 8,
              background: bloccato ? "#8e8e93" : "#25d366",
              boxShadow: bloccato ? "none" : "0 4px 16px rgba(37,211,102,0.35)",
              opacity: bloccato ? 0.7 : 1,
            }}>
            {bloccatoMisure ? "🔒 Conferma le misure prima" : bloccatoDT ? "📐 Disegna prima il tecnico" : "📤 GENERA PDF + INVIA CON FIRMA →"}
          </button>
          <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginBottom: 14 }}>Scarica il PDF e apre WhatsApp con il link per la firma</div>

          {/* Azioni secondarie */}
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <button onClick={() => { if (!bloccato) generaPreventivoPDF(c); }}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.bg, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: bloccato ? 0.5 : 1 }}>
              📄 Solo PDF
            </button>
            <button onClick={() => inviaWhatsApp(c, "preventivo")}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "1.5px solid #25d366", background: "#25d36615", color: "#25d366", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              💬 WhatsApp
            </button>
            <button onClick={() => inviaEmail(c, "preventivo")}
              style={{ flex: 1, padding: 12, borderRadius: 10, border: "1.5px solid #007aff", background: "#007aff15", color: "#007aff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              📧 Email
            </button>
          </div>

          {/* PDF Misure */}
          <button onClick={() => generaPDFMisure(c)}
            style={{ width: "100%", padding: 11, borderRadius: 10, border: "1.5px solid #5856d6", background: "#5856d615", color: "#5856d6", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>
            📐 PDF Misure (Produzione)
          </button>

          {/* Avanza fase */}
          {puo_avanzare && (
            <button onClick={() => { setFaseTo(c.id, "conferma"); setShowPreventivoModal(false); }}
              style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${T.acc}40` }}>
              ✅ AVANTI → Conferma ordine
            </button>
          )}
          {!c.preventivoInviato && (
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <span onClick={() => { updCM("preventivoInviato", true); }} style={{ fontSize: 11, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>
                ✅ Già inviato al cliente
              </span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
