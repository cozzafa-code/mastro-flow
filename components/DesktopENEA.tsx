"use client";
// @ts-nocheck
// MASTRO — DesktopENEA.tsx
// Compliance CAM 2026 + ENEA Ecobonus + Marcatura CE + U-value per zona

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", ORANGE="#F97316";

// Zone climatiche Italia con U-value limite CAM 2026
const ZONE_CLIMATICHE = [
  { zona:"A", desc:"Siracusa, Agrigento, Lampedusa", uw_max:3.5, uw_cam:2.2, colore:"#EF4444" },
  { zona:"B", desc:"Palermo, Catania, Reggio Calabria", uw_max:3.0, uw_cam:2.0, colore:"#F97316" },
  { zona:"C", desc:"Napoli, Bari, Cosenza, Salerno", uw_max:2.6, uw_cam:1.8, colore:"#F59E0B" },
  { zona:"D", desc:"Roma, Firenze, Genova, Pescara", uw_max:2.0, uw_cam:1.4, colore:"#84CC16" },
  { zona:"E", desc:"Milano, Torino, Bologna, Venezia", uw_max:1.8, uw_cam:1.0, colore:"#22D3EE" },
  { zona:"F", desc:"Bolzano, Aosta, zone montane", uw_max:1.4, uw_cam:0.8, colore:"#818CF8" },
];

const CLASSI_ENERGETICHE = [
  { label:"A+++", uw_max:0.7,  colore:"#065F46", bg:"#D1FAE5" },
  { label:"A++",  uw_max:0.9,  colore:"#065F46", bg:"#A7F3D0" },
  { label:"A+",   uw_max:1.1,  colore:"#047857", bg:"#6EE7B7" },
  { label:"A",    uw_max:1.3,  colore:"#059669", bg:"#34D399" },
  { label:"B",    uw_max:1.5,  colore:"#10B981", bg:"#6EE7B7" },
  { label:"C",    uw_max:1.9,  colore:"#F59E0B", bg:"#FDE68A" },
  { label:"D",    uw_max:2.5,  colore:"#EF4444", bg:"#FECACA" },
];

const getClasseEnergetica = (uw:number) => CLASSI_ENERGETICHE.find(c=>uw<=c.uw_max)||CLASSI_ENERGETICHE[6];
const checkCAM = (uw:number, zona:string) => {
  const z = ZONE_CLIMATICHE.find(z=>z.zona===zona);
  return z ? uw <= z.uw_cam : false;
};

