"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v9 — Widget personalizzabili
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

const DEFAULT_ORDER = ["da_fare", "azioni_rapide", "contabilita", "operatori", "agenda", "commesse"];
const LS_ORDER = "mastro_home_order";
const LS_HIDDEN = "mastro_home_hidden";

const WIDGET_META: Record<string, { label: string }> = {
  da_fare:      { label: "Da fare ora" },
  azioni_rapide:{ label: "Azioni rapide" },
  contabilita:  { label: "Contabilita'" },
  operatori:    { label: "Operatori oggi" },
  agenda:       { label: "Agenda oggi" },
  commesse:     { label: "Ultime commesse" },
};

const loadOrder  = (): string[] => { try { const s = localStorage.getItem(LS_ORDER);  return s ? JSON.parse(s) : DEFAULT_ORDER; } catch { return DEFAULT_ORDER; } };
const loadHidden = (): string[] => { try { const s = localStorage.getItem(LS_HIDDEN); return s ? JSON.parse(s) : []; }           catch { return []; } };

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IcoSun = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IcoDoc  = (p: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IcoMeas = (p: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.2" strokeLinecap="round"><path d="M4 20L10 8l4 8 4-5 4 9"/></svg>;
const IcoCal  = (p: any) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChev = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>;

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }: any) => (
  <div style={{ background: "white", borderRadius: 14, border: `1px solid ${BDR}`, boxShadow: "0 4px 0 0 #A8CCCC", padding: "13px 14px", ...style }}>{children}</div>
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

// Edit handle — frecce su/giu + rimuovi
const Handle = ({ editMode, id, isFirst, isLast, onUp, onDown, onRemove }: any) => {
  if (!editMode) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, padding: "6px 10px", background: "rgba(40,160,160,.08)", borderRadius: 10, border: `1.5px dashed ${T_CLR}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={onUp} disabled={isFirst} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: isFirst ? "#F0F0F0" : T_LIGHT, cursor: isFirst ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isFirst ? "#CCC" : T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M18 15l-6-6-6 6"/></svg>
          </button>
          <button onClick={onDown} disabled={isLast} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: isLast ? "#F0F0F0" : T_LIGHT, cursor: isLast ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={isLast ? "#CCC" : T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T_CLR }}>{WIDGET_META[id]?.label}</span>
      </div>
      <button onClick={onRemove} style={{ background: "#FFE4E4", border: "1px solid rgba(220,68,68,.3)", borderRadius: 7, padding: "4px 10px", fontSize: 11, fontWeight: 800, color: RED, cursor: "pointer" }}>Rimuovi</button>
    </div>
  );
};

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function HomePanel() {
  const {
    cantieri, events, problemi, fattureDB,
    sogliaDays, setTab, setSelectedCM,
    setShowProblemiView, setShowModal,
    giorniFermaCM, today,
  } = useMastro();

  const [showSpesa, setShowSpesa] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [hidden, setHidden] = useState<string[]>([]);

  useEffect(() => { setOrder(loadOrder()); setHidden(loadHidden()); }, []);
  useEffect(() => { try { localStorage.setItem(LS_ORDER, JSON.stringify(order)); } catch {} }, [order]);
  useEffect(() => { try { localStorage.setItem(LS_HIDDEN, JSON.stringify(hidden)); } catch {} }, [hidden]);

  const visible = order.filter(id => !hidden.includes(id));
  const addable = Object.keys(WIDGET_META).filter(id => hidden.includes(id));

  const moveUp   = (id: string) => setOrder(p => { const i = p.indexOf(id); if (i <= 0) return p; const n = [...p]; [n[i-1],n[i]]=[n[i],n[i-1]]; return n; });
  const moveDown = (id: string) => setOrder(p => { const i = p.indexOf(id); if (i >= p.length-1) return p; const n = [...p]; [n[i+1],n[i]]=[n[i],n[i+1]]; return n; });
  const remove   = (id: string) => setHidden(p => [...p, id]);
  const add      = (id: string) => { setHidden(p => p.filter(h => h !== id)); if (!order.includes(id)) setOrder(p => [...p, id]); setShowAdd(false); };
  const reset    = () => { setOrder(DEFAULT_ORDER); setHidden([]); };

  // dati
  const todayISO = today.toISOString().split("T")[0];
  const h = today.getHours();
  const saluto = h < 12 ? "Buongiorno" : h < 18 ? "Buon pomeriggio" : "Buonasera";
  const dataLabel = today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const commesseAttive = cantieri.filter(c => c.fase !== "chiusura").length;
  const totFat = (fattureDB || []).filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
  const fmtK = (n: number) => "€" + (n >= 1000 ? (n/1000).toFixed(1).replace(".0","")+"k" : n.toLocaleString("it-IT"));

  const ferme = cantieri.filter(c => c.fase !== "chiusura" && giorniFermaCM(c) >= sogliaDays);
  const prevDaFare = cantieri.filter(c => c.fase === "preventivo");
  const probAperti = (problemi||[]).filter(p => p.stato !== "risolto");
  const todayEvs = events.filter(e => e.date === todayISO).sort((a,b)=>(a.time||"99").localeCompare(b.time||"99"));
  const tasks: any[] = [];
  if (probAperti.length > 0)  tasks.push({ titolo:"Problema: "+(probAperti[0].titolo||"da risolvere"), sotto:probAperti.length+" aperti", color:RED, icon:<IcoDoc color={RED}/>, action:()=>setShowProblemiView(true) });
  if (ferme.length > 0)       { const c=ferme[0]; tasks.push({ titolo:"Sblocca "+c.cliente, sotto:c.code+" · ferma da "+giorniFermaCM(c)+" gg", color:RED, icon:<IcoDoc color={RED}/>, action:()=>{setSelectedCM(c);setTab("commesse");} }); }
  if (prevDaFare.length > 0)  { const c=prevDaFare[0]; tasks.push({ titolo:"Preventivo: "+c.cliente, sotto:prevDaFare.length+" in attesa", color:AMB, icon:<IcoMeas color={AMB}/>, action:()=>{setSelectedCM(c);setTab("commesse");} }); }
  if (todayEvs.length > 0)    { const e=todayEvs[0]; tasks.push({ titolo:e.text, sotto:(e.time||"")+(e.persona?" · "+e.persona:""), color:T_CLR, icon:<IcoCal color={T_CLR}/>, action:()=>setTab("agenda") }); }
  const recenti = [...cantieri].sort((a,b)=>String(b.updatedAt||b.id||"").localeCompare(String(a.updatedAt||a.id||""))).slice(0,3);
  const ops = [
    { ini:"FC", bg:"#1A7878", nome:"Fabio Cozza",   ruolo:"Titolare · ufficio",         status:"online",      dot:GRN,     op:1 },
    { ini:"MV", bg:"#1060A0", nome:"Marco Vito",     ruolo:"Montatore · Via Roma 14",    status:"in cantiere", dot:GRN,     op:1 },
    { ini:"PG", bg:"#6B4FB0", nome:"Paolo Greco",    ruolo:"Tecnico misure · in giro",   status:"in rilievo",  dot:AMB,     op:1 },
    { ini:"AB", bg:"#806020", nome:"Antonio Bruno",  ruolo:"Magazziniere",               status:"offline",     dot:"#8BBCBC", op:0.55 },
  ];
  const sPill = (s: string) => s==="online"||s==="in cantiere" ? {bg:"#D8F2F2",color:"#0A5050"} : s==="in rilievo" ? {bg:"#FFF0DC",color:"#7A4000"} : {bg:"#F0F8F8",color:"#8BBCBC"};

  // ─── WIDGET ───────────────────────────────────────────────────────────────
  const W = (id: string, idx: number) => {
    const isFirst = idx === 0, isLast = idx === visible.length - 1;
    const hnd = <Handle editMode={editMode} id={id} isFirst={isFirst} isLast={isLast} onUp={()=>moveUp(id)} onDown={()=>moveDown(id)} onRemove={()=>remove(id)} />;

    if (id === "da_fare") {
      if (tasks.length === 0 && !editMode) return null;
      return <div key={id}>{hnd}<Card><SecTitle badge={<Pill bg="#FFF0DC" color="#7A4000">{tasks.length} azioni</Pill>}>Da fare ora</SecTitle>
        {tasks.length === 0 ? <p style={{margin:0,fontSize:12,color:SUB}}>Nessuna azione urgente</p>
        : <div style={{display:"flex",flexDirection:"column",gap:7}}>{tasks.map((t,i)=>(
          <div key={i} onClick={t.action} style={{background:"white",borderRadius:12,border:`1px solid ${BDR}`,boxShadow:"0 2px 0 0 #A8CCCC",padding:"11px 13px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",borderLeft:`4px solid ${t.color}`}}>
            <div style={{width:32,height:32,background:t.color+"1A",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{t.icon}</div>
            <div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:13,fontWeight:800,color:INK}}>{t.titolo}</p><p style={{margin:0,fontSize:10,color:SUB}}>{t.sotto}</p></div>
            <IcoChev/>
          </div>))}</div>}
      </Card></div>;
    }

    if (id === "azioni_rapide") return <div key={id}>{hnd}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div onClick={()=>setShowModal("commessa")} style={{padding:"18px 16px",borderRadius:18,background:T_CLR,boxShadow:`0 8px 0 0 ${T_DARK}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><I d={ICO.folder} s={22} c="white"/></div>
          <div><p style={{margin:0,fontSize:14,fontWeight:900,color:"white"}}>Commessa</p><p style={{margin:"2px 0 0",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)"}}>Nuova pratica</p></div>
        </div>
        <div onClick={()=>setShowSpesa(true)} style={{padding:"18px 16px",borderRadius:18,background:AMB,boxShadow:"0 8px 0 0 #7A4800",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><I d={ICO.receipt||ICO.tag} s={22} c="white"/></div>
          <div><p style={{margin:0,fontSize:14,fontWeight:900,color:"white"}}>Invia spesa</p><p style={{margin:"2px 0 0",fontSize:10,fontWeight:700,color:"rgba(255,255,255,.6)"}}>Scontrino / nota</p></div>
        </div>
        <div onClick={()=>setShowModal("contatto")} style={{padding:"18px 16px",borderRadius:18,background:"white",border:`2px solid ${BDR}`,boxShadow:"0 7px 0 0 #A8CCCC",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(40,160,160,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><I d={ICO.user} s={22} c={T_CLR}/></div>
          <div><p style={{margin:0,fontSize:14,fontWeight:900,color:INK}}>Cliente</p><p style={{margin:"2px 0 0",fontSize:10,fontWeight:700,color:SUB}}>Nuovo contatto</p></div>
        </div>
        <div onClick={()=>setShowModal("evento")} style={{padding:"18px 16px",borderRadius:18,background:"white",border:`2px solid ${BDR}`,boxShadow:"0 7px 0 0 #A8CCCC",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:12,background:"rgba(124,95,191,.1)",display:"flex",alignItems:"center",justifyContent:"center"}}><I d={ICO.calendar} s={22} c="#7C5FBF"/></div>
          <div><p style={{margin:0,fontSize:14,fontWeight:900,color:INK}}>Appuntamento</p><p style={{margin:"2px 0 0",fontSize:10,fontWeight:700,color:SUB}}>Agenda</p></div>
        </div>
      </div></div>;

    if (id === "contabilita") return <div key={id}>{hnd}
      <div onClick={()=>setTab("contabilita")} style={{padding:"16px 20px",borderRadius:18,background:"white",border:`2px solid ${BDR}`,boxShadow:"0 7px 0 0 #A8CCCC",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:42,height:42,borderRadius:12,background:"rgba(26,158,115,.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GRN} strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div style={{flex:1}}><p style={{margin:0,fontSize:15,fontWeight:900,color:INK}}>Contabilita'</p><p style={{margin:"2px 0 0",fontSize:10,fontWeight:700,color:SUB}}>Fatture · incassi · spese</p></div>
        <IcoChev/>
      </div></div>;

    if (id === "operatori") return <div key={id}>{hnd}<Card>
      <SecTitle badge={<Pill bg="#D8F2F2" color="#0A5050">3 in campo</Pill>}>Operatori oggi</SecTitle>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>{ops.map((op,i)=>{const p=sPill(op.status);return(
        <div key={i} style={{display:"flex",alignItems:"center",gap:10,opacity:op.op}}>
          <div style={{position:"relative",flexShrink:0}}><Av initials={op.ini} bg={op.bg}/><Dot color={op.dot}/></div>
          <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:800,color:INK}}>{op.nome}</p><p style={{margin:0,fontSize:10,color:SUB}}>{op.ruolo}</p></div>
          <Pill bg={p.bg} color={p.color}>{op.status}</Pill>
        </div>);})}</div>
    </Card></div>;

    if (id === "agenda") return <div key={id}>{hnd}<Card>
      <SecTitle badge={<BtnP onClick={()=>setTab("agenda")}>Vedi tutto</BtnP>}>Agenda oggi</SecTitle>
      {todayEvs.length===0 ? <p style={{margin:0,fontSize:12,color:SUB,textAlign:"center",padding:"8px 0"}}>Nessun evento oggi</p>
      : <div style={{display:"flex",flexDirection:"column"}}>{todayEvs.slice(0,4).map((e,i)=>{
        const isLast=i===Math.min(todayEvs.length,4)-1;
        const clr=i===0?T_CLR:i===1?AMB:"#1060A0";
        return(<div key={e.id||i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:isLast?"none":`1px solid ${T_LIGHT}`}}>
          <div style={{width:40,flexShrink:0,textAlign:"center"}}><p style={{margin:0,fontSize:12,fontWeight:900,color:clr}}>{e.time||"—"}</p></div>
          <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:800,color:INK}}>{e.text}</p><p style={{margin:0,fontSize:10,color:SUB}}>{e.persona||""}</p></div>
          <div style={{width:4,background:clr,borderRadius:2,flexShrink:0}}/>
        </div>);})}</div>}
    </Card></div>;

    if (id === "commesse") return <div key={id}>{hnd}<Card>
      <SecTitle badge={<BtnP onClick={()=>setTab("commesse")}>Tutte →</BtnP>}>Ultime commesse</SecTitle>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {recenti.length===0 && <p style={{margin:0,fontSize:12,color:SUB,textAlign:"center",padding:"8px 0"}}>Nessuna commessa</p>}
        {recenti.map((c,i)=>{
          const isClosed=c.fase==="chiusura";
          const fasi=["sopralluogo","preventivo","conferma","ordini","posa","fattura"];
          const fi=fasi.indexOf(c.fase);
          const ini=(c.cliente||"??").split(" ").map((w:string)=>w[0]).join("").slice(0,2).toUpperCase();
          const bg=["#1A7878","#6B4FB0","#B05020","#1060A0"][i%4];
          return(<div key={c.id} onClick={()=>{setSelectedCM(c);setTab("commesse");}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T_LIGHT,borderRadius:9,border:`1px solid ${BDR}`,cursor:"pointer"}}>
            <Av initials={ini} bg={bg} size={32} fontSize={11}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:0,fontSize:12,fontWeight:800,color:INK}}>{c.cliente}</p>
              <div style={{display:"flex",gap:2,marginTop:3,height:13}}>
                {fasi.map((f,fii)=>{const done=fii<=fi;return(<div key={f} style={{flex:fii===0?3:2,background:done?(PIPE_COLORS[f]||T_CLR):"#D0E8E8",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:done?"white":SUB}}>{f[0].toUpperCase()}</div>);})}
              </div>
            </div>
            {isClosed?<p style={{margin:0,fontSize:12,fontWeight:900,color:GRN,flexShrink:0}}>✓ chiusa</p>:<p style={{margin:0,fontSize:12,fontWeight:900,color:INK,flexShrink:0}}>{c.euro?fmtK(parseFloat(c.euro)):"—"}</p>}
          </div>);
        })}
      </div>
    </Card></div>;

    return null;
  };

  return (
    <div style={{fontFamily:"'Inter',sans-serif",backgroundColor:"#D8EEEE",backgroundImage:"linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)",backgroundSize:"24px 24px",minHeight:"100%",paddingBottom:100}}>

      {/* TOPBAR */}
      <div style={{background:INK,padding:"14px 18px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <p suppressHydrationWarning style={{margin:0,fontSize:11,color:"rgba(255,255,255,.45)",fontWeight:600}}>{dataLabel.charAt(0).toUpperCase()+dataLabel.slice(1)}</p>
            <p style={{margin:"2px 0 0",fontSize:20,fontWeight:900,color:"white",lineHeight:1.2}}>{saluto}, Fabio</p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",borderRadius:10,padding:"8px 12px",textAlign:"center"}}>
              <IcoSun/><p style={{margin:"2px 0 0",fontSize:14,fontWeight:900,color:"white"}}>22°</p><p style={{margin:0,fontSize:9,color:"rgba(255,255,255,.5)"}}>Brindisi</p>
            </div>
            {/* edit toggle */}
            <div onClick={()=>{setEditMode(e=>!e);setShowAdd(false);}}
              style={{width:36,height:36,background:editMode?T_CLR:"rgba(255,255,255,.1)",border:editMode?"none":"1px solid rgba(255,255,255,.2)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:editMode?`0 3px 0 0 ${T_DARK}`:"none"}}>
              {editMode
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div style={{background:"rgba(40,160,160,.15)",border:"1px solid rgba(40,160,160,.25)",borderRadius:10,padding:"9px 10px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:18,fontWeight:900,color:T_CLR}}>{commesseAttive}</p><p style={{margin:0,fontSize:9,color:"rgba(255,255,255,.5)",fontWeight:600}}>commesse</p>
          </div>
          <div style={{background:"rgba(40,160,160,.15)",border:"1px solid rgba(40,160,160,.25)",borderRadius:10,padding:"9px 10px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:18,fontWeight:900,color:T_CLR}}>3</p><p style={{margin:0,fontSize:9,color:"rgba(255,255,255,.5)",fontWeight:600}}>oggi in campo</p>
          </div>
          <div style={{background:"rgba(40,160,160,.15)",border:"1px solid rgba(40,160,160,.25)",borderRadius:10,padding:"9px 10px",textAlign:"center"}}>
            <p style={{margin:0,fontSize:18,fontWeight:900,color:totFat>0?GRN:T_CLR}}>{fmtK(totFat)}</p><p style={{margin:0,fontSize:9,color:"rgba(255,255,255,.5)",fontWeight:600}}>da incassare</p>
          </div>
        </div>
      </div>

      <div style={{padding:12,display:"flex",flexDirection:"column",gap:10}}>

        {/* BANNER EDIT */}
        {editMode && (
          <div style={{background:"rgba(40,160,160,.1)",border:`1.5px dashed ${T_CLR}`,borderRadius:14,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{margin:0,fontSize:13,fontWeight:800,color:T_CLR}}>Modifica home</p>
              <p style={{margin:"2px 0 0",fontSize:11,color:SUB}}>Sposta, rimuovi o aggiungi sezioni</p>
            </div>
            <button onClick={reset} style={{background:T_LIGHT,border:`1px solid ${BDR}`,borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,color:SUB,cursor:"pointer"}}>Reset</button>
          </div>
        )}

        {/* WIDGETS */}
        {visible.map((id, idx) => W(id, idx))}

        {/* AGGIUNGI */}
        {editMode && addable.length > 0 && (
          <div>
            <button onClick={()=>setShowAdd(p=>!p)} style={{width:"100%",background:"white",border:`2px dashed ${BDR}`,borderRadius:14,padding:14,fontSize:13,fontWeight:800,color:T_CLR,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T_CLR} strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16M4 12h16"/></svg>
              Aggiungi sezione
            </button>
            {showAdd && (
              <div style={{marginTop:8,background:"white",borderRadius:14,border:`1px solid ${BDR}`,boxShadow:"0 4px 0 0 #A8CCCC",padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}>
                {addable.map(id=>(
                  <div key={id} onClick={()=>add(id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T_LIGHT,borderRadius:10,border:`1px solid ${BDR}`,cursor:"pointer"}}>
                    <p style={{margin:0,fontSize:13,fontWeight:800,color:INK,flex:1}}>{WIDGET_META[id]?.label}</p>
                    <div style={{background:T_CLR,borderRadius:6,padding:"3px 10px",boxShadow:`0 2px 0 0 ${T_DARK}`}}><span style={{fontSize:11,fontWeight:800,color:"white"}}>+ Aggiungi</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
      {showSpesa && <SpesaQuick onClose={()=>setShowSpesa(false)}/>}
    </div>
  );
}
