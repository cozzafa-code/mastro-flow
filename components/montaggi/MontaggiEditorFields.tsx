"use client";
import React from "react";
import { C } from "./montaggi-editor-types";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: `1.5px solid ${C.borderStrong}`,
  background: C.white,
  color: C.navyText,
  fontSize: 14, fontWeight: 600,
  outline: "none",
  boxSizing: "border-box",
};

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10, fontWeight: 800,
        color: C.navyDim,
        textTransform: "uppercase", letterSpacing: 0.5,
        marginBottom: 5,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{label}</span>
        {hint && <span style={{ fontSize: 9, color: C.navyFaint, textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function FieldDataDurata({ label, hint, value, onOpen }: { label: string; hint?: string; value: string; onOpen: () => void }) {
  return (
    <Field label={label} hint={hint}>
      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
        <input
          type="text"
          value={value}
          readOnly
          placeholder="Tap 'Pianifica'"
          onClick={onOpen}
          style={{ ...inputStyle, flex: 1, fontWeight: value ? 800 : 600, color: value ? C.navyText : C.navyFaint, cursor: "pointer" }}
        />
        <button
          type="button"
          onClick={onOpen}
          style={{
            flex: "0 0 auto",
            padding: "0 14px",
            borderRadius: 10,
            background: C.amber,
            color: C.navy,
            border: "none",
            fontSize: 12, fontWeight: 800,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
            <rect x={3} y={4} width={18} height={18} rx={2} />
            <line x1={3} y1={10} x2={21} y2={10} />
            <polyline points="9 15 11 17 15 13" />
          </svg>
          Pianifica
        </button>
      </div>
    </Field>
  );
}

export function Banner({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      marginTop: -8, marginBottom: 12,
      padding: "9px 14px",
      background: C.navy, color: C.white,
      borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.85, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      <span style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

export function PickerRow({ label, sub, onClick, variant, placeholder }: {
  label: string; sub: string; onClick: () => void;
  variant: "amber" | "green";
  placeholder?: boolean;
}) {
  const bg = variant === "amber" ? C.amberSoft : C.greenSoft;
  const fg = variant === "amber" ? C.amberDark : C.green;
  return (
    <div
      onClick={onClick}
      style={{
        width: "100%", padding: 12,
        borderRadius: 12,
        border: `1.5px ${placeholder ? "dashed" : "solid"} ${C.borderStrong}`,
        background: C.white,
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer",
      }}
    >
      <div style={{
        flex: "0 0 40px", width: 40, height: 40, borderRadius: 10,
        background: bg, color: fg,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {variant === "amber" ? (
            <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>
          ) : (
            <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} /></>
          )}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
        <div style={{
          fontSize: 14, fontWeight: placeholder ? 700 : 800,
          color: placeholder ? C.navyFaint : C.navyText,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {label}
        </div>
        <div style={{ fontSize: 11, color: C.navyDim, fontWeight: 600, marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.navyFaint} strokeWidth={2.5} strokeLinecap="round" style={{ flex: "0 0 auto" }}>
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

export function labelMinuti(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h} h`;
  return `${h}h ${m}min`;
}

export function fmtDataInputIt(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
