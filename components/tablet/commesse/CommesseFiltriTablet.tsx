"use client";
import * as React from "react";
import { TT } from "../design-system";
import { Icon } from "../icons";

export type StatoFiltro = "tutte" | "rilievo" | "preventivo" | "confermata" | "produzione" | "montaggio";

interface ChipDef {
  id: StatoFiltro;
  label: string;
  count: number;
  tint: "slate" | "amber" | "blue" | "violet" | "teal" | "green";
}

const CHIPS: ChipDef[] = [
  { id: "tutte",      label: "Tutte",      count: 38, tint: "slate"  },
  { id: "rilievo",    label: "Rilievo",    count: 6,  tint: "amber"  },
  { id: "preventivo", label: "Preventivo", count: 8,  tint: "blue"   },
  { id: "confermata", label: "Confermata", count: 7,  tint: "violet" },
  { id: "produzione", label: "Produzione", count: 12, tint: "teal"   },
  { id: "montaggio",  label: "Montaggio",  count: 5,  tint: "green"  },
];

export interface CommesseFiltriTabletProps {
  active: StatoFiltro;
  onChange: (s: StatoFiltro) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onNuovaCommessa?: () => void;
}

export default function CommesseFiltriTablet({
  active, onChange, searchValue, onSearchChange, onNuovaCommessa,
}: CommesseFiltriTabletProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Riga 1: titolo + bottone */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Commesse
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            38 commesse totali &middot; 12 in produzione
          </div>
        </div>
        <button
          onClick={onNuovaCommessa}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: TT.teal[400],
            color: "#fff",
            border: "none",
            padding: "9px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "-0.1px",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(45,212,191,0.30)",
            fontFamily: TT.fontFamily,
          }}
        >
          <Icon name="plus" size={14} color="#fff" strokeWidth={2.4} />
          Nuova commessa
        </button>
      </div>

      {/* Riga 2: chips filtri + search */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
          {CHIPS.map((c) => {
            const ramp = c.tint === "slate" ? null : (TT[c.tint] as any);
            const isActive = c.id === active;
            return (
              <div
                key={c.id}
                onClick={() => onChange(c.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  background: isActive
                    ? (ramp ? ramp[400] : TT.text1)
                    : TT.surface,
                  color: isActive ? "#fff" : TT.text2,
                  border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.12s",
                  letterSpacing: "-0.05px",
                }}
              >
                {c.label}
                <span
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.28)"
                      : (ramp ? ramp[100] : TT.bgSoft),
                    color: isActive ? "#fff" : (ramp ? ramp[500] : TT.text2),
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 999,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {c.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: 240 }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon name="search" size={13} color={TT.text3} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cerca cliente, numero..."
            style={{
              width: "100%",
              height: 36,
              padding: "0 12px 0 34px",
              background: TT.surface,
              border: `1px solid ${TT.borderStrong}`,
              borderRadius: 10,
              fontSize: 12,
              fontFamily: TT.fontFamily,
              color: TT.text1,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    </div>
  );
}
