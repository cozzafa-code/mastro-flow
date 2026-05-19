"use client";
import React from "react";
import { C, PRESET_MINUTI } from "./montaggi-editor-types";

interface CantiereProps {
  giorni: number;
  oreGiorno: number;
  onSetGiorni: (n: number) => void;
  onSetOre: (n: number) => void;
}

export function CounterCantiere({ giorni, oreGiorno, onSetGiorni, onSetOre }: CantiereProps) {
  return (
    <div
      style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
        padding: "8px 10px",
        background: C.whiteOff,
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <Counter
        label="Giorni"
        unit="giorno"
        value={giorni}
        min={1} max={30}
        onChange={onSetGiorni}
      />
      <Counter
        label="Ore al giorno"
        unit="ore/gg"
        value={oreGiorno}
        min={1} max={12}
        onChange={onSetOre}
      />
    </div>
  );
}

interface InterventoProps {
  minuti: number;
  onSet: (n: number) => void;
}

export function CounterIntervento({ minuti, onSet }: InterventoProps) {
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;

  const adjustH = (delta: number) => {
    const next = Math.max(0, Math.min(8, h + delta));
    onSet(next * 60 + m);
  };
  const adjustM = (delta: number) => {
    const next = Math.max(0, Math.min(45, m + delta * 15));
    onSet(h * 60 + next);
  };

  return (
    <>
      <div
        style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
          padding: "8px 10px",
          background: C.whiteOff,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <Counter
          label="Ore"
          unit="ore"
          value={h}
          min={0} max={8}
          onChange={(v) => onSet(v * 60 + m)}
        />
        <Counter
          label="Minuti"
          unit="step 15"
          value={m}
          min={0} max={45}
          onChange={(v) => onSet(h * 60 + v)}
          customAdjust={{ minus: () => adjustM(-1), plus: () => adjustM(1) }}
        />
      </div>
      <div
        style={{
          display: "flex", flexWrap: "wrap", gap: 4,
          padding: "8px 10px 8px 10px",
          background: C.whiteOff,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {PRESET_MINUTI.map((p) => {
          const active = minuti === p;
          const lbl = p < 60 ? `${p} min` : p === 60 ? "1h" : p === 90 ? "1h 30" : p === 120 ? "2h" : `${p}min`;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSet(p)}
              style={{
                padding: "5px 10px",
                borderRadius: 7,
                background: active ? C.amber : C.amberSoft,
                color: active ? C.navy : C.amberDark,
                border: `1.5px solid ${C.amber}`,
                fontSize: 11, fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </>
  );
}

interface CounterProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  customAdjust?: { minus: () => void; plus: () => void };
}
function Counter({ label, unit, value, min, max, onChange, customAdjust }: CounterProps) {
  const dec = () => customAdjust ? customAdjust.minus() : onChange(Math.max(min, value - 1));
  const inc = () => customAdjust ? customAdjust.plus() : onChange(Math.min(max, value + 1));
  return (
    <div
      style={{
        background: C.white,
        border: `1.5px solid ${C.borderStrong}`,
        borderRadius: 9,
        padding: "6px 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{
        fontSize: 8, fontWeight: 800,
        color: C.navyDim,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 3,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          style={{
            width: 24, height: 24, borderRadius: 7,
            background: value <= min ? C.navyFaint : C.navy,
            color: C.white, border: "none",
            fontSize: 13, fontWeight: 800,
            cursor: value <= min ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          −
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 17, fontWeight: 800,
            color: C.navyText,
            minWidth: 24,
            fontVariantNumeric: "tabular-nums",
            lineHeight: 1,
          }}>
            {Number.isInteger(value) ? value : value.toFixed(1)}
          </div>
          <div style={{
            fontSize: 8, color: C.navyFaint,
            marginTop: -2,
            fontWeight: 700,
            letterSpacing: 0.3,
          }}>
            {unit}
          </div>
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          style={{
            width: 24, height: 24, borderRadius: 7,
            background: value >= max ? C.navyFaint : C.navy,
            color: C.white, border: "none",
            fontSize: 13, fontWeight: 800,
            cursor: value >= max ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
