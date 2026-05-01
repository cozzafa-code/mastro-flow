"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { DayCategoria } from "@/lib/types/day";
import type { DayCreateResult } from "@/hooks/useDay";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (input: {
    titolo: string;
    categoria: DayCategoria;
    ora_inizio: string | null;
    durata_min: number | null;
    cm_id?: string | null;
    evento_match?: string | null;
  }) => Promise<DayCreateResult>;
}

const CATEGORIE: { v: DayCategoria; lbl: string; bg: string; fg: string }[] = [
  { v: "mastro",  lbl: "MASTRO",  bg: "rgba(40,160,160,0.14)",  fg: "#04403B" },
  { v: "vita",    lbl: "Vita",    bg: "rgba(29,158,117,0.14)",  fg: "#04342C" },
  { v: "lidia",   lbl: "Lidia",   bg: "rgba(239,159,39,0.14)",  fg: "#854F0B" },
  { v: "risolto", lbl: "RISOLTO", bg: "rgba(127,119,221,0.12)", fg: "#3C3489" },
  { v: "deep",    lbl: "Deep",    bg: "rgba(40,160,160,0.14)",  fg: "#04403B" },
  { v: "pausa",   lbl: "Pausa",   bg: "rgba(29,158,117,0.14)",  fg: "#04342C" },
];

const DURATE = [15, 30, 45, 60, 90, 120];

const EVENTI_MATCH: { v: string; lbl: string; col: string }[] = [
  { v: "misure_salvate",      lbl: "Misure salvate",      col: "#7F77DD" },
  { v: "prev_generato",       lbl: "Preventivo creato",   col: "#EF9F27" },
  { v: "prev_inviato",        lbl: "Preventivo inviato",  col: "#EF9F27" },
  { v: "mail_inviata",        lbl: "Mail inviata",        col: "#378ADD" },
  { v: "mail_ricevuta",       lbl: "Mail ricevuta",       col: "#378ADD" },
  { v: "risposta_cliente",    lbl: "Risposta cliente",    col: "#1D9E75" },
  { v: "ordine_confermato",   lbl: "Ordine confermato",   col: "#1D9E75" },
  { v: "fattura_emessa",      lbl: "Fattura emessa",      col: "#1D9E75" },
  { v: "pagamento_ricevuto",  lbl: "Pagamento ricevuto",  col: "#1D9E75" },
  { v: "foto_caricata",       lbl: "Foto caricate",       col: "#1D9E75" },
];

interface CmRow {
  id: string;
  code: string | null;
  label_full: string;
  fase: string | null;
}

