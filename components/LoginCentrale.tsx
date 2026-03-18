"use client";
// @ts-nocheck
// MASTRO — LoginCentrale.tsx
// Login unificato: email/password titolare OPPURE PIN operatore
// Dopo login legge il ruolo e fa redirect all'app giusta

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0";
const FF="Inter,system-ui,sans-serif";

// Mappa locale ruolo → URL app (fallback se DB non raggiungibile)
const RUOLO_APP: Record<string,string> = {
  titolare:           "/dashboard",
  preventivista:      "/dashboard",
  admin:              "/dashboard",
  tecnico_misure:     "https://mastro-misure.vercel.app",
  montatore:          "https://mastro-montaggi.vercel.app",
  magazziniere:       "https://mastro-magazzino.vercel.app",
  operaio_produzione: "https://mastro-produzione.vercel.app",
  agente:             "https://mastro-rete.vercel.app",
};

const RUOLO_LABEL: Record<string,string> = {
  titolare:"Titolare / Direzione", preventivista:"Preventivista",
  tecnico_misure:"Tecnico Misure", montatore:"Montatore",
  magazziniere:"Magazziniere", operaio_produzione:"Operaio Produzione",
  agente:"Agente Vendita", admin:"Admin",
};

type LoginMode = "scelta" | "email" | "pin";

