// components/mobile/agenda/AgendaFiltersMobile.tsx
"use client";
import React, { useState, useEffect } from "react";
import type { AgendaFilters } from "../../../lib/types/agenda";

interface Props {
  open: boolean;
  current: AgendaFilters;
  onClose: () => void;
  onApply: (f: AgendaFilters) => void;
}

const SQUADRE_DEMO = ["Squadra 1", "Squadra 2", "Squadra 3"];
const PERSONE_DEMO = ["Marco", "Luca", "Gianni", "Fabio"];

export default function AgendaFiltersMobile({ open, current, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<AgendaFilters>(current);

  useEffect(() => { if (open) setDraft(current); }, [open, current]);

  if (!open) return null;

  const Toggle = ({ label, value, onChange, color = "#28A0A0" }: { label: string; value: boolean; onChange: (v: boolean) => void; color?: string }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#0D1F1F" }}>{label}</span>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: value ? color : "#D4D4D8",
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            position: "absolute",
            top: 2,
            left: value ? 22 : 2,
            transition: "left 0.2s",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </div>
    </div>
  );

  const Radio = ({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) => (
    <div onClick={onClick} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", cursor: "pointer" }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: "#0D1F1F" }}>{label}</span>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `2px solid ${checked ? "#28A0A0" : "#D4D4D8"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28A0A0" }} />}
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#fff", zIndex: 1200, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "44px 18px 14px", borderBottom: "1px solid #E4E4E7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#71717A", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Annulla</button>
        <span style={{ fontSize: 16, fontWeight: 900, color: "#0D1F1F" }}>Filtri agenda</span>
        <button onClick={() => { onApply(draft); onClose(); }} style={{ background: "none", border: "none", color: "#28A0A0", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Applica</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>
        {/* Mostra */}
        <div style={{ fontSize: 11, fontWeight: 900, color: "#28A0A0", letterSpacing: 1, marginBottom: 4 }}>MOSTRA</div>
        <Toggle label="Montaggi" value={draft.showMontaggi} onChange={(v) => setDraft({ ...draft, showMontaggi: v })} color="#15803D" />
        <Toggle label="Sopralluoghi" value={draft.showSopralluoghi} onChange={(v) => setDraft({ ...draft, showSopralluoghi: v })} color="#1D4ED8" />
        <Toggle label="Produzioni" value={draft.showProduzioni} onChange={(v) => setDraft({ ...draft, showProduzioni: v })} color="#B45309" />
        <Toggle label="Problemi" value={draft.showProblemi} onChange={(v) => setDraft({ ...draft, showProblemi: v })} color="#BE123C" />
        <Toggle label="Attività completate" value={draft.showCompletate} onChange={(v) => setDraft({ ...draft, showCompletate: v })} />

        {/* Squadre */}
        <div style={{ fontSize: 11, fontWeight: 900, color: "#28A0A0", letterSpacing: 1, marginTop: 22, marginBottom: 4 }}>SQUADRE</div>
        <Radio label="Tutte le squadre" checked={draft.squadre.length === 0} onClick={() => setDraft({ ...draft, squadre: [] })} />
        {SQUADRE_DEMO.map((s) => (
          <Radio key={s} label={s} checked={draft.squadre.length === 1 && draft.squadre[0] === s} onClick={() => setDraft({ ...draft, squadre: [s] })} />
        ))}

        {/* Persone */}
        <div style={{ fontSize: 11, fontWeight: 900, color: "#28A0A0", letterSpacing: 1, marginTop: 22, marginBottom: 4 }}>PERSONE</div>
        <Radio label="Tutti" checked={draft.persone.length === 0} onClick={() => setDraft({ ...draft, persone: [] })} />
        {PERSONE_DEMO.map((p) => (
          <Radio key={p} label={p} checked={draft.persone.length === 1 && draft.persone[0] === p} onClick={() => setDraft({ ...draft, persone: [p] })} />
        ))}
      </div>
    </div>
  );
}
