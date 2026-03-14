"use client";
// @ts-nocheck
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { TIPOLOGIE_RAPIDE } from "./mastro-constants";

export default function PreventivoModal() {
  const { T, showPreventivoModal, setShowPreventivoModal, selectedCM, setSelectedCM, cantieri, setCantieri, setSelectedVano, setVanoStep, sistemiDB, calcolaVanoPrezzo, getVaniAttivi, generaPreventivoPDF, generaPreventivoCondivisibile, setShowFirmaModal, aziendaInfo, toast } = useMastro();
  const [invioLink, setInvioLink] = useState(false);
  const [linkCopiato, setLinkCopiato] = useState(false);
  if (!showPreventivoModal || !selectedCM) return null;
  const c = selectedCM;
  const upd = (f, v) => { setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [f]: v } : x)); setSelectedCM(p => ({ ...p, [f]: v })); };
  const az = aziendaInfo || {};
  const vani = getVaniAttivi(c);
  const vaniCalc = vani.map(v => {
    const prezzoBase = calcolaVanoPrezzo(v, c);
    const pezzi = v.pezzi || 1;
    const acc = v.accessori || {};
    const m = v.misure || {};
    const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
    const accFisici = [];
    if (acc.tapparella?.attivo) { const p = parseFloat(az.prezzoTapparella || c.prezzoTapparella || 0); accFisici.push({ label: "Tapparella" + (acc.tapparella.colore ? " " + acc.tapparella.colore : "") + (acc.tapparella.motorizzata ? " (motorizzata)" : ""), prezzo: p > 0 ? Math.round(((acc.tapparella.l||lmm)/1000)*((acc.tapparella.h||hmm)/1000)*p*100)/100 : 0, pezzi }); }
    if (acc.persiana?.attivo) { const p = parseFloat(az.prezzoPersiana || c.prezzoPersiana || 0); accFisici.push({ label: "Persiana" + (acc.persiana.colore ? " " + acc.persiana.colore : ""), prezzo: p > 0 ? Math.round(((acc.persiana.l||lmm)/1000)*((acc.persiana.h||hmm)/1000)*p*100)/100 : 0, pezzi }); }
    if (acc.zanzariera?.attivo) { const p = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || 0); accFisici.push({ label: "Zanzariera" + (acc.zanzariera.tipo ? " " + acc.zanzariera.tipo : ""), prezzo: p > 0 ? Math.round(((acc.zanzariera.l||lmm)/1000)*((acc.zanzariera.h||hmm)/1000)*p*100)/100 : 0, pezzi }); }
    const accCatalogo = (v.accessoriCatalogo || []).map(a => ({ label: a.nome || "Accessorio", prezzo: parseFloat(a.prezzoUnitario) || 0, pezzi: a.quantita || 1 }));
    const posaPrezzo = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano||0) > 0 && az.includePosaInPreventivo ? parseFloat(az.prezzoPosaVano) : 0);
    if (posaPrezzo > 0) accFisici.push({ label: "Posa in opera", prezzo: posaPrezzo, pezzi });
    const vociVano = (v.vociLibere || []).map(vl => ({ label: vl.desc || "Voce extra", prezzo: vl.prezzo || 0, pezzi: vl.qta || 1 }));
    const allAcc = [...accFisici, ...accCatalogo, ...vociVano];
    const totAccessori = allAcc.reduce((s, a) => s + a.prezzo * a.pezzi, 0);
    const totVano = prezzoBase * pezzi + totAccessori;
    const confermato = (v.statoMisure || "provvisorie") === "confermate";
    const sysRec = sistemiDB?.find(s => (s.marca+" "+s.sistema) === v.sistema || s.sistema === v.sistema);
    return { ...v, _prezzoBase: prezzoBase, _allAcc: allAcc, _totVano: totVano, _confermato: confermato, _sysRec: sysRec };
  });
  const vociCommessa = (c.vociLibere || []).map(vl => ({ label: vl.desc || "Voce extra", importo: (vl.importo || 0) * (vl.qta || 1) }));
  const totVani = vaniCalc.reduce((s, v) => s + v._totVano, 0);
  const totVoci = vociCommessa.reduce((s, v) => s + v.importo, 0);
  const totBase = totVani + totVoci;
  const scontoPerc = parseFloat(c.scontoPerc || c.sconto || 0);
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.ivaPerc || 10);
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;
  const vaniNonConfermati = vaniCalc.filter(v => !v._confermato);
  const bloccato = vaniNonConfermati.length > 0;
  const fmt = n => (n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const settoreColor = v => { const s = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.settore || "serramenti"; return { serramenti: T.acc, fabbro: "#8B5E34", pergole: "#1A9E73", porte: "#D08008", zanzariere: "#3B7FE0", boxdoccia: "#0088cc", tendaggi: "#8B5CF6" }[s] || T.acc; };
  const handleGeneraPDF = () => { if (!bloccato) { generaPreventivoPDF(c); toast && toast("PDF generato", "success"); } };
  const handleInviaLink = async () => { setInvioLink(true); try { const url = await generaPreventivoCondivisibile(c); if (url) { await navigator.clipboard.writeText(url); setLinkCopiato(true); upd("preventivoLink", url); setTimeout(() => setLinkCopiato(false), 3000); toast && toast("Link copiato!", "success"); } } catch { toast && toast("Errore link", "error"); } setInvioLink(false); };
  const bg = T.bg, card = T.card, text = T.text, sub = T.sub, bdr = T.bdr, acc = T.acc, red = T.red, grn = T.grn;
  return (
    <div onClick={e => e.target === e.currentTarget && setShowPreventivoModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ background: bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "92vh", overflow: "auto", paddingBottom: 32 }}>
        <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, background: bg, zIndex: 1, borderBottom: "1px solid " + bdr }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 800, color: text }}>Preventivo</div><div style={{ fontSize: 11, color: sub }}>{c.code} — {c.cliente} {c.cognome || ""}</div></div>
          <div onClick={() => setShowPreventivoModal(false)} style={{ width: 28, height: 28, borderRadius: "50%", background: bdr, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>X</div>
        </div>
        <div style={{ padding: "0 14px" }}>
          {bloccato && <div style={{ background: red + "10", border: "1.5px solid " + red + "40", borderRadius: 12, padding: "12px 14px", marginTop: 14, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: red, marginBottom: 6 }}>Misure non confermate</div>
            <div style={{ fontSize: 11, color: red, marginBottom: 8 }}>{vaniNonConfermati.length} vano/i con misure provvisorie. Conferma per procedere.</div>
            {vaniNonConfermati.map(v => (<div key={v.id} onClick={() => { setShowPreventivoModal(false); setSelectedVano(v); setVanoStep(0); }} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: "1px solid " + red + "20", cursor: "pointer" }}><span style={{ fontSize: 11, color: red }}>{v.nome} — {v.statoMisure === "da_rivedere" ? "Da rivedere" : "Provvisorie"}</span><span style={{ fontSize: 11, color: "#007aff", fontWeight: 700 }}>Vai</span></div>))}
          </div>}
          <div style={{ marginTop: 14, marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Voci preventivo</div>
            {vaniCalc.length === 0 ? <div style={{ background: card, borderRadius: 12, padding: 20, textAlign: "center", color: sub, fontSize: 13 }}>Nessun vano</div> : vaniCalc.map((v, i) => {
              const colore = settoreColor(v);
              const m = v.misure || {};
              return (<div key={v.id} style={{ background: card, borderRadius: 12, marginBottom: 8, borderLeft: "3px solid " + colore, overflow: "hidden" }}>
                <div style={{ padding: "11px 12px 8px", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 2 }}>{v.nome || "Vano " + (i+1)}{!v._confermato && <span style={{ marginLeft: 6, fontSize: 9, background: "#FF950020", color: "#FF9500", padding: "1px 6px", borderRadius: 4, fontWeight: 800 }}>PROVVISORIE</span>}</div>
                    <div style={{ fontSize: 10, color: sub }}>{v.tipo}{v._sysRec ? " - " + v._sysRec.sistema : v.sistema ? " - " + v.sistema : ""}{(m.lCentro && m.hCentro) ? " - " + m.lCentro + "x" + m.hCentro + "mm" : ""}{v.pezzi > 1 ? " - " + v.pezzi + " pz" : ""}</div>
                    {v.coloreInt && <div style={{ fontSize: 10, color: sub }}>{v.bicolore ? v.coloreInt + " int. / " + v.coloreEst + " est." : v.coloreInt}{v.vetro ? " - " + v.vetro : ""}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: v._prezzoBase === 0 ? red : text }}>EUR {fmt(v._prezzoBase * (v.pezzi || 1))}</div>
                    {(v.pezzi || 1) > 1 && <div style={{ fontSize: 9, color: sub }}>EUR {fmt(v._prezzoBase)} / pz</div>}
                  </div>
                </div>
                {v._allAcc.length > 0 && <div style={{ borderTop: "1px solid " + bdr, padding: "6px 12px 8px" }}>
                  {v._allAcc.map((a, ai) => <div key={ai} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}><span style={{ fontSize: 11, color: sub }}>{"  > " + a.label + (a.pezzi > 1 ? " x" + a.pezzi : "")}</span><span style={{ fontSize: 11, color: a.prezzo === 0 ? sub : text, fontWeight: a.prezzo > 0 ? 700 : 400 }}>{a.prezzo === 0 ? "inclusa" : "EUR " + fmt(a.prezzo * a.pezzi)}</span></div>)}
                </div>}
                {v._allAcc.length > 0 && <div style={{ padding: "6px 12px 8px", borderTop: "1px solid " + bdr, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 11, color: sub, fontWeight: 700 }}>Totale vano</span><span style={{ fontSize: 12, fontWeight: 800, color: text }}>EUR {fmt(v._totVano)}</span></div>}
              </div>);
            })}
            {vociCommessa.map((vl, i) => <div key={i} style={{ background: card, borderRadius: 12, marginBottom: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", borderLeft: "3px solid " + sub }}><span style={{ fontSize: 12, color: text }}>{vl.label}</span><span style={{ fontSize: 13, fontWeight: 700, color: text }}>EUR {fmt(vl.importo)}</span></div>)}
          </div>
          <div style={{ background: card, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", marginBottom: 10 }}>Parametri</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: sub, marginBottom: 4 }}>SCONTO %</div><input type="number" value={c.scontoPerc || c.sconto || 0} min={0} max={100} onChange={e => upd("scontoPerc", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid " + bdr, fontSize: 15, fontWeight: 700, textAlign: "right", boxSizing: "border-box", background: bg, color: text }} /></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, color: sub, marginBottom: 4 }}>IVA %</div><input type="number" value={c.ivaPerc || 10} min={0} max={22} onChange={e => upd("ivaPerc", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid " + bdr, fontSize: 15, fontWeight: 700, textAlign: "right", boxSizing: "border-box", background: bg, color: text }} /></div>
            </div>
            <div style={{ marginBottom: 8 }}><div style={{ fontSize: 10, fontWeight: 700, color: sub, marginBottom: 4 }}>ACCONTO EUR</div><input type="number" value={c.accontoRicevuto || 0} min={0} onChange={e => upd("accontoRicevuto", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid " + bdr, fontSize: 15, fontWeight: 700, textAlign: "right", boxSizing: "border-box", background: bg, color: text }} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: sub, marginBottom: 4 }}>NOTE</div><textarea value={c.notePreventivo || ""} onChange={e => upd("notePreventivo", e.target.value)} placeholder="Condizioni, garanzie, tempi..." style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid " + bdr, fontSize: 12, minHeight: 56, resize: "none", boxSizing: "border-box", fontFamily: "inherit", background: bg, color: text }} /></div>
          </div>
          <div style={{ background: card, borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", marginBottom: 10 }}>Riepilogo</div>
            {scontoPerc > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#FF9500", marginBottom: 5 }}><span>Sconto {scontoPerc}%</span><span>- EUR {fmt(scontoVal)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: sub, marginBottom: 5 }}><span>Imponibile</span><span style={{ fontWeight: 700, color: text }}>EUR {fmt(imponibile)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: sub, marginBottom: 10 }}><span>IVA {ivaPerc}%</span><span>EUR {fmt(ivaVal)}</span></div>
            <div style={{ background: text, borderRadius: 10, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>TOTALE IVA INCLUSA</span><span style={{ fontSize: 18, fontWeight: 900, color: acc }}>EUR {fmt(totIva)}</span></div>
            {acconto > 0 && <div style={{ marginTop: 8, background: grn + "15", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 11, color: sub }}>Acconto: EUR {fmt(acconto)}</div><div style={{ fontSize: 13, fontWeight: 800, color: grn }}>Saldo da incassare</div></div><span style={{ fontSize: 16, fontWeight: 900, color: grn }}>EUR {fmt(saldo)}</span></div>}
          </div>
          {c.firmaCliente ? (<div style={{ background: grn + "10", borderRadius: 12, padding: 14, border: "1.5px solid " + grn + "40", marginBottom: 10 }}><div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><span style={{ fontSize: 16 }}>OK</span><span style={{ fontSize: 12, fontWeight: 700, color: grn }}>Firmato {c.dataFirma || ""}</span><div onClick={() => { upd("firmaCliente", null); upd("dataFirma", null); }} style={{ marginLeft: "auto", fontSize: 11, color: red, cursor: "pointer", fontWeight: 700 }}>Rimuovi</div></div><img src={c.firmaCliente} alt="Firma" style={{ width: "100%", maxHeight: 60, objectFit: "contain", background: "#fff", borderRadius: 8 }} /></div>
          ) : (<div style={{ marginBottom: 10 }}>
            <button onClick={() => { setShowPreventivoModal(false); setShowFirmaModal(true); }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid " + grn, background: grn + "10", color: grn, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>Firma qui sul dispositivo</button>
            <button onClick={handleInviaLink} disabled={invioLink} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid " + acc, background: acc + "10", color: acc, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: invioLink ? 0.6 : 1 }}>{linkCopiato ? "Link copiato!" : invioLink ? "Generazione..." : "Invia link al cliente per firma"}</button>
          </div>)}
          <button onClick={handleGeneraPDF} disabled={bloccato} style={{ width: "100%", padding: 15, borderRadius: 12, border: "none", fontSize: 15, fontWeight: 800, cursor: bloccato ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, background: bloccato ? "#8e8e93" : "linear-gradient(135deg, " + acc + ", " + acc + "cc)", color: "#fff", opacity: bloccato ? 0.7 : 1, boxShadow: bloccato ? "none" : "0 4px 16px " + acc + "50" }}>{bloccato ? "Conferma le misure per generare" : "Genera e Scarica PDF"}</button>
          {!bloccato && <div style={{ fontSize: 11, color: sub, textAlign: "center" }}>Il PDF include tutti i vani e gli accessori</div>}
        </div>
      </div>
    </div>
  );
}
