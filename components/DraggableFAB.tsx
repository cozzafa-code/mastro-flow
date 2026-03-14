"use client";
import { useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc }) {
  return (
    <div onClick={() => setFabOpen(!fabOpen)} style={{
      position: "fixed", bottom: 160, right: 20, zIndex: 91,
      width: 60, height: 60, borderRadius: "50%",
      background: acc,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 6px 24px " + acc + "50",
      cursor: "pointer", transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    }}>
      <div style={{ transition: "transform 0.3s ease", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, color: "#fff", fontWeight: 800, lineHeight: 1 }}>
          {fabOpen ? "X" : "M"}
        </span>
      </div>
    </div>
  );
}