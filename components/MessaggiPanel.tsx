"use client";
// @ts-nocheck
import React from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, Ico, I } from "./mastro-constants";
import AiTecnicoChat from "./AiTecnicoChat";


// ─── fliwoX Design Tokens ───────────────────────────────
const L = {
  bg:          "#D8EEEE",
  surface:     "#ffffff",
  surfaceLow:  "#F1F5F9",
  surfaceMid:  "#D8EEEE",
  primary:     "#1E3A5F",
  primaryCont: "#0F1B2D",
  onPrimary:   "#ffffff",
  muted:       "#8BBCBC",
  text:        "#0D1F1F",
  sub:         "#475A75",
  placeholder: "#8BBCBC",
  green:       "#1A9E73",
  red:         "#DC4444",
  amber:       "#D08008",
  amberBg:     "rgba(208,128,8,0.12)",
  border:      "#CBD5E1",
  glass:       "rgba(255,255,255,0.9)",
} as const;
const SH = {
  ambient: "0 7px 0 0 #A8CCCC",
  float:   "0 7px 0 0 #A8CCCC",
  sm:      "0 5px 0 0 #A8CCCC",
} as const;
// ─────────────────────────────────────────────────────────
export default function MessaggiPanel() {
  const {
    T, S, isDesktop, fs,
    aiInbox, cantieri, contatti, fornitori, gmailLoading, gmailMessages, gmailNextPage, gmailReply, gmailSearch, gmailSelected, gmailSending, gmailStatus, msgFilter, msgSearch, msgSubTab, msgs, rubricaFilter, rubricaSearch, selectedAiMsg, setAiInbox, setComposeMsg, setContatti, setGmailMessages, setGmailReply, setGmailSearch, setGmailSelected, setGmailStatus, setMailBody, setMsgFilter, setMsgSearch, setMsgSubTab, setMsgs, setNewCM, setNewEvent, setNewTask, setRubricaFilter, setRubricaSearch, setSelectedAiMsg, setSelectedCM, setSelectedMsg, setShowCompose, setShowMailModal, setShowModal, setShowNewEvent, setTab, team, gmailFetchMessages, gmailSendReply, gmailMatchCommessa,
  } = useMastro();

    // ═══ SEED MESSAGGI DEMO (solo se DB vuoto) ═══
    React.useEffect(() => {
      if (msgs.length === 0 && msgSubTab === "chat") {
        setMsgs([
          {
            id: "demo-1",
            from: "Mario Rossi",
            preview: "Buongiorno, vorrei un preventivo per 4 finestre PVC",
            time: "14:32",
            canale: "whatsapp",
            cm: "S-0001",
            read: false,
            urgente: true,
            priorita: "alta",
            giorniDaInvio: 0,
          },
          {
            id: "demo-2",
            from: "Roberto Mancini",
            preview: "Buongiorno, è possibile spostare il montaggio di una settimana? Ho un imprevisto familiare",
            time: "07:45",
            canale: "whatsapp",
            cm: "S-0009",
            read: false,
            unreadCount: 2,
          },
          {
            id: "demo-3",
            from: "Anna Bianchi",
            preview: "Ho mandato 8 foto del sopralluogo. Aspetto vostro feedback per le misure",
            time: "ieri",
            canale: "email",
            cm: "S-0002",
            read: false,
            allegati: 8,
            unreadCount: 1,
          },
          {
            id: "demo-4",
            from: "Vincenzo Pinto",
            preview: "Ok perfetto, confermato per venerdì 15 alle 9 in cantiere",
            time: "ieri",
            canale: "whatsapp",
            cm: "S-0007",
            read: false,
          },
          {
            id: "demo-5",
            from: "Studio Legale Russo",
            preview: "In allegato la documentazione richiesta per il bando.",
            time: "lun",
            canale: "email",
            read: true,
          },
          {
            id: "demo-6",
            from: "Luigi Esposito",
            preview: "Grazie per la disponibilità, vi farò sapere appena ho deciso",
            time: "ven scorso",
            canale: "sms",
            read: true,
          },
          {
            id: "demo-7",
            from: "Mario Rossi",
            preview: "Perfetto, aspetto allora il preventivo via mail",
            time: "30 apr",
            canale: "whatsapp",
            cm: "S-0001",
            read: true,
          },
        ]);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [msgSubTab]);

    // === EMAIL FOLDERS ===
    const [emailCartelle, setEmailCartelle] = React.useState<any[]>(() => {
      try { const v = localStorage.getItem("mastro:emailCartelle"); return v ? JSON.parse(v) : [
        { id: "inbox", nome: "Inbox", icon: "inbox", color: "#1E3A5F", regole: [], system: true },
        { id: "clienti", nome: "Clienti", icon: "users", color: "#1A9E73", regole: [] },
        { id: "fornitori", nome: "Fornitori", icon: "package", color: "#F97316", regole: [] },
        { id: "commercialista", nome: "Commercialista", icon: "wallet", color: "#3B7FE0", regole: [] },
        { id: "consulente", nome: "Consulente Lavoro", icon: "fileText", color: "#8B5CF6", regole: [] },
        { id: "banca", nome: "Banca", icon: "creditCard", color: "#D08008", regole: [] },
        { id: "cantieri", nome: "Cantieri", icon: "hammer", color: "#F97316", regole: [] },
      ]; } catch(e) { return []; }
    });
    const [emailCartellaAttiva, setEmailCartellaAttiva] = React.useState("inbox");
    const [imapForm, setImapForm] = React.useState<any>(null);
    const [imapConnecting, setImapConnecting] = React.useState(false);
    const [showNuovaCartella, setShowNuovaCartella] = React.useState(false);
    const [showRegolaModal, setShowRegolaModal] = React.useState<string|null>(null);
    const [nuovaRegola, setNuovaRegola] = React.useState("");
    React.useEffect(() => { try { localStorage.setItem("mastro:emailCartelle", JSON.stringify(emailCartelle)); } catch(e){} }, [emailCartelle]);

    // Classify email into folder based on rules
    const classificaEmail = (email: any) => {
      const from = (email.from || "").toLowerCase();
      for (const c of emailCartelle) {
        if (c.id === "inbox") continue;
        for (const r of (c.regole || [])) {
          if (from.includes(r.toLowerCase())) return c.id;
        }
      }
      return "inbox";
    };
    const emailFiltrate = gmailMessages.filter(m => {
      if (emailCartellaAttiva === "inbox") return true; // inbox shows all
      return classificaEmail(m) === emailCartellaAttiva;
    });
    const contaPerCartella = (cId: string) => {
      if (cId === "inbox") return gmailMessages.length;
      return gmailMessages.filter(m => classificaEmail(m) === cId).length;
    };

    const chCol = { email: "#3b7fe0", whatsapp: "#25d366", sms: L.amber, telegram: "#0088cc" };
    const chIco = { email: <Ico d={ICO.mail} s={14} c={chCol.email} />, whatsapp: <Ico d={ICO.messageCircle} s={14} c={chCol.whatsapp} />, sms: <Ico d={ICO.phone} s={14} c={chCol.sms} />, telegram: <Ico d={ICO.send} s={14} c={chCol.telegram} /> };
    const chBg = { email: "#dbeafe", whatsapp: "#25d36618", sms: "#fff7ed", telegram: "#0088cc18" };
    const filteredMsgs = msgs.filter(m => {
      const matchFilter = msgFilter === "tutti" || m.canale === msgFilter;
      const matchSearch = !msgSearch.trim() || m.from.toLowerCase().includes(msgSearch.toLowerCase()) || m.preview.toLowerCase().includes(msgSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
    const unread = msgs.filter(m => !m.read).length;

    const filteredContatti = [...contatti, ...team.map(t => ({ id: "t" + t.id, nome: t.nome, tipo: "team", ruolo: t.ruolo, tel: "", email: "", preferito: true, canali: ["whatsapp", "email"], cm: "", colore: t.colore }))].filter(c => {
      const matchF = rubricaFilter === "tutti" || (rubricaFilter === "preferiti" && c.preferito) || (rubricaFilter === "team" && c.tipo === "team") || (rubricaFilter === "clienti" && c.tipo === "cliente") || (rubricaFilter === "fornitori" && (c.tipo === "fornitore" || c.tipo === "professionista"));
      const matchS = !rubricaSearch.trim() || c.nome.toLowerCase().includes(rubricaSearch.toLowerCase());
      return matchF && matchS;
    }).sort((a, b) => (b.preferito ? 1 : 0) - (a.preferito ? 1 : 0) || a.nome.localeCompare(b.nome));

    return (
      <div style={{ paddingBottom:110, backgroundColor:"#94A3B8", minHeight:"100vh", fontFamily:"'Manrope', -apple-system, system-ui, sans-serif" }}>
        {/* HEADER TEAL CAPSULA v5 */}
        <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 12px) 10px 0" }}>
          <div style={{
            background: "linear-gradient(160deg, #1E3A5F 0%, #0F1B2D 100%)",
            padding: "16px 16px 18px",
            borderRadius: 22,
            boxShadow: "0 8px 22px rgba(15,23,42,0.25)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 500, letterSpacing: 0.5 }}>COMUNICAZIONE</div>
              <div onClick={() => setShowCompose(true)} style={{
                width: 28, height: 28, borderRadius: 10,
                background: "#FFFFFF",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}>
                <Ico d={ICO.pen} s={14} c="#1E3A5F" />
              </div>
            </div>
            <div style={{ color: "#FFFFFF", fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>Messaggi</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6 }}>
              <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 500 }}>{unread > 0 ? `${unread} non letti` : "Tutti letti"}</div>
              <div style={{ color: "rgba(255,255,255,0.6)" }}>·</div>
              <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 500 }}>{msgs.length} conversazioni</div>
            </div>

            {/* Tab switch coerente con agenda */}
            <div style={{ display: "flex", gap: 4, marginTop: 14, background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 3 }}>
              {[
                { id:"chat", l:"Chat", ico:ICO.messageCircle, count:unread },
                { id:"email", l:"Email", ico:ICO.mail, count:gmailMessages.filter(m => m.unread).length },
                { id:"ai", l:"Assistente", ico:ICO.cpu, count:aiInbox.filter(m => !m.read).length },
                { id:"rubrica", l:"Rubrica", ico:ICO.users, count:0 },
                { id:"tecnico", l:"Tecnico", ico:ICO.cpu, count:0 }
              ].map(st => {
                const active = msgSubTab === st.id;
                return (
                  <div key={st.id} onClick={() => setMsgSubTab(st.id)} style={{
                    flex: 1, textAlign: "center" as const, padding: 7, borderRadius: 10,
                    fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer",
                    background: active ? "#FFFFFF" : "transparent",
                    color: active ? "#1E3A5F" : "rgba(255,255,255,0.85)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                    position: "relative" as const,
                  }}>
                    <Ico d={st.ico} s={11} c={active ? "#1E3A5F" : "rgba(255,255,255,0.85)"} />
                    {st.l}
                    {st.count > 0 && (
                      <span style={{
                        fontSize: 8, fontWeight: 800, padding: "1px 4px", borderRadius: 8,
                        background: active ? "#991B1B" : "rgba(255,255,255,0.3)",
                        color: "#fff",
                      }}>{st.count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* == CHAT TAB == */}
        {msgSubTab === "chat" && (<>
          {/* ═══ INSIGHTS COMPATTI (max 3) ═══ */}
          {(() => {
            const insights: any[] = [];
            // Insight 1: Silenzio prolungato
            const silente = msgs.find(m => !m.read && m.giorniDaInvio && m.giorniDaInvio >= 5);
            if (silente) insights.push({
              tipo: "silenzio",
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              title: silente.from + " non risponde da " + silente.giorniDaInvio + " giorni",
              sub: silente.cm ? "Preventivo " + silente.cm + " inviato" : "In attesa di risposta",
              cta: "Chiama"
            });
            // Insight 2: Allegati raggruppabili (>=3 foto stesso giorno)
            const oggiMsgs = msgs.filter(m => !m.read && m.allegati);
            if (oggiMsgs.length >= 3) insights.push({
              tipo: "allegati",
              icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="13" r="4"/><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/></svg>,
              title: oggiMsgs.length + " foto da raggruppare",
              sub: "Vuoi salvarle nel rilievo?",
              cta: "Salva"
            });
            // Mostra max 2 per non saturare
            const visibili = insights.slice(0, 2);
            if (!visibili.length) return null;
            return (
              <div style={{ padding: "10px 14px 4px" }}>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: "#1E3A5F", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 7, paddingLeft: 4 }}>
                  Da controllare
                </div>
                {visibili.map((ins, i) => (
                  <div key={i} style={{
                    background: "#FFFFFF",
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    borderLeft: "3px solid #6D28D9",
                    boxShadow: "0 2px 6px rgba(15,23,42,0.06)",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: "#F5F3FF", color: "#6D28D9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>{ins.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0A1628", lineHeight: 1.3 }}>{ins.title}</div>
                      <div style={{ fontSize: 10, color: "#475A75", fontWeight: 600, marginTop: 2 }}>{ins.sub}</div>
                    </div>
                    <button style={{
                      background: "#6D28D9", color: "#FFF",
                      padding: "5px 10px", borderRadius: 7,
                      fontSize: 10, fontWeight: 800,
                      border: "none", cursor: "pointer",
                      flexShrink: 0,
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                    }}>{ins.cta}</button>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* ═══ SEARCH BAR ═══ */}
          <div style={{ padding: "10px 14px 8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #CBD5E1",
              boxShadow: "0 2px 6px rgba(15,23,42,0.05)",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475A75" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: 13, fontWeight: 600, color: "#0A1628",
                outline: "none", fontFamily: "inherit",
              }} placeholder="Cerca cliente, commessa, parola..." value={msgSearch} onChange={e => setMsgSearch(e.target.value)} />
              {msgSearch && <div onClick={() => setMsgSearch("")} style={{ cursor: "pointer", fontSize: 16, color: "#475A75", padding: "0 4px" }}>×</div>}
            </div>
          </div>

          {/* ═══ FILTRI CANALE NAVY/BIANCO ═══ */}
          <div style={{ display: "flex", gap: 5, padding: "0 14px 10px", overflowX: "auto" }}>
            {[
              { id: "tutti", l: "Tutti", c: "#1E3A5F" },
              { id: "whatsapp", l: "WhatsApp", ico: ICO.messageCircle, c: "#25D366" },
              { id: "email", l: "Email", ico: ICO.mail, c: "#4A7AB0" },
              { id: "sms", l: "SMS", ico: ICO.phone, c: "#92400E" },
              { id: "telegram", l: "Telegram", ico: ICO.send, c: "#0088CC" },
            ].map(f => {
              const unr = f.id === "tutti" ? unread : msgs.filter(m => m.canale === f.id && !m.read).length;
              const sel = msgFilter === f.id;
              return (
                <button key={f.id} onClick={() => setMsgFilter(f.id)} style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: `1px solid ${sel ? "#1E3A5F" : "#CBD5E1"}`,
                  background: sel ? "#1E3A5F" : "#FFFFFF",
                  color: sel ? "#FFF" : "#475A75",
                  fontSize: 11, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  whiteSpace: "nowrap" as const,
                  display: "inline-flex", alignItems: "center", gap: 5,
                  flexShrink: 0,
                  WebkitTapHighlightColor: "transparent",
                  touchAction: "manipulation",
                  letterSpacing: 0.2,
                }}>
                  {f.ico && <Ico d={f.ico} s={11} c={sel ? "#FFF" : f.c} />}
                  <span>{f.l}</span>
                  {unr > 0 && <span style={{
                    background: sel ? "rgba(15,27,45,0.9)" : "#475A75",
                    color: "#FFF",
                    fontSize: 9, fontWeight: 800,
                    padding: "1px 6px", borderRadius: 999,
                    minWidth: 18, textAlign: "center" as const,
                  }}>{unr}</span>}
                </button>
              );
            })}
          </div>

          {/* ═══ LISTA CONVERSAZIONI ═══ */}
          <div style={{ padding: "0 14px" }}>
            {filteredMsgs.length === 0 ? (
              <div style={{
                background: "#FFFFFF",
                border: "1px dashed #CBD5E1",
                borderRadius: 14,
                padding: 30,
                textAlign: "center" as const,
                color: "#475A75",
                fontSize: 13,
                fontWeight: 700,
              }}>Nessun messaggio</div>
            ) : (() => {
              // Raggruppa: urgenti / non letti / letti
              const urgenti = filteredMsgs.filter((m: any) => m.urgente || m.priorita === "alta");
              const nonLetti = filteredMsgs.filter((m: any) => !m.read && !m.urgente && m.priorita !== "alta");
              const letti = filteredMsgs.filter((m: any) => m.read);

              const renderCard = (m: any) => {
                const canColor = chCol[m.canale] || "#1E3A5F";
                const canBg = chBg[m.canale] || "#F1F5F9";
                const isUnread = !m.read;
                const isUrg = m.urgente || m.priorita === "alta";
                const initials = (m.from || "").split(" ").map((s: string) => s.charAt(0)).slice(0, 2).join("").toUpperCase();

                return (
                  <div key={m.id} onClick={() => {
                    setMsgs((ms: any) => ms.map((x: any) => x.id === m.id ? { ...x, read: true } : x));
                    setSelectedMsg(m);
                  }} style={{
                    background: isUrg ? "#FEE2E2" : (isUnread ? "#DBE6F1" : "#FFFFFF"),
                    border: "1px solid " + (isUrg ? "#991B1B" : (isUnread ? "#1E3A5F" : "#E2E8F0")),
                    borderLeft: "4px solid " + (isUrg ? "#991B1B" : (isUnread ? "#1E3A5F" : "transparent")),
                    borderRadius: 14,
                    padding: 10,
                    marginBottom: 7,
                    display: "flex", alignItems: "flex-start", gap: 10,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    touchAction: "manipulation",
                  }}>
                    {/* AVATAR + canale badge */}
                    <div style={{
                      width: 42, height: 42, borderRadius: 11,
                      background: "linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%)",
                      color: "#FFF",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12.5, fontWeight: 800,
                      flexShrink: 0, position: "relative" as const,
                    }}>
                      {initials || (m.from || "?").charAt(0).toUpperCase()}
                      <div style={{
                        position: "absolute" as const,
                        bottom: -2, right: -2,
                        width: 17, height: 17, borderRadius: "50%",
                        background: canColor,
                        border: "2px solid #FFF",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{m.canale && chIco[m.canale] && React.cloneElement(chIco[m.canale], { c: "#FFF", s: 9 })}</div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Riga 1: nome + ora */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 1 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 800,
                          color: "#0A1628",
                          textTransform: "uppercase" as const,
                          letterSpacing: -0.2,
                          textOverflow: "ellipsis" as const,
                          overflow: "hidden" as const,
                          whiteSpace: "nowrap" as const,
                        }}>{m.from}</div>
                        <div style={{
                          fontSize: 10, color: "#94A3B8",
                          fontWeight: 600, flexShrink: 0,
                          marginLeft: 6,
                        }}>{m.time}</div>
                      </div>

                      {/* Riga 2: pills */}
                      {(m.cm || isUrg) && (
                        <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                          {m.cm && <span style={{
                            background: "#1E3A5F", color: "#FFF",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 9, fontWeight: 800,
                            padding: "2px 6px", borderRadius: 4,
                            letterSpacing: 0.3,
                          }}>{m.cm}</span>}
                          {isUrg && <span style={{
                            background: "#FEE2E2", color: "#991B1B",
                            fontSize: 9, fontWeight: 800,
                            padding: "2px 6px", borderRadius: 4,
                            letterSpacing: 0.3, textTransform: "uppercase" as const,
                          }}>URGENTE</span>}
                        </div>
                      )}

                      {/* Riga 3: preview */}
                      <div style={{
                        fontSize: 11.5,
                        color: isUnread ? "#0A1628" : "#475A75",
                        fontWeight: isUnread ? 600 : 500,
                        lineHeight: 1.35,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical" as const,
                        overflow: "hidden" as const,
                      }}>{m.preview}</div>

                      {/* Riga 4: badge non letti se ce ne sono */}
                      {isUnread && m.unreadCount > 0 && (
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                          <span style={{
                            background: "#1E3A5F", color: "#FFF",
                            fontSize: 10, fontWeight: 800,
                            padding: "2px 7px", borderRadius: 999,
                            minWidth: 22, textAlign: "center" as const,
                          }}>{m.unreadCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              };

              return (
                <>
                  {urgenti.length > 0 && (<>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#991B1B", letterSpacing: 0.6, textTransform: "uppercase", margin: "10px 4px 6px", display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/></svg>
                      Urgente
                    </div>
                    {urgenti.map(renderCard)}
                  </>)}

                  {nonLetti.length > 0 && (<>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#1E3A5F", letterSpacing: 0.6, textTransform: "uppercase", margin: (urgenti.length > 0 ? "12px" : "10px") + " 4px 6px" }}>
                      Da rispondere
                    </div>
                    {nonLetti.map(renderCard)}
                  </>)}

                  {letti.length > 0 && (<>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#475A75", letterSpacing: 0.6, textTransform: "uppercase", margin: ((urgenti.length + nonLetti.length) > 0 ? "12px" : "10px") + " 4px 6px" }}>
                      Letti
                    </div>
                    {letti.map(renderCard)}
                  </>)}
                </>
              );
            })()}
          </div>
        </>)}

        {/* == EMAIL TAB == */}
        {msgSubTab === "email" && (<>
          {!gmailStatus.connected ? (
            <div style={{ padding: "20px 16px" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: L.primary + "15", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <I d={ICO.mail} s={32} c={L.primary} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: L.text, marginBottom: 6 }}>Collega la tua email</div>
                <div style={{ fontSize: 12, color: L.sub, lineHeight: 1.6 }}>
                  Tutte le email dei clienti, fornitori e consulenti organizzate in cartelle automatiche.
                </div>
              </div>

              {/* Gmail OAuth - one click */}
              <div onClick={() => window.location.href = "/api/gmail/auth"}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16,
                  background: L.surface, border: "1.5px solid " + L.border, marginBottom: 10, cursor: "pointer",
                  boxShadow: SH.ambient }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ea433512", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <I d={ICO.mail} s={22} c="#ea4335" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: L.text }}>Gmail / Google Workspace</div>
                  <div style={{ fontSize: 11, color: L.sub }}>Collegamento con un click</div>
                </div>
                <I d={ICO.chevronRight} s={16} c={L.sub} />
              </div>

              {/* IMAP - any email */}
              {!imapForm ? (
                <div onClick={() => setImapForm({ email: "", password: "", server: "", porta: "993", ssl: true })}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 16,
                    background: L.surface, border: "1.5px solid " + L.border, marginBottom: 10, cursor: "pointer",
                    boxShadow: SH.ambient }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: L.primary + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <I d={ICO.settings} s={22} c={L.primary} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: L.text }}>Altra email (PEC, Outlook, Libero...)</div>
                    <div style={{ fontSize: 11, color: L.sub }}>Collegamento IMAP — funziona con tutti</div>
                  </div>
                  <I d={ICO.chevronRight} s={16} c={L.sub} />
                </div>
              ) : (
                <div style={{ padding: 18, borderRadius: 16, background: L.surface, border: "1.5px solid " + L.primary + "40", boxShadow: SH.ambient }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: L.text, marginBottom: 4 }}>Configura email</div>
                  <div style={{ fontSize: 11, color: L.sub, marginBottom: 14 }}>Inserisci i dati del tuo account. Li trovi nelle impostazioni del tuo provider email.</div>
                  
                  {/* Provider presets */}
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, marginBottom: 6, textTransform: "uppercase" }}>Provider rapido</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                    {[
                      { n: "PEC Aruba", s: "imaps.pec.aruba.it", p: "993" },
                      { n: "PEC Legalmail", s: "mail.legalmail.it", p: "993" },
                      { n: "PEC Register", s: "imaps.pec.register.it", p: "993" },
                      { n: "Outlook", s: "outlook.office365.com", p: "993" },
                      { n: "Libero", s: "imapmail.libero.it", p: "993" },
                      { n: "Aruba", s: "imaps.aruba.it", p: "993" },
                      { n: "Yahoo", s: "imap.mail.yahoo.com", p: "993" },
                    ].map(pr => (
                      <div key={pr.n} onClick={() => setImapForm((prev: any) => ({...prev, server: pr.s, porta: pr.p}))}
                        style={{ padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer",
                          background: imapForm.server === pr.s ? L.primary : L.bg, color: imapForm.server === pr.s ? "#fff" : L.text,
                          border: "1px solid " + (imapForm.server === pr.s ? L.primary : L.border) }}>{pr.n}</div>
                    ))}
                  </div>

                  {[
                    { key: "email", label: "Indirizzo email", placeholder: "es. mario@pec.it", type: "email" },
                    { key: "password", label: "Password", placeholder: "Password dell'account", type: "password" },
                    { key: "server", label: "Server IMAP", placeholder: "es. imaps.pec.aruba.it", type: "text" },
                    { key: "porta", label: "Porta", placeholder: "993", type: "number" },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: L.sub, marginBottom: 4 }}>{f.label}</div>
                      <input type={f.type} value={(imapForm as any)[f.key] || ""} onChange={e => setImapForm((prev: any) => ({...prev, [f.key]: e.target.value}))}
                        placeholder={f.placeholder}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + L.border, background: L.bg, fontSize: 14, fontFamily: FF, color: L.text, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={async () => {
                      if (!imapForm.email || !imapForm.password || !imapForm.server) { alert("Compila tutti i campi"); return; }
                      setImapConnecting(true);
                      try {
                        const res = await fetch("/api/imap/connect", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(imapForm),
                        });
                        const data = await res.json();
                        if (data.connected) {
                          setGmailStatus({ connected: true, email: imapForm.email });
                          setGmailMessages(data.messages || []);
                          setImapForm(null);
                          localStorage.setItem("mastro:imapConfig", JSON.stringify({ email: imapForm.email, server: imapForm.server, porta: imapForm.porta }));
                        } else {
                          alert("Errore: " + (data.error || "Impossibile connettersi. Verifica i dati."));
                        }
                      } catch(e) {
                        alert("Errore di connessione. Verifica i dati e riprova.");
                      }
                      setImapConnecting(false);
                    }} disabled={imapConnecting}
                      style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: L.primary, color: "#fff",
                        fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: "0 5px 0 0 #156060",
                        opacity: imapConnecting ? 0.6 : 1 }}>
                      {imapConnecting ? "Connessione..." : "Collega email"}
                    </button>
                    <button onClick={() => setImapForm(null)}
                      style={{ padding: "14px 18px", borderRadius: 14, border: "1.5px solid " + L.border, background: L.surface,
                        fontSize: 13, fontWeight: 700, cursor: "pointer", color: L.sub }}>Annulla</button>
                  </div>
                  
                  <div style={{ fontSize: 10, color: L.sub, marginTop: 12, lineHeight: 1.5, padding: "8px 10px", background: L.bg, borderRadius: 8 }}>
                    <I d={ICO.shield} s={12} c={L.primary} /> Le credenziali sono criptate e salvate solo sul tuo account. MASTRO non legge ne archivia le tue email — le mostra e basta.
                  </div>
                </div>
              )}

              {/* Help */}
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 12, background: L.bg, border: "1px solid " + L.border }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: L.text, marginBottom: 6 }}>Dove trovo i dati IMAP?</div>
                <div style={{ fontSize: 11, color: L.sub, lineHeight: 1.6 }}>
                  Cerca "impostazioni IMAP" nel tuo provider email. I dati tipici sono: server (es. imaps.pec.aruba.it), porta (993), SSL attivo. La password e quella del tuo account email.
                </div>
              </div>
            </div>
          ) : gmailSelected ? (
            /* === EMAIL DETAIL VIEW === */
            <div style={{ padding: "0 16px" }}>
              <div onClick={() => { setGmailSelected(null); setGmailReply(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", cursor: "pointer", color: L.primary, fontSize: 12, fontWeight: 700 }}>
                ← Torna alla inbox
              </div>
              {/* Email header */}
              <div style={{ background: L.surface, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${L.border}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: L.text, marginBottom: 6 }}>{gmailSelected.subject || "(senza oggetto)"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: L.text }}>{gmailSelected.from?.replace(/<.*>/, "").trim()}</div>
                    <div style={{ fontSize: 10, color: L.sub }}>{gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from}</div>
                  </div>
                  <div style={{ fontSize: 10, color: L.sub }}>{new Date(gmailSelected.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                {/* Commessa match */}
                {(() => { const match = gmailMatchCommessa(gmailSelected); return match ? (
                  <div onClick={() => { setSelectedCM(match); setTab("commesse"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: L.primary + "10", border: `1px solid ${L.primary}30`, cursor: "pointer", marginTop: 4 }}>
                    <span style={{ fontSize: 12 }}><I d={ICO.folder} /></span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: L.primary }}>{match.code} — {match.cliente} {match.cognome || ""}</span>
                  </div>
                ) : null; })()}
                {/* Attachments */}
                {gmailSelected.attachments?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: L.sub, marginBottom: 4 }}><I d={ICO.paperclip} /> ALLEGATI ({gmailSelected.attachments.length})</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {gmailSelected.attachments.map((a, i) => (
                        <div key={i} style={{ padding: "4px 8px", borderRadius: 6, background: L.bg, border: `1px solid ${L.border}`, fontSize: 10, color: L.text }}>
                          {a.filename.endsWith(".pdf") ? "" : a.filename.match(/\.(jpg|png|jpeg)$/i) ? "" : ""} {a.filename}
                          <span style={{ fontSize: 8, color: L.sub, marginLeft: 4 }}>{Math.round(a.size/1024)}KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Email body */}
              <div style={{ background: L.surface, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${L.border}`, fontSize: 12, color: L.text, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {gmailSelected.body || gmailSelected.snippet || "(nessun contenuto)"}
              </div>
              {/* Quick actions */}
              <div style={{ background: L.surface, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${L.border}` }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: L.sub, textTransform: "uppercase", marginBottom: 8 }}><I d={ICO.zap} /> Azioni rapide</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {/* Link a commessa esistente */}
                  {(() => { const match = gmailMatchCommessa(gmailSelected); return match ? (
                    <div onClick={() => { setSelectedCM(match); setTab("commesse"); }} style={{ padding: "8px 14px", borderRadius: 8, background: L.primary + "15", color: L.primary, fontSize: 11, fontWeight: 700, cursor: "pointer" }}><I d={ICO.folder} /> Apri {match.code}</div>
                  ) : null; })()}
                  {/* Crea nuova commessa */}
                  <div onClick={() => {
                    const fromName = (gmailSelected.from || "").replace(/<.*>/, "").trim();
                    const fromEmail = gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from || "";
                    setNewCM(p => ({ ...p, cliente: fromName, email: fromEmail, note: "Da email: " + (gmailSelected.subject || "") }));
                    setShowModal("commessa");
                    setGmailSelected(null);
                    setTab("commesse");
                  }} style={{ padding: "8px 14px", borderRadius: 8, background: "#34c75915", color: "#34c759", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <I d={ICO.clipboard} /> Nuova commessa
                  </div>
                  {/* Crea evento/appuntamento */}
                  <div onClick={() => {
                    const fromName = (gmailSelected.from || "").replace(/<.*>/, "").trim();
                    setNewEvent({ text: gmailSelected.subject || "Appuntamento", persona: fromName, date: new Date().toISOString().split("T")[0], time: "09:00", tipo: "sopralluogo", addr: "", reminder: "", cm: "" });
                    setShowNewEvent(true);
                    setGmailSelected(null);
                    setTab("agenda");
                  }} style={{ padding: "8px 14px", borderRadius: 8, background: "#5856d615", color: "#5856d6", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <I d={ICO.calendar} /> Crea evento
                  </div>
                  {/* Crea task */}
                  <div onClick={() => {
                    const fromName = (gmailSelected.from || "").replace(/<.*>/, "").trim();
                    setNewTask({ text: "Rispondere a " + fromName + ": " + (gmailSelected.subject || ""), date: new Date().toISOString().split("T")[0], priority: "media", cm: "", meta: "", time: "", persona: fromName });
                    setShowModal("task");
                    setTab("agenda");
                    setGmailSelected(null);
                  }} style={{ padding: "8px 14px", borderRadius: 8, background: "#ff950015", color: "#ff9500", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Crea task
                  </div>
                  {/* Aggiungi a rubrica */}
                  <div onClick={() => {
                    const fromName = (gmailSelected.from || "").replace(/<.*>/, "").trim();
                    const fromEmail = gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from || "";
                    const exists = contatti.find(c => c.email?.toLowerCase() === fromEmail.toLowerCase());
                    if (exists) { alert("Già in rubrica: " + exists.nome); return; }
                    const parts = fromName.split(" ");
                    setContatti(prev => [...prev, { id: Date.now(), nome: parts[0] || fromName, cognome: parts.slice(1).join(" ") || "", email: fromEmail, telefono: "", tipo: "cliente", preferito: false }]);
                    alert("" + fromName + " aggiunto alla rubrica!");
                  }} style={{ padding: "8px 14px", borderRadius: 8, background: "#af52de15", color: "#af52de", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                    <I d={ICO.users} /> Rubrica
                  </div>
                  {/* Copia email */}
                  <div onClick={() => { const fromEmail = gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from; navigator.clipboard?.writeText(fromEmail); alert("Email copiata!"); }} style={{ padding: "8px 14px", borderRadius: 8, background: L.bg, color: L.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${L.border}` }}><I d={ICO.clipboard} /> Copia email</div>
                  {/* Seleziona tutto il testo */}
                  <div onClick={() => { navigator.clipboard?.writeText(gmailSelected.body || gmailSelected.snippet || ""); alert("Testo email copiato!"); }} style={{ padding: "8px 14px", borderRadius: 8, background: L.bg, color: L.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${L.border}` }}><I d={ICO.fileText} /> Copia testo</div>
                </div>
              </div>
              {/* Reply */}
              <div style={{ background: L.surface, borderRadius: 12, padding: 12, border: `1px solid ${L.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: L.sub, marginBottom: 6 }}>↩️ RISPONDI</div>
                <textarea value={gmailReply} onChange={e => setGmailReply(e.target.value)} rows={4} placeholder="Scrivi la risposta..."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${L.border}`, background: L.bg, fontSize: 12, color: L.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" as any, lineHeight: 1.5 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button disabled={!gmailReply.trim() || gmailSending} onClick={() => {
                    const to = gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from;
                    gmailSendReply(to, gmailSelected.subject, gmailReply, gmailSelected.threadId);
                    (async () => {
                      try {
                        const { Day } = await import("@/lib/day-logger");
                        await Day.mailInviata({ destinatario: to, oggetto: gmailSelected?.subject || undefined });
                      } catch (e) { console.warn("[MessaggiPanel] logEvento Day fallito", e); }
                    })();
                  }} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: gmailReply.trim() ? "#007aff" : L.border, color: "#fff", fontSize: 13, fontWeight: 700, cursor: gmailReply.trim() ? "pointer" : "default", fontFamily: "inherit", opacity: gmailSending ? 0.6 : 1 }}>
                    {gmailSending ? "Invio..." : "Invia risposta"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* === EMAIL LIST VIEW WITH FOLDERS === */
            <div style={{ padding: "0 16px" }}>
              {/* Folder bar */}
              <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
                {emailCartelle.map(c => {
                  const count = contaPerCartella(c.id);
                  const active = emailCartellaAttiva === c.id;
                  return (
                    <div key={c.id} onClick={() => setEmailCartellaAttiva(c.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 12,
                        background: active ? c.color : L.surface, color: active ? "#fff" : L.text,
                        border: active ? "none" : "1.5px solid " + L.border, cursor: "pointer", flexShrink: 0,
                        boxShadow: active ? "0 3px 0 0 " + c.color + "80" : "none", whiteSpace: "nowrap" }}>
                      <I d={ICO[c.icon] || ICO.folder} s={12} c={active ? "#fff" : c.color} />
                      <span style={{ fontSize: 11, fontWeight: 800 }}>{c.nome}</span>
                      {count > 0 && <span style={{ fontSize: 9, fontWeight: 900, padding: "1px 5px", borderRadius: 8,
                        background: active ? "rgba(255,255,255,0.25)" : c.color + "20", color: active ? "#fff" : c.color }}>{count}</span>}
                    </div>
                  );
                })}
                {/* Add folder button */}
                <div onClick={() => setShowNuovaCartella(true)}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 12,
                    border: "1.5px dashed " + L.border, cursor: "pointer", flexShrink: 0 }}>
                  <I d={ICO.plus} s={12} c={L.sub} /><span style={{ fontSize: 11, fontWeight: 700, color: L.sub }}>Cartella</span>
                </div>
              </div>

              {/* Folder actions bar */}
              {emailCartellaAttiva !== "inbox" && (() => {
                const cart = emailCartelle.find(c => c.id === emailCartellaAttiva);
                return cart ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "8px 10px", borderRadius: 10, background: (cart.color || L.primary) + "08", border: "1px solid " + (cart.color || L.primary) + "20" }}>
                    <I d={ICO[cart.icon] || ICO.folder} s={14} c={cart.color} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: cart.color, flex: 1 }}>{cart.nome}</span>
                    <div onClick={() => setShowRegolaModal(cart.id)} style={{ padding: "4px 10px", borderRadius: 8, background: cart.color + "15", fontSize: 10, fontWeight: 700, color: cart.color, cursor: "pointer" }}>
                      <I d={ICO.settings} s={10} c={cart.color} /> Regole ({(cart.regole || []).length})
                    </div>
                    {!cart.system && <div onClick={() => { if (confirm("Eliminare cartella " + cart.nome + "?")) { setEmailCartelle(prev => prev.filter(c => c.id !== cart.id)); setEmailCartellaAttiva("inbox"); }}}
                      style={{ padding: "4px 8px", borderRadius: 8, background: "#FFE4E4", fontSize: 10, fontWeight: 700, color: "#DC4444", cursor: "pointer" }}>
                      <I d={ICO.trash} s={10} c="#DC4444" />
                    </div>}
                  </div>
                ) : null;
              })()}

              {/* New folder modal */}
              {showNuovaCartella && (
                <div style={{ padding: 14, marginBottom: 10, borderRadius: 14, background: L.surface, border: "1.5px solid " + L.border, boxShadow: SH.ambient }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: L.text, marginBottom: 10 }}>Nuova cartella</div>
                  <input id="nc-nome" placeholder="Nome cartella (es. Assicurazione)"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid " + L.border, background: L.bg, fontSize: 13, fontFamily: FF, color: L.text, outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => {
                      const input = document.getElementById("nc-nome") as HTMLInputElement;
                      const nome = input?.value?.trim();
                      if (!nome) return;
                      setEmailCartelle(prev => [...prev, { id: "c" + Date.now(), nome, icon: "folder", color: "#" + Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,"0"), regole: [] }]);
                      setShowNuovaCartella(false);
                    }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: L.primary, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 3px 0 0 #156060" }}>Crea</button>
                    <button onClick={() => setShowNuovaCartella(false)} style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid " + L.border, background: L.surface, fontSize: 13, fontWeight: 700, cursor: "pointer", color: L.sub }}>Annulla</button>
                  </div>
                </div>
              )}

              {/* Rules modal */}
              {showRegolaModal && (() => {
                const cart = emailCartelle.find(c => c.id === showRegolaModal);
                if (!cart) return null;
                return (
                  <div style={{ padding: 14, marginBottom: 10, borderRadius: 14, background: L.surface, border: "1.5px solid " + (cart.color || L.primary), boxShadow: SH.ambient }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: L.text, marginBottom: 4 }}>Regole per "{cart.nome}"</div>
                    <div style={{ fontSize: 11, color: L.sub, marginBottom: 10 }}>Le email da questi indirizzi vanno automaticamente in questa cartella.</div>
                    {(cart.regole || []).map((r: string, ri: number) => (
                      <div key={ri} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: L.bg, marginBottom: 4 }}>
                        <I d={ICO.mail} s={12} c={cart.color} />
                        <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: L.text }}>{r}</span>
                        <span onClick={() => setEmailCartelle(prev => prev.map(c => c.id === cart.id ? {...c, regole: c.regole.filter((_: string, i: number) => i !== ri)} : c))}
                          style={{ fontSize: 10, color: "#DC4444", cursor: "pointer", fontWeight: 700 }}>Rimuovi</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <input value={nuovaRegola} onChange={e => setNuovaRegola(e.target.value)} placeholder="es. studio.rossi@pec.it"
                        style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid " + L.border, background: L.bg, fontSize: 12, fontFamily: FF, color: L.text, outline: "none" }} />
                      <button onClick={() => {
                        if (!nuovaRegola.trim()) return;
                        setEmailCartelle(prev => prev.map(c => c.id === cart.id ? {...c, regole: [...(c.regole || []), nuovaRegola.trim()]} : c));
                        setNuovaRegola("");
                      }} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: cart.color || L.primary, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", boxShadow: "0 3px 0 0 " + (cart.color || "#0F1B2D") + "80" }}>+ Aggiungi</button>
                    </div>
                    <button onClick={() => setShowRegolaModal(null)} style={{ width: "100%", marginTop: 8, padding: "10px", borderRadius: 10, border: "1.5px solid " + L.border, background: L.surface, fontSize: 12, fontWeight: 700, cursor: "pointer", color: L.sub }}>Chiudi</button>
                  </div>
                );
              })()}

              {/* Connected status + search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: L.surface, borderRadius: 10, border: `1px solid ${L.border}` }}>
                  <span style={{ fontSize: 14 }}><I d={ICO.search} /></span>
                  <input value={gmailSearch} onChange={e => setGmailSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") gmailFetchMessages(gmailSearch); }}
                    placeholder="Cerca email..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 12, color: L.text, outline: "none", fontFamily: FF }} />
                  {gmailSearch && <div onClick={() => { setGmailSearch(""); gmailFetchMessages(); }} style={{ cursor: "pointer", fontSize: 14, color: L.sub }}></div>}
                </div>
                <div onClick={() => gmailFetchMessages(gmailSearch)} style={{ padding: "8px 12px", borderRadius: 10, background: L.primary, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  <I d={ICO.refreshCw} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: L.sub }}><I d={ICO.mail} /> {gmailStatus.email} · {emailFiltrate.length} email{emailCartellaAttiva !== "inbox" ? " in " + (emailCartelle.find(c => c.id === emailCartellaAttiva)?.nome || "") : ""}</div>
                <div onClick={async () => { if(confirm("Disconnettere Gmail?")) { await fetch("/api/gmail/disconnect", { method: "POST" }); setGmailStatus({ connected: false }); setGmailMessages([]); }}} style={{ fontSize: 10, color: L.red, cursor: "pointer" }}>Disconnetti</div>
              </div>

              {gmailLoading && gmailMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: L.sub }}>Caricamento email...</div>
              ) : gmailMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: L.sub }}>Nessuna email trovata</div>
              ) : (
                <>
                  {emailFiltrate.map(m => {
                    const match = gmailMatchCommessa(m);
                    const fromName = m.from?.replace(/<.*>/, "").trim() || "—";
                    const fromShort = fromName.length > 25 ? fromName.substring(0, 25) + "…" : fromName;
                    return (
                      <div key={m.id} onClick={() => setGmailSelected(m)} style={{ padding: "10px 12px", background: L.surface, borderRadius: 10, border: `1px solid ${m.unread ? L.primary + "40" : L.border}`, marginBottom: 6, cursor: "pointer", borderLeft: m.unread ? `3px solid ${L.primary}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                          <div style={{ fontSize: 12, fontWeight: m.unread ? 800 : 600, color: L.text, flex: 1 }}>{fromShort}</div>
                          <div style={{ fontSize: 9, color: L.sub, flexShrink: 0, marginLeft: 8 }}>{new Date(m.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: m.unread ? 700 : 400, color: L.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{m.subject || "(senza oggetto)"}</div>
                        <div style={{ fontSize: 10, color: L.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{m.snippet}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          {match && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: L.primary + "15", color: L.primary, fontWeight: 700 }}><I d={ICO.folder} /> {match.code}</span>}
                          {m.attachments?.length > 0 && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: L.bg, color: L.sub, fontWeight: 700 }}><I d={ICO.paperclip} /> {m.attachments.length}</span>}
                          {m.unread && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: L.primary + "15", color: L.primary, fontWeight: 700 }}>NUOVA</span>}
                        </div>
                      </div>
                    );
                  })}
                  {gmailNextPage && (
                    <div onClick={() => gmailFetchMessages(gmailSearch, gmailNextPage)} style={{ textAlign: "center", padding: 12, color: L.primary, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      {gmailLoading ? "Caricamento..." : "Carica altre email"}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>)}

        {/* == AI INBOX TAB == */}
        {msgSubTab === "ai" && (<>
          {/* Header spiegazione */}
          <div style={{ margin: "0 16px 10px", padding: "10px 12px", borderRadius: 10, background: "linear-gradient(135deg, #1A1A1C, #2A2008)", border: `1px solid ${L.primary}30`, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}><I d={ICO.cpu} /></span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>AI classifica le tue email</div>
              <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>Collegata al tuo indirizzo mail — suggerisce dove archiviare ogni messaggio</div>
            </div>
          </div>

          {/* Lista email classificate */}
          <div style={{ padding: "0 16px" }}>
            {aiInbox.map(m => {
              const isSelected = selectedAiMsg?.id === m.id;
              return (
                <div key={m.id} style={{ ...S.card, marginBottom: 8, padding: 0, overflow: "hidden", opacity: m.archiviata ? 0.5 : 1 }}>
                  {/* Header messaggio */}
                  <div onClick={() => setSelectedAiMsg(isSelected ? null : m)}
                    style={{ padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: m.read ? L.surface : L.primary + "06" }}>
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: m.ai.color + "20", border: `2px solid ${m.ai.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: m.ai.color, flexShrink: 0 }}>
                      {m.from.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: m.read ? 500 : 700, color: L.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.from}</div>
                        <div style={{ fontSize: 10, color: L.sub, flexShrink: 0 }}>{m.time}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: m.read ? 400 : 600, color: L.text, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>
                      {/* Badge AI */}
                      <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: m.ai.color + "18", color: m.ai.color, border: `1px solid ${m.ai.color}30` }}>
                          {m.ai.emoji} {m.ai.label}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: L.sub }}>
                          <I d={ICO.cpu} /> {m.ai.confidenza}% sicuro
                        </span>
                        {m.ai.cmSuggerita && <span style={{ ...S.badge(L.amberBg, L.primary) }}>{m.ai.cmSuggerita}</span>}
                        {m.archiviata && <span style={{ fontSize: 9, fontWeight: 700, color: L.green }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg> Archiviata</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: L.sub, transform: isSelected ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0, marginTop: 2 }}></span>
                  </div>

                  {/* Dettaglio espanso */}
                  {isSelected && (
                    <div style={{ borderTop: `1px solid ${L.border}`, padding: "12px 13px" }}>
                      {/* Testo email */}
                      <div style={{ fontSize: 11, color: L.sub, lineHeight: 1.6, marginBottom: 10, padding: "8px 10px", background: L.bg, borderRadius: 8 }}>
                        {m.body}
                      </div>

                      {/* Analisi AI */}
                      <div style={{ background: m.ai.color + "10", border: `1px solid ${m.ai.color}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: m.ai.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}><I d={ICO.cpu} /> Analisi AI</div>
                        <div style={{ fontSize: 12, color: L.text, marginBottom: 4 }}><strong>Tipo:</strong> {m.ai.emoji} {m.ai.label} ({m.ai.confidenza}% confidenza)</div>
                        <div style={{ fontSize: 12, color: L.text, marginBottom: 4 }}><strong>Azione suggerita:</strong> {m.ai.azione}</div>
                        {m.ai.note && <div style={{ fontSize: 11, color: L.sub, fontStyle: "italic" }}>"{m.ai.note}"</div>}
                      </div>

                      {/* Dati estratti (se nuova commessa) */}
                      {m.ai.estratto && (
                        <div style={{ background: "#d1fae5", border: `1px solid ${L.green}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: L.green, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}><I d={ICO.clipboard} /> Dati estratti automaticamente</div>
                          {m.ai.estratto.cliente && <div style={{ fontSize: 12, color: L.text, marginBottom: 3 }}><I d={ICO.user} /> <strong>Cliente:</strong> {m.ai.estratto.cliente}</div>}
                          {m.ai.estratto.indirizzo && <div style={{ fontSize: 12, color: L.text, marginBottom: 3 }}><I d={ICO.mapPin} /> <strong>Indirizzo:</strong> {m.ai.estratto.indirizzo}</div>}
                          {m.ai.estratto.email && <div style={{ fontSize: 12, color: L.text, marginBottom: 3 }}><I d={ICO.mail} /> <strong>Email:</strong> {m.ai.estratto.email}</div>}
                          {m.ai.estratto.note && <div style={{ fontSize: 12, color: L.text }}><I d={ICO.fileText} /> <strong>Note:</strong> {m.ai.estratto.note}</div>}
                        </div>
                      )}

                      {/* Azioni */}
                      {!m.archiviata && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <div onClick={() => {
                            setAiInbox(ai => ai.map(x => x.id === m.id ? { ...x, archiviata: true, read: true } : x));
                            setSelectedAiMsg(null);
                            if (m.ai.cmSuggerita) {
                              const cm = cantieri.find(c => c.code === m.ai.cmSuggerita);
                              if (cm) { setSelectedCM(cm); setTab("commesse"); }
                            }
                          }} style={{ flex: 2, padding: "10px", borderRadius: 9, background: m.ai.color, color: "#fff", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            {m.ai.cmNuova ? <><I d={ICO.plus} /> Crea Commessa</> : <><I d={ICO.link} /> {m.ai.azione.split(" ").slice(0,3).join(" · ")}</>}
                          </div>
                          <div onClick={() => {
                            setAiInbox(ai => ai.map(x => x.id === m.id ? { ...x, archiviata: true, read: true } : x));
                            setSelectedAiMsg(null);
                          }} style={{ flex: 1, padding: "10px", borderRadius: 9, background: L.bg, border: `1px solid ${L.border}`, color: L.sub, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            Ignora
                          </div>
                          <div onClick={() => {
                            const dest = m.email || "";
                            const tpl = `Gentile ${m.from.split(" ")[0]},

Grazie per il suo messaggio.

`;
                            setMailBody(tpl);
                            setShowMailModal({ ev: { text: m.subject, date: new Date().toISOString().slice(0,10), time: "", addr: "" }, cm: null, emailOverride: dest });
                          }} style={{ flex: 1, padding: "10px", borderRadius: 9, background: L.amberBg, border: `1px solid ${L.primary}30`, color: L.primary, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            <I d={ICO.mail} />
                          </div>
                        </div>
                      )}
                      {m.archiviata && (
                        <div style={{ padding: "8px 12px", background: "#d1fae5", borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, color: L.green }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg> Archiviata con successo
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>)}

        {/* == AI TECNICO TAB == */}
        {msgSubTab === "tecnico" && (
          <AiTecnicoChat />
        )}

        {/* == RUBRICA TAB == */}
        {msgSubTab === "rubrica" && (<>
          <div style={{ padding:"10px 14px 8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC" }}>
              <Ico d={ICO.search} s={14} c="#475A75" />
              <input style={{ flex:1, border:"none", background:"transparent", fontSize:14, fontWeight:700, color:"#0D1F1F", outline:"none", fontFamily:FF }} placeholder="Cerca nella rubrica..." value={rubricaSearch} onChange={e => setRubricaSearch(e.target.value)} />
              {rubricaSearch && <div onClick={() => setRubricaSearch("")} style={{ cursor:"pointer", fontSize:16, color:"#475A75" }}>×</div>}
            </div>
          </div>
          <div style={{ display:"flex", gap:6, padding:"0 14px 10px", overflowX:"auto" }}>
            {[
              { id:"tutti", l:"Tutti", c:"#1E3A5F" },
              { id:"preferiti", l:"Preferiti", c:"#D08008" },
              { id:"team", l:"Team", c:"#1A9E73" },
              { id:"clienti", l:"Clienti", c:"#3B7FE0" },
              { id:"fornitori", l:"Fornitori", c:"#7C5FBF" },
            ].map(f => {
              const sel = rubricaFilter === f.id;
              return (
              <div key={f.id} onClick={() => setRubricaFilter(f.id)} style={{ padding:"7px 13px", borderRadius:20, border:`1.5px solid ${sel ? f.c : "#CBD5E1"}`, background: sel ? f.c : "white", fontSize:11, fontWeight:900, cursor:"pointer", whiteSpace:"nowrap" as const, color: sel ? "white" : "#475A75", boxShadow: "none" }}>
                {f.l}
              </div>
            );})}
          </div>
          <div style={{ padding:"0 14px" }}>
            <div style={{ background:"linear-gradient(155deg, #FFFFFF 0%, #F5FBFB 100%)", borderRadius:18, overflow:"hidden", boxShadow:"0 6px 20px rgba(30,58,95,0.15)", border:"1px solid rgba(148,163,184,0.5)" }}>
              {filteredContatti.length === 0 ? (
                <div style={{ padding:30, textAlign:"center", color:"#475A75", fontSize:13, fontWeight:700 }}>Nessun contatto trovato</div>
              ) : filteredContatti.map(c => {
                const tipoColor = c.tipo === "team" ? "#1A9E73" : c.tipo === "cliente" ? "#3B7FE0" : c.tipo === "fornitore" ? "#7C5FBF" : "#D08008";
                const tipoLabel = c.tipo === "team" ? "Team" : c.tipo === "cliente" ? "Cliente" : c.tipo === "fornitore" ? "Fornitore" : "Professionista";
                return (
                  <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"13px 14px", borderBottom:"0.5px solid #F0EFEC" }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:(c.colore || tipoColor) + "18", border:`2px solid ${c.colore || tipoColor}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color: c.colore || tipoColor, flexShrink:0, position:"relative", boxShadow:"0 2px 6px rgba(0,0,0,0.1)" }}>
                      {c.nome.split(" ").map(w => w[0]).join("").substring(0, 2)}
                      {c.preferito && <div style={{ position:"absolute", top:-3, right:-3, width:14, height:14, borderRadius:"50%", background:"#D08008", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:8 }}>★</span></div>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:900, color:"#0D1F1F" }}>{c.nome}</div>
                      <div style={{ display:"flex", gap:5, marginTop:3, alignItems:"center", flexWrap:"wrap" as const }}>
                        <span style={{ padding:"2px 8px", borderRadius:20, background:tipoColor+"18", color:tipoColor, fontSize:9, fontWeight:900, boxShadow:`0 2px 0 0 ${tipoColor}44` }}>{tipoLabel}</span>
                        {c.ruolo && <span style={{ fontSize:10, color:"#475A75", fontWeight:700 }}>{c.ruolo}</span>}
                        {c.cm && <span style={{ padding:"2px 8px", borderRadius:20, background:"rgba(208,128,8,0.12)", color:"#D08008", fontSize:9, fontWeight:900 }}>{c.cm}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:5 }}>
                      {(c.canali || []).includes("whatsapp") && (
                        <div onClick={() => { setComposeMsg(m => ({ ...m, canale:"whatsapp", to:c.nome })); setShowCompose(true); }} style={{ width:32, height:32, borderRadius:9, background:"rgba(37,211,102,0.12)", border:"1px solid rgba(37,211,102,0.3)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><I d={ICO.messageCircle} /></div>
                      )}
                      {(c.canali || []).includes("email") && (
                        <div onClick={() => { setComposeMsg(m => ({ ...m, canale:"email", to:c.nome })); setShowCompose(true); }} style={{ width:32, height:32, borderRadius:9, background:"rgba(59,127,224,0.12)", border:"1px solid rgba(59,127,224,0.3)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><I d={ICO.mail} /></div>
                      )}
                      <div onClick={() => { setContatti(cs => cs.map(x => x.id === c.id ? { ...x, preferito: !x.preferito } : x)); }} style={{ width:32, height:32, borderRadius:9, background: c.preferito ? "rgba(208,128,8,0.12)" : "#F1F5F9", border:"1.5px solid #C8E4E4", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        <span style={{ fontSize:14, color: c.preferito ? "#D08008" : "#8BBCBC" }}>★</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>)}

      </div>
    );

}
