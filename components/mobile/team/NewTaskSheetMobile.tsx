// components/mobile/team/NewTaskSheetMobile.tsx
"use client";
import React, { useState } from "react";
import type { Operator } from "@/lib/types/team";
import { PAL } from "@/lib/types/team";
import { IcoClose, IcoChevronDown, IcoCalendar } from "./icons";

interface Props {
  operators: Operator[];
  defaultOperatorId?: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function NewTaskSheetMobile({ operators, defaultOperatorId, onClose, onSubmit }: Props) {
  const [opName] = useState(operators.find(o => o.id === defaultOperatorId)?.name || "Marco Rossi");
  const [commessa] = useState("S-0003 · Rossi");
  const [task, setTask] = useState("Montare finestra cucina");
  const [priorita] = useState("Alta");
  const [scadenza] = useState("Oggi");
  const [note, setNote] = useState("Portare silicone e tasselli");

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.5)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      fontFamily: "Inter, sans-serif",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: PAL.pageBg, width: "100%", maxWidth: 480,
        maxHeight: "94vh", overflowY: "auto",
      }}>
        {/* Header verde */}
        <div style={{
          background: PAL.headerGrad,
          padding: "14px 16px",
          color: "#FFFFFF",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 24 }} />
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, textAlign: "center" as any }}>Nuovo task</div>
          <div onClick={onClose} style={{ cursor: "pointer", padding: 2 }}><IcoClose s={20} /></div>
        </div>

        <div style={{ padding: "16px 16px 24px" }}>
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
            <DropField value={priorita} prefix={<span style={{ color: PAL.errorRed, marginRight: 8, fontSize: 18 }}>●</span>} />
          </Field>
          <Field label="Scadenza">
            <DropField value={scadenza} suffix={<IcoCalendar s={16} />} />
          </Field>
          <Field label="Note">
            <input value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
          </Field>

          <button onClick={() => onSubmit({ opName, commessa, task, priorita, scadenza, note })} style={{
            width: "100%", marginTop: 16, padding: "14px 16px",
            background: PAL.gradEnd, color: "#FFFFFF", border: "none",
            borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
          }}>
            Invia task
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 12,
  border: `1px solid ${PAL.border}`, background: PAL.card,
  fontSize: 14, color: PAL.text, fontWeight: 400,
  boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: PAL.text, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function DropField({ value, prefix, suffix }: { value: string; prefix?: React.ReactNode; suffix?: React.ReactNode }) {
  return (
    <div style={{
      width: "100%", padding: "12px 14px", borderRadius: 12,
      border: `1px solid ${PAL.border}`, background: PAL.card,
      fontSize: 14, color: PAL.text, fontWeight: 400,
      display: "flex", alignItems: "center",
      cursor: "pointer",
    }}>
      {prefix}
      <span style={{ flex: 1 }}>{value}</span>
      <span style={{ color: PAL.textGrey, display: "flex" }}>{suffix || <IcoChevronDown s={16} />}</span>
    </div>
  );
}
