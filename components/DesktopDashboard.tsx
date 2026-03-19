"use client";
// @ts-nocheck
// MASTRO — DesktopDashboard v3
// Tutto più grande, scrollabile, widget espandibili

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",AMB="#D08008",PUR="#8B5CF6",BLU="#3B7FE0",ORG="#F97316";
const fmtE=(n:number)=>"€"+Math.round(n).toLocaleString("it-IT");
const fmtK=(n:number)=>n>=1000?"€"+Math.round(n/1000)+"k":fmtE(n);
const daysTo=(d:string)=>Math.floor((new Date(d).getTime()-Date.now())/86400000);

const PIPE_ORDER=["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const PIPE_COL:Record<string,string>={sopralluogo:BLU,preventivo:AMB,conferma:TEAL,misure:PUR,ordini:RED,produzione:ORG,posa:"#F59E0B",chiusura:TEAL};
const PIPE_LABEL:Record<string,string>={sopralluogo:"Sopralluogo",preventivo:"Preventivo",conferma:"Conferma",misure:"Misure",ordini:"Ordini",produzione:"Produzione",posa:"Posa",chiusura:"Chiusura"};

function getRuoloColor(r:string){
  if(!r)return TEAL;
  if(r.includes("Montatore"))return PUR;
  if(r.includes("Preventiv"))return BLU;
  return AMB;
}

// Widget espandibile
function W({title,color="",badge="",count=0,onMore=null,defaultOpen=true,children}:any){
  const [open,setOpen]=useState(defaultOpen);
  return (
    <div style={{background:"#fff",borderRadius:14,border:`1px solid ${color?color+"25":"#E5E3DC"}`,overflow:"hidden",marginBottom:16}}>
      <div onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",cursor:"pointer",userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {color&&<div style={{width:10,height:10,borderRadius:"50%",background:color,flexShrink:0}}/>}
          <span style={{fontSize:15,fontWeight:700,color:DARK}}>{title}</span>
          {badge&&<span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:color?color+"15":"#F2F1EC",color:color||DARK,fontWeight:700}}>{badge}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onMore&&<span onClick={e=>{e.stopPropagation();onMore();}} style={{fontSize:12,color:"#86868b",cursor:"pointer",padding:"2px 8px",borderRadius:6,border:"1px solid #E5E3DC"}}>Vedi tutto →</span>}
          <span style={{fontSize:18,color:"#86868b",lineHeight:1}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&<div style={{borderTop:`1px solid #F2F1EC`}}>{children}</div>}
    </div>
  );
}

// KPI grande
function KPI({l,v,sub="",color="",alert=false,onClick=null}:any){
  return (
    <div onClick={onClick} style={{background:alert?color+"06":"#fff",borderRadius:14,padding:"20px 22px",border:`1px solid ${alert?color+"40":"#E5E3DC"}`,cursor:onClick?"pointer":"default",transition:"box-shadow .15s"}}
      onMouseEnter={e=>onClick&&((e.currentTarget as any).style.boxShadow="0 4px 16px rgba(0,0,0,0.08)")}
      onMouseLeave={e=>((e.currentTarget as any).style.boxShadow="none")}>
      <div style={{fontSize:12,color:"#86868b",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{l}</div>
      <div style={{fontSize:32,fontWeight:700,color:color||DARK,fontFamily:FM,lineHeight:1,marginBottom:6}}>{v}</div>
      {sub&&<div style={{fontSize:12,color:"#86868b"}}>{sub}</div>}
    </div>
  );
}

// Riga commessa
function CMRow({c,onClick,giorniFermaCM}:any){
  const gg=giorniFermaCM(c);
  const col=gg>=30?RED:gg>=15?ORG:AMB;
  return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 20px",borderBottom:"1px solid #F2F1EC",cursor:"pointer"}}
      onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
      onMouseLeave={e=>((e.currentTarget as any).style.background="transparent")}>
      <div style={{width:36,height:36,borderRadius:10,background:col+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:col,flexShrink:0}}>{(c.cliente||"?")[0]}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente} {c.cognome||""}</div>
        <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{c.code} · {PIPE_LABEL[c.fase]||c.fase} {c.euro?`· ${fmtK(parseFloat(c.euro))}`:""}</div>
      </div>
      <div style={{fontSize:13,fontWeight:700,color:col,flexShrink:0}}>{gg}gg</div>
    </div>
  );
}

