"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useDashboard } from "../dashboard-context";
import { useMastroData, FaseCommessa } from "../store";
import AvatarGradient from "../AvatarGradient";

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange, pink: TT.pink,
  teal: TT.teal, slate: TT.slate, red: TT.red,
} as const;

const FASE_DEF: Record<FaseCommessa, { label: string; tint: keyof typeof TINTS }> = {
  rilievo:            { label: "Rilievo",       tint: "orange" },
  rilievo_confermato: { label: "Rilievo OK",    tint: "orange" },
  preventivo:         { label: "Preventivo",    tint: "violet" },
  conferma_ordine:    { label: "Conferma",      tint: "amber"  },
  ordine_confermato:  { label: "Ordine",        tint: "amber"  },
  produzione:         { label: "Produzione",    tint: "blue"   },
  montaggio:          { label: "Montaggio",     tint: "green"  },
  fattura:            { label: "Fattura",       tint: "pink"   },
  pagata:             { label: "Pagata",        tint: "green"  },
};

const TIPO_DEF = {
  privato:  { label: "Privato",  tint: "blue"   as const, icon: "clienti"  as const },
  azienda:  { label: "Azienda",  tint: "violet" as const, icon: "ordini"   as const },
  showroom: { label: "Showroom", tint: "amber"  as const, icon: "trendUp"  as const },
};

type TabId = "commesse" | "sopralluoghi" | "fatturato" | "anagrafica";

interface Props {
  clienteId: string;
  onBack: () => void;
}

