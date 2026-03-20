"use client";
import DisegnoTecnico from "./DisegnoTecnico";
// @ts-nocheck
// MASTRO — ConfiguratoreCommessa v2 — Professional Grade
// Tutto quello che hanno Opera + FPPRO + quello che non hanno
// Layout: 3 colonne fisse — Lista Vani | Configuratore | Preview+Tecnica

import { useState, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I, Ico, TIPOLOGIE_RAPIDE } from "./mastro-constants";

const TEAL = "#1A9E73"; const DARK = "#1A1A1C"; const AMBER = "#D08008";
const RED = "#DC4444"; const BLUE = "#3B7FE0";

// ── Calcolo Uw (EN 14351) ──────────────────────────────────────────
function calcUw(lmm:number, hmm:number, vetro:string, profilo:string): number {
  if (!lmm || !hmm) return 0;
  const ug = vetro.includes("Triplo")||vetro.includes("0.6") ? 0.6
    : vetro.includes("Basso Emissivo")||vetro.includes("1.0") ? 1.0
    : vetro.includes("1.1") ? 1.1 : 1.4;
  const uf = profilo.includes("PVC") ? 1.3
    : profilo.includes("Legno") ? 1.2
    : profilo.includes("EFT")||profilo.includes("90") ? 0.9
    : 1.4;
  const mq = (lmm/1000)*(hmm/1000);
  const perim = 2*((lmm+hmm)/1000);
  const ag = Math.max(0, mq - 0.08*perim);
  const af = mq - ag;
  return Math.round(((uf*af + ug*ag)/mq)*100)/100;
}
function uwClass(uw:number) {
  if (uw===0) return {label:"—",color:"#999"};
  if (uw<=0.8) return {label:"A+++ Passivhaus",color:"#059669"};
  if (uw<=1.0) return {label:"A++ Eccellente",color:TEAL};
  if (uw<=1.4) return {label:"A Ottimo",color:BLUE};
  if (uw<=1.8) return {label:"B Buono",color:AMBER};
  if (uw<=2.4) return {label:"C Standard",color:"#F97316"};
  return {label:"D Non conforme CAM",color:RED};
}

