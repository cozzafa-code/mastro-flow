// ════════════════════════════════════════════════════════════
// SETTINGS · PIPELINE FASI · come mockup desktop
// ════════════════════════════════════════════════════════════
"use client";
import { useState } from "react";
import { usePipelineConfig, type FaseConfig, type AzioneCatalog } from "@/hooks/usePipelineConfig";

type Props = { azienda_id: string };

type TabKey = "email" | "checklist" | "documenti" | "messaggi" | "eventi" | "azioni" | "gate";

export default function SettingsPipeline({ azienda_id }: Props) {
  const { fasi, catalog, loading, saving, aggiornaFase, toggleAttiva, aggiungiFase, eliminaFase, resetDefault } = usePipelineConfig(azienda_id);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, TabKey>>({});
  const [filtroSistema, setFiltroSistema] = useState<"tutti" | "erp" | "messaggi" | "montaggi" | "automazioni">("tutti");

  if (loading) {
    return <div style={{ padding: 24, color: "#94A3B8" }}>Caricamento pipeline…</div>;
  }

  const fasiFiltrate = fasi.filter(f => {
    if (filtroSistema === "tutti") return true;
    if (filtroSistema === "erp") return f.sistema_erp;
    if (filtroSistema === "messaggi") return f.sistema_messaggi;
    if (filtroSistema === "montaggi") return f.sistema_montaggi;
    if (filtroSistema === "automazioni") return f.sistema_automazioni;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 14 }}>

      <div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F1B2D", margin: "0 0 4px" }}>Pipeline fasi</h2>
        <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>
          Personalizza il flusso di lavoro. Ogni fase controlla <b>ERP + Messaggi + Montaggi</b> automaticamente.
          {saving && <span style={{ color: "#1E3A5F", marginLeft: 6 }}>· Salvataggio…</span>}
        </p>
      </div>

      {/* Filtri sistema */}
      <div style={{ display: "flex", gap: 6, padding: "0 2px" }}>
        <FilterChip label="Tutti" sel={filtroSistema === "tutti"} onClick={() => setFiltroSistema("tutti")} bg="#F1F5F9" />
        <FilterChip label="ERP" sel={filtroSistema === "erp"} onClick={() => setFiltroSistema("erp")} bg="#DBEAFE" />
        <FilterChip label="Messaggi" sel={filtroSistema === "messaggi"} onClick={() => setFiltroSistema("messaggi")} bg="#D1FAE5" />
        <FilterChip label="Montaggi" sel={filtroSistema === "montaggi"} onClick={() => setFiltroSistema("montaggi")} bg="#FEF3C7" />
        <FilterChip label="Automazioni" sel={filtroSistema === "automazioni"} onClick={() => setFiltroSistema("automazioni")} bg="#EDE9FE" />
      </div>

      {/* Lista fasi */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fasiFiltrate.map(fase => (
          <FaseRow
            key={fase.id}
            fase={fase}
            catalog={catalog}
            expanded={expandedId === fase.id}
            activeTab={activeTab[fase.id] ?? "email"}
            onToggle={() => setExpandedId(prev => prev === fase.id ? null : fase.id)}
            onSetTab={(t) => setActiveTab(prev => ({ ...prev, [fase.id]: t }))}
            onPatch={(p) => aggiornaFase(fase.id, p)}
            onToggleAttiva={(v) => toggleAttiva(fase.id, v)}
            onElimina={() => eliminaFase(fase.id)}
          />
        ))}
      </div>

      {/* Aggiungi fase */}
      <button
        onClick={async () => {
          const nome = prompt("Nome nuova fase (es: Sopralluogo speciale)");
          if (!nome) return;
          const codice = nome.toLowerCase().replace(/[^a-z0-9_]+/g, "_").slice(0, 30);
          await aggiungiFase(codice, nome);
        }}
        style={{
          padding: "12px 14px", background: "#fff", border: "1.5px dashed #CBD5E1",
          borderRadius: 11, fontSize: 12, fontWeight: 700, color: "#1E3A5F", cursor: "pointer",
        }}
      >
        + Aggiungi fase personalizzata
      </button>

      <button
        onClick={resetDefault}
        style={{ padding: "8px 14px", background: "transparent", border: "none",
          fontSize: 11, fontWeight: 600, color: "#94A3B8", cursor: "pointer" }}
      >
        Ripristina predefinita
      </button>

      {/* Zona reset */}
      <div style={{
        background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 12, padding: 12,
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "#991B1B", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
          Zona reset
        </div>
        <p style={{ fontSize: 11, color: "#7F1D1D", margin: "0 0 10px" }}>
          Ricarica i 4 clienti demo con tutti i dati precompilati per testare il flusso completo.
        </p>
        <button onClick={() => alert("Funzione demo - in arrivo")} style={{
          width: "100%", padding: 10, background: "transparent", border: "1px solid #FCA5A5",
          borderRadius: 9, fontSize: 11, fontWeight: 800, color: "#991B1B", cursor: "pointer", letterSpacing: 0.4,
        }}>
          🔄 RICARICA DATI DEMO (4 clienti)
        </button>
      </div>
    </div>
  );
}

// ─── FaseRow ───────────────────────────────────────────────
function FaseRow({
  fase, catalog, expanded, activeTab, onToggle, onSetTab, onPatch, onToggleAttiva, onElimina,
}: {
  fase: FaseConfig;
  catalog: AzioneCatalog[];
  expanded: boolean;
  activeTab: TabKey;
  onToggle: () => void;
  onSetTab: (t: TabKey) => void;
  onPatch: (p: Partial<FaseConfig>) => void;
  onToggleAttiva: (v: boolean) => void;
  onElimina: () => void;
}) {
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "email", label: "Email" },
    { key: "documenti", label: "Documenti" },
    { key: "checklist", label: "Checklist" },
    { key: "messaggi", label: "Messaggi" },
    { key: "eventi", label: "Eventi" },
    { key: "azioni", label: "Azioni" },
    { key: "gate", label: "Gate" },
  ];

  return (
    <div style={{
      background: "#fff", border: "1px solid " + (expanded ? fase.colore : "#E2E8F0"),
      borderRadius: 11, overflow: "hidden",
    }}>
      {/* Header riga */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 11 }}>
        <button onClick={onToggle} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 14 }}>
          {expanded ? "▾" : "▸"}
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#0F1B2D", letterSpacing: -0.2, minWidth: 110 }}>
          {fase.icona} {fase.codice}
        </span>
        <span style={{ fontSize: 12, color: "#64748B", flex: 1 }}>
          {fase.nome}
        </span>

        {/* Indicatori sistemi attivi */}
        <div style={{ display: "flex", gap: 4 }}>
          {fase.sistema_erp && <Dot color="#3B82F6" tip="ERP" />}
          {fase.sistema_messaggi && <Dot color="#10B981" tip="Messaggi" />}
          {fase.sistema_montaggi && <Dot color="#F59E0B" tip="Montaggi" />}
          {fase.sistema_automazioni && <Dot color="#8B5CF6" tip="Auto" />}
        </div>

        {/* Toggle attiva */}
        <Toggle value={fase.attiva} onChange={onToggleAttiva} />
      </div>

      {/* Contenuto espanso */}
      {expanded && (
        <div style={{ borderTop: "1px solid #E2E8F0", padding: 14 }}>
          {/* Tab bar */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, borderBottom: "1px solid #E2E8F0" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => onSetTab(t.key)} style={{
                padding: "8px 12px", background: "transparent", border: "none",
                borderBottom: activeTab === t.key ? "2px solid " + fase.colore : "2px solid transparent",
                color: activeTab === t.key ? "#0F1B2D" : "#94A3B8",
                fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
              }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "email" && <TabEmail fase={fase} onPatch={onPatch} />}
          {activeTab === "documenti" && <TabDocumenti fase={fase} catalog={catalog} onPatch={onPatch} />}
          {activeTab === "checklist" && <TabChecklist fase={fase} onPatch={onPatch} />}
          {activeTab === "messaggi" && <TabMessaggi fase={fase} catalog={catalog} onPatch={onPatch} />}
          {activeTab === "eventi" && <TabEventi fase={fase} catalog={catalog} onPatch={onPatch} />}
          {activeTab === "azioni" && <TabAzioni fase={fase} catalog={catalog} onPatch={onPatch} />}
          {activeTab === "gate" && <TabGate fase={fase} onPatch={onPatch} />}

          {/* Sistemi attivi flag + elimina */}
          <div style={{ display: "flex", gap: 6, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
            <SystemToggle label="ERP" value={fase.sistema_erp} onChange={(v) => onPatch({ sistema_erp: v })} color="#3B82F6" />
            <SystemToggle label="Messaggi" value={fase.sistema_messaggi} onChange={(v) => onPatch({ sistema_messaggi: v })} color="#10B981" />
            <SystemToggle label="Montaggi" value={fase.sistema_montaggi} onChange={(v) => onPatch({ sistema_montaggi: v })} color="#F59E0B" />
            <SystemToggle label="Auto" value={fase.sistema_automazioni} onChange={(v) => onPatch({ sistema_automazioni: v })} color="#8B5CF6" />
            <div style={{ flex: 1 }} />
            <button onClick={onElimina} style={{
              padding: "6px 11px", background: "#fff", border: "1px solid #FCA5A5",
              color: "#991B1B", borderRadius: 7, fontSize: 10, fontWeight: 700, cursor: "pointer",
            }}>
              Elimina fase
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════════════

function TabEmail({ fase, onPatch }: { fase: FaseConfig; onPatch: (p: Partial<FaseConfig>) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>
        Template email automatica quando la commessa entra in questa fase.
      </p>
      <Field label="Oggetto">
        <input type="text" value={fase.email_oggetto ?? ""} onChange={(e) => onPatch({ email_oggetto: e.target.value })}
          placeholder="es: Conferma Sopralluogo - {{cliente}}" style={inputStyle} />
      </Field>
      <Field label="Corpo">
        <textarea value={fase.email_corpo ?? ""} onChange={(e) => onPatch({ email_corpo: e.target.value })}
          placeholder="Gentile cliente,..." rows={5} style={textareaStyle} />
      </Field>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
          <input type="checkbox" checked={fase.email_invio_auto} onChange={(e) => onPatch({ email_invio_auto: e.target.checked })}
            style={{ width: 16, height: 16, accentColor: "#1E3A5F" }} />
          <span style={{ fontSize: 11, color: "#0F1B2D", fontWeight: 600 }}>Invio auto</span>
        </label>
        <select value={fase.email_destinatario ?? "cliente"} onChange={(e) => onPatch({ email_destinatario: e.target.value })}
          style={{ ...inputStyle, width: 200 }}>
          <option value="cliente">Al cliente</option>
          <option value="azienda">All'azienda</option>
          <option value="fornitore">Al fornitore</option>
          <option value="team">Al team</option>
        </select>
      </div>
      <p style={{ fontSize: 9.5, color: "#94A3B8", margin: 0 }}>
        Variabili: <code>{`{{cliente}} {{commessa_code}} {{totale}} {{data}} {{indirizzo}}`}</code>
      </p>
    </div>
  );
}

function TabDocumenti({ fase, catalog, onPatch }: { fase: FaseConfig; catalog: AzioneCatalog[]; onPatch: (p: Partial<FaseConfig>) => void }) {
  const docs = catalog.filter(c => c.categoria === "documento");
  const sel = new Set(fase.documenti_generati ?? []);
  const richiesti = new Set(fase.documenti_richiesti_cliente ?? []);

  function toggleGenerati(codice: string) {
    const next = new Set(sel);
    next.has(codice) ? next.delete(codice) : next.add(codice);
    onPatch({ documenti_generati: Array.from(next) });
  }
  function toggleRichiesti(codice: string) {
    const next = new Set(richiesti);
    next.has(codice) ? next.delete(codice) : next.add(codice);
    onPatch({ documenti_richiesti_cliente: Array.from(next) });
  }

  // Raggruppa per sottocategoria
  const groups: Record<string, AzioneCatalog[]> = {};
  docs.forEach(d => {
    const k = d.sottocategoria ?? "altro";
    if (!groups[k]) groups[k] = [];
    groups[k].push(d);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>
        Documenti che il sistema genera o richiede al cliente in questa fase.
      </p>
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
            {cat.replace(/_/g, " ")}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {items.map(d => (
              <div key={d.codice} style={{
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 10px",
                display: "flex", alignItems: "center", gap: 9,
              }}>
                <span style={{ fontSize: 13 }}>{d.obbligatorio_per_legge ? "⚠️" : "📄"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.nome}
                  </div>
                </div>
                <Mini label="GEN" sel={sel.has(d.codice)} onClick={() => toggleGenerati(d.codice)} color="#1E3A5F" />
                <Mini label="REQ" sel={richiesti.has(d.codice)} onClick={() => toggleRichiesti(d.codice)} color="#F59E0B" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <p style={{ fontSize: 9.5, color: "#94A3B8", margin: 0 }}>
        <b>GEN</b> = il sistema genera questo doc · <b>REQ</b> = richiesto al cliente
      </p>
    </div>
  );
}

function TabChecklist({ fase, onPatch }: { fase: FaseConfig; onPatch: (p: Partial<FaseConfig>) => void }) {
  const items = fase.checklist_items ?? [];
  function update(i: number, v: Partial<{ testo: string; obblig: boolean }>) {
    const next = items.slice();
    next[i] = { ...next[i], ...v };
    onPatch({ checklist_items: next });
  }
  function add() {
    onPatch({ checklist_items: [...items, { id: String(Date.now()), testo: "Nuovo item", obblig: false }] });
  }
  function remove(i: number) {
    onPatch({ checklist_items: items.filter((_, idx) => idx !== i) });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={it.id ?? i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="text" value={it.testo} onChange={(e) => update(i, { testo: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#64748B", whiteSpace: "nowrap" }}>
            <input type="checkbox" checked={!!it.obblig} onChange={(e) => update(i, { obblig: e.target.checked })} style={{ accentColor: "#1E3A5F" }} />
            Obblig.
          </label>
          <button onClick={() => remove(i)} style={btnDelMini}>×</button>
        </div>
      ))}
      <button onClick={add} style={{
        padding: "8px 12px", background: "#F8FAFC", border: "1.5px dashed #CBD5E1",
        borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#1E3A5F", cursor: "pointer",
      }}>
        + Aggiungi item checklist
      </button>
    </div>
  );
}

function TabMessaggi({ fase, catalog, onPatch }: { fase: FaseConfig; catalog: AzioneCatalog[]; onPatch: (p: Partial<FaseConfig>) => void }) {
  const msgs = catalog.filter(c => c.categoria === "messaggio");
  const items = fase.messaggi_template ?? [];
  const sel = new Set(items.map(m => m.codice));

  function toggle(codice: string) {
    if (sel.has(codice)) {
      onPatch({ messaggi_template: items.filter(m => m.codice !== codice) });
    } else {
      onPatch({ messaggi_template: [...items, { codice, oggetto: "", corpo: "" }] });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Messaggi pronti che la fase suggerisce.</p>
      {msgs.map(m => (
        <CheckRow key={m.codice} sel={sel.has(m.codice)} onClick={() => toggle(m.codice)} icon={m.icona} label={m.nome} desc={m.descrizione ?? ""} color={m.colore} />
      ))}
    </div>
  );
}

function TabEventi({ fase, catalog, onPatch }: { fase: FaseConfig; catalog: AzioneCatalog[]; onPatch: (p: Partial<FaseConfig>) => void }) {
  const evs = catalog.filter(c => c.categoria === "evento");
  const sel = new Set(fase.eventi_calendario ?? []);
  function toggle(codice: string) {
    const next = new Set(sel);
    next.has(codice) ? next.delete(codice) : next.add(codice);
    onPatch({ eventi_calendario: Array.from(next) });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Eventi automatici creati in agenda quando la fase si attiva.</p>
      {evs.map(e => <CheckRow key={e.codice} sel={sel.has(e.codice)} onClick={() => toggle(e.codice)} icon={e.icona} label={e.nome} desc={e.descrizione ?? ""} color={e.colore} />)}
    </div>
  );
}

function TabAzioni({ fase, catalog, onPatch }: { fase: FaseConfig; catalog: AzioneCatalog[]; onPatch: (p: Partial<FaseConfig>) => void }) {
  const az = catalog.filter(c => c.categoria === "interno");
  const sel = new Set(fase.azioni_interne ?? []);
  function toggle(codice: string) {
    const next = new Set(sel);
    next.has(codice) ? next.delete(codice) : next.add(codice);
    onPatch({ azioni_interne: Array.from(next) });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Azioni automatiche eseguite dal sistema in questa fase.</p>
      {az.map(a => <CheckRow key={a.codice} sel={sel.has(a.codice)} onClick={() => toggle(a.codice)} icon={a.icona} label={a.nome} desc={a.descrizione ?? ""} color={a.colore} />)}
    </div>
  );
}

function TabGate({ fase, onPatch }: { fase: FaseConfig; onPatch: (p: Partial<FaseConfig>) => void }) {
  const conds = fase.gate_condizioni ?? [];
  function update(i: number, v: any) {
    const next = conds.slice();
    next[i] = { ...next[i], ...v };
    onPatch({ gate_condizioni: next });
  }
  function add() {
    onPatch({ gate_condizioni: [...conds, { campo: "", op: "not_null", valore: null, messaggio: "" }] });
  }
  function remove(i: number) {
    onPatch({ gate_condizioni: conds.filter((_, idx) => idx !== i) });
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Condizioni che devono essere vere per uscire da questa fase.</p>
      <label style={{ display: "flex", alignItems: "center", gap: 7, padding: 6 }}>
        <input type="checkbox" checked={fase.gate_blocca_avanzamento} onChange={(e) => onPatch({ gate_blocca_avanzamento: e.target.checked })}
          style={{ width: 16, height: 16, accentColor: "#EF4444" }} />
        <span style={{ fontSize: 11, color: "#0F1B2D", fontWeight: 700 }}>Blocca avanzamento se gate non passa</span>
      </label>
      {conds.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input type="text" value={c.campo} onChange={(e) => update(i, { campo: e.target.value })} placeholder="campo (es: firma_data)"
            style={{ ...inputStyle, width: 180 }} />
          <select value={c.op} onChange={(e) => update(i, { op: e.target.value })} style={{ ...inputStyle, width: 110 }}>
            <option value="not_null">non vuoto</option>
            <option value="=">=</option>
            <option value="!=">≠</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">≥</option>
            <option value="<=">≤</option>
          </select>
          <input type="text" value={c.valore ?? ""} onChange={(e) => update(i, { valore: e.target.value })} placeholder="valore"
            style={{ ...inputStyle, width: 100 }} />
          <input type="text" value={c.messaggio ?? ""} onChange={(e) => update(i, { messaggio: e.target.value })} placeholder="messaggio errore"
            style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
          <button onClick={() => remove(i)} style={btnDelMini}>×</button>
        </div>
      ))}
      <button onClick={add} style={{
        padding: "8px 12px", background: "#F8FAFC", border: "1.5px dashed #CBD5E1",
        borderRadius: 7, fontSize: 11, fontWeight: 700, color: "#1E3A5F", cursor: "pointer",
      }}>
        + Aggiungi condizione
      </button>
    </div>
  );
}

// ─── UTILS COMPONENTS ──────────────────────────────────────
function FilterChip({ label, sel, onClick, bg }: { label: string; sel: boolean; onClick: () => void; bg: string }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: sel ? bg : "#fff", color: sel ? "#0F1B2D" : "#64748B",
      border: sel ? "1px solid #CBD5E1" : "1px solid #E2E8F0",
      cursor: "pointer",
    }}>{label}</button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 38, height: 22, borderRadius: 999, padding: 2,
      background: value ? "#10B981" : "#CBD5E1", border: "none", cursor: "pointer",
      transition: "all .2s",
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        marginLeft: value ? 16 : 0, transition: "all .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

function Dot({ color, tip }: { color: string; tip: string }) {
  return <div title={tip} style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />;
}

function SystemToggle({ label, value, onChange, color }: { label: string; value: boolean; onChange: (v: boolean) => void; color: string }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      padding: "6px 11px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      background: value ? color : "#fff", color: value ? "#fff" : "#94A3B8",
      border: "1px solid " + (value ? color : "#CBD5E1"),
      cursor: "pointer", letterSpacing: 0.4,
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

function Mini({ label, sel, onClick, color }: { label: string; sel: boolean; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      padding: "3px 7px", borderRadius: 5, fontSize: 9, fontWeight: 800,
      background: sel ? color : "#fff", color: sel ? "#fff" : "#94A3B8",
      border: "1px solid " + (sel ? color : "#E2E8F0"),
      cursor: "pointer", letterSpacing: 0.4,
    }}>{label}</button>
  );
}

function CheckRow({ sel, onClick, icon, label, desc, color }: { sel: boolean; onClick: () => void; icon: string; label: string; desc: string; color: string }) {
  return (
    <div onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
      background: sel ? "#F8FAFC" : "#fff",
      border: "1px solid " + (sel ? color : "#E2E8F0"), borderRadius: 8, cursor: "pointer",
    }}>
      <input type="checkbox" checked={sel} readOnly style={{ width: 14, height: 14, accentColor: color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0F1B2D", lineHeight: 1.2 }}>{label}</div>
        {desc && <div style={{ fontSize: 9.5, color: "#64748B", marginTop: 2 }}>{desc}</div>}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "7px 9px",
  fontSize: 11,
  border: "1px solid #CBD5E1",
  borderRadius: 7,
  background: "#fff",
  fontFamily: "inherit",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: "inherit",
  resize: "vertical",
  width: "100%",
  background: "#FAFAF9",
};

const btnDelMini: React.CSSProperties = {
  padding: "4px 9px",
  background: "#fff",
  color: "#991B1B",
  border: "1px solid #FCA5A5",
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  width: 28,
  lineHeight: 1,
};
