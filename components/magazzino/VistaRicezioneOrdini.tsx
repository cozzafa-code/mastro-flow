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

interface Props {
  aziendaId: string;
  mag: any;
}

interface OrdineRow {
  id: string;
  fornitore_id: string;
  fornitore_nome: string;
  data_ordine: string;
  consegna_prevista: string | null;
  stato: string;
  totale_euro: number;
  n_righe: number;
  n_righe_arrivate: number;
  n_righe_pending: number;
  stato_ricezione: string;
  ddt_numero: string | null;
}

export default function VistaRicezioneOrdini({ aziendaId, mag }: Props) {
  const [ordini, setOrdini] = useState<OrdineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openRic, setOpenRic] = useState<OrdineRow | null>(null);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("v_ordini_fornitore_full")
      .select("*")
      .eq("azienda_id", aziendaId)
      .in("stato", ["inviato","confermato","in_transito","arrivato","parziale"])
      .order("consegna_prevista", { ascending: true, nullsFirst: false });
    setOrdini((data || []) as any);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [aziendaId]);

  if (loading) return <Loader />;

  const totDaRicevere = ordini.length;
  const totRigheDaRicevere = ordini.reduce((s, o) => s + (o.n_righe_pending || 0), 0);
  const valoreDaRicevere = ordini.reduce((s, o) => s + (o.totale_euro || 0), 0);

  return (
    <div>
      <div style={{
        background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
        borderRadius: 13, padding: "12px 14px", marginBottom: 9,
      }}>
        <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>
          IN ATTESA CONSEGNA
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{totDaRicevere} ordini</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
          {totRigheDaRicevere} righe pending · € {valoreDaRicevere.toFixed(0)}
        </div>
      </div>

      {ordini.length === 0 ? (
        <div style={{
          background: "#fff", borderRadius: 13, padding: 30,
          textAlign: "center", color: MUTED, fontSize: 12,
        }}>
          Nessun ordine in attesa di consegna
        </div>
      ) : ordini.map(o => <CardOrdine key={o.id} o={o} onOpen={() => setOpenRic(o)} />)}

      {openRic && (
        <ModalRicezioneDDT
          ordine={openRic}
          aziendaId={aziendaId}
          onClose={() => setOpenRic(null)}
          onDone={() => { setOpenRic(null); reload(); mag.reload(); }}
        />
      )}
    </div>
  );
}

// ============================================================
// CARD ORDINE
// ============================================================

function CardOrdine({ o, onOpen }: any) {
  const inRitardo = o.consegna_prevista && new Date(o.consegna_prevista) < new Date() && o.n_righe_pending > 0;
  const cfg = inRitardo ? { col: RED, lbl: "IN RITARDO" } :
    o.stato_ricezione === "parziale" ? { col: AMBER, lbl: "PARZIALE" } :
    o.stato === "arrivato" ? { col: AMBER, lbl: "DA VERIFICARE" } :
    { col: TEAL, lbl: o.stato.toUpperCase() };
  
  return (
    <div onClick={onOpen} style={{
      background: "#fff", borderRadius: 12, padding: "11px 13px",
      marginBottom: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      borderLeft: `3px solid ${cfg.col}`, cursor: "pointer",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              background: `${cfg.col}20`, color: cfg.col,
              padding: "2px 7px", borderRadius: 5,
              fontSize: 8.5, fontWeight: 800, letterSpacing: 0.3,
            }}>{cfg.lbl}</span>
            <span style={{ fontSize: 9.5, color: MUTED, fontFamily: "SF Mono, monospace" }}>
              #{o.id.substring(0, 8)}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: NAVY, marginTop: 4 }}>{o.fornitore_nome}</div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2 }}>
            Consegna prevista: {o.consegna_prevista ? new Date(o.consegna_prevista).toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) : "—"}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <Pill bg="#F1F4F7" col={NAVY} txt={`${o.n_righe} righe`} />
            {o.n_righe_arrivate > 0 && <Pill bg="#D5EBE0" col={GREEN} txt={`${o.n_righe_arrivate} arr.`} />}
            {o.n_righe_pending > 0 && <Pill bg="#FBF0DC" col="#8B6926" txt={`${o.n_righe_pending} pending`} />}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: NAVY }}>€ {(o.totale_euro || 0).toFixed(0)}</div>
          <button style={{
            marginTop: 6, padding: "5px 10px",
            background: TEAL, color: "#fff", border: "none",
            borderRadius: 5, fontSize: 9.5, fontWeight: 800,
            letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer",
          }}>RICEVI ▶</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL RICEZIONE DDT - riga per riga
// ============================================================

interface ModalProps {
  ordine: OrdineRow;
  aziendaId: string;
  onClose: () => void;
  onDone: () => void;
}

