"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";

const TINTS = {
  red: TT.red, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, teal: TT.teal,
} as const;

type TipoEvento = "sopralluogo" | "montaggio" | "produzione" | "scadenza" | "admin";

interface EventoCal {
  id: string;
  giorno: number;
  ora: string;
  titolo: string;
  tipo: TipoEvento;
}

const TIPO_TINT: Record<TipoEvento, keyof typeof TINTS> = {
  sopralluogo: "red", montaggio: "green", produzione: "blue", scadenza: "amber", admin: "violet",
};

// Aprile 2026: 1 aprile = MERCOLEDI (verificato: weekday=2 con Mon=0)
const EVENTI: EventoCal[] = [
  { id: "e1",  giorno: 2,  ora: "09:00", titolo: "Sopr. Russo",          tipo: "sopralluogo" },
  { id: "e2",  giorno: 2,  ora: "14:30", titolo: "Mont. Bianchi",        tipo: "montaggio"   },
  { id: "e3",  giorno: 5,  ora: "10:00", titolo: "Riunione produzione",  tipo: "produzione"  },
  { id: "e4",  giorno: 7,  ora: "11:00", titolo: "Scadenza F24",         tipo: "scadenza"    },
  { id: "e5",  giorno: 7,  ora: "15:00", titolo: "Sopr. De Luca",        tipo: "sopralluogo" },
  { id: "e6",  giorno: 9,  ora: "08:30", titolo: "Mont. Verdi G1",       tipo: "montaggio"   },
  { id: "e7",  giorno: 10, ora: "08:30", titolo: "Mont. Verdi G2",       tipo: "montaggio"   },
  { id: "e8",  giorno: 12, ora: "09:00", titolo: "Prod. Marino",         tipo: "produzione"  },
  { id: "e9",  giorno: 14, ora: "10:00", titolo: "INPS contributi",      tipo: "scadenza"    },
  { id: "e10", giorno: 15, ora: "11:30", titolo: "Riunione team",        tipo: "admin"       },
  { id: "e11", giorno: 16, ora: "09:00", titolo: "Sopr. Greco",          tipo: "sopralluogo" },
  { id: "e12", giorno: 18, ora: "14:00", titolo: "Test V-005",           tipo: "produzione"  },
  { id: "e13", giorno: 20, ora: "08:30", titolo: "Sopr. def. Verdi",     tipo: "sopralluogo" },
  { id: "e14", giorno: 21, ora: "16:00", titolo: "Ordini Aluplast",      tipo: "produzione"  },
  { id: "e15", giorno: 22, ora: "09:00", titolo: "Inizio prod Verdi",    tipo: "produzione"  },
  { id: "e16", giorno: 23, ora: "10:00", titolo: "Mail Bianchi",         tipo: "admin"       },
  { id: "e17", giorno: 25, ora: "09:00", titolo: "Sopr. Fortini",        tipo: "sopralluogo" },
  { id: "e18", giorno: 25, ora: "14:30", titolo: "Mont. Esposito",       tipo: "montaggio"   },
  { id: "e19", giorno: 27, ora: "10:00", titolo: "Riunione mensile",     tipo: "admin"       },
  { id: "e20", giorno: 28, ora: "12:00", titolo: "Scadenza fatt. 047",   tipo: "scadenza"    },
  { id: "e21", giorno: 30, ora: "09:00", titolo: "Sopr. def. Rossi",     tipo: "sopralluogo" },
  { id: "e22", giorno: 30, ora: "15:00", titolo: "Mont. Marino",         tipo: "montaggio"   },
];

const GIORNI_SETT = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];

export interface CalendarioMeseTabletProps {
  primoGiornoWeekday?: number;  // 0=lun .. 6=dom
  giorniMese?: number;
  oggi?: number;
  onSelectGiorno?: (giorno: number) => void;
  onSelectEvento?: (id: string) => void;
}

