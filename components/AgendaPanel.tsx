"use client";
// @ts-nocheck
// MASTRO ERP - AgendaPanel v6 - Navy 50/20 + cliente linkato + smart link
import React from "react";
import { useMastro } from "./MastroContext";

// ─── PALETTE NAVY 50/20 ──────────────────────────────────────────
const TH = {
  bgPage: "#94A3B8",
  bgCard: "#FFFFFF",
  bgCardAlt: "#F8FAFC",
  navy: "#1E3A5F",
  navyDark: "#0F1B2D",
  navyLight: "#2D5A87",
  navyMuted: "#475A75",
  navySoft: "#93B0CF",
  ink: "#0A1628",
  sub: "#475A75",
  subLight: "#94A3B8",
  border: "#CBD5E1",
  borderSoft: "#E2E8F0",
  bgPill: "#DBE6F1",
  ambra: "#92400E",
  ambraBg: "#FEF3C7",
  red: "#991B1B",
  redBg: "#FEE2E2",
  green: "#065F46",
  greenBg: "#ECFDF5",
};

// === COLORI PER TIPO EVENTO (palette navy + accenti) ===
const FASE: any = {
  sopralluogo: { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navy,      short: "Sopr." },
  rilievo:     { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navy,      short: "Riliev." },
  preventivo:  { bg: TH.ambraBg, fg: TH.ambra, pill: TH.ambra,     short: "Prev." },
  firma:       { bg: TH.ambraBg, fg: TH.ambra, pill: TH.ambra,     short: "Firma" },
  conferma:    { bg: TH.ambraBg, fg: TH.ambra, pill: TH.ambra,     short: "Conf." },
  ordini:      { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navyLight, short: "Ord." },
  produzione:  { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navyLight, short: "Prod." },
  consegna:    { bg: TH.greenBg, fg: TH.green, pill: TH.green,     short: "Cons." },
  posa:        { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navyLight, short: "Mont." },
  montaggio:   { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navyLight, short: "Mont." },
  collaudo:    { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navyMuted, short: "Coll." },
  task:        { bg: TH.ambraBg, fg: TH.ambra, pill: TH.ambra,     short: "Task" },
  evento:      { bg: TH.bgPill,  fg: TH.navy,  pill: TH.navy,      short: "Eve." },
};
const faseOf = (ev: any) => {
  const t = (ev?.tipo || ev?.categoria || "evento").toString().toLowerCase();
  return FASE[t] || FASE.evento;
};

const PRIO: any = {
  alta:  { bg: TH.redBg,    fg: TH.red,   label: "ALTA" },
  media: { bg: TH.ambraBg,  fg: TH.ambra, label: "MEDIA" },
  bassa: { bg: "#F1F5F9",   fg: TH.sub,   label: "BASSA" },
};

