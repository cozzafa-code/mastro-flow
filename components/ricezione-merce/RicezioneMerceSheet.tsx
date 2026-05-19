"use client";
import { useEffect, useState } from "react";

type Riga = {
  id: string;
  descrizione: string;
  qta: number;
  unita?: string;
  costo_unit?: number;
  qta_arrivata?: number;
  costo_reale?: number;
  arrivato_ok?: boolean;
  note?: string;
};

type Ordine = {
  id: string;
  numero: string;
  fornitore: string;
  totale_stimato: number;
  totale_euro: number;
  arrivato_at: string | null;
  ddt_numero?: string;
  ddt_data?: string;
  fattura_numero?: string;
  importo_fatturato?: number;
  righe: any;
  righe_verificate?: any[];
};

type Props = {
  commessaId: string;
  commessaCode: string;
  onClose: () => void;
  onCompletato?: () => void;
};

const C = {
  bg: "#EEF8F8",
  card: "#fff",
  teal: "#28A0A0",
  tealDk: "#1a6b6b",
  dark: "#0D1F1F",
  border: "#C8E4E4",
  sub: "#6A8484",
  green: "#10B981",
  red: "#DC2626",
  amber: "#F59E0B",
};

export default function RicezioneMerceSheet({ commessaId, commessaCode, onClose, onCompletato }: Props) {
  const [ordini, setOrdini] = useState<Ordine[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Carica ordini fornitore della commessa
  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data, error } = await supabase
          .from("ordini_fornitore")
          .select("*")
          .eq("commessa_id", commessaId)
          .order("created_at", { ascending: true });
        if (error) { console.error("[RicezioneMerce]", error); setLoading(false); return; }
        const list: Ordine[] = (data || []).map((o: any) => {
          const righeRaw = Array.isArray(o.righe) ? o.righe : (o.righe?.righe || []);
          const verificate = Array.isArray(o.righe_verificate) ? o.righe_verificate : [];
          const verMap = new Map(verificate.map((v: any) => [String(v.id), v]));
          const righe: Riga[] = (righeRaw || []).map((r: any, i: number) => {
            const id = String(r.id || i);
            const v: any = verMap.get(id) || {};
            return {
              id,
              descrizione: r.descrizione || r.nome || r.articolo || "Articolo " + (i + 1),
              qta: Number(r.qta || r.quantita || 1),
              unita: r.unita || r.um || "pz",
              costo_unit: Number(r.costo_unit || r.prezzo || 0),
              qta_arrivata: v.qta_arrivata != null ? Number(v.qta_arrivata) : Number(r.qta || r.quantita || 1),
              costo_reale: v.costo_reale != null ? Number(v.costo_reale) : Number(r.costo_unit || r.prezzo || 0),
              arrivato_ok: v.arrivato_ok != null ? !!v.arrivato_ok : false,
              note: v.note || "",
            };
          });
          return {
            id: o.id,
            numero: o.numero || ("ORD-" + String(o.id).slice(0, 6)),
            fornitore: o.fornitore || "Fornitore",
            totale_stimato: Number(o.totale_stimato || o.totale_euro || 0),
            totale_euro: Number(o.totale_euro || o.totale_stimato || 0),
            arrivato_at: o.arrivato_at || null,
            ddt_numero: o.ddt_numero || "",
            ddt_data: o.ddt_data || "",
            fattura_numero: o.fattura_numero || "",
            importo_fatturato: o.importo_fatturato != null ? Number(o.importo_fatturato) : undefined,
            righe,
          };
        });
        setOrdini(list);
        // Espandi il primo ordine non ancora completato
        const firstOpen = list.find(o => !o.arrivato_at);
        if (firstOpen) setExpanded(new Set([firstOpen.id]));
      } finally {
        setLoading(false);
      }
    })();
  }, [commessaId]);

  const salvaBozza = async () => {
    // Salva DDT + righe verificate come bozza per ordini NON ancora confermati
    try {
      const { supabase } = await import("@/lib/supabase");
      const daSalvare = ordini.filter(o => !o.arrivato_at && (
        o.ddt_numero || 
        o.fattura_numero || 
        o.importo_fatturato != null || 
        o.righe.some(r => r.arrivato_ok || r.qta_arrivata !== r.qta || r.costo_reale !== r.costo_unit)
      ));
      if (daSalvare.length === 0) return;
      await Promise.all(daSalvare.map(o => supabase.from("ordini_fornitore").update({
        ddt_numero: o.ddt_numero || null,
        ddt_data: o.ddt_data || null,
        fattura_numero: o.fattura_numero || null,
        importo_fatturato: o.importo_fatturato || null,
        righe_verificate: o.righe.map(r => ({
          id: r.id, qta_arrivata: r.qta_arrivata, costo_reale: r.costo_reale,
          arrivato_ok: r.arrivato_ok, note: r.note || null,
        })),
      }).eq("id", o.id)));
      console.log("[RicezioneMerce] bozza salvata per " + daSalvare.length + " ordini");
    } catch (e) {
      console.error("[RicezioneMerce] errore salva bozza", e);
    }
  };

  const onCloseConSalva = async () => {
    await salvaBozza();
    onClose();
  };

  const toggleOrdine = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateRiga = (ordineId: string, rigaId: string, field: keyof Riga, value: any) => {
    setOrdini(prev => prev.map(o => {
      if (o.id !== ordineId) return o;
      return {
        ...o,
        righe: o.righe.map(r => r.id === rigaId ? { ...r, [field]: value } : r),
      };
    }));
  };

  const updateOrdine = (ordineId: string, field: keyof Ordine, value: any) => {
    setOrdini(prev => prev.map(o => o.id === ordineId ? { ...o, [field]: value } : o));
  };

  // Tutti righe flaggate ok
  const ordineCompleto = (o: Ordine) => {
    if (o.righe.length === 0) return !!(o as any)._finitoOk; // Per ordini prodotto finito
    return o.righe.every(r => r.arrivato_ok);
  };
  
  // Calcola scostamento per ordine
  const scostamentoOrdine = (o: Ordine) => {
    const reale = o.righe.reduce((sum, r) => sum + (r.qta_arrivata || 0) * (r.costo_reale || 0), 0);
    return reale - o.totale_stimato;
  };

  const flagTutte = (ordineId: string) => {
    setOrdini(prev => prev.map(o => {
      if (o.id !== ordineId) return o;
      return {
        ...o,
        righe: o.righe.map(r => ({ ...r, arrivato_ok: true })),
      };
    }));
  };

  const confermaOrdine = async (o: Ordine) => {
    if (!ordineCompleto(o)) { alert("Flagga tutte le righe come arrivate prima di confermare"); return; }
    if (!o.ddt_numero) { alert("Inserisci numero DDT"); return; }
    setSaving(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const totReale = o.righe.reduce((s, r) => s + (r.qta_arrivata || 0) * (r.costo_reale || 0), 0);
      const scost = totReale - o.totale_stimato;
      const payload: any = {
        arrivato_at: new Date().toISOString(),
        ddt_numero: o.ddt_numero,
        ddt_data: o.ddt_data || null,
        fattura_numero: o.fattura_numero || null,
        importo_fatturato: o.importo_fatturato || null,
        scostamento_costo: scost,
        righe_verificate: o.righe.map(r => ({
          id: r.id,
          qta_arrivata: r.qta_arrivata,
          costo_reale: r.costo_reale,
          arrivato_ok: r.arrivato_ok,
          note: r.note || null,
        })),
        stato: "arrivato",
      };
      const { error } = await supabase.from("ordini_fornitore").update(payload).eq("id", o.id);
      if (error) { alert("Errore salvataggio: " + error.message); setSaving(false); return; }
      // Aggiorna locale
      setOrdini(prev => prev.map(x => x.id === o.id ? { ...x, arrivato_at: new Date().toISOString() } : x));
      setExpanded(prev => { const n = new Set(prev); n.delete(o.id); return n; });
      // Espandi prossimo ordine non arrivato
      const next = ordini.find(x => x.id !== o.id && !x.arrivato_at);
      if (next) setExpanded(prev => new Set([...prev, next.id]));
      // Se tutti arrivati, callback
      const ancoraDaFare = ordini.filter(x => x.id !== o.id && !x.arrivato_at).length;
      if (ancoraDaFare === 0 && typeof onCompletato === "function") {
        setTimeout(() => onCompletato(), 500);
      }
    } catch (e: any) {
      alert("Errore: " + (e?.message || e));
    }
    setSaving(false);
  };

  const fmtEur = (n: number) => "€ " + Number(n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const ordiniArrivati = ordini.filter(o => o.arrivato_at).length;
  const totOrdini = ordini.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: C.bg, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header sticky */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.dark, color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <button onClick={onCloseConSalva} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", padding: 4 }} title="Chiudi salvando le modifiche">&times;</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, letterSpacing: 1 }}>RICEZIONE MERCE</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>{commessaCode}</div>
        </div>
        <div style={{ display: "flex" as any, flexDirection: "column" as any, alignItems: "flex-end" as any, gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 800, padding: "6px 12px", borderRadius: 16, background: ordiniArrivati === totOrdini && totOrdini > 0 ? C.green : C.teal }}>
            {ordiniArrivati}/{totOrdini} arrivati
          </div>
          {ordiniArrivati > 0 && ordiniArrivati < totOrdini && (
            <div style={{ fontSize: 9, color: "#94A3B8" }}>Parziale: chiudi e torna quando arrivano gli altri</div>
          )}
        </div>
      </div>

      {/* Lista ordini */}
      <div style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: C.sub, padding: 40 }}>Caricamento ordini...</div>
        ) : ordini.length === 0 ? (
          <div style={{ textAlign: "center", color: C.sub, padding: 40 }}>Nessun ordine fornitore per questa commessa.</div>
        ) : (
          ordini.map(o => {
            const isExp = expanded.has(o.id);
            const arrivato = !!o.arrivato_at;
            const completo = ordineCompleto(o);
            const scost = scostamentoOrdine(o);
            return (
              <div key={o.id} style={{ background: C.card, borderRadius: 12, marginBottom: 12, border: "1.5px solid " + (arrivato ? C.green : C.border), overflow: "hidden" }}>
                {/* Header ordine */}
                <div onClick={() => toggleOrdine(o.id)} style={{ padding: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: arrivato ? C.green : completo ? C.amber : C.border, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>
                    {arrivato ? "✓" : completo ? "!" : "•"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.dark }}>{o.fornitore}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                      {o.numero} · {o.righe.length} righe · {fmtEur(o.totale_stimato)}
                    </div>
                    {arrivato && o.ddt_numero && (
                      <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginTop: 2 }}>DDT {o.ddt_numero}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 18, color: C.sub, transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</div>
                </div>

                {/* Body espanso */}
                {isExp && (
                  <div style={{ borderTop: "1px solid " + C.border, padding: 14, background: "#F8FBFB" }}>
                    {arrivato ? (
                      <div style={{ fontSize: 12, color: C.sub, padding: 8 }}>
                        Ordine già ricevuto · DDT {o.ddt_numero || "-"} · Importo fatturato {o.importo_fatturato != null ? fmtEur(o.importo_fatturato) : "-"}
                      </div>
                    ) : (
                      <>
                        {/* Righe */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: C.dark, textTransform: "uppercase", letterSpacing: 0.5 }}>Articoli ({o.righe.length})</div>
                          <button onClick={() => flagTutte(o.id)} style={{ fontSize: 10, fontWeight: 700, color: C.teal, background: "transparent", border: "1px solid " + C.teal, padding: "4px 10px", borderRadius: 6, cursor: "pointer" }}>Flagga tutte</button>
                        </div>
                        {o.righe.length === 0 ? (
                          <div style={{ background: "#FEF3C7", border: "1px solid " + C.amber, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#92400E", marginBottom: 6 }}>ORDINE PRODOTTO FINITO</div>
                          <div style={{ fontSize: 11, color: "#92400E", marginBottom: 10 }}>Conferma se il prodotto e arrivato e in buono stato. Poi inserisci DDT in fondo.</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: 10, borderRadius: 6, border: "1px solid " + C.border }}>
                            <input type="checkbox" checked={(o as any)._finitoOk || false} onChange={(e) => updateOrdine(o.id, "_finitoOk" as any, e.target.checked)} style={{ width: 22, height: 22, accentColor: C.green }} />
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>{(o as any)._finitoOk ? "Confermato arrivato e in buono stato" : "Conferma arrivo e qualita prodotto"}</div>
                          </div>
                        </div>
                        ) : o.righe.map(r => {
                          const scostRiga = ((r.qta_arrivata || 0) * (r.costo_reale || 0)) - (r.qta * (r.costo_unit || 0));
                          return (
                            <div key={r.id} style={{ background: r.arrivato_ok ? "#ECFDF5" : "#fff", border: "1px solid " + (r.arrivato_ok ? C.green : C.border), borderRadius: 8, padding: 10, marginBottom: 8 }}>
                              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                <input type="checkbox" checked={!!r.arrivato_ok} onChange={(e) => updateRiga(o.id, r.id, "arrivato_ok", e.target.checked)} style={{ width: 20, height: 20, accentColor: C.green, marginTop: 2, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: C.dark, marginBottom: 6 }}>{r.descrizione}</div>
                                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 2 }}>QTA ARRIVATA / {r.qta} {r.unita}</div>
                                      <input type="number" step="0.01" value={r.qta_arrivata != null ? r.qta_arrivata : r.qta} onChange={(e) => updateRiga(o.id, r.id, "qta_arrivata", Number(e.target.value))} style={{ width: "100%", padding: 8, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 2 }}>COSTO UNIT (prev {fmtEur(r.costo_unit || 0)})</div>
                                      <input type="number" step="0.01" value={r.costo_reale != null ? r.costo_reale : (r.costo_unit || 0)} onChange={(e) => updateRiga(o.id, r.id, "costo_reale", Number(e.target.value))} style={{ width: "100%", padding: 8, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                                    </div>
                                  </div>
                                  {Math.abs(scostRiga) > 0.01 && (
                                    <div style={{ fontSize: 10, fontWeight: 700, color: scostRiga > 0 ? C.red : C.green, marginTop: 4 }}>
                                      {scostRiga > 0 ? "↑" : "↓"} Scostamento: {fmtEur(Math.abs(scostRiga))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Totale + scostamento */}
                        {Math.abs(scost) > 0.01 && (
                          <div style={{ background: scost > 0 ? "#FEE2E2" : "#D1FAE5", border: "1px solid " + (scost > 0 ? C.red : C.green), borderRadius: 8, padding: 10, marginBottom: 12, fontSize: 12, fontWeight: 800, color: scost > 0 ? "#991B1B" : "#065F46" }}>
                            {scost > 0 ? "MAGGIORE COSTO" : "RISPARMIO"}: {fmtEur(Math.abs(scost))} ({((scost / o.totale_stimato) * 100).toFixed(1)}%)
                          </div>
                        )}

                        {/* DDT/fattura */}
                        <div style={{ marginTop: 12, padding: 10, background: "#fff", border: "1px solid " + C.border, borderRadius: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: C.dark, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Documenti ricezione</div>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 2 }}>NUMERO DDT *</div>
                              <input type="text" value={o.ddt_numero || ""} onChange={(e) => updateOrdine(o.id, "ddt_numero", e.target.value)} placeholder="es. DDT-12345" style={{ width: "100%", padding: 8, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 2 }}>DATA DDT</div>
                              <input type="date" value={o.ddt_data || ""} onChange={(e) => updateOrdine(o.id, "ddt_data", e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                            </div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 2 }}>N. FATTURA (opzionale)</div>
                              <input type="text" value={o.fattura_numero || ""} onChange={(e) => updateOrdine(o.id, "fattura_numero", e.target.value)} placeholder="es. FT-9876" style={{ width: "100%", padding: 8, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, marginBottom: 2 }}>IMPORTO FATT</div>
                              <input type="number" step="0.01" value={o.importo_fatturato != null ? o.importo_fatturato : ""} onChange={(e) => updateOrdine(o.id, "importo_fatturato", e.target.value === "" ? undefined : Number(e.target.value))} placeholder="0.00" style={{ width: "100%", padding: 8, border: "1px solid " + C.border, borderRadius: 6, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }} />
                            </div>
                          </div>
                        </div>

                        {/* Bottone conferma */}
                        <button onClick={() => confermaOrdine(o)} disabled={!completo || !o.ddt_numero || saving} style={{ width: "100%", padding: 14, marginTop: 12, borderRadius: 10, border: "none", background: completo && o.ddt_numero ? "linear-gradient(135deg, " + C.teal + " 0%, " + C.tealDk + " 100%)" : C.border, color: completo && o.ddt_numero ? "#fff" : C.sub, fontSize: 13, fontWeight: 900, cursor: completo && o.ddt_numero && !saving ? "pointer" : "not-allowed", fontFamily: "inherit", letterSpacing: 0.4 }}>
                          {saving ? "Salvataggio..." : !completo ? "Flagga tutte le righe" : !o.ddt_numero ? "Inserisci numero DDT" : "CONFERMA ORDINE ARRIVATO"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {ordiniArrivati === totOrdini && totOrdini > 0 && (
        <div style={{ position: "sticky", bottom: 0, padding: 16, background: C.green, color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 800 }}>
          ✓ TUTTI I MATERIALI ARRIVATI · Pronto per il montaggio
        </div>
      )}
    </div>
  );
}
