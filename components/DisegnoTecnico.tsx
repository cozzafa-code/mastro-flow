"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO APEX V150 — [SIDEBAR | CANVAS | RISULTATI]
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useEffect } from "react";

const AMBER = "#D08008"; const DARK = "#1A1A1C"; const TEAL = "#1A9E73";
const BDR = "#E5E7EB"; const SUB = "#6B7280"; const RED = "#DC4444";
const FF = "Inter, system-ui, sans-serif"; const FM = "JetBrains Mono, monospace";

const DB = {
  SISTEMI: {
    ALLUMINIO: { sp: 65, costoMl: 28.5, uf: 2.1, col: "#1A1A1C" },
    PVC:       { sp: 85, costoMl: 18.2, uf: 0.8, col: "#F2F1EC" },
    LEGNO:     { sp: 80, costoMl: 72.0, uf: 1.0, col: "#4E342E" }
  },
  VETRI: [
    { id: "std",   label: "Vetro standard",              pesoMq: 20, costoMq: 55,  ug: 1.1, ps: 12 },
    { id: "lam",   label: "Lastra stratificata singola", pesoMq: 32, costoMq: 115, ug: 1.1, ps: 14 },
    { id: "rifl",  label: "Vetro riflettente",           pesoMq: 25, costoMq: 130, ug: 1.0, ps: 13 },
    { id: "tri",   label: "Vetro triplo",                pesoMq: 45, costoMq: 195, ug: 0.5, ps: 18 },
    { id: "cam",   label: "Vetri camera",                pesoMq: 22, costoMq: 75,  ug: 0.9, ps: 14 },
    { id: "anti",  label: "Antisfondamento",             pesoMq: 38, costoMq: 210, ug: 1.0, ps: 15 },
  ],
  TIPI: ["vuoto", "fisso", "anta_ar", "anta_al", "porta", "wasistas"]
};

const INP = { padding: "5px 8px", border: `1px solid ${BDR}`, borderRadius: 6, fontSize: 13,
  fontWeight: 700, fontFamily: FM, outline: "none", boxSizing: "border-box", width: "100%" };

