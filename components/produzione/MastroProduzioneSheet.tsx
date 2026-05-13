"use client";
import { useEffect, useMemo, useState } from "react";

type Props = {
  aziendaId: string;
  onClose: () => void;
  onApriCommessa?: (id: string) => void;
};

type Carico = {
  id: string;
  commessa_id: string;
  data_avvio: string;
  data_fine_prevista: string | null;
  vani_totali: number;
  priorita: number;
  stato: string;
  note: string | null;
  // Joined
  cm_code?: string;
  cm_cliente?: string;
  cm_fase?: string;
};

type Config = {
  capacita_giornaliera_vani: number;
  n_operai_produzione: number;
  n_postazioni_cnc: number;
  ora_inizio_giornata: string;
  ora_fine_giornata: string;
  giorni_lavorativi: number[];
};

const C = {
  bg: "#EEF8F8", card: "#fff", dark: "#0D1F1F", teal: "#28A0A0", tealDk: "#1a6b6b",
  border: "#C8E4E4", sub: "#6A8484", navy: "#1E3A5F", amber: "#F59E0B",
  red: "#DC2626", green: "#10B981", textMuted: "#94A3B8",
};

const DOW_LBL = ["DOM", "LUN", "MAR", "MER", "GIO", "VEN", "SAB"];
const MESI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];

