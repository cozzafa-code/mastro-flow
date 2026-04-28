// components/mobile/team/OperatorCardMobile.tsx
"use client";
import React from "react";
import { PAL, STATUS_INFO } from "@/lib/types/team";
import type { Operator } from "@/lib/types/team";

interface Props {
  op: Operator;
  onOpen?: (op: Operator) => void;
  onChiama?: (op: Operator) => void;
  onMappa?: (op: Operator) => void;
  onTask?: (op: Operator) => void;
  onRisolvi?: (op: Operator) => void;
  onTraccia?: (op: Operator) => void;
}

const ICO_PIN = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ICO_HAMMER = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14l-7 7-3-3 7-7"/><path d="M11 5l3-3 7 7-3 3"/></svg>
);
const ICO_CLOCK = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const ICO_ALERT = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const ICO_CAR = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
);
const ICO_PHONE = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const ICO_MAP = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
);
const ICO_OPEN = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const ICO_TASK = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);
const ICO_X = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

function Avatar({ name, url }: { name: string; url?: string }) {
  const init = name.split(" ").map(p => p[0]).slice(0,2).join("").toUpperCase();
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 999, flexShrink: 0,
      background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #94A3B8 0%, #64748B 100%)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 800,
    }}>
      {!url && init}
    </div>
  );
}

export default function OperatorCardMobile({ op, onOpen, onChiama, onMappa, onTask, onRisolvi, onTraccia }: Props) {
  const s = STATUS_INFO[op.status];

  // Bottoni in base a stato
  let buttons: { lbl: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
  if (op.status === "problema") {
    buttons = [
      { lbl: "Risolvi", icon: ICO_X, onClick: () => onRisolvi?.(op), danger: true },
      { lbl: "Chiama", icon: ICO_PHONE, onClick: () => onChiama?.(op) },
    ];
  } else if (op.status === "viaggio") {
    buttons = [
      { lbl: "Traccia", icon: ICO_MAP, onClick: () => onTraccia?.(op) },
      { lbl: "Chiama", icon: ICO_PHONE, onClick: () => onChiama?.(op) },
    ];
  } else if (op.status === "pausa") {
    buttons = [
      { lbl: "Apri", icon: ICO_OPEN, onClick: () => onOpen?.(op) },
      { lbl: "Task", icon: ICO_TASK, onClick: () => onTask?.(op) },
    ];
  } else {
    buttons = [
      { lbl: "Apri", icon: ICO_OPEN, onClick: () => onOpen?.(op) },
      { lbl: "Chiama", icon: ICO_PHONE, onClick: () => onChiama?.(op) },
      { lbl: "Mappa", icon: ICO_MAP, onClick: () => onMappa?.(op) },
    ];
  }

  return (
    <div onClick={() => onOpen?.(op)} style={{
      background: s.bg,
      borderRadius: 14,
      padding: "11px 12px",
      margin: "8px 14px 0",
      cursor: "pointer",
    }}>
      {/* Riga top: avatar + nome + stato a destra */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Avatar name={op.name} url={op.avatar_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as any }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: PAL.text }}>{op.name}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: s.dot }} />
              <span style={{ fontSize: 11, color: s.tx, fontWeight: 700 }}>{s.text}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Righe info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: op.progress != null ? 8 : 10, paddingLeft: 4 }}>
        {op.position_label && (
          <Row icon={ICO_PIN} text={op.position_label} />
        )}
        {op.cliente && op.status === "problema" && (
          <Row icon={ICO_PIN} text={op.cliente} />
        )}
        {op.current_job && (
          <Row icon={ICO_HAMMER} text={op.current_job} extra={op.status === "attivo" && op.timer_label ? op.timer_label : null} />
        )}
        {op.problem_title && (
          <Row icon={ICO_ALERT} text={op.problem_title} />
        )}
        {op.problem_reported_ago && (
          <Row icon={ICO_CLOCK} text={`Segnalato ${op.problem_reported_ago}`} />
        )}
        {op.status === "viaggio" && op.destination_label && (
          <Row icon={ICO_CAR} text={`In viaggio verso ${op.destination_label}`} />
        )}
        {op.status === "viaggio" && op.arrival_eta && (
          <Row icon={ICO_CLOCK} text={`Arrivo stimato ${op.arrival_eta}`} />
        )}
        {op.status === "pausa" && op.timer_label && (
          <Row icon={ICO_CLOCK} text={op.timer_label} />
        )}
      </div>

      {/* Progress bar (solo attivo/pausa) */}
      {(op.status === "attivo" || op.status === "pausa") && typeof op.progress === "number" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 5, background: "rgba(13,31,31,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${op.progress}%`, height: "100%", background: s.dot }} />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: PAL.textSub, minWidth: 32, textAlign: "right" as any }}>{op.progress}%</span>
        </div>
      )}

      {/* Bottoni azione outline */}
      <div style={{ display: "flex", gap: 6 }}>
        {buttons.map((b, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); b.onClick(); }} style={{
            flex: 1, padding: "8px 8px", borderRadius: 10,
            background: PAL.card,
            color: b.danger ? PAL.problemaText : PAL.text,
            border: `1px solid ${b.danger ? PAL.problemaText + "40" : PAL.cardBorder}`,
            fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}>
            {b.icon}
            <span>{b.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ icon, text, extra }: { icon: React.ReactNode; text: string; extra?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: PAL.text }}>
      <span style={{ color: PAL.textSub, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{text}</span>
      {extra && <span style={{ fontSize: 11, fontWeight: 700, color: PAL.text, fontFamily: "inherit" }}>{extra}</span>}
    </div>
  );
}
