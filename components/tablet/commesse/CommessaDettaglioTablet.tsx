"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, FaseCommessa } from "../store";
import AvatarGradient from "../AvatarGradient";

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange, pink: TT.pink,
  teal: TT.teal, red: TT.red, slate: TT.slate,
} as const;

const FASE_DEF: Record<FaseCommessa, { label: string; tint: keyof typeof TINTS; step: number }> = {
  rilievo:            { label: "Rilievo",      tint: "orange", step: 1 },
  rilievo_confermato: { label: "Rilievo OK",   tint: "orange", step: 2 },
  preventivo:         { label: "Preventivo",   tint: "violet", step: 3 },
  conferma_ordine:    { label: "Conferma",     tint: "amber",  step: 4 },
  ordine_confermato:  { label: "Ordine OK",    tint: "amber",  step: 5 },
  produzione:         { label: "Produzione",   tint: "blue",   step: 6 },
  montaggio:          { label: "Montaggio",    tint: "green",  step: 7 },
  fattura:            { label: "Fattura",      tint: "pink",   step: 8 },
  pagata:             { label: "Pagata",       tint: "green",  step: 9 },
};

type TabId = "vani" | "documenti" | "pagamenti" | "note" | "storico";

interface Props {
  commessaId: string;
}

export default function CommessaDettaglioTablet({ commessaId }: Props) {
  const data = useMastroData();
  const [tab, setTab] = React.useState<TabId>("vani");
  const c = data.getCommessa(commessaId);

  if (!c) {
    return (
      <div style={cardStyle({ padding: 24, textAlign: "center", color: TT.text3 })}>
        Commessa non trovata
      </div>
    );
  }

  const cli = data.getCliente(c.clienteId);
  const op = data.getOperatore(c.posatoreId);
  const fase = FASE_DEF[c.fase];
  const ramp = TINTS[fase.tint];
  const preventivo = data.getPreventivoByCommessa(commessaId);
  const fatture = data.getFattureByCommessa(commessaId);
  const pratica = data.getPraticaByCommessa(commessaId);
  const ordini = data.getOrdiniByCommessa(commessaId);
  const produzione = data.getProduzioneByCommessa(commessaId);
  const montaggi = data.getMontaggiByCommessa(commessaId);
  const timeline = data.getTimelineByCommessa(commessaId);

  const TABS: { id: TabId; label: string; icon: IconName; count?: number }[] = [
    { id: "vani",       label: "Vani",        icon: "commesse",   count: c.vani.length },
    { id: "documenti",  label: "Documenti",   icon: "documento",  count: 1 + (preventivo ? 1 : 0) + ordini.length + fatture.length },
    { id: "pagamenti",  label: "Pagamenti",   icon: "contabilita",count: fatture.length },
    { id: "note",       label: "Note",        icon: "chat" },
    { id: "storico",    label: "Storico",     icon: "produzione", count: timeline.length },
  ];

  return (
    <div>
      {/* HEADER COMMESSA */}
      <div style={cardStyle({ padding: "20px 22px", marginBottom: 14 })}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <AvatarGradient size={64} preset={cli?.preset || "a"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text3 }}>
                {c.numero}
              </span>
              <span style={{
                padding: "2px 8px",
                background: ramp[400], color: "#fff",
                borderRadius: 999, fontSize: 10, fontWeight: 800,
                letterSpacing: "0.4px", textTransform: "uppercase",
              }}>
                {fase.label}
              </span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: TT.text1, letterSpacing: "-0.5px" }}>
              {cli?.nome || "?"}
            </div>
            <div style={{ fontSize: 12, color: TT.text2, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="sopralluoghi" size={12} color={TT.text3} strokeWidth={2} />
              {cli?.indirizzo}, {cli?.citta}
            </div>
            {c.note && (
              <div style={{ fontSize: 12, color: TT.text2, marginTop: 8, fontStyle: "italic", lineHeight: 1.5 }}>
                {c.note}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: TT.text3, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase" }}>
              Valore
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: ramp[600], letterSpacing: "-0.6px", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>
              € {c.valore.toLocaleString("it-IT")}
            </div>
            <div style={{ fontSize: 11, color: TT.text3, fontWeight: 600, marginTop: 4 }}>
              Aperta: {c.apertaIl}
            </div>
          </div>
        </div>

        {/* PROGRESS */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${TT.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              Avanzamento workflow
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: ramp[600], fontVariantNumeric: "tabular-nums" }}>
              Step {fase.step} / 9
            </span>
          </div>
          <div style={{ height: 6, background: TT.bgSoft, borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(fase.step / 9) * 100}%`,
              background: `linear-gradient(90deg, ${ramp[400]}, ${ramp[500]})`,
            }} />
          </div>
        </div>

        {/* POSATORE + STATS */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <Stat icon="team" label="Posatore" value={op ? `${op.nome.charAt(0)}. ${op.cognome}` : "?"} tint="teal" />
          <Stat icon="commesse" label="Vani" value={String(c.vani.length)} tint="orange" />
          <Stat icon="ordini" label="Ordini fornitori" value={String(ordini.length)} tint="amber" />
          <Stat icon="fiscale" label="Pratica" value={pratica?.numero || "—"} tint="violet" />
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, padding: 4, background: TT.surface, border: `1px solid ${TT.border}`, borderRadius: 12 }}>
        {TABS.map((t) => (
          <div key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "9px 12px",
              background: t.id === tab ? ramp[50] : "transparent",
              borderRadius: 8, cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            <Icon name={t.icon} size={13} color={t.id === tab ? ramp[600] : TT.text3} strokeWidth={2.2} />
            <span style={{
              fontSize: 12, fontWeight: t.id === tab ? 700 : 600,
              color: t.id === tab ? ramp[600] : TT.text2,
              letterSpacing: "-0.05px",
            }}>
              {t.label}
            </span>
            {t.count !== undefined && (
              <span style={{
                padding: "1px 6px",
                background: t.id === tab ? ramp[400] : TT.bgSoft,
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
      {tab === "vani"      && <TabVani vani={c.vani} />}
      {tab === "documenti" && <TabDocumenti commessa={c} preventivo={preventivo} ordini={ordini} fatture={fatture} pratica={pratica} produzione={produzione} montaggi={montaggi} />}
      {tab === "pagamenti" && <TabPagamenti fatture={fatture} pagamenti={data.getPagamenti().filter((p) => fatture.some((f) => f.id === p.fatturaId))} />}
      {tab === "note"      && <TabNote note={c.note} />}
      {tab === "storico"   && <TabStorico timeline={timeline} dataAccess={data} />}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function Stat({ icon, label, value, tint }: { icon: IconName; label: string; value: string; tint: keyof typeof TINTS }) {
  const ramp = TINTS[tint];
  return (
    <div style={{
      padding: "10px 12px",
      background: ramp[50], border: `1px solid ${ramp[100]}`,
      borderRadius: 9,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: ramp[400],
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Icon name={icon} size={15} color="#fff" strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
          {label}
        </div>
        <div style={{
          fontSize: 13, fontWeight: 800, color: ramp[600],
          letterSpacing: "-0.2px", fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function TabVani({ vani }: { vani: any[] }) {
  return (
    <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr style={{ background: TT.bgSoft }}>
            <Th>Codice</Th>
            <Th>Ambiente</Th>
            <Th>Tipologia</Th>
            <Th align="center">L (mm)</Th>
            <Th align="center">H (mm)</Th>
            <Th align="center">Forma</Th>
            <Th align="center">Pezzi</Th>
          </tr>
        </thead>
        <tbody>
          {vani.map((v) => (
            <tr key={v.id} style={{ borderTop: `1px solid ${TT.border}`, cursor: "pointer" }}>
              <Td>
                <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>{v.codice}</span>
              </Td>
              <Td>
                <span style={{ fontWeight: 700, color: TT.text1, letterSpacing: "-0.05px" }}>{v.ambiente}</span>
              </Td>
              <Td>
                <span style={{ color: TT.text2 }}>{v.tipologia}</span>
              </Td>
              <Td align="center">
                <span style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{v.larghezza_mm}</span>
              </Td>
              <Td align="center">
                <span style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{v.altezza_mm}</span>
              </Td>
              <Td align="center">
                <span style={{ fontSize: 10, color: TT.text3, textTransform: "capitalize" }}>{v.forma}</span>
              </Td>
              <Td align="center">
                <span style={{ fontWeight: 800, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{v.pezzi}</span>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabDocumenti({ preventivo, ordini, fatture, pratica }: any) {
  const docs: any[] = [];
  if (preventivo) docs.push({ tipo: "Preventivo", numero: preventivo.numero, data: preventivo.data, importo: preventivo.importo, tint: "violet", icon: "preventivo" });
  ordini.forEach((o: any) => docs.push({ tipo: "Ordine fornitore", numero: o.numero, data: o.data, importo: o.importo, tint: "amber", icon: "ordini", extra: o.fornitoreNome }));
  fatture.forEach((f: any) => docs.push({ tipo: "Fattura", numero: f.numero, data: f.data, importo: f.importo, tint: "pink", icon: "contabilita" }));
  if (pratica) docs.push({ tipo: "Pratica fiscale", numero: pratica.numero, data: "", importo: pratica.importoDetraibile, tint: "green", icon: "fiscale", extra: `Detrazione ${pratica.tipo.replace("_", " ")}` });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
      {docs.map((d, i) => {
        const ramp = TINTS[d.tint as keyof typeof TINTS];
        return (
          <div key={i} style={cardStyle({ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 })}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 3px 8px ${ramp[200]}`,
            }}>
              <Icon name={d.icon} size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>
                {d.tipo}
              </div>
              <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>
                {d.numero}
              </div>
              {d.extra && (
                <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>{d.extra}</div>
              )}
              {d.data && (
                <div style={{ fontSize: 10, color: TT.text3 }}>{d.data}</div>
              )}
            </div>
            {d.importo > 0 && (
              <div style={{
                fontSize: 14, fontWeight: 800, color: ramp[600],
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.3px",
                whiteSpace: "nowrap",
              }}>
                € {d.importo.toLocaleString("it-IT")}
              </div>
            )}
          </div>
        );
      })}
      {docs.length === 0 && (
        <div style={cardStyle({ padding: 24, textAlign: "center", color: TT.text3, fontSize: 12 })}>
          Nessun documento ancora
        </div>
      )}
    </div>
  );
}

