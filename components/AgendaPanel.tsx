"use client";
// @ts-nocheck
// MASTRO ERP - AgendaPanel v5 - Mastro Mente + calendario mese pieno + task
import React from "react";
import { useMastro } from "./MastroContext";

// === COLORI PER TIPO EVENTO (coerenti col resto dell'app) ===
const FASE: any = {
  sopralluogo: { bg: "#EEEDFE", fg: "#26215C", pill: "#3C3489", short: "Sopr." },
  rilievo:     { bg: "#EEEDFE", fg: "#26215C", pill: "#3C3489", short: "Riliev." },
  preventivo:  { bg: "#E1F5EE", fg: "#04342C", pill: "#0F6E56", short: "Prev." },
  firma:       { bg: "#FAEEDA", fg: "#412402", pill: "#854F0B", short: "Firma" },
  conferma:    { bg: "#FAEEDA", fg: "#412402", pill: "#854F0B", short: "Conf." },
  ordini:      { bg: "#FAEEDA", fg: "#412402", pill: "#854F0B", short: "Ord." },
  produzione:  { bg: "#B5D4F4", fg: "#042C53", pill: "#185FA5", short: "Prod." },
  consegna:    { bg: "#EAF3DE", fg: "#173404", pill: "#3B6D11", short: "Cons." },
  posa:        { bg: "#F4C0D1", fg: "#4B1528", pill: "#993556", short: "Mont." },
  montaggio:   { bg: "#F4C0D1", fg: "#4B1528", pill: "#993556", short: "Mont." },
  collaudo:    { bg: "#F4C0D1", fg: "#4B1528", pill: "#993556", short: "Coll." },
  task:        { bg: "#FAEEDA", fg: "#412402", pill: "#854F0B", short: "Task" },
  evento:      { bg: "#EEEDFE", fg: "#26215C", pill: "#3C3489", short: "Eve." },
};
const faseOf = (ev: any) => {
  const t = (ev?.tipo || ev?.categoria || "evento").toString().toLowerCase();
  return FASE[t] || FASE.evento;
};

const PRIO: any = {
  alta:  { bg: "#FCEBEB", fg: "#501313", pill: "#A32D2D", label: "ALTA" },
  media: { bg: "#FFFFFF", fg: "#1A1A1A", pill: "#854F0B", pillBg: "#FAEEDA", pillFg: "#854F0B", label: "MEDIA" },
  bassa: { bg: "#FFFFFF", fg: "#1A1A1A", pill: "#0F6E56", pillBg: "#E1F5EE", pillFg: "#0F6E56", label: "BASSA" },
};

