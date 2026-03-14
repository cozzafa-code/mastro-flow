"use client";
import { useState, useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc, onVoice, onEvento, onCliente, onCommessa, onMessaggio }) {
  const [topPx, setTopPx] = useState(300);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({ active: false, moved: false, startY: 0, startTop: 300 });
  useEffect(() => {
    const s = localStorage.getItem("mastro:fab_top");
    setTopPx(s ? parseInt(s) : window.innerHeight - 300);
  }, []);
  const onDown = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    drag.current = { active: true, moved: false, startY: y, startTop: topPx };
    setDragging(true);
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!drag.current.active) return;
      const y = e.touches ? e.touches[0].clientY : e.clientY;
      const delta = y - drag.current.startY;
      if (Math.abs(delta) > 4) drag.current.moved = true;
      const newY = Math.max(60, Math.min(window.innerHeight - 120, drag.current.startTop + delta));
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
  const goesDown = topPx > (typeof window !== "undefined" ? window.innerHeight / 2 : 400);
  return (
    <>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}
      <div style={{ position: "fixed", right: 0, top: topPx, zIndex: 92, display: "flex", alignItems: "flex-start",
        transition: dragging ? "none" : "top 0.15s ease", flexDirection: goesDown ? "column-reverse" : "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: goesDown ? "column-reverse" : "column", gap: 18, marginRight: 20 }}>
            {items.map((item, i) => (
              <div key={i} onClick={() => { if(item.a) item.a(); setFabOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: "row-reverse",
                  opacity: fabOpen ? 1 : 0,
                  transform: fabOpen ? "translateX(0) scale(1)" : "translateX(40px) scale(0.7)",
                  transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1) " + (fabOpen ? i*55 : 0) + "ms",
                  pointerEvents: fabOpen ? "auto" : "none" }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", background: item.c,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, boxShadow: "0 4px 16px " + item.c + "70" }}>{item.emoji}</div>
                <div style={{ background: "#1A1A1C", color: "#fff", fontSize: 14, fontWeight: 700,
                  padding: "8px 14px", borderRadius: 10, whiteSpace: "nowrap",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{item.l}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {fabOpen && (
              <div onTouchEnd={(e) => { e.stopPropagation(); setFabOpen(false); }} onClick={() => setFabOpen(false)}
                style={{ width: 46, height: 56, background: acc, borderRadius: "12px 0 0 0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
                <span style={{ fontSize: 22, color: "#fff" }}>?</span>
              </div>
            )}
            <div onMouseDown={onDown} onTouchStart={onDown}
              style={{ width: fabOpen ? 46 : 26, height: fabOpen ? 100 : 110,
                background: acc, borderRadius: fabOpen ? "0 0 0 12px" : "12px 0 0 12px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
                cursor: "grab", userSelect: "none", touchAction: "none",
                transition: "width 0.25s ease, height 0.25s ease",
                boxShadow: "-4px 0 20px " + acc + "60" }}>
              {fabOpen ? (
                <>
                  <span style={{ fontSize: 18, color: "#fff" }}>?</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1.5,
                    writingMode: "vertical-rl", transform: "rotate(180deg)" }}>SPOSTA</span>
                </>
              ) : (
                <>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: acc, lineHeight: 1 }}>M</span>
                  </div>
                  <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)",
                    fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MASTRO</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}