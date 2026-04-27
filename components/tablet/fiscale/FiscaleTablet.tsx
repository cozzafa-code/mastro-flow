"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData, TipoBonus, StatoEnea } from "../store";

const TINTS = {
  green: TT.green, blue: TT.blue, amber: TT.amber,
  violet: TT.violet, red: TT.red, pink: TT.pink,
  teal: TT.teal, slate: TT.slate, orange: TT.orange,
} as const;

const BONUS_DEF: Record<TipoBonus, { label: string; perc: string; tint: keyof typeof TINTS }> = {
  bonus_casa:     { label: "Bonus Casa",     perc: "50%", tint: "blue"   },
  ecobonus_50:    { label: "Ecobonus",        perc: "50%", tint: "green"  },
  ecobonus_65:    { label: "Ecobonus",        perc: "65%", tint: "teal"   },
  bonus_mobili:   { label: "Bonus Mobili",    perc: "50%", tint: "amber"  },
  superbonus_90:  { label: "Superbonus",      perc: "90%", tint: "violet" },
};

const ENEA_DEF: Record<StatoEnea, { label: string; tint: keyof typeof TINTS }> = {
  da_inviare:  { label: "Da inviare",  tint: "red"   },
  inviato:     { label: "Inviato",     tint: "blue"  },
  confermato:  { label: "Confermato",  tint: "green" },
};

type FiltroBonus = "tutti" | TipoBonus;
type FiltroEnea = "tutti" | StatoEnea;

const FILTRI_BONUS: { id: FiltroBonus; label: string }[] = [
  { id: "tutti",          label: "Tutti i bonus" },
  { id: "bonus_casa",     label: "Bonus Casa 50%" },
  { id: "ecobonus_50",    label: "Ecobonus 50%" },
  { id: "ecobonus_65",    label: "Ecobonus 65%" },
  { id: "bonus_mobili",   label: "Bonus Mobili 50%" },
  { id: "superbonus_90",  label: "Superbonus 90%" },
];

const FILTRI_ENEA: { id: FiltroEnea; label: string }[] = [
  { id: "tutti",      label: "ENEA tutti" },
  { id: "da_inviare", label: "Da inviare" },
  { id: "inviato",    label: "Inviato" },
  { id: "confermato", label: "Confermato" },
];

