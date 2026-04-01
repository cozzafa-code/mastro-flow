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

  // fliwoX pipeline colors
  const PIPE_CLR: Record<string,string> = {
    sopralluogo:"#28A0A0",preventivo:"#1A7070",conferma:"#1060A0",
    ordini:"#806020",produzione:"#806020",posa:"#806020",collaudo:"#6B4FB0",chiusura:"#6B4FB0",
  };

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", backgroundColor:"#D8EEEE", backgroundImage:"linear-gradient(rgba(40,160,160,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,0.18) 1px,transparent 1px)", backgroundSize:"24px 24px", minHeight:"100%", paddingBottom:100 }}>

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
        <div onClick={adesso.action} style={{ margin:"14px 14px 0", background:"white", borderRadius:18, border:`1.5px solid ${adesso.color}40`, boxShadow:`0 6px 0 0 ${adesso.color}30`, overflow:"hidden", cursor:"pointer", display:"flex" }}>
          <div style={{ width:5, background:adesso.color, flexShrink:0, boxShadow:`2px 0 8px ${adesso.color}40` }} />
          <div style={{ padding:"14px 16px 14px 16px", flex:1, display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ flex:1 }}>
              <p style={{ margin:0, fontSize:9, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase", color:adesso.color }}>Adesso</p>
              <p style={{ margin:"5px 0 0", fontSize:16, fontWeight:900, color:"#0D1F1F", letterSpacing:"-0.02em" }}>{adesso.titolo}</p>
              <p style={{ margin:"3px 0 0", fontSize:12, fontWeight:700, color:"#4A7070" }}>{adesso.sotto}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A7070" strokeWidth="2.2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      )}

      {/* fliwoX CALENDARIO */}
      <div style={{ margin:"14px 14px 0", background:"white", borderRadius:18, border:"1.5px solid #C8E4E4", boxShadow:"0 7px 0 0 #A8CCCC", padding:"14px 14px 10px" }}>
        {/* Mese + nav */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={() => setWeekOffset(w => w - 1)} style={{ width:34, height:34, borderRadius:10, border:"1.5px solid #C8E4E4", background:"#EEF8F8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 0 0 #A8CCCC" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize:17, fontWeight:900, color:"#0D1F1F", letterSpacing:"-0.02em" }}>{wMonth} {wYear}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} style={{ width:34, height:34, borderRadius:10, border:"1.5px solid #C8E4E4", background:"#EEF8F8", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 0 0 #A8CCCC" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          {weekOffset !== 0 && <button onClick={() => { setWeekOffset(0); setDayOffset(0); }} style={{ border:"none", background:"rgba(40,160,160,0.1)", borderRadius:20, padding:"5px 12px", fontSize:12, fontWeight:900, color:"#28A0A0", cursor:"pointer" }}>Oggi</button>}
        </div>

        {/* fliwoX Griglia giorni */}
        <div onTouchStart={onTS} onTouchEnd={onTE} style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
          {week.map((d) => {
            const isSel = d.iso === selISO;
            return (
              <div key={d.iso} onClick={() => setDayOffset(d.off)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer" }}>
                <span style={{ fontSize:10, fontWeight:900, letterSpacing:"0.06em", color:d.isWe ? "#D08008" : "#4A7070" }}>{DN[(d.d.getDay() + 6) % 7]}</span>
                <div style={{ width:34, height:34, borderRadius:isSel ? 10 : "50%", background:isSel ? "#28A0A0" : d.isToday ? "rgba(40,160,160,0.12)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:isSel ? "0 4px 0 0 #156060" : "none" }}>
                  <span style={{ fontSize:14, fontWeight:isSel || d.isToday ? 900 : 600, color:isSel ? "white" : d.isToday ? "#28A0A0" : "#0D1F1F" }}>{d.day}</span>
                </div>
                <div style={{ height:5, display:"flex", gap:2 }}>
                  {d.evts > 0 && [...Array(Math.min(d.evts, 3))].map((_, i) => (
                    <div key={i} style={{ width:4, height:4, borderRadius:"50%", background:isSel ? "white" : "#28A0A0" }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* fliwoX eventi giorno */}
        {selEvents.length > 0 && (
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:7 }}>
            {selEvents.map(ev => (
              <div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"#EEF8F8", borderRadius:12, border:"1.5px solid #C8E4E4", boxShadow:"0 3px 0 0 #A8CCCC", cursor:"pointer" }}>
                <div style={{ width:4, height:34, borderRadius:2, background:ev.color || "#28A0A0", flexShrink:0, boxShadow:`0 2px 0 0 ${ev.color || "#156060"}` }} />
                <div style={{ flex:1 }}>
                  <p style={{ margin:0, fontSize:14, fontWeight:900, color:"#0D1F1F" }}>{ev.text}</p>
                  {(ev.persona || ev.luogo) && <p style={{ margin:"2px 0 0", fontSize:11, fontWeight:700, color:"#4A7070" }}>{[ev.persona, ev.luogo].filter(Boolean).join(" · ")}</p>}
                </div>
                {ev.time && <span style={{ fontSize:13, fontWeight:900, color:"#28A0A0", fontFamily:"'JetBrains Mono',monospace", flexShrink:0 }}>{ev.time}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* fliwoX PIPELINE */}
      <div style={{ margin:"14px 14px 0", background:"white", borderRadius:18, border:"1.5px solid #C8E4E4", boxShadow:"0 7px 0 0 #A8CCCC", padding:"14px 14px 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontSize:10, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4A7070" }}>Pipeline commesse</span>
          <span onClick={() => setTab("commesse")} style={{ fontSize:12, fontWeight:900, color:"#28A0A0", cursor:"pointer", padding:"4px 10px", borderRadius:20, background:"rgba(40,160,160,0.1)", boxShadow:"0 2px 0 0 rgba(40,160,160,0.3)" }}>{totAttive} attive →</span>
        </div>
        <div style={{ display:"flex", height:38, borderRadius:12, overflow:"hidden", gap:3 }}>
          {pipelineFasi.filter(f => faseCounts[f.id] > 0).map(f => {
            const clr = PIPE_CLR[f.id] || f.color || "#28A0A0";
            return (
              <div key={f.id} onClick={() => { setFilterFase(f.id); setTab("commesse"); }}
                style={{ flex:Math.max(faseCounts[f.id],1), background:clr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", borderRadius:10, minWidth:32, boxShadow:`0 4px 0 0 ${clr}80` }}>
                <span style={{ fontSize:13, fontWeight:900, color:"white", fontFamily:"'JetBrains Mono',monospace" }}>{faseCounts[f.id]}</span>
              </div>
            );
          })}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:10 }}>
          {pipelineFasi.filter(f => faseCounts[f.id] > 0).map(f => {
            const clr = PIPE_CLR[f.id] || f.color || "#28A0A0";
            return (
              <div key={f.id} onClick={() => { setFilterFase(f.id); setTab("commesse"); }} style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", borderRadius:20, background:clr+"18", cursor:"pointer", boxShadow:`0 3px 0 0 ${clr}44` }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:clr }} />
                <span style={{ fontSize:11, fontWeight:900, color:"#0D1F1F" }}>{f.nome}</span>
                <span style={{ fontSize:11, fontWeight:900, color:clr, fontFamily:"'JetBrains Mono',monospace" }}>{faseCounts[f.id]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* fliwoX KPI */}
      <div style={{ margin:"14px 14px 0", display:"flex", gap:8 }}>
        {[
          { label:"Preventivato", val:fmtK(totPrev), color:"#0D1F1F", sh:"#A8CCCC", action:() => setTab("commesse") },
          { label:"Confermato", val:fmtK(totConf), color:"#1A9E73", sh:"rgba(26,158,115,0.3)", action:() => { setFilterFase("conferma"); setTab("commesse"); } },
          ...(fatAtt.length > 0 ? [{ label:"Da incassare", val:fmtK(totFat), color:"#DC4444", sh:"#FFAAAA", action:() => setShowContabilita(true) }] : []),
        ].map((item, i) => (
          <div key={i} onClick={item.action} style={{ flex:1, padding:"14px 10px", background:"white", borderRadius:16, border:`1.5px solid ${item.color === "#DC4444" ? "rgba(220,68,68,0.3)" : "#C8E4E4"}`, boxShadow:`0 6px 0 0 ${item.sh}`, cursor:"pointer", textAlign:"center" }}>
            <p style={{ margin:0, fontSize:9, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase", color:"#4A7070" }}>{item.label}</p>
            <p style={{ margin:"6px 0 0", fontSize:22, fontWeight:900, color:item.color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"-0.03em" }}>{item.val}</p>
          </div>
        ))}
      </div>

      {/* fliwoX Scorciatoie + quick counts */}
      <div style={{ margin:"10px 14px 0", display:"flex", gap:8 }}>
        <div onClick={() => setTab("contabilita")} style={{ flex:1, padding:"13px 16px", borderRadius:14, background:"white", border:"1.5px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC", cursor:"pointer", fontSize:13, fontWeight:900, color:"#0D1F1F", textAlign:"center" }}>€ Contabilità</div>
        <div onClick={() => setTab("montaggi_cal")} style={{ flex:1, padding:"13px 16px", borderRadius:14, background:"rgba(26,158,115,0.1)", border:"1.5px solid rgba(26,158,115,0.3)", boxShadow:"0 5px 0 0 rgba(26,158,115,0.25)", cursor:"pointer", fontSize:13, fontWeight:900, color:"#1A9E73", textAlign:"center" }}>Cantieri</div>
      </div>

      {(ordAtt.length > 0 || montAtt.length > 0) && (
        <div style={{ margin:"8px 14px 0", display:"flex", gap:8 }}>
          {ordAtt.length > 0 && (
            <div onClick={() => setTab("commesse")} style={{ flex:1, display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:14, background:"white", border:"1.5px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC", cursor:"pointer" }}>
              <I d={ICO.package} s={20} c="#28A0A0" />
              <div>
                <p style={{ margin:0, fontSize:20, fontWeight:900, color:"#0D1F1F", fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{ordAtt.length}</p>
                <p style={{ margin:"2px 0 0", fontSize:9, fontWeight:900, color:"#4A7070", textTransform:"uppercase", letterSpacing:"0.08em" }}>Ordini attivi</p>
              </div>
            </div>
          )}
          {montAtt.length > 0 && (
            <div onClick={() => setTab("commesse")} style={{ flex:1, display:"flex", alignItems:"center", gap:12, padding:"13px 14px", borderRadius:14, background:"white", border:"1.5px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC", cursor:"pointer" }}>
              <I d={ICO.wrench} s={20} c="#28A0A0" />
              <div>
                <p style={{ margin:0, fontSize:20, fontWeight:900, color:"#0D1F1F", fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{montAtt.length}</p>
                <p style={{ margin:"2px 0 0", fontSize:9, fontWeight:900, color:"#4A7070", textTransform:"uppercase", letterSpacing:"0.08em" }}>Montaggi</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* fliwoX AZIONI RAPIDE */}
      <div style={{ margin:"14px 14px 0" }}>
        <p style={{ margin:"0 0 10px", fontSize:10, fontWeight:900, letterSpacing:"0.12em", textTransform:"uppercase", color:"#4A7070" }}>Azioni rapide</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>

          {/* + Commessa — teal primario 3D */}
          <div onClick={() => setShowModal("commessa")} style={{ padding:"18px 16px", borderRadius:18, background:"#28A0A0", boxShadow:"0 8px 0 0 #156060", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <I d={ICO.folder} s={22} c="white" />
            </div>
            <div>
              <p style={{ margin:0, fontSize:15, fontWeight:900, color:"white", letterSpacing:"-0.01em" }}>Commessa</p>
              <p style={{ margin:"2px 0 0", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>Nuova pratica</p>
            </div>
          </div>

          {/* Spesa — amber 3D */}
          <div onClick={() => setShowSpesa(true)} style={{ padding:"18px 16px", borderRadius:18, background:"#D08008", boxShadow:"0 8px 0 0 #7A4800", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <I d={ICO.receipt || ICO.tag} s={22} c="white" />
            </div>
            <div>
              <p style={{ margin:0, fontSize:15, fontWeight:900, color:"white", letterSpacing:"-0.01em" }}>Invia spesa</p>
              <p style={{ margin:"2px 0 0", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.6)" }}>Scontrino / nota</p>
            </div>
          </div>

          {/* Cliente — bianco 3D */}
          <div onClick={() => setShowModal("contatto")} style={{ padding:"18px 16px", borderRadius:18, background:"white", border:"2px solid #C8E4E4", boxShadow:"0 7px 0 0 #A8CCCC", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(40,160,160,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <I d={ICO.user} s={22} c="#28A0A0" />
            </div>
            <div>
              <p style={{ margin:0, fontSize:15, fontWeight:900, color:"#0D1F1F", letterSpacing:"-0.01em" }}>Cliente</p>
              <p style={{ margin:"2px 0 0", fontSize:11, fontWeight:700, color:"#4A7070" }}>Nuovo contatto</p>
            </div>
          </div>

          {/* Appuntamento — bianco 3D */}
          <div onClick={() => setShowModal("evento")} style={{ padding:"18px 16px", borderRadius:18, background:"white", border:"2px solid #C8E4E4", boxShadow:"0 7px 0 0 #A8CCCC", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:"rgba(124,95,191,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <I d={ICO.calendar} s={22} c="#7C5FBF" />
            </div>
            <div>
              <p style={{ margin:0, fontSize:15, fontWeight:900, color:"#0D1F1F", letterSpacing:"-0.01em" }}>Appuntamento</p>
              <p style={{ margin:"2px 0 0", fontSize:11, fontWeight:700, color:"#4A7070" }}>Agenda</p>
            </div>
          </div>
        </div>
      </div>

      {showSpesa && <SpesaQuick onClose={() => setShowSpesa(false)} />}
    </div>
  );
}
