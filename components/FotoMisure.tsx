"use client";
// @ts-nocheck
// MASTRO ERP — FotoMisure v3
// Foto fullscreen, toolbar compatta 1 riga, canvas corretto
import React, { useState, useRef, useCallback, useEffect } from "react";
import { FM, ICO, I, FF } from "./mastro-constants";

const COLORS = [
  { c: "#DC4444", l: "Rosso" },
  { c: "#3B7FE0", l: "Blu" },
  { c: "#D08008", l: "Giallo" },
  { c: "#1A9E73", l: "Verde" },
  { c: "#af52de", l: "Viola" },
  { c: "#fff",    l: "Bianco" },
];

const TOOL_SVGS: Record<string, any> = {
  line:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="21" x2="21" y2="3"/><path d="M3 9V3h6"/><path d="M21 15v6h-6"/></svg>,
  point: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="4"/><line x1="12" y1="14" x2="12" y2="21"/></svg>,
  text:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>,
};
const TOOLS = [
  { id: "line",  label: "Misura" },
  { id: "point", label: "Punto" },
  { id: "text",  label: "Nota" },
];

export default function FotoMisure({ imageUrl, onSave, onClose, T }) {
  const canvasRef    = useRef(null);
  const imgRef       = useRef(null);
  const containerRef = useRef(null);
  const fileRef      = useRef(null);

  const [loaded,      setLoaded]      = useState(false);
  const [tool,        setTool]        = useState("line");
  const [color,       setColor]       = useState("#DC4444");
  const [annotations, setAnnotations] = useState([]);
  const [drawing,     setDrawing]     = useState(null);
  const [dragPrev,    setDragPrev]    = useState(null);
  const [inputModal,  setInputModal]  = useState(null);
  const [inputValue,  setInputValue]  = useState("");
  const [undoStack,   setUndoStack]   = useState([]);
  const [localImg,    setLocalImg]    = useState(imageUrl || null);
  const [draggingText, setDraggingText] = useState(null); // {idx, offX, offY}

  // ── Sizing: riempi il container ──────────────────────────────
  const fitCanvas = useCallback(() => {
    const img = imgRef.current, canvas = canvasRef.current, box = containerRef.current;
    if (!img || !canvas || !box) return;
    const bw = box.clientWidth, bh = box.clientHeight;
    const scale = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    setLoaded(true);
  }, []);

  const onImgLoad = useCallback(() => { fitCanvas(); }, [fitCanvas]);

  useEffect(() => {
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, [fitCanvas]);

  // ── Redraw ───────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current, img = imgRef.current;
    if (!canvas || !img || !loaded) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    annotations.forEach(a => {
      ctx.save();
      if (a.type === "line")  drawLine(ctx, a);
      if (a.type === "point") drawPoint(ctx, a);
      if (a.type === "text")  drawText(ctx, a);
      ctx.restore();
    });
    // Preview mentre trascina
    if (drawing && dragPrev) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      ctx.moveTo(drawing.x, drawing.y);
      ctx.lineTo(dragPrev.x, dragPrev.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const dx = dragPrev.x - drawing.x, dy = dragPrev.y - drawing.y;
      if (Math.hypot(dx, dy) > 20) {
        const mx = (drawing.x + dragPrev.x) / 2, my = (drawing.y + dragPrev.y) / 2;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.beginPath(); ctx.roundRect(mx - 24, my - 12, 48, 24, 4); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = "bold 11px 'JetBrains Mono',monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(Math.round(Math.hypot(dx,dy))+"px", mx, my);
      }
      ctx.restore();
    }
  }, [annotations, loaded, drawing, dragPrev, color]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Draw helpers ─────────────────────────────────────────────
  function drawLine(ctx, a) {
    const { x1, y1, x2, y2, text, color: col } = a;
    const angle = Math.atan2(y2-y1, x2-x1);
    const perp = angle + Math.PI/2;
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    // Linea
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // Tacche terminali
    const tl = 10;
    [[x1,y1],[x2,y2]].forEach(([px,py]) => {
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(perp)*tl, py - Math.sin(perp)*tl);
      ctx.lineTo(px + Math.cos(perp)*tl, py + Math.sin(perp)*tl);
      ctx.stroke();
    });
    // Etichetta
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

  function drawPoint(ctx, a) {
    const { x, y, text, color: col } = a;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke();
    if (text) {
      ctx.font = "bold 13px 'JetBrains Mono',monospace";
      const tw = ctx.measureText(text).width + 12;
      ctx.fillStyle = "rgba(255,255,255,0.97)";
      ctx.beginPath(); ctx.roundRect(x+14, y-12, tw, 24, 4); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(x+14, y-12, tw, 24, 4); ctx.stroke();
      ctx.fillStyle = col; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(text, x+20, y);
    }
  }

  function drawText(ctx, a) {
    const { ax, ay, tx, ty, x, y, text, color: col } = a;
    if (!text) return;
    const bx = tx ?? x, by = ty ?? y;
    const ancX = ax ?? x, ancY = ay ?? y;
    ctx.font = "bold 14px 'JetBrains Mono',monospace";
    const tw = ctx.measureText(text).width + 14;
    const bh = 28;
    // Linea tratteggiata ancora→box
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(ancX, ancY); ctx.lineTo(bx + tw/2, by - bh/2); ctx.stroke();
    ctx.setLineDash([]);
    // Punta freccia sul box
    const angle = Math.atan2((by - bh/2) - ancY, (bx + tw/2) - ancX);
    const ex = bx + tw/2, ey = by - bh/2, hl=14, ha=0.42;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl*Math.cos(angle-ha), ey - hl*Math.sin(angle-ha));
    ctx.lineTo(ex - hl*Math.cos(angle+ha), ey - hl*Math.sin(angle+ha));
    ctx.closePath(); ctx.fill();
    // Cerchietto ancora
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(ancX, ancY, 5, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ancX, ancY, 5, 0, Math.PI*2); ctx.stroke();
    // Box testo
    ctx.fillStyle = col === "#fff" ? "rgba(0,0,0,0.85)" : col + "DD";
    ctx.beginPath(); ctx.roundRect(bx-2, by-bh/2, tw, bh, 6); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(text, bx+5, by);
  }

  // ── HitTest testo (per drag) ────────────────────────────────
  const hitTestText = (pos) => {
    const canvas = canvasRef.current; if (!canvas) return -1;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 14px 'JetBrains Mono',monospace";
    for (let i = annotations.length-1; i >= 0; i--) {
      const a = annotations[i];
      if (a.type !== "text") continue;
      const bx = a.tx ?? a.x, by = a.ty ?? a.y;
      const tw = ctx.measureText(a.text).width + 14;
      if (pos.x>=bx-2 && pos.x<=bx+tw && pos.y>=by-14 && pos.y<=by+14) return i;
    }
    return -1;
  };

  // ── Touch/mouse pos ──────────────────────────────────────────
  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches?.[0] || e.changedTouches?.[0] || e;
    // Scala rispetto alle dimensioni reali del canvas vs display
    const scaleX = canvasRef.current.width  / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (t.clientX - rect.left) * scaleX,
      y: (t.clientY - rect.top)  * scaleY,
    };
  };

  // ── Handlers ────────────────────────────────────────────────
  const handleStart = (e) => {
    e.preventDefault();
    if (inputModal) return;
    const pos = getPos(e);
    if (tool === "text") {
      const hitIdx = hitTestText(pos);
      if (hitIdx >= 0) {
        const a = annotations[hitIdx];
        const bx = a.tx ?? a.x, by = a.ty ?? a.y;
        setDraggingText({ idx:hitIdx, offX:pos.x-bx, offY:pos.y-by });
        return;
      }
      openInput(pos, "text");
      return;
    }
    if (tool === "point") { openInput(pos, tool); return; }
    setDrawing(pos);
    setDragPrev(null);
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (draggingText !== null) {
      const pos = getPos(e);
      setAnnotations(s => s.map((a,i) => i===draggingText.idx
        ? {...a, tx:pos.x-draggingText.offX, ty:pos.y-draggingText.offY}
        : a));
      return;
    }
    if (!drawing) return;
    setDragPrev(getPos(e));
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (draggingText !== null) { setDraggingText(null); return; }
    if (!drawing) return;
    const pos = getPos(e);
    const dist = Math.hypot(pos.x - drawing.x, pos.y - drawing.y);
    setDragPrev(null);
    setDrawing(null);
    if (dist < 12) {
      openInput(pos, "point");
    } else {
      openInput(pos, "line", { x1: drawing.x, y1: drawing.y, x2: pos.x, y2: pos.y });
    }
  };

  const openInput = (pos, type, coords) => {
    setInputModal({ type, pos, coords: coords || pos });
    setInputValue("");
  };

  const confirmInput = () => {
    if (!inputModal) return;
    const { type, coords } = inputModal;
    const text = inputValue.trim();
    setUndoStack(s => [...s, [...annotations]]);
    if (type === "line") {
      setAnnotations(s => [...s, { type:"line", x1:coords.x1, y1:coords.y1, x2:coords.x2, y2:coords.y2, text, color }]);
    } else if (type === "point") {
      setAnnotations(s => [...s, { type:"point", x:coords.x, y:coords.y, text, color }]);
    } else {
      if (text) {
        const ax = coords.x, ay = coords.y;
        setAnnotations(s => [...s, { type:"text", ax, ay, tx:ax+90, ty:ay-60, text, color }]);
      }
    }
    setInputModal(null);
    setInputValue("");
  };

  const skipInput = () => {
    if (inputModal?.type === "line") {
      const { coords } = inputModal;
      setUndoStack(s => [...s, [...annotations]]);
      setAnnotations(s => [...s, { type:"line", x1:coords.x1, y1:coords.y1, x2:coords.x2, y2:coords.y2, text:"", color }]);
    }
    setInputModal(null);
    setInputValue("");
  };

  const undo = () => {
    if (undoStack.length > 0) {
      setAnnotations(undoStack[undoStack.length-1]);
      setUndoStack(s => s.slice(0,-1));
    } else {
      setAnnotations(s => s.slice(0,-1));
    }
  };

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave?.(canvas.toDataURL("image/jpeg", 0.88), annotations);
  };

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { setLocalImg(ev.target.result); setAnnotations([]); setUndoStack([]); setLoaded(false); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const QUICK = ["L","H","Sp","Ø","mm"];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"#000",
      display:"flex", flexDirection:"column", overflow:"hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ display:"flex", alignItems:"center", gap:10,
        padding:"10px 14px", background:"#111",
        borderBottom:"1px solid #222", flexShrink:0 }}>
        <div onClick={onClose} style={{ padding:4, cursor:"pointer" }}>
          <I d={ICO.back} s={22} c="#fff" />
        </div>
        <span style={{ flex:1, fontSize:15, fontWeight:800, color:"#fff", fontFamily:FF }}>
          Foto + Misure
        </span>
        <span style={{ fontSize:10, color:"#555", fontFamily:FM }}>
          {annotations.length > 0 ? `${annotations.length} segni` : ""}
        </span>
        {localImg && annotations.length > 0 && (
          <div onClick={saveImage}
            style={{ padding:"8px 18px", borderRadius:8, background:"#1A9E73",
              color:"#fff", fontSize:13, fontWeight:800, cursor:"pointer" }}>
            ✓ Salva
          </div>
        )}
      </div>

      {/* ── CANVAS AREA — occupa tutto lo spazio disponibile ── */}
      <div ref={containerRef} style={{ flex:1, position:"relative",
        display:"flex", alignItems:"center", justifyContent:"center",
        overflow:"hidden", background:"#111" }}>

        {!localImg ? (
          /* Schermata iniziale — scatta foto */
          <div style={{ textAlign:"center", padding:32 }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ width:100, height:100, borderRadius:"50%",
                background:"linear-gradient(135deg,#DC4444,#B83030)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 20px", cursor:"pointer",
                boxShadow:"0 6px 40px rgba(220,68,68,0.5)" }}>
              <I d={ICO.camera} s={40} c="#fff" />
            </div>
            <div style={{ fontSize:17, color:"#fff", fontWeight:800, marginBottom:8 }}>
              Scatta foto
            </div>
            <div style={{ fontSize:12, color:"#555", lineHeight:1.6 }}>
              Poi disegna misure e note sopra la foto
            </div>
          </div>
        ) : (
          <>
            <img ref={imgRef} src={localImg} onLoad={onImgLoad}
              style={{ display:"none" }} alt="" />
            <canvas
              ref={canvasRef}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              style={{
                touchAction:"none",
                cursor: tool === "line" ? "crosshair" : "cell",
                maxWidth:"100%", maxHeight:"100%",
                display:"block",
              }}
            />
          </>
        )}
      </div>

      {/* ── TOOLBAR — 1 riga compatta ── */}
      {localImg && !inputModal && (
        <div style={{ padding:"10px 12px 16px", background:"#111",
          borderTop:"1px solid #1a1a1a", flexShrink:0 }}>
          <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"space-between" }}>

            {/* Strumenti */}
            <div style={{ display:"flex", gap:4 }}>
              {TOOLS.map(t => (
                <div key={t.id} onClick={() => setTool(t.id)}
                  style={{ display:"flex", flexDirection:"column", alignItems:"center",
                    gap:2, padding:"8px 10px", borderRadius:10, cursor:"pointer",
                    background: tool===t.id ? color+"25" : "rgba(255,255,255,0.06)",
                    border:`1.5px solid ${tool===t.id ? color : "#2a2a2a"}`,
                    minWidth:52 }}>
                  <span style={{ display:"flex", color: tool===t.id ? color : "#666" }}>{TOOL_SVGS[t.id]}</span>
                  <span style={{ fontSize:9, fontWeight:700,
                    color: tool===t.id ? color : "#666" }}>{t.label}</span>
                </div>
              ))}
            </div>

            {/* Colori */}
            <div style={{ display:"flex", gap:5, flex:1, justifyContent:"center" }}>
              {COLORS.map(({ c }) => (
                <div key={c} onClick={() => setColor(c)}
                  style={{ width:24, height:24, borderRadius:12,
                    background:c, cursor:"pointer",
                    border: color===c
                      ? `3px solid ${c==="#fff"?"#555":"#fff"}`
                      : "2px solid #2a2a2a",
                    boxShadow: color===c ? `0 0 8px ${c}80` : "none",
                  }} />
              ))}
            </div>

            {/* Undo + Camera */}
            <div style={{ display:"flex", gap:4 }}>
              <div onClick={undo}
                style={{ padding:"8px 10px", borderRadius:10, cursor:"pointer",
                  background:"rgba(255,255,255,0.06)", border:"1.5px solid #2a2a2a",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I d={ICO.back} s={16} c="#666" />
              </div>
              <div onClick={() => fileRef.current?.click()}
                style={{ padding:"8px 10px", borderRadius:10, cursor:"pointer",
                  background:"rgba(255,255,255,0.06)", border:"1.5px solid #2a2a2a",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I d={ICO.camera} s={16} c="#666" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INPUT BOTTOM SHEET ── */}
      {inputModal && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:30,
          background:"#141414", borderRadius:"20px 20px 0 0",
          padding:"12px 16px 28px",
          boxShadow:"0 -8px 40px rgba(0,0,0,0.7)" }}>

          {/* Handle */}
          <div style={{ width:36, height:4, borderRadius:2, background:"#333",
            margin:"0 auto 12px" }} />

          {/* Tipo */}
          <div style={{ fontSize:11, color:"#555", fontWeight:700,
            textTransform:"uppercase", textAlign:"center", marginBottom:10,
            letterSpacing:0.5 }}>
            {inputModal.type==="line"  && "📏 Misura linea"}
            {inputModal.type==="point" && "📍 Punto con valore"}
            {inputModal.type==="text"  && "✏️ Nota testo"}
          </div>

          {/* Quick prefix + mm */}
          <div style={{ display:"flex", gap:5, marginBottom:10, justifyContent:"center" }}>
            {QUICK.map(q => (
              <div key={q} onClick={() => {
                if (q === "mm") setInputValue(v => v.replace(/ mm$/,"") + " mm");
                else setInputValue(v => {
                  const clean = v.replace(/^[A-ZØa-z]+:/,"");
                  return q+":"+clean;
                });
              }} style={{ padding:"6px 12px", borderRadius:8,
                background:"rgba(255,255,255,0.06)",
                border:`1px solid ${inputValue.startsWith(q+":")||inputValue.endsWith(q)?"${color}":"#333"}`,
                color:"#888", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FM }}>
                {q}
              </div>
            ))}
          </div>

          {/* Display valore */}
          <div style={{ padding:"14px 16px", borderRadius:12, background:"#000",
            border:`2px solid ${color}`, fontSize:26, fontWeight:800,
            fontFamily:FM, color:"#fff", textAlign:"center", marginBottom:12,
            minHeight:56, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {inputValue || <span style={{ color:"#333" }}>
              {inputModal.type==="line" ? "1200 mm" : "valore"}
            </span>}
          </div>

          {/* Numpad 3×4 */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:10 }}>
            {["1","2","3","4","5","6","7","8","9","⌫","0","✓"].map(d => (
              <div key={d}
                onClick={() => {
                  if (d==="⌫") setInputValue(v => v.slice(0,-1));
                  else if (d==="✓") confirmInput();
                  else setInputValue(v => v+d);
                }}
                style={{ padding:"15px 0", borderRadius:10, textAlign:"center",
                  cursor:"pointer", userSelect:"none",
                  background: d==="✓" ? color : "rgba(255,255,255,0.07)",
                  color: d==="✓" ? "#fff" : d==="⌫" ? "#888" : "#fff",
                  fontSize: d==="✓" ? 16 : 20, fontWeight:800, fontFamily:FM }}>
                {d==="⌫" ? "←" : d}
              </div>
            ))}
          </div>

          {/* Azioni */}
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={skipInput}
              style={{ flex:1, padding:"12px 0", borderRadius:10,
                background:"rgba(255,255,255,0.06)", color:"#666",
                textAlign:"center", fontSize:13, fontWeight:700, cursor:"pointer" }}>
              {inputModal.type==="line" ? "Solo linea" : "Annulla"}
            </div>
            <div onClick={confirmInput}
              style={{ flex:2, padding:"12px 0", borderRadius:10,
                background:color, color:"#fff",
                textAlign:"center", fontSize:14, fontWeight:800, cursor:"pointer" }}>
              Conferma {inputValue ? `"${inputValue}"` : ""}
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display:"none" }} onChange={onFileChange} />
    </div>
  );
}
