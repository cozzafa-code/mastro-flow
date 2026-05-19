// ═══ MASTRO ERP — TabHome (Phase B extraction) ═══
import { useMastro } from "../../MastroContext";

export default function TabHome() {
  const ctx = useMastro();
  const {
    tab, setTab, T, S, Ico, homeEditMode, setHomeEditMode,
    dayOffset, setDayOffset, ioChecked, setIoChecked, collapsed,
    cantieri, tasks, problemi, setShowProblemiView,
    sogliaDays, fattureDB, ordiniFornDB, squadreDB, montaggiDB,
    setSelectedCM, setSelectedVano, setFilterFase, setSettingsTab,
    cmFaseIdx, setCmFaseIdx, setSelectedEvent, events,
    globalSearch, setGlobalSearch, drag, plan, activePlan,
    isTablet, isDesktop, PipelineBar, SectionHead,
  } = ctx;

    const todayISO = today.toISOString().split("T")[0];
    const h = today.getHours();
    const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
    const SOGLIA_GIORNI = sogliaDays;
    const ferme = cantieri.filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= SOGLIA_GIORNI);
    const misureInAttesa = cantieri.filter(c => c.fase === "misure" && getVaniAttivi(c).some(v => Object.keys(v.misure || {}).length < 4));
    const preventiviDaFare = cantieri.filter(c => c.fase === "preventivo");
    const todayEvents = events.filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    const taskUrgenti = tasks.filter(t => !t.done && t.priority === "alta");

    // Build IO actions
    const ioActions: Array<{ id: string; titolo: string; sotto: string; urgenza: string; color: string; icon: string }> = [];
    ferme.slice(0, 2).forEach(c => ioActions.push({ id: "f-" + c.id, titolo: `Sbloccare ${c.cliente}`, sotto: `${c.code} · ferma ${giorniFermaCM(c)}gg · fase ${PIPELINE.find(p => p.id === c.fase)?.nome || c.fase}`, urgenza: "alta", color: T.red, icon: "⚠️" }));
    preventiviDaFare.slice(0, 1).forEach(c => ioActions.push({ id: "p-" + c.id, titolo: `Inviare preventivo ${c.cliente}`, sotto: `${c.code} · ${c.indirizzo || "—"}`, urgenza: "alta", color: "#af52de", icon: "📋" }));
    misureInAttesa.slice(0, 1).forEach(c => { const tot = getVaniAttivi(c).length; const ok = getVaniAttivi(c).filter(v => Object.keys(v.misure || {}).length >= 4).length; ioActions.push({ id: "m-" + c.id, titolo: `Completare misure ${c.cliente}`, sotto: `${c.code} · ${ok}/${tot} vani misurati`, urgenza: "media", color: "#ff9500", icon: "📐" }); });
    todayEvents.slice(0, 1).forEach(e => ioActions.push({ id: "e-" + e.id, titolo: e.text, sotto: `${e.time || "—"} · ${e.persona || "—"} · ${e.addr || "—"}`, urgenza: "media", color: e.color || "#007aff", icon: "📍" }));
    taskUrgenti.slice(0, 1).forEach(t => ioActions.push({ id: "t-" + t.id, titolo: t.text, sotto: t.meta || "Task urgente", urgenza: "alta", color: T.red, icon: "☑️" }));
    const ioRemaining = ioActions.filter(a => !ioChecked[a.id]);
    const ioDone = ioActions.filter(a => ioChecked[a.id]);

    // Day navigation for programma
    const getDateForOffset = (off: number) => { const d = new Date(today); d.setDate(d.getDate() + off); return d; };
    const dayDate = getDateForOffset(dayOffset);
    const dayISO = dayDate.toISOString().split("T")[0];
    const dayEvents = events.filter(e => e.date === dayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
    const dayLabel = dayOffset === 0 ? "Oggi" : dayOffset === -1 ? "Ieri" : dayOffset === 1 ? "Domani" : dayDate.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
    const isPast = dayOffset < 0;

    // Week strip
    const weekDays: Date[] = [];
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    for (let i = 0; i < 7; i++) { const d = new Date(monday); d.setDate(monday.getDate() + i); weekDays.push(d); }
    const dayNames = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];

    // Commesse filtered
    const fasi = ["tutte", ...PIPELINE.filter(p => p.attiva).map(p => p.id)];
    const faseSel = fasi[cmFaseIdx];
    const cmFiltrate = faseSel === "tutte" ? cantieri : cantieri.filter(c => c.fase === faseSel);

    const sections: Record<string, any> = {
      // ═══ CONTATORI ═══
      contatori: (
        <div key="contatori">
          <SectionHead id="contatori" icon="" title="Stato lavori" />
          {!collapsed["contatori"] && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px", marginBottom: 8 }}>
              {[
                { id: "misure", icon: "📐", label: "In misure", count: cantieri.filter(c => c.fase === "misure").length, color: "#ff9500", sub: `${misureInAttesa.length} da completare` },
                { id: "prev", icon: "📋", label: "Preventivi", count: preventiviDaFare.length, color: "#af52de", sub: preventiviDaFare.length > 0 ? `${preventiviDaFare[0]?.cliente}` : "Nessuno" },
                { id: "ferme", icon: "⚠️", label: "Ferme", count: ferme.length, color: T.red, sub: ferme.length > 0 ? `da ${ferme[0] ? giorniFermaCM(ferme[0]) : 0}gg` : "Tutto ok" },
                { id: "oggi", icon: "📅", label: "Oggi", count: todayEvents.length, color: "#007aff", sub: todayEvents[0] ? `Prossimo: ${todayEvents[0].time || "—"}` : "Nessun evento" },
              ].map(c => (
                <div key={c.id} onClick={() => {
                  if (c.id === "misure") { setFilterFase("misure"); setTab("commesse"); }
                  else if (c.id === "prev") { setFilterFase("preventivo"); setTab("commesse"); }
                  else if (c.id === "ferme") { setFilterFase("tutte"); setTab("commesse"); }
                  else if (c.id === "oggi") { setTab("agenda"); }
                }} style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh, padding: "10px 12px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(135deg, ${c.color}, ${c.color}80)` }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: FM, lineHeight: 1 }}>{c.count}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase" as const, letterSpacing: 0.5, marginTop: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>{c.sub}</div>
                    </div>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.icon}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ),

      // ═══ IO — briefing personale ═══
      io: (() => {
        if (ioActions.length === 0) return null;
        return (
          <div key="io">
            <SectionHead id="io" icon="👤" title="IO · Da fare oggi" count={ioRemaining.length} countColor={ioRemaining.some(a => a.urgenza === "alta") ? T.red : "#ff9500"} />
            {!collapsed["io"] && (
              <div style={{ padding: "0 16px", marginBottom: 8 }}>
                <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: T.acc + "08", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>Completamento giornata</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: T.acc, fontFamily: FM }}>{ioDone.length}/{ioActions.length}</span>
                  </div>
                  <div style={{ height: 3, background: T.bg }}><div style={{ height: "100%", background: T.acc, width: `${ioActions.length > 0 ? (ioDone.length / ioActions.length) * 100 : 0}%`, transition: "width 0.3s", borderRadius: 2 }} /></div>
                  {ioRemaining.map(a => (
                    <div key={a.id} style={{ padding: "10px 12px", borderBottom: `1px solid ${T.bg}`, display: "flex", alignItems: "center", gap: 10 }}>
                      <div onClick={() => setIoChecked(prev => ({ ...prev, [a.id]: true }))}
                        style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${a.color}`, flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
                          <span style={{ fontSize: 12 }}>{a.icon}</span>
                          {a.urgenza === "alta" && <span style={{ ...S.badge(T.red + "15", T.red), fontSize: 8, fontWeight: 800, padding: "1px 5px" }}>URGENTE</span>}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.titolo}</div>
                        <div style={{ fontSize: 10, color: T.sub }}>{a.sotto}</div>
                      </div>
                    </div>
                  ))}
                  {ioDone.length > 0 && (
                    <div style={{ padding: "6px 12px", background: T.grn + "08" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: T.grn, marginBottom: 4 }}>✓ COMPLETATE ({ioDone.length})</div>
                      {ioDone.map(a => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", opacity: 0.5 }}>
                          <span style={{ fontSize: 10, color: T.grn }}>✓</span>
                          <span style={{ fontSize: 10, color: T.sub, textDecoration: "line-through" }}>{a.titolo}</span>
                          <span onClick={() => setIoChecked(prev => { const n = { ...prev }; delete n[a.id]; return n; })} style={{ fontSize: 8, color: T.sub, cursor: "pointer", marginLeft: "auto" }}>↩</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })(),

      // ═══ ATTENZIONE ═══
      attenzione: (ferme.length > 0 || problemi.filter(p => p.stato !== "risolto").length > 0) ? (
        <div key="attenzione">
          <div style={{ margin: "0 16px 8px" }}>
            <div onClick={() => toggleCollapse("attenzione")} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", borderRadius: !collapsed["attenzione"] ? `${T.r}px ${T.r}px 0 0` : T.r,
              background: T.red + "10", border: `1px solid ${T.red}18`, cursor: "pointer"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: T.red, textTransform: "uppercase" as const, letterSpacing: "0.1em", fontFamily: FM }}>⚠️ ATTENZIONE</span>
                <span style={{ ...S.badge(T.red, "#fff") }}>{ferme.length + problemi.filter(p => p.stato !== "risolto").length}</span>
              </div>
              <span style={{ fontSize: 9, color: T.sub, display: "inline-block", transform: collapsed["attenzione"] ? "rotate(-90deg)" : "none", transition: "transform 0.15s" }}>▼</span>
            </div>
            {!collapsed["attenzione"] && (<>
            {/* Problemi aperti */}
            {problemi.filter(p => p.stato !== "risolto").map((p, i) => (
              <div key={p.id} onClick={() => { const cm = cantieri.find(c => c.id === p.commessaId); if (cm) { setSelectedCM(cm); setTab("commesse"); setTimeout(() => setShowProblemiView(true), 200); } }}
                style={{
                  padding: "10px 14px", background: T.card,
                  borderLeft: `3px solid #FF3B30`, borderRight: `1px solid ${T.red}18`,
                  borderBottom: `1px solid ${T.red}18`,
                  borderRadius: i === 0 && ferme.length === 0 ? 0 : 0,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10
                }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ ...S.badge("#FF3B3015", "#FF3B30"), fontSize: 9, fontWeight: 800, fontFamily: FM }}>🚨 {p.stato === "in_corso" ? "IN CORSO" : "APERTO"}</span>
                    <span style={{ fontSize: 10, color: T.sub, fontFamily: FM }}>{p.commessaCode}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.titolo}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{p.cliente}{p.assegnatoA ? ` · 👤 ${p.assegnatoA}` : ""}</div>
                </div>
                <span style={{ color: T.sub, fontSize: 16 }}>›</span>
              </div>
            ))}
            {/* Commesse ferme */}
            {ferme.map((c, i) => (
              <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                style={{
                  padding: "10px 14px", background: T.card,
                  borderLeft: `3px solid ${T.red}`, borderRight: `1px solid ${T.red}18`,
                  borderBottom: `1px solid ${T.red}18`,
                  borderRadius: i === ferme.length - 1 ? `0 0 ${T.r}px ${T.r}px` : 0,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 10
                }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ ...S.badge(T.red + "15", T.red), fontSize: 9, fontWeight: 800, fontFamily: FM }}>FERMA {giorniFermaCM(c)}gg</span>
                    <span style={{ fontSize: 10, color: T.sub, fontFamily: FM }}>{c.code}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.cliente}</div>
                  <div style={{ fontSize: 11, color: T.acc, fontWeight: 600, marginTop: 2 }}>→ {PIPELINE.find(p => p.id === c.fase)?.nome || c.fase}</div>
                </div>
                <span style={{ color: T.sub, fontSize: 16 }}>›</span>
              </div>
            ))}
            </>)}
          </div>
        </div>
      ) : null,

      // ═══ PROGRAMMA OGGI — swipeable ═══
      programma: (() => {
        return (
          <div key="programma">
            <SectionHead id="programma" icon="📋" title="Programma" count={todayEvents.length} countColor="#007aff" />
            {!collapsed["programma"] && (
              <div style={{ padding: "0 16px", marginBottom: 8 }}>
                <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh, overflow: "hidden" }}>
                  {/* Day navigation */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${T.bdr}`, background: T.bg }}>
                    <div onClick={() => setDayOffset(d => d - 1)} style={{ padding: "4px 10px", cursor: "pointer", fontSize: 14, color: T.sub }}>‹</div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: dayOffset === 0 ? T.acc : T.text }}>{dayLabel}</div>
                      <div style={{ fontSize: 9, color: T.sub }}>{dayDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}</div>
                    </div>
                    <div onClick={() => setDayOffset(d => d + 1)} style={{ padding: "4px 10px", cursor: "pointer", fontSize: 14, color: T.sub }}>›</div>
                  </div>
                  {dayOffset !== 0 && (
                    <div onClick={() => setDayOffset(0)} style={{ textAlign: "center", padding: "4px", fontSize: 10, color: T.acc, fontWeight: 600, cursor: "pointer", background: T.acc + "06" }}>
                      ← Torna a oggi
                    </div>
                  )}
                  {dayEvents.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{isPast ? "✓" : "☀️"}</div>
                      <div style={{ fontSize: 12, color: T.sub }}>
                        {isPast ? "Nessuna attività registrata" : "Nessuna attività programmata"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ position: "relative", padding: "8px 0" }}>
                      <div style={{ position: "absolute", left: 33, top: 16, bottom: 16, width: 2, background: T.bdr, zIndex: 0 }} />
                      {dayEvents.map(ev => (
                        <div key={ev.id} onClick={() => setSelectedEvent(ev)}
                          style={{ display: "flex", gap: 12, position: "relative", zIndex: 1, cursor: "pointer", padding: "0 12px" }}>
                          <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", width: 44, flexShrink: 0, paddingTop: 10 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: ev.color || "#007aff", border: `2px solid ${T.card}`, boxShadow: `0 0 0 2px ${(ev.color || "#007aff")}40`, zIndex: 2 }} />
                            {ev.time && <div style={{ fontSize: 9, fontWeight: 700, color: ev.color || "#007aff", fontFamily: FM, marginTop: 3 }}>{ev.time}</div>}
                          </div>
                          <div style={{
                            flex: 1, padding: "8px 12px", borderRadius: T.r, background: T.card,
                            border: `1px solid ${T.bdr}`, borderLeft: `3px solid ${ev.color || "#007aff"}`,
                            marginBottom: 6, boxShadow: T.cardSh, opacity: isPast ? 0.6 : 1
                          }}>
                            {isPast && <span style={{ ...S.badge(T.grn + "15", T.grn), fontSize: 8, fontWeight: 800, marginBottom: 4, display: "inline-block" }}>✓ FATTO</span>}
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ev.text}</div>
                            <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                              {ev.persona && `${ev.persona} · `}{ev.addr || ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })(),

      // ═══ SETTIMANA ═══
      settimana: (
        <div key="settimana">
          <SectionHead id="settimana" icon="📅" title="Questa settimana" extra={<button onClick={() => setTab("agenda")} style={S.sectionBtn}>Apri agenda</button>} />
          {!collapsed["settimana"] && (
            <div style={{ padding: "0 16px", marginBottom: 8 }}>
              <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh, padding: "10px 6px", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                {weekDays.map((d, i) => {
                  const dISO = d.toISOString().split("T")[0];
                  const isToday = dISO === todayISO;
                  const evs = events.filter(e => e.date === dISO);
                  return (
                    <div key={i} onClick={() => { setDayOffset(Math.round((d.getTime() - today.getTime()) / 86400000)); }} style={{ textAlign: "center" as const, cursor: "pointer", padding: "4px 0" }}>
                      <div style={{ fontSize: 9, fontWeight: 600, color: i >= 5 ? "#ff9500" : T.sub, textTransform: "uppercase" as const }}>{dayNames[i]}</div>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%", margin: "4px auto",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 13, fontWeight: isToday ? 800 : 500,
                        background: isToday ? T.acc : "transparent", color: isToday ? "#fff" : T.text,
                      }}>{d.getDate()}</div>
                      <div style={{ display: "flex", justifyContent: "center", gap: 2, minHeight: 6, marginTop: 2 }}>
                        {evs.slice(0, 3).map((ev, j) => (
                          <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: ev.color || "#007aff" }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ),

      // ═══ COMMESSE ═══
      commesse: (
        <div key="commesse">
          <SectionHead id="commesse" icon="📁" title={`Commesse ${cmFiltrate.length}`} extra={<button onClick={() => setTab("commesse")} style={S.sectionBtn}>Vedi tutte</button>} />
          {!collapsed["commesse"] && (
            <div>
              <div style={{ display: "flex", gap: 5, padding: "0 16px 8px", overflowX: "auto" as const }}>
                {fasi.map((f, i) => {
                  const p = PIPELINE.find(x => x.id === f);
                  const n = f === "tutte" ? cantieri.length : cantieri.filter(c => c.fase === f).length;
                  if (n === 0 && f !== "tutte") return null;
                  return (
                    <div key={f} onClick={() => setCmFaseIdx(i)} style={{
                      padding: "5px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" as const,
                      background: cmFaseIdx === i ? (p?.color || T.acc) : T.card,
                      color: cmFaseIdx === i ? "#fff" : T.sub,
                      border: `1px solid ${cmFaseIdx === i ? (p?.color || T.acc) : T.bdr}`,
                    }}>
                      {p?.ico || "📁"} {p?.nome || "Tutte"} {n > 0 && <span style={{ fontWeight: 800 }}>{n}</span>}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "0 16px" }}>
                {cmFiltrate.slice(0, 5).map(c => {
                  const p = PIPELINE.find(x => x.id === c.fase);
                  const isFerma = giorniFermaCM(c) >= SOGLIA_GIORNI;
                  const vaniTot = getVaniAttivi(c).length;
                  const vaniOk = getVaniAttivi(c).filter(v => Object.keys(v.misure || {}).length >= 4).length;
                  const faseIdx = PIPELINE.findIndex(x => x.id === c.fase);
                  const progFase = faseIdx >= 0 ? Math.round((faseIdx + 1) / PIPELINE.length * 100) : 0;
                  return (
                    <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                      style={{
                        background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh,
                        padding: "11px 13px", cursor: "pointer", marginBottom: 8, overflow: "hidden",
                        borderLeft: `3px solid ${isFerma ? T.red : p?.color || T.acc}`,
                      }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" as const }}>
                            <span style={{ fontSize: 11, color: T.sub, fontFamily: FM }}>{c.code}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{c.cliente}</span>
                            {isFerma && <span style={{ ...S.badge(T.red + "15", T.red), fontSize: 9, fontWeight: 800 }}>FERMA {giorniFermaCM(c)}gg</span>}
                          </div>
                          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{c.indirizzo || "—"}</div>
                          <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" as const, alignItems: "center" }}>
                            <span style={{ ...S.badge((p?.color || T.acc) + "18", p?.color || T.acc), fontSize: 10 }}>{p?.ico} {p?.nome}</span>
                            {vaniTot > 0 && <span style={{ fontSize: 10, color: T.sub }}>{vaniOk}/{vaniTot} vani</span>}
                          </div>
                          {/* Prossima azione */}
                          <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: T.acc + "08", border: `1px solid ${T.acc}15`, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 11, color: T.acc, fontWeight: 800 }}>→</span>
                            <span style={{ fontSize: 11, color: T.acc, fontWeight: 600, lineHeight: "1.3" }}>
                              {c.fase === "misure" ? `Completare misure (${vaniOk}/${vaniTot})` :
                               c.fase === "preventivo" ? "Preparare e inviare preventivo" :
                               c.fase === "sopralluogo" ? "Eseguire sopralluogo" :
                               c.fase === "ordini" ? "Verificare ordini materiali" :
                               c.fase === "produzione" ? "Seguire produzione" :
                               c.fase === "posa" ? "Programmare posa in opera" :
                               `Fase: ${p?.nome || c.fase}`}
                            </span>
                          </div>
                        </div>
                        <span style={{ color: T.sub, fontSize: 16, flexShrink: 0 }}>›</span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <span style={{ fontSize: 10, color: T.sub }}>Pipeline</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: isFerma ? T.red : p?.color || T.acc }}>{progFase}%</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: T.bg, overflow: "hidden" }}>
                          <div style={{ height: "100%", borderRadius: 2, background: isFerma ? T.red : p?.color || T.acc, width: `${progFase}%`, transition: "width 0.3s" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ),

      // ═══ WORKFLOW COMMESSE ═══
      azioni: (() => {
        const totale = cantieri.length;
        const faseData = PIPELINE.filter(p => p.attiva).map(p => ({
          ...p, count: cantieri.filter(c => c.fase === p.id).length
        }));
        const maxCount = Math.max(...faseData.map(f => f.count), 1);
        return (
          <div key="azioni">
            <SectionHead id="azioni" icon="🔄" title="Workflow commesse" count={totale} countColor={T.acc} extra={<button onClick={() => setTab("commesse")} style={S.sectionBtn}>Vedi tutte</button>} />
            {!collapsed["azioni"] && (
              <div style={{ padding: "0 16px", marginBottom: 16 }}>
                <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, boxShadow: T.cardSh, overflow: "hidden" }}>
                  {/* Pipeline flow */}
                  <div style={{ display: "flex", alignItems: "center", padding: "10px 12px 6px", gap: 2, overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as any, scrollbarWidth: "none" as any }}>
                    {faseData.map((f, i) => (
                      <div key={f.id} style={{ display: "flex", alignItems: "center", flexShrink: 0, minWidth: 56 }}>
                        <div onClick={() => { setFilterFase(f.id); setTab("commesse"); }}
                          style={{ width: 56, textAlign: "center" as const, cursor: "pointer", padding: "4px 2px", borderRadius: 6, background: f.count > 0 ? f.color + "10" : "transparent", transition: "background 0.15s" }}>
                          <div style={{ fontSize: 16 }}>{f.ico}</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: f.count > 0 ? f.color : T.sub + "60", fontFamily: FM, lineHeight: 1 }}>{f.count}</div>
                          <div style={{ fontSize: 7, fontWeight: 700, color: f.count > 0 ? f.color : T.sub, textTransform: "uppercase" as const, letterSpacing: 0.3, marginTop: 1, whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{f.nome}</div>
                        </div>
                        {i < faseData.length - 1 && <span style={{ fontSize: 8, color: T.bdr, flexShrink: 0, margin: "0 1px" }}>›</span>}
                      </div>
                    ))}
                  </div>
                  {/* Bar chart */}
                  <div style={{ display: "flex", gap: 3, padding: "4px 12px 10px", alignItems: "flex-end", height: 32, overflowX: "auto" as const, scrollbarWidth: "none" as any }}>
                    {faseData.map(f => (
                      <div key={f.id} style={{ flexShrink: 0, minWidth: 56, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 0 }}>
                        <div style={{
                          width: "100%", borderRadius: "3px 3px 0 0",
                          height: f.count > 0 ? Math.max(4, (f.count / maxCount) * 28) : 2,
                          background: f.count > 0 ? f.color : T.bdr,
                          opacity: f.count > 0 ? 0.7 : 0.3,
                          transition: "height 0.3s"
                        }} />
                      </div>
                    ))}
                  </div>
                  {/* Ferme alert inline */}
                  {ferme.length > 0 && (
                    <div style={{ padding: "6px 12px", background: T.red + "06", borderTop: `1px solid ${T.red}12`, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10 }}>⚠️</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.red }}>{ferme.length} ferme da &gt;{SOGLIA_GIORNI}gg</span>
                      <span style={{ fontSize: 9, color: T.sub, marginLeft: "auto" }}>{ferme.map(c => c.code).join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })(),

      // ═══ DASHBOARD ECONOMICA ═══
      dashboard: (() => {
        const cmConf = cantieri.filter(c => c.confermato);
        const cmChiuse = cantieri.filter(c => c.fase === "chiusura");
        const fattMese = cantieri.filter(c => {
          if (!c.euro) return false;
          const d = c.dataConferma || "";
          const now = new Date();
          return d.includes("/" + (now.getMonth() + 1).toString().padStart(2,"0") + "/" + now.getFullYear()) || c.fase === "chiusura";
        }).reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
        const totPrev = cantieri.filter(c => c.euro && c.fase !== "chiusura").reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
        const totConf = cmConf.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
        const totChiuse = cmChiuse.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0);
        const convRate = cantieri.length > 0 ? Math.round(cmConf.length / cantieri.length * 100) : 0;
        return (
          <div key="dashboard">
            <SectionHead id="dashboard" icon="📊" title="Dashboard" />
            {!collapsed["dashboard"] && (
              <div style={{ padding: "0 16px", marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase", fontWeight: 700 }}>Preventivi aperti</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>€{totPrev.toLocaleString("it-IT")}</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{cantieri.filter(c => c.euro && c.fase !== "chiusura").length} commesse</div>
                  </div>
                  <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase", fontWeight: 700 }}>Confermati</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#34c759" }}>€{totConf.toLocaleString("it-IT")}</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{cmConf.length} commesse · {convRate}% conv.</div>
                  </div>
                  <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase", fontWeight: 700 }}>Chiusi/Fatturati</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#007aff" }}>€{totChiuse.toLocaleString("it-IT")}</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{cmChiuse.length} commesse</div>
                  </div>
                  <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase", fontWeight: 700 }}>In produzione</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#5856d6" }}>{cantieri.filter(c => c.trackingStato && !["montato"].includes(c.trackingStato)).length}</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{cantieri.filter(c => c.trackingStato === "pronto").length} pronti da consegnare</div>
                  </div>
                </div>
                {/* Scadenzario rapido */}
                {cantieri.filter(c => c.confermato && c.euro && c.fase !== "chiusura").length > 0 && (
                  <div style={{ marginTop: 8, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>💰 Da incassare</div>
                    {cantieri.filter(c => c.confermato && c.euro && c.fase !== "chiusura").slice(0, 5).map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}>
                        <span style={{ color: T.text }}>{c.cliente} <span style={{ color: T.sub, fontSize: 9 }}>{c.code}</span></span>
                        <span style={{ fontWeight: 700, color: "#34c759" }}>€{parseFloat(c.euro).toLocaleString("it-IT")}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Ordini fornitore in arrivo */}
                {ordiniFornDB.filter(o => o.stato !== "consegnato").length > 0 && (
                  <div style={{ marginTop: 8, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>📦 Ordini fornitore</div>
                    {ordiniFornDB.filter(o => o.stato !== "consegnato").sort((a, b) => (a.consegna?.prevista || "z").localeCompare(b.consegna?.prevista || "z")).slice(0, 5).map(o => {
                      const st = ORDINE_STATI.find(s => s.id === o.stato) || ORDINE_STATI[0];
                      const isLate = o.consegna?.prevista && new Date(o.consegna.prevista) < new Date();
                      return (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}>
                          <div>
                            <span style={{ marginRight: 4 }}>{st.icon}</span>
                            <b>{o.fornitore?.nome || "—"}</b>
                            <span style={{ color: T.sub, marginLeft: 4 }}>{o.cmCode}</span>
                          </div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            {o.consegna?.prevista && <span style={{ fontSize: 9, color: isLate ? "#ff3b30" : T.sub, fontWeight: isLate ? 700 : 400 }}>{isLate ? "⚠️ " : ""}{new Date(o.consegna.prevista).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</span>}
                            <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 8, fontWeight: 700, background: st.color + "20", color: st.color }}>{st.label}</span>
                          </div>
                        </div>
                      );
                    })}
                    {ordiniFornDB.filter(o => o.stato !== "consegnato" && !o.conferma?.firmata && o.conferma?.ricevuta).length > 0 && (
                      <div style={{ marginTop: 6, fontSize: 9, color: "#ff9500", fontWeight: 700 }}>⚠️ {ordiniFornDB.filter(o => !o.conferma?.firmata && o.conferma?.ricevuta).length} conferme da firmare</div>
                    )}
                  </div>
                )}

                {/* Montaggi prossimi */}
                {montaggiDB.filter(m => m.stato !== "completato").length > 0 && (
                  <div style={{ marginTop: 8, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>🔧 Prossimi montaggi</div>
                    {montaggiDB.filter(m => m.stato !== "completato").sort((a, b) => (a.data || "z").localeCompare(b.data || "z")).slice(0, 5).map(m => {
                      const sq = squadreDB.find(s => s.id === m.squadraId);
                      return (
                        <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}>
                          <span style={{ color: T.text }}>
                            {m.data ? new Date(m.data).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "—"}{" "}
                            <span style={{ color: sq?.colore || T.sub, fontWeight: 600 }}>{sq?.nome || "—"}</span>
                          </span>
                          <span style={{ color: T.text, fontWeight: 600 }}>{m.cliente} <span style={{ color: T.sub, fontSize: 9 }}>{m.vaniCount}v</span></span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Consegne fornitore in arrivo */}
                {ordiniFornDB.filter(o => o.dataConsegnaPrev && o.stato !== "consegnato").length > 0 && (
                  <div style={{ marginTop: 8, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>🚛 Consegne in arrivo</div>
                    {ordiniFornDB.filter(o => o.dataConsegnaPrev && o.stato !== "consegnato").sort((a, b) => (a.dataConsegnaPrev || "z").localeCompare(b.dataConsegnaPrev || "z")).slice(0, 5).map(o => {
                      const isLate = o.dataConsegnaPrev < new Date().toISOString().split("T")[0];
                      const cm = cantieri.find(cc => cc.id === o.cmId);
                      return (
                        <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}>
                          <span style={{ color: isLate ? "#ff3b30" : T.text }}>
                            {isLate ? "⚠️ " : ""}
                            {new Date(o.dataConsegnaPrev).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}{" "}
                            <span style={{ color: "#ff9500", fontWeight: 600 }}>{o.fornitore}</span>
                          </span>
                          <span style={{ color: T.text, fontWeight: 600 }}>{cm?.cliente || "—"}{o.costo > 0 && <span style={{ color: T.sub, fontSize: 9 }}> €{o.costo.toLocaleString("it-IT")}</span>}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Scadenzario fatture */}
                {fattureDB.filter(f => !f.pagata).length > 0 && (
                  <div style={{ marginTop: 8, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>⏳ Fatture da incassare</div>
                    {fattureDB.filter(f => !f.pagata).sort((a, b) => (a.scadenza || "z").localeCompare(b.scadenza || "z")).map(f => {
                      const scaduta = f.scadenza < new Date().toISOString().split("T")[0];
                      return (
                        <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}>
                          <span style={{ color: scaduta ? "#ff3b30" : T.text }}>{scaduta ? "⚠️ " : ""}{f.cliente} <span style={{ color: T.sub, fontSize: 9 }}>N.{f.numero}</span></span>
                          <span style={{ fontWeight: 700, color: scaduta ? "#ff3b30" : T.text }}>€{f.importo.toLocaleString("it-IT")}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })(),
    };

    return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ padding: "14px 16px 12px", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: T.text, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: T.card, fontFamily: FF, letterSpacing: -1 }}>M</span>
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.text, letterSpacing: -0.3, lineHeight: 1.1 }}>MASTRO</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>misure</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 6 }}>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 20 }}>{weather?.icon || "🌡"}</span>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>{weather?.temp != null ? `${weather.temp}°` : "—"}</span>
                </div>
                <div style={{ fontSize: 11, color: T.sub }}>{weather?.city || "—"}</div>
              </div>
              {/* #08 Riordina nascosto pre-lancio */}
            </div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>{saluto}, Fabio</div>
          <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}>
            {today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>

        {/* Trial banner */}
        {activePlan === "trial" && (
          <div onClick={() => { setSettingsTab("piano"); setTab("settings"); }}
            style={{ margin: "0 16px 8px", padding: "8px 14px", borderRadius: 10, background: `linear-gradient(135deg, ${T.acc}20, ${T.acc}08)`, border: `1px solid ${T.acc}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>💎</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.acc }}>Trial gratuito · {trialDaysLeft} giorni rimasti</div>
                <div style={{ fontSize: 9, color: T.sub }}>Tutte le funzionalità sbloccate</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>Vedi piani ›</span>
          </div>
        )}
        {activePlan === "free" && (
          <div onClick={() => { setSettingsTab("piano"); setTab("settings"); }}
            style={{ margin: "0 16px 8px", padding: "8px 14px", borderRadius: 10, background: T.red + "10", border: `1px solid ${T.red}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red }}>Trial scaduto</div>
                <div style={{ fontSize: 9, color: T.sub }}>Funzionalità limitate · {cantieri.length}/5 commesse</div>
              </div>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>Attiva piano ›</span>
          </div>
        )}

        {/* Search */}
        <div style={{ padding: "0 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
            <Ico d={ICO.search} s={16} c={T.sub} />
            <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }}
              placeholder="Cerca commesse, clienti, vani..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} />
            {globalSearch && <div onClick={() => setGlobalSearch("")} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}>✕</div>}
          </div>
          {globalSearch.trim().length > 1 && (() => {
            const q = globalSearch.toLowerCase();
            const cmResults = cantieri.filter(c => c.cliente?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q) || c.indirizzo?.toLowerCase().includes(q));
            const vanoResults = cantieri.flatMap(c => getVaniAttivi(c).filter(v => v.nome?.toLowerCase().includes(q) || v.tipo?.toLowerCase().includes(q) || v.stanza?.toLowerCase().includes(q)).map(v => ({ ...v, cmCode: c.code, cmCliente: c.cliente, cmId: c.id, cm: c })));
            const total = cmResults.length + vanoResults.length;
            return total > 0 ? (
              <div style={{ background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginTop: 6, maxHeight: 280, overflowY: "auto" as const }}>
                {cmResults.map(c => (
                  <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); setGlobalSearch(""); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📁</span>
                    <div><div style={{ fontSize: 12, fontWeight: 600 }}>{c.cliente}</div><div style={{ fontSize: 10, color: T.sub }}>{c.code} · {c.indirizzo}</div></div>
                  </div>
                ))}
                {vanoResults.map(v => (
                  <div key={v.id} onClick={() => { setSelectedCM(v.cm); setSelectedVano(v); setTab("commesse"); setGlobalSearch(""); }} style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🪟</span>
                    <div><div style={{ fontSize: 12, fontWeight: 600 }}>{v.nome}</div><div style={{ fontSize: 10, color: T.sub }}>{v.cmCode} · {v.stanza} · {v.tipo}</div></div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginTop: 6, fontSize: 12, color: T.sub, textAlign: "center" as const }}>Nessun risultato per "{globalSearch}"</div>
            );
          })()}
        </div>

        {/* 📥 INBOX RAPIDO — ordini in attesa di conferma */}
        {(() => {
          const ordiniInAttesa = ordiniFornDB.filter(o => o.stato && o.stato !== "bozza" && !o.conferma?.ricevuta);
          if (ordiniInAttesa.length === 0) return null;
          return (
            <div style={{ margin: "0 16px 10px" }}>
              <div onClick={() => apriInboxDocumento()} style={{
                padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                background: "linear-gradient(135deg, #af52de15, #af52de08)",
                border: "2px solid #af52de30", display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#af52de", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, position: "relative" }}>
                  📥
                  <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: "50%", background: T.red, color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{ordiniInAttesa.length}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#af52de" }}>
                    {ordiniInAttesa.length} conferma{ordiniInAttesa.length > 1 ? "e" : ""} in attesa
                  </div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>
                    Carica PDF/foto da email, WhatsApp o portale → AI legge tutto
                  </div>
                </div>
                <div style={{ fontSize: 16, color: "#af52de" }}>→</div>
              </div>
            </div>
          );
        })()}

        {/* Composable sections */}
        {drag.order.map(id => {
          if (!sections[id]) return null;
          return (
            <div key={id}
              draggable={homeEditMode}
              onDragStart={() => { if(homeEditMode) drag.start(id); }}
              onDragOver={e => { e.preventDefault(); if(homeEditMode) drag.onOver(id); }}
              onDrop={e => { e.preventDefault(); if(homeEditMode) drag.drop(id); }}
              onDragEnd={() => { if(homeEditMode) drag.end(); }}
              style={{ opacity: drag.dragging === id ? 0.4 : 1, borderTop: drag.over === id ? `2px solid ${T.acc}` : "none", transition: "opacity 0.15s" }}>
              {homeEditMode && (
                <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}>
                  <span style={{ fontSize: 14, color: T.sub, cursor: "grab" }}>⠿</span>
                </div>
              )}
              <div style={{ filter: homeEditMode ? "brightness(0.97)" : "none", transition: "filter 0.15s" }}>
                {sections[id]}
              </div>
            </div>
          );
        })}
      </div>
    );
}
