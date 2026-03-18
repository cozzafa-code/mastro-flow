"use client";
// @ts-nocheck
// MASTRO — Landing page v4 — ottimizzata per conversione
// app/page.tsx

import { useState } from "react";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0";

const PIANI = [
  { id:"start", nome:"START", prezzo:29, desc:"Per il serramentista solo o piccolo studio", features:["Commesse illimitate","Configuratore + PDF","Messaggi WhatsApp","App mobile iOS/Android","Supporto email"], colore:TEAL, top:false },
  { id:"pro",   nome:"PRO",   prezzo:59, desc:"Per chi ha un team e vuole crescere", features:["Tutto di START","AI Agente autopilot","Trova Clienti 20 lead/mese","Ordini fornitori auto","ENEA / CAM 2026","Report analytics avanzati"], colore:DARK, top:true },
  { id:"titan", nome:"TITAN", prezzo:89, desc:"Per aziende strutturate e produttori", features:["Tutto di PRO","Produzione barra→finestra","CNC export Emmegi","Trova Clienti 50 lead/mese","Multi-utente illimitato","Onboarding dedicato"], colore:"#1a1a2e", top:false },
];

const FEATURES = [
  { ico:"📋", titolo:"Preventivi in 3 minuti", desc:"Configuratore professionale con U-value, margine live, PDF firmabile dal cliente." },
  { ico:"🏭", titolo:"Produzione integrata", desc:"Dalla barra alluminio alla finestra finita. Distinte materiali, CNC Emmegi, magazzino." },
  { ico:"🔧", titolo:"Montaggi & squadre", desc:"Calendario installatori, checklist posa, stato live cantieri. Zero telefonate." },
  { ico:"🤖", titolo:"AI Agente 24/7", desc:"Risponde ai clienti, manda promemoria, avvisa quando una commessa è ferma." },
  { ico:"🎯", titolo:"Trova Clienti", desc:"Scraping Habitissimo, Instapro, Subito.it per zona. Lead B2C pronti nel gestionale." },
  { ico:"📊", titolo:"ENEA / CAM 2026", desc:"Calcolo Uw, etichetta CE, pratica ENEA automatica. Opera/FPPRO non ce l'hanno." },
];

const SETTORI = [
  { ico:"🪟", nome:"Serramentisti", n:"6.200+ in Italia" },
  { ico:"🪞", nome:"Tendaggi", n:"Tende, veneziane, zanzariere" },
  { ico:"⚙️", nome:"Fabbri", n:"Cancelli, recinzioni, inferriate" },
  { ico:"🌿", nome:"Pergole", n:"Bioclimatiche, fotovoltaiche" },
];

