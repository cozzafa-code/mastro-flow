"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — ConfiguratoreCad v5.0 — GRIGLIA SEMPLICE
// Ogni cella è autonoma. Niente sub-struttura.
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useCallback } from "react";
import { RendererSVG } from "./renderer_svg";
import { calcolaGriglia, addMontante, addTraverso, moveMontante, moveTraverso, suggerisciPosMontante, suggerisciPosTraverso } from "./motore_geometrico";
import { PROFILI_DEMO, PROFILO_DEFAULT } from "../lib/engine/profili";
import { calcolaLuceCella, calcolaUw, calcolaPesi } from "../lib/engine/calcoli";
import { generaDistinta } from "../lib/engine/distinta";
import { verificaConfigurazione, haErrori } from "../lib/engine/regole";

const VETRI = [
  { id:"std",   label:"Vetro standard 4-16-4",   ugValore:1.1, pesoMq:20, costoMq:55  },
  { id:"lam",   label:"Stratificato 33.1",        ugValore:1.1, pesoMq:18, costoMq:95  },
  { id:"rifl",  label:"Riflettente selettivo",    ugValore:1.0, pesoMq:22, costoMq:130 },
  { id:"tri",   label:"Triplo basso emissivo",    ugValore:0.5, pesoMq:30, costoMq:195 },
  { id:"cam",   label:"Camera 4-12-4",            ugValore:0.9, pesoMq:20, costoMq:75  },
  { id:"anti",  label:"Antisfondamento P2A",      ugValore:1.0, pesoMq:38, costoMq:210 },
];

const TIPI = [
  { id:"fisso",          label:"Fisso"          },
  { id:"anta_battente",  label:"Anta battente"  },
  { id:"anta_ribalta",   label:"Anta-ribalta"   },
  { id:"wasistas",       label:"Wasistas"       },
  { id:"porta",          label:"Porta"          },
  { id:"scorrevole",     label:"Scorrevole"     },
  { id:"pannello_cieco", label:"Pannello cieco" },
];

const PRESET = [
  { id:"fisso",       label:"Fisso",        icon:"▣" },
  { id:"1_anta_sx",   label:"1 Anta SX",    icon:"◧" },
  { id:"1_anta_dx",   label:"1 Anta DX",    icon:"◨" },
  { id:"2_ante",      label:"2 Ante",       icon:"◫" },
  { id:"3_ante",      label:"3 Ante",       icon:"⊞" },
  { id:"porta_sx",    label:"Porta SX",     icon:"🚪" },
  { id:"scorrevole_2",label:"Scorrevole 2", icon:"⇔" },
];

function cerniereAuto(h:number, kg:number) { return h>1800||kg>50?3:2; }

