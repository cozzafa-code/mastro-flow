// ═══ MASTRO ERP — PreventivoModal (Phase B) ═══
import { useMastro } from "../../MastroContext";
import CalendarioMontaggi from "./CalendarioMontaggi";

export default function PreventivoModal() {
  const { T, S, Ico, cantieri, setCantieri, problemi, sistemiDB, vetriDB, coprifiliDB, lamiereDB, setShowFirmaModal, showPreventivoModal, setShowPreventivoModal, fattureDB, setFattureDB, ordiniFornDB, setOrdiniFornDB, showCalMontaggi, setShowCalMontaggi, calMontaggiTarget, setCalMontaggiTarget, selectedCM, setSelectedCM, setSelectedVano, setVanoStep, aziendaInfo, isTablet, isDesktop } = useMastro();

    if (!showPreventivoModal || !selectedCM) return null;
    const c = selectedCM;
    const updateCMp = (field, val) => { setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,[field]:val}:x)); setSelectedCM(p=>({...p,[field]:val})); };
    const calcolaVano = (v) => {
      const m=v.misure||{}; const lc=(m.lCentro||0)/1000,hc=(m.hCentro||0)/1000; const lmm=m.lCentro||0,hmm=m.hCentro||0; const mq=lc*hc,perim=2*(lc+hc);
      const sysRec=sistemiDB.find(s=>(s.marca+" "+s.sistema)===v.sistema||s.sistema===v.sistema);
      // Minimo mq per tipologia
      const minCat = tipoToMinCat(v.tipo || "F1A");
      const minimoMq = sysRec?.minimiMq?.[minCat] || 0;
      const mqCalc = (minimoMq > 0 && mq > 0 && mq < minimoMq) ? minimoMq : mq;
      // Grid lookup: ceiling approach
      let basePrezzoSer = 0;
      const grid = sysRec?.griglia;
      let gridPrice = null;
      if (grid && grid.length > 0) {
        const sorted = [...grid].sort((a,b) => a.l - b.l || a.h - b.h);
        gridPrice = sorted.find(g => g.l === lmm && g.h === hmm)?.prezzo ?? sorted.find(g => g.l >= lmm && g.h >= hmm)?.prezzo ?? sorted[sorted.length-1]?.prezzo ?? null;
      }
      if (gridPrice !== null) { basePrezzoSer = gridPrice; } else { basePrezzoSer = mqCalc*parseFloat(sysRec?.prezzoMq||sysRec?.euroMq||c.prezzoMq||350); }
      let tot=basePrezzoSer;
      const vetroRec=vetriDB.find(g=>g.code===v.vetro||g.nome===v.vetro); if(vetroRec?.prezzoMq) tot+=mq*parseFloat(vetroRec.prezzoMq);
      const copRec=coprifiliDB.find(cp=>cp.cod===v.coprifilo); if(copRec?.prezzoMl) tot+=perim*parseFloat(copRec.prezzoMl);
      const lamRec=lamiereDB.find(l=>l.cod===v.lamiera); if(lamRec?.prezzoMl) tot+=lc*parseFloat(lamRec.prezzoMl);
      const tapp=v.accessori?.tapparella; if(tapp?.attivo&&c.prezzoTapparella){const tmq=((tapp.l||m.lCentro||0)/1000)*((tapp.h||m.hCentro||0)/1000);tot+=tmq*parseFloat(c.prezzoTapparella);}
      const pers=v.accessori?.persiana; if(pers?.attivo&&c.prezzoPersiana){const pmq=((pers.l||m.lCentro||0)/1000)*((pers.h||m.hCentro||0)/1000);tot+=pmq*parseFloat(c.prezzoPersiana);}
      const zanz=v.accessori?.zanzariera; if(zanz?.attivo&&c.prezzoZanzariera){const zmq=((zanz.l||m.lCentro||0)/1000)*((zanz.h||m.hCentro||0)/1000);tot+=zmq*parseFloat(c.prezzoZanzariera);}
      if (v.vociLibere?.length > 0) v.vociLibere.forEach(vl => { tot += (vl.prezzo || 0) * (vl.qta || 1); });
      return {tot,mq,sysRec,vetroRec,copRec,lamRec};
    };
    const vaniCalc=getVaniAttivi(c).map(v=>({...v,calc:calcolaVano(v)}));
    const totale=vaniCalc.reduce((s,v)=>s+v.calc.tot,0);
    const vaniSenzaSistema = vaniCalc.filter(v=>!v.calc.sysRec && !v.sistema);
    const vaniSenzaMisure = vaniCalc.filter(v=>!(v.misure?.lCentro) || !(v.misure?.hCentro));
    const hasWarnings = vaniSenzaSistema.length>0 || vaniSenzaMisure.length>0;
    const scontoVal=totale*parseFloat(c.sconto||0)/100;
    const imponibile=totale-scontoVal; const iva=imponibile*0.10; const totIva=imponibile+iva;
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
                <div key={v.id} style={{padding:"8px 0",borderBottom:"1px solid #f5f5f7",background:v.calc.tot===0?"#fff5f5":"transparent",borderRadius:v.calc.tot===0?8:0}}>
                  <div style={{display:"flex",gap:8,alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>{v.nome||"Vano "+(i+1)}{v.calc.tot===0&&<span style={{fontSize:9,background:"#ff3b30",color:"#fff",padding:"1px 5px",borderRadius:3,fontWeight:800}}>MANCA SISTEMA</span>}</div><div style={{fontSize:10,color:"#666"}}>{v.tipo} · {(v.misure?.lCentro||0)}×{(v.misure?.hCentro||0)}mm · {v.calc.mq.toFixed(2)} mq</div></div><div style={{fontSize:13,fontWeight:800,color:v.calc.tot===0?"#ff3b30":"#1a1a1c"}}>€ {v.calc.tot.toFixed(2)}</div></div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:3}}>
                    {v.calc.sysRec&&<span style={{fontSize:9,background:"#007aff15",color:"#007aff",padding:"1px 5px",borderRadius:4}}>{v.calc.sysRec.sistema}</span>}
                    {v.calc.vetroRec&&<span style={{fontSize:9,background:"#34c75915",color:"#1a9e40",padding:"1px 5px",borderRadius:4}}>{v.calc.vetroRec.code}</span>}
                    {v.calc.copRec&&<span style={{fontSize:9,background:"#ff950015",color:"#7a4500",padding:"1px 5px",borderRadius:4}}>{v.calc.copRec.cod}</span>}
                    {v.calc.lamRec&&<span style={{fontSize:9,background:"#af52de15",color:"#7c2d9e",padding:"1px 5px",borderRadius:4}}>{v.calc.lamRec.cod}</span>}
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
            <button onClick={()=>generaPreventivoPDF(c)} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:hasWarnings?"linear-gradient(135deg,#8e8e93,#636366)":"linear-gradient(135deg,#007aff,#0055cc)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:hasWarnings?"none":"0 4px 12px rgba(0,122,255,0.3)"}}>
              {hasWarnings?"⚠️ Genera PDF (incompleto)":"📄 Genera & Scarica PDF"}
            </button>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => generaPDFMisure(c)} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid #5856d6`, background: "#5856d615", color: "#5856d6", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                📐 PDF Misure (Produzione)
              </button>
              <button onClick={() => {
                const upd = { ...c, confermato: true, dataConferma: new Date().toLocaleDateString("it-IT"), stato: "conferma" };
                setCantieri(cs => cs.map(x => x.id === c.id ? upd : x));
                setSelectedCM(upd);
              }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1.5px solid ${c.confermato ? "#34c759" : "#af52de"}`, background: c.confermato ? "#34c75915" : "#af52de15", color: c.confermato ? "#34c759" : "#af52de", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {c.confermato ? `✅ Confermato ${c.dataConferma || ""}` : "✍️ Conferma ordine"}
              </button>
            </div>
            {/* Tracking produzione */}
            <div style={{ marginTop: 10, background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>📦 Tracking produzione</div>
              <div style={{ display: "flex", gap: 2 }}>
                {[
                  { id: "ordinato", l: "Ordinato", ico: "📦", c: "#ff9500" },
                  { id: "produzione", l: "In Prod.", ico: "🏭", c: "#5856d6" },
                  { id: "pronto", l: "Pronto", ico: "✅", c: "#34c759" },
                  { id: "consegnato", l: "Consegnato", ico: "🚛", c: "#007aff" },
                  { id: "montato", l: "Montato", ico: "🔧", c: "#30b0c7" },
                ].map((st, i) => {
                  const trackSteps = ["ordinato", "produzione", "pronto", "consegnato", "montato"];
                  const curIdx = trackSteps.indexOf(c.trackingStato || "");
                  const stIdx = trackSteps.indexOf(st.id);
                  const isActive = stIdx <= curIdx;
                  const isCurrent = st.id === c.trackingStato;
                  return (
                    <div key={st.id} onClick={() => {
                      const upd = { ...c, trackingStato: st.id, [`tracking_${st.id}_data`]: new Date().toLocaleDateString("it-IT") };
                      setCantieri(cs => cs.map(x => x.id === c.id ? upd : x));
                      setSelectedCM(upd);
                    }} style={{
                      flex: 1, padding: "6px 2px", borderRadius: 6, textAlign: "center", cursor: "pointer",
                      background: isActive ? st.c + "20" : "transparent",
                      border: `1.5px solid ${isCurrent ? st.c : isActive ? st.c + "40" : T.bdr}`,
                    }}>
                      <div style={{ fontSize: 14 }}>{st.ico}</div>
                      <div style={{ fontSize: 7, fontWeight: 700, color: isActive ? st.c : T.sub }}>{st.l}</div>
                      {isActive && c[`tracking_${st.id}_data`] && <div style={{ fontSize: 6, color: st.c + "99" }}>{c[`tracking_${st.id}_data`]}</div>}
                    </div>
                  );
                })}
              </div>
              {c.trackingStato && <div style={{ fontSize: 9, color: T.sub, marginTop: 4, textAlign: "center" }}>Data prevista consegna: <input type="date" value={c.dataPrevConsegna || ""} onChange={e => { const upd = { ...c, dataPrevConsegna: e.target.value }; setCantieri(cs => cs.map(x => x.id === c.id ? upd : x)); setSelectedCM(upd); }} style={{ fontSize: 9, border: `1px solid ${T.bdr}`, borderRadius: 4, padding: "2px 6px" }} /></div>}
            </div>

            {/* === INVIO WhatsApp / Email === */}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => inviaWhatsApp(c, c.confermato ? "conferma" : "preventivo")} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #25d366", background: "#25d36615", color: "#25d366", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                💬 WhatsApp
              </button>
              <button onClick={() => inviaEmail(c, c.confermato ? "conferma" : "preventivo")} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid #007aff`, background: "#007aff15", color: "#007aff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                📧 Email
              </button>
              {c.trackingStato && (
                <button onClick={() => inviaWhatsApp(c, "stato")} style={{ flex: 1, padding: 10, borderRadius: 10, border: "1.5px solid #ff9500", background: "#ff950015", color: "#ff9500", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  📲 Stato
                </button>
              )}
            </div>

            {/* === FATTURAZIONE === */}
            <div style={{ marginTop: 10, background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>💰 Fatturazione</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => { const f = creaFattura(c, "acconto"); generaFatturaPDF(f); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid #ff9500`, background: "#ff950015", color: "#ff9500", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Acconto</button>
                  <button onClick={() => { const f = creaFattura(c, "saldo"); generaFatturaPDF(f); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid #34c759`, background: "#34c75915", color: "#34c759", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Saldo</button>
                  <button onClick={() => { const f = creaFattura(c, "unica"); generaFatturaPDF(f); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid #007aff`, background: "#007aff15", color: "#007aff", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Unica</button>
                </div>
              </div>
              {fattureDB.filter(f => f.cmId === c.id).length > 0 ? (
                <div>
                  {fattureDB.filter(f => f.cmId === c.id).map(f => (
                    <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.bdr}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>N. {f.numero}/{f.anno} · {f.tipo.toUpperCase()}</div>
                        <div style={{ fontSize: 9, color: T.sub }}>{f.data ? new Date(f.data+'T12:00:00').toLocaleDateString('it-IT') : f.data} · Scad: {f.scadenza ? new Date(f.scadenza+'T12:00:00').toLocaleDateString('it-IT') : f.scadenza}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: f.pagata ? "#34c759" : T.text }}>€{f.importo.toLocaleString("it-IT")}</span>
                        <div onClick={() => { setFattureDB(prev => prev.map(x => x.id === f.id ? { ...x, pagata: !x.pagata, dataPagamento: !x.pagata ? new Date().toLocaleDateString("it-IT") : null } : x)); }} style={{ padding: "3px 8px", borderRadius: 4, background: f.pagata ? "#34c75920" : "#ff3b3020", color: f.pagata ? "#34c759" : "#ff3b30", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                          {f.pagata ? "✅ Pagata" : "⏳ Da pagare"}
                        </div>
                        <div onClick={() => generaFatturaPDF(f)} style={{ fontSize: 14, cursor: "pointer" }}>📄</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: T.sub, textAlign: "center", padding: 6 }}>Nessuna fattura emessa</div>
              )}
            </div>

            {/* === ORDINI FORNITORE — COMPLETO === */}
            <div style={{ marginTop: 10, background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>📦 Ordini Fornitore</div>
                <button onClick={() => {
                  const ord = creaOrdineFornitore(c);
                  setOrdineDetail(ord.id);
                }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid #ff2d55`, background: "#ff2d5515", color: "#ff2d55", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Nuovo Ordine</button>
              </div>

              {/* Lista ordini della commessa */}
              {ordiniFornDB.filter(o => o.cmId === c.id).length > 0 ? (
                <div>
                  {ordiniFornDB.filter(o => o.cmId === c.id).map(o => {
                    const st = ORDINE_STATI.find(s => s.id === o.stato) || ORDINE_STATI[0];
                    const isOpen = ordineDetail === o.id;
                    const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";
                    const isLate = o.consegna?.prevista && new Date(o.consegna.prevista) < new Date() && o.stato !== "consegnato";

                    return (
                      <div key={o.id} style={{ marginBottom: 8 }}>
                        {/* Header ordine (clickabile per expand) */}
                        <div onClick={() => setOrdineDetail(isOpen ? null : o.id)} style={{
                          padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                          background: T.card, border: `1.5px solid ${isLate ? "#ff3b30" : st.color}30`,
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 16 }}>{st.icon}</span>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
                                  {o.fornitore?.nome || "Fornitore da inserire"} <span style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>N.{o.numero}/{o.anno}</span>
                                </div>
                                <div style={{ fontSize: 9, color: T.sub }}>
                                  {new Date(o.dataOrdine).toLocaleDateString("it-IT")} · {o.righe?.length || 0} articoli · €{fmt(o.totaleIva || 0)}
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 8, fontWeight: 700, background: st.color + "20", color: st.color }}>{st.label}</span>
                              <span style={{ fontSize: 12, color: T.sub, transform: isOpen ? "rotate(180deg)" : "none", transition: "all .2s" }}>▼</span>
                            </div>
                          </div>
                          {isLate && <div style={{ fontSize: 9, color: "#ff3b30", fontWeight: 700, marginTop: 4 }}>⚠️ Consegna in ritardo! Prevista: {new Date(o.consegna.prevista).toLocaleDateString("it-IT")}</div>}
                          {o.conferma?.firmata && !o.conferma?.reinviata && <div style={{ fontSize: 9, color: "#ff9500", fontWeight: 700, marginTop: 4 }}>📤 Conferma firmata — da reinviare al fornitore</div>}
                        </div>

                        {/* Dettaglio ordine espanso */}
                        {isOpen && (
                          <div style={{ marginTop: 6, padding: 12, background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>

                            {/* === 1. DATI FORNITORE === */}
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#ff2d55", textTransform: "uppercase", marginBottom: 6 }}>1. Fornitore</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                              <input value={o.fornitore?.nome || ""} onChange={e => updateOrdine(o.id, "fornitore.nome", e.target.value)} placeholder="Nome fornitore" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit", gridColumn: "1/3" }} />
                              <input value={o.fornitore?.referente || ""} onChange={e => updateOrdine(o.id, "fornitore.referente", e.target.value)} placeholder="Referente" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit" }} />
                              <input value={o.fornitore?.tel || ""} onChange={e => updateOrdine(o.id, "fornitore.tel", e.target.value)} placeholder="Telefono" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit" }} />
                              <input value={o.fornitore?.email || ""} onChange={e => updateOrdine(o.id, "fornitore.email", e.target.value)} placeholder="Email" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit" }} />
                              <input value={o.fornitore?.piva || ""} onChange={e => updateOrdine(o.id, "fornitore.piva", e.target.value)} placeholder="P.IVA" style={{ padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit" }} />
                            </div>

                            {/* === 2. RIGHE ORDINE === */}
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#ff2d55", textTransform: "uppercase", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                              <span>2. Articoli ordinati</span>
                              <span onClick={() => {
                                const newRiga = { id: "r_" + Math.random().toString(36).slice(2, 8), desc: "", misure: "", qta: 1, prezzoUnit: 0, totale: 0, note: "" };
                                updateOrdine(o.id, "righe", [...(o.righe || []), newRiga]);
                              }} style={{ color: "#007aff", cursor: "pointer", fontWeight: 700 }}>+ Aggiungi riga</span>
                            </div>
                            {(o.righe || []).map((r, ri) => (
                              <div key={r.id} style={{ display: "flex", gap: 4, marginBottom: 4, alignItems: "center" }}>
                                <span style={{ fontSize: 9, color: T.sub, width: 16 }}>{ri + 1}</span>
                                <input value={r.desc} onChange={e => {
                                  const righe = [...o.righe]; righe[ri] = { ...righe[ri], desc: e.target.value };
                                  updateOrdine(o.id, "righe", righe);
                                }} placeholder="Descrizione" style={{ flex: 2, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, fontFamily: "inherit" }} />
                                <input value={r.misure} onChange={e => {
                                  const righe = [...o.righe]; righe[ri] = { ...righe[ri], misure: e.target.value };
                                  updateOrdine(o.id, "righe", righe);
                                }} placeholder="LxH" style={{ width: 55, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4 }} />
                                <input type="number" value={r.qta || ""} onChange={e => {
                                  const righe = [...o.righe]; righe[ri] = { ...righe[ri], qta: parseInt(e.target.value) || 0 };
                                  updateOrdine(o.id, "righe", righe);
                                }} placeholder="Q" style={{ width: 32, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "center" }} />
                                <input type="number" value={r.prezzoUnit || ""} onChange={e => {
                                  const righe = [...o.righe]; righe[ri] = { ...righe[ri], prezzoUnit: parseFloat(e.target.value) || 0 };
                                  updateOrdine(o.id, "righe", righe); setTimeout(() => ricalcolaOrdine(o.id), 50);
                                }} placeholder="€" style={{ width: 55, padding: 5, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "right" }} />
                                <span style={{ fontSize: 9, fontWeight: 700, color: T.text, width: 55, textAlign: "right" }}>€{fmt(r.qta * r.prezzoUnit)}</span>
                                <span onClick={() => {
                                  const righe = o.righe.filter((_, i) => i !== ri);
                                  updateOrdine(o.id, "righe", righe); setTimeout(() => ricalcolaOrdine(o.id), 50);
                                }} style={{ fontSize: 12, cursor: "pointer", color: T.red }}>✕</span>
                              </div>
                            ))}
                            {/* Totali */}
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, marginTop: 6, paddingTop: 6, borderTop: `1px solid ${T.bdr}` }}>
                              <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
                                <span style={{ color: T.sub }}>Sconto %</span>
                                <input type="number" value={o.sconto || ""} onChange={e => { updateOrdine(o.id, "sconto", parseFloat(e.target.value) || 0); setTimeout(() => ricalcolaOrdine(o.id), 50); }} style={{ width: 40, padding: 3, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "center" }} />
                              </div>
                              <div style={{ fontSize: 10, color: T.sub }}>Imponibile: <b>€{fmt(o.totale || 0)}</b></div>
                              <div style={{ fontSize: 10, color: T.sub }}>IVA {o.iva || 22}%: <b>€{fmt((o.totale || 0) * (o.iva || 22) / 100)}</b></div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>TOTALE: €{fmt(o.totaleIva || 0)}</div>
                            </div>

                            {/* === 3. STATO + CONFERMA === */}
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#ff2d55", textTransform: "uppercase", marginTop: 12, marginBottom: 6 }}>3. Stato & Conferma</div>
                            {/* Barra stati */}
                            <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                              {ORDINE_STATI.map(s => (
                                <div key={s.id} onClick={() => updateOrdine(o.id, "stato", s.id)} style={{
                                  flex: 1, padding: "6px 2px", borderRadius: 6, cursor: "pointer", textAlign: "center",
                                  background: o.stato === s.id ? s.color + "20" : "transparent",
                                  border: `1.5px solid ${o.stato === s.id ? s.color : T.bdr}`,
                                }}>
                                  <div style={{ fontSize: 14 }}>{s.icon}</div>
                                  <div style={{ fontSize: 7, fontWeight: 700, color: o.stato === s.id ? s.color : T.sub }}>{s.label}</div>
                                </div>
                              ))}
                            </div>
                            {/* Conferma fornitore */}
                            <div style={{ padding: 8, background: o.conferma?.firmata ? "#34c75910" : "#ff950010", borderRadius: 8, border: `1px solid ${o.conferma?.firmata ? "#34c759" : "#ff9500"}30`, marginBottom: 8 }}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as any, alignItems: "center" }}>
                                <div onClick={() => updateOrdine(o.id, "conferma.ricevuta", !o.conferma?.ricevuta)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 9, fontWeight: 700, background: o.conferma?.ricevuta ? "#007aff20" : T.bg, color: o.conferma?.ricevuta ? "#007aff" : T.sub, border: `1px solid ${o.conferma?.ricevuta ? "#007aff" : T.bdr}` }}>
                                  {o.conferma?.ricevuta ? "✅ Conferma ricevuta" : "📩 Ricevi conferma"}
                                </div>
                                {o.conferma?.ricevuta && (
                                  <div onClick={() => updateOrdine(o.id, "conferma.verificata", !o.conferma?.verificata)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 9, fontWeight: 700, background: o.conferma?.verificata ? "#34c75920" : T.bg, color: o.conferma?.verificata ? "#34c759" : T.sub, border: `1px solid ${o.conferma?.verificata ? "#34c759" : T.bdr}` }}>
                                    {o.conferma?.verificata ? "✅ Verificata OK" : "🔍 Verifica"}
                                  </div>
                                )}
                                {o.conferma?.verificata && (
                                  <div onClick={() => {
                                    updateOrdine(o.id, "conferma.firmata", true);
                                    updateOrdine(o.id, "conferma.dataFirma", new Date().toISOString().split("T")[0]);
                                    updateOrdine(o.id, "stato", "confermato");
                                    if (o.cmId) setFaseTo(o.cmId, "produzione"); // AUTO-ADVANCE
                                  }} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 9, fontWeight: 700, background: o.conferma?.firmata ? "#34c75920" : "#ff950020", color: o.conferma?.firmata ? "#34c759" : "#ff9500", border: `1px solid ${o.conferma?.firmata ? "#34c759" : "#ff9500"}` }}>
                                    {o.conferma?.firmata ? `✅ Firmata ${o.conferma?.dataFirma || ""}` : "✍️ Firma conferma"}
                                  </div>
                                )}
                                {o.conferma?.firmata && (
                                  <div onClick={() => updateOrdine(o.id, "conferma.reinviata", true)} style={{ padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 9, fontWeight: 700, background: o.conferma?.reinviata ? "#34c75920" : "#5856d620", color: o.conferma?.reinviata ? "#34c759" : "#5856d6", border: `1px solid ${o.conferma?.reinviata ? "#34c759" : "#5856d6"}` }}>
                                    {o.conferma?.reinviata ? "✅ Reinviata" : "📤 Reinvia al fornitore"}
                                  </div>
                                )}
                              </div>
                              {o.conferma?.ricevuta && (
                                <textarea value={o.conferma?.differenze || ""} onChange={e => updateOrdine(o.id, "conferma.differenze", e.target.value)} placeholder="Note/differenze rispetto all'ordine originale..." rows={2} style={{ width: "100%", marginTop: 6, padding: 6, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit", resize: "vertical" as any }} />
                              )}
                            </div>

                            {/* === 4. CONSEGNA + PAGAMENTO === */}
                            <div style={{ fontSize: 9, fontWeight: 700, color: "#ff2d55", textTransform: "uppercase", marginBottom: 6 }}>4. Consegna & Pagamento</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>⏱ Settimane produzione</div>
                                <input type="number" value={o.consegna?.settimane || ""} onChange={e => {
                                  const sett = parseInt(e.target.value) || 0;
                                  updateOrdine(o.id, "consegna.settimane", sett);
                                  if (sett > 0) {
                                    const prevista = new Date(o.dataOrdine);
                                    prevista.setDate(prevista.getDate() + sett * 7);
                                    updateOrdine(o.id, "consegna.prevista", prevista.toISOString().split("T")[0]);
                                  }
                                }} placeholder="0" style={{ width: "100%", padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6 }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>📅 Consegna prevista</div>
                                <input type="date" value={o.consegna?.prevista || ""} onChange={e => updateOrdine(o.id, "consegna.prevista", e.target.value)} style={{ width: "100%", padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6 }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>🚛 Consegna effettiva</div>
                                <input type="date" value={o.consegna?.effettiva || ""} onChange={e => {
                                  updateOrdine(o.id, "consegna.effettiva", e.target.value);
                                  if (e.target.value) updateOrdine(o.id, "stato", "consegnato");
                                }} style={{ width: "100%", padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6 }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>💳 Termini pagamento</div>
                                <select value={o.pagamento?.termini || "30gg_fm"} onChange={e => {
                                  updateOrdine(o.id, "pagamento.termini", e.target.value);
                                  updateOrdine(o.id, "pagamento.scadenza", calcolaScadenzaPagamento(o.dataOrdine, e.target.value));
                                }} style={{ width: "100%", padding: 6, fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card }}>
                                  <option value="anticipato">Anticipato</option>
                                  <option value="30gg_fm">30gg FM</option>
                                  <option value="60gg_fm">60gg FM</option>
                                  <option value="90gg_fm">90gg FM</option>
                                  <option value="ricevuta_merce">A ricevimento merce</option>
                                </select>
                              </div>
                            </div>
                            {/* Scadenza pagamento + stato */}
                            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, padding: 8, background: o.pagamento?.pagato ? "#34c75910" : T.bg, borderRadius: 6, border: `1px solid ${T.bdr}` }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 9, color: T.sub }}>Scadenza: <b>{o.pagamento?.scadenza ? new Date(o.pagamento.scadenza).toLocaleDateString("it-IT") : "—"}</b></div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>€{fmt(o.pagamento?.importo || o.totaleIva || 0)}</div>
                              </div>
                              <div onClick={() => {
                                updateOrdine(o.id, "pagamento.pagato", !o.pagamento?.pagato);
                                if (!o.pagamento?.pagato) updateOrdine(o.id, "pagamento.dataPagamento", new Date().toISOString().split("T")[0]);
                              }} style={{
                                padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 10,
                                background: o.pagamento?.pagato ? "#34c75920" : "#ff3b3020",
                                color: o.pagamento?.pagato ? "#34c759" : "#ff3b30",
                                border: `1.5px solid ${o.pagamento?.pagato ? "#34c759" : "#ff3b30"}`,
                              }}>
                                {o.pagamento?.pagato ? "✅ Pagato" : "⏳ Da pagare"}
                              </div>
                            </div>

                            {/* === 5. AZIONI === */}
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any }}>
                              <button onClick={() => generaOrdinePDF(o)} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1.5px solid #007aff`, background: "#007aff15", color: "#007aff", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📄 PDF Ordine</button>
                              {o.conferma?.firmata && <button onClick={() => generaConfermaFirmataPDF(o)} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1.5px solid #34c759`, background: "#34c75915", color: "#34c759", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📄 PDF Conferma</button>}
                              <button onClick={() => inviaOrdineFornitore(o, "email")} style={{ padding: 8, borderRadius: 8, border: `1.5px solid #5856d6`, background: "#5856d615", color: "#5856d6", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📧</button>
                              <button onClick={() => inviaOrdineFornitore(o, "whatsapp")} style={{ padding: 8, borderRadius: 8, border: `1.5px solid #25d366`, background: "#25d36615", color: "#25d366", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>💬</button>
                              <button onClick={() => { if (confirm("Eliminare ordine?")) setOrdiniFornDB(prev => prev.filter(x => x.id !== o.id)); }} style={{ padding: 8, borderRadius: 8, border: `1.5px solid #ff3b30`, background: "#ff3b3015", color: "#ff3b30", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🗑</button>
                            </div>

                            {/* Riepilogo margine */}
                            {(() => {
                              const totPreventivo = calcolaTotaleCommessa(c);
                              const margine = totPreventivo - (o.totale || 0);
                              const marginePct = totPreventivo > 0 ? Math.round(margine / totPreventivo * 100) : 0;
                              return o.totale > 0 ? (
                                <div style={{ marginTop: 8, padding: 8, background: margine > 0 ? "#34c75910" : "#ff3b3010", borderRadius: 8, border: `1px solid ${margine > 0 ? "#34c759" : "#ff3b30"}30`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ fontSize: 10, color: T.sub }}>Preventivo €{fmt(totPreventivo)} − Costo €{fmt(o.totale)}</span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: margine > 0 ? "#34c759" : "#ff3b30" }}>Margine: €{fmt(margine)} ({marginePct}%)</span>
                                </div>
                              ) : null;
                            })()}

                            <textarea value={o.note || ""} onChange={e => updateOrdine(o.id, "note", e.target.value)} placeholder="Note ordine..." rows={2} style={{ width: "100%", marginTop: 8, padding: 6, fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 6, fontFamily: "inherit", resize: "vertical" as any }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: T.sub, textAlign: "center", padding: 10 }}>
                  Nessun ordine fornitore.<br />Premi "+ Nuovo Ordine" per creare un ordine con le righe della commessa.
                </div>
              )}
            </div>

            {/* === PIANIFICAZIONE MONTAGGIO === */}
            <div style={{ marginTop: 10, background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>🔧 Montaggio</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => {
                    const m = creaMontaggio(c);
                    setCalMontaggiTarget(m.id);
                    setShowCalMontaggi(true);
                  }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid #30b0c7`, background: "#30b0c715", color: "#30b0c7", fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Pianifica</button>
                  <button onClick={() => { setCalMontaggiTarget(null); setShowCalMontaggi(!showCalMontaggi); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: showCalMontaggi ? T.acc + "15" : "transparent", color: showCalMontaggi ? T.acc : T.sub, fontSize: 9, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📅 Calendario</button>
                </div>
              </div>

              {/* Calendario visuale montaggi */}
              {showCalMontaggi && (
                <div style={{ marginBottom: 10 }}>
                  {calMontaggiTarget && (
                    <div style={{ fontSize: 10, color: T.acc, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>
                      👆 Clicca su uno slot libero per assegnare data e squadra
                    </div>
                  )}
                  {<CalendarioMontaggi targetMontaggioId={calMontaggiTarget || undefined} />}
                </div>
              )}

              {montaggiDB.filter(m => m.cmId === c.id).length > 0 ? (
                <div>
                  {montaggiDB.filter(m => m.cmId === c.id).map(m => {
                    const sq = squadreDB.find(s => s.id === m.squadraId);
                    return (
                      <div key={m.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.bdr}` }}>
                        <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                          <select value={m.squadraId} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, squadraId: e.target.value } : x))} style={{ ...S.select, fontSize: 11, flex: 1, padding: "6px" }}>
                            {squadreDB.map(s => <option key={s.id} value={s.id}>{s.nome} ({s.membri.join(", ")})</option>)}
                          </select>
                          <select value={m.durata} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, durata: e.target.value } : x))} style={{ ...S.select, fontSize: 11, width: 100, padding: "6px" }}>
                            <option value="mezza">½ giornata</option>
                            <option value="giornata">1 giornata</option>
                            <option value="2giorni">2 giorni</option>
                            <option value="3giorni">3 giorni</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="date" value={m.data} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, data: e.target.value } : x))} style={{ flex: 1, padding: "6px", fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6 }} />
                          <input type="time" value={m.oraInizio} onChange={e => setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, oraInizio: e.target.value } : x))} style={{ width: 80, padding: "6px", fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6 }} />
                          <div onClick={() => {
                            const upd = { ...m, stato: m.stato === "pianificato" ? "in_corso" : m.stato === "in_corso" ? "completato" : "pianificato" };
                            setMontaggiDB(prev => prev.map(x => x.id === m.id ? upd : x));
                          }} style={{ padding: "4px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer",
                            background: m.stato === "completato" ? "#34c75920" : m.stato === "in_corso" ? "#ff950020" : T.bg,
                            color: m.stato === "completato" ? "#34c759" : m.stato === "in_corso" ? "#ff9500" : T.sub,
                            border: `1px solid ${m.stato === "completato" ? "#34c759" : m.stato === "in_corso" ? "#ff9500" : T.bdr}`
                          }}>
                            {m.stato === "completato" ? "✅ Fatto" : m.stato === "in_corso" ? "🔧 In corso" : "📅 Pianif."}
                          </div>
                          <div onClick={() => { setCalMontaggiTarget(m.id); setShowCalMontaggi(true); }} style={{ fontSize: 12, cursor: "pointer", color: T.acc }}>📅</div>
                          <div onClick={() => setMontaggiDB(prev => prev.filter(x => x.id !== m.id))} style={{ fontSize: 14, cursor: "pointer", color: T.red }}>🗑</div>
                        </div>
                        {sq && <div style={{ fontSize: 9, color: sq.colore, fontWeight: 600, marginTop: 4 }}>👷 {sq.nome}: {sq.membri.join(", ")}</div>}
                        {m.data && <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>📅 {new Date(m.data).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })} ore {m.oraInizio} · {m.durata === "mezza" ? "½ giornata" : m.durata === "2giorni" ? "2 giorni" : m.durata === "3giorni" ? "3 giorni" : "1 giornata"}</div>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: T.sub, textAlign: "center", padding: 6 }}>Nessun montaggio pianificato</div>
              )}
            </div>

            {/* === TRACKING CLIENTE === */}
            {c.trackingStato && (
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <button onClick={() => generaTrackingCliente(c)} style={{ flex: 1, padding: 10, borderRadius: 10, border: `1.5px solid #5856d6`, background: "#5856d615", color: "#5856d6", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  📱 Pagina Tracking Cliente
                </button>
                <button onClick={() => {
                  const msg = `Gentile ${c.cliente}, può seguire lo stato del suo ordine ${c.code} a questo link: [link pagina tracking]`;
                  const tel = (c.telefono || "").replace(/\D/g, "");
                  window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${encodeURIComponent(msg)}`, "_blank");
                }} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid #25d366`, background: "#25d36615", color: "#25d366", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  💬
                </button>
              </div>
            )}

            {/* Dati fiscali cliente */}
            <div style={{ marginTop: 10, background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>🏛 Dati fiscali cliente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["cf", "Codice Fiscale", c.cf],
                  ["piva", "P.IVA", c.piva],
                  ["sdi", "Codice SDI", c.sdi],
                  ["pec", "PEC", c.pec],
                  ["email", "Email", c.email],
                ].map(([field, label, val]) => (
                  <div key={field}>
                    <div style={{ fontSize: 8, color: T.sub, marginBottom: 1 }}>{label}</div>
                    <input style={{ ...S.input, fontSize: 11, padding: "5px 8px", width: "100%", boxSizing: "border-box" }} placeholder={label} value={val || ""} onChange={e => { const upd = { ...c, [field]: e.target.value }; setCantieri(cs => cs.map(x => x.id === c.id ? upd : x)); setSelectedCM(upd); }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
