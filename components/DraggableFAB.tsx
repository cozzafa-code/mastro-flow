"use client";
import { useState, useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc, onVoice, onEvento, onCliente, onCommessa, onMessaggio }) {
  const [topPx, setTopPx] = useState(300);
  const drag = useRef({ active: false, moved: false, startY: 0, startTop: 300 });
  useEffect(() => {
    const s = localStorage.getItem("mastro:fab_top");
    setTopPx(s ? parseInt(s) : window.innerHeight - 300);
  }, []);
  const onDown = (e) => {
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    drag.current = { active: true, moved: false, startY: y, startTop: topPx };
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
      if (!drag.current.moved) setFabOpen(v => !v);
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
  }, [topPx, setFabOpen]);
  const items = [
    { l: "Nota vocale", c: "#E53935", a: onVoice },
    { l: "Appuntamento", c: "#1A9E73", a: onEvento },
    { l: "Nuovo cliente", c: "#3B7FE0", a: onCliente },
    { l: "Nuova commessa", c: "#E8A020", a: onCommessa },
    { l: "Messaggio", c: "#8B5CF6", a: onMessaggio },
  ];
  return (
    <>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}
      <div style={{ position: "fixed", right: 0, top: topPx, zIndex: 92, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginRight: 8 }}>
          {items.map((item, i) => (
            <div key={i} onClick={() => { if(item.a) item.a(); setFabOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, flexDirection: "row-reverse",
                opacity: fabOpen ? 1 : 0,
                transform: fabOpen ? "translateX(0) scale(1)" : "translateX(40px) scale(0.7)",
                transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1) " + (fabOpen ? i*55 : 0) + "ms",
                pointerEvents: fabOpen ? "auto" : "none" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: item.c,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px " + item.c + "60" }} />
              <div style={{ background: "#1A1A1C", color: "#fff", fontSize: 12, fontWeight: 700,
                padding: "5px 10px", borderRadius: 7, whiteSpace: "nowrap" }}>{item.l}</div>
            </div>
          ))}
        </div>
        <div onMouseDown={onDown} onTouchStart={onDown}
          style={{ width: 28, height: 90, background: acc, borderRadius: "10px 0 0 10px",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            cursor: "grab", userSelect: "none", touchAction: "none",
            boxShadow: "-4px 0 18px " + acc + "50" }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>M</span>
          <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)",
            fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: 2, marginTop: 4 }}>MASTRO</span>
        </div>
      </div>
    </>
  );
}