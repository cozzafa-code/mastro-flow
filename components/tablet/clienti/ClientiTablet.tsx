"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData } from "../store";
import AvatarGradient from "../AvatarGradient";
import NuovoClienteModal from "./NuovoClienteModal";
import { ToastSuccess } from "../FormModal";

const TINTS = {
  blue: TT.blue, violet: TT.violet, green: TT.green,
  amber: TT.amber, teal: TT.teal, orange: TT.orange, slate: TT.slate, red: TT.red,
} as const;

const TIPO_DEF = {
  privato:  { label: "Privato",  tint: "blue"   as const },
  azienda:  { label: "Azienda",  tint: "violet" as const },
  showroom: { label: "Showroom", tint: "amber"  as const },
};

export default function ClientiTablet() {
  const data = useMastroData();
  const { openCliente } = useDashboard();
  const clienti = data.getClienti();
  const [search, setSearch] = React.useState("");
  const [filtroTipo, setFiltroTipo] = React.useState<"tutti" | "privato" | "azienda" | "showroom">("tutti");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [toast, setToast] = React.useState(false);

  const filtered = React.useMemo(() => {
    let r = filtroTipo === "tutti" ? clienti : clienti.filter((c) => c.tipo === filtroTipo);
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter((c) => {
        const haystack = [c.nome, c.citta, c.indirizzo, c.telefono, c.email].filter(Boolean).join(" ").toLowerCase();
        return q.split(/\s+/).every((token) => haystack.includes(token));
      });
    }
    return r;
  }, [clienti, search, filtroTipo]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Clienti</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {clienti.length} clienti &middot; {clienti.filter((c) => c.tipo === "privato").length} privati &middot; {clienti.filter((c) => c.tipo === "azienda").length} aziende
          </div>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.violet[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.violet[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuovo cliente
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="clienti"  label="Totali"  value={String(clienti.length)} tint="violet" />
        <KpiMini icon="check"    label="Privati" value={String(clienti.filter(c=>c.tipo==="privato").length)} tint="green" />
        <KpiMini icon="ordini"   label="Aziende" value={String(clienti.filter(c=>c.tipo==="azienda").length)} tint="teal" />
        <KpiMini icon="trendUp"  label="Showroom"value={String(clienti.filter(c=>c.tipo==="showroom").length)} tint="amber" />
      </div>

      {/* TOOLBAR Search + Filtri */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ position: "relative", flex: "0 0 320px" }}>
          <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <Icon name="search" size={14} color={search ? TT.violet[600] : TT.text3} strokeWidth={2.2} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nome, citta, telefono, email..."
            style={{
              width: "100%", height: 38,
              padding: "0 36px 0 36px",
              background: TT.surface,
              border: `1px solid ${search ? TT.violet[400] : TT.borderStrong}`,
              borderRadius: 10,
              fontSize: 12, fontFamily: TT.fontFamily,
              color: TT.text1, outline: "none",
              boxSizing: "border-box",
              boxShadow: search ? `0 0 0 3px ${TT.violet[100]}` : "none",
              transition: "all 0.12s",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 22, height: 22, borderRadius: 6,
              background: TT.bgSoft, border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}>
              <Icon name="x" size={11} color={TT.text2} strokeWidth={2.4} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["tutti","privato","azienda","showroom"] as const).map((t) => {
            const ramp = t !== "tutti" ? TINTS[TIPO_DEF[t as "privato"].tint] : null;
            const isActive = t === filtroTipo;
            const count = t === "tutti" ? clienti.length : clienti.filter((c) => c.tipo === t).length;
            const label = t === "tutti" ? "Tutti" : TIPO_DEF[t as "privato"].label;
            return (
              <div key={t} onClick={() => setFiltroTipo(t)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: isActive ? (ramp ? ramp[400] : TT.text1) : TT.surface,
                color: isActive ? "#fff" : TT.text2,
                border: `1px solid ${isActive ? "transparent" : TT.borderStrong}`,
                borderRadius: 999,
                fontSize: 12, fontWeight: 600,
                cursor: "pointer",
              }}>
                {label}
                <span style={{
                  background: isActive ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
                  color: isActive ? "#fff" : (ramp ? ramp[600] : TT.text3),
                  fontSize: 10, fontWeight: 700,
                  padding: "1px 7px", borderRadius: 999,
                  fontVariantNumeric: "tabular-nums",
                }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {filtered.map((cli) => {
          const tipo = TIPO_DEF[cli.tipo];
          const tipoRamp = TINTS[tipo.tint];
          const commesse = data.getCommesseByCliente(cli.id);
          const aperte = commesse.filter((c) => c.fase !== "pagata").length;
          const chiuse = commesse.filter((c) => c.fase === "pagata").length;
          const fatt = commesse.reduce((s, c) => s + c.valore, 0);
          return (
            <div key={cli.id}
              onClick={() => openCliente(cli.id)}
              style={cardStyle({ padding: "16px 18px", cursor: "pointer" })}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <AvatarGradient size={44} preset={cli.preset} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{
                      padding: "1px 7px",
                      background: tipoRamp[100], color: tipoRamp[600],
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>{tipo.label}</span>
                    {commesse.length > 0 && (
                      <span style={{
                        padding: "1px 7px",
                        background: TT.green[100], color: TT.green[600],
                        borderRadius: 999, fontSize: 9, fontWeight: 700,
                        letterSpacing: "0.3px", textTransform: "uppercase",
                      }}>Attivo</span>
                    )}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TT.text1, letterSpacing: "-0.2px" }}>
                    {cli.nome}
                  </div>
                  <div style={{ fontSize: 11, color: TT.text3, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Icon name="sopralluoghi" size={10} color={TT.text3} strokeWidth={2} />
                    {cli.indirizzo}, {cli.citta}
                  </div>
                </div>
                <Icon name="chevronRight" size={16} color={tipoRamp[400]} strokeWidth={2.2} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${TT.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: TT.text2 }}>
                  <Icon name="chat" size={11} color={TT.text3} strokeWidth={2} />
                  <span>{cli.telefono || "-"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 11, color: TT.text2 }}>
                  <Icon name="documento" size={11} color={TT.text3} strokeWidth={2} />
                  <span>{cli.email || "-"}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 8 }}>
                <Stat label="Aperte" value={String(aperte)} tint="teal" />
                <Stat label="Chiuse" value={String(chiuse)} tint="slate" />
                <Stat label="Fatturato" value={`€ ${fatt.toLocaleString("it-IT")}`} tint="green" />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: "span 2",
            padding: 30, textAlign: "center",
            color: TT.text3, fontSize: 12,
          }}>
            {search ? `Nessun cliente per "${search}"` : "Nessun cliente in questa categoria."}
          </div>
        )}
      </div>

      <NuovoClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          setToast(true);
          setTimeout(() => setToast(false), 3000);
        }}
      />
      <ToastSuccess open={toast} msg="Cliente aggiunto" />
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
      <div style={{ fontSize: 13, fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px", whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );
}