export default function ClienteDettaglioTablet({ clienteId, onBack }: Props) {
  const data = useMastroData();
  const { openCommessa } = useDashboard();
  const [tab, setTab] = React.useState<TabId>("commesse");

  const cli = data.getCliente(clienteId);

  if (!cli) {
    return (
      <div style={cardStyle({ padding: 24, textAlign: "center", color: TT.text3 })}>
        Cliente non trovato
      </div>
    );
  }

  const tipo = TIPO_DEF[cli.tipo];
  const tipoRamp = TINTS[tipo.tint];
  const commesse = data.getCommesseByCliente(clienteId);
  const aperte = commesse.filter((c) => c.fase !== "pagata");
  const chiuse = commesse.filter((c) => c.fase === "pagata");
  const fatture = commesse.flatMap((c) => data.getFattureByCommessa(c.id));
  const sopralluoghi = data.getSopralluoghi().filter((s) => s.clienteId === clienteId);
  const valTotale = commesse.reduce((s, c) => s + c.valore, 0);
  const fattPagato = fatture.filter((f) => f.stato === "pagata").reduce((s, f) => s + f.importo, 0);
  const fattAttesa = fatture.filter((f) => f.stato !== "pagata").reduce((s, f) => s + f.importo, 0);

  const TABS: { id: TabId; label: string; icon: IconName; count?: number }[] = [
    { id: "commesse",     label: "Commesse",     icon: "commesse",     count: commesse.length },
    { id: "sopralluoghi", label: "Sopralluoghi", icon: "sopralluoghi", count: sopralluoghi.length },
    { id: "fatturato",    label: "Fatturato",    icon: "contabilita",  count: fatture.length },
    { id: "anagrafica",   label: "Anagrafica",   icon: "documento" },
  ];

  return (
    <div>
      {/* HEADER */}
      <div style={cardStyle({ padding: "20px 22px", marginBottom: 14 })}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          <AvatarGradient size={84} preset={cli.preset} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{
                padding: "2px 9px",
                background: tipoRamp[400], color: "#fff",
                borderRadius: 999, fontSize: 10, fontWeight: 800,
                letterSpacing: "0.4px", textTransform: "uppercase",
              }}>{tipo.label}</span>
              {commesse.length > 0 && (
                <span style={{
                  padding: "2px 9px",
                  background: TT.green[400], color: "#fff",
                  borderRadius: 999, fontSize: 10, fontWeight: 800,
                  letterSpacing: "0.4px", textTransform: "uppercase",
                }}>Cliente attivo</span>
              )}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: TT.text1, letterSpacing: "-0.6px", lineHeight: 1.1, marginBottom: 6 }}>
              {cli.nome}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, fontSize: 12, color: TT.text2 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="sopralluoghi" size={12} color={TT.text3} strokeWidth={2} />
                {cli.indirizzo}, {cli.citta}
              </span>
              {cli.telefono && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="chat" size={12} color={TT.text3} strokeWidth={2} />
                  {cli.telefono}
                </span>
              )}
              {cli.email && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="documento" size={12} color={TT.text3} strokeWidth={2} />
                  {cli.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI ECONOMICI */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TT.border}`, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <KpiCli icon="commesse"     label="Commesse"        value={String(commesse.length)} sub={`${aperte.length} aperte`} tint="orange" />
          <KpiCli icon="contabilita"  label="Valore commesse" value={`€ ${(valTotale/1000).toFixed(1).replace(".", ",")}k`} sub="totale storico" tint="violet" />
          <KpiCli icon="check"        label="Incassato"       value={`€ ${(fattPagato/1000).toFixed(1).replace(".", ",")}k`} sub={`${fatture.filter((f) => f.stato === "pagata").length} fatture`} tint="green" />
          <KpiCli icon="bell"         label="Saldo attuale"   value={`€ ${(fattAttesa/1000).toFixed(1).replace(".", ",")}k`} sub={fattAttesa > 0 ? "da incassare" : "tutto pagato"} tint={fattAttesa > 0 ? "red" : "slate"} />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, padding: 4, background: TT.surface, border: `1px solid ${TT.border}`, borderRadius: 12 }}>
        {TABS.map((t) => (
          <div key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 12px",
              background: t.id === tab ? tipoRamp[50] : "transparent",
              borderRadius: 8, cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            <Icon name={t.icon} size={13} color={t.id === tab ? tipoRamp[600] : TT.text3} strokeWidth={2.2} />
            <span style={{
              fontSize: 12, fontWeight: t.id === tab ? 700 : 600,
              color: t.id === tab ? tipoRamp[600] : TT.text2,
            }}>
              {t.label}
            </span>
            {t.count !== undefined && (
              <span style={{
                padding: "1px 7px",
                background: t.id === tab ? tipoRamp[400] : TT.bgSoft,
                color: t.id === tab ? "#fff" : TT.text3,
                borderRadius: 999, fontSize: 9, fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
              }}>
                {t.count}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* CONTENT */}
      {tab === "commesse"     && <TabCommesse commesse={commesse} dataAccess={data} onClickCommessa={openCommessa} tipoRamp={tipoRamp} />}
      {tab === "sopralluoghi" && <TabSopralluoghi sopralluoghi={sopralluoghi} dataAccess={data} />}
      {tab === "fatturato"    && <TabFatturato fatture={fatture} dataAccess={data} onClickCommessa={openCommessa} />}
      {tab === "anagrafica"   && <TabAnagrafica cliente={cli} />}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function KpiCli({ icon, label, value, sub, tint }: { icon: IconName; label: string; value: string; sub: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "12px 14px",
      background: ramp[50], border: `1px solid ${ramp[100]}`,
      borderRadius: 9,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: ramp[400],
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name={icon} size={14} color="#fff" strokeWidth={2.2} />
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase" }}>
          {label}
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: ramp[600], letterSpacing: "-0.4px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: TT.text3, fontWeight: 600, marginTop: 3 }}>
        {sub}
      </div>
    </div>
  );
}

function TabCommesse({ commesse, dataAccess, onClickCommessa, tipoRamp }: { commesse: any[]; dataAccess: any; onClickCommessa: (id: string) => void; tipoRamp: any }) {
  if (commesse.length === 0) {
    return <div style={cardStyle({ padding: 30, textAlign: "center", color: TT.text3, fontSize: 12 })}>
      Nessuna commessa per questo cliente.
    </div>;
  }
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            <Th>Numero</Th>
            <Th>Apertura</Th>
            <Th align="center">Vani</Th>
            <Th>Posatore</Th>
            <Th>Fase</Th>
            <Th align="right">Valore</Th>
            <Th width="40px" />
          </tr>
        </thead>
        <tbody>
          {commesse.map((c: any) => {
            const op = dataAccess.getOperatore(c.posatoreId);
            const fase = FASE_DEF[c.fase as FaseCommessa];
            const ramp = TINTS[fase.tint];
            return (
              <CommessaRow key={c.id}
                commessa={c} op={op} fase={fase} ramp={ramp}
                onClick={() => onClickCommessa(c.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CommessaRow({ commessa, op, fase, ramp, onClick }: any) {
  const [hover, setHover] = React.useState(false);
  return (
    <tr onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? ramp[50] : "transparent",
        cursor: "pointer", borderTop: `1px solid ${TT.border}`,
        transition: "background 0.1s",
      }}>
      <Td>
        <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>{commessa.numero}</span>
      </Td>
      <Td><span style={{ fontSize: 11, color: TT.text2 }}>{commessa.apertaIl}</span></Td>
      <Td align="center">
        <span style={{ fontSize: 12, fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{commessa.vani.length}</span>
      </Td>
      <Td>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {op && <AvatarGradient size={20} preset={op.preset} />}
          <span style={{ fontSize: 11, color: TT.text2, fontWeight: 600 }}>
            {op ? op.nome : "?"}
          </span>
        </div>
      </Td>
      <Td>
        <span style={{
          padding: "2px 8px",
          background: ramp[100], color: ramp[600],
          borderRadius: 12, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.2px", textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>{fase.label}</span>
      </Td>
      <Td align="right">
        <span style={{
          fontSize: 13, fontWeight: 800, color: TT.text1,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
          whiteSpace: "nowrap",
        }}>€ {commessa.valore.toLocaleString("it-IT")}</span>
      </Td>
      <Td>
        <Icon name="chevronRight" size={14} color={hover ? ramp[500] : TT.text3} strokeWidth={2} />
      </Td>
    </tr>
  );
}

function TabSopralluoghi({ sopralluoghi, dataAccess }: { sopralluoghi: any[]; dataAccess: any }) {
  if (sopralluoghi.length === 0) {
    return <div style={cardStyle({ padding: 30, textAlign: "center", color: TT.text3, fontSize: 12 })}>
      Nessun sopralluogo per questo cliente.
    </div>;
  }

  const STATI: any = {
    in_attesa:  { label: "In attesa",  tint: "amber"  },
    confermato: { label: "Confermato", tint: "blue"   },
    completato: { label: "Completato", tint: "green"  },
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
      {sopralluoghi.map((s: any) => {
        const pos = dataAccess.getOperatore(s.posatoreId);
        const stato = STATI[s.stato];
        const ramp = TINTS[stato.tint as keyof typeof TINTS];
        return (
          <div key={s.id} style={cardStyle({ padding: "14px 16px" })}>
            <div style={{ display: "flex", gap: 12 }}>
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
                {pos && (
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 6, padding: "6px 10px", background: TT.bgSoft, borderRadius: 7 }}>
                    <AvatarGradient size={22} preset={pos.preset} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: TT.text2 }}>
                      {pos.nome} {pos.cognome}
                    </span>
                  </div>
                )}
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
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabFatturato({ fatture, dataAccess, onClickCommessa }: { fatture: any[]; dataAccess: any; onClickCommessa: (id: string) => void }) {
  if (fatture.length === 0) {
    return <div style={cardStyle({ padding: 30, textAlign: "center", color: TT.text3, fontSize: 12 })}>
      Nessuna fattura per questo cliente.
    </div>;
  }
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            <Th>Numero</Th>
            <Th>Data</Th>
            <Th>Commessa</Th>
            <Th>Stato</Th>
            <Th align="right">Importo</Th>
            <Th width="40px" />
          </tr>
        </thead>
        <tbody>
          {fatture.map((f: any) => {
            const stato = f.stato === "pagata"
              ? { label: "Pagata", ramp: TT.green }
              : f.stato === "scaduta"
              ? { label: "Scaduta", ramp: TT.red }
              : { label: "In attesa", ramp: TT.amber };
            const com = dataAccess.getCommessa(f.commessaId);
            return (
              <tr key={f.id}
                onClick={() => com && onClickCommessa(com.id)}
                style={{ borderTop: `1px solid ${TT.border}`, cursor: "pointer" }}>
                <Td><span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>{f.numero}</span></Td>
                <Td><span style={{ fontSize: 11, color: TT.text2 }}>{f.data}</span></Td>
                <Td><span style={{ fontFamily: "monospace", fontSize: 10, color: TT.teal[600], fontWeight: 600 }}>{com?.numero || "-"}</span></Td>
                <Td>
                  <span style={{
                    padding: "2px 8px",
                    background: stato.ramp[100], color: stato.ramp[600],
                    borderRadius: 12, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.2px", textTransform: "uppercase",
                  }}>{stato.label}</span>
                </Td>
                <Td align="right">
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: TT.text1,
                    fontVariantNumeric: "tabular-nums", letterSpacing: "-0.2px",
                  }}>€ {f.importo.toLocaleString("it-IT")}</span>
                </Td>
                <Td>
                  <Icon name="chevronRight" size={14} color={TT.text3} strokeWidth={2} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabAnagrafica({ cliente }: { cliente: any }) {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 16 }}>
        Anagrafica completa
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Nome / Ragione sociale" value={cliente.nome} />
        <Field label="Tipo cliente" value={TIPO_DEF[cliente.tipo as keyof typeof TIPO_DEF].label} />
        <Field label="Indirizzo" value={cliente.indirizzo || "-"} />
        <Field label="Città" value={cliente.citta || "-"} />
        <Field label="Telefono" value={cliente.telefono || "-"} />
        <Field label="Email" value={cliente.email || "-"} />
        {cliente.cf && <Field label="Codice fiscale" value={cliente.cf} />}
        {cliente.piva && <Field label="Partita IVA" value={cliente.piva} />}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: "10px 12px",
      background: TT.bgSoft,
      border: `1px solid ${TT.border}`,
      borderRadius: 8,
    }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: TT.text1, letterSpacing: "-0.1px", wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}

function Th({ children, align, width }: { children?: React.ReactNode; align?: "left"|"center"|"right"; width?: string }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: align || "left",
      fontSize: 10, fontWeight: 700, color: TT.text3,
      letterSpacing: "0.6px", textTransform: "uppercase",
      width,
    }}>{children}</th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "left"|"center"|"right" }) {
  return <td style={{ padding: "10px 14px", textAlign: align || "left", verticalAlign: "middle" }}>{children}</td>;
}
