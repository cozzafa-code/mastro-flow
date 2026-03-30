"use client";
// @ts-nocheck
import React from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, Ico, I } from "./mastro-constants";
import AiTecnicoChat from "./AiTecnicoChat";

export default function MessaggiPanel() {
  const {
    T, S, isDesktop, fs,
    aiInbox, cantieri, contatti, fornitori, gmailLoading, gmailMessages, gmailNextPage, gmailReply, gmailSearch, gmailSelected, gmailSending, gmailStatus, msgFilter, msgSearch, msgSubTab, msgs, rubricaFilter, rubricaSearch, selectedAiMsg, setAiInbox, setComposeMsg, setContatti, setGmailMessages, setGmailReply, setGmailSearch, setGmailSelected, setGmailStatus, setMailBody, setMsgFilter, setMsgSearch, setMsgSubTab, setMsgs, setNewCM, setNewEvent, setNewTask, setRubricaFilter, setRubricaSearch, setSelectedAiMsg, setSelectedCM, setSelectedMsg, setShowCompose, setShowMailModal, setShowModal, setShowNewEvent, setTab, team, gmailFetchMessages, gmailSendReply, gmailMatchCommessa,
  } = useMastro();

    const chCol = { email: T.blue, whatsapp: "#25d366", sms: T.orange, telegram: "#0088cc" };
    const chIco = { email: <Ico d={ICO.mail} s={14} c={chCol.email} />, whatsapp: <Ico d={ICO.messageCircle} s={14} c={chCol.whatsapp} />, sms: <Ico d={ICO.phone} s={14} c={chCol.sms} />, telegram: <Ico d={ICO.send} s={14} c={chCol.telegram} /> };
    const chBg = { email: T.blueLt, whatsapp: "#25d36618", sms: T.orangeLt, telegram: "#0088cc18" };
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
      <div style={{ paddingBottom: 80 }}>
        <div style={S.header}>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Messaggi</div>
            <div style={S.headerSub}>{unread > 0 ? `${unread} non letti` : "Tutti letti"} · {msgs.length} conversazioni</div>
          </div>
          <div onClick={() => setShowCompose(true)} style={{ width: 36, height: 36, borderRadius: 10, background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Ico d={ICO.pen} s={16} c="#fff" />
          </div>
        </div>

        {/* Sub-tabs: Chat / Rubrica / AI */}
        <div style={{ display: "flex", margin: "8px 16px", borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
          {[
            { id: "chat", l: "Chat", ico: ICO.messageCircle, count: unread },
            { id: "email", l: "Email", ico: ICO.mail, count: gmailMessages.filter(m => m.unread).length },
            { id: "ai", l: "AI", ico: ICO.cpu, count: aiInbox.filter(m => !m.read).length },
            { id: "rubrica", l: "Rubrica", ico: ICO.users, count: 0 },
            { id: "tecnico", l: "Tecnico", ico: ICO.cpu, count: 0 }
          ].map(st => (
            <div key={st.id} onClick={() => setMsgSubTab(st.id)} style={{ flex: 1, padding: "10px 4px", textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer", background: msgSubTab === st.id ? T.acc : T.card, color: msgSubTab === st.id ? "#fff" : T.sub, transition: "all 0.2s", position: "relative" }}>
              <span style={{display:"inline-flex",alignItems:"center",gap:4}}><Ico d={st.ico} s={13} c={msgSubTab === st.id ? "#fff" : T.sub} /> {st.l}</span>
              {st.count > 0 && <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 8, background: msgSubTab === st.id ? "rgba(255,255,255,0.3)" : T.red, color: "#fff" }}>{st.count}</span>}
            </div>
          ))}
        </div>

        {/* == CHAT TAB == */}
        {msgSubTab === "chat" && (<>
          <div style={{ padding: "4px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
              <Ico d={ICO.search} s={14} c={T.sub} />
              <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca contatto o messaggio..." value={msgSearch} onChange={e => setMsgSearch(e.target.value)} />
              {msgSearch && <div onClick={() => setMsgSearch("")} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}></div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "0 16px 10px", overflowX: "auto" }}>
            {[
              { id: "tutti", l: "Tutti", c: T.acc },
              { id: "whatsapp", l: "WhatsApp", ico: ICO.messageCircle, c: "#25d366" },
              { id: "email", l: "Email", ico: ICO.mail, c: T.blue },
              { id: "sms", l: "SMS", ico: ICO.phone, c: T.orange },
              { id: "telegram", l: "Telegram", ico: ICO.send, c: "#0088cc" },
            ].map(f => {
              const unr = f.id === "tutti" ? unread : msgs.filter(m => m.canale === f.id && !m.read).length;
              return (
                <div key={f.id} onClick={() => setMsgFilter(f.id)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${msgFilter === f.id ? f.c : T.bdr}`, background: msgFilter === f.id ? f.c + "15" : T.card, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: msgFilter === f.id ? f.c : T.sub, display: "flex", alignItems: "center", gap: 4 }}>
                  {f.ico && <Ico d={f.ico} s={12} c={msgFilter === f.id ? f.c : T.sub} />}{f.l}
                  {unr > 0 && <span style={{ width: 16, height: 16, borderRadius: "50%", background: f.c, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unr}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ padding: "0 16px" }}>
            {filteredMsgs.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: T.sub, fontSize: 13 }}>Nessun messaggio</div>
            ) : (
              <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
                {filteredMsgs.map(m => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.bg}`, cursor: "pointer", background: m.read ? "transparent" : T.acc + "06" }} onClick={() => { setMsgs(ms => ms.map(x => x.id === m.id ? { ...x, read: true } : x)); setSelectedMsg(m); }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: chBg[m.canale] || T.bg, border: `2px solid ${chCol[m.canale] || T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, position: "relative" }}>
                      {m.from.charAt(0).toUpperCase()}
                      <div style={{ position: "absolute", bottom: -2, right: -2, fontSize: 10, background: T.card, borderRadius: "50%", padding: 1 }}>{chIco[m.canale]}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: m.read ? 500 : 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.from}</div>
                        <div style={{ fontSize: 10, color: m.read ? T.sub : T.acc, fontWeight: m.read ? 400 : 700, flexShrink: 0, marginLeft: 8 }}>{m.time}</div>
                      </div>
                      <div style={{ fontSize: 12, color: m.read ? T.sub : T.text, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: m.read ? 400 : 500 }}>{m.preview}</div>
                      {m.cm && <div style={{ marginTop: 3 }}><span style={S.badge(T.accLt, T.acc)}>{m.cm}</span></div>}
                    </div>
                    {!m.read && <div style={{ width: 10, height: 10, borderRadius: "50%", background: T.acc, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>)}

        {/* == EMAIL TAB == */}
        {msgSubTab === "email" && (<>
          {!gmailStatus.connected ? (
            <div style={{ margin: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}><I d={ICO.mail} /></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8 }}>Collega la tua email</div>
              <div style={{ fontSize: 12, color: T.sub, marginBottom: 20, lineHeight: 1.6 }}>
                Collegando Gmail, riceverai le email dei clienti e fornitori direttamente nell'Inbox di MASTRO.
                Le email vengono automaticamente associate alle commesse.
              </div>
              <div onClick={() => window.location.href = "/api/gmail/auth"} style={{ display: "inline-block", padding: "14px 32px", borderRadius: 12, background: "#ea4335", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                <span style={{ marginRight: 8 }}><I d={ICO.mail} /></span> Collega Gmail
              </div>
              <div style={{ fontSize: 10, color: T.sub, marginTop: 12 }}>Supporta Gmail e Google Workspace. I dati restano sul tuo dispositivo.</div>
            </div>
          ) : gmailSelected ? (
            /* === EMAIL DETAIL VIEW === */
            <div style={{ padding: "0 16px" }}>
              <div onClick={() => { setGmailSelected(null); setGmailReply(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 700 }}>
                ← Torna alla inbox
              </div>
              {/* Email header */}
              <div style={{ background: T.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>{gmailSelected.subject || "(senza oggetto)"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{gmailSelected.from?.replace(/<.*>/, "").trim()}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from}</div>
                  </div>
                  <div style={{ fontSize: 10, color: T.sub }}>{new Date(gmailSelected.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                {/* Commessa match */}
                {(() => { const match = gmailMatchCommessa(gmailSelected); return match ? (
                  <div onClick={() => { setSelectedCM(match); setTab("commesse"); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 8, background: T.acc + "10", border: `1px solid ${T.acc}30`, cursor: "pointer", marginTop: 4 }}>
                    <span style={{ fontSize: 12 }}><I d={ICO.folder} /></span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.acc }}>{match.code} — {match.cliente} {match.cognome || ""}</span>
                  </div>
                ) : null; })()}
                {/* Attachments */}
                {gmailSelected.attachments?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}><I d={ICO.paperclip} /> ALLEGATI ({gmailSelected.attachments.length})</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {gmailSelected.attachments.map((a, i) => (
                        <div key={i} style={{ padding: "4px 8px", borderRadius: 6, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 10, color: T.text }}>
                          {a.filename.endsWith(".pdf") ? "" : a.filename.match(/\.(jpg|png|jpeg)$/i) ? "" : ""} {a.filename}
                          <span style={{ fontSize: 8, color: T.sub, marginLeft: 4 }}>{Math.round(a.size/1024)}KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Email body */}
              <div style={{ background: T.card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.text, lineHeight: 1.7, whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>
                {gmailSelected.body || gmailSelected.snippet || "(nessun contenuto)"}
              </div>
              {/* Quick actions */}
              <div style={{ background: T.card, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8 }}><I d={ICO.zap} /> Azioni rapide</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {/* Link a commessa esistente */}
                  {(() => { const match = gmailMatchCommessa(gmailSelected); return match ? (
                    <div onClick={() => { setSelectedCM(match); setTab("commesse"); }} style={{ padding: "8px 14px", borderRadius: 8, background: T.acc + "15", color: T.acc, fontSize: 11, fontWeight: 700, cursor: "pointer" }}><I d={ICO.folder} /> Apri {match.code}</div>
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
                  <div onClick={() => { const fromEmail = gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from; navigator.clipboard?.writeText(fromEmail); alert("Email copiata!"); }} style={{ padding: "8px 14px", borderRadius: 8, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.bdr}` }}><I d={ICO.clipboard} /> Copia email</div>
                  {/* Seleziona tutto il testo */}
                  <div onClick={() => { navigator.clipboard?.writeText(gmailSelected.body || gmailSelected.snippet || ""); alert("Testo email copiato!"); }} style={{ padding: "8px 14px", borderRadius: 8, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.bdr}` }}><I d={ICO.fileText} /> Copia testo</div>
                </div>
              </div>
              {/* Reply */}
              <div style={{ background: T.card, borderRadius: 12, padding: 12, border: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6 }}>↩️ RISPONDI</div>
                <textarea value={gmailReply} onChange={e => setGmailReply(e.target.value)} rows={4} placeholder="Scrivi la risposta..."
                  style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.bg, fontSize: 12, color: T.text, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" as any, lineHeight: 1.5 }} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button disabled={!gmailReply.trim() || gmailSending} onClick={() => {
                    const to = gmailSelected.from?.match(/<(.+)>/)?.[1] || gmailSelected.from;
                    gmailSendReply(to, gmailSelected.subject, gmailReply, gmailSelected.threadId);
                  }} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: gmailReply.trim() ? "#007aff" : T.bdr, color: "#fff", fontSize: 13, fontWeight: 700, cursor: gmailReply.trim() ? "pointer" : "default", fontFamily: "inherit", opacity: gmailSending ? 0.6 : 1 }}>
                    {gmailSending ? "Invio..." : "Invia risposta"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* === EMAIL LIST VIEW === */
            <div style={{ padding: "0 16px" }}>
              {/* Connected status + search */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: 14 }}><I d={ICO.search} /></span>
                  <input value={gmailSearch} onChange={e => setGmailSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") gmailFetchMessages(gmailSearch); }}
                    placeholder="Cerca email..." style={{ flex: 1, border: "none", background: "transparent", fontSize: 12, color: T.text, outline: "none", fontFamily: FF }} />
                  {gmailSearch && <div onClick={() => { setGmailSearch(""); gmailFetchMessages(); }} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}></div>}
                </div>
                <div onClick={() => gmailFetchMessages(gmailSearch)} style={{ padding: "8px 12px", borderRadius: 10, background: T.acc, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  <I d={ICO.refreshCw} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 10, color: T.sub }}><I d={ICO.mail} /> {gmailStatus.email} · {gmailMessages.length} email</div>
                <div onClick={async () => { if(confirm("Disconnettere Gmail?")) { await fetch("/api/gmail/disconnect", { method: "POST" }); setGmailStatus({ connected: false }); setGmailMessages([]); }}} style={{ fontSize: 10, color: T.red, cursor: "pointer" }}>Disconnetti</div>
              </div>

              {gmailLoading && gmailMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: T.sub }}>Caricamento email...</div>
              ) : gmailMessages.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: T.sub }}>Nessuna email trovata</div>
              ) : (
                <>
                  {gmailMessages.map(m => {
                    const match = gmailMatchCommessa(m);
                    const fromName = m.from?.replace(/<.*>/, "").trim() || "—";
                    const fromShort = fromName.length > 25 ? fromName.substring(0, 25) + "…" : fromName;
                    return (
                      <div key={m.id} onClick={() => setGmailSelected(m)} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: `1px solid ${m.unread ? T.acc + "40" : T.bdr}`, marginBottom: 6, cursor: "pointer", borderLeft: m.unread ? `3px solid ${T.acc}` : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                          <div style={{ fontSize: 12, fontWeight: m.unread ? 800 : 600, color: T.text, flex: 1 }}>{fromShort}</div>
                          <div style={{ fontSize: 9, color: T.sub, flexShrink: 0, marginLeft: 8 }}>{new Date(m.timestamp).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}</div>
                        </div>
                        <div style={{ fontSize: 11, fontWeight: m.unread ? 700 : 400, color: T.text, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{m.subject || "(senza oggetto)"}</div>
                        <div style={{ fontSize: 10, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{m.snippet}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          {match && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: T.acc + "15", color: T.acc, fontWeight: 700 }}><I d={ICO.folder} /> {match.code}</span>}
                          {m.attachments?.length > 0 && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: T.bg, color: T.sub, fontWeight: 700 }}><I d={ICO.paperclip} /> {m.attachments.length}</span>}
                          {m.unread && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: T.acc + "15", color: T.acc, fontWeight: 700 }}>NUOVA</span>}
                        </div>
                      </div>
                    );
                  })}
                  {gmailNextPage && (
                    <div onClick={() => gmailFetchMessages(gmailSearch, gmailNextPage)} style={{ textAlign: "center", padding: 12, color: T.acc, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
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
          <div style={{ margin: "0 16px 10px", padding: "10px 12px", borderRadius: 10, background: "linear-gradient(135deg, #1A1A1C, #2A2008)", border: `1px solid ${T.acc}30`, display: "flex", alignItems: "center", gap: 10 }}>
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
                    style={{ padding: "11px 13px", display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", background: m.read ? T.card : T.acc + "06" }}>
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: m.ai.color + "20", border: `2px solid ${m.ai.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: m.ai.color, flexShrink: 0 }}>
                      {m.from.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: m.read ? 500 : 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.from}</div>
                        <div style={{ fontSize: 10, color: T.sub, flexShrink: 0 }}>{m.time}</div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: m.read ? 400 : 600, color: T.text, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.subject}</div>
                      {/* Badge AI */}
                      <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, background: m.ai.color + "18", color: m.ai.color, border: `1px solid ${m.ai.color}30` }}>
                          {m.ai.emoji} {m.ai.label}
                        </span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: T.sub }}>
                          <I d={ICO.cpu} /> {m.ai.confidenza}% sicuro
                        </span>
                        {m.ai.cmSuggerita && <span style={{ ...S.badge(T.accLt, T.acc) }}>{m.ai.cmSuggerita}</span>}
                        {m.archiviata && <span style={{ fontSize: 9, fontWeight: 700, color: T.grn }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg> Archiviata</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, color: T.sub, transform: isSelected ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.2s", flexShrink: 0, marginTop: 2 }}></span>
                  </div>

                  {/* Dettaglio espanso */}
                  {isSelected && (
                    <div style={{ borderTop: `1px solid ${T.bdr}`, padding: "12px 13px" }}>
                      {/* Testo email */}
                      <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6, marginBottom: 10, padding: "8px 10px", background: T.bg, borderRadius: 8 }}>
                        {m.body}
                      </div>

                      {/* Analisi AI */}
                      <div style={{ background: m.ai.color + "10", border: `1px solid ${m.ai.color}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: m.ai.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}><I d={ICO.cpu} /> Analisi AI</div>
                        <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}><strong>Tipo:</strong> {m.ai.emoji} {m.ai.label} ({m.ai.confidenza}% confidenza)</div>
                        <div style={{ fontSize: 12, color: T.text, marginBottom: 4 }}><strong>Azione suggerita:</strong> {m.ai.azione}</div>
                        {m.ai.note && <div style={{ fontSize: 11, color: T.sub, fontStyle: "italic" }}>"{m.ai.note}"</div>}
                      </div>

                      {/* Dati estratti (se nuova commessa) */}
                      {m.ai.estratto && (
                        <div style={{ background: T.grnLt, border: `1px solid ${T.grn}30`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.grn, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}><I d={ICO.clipboard} /> Dati estratti automaticamente</div>
                          {m.ai.estratto.cliente && <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}><I d={ICO.user} /> <strong>Cliente:</strong> {m.ai.estratto.cliente}</div>}
                          {m.ai.estratto.indirizzo && <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}><I d={ICO.mapPin} /> <strong>Indirizzo:</strong> {m.ai.estratto.indirizzo}</div>}
                          {m.ai.estratto.email && <div style={{ fontSize: 12, color: T.text, marginBottom: 3 }}><I d={ICO.mail} /> <strong>Email:</strong> {m.ai.estratto.email}</div>}
                          {m.ai.estratto.note && <div style={{ fontSize: 12, color: T.text }}><I d={ICO.fileText} /> <strong>Note:</strong> {m.ai.estratto.note}</div>}
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
                          }} style={{ flex: 1, padding: "10px", borderRadius: 9, background: T.bg, border: `1px solid ${T.bdr}`, color: T.sub, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                            Ignora
                          </div>
                          <div onClick={() => {
                            const dest = m.email || "";
                            const tpl = `Gentile ${m.from.split(" ")[0]},

Grazie per il suo messaggio.

`;
                            setMailBody(tpl);
                            setShowMailModal({ ev: { text: m.subject, date: new Date().toISOString().slice(0,10), time: "", addr: "" }, cm: null, emailOverride: dest });
                          }} style={{ flex: 1, padding: "10px", borderRadius: 9, background: T.accLt, border: `1px solid ${T.acc}30`, color: T.acc, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                            <I d={ICO.mail} />
                          </div>
                        </div>
                      )}
                      {m.archiviata && (
                        <div style={{ padding: "8px 12px", background: T.grnLt, borderRadius: 8, textAlign: "center", fontSize: 12, fontWeight: 700, color: T.grn }}>
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
          <div style={{ padding: "4px 16px 8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
              <Ico d={ICO.search} s={14} c={T.sub} />
              <input style={{ flex: 1, border: "none", background: "transparent", fontSize: 13, color: T.text, outline: "none", fontFamily: FF }} placeholder="Cerca nella rubrica..." value={rubricaSearch} onChange={e => setRubricaSearch(e.target.value)} />
              {rubricaSearch && <div onClick={() => setRubricaSearch("")} style={{ cursor: "pointer", fontSize: 14, color: T.sub }}></div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, padding: "0 16px 10px", overflowX: "auto" }}>
            {[
              { id: "tutti", l: "Tutti", c: T.acc },
              { id: "preferiti", l: "⭐ Preferiti", c: "#ff9500" },
              { id: "team", l: "● Team", c: "#34c759" },
              { id: "clienti", l: "Clienti", c: T.blue },
              { id: "fornitori", l: "Fornitori", c: "#af52de" },
            ].map(f => (
              <div key={f.id} onClick={() => setRubricaFilter(f.id)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${rubricaFilter === f.id ? f.c : T.bdr}`, background: rubricaFilter === f.id ? f.c + "15" : T.card, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", color: rubricaFilter === f.id ? f.c : T.sub }}>
                {f.l}
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {filteredContatti.length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: T.sub, fontSize: 13 }}>Nessun contatto trovato</div>
              ) : filteredContatti.map(c => {
                const tipoColor = c.tipo === "team" ? "#34c759" : c.tipo === "cliente" ? T.blue : c.tipo === "fornitore" ? "#af52de" : "#ff9500";
                const tipoLabel = c.tipo === "team" ? "Team" : c.tipo === "cliente" ? "Cliente" : c.tipo === "fornitore" ? "Fornitore" : "Professionista";
                return (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: `1px solid ${T.bg}` }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: (c.colore || tipoColor) + "18", border: `2px solid ${c.colore || tipoColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: c.colore || tipoColor, flexShrink: 0, position: "relative" }}>
                      {c.nome.split(" ").map(w => w[0]).join("").substring(0, 2)}
                      {c.preferito && <div style={{ position: "absolute", top: -4, right: -4, fontSize: 10 }}>⭐</div>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{c.nome}</div>
                      <div style={{ display: "flex", gap: 4, marginTop: 2, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={S.badge(tipoColor + "18", tipoColor)}>{tipoLabel}</span>
                        {c.ruolo && <span style={{ fontSize: 10, color: T.sub }}>{c.ruolo}</span>}
                        {c.cm && <span style={S.badge(T.accLt, T.acc)}>{c.cm}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(c.canali || []).includes("whatsapp") && (
                        <div onClick={() => { setComposeMsg(m => ({ ...m, canale: "whatsapp", to: c.nome })); setShowCompose(true); }} style={{ width: 32, height: 32, borderRadius: "50%", background: "#25d36618", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}><I d={ICO.messageCircle} /></div>
                      )}
                      {(c.canali || []).includes("email") && (
                        <div onClick={() => { setComposeMsg(m => ({ ...m, canale: "email", to: c.nome })); setShowCompose(true); }} style={{ width: 32, height: 32, borderRadius: "50%", background: T.blueLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}><I d={ICO.mail} /></div>
                      )}
                      <div onClick={() => { setContatti(cs => cs.map(x => x.id === c.id ? { ...x, preferito: !x.preferito } : x)); }} style={{ width: 32, height: 32, borderRadius: "50%", background: c.preferito ? "#ff950018" : T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer" }}>
                        {c.preferito ? "⭐" : ""}
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
