"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v10 — fliwoX Approved Mockup faithful
import React, { useState, useEffect } from "react";
import { useMastro } from "./MastroContext";
import SpesaQuick from "./SpesaQuick";
import { ICO, I } from "./mastro-constants";

const T_CLR = "#28A0A0";
const T_DARK = "#156060";
const T_LIGHT = "#EEF8F8";
const INK = "#0D1F1F";
const SUB = "#4A7070";
const BDR = "#C8E4E4";
const RED = "#DC4444";
const AMB = "#D08008";
const GRN = "#1A9E73";

const PIPE_COLORS: Record<string, string> = {
  sopralluogo: T_CLR, preventivo: "#1A7070", conferma: "#1060A0",
  ordini: "#806020", produzione: "#806020", posa: "#806020",
  collaudo: "#6B4FB0", chiusura: "#6B4FB0",
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IcoSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" style={{ display: "block", margin: "0 auto 2px" }}>
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IcoDoc  = ({ color }: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoMeas = ({ color }: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M4 20L10 8l4 8 4-5 4 9"/></svg>;
const IcoCal  = ({ color }: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChev = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }: any) => (
  <div style={{ background: "white", borderRadius: 14, border: `1px solid ${BDR}`, boxShadow: "0 4px 0 0 #A8CCCC, 0 6px 14px rgba(0,0,0,.06)", padding: "13px 14px", ...style }}>{children}</div>
);
const SecTitle = ({ children, badge }: any) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
    <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: SUB, textTransform: "uppercase" as any, letterSpacing: "0.07em" }}>{children}</p>
    {badge}
  </div>
);
const Pill = ({ children, bg, color }: any) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: bg, color }}>{children}</span>
);
const BtnP = ({ children, onClick }: any) => (
  <button onClick={onClick} style={{ background: T_CLR, border: "none", borderRadius: 12, padding: "5px 11px", fontSize: 11, fontWeight: 800, color: "white", cursor: "pointer", fontFamily: "system-ui", boxShadow: `0 3px 0 0 ${T_DARK}`, display: "flex", alignItems: "center", gap: 6 }}>{children}</button>
);
const Av = ({ initials, bg, size = 38, fontSize = 13 }: any) => (
  <div style={{ width: size, height: size, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize, border: "2px solid rgba(255,255,255,.7)", boxShadow: "0 2px 0 0 rgba(0,0,0,.12)", flexShrink: 0 }}>{initials}</div>
);
const Dot = ({ color }: any) => (
  <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, border: "2px solid white", position: "absolute", bottom: -1, right: -1 }} />
);

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePanel() {
  const {
    cantieri, events, problemi, fattureDB, operatori: operatoriDB,
    sogliaDays, setTab, setSelectedCM,
    setShowProblemiView, setShowModal,
    giorniFermaCM, today, aziendaInfo,
  } = useMastro();

  const [showSpesa, setShowSpesa] = useState(false);

  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const dataLabel = today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const commesseAttive = (cantieri || []).filter(c => c.fase !== "chiusura").length;
  const totFat = (fattureDB || []).filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const fmtK = (n: number) => "€" + (n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : n.toLocaleString("it-IT"));

  // DA FARE ORA — tasks dinamici da dati reali
  const ferme = (cantieri || []).filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= sogliaDays);
  const prevDaFare = (cantieri || []).filter(c => c.fase === "preventivo");
  const probAperti = (problemi || []).filter(p => p.stato !== "risolto");
  const todayEvs = (events || []).filter(e => e.date === todayISO).sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));

  const tasks: any[] = [];
  if (probAperti.length > 0) tasks.push({ titolo: "Problema: " + (probAperti[0].titolo || "da risolvere"), sotto: probAperti.length + " aperti", color: RED, icon: <IcoDoc color={RED} />, action: () => setShowProblemiView(true) });
  if (ferme.length > 0) { const c = ferme[0]; tasks.push({ titolo: "Sblocca " + c.cliente, sotto: c.code + " · ferma da " + giorniFermaCM(c) + " gg", color: RED, icon: <IcoDoc color={RED} />, action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (prevDaFare.length > 0) { const c = prevDaFare[0]; tasks.push({ titolo: "Preventivo: " + c.cliente, sotto: prevDaFare.length + " in attesa", color: AMB, icon: <IcoMeas color={AMB} />, action: () => { setSelectedCM(c); setTab("commesse"); } }); }
  if (todayEvs.length > 0) { const e = todayEvs[0]; tasks.push({ titolo: e.text, sotto: (e.time || "") + (e.persona ? " · " + e.persona : ""), color: T_CLR, icon: <IcoCal color={T_CLR} />, action: () => setTab("agenda") }); }

  // OPERATORI — usa dati DB, nessun fallback demo
  const ops = (operatoriDB && operatoriDB.length > 0) ? operatoriDB.map((op: any) => ({
    ini: ((op.nome || "?")[0] + (op.cognome || "?")[0]).toUpperCase(),
    bg: ["#1A7878", "#1060A0", "#6B4FB0", "#806020"][op.id?.charCodeAt(0) % 4] || "#1A7878",
    nome: (op.nome || "") + " " + (op.cognome || ""),
    ruolo: op.ruolo || "Operatore",
    status: op.stato_oggi || "offline",
    dot: op.stato_oggi === "online" || op.stato_oggi === "in cantiere" ? GRN : op.stato_oggi === "in rilievo" ? AMB : "#8BBCBC",
    opacity: op.stato_oggi === "offline" ? 0.55 : 1,
  })) : [];
  const onlineCount = ops.filter(o => o.status !== "offline").length;
  const sPill = (s: string) => s === "online" || s === "in cantiere" ? { bg: "#D8F2F2", color: "#0A5050" } : s === "in rilievo" ? { bg: "#FFF0DC", color: "#7A4000" } : { bg: "#F0F8F8", color: "#8BBCBC" };

  // COMMESSE RECENTI
  const recenti = [...(cantieri || [])].sort((a, b) => String(b.updatedAt || b.id || "").localeCompare(String(a.updatedAt || a.id || ""))).slice(0, 3);
  const FASI = ["sopralluogo", "preventivo", "ordini", "montaggio", "fattura"];

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", backgroundColor: "#D8EEEE", overflowX: "hidden", backgroundImage: "linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)", backgroundSize: "24px 24px", minHeight: "100%", paddingBottom: 100 }}>

      {/* TOPBAR */}
      <div style={{ background: "linear-gradient(160deg, rgba(5,20,20,0.75) 0%, rgba(15,45,45,0.65) 60%, rgba(40,160,160,0.15) 100%)", backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)", paddingTop: "calc(env(safe-area-inset-top) + 14px)", paddingBottom: 14, paddingLeft: 18, paddingRight: 18, position: "relative", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(40,160,160,0.15)", borderBottom: "1px solid rgba(40,160,160,0.25)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="32" height="32" style={{ flexShrink: 0 }}>
              <g>
                <rect x="95" y="15" width="8" height="8" rx="2" fill="#2FA7A2"/>
                <rect x="128" y="24" width="8" height="8" rx="2" fill="#7ED957"/>
                <rect x="152" y="48" width="8" height="8" rx="2" fill="#F59E0B"/>
                <rect x="162" y="93" width="8" height="8" rx="2" fill="#7ED957"/>
                <rect x="152" y="138" width="8" height="8" rx="2" fill="#F59E0B"/>
                <rect x="128" y="162" width="8" height="8" rx="2" fill="#7ED957"/>
                <rect x="95" y="172" width="8" height="8" rx="2" fill="#2FA7A2"/>
                <rect x="62" y="162" width="8" height="8" rx="2" fill="#F59E0B"/>
                <rect x="38" y="138" width="8" height="8" rx="2" fill="#7ED957"/>
                <rect x="28" y="93" width="8" height="8" rx="2" fill="#F59E0B"/>
                <rect x="38" y="48" width="8" height="8" rx="2" fill="#7ED957"/>
                <rect x="62" y="24" width="8" height="8" rx="2" fill="#F59E0B"/>
              </g>
              <g transform="rotate(8 100 100)">
                <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
                <path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
                <path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
              </g>
            </svg>
            <div>
            <p suppressHydrationWarning style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,.45)", fontWeight: 600 }}>
              {dataLabel.charAt(0).toUpperCase() + dataLabel.slice(1)}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1.2 }}>{saluto}{aziendaInfo?.nome ? ", " + aziendaInfo.nome.split(" ")[0] : ""}</p>
            </div>
            </div>
          {/* Meteo Brindisi */}
          <div style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "8px 12px", textAlign: "center", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            <IcoSun />
            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: "white" }}>22°</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.5)" }}>Brindisi</p>
          </div>
        </div>
        {/* Mini KPI */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div onClick={() => setTab("commesse")} style={{ background: "rgba(40,160,160,.2)", border: "1px solid rgba(40,160,160,.45)", borderRadius: 12, padding: "10px 10px", textAlign: "center", cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 6px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T_CLR, fontFamily: "monospace" }}>{commesseAttive}</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.65)", fontWeight: 700 }}>commesse</p>
          </div>
          <div onClick={() => setTab("altro")} style={{ background: "rgba(40,160,160,.2)", border: "1px solid rgba(40,160,160,.45)", borderRadius: 12, padding: "10px 10px", textAlign: "center", cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 6px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: T_CLR, fontFamily: "monospace" }}>{onlineCount}</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.65)", fontWeight: 700 }}>in campo</p>
          </div>
          <div onClick={() => setTab("contabilita")} style={{ background: totFat > 0 ? "rgba(26,158,115,.22)" : "rgba(40,160,160,.2)", border: `1px solid ${totFat > 0 ? "rgba(26,158,115,.45)" : "rgba(40,160,160,.45)"}`, borderRadius: 12, padding: "10px 10px", textAlign: "center", cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", boxShadow: "0 6px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: totFat > 0 ? GRN : T_CLR, fontFamily: "monospace" }}>{fmtK(totFat)}</p>
            <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,.65)", fontWeight: 700 }}>da incassare</p>
          </div>
        </div>
      </div>
      {/* Stacco sfumato */}
      <div style={{ height: 20, background: "linear-gradient(to bottom, rgba(13,31,31,0.35) 0%, transparent 100%)", pointerEvents: "none" }} />

      <div style={{ padding: 12, display: "flex", flexDirection: "column" as any, gap: 10 }}>

        {/* AZIONI RAPIDE */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div onClick={() => setShowModal("commessa")} style={{ padding: "18px 16px", borderRadius: 18, background: T_CLR, boxShadow: `0 8px 0 0 ${T_DARK}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ICO.folder} s={22} c="white" /></div>
            <div><p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "white" }}>Commessa</p><p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>Nuova pratica</p></div>
          </div>
          <div onClick={() => setShowSpesa(true)} style={{ padding: "18px 16px", borderRadius: 18, background: AMB, boxShadow: "0 8px 0 0 #7A4800", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ICO.receipt || ICO.tag} s={22} c="white" /></div>
            <div><p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "white" }}>Invia spesa</p><p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)" }}>Scontrino / nota</p></div>
          </div>
        </div>

        {/* DA FARE ORA */}
        <Card>
          <SecTitle badge={<Pill bg="#FFF0DC" color="#7A4000">{tasks.length} azioni</Pill>}>Da fare ora</SecTitle>
          {tasks.length === 0
            ? <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>Nessuna azione urgente</p>
            : <div style={{ display: "flex", flexDirection: "column" as any, gap: 7 }}>
              {tasks.map((t, i) => (
                <div key={i} onClick={t.action} style={{ background: "white", borderRadius: 12, border: `1px solid ${BDR}`, boxShadow: "0 2px 0 0 #A8CCCC", padding: "11px 13px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderLeft: `4px solid ${t.color}` }}>
                  <div style={{ width: 32, height: 32, background: t.color + "1A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK }}>{t.titolo}</p>
                    <p style={{ margin: 0, fontSize: 10, color: SUB }}>{t.sotto}</p>
                  </div>
                  <IcoChev />
                </div>
              ))}
            </div>
          }
        </Card>

        {/* OPERATORI OGGI */}
        <Card>
          <SecTitle badge={<Pill bg="#D8F2F2" color="#0A5050">{onlineCount} in campo</Pill>}>Operatori oggi</SecTitle>
          {ops.length === 0
            ? <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>Nessun operatore configurato</p>
            : <div style={{ display: "flex", flexDirection: "column" as any, gap: 7 }}>
            {ops.map((op, i) => {
              const p = sPill(op.status);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: op.opacity }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Av initials={op.ini} bg={op.bg} />
                    <Dot color={op.dot} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK }}>{op.nome}</p>
                    <p style={{ margin: 0, fontSize: 10, color: SUB }}>{op.ruolo}</p>
                  </div>
                  <Pill bg={p.bg} color={p.color}>{op.status}</Pill>
                </div>
              );
            })}
          </div>}
        </Card>

        {/* AGENDA OGGI */}
        <Card>
          <SecTitle badge={<BtnP onClick={() => setTab("agenda")}>Vedi tutto</BtnP>}>Agenda oggi</SecTitle>
          {todayEvs.length === 0
            ? <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>Nessun evento oggi</p>
            : <div style={{ display: "flex", flexDirection: "column" as any }}>
              {todayEvs.slice(0, 4).map((e, i) => {
                const isLast = i === Math.min(todayEvs.length, 4) - 1;
                const clr = i === 0 ? T_CLR : i === 1 ? AMB : "#1060A0";
                return (
                  <div key={e.id || i} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: isLast ? "none" : `1px solid ${T_LIGHT}` }}>
                    <div style={{ width: 40, flexShrink: 0, textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: clr }}>{e.time || "—"}</p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: INK }}>{e.text}</p>
                      <p style={{ margin: 0, fontSize: 10, color: SUB }}>{e.persona || ""}</p>
                    </div>
                    <div style={{ width: 4, background: clr, borderRadius: 2, flexShrink: 0 }} />
                  </div>
                );
              })}
            </div>
          }
        </Card>

        {/* ULTIME COMMESSE */}
        <Card>
          <SecTitle badge={<BtnP onClick={() => setTab("commesse")}>Tutte &rarr;</BtnP>}>Ultime commesse</SecTitle>
          <div style={{ display: "flex", flexDirection: "column" as any, gap: 6 }}>
            {recenti.length === 0
              ? <p style={{ margin: 0, fontSize: 12, color: SUB, textAlign: "center", padding: "8px 0" }}>Nessuna commessa</p>
              : recenti.map((c, i) => {
                const isClosed = c.fase === "chiusura";
                const fi = FASI.indexOf(c.fase);
                const ini = (c.cliente || "??").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                const bg = ["#1A7878", "#6B4FB0", "#B05020", "#1060A0"][i % 4];
                return (
                  <div key={c.id} onClick={() => { setSelectedCM(c); setTab("commesse"); }}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: T_LIGHT, borderRadius: 9, border: `1px solid ${BDR}`, cursor: "pointer" }}>
                    <Av initials={ini} bg={bg} size={30} fontSize={10} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: INK }}>{c.cliente}</p>
                      <div style={{ display: "flex", gap: 2, marginTop: 3, height: 13 }}>
                        {FASI.map((f, fii) => {
                          const done = fii <= fi;
                          return (
                            <div key={f} style={{ flex: fii === 0 ? 3 : 2, background: done ? (PIPE_COLORS[f] || T_CLR) : "#D0E8E8", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, color: done ? "white" : SUB }}>
                              {f[0].toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {isClosed
                      ? <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: GRN, flexShrink: 0 }}>✓ chiusa</p>
                      : <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: INK, flexShrink: 0 }}>{c.euro ? fmtK(parseFloat(c.euro)) : "—"}</p>
                    }
                  </div>
                );
              })
            }
          </div>
        </Card>

        {/* MODULI RAPIDI */}
        <div style={{ marginTop: 4 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 800, color: SUB, textTransform: "uppercase" as any, letterSpacing: "0.07em" }}>Moduli</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { id: "contabilita", label: "Contabilità", ico: "wallet", color: "#28A0A0" },
              { id: "montaggi_cal", label: "Montaggi", ico: "tool", color: "#E85D24" },
              { id: "clienti", label: "Clienti", ico: "users", color: "#7F77DD" },
              { id: "settings", label: "Impostazioni", ico: "settings", color: "#4A7070" },
            ].map(m => (
              <div key={m.id} onClick={() => setTab(m.id)}
                style={{ background: "#fff", borderRadius: 14, border: `1px solid ${BDR}`,
                  boxShadow: "0 3px 0 0 #A8CCCC", padding: "14px 12px",
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10,
                  background: m.color + "15", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0 }}>
                  <I d={ICO[m.ico]} s={18} c={m.color} />
                </div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: INK }}>{m.label}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showSpesa && <SpesaQuick onClose={() => setShowSpesa(false)} />}
    </div>
  );
}