export default function CalendarioMeseTablet({
  primoGiornoWeekday = 2,
  giorniMese = 30,
  oggi = 25,
  onSelectGiorno,
  onSelectEvento,
}: CalendarioMeseTabletProps) {
  // Costruisco array 42 celle (6 righe x 7 colonne)
  // Cella i: giorno = i - primoGiornoWeekday + 1 se valido, altrimenti null
  const celle: { giorno: number | null; isOutside: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const g = i - primoGiornoWeekday + 1;
    celle.push({
      giorno: g >= 1 && g <= giorniMese ? g : null,
      isOutside: g < 1 || g > giorniMese,
    });
  }

  // Suddivido in 6 righe di 7 celle ciascuna
  const settimane: typeof celle[] = [];
  for (let r = 0; r < 6; r++) {
    settimane.push(celle.slice(r * 7, r * 7 + 7));
  }

  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
        }}
      >
        {/* Colonne larghezza fissa */}
        <colgroup>
          {GIORNI_SETT.map((g) => (
            <col key={g} style={{ width: `${100 / 7}%` }} />
          ))}
        </colgroup>

        {/* Header giorni */}
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            {GIORNI_SETT.map((g, i) => (
              <th
                key={g}
                style={{
                  padding: "10px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: i >= 5 ? TT.text3 : TT.text2,
                  letterSpacing: "0.6px",
                  textAlign: "center",
                  borderBottom: `1px solid ${TT.border}`,
                }}
              >
                {g}
              </th>
            ))}
          </tr>
        </thead>

        {/* 6 settimane */}
        <tbody>
          {settimane.map((sett, rowIdx) => (
            <tr key={rowIdx} style={{ height: 100 }}>
              {sett.map((c, colIdx) => {
                const isWeekend = colIdx >= 5;
                const isOggi = c.giorno === oggi;
                const eventiGiorno = c.giorno
                  ? EVENTI.filter((e) => e.giorno === c.giorno).slice(0, 3)
                  : [];
                const eventiHidden = c.giorno
                  ? Math.max(0, EVENTI.filter((e) => e.giorno === c.giorno).length - 3)
                  : 0;

                return (
                  <td
                    key={colIdx}
                    onClick={() => c.giorno && onSelectGiorno?.(c.giorno)}
                    style={{
                      verticalAlign: "top",
                      padding: "5px 6px",
                      borderRight: colIdx < 6 ? `1px solid ${TT.border}` : "none",
                      borderBottom: rowIdx < 5 ? `1px solid ${TT.border}` : "none",
                      background: c.isOutside
                        ? "#FAFCFD"
                        : isWeekend
                          ? "#FCFDFE"
                          : TT.surface,
                      cursor: c.giorno ? "pointer" : "default",
                      overflow: "hidden",
                      height: 100,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, height: "100%" }}>
                      {/* Numero giorno */}
                      <div style={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                        {c.giorno ? (
                          <div
                            style={{
                              minWidth: 22,
                              height: 22,
                              padding: "0 6px",
                              borderRadius: isOggi ? "50%" : 6,
                              background: isOggi ? TT.teal[400] : "transparent",
                              color: isOggi ? "#fff" : isWeekend ? TT.text3 : TT.text1,
                              fontSize: 11,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontVariantNumeric: "tabular-nums",
                              boxShadow: isOggi ? "0 2px 6px rgba(45,212,191,0.35)" : "none",
                            }}
                          >
                            {c.giorno}
                          </div>
                        ) : (
                          <div style={{ height: 22 }} />
                        )}
                      </div>

                      {/* Eventi */}
                      {eventiGiorno.map((e) => {
                        const ramp = TINTS[TIPO_TINT[e.tipo]];
                        return (
                          <div
                            key={e.id}
                            onClick={(ev) => { ev.stopPropagation(); onSelectEvento?.(e.id); }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 5px",
                              background: ramp[50],
                              borderLeft: `3px solid ${ramp[400]}`,
                              borderRadius: 4,
                              fontSize: 10,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontVariantNumeric: "tabular-nums", color: ramp[500], fontWeight: 700, flexShrink: 0 }}>
                              {e.ora}
                            </span>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", color: TT.text1 }}>
                              {e.titolo}
                            </span>
                          </div>
                        );
                      })}

                      {eventiHidden > 0 && (
                        <div style={{ fontSize: 9, color: TT.text3, fontWeight: 600, paddingLeft: 4, flexShrink: 0 }}>
                          +{eventiHidden} altri
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
