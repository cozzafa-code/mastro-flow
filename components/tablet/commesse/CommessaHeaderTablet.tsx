"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";
import AvatarGradient from "../AvatarGradient";

export interface CommessaHeaderTabletProps {
  numero: string;
  cliente: string;
  citta: string;
  indirizzo: string;
  telefono: string;
  email: string;
  valoreTotale: string;
  vani: number;
  giorniLavoro: number;
  preset?: "a" | "b" | "c" | "d" | "e";
  onBack?: () => void;
  onModifica?: () => void;
  onPdf?: () => void;
}

export default function CommessaHeaderTablet({
  numero, cliente, citta, indirizzo, telefono, email,
  valoreTotale, vani, giorniLavoro, preset = "a",
  onBack, onModifica, onPdf,
}: CommessaHeaderTabletProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Breadcrumb */}
      <div
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          cursor: "pointer",
          marginBottom: 10,
          fontSize: 12,
          color: TT.text2,
          fontWeight: 500,
        }}
      >
        <Icon name="chevronLeft" size={14} color={TT.text2} strokeWidth={2.2} />
        <span>Commesse</span>
        <span style={{ color: TT.text3 }}>/</span>
        <span style={{ fontFamily: "monospace", color: TT.text3 }}>{numero}</span>
      </div>

      {/* Card header */}
      <div style={cardStyle({ padding: "18px 22px" })}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Avatar grande cliente */}
          <AvatarGradient size={52} preset={preset} />

          {/* Cliente info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: TT.text1, letterSpacing: "-0.4px" }}>
                {cliente}
              </div>
              <span style={{
                padding: "2px 8px",
                background: TT.teal[100],
                color: TT.teal[500],
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                fontFamily: "monospace",
              }}>
                {numero}
              </span>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: TT.text2, flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="sopralluoghi" size={12} color={TT.text3} />
                {indirizzo}, {citta}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <Icon name="chat" size={12} color={TT.text3} />
                {telefono}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: TT.text3 }}>
                {email}
              </span>
            </div>
          </div>

          {/* Mini KPI */}
          <div style={{ display: "flex", gap: 22, alignItems: "center", paddingLeft: 18, borderLeft: `1px solid ${TT.border}` }}>
            <MiniKpi label="Valore" value={valoreTotale} tint="teal" />
            <MiniKpi label="Vani" value={vani.toString()} tint="orange" />
            <MiniKpi label="Giorni" value={giorniLavoro.toString()} tint="blue" />
          </div>

          {/* Azioni */}
          <div style={{ display: "flex", gap: 8 }}>
            <ActionBtn onClick={onPdf} icon="documento" label="PDF" tint="violet" />
            <ActionBtn onClick={onModifica} icon="impostazioni" label="Modifica" tint="teal" primary />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Mini KPI ----
function MiniKpi({ label, value, tint }: { label: string; value: string; tint: "teal" | "orange" | "blue" }) {
  const ramp = TT[tint];
  return (
    <div>
      <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: ramp[500], letterSpacing: "-0.4px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}

// ---- Action button ----
function ActionBtn({
  onClick, icon, label, tint, primary,
}: { onClick?: () => void; icon: any; label: string; tint: "teal" | "violet"; primary?: boolean }) {
  const ramp = TT[tint];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 12px",
        background: primary ? ramp[400] : TT.surface,
        color: primary ? "#fff" : ramp[500],
        border: primary ? "none" : `1px solid ${ramp[100]}`,
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: TT.fontFamily,
        letterSpacing: "-0.05px",
      }}
    >
      <Icon name={icon} size={13} color={primary ? "#fff" : ramp[500]} strokeWidth={2.2} />
      {label}
    </button>
  );
}
