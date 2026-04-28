// components/mobile/team/OperatorCardMobile.tsx
"use client";
import React from "react";
import { TT, STATUS_COLORS } from "@/lib/types/team";
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

const ICON_PIN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);
const ICON_HAMMER = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14l-7 7-3-3 7-7"/><path d="M11 5l3-3 7 7-3 3"/><path d="M7 11l4 4"/></svg>
);
const ICON_CLOCK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const ICON_ALERT = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const ICON_CAR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h-8L5 8H3v6h2l1 4h12l1-4h2V8h-2z"/><circle cx="7.5" cy="14.5" r="1.5"/><circle cx="16.5" cy="14.5" r="1.5"/></svg>
);
const ICON_PHONE = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const ICON_MAP = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
);
const ICON_OPEN = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);
const ICON_TASK = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
);

export default function OperatorCardMobile({ op, onOpen, onChiama, onMappa, onTask, onRisolvi, onTraccia }: Props) {
  const c = STATUS_COLORS[op.status];

  return (
    <div onClick={() => onOpen?.(op)} style={{
      background: c.bgPastel,
      borderRadius: 18,
      padding: "12px 13px",
      margin: "10px 14px 0",
      cursor: "pointer",
      boxShadow: "0 2px 8px rgba(13,31,31,0.05)",
    }}>
      {/* Header riga: avatar + nome + stato */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <Avatar name={op.name} url={op.avatar_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: TT.text, lineHeight: 1.2 }}>
            {op.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: c.dot }} />
            <span style={{ fontSize: 11, color: c.tag, fontWeight: 800 }}>
              {op.status === "fermo" && op.fermo_minutes
                ? `Fermo da ${op.fermo_minutes}m`
                : c.text}
              {op.status === "viaggio" && op.destination_label && ` verso ${op.destination_label}`}
            </span>
          </div>
        </div>
      </div>

      {/* Righe info */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
        {op.position_label && (
          <Row icon={ICON_PIN} text={op.position_label} extra={op.timer_label && (op.status === "attivo" || op.status === "pausa") ? null : null} />
        )}
        {op.cliente && op.status === "problema" && (
          <Row icon={ICON_PIN} text={op.cliente} />
        )}
        {op.current_job && (
          <Row icon={ICON_HAMMER} text={op.current_job} extra={op.timer_label && op.status === "attivo" ? op.timer_label : null} />
        )}
        {op.problem_title && (
          <Row icon={ICON_ALERT} text={op.problem_title} colorText={STATUS_COLORS.problema.tag} />
        )}
        {op.problem_reported_ago && (
          <Row icon={ICON_CLOCK} text={`Segnalato ${op.problem_reported_ago}`} />
        )}
        {op.status === "viaggio" && op.arrival_eta && (
          <Row icon={ICON_CAR} text={`Arrivo stimato ${op.arrival_eta}`} />
        )}
        {op.status === "pausa" && op.timer_label && (
          <Row icon={ICON_CLOCK} text={op.timer_label} />
        )}
      </div>

      {/* Barra avanzamento + timer (per attivo) */}
      {(op.status === "attivo" || op.status === "pausa") && typeof op.progress === "number" && (
        <div style={{ marginBottom: 10 }}>
          {op.status === "attivo" && op.timer_label && (
            <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 11, fontWeight: 800, color: TT.text, marginBottom: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              {op.timer_label}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(13,31,31,0.08)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${op.progress}%`, height: "100%", background: c.dot, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: TT.sub }}>{op.progress}%</span>
          </div>
        </div>
      )}

      {/* Azioni rapide */}
      <div style={{ display: "flex", gap: 6 }}>
        {op.status === "problema" ? (
          <>
            <ActionBtn icon={ICON_ALERT} label="Risolvi"
              onClick={(e) => { e.stopPropagation(); onRisolvi?.(op); }}
              colorBg="#fff" colorTx={STATUS_COLORS.problema.tag} bdr={STATUS_COLORS.problema.tag + "40"} />
            <ActionBtn icon={ICON_PHONE} label="Chiama"
              onClick={(e) => { e.stopPropagation(); onChiama?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
          </>
        ) : op.status === "viaggio" ? (
          <>
            <ActionBtn icon={ICON_MAP} label="Traccia"
              onClick={(e) => { e.stopPropagation(); onTraccia?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
            <ActionBtn icon={ICON_PHONE} label="Chiama"
              onClick={(e) => { e.stopPropagation(); onChiama?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
          </>
        ) : op.status === "pausa" ? (
          <>
            <ActionBtn icon={ICON_OPEN} label="Apri"
              onClick={(e) => { e.stopPropagation(); onOpen?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
            <ActionBtn icon={ICON_TASK} label="Task"
              onClick={(e) => { e.stopPropagation(); onTask?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
          </>
        ) : (
          <>
            <ActionBtn icon={ICON_OPEN} label="Apri"
              onClick={(e) => { e.stopPropagation(); onOpen?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
            <ActionBtn icon={ICON_PHONE} label="Chiama"
              onClick={(e) => { e.stopPropagation(); onChiama?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
            <ActionBtn icon={ICON_MAP} label="Mappa"
              onClick={(e) => { e.stopPropagation(); onMappa?.(op); }}
              colorBg="#fff" colorTx={TT.acc} bdr={TT.bdr} />
          </>
        )}
      </div>
    </div>
  );
}

function Row({ icon, text, extra, colorText }: { icon: React.ReactNode; text: string; extra?: React.ReactNode; colorText?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: colorText || TT.text }}>
      <span style={{ color: TT.sub, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{text}</span>
      {extra && <span style={{ fontSize: 11, fontWeight: 800, color: TT.sub, fontFamily: "'JetBrains Mono', monospace" }}>{extra}</span>}
    </div>
  );
}

function ActionBtn({ icon, label, onClick, colorBg, colorTx, bdr }: { icon: React.ReactNode; label: string; onClick: (e: any) => void; colorBg: string; colorTx: string; bdr: string }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: "8px 10px", borderRadius: 12,
      background: colorBg, color: colorTx,
      border: `1px solid ${bdr}`,
      fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Avatar({ name, url }: { name: string; url?: string }) {
  const init = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 999, flexShrink: 0,
      background: url ? `url(${url}) center/cover` : "linear-gradient(135deg, #28A0A0 0%, #176868 100%)",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 900, letterSpacing: 0.5,
      boxShadow: "0 2px 6px rgba(13,31,31,0.15)",
    }}>
      {!url && init}
    </div>
  );
}
