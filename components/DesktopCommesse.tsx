"use client";
// @ts-nocheck
// MASTRO — DesktopCommesse v2
// Tab Sopralluogo + design system corretto + filtri avanzati

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I, Ico } from "./mastro-constants";
import ConfiguratoreCommessa from "./ConfiguratoreCommessa";
import CMDetailPanel from "./CMDetailPanel";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",BLU="#3B7FE0",AMB="#D08008",PUR="#8B5CF6",ORG="#F97316";

const TIPO_RILIEVO = [
  { id:"orientativo", label:"Orientativo", desc:"Misure indicative, da riconfirmare", color:AMB },
  { id:"definitivo",  label:"Definitivo",  desc:"Misure confermate, si può ordinare", color:TEAL },
  { id:"ricontrollo", label:"Da ricontrollare", desc:"Anomalie rilevate, necessario sopralluogo", color:RED },
  { id:"modifica",    label:"Modifica cantiere", desc:"Variazione rispetto al sopralluogo precedente", color:PUR },
];

export default function DesktopCommesse() {
  const { T, PIPELINE=[], cantieri=[], filtered=[], selectedCM, setSelectedCM,
    filterFase, setFilterFase, searchQ, setSearchQ, setShowModal,
    getVaniAttivi, giorniFermaCM, sogliaDays=7, calcolaVanoPrezzo,
    fattureDB=[], ordiniFornDB=[], montaggiDB=[], msgs=[], tasks=[], team=[] } = useMastro();

  const [detTab, setDetTab] = useState<string>("sopralluogo");
  const [showCfg, setShowCfg] = useState(false);
  const [viewMode, setViewMode] = useState<"lista"|"kanban">("lista");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ ferme: false, urgenti: false, operatore: "" });
  const TODAY = new Date().toISOString().split("T")[0];

  const isFerma = (c:any) => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura";
  const isScad = (c:any) => c.scadenza && c.scadenza < TODAY;
  const getFase = (c:any) => PIPELINE.find((p:any) => p.id === c.fase) || { nome: c.fase, color: TEAL };
  const getProgress = (c:any) => { const i = PIPELINE.findIndex((p:any) => p.id === c.fase); return i >= 0 ? Math.round((i+1)/PIPELINE.length*100) : 0; };
  const fmtE = (n:number) => n > 0 ? "€"+Math.round(n).toLocaleString("it-IT") : "—";
  const initials = (c:any) => ((c.cliente||"?")[0]+(c.cognome||"")[0]).toUpperCase();

  const pipeStats = PIPELINE.filter((p:any)=>p.attiva).map((p:any) => ({
    ...p, count: cantieri.filter(c=>c.fase===p.id).length,
    euro: cantieri.filter(c=>c.fase===p.id).reduce((s:number,c:any)=>s+(parseFloat(c.euro)||0),0)
  })).filter(p=>p.count>0);
  const totAttive = cantieri.filter(c=>c.fase!=="chiusura").length;
  const totValore = cantieri.filter(c=>c.fase!=="chiusura").reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const fermeCount = cantieri.filter(c=>isFerma(c)).length;

  const cm = selectedCM;
  const vaniCm = cm ? (getVaniAttivi ? getVaniAttivi(cm) : (cm.vani||[]).filter((v:any)=>!v.eliminato)) : [];
  const rilievi = cm?.rilievi || [];
  const ultimoRilievo = rilievi[rilievi.length-1];
  const ordiniCm = cm ? ordiniFornDB.filter((o:any)=>o.cmId===cm.id) : [];
  const fattureCm = cm ? fattureDB.filter((f:any)=>f.cmId===cm.id) : [];
  const montaggiCm = cm ? montaggiDB.filter((m:any)=>m.cmId===cm.id||m.commessaId===cm.id) : [];
  const msgsCm = cm ? msgs.filter((m:any)=>m.cm===cm.code) : [];
  const tasksCm = cm ? (tasks||[]).filter((t:any)=>t.commessaId===cm.id) : [];
  const totCm = cm ? vaniCm.reduce((s:number,v:any)=>s+(calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0),0) : 0;
  const ivaPerc = cm?.iva || cm?.ivaPerc || 10;
  const totCmIva = Math.round(totCm*(1+ivaPerc/100));
  const fatturatoCm = fattureCm.reduce((s:number,f:any)=>s+(f.importo||0),0);
  const saldoCm = totCmIva - fatturatoCm;

  // Lista filtrata avanzata
  const filteredAdv = filtered.filter((c:any) => {
    if (filters.ferme && !isFerma(c)) return false;
    if (filters.urgenti && !isScad(c)) return false;
    return true;
  });

  const TABS = [
    { id:"sopralluogo", label:`Sopralluogo${rilievi.length>0?" "+rilievi.length:""}` },
    { id:"vani",        label:`Vani ${vaniCm.length}` },
    { id:"preventivo",  label:"Preventivo" },
    { id:"ordini",      label:`Ordini ${ordiniCm.length}` },
    { id:"montaggi",    label:`Montaggi ${montaggiCm.length}` },
    { id:"fatture",     label:`Fatture ${fattureCm.length}` },
    { id:"messaggi",    label:`Msg ${msgsCm.length}` },
    { id:"task",        label:`Task ${tasksCm.length}` },
    { id:"timeline",    label:"Timeline" },
  ];

  if (showCfg && cm) return <ConfiguratoreCommessa commessa={cm} onClose={()=>setShowCfg(false)}/>;

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column",background:"#F2F1EC"}}>

      {/* ── PIPELINE BAR ─────────────────────────────────── */}
      <div style={{background:"#fff",borderBottom:`1px solid #E5E3DC`,padding:"10px 18px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:10,fontWeight:800,letterSpacing:2,textTransform:"uppercase",color:"#86868b"}}>PIPELINE</span>
            <span style={{fontSize:12,color:"#86868b"}}>{totAttive} attive · {fmtE(totValore)}</span>
            {fermeCount>0&&<span style={{fontSize:11,fontWeight:700,color:RED,background:RED+"12",padding:"2px 8px",borderRadius:6}}>{fermeCount} ferme</span>}
          </div>
          <div style={{display:"flex",gap:6}}>
            {[{id:"lista",l:"Lista"},{id:"kanban",l:"Kanban"}].map(v=>(
              <div key={v.id} onClick={()=>setViewMode(v.id as any)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:viewMode===v.id?DARK:"transparent",color:viewMode===v.id?"#fff":"#86868b",border:`1px solid ${viewMode===v.id?DARK:"#E5E3DC"}`}}>{v.l}</div>
            ))}
            <div onClick={()=>setShowModal("commessa")} style={{padding:"4px 12px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",background:TEAL,color:"#fff"}}>+ Commessa</div>
          </div>
        </div>
        <div style={{display:"flex",gap:3,height:28}}>
          {[{id:"tutte",nome:"Tutte 14",color:DARK,count:totAttive,euro:totValore},...pipeStats].map((p:any)=>{
            const sel=filterFase===p.id;
            return (
              <div key={p.id} onClick={()=>setFilterFase(sel&&p.id!=="tutte"?"tutte":p.id)}
                style={{flex:p.id==="tutte"?0:Math.max(1,p.count),minWidth:p.id==="tutte"?72:0,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer",opacity:sel?1:0.65,transition:"opacity .15s",padding:"0 8px",background:p.color||TEAL,overflow:"hidden",whiteSpace:"nowrap"}}>
                {p.nome||p.id} {p.id!=="tutte"&&p.count}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3 COLONNE ────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* COL 1 — LISTA */}
        <div style={{width:268,flexShrink:0,background:"#fff",borderRight:`1px solid #E5E3DC`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`1px solid #E5E3DC`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 10px",background:"#F2F1EC",borderRadius:8,border:`1px solid #E5E3DC`,marginBottom:8}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#86868b" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Cerca commessa..." style={{border:"none",background:"transparent",fontSize:12,color:DARK,outline:"none",width:"100%",fontFamily:FF}}/>
            </div>
            {/* Filtri rapidi */}
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <div onClick={()=>setFilters(f=>({...f,ferme:!f.ferme}))} style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:filters.ferme?RED:"#F2F1EC",color:filters.ferme?"#fff":"#86868b",border:`1px solid ${filters.ferme?RED:"#E5E3DC"}`}}>Ferme</div>
              <div onClick={()=>setFilterFase("tutte")} style={{padding:"3px 9px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",background:"#F2F1EC",color:"#86868b",border:`1px solid #E5E3DC`}}>Tutte</div>
              <span style={{fontSize:11,color:"#86868b",marginLeft:"auto",alignSelf:"center"}}>{filteredAdv.length}</span>
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto"}}>
            {filteredAdv.map((c:any) => {
              const fase=getFase(c); const ferma=isFerma(c); const scad=isScad(c);
              const alert=ferma||scad; const col=alert?RED:fase.color||TEAL;
              const gg=giorniFermaCM(c);
              return (
                <div key={c.id} onClick={()=>{setSelectedCM(c);setDetTab("sopralluogo");}}
                  style={{padding:"10px 12px",borderBottom:`1px solid #F2F1EC`,cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start",background:selectedCM?.id===c.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`3px solid ${selectedCM?.id===c.id?TEAL:"transparent"}`,transition:"background .1s"}}
                  onMouseEnter={e=>selectedCM?.id!==c.id&&((e.currentTarget as any).style.background="#F8F7F2")}
                  onMouseLeave={e=>selectedCM?.id!==c.id&&((e.currentTarget as any).style.background="transparent")}>
                  <div style={{width:32,height:32,borderRadius:9,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:col,flexShrink:0}}>{initials(c)}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente}{c.cognome?" "+c.cognome:""}</span>
                      {alert&&<div style={{width:6,height:6,borderRadius:"50%",background:RED,flexShrink:0}}/>}
                    </div>
                    <div style={{fontSize:11,color:"#86868b"}}>{c.code} · {ferma?`Ferma ${gg}gg`:fase.nome}</div>
                    <div style={{height:3,background:"#F2F1EC",borderRadius:2,marginTop:5,overflow:"hidden"}}>
                      <div style={{height:"100%",width:getProgress(c)+"%",background:col,borderRadius:2}}/>
                    </div>
                  </div>
                  {c.euro&&<div style={{fontSize:11,fontWeight:700,color:DARK,fontFamily:FM,flexShrink:0}}>{fmtE(parseFloat(c.euro))}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* COL 2 — DETTAGLIO */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#fff",borderRight:`1px solid #E5E3DC`}}>
          {!cm ? (
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#86868b"}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style={{fontSize:14}}>Seleziona una commessa</span>
            </div>
          ) : (<>
            {/* Header commessa */}
            <div style={{padding:"14px 18px 0",borderBottom:`1px solid #E5E3DC`,flexShrink:0}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                    <div style={{width:38,height:38,borderRadius:10,background:isFerma(cm)?RED+"15":TEAL+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:isFerma(cm)?RED:TEAL,flexShrink:0}}>{initials(cm)}</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:800,color:DARK}}>{cm.cliente}{cm.cognome?" "+cm.cognome:""}</div>
                      <div style={{fontSize:12,color:"#86868b",marginTop:1}}>{cm.code} · {cm.indirizzo||"—"}{isFerma(cm)?<span style={{color:RED,fontWeight:700}}> · Ferma {giorniFermaCM(cm)}gg</span>:""}</div>
                    </div>
                  </div>
                  {/* KPI inline */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                    {[
                      {l:"Totale",v:fmtE(totCm),c:DARK},
                      {l:`+IVA ${ivaPerc}%`,v:fmtE(totCmIva),c:DARK},
                      {l:"Fatturato",v:fmtE(fatturatoCm),c:TEAL},
                      {l:"Saldo",v:fmtE(saldoCm),c:saldoCm>0?RED:TEAL},
                    ].map((k,i)=>(
                      <div key={i} style={{background:"#F8F7F2",borderRadius:8,padding:"7px 10px",border:`1px solid #E5E3DC`}}>
                        <div style={{fontSize:10,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.4}}>{k.l}</div>
                        <div style={{fontSize:14,fontWeight:800,color:k.c,fontFamily:FM,marginTop:2}}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0,marginLeft:14}}>
                  <button onClick={()=>setShowCfg(true)} style={{padding:"8px 16px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FF}}>Configura</button>
                  <button style={{padding:"8px 14px",borderRadius:8,background:"transparent",color:"#86868b",border:`1px solid #E5E3DC`,fontSize:12,cursor:"pointer",fontFamily:FF}}>PDF</button>
                </div>
              </div>
              {/* Tabs */}
              <div style={{display:"flex",gap:0,overflowX:"auto",scrollbarWidth:"none"}}>
                {TABS.map(t=>(
                  <div key={t.id} onClick={()=>setDetTab(t.id)}
                    style={{padding:"8px 14px",fontSize:12,fontWeight:detTab===t.id?700:500,color:detTab===t.id?TEAL:"#86868b",borderBottom:`2px solid ${detTab===t.id?TEAL:"transparent"}`,cursor:"pointer",whiteSpace:"nowrap",transition:"color .15s"}}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Body tab */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 18px"}}>

              {/* ── TAB SOPRALLUOGO ─────────────────────── */}
              {detTab==="sopralluogo"&&(
                <div>
                  {rilievi.length===0?(
                    <div style={{textAlign:"center",padding:"40px 20px"}}>
                      <div style={{fontSize:40,marginBottom:12}}>📐</div>
                      <div style={{fontSize:15,fontWeight:700,color:DARK,marginBottom:6}}>Nessun sopralluogo</div>
                      <div style={{fontSize:13,color:"#86868b",marginBottom:20}}>Registra il primo sopralluogo per iniziare a raccogliere le misure</div>
                      <div onClick={()=>setShowCfg(true)} style={{display:"inline-block",padding:"10px 20px",borderRadius:10,background:TEAL,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Nuovo sopralluogo</div>
                    </div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {rilievi.slice().reverse().map((r:any,i:number)=>{
                        const tipoInfo = TIPO_RILIEVO.find(t=>t.id===r.tipo) || TIPO_RILIEVO[0];
                        const vaniR = r.vani||[];
                        const misurati = vaniR.filter((v:any)=>Object.values(v.misure||{}).filter((x:any)=>(x as number)>0).length>=2).length;
                        return (
                          <div key={r.id||i} style={{background:"#fff",borderRadius:12,border:`1px solid ${tipoInfo.color}30`,overflow:"hidden"}}>
                            <div style={{padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                              <div style={{display:"flex",alignItems:"center",gap:12,flex:1}}>
                                <div style={{width:36,height:36,borderRadius:10,background:tipoInfo.color+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                  <span style={{fontSize:16}}>{tipoInfo.id==="definitivo"?"✅":tipoInfo.id==="ricontrollo"?"⚠️":tipoInfo.id==="modifica"?"🔄":"📐"}</span>
                                </div>
                                <div>
                                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                                    <span style={{fontSize:13,fontWeight:700,color:DARK}}>Rilievo #{rilievi.length-i}</span>
                                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:tipoInfo.color+"15",color:tipoInfo.color,fontWeight:700}}>{tipoInfo.label}</span>
                                  </div>
                                  <div style={{fontSize:12,color:"#86868b"}}>{r.data||"—"} · {r.rilevatore||"—"} · {vaniR.length} vani · {misurati}/{vaniR.length} misurati</div>
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:22,fontWeight:800,color:tipoInfo.color,fontFamily:FM}}>{Math.round(misurati/Math.max(vaniR.length,1)*100)}%</div>
                                <div style={{fontSize:10,color:"#86868b"}}>completato</div>
                              </div>
                            </div>
                            {/* Barra progresso */}
                            <div style={{height:4,background:"#F2F1EC"}}>
                              <div style={{height:"100%",width:`${Math.round(misurati/Math.max(vaniR.length,1)*100)}%`,background:tipoInfo.color,transition:"width .4s"}}/>
                            </div>
                            {/* Vani del rilievo */}
                            {vaniR.length>0&&(
                              <div style={{padding:"10px 16px",display:"flex",flexDirection:"column",gap:6}}>
                                {vaniR.map((v:any,vi:number)=>{
                                  const m=v.misure||{};
                                  const misurato=Object.values(m).filter((x:any)=>(x as number)>0).length>=2;
                                  return (
                                    <div key={v.id||vi} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:misurato?TEAL+"06":"#F8F7F2",border:`1px solid ${misurato?TEAL+"25":"#E5E3DC"}`}}>
                                      <div style={{width:22,height:22,borderRadius:6,background:misurato?TEAL+"20":"#F2F1EC",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                        {misurato?<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>:<div style={{width:6,height:6,borderRadius:"50%",background:"#C0C0C5"}}/>}
                                      </div>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:12,fontWeight:600,color:DARK}}>{v.nome||`Vano ${vi+1}`}</div>
                                        <div style={{fontSize:11,color:"#86868b"}}>{v.tipo||"—"}{m.lCentro&&m.hCentro?` · ${m.lCentro}×${m.hCentro}mm`:""}{v.sistema?` · ${v.sistema}`:""}</div>
                                      </div>
                                      {!misurato&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:AMB+"15",color:AMB,fontWeight:700}}>Da misurare</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {r.note&&<div style={{padding:"8px 16px 12px",fontSize:12,color:"#86868b",fontStyle:"italic"}}>Note: {r.note}</div>}
                          </div>
                        );
                      })}
                      <div onClick={()=>setShowCfg(true)} style={{padding:"12px",borderRadius:12,border:"1.5px dashed #E5E3DC",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:600,color:"#86868b"}}
                        onMouseEnter={e=>((e.currentTarget as any).style.borderColor=TEAL)}
                        onMouseLeave={e=>((e.currentTarget as any).style.borderColor="#E5E3DC")}>
                        + Nuovo sopralluogo
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB VANI ────────────────────────────── */}
              {detTab==="vani"&&(
                <div>
                  {vaniCm.length===0?(
                    <div style={{textAlign:"center",padding:"40px 20px",color:"#86868b"}}>
                      <div style={{fontSize:14,marginBottom:8}}>Nessun vano — usa il Configuratore</div>
                      <div onClick={()=>setShowCfg(true)} style={{display:"inline-block",padding:"8px 18px",borderRadius:8,background:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Apri Configuratore</div>
                    </div>
                  ):(
                    <>
                      {vaniCm.map((v:any,i:number)=>{
                        const p=calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0;
                        const m=v.misure||{};
                        return (
                          <div key={v.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff",cursor:"pointer"}}
                            onMouseEnter={e=>((e.currentTarget as any).style.borderColor=TEAL)}
                            onMouseLeave={e=>((e.currentTarget as any).style.borderColor="#E5E3DC")}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:32,height:32,borderRadius:8,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:DARK}}>{v.nome||`Vano ${i+1}`}</div>
                                <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{v.tipo||"—"} · {m.lCentro||"?"}×{m.hCentro||"?"} mm{v.sistema?` · ${v.sistema}`:""}</div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:14,fontWeight:800,color:DARK,fontFamily:FM}}>{p>0?fmtE(p*(v.pezzi||1)):"—"}</div>
                                <div style={{fontSize:10,color:"#86868b"}}>{v.pezzi||1} pz</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{marginTop:8,padding:"10px 14px",borderRadius:10,background:DARK,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:12,color:"rgba(255,255,255,0.6)"}}>{vaniCm.length} vani · {vaniCm.reduce((s:number,v:any)=>s+(v.pezzi||1),0)} pz</span>
                        <span style={{fontSize:16,fontWeight:800,color:"#fff",fontFamily:FM}}>{fmtE(totCm)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── TAB PREVENTIVO ──────────────────────── */}
              {detTab==="preventivo"&&(
                <div>
                  {vaniCm.length===0?(
                    <div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessun vano configurato</div>
                  ):(
                    <>
                      <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,overflow:"hidden",marginBottom:10}}>
                        <div style={{padding:"8px 14px",background:"#F8F7F2",borderBottom:`1px solid #E5E3DC`,fontSize:10,fontWeight:700,color:"#86868b",display:"grid",gridTemplateColumns:"1fr 90px 50px 80px",gap:8,textTransform:"uppercase",letterSpacing:.5}}>
                          <span>Descrizione</span><span style={{textAlign:"center"}}>Misure</span><span style={{textAlign:"center"}}>Q.</span><span style={{textAlign:"right"}}>Prezzo</span>
                        </div>
                        {vaniCm.map((v:any,i:number)=>{
                          const p=calcolaVanoPrezzo?calcolaVanoPrezzo(v,cm):0;
                          const m=v.misure||{};
                          return (
                            <div key={v.id||i} style={{padding:"10px 14px",borderBottom:i<vaniCm.length-1?`1px solid #F2F1EC`:"none",display:"grid",gridTemplateColumns:"1fr 90px 50px 80px",gap:8,alignItems:"center"}}>
                              <div>
                                <div style={{fontSize:13,fontWeight:600,color:DARK}}>{v.nome||`Vano ${i+1}`}</div>
                                <div style={{fontSize:11,color:"#86868b"}}>{v.tipo} · {v.sistema||"—"}</div>
                              </div>
                              <div style={{fontSize:12,color:"#86868b",textAlign:"center",fontFamily:FM}}>{m.lCentro&&m.hCentro?`${m.lCentro}×${m.hCentro}`:"—"}</div>
                              <div style={{fontSize:13,fontWeight:600,color:DARK,textAlign:"center"}}>{v.pezzi||1}</div>
                              <div style={{fontSize:13,fontWeight:700,color:DARK,textAlign:"right",fontFamily:FM}}>{fmtE(p*(v.pezzi||1))}</div>
                            </div>
                          );
                        })}
                        <div style={{padding:"10px 14px",background:DARK,display:"grid",gridTemplateColumns:"1fr 90px 50px 80px",gap:8}}>
                          <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.6)",gridColumn:"1/4"}}>Totale IVA esclusa</div>
                          <div style={{fontSize:15,fontWeight:800,color:"#fff",textAlign:"right",fontFamily:FM}}>{fmtE(totCm)}</div>
                        </div>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {[{l:`IVA ${ivaPerc}%`,v:fmtE(totCmIva-totCm),c:DARK},{l:"Totale IVA inclusa",v:fmtE(totCmIva),c:DARK},{l:"Fatturato",v:fmtE(fatturatoCm),c:TEAL},{l:"Saldo",v:fmtE(saldoCm),c:saldoCm>0?RED:TEAL}].map((k,i)=>(
                          <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:`1px solid #E5E3DC`}}>
                            <div style={{fontSize:10,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.4}}>{k.l}</div>
                            <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── TAB ORDINI ──────────────────────────── */}
              {detTab==="ordini"&&(
                <div>
                  {ordiniCm.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessun ordine fornitore</div>
                  :ordiniCm.map((o:any,i:number)=>(
                    <div key={o.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:AMB+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={AMB} strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:DARK}}>{typeof o.fornitore==="object"?o.fornitore?.nome:o.fornitore||"Fornitore"}</div>
                        <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{o.data||"—"} · {o.conferma?.ricevuta?"Confermato":"In attesa"}</div>
                      </div>
                      {o.totaleIva&&<div style={{fontSize:14,fontWeight:700,color:DARK,fontFamily:FM}}>{fmtE(o.totaleIva)}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB MONTAGGI ────────────────────────── */}
              {detTab==="montaggi"&&(
                <div>
                  {montaggiCm.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessun montaggio pianificato</div>
                  :montaggiCm.map((m:any,i:number)=>(
                    <div key={m.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{width:36,height:36,borderRadius:10,background:PUR+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={PUR} strokeWidth="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:DARK}}>{m.data||"—"}{m.ora?` · ${m.ora}`:""}</div>
                        <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{m.squadra||m.squadraNome||"—"} · <span style={{color:m.stato==="completato"?TEAL:AMB,fontWeight:600}}>{m.stato||"pianificato"}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB FATTURE ─────────────────────────── */}
              {detTab==="fatture"&&(
                <div>
                  {fattureCm.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessuna fattura</div>
                  :fattureCm.map((f:any,i:number)=>(
                    <div key={f.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${f.pagata?"#E5E3DC":RED+"30"}`,marginBottom:8,background:f.pagata?"#fff":RED+"04",display:"flex",gap:12,alignItems:"center"}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:DARK}}>{f.numero||"Fattura"} · {f.tipo||"fattura"}</div>
                        <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{f.data||"—"} · <span style={{color:f.pagata?TEAL:RED,fontWeight:600}}>{f.pagata?"Pagata":"Da incassare"}</span></div>
                      </div>
                      <div style={{fontSize:15,fontWeight:800,color:f.pagata?TEAL:RED,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB MESSAGGI ────────────────────────── */}
              {detTab==="messaggi"&&(
                <div>
                  {msgsCm.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessun messaggio</div>
                  :msgsCm.slice(-15).map((m:any,i:number)=>(
                    <div key={m.id||i} style={{padding:"10px 12px",borderRadius:10,border:`1px solid #E5E3DC`,marginBottom:8,background:"#fff"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:DARK}}>{m.from||m.mittente||"—"}</span>
                        <span style={{fontSize:11,color:"#86868b"}}>{m.ora||m.data||"—"}</span>
                      </div>
                      <div style={{fontSize:12,color:"#86868b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.testo||m.text||"—"}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB TASK ────────────────────────────── */}
              {detTab==="task"&&(
                <div>
                  {tasksCm.length===0?<div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessuna task collegata</div>
                  :tasksCm.map((t:any,i:number)=>(
                    <div key={t.id||i} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${t.priorita==="alta"?RED+"30":"#E5E3DC"}`,marginBottom:8,background:"#fff"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${t.stato==="completata"?TEAL:AMB}`,background:t.stato==="completata"?TEAL:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                          {t.stato==="completata"&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:DARK,textDecoration:t.stato==="completata"?"line-through":"none"}}>{t.titolo}</div>
                          <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{t.assegnatoNome||"—"}{t.scadenza?` · Scade ${t.scadenza}`:""}</div>
                        </div>
                        <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:t.priorita==="alta"?RED+"15":AMB+"15",color:t.priorita==="alta"?RED:AMB,fontWeight:700}}>{t.priorita}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── TAB TIMELINE ────────────────────────── */}
              {detTab==="timeline"&&(
                <div>
                  {(!cm.log||cm.log.length===0)?<div style={{textAlign:"center",padding:"40px 20px",color:"#86868b",fontSize:13}}>Nessuna attività registrata</div>
                  :cm.log.slice().reverse().map((l:any,i:number)=>(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid #F2F1EC`}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:l.color||TEAL,marginTop:5,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:DARK}}><b style={{fontWeight:700}}>{l.chi}</b> {l.cosa}</div>
                        <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{l.quando}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>)}
        </div>

        {/* COL 3 — PANNELLO DX */}
        <div style={{width:300,flexShrink:0,background:"#F8F7F2",borderLeft:`1px solid #E5E3DC`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"12px 16px",background:"#fff",borderBottom:`1px solid #E5E3DC`,flexShrink:0}}>
            <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.8}}>Riepilogo aziendale</div>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Oggi</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {l:"Commesse attive",v:totAttive,c:TEAL},
                {l:"Commesse ferme",v:fermeCount,c:fermeCount>0?RED:TEAL},
                {l:"Valore pipeline",v:fmtE(totValore),c:DARK},
                {l:"Ordini in corso",v:ordiniFornDB.filter((o:any)=>o.stato!=="consegnato").length,c:AMB},
                {l:"Montaggi prog.",v:montaggiDB.filter((m:any)=>m.data>=TODAY&&m.stato!=="completato").length,c:PUR},
                {l:"Fatture scadute",v:fattureDB.filter((f:any)=>!f.pagata&&f.scadenza<TODAY).length,c:RED},
              ].map((k,i)=>(
                <div key={i} style={{background:"#fff",borderRadius:8,padding:"8px 10px",border:`1px solid #E5E3DC`}}>
                  <div style={{fontSize:10,color:"#86868b",fontWeight:600}}>{k.l}</div>
                  <div style={{fontSize:16,fontWeight:800,color:k.c,fontFamily:FM,marginTop:3}}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Pipeline per fase</div>
            <div style={{background:"#fff",borderRadius:10,border:`1px solid #E5E3DC`,overflow:"hidden",marginBottom:16}}>
              {pipeStats.map((p:any,i:number)=>(
                <div key={p.id} onClick={()=>setFilterFase(p.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderBottom:i<pipeStats.length-1?`1px solid #F2F1EC`:"none",cursor:"pointer"}}
                  onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
                  onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}>
                  <div style={{width:8,height:8,borderRadius:2,background:p.color||TEAL,flexShrink:0}}/>
                  <div style={{flex:1,fontSize:12,color:DARK}}>{p.nome}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#86868b",fontFamily:FM}}>{p.count}</div>
                  <div style={{fontSize:12,fontWeight:700,color:DARK,fontFamily:FM,minWidth:55,textAlign:"right"}}>{fmtE(p.euro)}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Prossimi montaggi</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {montaggiDB.filter((m:any)=>m.data>=TODAY).slice(0,4).map((m:any,i:number)=>(
                <div key={i} style={{padding:"8px 10px",borderRadius:8,border:`1px solid #E5E3DC`,background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{width:30,height:30,borderRadius:8,background:PUR+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:PUR,flexShrink:0,fontFamily:FM}}>{(m.data||"").split("-").slice(1).join("/")}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.cliente||m.commessa||"—"}</div>
                    <div style={{fontSize:10,color:"#86868b"}}>{m.squadraNome||m.squadra||"—"}</div>
                  </div>
                </div>
              ))}
              {montaggiDB.filter((m:any)=>m.data>=TODAY).length===0&&<div style={{fontSize:12,color:"#86868b"}}>Nessun montaggio programmato</div>}
            </div>
            <div style={{fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:10}}>Messaggi recenti</div>
            {msgs.filter((m:any)=>!m.letto).slice(0,3).map((m:any,i:number)=>(
              <div key={i} style={{padding:"8px 10px",borderRadius:8,border:`1px solid #E5E3DC`,background:"#fff",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:700,color:DARK}}>{m.from||"—"}</span>
                  <span style={{fontSize:10,color:"#86868b"}}>{m.ora||""}</span>
                </div>
                <div style={{fontSize:11,color:"#86868b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.testo||m.text||"—"}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
