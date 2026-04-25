// reset-and-onboarding.js — Svuota dati demo + onboarding che crea dati reali
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// Helper: replace an INIT array with new content
function replaceInit(name, newContent) {
  const start = c.indexOf('const ' + name + ' = [');
  if (start === -1) { console.log('SKIP: ' + name + ' not found'); return; }
  // Find matching ];
  let depth = 0, i = c.indexOf('[', start);
  for (; i < c.length; i++) {
    if (c[i] === '[') depth++;
    if (c[i] === ']') { depth--; if (depth === 0) break; }
  }
  const end = i + 2; // includes ]; 
  c = c.substring(0, start) + 'const ' + name + ' = ' + newContent + ';' + c.substring(end);
  console.log('✓ ' + name + ' replaced');
}

// 1. EMPTY DEMO DATA
replaceInit('CANTIERI_INIT', '[]');
replaceInit('TASKS_INIT', '[]');
replaceInit('AI_INBOX_INIT', '[]');
replaceInit('MSGS_INIT', '[]');
replaceInit('CONTATTI_INIT', '[]');

// Keep TEAM with just the owner placeholder
replaceInit('TEAM_INIT', '[\n  { id: 1, nome: "", ruolo: "Titolare", compiti: "Gestione commesse, preventivi, rapporti clienti", colore: "#007aff" },\n]');

// Keep COLORI_INIT and SISTEMI_INIT (reference data, not demo)
console.log('✓ COLORI_INIT kept (reference data)');
console.log('✓ SISTEMI_INIT kept (reference data)');

// 2. Find and empty EVENTS if they exist as init
const evInit = c.indexOf('const EVENTS_INIT');
if (evInit !== -1) {
  replaceInit('EVENTS_INIT', '[]');
}
// Also check for inline events array in useState
const evState = c.match(/const \[events, setEvents\] = useState[^;]*;/);
if (evState) {
  const evMatch = evState[0];
  if (evMatch.includes('EVENTS_INIT') || evMatch.includes('[{')) {
    c = c.replace(evMatch, 'const [events, setEvents] = useState([]);');
    console.log('✓ events state emptied');
  }
}

// 3. REMOVE OLD ONBOARDING WIZARD + TOUR
const wizStart = c.indexOf('{/* === ONBOARDING WIZARD === */}');
if (wizStart !== -1) {
  // Find tour end
  const tourStart = c.indexOf('{/* === TOUR === */}', wizStart);
  if (tourStart !== -1) {
    // Find closing of tour block - it ends before {!selectedVano or <div style={S.tabBar}
    let searchFrom = tourStart;
    // Look for the next line that starts a new JSX block after tour
    const afterTour = c.indexOf('\n      {!selectedVano', searchFrom);
    const afterTour2 = c.indexOf('\n      <div style={S.tabBar}>', searchFrom);
    let tourEnd = afterTour !== -1 ? afterTour : afterTour2;
    if (tourEnd !== -1) {
      c = c.substring(0, wizStart) + c.substring(tourEnd);
      console.log('✓ Old wizard + tour removed');
    }
  }
} else {
  console.log('No old wizard found');
}

// 4. REMOVE OLD ONBOARDING STATES
const oldStates = [
  /\/\/ === ONBOARDING ===\n[^\n]*onbStep[^\n]*\n[^\n]*onbData[^\n]*\n[^\n]*tourStep[^\n]*\n[^\n]*tourDone[^\n]*\n[^\n]*React\.useEffect[^\n]*onboarded[^\n]*\n\n/,
];
for (const pat of oldStates) {
  if (c.match(pat)) {
    c = c.replace(pat, '');
    console.log('✓ Old onboarding states removed');
  }
}
// Also try simpler pattern
if (c.includes('const [onbStep, setOnbStep]')) {
  // Remove line by line
  const lines = c.split('\n');
  const filtered = lines.filter(l => {
    if (l.includes('const [onbStep,')) return false;
    if (l.includes('const [onbData,')) return false;
    if (l.includes('const [tourStep,')) return false;
    if (l.includes('const tourDone')) return false;
    if (l.includes("mastro:onboarded") && l.includes('useEffect')) return false;
    return true;
  });
  c = filtered.join('\n');
  console.log('✓ Old onboarding state lines removed');
}

