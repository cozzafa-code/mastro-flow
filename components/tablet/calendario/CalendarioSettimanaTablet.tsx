"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, teal: TT.teal,
} as const;

type TipoEvento = "sopralluogo" | "montaggio" | "produzione" | "scadenza" | "admin";

interface EventoSett {
  id: string;
  giornoIdx: number;       // 0=lun .. 6=dom
  startMin: number;        // minuti dalle 00:00
  durataMin: number;
  titolo: string;
  sottotitolo: string;
  tipo: TipoEvento;
}

const TIPO_TINT: Record<TipoEvento, keyof typeof TINTS> = {
  sopralluogo: "red", montaggio: "green", produzione: "blue", scadenza: "amber", admin: "violet",
};

// Settimana 20-26 aprile 2026 (lun-dom). Oggi = sabato 25 = idx 5
const EVENTI: EventoSett[] = [
  { id: "1", giornoIdx: 0, startMin: 8*60+30,  durataMin: 90,  titolo: "Sopr. def. Verdi",      sottotitolo: "Via Roma 12",         tipo: "sopralluogo" },
  { id: "2", giornoIdx: 1, startMin: 16*60,    durataMin: 60,  titolo: "Ordini Aluplast",        sottotitolo: "Schuco fornitore",    tipo: "produzione"  },
  { id: "3", giornoIdx: 2, startMin: 9*60,     durataMin: 480, titolo: "Inizio prod. Verdi",    sottotitolo: "Officina",            tipo: "produzione"  },
  { id: "4", giornoIdx: 3, startMin: 10*60,    durataMin: 60,  titolo: "Mail Bianchi",          sottotitolo: "Conferma date",       tipo: "admin"       },
  { id: "5", giornoIdx: 3, startMin: 14*60+30, durataMin: 90,  titolo: "Riunione team",         sottotitolo: "Sala riunioni",       tipo: "admin"       },
  { id: "6", giornoIdx: 4, startMin: 11*60,    durataMin: 60,  titolo: "Verifica produzione",   sottotitolo: "Officina",            tipo: "produzione"  },
  { id: "7", giornoIdx: 5, startMin: 9*60,     durataMin: 90,  titolo: "Sopr. Fortini",         sottotitolo: "Via Marconi 18",      tipo: "sopralluogo" },
  { id: "8", giornoIdx: 5, startMin: 14*60+30, durataMin: 180, titolo: "Mont. Esposito",        sottotitolo: "Via Garibaldi 45",    tipo: "montaggio"   },
  { id: "9", giornoIdx: 6, startMin: 10*60,    durataMin: 60,  titolo: "Pianificazione lunedi", sottotitolo: "Casa - smart working",tipo: "admin"       },
];

const ORE = Array.from({ length: 12 }, (_, i) => i + 8); // 8-19
const HOUR_HEIGHT = 50;
const TOTAL_MINS = 12 * 60; // 720
const HEAD_HEIGHT = 60;

const GIORNI = [
  { ab: "LUN", num: 20 },
  { ab: "MAR", num: 21 },
  { ab: "MER", num: 22 },
  { ab: "GIO", num: 23 },
  { ab: "VEN", num: 24 },
  { ab: "SAB", num: 25 },
  { ab: "DOM", num: 26 },
];

export interface CalendarioSettimanaTabletProps {
  oggiIdx?: number;
  onSelectEvento?: (id: string) => void;
}

export default function CalendarioSettimanaTablet({
  oggiIdx = 5,
  onSelectEvento,
}: CalendarioSettimanaTabletProps) {
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      {/* Header giorni */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          background: TT.bgSoft,
          borderBottom: `1px solid ${TT.border}`,
          height: HEAD_HEIGHT,
        }}
      >
        <div /> {/* angolo vuoto sopra colonna ore */}
        {GIORNI.map((g, i) => {
          const isOggi = i === oggiIdx;
          const isWeekend = i >= 5;
          return (
            <div
              key={g.ab}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderLeft: `1px solid ${TT.border}`,
                gap: 4,
              }}
            >
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.6px",
                color: isWeekend ? TT.text3 : TT.text2,
              }}>
                {g.ab}
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: isOggi ? "50%" : 6,
                  background: isOggi ? TT.teal[400] : "transparent",
                  color: isOggi ? "#fff" : isWeekend ? TT.text3 : TT.text1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.3px",
                  boxShadow: isOggi ? "0 2px 6px rgba(45,212,191,0.35)" : "none",
                }}
              >
                {g.num}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body con timeline */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px repeat(7, 1fr)",
          position: "relative",
          minHeight: ORE.length * HOUR_HEIGHT,
        }}
      >
        {/* Colonna ore */}
        <div style={{ borderRight: `1px solid ${TT.border}`, position: "relative" }}>
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

        {/* 7 colonne giorni */}
        {GIORNI.map((g, idx) => {
          const isWeekend = idx >= 5;
          const isOggi = idx === oggiIdx;
          const eventiGiorno = EVENTI.filter((e) => e.giornoIdx === idx);
          return (
            <div
              key={g.ab}
              style={{
                position: "relative",
                background: isOggi
                  ? TT.teal[50]
                  : isWeekend
                    ? "#FCFDFE"
                    : TT.surface,
                borderLeft: `1px solid ${TT.border}`,
              }}
            >
              {/* Righe ore di sfondo */}
              {ORE.map((h, i) => (
                <div
                  key={h}
                  style={{
                    height: HOUR_HEIGHT,
                    borderBottom: i < ORE.length - 1 ? `1px solid ${TT.border}` : "none",
                  }}
                />
              ))}

              {/* Eventi posizionati assoluti */}
              {eventiGiorno.map((e) => {
                const ramp = TINTS[TIPO_TINT[e.tipo]];
                const startOffset = e.startMin - 8 * 60; // dalle 8:00
                if (startOffset < 0) return null;
                const top = (startOffset / 60) * HOUR_HEIGHT;
                const height = Math.max(28, (e.durataMin / 60) * HOUR_HEIGHT - 2);
                return (
                  <div
                    key={e.id}
                    onClick={() => onSelectEvento?.(e.id)}
                    style={{
                      position: "absolute",
                      top: top + 2,
                      left: 4,
                      right: 4,
                      height,
                      background: ramp[100],
                      borderLeft: `3px solid ${ramp[400]}`,
                      borderRadius: 6,
                      padding: "4px 8px",
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "transform 0.1s",
                    }}
                  >
                    <div style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: ramp[500],
                      fontVariantNumeric: "tabular-nums",
                      marginBottom: 2,
                    }}>
                      {fmtOra(e.startMin)}
                    </div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: TT.text1,
                      letterSpacing: "-0.1px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      lineHeight: 1.2,
                    }}>
                      {e.titolo}
                    </div>
                    {height > 50 && (
                      <div style={{
                        fontSize: 10,
                        color: TT.text3,
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        {e.sottotitolo}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmtOra(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
