"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const NAVY = "#1B3A5C";
const NAVY_DEEP = "#0F1F33";
const TEAL = "#28A0A0";
const TEAL_DARK = "#1a6b6b";
const RED = "#C73E1D";
const AMBER = "#E8B05C";
const GREEN = "#0F6E56";
const MUTED = "#5C6B7A";

// ============================================================
// SHELL CONDIVISA (clone leggero)
// ============================================================

interface ShellProps {
  title: string; kicker: string; onClose: () => void;
  children: React.ReactNode;
  ctaLabel?: string; ctaColor?: string; ctaDisabled?: boolean;
  onCta?: () => void; loading?: boolean;
  err?: string | null; ok?: string | null;
}

function Shell({ title, kicker, onClose, children, ctaLabel, ctaColor, ctaDisabled, onCta, loading, err, ok }: ShellProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 480, maxHeight: "92vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "slideUp 0.25s ease-out",
      }}>
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`,
          color: "#fff", padding: "14px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>{kicker}</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{title}</div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          {err && <Banner kind="err">{err}</Banner>}
          {ok && <Banner kind="ok">{ok}</Banner>}
          {children}
        </div>
        {ctaLabel && (
          <div style={{ padding: 14, background: "#fff", borderTop: "1px solid #E5EAF0" }}>
            <button onClick={onCta} disabled={ctaDisabled || loading} style={{
              width: "100%", padding: 14,
              background: ctaDisabled || loading ? "#D8DEE5" : (ctaColor || `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`),
              color: "#fff", borderRadius: 11, fontSize: 13, fontWeight: 800,
              letterSpacing: 0.6, textTransform: "uppercase", border: "none",
              cursor: ctaDisabled || loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Salvataggio..." : ctaLabel}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

function Banner({ kind, children }: { kind: "err" | "ok"; children: React.ReactNode }) {
  const cfg = kind === "err" ? { bg: "#FCE3E3", col: RED } : { bg: "#D5EBE0", col: GREEN };
  return (
    <div style={{
      padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
      background: cfg.bg, color: cfg.col, marginBottom: 10,
      fontWeight: 700, borderLeft: `3px solid ${cfg.col}`,
    }}>{children}</div>
  );
}

// ============================================================
// 1) MODAL NUOVA WAVE PICKING
// ============================================================

interface NuovaWaveProps {
  mag: any;
  onClose: () => void;
}

export function ModalNuovaWave({ mag, onClose }: NuovaWaveProps) {
  const [commesseDisp, setCommesseDisp] = useState<Array<{ id: string; code: string; cliente: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [operatore, setOperatore] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("commesse")
        .select("id, code, cliente")
        .in("fase", ["confermata", "acconto_pagato", "ordine", "produzione"])
        .order("code", { ascending: false })
        .limit(30);
      setCommesseDisp((data || []) as any);
    })();
  }, []);

  const toggle = (id: string) => {
    const ns = new Set(selected);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    setSelected(ns);
  };

  const conferma = async () => {
    if (selected.size === 0) { setErr("Seleziona almeno una commessa"); return; }
    setLoading(true); setErr(null);
    const r = await mag.creaWaveAi(Array.from(selected), operatore || undefined);
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Errore creazione wave"); return; }
    setOk(`Wave creata · stima ${r.tempo_stimato_min} min`);
    setTimeout(onClose, 1200);
  };

  return (
    <Shell
      kicker="NUOVA WAVE PICKING" title="Raggruppa commesse"
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel={`Crea wave · ${selected.size} commesse`}
      onCta={conferma} ctaDisabled={selected.size === 0}
    >
      <Field label="Operatore">
        <input value={operatore} onChange={(e) => setOperatore(e.target.value)} placeholder="es. Salvatore" style={inputStyle} />
      </Field>
      <Field label={`Commesse da prelevare insieme (${selected.size}/${commesseDisp.length})`}>
        <div style={{
          background: "#fff", borderRadius: 9, padding: 5,
          border: "1px solid #D8DEE5", maxHeight: 280, overflowY: "auto",
        }}>
          {commesseDisp.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11 }}>
              Nessuna commessa in produzione
            </div>
          ) : commesseDisp.map(c => (
            <div key={c.id} onClick={() => toggle(c.id)} style={{
              display: "flex", alignItems: "center", gap: 9,
              padding: "8px 10px", borderRadius: 7,
              background: selected.has(c.id) ? "rgba(40,160,160,0.1)" : "transparent",
              cursor: "pointer", marginBottom: 2,
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 6,
                background: selected.has(c.id) ? GREEN : "#fff",
                border: `1.5px solid ${selected.has(c.id) ? GREEN : "#D8DEE5"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {selected.has(c.id) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{c.code}</div>
                <div style={{ fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.cliente}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Field>

      {selected.size > 0 && (
        <div style={{
          background: "rgba(40,160,160,0.1)", border: `1.5px solid ${TEAL}`,
          borderRadius: 9, padding: 11, marginTop: 10, fontSize: 11.5,
        }}>
          <div style={{ color: TEAL, fontWeight: 800, marginBottom: 4 }}>AI ottimizza percorso</div>
          <div style={{ color: NAVY }}>
            Wave su <b>{selected.size}</b> commesse · stima <b>{Math.max(selected.size * 4, 8)} min</b>
          </div>
          <div style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>
            Risparmio vs picking singolo: <b style={{ color: GREEN }}>−{Math.max(selected.size * 4, 8)} min</b>
          </div>
        </div>
      )}
    </Shell>
  );
}

// ============================================================
// 2) MODAL REGISTRA CONTA CICLICA
// ============================================================

interface RegistraContaProps {
  mag: any;
  aziendaId: string;
  schedule?: { id: string; zona: string | null; abc_class: string | null };
  onClose: () => void;
}

export function ModalRegistraConta({ mag, aziendaId, schedule, onClose }: RegistraContaProps) {
  const articoli = (mag.articoli || []).filter((a: any) => !schedule?.abc_class || a.abc_class === schedule.abc_class);
  const [conte, setConte] = useState<Record<string, string>>({});
  const [operatore, setOperatore] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const setConta = (id: string, val: string) => setConte({ ...conte, [id]: val });

  // Calcolo diff e stato live
  const diffs = articoli.map((a: any) => {
    const contato = conte[a.id];
    if (contato === undefined || contato === "") return { id: a.id, art: a, contato: null, delta: 0, hasDiff: false };
    const c = parseFloat(contato);
    const d = c - a.scorta_attuale;
    return { id: a.id, art: a, contato: c, delta: d, hasDiff: d !== 0 };
  });

  const numContati = diffs.filter((d: any) => d.contato !== null).length;
  const numDiff = diffs.filter((d: any) => d.hasDiff).length;
  const deltaTotEur = diffs.reduce((s: number, d: any) => s + (d.contato !== null ? d.delta * (d.art.prezzo_acquisto || 0) : 0), 0);

  const conferma = async () => {
    if (numContati === 0) { setErr("Conta almeno un articolo"); return; }
    setLoading(true); setErr(null);

    // 1. Crea run
    const { data: run, error: e1 } = await supabase.from("cycle_count_runs").insert({
      azienda_id: aziendaId,
      schedule_id: schedule?.id || null,
      zona: schedule?.zona || (schedule?.abc_class ? `Zona ${schedule.abc_class}` : "Generica"),
      operatore_nome: operatore || null,
      stato: "completato",
      fine_at: new Date().toISOString(),
      n_articoli_contati: numContati,
      n_differenze: numDiff,
      delta_eur: deltaTotEur,
    }).select("id").single();

    if (e1 || !run) {
      setLoading(false);
      setErr(e1?.message || "Errore creazione conta");
      return;
    }

    // 2. Inserisci righe + rettifiche per quelle con delta
    const righe = diffs.filter((d: any) => d.contato !== null).map((d: any) => ({
      azienda_id: aziendaId,
      run_id: run.id,
      articolo_id: d.art.id,
      qta_sistema: d.art.scorta_attuale,
      qta_contata: d.contato,
      delta: d.delta,
      delta_eur: d.delta * (d.art.prezzo_acquisto || 0),
      causale: d.hasDiff ? "Differenza rilevata" : "Conferma scorta",
    }));
    await supabase.from("cycle_count_righe").insert(righe);

    // 3. Applica rettifiche per le differenze
    for (const d of diffs.filter((x: any) => x.hasDiff)) {
      await mag.rettifica(d.art.id, d.contato, `Conta ciclica ${schedule?.zona || ""}`);
    }

    // 4. Aggiorna schedule
    if (schedule?.id) {
      const next = new Date();
      next.setDate(next.getDate() + 7);
      await supabase.from("cycle_count_schedules").update({
        ultima_conta_at: new Date().toISOString(),
        prossima_conta_at: next.toISOString(),
      }).eq("id", schedule.id);
    }

    setLoading(false);
    setOk(`Contati ${numContati} art. · ${numDiff} differenze · ${deltaTotEur.toFixed(2)}€`);
    setTimeout(onClose, 1500);
  };

  return (
    <Shell
      kicker="CONTA CICLICA" title={schedule?.zona || `Zona ${schedule?.abc_class || "Generica"}`}
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel={`Conferma · ${numContati} contati`} ctaColor={`linear-gradient(180deg, ${AMBER}, #8B6926)`}
      onCta={conferma} ctaDisabled={numContati === 0}
    >
      <Field label="Operatore">
        <input value={operatore} onChange={(e) => setOperatore(e.target.value)} placeholder="es. Marco" style={inputStyle} />
      </Field>

      <Field label={`Articoli da contare (${numContati}/${articoli.length})`}>
        <div style={{
          background: "#fff", borderRadius: 9, padding: 8,
          border: "1px solid #D8DEE5", maxHeight: 300, overflowY: "auto",
        }}>
          {articoli.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: MUTED, fontSize: 11 }}>
              Nessun articolo da contare
            </div>
          ) : articoli.map((a: any) => {
            const d = diffs.find((x: any) => x.id === a.id);
            const hasDiff = d?.hasDiff;
            return (
              <div key={a.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 0",
                borderBottom: "1px solid #F1F4F7",
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.nome}
                  </div>
                  <div style={{ fontSize: 9.5, color: MUTED }}>
                    Sistema: <b style={{ color: NAVY }}>{a.scorta_attuale}</b> {a.unita_misura}
                  </div>
                </div>
                <input
                  type="number" inputMode="decimal"
                  value={conte[a.id] || ""}
                  onChange={(e) => setConta(a.id, e.target.value)}
                  placeholder={String(a.scorta_attuale)}
                  style={{
                    width: 70, padding: "7px 8px",
                    border: `1.5px solid ${hasDiff ? AMBER : "#D8DEE5"}`,
                    borderRadius: 6, fontSize: 13, fontWeight: 800,
                    color: hasDiff ? AMBER : NAVY, textAlign: "center",
                    outline: "none", background: hasDiff ? "#FBF0DC" : "#fff",
                  }}
                />
                {hasDiff && (
                  <div style={{
                    fontSize: 10, fontWeight: 800, minWidth: 40, textAlign: "right",
                    color: d.delta > 0 ? GREEN : RED,
                  }}>
                    {d.delta > 0 ? "+" : ""}{d.delta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Field>

      {numDiff > 0 && (
        <div style={{
          background: "#FBF0DC", border: `1.5px solid ${AMBER}`,
          borderRadius: 9, padding: 11, marginTop: 10, fontSize: 11.5,
        }}>
          <div style={{ color: "#8B6926", fontWeight: 800, marginBottom: 4 }}>{numDiff} differenze rilevate</div>
          <div style={{ color: NAVY }}>
            Impatto economico: <b style={{ color: deltaTotEur < 0 ? RED : GREEN, fontSize: 14 }}>
              {deltaTotEur > 0 ? "+" : ""}€ {deltaTotEur.toFixed(2)}
            </b>
          </div>
          <div style={{ color: MUTED, fontSize: 10, marginTop: 3 }}>
            Rettifiche automatiche su conferma
          </div>
        </div>
      )}
    </Shell>
  );
}

// ============================================================
// 3) MODAL NUOVO CROSS-DOCK MATCH
// ============================================================

interface NuovoXdockProps {
  mag: any;
  aziendaId: string;
  onClose: () => void;
}

export function ModalNuovoXdock({ mag, aziendaId, onClose }: NuovoXdockProps) {
  const [articoloId, setArticoloId] = useState("");
  const [commessaId, setCommessaId] = useState("");
  const [furgoneId, setFurgoneId] = useState("");
  const [qta, setQta] = useState(1);
  const [arrivo, setArrivo] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [commesse, setCommesse] = useState<Array<{ id: string; code: string; cliente: string }>>([]);
  const [furgoni, setFurgoni] = useState<Array<{ id: string; nome: string; targa: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [c, f] = await Promise.all([
        supabase.from("commesse").select("id, code, cliente")
          .in("fase", ["confermata", "acconto_pagato", "ordine", "produzione"])
          .order("code", { ascending: false }).limit(30),
        supabase.from("furgoni").select("id, nome, targa").eq("azienda_id", aziendaId),
      ]);
      setCommesse((c.data || []) as any);
      setFurgoni((f.data || []) as any);
    })();
  }, [aziendaId]);

  const conferma = async () => {
    if (!articoloId || !commessaId) { setErr("Articolo e commessa obbligatori"); return; }
    setLoading(true); setErr(null);
    const risparmioMin = 18;
    const risparmioEur = 4.2;
    const { error } = await supabase.from("cross_dock_match").insert({
      azienda_id: aziendaId,
      articolo_id: articoloId,
      commessa_destinazione_id: commessaId,
      furgone_destinazione_id: furgoneId || null,
      quantita: qta,
      arrivo_previsto_at: arrivo,
      stato: "pianificato",
      risparmio_min: risparmioMin,
      risparmio_eur: risparmioEur,
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setOk(`Cross-dock pianificato · risparmio ${risparmioMin}min`);
    await mag.reload();
    setTimeout(onClose, 1200);
  };

  return (
    <Shell
      kicker="NUOVO CROSS-DOCK" title="Match articolo → commessa"
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel="Pianifica cross-dock" onCta={conferma}
      ctaDisabled={!articoloId || !commessaId}
    >
      <Field label="Articolo in arrivo" required>
        <select value={articoloId} onChange={(e) => setArticoloId(e.target.value)} style={inputStyle}>
          <option value="">-- Scegli --</option>
          {mag.articoli.map((a: any) => (
            <option key={a.id} value={a.id}>{a.codice} · {a.nome}</option>
          ))}
        </select>
      </Field>
      <Field label="Quantità" required>
        <input type="number" value={qta} onChange={(e) => setQta(parseFloat(e.target.value) || 1)} style={inputStyle} />
      </Field>
      <Field label="Commessa destinazione" required>
        <select value={commessaId} onChange={(e) => setCommessaId(e.target.value)} style={inputStyle}>
          <option value="">-- Scegli --</option>
          {commesse.map(c => <option key={c.id} value={c.id}>{c.code} · {c.cliente}</option>)}
        </select>
      </Field>
      <Field label="Furgone destinazione">
        <select value={furgoneId} onChange={(e) => setFurgoneId(e.target.value)} style={inputStyle}>
          <option value="">-- Direttamente al cantiere --</option>
          {furgoni.map(f => <option key={f.id} value={f.id}>{f.nome} {f.targa}</option>)}
        </select>
      </Field>
      <Field label="Arrivo previsto">
        <input type="datetime-local" value={arrivo} onChange={(e) => setArrivo(e.target.value)} style={inputStyle} />
      </Field>

      <div style={{
        background: "rgba(40,160,160,0.1)", border: `1.5px solid ${TEAL}`,
        borderRadius: 9, padding: 11, marginTop: 10, fontSize: 11.5,
      }}>
        <div style={{ color: TEAL, fontWeight: 800, marginBottom: 4 }}>Risparmio stimato</div>
        <div style={{ color: NAVY }}>
          <b>−18 min</b> picking · <b>−€4.20</b> manodopera · salta scaffale
        </div>
      </div>
    </Shell>
  );
}

// ============================================================
// 4) MODAL NUOVO DOCK SLOT
// ============================================================

interface NuovoDockProps {
  mag: any;
  onClose: () => void;
}

export function ModalNuovoDockSlot({ mag, onClose }: NuovoDockProps) {
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [oraInizio, setOraInizio] = useState("09:00");
  const [tipo, setTipo] = useState<"in" | "out" | "reso" | "x_dock">("in");
  const [fornitore, setFornitore] = useState("");
  const [ddt, setDdt] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const conferma = async () => {
    if (!data || !oraInizio) { setErr("Data e ora obbligatorie"); return; }
    setLoading(true); setErr(null);
    const r = await mag.creaDockSlot({
      data_slot: data,
      ora_inizio: oraInizio,
      tipo,
      fornitore_nome: fornitore || undefined,
      ddt_descrizione: descrizione || undefined,
    });
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Errore creazione slot"); return; }
    setOk(`Slot ${data} ${oraInizio} prenotato`);
    setTimeout(onClose, 1200);
  };

  return (
    <Shell
      kicker="APPUNTAMENTO DOCK" title="Prenota slot scarico"
      onClose={onClose} err={err} ok={ok} loading={loading}
      ctaLabel="Prenota slot" onCta={conferma}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Data" required>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Ora" required>
          <input type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      <Field label="Tipo movimento" required>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 5 }}>
          {(["in","out","reso","x_dock"] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{
              padding: "9px 4px",
              background: tipo === t ? TEAL : "#fff",
              color: tipo === t ? "#fff" : MUTED,
              borderRadius: 7, fontSize: 10, fontWeight: 800,
              letterSpacing: 0.3, textTransform: "uppercase",
              border: `1px solid ${tipo === t ? TEAL : "#D8DEE5"}`,
              cursor: "pointer",
            }}>{t === "x_dock" ? "X-Dock" : t}</button>
          ))}
        </div>
      </Field>
      <Field label="Fornitore / cliente">
        <input value={fornitore} onChange={(e) => setFornitore(e.target.value)} placeholder="es. Maico" style={inputStyle} />
      </Field>
      <Field label="N° DDT">
        <input value={ddt} onChange={(e) => setDdt(e.target.value)} placeholder="es. 8721" style={inputStyle} />
      </Field>
      <Field label="Descrizione carico">
        <input value={descrizione} onChange={(e) => setDescrizione(e.target.value)} placeholder="es. Cerniere 80pz" style={inputStyle} />
      </Field>
    </Shell>
  );
}

// ============================================================
// HELPERS
// ============================================================

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 9.5, fontWeight: 800, color: NAVY,
        letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5,
      }}>
        {label} {required && <span style={{ color: RED }}>*</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  border: "1px solid #D8DEE5", borderRadius: 8,
  fontSize: 13, color: NAVY, fontWeight: 600,
  outline: "none", background: "#fff", fontFamily: "inherit",
};