export function DayQuickAdd({ open, onClose, onCreate }: Props) {
  const [titolo, setTitolo] = useState("");
  const [categoria, setCategoria] = useState<DayCategoria>("mastro");
  const [oraInizio, setOraInizio] = useState("");
  const [durata, setDurata] = useState<number>(30);
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // D57 · CM associata
  const [cmList, setCmList] = useState<CmRow[]>([]);
  const [cmQuery, setCmQuery] = useState("");
  const [cmId, setCmId] = useState<string | null>(null);
  const [cmDropdownOpen, setCmDropdownOpen] = useState(false);

  // D58 · sub-task evento_match
  const [eventoMatch, setEventoMatch] = useState<string | null>(null);

  // [advanced] toggle per mostrare campi opzionali
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // carico la lista CM la prima volta che apro il pannello avanzato
  useEffect(() => {
    if (!advancedOpen || cmList.length > 0) return;
    (async () => {
      const { data } = await supabase
        .from("day_cm_autocomplete")
        .select("id, code, label_full, fase")
        .limit(50);
      if (data) setCmList(data as CmRow[]);
    })();
  }, [advancedOpen, cmList.length]);

  // filtraggio veloce
  const cmFiltered = useMemo(() => {
    const q = cmQuery.trim().toLowerCase();
    if (!q) return cmList.slice(0, 8);
    return cmList
      .filter((c) => (c.label_full ?? "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [cmList, cmQuery]);

  if (!open) return null;

  const cmSelected = cmList.find((c) => c.id === cmId);

  const reset = () => {
    setTitolo(""); setCategoria("mastro"); setOraInizio(""); setDurata(30);
    setErrMsg(null); setCmId(null); setCmQuery(""); setEventoMatch(null);
    setAdvancedOpen(false); setCmDropdownOpen(false);
  };

  const submit = async () => {
    if (!titolo.trim() || saving) return;
    setSaving(true);
    setErrMsg(null);
    try {
      const res = await onCreate({
        titolo: titolo.trim(),
        categoria,
        ora_inizio: oraInizio || null,
        durata_min: durata,
        cm_id: cmId,
        evento_match: eventoMatch,
      });
      if (res.ok) {
        reset();
        onClose();
      } else {
        setErrMsg(res.error);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10001,
        background: "rgba(13,31,31,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "#F4F6F5",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          padding: "10px 18px 24px",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.3)",
          animation: "qaUp 0.25s cubic-bezier(.2,.8,.2,1)",
          maxHeight: "92vh", overflowY: "auto",
        }}>
        <style>{`@keyframes qaUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

        <div style={{
          margin: "0 auto 14px", height: 4, width: 40,
          background: "#C8E4E4", borderRadius: 99,
        }} />

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#0F2525", letterSpacing: -0.3 }}>Nuovo task</div>
          <button type="button" onClick={onClose} aria-label="Chiudi"
            style={{
              width: 32, height: 32, borderRadius: 10, border: 0, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F2525" strokeWidth="2.6" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {errMsg && (
          <div style={{
            marginBottom: 12, padding: "10px 12px", borderRadius: 11,
            background: "linear-gradient(145deg, #FEE2E2, #FCA5A5)",
            border: "1px solid #DC4444", borderLeft: "4px solid #B91C1C",
            color: "#7F1D1D", fontSize: 12, fontWeight: 700, letterSpacing: -0.1,
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>{errMsg}</span>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
            Cosa devi fare
          </div>
          <input type="text" value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            placeholder="es. Fix bug polyAnta"
            autoFocus
            style={{
              width: "100%", padding: "12px 14px",
              fontSize: 15, fontWeight: 600, color: "#0F2525",
              background: "#fff",
              border: "1px solid rgba(200,228,228,0.6)",
              borderRadius: 13, outline: "none",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
              fontFamily: "inherit",
            }}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
            Categoria
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {CATEGORIE.map((c) => {
              const active = categoria === c.v;
              return (
                <button key={c.v} type="button" onClick={() => setCategoria(c.v)}
                  style={{
                    padding: "9px 6px",
                    fontSize: 11, fontWeight: 900, letterSpacing: 0.4, textTransform: "uppercase",
                    color: active ? c.fg : "#5A7878",
                    background: active ? c.bg : "#fff",
                    border: active ? `1px solid ${c.fg}33` : "1px solid rgba(200,228,228,0.5)",
                    borderRadius: 11, cursor: "pointer",
                    boxShadow: active ? "0 2px 6px rgba(13,31,31,0.06)" : "0 1px 3px rgba(13,31,31,0.04)",
                    fontFamily: "inherit",
                  }}>{c.lbl}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
              Ora
            </div>
            <input type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)}
              style={{
                width: "100%", padding: "11px 12px",
                fontSize: 14, fontWeight: 700, color: "#0F2525",
                background: "#fff",
                border: "1px solid rgba(200,228,228,0.6)",
                borderRadius: 11, outline: "none",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
                fontFamily: "inherit",
              }}/>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
              Durata · min
            </div>
            <select value={durata} onChange={(e) => setDurata(parseInt(e.target.value, 10))}
              style={{
                width: "100%", padding: "11px 12px",
                fontSize: 14, fontWeight: 700, color: "#0F2525",
                background: "#fff",
                border: "1px solid rgba(200,228,228,0.6)",
                borderRadius: 11, outline: "none",
                boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
                fontFamily: "inherit",
              }}>
              {DURATE.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
        </div>

        {/* AVANZATE · toggle */}
        <button type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          style={{
            width: "100%",
            padding: "8px 12px", borderRadius: 10, border: 0, cursor: "pointer",
            background: advancedOpen ? "rgba(40,160,160,0.10)" : "transparent",
            color: "#1A7A7A",
            fontSize: 11, fontWeight: 900, letterSpacing: 0.3,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "inherit",
            marginBottom: advancedOpen ? 12 : 16,
          }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ transform: advancedOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
          {advancedOpen ? "Nascondi avanzate" : "Avanzate · CM + auto-spunta"}
        </button>

        {advancedOpen && (
          <div style={{
            padding: 12, borderRadius: 12,
            background: "rgba(40,160,160,0.05)",
            border: "1px dashed rgba(40,160,160,0.2)",
            marginBottom: 16,
          }}>
            {/* D57 · CM associata */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
                CM associata · opzionale
              </div>
              {cmSelected ? (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 12px", borderRadius: 11,
                  background: "linear-gradient(145deg, rgba(127,119,221,0.14), rgba(127,119,221,0.06))",
                  border: "1px solid rgba(127,119,221,0.3)",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: "#3C3489", letterSpacing: -0.1 }}>
                      {cmSelected.label_full}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#6961CB", letterSpacing: 0.3, textTransform: "uppercase", marginTop: 2 }}>
                      {cmSelected.fase ?? "—"}
                    </div>
                  </div>
                  <button type="button"
                    onClick={() => { setCmId(null); setCmQuery(""); }}
                    style={{
                      width: 22, height: 22, borderRadius: 6, border: 0, cursor: "pointer",
                      background: "rgba(127,119,221,0.18)", color: "#7F77DD",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div style={{ position: "relative" }}>
                  <input type="text"
                    value={cmQuery}
                    placeholder="cerca per codice o cliente · es. S-0027"
                    onChange={(e) => { setCmQuery(e.target.value); setCmDropdownOpen(true); }}
                    onFocus={() => setCmDropdownOpen(true)}
                    style={{
                      width: "100%", padding: "11px 12px",
                      fontSize: 13, fontWeight: 600, color: "#0F2525",
                      background: "#fff",
                      border: "1px solid rgba(200,228,228,0.6)",
                      borderRadius: 11, outline: "none",
                      boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
                      fontFamily: "inherit",
                    }}/>
                  {cmDropdownOpen && cmFiltered.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      marginTop: 4,
                      background: "#fff", borderRadius: 11,
                      border: "1px solid rgba(200,228,228,0.6)",
                      boxShadow: "0 8px 24px rgba(13,31,31,0.12)",
                      maxHeight: 220, overflowY: "auto",
                      zIndex: 5,
                    }}>
                      {cmFiltered.map((c) => (
                        <button key={c.id} type="button"
                          onClick={() => { setCmId(c.id); setCmDropdownOpen(false); }}
                          style={{
                            width: "100%", padding: "9px 12px",
                            border: 0, borderBottom: "1px solid rgba(200,228,228,0.3)",
                            background: "transparent", cursor: "pointer", textAlign: "left",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            fontFamily: "inherit",
                          }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#0F2525", letterSpacing: -0.1 }}>
                            {c.label_full}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 800, color: "#5A7878", letterSpacing: 0.3, textTransform: "uppercase" }}>
                            {c.fase ?? "—"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {cmDropdownOpen && cmFiltered.length === 0 && cmQuery.length > 0 && (
                    <div style={{
                      position: "absolute", top: "100%", left: 0, right: 0,
                      marginTop: 4, padding: 12,
                      background: "#fff", borderRadius: 11,
                      border: "1px solid rgba(200,228,228,0.6)",
                      boxShadow: "0 8px 24px rgba(13,31,31,0.12)",
                      fontSize: 11, fontWeight: 700, color: "#5A7878", textAlign: "center",
                      zIndex: 5,
                    }}>
                      Nessuna commessa trovata
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* D58 · sub-task auto-spunta su evento */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>
                Sub-task auto-spunta · opzionale
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#5A7878", marginBottom: 8, lineHeight: 1.4 }}>
                Quando questo evento arriva da MASTRO, il task spunta automaticamente
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                <button type="button"
                  onClick={() => setEventoMatch(null)}
                  style={{
                    padding: "6px 10px", borderRadius: 8, border: 0, cursor: "pointer",
                    fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
                    background: !eventoMatch ? "rgba(40,160,160,0.14)" : "#fff",
                    color: !eventoMatch ? "#04403B" : "#5A7878",
                    boxShadow: !eventoMatch ? "0 2px 6px rgba(13,31,31,0.06)" : "inset 0 0 0 1px rgba(200,228,228,0.5)",
                    fontFamily: "inherit",
                  }}>
                  Nessuno
                </button>
                {EVENTI_MATCH.map((e) => {
                  const active = eventoMatch === e.v;
                  return (
                    <button key={e.v} type="button"
                      onClick={() => setEventoMatch(e.v)}
                      style={{
                        padding: "6px 10px", borderRadius: 8, border: 0, cursor: "pointer",
                        fontSize: 10, fontWeight: 900, letterSpacing: 0.3,
                        background: active ? `${e.col}22` : "#fff",
                        color: active ? e.col : "#5A7878",
                        boxShadow: active ? `0 2px 6px ${e.col}33, inset 0 0 0 1px ${e.col}44` : "inset 0 0 0 1px rgba(200,228,228,0.5)",
                        fontFamily: "inherit",
                      }}>
                      {e.lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 8 }}>
          <button type="button" onClick={onClose}
            style={{
              padding: "13px 8px", borderRadius: 13, border: 0, cursor: "pointer",
              fontSize: 13, fontWeight: 900, color: "#5A7878",
              background: "#fff",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(200,228,228,0.5)",
              fontFamily: "inherit",
            }}>Annulla</button>
          <button type="button" onClick={submit} disabled={!titolo.trim() || saving}
            style={{
              padding: "13px 8px", borderRadius: 13, border: 0,
              cursor: !titolo.trim() || saving ? "not-allowed" : "pointer",
              fontSize: 13, fontWeight: 900, letterSpacing: 0.3, color: "#fff",
              background: !titolo.trim() || saving
                ? "rgba(40,160,160,0.4)"
                : "linear-gradient(145deg, #3ABDBD, #1E8080)",
              boxShadow: !titolo.trim() || saving
                ? "none"
                : "0 6px 16px rgba(40,160,160,0.4), inset 0 -3px 0 rgba(0,0,0,0.08)",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {saving ? "Salvo..." : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
                Aggiungi al Day
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
