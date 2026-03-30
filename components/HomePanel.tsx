"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v6 — Design Lumina
import React, { useRef } from "react";
import { useMastro } from "./MastroContext";
import SpesaQuick from "./SpesaQuick";
import { FM, ICO, Ico, I } from "./mastro-constants";

// ── Lumina tokens ──────────────────────────────────────────
const L = {
  bg:      "#f9f9fb",
  surface: "#ffffff",
  low:     "#f3f3f5",
  navy:    "#031631",
  navyD:   "#1a2b47",
  muted:   "#8293b4",
  text:    "#1a1c1d",
  sub:     "#44474d",
  ghost:   "rgba(197,198,206,0.28)",
  green:   "#1a9e73",
  red:     "#dc4444",
  amber:   "#d4a843",
};
const sh = {
  card:  "0 1px 3px rgba(26,28,29,0.06), 0 8px 24px rgba(26,28,29,0.04)",
  navy:  "inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 20px rgba(3,22,49,0.35)",
  amber: "inset 0 1px 0 rgba(255,255,255,0.20), 0 6px 16px rgba(212,168,67,0.35)",
};
// ──────────────────────────────────────────────────────────

export default function HomePanel() {
  const {
    T, S, isDesktop, PIPELINE,
    cantieri, events, tasks, problemi,
    fattureDB, ordiniFornDB, montaggiDB,
    sogliaDays, dayOffset, setDayOffset,
    setTab, setFilterFase, setSelectedCM, setSelectedEvent,
    setSettingsTab, setShowContabilita, setShowProblemiView, setShowModal,
    getVaniAttivi, giorniFermaCM,
    today, activePlan, trialDaysLeft,
  } = useMastro();

  const [showSpesaHome, setShowSpesaHome] = React.useState(false);
  const [weekOffset, setWeekOffset] = React.useState(0);
  const touchStart = useRef({ x: 0, y: 0 });
  const [meteo, setMeteo] = React.useState(null);

  React.useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const res = await fetch(`https://wttr.in/${coords.latitude},${coords.longitude}?format=j1`);
        const data = await res.json();
        setMeteo({ temp: Math.round(Number(data.current_condition[0].temp_C)), citta: data.nearest_area[0].areaName[0].value });
      } catch {}
    }, () => {});
  }, []);

  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const SOGLIA = sogliaDays;
  const ferme = cantieri.filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= SOGLIA);
  const preventiviDaFare = cantieri.filter(c => c.fase === "preventivo");
  const misureInAttesa = cantieri.filter(c => c.fase === "misure" && getVaniAttivi(c).some(v => Object.keys(v.misure || {}).length < 4));
  const todayEvents = events.filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const taskUrgenti = tasks.filter(t => !t.done && t.priority === "alta");
  const problemiAperti = problemi.filter(p => p.stato !== "risolto");

  const getAdesso = () => {
    if (problemiAperti.length > 0) { const p = problemiAperti[0]; return { titolo: "Problema: " + (p.titolo || (p.descrizione || "").slice(0, 40)), sotto: problemiAperti.length + " problemi aperti", color: L.red, action: () => setShowProblemiView(true) }; }
    if (ferme.length > 0) { const c = ferme[0]; return { titolo: "Sblocca " + c.cliente, sotto: c.code + " · ferma da " + giorniFermaCM(c) + " giorni", color: L.red, action: () => { setSelectedCM(c); setTab("commesse"); } }; }
    if (preventiviDaFare.length > 0) { const c = preventiviDaFare[0]; return { titolo: "Invia preventivo a " + c.cliente, sotto: c.code + " · " + preventiviDaFare.length + " in attesa", color: "#6366f1", action: () => { setSelectedCM(c); setTab("commesse"); } }; }
    if (misureInAttesa.length > 0) { const c = misureInAttesa[0]; const tot = getVaniAttivi(c).length; const ok = getVaniAttivi(c).filter(v => Object.keys(v.misure || {}).length >= 4).length; return { titolo: "Completa misure " + c.cliente, sotto: ok + "/" + tot + " vani misurati", color: L.amber, action: () => { setSelectedCM(c); setTab("commesse"); } }; }
    if (taskUrgenti.length > 0) { const t = taskUrgenti[0]; return { titolo: t.text, sotto: t.meta || "Priorità alta", color: L.red, action: () => setTab("agenda") }; }
    if (todayEvents.length > 0) { const e = todayEvents[0]; return { titolo: e.text, sotto: (e.time || "—") + " · " + (e.persona || ""), color: e.color || L.navy, action: () => setSelectedEvent(e) }; }
    return null;
  };
  const adesso = getAdesso();

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
  const dayNames = ["L","M","M","G","V","S","D"];

  const getWeekForOffset = (wOff) => {
    const ref = new Date(today);
    const dow = ref.getDay();
    const mondayDelta = dow === 0 ? -6 : 1 - dow;
    ref.setDate(ref.getDate() + mondayDelta + wOff * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(ref); d.setDate(ref.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const offset = Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
      days.push({ date: d, day: d.getDate(), iso, offset, isToday: iso === todayISO, isWeekend: d.getDay() === 0 || d.getDay() === 6, eventCount: events.filter(e => e.date === iso).length });
    }
    return days;
  };

  const weekDays = getWeekForOffset(weekOffset);
  const weekMonth = MESI[weekDays[3]?.date.getMonth()] || "";
  const weekYear = weekDays[3]?.date.getFullYear() || today.getFullYear();
  const getDateForOffset = (off) => { const d = new Date(today); d.setDate(d.getDate() + off); return d; };
  const dayDate = getDateForOffset(dayOffset);
  const dayISO = dayDate.toISOString().split("T")[0];
  const dayEvents = events.filter(e => e.date === dayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const goToday = () => { setDayOffset(0); setWeekOffset(0); };

  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    const dx = touchStart.current.x - e.changedTouches[0].clientX;
    const dy = touchStart.current.y - e.changedTouches[0].clientY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const dir = dx > 0 ? 1 : -1;
      setWeekOffset(w => w + dir);
      const nw = getWeekForOffset(weekOffset + dir);
      if (!nw.some(d => d.offset === dayOffset)) setDayOffset(nw[0].offset);
    }
  };

  const fmtK = (n) => n > 999 ? "€" + Math.round(n / 1000) + "k" : "€" + n.toLocaleString("it-IT");

  return (
    <div style={{ background: L.bg, minHeight: "100%", paddingBottom: 100, fontFamily: "'Inter', sans-serif" }}>

      {/* HEADER */}
      <div style={{ padding: "20px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div suppressHydrationWarning style={{ fontSize: 28, fontWeight: 800, color: L.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{saluto}, Fabio</div>
          <div suppressHydrationWarning style={{ fontSize: 12, color: L.sub, marginTop: 4 }}>{today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
        </div>
        {meteo && (
          <div style={{ textAlign: "right", paddingTop: 2 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: L.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{meteo.temp}°</div>
            <div style={{ fontSize: 10, color: L.sub, fontWeight: 600, marginTop: 2 }}>{meteo.citta}</div>
          </div>
        )}
      </div>

      {/* TRIAL */}
      {activePlan === "trial" && (
        <div onClick={() => { setSettingsTab("piano"); setTab("settings"); }} style={{ margin: "14px 20px 0", padding: "12px 16px", borderRadius: 14, background: L.navyD, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span suppressHydrationWarning style={{ fontSize: 12, fontWeight: 600, color: L.muted }}>Trial · {trialDaysLeft} giorni rimasti</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>Attiva →</span>
        </div>
      )}
      {activePlan === "free" && (
        <div onClick={() => { setSettingsTab("piano"); setTab("settings"); }} style={{ margin: "14px 20px 0", padding: "12px 16px", borderRadius: 14, background: L.red + "12", border: "1px solid " + L.red + "30", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: L.red }}>Trial scaduto</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: L.red }}>Attiva →</span>
        </div>
      )}

      {/* ADESSO */}
      {adesso ? (
        <div onClick={adesso.action} style={{ margin: "14px 20px 0", background: "#fff", borderRadius: 18, border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: adesso.color }} />
          <div style={{ padding: "14px 16px 14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: adesso.color, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>Adesso</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: L.text, letterSpacing: "-0.01em", lineHeight: 1.3 }}>{adesso.titolo}</div>
              <div style={{ fontSize: 12, color: L.sub, marginTop: 3 }}>{adesso.sotto}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={L.sub} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      ) : (
        <div style={{ margin: "14px 20px 0", padding: "16px 18px", background: "#fff", borderRadius: 18, border: "1px solid " + L.ghost, boxShadow: sh.card, textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: L.green }}>✓ Tutto in ordine</div>
          <div style={{ fontSize: 12, color: L.sub, marginTop: 3 }}>Nessuna azione urgente</div>
        </div>
      )}

      {/* CALENDARIO */}
      <div style={{ margin: "16px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div onClick={() => setWeekOffset(w => w - 1)} style={{ width: 28, height: 28, borderRadius: 9999, background: L.low, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={L.sub} strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: L.text, letterSpacing: "-0.02em" }}>{weekMonth} {weekYear}</span>
            <div onClick={() => setWeekOffset(w => w + 1)} style={{ width: 28, height: 28, borderRadius: 9999, background: L.low, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={L.sub} strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          {weekOffset !== 0 && <span onClick={goToday} style={{ fontSize: 11, fontWeight: 700, color: L.navy, cursor: "pointer" }}>Oggi</span>}
        </div>
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {weekDays.map((d) => {
            const isSel = d.offset === dayOffset;
            return (
              <div key={d.iso} onClick={() => setDayOffset(d.offset)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: d.isWeekend ? L.amber : L.sub, letterSpacing: "0.06em" }}>{dayNames[(d.date.getDay() + 6) % 7]}</span>
                <div style={{ width: 34, height: 34, borderRadius: 9999, background: isSel ? L.navy : d.isToday ? L.navy + "12" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 14, fontWeight: isSel || d.isToday ? 800 : 400, color: isSel ? "#fff" : d.isToday ? L.navy : L.text }}>{d.day}</span>
                </div>
                {d.eventCount > 0 && (
                  <div style={{ display: "flex", gap: 2 }}>
                    {[...Array(Math.min(d.eventCount, 3))].map((_, i) => (
                      <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? L.muted : L.navy }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {dayEvents.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
            {dayEvents.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", borderRadius: 14, border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer" }}>
                <div style={{ width: 3, height: 32, borderRadius: 2, background: ev.color || L.navy, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: L.text }}>{ev.text}</div>
                  <div style={{ fontSize: 11, color: L.sub, marginTop: 2 }}>{ev.persona || ""}{ev.persona && ev.luogo ? " · " : ""}{ev.luogo || ""}</div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: L.sub, fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{ev.time || ""}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PIPELINE */}
      <div style={{ margin: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: L.sub, textTransform: "uppercase", letterSpacing: "0.12em" }}>Pipeline</span>
          <span onClick={() => setTab("commesse")} style={{ fontSize: 11, fontWeight: 700, color: L.navy, cursor: "pointer" }}>{totAttive} attive →</span>
        </div>
        {totAttive > 0 ? (
          <>
            <div style={{ display: "flex", height: 32, borderRadius: 10, overflow: "hidden", gap: 2 }}>
              {pipelineFasi.filter(f => faseCounts[f.id] > 0).map(f => (
                <div key={f.id} onClick={() => { setFilterFase(f.id); setTab("commesse"); }} style={{ flex: Math.max(faseCounts[f.id], 1), background: f.color, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: 8, minWidth: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", fontFamily: "'JetBrains Mono', monospace" }}>{faseCounts[f.id]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {pipelineFasi.filter(f => faseCounts[f.id] > 0).map(f => (
                <div key={f.id} onClick={() => { setFilterFase(f.id); setTab("commesse"); }} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 9999, background: f.color + "12", cursor: "pointer" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: f.color }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: L.sub }}>{f.nome}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: f.color, fontFamily: "'JetBrains Mono', monospace" }}>{faseCounts[f.id]}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: 16, textAlign: "center", background: L.low, borderRadius: 14 }}>
            <div style={{ fontSize: 12, color: L.sub }}>Nessuna commessa attiva</div>
          </div>
        )}
      </div>

      {/* KPI */}
      <div style={{ margin: "14px 20px 0", display: "flex", gap: 8 }}>
        {[
          { label: "Preventivato", val: fmtK(totPrev), color: L.text, action: () => setTab("commesse") },
          { label: "Confermato", val: fmtK(totConf), color: L.green, action: () => { setFilterFase("conferma"); setTab("commesse"); } },
          ...(fatAtt.length > 0 ? [{ label: "Da incassare", val: fmtK(totFat), color: L.red, action: () => setShowContabilita(true) }] : []),
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ flex: 1, padding: "12px 10px", background: "#fff", borderRadius: 14, border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer", textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: L.sub, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 17, fontWeight: 900, color: item.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.02em" }}>{item.val}</div>
          </div>
        ))}
      </div>

      {/* SCORCIATOIE */}
      <div style={{ margin: "8px 20px 0", display: "flex", gap: 8 }}>
        <div onClick={() => setTab("contabilita")} style={{ flex: 1, padding: "11px 14px", borderRadius: 14, background: "#fff", border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer", fontSize: 12, fontWeight: 700, color: L.sub, textAlign: "center" }}>€ Contabilità</div>
        <div onClick={() => setTab("montaggi_cal")} style={{ flex: 1, padding: "11px 14px", borderRadius: 14, background: L.green + "10", border: "1px solid " + L.green + "25", cursor: "pointer", fontSize: 12, fontWeight: 700, color: L.green, textAlign: "center" }}>Cantieri</div>
      </div>

      {/* QUICK LINKS */}
      {(ordAtt.length > 0 || montAtt.length > 0) && (
        <div style={{ margin: "8px 20px 0", display: "flex", gap: 8 }}>
          {ordAtt.length > 0 && (
            <div onClick={() => setTab("commesse")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "#fff", border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer" }}>
              <I d={ICO.package} s={18} c={L.navy} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: L.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{ordAtt.length}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: L.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Ordini attivi</div>
              </div>
            </div>
          )}
          {montAtt.length > 0 && (
            <div onClick={() => setTab("commesse")} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "#fff", border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer" }}>
              <I d={ICO.wrench} s={18} c={L.navy} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: L.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{montAtt.length}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: L.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Montaggi</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AZIONI RAPIDE */}
      <div style={{ margin: "14px 20px 0" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Azioni rapide</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div onClick={() => setShowModal("commessa")} style={{ padding: "16px 14px", borderRadius: 18, background: L.navy, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: sh.navy }}>
            <I d={ICO.folder} s={22} c="#fff" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Commessa</div>
              <div style={{ fontSize: 10, color: L.muted, marginTop: 1 }}>Nuova pratica</div>
            </div>
          </div>
          <div onClick={() => setShowSpesaHome(true)} style={{ padding: "16px 14px", borderRadius: 18, background: "#d4a843", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: sh.amber }}>
            <I d={ICO.receipt || ICO.tag} s={22} c="#fff" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Invia spesa</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>Scontrino / nota</div>
            </div>
          </div>
          <div onClick={() => setShowModal("contatto")} style={{ padding: "16px 14px", borderRadius: 18, background: "#fff", border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <I d={ICO.user} s={22} c={L.navy} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: L.text }}>Cliente</div>
              <div style={{ fontSize: 10, color: L.sub, marginTop: 1 }}>Nuovo contatto</div>
            </div>
          </div>
          <div onClick={() => setShowModal("evento")} style={{ padding: "16px 14px", borderRadius: 18, background: "#fff", border: "1px solid " + L.ghost, boxShadow: sh.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <I d={ICO.calendar} s={22} c="#6366f1" />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: L.text }}>Appuntamento</div>
              <div style={{ fontSize: 10, color: L.sub, marginTop: 1 }}>Agenda</div>
            </div>
          </div>
        </div>
      </div>

      {showSpesaHome && <SpesaQuick onClose={() => setShowSpesaHome(false)} />}
    </div>
  );
}
