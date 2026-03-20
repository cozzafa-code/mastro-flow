"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — CONFIGURATORE PRINCIPALE v3.1
// FIX: click celle, spessori anta in pannello, cerniere auto
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useCallback } from "react";
import { RendererSVG } from "./renderer_svg";
import { calcolaGriglia, addMontante, addTraverso, moveMontante, moveTraverso, suggerisciPosMontante, suggerisciPosTraverso } from "./motore_geometrico";
import { PROFILI_DEMO, PROFILO_DEFAULT } from "../lib/engine/profili";
import { calcolaLuceCella, calcolaUw, calcolaPesi } from "../lib/engine/calcoli";
import { generaDistinta } from "../lib/engine/distinta";
import { verificaConfigurazione, haErrori, haWarning } from "../lib/engine/regole";

const VETRI = [
  { id:"std",   label:"Vetro standard",              ugValore:1.1, pesoMq:20, costoMq:55  },
  { id:"lam",   label:"Lastra stratificata singola", ugValore:1.1, pesoMq:18, costoMq:95  },
  { id:"rifl",  label:"Vetro riflettente",           ugValore:1.0, pesoMq:22, costoMq:130 },
  { id:"tri",   label:"Vetro triplo",                ugValore:0.5, pesoMq:30, costoMq:195 },
  { id:"cam",   label:"Vetri camera",                ugValore:0.9, pesoMq:20, costoMq:75  },
  { id:"anti",  label:"Antisfondamento",             ugValore:1.0, pesoMq:38, costoMq:210 },
];

const TIPI_CELLA = [
  { id:"fisso",          label:"Fisso"           },
  { id:"anta_battente",  label:"Anta battente"   },
  { id:"anta_ribalta",   label:"Anta-ribalta"    },
  { id:"wasistas",       label:"Wasistas"        },
  { id:"porta",          label:"Porta"           },
  { id:"scorrevole",     label:"Scorrevole"      },
  { id:"pannello_cieco", label:"Pannello cieco"  },
];

// Numero cerniere automatico in base al peso anta
function cerniereAuto(altezzaMm, pesoKg) {
  if (altezzaMm > 1800 || pesoKg > 50) return 3;
  return 2;
}

const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const RED="#DC4444"; const BDR="#E5E7EB"; const SUB="#6B7280";
const FF="Inter,system-ui,sans-serif"; const FM="JetBrains Mono,monospace";
const INP = { padding:"5px 8px", border:`1px solid ${BDR}`, borderRadius:6, fontSize:12,
  fontWeight:600, fontFamily:FF, outline:"none", boxSizing:"border-box", width:"100%" };
