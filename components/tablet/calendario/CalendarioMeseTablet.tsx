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
  sopralluogo: "red",
  montaggio:   "green",
  produzione:  "blue",
  scadenza:    "amber",
  admin:       "violet",
};

// Aprile 2026 - 30 giorni - 1 aprile = mercoledi
// Generiamo eventi mock distribuiti
const EVENTI: EventoCal[] = [
  { id: "e1", giorno: 2,  ora: "09:00", titolo: "Sopralluogo Russo",         tipo: "sopralluogo" },
  { id: "e2", giorno: 2,  ora: "14:30", titolo: "Montaggio Bianchi",         tipo: "montaggio"   },
  { id: "e3", giorno: 5,  ora: "10:00", titolo: "Riunione produzione",       tipo: "produzione"  },
  { id: "e4", giorno: 7,  ora: "11:00", titolo: "Scadenza F24",              tipo: "scadenza"    },
  { id: "e5", giorno: 7,  ora: "15:00", titolo: "Sopralluogo De Luca",       tipo: "sopralluogo" },
  { id: "e6", giorno: 9,  ora: "08:30", titolo: "Montaggio Verdi - giorno 1",tipo: "montaggio"   },
  { id: "e7", giorno: 10, ora: "08:30", titolo: "Montaggio Verdi - giorno 2",tipo: "montaggio"   },
  { id: "e8", giorno: 12, ora: "09:00", titolo: "Inizio produzione Marino",  tipo: "produzione"  },
  { id: "e9", giorno: 14, ora: "10:00", titolo: "INPS contributi",           tipo: "scadenza"    },
  { id: "e10",giorno: 15, ora: "11:30", titolo: "Riunione team",             tipo: "admin"       },
  { id: "e11",giorno: 16, ora: "09:00", titolo: "Sopralluogo Greco",         tipo: "sopralluogo" },
  { id: "e12",giorno: 18, ora: "14:00", titolo: "Test produzione V-005",     tipo: "produzione"  },
  { id: "e13",giorno: 20, ora: "08:30", titolo: "Sopralluogo definitivo Verdi", tipo: "sopralluogo" },
  { id: "e14",giorno: 21, ora: "16:00", titolo: "Ordine fornitori Aluplast", tipo: "produzione"  },
  { id: "e15",giorno: 22, ora: "09:00", titolo: "Inizio produzione Verdi",   tipo: "produzione"  },
  { id: "e16",giorno: 23, ora: "10:00", titolo: "Mail cliente Bianchi",      tipo: "admin"       },
  { id: "e17",giorno: 25, ora: "09:00", titolo: "Sopralluogo Fortini",       tipo: "sopralluogo" },
  { id: "e18",giorno: 25, ora: "14:30", titolo: "Montaggio Esposito",        tipo: "montaggio"   },
  { id: "e19",giorno: 27, ora: "10:00", titolo: "Riunione mensile",          tipo: "admin"       },
  { id: "e20",giorno: 28, ora: "12:00", titolo: "Scadenza fattura 047",      tipo: "scadenza"    },
  { id: "e21",giorno: 30, ora: "09:00", titolo: "Sopralluogo definitivo Rossi", tipo: "sopralluogo" },
  { id: "e22",giorno: 30, ora: "15:00", titolo: "Montaggio Marino - inizio", tipo: "montaggio"   },
];

const GIORNI_SETT = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];

export interface CalendarioMeseTabletProps {
  /** Aprile 2026: primo giorno del mese a quale weekday cade (0=lun, 6=dom). Default 2 (mer). */
  primoGiornoWeekday?: number;
  /** Quanti giorni ha il mese. Default 30 (aprile). */
  giorniMese?: number;
  /** Giorno odierno (highlight). Default 25. */
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
  // Costruisci 6 settimane x 7 giorni
  // Cella i (0..41): giorno = i - primoGiornoWeekday + 1; se <=0 o >giorniMese -> outside
  const celle: { giorno: number | null; isOutside: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const g = i - primoGiornoWeekday + 1;
    if (g < 1 || g > giorniMese) {
      celle.push({ giorno: null, isOutside: true });
    } else {
      celle.push({ giorno: g, isOutside: false });
    }
  }

  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      {/* Header settimana */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${TT.border}`, background: TT.bgSoft }}>
        {GIORNI_SETT.map((g, i) => (
          <div
            key={g}
            style={{
              padding: "10px 12px",
              fontSize: 10,
              fontWeight: 700,
              color: i >= 5 ? TT.text3 : TT.text2,
              letterSpacing: "0.6px",
              textAlign: "center",
            }}
          >
            {g}
          </div>
        ))}
      </div>

      {/* Griglia */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(96px, 1fr)" }}>
        {celle.map((c, i) => {
          const isWeekend = i % 7 >= 5;
          const isOggi = c.giorno === oggi;
          const eventiGiorno = c.giorno
            ? EVENTI.filter((e) => e.giorno === c.giorno).slice(0, 3)
            : [];
          const eventiHidden = c.giorno
            ? Math.max(0, EVENTI.filter((e) => e.giorno === c.giorno).length - 3)
            : 0;

          return (
            <div
              key={i}
              onClick={() => c.giorno && onSelectGiorno?.(c.giorno)}
              style={{
                padding: "5px 6px",
                borderRight: (i % 7) < 6 ? `1px solid ${TT.border}` : "none",
                borderBottom: i < 35 ? `1px solid ${TT.border}` : "none",
                background: c.isOutside ? TT.bgSoft : isWeekend ? "#FAFCFD" : TT.surface,
                opacity: c.isOutside ? 0.4 : 1,
                cursor: c.giorno ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                gap: 3,
                position: "relative",
                transition: "background 0.1s",
              }}
            >
              {/* Numero giorno */}
              {c.giorno && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 1 }}>
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
                </div>
              )}

              {/* Eventi (max 3) */}
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
                      padding: "2px 6px",
                      background: ramp[50],
                      borderLeft: `3px solid ${ramp[400]}`,
                      borderRadius: 4,
                      fontSize: 10,
                      color: ramp[500],
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "-0.05px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontVariantNumeric: "tabular-nums", flexShrink: 0, color: ramp[500], fontWeight: 700 }}>
                      {e.ora}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", color: TT.text1 }}>
                      {e.titolo}
                    </span>
                  </div>
                );
              })}

              {eventiHidden > 0 && (
                <div style={{ fontSize: 9, color: TT.text3, fontWeight: 600, paddingLeft: 4 }}>
                  +{eventiHidden} altri
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
