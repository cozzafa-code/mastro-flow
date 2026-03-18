"use client";
// @ts-nocheck
// MASTRO — DesktopMontaggi v2
// Iper-ampliato: calendario squadre, interventi, checklist posa, manodopera, stato live, foto

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

const CHECKLIST_POSA = [
  "Verifica misure in cantiere",
  "Rimozione infisso esistente",
  "Pulizia controtelaio / muratura",
  "Montaggio controtelaio",
  "Posa infisso + livellamento",
  "Ancoraggio definitivo",
  "Sigillatura perimetrale",
  "Montaggio tapparella / cassonetto",
  "Montaggio zanzariera",
  "Regolazione ferramenta",
  "Test apertura/chiusura",
  "Pulizia vetri e profili",
  "Foto ante/post cantiere",
  "Firma cliente",
];

const TIPI_INTERVENTO = ["Posa nuovi infissi","Sostituzione","Manutenzione","Riparazione","Assistenza garanzia","Sopralluogo","Misure"];

export default function DesktopMontaggiV2() {
  const { T, montaggiDB=[], squadreDB=[], cantieri=[], team=[], setSelectedCM, setTab } = useMastro();
  const [activeTab, setActiveTab] = useState<"calendario"|"interventi"|"squadre"|"report">("calendario");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selMontaggio, setSelMontaggio] = useState<any>(null);
  const [selSquadra, setSelSquadra] = useState<string|null>(null);
  const [checkState, setCheckState] = useState<Record<string,boolean>>({});

  const TODAY = new Date();
  const monday = new Date(TODAY);
  monday.setDate(TODAY.getDate() - (TODAY.getDay()===0?6:TODAY.getDay()-1) + weekOffset*7);
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    return { date:d, iso:d.toISOString().split("T")[0], label:d.toLocaleDateString("it-IT",{weekday:"short"}), num:d.getDate() };
  });
  const todayIso = TODAY.toISOString().split("T")[0];

  const squads = squadreDB.length > 0 ? squadreDB : [
    {id:"s1",nome:"Squadra A",colore:PURPLE,membri:["Luigi","Marco"]},
    {id:"s2",nome:"Squadra B",colore:BLUE,membri:["Antonio","Fabio"]},
  ];

  const getMont = (squadId:string, iso:string) =>
    montaggiDB.filter((m:any)=>(m.squadraId===squadId||m.squadra===squadId)&&m.data===iso);
  const getAllMontDay = (iso:string) => montaggiDB.filter((m:any)=>m.data===iso);

  const totSettimana = days.reduce((s,d)=>s+montaggiDB.filter((m:any)=>m.data===d.iso).length,0);
  const completati = montaggiDB.filter((m:any)=>m.stato==="completato").length;
  const problemi = montaggiDB.filter((m:any)=>m.stato==="problema").length;

  const statoColor = (s:string) => ({completato:TEAL,in_corso:BLUE,problema:RED,pianificato:PURPLE})[s]||AMBER;
  const fmtDate = (iso:string) => iso?new Date(iso+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short"}):"—";

  const interventiFuturi = [...montaggiDB].filter((m:any)=>m.data>=todayIso).sort((a:any,b:any)=>a.data?.localeCompare(b.data||"")||0);
  const interviPassati = [...montaggiDB].filter((m:any)=>m.data<todayIso).sort((a:any,b:any)=>b.data?.localeCompare(a.data||"")||0);

  const toggleCheck = (key:string) => setCheckState(p=>({...p,[key]:!p[key]}));

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>

      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Montaggi</span>
        <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:16}}>
          <div onClick={()=>setWeekOffset(w=>w-1)} style={{cursor:"pointer",padding:"3px 8px",borderRadius:5,border:`0.5px solid ${T.bdr}`,fontSize:12,color:T.sub}}>‹</div>
          <span style={{fontSize:12,fontWeight:500,color:T.text,minWidth:140,textAlign:"center" as any}}>{days[0].iso} — {days[6].iso}</span>
          <div onClick={()=>setWeekOffset(w=>w+1)} style={{cursor:"pointer",padding:"3px 8px",borderRadius:5,border:`0.5px solid ${T.bdr}`,fontSize:12,color:T.sub}}>›</div>
          <div onClick={()=>setWeekOffset(0)} style={{cursor:"pointer",padding:"3px 8px",borderRadius:5,background:weekOffset===0?PURPLE:"transparent",border:`0.5px solid ${weekOffset===0?PURPLE:T.bdr}`,fontSize:11,fontWeight:500,color:weekOffset===0?"#fff":T.sub}}>Oggi</div>
        </div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Settimana",v:totSettimana,c:PURPLE},{l:"Completati",v:completati,c:TEAL},{l:"Problemi",v:problemi,c:problemi>0?RED:TEAL},{l:"Squadre",v:squads.length,c:T.text}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:0,borderBottom:`0.5px solid ${T.bdr}`,background:"#fff",flexShrink:0,paddingLeft:20}}>
        {[["calendario","Calendario"],["interventi","Interventi"],["squadre","Squadre"],["report","Report posa"]].map(([id,l])=>(
          <div key={id} onClick={()=>setActiveTab(id as any)} style={{padding:"8px 14px",fontSize:12,fontWeight:500,color:activeTab===id?PURPLE:T.sub,borderBottom:`2px solid ${activeTab===id?PURPLE:"transparent"}`,cursor:"pointer"}}>{l}</div>
        ))}
      </div>

      {/* CALENDARIO */}
      {activeTab==="calendario"&&(
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          {/* SIDEBAR SQUADRE */}
          <div style={{width:160,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
            <div style={{padding:"8px 12px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,flexShrink:0}}>Squadre</div>
            <div style={{flex:1,overflowY:"auto" as any}}>
              {squads.map((s:any)=>{
                const tot=montaggiDB.filter((m:any)=>m.squadraId===s.id||m.squadra===s.id).length;
                const oggi=montaggiDB.filter((m:any)=>(m.squadraId===s.id||m.squadra===s.id)&&m.data===todayIso).length;
                return (
                  <div key={s.id} onClick={()=>setSelSquadra(selSquadra===s.id?null:s.id)}
                    style={{padding:"9px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",borderLeft:`2px solid ${selSquadra===s.id?s.colore||PURPLE:"transparent"}`,background:selSquadra===s.id?"rgba(139,92,246,0.05)":"transparent"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:8,height:8,borderRadius:2,background:s.colore||PURPLE,flexShrink:0}}/>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{s.nome}</div>
                    </div>
                    <div style={{fontSize:10,color:T.sub,marginTop:2}}>{tot} tot · {oggi} oggi</div>
                    {s.membri&&<div style={{fontSize:9,color:T.sub,marginTop:1}}>{s.membri.join(", ")}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* CALENDARIO GRIGLIA */}
          <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",minWidth:0}}>
            <div style={{display:"grid",gridTemplateColumns:`140px repeat(7,1fr)`,background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
              <div style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any}}></div>
              {days.map((d,i)=>{
                const isToday=d.iso===todayIso;
                const n=getAllMontDay(d.iso).length;
                return (
                  <div key={i} style={{padding:"6px 8px",textAlign:"center" as any,borderLeft:`0.5px solid ${T.bdr}`,background:isToday?"rgba(139,92,246,0.04)":"transparent"}}>
                    <div style={{fontSize:11,fontWeight:isToday?700:500,color:isToday?PURPLE:T.sub}}>{d.label}</div>
                    <div style={{fontSize:14,fontWeight:isToday?700:400,color:isToday?PURPLE:T.text}}>{d.num}</div>
                    {n>0&&<div style={{fontSize:9,color:PURPLE,fontWeight:500}}>{n}</div>}
                  </div>
                );
              })}
            </div>
            <div style={{flex:1,overflowY:"auto" as any}}>
              {(selSquadra?squads.filter((s:any)=>s.id===selSquadra):squads).map((s:any)=>(
                <div key={s.id} style={{display:"grid",gridTemplateColumns:`140px repeat(7,1fr)`,borderBottom:`0.5px solid ${T.bdr}`,minHeight:64}}>
                  <div style={{padding:"8px 10px",display:"flex",alignItems:"flex-start",gap:6,borderRight:`0.5px solid ${T.bdr}`,background:"#fff"}}>
                    <div style={{width:7,height:7,borderRadius:2,background:s.colore||PURPLE,marginTop:4,flexShrink:0}}/>
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:T.text}}>{s.nome}</div>
                      {s.membri&&<div style={{fontSize:9,color:T.sub}}>{s.membri.join(", ")}</div>}
                    </div>
                  </div>
                  {days.map((d,i)=>{
                    const monts=getMont(s.id,d.iso);
                    const isToday=d.iso===todayIso;
                    return (
                      <div key={i} style={{padding:"3px 4px",borderLeft:`0.5px solid ${T.bdr}`,background:isToday?"rgba(139,92,246,0.02)":"transparent",minHeight:64}}>
                        {monts.map((m:any,mi:number)=>{
                          const cm=cantieri.find((c:any)=>c.id===m.cmId||c.code===m.commessa);
                          const col=statoColor(m.stato);
                          return (
                            <div key={mi} onClick={()=>setSelMontaggio(selMontaggio?.id===m.id?null:m)}
                              style={{padding:"3px 5px",borderRadius:5,background:col+"15",border:`0.5px solid ${col}30`,marginBottom:2,cursor:"pointer",borderLeft:`2.5px solid ${col}`}}>
                              <div style={{fontSize:10,fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{cm?cm.cliente:m.cliente||"—"}</div>
                              {m.ora&&<div style={{fontSize:8,color:T.sub}}>{m.ora}</div>}
                              {m.tipo&&<div style={{fontSize:8,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.tipo}</div>}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* DETTAGLIO MONTAGGIO */}
          {selMontaggio&&(
            <div style={{width:280,flexShrink:0,background:"#fff",borderLeft:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
                <span style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>Intervento</span>
                <div onClick={()=>setSelMontaggio(null)} style={{cursor:"pointer",fontSize:14,color:T.sub}}>×</div>
              </div>
              <div style={{flex:1,overflowY:"auto" as any,padding:"10px 14px"}}>
                {[
                  {l:"Cliente",v:selMontaggio.cliente||cantieri.find((c:any)=>c.id===selMontaggio.cmId)?.cliente||"—"},
                  {l:"Data",v:fmtDate(selMontaggio.data)},
                  {l:"Ora",v:selMontaggio.ora||"—"},
                  {l:"Tipo intervento",v:selMontaggio.tipo||"Posa"},
                  {l:"Squadra",v:selMontaggio.squadraNome||squads.find((s:any)=>s.id===selMontaggio.squadraId)?.nome||"—"},
                  {l:"Indirizzo",v:selMontaggio.indirizzo||cantieri.find((c:any)=>c.id===selMontaggio.cmId)?.indirizzo||"—"},
                  {l:"Durata prev.",v:selMontaggio.durata?selMontaggio.durata+" ore":"—"},
                  {l:"Stato",v:selMontaggio.stato||"pianificato"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`0.5px solid ${T.bdr}`,gap:8}}>
                    <span style={{fontSize:11,color:T.sub,flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,textAlign:"right" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{r.v}</span>
                  </div>
                ))}

                {/* CHECKLIST POSA */}
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"12px 0 8px"}}>Checklist posa</div>
                {CHECKLIST_POSA.map((item,i)=>{
                  const key=`${selMontaggio.id}_${i}`;
                  const done=checkState[key]||false;
                  return (
                    <div key={i} onClick={()=>toggleCheck(key)} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",borderRadius:6,cursor:"pointer",marginBottom:2,background:done?"rgba(26,158,115,0.06)":"transparent"}}>
                      <div style={{width:14,height:14,borderRadius:3,border:`1.5px solid ${done?TEAL:T.bdr}`,background:done?TEAL:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {done&&<svg width="8" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                      </div>
                      <span style={{fontSize:10,color:done?TEAL:T.text,textDecoration:done?"line-through":"none"}}>{item}</span>
                    </div>
                  );
                })}
                <div style={{margin:"10px 0 4px",fontSize:10,color:T.sub}}>
                  {Object.values(checkState).filter(v=>v).length} / {CHECKLIST_POSA.length} completati
                </div>
                <div style={{marginTop:10,display:"flex",gap:6}}>
                  <button onClick={()=>{const cm=cantieri.find((c:any)=>c.id===selMontaggio.cmId);if(cm){setSelectedCM(cm);setTab("commesse");}}}
                    style={{flex:1,padding:"7px",borderRadius:7,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:11,fontWeight:500,color:T.text,cursor:"pointer",fontFamily:FF}}>Vai commessa</button>
                  <button style={{flex:1,padding:"7px",borderRadius:7,border:"none",background:PURPLE,fontSize:11,fontWeight:500,color:"#fff",cursor:"pointer",fontFamily:FF}}>Completa</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB INTERVENTI */}
      {activeTab==="interventi"&&(
        <div style={{flex:1,display:"flex",overflow:"hidden"}}>
          <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
            <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>Prossimi interventi</div>
            {interventiFuturi.length===0&&<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:30}}>Nessun intervento programmato</div>}
            {interventiFuturi.map((m:any,i:number)=>{
              const cm=cantieri.find((c:any)=>c.id===m.cmId||c.code===m.commessa);
              const col=statoColor(m.stato);
              return (
                <div key={i} onClick={()=>{setSelMontaggio(m);setActiveTab("calendario");}} style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"12px 16px",marginBottom:8,cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:col+"12",display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:col,fontFamily:FM}}>{(m.data||"").split("-")[2]}</div>
                    <div style={{fontSize:9,color:col}}>{m.data?new Date(m.data+"T12:00:00").toLocaleDateString("it-IT",{month:"short"}):""}</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                      <span style={{fontSize:13,fontWeight:500,color:T.text}}>{cm?`${cm.cliente} ${cm.cognome||""}`.trim():m.cliente||"—"}</span>
                      <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:col+"12",color:col,fontWeight:500}}>{m.stato||"pianificato"}</span>
                    </div>
                    <div style={{fontSize:11,color:T.sub}}>{m.tipo||"Posa"} · {squads.find((s:any)=>s.id===m.squadraId)?.nome||m.squadraNome||"—"}{m.ora?` · ${m.ora}`:""}</div>
                    {cm&&<div style={{fontSize:10,color:T.sub,marginTop:2}}>{cm.indirizzo||"—"} · {(cm.vani||[]).filter((v:any)=>!v.eliminato).length} vani</div>}
                  </div>
                  <div style={{textAlign:"right" as any,flexShrink:0}}>
                    {m.durata&&<div style={{fontSize:11,fontWeight:500,color:T.text}}>{m.durata}h</div>}
                    {cm?.euro&&<div style={{fontSize:10,color:T.sub}}>€{Math.round(parseFloat(cm.euro)).toLocaleString("it-IT")}</div>}
                  </div>
                </div>
              );
            })}

            {interviPassati.length>0&&<>
              <div style={{fontSize:12,fontWeight:500,color:T.sub,margin:"20px 0 12px",paddingTop:12,borderTop:`0.5px solid ${T.bdr}`}}>Interventi completati</div>
              {interviPassati.slice(0,5).map((m:any,i:number)=>{
                const cm=cantieri.find((c:any)=>c.id===m.cmId);
                return (
                  <div key={i} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,padding:"10px 14px",marginBottom:6,display:"flex",gap:10,alignItems:"center",opacity:0.7}}>
                    <div style={{width:32,height:32,borderRadius:8,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text}}>{cm?cm.cliente:m.cliente||"—"}</div>
                      <div style={{fontSize:10,color:T.sub}}>{fmtDate(m.data)} · {m.tipo||"Posa"}</div>
                    </div>
                    <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:TEAL+"12",color:TEAL,fontWeight:500}}>Completato</span>
                  </div>
                );
              })}
            </>}
          </div>
        </div>
      )}

      {/* TAB SQUADRE */}
      {activeTab==="squadre"&&(
        <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {squads.map((s:any)=>{
              const monts=montaggiDB.filter((m:any)=>m.squadraId===s.id||m.squadra===s.id);
              const oggi=monts.filter((m:any)=>m.data===todayIso);
              const settimana=monts.filter((m:any)=>days.some(d=>d.iso===m.data));
              return (
                <div key={s.id} style={{background:"#fff",borderRadius:12,border:`0.5px solid ${s.colore}40`,padding:"16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:10,background:s.colore+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:s.colore}}>{(s.nome||"S")[0]}</div>
                    <div>
                      <div style={{fontSize:13,fontWeight:500,color:T.text}}>{s.nome}</div>
                      {s.membri&&<div style={{fontSize:10,color:T.sub}}>{s.membri.join(" · ")}</div>}
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
                    {[{l:"Oggi",v:oggi.length,c:s.colore},{l:"Settimana",v:settimana.length,c:T.text},{l:"Totale",v:monts.length,c:T.sub}].map((k,i)=>(
                      <div key={i} style={{background:"#F8FAFC",borderRadius:6,padding:"6px 8px",textAlign:"center" as any}}>
                        <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                        <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                      </div>
                    ))}
                  </div>
                  {oggi.length>0&&<div style={{borderTop:`0.5px solid ${T.bdr}`,paddingTop:8}}>
                    <div style={{fontSize:9,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:4}}>Oggi</div>
                    {oggi.map((m:any,i:number)=>{
                      const cm=cantieri.find((c:any)=>c.id===m.cmId);
                      return <div key={i} style={{fontSize:10,color:T.text,padding:"2px 0"}}>{m.ora||"—"} · {cm?cm.cliente:m.cliente||"—"}</div>;
                    })}
                  </div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB REPORT POSA */}
      {activeTab==="report"&&(
        <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
          <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>Report posa — statistiche</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
            {[
              {l:"Totali montaggi",v:montaggiDB.length,c:T.text},
              {l:"Completati",v:completati,c:TEAL},
              {l:"In corso",v:montaggiDB.filter((m:any)=>m.stato==="in_corso").length,c:BLUE},
              {l:"Con problemi",v:problemi,c:problemi>0?RED:TEAL},
            ].map((k,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.bdr}`}}>
                <div style={{fontSize:11,color:T.sub}}>{k.l}</div>
                <div style={{fontSize:22,fontWeight:500,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>Interventi per squadra</div>
            {squads.map((s:any)=>{
              const tot=montaggiDB.filter((m:any)=>m.squadraId===s.id||m.squadra===s.id).length;
              const max=Math.max(1,...squads.map((sq:any)=>montaggiDB.filter((m:any)=>m.squadraId===sq.id||m.squadra===sq.id).length));
              return (
                <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:80,fontSize:11,color:T.text,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{s.nome}</div>
                  <div style={{flex:1,height:12,background:"#F4F6F8",borderRadius:6,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${Math.round(tot/max*100)}%`,background:s.colore||PURPLE,borderRadius:6}}/>
                  </div>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,minWidth:20,textAlign:"right" as any}}>{tot}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
