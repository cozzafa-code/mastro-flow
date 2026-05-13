// components/montaggi/MontaggiFormFields.tsx
"use client";

import React from "react";
import { C, MontaggioStato, statoLabel } from "./montaggi-types";
import { SQUADRE_DEFAULT } from "./montaggi-editor-helpers";

// ===== Wrapper label + child =====
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: C.navyDim,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
      {hint && (
        <div
          style={{
            fontSize: 10,
            color: C.navyFaint,
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

// ===== Input testo/numero/data/ora =====
export function Input({
  value,
  onChange,
  type,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number" | "date" | "time";
  placeholder?: string;
}) {
  return (
    <input
      type={type || "text"}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 10,
        border: `1.5px solid ${C.borderStrong}`,
        background: C.white,
        color: C.navyText,
        fontSize: 14,
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
      }}
    />
  );
}

// ===== Textarea note =====
export function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 10,
        border: `1.5px solid ${C.borderStrong}`,
        background: C.white,
        color: C.navyText,
        fontSize: 13,
        fontWeight: 500,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        resize: "vertical" as any,
        minHeight: 70,
      }}
    />
  );
}

// ===== Row 2 colonne =====
export function Row2({
  left,
  right,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10,
      }}
    >
      {left}
      {right}
    </div>
  );
}

// ===== Selettore squadra multi-tap =====
export function SquadraPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  function toggle(sq: string) {
    if (selected.includes(sq)) {
      onChange(selected.filter((x) => x !== sq));
    } else {
      onChange([...selected, sq]);
    }
  }
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {SQUADRE_DEFAULT.map((sq) => {
        const on = selected.includes(sq);
        return (
          <button
            key={sq}
            type="button"
            onClick={() => toggle(sq)}
            style={{
              padding: "9px 16px",
              borderRadius: 12,
              border: on ? "none" : `1.5px solid ${C.borderStrong}`,
              background: on ? C.navy : C.white,
              color: on ? C.white : C.navyText,
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            {sq}
          </button>
        );
      })}
    </div>
  );
}

// ===== Selettore stato =====
const STATI_OPZIONI: MontaggioStato[] = [
  "da_pianificare",
  "programmato",
  "in_corso",
  "completato",
  "annullato",
];

export function StatoPicker({
  value,
  onChange,
}: {
  value: MontaggioStato;
  onChange: (s: MontaggioStato) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {STATI_OPZIONI.map((s) => {
        const on = value === s;
        let bg = C.white;
        let fg = C.navyDim;
        if (on) {
          if (s === "completato") {
            bg = C.green;
            fg = C.white;
          } else if (s === "in_corso") {
            bg = C.greenBright;
            fg = C.white;
          } else if (s === "annullato") {
            bg = C.red;
            fg = C.white;
          } else if (s === "programmato") {
            bg = C.amber;
            fg = C.navy;
          } else {
            bg = C.navy;
            fg = C.white;
          }
        }
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: on ? "none" : `1.5px solid ${C.borderStrong}`,
              background: bg,
              color: fg,
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              cursor: "pointer",
            }}
          >
            {statoLabel(s)}
          </button>
        );
      })}
    </div>
  );
}

// ===== Selettore commessa (per nuovo) =====
export function CommessaPicker({
  commesse,
  selectedId,
  onChange,
}: {
  commesse: any[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={selectedId}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "11px 12px",
        borderRadius: 10,
        border: `1.5px solid ${C.borderStrong}`,
        background: C.white,
        color: C.navyText,
        fontSize: 14,
        fontWeight: 600,
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        appearance: "none",
      }}
    >
      <option value="">— Scegli commessa —</option>
      {commesse.map((c) => (
        <option key={c.id} value={c.id}>
          {c.code} · {c.cliente || ""} {c.cognome || ""}
        </option>
      ))}
    </select>
  );
}
