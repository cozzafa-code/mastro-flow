"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData } from "../store";
import { useDashboard } from "../dashboard-context";

const TINTS = {
  green: TT.green, red: TT.red, blue: TT.blue,
  amber: TT.amber, violet: TT.violet, teal: TT.teal,
  pink: TT.pink, slate: TT.slate, orange: TT.orange,
} as const;

export default function ContabilitaTablet() {
  const data = useMastroData();
  const { openEntity } = useDashboard();
  const fatture = data.getFatture();
  const pagamenti = data.getPagamenti();

  const fattEmesse = fatture.filter((f) => f.stato !== "bozza");
  const totFatt = fattEmesse.reduce((s, f) => s + f.importo, 0);
  const totPagate = fattEmesse.filter((f) => f.stato === "pagata").reduce((s, f) => s + f.importo, 0);
  const daIncassare = totFatt - totPagate;
  const margine = totFatt > 0 ? Math.round((totPagate / totFatt) * 100) : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Contabilità</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            Aprile 2026 &middot; € {totFatt.toLocaleString("it-IT")} fatturato &middot; € {daIncassare.toLocaleString("it-IT")} da incassare
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.pink[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.pink[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuova fattura
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 14 }}>
        <KpiMini label="Fatturato"     value={`€ ${(totFatt/1000).toFixed(1).replace(".",",")}k`} delta="+15%" tint="green"  icon="trendUp" />
        <KpiMini label="Incassato"     value={`€ ${(totPagate/1000).toFixed(1).replace(".",",")}k`} delta={`${margine}%`} tint="teal" icon="check" />
        <KpiMini label="Da incassare"  value={`€ ${(daIncassare/1000).toFixed(1).replace(".",",")}k`} delta={`${fattEmesse.filter(f=>f.stato!=="pagata").length} in attesa`} tint="amber" icon="bell" />
        <KpiMini label="Costi"         value="€ 16.2k"  delta="+8%"   tint="orange" icon="ordini" />
        <KpiMini label="Margine"       value={`${margine}%`} delta="+4pt"  tint="violet" icon="contabilita" />
        <KpiMini label="Cassa"         value="€ 12.4k"  delta=""      tint="blue"   icon="contabilita" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <FatturePanel titolo="Fatture emesse" data={fattEmesse} dataAccess={data} tint="green" icon="contabilita" />
        <PagamentiPanel data={pagamenti} />
        <RiepilogoPanel totFatt={totFatt} totPagate={totPagate} margine={margine} />
      </div>
    </div>
  );
}

function FatturePanel({ titolo, data, dataAccess, tint, icon }: any) {
  const ramp = TINTS[tint as keyof typeof TINTS];
  const tot = data.reduce((s: number, f: any) => s + f.importo, 0);
  const STATO_FATT: Record<string, { label: string; tint: keyof typeof TINTS }> = {
    pagata:  { label: "Pagata",     tint: "green"  },
    emessa:  { label: "In attesa",  tint: "amber"  },
    scaduta: { label: "Scaduta",    tint: "red"    },
    bozza:   { label: "Bozza",      tint: "slate"  },
  };

  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden", height: "100%" })}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        background: ramp[50],
        borderBottom: `1px solid ${ramp[100]}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: ramp[400],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={icon} size={12} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: ramp[600] }}>{titolo}</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums" }}>
          € {tot.toLocaleString("it-IT")}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {data.map((f: any, i: number) => {
          const sm = STATO_FATT[f.stato] || STATO_FATT.bozza;
          const smRamp = TINTS[sm.tint];
          const c = dataAccess.getCommessa(f.commessaId);
          const cli = c ? dataAccess.getCliente(c.clienteId) : null;
          return (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              borderTop: i === 0 ? "none" : `1px solid ${TT.border}`,
              cursor: "pointer",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "monospace", fontSize: 9, color: TT.text3, fontWeight: 700, marginBottom: 2 }}>
                  {f.numero}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1 }}>
                  {cli?.nome || "?"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  <span style={{
                    padding: "1px 6px",
                    background: smRamp[100], color: smRamp[600],
                    borderRadius: 999, fontSize: 8, fontWeight: 700,
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {sm.label}
                  </span>
                  <span style={{ fontSize: 9, color: TT.text3 }}>{f.data}</span>
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800, color: TT.text1,
                fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
              }}>
                € {f.importo.toLocaleString("it-IT")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PagamentiPanel({ data }: { data: any[] }) {
  const tot = data.reduce((s, p) => s + (p.tipo === "incasso" ? p.importo : -p.importo), 0);
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden", height: "100%" })}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        background: TT.teal[50],
        borderBottom: `1px solid ${TT.teal[100]}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: TT.teal[400],
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="contabilita" size={12} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.teal[600] }}>Pagamenti recenti</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800,
          color: tot >= 0 ? TT.green[600] : TT.red[600],
          fontVariantNumeric: "tabular-nums",
        }}>
          {tot >= 0 ? "+" : ""}€ {Math.abs(tot).toLocaleString("it-IT")}
        </div>
      </div>
      <div>
        {data.map((p, i) => {
          const isIn = p.tipo === "incasso";
          const ramp = isIn ? TT.green : TT.amber;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              borderTop: i === 0 ? "none" : `1px solid ${TT.border}`,
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: ramp[100],
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name={isIn ? "plus" : "chevronRight"} size={12} color={ramp[600]} strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {p.cliente}
                </div>
                <div style={{ fontSize: 9, color: TT.text3, marginTop: 2 }}>
                  {p.data} &middot; {p.metodo}
                </div>
              </div>
              <div style={{
                fontSize: 12, fontWeight: 800,
                color: isIn ? TT.green[600] : TT.red[600],
                fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
              }}>
                {isIn ? "+" : "−"}€ {p.importo.toLocaleString("it-IT")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiepilogoPanel({ totFatt, totPagate, margine }: { totFatt: number; totPagate: number; margine: number }) {
  return (
    <div style={cardStyle({ padding: "16px 18px", height: "100%" })}>
      <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, marginBottom: 14 }}>
        Riepilogo mese
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <RiepRow label="Fatture emesse" value={`€ ${totFatt.toLocaleString("it-IT")}`} tint="green" />
        <RiepRow label="Incassato" value={`€ ${totPagate.toLocaleString("it-IT")}`} tint="teal" />
        <RiepRow label="Da incassare" value={`€ ${(totFatt-totPagate).toLocaleString("it-IT")}`} tint="amber" />
        <RiepRow label="Margine" value={`${margine}%`} tint="violet" />
      </div>
    </div>
  );
}

function RiepRow({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 12px",
      background: ramp[50], border: `1px solid ${ramp[100]}`,
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 11, color: TT.text2, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px" }}>
        {value}
      </span>
    </div>
  );
}

function KpiMini({ label, value, delta, tint, icon }: { label: string; value: string; delta: string; tint: keyof typeof TINTS; icon: IconName }) {
  const ramp = TINTS[tint];
  return (
    <div style={cardStyle({ padding: "12px 12px" })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 9, color: TT.text3, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" }}>
          {label}
        </span>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: ramp[100],
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={11} color={ramp[600]} strokeWidth={2.4} />
        </div>
      </div>
      <div style={{
        fontSize: 16, fontWeight: 800, color: ramp[600],
        letterSpacing: "-0.4px", fontVariantNumeric: "tabular-nums",
        lineHeight: 1, whiteSpace: "nowrap",
      }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 9, color: TT.text3, fontWeight: 600, marginTop: 4 }}>
          {delta}
        </div>
      )}
    </div>
  );
}
