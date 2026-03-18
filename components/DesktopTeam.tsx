"use client";
// @ts-nocheck
// MASTRO — DesktopTeam.tsx
// Vista desktop Team: chi fa cosa ora, carichi lavoro, performance, ruoli

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", RED="#DC4444", AMBER="#E8A020", PURPLE="#8B5CF6", BLUE="#3B7FE0";

export default function DesktopTeam() {
  const { T, team=[], cantieri=[], montaggiDB=[], tasks=[], fattureDB=[], setSelectedCM, setTab } = useMastro();
  const [selMembro, setSelMembro] = useState<any>(null);
  const TODAY = new Date().toISOString().split("T")[0];

  const membri = team.length > 0 ? team : [
    { id:"1", nome:"Marco Esposito", ruolo:"Preventivista", colore:BLUE },
    { id:"2", nome:"Luigi Ferrante", ruolo:"Montatore", colore:PURPLE },
    { id:"3", nome:"Anna Greco", ruolo:"Amministrazione", colore:TEAL },
  ];

  const getCarico = (m:any) => {
    const montaggi = montaggiDB.filter((mt:any)=>mt.operatoreId===m.id||mt.squadraId===m.squadraId).length;
    const taskM = tasks.filter((t:any)=>t.assegnatoA===m.id&&!t.done).length;
    return { montaggi, tasks: taskM, totale: montaggi + taskM };
  };

  const getCommesseMembro = (m:any) =>
    cantieri.filter((c:any)=>c.operatoreId===m.id||c.assegnatoA===m.id||c.venditore===m.nome);

  const getRuoloColor = (r:string) =>
    r?.includes("Montatore")||r?.includes("montatore")?PURPLE
    :r?.includes("Preventiv")?BLUE
    :r?.includes("Ammin")||r?.includes("ammin")?TEAL
    :r?.includes("Titolare")?AMBER:T.acc;

  const selMembri = selMembro ? [selMembro] : membri;

  return (
    <div style={{display:"flex",height:"100%",background:"#F4F6F8",overflow:"hidden"}}>

      {/* LISTA MEMBRI */}
      <div style={{width:220,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
        <div style={{padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <span style={{fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5}}>Team ({membri.length})</span>
          <button onClick={()=>setSelMembro(null)} style={{padding:"2px 7px",borderRadius:5,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:10,color:T.sub,cursor:"pointer"}}>Tutti</button>
        </div>
        <div style={{flex:1,overflowY:"auto" as any}}>
          {membri.map((m:any)=>{
            const carico = getCarico(m);
            const c = getRuoloColor(m.ruolo);
            const isToday = montaggiDB.some((mt:any)=>(mt.operatoreId===m.id||mt.squadraId===m.squadraId)&&mt.data===TODAY);
            return (
              <div key={m.id} onClick={()=>setSelMembro(selMembro?.id===m.id?null:m)}
                style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",display:"flex",gap:10,alignItems:"flex-start",background:selMembro?.id===m.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selMembro?.id===m.id?TEAL:"transparent"}`}}>
                <div style={{width:34,height:34,borderRadius:10,background:c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:c,flexShrink:0}}>
                  {(m.nome||"?")[0].toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.nome}</span>
                    {isToday&&<div style={{width:6,height:6,borderRadius:"50%",background:TEAL,flexShrink:0}} title="In cantiere oggi"/>}
                  </div>
                  <div style={{fontSize:10,color:T.sub,marginTop:1}}>{m.ruolo||"Operatore"}</div>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    {carico.totale>0&&<span style={{fontSize:9,fontWeight:500,padding:"1px 5px",borderRadius:4,background:AMBER+"12",color:AMBER}}>{carico.totale} attività</span>}
                    {isToday&&<span style={{fontSize:9,fontWeight:500,padding:"1px 5px",borderRadius:4,background:TEAL+"12",color:TEAL}}>In cantiere</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto" as any,padding:20,minWidth:0}}>
        {selMembro ? (
          // DETTAGLIO MEMBRO
          <div>
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px",marginBottom:14,display:"flex",gap:16,alignItems:"flex-start"}}>
              <div style={{width:56,height:56,borderRadius:14,background:getRuoloColor(selMembro.ruolo)+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:getRuoloColor(selMembro.ruolo),flexShrink:0}}>
                {(selMembro.nome||"?")[0].toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:18,fontWeight:500,color:T.text}}>{selMembro.nome}</div>
                <div style={{fontSize:13,color:T.sub,marginTop:2}}>{selMembro.ruolo||"Operatore"}</div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  {selMembro.telefono&&<span style={{fontSize:11,color:BLUE}}>{selMembro.telefono}</span>}
                  {selMembro.email&&<span style={{fontSize:11,color:T.sub}}>{selMembro.email}</span>}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {l:"Commesse",v:getCommesseMembro(selMembro).length,c:TEAL},
                  {l:"Task aperti",v:tasks.filter((t:any)=>t.assegnatoA===selMembro.id&&!t.done).length,c:AMBER},
                  {l:"Montaggi",v:montaggiDB.filter((m:any)=>m.operatoreId===selMembro.id||m.squadraId===selMembro.squadraId).length,c:PURPLE},
                ].map((k,i)=>(
                  <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",textAlign:"center" as any}}>
                    <div style={{fontSize:20,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
                    <div style={{fontSize:10,color:T.sub}}>{k.l}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Commesse assegnate */}
            <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:10}}>Commesse assegnate</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {getCommesseMembro(selMembro).slice(0,6).map((c:any)=>(
                <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,padding:"10px 12px",cursor:"pointer",display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{width:28,height:28,borderRadius:7,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:TEAL,flexShrink:0}}>{(c.cliente||"?")[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{c.cliente} {c.cognome||""}</div>
                    <div style={{fontSize:10,color:T.sub}}>{c.code} · {c.fase}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // VISTA TUTTI — "Chi fa cosa adesso"
          <div>
            <div style={{fontSize:14,fontWeight:500,color:T.text,marginBottom:14}}>Chi fa cosa — oggi {new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
              {membri.map((m:any)=>{
                const carico = getCarico(m);
                const todayMonts = montaggiDB.filter((mt:any)=>(mt.operatoreId===m.id||mt.squadraId===m.squadraId)&&mt.data===TODAY);
                const todayTasks = tasks.filter((t:any)=>t.assegnatoA===m.id&&!t.done&&t.date===TODAY);
                const c = getRuoloColor(m.ruolo);
                const busy = todayMonts.length > 0 || todayTasks.length > 0;
                return (
                  <div key={m.id} onClick={()=>setSelMembro(m)} style={{background:"#fff",borderRadius:12,border:`0.5px solid ${busy?c+"40":T.bdr}`,padding:"14px 16px",cursor:"pointer",transition:"border-color .15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                      <div style={{width:36,height:36,borderRadius:10,background:c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:c,flexShrink:0}}>
                        {(m.nome||"?")[0].toUpperCase()}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.nome}</div>
                        <div style={{fontSize:10,color:T.sub}}>{m.ruolo||"Operatore"}</div>
                      </div>
                      <div style={{width:8,height:8,borderRadius:"50%",background:busy?TEAL:T.bdr,flexShrink:0}} title={busy?"Attivo oggi":"Nessuna attività"}/>
                    </div>
                    {todayMonts.length>0&&(
                      <div style={{padding:"6px 8px",borderRadius:7,background:PURPLE+"10",border:`0.5px solid ${PURPLE}25`,marginBottom:5}}>
                        <div style={{fontSize:10,fontWeight:500,color:PURPLE}}>{todayMonts.length} montaggio{todayMonts.length>1?"i":""} oggi</div>
                        {todayMonts[0]&&<div style={{fontSize:9,color:T.sub,marginTop:1}}>{cantieri.find((cc:any)=>cc.id===todayMonts[0].cmId)?.cliente||"—"}{todayMonts[0].ora?` · ${todayMonts[0].ora}`:""}</div>}
                      </div>
                    )}
                    {todayTasks.length>0&&(
                      <div style={{padding:"6px 8px",borderRadius:7,background:AMBER+"10",border:`0.5px solid ${AMBER}25`,marginBottom:5}}>
                        <div style={{fontSize:10,fontWeight:500,color:AMBER}}>{todayTasks.length} task aperto{todayTasks.length>1?"i":""}</div>
                        {todayTasks[0]&&<div style={{fontSize:9,color:T.sub,marginTop:1}}>{todayTasks[0].text||"—"}</div>}
                      </div>
                    )}
                    {!busy&&<div style={{fontSize:10,color:T.sub,textAlign:"center" as any,padding:"6px 0"}}>Nessuna attività programmata oggi</div>}
                    <div style={{display:"flex",gap:4,marginTop:8}}>
                      {[{l:"Commesse",v:getCommesseMembro(m).length,c:TEAL},{l:"Task",v:carico.tasks,c:AMBER},{l:"Montaggi",v:carico.montaggi,c:PURPLE}].map((k,i)=>(
                        <div key={i} style={{flex:1,background:"#F8FAFC",borderRadius:6,padding:"4px 6px",textAlign:"center" as any}}>
                          <div style={{fontSize:13,fontWeight:500,color:k.v>0?k.c:T.sub,fontFamily:FM}}>{k.v}</div>
                          <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
