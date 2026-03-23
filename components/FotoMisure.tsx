"use client";
// @ts-nocheck
// MASTRO ERP — FotoMisure v4
// Strumenti: Misura | Testo | Freccia | Matita
// Testo = tastiera normale | Misura = numpad | No rosso di default
import React, { useState, useRef, useCallback, useEffect } from "react";
import { FM, ICO, I, FF } from "./mastro-constants";

const COLORS = ["#3B7FE0","#1A9E73","#D08008","#DC4444","#af52de","#fff"];
const DEFAULT_COLOR = "#3B7FE0";

const TOOLS = [
  { id:"measure", icon:"📏", label:"Misura" },
  { id:"text",    icon:"✏️", label:"Testo" },
  { id:"arrow",   icon:"→",  label:"Freccia" },
  { id:"pen",     icon:"🖊", label:"Matita" },
];

export default function FotoMisure({ imageUrl, onSave, onClose, T }) {
  const canvasRef    = useRef(null);
  const imgRef       = useRef(null);
  const containerRef = useRef(null);
  const fileRef      = useRef(null);
  const textInputRef = useRef(null);

  const [loaded,       setLoaded]       = useState(false);
  const [tool,         setTool]         = useState("measure");
  const [color,        setColor]        = useState(DEFAULT_COLOR);
  const [annotations,  setAnnotations]  = useState([]);
  const [drawing,      setDrawing]      = useState(null);
  const [dragPrev,     setDragPrev]     = useState(null);
  const [penPath,      setPenPath]      = useState(null);
  const [undoStack,    setUndoStack]    = useState([]);
  const [localImg,     setLocalImg]     = useState(imageUrl || null);
  const [measureModal, setMeasureModal] = useState(null);
  const [measureVal,   setMeasureVal]   = useState("");
  const [textModal,    setTextModal]    = useState(null);
  const [textVal,      setTextVal]      = useState("");

  const fitCanvas = useCallback(() => {
    const img = imgRef.current, canvas = canvasRef.current, box = containerRef.current;
    if (!img || !canvas || !box) return;
    const scale = Math.min(box.clientWidth / img.naturalWidth, box.clientHeight / img.naturalHeight);
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    setLoaded(true);
  }, []);

  useEffect(() => { window.addEventListener("resize", fitCanvas); return () => window.removeEventListener("resize", fitCanvas); }, [fitCanvas]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current, img = imgRef.current;
    if (!canvas || !img || !loaded) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    annotations.forEach(a => {
      ctx.save();
      if (a.type === "measure") drawMeasure(ctx, a);
      if (a.type === "text")    drawText(ctx, a);
      if (a.type === "arrow")   drawArrow(ctx, a);
      if (a.type === "pen")     drawPen(ctx, a);
      ctx.restore();
    });
    if (drawing && dragPrev) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([7,4]);
      ctx.beginPath(); ctx.moveTo(drawing.x, drawing.y); ctx.lineTo(dragPrev.x, dragPrev.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    if (penPath && penPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(penPath[0].x, penPath[0].y);
      penPath.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      ctx.restore();
    }
  }, [annotations, loaded, drawing, dragPrev, penPath, color]);

  useEffect(() => { redraw(); }, [redraw]);

  function drawMeasure(ctx, a) {
    const { x1, y1, x2, y2, text, color: col } = a;
    const angle = Math.atan2(y2-y1, x2-x1), perp = angle + Math.PI/2, tl = 10;
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    [[x1,y1],[x2,y2]].forEach(([px,py]) => {
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(perp)*tl, py - Math.sin(perp)*tl);
      ctx.lineTo(px + Math.cos(perp)*tl, py + Math.sin(perp)*tl);
      ctx.stroke();
    });
    if (text) {
      const mx = (x1+x2)/2, my = (y1+y2)/2;
      const offX = -Math.sin(angle)*18, offY = Math.cos(angle)*18;
      ctx.font = "bold 14px 'JetBrains Mono',monospace";
      const tw = ctx.measureText(text).width + 14;
      ctx.fillStyle = "rgba(255,255,255,0.97)";
      ctx.beginPath(); ctx.roundRect(mx+offX-tw/2, my-offY-12, tw, 24, 4); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(mx+offX-tw/2, my-offY-12, tw, 24, 4); ctx.stroke();
      ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, mx+offX, my-offY);
    }
  }

  function drawText(ctx, a) {
    const { x, y, text, color: col } = a;
    if (!text) return;
    ctx.font = "bold 15px 'JetBrains Mono',monospace";
    const tw = ctx.measureText(text).width + 14;
    ctx.fillStyle = col === "#fff" ? "rgba(0,0,0,0.8)" : col + "CC";
    ctx.beginPath(); ctx.roundRect(x-2, y-14, tw, 28, 6); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(text, x+5, y);
  }

  function drawArrow(ctx, a) {
    const { x1, y1, x2, y2, color: col } = a;
    const angle = Math.atan2(y2-y1, x2-x1);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    const hl = 18, ha = 0.45;
    ctx.beginPath();
    ctx.moveTo(x2,y2);
    ctx.lineTo(x2 - hl*Math.cos(angle-ha), y2 - hl*Math.sin(angle-ha));
    ctx.lineTo(x2 - hl*Math.cos(angle+ha), y2 - hl*Math.sin(angle+ha));
    ctx.closePath(); ctx.fill();
  }

  function drawPen(ctx, a) {
    const { points, color: col } = a;
    if (!points || points.length < 2) return;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
  }

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e.changedTouches?.[0] || e;
    const sx = canvasRef.current.width  / rect.width;
    const sy = canvasRef.current.height / rect.height;
    return { x:(t.clientX - rect.left)*sx, y:(t.clientY - rect.top)*sy };
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (measureModal || textModal) return;
    const pos = getPos(e);
    if (tool === "text") { setTextModal({ coords:pos }); setTextVal(""); setTimeout(() => textInputRef.current?.focus(), 80); return; }
    if (tool === "pen")  { setPenPath([pos]); return; }
    setDrawing(pos); setDragPrev(null);
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (tool === "pen" && penPath) { setPenPath(prev => [...prev, getPos(e)]); return; }
    if (!drawing) return;
    setDragPrev(getPos(e));
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (tool === "pen" && penPath) {
      if (penPath.length > 2) { setUndoStack(s => [...s, [...annotations]]); setAnnotations(s => [...s, { type:"pen", points:[...penPath], color }]); }
      setPenPath(null); return;
    }
    if (!drawing) return;
    const pos = getPos(e);
    const dist = Math.hypot(pos.x - drawing.x, pos.y - drawing.y);
    setDragPrev(null); setDrawing(null);
    if (dist < 10) return;
    if (tool === "measure") { setMeasureModal({ coords:{ x1:drawing.x, y1:drawing.y, x2:pos.x, y2:pos.y } }); setMeasureVal(""); }
    else if (tool === "arrow") { setUndoStack(s => [...s, [...annotations]]); setAnnotations(s => [...s, { type:"arrow", x1:drawing.x, y1:drawing.y, x2:pos.x, y2:pos.y, color }]); }
  };

  const confirmMeasure = () => {
    if (!measureModal) return;
    setUndoStack(s => [...s, [...annotations]]);
    setAnnotations(s => [...s, { type:"measure", ...measureModal.coords, text:measureVal.trim(), color }]);
    setMeasureModal(null); setMeasureVal("");
  };

  const confirmText = () => {
    if (!textModal || !textVal.trim()) { setTextModal(null); setTextVal(""); return; }
    setUndoStack(s => [...s, [...annotations]]);
    setAnnotations(s => [...s, { type:"text", x:textModal.coords.x, y:textModal.coords.y, text:textVal.trim(), color }]);
    setTextModal(null); setTextVal("");
  };

  const undo = () => {
    if (undoStack.length > 0) { setAnnotations(undoStack[undoStack.length-1]); setUndoStack(s => s.slice(0,-1)); }
    else if (annotations.length > 0) setAnnotations(s => s.slice(0,-1));
  };

  const QUICK = ["L","H","Sp","Ø","mm"];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#111", display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* HEADER */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#1a1a1a", borderBottom:"1px solid #222", flexShrink:0 }}>
        <div onClick={onClose} style={{ padding:4, cursor:"pointer" }}><I d={ICO.back} s={22} c="#aaa" /></div>
        <span style={{ flex:1, fontSize:15, fontWeight:800, color:"#fff", fontFamily:FF }}>Foto + Misure</span>
        {annotations.length > 0 && <span style={{ fontSize:10, color:"#555", fontFamily:FM }}>{annotations.length} segni</span>}
        {localImg && annotations.length > 0 && (
          <div onClick={() => { const c = canvasRef.current; if(c) onSave?.(c.toDataURL("image/jpeg",0.88), annotations); }}
            style={{ padding:"8px 18px", borderRadius:8, background:"#1A9E73", color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer" }}>✓ Salva</div>
        )}
      </div>

      {/* CANVAS */}
      <div ref={containerRef} style={{ flex:1, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", background:"#111" }}>
        {!localImg ? (
          <div style={{ textAlign:"center", padding:32 }}>
            <div onClick={() => fileRef.current?.click()} style={{ width:100, height:100, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #333", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", cursor:"pointer" }}>
              <I d={ICO.camera} s={40} c="#555" />
            </div>
            <div style={{ fontSize:17, color:"#fff", fontWeight:800, marginBottom:8 }}>Scatta foto</div>
            <div style={{ fontSize:12, color:"#444", lineHeight:1.7 }}>Disegna misure, frecce, note e forme sopra la foto</div>
          </div>
        ) : (
          <>
            <img ref={imgRef} src={localImg} onLoad={fitCanvas} style={{ display:"none" }} alt="" />
            <canvas ref={canvasRef}
              onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
              onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
              style={{ touchAction:"none", maxWidth:"100%", maxHeight:"100%", display:"block",
                cursor: tool==="pen"||tool==="measure" ? "crosshair" : "default" }}/>
          </>
        )}
      </div>

      {/* TOOLBAR */}
      {localImg && !measureModal && !textModal && (
        <div style={{ padding:"10px 12px 18px", background:"#1a1a1a", borderTop:"1px solid #222", flexShrink:0 }}>
          <div style={{ display:"flex", gap:5, alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", gap:4 }}>
              {TOOLS.map(t => (
                <div key={t.id} onClick={() => setTool(t.id)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2,
                    padding:"8px 9px", borderRadius:10, cursor:"pointer", minWidth:50,
                    background: tool===t.id ? color+"22" : "rgba(255,255,255,0.05)",
                    border:`1.5px solid ${tool===t.id ? color : "#2a2a2a"}` }}>
                  <span style={{ fontSize:15 }}>{t.icon}</span>
                  <span style={{ fontSize:8, fontWeight:700, color: tool===t.id ? color : "#555" }}>{t.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:5 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)}
                  style={{ width:22, height:22, borderRadius:11, background:c, cursor:"pointer",
                    border: color===c ? `3px solid ${c==="#fff"?"#666":"#fff"}` : "2px solid #2a2a2a",
                    boxShadow: color===c ? `0 0 8px ${c}70` : "none" }}/>
              ))}
            </div>
            <div style={{ display:"flex", gap:4 }}>
              {annotations.length > 0 && (
                <div onClick={undo} style={{ padding:"8px 10px", borderRadius:10, cursor:"pointer", background:"rgba(255,255,255,0.05)", border:"1.5px solid #2a2a2a", display:"flex", alignItems:"center" }}>
                  <I d={ICO.back} s={16} c="#666" />
                </div>
              )}
              <div onClick={() => fileRef.current?.click()} style={{ padding:"8px 10px", borderRadius:10, cursor:"pointer", background:"rgba(255,255,255,0.05)", border:"1.5px solid #2a2a2a", display:"flex", alignItems:"center" }}>
                <I d={ICO.camera} s={16} c="#666" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MISURA */}
      {measureModal && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:30, background:"#141414", borderRadius:"20px 20px 0 0", padding:"12px 16px 28px", boxShadow:"0 -8px 40px rgba(0,0,0,0.8)" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#2a2a2a", margin:"0 auto 12px" }}/>
          <div style={{ fontSize:11, color:"#555", fontWeight:700, textTransform:"uppercase", textAlign:"center", marginBottom:10, letterSpacing:0.5 }}>📏 Inserisci misura</div>
          <div style={{ display:"flex", gap:5, marginBottom:10, justifyContent:"center" }}>
            {QUICK.map(q => (
              <div key={q} onClick={() => { if(q==="mm") setMeasureVal(v=>v.replace(/ mm$/,"")+" mm"); else setMeasureVal(v=>q+":"+(v.replace(/^[A-ZØa-z]+:/,""))); }}
                style={{ padding:"6px 12px", borderRadius:8, background:"rgba(255,255,255,0.06)", border:"1px solid #2a2a2a", color:"#777", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FM }}>{q}</div>
            ))}
          </div>
          <div style={{ padding:"14px 16px", borderRadius:12, background:"#0a0a0a", border:`2px solid ${color}`, fontSize:26, fontWeight:800, fontFamily:FM, color:"#fff", textAlign:"center", marginBottom:12, minHeight:56, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {measureVal || <span style={{ color:"#333" }}>1200 mm</span>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:10 }}>
            {["1","2","3","4","5","6","7","8","9","←","0","✓"].map(d => (
              <div key={d} onClick={() => { if(d==="←") setMeasureVal(v=>v.slice(0,-1)); else if(d==="✓") confirmMeasure(); else setMeasureVal(v=>v+d); }}
                style={{ padding:"15px 0", borderRadius:10, textAlign:"center", cursor:"pointer", userSelect:"none", background:d==="✓"?color:"rgba(255,255,255,0.07)", color:d==="✓"?"#fff":d==="←"?"#666":"#fff", fontSize:d==="✓"?18:20, fontWeight:800, fontFamily:FM }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={()=>{setMeasureModal(null);setMeasureVal("");}} style={{ flex:1, padding:"12px 0", borderRadius:10, background:"rgba(255,255,255,0.05)", color:"#555", textAlign:"center", fontSize:13, fontWeight:700, cursor:"pointer" }}>Solo linea</div>
            <div onClick={confirmMeasure} style={{ flex:2, padding:"12px 0", borderRadius:10, background:color, color:"#fff", textAlign:"center", fontSize:14, fontWeight:800, cursor:"pointer" }}>Conferma {measureVal ? `"${measureVal}"` : ""}</div>
          </div>
        </div>
      )}

      {/* MODAL TESTO */}
      {textModal && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:30, background:"#141414", borderRadius:"20px 20px 0 0", padding:"16px 16px 28px", boxShadow:"0 -8px 40px rgba(0,0,0,0.8)" }}>
          <div style={{ width:36, height:4, borderRadius:2, background:"#2a2a2a", margin:"0 auto 12px" }}/>
          <div style={{ fontSize:11, color:"#555", fontWeight:700, textTransform:"uppercase", textAlign:"center", marginBottom:12, letterSpacing:0.5 }}>✏️ Scrivi nota</div>
          <input ref={textInputRef} value={textVal} onChange={e=>setTextVal(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") confirmText(); if(e.key==="Escape"){setTextModal(null);setTextVal("");} }}
            placeholder="Scrivi qui..." autoFocus
            style={{ width:"100%", padding:"14px 16px", borderRadius:12, background:"#0a0a0a", border:`2px solid ${color}`, color:"#fff", fontSize:18, fontWeight:600, fontFamily:"Inter,sans-serif", outline:"none", boxSizing:"border-box", marginBottom:12 }}/>
          <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:14 }}>
            {COLORS.map(c => (
              <div key={c} onClick={()=>setColor(c)} style={{ width:26, height:26, borderRadius:13, background:c, cursor:"pointer", border:color===c?`3px solid ${c==="#fff"?"#666":"#fff"}`:"2px solid #2a2a2a", boxShadow:color===c?`0 0 8px ${c}70`:"none" }}/>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={()=>{setTextModal(null);setTextVal("");}} style={{ flex:1, padding:"12px 0", borderRadius:10, background:"rgba(255,255,255,0.05)", color:"#555", textAlign:"center", fontSize:13, fontWeight:700, cursor:"pointer" }}>Annulla</div>
            <div onClick={confirmText} style={{ flex:2, padding:"12px 0", borderRadius:10, background:color, color:"#fff", textAlign:"center", fontSize:14, fontWeight:800, cursor:"pointer", opacity:textVal.trim()?1:0.4 }}>Aggiungi nota</div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{setLocalImg(ev.target.result);setAnnotations([]);setUndoStack([]);setLoaded(false);}; r.readAsDataURL(f); e.target.value=""; }}/>
    </div>
  );
}
