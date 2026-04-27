// â•â•â• MASTRO ERP â€” TabSettings (Phase B extraction) â•â•â•
import { useMastro } from "../../MastroContext";

export default function TabSettings() {
  const ctx = useMastro();
  const [expandedPipelinePhase, setExpandedPipelinePhase] = React.useState(null);
  const [pipelinePhaseTab, setPipelinePhaseTab] = React.useState("email");
  const {
    theme, setTheme, T, S, tab, setSubPlan, plan, activePlan, trialDaysLeft,
    cantieri, tasks, problemi, team,
    coloriDB, sistemiDB, setSistemiDB, vetriDB, coprifiliDB, lamiereDB,
    libreriaDB, setLibreriaDB, telaiPersianaDB, setTelaiPersianaDB,
    posPersianaDB, setPosPersianaDB, tipoMisuraDB, setTipoMisuraDB,
    tipoMisuraTappDB, setTipoMisuraTappDB, tipoMisuraZanzDB, setTipoMisuraZanzDB,
    tipoCassonettoDB, setTipoCassonettoDB, ctProfDB, setCtProfDB,
    ctSezioniDB, setCtSezioniDB, ctCieliniDB, setCtCieliniDB, ctOffset, setCtOffset,
    pipelineDB, setPipelineDB, sogliaDays, setSogliaDays, favTipologie, setFavTipologie,
    fattureDB, setFattureDB, squadreDB, setSquadreDB, montaggiDB,
    settoriAttivi, setSettoriAttivi, settingsTab, setSettingsTab, setTutoStep,
    aziendaInfo, setAziendaInfo, events, setSettingsModal,
    importStatus, importLog, setSettingsForm, contatti, mezziSalita, setMezziSalita,
    Ico, SectionHead, addSettingsItem, delSettingsItem, exportCSV, importCSV,
    isTablet, isDesktop,
  } = ctx;

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={S.header}>
        <div style={{ flex: 1 }}>
          <div style={S.headerTitle}>Impostazioni</div>
        </div>
        {/* FIX: rimosso supabase.auth.signOut() â€” usa localStorage clear */}
        <div onClick={async () => { try { localStorage.clear(); const { createClient } = await import("@/lib/supabase"); await createClient().auth.signOut(); } catch(e) {} window.location.href = "/login"; }}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid #e5e5ea",background:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",color:"#86868b"}}>
          Esci
        </div>
      </div>

      {/* Settings sub-tabs â€” scrollable */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "8px 16px 12px", borderRadius: 8, border: `1px solid ${T.bdr}` }}>
        <div style={{ display: "flex", minWidth: "max-content" }}>
          {[{ id: "settore", l: "ðŸŽ¯ Settore" }, { id: "azienda", l: "ðŸ¢ Azienda" }, { id: "generali", l: "âš™ï¸ Generali" }, { id: "piano", l: "ðŸ’Ž Piano" }, { id: "team", l: "ðŸ‘¥ Team" }, { id: "squadre", l: "ðŸ”§ Squadre" }, { id: "fatture", l: "ðŸ’° Fatture" }, { id: "sistemi", l: "ðŸ— Sistemi" }, { id: "colori", l: "ðŸŽ¨ Colori" }, { id: "vetri", l: "ðŸªŸ Vetri" }, { id: "tipologie", l: "ðŸ“ Tipologie" }, { id: "coprifili", l: "ðŸ“ Coprifili" }, { id: "lamiere", l: "ðŸ”© Lamiere" }, { id: "controtelaio", l: "ðŸ”² Controtelaio" }, { id: "tapparella", l: "â¬‡ Tapparella" }, { id: "persiana", l: "ðŸ  Persiana" }, { id: "zanzariera", l: "ðŸ¦Ÿ Zanzariera" }, { id: "cassonetto", l: "ðŸ§Š Cassonetto" }, { id: "salita", l: "ðŸªœ Salita" }, { id: "pipeline", l: "ðŸ“Š Pipeline" }, { id: "libreria", l: "ðŸ“¦ Libreria" }, { id: "importa", l: "ðŸ“¥ Importa" }, { id: "guida", l: "ðŸ“– Guida" }].map(t => (
            <div key={t.id} onClick={() => setSettingsTab(t.id)} style={{ padding: "8px 12px", textAlign: "center", fontSize: 10, fontWeight: 600, background: settingsTab === t.id ? T.acc : T.card, color: settingsTab === t.id ? "#fff" : T.sub, cursor: "pointer", whiteSpace: "nowrap" }}>
              {t.l}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* === AZIENDA === */}
        {/* === SETTORE === */}
        {settingsTab === "settore" && (
          <>
            <div style={{ fontSize: 12, color: T.sub, padding: "0 4px 10px", lineHeight: 1.5 }}>Seleziona i settori in cui operi. MASTRO mostrerà solo le tipologie e funzioni rilevanti per il tuo lavoro.</div>
            {SETTORI.map(s => {
              const isOn = settoriAttivi.includes(s.id);
              const count = TIPOLOGIE_RAPIDE.filter(t => t.settore === s.id).length;
              return (
                <div key={s.id} onClick={() => {
                  setSettoriAttivi(prev => isOn ? prev.filter(x => x !== s.id) : [...prev, s.id]);
                }} style={{
                  padding: "14px 16px", borderRadius: 14, cursor: "pointer", marginBottom: 8,
                  border: `2px solid ${isOn ? "#007aff" : T.bdr}`,
                  background: isOn ? "#007aff08" : T.card,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ fontSize: 28, width: 36, textAlign: "center" }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isOn ? "#007aff" : T.text }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{s.desc}</div>
                    <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{count} tipologie disponibili</div>
                  </div>
                  <div style={{
                    width: 48, height: 28, borderRadius: 14, padding: 2,
                    background: isOn ? "#007aff" : T.bdr,
                    display: "flex", alignItems: "center", transition: "all .2s",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 12, background: "#fff",
                      transform: isOn ? "translateX(20px)" : "translateX(0px)",
                      transition: "all .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 10, border: `1px solid ${T.bdr}`, fontSize: 11, color: T.sub, lineHeight: 1.5 }}>
              <b>Settori attivi:</b> {settoriAttivi.length} · <b>Tipologie disponibili:</b> {tipologieFiltrate.length}<br />
              Le commesse esistenti con tipologie di settori disattivati resteranno visibili.
            </div>
          </>
        )}

        {settingsTab === "azienda" && (
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`}}>
            <div style={{padding:"12px 14px",background:T.acc,color:"#fff"}}>
              <div style={{fontSize:13,fontWeight:800}}>Dati Azienda</div>
              <div style={{fontSize:10,opacity:0.8,marginTop:2}}>Questi dati appaiono sul PDF del preventivo</div>
            </div>
            {/* LOGO */}
            <div style={{padding:"14px",borderBottom:`1px solid ${T.bdr}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Logo Azienda</div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{display:"none"}} onChange={e=>{
                const f=e.target.files?.[0]; if(!f) return;
                const r=new FileReader(); r.onload=ev=>setAziendaInfo(a=>({...a,logo:ev.target.result}));
                r.readAsDataURL(f); e.target.value="";
              }}/>
              {aziendaInfo.logo ? (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:80,height:60,border:`1px solid ${T.bdr}`,borderRadius:8,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9f9f9"}}>
                    <img src={aziendaInfo.logo} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} alt="logo"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:4}}>Logo caricato âœ“</div>
                    <div style={{display:"flex",gap:6}}>
                      <div onClick={()=>logoInputRef.current?.click()} style={{fontSize:11,color:T.acc,fontWeight:700,cursor:"pointer"}}>Cambia</div>
                      <span style={{color:T.bdr}}>·</span>
                      <div onClick={()=>setAziendaInfo(a=>({...a,logo:null}))} style={{fontSize:11,color:"#ff3b30",fontWeight:700,cursor:"pointer"}}>Rimuovi</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div onClick={()=>logoInputRef.current?.click()} style={{border:`2px dashed ${T.bdr}`,borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
                  <div style={{fontSize:24,marginBottom:4}}>ðŸ–¼</div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>Carica logo</div>
                  <div style={{fontSize:10,color:T.sub,marginTop:2}}>PNG, JPG, SVG · max 2MB</div>
                </div>
              )}
            </div>
            {[
              {label:"Ragione Sociale",field:"ragione",placeholder:"Es. Walter Cozza Serramenti SRL"},
              {label:"Partita IVA",field:"piva",placeholder:"Es. 01234567890"},
              {label:"Indirizzo",field:"indirizzo",placeholder:"Es. Via Roma 1, 87100 Cosenza (CS)"},
              {label:"Telefono",field:"telefono",placeholder:"Es. +39 0984 000000"},
              {label:"Email",field:"email",placeholder:"Es. info@azienda.it"},
              {label:"Sito web",field:"website",placeholder:"Es. www.azienda.it"},
              {label:"IBAN",field:"iban",placeholder:"Es. IT60 X054 2811 1010 0000 0123 456"},
              {label:"CCIAA / REA",field:"cciaa",placeholder:"Es. CS-123456"},
              {label:"PEC",field:"pec",placeholder:"Es. azienda@pec.it"},
            ].map(({label,field,placeholder})=>(
              <div key={field} style={{padding:"10px 14px",borderBottom:`1px solid ${T.bdr}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
                <input
                  value={aziendaInfo[field]||""}
                  onChange={e=>setAziendaInfo(a=>({...a,[field]:e.target.value}))}
                  placeholder={placeholder}
                  style={{width:"100%",border:"none",fontSize:13,fontWeight:600,color:T.text,background:"transparent",fontFamily:FF,outline:"none",padding:0,boxSizing:"border-box"}}
                />
              </div>
            ))}

            {/* CONDIZIONI PREVENTIVO */}
            <div style={{padding:"14px",borderTop:`2px solid ${T.acc}`,marginTop:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:16}}>ðŸ“‹</span>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:T.text}}>Condizioni Preventivo</div>
                  <div style={{fontSize:10,color:T.sub}}>Testi personalizzati stampati nel PDF. Lascia vuoto per usare i testi predefiniti.</div>
                </div>
              </div>
              {[
                {label:"Condizioni di fornitura",field:"condFornitura",placeholder:"Es. L'azienda, nell'esecuzione della produzione è garante dell'osservanza scrupolosa della regola d'arte e delle norme vigenti.",rows:3},
                {label:"Condizioni di pagamento",field:"condPagamento",placeholder:"Es. 50% acconto alla firma del contratto...\n50% a saldo, a comunicazione merce pronta...",rows:4},
                {label:"Tempi di consegna",field:"condConsegna",placeholder:"Es. PVC Battente Standard 30 gg.\nPVC Porte 35 gg.\nAlluminio 45/50 gg lavorativi.",rows:5},
                {label:"Condizioni di contratto",field:"condContratto",placeholder:"Es. Clausole contrattuali personalizzate, garanzia, trattamento dati...",rows:5},
                {label:"Dettagli tecnici / Chiusura",field:"condDettagli",placeholder:"Es. Documenti alla consegna: Dichiarazione di Prestazione, Dichiarazione energetica, Etichetta CE, Manuale d'uso e manutenzione.",rows:3},
              ].map(({label,field,placeholder,rows})=>(
                <div key={field} style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
                  <textarea
                    value={aziendaInfo[field]||""}
                    onChange={e=>setAziendaInfo(a=>({...a,[field]:e.target.value}))}
                    placeholder={placeholder}
                    rows={rows}
                    style={{width:"100%",border:`1px solid ${T.bdr}`,borderRadius:8,fontSize:11,color:T.text,background:T.card,fontFamily:FF,padding:"8px 10px",boxSizing:"border-box",resize:"vertical",lineHeight:1.5}}
                  />
                </div>
              ))}
            </div>
            <div style={{padding:"12px 14px",background:"#f0fdf4",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}>âœ…</span>
              <span style={{fontSize:11,color:"#1a9e40",fontWeight:600}}>Salvato automaticamente in ogni preventivo PDF</span>
            </div>
          </div>
        )}

        {/* === GENERALI === */}
        {settingsTab === "generali" && (
          <>
            <div style={{...S.card,marginBottom:8}}><div style={S.cardInner}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}>ðŸ”” Soglia commesse ferme</div>
                  <div style={{fontSize:11,color:T.sub}}>Alert se una commessa non avanza da N giorni</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" min="1" max="30" value={sogliaDays} onChange={e=>setSogliaDays(parseInt(e.target.value)||5)}
                    style={{width:50,padding:"5px 8px",borderRadius:8,border:`1px solid ${T.bdr}`,fontSize:14,fontWeight:700,textAlign:"center",fontFamily:FF}}/>
                  <span style={{fontSize:11,color:T.sub}}>giorni</span>
                </div>
              </div>
            </div></div>
            <div style={S.card}><div style={S.cardInner}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {aziendaInfo.logo
                  ? <img src={aziendaInfo.logo} style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",border:`1px solid ${T.bdr}`}} alt="logo"/>
                  : <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.acc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>FC</div>
                }
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Fabio Cozza</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{aziendaInfo.ragione}</div>
                </div>
              </div>
            </div></div>
            <div style={{ ...S.card, marginTop: 8 }}><div style={S.cardInner}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>TEMA</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["chiaro", "â˜€ï¸"], ["scuro", "ðŸŒ™"], ["oceano", "ðŸŒŠ"]].map(([id, ico]) => (
                  <div key={id} onClick={() => setTheme(id)} style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: `1.5px solid ${theme === id ? T.acc : T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 18 }}>{ico}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "capitalize", marginTop: 2 }}>{id}</div>
                  </div>
                ))}
              </div>
            </div></div>
            <div style={{ ...S.card, marginTop: 8 }}><div style={S.cardInner}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>STATISTICHE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.acc }}>{cantieri.length}</div>Commesse</div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{countVani()}</div>Vani</div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.grn }}>{tasks.filter(t => t.done).length}/{tasks.length}</div>Task</div>
              </div>
            </div></div>
          </>
        )}

        {/* === PIANO === */}
        {settingsTab === "piano" && (
          <>
            {/* Current plan banner */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ padding: 16, background: `linear-gradient(135deg, ${T.acc}15, ${T.acc}05)`, borderRadius: T.r }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.acc, textTransform: "uppercase" as const, letterSpacing: 1 }}>Piano attuale</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 2 }}>
                      {plan.nome} {activePlan === "trial" && <span style={{ fontSize: 12, fontWeight: 600, color: trialDaysLeft <= 3 ? T.red : T.acc }}>({trialDaysLeft}gg rimasti)</span>}
                    </div>
                  </div>
                  {plan.prezzo > 0 && <div style={{ textAlign: "right" as const }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: T.acc, fontFamily: FM }}>€{plan.prezzo}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>/mese</div>
                  </div>}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 10, color: T.sub }}>ðŸ“ {cantieri.length}/{plan.maxCommesse === 9999 ? "âˆž" : plan.maxCommesse} commesse</span>
                  <span style={{ fontSize: 10, color: T.sub }}>ðŸ‘¥ {plan.maxUtenti} utent{plan.maxUtenti > 1 ? "i" : "e"}</span>
                  <span style={{ fontSize: 10, color: T.sub }}>{plan.sync ? "âœ…" : "âŒ"} Sync</span>
                  <span style={{ fontSize: 10, color: T.sub }}>{plan.pdf ? "âœ…" : "âŒ"} PDF</span>
                </div>
              </div>
            </div>

            {/* Plan comparison */}
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, padding: "0 16px", marginBottom: 8 }}>Confronta piani</div>
            {(Object.entries(PLANS) as [string, any][]).filter(([k]) => k !== "trial" && k !== "free").map(([key, pl]) => (
              <div key={key} onClick={() => { if (key !== activePlan) setSubPlan(key); }}
                style={{ ...S.card, marginBottom: 8, border: key === activePlan ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, cursor: "pointer", position: "relative" as const, overflow: "hidden" }}>
                {key === "pro" && <div style={{ position: "absolute" as const, top: 0, right: 0, background: T.acc, color: "#fff", fontSize: 8, fontWeight: 800, padding: "3px 10px", borderBottomLeftRadius: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>Consigliato</div>}
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: key === "pro" ? T.acc : T.text }}>{pl.nome}</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: key === "pro" ? T.acc : T.text, fontFamily: FM }}>€{pl.prezzo}</span>
                      <span style={{ fontSize: 11, color: T.sub }}>/mese</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                    <div style={{ fontSize: 11, color: T.text }}>ðŸ“ {pl.maxCommesse === 9999 ? "Illimitate" : pl.maxCommesse} commesse</div>
                    <div style={{ fontSize: 11, color: T.text }}>ðŸ‘¥ {pl.maxUtenti} utent{pl.maxUtenti > 1 ? "i" : "e"}</div>
                    <div style={{ fontSize: 11, color: pl.sync ? T.grn : T.sub }}>{pl.sync ? "âœ…" : "âŒ"} Sync real-time</div>
                    <div style={{ fontSize: 11, color: pl.pdf ? T.grn : T.sub }}>{pl.pdf ? "âœ…" : "âŒ"} PDF rilievo</div>
                    <div style={{ fontSize: 11, color: pl.admin ? T.grn : T.sub }}>{pl.admin ? "âœ…" : "âŒ"} Pannello admin</div>
                    <div style={{ fontSize: 11, color: pl.api ? T.grn : T.sub }}>{pl.api ? "âœ…" : "âŒ"} API</div>
                    <div style={{ fontSize: 11, color: T.text }}>ðŸ“‚ {pl.maxCataloghi === 99 ? "Illimitati" : pl.maxCataloghi} catalog{pl.maxCataloghi > 1 ? "hi" : "o"}</div>
                  </div>
                  {key === activePlan ? (
                    <div style={{ marginTop: 10, padding: "8px 0", textAlign: "center" as const, borderRadius: 8, background: T.acc + "15", fontSize: 12, fontWeight: 700, color: T.acc }}>âœ“ Piano attivo</div>
                  ) : (
                    <div style={{ marginTop: 10, padding: "8px 0", textAlign: "center" as const, borderRadius: 8, background: T.acc, fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {pl.prezzo > (plan.prezzo || 0) ? `Passa a ${pl.nome} â€” €${pl.prezzo}/mese` : `Passa a ${pl.nome}`}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Free plan note */}
            <div style={{ padding: "8px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.sub, textAlign: "center" as const }}>
                Il piano Free include 5 commesse e funzionalità base. I pagamenti saranno attivati al lancio ufficiale.
              </div>
            </div>
          </>
        )}

        {/* === TEAM === */}
        {settingsTab === "team" && (
          <>
            {team.map(m => (
              <div key={m.id} style={{ ...S.card, marginBottom: 8 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.colore, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.nome.split(" ").map(n => n[0]).join("")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{m.ruolo} â€” {m.compiti}</div>
                </div>
                <Ico d={ICO.pen} s={14} c={T.sub} />
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("membro"); setSettingsForm({ nome: "", ruolo: "Posatore", compiti: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.bdr}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi membro</div>
          </>
        )}

        {/* === SISTEMI E SOTTOSISTEMI === */}
        {settingsTab === "sistemi" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Configura marche, sistemi e sottosistemi con colori collegati</div>
            {sistemiDB.map(s => (
              <div key={s.id} style={{ ...S.card, marginBottom: 8 }}><div style={S.cardInner}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.acc }}>{s.marca}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.sistema}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: T.sub }}>€/mq</span>
                      <input type="number" defaultValue={s.euroMq || ""} onBlur={e => setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, euroMq: parseFloat(e.target.value)||0, prezzoMq: parseFloat(e.target.value)||0 } : x))} style={{ width: 60, padding: "3px 6px", borderRadius: 4, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, color: T.grn, textAlign: "right", fontFamily: FM }} />
                    </div>
                    <div style={{ fontSize: 9, color: T.sub }}>+{s.sovRAL}% RAL · +{s.sovLegno}% Legno</div>
                    {s.griglia?.length > 0 && <div style={{ fontSize: 9, color: T.acc, fontWeight: 600, marginTop: 2 }}>ðŸ“Š Griglia {s.griglia.length} prezzi</div>}
                  </div>
                </div>
                {/* Profile image upload */}
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 4 }}>Sezione profilo (per preventivo PDF)</div>
                  {s.immagineProfilo ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={s.immagineProfilo} style={{ height: 48, maxWidth: 120, objectFit: "contain", borderRadius: 4, background: "#fff", border: `1px solid ${T.bdr}` }} alt="profilo" />
                      <div onClick={() => setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, immagineProfilo: undefined } : x))} style={{ fontSize: 10, color: T.red, cursor: "pointer", fontWeight: 600 }}>âœ• Rimuovi</div>
                    </div>
                  ) : (
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: T.acc + "15", color: T.acc, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      ðŸ“· Carica PNG
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => { setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, immagineProfilo: ev.target?.result as string } : x)); };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  )}
                </div>
                {/* Griglia prezzi */}
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Griglia prezzi LÃ—H {s.griglia?.length > 0 ? `(${s.griglia.length})` : ""}</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <label style={{ padding: "3px 8px", borderRadius: 4, background: T.acc + "15", color: T.acc, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>
                        ðŸ“„ Carica CSV
                        <input type="file" accept=".csv,.txt,.xlsx" style={{ display: "none" }} onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const text = ev.target?.result as string;
                            const lines = text.split(/\r?\n/).filter(l => l.trim());
                            const newGrid: any[] = [];
                            lines.forEach(line => {
                              const parts = line.split(/[,;\t]/).map(p => p.trim().replace(",","."));
                              if (parts.length >= 3) {
                                const l = parseInt(parts[0]); const h = parseInt(parts[1]); const p = parseFloat(parts[2]);
                                if (l > 0 && h > 0 && p > 0) newGrid.push({ l, h, prezzo: p });
                              }
                            });
                            if (newGrid.length > 0) {
                              setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: newGrid } : x));
                              alert(`âœ… ${newGrid.length} prezzi importati!`);
                            } else {
                              alert("âš ï¸ Nessun prezzo trovato. Formato: L;H;Prezzo (una riga per combinazione)");
                            }
                          };
                          reader.readAsText(file);
                        }} />
                      </label>
                      <div onClick={() => {
                        const l = prompt("Larghezza (mm):", "1000");
                        const h = prompt("Altezza (mm):", "1200");
                        const p = prompt("Prezzo €:", "300");
                        if (l && h && p && parseInt(l) > 0 && parseInt(h) > 0 && parseFloat(p) > 0) {
                          setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: [...(x.griglia||[]), { l: parseInt(l), h: parseInt(h), prezzo: parseFloat(p) }].sort((a,b) => a.l - b.l || a.h - b.h) } : x));
                        }
                      }} style={{ padding: "3px 8px", borderRadius: 4, background: T.grn + "15", color: T.grn, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>+ Aggiungi</div>
                    </div>
                  </div>
                  {s.griglia?.length > 0 ? (
                    <div>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 3, fontStyle: "italic" }}>Il prezzo viene preso dalla combinazione LÃ—H più vicina (per eccesso). Se la finestra è più grande della griglia, usa l'ultimo prezzo.</div>
                      <div style={{ maxHeight: 120, overflowY: "auto", borderRadius: 4, border: `1px solid ${T.bdr}` }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                          <thead><tr style={{ background: T.bg, position: "sticky", top: 0 }}>
                            <th style={{ padding: "3px 6px", textAlign: "left", fontWeight: 700, color: T.sub }}>L (mm)</th>
                            <th style={{ padding: "3px 6px", textAlign: "left", fontWeight: 700, color: T.sub }}>H (mm)</th>
                            <th style={{ padding: "3px 6px", textAlign: "right", fontWeight: 700, color: T.sub }}>Prezzo €</th>
                            <th style={{ width: 20 }}></th>
                          </tr></thead>
                          <tbody>{s.griglia.map((g, gi) => (
                            <tr key={gi} style={{ borderTop: `1px solid ${T.bdr}20` }}>
                              <td style={{ padding: "2px 6px" }}>{g.l}</td>
                              <td style={{ padding: "2px 6px" }}>{g.h}</td>
                              <td style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, color: T.grn }}>€{g.prezzo}</td>
                              <td style={{ padding: "2px 4px", cursor: "pointer", color: T.red, textAlign: "center" }} onClick={() => {
                                setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: x.griglia.filter((_, i) => i !== gi) } : x));
                              }}>âœ•</td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      <div onClick={() => { if(confirm("Cancellare tutta la griglia?")) setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: [] } : x)); }} style={{ fontSize: 9, color: T.red, cursor: "pointer", textAlign: "right", marginTop: 4 }}>ðŸ—‘ Svuota griglia</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: T.sub, fontStyle: "italic" }}>Nessuna griglia inserita â€” il prezzo viene calcolato a €/mq.<br/>Puoi caricare il listino del fornitore (CSV: Larghezza;Altezza;Prezzo per riga) oppure aggiungere i prezzi a mano.</div>
                  )}
                </div>
                {/* Minimi mq per tipologia */}
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>Minimo mq fatturazione per tipologia</div>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 6, fontStyle: "italic" }}>Attiva solo le categorie che vuoi â€” se la finestra è più piccola, il prezzo viene calcolato sulla metratura minima</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { key: "1anta", label: "1 Anta" },
                      { key: "2ante", label: "2 Ante" },
                      { key: "3ante", label: "3+ Ante" },
                      { key: "scorrevole", label: "Scorrevole" },
                      { key: "fisso", label: "Fisso" },
                    ].map(cat => {
                      const isActive = (s.minimiMq?.[cat.key] || 0) > 0;
                      return (
                        <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: isActive ? T.acc + "10" : T.card, border: `1px solid ${isActive ? T.acc + "40" : T.bdr}`, opacity: isActive ? 1 : 0.6 }}>
                          <div onClick={() => {
                            if (isActive) {
                              setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, minimiMq: { ...(x.minimiMq || {}), [cat.key]: 0 } } : x));
                            } else {
                              const def = { "1anta": 1.5, "2ante": 2.0, "3ante": 2.8, "scorrevole": 3.5, "fisso": 1.0 }[cat.key] || 1.5;
                              setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, minimiMq: { ...(x.minimiMq || {}), [cat.key]: def } } : x));
                            }
                          }} style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isActive ? T.acc : T.bdr}`, background: isActive ? T.acc : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
                            {isActive && "âœ“"}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: T.text, minWidth: 52 }}>{cat.label}</span>
                          {isActive && (
                            <>
                              <input type="number" step="0.1" defaultValue={s.minimiMq?.[cat.key] || ""} onBlur={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, minimiMq: { ...(x.minimiMq || {}), [cat.key]: val } } : x));
                              }} style={{ width: 45, padding: "2px 4px", borderRadius: 4, border: `1px solid ${T.acc}40`, fontSize: 11, fontWeight: 700, color: T.acc, textAlign: "center", fontFamily: FM }} />
                              <span style={{ fontSize: 9, color: T.sub }}>mq</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {s.sottosistemi && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>Sottosistemi</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {s.sottosistemi.map(ss => <span key={ss} style={S.badge(T.blueLt, T.blue)}>{ss}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>Colori disponibili</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {s.colori.map(c => {
                    const col = coloriDB.find(x => x.code === c);
                    return <span key={c} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: col?.hex + "20", color: T.text, border: `1px solid ${col?.hex || T.bdr}40` }}>{col?.hex && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: col.hex, marginRight: 4, verticalAlign: "middle" }} />}{c}</span>;
                  })}
                </div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("sistema"); setSettingsForm({ marca: "", sistema: "", euroMq: "", sovRAL: "", sovLegno: "", sottosistemi: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi sistema</div>
          </>
        )}

        {/* === COLORI === */}
        {settingsTab === "colori" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Colori disponibili â€” collegati ai sistemi</div>
            {coloriDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 6 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: c.hex, border: `1px solid ${T.bdr}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{c.code} · {c.tipo}</div>
                </div>
                <div style={{ fontSize: 10, color: T.sub }}>{sistemiDB.filter(s => s.colori.includes(c.code)).map(s => s.marca).join(", ") || "â€”"}</div>
                <div onClick={() => deleteSettingsItem("colore", c.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("colore"); setSettingsForm({ nome: "", code: "", hex: "#888888", tipo: "RAL" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi colore</div>
          </>
        )}

        {/* === VETRI === */}
        {settingsTab === "vetri" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tipologie vetro disponibili per i vani</div>
            {vetriDB.map(g => (
              <div key={g.id} style={{ ...S.card, marginBottom: 6 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{g.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub, fontFamily: FM }}>{g.code}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "3px 8px", borderRadius: 6, background: g.ug <= 0.7 ? T.grnLt : g.ug <= 1.0 ? T.orangeLt : T.redLt, fontSize: 12, fontWeight: 700, fontFamily: FM, color: g.ug <= 0.7 ? T.grn : g.ug <= 1.0 ? T.orange : T.red }}>Ug={g.ug}</span>
                  <div onClick={() => deleteSettingsItem("vetro", g.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
                </div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("vetro"); setSettingsForm({ nome: "", code: "", ug: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi vetro</div>
          </>
        )}

        {/* === TIPOLOGIE === */}
        {settingsTab === "tipologie" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tipologie serramento â€” trascina â­ per i preferiti</div>
            {TIPOLOGIE_RAPIDE.map(t => {
              const isFav = favTipologie.includes(t.code);
              return (
                <div key={t.code} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
                  <div onClick={() => setFavTipologie(fav => isFav ? fav.filter(f => f !== t.code) : [...fav, t.code])} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: 16, color: isFav ? "#ff9500" : T.bdr }}>{isFav ? "â­" : "â˜†"}</span>
                  </div>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM }}>{t.code}</span>
                    <span style={{ fontSize: 11, color: T.sub, marginLeft: 6 }}>{t.label}</span>
                    {t.forma && t.forma !== "rettangolare" && <span style={{ fontSize: 9, color: T.acc, marginLeft: 6, background: T.accLt, padding: "1px 5px", borderRadius: 4 }}>{t.forma}</span>}
                  </div>
                  <Ico d={ICO.pen} s={14} c={T.sub} />
                </div></div>
              );
            })}
            <div onClick={() => { setSettingsModal("tipologia"); setSettingsForm({ code: "", label: "", icon: "ðŸªŸ", cat: "Altro", forma: "rettangolare" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipologia</div>
          </>
        )}

        {/* === COPRIFILI === */}
        {settingsTab === "coprifili" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Lista coprifili disponibili nella creazione vano</div>
            {coprifiliDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.acc }}>{c.cod}</span>
                  <span style={{ fontSize: 12, marginLeft: 8 }}>{c.nome}</span>
                </div>
                <div onClick={() => deleteSettingsItem("coprifilo", c.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("coprifilo"); setSettingsForm({ nome: "", cod: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi coprifilo</div>
          </>
        )}

        {/* === LAMIERE === */}
        {settingsTab === "lamiere" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Lista lamiere e scossaline</div>
            {lamiereDB.map(l => (
              <div key={l.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.orange }}>{l.cod}</span>
                  <span style={{ fontSize: 12, marginLeft: 8 }}>{l.nome}</span>
                </div>
                <div onClick={() => deleteSettingsItem("lamiera", l.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("lamiera"); setSettingsForm({ nome: "", cod: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi lamiera</div>
          </>
        )}

        {/* === SALITA === */}
        {settingsTab === "tapparella" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le tapparelle</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ“ Tipo Misura Tapparella</div>
            {tipoMisuraTappDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraTappDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura tapparella:");}catch(e){} if (n?.trim()) setTipoMisuraTappDB(prev => [...prev, { id: "tmt" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
          </>
        )}

        {settingsTab === "zanzariera" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le zanzariere</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ“ Tipo Misura Zanzariera</div>
            {tipoMisuraZanzDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraZanzDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura zanzariera:");}catch(e){} if (n?.trim()) setTipoMisuraZanzDB(prev => [...prev, { id: "tmz" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
          </>
        )}

        {settingsTab === "persiana" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le persiane</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ”§ Tipologia Telaio</div>
            {telaiPersianaDB.map(tp => (
              <div key={tp.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tp.code}</span>
                <div onClick={() => setTelaiPersianaDB(prev => prev.filter(x => x.id !== tp.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuova tipologia telaio (es. Z 35):");}catch(e){} if (n?.trim()) setTelaiPersianaDB(prev => [...prev, { id: "tp" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi telaio</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ“ 4° Lato / Posizionamento</div>
            {posPersianaDB.map(pp => (
              <div key={pp.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{pp.code}</span>
                <div onClick={() => setPosPersianaDB(prev => prev.filter(x => x.id !== pp.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo posizionamento (es. A muro):");}catch(e){} if (n?.trim()) setPosPersianaDB(prev => [...prev, { id: "pp" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi posizionamento</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 16, marginBottom: 8 }}>ðŸ“ Tipo Misura</div>
            {tipoMisuraDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura (es. Luce netta):");}catch(e){} if (n?.trim()) setTipoMisuraDB(prev => [...prev, { id: "tm" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
          </>
        )}

        {/* === SALITA === */}
        {settingsTab === "controtelaio" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura profondità, sezioni e modelli cielino per i controtelai</div>
            
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ“ Profondità disponibili (mm)</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
              {ctProfDB.map(p => (
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,border:`1px solid ${T.bdr}`,background:T.card}}>
                  <span style={{fontSize:12,fontWeight:600}}>{p.code}</span>
                  <div onClick={() => setCtProfDB(prev => prev.filter(x => x.id !== p.id))} style={{ cursor: "pointer", fontSize: 10, color: T.sub }}>âœ•</div>
                </div>
              ))}
            </div>
            <div onClick={() => { let n; try{n=window.prompt("Nuova profondità (mm):");}catch(e){} if (n?.trim()) setCtProfDB(prev => [...prev, { id: "cp" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi profondità</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ“ Sezioni controtelaio</div>
            {ctSezioniDB.map(s => (
              <div key={s.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.code}</span>
                <div onClick={() => setCtSezioniDB(prev => prev.filter(x => x.id !== s.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuova sezione (es. 56Ã—40):");}catch(e){} if (n?.trim()) setCtSezioniDB(prev => [...prev, { id: "cs" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi sezione</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ”² Modelli cielino</div>
            {ctCieliniDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.code}</span>
                <div onClick={() => setCtCieliniDB(prev => prev.filter(x => x.id !== c.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo modello cielino:");}catch(e){} if (n?.trim()) setCtCieliniDB(prev => [...prev, { id: "cc" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi cielino</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>âš¡ Offset calcolo infisso</div>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>Millimetri da sottrarre per lato (L e H) quando si calcola l'infisso dal controtelaio</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input style={{...S.input,width:80,textAlign:"center",fontSize:16,fontWeight:700}} type="number" inputMode="numeric" value={ctOffset} onChange={e=>setCtOffset(parseInt(e.target.value)||0)} />
              <span style={{fontSize:12,color:T.sub}}>mm/lato â†’ totale âˆ’{ctOffset*2}mm</span>
            </div>
          </>
        )}

        {settingsTab === "cassonetto" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura i tipi di cassonetto disponibili</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}>ðŸ§Š Tipo Cassonetto</div>
            {tipoCassonettoDB.map(tc => (
              <div key={tc.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tc.code}</span>
                <div onClick={() => setTipoCassonettoDB(prev => prev.filter(x => x.id !== tc.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo cassonetto:");}catch(e){} if (n?.trim()) setTipoCassonettoDB(prev => [...prev, { id: "tc" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo cassonetto</div>
          </>
        )}

        {settingsTab === "salita" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Configura i mezzi di salita disponibili</div>
            {mezziSalita.map((m, i) => (
              <div key={i} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>ðŸªœ</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
                </div>
                <div onClick={() => { if ((()=>{try{return window.confirm(`Eliminare "${m}"?`);}catch(e){return false;}})()) setMezziSalita(ms => ms.filter((_, j) => j !== i)); }} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nome mezzo di salita:");}catch(e){} if (n?.trim()) setMezziSalita(ms => [...ms, n.trim()]); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi mezzo salita</div>
          </>
        )}

        {/* === PIPELINE === */}
        {/* === LIBRERIA PRODOTTI === */}
        {settingsTab === "libreria" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Crea una libreria di prodotti/servizi da usare nelle Voci libere dei vani. Clicca sui campi per modificarli.</div>
            {libreriaDB.map(item => (
              <div key={item.id} style={{ ...S.card, marginBottom: 8 }}><div style={{ ...S.cardInner }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Foto */}
                  <div style={{ flexShrink: 0 }}>
                    {item.foto ? (
                      <div style={{ position: "relative" }}>
                        <img src={item.foto} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.bdr}` }} alt="" />
                        <div onClick={() => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, foto: undefined } : x))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.red, color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 900 }}>âœ•</div>
                      </div>
                    ) : (
                      <label style={{ width: 56, height: 56, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 2 }}>
                        <span style={{ fontSize: 18 }}>ðŸ“·</span>
                        <span style={{ fontSize: 7, color: T.sub }}>Foto</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, foto: ev.target?.result as string } : x));
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    )}
                  </div>
                  {/* Campi editabili */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input style={{ width: "100%", padding: "4px 6px", fontSize: 13, fontWeight: 700, border: `1px solid transparent`, borderRadius: 4, background: "transparent", marginBottom: 3 }} defaultValue={item.nome || ""} placeholder="Nome prodotto..." onFocus={e => e.target.style.borderColor = T.acc} onBlur={e => { e.target.style.borderColor = "transparent"; setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, nome: e.target.value } : x)); }} />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.sub }}>Cat:</span>
                        <input style={{ width: 80, padding: "2px 4px", fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, background: T.bg }} defaultValue={item.categoria || ""} placeholder="Categoria" onBlur={e => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, categoria: e.target.value } : x))} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.sub }}>€</span>
                        <input type="number" step="0.01" style={{ width: 60, padding: "2px 4px", fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.grn, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "right" }} defaultValue={item.prezzo || 0} onBlur={e => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, prezzo: parseFloat(e.target.value) || 0 } : x))} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.sub }}>/</span>
                        <select style={{ padding: "2px 4px", fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, background: T.bg }} value={item.unita || "pz"} onChange={e => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, unita: e.target.value } : x))}>
                          <option value="pz">Pezzo</option>
                          <option value="mq">mq</option>
                          <option value="ml">ml</option>
                          <option value="kg">kg</option>
                          <option value="forfait">Forfait</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Delete */}
                  <div onClick={() => setLibreriaDB(prev => prev.filter(x => x.id !== item.id))} style={{ padding: "6px", cursor: "pointer", color: T.sub, fontSize: 12, flexShrink: 0 }}>ðŸ—‘</div>
                </div>
              </div></div>
            ))}
            <div onClick={() => {
              setLibreriaDB(prev => [...prev, { id: Date.now(), nome: "", categoria: "", prezzo: 0, unita: "pz" }]);
            }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>+ Aggiungi prodotto alla libreria</div>
          </>
        )}

        {/* === SQUADRE MONTAGGIO === */}
        {settingsTab === "squadre" && (
          <>
            <div style={{ fontSize: 12, color: T.sub, padding: "0 4px 10px", lineHeight: 1.5 }}>Configura le squadre di montaggio. Ogni squadra ha un nome, membri e colore.</div>
            {squadreDB.map((sq, i) => (
              <div key={sq.id} style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input type="color" value={sq.colore} onChange={e => setSquadreDB(prev => prev.map((s, j) => j === i ? { ...s, colore: e.target.value } : s))} style={{ width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer" }} />
                  <input style={{ ...S.input, flex: 1, fontSize: 14, fontWeight: 700 }} value={sq.nome} onChange={e => setSquadreDB(prev => prev.map((s, j) => j === i ? { ...s, nome: e.target.value } : s))} />
                  <div onClick={() => setSquadreDB(prev => prev.filter((_, j) => j !== i))} style={{ fontSize: 16, cursor: "pointer", color: T.red }}>ðŸ—‘</div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>MEMBRI (uno per riga)</div>
                <textarea style={{ ...S.input, width: "100%", minHeight: 50, fontSize: 11, boxSizing: "border-box" }} value={sq.membri.join("\n")} onChange={e => setSquadreDB(prev => prev.map((s, j) => j === i ? { ...s, membri: e.target.value.split("\n").filter(x => x.trim()) } : s))} />
                <div style={{ fontSize: 9, color: T.sub, marginTop: 4 }}>Montaggi assegnati: {montaggiDB.filter(m => m.squadraId === sq.id).length}</div>
              </div>
            ))}
            <button onClick={() => setSquadreDB(prev => [...prev, { id: "sq" + Date.now(), nome: "Nuova Squadra", membri: [], colore: "#ff9500" }])} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1.5px dashed ${T.bdr}`, background: "transparent", color: T.acc, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Aggiungi squadra</button>
          </>
        )}

        {/* === FATTURE EMESSE === */}
        {settingsTab === "fatture" && (
          <>
            <div style={{ fontSize: 12, color: T.sub, padding: "0 4px 10px", lineHeight: 1.5 }}>Elenco fatture emesse. Puoi segnare le fatture come pagate o ristampare il PDF.</div>
            {fattureDB.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: T.sub }}>Nessuna fattura emessa. Crea fatture dalla scheda preventivo di una commessa.</div>
            ) : (
              <>
                {/* Riepilogo */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Totale emesso</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>€{fattureDB.reduce((s, f) => s + f.importo, 0).toLocaleString("it-IT")}</div>
                  </div>
                  <div style={{ flex: 1, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Incassato</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#34c759" }}>€{fattureDB.filter(f => f.pagata).reduce((s, f) => s + f.importo, 0).toLocaleString("it-IT")}</div>
                  </div>
                  <div style={{ flex: 1, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Da incassare</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#ff3b30" }}>€{fattureDB.filter(f => !f.pagata).reduce((s, f) => s + f.importo, 0).toLocaleString("it-IT")}</div>
                  </div>
                </div>
                {fattureDB.sort((a, b) => b.numero - a.numero).map(f => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>N. {f.numero}/{f.anno} â€” {f.tipo.toUpperCase()}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{f.cliente} · {f.cmCode} · {f.data}</div>
                      <div style={{ fontSize: 9, color: f.pagata ? "#34c759" : (f.scadenza < new Date().toISOString().split("T")[0] ? "#ff3b30" : T.sub) }}>
                        {f.pagata ? `âœ… Pagata il ${f.dataPagamento}` : `â³ Scadenza: ${f.scadenza}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>€{f.importo.toLocaleString("it-IT")}</div>
                      <div onClick={() => setFattureDB(prev => prev.map(x => x.id === f.id ? { ...x, pagata: !x.pagata, dataPagamento: !x.pagata ? new Date().toLocaleDateString("it-IT") : null } : x))} style={{ padding: "4px 8px", borderRadius: 6, background: f.pagata ? "#34c75920" : "#ff3b3020", color: f.pagata ? "#34c759" : "#ff3b30", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                        {f.pagata ? "âœ…" : "ðŸ’°"}
                      </div>
                      <div onClick={() => generaFatturaPDF(f)} style={{ fontSize: 16, cursor: "pointer" }}>ðŸ“„</div>
                      <div onClick={() => setFattureDB(prev => prev.filter(x => x.id !== f.id))} style={{ fontSize: 14, cursor: "pointer", color: T.red }}>ðŸ—‘</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {settingsTab === "pipeline" && (
          <>
            <div style={{fontSize:12,color:T.sub,padding:"0 4px 10px",lineHeight:1.5}}>Personalizza il flusso di lavoro. Ogni fase controlla <b style={{color:T.acc}}>ERP + Messaggi + Montaggi</b> automaticamente.</div>
            
            {/* LEGENDA ECOSISTEMA */}
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:"#007aff15",border:"1px solid #007aff30"}}>
                <span style={{fontSize:10}}>ðŸ“‹</span><span style={{fontSize:10,fontWeight:700,color:"#007aff"}}>ERP</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:"#34c75915",border:"1px solid #34c75930"}}>
                <span style={{fontSize:10}}>ðŸ“§</span><span style={{fontSize:10,fontWeight:700,color:"#34c759"}}>Messaggi</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:"#ff950015",border:"1px solid #ff950030"}}>
                <span style={{fontSize:10}}>ðŸ”§</span><span style={{fontSize:10,fontWeight:700,color:"#ff9500"}}>Montaggi</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:"#af52de15",border:"1px solid #af52de30"}}>
                <span style={{fontSize:10}}>âš¡</span><span style={{fontSize:10,fontWeight:700,color:"#af52de"}}>Automazioni</span>
              </div>
            </div>

            {pipelineDB.map((p, i) => {
              const isExpanded = (expandedPipelinePhase === p.id);
              const pipeTab = pipelinePhaseTab || "email";
              return (
              <div key={p.id} style={{marginBottom:8, opacity: p.attiva===false ? 0.45 : 1}}>
                {/* FASE CARD - come prima */}
                <div style={{...S.card, marginBottom:0, borderRadius: isExpanded ? "10px 10px 0 0" : T.r}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:1}}>
                      <div onClick={()=>{ if(i===0) return; const a=[...pipelineDB]; [a[i-1],a[i]]=[a[i],a[i-1]]; setPipelineDB(a); }} style={{fontSize:10,cursor:i===0?"default":"pointer",color:i===0?T.bdr:T.sub,lineHeight:1}}>â–²</div>
                      <div onClick={()=>{ if(i===pipelineDB.length-1) return; const a=[...pipelineDB]; [a[i],a[i+1]]=[a[i+1],a[i]]; setPipelineDB(a); }} style={{fontSize:10,cursor:i===pipelineDB.length-1?"default":"pointer",color:i===pipelineDB.length-1?T.bdr:T.sub,lineHeight:1}}>▼</div>
                    </div>
                    <span style={{fontSize:20,flexShrink:0}}>{p.ico}</span>
                    <input value={p.nome} onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,nome:e.target.value}:x))}
                      style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0}}/>
                    <div style={{width:12,height:12,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                    <div onClick={()=>{ if(p.id==="chiusura") return; setPipelineDB(db=>db.map((x,j)=>j===i?{...x,attiva:x.attiva===false?true:false}:x)); }}
                      style={{width:36,height:20,borderRadius:10,background:p.attiva===false?T.bdr:T.grn,cursor:p.id==="chiusura"?"default":"pointer",transition:"background 0.2s",position:"relative",flexShrink:0}}>
                      <div style={{position:"absolute",top:2,left:p.attiva===false?2:18,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                    </div>
                    {p.custom && <div onClick={()=>setPipelineDB(db=>db.filter((_,j)=>j!==i))} style={{fontSize:12,cursor:"pointer",color:T.red}}>âœ•</div>}
                    {/* EXPAND BUTTON */}
                    <div onClick={()=>setExpandedPipelinePhase(isExpanded ? null : p.id)} style={{fontSize:14,cursor:"pointer",color:isExpanded?T.acc:T.sub,transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
                  </div>
                  {/* Mini badges: cosa è configurato */}
                  {!isExpanded && (p.emailTemplate || p.checklistMontaggio?.length || p.automazioni?.length) && (
                    <div style={{display:"flex",gap:4,padding:"0 12px 8px",flexWrap:"wrap"}}>
                      {p.emailTemplate && <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:"#34c75915",color:"#34c759",fontWeight:700}}>ðŸ“§ Email</span>}
                      {p.checklistMontaggio?.length > 0 && <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:"#ff950015",color:"#ff9500",fontWeight:700}}>âœ… {p.checklistMontaggio.length} check</span>}
                      {p.automazioni?.length > 0 && <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:"#af52de15",color:"#af52de",fontWeight:700}}>âš¡ {p.automazioni.length} auto</span>}
                    </div>
                  )}
                </div>

                {/* EXPANDED PANEL - ECOSYSTEM HOOKS */}
                {isExpanded && (
                  <div style={{background:T.card,border:`1px solid ${T.bdr}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}>
                    {/* Tab bar */}
                    <div style={{display:"flex",borderBottom:`1px solid ${T.bdr}`}}>
                      {[
                        {id:"email",l:"ðŸ“§ Email",c:"#34c759"},
                        {id:"checklist",l:"âœ… Checklist",c:"#ff9500"},
                        {id:"auto",l:"âš¡ Automazioni",c:"#af52de"},
                        {id:"gate",l:"ðŸšª Gate",c:"#007aff"},
                      ].map(tab=>(
                        <div key={tab.id} onClick={()=>setPipelinePhaseTab(tab.id)}
                          style={{flex:1,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:700,
                            cursor:"pointer",
                            color:pipeTab===tab.id?tab.c:T.sub,
                            borderBottom:pipeTab===tab.id?`2px solid ${tab.c}`:"2px solid transparent",
                            background:pipeTab===tab.id?tab.c+"08":"transparent",
                            transition:"all 0.2s"
                          }}>{tab.l}</div>
                      ))}
                    </div>

                    <div style={{padding:12}}>
                      {/* â”€â”€â”€ TAB EMAIL (MESSAGGI) â”€â”€â”€ */}
                      {pipeTab === "email" && (
                        <div>
                          <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Template email inviata automaticamente quando la commessa entra in questa fase.</div>
                          <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>OGGETTO</div>
                          <input value={p.emailTemplate?.oggetto || ""} placeholder={`es: Conferma ${p.nome} - {{cliente}}`}
                            onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),oggetto:e.target.value}}:x))}
                            style={{...S.input,width:"100%",fontSize:12,marginBottom:8,boxSizing:"border-box"}} />
                          <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>CORPO (usa {{cliente}}, {{commessa}}, {{data}}, {{indirizzo}})</div>
                          <textarea value={p.emailTemplate?.corpo || ""} placeholder="Gentile {{cliente}},\nla informiamo che..."
                            onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),corpo:e.target.value}}:x))}
                            style={{...S.input,width:"100%",minHeight:80,fontSize:11,lineHeight:1.5,boxSizing:"border-box",resize:"vertical"}} />
                          <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                            <div style={{display:"flex",alignItems:"center",gap:4}}>
                              <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),attiva:!(x.emailTemplate?.attiva)}}:x))}
                                style={{width:32,height:18,borderRadius:9,background:p.emailTemplate?.attiva?T.grn:T.bdr,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                                <div style={{position:"absolute",top:2,left:p.emailTemplate?.attiva?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                              </div>
                              <span style={{fontSize:10,color:p.emailTemplate?.attiva?"#34c759":T.sub,fontWeight:600}}>Invio automatico</span>
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:4}}>
                              <select value={p.emailTemplate?.destinatario || "cliente"} 
                                onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),destinatario:e.target.value}}:x))}
                                style={{...S.input,fontSize:10,padding:"3px 6px"}}>
                                <option value="cliente">ðŸ“¤ Al cliente</option>
                                <option value="team">ðŸ‘¥ Al team</option>
                                <option value="entrambi">ðŸ“¤ðŸ‘¥ Entrambi</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* â”€â”€â”€ TAB CHECKLIST (MONTAGGI) â”€â”€â”€ */}
                      {pipeTab === "checklist" && (
                        <div>
                          <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Checklist obbligatoria per i montatori quando la commessa è in questa fase. Visibile in MASTRO MONTAGGI.</div>
                          {(p.checklistMontaggio || []).map((item, ci) => (
                            <div key={ci} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                              <span style={{fontSize:12,color:T.sub,fontFamily:"monospace",width:20,textAlign:"center"}}>{ci+1}.</span>
                              <input value={item} onChange={e=>{
                                const newList = [...(p.checklistMontaggio||[])];
                                newList[ci] = e.target.value;
                                setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistMontaggio:newList}:x));
                              }} style={{...S.input,flex:1,fontSize:11,boxSizing:"border-box"}} placeholder="es: Verificare dimensioni vano..." />
                              <div onClick={()=>{
                                const newList = (p.checklistMontaggio||[]).filter((_,k)=>k!==ci);
                                setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistMontaggio:newList}:x));
                              }} style={{fontSize:12,cursor:"pointer",color:T.red,flexShrink:0}}>âœ•</div>
                            </div>
                          ))}
                          <div onClick={()=>{
                            const newList = [...(p.checklistMontaggio||[]), ""];
                            setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistMontaggio:newList}:x));
                          }} style={{padding:"8px",borderRadius:8,border:`1px dashed ${T.acc}`,textAlign:"center",cursor:"pointer",color:T.acc,fontSize:11,fontWeight:600,marginTop:4}}>+ Aggiungi voce checklist</div>
                          {(p.checklistMontaggio?.length||0) > 0 && (
                            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
                              <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistObbligatoria:!x.checklistObbligatoria}:x))}
                                style={{width:32,height:18,borderRadius:9,background:p.checklistObbligatoria?T.grn:T.bdr,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                                <div style={{position:"absolute",top:2,left:p.checklistObbligatoria?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                              </div>
                              <span style={{fontSize:10,color:p.checklistObbligatoria?"#34c759":T.sub,fontWeight:600}}>Obbligatoria (blocca avanzamento se incompleta)</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* â”€â”€â”€ TAB AUTOMAZIONI â”€â”€â”€ */}
                      {pipeTab === "auto" && (
                        <div>
                          <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Azioni automatiche quando la commessa entra in questa fase.</div>
                          {(p.automazioni || []).map((auto, ai) => (
                            <div key={ai} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,background:T.bg,borderRadius:8,padding:"6px 8px"}}>
                              <select value={auto.tipo} onChange={e=>{
                                const newAuto = [...(p.automazioni||[])];
                                newAuto[ai] = {...newAuto[ai], tipo: e.target.value};
                                setPipelineDB(db=>db.map((x,j)=>j===i?{...x,automazioni:newAuto}:x));
                              }} style={{...S.input,fontSize:10,padding:"3px 6px",flex:1}}>
                                <option value="notifica_team">ðŸ”” Notifica al team</option>
                                <option value="notifica_cliente">ðŸ“± Notifica al cliente</option>
                                <option value="assegna_squadra">ðŸ”§ Assegna squadra montaggio</option>
                                <option value="crea_task">ðŸ“‹ Crea task automatico</option>
                                <option value="genera_pdf">ðŸ“„ Genera PDF preventivo</option>
                                <option value="verifica_magazzino">ðŸ“¦ Verifica materiali magazzino</option>
                                <option value="prenota_consegna">ðŸš› Prenota consegna</option>
                                <option value="richiedi_acconto">ðŸ’° Richiedi acconto</option>
                                <option value="invia_enea">ðŸ› Prepara pratica ENEA</option>
                                <option value="follow_up">ðŸ“… Schedula follow-up</option>
                              </select>
                              <div onClick={()=>{
                                const newAuto = (p.automazioni||[]).filter((_,k)=>k!==ai);
                                setPipelineDB(db=>db.map((x,j)=>j===i?{...x,automazioni:newAuto}:x));
                              }} style={{fontSize:12,cursor:"pointer",color:T.red,flexShrink:0}}>âœ•</div>
                            </div>
                          ))}
                          <div onClick={()=>{
                            const newAuto = [...(p.automazioni||[]), {tipo:"notifica_team",attiva:true}];
                            setPipelineDB(db=>db.map((x,j)=>j===i?{...x,automazioni:newAuto}:x));
                          }} style={{padding:"8px",borderRadius:8,border:`1px dashed ${T.acc}`,textAlign:"center",cursor:"pointer",color:T.acc,fontSize:11,fontWeight:600,marginTop:4}}>+ Aggiungi automazione</div>
                        </div>
                      )}

                      {/* â”€â”€â”€ TAB GATE (REQUISITI) â”€â”€â”€ */}
                      {pipeTab === "gate" && (
                        <div>
                          <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Requisiti obbligatori per avanzare a questa fase. La commessa non può entrare qui finché non sono soddisfatti.</div>
                          {(p.gateRequisiti || []).map((req, ri) => (
                            <div key={ri} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                              <select value={req.tipo} onChange={e=>{
                                const newReq = [...(p.gateRequisiti||[])];
                                newReq[ri] = {...newReq[ri], tipo: e.target.value};
                                setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateRequisiti:newReq}:x));
                              }} style={{...S.input,fontSize:10,padding:"3px 6px",flex:1}}>
                                <option value="preventivo_approvato">âœ… Preventivo approvato</option>
                                <option value="acconto_ricevuto">ðŸ’° Acconto ricevuto</option>
                                <option value="misure_confermate">ðŸ“ Misure confermate</option>
                                <option value="materiali_ordinati">ðŸ“¦ Materiali ordinati</option>
                                <option value="materiali_arrivati">ðŸš› Materiali arrivati</option>
                                <option value="squadra_assegnata">ðŸ”§ Squadra assegnata</option>
                                <option value="data_montaggio">ðŸ“… Data montaggio fissata</option>
                                <option value="documenti_ok">ðŸ“„ Documenti completi</option>
                                <option value="checklist_completa">â˜‘ï¸ Checklist fase precedente completa</option>
                                <option value="firma_cliente">âœï¸ Firma cliente</option>
                              </select>
                              <div onClick={()=>{
                                const newReq = (p.gateRequisiti||[]).filter((_,k)=>k!==ri);
                                setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateRequisiti:newReq}:x));
                              }} style={{fontSize:12,cursor:"pointer",color:T.red,flexShrink:0}}>âœ•</div>
                            </div>
                          ))}
                          <div onClick={()=>{
                            const newReq = [...(p.gateRequisiti||[]), {tipo:"preventivo_approvato"}];
                            setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateRequisiti:newReq}:x));
                          }} style={{padding:"8px",borderRadius:8,border:`1px dashed ${T.acc}`,textAlign:"center",cursor:"pointer",color:T.acc,fontSize:11,fontWeight:600,marginTop:4}}>+ Aggiungi requisito</div>
                          
                          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
                            <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateBloccante:!x.gateBloccante}:x))}
                              style={{width:32,height:18,borderRadius:9,background:p.gateBloccante?T.red:T.bdr,cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
                              <div style={{position:"absolute",top:2,left:p.gateBloccante?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                            </div>
                            <span style={{fontSize:10,color:p.gateBloccante?"#ff3b30":T.sub,fontWeight:600}}>Gate bloccante (impedisce avanzamento)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );})}

            <div onClick={()=>{ let nome; try{nome=window.prompt("Nome nuova fase:");}catch(e){} if(nome?.trim()) setPipelineDB(db=>[...db.slice(0,-1),{id:"custom_"+Date.now(),nome:nome.trim(),ico:"â­",color:"#8e8e93",attiva:true,custom:true},...db.slice(-1)]); }}
              style={{...S.card,marginTop:4,textAlign:"center",padding:"10px",cursor:"pointer",color:T.acc,fontSize:13,fontWeight:700}}>+ Aggiungi fase personalizzata</div>
            <div onClick={()=>{if((()=>{try{return window.confirm("Ripristinare le fasi predefinite?");}catch(e){return false;}})())setPipelineDB(PIPELINE_DEFAULT);}}
              style={{textAlign:"center",padding:"10px 0 4px",fontSize:11,color:T.sub,cursor:"pointer"}}>Ripristina predefinita</div>
          </>
        )}

        {/* === GUIDA === */}
        {/* === IMPORTA CATALOGO === */}
        {settingsTab === "importa" && (
          <>
            <div style={{background:T.card,borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`,marginBottom:12}}>
              <div style={{padding:"16px",borderBottom:`1px solid ${T.bdr}`,background:T.accLt}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:24}}>ðŸ“¥</span>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:T.text}}>Importa Catalogo da Excel</div>
                    <div style={{fontSize:11,color:T.sub}}>Carica il template MASTRO compilato con i tuoi dati</div>
                  </div>
                </div>
              </div>
              <div style={{padding:"16px"}}>
                <div style={{fontSize:11,color:T.sub,lineHeight:1.5,marginBottom:14}}>
                  Scarica il template Excel, compilalo con i tuoi sistemi, colori, vetri, prezzi e tutto il catalogo. Poi caricalo qui per importare tutto automaticamente.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  <a href="/MASTRO_Catalogo_Template.xlsx" download style={{flex:1,padding:"12px",borderRadius:10,border:`1.5px solid ${T.acc}`,background:T.accLt,color:T.acc,fontSize:12,fontWeight:700,textAlign:"center",textDecoration:"none",cursor:"pointer"}}>
                    ðŸ“„ Scarica Template Excel
                  </a>
                </div>
                <div style={{position:"relative",marginBottom:12}}>
                  <input type="file" accept=".xlsx,.xls" onChange={e=>{const f=e.target.files?.[0]; if(f) importExcelCatalog(f);}} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",zIndex:2}} />
                  <div style={{padding:"20px",borderRadius:12,border:`2px dashed ${T.acc}`,background:T.accLt,textAlign:"center",cursor:"pointer"}}>
                    <div style={{fontSize:28,marginBottom:6}}>ðŸ“‚</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.acc}}>Carica file Excel compilato</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:4}}>Trascina qui o tocca per selezionare (.xlsx)</div>
                  </div>
                </div>
                {importStatus && (
                  <div style={{background:importStatus.ok?"#f0fdf4":"#fefce8",borderRadius:10,padding:"12px 14px",border:`1.5px solid ${importStatus.ok?"#34c759":"#ff9500"}`,marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>{importStatus.ok?"âœ…":importStatus.step==="error"?"âŒ":"â³"}</span>
                      <span style={{fontSize:12,fontWeight:700,color:importStatus.ok?"#1a9e40":importStatus.step==="error"?"#dc2626":"#7a4500"}}>{importStatus.msg}</span>
                    </div>
                    {importStatus.detail && <div style={{fontSize:10,color:"#666"}}>{importStatus.detail}</div>}
                  </div>
                )}
                {importLog.length > 0 && (
                  <div style={{background:T.card2,borderRadius:10,padding:"12px",border:`1px solid ${T.bdr}`,maxHeight:300,overflow:"auto"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:6,textTransform:"uppercase"}}>Log importazione</div>
                    {importLog.map((l,i) => (
                      <div key={i} style={{fontSize:11,color:l.startsWith("âœ…")?"#1a9e40":l.startsWith("âŒ")?"#dc2626":l.startsWith("âš ï¸")?"#d97706":l.startsWith("ðŸŽ‰")?"#7c3aed":T.text,fontFamily:FM,lineHeight:1.6,fontWeight:l.startsWith("ðŸŽ‰")?800:400}}>
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{background:T.card,borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:16}}>ðŸ¤</span>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Servizio compilazione catalogo</div>
              </div>
              <div style={{fontSize:11,color:T.sub,lineHeight:1.6,marginBottom:10}}>
                Non hai tempo di compilare il template? Mandaci il tuo listino attuale (PDF, Excel, qualsiasi formato) e lo compiliamo noi per te.
              </div>
              <div style={{padding:"10px 14px",borderRadius:8,background:"#fff8ec",border:"1px solid #ffb800",fontSize:11,color:"#7a4500"}}>
                ðŸ’° Servizio a pagamento â€” Contattaci: <strong>info@mastro.app</strong>
              </div>
            </div>
          </>
        )}

        {settingsTab === "guida" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Header */}
            <div style={{background:T.acc,borderRadius:12,padding:"16px 18px",color:"#fff"}}>
              <div style={{fontSize:15,fontWeight:800}}>ðŸ“– Guida rapida MASTRO</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Tutto quello che ti serve sapere, in pillole da 30 secondi.</div>
            </div>

            {/* CARD 1: CREARE COMMESSA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#007aff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come creare una commessa</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Commesse</b> dal menu in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca il pulsante <b>+ Nuova Commessa</b> in alto</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila <b>nome cliente, indirizzo</b> e tipo di lavoro</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#34c759",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>âœ“</div>
                  <div style={{fontSize:12,color:"#34c759",fontWeight:700,lineHeight:1.5}}>La commessa parte in fase "Sopralluogo"</div>
                </div>
              </div>
            </div>

            {/* CARD 2: AGGIUNGERE VANI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff950015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸªŸ</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come aggiungere i vani</div><div style={{fontSize:10,color:T.sub}}>â± 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa e vai nella sezione <b>Rilievi</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Aggiungi vano</b> â€” scegli tipo (F1A, PF2A, SC2A...)</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dai un nome al vano (es. "Cucina", "Salone") e scegli la stanza</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Tipologie rapide:</b> F1A = 1 anta, F2A = 2 ante, PF = portafinestra, SC = scorrevole, VAS = vasistas</div>
              </div>
            </div>

            {/* CARD 3: INSERIRE MISURE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#5856d615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come inserire le misure</div><div style={{fontSize:10,color:T.sub}}>â± 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca un vano per aprirlo â€” vai nel tab <b>Misure</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci <b>3 larghezze</b> (alto, centro, basso) e <b>3 altezze</b> (sx, centro, dx)</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Completa <b>spallette</b>, <b>davanzale</b>, telaio e accessori</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Regola d'oro:</b> misura sempre dal CENTRO del vano â€” è il punto più affidabile per il taglio</div>
              </div>
            </div>

            {/* CARD 4: GENERARE PREVENTIVO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#34c75915",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“„</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come generare un preventivo PDF</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa con almeno un vano misurato</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca il pulsante <b>€ Preventivo</b> nella barra azioni</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Controlla il riepilogo â€” fai <b>firmare il cliente</b> sul telefono</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>4</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>Genera & Scarica PDF</b> â€” pronto per inviare via WhatsApp!</div>
                </div>
              </div>
            </div>

            {/* CARD 5: FASI COMMESSA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ”„</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Le 8 fasi di una commessa</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                {[
                  {f:"Sopralluogo",i:"ðŸ“",d:"Vai dal cliente, valuta il lavoro",c:"#007aff"},
                  {f:"Preventivo",i:"ðŸ“",d:"Prepara e invia l'offerta",c:"#ff9500"},
                  {f:"Conferma",i:"âœï¸",d:"Il cliente accetta e firma",c:"#af52de"},
                  {f:"Misure",i:"ðŸ“",d:"Rilievo preciso di ogni vano",c:"#5856d6"},
                  {f:"Ordini",i:"ðŸ›’",d:"Ordina profili, vetri e accessori",c:"#ff2d55"},
                  {f:"Produzione",i:"ðŸ­",d:"Attendi che il materiale sia pronto",c:"#ff9500"},
                  {f:"Posa",i:"ðŸ”§",d:"Installa tutto dal cliente",c:"#34c759"},
                  {f:"Chiusura",i:"âœ…",d:"Saldo finale e garanzia",c:"#30b0c7"},
                ].map((p,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<7?6:0}}>
                    <div style={{fontSize:14,width:22,textAlign:"center"}}>{p.i}</div>
                    <div style={{fontSize:12,fontWeight:700,color:p.c,width:85}}>{p.f}</div>
                    <div style={{fontSize:11,color:T.sub}}>{p.d}</div>
                    {i<7 && <div style={{marginLeft:"auto",fontSize:10,color:T.sub}}>â†’</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 6: SCORCIATOIE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff2d5515",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>âš¡</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Trucchi da Pro</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                {[
                  {t:"Barra di ricerca",d:"Cerca qualsiasi cosa: clienti, commesse, indirizzi â€” tutto da Home"},
                  {t:"Allerte rosse",d:"Le commesse ferme da troppo tempo appaiono in Home â€” toccale per aprirle"},
                  {t:"Drag & drop fasi",d:"In Commesse, tieni premuto su una card per spostarla tra le fasi"},
                  {t:"Foto e firma",d:"Puoi fotografare il vano e far firmare il cliente direttamente sul telefono"},
                  {t:"SVG in tempo reale",d:"Mentre inserisci le misure, il disegno del vano si aggiorna live"},
                ].map((tip,i) => (
                  <div key={i} style={{display:"flex",gap:8,marginBottom:i<4?8:0,alignItems:"flex-start"}}>
                    <div style={{fontSize:10,color:T.acc,fontWeight:900,marginTop:2}}>â–¸</div>
                    <div><span style={{fontSize:12,fontWeight:700,color:T.text}}>{tip.t}: </span><span style={{fontSize:11,color:T.sub}}>{tip.d}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 7: CONTROTELAIO PSU */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#2563eb15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ”²</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come configurare il controtelaio</div><div style={{fontSize:10,color:T.sub}}>â± 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri un vano â€” scorri fino alla sezione <b>ðŸ”² Controtelaio</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli il tipo: <b>Singolo</b>, <b>Doppio</b> o <b>Con Cassonetto</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci <b>larghezza e altezza vano</b> â€” il calcolo infisso parte in automatico</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#34c759",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>âœ“</div>
                  <div style={{fontSize:12,color:"#34c759",fontWeight:700,lineHeight:1.5}}>L'infisso viene calcolato togliendo l'offset (default 10mm/lato)</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Cassonetto:</b> compila anche H e P cassonetto + modello cielino (A tampone, A tappo, Frontale)</div>
              </div>
            </div>

            {/* CARD 8: FOTO VIDEO AUDIO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff2d5515",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“¸</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Foto, video e note vocali</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dentro un rilievo, tocca il pulsante <b>ðŸ“Ž Allegati</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli: <b>ðŸ“· Foto</b> (scatta dalla fotocamera), <b>ðŸŽ¥ Video</b> o <b>ðŸŽ¤ Nota vocale</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Gli allegati vengono salvati e associati al vano â€” rivedili quando vuoi</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>AI Photo:</b> tocca il bottone ðŸ¤– AI nel vano per analizzare la foto con intelligenza artificiale</div>
              </div>
            </div>

            {/* CARD 9: FUORISQUADRO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff950015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Fuorisquadro e diagonali</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Nelle misure del vano, inserisci <b>H1</b> (sinistra) e <b>H2</b> (destra) se diverse</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci le <b>diagonali D1 e D2</b> â€” il sistema calcola la differenza</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#ff3b30",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>!</div>
                  <div style={{fontSize:12,color:"#ff3b30",fontWeight:700,lineHeight:1.5}}>Se fuorisquadro: warning rosso + disegno SVG con forma reale</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Nel riepilogo WhatsApp</b> il fuorisquadro viene segnalato con âš ï¸ per avvisare la produzione</div>
              </div>
            </div>

            {/* CARD 10: IMPORT EXCEL */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#34c75915",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“¥</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Importare il catalogo da Excel</div><div style={{fontSize:10,color:T.sub}}>â± 1 minuto</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni â†’ Importa</b> e scarica il <b>Template Excel</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri il file Excel â€” ogni <b>foglio</b> corrisponde a una categoria del catalogo</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila le colonne come indicato sotto â€” <b>una riga per ogni prodotto</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>4</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Torna in <b>Importa</b>, carica il file â€” il catalogo viene sostituito automaticamente</div>
                </div>

                {/* Tabella fogli */}
                <div style={{fontSize:11,fontWeight:800,color:T.acc,marginBottom:6,marginTop:4}}>ðŸ“Š COLONNE PER OGNI FOGLIO:</div>
                {[
                  {foglio:"SISTEMI", colonne:"Marca | Nome Sistema | Uf (W/mÂ²K)", es:"Aluplast | Ideal 4000 | 1.1"},
                  {foglio:"COLORI", colonne:"Nome | RAL/Codice | Tipo", es:"Grigio Antracite | 7016 | RAL"},
                  {foglio:"VETRI", colonne:"Descrizione | Composizione | Ug (W/mÂ²K) | Prezzo €/mq", es:"Basso emissivo | 4/20/4 | 1.0 | 35"},
                  {foglio:"COPRIFILI", colonne:"Descrizione | Codice | Prezzo €/ml", es:"Coprifilo 70mm | CF70 | 4.50"},
                  {foglio:"LAMIERE", colonne:"Descrizione | Codice | Prezzo €/ml", es:"Lamiera 25/10 | LM25 | 8.20"},
                ].map((f,i) => (
                  <div key={i} style={{marginBottom:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8,border:"1px solid "+(T.bdr||"#E5E3DE")}}>
                    <div style={{fontSize:11,fontWeight:800,color:T.blue||"#2563eb",marginBottom:3}}>{"ðŸ“‹ "+f.foglio}</div>
                    <div style={{fontSize:10,color:T.text,fontFamily:FM,marginBottom:2}}>{f.colonne}</div>
                    <div style={{fontSize:9,color:T.sub,fontStyle:"italic"}}>{"Es: "+f.es}</div>
                  </div>
                ))}
                <div style={{fontSize:10,color:T.sub,marginTop:4,padding:"8px 10px",background:"#fff8ec",borderRadius:8,border:"1px solid #ffcc0040"}}>
                  âš ï¸ <b>Attenzione:</b> l'importazione <b>sostituisce</b> il catalogo esistente â€” fai un backup prima se hai gia inserito dati a mano.
                </div>
                <div style={{fontSize:10,color:T.sub,marginTop:6,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>
                  ðŸ’¡ <b>Fogli extra supportati:</b> ACCESSORI, TIPOLOGIE, CONTROTELAI, TAPPARELLE, ZANZARIERE, PERSIANE, SERVIZI, SAGOME_TELAIO, PROFILI â€” saranno attivati nei prossimi aggiornamenti.
                </div>
                <div style={{fontSize:10,color:T.sub,marginTop:6,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>
                  ðŸ¤ <b>Non hai tempo?</b> Mandaci il tuo listino in qualsiasi formato (PDF, foto, Excel vecchio) a <b>info@mastro.app</b> e lo compiliamo noi per te.
                </div>
              </div>
            </div>

            {/* CARD 11: CONDIZIONI PREVENTIVO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“‹</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Personalizzare le condizioni del preventivo</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni â†’ Azienda</b> e scorri in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Trovi 5 sezioni: <b>Fornitura, Pagamento, Consegna, Contratto, Dettagli tecnici</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scrivi il tuo testo â€” appare nel PDF. Se lasci vuoto, usa il testo standard</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>PEC:</b> compila anche il campo PEC â€” apparira nell'intestazione del preventivo</div>
              </div>
            </div>

            {/* CARD 12: AGENDA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#007aff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“…</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come usare l'agenda</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Agenda</b> dal menu â€” scegli vista <b>Mese, Settimana o Giorno</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Nuovo evento</b> â€” scegli tipo (Sopralluogo, Misure, Posa, Consegna...)</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Collega l'evento a una <b>commessa</b> â€” appare anche nella Home del giorno</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>10 tipi evento</b> con icone e colori diversi â€” i pallini colorati nel mese ti danno il colpo d'occhio</div>
              </div>
            </div>

            {/* CARD 13: AI INBOX */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#5856d615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ¤–</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>AI Inbox â€” email intelligenti</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Messaggi â†’ AI Inbox</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>L'AI classifica ogni email: <b>priorita, sentimento, commessa suggerita</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Azioni rapide: <b>Archivia</b>, <b>Collega a commessa</b> o <b>Rispondi</b> con un tap</div>
                </div>
              </div>
            </div>

            {/* CARD 14: RIEPILOGO WHATSAPP */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#25d36618",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ’¬</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Riepilogo per WhatsApp</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa con vani â€” tocca <b>ðŸ“‹ Riepilogo</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vedi il riepilogo formattato con tutti i vani, misure, colori, accessori</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>Copia</b> â€” incolla direttamente in WhatsApp per la produzione</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Fuorisquadro incluso:</b> se un vano e fuorisquadro, il riepilogo lo segnala con âš ï¸ e le misure reali</div>
              </div>
            </div>

            {/* CARD 15: PIPELINE PERSONALIZZABILE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff950015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>âš™ï¸</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Personalizzare la pipeline</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni â†’ Pipeline</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Attiva/disattiva le fasi che ti servono con gli <b>switch</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#34c759",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>âœ“</div>
                  <div style={{fontSize:12,color:"#34c759",fontWeight:700,lineHeight:1.5}}>La fase Chiusura e sempre attiva â€” non si puo disabilitare</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Esempio:</b> non fai produzione interna? Disattiva "Produzione" e le commesse saltano direttamente a "Posa"</div>
              </div>
            </div>

            {/* CARD 16: FIRMA CLIENTE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#5856d615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>âœï¸</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Far firmare il cliente sul telefono</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri il <b>Preventivo</b> di una commessa</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>âœï¸ Firma cliente</b> â€” appare un'area bianca per firmare col dito</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Il cliente firma col dito sullo schermo â€” tocca <b>Conferma</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#34c759",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>âœ“</div>
                  <div style={{fontSize:12,color:"#34c759",fontWeight:700,lineHeight:1.5}}>La firma viene salvata e inserita nel PDF del preventivo</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Puoi cancellare</b> e far rifirmare â€” tocca "Cancella" per resettare l'area firma</div>
              </div>
            </div>

            {/* CARD 17: SISTEMA RILIEVI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff950015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“‚</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come funzionano i rilievi</div><div style={{fontSize:10,color:T.sub}}>â± 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa â€” tocca <b>+ Nuovo rilievo</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila <b>data, rilevatore</b> (dal team), note e condizioni</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dentro ogni rilievo aggiungi i <b>vani</b> con misure e foto</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Piu rilievi per commessa:</b> puoi fare un primo sopralluogo esplorativo e poi un secondo con le misure definitive. Il tab <b>Report</b> confronta le differenze tra rilievi</div>
              </div>
            </div>

            {/* CARD 18: CHAT AI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ’¬</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Chiedi a MASTRO AI</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Messaggi</b> â€” trovi la chat AI in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scrivi domande naturali: <b>"cosa ho in programma oggi?"</b>, <b>"quante commesse ho?"</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>MASTRO AI risponde con dati reali dalle tue commesse, task e misure</div>
                </div>
              </div>
            </div>

            {/* CARD 19: INVIO EMAIL */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#007aff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“§</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Inviare email dalla commessa</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dentro una commessa, tocca <b>ðŸ“§ Invia email</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli il <b>destinatario</b> (cliente o fornitore), scrivi <b>oggetto e messaggio</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>L'email viene inviata e collegata alla commessa nel <b>log attivita</b></div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Template pronti:</b> conferma appuntamento, promemoria, preventivo pronto â€” personalizzabili</div>
              </div>
            </div>

            {/* CARD 20: RUBRICA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#34c75915",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ“‡</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Rubrica contatti</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Messaggi â†’ Rubrica</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Filtra per tipo: <b>Tutti, Preferiti, Team, Clienti, Fornitori</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Ogni contatto mostra: nome, ruolo, canali disponibili (WhatsApp, email, SMS)</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>I membri del team</b> appaiono automaticamente nella rubrica con il loro ruolo e colore</div>
              </div>
            </div>

            {/* CARD 21: TEAM */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff2d5515",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ‘¥</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Gestione Team</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni â†’ Team</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Aggiungi membro</b> â€” inserisci nome, ruolo e colore</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>I membri appaiono nei rilievi, negli eventi e nella rubrica automaticamente</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Assegnazione automatica:</b> quando una commessa avanza di fase, il responsabile viene assegnato in base al ruolo configurato</div>
              </div>
            </div>

            {/* CARD 22: WIDGET DRAG & DROP */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#007aff15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ§©</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Personalizzare la Home</div><div style={{fontSize:10,color:T.sub}}>â± 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Nella Home, tocca <b>âœï¸ Layout</b> in alto a destra</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}><b>Trascina</b> i widget per riordinarli â€” metti in alto quelli che usi di piu</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>âœ“ Fine</b> per salvare â€” l'ordine viene ricordato</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>7 widget disponibili:</b> Contatori, IO (briefing), Attenzione, Programma oggi, Settimana, Commesse, Azioni rapide</div>
              </div>
            </div>

            {/* CARD 23: DATI AZIENDALI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#ff950015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸ¢</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Compilare i dati aziendali</div><div style={{fontSize:10,color:T.sub}}>â± 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni â†’ Azienda</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila: <b>Ragione sociale, P.IVA, CF, Indirizzo, Telefono, Email, PEC, CCIAA</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#34c759",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>âœ“</div>
                  <div style={{fontSize:12,color:"#34c759",fontWeight:700,lineHeight:1.5}}>Questi dati appaiono nell'intestazione di ogni preventivo PDF</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>Compila tutto subito:</b> cosi ogni preventivo che generi ha gia tutti i dati corretti senza doverli inserire ogni volta</div>
              </div>
            </div>

            {/* CARD 24: MODULO PROBLEMI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#FF3B3015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>ðŸš¨</div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Segnalare un problema</div><div style={{fontSize:10,color:T.sub}}>â± 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa â€” tocca <b>ðŸš¨ Segnala problema</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli <b>tipo</b> (Materiale, Misure, Installazione...) e <b>priorità</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Descrivi il problema e <b>assegna</b> a un membro del team</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>ðŸ’¡ <b>3 stati:</b> Aperto â†’ In corso â†’ Risolto. I problemi aperti appaiono nel widget <b>Attenzione</b> in Home</div>
              </div>
            </div>

            {/* RIVEDI TUTORIAL */}
            <div onClick={() => { try{localStorage.removeItem("mastro:onboarded")}catch(e){} setTutoStep(1); }} style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),padding:"14px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
              <div style={{fontSize:18}}>ðŸ”„</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Rivedi il tutorial iniziale</div>
                <div style={{fontSize:11,color:T.sub}}>Riavvia la guida di benvenuto</div>
              </div>
              <div style={{marginLeft:"auto",fontSize:14,color:T.sub}}>â†’</div>
            </div>

            <div style={{height:20}}/>
          </div>
        )}

        {/* === ðŸ”„ RESET DEMO === */}
        <div style={{ margin: "20px 0", padding: 16, background: "#ff3b3008", borderRadius: 12, border: "1px solid #ff3b3025" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#ff3b30", textTransform: "uppercase", marginBottom: 6 }}>ðŸ”„ Zona Reset</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Ricarica i 4 clienti demo con tutti i dati precompilati per testare il flusso completo.</div>
          <button onClick={() => {
            if (!confirm("Vuoi ricaricare i dati demo? I dati attuali verranno sostituiti.")) return;
            ["cantieri","tasks","events","fatture","ordiniForn","montaggi","contatti","pipeline","azienda","team","settori","piano","colori","sistemi","vetri","coprifili","lamiere","libreria","squadre"].forEach(k => {
              try { localStorage.removeItem("mastro:" + k); } catch(e) {}
            });
            localStorage.removeItem("mastro:demoVer");
            window.location.reload();
          }} style={{
            width: "100%", padding: 12, borderRadius: 10, border: "2px solid #ff3b30",
            background: "#fff", color: "#ff3b30", fontSize: 13, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}>ðŸ”„ RICARICA DATI DEMO (4 clienti)</button>
        </div>

      </div>
    </div>

  );
}