export default function AgendaPanel(props: any) {
  const m: any = (() => { try { return useMastro(); } catch { return {}; } })();
  const events: any[]   = props?.events   || m?.events   || [];
  const tasks: any[]    = props?.tasks    || m?.tasks    || [];
  const cantieri: any[] = props?.cantieri || m?.cantieri || m?.commesse || [];
  const onNavigate = props?.onNavigate || m?.onNavigate || (() => {});
  const setTab = m?.setTab || (() => {});
  const setSelectedCM = m?.setSelectedCM || (() => {});

  // === STATE ===
  const [view, setView]   = React.useState<"giorno" | "settimana" | "mese" | "task">("mese");
  const [calDate, setCalDate] = React.useState(() => new Date());
  const [menteOpen, setMenteOpen] = React.useState(false);
  const [filterTipo, setFilterTipo] = React.useState<string>("tutti");
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().split("T")[0];

  // === DATA BUCKETS ===
  const allItems: any[] = React.useMemo(() => {
    const out: any[] = [];
    (events || []).forEach((e: any) => {
      out.push({
        id: "e-" + (e.id || Math.random()),
        tipo: (e.tipo || "evento").toLowerCase(),
        titolo: e.titolo || e.text || e.nome || "Evento",
        codice: e.commessaCode || e.cm || e.codice || "",
        data: e.data || e.date || "",
        ora: e.ora || e.time || "",
        durata: e.durata || "",
        source: "event",
        raw: e,
      });
    });
    (tasks || []).forEach((t: any) => {
      out.push({
        id: "t-" + (t.id || Math.random()),
        tipo: "task",
        titolo: t.text || t.titolo || t.descrizione || "Task",
        codice: t.cm || t.commessaCode || "",
        data: t.data || t.date || "",
        ora: t.ora || t.time || "",
        priorita: (t.priority || t.priorita || "media").toLowerCase(),
        done: !!t.done,
        source: "task",
        raw: t,
      });
    });
    return out;
  }, [events, tasks]);

  // Eventi per giorno (ISO date)
  const byDay = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    allItems.forEach(it => {
      if (!it.data) return;
      (map[it.data] = map[it.data] || []).push(it);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a,b) => (a.ora || "99").localeCompare(b.ora || "99"));
    });
    return map;
  }, [allItems]);

  // Task oggi
  const tasksOggi = React.useMemo(() => {
    return allItems.filter(i => i.source === "task" && (i.data === todayStr || !i.data));
  }, [allItems, todayStr]);

  const nEvents = allItems.filter(i => i.source === "event").length;
  const nTasks  = allItems.filter(i => i.source === "task").length;
  const scaduti = allItems.filter(i => i.source === "task" && i.data && i.data < todayStr && !i.done).length;

  // MASTRO MENTE (alert mock - in attesa di logica reale)
  const menteAlerts: any[] = React.useMemo(() => {
    // Reale: qui andranno algoritmi meteo/conflitti/materiali.
    const out: any[] = [];
    // Esempio 1: evento montaggio prossimo giorno con tipo produzione non ancora completa
    out.push({ tipo: "danger", icon: "warning", title: "Ven 24 pioggia forte", sub: "Sposta montaggi esterni" });
    out.push({ tipo: "warning", icon: "clock", title: "Marco impegnato giovedì 30", sub: "Scegli Luigi?" });
    out.push({ tipo: "success", icon: "spark", title: "Slot ottimale prossimo montaggio", sub: "Martedì 28 · sole · squadra libera" });
    return out;
  }, []);
  const menteColor: any = {
    danger:  { bg: "#FCEBEB", fg: "#501313", sub: "#A32D2D", iconBg: "rgba(255,255,255,0.6)" },
    warning: { bg: "#FAEEDA", fg: "#412402", sub: "#854F0B", iconBg: "rgba(255,255,255,0.6)" },
    success: { bg: "#E1F5EE", fg: "#04342C", sub: "#0F6E56", iconBg: "rgba(255,255,255,0.7)" },
  };
  const MenteIcon = ({ name, color }: any) => {
    if (name === "warning")
      return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    if (name === "clock")
      return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}><path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
  };

  // === CALENDARIO MESE ===
  const calMonth = calDate.getMonth();
  const calYear = calDate.getFullYear();
  const monthLabel = calDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const monthDays: Date[] = React.useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1; // lunedì = 0
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(calYear, calMonth, 1 - startDay + i);
      days.push(d);
    }
    return days;
  }, [calYear, calMonth]);

  const navMese = (delta: number) => setCalDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return d; });

  const openDay = (dIso: string) => {
    setView("giorno");
    setCalDate(new Date(dIso));
  };

  // === STRIP GIORNI (settimana corrente) ===
  const weekStrip: Date[] = React.useMemo(() => {
    const d = new Date(today);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(x.getDate() + i); return x; });
  }, [today]);

  // === RENDER ===

  const iso = (d: Date) => d.toISOString().split("T")[0];

  const renderCell = (d: Date) => {
    const sameMonth = d.getMonth() === calMonth;
    const isToday = iso(d) === todayStr;
    const isSun = d.getDay() === 0;
    const items = byDay[iso(d)] || [];
    const visibile = items.slice(0, 3);
    const nascosti = items.length - visibile.length;

    if (items.length === 0) {
      return (
        <div key={iso(d)} onClick={() => openDay(iso(d))} style={{ minHeight: 82, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: !sameMonth ? "#DDD" : (isSun ? "#E24B4A" : "#1A1A1A"), fontWeight: isToday ? 800 : 400, opacity: !sameMonth ? 0.5 : 1, cursor: "pointer" }}>
          {d.getDate()}
        </div>
      );
    }

    const bgCell = isToday ? "#28A0A0" : FASE[items[0].tipo]?.bg || "#EEEDFE";
    const txtDay = isToday ? "#FFFFFF" : FASE[items[0].tipo]?.fg || "#1A1A1A";

    return (
      <div key={iso(d)} onClick={() => openDay(iso(d))} style={{ background: bgCell, borderRadius: 8, padding: 4, minHeight: 82, display: "flex", flexDirection: "column", gap: 2, color: txtDay, boxShadow: isToday ? "0 2px 8px rgba(40,160,160,0.3)" : "none", cursor: "pointer", opacity: !sameMonth ? 0.5 : 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: isToday ? 13 : 12, fontWeight: isToday ? 800 : 700, lineHeight: 1 }}>{d.getDate()}</div>
          {isToday && <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 3, padding: "1px 4px", fontSize: 6, fontWeight: 700 }}>OGGI</div>}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {visibile.map((it: any, idx: number) => {
            const f = FASE[it.tipo] || FASE.evento;
            const box = isToday ? f.bg : "#FFFFFF";
            const txt = isToday ? f.fg : "#1A1A1A";
            const sub = isToday ? f.pill : "#666";
            return (
              <div key={it.id || idx} style={{ background: box, borderRadius: 4, padding: "2px 3px" }}>
                <div style={{ fontSize: 7, fontWeight: 700, lineHeight: 1.1, color: txt }}>{(it.ora || "").slice(0, 5)} {f.short}</div>
                {it.codice && <div style={{ fontSize: 6, fontWeight: 600, lineHeight: 1.1, opacity: 0.85, color: sub }}>{it.codice}</div>}
              </div>
            );
          })}
          {nascosti > 0 && (
            <div style={{ background: isToday ? "rgba(255,255,255,0.25)" : "#3C3489", borderRadius: 4, padding: "2px 3px", textAlign: "center" }}>
              <div style={{ fontSize: 7, fontWeight: 700, color: "#FFF" }}>+{nascosti} altri</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: "#F4F1EA", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", paddingBottom: 100 }}>

      {/* HEADER TEAL CAPSULA */}
      <div style={{ padding: "12px 10px 0" }}>
        <div style={{ background: "linear-gradient(135deg, #28A0A0 0%, #1E8080 100%)", padding: "14px 16px", borderRadius: 22, boxShadow: "0 4px 16px rgba(40,160,160,0.18)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 500, letterSpacing: 0.5 }}>PIANIFICAZIONE</div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
            </div>
          </div>
          <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>Agenda</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
            <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 500 }}>{nEvents} eventi</div>
            <div style={{ color: "rgba(255,255,255,0.6)" }}>·</div>
            <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 500 }}>{nTasks} task</div>
            {scaduti > 0 && (<>
              <div style={{ color: "rgba(255,255,255,0.6)" }}>·</div>
              <div style={{ background: "#FF7B4D", color: "#FFF", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 8 }}>{scaduti} SCADUTI</div>
            </>)}
          </div>
          {/* VIEW SWITCHER */}
          <div style={{ display: "flex", gap: 4, marginTop: 12, background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: 3 }}>
            {(["giorno","settimana","mese","task"] as const).map(v => (
              <div key={v} onClick={() => setView(v)} style={{ flex: 1, textAlign: "center", padding: 7, borderRadius: 10, fontSize: 11, fontWeight: view === v ? 700 : 500, background: view === v ? "#FFFFFF" : "transparent", color: view === v ? "#28A0A0" : "rgba(255,255,255,0.85)", cursor: "pointer", textTransform: "capitalize" }}>{v}</div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA NUOVO EVENTO / TASK */}
      <div style={{ padding: "10px 12px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div onClick={() => onNavigate?.("nuovo-evento")} style={{ background: "#B5B0E8", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#26215C" strokeWidth={2.5}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#26215C", fontWeight: 700 }}>Nuovo evento</div>
            <div style={{ fontSize: 9, color: "#3C3489", opacity: 0.8 }}>Appuntamento</div>
          </div>
        </div>
        <div onClick={() => onNavigate?.("nuovo-task")} style={{ background: "#FAC775", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#412402" strokeWidth={2.5}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#412402", fontWeight: 700 }}>Nuovo task</div>
            <div style={{ fontSize: 9, color: "#854F0B", opacity: 0.85 }}>Cose da fare</div>
          </div>
        </div>
      </div>

      {/* MASTRO MENTE (accordion) */}
      <div style={{ padding: "10px 12px 0" }}>
        <div onClick={() => setMenteOpen(!menteOpen)} style={{ background: "linear-gradient(135deg, #0D1F1F 0%, #1A3838 100%)", padding: "11px 13px", borderRadius: menteOpen ? "14px 14px 0 0" : 14, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, #42D0DC, #28A0A0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><path d="M12 2 2 7l10 5 10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "#28A0A0", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>MASTRO MENTE</div>
            <div style={{ fontSize: 12, color: "#FFF", fontWeight: 600, marginTop: 1 }}>{menteAlerts.filter(a => a.tipo !== "success").length} alert · {menteAlerts.filter(a => a.tipo === "success").length} suggerimenti</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5} style={{ transform: menteOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6" /></svg>
        </div>
        {menteOpen && (
          <div style={{ background: "rgba(13,31,31,0.04)", borderLeft: "3px solid #28A0A0", borderRight: "3px solid #28A0A0", borderBottom: "3px solid #28A0A0", borderRadius: "0 0 14px 14px", padding: 8 }}>
            {menteAlerts.map((a: any, i: number) => {
              const c = menteColor[a.tipo];
              return (
                <div key={i} style={{ background: c.bg, borderRadius: 10, padding: "10px 12px", marginBottom: i < menteAlerts.length - 1 ? 5 : 0, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: c.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MenteIcon name={a.icon} color={c.sub} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: c.fg, fontWeight: 700 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: c.sub, marginTop: 1 }}>{a.sub}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c.sub} strokeWidth={2.5}><path d="m9 18 6-6-6-6" /></svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* STRIP GIORNI */}
      <div style={{ padding: "10px 12px 0" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {weekStrip.map((d, i) => {
            const isTod = iso(d) === todayStr;
            const isSun = d.getDay() === 0;
            const items = byDay[iso(d)] || [];
            return (
              <div key={i} onClick={() => openDay(iso(d))} style={{ background: isTod ? "#28A0A0" : "#FFFFFF", border: isTod ? "none" : "1px solid #F0EDE5", borderRadius: 14, padding: "8px 10px", textAlign: "center", minWidth: 48, flexShrink: 0, boxShadow: isTod ? "0 4px 12px rgba(40,160,160,0.3)" : "none", cursor: "pointer" }}>
                <div style={{ fontSize: 9, color: isTod ? "rgba(255,255,255,0.85)" : (isSun ? "#E24B4A" : "#888"), fontWeight: isTod ? 700 : 600, textTransform: "uppercase" }}>{isTod ? "OGGI" : d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 3)}</div>
                <div style={{ fontSize: 16, color: isTod ? "#FFF" : (isSun ? "#E24B4A" : "#1A1A1A"), fontWeight: isTod ? 700 : 600, marginTop: 1 }}>{d.getDate()}</div>
                {items.length > 0 && !isTod && (
                  <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 3 }}>
                    {items.slice(0, 3).map((it: any, k: number) => (
                      <div key={k} style={{ width: 3, height: 3, background: (FASE[it.tipo] || FASE.evento).pill, borderRadius: 50 }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTRI CHIPS */}
      <div style={{ padding: "10px 12px 0", display: "flex", gap: 6, overflowX: "auto" }}>
        {([
          { id: "tutti", label: `Tutti · ${allItems.length}`, bg: "#0D1F1F", fg: "#FFF" },
          { id: "sopralluogo", label: "Sopralluogo", bg: "#EEEDFE", fg: "#3C3489" },
          { id: "montaggio", label: "Montaggio", bg: "#F4C0D1", fg: "#4B1528" },
          { id: "task", label: "Task", bg: "#FAEEDA", fg: "#412402" },
          { id: "consegna", label: "Consegna", bg: "#EAF3DE", fg: "#173404" },
        ]).map(c => (
          <div key={c.id} onClick={() => setFilterTipo(c.id)} style={{ background: filterTipo === c.id ? c.bg : "#FFFFFF", color: filterTipo === c.id ? c.fg : "#666", border: filterTipo === c.id ? "none" : "1px solid #F0EDE5", padding: "6px 11px", borderRadius: 14, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer" }}>{c.label}</div>
        ))}
      </div>

      {/* === VIEW MESE === */}
      {view === "mese" && (
        <>
          <div style={{ padding: "12px 14px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div onClick={() => navMese(-1)} style={{ cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2.5}><path d="m15 18-6-6 6-6" /></svg>
              </div>
              <div style={{ fontSize: 16, color: "#1A1A1A", fontWeight: 600, textTransform: "capitalize" }}>{monthLabel}</div>
              <div onClick={() => navMese(1)} style={{ cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth={2.5}><path d="m9 18 6-6-6-6" /></svg>
              </div>
            </div>
            <div onClick={() => setCalDate(new Date())} style={{ fontSize: 10, color: "#28A0A0", fontWeight: 600, cursor: "pointer" }}>Oggi</div>
          </div>

          <div style={{ padding: "0 12px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 12, border: "1px solid #F0EDE5" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 6, background: "#F4F1EA", borderRadius: 8, padding: "6px 3px" }}>
                {["L","M","M","G","V","S","D"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", fontSize: 10, color: i === 6 ? "#E24B4A" : "#1A1A1A", fontWeight: 700 }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {monthDays.map(d => renderCell(d))}
              </div>
            </div>
          </div>

          {/* TASK OGGI sotto al calendario */}
          <div style={{ padding: "14px 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, color: "#1A1A1A", fontWeight: 600 }}>Task oggi</div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>{tasksOggi.filter(t => !t.done).length} da fare · {tasksOggi.filter(t => t.done).length} completate</div>
            </div>
            <div style={{ background: "#FAEEDA", color: "#854F0B", padding: "5px 10px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{tasksOggi.filter(t => t.done).length}/{tasksOggi.length}</div>
          </div>
          <div style={{ padding: "0 12px" }}>
            {tasksOggi.length === 0 && <div style={{ background: "#FFFFFF", border: "1px dashed #E0DCD0", borderRadius: 14, padding: 14, textAlign: "center", fontSize: 11, color: "#888" }}>Nessun task oggi</div>}
            {tasksOggi.map((t: any) => {
              const p = PRIO[t.priorita] || PRIO.media;
              return (
                <div key={t.id} style={{ background: t.done ? "#EAF3DE" : (p.bg || "#FFFFFF"), borderRadius: 14, padding: "10px 12px", marginBottom: 5, display: "flex", alignItems: "center", gap: 10, border: t.done ? "none" : (t.priorita === "alta" ? "none" : "1px solid #F0EDE5"), opacity: t.done ? 0.75 : 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, border: t.done ? "none" : `2px solid ${t.priorita === "alta" ? "#A32D2D" : "#CCC"}`, background: t.done ? "#3B6D11" : "#FFFFFF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: t.done ? "#173404" : (p.fg || "#1A1A1A"), fontWeight: 600, textDecoration: t.done ? "line-through" : "none" }}>{t.titolo}</div>
                    {t.codice && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{t.codice}</div>}
                  </div>
                  {!t.done && (
                    <div style={{ background: p.priorita === "media" ? "#FAEEDA" : (p.priorita === "bassa" ? "#E1F5EE" : "#A32D2D"), color: t.priorita === "alta" ? "#FFF" : (p.pillFg || p.pill), fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>{p.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* === VIEW GIORNO === */}
      {view === "giorno" && (
        <div style={{ padding: "14px 12px" }}>
          <div style={{ fontSize: 18, color: "#1A1A1A", fontWeight: 600, textTransform: "capitalize", padding: "0 2px 10px" }}>{calDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</div>
          {(byDay[iso(calDate)] || []).length === 0 && <div style={{ background: "#FFFFFF", border: "1px dashed #E0DCD0", borderRadius: 14, padding: 20, textAlign: "center", fontSize: 12, color: "#888" }}>Nessun evento questo giorno</div>}
          {(byDay[iso(calDate)] || []).map((it: any) => {
            const f = FASE[it.tipo] || FASE.evento;
            return (
              <div key={it.id} style={{ background: f.bg, borderRadius: 14, padding: "12px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ minWidth: 40, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: f.pill, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{calDate.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 3)}</div>
                  <div style={{ fontSize: 26, color: f.fg, fontWeight: 700, lineHeight: 1, marginTop: 1 }}>{calDate.getDate()}</div>
                </div>
                <div style={{ flex: 1, borderLeft: `1px solid ${f.pill}33`, paddingLeft: 14 }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 13, color: f.fg, fontWeight: 600 }}>{it.titolo}</div>
                    <div style={{ fontSize: 11, color: f.pill, fontWeight: 600 }}>{it.ora || ""}</div>
                  </div>
                  <div style={{ fontSize: 11, color: f.pill, marginTop: 3, opacity: 0.85 }}>{it.codice}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === VIEW SETTIMANA === */}
      {view === "settimana" && (
        <div style={{ padding: "14px 12px" }}>
          {weekStrip.map(d => {
            const items = byDay[iso(d)] || [];
            const isTod = iso(d) === todayStr;
            return (
              <div key={iso(d)} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: isTod ? "#28A0A0" : "#1A1A1A", fontWeight: 700, marginBottom: 6, padding: "0 2px", textTransform: "capitalize" }}>{d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" })}{isTod && " · OGGI"}</div>
                {items.length === 0 && <div style={{ fontSize: 11, color: "#BBB", padding: "6px 2px" }}>—</div>}
                {items.map((it: any) => {
                  const f = FASE[it.tipo] || FASE.evento;
                  return (
                    <div key={it.id} style={{ background: f.bg, borderRadius: 12, padding: "10px 12px", marginBottom: 5, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 11, color: f.pill, fontWeight: 700, minWidth: 42 }}>{(it.ora || "").slice(0, 5)}</div>
                      <div style={{ flex: 1, fontSize: 12, color: f.fg, fontWeight: 600 }}>{it.titolo}</div>
                      {it.codice && <div style={{ fontSize: 10, color: f.pill, fontWeight: 600 }}>{it.codice}</div>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* === VIEW TASK === */}
      {view === "task" && (
        <div style={{ padding: "14px 12px" }}>
          {allItems.filter(i => i.source === "task").length === 0 && <div style={{ background: "#FFFFFF", border: "1px dashed #E0DCD0", borderRadius: 14, padding: 20, textAlign: "center", fontSize: 12, color: "#888" }}>Nessun task</div>}
          {allItems.filter(i => i.source === "task").map((t: any) => {
            const p = PRIO[t.priorita] || PRIO.media;
            const scaduto = t.data && t.data < todayStr && !t.done;
            return (
              <div key={t.id} style={{ background: t.done ? "#EAF3DE" : (scaduto ? "#FCEBEB" : "#FFFFFF"), borderRadius: 14, padding: "10px 12px", marginBottom: 5, display: "flex", alignItems: "center", gap: 10, border: t.done || scaduto ? "none" : "1px solid #F0EDE5", opacity: t.done ? 0.75 : 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, border: t.done ? "none" : `2px solid ${scaduto ? "#A32D2D" : "#CCC"}`, background: t.done ? "#3B6D11" : "#FFFFFF", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {t.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: t.done ? "#173404" : (scaduto ? "#501313" : "#1A1A1A"), fontWeight: 600, textDecoration: t.done ? "line-through" : "none" }}>{t.titolo}</div>
                  <div style={{ fontSize: 10, color: scaduto ? "#A32D2D" : "#666", marginTop: 2, fontWeight: scaduto ? 600 : 400 }}>
                    {scaduto ? "Scaduto · " : ""}{t.data || "senza data"}{t.codice ? " · " + t.codice : ""}
                  </div>
                </div>
                {!t.done && <div style={{ background: t.priorita === "alta" ? "#A32D2D" : (t.priorita === "bassa" ? "#E1F5EE" : "#FAEEDA"), color: t.priorita === "alta" ? "#FFF" : (t.priorita === "bassa" ? "#0F6E56" : "#854F0B"), fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 6 }}>{p.label}</div>}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
