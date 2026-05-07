"use client";
// @ts-nocheck
//
// MASTRO Suite · Componente Timeline UNIVERSALE
// Si usa in qualsiasi modulo: <Timeline modulo="commessa" entitaId={cm.id} />
// Carica eventi da timeline_universale e renderizza con autore + cosa fatto + documenti
//
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface TimelineEvento {
  id: string;
  tipo: string;
  titolo: string;
  descrizione: string | null;
  autore_nome: string | null;
  autore_ruolo: string | null;
  stato: string | null;
  documenti: any[];
  metadata: any;
  quando: string;
}

interface TimelineProps {
  modulo: "commessa" | "cliente" | "fornitore" | "squadra" | "operatore" | "fattura" | "ordine" | "vano" | "preventivo" | "montaggio" | "altro";
  entitaId: string;
  aziendaId?: string;
  maxHeight?: number;
  titolo?: string;
}

export default function Timeline({ modulo, entitaId, aziendaId, maxHeight, titolo = "Cronologia" }: TimelineProps) {
  const [eventi, setEventi] = useState<TimelineEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("tutti");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!entitaId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let query = supabase
        .from("timeline_universale")
        .select("*")
        .eq("modulo", modulo)
        .eq("entita_id", entitaId)
        .order("quando", { ascending: false });

      if (aziendaId) {
        query = query.eq("azienda_id", aziendaId);
      }

      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        console.error("[Timeline] errore caricamento:", error);
        setEventi([]);
      } else {
        setEventi(data || []);
      }
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [modulo, entitaId, aziendaId]);

  // Conteggi per filtri
  const counts = {
    tutti: eventi.length,
    vani: eventi.filter(e => e.tipo.startsWith("vano_")).length,
    foto: eventi.filter(e => e.tipo === "foto").length,
    chiamate: eventi.filter(e => e.tipo === "chiamata").length,
    documenti: eventi.filter(e => e.tipo === "documento").length,
  };

  // Filtra
  const eventiFiltrati = eventi.filter(e => {
    if (filter === "tutti") return true;
    if (filter === "vani") return e.tipo.startsWith("vano_");
    return e.tipo === filter.replace(/e$/, ""); // "chiamate" -> "chiamata"
  });

  // Helper: ora relativa
  const oraRelativa = (iso: string) => {
    const ora = new Date(iso);
    const ms = Date.now() - ora.getTime();
    const min = Math.floor(ms / 60000);
    if (min < 1) return "ora";
    if (min < 60) return `${min}m fa`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h fa`;
    const g = Math.floor(h / 24);
    if (g < 7) return `${g}g fa`;
    return ora.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
  };

  // Color dot per stato
  const dotColor = (stato: string | null) => {
    switch (stato) {
      case "completato": return "#065F46";
      case "urgente": return "#991B1B";
      case "warning": return "#92400E";
      case "in_corso": return "#1E3A5F";
      default: return "#475A75";
    }
  };

  // Color icona doc per estensione
  const docColor = (nome: string) => {
    const ext = (nome.split(".").pop() || "").toLowerCase();
    if (ext === "pdf") return { bg: "#FEE2E2", fg: "#991B1B" };
    if (["jpg","jpeg","png","webp"].includes(ext)) return { bg: "#DBE6F1", fg: "#1E3A5F" };
    if (["mp3","wav","m4a"].includes(ext)) return { bg: "#EDE9FE", fg: "#6D28D9" };
    if (["xlsx","csv","xls"].includes(ext)) return { bg: "#D1FAE5", fg: "#065F46" };
    return { bg: "#FEF3C7", fg: "#92400E" };
  };

  // Iniziali avatar
  const iniz = (nome: string | null) => {
    if (!nome) return "?";
    return nome.split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
  };

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: "center" as any, color: "#475A75", fontSize: 12, fontWeight: 600 }}>
        Caricamento cronologia...
      </div>
    );
  }

  return (
    <div style={{
      background: "#FFF",
      border: "1px solid #CBD5E1",
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: "0 3px 10px rgba(15,23,42,0.05)",
    }}>
      {/* HEADER */}
      <div style={{
        padding: "11px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, #F8FAFC, #F1F5F9)",
        borderBottom: "1px solid #E2E8F0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#1E3A5F", color: "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0A1628" }}>{titolo}</div>
            <div style={{ fontSize: 9.5, color: "#475A75", fontWeight: 600, marginTop: 1 }}>
              {eventi.length > 0 ? `${eventi.length} eventi · ultimo ${oraRelativa(eventi[0].quando)}` : "Nessun evento"}
            </div>
          </div>
        </div>
        <div style={{
          background: "#1E3A5F", color: "#FFF",
          fontSize: 10, fontWeight: 800,
          padding: "3px 9px", borderRadius: 999,
          minWidth: 22, textAlign: "center" as any,
        }}>{eventi.length}</div>
      </div>

      {/* FILTRI PILL */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid #E2E8F0", background: "#F8FAFC", overflowX: "auto" as any }}>
        {[
          { id: "tutti", l: "Tutti", n: counts.tutti },
          { id: "vani", l: "Vani", n: counts.vani },
          { id: "foto", l: "Foto", n: counts.foto },
          { id: "chiamate", l: "Chiamate", n: counts.chiamate },
          { id: "documenti", l: "Documenti", n: counts.documenti },
        ].map((f) => (
          <div key={f.id} onClick={() => setFilter(f.id)} style={{
            background: filter === f.id ? "#1E3A5F" : "#FFF",
            border: filter === f.id ? "1px solid #1E3A5F" : "1px solid #CBD5E1",
            borderRadius: 999,
            padding: "4px 9px",
            fontSize: 9.5, fontWeight: 700,
            color: filter === f.id ? "#FFF" : "#475A75",
            whiteSpace: "nowrap" as any,
            flexShrink: 0,
            cursor: "pointer",
          }}>{f.l} · {f.n}</div>
        ))}
      </div>

      {/* BODY EVENTI */}
      <div style={{
        padding: "12px 12px 14px",
        position: "relative" as any,
        maxHeight: maxHeight || undefined,
        overflowY: maxHeight ? ("auto" as any) : undefined,
      }}>
        {eventiFiltrati.length === 0 && (
          <div style={{ textAlign: "center" as any, color: "#94A3B8", fontSize: 12, padding: "20px 0", fontWeight: 600 }}>
            Nessun evento per questo filtro
          </div>
        )}

        {eventiFiltrati.length > 0 && (
          <div style={{
            position: "absolute" as any,
            left: 24, top: 22, bottom: 22,
            width: 2, background: "#CBD5E1",
          }} />
        )}

        {eventiFiltrati.map((ev, idx) => {
          const isExpanded = expandedIdx === idx;
          const autorIniz = iniz(ev.autore_nome);

          return (
            <div key={ev.id} onClick={() => setExpandedIdx(isExpanded ? null : idx)} style={{
              position: "relative" as any,
              paddingLeft: 28,
              marginBottom: 9,
              cursor: "pointer",
            }}>
              {/* DOT */}
              <div style={{
                position: "absolute" as any,
                left: 5, top: 8,
                width: 14, height: 14, borderRadius: "50%",
                background: dotColor(ev.stato),
                border: "3px solid #FFF",
                boxShadow: "0 0 0 1px #CBD5E1",
              }} />

              {/* CARD EVENTO */}
              <div style={{
                background: isExpanded ? "#FFF" : "#F8FAFC",
                border: isExpanded ? "1px solid #1E3A5F" : "1px solid #E2E8F0",
                borderRadius: 10,
                padding: "8px 10px",
                boxShadow: isExpanded ? "0 4px 12px rgba(30,58,95,0.12)" : "none",
                transition: "all 0.15s",
              }}>
                {/* Titolo + ora */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0A1628", flex: 1 }}>
                    {ev.titolo}
                  </div>
                  <div style={{ fontSize: 9.5, color: "#94A3B8", fontWeight: 700, flexShrink: 0 }}>
                    {oraRelativa(ev.quando)}
                  </div>
                </div>

                {/* Mini autore (collassato) */}
                {!isExpanded && ev.autore_nome && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, fontSize: 10, color: "#475A75", fontWeight: 600 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 5,
                      background: "linear-gradient(135deg, #1E3A5F, #2D5A87)",
                      color: "#FFF",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 800, flexShrink: 0,
                    }}>{autorIniz}</div>
                    {ev.autore_nome}{ev.autore_ruolo ? ` · ${ev.autore_ruolo}` : ""}
                  </div>
                )}

                {/* DETTAGLIO ESPANSO */}
                {isExpanded && (
                  <div style={{ marginTop: 9, paddingTop: 9, borderTop: "1px solid #E2E8F0" }}>

                    {/* Eseguito da */}
                    {ev.autore_nome && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "#475A75", textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          Eseguito da
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 9,
                          padding: "8px 10px",
                          background: "linear-gradient(180deg, #F1F5F9, #FFF)",
                          border: "1px solid #E2E8F0",
                          borderRadius: 9,
                        }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 9,
                            background: "linear-gradient(135deg, #1E3A5F, #2D5A87)",
                            color: "#FFF",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 800, flexShrink: 0,
                          }}>{autorIniz}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: "#0A1628" }}>{ev.autore_nome}</div>
                            <div style={{ fontSize: 10, color: "#475A75", fontWeight: 600, marginTop: 1 }}>
                              {ev.autore_ruolo || "Sistema"} · {oraRelativa(ev.quando)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cosa fatto */}
                    {ev.descrizione && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "#475A75", textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
                          Cosa è stato fatto
                        </div>
                        <div style={{
                          background: "#FFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: 9,
                          padding: "9px 11px",
                          fontSize: 11.5, color: "#0A1628", fontWeight: 600, lineHeight: 1.4,
                        }}>
                          {ev.descrizione}
                        </div>
                      </div>
                    )}

                    {/* Documenti */}
                    {ev.documenti && Array.isArray(ev.documenti) && ev.documenti.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "#475A75", textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          Documenti · {ev.documenti.length}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" as any, gap: 5 }}>
                          {ev.documenti.map((doc: any, di: number) => {
                            const colors = docColor(doc.nome || "");
                            return (
                              <div key={di} onClick={(e) => { e.stopPropagation(); if (doc.url && doc.url !== "#") window.open(doc.url, "_blank"); }} style={{
                                display: "flex", alignItems: "center", gap: 9,
                                padding: "8px 10px",
                                background: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                borderRadius: 9,
                                cursor: doc.url && doc.url !== "#" ? "pointer" : "default",
                              }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: 8,
                                  background: colors.bg, color: colors.fg,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 11, fontWeight: 800, color: "#0A1628", whiteSpace: "nowrap" as any, overflow: "hidden", textOverflow: "ellipsis" }}>{doc.nome || "Documento"}</div>
                                  <div style={{ fontSize: 9.5, color: "#475A75", fontWeight: 600, marginTop: 1 }}>
                                    {doc.size || ""}{doc.descrizione ? ` · ${doc.descrizione}` : ""}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Misure (se metadata.misure presente) */}
                    {ev.metadata && ev.metadata.misure && typeof ev.metadata.misure === "object" && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: "#475A75", textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 5, display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 6H3M21 12H3M21 18H3"/></svg>
                          Misure rilevate
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                          {Object.entries(ev.metadata.misure).slice(0, 8).map(([k, v]: any) => (
                            <div key={k} style={{ background: "#F1F5F9", borderRadius: 6, padding: "5px 6px", textAlign: "center" as any }}>
                              <div style={{ fontSize: 8.5, color: "#94A3B8", fontWeight: 800, letterSpacing: "0.3px", textTransform: "uppercase" as any }}>{k}</div>
                              <div style={{ fontSize: 11, color: "#0A1628", fontWeight: 800, marginTop: 1 }}>{String(v)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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

// Helper: aggiungere un evento alla timeline da qualsiasi modulo
// import { aggiungiEvento } from "@/components/Timeline";
// aggiungiEvento({ modulo: "commessa", entitaId: cm.id, aziendaId, tipo: "vano_completato", titolo: "...", ... });
export async function aggiungiEvento(params: {
  modulo: string;
  entitaId: string;
  aziendaId: string;
  tipo: string;
  titolo: string;
  descrizione?: string;
  autore_nome?: string;
  autore_ruolo?: string;
  autore_id?: string;
  stato?: "completato" | "in_corso" | "urgente" | "warning" | "info";
  documenti?: any[];
  metadata?: any;
}): Promise<{ ok: boolean; id?: string; error?: any }> {
  const { error, data } = await supabase
    .from("timeline_universale")
    .insert({
      modulo: params.modulo,
      entita_id: params.entitaId,
      azienda_id: params.aziendaId,
      tipo: params.tipo,
      titolo: params.titolo,
      descrizione: params.descrizione || null,
      autore_nome: params.autore_nome || null,
      autore_ruolo: params.autore_ruolo || null,
      autore_id: params.autore_id || null,
      stato: params.stato || null,
      documenti: params.documenti || [],
      metadata: params.metadata || {},
      quando: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Timeline.aggiungiEvento] errore:", error);
    return { ok: false, error };
  }
  return { ok: true, id: data?.id };
}
