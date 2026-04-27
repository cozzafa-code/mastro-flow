"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, RuoloOperatore, StatusOperatore } from "../store";
import AvatarGradient from "../AvatarGradient";

const TINTS = {
  teal: TT.teal, green: TT.green, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, red: TT.red, slate: TT.slate, orange: TT.orange,
} as const;

const RUOLO_DEF: Record<RuoloOperatore, { label: string; tint: keyof typeof TINTS; icon: IconName }> = {
  titolare:     { label: "Titolare",     tint: "teal",   icon: "ai"           },
  posatore:     { label: "Posatore",     tint: "green",  icon: "montaggi"     },
  magazziniere: { label: "Magazziniere", tint: "amber",  icon: "magazzino"    },
  segreteria:   { label: "Segreteria",   tint: "violet", icon: "documento"    },
  agente:       { label: "Agente",       tint: "blue",   icon: "clienti"      },
  produzione:   { label: "Produzione",   tint: "orange", icon: "produzione"   },
};

const STATUS_COLOR: Record<StatusOperatore, string> = {
  online:    TT.green[600],
  trasferta: TT.amber[600],
  ferie:     TT.blue[600],
  offline:   TT.slate[400],
};

export default function TeamTablet() {
  const data = useMastroData();
  const operatori = data.getOperatori();
  const online = operatori.filter((o) => o.status === "online").length;
  const trasferta = operatori.filter((o) => o.status === "trasferta").length;
  const oreMese = operatori.reduce((s, o) => s + o.oreMese, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Team</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {operatori.length} operatori &middot; {online} online &middot; {trasferta} in trasferta &middot; {oreMese} ore mese
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.teal[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.teal[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo membro
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="team"     label="Totale"      value={String(operatori.length)} tint="teal" />
        <KpiMini icon="check"    label="Online ora"   value={String(online)} tint="green" />
        <KpiMini icon="montaggi" label="In trasferta" value={String(trasferta)} tint="amber" />
        <KpiMini icon="trendUp"  label="Ore mese"     value={String(oreMese)} tint="blue" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {operatori.map((o) => {
          const ruolo = RUOLO_DEF[o.ruolo];
          const ruoloRamp = TINTS[ruolo.tint];
          return (
            <div key={o.id} style={cardStyle({ padding: "16px 18px", cursor: "pointer" })}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <AvatarGradient size={48} preset={o.preset} />
                  <div style={{
                    position: "absolute", bottom: -1, right: -1,
                    width: 14, height: 14, borderRadius: "50%",
                    background: STATUS_COLOR[o.status],
                    border: "2px solid #fff",
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
                    {o.nome} {o.cognome}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "1px 7px",
                      background: ruoloRamp[100], color: ruoloRamp[600],
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>
                      <Icon name={ruolo.icon} size={9} color={ruoloRamp[600]} strokeWidth={2.4} />
                      {ruolo.label}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 700,
                      color: STATUS_COLOR[o.status],
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${TT.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: TT.text2 }}>
                  <Icon name="chat" size={11} color={TT.text3} strokeWidth={2} />
                  <span>{o.tel}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: TT.text2 }}>
                  <Icon name="documento" size={11} color={TT.text3} strokeWidth={2} />
                  <span>{o.email}</span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <Stat label="Ore sett." value={String(o.oreSettimana)} tint={ruolo.tint} />
                <Stat label="Ore mese"  value={String(o.oreMese)}      tint="blue" />
                <Stat label="Efficienza" value={`${o.efficienza}%`}     tint="green" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiMini({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 })}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={18} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: ramp[600], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "6px 8px",
      background: ramp[50], border: `1px solid ${ramp[100]}`,
      borderRadius: 6, textAlign: "center",
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px" }}>
        {value}
      </div>
    </div>
  );
}