export default function DesktopDashboard(){
  const {T,cantieri=[],fattureDB=[],ordiniFornDB=[],montaggiDB=[],tasks=[],msgs=[],team=[],problemi=[],aziendaInfo,setTab,setSelectedCM,setFilterFase,giorniFermaCM,sogliaDays=7}=useMastro();
  const [scadFiltro,setScadFiltro]=useState(15);

  const TODAY=new Date().toISOString().split("T")[0];
  const NOW=new Date();
  const h=NOW.getHours();
  const saluto=h<12?"Buongiorno":h<18?"Buon pomeriggio":"Buonasera";

  const attive=cantieri.filter(c=>c.fase!=="chiusura");
  const ferme=attive.filter(c=>giorniFermaCM(c)>=sogliaDays);
  const confermati=attive.filter(c=>["conferma","misure","ordini","produzione","posa"].includes(c.fase));
  const totPipeline=attive.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const totConfermato=confermati.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const daIncassare=fattureDB.filter(f=>!f.pagata).reduce((s,f)=>s+(f.importo||0),0);
  const fattScad=fattureDB.filter(f=>!f.pagata&&f.scadenza&&f.scadenza<TODAY);
  const msgNonLetti=msgs.filter(m=>!m.letto).length;
  const problemiAperti=(problemi||[]).filter(p=>p.stato!=="risolto");
  const montaggiOggi=montaggiDB.filter(m=>m.data===TODAY);
  const taskOggi=tasks.filter(t=>!t.done&&t.date===TODAY);

  const LIMIT=new Date(Date.now()+scadFiltro*86400000).toISOString().split("T")[0];
  const consegne=cantieri.filter(c=>c.dataConsegna&&c.dataConsegna>=TODAY&&c.dataConsegna<=LIMIT&&c.fase!=="chiusura");
  const fattInScad=fattureDB.filter(f=>!f.pagata&&f.scadenza&&f.scadenza>=TODAY&&f.scadenza<=LIMIT);
  const montaggiInArr=montaggiDB.filter(m=>m.data>=TODAY&&m.data<=LIMIT);

  const inProduzione=cantieri.filter(c=>c.fase==="produzione");
  const inOrdini=cantieri.filter(c=>c.fase==="ordini");
  const inPosa=cantieri.filter(c=>c.fase==="posa");

  const pratiche={p50:cantieri.filter(c=>c.detrazione==="50"),p65:cantieri.filter(c=>c.detrazione==="65"),p75:cantieri.filter(c=>c.detrazione==="75")};

  return (
    <div style={{height:"100%",overflowY:"auto",background:"#F2F1EC",fontFamily:FF}}>
      <div style={{maxWidth:1400,margin:"0 auto",padding:"24px 28px"}}>

        {/* HEADER */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24}}>
          <div>
            <div style={{fontSize:26,fontWeight:800,color:DARK,letterSpacing:-.5}}>{saluto}, {aziendaInfo?.ragione||aziendaInfo?.nome||"Walter Cozza Serramenti"}</div>
            <div style={{fontSize:14,color:"#86868b",marginTop:4}}>{NOW.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:13,color:"#86868b",marginRight:4}}>Scadenze:</span>
            {[7,15,30].map(d=>(
              <div key={d} onClick={()=>setScadFiltro(d)} style={{padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",background:scadFiltro===d?DARK:"#fff",color:scadFiltro===d?"#fff":"#86868b",border:`1px solid ${scadFiltro===d?DARK:"#E5E3DC"}`}}>{d}gg</div>
            ))}
          </div>
        </div>

        {/* ALERT */}
        {(ferme.length>0||fattScad.length>0||problemiAperti.length>0)&&(
          <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
            {ferme.length>0&&<div onClick={()=>{setFilterFase("tutte");setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:10,background:RED+"08",border:`1.5px solid ${RED}30`,cursor:"pointer"}}><div style={{width:6,height:6,borderRadius:"50%",background:RED}}/><span style={{fontSize:13,fontWeight:700,color:RED}}>{ferme.length} commesse ferme — sblocca subito</span></div>}
            {fattScad.length>0&&<div onClick={()=>setTab("contabilita")} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:10,background:AMB+"08",border:`1.5px solid ${AMB}30`,cursor:"pointer"}}><div style={{width:6,height:6,borderRadius:"50%",background:AMB}}/><span style={{fontSize:13,fontWeight:700,color:AMB}}>{fattScad.length} fatture scadute — {fmtK(fattScad.reduce((s,f)=>s+(f.importo||0),0))}</span></div>}
            {problemiAperti.length>0&&<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 16px",borderRadius:10,background:RED+"08",border:`1.5px solid ${RED}30`}}><div style={{width:6,height:6,borderRadius:"50%",background:RED}}/><span style={{fontSize:13,fontWeight:700,color:RED}}>{problemiAperti.length} problemi aperti</span></div>}
          </div>
        )}

        {/* KPI */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:12,marginBottom:24}}>
          <KPI l="Commesse attive" v={attive.length} color={TEAL} sub={`${confermati.length} confermate`} onClick={()=>setTab("commesse")}/>
          <KPI l="Commesse ferme" v={ferme.length} color={ferme.length>0?RED:TEAL} sub={`Soglia ${sogliaDays}gg`} alert={ferme.length>0} onClick={()=>setTab("commesse")}/>
          <KPI l="Pipeline" v={fmtK(totPipeline)} color={DARK} sub={`${fmtK(totConfermato)} confermato`}/>
          <KPI l="Da incassare" v={fmtK(daIncassare)} color={daIncassare>0?AMB:TEAL} sub={`${fattScad.length} scadute`} alert={fattScad.length>0} onClick={()=>setTab("contabilita")}/>
          <KPI l="Messaggi" v={msgNonLetti} color={msgNonLetti>0?BLU:TEAL} sub={`${msgs.length} totali`} onClick={()=>setTab("messaggi")}/>
          <KPI l="Problemi" v={problemiAperti.length} color={problemiAperti.length>0?RED:TEAL} sub={problemiAperti.length>0?"Da risolvere":"Tutto ok"} alert={problemiAperti.length>0}/>
        </div>

        {/* ROW 2: Pipeline + Scadenze */}
        <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:16,marginBottom:0}}>

          <W title="Pipeline commesse" badge={`${attive.length} attive`} onMore={()=>setTab("commesse")}>
            <div style={{padding:"16px 20px"}}>
              {/* Barra */}
              <div style={{display:"flex",gap:3,height:20,borderRadius:6,overflow:"hidden",marginBottom:16}}>
                {PIPE_ORDER.map(fase=>{
                  const n=cantieri.filter(c=>c.fase===fase).length;
                  if(!n)return null;
                  return <div key={fase} style={{flex:n,background:PIPE_COL[fase],minWidth:n*20,transition:"flex .3s"}} title={`${PIPE_LABEL[fase]}: ${n}`}/>;
                })}
              </div>
              {/* Griglia fasi */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {PIPE_ORDER.map(fase=>{
                  const items=cantieri.filter(c=>c.fase===fase);
                  const euro=items.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
                  const col=PIPE_COL[fase];
                  return (
                    <div key={fase} onClick={()=>{setFilterFase(fase);setTab("commesse");}} style={{padding:"12px 14px",borderRadius:10,background:items.length>0?col+"08":"#F8F7F2",border:`1px solid ${items.length>0?col+"30":"#E5E3DC"}`,cursor:"pointer",transition:"background .15s"}}
                      onMouseEnter={e=>((e.currentTarget as any).style.background=items.length>0?col+"14":"#F2F1EC")}
                      onMouseLeave={e=>((e.currentTarget as any).style.background=items.length>0?col+"08":"#F8F7F2")}>
                      <div style={{fontSize:11,color:"#86868b",fontWeight:600,marginBottom:6}}>{PIPE_LABEL[fase]}</div>
                      <div style={{fontSize:26,fontWeight:800,color:items.length>0?col:"#86868b",fontFamily:FM,lineHeight:1}}>{items.length}</div>
                      {euro>0&&<div style={{fontSize:11,color:"#86868b",marginTop:4}}>{fmtK(euro)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </W>

          <W title={`Scadenze — prossimi ${scadFiltro}gg`} color={AMB}>
            <div style={{padding:"0 20px 16px"}}>
              {/* Consegne */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.8,margin:"14px 0 8px"}}>Consegne ({consegne.length})</div>
                {consegne.length===0?<div style={{fontSize:13,color:"#86868b",padding:"8px 0"}}>Nessuna consegna programmata</div>:
                consegne.slice(0,5).map((c:any)=>(
                  <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F2F1EC",cursor:"pointer"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:DARK}}>{c.cliente} {c.cognome||""}</div>
                      <div style={{fontSize:11,color:"#86868b"}}>{c.code}</div>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:daysTo(c.dataConsegna)<=3?RED:AMB}}>{daysTo(c.dataConsegna)}gg</span>
                  </div>
                ))}
              </div>
              {/* Fatture */}
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.8,margin:"0 0 8px"}}>Fatture in scadenza ({fattInScad.length})</div>
                {fattInScad.length===0?<div style={{fontSize:13,color:"#86868b",padding:"8px 0"}}>Nessuna fattura in scadenza</div>:
                fattInScad.slice(0,4).map((f:any)=>(
                  <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F2F1EC"}}>
                    <div style={{fontSize:13,color:DARK}}>{f.cliente||f.numero||"—"}</div>
                    <div style={{display:"flex",gap:12,alignItems:"center"}}>
                      <span style={{fontSize:13,fontWeight:700,color:AMB}}>{fmtK(f.importo||0)}</span>
                      <span style={{fontSize:12,fontWeight:700,color:daysTo(f.scadenza)<=0?RED:AMB}}>{daysTo(f.scadenza)<=0?"Scaduta":`${daysTo(f.scadenza)}gg`}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Montaggi */}
              <div>
                <div style={{fontSize:11,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:.8,margin:"0 0 8px"}}>Montaggi ({montaggiInArr.length})</div>
                {montaggiInArr.length===0?<div style={{fontSize:13,color:"#86868b",padding:"8px 0"}}>Nessun montaggio programmato</div>:
                montaggiInArr.slice(0,4).map((m:any)=>(
                  <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F2F1EC"}}>
                    <div style={{fontSize:13,color:DARK}}>{m.cliente||m.note||"—"}</div>
                    <span style={{fontSize:12,fontWeight:700,color:PUR}}>{m.data===TODAY?"Oggi":`${daysTo(m.data)}gg`}</span>
                  </div>
                ))}
              </div>
            </div>
          </W>
        </div>

        {/* ROW 3: Produzione + Oggi + Pratiche */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>

          <W title="Produzione" color={ORG} badge={`${inProduzione.length} attive`} onMore={()=>setTab("produzione")}>
            <div style={{padding:"8px 0 8px"}}>
              {[{l:"In produzione",n:inProduzione.length,c:ORG},{l:"In attesa ordini",n:inOrdini.length,c:AMB},{l:"Pronte per posa",n:inPosa.length,c:TEAL},{l:"Ordini fornitori aperti",n:(ordiniFornDB||[]).filter((o:any)=>o.stato==="inviato").length,c:BLU}].map(row=>(
                <div key={row.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderBottom:"1px solid #F2F1EC"}}>
                  <span style={{fontSize:14,color:"#86868b"}}>{row.l}</span>
                  <span style={{fontSize:22,fontWeight:800,color:row.n>0?row.c:"#86868b",fontFamily:FM}}>{row.n}</span>
                </div>
              ))}
              {inProduzione.slice(0,3).map((c:any)=>(
                <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:"1px solid #F2F1EC",cursor:"pointer"}}>
                  <span style={{fontSize:13,color:DARK,fontWeight:600}}>{c.cliente} {c.cognome||""}</span>
                  <span style={{fontSize:11,color:ORG,fontWeight:700}}>{c.code}</span>
                </div>
              ))}
            </div>
          </W>

          <W title="Oggi" color={PUR}>
            <div style={{padding:"8px 0"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,padding:"12px 20px 16px"}}>
                <div style={{padding:"14px",borderRadius:10,background:PUR+"08",textAlign:"center"}}>
                  <div style={{fontSize:36,fontWeight:800,color:PUR,fontFamily:FM,lineHeight:1}}>{montaggiOggi.length}</div>
                  <div style={{fontSize:12,color:"#86868b",marginTop:6}}>montaggi oggi</div>
                </div>
                <div style={{padding:"14px",borderRadius:10,background:AMB+"08",textAlign:"center"}}>
                  <div style={{fontSize:36,fontWeight:800,color:AMB,fontFamily:FM,lineHeight:1}}>{taskOggi.length}</div>
                  <div style={{fontSize:12,color:"#86868b",marginTop:6}}>task oggi</div>
                </div>
              </div>
              {montaggiOggi.length===0?<div style={{fontSize:13,color:"#86868b",textAlign:"center",padding:"12px 20px"}}>Nessun montaggio oggi</div>:
              montaggiOggi.slice(0,4).map((m:any)=>(
                <div key={m.id} style={{padding:"10px 20px",borderBottom:"1px solid #F2F1EC"}}>
                  <div style={{fontSize:13,fontWeight:600,color:DARK}}>{m.cliente||"—"}</div>
                  <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{m.orario||""}{m.indirizzo?` · ${m.indirizzo}`:""}</div>
                </div>
              ))}
            </div>
          </W>

          <W title="Pratiche fiscali" color={BLU}>
            <div style={{padding:"8px 0"}}>
              {[{l:"Ristrutturazione 50%",items:pratiche.p50,c:TEAL},{l:"Ecobonus 65%",items:pratiche.p65,c:BLU},{l:"Barriere 75%",items:pratiche.p75,c:PUR}].map(row=>(
                <div key={row.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 20px",borderBottom:"1px solid #F2F1EC"}}>
                  <div>
                    <div style={{fontSize:14,color:DARK,fontWeight:500}}>{row.l}</div>
                    <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{row.items.length} commesse</div>
                  </div>
                  <span style={{fontSize:24,fontWeight:800,color:row.items.length>0?row.c:"#86868b",fontFamily:FM}}>{row.items.length}</span>
                </div>
              ))}
              <div style={{padding:"14px 20px"}}>
                <div style={{fontSize:11,color:"#86868b",marginBottom:4}}>Valore detraibile totale</div>
                <div style={{fontSize:24,fontWeight:800,color:BLU,fontFamily:FM}}>{fmtK([...pratiche.p50,...pratiche.p65,...pratiche.p75].reduce((s,c)=>s+(parseFloat(c.euro)||0),0))}</div>
              </div>
            </div>
          </W>
        </div>

        {/* ROW 4: Team + Problemi + Ferme */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>

          <W title="Team — adesso" onMore={()=>setTab("settings")}>
            <div style={{padding:"0"}}>
              {(team.length>0?team:[{id:"1",nome:"Titolare",ruolo:"Titolare"}]).map((m:any,i:number)=>{
                const inCantiere=montaggiDB.some(mt=>mt.operatoreId===m.id&&mt.data===TODAY);
                const tc=tasks.filter(t=>t.assegnatoA===m.id&&!t.done).length;
                const col=m.colore||getRuoloColor(m.ruolo);
                return (
                  <div key={m.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:"1px solid #F2F1EC"}}>
                    <div style={{width:40,height:40,borderRadius:10,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:col,flexShrink:0}}>{(m.nome||"?")[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:DARK}}>{m.nome}</div>
                      <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{m.ruolo||"—"}</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      {inCantiere&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:TEAL+"15",color:TEAL,fontWeight:700}}>Cantiere</span>}
                      {tc>0&&<span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:AMB+"15",color:AMB,fontWeight:700}}>{tc} task</span>}
                      {!inCantiere&&tc===0&&<span style={{fontSize:11,color:"#86868b"}}>—</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </W>

          <W title="Problemi e criticità" color={problemiAperti.length>0?RED:TEAL} badge={problemiAperti.length>0?`${problemiAperti.length} aperti`:""}>
            <div style={{padding:"0"}}>
              {problemiAperti.length===0
                ?<div style={{fontSize:14,color:"#86868b",textAlign:"center",padding:"24px 20px"}}>Nessun problema aperto ✓</div>
                :problemiAperti.slice(0,6).map((p:any,i:number)=>(
                <div key={p.id||i} style={{padding:"12px 20px",borderBottom:"1px solid #F2F1EC"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titolo||"—"}</div>
                      <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{p.tipo||""}{p.commessa?` · ${p.commessa}`:""}</div>
                    </div>
                    <span style={{fontSize:11,padding:"3px 8px",borderRadius:6,background:p.priorita==="alta"?RED+"15":p.priorita==="media"?AMB+"15":"#F2F1EC",color:p.priorita==="alta"?RED:p.priorita==="media"?AMB:"#86868b",fontWeight:700,flexShrink:0}}>{p.priorita||"—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </W>

          <W title="Commesse da sbloccare" color={ferme.length>0?RED:""} badge={ferme.length>0?`${ferme.length} ferme`:""} onMore={()=>setTab("commesse")}>
            <div style={{padding:"0"}}>
              {ferme.length===0
                ?<div style={{fontSize:14,color:"#86868b",textAlign:"center",padding:"24px 20px"}}>Tutto in ordine ✓</div>
                :ferme.slice(0,8).map((c:any,i:number)=><CMRow key={c.id} c={c} giorniFermaCM={giorniFermaCM} onClick={()=>{setSelectedCM(c);setTab("commesse");}}/>)
              }
            </div>
          </W>
        </div>

      </div>
    </div>
  );
}
