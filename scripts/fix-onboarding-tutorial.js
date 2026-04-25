// fix-onboarding-tutorial.js — Replace form wizard with real interactive tutorial
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. REMOVE OLD WIZARD UI
const wizStart = c.indexOf('{/* === ONBOARDING WIZARD V2 === */}');
if (wizStart !== -1) {
  const afterWiz = c.indexOf('{!selectedVano && (', wizStart);
  if (afterWiz !== -1) {
    c = c.substring(0, wizStart) + c.substring(afterWiz);
    console.log('✓ Old wizard UI removed');
  }
}

// 2. REMOVE OLD STATES + finishOnboarding
const onbStateStart = c.indexOf('// === ONBOARDING V2 ===');
if (onbStateStart !== -1) {
  // Find the end - before renderCommesse or the next function
  let endSearch = c.indexOf('const renderCommesse', onbStateStart);
  if (endSearch === -1) endSearch = c.indexOf('// Advance fase notification', onbStateStart);
  if (endSearch !== -1) {
    c = c.substring(0, onbStateStart) + c.substring(endSearch);
    console.log('✓ Old onboarding states removed');
  }
}

// 3. ADD NEW TUTORIAL STATES (before renderCommesse or before "// Advance fase notification")
let insertAnchor = c.indexOf('const renderCommesse');
if (insertAnchor === -1) insertAnchor = c.indexOf('// Advance fase notification');
if (insertAnchor === -1) { console.error('No anchor found'); process.exit(1); }
// Go to line start
insertAnchor = c.lastIndexOf('\n', insertAnchor) + 1;

const newStates = `  // === ONBOARDING TUTORIAL ===
  const [tutoStep, setTutoStep] = useState(0);
  React.useEffect(() => {
    try { if (!localStorage.getItem("mastro:onboarded")) setTutoStep(1); } catch(e){}
  }, []);
  const closeTuto = () => { setTutoStep(0); try { localStorage.setItem("mastro:onboarded", "1"); } catch(e){} };
  const nextTuto = () => { if (tutoStep >= 7) closeTuto(); else setTutoStep(tutoStep + 1); };

`;

c = c.substring(0, insertAnchor) + newStates + c.substring(insertAnchor);
console.log('✓ New tutorial states added');

// 4. ADD TUTORIAL UI (before {!selectedVano)
const uiAnchor = c.lastIndexOf('{!selectedVano && (');
if (uiAnchor === -1) { console.error('UI anchor not found'); process.exit(1); }

