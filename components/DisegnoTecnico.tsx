"use client";
// @ts-nocheck
// MASTRO — DisegnoTecnico v8
// Base: MastroConstructorIndustrial + integrazione MASTRO completa
// Griglia montanti/traversi drag&drop + celle configurabili + profili da Supabase
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Catalogo default (override da Supabase) ────────────────────
const CATALOGO_DEFAULT = {
  PROFILI: { sp: 65, costoMl: 12.5, pesoMl: 1.8, col: "#374151" },
  VETRI: [
    { id: "4-16-4",       label: "4-16-4 Standard",    pesoMq: 20, costoMq: 45  },
    { id: "33.1-12-33.1", label: "Antisfondamento",     pesoMq: 32, costoMq: 85  },
    { id: "4-12-4-12-4",  label: "Triplo Vetro",        pesoMq: 30, costoMq: 110 },
    { id: "6-16-6",       label: "6-16-6 Rinforzato",   pesoMq: 28, costoMq: 65  },
  ],
  TIPI_CELLA: ["vuoto","fisso","anta_ar","anta_ab","wasistas","scorrevole","porta","cieco"],
};

const TIPI_LABEL: Record<string, string> = {
  vuoto:"—", fisso:"FIX", anta_ar:"A-R", anta_ab:"A-B",
  wasistas:"WAS", scorrevole:"SC", porta:"PRT", cieco:"CIE",
};

const TIPI_COLOR: Record<string, string> = {
  vuoto:"transparent", fisso:"#EFF6FF", anta_ar:"#F0FDF4", anta_ab:"#FFF7ED",
  wasistas:"#FAF5FF", scorrevole:"#F0F9FF", porta:"#FEF3C7", cieco:"#F1F5F9",
};

// ── Hook profili da Supabase ───────────────────────────────────
function useProfiliDB(sistema: string) {
  const [spessore, setSpessore] = useState(65);
  const [vetriDB, setVetriDB]   = useState<any[]>([]);
  useEffect(() => {
    if (!sistema) return;
    supabase.from("profili_sezioni").select("larghezza_mm,tipo").eq("sistema", sistema).eq("attivo", true)
      .then(({ data }) => {
        const tel = data?.find(p => p.tipo === "telaio");
        if (tel?.larghezza_mm) setSpessore(tel.larghezza_mm);
      });
    supabase.from("vetri").select("id,nome,spessore,costo_mq,peso_mq").eq("attivo", true)
      .then(({ data }) => { if (data?.length) setVetriDB(data.map(v => ({ id: v.id, label: v.nome, pesoMq: v.peso_mq||20, costoMq: v.costo_mq||45 }))); });
  }, [sistema]);
  return { spessore, vetriDB };
}

// ── Tratteggio apertura ────────────────────────────────────────
function CellApertura({ tipo, x, y, w, h }: any) {
  const cx = x + w/2, cy = y + h/2;
  const g = (ch: any) => <g stroke="#555" strokeWidth={0.8} strokeDasharray="5,3" fill="none" opacity={0.7}>{ch}</g>;
  if (tipo === "anta_ar") return g(<><line x1={x} y1={y} x2={cx} y2={cy}/><line x1={x} y1={y+h} x2={cx} y2={cy}/><path d={`M${x} ${y+h} A${w/2} ${Math.min(w*0.36,40)} 0 0 0 ${x+w} ${y+h}`}/></>);
  if (tipo === "anta_ab") return g(<><line x1={x} y1={y+h} x2={cx} y2={y}/><line x1={x+w} y1={y+h} x2={cx} y2={y}/><path d={`M${x} ${y+h} A${w*0.4} ${w*0.4} 0 0 1 ${x+w} ${y+h}`}/></>);
  if (tipo === "wasistas") return g(<><line x1={x} y1={y+h} x2={cx} y2={y}/><line x1={x+w} y1={y+h} x2={cx} y2={y}/><path d={`M${x} ${y+h} A${w*0.5} ${Math.min(w*0.35,35)} 0 0 1 ${x+w} ${y+h}`}/></>);
  if (tipo === "scorrevole") return <g><line x1={cx-15} y1={cy} x2={cx+15} y2={cy} stroke="#3B7FE0" strokeWidth={1.5}/><polygon points={`${cx+15},${cy-4} ${cx+21},${cy} ${cx+15},${cy+4}`} fill="#3B7FE0"/></g>;
  if (tipo === "porta") return <g><rect x={x+w*0.3} y={y+h*0.7} width={w*0.4} height={h*0.3} fill="none" stroke="#D08008" strokeWidth={1}/><circle cx={x+w*0.35} cy={cy+h*0.1} r={2} fill="#D08008"/></g>;
  return null;
}

