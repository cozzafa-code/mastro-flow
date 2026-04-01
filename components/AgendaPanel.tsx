"use client";
// @ts-nocheck
import React from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, Ico, I, TIPI_EVENTO, tipoEvColor } from "./mastro-constants";

export default function AgendaPanel() {
  const {
    T, S, isDesktop, fs,
    agendaFilters, agendaView, cantieri, contatti, deleteEvent, events, expandedDay, fattureDB, fatturePassive, montaggiDB, ordiniFornDB, selDate, selectedEvent, setAgendaFilters, setAgendaView, setCantieri, setEvents, setExpandedDay, setMailBody, setNewEvent, setSelDate, setSelectedCM, setSelectedEvent, setShowMailModal, setShowNewEvent, setTab, squadreDB, tasks, toggleTask,
  } = useMastro();

    const dateStr = (d) => d.toISOString().split("T")[0];
    // Merge events + tasks + montaggi + consegne
    const tasksWithDate = tasks.filter(t => t.date).map(t => ({ ...t, _isTask: true, color: t.priority === "alta" ? "#FF3B30" : t.priority === "media" ? "#FF9500" : "#8E8E93" }));
    const montaggiItems = (montaggiDB || []).filter(m => m.data).map(m => {
      const sq = (squadreDB || []).find(s => s.id === m.squadraId);
      return { id: "mag_" + m.id, date: m.data, time: m.orario || "08:00", text: "Montaggio " + (m.cliente || ""), persona: m.cliente || "", cm: m.cmCode || "", color: "#0D7C6B", durata: (m.giorni || 1) * 480, _isMontaggio: true, _stato: m.stato, _squadra: sq?.nome || "", _vani: m.vani || 0 };
    });
    const consegneItems = (ordiniFornDB || []).filter(o => o.consegna?.prevista && o.stato !== "consegnato").map(o => ({
      id: "cons_" + o.id, date: o.consegna.prevista, time: "09:00", text: "Consegna " + (o.fornitore?.nome || ""), persona: o.fornitore?.nome || "", cm: o.cmCode || "", color: "#af52de", durata: 60, _isConsegna: true
    }));
    const scadenzeItems = [
      ...(fattureDB || []).filter(f => !f.pagata && f.scadenza).map(f => ({
        id: "scad_e_" + f.id, date: f.scadenza, time: "", text: "Incasso " + f.cliente, persona: f.cliente, cm: f.cmCode || "", color: "#1A9E73", _isScadenza: true, _importo: f.importo, _tipo: "incasso"
      })),
      ...(fatturePassive || []).filter(f => !f.pagata && f.scadenza).map(f => ({
        id: "scad_p_" + f.id, date: f.scadenza, time: "", text: "Pagamento " + (typeof f.fornitore === "object" ? (f.fornitore?.nome || "") : (f.fornitore || "")), persona: typeof f.fornitore === "object" ? (f.fornitore?.nome || "") : (f.fornitore || ""), cm: "", color: "#E8A020", _isScadenza: true, _importo: f.importo || 0, _tipo: "pagamento"
      })),
    ];
    const allItemsRaw = [...events, ...tasksWithDate, ...montaggiItems, ...consegneItems, ...scadenzeItems];
    const allItems = allItemsRaw.filter(it => {
      if (it._isTask && !agendaFilters.tasks) return false;
      if (it._isMontaggio && !agendaFilters.montaggi) return false;
      if (it._isConsegna && !agendaFilters.consegne) return false;
      if (it._isScadenza && !agendaFilters.scadenze) return false;
      if (!it._isTask && !it._isMontaggio && !it._isConsegna && !it._isScadenza && !agendaFilters.eventi) return false;
      return true;
    });
    const dayEvents = allItems.filter(e => e.date === dateStr(selDate)).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    const weekStart = new Date(selDate); weekStart.setDate(selDate.getDate() - selDate.getDay() + 1);
    const weekDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(d.getDate() + i); return d; });
    const monthStart = new Date(selDate.getFullYear(), selDate.getMonth(), 1);
    const monthDays = Array.from({ length: 35 }, (_, i) => { const d = new Date(monthStart); d.setDate(d.getDate() + i - monthStart.getDay() + 1); return d; });
    const isSameDay = (a, b) => dateStr(a) === dateStr(b);
    const isToday2 = (d) => isSameDay(d, new Date());
    const eventsOn = (d) => allItems.filter(e => e.date === dateStr(d));


    const navDate = (dir) => {
      const d = new Date(selDate);
      if (agendaView === "giorno") d.setDate(d.getDate() + dir);
      else if (agendaView === "settimana") d.setDate(d.getDate() + dir * 7);
      else d.setMonth(d.getMonth() + dir);
      setSelDate(d);
    };

    // Swipe handlers
    let touchStartX = 0;
    const onTouchStart = (e) => { touchStartX = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) navDate(dx < 0 ? 1 : -1);
    };

    // Prossimi eventi (dal giorno di oggi in avanti, max 3)
    const todayStr = dateStr(new Date());
    const prossimiEventi = allItems
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time||"99").localeCompare(b.time||"99"))
      .slice(0, 3);

    // Ore rimanenti agli eventi di oggi
    const now = new Date();
    const oraOra = now.getHours() * 60 + now.getMinutes();
    const eventiOggi = events.filter(e => e.date === todayStr && e.time).map(e => {
      const [hh, mm] = e.time.split(":").map(Number);
      const minuti = hh * 60 + mm - oraOra;
      return { ...e, minutiAlEvento: minuti };
    }).filter(e => e.minutiAlEvento > 0).sort((a,b) => a.minutiAlEvento - b.minutiAlEvento);

    const renderEventCard = (ev) => {
      const evShadow = (ev._isMontaggio || ev._isConsegna || ev._isScadenza) ? ev.color + "44" : "#A8CCCC";
      const evBorderLeft = (ev._isMontaggio || ev._isConsegna || ev._isScadenza) ? "4px solid " + ev.color : "1.5px solid #C8E4E4";
      return (
      <div key={ev.id} style={{ background:"white", borderRadius:16, border:"1.5px solid #C8E4E4", marginBottom:8, boxShadow:"0 5px 0 0 " + evShadow, borderLeft: evBorderLeft, opacity: ev._isTask && ev.done ? 0.5 : 1 }} onClick={() => !ev._isTask && !ev._isMontaggio && !ev._isConsegna && !ev._isScadenza && setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}>
        <div style={{ padding:"13px 14px", display:"flex", gap:10 }}>
          {ev._isTask ? (
            <div onClick={(e) => { e.stopPropagation(); toggleTask(ev.id); }} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${ev.done ? "#1A9E73" : "#C8E4E4"}`, background: ev.done ? "#1A9E73" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
              {ev.done && <Ico d={ICO.check} s={13} c="#fff" sw={3} />}
            </div>
          ) : ev._isMontaggio ? (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D7C6B15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I d={ICO.wrench} s={16} c="#0D7C6B" /></div>
          ) : ev._isConsegna ? (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "#af52de15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I d={ICO.truck} s={16} c="#af52de" /></div>
          ) : ev._isScadenza ? (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: (ev._tipo === "incasso" ? "#1A9E73" : "#E8A020") + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><I d={ev._tipo === "incasso" ? ICO.upload : ICO.download} s={16} c={ev._tipo === "incasso" ? "#1A9E73" : "#E8A020"} /></div>
          ) : (
            <div style={{ width: 3, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
          )}
          {ev.time && <div style={{ fontSize: 12, fontWeight: 700, color: "#4A7070", minWidth: 38, fontFamily: FM }}>{ev.time}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textDecoration: ev._isTask && ev.done ? "line-through" : "none" }}>{ev.text}</div>
            {ev._isTask && ev.meta && <div style={{ fontSize: 11, color: "#4A7070", marginTop: 2 }}><I d={ICO.fileText} s={11} c={"#4A7070"} /> {ev.meta}</div>}
            {!ev._isTask && !ev._isMontaggio && !ev._isConsegna && !ev._isScadenza && ev.addr && <div style={{ fontSize: 11, color: "#4A7070", marginTop: 2 }}><I d={ICO.mapPin} s={11} c={"#4A7070"} /> {ev.addr}</div>}
            {ev._isMontaggio && <div style={{ fontSize: 10, color: "#4A7070", marginTop: 2 }}>{ev._squadra} · {ev._vani} vani · {ev._stato === "completato" ? "Completato" : ev._stato === "in_corso" ? "In corso" : "Programmato"}</div>}
            {ev._isConsegna && <div style={{ fontSize: 10, color: "#4A7070", marginTop: 2 }}>Materiale per {ev.cm}</div>}
            {ev._isScadenza && <div style={{ fontSize: 10, color: "#4A7070", marginTop: 2 }}>{ev._tipo === "incasso" ? "Da incassare" : "Da pagare"}: <b style={{ color: ev.color }}>€{(ev._importo || 0).toLocaleString("it-IT")}</b></div>}
            <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
              {ev.cm && <span onClick={(e) => { e.stopPropagation(); const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} style={{ ...{ padding:"2px 8px", borderRadius:20, background:"rgba(40, color:160,160,0.1, fontSize:9, fontWeight:900 }", "#28A0A0"), cursor: "pointer" }}>{ev.cm}</span>}
              {ev.persona && !ev._isMontaggio && !ev._isConsegna && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(124,95,191,0.1)", color:"#7C5FBF", fontSize:9, fontWeight:900 }}>{ev.persona}</span>}
              {ev._isTask && <span style={{ padding:"2px 8px", borderRadius:20, background:ev.priority === "alta" ? "#FF3B3018" : ev.priority === "media" ? "#FF950018" : "#8E8E9318", color:ev.priority === "alta" ? "#FF3B30" : ev.priority === "media" ? "#FF9500" : "#8E8E93", fontSize:9, fontWeight:900 }}>task · {ev.priority}</span>}
              {!ev._isTask && ev.reminder && <span style={{ padding:"2px 8px", borderRadius:20, background:ev.reminderSent ? "rgba(26, color:158,115,0.1, fontSize:9, fontWeight:900 }" : "#FF950015", ev.reminderSent ? "#1A9E73" : "#FF9500")}>{ev.reminderSent ? "Reminder inviato" : `${ev.reminder}`}</span>}
              {!ev._isTask && <span style={{ padding:"2px 8px", borderRadius:20, background:tipoEvColor(ev.tipo)+"18", color:tipoEvColor(ev.tipo), fontSize:9, fontWeight:900 }}>{(TIPI_EVENTO.find(t=>t.id===ev.tipo)||{l:ev.tipo}).l}</span>}
            </div>
          </div>
          <div style={{ alignSelf: "center", transition: "transform 0.2s", transform: selectedEvent?.id === ev.id ? "rotate(90deg)" : "rotate(0deg)" }}>
            <Ico d={ICO.back} s={14} c={"#4A7070"} />
          </div>
        </div>
        {/* fliwoX Expanded detail */}
        {selectedEvent?.id === ev.id && (
          <div style={{ padding:"0 14px 12px", borderTop:"1.5px solid #EEF8F8", marginTop:4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 0" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#4A7070", textTransform: "uppercase", letterSpacing: 0.5 }}>Data</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{new Date(ev.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#4A7070", textTransform: "uppercase", letterSpacing: 0.5 }}>Orario</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{ev.time || "Tutto il giorno"}</div>
              </div>
              {ev.persona && <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#4A7070", textTransform: "uppercase", letterSpacing: 0.5 }}>Assegnato a</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}><I d={ICO.user} s={11} c={"#7C5FBF"} /> {ev.persona}</div>
              </div>}
              {ev.addr && <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#4A7070", textTransform: "uppercase", letterSpacing: 0.5 }}>Luogo</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}><I d={ICO.mapPin} s={11} c={"#4A7070"} /> {ev.addr}</div>
              </div>}
            </div>
            {ev.cm && (
              <div style={{ padding: "8px 10px", background: "rgba(40,160,160,0.1)", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#28A0A0", textTransform: "uppercase", letterSpacing: 0.5 }}>Commessa collegata</div>
                <div onClick={(e) => { e.stopPropagation(); const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} style={{ fontSize: 13, fontWeight: 700, color: "#28A0A0", marginTop: 2, cursor: "pointer" }}>{ev.cm} → Apri commessa</div>
              </div>
            )}
            <div style={{ display:"flex", gap:7 }}>
              <div onClick={(e) => { e.stopPropagation(); if (ev.addr) window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr)); }} style={{ flex:1, padding:"10px 6px", borderRadius:12, background:"rgba(59,127,224,0.1)", border:"1.5px solid rgba(59,127,224,0.3)", textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:900, color:"#3B7FE0", boxShadow:"0 4px 0 0 rgba(59,127,224,0.25)" }}>Mappa</div>
              <div onClick={(e) => { e.stopPropagation(); const tel = contatti.find(ct => ct.nome === ev.persona)?.telefono; if (tel) window.location.href="tel:" + tel; }} style={{ flex:1, padding:"10px 6px", borderRadius:12, background:"rgba(26,158,115,0.1)", border:"1.5px solid rgba(26,158,115,0.3)", textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:900, color:"#1A9E73", boxShadow:"0 4px 0 0 rgba(26,158,115,0.25)" }}>Chiama</div>
              <div onClick={(e) => {
                e.stopPropagation();
                const cmObj = cantieri.find(c => c.code === ev.cm) || null;
                const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente");
                const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                const tpl = `Gentile ${cliente},

Le confermo l'appuntamento:

<I d={ICO.calendar} /> ${dataFmt}${ev.time ? " alle " + ev.time : ""}
<I d={ICO.mapPin} /> ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarmi.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                setMailBody(tpl);
                setShowMailModal({ ev, cm: cmObj });
              }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(40,160,160,0.1)", border: "1px solid rgba(40,160,160,0.3)", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#28A0A0" }}><I d={ICO.mail} /> Mail</div>
              <div onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); setSelectedEvent(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(220,68,68,0.1)", border: "1px solid rgba(220,68,68,0.3)", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC4444" }}>‘</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #0D7C6B15, #0D7C6B08)", border: "1px solid #0D7C6B25", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#0D7C6B" }}><I d={ICO.folder} s={11} c="#0D7C6B" /> Commessa</div>
              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #E8A02015, #E8A02008)", border: "1px solid #E8A02025", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#E8A020" }}><I d={ICO.ruler} s={11} c="#E8A020" /> Misure</div>
              <div onClick={(e) => { e.stopPropagation(); const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #1A9E7315, #1A9E7308)", border: "1px solid #1A9E7325", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#1A9E73" }}><I d={ICO.wrench} s={11} c="#1A9E73" /> Intervento</div>
            </div>
          </div>
        )}
      </div>
    );};

    return (
      <div style={{ paddingBottom:80, backgroundColor:"#D8EEEE", backgroundImage:"linear-gradient(rgba(40,160,160,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,0.18) 1px,transparent 1px)", backgroundSize:"24px 24px", minHeight:"100vh" }}>
        {/* fliwoX Topbar */}
        <div style={{ background:"#0D1F1F", padding:"13px 16px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:19, fontWeight:900, color:"white", letterSpacing:"-0.3px" }}>Agenda</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:700, marginTop:1 }}>
              {agendaView === "giorno" ? selDate.toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }) :
               agendaView === "settimana" ? `${weekDays[0].getDate()}–${weekDays[6].getDate()} ${selDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" })}` :
               selDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" })}
            </div>
          </div>
          <div onClick={() => setShowNewEvent(true)} style={{ width:38, height:38, borderRadius:12, background:"rgba(40,160,160,0.2)", color:"#28A0A0", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"1px solid rgba(40,160,160,0.4)", boxShadow:"0 4px 0 0 rgba(21,96,96,0.4)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.8" strokeLinecap="round"><path d="M12 4v16M4 12h16"/></svg>
          </div>
        </div>

        {/* fliwoX View switcher */}
        <div style={{ display:"flex", background:"white", borderBottom:"3px solid #C8E4E4" }}>
          {["giorno", "settimana", "mese"].map(v => (
            <div key={v} onClick={() => setAgendaView(v)} style={{ flex:1, padding:"11px 4px", textAlign:"center", fontSize:12, fontWeight: agendaView === v ? 900 : 700, background: agendaView === v ? "#28A0A0" : "white", color: agendaView === v ? "white" : "#4A7070", cursor:"pointer", textTransform:"capitalize" as const, borderBottom: agendaView === v ? "3px solid #156060" : "none" }}>
              {v === "giorno" ? "Giorno" : v === "settimana" ? "Settimana" : "Mese"}
            </div>
          ))}
        </div>

        {/* fliwoX FILTRI + NAV */}
        <div style={{ padding:"10px 14px 8px" }}>
          <div style={{ display:"flex", gap:6, overflowX:"auto", WebkitOverflowScrolling:"touch", paddingBottom:6, marginBottom:8 }}>
            {[
              { id:"eventi", ico:"mapPin", l:"Sopralluoghi", col:"#28A0A0" },
              { id:"montaggi", ico:"wrench", l:"Montaggi", col:"#1A9E73" },
              { id:"consegne", ico:"truck", l:"Consegne", col:"#7C5FBF" },
              { id:"scadenze", ico:"wallet", l:"Pagamenti", col:"#D08008" },
              { id:"tasks", ico:"checkCircle", l:"Task", col:"#3B7FE0" },
            ].map(f => {
              const active = agendaFilters[f.id];
              return <div key={f.id} onClick={() => setAgendaFilters(p => ({...p, [f.id]: !p[f.id]}))}
                style={{ display:"flex", alignItems:"center", gap:4, padding:"7px 12px", borderRadius:20, fontSize:11, fontWeight:900, cursor:"pointer", whiteSpace:"nowrap" as const, background: active ? f.col : "white", color: active ? "white" : "#4A7070", border:`1.5px solid ${active ? f.col : "#C8E4E4"}`, boxShadow: active ? `0 4px 0 0 ${f.col}88` : "0 3px 0 0 #A8CCCC" }}>
                <I d={ICO[f.ico]} s={11} c={active ? "white" : "#4A7070"} /> {f.l}
              </div>;
            })}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div onClick={() => navDate(-1)} style={{ width:36, height:36, background:"#EEF8F8", borderRadius:10, border:"1.5px solid #C8E4E4", boxShadow:"0 4px 0 0 #A8CCCC", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </div>
            <div onClick={() => setSelDate(new Date())} style={{ fontSize:12, fontWeight:900, color:"#28A0A0", cursor:"pointer", padding:"6px 14px", borderRadius:20, background:"rgba(40,160,160,0.1)", boxShadow:"0 2px 0 0 rgba(40,160,160,0.3)" }}>Oggi</div>
            <div onClick={() => navDate(1)} style={{ width:36, height:36, background:"#EEF8F8", borderRadius:10, border:"1.5px solid #C8E4E4", boxShadow:"0 4px 0 0 #A8CCCC", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
        </div>

        {/* === BANNER REMINDER PENDENTI === */}
        {(() => {
          const today = dateStr(new Date());
          const tomorrow = dateStr(new Date(Date.now() + 86400000));
          const reminderPendenti = events.filter(ev => {
            if (!ev.reminder || ev.reminderSent) return false;
            if (ev.reminder === "giorno" && ev.date === today) return true;
            if (ev.reminder === "24h" && ev.date === tomorrow) return true;
            if (ev.reminder === "1h") {
              if (ev.date !== today) return false;
              if (!ev.time) return true;
              const [hh, mm] = ev.time.split(":").map(Number);
              const evMin = hh * 60 + mm;
              const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
              return evMin - nowMin <= 60 && evMin - nowMin > 0;
            }
            return false;
          });
          if (reminderPendenti.length === 0) return null;
          return (
            <div style={{ margin: "0 16px 10px", padding: "10px 12px", borderRadius: 10, background: "#FF950010", border: "1px solid #FF950040", borderLeft: "3px solid #FF9500" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}><I d={ICO.clock} /></span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#FF9500" }}>
                    {reminderPendenti.length} reminder da inviare
                  </div>
                  <div style={{ fontSize: 10, color: "#4A7070" }}>Avvisa i clienti con 1 click</div>
                </div>
              </div>
              {reminderPendenti.map(ev => {
                const cmObj = cantieri.find(c => c.code === ev.cm);
                const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : ev.persona || "Cliente";
                const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                const tpl = `Gentile ${cliente},

Le ricordiamo l'appuntamento:

<I d={ICO.calendar} /> ${dataFmt}${ev.time ? " alle " + ev.time : ""}
<I d={ICO.mapPin} /> ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarci.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                return (
                  <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 8px", background:"#fff", borderRadius:8, marginBottom:4, border:"1px solid #FF950030" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#0D1F1F" }}>{ev.text}</div>
                      <div style={{ fontSize:10, color:"#4A7070" }}>{cliente} · {ev.time || "tutto il giorno"}</div>
                    </div>
                    <div onClick={() => {
                      setMailBody(tpl);
                      setShowMailModal({ ev: { ...ev, addr: ev.addr || "" }, cm: cmObj || null });
                      setEvents(es => es.map(x => x.id === ev.id ? { ...x, reminderSent: true } : x));
                    }} style={{ padding:"5px 10px", borderRadius:7, background:"#FF9500", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
                      <I d={ICO.mail} />️ Invia
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div style={{ padding: "0 16px" }}>

          {/* === VISTA MESE === */}
          {agendaView === "mese" && (
            <>
              {/* Banner prossimo evento di oggi */}
              {eventiOggi.length > 0 && (
                <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC", marginBottom:10, padding:"12px 14px", borderLeft:`4px solid ${eventiOggi[0].color || tipoEvColor(eventiOggi[0].tipo)}`, display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#4A7070", fontWeight: 600 }}>
                      Prossimo evento tra {eventiOggi[0].minutiAlEvento < 60
                        ? `${eventiOggi[0].minutiAlEvento} min`
                        : `${Math.floor(eventiOggi[0].minutiAlEvento/60)}h ${eventiOggi[0].minutiAlEvento%60>0?eventiOggi[0].minutiAlEvento%60+"min":""}`}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{eventiOggi[0].text}</div>
                    {eventiOggi[0].addr && <div style={{ fontSize: 11, color: "#4A7070" }}><I d={ICO.mapPin} s={11} c={"#4A7070"} /> {eventiOggi[0].addr}</div>}
                  </div>
                  {eventiOggi[0].addr && (
                    <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(eventiOggi[0].addr))}
                      style={{ padding: "6px 10px", borderRadius: 8, background: "rgba(59,127,224,0.1)", color: "#3B7FE0", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      📍 Naviga
                    </div>
                  )}
                </div>
              )}
              {/* GRIGLIA MENSILE A RIQUADRI */}
              <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
                style={{ background: "white", borderRadius: 12, border: `1px solid #C8E4E4`, overflow: "hidden", marginBottom: 12 }}>
                {/* Intestazione giorni */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid #C8E4E4` }}>
                  {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "#4A7070", padding: "7px 4px", textAlign: "center", borderRight: i < 6 ? `1px solid #C8E4E4` : "none" }}>{d}</div>
                  ))}
                </div>
                {/* Celle mese */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {monthDays.map((d, i) => {
                    const inMonth = d.getMonth() === selDate.getMonth();
                    const sel = isSameDay(d, selDate);
                    const tod = isToday2(d);
                    const evs = eventsOn(d);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    const isExp = expandedDay === dateStr(d);
                    const col = Math.floor(i % 7);
                    return (
                      <div key={i}
                        onClick={() => { setSelDate(new Date(d)); setExpandedDay(isExp ? null : dateStr(d)); }}
                        onDoubleClick={() => { setSelDate(new Date(d)); setNewEvent(prev => ({...prev, date: dateStr(d)})); setShowNewEvent(true); }}
                        style={{
                        minHeight: 72, padding: "5px 6px",
                        borderRight: col < 6 ? `1px solid #C8E4E4` : "none",
                        borderBottom: `1px solid #C8E4E4`,
                        background: sel ? "#28A0A0" + "18" : isExp ? "rgba(40,160,160,0.1)" : isWeekend && inMonth ? "#EEF8F8" : "white",
                        cursor: "pointer", position: "relative",
                        outline: sel ? `2px solid #28A0A0` : isExp ? `1.5px solid #28A0A050` : "none",
                        outlineOffset: -1,
                      }}>
                        {/* Numero giorno */}
                        <div style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 22, height: 22, borderRadius: "50%", fontSize: 12, fontWeight: sel || tod ? 800 : 400,
                          background: tod ? "#28A0A0" : "transparent",
                          color: tod ? "#fff" : !inMonth ? "#4A7070"2 : sel ? "#28A0A0" : "#0D1F1F",
                          marginBottom: 3,
                        }}>{d.getDate()}</div>
                        {/* Eventi (max 3 visibili) */}
                        {evs.slice(0, 3).map((ev, ei) => (
                          <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setSelDate(new Date(d)); }} style={{
                            display: "flex", alignItems: "center", gap: 3, marginBottom: 1,
                            padding: "1px 4px", borderRadius: 3, fontSize: 10, fontWeight: 600,
                            background: (ev.color || tipoEvColor(ev.tipo)) + "20",
                            borderLeft: `2px solid ${ev.color || tipoEvColor(ev.tipo)}`,
                            overflow: "hidden", whiteSpace: "nowrap",
                          }}>
                            <span style={{ color: ev.color || tipoEvColor(ev.tipo), overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                              {ev.time ? ev.time.slice(0,5) + " " : ""}{ev.text}
                            </span>
                          </div>
                        ))}
                        {evs.length > 3 && (
                          <div style={{ fontSize: 9, color: "#4A7070", fontWeight: 600 }}>+{evs.length - 3} altri</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Sezione prossimi eventi */}
              {prossimiEventi.length > 0 && (
                <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC", marginBottom:10, padding:"12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4A7070", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Prossimi eventi</div>
                  {prossimiEventi.map((ev, i) => {
                    const evDate = new Date(ev.date + "T12:00:00");
                    const isEvToday = ev.date === todayStr;
                    const isEvTomorrow = ev.date === dateStr(new Date(Date.now() + 86400000));
                    const labelData = isEvToday ? "Oggi" : isEvTomorrow ? "Domani" : evDate.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={ev.id} onClick={() => { setSelDate(evDate); setSelectedEvent(ev); }}
                        style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < prossimiEventi.length-1 ? `1px solid #C8E4E4` : "none", cursor: "pointer", alignItems: "center" }}>
                        <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: ev.color || tipoEvColor(ev.tipo), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.text}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                            {ev.cm && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(40,160,160,0.1)", color:"#28A0A0", fontSize:9, fontWeight:900, boxShadow:"0 2px 0 0 rgba(40,160,160,0.25)" }}>{ev.cm}</span>}
                            {ev.persona && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(124,95,191,0.1)", color:"#7C5FBF", fontSize:9, fontWeight:900 }}><I d={ICO.user} s={11} c={"#7C5FBF"} /> {ev.persona}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isEvToday ? "#28A0A0" : "#4A7070" }}>{labelData}</div>
                          {ev.time && <div style={{ fontSize: 11, color: "#4A7070" }}>{ev.time}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pannello evento selezionato (click su evento nella griglia) */}
              {selectedEvent && isSameDay(new Date(selectedEvent.date), selDate) && (
                <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", boxShadow:`0 5px 0 0 ${selectedEvent.color || "#28A0A0"}44`, padding:"12px 14px", marginBottom:8, borderLeft:`4px solid ${selectedEvent.color || "#28A0A0"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{selectedEvent.text}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {selectedEvent.time && <span style={{ padding:"2px 8px", borderRadius:20, background:"#EEF8F8", color:"#4A7070", fontSize:9, fontWeight:900 }}><I d={ICO.calendar} s={11} c={"#4A7070"} /> {selectedEvent.time}</span>}
                        {selectedEvent.cm && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(40,160,160,0.1)", color:"#28A0A0", fontSize:9, fontWeight:900, boxShadow:"0 2px 0 0 rgba(40,160,160,0.25)" }}>{selectedEvent.cm}</span>}
                        {selectedEvent.persona && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(124,95,191,0.1)", color:"#7C5FBF", fontSize:9, fontWeight:900 }}><I d={ICO.user} s={11} c={"#7C5FBF"} /> {selectedEvent.persona}</span>}
                        {selectedEvent.addr && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(26,158,115,0.1)", color:"#1A9E73", fontSize:9, fontWeight:900 }}><I d={ICO.mapPin} s={11} c={"#1A9E73"} /> {selectedEvent.addr}</span>}
                      </div>
                    </div>
                    <div onClick={() => setSelectedEvent(null)} style={{ padding: 4, cursor: "pointer", color: "#4A7070", fontSize: 16 }}>×</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {selectedEvent.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(selectedEvent.addr))} style={{ flex:1, padding:"6px", borderRadius:6, background:"rgba(59,127,224,0.1)", textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:"#3B7FE0" }}>🗺 Mappa</div>}
                    <div onClick={() => {
                      const ev = selectedEvent;
                      const cmObj = cantieri.find(c => c.code === ev.cm) || null;
                      const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente");
                      const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                      const tpl = `Gentile ${cliente},

Le confermo l'appuntamento:

<I d={ICO.calendar} /> ${dataFmt}${ev.time ? " alle " + ev.time : ""}
<I d={ICO.mapPin} /> ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarmi.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                      setMailBody(tpl);
                      setShowMailModal({ ev, cm: cmObj });
                    }} style={{ flex:1, padding:"6px", borderRadius:6, background:"rgba(40,160,160,0.1)", textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:"#28A0A0" }}><I d={ICO.mail} />️ Mail</div>
                    <div onClick={() => deleteEvent(selectedEvent.id)} style={{ flex:1, padding:"6px", borderRadius:6, background:"rgba(220,68,68,0.1)", textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:"#DC4444" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg> Elimina</div>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#4A7070", fontSize: 12, background: "white", borderRadius: 12, border: `1px dashed #C8E4E4` }}>Nessun evento. Tocca + per aggiungere.</div>
              ) : dayEvents.map(renderEventCard)}
            </>
          )}

          {/* === VISTA SETTIMANA === */}
          {agendaView === "settimana" && (
            <>
              <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>
                {weekDays.map((d, i) => {
                  const sel = isSameDay(d, selDate);
                  const tod = isToday2(d);
                  const n = eventsOn(d).length;
                  return (
                    <div key={i} onClick={() => setSelDate(new Date(d))} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 10, background: sel ? "#28A0A0" : tod ? "rgba(40,160,160,0.1)" : "white", border: `1px solid ${sel ? "#28A0A0" : "#C8E4E4"}`, cursor: "pointer" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: sel ? "#fff" : "#4A7070", textTransform: "uppercase" }}>
                        {["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"][i]}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sel ? "#fff" : "#0D1F1F", marginTop: 2 }}>{d.getDate()}</div>
                      {n > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel ? "#fff" : "#DC4444", margin: "2px auto 0" }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "#4A7070", fontSize: 12, background: "white", borderRadius: 12, border: `1px dashed #C8E4E4` }}>Nessun evento</div>
              ) : dayEvents.map(renderEventCard)}
            </>
          )}

          {/* === VISTA GIORNO === */}
          {agendaView === "giorno" && (
            <>
              {/* Timeline ore — scrollabile con dito */}
              <div style={{ background: "white", borderRadius: 12, border: `1px solid #C8E4E4`, overflowY: "auto", overflowX: "hidden", marginBottom: 12, maxHeight: "60vh" } as any}>
                {Array.from({ length: 15 }, (_, i) => i + 6).map(h => {
                  const hour = `${String(h).padStart(2, "0")}:00`;
                  const hourEvents = dayEvents.filter(e => e.time && e.time.startsWith(String(h).padStart(2, "0")));
                  return (
                    <div key={h} style={{ display: "flex", borderBottom: `1px solid #C8E4E4`, minHeight: 48 }}>
                      <div style={{ width: 48, padding: "4px 6px", fontSize: 10, color: "#4A7070", fontFamily: FM, fontWeight: 600, borderRight: `1px solid #C8E4E4`, flexShrink: 0 }}>{hour}</div>
                      <div style={{ flex: 1, padding: "4px 8px" }}>
                        {hourEvents.map(ev => (
                          <div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "6px 10px", marginBottom: 2, borderRadius: 6, background: selectedEvent?.id === ev.id ? (ev.color || "#28A0A0") + "30" : (ev.color || "#28A0A0") + "18", borderLeft: `3px solid ${ev.color || "#28A0A0"}`, cursor: "pointer", transition: "all 0.15s" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0D1F1F" }}>{ev.text} {ev.persona && <span style={{ fontWeight: 400, color: "#4A7070" }}>· {ev.persona}</span>}</div>
                            {ev.addr && <div style={{ fontSize: 10, color: "#4A7070", marginTop: 1 }}>{ev.addr}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Unscheduled */}
              {dayEvents.filter(e => !e.time).length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#4A7070" }}>Senza orario</div>
                  {dayEvents.filter(e => !e.time).map(ev => (<div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: selectedEvent?.id === ev.id ? (ev.color || "#28A0A0") + "30" : (ev.color || "#28A0A0") + "18", borderLeft: `3px solid ${ev.color || "#28A0A0"}`, cursor: "pointer" }}><div style={{ fontSize: 13, fontWeight: 700, color: "#0D1F1F" }}>{ev.text}</div>{ev.persona && <div style={{ fontSize: 11, color: "#4A7070" }}>{ev.persona} {ev.addr ? "· " + ev.addr : ""}</div>}</div>))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );

}