const tutorialUI = `{/* === TUTORIAL INTERATTIVO === */}
      {tutoStep >= 1 && tutoStep <= 7 && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background: tutoStep === 1 ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)", display:"flex", alignItems: tutoStep === 1 ? "center" : "flex-end", justifyContent:"center", padding:16, fontFamily:T.font }} onClick={nextTuto}>
          <div onClick={e => e.stopPropagation()} style={{ background:"#fff", borderRadius: tutoStep === 1 ? 24 : 20, width:"100%", maxWidth: tutoStep === 1 ? 380 : 340, padding: tutoStep === 1 ? "32px 28px" : "20px 22px", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", marginBottom: tutoStep === 1 ? 0 : 80, ...(tutoStep >= 2 && tutoStep <= 6 ? { position:"fixed", bottom: 70, left:"50%", transform:"translateX(-50%)" } : {}) }}>

            {/* STEP 1: WELCOME */}
            {tutoStep === 1 && (<div style={{ textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:16, background:T.acc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, fontWeight:900, color:"#fff", margin:"0 auto 16px" }}>M</div>
              <div style={{ fontSize:22, fontWeight:900, color:"#1A1A1C", marginBottom:6 }}>Benvenuto in MASTRO</div>
              <div style={{ fontSize:13, color:"#6B6B6B", lineHeight:1.6, marginBottom:24 }}>Il gestionale pensato per chi fa serramenti sul campo. Ti faccio vedere come funziona in 30 secondi.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, textAlign:"left", marginBottom:24 }}>
                {[
                  {e:"\uD83C\uDFE0",t:"Home",d:"Riepilogo della giornata: appuntamenti, allerte, calendario"},
                  {e:"\uD83D\uDCC5",t:"Agenda",d:"Tutti i tuoi impegni in vista giorno, settimana o mese"},
                  {e:"\uD83D\uDCC1",t:"Commesse",d:"Il cuore: ogni lavoro dalla richiesta alla posa"},
                  {e:"\uD83D\uDCE8",t:"Messaggi",d:"Tutte le comunicazioni in un posto"},
                  {e:"\u2699\uFE0F",t:"Impostazioni",d:"Listini, colori, team e dati azienda"},
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <div style={{ fontSize:18, width:28, textAlign:"center", flexShrink:0 }}>{s.e}</div>
                    <div><div style={{ fontSize:13, fontWeight:700, color:"#1A1A1C" }}>{s.t}</div><div style={{ fontSize:11, color:"#8E8E93" }}>{s.d}</div></div>
                  </div>
                ))}
              </div>
              <div onClick={nextTuto} style={{ padding:"14px 32px", fontSize:15, fontWeight:800, color:"#fff", background:T.acc, borderRadius:14, cursor:"pointer", display:"inline-block" }}>Inizia il tour →</div>
              <div onClick={closeTuto} style={{ fontSize:11, color:"#8E8E93", marginTop:12, cursor:"pointer" }}>Salta, conosco già</div>
            </div>)}

            {/* STEP 2: HOME TAB */}
            {tutoStep === 2 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>\uD83C\uDFE0</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Home</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>1/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Appena apri MASTRO vedi la <b>dashboard</b>: gli appuntamenti di oggi in alto, le <b>allerte</b> sulle commesse ferme, e il <b>calendario</b> del mese. Tocca qualsiasi elemento per aprirlo.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={closeTuto} style={{ fontSize:11, color:"#8E8E93", cursor:"pointer" }}>Chiudi tour</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, left:24, width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 3: AGENDA */}
            {tutoStep === 3 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>\uD83D\uDCC5</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Agenda</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>2/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Qui vedi <b>tutti gli impegni</b>: sopralluoghi, pose, consegne. Puoi vedere il <b>giorno singolo</b>, la <b>settimana</b> o il <b>mese</b>. Tocca il + per aggiungere un appuntamento. Ogni evento può essere collegato a una commessa.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>\u2039 Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, left:"38%", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 4: COMMESSE */}
            {tutoStep === 4 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>\uD83D\uDCC1</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Commesse</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>3/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:8 }}>Ogni commessa è un <b>lavoro completo</b> con il suo ciclo di vita:</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
                {["Sopralluogo","Preventivo","Conferma","Misure","Ordini","Produzione","Posa","Chiusura"].map((f,i) => (
                  <div key={i} style={{ fontSize:9, fontWeight:700, padding:"3px 7px", borderRadius:6, background:i===0?"#007aff15":i<4?"#ff950015":"#34c75915", color:i===0?"#007aff":i<4?"#ff9500":"#34c759" }}>{f}</div>
                ))}
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Dentro ogni commessa gestisci <b>vani</b> (finestre, porte), <b>misure</b>, <b>rilievi</b> e generi il <b>preventivo PDF</b>. Tocca + per creare la tua prima commessa!</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>\u2039 Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, left:"50%", transform:"translateX(-50%)", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 5: MESSAGGI */}
            {tutoStep === 5 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>\uD83D\uDCE8</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Messaggi</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>4/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Tutte le comunicazioni: <b>WhatsApp, email, SMS, Telegram</b>. L\u2019AI Inbox analizza le email in arrivo e suggerisce azioni automatiche: creare commesse, collegare messaggi, avanzare fasi.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>\u2039 Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, right:"35%", width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 6: IMPOSTAZIONI */}
            {tutoStep === 6 && (<div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ fontSize:22 }}>\u2699\uFE0F</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#1A1A1C" }}>Impostazioni</div>
                <div style={{ marginLeft:"auto", fontSize:10, color:"#8E8E93", background:"#f5f5f5", padding:"3px 8px", borderRadius:8 }}>5/6</div>
              </div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.6, marginBottom:12 }}>Configura la tua azienda: <b>ragione sociale, logo, listini prezzi, sistemi</b> (Sch\u00FCco, Rehau, Finstral...), <b>colori RAL</b>, vetri, coprifili, lamiere. Tutto quello che ti serve per fare preventivi precisi.</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div onClick={() => setTutoStep(tutoStep-1)} style={{ fontSize:12, color:"#8E8E93", cursor:"pointer" }}>\u2039 Indietro</div>
                <div onClick={nextTuto} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
              </div>
              <div style={{ position:"absolute", bottom:-8, right:24, width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>
            </div>)}

            {/* STEP 7: FINAL */}
            {tutoStep === 7 && (<div style={{ textAlign:"center" }}>
              <div style={{ fontSize:40, marginBottom:12 }}>\uD83D\uDE80</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#1A1A1C", marginBottom:6 }}>Tutto pronto!</div>
              <div style={{ fontSize:12, color:"#6B6B6B", lineHeight:1.7, marginBottom:8 }}>Ecco come iniziare:</div>
              <div style={{ textAlign:"left", marginBottom:20 }}>
                {[
                  {n:"1",t:"Vai in Impostazioni",d:"Inserisci ragione sociale, P.IVA, telefono"},
                  {n:"2",t:"Crea la prima commessa",d:"Tocca Commesse → + e inserisci cliente e indirizzo"},
                  {n:"3",t:"Aggiungi i vani",d:"Dentro la commessa, aggiungi finestre e portefinestre"},
                  {n:"4",t:"Fai il sopralluogo",d:"Inserisci le misure vano per vano dal cantiere"},
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:10 }}>
                    <div style={{ width:22, height:22, borderRadius:6, background:T.acc, color:"#fff", fontSize:11, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.n}</div>
                    <div><div style={{ fontSize:12, fontWeight:700, color:"#1A1A1C" }}>{s.t}</div><div style={{ fontSize:11, color:"#8E8E93" }}>{s.d}</div></div>
                  </div>
                ))}
              </div>
              <div onClick={closeTuto} style={{ padding:"14px 32px", fontSize:15, fontWeight:800, color:"#fff", background:T.acc, borderRadius:14, cursor:"pointer", display:"inline-block" }}>Inizia a lavorare! \uD83D\uDCAA</div>
            </div>)}
          </div>
        </div>
      )}
      `;

c = c.substring(0, uiAnchor) + tutorialUI + c.substring(uiAnchor);
console.log('✓ New tutorial UI added');

fs.writeFileSync(file, c);
console.log('\n\u2705 Tutorial onboarding completo!');
console.log('Lines: ' + c.split('\n').length);
