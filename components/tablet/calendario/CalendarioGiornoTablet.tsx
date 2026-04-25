"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon } from "../icons";

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, teal: TT.teal,
} as const;

type TipoEvento = "sopralluogo" | "montaggio" | "produzione" | "scadenza" | "admin";

interface EventoGiorno {
  id: string;
  startMin: number;
  durataMin: number;
  titolo: string;
  cliente?: string;
  indirizzo?: string;
  partecipanti?: string;
  note?: string;
  tipo: TipoEvento;
}

const TIPO_TINT: Record<TipoEvento, keyof typeof TINTS> = {
  sopralluogo: "red", montaggio: "green", produzione: "blue", scadenza: "amber", admin: "violet",
};

const TIPO_LABEL: Record<TipoEvento, string> = {
  sopralluogo: "Sopralluogo",
  montaggio:   "Montaggio",
  produzione:  "Produzione",
  scadenza:    "Scadenza",
  admin:       "Admin",
};

const EVENTI: EventoGiorno[] = [
  { id: "1", startMin: 8*60+30,  durataMin: 30,  titolo: "Briefing giornata",         cliente: "Walter, Marco, Luca", note: "Pianificazione interventi.", tipo: "admin" },
  { id: "2", startMin: 9*60,     durataMin: 90,  titolo: "Sopralluogo Fortini",       cliente: "Sig.ra Fortini",      indirizzo: "Via Marconi 18, Cosenza", partecipanti: "Marco Esposito", tipo: "sopralluogo" },
  { id: "3", startMin: 11*60,    durataMin: 60,  titolo: "Verifica produzione V-005", cliente: "Verdi G.",            indirizzo: "Officina interna",        note: "Test apertura arco.", tipo: "produzione" },
  { id: "4", startMin: 12*60+30, durataMin: 60,  titolo: "Pranzo + pausa",            note: "Pausa pranzo team.",     tipo: "admin" },
  { id: "5", startMin: 14*60+30, durataMin: 180, titolo: "Montaggio Esposito",        cliente: "Esposito Franco",     indirizzo: "Via Garibaldi 45, Rende", partecipanti: "Marco Esposito + Luca Bianchi", tipo: "montaggio" },
  { id: "6", startMin: 17*60+30, durataMin: 30,  titolo: "Chiusura giornata",         note: "Briefing finale + report.", tipo: "admin" },
];

const ORE = Array.from({ length: 12 }, (_, i) => i + 8);
const HOUR_HEIGHT = 64;
const ORA_CORRENTE_MIN = 14 * 60 + 32; // 14:32 - linea ora corrente

export interface CalendarioGiornoTabletProps {
  onSelectEvento?: (id: string) => void;
}