export default function FiscaleTablet() {
  const data = useMastroData();
  const { openEntity } = useDashboard();
  const [filtroBonus, setFiltroBonus] = React.useState<FiltroBonus>("tutti");
  const [filtroEnea, setFiltroEnea] = React.useState<FiltroEnea>("tutti");

  const all = data.getPratiche();

  const filtered = React.useMemo(() => {
    return all.filter((p) => {
      if (filtroBonus !== "tutti" && p.tipo !== filtroBonus) return false;
      if (filtroEnea !== "tutti" && p.enea !== filtroEnea) return false;
      return true;
    });
  }, [all, filtroBonus, filtroEnea]);

  const totDetr = all.reduce((s, p) => s + p.importoDetraibile, 0);
  const totDetrFiltrato = filtered.reduce((s, p) => s + p.importoDetraibile, 0);
  const eneaDaInviare = all.filter((p) => p.enea === "da_inviare").length;
  const camRichiesto = all.filter((p) => p.cam).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>Fiscale</div>
          <div style={{ fontSize: 12, color: TT.text3, marginTop: 2 }}>
            {all.length} pratiche &middot; € {totDetr.toLocaleString("it-IT")} detraibili totali &middot; {eneaDaInviare} ENEA da inviare
          </div>
        </div>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "9px 14px",
          background: TT.amber[400], color: "#fff",
          border: "none", borderRadius: 10,
          fontSize: 13, fontWeight: 700,
          cursor: "pointer", fontFamily: TT.fontFamily,
          boxShadow: `0 2px 8px ${TT.amber[300]}`,
        }}>
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Nuova pratica
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
        <KpiMini icon="fiscale"     label="Pratiche totali" value={String(all.length)} tint="amber" />
        <KpiMini icon="contabilita" label="Detraibile" value={`€ ${(totDetr/1000).toFixed(1).replace(".", ",")}k`} tint="green" />
        <KpiMini icon="bell"        label="ENEA da inviare" value={String(eneaDaInviare)} tint={eneaDaInviare > 0 ? "red" : "green"} />
        <KpiMini icon="check"       label="CAM richiesto" value={String(camRichiesto)} tint="violet" />
      </div>

      {/* FILTRI TIPO BONUS */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6 }}>
          Tipo agevolazione
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTRI_BONUS.map((f) => {
            const isActive = f.id === filtroBonus;
            const ramp = f.id !== "tutti" ? TINTS[BONUS_DEF[f.id as TipoBonus].tint] : null;
            const count = f.id === "tutti" ? all.length : all.filter((p) => p.tipo === f.id).length;
            return (
              <FilterPill key={f.id}
                label={f.label} count={count}
                active={isActive}
                onClick={() => setFiltroBonus(f.id)}
                ramp={ramp}
              />
            );
          })}
        </div>
      </div>

      {/* FILTRI ENEA */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 6 }}>
          Stato ENEA
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTRI_ENEA.map((f) => {
            const isActive = f.id === filtroEnea;
            const ramp = f.id !== "tutti" ? TINTS[ENEA_DEF[f.id as StatoEnea].tint] : null;
            const count = f.id === "tutti" ? all.length : all.filter((p) => p.enea === f.id).length;
            return (
              <FilterPill key={f.id}
                label={f.label} count={count}
                active={isActive}
                onClick={() => setFiltroEnea(f.id)}
                ramp={ramp}
              />
            );
          })}
        </div>
      </div>

      {/* RISULTATI BANNER */}
      {(filtroBonus !== "tutti" || filtroEnea !== "tutti") && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px",
          background: TT.teal[50],
          border: `1px solid ${TT.teal[100]}`,
          borderRadius: 9,
          marginBottom: 10,
          fontSize: 11,
        }}>
          <div style={{ color: TT.text2 }}>
            <strong style={{ color: TT.teal[700], fontVariantNumeric: "tabular-nums" }}>
              {filtered.length}
            </strong> pratich{filtered.length === 1 ? "a" : "e"} con i filtri attivi
          </div>
          <div style={{ color: TT.text2, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
            Detraibile filtrato: <span style={{ color: TT.teal[700] }}>€ {totDetrFiltrato.toLocaleString("it-IT")}</span>
          </div>
        </div>
      )}

      {/* PRATICHE GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {filtered.map((p) => {
          const cli = data.getCliente(p.clienteId);
          const com = data.getCommessa(p.commessaId);
          const bonus = BONUS_DEF[p.tipo];
          const enea = ENEA_DEF[p.enea];
          const bonusRamp = TINTS[bonus.tint];
          const eneaRamp = TINTS[enea.tint];
          if (!cli) return null;
          return (
            <div key={p.id}
              onClick={() => openEntity("pratica", p.id)}
              style={cardStyle({ padding: 0, cursor: "pointer", overflow: "hidden" })}>

              {/* Header colorato */}
              <div style={{
                padding: "12px 16px",
                background: `linear-gradient(135deg, ${bonusRamp[50]}, ${TT.bg})`,
                borderBottom: `1px solid ${TT.border}`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 11,
                  background: `linear-gradient(135deg, ${bonusRamp[300]}, ${bonusRamp[500]})`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 3px 10px ${bonusRamp[200]}`,
                  color: "#fff",
                  letterSpacing: "-0.5px",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {bonus.perc}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 700 }}>{p.numero}</span>
                    {p.cam && (
                      <span style={{
                        padding: "1px 6px",
                        background: TT.violet[100], color: TT.violet[600],
                        borderRadius: 4, fontSize: 8, fontWeight: 800,
                        letterSpacing: "0.4px", textTransform: "uppercase",
                      }}>CAM</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TT.text1, letterSpacing: "-0.2px" }}>
                    {bonus.label}
                  </div>
                  <div style={{ fontSize: 11, color: TT.text2, marginTop: 1 }}>
                    {cli.nome} &middot; {com?.numero || ""}
                  </div>
                </div>
                <span style={{
                  padding: "3px 9px",
                  background: eneaRamp[400], color: "#fff",
                  borderRadius: 999, fontSize: 9, fontWeight: 800,
                  letterSpacing: "0.4px", textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  boxShadow: `0 2px 6px ${eneaRamp[200]}`,
                }}>
                  ENEA {enea.label}
                </span>
              </div>

              {/* Body con dettagli */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
                  marginBottom: 12,
                }}>
                  <Stat label="Importo lavori" value={`€ ${p.importoTotale.toLocaleString("it-IT")}`} tint="slate" />
                  <Stat label="Detraibile" value={`€ ${p.importoDetraibile.toLocaleString("it-IT")}`} tint={bonus.tint} />
                </div>

                {/* Deadline ENEA */}
                {p.enea === "da_inviare" && p.deadlineEnea && (
                  <div style={{
                    padding: "8px 12px",
                    background: TT.red[50],
                    border: `1px solid ${TT.red[100]}`,
                    borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <Icon name="bell" size={14} color={TT.red[600]} strokeWidth={2.4} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TT.red[600], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}>
                        Deadline ENEA
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1 }}>
                        Entro {p.deadlineEnea}
                      </div>
                    </div>
                  </div>
                )}

                {p.enea === "inviato" && p.dataInvioEnea && (
                  <div style={{
                    padding: "8px 12px",
                    background: TT.blue[50],
                    border: `1px solid ${TT.blue[100]}`,
                    borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <Icon name="check" size={14} color={TT.blue[600]} strokeWidth={2.4} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TT.blue[600], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}>
                        Inviato il
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1 }}>
                        {p.dataInvioEnea} &middot; In attesa conferma
                      </div>
                    </div>
                  </div>
                )}

                {p.enea === "confermato" && (
                  <div style={{
                    padding: "8px 12px",
                    background: TT.green[50],
                    border: `1px solid ${TT.green[100]}`,
                    borderRadius: 8,
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <Icon name="check" size={14} color={TT.green[600]} strokeWidth={2.6} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: TT.green[600], letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 1 }}>
                        ENEA Confermato
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text1 }}>
                        Pratica completata
                      </div>
                    </div>
                  </div>
                )}
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
            Nessuna pratica con i filtri attivi.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterPill({ label, count, active, onClick, ramp }: { label: string; count: number; active: boolean; onClick: () => void; ramp: any }) {
  return (
    <div onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 11px",
      background: active ? (ramp ? ramp[400] : TT.text1) : TT.surface,
      color: active ? "#fff" : TT.text2,
      border: `1px solid ${active ? "transparent" : TT.borderStrong}`,
      borderRadius: 999,
      fontSize: 11, fontWeight: 600,
      cursor: "pointer", transition: "all 0.12s",
    }}>
      {label}
      <span style={{
        background: active ? "rgba(255,255,255,0.28)" : (ramp ? ramp[100] : TT.bgSoft),
        color: active ? "#fff" : (ramp ? ramp[600] : TT.text3),
        fontSize: 9, fontWeight: 700,
        padding: "1px 6px", borderRadius: 999,
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

function Stat({ label, value, tint }: { label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "8px 10px",
      background: ramp[50], border: `1px solid ${ramp[100]}`,
      borderRadius: 7,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{
        fontSize: 13, fontWeight: 800, color: ramp[600],
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {value}
      </div>
    </div>
  );
}
