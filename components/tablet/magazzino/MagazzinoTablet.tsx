"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData } from "../store";
import NuovoArticoloModal from "./NuovoArticoloModal";
import { ToastSuccess } from "../FormModal";

const TINTS = {
  blue: TT.blue, violet: TT.violet, amber: TT.amber,
  teal: TT.teal, green: TT.green, red: TT.red, slate: TT.slate, orange: TT.orange,
} as const;

const CAT_DEF: Record<string, { label: string; tint: keyof typeof TINTS }> = {
  profili:     { label: "Profili",      tint: "blue"   },
  vetri:       { label: "Vetri",        tint: "violet" },
  ferramenta:  { label: "Ferramenta",   tint: "amber"  },
  guarnizioni: { label: "Guarnizioni",  tint: "teal"   },
  accessori:   { label: "Accessori",    tint: "green"  },
};

export default function MagazzinoTablet() {
  const data = useMastroData();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  const articoli = data.getArticoli();
  const movimenti = data.getMovimenti();
  const sottoSoglia = articoli.filter((a) => a.scorta < a.scortaMin).length;
  const esauriti = articoli.filter((a) => a.scorta === 0).length;
  const valore = articoli.reduce((s, a) => s + a.scorta * a.prezzoMedio, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Magazzino</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {articoli.length} articoli &middot; valore € {valore.toLocaleString("it-IT", { maximumFractionDigits: 0 })} &middot; {sottoSoglia} sotto soglia &middot; {esauriti} esauriti
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.amber[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.amber[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Aggiungi articolo
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="magazzino"   label="Articoli totali" value={String(articoli.length)} tint="amber" />
        <KpiMini icon="contabilita" label="Valore stock"    value={`€ ${(valore/1000).toFixed(0)}k`} tint="green" />
        <KpiMini icon="bell"        label="Sotto soglia"    value={String(sottoSoglia)} tint="amber" />
        <KpiMini icon="x"           label="Esauriti"        value={String(esauriti)} tint="red" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 12, alignItems: "flex-start" }}>
        <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
            <thead>
              <tr style={{ background: TT.bgSoft }}>
                <Th>Articolo</Th>
                <Th>Categoria</Th>
                <Th align="center">Ubicaz.</Th>
                <Th align="right">Scorta</Th>
                <Th align="right">Stato</Th>
              </tr>
            </thead>
            <tbody>
              {articoli.map((a) => {
                const cat = CAT_DEF[a.categoria];
                const catRamp = TINTS[cat.tint];
                const stato = a.scorta === 0 ? "esaurito" : a.scorta < a.scortaMin * 0.5 ? "critico" : a.scorta < a.scortaMin ? "basso" : "ok";
                const sm = stato === "ok" ? { label: "OK", tint: TT.green } : stato === "basso" ? { label: "Basso", tint: TT.amber } : { label: stato === "esaurito" ? "Esaurito" : "Critico", tint: TT.red };
                const pct = Math.min(100, (a.scorta / Math.max(1, a.scortaMin)) * 100);
                return (
                  <tr key={a.id} style={{ borderTop: `1px solid ${TT.border}`, cursor: "pointer" }}>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 7,
                          background: catRamp[100], color: catRamp[600],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 9, fontWeight: 800,
                          fontFamily: "monospace", letterSpacing: "0.3px",
                        }}>
                          {a.categoria.substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontFamily: "monospace", fontSize: 9, color: TT.text3, fontWeight: 600, marginBottom: 1 }}>
                            {a.codice}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
                            {a.nome}
                          </div>
                          <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>
                            {a.descrizione}
                          </div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <span style={{
                        padding: "2px 8px",
                        background: catRamp[100], color: catRamp[600],
                        borderRadius: 12, fontSize: 10, fontWeight: 700,
                        letterSpacing: "0.2px", textTransform: "uppercase",
                      }}>
                        {cat.label}
                      </span>
                    </Td>
                    <Td align="center">
                      <span style={{
                        fontFamily: "monospace", fontSize: 11, color: TT.text2,
                        fontWeight: 600, padding: "2px 6px",
                        background: TT.bgSoft, borderRadius: 4,
                      }}>
                        {a.ubicazione}
                      </span>
                    </Td>
                    <Td align="right">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: sm.tint[600], fontVariantNumeric: "tabular-nums" }}>
                          {a.scorta.toLocaleString("it-IT")} <span style={{ fontSize: 10, color: TT.text3, fontWeight: 600 }}>{a.unita}</span>
                        </div>
                        <div style={{ fontSize: 9, color: TT.text3, marginTop: 2 }}>
                          min: {a.scortaMin} {a.unita}
                        </div>
                      </div>
                    </Td>
                    <Td align="right">
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <span style={{
                          padding: "2px 8px",
                          background: sm.tint[100], color: sm.tint[600],
                          borderRadius: 999, fontSize: 9, fontWeight: 700,
                          letterSpacing: "0.3px", textTransform: "uppercase",
                        }}>
                          {sm.label}
                        </span>
                        <div style={{ width: 80, height: 3, background: TT.bgSoft, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: sm.tint[400] }} />
                        </div>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={cardStyle({ padding: "14px 16px" })}>
          <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, marginBottom: 12 }}>
            Movimenti recenti
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {movimenti.map((m) => {
              const isCarico = m.tipo === "carico";
              const ramp = isCarico ? TT.green : TT.amber;
              return (
                <div key={m.id} style={{
                  display: "flex", gap: 9,
                  padding: "8px 10px",
                  background: ramp[50],
                  border: `1px solid ${ramp[100]}`,
                  borderRadius: 8,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: ramp[400],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon name={isCarico ? "plus" : "chevronRight"} size={12} color="#fff" strokeWidth={2.6} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 1 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.3px", textTransform: "uppercase" }}>
                        {isCarico ? "Carico" : "Scarico"}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>
                        {isCarico ? "+" : "−"}{m.qta} {m.unita}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11, fontWeight: 600, color: TT.text1,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {m.articoloNome}
                    </div>
                    <div style={{ fontSize: 10, color: TT.text3, marginTop: 2 }}>
                      {m.data} &middot; <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{m.riferimento}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <NuovoArticoloModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          setToast(true);
          setTimeout(() => setToast(false), 3000);
        }}
      />
      <ToastSuccess open={toast} msg="Articolo aggiunto al magazzino" />
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
      padding: "10px 12px", textAlign: align || "left",
      fontSize: 10, fontWeight: 700, color: TT.text3,
      letterSpacing: "0.6px", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return <td style={{ padding: "10px 12px", textAlign: align || "left", verticalAlign: "middle" }}>{children}</td>;
}
