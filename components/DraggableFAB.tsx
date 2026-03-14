"use client";
import { useState, useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc, onVoice, onEvento, onCliente, onCommessa, onMessaggio }) {
  const [topPx, setTopPx] = useState(300);
  const [dragging, setDragging] = useState(false);
  const [goUp, setGoUp] = useState(false);
  const drag = useRef({ active: false, moved: false, startY: 0, startTop: 300 });
  useEffect(() => {
    const s = localStorage.getItem("mastro:fab_top");
    const y = s ? parseInt(s) : window.innerHeight / 2;
    setTopPx(y);
    setGoUp(y > window.innerHeight / 2);
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
      setGoUp(newY > window.innerHeight / 2);
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
  const itemsH = items.length * 72 + 56;
  const actionsTop = goUp ? topPx - itemsH : topPx + 60;
  return (
    <>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}
      {fabOpen && (
        <div style={{ position: "fixed", right: 60, zIndex: 92,
          top: actionsTop,
          display: "flex", flexDirection: goUp ? "column-reverse" : "column", gap: 14,
          transition: dragging ? "top 0.1s ease" : "top 0.25s ease" }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { if(item.a) item.a(); setFabOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: "row-reverse",
                opacity: 1,
                transform: "translateX(0) scale(1)",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1) " + i*55 + "ms",
                pointerEvents: "auto" }}>
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
            style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 56 : 0, overflow: "hidden",
              background: "#DC4444", borderRadius: "12px 0 0 0",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
              cursor: "pointer", borderBottom: fabOpen ? "1px solid rgba(255,255,255,0.15)" : "none",
              transition: "width 0.25s ease, height 0.25s ease" }}>
            <span style={{ fontSize: 20, color: "#fff" }}>?</span>
            <span style={{ fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: 1 }}>CHIUDI</span>
          </div>
          <div onMouseDown={onDown} onTouchStart={onDown}
            style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 100 : 90,
              background: acc, borderRadius: fabOpen ? "0 0 0 12px" : "12px 0 0 12px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "grab", userSelect: "none", touchAction: "none",
              transition: "width 0.25s ease, height 0.25s ease",
              boxShadow: "-4px 0 20px " + acc + "60" }}>
            <div style={{ width: fabOpen ? 30 : 22, height: fabOpen ? 30 : 22, borderRadius: fabOpen ? 8 : 6,
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <span style={{ fontSize: fabOpen ? 18 : 13, fontWeight: 900, color: acc, lineHeight: 1, transition: "font-size 0.25s" }}>M</span>
            </div>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)",
              fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MASTRO</span>
          </div>
        </div>
      </div>
    </>
  );
}