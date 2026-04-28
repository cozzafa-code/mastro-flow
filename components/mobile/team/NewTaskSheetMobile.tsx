// components/mobile/team/NewTaskSheetMobile.tsx
"use client";
import React, { useState } from "react";
import type { Operator } from "@/lib/types/team";
import { PAL } from "@/lib/types/team";

interface Props {
  operators: Operator[];
  defaultOperatorId?: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ICO_BACK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);
const ICO_CHEV = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const ICO_CAL = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

export default function NewTaskSheetMobile({ operators, defaultOperatorId, onClose, onSubmit }: Props) {
  const [opId, setOpId] = useState(defaultOperatorId || operators[0]?.id || "");
  const [commessa, setCommessa] = useState("S-0003 · Rossi");
  const [task, setTask] = useState("Montare finestra cucina");
  const [priorita, setPriorita] = useState("Alta");
  const [scadenza, setScadenza] = useState("Oggi");
  const [note, setNote] = useState("Portare silicone e tasselli");

  const opName = operators.find(o => o.id === opId)?.name || "Marco Rossi";

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.45)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: PAL.pageBg, width: "100%", maxWidth: 480,
        maxHeight: "94vh", overflowY: "auto",
      }}>
        {/* Header verde */}
        <div style={{
          background: PAL.headerGrad,
          padding: "12px 14px",
          color: "#fff",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div onClick={onClose} style={{ cursor: "pointer", padding: 2 }}>{ICO_BACK}</div>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 700, textAlign: "center" as any }}>Nuovo task</div>
          <div style={{ width: 24 }} />
        </div>

        <div style={{ padding: "16px 14px 24px" }}>
          <Field label="Assegna a">
            <DropField value={opName} />
          </Field>
          <Field label="Commessa">
            <DropField value={commessa} />
          </Field>
          <Field label="Task">
            <input value={task} onChange={e => setTask(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Priorità">
            <DropField value={priorita} prefix={<span style={{ color: PAL.problemaText, marginRight: 6 }}>●</span>} />
          </Field>
          <Field label="Scadenza">
            <DropField value={scadenza} suffix={<span style={{ color: PAL.textSub }}>{ICO_CAL}</span>} />
          </Field>
          <Field label="Note">
            <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
          </Field>

          <button onClick={() => onSubmit({ opId, commessa, task, priorita, scadenza, note })} style={{
            width: "100%", marginTop: 14, padding: "13px 14px",
            background: PAL.tealDark, color: "#fff", border: "none",
            borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>
            Invia task
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 12px", borderRadius: 10,
  border: `1px solid ${PAL.cardBorder}`, background: PAL.card,
  fontSize: 13, color: PAL.text, fontWeight: 500,
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: PAL.text, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

const ICO_CHEV_DOWN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);

function DropField({ value, prefix, suffix }: { value: string; prefix?: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <div style={{
      width: "100%", padding: "11px 12px", borderRadius: 10,
      border: `1px solid ${PAL.cardBorder}`, background: PAL.card,
      fontSize: 13, color: PAL.text, fontWeight: 500,
      display: "flex", alignItems: "center",
      cursor: "pointer",
    }}>
      {prefix}
      <span style={{ flex: 1 }}>{value}</span>
      {suffix || <span style={{ color: PAL.textSub }}>{ICO_CHEV_DOWN}</span>}
    </div>
  );
}
