// ════════════════════════════════════════════════════════════
// STEP 1 + 2 · DESTINAZIONE + BONUS + CHECKLIST
// ════════════════════════════════════════════════════════════
"use client";
import { useState } from "react";
import BonusChecklistInline from "./BonusChecklistInline";
import { BONUS_META, type BonusKey } from "@/lib/preventivo-checklist-templates";

type Props = {
  azienda_id: string;
  commessa_id: string;
  cliente_telefono?: string;
  destinazione: "prima" | "seconda";
  bonus: BonusKey;
  onDestChange: (d: "prima" | "seconda") => void;
  onBonusChange: (b: BonusKey) => void;
  onNext: () => void;
};

export default function Step12_DestinazioneBonus({
  azienda_id, commessa_id, cliente_telefono,
  destinazione, bonus, onDestChange, onBonusChange, onNext,
}: Props) {

  const altri = (["bonus_casa", "ecobonus", "barriere", "nessuna"] as BonusKey[]).filter(b => b !== bonus);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* AI chip opt-in */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: -6 }}>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 10, fontWeight: 700, color: "#1E3A5F", background: "#fff",
          border: "1px solid #CBD5E1", padding: "6px 11px", borderRadius: 999, cursor: "pointer",
        }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1E3A5F" strokeWidth="2.2">
            <path d="M12 2L9 9l-7 1 5 5-1 7 6-3 6 3-1-7 5-5-7-1z"/>
          </svg>
          Chiedi a fliwoX
        </button>
      </div>

      {/* STEP 1 · DESTINAZIONE */}
      <div>
        <H2 num="1" label="Destinazione" />
        <div style={{ display: "flex", gap: 6, padding: "0 2px", flexWrap: "wrap" }}>
          {(["prima", "seconda"] as const).map(d => {
            const sel = destinazione === d;
            return (
              <div key={d} onClick={() => onDestChange(d)} style={{
                padding: "8px 13px", borderRadius: 9,
                fontSize: 11, fontWeight: 700,
                background: sel ? "#1E3A5F" : "#fff",
                color: sel ? "#fff" : "#475569",
                border: sel ? "1px solid #0F1B2D" : "1px solid #CBD5E1",
                cursor: "pointer",
              }}>
                {d === "prima" ? "Prima casa" : "Seconda casa"}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2 · BONUS scelto */}
      <div>
        <H2 num="2" label="Bonus fiscale" />
        <BonusRow b={bonus} sel onClick={() => {}} firstRounded />
      </div>

      {/* CHECKLIST contestuale del bonus scelto */}
      {bonus !== "nessuna" && (
        <BonusChecklistInline
          azienda_id={azienda_id}
          commessa_id={commessa_id}
          bonus={bonus}
          cliente_telefono={cliente_telefono}
        />
      )}

      {/* Altri bonus collassati */}
      <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden", marginTop: 8 }}>
        {altri.map((b, i) => (
          <BonusRow key={b} b={b} sel={false} onClick={() => onBonusChange(b)} firstRounded={false} last={i === altri.length - 1} />
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", gap: 8, padding: "8px 2px 4px" }}>
        <button onClick={onNext} style={{
          flex: 1, background: "#1E3A5F", color: "#fff", border: "none",
          padding: "12px 16px", borderRadius: 11, fontSize: 11.5, fontWeight: 800,
          cursor: "pointer", letterSpacing: 0.3, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          IVA
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function H2({ num, label }: { num: string; label: string }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 800, color: "#94A3B8",
      letterSpacing: 1, textTransform: "uppercase",
      margin: "0 4px 8px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <span>{num} · {label}</span>
    </div>
  );
}

function BonusRow({ b, sel, onClick, firstRounded, last = true }: { b: BonusKey; sel: boolean; onClick: () => void; firstRounded?: boolean; last?: boolean }) {
  const meta = BONUS_META[b];
  return (
    <div onClick={onClick} style={{
      padding: "12px 13px", display: "flex", alignItems: "center", gap: 11,
      borderBottom: last ? "none" : "1px solid #F1F5F9",
      cursor: "pointer",
      background: sel ? "#F8FAFC" : "#fff",
      ...(firstRounded && sel ? {
        border: "1px solid #1E3A5F", borderBottom: "none",
        borderRadius: "14px 14px 0 0",
      } : {}),
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%",
        border: "1.5px solid " + (sel ? "#1E3A5F" : "#CBD5E1"),
        background: sel ? "#1E3A5F" : "#fff",
        flexShrink: 0, position: "relative",
      }}>
        {sel && <div style={{ position: "absolute", inset: 4, borderRadius: "50%", background: "#fff" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2, lineHeight: 1.2, display: "flex", alignItems: "baseline", gap: 7, flexWrap: "wrap" }}>
          {meta.label}
          <span style={{ fontSize: 11, fontWeight: 800, color: sel ? "#1E3A5F" : "#94A3B8" }}>{meta.percentuale}</span>
        </div>
        <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2, lineHeight: 1.4, fontWeight: 500 }}>
          {meta.short}
        </div>
        {meta.normativa && (
          <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 2, fontFamily: "JetBrains Mono, SF Mono, monospace", letterSpacing: -0.2, fontWeight: 500 }}>
            {meta.normativa}
          </div>
        )}
      </div>
    </div>
  );
}
