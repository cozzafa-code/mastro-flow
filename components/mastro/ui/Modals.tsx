// ═══ MASTRO ERP — Modals (Phase B) ═══
import { useMastro } from "../../MastroContext";
import { supabase } from "../../../lib/supabase";
import { logEvento, TIPI_EVENTO } from "../../../lib/timeline-logger";

export default function Modals() {
  const { setTab, cantieri, setCantieri, msgs, team, sistemiDB, vetriDB,
    coprifiliDB, lamiereDB, fattureDB, setFattureDB,
    ordiniFornDB, setOrdiniFornDB, squadreDB, setMontaggiDB,
    setSelectedCM, showModal, setShowModal, T, S, Ico,
    aziendaInfo, showMailModal, setShowMailModal, mailBody, setMailBody,
    newTask, setNewTask, taskAllegati, setTaskAllegati,
    contatti, setContatti, newCM, setNewCM,
    ripSearch, setRipSearch, ripCMSel, setRipCMSel, ripProblema, setRipProblema,
    ripFotos, setRipFotos, ripUrgenza, setRipUrgenza, mezziSalita,
    isTablet, isDesktop,
    setSelectedRilievo,
    aziendaId,
  } = useMastro();

  // ═══ MASTRO · CREA COMMESSA + RILIEVO R1 AUTO + LOG TIMELINE ═══
  const addCommessa = async () => {
    const cliente = (newCM.cliente || "").trim();
    if (!cliente) return;
    const previewCode = "S-" + String(cantieri.length + 1).padStart(4, "0");
    const azId = aziendaId || aziendaInfo?.id || aziendaInfo?.azienda_id;

    try {
      // 1) Insert commessa su Supabase
      const insertData: any = {
        code: previewCode,
        cliente,
        cognome: newCM.cognome || null,
        indirizzo: newCM.indirizzo || null,
        telefono: newCM.telefono || null,
        email: newCM.email || null,
        tipo: "nuova",
        fase: "sopralluogo",
        difficolta_salita: newCM.difficoltaSalita || null,
        mezzo_salita: newCM.mezzoSalita || null,
        piano_edificio: newCM.pianoEdificio || null,
        foro_scale: newCM.foroScale || null,
        note: newCM.note || null,
      };
      if (azId) insertData.azienda_id = azId;

      const { data: commessaCreata, error: errCM } = await supabase
        .from("commesse")
        .insert(insertData)
        .select()
        .single();

      if (errCM) {
        console.error("[addCommessa] errore insert commessa:", errCM);
        alert("Errore creazione commessa: " + errCM.message);
        return;
      }

      // 2) Insert RILIEVO R1 BOZZA automatico
      const oggi = new Date().toISOString().split("T")[0];
      const { data: rilievoCreato, error: errRil } = await supabase
        .from("rilievi")
        .insert({
          commessa_id: commessaCreata.id,
          azienda_id: azId,
          numero: 1,
          tipo: "rilievo",
          nome: "Rilievo iniziale",
          data: oggi,
          completato: false,
        })
        .select()
        .single();

      if (errRil) {
        console.warn("[addCommessa] errore insert rilievo R1:", errRil);
      }

      // 3) Log timeline: commessa_creata
      if (azId) {
        try {
          await logEvento({
            modulo: "commessa",
            entitaId: commessaCreata.id,
            aziendaId: azId,
            tipo: TIPI_EVENTO.COMMESSA_CREATA,
            titolo: "Commessa " + previewCode + " creata",
            descrizione: cliente + (newCM.indirizzo ? " · " + newCM.indirizzo : ""),
            autore_nome: aziendaInfo?.nome || "Sistema",
            autore_ruolo: "titolare",
            stato: "info",
            commessa_id: commessaCreata.id,
            metadata: {
              tipo: "nuova",
              telefono: newCM.telefono,
              email: newCM.email,
            },
          });
        } catch (e) { console.warn("[timeline log commessa] err:", e); }

        // 4) Log timeline: rilievo R1 creato
        if (rilievoCreato?.id) {
          try {
            await logEvento({
              modulo: "commessa",
              entitaId: commessaCreata.id,
              aziendaId: azId,
              tipo: TIPI_EVENTO.NOTA_AGGIUNTA,
              titolo: "Rilievo R1 creato (Rilievo iniziale)",
              descrizione: "Rilievo bozza pronto per inserire vani e misure",
              autore_nome: aziendaInfo?.nome || "Sistema",
              autore_ruolo: "titolare",
              stato: "in_corso",
              commessa_id: commessaCreata.id,
              metadata: {
                rilievo_id: rilievoCreato.id,
                numero: 1,
                nome: "Rilievo iniziale",
              },
            });
          } catch (e) { console.warn("[timeline log rilievo] err:", e); }
        }
      }

      // 5) Aggiorno stato locale
      const nuovaLocal: any = {
        id: commessaCreata.id,
        code: previewCode,
        cliente,
        cognome: newCM.cognome || "",
        indirizzo: newCM.indirizzo || "",
        telefono: newCM.telefono || "",
        email: newCM.email || "",
        tipo: "nuova",
        fase: "sopralluogo",
        rilievi: rilievoCreato ? [{
          id: rilievoCreato.id,
          n: 1,
          numero: 1,
          nome: "Rilievo iniziale",
          tipo: "rilievo",
          data: oggi,
          completato: false,
          vani: [],
        }] : [],
        vani: [],
        allegati: [],
        creato: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
        aggiornato: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      };
      setCantieri(cs => [nuovaLocal, ...cs]);

      // 6) Reset form e naviga alla commessa con rilievo R1 selezionato
      setNewCM(c => ({ ...c, tipo: "nuova", cliente: "", cognome: "", indirizzo: "", telefono: "", email: "", note: "", difficoltaSalita: "", mezzoSalita: "", pianoEdificio: "", foroScale: "" }));
      setShowModal(null);
      setSelectedCM(nuovaLocal);
      if (rilievoCreato && setSelectedRilievo) {
        setSelectedRilievo({
          id: rilievoCreato.id,
          n: 1,
          numero: 1,
          nome: "Rilievo iniziale",
          tipo: "rilievo",
          data: oggi,
          completato: false,
          vani: [],
        });
      }
      setTab("commesse");
    } catch (e: any) {
      console.error("[addCommessa] eccezione:", e);
      alert("Errore: " + (e?.message || "sconosciuto"));
    }
  };

    if (!showModal) return null;
    return (
      <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowModal(null)}>
        <div style={S.modalInner}>
          {/* TASK MODAL */}
          {/* === MODAL MANDA MAIL === */}
          {showMailModal && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
              onClick={e => e.target === e.currentTarget && setShowMailModal(null)}>
              <div style={{ background:T.bg, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"85vh", overflow:"auto", paddingBottom:24 }}>
                {/* Header */}
                <div style={{ padding:"16px 16px 10px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, background:T.bg, zIndex:1, borderBottom:`1px solid ${T.bdr}` }}>
                  <span style={{ fontSize:22 }}>✉️</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text }}>Manda Mail</div>
                    <div style={{ fontSize:11, color:T.sub }}>
                      {showMailModal.cm ? `${showMailModal.cm.cliente} ${showMailModal.cm.cognome||""}`.trim() : showMailModal.ev.persona || "Cliente"}
                      {showMailModal.cm?.email ? ` · ${showMailModal.cm.email}` : ""}
                    </div>
                  </div>
                  <div onClick={() => setShowMailModal(null)} style={{ width:30, height:30, borderRadius:"50%", background:T.bdr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:T.sub }}>×</div>
                </div>

                <div style={{ padding:"14px 16px" }}>
                  {/* Info evento */}
                  <div style={{ background:T.accLt, borderRadius:10, padding:"10px 12px", marginBottom:12, borderLeft:`3px solid ${T.acc}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.acc, marginBottom:2 }}>{showMailModal.ev.text}</div>
                    <div style={{ fontSize:11, color:T.sub }}>
                      {new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"short", day:"numeric", month:"short" })}
                      {showMailModal.ev.time ? " · " + showMailModal.ev.time : ""}
                      {showMailModal.ev.addr ? " · 📍 " + showMailModal.ev.addr : ""}
                    </div>
                  </div>

                  {/* Campo email destinatario */}
                  {!showMailModal.cm?.email && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Email destinatario</div>
                      <input
                        type="email" placeholder="cliente@email.com"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.card, fontSize:13, color:T.text, fontFamily:"inherit", boxSizing:"border-box" as any }}
                        onChange={e => {
                          const v = e.target.value;
                          setShowMailModal(prev => prev ? { ...prev, emailOverride: v } : prev);
                        }}
                      />
                    </div>
                  )}

                  {/* Testo mail modificabile */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Testo della mail</div>
                    <textarea
                      value={mailBody}
                      onChange={e => setMailBody(e.target.value)}
                      rows={10}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.card, fontSize:12, color:T.text, fontFamily:"inherit", resize:"vertical" as any, boxSizing:"border-box" as any, lineHeight:1.6 }}
                    />
                  </div>

                  {/* Template rapidi */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Template rapidi</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[
                        { lbl:"📅 Conferma", tpl: `Gentile Cliente,

Le confermo l'appuntamento del ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " alle " + showMailModal.ev.time : ""}.

📍 ${showMailModal.ev.addr || "Luogo da concordare"}

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"⏰ Reminder", tpl: `Gentile Cliente,

Le ricordiamo che domani, ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " alle " + showMailModal.ev.time : ""}, è previsto il nostro appuntamento.

📍 ${showMailModal.ev.addr || "Luogo da concordare"}

In caso di impedimento la preghiamo di avvertirci il prima possibile.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"✅ Preventivo pronto", tpl: `Gentile Cliente,

Siamo lieti di comunicarle che il preventivo relativo alla fornitura e posa è pronto.

Può contattarci per concordare un incontro o richiedere il documento via mail.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"🔧 Posa confermata", tpl: `Gentile Cliente,

Confermiamo la data di posa in opera per il ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " a partire dalle " + showMailModal.ev.time : ""}.

La preghiamo di assicurarsi che i locali siano accessibili.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                      ].map(({ lbl, tpl }) => (
                        <div key={lbl} onClick={() => setMailBody(tpl)}
                          style={{ padding:"5px 10px", borderRadius:20, border:`1px solid ${T.bdr}`, background:T.card, fontSize:11, fontWeight:600, color:T.text, cursor:"pointer" }}>
                          {lbl}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottoni azione */}
                  <div style={{ display:"flex", gap:8 }}>
                    <div
                      onClick={() => {
                        const dest = (showMailModal as any).emailOverride || showMailModal.cm?.email || "";
                        const sogg = encodeURIComponent(`Appuntamento - ${showMailModal.ev.text}`);
                        const corpo = encodeURIComponent(mailBody);
                        window.open(`mailto:${dest}?subject=${sogg}&body=${corpo}`);
                      }}
                      style={{ flex:1, padding:"12px", borderRadius:10, background:T.acc, color:"#fff", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                      ✉️ Apri in Mail
                    </div>
                    <div
                      onClick={() => {
                        navigator.clipboard?.writeText(mailBody);
                        alert("Testo copiato negli appunti!");
                      }}
                      style={{ padding:"12px 14px", borderRadius:10, background:T.bg, border:`1px solid ${T.bdr}`, color:T.sub, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      📋 Copia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showModal === "task" && (
            <>
              <div style={S.modalTitle}>Nuovo task</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Cosa devi fare?</label>
                <input style={S.input} placeholder="es. Sopralluogo, chiamare fornitore..." value={newTask.text} onChange={e => setNewTask(t => ({ ...t, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Data</label>
                  <input style={S.input} type="date" value={newTask.date} onChange={e => setNewTask(t => ({ ...t, date: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Ora (opz.)</label>
                  <input style={S.input} type="time" value={newTask.time} onChange={e => setNewTask(t => ({ ...t, time: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Priorità</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "alta", l: "Urgente", c: T.red }, { id: "media", l: "Normale", c: T.orange }, { id: "bassa", l: "Bassa", c: T.sub }].map(p => (
                    <div key={p.id} onClick={() => setNewTask(t => ({ ...t, priority: p.id }))} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${newTask.priority === p.id ? p.c : T.bdr}`, background: newTask.priority === p.id ? p.c + "18" : "transparent", color: p.c, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {p.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa (opzionale)</label>
                <select style={S.select} value={newTask.cm} onChange={e => setNewTask(t => ({ ...t, cm: e.target.value }))}>
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona (opzionale)</label>
                <select style={S.select} value={newTask.persona} onChange={e => setNewTask(t => ({ ...t, persona: e.target.value }))}>
                  <option value="">— Nessuno —</option>
                  {[...contatti.filter(ct => ct.tipo === "cliente"), ...team].map(m => <option key={m.id} value={m.nome}>{m.nome}{(m as any).ruolo ? " — " + (m as any).ruolo : ""}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Note (opzionale)</label>
                <input style={S.input} placeholder="Dettagli, materiale da portare..." value={newTask.meta} onChange={e => setNewTask(t => ({ ...t, meta: e.target.value }))} />
              </div>
              {/* Task Allegati */}
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Allegati</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { ico: "📎", l: "File", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "file", nome: "Allegato_" + (a.length + 1) }]) },
                    { ico: "📝", l: "Nota", act: () => { let txt; try{txt=window.prompt("Nota:");}catch(e){} if (txt) setTaskAllegati(a => [...a, { id: Date.now(), tipo: "nota", nome: txt }]); }},
                    { ico: "🎤", l: "Audio", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "vocale", nome: "Audio " + (a.length + 1) }]) },
                    { ico: "📷", l: "Foto", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "foto", nome: "Foto " + (a.length + 1) }]) },
                  ].map((b, i) => (
                    <div key={i} onClick={b.act} style={{ flex: 1, padding: "8px 4px", background: T.bg, borderRadius: 8, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 16 }}>{b.ico}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.sub, marginTop: 1 }}>{b.l}</div>
                    </div>
                  ))}
                </div>
                {taskAllegati.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {taskAllegati.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 10 }}>
                        <span>{a.tipo === "nota" ? "📝" : a.tipo === "vocale" ? "🎤" : a.tipo === "foto" ? "📷" : "📎"}</span>
                        <span style={{ color: T.text, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</span>
                        <span onClick={() => setTaskAllegati(al => al.filter(x => x.id !== a.id))} style={{ cursor: "pointer", color: T.red }}>✕</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button style={S.btn} onClick={addTask}>Crea task</button>
              <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
            </>
          )}

          {/* COMMESSA MODAL */}
          {showModal === "contatto" && (
            <div style={{ padding: "20px 0" }}>
              <div style={S.modalTitle}>Nuovo cliente</div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Nome *</label>
                <input style={S.input} placeholder="Nome" value={(newCM as any)._ctNome || ""} onChange={e => setNewCM(p => ({ ...p, _ctNome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Cognome</label>
                <input style={S.input} placeholder="Cognome" value={(newCM as any)._ctCognome || ""} onChange={e => setNewCM(p => ({ ...p, _ctCognome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Telefono</label>
                <input style={S.input} type="tel" placeholder="333 1234567" value={(newCM as any)._ctTel || ""} onChange={e => setNewCM(p => ({ ...p, _ctTel: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Email</label>
                <input style={S.input} type="email" placeholder="nome@email.it" value={(newCM as any)._ctEmail || ""} onChange={e => setNewCM(p => ({ ...p, _ctEmail: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Indirizzo</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza" value={(newCM as any)._ctAddr || ""} onChange={e => setNewCM(p => ({ ...p, _ctAddr: e.target.value } as any))} /></div>
              <div onClick={() => {
                const nome = ((newCM as any)._ctNome || "").trim();
                if (!nome) return;
                setContatti(prev => [...prev, { id: "CT-" + Date.now(), nome, cognome: (newCM as any)._ctCognome || "", tipo: "cliente", telefono: (newCM as any)._ctTel || "", email: (newCM as any)._ctEmail || "", indirizzo: (newCM as any)._ctAddr || "", preferito: false }]);
                setNewCM({ cliente: "", indirizzo: "", telefono: "", sistema: "", tipo: "nuova" });
                setShowModal(null);
              }} style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${T.acc}, #b86e06)`, color: "#fff", textAlign: "center", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Salva cliente ✓
              </div>
            </div>
          )}

          {showModal === "commessa" && (
            <>
              <div style={S.modalTitle}>Nuova commessa</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[{ id: "nuova", l: "🆕 Nuova installazione", c: T.acc }, { id: "riparazione", l: "🔧 Riparazione", c: T.orange }].map(t => (
                  <div key={t.id} onClick={() => { setNewCM(c => ({ ...c, tipo: t.id })); setRipSearch(""); setRipCMSel(null); setRipProblema(""); setRipFotos([]); setRipUrgenza("media"); }}
                    style={{ flex: 1, padding: "12px 6px", borderRadius: 12, border: `2px solid ${newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange) : T.bdr}`, background: newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange)+"12" : T.card, textAlign: "center", cursor: "pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange) : T.sub }}>{t.l}</div>
                  </div>
                ))}
              </div>

              {/* == FLUSSO RIPARAZIONE == */}
              {newCM.tipo === "riparazione" && (() => {
                const addRipFoto = (e) => {
                  const file = e.target.files?.[0]; if(!file) return;
                  const r = new FileReader();
                  r.onload = ev => setRipFotos(fs => [...fs, { id: Date.now(), dataUrl: ev.target.result, nome: file.name }]);
                  r.readAsDataURL(file); e.target.value = "";
                };
                const cmResults = ripSearch.length > 1
                  ? cantieri.filter(c => c.cliente.toLowerCase().includes(ripSearch.toLowerCase()) || c.code.toLowerCase().includes(ripSearch.toLowerCase()) || c.indirizzo.toLowerCase().includes(ripSearch.toLowerCase()))
                  : [];
                const addRiparazione = () => {
                  if (!ripProblema.trim()) return;
                  const code = "CM-" + String(cantieri.length + 1).padStart(4, "0");
                  const nuova = {
                    id: Date.now(), code,
                    cliente: ripCMSel ? ripCMSel.cliente : (newCM.cliente || ripSearch),
                    indirizzo: newCM.indirizzo || ripCMSel?.indirizzo || "",
                    telefono: newCM.telefono || ripCMSel?.telefono || "",
                    sistema: ripCMSel?.sistema || "",
                    tipo: "riparazione", fase: "sopralluogo",
                    cmCollegata: ripCMSel?.code || null,
                    problema: ripProblema,
                    tipoProblema: newCM.tipoProblema || "",
                    tipoInfisso: newCM.tipoInfisso || "",
                    vanoProblema: newCM.vanoProblema || "",
                    dataRichiesta: newCM.dataRichiesta || "",
                    chiSegnala: newCM.chiSegnala || "",
                    preventivoStimato: newCM.preventivoStimato || "",
                    urgenza: ripUrgenza,
                    fotoProblema: ripFotos,
                    vani: ripCMSel?.vani || [], note: ripProblema,
                    alert: ripUrgenza === "urgente" ? "⚠️ Riparazione urgente" : null,
                    creato: new Date().toLocaleDateString("it-IT", {day:"numeric",month:"short"}),
                    aggiornato: new Date().toLocaleDateString("it-IT", {day:"numeric",month:"short"}),
                    allegati: [],
                  };
                  setCantieri(cs => [nuova, ...cs]);
                  setRipSearch(""); setRipCMSel(null); setRipProblema(""); setRipFotos([]); setRipUrgenza("media");
                  setNewCM(c => ({...c, tipo:"nuova", cliente:"", indirizzo:"", telefono:"", tipoProblema:"", tipoInfisso:"", vanoProblema:"", dataRichiesta:"", chiSegnala:"", preventivoStimato:""}));
                  setShowModal(null);
                  setSelectedCM(nuova); setTab("commesse");
                };
                return (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                    <div>
                      <label style={S.fieldLabel}>Cliente o commessa esistente</label>
                      <input style={S.input} placeholder="Cerca nome, codice CM, indirizzo…"
                        value={ripSearch} onChange={e => { setRipSearch(e.target.value); if(ripCMSel) setRipCMSel(null); }}/>
                      {cmResults.length > 0 && !ripCMSel && (
                        <div style={{ marginTop:4, background:T.card, border:`1px solid ${T.bdr}`, borderRadius:10, overflow:"hidden" }}>
                          {cmResults.slice(0,4).map(c => (
                            <div key={c.id} onClick={() => { setRipCMSel(c); setRipSearch(c.cliente); setNewCM(x=>({...x,indirizzo:c.indirizzo,telefono:c.telefono})); }}
                              style={{ padding:"10px 14px", borderBottom:`1px solid ${T.bg}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <div>
                                <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{c.cliente}</div>
                                <div style={{ fontSize:11, color:T.sub, marginTop:1 }}>{c.code} · {c.indirizzo}</div>
                                {getVaniAttivi(c).length>0 && <div style={{ fontSize:10, color:T.sub }}>{getVaniAttivi(c).length} vani</div>}
                              </div>
                              <div style={{ fontSize:10, fontWeight:600, color:T.acc }}>Collega →</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {ripCMSel && (
                        <div style={{ marginTop:6, padding:"8px 12px", background:T.accLt, border:`1px solid ${T.acc}30`, borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700, color:T.acc }}>✓ Collegata a {ripCMSel.code}</div>
                            <div style={{ fontSize:11, color:T.sub, marginTop:1 }}>{ripCMSel.cliente} · {ripCMSel.indirizzo}</div>
                          </div>
                          <div onClick={() => { setRipCMSel(null); setRipSearch(""); setNewCM(x=>({...x,indirizzo:"",telefono:""})); }} style={{ fontSize:14, color:T.sub, cursor:"pointer", padding:4 }}>✕</div>
                        </div>
                      )}
                      {!ripCMSel && (
                        <div style={{ fontSize:10, color:T.sub, marginTop:3 }}>Lascia vuoto per cliente nuovo</div>
                      )}
                    </div>

                    {!ripCMSel && (
                      <div style={{ padding:"12px", background:T.bg, borderRadius:10, border:`1px solid ${T.bdr}`, display:"flex", flexDirection:"column", gap:8 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.06em" }}>Dati cliente nuovo</div>
                        <input style={S.input} placeholder="Nome e cognome" value={newCM.cliente} onChange={e=>setNewCM(c=>({...c,cliente:e.target.value}))}/>
                        <div style={{ display:"flex", gap:8 }}>
                          <input style={{...S.input,flex:2}} placeholder="Indirizzo" value={newCM.indirizzo} onChange={e=>setNewCM(c=>({...c,indirizzo:e.target.value}))}/>
                          <input style={{...S.input,flex:1}} placeholder="Telefono" value={newCM.telefono} onChange={e=>setNewCM(c=>({...c,telefono:e.target.value}))}/>
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={S.fieldLabel}>Urgenza</label>
                      <div style={{ display:"flex", gap:6 }}>
                        {[{id:"normale",l:"Normale",c:T.grn,e:"🟢"},{id:"media",l:"Media",c:T.orange,e:"🟡"},{id:"urgente",l:"Urgente",c:T.red,e:"🔴"}].map(u => (
                          <div key={u.id} onClick={() => setRipUrgenza(u.id)}
                            style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1.5px solid ${ripUrgenza===u.id?u.c:T.bdr}`, background:ripUrgenza===u.id?u.c+"15":T.card, textAlign:"center", cursor:"pointer", transition:"all 0.12s" }}>
                            <div style={{ fontSize:14 }}>{u.e}</div>
                            <div style={{ fontSize:10, fontWeight:700, color:ripUrgenza===u.id?u.c:T.sub, marginTop:2 }}>{u.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Tipo problema</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {["Vetro rotto","Cardine","Guarnizione","Serratura","Maniglia","Tapparella","Infiltrazioni","Deformazione","Altro"].map(t => (
                          <div key={t} onClick={() => setNewCM(c=>({...c,tipoProblema:c.tipoProblema===t?"":t}))}
                            style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.tipoProblema===t?T.orange:T.bdr}`, background:newCM.tipoProblema===t?T.orangeLt:T.card, fontSize:11, fontWeight:600, color:newCM.tipoProblema===t?T.orange:T.sub, cursor:"pointer", transition:"all 0.12s" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Tipo infisso</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {["Finestra","Porta","Portafinestra","Scorrevole","Tapparella","Persiana","Zanzariera","Altro"].map(t => (
                          <div key={t} onClick={() => setNewCM(c=>({...c,tipoInfisso:c.tipoInfisso===t?"":t}))}
                            style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.tipoInfisso===t?T.acc:T.bdr}`, background:newCM.tipoInfisso===t?T.accLt:T.card, fontSize:11, fontWeight:600, color:newCM.tipoInfisso===t?T.acc:T.sub, cursor:"pointer", transition:"all 0.12s" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    {ripCMSel && getVaniAttivi(ripCMSel).length > 0 && (
                      <div>
                        <label style={S.fieldLabel}>Vano con il problema</label>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {getVaniAttivi(ripCMSel).map(v => (
                            <div key={v.id} onClick={() => setNewCM(c=>({...c,vanoProblema:c.vanoProblema===v.nome?"":v.nome}))}
                              style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.vanoProblema===v.nome?T.acc:T.bdr}`, background:newCM.vanoProblema===v.nome?T.accLt:T.card, fontSize:11, fontWeight:600, color:newCM.vanoProblema===v.nome?T.acc:T.sub, cursor:"pointer" }}>
                              {v.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={S.fieldLabel}>Descrizione problema *</label>
                      <textarea style={{ ...S.input, minHeight:70, resize:"vertical" }}
                        placeholder="Descrivi il problema in dettaglio…"
                        value={ripProblema} onChange={e => setRipProblema(e.target.value)}/>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Chi segnala</label>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                        {["Cliente","Posatore","Tecnico","Subappaltatore","Altro"].map(t => (
                          <div key={t} onClick={() => setNewCM(c=>({...c,chiSegnala:c.chiSegnala===t?"":t}))}
                            style={{ padding:"5px 10px", borderRadius:20, border:`1.5px solid ${newCM.chiSegnala===t?T.acc:T.bdr}`, background:newCM.chiSegnala===t?T.accLt:T.card, fontSize:11, fontWeight:600, color:newCM.chiSegnala===t?T.acc:T.sub, cursor:"pointer" }}>
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Data richiesta intervento</label>
                      <input type="date" style={S.input} value={newCM.dataRichiesta} onChange={e=>setNewCM(c=>({...c,dataRichiesta:e.target.value}))}/>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Preventivo stimato (€)</label>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="es. 250" value={newCM.preventivoStimato} onChange={e=>setNewCM(c=>({...c,preventivoStimato:e.target.value}))}/>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Foto del problema ({ripFotos.length})</label>
                      {ripFotos.length === 0
                        ? <div onClick={() => ripFotoRef.current?.click()}
                            style={{ border:`1.5px dashed ${T.bdr}`, borderRadius:10, padding:"20px", textAlign:"center", cursor:"pointer" }}>
                            <div style={{ fontSize:28, marginBottom:4 }}>📷</div>
                            <div style={{ fontSize:12, color:T.sub }}>Scatta o allega una foto</div>
                            <div style={{ fontSize:10, color:T.sub2||T.sub, marginTop:2 }}>Puoi aggiungerne quante vuoi</div>
                          </div>
                        : <div>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                              {ripFotos.map((f,i) => (
                                <div key={f.id} style={{ position:"relative", width:76, height:76, borderRadius:10, overflow:"hidden", background:T.bg }}>
                                  <img src={f.dataUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={`Foto ${i+1}`}/>
                                  <div onClick={() => setRipFotos(fs => fs.filter(x => x.id !== f.id))}
                                    style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontWeight:700 }}>✕</div>
                                  <div style={{ position:"absolute", bottom:2, left:4, fontSize:9, color:"#fff", fontWeight:700, textShadow:"0 1px 2px rgba(0,0,0,0.7)" }}>#{i+1}</div>
                                </div>
                              ))}
                              {/* FIX: usa ref invece di getElementById */}
                              <div onClick={() => ripFotoRef.current?.click()}
                                style={{ width:76, height:76, borderRadius:10, border:`1.5px dashed ${T.bdr}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", color:T.sub }}>
                                <div style={{ fontSize:22 }}>+</div>
                                <div style={{ fontSize:9, fontWeight:600 }}>Aggiungi</div>
                              </div>
                            </div>
                          </div>
                      }
                      <input ref={ripFotoRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={addRipFoto}/>
                    </div>

                    <div style={{ paddingTop:4 }}>
                      {!ripProblema.trim() && (
                        <div style={{ fontSize:11, color:T.orange, fontWeight:600, marginBottom:8, textAlign:"center" }}>⚠️ Descrivi il problema per procedere</div>
                      )}
                      <button style={{ ...S.btn, background:ripProblema.trim()?T.orange:"#ccc", cursor:ripProblema.trim()?"pointer":"not-allowed" }}
                        onClick={addRiparazione} disabled={!ripProblema.trim()}>
                        🔧 Crea riparazione
                      </button>
                      <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
                    </div>

                  </div>
                );
              })()}

              {/* == FLUSSO NUOVA INSTALLAZIONE == */}
              {newCM.tipo === "nuova" && (() => {
                const AccordionSection = ({ id, icon, label, badge, children }) => {
                  const open = newCM._open === id;
                  return (
                    <div style={{ marginBottom:8, borderRadius:10, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
                      <div onClick={() => setNewCM(c=>({...c,_open:open?null:id}))}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", background:T.card, cursor:"pointer" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{icon}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{label}</span>
                          {badge && <span style={{ ...S.badge(T.accLt,T.acc), fontSize:10 }}>{badge}</span>}
                        </div>
                        <span style={{ fontSize:12, color:T.sub, transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(180deg)":"rotate(0deg)" }}>▼</span>
                      </div>
                      {open && <div style={{ padding:"12px 14px", background:T.bg, borderTop:`1px solid ${T.bdr}` }}>{children}</div>}
                    </div>
                  );
                };

                const previewCode = "S-" + String(cantieri.length + 1).padStart(4,"0");

                return (
                  <>
                    <div style={{ marginBottom:14, padding:"8px 12px", background:T.bg, borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:T.sub }}>Numero commessa:</span>
                      <span style={{ fontSize:13, fontWeight:800, color:T.acc, fontFamily:FM }}>{previewCode}</span>
                      <span style={{ fontSize:10, color:T.sub }}>(assegnato automaticamente)</span>
                    </div>

                    <div style={{ marginBottom:14, padding:"14px", background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}` }}>
                      <div style={{ fontSize:10, fontWeight:800, color:T.sub, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>👤 Dati cliente *</div>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <input style={{...S.input,flex:1}} placeholder="Nome" value={newCM.cliente} onChange={e=>setNewCM(c=>({...c,cliente:e.target.value}))}/>
                        <input style={{...S.input,flex:1}} placeholder="Cognome" value={newCM.cognome||""} onChange={e=>setNewCM(c=>({...c,cognome:e.target.value}))}/>
                      </div>
                      <input style={{...S.input,marginBottom:8}} placeholder="Indirizzo lavori (Via, CAP, Città)" value={newCM.indirizzo} onChange={e=>setNewCM(c=>({...c,indirizzo:e.target.value}))}/>
                      <div style={{ display:"flex", gap:8 }}>
                        <input style={{...S.input,flex:1}} placeholder="Telefono" inputMode="tel" value={newCM.telefono} onChange={e=>setNewCM(c=>({...c,telefono:e.target.value}))}/>
                        <input style={{...S.input,flex:1}} placeholder="Email" inputMode="email" value={newCM.email||""} onChange={e=>setNewCM(c=>({...c,email:e.target.value}))}/>
                      </div>
                    </div>

                    <AccordionSection id="accesso" icon="🏗" label="Accesso / Difficoltà salita"
                      badge={newCM.difficoltaSalita||null}>
                      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                        {[{id:"facile",l:"Facile",c:T.grn,e:"✅"},{id:"media",l:"Media",c:T.orange,e:"⚠️"},{id:"difficile",l:"Difficile",c:T.red,e:"🔴"}].map(d => (
                          <div key={d.id} onClick={()=>setNewCM(c=>({...c,difficoltaSalita:d.id}))}
                            style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1.5px solid ${newCM.difficoltaSalita===d.id?d.c:T.bdr}`, background:newCM.difficoltaSalita===d.id?d.c+"15":T.card, textAlign:"center", cursor:"pointer" }}>
                            <div style={{ fontSize:14 }}>{d.e}</div>
                            <div style={{ fontSize:10, fontWeight:600, color:newCM.difficoltaSalita===d.id?d.c:T.sub }}>{d.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Piano edificio</div>
                          <select style={S.select} value={newCM.pianoEdificio} onChange={e=>setNewCM(c=>({...c,pianoEdificio:e.target.value}))}>
                            <option value="">— Seleziona —</option>
                            {["S2 — 2° Seminterrato","S1 — Seminterrato","PT — Piano Terra","P1 — 1° Piano","P2 — 2° Piano","P3 — 3° Piano","P4 — 4° Piano","P5 — 5° Piano","P6 — 6° Piano","P7 — 7° Piano","P8 — 8° Piano","P9 — 9° Piano","P10 — 10° Piano","P11 — 11° Piano","P12 — 12° Piano","P13 — 13° Piano","P14 — 14° Piano","P15 — 15° Piano","P16 — 16° Piano","P17 — 17° Piano","P18 — 18° Piano","P19 — 19° Piano","P20 — 20° Piano","M — Mansarda"].map(p=><option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Foro scale (cm)</div>
                          <input style={S.input} placeholder="es. 80×200" value={newCM.foroScale} onChange={e=>setNewCM(c=>({...c,foroScale:e.target.value}))}/>
                        </div>
                      </div>
                      <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Mezzo di salita</div>
                      <select style={S.select} value={newCM.mezzoSalita} onChange={e=>setNewCM(c=>({...c,mezzoSalita:e.target.value}))}>
                        <option value="">— Seleziona —</option>
                        {mezziSalita.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </AccordionSection>

                    <AccordionSection id="note" icon="📝" label="Note aggiuntive"
                      badge={newCM.note ? "✓" : null}>
                      <textarea style={{...S.input,minHeight:70,resize:"vertical"}}
                        placeholder="Note aggiuntive sulla commessa…"
                        defaultValue={newCM.note} onBlur={e=>setNewCM(c=>({...c,note:e.target.value}))}/>
                    </AccordionSection>

                    <div style={{ marginTop:6 }}>
                      {!newCM.cliente.trim() && (
                        <div style={{ fontSize:11, color:T.sub, textAlign:"center", marginBottom:8 }}>Inserisci almeno il nome per procedere</div>
                      )}
                      <button style={{ ...S.btn, background:newCM.cliente.trim()?T.acc:"#ccc", cursor:newCM.cliente.trim()?"pointer":"not-allowed" }}
                        onClick={addCommessa} disabled={!newCM.cliente.trim()}>
                        ✓ Crea commessa {previewCode}
                      </button>
                      <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    );
}
