"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, StatoOrdineFornitore } from "../store";

const STATI: Record<StatoOrdineFornitore, { label: string; tint: keyof typeof TINTS }> = {
  bozza:       { label: "Bozza",       tint: "slate"  },
  inviato:     { label: "Inviato",     tint: "blue"   },
  confermato:  { label: "Confermato",  tint: "violet" },
  in_consegna: { label: "In consegna", tint: "amber"  },
  ricevuto:    { label: "Ricevuto",    tint: "green"  },
};

const TINTS = {
  slate: TT.slate, blue: TT.blue, violet: TT.violet,
  amber: TT.amber, green: TT.green, red: TT.red, orange: TT.orange, teal: TT.teal,
} as const;

export default function OrdiniFornitoriTablet() {
  const data = useMastroData();
  const ordini = data.getOrdini();
  const totAttesa = ordini.filter((o) => o.stato !== "ricevuto").reduce((s, o) => s + o.importo, 0);
  const ritardo = ordini.filter((o) => o.giorniRitardo > 0).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Ordini fornitori</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {ordini.length} ordini &middot; € {totAttesa.toLocaleString("it-IT")} in attesa &middot; {ritardo} in ritardo
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.orange[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.orange[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo ordine
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="ordini"      label="Ordini attivi"   value={String(ordini.filter((o) => o.stato !== "ricevuto").length)} tint="blue" />
        <KpiMini icon="contabilita" label="Valore in attesa" value={`€ ${(totAttesa/1000).toFixed(1).replace(".", ",")}k`} tint="amber" />
        <KpiMini icon="calendario"  label="Consegne 7gg"    value={String(ordini.filter((o) => o.stato === "in_consegna").length)} tint="violet" />
        <KpiMini icon="bell"        label="In ritardo"      value={String(ritardo)} tint="red" />
      </div>

      <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <thead>
            <tr style={{ background: TT.bgSoft }}>
              <Th>Ordine</Th>
              <Th>Fornitore</Th>
              <Th>Categoria</Th>
              <Th align="center">Pezzi</Th>
              <Th align="right">Importo</Th>
              <Th>Consegna</Th>
              <Th>Stato</Th>
            </tr>
          </thead>
          <tbody>
            {ordini.map((o) => {
              const stato = STATI[o.stato];
              const ramp = TINTS[stato.tint];
              const fornitoreRamp = TINTS[o.fornitoreColor as keyof typeof TINTS] || TINTS.slate;
              const ritardo = o.giorniRitardo > 0;
              return (
                <tr key={o.id} style={{ borderTop: `1px solid ${TT.border}`, cursor: "pointer" }}>
                  <Td>
                    <div>
                      <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>{o.numero}</div>
                      <div style={{ fontSize: 10, color: TT.text3, marginTop: 2 }}>{o.data}</div>
                    </div>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: fornitoreRamp[400], color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 800, letterSpacing: "-0.3px",
                      }}>
                        {o.fornitoreNome.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, letterSpacing: "-0.05px" }}>
                          {o.fornitoreNome}
                        </div>
                        <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
                          {o.commessaIds.join(", ")}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "2px 8px",
                      background: TT.bgSoft, color: TT.text2,
                      border: `1px solid ${TT.border}`, borderRadius: 6,
                      fontSize: 10, fontWeight: 600,
                    }}>
                      {o.categoria}
                    </span>
                  </Td>
                  <Td align="center">
                    <span style={{ color: TT.text2, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{o.pezzi}</span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                      € {o.importo.toLocaleString("it-IT")}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontSize: 11, color: ritardo ? TT.red[600] : TT.text2,
                        fontWeight: ritardo ? 700 : 500,
                      }}>
                        {o.consegnaPrevista}
                      </span>
                      {ritardo && (
                        <span style={{
                          padding: "1px 5px",
                          background: TT.red[100], color: TT.red[600],
                          borderRadius: 4, fontSize: 9, fontWeight: 800,
                        }}>
                          +{o.giorniRitardo}g
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "2px 8px",
                      background: ramp[100], color: ramp[600],
                      borderRadius: 12, fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.2px", textTransform: "uppercase",
                    }}>
                      {stato.label}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

function Th({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: align || "left",
      fontSize: 10, fontWeight: 700, color: TT.text3,
      letterSpacing: "0.6px", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return <td style={{ padding: "10px 14px", textAlign: align || "left", verticalAlign: "middle" }}>{children}</td>;
}
