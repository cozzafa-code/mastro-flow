"use client";
import React, { useState, useMemo, useEffect } from "react";
import { C, fmtIso, parseIso, addDays, isWeekend } from "./montaggi-editor-types";
import type { CaricoMap, EditorState } from "./montaggi-editor-types";
import { caricoKey } from "./montaggi-editor-types";
import MontaggiSlotGrid from "./MontaggiSlotGrid";
import MontaggiSlotHeader from "./MontaggiSlotHeader";
import { CounterCantiere, CounterIntervento } from "./MontaggiCounters";

interface Props {
  open: boolean;
  state: EditorState;
  setState: (next: Partial<EditorState>) => void;
  caricoMap: CaricoMap;
  commessaLabel: string | null;
  onOpenCommessa: () => void;
  onConfirm: (dataIso: string) => void;
  onClose: () => void;
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

export default function MontaggiSlotPicker({
  open, state, setState, caricoMap,
  commessaLabel, onOpenCommessa, onConfirm, onClose,
}: Props) {
  const [pending, setPending] = useState<string | null>(state.dataInizio);
  const [viewYear, setViewYear] = useState(TODAY.getFullYear());
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth());

  useEffect(() => {
    if (open) {
      setPending(state.dataInizio);
      const start = state.dataInizio ? parseIso(state.dataInizio) : TODAY;
      setViewYear(start.getFullYear());
      setViewMonth(start.getMonth());
    }
  }, [open, state.dataInizio]);

  const giorniRange = state.tipo === "cantiere" ? state.giorni : 1;

  const suggerito = useMemo(() => {
    const sq = state.squadra?.[0] || "sq1";
    for (let i = 0; i < 60; i++) {
      const d = addDays(TODAY, i);
      if (isWeekend(d)) continue;
      const iso = fmtIso(d);
      const ore = caricoMap.get(caricoKey(sq, iso)) || 0;
      if (ore === 0) return d;
    }
    return null;
  }, [caricoMap, state.squadra]);

  const totLabel = useMemo(() => {
    if (state.tipo === "cantiere") return `${state.giorni * state.oreGiorno} h`;
    if (state.tipo === "intervento") {
      const h = Math.floor(state.durataMinuti / 60);
      const m = state.durataMinuti % 60;
      if (state.durataMinuti < 60) return `${state.durataMinuti} min`;
      if (m === 0) return `${h} h`;
      return `${h}h ${m}min`;
    }
    return "1 h";
  }, [state.tipo, state.giorni, state.oreGiorno, state.durataMinuti]);

  const durMini = state.tipo === "cantiere"
    ? `${state.giorni}g · ${state.giorni * state.oreGiorno}h`
    : state.tipo === "intervento" ? totLabel : "1h";

  if (!open) return null;

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setViewYear(y);
    setViewMonth(m);
  }

  function toggleSquadra(sq: string) {
    const has = state.squadra.includes(sq);
    const next = has ? state.squadra.filter((s) => s !== sq) : [...state.squadra, sq];
    setState({ squadra: next });
  }

  const sqPrimary = state.squadra?.[0] || "sq1";

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(26, 42, 71, 0.65)",
        zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px 16px 90px 16px",
      }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 18,
          width: "100%", maxWidth: 380,
          maxHeight: "calc(92vh - 80px)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          boxShadow: C.shadowLg,
        }}
      >
        <MontaggiSlotHeader
          sqPrimary={sqPrimary}
          durMini={durMini}
          suggerito={suggerito}
          commessaLabel={commessaLabel}
          tipo={state.tipo}
          squadra={state.squadra}
          onToggleSquadra={toggleSquadra}
          onOpenCommessa={onOpenCommessa}
        />

        {state.tipo === "cantiere" && (
          <CounterCantiere
            giorni={state.giorni}
            oreGiorno={state.oreGiorno}
            onSetGiorni={(n) => setState({ giorni: n })}
            onSetOre={(n) => setState({ oreGiorno: n })}
          />
        )}
        {state.tipo === "intervento" && (
          <CounterIntervento
            minuti={state.durataMinuti}
            onSet={(n) => setState({ durataMinuti: n })}
          />
        )}

        <div style={{
          margin: "8px 10px 8px 10px",
          padding: "7px 10px",
          background: C.navy, color: C.white,
          borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11,
        }}>
          <span style={{
            fontWeight: 700, opacity: 0.85,
            textTransform: "uppercase", letterSpacing: 0.4, fontSize: 9,
          }}>Totale</span>
          <span style={{ fontWeight: 800, fontVariantNumeric: "tabular-nums", fontSize: 14 }}>{totLabel}</span>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <MontaggiSlotGrid
            squadra={sqPrimary}
            caricoMap={caricoMap}
            dataPending={pending}
            giorni={giorniRange}
            viewYear={viewYear}
            viewMonth={viewMonth}
            today={TODAY}
            onPickDate={(iso) => setPending(iso)}
            onChangeMonth={changeMonth}
          />
        </div>

        <div style={{
          padding: "10px 14px",
          background: C.white,
          borderTop: `1px solid ${C.border}`,
          display: "flex", gap: 8,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: "0 0 80px", padding: 10, borderRadius: 10,
              background: C.whiteOff, color: C.navyText,
              border: `1.5px solid ${C.borderStrong}`,
              fontSize: 12, fontWeight: 800, cursor: "pointer",
            }}
          >Annulla</button>
          <button
            onClick={() => pending && onConfirm(pending)}
            disabled={!pending}
            style={{
              flex: 1, padding: 10, borderRadius: 10,
              background: pending ? C.navy : C.navyFaint,
              color: C.white, border: "none",
              fontSize: 12, fontWeight: 800,
              cursor: pending ? "pointer" : "not-allowed",
            }}
          >Conferma data</button>
        </div>
      </div>
    </div>
  );
}