// 5. ADD NEW ONBOARDING STATES (comprehensive)
const stateAnchor = '// Advance fase notification';
if (c.indexOf(stateAnchor) === -1) {
  console.error('ERROR: state anchor not found');
  process.exit(1);
}

const newStates = `// === ONBOARDING V2 ===
  const [onbStep, setOnbStep] = useState(0);
  const [onbData, setOnbData] = useState({
    aziendaNome: "", aziendaTel: "", aziendaEmail: "", aziendaPIVA: "", aziendaIndirizzo: "",
    clienteNome: "", clienteCognome: "", clienteTel: "", clienteEmail: "", clienteIndirizzo: "",
    cmTitolo: "", cmIndirizzo: "", cmTipo: "sostituzione",
    evTesto: "", evData: new Date().toISOString().split("T")[0], evOra: "09:00"
  });
  const [tourStep, setTourStep] = useState(0);
  const tourDone = () => { try { localStorage.setItem("mastro:onboarded", "1"); } catch(e){} setOnbStep(99); };
  React.useEffect(() => { try { if (!localStorage.getItem("mastro:onboarded")) setOnbStep(1); else setOnbStep(99); } catch(e){ setOnbStep(99); } }, []);

  // Onboarding completion handler
  const finishOnboarding = () => {
    // Create real client contact
    const newContact = {
      id: Date.now(),
      nome: (onbData.clienteNome + " " + onbData.clienteCognome).trim(),
      tipo: "cliente",
      tel: onbData.clienteTel,
      email: onbData.clienteEmail,
      preferito: true,
      canali: [onbData.clienteTel ? "whatsapp" : "", onbData.clienteEmail ? "email" : ""].filter(Boolean),
      cm: "CM-0001"
    };
    if (newContact.nome) setContatti(prev => [...prev, newContact]);

    // Create real commessa
    const newCantiere = {
      id: Date.now(),
      code: "CM-0001",
      cliente: onbData.clienteNome || "Nuovo",
      cognome: onbData.clienteCognome || "Cliente",
      indirizzo: onbData.cmIndirizzo || onbData.clienteIndirizzo || "",
      fase: "sopralluogo",
      sistema: "",
      tipo: onbData.cmTipo || "sostituzione",
      telefono: onbData.clienteTel || "",
      difficoltaSalita: "", mezzoSalita: "", pianoEdificio: "", foroScale: "",
      note: "",
      euro: 0,
      scadenza: (() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split("T")[0]; })(),
      rilievi: [],
      allegati: [],
      creato: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      aggiornato: "oggi",
      log: [{ chi: onbData.aziendaNome || "Tu", cosa: "creato la commessa", quando: "Adesso", color: "#007aff" }]
    };
    if (onbData.cmTitolo) {
      newCantiere.note = onbData.cmTitolo;
      setCantieri(prev => [...prev, newCantiere]);
    }

    // Create real event
    if (onbData.evTesto) {
      setEvents(prev => [...prev, {
        id: Date.now() + 1,
        text: onbData.evTesto,
        time: onbData.evOra || "09:00",
        date: onbData.evData || new Date().toISOString().split("T")[0],
        tipo: "appuntamento",
        cm: onbData.cmTitolo ? "CM-0001" : "",
        persona: (onbData.clienteNome + " " + onbData.clienteCognome).trim(),
        color: T.acc,
        addr: onbData.cmIndirizzo || ""
      }]);
    }

    // Save azienda info
    setAziendaInfo(prev => ({
      ...prev,
      ragione: onbData.aziendaNome,
      telefono: onbData.aziendaTel,
      email: onbData.aziendaEmail,
      piva: onbData.aziendaPIVA,
      indirizzo: onbData.aziendaIndirizzo,
    }));

    // Update team with real name
    if (onbData.aziendaNome) {
      setTeam(prev => prev.map((t, i) => i === 0 ? { ...t, nome: onbData.aziendaNome } : t));
    }

    // Start tour
    setOnbStep(5);
    setTourStep(1);
  };

  `;

