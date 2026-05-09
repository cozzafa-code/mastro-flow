// ════════════════════════════════════════════════════════════
// SETTINGS PIPELINE · MOBILE · pollice-first
// Lista verticale fasi · fisarmonica · 7 tab scroll-x
// ════════════════════════════════════════════════════════════
"use client";
import { useState } from "react";
import { usePipelineConfig, type FaseConfig, type AzioneCatalog } from "@/hooks/usePipelineConfig";

type Props = { azienda_id: string; onClose?: () => void };
type TabKey = "email" | "documenti" | "checklist" | "messaggi" | "eventi" | "azioni" | "gate";

export default function SettingsPipelineMobile({ azienda_id, onClose }: Props) {
  const { fasi, catalog, loading, saving, aggiornaFase, toggleAttiva, aggiungiFase, eliminaFase, resetDefault } = usePipelineConfig(azienda_id);
  const [openId, setOpenId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, TabKey>>({});

  if (loading) {
    return (
      <div style={{ padding: 30, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
        Caricamento pipeline…
      </div>
    );
  }

  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh", paddingBottom: 80 }}>

      {/* Header */}
      <div style={{
        background: "#0F1B2D", color: "#fff", padding: "20px 18px 22px",
        borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
      }}>
        {onClose && (
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.13)", border: "none", color: "#fff",
            width: 32, height: 32, borderRadius: 9, fontSize: 18, marginBottom: 12, cursor: "pointer",
          }}>‹</button>
        )}
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, opacity: 0.7, textTransform: "uppercase", marginBottom: 3 }}>
          Configurazione
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: -0.6 }}>
          Pipeline fasi
        </h1>
        <p style={{ fontSize: 12, opacity: 0.75, margin: "6px 0 0", lineHeight: 1.4 }}>
          Personalizza il tuo flusso. Ogni fase controlla ERP + messaggi + montaggi.
          {saving && <span style={{ color: "#86EFAC", marginLeft: 6 }}>· salvataggio…</span>}
        </p>
      </div>

      {/* Lista fasi */}
      <div style={{ padding: "14px 12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {fasi.map(fase => (
          <FaseCardMobile
            key={fase.id}
            fase={fase}
            catalog={catalog}
            open={openId === fase.id}
            activeTab={activeTab[fase.id] ?? "email"}
            onToggle={() => setOpenId(prev => prev === fase.id ? null : fase.id)}
            onSetTab={(t) => setActiveTab(prev => ({ ...prev, [fase.id]: t }))}
            onPatch={(p) => aggiornaFase(fase.id, p)}
            onToggleAttiva={(v) => toggleAttiva(fase.id, v)}
            onElimina={() => eliminaFase(fase.id)}
          />
        ))}
      </div>

      {/* Bottoni footer */}
      <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={async () => {
            const nome = prompt("Nome nuova fase");
            if (!nome) return;
            const codice = nome.toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 30);
            await aggiungiFase(codice, nome);
          }}
          style={{
            padding: 14, background: "#1E3A5F", color: "#fff", border: "none",
            borderRadius: 12, fontSize: 13, fontWeight: 800, letterSpacing: 0.4,
            textTransform: "uppercase", cursor: "pointer",
            boxShadow: "0 3px 0 0 #0F1B2D",
          }}
        >
          + Aggiungi fase personalizzata
        </button>
        <button
          onClick={resetDefault}
          style={{
            padding: 12, background: "transparent", border: "1px dashed #CBD5E1",
            borderRadius: 12, fontSize: 11, fontWeight: 700, color: "#64748B", cursor: "pointer",
          }}
        >
          Ripristina pipeline predefinita
        </button>
      </div>
    </div>
  );
}

