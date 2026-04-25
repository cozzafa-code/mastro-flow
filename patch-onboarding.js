// patch-onboarding.js v3
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// Step 1: Add states if not already present
if (!c.includes('onbStep')) {
  const stateAnchor = '// Advance fase notification';
  if (c.indexOf(stateAnchor) === -1) { console.error('ERROR: state anchor not found'); process.exit(1); }
  const states = '// === ONBOARDING ===\n  const [onbStep, setOnbStep] = useState(0);\n  const [onbData, setOnbData] = useState({ aziendaNome:"", aziendaTel:"", aziendaEmail:"", clienteNome:"", clienteTel:"", clienteIndirizzo:"", cmTitolo:"", cmIndirizzo:"", cmTipo:"nuova", evTesto:"", evData:"", evOra:"" });\n  const [tourStep, setTourStep] = useState(0);\n  const tourDone = () => { try { localStorage.setItem("mastro:onboarded","1"); } catch(e){} setOnbStep(99); };\n  React.useEffect(() => { try { if (!localStorage.getItem("mastro:onboarded")) setOnbStep(1); else setOnbStep(99); } catch(e){ setOnbStep(99); } }, []);\n\n  ';
  c = c.replace(stateAnchor, states + stateAnchor);
  console.log('1/2 States added');
} else {
  console.log('1/2 States already present');
}

// Step 2: Add wizard+tour UI before tabBar
const navAnchor = '<div style={S.tabBar}>';
const navIdx = c.indexOf(navAnchor);
if (navIdx === -1) { console.error('ERROR: S.tabBar not found'); process.exit(1); }

// Check if already patched
if (c.includes('ONBOARDING WIZARD')) {
  console.log('Already patched! Skipping UI.');
  process.exit(0);
}