// ── Disegno SVG infisso ────────────────────────────────────────────
function InfissoSVG({tipo,l,h,apertura,colore,showQuote=true}:any) {
  const W=240,H=200;
  const fw=Math.min(W-40,(l||1000)/Math.max(1,(l||1000)/(W-40)));
  const fh=Math.min(H-40,(h||1000)/Math.max(1,(h||1000)/(H-40)));
  const scale=Math.min((W-40)/(l||1000),(H-40)/(h||1000));
  const rfw=(l||1000)*scale, rfh=(h||1000)*scale;
  const ox=(W-rfw)/2, oy=(H-rfh)/2;
  const stroke=colore?.includes("Antracite")||colore?.includes("7016")?"#2a2a2a"
    :colore?.includes("Bronzo")?"#7a5c14":"#4a4a4a";
  const fill="rgba(135,206,235,0.25)";
  const t=Math.max(6, rfw*0.05);
  const renderAnta=(x:number,y:number,w:number,h:number,dir:"l"|"r"|"none")=>(
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={stroke} strokeWidth={1.5}/>
      {dir==="l"&&<><path d={`M${x+t} ${y+t} L${x+t} ${y+h-t} L${x+w-t} ${y+h/2}`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="3,2" opacity={0.5}/><rect x={x+w-t-3} y={y+h/2-9} width={3} height={18} rx={1.5} fill={stroke} opacity={0.7}/></>}
      {dir==="r"&&<><path d={`M${x+w-t} ${y+t} L${x+w-t} ${y+h-t} L${x+t} ${y+h/2}`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="3,2" opacity={0.5}/><rect x={x+t} y={y+h/2-9} width={3} height={18} rx={1.5} fill={stroke} opacity={0.7}/></>}
    </g>
  );
  const inner_x=ox+t, inner_y=oy+t, inner_w=rfw-t*2, inner_h=rfh-t*2;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect x={ox} y={oy} width={rfw} height={rfh} fill="none" stroke={stroke} strokeWidth={t}/>
      {(!apertura||apertura==="fisso")&&<rect x={inner_x} y={inner_y} width={inner_w} height={inner_h} fill={fill} stroke={stroke} strokeWidth={1}/>}
      {apertura==="anta_sx"&&renderAnta(inner_x,inner_y,inner_w,inner_h,"l")}
      {apertura==="anta_dx"&&renderAnta(inner_x,inner_y,inner_w,inner_h,"r")}
      {apertura==="due_ante"&&<>
        {renderAnta(inner_x,inner_y,inner_w/2-1,inner_h,"l")}
        {renderAnta(inner_x+inner_w/2+1,inner_y,inner_w/2-1,inner_h,"r")}
        <line x1={ox+rfw/2} y1={oy} x2={ox+rfw/2} y2={oy+rfh} stroke={stroke} strokeWidth={3}/>
      </>}
      {apertura==="scorrevole"&&<>
        <rect x={inner_x} y={inner_y} width={inner_w/2-1} height={inner_h} fill={fill} stroke={stroke} strokeWidth={1}/>
        <rect x={inner_x+inner_w/2+1} y={inner_y} width={inner_w/2-1} height={inner_h} fill="rgba(135,206,235,0.12)" stroke={stroke} strokeWidth={1} strokeDasharray="4,2"/>
        <path d={`M${ox+rfw/2-8} ${oy+rfh/2} l8-5 0 10z`} fill={stroke} opacity={0.6}/>
      </>}
      {apertura==="alzante"&&<>
        <rect x={inner_x} y={inner_y} width={inner_w} height={inner_h} fill={fill} stroke={stroke} strokeWidth={1}/>
        <line x1={inner_x+inner_w/2} y1={inner_y} x2={inner_x+inner_w/2} y2={inner_y+inner_h} stroke={stroke} strokeWidth={1.5}/>
        <path d={`M${inner_x+inner_w/2-8} ${inner_y+inner_h-12} l8-10 8 10`} fill="none" stroke={stroke} strokeWidth={1.5}/>
      </>}
      {apertura==="vasistas"&&<>
        <rect x={inner_x} y={inner_y} width={inner_w} height={inner_h} fill={fill} stroke={stroke} strokeWidth={1}/>
        <path d={`M${inner_x} ${inner_y+inner_h} L${inner_x+inner_w/2} ${inner_y+t} L${inner_x+inner_w} ${inner_y+inner_h}`} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="3,2" opacity={0.5}/>
      </>}
      {showQuote&&l&&h&&<>
        <line x1={ox} y1={oy+rfh+8} x2={ox+rfw} y2={oy+rfh+8} stroke="#ccc" strokeWidth={0.8}/>
        <line x1={ox-8} y1={oy} x2={ox-8} y2={oy+rfh} stroke="#ccc" strokeWidth={0.8}/>
        <text x={ox+rfw/2} y={oy+rfh+18} textAnchor="middle" fontSize={10} fill="#888" fontFamily={FM}>{l}</text>
        <text x={ox-16} y={oy+rfh/2} textAnchor="middle" fontSize={10} fill="#888" fontFamily={FM} transform={`rotate(-90,${ox-16},${oy+rfh/2})`}>{h}</text>
      </>}
    </svg>
  );
}

// ── Costanti ────────────────────────────────────────────────────────
const APERTURE = [{id:"fisso",l:"Fisso"},{id:"anta_sx",l:"Anta SX"},{id:"anta_dx",l:"Anta DX"},{id:"due_ante",l:"2 Ante"},{id:"scorrevole",l:"Scorrevole"},{id:"alzante",l:"Alzante"},{id:"vasistas",l:"Vasistas"}];
const MATERIALI = ["Alluminio","PVC","Legno-Alluminio","Legno","Ferro","Acciaio","PVC-Legno"];
const VETRI_DEFAULT = ["4/16/4 Basso Emissivo Ug1.0","4/20/4 Triplo Ug0.6","4/16/4 Standard Ug1.4","Stratificato 33.1","Stratificato 44.2","Oscurato","Retinato","Basso emissivo + gas Argon"];
const COLORI_DEFAULT = ["Bianco RAL 9016","Antracite RAL 7016","Bronzo 8022","Avorio RAL 1013","Grigio Alluminio RAL 9006","Naturale Anodizzato","Bicolore","Personalizzato"];
const ACCESSORI_LIST = [{id:"tapparella",l:"Tapparella"},{id:"zanzariera",l:"Zanzariera"},{id:"cassonetto",l:"Cassonetto"},{id:"persiana",l:"Persiana"},{id:"oscurante",l:"Oscurante"},{id:"controtelaio",l:"Controtelaio"},{id:"davanzale",l:"Davanzale"},{id:"soglia",l:"Soglia"},{id:"imbotte",l:"Imbotte"}];

export default function ConfiguratoreCommessa({commessa, onClose}:{commessa:any,onClose:()=>void}) {
  const ctx = useMastro();
  const {T,sistemiDB=[],vetriDB=[],aziendaDB,aziendaInfo,getVaniAttivi,calcolaVanoPrezzo,setCantieri}=ctx;
  const az=aziendaDB||aziendaInfo||{};
  const vaniInit=getVaniAttivi?getVaniAttivi(commessa):(commessa.vani||[]).filter((v:any)=>!v.eliminato);
  const [vani,setVani]=useState<any[]>(vaniInit.length>0?vaniInit:[{id:Date.now(),nome:"Vano 1",tipo:"Finestra",misure:{},pezzi:1,apertura:"anta_sx"}]);
  const [selIdx,setSelIdx]=useState(0);
  const [tab2,setTab2]=useState<"base"|"tecnica"|"accessori"|"note">("base");
  const [saved,setSaved]=useState(false);
  const [showBreakdown,setShowBreakdown]=useState(false);
  const vano=vani[selIdx]||vani[0];
  const sistemi=(sistemiDB||[]).map((s:any)=>s.sistema||s.nome).filter(Boolean);
  const vetri=(vetriDB||[]).map((v:any)=>v.nome||v.code).filter(Boolean);

  const upd=(field:string,val:any)=>setVani(p=>p.map((v,i)=>i===selIdx?{...v,[field]:val}:v));
  const updM=(field:string,val:any)=>setVani(p=>p.map((v,i)=>i===selIdx?{...v,misure:{...v.misure,[field]:val}}:v));
  const updA=(key:string,val:any)=>setVani(p=>p.map((v,i)=>i===selIdx?{...v,accessori:{...(v.accessori||{}),[key]:val}}:v));
  const addVano=()=>{const n={id:Date.now(),nome:`Vano ${vani.length+1}`,tipo:"Finestra",misure:{},pezzi:1,apertura:"anta_sx"};setVani(p=>[...p,n]);setSelIdx(vani.length);};
  const dupVano=()=>{const c={...vano,id:Date.now(),nome:vano.nome+" (copia)"};setVani(p=>[...p,c]);setSelIdx(vani.length);};
  const delVano=()=>{if(vani.length===1)return;setVani(p=>p.filter((_,i)=>i!==selIdx));setSelIdx(Math.max(0,selIdx-1));};
  const moveUp=()=>{if(selIdx===0)return;const a=[...vani];[a[selIdx-1],a[selIdx]]=[a[selIdx],a[selIdx-1]];setVani(a);setSelIdx(selIdx-1);};
  const moveDown=()=>{if(selIdx===vani.length-1)return;const a=[...vani];[a[selIdx],a[selIdx+1]]=[a[selIdx+1],a[selIdx]];setVani(a);setSelIdx(selIdx+1);};

  const pv=(v:any)=>{if(calcolaVanoPrezzo)return calcolaVanoPrezzo(v,commessa);const m=v.misure||{};const mq=(m.lCentro||0)/1000*(m.hCentro||0)/1000;return Math.round(mq*parseFloat(az.prezzoMqDefault||commessa.prezzoMq||350)*100)/100;};
  const cv=(v:any)=>Math.round(pv(v)*(1-parseFloat(az.marginePerc||35)/100)*100)/100;
  const totP=vani.reduce((s,v)=>s+pv(v)*(v.pezzi||1),0);
  const totC=vani.reduce((s,v)=>s+cv(v)*(v.pezzi||1),0);
  const margine=totP>0?Math.round((1-totC/totP)*100):0;
  const ivaP=commessa.ivaPerc||10;
  const totIva=Math.round(totP*(1+ivaP/100)*100)/100;
  const uw=calcUw(vano.misure?.lCentro||0,vano.misure?.hCentro||0,vano.vetro||"",vano.sistema||"");
  const uwC=uwClass(uw);
  const mq=(vano.misure?.lCentro||0)/1000*(vano.misure?.hCentro||0)/1000;

  const save=()=>{setCantieri((p:any[])=>p.map(c=>c.id===commessa.id?{...c,vani}:c));setSaved(true);setTimeout(()=>setSaved(false),2500);};

  // Stili riusabili
  const INP={width:"100%",padding:"7px 10px",borderRadius:8,border:`1.5px solid ${T.bdr}`,fontSize:12,outline:"none",background:"#fff",fontFamily:FF,color:T.text,boxSizing:"border-box" as any};
  const SEL={...INP,appearance:"none" as any};
  const F=({l,children,half=false}:any)=>(
    <div style={{marginBottom:10,width:half?"calc(50% - 4px)":"100%"}}>
      <div style={{fontSize:10,fontWeight:600,color:T.sub,marginBottom:4,textTransform:"uppercase" as any,letterSpacing:0.4}}>{l}</div>
      {children}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:500,background:"#EEF0F4",display:"flex",flexDirection:"column",fontFamily:FF}}>

      {/* ── TOPBAR ── */}
      <div style={{height:50,background:DARK,display:"flex",alignItems:"center",padding:"0 16px",gap:12,flexShrink:0,borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
        <div style={{width:26,height:26,borderRadius:7,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>M</div>
        <span style={{fontSize:12,fontWeight:800,color:"rgba(255,255,255,0.5)",letterSpacing:1}}>CONFIGURATORE</span>
        <span style={{color:"rgba(255,255,255,0.25)"}}>›</span>
        <span style={{fontSize:13,fontWeight:700,color:"#fff"}}>{commessa.code}</span>
        <span style={{color:"rgba(255,255,255,0.25)"}}>›</span>
        <span style={{fontSize:13,color:"rgba(255,255,255,0.6)"}}>{commessa.cliente} {commessa.cognome||""}</span>
        {/* KPI rapidi */}
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {[
            {l:"Vani",v:vani.length,c:"rgba(255,255,255,0.5)"},
            {l:"Totale",v:`€${totP.toLocaleString("it-IT")}`,c:"#fff"},
            {l:`+IVA ${ivaP}%`,v:`€${totIva.toLocaleString("it-IT")}`,c:"rgba(255,255,255,0.6)"},
            {l:"Margine",v:`${margine}%`,c:margine>=30?TEAL:margine>=20?AMBER:RED},
          ].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 12px",borderRadius:7,background:"rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>{k.l}</div>
              <div style={{fontSize:13,fontWeight:800,color:k.c,fontFamily:FM}}>{k.v}</div>
            </div>
          ))}
          <button onClick={save} style={{marginLeft:8,padding:"7px 16px",borderRadius:8,border:"none",background:saved?TEAL:"rgba(255,255,255,0.12)",color:saved?"#fff":"rgba(255,255,255,0.7)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:FF,transition:"all .2s"}}>
            {saved?"✓ Salvato":"Salva"}
          </button>
          <button onClick={onClose} style={{padding:"7px 12px",borderRadius:8,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",color:"rgba(255,255,255,0.5)",fontSize:12,cursor:"pointer"}}>✕</button>
        </div>
      </div>

      {/* ── 3 COLONNE ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",gap:1,background:"#D8DBE0"}}>

        {/* COL 1 — LISTA VANI (240px) */}
        <div style={{width:240,flexShrink:0,background:"#fff",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Header col1 */}
          <div style={{padding:"10px 12px 8px",borderBottom:`1px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:800,color:T.text,letterSpacing:0.3}}>VANI ({vani.length})</span>
              <div style={{display:"flex",gap:4}}>
                <button onClick={addVano} style={{padding:"3px 8px",borderRadius:6,border:"none",background:TEAL,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>+</button>
                <button onClick={dupVano} style={{padding:"3px 8px",borderRadius:6,border:`1px solid ${T.bdr}`,background:"transparent",color:T.sub,fontSize:10,cursor:"pointer"}} title="Duplica">⧉</button>
              </div>
            </div>
            {/* Totale mini */}
            <div style={{background:DARK,borderRadius:8,padding:"8px 10px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                {[
                  {l:"Vendita",v:`€${Math.round(totP).toLocaleString("it-IT")}`,c:"#fff"},
                  {l:"Margine",v:`${margine}%`,c:margine>=30?TEAL:margine>=20?AMBER:RED},
                  {l:`IVA ${ivaP}%`,v:`€${Math.round(totIva).toLocaleString("it-IT")}`,c:"rgba(255,255,255,0.5)"},
                  {l:"Costo",v:`€${Math.round(totC).toLocaleString("it-IT")}`,c:"rgba(255,255,255,0.4)"},
                ].map((k,i)=>(
                  <div key={i}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.35)"}}>{k.l}</div>
                    <div style={{fontSize:12,fontWeight:800,color:k.c,fontFamily:FM}}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Lista */}
          <div style={{flex:1,overflowY:"auto"}}>
            {vani.map((v,i)=>{
              const p=pv(v)*(v.pezzi||1);
              const active=i===selIdx;
              const hasError=!v.misure?.lCentro||!v.misure?.hCentro;
              return (
                <div key={v.id} onClick={()=>setSelIdx(i)} style={{padding:"9px 12px",borderBottom:`1px solid ${T.bdr}`,cursor:"pointer",background:active?TEAL+"0F":"transparent",borderLeft:`3px solid ${active?TEAL:"transparent"}`,transition:"all .1s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <span style={{fontSize:12,fontWeight:active?700:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{v.nome||`Vano ${i+1}`}</span>
                        {hasError&&<div style={{width:6,height:6,borderRadius:"50%",background:AMBER,flexShrink:0}} title="Misure mancanti"/>}
                      </div>
                      <div style={{fontSize:10,color:T.sub,marginTop:1}}>
                        {v.misure?.lCentro||"?"} × {v.misure?.hCentro||"?"} mm · {v.tipo||"—"}
                        {(v.pezzi||1)>1&&<> · <b>×{v.pezzi}</b></>}
                      </div>
                      {v.sistema&&<div style={{fontSize:9,color:TEAL,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{v.sistema}</div>}
                    </div>
                    <div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:FM,flexShrink:0}}>{p>0?`€${Math.round(p).toLocaleString("it-IT")}`:"—"}</div>
                  </div>
                </div>
              );
            })}
            {/* Aggiungi vuoto */}
            <div onClick={addVano} style={{padding:"10px 12px",cursor:"pointer",color:T.sub,fontSize:12,display:"flex",alignItems:"center",gap:6,borderTop:`1px solid ${T.bdr}`}}>
              <span style={{fontSize:16,fontWeight:300}}>+</span> Aggiungi vano
            </div>
          </div>
        </div>

        {/* COL 2 — CONFIGURATORE (380px) */}
        <div style={{width:380,flexShrink:0,background:"#fff",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Header vano */}
          <div style={{padding:"10px 14px 0",borderBottom:`1px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
              <input value={vano.nome||""} onChange={e=>upd("nome",e.target.value)} style={{flex:1,border:"none",fontSize:14,fontWeight:700,color:T.text,outline:"none",fontFamily:FF,padding:"0 0 2px"}} placeholder="Nome vano..."/>
              <div style={{display:"flex",gap:4}}>
                <button onClick={moveUp} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${T.bdr}`,background:"transparent",fontSize:11,color:T.sub,cursor:"pointer"}} title="Su">↑</button>
                <button onClick={moveDown} style={{padding:"2px 6px",borderRadius:5,border:`1px solid ${T.bdr}`,background:"transparent",fontSize:11,color:T.sub,cursor:"pointer"}} title="Giù">↓</button>
                <button onClick={delVano} style={{padding:"2px 6px",borderRadius:5,border:`1px solid #DC444430`,background:"transparent",fontSize:11,color:RED,cursor:"pointer"}} title="Elimina">✕</button>
              </div>
            </div>
            {/* Tab navigazione */}
            <div style={{display:"flex",gap:0}}>
              {[["base","Base"],["tecnica","Tecnica"],["accessori","Accessori"],["note","Note"]].map(([id,l])=>(
                <div key={id} onClick={()=>setTab2(id as any)} style={{flex:1,textAlign:"center",padding:"6px 0",fontSize:11,fontWeight:tab2===id?700:400,color:tab2===id?TEAL:T.sub,borderBottom:`2px solid ${tab2===id?TEAL:"transparent"}`,cursor:"pointer",transition:"all .1s"}}>{l}</div>
              ))}
            </div>
          </div>
          {/* Body configuratore */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 14px"}}>
            {tab2==="base"&&(
              <>
                <div style={{display:"flex",gap:8,flexWrap:"wrap" as any}}>
                  <F l="Tipologia" half={false}>
                    <select value={vano.tipo||""} onChange={e=>upd("tipo",e.target.value)} style={SEL}>
                      <option value="">— Seleziona —</option>
                      {["Finestra","Portafinestra","Porta","Scorrevole","Alzante Scorrevole","Vasistas","Fisso","Portone","Oblò","Velux"].map(o=><option key={o}>{o}</option>)}
                    </select>
                  </F>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <F l="Larghezza luce (mm)" half><input value={vano.misure?.lCentro||""} onChange={e=>updM("lCentro",parseInt(e.target.value)||0)} type="number" placeholder="1200" style={{...INP,fontSize:16,fontWeight:700}}/></F>
                  <F l="Altezza luce (mm)" half><input value={vano.misure?.hCentro||""} onChange={e=>updM("hCentro",parseInt(e.target.value)||0)} type="number" placeholder="2100" style={{...INP,fontSize:16,fontWeight:700}}/></F>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <F l="Pezzi" half><input value={vano.pezzi||1} onChange={e=>upd("pezzi",Math.max(1,parseInt(e.target.value)||1))} type="number" min={1} style={INP}/></F>
                  <F l="Stanza / Piano" half><input value={(vano.stanza||"")+(vano.piano?" · "+vano.piano:"")} onChange={e=>upd("stanza",e.target.value)} placeholder="Es. Cucina P1" style={INP}/></F>
                </div>
                <F l="Tipo apertura">
                  <div style={{display:"flex",gap:5,flexWrap:"wrap" as any}}>
                    {APERTURE.map(a=>(
                      <div key={a.id} onClick={()=>upd("apertura",a.id)} style={{padding:"4px 10px",borderRadius:7,border:`1.5px solid ${vano.apertura===a.id?TEAL:T.bdr}`,background:vano.apertura===a.id?TEAL+"12":"transparent",fontSize:11,fontWeight:600,color:vano.apertura===a.id?TEAL:T.sub,cursor:"pointer",transition:"all .1s"}}>{a.l}</div>
                    ))}
                  </div>
                </F>
                <F l="Materiale">
                  <div style={{display:"flex",gap:5,flexWrap:"wrap" as any}}>
                    {MATERIALI.map(m=>(
                      <div key={m} onClick={()=>upd("materiale",m)} style={{padding:"4px 10px",borderRadius:7,border:`1.5px solid ${vano.materiale===m?BLUE:T.bdr}`,background:vano.materiale===m?BLUE+"12":"transparent",fontSize:11,fontWeight:600,color:vano.materiale===m?BLUE:T.sub,cursor:"pointer"}}>{m}</div>
                    ))}
                  </div>
                </F>
                <F l="Sistema profilo">
                  <select value={vano.sistema||""} onChange={e=>upd("sistema",e.target.value)} style={SEL}>
                    <option value="">— Seleziona sistema —</option>
                    {(sistemi.length>0?sistemi:["Schüco AWS 70","Schüco AWS 90 SI","Reynaers CS 68","Reynaers CS 86","Metra B70","Metra B70 HI","Sapa 4150","Technal Soleal","Strugal W62HI","Veka Softline 82","Veka Artline","Rehau Inoutic"]).map((s:string)=><option key={s}>{s}</option>)}
                  </select>
                </F>
                <div style={{display:"flex",gap:8}}>
                  <F l="Vetrocamera" half>
                    <select value={vano.vetro||""} onChange={e=>upd("vetro",e.target.value)} style={SEL}>
                      <option value="">— Vetro —</option>
                      {(vetri.length>0?vetri:VETRI_DEFAULT).map((v:string)=><option key={v}>{v}</option>)}
                    </select>
                  </F>
                  <F l="Colore" half>
                    <select value={vano.coloreInt||vano.colore||""} onChange={e=>upd("coloreInt",e.target.value)} style={SEL}>
                      <option value="">— Colore —</option>
                      {COLORI_DEFAULT.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </F>
                </div>
                {/* Prezzo override */}
                <F l="Prezzo unitario (override)">
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input value={vano.prevPrezzoOverride??""} onChange={e=>upd("prevPrezzoOverride",e.target.value===""?null:parseFloat(e.target.value))} type="number" placeholder={`Auto: €${pv(vano).toLocaleString("it-IT")}`} style={{...INP,flex:1}}/>
                    {vano.prevPrezzoOverride!=null&&<button onClick={()=>upd("prevPrezzoOverride",null)} style={{padding:"7px 10px",borderRadius:7,border:`1px solid ${T.bdr}`,background:"transparent",fontSize:10,cursor:"pointer",color:T.sub}}>Auto</button>}
                  </div>
                </F>
              </>
            )}
            {tab2==="tecnica"&&(
              <>
                <F l="Controtelaio">
                  <select value={vano.controtelaio||""} onChange={e=>upd("controtelaio",e.target.value)} style={SEL}>
                    <option value="">Nessuno</option>
                    {["Controtelaio acciaio","Controtelaio alluminio","Controtelaio legno","Cassonetto PVC","Cassonetto alluminio"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </F>
                <div style={{display:"flex",gap:8}}>
                  <F l="Davanzale (mm)" half><input value={vano.misure?.davProf||""} onChange={e=>updM("davProf",e.target.value)} type="number" placeholder="0" style={INP}/></F>
                  <F l="Soglia (mm)" half><input value={vano.misure?.soglia||""} onChange={e=>updM("soglia",e.target.value)} type="number" placeholder="0" style={INP}/></F>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <F l="Imbotte SX (mm)" half><input value={vano.misure?.imbotteSx||""} onChange={e=>updM("imbotteSx",e.target.value)} type="number" placeholder="0" style={INP}/></F>
                  <F l="Imbotte DX (mm)" half><input value={vano.misure?.imbotteDx||""} onChange={e=>updM("imbotteDx",e.target.value)} type="number" placeholder="0" style={INP}/></F>
                </div>
                <F l="Rivestimento spalle">
                  <select value={vano.rivestimento||""} onChange={e=>upd("rivestimento",e.target.value)} style={SEL}>
                    <option value="">Nessuno</option>
                    {["Intonaco","Alluminio verniciato","PVC","Lamierino"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </F>
                <F l="Tipo installazione">
                  <div style={{display:"flex",gap:5,flexWrap:"wrap" as any}}>
                    {["Nuovo","Ristrutturazione su CT","Ristrutturazione senza CT","Filo muro esterno","Filo muro interno"].map(t=>(
                      <div key={t} onClick={()=>upd("installazione",t)} style={{padding:"4px 10px",borderRadius:7,border:`1.5px solid ${vano.installazione===t?BLUE:T.bdr}`,background:vano.installazione===t?BLUE+"12":"transparent",fontSize:10,fontWeight:600,color:vano.installazione===t?BLUE:T.sub,cursor:"pointer"}}>{t}</div>
                    ))}
                  </div>
                </F>
                <F l="Maniglia">
                  <select value={vano.maniglia||""} onChange={e=>upd("maniglia",e.target.value)} style={SEL}>
                    <option value="">Standard inclusa</option>
                    {["Maniglia premium","Maniglia sicurezza","Maniglia minimalista","Maniglia pomo","Maniglione antipanico"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </F>
                <F l="Marcatura CE">
                  <div style={{padding:"10px 12px",borderRadius:8,background:"#F0FDF4",border:"1px solid #BBF7D0"}}>
                    <div style={{fontSize:11,fontWeight:700,color:TEAL,marginBottom:4}}>Dati Dichiarazione di Prestazione</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[["Uw calc.",uw>0?`${uw} W/m²K`:"—"],["Classe CE",uw>0?uwC.label:"—"],["Norma","EN 14351-1"],["Zona clim.",az.zonaClimatica||"—"]].map(([l,v],i)=>(
                        <div key={i}><div style={{fontSize:9,color:"#666"}}>{l}</div><div style={{fontSize:11,fontWeight:600,color:TEAL}}>{v}</div></div>
                      ))}
                    </div>
                  </div>
                </F>
              </>
            )}
            {tab2==="accessori"&&(
              <>
                <div style={{display:"flex",flexDirection:"column" as any,gap:8}}>
                  {ACCESSORI_LIST.map(({id,l})=>{
                    const acc=vano.accessori||{};
                    const on=acc[id]?.attivo;
                    return (
                      <div key={id} style={{border:`1.5px solid ${on?TEAL:T.bdr}`,borderRadius:10,overflow:"hidden",transition:"border-color .1s"}}>
                        <div onClick={()=>updA(id,{...(acc[id]||{}),attivo:!on})} style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:on?TEAL+"08":"transparent"}}>
                          <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${on?TEAL:T.bdr}`,background:on?TEAL:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            {on&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span style={{fontSize:13,fontWeight:on?600:400,color:T.text}}>{l}</span>
                          {on&&<span style={{marginLeft:"auto",fontSize:10,color:TEAL,fontWeight:600}}>Incluso</span>}
                        </div>
                        {on&&id==="tapparella"&&(
                          <div style={{padding:"0 12px 10px",display:"flex",gap:8}}>
                            <div style={{flex:1}}>
                              <div style={{fontSize:9,color:T.sub,marginBottom:3}}>Tipo</div>
                              <select value={acc[id]?.tipo||""} onChange={e=>updA(id,{...acc[id],tipo:e.target.value})} style={{...SEL,fontSize:11}}>
                                <option value="">Standard</option>
                                {["Avvolgibile PVC","Avvolgibile alluminio 55mm","Avvolgibile alluminio 80mm","Avvolgibile fonoassorbente"].map(o=><option key={o}>{o}</option>)}
                              </select>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:9,color:T.sub,marginBottom:3}}>Azionamento</div>
                              <select value={acc[id]?.azionamento||""} onChange={e=>updA(id,{...acc[id],azionamento:e.target.value})} style={{...SEL,fontSize:11}}>
                                <option value="">Manuale</option>
                                {["Motorizzato","Cinghia","Nastro"].map(o=><option key={o}>{o}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                        {on&&id==="zanzariera"&&(
                          <div style={{padding:"0 12px 10px"}}>
                            <div style={{fontSize:9,color:T.sub,marginBottom:3}}>Tipo zanzariera</div>
                            <select value={acc[id]?.tipo||""} onChange={e=>updA(id,{...acc[id],tipo:e.target.value})} style={{...SEL,fontSize:11}}>
                              {["A rullo","Plissé","Scorrevole","Telaio fisso","Invisibile"].map(o=><option key={o}>{o}</option>)}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {tab2==="note"&&(
              <>
                <F l="Note tecniche">
                  <textarea value={vano.noteTecniche||""} onChange={e=>upd("noteTecniche",e.target.value)} rows={4} placeholder="Specificazioni tecniche, vincoli di posa, materiali speciali..." style={{...INP,resize:"none" as any,lineHeight:1.5}}/>
                </F>
                <F l="Note montaggio">
                  <textarea value={vano.noteMontaggio||""} onChange={e=>upd("noteMontaggio",e.target.value)} rows={3} placeholder="Accesso, orari, referente in cantiere..." style={{...INP,resize:"none" as any,lineHeight:1.5}}/>
                </F>
                <F l="Note cliente (visibili in preventivo)">
                  <textarea value={vano.note||""} onChange={e=>upd("note",e.target.value)} rows={3} placeholder="Informazioni da mostrare al cliente nel preventivo..." style={{...INP,resize:"none" as any,lineHeight:1.5}}/>
                </F>
              </>
            )}
          </div>
        </div>

        {/* COL 3 — PREVIEW + TECNICA */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          {/* Preview SVG */}
          <div style={{background:"#fff",borderBottom:`1px solid ${T.bdr}`,padding:"14px 20px",display:"flex",gap:20,alignItems:"flex-start",flexShrink:0}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4}}>Anteprima</div>
              <div style={{background:"#F8FAFC",borderRadius:12,padding:12,border:`1px solid ${T.bdr}`}}>
                <DisegnoTecnico
                  vanoNome={vano.nome || "Vano"}
                  realW={vano.misure?.lCentro || 1200}
                  realH={vano.misure?.hCentro || 2100}
                  vanoDisegno={vano.disegno}
                  sistemiDB={sistemiDB || []}
                  onUpdate={(d) => updateVanoField(vano.id, "disegno", d)}
                  T={T}
                />
              </div>
              <div style={{fontSize:10,color:T.sub,textAlign:"center" as any}}>{vano.apertura||"fisso"} · {vano.materiale||"—"}</div>
            </div>
            {/* Dati tecnici rapidi */}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:10}}>Dati tecnici</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
                {[
                  {l:"Superfici netta",v:mq>0?`${mq.toFixed(2)} m²`:"—"},
                  {l:"Pezzi",v:vano.pezzi||1},
                  {l:"Larghezza",v:vano.misure?.lCentro?`${vano.misure.lCentro} mm`:"—"},
                  {l:"Altezza",v:vano.misure?.hCentro?`${vano.misure.hCentro} mm`:"—"},
                  {l:"Sistema",v:vano.sistema||"—"},
                  {l:"Vetro",v:vano.vetro||"—"},
                ].map((d,i)=>(
                  <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"7px 10px"}}>
                    <div style={{fontSize:9,color:T.sub}}>{d.l}</div>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{d.v}</div>
                  </div>
                ))}
              </div>
              {/* U-value */}
              {uw>0&&(
                <div style={{padding:"10px 14px",borderRadius:10,background:uwC.color+"10",border:`1.5px solid ${uwC.color}25`}}>
                  <div style={{fontSize:9,color:T.sub,marginBottom:2}}>Trasmittanza termica Uw — EN 14351 — CAM 2026</div>
                  <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                    <span style={{fontSize:22,fontWeight:900,color:uwC.color,fontFamily:FM}}>{uw}</span>
                    <span style={{fontSize:11,color:T.sub}}>W/m²K</span>
                    <span style={{marginLeft:"auto",fontSize:11,fontWeight:700,color:uwC.color,background:uwC.color+"15",padding:"2px 8px",borderRadius:6}}>{uwC.label}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Riepilogo economico vano */}
          <div style={{padding:"14px 20px",borderBottom:`1px solid ${T.bdr}`,background:"#fff",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4}}>Riepilogo economico</span>
              <button onClick={()=>setShowBreakdown(!showBreakdown)} style={{fontSize:10,color:T.sub,background:"transparent",border:"none",cursor:"pointer"}}>{showBreakdown?"▲ Nascondi":"▼ Dettaglio"}</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {[
                {l:"Prezzo unitario",v:`€${Math.round(pv(vano)).toLocaleString("it-IT")}`,c:T.text},
                {l:`×${vano.pezzi||1} pezzi`,v:`€${Math.round(pv(vano)*(vano.pezzi||1)).toLocaleString("it-IT")}`,c:T.text},
                {l:"Costo stimato",v:`€${Math.round(cv(vano)*(vano.pezzi||1)).toLocaleString("it-IT")}`,c:T.sub},
                {l:"Margine vano",v:`${Math.round((1-cv(vano)/pv(vano))*100)||0}%`,c:margine>=30?TEAL:margine>=20?AMBER:RED},
              ].map((k,i)=>(
                <div key={i} style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px"}}>
                  <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
                  <div style={{fontSize:14,fontWeight:800,color:k.c,fontFamily:FM}}>{k.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista tutti vani */}
          <div style={{flex:1,overflowY:"auto",padding:"14px 20px"}}>
            <div style={{fontSize:10,fontWeight:600,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4,marginBottom:10}}>Tutti i vani — Commessa {commessa.code}</div>
            <div style={{background:"#fff",borderRadius:12,border:`1px solid ${T.bdr}`,overflow:"hidden"}}>
              {/* Header tabella */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 120px 60px 60px 80px",gap:0,padding:"7px 14px",borderBottom:`1px solid ${T.bdr}`,background:"#F8FAFC"}}>
                {["Vano","Sistema","Misure","Q","Prezzo"].map((h,i)=><div key={i} style={{fontSize:10,fontWeight:700,color:T.sub,textAlign:i>1?"center":"left" as any}}>{h}</div>)}
              </div>
              {vani.map((v,i)=>(
                <div key={v.id} onClick={()=>setSelIdx(i)} style={{display:"grid",gridTemplateColumns:"1fr 120px 60px 60px 80px",gap:0,padding:"9px 14px",borderBottom:i<vani.length-1?`1px solid ${T.bdr}`:"none",cursor:"pointer",background:i===selIdx?TEAL+"08":"transparent",transition:"background .1s"}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:T.text}}>{v.nome||`Vano ${i+1}`}</div>
                    <div style={{fontSize:10,color:T.sub}}>{v.tipo||"—"}</div>
                  </div>
                  <div style={{fontSize:10,color:T.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any,paddingRight:8}}>{v.sistema||"—"}</div>
                  <div style={{fontSize:11,color:T.text,textAlign:"center" as any,fontFamily:FM}}>{v.misure?.lCentro&&v.misure?.hCentro?`${v.misure.lCentro}×${v.misure.hCentro}`:"—"}</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text,textAlign:"center" as any,fontFamily:FM}}>{v.pezzi||1}</div>
                  <div style={{fontSize:12,fontWeight:800,color:T.text,textAlign:"right" as any,fontFamily:FM}}>€{Math.round(pv(v)*(v.pezzi||1)).toLocaleString("it-IT")}</div>
                </div>
              ))}
              {/* Footer totale */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 120px 60px 60px 80px",padding:"10px 14px",background:DARK}}>
                <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.7)",gridColumn:"1/5"}}>Totale IVA esclusa</div>
                <div style={{fontSize:14,fontWeight:900,color:"#fff",textAlign:"right" as any,fontFamily:FM}}>€{Math.round(totP).toLocaleString("it-IT")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
