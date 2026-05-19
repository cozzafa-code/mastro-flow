"use client";
import * as React from "react";
import { TT, cardStyle } from "./design-system";
import { Icon, IconName } from "./icons";
import { EntityType } from "./dashboard-context";
import { useMastroData, FaseCommessa } from "./store";
import AvatarGradient from "./AvatarGradient";

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange, pink: TT.pink,
  teal: TT.teal, slate: TT.slate, red: TT.red,
} as const;

interface Props {
  tipo: EntityType | null;
  id: string | null;
  onClose: () => void;
  onOpenCommessa: (id: string) => void;
  onOpenCliente: (id: string) => void;
}

export default function EntityDetailPanel({ tipo, id, onClose, onOpenCommessa, onOpenCliente }: Props) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (tipo && id) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tipo, id, onClose]);

  if (!tipo || !id) return null;

  return (
    <>
      {/* OVERLAY */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        zIndex: 999,
        animation: "mastroFadeIn 0.18s ease-out",
      }}>
        <style>{`
          @keyframes mastroFadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mastroSlideLeft {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>
      </div>

      {/* PANEL */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 520, maxWidth: "94vw",
        background: TT.bg,
        borderLeft: `1px solid ${TT.border}`,
        boxShadow: TT.shadowXl,
        zIndex: 1000,
        overflowY: "auto",
        animation: "mastroSlideLeft 0.28s cubic-bezier(0.32, 0.72, 0, 1)",
      }} onClick={(e) => e.stopPropagation()}>
        {tipo === "pratica" && <PraticaDetail id={id} onClose={onClose} onOpenCommessa={onOpenCommessa} onOpenCliente={onOpenCliente} />}
        {tipo === "fattura" && <FatturaDetail id={id} onClose={onClose} onOpenCommessa={onOpenCommessa} onOpenCliente={onOpenCliente} />}
        {tipo === "ordine"  && <OrdineDetail  id={id} onClose={onClose} onOpenCommessa={onOpenCommessa} />}
      </div>
    </>
  );
}

// ============================================================
// PRATICA DETAIL
// ============================================================

const BONUS_DEF: Record<string, { label: string; perc: string; tint: keyof typeof TINTS }> = {
  bonus_casa:     { label: "Bonus Casa",   perc: "50%", tint: "blue"   },
  ecobonus_50:    { label: "Ecobonus",      perc: "50%", tint: "green"  },
  ecobonus_65:    { label: "Ecobonus",      perc: "65%", tint: "teal"   },
  bonus_mobili:   { label: "Bonus Mobili",  perc: "50%", tint: "amber"  },
  superbonus_90:  { label: "Superbonus",    perc: "90%", tint: "violet" },
};

function PraticaDetail({ id, onClose, onOpenCommessa, onOpenCliente }: { id: string; onClose: () => void; onOpenCommessa: (id: string) => void; onOpenCliente: (id: string) => void }) {
  const data = useMastroData();
  const p = data.getPratiche().find((x) => x.id === id);
  if (!p) return <NotFound onClose={onClose} />;

  const cli = data.getCliente(p.clienteId);
  const com = data.getCommessa(p.commessaId);
  const bonus = BONUS_DEF[p.tipo];
  const ramp = TINTS[bonus.tint];

  const eneaInfo = {
    da_inviare:  { label: "Da inviare",  tint: "red"    as const, sub: p.deadlineEnea ? `Entro ${p.deadlineEnea}` : "" },
    inviato:     { label: "Inviato",     tint: "blue"   as const, sub: p.dataInvioEnea ? `Il ${p.dataInvioEnea}` : "" },
    confermato:  { label: "Confermato",  tint: "green"  as const, sub: "Pratica completata" },
  }[p.enea];
  const eneaRamp = TINTS[eneaInfo.tint];

  return (
    <div>
      <PanelHeader
        kicker="Pratica fiscale"
        title={p.numero}
        subtitle={`${bonus.label} ${bonus.perc}`}
        ramp={ramp}
        icon="fiscale"
        onClose={onClose}
      />

      <div style={{ padding: "18px 22px" }}>
        {/* badge info */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <span style={{
            padding: "3px 10px",
            background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
            color: "#fff",
            borderRadius: 999, fontSize: 11, fontWeight: 800,
            letterSpacing: "0.4px", textTransform: "uppercase",
            boxShadow: `0 2px 6px ${ramp[200]}`,
          }}>
            {bonus.perc} detraibile
          </span>
          {p.cam && (
            <span style={{
              padding: "3px 10px",
              background: TT.violet[100], color: TT.violet[600],
              borderRadius: 999, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.4px", textTransform: "uppercase",
            }}>CAM richiesto</span>
          )}
        </div>

        {/* Importi */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <SectionField icon="contabilita" label="Importo lavori" value={`€ ${p.importoTotale.toLocaleString("it-IT")}`} tint="slate" />
          <SectionField icon="check" label="Importo detraibile" value={`€ ${p.importoDetraibile.toLocaleString("it-IT")}`} tint={bonus.tint} />
        </div>

        {/* ENEA */}
        <div style={{
          marginBottom: 16,
          padding: "14px 16px",
          background: eneaRamp[50],
          border: `1px solid ${eneaRamp[100]}`,
          borderRadius: 11,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: eneaRamp[400],
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 3px 8px ${eneaRamp[200]}`,
          }}>
            <Icon name={p.enea === "confermato" ? "check" : "bell"} size={19} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: eneaRamp[600], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>
              Stato ENEA
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: TT.text1, letterSpacing: "-0.2px" }}>
              {eneaInfo.label}
            </div>
            {eneaInfo.sub && (
              <div style={{ fontSize: 11, color: TT.text2, marginTop: 1 }}>{eneaInfo.sub}</div>
            )}
          </div>
          {p.enea === "da_inviare" && (
            <button style={{
              padding: "8px 14px",
              background: eneaRamp[500], color: "#fff",
              border: "none", borderRadius: 8,
              fontSize: 11, fontWeight: 700,
              cursor: "pointer", fontFamily: TT.fontFamily,
              boxShadow: `0 2px 6px ${eneaRamp[300]}`,
              whiteSpace: "nowrap",
            }}>
              Invia ENEA
            </button>
          )}
        </div>

        {/* Collegamenti */}
        <SectionTitle>Collegamenti</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {com && (
            <LinkCard
              icon="commesse"
              kicker="Commessa associata"
              title={com.numero}
              subtitle={`Fase: ${com.fase} - € ${com.valore.toLocaleString("it-IT")}`}
              tint="orange"
              onClick={() => { onClose(); onOpenCommessa(com.id); }}
            />
          )}
          {cli && (
            <LinkCard
              icon="clienti"
              kicker="Cliente"
              title={cli.nome}
              subtitle={`${cli.indirizzo}, ${cli.citta}`}
              tint="violet"
              onClick={() => { onClose(); onOpenCliente(cli.id); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// FATTURA DETAIL
// ============================================================

function FatturaDetail({ id, onClose, onOpenCommessa, onOpenCliente }: { id: string; onClose: () => void; onOpenCommessa: (id: string) => void; onOpenCliente: (id: string) => void }) {
  const data = useMastroData();
  const f = data.getFatture().find((x) => x.id === id);
  if (!f) return <NotFound onClose={onClose} />;

  const com = data.getCommessa(f.commessaId);
  const cli = com ? data.getCliente(com.clienteId) : null;
  const pagamenti = data.getPagamenti().filter((p) => p.fatturaId === f.id);

  const statoInfo = {
    pagata:   { label: "Pagata",   tint: "green" as const, icon: "check" as const },
    scaduta:  { label: "Scaduta",  tint: "red"   as const, icon: "bell"  as const },
    emessa:   { label: "In attesa",tint: "amber" as const, icon: "bell"  as const },
    bozza:    { label: "Bozza",    tint: "slate" as const, icon: "documento" as const },
  }[f.stato];
  const statoRamp = TINTS[statoInfo.tint];

  return (
    <div>
      <PanelHeader
        kicker="Fattura"
        title={f.numero}
        subtitle={f.data}
        ramp={statoRamp}
        icon="contabilita"
        onClose={onClose}
      />

      <div style={{ padding: "18px 22px" }}>
        {/* Importo grosso */}
        <div style={{
          padding: "20px 22px",
          background: `linear-gradient(135deg, ${statoRamp[50]}, ${TT.bg})`,
          border: `1px solid ${statoRamp[100]}`,
          borderRadius: 13,
          marginBottom: 16,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: statoRamp[600], letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 6 }}>
            Importo fattura
          </div>
          <div style={{
            fontSize: 36, fontWeight: 800, color: TT.text1,
            letterSpacing: "-0.8px", lineHeight: 1, fontVariantNumeric: "tabular-nums",
          }}>
            € {f.importo.toLocaleString("it-IT")}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 10,
            padding: "4px 12px",
            background: statoRamp[400], color: "#fff",
            borderRadius: 999, fontSize: 11, fontWeight: 800,
            letterSpacing: "0.4px", textTransform: "uppercase",
          }}>
            <Icon name={statoInfo.icon} size={11} color="#fff" strokeWidth={2.6} />
            {statoInfo.label}
          </div>
        </div>

        {/* Pagamenti ricevuti */}
        {pagamenti.length > 0 && (
          <>
            <SectionTitle>Pagamenti ricevuti</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {pagamenti.map((p, i) => (
                <div key={i} style={{
                  padding: "10px 14px",
                  background: TT.green[50],
                  border: `1px solid ${TT.green[100]}`,
                  borderRadius: 9,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: TT.green[400],
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="check" size={14} color="#fff" strokeWidth={2.6} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1 }}>{p.metodo}</div>
                    <div style={{ fontSize: 10, color: TT.text3 }}>{p.data}</div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: TT.green[600], fontVariantNumeric: "tabular-nums" }}>
                    +€ {p.importo.toLocaleString("it-IT")}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Collegamenti */}
        <SectionTitle>Collegamenti</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {com && (
            <LinkCard
              icon="commesse"
              kicker="Commessa fatturata"
              title={com.numero}
              subtitle={`Fase: ${com.fase} - € ${com.valore.toLocaleString("it-IT")}`}
              tint="orange"
              onClick={() => { onClose(); onOpenCommessa(com.id); }}
            />
          )}
          {cli && (
            <LinkCard
              icon="clienti"
              kicker="Cliente"
              title={cli.nome}
              subtitle={`${cli.indirizzo}, ${cli.citta}`}
              tint="violet"
              onClick={() => { onClose(); onOpenCliente(cli.id); }}
            />
          )}
        </div>

        {/* Azioni */}
        {f.stato !== "pagata" && (
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <button style={{
              flex: 1, padding: "11px 14px",
              background: TT.green[500], color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: TT.fontFamily,
              boxShadow: `0 3px 10px ${TT.green[300]}`,
            }}>
              Registra pagamento
            </button>
            <button style={{
              flex: 1, padding: "11px 14px",
              background: TT.surface, color: TT.text2,
              border: `1px solid ${TT.borderStrong}`, borderRadius: 10,
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: TT.fontFamily,
            }}>
              Invia sollecito
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ORDINE DETAIL
// ============================================================

function OrdineDetail({ id, onClose, onOpenCommessa }: { id: string; onClose: () => void; onOpenCommessa: (id: string) => void }) {
  const data = useMastroData();
  const o = data.getOrdini().find((x) => x.id === id);
  if (!o) return <NotFound onClose={onClose} />;

  const statoInfo = {
    bozza:       { label: "Bozza",       tint: "slate"  as const },
    inviato:     { label: "Inviato",     tint: "blue"   as const },
    confermato:  { label: "Confermato",  tint: "violet" as const },
    in_consegna: { label: "In consegna", tint: "amber"  as const },
    ricevuto:    { label: "Ricevuto",    tint: "green"  as const },
  }[o.stato];
  const statoRamp = TINTS[statoInfo.tint];

  return (
    <div>
      <PanelHeader
        kicker="Ordine fornitore"
        title={o.numero}
        subtitle={o.fornitoreNome}
        ramp={statoRamp}
        icon="ordini"
        onClose={onClose}
      />

      <div style={{ padding: "18px 22px" }}>
        {/* Hero */}
        <div style={{
          padding: "16px 18px",
          background: `linear-gradient(135deg, ${statoRamp[50]}, ${TT.bg})`,
          border: `1px solid ${statoRamp[100]}`,
          borderRadius: 13,
          marginBottom: 14,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: `linear-gradient(135deg, ${statoRamp[300]}, ${statoRamp[500]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 12px ${statoRamp[200]}`,
            fontSize: 18, fontWeight: 800, color: "#fff",
            letterSpacing: "-0.5px",
          }}>
            {o.fornitoreNome.split(" ").map(s => s[0]).join("").substring(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: TT.text3, fontWeight: 600, marginBottom: 2 }}>
              Categoria: {o.categoria} &middot; {o.pezzi} pezzi
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
              € {o.importo.toLocaleString("it-IT")}
            </div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              marginTop: 6,
              padding: "2px 9px",
              background: statoRamp[400], color: "#fff",
              borderRadius: 999, fontSize: 10, fontWeight: 800,
              letterSpacing: "0.4px", textTransform: "uppercase",
            }}>
              {statoInfo.label}
            </div>
          </div>
        </div>

        {/* Dati */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <SectionField icon="calendario" label="Data ordine" value={o.data} tint="blue" />
          <SectionField icon="bell" label="Consegna prevista" value={o.consegnaPrevista} tint={o.giorniRitardo > 0 ? "red" : "green"} />
        </div>

        {o.giorniRitardo > 0 && (
          <div style={{
            padding: "10px 13px",
            background: TT.red[50],
            border: `1px solid ${TT.red[100]}`,
            borderRadius: 9,
            marginBottom: 14,
            display: "flex", alignItems: "center", gap: 9,
          }}>
            <Icon name="bell" size={14} color={TT.red[600]} strokeWidth={2.4} />
            <div style={{ flex: 1, fontSize: 11, color: TT.red[700], fontWeight: 700 }}>
              In ritardo di <strong>{o.giorniRitardo} giorni</strong>. Consigliato chiamare il fornitore.
            </div>
          </div>
        )}

        {/* Commesse collegate */}
        <SectionTitle>Commesse collegate ({o.commessaIds.length})</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {o.commessaIds.map((cId) => {
            const c = data.getCommesse().find((x) => x.numero === cId || x.id === cId);
            if (!c) {
              return (
                <div key={cId} style={{
                  padding: "10px 14px",
                  background: TT.bgSoft,
                  border: `1px solid ${TT.border}`,
                  borderRadius: 9,
                  fontSize: 11, color: TT.text3,
                  fontFamily: "monospace",
                }}>
                  {cId} &middot; commessa non trovata
                </div>
              );
            }
            const cli = data.getCliente(c.clienteId);
            return (
              <LinkCard
                key={c.id}
                icon="commesse"
                kicker={c.numero}
                title={cli?.nome || "?"}
                subtitle={`Fase: ${c.fase} - € ${c.valore.toLocaleString("it-IT")}`}
                tint="orange"
                onClick={() => { onClose(); onOpenCommessa(c.id); }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function PanelHeader({ kicker, title, subtitle, ramp, icon, onClose }: { kicker: string; title: string; subtitle?: string; ramp: any; icon: IconName; onClose: () => void }) {
  return (
    <div style={{
      padding: "20px 22px",
      borderBottom: `1px solid ${TT.border}`,
      background: `linear-gradient(135deg, ${ramp[50]}, ${TT.bg})`,
      display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 12px ${ramp[200]}`,
        flexShrink: 0,
      }}>
        <Icon name={icon} size={22} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 2 }}>
          {kicker}
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 17, fontWeight: 800, color: TT.text1, letterSpacing: "-0.3px", lineHeight: 1.2 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: TT.text2, marginTop: 3 }}>{subtitle}</div>
        )}
      </div>
      <button onClick={onClose} style={{
        width: 36, height: 36, borderRadius: 10,
        background: TT.surface,
        border: `1px solid ${TT.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", flexShrink: 0,
      }}>
        <Icon name="x" size={15} color={TT.text2} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: TT.text3,
      letterSpacing: "0.5px", textTransform: "uppercase",
      marginBottom: 8, marginTop: 4,
    }}>
      {children}
    </div>
  );
}

function SectionField({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "11px 14px",
      background: ramp[50],
      border: `1px solid ${ramp[100]}`,
      borderRadius: 9,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Icon name={icon} size={11} color={ramp[600]} strokeWidth={2.4} />
        <span style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 14, fontWeight: 800, color: ramp[600],
        letterSpacing: "-0.2px", fontVariantNumeric: "tabular-nums",
      }}>
        {value}
      </div>
    </div>
  );
}

function LinkCard({ icon, kicker, title, subtitle, tint, onClick }: { icon: IconName; kicker: string; title: string; subtitle?: string; tint: keyof typeof TINTS; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  const ramp = TINTS[tint];
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "12px 14px",
        background: hover ? ramp[50] : TT.surface,
        border: `1px solid ${hover ? ramp[200] : TT.border}`,
        borderRadius: 10,
        display: "flex", alignItems: "center", gap: 12,
        cursor: "pointer",
        transition: "all 0.15s",
        boxShadow: hover ? `0 2px 8px ${ramp[100]}` : "none",
      }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={16} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 1 }}>
          {kicker}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: TT.text2, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {subtitle}
          </div>
        )}
      </div>
      <Icon name="chevronRight" size={14} color={hover ? ramp[600] : TT.text3} strokeWidth={2.2} />
    </div>
  );
}

function NotFound({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ padding: "40px 30px", textAlign: "center" }}>
      <div style={{ fontSize: 14, color: TT.text3, marginBottom: 14 }}>
        Elemento non trovato
      </div>
      <button onClick={onClose} style={{
        padding: "8px 16px",
        background: TT.bgSoft, color: TT.text2,
        border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
        fontSize: 12, fontWeight: 700,
        cursor: "pointer", fontFamily: TT.fontFamily,
      }}>
        Chiudi
      </button>
    </div>
  );
}
