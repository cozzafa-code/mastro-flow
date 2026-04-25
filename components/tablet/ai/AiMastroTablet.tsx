"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import AvatarGradient from "../AvatarGradient";

const TINTS = {
  blue: TT.blue, violet: TT.violet, green: TT.green,
  amber: TT.amber, teal: TT.teal, red: TT.red,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

interface Capability {
  id: string;
  titolo: string;
  descrizione: string;
  icon: IconName;
  tint: keyof typeof TINTS;
  esempio: string;
}

const CAPABILITIES: Capability[] = [
  { id: "1", titolo: "Decisore fiscale",       descrizione: "Determina IVA e detrazioni applicabili",      icon: "fiscale",     tint: "green",  esempio: "Ecobonus 65% — zona C" },
  { id: "2", titolo: "Generatore preventivi", descrizione: "Crea preventivo da rilievo e listino",          icon: "preventivo",  tint: "blue",   esempio: "Da rilievo a PDF in 30s" },
  { id: "3", titolo: "Analisi commessa",      descrizione: "Risk assessment e suggerimenti operativi",     icon: "trendUp",     tint: "violet", esempio: "Margine, tempi, criticità" },
  { id: "4", titolo: "Estrattore PDF",        descrizione: "Estrae dati tecnici da scheda fornitore",     icon: "documento",   tint: "amber",  esempio: "U_w, % riciclato, VOC..." },
];

interface Messaggio {
  id: string;
  ruolo: "user" | "ai";
  contenuto: string;
  ora: string;
  capability?: string;
  data?: { titolo: string; valori: { label: string; value: string; tint: keyof typeof TINTS }[] };
}

const CHAT: Messaggio[] = [
  {
    id: "m1", ruolo: "user", ora: "14:23",
    contenuto: "Su commessa C-2026-051 Verdi Giuseppe, qual è il bonus fiscale applicabile? L'immobile ha già i serramenti pre-2008.",
  },
  {
    id: "m2", ruolo: "ai", ora: "14:23",
    capability: "Decisore fiscale",
    contenuto: "Per la commessa C-2026-051 (Verdi Giuseppe, Cosenza, zona climatica C) consiglio l'Ecobonus 65% ai sensi del DL 34/2020 art.119-ter, valido per la sostituzione di serramenti esistenti con miglioramento energetico. L'IVA applicabile è al 10% (DPR 633/72 tab.A III).",
    data: {
      titolo: "Calcolo automatico",
      valori: [
        { label: "Importo lordo",  value: "€ 12.450", tint: "slate"  },
        { label: "IVA 10%",        value: "10%",          tint: "amber"  },
        { label: "Detraibile 65%", value: "€ 8.093",  tint: "green"  },
        { label: "Recupero 10y",   value: "€ 809/y",  tint: "teal"   },
      ],
    },
  },
  {
    id: "m3", ruolo: "user", ora: "14:24",
    contenuto: "OK genera la pratica fiscale e prepara la dichiarazione ENEA da inviare.",
  },
  {
    id: "m4", ruolo: "ai", ora: "14:25",
    contenuto: "Pratica fiscale PR-2026-024 creata e collegata alla commessa C-2026-051. Documenti richiesti per ENEA: scheda tecnica serramenti (U_w ≤ 1.4 W/mq°K per zona C), bonifico parlante con causale Ecobonus, dichiarazione di conformità marcatura CE. Posso compilare automaticamente la dichiarazione ENEA in formato XML pronto per upload?",
  },
];

const SUGGERIMENTI = [
  "Calcola il margine di C-2026-049",
  "Genera preventivo da rilievo Bianchi",
  "Quali ordini fornitori sono in ritardo?",
  "Riassumi le scadenze fiscali del mese",
  "Confronta sistema IDEAL 7000 vs ENERGETO",
];

export default function AiMastroTablet() {
  const [input, setInput] = React.useState("");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 12, alignItems: "stretch" }}>
      {/* COLONNA SX - chat */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 720 }}>
        {/* Header */}
        <div style={cardStyle({
          padding: "16px 20px",
          background: `linear-gradient(135deg, ${TT.blue[50]}, ${TT.violet[50]})`,
          borderColor: TT.blue[100],
        })}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: `linear-gradient(135deg, ${TT.blue[400]}, ${TT.violet[400]})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 16px ${TT.violet[300]}`,
              flexShrink: 0,
            }}>
              <Icon name="ai" size={26} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
                Mastro AI
              </div>
              <div style={{ fontSize: 12, color: TT.text2, marginTop: 2 }}>
                Assistente AI verticale per serramentisti &middot; addestrato su 142 termini di settore
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: TT.green[500],
                boxShadow: `0 0 0 3px ${TT.green[100]}`,
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: TT.green[500], letterSpacing: "0.4px", textTransform: "uppercase" }}>
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Stream messaggi */}
        <div style={cardStyle({
          padding: "16px 20px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          overflowY: "auto",
        })}>
          {CHAT.map((m) => (
            <Messaggio key={m.id} m={m} />
          ))}
        </div>

        {/* Suggerimenti rapidi */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: TT.text3, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
            Domande suggerite
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {SUGGERIMENTI.map((s) => (
              <div
                key={s}
                onClick={() => setInput(s)}
                style={{
                  padding: "6px 12px",
                  background: TT.surface,
                  border: `1px solid ${TT.borderStrong}`,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  color: TT.text2,
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div style={{
          display: "flex",
          gap: 8,
          padding: "8px 8px 8px 14px",
          background: TT.surface,
          border: `2px solid ${TT.blue[100]}`,
          borderRadius: 14,
          boxShadow: `0 4px 12px ${TT.blue[50]}`,
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chiedi a Mastro AI..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              fontFamily: TT.fontFamily,
              color: TT.text1,
              background: "transparent",
              letterSpacing: "-0.05px",
            }}
          />
          <button style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            background: `linear-gradient(135deg, ${TT.blue[400]}, ${TT.violet[400]})`,
            color: "#fff",
            border: "none",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: TT.fontFamily,
            boxShadow: `0 2px 6px ${TT.violet[300]}`,
          }}>
            <Icon name="ai" size={13} color="#fff" strokeWidth={2.4} />
            Invia
          </button>
        </div>
      </div>

      {/* COLONNA DX - capabilities + stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Capabilities */}
        <div style={cardStyle({ padding: "14px 16px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, marginBottom: 12, letterSpacing: "-0.1px" }}>
            Capabilities
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CAPABILITIES.map((c) => {
              const ramp = TINTS[c.tint];
              return (
                <div
                  key={c.id}
                  style={{
                    padding: "10px 12px",
                    background: ramp[50],
                    border: `1px solid ${ramp[100]}`,
                    borderRadius: 9,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: ramp[400],
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon name={c.icon} size={13} color="#fff" strokeWidth={2.4} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 700, color: TT.text1,
                        letterSpacing: "-0.1px",
                      }}>
                        {c.titolo}
                      </div>
                      <div style={{
                        fontSize: 10, color: ramp[500], fontWeight: 600, marginTop: 1,
                      }}>
                        {c.esempio}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: TT.text2, lineHeight: 1.4, paddingLeft: 38 }}>
                    {c.descrizione}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats AI */}
        <div style={cardStyle({ padding: "14px 16px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, marginBottom: 10, letterSpacing: "-0.1px" }}>
            Statistiche AI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <StatRow label="Query questo mese"   value="284" tint="blue"   />
            <StatRow label="Pratiche generate"   value="24"  tint="green"  />
            <StatRow label="Preventivi auto"      value="18"  tint="violet" />
            <StatRow label="Tempo medio risposta" value="1.2s" tint="amber" />
          </div>

          <div style={{
            marginTop: 12,
            padding: 10,
            background: TT.bgSoft,
            borderRadius: 8,
            fontSize: 10,
            color: TT.text3,
            lineHeight: 1.4,
          }}>
            Modello: Mastro-AI-v2 &middot; Vocabolario: 142 termini specifici settore serramenti
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Messaggio
// ============================================================

function Messaggio({ m }: { m: Messaggio }) {
  const isUser = m.ruolo === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        <div style={{
          maxWidth: "75%",
          padding: "10px 14px",
          background: `linear-gradient(135deg, ${TT.blue[400]}, ${TT.violet[400]})`,
          color: "#fff",
          borderRadius: "14px 14px 4px 14px",
          fontSize: 12,
          lineHeight: 1.55,
          letterSpacing: "-0.05px",
          boxShadow: `0 2px 8px ${TT.violet[100]}`,
        }}>
          {m.contenuto}
          <div style={{ fontSize: 9, opacity: 0.7, marginTop: 5, textAlign: "right" }}>
            {m.ora}
          </div>
        </div>
        <AvatarGradient size={32} preset="b" />
      </div>
    );
  }

  // AI message
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: `linear-gradient(135deg, ${TT.blue[400]}, ${TT.violet[400]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 2px 6px ${TT.violet[200]}`,
      }}>
        <Icon name="ai" size={16} color="#fff" strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, maxWidth: "85%" }}>
        {m.capability && (
          <div style={{
            display: "inline-flex",
            alignItems: "center", gap: 5,
            padding: "2px 8px",
            background: TT.violet[100],
            color: TT.violet[500],
            borderRadius: 999,
            fontSize: 9, fontWeight: 700,
            letterSpacing: "0.4px", textTransform: "uppercase",
            marginBottom: 6,
          }}>
            <Icon name="check" size={9} color={TT.violet[500]} strokeWidth={3} />
            {m.capability}
          </div>
        )}
        <div style={{
          padding: "10px 14px",
          background: TT.surface,
          border: `1px solid ${TT.border}`,
          borderRadius: "14px 14px 14px 4px",
          fontSize: 12,
          color: TT.text1,
          lineHeight: 1.55,
          letterSpacing: "-0.05px",
          boxShadow: TT.shadowSm,
        }}>
          {m.contenuto}
          {m.data && (
            <div style={{
              marginTop: 10,
              padding: 10,
              background: TT.bgSoft,
              borderRadius: 8,
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, color: TT.text3,
                letterSpacing: "0.4px", textTransform: "uppercase",
                marginBottom: 6,
              }}>
                {m.data.titolo}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {m.data.valori.map((v, i) => {
                  const ramp = TINTS[v.tint];
                  return (
                    <div key={i} style={{
                      padding: "6px 8px",
                      background: ramp === TT.slate ? TT.surface : ramp[50],
                      border: `1px solid ${ramp === TT.slate ? TT.border : ramp[100]}`,
                      borderRadius: 6,
                      textAlign: "center",
                    }}>
                      <div style={{ fontSize: 8, fontWeight: 700, color: ramp[500], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: ramp[500], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px" }}>
                        {v.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ fontSize: 9, color: TT.text3, marginTop: 5 }}>
            {m.ora}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// StatRow
// ============================================================

function StatRow({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "7px 10px",
      background: ramp[50],
      border: `1px solid ${ramp[100]}`,
      borderRadius: 7,
    }}>
      <span style={{ fontSize: 11, color: TT.text2, fontWeight: 600, letterSpacing: "-0.05px" }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 800,
        color: ramp[500],
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "-0.2px",
      }}>
        {value}
      </span>
    </div>
  );
}
