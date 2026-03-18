"use client";
// @ts-nocheck
// MASTRO — DesktopCommesse.tsx
// Vista desktop Commesse: pipeline + lista master + dettaglio + configuratore inline

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I, Ico } from "./mastro-constants";
import ConfiguratoreCommessa from "./ConfiguratoreCommessa";
import CMDetailPanel from "./CMDetailPanel";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", BLUE="#3B7FE0", AMBER="#E8A020", PURPLE="#8B5CF6";

export default function DesktopCommesse() {
  const { T, PIPELINE=[], cantieri=[], filtered=[], selectedCM, setSelectedCM,
    filterFase, setFilterFase, searchQ, setSearchQ, setShowModal,
    getVaniAttivi, giorniFermaCM, sogliaDays=7, calcolaVanoPrezzo,
    fattureDB=[], ordiniFornDB=[], montaggiDB=[], msgs=[], tasks=[] } = useMastro();

  const [detTab, setDetTab] = useState<"vani"|"preventivo"|"ordini"|"montaggi"|"fatture"|"docs"|"timeline"|"messaggi">("vani");
  const [showCfg, setShowCfg] = useState(false);
  const [viewMode, setViewMode] = useState<"lista"|"kanban">("lista");
  const TODAY = new Date().toISOString().split("T")[0];

  const isFerma = (c:any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScad = (c:any) => c.scadenza && c.scadenza < TODAY;
  const getFase = (c:any) => PIPELINE.find((p:any) => p.id === c.fase) || { nome: c.fase, color: TEAL };
  const getProgress = (c:any) => { const i = PIPELINE.findIndex((p:any) => p.id === c.fase); return i >= 0 ? Math.round((i+1)/PIPELINE.length*100) : 0; };
  const fmtE = (n:number) => n > 0 ? "€"+Math.round(n).toLocaleString("it-IT") : "—";
  const initials = (c:any) => ((c.cliente||"?")[0]+(c.cognome||"")[0]).toUpperCase();

  // Totali pipeline
  const pipeStats = PIPELINE.filter((p:any)=>p.attiva).map((p:any) => ({
    ...p, count: cantieri.filter(c=>c.fase===p.id).length,
    euro: cantieri.filter(c=>c.fase===p.id).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0)
  })).filter(p=>p.count>0);
  const totAttive = cantieri.filter(c=>c.fase!=="chiusura").length;
  const totValore = cantieri.filter(c=>c.fase!=="chiusura").reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const fermeCount = cantieri.filter(c=>isFerma(c)).length;

  // Dati commessa selezionata
  const cm = selectedCM;
  const vaniCm = cm ? (getVaniAttivi ? getVaniAttivi(cm) : (cm.vani||[]).filter((v:any)=>!v.eliminato)) : [];
  const ordiniCm = cm ? ordiniFornDB.filter((o:any)=>o.cmId===cm.id) : [];
  const fattureCm = cm ? fattureDB.filter((f:any)=>f.cmId===cm.id) : [];
  const montaggiCm = cm ? montaggiDB.filter((m:any)=>m.cmId===cm.id||m.commessaId===cm.id) : [];
  const msgsCm = cm ? msgs.filter((m:any)=>m.cm===cm.code) : [];
  const totCm = cm ? vaniCm.reduce((s:number,v:any)=>s+(calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0),0) : 0;
  const ivaPerc = cm?.ivaPerc || 10;
  const totCmIva = Math.round(totCm*(1+ivaPerc/100));
  const fatturatoCm = fattureCm.reduce((s:number,f:any)=>s+(f.importo||0),0);
  const saldoCm = totCmIva - fatturatoCm;

  const S = {
    wrap: { display:"flex", height:"100%", flexDirection:"column" as any, background:"#F4F6F8" },
    // pipeline
    pipe: { background:"#fff", borderBottom:`1px solid ${T.bdr}`, padding:"8px 16px", flexShrink:0 },
    pipeLabel: { fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" as any, color:T.sub, marginBottom:6 },
    pipeTrack: { display:"flex", gap:3, height:26 },
    pipeSeg: (color:string, flex:number, active:boolean) => ({ flex, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#fff", cursor:"pointer", opacity:active?1:0.6, transition:"opacity .15s", whiteSpace:"nowrap" as any, padding:"0 6px", background:color, minWidth:0, overflow:"hidden" }),
    // body
    body: { flex:1, display:"flex", overflow:"hidden" },
    // lista
    lista: { width:260, flexShrink:0, background:"#fff", borderRight:`1px solid ${T.bdr}`, display:"flex", flexDirection:"column" as any, overflow:"hidden" },
    listaHdr: { padding:"10px 12px 8px", borderBottom:`1px solid ${T.bdr}`, flexShrink:0 },
    cmRow: (active:boolean) => ({ padding:"9px 12px", borderBottom:`1px solid ${T.bdr}`, cursor:"pointer", display:"flex", gap:8, alignItems:"flex-start", background:active?"rgba(26,158,115,0.06)":"transparent", borderLeft:`2px solid ${active?TEAL:"transparent"}` }),
    cmAv: (color:string) => ({ width:30, height:30, borderRadius:8, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color, flexShrink:0 }),
    // dettaglio
    det: { flex:1, display:"flex", flexDirection:"column" as any, overflow:"hidden", background:"#fff", borderRight:`1px solid ${T.bdr}` },
    detHdr: { padding:"10px 14px 0", borderBottom:`1px solid ${T.bdr}`, flexShrink:0 },
    detTabs: { display:"flex", gap:0, marginTop:8 },
    detTab: (active:boolean) => ({ padding:"6px 10px", fontSize:11, fontWeight:500, color:active?TEAL:T.sub, borderBottom:`2px solid ${active?TEAL:"transparent"}`, cursor:"pointer", whiteSpace:"nowrap" as any }),
    detBody: { flex:1, overflowY:"auto" as any, padding:"12px 14px" },
    // pannello dx
    panel: { width:320, flexShrink:0, background:"#F8FAFC", borderLeft:`1px solid ${T.bdr}`, display:"flex", flexDirection:"column" as any, overflow:"hidden" },
    panelHdr: { padding:"10px 14px", background:"#fff", borderBottom:`1px solid ${T.bdr}`, flexShrink:0 },
  };

  const StatCard = ({l,v,c="",sub=""}:{l:string,v:string|number,c?:string,sub?:string}) => (
    <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px"}}>
      <div style={{fontSize:10,color:T.sub}}>{l}</div>
      <div style={{fontSize:16,fontWeight:500,color:c||T.text,fontFamily:FM}}>{v}</div>
      {sub&&<div style={{fontSize:10,color:T.sub}}>{sub}</div>}
    </div>
  );

  const VanoRow = ({v,i}:{v:any,i:number}) => {
    const p = calcolaVanoPrezzo ? calcolaVanoPrezzo(v,cm) : 0;
    const m = v.misure||{};
    return (
      <div style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,cursor:"pointer",background:"#fff"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,borderRadius:6,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500,color:T.text}}>{v.nome||`Vano ${i+1}`}</div>
            <div style={{fontSize:11,color:T.sub}}>{v.tipo||"—"} · {m.lCentro||"?"}×{m.hCentro||"?"} mm{v.sistema?` · ${v.sistema}`:""}</div>
          </div>
          <div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:FM,flexShrink:0}}>{p>0?fmtE(p*(v.pezzi||1)):"—"}</div>
        </div>
      </div>
    );
  };

  if (showCfg && cm) return <ConfiguratoreCommessa commessa={cm} onClose={()=>setShowCfg(false)}/>;

  return (
    <div style={S.wrap}>
      {/* PIPELINE BAR */}
      <div style={S.pipe}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={S.pipeLabel}>PIPELINE</span>
            <span style={{fontSize:11,color:T.sub}}>{totAttive} attive · {fmtE(totValore)}</span>
            {fermeCount>0&&<span style={{fontSize:10,fontWeight:700,color:RED,background:RED+"12",padding:"1px 7px",borderRadius:5}}>{fermeCount} ferme</span>}
          </div>
          <div style={{display:"flex",gap:4}}>
            <div onClick={()=>setViewMode("lista")} style={{padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:viewMode==="lista"?"#1A1A1C":"transparent",color:viewMode==="lista"?"#fff":T.sub,border:`0.5px solid ${T.bdr}`}}>Lista</div>
            <div onClick={()=>setViewMode("kanban")} style={{padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:viewMode==="kanban"?"#1A1A1C":"transparent",color:viewMode==="kanban"?"#fff":T.sub,border:`0.5px solid ${T.bdr}`}}>Kanban</div>
            <div onClick={()=>setShowModal("commessa")} style={{padding:"3px 10px",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer",background:TEAL,color:"#fff",border:"none"}}>+ Commessa</div>
          </div>
        </div>
        <div style={S.pipeTrack}>
          {[{id:"tutte",nome:"Tutte",color:DARK,count:totAttive,euro:totValore},...pipeStats].map((p:any)=>{
            const sel=filterFase===p.id;
            const flex = p.id==="tutte" ? 0 : Math.max(1,p.count);
            return (
              <div key={p.id} onClick={()=>setFilterFase(sel&&p.id!=="tutte"?"tutte":p.id)}
                style={{...S.pipeSeg(p.color||TEAL,flex,sel),minWidth:p.id==="tutte"?60:undefined}}>
                {p.nome} {p.count}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 COLONNE */}
      <div style={S.body}>

        {/* COL 1 — LISTA */}
        <div style={S.lista}>
          <div style={S.listaHdr}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:500,color:T.sub}}>{filtered.length} commesse</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"#F8FAFC",borderRadius:7,border:`0.5px solid ${T.bdr}`}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cerca..." style={{border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",width:"100%",fontFamily:FF}}/>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {filtered.map((c:any) => {
              const fase=getFase(c); const ferma=isFerma(c); const scad=isScad(c); const alert=ferma||scad;
              const col=alert?RED:fase.color||TEAL; const prog=getProgress(c);
              return (
                <div key={c.id} onClick={()=>{setSelectedCM(c);setDetTab("vani");}} style={S.cmRow(selectedCM?.id===c.id)}>
                  <div style={S.cmAv(col)}>{initials(c)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <span style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{c.cliente}{c.cognome?" "+c.cognome:""}</span>
                      {alert&&<div style={{width:5,height:5,borderRadius:"50%",background:RED,flexShrink:0}}/>}
                    </div>
                    <div style={{fontSize:10,color:T.sub,marginTop:1}}>{c.code} · {ferma?`Ferma ${giorniFermaCM(c)}gg`:scad?"Scaduta":fase.nome}</div>
                    <div style={{height:2,background:T.bg,borderRadius:1,marginTop:4,overflow:"hidden"}}>
                      <div style={{height:"100%",width:prog+"%",background:col,borderRadius:1}}/>
                    </div>
                  </div>
                  {c.euro&&<div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,flexShrink:0}}>{fmtE(parseFloat(c.euro))}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* COL 2 — DETTAGLIO */}
        <div style={S.det}>
          {!cm ? (
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as any,gap:10,color:T.sub}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{fontSize:13}}>Seleziona una commessa</span>
            </div>
          ) : (
            <>
              <div style={S.detHdr}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:500,color:T.text}}>{cm.cliente}{cm.cognome?" "+cm.cognome:""}</div>
                    <div style={{fontSize:11,color:T.sub,marginTop:2}}>{cm.code} · {cm.indirizzo||"—"}{isFerma(cm)?<span style={{color:RED,fontWeight:500}}> · Ferma {giorniFermaCM(cm)}gg</span>:""}</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setShowCfg(true)} style={{padding:"5px 10px",borderRadius:6,background:TEAL,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Configura</button>
                    <button onClick={()=>{}} style={{padding:"5px 10px",borderRadius:6,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>PDF</button>
                  </div>
                </div>
                {/* KPI mini */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:6}}>
                  {[
                    {l:"Totale",v:fmtE(totCm),c:T.text},
                    {l:`+IVA ${ivaPerc}%`,v:fmtE(totCmIva),c:T.text},
                    {l:"Fatturato",v:fmtE(fatturatoCm),c:TEAL},
                    {l:"Saldo",v:fmtE(saldoCm),c:saldoCm>0?RED:TEAL},
                  ].map((k,i)=>(
                    <div key={i} style={{background:"#F8FAFC",borderRadius:6,padding:"5px 8px"}}>
                      <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                      <div style={{fontSize:13,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                {/* Tabs */}
                <div style={S.detTabs}>
                  {([["vani","Vani "+vaniCm.length],["preventivo","Preventivo"],["ordini","Ordini "+ordiniCm.length],["montaggi","Montaggi "+montaggiCm.length],["fatture","Fatture "+fattureCm.length],["messaggi","Msg "+msgsCm.length],["timeline","Timeline"]] as [string,string][]).map(([id,l])=>(
                    <div key={id} onClick={()=>setDetTab(id as any)} style={S.detTab(detTab===id)}>{l}</div>
                  ))}
                </div>
              </div>
              <div style={S.detBody}>
                {detTab==="vani"&&<>
                  {vaniCm.length===0?<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:20}}>Nessun vano — usa il Configuratore</div>
                  :vaniCm.map((v:any,i:number)=><VanoRow key={v.id||i} v={v} i={i}/>)}
                  <div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:"#F8FAFC",border:`0.5px solid ${T.bdr}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:11,color:T.sub}}>Totale {vaniCm.length} vani · {vaniCm.reduce((s:number,v:any)=>s+(v.pezzi||1),0)} pz</span>
                    <span style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:FM}}>{fmtE(totCm)}</span>
                  </div>
                </>}
                {detTab==="ordini"&&<>
                  {ordiniCm.length===0?<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:20}}>Nessun ordine fornitore</div>
                  :ordiniCm.map((o:any,i:number)=>(
                    <div key={o.id||i} style={{padding:"9px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:28,height:28,borderRadius:7,background:AMBER+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text}}>{typeof o.fornitore==="object"?o.fornitore?.nome:o.fornitore||"Fornitore"}</div>
                        <div style={{fontSize:10,color:T.sub}}>{o.data||"—"} · {o.conferma?.ricevuta?"Confermato":"In attesa"}</div>
                      </div>
                      {o.totaleIva&&<div style={{fontSize:12,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(o.totaleIva)}</div>}
                    </div>
                  ))}
                </>}
                {detTab==="montaggi"&&<>
                  {montaggiCm.length===0?<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:20}}>Nessun montaggio pianificato</div>
                  :montaggiCm.map((m:any,i:number)=>(
                    <div key={m.id||i} style={{padding:"9px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:28,height:28,borderRadius:7,background:PURPLE+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text}}>{m.data||"—"} · {m.ora||""}</div>
                        <div style={{fontSize:10,color:T.sub}}>{m.squadra||m.squadraNome||"—"} · {m.stato||"pianificato"}</div>
                      </div>
                    </div>
                  ))}
                </>}
                {detTab==="fatture"&&<>
                  {fattureCm.length===0?<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:20}}>Nessuna fattura</div>
                  :fattureCm.map((f:any,i:number)=>(
                    <div key={f.id||i} style={{padding:"9px 10px",borderRadius:8,border:`0.5px solid ${f.pagata?T.bdr:RED+"30"}`,marginBottom:6,background:f.pagata?"#fff":RED+"04",display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text}}>{f.numero||"Fattura"} · {f.tipo||"fattura"}</div>
                        <div style={{fontSize:10,color:T.sub}}>{f.data||"—"} · {f.pagata?"Pagata":"Da incassare"}</div>
                      </div>
                      <div style={{fontSize:13,fontWeight:500,color:f.pagata?TEAL:RED,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
                    </div>
                  ))}
                </>}
                {detTab==="messaggi"&&<>
                  {msgsCm.length===0?<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:20}}>Nessun messaggio</div>
                  :msgsCm.slice(-10).map((m:any,i:number)=>(
                    <div key={m.id||i} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,background:"#fff"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:500,color:T.text}}>{m.from||m.mittente||"—"}</span>
                        <span style={{fontSize:10,color:T.sub}}>{m.ora||m.data||"—"}</span>
                      </div>
                      <div style={{fontSize:11,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.testo||m.text||"—"}</div>
                    </div>
                  ))}
                </>}
                {detTab==="preventivo"&&<>
                  <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:10}}>
                    <div style={{padding:"8px 12px",background:"#F8FAFC",borderBottom:`0.5px solid ${T.bdr}`,fontSize:10,fontWeight:700,color:T.sub,display:"grid",gridTemplateColumns:"1fr 80px 60px 70px",gap:8,textTransform:"uppercase" as any,letterSpacing:0.4}}>
                      <span>Descrizione</span><span style={{textAlign:"center" as any}}>Misure</span><span style={{textAlign:"center" as any}}>Q.</span><span style={{textAlign:"right" as any}}>Prezzo</span>
                    </div>
                    {vaniCm.map((v:any,i:number)=>{
                      const p=calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0;
                      const m=v.misure||{};
                      return (
                        <div key={v.id||i} style={{padding:"8px 12px",borderBottom:i<vaniCm.length-1?`0.5px solid ${T.bdr}`:"none",display:"grid",gridTemplateColumns:"1fr 80px 60px 70px",gap:8,alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:12,fontWeight:500,color:T.text}}>{v.nome||`Vano ${i+1}`}</div>
                            <div style={{fontSize:10,color:T.sub}}>{v.tipo} · {v.sistema||"—"}</div>
                          </div>
                          <div style={{fontSize:11,color:T.sub,textAlign:"center" as any,fontFamily:FM}}>{m.lCentro&&m.hCentro?`${m.lCentro}×${m.hCentro}`:"—"}</div>
                          <div style={{fontSize:12,fontWeight:500,color:T.text,textAlign:"center" as any}}>{v.pezzi||1}</div>
                          <div style={{fontSize:12,fontWeight:500,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{fmtE(p*(v.pezzi||1))}</div>
                        </div>
                      );
                    })}
                    <div style={{padding:"9px 12px",background:DARK,display:"grid",gridTemplateColumns:"1fr 80px 60px 70px",gap:8}}>
                      <div style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.7)",gridColumn:"1/4"}}>Totale IVA esclusa</div>
                      <div style={{fontSize:14,fontWeight:700,color:"#fff",textAlign:"right" as any,fontFamily:FM}}>{fmtE(totCm)}</div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:10,color:T.sub}}>IVA {ivaPerc}%</div>
                      <div style={{fontSize:14,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(totCmIva-totCm)}</div>
                    </div>
                    <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px"}}>
                      <div style={{fontSize:10,color:T.sub}}>Totale IVA inclusa</div>
                      <div style={{fontSize:16,fontWeight:700,color:T.text,fontFamily:FM}}>{fmtE(totCmIva)}</div>
                    </div>
                  </div>
                </>}
                {detTab==="timeline"&&(
                  <div style={{display:"flex",flexDirection:"column" as any,gap:1}}>
                    {(cm.log||[]).slice().reverse().map((l:any,i:number)=>(
                      <div key={i} style={{display:"flex",gap:10,padding:"7px 0",borderBottom:`0.5px solid ${T.bdr}`}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:l.color||TEAL,marginTop:5,flexShrink:0}}/>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,color:T.text}}><b>{l.chi}</b> {l.cosa}</div>
                          <div style={{fontSize:10,color:T.sub}}>{l.quando}</div>
                        </div>
                      </div>
                    ))}
                    {(!cm.log||cm.log.length===0)&&<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:20}}>Nessuna attività registrata</div>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* COL 3 — PANNELLO CONTESTUALE */}
        <div style={S.panel}>
          <div style={S.panelHdr}>
            <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>Riepilogo aziendale</div>
          </div>
          <div style={{flex:1,overflowY:"auto" as any,padding:"12px 14px"}}>
            {/* KPI AZIENDA */}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Oggi</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
              <StatCard l="Commesse attive" v={totAttive} c={TEAL}/>
              <StatCard l="Commesse ferme" v={fermeCount} c={fermeCount>0?RED:TEAL}/>
              <StatCard l="Valore pipeline" v={fmtE(totValore)}/>
              <StatCard l="Ordini in corso" v={ordiniFornDB.filter((o:any)=>o.stato!=="consegnato").length} c={AMBER}/>
              <StatCard l="Montaggi programmati" v={montaggiDB.filter((m:any)=>m.data>=TODAY&&m.stato!=="completato").length} c={PURPLE}/>
              <StatCard l="Fatture scadute" v={fattureDB.filter((f:any)=>!f.pagata&&f.scadenza<TODAY).length} c={RED}/>
            </div>
            {/* PIPELINE BREAKDOWN */}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Pipeline per fase</div>
            <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:14}}>
              {pipeStats.map((p:any,i:number)=>(
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",borderBottom:i<pipeStats.length-1?`0.5px solid ${T.bdr}`:"none",cursor:"pointer"}}
                  onClick={()=>setFilterFase(p.id)}>
                  <div style={{width:8,height:8,borderRadius:2,background:p.color||TEAL,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:11,color:T.text}}>{p.nome}</div>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,fontFamily:FM}}>{p.count}</div>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,minWidth:60,textAlign:"right" as any}}>{fmtE(p.euro)}</div>
                </div>
              ))}
            </div>
            {/* PROSSIMI MONTAGGI */}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Prossimi montaggi</div>
            <div style={{display:"flex",flexDirection:"column" as any,gap:5,marginBottom:14}}>
              {montaggiDB.filter((m:any)=>m.data>=TODAY).slice(0,4).map((m:any,i:number)=>(
                <div key={i} style={{padding:"7px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{width:26,height:26,borderRadius:6,background:PURPLE+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:PURPLE,flexShrink:0,fontFamily:FM}}>{(m.data||"").split("-").slice(1).join("/")}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.cliente||m.commessa||"—"}</div>
                    <div style={{fontSize:10,color:T.sub}}>{m.squadraNome||m.squadra||"—"}</div>
                  </div>
                </div>
              ))}
              {montaggiDB.filter((m:any)=>m.data>=TODAY).length===0&&<div style={{fontSize:11,color:T.sub}}>Nessun montaggio programmato</div>}
            </div>
            {/* MESSAGGI NON LETTI */}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Messaggi recenti</div>
            {msgs.filter((m:any)=>!m.letto).slice(0,3).map((m:any,i:number)=>(
              <div key={i} style={{padding:"7px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#fff",marginBottom:5}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:11,fontWeight:500,color:T.text}}>{m.from||"—"}</span>
                  <span style={{fontSize:9,color:T.sub}}>{m.ora||""}</span>
                </div>
                <div style={{fontSize:10,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.testo||m.text||"—"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
