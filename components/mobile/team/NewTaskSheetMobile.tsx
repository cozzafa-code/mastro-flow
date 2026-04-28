// components/mobile/team/NewTaskSheetMobile.tsx
"use client";
import React, { useState } from "react";
import type { Operator } from "@/lib/types/team";
import { TT } from "@/lib/types/team";

interface Props {
  operators: Operator[];
  defaultOperatorId?: string;
  onClose: () => void;
  onSubmit: (data: { operator_id: string; commessa: string; title: string; priority: string; due: string; notes: string }) => void;
}

export default function NewTaskSheetMobile({ operators, defaultOperatorId, onClose, onSubmit }: Props) {
  const [opId, setOpId] = useState(defaultOperatorId || (operators[0]?.id || ""));
  const [commessa, setCommessa] = useState("");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Alta");
  const [due, setDue] = useState("Oggi");
  const [notes, setNotes] = useState("");

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(13,31,31,0.55)", zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: TT.card, width: "100%", maxWidth: 480,
        borderRadius: "20px 20px 0 0", padding: "16px 16px 24px",
        maxHeight: "92vh", overflowY: "auto",
      }}>
        <div style={{ width: 40, height: 4, background: "#E0E0E0", borderRadius: 999, margin: "0 auto 14px" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: TT.text }}>Nuovo task</div>
          <span onClick={onClose} style={{ fontSize: 20, color: TT.sub, cursor: "pointer", padding: 4 }}>✕</span>
        </div>

        <Field label="Assegna a">
          <Select value={opId} onChange={setOpId} options={operators.map(o => ({ v: o.id, l: o.name }))} />
        </Field>

        <Field label="Commessa">
          <Input value={commessa} onChange={setCommessa} placeholder="es. S-0003 · Rossi" />
        </Field>

        <Field label="Task">
          <Input value={title} onChange={setTitle} placeholder="es. Montare finestra cucina" />
        </Field>

        <Field label="Priorità">
          <Pills value={priority} onChange={setPriority} options={["Alta", "Media", "Bassa"]} colorActive={priority === "Alta" ? "#EF4444" : priority === "Media" ? "#F59E0B" : "#22C55E"} />
        </Field>

        <Field label="Scadenza">
          <Pills value={due} onChange={setDue} options={["Oggi", "Domani", "Questa settimana"]} colorActive={TT.acc} />
        </Field>

        <Field label="Note">
          <Input value={notes} onChange={setNotes} placeholder="es. Portare silicone e tasselli" />
        </Field>

        <button onClick={() => onSubmit({ operator_id: opId, commessa, title, priority, due, notes })} style={{
          width: "100%", marginTop: 6, padding: 14, borderRadius: 14,
          background: TT.acc, color: "#fff", border: "none",
          fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 4px 12px rgba(40,160,160,0.3)",
        }}>
          Invia task
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: TT.sub, letterSpacing: 0.4, marginBottom: 6 }}>{label.toUpperCase()}</div>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder?: string }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", padding: "11px 13px", borderRadius: 12,
        border: `1.5px solid ${TT.bdr}`, background: "#FBF8F3",
        fontSize: 13, fontWeight: 600, color: TT.text,
        boxSizing: "border-box" as any, outline: "none", fontFamily: "inherit",
      }}
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (s: string) => void; options: { v: string; l: string }[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      width: "100%", padding: "11px 13px", borderRadius: 12,
      border: `1.5px solid ${TT.bdr}`, background: "#FBF8F3",
      fontSize: 13, fontWeight: 700, color: TT.text,
      boxSizing: "border-box" as any, outline: "none", fontFamily: "inherit",
    }}>
      {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  );
}

function Pills({ value, onChange, options, colorActive }: { value: string; onChange: (s: string) => void; options: string[]; colorActive: string }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(o => {
        const active = o === value;
        return (
          <div key={o} onClick={() => onChange(o)} style={{
            padding: "8px 14px", borderRadius: 999, cursor: "pointer",
            background: active ? colorActive : TT.card,
            color: active ? "#fff" : TT.text,
            border: `1.5px solid ${active ? colorActive : TT.bdr}`,
            fontSize: 12, fontWeight: 800,
          }}>{o}</div>
        );
      })}
    </div>
  );
}
