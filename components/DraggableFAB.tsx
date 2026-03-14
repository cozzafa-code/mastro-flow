"use client";
import { useState, useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc, onVoice, onEvento, onCliente, onCommessa, onMessaggio, lastCM, onLastCM }) {
  const [topPx, setTopPx] = useState(300);
  const [dragging, setDragging] = useState(false);
  const [goUp, setGoUp] = useState(false);
  const drag = useRef({ active: false, moved: false, startY: 0, startTop: 300 });
  useEffect(() => {
    const s = localStorage.getItem("mastro:fab_top");
    const y = s ? parseInt(s) : window.innerHeight / 2;
    setTopPx(y);
    setGoUp(y > window.innerHeight * 0.6);
  }, []);
  const onDown = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    drag.current = { active: true, moved: false, startY: y, startTop: topPx };
    setDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current.active) return;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const delta = y - drag.current.startY;
      if (Math.abs(delta) > 4) drag.current.moved = true;
      const newY = Math.max(60, Math.min(window.innerHeight - 180, drag.current.startTop + delta));
      setTopPx(newY);
      setGoUp(newY > window.innerHeight * 0.6);
    };
    const onUp = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      setDragging(false);
      if (!drag.current.moved && !fabOpen) setFabOpen(true);
      localStorage.setItem("mastro:fab_top", String(topPx));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [topPx, fabOpen, setFabOpen]);
  const items = [
    { l: "Nota vocale", c: "#E53935", emoji: "MIC", a: onVoice },
    { l: "Appuntamento", c: "#1A9E73", emoji: "CAL", a: onEvento },
    { l: "Nuovo cliente", c: "#3B7FE0", emoji: "USR", a: onCliente },
    { l: "Nuova commessa", c: "#E8A020", emoji: "FLD", a: onCommessa },
    { l: "Messaggio", c: "#8B5CF6", emoji: "MSG", a: onMessaggio },
  ];
  if (lastCM) items.push({ l: lastCM.code + " " + lastCM.cliente, c: "#0D7C6B", emoji: "BCK", a: () => onLastCM && onLastCM(lastCM) });
  const itemsH = items.length * 72 + 56;
  const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
  const spaceBelow = screenH - topPx - 60;
  const spaceAbove = topPx;
  const showAbove = spaceBelow < itemsH && spaceAbove > spaceBelow;
  const actionsTop = showAbove ? Math.max(20, topPx - itemsH - 10) : Math.min(screenH - itemsH - 20, topPx + 60);
  return (
    <>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}
      {fabOpen && (
        <div style={{ position: "fixed", right: 58, zIndex: 92,
          top: actionsTop,
          display: "flex", flexDirection: "column", gap: 14,
          transition: dragging ? "top 0.0s linear" : "top 0.18s cubic-bezier(0.4,0,0.2,1)" }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { if(item.a) item.a(); setFabOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: "row-reverse",
                opacity: 1, pointerEvents: "auto",
                animation: "fadeUp 0.2s ease " + (i * 40) + "ms both" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: item.c,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px " + item.c + "70" }}>
                {item.emoji === "MIC" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                {item.emoji === "CAL" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                {item.emoji === "USR" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                {item.emoji === "FLD" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
                {item.emoji === "MSG" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
                {item.emoji === "BCK" && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>}
              </div>
              <div style={{ background: "#1A1A1C", color: "#fff", fontSize: 13, fontWeight: 700,
                padding: "7px 13px", borderRadius: 10, whiteSpace: "nowrap", maxWidth: 180,
                overflow: "hidden", textOverflow: "ellipsis",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{item.l}</div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateX(20px) scale(0.9); } to { opacity:1; transform:translateX(0) scale(1); } }`}</style>
      <div style={{ position: "fixed", right: 0, top: topPx, zIndex: 92,
        transition: dragging ? "none" : "top 0.15s ease" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setFabOpen(false); }}
               onClick={() => setFabOpen(false)}
            style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 80 : 0, overflow: "hidden",
              background: "#0A5940",
              borderRadius: "12px 0 0 0",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              cursor: "pointer", borderBottom: fabOpen ? "1px solid rgba(255,255,255,0.2)" : "none",
              transition: "width 0.25s ease, height 0.25s ease" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1, textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>CHIUDI</span>
            
          </div>
          <div onMouseDown={onDown} onTouchStart={onDown}
            style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 100 : 90,
              background: acc, borderRadius: fabOpen ? "0 0 0 12px" : "12px 0 0 12px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "grab", userSelect: "none", touchAction: "none",
              transition: "width 0.25s ease, height 0.25s ease",
              boxShadow: "-4px 0 20px " + acc + "60" }}>
            <div style={{ width: fabOpen ? 30 : 18, height: fabOpen ? 30 : 18, borderRadius: fabOpen ? 8 : 5,
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <span style={{ fontSize: fabOpen ? 17 : 11, fontWeight: 900, color: acc, lineHeight: 1, transition: "font-size 0.25s" }}>M</span>
            </div>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)",
              fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MASTRO</span>
          </div>
        </div>
      </div>
    </>
  );
}