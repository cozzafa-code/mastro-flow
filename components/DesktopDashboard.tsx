"use client";
// @ts-nocheck
// MASTRO — DesktopDashboard v2
// Azienda a colpo d'occhio: KPI, scadenze, produzione, team, problemi, pratiche

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",AMB="#D08008",PUR="#8B5CF6",BLU="#3B7FE0",ORG="#F97316";
const fmtE=(n:number)=>"€"+Math.round(n).toLocaleString("it-IT");
const fmtK=(n:number)=>n>=1000?"€"+Math.round(n/1000)+"k":fmtE(n);
const daysFrom=(d:string)=>Math.floor((Date.now()-new Date(d).getTime())/86400000);
const daysTo=(d:string)=>Math.floor((new Date(d).getTime()-Date.now())/86400000);

const PIPE_ORDER=["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
const PIPE_COL:Record<string,string>={sopralluogo:BLU,preventivo:AMB,conferma:TEAL,misure:PUR,ordini:RED,produzione:ORG,posa:"#F59E0B",chiusura:TEAL};

function getRuoloColor(r:string){
  if(!r)return TEAL;
  if(r.includes("Montatore"))return PUR;
  if(r.includes("Preventiv"))return BLU;
  if(r.includes("Ammin"))return TEAL;
  return AMB;
}

// ── Widget container ─────────────────────────────────────────
function Widget({title,sub="",color="",badge="",onMore=null,children,style={}}:any){
  const [expanded,setExpanded]=useState(true);
  return (
    <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${color?color+"30":"#E5E3DC"}`,overflow:"hidden",...style}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:expanded?`0.5px solid #E5E3DC`:"none",cursor:"pointer"}} onClick={()=>setExpanded(e=>!e)}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {color&&<div style={{width:8,height:8,borderRadius:"50%",background:color,flexShrink:0}}/>}
          <span style={{fontSize:13,fontWeight:600,color:DARK}}>{title}</span>
          {sub&&<span style={{fontSize:11,color:"#86868b"}}>{sub}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {badge&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:color?color+"15":"#F2F1EC",color:color||DARK,fontWeight:600}}>{badge}</span>}
          {onMore&&<span style={{fontSize:11,color:"#86868b",cursor:"pointer"}} onClick={e=>{e.stopPropagation();onMore();}}> →</span>}
          <span style={{fontSize:10,color:"#86868b"}}>{expanded?"▲":"▼"}</span>
        </div>
      </div>
      {expanded&&<div>{children}</div>}
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────
function KPI({l,v,sub="",color="",alert=false,onClick=null}:any){
  return (
    <div onClick={onClick} style={{background:alert?color+"06":"#fff",borderRadius:10,padding:"14px 16px",border:`0.5px solid ${alert?color+"40":"#E5E3DC"}`,cursor:onClick?"pointer":"default"}}>
      <div style={{fontSize:11,color:"#86868b",marginBottom:4,fontWeight:500}}>{l}</div>
      <div style={{fontSize:22,fontWeight:600,color:color||DARK,fontFamily:FM,lineHeight:1}}>{v}</div>
      {sub&&<div style={{fontSize:11,color:"#86868b",marginTop:4}}>{sub}</div>}
    </div>
  );
}

export default function DesktopDashboard(){
  const {
    T,cantieri=[],fattureDB=[],ordiniFornDB=[],montaggiDB=[],tasks=[],
    msgs=[],team=[],events=[],aziendaInfo,problemi=[],
    setTab,setSelectedCM,setFilterFase,giorniFermaCM,sogliaDays=7
  }=useMastro();

  const [scadFiltro,setScadFiltro]=useState(15); // giorni scadenze

  const TODAY=new Date().toISOString().split("T")[0];
  const NOW=new Date();
  const h=NOW.getHours();
  const saluto=h<12?"Buongiorno":h<18?"Buon pomeriggio":"Buonasera";

  // ── KPI ────────────────────────────────────────────────────
  const attive=cantieri.filter(c=>c.fase!=="chiusura");
  const ferme=attive.filter(c=>giorniFermaCM(c)>=sogliaDays);
  const confermati=attive.filter(c=>["conferma","misure","ordini","produzione","posa"].includes(c.fase));
  const totPipeline=attive.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const totConfermato=confermati.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const daIncassare=fattureDB.filter(f=>!f.pagata).reduce((s,f)=>s+(f.importo||0),0);
  const fattScad=fattureDB.filter(f=>!f.pagata&&f.scadenza&&f.scadenza<TODAY);
  const msgNonLetti=msgs.filter(m=>!m.letto).length;
  const taskUrgenti=tasks.filter(t=>!t.done&&t.priority==="alta");
  const problemiAperti=(problemi||[]).filter(p=>p.stato!=="risolto");

  // ── Scadenze ────────────────────────────────────────────────
  const LIMIT=new Date(Date.now()+scadFiltro*86400000).toISOString().split("T")[0];
  const consegneInArrivo=cantieri.filter(c=>c.dataConsegna&&c.dataConsegna>=TODAY&&c.dataConsegna<=LIMIT&&c.fase!=="chiusura");
  const fattureInScad=fattureDB.filter(f=>!f.pagata&&f.scadenza&&f.scadenza>=TODAY&&f.scadenza<=LIMIT);
  const montaggiInArrivo=montaggiDB.filter(m=>m.data>=TODAY&&m.data<=LIMIT);
  const montaggiOggi=montaggiDB.filter(m=>m.data===TODAY);

  // ── Produzione ─────────────────────────────────────────────
  const inProduzione=cantieri.filter(c=>c.fase==="produzione");
  const inOrdini=cantieri.filter(c=>c.fase==="ordini");
  const inPosa=cantieri.filter(c=>c.fase==="posa");
  const ordiniAttesa=(ordiniFornDB||[]).filter(o=>o.stato==="inviato"||o.stato==="attesa");

  // ── Pratiche fiscali ───────────────────────────────────────
  const pratiche50=cantieri.filter(c=>c.detrazione==="50");
  const pratiche65=cantieri.filter(c=>c.detrazione==="65");
  const pratiche75=cantieri.filter(c=>c.detrazione==="75");

  return (
    <div style={{height:"100%",overflowY:"auto",padding:"16px 20px",background:"#F2F1EC",fontFamily:FF}}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:DARK}}>{saluto}, {aziendaInfo?.ragione||aziendaInfo?.nome||"Walter Cozza Serramenti"}</div>
          <div style={{fontSize:12,color:"#86868b",marginTop:2}}>{NOW.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[7,15,30].map(d=>(
            <div key={d} onClick={()=>setScadFiltro(d)} style={{padding:"5px 12px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",background:scadFiltro===d?DARK:"#fff",color:scadFiltro===d?"#fff":"#86868b",border:`0.5px solid ${scadFiltro===d?DARK:"#E5E3DC"}`}}>{d}gg</div>
          ))}
        </div>
      </div>

      {/* ── ALERT BAR ──────────────────────────────────────── */}
      {(ferme.length>0||fattScad.length>0||taskUrgenti.length>0||problemiAperti.length>0)&&(
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {ferme.length>0&&<div onClick={()=>{setFilterFase("tutte");setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,background:RED+"08",border:`1px solid ${RED}30`,cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:RED}}/><span style={{fontSize:12,fontWeight:600,color:RED}}>{ferme.length} commesse ferme — sblocca subito</span></div>}
          {fattScad.length>0&&<div onClick={()=>setTab("contabilita")} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,background:AMB+"08",border:`1px solid ${AMB}30`,cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:AMB}}/><span style={{fontSize:12,fontWeight:600,color:AMB}}>{fattScad.length} fatture scadute — {fmtK(fattScad.reduce((s,f)=>s+(f.importo||0),0))}</span></div>}
          {taskUrgenti.length>0&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,background:PUR+"08",border:`1px solid ${PUR}30`}}><div style={{width:5,height:5,borderRadius:"50%",background:PUR}}/><span style={{fontSize:12,fontWeight:600,color:PUR}}>{taskUrgenti.length} task urgenti</span></div>}
          {problemiAperti.length>0&&<div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,background:RED+"08",border:`1px solid ${RED}30`}}><div style={{width:5,height:5,borderRadius:"50%",background:RED}}/><span style={{fontSize:12,fontWeight:600,color:RED}}>{problemiAperti.length} problemi aperti</span></div>}
        </div>
      )}

      {/* ── KPI ROW ────────────────────────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:14}}>
        <KPI l="Commesse attive" v={attive.length} color={TEAL} sub={`${confermati.length} confermate`} onClick={()=>setTab("commesse")}/>
        <KPI l="Commesse ferme" v={ferme.length} color={ferme.length>0?RED:TEAL} sub={`Soglia ${sogliaDays}gg`} alert={ferme.length>0} onClick={()=>setTab("commesse")}/>
        <KPI l="Pipeline valore" v={fmtK(totPipeline)} color={DARK} sub={`${fmtK(totConfermato)} confermato`}/>
        <KPI l="Da incassare" v={fmtK(daIncassare)} color={daIncassare>0?AMB:TEAL} sub={`${fattScad.length} scadute`} alert={fattScad.length>0} onClick={()=>setTab("contabilita")}/>
        <KPI l="Messaggi nuovi" v={msgNonLetti} color={msgNonLetti>0?BLU:TEAL} sub={`${msgs.length} totali`} onClick={()=>setTab("messaggi")}/>
        <KPI l="Problemi aperti" v={problemiAperti.length} color={problemiAperti.length>0?RED:TEAL} sub={problemiAperti.length>0?"Da risolvere":"Tutto ok"} alert={problemiAperti.length>0}/>
      </div>

      {/* ── ROW 2: Pipeline + Scadenze ─────────────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"3fr 2fr",gap:12,marginBottom:12}}>

        {/* Pipeline */}
        <Widget title="Pipeline commesse" badge={`${attive.length} attive`} onMore={()=>setTab("commesse")}>
          <div style={{padding:"12px 16px"}}>
            <div style={{display:"flex",gap:2,height:16,borderRadius:4,overflow:"hidden",marginBottom:12}}>
              {PIPE_ORDER.map(fase=>{
                const n=cantieri.filter(c=>c.fase===fase).length;
                if(!n)return null;
                return <div key={fase} style={{flex:n,background:PIPE_COL[fase]||TEAL,minWidth:n*16}} title={`${fase}: ${n}`}/>;
              })}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {PIPE_ORDER.map(fase=>{
                const items=cantieri.filter(c=>c.fase===fase);
                const euro=items.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
                const col=PIPE_COL[fase]||TEAL;
                return (
                  <div key={fase} onClick={()=>{setFilterFase(fase);setTab("commesse");}} style={{padding:"8px 10px",borderRadius:8,background:items.length>0?col+"08":"#F8F7F2",border:`0.5px solid ${items.length>0?col+"30":"#E5E3DC"}`,cursor:"pointer"}}>
                    <div style={{fontSize:10,color:"#86868b",textTransform:"capitalize",marginBottom:2}}>{fase}</div>
                    <div style={{fontSize:18,fontWeight:700,color:items.length>0?col:"#86868b",fontFamily:FM}}>{items.length}</div>
                    {euro>0&&<div style={{fontSize:9,color:"#86868b",marginTop:2}}>{fmtK(euro)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </Widget>

        {/* Scadenze */}
        <Widget title={`Scadenze prossimi ${scadFiltro}gg`} color={AMB}>
          <div style={{padding:"0 16px 12px"}}>
            {/* Consegne */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,margin:"10px 0 6px"}}>Consegne ({consegneInArrivo.length})</div>
              {consegneInArrivo.length===0&&<div style={{fontSize:11,color:"#86868b",padding:"6px 0"}}>Nessuna consegna programmata</div>}
              {consegneInArrivo.slice(0,4).map((c:any)=>(
                <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"0.5px solid #F2F1EC",cursor:"pointer"}}>
                  <span style={{fontSize:12,color:DARK,fontWeight:500}}>{c.cliente} {c.cognome||""}</span>
                  <span style={{fontSize:11,fontWeight:600,color:daysTo(c.dataConsegna)<=3?RED:AMB}}>{daysTo(c.dataConsegna)}gg</span>
                </div>
              ))}
            </div>
            {/* Fatture */}
            <div style={{marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,margin:"10px 0 6px"}}>Fatture in scadenza ({fattureInScad.length})</div>
              {fattureInScad.length===0&&<div style={{fontSize:11,color:"#86868b",padding:"6px 0"}}>Nessuna fattura in scadenza</div>}
              {fattureInScad.slice(0,3).map((f:any)=>(
                <div key={f.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"0.5px solid #F2F1EC"}}>
                  <span style={{fontSize:12,color:DARK}}>{f.cliente||f.numero||"—"}</span>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,color:AMB,fontWeight:600}}>{fmtK(f.importo||0)}</span>
                    <span style={{fontSize:11,color:daysTo(f.scadenza)<=0?RED:AMB,fontWeight:600}}>{daysTo(f.scadenza)<=0?"Scaduta":`${daysTo(f.scadenza)}gg`}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Montaggi */}
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,margin:"10px 0 6px"}}>Montaggi ({montaggiInArrivo.length})</div>
              {montaggiInArrivo.length===0&&<div style={{fontSize:11,color:"#86868b",padding:"6px 0"}}>Nessun montaggio programmato</div>}
              {montaggiInArrivo.slice(0,3).map((m:any)=>(
                <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"0.5px solid #F2F1EC"}}>
                  <span style={{fontSize:12,color:DARK}}>{m.cliente||m.note||"—"}</span>
                  <span style={{fontSize:11,color:PUR,fontWeight:600}}>{m.data===TODAY?"Oggi":`${daysTo(m.data)}gg`}</span>
                </div>
              ))}
            </div>
          </div>
        </Widget>
      </div>

      {/* ── ROW 3: Produzione + Ordini + Oggi ──────────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:12}}>

        {/* Stato produzione */}
        <Widget title="Produzione" color={ORG} badge={`${inProduzione.length} attive`} onMore={()=>setTab("produzione")}>
          <div style={{padding:"8px 16px 12px"}}>
            {[
              {l:"In produzione",n:inProduzione.length,c:ORG},
              {l:"In attesa ordini",n:inOrdini.length,c:AMB},
              {l:"Pronte per posa",n:inPosa.length,c:TEAL},
              {l:"Ordini fornitori",n:ordiniAttesa.length,c:BLU},
            ].map(row=>(
              <div key={row.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"0.5px solid #F2F1EC"}}>
                <span style={{fontSize:12,color:"#86868b"}}>{row.l}</span>
                <span style={{fontSize:14,fontWeight:700,color:row.n>0?row.c:"#86868b",fontFamily:FM}}>{row.n}</span>
              </div>
            ))}
            {inProduzione.slice(0,3).map((c:any)=>(
              <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",cursor:"pointer"}}>
                <span style={{fontSize:11,color:DARK}}>{c.cliente} {c.cognome||""}</span>
                <span style={{fontSize:10,color:ORG,fontWeight:600}}>{c.code}</span>
              </div>
            ))}
          </div>
        </Widget>

        {/* Oggi */}
        <Widget title="Oggi" color={PUR}>
          <div style={{padding:"8px 16px 12px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div style={{padding:"10px",borderRadius:8,background:PUR+"08",textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:700,color:PUR,fontFamily:FM}}>{montaggiOggi.length}</div>
                <div style={{fontSize:10,color:"#86868b"}}>montaggi oggi</div>
              </div>
              <div style={{padding:"10px",borderRadius:8,background:AMB+"08",textAlign:"center"}}>
                <div style={{fontSize:24,fontWeight:700,color:AMB,fontFamily:FM}}>{tasks.filter(t=>!t.done&&t.date===TODAY).length}</div>
                <div style={{fontSize:10,color:"#86868b"}}>task oggi</div>
              </div>
            </div>
            {montaggiOggi.length>0&&(
              <>
                <div style={{fontSize:10,fontWeight:700,color:"#86868b",textTransform:"uppercase",letterSpacing:.7,marginBottom:6}}>Montaggi di oggi</div>
                {montaggiOggi.slice(0,3).map((m:any)=>(
                  <div key={m.id} style={{padding:"5px 0",borderBottom:"0.5px solid #F2F1EC"}}>
                    <div style={{fontSize:12,fontWeight:500,color:DARK}}>{m.cliente||"—"}</div>
                    <div style={{fontSize:10,color:"#86868b"}}>{m.orario||""} · {m.indirizzo||""}</div>
                  </div>
                ))}
              </>
            )}
            {montaggiOggi.length===0&&<div style={{fontSize:12,color:"#86868b",textAlign:"center",padding:"10px 0"}}>Nessun montaggio oggi</div>}
          </div>
        </Widget>

        {/* Pratiche fiscali */}
        <Widget title="Pratiche fiscali" color={BLU}>
          <div style={{padding:"8px 16px 12px"}}>
            {[
              {l:"Ristrutturazione 50%",n:pratiche50.length,c:TEAL},
              {l:"Ecobonus 65%",n:pratiche65.length,c:BLU},
              {l:"Barriere 75%",n:pratiche75.length,c:PUR},
            ].map(row=>(
              <div key={row.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"0.5px solid #F2F1EC"}}>
                <span style={{fontSize:12,color:"#86868b"}}>{row.l}</span>
                <span style={{fontSize:16,fontWeight:700,color:row.n>0?row.c:"#86868b",fontFamily:FM}}>{row.n}</span>
              </div>
            ))}
            <div style={{marginTop:10,padding:"8px 10px",borderRadius:8,background:BLU+"08"}}>
              <div style={{fontSize:10,color:"#86868b",marginBottom:2}}>Valore detraibile totale</div>
              <div style={{fontSize:16,fontWeight:700,color:BLU,fontFamily:FM}}>
                {fmtK([...pratiche50,...pratiche65,...pratiche75].reduce((s,c)=>s+(parseFloat(c.euro)||0),0))}
              </div>
            </div>
          </div>
        </Widget>
      </div>

      {/* ── ROW 4: Team + Problemi + Commesse ferme ────────── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>

        {/* Team live */}
        <Widget title="Team — adesso" onMore={()=>setTab("settings")}>
          <div style={{padding:"4px 16px 12px"}}>
            {(team.length>0?team:[{id:"1",nome:"Titolare",ruolo:"Titolare"}]).map((m:any,i:number)=>{
              const inCantiere=montaggiDB.some(mt=>mt.operatoreId===m.id&&mt.data===TODAY);
              const taskCount=tasks.filter(t=>t.assegnatoA===m.id&&!t.done).length;
              const col=m.colore||getRuoloColor(m.ruolo);
              return (
                <div key={m.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<team.length-1?"0.5px solid #F2F1EC":"none"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:col,flexShrink:0}}>{(m.nome||"?")[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:DARK}}>{m.nome}</div>
                    <div style={{fontSize:10,color:"#86868b"}}>{m.ruolo||"—"}</div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    {inCantiere&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:TEAL+"15",color:TEAL,fontWeight:600}}>Cantiere</span>}
                    {taskCount>0&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:AMB+"15",color:AMB,fontWeight:600}}>{taskCount}t</span>}
                    {!inCantiere&&taskCount===0&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:"#F2F1EC",color:"#86868b"}}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Widget>

        {/* Problemi e criticità */}
        <Widget title="Problemi e criticità" color={problemiAperti.length>0?RED:TEAL} badge={problemiAperti.length>0?`${problemiAperti.length} aperti`:""}>
          <div style={{padding:"4px 16px 12px"}}>
            {problemiAperti.length===0&&(
              <div style={{fontSize:12,color:"#86868b",textAlign:"center",padding:"16px 0"}}>Nessun problema aperto ✓</div>
            )}
            {problemiAperti.slice(0,5).map((p:any,i:number)=>(
              <div key={p.id||i} style={{padding:"7px 0",borderBottom:i<Math.min(problemiAperti.length-1,4)?"0.5px solid #F2F1EC":"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.titolo||"—"}</div>
                    <div style={{fontSize:10,color:"#86868b"}}>{p.tipo||""} · {p.commessa||""}</div>
                  </div>
                  <span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:p.priorita==="alta"?RED+"15":p.priorita==="media"?AMB+"15":"#F2F1EC",color:p.priorita==="alta"?RED:p.priorita==="media"?AMB:"#86868b",fontWeight:600,flexShrink:0}}>{p.priorita||"—"}</span>
                </div>
              </div>
            ))}
          </div>
        </Widget>

        {/* Commesse ferme */}
        <Widget title="Commesse da sbloccare" color={ferme.length>0?RED:""} badge={ferme.length>0?`${ferme.length} ferme`:""} onMore={()=>setTab("commesse")}>
          <div style={{padding:"4px 16px 12px"}}>
            {ferme.length===0&&<div style={{fontSize:12,color:"#86868b",textAlign:"center",padding:"16px 0"}}>Tutto in ordine ✓</div>}
            {ferme.slice(0,5).map((c:any,i:number)=>(
              <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<Math.min(ferme.length-1,4)?"0.5px solid #F2F1EC":"none",cursor:"pointer"}}>
                <div style={{width:28,height:28,borderRadius:7,background:RED+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:RED,flexShrink:0}}>{(c.cliente||"?")[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.cliente} {c.cognome||""}</div>
                  <div style={{fontSize:10,color:"#86868b"}}>{c.code} · {c.fase}</div>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:RED,flexShrink:0}}>{giorniFermaCM(c)}gg</div>
              </div>
            ))}
          </div>
        </Widget>
      </div>

    </div>
  );
}