export default function AgendaPanel(props: any) {
  const m: any = useMastro();
  const events: any[]   = props?.events   || m?.events   || [];
  const tasks: any[]    = props?.tasks    || m?.tasks    || [];
  const cantieri: any[] = props?.cantieri || m?.cantieri || m?.commesse || [];
  const montaggiDB: any[] = props?.montaggiDB || m?.montaggiDB || [];
  const onNavigate = props?.onNavigate || m?.onNavigate || (() => {});
  const setTab = m?.setTab || (() => {});
  const setSelectedCM = m?.setSelectedCM || (() => {});

  // === STATE ===
  const [view, setView]   = React.useState<"giorno" | "settimana" | "mese" | "task">("mese");
  const [calDate, setCalDate] = React.useState(() => new Date());
  const [menteOpen, setMenteOpen] = React.useState(false);
  const [filterTipo, setFilterTipo] = React.useState<string>("tutti");
  const [showCreateMenu, setShowCreateMenu] = React.useState(false);
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
        cliente: e.cliente || e.clienteNome || "",
        data: e.data || e.date || "",
        ora: e.ora || e.time || "",
        durata: e.durata || "",
        indirizzo: e.indirizzo || "",
        squadra: e.squadra || e.assegnatoA || "",
        source: "event",
        raw: e,
      });
    });
    (tasks || []).forEach((t: any) => {
      out.push({
        id: "t-" + (t.id || Math.random()),
        tipo: t.cm || t.commessaCode ? "task-cm" : "task",
        titolo: t.text || t.titolo || t.descrizione || "Task",
        codice: t.cm || t.commessaCode || "",
        cliente: t.cliente || "",
        data: t.data || t.date || "",
        ora: t.ora || t.time || "",
        priorita: (t.priority || t.priorita || "media").toLowerCase(),
        done: !!t.done,
        source: "task",
        raw: t,
      });
    });
    (montaggiDB || []).forEach((mt: any) => {
      const cm = cantieri.find((c: any) => c.id === mt.commessa_id);
      out.push({
        id: "m-" + (mt.id || Math.random()),
        tipo: "montaggio",
        titolo: cm?.cliente || cm?.code || "Montaggio",
        codice: cm?.code || "",
        cliente: cm?.cliente || "",
        data: mt.data_montaggio || mt.data || "",
        ora: mt.ora_inizio ? String(mt.ora_inizio).slice(0,5) : "",
        durata: mt.ore_preventivate ? mt.ore_preventivate + "h" : "",
        indirizzo: cm?.indirizzo || "",
        squadra: Array.isArray(mt.squadra) ? mt.squadra.join(", ") : (mt.squadra || ""),
        stato: mt.stato || "",
        source: "montaggio",
        raw: mt,
      });
    });
    return out;
  }, [events, tasks, montaggiDB, cantieri]);

  const filteredItems = React.useMemo(() => {
    if (filterTipo === "tutti") return allItems;
    if (filterTipo === "eventi") return allItems.filter(i => i.source === "event");
    if (filterTipo === "task") return allItems.filter(i => i.source === "task");
    return allItems.filter(i => i.tipo === filterTipo);
  }, [allItems, filterTipo]);

  // Eventi per giorno (ISO date)
  const byDay = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredItems.forEach(it => {
      if (!it.data) return;
      (map[it.data] = map[it.data] || []).push(it);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a,b) => (a.ora || "99").localeCompare(b.ora || "99"));
    });
    return map;
  }, [filteredItems]);

  const tasksOggi = React.useMemo(() => {
    return allItems.filter(i => i.source === "task" && (i.data === todayStr || !i.data));
  }, [allItems, todayStr]);

  const nEvents = allItems.filter(i => i.source === "event").length;
  const nTasks  = allItems.filter(i => i.source === "task").length;
  const scaduti = allItems.filter(i => i.source === "task" && i.data && i.data < todayStr && !i.done).length;

  // MASTRO MENTE alert mock
  const menteAlerts: any[] = React.useMemo(() => {
    const out: any[] = [];
    out.push({ tipo: "danger",  icon: "warning", title: "Ven 24 pioggia forte", sub: "Sposta montaggi esterni" });
    out.push({ tipo: "warning", icon: "clock",   title: "Marco impegnato giovedì 30", sub: "Scegli Luigi?" });
    out.push({ tipo: "success", icon: "spark",   title: "Slot ottimale prossimo montaggio", sub: "Martedì 28 · sole · squadra libera" });
    return out;
  }, []);
  const menteColor: any = {
    danger:  { bg: TH.redBg,    fg: TH.red,   sub: TH.red },
    warning: { bg: TH.ambraBg,  fg: TH.ambra, sub: TH.ambra },
    success: { bg: TH.greenBg,  fg: TH.green, sub: TH.green },
  };
  const MenteIcon = ({ name, color }: any) => {
    if (name === "warning")
      return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    if (name === "clock")
      return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5}><path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
  };

  // === CALENDARIO MESE ===
  const calMonth = calDate.getMonth();
  const calYear = calDate.getFullYear();
  const monthLabel = calDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const monthDays: Date[] = React.useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1;
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(calYear, calMonth, 1 - startDay + i);
      days.push(d);
    }
    return days;
  }, [calYear, calMonth]);

  const navMese = (delta: number) => setCalDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + delta); return d; });
  const navWeek = (delta: number) => setCalDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + delta * 7); return d; });
  const navDay = (delta: number) => setCalDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + delta); return d; });

  const openDay = (dIso: string) => {
    setView("giorno");
    setCalDate(new Date(dIso));
  };

  // === STRIP GIORNI (settimana corrente) ===
  const weekStrip: Date[] = React.useMemo(() => {
    const d = new Date(calDate);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(x.getDate() + i); return x; });
  }, [calDate]);

  const iso = (d: Date) => d.toISOString().split("T")[0];

  const handleNew = (kind: string) => {
    setShowCreateMenu(false);
    onNavigate?.(kind);
  };

  // ============================================================
  // RENDER MESE CELL
  // ============================================================
  const renderCell = (d: Date) => {
    const sameMonth = d.getMonth() === calMonth;
    const isToday = iso(d) === todayStr;
    const isSun = d.getDay() === 0;
    const items = byDay[iso(d)] || [];
    const visibile = items.slice(0, 2);
    const nascosti = items.length - visibile.length;

    if (items.length === 0) {
      return (
        <div key={iso(d)} onClick={() => openDay(iso(d))} style={{
          minHeight: 64, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12,
          color: !sameMonth ? "#CBD5E1" : (isSun ? TH.red : TH.ink),
          fontWeight: isToday ? 800 : 500,
          opacity: !sameMonth ? 0.5 : 1, cursor: "pointer",
        }}>{d.getDate()}</div>
      );
    }

    const fasePrim = items[0].tipo;
    const f = FASE[fasePrim] || FASE.evento;
    const bgCell = isToday ? TH.navy : f.bg;
    const txtDay = isToday ? "#FFF" : f.fg;

    return (
      <div key={iso(d)} onClick={() => openDay(iso(d))} style={{
        background: bgCell, borderRadius: 8, padding: 4, minHeight: 64,
        display: "flex", flexDirection: "column", gap: 2, color: txtDay,
        boxShadow: isToday ? `0 2px 8px ${TH.navy}55` : "none",
        cursor: "pointer", opacity: !sameMonth ? 0.55 : 1,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: isToday ? 13 : 12, fontWeight: 700, lineHeight: 1 }}>{d.getDate()}</div>
          {isToday && <div style={{ background: "rgba(255,255,255,0.25)", borderRadius: 3, padding: "1px 4px", fontSize: 6, fontWeight: 800 }}>OGGI</div>}
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {visibile.map((it: any, idx: number) => {
            const ff = FASE[it.tipo] || FASE.evento;
            const box = isToday ? "rgba(255,255,255,0.25)" : "#FFF";
            const txt = isToday ? "#FFF" : ff.fg;
            return (
              <div key={it.id || idx} style={{ background: box, borderRadius: 4, padding: "2px 4px" }}>
                <div style={{ fontSize: 8, fontWeight: 800, lineHeight: 1.2, color: txt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(it.ora || "").slice(0, 5)} {ff.short}</div>
              </div>
            );
          })}
          {nascosti > 0 && (
            <div style={{ background: isToday ? "rgba(255,255,255,0.25)" : TH.navy, borderRadius: 4, padding: "1px 3px", textAlign: "center" }}>
              <div style={{ fontSize: 7, fontWeight: 800, color: "#FFF" }}>+{nascosti}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER ITEM CARD (unificato per giorno/settimana)
  // ============================================================
  const renderItemCard = (it: any) => {
    const f = FASE[it.tipo] || FASE.evento;
    const isTask = it.source === "task";
    const isTaskCM = isTask && !!it.codice;
    const p = PRIO[it.priorita] || PRIO.media;

    // Bordo verticale a sinistra
    const borderColor = isTask && !isTaskCM ? TH.subLight : f.pill;

    return (
      <div key={it.id} style={{
        background: TH.bgCard,
        borderRadius: 10,
        padding: 10,
        marginBottom: 6,
        display: "flex", alignItems: "flex-start", gap: 10,
        boxShadow: "0 2px 6px rgba(15,23,42,0.08)",
        position: "relative",
        overflow: "hidden",
        opacity: it.done ? 0.55 : 1,
      }}>
        {/* Bordo verticale */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
          background: isTask && !isTaskCM
            ? "repeating-linear-gradient(45deg, " + TH.subLight + ", " + TH.subLight + " 4px, rgba(15,23,42,0.15) 4px, rgba(15,23,42,0.15) 8px)"
            : borderColor,
        }} />

        {isTask ? (
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            border: `2px solid ${isTaskCM ? f.pill : TH.subLight}`,
            background: it.done ? (isTaskCM ? f.pill : TH.green) : "#FFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 4, marginTop: 2,
          }}>
            {it.done && <span style={{ color: "#FFF", fontSize: 13, fontWeight: 900 }}>✓</span>}
          </div>
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: f.bg, color: f.pill,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginLeft: 4,
          }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: f.pill, letterSpacing: 0.4, marginBottom: 1 }}>
            {it.ora ? `${it.ora.slice(0, 5)}${it.durata ? ` · ${it.durata}` : ""}` : (isTask ? "Senza orario" : "")}
          </div>
          <div style={{
            fontSize: 13, fontWeight: 800, color: TH.ink,
            lineHeight: 1.25,
            textDecoration: it.done ? "line-through" : "none",
          }}>{it.titolo}</div>
          <div style={{ fontSize: 10.5, color: TH.sub, marginTop: 3, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            {it.codice && (
              <span style={{
                background: f.bg, color: f.pill,
                padding: "2px 6px", borderRadius: 4,
                fontSize: 9, fontWeight: 800, letterSpacing: 0.3,
                display: "inline-flex", alignItems: "center", gap: 3,
              }}>
                <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                </svg>
                {it.codice}
              </span>
            )}
            {it.cliente && <span>{it.cliente}</span>}
            {it.indirizzo && <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.indirizzo}</span>}
            {!it.codice && !it.cliente && !it.indirizzo && isTask && !isTaskCM && <span style={{ fontStyle: "italic" }}>Personale</span>}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {isTask && !it.done && (
            <span style={{
              background: p.bg, color: p.fg,
              padding: "2px 6px", borderRadius: 4,
              fontSize: 9, fontWeight: 800, letterSpacing: 0.3,
              textTransform: "uppercase" as any,
            }}>{p.label}</span>
          )}
          {it.squadra && (
            <span style={{
              background: "rgba(15,27,45,0.08)", color: TH.navy,
              padding: "2px 7px", borderRadius: 999,
              fontSize: 8.5, fontWeight: 800, letterSpacing: 0.3,
              textTransform: "uppercase" as any,
            }}>{it.squadra}</span>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div style={{
      background: TH.bgPage,
      minHeight: "100%",
      fontFamily: "'Manrope', -apple-system, 'SF Pro Display', system-ui, sans-serif",
      padding: "calc(env(safe-area-inset-top, 0px) + 0px) 0 110px",
      overflowX: "hidden" as any,
    }}>

      {/* ═══ HEADER NAVY MOCKUP ═══ */}
      <div style={{
        background: `linear-gradient(160deg, ${TH.navy} 0%, ${TH.navyDark} 100%)`,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        padding: "16px 18px 22px",
        position: "relative" as any,
        overflow: "hidden" as any,
        boxShadow: "0 8px 22px rgba(15,23,42,0.25)",
        color: "#FFF",
        marginBottom: 14,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, color: TH.navySoft, textTransform: "uppercase" as any }}>Pianificazione</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.02, lineHeight: 1.1, marginTop: 2 }}>Calendario</div>
            <div style={{ fontSize: 12, color: "#B5C8DD", fontWeight: 600, marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span>{nEvents} eventi</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>{nTasks} task</span>
              {scaduti > 0 && (
                <>
                  <span style={{ opacity: 0.5 }}>·</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#FFF", background: TH.red, padding: "2px 7px", borderRadius: 9, letterSpacing: 0.3 }}>{scaduti} SCADUTI</span>
                </>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              display: "flex", gap: 2, padding: 3,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 10,
            }}>
              {[
                { v: "mese", short: "M", icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
                { v: "settimana", short: "S", icon: <><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="18" height="4" rx="1"/></> },
                { v: "giorno", short: "G", icon: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></> },
              ].map(({ v, short, icon }) => {
                const sel = view === v;
                return (
                  <div key={v} onClick={() => setView(v as any)} style={{
                    width: 30, height: 28, borderRadius: 7,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                    background: sel ? "#FFF" : "transparent",
                    color: sel ? TH.navy : "rgba(255,255,255,0.65)",
                    fontSize: 11, fontWeight: 800,
                  }}>{short}</div>
                );
              })}
            </div>

            <div onClick={() => setShowCreateMenu(true)} style={{
              width: 36, height: 36, borderRadius: 10,
              background: "#FFF", color: TH.navy,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(15,23,42,0.25)",
              marginLeft: 6,
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
          </div>
        </div>

        {/* NAV TITOLO */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
          <div onClick={() => view === "mese" ? navMese(-1) : view === "settimana" ? navWeek(-1) : navDay(-1)} style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </div>

          <div style={{ flex: 1, textAlign: "center" as any }}>
            <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.1, textTransform: "capitalize" as any }}>
              {view === "mese" && monthLabel}
              {view === "settimana" && `${weekStrip[0].getDate()}–${weekStrip[6].getDate()} ${weekStrip[6].toLocaleDateString("it-IT", { month: "short" })}`}
              {view === "giorno" && calDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              {view === "task" && "Tutti i task"}
            </div>
            <div style={{ fontSize: 10, color: "#B5C8DD", fontWeight: 600, marginTop: 1 }}>
              <span onClick={() => setCalDate(new Date())} style={{ cursor: "pointer", textDecoration: "underline" }}>oggi</span>
            </div>
          </div>

          <div onClick={() => view === "mese" ? navMese(1) : view === "settimana" ? navWeek(1) : navDay(1)} style={{
            width: 32, height: 32,
            background: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      {/* ═══ MASTRO MENTE (collapsible) ═══ */}
      <div style={{ padding: "0 14px 12px" }}>
        <div onClick={() => setMenteOpen(!menteOpen)} style={{
          background: `linear-gradient(135deg, ${TH.navyDark} 0%, ${TH.navy} 100%)`,
          padding: "11px 13px",
          borderRadius: menteOpen ? "14px 14px 0 0" : 14,
          display: "flex", alignItems: "center", gap: 10,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(15,23,42,0.2)",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${TH.navyLight}, ${TH.navy})`,
            border: "1.5px solid rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}>
              <path d="M12 2 2 7l10 5 10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: TH.navySoft, fontWeight: 800, letterSpacing: 0.6, textTransform: "uppercase" as any }}>MASTRO MENTE</div>
            <div style={{ fontSize: 12, color: "#FFF", fontWeight: 700, marginTop: 1 }}>{menteAlerts.filter(a => a.tipo !== "success").length} alert · {menteAlerts.filter(a => a.tipo === "success").length} suggerimenti</div>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5} style={{ transform: menteOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
        {menteOpen && (
          <div style={{
            background: "#FFF",
            border: `1.5px solid ${TH.navy}`,
            borderTop: "none",
            borderRadius: "0 0 14px 14px",
            padding: 8,
          }}>
            {menteAlerts.map((a: any, i: number) => {
              const c = menteColor[a.tipo];
              return (
                <div key={i} style={{
                  background: c.bg, borderRadius: 9,
                  padding: "10px 12px",
                  marginBottom: i < menteAlerts.length - 1 ? 5 : 0,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: "rgba(255,255,255,0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <MenteIcon name={a.icon} color={c.sub} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: c.fg, fontWeight: 800 }}>{a.title}</div>
                    <div style={{ fontSize: 10, color: c.sub, marginTop: 1, fontWeight: 600 }}>{a.sub}</div>
                  </div>
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={c.sub} strokeWidth={2.5}><path d="m9 18 6-6-6-6"/></svg>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ FILTRI CHIPS ═══ */}
      <div style={{
        padding: "0 14px 10px",
        display: "flex", gap: 6,
        overflowX: "auto",
        scrollbarWidth: "none" as any,
      }}>
        {([
          { id: "tutti", label: "Tutti", count: allItems.length },
          { id: "eventi", label: "Eventi", count: nEvents },
          { id: "task", label: "Task", count: nTasks },
          { id: "sopralluogo", label: "Sopralluogo", count: allItems.filter(i => i.tipo === "sopralluogo").length },
          { id: "preventivo", label: "Preventivo", count: allItems.filter(i => i.tipo === "preventivo").length },
          { id: "montaggio", label: "Montaggio", count: allItems.filter(i => i.tipo === "montaggio" || i.tipo === "posa").length },
        ]).filter(c => c.count > 0 || c.id === "tutti").map(c => {
          const sel = filterTipo === c.id;
          return (
            <div key={c.id} onClick={() => setFilterTipo(c.id)} style={{
              background: sel ? TH.navy : "#FFF",
              border: `1px solid ${sel ? TH.navy : TH.subLight}`,
              color: sel ? "#FFF" : TH.sub,
              borderRadius: 999,
              padding: "6px 12px",
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 700,
              whiteSpace: "nowrap" as any, flexShrink: 0,
              cursor: "pointer",
            }}>
              <span>{c.label}</span>
              <span style={{
                background: sel ? "rgba(15,27,45,0.9)" : TH.navyMuted,
                color: "#FFF",
                fontSize: 9, fontWeight: 800,
                padding: "1px 6px", borderRadius: 999,
                minWidth: 18, textAlign: "center" as any,
              }}>{c.count}</span>
            </div>
          );
        })}
      </div>

      {/* ═══ STRIP GIORNI SETTIMANA ═══ */}
      <div style={{ padding: "0 14px 12px" }}>
        <div style={{ display: "flex", gap: 5, overflowX: "auto", scrollbarWidth: "none" as any }}>
          {weekStrip.map((d, i) => {
            const isTod = iso(d) === todayStr;
            const isSelected = iso(d) === iso(calDate);
            const isSun = d.getDay() === 0;
            const items = byDay[iso(d)] || [];
            return (
              <div key={i} onClick={() => { setCalDate(new Date(d)); if (view === "mese") setView("giorno"); }} style={{
                background: isTod ? TH.navy : (isSelected ? TH.bgPill : "#FFF"),
                border: isTod ? "none" : `1px solid ${TH.borderSoft}`,
                borderRadius: 12,
                padding: "8px 10px",
                textAlign: "center" as any,
                minWidth: 46, flexShrink: 0,
                boxShadow: isTod ? `0 4px 10px ${TH.navy}55` : "none",
                cursor: "pointer",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 800,
                  color: isTod ? "rgba(255,255,255,0.85)" : (isSun ? TH.red : TH.subLight),
                  textTransform: "uppercase" as any, letterSpacing: 0.4,
                }}>{isTod ? "OGGI" : d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 3)}</div>
                <div style={{
                  fontSize: 16, fontWeight: 800,
                  color: isTod ? "#FFF" : (isSun ? TH.red : TH.ink),
                  marginTop: 1,
                }}>{d.getDate()}</div>
                {items.length > 0 && !isTod && (
                  <div style={{ display: "flex", gap: 2, justifyContent: "center", marginTop: 3 }}>
                    {items.slice(0, 3).map((it: any, k: number) => (
                      <div key={k} style={{ width: 4, height: 4, background: (FASE[it.tipo] || FASE.evento).pill, borderRadius: 50 }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════ */}
      {/* VIEW MESE */}
      {/* ═══════════════════════════════ */}
      {view === "mese" && (
        <>
          {/* TIMELINE OGGI */}
          <div style={{ padding: "0 14px 12px" }}>
            <div style={{
              background: "#FFF",
              borderRadius: 14,
              padding: 14,
              boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 9,
                  background: TH.bgPill, color: TH.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>
                  </svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, color: TH.ink, fontWeight: 800 }}>Timeline di oggi</div>
                <div style={{
                  background: TH.navy, color: "#FFF",
                  fontSize: 10, fontWeight: 800,
                  minWidth: 22, height: 22, borderRadius: 50,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 6px",
                }}>{(byDay[todayStr] || []).length}</div>
              </div>
              {(byDay[todayStr] || []).length === 0 && (
                <div style={{ textAlign: "center" as any, padding: "14px 0" }}>
                  <div style={{ fontSize: 11, color: TH.sub }}>Nessun impegno oggi</div>
                  <div onClick={() => { setCalDate(new Date()); setView("giorno"); }} style={{ fontSize: 11, color: TH.navy, fontWeight: 700, marginTop: 4, cursor: "pointer" }}>Apri agenda ›</div>
                </div>
              )}
              {(byDay[todayStr] || []).slice(0, 4).map((it: any) => renderItemCard(it))}
              {(byDay[todayStr] || []).length > 4 && (
                <div onClick={() => { setCalDate(new Date()); setView("giorno"); }} style={{
                  fontSize: 11, color: TH.navy, fontWeight: 700,
                  textAlign: "center" as any, padding: "6px 0 0", cursor: "pointer",
                }}>Vedi altri {(byDay[todayStr] || []).length - 4} ›</div>
              )}
            </div>
          </div>

          {/* CALENDARIO MESE */}
          <div style={{ padding: "0 14px 14px" }}>
            <div style={{ background: "#FFF", borderRadius: 14, padding: 12, boxShadow: "0 2px 8px rgba(15,23,42,0.08)" }}>
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
                gap: 3, marginBottom: 6,
                background: TH.navy, borderRadius: 8, padding: "6px 3px",
              }}>
                {["L","M","M","G","V","S","D"].map((d, i) => (
                  <div key={i} style={{
                    textAlign: "center" as any,
                    fontSize: 10,
                    color: i === 6 ? "#FCA5A5" : "#FFF",
                    fontWeight: 800,
                    letterSpacing: 0.5,
                  }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {monthDays.map(d => renderCell(d))}
              </div>
            </div>
          </div>

          {/* TASK OGGI */}
          <div style={{ padding: "0 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 16, color: TH.ink, fontWeight: 800 }}>Task oggi</div>
              <div style={{ fontSize: 11, color: TH.sub, marginTop: 1 }}>{tasksOggi.filter(t => !t.done).length} da fare · {tasksOggi.filter(t => t.done).length} completate</div>
            </div>
            <div style={{
              background: TH.ambraBg, color: TH.ambra,
              padding: "5px 10px", borderRadius: 999,
              fontSize: 10, fontWeight: 800,
            }}>{tasksOggi.filter(t => t.done).length}/{tasksOggi.length}</div>
          </div>
          <div style={{ padding: "8px 14px 0" }}>
            {tasksOggi.length === 0 && (
              <div style={{
                background: "#FFF", border: `1px dashed ${TH.border}`,
                borderRadius: 12, padding: 14, textAlign: "center" as any,
                fontSize: 11, color: TH.sub,
              }}>Nessun task oggi</div>
            )}
            {tasksOggi.map((t: any) => renderItemCard(t))}
          </div>
        </>
      )}

      {/* ═══════════════════════════════ */}
      {/* VIEW GIORNO */}
      {/* ═══════════════════════════════ */}
      {view === "giorno" && (
        <div style={{ padding: "0 14px 14px" }}>
          {/* HERO GIORNO */}
          <div style={{
            background: "#FFF",
            borderRadius: 14,
            padding: 14,
            marginBottom: 12,
            boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${TH.navy}, ${TH.navyDark})`,
              color: "#FFF",
              width: 56, height: 56, borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 26, fontWeight: 800,
              boxShadow: `0 3px 8px ${TH.navy}40`,
              flexShrink: 0,
            }}>{calDate.getDate()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: TH.ink, lineHeight: 1.1, textTransform: "capitalize" as any }}>
                {calDate.toLocaleDateString("it-IT", { weekday: "long" })}
              </div>
              <div style={{ fontSize: 12, color: TH.sub, fontWeight: 600, marginTop: 2, textTransform: "capitalize" as any }}>
                {calDate.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}
                {iso(calDate) === todayStr && " · oggi"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" as any }}>
                {(byDay[iso(calDate)] || []).filter((i: any) => i.source === "event").length > 0 && (
                  <span style={{ background: TH.bgPill, color: TH.navy, padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                    {(byDay[iso(calDate)] || []).filter((i: any) => i.source === "event").length} eventi
                  </span>
                )}
                {(byDay[iso(calDate)] || []).filter((i: any) => i.source === "task").length > 0 && (
                  <span style={{ background: TH.ambraBg, color: TH.ambra, padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                    {(byDay[iso(calDate)] || []).filter((i: any) => i.source === "task").length} task
                  </span>
                )}
              </div>
            </div>
          </div>

          {(byDay[iso(calDate)] || []).length === 0 && (
            <div style={{
              background: "#FFF", border: `1px dashed ${TH.border}`,
              borderRadius: 14, padding: 24, textAlign: "center" as any,
            }}>
              <div style={{ fontSize: 12, color: TH.sub, marginBottom: 10 }}>Nessun impegno questo giorno</div>
              <div onClick={() => setShowCreateMenu(true)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: TH.navy, color: "#FFF",
                padding: "10px 18px", borderRadius: 10,
                fontSize: 12, fontWeight: 800,
                cursor: "pointer",
              }}>+ Aggiungi item</div>
            </div>
          )}
          {(byDay[iso(calDate)] || []).map((it: any) => renderItemCard(it))}
        </div>
      )}

      {/* ═══════════════════════════════ */}
      {/* VIEW SETTIMANA */}
      {/* ═══════════════════════════════ */}
      {view === "settimana" && (
        <div style={{ padding: "0 14px 14px" }}>
          {weekStrip.map(d => {
            const items = byDay[iso(d)] || [];
            const isTod = iso(d) === todayStr;
            const isSun = d.getDay() === 0;
            return (
              <div key={iso(d)} style={{
                background: "#FFF",
                borderRadius: 14,
                padding: 12,
                marginBottom: 10,
                boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
                border: isTod ? `2px solid ${TH.navy}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: items.length > 0 ? 10 : 0 }}>
                  <div style={{
                    background: isTod ? TH.navy : TH.bgPill,
                    color: isTod ? "#FFF" : TH.navy,
                    width: 38, height: 38, borderRadius: 10,
                    display: "flex", flexDirection: "column" as any, alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase" as any, lineHeight: 1 }}>
                      {d.toLocaleDateString("it-IT", { weekday: "short" }).slice(0, 3)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1, marginTop: 2 }}>{d.getDate()}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink, textTransform: "capitalize" as any }}>
                      {d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" })}
                      {isTod && <span style={{ color: TH.navy, fontSize: 10, marginLeft: 6 }}>· oggi</span>}
                    </div>
                    <div style={{ fontSize: 11, color: TH.sub, fontWeight: 600, marginTop: 1 }}>
                      {items.length === 0 ? "Nessun impegno" : `${items.length} item`}
                    </div>
                  </div>
                  <div onClick={() => openDay(iso(d))} style={{
                    fontSize: 10, color: TH.navy, fontWeight: 700,
                    cursor: "pointer", padding: "4px 8px",
                  }}>›</div>
                </div>
                {items.map((it: any) => renderItemCard(it))}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════ */}
      {/* VIEW TASK */}
      {/* ═══════════════════════════════ */}
      {view === "task" && (
        <div style={{ padding: "0 14px 14px" }}>
          {allItems.filter(i => i.source === "task").length === 0 && (
            <div style={{
              background: "#FFF", border: `1px dashed ${TH.border}`,
              borderRadius: 14, padding: 24, textAlign: "center" as any,
              fontSize: 12, color: TH.sub,
            }}>Nessun task</div>
          )}
          {allItems.filter(i => i.source === "task").map((t: any) => {
            const scaduto = t.data && t.data < todayStr && !t.done;
            const itDecorated = scaduto ? { ...t, priorita: "alta" } : t;
            return renderItemCard(itDecorated);
          })}
        </div>
      )}

      {/* ═══════════════════════════════ */}
      {/* MODAL CREA ITEM (scelta tipo) */}
      {/* ═══════════════════════════════ */}
      {showCreateMenu && (
        <div onClick={() => setShowCreateMenu(false)} style={{
          position: "fixed" as any, inset: 0,
          background: "rgba(15,23,42,0.5)",
          zIndex: 200,
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#FFF",
            width: "100%", maxWidth: 500,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: "16px 18px calc(env(safe-area-inset-bottom, 0px) + 24px)",
          }}>
            <div style={{ width: 36, height: 4, background: TH.border, borderRadius: 2, margin: "0 auto 14px" }} />
            <div style={{ fontSize: 19, fontWeight: 800, color: TH.ink, marginBottom: 4 }}>Cosa vuoi creare?</div>
            <div style={{ fontSize: 11, color: TH.sub, marginBottom: 16 }}>Scegli il tipo di item da aggiungere</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* EVENTO */}
              <div onClick={() => handleNew("nuovo-evento")} style={{
                border: `2px solid ${TH.navy}`, background: TH.bgPill,
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: TH.navy, color: "#FFF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>Evento</div>
                  <div style={{ fontSize: 11, color: TH.sub, marginTop: 2 }}>Sopralluogo, posa, riunione...</div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.navy} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* TASK PERSONALE */}
              <div onClick={() => handleNew("nuovo-task")} style={{
                border: `1.5px solid ${TH.border}`, background: "#FFF",
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: "#F1F5F9", color: TH.sub,
                  border: `2px dashed ${TH.subLight}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>Task personale</div>
                  <div style={{ fontSize: 11, color: TH.sub, marginTop: 2 }}>Cose da fare non legate a commesse</div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.subLight} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* TASK COMMESSA */}
              <div onClick={() => handleNew("nuovo-task-commessa")} style={{
                border: `1.5px solid ${TH.border}`, background: "#FFF",
                borderRadius: 12, padding: 14,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: TH.bgPill, color: TH.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TH.ink }}>Task commessa</div>
                  <div style={{ fontSize: 11, color: TH.sub, marginTop: 2 }}>Da fare collegato a una commessa</div>
                </div>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={TH.navy} strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>

            <div onClick={() => setShowCreateMenu(false)} style={{
              marginTop: 14, padding: 12,
              background: "#F1F5F9", color: TH.sub,
              border: `1px solid ${TH.border}`,
              borderRadius: 10,
              fontSize: 12, fontWeight: 800,
              textAlign: "center" as any, cursor: "pointer",
              letterSpacing: 0.3,
            }}>Annulla</div>
          </div>
        </div>
      )}

    </div>
  );
}
