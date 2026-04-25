"use client";

import { useDay } from "@/hooks/useDay";
import { useDayUI } from "./DayProvider";

export function DayButton() {
  const { tasks, loading } = useDay();
  const { setOpen } = useDayUI();

  const taskAperti = tasks.filter(
    (t) => t.stato === "pianificato" || t.stato === "in_corso"
  ).length;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Apri Day"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 12px 7px 9px",
        background: "#fff",
        borderRadius: 12,
        border: 0,
        cursor: "pointer",
        boxShadow: "0 4px 14px rgba(0,0,0,0.18), inset 0 -2px 0 rgba(0,0,0,0.06)",
      }}
    >
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, borderRadius: 7,
        background: "linear-gradient(145deg, #3ABDBD, #1E8080)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1 }}>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 0.3, color: "#1E8080" }}>DAY</span>
        <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 0.4, color: "#28A0A0", marginTop: 2 }}>
          {loading ? "..." : `${taskAperti} task`}
        </span>
      </span>
      {!loading && taskAperti > 0 && (
        <span style={{
          position: "absolute", top: -5, right: -5,
          minWidth: 18, padding: "1px 5px",
          fontSize: 9, fontWeight: 900, color: "#fff",
          background: "linear-gradient(145deg, #5DCAA5, #1D9E75)",
          border: "2px solid #fff",
          borderRadius: 50,
          boxShadow: "0 2px 6px rgba(29,158,117,0.5)",
          textAlign: "center",
        }}>
          {taskAperti}
        </span>
      )}
    </button>
  );
}