function ModalRicezioneDDT({ ordine, aziendaId, onClose, onDone }: ModalProps) {
  const [righe, setRighe] = useState<any[]>([]);
  const [ddtNumero, setDdtNumero] = useState(ordine.ddt_numero || "");
  const [ddtData, setDdtData] = useState(new Date().toISOString().split("T")[0]);
  const [notaGenerale, setNotaGenerale] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ordini_fornitore_righe")
        .select("*")
        .eq("ordine_id", ordine.id)
        .order("ordine_riga");
      const mapped = (data || []).map((r: any) => ({
        ...r,
        qta_inserita: r.quantita_arrivata || r.quantita_ordinata,
        prezzo_inserito: r.prezzo_unitario,
        check: r.stato_riga === "arrivata",
        check_parz: r.stato_riga === "parziale",
        check_manc: r.stato_riga === "mancante",
      }));
      setRighe(mapped);
      setLoading(false);
    })();
  }, [ordine.id]);

  const updateRiga = (id: string, field: string, value: any) => {
    setRighe(prev => prev.map(r => {
      if (r.id !== id) return r;
      const upd = { ...r, [field]: value };
      // Se cambia check_*, resetta gli altri 2
      if (field === "check") { upd.check_parz = false; upd.check_manc = false; if (value) upd.qta_inserita = r.quantita_ordinata; }
      if (field === "check_parz") { upd.check = false; upd.check_manc = false; }
      if (field === "check_manc") { upd.check = false; upd.check_parz = false; if (value) upd.qta_inserita = 0; }
      return upd;
    }));
  };

  const segnaTutteOk = () => {
    setRighe(prev => prev.map(r => ({
      ...r, check: true, check_parz: false, check_manc: false, qta_inserita: r.quantita_ordinata,
    })));
  };

  const conferma = async () => {
    setSaving(true); setErr(null);
    try {
      // Per ogni riga modificata chiama RPC ordine_ricevi_riga
      for (const r of righe) {
        if (!r.check && !r.check_parz && !r.check_manc) continue;
        const qta = r.check_manc ? 0 : (r.qta_inserita || 0);
        const { error } = await supabase.rpc("ordine_ricevi_riga", {
          p_riga_id: r.id,
          p_qta_arrivata: qta,
          p_prezzo_effettivo: r.prezzo_inserito,
          p_note: null,
        });
        if (error) throw new Error(error.message);
      }
      
      // Chiudi ricezione
      const { error: errChiudi } = await supabase.rpc("ordine_chiudi_ricezione", {
        p_ordine_id: ordine.id,
        p_ddt_numero: ddtNumero || null,
        p_ddt_data: ddtData || null,
        p_note: notaGenerale || null,
      });
      if (errChiudi) throw new Error(errChiudi.message);
      
      onDone();
    } catch (e: any) {
      setErr(e.message || "Errore ricezione");
      setSaving(false);
    }
  };

  const nSel = righe.filter(r => r.check || r.check_parz || r.check_manc).length;
  const totEffettivo = righe.reduce((s, r) => {
    if (!r.check && !r.check_parz) return s;
    return s + (r.qta_inserita || 0) * (r.prezzo_inserito || 0);
  }, 0);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(15,31,51,0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#F1F4F7", borderTopLeftRadius: 20, borderTopRightRadius: 20,
        width: "100%", maxWidth: 520, maxHeight: "95vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(180deg, ${NAVY}, ${NAVY_DEEP})`, color: "#fff",
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: TEAL, letterSpacing: 1.2, fontWeight: 800, textTransform: "uppercase" }}>
                RICEVI DDT
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{ordine.fornitore_nome}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
                {righe.length} righe da verificare
              </div>
            </div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8,
              background: "rgba(255,255,255,0.1)", color: "#fff", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {err && (
            <div style={{
              padding: "9px 11px", borderRadius: 8, fontSize: 11.5,
              background: "#FCE3E3", color: RED, marginBottom: 10,
              fontWeight: 700, borderLeft: `3px solid ${RED}`,
            }}>{err}</div>
          )}

          {/* DDT info */}
          <div style={{
            background: "#fff", borderRadius: 11, padding: 11, marginBottom: 10,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
          }}>
            <Field label="N° DDT">
              <input value={ddtNumero} onChange={(e) => setDdtNumero(e.target.value)} placeholder="es. 8721/2026" style={input} />
            </Field>
            <Field label="Data DDT">
              <input type="date" value={ddtData} onChange={(e) => setDdtData(e.target.value)} style={input} />
            </Field>
          </div>

          {/* Bulk action */}
          <button onClick={segnaTutteOk} style={{
            width: "100%", padding: 9, marginBottom: 9,
            background: `linear-gradient(180deg, ${GREEN}, #0a4d3c)`,
            color: "#fff", border: "none", borderRadius: 8,
            fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase", cursor: "pointer",
          }}>✓ TUTTE ARRIVATE OK</button>

          {/* Righe */}
          {loading ? <Loader /> : righe.map((r, idx) => (
            <RigaRicezione key={r.id} riga={r} idx={idx + 1} onUpdate={updateRiga} />
          ))}

          {/* Note */}
          <div style={{
            background: "#fff", borderRadius: 10, padding: 10, marginTop: 10,
          }}>
            <Field label="Note ricezione">
              <input value={notaGenerale} onChange={(e) => setNotaGenerale(e.target.value)}
                placeholder="es. Pacco danneggiato, mancano viti..."
                style={input} />
            </Field>
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: 12, background: "#fff", borderTop: "1px solid #E5EAF0",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 11 }}>
            <span style={{ color: MUTED, fontWeight: 600 }}>Selezionate: <b style={{ color: NAVY }}>{nSel}/{righe.length}</b></span>
            <span style={{ color: NAVY, fontWeight: 800 }}>Tot effettivo: € {totEffettivo.toFixed(2)}</span>
          </div>
          <button onClick={conferma} disabled={saving || nSel === 0} style={{
            width: "100%", padding: 13,
            background: (saving || nSel === 0) ? "#D8DEE5" : `linear-gradient(180deg, ${TEAL}, ${TEAL_DARK})`,
            color: "#fff", borderRadius: 10, fontSize: 12, fontWeight: 800,
            letterSpacing: 0.5, textTransform: "uppercase", border: "none",
            cursor: (saving || nSel === 0) ? "not-allowed" : "pointer",
          }}>
            {saving ? "Salvataggio..." : `CONFERMA RICEZIONE · ${nSel} righe`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RIGA RICEZIONE
// ============================================================

function RigaRicezione({ riga, idx, onUpdate }: any) {
  const stato = riga.check ? "ok" : riga.check_parz ? "parz" : riga.check_manc ? "manc" : "vuoto";
  const colBg = stato === "ok" ? "#D5EBE0" : stato === "parz" ? "#FBF0DC" : stato === "manc" ? "#FCE3E3" : "#fff";
  const colBord = stato === "ok" ? GREEN : stato === "parz" ? AMBER : stato === "manc" ? RED : "#E5EAF0";
  
  return (
    <div style={{
      background: colBg, borderRadius: 9, padding: "9px 10px",
      marginBottom: 6, borderLeft: `3px solid ${colBord}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: MUTED, fontWeight: 800, minWidth: 18 }}>{idx}.</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, color: MUTED, fontFamily: "SF Mono, monospace", fontWeight: 700 }}>
            {riga.codice_snapshot}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>
            {riga.nome_snapshot}
          </div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>
            Ordinato: <b style={{ color: NAVY }}>{riga.quantita_ordinata}</b> {riga.unita_misura_snapshot} · € {riga.prezzo_unitario}
          </div>
        </div>
      </div>

      {/* 3 toggle stato */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 6 }}>
        <BtnCheck active={riga.check} color={GREEN} txt="✓ OK" onClick={() => onUpdate(riga.id, "check", !riga.check)} />
        <BtnCheck active={riga.check_parz} color={AMBER} txt="◐ PARZ." onClick={() => onUpdate(riga.id, "check_parz", !riga.check_parz)} />
        <BtnCheck active={riga.check_manc} color={RED} txt="✗ MANC." onClick={() => onUpdate(riga.id, "check_manc", !riga.check_manc)} />
      </div>

      {/* Editor qta + prezzo se selezionato (non manc) */}
      {(riga.check || riga.check_parz) && (
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <span style={{ fontSize: 9.5, color: MUTED, fontWeight: 700 }}>Qta:</span>
          <input type="number" value={riga.qta_inserita}
            onChange={(e) => onUpdate(riga.id, "qta_inserita", parseFloat(e.target.value) || 0)}
            style={{ width: 50, padding: "5px 6px", border: "1px solid #D8DEE5", borderRadius: 4, fontSize: 11, fontWeight: 700, textAlign: "right", outline: "none" }} />
          <span style={{ fontSize: 9, color: MUTED }}>×</span>
          <input type="number" step="0.01" value={riga.prezzo_inserito}
            onChange={(e) => onUpdate(riga.id, "prezzo_inserito", parseFloat(e.target.value) || 0)}
            style={{ width: 60, padding: "5px 6px", border: "1px solid #D8DEE5", borderRadius: 4, fontSize: 11, fontWeight: 700, textAlign: "right", outline: "none" }} />
          <span style={{ fontSize: 9, color: MUTED }}>€</span>
          {riga.prezzo_inserito !== riga.prezzo_unitario && (
            <span style={{ fontSize: 9, color: RED, fontWeight: 800 }}>
              Δ{(riga.prezzo_inserito - riga.prezzo_unitario).toFixed(2)}€
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function BtnCheck({ active, color, txt, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 4px",
      background: active ? color : "#fff",
      color: active ? "#fff" : MUTED,
      border: `1px solid ${active ? color : "#D8DEE5"}`,
      borderRadius: 6, fontSize: 9.5, fontWeight: 800,
      letterSpacing: 0.3, cursor: "pointer",
    }}>{txt}</button>
  );
}

function Pill({ bg, col, txt }: any) {
  return (
    <span style={{ background: bg, color: col, padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{txt}</span>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 800, color: NAVY, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function Loader() {
  return <div style={{ padding: 25, textAlign: "center", color: MUTED, fontSize: 11 }}>Caricamento...</div>;
}

const input: React.CSSProperties = {
  width: "100%", padding: "9px 11px",
  border: "1px solid #D8DEE5", borderRadius: 7,
  fontSize: 12, color: NAVY, fontWeight: 600,
  outline: "none", background: "#fff", boxSizing: "border-box", fontFamily: "inherit",
};
