"use client";
import * as React from "react";
import { TT, cardStyle } from "../design-system";
import { Icon, IconName } from "../icons";
import { useMastroData, FaseCommessa, useMastroMutators, Vano } from "../store";
import AvatarGradient from "../AvatarGradient";

const TINTS = {
  blue: TT.blue, amber: TT.amber, green: TT.green,
  violet: TT.violet, orange: TT.orange, pink: TT.pink,
  teal: TT.teal, red: TT.red, slate: TT.slate,
} as const;

const FASE_DEF: Record<FaseCommessa, { label: string; tint: keyof typeof TINTS; step: number; next?: FaseCommessa; nextLabel?: string }> = {
  rilievo:            { label: "Rilievo",      tint: "orange", step: 1, next: "rilievo_confermato", nextLabel: "Conferma rilievo" },
  rilievo_confermato: { label: "Rilievo OK",   tint: "orange", step: 2, next: "preventivo",         nextLabel: "Genera preventivo" },
  preventivo:         { label: "Preventivo",   tint: "violet", step: 3, next: "conferma_ordine",    nextLabel: "Cliente accetta" },
  conferma_ordine:    { label: "Conferma",     tint: "amber",  step: 4, next: "ordine_confermato",  nextLabel: "Cliente firma ordine" },
  ordine_confermato:  { label: "Ordine OK",    tint: "amber",  step: 5, next: "produzione",         nextLabel: "Avvia produzione" },
  produzione:         { label: "Produzione",   tint: "blue",   step: 6, next: "montaggio",          nextLabel: "Pianifica montaggio" },
  montaggio:          { label: "Montaggio",    tint: "green",  step: 7, next: "fattura",            nextLabel: "Emetti fattura" },
  fattura:            { label: "Fattura",      tint: "pink",   step: 8, next: "pagata",             nextLabel: "Registra pagamento" },
  pagata:             { label: "Pagata",       tint: "green",  step: 9 },
};

type TabId = "vani" | "documenti" | "pagamenti" | "note" | "storico";

interface Props { commessaId: string; }

