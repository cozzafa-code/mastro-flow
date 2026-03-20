"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — CONFIGURATORE PRINCIPALE v2.0
// [SIDEBAR 240px | CANVAS flex:1 | PANNELLO RISULTATI 220px]
// Architettura modulare: motore geometrico → renderer → output
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useCallback } from "react";
import { RendererSVG } from "./renderer_svg";
import { calcolaGriglia, addMontante, addTraverso, moveMontante, moveTraverso, suggerisciPosMontante, suggerisciPosTraverso } from "./motore_geometrico";
import { calcolaOutput } from "./calcolo_output";
import type { Infisso, SistemaProfilo, ConfigVetro, TipoCella, VersoApertura } from "./types_cad";

// ── DATI PREDEFINITI ───────────────────────────────────────────

const SISTEMI: Record<string, SistemaProfilo> = {
  ALLUMINIO: { tipo:"ALLUMINIO", serieNome:"Serie 65", spessoreTelaio:65, spessoreMuro:150, costoMlTelaio:28.5, costoMlAnte:22.0, ufProfilo:2.1, psi:0.05, coloreEsterno:"#1A1A1C", coloreInterno:"#F2F1EC" },
  PVC:       { tipo:"PVC",       serieNome:"Serie 70", spessoreTelaio:85, spessoreMuro:150, costoMlTelaio:18.2, costoMlAnte:14.5, ufProfilo:0.8, psi:0.02, coloreEsterno:"#F2F1EC", coloreInterno:"#F2F1EC" },
  LEGNO:     { tipo:"LEGNO",     serieNome:"Larice 80",spessoreTelaio:80, spessoreMuro:150, costoMlTelaio:72.0, costoMlAnte:58.0, ufProfilo:1.0, psi:0.04, coloreEsterno:"#4E342E", coloreInterno:"#8D6E63" },
};

const VETRI: ConfigVetro[] = [
  { id:"std",   tipo:"std_4_16_4",         label:"Vetro standard",              composizione:"4-16-4",        ugValore:1.1, sfValore:0.63, spessoreToale:24, pesoMq:20, costoMq:55,  puntoDiRugiada:-8,  resistenzaUrto:false, trattamenti:[] },
  { id:"lam",   tipo:"stratificato_33_1",  label:"Lastra stratificata singola", composizione:"33.1",          ugValore:1.1, sfValore:0.62, spessoreToale:8,  pesoMq:18, costoMq:95,  puntoDiRugiada:-8,  resistenzaUrto:true,  trattamenti:[] },
  { id:"rifl",  tipo:"riflettente",        label:"Vetro riflettente",           composizione:"4-16-4 rifl.",  ugValore:1.0, sfValore:0.35, spessoreToale:24, pesoMq:22, costoMq:130, puntoDiRugiada:-10, resistenzaUrto:false, trattamenti:["selettivo"] },
  { id:"tri",   tipo:"triplo",             label:"Vetro triplo",                composizione:"4-14-4-14-4",   ugValore:0.5, sfValore:0.50, spessoreToale:44, pesoMq:30, costoMq:195, puntoDiRugiada:-18, resistenzaUrto:false, trattamenti:["basso_emissivo"] },
  { id:"cam",   tipo:"camera",             label:"Vetri camera",                composizione:"4-12-4",        ugValore:0.9, sfValore:0.60, spessoreToale:20, pesoMq:20, costoMq:75,  puntoDiRugiada:-12, resistenzaUrto:false, trattamenti:[] },
  { id:"anti",  tipo:"antisfondamento",    label:"Antisfondamento",             composizione:"44.2-16-44.2",  ugValore:1.0, sfValore:0.61, spessoreToale:40, pesoMq:38, costoMq:210, puntoDiRugiada:-8,  resistenzaUrto:true,  trattamenti:[] },
];

const TIPI_CELLA: { id: TipoCella; label: string }[] = [
  { id:"fisso",          label:"Fisso" },
  { id:"anta_battente",  label:"Anta battente" },
  { id:"anta_ribalta",   label:"Anta-ribalta" },
  { id:"wasistas",       label:"Wasistas" },
  { id:"porta",          label:"Porta" },
  { id:"scorrevole",     label:"Scorrevole" },
  { id:"pannello_cieco", label:"Pannello cieco" },
];

