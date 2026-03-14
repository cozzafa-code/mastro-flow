"use client";
import { useState, useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc, onVoice, onEvento, onCliente, onCommessa, onMessaggio }) {
  const [topPx, setTopPx] = useState(300);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, startY: 0, startTop: 300 });
  useEffect(() => {
    const s = localStorage.getItem("mastro:fab_top");
    const y = s ? parseInt(s) : window.innerHeight / 2;
    setTopPx(y);
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
    { l: "Nota vocale", c: "#E53935", emoji: "??", a: onVoice },
    { l: "Appuntamento", c: "#1A9E73", emoji: "??", a: onEvento },
    { l: "Nuovo cliente", c: "#3B7FE0", emoji: "??", a: onCliente },
    { l: "Nuova commessa", c: "#E8A020", emoji: "??", a: onCommessa },
    { l: "Messaggio", c: "#8B5CF6", emoji: "??", a: onMessaggio },
  ];
  const itemsH = items.length * 72;
  const tabCenterY = topPx + 65;
  const actionsCenterY = Math.max(itemsH / 2 + 20, Math.min(window ? window.innerHeight - itemsH / 2 - 20 : 400, tabCenterY));
  const actionsTop = actionsCenterY - itemsH / 2;
  return (
    <>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}
      {fabOpen && (
        <div style={{ position: "fixed", right: 58, zIndex: 92,
          top: actionsTop,
          display: "flex", flexDirection: "column", gap: 14,
          transition: dragging ? "top 0.05s linear" : "top 0.2s ease" }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { if(item.a) item.a(); setFabOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: "row-reverse",
                opacity: 1, pointerEvents: "auto" }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: item.c,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, boxShadow: "0 4px 16px " + item.c + "70" }}>{item.emoji}</div>
              <div style={{ background: "#1A1A1C", color: "#fff", fontSize: 14, fontWeight: 700,
                padding: "8px 14px", borderRadius: 10, whiteSpace: "nowrap",
                boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{item.l}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ position: "fixed", right: 0, top: topPx, zIndex: 92,
        transition: dragging ? "none" : "top 0.15s ease" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setFabOpen(false); }}
               onClick={() => setFabOpen(false)}
            style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 80 : 0, overflow: "hidden",
              background: "linear-gradient(160deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF)",
              borderRadius: "12px 0 0 0",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              cursor: "pointer", borderBottom: fabOpen ? "1px solid rgba(255,255,255,0.2)" : "none",
              transition: "width 0.25s ease, height 0.25s ease" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1,
              textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>CHIUDI</span>
            <span style={{ fontSize: 16, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>?</span>
          </div>
          <div onMouseDown={onDown} onTouchStart={onDown}
            style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 100 : 90,
              background: acc, borderRadius: fabOpen ? "0 0 0 12px" : "12px 0 0 12px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "grab", userSelect: "none", touchAction: "none",
              transition: "width 0.25s ease, height 0.25s ease",
              boxShadow: "-4px 0 20px " + acc + "60" }}>
            <div style={{ width: fabOpen ? 30 : 20, height: fabOpen ? 30 : 20, borderRadius: fabOpen ? 8 : 5,
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <span style={{ fontSize: fabOpen ? 17 : 12, fontWeight: 900, color: acc, lineHeight: 1, transition: "font-size 0.25s" }}>M</span>
            </div>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)",
              fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MASTRO</span>
          </div>
        </div>
      </div>
    </>
  );
}