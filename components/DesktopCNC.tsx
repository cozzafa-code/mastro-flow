"use client";
// @ts-nocheck
// MASTRO — DesktopCNC.tsx
// CNC Emmegi CENTRO 2 / TCUT v1.7: ottimizzazione barre, export EWX/XML, barcode

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316";

const MACCHINE = [
  { id:"centro2",  nome:"Emmegi CENTRO 2",   formato:"EWX",  desc:"Taglio + lavorazione profili" },
  { id:"tcut",     nome:"Emmegi TCUT v1.7",  formato:"XML",  desc:"Centro di taglio automatico" },
  { id:"schuco_cnc",nome:"Schüco CNC",       formato:"AKS",  desc:"Lavorazioni Schüco native" },
  { id:"csv_gen",  nome:"CSV Universale",    formato:"CSV",  desc:"Compatibile con qualsiasi CNC" },
];

const BARRE_CATALOGO = [
  { profilo:"Traverso superiore AWS 90", lunghezza:6000, colore:"RAL 7016", pz:24, minTaglio:200 },
  { profilo:"Traverso inferiore AWS 90", lunghezza:6000, colore:"RAL 7016", pz:24, minTaglio:200 },
  { profilo:"Montante SX AWS 90",        lunghezza:6000, colore:"RAL 7016", pz:18, minTaglio:150 },
  { profilo:"Montante DX AWS 90",        lunghezza:6000, colore:"RAL 7016", pz:18, minTaglio:150 },
  { profilo:"Traverso anta",             lunghezza:6000, colore:"RAL 7016", pz:30, minTaglio:100 },
  { profilo:"Montante anta",             lunghezza:6000, colore:"RAL 7016", pz:30, minTaglio:100 },
];

// Algoritmo ottimizzazione taglio (First Fit Decreasing)
function ottimizzaBarre(tagli: number[], lungBarra: number, minTaglio: number): { barre: number[][], scarti: number[], rendimento: number } {
  const sorted = [...tagli].sort((a,b)=>b-a);
  const barre: number[][] = [];
  const barreLunghezze: number[] = [];

  for(const taglio of sorted) {
    let inserito = false;
    for(let i=0; i<barre.length; i++) {
      if(barreLunghezze[i] - taglio >= minTaglio || barreLunghezze[i] - taglio === 0) {
        barre[i].push(taglio);
        barreLunghezze[i] -= taglio;
        inserito = true;
        break;
      }
    }
    if(!inserito) {
      barre.push([taglio]);
      barreLunghezze.push(lungBarra - taglio);
    }
  }

  const scarti = barreLunghezze;
  const totUsato = tagli.reduce((s,t)=>s+t,0);
  const totBarre = barre.length * lungBarra;
  const rendimento = Math.round(totUsato/totBarre*100);
  return { barre, scarti, rendimento };
}

