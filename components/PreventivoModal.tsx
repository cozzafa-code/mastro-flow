"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — PreventivoModal
// Estratto S2: ~569 righe (Modale Preventivo completa)
// ═══════════════════════════════════════════════════════════
import React from "react";
import { useMastro } from "./MastroContext";
import { FM, tipoToMinCat, TIPOLOGIE_RAPIDE } from "./mastro-constants";

export default function PreventivoModal() {
  const {
    T, S, PIPELINE,
    // State
    showPreventivoModal, setShowPreventivoModal,
    selectedCM, setSelectedCM, cantieri, setCantieri,
    selectedVano, setSelectedVano, vanoStep, setVanoStep,
    sistemiDB, vetriDB, coprifiliDB, lamiereDB,
    fattureDB, setFattureDB, montaggiDB, setMontaggiDB,
    ordiniFornDB, setOrdiniFornDB, squadreDB, problemi,
    showCalMontaggi, setShowCalMontaggi,
    calMontaggiTarget, setCalMontaggiTarget,
    showFirmaModal, setShowFirmaModal,
    // Helpers
    calcolaTotaleCommessa, calcolaVanoPrezzo, getVaniAttivi, setFaseTo,
    ORDINE_STATI, renderCalendarioMontaggi,
    // Business logic + state
    ordineDetail, setOrdineDetail,
    generaPreventivoPDF, generaPDFMisure, creaFattura, generaFatturaPDF, inviaWhatsApp, inviaEmail, creaOrdineFornitore, ricalcolaOrdine, updateOrdine, calcolaScadenzaPagamento, generaOrdinePDF, generaConfermaFirmataPDF, inviaOrdineFornitore, creaMontaggio, generaTrackingCliente,
    aziendaInfo,
  } = useMastro();

    if (!showPreventivoModal || !selectedCM) return null;
    const c = selectedCM;
    const updateCMp = (field, val) => { setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,[field]:val}:x)); setSelectedCM(p=>({...p,[field]:val})); };

    // ── Usa calcolaVanoPrezzo dal context (identico a Centro Comando) ──
    const vaniAttivi = getVaniAttivi(c);
    const vaniCalc = vaniAttivi.map(v => {
      const tot = calcolaVanoPrezzo(v, c) * (v.pezzi || 1);
      const m = v.misure || {};
      const mq = ((m.lCentro||0)/1000) * ((m.hCentro||0)/1000);
      const sysRec = sistemiDB.find(s => (s.marca+" "+s.sistema)===v.sistema || s.sistema===v.sistema);
      return { ...v, calc: { tot, mq, sysRec, settore: v.settore || "serramenti" } };
    });
    const totale = vaniCalc.reduce((s,v)=>s+v.calc.tot, 0)
      + (c.vociLibere||[]).reduce((s,vl)=>s+(vl.importo||0)*(vl.qta||1), 0);
    const vaniSenzaSistema = vaniCalc.filter(v=>!v.calc.sysRec && !v.sistema && v.calc.settore==="serramenti");
    const vaniSenzaMisure = vaniCalc.filter(v=>!(v.misure?.lCentro) || !(v.misure?.hCentro));
    const hasWarnings = vaniSenzaSistema.length>0 || vaniSenzaMisure.length>0;
    const vaniNonConfermati = vaniCalc.filter(v=>(v.statoMisure||"provvisorie")!=="confermate");
    const bloccatoPerMisure = vaniNonConfermati.length > 0;
    // ── Blocco disegno tecnico ──
    const dtConf = aziendaInfo?.disegnoTecnico || {};
    const DISEGNO_DEFAULT: Record<string,boolean> = { serramenti: true, fabbro: true, pergole: true, porte: false, zanzariere: false, tendaggi: false, tapparelle: false };
    const vaniSenzaDisegno = vaniCalc.filter(v => {
      const settore = TIPOLOGIE_RAPIDE.find((t: any) => t.code === v.tipo)?.settore || "serramenti";
      const obbligatorio = settore in dtConf ? dtConf[settore] : (DISEGNO_DEFAULT[settore] ?? false);
      if (!obbligatorio) return false;
      return !(v.disegno && (v.disegno.pagine?.length > 0 || v.disegno.paths?.length > 0)) && !v.pdfFornitore;
    });
    const bloccatoPerDisegno = vaniSenzaDisegno.length > 0;
    const scontoVal = totale * parseFloat(c.scontoPerc || c.sconto || 0) / 100;
    const ivaPerc = c.ivaPerc || 10;
    const imponibile = totale - scontoVal;
    const iva = imponibile * ivaPerc / 100;
    const totIva = imponibile + iva;
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={e=>e.target===e.currentTarget&&setShowPreventivoModal(false)}>
        <div style={{background:"#f5f5f7",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,maxHeight:"90vh",overflow:"auto",paddingBottom:24}}>
          <div style={{padding:"16px 16px 10px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,background:"#f5f5f7",zIndex:1}}>
            <span style={{fontSize:20}}>📄</span>
            <div><div style={{fontSize:15,fontWeight:800}}>Preventivo</div><div style={{fontSize:11,color:"#666"}}>{c.code} — {c.cliente} {c.cognome||""}</div></div>
            <div onClick={()=>setShowPreventivoModal(false)} style={{marginLeft:"auto",width:28,height:28,borderRadius:"50%",background:"#e5e5ea",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>✕</div>
          </div>
          <div style={{padding:"0 16px"}}>
            <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",marginBottom:10}}>Parametri</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:4}}>SCONTO %</div><input type="number" value={c.sconto||0} onChange={e=>updateCMp("sconto",e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:15,fontWeight:700,textAlign:"right",boxSizing:"border-box"}}/></div>
                <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:4}}>ACCONTO €</div><input type="number" value={c.accontoRicevuto||0} onChange={e=>updateCMp("accontoRicevuto",e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:15,fontWeight:700,textAlign:"right",boxSizing:"border-box"}}/></div>
              </div>
              <div><div style={{fontSize:10,fontWeight:700,color:"#999",marginBottom:4}}>NOTE</div><textarea value={c.notePreventivo||""} onChange={e=>updateCMp("notePreventivo",e.target.value)} placeholder="Condizioni, garanzie..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1px solid #e5e5ea",fontSize:12,minHeight:50,resize:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
            </div>
            {hasWarnings && (
              <div style={{background:"#fff8ec",borderRadius:12,padding:"12px 14px",marginBottom:10,border:"1.5px solid #ff9500"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:16}}>⚠️</span>
                  <span style={{fontSize:12,fontWeight:800,color:"#7a4500"}}>Preventivo incompleto</span>
                </div>
                {vaniSenzaSistema.length>0 && (
                  <div style={{fontSize:11,color:"#7a4500",marginBottom:4}}>
                    • {vaniSenzaSistema.length} vano/i senza sistema assegnato → prezzo €0
                    <div onClick={()=>{setShowPreventivoModal(false);setSelectedVano(vaniSenzaSistema[0]);setVanoStep(0);}} style={{display:"inline",marginLeft:8,color:"#007aff",fontWeight:700,cursor:"pointer"}}>Vai →</div>
                  </div>
                )}
                {vaniSenzaMisure.length>0 && (
                  <div style={{fontSize:11,color:"#7a4500"}}>
                    • {vaniSenzaMisure.length} vano/i senza misure → calcolo non accurato
                    <div onClick={()=>{setShowPreventivoModal(false);setSelectedVano(vaniSenzaMisure[0]);setVanoStep(0);}} style={{display:"inline",marginLeft:8,color:"#007aff",fontWeight:700,cursor:"pointer"}}>Vai →</div>
                  </div>
                )}
              </div>
            )}
            <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#999",textTransform:"uppercase",marginBottom:8}}>Voci</div>
              {vaniCalc.length===0?<div style={{fontSize:12,color:"#999",textAlign:"center",padding:12}}>Nessun vano</div>:vaniCalc.map((v,i)=>(
                <div key={v.id} style={{padding:"8px 0",borderBottom:"1px solid #f5f5f7",background:v.calc.tot===0&&v.calc.settore==="serramenti"?"#fff5f5":"transparent",borderRadius:v.calc.tot===0&&v.calc.settore==="serramenti"?8:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{v.nome||"Vano "+(i+1)}{v.calc.tot===0&&v.calc.settore==="serramenti"&&<span style={{fontSize:9,background:"#ff3b30",color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:800}}>MANCA SISTEMA</span>}{v.calc.tot===0&&v.calc.settore!=="serramenti"&&<span style={{fontSize:9,background:"#ff950040",color:"#7a4500",padding:"1px 5px",borderRadius:3,fontWeight:800}}>INSERISCI PREZZO</span>}</div><div style={{fontSize:10,color:"#666"}}>{v.tipo} · {(v.misure?.lCentro||0)}×{(v.misure?.hCentro||0)}mm · {v.calc.mq.toFixed(2)} mq</div></div><div style={{fontSize:13,fontWeight:800,color:v.calc.tot===0?"#ff3b30":"#1a1a1c"}}>€ {v.calc.tot.toFixed(2)}</div></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:3}}>
                    {/* Serramenti badges */}
                    {v.calc.sysRec&&<span style={{fontSize:9,background:"#007aff15",color:"#007aff",padding:"1px 5px",borderRadius:4}}>{v.calc.sysRec.sistema}</span>}
                    {v.calc.vetroRec&&<span style={{fontSize:9,background:"#34c75915",color:"#1a9e40",padding:"1px 5px",borderRadius:4}}>{v.calc.vetroRec.code}</span>}
                    {v.calc.copRec&&<span style={{fontSize:9,background:"#ff950015",color:"#7a4500",padding:"1px 5px",borderRadius:4}}>{v.calc.copRec.cod}</span>}
                    {v.calc.lamRec&&<span style={{fontSize:9,background:"#af52de15",color:"#7c2d9e",padding:"1px 5px",borderRadius:4}}>{v.calc.lamRec.cod}</span>}
                    {/* Porte badges */}
                    {v.calc.settore==="porte"&&v.materiale&&<span style={{fontSize:9,background:"#D0800815",color:"#D08008",padding:"1px 5px",borderRadius:4}}>🚪 {v.materiale}</span>}
                    {v.calc.settore==="porte"&&v.apertura&&<span style={{fontSize:9,background:"#D0800815",color:"#D08008",padding:"1px 5px",borderRadius:4}}>{v.apertura}</span>}
                    {v.calc.settore==="porte"&&v.maniglia&&<span style={{fontSize:9,background:"#507aff15",color:"#507aff",padding:"1px 5px",borderRadius:4}}>🔑 {v.maniglia}</span>}
                    {/* Box Doccia badges */}
                    {v.calc.settore==="boxdoccia"&&v.tipoBox&&<span style={{fontSize:9,background:"#3B7FE015",color:"#3B7FE0",padding:"1px 5px",borderRadius:4}}>🚿 {v.tipoBox}</span>}
                    {v.calc.settore==="boxdoccia"&&v.vetroBox&&<span style={{fontSize:9,background:"#3B7FE015",color:"#3B7FE0",padding:"1px 5px",borderRadius:4}}>{v.vetroBox}</span>}
                    {v.calc.settore==="boxdoccia"&&v.profiloBox&&<span style={{fontSize:9,background:"#af52de15",color:"#7c2d9e",padding:"1px 5px",borderRadius:4}}>{v.profiloBox}</span>}
                    {/* Cancelli badges */}
                    {v.calc.settore==="cancelli"&&v.tipoCancello&&<span style={{fontSize:9,background:"#8B5E3415",color:"#8B5E34",padding:"1px 5px",borderRadius:4}}>🏗️ {v.tipoCancello}</span>}
                    {v.calc.settore==="cancelli"&&v.materialeCancello&&<span style={{fontSize:9,background:"#8B5E3415",color:"#8B5E34",padding:"1px 5px",borderRadius:4}}>{v.materialeCancello}</span>}
                    {v.calc.settore==="cancelli"&&v.automazione&&v.automazione!=="Nessuna"&&<span style={{fontSize:9,background:"#e6394615",color:"#e63946",padding:"1px 5px",borderRadius:4}}>⚡ {v.automazione}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div style={{background:"#fff",borderRadius:12,padding:"14px",marginBottom:10}}>
              {parseFloat(c.sconto||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#ff9500",marginBottom:6}}><span>Sconto {c.sconto}%</span><span>− € {scontoVal.toFixed(2)}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:6}}><span>Imponibile</span><span>€ {imponibile.toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:10}}><span>IVA 10%</span><span>€ {iva.toFixed(2)}</span></div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:900,paddingTop:10,borderTop:"2px solid #1a1a1c"}}><span>TOTALE</span><span style={{color:"#007aff"}}>€ {totIva.toFixed(2)}</span></div>
              {parseFloat(c.accontoRicevuto||0)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#34c759",marginTop:8,fontWeight:700}}><span>Saldo da incassare</span><span>€ {(totIva-parseFloat(c.accontoRicevuto)).toFixed(2)}</span></div>}
            </div>
            {c.firmaCliente?(<div style={{background:"#f0fdf4",borderRadius:12,padding:14,border:"1.5px solid #34c759",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span>✅</span><span style={{fontSize:12,fontWeight:700,color:"#1a9e40"}}>Firmato {c.dataFirma}</span><div onClick={()=>{setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,firmaCliente:null,dataFirma:null}:x));setSelectedCM(p=>({...p,firmaCliente:null,dataFirma:null}));}} style={{marginLeft:"auto",fontSize:11,color:"#ff3b30",cursor:"pointer"}}>✕ Rimuovi</div></div><img src={c.firmaCliente} style={{width:"100%",maxHeight:70,objectFit:"contain",background:"#fff",borderRadius:8}} alt=""/></div>):(<button onClick={()=>{setShowPreventivoModal(false);setShowFirmaModal(true);}} style={{width:"100%",padding:13,borderRadius:12,border:"1.5px solid #34c759",background:"#f0fdf4",color:"#1a9e40",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>✍️ Firma cliente sul telefono</button>)}
            {hasWarnings && (
              <div style={{fontSize:11,color:"#999",textAlign:"center",marginBottom:6}}>⚠️ Correggi i problemi per un preventivo accurato</div>
            )}
            {bloccatoPerMisure && (
              <div style={{background:"#DC444410",border:"1.5px solid #DC444440",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:800,color:"#DC4444",marginBottom:4}}>🔒 Misure non confermate</div>
                <div style={{fontSize:11,color:"#DC4444",marginBottom:6}}>
                  {vaniNonConfermati.length} vano/i con misure non ancora confermate. Conferma le misure per sbloccare il preventivo.
                </div>
                {vaniNonConfermati.map(v => (
                  <div key={v.id} style={{fontSize:10,color:"#7a0000",padding:"3px 0",borderTop:"1px solid #DC444420",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span>• {v.nome} — <b>{v.statoMisure === "da_rivedere" ? "⚠️ Da rivedere" : v.statoMisure === "verificate" ? "👁 Verificate" : "✏️ Provvisorie"}</b></span>
                    <span onClick={()=>{setShowPreventivoModal(false);setSelectedVano(v);setVanoStep(0);}} style={{color:"#007aff",fontWeight:700,cursor:"pointer",fontSize:10}}>Vai →</span>
                  </div>
                ))}
              </div>
            )}
            {bloccatoPerDisegno && (
              <div style={{background:"#3B7FE010",border:"1.5px solid #3B7FE040",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:800,color:"#3B7FE0",marginBottom:4}}>📐 Disegno tecnico mancante</div>
                <div style={{fontSize:11,color:"#3B7FE0",marginBottom:6}}>
                  {vaniSenzaDisegno.length} vano/i richiedono un disegno tecnico prima di generare il preventivo.
                </div>
                {vaniSenzaDisegno.map(v => (
                  <div key={v.id} style={{fontSize:10,color:"#1a3a6e",padding:"3px 0",borderTop:"1px solid #3B7FE020",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span>• {v.nome} — {TIPOLOGIE_RAPIDE.find((t: any) => t.code === v.tipo)?.label || v.tipo}</span>
                    <span onClick={()=>{setShowPreventivoModal(false);setSelectedVano(v);setVanoStep(1);}} style={{color:"#007aff",fontWeight:700,cursor:"pointer",fontSize:10}}>Disegna →</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={()=>{ if(!bloccatoPerMisure && !bloccatoPerDisegno) generaPreventivoPDF(c); }} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:(bloccatoPerMisure||bloccatoPerDisegno)?"linear-gradient(135deg,#DC4444,#b83030)":hasWarnings?"linear-gradient(135deg,#8e8e93,#636366)":"linear-gradient(135deg,#007aff,#0055cc)",color:"#fff",fontSize:15,fontWeight:800,cursor:(bloccatoPerMisure||bloccatoPerDisegno)?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:(bloccatoPerMisure||bloccatoPerDisegno)?"none":hasWarnings?"none":"0 4px 12px rgba(0,122,255,0.3)",opacity:(bloccatoPerMisure||bloccatoPerDisegno)?0.8:1}}>
              {bloccatoPerMisure?"🔒 Conferma le misure per generare":bloccatoPerDisegno?"📐 Disegno tecnico mancante":hasWarnings?"⚠️ Genera PDF (incompleto)":"📄 Genera & Scarica PDF"}
            </button>
            <div style={{ marginTop: 8, fontSize: 11, color: T.sub, textAlign: "center" as any }}>
              Il PDF verrà salvato automaticamente nella commessa
            </div>
          </div>
        </div>
      </div>
    );

}
