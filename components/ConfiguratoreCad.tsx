"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — ConfiguratoreCad v4.0
// Griglia ricorsiva, preset aperture, sub-montanti per cella
// Sistema profili gerarchico, maniglia martellina, cerniere reali
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useCallback } from "react";
import { RendererSVG } from "./renderer_svg";
import {
  calcolaGriglia, addMontante, addTraverso,
  moveMontante, moveTraverso,
  addSubMontante, addSubTraverso, removeSubMontante, removeSubTraverso,
  suggerisciPosMontante, suggerisciPosTraverso, suggerisciSubPos,
  applicaPreset
} from "./motore_geometrico";
import { PROFILI_DEMO, PROFILO_DEFAULT } from "../lib/engine/profili";
import { calcolaLuceCella, calcolaUw, calcolaPesi } from "../lib/engine/calcoli";
import { generaDistinta } from "../lib/engine/distinta";
import { verificaConfigurazione, haErrori } from "../lib/engine/regole";

// ── CATALOGO VETRI ─────────────────────────────────────────────
const VETRI = [
  { id:"std",   label:"Vetro standard 4-16-4",        ugValore:1.1, pesoMq:20, costoMq:55  },
  { id:"lam",   label:"Stratificato 33.1",            ugValore:1.1, pesoMq:18, costoMq:95  },
  { id:"rifl",  label:"Riflettente selettivo",        ugValore:1.0, pesoMq:22, costoMq:130 },
  { id:"tri",   label:"Triplo basso emissivo",        ugValore:0.5, pesoMq:30, costoMq:195 },
  { id:"cam",   label:"Camera 4-12-4",                ugValore:0.9, pesoMq:20, costoMq:75  },
  { id:"anti",  label:"Antisfondamento P2A",          ugValore:1.0, pesoMq:38, costoMq:210 },
];

const TIPI_CELLA = [
  { id:"fisso",          label:"Fisso"          },
  { id:"anta_battente",  label:"Anta battente"  },
  { id:"anta_ribalta",   label:"Anta-ribalta"   },
  { id:"wasistas",       label:"Wasistas"       },
  { id:"porta",          label:"Porta"          },
  { id:"scorrevole",     label:"Scorrevole"     },
  { id:"pannello_cieco", label:"Pannello cieco" },
];

const PRESET_LIST = [
  { id:"fisso",        label:"Fisso",          icon:"▣" },
  { id:"1_anta_sx",    label:"1 Anta SX",      icon:"◧" },
  { id:"1_anta_dx",    label:"1 Anta DX",      icon:"◨" },
  { id:"2_ante",       label:"2 Ante",         icon:"◫" },
  { id:"3_ante",       label:"3 Ante",         icon:"⊞" },
  { id:"porta_sx",     label:"Porta SX",       icon:"🚪" },
  { id:"scorrevole_2", label:"Scorrevole 2",   icon:"⇔" },
];

function cerniereAuto(altMm:number, pesoKg:number) {
  return altMm>1800||pesoKg>50 ? 3 : 2;
}

const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const RED="#DC4444"; const BDR="#E5E7EB"; const SUB="#6B7280";
const FF="Inter,system-ui,sans-serif"; const FM="JetBrains Mono,monospace";
const INP:any = { padding:"5px 8px", border:`1px solid ${BDR}`, borderRadius:6,
  fontSize:12, fontWeight:600, fontFamily:FF, outline:"none", boxSizing:"border-box", width:"100%" };
