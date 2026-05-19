"use client";

import { useMemo } from "react";
import { useAgenda } from "@/hooks/useAgenda";

export function AssistenteAI() {
  const { eventi, kpiAlert } = useAgenda();

  const suggerimenti = useMemo(() => {
    const lista: { tipo: "rischio" | "opportunita" | "fornitore"; titolo: string; testo: string; suggerimento: string; ico: JSX.Element }[] = [];

    if (kpiAlert.ritardi > 0) {
      lista.push({
        tipo: "rischio",
        titolo: "Rischio ritardo",
        testo: `${kpiAlert.ritardi} interventi sono in ritardo.`,
        suggerimento: "Anticipa il prossimo montaggio · libera capacita squadra.",
        ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
      });
    }

    const oggi = new Date().toISOString().slice(0, 10);
    const eventiOggi = eventi.filter((e) => e.giorno === oggi);
    const oreOccupate = eventiOggi.length * 1.5;
    if (oreOccupate < 7) {
      lista.push({
        tipo: "opportunita",
        titolo: "Slot disponibili",
        testo: `Hai ~${(8 - oreOccupate).toFixed(1)}h libere fra le 14 e le 18.`,
        suggerimento: "Inserisci sopralluogo o intervento extra.",
        ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M13 2L3 14h7v8l10-12h-7z"/></svg>,
      });
    }

    const ordini = eventi.filter((e) => e.tipo === "ordine" && e.stato !== "completato");
    if (ordini.length > 0) {
      lista.push({
        tipo: "fornitore",
        titolo: "Fornitura in ritardo",
        testo: `${ordini.length} ordini in attesa di consegna.`,
        suggerimento: "Contatta il fornitore per conferma.",
        ico: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>,
      });
    }

    return lista;
  }, [eventi, kpiAlert]);

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "#F4F6F5", paddingBottom: 100 }}>
      {/* Header AI */}
      <div style={{
        padding: "16px 18px 14px",
        background: "linear-gradient(135deg, #2EBFA2 0%, #1E8080 50%, #155555 100%)",
        color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", opacity: 0.88 }}>
          Assistente AI
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: "rgba(255,255,255,0.18)", backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="6" width="16" height="14" rx="3"/>
              <circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/>
              <path d="M12 2v4M8 17h8"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>Mastro AI</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, opacity: 0.85, marginTop: 1 }}>Il tuo copilota operativo</div>
          </div>
        </div>
      </div>

      {/* Suggerimenti */}
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 8 }}>
          Oggi Mastro AI ti segnala
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {suggerimenti.map((s, i) => {
            const tone: Record<string, { bg: string; fg: string; border: string }> = {
              rischio:     { bg: "rgba(220,68,68,0.06)",  fg: "#7F1D1D", border: "#DC4444" },
              opportunita: { bg: "rgba(239,159,39,0.06)", fg: "#854F0B", border: "#EF9F27" },
              fornitore:   { bg: "rgba(55,138,221,0.06)", fg: "#1E3A6E", border: "#378ADD" },
            };
            const t = tone[s.tipo];
            return (
              <div key={i} style={{
                padding: "11px 12px", borderRadius: 12,
                background: t.bg,
                border: `1px solid ${t.border}33`, borderLeft: `3px solid ${t.border}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, color: t.border, marginBottom: 4 }}>
                  {s.ico}
                  <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 0.3, textTransform: "uppercase" }}>{s.titolo}</span>
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0F2525", letterSpacing: -0.1 }}>{s.testo}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: t.fg, marginTop: 3, lineHeight: 1.4 }}>
                  Suggerimento: {s.suggerimento}
                </div>
                <button type="button" style={{
                  marginTop: 8, padding: "5px 11px", borderRadius: 7, border: 0, cursor: "pointer",
                  background: t.border, color: "#fff",
                  fontSize: 9.5, fontWeight: 900, letterSpacing: 0.5, textTransform: "uppercase",
                  fontFamily: "inherit",
                  boxShadow: `0 2px 6px ${t.border}55`,
                }}>Agisci</button>
              </div>
            );
          })}
          {suggerimenti.length === 0 && (
            <div style={{ padding: 18, textAlign: "center", color: "#5A7878", fontSize: 11, fontWeight: 700 }}>
              Tutto sotto controllo
            </div>
          )}
        </div>
      </div>

      {/* Quick prompt */}
      <div style={{ padding: "0 14px 8px" }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: "#5A7878", letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 8 }}>
          Chiedi a Mastro AI
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
          {["Riorganizza la giornata","Quali sono le urgenze?","Mostra interventi redditizi","Suggerisci percorso"].map((q) => (
            <button key={q} type="button"
              style={{
                padding: "8px 10px", borderRadius: 9, border: 0, cursor: "pointer",
                background: "#fff", color: "#1E8080",
                fontSize: 10, fontWeight: 800, letterSpacing: 0.2,
                boxShadow: "0 2px 6px rgba(13,31,31,0.04), inset 0 0 0 1px rgba(40,160,160,0.3)",
                fontFamily: "inherit", textAlign: "left",
              }}>{q}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input placeholder="Scrivi a Mastro AI..."
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 11,
              border: "1px solid rgba(200,228,228,0.6)",
              background: "#fff", outline: "none",
              fontSize: 12, fontWeight: 600, color: "#0F2525",
              fontFamily: "inherit",
              boxShadow: "0 2px 6px rgba(13,31,31,0.04)",
            }}/>
          <button type="button" style={{
            width: 40, height: 40, borderRadius: 11, border: 0, cursor: "pointer",
            background: "linear-gradient(145deg, #28A0A0, #1E8080)",
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(40,160,160,0.4)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