// ── COSTANTI UI ────────────────────────────────────────────────
const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const RED="#DC4444"; const BDR="#E5E7EB"; const SUB="#6B7280";
const FF="Inter,system-ui,sans-serif"; const FM="JetBrains Mono,monospace";
const INP = { padding:"5px 8px", border:`1px solid ${BDR}`, borderRadius:6, fontSize:13,
  fontWeight:700, fontFamily:FM, outline:"none", boxSizing:"border-box", width:"100%" };
const BTN_SM = (active=false, col=DARK) => ({
  padding:"5px 8px", border:`1px solid ${active?col:BDR}`, borderRadius:6,
  fontSize:11, fontWeight:active?700:400, cursor:"pointer",
  background:active?col+"18":"#F9FAFB", color:active?col:DARK
});

// ── BUILDER INFISSO INIZIALE ───────────────────────────────────
function buildInfisso(L=1500, H=2100, sistemaKey="ALLUMINIO"): Infisso {
  const sistema = SISTEMI[sistemaKey];
  const montanti = [{ id:"m1", xMm: Math.round(L/2), spessoreMm: sistema.spessoreTelaio }];
  const traversi = [];
  const griglia = calcolaGriglia(L, H, montanti, traversi, sistema);
  // Applica vetro default a tutte le celle
  griglia.celle.forEach(c => { c.vetro = VETRI[0]; });
  return { id:`inf_${Date.now()}`, vanoId:"", larghezzaVano:L, altezzaVano:H,
    spessoreMuro:150, sistema, montanti, traversi, griglia,
    _cellaSel:null, _mode:"industrial" };
}

function ricalcola(inf: Infisso): Infisso {
  const griglia = calcolaGriglia(inf.larghezzaVano, inf.altezzaVano, inf.montanti, inf.traversi, inf.sistema, inf.griglia.celle);
  return { ...inf, griglia };
}

