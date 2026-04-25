"use client";
import * as React from "react";
import { TT } from "../design-system";
import { Icon } from "../icons";

export type VistaCal = "mese" | "settimana" | "giorno";
export type FiltroTipo = "tutti" | "sopralluogo" | "montaggio" | "produzione" | "scadenza" | "admin";

const VISTE: { id: VistaCal; label: string }[] = [
  { id: "mese",      label: "Mese" },
  { id: "settimana", label: "Settimana" },
  { id: "giorno",    label: "Giorno" },
];

const FILTRI: { id: FiltroTipo; label: string; tint?: keyof typeof TINTS }[] = [
  { id: "tutti",      label: "Tutti"        },
  { id: "sopralluogo",label: "Sopralluoghi", tint: "red"    },
  { id: "montaggio",  label: "Montaggi",     tint: "green"  },
  { id: "produzione", label: "Produzione",   tint: "blue"   },
  { id: "scadenza",   label: "Scadenze",     tint: "amber"  },
  { id: "admin",      label: "Admin",        tint: "violet" },
];

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet,
} as const;

export interface CalendarioToolbarTabletProps {
  vista: VistaCal;
  onVistaChange: (v: VistaCal) => void;
  filtro: FiltroTipo;
  onFiltroChange: (f: FiltroTipo) => void;
  meseAnno: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  onNuovoEvento?: () => void;
}

export default function CalendarioToolbarTablet({
  vista, onVistaChange, filtro, onFiltroChange,
  meseAnno, onPrev, onNext, onToday, onNuovoEvento,
}: CalendarioToolbarTabletProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      {/* Riga 1 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
        {/* Sinistra: titolo + nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
              Calendario
            </div>
            <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
              42 eventi questo mese
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
            <NavBtn onClick={onPrev}><Icon name="chevronLeft" size={14} color={TT.text2} strokeWidth={2.4} /></NavBtn>
            <NavBtn onClick={onToday} wide>Oggi</NavBtn>
            <NavBtn onClick={onNext}><Icon name="chevronRight" size={14} color={TT.text2} strokeWidth={2.4} /></NavBtn>
          </div>

          <div style={{ fontSize: 16, fontWeight: 700, color: TT.text1, letterSpacing: "-0.3px", marginLeft: 6, textTransform: "capitalize" }}>
            {meseAnno}
          </div>
        </div>

        {/* Destra: switcher viste + nuovo evento */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              background: TT.bgSoft,
              borderRadius: 9,
              padding: 3,
              gap: 2,
            }}
          >
            {VISTE.map((v) => {
              const isActive = v.id === vista;
              return (
                <div
                  key={v.id}
                  onClick={() => onVistaChange(v.id)}
                  style={{
                    padding: "6px 14px",
                    background: isActive ? TT.surface : "transparent",
                    color: isActive ? TT.text1 : TT.text2,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    boxShadow: isActive ? "0 1px 3px rgba(15,23,42,0.06)" : "none",
                    letterSpacing: "-0.05px",
                  }}
                >
                  {v.label}
                </div>
              );
            })}
          </div>

          <button
            onClick={onNuovoEvento}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 14px",
              background: TT.teal[400],
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: TT.fontFamily,
              boxShadow: "0 2px 8px rgba(45,212,191,0.30)",
            }}
          >
            <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
            Nuovo evento
          </button>
        </div>
      </div>

      {/* Riga 2 - filtri */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {FILTRI.map((f) => {
          const ramp = f.tint ? TINTS[f.tint] : null;
          const isActive = f.id === filtro;
          return (
            <div
              key={f.id}
              onClick={() => onFiltroChange(f.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 11px",
                background: isActive
                  ? (ramp ? ramp[400] : TT.text1)
                  : TT.surface,
                color: isActive ? "#fff" : TT.text2,
                border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {ramp && (
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: isActive ? "#fff" : ramp[400],
                }} />
              )}
              {f.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NavBtn({ children, onClick, wide }: { children: React.ReactNode; onClick?: () => void; wide?: boolean }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        height: 32,
        minWidth: wide ? 50 : 32,
        padding: wide ? "0 10px" : 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: hover ? TT.bgSoft : TT.surface,
        border: `1px solid ${TT.borderStrong}`,
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 700,
        color: TT.text2,
        transition: "background 0.1s",
      }}
    >
      {children}
    </div>
  );
}
