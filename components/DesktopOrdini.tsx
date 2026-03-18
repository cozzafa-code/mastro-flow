"use client";
// @ts-nocheck
// MASTRO — DesktopOrdini.tsx
// Trasformatore ordini universale: da commessa a file fornitore nativo
// Schüco, Emmegi, Reynaers, Metra, Aluplast, custom

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316";

const FORNITORI = [
  { id:"schuco",    nome:"Schüco",           formati:["EDE","AKS","CSV"],   logo:"S",  colore:"#1A3A6B", stati:["In attesa","Inviato","Confermato","In produzione","Consegnato"] },
  { id:"emmegi",    nome:"Emmegi / Metra",   formati:["EWX","XML","CSV"],   logo:"E",  colore:"#C41E3A", stati:["In attesa","Inviato","Confermato","Spedito","Consegnato"] },
  { id:"reynaers",  nome:"Reynaers",         formati:["CSV","Excel","PDF"], logo:"R",  colore:"#2E4057", stati:["In attesa","Inviato","Confermato","In produzione","Consegnato"] },
  { id:"aluplast",  nome:"Aluplast",         formati:["CSV","Excel"],       logo:"A",  colore:"#5B7F3A", stati:["In attesa","Inviato","Confermato","Consegnato"] },
  { id:"rehau",     nome:"Rehau",            formati:["CSV","XML"],         logo:"H",  colore:"#8B0000", stati:["In attesa","Inviato","Confermato","Consegnato"] },
  { id:"custom",    nome:"Fornitore custom", formati:["PDF","Excel","CSV"], logo:"?",  colore:"#6B7280", stati:["In attesa","Inviato","Confermato","Consegnato"] },
];

