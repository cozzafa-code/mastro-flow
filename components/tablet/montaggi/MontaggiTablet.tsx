"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, StatoMontaggio } from "../store";
import AvatarGradient from "../AvatarGradient";

const STATI: Record<StatoMontaggio, { label: string; tint: keyof typeof TINTS }> = {
  pianificato: { label: "Pianificato", tint: "blue"   },
  in_corso:    { label: "In corso",    tint: "amber"  },
  completato:  { label: "Completato",  tint: "green"  },
  rinviato:    { label: "Rinviato",    tint: "red"    },
};

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  red: TT.red, teal: TT.teal, slate: TT.slate,
} as const;

export default function MontaggiTablet() {
  const data = useMastroData();
  const all = data.getMontaggi();

  // Raggruppa per giorno
  const byGiorno = all.reduce((acc, m) => {
    if (!acc[m.giornoLabel]) acc[m.giornoLabel] = [];
    acc[m.giornoLabel].push(m);
    return acc;
  }, {} as Record<string, typeof all>);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Montaggi
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {all.length} interventi pianificati &middot; {all.reduce((s, m) => s + m.durataOre, 0)} ore stimate
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.green[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.green[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Pianifica montaggio
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Object.entries(byGiorno).map(([giorno, items]) => (
          <div key={giorno}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 44, padding: "5px 4px",
                background: TT.surface,
                border: `1px solid ${TT.borderStrong}`,
                borderRadius: 8, textAlign: "center", flexShrink: 0,
              }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>
                  {giorno.split(" ")[0]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: TT.text1, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px", marginTop: 2 }}>
                  {giorno.split(" ")[1] || ""}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>{giorno}</div>
                <div style={{ fontSize: 11, color: TT.text3 }}>
                  {items.length} intervent{items.length === 1 ? "o" : "i"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.map((m) => {
                const c = data.getCommessa(m.commessaId);
                const cli = c ? data.getCliente(c.clienteId) : null;
                const stato = STATI[m.stato];
                const ramp = TINTS[stato.tint];
                const squadra = m.squadraIds.map((id) => data.getOperatore(id)).filter(Boolean);

                return (
                  <div key={m.id} style={cardStyle({
                    padding: "12px 16px", cursor: "pointer",
                  })}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        minWidth: 64, padding: "8px 6px",
                        background: ramp[50], border: `1px solid ${ramp[100]}`,
                        borderRadius: 8, textAlign: "center", flexShrink: 0,
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px", lineHeight: 1 }}>
                          {m.ora}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], opacity: 0.7, marginTop: 2 }}>
                          {m.durataOre}h
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 9, color: TT.text3, fontWeight: 600 }}>
                            {c?.numero}
                          </span>
                          <span style={{
                            padding: "1px 7px",
                            background: ramp[100], color: ramp[600],
                            borderRadius: 999, fontSize: 9, fontWeight: 700,
                            letterSpacing: "0.3px", textTransform: "uppercase",
                          }}>
                            {stato.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.15px" }}>
                          {cli?.nome}
                        </div>
                        <div style={{ fontSize: 11, color: TT.text2, display: "flex", alignItems: "center", gap: 4 }}>
                          <Icon name="sopralluoghi" size={11} color={TT.text3} />
                          <span>{cli?.indirizzo}, {cli?.citta}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 14, paddingLeft: 14, borderLeft: `1px solid ${TT.border}`, flexShrink: 0 }}>
                        <Stat label="Vani" value={m.vani} />
                        <Stat label="Pezzi" value={m.pezzi} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", paddingLeft: 14, borderLeft: `1px solid ${TT.border}`, flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "row-reverse" }}>
                          {[...squadra].reverse().map((op: any, i) => (
                            <div key={i} style={{
                              marginLeft: i === squadra.length - 1 ? 0 : -10,
                              border: `2px solid ${TT.surface}`,
                              borderRadius: "50%", display: "flex",
                            }}>
                              <AvatarGradient size={28} preset={op.preset} />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Icon name="chevronRight" size={16} color={TT.text3} strokeWidth={2.2} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: TT.text1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px" }}>
        {value}
      </div>
    </div>
  );
}