export default function DisegnoTecnico({ realW, realH, vanoNome, onUpdate, onClose, mode: modeProp = "industrial" }: any) {
  const [L, setL] = useState(parseInt(realW) || 1500);
  const [H, setH] = useState(parseInt(realH) || 2100);
  const [sistema, setSistema] = useState("ALLUMINIO");
  const [montanti, setMontanti] = useState([{ id: "m1", x: (parseInt(realW)||1500) / 2 }]);
  const [traversi, setTraversi] = useState([]);
  const [config, setConfig] = useState({});
  const [vetriConfig, setVetriConfig] = useState({});
  const [mode, setMode] = useState(modeProp);
  const [selVetro, setSelVetro] = useState("std");
  const [selCella, setSelCella] = useState(null);
  const [showNumpad, setShowNumpad] = useState(false);
  const [npValue, setNpValue] = useState("");
  const [npTarget, setNpTarget] = useState(null);
  const [dragging, setDragging] = useState(null);
  const svgRef = useRef(null);
  const spP = DB.SISTEMI[sistema].sp;

  useEffect(() => {
    const w = parseInt(realW), h = parseInt(realH);
    if (w && w !== L) setL(w);
    if (h && h !== H) setH(h);
  }, [realW, realH]);

  const grid = useMemo(() => {
    const xPts = [spP, ...montanti.map(m => m.x), L - spP].sort((a,b)=>a-b);
    const yPts = [spP, ...traversi.map(t => t.y), H - spP].sort((a,b)=>a-b);
    const cells = [];
    for (let iy = 0; iy < yPts.length-1; iy++) {
      for (let ix = 0; ix < xPts.length-1; ix++) {
        const key = `${ix}-${iy}`;
        const cw = xPts[ix+1]-xPts[ix]-(ix===0||ix===xPts.length-2?spP/2:spP);
        const ch = yPts[iy+1]-yPts[iy]-(iy===0||iy===yPts.length-2?spP/2:spP);
        const vId = vetriConfig[key] || "std";
        const vd = DB.VETRI.find(v=>v.id===vId);
        const mq = (cw*ch)/1000000;
        cells.push({ key, x: xPts[ix]+(ix>0?spP/2:0), y: yPts[iy]+(iy>0?spP/2:0),
          w: cw, h: ch, mq, tipo: config[key]||"vuoto", vId,
          peso: Math.round(mq*vd.pesoMq), ug: vd.ug, rugiada: vd.ps<13, costoV: Math.round(mq*vd.costoMq) });
      }
    }
    return cells;
  }, [montanti, traversi, L, H, config, vetriConfig, spP]);

  const stats = useMemo(() => {
    const ml = (L*2+H*2+montanti.length*H+traversi.length*L)/1000;
    const nBarre = Math.ceil(ml/6);
    const costoV = grid.reduce((a,c)=>a+c.costoV,0);
    const costoP = Math.round(ml*DB.SISTEMI[sistema].costoMl);
    const mq = grid.reduce((a,c)=>a+c.mq,0);
    const uwNom = DB.SISTEMI[sistema].uf;
    const ugMed = grid.length ? (grid.reduce((a,c)=>a+c.ug*c.mq,0)/mq).toFixed(2) : "—";
    return {
      mq: mq.toFixed(2), ml: ml.toFixed(2),
      nBarre, sfrido: (((nBarre*6)-ml)/(nBarre*6)*100).toFixed(1),
      peso: grid.reduce((a,c)=>a+c.peso,0),
      ore: (ml*0.8).toFixed(1),
      costoV, costoP, costoTot: costoV+costoP,
      prezzoFin: Math.round((costoV+costoP)*2.4),
      uw: uwNom, ugMed,
      condensa: grid.some(c=>c.rugiada),
      celle: grid.length
    };
  }, [L, H, montanti, traversi, grid, sistema]);

  const sendUpdate = (nL=L, nH=H) => onUpdate?.({ L:nL, H:nH, montanti, traversi, config, vetriConfig, sistema, stats });

  const addMont = () => setMontanti(p=>[...p,{id:`m${Date.now()}`,x:Math.round(L/(p.length+2)*(p.length+1))}]);
  const addTrav = () => setTraversi(p=>[...p,{id:`t${Date.now()}`,y:Math.round(H/(p.length+2)*(p.length+1))}]);
  const delMont = () => { if(montanti.length>0){setMontanti(p=>p.slice(0,-1));} };
  const delTrav = () => { if(traversi.length>0){setTraversi(p=>p.slice(0,-1));} };

  const isMkt = mode==="marketing";
  const stroke = isMkt ? AMBER : DARK;
  const canvasBg = isMkt ? DARK : "#F8FAFC";

  // ── SIDEBAR ────────────────────────────────────────────────
  const renderSidebar = () => (
    <div style={{width:220,flexShrink:0,background:"#fff",borderRight:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:FF}}>
      {/* Header */}
      <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {vanoNome||"Vano CAD"}
        </div>
        {/* Toggle */}
        <div style={{display:"flex",background:"#F3F4F6",borderRadius:8,padding:2}}>
          {["industrial","marketing"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{
              flex:1,padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",
              fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.3,
              background:mode===m?(m==="marketing"?AMBER:DARK):"transparent",
              color:mode===m?"#fff":SUB,transition:"all .15s"
            }}>{m==="industrial"?"TECNICO":"MKT"}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"12px",display:"flex",flexDirection:"column",gap:14}}>

        {/* Dimensioni */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Dimensioni</div>
          <div style={{display:"flex",gap:6}}>
            <div style={{flex:1}}>
              <div style={{fontSize:9,color:SUB,marginBottom:2}}>Largh. mm</div>
              <input type="number" value={L} style={INP} onChange={e=>{const v=parseInt(e.target.value);if(v>0){setL(v);sendUpdate(v,H);}}}/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:9,color:SUB,marginBottom:2}}>Altez. mm</div>
              <input type="number" value={H} style={INP} onChange={e=>{const v=parseInt(e.target.value);if(v>0){setH(v);sendUpdate(L,v);}}}/>
            </div>
          </div>
        </div>

        {/* Profilo */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Profilo</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {Object.keys(DB.SISTEMI).map(s=>(
              <button key={s} onClick={()=>{setSistema(s);sendUpdate();}} style={{
                padding:"6px 10px",border:`1.5px solid ${sistema===s?AMBER:BDR}`,borderRadius:7,
                background:sistema===s?AMBER+"18":"#fff",fontSize:12,fontWeight:sistema===s?700:400,
                color:sistema===s?AMBER:DARK,cursor:"pointer",textAlign:"left",transition:"all .1s"
              }}>
                {s} <span style={{fontSize:10,color:SUB,fontWeight:400}}>sp.{DB.SISTEMI[s].sp}mm</span>
              </button>
            ))}
          </div>
        </div>

        {/* Struttura */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Struttura</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {[["+ Mont.",addMont,DARK,false],["− Mont.",delMont,RED,montanti.length===0],
              ["+ Trav.",addTrav,DARK,false],["− Trav.",delTrav,RED,traversi.length===0]
            ].map(([lbl,fn,col,dis])=>(
              <button key={lbl} onClick={fn} disabled={dis} style={{
                padding:"6px 2px",border:`1px solid ${BDR}`,borderRadius:6,
                fontSize:11,cursor:dis?"default":"pointer",background:"#F9FAFB",color:dis?"#CCC":col
              }}>{lbl}</button>
            ))}
          </div>
          <div style={{fontSize:10,color:SUB,marginTop:4}}>{montanti.length} mont. · {traversi.length} trav.</div>
        </div>

        {/* Vetro — SELECT dropdown */}
        <div>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>Tipo vetro</div>
          <select value={selVetro} onChange={e=>setSelVetro(e.target.value)} style={{
            width:"100%",padding:"7px 10px",border:`1.5px solid ${TEAL}`,borderRadius:7,
            fontSize:12,fontWeight:600,color:DARK,background:"#fff",cursor:"pointer",outline:"none",
            boxSizing:"border-box"
          }}>
            {DB.VETRI.map(v=>(
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
          {selCella ? (
            <button onClick={()=>{setVetriConfig(p=>({...p,[selCella]:selVetro}));sendUpdate();}} style={{
              marginTop:6,width:"100%",padding:"7px 0",border:"none",borderRadius:7,
              background:TEAL,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"
            }}>Applica a cella {selCella} →</button>
          ) : (
            <div style={{fontSize:10,color:SUB,marginTop:5,fontStyle:"italic"}}>Clicca cella nel canvas</div>
          )}
          <button onClick={()=>{const all={};grid.forEach(c=>{all[c.key]=selVetro;});setVetriConfig(all);sendUpdate();}} style={{
            marginTop:4,width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,
            background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"
          }}>Applica a tutte le celle</button>
        </div>

      </div>
    </div>
  );

  // ── PANNELLO RISULTATI ─────────────────────────────────────
  const renderRisultati = () => {
    const uwC = parseFloat(stats.uw)<1.0?"#1A9E73":parseFloat(stats.uw)<1.4?"#D08008":"#DC4444";
    return (
      <div style={{width:200,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden",fontFamily:FF}}>
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5}}>Risultati</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:10}}>

          {/* Uw */}
          <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`1px solid ${BDR}`}}>
            <div style={{fontSize:9,color:SUB,marginBottom:2}}>Trasmittanza Uw</div>
            <div style={{display:"flex",alignItems:"baseline",gap:4}}>
              <span style={{fontSize:22,fontWeight:900,fontFamily:FM,color:uwC}}>{stats.uw}</span>
              <span style={{fontSize:11,color:SUB}}>W/m²K</span>
            </div>
            <div style={{fontSize:9,color:uwC,marginTop:1,fontWeight:600}}>
              {parseFloat(stats.uw)<1.0?"Eccellente":parseFloat(stats.uw)<1.4?"Buono (A)":"Standard"}
            </div>
          </div>

          {/* Ug medio */}
          <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`1px solid ${BDR}`}}>
            <div style={{fontSize:9,color:SUB,marginBottom:2}}>Ug medio vetri</div>
            <div style={{fontSize:16,fontWeight:800,fontFamily:FM,color:DARK}}>{stats.ugMed} <span style={{fontSize:11,fontWeight:400}}>W/m²K</span></div>
          </div>

          {/* Superfici */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Superfici</div>
            {[["Sup. netta",`${stats.mq} m²`],["ML profili",`${stats.ml} m`],["Celle",`${stats.celle}`]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid #F3F4F6`}}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM,color:DARK}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Produzione */}
          <div>
            <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:5}}>Produzione</div>
            {[["Peso vetri",`${stats.peso} kg`],["Barre 6m",`${stats.nBarre} pz`],["Sfrido",`${stats.sfrido}%`],["Ore stimata",`${stats.ore}h`]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:`1px solid #F3F4F6`}}>
                <span style={{fontSize:11,color:SUB}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,fontFamily:FM,color:DARK}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Alert condensa */}
          {stats.condensa && (
            <div style={{padding:"7px 10px",background:"#FEF3C7",borderRadius:8,border:"1px solid #FCD34D"}}>
              <div style={{fontSize:11,fontWeight:700,color:"#92400E"}}>⚠ Rischio condensa</div>
              <div style={{fontSize:10,color:"#78350F",marginTop:2}}>Punto di rugiada basso su vetro standard</div>
            </div>
          )}
        </div>

        {/* Footer preventivo */}
        <div style={{borderTop:`1px solid ${BDR}`,padding:"10px 12px",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8}}>Preventivo</div>
          {[["Vetri",`€${stats.costoV.toLocaleString("it-IT")}`],["Profili",`€${stats.costoP.toLocaleString("it-IT")}`]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:SUB}}>{l}</span>
              <span style={{fontSize:12,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:`1px solid ${BDR}`,marginTop:3}}>
            <span style={{fontSize:11,fontWeight:700}}>Vendita</span>
            <span style={{fontSize:17,fontWeight:900,fontFamily:FM,color:AMBER}}>€{stats.prezzoFin.toLocaleString("it-IT")}</span>
          </div>
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ────────────────────────────────────────────
  return (
    <div style={{width:"100%",height:"100%",display:"flex",flexDirection:"row",overflow:"hidden",fontFamily:FF}}>

      {renderSidebar()}

      {/* CANVAS */}
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
        overflow:"hidden",background:canvasBg,transition:"background .3s",minWidth:0}}
        onMouseMove={e=>{
          if(!dragging||!svgRef.current)return;
          const CTM=svgRef.current.getScreenCTM();
          const pt={x:(e.clientX-CTM.e)/CTM.a,y:(e.clientY-CTM.f)/CTM.d};
          if(dragging.type==="m") setMontanti(p=>p.map(m=>m.id===dragging.id?{...m,x:Math.round(Math.max(spP*2,Math.min(L-spP*2,pt.x)))}:m));
          else setTraversi(p=>p.map(t=>t.id===dragging.id?{...t,y:Math.round(Math.max(spP*2,Math.min(H-spP*2,pt.y)))}:t));
        }}
        onMouseUp={()=>{if(dragging)sendUpdate();setDragging(null);}}>

        <svg ref={svgRef} width="90%" height="90%" viewBox={`-200 -250 ${L+400} ${H+500}`} preserveAspectRatio="xMidYMid meet">
          <defs><marker id="arr" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill={stroke}/></marker></defs>

          <g fill="none" stroke={stroke} strokeWidth={isMkt?6:2}>
            <rect x={0} y={0} width={L} height={H}/>
            <line x1={0} y1={0} x2={spP} y2={spP}/><line x1={L} y1={0} x2={L-spP} y2={spP}/>
            <line x1={0} y1={H} x2={spP} y2={H-spP}/><line x1={L} y1={H} x2={L-spP} y2={H-spP}/>
          </g>

          {grid.map(c=>(
            <g key={c.key} style={{cursor:"pointer"}} onClick={()=>{
              if(selCella===c.key){
                const next=DB.TIPI[(DB.TIPI.indexOf(c.tipo)+1)%DB.TIPI.length];
                setConfig({...config,[c.key]:next});sendUpdate();
              } else setSelCella(c.key);
            }}>
              <rect x={c.x} y={c.y} width={c.w} height={c.h}
                fill={selCella===c.key?AMBER+"22":"transparent"}
                stroke={selCella===c.key?AMBER:stroke}
                strokeWidth={selCella===c.key?4:1} strokeOpacity={selCella===c.key?1:0.25}/>
              <text x={c.x+c.w/2} y={c.y+c.h/2-30} textAnchor="middle" fontSize="38" fontWeight="bold" fill={stroke} opacity="0.3">{c.tipo.toUpperCase()}</text>
              <text x={c.x+c.w/2} y={c.y+c.h/2+30} textAnchor="middle" fontSize="28" fill={TEAL} opacity="0.6">{DB.VETRI.find(v=>v.id===c.vId)?.label}</text>
            </g>
          ))}

          {montanti.map(m=><rect key={m.id} x={m.x-spP/2} y={0} width={spP} height={H} fill={AMBER} opacity="0.85" style={{cursor:"ew-resize"}} onMouseDown={()=>setDragging({id:m.id,type:"m"})}/>)}
          {traversi.map(t=><rect key={t.id} x={0} y={t.y-spP/2} width={L} height={spP} fill={AMBER} opacity="0.85" style={{cursor:"ns-resize"}} onMouseDown={()=>setDragging({id:t.id,type:"t"})}/>)}

          <g cursor="pointer" onClick={()=>{setNpTarget("L");setShowNumpad(true);setNpValue(L.toString());}}>
            <text x={L/2} y="-150" textAnchor="middle" fontSize="180" fontWeight="900" fill={stroke}>{L} mm</text>
            <path d={`M 0 -100 H ${L}`} stroke={stroke} strokeWidth="8" markerStart="url(#arr)" markerEnd="url(#arr)"/>
          </g>
          <g cursor="pointer" onClick={()=>{setNpTarget("H");setShowNumpad(true);setNpValue(H.toString());}}>
            <text x="-200" y={H/2} textAnchor="middle" fontSize="180" fontWeight="900" fill={stroke} transform={`rotate(-90,-200,${H/2})`}>{H} mm</text>
            <path d={`M -140 0 V ${H}`} stroke={stroke} strokeWidth="8" markerStart="url(#arr)" markerEnd="url(#arr)"/>
          </g>
        </svg>

        {showNumpad&&(
          <div style={{position:"absolute",background:DARK,padding:40,borderRadius:40,border:`10px solid ${AMBER}`,zIndex:9999,boxShadow:"0 0 100px rgba(0,0,0,0.8)"}}>
            <div style={{fontSize:100,color:AMBER,textAlign:"right",borderBottom:"4px solid #333",marginBottom:30,fontWeight:900}}>{npValue||"0"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:20}}>
              {[1,2,3,4,5,6,7,8,9,"⌫",0,"OK"].map(k=>(
                <button key={k} onClick={()=>{
                  if(k==="OK"){const v=parseInt(npValue);if(v>0){if(npTarget==="L"){setL(v);sendUpdate(v,H);}else{setH(v);sendUpdate(L,v);}}setShowNumpad(false);setNpValue("");}
                  else if(k==="⌫")setNpValue(v=>v.slice(0,-1));
                  else if(npValue.length<5)setNpValue(v=>v+k);
                }} style={{width:100,height:100,borderRadius:20,background:k==="OK"?AMBER:"#333",color:"#FFF",fontSize:32,fontWeight:"bold",border:"none",cursor:"pointer"}}>{k}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {renderRisultati()}
    </div>
  );
}