const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const RED="#DC4444"; const BDR="#E5E7EB"; const SUB="#6B7280";
const FF="Inter,system-ui,sans-serif"; const FM="JetBrains Mono,monospace";
const INP:any={padding:"5px 8px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:12,fontWeight:600,fontFamily:FF,outline:"none",boxSizing:"border-box",width:"100%"};
const ROW:any={display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #F3F4F6"};
const LBL:any={fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6};
const FER={maniglia:true,maniglione:false,nCerniere:2,cerniereTipo:"standard",chiusuraMultipunto:false,costoFerramenta:0};

function buildInfisso(L=1500,H=2100,profilo=PROFILO_DEFAULT) {
  const sp=profilo.spessoreTelaio;
  const montanti=[{id:"m1",xMm:Math.round(L/2),spessoreMm:sp}];
  const griglia=calcolaGriglia(L,H,montanti,[],{spessoreTelaio:sp});
  griglia.celle.forEach((c:any)=>{
    c.vetro=VETRI[0]; c.ferramenta={...FER};
    c.subMontanti=[]; c.subTraversi=[]; c.subCelle=[];
  });
  return {id:`inf_${Date.now()}`,vanoId:"",larghezzaVano:L,altezzaVano:H,spessoreMuro:150,
    profilo,montanti,traversi:[],griglia,_cellaSel:null,_mode:"industrial",
    sistema:{spessoreTelaio:sp,tipo:profilo.materiale,serieNome:profilo.nome,ufProfilo:profilo.Uf,
      costoMlTelaio:profilo.costoMlTelaio,costoMlAnte:profilo.costoMlAnta,coloreEsterno:"#9CA3AF",coloreInterno:"#F2F1EC"}
  };
}

function ricalcola(inf:any,prevL?:number,prevH?:number) {
  const sp=inf.profilo.spessoreTelaio;
  const L=inf.larghezzaVano, H=inf.altezzaVano;
  let {montanti,traversi}=inf;
  if(prevL&&prevL!==L) montanti=montanti.map((m:any)=>({...m,xMm:Math.round(Math.max(sp*2,Math.min(L-sp*2,m.xMm*L/prevL)))}));
  if(prevH&&prevH!==H) traversi=traversi.map((t:any)=>({...t,yMm:Math.round(Math.max(sp*2,Math.min(H-sp*2,t.yMm*H/prevH)))}));
  const celle=inf.griglia?.celle||[];
  const griglia=calcolaGriglia(L,H,montanti,traversi,{spessoreTelaio:sp},celle);
  // Preserva configurazione celle esistenti
  griglia.celle=griglia.celle.map((c:any)=>{
    const old=celle.find((e:any)=>e.id===c.id);
    if(!old) return {...c,vetro:VETRI[0],ferramenta:{...FER},subMontanti:[],subTraversi:[],subCelle:[]};
    return {...c,tipo:old.tipo||"fisso",verso:old.verso||"sx",vetro:old.vetro||VETRI[0],ferramenta:old.ferramenta||{...FER},subMontanti:[],subTraversi:[],subCelle:[]};
  });
  return {...inf,montanti,traversi,griglia,sistema:{...inf.sistema,spessoreTelaio:sp}};
}

function applicaPresetUI(L:number,H:number,preset:string,sp:number) {
  const montanti:any[]=[]; const cfg:any={};
  if(preset==="fisso"){cfg["0-0"]={tipo:"fisso"};}
  else if(preset==="1_anta_sx"){cfg["0-0"]={tipo:"anta_battente",verso:"sx"};}
  else if(preset==="1_anta_dx"){cfg["0-0"]={tipo:"anta_battente",verso:"dx"};}
  else if(preset==="porta_sx"){cfg["0-0"]={tipo:"porta",verso:"sx"};}
  else if(preset==="2_ante"){
    montanti.push({id:"mp1",xMm:Math.round(L/2),spessoreMm:sp});
    cfg["0-0"]={tipo:"anta_battente",verso:"dx"};
    cfg["1-0"]={tipo:"anta_battente",verso:"sx"};
  } else if(preset==="3_ante"){
    montanti.push({id:"mp1",xMm:Math.round(L/3),spessoreMm:sp});
    montanti.push({id:"mp2",xMm:Math.round(L*2/3),spessoreMm:sp});
    cfg["0-0"]={tipo:"anta_battente",verso:"dx"};
    cfg["1-0"]={tipo:"fisso"};
    cfg["2-0"]={tipo:"anta_battente",verso:"sx"};
  } else if(preset==="scorrevole_2"){
    montanti.push({id:"mp1",xMm:Math.round(L/2),spessoreMm:sp});
    cfg["0-0"]={tipo:"scorrevole"};cfg["1-0"]={tipo:"scorrevole"};
  }
  return {montanti,cfg};
}

export default function ConfiguratoreCad({realW,realH,vanoNome,onUpdate,onClose}:any) {
  const [inf,setInf]=useState(()=>buildInfisso(parseInt(realW)||1500,parseInt(realH)||2100));
  const [dragging,setDragging]=useState<any>(null);
  const wasDrag=useRef(false);
  const [tabRight,setTabRight]=useState("risultati");
  const svgRef=useRef<SVGSVGElement>(null);

  const upd=(partial:any)=>setInf((p:any)=>{
    const pL=p.larghezzaVano,pH=p.altezzaVano;
    return ricalcola({...p,...partial},pL,pH);
  });

  const updCella=(id:string,partial:any)=>setInf((p:any)=>({
    ...p,griglia:{...p.griglia,
      celle:p.griglia.celle.map((c:any)=>c.id===id?{...c,...partial}:c)
    }
  }));

  // Calcoli
  const luci=useMemo(()=>{
    const m:any={};
    inf.griglia.celle.forEach((c:any)=>{m[c.id]=calcolaLuceCella(c.larghezzaNetta,c.altezzaNetta,inf.profilo,c.tipo);});
    return m;
  },[inf.griglia.celle,inf.profilo]);

  const uwCalc=useMemo(()=>calcolaUw(inf.larghezzaVano,inf.altezzaVano,
    inf.griglia.celle.map((c:any)=>({areaMq:luci[c.id]?.vetroMq||c.areaMq,vetroUg:c.vetro?.ugValore||1.1})),
    inf.profilo),[inf,luci]);

  const mlTelaio=useMemo(()=>(inf.larghezzaVano*2+inf.altezzaVano*2)/1000,[inf]);
  const mlAnte=useMemo(()=>inf.griglia.celle.filter((c:any)=>!["fisso","pannello_cieco"].includes(c.tipo))
    .reduce((a:number,c:any)=>a+(c.larghezzaNetta*2+c.altezzaNetta*2)/1000,0),[inf.griglia.celle]);

  const pesi=useMemo(()=>calcolaPesi(mlTelaio,mlAnte,
    inf.griglia.celle.map((c:any)=>({areaMq:luci[c.id]?.vetroMq||c.areaMq,pesoMqVetro:c.vetro?.pesoMq||20,tipo:c.tipo})),
    inf.profilo),[mlTelaio,mlAnte,inf.griglia.celle,luci,inf.profilo]);

  const distinta=useMemo(()=>generaDistinta(inf.larghezzaVano,inf.altezzaVano,
    inf.montanti.map((m:any)=>m.xMm),inf.traversi.map((t:any)=>t.yMm),
    inf.griglia.celle.map((c:any)=>({id:c.id,tipo:c.tipo,larghezzaNetta:c.larghezzaNetta,altezzaNetta:c.altezzaNetta,areaMq:c.areaMq,
      vetroTipo:c.vetro?.label,vetroUg:c.vetro?.ugValore,vetroMq:luci[c.id]?.vetroMq,
      vetroPesoMq:c.vetro?.pesoMq,vetroCostoMq:c.vetro?.costoMq,ferramenta:c.ferramenta||FER})),
    inf.profilo),[inf,luci]);

  const violazioni=useMemo(()=>verificaConfigurazione(
    inf.griglia.celle.map((c:any)=>({id:c.id,tipo:c.tipo,larghezzaNetta:c.larghezzaNetta,altezzaNetta:c.altezzaNetta,
      pesoAntaKg:pesi.pesoAntaMax,vetroL:luci[c.id]?.vetroL||0,vetroH:luci[c.id]?.vetroH||0})),
    inf.profilo),[inf.griglia.celle,inf.profilo,pesi,luci]);

  const handleMouseMove=useCallback((e:any)=>{
    if(!dragging||!svgRef.current)return;
    wasDrag.current=true;
    const CTM=svgRef.current.getScreenCTM()!;
    const pt={x:(e.clientX-CTM.e)/CTM.a,y:(e.clientY-CTM.f)/CTM.d};
    const sp=inf.profilo.spessoreTelaio;
    setInf((p:any)=>{
      if(dragging.type==="m"){const montanti=moveMontante(p.montanti,dragging.id,pt.x,p.larghezzaVano,{spessoreTelaio:sp});return ricalcola({...p,montanti});}
      if(dragging.type==="t"){const traversi=moveTraverso(p.traversi,dragging.id,pt.y,p.altezzaVano,{spessoreTelaio:sp});return ricalcola({...p,traversi});}
      return p;
    });
  },[dragging,inf.profilo]);

  const handleMouseUp=useCallback(()=>{setDragging(null);setTimeout(()=>{wasDrag.current=false;},50);},[]);
  const handleCellaClick=useCallback((id:string)=>{
    if(wasDrag.current)return;
    setInf((p:any)=>({...p,_cellaSel:p._cellaSel===id?null:id}));
  },[]);

  const cellaSel=inf.griglia.celle.find((c:any)=>c.id===inf._cellaSel);
  const isMkt=inf._mode==="marketing";
  const uwC=uwCalc.uw<=1.0?TEAL:uwCalc.uw<=1.4?AMBER:RED;
  const nErr=violazioni.filter((v:any)=>v.severita==="errore").length;
  const nWarn=violazioni.filter((v:any)=>v.severita==="warning").length;

  return (
    <div style={{width:"100%",height:"100%",display:"flex",overflow:"hidden",fontFamily:FF}}>

      {/* ── SIDEBAR ── */}
      <div style={{width:250,flexShrink:0,background:"#fff",borderRight:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vanoNome||"CAD"}</div>
          <div style={{display:"flex",background:"#F3F4F6",borderRadius:8,padding:2}}>
            {["industrial","marketing"].map(m=>(
              <button key={m} onClick={()=>upd({_mode:m})} style={{flex:1,padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,textTransform:"uppercase",background:inf._mode===m?(m==="marketing"?AMBER:DARK):"transparent",color:inf._mode===m?"#fff":SUB}}>{m==="industrial"?"TECNICO":"MKT"}</button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:12}}>

          {/* Dimensioni */}
          <div>
            <div style={LBL}>Dimensioni vano</div>
            <div style={{display:"flex",gap:6}}>
              {[["L mm",inf.larghezzaVano,(v:number)=>upd({larghezzaVano:v})],["H mm",inf.altezzaVano,(v:number)=>upd({altezzaVano:v})]].map(([l,val,fn]:any)=>(
                <div key={l} style={{flex:1}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:2}}>{l}</div>
                  <input type="number" defaultValue={val} key={val} style={INP}
                    onBlur={e=>{const v=parseInt(e.target.value);if(v>200)fn(v);}}
                    onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt((e.target as HTMLInputElement).value);if(v>200)fn(v);}}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Profilo */}
          <div>
            <div style={LBL}>Sistema profilo</div>
            {PROFILI_DEMO.map((p:any)=>(
              <button key={p.id} onClick={()=>upd({profilo:p})} style={{display:"block",width:"100%",padding:"6px 10px",marginBottom:3,border:`1.5px solid ${inf.profilo.id===p.id?AMBER:BDR}`,borderRadius:7,background:inf.profilo.id===p.id?AMBER+"18":"#fff",fontSize:11,fontWeight:inf.profilo.id===p.id?700:400,color:inf.profilo.id===p.id?AMBER:DARK,cursor:"pointer",textAlign:"left" as any}}>
                <div>{p.nome}</div>
                <div style={{fontSize:9,color:SUB,fontWeight:400}}>Uf {p.Uf} · tel {p.spessoreTelaio}mm · anta {p.spessoreAnta}mm</div>
              </button>
            ))}
          </div>

          {/* Preset */}
          <div>
            <div style={LBL}>Preset apertura</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {PRESET.map(p=>(
                <button key={p.id} onClick={()=>{
                  const sp=inf.profilo.spessoreTelaio;
                  const {montanti,cfg}=applicaPresetUI(inf.larghezzaVano,inf.altezzaVano,p.id,sp);
                  setInf((prev:any)=>{
                    const griglia=calcolaGriglia(prev.larghezzaVano,prev.altezzaVano,montanti,[],{spessoreTelaio:sp});
                    griglia.celle.forEach((c:any)=>{
                      const c2=cfg[c.id]||{};
                      c.vetro=VETRI[0];c.ferramenta={...FER};c.subMontanti=[];c.subTraversi=[];c.subCelle=[];
                      Object.assign(c,c2);
                    });
                    return {...prev,montanti,traversi:[],griglia,_cellaSel:null,sistema:{...prev.sistema,spessoreTelaio:sp}};
                  });
                }} style={{padding:"6px 4px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",background:"#F9FAFB",color:DARK,textAlign:"center" as any}}>
                  <div style={{fontSize:14}}>{p.icon}</div>
                  <div>{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Struttura */}
          <div>
            <div style={LBL}>Montanti / Traversi</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[
                ["+ Mont",()=>setInf((p:any)=>{const m=addMontante(p.montanti,suggerisciPosMontante(p.montanti,p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,montanti:m});}),DARK,false],
                ["− Mont",()=>setInf((p:any)=>{if(!p.montanti.length)return p;return ricalcola({...p,montanti:p.montanti.slice(0,-1)});}),RED,inf.montanti.length===0],
                ["+ Trav",()=>setInf((p:any)=>{const t=addTraverso(p.traversi,suggerisciPosTraverso(p.traversi,p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,traversi:t});}),DARK,false],
                ["− Trav",()=>setInf((p:any)=>{if(!p.traversi.length)return p;return ricalcola({...p,traversi:p.traversi.slice(0,-1)});}),RED,inf.traversi.length===0],
              ].map(([l,fn,col,dis]:any)=>(
                <button key={l} onClick={fn} disabled={dis} style={{padding:"5px 2px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:11,cursor:dis?"default":"pointer",background:"#F9FAFB",color:dis?"#CCC":col}}>{l}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:SUB,marginTop:4}}>{inf.montanti.length} mont · {inf.traversi.length} trav · {inf.griglia.celle.length} celle</div>
          </div>

          {/* CELLA SELEZIONATA */}
          {cellaSel ? (
            <div style={{border:`1.5px solid ${AMBER}`,borderRadius:10,padding:"10px",background:AMBER+"06"}}>
              <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:"uppercase",marginBottom:8}}>
                Cella {cellaSel.id} — {cellaSel.larghezzaNetta}×{cellaSel.altezzaNetta}mm
              </div>

              {/* Luci nette */}
              <div style={{background:"#F8FAFC",borderRadius:7,padding:"7px 9px",marginBottom:8,border:`1px solid ${BDR}`}}>
                <div style={{fontSize:9,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:4}}>Luci nette</div>
                {[
                  ["Vetro",`${luci[cellaSel.id]?.vetroL||0}×${luci[cellaSel.id]?.vetroH||0}mm`,DARK],
                  ["m²",`${(luci[cellaSel.id]?.vetroMq||0).toFixed(3)}`,SUB],
                  ...(!["fisso","pannello_cieco"].includes(cellaSel.tipo)?[["Anta",`${luci[cellaSel.id]?.antaL||0}×${luci[cellaSel.id]?.antaH||0}mm`,TEAL]]:[] as any[]),
                  ...(cellaSel.tipo==="porta"&&luci[cellaSel.id]?.passaggioL?[["Passaggio",`${luci[cellaSel.id].passaggioL}×${luci[cellaSel.id].passaggioH}mm`,AMBER]]:[] as any[]),
                ].map(([l,v,c]:any)=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:10,color:SUB}}>{l}</span>
                    <span style={{fontSize:10,fontWeight:700,fontFamily:FM,color:c}}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Tipo */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Tipo apertura</div>
                <select value={cellaSel.tipo} onChange={e=>updCella(cellaSel.id,{tipo:e.target.value})} style={INP}>
                  {TIPI.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Verso */}
              {["anta_battente","porta","anta_ribalta"].includes(cellaSel.tipo)&&(
                <div style={{marginBottom:6}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:3}}>Verso</div>
                  <div style={{display:"flex",gap:4}}>
                    {["sx","dx"].map(v=>(
                      <button key={v} onClick={()=>updCella(cellaSel.id,{verso:v})} style={{flex:1,padding:"5px 0",border:`1.5px solid ${cellaSel.verso===v?TEAL:BDR}`,borderRadius:6,fontSize:11,fontWeight:cellaSel.verso===v?700:400,cursor:"pointer",background:cellaSel.verso===v?TEAL+"12":"#fff",color:cellaSel.verso===v?TEAL:DARK}}>{v==="sx"?"◄ SX":"DX ►"}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vetro */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Vetro</div>
                <select value={cellaSel.vetro?.id||"std"} onChange={e=>updCella(cellaSel.id,{vetro:VETRI.find(v=>v.id===e.target.value)})} style={INP}>
                  {VETRI.map(v=><option key={v.id} value={v.id}>{v.label} (Ug {v.ugValore})</option>)}
                </select>
                {cellaSel.vetro&&<div style={{fontSize:9,color:SUB,marginTop:2,fontFamily:FM}}>{cellaSel.vetro.pesoMq}kg/m² · €{cellaSel.vetro.costoMq}/m²</div>}
              </div>

              {/* Ferramenta */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Ferramenta</div>
                <div style={{background:"#F3F4F6",borderRadius:6,padding:"4px 8px",marginBottom:4,fontSize:10}}>
                  Cerniere auto: <strong>{cerniereAuto(cellaSel.altezzaNetta,(luci[cellaSel.id]?.vetroMq||cellaSel.areaMq)*(cellaSel.vetro?.pesoMq||20)+3.5)} pz</strong>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[["Maniglia","maniglia"],["Multipunto","chiusuraMultipunto"]].map(([l,k]:any)=>(
                    <button key={k} onClick={()=>updCella(cellaSel.id,{ferramenta:{...(cellaSel.ferramenta||FER),[k]:!cellaSel.ferramenta?.[k]}})}
                      style={{flex:1,padding:"5px 4px",border:`1.5px solid ${cellaSel.ferramenta?.[k]?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:cellaSel.ferramenta?.[k]?TEAL+"12":"#fff",color:cellaSel.ferramenta?.[k]?TEAL:DARK}}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Violazioni cella */}
              {violazioni.filter((v:any)=>v.cellaId===cellaSel.id).map((v:any,i:number)=>(
                <div key={i} style={{padding:"5px 7px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:6,marginTop:4,fontSize:10,color:v.severita==="errore"?RED:"#92400E",fontWeight:600}}>
                  {v.severita==="errore"?"⛔":"⚠"} {v.messaggio}
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:"12px",background:"#F9FAFB",borderRadius:8,fontSize:11,color:SUB,textAlign:"center" as any,border:`1px dashed ${BDR}`}}>
              Clicca una cella per configurarla
            </div>
          )}

          {/* Vetro globale */}
          <div>
            <div style={LBL}>Vetro su tutte</div>
            <select id="vg" defaultValue="std" style={{...INP,marginBottom:5}}>
              {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button onClick={()=>{const el=document.getElementById("vg") as HTMLSelectElement;const vetro=VETRI.find(v=>v.id===el.value);if(!vetro)return;setInf((p:any)=>({...p,griglia:{...p.griglia,celle:p.griglia.celle.map((c:any)=>({...c,vetro}))}}));}}
              style={{width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"}}>Applica a tutte</button>
          </div>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:isMkt?DARK:"#F0F2F5",minWidth:0}}
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <RendererSVG infisso={inf} width="90%" height="90%" svgRef={svgRef}
          setDragging={(d:any)=>{wasDrag.current=false;setDragging(d);}}
          onCellaClick={handleCellaClick}/>
      </div>

      {/* ── PANNELLO DESTRO ── */}
      <div style={{width:230,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          {[["risultati","Risultati"],["distinta","Distinta"],["regole",nErr>0?`Regole ⛔${nErr}`:nWarn>0?`Regole ⚠${nWarn}`:"Regole"]].map(([id,l]:any)=>(
            <button key={id} onClick={()=>setTabRight(id)} style={{flex:1,padding:"8px 2px",border:"none",borderBottom:`2px solid ${tabRight===id?AMBER:"transparent"}`,fontSize:10,fontWeight:tabRight===id?700:400,cursor:"pointer",background:"#fff",color:tabRight===id?AMBER:SUB}}>{l}</button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
          {tabRight==="risultati"&&<>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`1px solid ${BDR}`}}>
              <div style={{fontSize:9,color:SUB,marginBottom:2}}>Trasmittanza Uw (EN ISO 10077)</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:24,fontWeight:900,fontFamily:FM,color:uwC}}>{uwCalc.uw}</span>
                <span style={{fontSize:11,color:SUB}}>W/m²K</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                <div style={{background:uwC,color:"#fff",fontSize:10,fontWeight:800,padding:"1px 7px",borderRadius:4}}>{uwCalc.classeEnergetica}</div>
                <span style={{fontSize:10,color:SUB}}>Ug medio: {uwCalc.ugMedio}</span>
              </div>
            </div>
            {[["Sup. tot.",`${Math.round(inf.larghezzaVano*inf.altezzaVano/10000)/100} m²`],
              ["Sup. vetro",`${distinta.vetri.reduce((a:number,v:any)=>a+v.mq,0).toFixed(2)} m²`],
              ["ML telaio",`${mlTelaio.toFixed(2)} m`],["ML ante",`${mlAnte.toFixed(2)} m`],
              ["Peso vetri",`${pesi.pesoVetriKg} kg`],["Peso profili",`${pesi.pesoProfiliKg} kg`],
              ["Peso totale",`${pesi.pesoTotaleKg} kg`],["Anta max",`${pesi.pesoAntaMax} kg`],
              ["Barre 6m",`${distinta.nBarre6m} pz`],["Sfrido",`${distinta.sfrido}%`],
            ].map(([l,v]:any)=>(
              <div key={l} style={ROW}><span style={{fontSize:11,color:SUB}}>{l}</span><span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span></div>
            ))}
          </>}

          {tabRight==="distinta"&&<>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:2}}>Profili — {distinta.profili.length} tagli</div>
            {distinta.profili.map((p:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F9FAFB",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{p.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{p.lunghezzaMm}mm×{p.quantita}={p.mlTotale}m · <span style={{color:AMBER}}>€{p.costoTot}</span></div>
                {p.barraAssegnata&&<div style={{fontSize:9,color:TEAL}}>Barra {p.barraAssegnata} @ {p.offsetMm}mm</div>}
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginTop:6,marginBottom:2}}>Vetri — {distinta.vetri.length} pz</div>
            {distinta.vetri.map((v:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F0FDF4",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{v.tipo} — cella {v.cellaId}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{v.mq.toFixed(3)}m² · {v.pesoKg}kg · <span style={{color:TEAL}}>€{v.costoTot}</span></div>
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginTop:6,marginBottom:2}}>Ferramenta</div>
            {distinta.ferramenta.map((f:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#FFF7ED",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{f.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{f.quantita}pz · <span style={{color:AMBER}}>€{f.costoTot}</span></div>
              </div>
            ))}
            <div style={{padding:"6px 8px",background:"#F8FAFC",borderRadius:6,border:`1px solid ${BDR}`}}>
              {[["Profili",distinta.costoProfilatoTot],["Vetri",distinta.costoVetriTot],["Ferramenta",distinta.costoFerramentaTot]].map(([l,v]:any)=>(
                <div key={l} style={ROW}><span style={{fontSize:11,color:SUB}}>{l}</span><span style={{fontSize:11,fontWeight:700,fontFamily:FM}}>€{v}</span></div>
              ))}
            </div>
          </>}

          {tabRight==="regole"&&(violazioni.length===0
            ?<div style={{padding:"12px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0",fontSize:12,color:TEAL,fontWeight:600,textAlign:"center" as any}}>✓ Nessuna violazione</div>
            :violazioni.map((v:any,i:number)=>(
              <div key={i} style={{padding:"7px 10px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:8,border:`1px solid ${v.severita==="errore"?"#FCA5A5":"#FCD34D"}`}}>
                <div style={{fontSize:11,fontWeight:700,color:v.severita==="errore"?RED:"#92400E"}}>{v.severita==="errore"?"⛔":"⚠"} Cella {v.cellaId}</div>
                <div style={{fontSize:10,color:v.severita==="errore"?"#7F1D1D":"#78350F",marginTop:2}}>{v.messaggio}</div>
              </div>
            ))
          )}
        </div>

        <div style={{borderTop:`1px solid ${BDR}`,padding:"10px 12px",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Preventivo</div>
          {[["Profili",`€${distinta.costoProfilatoTot.toLocaleString("it-IT")}`],["Vetri",`€${distinta.costoVetriTot.toLocaleString("it-IT")}`],["Ferramenta",`€${distinta.costoFerramentaTot.toLocaleString("it-IT")}`]].map(([l,v]:any)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:SUB}}>{l}</span>
              <span style={{fontSize:11,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:`1px solid ${BDR}`,marginTop:2}}>
            <span style={{fontSize:11,fontWeight:700}}>Vendita ×2.4</span>
            <span style={{fontSize:17,fontWeight:900,fontFamily:FM,color:AMBER}}>€{Math.round(distinta.costoTot*2.4).toLocaleString("it-IT")}</span>
          </div>
          <button onClick={()=>onUpdate?.({infisso:inf,distinta,pesi,uw:uwCalc})}
            style={{marginTop:8,width:"100%",padding:"8px 0",border:"none",borderRadius:8,background:haErrori(violazioni)?RED:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {haErrori(violazioni)?"⛔ Errori tecnici":"✓ Salva configurazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