export default function DesktopCNC() {
  const { T, cantieri=[], ordiniFornDB=[] } = useMastro();
  const [selMacchina, setSelMacchina] = useState("centro2");
  const [selCommessa, setSelCommessa] = useState<string|null>(null);
  const [lungBarra, setLungBarra] = useState(6000);
  const [activeTab, setActiveTab] = useState<"ottimizzazione"|"export"|"storico">("ottimizzazione");
  const [generato, setGenerato] = useState(false);

  const commesseProd = cantieri.filter(c=>["ordini","produzione","posa"].includes(c.fase));
  const cmSel = cantieri.find(c=>c.id===selCommessa);
  const vaniSel = cmSel ? (cmSel.vani||[]).filter((v:any)=>!v.eliminato) : [];

  // Genera tagli simulati dai vani
  const tagli = useMemo(()=>{
    if(!vaniSel.length) return [];
    return vaniSel.flatMap((v:any)=>{
      const m=v.misure||{};
      const l=parseInt(m.lCentro)||1200;
      const h=parseInt(m.hCentro)||2100;
      return [l, l, h, h, l-100, l-100]; // traversi e montanti
    }).filter(t=>t>0);
  },[vaniSel]);

  const ottimizzazione = useMemo(()=>{
    if(!tagli.length) return null;
    return ottimizzaBarre(tagli, lungBarra, 200);
  },[tagli, lungBarra]);

  const macchina = MACCHINE.find(m=>m.id===selMacchina)||MACCHINE[0];

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>CNC</span>
        <div style={{display:"flex",gap:6}}>
          {MACCHINE.map(m=>(
            <div key={m.id} onClick={()=>setSelMacchina(m.id)} style={{padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,cursor:"pointer",background:selMacchina===m.id?DARK:"transparent",color:selMacchina===m.id?"#fff":T.sub,border:`0.5px solid ${selMacchina===m.id?DARK:T.bdr}`}}>{m.nome}</div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Commesse in prod.",v:commesseProd.length,c:ORANGE},{l:"Barre catalogo",v:BARRE_CATALOGO.length,c:T.text},{l:"Formato",v:macchina.formato,c:TEAL}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:14,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:0,borderBottom:`0.5px solid ${T.bdr}`,background:"#fff",flexShrink:0,paddingLeft:20}}>
        {[["ottimizzazione","Ottimizzazione barre"],["export","Export CNC"],["storico","Storico lavorazioni"]].map(([id,l])=>(
          <div key={id} onClick={()=>setActiveTab(id as any)} style={{padding:"8px 14px",fontSize:12,fontWeight:500,color:activeTab===id?ORANGE:T.sub,borderBottom:`2px solid ${activeTab===id?ORANGE:"transparent"}`,cursor:"pointer"}}>{l}</div>
        ))}
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* SIDEBAR COMMESSE */}
        <div style={{width:240,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,flexShrink:0}}>Commesse produzione</div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {commesseProd.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessuna commessa in produzione</div>}
            {commesseProd.map((c:any)=>{
              const vani=(c.vani||[]).filter((v:any)=>!v.eliminato);
              return (
                <div key={c.id} onClick={()=>setSelCommessa(selCommessa===c.id?null:c.id)}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selCommessa===c.id?"rgba(249,115,22,0.06)":"transparent",borderLeft:`2px solid ${selCommessa===c.id?ORANGE:"transparent"}`}}>
                  <div style={{fontSize:12,fontWeight:500,color:T.text}}>{c.cliente} {c.cognome||""}</div>
                  <div style={{fontSize:10,color:T.sub}}>{c.code} · {vani.length} vani</div>
                  <div style={{fontSize:10,color:T.sub,marginTop:2}}>{c.fase}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1,overflowY:"auto" as any,padding:20,minWidth:0}}>

          {activeTab==="ottimizzazione"&&<>
            {!selCommessa?(
              <div style={{textAlign:"center" as any,padding:40,color:T.sub}}>
                <div style={{fontSize:14,marginBottom:8}}>Seleziona una commessa per ottimizzare il taglio barre</div>
                <div style={{fontSize:12}}>L'algoritmo FFD (First Fit Decreasing) minimizza gli scarti e massimizza il rendimento.</div>
              </div>
            ):(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:500,color:T.text}}>{cmSel?.cliente} {cmSel?.cognome||""} — {cmSel?.code}</div>
                    <div style={{fontSize:11,color:T.sub}}>{tagli.length} tagli · {vaniSel.length} vani</div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:11,color:T.sub}}>Lunghezza barra:</span>
                    <select value={lungBarra} onChange={e=>setLungBarra(parseInt(e.target.value))} style={{padding:"5px 8px",border:`0.5px solid ${T.bdr}`,borderRadius:6,fontSize:12,fontFamily:FF,color:T.text,background:"#F8FAFC"}}>
                      {[5000,5500,6000,6500,7000].map(l=><option key={l} value={l}>{l} mm</option>)}
                    </select>
                  </div>
                </div>

                {ottimizzazione&&<>
                  {/* KPI ottimizzazione */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
                    {[
                      {l:"Barre necessarie",v:ottimizzazione.barre.length,c:ORANGE},
                      {l:"Rendimento",v:`${ottimizzazione.rendimento}%`,c:ottimizzazione.rendimento>=85?TEAL:ottimizzazione.rendimento>=70?AMBER:RED},
                      {l:"Tagli totali",v:tagli.length,c:T.text},
                      {l:"Scarto medio",v:`${Math.round(ottimizzazione.scarti.reduce((s,x)=>s+x,0)/ottimizzazione.scarti.length)} mm`,c:T.sub},
                    ].map((k,i)=>(
                      <div key={i} style={{background:"#fff",borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.bdr}`}}>
                        <div style={{fontSize:11,color:T.sub}}>{k.l}</div>
                        <div style={{fontSize:22,fontWeight:500,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Visualizzazione barre */}
                  <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:14}}>
                    <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontSize:12,fontWeight:500,color:T.text}}>Layout barre</span>
                      <span style={{fontSize:11,color:T.sub}}>Ogni barra {lungBarra}mm · scarto in grigio</span>
                    </div>
                    <div style={{padding:"14px 16px",maxHeight:300,overflowY:"auto" as any}}>
                      {ottimizzazione.barre.map((barra,bi)=>{
                        const scarto=ottimizzazione.scarti[bi];
                        const colors=[TEAL,BLUE,"#8B5CF6",ORANGE,AMBER,RED];
                        return (
                          <div key={bi} style={{marginBottom:10}}>
                            <div style={{fontSize:10,color:T.sub,marginBottom:4}}>Barra {bi+1} · scarto {scarto}mm</div>
                            <div style={{display:"flex",height:20,borderRadius:4,overflow:"hidden",border:`0.5px solid ${T.bdr}`}}>
                              {barra.map((t,ti)=>(
                                <div key={ti} style={{flex:t,background:colors[ti%colors.length],display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#fff",fontWeight:700,borderRight:"1px solid rgba(255,255,255,0.3)",minWidth:0,overflow:"hidden"}}>
                                  {t>200&&`${t}`}
                                </div>
                              ))}
                              {scarto>0&&<div style={{flex:scarto,background:"#E5E3DC",minWidth:scarto/lungBarra*4}}/>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lista tagli */}
                  <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
                    <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:12,fontWeight:500,color:T.text}}>Lista tagli per vano</div>
                    <div style={{maxHeight:200,overflowY:"auto" as any}}>
                      {vaniSel.map((v:any,i:number)=>{
                        const m=v.misure||{};
                        const l=parseInt(m.lCentro)||1200;
                        const h=parseInt(m.hCentro)||2100;
                        return (
                          <div key={i} style={{padding:"8px 16px",borderBottom:`0.5px solid ${T.bdr}`,display:"grid",gridTemplateColumns:"1fr repeat(4,80px)",gap:8,alignItems:"center"}}>
                            <div style={{fontSize:11,fontWeight:500,color:T.text}}>{v.nome||`Vano ${i+1}`} · {v.sistema||"—"}</div>
                            {[["Travers. sup",l],["Travers. inf",l],["Montante SX",h],["Montante DX",h]].map(([n,val],j)=>(
                              <div key={j} style={{textAlign:"center" as any}}>
                                <div style={{fontSize:9,color:T.sub}}>{n}</div>
                                <div style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{val} mm</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>}
              </>
            )}
          </>}

          {activeTab==="export"&&<>
            <div style={{fontSize:14,fontWeight:500,color:T.text,marginBottom:16}}>Export per {macchina.nome}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
              {/* Impostazioni export */}
              <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px"}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>Impostazioni</div>
                {[
                  {l:"Commessa",v:cmSel?`${cmSel.code} · ${cmSel.cliente}`:"-"},
                  {l:"Macchina",v:macchina.nome},
                  {l:"Formato output",v:macchina.formato},
                  {l:"Include barcode",v:"Sì — per vano"},
                  {l:"Ottimizzazione",v:"FFD abilitata"},
                  {l:"Unità misura",v:"mm"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<5?`0.5px solid ${T.bdr}`:"none"}}>
                    <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>
              {/* Anteprima file */}
              <div style={{background:"#1A1A1C",borderRadius:12,padding:"16px",fontFamily:"JetBrains Mono, monospace"}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:8}}>Anteprima {macchina.formato}</div>
                <div style={{fontSize:11,color:"#4ADE80",lineHeight:1.8}}>
                  {macchina.formato==="EWX"&&<>
                    {"[CENTRO2_HEADER]"}<br/>
                    {"VERSION=2.1"}<br/>
                    {`DATE=${new Date().toISOString().split("T")[0]}`}<br/>
                    {`JOB=${cmSel?.code||"CM-0001"}`}<br/>
                    {"[PROFILES]"}<br/>
                    {"P001,AWS90,6000,RAL7016"}<br/>
                    {"[CUTS]"}<br/>
                    {"P001,1200,90,90"}<br/>
                    {"P001,2100,45,45"}<br/>
                    {"..."}
                  </>}
                  {macchina.formato==="XML"&&<>
                    {"<?xml version=\"1.0\"?>"}<br/>
                    {"<CNCJob version=\"1.7\">"}<br/>
                    {`  <Header job="${cmSel?.code||"CM-0001"}"/>`}<br/>
                    {"  <Profiles>"}<br/>
                    {"    <Profile id=\"AWS90\""}<br/>
                    {"      length=\"6000\"/>"}<br/>
                    {"  </Profiles>"}<br/>
                    {"  <Cuts>..."}<br/>
                    {"</CNCJob>"}
                  </>}
                  {macchina.formato==="CSV"&&<>
                    {"profilo,lunghezza,angolo_a,angolo_b,barcode"}<br/>
                    {"AWS90,1200,90,90,CM0001-V1-T"}<br/>
                    {"AWS90,2100,45,45,CM0001-V1-M"}<br/>
                    {"AWS90,1400,90,90,CM0001-V2-T"}<br/>
                    {"..."}
                  </>}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setGenerato(true)} style={{padding:"10px 20px",borderRadius:8,background:ORANGE,color:"#fff",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF}}>
                {generato?`✓ ${macchina.formato} generato`:`Genera file ${macchina.formato}`}
              </button>
              {generato&&<button style={{padding:"10px 20px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Scarica {macchina.formato}</button>}
              <button style={{padding:"10px 20px",borderRadius:8,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:13,cursor:"pointer",fontFamily:FF}}>Anteprima PDF taglio</button>
            </div>
          </>}

          {activeTab==="storico"&&<>
            <div style={{fontSize:14,fontWeight:500,color:T.text,marginBottom:14}}>Lavorazioni completate</div>
            <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
              <div style={{padding:"8px 16px",background:"#F8FAFC",borderBottom:`0.5px solid ${T.bdr}`,display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 70px",gap:8}}>
                {["Commessa","Barre","Tagli","Rend.","Data"].map((h,i)=>(
                  <div key={i} style={{fontSize:10,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,textAlign:i>=1?"right" as any:"left"}}>{h}</div>
                ))}
              </div>
              {commesseProd.slice(0,5).map((c:any,i:number)=>{
                const v=(c.vani||[]).filter((v:any)=>!v.eliminato).length;
                return (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 70px",padding:"9px 16px",borderBottom:i<4?`0.5px solid ${T.bdr}`:"none",gap:8,alignItems:"center"}}>
                    <div style={{fontSize:12,fontWeight:500,color:T.text}}>{c.code} · {c.cliente}</div>
                    <div style={{fontSize:11,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{Math.ceil(v*1.5)}</div>
                    <div style={{fontSize:11,color:T.text,textAlign:"right" as any,fontFamily:FM}}>{v*6}</div>
                    <div style={{fontSize:11,fontWeight:500,color:TEAL,textAlign:"right" as any}}>87%</div>
                    <div style={{fontSize:10,color:T.sub,textAlign:"right" as any}}>—</div>
                  </div>
                );
              })}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}