c = c.replace(stateAnchor, newStates + stateAnchor);
console.log('✓ New onboarding states + finishOnboarding() added');

// 6. ADD NEW WIZARD + TOUR UI
const tabBarAnchor = '{!selectedVano && (';
const tabBarIdx = c.lastIndexOf(tabBarAnchor);
if (tabBarIdx === -1) {
  console.error('ERROR: tabBar anchor not found');
  process.exit(1);
}

const newWizardUI = `{/* === ONBOARDING WIZARD V2 === */}
      {onbStep >= 1 && onbStep <= 4 && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:T.font }}>
          <div style={{ background:T.card||"#fff", borderRadius:20, width:"100%", maxWidth:420, maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ background:T.topbar||"#1A1A1C", padding:"20px 24px", borderRadius:"20px 20px 0 0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:T.acc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#fff" }}>M</div>
                <div>
                  <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>Configura MASTRO</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>Il tuo gestionale serramenti</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:4, marginTop:12 }}>{[1,2,3,4].map(s => (<div key={s} style={{ flex:1, height:3, borderRadius:2, background: s <= onbStep ? T.acc : "rgba(255,255,255,0.15)", transition:"all 0.3s" }}/>))}</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                {["\uD83C\uDFE2 Azienda","\uD83D\uDC64 Cliente","\uD83D\uDCC1 Commessa","\uD83D\uDCC5 Evento"].map((l,i) => (
                  <div key={i} style={{ fontSize:9, fontWeight:600, color: i+1 <= onbStep ? T.acc : "rgba(255,255,255,0.3)" }}>{l}</div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:"24px" }}>

              {/* STEP 1: AZIENDA */}
              {onbStep === 1 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"\uD83C\uDFE2"} La tua azienda</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Questi dati appariranno nei preventivi e documenti.</div>
                {[
                  {l:"Ragione sociale *",k:"aziendaNome",p:"Es: Serramenti Rossi SRL", auto:"organization"},
                  {l:"Partita IVA",k:"aziendaPIVA",p:"01234567890", auto:"off"},
                  {l:"Indirizzo sede",k:"aziendaIndirizzo",p:"Via Roma 1, 87100 Cosenza", auto:"street-address"},
                  {l:"Telefono",k:"aziendaTel",p:"+39 0984 123456", auto:"tel"},
                  {l:"Email",k:"aziendaEmail",p:"info@tuaazienda.it", auto:"email"},
                ].map(f => (<div key={f.k} style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>{f.l}</div><input autoComplete={f.auto} value={onbData[f.k]} onChange={e => setOnbData({...onbData,[f.k]:e.target.value})} placeholder={f.p} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>))}
                <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:12 }}>
                  <div onClick={() => tourDone()} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>Salta tutto</div>
                  <div onClick={() => { if(onbData.aziendaNome.trim()) setOnbStep(2); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background: onbData.aziendaNome.trim() ? T.acc : "#ccc", borderRadius:10, cursor:"pointer" }}>Avanti →</div>
                </div>
              </div>)}

              {/* STEP 2: PRIMO CLIENTE */}
              {onbStep === 2 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"\uD83D\uDC64"} Il tuo primo cliente</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Aggiungi un cliente reale per iniziare subito a lavorare.</div>
                {[
                  {l:"Nome *",k:"clienteNome",p:"Mario", auto:"given-name"},
                  {l:"Cognome *",k:"clienteCognome",p:"Rossi", auto:"family-name"},
                  {l:"Telefono",k:"clienteTel",p:"333 1234567", auto:"tel"},
                  {l:"Email",k:"clienteEmail",p:"mario.rossi@email.it", auto:"email"},
                  {l:"Indirizzo",k:"clienteIndirizzo",p:"Via Garibaldi 5, Cosenza", auto:"street-address"},
                ].map(f => (<div key={f.k} style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>{f.l}</div><input autoComplete={f.auto} value={onbData[f.k]} onChange={e => setOnbData({...onbData,[f.k]:e.target.value})} placeholder={f.p} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>))}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:12 }}>
                  <div onClick={() => setOnbStep(1)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>\u2039 Indietro</div>
                  <div onClick={() => { if(onbData.clienteNome.trim()) setOnbStep(3); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background: onbData.clienteNome.trim() ? T.acc : "#ccc", borderRadius:10, cursor:"pointer" }}>Avanti →</div>
                </div>
              </div>)}

              {/* STEP 3: PRIMA COMMESSA */}
              {onbStep === 3 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"\uD83D\uDCC1"} La prima commessa</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Un lavoro vero su cui stai lavorando o devi iniziare.</div>
                <div style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Descrizione lavoro *</div><input value={onbData.cmTitolo} onChange={e => setOnbData({...onbData,cmTitolo:e.target.value})} placeholder="Es: Sostituzione 4 finestre + portafinestra" style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                <div style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Indirizzo cantiere</div><input value={onbData.cmIndirizzo} onChange={e => setOnbData({...onbData,cmIndirizzo:e.target.value})} placeholder={onbData.clienteIndirizzo || "Via del cantiere, Città"} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:8 }}>Tipo di lavoro</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {[{id:"sostituzione",l:"\uD83D\uDD04 Sostituzione",d:"Rimuovi e installa"},{id:"nuova",l:"\uD83C\uDD95 Nuova costruzione",d:"Primo impianto"},{id:"riparazione",l:"\uD83D\uDD27 Riparazione",d:"Intervento su esistente"}].map(t => (
                      <div key={t.id} onClick={() => setOnbData({...onbData,cmTipo:t.id})} style={{ flex:1, padding:"10px 6px", borderRadius:10, border:"1.5px solid "+(onbData.cmTipo===t.id ? T.acc : (T.bdr||"#E5E3DE")), background: onbData.cmTipo===t.id ? (T.acc+"12") : "transparent", cursor:"pointer", textAlign:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color: onbData.cmTipo===t.id ? T.acc : T.sub }}>{t.l}</div>
                        <div style={{ fontSize:9, color:T.sub, marginTop:2 }}>{t.d}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:12 }}>
                  <div onClick={() => setOnbStep(2)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>\u2039 Indietro</div>
                  <div onClick={() => { if(onbData.cmTitolo.trim()) setOnbStep(4); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background: onbData.cmTitolo.trim() ? T.acc : "#ccc", borderRadius:10, cursor:"pointer" }}>Avanti →</div>
                </div>
              </div>)}

              {/* STEP 4: PRIMO EVENTO */}
              {onbStep === 4 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"\uD83D\uDCC5"} Primo appuntamento</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Quando vai dal cliente? Sopralluogo, consegna, posa...</div>
                <div style={{ marginBottom:12 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Cosa devi fare? *</div><input value={onbData.evTesto} onChange={e => setOnbData({...onbData,evTesto:e.target.value})} placeholder={"Es: Sopralluogo " + (onbData.clienteCognome || "cliente")} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Data</div><input type="date" value={onbData.evData} onChange={e => setOnbData({...onbData,evData:e.target.value})} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                  <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Ora</div><input type="time" value={onbData.evOra} onChange={e => setOnbData({...onbData,evOra:e.target.value})} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg||"#fff", color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                </div>
                {/* Summary card */}
                <div style={{ background:T.bg||"#f8f8f5", borderRadius:12, padding:14, marginBottom:12, border:"1px solid "+(T.bdr||"#E5E3DE") }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:8, textTransform:"uppercase" }}>Riepilogo</div>
                  <div style={{ fontSize:12, color:T.text, lineHeight:1.6 }}>
                    <div><b>Azienda:</b> {onbData.aziendaNome}</div>
                    <div><b>Cliente:</b> {onbData.clienteNome} {onbData.clienteCognome} {onbData.clienteTel && " · "+onbData.clienteTel}</div>
                    <div><b>Lavoro:</b> {onbData.cmTitolo}</div>
                    {onbData.cmIndirizzo && <div><b>Cantiere:</b> {onbData.cmIndirizzo}</div>}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                  <div onClick={() => setOnbStep(3)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>\u2039 Indietro</div>
                  <div onClick={() => { finishOnboarding(); }} style={{ padding:"12px 28px", fontSize:14, fontWeight:800, color:"#fff", background:"linear-gradient(135deg, "+T.acc+", #b06e00)", borderRadius:12, cursor:"pointer", boxShadow:"0 4px 12px rgba(208,128,8,0.3)" }}>\u2713 Crea tutto e inizia!</div>
                </div>
              </div>)}
            </div>
          </div>
        </div>
      )}
      {/* === TOUR V2 === */}
      {onbStep === 5 && tourStep >= 1 && tourStep <= 4 && (
        <div style={{ position:"fixed", inset:0, zIndex:99998, background:"rgba(0,0,0,0.4)" }} onClick={() => { if(tourStep<4) setTourStep(tourStep+1); else tourDone(); }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"fixed", zIndex:99999, ...(tourStep===1?{bottom:80,left:16}:tourStep===2?{bottom:80,left:"50%",transform:"translateX(-50%)"}:tourStep===3?{bottom:80,right:16}:{top:"50%",left:"50%",transform:"translate(-50%,-50%)"}), background:"#fff", borderRadius:16, padding:"16px 20px", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", maxWidth:320, width:"calc(100% - 32px)" }}>
            <div style={{ fontSize:15, fontWeight:800, color:T.text||"#1A1A1C", marginBottom:6 }}>{tourStep===1?"\uD83C\uDFE0 Home":tourStep===2?"\uD83D\uDCC5 Agenda":tourStep===3?"\uD83D\uDCC1 Commesse":"\u2728 Tutto pronto!"}</div>
            <div style={{ fontSize:12, color:T.sub||"#6B6B6B", lineHeight:1.6 }}>{tourStep===1?"La tua dashboard: appuntamenti del giorno, allerte commesse ferme, calendario a colpo d\u2019occhio.":tourStep===2?"Tutti i tuoi impegni in vista giorno, settimana o mese. Swipe per navigare.":tourStep===3?"Ogni commessa è un lavoro: dal sopralluogo alla posa. Qui gestisci tutto.":"Hai creato la tua prima commessa! Vai in Commesse per aggiungere i vani da misurare."}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
              <div style={{ fontSize:10, color:T.sub||"#6B6B6B" }}>{tourStep}/4</div>
              <div onClick={() => { if(tourStep<4) setTourStep(tourStep+1); else tourDone(); }} style={{ padding:"8px 20px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc||"#D08008", borderRadius:10, cursor:"pointer" }}>{tourStep<4?"Avanti →":"Inizia! \uD83D\uDE80"}</div>
            </div>
            {tourStep<=3 && <div style={{ position:"absolute", bottom:-8, ...(tourStep===1?{left:24}:tourStep===2?{left:"50%",transform:"translateX(-50%)"}:{right:24}), width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>}
          </div>
        </div>
      )}
      `;

c = c.substring(0, tabBarIdx) + newWizardUI + c.substring(tabBarIdx);
console.log('✓ New wizard + tour UI added');

fs.writeFileSync(file, c);
console.log('\n\u2705 RESET COMPLETO!');
console.log('Lines: ' + c.split('\n').length);
console.log('');
console.log('Per testare:');
console.log('1. localStorage.removeItem("mastro:onboarded") nel browser console');
console.log('2. Ricarica la pagina');
console.log('3. npm run dev');