export default function MastroProduzioneSheet({ aziendaId, onClose, onApriCommessa }: Props) {
  const [carichi, setCarichi] = useState<Carico[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCarico, setSelectedCarico] = useState<Carico | null>(null);
  const [view, setView] = useState<"settimana" | "lista">("settimana");

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabase");
        const [{ data: cfg }, { data: car }] = await Promise.all([
          supabase.from("produzione_config").select("*").eq("azienda_id", aziendaId).maybeSingle(),
          supabase.from("produzione_carichi").select("*").eq("azienda_id", aziendaId).neq("stato", "annullato").order("data_avvio", { ascending: true }),
        ]);
        setConfig(cfg || { capacita_giornaliera_vani: 30, n_operai_produzione: 2, n_postazioni_cnc: 1, ora_inizio_giornata: "07:00", ora_fine_giornata: "17:00", giorni_lavorativi: [1,2,3,4,5] });
        const carichiList = car || [];
        const ids = carichiList.map((c: any) => c.commessa_id);
        if (ids.length > 0) {
          const { data: cms } = await supabase.from("commesse").select("id,code,cliente,fase").in("id", ids);
          const cmMap = new Map((cms || []).map((c: any) => [c.id, c]));
          const enriched = carichiList.map((c: any) => ({
            ...c,
            cm_code: cmMap.get(c.commessa_id)?.code,
            cm_cliente: cmMap.get(c.commessa_id)?.cliente,
            cm_fase: cmMap.get(c.commessa_id)?.fase,
          }));
          setCarichi(enriched);
        } else {
          setCarichi([]);
        }
      } catch (e) {
        console.error("[MastroProduzione]", e);
      }
      setLoading(false);
    })();
  }, [aziendaId]);

  // Genera settimana corrente (lunedi-domenica)
  const settimana = useMemo(() => {
    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    const dow = oggi.getDay();
    const lunOffset = dow === 0 ? -6 : 1 - dow;
    const lunedi = new Date(oggi);
    lunedi.setDate(lunedi.getDate() + lunOffset + (weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunedi);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const fmtISO = (d: Date) => d.toISOString().split("T")[0];
  const todayISO = useMemo(() => fmtISO(new Date()), []);

  // Carichi per giorno
  const carichiPerGiorno = useMemo(() => {
    const map = new Map<string, Carico[]>();
    settimana.forEach(d => map.set(fmtISO(d), []));
    carichi.forEach(c => {
      const start = new Date(c.data_avvio + "T12:00:00");
      const end = c.data_fine_prevista ? new Date(c.data_fine_prevista + "T12:00:00") : start;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = fmtISO(d);
        if (map.has(iso)) {
          map.get(iso)!.push(c);
        }
      }
    });
    return map;
  }, [carichi, settimana]);

  const capacita = config?.capacita_giornaliera_vani || 30;
  const giorniLavorativi = config?.giorni_lavorativi || [1,2,3,4,5];

  const carichGiorno = (iso: string) => carichiPerGiorno.get(iso) || [];
  const vaniGiorno = (iso: string) => carichGiorno(iso).reduce((s, c) => s + (c.vani_totali || 0), 0);
  const pctGiorno = (iso: string) => Math.min(150, (vaniGiorno(iso) / capacita) * 100);
  const colorePct = (p: number) => p < 60 ? C.green : p < 90 ? C.amber : C.red;

  const rangeLbl = settimana[0].getDate() + " " + MESI[settimana[0].getMonth()] + " - " + settimana[6].getDate() + " " + MESI[settimana[6].getMonth()];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: C.bg, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.dark, color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", padding: 4 }}>&times;</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.7, letterSpacing: 1 }}>MASTRO PRODUZIONE</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Calendario carichi officina</div>
        </div>
      </div>

      {/* View switcher */}
      <div style={{ padding: "12px 16px 0", display: "flex", gap: 8 }}>
        <button onClick={() => setView("settimana")} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1.5px solid " + (view === "settimana" ? C.teal : C.border), background: view === "settimana" ? C.teal : "#fff", color: view === "settimana" ? "#fff" : C.dark, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>CALENDARIO</button>
        <button onClick={() => setView("lista")} style={{ flex: 1, padding: 10, borderRadius: 8, border: "1.5px solid " + (view === "lista" ? C.teal : C.border), background: view === "lista" ? C.teal : "#fff", color: view === "lista" ? "#fff" : C.dark, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>LISTA</button>
      </div>

      <div style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <div style={{ textAlign: "center", color: C.sub, padding: 40 }}>Caricamento carichi...</div>
        ) : view === "settimana" ? (
          <>
            {/* Navigazione settimana */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, background: C.card, padding: 10, borderRadius: 10, border: "1.5px solid " + C.border }}>
              <button onClick={() => setWeekOffset(weekOffset - 1)} style={{ width: 36, height: 36, border: "1px solid " + C.border, borderRadius: 8, background: "#fff", color: C.teal, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>&lt;</button>
              <div style={{ textAlign: "center" as any }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.dark }}>{rangeLbl}</div>
                {weekOffset !== 0 && (
                  <button onClick={() => setWeekOffset(0)} style={{ fontSize: 10, color: C.teal, background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline", marginTop: 2 }}>Settimana corrente</button>
                )}
              </div>
              <button onClick={() => setWeekOffset(weekOffset + 1)} style={{ width: 36, height: 36, border: "1px solid " + C.border, borderRadius: 8, background: "#fff", color: C.teal, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>&gt;</button>
            </div>

            {/* Calendario - 7 giorni in colonna */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {settimana.map(d => {
                const iso = fmtISO(d);
                const dow = d.getDay();
                const lavorativo = giorniLavorativi.includes(dow === 0 ? 7 : dow);
                const isToday = iso === todayISO;
                const carichi = carichGiorno(iso);
                const pct = pctGiorno(iso);
                const vani = vaniGiorno(iso);
                return (
                  <div key={iso} style={{ background: C.card, borderRadius: 10, border: "1.5px solid " + (isToday ? C.teal : C.border), overflow: "hidden", opacity: lavorativo ? 1 : 0.5 }}>
                    {/* Header giorno */}
                    <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: carichi.length > 0 ? "1px solid " + C.border : "none", background: isToday ? "#F0FAFA" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 40, textAlign: "center" as any }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: isToday ? C.teal : C.sub }}>{DOW_LBL[dow]}</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: isToday ? C.teal : C.dark, lineHeight: 1 }}>{d.getDate()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: C.dark, fontWeight: 700 }}>
                            {!lavorativo ? "Festivo" : carichi.length === 0 ? "Libero" : carichi.length + " commess" + (carichi.length === 1 ? "a" : "e")}
                          </div>
                          <div style={{ fontSize: 10, color: C.sub, marginTop: 2 }}>{vani}/{capacita} vani</div>
                        </div>
                      </div>
                      {lavorativo && carichi.length > 0 && (
                        <div style={{ textAlign: "right" as any }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: colorePct(pct) }}>{pct.toFixed(0)}%</div>
                          <div style={{ fontSize: 8, color: C.sub, fontWeight: 700, textTransform: "uppercase" as any }}>{pct < 60 ? "OK" : pct < 90 ? "PIENO" : "SOVRACCARICO"}</div>
                        </div>
                      )}
                    </div>
                    {/* Barra capacita */}
                    {lavorativo && (
                      <div style={{ height: 4, background: "#E2E8F0", overflow: "hidden" as any }}>
                        <div style={{ height: "100%", width: Math.min(100, pct) + "%", background: colorePct(pct), transition: "width 0.3s" }} />
                      </div>
                    )}
                    {/* Lista commesse del giorno */}
                    {carichi.length > 0 && (
                      <div style={{ padding: 8 }}>
                        {carichi.map(c => (
                          <div key={c.id} onClick={() => setSelectedCarico(c)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", marginBottom: 4, background: "#F8FBFB", borderRadius: 6, cursor: "pointer", border: "1px solid " + C.border }}>
                            <div style={{ width: 3, height: 28, background: c.stato === "in_corso" ? C.amber : c.stato === "completato" ? C.green : C.navy, borderRadius: 2, flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: C.dark }}>{c.cm_code} &middot; {c.cm_cliente}</div>
                              <div style={{ fontSize: 9, color: C.sub, marginTop: 1 }}>{c.vani_totali} vani &middot; pri.{c.priorita}{c.stato !== "pianificato" ? " &middot; " + c.stato : ""}</div>
                            </div>
                            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer riepilogo settimana */}
            <div style={{ marginTop: 16, padding: 12, background: C.card, borderRadius: 10, border: "1.5px solid " + C.border, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={{ textAlign: "center" as any }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase" as any }}>SETTIMANA</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginTop: 2 }}>{settimana.reduce((s, d) => s + vaniGiorno(fmtISO(d)), 0)}</div>
                <div style={{ fontSize: 9, color: C.sub }}>vani tot.</div>
              </div>
              <div style={{ textAlign: "center" as any }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase" as any }}>COMMESSE</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginTop: 2 }}>{new Set(settimana.flatMap(d => carichGiorno(fmtISO(d)).map(c => c.commessa_id))).size}</div>
                <div style={{ fontSize: 9, color: C.sub }}>uniche</div>
              </div>
              <div style={{ textAlign: "center" as any }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase" as any }}>CAPACITA</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.dark, marginTop: 2 }}>{capacita * giorniLavorativi.length}</div>
                <div style={{ fontSize: 9, color: C.sub }}>vani max</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Vista LISTA */}
            {carichi.length === 0 ? (
              <div style={{ textAlign: "center", color: C.sub, padding: 40, background: C.card, borderRadius: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Nessuna produzione pianificata</div>
                <div style={{ fontSize: 11 }}>Avvia produzione di una commessa dal triplo-gate.</div>
              </div>
            ) : carichi.map(c => (
              <div key={c.id} onClick={() => setSelectedCarico(c)} style={{ background: C.card, borderRadius: 10, padding: 12, marginBottom: 8, border: "1.5px solid " + C.border, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 4, height: 40, background: c.stato === "in_corso" ? C.amber : c.stato === "completato" ? C.green : C.navy, borderRadius: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: C.dark }}>{c.cm_code} &middot; {c.cm_cliente}</div>
                  <div style={{ fontSize: 11, color: C.sub, marginTop: 3 }}>
                    Inizio {new Date(c.data_avvio).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    {c.data_fine_prevista && " - Fine " + new Date(c.data_fine_prevista).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}
                    {" · " + c.vani_totali + " vani"}
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 10, background: c.stato === "in_corso" ? "#FEF3C7" : c.stato === "completato" ? "#D1FAE5" : "#F1F5F9", color: c.stato === "in_corso" ? "#92400E" : c.stato === "completato" ? "#065F46" : C.navy, textTransform: "uppercase" as any }}>{c.stato}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modal dettaglio carico */}
      {selectedCarico && (
        <div onClick={() => setSelectedCarico(null)} style={{ position: "fixed", inset: 0, zIndex: 100000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "16px 16px 0 0", padding: 20, width: "100%", maxWidth: 600, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.dark, marginBottom: 4 }}>{selectedCarico.cm_code} &middot; {selectedCarico.cm_cliente}</div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 16 }}>
              {new Date(selectedCarico.data_avvio).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              {selectedCarico.data_fine_prevista && " - " + new Date(selectedCarico.data_fine_prevista).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 10, background: "#F8FBFB", borderRadius: 8, border: "1px solid " + C.border }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase" as any }}>VANI</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{selectedCarico.vani_totali}</div>
              </div>
              <div style={{ padding: 10, background: "#F8FBFB", borderRadius: 8, border: "1px solid " + C.border }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: "uppercase" as any }}>PRIORITA</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.dark }}>{selectedCarico.priorita}/10</div>
              </div>
            </div>
            {selectedCarico.note && (
              <div style={{ padding: 10, background: "#FEF3C7", borderRadius: 8, fontSize: 11, color: "#92400E", marginBottom: 16 }}>{selectedCarico.note}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSelectedCarico(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid " + C.border, background: "#fff", color: C.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Chiudi</button>
              {onApriCommessa && (
                <button onClick={() => { onApriCommessa(selectedCarico.commessa_id); onClose(); }} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, " + C.navy + " 0%, " + C.dark + " 100%)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>APRI COMMESSA</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