// ════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ════════════════════════════════════════════════════════════════
export default function ConfiguratoreCad({ realW, realH, vanoNome, onUpdate, onClose }: any) {
  const [inf, setInf] = useState<Infisso>(() => buildInfisso(parseInt(realW)||1500, parseInt(realH)||2100));
  const [dragging, setDragging] = useState<{id:string;type:"m"|"t"}|null>(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [npVal, setNpVal] = useState("");
  const [npTarget, setNpTarget] = useState<"L"|"H"|null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const output = useMemo(() => calcolaOutput(inf), [inf]);

  const upd = (partial: Partial<Infisso>) => setInf(prev => ricalcola({ ...prev, ...partial }));
  const updCella = (id: string, partial: any) => setInf(prev => ({
    ...prev,
    griglia: { ...prev.griglia, celle: prev.griglia.celle.map(c => c.id===id ? {...c,...partial} : c) }
  }));

  const cellaSel = inf.griglia.celle.find(c => c.id === inf._cellaSel);

  // ── DRAG MONTANTI/TRAVERSI ─────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;
    const CTM = svgRef.current.getScreenCTM()!;
    const pt = { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
    setInf(prev => {
      if (dragging.type === "m") {
        const montanti = moveMontante(prev.montanti, dragging.id, pt.x, prev.larghezzaVano, prev.sistema);
        return ricalcola({ ...prev, montanti });
      } else {
        const traversi = moveTraverso(prev.traversi, dragging.id, pt.y, prev.altezzaVano, prev.sistema);
        return ricalcola({ ...prev, traversi });
      }
    });
  }, [dragging]);

  const isMkt = inf._mode === "marketing";
  const canvasBg = isMkt ? DARK : "#F0F2F5";
  const uwC = output.uw<=1.0?TEAL:output.uw<=1.4?AMBER:RED;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"row",overflow:"hidden",fontFamily:FF}}>

      {/* ── SIDEBAR SINISTRA 240px ── */}
      <div style={{width:240,flexShrink:0,background:"#fff",borderRight:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* Header */}
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {vanoNome||"CAD Configuratore"}
          </div>
          <div style={{display:"flex",background:"#F3F4F6",borderRadius:8,padding:2}}>
            {["industrial","marketing"].map(m=>(
              <button key={m} onClick={()=>upd({_mode:m as any})} style={{
                flex:1,padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",
                fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.3,
                background:inf._mode===m?(m==="marketing"?AMBER:DARK):"transparent",
                color:inf._mode===m?"#fff":SUB,transition:"all .15s"
              }}>{m==="industrial"?"TECNICO":"MKT"}</button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:14}}>

          {/* Dimensioni */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Dimensioni vano</div>
            <div style={{display:"flex",gap:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:SUB,marginBottom:2}}>L mm</div>
                <input type="number" value={inf.larghezzaVano} style={INP}
                  onChange={e=>{const v=parseInt(e.target.value);if(v>200)upd({larghezzaVano:v});}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:SUB,marginBottom:2}}>H mm</div>
                <input type="number" value={inf.altezzaVano} style={INP}
                  onChange={e=>{const v=parseInt(e.target.value);if(v>200)upd({altezzaVano:v});}}/>
              </div>
            </div>
          </div>

          {/* Sistema profilo */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Profilo</div>
            {Object.entries(SISTEMI).map(([k,s])=>(
              <button key={k} onClick={()=>upd({sistema:s})} style={{
                display:"block",width:"100%",padding:"6px 10px",marginBottom:3,
                border:`1.5px solid ${inf.sistema.tipo===k?AMBER:BDR}`,borderRadius:7,
                background:inf.sistema.tipo===k?AMBER+"18":"#fff",
                fontSize:12,fontWeight:inf.sistema.tipo===k?700:400,
                color:inf.sistema.tipo===k?AMBER:DARK,cursor:"pointer",textAlign:"left"
              }}>
                {k} <span style={{fontSize:10,color:SUB,fontWeight:400}}>{s.serieNome}</span>
              </button>
            ))}
          </div>

          {/* Struttura */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Struttura</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              <button onClick={()=>setInf(p=>{const montanti=addMontante(p.montanti,suggerisciPosMontante(p.montanti,p.larghezzaVano,p.sistema),p.larghezzaVano,p.sistema);return ricalcola({...p,montanti});})}
                style={BTN_SM()}>+ Montante</button>
              <button onClick={()=>setInf(p=>{if(!p.montanti.length)return p;const montanti=p.montanti.slice(0,-1);return ricalcola({...p,montanti});})}
                disabled={inf.montanti.length===0} style={BTN_SM(false,RED)}>− Montante</button>
              <button onClick={()=>setInf(p=>{const traversi=addTraverso(p.traversi,suggerisciPosTraverso(p.traversi,p.altezzaVano,p.sistema),p.altezzaVano,p.sistema);return ricalcola({...p,traversi});})}
                style={BTN_SM()}>+ Traverso</button>
              <button onClick={()=>setInf(p=>{if(!p.traversi.length)return p;const traversi=p.traversi.slice(0,-1);return ricalcola({...p,traversi});})}
                disabled={inf.traversi.length===0} style={BTN_SM(false,RED)}>− Traverso</button>
            </div>
            <div style={{fontSize:10,color:SUB,marginTop:4}}>{inf.montanti.length} mont. · {inf.traversi.length} trav. · {inf.griglia.celle.length} celle</div>
          </div>

          {/* Configurazione cella selezionata */}
          {cellaSel && (
            <div style={{border:`1.5px solid ${AMBER}`,borderRadius:10,padding:"10px 10px",background:AMBER+"08"}}>
              <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>
                Cella {cellaSel.id} — {cellaSel.larghezzaNetta}×{cellaSel.altezzaNetta} mm
              </div>

              {/* Tipo apertura */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Tipo apertura</div>
                <select value={cellaSel.tipo}
                  onChange={e=>updCella(cellaSel.id,{tipo:e.target.value as TipoCella})}
                  style={{...INP,fontSize:12}}>
                  {TIPI_CELLA.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {/* Verso */}
              {(cellaSel.tipo==="anta_battente"||cellaSel.tipo==="porta") && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:4}}>Verso apertura</div>
                  <div style={{display:"flex",gap:4}}>
                    {(["sx","dx"] as VersoApertura[]).map(v=>(
                      <button key={v} onClick={()=>updCella(cellaSel.id,{verso:v})}
                        style={BTN_SM(cellaSel.verso===v,TEAL)}>{v.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vetro */}
              <div style={{marginBottom:8}}>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Tipo vetro</div>
                <select value={cellaSel.vetro?.id||"std"}
                  onChange={e=>updCella(cellaSel.id,{vetro:VETRI.find(v=>v.id===e.target.value)})}
                  style={{...INP,fontSize:11}}>
                  {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>

              {/* Ferramenta quick */}
              <div>
                <div style={{fontSize:9,color:SUB,marginBottom:4}}>Ferramenta</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  <button onClick={()=>updCella(cellaSel.id,{ferramenta:{...cellaSel.ferramenta,maniglia:!cellaSel.ferramenta.maniglia}})}
                    style={BTN_SM(cellaSel.ferramenta.maniglia,TEAL)}>Maniglia</button>
                  <button onClick={()=>updCella(cellaSel.id,{ferramenta:{...cellaSel.ferramenta,chiusuraMultipunto:!cellaSel.ferramenta.chiusuraMultipunto}})}
                    style={BTN_SM(cellaSel.ferramenta.chiusuraMultipunto,TEAL)}>Multipunto</button>
                </div>
              </div>
            </div>
          )}

          {/* Applica vetro a tutte */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Applica vetro globale</div>
            <select defaultValue="std" id="vetro-glob" style={{...INP,fontSize:11,marginBottom:6}}>
              {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button onClick={()=>{
              const el = document.getElementById("vetro-glob") as HTMLSelectElement;
              const vetro = VETRI.find(v=>v.id===el.value);
              if(!vetro)return;
              setInf(p=>({...p,griglia:{...p.griglia,celle:p.griglia.celle.map(c=>({...c,vetro}))}}));
            }} style={{width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"}}>
              Applica a tutte le celle
            </button>
          </div>

        </div>
      </div>

      {/* ── CANVAS ── */}
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
        overflow:"hidden",background:canvasBg,transition:"background .3s",minWidth:0}}
        onMouseMove={handleMouseMove}
        onMouseUp={()=>setDragging(null)}>
        <RendererSVG
          infisso={inf}
          width="90%" height="90%"
          svgRef={svgRef}
          dragging={dragging}
          setDragging={setDragging}
          onCellaClick={(id)=>setInf(p=>({...p,_cellaSel:p._cellaSel===id?null:id}))}
          onMontanteDrag={(id,x)=>setInf(p=>{const montanti=moveMontante(p.montanti,id,x,p.larghezzaVano,p.sistema);return ricalcola({...p,montanti});})}
          onTraversoDrag={(id,y)=>setInf(p=>{const traversi=moveTraverso(p.traversi,id,y,p.altezzaVano,p.sistema);return ricalcola({...p,traversi});})}
        />

        {/* Numpad overlay quote */}
        {showNumpad&&(
          <div style={{position:"absolute",background:DARK,padding:36,borderRadius:36,border:`8px solid ${AMBER}`,zIndex:9999,boxShadow:"0 0 80px rgba(0,0,0,0.8)"}}>
            <div style={{fontSize:80,color:AMBER,textAlign:"right",borderBottom:"3px solid #333",marginBottom:24,fontWeight:900,fontFamily:FM}}>{npVal||"0"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
              {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k=>(
                <button key={k} onClick={()=>{
                  if(k==="OK"){const v=parseInt(npVal);if(v>200){if(npTarget==="L")upd({larghezzaVano:v});else upd({altezzaVano:v});}setShowNumpad(false);setNpVal("");}
                  else if(k==="⌫")setNpVal(v=>v.slice(0,-1));
                  else if(npVal.length<5)setNpVal(v=>v+k);
                }} style={{width:88,height:88,borderRadius:18,background:k==="OK"?AMBER:"#333",color:"#FFF",fontSize:28,fontWeight:"bold",border:"none",cursor:"pointer"}}>{k}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── PANNELLO RISULTATI 220px ── */}
      <div style={{width:220,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5}}>Risultati tecnici</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>

          {/* Uw */}
          <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`1px solid ${BDR}`}}>
            <div style={{fontSize:9,color:SUB,marginBottom:2}}>Trasmittanza Uw (EN 14351)</div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:24,fontWeight:900,fontFamily:FM,color:uwC}}>{output.uw}</span>
              <span style={{fontSize:11,color:SUB}}>W/m²K</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
              <div style={{background:uwC,color:"#fff",fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:4}}>{output.classeEnergetica}</div>
              <span style={{fontSize:10,color:SUB}}>Ug medio: {output.ugMedio}</span>
            </div>
          </div>

          {/* Superfici */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.4,marginBottom:5}}>Superfici</div>
            {[["Area tot.",`${output.areaTotMq} m²`],["Area vetro",`${output.areaVetroMq} m²`],["ML profili",`${output.mlTotale} m`],["Celle",`${inf.griglia.celle.length} pz`]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #F3F4F6"}}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Produzione */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.4,marginBottom:5}}>Produzione</div>
            {[["Peso vetri",`${output.pesoVetriKg} kg`],["Peso tot.",`${output.pesoTotaleKg} kg`],["Barre 6m",`${output.nBarre6m} pz`],["Sfrido",`${output.sfrido}%`],["Ore stim.",`${output.mlTotale} h`]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:"1px solid #F3F4F6"}}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Distinta celle */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.4,marginBottom:5}}>Celle configurate</div>
            {inf.griglia.celle.map(c=>(
              <div key={c.id} onClick={()=>setInf(p=>({...p,_cellaSel:p._cellaSel===c.id?null:c.id}))}
                style={{padding:"4px 6px",marginBottom:2,borderRadius:6,cursor:"pointer",
                  background:inf._cellaSel===c.id?AMBER+"18":"#F9FAFB",
                  border:`1px solid ${inf._cellaSel===c.id?AMBER:BDR}`}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,fontWeight:700,color:DARK}}>Cella {c.id}</span>
                  <span style={{fontSize:10,color:TEAL,fontWeight:600}}>{c.tipo.replace("_"," ")}</span>
                </div>
                <div style={{fontSize:10,color:SUB}}>{c.larghezzaNetta}×{c.altezzaNetta} mm · {c.vetro?.label||"—"}</div>
              </div>
            ))}
          </div>

          {/* Alert */}
          {output.rischioBrinamento&&(
            <div style={{padding:"7px 10px",background:"#FEF3C7",borderRadius:8,border:"1px solid #FCD34D"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#92400E"}}>⚠ Rischio condensa</div>
              <div style={{fontSize:10,color:"#78350F",marginTop:2}}>Punto di rugiada insufficiente</div>
            </div>
          )}
        </div>

        {/* Footer preventivo */}
        <div style={{borderTop:`1px solid ${BDR}`,padding:"10px 12px",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Preventivo</div>
          {[["Vetri",`€${output.costoVetri.toLocaleString("it-IT")}`],["Profili",`€${(output.costoProfiloTelaio+output.costoProfiloAnte).toLocaleString("it-IT")}`],["Ferramenta",`€${output.costoFerramenta.toLocaleString("it-IT")}`]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:SUB}}>{l}</span>
              <span style={{fontSize:11,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:`1px solid ${BDR}`,marginTop:2}}>
            <span style={{fontSize:11,fontWeight:700}}>Vendita</span>
            <span style={{fontSize:18,fontWeight:900,fontFamily:FM,color:AMBER}}>€{output.prezzoVendita.toLocaleString("it-IT")}</span>
          </div>
          <button onClick={()=>{onUpdate?.({infisso:inf,output});}} style={{
            marginTop:8,width:"100%",padding:"8px 0",border:"none",borderRadius:8,
            background:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"
          }}>Salva configurazione</button>
        </div>
      </div>
    </div>
  );
}
