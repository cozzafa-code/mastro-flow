// ═══ MASTRO ERP — TabAgenda (Phase B) ═══
import { useMastro } from "../../MastroContext";

export default function TabAgenda() {
  const { T, S, Ico, setTab, expandedDay, setExpandedDay, cantieri, setCantieri, tasks, setSelectedCM, agendaView, setAgendaView, selDate, setSelDate, setShowNewEvent, selectedEvent, setSelectedEvent, setShowMailModal, setMailBody, setNewEvent, events, setEvents, contatti, isTablet, isDesktop } = useMastro();

    const dateStr = (d) => d.toISOString().split("T")[0];
    // Merge events + tasks with dates
    const tasksWithDate = tasks.filter(t => t.date).map(t => ({ ...t, _isTask: true, color: t.priority === "alta" ? "#FF3B30" : t.priority === "media" ? "#FF9500" : "#8E8E93" }));
    const allItems = [...events, ...tasksWithDate];
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

    const renderEventCard = (ev) => (
      <div key={ev.id} style={{ ...S.card, margin: "0 0 8px", opacity: ev._isTask && ev.done ? 0.5 : 1 }} onClick={() => !ev._isTask && setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}>
        <div style={{ ...S.cardInner, display: "flex", gap: 10 }}>
          {ev._isTask ? (
            <div onClick={(e) => { e.stopPropagation(); toggleTask(ev.id); }} style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${ev.done ? T.grn : T.bdr}`, background: ev.done ? T.grn : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, marginTop: 2 }}>
              {ev.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>✓</span>}
            </div>
          ) : (
            <div style={{ width: 3, borderRadius: 2, background: ev.color, flexShrink: 0 }} />
          )}
          {ev.time && <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, minWidth: 38, fontFamily: FM }}>{ev.time}</div>}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, textDecoration: ev._isTask && ev.done ? "line-through" : "none" }}>{ev.text}</div>
            {ev._isTask && ev.meta && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>📝 {ev.meta}</div>}
            {!ev._isTask && ev.addr && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>📍 {ev.addr}</div>}
            <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
              {ev.cm && <span onClick={(e) => { e.stopPropagation(); const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} style={{ ...S.badge(T.accLt, T.acc), cursor: "pointer" }}>{ev.cm}</span>}
              {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>{ev.persona}</span>}
              {ev._isTask && <span style={S.badge(ev.priority === "alta" ? "#FF3B3018" : ev.priority === "media" ? "#FF950018" : "#8E8E9318", ev.priority === "alta" ? "#FF3B30" : ev.priority === "media" ? "#FF9500" : "#8E8E93")}>task · {ev.priority}</span>}
              {!ev._isTask && ev.reminder && <span style={S.badge(ev.reminderSent ? T.grnLt : "#FF950015", ev.reminderSent ? T.grn : "#FF9500")}>{ev.reminderSent ? "✓ Reminder inviato" : `⏰ ${ev.reminder}`}</span>}
              {!ev._isTask && <span style={S.badge(tipoEvColor(ev.tipo) + "18", tipoEvColor(ev.tipo))}>{(TIPI_EVENTO.find(t=>t.id===ev.tipo)||{l:ev.tipo}).l}</span>}
            </div>
          </div>
          <div style={{ alignSelf: "center", transition: "transform 0.2s", transform: selectedEvent?.id === ev.id ? "rotate(90deg)" : "rotate(0deg)" }}>
            <Ico d={ICO.back} s={14} c={T.sub} />
          </div>
        </div>
        {/* Expanded detail */}
        {selectedEvent?.id === ev.id && (
          <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.bdr}`, marginTop: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "10px 0" }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Data</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{new Date(ev.date).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Orario</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{ev.time || "Tutto il giorno"}</div>
              </div>
              {ev.persona && <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Assegnato a</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>👤 {ev.persona}</div>
              </div>}
              {ev.addr && <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>Luogo</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>📍 {ev.addr}</div>
              </div>}
            </div>
            {ev.cm && (
              <div style={{ padding: "8px 10px", background: T.accLt, borderRadius: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5 }}>Commessa collegata</div>
                <div onClick={(e) => { e.stopPropagation(); const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } }} style={{ fontSize: 13, fontWeight: 700, color: T.acc, marginTop: 2, cursor: "pointer" }}>{ev.cm} → Apri commessa</div>
              </div>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <div onClick={(e) => { e.stopPropagation(); if (ev.addr) window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr)); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.blue }}>🗝º Mappa</div>
              <div onClick={(e) => { e.stopPropagation(); const tel = contatti.find(ct => ct.nome === ev.persona)?.telefono; if (tel) window.location.href="tel:" + tel; }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.grn }}>📞 Chiama</div>
              <div onClick={(e) => {
                e.stopPropagation();
                const cmObj = cantieri.find(c => c.code === ev.cm) || null;
                const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente");
                const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                const tpl = `Gentile ${cliente},

Le confermo l'appuntamento:

📅 ${dataFmt}${ev.time ? " alle " + ev.time : ""}
📍 ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarmi.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                setMailBody(tpl);
                setShowMailModal({ ev, cm: cmObj });
              }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.accLt, border: `1px solid ${T.acc}30`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.acc }}>✉️ Mail</div>
              <div onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); setSelectedEvent(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.redLt, border: `1px solid ${T.red}30`, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 600, color: T.red }}>🗝‘</div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#007aff" }}>{"📁"} Commessa</div>
              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#ff9500" }}>{"📏"} Misure</div>
              <div onClick={(e) => { e.stopPropagation(); const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#34c759" }}>{"🔧"} Intervento</div>
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div style={{ paddingBottom: 80 }}>
        <div style={S.header}>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Agenda</div>
            <div style={S.headerSub}>
              {agendaView === "giorno" ? selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) :
               agendaView === "settimana" ? `${weekDays[0].getDate()}–${weekDays[6].getDate()} ${selDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}` :
               selDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
            </div>
          </div>
          <div onClick={() => setShowNewEvent(true)} style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, fontWeight: 300 }}>+</div>
        </div>

        {/* View switcher */}
        <div style={{ display: "flex", gap: 0, margin: "8px 16px", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.bdr}` }}>
          {["giorno", "settimana", "mese"].map(v => (
            <div key={v} onClick={() => setAgendaView(v)} style={{ flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, background: agendaView === v ? T.acc : T.card, color: agendaView === v ? "#fff" : T.sub, cursor: "pointer", textTransform: "capitalize" }}>
              {v}
            </div>
          ))}
        </div>

        {/* Nav arrows */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 16px" }}>
          <div onClick={() => navDate(-1)} style={{ cursor: "pointer", padding: "4px 8px" }}><Ico d={ICO.back} s={18} c={T.sub} /></div>
          <div onClick={() => setSelDate(new Date())} style={{ fontSize: 12, fontWeight: 600, color: T.acc, cursor: "pointer" }}>Oggi</div>
          <div onClick={() => navDate(1)} style={{ cursor: "pointer", padding: "4px 8px", transform: "rotate(180deg)" }}><Ico d={ICO.back} s={18} c={T.sub} /></div>
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
                <span style={{ fontSize: 18 }}>⏰</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#FF9500" }}>
                    {reminderPendenti.length} reminder da inviare
                  </div>
                  <div style={{ fontSize: 10, color: T.sub }}>Avvisa i clienti con 1 click</div>
                </div>
              </div>
              {reminderPendenti.map(ev => {
                const cmObj = cantieri.find(c => c.code === ev.cm);
                const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : ev.persona || "Cliente";
                const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                const tpl = `Gentile ${cliente},

Le ricordiamo l'appuntamento:

📅 ${dataFmt}${ev.time ? " alle " + ev.time : ""}
📍 ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarci.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                return (
                  <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 8px", background:"#fff", borderRadius:8, marginBottom:4, border:"1px solid #FF950030" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ev.text}</div>
                      <div style={{ fontSize:10, color:T.sub }}>{cliente} · {ev.time || "tutto il giorno"}</div>
                    </div>
                    <div onClick={() => {
                      setMailBody(tpl);
                      setShowMailModal({ ev: { ...ev, addr: ev.addr || "" }, cm: cmObj || null });
                      setEvents(es => es.map(x => x.id === ev.id ? { ...x, reminderSent: true } : x));
                    }} style={{ padding:"5px 10px", borderRadius:7, background:"#FF9500", color:"#fff", fontSize:11, fontWeight:800, cursor:"pointer", whiteSpace:"nowrap" }}>
                      ✉️ Invia
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
                <div style={{ ...S.card, marginBottom: 10, padding: "10px 14px", borderLeft: `3px solid ${eventiOggi[0].color || tipoEvColor(eventiOggi[0].tipo)}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>
                      Prossimo evento tra {eventiOggi[0].minutiAlEvento < 60
                        ? `${eventiOggi[0].minutiAlEvento} min`
                        : `${Math.floor(eventiOggi[0].minutiAlEvento/60)}h ${eventiOggi[0].minutiAlEvento%60>0?eventiOggi[0].minutiAlEvento%60+"min":""}`}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{eventiOggi[0].text}</div>
                    {eventiOggi[0].addr && <div style={{ fontSize: 11, color: T.sub }}>📍 {eventiOggi[0].addr}</div>}
                  </div>
                  {eventiOggi[0].addr && (
                    <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(eventiOggi[0].addr))}
                      style={{ padding: "6px 10px", borderRadius: 8, background: T.blueLt, color: T.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      🗝º Naviga
                    </div>
                  )}
                </div>
              )}
              {/* GRIGLIA MENSILE A RIQUADRI */}
              <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
                style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden", marginBottom: 12 }}>
                {/* Intestazione giorni */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: `1px solid ${T.bdr}` }}>
                  {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.sub, padding: "7px 4px", textAlign: "center", borderRight: i < 6 ? `1px solid ${T.bdr}` : "none" }}>{d}</div>
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
                        borderRight: col < 6 ? `1px solid ${T.bdr}` : "none",
                        borderBottom: `1px solid ${T.bdr}`,
                        background: sel ? T.acc + "18" : isExp ? T.accLt : isWeekend && inMonth ? T.bg : T.card,
                        cursor: "pointer", position: "relative",
                        outline: sel ? `2px solid ${T.acc}` : isExp ? `1.5px solid ${T.acc}50` : "none",
                        outlineOffset: -1,
                      }}>
                        {/* Numero giorno */}
                        <div style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 22, height: 22, borderRadius: "50%", fontSize: 12, fontWeight: sel || tod ? 800 : 400,
                          background: tod ? T.acc : "transparent",
                          color: tod ? "#fff" : !inMonth ? T.sub2 : sel ? T.acc : T.text,
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
                          <div style={{ fontSize: 9, color: T.sub, fontWeight: 600 }}>+{evs.length - 3} altri</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Sezione prossimi eventi */}
              {prossimiEventi.length > 0 && (
                <div style={{ ...S.card, marginBottom: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Prossimi eventi</div>
                  {prossimiEventi.map((ev, i) => {
                    const evDate = new Date(ev.date + "T12:00:00");
                    const isEvToday = ev.date === todayStr;
                    const isEvTomorrow = ev.date === dateStr(new Date(Date.now() + 86400000));
                    const labelData = isEvToday ? "Oggi" : isEvTomorrow ? "Domani" : evDate.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={ev.id} onClick={() => { setSelDate(evDate); setSelectedEvent(ev); }}
                        style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < prossimiEventi.length-1 ? `1px solid ${T.bdr}` : "none", cursor: "pointer", alignItems: "center" }}>
                        <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: ev.color || tipoEvColor(ev.tipo), flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.text}</div>
                          <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                            {ev.cm && <span style={S.badge(T.accLt, T.acc)}>{ev.cm}</span>}
                            {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>👤 {ev.persona}</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isEvToday ? T.acc : T.sub }}>{labelData}</div>
                          {ev.time && <div style={{ fontSize: 11, color: T.sub }}>{ev.time}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pannello evento selezionato (click su evento nella griglia) */}
              {selectedEvent && isSameDay(new Date(selectedEvent.date), selDate) && (
                <div style={{ ...S.card, padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${selectedEvent.color || T.acc}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{selectedEvent.text}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {selectedEvent.time && <span style={S.badge(T.bg, T.sub)}>🕐 {selectedEvent.time}</span>}
                        {selectedEvent.cm && <span style={S.badge(T.accLt, T.acc)}>{selectedEvent.cm}</span>}
                        {selectedEvent.persona && <span style={S.badge(T.purpleLt, T.purple)}>👤 {selectedEvent.persona}</span>}
                        {selectedEvent.addr && <span style={S.badge(T.grnLt, T.grn)}>📍 {selectedEvent.addr}</span>}
                      </div>
                    </div>
                    <div onClick={() => setSelectedEvent(null)} style={{ padding: 4, cursor: "pointer", color: T.sub, fontSize: 16 }}>×</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    {selectedEvent.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(selectedEvent.addr))} style={{ flex:1, padding:"6px", borderRadius:6, background:T.blueLt, textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:T.blue }}>🗝º Mappa</div>}
                    <div onClick={() => {
                      const ev = selectedEvent;
                      const cmObj = cantieri.find(c => c.code === ev.cm) || null;
                      const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente");
                      const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" });
                      const tpl = `Gentile ${cliente},

Le confermo l'appuntamento:

📅 ${dataFmt}${ev.time ? " alle " + ev.time : ""}
📍 ${ev.addr || "da concordare"}

${ev.text}

Per qualsiasi necessità non esiti a contattarmi.

Cordiali saluti,
Fabio Cozza
Walter Cozza Serramenti`;
                      setMailBody(tpl);
                      setShowMailModal({ ev, cm: cmObj });
                    }} style={{ flex:1, padding:"6px", borderRadius:6, background:T.accLt, textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:T.acc }}>✉️ Mail</div>
                    <div onClick={() => deleteEvent(selectedEvent.id)} style={{ flex:1, padding:"6px", borderRadius:6, background:T.redLt, textAlign:"center", cursor:"pointer", fontSize:11, fontWeight:600, color:T.red }}>🗝‘ Elimina</div>
                  </div>
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: T.sub, fontSize: 12, background: T.card, borderRadius: T.r, border: `1px dashed ${T.bdr}` }}>Nessun evento. Tocca + per aggiungere.</div>
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
                    <div key={i} onClick={() => setSelDate(new Date(d))} style={{ flex: 1, textAlign: "center", padding: "8px 2px", borderRadius: 10, background: sel ? T.acc : tod ? T.accLt : T.card, border: `1px solid ${sel ? T.acc : T.bdr}`, cursor: "pointer" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: sel ? "#fff" : T.sub, textTransform: "uppercase" }}>
                        {["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"][i]}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: sel ? "#fff" : T.text, marginTop: 2 }}>{d.getDate()}</div>
                      {n > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel ? "#fff" : T.red, margin: "2px auto 0" }} />}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                {selDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              {dayEvents.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: T.sub, fontSize: 12, background: T.card, borderRadius: T.r, border: `1px dashed ${T.bdr}` }}>Nessun evento</div>
              ) : dayEvents.map(renderEventCard)}
            </>
          )}

          {/* === VISTA GIORNO === */}
          {agendaView === "giorno" && (
            <>
              {/* Timeline ore — scrollabile con dito */}
              <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflowY: "auto", overflowX: "hidden", marginBottom: 12, maxHeight: "60vh" } as any}>
                {Array.from({ length: 15 }, (_, i) => i + 6).map(h => {
                  const hour = `${String(h).padStart(2, "0")}:00`;
                  const hourEvents = dayEvents.filter(e => e.time && e.time.startsWith(String(h).padStart(2, "0")));
                  return (
                    <div key={h} style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, minHeight: 48 }}>
                      <div style={{ width: 48, padding: "4px 6px", fontSize: 10, color: T.sub, fontFamily: FM, fontWeight: 600, borderRight: `1px solid ${T.bdr}`, flexShrink: 0 }}>{hour}</div>
                      <div style={{ flex: 1, padding: "4px 8px" }}>
                        {hourEvents.map(ev => (
                          <div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "6px 10px", marginBottom: 2, borderRadius: 6, background: selectedEvent?.id === ev.id ? (ev.color || T.acc) + "30" : (ev.color || T.acc) + "18", borderLeft: `3px solid ${ev.color || T.acc}`, cursor: "pointer", transition: "all 0.15s" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{ev.text} {ev.persona && <span style={{ fontWeight: 400, color: T.sub }}>· {ev.persona}</span>}</div>
                            {ev.addr && <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{ev.addr}</div>}
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
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: T.sub }}>Senza orario</div>
                  {dayEvents.filter(e => !e.time).map(ev => (<div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: selectedEvent?.id === ev.id ? (ev.color || T.acc) + "30" : (ev.color || T.acc) + "18", borderLeft: `3px solid ${ev.color || T.acc}`, cursor: "pointer" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ev.text}</div>{ev.persona && <div style={{ fontSize: 11, color: T.sub }}>{ev.persona} {ev.addr ? "· " + ev.addr : ""}</div>}</div>))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
}