export default function CommessaDettaglioTablet({ commessaId }: Props) {
  const data = useMastroData();
  const mut = useMastroMutators();
  const [tab, setTab] = React.useState<TabId>("vani");
  const [confermaFase, setConfermaFase] = React.useState(false);
  const [vanoEdit, setVanoEdit] = React.useState<Vano | null>(null);
  const [vanoNuovo, setVanoNuovo] = React.useState(false);

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

  const onAvanzaFase = () => {
    if (!fase.next) return;
    mut.updateCommessaFase(commessaId, fase.next);
    setConfermaFase(false);
  };

  return (
    <div>
      {/* HEADER */}
      <div style={cardStyle({ padding: "20px 22px", marginBottom: 14 })}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <AvatarGradient size={64} preset={cli?.preset || "a"} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text3 }}>{c.numero}</span>
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

        {/* PROGRESS WORKFLOW */}
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
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>

        {/* AZIONE CONTESTUALE */}
        {fase.next && (
          <div style={{
            marginTop: 16,
            padding: "12px 14px",
            background: ramp[50],
            border: `1px solid ${ramp[100]}`,
            borderRadius: 10,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: `linear-gradient(135deg, ${ramp[300]}, ${ramp[500]})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: `0 3px 8px ${ramp[200]}`,
            }}>
              <Icon name="ai" size={17} color="#fff" strokeWidth={2.4} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 1 }}>
                Prossima azione
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1, letterSpacing: "-0.1px" }}>
                {fase.nextLabel}
              </div>
            </div>
            <button
              onClick={() => setConfermaFase(true)}
              style={{
                padding: "9px 16px",
                background: ramp[500], color: "#fff",
                border: "none", borderRadius: 9,
                fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: TT.fontFamily,
                boxShadow: `0 2px 8px ${ramp[300]}`,
                whiteSpace: "nowrap",
              }}
            >
              {fase.nextLabel} &rsaquo;
            </button>
          </div>
        )}

        {/* STATS */}
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <Stat icon="team" label="Posatore" value={op ? `${op.nome.charAt(0)}. ${op.cognome}` : "?"} tint="teal" />
          <Stat icon="commesse" label="Vani" value={String(c.vani.length)} tint="orange" />
          <Stat icon="ordini" label="Ordini" value={String(ordini.length)} tint="amber" />
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
      {tab === "vani"      && <TabVani vani={c.vani} commessaId={commessaId} mut={mut} onEdit={setVanoEdit} onAdd={() => setVanoNuovo(true)} ramp={ramp} />}
      {tab === "documenti" && <TabDocumenti preventivo={preventivo} ordini={ordini} fatture={fatture} pratica={pratica} />}
      {tab === "pagamenti" && <TabPagamenti fatture={fatture} pagamenti={data.getPagamenti().filter((p) => fatture.some((f) => f.id === p.fatturaId))} />}
      {tab === "note"      && <TabNoteEdit note={c.note} commessaId={commessaId} mut={mut} />}
      {tab === "storico"   && <TabStorico timeline={timeline} dataAccess={data} />}

      {/* MODALI */}
      {confermaFase && fase.next && (
        <Modal onClose={() => setConfermaFase(false)} title={fase.nextLabel || ""} ramp={ramp} icon="ai">
          <div style={{ fontSize: 13, color: TT.text2, marginBottom: 14, lineHeight: 1.6 }}>
            Stai per spostare la commessa <strong style={{ color: TT.text1 }}>{c.numero}</strong> dalla fase <strong style={{ color: ramp[600] }}>{fase.label}</strong> alla fase successiva: <strong style={{ color: TINTS[FASE_DEF[fase.next].tint][600] }}>{FASE_DEF[fase.next].label}</strong>.
          </div>
          <div style={{ fontSize: 12, color: TT.text3, marginBottom: 18, padding: "10px 12px", background: TT.bgSoft, borderRadius: 8 }}>
            L'azione viene registrata in cronologia. Continuare?
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => setConfermaFase(false)} style={btnSecondary}>Annulla</button>
            <button onClick={onAvanzaFase} style={{
              padding: "9px 16px",
              background: ramp[500], color: "#fff",
              border: "none", borderRadius: 9,
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: TT.fontFamily,
              boxShadow: `0 2px 8px ${ramp[300]}`,
            }}>
              Conferma avanzamento
            </button>
          </div>
        </Modal>
      )}

      {(vanoNuovo || vanoEdit) && (
        <ModalVano
          vano={vanoEdit}
          onClose={() => { setVanoNuovo(false); setVanoEdit(null); }}
          onSave={(v) => {
            if (vanoEdit) {
              mut.updateVano(commessaId, vanoEdit.id, v);
            } else {
              const codice = v.codice || `V${String(c.vani.length + 1).padStart(2,"0")}`;
              mut.addVano(commessaId, { ...v, codice } as Omit<Vano, "id">);
            }
            setVanoNuovo(false);
            setVanoEdit(null);
          }}
          ramp={ramp}
        />
      )}
    </div>
  );
}

// =========================================================
// SUBCOMPONENTS
// =========================================================

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

function TabVani({ vani, commessaId, mut, onEdit, onAdd, ramp }: any) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: TT.text3 }}>
          {vani.length} vani &middot; click su un vano per modificare
        </div>
        <button
          onClick={onAdd}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 14px",
            background: ramp[500], color: "#fff",
            border: "none", borderRadius: 9,
            fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
            boxShadow: `0 2px 8px ${ramp[300]}`,
          }}
        >
          <Icon name="plus" size={13} color="#fff" strokeWidth={2.4} />
          Aggiungi vano
        </button>
      </div>

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
              <Th width="80px" />
            </tr>
          </thead>
          <tbody>
            {vani.map((v: Vano) => (
              <tr key={v.id} style={{ borderTop: `1px solid ${TT.border}` }}>
                <Td><span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>{v.codice}</span></Td>
                <Td><span style={{ fontWeight: 700, color: TT.text1 }}>{v.ambiente}</span></Td>
                <Td><span style={{ color: TT.text2 }}>{v.tipologia}</span></Td>
                <Td align="center"><span style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{v.larghezza_mm}</span></Td>
                <Td align="center"><span style={{ fontWeight: 700, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{v.altezza_mm}</span></Td>
                <Td align="center"><span style={{ fontSize: 10, color: TT.text3, textTransform: "capitalize" }}>{v.forma}</span></Td>
                <Td align="center"><span style={{ fontWeight: 800, color: TT.text1, fontVariantNumeric: "tabular-nums" }}>{v.pezzi}</span></Td>
                <Td>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => onEdit(v)} style={btnRowAction(TT.blue)} title="Modifica">
                      <Icon name="documento" size={12} color={TT.blue[600]} strokeWidth={2.2} />
                    </button>
                    <button onClick={() => {
                      if (confirm(`Eliminare il vano ${v.codice} - ${v.ambiente}?`)) {
                        mut.deleteVano(commessaId, v.id);
                      }
                    }} style={btnRowAction(TT.red)} title="Elimina">
                      <Icon name="x" size={12} color={TT.red[600]} strokeWidth={2.4} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {vani.length === 0 && (
              <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: TT.text3, fontSize: 12 }}>
                Nessun vano. Click "Aggiungi vano" per iniziare.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function btnRowAction(tint: any): React.CSSProperties {
  return {
    width: 26, height: 26,
    background: tint[50],
    border: `1px solid ${tint[100]}`,
    borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer",
  };
}

function TabDocumenti({ preventivo, ordini, fatture, pratica }: any) {
  const docs: any[] = [];
  if (preventivo) docs.push({ tipo: "Preventivo", numero: preventivo.numero, data: preventivo.data, importo: preventivo.importo, tint: "violet", icon: "preventivo" });
  ordini.forEach((o: any) => docs.push({ tipo: "Ordine fornitore", numero: o.numero, data: o.data, importo: o.importo, tint: "amber", icon: "ordini", extra: o.fornitoreNome }));
  fatture.forEach((f: any) => docs.push({ tipo: "Fattura", numero: f.numero, data: f.data, importo: f.importo, tint: "pink", icon: "contabilita" }));
  if (pratica) docs.push({ tipo: "Pratica fiscale", numero: pratica.numero, data: "", importo: pratica.importoDetraibile, tint: "green", icon: "fiscale", extra: `Detrazione ${pratica.tipo.replace("_"," ")}` });

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
              flexShrink: 0, boxShadow: `0 3px 8px ${ramp[200]}`,
            }}>
              <Icon name={d.icon} size={18} color="#fff" strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: ramp[600], letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 2 }}>{d.tipo}</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: TT.text1 }}>{d.numero}</div>
              {d.extra && <div style={{ fontSize: 10, color: TT.text3, marginTop: 1 }}>{d.extra}</div>}
              {d.data && <div style={{ fontSize: 10, color: TT.text3 }}>{d.data}</div>}
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
            {fatture.map((f: any) => {
              const stato = f.stato === "pagata" ? { label: "Pagata", tint: TT.green } : f.stato === "scaduta" ? { label: "Scaduta", tint: TT.red } : { label: "In attesa", tint: TT.amber };
              return (
                <tr key={f.id} style={{ borderTop: `1px solid ${TT.border}` }}>
                  <Td>
                    <div style={{ fontFamily: "monospace", fontSize: 10, color: TT.text3, fontWeight: 700, marginBottom: 2 }}>{f.numero}</div>
                    <span style={{ fontSize: 11, color: TT.text2 }}>{f.data}</span>
                  </Td>
                  <Td>
                    <span style={{
                      padding: "1px 7px",
                      background: stato.tint[100], color: stato.tint[600],
                      borderRadius: 999, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.3px", textTransform: "uppercase",
                    }}>{stato.label}</span>
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
          {pagamenti.map((p: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderTop: i === 0 ? "none" : `1px solid ${TT.border}` }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: TT.green[100],
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="check" size={13} color={TT.green[600]} strokeWidth={2.6} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TT.text1 }}>{p.metodo}</div>
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

function TabNoteEdit({ note, commessaId, mut }: { note?: string; commessaId: string; mut: any }) {
  const [edit, setEdit] = React.useState(false);
  const [val, setVal] = React.useState(note || "");

  React.useEffect(() => { setVal(note || ""); }, [note]);

  const onSave = () => {
    mut.updateNote(commessaId, val.trim());
    setEdit(false);
  };

  return (
    <div style={cardStyle({ padding: "20px 22px" })}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase" }}>
          Note commessa
        </div>
        {!edit && (
          <button onClick={() => setEdit(true)} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 11px",
            background: TT.bgSoft, color: TT.text2,
            border: `1px solid ${TT.borderStrong}`, borderRadius: 7,
            fontSize: 11, fontWeight: 700,
            cursor: "pointer", fontFamily: TT.fontFamily,
          }}>
            <Icon name="documento" size={11} color={TT.text2} strokeWidth={2.4} />
            Modifica
          </button>
        )}
      </div>
      {edit ? (
        <div>
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Scrivi una nota per questa commessa..."
            style={{
              width: "100%", minHeight: 120,
              padding: "12px 14px",
              border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
              background: TT.surface,
              fontSize: 13, fontFamily: TT.fontFamily,
              color: TT.text1, lineHeight: 1.6,
              outline: "none", resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
            <button onClick={() => { setVal(note || ""); setEdit(false); }} style={btnSecondary}>
              Annulla
            </button>
            <button onClick={onSave} style={{
              padding: "8px 16px",
              background: TT.teal[500], color: "#fff",
              border: "none", borderRadius: 9,
              fontSize: 12, fontWeight: 700,
              cursor: "pointer", fontFamily: TT.fontFamily,
              boxShadow: `0 2px 8px ${TT.teal[300]}`,
            }}>
              Salva nota
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: TT.text1, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {note || (
            <span style={{ color: TT.text3, fontStyle: "italic" }}>Nessuna nota inserita. Click su "Modifica" per aggiungerne una.</span>
          )}
        </div>
      )}
    </div>
  );
}

function TabStorico({ timeline, dataAccess }: { timeline: any[]; dataAccess: any }) {
  const sorted = [...timeline].reverse();
  return (
    <div style={cardStyle({ padding: "16px 18px" })}>
      <div style={{ fontSize: 11, fontWeight: 700, color: TT.text3, letterSpacing: "0.3px", textTransform: "uppercase", marginBottom: 14 }}>
        Cronologia attività
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        <div style={{ position: "absolute", left: 14, top: 12, bottom: 12, width: 2, background: TT.border }} />
        {sorted.map((t: any) => {
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

// ========================================================
// MODAL GENERICO
// ========================================================
function Modal({ children, title, onClose, ramp, icon }: any) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.45)",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 520, maxWidth: "100%",
        background: TT.surface,
        borderRadius: 18,
        boxShadow: TT.shadowXl,
        border: `1px solid ${TT.border}`,
        overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 22px",
          borderBottom: `1px solid ${TT.border}`,
          background: `linear-gradient(135deg, ${ramp[50]}, ${TT.bg})`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${ramp[400]}, ${ramp[500]})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 3px 8px ${ramp[200]}`,
          }}>
            <Icon name={icon} size={17} color="#fff" strokeWidth={2.4} />
          </div>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 800, color: TT.text1, letterSpacing: "-0.3px" }}>
            {title}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: TT.bgSoft,
            border: `1px solid ${TT.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <Icon name="x" size={14} color={TT.text2} strokeWidth={2.4} />
          </button>
        </div>
        <div style={{ padding: "20px 22px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ========================================================
// MODALE AGGIUNGI/MODIFICA VANO
// ========================================================
function ModalVano({ vano, onClose, onSave, ramp }: any) {
  const [codice, setCodice] = React.useState(vano?.codice || "");
  const [ambiente, setAmbiente] = React.useState(vano?.ambiente || "");
  const [tipologia, setTipologia] = React.useState(vano?.tipologia || "");
  const [larghezza, setLarghezza] = React.useState(String(vano?.larghezza_mm || 1000));
  const [altezza, setAltezza] = React.useState(String(vano?.altezza_mm || 1400));
  const [forma, setForma] = React.useState<"rettangolare"|"arco"|"trapezio">(vano?.forma || "rettangolare");
  const [pezzi, setPezzi] = React.useState(String(vano?.pezzi || 1));

  const valid = ambiente.trim().length > 0 && tipologia.trim().length > 0;

  const handleSave = () => {
    if (!valid) return;
    onSave({
      codice: codice.trim(),
      ambiente: ambiente.trim(),
      tipologia: tipologia.trim(),
      larghezza_mm: parseInt(larghezza, 10) || 1000,
      altezza_mm: parseInt(altezza, 10) || 1400,
      forma,
      pezzi: parseInt(pezzi, 10) || 1,
    });
  };

  return (
    <Modal onClose={onClose} title={vano ? `Modifica vano ${vano.codice}` : "Nuovo vano"} ramp={ramp} icon="commesse">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Field label="Codice" placeholder="es. V09" value={codice} onChange={setCodice} />
        <Field label="Ambiente *" placeholder="es. Soggiorno" value={ambiente} onChange={setAmbiente} />
      </div>
      <Field label="Tipologia *" placeholder="es. Finestra 2 ante" value={tipologia} onChange={setTipologia} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
        <Field label="Larghezza (mm)" value={larghezza} onChange={setLarghezza} type="number" />
        <Field label="Altezza (mm)" value={altezza} onChange={setAltezza} type="number" />
        <FieldSelect label="Forma" value={forma} onChange={(v) => setForma(v as any)} options={[
          { value: "rettangolare", label: "Rettangolare" },
          { value: "arco", label: "Arco" },
          { value: "trapezio", label: "Trapezio" },
        ]} />
        <Field label="Pezzi" value={pezzi} onChange={setPezzi} type="number" />
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 22 }}>
        <button onClick={onClose} style={btnSecondary}>Annulla</button>
        <button onClick={handleSave} disabled={!valid} style={{
          padding: "9px 18px",
          background: valid ? ramp[500] : TT.slate[200],
          color: "#fff",
          border: "none", borderRadius: 9,
          fontSize: 12, fontWeight: 700,
          cursor: valid ? "pointer" : "not-allowed",
          fontFamily: TT.fontFamily,
          boxShadow: valid ? `0 2px 8px ${ramp[300]}` : "none",
          opacity: valid ? 1 : 0.7,
        }}>
          {vano ? "Salva modifiche" : "Aggiungi vano"}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (s: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 9, fontWeight: 700, color: TT.text3,
        letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 5,
      }}>
        {label}
      </label>
      <input
        type={type || "text"}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 12px",
          background: TT.surface,
          border: `1px solid ${TT.borderStrong}`, borderRadius: 8,
          fontSize: 12, fontFamily: TT.fontFamily,
          color: TT.text1, outline: "none",
          boxSizing: "border-box",
          fontVariantNumeric: type === "number" ? "tabular-nums" : "normal",
        }}
      />
    </div>
  );
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (s: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 9, fontWeight: 700, color: TT.text3,
        letterSpacing: "0.4px", textTransform: "uppercase", marginBottom: 5,
      }}>
        {label}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        width: "100%", padding: "9px 12px",
        background: TT.surface,
        border: `1px solid ${TT.borderStrong}`, borderRadius: 8,
        fontSize: 12, fontFamily: TT.fontFamily,
        color: TT.text1, outline: "none",
        boxSizing: "border-box", cursor: "pointer",
      }}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: "9px 16px",
  background: TT.surface, color: TT.text2,
  border: `1px solid ${TT.borderStrong}`, borderRadius: 9,
  fontSize: 12, fontWeight: 700,
  cursor: "pointer", fontFamily: TT.fontFamily,
};

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
