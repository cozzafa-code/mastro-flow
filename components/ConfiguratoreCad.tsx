"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — CONFIGURATORE PRINCIPALE v3.0
// Integra: engine/profili + engine/calcoli + engine/distinta + engine/regole
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useCallback } from "react";
import { RendererSVG } from "./renderer_svg";
import { calcolaGriglia, addMontante, addTraverso, moveMontante, moveTraverso, suggerisciPosMontante, suggerisciPosTraverso } from "./motore_geometrico";
import { PROFILI_DEMO, PROFILO_DEFAULT } from "../lib/engine/profili";
import { calcolaLuceCella, calcolaUw, calcolaPesi } from "../lib/engine/calcoli";
import { generaDistinta } from "../lib/engine/distinta";
import { verificaConfigurazione, haErrori, haWarning } from "../lib/engine/regole";

// ── VETRI CATALOGO ─────────────────────────────────────────────
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

const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const RED="#DC4444"; const BDR="#E5E7EB"; const SUB="#6B7280";
const FF="Inter,system-ui,sans-serif"; const FM="JetBrains Mono,monospace";
const INP = { padding:"5px 8px", border:`1px solid ${BDR}`, borderRadius:6, fontSize:13,
  fontWeight:700, fontFamily:FM, outline:"none", boxSizing:"border-box", width:"100%" };

function buildInfisso(L=1500, H=2100, profilo=PROFILO_DEFAULT) {
  const montanti = [{ id:"m1", xMm: Math.round(L/2), spessoreMm: profilo.spessoreTelaio }];
  const traversi = [];
  const griglia = calcolaGriglia(L, H, montanti, traversi, { spessoreTelaio: profilo.spessoreTelaio });
  griglia.celle.forEach(c => { c.vetro = VETRI[0]; c.ferramenta = { maniglia:true, maniglione:false, nCerniere:2, cerniereTipo:"standard", chiusuraMultipunto:false, costoFerramenta:0 }; });
  return { id:`inf_${Date.now()}`, vanoId:"", larghezzaVano:L, altezzaVano:H, spessoreMuro:150,
    profilo, montanti, traversi, griglia, _cellaSel:null, _mode:"industrial",
    // compat layer per renderer
    sistema: { spessoreTelaio: profilo.spessoreTelaio, tipo: profilo.materiale, serieNome: profilo.nome, ufProfilo: profilo.Uf, costoMlTelaio: profilo.costoMlTelaio, costoMlAnte: profilo.costoMlAnta, coloreEsterno:"#9CA3AF", coloreInterno:"#F2F1EC" }
  };
}

function ricalcola(inf) {
  const griglia = calcolaGriglia(inf.larghezzaVano, inf.altezzaVano, inf.montanti, inf.traversi,
    { spessoreTelaio: inf.profilo.spessoreTelaio }, inf.griglia.celle);
  return { ...inf, griglia, sistema: { ...inf.sistema, spessoreTelaio: inf.profilo.spessoreTelaio } };
}

