"use client";
// @ts-nocheck
// MASTRO — DesktopMontaggi.tsx
// Vista desktop Montaggi: calendario squadre, stato live, assegnazioni, mappa

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", RED="#DC4444", AMBER="#E8A020", PURPLE="#8B5CF6", BLUE="#3B7FE0";

export default function DesktopMontaggi() {
  const { T, montaggiDB=[], squadreDB=[], cantieri=[], setSelectedCM, setTab } = useMastro();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selSquadra, setSelSquadra] = useState<string|null>(null);
  const [selMontaggio, setSelMontaggio] = useState<any>(null);

  const TODAY = new Date();
  const monday = new Date(TODAY);
  monday.setDate(TODAY.getDate() - (TODAY.getDay()===0?6:TODAY.getDay()-1) + weekOffset*7);
  const days = Array.from({length:7},(_,i)=>{
    const d = new Date(monday); d.setDate(monday.getDate()+i);
    return { date: d, iso: d.toISOString().split("T")[0], label: d.toLocaleDateString("it-IT",{weekday:"short",day:"numeric"}) };
  });

  const squads = squadreDB.length > 0 ? squadreDB : [{ id:"default", nome:"Squadra A", colore:TEAL }];
  const visSquads = selSquadra ? squads.filter((s:any)=>s.id===selSquadra) : squads;

  const getMont = (squadraId:string, iso:string) =>
    montaggiDB.filter((m:any) => (m.squadraId===squadraId||m.squadra===squadraId) && m.data===iso);

  const totSettimana = days.reduce((s,d)=>s+montaggiDB.filter((m:any)=>m.data===d.iso).length,0);
  const completati = montaggiDB.filter((m:any)=>m.stato==="completato").length;
  const inCorso = montaggiDB.filter((m:any)=>m.stato==="in_corso").length;
  const programmati = montaggiDB.filter((m:any)=>!m.stato||m.stato==="pianificato").length;

  const statoColor = (s:string) => s==="completato"?TEAL:s==="in_corso"?BLUE:s==="problema"?RED:AMBER;
  const fmtDate = (iso:string) => iso ? new Date(iso+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short"}) : "—";

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Montaggi</span>
        <div style={{display:"flex",gap:10,alignItems:"center",marginLeft:20}}>
          <div onClick={()=>setWeekOffset(w=>w-1)} style={{cursor:"pointer",padding:"3px 8px",borderRadius:5,border:`0.5px solid ${T.bdr}`,fontSize:12,color:T.sub}}>‹</div>
          <span style={{fontSize:12,fontWeight:500,color:T.text,minWidth:160,textAlign:"center" as any}}>
            {days[0].iso} — {days[6].iso}
          </span>
          <div onClick={()=>setWeekOffset(w=>w+1)} style={{cursor:"pointer",padding:"3px 8px",borderRadius:5,border:`0.5px solid ${T.bdr}`,fontSize:12,color:T.sub}}>›</div>
          <div onClick={()=>setWeekOffset(0)} style={{cursor:"pointer",padding:"3px 8px",borderRadius:5,background:weekOffset===0?TEAL:"transparent",border:`0.5px solid ${weekOffset===0?TEAL:T.bdr}`,fontSize:11,fontWeight:500,color:weekOffset===0?"#fff":T.sub}}>Oggi</div>
        </div>
        <div style={{display:"flex",gap:8,marginLeft:"auto",alignItems:"center"}}>
          {[{l:"Questa settimana",v:totSettimana,c:T.text},{l:"In corso",v:inCorso,c:BLUE},{l:"Completati",v:completati,c:TEAL},{l:"Problemi",v:montaggiDB.filter((m:any)=>m.stato==="problema").length,c:RED}].map((k,i)=>(
            <div key={i} style={{textAlign:"center" as any,padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* SIDEBAR SQUADRE */}
        <div style={{width:180,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>Squadre ({squads.length})</div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            <div onClick={()=>setSelSquadra(null)} style={{padding:"8px 12px",cursor:"pointer",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",gap:8,background:selSquadra===null?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selSquadra===null?TEAL:"transparent"}`}}>
              <div style={{width:8,height:8,borderRadius:2,background:TEAL,flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text}}>Tutte</div>
                <div style={{fontSize:10,color:T.sub}}>{squads.length} squadre</div>
              </div>
            </div>
            {squads.map((s:any)=>{
              const mont = montaggiDB.filter((m:any)=>m.squadraId===s.id||m.squadra===s.id);
              const oggi = mont.filter((m:any)=>m.data===TODAY.toISOString().split("T")[0]).length;
              return (
                <div key={s.id} onClick={()=>setSelSquadra(selSquadra===s.id?null:s.id)}
                  style={{padding:"9px 12px",cursor:"pointer",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",gap:8,background:selSquadra===s.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selSquadra===s.id?s.colore||TEAL:"transparent"}`}}>
                  <div style={{width:8,height:8,borderRadius:2,background:s.colore||TEAL,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{s.nome}</div>
                    <div style={{fontSize:10,color:T.sub}}>{mont.length} tot · {oggi} oggi</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CALENDARIO PRINCIPALE */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",minWidth:0}}>
          {/* Header giorni */}
          <div style={{display:"grid",gridTemplateColumns:`120px repeat(7,1fr)`,background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{padding:"8px 10px",fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>Squadra</div>
            {days.map((d,i)=>{
              const isToday = d.iso===TODAY.toISOString().split("T")[0];
              const totDay = montaggiDB.filter((m:any)=>m.data===d.iso).length;
              return (
                <div key={i} style={{padding:"6px 8px",textAlign:"center" as any,borderLeft:`0.5px solid ${T.bdr}`,background:isToday?"rgba(26,158,115,0.04)":"transparent"}}>
                  <div style={{fontSize:11,fontWeight:isToday?700:500,color:isToday?TEAL:T.sub}}>{d.label}</div>
                  {totDay>0&&<div style={{fontSize:9,color:TEAL,fontWeight:500}}>{totDay}</div>}
                </div>
              );
            })}
          </div>
          {/* Righe squadre */}
          <div style={{flex:1,overflowY:"auto" as any}}>
            {visSquads.map((s:any)=>(
              <div key={s.id} style={{display:"grid",gridTemplateColumns:`120px repeat(7,1fr)`,borderBottom:`0.5px solid ${T.bdr}`,minHeight:60}}>
                <div style={{padding:"8px 10px",display:"flex",alignItems:"flex-start",gap:6,borderRight:`0.5px solid ${T.bdr}`,background:"#fff"}}>
                  <div style={{width:7,height:7,borderRadius:2,background:s.colore||TEAL,marginTop:3,flexShrink:0}}/>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis"}}>{s.nome}</div>
                </div>
                {days.map((d,i)=>{
                  const monts = getMont(s.id, d.iso);
                  const isToday = d.iso===TODAY.toISOString().split("T")[0];
                  return (
                    <div key={i} style={{padding:"4px 5px",borderLeft:`0.5px solid ${T.bdr}`,background:isToday?"rgba(26,158,115,0.02)":"transparent",verticalAlign:"top",minHeight:60}}>
                      {monts.map((m:any,mi:number)=>{
                        const cm = cantieri.find((c:any)=>c.id===m.cmId||c.code===m.commessa);
                        const col = statoColor(m.stato);
                        return (
                          <div key={mi} onClick={()=>setSelMontaggio(selMontaggio?.id===m.id?null:m)}
                            style={{padding:"3px 5px",borderRadius:5,background:col+"15",border:`0.5px solid ${col}30`,marginBottom:3,cursor:"pointer",borderLeft:`2.5px solid ${col}`}}>
                            <div style={{fontSize:10,fontWeight:500,color:col,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{cm?`${cm.cliente}`:m.cliente||"—"}</div>
                            {m.ora&&<div style={{fontSize:9,color:T.sub}}>{m.ora}</div>}
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

        {/* PANNELLO DETTAGLIO MONTAGGIO */}
        <div style={{width:260,flexShrink:0,background:"#fff",borderLeft:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>
            {selMontaggio?"Dettaglio montaggio":"Prossimi montaggi"}
          </div>
          <div style={{flex:1,overflowY:"auto" as any,padding:"10px 14px"}}>
            {selMontaggio ? (
              <div>
                {[
                  {l:"Cliente",v:selMontaggio.cliente||cantieri.find((c:any)=>c.id===selMontaggio.cmId)?.cliente||"—"},
                  {l:"Data",v:fmtDate(selMontaggio.data)},
                  {l:"Ora",v:selMontaggio.ora||"—"},
                  {l:"Squadra",v:selMontaggio.squadraNome||squads.find((s:any)=>s.id===selMontaggio.squadraId)?.nome||"—"},
                  {l:"Indirizzo",v:selMontaggio.indirizzo||"—"},
                  {l:"Stato",v:selMontaggio.stato||"pianificato"},
                  {l:"Durata",v:selMontaggio.durata?selMontaggio.durata+" ore":"—"},
                  {l:"Note",v:selMontaggio.note||"—"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<7?`0.5px solid ${T.bdr}`:"none",gap:8}}>
                    <span style={{fontSize:11,color:T.sub,flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,textAlign:"right" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{r.v}</span>
                  </div>
                ))}
                <div style={{marginTop:12,display:"flex",gap:6}}>
                  <button onClick={()=>{const cm=cantieri.find((c:any)=>c.id===selMontaggio.cmId);if(cm){setSelectedCM(cm);setTab("commesse");}}} style={{flex:1,padding:"7px",borderRadius:7,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:11,fontWeight:500,color:T.text,cursor:"pointer",fontFamily:FF}}>Vai alla commessa</button>
                </div>
              </div>
            ) : (
              [...montaggiDB].sort((a:any,b:any)=>(a.data||"").localeCompare(b.data||"")).filter((m:any)=>m.data>=TODAY.toISOString().split("T")[0]).slice(0,10).map((m:any,i:number)=>{
                const cm = cantieri.find((c:any)=>c.id===m.cmId);
                const col = statoColor(m.stato);
                return (
                  <div key={i} onClick={()=>setSelMontaggio(m)} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,cursor:"pointer",display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{width:30,height:30,borderRadius:7,background:col+"12",display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:col,fontFamily:FM}}>{(m.data||"").split("-")[2]}</div>
                      <div style={{fontSize:8,color:col}}>{(m.data||"").split("-")[1]?new Date(m.data+"T12:00:00").toLocaleDateString("it-IT",{month:"short"}):""}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{cm?`${cm.cliente}`:m.cliente||"—"}</div>
                      <div style={{fontSize:10,color:T.sub}}>{m.squadraNome||squads.find((s:any)=>s.id===m.squadraId)?.nome||"—"}{m.ora?` · ${m.ora}`:""}</div>
                    </div>
                    <div style={{fontSize:10,fontWeight:500,padding:"1px 6px",borderRadius:4,background:col+"12",color:col,flexShrink:0}}>{m.stato||"pianificato"}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
