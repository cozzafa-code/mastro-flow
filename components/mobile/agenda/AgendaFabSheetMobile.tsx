// components/mobile/agenda/AgendaFabSheetMobile.tsx
"use client";
import React from "react";
import type { AgendaEventType } from "../../../lib/types/agenda";

interface Props {
  open: boolean;
  onClose: () => void;
  onPick: (kind: AgendaEventType | "nota") => void;
}

const ACTIONS: { kind: AgendaEventType | "nota"; label: string; bg: string; tx: string; icon: string }[] = [
  { kind: "montaggio",   label: "Nuovo montaggio",   bg: "#DCF5E7", tx: "#15803D", icon: "M12 2v20 M2 12h20" },
  { kind: "sopralluogo", label: "Nuovo sopralluogo", bg: "#DBEAFE", tx: "#1D4ED8", icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" },
  { kind: "produzione",  label: "Nuova produzione",  bg: "#FEF0DB", tx: "#B45309", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
  { kind: "problema",    label: "Nuovo problema",    bg: "#FFE4E6", tx: "#BE123C", icon: "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" },
  { kind: "task",        label: "Nuovo task",        bg: "#EDE9FE", tx: "#6D28D9", icon: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" },
  { kind: "nota",        label: "Nota veloce",       bg: "#F4F4F5", tx: "#3F3F46", icon: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" },
];

export default function AgendaFabSheetMobile({ open, onClose, onPick }: Props) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 1100,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "#fff",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "10px 16px 24px",
        }}
      >
        <div style={{ width: 40, height: 5, background: "#E4E4E7", borderRadius: 4, margin: "0 auto 14px" }} />
        <div style={{ fontSize: 16, fontWeight: 900, color: "#0D1F1F", marginBottom: 14, textAlign: "center" }}>
          Nuovo impegno
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {ACTIONS.map((a) => (
            <div
              key={a.label}
              onClick={() => { onPick(a.kind); onClose(); }}
              style={{
                background: a.bg,
                borderRadius: 14,
                padding: "16px 8px",
                textAlign: "center",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                minHeight: 100,
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={a.tx} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={a.icon} />
              </svg>
              <div style={{ fontSize: 11, fontWeight: 800, color: a.tx, lineHeight: 1.2 }}>
                {a.label}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: 12,
            marginTop: 14,
            background: "transparent",
            border: "none",
            color: "#71717A",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
