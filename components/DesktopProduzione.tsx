"use client";
// @ts-nocheck
// MASTRO — DesktopProduzione.tsx
// Produzione: dalla barra alluminio/PVC alla finestra finita
// Ordini ricevuti → distinta materiali → taglio barre → CNC → assemblaggio → pronto per posa

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316", PURPLE="#8B5CF6";

const STATI_PRODUZIONE = [
  { id:"attesa_materiali", label:"Attesa materiali", color:AMBER },
  { id:"taglio",           label:"In taglio",        color:ORANGE },
  { id:"lavorazione",      label:"Lavorazione",      color:BLUE },
  { id:"assemblaggio",     label:"Assemblaggio",      color:PURPLE },
  { id:"collaudo",         label:"Collaudo",          color:TEAL },
  { id:"pronto_posa",      label:"Pronto per posa",   color:TEAL },
  { id:"consegnato",       label:"Consegnato",        color:"#6B7280" },
];

const MATERIALI_DEMO = [
  { id:"m1", tipo:"Barra alluminio", profilo:"AWS 90 SI+", colore:"RAL 7016 Grigio Antracite", lunghezza:6000, giacenza:24, unita:"pz", minimo:10 },
  { id:"m2", tipo:"Barra alluminio", profilo:"AWS 70",     colore:"RAL 9010 Bianco",           lunghezza:6000, giacenza:8,  unita:"pz", minimo:10 },
  { id:"m3", tipo:"Vetro",           profilo:"4/16/4 Basso Em.", colore:"",                    lunghezza:0,    giacenza:18, unita:"mq", minimo:5  },
  { id:"m4", tipo:"Vetro",           profilo:"Triplo Ug 0.6",    colore:"",                    lunghezza:0,    giacenza:6,  unita:"mq", minimo:4  },
  { id:"m5", tipo:"Guarnizione",     profilo:"Centrale EPDM",    colore:"Nero",                lunghezza:0,    giacenza:340,unita:"mt", minimo:50 },
  { id:"m6", tipo:"Maniglia",        profilo:"Tropex cromata",   colore:"Cromo",               lunghezza:0,    giacenza:22, unita:"pz", minimo:10 },
];

