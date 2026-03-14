"use client";
import { useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc }) {
  const ref = useRef(null);
  const state = useRef({ dragging: false, moved: false, startY: 0, posY: 300 });
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const saved = localStorage.getItem("mastro-fab-y");
    const initY = saved ? parseInt(saved) : window.innerHeight - 250;
    state.current.posY = initY;
    el.style.top = initY + "px";
    const onStart = (e) => {
      state.current.dragging = true;
      state.current.moved = false;
      state.current.startY = e.touches[0].clientY;
    };
    const onMove = (e) => {
      if (!state.current.dragging) return;
      const delta = e.touches[0].clientY - state.current.startY;
      if (Math.abs(delta) > 4) state.current.moved = true;
      const newY = Math.max(80, Math.min(window.innerHeight - 150, state.current.posY + delta));
      el.style.top = newY + "px";
    };
    const onEnd = () => {
      if (!state.current.dragging) return;
      state.current.dragging = false;
      const cur = parseInt(el.style.top);
      state.current.posY = cur;
      localStorage.setItem("mastro-fab-y", String(cur));
      if (!state.current.moved) setFabOpen(!fabOpen);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [fabOpen, setFabOpen]);
  return (
    <div ref={ref} style={{ position: "fixed", top: 300, right: 20, zIndex: 91,
      width: 60, height: 60, borderRadius: "50%", background: acc,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 6px 24px " + acc + "50",
      cursor: "pointer", touchAction: "none", userSelect: "none" }}>
      <span style={{ fontSize: 26, color: "#fff", fontWeight: 800, lineHeight: 1 }}>
        {fabOpen ? "X" : "M"}
      </span>
    </div>
  );
}