const ROW = { display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #F3F4F6" };

function buildInfisso(L=1500, H=2100, profilo=PROFILO_DEFAULT) {
  const sp = profilo.spessoreTelaio;
  const montanti = [{ id:"m1", xMm: Math.round(L/2), spessoreMm: sp }];
  const traversi = [];
  const griglia = calcolaGriglia(L, H, montanti, traversi, { spessoreTelaio: sp });
  griglia.celle.forEach(c => {
    c.vetro = VETRI[0];
    c.ferramenta = { maniglia:true, maniglione:false, nCerniere:2, cerniereTipo:"standard", chiusuraMultipunto:false, costoFerramenta:0 };
  });
  return {
    id:`inf_${Date.now()}`, vanoId:"", larghezzaVano:L, altezzaVano:H, spessoreMuro:150,
    profilo, montanti, traversi, griglia, _cellaSel:null, _mode:"industrial",
    sistema: { spessoreTelaio:sp, tipo:profilo.materiale, serieNome:profilo.nome, ufProfilo:profilo.Uf, costoMlTelaio:profilo.costoMlTelaio, costoMlAnte:profilo.costoMlAnta, coloreEsterno:"#9CA3AF", coloreInterno:"#F2F1EC" }
  };
}

function ricalcola(inf) {
  const sp = inf.profilo.spessoreTelaio;
  const griglia = calcolaGriglia(inf.larghezzaVano, inf.altezzaVano, inf.montanti, inf.traversi, { spessoreTelaio:sp }, inf.griglia.celle);
  return { ...inf, griglia, sistema:{ ...inf.sistema, spessoreTelaio:sp } };
}

export default function ConfiguratoreCad({ realW, realH, vanoNome, onUpdate, onClose }) {
  const [inf, setInf] = useState(() => buildInfisso(parseInt(realW)||1500, parseInt(realH)||2100));
  const [dragging, setDragging] = useState(null);
  const [wasDragging, setWasDragging] = useState(false); // FIX: distingue click da drag
  const [tabRight, setTabRight] = useState("risultati");
  const svgRef = useRef(null);

  const upd = (partial) => setInf(prev => ricalcola({ ...prev, ...partial }));
  const updCella = (id, partial) => setInf(prev => ({
    ...prev,
    griglia: { ...prev.griglia, celle: prev.griglia.celle.map(c => c.id===id ? {...c,...partial} : c) }
  }));

  // Calcoli engine
  const luci = useMemo(() => {
    const map = {};
    inf.griglia.celle.forEach(c => {
      map[c.id] = calcolaLuceCella(c.larghezzaNetta, c.altezzaNetta, inf.profilo, c.tipo);
    });
    return map;
  }, [inf.griglia.celle, inf.profilo]);

  const uwCalc = useMemo(() => calcolaUw(
    inf.larghezzaVano, inf.altezzaVano,
    inf.griglia.celle.map(c => ({ areaMq: luci[c.id]?.vetroMq||c.areaMq, vetroUg: c.vetro?.ugValore||1.1 })),
    inf.profilo
  ), [inf, luci]);

  const mlTelaio = useMemo(() => (inf.larghezzaVano*2+inf.altezzaVano*2)/1000, [inf]);
  const mlAnte = useMemo(() =>
    inf.griglia.celle.filter(c=>c.tipo!=="fisso"&&c.tipo!=="pannello_cieco")
      .reduce((a,c)=>a+(c.larghezzaNetta*2+c.altezzaNetta*2)/1000,0)
  , [inf.griglia.celle]);

  const pesi = useMemo(() => calcolaPesi(
    mlTelaio, mlAnte,
    inf.griglia.celle.map(c => ({ areaMq:luci[c.id]?.vetroMq||c.areaMq, pesoMqVetro:c.vetro?.pesoMq||20, tipo:c.tipo })),
    inf.profilo
  ), [mlTelaio, mlAnte, inf.griglia.celle, luci, inf.profilo]);

  const distinta = useMemo(() => generaDistinta(
    inf.larghezzaVano, inf.altezzaVano,
    inf.montanti.map(m=>m.xMm),
    inf.traversi.map(t=>t.yMm),
    inf.griglia.celle.map(c => ({
      id:c.id, tipo:c.tipo,
      larghezzaNetta:c.larghezzaNetta, altezzaNetta:c.altezzaNetta, areaMq:c.areaMq,
      vetroTipo:c.vetro?.label, vetroUg:c.vetro?.ugValore,
      vetroMq:luci[c.id]?.vetroMq, vetroPesoMq:c.vetro?.pesoMq, vetroCostoMq:c.vetro?.costoMq,
      ferramenta: c.ferramenta||{maniglia:true,chiusuraMultipunto:false,nCerniere:2,costoFerramenta:0}
    })),
    inf.profilo
  ), [inf, luci]);

  const violazioni = useMemo(() => verificaConfigurazione(
    inf.griglia.celle.map(c => ({
      id:c.id, tipo:c.tipo,
      larghezzaNetta:c.larghezzaNetta, altezzaNetta:c.altezzaNetta,
      pesoAntaKg:pesi.pesoAntaMax,
      vetroL:luci[c.id]?.vetroL||0, vetroH:luci[c.id]?.vetroH||0
    })),
    inf.profilo
  ), [inf.griglia.celle, inf.profilo, pesi, luci]);

  // FIX DRAG vs CLICK
  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    setWasDragging(true);
    const CTM = svgRef.current.getScreenCTM();
    const pt = { x:(e.clientX-CTM.e)/CTM.a, y:(e.clientY-CTM.f)/CTM.d };
    setInf(prev => {
      const sp = prev.profilo.spessoreTelaio;
      if (dragging.type==="m") {
        const montanti = moveMontante(prev.montanti, dragging.id, pt.x, prev.larghezzaVano, {spessoreTelaio:sp});
        return ricalcola({...prev, montanti});
      } else {
        const traversi = moveTraverso(prev.traversi, dragging.id, pt.y, prev.altezzaVano, {spessoreTelaio:sp});
        return ricalcola({...prev, traversi});
      }
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setTimeout(() => setWasDragging(false), 50);
  }, []);

  // Click cella — ignora se era un drag
  const handleCellaClick = useCallback((id) => {
    if (wasDragging) return;
    setInf(p => ({ ...p, _cellaSel: p._cellaSel===id ? null : id }));
  }, [wasDragging]);

  const cellaSel = inf.griglia.celle.find(c => c.id===inf._cellaSel);
  const isMkt = inf._mode==="marketing";
  const uwC = uwCalc.uw<=1.0?TEAL:uwCalc.uw<=1.4?AMBER:RED;
  const nErrori = violazioni.filter(v=>v.severita==="errore").length;
  const nWarning = violazioni.filter(v=>v.severita==="warning").length;

  // Cerniere auto per cella selezionata
  const cerniereCalc = cellaSel
    ? cerniereAuto(cellaSel.altezzaNetta, (luci[cellaSel.id]?.vetroMq||cellaSel.areaMq)*(cellaSel.vetro?.pesoMq||20)+3.5)
    : 2;

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"row",overflow:"hidden",fontFamily:FF}}>

      {/* ── SIDEBAR SINISTRA 240px ── */}
      <div style={{width:240,flexShrink:0,background:"#fff",borderRight:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vanoNome||"CAD"}</div>
          <div style={{display:"flex",background:"#F3F4F6",borderRadius:8,padding:2}}>
            {["industrial","marketing"].map(m=>(
              <button key={m} onClick={()=>upd({_mode:m})} style={{
                flex:1,padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",
                fontSize:10,fontWeight:700,textTransform:"uppercase",
                background:inf._mode===m?(m==="marketing"?AMBER:DARK):"transparent",
                color:inf._mode===m?"#fff":SUB
              }}>{m==="industrial"?"TECNICO":"MKT"}</button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:12}}>

          {/* Dimensioni */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Dimensioni vano</div>
            <div style={{display:"flex",gap:6}}>
              {[["L mm",inf.larghezzaVano,v=>upd({larghezzaVano:v})],["H mm",inf.altezzaVano,v=>upd({altezzaVano:v})]].map(([lbl,val,fn])=>(
                <div key={lbl} style={{flex:1}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:2}}>{lbl}</div>
                  <input type="number" value={val} style={INP} onChange={e=>{const v=parseInt(e.target.value);if(v>200)fn(v);}}/>
                </div>
              ))}
            </div>
          </div>

          {/* Profilo */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Profilo</div>
            {PROFILI_DEMO.map(p=>(
              <button key={p.id} onClick={()=>upd({profilo:p})} style={{
                display:"block",width:"100%",padding:"6px 10px",marginBottom:3,
                border:`1.5px solid ${inf.profilo.id===p.id?AMBER:BDR}`,borderRadius:7,
                background:inf.profilo.id===p.id?AMBER+"18":"#fff",
                fontSize:11,fontWeight:inf.profilo.id===p.id?700:400,
                color:inf.profilo.id===p.id?AMBER:DARK,cursor:"pointer",textAlign:"left"
              }}>
                <div>{p.nome}</div>
                <div style={{fontSize:9,color:SUB,fontWeight:400}}>Uf {p.Uf} · st {p.spessoreTelaio}mm · sa {p.spessoreAnta}mm · sov {p.sovrapposizioneAnta}mm</div>
              </button>
            ))}
          </div>

          {/* Struttura */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Struttura</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[
                ["+ Montante",()=>setInf(p=>{const m=addMontante(p.montanti,suggerisciPosMontante(p.montanti,p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,montanti:m});}),DARK,false],
                ["− Mont.",()=>setInf(p=>{if(!p.montanti.length)return p;return ricalcola({...p,montanti:p.montanti.slice(0,-1)});}),RED,inf.montanti.length===0],
                ["+ Traverso",()=>setInf(p=>{const t=addTraverso(p.traversi,suggerisciPosTraverso(p.traversi,p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,traversi:t});}),DARK,false],
                ["− Trav.",()=>setInf(p=>{if(!p.traversi.length)return p;return ricalcola({...p,traversi:p.traversi.slice(0,-1)});}),RED,inf.traversi.length===0],
              ].map(([lbl,fn,col,dis])=>(
                <button key={lbl} onClick={fn} disabled={dis} style={{padding:"5px 2px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:11,cursor:dis?"default":"pointer",background:"#F9FAFB",color:dis?"#CCC":col}}>{lbl}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:SUB,marginTop:4}}>{inf.montanti.length} mont. · {inf.traversi.length} trav. · {inf.griglia.celle.length} celle</div>
          </div>

          {/* ── PANNELLO CELLA SELEZIONATA ── */}
          {cellaSel ? (
            <div style={{border:`1.5px solid ${AMBER}`,borderRadius:10,padding:"10px",background:AMBER+"06"}}>
              <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:"uppercase",marginBottom:8}}>
                Cella {cellaSel.id} — {cellaSel.larghezzaNetta}×{cellaSel.altezzaNetta} mm
              </div>

              {/* Luci nette reali */}
              <div style={{background:"#F8FAFC",borderRadius:7,padding:"7px 9px",marginBottom:8,border:`1px solid ${BDR}`}}>
                <div style={{fontSize:9,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:5}}>Luci nette reali</div>
                {[
                  ["Vetro L×H", `${luci[cellaSel.id]?.vetroL||0} × ${luci[cellaSel.id]?.vetroH||0} mm`, DARK],
                  ["Vetro m²",  `${(luci[cellaSel.id]?.vetroMq||0).toFixed(3)} m²`, SUB],
                  ...(cellaSel.tipo!=="fisso"&&cellaSel.tipo!=="pannello_cieco"
                    ? [["Anta L×H", `${luci[cellaSel.id]?.antaL||0} × ${luci[cellaSel.id]?.antaH||0} mm`, TEAL]]
                    : []),
                  ...(cellaSel.tipo==="porta"&&luci[cellaSel.id]?.passaggioL
                    ? [["Passaggio", `${luci[cellaSel.id].passaggioL} × ${luci[cellaSel.id].passaggioH} mm`, AMBER]]
                    : []),
                ].map(([l,v,col])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:10,color:SUB}}>{l}</span>
                    <span style={{fontSize:10,fontWeight:700,fontFamily:FM,color:col}}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Tipo apertura */}
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Tipo apertura</div>
                <select value={cellaSel.tipo} onChange={e=>updCella(cellaSel.id,{tipo:e.target.value})} style={INP}>
                  {TIPI_CELLA.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Verso */}
              {["anta_battente","porta","anta_ribalta"].includes(cellaSel.tipo) && (
                <div style={{marginBottom:7}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:3}}>Verso apertura</div>
                  <div style={{display:"flex",gap:4}}>
                    {["sx","dx"].map(v=>(
                      <button key={v} onClick={()=>updCella(cellaSel.id,{verso:v})} style={{
                        flex:1,padding:"5px 0",border:`1.5px solid ${cellaSel.verso===v?TEAL:BDR}`,borderRadius:6,
                        fontSize:11,fontWeight:cellaSel.verso===v?700:400,cursor:"pointer",
                        background:cellaSel.verso===v?TEAL+"12":"#fff",color:cellaSel.verso===v?TEAL:DARK
                      }}>{v==="sx"?"◄ Sinistra":"Destra ►"}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vetro */}
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Tipo vetro</div>
                <select value={cellaSel.vetro?.id||"std"} onChange={e=>updCella(cellaSel.id,{vetro:VETRI.find(v=>v.id===e.target.value)})} style={INP}>
                  {VETRI.map(v=><option key={v.id} value={v.id}>{v.label} (Ug {v.ugValore})</option>)}
                </select>
                {cellaSel.vetro && (
                  <div style={{fontSize:9,color:SUB,marginTop:2,fontFamily:FM}}>
                    {cellaSel.vetro.pesoMq} kg/m² · €{cellaSel.vetro.costoMq}/m²
                  </div>
                )}
              </div>

              {/* Ferramenta */}
              <div style={{marginBottom:7}}>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Ferramenta</div>
                {/* Cerniere automatiche */}
                <div style={{background:"#F3F4F6",borderRadius:6,padding:"5px 8px",marginBottom:4,fontSize:10}}>
                  <span style={{color:SUB}}>Cerniere auto: </span>
                  <span style={{fontWeight:700,color:DARK,fontFamily:FM}}>{cerniereCalc} pz</span>
                  <span style={{color:SUB,fontSize:9}}> ({cellaSel.altezzaNetta>1800?"H>1800mm":"peso/dim"})</span>
                </div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {[
                    ["Maniglia","maniglia"],
                    ["Multipunto","chiusuraMultipunto"],
                  ].map(([lbl,key])=>(
                    <button key={key} onClick={()=>updCella(cellaSel.id,{ferramenta:{...(cellaSel.ferramenta||{}), [key]:!cellaSel.ferramenta?.[key]}})}
                      style={{flex:1,padding:"5px 4px",border:`1.5px solid ${cellaSel.ferramenta?.[key]?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:cellaSel.ferramenta?.[key]?TEAL+"12":"#fff",color:cellaSel.ferramenta?.[key]?TEAL:DARK}}>{lbl}</button>
                  ))}
                </div>
              </div>

              {/* Violazioni questa cella */}
              {violazioni.filter(v=>v.cellaId===cellaSel.id).map((v,i)=>(
                <div key={i} style={{padding:"5px 7px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:6,marginTop:4,fontSize:10,color:v.severita==="errore"?RED:"#92400E",fontWeight:600}}>
                  {v.severita==="errore"?"⛔":"⚠"} {v.messaggio}
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:"12px",background:"#F9FAFB",borderRadius:8,fontSize:11,color:SUB,textAlign:"center",border:`1px dashed ${BDR}`}}>
              Clicca una cella nel canvas per configurarla
            </div>
          )}

          {/* Vetro globale */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Vetro globale</div>
            <select id="vetro-glob" defaultValue="std" style={{...INP,marginBottom:5}}>
              {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button onClick={()=>{const el=document.getElementById("vetro-glob");const vetro=VETRI.find(v=>v.id===el.value);if(!vetro)return;setInf(p=>({...p,griglia:{...p.griglia,celle:p.griglia.celle.map(c=>({...c,vetro}))}}));}}
              style={{width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"}}>Applica a tutte</button>
          </div>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div
        style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:isMkt?DARK:"#F0F2F5",minWidth:0}}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}>
        <RendererSVG
          infisso={inf}
          width="90%" height="90%"
          svgRef={svgRef}
          setDragging={(d)=>{ setWasDragging(false); setDragging(d); }}
          onCellaClick={handleCellaClick}
        />
      </div>

      {/* ── PANNELLO DESTRO 230px ── */}
      <div style={{width:230,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          {[
            ["risultati","Risultati"],
            ["distinta","Distinta"],
            ["regole", nErrori>0?`Regole ⛔${nErrori}`:nWarning>0?`Regole ⚠${nWarning}`:"Regole"],
          ].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTabRight(id)} style={{
              flex:1,padding:"8px 2px",border:"none",borderBottom:`2px solid ${tabRight===id?AMBER:"transparent"}`,
              fontSize:10,fontWeight:tabRight===id?700:400,cursor:"pointer",
              background:"#fff",color:tabRight===id?AMBER:SUB
            }}>{lbl}</button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>

          {/* TAB RISULTATI */}
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
              ["Sup. tot.",    `${Math.round(inf.larghezzaVano*inf.altezzaVano/10000)/100} m²`],
              ["Sup. vetro",  `${distinta.vetri.reduce((a,v)=>a+v.mq,0).toFixed(2)} m²`],
              ["ML telaio",   `${mlTelaio.toFixed(2)} m`],
              ["ML ante",     `${mlAnte.toFixed(2)} m`],
              ["ML totale",   `${(mlTelaio+mlAnte).toFixed(2)} m`],
              ["Peso vetri",  `${pesi.pesoVetriKg} kg`],
              ["Peso profili",`${pesi.pesoProfiliKg} kg`],
              ["Peso totale", `${pesi.pesoTotaleKg} kg`],
              ["Anta max",    `${pesi.pesoAntaMax} kg`],
              ["Barre 6m",    `${distinta.nBarre6m} pz`],
              ["Sfrido",      `${distinta.sfrido}%`],
            ].map(([l,v])=>(
              <div key={l} style={ROW}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span>
              </div>
            ))}
          </>}

          {/* TAB DISTINTA */}
          {tabRight==="distinta" && <>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:2}}>Profili — {distinta.profili.length} tagli</div>
            {distinta.profili.map((p,i)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F9FAFB",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{p.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{p.lunghezzaMm} mm × {p.quantita} = {p.mlTotale} m · <span style={{color:AMBER}}>€{p.costoTot}</span></div>
                {p.barraAssegnata && <div style={{fontSize:9,color:TEAL}}>Barra {p.barraAssegnata} — offset {p.offsetMm} mm</div>}
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginTop:6,marginBottom:2}}>Vetri — {distinta.vetri.length} pz</div>
            {distinta.vetri.map((v,i)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F0FDF4",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{v.tipo} — cella {v.cellaId}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{v.mq.toFixed(3)} m² · {v.pesoKg} kg · <span style={{color:TEAL}}>€{v.costoTot}</span></div>
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginTop:6,marginBottom:2}}>Ferramenta</div>
            {distinta.ferramenta.map((f,i)=>(
              <div key={i} style={{padding:"5px 7px",background:"#FFF7ED",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{f.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{f.quantita} pz · <span style={{color:AMBER}}>€{f.costoTot}</span></div>
              </div>
            ))}
            <div style={{marginTop:6,padding:"6px 8px",background:"#F8FAFC",borderRadius:6,border:`1px solid ${BDR}`}}>
              <div style={{...ROW}}><span style={{fontSize:11,color:SUB}}>Totale profili</span><span style={{fontSize:11,fontWeight:700,fontFamily:FM}}>€{distinta.costoProfilatoTot}</span></div>
              <div style={{...ROW}}><span style={{fontSize:11,color:SUB}}>Totale vetri</span><span style={{fontSize:11,fontWeight:700,fontFamily:FM}}>€{distinta.costoVetriTot}</span></div>
              <div style={{...ROW,borderBottom:"none"}}><span style={{fontSize:11,color:SUB}}>Totale ferramenta</span><span style={{fontSize:11,fontWeight:700,fontFamily:FM}}>€{distinta.costoFerramentaTot}</span></div>
            </div>
          </>}

          {/* TAB REGOLE */}
          {tabRight==="regole" && <>
            {violazioni.length===0 ? (
              <div style={{padding:"12px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0",fontSize:12,color:TEAL,fontWeight:600,textAlign:"center"}}>
                ✓ Nessuna violazione
              </div>
            ) : violazioni.map((v,i)=>(
              <div key={i} style={{padding:"7px 10px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:8,border:`1px solid ${v.severita==="errore"?"#FCA5A5":"#FCD34D"}`}}>
                <div style={{fontSize:11,fontWeight:700,color:v.severita==="errore"?RED:"#92400E"}}>
                  {v.severita==="errore"?"⛔":"⚠"} Cella {v.cellaId} — {v.codice}
                </div>
                <div style={{fontSize:10,color:v.severita==="errore"?"#7F1D1D":"#78350F",marginTop:2}}>{v.messaggio}</div>
                <div style={{fontSize:9,color:SUB,marginTop:2,fontFamily:FM}}>Valore: {v.valore} / Limite: {v.limite}</div>
              </div>
            ))}
          </>}
        </div>

        {/* Footer preventivo */}
        <div style={{borderTop:`1px solid ${BDR}`,padding:"10px 12px",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Preventivo</div>
          {[
            ["Profili",    `€${distinta.costoProfilatoTot.toLocaleString("it-IT")}`],
            ["Vetri",      `€${distinta.costoVetriTot.toLocaleString("it-IT")}`],
            ["Ferramenta", `€${distinta.costoFerramentaTot.toLocaleString("it-IT")}`],
          ].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:SUB}}>{l}</span>
              <span style={{fontSize:11,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:`1px solid ${BDR}`,marginTop:2}}>
            <span style={{fontSize:11,fontWeight:700}}>Vendita ×2.4</span>
            <span style={{fontSize:17,fontWeight:900,fontFamily:FM,color:AMBER}}>€{Math.round(distinta.costoTot*2.4).toLocaleString("it-IT")}</span>
          </div>
          <button
            onClick={()=>onUpdate?.({infisso:inf,distinta,pesi,uw:uwCalc})}
            style={{marginTop:8,width:"100%",padding:"8px 0",border:"none",borderRadius:8,
              background:haErrori(violazioni)?RED:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {haErrori(violazioni)?"⛔ Errori tecnici — non salvare":"✓ Salva configurazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
