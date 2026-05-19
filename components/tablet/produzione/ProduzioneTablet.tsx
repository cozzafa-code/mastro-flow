"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData } from "../store";
import AvatarGradient from "../AvatarGradient";

type ColonnaId = "da_iniziare" | "in_lavorazione" | "qa" | "pronto";

const COLONNE: { id: ColonnaId; label: string; tint: keyof typeof TINTS; icon: IconName }[] = [
  { id: "da_iniziare",    label: "Da iniziare",   tint: "blue",   icon: "calendario" },
  { id: "in_lavorazione", label: "In lavorazione",tint: "amber",  icon: "produzione" },
  { id: "qa",             label: "Controllo QA",  tint: "violet", icon: "fiscale"    },
  { id: "pronto",         label: "Pronto",        tint: "green",  icon: "check"      },
];

const TINTS = {
  blue: TT.blue, amber: TT.amber, violet: TT.violet,
  green: TT.green, red: TT.red, teal: TT.teal,
} as const;

export default function ProduzioneTablet() {
  const data = useMastroData();
  const all = data.getProduzioni();

  const groupBy: Record<ColonnaId, typeof all> = {
    da_iniziare: all.filter((p) => p.stato === "da_iniziare" || p.stato === "non_iniziata"),
    in_lavorazione: all.filter((p) => p.stato === "in_lavorazione"),
    qa: all.filter((p) => p.stato === "qa"),
    pronto: all.filter((p) => p.stato === "pronto" || p.stato === "consegnata"),
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
            Produzione
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {all.length} commesse in produzione &middot; {all.reduce((s, p) => s + p.pezzi, 0)} pezzi totali
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.blue[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.blue[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Avvia produzione
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12, alignItems: "flex-start" }}>
        {COLONNE.map((col) => (
          <Colonna key={col.id} col={col} cards={groupBy[col.id]} data={data} />
        ))}
      </div>
    </div>
  );
}

function Colonna({ col, cards, data }: { col: any; cards: any[]; data: any }) {
  const ramp = TINTS[col.tint as keyof typeof TINTS];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 12px",
        background: ramp[50], border: `1px solid ${ramp[100]}`,
        borderRadius: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: ramp[400],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={col.icon} size={12} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: ramp[600] }}>
            {col.label}
          </div>
        </div>
        <div style={{
          padding: "1px 8px",
          background: ramp[400], color: "#fff",
          borderRadius: 999, fontSize: 11, fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}>
          {cards.length}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cards.map((p: any) => {
          const c = data.getCommessa(p.commessaId);
          const cli = c ? data.getCliente(c.clienteId) : null;
          const urgenzaTint = p.giorniMancanti <= 2 ? TT.red : p.giorniMancanti <= 7 ? TT.amber : TT.slate;
          const prioColor = p.priorita === "alta" ? TT.red[400] : p.priorita === "media" ? TT.amber[400] : TT.slate[400];

          return (
            <div key={p.id} style={cardStyle({
              padding: "12px 14px",
              cursor: "grab", position: "relative",
            })}>
              <div style={{
                position: "absolute", left: 0, top: 8, bottom: 8,
                width: 3, background: prioColor, borderRadius: "0 2px 2px 0",
              }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 700 }}>
                  {c?.numero}
                </span>
                <span style={{
                  padding: "1px 7px",
                  background: urgenzaTint[100], color: urgenzaTint[600],
                  borderRadius: 999, fontSize: 9, fontWeight: 700,
                }}>
                  {p.giorniMancanti === 0 ? "OGGI" : `${p.giorniMancanti}g`}
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, marginBottom: 8, letterSpacing: "-0.15px" }}>
                {cli?.nome.split(" ").slice(0, 2).join(" ")}
              </div>
              <div style={{ fontSize: 10, color: TT.text3, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.sistemaProfilo}
              </div>
              <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 11 }}>
                <div><span style={{ color: TT.text3 }}>Vani: </span><span style={{ color: TT.text1, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.vani}</span></div>
                <div><span style={{ color: TT.text3 }}>Pezzi: </span><span style={{ color: TT.text1, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.pezzi}</span></div>
              </div>

              {p.avanzamentoPct > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                      Avanzamento
                    </span>
                    <span style={{ fontSize: 10, color: ramp[600], fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                      {p.avanzamentoPct}%
                    </span>
                  </div>
                  <div style={{ height: 5, background: TT.bgSoft, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.avanzamentoPct}%`, background: ramp[400] }} />
                  </div>
                </div>
              )}

              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                paddingTop: 8, borderTop: `1px solid ${TT.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <AvatarGradient size={22} preset={p.posatoreAvatar} />
                  <span style={{ fontSize: 10, color: TT.text2, fontWeight: 600 }}>
                    {p.posatoreAssegnato.split(" ")[0]}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: TT.text2, fontWeight: 600 }}>
                  {p.consegnaPrevista}
                </div>
              </div>
            </div>
          );
        })}
        {cards.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: TT.text4, fontSize: 11, border: `2px dashed ${TT.border}`, borderRadius: 10 }}>
            Nessuna commessa
          </div>
        )}
      </div>
    </div>
  );
}
