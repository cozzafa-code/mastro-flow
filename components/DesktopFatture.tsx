"use client";
// @ts-nocheck
// MASTRO — DesktopFatture.tsx
// Fatturazione elettronica SDI: FatturaPA, invio, stati, scadenze, incassi

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316", DARK="#1A1A1C";

const TIPI_FATTURA = ["Fattura","Nota di credito","Acconto/Anticipo","Parcella","Fattura semplificata"];
const SDI_STATI = [
  { id:"bozza",       label:"Bozza",          c:"#6B7280" },
  { id:"da_inviare",  label:"Da inviare",      c:AMBER },
  { id:"inviata_sdi", label:"Inviata SDI",     c:BLUE },
  { id:"consegnata",  label:"Consegnata",      c:TEAL },
  { id:"scartata",    label:"Scartata SDI",    c:RED },
  { id:"pagata",      label:"Pagata",          c:TEAL },
];

export default function DesktopFatture() {
  const { T, cantieri=[], fattureDB=[], setSelectedCM, setTab } = useMastro();
  const [selFattura, setSelFattura] = useState<any>(null);
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [showNuova, setShowNuova] = useState(false);
  const [period, setPeriod] = useState<"mese"|"trimestre"|"anno">("mese");

  const TODAY = new Date().toISOString().split("T")[0];
  const NOW = new Date();
  const inPeriod = (data:string) => {
    if(!data) return false;
    const d=new Date(data);
    if(period==="mese") return d.getMonth()===NOW.getMonth()&&d.getFullYear()===NOW.getFullYear();
    if(period==="trimestre") return d.getFullYear()===NOW.getFullYear()&&Math.floor(d.getMonth()/3)===Math.floor(NOW.getMonth()/3);
    return d.getFullYear()===NOW.getFullYear();
  };

  const fatture = useMemo(()=>fattureDB.map((f:any)=>{
    const cm=cantieri.find((c:any)=>c.id===f.cmId);
    const isScad=!f.pagata&&f.scadenza&&f.scadenza<TODAY;
    const statoSDI=f.pagata?"pagata":f.sdiBozza?"bozza":f.sdiInviata?"inviata_sdi":f.sdiConsegnata?"consegnata":f.sdiScartata?"scartata":"da_inviare";
    return { ...f, cm, clienteNome:cm?`${cm.cliente||""} ${cm.cognome||""}`.trim():f.clienteNome||"—", isScad, statoSDI };
  }),[fattureDB,cantieri,TODAY]);

  const filtered=fatture.filter(f=>filtroStato==="tutti"||f.statoSDI===filtroStato);

  const totalePeriod=fatture.filter(f=>f.pagata&&inPeriod(f.data)).reduce((s:number,f:any)=>s+(f.importo||0),0);
  const daIncassare=fatture.filter(f=>!f.pagata).reduce((s:number,f:any)=>s+(f.importo||0),0);
  const scadute=fatture.filter(f=>f.isScad);
  const daSdI=fatture.filter(f=>f.statoSDI==="da_inviare").length;

  const fmtE=(n:number)=>n>0?"€"+Math.round(n).toLocaleString("it-IT"):"—";
  const statoInfo=(id:string)=>SDI_STATI.find(s=>s.id===id)||SDI_STATI[0];

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Fatture SDI</span>
        <div style={{display:"flex",gap:4}}>
          {(["mese","trimestre","anno"] as const).map(p=>(
            <div key={p} onClick={()=>setPeriod(p)} style={{padding:"3px 9px",borderRadius:5,fontSize:11,fontWeight:500,cursor:"pointer",background:period===p?DARK:"transparent",color:period===p?"#fff":T.sub,border:`0.5px solid ${period===p?DARK:T.bdr}`}}>{p.charAt(0).toUpperCase()+p.slice(1)}</div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[
            {l:`Incassato ${period}`,v:fmtE(totalePeriod),c:TEAL},
            {l:"Da incassare",v:fmtE(daIncassare),c:daIncassare>0?AMBER:TEAL},
            {l:"Scadute",v:scadute.length,c:scadute.length>0?RED:TEAL},
            {l:"Da inviare SDI",v:daSdI,c:daSdI>0?ORANGE:TEAL},
          ].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:i<=1?13:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
          <button onClick={()=>setShowNuova(true)} style={{padding:"7px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>+ Nuova fattura</button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LISTA */}
        <div style={{width:300,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{display:"flex",gap:3,flexWrap:"wrap" as any}}>
              <div onClick={()=>setFiltroStato("tutti")} style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroStato==="tutti"?DARK:"transparent",color:filtroStato==="tutti"?"#fff":T.sub,border:`0.5px solid ${filtroStato==="tutti"?DARK:T.bdr}`}}>Tutte</div>
              {SDI_STATI.map(s=>(
                <div key={s.id} onClick={()=>setFiltroStato(s.id)} style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroStato===s.id?s.c:"transparent",color:filtroStato===s.id?"#fff":T.sub,border:`0.5px solid ${filtroStato===s.id?s.c:T.bdr}`}}>{s.label}</div>
              ))}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessuna fattura{fatture.length===0?" — crea la prima con il pulsante +":" con questo filtro"}</div>}
            {filtered.map((f:any,i:number)=>{
              const st=statoInfo(f.statoSDI);
              return (
                <div key={f.id||i} onClick={()=>setSelFattura(selFattura?.id===f.id?null:f)}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selFattura?.id===f.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selFattura?.id===f.id?TEAL:"transparent"}`,borderTop:f.isScad?`1px solid ${RED}15`:"none"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{f.clienteNome}</div>
                      <div style={{fontSize:10,color:T.sub}}>{f.numero||`FAT-${String(i+1).padStart(4,"0")}`} · {f.data||"—"}</div>
                      <div style={{display:"flex",gap:6,marginTop:3}}>
                        <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:st.c+"12",color:st.c,fontWeight:500}}>{st.label}</span>
                        {f.isScad&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:RED+"12",color:RED,fontWeight:500}}>Scaduta</span>}
                      </div>
                    </div>
                    <div style={{fontSize:12,fontWeight:500,color:f.isScad?RED:T.text,fontFamily:FM,flexShrink:0}}>{fmtE(f.importo||0)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETTAGLIO / NUOVA */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {showNuova?(
            <div style={{flex:1,overflowY:"auto" as any,padding:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                <div style={{fontSize:15,fontWeight:500,color:T.text}}>Nuova fattura</div>
                <button onClick={()=>setShowNuova(false)} style={{padding:"5px 12px",borderRadius:6,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:11,color:T.sub,cursor:"pointer"}}>Annulla</button>
              </div>
              <div style={{maxWidth:560,display:"flex",flexDirection:"column" as any,gap:14}}>
                {[
                  {l:"Commessa",type:"select",opts:cantieri.map((c:any)=>({v:c.id,l:`${c.code} · ${c.cliente} ${c.cognome||""}`}))},
                  {l:"Tipo documento",type:"select",opts:TIPI_FATTURA.map(t=>({v:t,l:t}))},
                  {l:"Data fattura",type:"date"},
                  {l:"Scadenza pagamento",type:"date"},
                  {l:"Importo IVA esclusa (€)",type:"number"},
                  {l:"Aliquota IVA (%)",type:"number",default:"10"},
                  {l:"Note / Descrizione",type:"textarea"},
                ].map((f,i)=>(
                  <div key={i}>
                    <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:5}}>{f.l}</div>
                    {f.type==="select"?(
                      <select style={{width:"100%",padding:"8px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:13,fontFamily:FF,background:"#F8FAFC",color:T.text,outline:"none"}}>
                        <option value="">Seleziona...</option>
                        {f.opts?.map((o:any)=><option key={o.v} value={o.v}>{o.l}</option>)}
                      </select>
                    ):f.type==="textarea"?(
                      <textarea rows={3} style={{width:"100%",padding:"8px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:13,fontFamily:FF,background:"#F8FAFC",color:T.text,outline:"none",resize:"vertical" as any}}/>
                    ):(
                      <input type={f.type} defaultValue={f.default} style={{width:"100%",padding:"8px 12px",border:`0.5px solid ${T.bdr}`,borderRadius:7,fontSize:13,fontFamily:FF,background:"#F8FAFC",color:T.text,outline:"none"}}/>
                    )}
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:6}}>
                  <button style={{flex:1,padding:"10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:13,color:T.sub,cursor:"pointer",fontFamily:FF}}>Salva bozza</button>
                  <button style={{flex:2,padding:"10px",borderRadius:8,border:"none",background:TEAL,fontSize:13,fontWeight:500,color:"#fff",cursor:"pointer",fontFamily:FF}}>Genera XML FatturaPA</button>
                </div>
              </div>
            </div>
          ):!selFattura?(
            <div style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",gap:14,padding:40,textAlign:"center" as any}}>
              <div style={{width:60,height:60,borderRadius:16,background:ORANGE+"12",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <div style={{fontSize:16,fontWeight:500,color:T.text}}>Fatturazione elettronica SDI</div>
              <div style={{fontSize:13,color:T.sub,maxWidth:380,lineHeight:1.7}}>Genera automaticamente l'XML FatturaPA dalle commesse. Invio diretto tramite intermediario SDI. Zero ridigitazione.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:400}}>
                {[["XML FatturaPA","Auto-generato da commessa"],["Invio SDI","Tramite intermediario"],["Tracciamento","Stato consegna real-time"],["Archiviazione","10 anni automatica"]].map(([t,s],i)=>(
                  <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",border:`0.5px solid ${T.bdr}`}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.text}}>{t}</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:2}}>{s}</div>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
              {/* Header fattura */}
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontSize:16,fontWeight:500,color:T.text}}>{selFattura.clienteNome}</div>
                  <div style={{fontSize:11,color:T.sub}}>{selFattura.numero||"—"} · {selFattura.data||"—"}{selFattura.scadenza?` · Scad. ${selFattura.scadenza}`:""}</div>
                  <div style={{display:"flex",gap:6,marginTop:6}}>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:statoInfo(selFattura.statoSDI).c+"12",color:statoInfo(selFattura.statoSDI).c,fontWeight:500}}>{statoInfo(selFattura.statoSDI).label}</span>
                    {selFattura.isScad&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:5,background:RED+"12",color:RED,fontWeight:500}}>SCADUTA</span>}
                  </div>
                </div>
                <div style={{textAlign:"right" as any}}>
                  <div style={{fontSize:24,fontWeight:500,color:T.text,fontFamily:FM}}>{fmtE(selFattura.importo||0)}</div>
                  <div style={{fontSize:11,color:T.sub}}>IVA inclusa</div>
                </div>
              </div>

              {/* Percorso SDI */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px",marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Percorso SDI</div>
                <div style={{display:"flex",gap:4,alignItems:"center"}}>
                  {SDI_STATI.slice(1).map((s,i)=>{
                    const curr=s.id===selFattura.statoSDI;
                    const past=SDI_STATI.findIndex(x=>x.id===selFattura.statoSDI)>SDI_STATI.findIndex(x=>x.id===s.id);
                    return (
                      <div key={s.id} style={{display:"flex",alignItems:"center",flex:1,gap:3}}>
                        <div style={{flex:1,padding:"4px",borderRadius:5,background:curr?s.c+"20":past?s.c+"10":"#F4F6F8",border:`0.5px solid ${curr?s.c:past?s.c+"40":T.bdr}`,textAlign:"center" as any}}>
                          <div style={{fontSize:9,fontWeight:curr?700:400,color:curr?s.c:past?s.c+"99":T.sub,overflow:"hidden",whiteSpace:"nowrap" as any}}>{s.label}</div>
                        </div>
                        {i<SDI_STATI.length-2&&<svg width="6" height="6" viewBox="0 0 8 8"><path d="M1 4h6M4 1l3 3-3 3" fill="none" stroke={T.bdr} strokeWidth="1.5"/></svg>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dettagli */}
              <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:14}}>
                {[
                  {l:"Cliente",v:selFattura.clienteNome},
                  {l:"Commessa",v:selFattura.cm?.code||"—"},
                  {l:"Tipo",v:selFattura.tipo||"Fattura"},
                  {l:"Data",v:selFattura.data||"—"},
                  {l:"Scadenza",v:selFattura.scadenza||"—"},
                  {l:"Imponibile",v:fmtE(Math.round((selFattura.importo||0)/1.1))},
                  {l:"IVA 10%",v:fmtE(Math.round((selFattura.importo||0)/11))},
                  {l:"Totale",v:fmtE(selFattura.importo||0)},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",padding:"8px 14px",borderBottom:i<7?`0.5px solid ${T.bdr}`:"none",gap:12}}>
                    <span style={{fontSize:11,color:T.sub,minWidth:100,flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Azioni */}
              <div style={{display:"flex",gap:8,flexWrap:"wrap" as any}}>
                <button style={{padding:"8px 14px",borderRadius:7,background:ORANGE,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Genera XML FatturaPA</button>
                <button style={{padding:"8px 14px",borderRadius:7,background:BLUE,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Invia a SDI</button>
                <button style={{padding:"8px 14px",borderRadius:7,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:12,cursor:"pointer",fontFamily:FF}}>Scarica PDF</button>
                {!selFattura.pagata&&<button style={{padding:"8px 14px",borderRadius:7,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Segna pagata</button>}
                {selFattura.isScad&&<button style={{padding:"8px 14px",borderRadius:7,background:RED+"10",color:RED,border:`0.5px solid ${RED}30`,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Invia sollecito</button>}
              </div>
            </div>
          )}
        </div>

        {/* PANNELLO SCADENZE */}
        <div style={{width:240,flexShrink:0,background:"#F8FAFC",borderLeft:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 14px",background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,flexShrink:0}}>Scadenze & Incassi</div>
          <div style={{flex:1,overflowY:"auto" as any,padding:"10px 14px"}}>
            {scadute.length>0&&<>
              <div style={{fontSize:10,fontWeight:700,color:RED,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Scadute — {fmtE(scadute.reduce((s:number,f:any)=>s+(f.importo||0),0))}</div>
              {scadute.slice(0,4).map((f:any,i:number)=>(
                <div key={i} onClick={()=>setSelFattura(f)} style={{padding:"8px 10px",borderRadius:8,border:`0.5px solid ${RED}30`,background:RED+"04",marginBottom:5,cursor:"pointer"}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{f.clienteNome}</div>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                    <span style={{fontSize:10,color:T.sub}}>Scad. {f.scadenza}</span>
                    <span style={{fontSize:10,fontWeight:500,color:RED,fontFamily:FM}}>{fmtE(f.importo||0)}</span>
                  </div>
                </div>
              ))}
            </>}
            <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 6px"}}>Da incassare</div>
            {fatture.filter(f=>!f.pagata&&!f.isScad).slice(0,5).map((f:any,i:number)=>(
              <div key={i} onClick={()=>setSelFattura(f)} style={{padding:"7px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#fff",marginBottom:4,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any,maxWidth:120}}>{f.clienteNome}</div>
                  <div style={{fontSize:9,color:T.sub}}>Scad. {f.scadenza||"—"}</div>
                </div>
                <div style={{fontSize:11,fontWeight:500,color:AMBER,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:TEAL,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 6px"}}>Ultimi pagamenti</div>
            {fatture.filter(f=>f.pagata).slice(0,4).map((f:any,i:number)=>(
              <div key={i} style={{padding:"7px 10px",borderRadius:8,border:`0.5px solid ${TEAL}20`,background:TEAL+"04",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any,maxWidth:120}}>{f.clienteNome}</div>
                  <div style={{fontSize:9,color:T.sub}}>{f.data||"—"}</div>
                </div>
                <div style={{fontSize:11,fontWeight:500,color:TEAL,fontFamily:FM}}>{fmtE(f.importo||0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