// ── Main Component ─────────────────────────────────────────────
interface Props {
  vanoNome?: string; vanoDisegno?: any; realW: number; realH: number;
  onUpdate?: (d: any) => void; onUpdateField?: (f: string, v: any) => void;
  onClose?: () => void; T?: any; sistemiDB?: any[];
}

export default function DisegnoTecnico({
  vanoNome = "Vano", vanoDisegno, realW, realH,
  onUpdate, onUpdateField, onClose, T, sistemiDB = [],
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<{ id: string; type: "m"|"t" } | null>(null);

  const [L, setL] = useState(parseInt(String(realW)) || 1200);
  const [H, setH] = useState(parseInt(String(realH)) || 2100);
  const [sistema, setSistema]     = useState(vanoDisegno?.sistema || "");
  const [montanti, setMontanti]   = useState<any[]>(vanoDisegno?.montanti || []);
  const [traversi, setTraversi]   = useState<any[]>(vanoDisegno?.traversi || []);
  const [config, setConfig]       = useState<any>(vanoDisegno?.config || {});
  const [vetriCfg, setVetriCfg]   = useState<any>(vanoDisegno?.vetriCfg || {});
  const [showQuote, setShowQuote] = useState(true);
  const [showSez, setShowSez]     = useState(true);
  const [dragging, setDragging]   = useState(false);

  const { spessore, vetriDB } = useProfiliDB(sistema);
  const spP = Math.max(14, spessore);
  const vetriList = vetriDB.length > 0 ? vetriDB : CATALOGO_DEFAULT.VETRI;

  useEffect(() => { setL(parseInt(String(realW)) || 1200); }, [realW]);
  useEffect(() => { setH(parseInt(String(realH)) || 2100); }, [realH]);

  const save = useCallback((patch: any = {}) => {
    onUpdate?.({ ...vanoDisegno, sistema, montanti, traversi, config, vetriCfg, ...patch });
  }, [vanoDisegno, sistema, montanti, traversi, config, vetriCfg, onUpdate]);

  // ── Griglia ──────────────────────────────────────────────────
  const grid = useMemo(() => {
    const xPts = [spP, ...montanti.map((m: any) => m.x), L - spP].sort((a, b) => a - b);
    const yPts = [spP, ...traversi.map((t: any) => t.y), H - spP].sort((a, b) => a - b);
    const cells: any[] = [];
    for (let iy = 0; iy < yPts.length - 1; iy++) {
      for (let ix = 0; ix < xPts.length - 1; ix++) {
        const key = `${ix}-${iy}`;
        const cw = xPts[ix+1] - xPts[ix] - (ix === 0 || ix === xPts.length-2 ? spP/2 : spP);
        const ch = yPts[iy+1] - yPts[iy] - (iy === 0 || iy === yPts.length-2 ? spP/2 : spP);
        const vetroId = vetriCfg[key] || vetriList[0]?.id;
        const vetroDati = vetriList.find((v: any) => v.id === vetroId);
        cells.push({
          key, tipo: config[key] || "vuoto",
          x: xPts[ix] + (ix > 0 ? spP/2 : 0),
          y: yPts[iy] + (iy > 0 ? spP/2 : 0),
          w: cw, h: ch,
          wMm: Math.round(cw), hMm: Math.round(ch),
          pesoVetro: Math.round((cw * ch / 1000000) * (vetroDati?.pesoMq || 20)),
          costoVetro: Math.round((cw * ch / 1000000) * (vetroDati?.costoMq || 45)),
        });
      }
    }
    return cells;
  }, [montanti, traversi, L, H, config, vetriCfg, spP, vetriList]);

  const costoProfili = useMemo(() => {
    const ml = (L * 2 + H * 2 + montanti.length * H + traversi.length * L) / 1000;
    return Math.round(ml * (CATALOGO_DEFAULT.PROFILI.costoMl));
  }, [L, H, montanti, traversi]);

  const costoTotale = grid.reduce((acc: number, c: any) => acc + (c.tipo !== "vuoto" ? c.costoVetro : 0), 0) + costoProfili;
  const pesoTotale  = grid.reduce((acc: number, c: any) => acc + c.pesoVetro, 0);

  // ── Drag ──────────────────────────────────────────────────────
  const SC = Math.min(0.35, 500 / Math.max(L, H));
  const PAD = 60;

  const getSvgPt = (e: any) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (e.clientX - r.left - PAD) / SC, y: (e.clientY - r.top - PAD) / SC };
  };

  const handleMouseMove = useCallback((e: any) => {
    if (!draggingRef.current) return;
    const pt = getSvgPt(e);
    if (draggingRef.current.type === "m") {
      setMontanti(prev => prev.map((m: any) => m.id === draggingRef.current!.id
        ? { ...m, x: Math.round(Math.max(spP*2, Math.min(L - spP*2, pt.x))) } : m));
    } else {
      setTraversi(prev => prev.map((t: any) => t.id === draggingRef.current!.id
        ? { ...t, y: Math.round(Math.max(spP*2, Math.min(H - spP*2, pt.y))) } : t));
    }
  }, [L, H, spP]);

  const handleMouseUp = useCallback(() => {
    if (draggingRef.current) { draggingRef.current = null; setDragging(false); save(); }
  }, [save]);

  const startDrag = (id: string, type: "m"|"t", e: any) => {
    e.stopPropagation(); draggingRef.current = { id, type }; setDragging(true);
  };

  const toggleCella = (key: string) => {
    const tipi = CATALOGO_DEFAULT.TIPI_CELLA;
    const next = tipi[(tipi.indexOf(config[key] || "vuoto") + 1) % tipi.length];
    const nc = { ...config, [key]: next };
    setConfig(nc); save({ config: nc });
  };

  const svgW = L * SC + PAD * 2;
  const svgH = H * SC + PAD * 2;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#F2F1EC", fontFamily:"'Inter',sans-serif", userSelect:"none" }}
      onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>

      {/* Toolbar */}
      <div style={{ background:"#fff", borderBottom:"1px solid #E0DED8", padding:"8px 12px", display:"flex", alignItems:"center", gap:8, flexShrink:0, flexWrap:"wrap" }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#1A1A1C", marginRight:4 }}>{vanoNome}</span>
        <span style={{ fontSize:11, color:"#D08008", fontWeight:700, fontFamily:"monospace" }}>{L} × {H} mm</span>
        <div style={{ width:1, height:16, background:"#E0DED8" }}/>

        {/* Aggiungi profili */}
        <button onClick={() => { const m={id:"m"+Date.now(),x:Math.round(L/2)};setMontanti(p=>[...p,m]);save({montanti:[...montanti,m]}); }}
          style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #E0DED8", background:"#F2F1EC", fontSize:11, cursor:"pointer", fontWeight:600 }}>+ Montante</button>
        <button onClick={() => { const t={id:"t"+Date.now(),y:Math.round(H/2)};setTraversi(p=>[...p,t]);save({traversi:[...traversi,t]}); }}
          style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #E0DED8", background:"#F2F1EC", fontSize:11, cursor:"pointer", fontWeight:600 }}>+ Traverso</button>

        {montanti.length > 0 && <button onClick={() => { const m=[...montanti.slice(0,-1)];setMontanti(m);save({montanti:m}); }}
          style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #FFAAAA", background:"#FFF0F0", fontSize:11, cursor:"pointer", color:"#CC2222" }}>− Mont.</button>}
        {traversi.length > 0 && <button onClick={() => { const t=[...traversi.slice(0,-1)];setTraversi(t);save({traversi:t}); }}
          style={{ padding:"4px 10px", borderRadius:6, border:"1px solid #FFAAAA", background:"#FFF0F0", fontSize:11, cursor:"pointer", color:"#CC2222" }}>− Trav.</button>}

        <div style={{ width:1, height:16, background:"#E0DED8" }}/>

        {/* Quote / Sezione */}
        {[{l:"Quote",v:showQuote,s:setShowQuote},{l:"Sez.",v:showSez,s:setShowSez}].map(({l,v,s})=>(
          <div key={l} onClick={()=>s((x:boolean)=>!x)} style={{ padding:"4px 10px", borderRadius:6, fontSize:11, cursor:"pointer", background:v?"#D08008":"#F2F1EC", color:v?"#fff":"#6B7280", border:`1px solid ${v?"#D08008":"#E0DED8"}`, fontWeight:v?700:400 }}>{l}</div>
        ))}

        {/* Sistema */}
        {sistemiDB.length > 0 && (
          <select value={sistema} onChange={e=>{setSistema(e.target.value);save({sistema:e.target.value});}}
            style={{ padding:"4px 8px", borderRadius:6, border:"1px solid #E0DED8", background:"#fff", fontSize:11, color:"#1A1A1C" }}>
            <option value="">— Sistema —</option>
            {sistemiDB.map((s:any)=><option key={s.id} value={s.marca+" "+s.sistema}>{s.marca} {s.sistema}</option>)}
          </select>
        )}

        {/* Costi live */}
        <div style={{ marginLeft:"auto", display:"flex", gap:12, alignItems:"center" }}>
          <span style={{ fontSize:10, color:"#6B7280" }}>{pesoTotale} kg</span>
          <span style={{ fontSize:13, fontWeight:700, color:"#1A9E73" }}>€ {costoTotale.toLocaleString("it-IT")}</span>
        </div>

        {onClose && <div onClick={onClose} style={{ padding:"4px 10px", borderRadius:6, background:"#FFF0F0", border:"1px solid #FFAAAA", color:"#CC2222", fontSize:11, cursor:"pointer" }}>✕</div>}
      </div>

      {/* Canvas + Pannello */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* SVG */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", overflow:"auto", padding:16, background:"#E8E6E0" }}>
          <svg ref={svgRef} width={svgW} height={svgH}
            style={{ display:"block", background:"#fff", border:"1px solid #CCCCCC", boxShadow:"2px 2px 10px rgba(0,0,0,0.1)", cursor:dragging?"grabbing":"default" }}>

            {/* Telaio esterno */}
            <rect x={PAD} y={PAD} width={L*SC} height={H*SC} fill="none" stroke="#000" strokeWidth={spP*SC*2}/>

            {/* Celle */}
            {grid.map((c:any) => {
              const cx2 = PAD + c.x * SC, cy2 = PAD + c.y * SC;
              const cw2 = c.w * SC, ch2 = c.h * SC;
              if (cw2 <= 0 || ch2 <= 0) return null;
              const fill = TIPI_COLOR[c.tipo] || "#F8F8F8";
              return (
                <g key={c.key} onClick={() => toggleCella(c.key)} style={{ cursor:"pointer" }}>
                  <rect x={cx2} y={cy2} width={cw2} height={ch2} fill={fill} stroke="#AAAAAA" strokeWidth={0.5}/>
                  {/* Vetro hatch per celle non vuote */}
                  {c.tipo !== "vuoto" && c.tipo !== "cieco" && (
                    <g>
                      <defs><clipPath id={`cl-${c.key}`}><rect x={cx2} y={cy2} width={cw2} height={ch2}/></clipPath></defs>
                      <g clipPath={`url(#cl-${c.key})`} opacity={0.3}>
                        {Array.from({length:Math.ceil((cw2+ch2)/10)},(_,i)=>(
                          <line key={i} x1={cx2+i*10-ch2} y1={cy2+ch2} x2={cx2+i*10} y2={cy2} stroke="#90B8D8" strokeWidth={0.5}/>
                        ))}
                      </g>
                    </g>
                  )}
                  {/* Tratteggio apertura */}
                  {c.tipo !== "vuoto" && c.tipo !== "cieco" && c.tipo !== "fisso" && (
                    <CellApertura tipo={c.tipo} x={cx2} y={cy2} w={cw2} h={ch2}/>
                  )}
                  {/* Label tipo */}
                  {c.tipo !== "vuoto" && (
                    <text x={cx2+cw2/2} y={cy2+ch2/2-6} textAnchor="middle" fontSize={Math.min(14,cw2/4)} fill="#374151" fontWeight="bold" fontFamily="monospace" pointerEvents="none">
                      {TIPI_LABEL[c.tipo]||c.tipo.toUpperCase()}
                    </text>
                  )}
                  {/* Misure cella */}
                  {c.w > 100 && c.h > 80 && (
                    <text x={cx2+cw2/2} y={cy2+ch2/2+10} textAnchor="middle" fontSize={Math.min(9,cw2/10)} fill="#888" fontFamily="monospace" pointerEvents="none">
                      {c.wMm}×{c.hMm}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Montanti draggabili */}
            {montanti.map((m:any) => (
              <g key={m.id}>
                <rect x={PAD + m.x*SC - spP*SC/2} y={PAD} width={spP*SC} height={H*SC}
                  fill="#374151" stroke="#1A1A1C" strokeWidth={0.5}
                  style={{ cursor:"ew-resize" }} onMouseDown={e=>startDrag(m.id,"m",e)}/>
                <text x={PAD + m.x*SC} y={PAD - 6} textAnchor="middle" fontSize={8} fill="#374151" fontFamily="monospace">{m.x}</text>
              </g>
            ))}

            {/* Traversi draggabili */}
            {traversi.map((t:any) => (
              <g key={t.id}>
                <rect x={PAD} y={PAD + t.y*SC - spP*SC/2} width={L*SC} height={spP*SC}
                  fill="#374151" stroke="#1A1A1C" strokeWidth={0.5}
                  style={{ cursor:"ns-resize" }} onMouseDown={e=>startDrag(t.id,"t",e)}/>
                <text x={PAD - 6} y={PAD + t.y*SC} textAnchor="end" fontSize={8} fill="#374151" fontFamily="monospace">{t.y}</text>
              </g>
            ))}

            {/* Quote */}
            {showQuote && (
              <g fill="#0055CC" stroke="#0055CC" strokeWidth={0.7} fontSize={11} fontFamily="monospace" fontWeight="bold">
                {/* Larghezza */}
                <line x1={PAD} y1={PAD-18} x2={PAD+L*SC} y2={PAD-18}/>
                <polygon points={`${PAD},${PAD-18} ${PAD+6},${PAD-20.5} ${PAD+6},${PAD-15.5}`}/>
                <polygon points={`${PAD+L*SC},${PAD-18} ${PAD+L*SC-6},${PAD-20.5} ${PAD+L*SC-6},${PAD-15.5}`}/>
                <text x={PAD+L*SC/2} y={PAD-22} textAnchor="middle" stroke="none">{L}</text>
                {/* Altezza */}
                <line x1={PAD-18} y1={PAD} x2={PAD-18} y2={PAD+H*SC}/>
                <polygon points={`${PAD-18},${PAD} ${PAD-20.5},${PAD+6} ${PAD-15.5},${PAD+6}`}/>
                <polygon points={`${PAD-18},${PAD+H*SC} ${PAD-20.5},${PAD+H*SC-6} ${PAD-15.5},${PAD+H*SC-6}`}/>
                <text x={PAD-22} y={PAD+H*SC/2} textAnchor="middle" stroke="none" transform={`rotate(-90,${PAD-22},${PAD+H*SC/2})`}>{H}</text>
              </g>
            )}

            {/* Sezione orizzontale */}
            {showSez && (()=>{
              const ox=svgW-112, oy=svgH-68, tW=18, aW=14, fW=4, glW=12, bH=42;
              return(<g transform={`translate(${ox},${oy})`} pointerEvents="none">
                <rect x={0} y={0} width={108} height={bH+22} fill="#fff" stroke="#333" strokeWidth={0.7} rx={2}/>
                <text x={3} y={9} fontSize={5.5} fill="#003399" fontFamily="monospace" fontWeight="bold">SEZ. ORIZZONTALE</text>
                <rect x={4} y={11} width={tW} height={bH-11} fill="#D1D5DB" stroke="#000" strokeWidth={0.8}/>
                <text x={4+tW/2} y={11+(bH-11)/2+2} textAnchor="middle" fontSize={4} fill="#333" fontFamily="monospace">T</text>
                <rect x={4+tW} y={13} width={aW} height={bH-15} fill="#F3F4F6" stroke="#000" strokeWidth={0.7}/>
                <text x={4+tW+aW/2} y={13+(bH-15)/2+2} textAnchor="middle" fontSize={4} fill="#333" fontFamily="monospace">A</text>
                <rect x={4+tW+aW} y={15} width={fW} height={bH-19} fill="#CCC" stroke="#333" strokeWidth={0.5}/>
                <rect x={4+tW+aW+fW} y={17} width={glW} height={bH-23} fill="#C8DFF0" stroke="#336688" strokeWidth={0.5}/>
                <rect x={4+tW+aW+fW+glW} y={15} width={fW} height={bH-19} fill="#CCC" stroke="#333" strokeWidth={0.5}/>
                <rect x={4+tW+aW+fW+glW+fW} y={13} width={aW} height={bH-15} fill="#F3F4F6" stroke="#000" strokeWidth={0.7}/>
                <rect x={4+tW+aW+fW+glW+fW+aW} y={11} width={tW} height={bH-11} fill="#D1D5DB" stroke="#000" strokeWidth={0.8}/>
                <line x1={4} y1={bH+15} x2={104} y2={bH+15} stroke="#0055CC" strokeWidth={0.5}/>
                <polygon points={`4,${bH+15} 8,${bH+13} 8,${bH+17}`} fill="#0055CC"/>
                <polygon points={`104,${bH+15} 100,${bH+13} 100,${bH+17}`} fill="#0055CC"/>
                <text x={54} y={bH+13} textAnchor="middle" fontSize={5.5} fill="#0055CC" fontFamily="monospace">{spP}mm</text>
              </g>);
            })()}

            <text x={svgW-8} y={svgH-6} textAnchor="end" fontSize={8} fill="#999" fontFamily="monospace" pointerEvents="none">Vista Interna</text>
          </svg>
        </div>

        {/* Pannello destra */}
        <div style={{ width:220, flexShrink:0, background:"#fff", borderLeft:"1px solid #E0DED8", padding:12, overflowY:"auto", display:"flex", flexDirection:"column", gap:10 }}>

          {/* Celle configurazione */}
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Celle ({grid.filter((c:any)=>c.tipo!=="vuoto").length}/{grid.length})</div>
            <div style={{ fontSize:9, color:"#9CA3AF", marginBottom:6 }}>Clicca una cella per cambiare tipo</div>
            {grid.map((c:any) => c.tipo !== "vuoto" && (
              <div key={c.key} style={{ padding:"5px 8px", borderRadius:6, background:"#F9FAFB", border:"1px solid #E0DED8", marginBottom:4, fontSize:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                  <span style={{ fontWeight:700, color:"#374151" }}>Cella {c.key}</span>
                  <span style={{ padding:"1px 6px", borderRadius:4, background:"#D08008", color:"#fff", fontSize:9, fontWeight:700 }}>{TIPI_LABEL[c.tipo]}</span>
                </div>
                <div style={{ fontSize:9, color:"#6B7280", marginBottom:3 }}>{c.wMm}×{c.hMm}mm</div>
                {c.tipo !== "cieco" && (
                  <select value={vetriCfg[c.key]||vetriList[0]?.id||""}
                    onChange={e=>{const nc={...vetriCfg,[c.key]:e.target.value};setVetriCfg(nc);save({vetriCfg:nc});}}
                    style={{ width:"100%", padding:"2px 4px", borderRadius:4, border:"1px solid #E0DED8", fontSize:9, background:"#fff" }}>
                    {vetriList.map((v:any)=><option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>

          {/* Dimensioni */}
          <div style={{ background:"#F9FAFB", borderRadius:8, border:"1px solid #E0DED8", padding:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#6B7280", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Dimensioni</div>
            {[{l:"L (mm)",v:L,s:setL,f:"larghezza"},{l:"H (mm)",v:H,s:setH,f:"altezza"}].map(({l,v,s,f})=>(
              <div key={l} style={{ marginBottom:6 }}>
                <div style={{ fontSize:9, color:"#6B7280", marginBottom:3 }}>{l}</div>
                <input type="number" value={v} onChange={e=>{const n=Math.max(300,Math.min(6000,parseInt(e.target.value)||300));s(n);onUpdateField?.(f,n);}}
                  style={{ width:"100%", boxSizing:"border-box", padding:"5px 8px", border:"1px solid #E0DED8", borderRadius:6, fontSize:13, fontWeight:700, fontFamily:"monospace", color:"#0055CC", textAlign:"right", background:"#fff" }}/>
              </div>
            ))}
          </div>

          {/* Riepilogo costi */}
          <div style={{ background:"#F0FDF4", borderRadius:8, border:"1px solid #BBF7D0", padding:10 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#166534", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Riepilogo</div>
            {[
              {l:"Profili",v:`€ ${costoProfili.toLocaleString("it-IT")}`},
              {l:"Vetri",v:`€ ${(costoTotale-costoProfili).toLocaleString("it-IT")}`},
              {l:"Peso vetri",v:`${pesoTotale} kg`},
              {l:"Celle",v:`${grid.filter((c:any)=>c.tipo!=="vuoto").length}`},
            ].map(({l,v})=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:"1px solid #BBF7D0", fontSize:10 }}>
                <span style={{ color:"#166534" }}>{l}</span><span style={{ fontWeight:700, color:"#166534" }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:6, fontSize:13, fontWeight:700 }}>
              <span style={{ color:"#166534" }}>Totale stimato</span>
              <span style={{ color:"#1A9E73" }}>€ {costoTotale.toLocaleString("it-IT")}</span>
            </div>
          </div>

          {/* Salva */}
          {onUpdate && (
            <button onClick={()=>save()} style={{ width:"100%", padding:"9px", borderRadius:8, background:"#D08008", color:"#fff", border:"none", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              Salva disegno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
