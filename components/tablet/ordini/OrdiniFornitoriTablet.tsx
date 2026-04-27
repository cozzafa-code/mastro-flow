"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, StatoOrdineFornitore } from "../store";
import { useDashboard } from "../dashboard-context";

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

type Filtro = "tutti" | StatoOrdineFornitore | "ritardo";

const FILTRI: { id: Filtro; label: string; tint?: keyof typeof TINTS }[] = [
  { id: "tutti",       label: "Tutti" },
  { id: "ritardo",     label: "In ritardo",  tint: "red"   },
  { id: "inviato",     label: "Inviati",      tint: "blue"  },
  { id: "confermato",  label: "Confermati",   tint: "violet"},
  { id: "in_consegna", label: "In consegna",  tint: "amber" },
  { id: "ricevuto",    label: "Ricevuti",     tint: "green" },
];

export default function OrdiniFornitoriTablet() {
  const data = useMastroData();
  const { openEntity } = useDashboard();
  const ordini = data.getOrdini();
  const [filtro, setFiltro] = React.useState<Filtro>("tutti");

  const filtered = React.useMemo(() => {
    if (filtro === "tutti") return ordini;
    if (filtro === "ritardo") return ordini.filter((o) => o.giorniRitardo > 0);
    return ordini.filter((o) => o.stato === filtro);
  }, [ordini, filtro]);

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

      {/* FILTRI STATO */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {FILTRI.map((f) => {
          const isActive = f.id === filtro;
          const ramp = f.tint ? TINTS[f.tint] : null;
          let count = 0;
          if (f.id === "tutti") count = ordini.length;
          else if (f.id === "ritardo") count = ritardo;
          else count = ordini.filter((o) => o.stato === f.id).length;
          return (
            <FilterPill key={f.id}
              label={f.label} count={count}
              active={isActive}
              onClick={() => setFiltro(f.id)}
              ramp={ramp}
            />
          );
        })}
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
            {filtered.map((o) => {
              const stato = STATI[o.stato];
              const ramp = TINTS[stato.tint];
              const fornitoreRamp = TINTS[o.fornitoreColor as keyof typeof TINTS] || TINTS.slate;
              const r = o.giorniRitardo > 0;
              return (
                <tr key={o.id} onClick={() => openEntity("ordine", o.id)} style={{ borderTop: `1px solid ${TT.border}`, cursor: "pointer" }}>
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
                    }}>{o.categoria}</span>
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
                        fontSize: 11, color: r ? TT.red[600] : TT.text2,
                        fontWeight: r ? 700 : 500,
                      }}>{o.consegnaPrevista}</span>
                      {r && (
                        <span style={{
                          padding: "1px 5px",
                          background: TT.red[100], color: TT.red[600],
                          borderRadius: 4, fontSize: 9, fontWeight: 800,
                        }}>+{o.giorniRitardo}g</span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "2px 8px",
                      background: ramp[100], color: ramp[600],
                      borderRadius: 12, fontSize: 10, fontWeight: 700,
                      letterSpacing: "0.2px", textTransform: "uppercase",
                    }}>{stato.label}</span>
                  </Td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: TT.text3, fontSize: 12 }}>
                Nessun ordine in questo stato.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick, ramp }: { label: string; count: number; active: boolean; onClick: () => void; ramp: any }) {
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px",
      background: active ? (ramp ? ramp[400] : TT.text1) : TT.surface,
      color: active ? "#fff" : TT.text2,
      border: `1px solid ${active ? "transparent" : TT.borderStrong}`,
      borderRadius: 999,
      fontSize: 12, fontWeight: 600,
      cursor: "pointer", transition: "all 0.12s",
    }}>
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
        color: active ? "#fff" : (ramp ? ramp[600] : TT.text3),
        fontSize: 10, fontWeight: 700,
        padding: "1px 7px", borderRadius: 999,
        fontVariantNumeric: "tabular-nums",
      }}>{count}</span>
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
    }}>{children}</th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return <td style={{ padding: "10px 14px", textAlign: align || "left", verticalAlign: "middle" }}>{children}</td>;
}