const ui = `
      {/* === ONBOARDING WIZARD === */}
      {onbStep >= 1 && onbStep <= 4 && (
        <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(0,0,0,0.6)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:T.font }}>
          <div style={{ background:T.card, borderRadius:20, width:"100%", maxWidth:420, maxHeight:"90vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ background:T.topbar||"#1A1A1C", padding:"20px 24px", borderRadius:"20px 20px 0 0" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:T.acc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:900, color:"#fff" }}>M</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>Benvenuto in MASTRO!</div>
              </div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>Configuriamo tutto in 2 minuti</div>
              <div style={{ display:"flex", gap:4, marginTop:12 }}>{[1,2,3,4].map(s => (<div key={s} style={{ flex:1, height:3, borderRadius:2, background: s <= onbStep ? T.acc : "rgba(255,255,255,0.15)", transition:"all 0.3s" }}/>))}</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                {["🏢 Azienda","👤 Cliente","📁 Commessa","📅 Evento"].map((l,i) => (
                  <div key={i} style={{ fontSize:9, fontWeight:600, color: i+1 <= onbStep ? T.acc : "rgba(255,255,255,0.3)" }}>{l}</div>
                ))}
              </div>
            </div>
            <div style={{ padding:"24px" }}>
              {onbStep === 1 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"🏢"} La tua azienda</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Questi dati appariranno nei preventivi.</div>
                {[{l:"Nome azienda *",k:"aziendaNome",p:"Es: Serramenti Rossi SRL"},{l:"Telefono",k:"aziendaTel",p:"+39 0984..."},{l:"Email",k:"aziendaEmail",p:"info@tuaazienda.it"}].map(f => (<div key={f.k} style={{ marginBottom:14 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>{f.l}</div><input value={onbData[f.k]} onChange={e => setOnbData({...onbData,[f.k]:e.target.value})} placeholder={f.p} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>))}
                <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
                  <div onClick={() => tourDone()} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>Salta tutto</div>
                  <div onClick={() => { if(onbData.aziendaNome.trim()){setAziendaInfo(prev=>({...prev,ragione:onbData.aziendaNome,telefono:onbData.aziendaTel,email:onbData.aziendaEmail}));setOnbStep(2);} }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
                </div>
              </div>)}
              {onbStep === 2 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"👤"} Il tuo primo cliente</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Aggiungi un cliente per iniziare.</div>
                {[{l:"Nome e cognome *",k:"clienteNome",p:"Es: Mario Rossi"},{l:"Telefono",k:"clienteTel",p:"333 1234567"},{l:"Indirizzo",k:"clienteIndirizzo",p:"Via Roma 1, Cosenza"}].map(f => (<div key={f.k} style={{ marginBottom:14 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>{f.l}</div><input value={onbData[f.k]} onChange={e => setOnbData({...onbData,[f.k]:e.target.value})} placeholder={f.p} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>))}
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                  <div onClick={() => setOnbStep(1)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>‹ Indietro</div>
                  <div onClick={() => { if(onbData.clienteNome.trim()) setOnbStep(3); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
                </div>
              </div>)}
              {onbStep === 3 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"📁"} La tua prima commessa</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Un lavoro in corso o un nuovo preventivo.</div>
                <div style={{ marginBottom:14 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Titolo commessa *</div><input value={onbData.cmTitolo} onChange={e => setOnbData({...onbData,cmTitolo:e.target.value})} placeholder="Es: Sostituzione finestre Villa Rossi" style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                <div style={{ marginBottom:14 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Indirizzo cantiere</div><input value={onbData.cmIndirizzo} onChange={e => setOnbData({...onbData,cmIndirizzo:e.target.value})} placeholder="Via Garibaldi 5, Rende" style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:8 }}>Tipo lavoro</div>
                  <div style={{ display:"flex", gap:8 }}>
                    {[{id:"nuova",l:"🆕 Nuova"},{id:"sostituzione",l:"🔄 Sostituzione"},{id:"riparazione",l:"🔧 Riparazione"}].map(t => (
                      <div key={t.id} onClick={() => setOnbData({...onbData,cmTipo:t.id})} style={{ flex:1, padding:"10px 8px", borderRadius:10, border:"1.5px solid "+(onbData.cmTipo===t.id ? T.acc : (T.bdr||"#E5E3DE")), background: onbData.cmTipo===t.id ? (T.accLt||T.acc+"10") : T.card, cursor:"pointer", textAlign:"center", fontSize:11, fontWeight:600, color: onbData.cmTipo===t.id ? T.acc : T.sub }}>{t.l}</div>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                  <div onClick={() => setOnbStep(2)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>‹ Indietro</div>
                  <div onClick={() => { if(onbData.cmTitolo.trim()) setOnbStep(4); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Avanti →</div>
                </div>
              </div>)}
              {onbStep === 4 && (<div>
                <div style={{ fontSize:18, fontWeight:800, color:T.text, marginBottom:4 }}>{"📅"} Il tuo primo appuntamento</div>
                <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>Sopralluogo, consegna, o qualsiasi impegno.</div>
                <div style={{ marginBottom:14 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Descrizione *</div><input value={onbData.evTesto} onChange={e => setOnbData({...onbData,evTesto:e.target.value})} placeholder="Es: Sopralluogo Villa Rossi" style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                <div style={{ display:"flex", gap:12, marginBottom:14 }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Data</div><input type="date" value={onbData.evData} onChange={e => setOnbData({...onbData,evData:e.target.value})} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                  <div style={{ flex:1 }}><div style={{ fontSize:11, fontWeight:600, color:T.sub, marginBottom:4 }}>Ora</div><input type="time" value={onbData.evOra} onChange={e => setOnbData({...onbData,evOra:e.target.value})} style={{ width:"100%", padding:"10px 14px", fontSize:14, border:"1.5px solid "+(T.bdr||"#E5E3DE"), borderRadius:10, background:T.bg, color:T.text, outline:"none", boxSizing:"border-box" }} /></div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
                  <div onClick={() => setOnbStep(3)} style={{ padding:"10px 16px", fontSize:12, fontWeight:600, color:T.sub, cursor:"pointer" }}>‹ Indietro</div>
                  <div onClick={() => { if(onbData.evTesto.trim()){ setEvents(prev=>[...prev,{id:Date.now(),text:onbData.evTesto,time:onbData.evOra||"09:00",date:onbData.evData||new Date().toISOString().split("T")[0],tipo:"appuntamento",cm:"",persona:"",color:T.acc,addr:onbData.cmIndirizzo||""}]); } setOnbStep(5);setTourStep(1); }} style={{ padding:"10px 24px", fontSize:13, fontWeight:700, color:"#fff", background:T.acc, borderRadius:10, cursor:"pointer" }}>Completa ✓</div>
                </div>
              </div>)}
            </div>
          </div>
        </div>
      )}
      {/* === TOUR === */}
      {onbStep === 5 && tourStep >= 1 && tourStep <= 4 && (
        <div style={{ position:"fixed", inset:0, zIndex:99998, background:"rgba(0,0,0,0.4)" }} onClick={() => { if(tourStep<4) setTourStep(tourStep+1); else tourDone(); }}>
          <div onClick={e => e.stopPropagation()} style={{ position:"fixed", zIndex:99999, ...(tourStep===1?{bottom:80,left:16}:tourStep===2?{bottom:80,left:"50%",transform:"translateX(-50%)"}:tourStep===3?{bottom:80,right:16}:{top:80,left:16,right:16}), background:"#fff", borderRadius:16, padding:"16px 20px", boxShadow:"0 8px 32px rgba(0,0,0,0.2)", maxWidth:300 }}>
            <div style={{ fontSize:14, fontWeight:800, color:T.text||"#1A1A1C", marginBottom:4 }}>{tourStep===1?"🏠 Home":tourStep===2?"📅 Agenda":tourStep===3?"📁 Commesse":"✨ Tutto pronto!"}</div>
            <div style={{ fontSize:12, color:T.sub||"#6B6B6B", lineHeight:1.5 }}>{tourStep===1?"Qui trovi il riepilogo della giornata: appuntamenti, allerte e calendario.":tourStep===2?"L’agenda mostra tutti gli impegni. Puoi vedere giorno, settimana o mese.":tourStep===3?"Le commesse sono il cuore di MASTRO. Qui gestisci ogni lavoro dalla richiesta alla posa.":"Hai configurato tutto! Ora esplora MASTRO liberamente."}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
              <div style={{ fontSize:10, color:T.sub||"#6B6B6B" }}>{tourStep}/4</div>
              <div onClick={() => { if(tourStep<4) setTourStep(tourStep+1); else tourDone(); }} style={{ padding:"6px 16px", fontSize:12, fontWeight:700, color:"#fff", background:T.acc||"#D08008", borderRadius:8, cursor:"pointer" }}>{tourStep<4?"Avanti →":"Inizia! 🚀"}</div>
            </div>
            {tourStep<=3 && <div style={{ position:"absolute", bottom:-8, ...(tourStep===1?{left:24}:tourStep===2?{left:"50%",transform:"translateX(-50%)"}:{right:24}), width:0, height:0, borderLeft:"8px solid transparent", borderRight:"8px solid transparent", borderTop:"8px solid #fff" }}/>}
          </div>
        </div>
      )}
      `;

c = c.substring(0, navIdx) + ui + c.substring(navIdx);
console.log('2/2 Wizard + Tour UI added before S.tabBar');

fs.writeFileSync(file, c);
console.log('✅ Onboarding completo! Righe: ' + c.split('\n').length);
console.log('Fai: npm run dev');
console.log('Per ritestare: localStorage.removeItem("mastro:onboarded") in console browser');
