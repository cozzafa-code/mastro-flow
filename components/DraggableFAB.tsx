"use client";
import React, { useState, useEffect, useRef } from "react";

interface Props {
  fabOpen: boolean;
  setFabOpen: (v: boolean) => void;
  acc: string;
}

export default function DraggableFAB({ fabOpen, setFabOpen, acc }: Props) {
  const [posY, setPosY] = useState<number | null>(null);
  const dragging = useRef(false);
  const moved = useRef(false);
  const startY = useRef(0);
  const startPosY = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("mastro-fab-y");
    if (saved) setPosY(parseInt(saved));
    else setPosY(window.innerHeight - 160);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    dragging.current = true;
    moved.current = false;
    startY.current = e.touches[0].clientY;
    startPosY.current = posY ?? 400;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (Math.abs(delta) > 4) moved.current = true;
    const newY = Math.max(60, Math.min(window.innerHeight - 80, (startPosY.current) + delta));
    setPosY(newY);
  };

  const onTouchEnd = () => {
    dragging.current = false;
    if (posY !== null) localStorage.setItem("mastro-fab-y", String(posY));
  };

  const onClick = () => {
    if (!moved.current) setFabOpen(!fabOpen);
  };

  if (posY === null) return null;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
      style={{
        position: "fixed",
        top: posY,
        right: 20,
        zIndex: 91,
        width: 60, height: 60, borderRadius: "50%",
        background: acc,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 6px 24px ${acc}50`,
        cursor: "pointer",
        touchAction: "none",
        userSelect: "none",
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
