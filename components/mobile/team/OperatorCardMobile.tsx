// components/mobile/team/OperatorCardMobile.tsx
"use client";
import React from "react";
import { PAL, STATUS_INFO } from "@/lib/types/team";
import type { Operator } from "@/lib/types/team";
import {
  IcoApri, IcoPhone, IcoMapPin, IcoTask, IcoXCircle, IcoNavigation,
  IcoHammer, IcoClock, IcoAlert,
} from "./icons";

interface Props {
  op: Operator;
  onOpen?: (op: Operator) => void;
  onChiama?: (op: Operator) => void;
  onMappa?: (op: Operator) => void;
  onTask?: (op: Operator) => void;
  onRisolvi?: (op: Operator) => void;
  onTraccia?: (op: Operator) => void;
}

function Avatar({ name, url, size = 44 }: { name: string; url?: string; size?: number }) {
  if (url) {
    return (
      <img src={url} alt={name} style={{
        width: size, height: size, borderRadius: 999,
        background: "#FFFFFF",
        objectFit: "cover" as any,
        flexShrink: 0,
      }} />
    );
  }
  const init = (name || "?").split(" ").map(p => p?.[0] || "").slice(0,2).join("").toUpperCase() || "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: "linear-gradient(135deg, #94A3B8, #64748B)",
      color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 700,
    }}>{init}</div>
  );
}

export default function OperatorCardMobile({ op, onOpen, onChiama, onMappa, onTask, onRisolvi, onTraccia }: Props) {
  const s = STATUS_INFO[op.status];

  // SFONDO CARD: bianco per attivo/offline; pastello solo per pausa/problema/viaggio/fermo
  const cardBg =
    op.status === "attivo"  ? PAL.card :
    op.status === "offline" ? PAL.card :
    s.bg;

  // BORDER: sempre 1px - colore neutro o tinta pastello stato
  const cardBorder =
    op.status === "attivo"  ? PAL.border :
    op.status === "offline" ? PAL.border :
    "transparent"; // pastelli mockup non hanno border visibile

  // Bottoni per stato
  let buttons: { lbl: string; ico: React.ReactNode; onClick: () => void; danger?: boolean }[] = [];
  if (op.status === "problema") {
    buttons = [
      { lbl: "Risolvi", ico: <IcoXCircle s={14} />, onClick: () => onRisolvi?.(op), danger: true },
      { lbl: "Chiama",  ico: <IcoPhone s={14} />,   onClick: () => onChiama?.(op),  danger: true },
    ];
  } else if (op.status === "viaggio") {
    buttons = [
      { lbl: "Traccia", ico: <IcoNavigation s={14} />, onClick: () => onTraccia?.(op) },
      { lbl: "Chiama",  ico: <IcoPhone s={14} />,      onClick: () => onChiama?.(op) },
    ];
  } else if (op.status === "pausa") {
    buttons = [
      { lbl: "Apri", ico: <IcoApri s={14} />, onClick: () => onOpen?.(op) },
      { lbl: "Task", ico: <IcoTask s={14} />, onClick: () => onTask?.(op) },
    ];
  } else {
    buttons = [
      { lbl: "Apri",   ico: <IcoApri s={14} />,   onClick: () => onOpen?.(op) },
      { lbl: "Chiama", ico: <IcoPhone s={14} />,  onClick: () => onChiama?.(op) },
      { lbl: "Mappa",  ico: <IcoMapPin s={14} />, onClick: () => onMappa?.(op) },
    ];
  }

  return (
    <div onClick={() => onOpen?.(op)} style={{
      background: cardBg,
      borderRadius: 16,
      padding: 16,
      margin: "12px 16px 0",
      border: `1px solid ${cardBorder}`,
      cursor: "pointer",
      fontFamily: "Inter, -apple-system, sans-serif",
    }}>
      {/* HEADER: avatar 44px + nome + stato (dot+testo) inline a destra */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <Avatar name={op.name} url={op.avatar_url} size={44} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: PAL.text }}>{op.name}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: s.dot }} />
            <span style={{ fontSize: 12, color: s.tx, fontWeight: 600 }}>{s.text}</span>
          </span>
        </div>
      </div>

      {/* RIGHE INFO con icone 14px */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, paddingLeft: 4 }}>
        {op.position_label && <Row icon={<IcoMapPin s={14} />} text={op.position_label} />}
        {op.cliente && op.status === "problema" && <Row icon={<IcoMapPin s={14} />} text={op.cliente} />}
        {op.current_job && <Row icon={<IcoHammer s={14} />} text={op.current_job} extra={op.status === "attivo" && op.timer_label ? op.timer_label : null} />}
        {op.problem_title && <Row icon={<IcoAlert s={14} />} text={op.problem_title} />}
        {op.problem_reported_ago && <Row icon={<IcoClock s={14} />} text={`Segnalato ${op.problem_reported_ago}`} />}
        {op.status === "viaggio" && op.destination_label && <Row icon={<IcoNavigation s={14} />} text={`In viaggio verso ${op.destination_label}`} />}
        {op.status === "viaggio" && op.arrival_eta && <Row icon={<IcoClock s={14} />} text={`Arrivo stimato ${op.arrival_eta}`} />}
        {op.status === "pausa" && op.timer_label && <Row icon={<IcoClock s={14} />} text={op.timer_label} />}
      </div>

      {/* PROGRESS BAR (attivo/pausa) */}
      {(op.status === "attivo" || op.status === "pausa") && typeof op.progress === "number" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 6, background: "rgba(13,31,31,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${op.progress}%`, height: "100%", background: s.dot }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: PAL.textGrey, minWidth: 32, textAlign: "right" as any }}>{op.progress}%</span>
        </div>
      )}

      {/* BOTTONI */}
      <div style={{ display: "flex", gap: 8 }}>
        {buttons.map((b, i) => (
          <button key={i} onClick={(e) => { e.stopPropagation(); b.onClick(); }} style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 12,
            background: PAL.card,
            color: b.danger ? PAL.errorRed : PAL.text,
            border: `1px solid ${b.danger ? PAL.errorRed + "60" : PAL.border}`,
            fontSize: 12, fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {b.ico}
            <span>{b.lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ icon, text, extra }: { icon: React.ReactNode; text: string; extra?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: PAL.text }}>
      <span style={{ color: PAL.textGrey, flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 400 }}>{text}</span>
      {extra && <span style={{ fontSize: 13, fontWeight: 600, color: PAL.text }}>{extra}</span>}
    </div>
  );
}