export default function CalendarioGiornoTablet({ onSelectEvento }: CalendarioGiornoTabletProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "flex-start" }}>
      {/* COL 1 - Timeline */}
      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <div style={{
          padding: "14px 18px",
          background: TT.bgSoft,
          borderBottom: `1px solid ${TT.border}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.5px", textTransform: "uppercase" }}>
            Sabato 25 aprile 2026
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, marginTop: 4, letterSpacing: "-0.2px" }}>
            6 eventi programmati
          </div>
        </div>

        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "60px 1fr" }}>
          {/* Colonna ore */}
          <div style={{ borderRight: `1px solid ${TT.border}` }}>
            {ORE.map((h, i) => (
              <div
                key={h}
                style={{
                  height: HOUR_HEIGHT,
                  fontSize: 10,
                  color: TT.text3,
                  fontWeight: 600,
                  paddingTop: 4,
                  paddingRight: 8,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                  borderBottom: i < ORE.length - 1 ? `1px solid ${TT.border}` : "none",
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Colonna eventi */}
          <div style={{ position: "relative", minHeight: ORE.length * HOUR_HEIGHT }}>
            {/* Righe ore */}
            {ORE.map((h, i) => (
              <div
                key={h}
                style={{
                  height: HOUR_HEIGHT,
                  borderBottom: i < ORE.length - 1 ? `1px solid ${TT.border}` : "none",
                }}
              />
            ))}

            {/* Eventi assoluti */}
            {EVENTI.map((e) => {
              const ramp = TINTS[TIPO_TINT[e.tipo]];
              const top = ((e.startMin - 8 * 60) / 60) * HOUR_HEIGHT;
              const height = (e.durataMin / 60) * HOUR_HEIGHT - 2;
              return (
                <div
                  key={e.id}
                  onClick={() => onSelectEvento?.(e.id)}
                  style={{
                    position: "absolute",
                    top: top + 2,
                    left: 6,
                    right: 6,
                    height: Math.max(40, height),
                    background: ramp[100],
                    borderLeft: `3px solid ${ramp[400]}`,
                    borderRadius: 8,
                    padding: "8px 12px",
                    cursor: "pointer",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: ramp[500], fontVariantNumeric: "tabular-nums", marginBottom: 3 }}>
                    {fmtOra(e.startMin)} - {fmtOra(e.startMin + e.durataMin)}
                  </div>
                  <div style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: TT.text1,
                    letterSpacing: "-0.1px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {e.titolo}
                  </div>
                  {height > 40 && e.indirizzo && (
                    <div style={{ fontSize: 10, color: TT.text3, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.indirizzo}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Linea ora corrente */}
            <CurrentLine />
          </div>
        </div>
      </div>

      {/* COL 2 - Lista dettagli */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {EVENTI.map((e) => {
          const ramp = TINTS[TIPO_TINT[e.tipo]];
          return (
            <div
              key={e.id}
              onClick={() => onSelectEvento?.(e.id)}
              style={cardStyle({ padding: "12px 14px", cursor: "pointer" })}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: ramp[100],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Icon name={iconForTipo(e.tipo)} size={16} color={ramp[500]} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                    <span style={{
                      fontSize: 9,
                      padding: "1px 6px",
                      background: ramp[100],
                      color: ramp[500],
                      borderRadius: 999,
                      fontWeight: 700,
                      letterSpacing: "0.4px",
                      textTransform: "uppercase",
                    }}>
                      {TIPO_LABEL[e.tipo]}
                    </span>
                    <span style={{ fontSize: 10, color: TT.text3, fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                      {fmtOra(e.startMin)} - {fmtOra(e.startMin + e.durataMin)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: TT.text1,
                    letterSpacing: "-0.15px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    {e.titolo}
                  </div>
                </div>
              </div>

              {/* Body details */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 46 }}>
                {e.cliente && (
                  <DetailRow icon="clienti" label={e.cliente} />
                )}
                {e.indirizzo && (
                  <DetailRow icon="sopralluoghi" label={e.indirizzo} />
                )}
                {e.partecipanti && (
                  <DetailRow icon="team" label={e.partecipanti} />
                )}
                {e.note && (
                  <DetailRow icon="chat" label={e.note} muted />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrentLine() {
  const top = ((ORA_CORRENTE_MIN - 8 * 60) / 60) * HOUR_HEIGHT;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, zIndex: 2, pointerEvents: "none" }}>
      <div style={{ height: 0, borderTop: `2px solid ${TT.red[400]}` }} />
      <div style={{
        position: "absolute",
        top: -4,
        left: -4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: TT.red[400],
      }} />
    </div>
  );
}

function DetailRow({ icon, label, muted }: { icon: any; label: string; muted?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <Icon name={icon} size={11} color={TT.text3} strokeWidth={2} />
      <span style={{
        fontSize: 11,
        color: muted ? TT.text3 : TT.text2,
        fontStyle: muted ? "italic" : "normal",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {label}
      </span>
    </div>
  );
}

function fmtOra(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function iconForTipo(t: TipoEvento): any {
  if (t === "sopralluogo") return "sopralluoghi";
  if (t === "montaggio")   return "montaggi";
  if (t === "produzione")  return "produzione";
  if (t === "scadenza")    return "bell";
  return "calendario";
}
