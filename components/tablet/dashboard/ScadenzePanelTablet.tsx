"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";
import CardHeader from "../CardHeader";

const TINTS = {
  red: TT.red, amber: TT.amber, blue: TT.blue,
} as const;

export default function ScadenzePanelTablet() {
  const { navigate } = useDashboard();
  const data = useMastroData();

  // Compongo scadenze da fatture scadute/emesse
  const fatture = data.getFatture()
    .filter((f) => f.stato === "scaduta" || f.stato === "emessa");

  const scadenze = fatture.slice(0, 4).map((f) => {
    const c = data.getCommessa(f.commessaId);
    const cli = c ? data.getCliente(c.clienteId) : undefined;
    const tint: keyof typeof TINTS =
      f.stato === "scaduta" ? "red" :
      Number(f.importo) > 5000 ? "amber" :
      "blue";
    const stato =
      f.stato === "scaduta" ? "Scaduta" :
      "In attesa";
    return {
      id: f.id,
      titolo: `${f.numero} ${cli?.nome.split(" ")[0] || ""}`,
      stato,
      importo: f.importo.toLocaleString("it-IT"),
      tint,
      commessaId: f.commessaId,
    };
  });

  return (
    <div style={cardStyle({ padding: "14px 16px" })}>
      <CardHeader
        icon="bell"
        title="Scadenze prossime"
        tint="amber"
        seeAllLabel="Tutte"
        onSeeAll={() => navigate("contabilita")}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {scadenze.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", color: TT.text3, fontSize: 11 }}>
            Nessuna scadenza
          </div>
        )}
        {scadenze.map((s) => {
          const ramp = TINTS[s.tint];
          return (
            <div
              key={s.id}
              onClick={() => navigate("contabilita")}
              style={{
                display: "flex", alignItems: "center",
                padding: "8px 10px",
                background: ramp[50],
                border: `1px solid ${ramp[100]}`,
                borderRadius: 7, cursor: "pointer",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700, color: TT.text1,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  letterSpacing: "-0.1px",
                }}>
                  {s.titolo}
                </div>
                <div style={{ fontSize: 10, color: ramp[600], fontWeight: 600, marginTop: 1 }}>
                  {s.stato}
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 800, color: ramp[600],
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
              }}>
                € {s.importo}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