export default function ConfiguratoreCad({ realW, realH, vanoNome, onUpdate, onClose }) {
  const [inf, setInf] = useState(() => buildInfisso(parseInt(realW)||1500, parseInt(realH)||2100));
  const [dragging, setDragging] = useState(null);
  const [tabRight, setTabRight] = useState("risultati"); // risultati | distinta | regole
  const svgRef = useRef(null);

  const upd = (partial) => setInf(prev => ricalcola({ ...prev, ...partial }));
  const updCella = (id, partial) => setInf(prev => ({
    ...prev,
    griglia: { ...prev.griglia, celle: prev.griglia.celle.map(c => c.id===id ? {...c,...partial} : c) }
  }));

  // ── CALCOLI ENGINE ────────────────────────────────────────────
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

  const mlTelaio = useMemo(() => (inf.larghezzaVano*2 + inf.altezzaVano*2)/1000, [inf]);
  const mlAnte = useMemo(() => inf.griglia.celle.filter(c=>c.tipo!=="fisso"&&c.tipo!=="pannello_cieco")
    .reduce((a,c)=>(a+(c.larghezzaNetta*2+c.altezzaNetta*2)/1000),0), [inf.griglia.celle]);

  const pesi = useMemo(() => calcolaPesi(
    mlTelaio, mlAnte,
    inf.griglia.celle.map(c => ({ areaMq: luci[c.id]?.vetroMq||c.areaMq, pesoMqVetro: c.vetro?.pesoMq||20, tipo: c.tipo })),
    inf.profilo
  ), [mlTelaio, mlAnte, inf.griglia.celle, luci, inf.profilo]);

  const distinta = useMemo(() => generaDistinta(
    inf.larghezzaVano, inf.altezzaVano,
    inf.montanti.map(m=>m.xMm),
    inf.traversi.map(t=>t.yMm),
    inf.griglia.celle.map(c => ({
      id: c.id, tipo: c.tipo,
      larghezzaNetta: c.larghezzaNetta, altezzaNetta: c.altezzaNetta, areaMq: c.areaMq,
      vetroTipo: c.vetro?.label, vetroUg: c.vetro?.ugValore,
      vetroMq: luci[c.id]?.vetroMq, vetroPesoMq: c.vetro?.pesoMq, vetroCostoMq: c.vetro?.costoMq,
      ferramenta: c.ferramenta || { maniglia:true, chiusuraMultipunto:false, nCerniere:2, costoFerramenta:0 }
    })),
    inf.profilo
  ), [inf, luci]);

  const violazioni = useMemo(() => verificaConfigurazione(
    inf.griglia.celle.map(c => ({
      id: c.id, tipo: c.tipo,
      larghezzaNetta: c.larghezzaNetta, altezzaNetta: c.altezzaNetta,
      pesoAntaKg: pesi.pesoAntaMax,
      vetroL: luci[c.id]?.vetroL||0, vetroH: luci[c.id]?.vetroH||0
    })),
    inf.profilo
  ), [inf.griglia.celle, inf.profilo, pesi, luci]);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM();
    const pt = { x:(e.clientX-CTM.e)/CTM.a, y:(e.clientY-CTM.f)/CTM.d };
    setInf(prev => {
      if (dragging.type==="m") {
        const montanti = moveMontante(prev.montanti, dragging.id, pt.x, prev.larghezzaVano, { spessoreTelaio: prev.profilo.spessoreTelaio });
        return ricalcola({...prev, montanti});
      } else {
        const traversi = moveTraverso(prev.traversi, dragging.id, pt.y, prev.altezzaVano, { spessoreTelaio: prev.profilo.spessoreTelaio });
        return ricalcola({...prev, traversi});
      }
    });
  }, [dragging]);

  const cellaSel = inf.griglia.celle.find(c => c.id===inf._cellaSel);
  const isMkt = inf._mode==="marketing";
  const uwC = uwCalc.uw<=1.0?TEAL:uwCalc.uw<=1.4?AMBER:RED;
  const nErrori = violazioni.filter(v=>v.severita==="errore").length;
  const nWarning = violazioni.filter(v=>v.severita==="warning").length;

  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"row",overflow:"hidden",fontFamily:FF}}>

      {/* ── SIDEBAR SINISTRA ── */}
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

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:14}}>

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
                fontSize:12,fontWeight:inf.profilo.id===p.id?700:400,
                color:inf.profilo.id===p.id?AMBER:DARK,cursor:"pointer",textAlign:"left"
              }}>
                {p.nome} <span style={{fontSize:10,color:SUB,fontWeight:400}}>Uf {p.Uf}</span>
              </button>
            ))}
          </div>

          {/* Struttura */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Struttura</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              {[
                ["+ Montante",()=>setInf(p=>{const m=addMontante(p.montanti,suggerisciPosMontante(p.montanti,p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.larghezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,montanti:m});}),DARK,false],
                ["− Montante",()=>setInf(p=>{if(!p.montanti.length)return p;return ricalcola({...p,montanti:p.montanti.slice(0,-1)});}),RED,inf.montanti.length===0],
                ["+ Traverso",()=>setInf(p=>{const t=addTraverso(p.traversi,suggerisciPosTraverso(p.traversi,p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio}),p.altezzaVano,{spessoreTelaio:p.profilo.spessoreTelaio});return ricalcola({...p,traversi:t});}),DARK,false],
                ["− Traverso",()=>setInf(p=>{if(!p.traversi.length)return p;return ricalcola({...p,traversi:p.traversi.slice(0,-1)});}),RED,inf.traversi.length===0],
              ].map(([lbl,fn,col,dis])=>(
                <button key={lbl} onClick={fn} disabled={dis} style={{padding:"6px 2px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:11,cursor:dis?"default":"pointer",background:"#F9FAFB",color:dis?"#CCC":col}}>{lbl}</button>
              ))}
            </div>
            <div style={{fontSize:10,color:SUB,marginTop:4}}>{inf.montanti.length} mont. · {inf.traversi.length} trav. · {inf.griglia.celle.length} celle</div>
          </div>

          {/* Cella selezionata */}
          {cellaSel && (
            <div style={{border:`1.5px solid ${AMBER}`,borderRadius:10,padding:"10px",background:AMBER+"08"}}>
              <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:"uppercase",marginBottom:8}}>
                Cella {cellaSel.id}
              </div>
              {/* Luci nette reali */}
              {luci[cellaSel.id] && (
                <div style={{background:"#F8FAFC",borderRadius:6,padding:"6px 8px",marginBottom:8,fontSize:10}}>
                  <div style={{color:SUB,marginBottom:2}}>Luci nette reali</div>
                  <div style={{fontFamily:FM,fontWeight:700,color:DARK}}>Vetro: {luci[cellaSel.id].vetroL}×{luci[cellaSel.id].vetroH} mm</div>
                  {luci[cellaSel.id].antaL>0 && <div style={{fontFamily:FM,color:SUB}}>Anta: {luci[cellaSel.id].antaL}×{luci[cellaSel.id].antaH} mm</div>}
                  {luci[cellaSel.id].passaggioL && <div style={{fontFamily:FM,color:TEAL}}>Passaggio: {luci[cellaSel.id].passaggioL}×{luci[cellaSel.id].passaggioH} mm</div>}
                </div>
              )}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Tipo apertura</div>
                <select value={cellaSel.tipo} onChange={e=>updCella(cellaSel.id,{tipo:e.target.value})} style={{...INP,fontSize:12}}>
                  {TIPI_CELLA.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              {(cellaSel.tipo==="anta_battente"||cellaSel.tipo==="porta"||cellaSel.tipo==="anta_ribalta") && (
                <div style={{marginBottom:6}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:3}}>Verso</div>
                  <div style={{display:"flex",gap:4}}>
                    {["sx","dx"].map(v=>(
                      <button key={v} onClick={()=>updCella(cellaSel.id,{verso:v})} style={{flex:1,padding:"5px 0",border:`1.5px solid ${cellaSel.verso===v?TEAL:BDR}`,borderRadius:6,fontSize:11,fontWeight:cellaSel.verso===v?700:400,cursor:"pointer",background:cellaSel.verso===v?TEAL+"12":"#fff",color:cellaSel.verso===v?TEAL:DARK}}>{v.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Vetro</div>
                <select value={cellaSel.vetro?.id||"std"} onChange={e=>updCella(cellaSel.id,{vetro:VETRI.find(v=>v.id===e.target.value)})} style={{...INP,fontSize:11}}>
                  {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <button onClick={()=>updCella(cellaSel.id,{ferramenta:{...(cellaSel.ferramenta||{}),maniglia:!cellaSel.ferramenta?.maniglia}})}
                  style={{flex:1,padding:"5px 4px",border:`1.5px solid ${cellaSel.ferramenta?.maniglia?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:cellaSel.ferramenta?.maniglia?TEAL+"12":"#fff",color:cellaSel.ferramenta?.maniglia?TEAL:DARK}}>Maniglia</button>
                <button onClick={()=>updCella(cellaSel.id,{ferramenta:{...(cellaSel.ferramenta||{}),chiusuraMultipunto:!cellaSel.ferramenta?.chiusuraMultipunto}})}
                  style={{flex:1,padding:"5px 4px",border:`1.5px solid ${cellaSel.ferramenta?.chiusuraMultipunto?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:cellaSel.ferramenta?.chiusuraMultipunto?TEAL+"12":"#fff",color:cellaSel.ferramenta?.chiusuraMultipunto?TEAL:DARK}}>Multipunto</button>
              </div>
            </div>
          )}

          {/* Applica vetro globale */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Vetro globale</div>
            <select id="vetro-glob" defaultValue="std" style={{...INP,fontSize:11,marginBottom:5}}>
              {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button onClick={()=>{const el=document.getElementById("vetro-glob");const vetro=VETRI.find(v=>v.id===el.value);if(!vetro)return;setInf(p=>({...p,griglia:{...p.griglia,celle:p.griglia.celle.map(c=>({...c,vetro}))}}));}}
              style={{width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"}}>Applica a tutte</button>
          </div>
        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:isMkt?DARK:"#F0F2F5",minWidth:0}}
        onMouseMove={handleMouseMove} onMouseUp={()=>setDragging(null)}>
        <RendererSVG infisso={inf} width="90%" height="90%" svgRef={svgRef} setDragging={setDragging}
          onCellaClick={id=>setInf(p=>({...p,_cellaSel:p._cellaSel===id?null:id}))}/>
      </div>

      {/* ── PANNELLO DESTRO ── */}
      <div style={{width:230,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Tab header */}
        <div style={{display:"flex",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          {[["risultati","Risultati"],["distinta","Distinta"],["regole",`Regole${nErrori>0?` ⚠${nErrori}`:nWarning>0?` ·${nWarning}`:""}` ]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTabRight(id)} style={{
              flex:1,padding:"8px 2px",border:"none",borderBottom:`2px solid ${tabRight===id?AMBER:"transparent"}`,
              fontSize:10,fontWeight:tabRight===id?700:400,cursor:"pointer",
              background:"#fff",color:tabRight===id?AMBER:SUB
            }}>{lbl}</button>
          ))}
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>

          {/* TAB RISULTATI */}
          {tabRight==="risultati" && <>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`1px solid ${BDR}`}}>
              <div style={{fontSize:9,color:SUB,marginBottom:2}}>Trasmittanza Uw (EN ISO 10077)</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:24,fontWeight:900,fontFamily:FM,color:uwC}}>{uwCalc.uw}</span>
                <span style={{fontSize:11,color:SUB}}>W/m²K</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                <div style={{background:uwC,color:"#fff",fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:4}}>{uwCalc.classeEnergetica}</div>
                <span style={{fontSize:10,color:SUB}}>Ug medio: {uwCalc.ugMedio}</span>
              </div>
            </div>
            {[["Sup. tot.",`${Math.round((inf.larghezzaVano*inf.altezzaVano)/10000)/100} m²`],
              ["ML profili",`${(mlTelaio+mlAnte).toFixed(2)} m`],
              ["Peso vetri",`${pesi.pesoVetriKg} kg`],
              ["Peso profili",`${pesi.pesoProfiliKg} kg`],
              ["Peso totale",`${pesi.pesoTotaleKg} kg`],
              ["Barre 6m",`${distinta.nBarre6m} pz`],
              ["Sfrido",`${distinta.sfrido}%`],
            ].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #F3F4F6"}}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span>
              </div>
            ))}
          </>}

          {/* TAB DISTINTA */}
          {tabRight==="distinta" && <>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.4,marginBottom:2}}>Profili ({distinta.profili.length} voci)</div>
            {distinta.profili.map((p,i)=>(
              <div key={i} style={{padding:"4px 6px",background:"#F9FAFB",borderRadius:5,marginBottom:2,fontSize:10}}>
                <div style={{fontWeight:600,color:DARK}}>{p.descrizione}</div>
                <div style={{color:SUB,fontFamily:FM}}>{p.lunghezzaMm}mm × {p.quantita} pz = {p.mlTotale}m · €{p.costoTot}</div>
                {p.barraAssegnata && <div style={{color:AMBER,fontSize:9}}>Barra {p.barraAssegnata} @ {p.offsetMm}mm</div>}
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.4,marginTop:6,marginBottom:2}}>Vetri ({distinta.vetri.length} pz)</div>
            {distinta.vetri.map((v,i)=>(
              <div key={i} style={{padding:"4px 6px",background:"#F0FDF4",borderRadius:5,marginBottom:2,fontSize:10}}>
                <div style={{fontWeight:600,color:DARK}}>{v.tipo} — cella {v.cellaId}</div>
                <div style={{color:SUB,fontFamily:FM}}>{v.mq.toFixed(3)} m² · {v.pesoKg} kg · €{v.costoTot}</div>
              </div>
            ))}
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.4,marginTop:6,marginBottom:2}}>Ferramenta</div>
            {distinta.ferramenta.map((f,i)=>(
              <div key={i} style={{padding:"4px 6px",background:"#FFF7ED",borderRadius:5,marginBottom:2,fontSize:10}}>
                <div style={{fontWeight:600,color:DARK}}>{f.descrizione}</div>
                <div style={{color:SUB,fontFamily:FM}}>{f.quantita} pz · €{f.costoTot}</div>
              </div>
            ))}
          </>}

          {/* TAB REGOLE */}
          {tabRight==="regole" && <>
            {violazioni.length===0 && (
              <div style={{padding:"10px",background:"#F0FDF4",borderRadius:8,border:"1px solid #BBF7D0",fontSize:12,color:TEAL,fontWeight:600,textAlign:"center"}}>
                ✓ Nessuna violazione rilevata
              </div>
            )}
            {violazioni.map((v,i)=>(
              <div key={i} style={{padding:"7px 10px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:8,border:`1px solid ${v.severita==="errore"?"#FCA5A5":"#FCD34D"}`}}>
                <div style={{fontSize:11,fontWeight:700,color:v.severita==="errore"?RED:"#92400E"}}>
                  {v.severita==="errore"?"⛔":"⚠"} Cella {v.cellaId}
                </div>
                <div style={{fontSize:10,color:v.severita==="errore"?"#7F1D1D":"#78350F",marginTop:2}}>{v.messaggio}</div>
                <div style={{fontSize:9,color:SUB,marginTop:2,fontFamily:FM}}>{v.valore} / max {v.limite}</div>
              </div>
            ))}
          </>}
        </div>

        {/* Footer preventivo */}
        <div style={{borderTop:`1px solid ${BDR}`,padding:"10px 12px",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Preventivo</div>
          {[["Profili",`€${distinta.costoProfilatoTot.toLocaleString("it-IT")}`],["Vetri",`€${distinta.costoVetriTot.toLocaleString("it-IT")}`],["Ferramenta",`€${distinta.costoFerramentaTot.toLocaleString("it-IT")}`]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:SUB}}>{l}</span>
              <span style={{fontSize:11,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:`1px solid ${BDR}`,marginTop:2}}>
            <span style={{fontSize:11,fontWeight:700}}>Vendita (×2.4)</span>
            <span style={{fontSize:17,fontWeight:900,fontFamily:FM,color:AMBER}}>€{Math.round(distinta.costoTot*2.4).toLocaleString("it-IT")}</span>
          </div>
          <button onClick={()=>onUpdate?.({infisso:inf,distinta,pesi,uw:uwCalc})} style={{marginTop:8,width:"100%",padding:"8px 0",border:"none",borderRadius:8,background:haErrori(violazioni)?RED:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {haErrori(violazioni)?"⛔ Errori tecnici":"Salva configurazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
