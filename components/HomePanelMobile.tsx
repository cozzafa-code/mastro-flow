"use client";
// @ts-nocheck
// MASTRO ERP - HomePanel MOBILE - fliwoX Widget Home v4 (mockup approvato)
import React from "react";
import { useMastro } from "./MastroContext";
import BottomToolbar from "./BottomToolbar";

export default function HomePanelMobile(props: any) {
  const mastro: any = (() => { try { return useMastro(); } catch { return {}; } })();
  const user = props?.user || mastro?.user || {};
  const commesse: any[] = props?.commesse || mastro?.commesse || [];
  const onNavigate = props?.onNavigate || mastro?.onNavigate || (() => {});
  const onApriCommessa = props?.onApriCommessa || mastro?.onApriCommessa || (() => {});

  const now = React.useMemo(() => new Date(), []);
  const greeting = React.useMemo(() => {
    const h = now.getHours();
    if (h < 12) return "BUONGIORNO";
    if (h < 18) return "BUON POMERIGGIO";
    return "BUONASERA";
  }, [now]);
  const dataLunga = now.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  const nome = (user?.nome || user?.email?.split("@")[0] || "FABIO").toString().toUpperCase();
  const iniziali = nome.slice(0, 2);

  const commesseAttive = (commesse || []).filter((c: any) => c?.stato !== "archiviata" && c?.stato !== "fatturata");
  const recenti = (commesseAttive || []).slice(0, 3);
  const taskOggi = recenti.length;

  const totMese = (commesseAttive || []).reduce((s: number, c: any) => s + Number(c?.totale || c?.importo || 0), 0);
  const totMeseK = totMese >= 1000 ? `€${(totMese / 1000).toFixed(1)}k` : `€${Math.round(totMese)}`;

  const faseColors: any = {
    Sopralluogo: { bg: "#EEEDFE", fg: "#3C3489" },
    Preventivo:  { bg: "#E1F5EE", fg: "#0F6E56" },
    Conferma:    { bg: "#FAEEDA", fg: "#854F0B" },
    Produzione:  { bg: "#B5D4F4", fg: "#185FA5" },
    Montaggio:   { bg: "#F4C0D1", fg: "#993556" },
    Fattura:     { bg: "#C0DD97", fg: "#3B6D11" },
  };
  const faseCol = (f: string) => faseColors[f] || { bg: "#F0EDE5", fg: "#666" };

  const DragDots = ({ c }: { c: string }) => (
    <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 1, opacity: 0.55 }}>
      <div style={{ width: 3, height: 3, background: c, borderRadius: 50 }} />
      <div style={{ width: 3, height: 3, background: c, borderRadius: 50 }} />
      <div style={{ width: 3, height: 3, background: c, borderRadius: 50 }} />
    </div>
  );

  return (
    <div style={{ background: "#F4F1EA", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: 100 }}>

      {/* HEADER TEAL */}
      <div style={{ background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)", padding: "18px 16px 22px", borderRadius: "0 0 20px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth={3}><path d="M18 6L6 18M6 6l12 12" /></svg>
            </div>
            <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 500 }}>fliwoX</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: 50, background: "#FFB84D" }} />
            <div style={{ width: 6, height: 6, borderRadius: 50, background: "#7FD97F" }} />
            <div style={{ width: 34, height: 34, borderRadius: 50, background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#28A0A0", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{iniziali}</div>
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 400, letterSpacing: 0.5 }}>{greeting}</div>
        <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, marginTop: 2, letterSpacing: -0.5 }}>{nome}</div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2, textTransform: "capitalize" }}>{dataLunga}</div>
      </div>

      <div style={{ padding: 14 }}>

        {/* EDIT BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 2px" }}>
          <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 500 }}>I miei widget</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ background: "#FFFFFF", border: "1px solid #E0DCD0", borderRadius: 12, padding: "6px 10px", fontSize: 11, fontWeight: 500, color: "#1A1A1A", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              Aggiungi
            </button>
            <button style={{ background: "#28A0A0", border: "none", borderRadius: 12, padding: "6px 10px", fontSize: 11, fontWeight: 500, color: "#FFF", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
              Modifica
            </button>
          </div>
        </div>

        {/* WIDGET 1: OGGI DEVI FARE (viola) */}
        <div style={{ background: "#B5B0E8", borderRadius: 20, padding: "14px 16px", marginBottom: 10, position: "relative" }}>
          <DragDots c="#26215C" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 28 }}>
            <div>
              <div style={{ fontSize: 11, color: "#3C3489", fontWeight: 500, letterSpacing: 0.3 }}>OGGI DEVI FARE</div>
              <div style={{ fontSize: 16, color: "#26215C", fontWeight: 600, marginTop: 3 }}>{taskOggi} task urgenti</div>
              <div style={{ fontSize: 10, color: "#3C3489", marginTop: 2 }}>Sopralluogo · Firma · Fattura</div>
            </div>
            <div style={{ background: "#FFFFFF", borderRadius: 50, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#26215C" strokeWidth={2.5}><path d="M7 17L17 7M17 7H9M17 7v8" /></svg>
            </div>
          </div>
        </div>

        {/* WIDGET 2+3: METRICHE */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <div style={{ background: "#F5C4B3", borderRadius: 18, padding: 14, position: "relative" }}>
            <DragDots c="#712B13" />
            <div style={{ fontSize: 10, color: "#712B13", fontWeight: 500, letterSpacing: 0.3 }}>IN CORSO</div>
            <div style={{ fontSize: 28, color: "#4A1B0C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{commesseAttive.length}</div>
            <div style={{ fontSize: 10, color: "#712B13", marginTop: 4 }}>commesse attive</div>
          </div>
          <div style={{ background: "#9FE1CB", borderRadius: 18, padding: 14, position: "relative" }}>
            <DragDots c="#085041" />
            <div style={{ fontSize: 10, color: "#085041", fontWeight: 500, letterSpacing: 0.3 }}>FATTURATO</div>
            <div style={{ fontSize: 28, color: "#04342C", fontWeight: 600, marginTop: 6, lineHeight: 1 }}>{totMeseK}</div>
            <div style={{ fontSize: 10, color: "#085041", marginTop: 4 }}>questo mese</div>
          </div>
        </div>

        {/* WIDGET 4: PIPELINE (blu) */}
        <div onClick={() => onNavigate?.("commesse")} style={{ background: "#B5D4F4", borderRadius: 20, padding: 14, marginBottom: 10, position: "relative", cursor: "pointer" }}>
          <DragDots c="#0C447C" />
          <div style={{ fontSize: 11, color: "#185FA5", fontWeight: 500, letterSpacing: 0.3 }}>PIPELINE</div>
          <div style={{ fontSize: 14, color: "#042C53", fontWeight: 600, marginTop: 2, marginBottom: 10 }}>Distribuzione per fase</div>
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 40, marginBottom: 8 }}>
            {[40, 70, 100, 55, 30].map((h, i) => (
              <div key={i} style={{ flex: 1, background: "#378ADD", height: `${h}%`, borderRadius: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#0C447C", fontWeight: 500 }}>
            <span>Sopr.</span><span>Prev.</span><span>Prod.</span><span>Mont.</span><span>Fatt.</span>
          </div>
        </div>

        {/* WIDGET 5: LAVORI RECENTI (bianco) */}
        <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 14, marginBottom: 10, position: "relative" }}>
          <DragDots c="#888" />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: "#1A1A1A", fontWeight: 600 }}>Lavori recenti</div>
            <div style={{ fontSize: 10, color: "#28A0A0", fontWeight: 500, cursor: "pointer" }} onClick={() => onNavigate?.("commesse")}>Vedi tutti</div>
          </div>
          {recenti.length === 0 && (
            <div style={{ fontSize: 11, color: "#888", textAlign: "center", padding: "14px 0" }}>Nessuna commessa attiva</div>
          )}
          {recenti.map((c: any, idx: number) => {
            const fase = c?.fase_corrente || c?.stato || "Sopralluogo";
            const col = faseCol(fase);
            const imp = Number(c?.totale || c?.importo || 0);
            const impLabel = imp >= 1000 ? `€${(imp / 1000).toFixed(1)}k` : `€${Math.round(imp)}`;
            return (
              <div key={c?.id || idx} onClick={() => onApriCommessa?.(c?.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: idx < recenti.length - 1 ? "1px solid #F0EDE5" : "none", cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: col.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={col.fg} strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#1A1A1A", fontWeight: 600 }}>{c?.codice || `S-00${64 + idx}`} · {c?.cliente_nome || c?.cliente || "Cliente"}</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>{fase}</div>
                </div>
                <div style={{ fontSize: 11, color: "#1A1A1A", fontWeight: 600 }}>{impLabel}</div>
              </div>
            );
          })}
        </div>

        {/* WIDGET 6: AZIONI RAPIDE (ambra) */}
        <div style={{ background: "#FAC775", borderRadius: 20, padding: 14, position: "relative" }}>
          <DragDots c="#633806" />
          <div style={{ fontSize: 11, color: "#854F0B", fontWeight: 500, letterSpacing: 0.3, marginBottom: 10 }}>AZIONI RAPIDE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button onClick={() => onNavigate?.("nuova-commessa")} style={{ background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 11, color: "#412402", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>
              Nuova commessa
            </button>
            <button onClick={() => onNavigate?.("preventivi")} style={{ background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 11, color: "#412402", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
              Preventivo
            </button>
            <button onClick={() => onNavigate?.("contabilita")} style={{ background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 11, color: "#412402", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
              Fattura
            </button>
            <button onClick={() => onNavigate?.("clienti")} style={{ background: "rgba(255,255,255,0.6)", border: "none", borderRadius: 12, padding: "10px 8px", fontSize: 11, color: "#412402", fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2}><circle cx="12" cy="7" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
              Cliente
            </button>
          </div>
        </div>

      </div>
      <BottomToolbar active="home" onNavigate={onNavigate} />
    </div>
  );
}