export default function DesktopProduzione() {
  const { T, cantieri=[], ordiniFornDB=[], montaggiDB=[], calcolaVanoPrezzo } = useMastro();
  const [activeTab, setActiveTab] = useState<"ordini"|"lavorazioni"|"magazzino"|"cnc">("ordini");
  const [selOrdine, setSelOrdine] = useState<any>(null);
  const [filtroProd, setFiltroProd] = useState("tutti");

  const TODAY = new Date().toISOString().split("T")[0];

  // Simula ordini di produzione da commesse+ordiniFornitore
  const ordiniProduzione = useMemo(() => {
    return cantieri.filter(c => ["ordini","produzione","posa"].includes(c.fase)).map(c => {
      const vani = (c.vani||[]).filter((v:any)=>!v.eliminato);
      const ordForn = ordiniFornDB.find((o:any)=>o.cmId===c.id);
      const statoProd = c.fase==="produzione"?"lavorazione":c.fase==="ordini"?"attesa_materiali":"pronto_posa";
      return {
        id: c.id, code: c.code, cliente: `${c.cliente||""} ${c.cognome||""}`.trim(),
        indirizzo: c.indirizzo||"—", vani: vani.length, fase: c.fase,
        statoProd, fornitore: ordForn?.fornitore?.nome||ordForn?.fornitore||"—",
        dataConsegna: ordForn?.dataConsegna||"—", euro: parseFloat(c.euro)||0,
        priorita: c.priorita||"normale",
        pezzi: vani.reduce((s:number,v:any)=>s+(v.pezzi||1),0),
      };
    });
  }, [cantieri, ordiniFornDB]);

  const inLavorazione = ordiniProduzione.filter(o=>o.statoProd==="lavorazione"||o.statoProd==="taglio"||o.statoProd==="assemblaggio");
  const attesaMat = ordiniProduzione.filter(o=>o.statoProd==="attesa_materiali");
  const prontiPosa = ordiniProduzione.filter(o=>o.statoProd==="pronto_posa");
  const materialeSotto = MATERIALI_DEMO.filter(m=>m.giacenza<=m.minimo);

  const fmtE = (n:number) => "€"+Math.round(n).toLocaleString("it-IT");
  const statoInfo = (id:string) => STATI_PRODUZIONE.find(s=>s.id===id)||STATI_PRODUZIONE[0];

  const filteredOrdini = filtroProd==="tutti" ? ordiniProduzione
    : ordiniProduzione.filter(o=>o.statoProd===filtroProd);

  // Distinta materiali per ordine selezionato
  const distinta = selOrdine ? (selOrdine.vani>0 ? [
    { materiale:"Barra alluminio AWS 90", profilo:"Schüco", lunghezza:6000, pezzi:Math.ceil(selOrdine.vani*1.8), colore:"RAL 7016", tagliPrevisti:selOrdine.vani*4 },
    { materiale:"Vetro 4/16/4 Basso Em.", profilo:"", lunghezza:0, pezzi:selOrdine.vani, colore:"Incolore", tagliPrevisti:0 },
    { materiale:"Guarnizione EPDM", profilo:"Centrale", lunghezza:0, pezzi:Math.ceil(selOrdine.vani*3.5)+"mt", colore:"Nero", tagliPrevisti:0 },
    { materiale:"Maniglia Tropex", profilo:"Cromo", lunghezza:0, pezzi:selOrdine.vani, colore:"Cromo", tagliPrevisti:0 },
  ] : []) : [];

  const S = {
    wrap: { display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden" },
    topbar: { background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0 },
    tabs: { display:"flex",gap:0,borderBottom:`0.5px solid ${T.bdr}`,background:"#fff",flexShrink:0,paddingLeft:20 },
    tab: (a:boolean) => ({ padding:"8px 14px",fontSize:12,fontWeight:500,color:a?ORANGE:T.sub,borderBottom:`2px solid ${a?ORANGE:"transparent"}`,cursor:"pointer",whiteSpace:"nowrap" as any }),
    body: { flex:1,display:"flex",overflow:"hidden" },
    lista: { width:280,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden" },
    listaHdr: { padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0 },
    row: (sel:boolean) => ({ padding:"9px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",display:"flex",gap:8,alignItems:"flex-start",background:sel?"rgba(249,115,22,0.06)":"transparent",borderLeft:`2px solid ${sel?ORANGE:"transparent"}` }),
    det: { flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff",borderRight:`0.5px solid ${T.bdr}` },
    panel: { width:300,flexShrink:0,background:"#F8FAFC",display:"flex",flexDirection:"column" as any,overflow:"hidden" },
  };

  return (
    <div style={S.wrap}>
      {/* TOPBAR */}
      <div style={S.topbar}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Produzione</span>
        <div style={{display:"flex",gap:8,alignItems:"center",marginLeft:"auto"}}>
          {[
            {l:"In lavorazione",v:inLavorazione.length,c:ORANGE},
            {l:"Attesa materiali",v:attesaMat.length,c:AMBER},
            {l:"Pronti posa",v:prontiPosa.length,c:TEAL},
            {l:"Mat. sotto scorta",v:materialeSotto.length,c:materialeSotto.length>0?RED:TEAL},
          ].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={S.tabs}>
        {[["ordini","Ordini produzione"],["lavorazioni","Lavorazioni live"],["magazzino","Magazzino materiali"],["cnc","CNC / Taglio"]] .map(([id,l])=>(
          <div key={id} onClick={()=>setActiveTab(id as any)} style={S.tab(activeTab===id)}>{l}</div>
        ))}
      </div>

      {/* BODY */}
      {activeTab==="ordini"&&(
        <div style={S.body}>
          {/* LISTA ORDINI */}
          <div style={S.lista}>
            <div style={S.listaHdr}>
              <div style={{display:"flex",gap:4,flexWrap:"wrap" as any}}>
                {[{id:"tutti",l:"Tutti"},{id:"attesa_materiali",l:"Attesa"},{id:"lavorazione",l:"Lavorazione"},{id:"pronto_posa",l:"Pronti"}].map(f=>(
                  <div key={f.id} onClick={()=>setFiltroProd(f.id)} style={{padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroProd===f.id?ORANGE:"transparent",color:filtroProd===f.id?"#fff":T.sub,border:`0.5px solid ${filtroProd===f.id?ORANGE:T.bdr}`}}>{f.l}</div>
                ))}
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto" as any}}>
              {filteredOrdini.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessun ordine in produzione</div>}
              {filteredOrdini.map((o:any)=>{
                const st=statoInfo(o.statoProd);
                return (
                  <div key={o.id} onClick={()=>setSelOrdine(selOrdine?.id===o.id?null:o)} style={S.row(selOrdine?.id===o.id)}>
                    <div style={{width:28,height:28,borderRadius:7,background:st.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:st.color,flexShrink:0}}>{o.vani}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{o.cliente}</div>
                      <div style={{fontSize:10,color:T.sub}}>{o.code} · {o.vani} vani · {o.pezzi} pz</div>
                      <div style={{marginTop:3}}>
                        <span style={{fontSize:9,fontWeight:500,padding:"1px 6px",borderRadius:4,background:st.color+"15",color:st.color}}>{st.label}</span>
                      </div>
                    </div>
                    {o.priorita==="alta"&&<div style={{width:6,height:6,borderRadius:"50%",background:RED,flexShrink:0,marginTop:3}}/>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DETTAGLIO ORDINE */}
          <div style={S.det}>
            {!selOrdine?(
              <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as any,gap:10,color:T.sub}}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                <span style={{fontSize:13}}>Seleziona un ordine</span>
              </div>
            ):(
              <>
                <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:500,color:T.text}}>{selOrdine.cliente}</div>
                      <div style={{fontSize:11,color:T.sub}}>{selOrdine.code} · {selOrdine.indirizzo}</div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button style={{padding:"5px 10px",borderRadius:6,background:ORANGE,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Avanza fase</button>
                      <button style={{padding:"5px 10px",borderRadius:6,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>CNC</button>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                    {[
                      {l:"Vani",v:selOrdine.vani,c:ORANGE},
                      {l:"Pezzi totali",v:selOrdine.pezzi,c:T.text},
                      {l:"Fornitore",v:typeof selOrdine.fornitore==="string"?selOrdine.fornitore.substring(0,10)+"…":selOrdine.fornitore,c:T.text},
                      {l:"Consegna mat.",v:selOrdine.dataConsegna||"—",c:T.text},
                    ].map((k,i)=>(
                      <div key={i} style={{background:"#F8FAFC",borderRadius:6,padding:"5px 8px"}}>
                        <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                        <div style={{fontSize:12,fontWeight:500,color:k.c,fontFamily:i<=1?FM:FF,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STATO PRODUZIONE */}
                <div style={{padding:"12px 16px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Stato produzione</div>
                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                    {STATI_PRODUZIONE.slice(0,6).map((s,i)=>{
                      const isCurr=s.id===selOrdine.statoProd;
                      const isPast=STATI_PRODUZIONE.findIndex(x=>x.id===selOrdine.statoProd)>i;
                      return (
                        <div key={s.id} style={{display:"flex",alignItems:"center",gap:3,flex:1}}>
                          <div style={{flex:1,padding:"4px 6px",borderRadius:5,background:isCurr?s.color:isPast?s.color+"30":"#F4F6F8",border:`0.5px solid ${isCurr?s.color:isPast?s.color+"50":T.bdr}`,textAlign:"center" as any}}>
                            <div style={{fontSize:9,fontWeight:isCurr?700:400,color:isCurr?s.color:isPast?s.color+"99":T.sub,whiteSpace:"nowrap" as any,overflow:"hidden"}}>{s.label}</div>
                          </div>
                          {i<5&&<svg width="8" height="8" viewBox="0 0 8 8" style={{flexShrink:0}}><path d="M1 4h6M4 1l3 3-3 3" fill="none" stroke={T.bdr} strokeWidth="1.2"/></svg>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DISTINTA MATERIALI */}
                <div style={{flex:1,overflowY:"auto" as any,padding:"12px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:10}}>Distinta materiali</div>
                  <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 100px 60px 70px",padding:"6px 12px",background:"#F8FAFC",borderBottom:`0.5px solid ${T.bdr}`,gap:8}}>
                      {["Materiale","Profilo/Colore","Q.tà","Stato"].map((h,i)=>(
                        <div key={i} style={{fontSize:9,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,textAlign:i>=2?"right" as any:"left"}}>{h}</div>
                      ))}
                    </div>
                    {distinta.map((d:any,i:number)=>(
                      <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 100px 60px 70px",padding:"8px 12px",borderBottom:i<distinta.length-1?`0.5px solid ${T.bdr}`:"none",gap:8,alignItems:"center"}}>
                        <div style={{fontSize:11,fontWeight:500,color:T.text}}>{d.materiale}</div>
                        <div style={{fontSize:10,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{d.profilo||d.colore||"—"}</div>
                        <div style={{fontSize:11,fontWeight:500,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{d.pezzi}</div>
                        <div style={{textAlign:"right" as any}}>
                          <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:TEAL+"12",color:TEAL,fontWeight:500}}>In stock</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* VANI DETTAGLIO */}
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Vani da produrre</div>
                  {(cantieri.find((c:any)=>c.id===selOrdine.id)?.vani||[]).filter((v:any)=>!v.eliminato).map((v:any,i:number)=>{
                    const m=v.misure||{};
                    return (
                      <div key={i} style={{padding:"8px 12px",borderRadius:8,border:`0.5px solid ${T.bdr}`,marginBottom:6,background:"#fff",display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{width:26,height:26,borderRadius:6,background:ORANGE+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:ORANGE,flexShrink:0}}>{i+1}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:500,color:T.text}}>{v.nome||`Vano ${i+1}`} · {v.tipo||"—"}</div>
                          <div style={{fontSize:10,color:T.sub}}>{m.lCentro&&m.hCentro?`${m.lCentro}×${m.hCentro} mm`:""} · {v.sistema||"—"} · {v.colore||"—"}</div>
                        </div>
                        <div style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:AMBER+"12",color:AMBER,fontWeight:500,flexShrink:0}}>In lavorazione</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* PANNELLO DX — riepilogo produzione */}
          <div style={S.panel}>
            <div style={{padding:"10px 14px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,background:"#fff",flexShrink:0}}>
              Produzione oggi
            </div>
            <div style={{flex:1,overflowY:"auto" as any,padding:"12px 14px"}}>
              {/* PIPELINE PRODUZIONE */}
              <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Pipeline</div>
              {STATI_PRODUZIONE.slice(0,6).map(s=>{
                const n=ordiniProduzione.filter(o=>o.statoProd===s.id).length;
                return (
                  <div key={s.id} onClick={()=>setFiltroProd(s.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,marginBottom:4,cursor:"pointer",background:filtroProd===s.id?s.color+"08":"transparent",border:`0.5px solid ${filtroProd===s.id?s.color+"40":T.bdr}`}}>
                    <div style={{width:8,height:8,borderRadius:2,background:s.color,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:11,color:T.text}}>{s.label}</div>
                    <div style={{fontSize:12,fontWeight:500,color:n>0?s.color:T.sub,fontFamily:FM}}>{n}</div>
                  </div>
                );
              })}

              {/* MATERIALI SOTTO SCORTA */}
              {materialeSotto.length>0&&<>
                <div style={{fontSize:10,fontWeight:700,color:RED,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Sotto scorta minima</div>
                {materialeSotto.map(m=>(
                  <div key={m.id} style={{padding:"7px 10px",borderRadius:8,border:`0.5px solid ${RED}30`,background:RED+"04",marginBottom:5}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.text}}>{m.tipo} · {m.profilo}</div>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                      <span style={{fontSize:10,color:T.sub}}>{m.colore||"—"}</span>
                      <span style={{fontSize:10,fontWeight:500,color:RED}}>{m.giacenza} {m.unita} (min. {m.minimo})</span>
                    </div>
                  </div>
                ))}
              </>}

              {/* PROSSIME CONSEGNE MATERIALI */}
              <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,margin:"14px 0 8px"}}>Attesa arrivo materiali</div>
              {attesaMat.slice(0,4).map((o:any,i:number)=>(
                <div key={i} style={{padding:"7px 10px",borderRadius:8,border:`0.5px solid ${T.bdr}`,background:"#fff",marginBottom:5,display:"flex",gap:8,alignItems:"center"}}>
                  <div style={{width:24,height:24,borderRadius:6,background:AMBER+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:AMBER,flexShrink:0}}>{o.vani}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{o.cliente}</div>
                    <div style={{fontSize:10,color:T.sub}}>Consegna: {o.dataConsegna||"—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB MAGAZZINO */}
      {activeTab==="magazzino"&&(
        <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
            {[
              {l:"Tipologie a magazzino",v:MATERIALI_DEMO.length,c:T.text},
              {l:"Sotto scorta minima",v:materialeSotto.length,c:materialeSotto.length>0?RED:TEAL},
              {l:"Ordini materiali attesi",v:attesaMat.length,c:AMBER},
            ].map((k,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.bdr}`}}>
                <div style={{fontSize:11,color:T.sub}}>{k.l}</div>
                <div style={{fontSize:22,fontWeight:500,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
            <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.bdr}`,display:"grid",gridTemplateColumns:"1fr 120px 80px 80px 80px",gap:8}}>
              {["Materiale","Profilo / Colore","Giacenza","Scorta min.","Stato"].map((h,i)=>(
                <div key={i} style={{fontSize:10,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4}}>{h}</div>
              ))}
            </div>
            {MATERIALI_DEMO.map((m,i)=>{
              const sottoScorta=m.giacenza<=m.minimo;
              return (
                <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 120px 80px 80px 80px",padding:"10px 16px",borderBottom:i<MATERIALI_DEMO.length-1?`0.5px solid ${T.bdr}`:"none",gap:8,alignItems:"center",background:sottoScorta?RED+"02":"transparent"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:T.text}}>{m.tipo}</div>
                    {m.lunghezza>0&&<div style={{fontSize:10,color:T.sub}}>L: {m.lunghezza}mm</div>}
                  </div>
                  <div style={{fontSize:11,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{m.profilo}{m.colore?` · ${m.colore}`:""}</div>
                  <div style={{fontSize:12,fontWeight:500,color:sottoScorta?RED:T.text,fontFamily:FM}}>{m.giacenza} {m.unita}</div>
                  <div style={{fontSize:12,color:T.sub,fontFamily:FM}}>{m.minimo} {m.unita}</div>
                  <div>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:5,background:sottoScorta?RED+"12":TEAL+"12",color:sottoScorta?RED:TEAL,fontWeight:500}}>{sottoScorta?"Riordinare":"Ok"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB LAVORAZIONI LIVE */}
      {activeTab==="lavorazioni"&&(
        <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
          <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>Stato lavorazioni — {new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</div>
          {inLavorazione.length===0&&<div style={{fontSize:12,color:T.sub,textAlign:"center" as any,padding:40}}>Nessuna lavorazione in corso</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {inLavorazione.map((o:any,i:number)=>{
              const st=statoInfo(o.statoProd);
              return (
                <div key={i} style={{background:"#fff",borderRadius:12,border:`0.5px solid ${st.color}40`,padding:"14px 16px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:st.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:st.color,flexShrink:0}}>{o.vani}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{o.cliente}</div>
                      <div style={{fontSize:10,color:T.sub}}>{o.code} · {o.pezzi} pezzi</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:5,background:st.color+"12",color:st.color,flexShrink:0}}>{st.label}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{height:4,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                    <div style={{height:"100%",width:o.statoProd==="taglio"?"25%":o.statoProd==="lavorazione"?"55%":o.statoProd==="assemblaggio"?"80%":"100%",background:st.color,borderRadius:2}}/>
                  </div>
                  <div style={{fontSize:10,color:T.sub,marginTop:4,textAlign:"right" as any}}>{o.statoProd==="taglio"?"25%":o.statoProd==="lavorazione"?"55%":o.statoProd==="assemblaggio"?"80%":"100%"} completato</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CNC */}
      {activeTab==="cnc"&&(
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as any,gap:16,padding:40}}>
          <div style={{width:64,height:64,borderRadius:18,background:ORANGE+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 7h10M7 11h4"/></svg>
          </div>
          <div style={{fontSize:18,fontWeight:500,color:T.text}}>MASTRO CNC</div>
          <div style={{fontSize:12,color:T.sub,maxWidth:400,textAlign:"center" as any,lineHeight:1.7}}>
            Export diretto per macchine Emmegi CENTRO 2 e TCUT v1.7.<br/>
            Genera file EWX/XML con ottimizzazione barre e barcode per commessa.<br/>
            Disponibile con abbonamento PRO e TITAN.
          </div>
          <div style={{padding:"8px 20px",borderRadius:8,background:ORANGE+"10",border:`1px solid ${ORANGE}25`,fontSize:12,fontWeight:500,color:ORANGE}}>In sviluppo — presto disponibile</div>
          <div style={{marginTop:8,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,width:"100%",maxWidth:400}}>
            {[
              {l:"Ottimizzazione barre",s:"Taglio ottimale, scarti minimi"},
              {l:"Export EWX / XML",s:"Formato nativo Emmegi/Schüco"},
              {l:"Barcode per vano",s:"Tracciabilità completa pezzi"},
              {l:"Report taglio PDF",s:"Stampa per operatore CNC"},
            ].map((f,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:`0.5px solid ${T.bdr}`}}>
                <div style={{fontSize:11,fontWeight:500,color:T.text}}>{f.l}</div>
                <div style={{fontSize:10,color:T.sub,marginTop:2}}>{f.s}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