const ROW:any = { display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #F3F4F6" };
const LABEL:any = { fontSize:10, fontWeight:700, color:SUB, textTransform:"uppercase", letterSpacing:0.5, marginBottom:6 };

const FER_DEF = { maniglia:true, maniglione:false, nCerniere:2, cerniereTipo:"standard", chiusuraMultipunto:false, costoFerramenta:0 };

function buildInfisso(L=1500, H=2100, profilo=PROFILO_DEFAULT) {
  const sp = profilo.spessoreTelaio;
  const montanti = [{ id:"m1", xMm: Math.round(L/2), spessoreMm:sp }];
  const griglia = calcolaGriglia(L, H, montanti, [], { spessoreTelaio:sp });
  griglia.celle.forEach(c => {
    c.vetro = VETRI[0];
    c.ferramenta = {...FER_DEF};
    c.subMontanti = []; c.subTraversi = []; c.subCelle = [];
  });
  return {
    id:`inf_${Date.now()}`, vanoId:"", larghezzaVano:L, altezzaVano:H, spessoreMuro:150,
    profilo, montanti, traversi:[], griglia, _cellaSel:null, _mode:"industrial",
    sistema:{ spessoreTelaio:sp, tipo:profilo.materiale, serieNome:profilo.nome,
      ufProfilo:profilo.Uf, costoMlTelaio:profilo.costoMlTelaio, costoMlAnte:profilo.costoMlAnta,
      coloreEsterno:"#9CA3AF", coloreInterno:"#F2F1EC" }
  };
}

function ricalcola(inf:any) {
  const sp = inf.profilo.spessoreTelaio;
  const griglia = calcolaGriglia(inf.larghezzaVano, inf.altezzaVano,
    inf.montanti, inf.traversi, { spessoreTelaio:sp }, inf.griglia.celle);
  return { ...inf, griglia, sistema:{ ...inf.sistema, spessoreTelaio:sp } };
}

// Trova cella per id (anche nested)
function trovaCella(celle:any[], id:string):any {
  for (const c of celle) {
    if (c.id===id) return c;
    if (c.subCelle?.length) { const r=trovaCella(c.subCelle,id); if(r) return r; }
  }
  return null;
}

// Aggiorna cella per id (anche nested)
function aggiornaCella(celle:any[], id:string, partial:any):any[] {
  return celle.map(c=>{
    if (c.id===id) return {...c,...partial};
    if (c.subCelle?.length) return {...c, subCelle:aggiornaCella(c.subCelle,id,partial)};
    return c;
  });
}

export default function ConfiguratoreCad({ realW, realH, vanoNome, onUpdate, onClose }:any) {
  const [inf, setInf] = useState(()=>buildInfisso(parseInt(realW)||1500, parseInt(realH)||2100));
  const [dragging, setDragging] = useState<any>(null);
  const wasDraggingRef = useRef(false);
  const [tabRight, setTabRight] = useState("risultati");
  const svgRef = useRef<SVGSVGElement>(null);

  const upd = (partial:any) => setInf((prev:any) => ricalcola({...prev,...partial}));

  const updCella = (id:string, partial:any) => setInf((prev:any) => ({
    ...prev,
    griglia: { ...prev.griglia, celle: aggiornaCella(prev.griglia.celle, id, partial) }
  }));

  const replaceCellaInGriglia = (celle:any[], id:string, nuovaCella:any):any[] =>
    celle.map(c=>{
      if(c.id===id) return nuovaCella;
      if(c.subCelle?.length) return {...c, subCelle:replaceCellaInGriglia(c.subCelle,id,nuovaCella)};
      return c;
    });

  // ── CALCOLI ──────────────────────────────────────────────────
  const tutteLeCelle = useMemo(()=>{
    const flat:any[]=[];
    const walk=(celle:any[])=>{celle.forEach(c=>{flat.push(c);if(c.subCelle?.length)walk(c.subCelle);});};
    walk(inf.griglia.celle); return flat;
  },[inf.griglia.celle]);

  const luci = useMemo(()=>{
    const map:any={};
    tutteLeCelle.forEach(c=>{ map[c.id]=calcolaLuceCella(c.larghezzaNetta,c.altezzaNetta,inf.profilo,c.tipo); });
    return map;
  },[tutteLeCelle,inf.profilo]);

  const uwCalc = useMemo(()=>calcolaUw(
    inf.larghezzaVano,inf.altezzaVano,
    tutteLeCelle.map(c=>({areaMq:luci[c.id]?.vetroMq||c.areaMq,vetroUg:c.vetro?.ugValore||1.1})),
    inf.profilo
  ),[inf,luci,tutteLeCelle]);

  const mlTelaio = useMemo(()=>(inf.larghezzaVano*2+inf.altezzaVano*2)/1000,[inf]);
  const mlAnte = useMemo(()=>tutteLeCelle.filter(c=>!["fisso","pannello_cieco"].includes(c.tipo))
    .reduce((a:number,c:any)=>a+(c.larghezzaNetta*2+c.altezzaNetta*2)/1000,0),[tutteLeCelle]);

  const pesi = useMemo(()=>calcolaPesi(mlTelaio,mlAnte,
    tutteLeCelle.map(c=>({areaMq:luci[c.id]?.vetroMq||c.areaMq,pesoMqVetro:c.vetro?.pesoMq||20,tipo:c.tipo})),
    inf.profilo),[mlTelaio,mlAnte,tutteLeCelle,luci,inf.profilo]);

  const distinta = useMemo(()=>generaDistinta(
    inf.larghezzaVano,inf.altezzaVano,
    inf.montanti.map((m:any)=>m.xMm),inf.traversi.map((t:any)=>t.yMm),
    tutteLeCelle.map(c=>({
      id:c.id,tipo:c.tipo,larghezzaNetta:c.larghezzaNetta,altezzaNetta:c.altezzaNetta,areaMq:c.areaMq,
      vetroTipo:c.vetro?.label,vetroUg:c.vetro?.ugValore,vetroMq:luci[c.id]?.vetroMq,
      vetroPesoMq:c.vetro?.pesoMq,vetroCostoMq:c.vetro?.costoMq,
      ferramenta:c.ferramenta||FER_DEF
    })),inf.profilo),[inf,tutteLeCelle,luci]);

  const violazioni = useMemo(()=>verificaConfigurazione(
    tutteLeCelle.map(c=>({id:c.id,tipo:c.tipo,larghezzaNetta:c.larghezzaNetta,altezzaNetta:c.altezzaNetta,
      pesoAntaKg:pesi.pesoAntaMax,vetroL:luci[c.id]?.vetroL||0,vetroH:luci[c.id]?.vetroH||0})),
    inf.profilo),[tutteLeCelle,inf.profilo,pesi,luci]);

  // ── DRAG ─────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e:any)=>{
    if(!dragging||!svgRef.current) return;
    wasDraggingRef.current = true;
    const CTM = svgRef.current.getScreenCTM()!;
    const pt = {x:(e.clientX-CTM.e)/CTM.a, y:(e.clientY-CTM.f)/CTM.d};
    const sp = inf.profilo.spessoreTelaio;
    setInf((prev:any)=>{
      if(dragging.type==="m"){
        const montanti=moveMontante(prev.montanti,dragging.id,pt.x,prev.larghezzaVano,{spessoreTelaio:sp});
        return ricalcola({...prev,montanti});
      }
      if(dragging.type==="t"){
        const traversi=moveTraverso(prev.traversi,dragging.id,pt.y,prev.altezzaVano,{spessoreTelaio:sp});
        return ricalcola({...prev,traversi});
      }
      if(dragging.type==="sm"||dragging.type==="st"){
        const celle=prev.griglia.celle.map((c:any)=>{
          if(c.id!==dragging.cellaId) return c;
          if(dragging.type==="sm"){
            const subMontanti=c.subMontanti.map((m:any)=>m.id===dragging.id?{...m,xMmRel:Math.round(Math.max(sp,Math.min(c.larghezzaNetta-sp,pt.x-prev.griglia.xPunti[c.colIdx])))}:m);
            const updated={...c,subMontanti};
            const {calcolaSubGriglia}=require("./motore_geometrico");
            updated.subCelle=calcolaSubGriglia(updated,sp,c.subCelle);
            return updated;
          } else {
            const subTraversi=c.subTraversi.map((t:any)=>t.id===dragging.id?{...t,yMmRel:Math.round(Math.max(sp,Math.min(c.altezzaNetta-sp,pt.y-prev.griglia.yPunti[c.rowIdx])))}:t);
            const updated={...c,subTraversi};
            const {calcolaSubGriglia}=require("./motore_geometrico");
            updated.subCelle=calcolaSubGriglia(updated,sp,c.subCelle);
            return updated;
          }
        });
        return {...prev,griglia:{...prev.griglia,celle}};
      }
      return prev;
    });
  },[dragging,inf.profilo]);

  const handleMouseUp = useCallback(()=>{
    setDragging(null);
    setTimeout(()=>{ wasDraggingRef.current = false; },50);
  },[]);

  const handleCellaClick = useCallback((id:string)=>{
    if(wasDraggingRef.current) return;
    setInf((p:any)=>({...p,_cellaSel:p._cellaSel===id?null:id}));
  },[]);

  const cellaSel = trovaCella(inf.griglia.celle, inf._cellaSel||"");
  const isMkt = inf._mode==="marketing";
  const uwC = uwCalc.uw<=1.0?TEAL:uwCalc.uw<=1.4?AMBER:RED;
  const nErrori = violazioni.filter((v:any)=>v.severita==="errore").length;
  const nWarning = violazioni.filter((v:any)=>v.severita==="warning").length;

  // ── APPLICAZIONE PRESET ───────────────────────────────────────
  const applicaPresetUI = (presetId:string) => {
    const sp = inf.profilo.spessoreTelaio;
    const {montanti, celle_config} = applicaPreset(inf.larghezzaVano, inf.altezzaVano, presetId, sp);
    setInf((prev:any)=>{
      const nuovoInf = {...prev, montanti, traversi:[]};
      const griglia = calcolaGriglia(prev.larghezzaVano, prev.altezzaVano, montanti, [], {spessoreTelaio:sp});
      griglia.celle.forEach((c:any)=>{
        const cfg = celle_config[c.id]||{};
        c.vetro = VETRI[0];
        c.ferramenta = {...FER_DEF};
        c.subMontanti=[]; c.subTraversi=[]; c.subCelle=[];
        Object.assign(c, cfg);
      });
      return {...nuovoInf, griglia, sistema:{...prev.sistema,spessoreTelaio:sp}};
    });
  };

  return (
    <div style={{width:"100%",height:"100%",display:"flex",overflow:"hidden",fontFamily:FF}}>

      {/* ── SIDEBAR SINISTRA ── */}
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
            <div style={LABEL}>Dimensioni vano</div>
            <div style={{display:"flex",gap:6}}>
              {[["L mm",inf.larghezzaVano,(v:number)=>upd({larghezzaVano:v})],["H mm",inf.altezzaVano,(v:number)=>upd({altezzaVano:v})]].map(([lbl,val,fn]:any)=>(
                <div key={lbl} style={{flex:1}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:2}}>{lbl}</div>
                  <input type="number" defaultValue={val} key={val} style={INP} onBlur={e=>{const v=parseInt(e.target.value);if(v>200)fn(v);}} onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt((e.target as HTMLInputElement).value);if(v>200)fn(v);}}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Profilo */}
          <div>
            <div style={LABEL}>Sistema profilo</div>
            {PROFILI_DEMO.map((p:any)=>(
              <button key={p.id} onClick={()=>upd({profilo:p})} style={{display:"block",width:"100%",padding:"6px 10px",marginBottom:3,border:`1.5px solid ${inf.profilo.id===p.id?AMBER:BDR}`,borderRadius:7,background:inf.profilo.id===p.id?AMBER+"18":"#fff",fontSize:11,fontWeight:inf.profilo.id===p.id?700:400,color:inf.profilo.id===p.id?AMBER:DARK,cursor:"pointer",textAlign:"left" as any}}>
                <div>{p.nome}</div>
                <div style={{fontSize:9,color:SUB,fontWeight:400}}>Uf {p.Uf} · telaio {p.spessoreTelaio}mm · anta {p.spessoreAnta}mm · sov {p.sovrapposizioneAnta}mm</div>
              </button>
            ))}
          </div>

          {/* Preset aperture */}
          <div>
            <div style={LABEL}>Preset apertura</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {PRESET_LIST.map(p=>(
                <button key={p.id} onClick={()=>applicaPresetUI(p.id)} style={{padding:"6px 4px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:10,fontWeight:600,cursor:"pointer",background:"#F9FAFB",color:DARK,textAlign:"center" as any}}>
                  <div style={{fontSize:14}}>{p.icon}</div>
                  <div>{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Struttura globale */}
          <div>
            <div style={LABEL}>Struttura globale</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[
                ["+ Mont.",()=>setInf((p:any)=>{const m=addMontante(p.montanti,suggerisciPosMontante(p.montanti,p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,montanti:m});}),DARK,false],
                ["− Mont.",()=>setInf((p:any)=>{if(!p.montanti.length)return p;return ricalcola({...p,montanti:p.montanti.slice(0,-1)});}),RED,inf.montanti.length===0],
                ["+ Trav.",()=>setInf((p:any)=>{const t=addTraverso(p.traversi,suggerisciPosTraverso(p.traversi,p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,traversi:t});}),DARK,false],
                ["− Trav.",()=>setInf((p:any)=>{if(!p.traversi.length)return p;return ricalcola({...p,traversi:p.traversi.slice(0,-1)});}),RED,inf.traversi.length===0],
              ].map(([lbl,fn,col,dis]:any)=>(
                <button key={lbl} onClick={fn} disabled={dis} style={{padding:"5px 2px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:11,cursor:dis?"default":"pointer",background:"#F9FAFB",color:dis?"#CCC":col}}>{lbl}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:SUB,marginTop:4}}>{inf.montanti.length} mont. globali · {inf.traversi.length} trav. globali · {tutteLeCelle.length} celle tot.</div>
          </div>

          {/* ── PANNELLO CELLA SELEZIONATA ── */}
          {cellaSel ? (
            <div style={{border:`1.5px solid ${AMBER}`,borderRadius:10,padding:"10px",background:AMBER+"06"}}>
              <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:"uppercase",marginBottom:8}}>
                Cella {cellaSel.id} — {cellaSel.larghezzaNetta}×{cellaSel.altezzaNetta}mm
              </div>

              {/* Luci nette reali */}
              <div style={{background:"#F8FAFC",borderRadius:7,padding:"7px 9px",marginBottom:8,border:`1px solid ${BDR}`}}>
                <div style={{fontSize:9,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:4}}>Luci nette</div>
                {[
                  ["Vetro",`${luci[cellaSel.id]?.vetroL||0} × ${luci[cellaSel.id]?.vetroH||0} mm`,DARK],
                  ["m²",`${(luci[cellaSel.id]?.vetroMq||0).toFixed(3)}`,SUB],
                  ...(!["fisso","pannello_cieco"].includes(cellaSel.tipo)?[["Anta",`${luci[cellaSel.id]?.antaL||0} × ${luci[cellaSel.id]?.antaH||0} mm`,TEAL]]:[] as any[]),
                  ...(cellaSel.tipo==="porta"&&luci[cellaSel.id]?.passaggioL?[["Passaggio",`${luci[cellaSel.id].passaggioL} × ${luci[cellaSel.id].passaggioH} mm`,AMBER]]:[] as any[]),
                ].map(([l,v,col]:any)=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:10,color:SUB}}>{l}</span>
                    <span style={{fontSize:10,fontWeight:700,fontFamily:FM,color:col}}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Tipo */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Tipo apertura</div>
                <select value={cellaSel.tipo} onChange={e=>updCella(cellaSel.id,{tipo:e.target.value})} style={INP}>
                  {TIPI_CELLA.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Verso */}
              {["anta_battente","porta","anta_ribalta"].includes(cellaSel.tipo) && (
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
              </div>

              {/* Ferramenta */}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Ferramenta</div>
                <div style={{background:"#F3F4F6",borderRadius:6,padding:"4px 8px",marginBottom:4,fontSize:10}}>
                  Cerniere: <strong>{cerniereAuto(cellaSel.altezzaNetta,(luci[cellaSel.id]?.vetroMq||cellaSel.areaMq)*(cellaSel.vetro?.pesoMq||20)+3.5)} pz auto</strong>
                </div>
                <div style={{display:"flex",gap:4}}>
                  {[["Maniglia","maniglia"],["Multipunto","chiusuraMultipunto"]].map(([lbl,key]:any)=>(
                    <button key={key} onClick={()=>updCella(cellaSel.id,{ferramenta:{...(cellaSel.ferramenta||FER_DEF),[key]:!cellaSel.ferramenta?.[key]}})}
                      style={{flex:1,padding:"5px 4px",border:`1.5px solid ${cellaSel.ferramenta?.[key]?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:cellaSel.ferramenta?.[key]?TEAL+"12":"#fff",color:cellaSel.ferramenta?.[key]?TEAL:DARK}}>{lbl}</button>
                  ))}
                </div>
              </div>

              {/* Sub-struttura per questa cella */}
              <div>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Struttura interna cella</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
                  {[
                    ["+ SubMont",()=>{
                      const sp=inf.profilo.spessoreTelaio;
                      const x=suggerisciSubPos(cellaSel.subMontanti,cellaSel.larghezzaNetta,sp,"xMmRel");
                      const subMontanti=[...cellaSel.subMontanti,{id:`sm${Date.now()}`,xMmRel:x,spessoreMm:sp}].sort((a:any,b:any)=>a.xMmRel-b.xMmRel);
                      const updated={...cellaSel,subMontanti};
                      updated.subCelle=calcolaSubGriglia(updated,sp,cellaSel.subCelle||[]);
                      setInf((p:any)=>({...p,griglia:{...p.griglia,celle:replaceCellaInGriglia(p.griglia.celle,cellaSel.id,updated)}}));
                    },DARK,false],
                    ["− SubMont",()=>{
                      if(!cellaSel.subMontanti.length)return;
                      const sp=inf.profilo.spessoreTelaio;
                      const subMontanti=cellaSel.subMontanti.slice(0,-1);
                      const updated={...cellaSel,subMontanti};
                      updated.subCelle=calcolaSubGriglia(updated,sp,cellaSel.subCelle||[]);
                      setInf((p:any)=>({...p,griglia:{...p.griglia,celle:replaceCellaInGriglia(p.griglia.celle,cellaSel.id,updated)}}));
                    },RED,cellaSel.subMontanti.length===0],
                    ["+ SubTrav",()=>{
                      const sp=inf.profilo.spessoreTelaio;
                      const y=suggerisciSubPos(cellaSel.subTraversi,cellaSel.altezzaNetta,sp,"yMmRel");
                      // Aggiungi traverso e ricalcola sub-griglia
                      const subTraversi=[...cellaSel.subTraversi,{id:`st${Date.now()}`,yMmRel:y,spessoreMm:sp}].sort((a:any,b:any)=>a.yMmRel-b.yMmRel);
                      const updated={...cellaSel,subTraversi};
                      updated.subCelle=calcolaSubGriglia(updated,sp,cellaSel.subCelle||[]);
                      // Aggiorna SOLO questa cella senza ricalcolare griglia globale
                      setInf((p:any)=>({...p,griglia:{...p.griglia,celle:replaceCellaInGriglia(p.griglia.celle,cellaSel.id,updated)}}));
                    },DARK,false],
                    ["− SubTrav",()=>{
                      if(!cellaSel.subTraversi.length)return;
                      const sp=inf.profilo.spessoreTelaio;
                      const subTraversi=cellaSel.subTraversi.slice(0,-1);
                      const updated={...cellaSel,subTraversi};
                      updated.subCelle=calcolaSubGriglia(updated,sp,cellaSel.subCelle||[]);
                      setInf((p:any)=>({...p,griglia:{...p.griglia,celle:replaceCellaInGriglia(p.griglia.celle,cellaSel.id,updated)}}));
                    },RED,cellaSel.subTraversi.length===0],
                  ].map(([lbl,fn,col,dis]:any)=>(
                    <button key={lbl} onClick={fn} disabled={dis} style={{padding:"5px 2px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:10,cursor:dis?"default":"pointer",background:"#F9FAFB",color:dis?"#CCC":col}}>{lbl}</button>
                  ))}
                </div>
                <div style={{fontSize:10,color:SUB,marginTop:3}}>{cellaSel.subMontanti.length} submont · {cellaSel.subTraversi.length} subtrav · {cellaSel.subCelle.length} subcelle</div>
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
            <div style={LABEL}>Vetro su tutte le celle</div>
            <select id="vetro-glob" defaultValue="std" style={{...INP,marginBottom:5}}>
              {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button onClick={()=>{const el=document.getElementById("vetro-glob") as HTMLSelectElement;const vetro=VETRI.find(v=>v.id===el.value);if(!vetro)return;setInf((p:any)=>({...p,griglia:{...p.griglia,celle:p.griglia.celle.map((c:any)=>({...c,vetro}))}}));}}
              style={{width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"}}>Applica a tutte</button>
          </div>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:isMkt?DARK:"#F0F2F5",minWidth:0}}
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <RendererSVG infisso={inf} width="90%" height="90%" svgRef={svgRef}
          setDragging={(d:any)=>{ wasDraggingRef.current = false; setDragging(d); }}
          onCellaClick={handleCellaClick}/>
      </div>

      {/* ── PANNELLO DESTRO ── */}
      <div style={{width:230,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          {[["risultati","Risultati"],["distinta","Distinta"],["regole",nErrori>0?`Regole ⛔${nErrori}`:nWarning>0?`Regole ⚠${nWarning}`:"Regole"]].map(([id,lbl]:any)=>(
            <button key={id} onClick={()=>setTabRight(id)} style={{flex:1,padding:"8px 2px",border:"none",borderBottom:`2px solid ${tabRight===id?AMBER:"transparent"}`,fontSize:10,fontWeight:tabRight===id?700:400,cursor:"pointer",background:"#fff",color:tabRight===id?AMBER:SUB}}>{lbl}</button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>

          {tabRight==="risultati" && <>
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
            {[
              ["Sup. tot.",`${Math.round(inf.larghezzaVano*inf.altezzaVano/10000)/100} m²`],
              ["Sup. vetro",`${distinta.vetri.reduce((a:number,v:any)=>a+v.mq,0).toFixed(2)} m²`],
              ["ML telaio",`${mlTelaio.toFixed(2)} m`],
              ["ML ante",`${mlAnte.toFixed(2)} m`],
              ["Peso vetri",`${pesi.pesoVetriKg} kg`],
              ["Peso profili",`${pesi.pesoProfiliKg} kg`],
              ["Peso totale",`${pesi.pesoTotaleKg} kg`],
              ["Anta max",`${pesi.pesoAntaMax} kg`],
              ["Barre 6m",`${distinta.nBarre6m} pz`],
              ["Sfrido",`${distinta.sfrido}%`],
            ].map(([l,v]:any)=>(
              <div key={l} style={ROW}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span>
              </div>
            ))}
          </>}

          {tabRight==="distinta" && <>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:2}}>Profili — {distinta.profili.length} tagli</div>
            {distinta.profili.map((p:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F9FAFB",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{p.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{p.lunghezzaMm}mm × {p.quantita} = {p.mlTotale}m · <span style={{color:AMBER}}>€{p.costoTot}</span></div>
                {p.barraAssegnata&&<div style={{fontSize:9,color:TEAL}}>Barra {p.barraAssegnata} @ {p.offsetMm}mm</div>}
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginTop:6,marginBottom:2}}>Vetri — {distinta.vetri.length} pz</div>
            {distinta.vetri.map((v:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F0FDF4",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{v.tipo} — cella {v.cellaId}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{v.mq.toFixed(3)} m² · {v.pesoKg} kg · <span style={{color:TEAL}}>€{v.costoTot}</span></div>
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginTop:6,marginBottom:2}}>Ferramenta</div>
            {distinta.ferramenta.map((f:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#FFF7ED",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{f.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{f.quantita} pz · <span style={{color:AMBER}}>€{f.costoTot}</span></div>
              </div>
            ))}
            <div style={{padding:"6px 8px",background:"#F8FAFC",borderRadius:6,border:`1px solid ${BDR}`}}>
              {[["Profili",distinta.costoProfilatoTot],["Vetri",distinta.costoVetriTot],["Ferramenta",distinta.costoFerramentaTot]].map(([l,v]:any)=>(
                <div key={l} style={ROW}><span style={{fontSize:11,color:SUB}}>{l}</span><span style={{fontSize:11,fontWeight:700,fontFamily:FM}}>€{v}</span></div>
              ))}
            </div>
          </>}

          {tabRight==="regole" && (violazioni.length===0
            ? <div style={{padding:"12px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0",fontSize:12,color:TEAL,fontWeight:600,textAlign:"center" as any}}>✓ Nessuna violazione</div>
            : violazioni.map((v:any,i:number)=>(
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