export default function LoginCentrale() {
  const [mode, setMode]       = useState<LoginMode>("scelta");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin]         = useState("");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore]   = useState("");
  const [checking, setChecking] = useState(true);

  // Se già loggato → redirect
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session) redirectByRole(session.user.id);
      else setChecking(false);
    });
  },[]);

  const redirectByRole = async (userId: string) => {
    try {
      // Leggi ruolo da profili
      const { data: profilo } = await supabase
        .from("profili").select("ruolo, azienda_id").eq("user_id", userId).single();
      const ruolo = profilo?.ruolo || "titolare";
      const url = RUOLO_APP[ruolo] || "/dashboard";
      if(url.startsWith("http")) window.location.href = url;
      else window.location.href = url;
    } catch {
      window.location.href = "/dashboard";
    }
  };

  const loginEmail = async () => {
    if(!email || !password) return setErrore("Inserisci email e password");
    setLoading(true); setErrore("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if(error) throw error;
      await redirectByRole(data.user.id);
    } catch(e:any) {
      setErrore(e.message?.includes("Invalid")?"Email o password errati":e.message||"Errore login");
    } finally { setLoading(false); }
  };

  const loginPIN = async () => {
    if(pin.length < 4) return;
    setLoading(true); setErrore("");
    try {
      // Cerca azienda dal subdominio o usa prima azienda disponibile
      const { data, error } = await supabase
        .rpc("verifica_pin_operatore", {
          p_azienda_id: (window as any).__MASTRO_AZIENDA_ID__ || null,
          p_pin: pin
        });

      if(error || !data?.length) {
        setErrore("PIN non riconosciuto"); setPin(""); setLoading(false); return;
      }

      const op = data[0];
      // Salva operatore in sessionStorage
      sessionStorage.setItem("mastro_operatore", JSON.stringify(op));
      sessionStorage.setItem("mastro_ruolo", op.ruolo);

      const url = op.app_url || RUOLO_APP[op.ruolo] || "/dashboard";
      if(url.startsWith("http") && url !== window.location.origin) {
        window.location.href = url + "?pin=" + pin + "&op=" + encodeURIComponent(op.nome);
      } else {
        window.location.href = "/dashboard";
      }
    } catch(e:any) {
      setErrore("Errore di connessione"); setPin("");
    } finally { setLoading(false); }
  };

  const pressPin = (n:string) => {
    if(loading) return;
    if(n==="⌫") { setPin(p=>p.slice(0,-1)); setErrore(""); return; }
    if(pin.length>=4) return;
    const p = pin+n; setPin(p); setErrore("");
    if(p.length===4) { setTimeout(()=>loginPIN(),300); }
  };

  if(checking) return (
    <div style={{minHeight:"100vh",background:DARK,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FF}}>
      <div style={{textAlign:"center" as any}}>
        <div style={{width:48,height:48,borderRadius:12,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff",margin:"0 auto 16px"}}>M</div>
        <div style={{color:"rgba(255,255,255,0.4)",fontSize:13}}>Caricamento...</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:DARK,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",padding:20,fontFamily:FF}}>

      {/* LOGO */}
      <div style={{textAlign:"center" as any,marginBottom:36}}>
        <div style={{width:56,height:56,borderRadius:14,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",margin:"0 auto 14px"}}>M</div>
        <div style={{fontSize:22,fontWeight:800,color:"#fff",letterSpacing:2}}>MASTRO</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:4}}>Suite gestionale serramentisti</div>
      </div>

      {/* SCELTA MODALITA */}
      {mode==="scelta"&&(
        <div style={{width:"100%",maxWidth:340}}>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",textAlign:"center" as any,marginBottom:20}}>Scegli come accedere</div>
          <div style={{display:"flex",flexDirection:"column" as any,gap:12}}>
            <button onClick={()=>setMode("email")}
              style={{padding:"16px 20px",borderRadius:14,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:FF,textAlign:"left" as any,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:40,height:40,borderRadius:10,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style={{fontWeight:600}}>Titolare / Ufficio</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>Email e password — accesso completo</div>
              </div>
            </button>
            <button onClick={()=>setMode("pin")}
              style={{padding:"16px 20px",borderRadius:14,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",fontFamily:FF,textAlign:"left" as any,display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:40,height:40,borderRadius:10,background:BLUE,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <div>
                <div style={{fontWeight:600}}>Operaio / Tecnico / Agente</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>PIN 4 cifre — accesso rapido</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* LOGIN EMAIL */}
      {mode==="email"&&(
        <div style={{width:"100%",maxWidth:340}}>
          <button onClick={()=>{setMode("scelta");setErrore("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,marginBottom:20,padding:0,fontFamily:FF,display:"flex",alignItems:"center",gap:6}}>
            ‹ Indietro
          </button>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Email</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="fabio@walterserramenti.it" autoComplete="email"
              style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${errore?"rgba(220,68,68,0.5)":"rgba(255,255,255,0.12)"}`,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:14,outline:"none",fontFamily:FF}}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Password</div>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="••••••••"
              onKeyDown={e=>{if(e.key==="Enter")loginEmail();}}
              style={{width:"100%",padding:"12px 14px",borderRadius:10,border:`1px solid ${errore?"rgba(220,68,68,0.5)":"rgba(255,255,255,0.12)"}`,background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:14,outline:"none",fontFamily:FF}}/>
          </div>
          {errore&&<div style={{color:RED,fontSize:13,marginBottom:14,textAlign:"center" as any}}>{errore}</div>}
          <button onClick={loginEmail} disabled={loading}
            style={{width:"100%",padding:"14px",borderRadius:12,background:loading?"rgba(26,158,115,0.5)":TEAL,color:"#fff",border:"none",fontSize:15,fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:FF}}>
            {loading?"Accesso in corso...":"Accedi →"}
          </button>
        </div>
      )}

      {/* LOGIN PIN */}
      {mode==="pin"&&(
        <div style={{width:"100%",maxWidth:300,display:"flex",flexDirection:"column" as any,alignItems:"center"}}>
          <button onClick={()=>{setMode("scelta");setPin("");setErrore("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,marginBottom:20,padding:0,fontFamily:FF,alignSelf:"flex-start",display:"flex",alignItems:"center",gap:6}}>
            ‹ Indietro
          </button>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:20,textAlign:"center" as any}}>Inserisci il tuo PIN</div>
          {/* Dots */}
          <div style={{display:"flex",gap:14,marginBottom:28}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<pin.length?BLUE:"rgba(255,255,255,0.15)",transition:"background .15s"}}/>
            ))}
          </div>
          {errore&&<div style={{color:RED,fontSize:13,marginBottom:14,textAlign:"center" as any}}>{errore}</div>}
          {/* Tastiera */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,width:"100%"}}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((n,i)=>(
              <div key={i} onClick={()=>{if(n)pressPin(n);}}
                style={{height:64,borderRadius:14,background:n?"rgba(255,255,255,0.08)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:n==="⌫"?20:22,fontWeight:500,color:loading?"rgba(255,255,255,0.3)":"#fff",cursor:n&&!loading?"pointer":"default",userSelect:"none" as any,transition:"background .1s"}}
                onTouchStart={e=>{if(n&&!loading)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.15)";}}
                onTouchEnd={e=>{if(n)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.08)";}}
              >{n}</div>
            ))}
          </div>
          {loading&&<div style={{color:TEAL,fontSize:13,marginTop:16}}>Verifica in corso...</div>}
        </div>
      )}

      {/* Footer */}
      <div style={{position:"fixed" as any,bottom:20,fontSize:11,color:"rgba(255,255,255,0.15)"}}>
        MASTRO Suite · GALASSIA MASTRO
      </div>
    </div>
  );
}