function TabPagamenti({ fatture, pagamenti }: { fatture: any[]; pagamenti: any[] }) {
  return (
    <div>
      <div style={cardStyle({ padding: 0, overflow: "hidden", marginBottom: 12 })}>
        <div style={{ padding: "10px 16px", background: TT.bgSoft, borderBottom: `1px solid ${TT.border}`, fontSize: 11, fontWeight: 700, color: TT.text2, letterSpacing: "0.3px", textTransform: "uppercase" }}>
          Fatture
        </div>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
          <tbody>
            {fatture.map((f) => {
              const stato = f.stato === "pagata" ? { label: "Pagata", tint: TT.green } : f.stato === "scaduta" ? { label: "Scaduta", tint: TT.red } : { label: "In attesa", tint: TT.amber };
              return (
                <tr key={f.id} style={{ borderTop: `1px solid ${TT.border}` }}>
                  <Td>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 700, marginBottom: 2 }}>
                      {f.numero}
                    </div>
                    <span style={{ fontSize: 11, color: TT.text2 }}>{f.data}</span>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "1px 7px",
                      background: stato.tint[100], color: stato.tint[600],
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>
                      {stato.label}
                    </span>
                  </Td>
                  <Td align="right">
                    <span style={{ fontSize: 14, fontWeight: 800, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>
                      € {f.importo.toLocaleString("it-IT")}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagamenti.length > 0 && (
        <div style={cardStyle({ padding: 0, overflow: "hidden" })}>
          <div style={{ padding: "10px 16px", background: TT.bgSoft, borderBottom: `1px solid ${TT.border}`, fontSize: 11, fontWeight: 700, color: TT.text2, letterSpacing: "0.3px", textTransform: "uppercase" }}>
            Pagamenti ricevuti
          </div>
          {pagamenti.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: i === 0 ? "none" : `1px solid ${TT.border}` }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: TT.green[100],
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon name="check" size={13} color={TT.green[600]} strokeWidth={2.6} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1 }}>
                  {p.metodo}
                </div>
                <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>{p.data}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: TT.green[600], fontVariantNumeric: "tabular-nums" }}>
                +€ {p.importo.toLocaleString("it-IT")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabNote({ note }: { note?: string }) {
  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 10 }}>
        Note commessa
      </div>
      <div style={{ fontSize: 13, color: TT.text1, lineHeight: 1.7 }}>
        {note || (
          <span style={{ color: TT.text3, fontStyle: "italic" }}>Nessuna nota inserita.</span>
        )}
      </div>
    </div>
  );
}

function TabStorico({ timeline, dataAccess }: { timeline: any[]; dataAccess: any }) {
  return (
    <div style={cardStyle({ padding: "16px 18px" })}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 14 }}>
        Cronologia attività
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        {/* linea verticale */}
        <div style={{ position: "absolute", left: 14, top: 12, bottom: 12, width: 2, background: TT.border }} />

        {timeline.map((t, i) => {
          const fase = FASE_DEF[t.fase as FaseCommessa];
          const ramp = TINTS[fase.tint];
          const op = dataAccess.getOperatore(t.autoreId);
          return (
            <div key={t.id} style={{ display: "flex", gap: 14, paddingBottom: 14, position: "relative" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: ramp[400],
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, zIndex: 1,
                boxShadow: `0 2px 6px ${ramp[200]}`,
              }}>
                <Icon name="check" size={13} color="#fff" strokeWidth={3} />
              </div>
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{
                    padding: "1px 7px",
                    background: ramp[100], color: ramp[600],
                    borderRadius: 999, fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {fase.label}
                  </span>
                  <span style={{ fontSize: 10, color: TT.text3, fontWeight: 600 }}>{t.data}</span>
                </div>
                <div style={{ fontSize: 12, color: TT.text1, fontWeight: 600, marginBottom: 4 }}>
                  {t.testo}
                </div>
                {op && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <AvatarGradient size={18} preset={op.preset} />
                    <span style={{ fontSize: 10, color: TT.text3 }}>
                      {op.nome} {op.cognome}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