// ─── FASE CARD ─────────────────────────────────────────────
function FaseCardMobile({
  fase, catalog, open, activeTab, onToggle, onSetTab, onPatch, onToggleAttiva, onElimina,
}: {
  fase: FaseConfig;
  catalog: AzioneCatalog[];
  open: boolean;
  activeTab: TabKey;
  onToggle: () => void;
  onSetTab: (t: TabKey) => void;
  onPatch: (p: Partial<FaseConfig>) => void;
  onToggleAttiva: (v: boolean) => void;
  onElimina: () => void;
}) {
  const tabs: Array<{ key: TabKey; label: string; n?: number }> = [
    { key: "email", label: "Email" },
    { key: "documenti", label: "Doc", n: (fase.documenti_generati ?? []).length },
    { key: "checklist", label: "Check", n: (fase.checklist_items ?? []).length },
    { key: "messaggi", label: "Msg", n: (fase.messaggi_template ?? []).length },
    { key: "eventi", label: "Eventi", n: (fase.eventi_calendario ?? []).length },
    { key: "azioni", label: "Azioni", n: (fase.azioni_interne ?? []).length },
    { key: "gate", label: "Gate", n: (fase.gate_condizioni ?? []).length },
  ];

  return (
    <div style={{
      background: "#fff", borderRadius: 14, overflow: "hidden",
      border: open ? `2px solid ${fase.colore}` : "1px solid #E2E8F0",
      transition: "border .15s",
    }}>
      {/* Header tap */}
      <div onClick={onToggle} style={{
        padding: "13px 14px", display: "flex", alignItems: "center", gap: 11, cursor: "pointer",
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, background: fase.colore,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          color: "#fff", fontWeight: 900, fontSize: 14,
        }}>
          {fase.ordine}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2, lineHeight: 1.15 }}>
            {fase.nome}
          </div>
          <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 2, fontWeight: 600 }}>
            {fase.codice} · {(fase.documenti_generati ?? []).length}d · {(fase.checklist_items ?? []).length}c · {(fase.azioni_interne ?? []).length}a
          </div>
        </div>
        <ToggleBig value={fase.attiva} onChange={onToggleAttiva} />
        <span style={{ color: "#94A3B8", fontSize: 14, marginLeft: 4 }}>
          {open ? "▾" : "▸"}
        </span>
      </div>

      {/* Body espanso */}
      {open && (
        <div style={{ borderTop: "1px solid #F1F5F9" }}>

          {/* Tab bar scroll-x */}
          <div style={{
            display: "flex", gap: 4, padding: "10px 12px",
            overflowX: "auto", scrollSnapType: "x mandatory",
            background: "#FAFAF9", borderBottom: "1px solid #F1F5F9",
            WebkitOverflowScrolling: "touch",
          }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => onSetTab(t.key)} style={{
                flexShrink: 0, scrollSnapAlign: "start",
                padding: "8px 13px", borderRadius: 8, border: "none",
                background: activeTab === t.key ? fase.colore : "#fff",
                color: activeTab === t.key ? "#fff" : "#64748B",
                fontSize: 11, fontWeight: 700, letterSpacing: 0.3, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                {t.label}
                {t.n !== undefined && t.n > 0 && (
                  <span style={{
                    background: activeTab === t.key ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                    padding: "1px 5px", borderRadius: 4, fontSize: 9, fontWeight: 800,
                    color: activeTab === t.key ? "#fff" : "#0F1B2D",
                  }}>{t.n}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 14 }}>
            {activeTab === "email" && <TabEmailMob fase={fase} onPatch={onPatch} />}
            {activeTab === "documenti" && <TabDocsMob fase={fase} catalog={catalog} onPatch={onPatch} />}
            {activeTab === "checklist" && <TabCheckMob fase={fase} onPatch={onPatch} />}
            {activeTab === "messaggi" && <TabSelectorMob fase={fase} catalog={catalog} field="messaggi_template" categoria="messaggio" onPatch={onPatch} />}
            {activeTab === "eventi" && <TabSelectorMob fase={fase} catalog={catalog} field="eventi_calendario" categoria="evento" onPatch={onPatch} />}
            {activeTab === "azioni" && <TabSelectorMob fase={fase} catalog={catalog} field="azioni_interne" categoria="interno" onPatch={onPatch} />}
            {activeTab === "gate" && <TabGateMob fase={fase} onPatch={onPatch} />}
          </div>

          {/* Sistema flags + delete */}
          <div style={{
            padding: "10px 14px 14px", display: "flex", gap: 5, flexWrap: "wrap",
            borderTop: "1px solid #F1F5F9",
          }}>
            <SysChip label="ERP" v={fase.sistema_erp} on={(b) => onPatch({ sistema_erp: b })} c="#3B82F6" />
            <SysChip label="Msg" v={fase.sistema_messaggi} on={(b) => onPatch({ sistema_messaggi: b })} c="#10B981" />
            <SysChip label="Mtg" v={fase.sistema_montaggi} on={(b) => onPatch({ sistema_montaggi: b })} c="#F59E0B" />
            <SysChip label="Auto" v={fase.sistema_automazioni} on={(b) => onPatch({ sistema_automazioni: b })} c="#8B5CF6" />
            <div style={{ flex: 1 }} />
            <button onClick={onElimina} style={{
              padding: "6px 11px", background: "#FEF2F2", border: "1px solid #FCA5A5",
              color: "#991B1B", borderRadius: 7, fontSize: 10, fontWeight: 800, cursor: "pointer",
              letterSpacing: 0.3,
            }}>
              Elimina
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB EMAIL ─────────────────────────────────────────
function TabEmailMob({ fase, onPatch }: { fase: FaseConfig; onPatch: (p: Partial<FaseConfig>) => void }) {
  const variabili = [
    { codice: "{{cliente}}", label: "Cliente" },
    { codice: "{{commessa_code}}", label: "N. Commessa" },
    { codice: "{{totale}}", label: "Totale" },
    { codice: "{{data}}", label: "Data oggi" },
    { codice: "{{data_sopralluogo}}", label: "Data sopralluogo" },
    { codice: "{{indirizzo}}", label: "Indirizzo" },
    { codice: "{{azienda_nome}}", label: "Mia azienda" },
  ];

  function inserisci(codice: string, campo: "oggetto" | "corpo") {
    if (campo === "oggetto") {
      const cur = fase.email_oggetto ?? "";
      onPatch({ email_oggetto: cur + (cur && !cur.endsWith(" ") ? " " : "") + codice });
    } else {
      const cur = fase.email_corpo ?? "";
      onPatch({ email_corpo: cur + (cur && !cur.endsWith("\n") && !cur.endsWith(" ") ? " " : "") + codice });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Field label="Oggetto">
        <input type="text" value={fase.email_oggetto ?? ""} onChange={(e) => onPatch({ email_oggetto: e.target.value })}
          placeholder="es: Conferma sopralluogo - {{cliente}}"
          style={inputBig} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {variabili.map(v => (
            <button key={v.codice} onClick={() => inserisci(v.codice, "oggetto")} style={chipVar}>
              + {v.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Corpo">
        <textarea value={fase.email_corpo ?? ""} onChange={(e) => onPatch({ email_corpo: e.target.value })}
          placeholder="Gentile cliente, ..." rows={6} style={textBig} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {variabili.map(v => (
            <button key={v.codice} onClick={() => inserisci(v.codice, "corpo")} style={chipVar}>
              + {v.label}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Destinatario">
        <select value={fase.email_destinatario ?? "cliente"} onChange={(e) => onPatch({ email_destinatario: e.target.value })}
          style={inputBig}>
          <option value="cliente">Al cliente</option>
          <option value="azienda">All\'azienda</option>
          <option value="fornitore">Al fornitore</option>
          <option value="team">Al team</option>
        </select>
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 0", cursor: "pointer" }}>
        <input type="checkbox" checked={fase.email_invio_auto} onChange={(e) => onPatch({ email_invio_auto: e.target.checked })}
          style={{ width: 22, height: 22, accentColor: "#1E3A5F" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F1B2D" }}>Invio automatico</span>
      </label>
      <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 9, padding: 10, fontSize: 10.5, color: "#1E40AF", lineHeight: 1.4 }}>
        <b>Anteprima per cliente "Mario Rossi":</b><br/>
        <span style={{ fontFamily: "monospace", fontSize: 10 }}>
          {(fase.email_oggetto ?? "").replace(/\{\{cliente\}\}/g, "Mario Rossi").replace(/\{\{commessa_code\}\}/g, "S-0042").replace(/\{\{data_sopralluogo\}\}/g, "12/05/2026")}
        </span>
      </div>
    </div>
  );
}

// ─── TAB DOCUMENTI ─────────────────────────────────────
function TabDocsMob({ fase, catalog, onPatch }: { fase: FaseConfig; catalog: AzioneCatalog[]; onPatch: (p: Partial<FaseConfig>) => void }) {
  const docs = catalog.filter(c => c.categoria === "documento");
  const gen = new Set(fase.documenti_generati ?? []);
  const req = new Set(fase.documenti_richiesti_cliente ?? []);

  function toggleGen(c: string) { const n = new Set(gen); n.has(c) ? n.delete(c) : n.add(c); onPatch({ documenti_generati: Array.from(n) }); }
  function toggleReq(c: string) { const n = new Set(req); n.has(c) ? n.delete(c) : n.add(c); onPatch({ documenti_richiesti_cliente: Array.from(n) }); }

  // Raggruppa per sottocategoria
  const groups: Record<string, AzioneCatalog[]> = {};
  docs.forEach(d => { const k = d.sottocategoria ?? "altro"; if (!groups[k]) groups[k] = []; groups[k].push(d); });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, fontSize: 10, fontWeight: 700, color: "#64748B" }}>
        <span><b style={{ color: "#1E3A5F" }}>GEN</b> = sistema lo genera</span>
        <span><b style={{ color: "#F59E0B" }}>REQ</b> = chiedi al cliente</span>
      </div>
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", margin: "6px 0 7px" }}>
            {cat.replace(/_/g, " ")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {items.map(d => (
              <div key={d.codice} style={{
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 9,
                padding: "9px 10px", display: "flex", alignItems: "center", gap: 9,
              }}>
                <span style={{ fontSize: 14 }}>{d.obbligatorio_per_legge ? "⚠️" : "📄"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.nome}
                  </div>
                </div>
                <PillToggle label="GEN" v={gen.has(d.codice)} on={() => toggleGen(d.codice)} c="#1E3A5F" />
                <PillToggle label="REQ" v={req.has(d.codice)} on={() => toggleReq(d.codice)} c="#F59E0B" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB CHECKLIST ─────────────────────────────────────
function TabCheckMob({ fase, onPatch }: { fase: FaseConfig; onPatch: (p: Partial<FaseConfig>) => void }) {
  const items = fase.checklist_items ?? [];
  function update(i: number, v: any) { const n = items.slice(); n[i] = { ...n[i], ...v }; onPatch({ checklist_items: n }); }
  function add() { onPatch({ checklist_items: [...items, { id: String(Date.now()), testo: "Nuovo item", obblig: false }] }); }
  function remove(i: number) { onPatch({ checklist_items: items.filter((_, idx) => idx !== i) }); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={it.id ?? i} style={{
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 10,
          display: "flex", flexDirection: "column", gap: 7,
        }}>
          <input type="text" value={it.testo} onChange={(e) => update(i, { testo: e.target.value })}
            placeholder="Cosa fare in questa fase…" style={inputBig} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", fontSize: 11 }}>
              <input type="checkbox" checked={!!it.obblig} onChange={(e) => update(i, { obblig: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#1E3A5F" }} />
              Obbligatorio
            </label>
            <button onClick={() => remove(i)} style={{
              padding: "5px 11px", background: "#FEF2F2", color: "#991B1B",
              border: "1px solid #FCA5A5", borderRadius: 6, fontSize: 11, fontWeight: 800, cursor: "pointer",
            }}>Rimuovi</button>
          </div>
        </div>
      ))}
      <button onClick={add} style={{
        padding: 12, background: "#F8FAFC", border: "1.5px dashed #CBD5E1",
        borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#1E3A5F", cursor: "pointer",
      }}>
        + Aggiungi item checklist
      </button>
    </div>
  );
}

// ─── TAB SELECTOR (messaggi/eventi/azioni) ──────────────
function TabSelectorMob({
  fase, catalog, field, categoria, onPatch,
}: {
  fase: FaseConfig;
  catalog: AzioneCatalog[];
  field: "eventi_calendario" | "azioni_interne" | "messaggi_template";
  categoria: "messaggio" | "evento" | "interno";
  onPatch: (p: Partial<FaseConfig>) => void;
}) {
  const items = catalog.filter(c => c.categoria === categoria);
  const isMessaggi = field === "messaggi_template";
  const sel = isMessaggi
    ? new Set((fase.messaggi_template ?? []).map(m => m.codice))
    : new Set(fase[field] as string[]);

  function toggle(codice: string) {
    if (isMessaggi) {
      const arr = fase.messaggi_template ?? [];
      if (sel.has(codice)) {
        onPatch({ messaggi_template: arr.filter(m => m.codice !== codice) });
      } else {
        onPatch({ messaggi_template: [...arr, { codice }] });
      }
    } else {
      const next = new Set(sel);
      next.has(codice) ? next.delete(codice) : next.add(codice);
      onPatch({ [field]: Array.from(next) } as any);
    }
  }

  // Raggruppa
  const groups: Record<string, AzioneCatalog[]> = {};
  items.forEach(d => { const k = d.sottocategoria ?? "altro"; if (!groups[k]) groups[k] = []; groups[k].push(d); });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#94A3B8", letterSpacing: 1, textTransform: "uppercase", margin: "6px 0 6px" }}>
            {cat.replace(/_/g, " ")}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {list.map(a => {
              const isOn = sel.has(a.codice);
              return (
                <div key={a.codice} onClick={() => toggle(a.codice)} style={{
                  background: isOn ? `${a.colore}10` : "#fff",
                  border: `1.5px solid ${isOn ? a.colore : "#E2E8F0"}`,
                  borderRadius: 10, padding: "10px 11px",
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: isOn ? a.colore : "#F1F5F9",
                    color: isOn ? "#fff" : "#94A3B8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, flexShrink: 0,
                  }}>
                    {isOn ? "✓" : "·"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2 }}>{a.nome}</div>
                    {a.descrizione && (
                      <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 2, lineHeight: 1.3 }}>{a.descrizione}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB GATE ──────────────────────────────────────────
function TabGateMob({ fase, onPatch }: { fase: FaseConfig; onPatch: (p: Partial<FaseConfig>) => void }) {
  const conds = fase.gate_condizioni ?? [];
  function update(i: number, v: any) { const n = conds.slice(); n[i] = { ...n[i], ...v }; onPatch({ gate_condizioni: n }); }
  function add() { onPatch({ gate_condizioni: [...conds, { campo: "", op: "not_null", valore: null, messaggio: "" }] }); }
  function remove(i: number) { onPatch({ gate_condizioni: conds.filter((_, idx) => idx !== i) }); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <label style={{
        display: "flex", alignItems: "center", gap: 11, padding: 12,
        background: fase.gate_blocca_avanzamento ? "#FEF2F2" : "#FAFAF9",
        border: `1.5px solid ${fase.gate_blocca_avanzamento ? "#FCA5A5" : "#E2E8F0"}`,
        borderRadius: 10, cursor: "pointer",
      }}>
        <input type="checkbox" checked={fase.gate_blocca_avanzamento} onChange={(e) => onPatch({ gate_blocca_avanzamento: e.target.checked })}
          style={{ width: 22, height: 22, accentColor: "#EF4444" }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#0F1B2D", flex: 1 }}>
          Blocca avanzamento se condizioni non passano
        </span>
      </label>
      {conds.map((c, i) => (
        <div key={i} style={{
          background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: 11,
          display: "flex", flexDirection: "column", gap: 7,
        }}>
          <Field label="Campo da controllare">
            <input type="text" value={c.campo} onChange={(e) => update(i, { campo: e.target.value })}
              placeholder="firma_data" style={inputBig} />
          </Field>
          <Field label="Operatore">
            <select value={c.op} onChange={(e) => update(i, { op: e.target.value })} style={inputBig}>
              <option value="not_null">non vuoto</option>
              <option value="=">uguale a</option>
              <option value="!=">diverso da</option>
              <option value=">">maggiore di</option>
              <option value="<">minore di</option>
            </select>
          </Field>
          {c.op !== "not_null" && (
            <Field label="Valore">
              <input type="text" value={c.valore ?? ""} onChange={(e) => update(i, { valore: e.target.value })}
                style={inputBig} />
            </Field>
          )}
          <Field label="Messaggio errore">
            <input type="text" value={c.messaggio ?? ""} onChange={(e) => update(i, { messaggio: e.target.value })}
              placeholder="Cliente deve firmare" style={inputBig} />
          </Field>
          <button onClick={() => remove(i)} style={{
            padding: "8px 12px", background: "#FEF2F2", color: "#991B1B",
            border: "1px solid #FCA5A5", borderRadius: 7, fontSize: 11, fontWeight: 800, cursor: "pointer",
            alignSelf: "flex-start",
          }}>Rimuovi condizione</button>
        </div>
      ))}
      <button onClick={add} style={{
        padding: 12, background: "#F8FAFC", border: "1.5px dashed #CBD5E1",
        borderRadius: 10, fontSize: 12, fontWeight: 700, color: "#1E3A5F", cursor: "pointer",
      }}>
        + Aggiungi condizione gate
      </button>
    </div>
  );
}

// ─── UTILS ─────────────────────────────────────────────
function ToggleBig({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onChange(!value); }} style={{
      width: 48, height: 28, borderRadius: 999, padding: 3,
      background: value ? "#10B981" : "#CBD5E1", border: "none", cursor: "pointer",
      transition: "background .2s", flexShrink: 0,
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%", background: "#fff",
        marginLeft: value ? 20 : 0, transition: "margin .2s",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function SysChip({ label, v, on, c }: { label: string; v: boolean; on: (v: boolean) => void; c: string }) {
  return (
    <button onClick={() => on(!v)} style={{
      padding: "6px 11px", borderRadius: 999, fontSize: 10, fontWeight: 800,
      background: v ? c : "#fff", color: v ? "#fff" : "#94A3B8",
      border: `1px solid ${v ? c : "#CBD5E1"}`,
      cursor: "pointer", letterSpacing: 0.5,
    }}>{label}</button>
  );
}

function PillToggle({ label, v, on, c }: { label: string; v: boolean; on: () => void; c: string }) {
  return (
    <button onClick={on} style={{
      padding: "5px 9px", borderRadius: 6, fontSize: 9.5, fontWeight: 900,
      background: v ? c : "#fff", color: v ? "#fff" : "#94A3B8",
      border: `1px solid ${v ? c : "#E2E8F0"}`,
      cursor: "pointer", letterSpacing: 0.5, flexShrink: 0,
    }}>{label}</button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 5 }}>
        {label}
      </div>
      {children}
    </label>
  );
}

const inputBig: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  fontSize: 13,
  border: "1px solid #CBD5E1",
  borderRadius: 9,
  background: "#fff",
  fontFamily: "inherit",
  color: "#0F1B2D",
  WebkitAppearance: "none",
};

const textBig: React.CSSProperties = {
  ...inputBig,
  fontFamily: "inherit",
  resize: "vertical",
  minHeight: 90,
  background: "#FAFAF9",
};