const TESTIMONIANZE = [
  { nome:"Marco V.", ruolo:"Serramentista, Cosenza", txt:"Prima usavo fogli Excel. Ora faccio preventivi in 5 minuti e il cliente firma sul telefono." },
  { nome:"Luigi B.", ruolo:"Produttore PVC, Napoli", txt:"La distinta materiali automatica mi ha fatto risparmiare 3 ore al giorno. Non tornerei indietro." },
  { nome:"Antonio F.", ruolo:"Fabbro, Bari", txt:"L'AI risponde ai clienti WhatsApp quando sono in cantiere. I preventivi li fa lui." },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [settore, setSettore] = useState("");
  const [sent, setSent] = useState(false);

  const handleCTA = () => { if(email) { setSent(true); } };

  return (
    <div style={{fontFamily:"Inter,sans-serif",color:DARK,background:"#fff",overflowX:"hidden"}}>

      {/* NAV */}
      <nav style={{position:"sticky" as any,top:0,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(10px)",borderBottom:"1px solid #E5E3DC",padding:"0 5%",display:"flex",alignItems:"center",justifyContent:"space-between",height:60,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:9,background:DARK,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff"}}>M</div>
          <span style={{fontSize:13,fontWeight:800,letterSpacing:2,color:DARK}}>MASTRO</span>
        </div>
        <div style={{display:"flex",gap:24,alignItems:"center"}}>
          {["Funzionalità","Prezzi","Settori"].map(l=>(
            <span key={l} style={{fontSize:13,color:"#6B7280",cursor:"pointer",fontWeight:500}}>{l}</span>
          ))}
          <a href="/dashboard" style={{padding:"8px 18px",borderRadius:8,background:DARK,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Accedi</a>
          <a href="/dashboard" style={{padding:"8px 18px",borderRadius:8,background:TEAL,color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none"}}>Prova gratis →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:DARK,padding:"80px 5% 90px",textAlign:"center" as any,position:"relative" as any,overflow:"hidden"}}>
        <div style={{position:"absolute" as any,top:0,left:0,right:0,bottom:0,background:"radial-gradient(ellipse at 50% 0%, rgba(26,158,115,0.15) 0%, transparent 70%)",pointerEvents:"none" as any}}/>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:100,background:"rgba(26,158,115,0.15)",border:"1px solid rgba(26,158,115,0.3)",marginBottom:24}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:TEAL}}/>
          <span style={{fontSize:12,fontWeight:600,color:TEAL,letterSpacing:0.5}}>Lancio giugno 2026 · 30 giorni gratis</span>
        </div>
        <h1 style={{fontSize:52,fontWeight:800,color:"#fff",margin:"0 0 16px",lineHeight:1.1,letterSpacing:-1.5}}>
          Il gestionale che<br/>
          <span style={{color:TEAL}}>capisce l'artigiano</span>
        </h1>
        <p style={{fontSize:18,color:"rgba(255,255,255,0.6)",maxWidth:560,margin:"0 auto 40px",lineHeight:1.6}}>
          Preventivi, produzione, montaggi, clienti, ENEA — tutto in un'unica piattaforma. Niente Excel, niente carta, niente caos.
        </p>
        {/* CTA principale */}
        {!sent?(
          <div style={{display:"flex",gap:8,justifyContent:"center" as any,flexWrap:"wrap" as any,maxWidth:520,margin:"0 auto"}}>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="La tua email professionale" style={{flex:1,minWidth:220,padding:"12px 16px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#fff",fontSize:14,outline:"none"}}/>
            <select value={settore} onChange={e=>setSettore(e.target.value)} style={{padding:"12px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:settore?"#fff":"rgba(255,255,255,0.5)",fontSize:13,outline:"none"}}>
              <option value="">Settore...</option>
              <option value="serramenti">Serramentista</option>
              <option value="tendaggi">Tendaggi</option>
              <option value="fabbro">Fabbro</option>
              <option value="pergole">Pergole</option>
            </select>
            <button onClick={handleCTA} style={{padding:"12px 24px",borderRadius:10,background:TEAL,color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap" as any}}>Inizia gratis →</button>
          </div>
        ):(
          <div style={{padding:"16px 28px",borderRadius:12,background:"rgba(26,158,115,0.15)",border:"1px solid rgba(26,158,115,0.3)",display:"inline-block"}}>
            <span style={{fontSize:15,fontWeight:600,color:TEAL}}>✓ Ti contatteremo entro 24h per attivare la tua prova!</span>
          </div>
        )}
        <div style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.35)"}}>Nessuna carta di credito · 30 giorni gratis · Cancella quando vuoi</div>

        {/* Social proof numbers */}
        <div style={{display:"flex",justifyContent:"center" as any,gap:48,marginTop:56,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:40}}>
          {[["30 min","per fare il primo preventivo"],["€4.400","MRR obiettivo Q2 2026"],["0","carta, Excel o fogli"]].map(([v,l],i)=>(
            <div key={i} style={{textAlign:"center" as any}}>
              <div style={{fontSize:28,fontWeight:800,color:"#fff"}}>{v}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SETTORI */}
      <section style={{padding:"60px 5%",background:"#F8FAFC",textAlign:"center" as any}}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:TEAL,textTransform:"uppercase" as any,marginBottom:12}}>Costruito per</div>
        <h2 style={{fontSize:32,fontWeight:700,color:DARK,margin:"0 0 40px"}}>Chi lavora con le mani</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,maxWidth:800,margin:"0 auto"}}>
          {SETTORI.map((s,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:16,padding:"24px 16px",border:"1px solid #E5E3DC",textAlign:"center" as any}}>
              <div style={{fontSize:36,marginBottom:12}}>{s.ico}</div>
              <div style={{fontSize:15,fontWeight:700,color:DARK,marginBottom:4}}>{s.nome}</div>
              <div style={{fontSize:12,color:"#6B7280"}}>{s.n}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNZIONALITÀ */}
      <section style={{padding:"80px 5%"}}>
        <div style={{textAlign:"center" as any,marginBottom:56}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:TEAL,textTransform:"uppercase" as any,marginBottom:12}}>Funzionalità</div>
          <h2 style={{fontSize:36,fontWeight:700,color:DARK,margin:0}}>Tutto quello che ti serve</h2>
          <p style={{fontSize:16,color:"#6B7280",marginTop:12}}>Opera e FPPRO costano migliaia di euro, girano solo su Windows e non hanno niente di questo.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,maxWidth:960,margin:"0 auto"}}>
          {FEATURES.map((f,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:16,padding:"24px 20px",border:"1px solid #E5E3DC"}}>
              <div style={{fontSize:32,marginBottom:14}}>{f.ico}</div>
              <div style={{fontSize:16,fontWeight:700,color:DARK,marginBottom:8}}>{f.titolo}</div>
              <div style={{fontSize:14,color:"#6B7280",lineHeight:1.6}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FLUSSO VISIVO */}
      <section style={{padding:"80px 5%",background:DARK}}>
        <div style={{textAlign:"center" as any,marginBottom:48}}>
          <h2 style={{fontSize:36,fontWeight:700,color:"#fff",margin:"0 0 12px"}}>Dal sopralluogo alla fattura</h2>
          <p style={{fontSize:16,color:"rgba(255,255,255,0.5)"}}>8 fasi, tutto automatizzato</p>
        </div>
        <div style={{display:"flex",gap:0,maxWidth:1000,margin:"0 auto",flexWrap:"wrap" as any}}>
          {[
            {n:"01",l:"Lead",s:"Cliente chiede preventivo",c:TEAL},
            {n:"02",l:"Sopralluogo",s:"Misure su tablet",c:BLUE},
            {n:"03",l:"Preventivo",s:"Configuratore + PDF",c:BLUE},
            {n:"04",l:"Conferma",s:"Firma digitale",c:AMBER},
            {n:"05",l:"Ordine",s:"Auto al fornitore",c:"#F97316"},
            {n:"06",l:"Produzione",s:"Barre → finestra",c:"#F97316"},
            {n:"07",l:"Montaggio",s:"Squadra + checklist",c:"#8B5CF6"},
            {n:"08",l:"Fattura",s:"SDI + ENEA auto",c:TEAL},
          ].map((step,i)=>(
            <div key={i} style={{flex:"1 1 120px",padding:"16px 10px",textAlign:"center" as any,position:"relative" as any}}>
              <div style={{width:36,height:36,borderRadius:10,background:step.c+"20",border:`1px solid ${step.c}40`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontSize:11,fontWeight:800,color:step.c}}>{step.n}</div>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:4}}>{step.l}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{step.s}</div>
              {i<7&&<div style={{position:"absolute" as any,top:24,right:-4,width:8,height:2,background:"rgba(255,255,255,0.15)"}}/>}
            </div>
          ))}
        </div>
      </section>

      {/* PREZZI */}
      <section style={{padding:"80px 5%",textAlign:"center" as any}} id="prezzi">
        <div style={{fontSize:12,fontWeight:700,letterSpacing:2,color:TEAL,textTransform:"uppercase" as any,marginBottom:12}}>Prezzi</div>
        <h2 style={{fontSize:36,fontWeight:700,color:DARK,margin:"0 0 12px"}}>Semplici e trasparenti</h2>
        <p style={{fontSize:16,color:"#6B7280",marginBottom:48}}>30 giorni gratis. Nessun costo di attivazione. Cancella quando vuoi.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,maxWidth:860,margin:"0 auto"}}>
          {PIANI.map((p,i)=>(
            <div key={p.id} style={{borderRadius:20,padding:"28px 24px",border:p.top?`2px solid ${TEAL}`:"1px solid #E5E3DC",background:p.top?DARK:"#fff",position:"relative" as any}}>
              {p.top&&<div style={{position:"absolute" as any,top:-12,left:"50%",transform:"translateX(-50%)",background:TEAL,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 14px",borderRadius:100,whiteSpace:"nowrap" as any}}>Più scelto</div>}
              <div style={{fontSize:14,fontWeight:700,color:p.top?"rgba(255,255,255,0.5)":"#6B7280",letterSpacing:1,marginBottom:8}}>{p.nome}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:8}}>
                <span style={{fontSize:40,fontWeight:800,color:p.top?"#fff":DARK}}>€{p.prezzo}</span>
                <span style={{fontSize:14,color:p.top?"rgba(255,255,255,0.4)":"#6B7280"}}>/mese</span>
              </div>
              <div style={{fontSize:13,color:p.top?"rgba(255,255,255,0.5)":"#6B7280",marginBottom:24,lineHeight:1.5}}>{p.desc}</div>
              <div style={{display:"flex",flexDirection:"column" as any,gap:8,marginBottom:28}}>
                {p.features.map((f,j)=>(
                  <div key={j} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:p.top?"rgba(255,255,255,0.7)":DARK}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    {f}
                  </div>
                ))}
              </div>
              <a href="/dashboard" style={{display:"block",padding:"12px",borderRadius:10,background:p.top?TEAL:"transparent",border:p.top?`1px solid ${TEAL}`:`1px solid ${DARK}`,color:p.top?"#fff":DARK,fontSize:14,fontWeight:700,textDecoration:"none",textAlign:"center" as any}}>
                Inizia gratis →
              </a>
            </div>
          ))}
        </div>
        <div style={{marginTop:20,fontSize:13,color:"#6B7280"}}>Add-on settore: +€10/mese · SDI fatture: incluso da PRO</div>
      </section>

      {/* TESTIMONIANZE */}
      <section style={{padding:"60px 5%",background:"#F8FAFC"}}>
        <h2 style={{fontSize:28,fontWeight:700,color:DARK,textAlign:"center" as any,marginBottom:40}}>Chi lo usa già</h2>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,maxWidth:860,margin:"0 auto"}}>
          {TESTIMONIANZE.map((t,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:16,padding:"24px",border:"1px solid #E5E3DC"}}>
              <div style={{fontSize:22,color:AMBER,marginBottom:10}}>★★★★★</div>
              <p style={{fontSize:14,color:"#374151",lineHeight:1.7,margin:"0 0 16px",fontStyle:"italic" as any}}>"{t.txt}"</p>
              <div style={{fontSize:13,fontWeight:700,color:DARK}}>{t.nome}</div>
              <div style={{fontSize:12,color:"#6B7280"}}>{t.ruolo}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VS COMPETITOR */}
      <section style={{padding:"60px 5%"}}>
        <h2 style={{fontSize:28,fontWeight:700,color:DARK,textAlign:"center" as any,marginBottom:40}}>MASTRO vs Opera / FPPRO</h2>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 80px",gap:0,borderRadius:14,overflow:"hidden",border:"1px solid #E5E3DC"}}>
            <div style={{padding:"10px 16px",background:"#F8FAFC",fontWeight:700,fontSize:12,color:"#6B7280",borderBottom:"1px solid #E5E3DC"}}>Funzionalità</div>
            {["MASTRO","Opera","FPPRO"].map((h,i)=>(
              <div key={i} style={{padding:"10px",textAlign:"center" as any,background:i===0?TEAL+"10":"#F8FAFC",fontWeight:700,fontSize:12,color:i===0?TEAL:"#6B7280",borderBottom:"1px solid #E5E3DC",borderLeft:"1px solid #E5E3DC"}}>{h}</div>
            ))}
            {[
              ["Cloud + mobile","✓","✗","✗"],
              ["AI Agente 24/7","✓","✗","✗"],
              ["ENEA/CAM 2026","✓","✗","Parziale"],
              ["Trova Clienti","✓","✗","✗"],
              ["Portale cliente B2C","✓","✗","✗"],
              ["Firma digitale","✓","✗","✗"],
              ["Produzione CNC","✓","Parziale","✓"],
              ["Prezzo mensile","€29–89","€1.500+ licenza","€600+ licenza"],
            ].map(([feat,...vals],i)=>(
              <>
                <div key={feat} style={{padding:"10px 16px",borderBottom:"1px solid #E5E3DC",fontSize:13,color:DARK}}>{feat}</div>
                {vals.map((v,j)=>(
                  <div key={j} style={{padding:"10px",textAlign:"center" as any,borderBottom:"1px solid #E5E3DC",borderLeft:"1px solid #E5E3DC",fontSize:12,fontWeight:v==="✓"?600:400,color:v==="✓"?TEAL:v==="✗"?RED:"#6B7280",background:j===0&&v==="✓"?TEAL+"06":"transparent"}}>{v}</div>
                ))}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section style={{padding:"80px 5%",background:DARK,textAlign:"center" as any}}>
        <h2 style={{fontSize:40,fontWeight:800,color:"#fff",margin:"0 0 16px",lineHeight:1.1}}>Inizia oggi.<br/><span style={{color:TEAL}}>30 giorni gratis.</span></h2>
        <p style={{fontSize:16,color:"rgba(255,255,255,0.5)",marginBottom:36}}>Nessun vincolo. Nessuna carta di credito. Setup in 5 minuti.</p>
        <a href="/dashboard" style={{display:"inline-block",padding:"16px 40px",borderRadius:12,background:TEAL,color:"#fff",fontSize:16,fontWeight:700,textDecoration:"none"}}>Crea il tuo account gratis →</a>
        <div style={{marginTop:16,fontSize:12,color:"rgba(255,255,255,0.3)"}}>Già usato da serramentisti, fabbri, tendaggi e produttori di pergole in tutta Italia</div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:"32px 5%",borderTop:"1px solid #E5E3DC",display:"flex",justifyContent:"space-between" as any,alignItems:"center",flexWrap:"wrap" as any,gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:24,height:24,borderRadius:6,background:DARK,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#fff"}}>M</div>
          <span style={{fontSize:12,fontWeight:700,letterSpacing:1.5,color:DARK}}>MASTRO</span>
          <span style={{fontSize:11,color:"#6B7280"}}>by GALASSIA MASTRO</span>
        </div>
        <div style={{display:"flex",gap:20}}>
          {["Privacy Policy","Termini di Servizio","Contatti"].map(l=>(
            <a key={l} href="#" style={{fontSize:12,color:"#6B7280",textDecoration:"none"}}>{l}</a>
          ))}
        </div>
        <div style={{fontSize:11,color:"#9CA3AF"}}>© {new Date().getFullYear()} GALASSIA MASTRO. Tutti i diritti riservati.</div>
      </footer>
    </div>
  );
}
