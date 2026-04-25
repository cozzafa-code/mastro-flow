"use client";
import * as React from "react";
import { TT, cardStyle } from "../../design-system";
import { Icon, IconName } from "../../icons";

type TipoEvento =
  | "creazione" | "fase_avanzata" | "preventivo" | "vano_modificato"
  | "documento" | "pagamento" | "messaggio" | "ordine";

interface Evento {
  id: string;
  tipo: TipoEvento;
  titolo: string;
  descrizione: string;
  autore: string;
  data: string;
  oraRelativa: string;
}

const EVENTI: Record<TipoEvento, { icon: IconName; tint: keyof typeof TINTS }> = {
  creazione:       { icon: "plus",       tint: "teal"   },
  fase_avanzata:   { icon: "trendUp",    tint: "green"  },
  preventivo:      { icon: "preventivo", tint: "blue"   },
  vano_modificato: { icon: "magazzino",  tint: "amber"  },
  documento:       { icon: "documento",  tint: "violet" },
  pagamento:       { icon: "contabilita",tint: "green"  },
  messaggio:       { icon: "chat",       tint: "slate"  },
  ordine:          { icon: "ordini",     tint: "orange" },
};

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, slate: TT.slate, orange: TT.orange,
} as const;

const DATA: Evento[] = [
  { id: "e1",  tipo: "fase_avanzata",   titolo: "Fase avanzata: Produzione",       descrizione: "Da 'Ordine confermato' a 'In produzione'.",                             autore: "Walter Cozza",   data: "22 apr 2026, 09:00",  oraRelativa: "3 giorni fa" },
  { id: "e2",  tipo: "ordine",          titolo: "Ordine fornitore inviato",         descrizione: "Aluplast IDEAL 7000 - 13 pezzi - import. € 4.890",                  autore: "Walter Cozza",   data: "21 apr 2026, 16:20",  oraRelativa: "4 giorni fa" },
  { id: "e3",  tipo: "documento",       titolo: "Foto cantiere caricate",            descrizione: "Sopralluogo definitivo. 4 foto aggiunte.",                              autore: "Marco Esposito", data: "20 apr 2026, 11:05",  oraRelativa: "5 giorni fa" },
  { id: "e4",  tipo: "vano_modificato", titolo: "Vano V-001 aggiornato",             descrizione: "Pezzi modificati da 1 a 2. Motivo: sopralluogo definitivo.",            autore: "Marco Esposito", data: "20 apr 2026, 10:42",  oraRelativa: "5 giorni fa" },
  { id: "e5",  tipo: "pagamento",       titolo: "Acconto #2 incassato",              descrizione: "€ 3.735 ricevuti via bonifico bancario.",                          autore: "Anna Verdi",     data: "12 apr 2026, 14:50",  oraRelativa: "13 giorni fa" },
  { id: "e6",  tipo: "fase_avanzata",   titolo: "Fase avanzata: Ordine confermato", descrizione: "Cliente ha controfirmato il contratto. Ordine in produzione.",          autore: "Walter Cozza",   data: "30 mar 2026, 11:30", oraRelativa: "27 giorni fa" },
  { id: "e7",  tipo: "pagamento",       titolo: "Acconto #1 incassato",              descrizione: "€ 3.735 alla firma del contratto.",                                autore: "Anna Verdi",     data: "30 mar 2026, 11:00", oraRelativa: "27 giorni fa" },
  { id: "e8",  tipo: "preventivo",      titolo: "Preventivo definitivo accettato",   descrizione: "rev.3 firmato dal cliente. Importo totale: € 12.450.",             autore: "Walter Cozza",   data: "28 mar 2026, 15:20", oraRelativa: "29 giorni fa" },
  { id: "e9",  tipo: "preventivo",      titolo: "Preventivo rev.2 inviato",          descrizione: "Aggiornato dopo richiesta cliente di modifiche.",                       autore: "Walter Cozza",   data: "18 mar 2026, 17:00", oraRelativa: "1 mese fa" },
  { id: "e10", tipo: "preventivo",      titolo: "Preventivo iniziale rev.1 inviato", descrizione: "Importo: € 11.890. In attesa di risposta cliente.",                 autore: "Walter Cozza",   data: "10 mar 2026, 10:15", oraRelativa: "1 mese fa" },
  { id: "e11", tipo: "creazione",       titolo: "Commessa creata",                   descrizione: "Commessa C-2026-051 generata da rilievo del 5 marzo 2026.",              autore: "Walter Cozza",   data: "5 mar 2026, 18:30",  oraRelativa: "2 mesi fa" },
];

export default function TabStoricoTablet() {
  return (
    <div style={cardStyle({ padding: "20px 24px" })}>
      <div style={{ position: "relative" }}>
        {/* Linea verticale timeline */}
        <div
          style={{
            position: "absolute",
            left: 17,
            top: 8,
            bottom: 8,
            width: 2,
            background: TT.border,
          }}
        />

        {DATA.map((e, i) => (
          <EventoRow key={e.id} evento={e} isLast={i === DATA.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ============================================================
// EventoRow
// ============================================================

function EventoRow({ evento, isLast }: { evento: Evento; isLast: boolean }) {
  const def = EVENTI[evento.tipo];
  const ramp = TINTS[def.tint];

  return (
    <div style={{ display: "flex", gap: 14, paddingBottom: isLast ? 0 : 18, position: "relative" }}>
      {/* Dot */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: ramp[100],
          border: `2px solid ${ramp[400]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          zIndex: 1,
          boxShadow: `0 0 0 4px ${TT.surface}`,
        }}
      >
        <Icon name={def.icon} size={14} color={ramp[500]} strokeWidth={2.4} />
      </div>

      {/* Contenuto */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3, flexWrap: "wrap" }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: TT.text1,
            letterSpacing: "-0.15px",
          }}>
            {evento.titolo}
          </div>
          <span style={{ fontSize: 11, color: TT.text3, marginLeft: "auto" }}>
            {evento.oraRelativa}
          </span>
        </div>
        <div style={{
          fontSize: 12,
          color: TT.text2,
          lineHeight: 1.5,
          marginBottom: 4,
        }}>
          {evento.descrizione}
        </div>
        <div style={{ fontSize: 11, color: TT.text3 }}>
          <span style={{ fontWeight: 600 }}>{evento.autore}</span>
          <span style={{ margin: "0 6px" }}>&middot;</span>
          <span>{evento.data}</span>
        </div>
      </div>
    </div>
  );
}
