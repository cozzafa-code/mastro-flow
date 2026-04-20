"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel MOBILE — fliwoX Sistema Operativo v3 (mockup match)
import React, { useState, useEffect } from "react";
import { useMastro } from "./MastroContext";
import SpesaQuick from "./SpesaQuick";
import { ICO, I } from "./mastro-constants";
import HomeWidgetsDynamic from "./HomeWidgetsDynamic";

// ─── THEME fliwoX ──────────────────────────────────────────────────
const TH = {
  bgPage: "#E4F2F2",
  bgCard: "#FFFFFF",
  bgCardAlt: "#F5FBFB",
  tealBright: "#5FD0D0",
  teal: "#28A0A0",
  tealDark: "#1A7A7A",
  tealDeep: "#0D4040",
  tealMuted: "#5A8A8A",
  ink: "#0D1F1F",
  sub: "#5A7878",
  subLight: "#8FA8A8",
  border: "rgba(40,160,160,0.08)",
  red: "#E24B4A",
  redBright: "#FF7B4D",
  amber: "#F5A030",
  amberDeep: "#C97716",
  green: "#8BC443",
  greenDeep: "#6A9A26",
};

const STATUS_COLOR: Record<string, { dot: string; text: string; label?: string }> = {
  "online": { dot: "#28A0A0", text: "#1A7A7A", label: "Online" },
  "in cantiere": { dot: "#28A0A0", text: "#1A7A7A", label: "Su cantiere" },
  "in rilievo": { dot: "#F5A030", text: "#C97716", label: "In rilievo" },
  "offline": { dot: "#8FA8A8", text: "#8FA8A8", label: "Offline" },
};

const AV_GRADS = [
  "linear-gradient(145deg, #42D0DC, #1A7A7A)",
  "linear-gradient(145deg, #5FD0D0, #28A0A0)",
  "linear-gradient(145deg, #FFA94D, #C97716)",
  "linear-gradient(145deg, #A3DC5E, #6A9A26)",
  "linear-gradient(145deg, #1A3535, #0D1F1F)",
  "linear-gradient(145deg, #7B6BA5, #5A4D85)",
];

// ─── SUBCOMPONENTS ─────────────────────────────────────────────────
const Widget = ({ children, style = {} }: any) => (
  <div style={{
    background: "linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)",
    borderRadius: 20,
    padding: "14px 14px 12px",
    boxShadow: "8px 8px 20px rgba(26,122,122,0.10), -6px -6px 16px rgba(255,255,255,1), inset 0 1.5px 1px rgba(255,255,255,0.95)",
    position: "relative",
    overflow: "hidden",
    marginBottom: 12,
    ...style,
  }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(180deg, rgba(255,255,255,0.5), transparent)", borderRadius: "20px 20px 0 0", pointerEvents: "none" }} />
    <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
  </div>
);

const WidgetHead = ({ icon, subtitle, title }: any) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: "linear-gradient(145deg, #DDEFEF, #BDE0E0)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "inset 1.5px 1.5px 3px rgba(26,122,122,0.12), inset -1.5px -1.5px 3px rgba(255,255,255,0.95)",
        flexShrink: 0,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A7A7A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#0D1F1F", letterSpacing: "1px", textTransform: "uppercase", lineHeight: 1 }}>{subtitle}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#0D1F1F", letterSpacing: "-0.3px", marginTop: 3 }}>{title}</div>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 3px)", gap: 3, opacity: 0.35 }}>
      {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "#1A7A7A" }} />)}
    </div>
  </div>
);

const TaskPill = ({ kind, children }: any) => {
  const styles: Record<string, any> = {
    now: { background: "linear-gradient(145deg, #F5A030, #C97716)", color: "#fff", shadow: "0 2px 6px rgba(201,119,22,0.35)" },
    soon: { background: "rgba(40,160,160,0.15)", color: "#1A7A7A", shadow: "none" },
    done: { background: "rgba(90,120,120,0.15)", color: "#5A7878", shadow: "none" },
  };
  const s = styles[kind] || styles.soon;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 8,
      background: s.background, color: s.color, boxShadow: s.shadow,
      letterSpacing: "0.4px", textTransform: "uppercase", flexShrink: 0,
    }}>{children}</span>
  );
};

