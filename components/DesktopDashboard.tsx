"use client";
// @ts-nocheck
// MASTRO — DesktopDashboard.tsx
// Vista titolare: KPI real-time, pipeline, margini, team, allerte, previsioni

import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", PURPLE="#8B5CF6", BLUE="#3B7FE0";

export default function DesktopDashboard() {
  const { T, cantieri=[], fattureDB=[], ordiniFornDB=[], montaggiDB=[], tasks=[], msgs=[], team=[], squadreDB=[], events=[], aziendaInfo, setTab, setSelectedCM, setFilterFase, giorniFermaCM, sogliaDays=7 } = useMastro();

  const TODAY = new Date().toISOString().split("T")[0];
  const NOW = new Date();
  const h = NOW.getHours();
  const saluto = h<12?"Buongiorno":h<18?"Buon pomeriggio":"Buonasera";

  // KPI principali
  const attive = cantieri.filter(c=>c.fase!=="chiusura");
  const ferme = attive.filter(c=>giorniFermaCM(c)>=sogliaDays);
  const confermati = attive.filter(c=>c.confermato||["conferma","misure","ordini","produzione","posa"].includes(c.fase));
  const totPreventivato = attive.filter(c=>c.euro).reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const totConfermato = confermati.reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
  const fattScad = fattureDB.filter(f=>!f.pagata&&f.scadenza<TODAY);
  const daIncassare = fattureDB.filter(f=>!f.pagata).reduce((s,f)=>s+(f.importo||0),0);
  const fatturatoBrut = fattureDB.filter(f=>f.pagata).reduce((s,f)=>s+(f.importo||0),0);
  const msgNonLetti = msgs.filter(m=>!m.letto).length;
  const taskUrgenti = tasks.filter(t=>!t.done&&t.priority==="alta");
  const montaggiOggi = montaggiDB.filter(m=>m.data===TODAY);
  const montaggiSettimana = montaggiDB.filter(m=>m.data>=TODAY&&m.data<=new Date(NOW.getTime()+7*86400000).toISOString().split("T")[0]);

  // Trend mensile (ultimi 3 mesi vs 3 mesi prima)
  const mese = NOW.getMonth(), anno = NOW.getFullYear();
  const fatt3m = fattureDB.filter(f=>{const d=new Date(f.data||"");return f.pagata&&d.getFullYear()===anno&&d.getMonth()>=mese-2&&d.getMonth()<=mese;}).reduce((s,f)=>s+(f.importo||0),0);

  const fmtE = (n:number) => "€"+Math.round(n).toLocaleString("it-IT");
  const fmtK = (n:number) => n>=1000?"€"+Math.round(n/1000)+"k":fmtE(n);

  const KpiCard = ({l,v,sub="",c="",onClick=null,alert=false}:any) => (
    <div onClick={onClick} style={{background:"#fff",borderRadius:12,padding:"14px 16px",border:`0.5px solid ${alert?c+"40":T.bdr}`,cursor:onClick?"pointer":"default",transition:"box-shadow .15s",background:alert?c+"04":"#fff"}}>
      <div style={{fontSize:11,color:T.sub,marginBottom:6}}>{l}</div>
      <div style={{fontSize:24,fontWeight:500,color:c||T.text,fontFamily:FM,lineHeight:1}}>{v}</div>
      {sub&&<div style={{fontSize:11,color:T.sub,marginTop:4}}>{sub}</div>}
    </div>
  );

  // Pipeline PIPELINE breakdown
  const PIPELINE_ORDER = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
  const PIPE_COLORS: Record<string,string> = {sopralluogo:BLUE,preventivo:AMBER,conferma:TEAL,misure:PURPLE,ordini:RED,produzione:"#F97316",posa:"#F59E0B",chiusura:TEAL};

  return (
    <div style={{height:"100%",overflowY:"auto",padding:20,background:"#F4F6F8"}}>
      {/* HEADER */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:500,color:DARK,letterSpacing:-0.5}}>{saluto}, {aziendaInfo?.nome||aziendaInfo?.ragione||"MASTRO"}</div>
        <div style={{fontSize:13,color:T.sub,marginTop:2}}>{NOW.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      </div>

      {/* ALLERTE CRITICHE */}
      {(ferme.length>0||fattScad.length>0||taskUrgenti.length>0)&&(
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap" as any}}>
          {ferme.length>0&&(
            <div onClick={()=>{setFilterFase("tutte");setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:RED+"08",border:`1px solid ${RED}25`,cursor:"pointer"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:RED,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:500,color:RED}}>{ferme.length} commesse ferme — sblocca subito</span>
            </div>
          )}
          {fattScad.length>0&&(
            <div onClick={()=>setTab("contabilita")} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:AMBER+"08",border:`1px solid ${AMBER}25`,cursor:"pointer"}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:AMBER,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:500,color:AMBER}}>{fattScad.length} fatture scadute — {fmtK(fattScad.reduce((s,f)=>s+(f.importo||0),0))}</span>
            </div>
          )}
          {taskUrgenti.length>0&&(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,background:PURPLE+"08",border:`1px solid ${PURPLE}25`}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:PURPLE,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:500,color:PURPLE}}>{taskUrgenti.length} task urgenti</span>
            </div>
          )}
        </div>
      )}

      {/* KPI GRIGLIA */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
        <KpiCard l="Commesse attive" v={attive.length} c={TEAL} sub={`${confermati.length} confermate`} onClick={()=>setTab("commesse")}/>
        <KpiCard l="Commesse ferme" v={ferme.length} c={ferme.length>0?RED:TEAL} sub={ferme.length>0?`Soglia: ${sogliaDays}gg`:"Tutto ok"} alert={ferme.length>0} onClick={()=>setTab("commesse")}/>
        <KpiCard l="Pipeline valore" v={fmtK(totPreventivato)} c={DARK} sub={`${fmtK(totConfermato)} confermato`}/>
        <KpiCard l="Da incassare" v={fmtK(daIncassare)} c={daIncassare>0?AMBER:TEAL} sub={`${fattScad.length} scadute`} alert={fattScad.length>0} onClick={()=>setTab("contabilita")}/>
        <KpiCard l="Messaggi nuovi" v={msgNonLetti} c={msgNonLetti>0?BLUE:TEAL} sub={`${msgs.length} totali`} onClick={()=>setTab("messaggi")}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:14}}>
        {/* PIPELINE VISUALE */}
        <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>Pipeline commesse</span>
            <span style={{fontSize:11,color:T.sub,cursor:"pointer"}} onClick={()=>setTab("commesse")}>{attive.length} attive →</span>
          </div>
          {/* Barra visuale */}
          <div style={{display:"flex",gap:2,height:20,borderRadius:6,overflow:"hidden",marginBottom:14}}>
            {PIPELINE_ORDER.map(fase=>{
              const n=cantieri.filter(c=>c.fase===fase).length;
              if(!n)return null;
              const c=PIPE_COLORS[fase]||TEAL;
              return <div key={fase} style={{flex:n,background:c,minWidth:n*20}} title={`${fase}: ${n}`}/>;
            })}
          </div>
          {/* Dettaglio per fase */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
            {PIPELINE_ORDER.map(fase=>{
              const n=cantieri.filter(c=>c.fase===fase).length;
              const euro=cantieri.filter(c=>c.fase===fase).reduce((s,c)=>s+(parseFloat(c.euro)||0),0);
              const c=PIPE_COLORS[fase]||TEAL;
              return (
                <div key={fase} onClick={()=>{setFilterFase(fase);setTab("commesse");}} style={{padding:"8px 10px",borderRadius:8,background:n>0?c+"08":"#F8FAFC",border:`0.5px solid ${n>0?c+"25":T.bdr}`,cursor:"pointer"}}>
                  <div style={{fontSize:10,color:T.sub,textTransform:"capitalize" as any}}>{fase}</div>
                  <div style={{fontSize:16,fontWeight:500,color:n>0?c:T.sub,fontFamily:FM}}>{n}</div>
                  {euro>0&&<div style={{fontSize:9,color:T.sub}}>{fmtK(euro)}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* OGGI */}
        <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
          <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>Oggi</div>
          <div style={{display:"flex",flexDirection:"column" as any,gap:8}}>
            <div onClick={()=>setTab("montaggi")} style={{padding:"10px 12px",borderRadius:8,background:PURPLE+"08",border:`0.5px solid ${PURPLE}20`,cursor:"pointer"}}>
              <div style={{fontSize:20,fontWeight:500,color:PURPLE,fontFamily:FM}}>{montaggiOggi.length}</div>
              <div style={{fontSize:11,color:T.sub}}>montaggi oggi</div>
            </div>
            <div style={{padding:"10px 12px",borderRadius:8,background:TEAL+"08",border:`0.5px solid ${TEAL}20`}}>
              <div style={{fontSize:20,fontWeight:500,color:TEAL,fontFamily:FM}}>{montaggiSettimana.length}</div>
              <div style={{fontSize:11,color:T.sub}}>montaggi questa settimana</div>
            </div>
            <div style={{padding:"10px 12px",borderRadius:8,background:AMBER+"08",border:`0.5px solid ${AMBER}20`}}>
              <div style={{fontSize:20,fontWeight:500,color:AMBER,fontFamily:FM}}>{tasks.filter(t=>!t.done&&t.date===TODAY).length}</div>
              <div style={{fontSize:11,color:T.sub}}>task in scadenza oggi</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* TEAM LIVE */}
        <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>Team — adesso</span>
            <span style={{fontSize:11,color:T.sub,cursor:"pointer"}} onClick={()=>setTab("settings")}>Gestisci →</span>
          </div>
          {(team.length>0?team:[{id:"1",nome:"Team member",ruolo:"—"}]).slice(0,5).map((m:any,i:number)=>{
            const inCantiere = montaggiDB.some(mt=>(mt.operatoreId===m.id)&&mt.data===TODAY);
            const taskCount = tasks.filter(t=>t.assegnatoA===m.id&&!t.done).length;
            const c = m.colore||getRuoloColorLocal(m.ruolo);
            return (
              <div key={m.id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none"}}>
                <div style={{width:30,height:30,borderRadius:8,background:c+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:c,flexShrink:0}}>{(m.nome||"?")[0]}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:500,color:T.text}}>{m.nome}</div>
                  <div style={{fontSize:10,color:T.sub}}>{m.ruolo||"—"}</div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {inCantiere&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:TEAL+"12",color:TEAL,fontWeight:500}}>In cantiere</span>}
                  {taskCount>0&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:AMBER+"12",color:AMBER,fontWeight:500}}>{taskCount} task</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* COMMESSE FERME */}
        <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${ferme.length>0?RED+"25":T.bdr}`,padding:"16px 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <span style={{fontSize:13,fontWeight:500,color:T.text}}>Commesse da sbloccare</span>
            {ferme.length>0&&<span style={{fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:6,background:RED+"12",color:RED}}>{ferme.length} ferme</span>}
          </div>
          {ferme.length===0&&<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:"20px 0"}}>Tutto in ordine ✓</div>}
          {ferme.slice(0,5).map((c:any,i:number)=>(
            <div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:i<Math.min(ferme.length-1,4)?`0.5px solid ${T.bdr}`:"none",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:7,background:RED+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:RED,flexShrink:0}}>{(c.cliente||"?")[0]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{c.cliente} {c.cognome||""}</div>
                <div style={{fontSize:10,color:T.sub}}>{c.code} · {c.fase}</div>
              </div>
              <div style={{fontSize:11,fontWeight:500,color:RED,flexShrink:0}}>{giorniFermaCM(c)}gg</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function getRuoloColorLocal(r:string) {
  if(!r)return "#1A9E73";
  if(r.includes("Montatore"))return "#8B5CF6";
  if(r.includes("Preventiv"))return "#3B7FE0";
  if(r.includes("Ammin"))return "#1A9E73";
  return "#E8A020";
}
