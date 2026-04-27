"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, StatoSopralluogo } from "../store";
import AvatarGradient from "../AvatarGradient";
import NuovoSopralluogoModal from "./NuovoSopralluogoModal";
import { ToastSuccess } from "../FormModal";

const STATI: Record<StatoSopralluogo, { label: string; tint: keyof typeof TINTS }> = {
  in_attesa:  { label: "In attesa",  tint: "amber"  },
  confermato: { label: "Confermato", tint: "blue"   },
  completato: { label: "Completato", tint: "green"  },
};

const TINTS = {
  amber: TT.amber, blue: TT.blue, teal: TT.teal,
  green: TT.green, slate: TT.slate, red: TT.red,
} as const;

export default function SopralluoghiTablet() {
  const data = useMastroData();
  const all = data.getSopralluoghi();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState(false);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Sopralluoghi</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {all.length} sopralluoghi &middot; {all.filter((s) => s.stato === "confermato").length} confermati &middot; {all.filter((s) => s.stato === "in_attesa").length} in attesa
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.red[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.red[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo sopralluogo
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="sopralluoghi" label="Totale"    value={String(all.length)} tint="red" />
        <KpiMini icon="calendario"   label="Confermati"value={String(all.filter((s) => s.stato === "confermato").length)} tint="blue" />
        <KpiMini icon="bell"         label="In attesa" value={String(all.filter((s) => s.stato === "in_attesa").length)}  tint="amber" />
        <KpiMini icon="check"        label="Completati"value={String(all.filter((s) => s.stato === "completato").length)} tint="green" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {all.map((s) => {
          const cli = data.getCliente(s.clienteId);
          const pos = data.getOperatore(s.posatoreId);
          const stato = STATI[s.stato];
          const ramp = TINTS[stato.tint];
          if (!cli) return null;
          return (
            <div key={s.id} style={cardStyle({ padding: "14px 16px", cursor: "pointer" })}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 56, padding: "6px 4px",
                  background: ramp[50], border: `1px solid ${ramp[100]}`,
                  borderRadius: 10, textAlign: "center", flexShrink: 0,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.4px", textTransform: "uppercase" }}>
                    {s.giorno.split(" ")[0]}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: ramp[600], lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px" }}>
                    {s.giorno.split(" ")[1] || ""}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1, marginTop: 4, fontVariantNumeric: "tabular-nums", borderTop: `1px solid ${ramp[100]}`, paddingTop: 3 }}>
                    {s.ora}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 600 }}>
                      {s.numero}
                    </span>
                    <span style={{
                      padding: "1px 7px",
                      background: ramp[100], color: ramp[600],
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>{stato.label}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px", marginBottom: 3 }}>
                    {cli.nome}
                  </div>
                  <div style={{ fontSize: 11, color: TT.text2 }}>
                    {cli.indirizzo}, {cli.citta}
                  </div>
                </div>
              </div>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px",
                background: TT.bgSoft,
                borderRadius: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AvatarGradient size={28} preset={pos?.preset || "a"} />
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
                      Posatore
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TT.text1, letterSpacing: "-0.1px" }}>
                      {pos ? `${pos.nome} ${pos.cognome}` : "?"}
                    </div>
                  </div>
                </div>
              </div>
              {s.note && (
                <div style={{
                  marginTop: 8, padding: "6px 10px",
                  background: TT.amber[50],
                  border: `1px solid ${TT.amber[100]}`,
                  borderRadius: 6, fontSize: 10, color: TT.text2,
                  fontStyle: "italic", lineHeight: 1.4,
                }}>{s.note}</div>
              )}
            </div>
          );
        })}
      </div>

      <NuovoSopralluogoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          setToast(true);
          setTimeout(() => setToast(false), 3000);
        }}
      />
      <ToastSuccess open={toast} msg="Sopralluogo pianificato" />
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
        <div style={{ fontSize: 20, fontWeight: 800, color: ramp[600], letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
      </div>
    </div>
  );
}
