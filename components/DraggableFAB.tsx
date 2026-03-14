"use client";
import React, { useState, useEffect, useRef } from "react";

interface Props {
  fabOpen: boolean;
  setFabOpen: (v: boolean) => void;
  acc: string;
}

export default function DraggableFAB({ fabOpen, setFabOpen, acc }: Props) {
  const [posY, setPosY] = useState(400);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startY = useRef(0);
  const startPosY = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("mastro-fab-y");
    if (saved) setPosY(parseInt(saved));
    else setPosY(window.innerHeight - 160);
  }, []);

  const onStart = (e: React.TouchEvent | React.MouseEvent) => {
    dragging.current = true;
    moved.current = false;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    startPosY.current = posY;
  };

  useEffect(() => {
    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!dragging.current) return;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const delta = clientY - startY.current;
      if (Math.abs(delta) > 4) moved.current = true;
      const newY = Math.max(60, Math.min(window.innerHeight - 80, startPosY.current + delta));
      setPosY(newY);
    };
    const onEnd = () => {
      if (dragging.current) {
        dragging.current = false;
        localStorage.setItem("mastro-fab-y", String(posY));
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [posY]);

  return (
    <div
      onMouseDown={onStart}
      onTouchStart={onStart}
      onClick={() => { if (!moved.current) setFabOpen(!fabOpen); }}
      style={{
        position: "fixed",
        top: posY,
        right: 20,
        zIndex: 91,
        width: 60, height: 60, borderRadius: "50%",
        background: acc,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 6px 24px ${acc}50`,
        cursor: "grab",
        touchAction: "none",
        userSelect: "none",
        transition: "box-shadow 0.2s ease",
      }}
    >
      <div style={{ transition: "transform 0.3s ease", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, color: "#fff", fontWeight: 800, lineHeight: 1 }}>
          {fabOpen ? "✕" : "M"}
        </span>
      </div>
    </div>
  );
}
