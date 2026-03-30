"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v7 — Lumina Layout
import React, { useRef } from "react";
import { useMastro } from "./MastroContext";
import SpesaQuick from "./SpesaQuick";
import { ICO, I } from "./mastro-constants";

export default function HomePanel() {
  const {
    T, PIPELINE, cantieri, events, tasks, problemi,
    fattureDB, ordiniFornDB, montaggiDB,
    sogliaDays, dayOffset, setDayOffset,
    setTab, setFilterFase, setSelectedCM, setSelectedEvent,
    setSettingsTab, setShowContabilita, setShowProblemiView, setShowModal,
    getVaniAttivi, giorniFermaCM, today, activePlan, trialDaysLeft,
  } = useMastro();

  const [showSpesa, setShowSpesa] = React.useState(false);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const touch = useRef({ x: 0, y: 0 });

  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";

  const ferme = cantieri.filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= sogliaDays);
  const preventiviDaFare = cantieri.filter(c => c.fase === "preventivo");
  const problemiAperti = problemi.filter(p => p.stato !== "risolto");
  const todayEvents = events.filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  const adesso = (() => {
    if (problemiAperti.length > 0) return { titolo: "Problema: " + (problemiAperti[0].titolo || "da risolvere"), sotto: problemiAperti.length + " problemi aperti", color: "#dc4444", action: () => setShowProblemiView(true) };
    if (ferme.length > 0) { const c = ferme[0]; return { titolo: "Sblocca " + c.cliente, sotto: c.code + " · ferma da " + giorniFermaCM(c) + " giorni", color: "#dc4444", action: () => { setSelectedCM(c); setTab("commesse"); } }; }
    if (preventiviDaFare.length > 0) { const c = preventiviDaFare[0]; return { titolo: "Preventivo: " + c.cliente, sotto: preventiviDaFare.length + " in attesa", color: "#6366f1", action: () => { setSelectedCM(c); setTab("commesse"); } }; }
    if (todayEvents.length > 0) { const e = todayEvents[0]; return { titolo: e.text, sotto: (e.time || "") + (e.persona ? " · " + e.persona : ""), color: "#031631", action: () => setSelectedEvent(e) }; }
    return null;
  })();

  const pipelineFasi = (PIPELINE || []).filter(f => f.attiva);
  const faseCounts = {};
  pipelineFasi.forEach(f => { faseCounts[f.id] = cantieri.filter(c => c.fase === f.id).length; });
  const totAttive = cantieri.filter(c => c.fase !== "chiusura").length;
  const totPrev = cantieri.filter(c => c.euro && c.fase !== "chiusura").reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
  const totConf = cantieri.filter(c => c.confermato).reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
  const fatAtt = fattureDB.filter(f => !f.pagata);
  const totFat = fatAtt.reduce((s, f) => s + (f.importo || 0), 0);
  const ordAtt = ordiniFornDB.filter(o => o.stato !== "consegnato");
  const montAtt = montaggiDB.filter(m => m.stato !== "completato");

  const MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  const DN = ["L","M","M","G","V","S","D"];

  const getWeek = (wOff) => {
    const ref = new Date(today);
    const dow = ref.getDay();
    ref.setDate(ref.getDate() + (dow === 0 ? -6 : 1 - dow) + wOff * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(ref); d.setDate(ref.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const off = Math.round((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
      return { d, day: d.getDate(), iso, off, isToday: iso === todayISO, isWe: d.getDay() === 0 || d.getDay() === 6, evts: events.filter(e => e.date === iso).length };
    });
  };
  const week = getWeek(weekOffset);
  const wMonth = MESI[week[3]?.d.getMonth()] || "";
  const wYear = week[3]?.d.getFullYear() || today.getFullYear();
  const selISO = (() => { const d = new Date(today); d.setDate(d.getDate() + dayOffset); return d.toISOString().split("T")[0]; })();
  const selEvents = events.filter(e => e.date === selISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  const fmtK = (n) => "€" + (n > 999 ? Math.round(n / 1000) + "k" : n.toLocaleString("it-IT"));

  const onTS = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTE = (e) => {
    const dx = touch.current.x - e.changedTouches[0].clientX;
    const dy = touch.current.y - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const dir = dx > 0 ? 1 : -1;
      setWeekOffset(w => w + dir);
      const nw = getWeek(weekOffset + dir);
      if (!nw.some(d => d.off === dayOffset)) setDayOffset(nw[0].off);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#f9f9fb", minHeight: "100%", paddingBottom: 100 }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{ padding: "28px 20px 0" }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#75777e" }}>
          {today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 suppressHydrationWarning style={{ margin: "6px 0 0", fontSize: 34, fontWeight: 800, color: "#031631", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          {saluto}, Fabio
        </h1>
      </div>

      {/* ══ ADESSO ══════════════════════════════════════════════ */}
      {adesso && (
        <div onClick={adesso.action} style={{
          margin: "20px 20px 0",
          background: "#ffffff",
          borderRadius: 20,
          border: "1px solid rgba(197,198,206,0.3)",
          boxShadow: "0 2px 12px rgba(26,28,29,0.06)",
          overflow: "hidden",
          cursor: "pointer",
          display: "flex",
        }}>
          <div style={{ width: 4, background: adesso.color, flexShrink: 0 }} />
          <div style={{ padding: "16px 16px 16px 18px", flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: adesso.color }}>Adesso</p>
              <p style={{ margin: "5px 0 0", fontSize: 16, fontWeight: 700, color: "#1a1c1d", letterSpacing: "-0.01em" }}>{adesso.titolo}</p>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#44474d" }}>{adesso.sotto}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#75777e" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      )}

      {/* ══ CALENDARIO ══════════════════════════════════════════ */}
      <div style={{ margin: "24px 20px 0" }}>
        {/* Mese + nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#eeeef0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#44474d" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1c1d", letterSpacing: "-0.02em" }}>{wMonth} {wYear}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "#eeeef0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#44474d" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          {weekOffset !== 0 && <button onClick={() => { setWeekOffset(0); setDayOffset(0); }} style={{ border: "none", background: "none", fontSize: 12, fontWeight: 700, color: "#031631", cursor: "pointer", letterSpacing: "0.04em" }}>Oggi</button>}
        </div>

        {/* Griglia giorni */}
        <div onTouchStart={onTS} onTouchEnd={onTE} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {week.map((d) => {
            const isSel = d.iso === selISO;
            return (
              <div key={d.iso} onClick={() => setDayOffset(d.off)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: d.isWe ? "#e4c18c" : "#75777e" }}>{DN[(d.d.getDay() + 6) % 7]}</span>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: isSel ? "#031631" : d.isToday ? "#031631" + "15" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  <span style={{ fontSize: 15, fontWeight: isSel || d.isToday ? 800 : 400, color: isSel ? "#ffffff" : d.isToday ? "#031631" : "#1a1c1d" }}>{d.day}</span>
                </div>
                <div style={{ height: 4, display: "flex", gap: 2 }}>
                  {d.evts > 0 && [...Array(Math.min(d.evts, 3))].map((_, i) => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "#8293b4" : "#031631" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Eventi giorno selezionato */}
        {selEvents.length > 0 && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {selEvents.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 16px", background: "#ffffff", borderRadius: 16,
                border: "1px solid rgba(197,198,206,0.3)",
                boxShadow: "0 1px 4px rgba(26,28,29,0.05)",
                cursor: "pointer",
              }}>
                <div style={{ width: 3, height: 36, borderRadius: 2, background: ev.color || "#031631", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#1a1c1d" }}>{ev.text}</p>
                  {(ev.persona || ev.luogo) && <p style={{ margin: "3px 0 0", fontSize: 11, color: "#44474d" }}>{[ev.persona, ev.luogo].filter(Boolean).join(" · ")}</p>}
                </div>
                {ev.time && <span style={{ fontSize: 13, fontWeight: 700, color: "#44474d", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{ev.time}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ PIPELINE ════════════════════════════════════════════ */}
      <div style={{ margin: "24px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#75777e" }}>Pipeline</span>
          <span onClick={() => setTab("commesse")} style={{ fontSize: 12, fontWeight: 700, color: "#031631", cursor: "pointer" }}>{totAttive} attive →</span>
        </div>
        <div style={{ display: "flex", height: 36, borderRadius: 12, overflow: "hidden", gap: 3 }}>
          {pipelineFasi.filter(f => faseCounts[f.id] > 0).map(f => (
            <div key={f.id} onClick={() => { setFilterFase(f.id); setTab("commesse"); }}
              style={{ flex: Math.max(faseCounts[f.id], 1), background: f.color, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: 10, minWidth: 28 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{faseCounts[f.id]}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {pipelineFasi.filter(f => faseCounts[f.id] > 0).map(f => (
            <div key={f.id} onClick={() => { setFilterFase(f.id); setTab("commesse"); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 9999, background: f.color + "14", cursor: "pointer" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: f.color }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#44474d" }}>{f.nome}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: f.color, fontFamily: "'JetBrains Mono', monospace" }}>{faseCounts[f.id]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ KPI ═════════════════════════════════════════════════ */}
      <div style={{ margin: "16px 20px 0", display: "flex", gap: 10 }}>
        {[
          { label: "Preventivato", val: fmtK(totPrev), color: "#1a1c1d", action: () => setTab("commesse") },
          { label: "Confermato", val: fmtK(totConf), color: "#1a9e73", action: () => { setFilterFase("conferma"); setTab("commesse"); } },
          ...(fatAtt.length > 0 ? [{ label: "Da incassare", val: fmtK(totFat), color: "#dc4444", action: () => setShowContabilita(true) }] : []),
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ flex: 1, padding: "14px 10px", background: "#ffffff", borderRadius: 16, border: "1px solid rgba(197,198,206,0.3)", boxShadow: "0 1px 4px rgba(26,28,29,0.05)", cursor: "pointer", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#75777e" }}>{item.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 900, color: item.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em" }}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* ══ SCORCIATOIE ═════════════════════════════════════════ */}
      <div style={{ margin: "10px 20px 0", display: "flex", gap: 10 }}>
        <div onClick={() => setTab("contabilita")} style={{ flex: 1, padding: "13px 16px", borderRadius: 16, background: "#ffffff", border: "1px solid rgba(197,198,206,0.3)", boxShadow: "0 1px 4px rgba(26,28,29,0.05)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#44474d", textAlign: "center" }}>€ Contabilità</div>
        <div onClick={() => setTab("montaggi_cal")} style={{ flex: 1, padding: "13px 16px", borderRadius: 16, background: "#1a9e7310", border: "1px solid #1a9e7330", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#1a9e73", textAlign: "center" }}>Cantieri</div>
      </div>

      {/* ══ QUICK COUNTS ════════════════════════════════════════ */}
      {(ordAtt.length > 0 || montAtt.length > 0) && (
        <div style={{ margin: "10px 20px 0", display: "flex", gap: 10 }}>
          {ordAtt.length > 0 && (
            <div onClick={() => setTab("commesse")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "#ffffff", border: "1px solid rgba(197,198,206,0.3)", boxShadow: "0 1px 4px rgba(26,28,29,0.05)", cursor: "pointer" }}>
              <I d={ICO.package} s={20} c="#031631" />
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1a1c1d", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{ordAtt.length}</p>
                <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 700, color: "#75777e", textTransform: "uppercase", letterSpacing: "0.1em" }}>Ordini attivi</p>
              </div>
            </div>
          )}
          {montAtt.length > 0 && (
            <div onClick={() => setTab("commesse")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "#ffffff", border: "1px solid rgba(197,198,206,0.3)", boxShadow: "0 1px 4px rgba(26,28,29,0.05)", cursor: "pointer" }}>
              <I d={ICO.wrench} s={20} c="#031631" />
              <div>
                <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#1a1c1d", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{montAtt.length}</p>
                <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 700, color: "#75777e", textTransform: "uppercase", letterSpacing: "0.1em" }}>Montaggi</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ AZIONI RAPIDE ═══════════════════════════════════════ */}
      <div style={{ margin: "20px 20px 0" }}>
        <p style={{ margin: "0 0 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#75777e" }}>Azioni rapide</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

          {/* Commessa — navy */}
          <div onClick={() => setShowModal("commessa")} style={{
            padding: "18px 16px", borderRadius: 20,
            background: "#031631",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 24px rgba(3,22,49,0.30)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
            transition: "transform 0.12s", active: { transform: "scale(0.97)" }
          }}>
            <I d={ICO.folder} s={24} c="#ffffff" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>Commessa</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#8293b4" }}>Nuova pratica</p>
            </div>
          </div>

          {/* Spesa — amber */}
          <div onClick={() => setShowSpesa(true)} style={{
            padding: "18px 16px", borderRadius: 20,
            background: "#d4a843",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 24px rgba(212,168,67,0.30)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
          }}>
            <I d={ICO.receipt || ICO.tag} s={24} c="#ffffff" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em" }}>Invia spesa</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.65)" }}>Scontrino / nota</p>
            </div>
          </div>

          {/* Cliente — ghost */}
          <div onClick={() => setShowModal("contatto")} style={{
            padding: "18px 16px", borderRadius: 20,
            background: "#ffffff", border: "1px solid rgba(197,198,206,0.35)",
            boxShadow: "0 1px 4px rgba(26,28,29,0.05)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
          }}>
            <I d={ICO.user} s={24} c="#031631" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a1c1d", letterSpacing: "-0.01em" }}>Cliente</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#44474d" }}>Nuovo contatto</p>
            </div>
          </div>

          {/* Appuntamento — ghost */}
          <div onClick={() => setShowModal("evento")} style={{
            padding: "18px 16px", borderRadius: 20,
            background: "#ffffff", border: "1px solid rgba(197,198,206,0.35)",
            boxShadow: "0 1px 4px rgba(26,28,29,0.05)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
          }}>
            <I d={ICO.calendar} s={24} c="#6366f1" />
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#1a1c1d", letterSpacing: "-0.01em" }}>Appuntamento</p>
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "#44474d" }}>Agenda</p>
            </div>
          </div>
        </div>
      </div>

      {showSpesa && <SpesaQuick onClose={() => setShowSpesa(false)} />}
    </div>
  );
}