export default function DesktopOrdini() {
  const { T, cantieri=[], ordiniFornDB=[] } = useMastro();
  const [selOrdine, setSelOrdine] = useState<any>(null);
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [filtroForn, setFiltroForn] = useState("tutti");
  const [showNuovo, setShowNuovo] = useState(false);
  const [nuovaCommessa, setNuovaCommessa] = useState("");
  const [nuovoFornitore, setNuovoFornitore] = useState("schuco");

  // Ordini reali + demo
  const ordini = useMemo(() => {
    const reali = ordiniFornDB.map((o:any) => {
      const cm = cantieri.find((c:any)=>c.id===o.cmId);
      const fornNome = typeof o.fornitore==="object"?o.fornitore?.nome:o.fornitore||"—";
      const forn = FORNITORI.find(f=>fornNome?.toLowerCase().includes(f.id))||FORNITORI[5];
      return {
        id:o.id, cmId:o.cmId, code:cm?.code||o.code||"—",
        cliente:`${cm?.cliente||""} ${cm?.cognome||""}`.trim()||"—",
        fornitore:forn, importo:o.totaleIva||o.importo||0,
        stato:o.conferma?.ricevuta?"Confermato":o.stato||"In attesa",
        data:o.data||o.createdAt||"—", dataConsegna:o.dataConsegna||"—",
        formato:forn.formati[0], note:o.note||"",
        vani:cm?(cm.vani||[]).filter((v:any)=>!v.eliminato).length:0,
      };
    });
    return reali;
  }, [ordiniFornDB, cantieri]);

  const filtered = ordini.filter(o=>{
    if(filtroStato!=="tutti"&&o.stato!==filtroStato) return false;
    if(filtroForn!=="tutti"&&o.fornitore?.id!==filtroForn) return false;
    return true;
  });

  const fmtE = (n:number) => n>0?"€"+Math.round(n).toLocaleString("it-IT"):"—";
  const statoColor = (s:string) => ({Confermato:TEAL,"In produzione":ORANGE,"Consegnato":"#6B7280","In attesa":AMBER,Inviato:BLUE,Spedito:PURPLE})[s]||AMBER;

  const totValore = ordini.reduce((s:number,o)=>s+o.importo,0);
  const inAttesa = ordini.filter(o=>o.stato==="In attesa").length;
  const confermati = ordini.filter(o=>o.stato==="Confermato"||o.stato==="In produzione").length;

  const PURPLE="#8B5CF6";

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Ordini fornitori</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto",alignItems:"center"}}>
          {[{l:"Totale ordini",v:ordini.length,c:T.text},{l:"In attesa conf.",v:inAttesa,c:inAttesa>0?AMBER:TEAL},{l:"Confermati",v:confermati,c:TEAL},{l:"Valore totale",v:fmtE(totValore),c:T.text}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i<3?16:13,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
          <button onClick={()=>setShowNuovo(true)} style={{padding:"7px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>+ Nuovo ordine</button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LISTA ORDINI */}
        <div style={{width:300,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            {/* Filtro stato */}
            <div style={{display:"flex",gap:3,flexWrap:"wrap" as any,marginBottom:6}}>
              {["tutti","In attesa","Confermato","In produzione","Consegnato"].map(s=>(
                <div key={s} onClick={()=>setFiltroStato(s)} style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroStato===s?DARK:"transparent",color:filtroStato===s?"#fff":T.sub,border:`0.5px solid ${filtroStato===s?DARK:T.bdr}`}}>{s}</div>
              ))}
            </div>
            {/* Filtro fornitore */}
            <div style={{display:"flex",gap:3,flexWrap:"wrap" as any}}>
              <div onClick={()=>setFiltroForn("tutti")} style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroForn==="tutti"?ORANGE:"transparent",color:filtroForn==="tutti"?"#fff":T.sub,border:`0.5px solid ${filtroForn==="tutti"?ORANGE:T.bdr}`}}>Tutti</div>
              {FORNITORI.slice(0,5).map(f=>(
                <div key={f.id} onClick={()=>setFiltroForn(f.id)} style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroForn===f.id?f.colore:"transparent",color:filtroForn===f.id?"#fff":T.sub,border:`0.5px solid ${filtroForn===f.id?f.colore:T.bdr}`}}>{f.nome.split(" ")[0]}</div>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessun ordine{ordini.length===0?" — crea il primo con il pulsante +":" con questi filtri"}</div>}
            {filtered.map((o,i)=>{
              const sc=statoColor(o.stato);
              return (
                <div key={o.id} onClick={()=>setSelOrdine(selOrdine?.id===o.id?null:o)}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selOrdine?.id===o.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selOrdine?.id===o.id?TEAL:"transparent"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:26,height:26,borderRadius:6,background:o.fornitore.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",flexShrink:0}}>{o.fornitore.logo}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{o.cliente}</div>
                      <div style={{fontSize:10,color:T.sub}}>{o.code} · {o.fornitore.nome}</div>
                    </div>
                    <div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM,flexShrink:0}}>{fmtE(o.importo)}</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:sc+"12",color:sc,fontWeight:500}}>{o.stato}</span>
                    <span style={{fontSize:10,color:T.sub}}>{o.data}</span>
                    {o.dataConsegna&&o.dataConsegna!=="—"&&<span style={{fontSize:9,color:T.sub}}>· Cons. {o.dataConsegna}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO ORDINE / TRASFORMATORE */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {showNuovo?(
            <div style={{flex:1,overflowY:"auto" as any,padding:24}}>
              <div style={{fontSize:15,fontWeight:500,color:T.text,marginBottom:20}}>Nuovo ordine fornitore</div>
              <div style={{maxWidth:520}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:6}}>Commessa</div>
                  <select value={nuovaCommessa} onChange={e=>setNuovaCommessa(e.target.value)} style={{width:"100%",padding:"8px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:8,fontSize:13,fontFamily:FF,background:"#F8FAFC",color:T.text,outline:"none"}}>
                    <option value="">Seleziona commessa...</option>
                    {cantieri.filter(c=>["conferma","misure","ordini"].includes(c.fase)).map((c:any)=>(
                      <option key={c.id} value={c.id}>{c.code} · {c.cliente} {c.cognome||""}</option>
                    ))}
                  </select>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:6}}>Fornitore</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    {FORNITORI.map(f=>(
                      <div key={f.id} onClick={()=>setNuovoFornitore(f.id)} style={{padding:"10px 12px",borderRadius:8,border:`1.5px solid ${nuovoFornitore===f.id?f.colore:T.bdr}`,cursor:"pointer",background:nuovoFornitore===f.id?f.colore+"08":"#F8FAFC",display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:24,height:24,borderRadius:5,background:f.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",flexShrink:0}}>{f.logo}</div>
                        <span style={{fontSize:12,fontWeight:nuovoFornitore===f.id?500:400,color:nuovoFornitore===f.id?f.colore:T.text}}>{f.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {nuovoFornitore&&<div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:6}}>Formato export</div>
                  <div style={{display:"flex",gap:6}}>
                    {(FORNITORI.find(f=>f.id===nuovoFornitore)?.formati||[]).map(fmt=>(
                      <div key={fmt} style={{padding:"5px 12px",borderRadius:6,border:`0.5px solid ${TEAL}`,background:TEAL+"10",fontSize:11,fontWeight:500,color:TEAL,cursor:"pointer"}}>{fmt}</div>
                    ))}
                  </div>
                </div>}
                <div style={{display:"flex",gap:8,marginTop:20}}>
                  <button onClick={()=>setShowNuovo(false)} style={{flex:1,padding:"10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:13,color:T.sub,cursor:"pointer",fontFamily:FF}}>Annulla</button>
                  <button onClick={()=>setShowNuovo(false)} style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:TEAL,fontSize:13,fontWeight:500,color:"#fff",cursor:"pointer",fontFamily:FF}}>Genera ordine</button>
                </div>
              </div>
            </div>
          ):!selOrdine?(
            <div style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:16,padding:40,textAlign:"center" as any}}>
              <div style={{width:64,height:64,borderRadius:18,background:ORANGE+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:T.text}}>Trasformatore Ordini Universale</div>
              <div style={{fontSize:13,color:T.sub,maxWidth:400,lineHeight:1.7}}>Seleziona un ordine per vedere i dettagli, tracciare lo stato di produzione e generare il file nativo per il fornitore.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,width:"100%",maxWidth:420}}>
                {FORNITORI.slice(0,6).map(f=>(
                  <div key={f.id} style={{padding:"10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#F8FAFC",display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:22,height:22,borderRadius:5,background:f.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",flexShrink:0}}>{f.logo}</div>
                    <div>
                      <div style={{fontSize:11,fontWeight:500,color:T.text}}>{f.nome}</div>
                      <div style={{fontSize:9,color:T.sub}}>{f.formati.join(" · ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
              {/* Header ordine */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:48,height:48,borderRadius:12,background:selOrdine.fornitore.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#fff"}}>{selOrdine.fornitore.logo}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:16,fontWeight:500,color:T.text}}>{selOrdine.cliente}</div>
                  <div style={{fontSize:11,color:T.sub}}>{selOrdine.code} · {selOrdine.fornitore.nome} · {selOrdine.data}</div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  {selOrdine.fornitore.formati.map((f:string)=>(
                    <button key={f} style={{padding:"6px 12px",borderRadius:6,background:TEAL,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Export {f}</button>
                  ))}
                </div>
              </div>

              {/* Stato produzione */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Stato ordine</div>
                <div style={{display:"flex",gap:3,alignItems:"center"}}>
                  {selOrdine.fornitore.stati.map((s:string,i:number)=>{
                    const curr=s===selOrdine.stato;
                    const past=selOrdine.fornitore.stati.indexOf(selOrdine.stato)>i;
                    const sc=statoColor(s);
                    return (
                      <div key={i} style={{display:"flex",alignItems:"center",flex:1,gap:3}}>
                        <div style={{flex:1,padding:"4px 6px",borderRadius:5,background:curr?sc:past?sc+"25":"#F4F6F8",border:`0.5px solid ${curr?sc:past?sc+"50":T.bdr}`,textAlign:"center" as any}}>
                          <div style={{fontSize:9,fontWeight:curr?700:400,color:curr?sc:past?sc+"99":T.sub,whiteSpace:"nowrap" as any,overflow:"hidden"}}>{s}</div>
                        </div>
                        {i<selOrdine.fornitore.stati.length-1&&<svg width="8" height="8" viewBox="0 0 8 8" style={{flexShrink:0}}><path d="M1 4h6M4 1l3 3-3 3" fill="none" stroke={T.bdr} strokeWidth="1.2"/></svg>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dati ordine */}
              <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:14}}>
                {[
                  {l:"Cliente",v:selOrdine.cliente},
                  {l:"Commessa",v:selOrdine.code},
                  {l:"Fornitore",v:selOrdine.fornitore.nome},
                  {l:"Formato nativo",v:selOrdine.fornitore.formati[0]},
                  {l:"Data ordine",v:selOrdine.data},
                  {l:"Consegna prevista",v:selOrdine.dataConsegna},
                  {l:"Importo IVA inclusa",v:fmtE(selOrdine.importo)},
                  {l:"Vani",v:`${selOrdine.vani} finestre/porte`},
                  {l:"Note",v:selOrdine.note||"—"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",padding:"8px 14px",borderBottom:i<8?`0.5px solid ${T.bdr}`:"none",gap:12}}>
                    <span style={{fontSize:11,color:T.sub,minWidth:130,flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Azioni */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap" as any}}>
                {selOrdine.fornitore.formati.map((f:string)=>(
                  <button key={f} style={{padding:"8px 16px",borderRadius:7,background:selOrdine.fornitore.colore,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Export {f} per {selOrdine.fornitore.nome}</button>
                ))}
                <button style={{padding:"8px 16px",borderRadius:7,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:12,cursor:"pointer",fontFamily:FF}}>Invia per email</button>
                <button style={{padding:"8px 16px",borderRadius:7,background:"transparent",color:AMBER,border:`0.5px solid ${AMBER}40`,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Marca confermato</button>
              </div>
            </div>
          )}
        </div>

        {/* PANNELLO DX — statistiche fornitori */}
        <div style={{width:240,flexShrink:0,background:"#F8FAFC",borderLeft:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,flexShrink:0}}>Per fornitore</div>
          <div style={{flex:1,overflowY:"auto" as any,padding:"10px 14px"}}>
            {FORNITORI.slice(0,5).map(f=>{
              const n=ordini.filter(o=>o.fornitore?.id===f.id).length;
              const val=ordini.filter(o=>o.fornitore?.id===f.id).reduce((s:number,o)=>s+o.importo,0);
              if(n===0) return null;
              return (
                <div key={f.id} onClick={()=>setFiltroForn(filtroForn===f.id?"tutti":f.id)} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${filtroForn===f.id?f.colore:T.bdr}`,marginBottom:6,cursor:"pointer",background:filtroForn===f.id?f.colore+"06":"#fff"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:22,height:22,borderRadius:5,background:f.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#fff",flexShrink:0}}>{f.logo}</div>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,flex:1}}>{f.nome}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{n}</span>
                  </div>
                  <div style={{fontSize:10,color:T.sub}}>{fmtE(val)}</div>
                </div>
              );
            })}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Formati supportati</div>
            {[["EDE / AKS","Schüco"],["EWX / XML","Emmegi"],["CSV universal","Tutti"],["Excel","Reynaers, Aluplast"],["PDF ordine","Custom"]].map(([fmt,forn],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderRadius:6,marginBottom:4,background:"#fff",border:`0.5px solid ${T.bdr}`}}>
                <span style={{fontSize:10,fontWeight:500,color:T.text}}>{fmt}</span>
                <span style={{fontSize:10,color:T.sub}}>{forn}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