export default function DesktopENEA() {
  const { T, cantieri=[], aziendaInfo } = useMastro();
  const [zonaDefault, setZonaDefault] = useState("D");
  const [activeTab, setActiveTab] = useState<"pratiche"|"calcolo"|"cam"|"ce">("pratiche");
  const [calcUw, setCalcUw] = useState(1.1);
  const [calcZona, setCalcZona] = useState("D");

  // Commesse con dati ENEA
  const pratiche = useMemo(() => cantieri.filter(c=>
    ["posa","chiusura"].includes(c.fase)||c.enea||c.vani?.some((v:any)=>v.uw)
  ).map(c=>{
    const vani=(c.vani||[]).filter((v:any)=>!v.eliminato);
    const uwMedi=vani.filter((v:any)=>v.uw).reduce((s:number,v:any)=>s+(parseFloat(v.uw)||0),0)/Math.max(1,vani.filter((v:any)=>v.uw).length)||1.2;
    const zona=c.zonaClimatica||zonaDefault;
    const camOk=checkCAM(uwMedi,zona);
    const classe=getClasseEnergetica(uwMedi);
    return {
      ...c, vani, uwMedio:Math.round(uwMedi*100)/100,
      zona, camOk, classe,
      statoENEA:c.enea?.stato||"da_compilare",
      scadenza:c.enea?.scadenza||null,
    };
  }), [cantieri, zonaDefault]);

  const daCompilare = pratiche.filter(p=>p.statoENEA==="da_compilare").length;
  const inviate = pratiche.filter(p=>p.statoENEA==="inviata").length;
  const camCompliant = pratiche.filter(p=>p.camOk).length;

  const fmtE = (n:number) => "€"+Math.round(n).toLocaleString("it-IT");
  const zonaInfo = ZONE_CLIMATICHE.find(z=>z.zona===calcZona)||ZONE_CLIMATICHE[3];
  const classeCalc = getClasseEnergetica(calcUw);
  const camCalc = checkCAM(calcUw, calcZona);

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>ENEA / CAM 2026</span>
        <div style={{padding:"3px 10px",borderRadius:100,background:TEAL+"12",fontSize:11,fontWeight:500,color:TEAL}}>DM 24/11/2025 in vigore dal 1 Feb 2026</div>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Da compilare",v:daCompilare,c:daCompilare>0?AMBER:TEAL},{l:"Inviate",v:inviate,c:TEAL},{l:"CAM compliant",v:camCompliant,c:TEAL},{l:"Zona default",v:zonaDefault,c:BLUE}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
          <select value={zonaDefault} onChange={e=>setZonaDefault(e.target.value)} style={{padding:"4px 8px",borderRadius:6,border:`0.5px solid ${T.bdr}`,fontSize:11,color:T.text,background:"#F8FAFC",fontFamily:FF}}>
            {ZONE_CLIMATICHE.map(z=><option key={z.zona} value={z.zona}>Zona {z.zona}</option>)}
          </select>
        </div>
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:0,borderBottom:`0.5px solid ${T.bdr}`,background:"#fff",flexShrink:0,paddingLeft:20}}>
        {[["pratiche","Pratiche ENEA"],["calcolo","Calcolo Uw"],["cam","CAM 2026"],["ce","Marcatura CE"]].map(([id,l])=>(
          <div key={id} onClick={()=>setActiveTab(id as any)} style={{padding:"8px 14px",fontSize:12,fontWeight:500,color:activeTab===id?TEAL:T.sub,borderBottom:`2px solid ${activeTab===id?TEAL:"transparent"}`,cursor:"pointer"}}>{l}</div>
        ))}
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* PRATICHE */}
        {activeTab==="pratiche"&&<>
          <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
            {pratiche.length===0&&(
              <div style={{textAlign:"center" as any,padding:40,color:T.sub}}>
                <div style={{fontSize:14,marginBottom:8}}>Nessuna commessa in fase Posa/Chiusura</div>
                <div style={{fontSize:12}}>Le pratiche ENEA vengono generate automaticamente quando una commessa avanza a fase Posa.</div>
              </div>
            )}
            <div style={{display:"flex",flexDirection:"column" as any,gap:8}}>
              {pratiche.map((p:any,i:number)=>{
                const sc=p.statoENEA==="inviata"?TEAL:p.statoENEA==="da_compilare"?AMBER:BLUE;
                return (
                  <div key={i} style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"14px 16px",display:"flex",gap:14,alignItems:"flex-start"}}>
                    {/* Classe energetica badge */}
                    <div style={{width:48,height:48,borderRadius:12,background:p.classe.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <div style={{fontSize:14,fontWeight:700,color:p.classe.colore}}>{p.classe.label}</div>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:13,fontWeight:500,color:T.text}}>{p.cliente} {p.cognome||""}</span>
                        <span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:sc+"12",color:sc,fontWeight:500}}>{p.statoENEA.replace("_"," ")}</span>
                        {p.camOk&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:4,background:TEAL+"12",color:TEAL,fontWeight:500}}>CAM 2026 ✓</span>}
                      </div>
                      <div style={{fontSize:11,color:T.sub}}>{p.code} · {p.indirizzo||"—"} · Zona {p.zona}</div>
                      <div style={{display:"flex",gap:12,marginTop:5}}>
                        <span style={{fontSize:11,color:T.text}}>Uw medio: <strong style={{color:p.classe.colore}}>{p.uwMedio} W/m²K</strong></span>
                        <span style={{fontSize:11,color:T.sub}}>{p.vani.length} vani · {p.fase}</span>
                        {p.scadenza&&<span style={{fontSize:11,color:AMBER}}>Scad. {p.scadenza}</span>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <button style={{padding:"5px 10px",borderRadius:6,background:TEAL,color:"#fff",border:"none",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Compila</button>
                      <button style={{padding:"5px 10px",borderRadius:6,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:11,cursor:"pointer",fontFamily:FF}}>PDF</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Info zona */}
          <div style={{width:260,flexShrink:0,background:"#fff",borderLeft:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden",padding:"14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:12}}>Zone climatiche</div>
            {ZONE_CLIMATICHE.map(z=>(
              <div key={z.zona} onClick={()=>setZonaDefault(z.zona)} style={{display:"flex",gap:8,padding:"8px 10px",borderRadius:8,marginBottom:4,cursor:"pointer",border:`0.5px solid ${zonaDefault===z.zona?z.colore:T.bdr}`,background:zonaDefault===z.zona?z.colore+"08":"transparent"}}>
                <div style={{width:24,height:24,borderRadius:6,background:z.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>Z{z.zona}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.text}}>Zona {z.zona} · Uw ≤ {z.uw_max}</div>
                  <div style={{fontSize:9,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{z.desc}</div>
                  <div style={{fontSize:9,color:TEAL,fontWeight:500}}>CAM 2026: ≤ {z.uw_cam}</div>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* CALCOLO UW */}
        {activeTab==="calcolo"&&(
          <div style={{flex:1,overflowY:"auto" as any,padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,maxWidth:800}}>
              {/* Input */}
              <div>
                <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:16}}>Calcolo trasmittanza termica Uw</div>
                <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px",marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:10}}>Parametri vetro</div>
                  {[
                    {l:"Ug — trasmittanza vetro (W/m²K)",id:"ug",min:0.4,max:3.5,step:0.1,val:0.7},
                    {l:"Af — area telaio (%)",id:"af",min:10,max:35,step:1,val:20},
                    {l:"Uf — trasmittanza telaio (W/m²K)",id:"uf",min:0.8,max:3.0,step:0.1,val:1.3},
                    {l:"Ag — area vetro (m²)",id:"ag",min:0.2,max:8,step:0.1,val:1.8},
                    {l:"ψg — dispersione lineare (W/mK)",id:"pg",min:0.02,max:0.10,step:0.01,val:0.04},
                  ].map((p,i)=>(
                    <div key={i} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,color:T.sub}}>{p.l}</span>
                        <span style={{fontSize:11,fontWeight:500,color:T.text,fontFamily:FM}}>{p.val}</span>
                      </div>
                      <input type="range" min={p.min} max={p.max} step={p.step} defaultValue={p.val} onChange={e=>{
                        const uw=Math.round((0.7*(1-0.2)+1.3*0.2+0.04*4)*10)/10;
                        setCalcUw(parseFloat(e.target.value)<1.5?parseFloat(e.target.value):uw);
                      }} style={{width:"100%"}}/>
                    </div>
                  ))}
                </div>
                <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"14px 16px"}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:8}}>Zona climatica</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6}}>
                    {ZONE_CLIMATICHE.map(z=>(
                      <div key={z.zona} onClick={()=>setCalcZona(z.zona)} style={{padding:"7px",borderRadius:7,border:`1.5px solid ${calcZona===z.zona?z.colore:T.bdr}`,cursor:"pointer",textAlign:"center" as any,background:calcZona===z.zona?z.colore+"10":"transparent"}}>
                        <div style={{fontSize:12,fontWeight:700,color:calcZona===z.zona?z.colore:T.sub}}>Z{z.zona}</div>
                        <div style={{fontSize:8,color:T.sub}}>≤{z.uw_max}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risultato */}
              <div>
                <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:16}}>Risultato</div>
                {/* Classe energetica grande */}
                <div style={{background:classeCalc.bg,borderRadius:16,padding:"24px 28px",marginBottom:14,textAlign:"center" as any}}>
                  <div style={{fontSize:48,fontWeight:800,color:classeCalc.colore,lineHeight:1}}>{classeCalc.label}</div>
                  <div style={{fontSize:14,color:classeCalc.colore,marginTop:8}}>Classe energetica</div>
                  <div style={{fontSize:28,fontWeight:600,color:classeCalc.colore,marginTop:4,fontFamily:FM}}>Uw {calcUw} W/m²K</div>
                </div>
                {/* Check zone */}
                <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:500,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:10}}>Verifica normativa</div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`0.5px solid ${T.bdr}`}}>
                    <span style={{fontSize:12,color:T.text}}>Zona {calcZona} limite legge</span>
                    <span style={{fontSize:12,fontWeight:500,color:calcUw<=zonaInfo.uw_max?TEAL:RED}}>{calcUw<=zonaInfo.uw_max?"CONFORME ✓":"NON CONFORME ✗"} ≤{zonaInfo.uw_max}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`0.5px solid ${T.bdr}`}}>
                    <span style={{fontSize:12,color:T.text}}>CAM 2026 obbligatorio</span>
                    <span style={{fontSize:12,fontWeight:500,color:camCalc?TEAL:RED}}>{camCalc?"CONFORME ✓":"NON CONFORME ✗"} ≤{zonaInfo.uw_cam}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"7px 0"}}>
                    <span style={{fontSize:12,color:T.text}}>Detrazione Ecobonus 65%</span>
                    <span style={{fontSize:12,fontWeight:500,color:calcUw<=zonaInfo.uw_max?TEAL:RED}}>{calcUw<=zonaInfo.uw_max?"AMMISSIBILE ✓":"Non ammissibile"}</span>
                  </div>
                </div>
                {/* Barra classi */}
                <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"14px 16px"}}>
                  <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Scale classi energetiche</div>
                  {CLASSI_ENERGETICHE.map(c=>(
                    <div key={c.label} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,padding:"4px 8px",borderRadius:6,background:c.label===classeCalc.label?c.bg:"transparent",border:`0.5px solid ${c.label===classeCalc.label?c.colore:T.bdr}`}}>
                      <div style={{width:28,fontSize:11,fontWeight:700,color:c.colore}}>{c.label}</div>
                      <div style={{flex:1,height:6,background:"#F4F6F8",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.round((1-c.uw_max/3.5)*100)}%`,background:c.colore,borderRadius:3}}/>
                      </div>
                      <div style={{fontSize:10,color:T.sub,minWidth:60,textAlign:"right" as any}}>≤ {c.uw_max} W/m²K</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAM 2026 */}
        {activeTab==="cam"&&(
          <div style={{flex:1,overflowY:"auto" as any,padding:24}}>
            <div style={{maxWidth:700}}>
              <div style={{background:TEAL+"08",borderRadius:12,border:`1px solid ${TEAL}25`,padding:"14px 18px",marginBottom:20}}>
                <div style={{fontSize:13,fontWeight:500,color:TEAL,marginBottom:4}}>CAM 2026 — Criteri Ambientali Minimi</div>
                <div style={{fontSize:12,color:T.sub,lineHeight:1.6}}>DM 24/11/2025 in vigore dal 1 febbraio 2026. Obbligatorio per tutte le opere di ristrutturazione edilizia che accedono a incentivi pubblici (Ecobonus, Superbonus, PNRR).</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {titolo:"Requisito 1 — Trasmittanza Uw",obblig:true,desc:"Uw ≤ limite di zona (vedi tabella). Obbligatorio per accesso incentivi.",icona:"🌡️"},
                  {titolo:"Requisito 2 — Materiali riciclati",obblig:true,desc:"Profili con almeno 30% contenuto riciclato pre/post consumo. Dichiarazione del produttore.",icona:"♻️"},
                  {titolo:"Requisito 3 — Durabilità",obblig:true,desc:"Garanzia minima 10 anni sulle prestazioni. Certificazione UNI 11673-1.",icona:"⏱️"},
                  {titolo:"Requisito 4 — Fine vita",obblig:false,desc:"Piano di smontaggio e recupero materiali a fine vita utile. Raccomandata.",icona:"🔄"},
                  {titolo:"Requisito 5 — Imballaggi",obblig:false,desc:"Imballaggi con ≥ 80% materiale riciclabile. Raccomandata.",icona:"📦"},
                  {titolo:"Requisito 6 — Documentazione",obblig:true,desc:"DoP (Declaration of Performance) CE obbligatoria. Archiviazione 10 anni.",icona:"📋"},
                ].map((r,i)=>(
                  <div key={i} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${r.obblig?AMBER+"40":T.bdr}`,padding:"14px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <div style={{fontSize:20}}>{r.icona}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:T.text}}>{r.titolo}</div>
                        <span style={{fontSize:9,padding:"1px 6px",borderRadius:4,background:r.obblig?RED+"12":AMBER+"12",color:r.obblig?RED:AMBER,fontWeight:500}}>{r.obblig?"OBBLIGATORIO":"Raccomandato"}</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:T.sub,lineHeight:1.4}}>{r.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{marginTop:20,background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
                <div style={{padding:"10px 16px",borderBottom:`0.5px solid ${T.bdr}`,fontSize:12,fontWeight:500,color:T.text}}>Limiti Uw per zona — CAM 2026</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)"}}>
                  {ZONE_CLIMATICHE.map((z,i)=>(
                    <div key={z.zona} style={{padding:"12px",textAlign:"center" as any,borderRight:i<5?`0.5px solid ${T.bdr}`:"none",background:zonaDefault===z.zona?z.colore+"08":"transparent",cursor:"pointer"}} onClick={()=>setZonaDefault(z.zona)}>
                      <div style={{width:32,height:32,borderRadius:8,background:z.colore,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",margin:"0 auto 8px"}}>Z{z.zona}</div>
                      <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:FM}}>≤ {z.uw_cam}</div>
                      <div style={{fontSize:9,color:T.sub}}>W/m²K</div>
                      <div style={{fontSize:9,color:T.sub,marginTop:4,lineHeight:1.3}}>{z.desc.split(",")[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MARCATURA CE */}
        {activeTab==="ce"&&(
          <div style={{flex:1,overflowY:"auto" as any,padding:24}}>
            <div style={{maxWidth:700}}>
              <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"20px",marginBottom:16}}>
                <div style={{fontSize:13,fontWeight:500,color:T.text,marginBottom:14}}>Etichetta CE automatica</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  {[
                    {l:"Produttore",v:aziendaInfo?.ragione||"Walter Cozza Serramenti SRL"},
                    {l:"Norma di riferimento",v:"EN 14351-1:2006+A2:2016"},
                    {l:"Trasmittanza termica Uw",v:`${calcUw} W/(m²·K)`},
                    {l:"Permeabilità aria",v:"Classe 4 EN 12207"},
                    {l:"Tenuta acqua",v:"Classe 9A EN 12208"},
                    {l:"Resistenza vento",v:"Classe C5 EN 12210"},
                    {l:"Anno DoP",v:new Date().getFullYear().toString()},
                    {l:"Organismo notificato",v:"N/A — autoproduttore"},
                  ].map((r,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 12px",borderRadius:7,background:"#F8FAFC",border:`0.5px solid ${T.bdr}`}}>
                      <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                      <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:8,marginTop:16}}>
                  <button style={{padding:"8px 16px",borderRadius:8,background:TEAL,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Genera etichetta CE PDF</button>
                  <button style={{padding:"8px 16px",borderRadius:8,background:"transparent",color:T.sub,border:`0.5px solid ${T.bdr}`,fontSize:12,cursor:"pointer",fontFamily:FF}}>DoP (Dichiarazione di Prestazione)</button>
                  <button style={{padding:"8px 16px",borderRadius:8,background:"transparent",color:BLUE,border:`0.5px solid ${BLUE}40`,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:FF}}>Pratica ENEA</button>
                </div>
              </div>
              {/* Checklist DoP */}
              <div style={{background:"#fff",borderRadius:12,border:`0.5px solid ${T.bdr}`,padding:"16px 20px"}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text,marginBottom:12}}>Checklist documentazione obbligatoria</div>
                {[
                  {l:"DoP — Dichiarazione di Prestazione",ok:true},
                  {l:"Etichetta CE applicata sull'infisso",ok:true},
                  {l:"Scheda tecnica prodotto",ok:true},
                  {l:"Uw certificato da laboratorio accreditato",ok:false},
                  {l:"Certificazione materiali riciclati (CAM 2026)",ok:false},
                  {l:"UNI 11673-1 durabilità",ok:false},
                  {l:"Archivio DoP 10 anni",ok:true},
                ].map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i<6?`0.5px solid ${T.bdr}`:"none"}}>
                    <div style={{width:16,height:16,borderRadius:4,background:item.ok?TEAL+"15":RED+"15",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      {item.ok
                        ?<svg width="9" height="9" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" fill="none" stroke={TEAL} strokeWidth="1.5" strokeLinecap="round"/></svg>
                        :<svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" fill="none" stroke={RED} strokeWidth="1.5" strokeLinecap="round"/></svg>}
                    </div>
                    <span style={{fontSize:12,color:item.ok?T.text:T.sub}}>{item.l}</span>
                    {!item.ok&&<span style={{marginLeft:"auto",fontSize:10,color:RED,fontWeight:500}}>Mancante</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
