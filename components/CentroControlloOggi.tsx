// components/CentroControlloOggi.tsx
// Nuova vista intelligente: timeline verticale con urgenze + eventi + task + azioni commesse + denaro
"use client";
import React, { useMemo } from "react";
import { useMastro } from "./MastroContext";

const TH = {
  teal: "#28A0A0",
  tealBright: "#5FD0D0",
  tealDark: "#1A7A7A",
  ink: "#0D1F1F",
  inkLight: "#1A3535",
  sub: "#5A7878",
  bg: "#E4F2F2",
  surf: "#FFFFFF",
  border: "#C8E4E4",
  red: "#E24B4A",
  amber: "#F5A030",
  amberDeep: "#C97716",
  green: "#8BC443",
  greenDark: "#6A9A26",
  blue: "#3B7FE0",
  purple: "#7B6BA5",
};

const FM = "'JetBrains Mono', ui-monospace, monospace";

export default function CentroControlloOggi() {
  const ctx = useMastro() as any;
  const {
    cantieri = [],
    events = [],
    tasks = [],
    fattureDB = [],
    ordiniFornDB = [],
    montaggiDB = [],
    setSelectedCM,
    setSelectedTask,
    setSelectedEvent,
    setTab,
    setSelDate,
    setAgendaView,
  } = ctx;

  const oggi = new Date();
  const oggiISO = oggi.toISOString().split("T")[0];
  const oggiLbl = oggi.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }).toUpperCase();

  // ─── CALCOLO DATI ────────────────────────────
  const data = useMemo(() => {
    const gg = (d: string) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 0;

    // Eventi di oggi
    const eventiOggi = (events || []).filter((e: any) => {
      const d = (e.data || e.date || e.start || "").split("T")[0];
      return d === oggiISO;
    }).map((e: any) => ({
      id: `ev-${e.id}`,
      tipo: "evento",
      ora: e.ora || e.time || "00:00",
      titolo: e.titolo || e.title || "Evento",
      sub: e.luogo || e.cliente || "",
      colBg: "linear-gradient(145deg, rgba(95,208,208,0.2), rgba(40,160,160,0.1))",
      colBorder: "rgba(40,160,160,0.4)",
      colDot: TH.teal,
      icon: "calendar",
      raw: e,
    }));

    // Task di oggi
    const taskOggi = (tasks || []).filter((t: any) => {
      const d = (t.scadenza || t.data || "").split("T")[0];
      return d === oggiISO && !t.completata;
    }).map((t: any) => ({
      id: `tk-${t.id}`,
      tipo: "task",
      ora: t.ora || "—",
      titolo: t.titolo || "Task",
      sub: t.descrizione || "",
      colBg: "linear-gradient(145deg, rgba(245,160,48,0.18), rgba(201,119,22,0.08))",
      colBorder: "rgba(245,160,48,0.4)",
      colDot: TH.amberDeep,
      icon: "check",
      raw: t,
    }));

    // Montaggi di oggi
    const montOggi = (montaggiDB || []).filter((m: any) => m.data === oggiISO).map((m: any) => {
      const cm = cantieri.find((c: any) => c.id === m.cmId);
      return {
        id: `mo-${m.id}`,
        tipo: "montaggio",
        ora: m.ora || "08:00",
        titolo: `Montaggio ${cm?.cliente || ""}`,
        sub: cm?.indirizzo || "",
        colBg: "linear-gradient(145deg, rgba(139,196,67,0.2), rgba(106,154,38,0.1))",
        colBorder: "rgba(106,154,38,0.4)",
        colDot: TH.greenDark,
        icon: "tool",
        cm, raw: m,
      };
    });

    // Timeline ordinata per ora
    const impegniOggi = [...eventiOggi, ...taskOggi, ...montOggi].sort((a, b) => (a.ora || "").localeCompare(b.ora || ""));

    // ─── URGENZE ─────
    const urgenze: any[] = [];
    (cantieri || []).forEach((c: any) => {
      // Preventivo fermo
      const rilievi = c.rilievi || [];
      if (rilievi.length > 0 && !c.firmaCliente && rilievi[0]?.data) {
        const g = gg(rilievi[0].data);
        if (g > 7) urgenze.push({ cmId: c.id, cliente: c.cliente, txt: `Preventivo fermo da ${g}gg`, action: "Solleciti firma" });
      }
      // Fattura non incassata
      const fCm = (fattureDB || []).filter((f: any) => f.cmId === c.id && !f.pagata);
      fCm.forEach((f: any) => {
        if (f.data) {
          const g = gg(f.data);
          if (g > 10) urgenze.push({ cmId: c.id, cliente: c.cliente, txt: `Fattura #${f.numero} non incassata da ${g}gg`, action: "Sollecita" });
        }
      });
      // Ordine senza conferma
      const oCm = (ordiniFornDB || []).filter((o: any) => o.cmId === c.id && !o.conferma?.ricevuta);
      oCm.forEach((o: any) => {
        if (o.dataInvio) {
          const g = gg(o.dataInvio);
          if (g > 3) urgenze.push({ cmId: c.id, cliente: c.cliente, txt: `Ordine ${o.fornitore?.nome || ""} senza conferma da ${g}gg`, action: "Contatta" });
        }
      });
    });

    // ─── AZIONI COMMESSE (prossime azioni suggerite) ─────
    const azioni = (cantieri || []).filter((c: any) => c.fase !== "chiusura").slice(0, 8).map((c: any) => {
      const rilievi = c.rilievi || [];
      const vani = rilievi.flatMap((r: any) => r.vani || []);
      const hasRil = rilievi.length > 0;
      const hasVani = vani.length > 0;
      const hasPrezzi = vani.some((v: any) => v.prezzo > 0);
      const hasFirma = !!c.firmaCliente;
      const fCm = (fattureDB || []).filter((f: any) => f.cmId === c.id);
      const hasFatt = fCm.length > 0;
      const hasAcc = fCm.some((f: any) => f.pagata);
      const oCm = (ordiniFornDB || []).filter((o: any) => o.cmId === c.id);
      const hasOrd = oCm.length > 0;

      let action = "";
      if (!hasRil) action = "Esegui primo rilievo";
      else if (!hasVani) action = "Aggiungi vani";
      else if (!hasPrezzi) action = "Imposta prezzi";
      else if (!hasFirma) action = "Invia preventivo per firma";
      else if (!hasFatt) action = "Emetti fattura acconto";
      else if (!hasAcc) action = "Sollecita acconto";
      else if (!hasOrd) action = "Crea ordine fornitore";
      else action = "Pianifica montaggio";

      return { cm: c, action };
    });

    // ─── DENARO ─────
    const daIncassareOggi = (fattureDB || []).filter((f: any) => !f.pagata && f.scadenza === oggiISO).reduce((s: number, f: any) => s + (f.importo || 0), 0);
    const sett7 = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const daIncassareSett = (fattureDB || []).filter((f: any) => !f.pagata && f.scadenza && f.scadenza <= sett7 && f.scadenza >= oggiISO).reduce((s: number, f: any) => s + (f.importo || 0), 0);

    return { impegniOggi, urgenze, azioni, daIncassareOggi, daIncassareSett };
  }, [cantieri, events, tasks, fattureDB, ordiniFornDB, montaggiDB, oggiISO]);

  const { impegniOggi, urgenze, azioni, daIncassareOggi, daIncassareSett } = data;

  // Ora corrente per la linea ADESSO
  const nowMinutes = oggi.getHours() * 60 + oggi.getMinutes();
  const totImpegni = impegniOggi.length;

  // Click handlers
  const openEvent = (raw: any) => { setSelectedEvent?.(raw); setTab?.("agenda"); };
  const openTask = (raw: any) => { setSelectedTask?.(raw); setTab?.("agenda"); };
  const openCm = (c: any) => { setSelectedCM?.(c); setTab?.("commesse"); };

  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div style={{ padding: "0 12px 80px", background: TH.bg, minHeight: "100vh", fontFamily: "'Manrope', -apple-system, system-ui, sans-serif" }}>
      {/* ═══ HERO TEAL ═══ */}
      <div style={{
        background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
        borderRadius: 22, padding: "14px 16px",
        position: "relative", overflow: "hidden",
        boxShadow: "0 10px 26px rgba(31,120,120,0.35), inset 0 2px 3px rgba(255,255,255,0.3)",
        marginBottom: 12, marginTop: 8,
      }}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "2px" }}>OGGI</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px", marginTop: 1, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{oggiLbl}</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {urgenze.length > 0 && <span>🔴 {urgenze.length} urgenze</span>}
            <span>📅 {totImpegni} impegni</span>
            {daIncassareOggi > 0 && <span>💰 €{fmt(daIncassareOggi)}</span>}
          </div>
        </div>
      </div>

      {/* ═══ URGENZE ═══ */}
      {urgenze.length > 0 && (
        <div style={{
          background: "linear-gradient(145deg, rgba(226,75,74,0.12), rgba(226,75,74,0.04))",
          border: "1.5px solid rgba(226,75,74,0.3)",
          borderRadius: 16, padding: "12px 14px",
          marginBottom: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.red} strokeWidth="2.5" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div style={{ fontSize: 10, fontWeight: 900, color: TH.red, letterSpacing: "1px" }}>DA FARE SUBITO · {urgenze.length}</div>
          </div>
          {urgenze.slice(0, 5).map((u: any, i: number) => (
            <div key={i} onClick={() => { const c = cantieri.find((x: any) => x.id === u.cmId); if (c) openCm(c); }} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0", borderTop: i > 0 ? "1px solid rgba(226,75,74,0.15)" : "none",
              cursor: "pointer",
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: TH.red, boxShadow: `0 0 6px ${TH.red}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#C03030" }}>{u.cliente}</div>
                <div style={{ fontSize: 11, color: TH.red, fontWeight: 500 }}>{u.txt}</div>
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: TH.red, letterSpacing: "0.3px", textTransform: "uppercase" as const }}>{u.action} →</div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TIMELINE OGGI ═══ */}
      <div style={{
        background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
        borderRadius: 16, padding: "14px 14px 10px",
        marginBottom: 12,
        border: "1px solid rgba(200,228,228,0.5)",
        boxShadow: "0 6px 18px rgba(31,120,120,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(145deg, #DDEFEF, #BDE0E0)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TH.tealDark} strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: TH.ink, letterSpacing: "-0.2px" }}>Timeline di oggi</div>
          <div style={{ flex: 1 }} />
          <div style={{ padding: "3px 9px", borderRadius: 9, background: "linear-gradient(145deg, #0D1F1F, #1A3535)", color: TH.tealBright, fontSize: 10, fontWeight: 900, fontFamily: FM }}>{totImpegni}</div>
        </div>

        {totImpegni === 0 ? (
          <div style={{ padding: "20px 10px", textAlign: "center" as const, color: TH.sub, fontSize: 12 }}>
            Nessun impegno oggi · <span style={{ color: TH.teal, fontWeight: 700, cursor: "pointer" }} onClick={() => { setTab?.("agenda"); setAgendaView?.("giorno"); setSelDate?.(oggi); }}>Apri agenda</span>
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: 56 }}>
            {/* Linea verticale timeline */}
            <div style={{ position: "absolute", left: 48, top: 0, bottom: 0, width: 2, background: "rgba(200,228,228,0.6)" }} />
            {/* Linea ADESSO */}
            {impegniOggi.some((i: any) => {
              const [h, m] = (i.ora || "00:00").split(":").map(Number);
              return h * 60 + m > nowMinutes;
            }) && (
              <div style={{
                position: "absolute", left: 0, right: 0,
                top: `${Math.min((nowMinutes / (24 * 60)) * (impegniOggi.length * 60 + 10), impegniOggi.length * 65)}px`,
                height: 2, background: TH.red,
                boxShadow: `0 0 8px ${TH.red}`,
                zIndex: 3,
                display: "flex", alignItems: "center",
              }}>
                <span style={{ position: "absolute", left: 0, top: -8, fontSize: 9, fontWeight: 900, color: TH.red, background: TH.bg, padding: "2px 6px", borderRadius: 5, fontFamily: FM }}>
                  ADESSO · {oggi.toTimeString().slice(0,5)}
                </span>
              </div>
            )}

            {impegniOggi.map((it: any, idx: number) => (
              <div key={it.id}
                onClick={() => {
                  if (it.tipo === "evento") openEvent(it.raw);
                  else if (it.tipo === "task") openTask(it.raw);
                  else if (it.tipo === "montaggio" && it.cm) openCm(it.cm);
                }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer", position: "relative" }}>
                <div style={{ position: "absolute", left: -56, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, fontFamily: FM, color: TH.sub, width: 40, textAlign: "right" as const }}>{it.ora}</div>
                <div style={{ position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: it.colDot, boxShadow: `0 0 10px ${it.colDot}60`, border: "2px solid #fff", zIndex: 2 }} />
                <div style={{
                  flex: 1, padding: "10px 12px", borderRadius: 12,
                  background: it.colBg,
                  border: `1px solid ${it.colBorder}`,
                  boxShadow: "0 3px 10px rgba(31,120,120,0.08)",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>{it.titolo}</div>
                  {it.sub && <div style={{ fontSize: 10, color: TH.sub, marginTop: 2, fontWeight: 500 }}>{it.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ AZIONI COMMESSE ═══ */}
      {azioni.length > 0 && (
        <div style={{
          background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
          borderRadius: 16, padding: "14px 14px 10px",
          marginBottom: 12,
          border: "1px solid rgba(200,228,228,0.5)",
          boxShadow: "0 6px 18px rgba(31,120,120,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: "linear-gradient(145deg, #FFE4BC, #F5A030)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C97716" strokeWidth="2.5" strokeLinecap="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: TH.ink, letterSpacing: "-0.2px" }}>Prossime azioni</div>
            <div style={{ flex: 1 }} />
            <div style={{ padding: "3px 9px", borderRadius: 9, background: "linear-gradient(145deg, #C97716, #A35800)", color: "#fff", fontSize: 10, fontWeight: 900, fontFamily: FM }}>{azioni.length}</div>
          </div>
          {azioni.slice(0, 5).map((a: any, i: number) => (
            <div key={a.cm.id} onClick={() => openCm(a.cm)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0", borderTop: i > 0 ? "1px solid rgba(200,228,228,0.5)" : "none",
              cursor: "pointer",
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(145deg, #FFE4BC, #FFA94D)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 900, color: "#7A4000", fontFamily: FM }}>
                {a.cm.code?.replace("S-", "") || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: TH.ink }}>{a.cm.cliente} {a.cm.cognome || ""}</div>
                <div style={{ fontSize: 11, color: TH.amberDeep, fontWeight: 600, marginTop: 1 }}>→ {a.action}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.amberDeep} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {/* ═══ DENARO ═══ */}
      <div style={{
        background: "linear-gradient(145deg, #0D1F1F, #1A3535)",
        borderRadius: 16, padding: "14px 16px",
        marginBottom: 12,
        boxShadow: "0 8px 20px rgba(13,31,31,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TH.tealBright} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          <div style={{ fontSize: 12, fontWeight: 900, color: TH.tealBright, letterSpacing: "1px" }}>DENARO</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(95,208,208,0.6)", letterSpacing: "1px" }}>DA INCASSARE OGGI</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontFamily: FM, letterSpacing: "-0.5px", marginTop: 2 }}>€{fmt(daIncassareOggi)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(95,208,208,0.6)", letterSpacing: "1px" }}>7 GIORNI</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: TH.tealBright, fontFamily: FM, letterSpacing: "-0.5px", marginTop: 2 }}>€{fmt(daIncassareSett)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