// ─── MAIN ──────────────────────────────────────────────────────────
export default function HomePanel() {
  const {
    cantieri, events, problemi, fattureDB, operatori: operatoriDB,
    sogliaDays, setTab, setSelectedCM,
    setShowProblemiView, setShowModal,
    giorniFermaCM, today, aziendaInfo,
  } = useMastro();

  const [showSpesa, setShowSpesa] = useState(false);
  const [doneTasks, setDoneTasks] = useState<Record<string, boolean>>({});

  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const dataLabel = today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "short" });
  const firstName = (aziendaInfo?.nome || "").split(" ")[0] || "Titolare";
  const aziendaInit = ((aziendaInfo?.nome || "FC").split(" ").map((w: string) => w[0]).join("")).slice(0, 2).toUpperCase();

  // DA FARE
  const ferme = (cantieri || []).filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= sogliaDays);
  const prevDaFare = (cantieri || []).filter(c => c.fase === "preventivo");
  const probAperti = (problemi || []).filter(p => p.stato !== "risolto");
  const todayEvs = (events || []).filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  const fatScadute = (fattureDB || []).filter(f => !f.pagata && f.scadenza && f.scadenza < todayISO);
  const montaggiOggi = todayEvs.filter(e => (e.text || "").toLowerCase().includes("montaggio")).length;

  const tasks: any[] = [];
  if (probAperti.length > 0) tasks.push({ id: "prob-" + probAperti[0].id, titolo: "Problema: " + (probAperti[0].titolo || "da risolvere"), sotto: probAperti.length + " aperti", kind: "now", pill: "Ora", action: () => setShowProblemiView(true) });
  if (ferme.length > 0) { const c = ferme[0]; tasks.push({ id: "fer-" + c.id, titolo: "Sblocca " + c.cliente, sotto: c.code + " · ferma da " + giorniFermaCM(c) + " gg", kind: "now", pill: "Ora", action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (prevDaFare.length > 0) { const c = prevDaFare[0]; tasks.push({ id: "prev-" + c.id, titolo: "Preventivo: " + c.cliente, sotto: prevDaFare.length + " in attesa", kind: "soon", pill: "Da fare", action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (todayEvs.length > 0) { const e = todayEvs[0]; const pillTime = e.time || "Oggi"; tasks.push({ id: "ev-" + e.id, titolo: e.text, sotto: (e.time || "") + (e.persona ? " · " + e.persona : ""), kind: "soon", pill: pillTime, action: () => setTab("agenda") }); }
  if (fatScadute.length > 0) { const f = fatScadute[0]; tasks.push({ id: "fat-" + f.id, titolo: "Fattura scaduta", sotto: "€" + (f.importo || 0) + (f.cliente ? " · " + f.cliente : ""), kind: "now", pill: "Ora", action: () => setTab("contabilita") }); }

  // OPERATORI
  const ops = (operatoriDB && operatoriDB.length > 0) ? operatoriDB.map((op: any, idx: number) => {
    const st = op.stato_oggi || "offline";
    const color = STATUS_COLOR[st] || STATUS_COLOR.offline;
    return {
      id: op.id || idx,
      ini: ((op.nome || "?")[0] + (op.cognome || "?")[0]).toUpperCase(),
      bg: AV_GRADS[idx % AV_GRADS.length],
      nome: ((op.nome || "") + " " + (op.cognome || "")).trim(),
      ruolo: op.ruolo || "Operatore",
      status: st,
      attivita: op.attivita_corrente || op.note_oggi || "",
      dot: color.dot,
      statusText: color.text,
      statusLabel: color.label,
    };
  }) : [];
  const impegnati = ops.filter(o => o.status !== "offline").length;
  const liberi = ops.filter(o => o.status === "offline").length;

  const toggleTask = (id: string) => setDoneTasks(d => ({ ...d, [id]: !d[id] }));

  return (
    <div style={{
      fontFamily: "'Manrope', -apple-system, 'SF Pro Display', system-ui, sans-serif",
      background: "#E4F2F2",
      minHeight: "100%",
      overflowX: "hidden",
      padding: "calc(env(safe-area-inset-top, 0px) + 8px) 12px 110px",
    }}>

      {/* ═══ HERO TEAL fliwoX ═══ */}
      <div style={{
        background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
        borderRadius: 22,
        padding: "14px 16px 16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 26px rgba(31,120,120,0.35), inset 0 2px 3px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.12)",
        marginBottom: 14,
      }}>
        <div style={{ position: "absolute", top: -40, right: -30, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.2), transparent)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 12, right: 100, width: 6, height: 6, borderRadius: 2, background: "#F5A030", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
        <div style={{ position: "absolute", top: 26, right: 72, width: 5, height: 5, borderRadius: 2, background: "#8BC443", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 2 }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(255,255,255,0.18)",
              padding: "4px 10px 4px 5px",
              borderRadius: 11,
              marginBottom: 8,
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(145deg, #FFF, #D8EEEE)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="#28A0A0" strokeWidth="2.6" strokeLinecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>fliwoX</span>
            </div>

            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "1px", textTransform: "uppercase" }}>{saluto}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", marginTop: 2, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{firstName}</div>
            <div suppressHydrationWarning style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>
              {dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1)}
              {montaggiOggi > 0 ? ` · ${montaggiOggi} montagg${montaggiOggi === 1 ? "io" : "i"} oggi` : ""}
            </div>
          </div>

          <div onClick={() => setTab("altro")} style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(145deg, #FFF, #D8EEEE)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#1A7A7A",
            boxShadow: "0 4px 12px rgba(0,0,0,0.25), 0 0 0 2px rgba(255,255,255,0.25)",
            cursor: "pointer",
          }}>
            {aziendaInit}
          </div>
        </div>
      </div>

      {/* ═══ WIDGET 1: OGGI DEVI FARE ═══ */}
      <Widget>
        <WidgetHead
          subtitle="Oggi devi fare"
          title={`${tasks.length} cos${tasks.length === 1 ? "a" : "e"}`}
          icon={<><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>}
        />

        {tasks.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "#5A7878", textAlign: "center", padding: "8px 0" }}>Nessuna azione urgente</p>
        ) : tasks.map((t, i) => {
          const done = doneTasks[t.id];
          const isLast = i === tasks.length - 1;
          return (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 2px",
              borderBottom: isLast ? "none" : "1px solid rgba(40,160,160,0.08)",
            }}>
              <div onClick={() => toggleTask(t.id)} style={{
                width: 22, height: 22, borderRadius: 7,
                border: done ? "1.5px solid #1A7A7A" : "1.5px solid #BDE0E0",
                background: done
                  ? "linear-gradient(145deg, #5FD0D0, #1A7A7A)"
                  : "linear-gradient(145deg, #FFF, #EEF8F8)",
                boxShadow: done
                  ? "0 2px 6px rgba(31,120,120,0.4), inset 0 1px 1px rgba(255,255,255,0.3)"
                  : "inset 1px 1px 2px rgba(40,160,160,0.1)",
                flexShrink: 0,
                position: "relative",
                cursor: "pointer",
              }}>
                {done && <span style={{
                  position: "absolute", top: 3, left: 6,
                  width: 5, height: 10,
                  borderRight: "2px solid #fff", borderBottom: "2px solid #fff",
                  transform: "rotate(45deg)",
                }} />}
              </div>
              <div onClick={t.action} style={{ flex: 1, cursor: "pointer", minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: "#0D1F1F", letterSpacing: "-0.1px",
                  textDecoration: done ? "line-through" : "none",
                  opacity: done ? 0.5 : 1,
                }}>{t.titolo}</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#5A7878", marginTop: 1, opacity: done ? 0.5 : 1 }}>{t.sotto}</div>
              </div>
              <TaskPill kind={done ? "done" : t.kind}>{done ? "Fatto" : t.pill}</TaskPill>
            </div>
          );
        })}
      </Widget>

      {/* ═══ WIDGET 2: SQUADRA ═══ */}
      <Widget>
        <WidgetHead
          subtitle="Squadra"
          title={ops.length === 0 ? "Nessun operatore" : `${impegnati} impegnati · ${liberi} liber${liberi === 1 ? "o" : "i"}`}
          icon={<><circle cx="9" cy="7" r="4"/><path d="M3 21c0-4 2.7-7 6-7s6 3 6 7"/><circle cx="17" cy="5" r="3"/><path d="M15 21c0-3 2-5 5-5"/></>}
        />

        {ops.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "#5A7878", textAlign: "center", padding: "8px 0" }}>Nessun operatore configurato</p>
        ) : ops.map((op, i) => {
          const isLast = i === ops.length - 1;
          return (
            <div key={op.id} onClick={() => setTab("altro")} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 2px",
              borderBottom: isLast ? "none" : "1px solid rgba(40,160,160,0.08)",
              cursor: "pointer",
              opacity: op.status === "offline" ? 0.6 : 1,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                background: op.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff",
                boxShadow: "0 2px 5px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.3)",
                flexShrink: 0,
                position: "relative",
              }}>
                {op.ini}
                <div style={{
                  position: "absolute", bottom: -1, right: -1,
                  width: 9, height: 9, borderRadius: "50%",
                  background: op.dot, border: "2px solid #fff",
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0D1F1F", letterSpacing: "-0.1px" }}>{op.nome || "—"}</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#5A7878", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {op.attivita ? `${op.ruolo.toLowerCase()} · ${op.attivita}` : op.ruolo.toLowerCase()}
                </div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: op.statusText, letterSpacing: "0.2px", flexShrink: 0 }}>
                {op.statusLabel}
              </span>
            </div>
          );
        })}
      </Widget>

      {/* ═══ WIDGET 3: PRODUZIONE ═══ */}
      <Widget>
        <WidgetHead
          subtitle="Produzione"
          title={
            probAperti.length === 0
              ? "Tutto ok"
              : `${probAperti.length} avvis${probAperti.length === 1 ? "o" : "i"}${probAperti.filter(p => (p.priorita || "").toLowerCase() === "alta").length > 0 ? " · " + probAperti.filter(p => (p.priorita || "").toLowerCase() === "alta").length + " urgente" : ""}`
          }
          icon={<><path d="M12 2l10 19H2L12 2z"/><path d="M12 9v5M12 17.5v.5"/></>}
        />

        {probAperti.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "#5A7878", textAlign: "center", padding: "8px 0" }}>Nessun problema attivo</p>
        ) : probAperti.slice(0, 3).map((p, i) => {
          const isLast = i === Math.min(probAperti.length, 3) - 1;
          const urgent = (p.priorita || "").toLowerCase() === "alta";
          const cm = (cantieri || []).find((c: any) => c.id === p.commessa_id);
          const dotColor = urgent ? "#FF7B4D" : "#F5A030";
          const dotDeep = urgent ? "#C94A16" : "#C97716";
          return (
            <div key={p.id} onClick={() => setShowProblemiView(true)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 2px",
              borderBottom: isLast ? "none" : "1px solid rgba(40,160,160,0.08)",
              cursor: "pointer",
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%",
                background: `linear-gradient(145deg, ${dotColor}, ${dotDeep})`,
                boxShadow: urgent
                  ? "0 0 0 3px rgba(255,123,77,0.2), 0 0 10px rgba(255,123,77,0.5)"
                  : "0 0 0 3px rgba(245,160,48,0.2)",
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#0D1F1F", letterSpacing: "-0.1px" }}>
                  {p.titolo || "Problema"}{cm ? " · " + cm.cliente : ""}
                </div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#5A7878", marginTop: 1 }}>
                  {cm ? "Commessa " + cm.code : p.descrizione || ""}
                  {urgent ? " · blocca lavoro" : ""}
                </div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "linear-gradient(145deg, #EEF8F8, #D8EEEE)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "inset 1px 1px 2px rgba(40,160,160,0.1)",
                flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#1A7A7A" strokeWidth="2" strokeLinecap="round"><path d="M4 3l4 3-4 3"/></svg>
              </div>
            </div>
          );
        })}
      </Widget>

      {/* ═══ AZIONI COMPATTE ═══ */}
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div onClick={() => setShowModal("commessa")} style={{
          flex: 1,
          background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
          borderRadius: 14, padding: "12px 14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 6px 14px rgba(31,120,120,0.35), inset 0 1px 2px rgba(255,255,255,0.3)",
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <I d={ICO.folder} s={14} c="#fff" />
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>Nuova commessa</p>
        </div>
        <div onClick={() => setShowSpesa(true)} style={{
          flex: 1,
          background: "linear-gradient(145deg, #F5A030, #C97716)",
          borderRadius: 14, padding: "12px 14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 6px 14px rgba(201,119,22,0.3), inset 0 1px 2px rgba(255,255,255,0.3)",
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <I d={ICO.wallet} s={14} c="#fff" />
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>Spesa</p>
        </div>
      </div>

            {/* ═══ WIDGET PERSONALIZZABILI ═══ */}
      <HomeWidgetsDynamic />

      {showSpesa && <SpesaQuick onClose={() => setShowSpesa(false)} />}
    </div>
  );
}
