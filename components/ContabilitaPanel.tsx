"use client";
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, Ico } from "./mastro-constants";

export default function ContabilitaPanel() {
  const {
    T, S, isDesktop, fs,
    cantieri, contabMese, contabTab, creaFatturaPassiva, events, fattureDB, fatturePassive, fornitori, montaggiDB, newFattPassiva, ordiniFornDB, setContabMese, setContabTab, setFattureDB, setFatturePassive, setNewFattPassiva, setSelectedCM, setShowContabilita, setShowFatturaPassiva, setTab, showFatturaPassiva, squadreDB,
    // Business logic
    generaFatturaPDF, generaXmlSDI,
  } = useMastro();

    const today = new Date();
    const [calFiltro, setCalFiltro] = React.useState<"settimana"|"mese"|"trimestre"|"anno">("mese");
    const [calGiornoSel, setCalGiornoSel] = React.useState<string>("");
    const [spese, setSpese] = React.useState<any[]>([]);
    const [loadingSpese, setLoadingSpese] = React.useState(true);
    const [speseLoaded, setSpeseLoaded] = React.useState(false);
    const [showNuovaSpesaForm, setShowNuovaSpesaForm] = React.useState(false);
    const [showSpesaQuick, setShowSpesaQuick] = React.useState(false);
    const [nuovaSpesaNota, setNuovaSpesaNota] = React.useState("");
    const [nuovaSpesaImporto, setNuovaSpesaImporto] = React.useState("");
    const [nuovaSpesaCat, setNuovaSpesaCat] = React.useState("varie");
    const [cY, cM] = contabMese.split("-").map(Number);
    const daysInMonth = new Date(cY, cM, 0).getDate();
    const firstDow = (new Date(cY, cM - 1, 1).getDay() + 6) % 7; // Mon=0
    const meseLbl = new Date(cY, cM - 1).toLocaleDateString("it-IT", { month: "long", year: "numeric" });
    
    // All invoices
    const allEmesse = fattureDB || [];
    const allRicevute = fatturePassive || [];
    
    // Monthly filter
    const meseEmesse = allEmesse.filter(f => (f.dataISO || "").startsWith(contabMese));
    const meseRicevute = allRicevute.filter(f => (f.dataISO || f.data || "").startsWith(contabMese));
    
    // Totals
    const totEmesso = allEmesse.reduce((s, f) => s + (f.importo || 0), 0);
    const totIncassato = allEmesse.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totDaIncassare = allEmesse.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totCosti = allRicevute.reduce((s, f) => s + (f.importo || 0), 0);
    const totPagati = allRicevute.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const totDaPagare = allRicevute.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const margine = totIncassato - totPagati;
    
    // Mese totals
    const meseEmTot = meseEmesse.reduce((s, f) => s + (f.importo || 0), 0);
    const meseRicTot = meseRicevute.reduce((s, f) => s + (f.importo || 0), 0);
    
    // Scadenze per giorno del mese (calendar dots)
    const scadenzeMap: Record<number, Array<{tipo:string;importo:number;nome:string}>> = {};
    allEmesse.filter(f => !f.pagata && f.scadenza && f.scadenza.startsWith(contabMese)).forEach(f => {
      const d = parseInt(f.scadenza.split("-")[2]);
      if (!scadenzeMap[d]) scadenzeMap[d] = [];
      scadenzeMap[d].push({ tipo: "incasso", importo: f.importo, nome: f.cliente });
    });
    allRicevute.filter(f => !f.pagata && f.scadenza && f.scadenza.startsWith(contabMese)).forEach(f => {
      const d = parseInt(f.scadenza.split("-")[2]);
      if (!scadenzeMap[d]) scadenzeMap[d] = [];
      scadenzeMap[d].push({ tipo: "pagamento", importo: f.importo || 0, nome: typeof f.fornitore === "object" ? (f.fornitore?.nome || "") : (f.fornitore || "") });
    });
    
    // Monthly bar data (last 6 months)
    const barData: Array<{lbl:string;emesso:number;costi:number}> = [];
    for (let i = 5; i >= 0; i--) {
      const bd = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${bd.getFullYear()}-${String(bd.getMonth()+1).padStart(2,"0")}`;
      const lbl = bd.toLocaleDateString("it-IT", { month: "short" });
      const em = allEmesse.filter(f => (f.dataISO || "").startsWith(key)).reduce((s, f) => s + (f.importo || 0), 0);
      const co = allRicevute.filter(f => (f.dataISO || f.data || "").startsWith(key)).reduce((s, f) => s + (f.importo || 0), 0);
      barData.push({ lbl, emesso: em, costi: co });
    }
    const barMax = Math.max(...barData.map(b => Math.max(b.emesso, b.costi)), 1);
    
    const prevMese = () => { const d = new Date(cY, cM - 2, 1); setContabMese(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
    const nextMese = () => { const d = new Date(cY, cM, 1); setContabMese(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
    
    const fmt = (n: number) => "€" + n.toLocaleString("it-IT", { minimumFractionDigits: 0 });
    
    return (
    <div style={{ position:"fixed", inset:0, zIndex:10002, backgroundColor:"#D8EEEE", backgroundImage:"linear-gradient(rgba(40,160,160,0.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,0.18) 1px,transparent 1px)", backgroundSize:"24px 24px", overflow:"auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: T.card, borderBottom: "1px solid " + T.bdr, position: "sticky", top: 0, zIndex: 10 }}>
        <div onClick={() => setTab("home")} style={{ cursor: "pointer", color: T.acc, fontWeight: 700, fontSize: 14 }}>← Indietro</div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 16, fontWeight: 800, color: T.text }}> Contabilitá</div>
        <div style={{ width: 60 }} />
      </div>
      
      {/* TABS */}
      <div style={{ display: "flex", margin: "8px 16px", borderRadius: 8, border: "1px solid " + T.bdr, overflow: "hidden" }}>
        {[{ id: "panoramica", l: "Panoramica" }, { id: "emesse", l: "Emesse" }, { id: "ricevute", l: "Ricevute" }, { id: "calendario", l: "Calendario" }, { id: "spese", l: "Spese" }, { id: "sdi", l: "SDI" }].map(t => (
          <div key={t.id} onClick={() => setContabTab(t.id)} style={{ flex: 1, padding: "8px 2px", textAlign: "center", fontSize: 9, fontWeight: 700, background: contabTab === t.id ? T.acc : T.card, color: contabTab === t.id ? "#fff" : T.sub, cursor: "pointer" }}>{t.l}</div>
        ))}
      </div>
      
      <div style={{ padding: "0 16px 100px", minHeight: "calc(100vh - 120px)" }}>
      
      {/*  PANORAMICA  */}
      {contabTab === "panoramica" && <>
        {/* fliwoX KPI 6 cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10, marginTop:14 }}>
          <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", padding:"12px 8px", textAlign:"center", boxShadow:"0 5px 0 0 #A8CCCC" }}>
            <div style={{ fontSize:8, color:"#4A7070", textTransform:"uppercase" as const, fontWeight:900, letterSpacing:"0.05em", marginBottom:4 }}>Fatturato</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#0D1F1F" }}>{fmt(totEmesso)}</div>
          </div>
          <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", padding:"12px 8px", textAlign:"center", boxShadow:"0 5px 0 0 #A8CCCC" }}>
            <div style={{ fontSize:8, color:"#4A7070", textTransform:"uppercase" as const, fontWeight:900, letterSpacing:"0.05em", marginBottom:4 }}>Incassato</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#1A9E73" }}>{fmt(totIncassato)}</div>
          </div>
          <div style={{ background:"white", borderRadius:14, border:"1.5px solid rgba(220,68,68,0.4)", padding:"12px 8px", textAlign:"center", boxShadow:"0 5px 0 0 #FFAAAA" }}>
            <div style={{ fontSize:8, color:"#4A7070", textTransform:"uppercase" as const, fontWeight:900, letterSpacing:"0.05em", marginBottom:4 }}>Da inc.</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#DC4444" }}>{fmt(totDaIncassare)}</div>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
          <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", padding:"12px 8px", textAlign:"center", boxShadow:"0 5px 0 0 #A8CCCC" }}>
            <div style={{ fontSize:8, color:"#4A7070", textTransform:"uppercase" as const, fontWeight:900, letterSpacing:"0.05em", marginBottom:4 }}>Costi</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#D08008" }}>{fmt(totCosti)}</div>
          </div>
          <div style={{ background:"white", borderRadius:14, border:"1.5px solid #C8E4E4", padding:"12px 8px", textAlign:"center", boxShadow:"0 5px 0 0 #A8CCCC" }}>
            <div style={{ fontSize:8, color:"#4A7070", textTransform:"uppercase" as const, fontWeight:900, letterSpacing:"0.05em", marginBottom:4 }}>Da pag.</div>
            <div style={{ fontSize:20, fontWeight:900, color:"#D08008" }}>{fmt(totDaPagare)}</div>
          </div>
          <div style={{ background:"white", borderRadius:14, border:`2px solid ${margine >= 0 ? "rgba(26,158,115,0.5)" : "rgba(220,68,68,0.4)"}`, padding:"12px 8px", textAlign:"center", boxShadow:`0 5px 0 0 ${margine >= 0 ? "rgba(26,158,115,0.3)" : "#FFAAAA"}` }}>
            <div style={{ fontSize:8, color:"#4A7070", textTransform:"uppercase" as const, fontWeight:900, letterSpacing:"0.05em", marginBottom:4 }}>Margine</div>
            <div style={{ fontSize:20, fontWeight:900, color: margine >= 0 ? "#1A9E73" : "#DC4444" }}>{fmt(margine)}</div>
          </div>
        </div>
        
        {/* fliwoX GRAFICO BARRE */}
        <div style={{ background:"white", borderRadius:18, border:"1.5px solid #C8E4E4", padding:16, marginBottom:12, boxShadow:"0 7px 0 0 #A8CCCC" }}>
          <div style={{ fontSize:13, fontWeight:900, color:"#0D1F1F", marginBottom:14 }}>Andamento 6 mesi</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:100 }}>
            {barData.map((b, i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center", gap:3 }}>
                <div style={{ width:"100%", display:"flex", gap:3, alignItems:"flex-end", justifyContent:"center", height:78 }}>
                  <div style={{ width:"46%", height:Math.max(3, (b.emesso / barMax) * 78), background:"#28A0A0", borderRadius:"4px 4px 0 0", boxShadow:"0 4px 0 0 #156060" }} />
                  <div style={{ width:"46%", height:Math.max(3, (b.costi / barMax) * 78), background:"#D08008", borderRadius:"4px 4px 0 0", boxShadow:"0 3px 0 0 #7A4800" }} />
                </div>
                <div style={{ fontSize:8, color:i === barData.length-1 ? "#28A0A0" : "#4A7070", fontWeight: i === barData.length-1 ? 900 : 700, textTransform:"uppercase" as const }}>{b.lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:16, justifyContent:"center", marginTop:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:12, height:12, borderRadius:3, background:"#28A0A0", boxShadow:"0 2px 0 0 #156060" }} /><span style={{ fontSize:10, color:"#4A7070", fontWeight:700 }}>Fatturato</span></div>
            <div style={{ display:"flex", alignItems:"center", gap:5 }}><div style={{ width:12, height:12, borderRadius:3, background:"#D08008", boxShadow:"0 2px 0 0 #7A4800" }} /><span style={{ fontSize:10, color:"#4A7070", fontWeight:700 }}>Costi</span></div>
          </div>
        </div>
        
        {/* fliwoX SCADENZE */}
        <div style={{ background:"white", borderRadius:18, border:"1.5px solid #C8E4E4", padding:16, marginBottom:12, boxShadow:"0 7px 0 0 #A8CCCC" }}>
          <div style={{ fontSize:13, fontWeight:900, color:"#0D1F1F", marginBottom:10 }}>Scadenze urgenti</div>
          {[...allEmesse.filter(f => !f.pagata && f.scadenza).map(f => ({ ...f, dir: "incasso" as const })), 
            ...allRicevute.filter(f => !f.pagata && f.scadenza).map(f => ({ ...f, dir: "pagamento" as const }))]
            .sort((a, b) => (a.scadenza || "z").localeCompare(b.scadenza || "z")).slice(0, 6).map((f, i) => {
              const isLate = (f.scadenza || "") < today.toISOString().split("T")[0];
              const days = Math.ceil((new Date(f.scadenza || "").getTime() - today.getTime()) / 86400000);
              const cardBg = isLate ? "#FFF4F4" : f.dir === "incasso" ? "#F0FBF7" : "#FFF8DC";
              const cardBdr = isLate ? "rgba(220,68,68,0.35)" : f.dir === "incasso" ? "rgba(26,158,115,0.3)" : "rgba(208,128,8,0.3)";
              const cardSh = isLate ? "#FFAAAA" : f.dir === "incasso" ? "rgba(26,158,115,0.3)" : "rgba(208,128,8,0.25)";
              return <div key={i} style={{ display:"flex", alignItems:"center", padding:"11px 13px", borderRadius:12, background:cardBg, border:`1.5px solid ${cardBdr}`, boxShadow:`0 4px 0 0 ${cardSh}`, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:isLate ? "rgba(220,68,68,0.15)" : f.dir === "incasso" ? "rgba(26,158,115,0.12)" : "rgba(208,128,8,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, boxShadow:`0 3px 0 0 ${cardSh}` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isLate ? "#DC4444" : f.dir === "incasso" ? "#1A9E73" : "#D08008"} strokeWidth="2.2" strokeLinecap="round">{isLate ? <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/> : <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>}</svg>
                </div>
                <div style={{ flex:1, marginLeft:10 }}>
                  <div style={{ fontSize:13, fontWeight:900, color:isLate ? "#DC4444" : "#0D1F1F" }}>{typeof (f as any).fornitore === "object" ? ((f as any).fornitore?.nome || f.cliente) : ((f as any).fornitore || f.cliente)}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:isLate ? "#DC4444" : "#4A7070" }}>
                    {isLate ? `Scaduta da ${Math.abs(days)} gg` : days === 0 ? "Scade oggi!" : `Tra ${days} gg`}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:17, fontWeight:900, color:isLate ? "#DC4444" : "#0D1F1F" }}>{fmt(f.importo || 0)}</div>
                  <div style={{ fontSize:9, fontWeight:900, padding:"2px 8px", borderRadius:20, background:f.dir === "incasso" ? "rgba(26,158,115,0.12)" : "rgba(208,128,8,0.12)", color:f.dir === "incasso" ? "#1A9E73" : "#D08008", display:"inline-block", marginTop:2 }}>{f.dir === "incasso" ? "INCASSO" : "PAGAMENTO"}</div>
                </div>
              </div>;
            })}
          {allEmesse.filter(f => !f.pagata && f.scadenza).length + allRicevute.filter(f => !f.pagata && f.scadenza).length === 0 && (
            <div style={{ textAlign: "center", padding: 16, color: T.sub, fontSize: 12 }}>✓ Nessuna scadenza in sospeso</div>
          )}
        </div>
        
        {/* fliwoX RIEPILOGO MESE */}
        <div style={{ background:"white", borderRadius:18, border:"1.5px solid #C8E4E4", padding:16, boxShadow:"0 7px 0 0 #A8CCCC" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <div onClick={prevMese} style={{ width:38, height:38, background:"#EEF8F8", borderRadius:10, border:"1.5px solid #C8E4E4", boxShadow:"0 4px 0 0 #A8CCCC", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
            </div>
            <div style={{ fontSize:16, fontWeight:900, color:"#0D1F1F", textTransform:"capitalize" as const }}>{meseLbl}</div>
            <div onClick={nextMese} style={{ width:38, height:38, background:"#EEF8F8", borderRadius:10, border:"1.5px solid #C8E4E4", boxShadow:"0 4px 0 0 #A8CCCC", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ padding:"14px 12px", borderRadius:14, background:"rgba(40,160,160,0.1)", textAlign:"center", border:"1.5px solid rgba(40,160,160,0.25)", boxShadow:"0 5px 0 0 rgba(40,160,160,0.2)" }}>
              <div style={{ fontSize:9, color:"#4A7070", fontWeight:900, textTransform:"uppercase" as const, marginBottom:4 }}>Emesso</div>
              <div style={{ fontSize:24, fontWeight:900, color:"#28A0A0" }}>{fmt(meseEmTot)}</div>
              <div style={{ fontSize:10, color:"#4A7070", fontWeight:700, marginTop:2 }}>{meseEmesse.length} fatture</div>
            </div>
            <div style={{ padding:"14px 12px", borderRadius:14, background:"rgba(208,128,8,0.1)", textAlign:"center", border:"1.5px solid rgba(208,128,8,0.25)", boxShadow:"0 5px 0 0 rgba(208,128,8,0.2)" }}>
              <div style={{ fontSize:9, color:"#4A7070", fontWeight:900, textTransform:"uppercase" as const, marginBottom:4 }}>Costi</div>
              <div style={{ fontSize:24, fontWeight:900, color:"#D08008" }}>{fmt(meseRicTot)}</div>
              <div style={{ fontSize:10, color:"#4A7070", fontWeight:700, marginTop:2 }}>{meseRicevute.length} fatture</div>
            </div>
          </div>
        </div>
      </>}
      
      {/*  EMESSE  */}
      {contabTab === "emesse" && <>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, marginTop:14 }}>
          <div style={{ fontSize:14, fontWeight:900, color:"#0D1F1F" }}>{allEmesse.length} fatture emesse</div>
          <div style={{ display:"flex", gap:6 }}>
            <span style={{ fontSize:10, padding:"4px 11px", borderRadius:20, background:"rgba(26,158,115,0.12)", color:"#1A9E73", fontWeight:900, boxShadow:"0 2px 0 0 rgba(26,158,115,0.3)" }}>✓ {allEmesse.filter(f=>f.pagata).length}</span>
            <span style={{ fontSize:10, padding:"4px 11px", borderRadius:20, background:"rgba(220,68,68,0.1)", color:"#DC4444", fontWeight:900, boxShadow:"0 2px 0 0 #FFAAAA" }}>{allEmesse.filter(f=>!f.pagata).length} aperte</span>
          </div>
        </div>
        {allEmesse.sort((a, b) => b.numero - a.numero).map(f => (
          <div key={f.id} style={{ background:"white", borderRadius:18, border:"1.5px solid #C8E4E4", padding:14, marginBottom:10, boxShadow:"0 6px 0 0 #A8CCCC" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:16, fontWeight:900, color:"#0D1F1F" }}>N. {f.numero}/{f.anno}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#4A7070", marginTop:2 }}>{f.cliente} · {f.cmCode}</div>
                <div style={{ display:"flex", gap:5, marginTop:6, flexWrap:"wrap" as const }}>
                  <span style={{ fontSize:9, padding:"3px 9px", borderRadius:20, background: f.tipo === "saldo" ? "rgba(26,158,115,0.12)" : f.tipo === "acconto" ? "rgba(208,128,8,0.12)" : "rgba(40,160,160,0.10)", color: f.tipo === "saldo" ? "#1A9E73" : f.tipo === "acconto" ? "#D08008" : "#28A0A0", fontWeight:900, boxShadow: f.tipo === "saldo" ? "0 2px 0 0 rgba(26,158,115,0.3)" : "0 2px 0 0 rgba(40,160,160,0.2)" }}>{f.tipo?.toUpperCase()}</span>
                  {f.inviata && <span style={{ fontSize:9, padding:"3px 9px", borderRadius:20, background:"rgba(26,158,115,0.12)", color:"#1A9E73", fontWeight:900 }}>✓ INVIATA</span>}
                  {f.scadenza && <span style={{ fontSize:9, fontWeight:700, color: f.scadenza < today.toISOString().split("T")[0] && !f.pagata ? "#DC4444" : "#4A7070" }}>Scade: {new Date(f.scadenza).toLocaleDateString("it-IT")}</span>}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:22, fontWeight:900, color: f.pagata ? "#1A9E73" : "#DC4444" }}>{fmt(f.importo)}</div>
                <span onClick={() => setFattureDB(prev => prev.map(ff => ff.id === f.id ? { ...ff, pagata: !ff.pagata, dataPagamento: !ff.pagata ? today.toISOString().split("T")[0] : null } : ff))} 
                  style={{ fontSize:10, padding:"4px 11px", borderRadius:20, background: f.pagata ? "rgba(26,158,115,0.12)" : "rgba(220,68,68,0.1)", color: f.pagata ? "#1A9E73" : "#DC4444", fontWeight:900, cursor:"pointer", display:"inline-block", marginTop:4, boxShadow: f.pagata ? "0 2px 0 0 rgba(26,158,115,0.3)" : "0 2px 0 0 #FFAAAA" }}>
                  {f.pagata ? "✓ Incassata" : "Da incassare"}
                </span>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={() => { generaFatturaPDF(f); setFattureDB(prev => prev.map(ff => ff.id === f.id ? { ...ff, inviata: true } : ff)); }} style={{ flex:1, padding:"11px", borderRadius:12, background:"#1A9E73", color:"white", fontSize:12, fontWeight:900, textAlign:"center" as const, cursor:"pointer", boxShadow:"0 5px 0 0 #0A5A3A", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>PDF
              </div>
              <div onClick={() => generaXmlSDI(f)} style={{ flex:1, padding:"11px", borderRadius:12, background:"#7C5FBF", color:"white", fontSize:12, fontWeight:900, textAlign:"center" as const, cursor:"pointer", boxShadow:"0 5px 0 0 #4A3080", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>SDI
              </div>
              <div onClick={() => { const cm = cantieri.find(c => c.code === f.cmCode); if(cm) { setSelectedCM(cm); setShowContabilita(false); setTab("commesse"); }}} style={{ flex:1, padding:"11px", borderRadius:12, background:"white", color:"#0D1F1F", fontSize:12, fontWeight:900, textAlign:"center" as const, cursor:"pointer", border:"2px solid #C8E4E4", boxShadow:"0 5px 0 0 #A8CCCC" }}>
                Commessa
              </div>
            </div>
          </div>
        ))}
      </>}
      
      {/*  RICEVUTE  */}
      {contabTab === "ricevute" && <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Fatture fornitori ({allRicevute.length})</div>
          <div onClick={() => setShowFatturaPassiva(true)} style={{ padding: "6px 14px", borderRadius: 8, background: T.acc, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Nuova</div>
        </div>
        {allRicevute.length === 0 && <div style={{ textAlign: "center", padding: 32, color: T.sub }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}></div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Nessuna fattura ricevuta</div>
          <div style={{ fontSize: 11 }}>Clicca "+ Nuova" per registrare una fattura fornitore</div>
        </div>}
        {allRicevute.map(f => (
          <div key={f.id} style={{ background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{typeof f.fornitore === "object" ? (f.fornitore?.nome || "—") : (f.fornitore || "—")}</div>
                <div style={{ fontSize: 10, color: T.sub }}>N. {f.numero} · {f.data || f.dataISO}</div>
                {f.descrizione && <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{f.descrizione}</div>}
                {f.scadenza && <div style={{ fontSize: 9, color: f.scadenza < today.toISOString().split("T")[0] && !f.pagata ? T.red : T.sub, marginTop: 2 }}>
                  {f.scadenza < today.toISOString().split("T")[0] && !f.pagata ? "⚠  " : ""}Scadenza: {new Date(f.scadenza).toLocaleDateString("it-IT")}
                </div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.orange }}>{fmt(f.importo || 0)}</div>
                <span onClick={() => setFatturePassive(prev => prev.map(ff => ff.id === f.id ? { ...ff, pagata: !ff.pagata } : ff))} 
                  style={{ fontSize: 9, padding: "3px 8px", borderRadius: 6, background: f.pagata ? T.grnLt : T.orangeLt, color: f.pagata ? T.grn : T.orange, fontWeight: 700, cursor: "pointer" }}>
                  {f.pagata ? "Pagata" : "Da pagare"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {f.cmId && <div onClick={() => { const cm = cantieri.find(c => c.id === f.cmId); if(cm) { setSelectedCM(cm); setShowContabilita(false); setTab("commesse"); }}} style={{ flex: 1, padding: 6, borderRadius: 6, background: T.accLt, color: T.acc, fontSize: 10, fontWeight: 700, textAlign: "center", cursor: "pointer" }}> Commessa</div>}
              <div onClick={() => setFatturePassive(prev => prev.filter(ff => ff.id !== f.id))} style={{ padding: "6px 12px", borderRadius: 6, background: T.redLt, color: T.red, fontSize: 10, fontWeight: 700, cursor: "pointer" }}></div>
            </div>
          </div>
        ))}
        {showFatturaPassiva && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10003, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={e => { if(e.target === e.currentTarget) setShowFatturaPassiva(false); }}>
            <div style={{ background: T.card, borderRadius: 16, padding: 20, width: "90%", maxWidth: 420 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 14 }}> Registra fattura fornitore</div>
              {[{k:"fornitore",l:"Fornitore",t:"text"},{k:"numero",l:"N. Fattura",t:"text"},{k:"data",l:"Data",t:"date"},{k:"importo",l:"Importo €",t:"number"},{k:"descrizione",l:"Descrizione",t:"text"},{k:"scadenza",l:"Scadenza",t:"date"}].map(f => (
                <div key={f.k} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 2 }}>{f.l}</div>
                  <input type={f.t} value={(newFattPassiva as any)[f.k]} onChange={e => setNewFattPassiva(p => ({ ...p, [f.k]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + T.bdr, background: T.bg, color: T.text, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" as const }} />
                </div>
              ))}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 2 }}>Commessa (opzionale)</div>
                <select value={newFattPassiva.cmId} onChange={e => setNewFattPassiva(p => ({ ...p, cmId: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + T.bdr, background: T.bg, color: T.text, fontSize: 13, fontFamily: "inherit" }}>
                  <option value="">— Nessuna —</option>
                  {cantieri.map(c => <option key={c.id} value={c.id}>{c.code} · {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button onClick={() => setShowFatturaPassiva(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid " + T.bdr, background: T.bg, color: T.sub, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                <button onClick={creaFatturaPassiva} style={{ flex: 2, padding: 12, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Registra</button>
              </div>
            </div>
          </div>
        )}
      </>}
      
      {/*  CALENDARIO COMPLETO  */}
      {contabTab === "calendario" && (() => {
        // Gather ALL events for calendar: scadenze + montaggi + events + consegne
        const calMap: Record<number, Array<{tipo:string;ico:string;col:string;label:string;importo?:number;detail?:string}>> = {};
        const addCal = (day: number, item: any) => { if (!calMap[day]) calMap[day] = []; calMap[day].push(item); };
        
        // Scadenze fatture
        allEmesse.filter(f => !f.pagata && f.scadenza && f.scadenza.startsWith(contabMese)).forEach(f => {
          const d = parseInt(f.scadenza.split("-")[2]);
          addCal(d, { tipo: "incasso", ico: "", col: T.grn, label: f.cliente, importo: f.importo, detail: "Da incassare" });
        });
        allRicevute.filter(f => !f.pagata && f.scadenza && f.scadenza.startsWith(contabMese)).forEach(f => {
          const d = parseInt(f.scadenza.split("-")[2]);
          addCal(d, { tipo: "pagamento", ico: "", col: T.orange, label: typeof f.fornitore === "object" ? (f.fornitore?.nome || "") : (f.fornitore || ""), importo: f.importo || 0, detail: "Da pagare" });
        });
        // Montaggi
        (montaggiDB || []).filter(m => m.data && m.data.startsWith(contabMese)).forEach(m => {
          const d = parseInt(m.data.split("-")[2]);
          const cm = cantieri.find(c => c.id === m.cmId);
          const sq = (squadreDB || []).find(s => s.id === m.squadraId);
          addCal(d, { tipo: "montaggio", ico: "🔧", col: "#007aff", label: cm?.cliente || "Montaggio", detail: sq?.nome || "" });
        });
        // Consegne previste ordini
        (ordiniFornDB || []).filter(o => o.consegna?.prevista && o.consegna.prevista.startsWith(contabMese) && o.stato !== "consegnato").forEach(o => {
          const d = parseInt(o.consegna.prevista.split("-")[2]);
          addCal(d, { tipo: "consegna", ico: "", col: "#af52de", label: o.fornitore?.nome || "Consegna", detail: o.cmCode || "" });
        });
        // Events/appuntamenti
        (events || []).filter(ev => ev.date && ev.date.startsWith(contabMese)).forEach(ev => {
          const d = parseInt(ev.date.split("-")[2]);
          const tipoIco: Record<string,string> = { sopralluogo: "", posa: "🔧", controllo: "", consegna: "", misure: "", altro: "" };
          const tipoCol: Record<string,string> = { sopralluogo: "#007aff", posa: "#34c759", controllo: "#ff9500", consegna: "#af52de", misure: "#5856d6", altro: "#86868b" };
          addCal(d, { tipo: ev.tipo || "altro", ico: tipoIco[ev.tipo] || "", col: tipoCol[ev.tipo] || "#86868b", label: ev.persona || ev.text?.slice(0, 20) || "Evento", detail: ev.time || "" });
        });
        
        return <>
        {/* Filtri periodo */}
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {([["giorno","Oggi"],["settimana","Sett."],["mese","Mese"],["trimestre","Trim."],["anno","Anno"]] as const).map(([id,lbl]) => (
            <div key={id} onClick={() => setCalFiltro(id as any)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: 20, textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: calFiltro === id ? T.acc : T.card,
                color: calFiltro === id ? "#fff" : T.sub,
                border: `1px solid ${calFiltro === id ? T.acc : T.bdr}` }}>
              {lbl}
            </div>
          ))}
        </div>
        {/* Riepilogo periodo selezionato */}
        {(() => {
          const now = new Date();
          let emPeriodo = 0, ricPeriodo = 0;
          if (calFiltro === "giorno") {
            const todayStr = now.toISOString().split("T")[0];
            emPeriodo = allEmesse.filter(f => (f.dataISO||"").startsWith(todayStr)).reduce((s,f)=>s+(f.importo||0),0);
            ricPeriodo = allRicevute.filter(f => (f.dataISO||f.data||"").startsWith(todayStr)).reduce((s,f)=>s+(f.importo||0),0);
          } else if (calFiltro === "settimana") {
            const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7));
            const sun = new Date(mon); sun.setDate(mon.getDate()+6);
            const monStr = mon.toISOString().split("T")[0]; const sunStr = sun.toISOString().split("T")[0];
            emPeriodo = allEmesse.filter(f => (f.dataISO||"") >= monStr && (f.dataISO||"") <= sunStr).reduce((s,f)=>s+(f.importo||0),0);
            ricPeriodo = allRicevute.filter(f => { const d=(f.dataISO||f.data||""); return d>=monStr&&d<=sunStr; }).reduce((s,f)=>s+(f.importo||0),0);
          } else if (calFiltro === "mese") {
            emPeriodo = meseEmTot; ricPeriodo = meseRicTot;
          } else if (calFiltro === "trimestre") {
            const q = Math.floor((now.getMonth())/3); const y = now.getFullYear();
            const months = [q*3, q*3+1, q*3+2].map(m => `${y}-${String(m+1).padStart(2,"0")}`);
            emPeriodo = allEmesse.filter(f => months.some(m=>(f.dataISO||"").startsWith(m))).reduce((s,f)=>s+(f.importo||0),0);
            ricPeriodo = allRicevute.filter(f => months.some(m=>(f.dataISO||f.data||"").startsWith(m))).reduce((s,f)=>s+(f.importo||0),0);
          } else {
            const y = String(now.getFullYear());
            emPeriodo = allEmesse.filter(f=>(f.dataISO||"").startsWith(y)).reduce((s,f)=>s+(f.importo||0),0);
            ricPeriodo = allRicevute.filter(f=>(f.dataISO||f.data||"").startsWith(y)).reduce((s,f)=>s+(f.importo||0),0);
          }
          const margPeriodo = emPeriodo - ricPeriodo;
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: T.grnLt, borderRadius: 10, border: `1px solid ${T.grn}30`, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: T.grn, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Entrate</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.grn, fontFamily: FM }}>{fmt(emPeriodo)}</div>
              </div>
              <div style={{ background: "#fff3e0", borderRadius: 10, border: "1px solid #ff980030", padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: T.orange, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Uscite</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: T.orange, fontFamily: FM }}>{fmt(ricPeriodo)}</div>
              </div>
              <div style={{ background: margPeriodo >= 0 ? T.grnLt : T.redLt, borderRadius: 10, border: `1px solid ${margPeriodo >= 0 ? T.grn : T.red}30`, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: margPeriodo >= 0 ? T.grn : T.red, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Margine</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: margPeriodo >= 0 ? T.grn : T.red, fontFamily: FM }}>{fmt(margPeriodo)}</div>
              </div>
            </div>
          );
        })()}
        {/* Month nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, padding: "10px 16px" }}>
          <div onClick={prevMese} style={{ cursor: "pointer", fontSize: 18, color: T.acc, fontWeight: 700 }}>&lt;</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.text, textTransform: "capitalize" as const }}>{meseLbl}</div>
          <div onClick={nextMese} style={{ cursor: "pointer", fontSize: 18, color: T.acc, fontWeight: 700 }}>›</div>
        </div>
        
        {/* Calendar grid */}
        <div style={{ background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, padding: 6, marginBottom: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {["LUN","MAR","MER","GIO","VEN","SAB","DOM"].map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 8, fontWeight: 700, color: T.sub, padding: 4 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {Array.from({ length: firstDow }, (_, i) => <div key={"e"+i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = contabMese + "-" + String(day).padStart(2, "0");
              const isToday = dateStr === today.toISOString().split("T")[0];
              const items = calMap[day] || [];
              const hasMoney = items.some(it => it.tipo === "incasso" || it.tipo === "pagamento");
              const hasMontaggio = items.some(it => it.tipo === "montaggio");
              const hasConsegna = items.some(it => it.tipo === "consegna");
              const hasEvento = items.some(it => !["incasso","pagamento","montaggio","consegna"].includes(it.tipo));
              const bgColor = isToday ? T.accLt : items.length > 0 ? (hasMontaggio ? "#007aff08" : hasMoney ? T.grnLt : hasConsegna ? "#af52de08" : "#f5f5f5") : "transparent";
              return <div key={day} style={{ 
                padding: "3px 1px", borderRadius: 6, minHeight: 44, textAlign: "center",
                background: bgColor,
                border: isToday ? "2px solid " + T.acc : items.length > 0 ? "1px solid " + T.bdr : "1px solid transparent",
              }}>
                <div style={{ fontSize: 11, fontWeight: isToday ? 900 : 600, color: isToday ? T.acc : T.text }}>{day}</div>
                {items.length > 0 && <div style={{ display: "flex", justifyContent: "center", gap: 1, marginTop: 2, flexWrap: "wrap" as any }}>
                  {items.slice(0, 4).map((it, ii) => <div key={ii} style={{ width: 6, height: 6, borderRadius: "50%", background: it.col }} title={it.label} />)}
                  {items.length > 4 && <div style={{ fontSize: 6, color: T.sub, fontWeight: 700 }}>+{items.length - 4}</div>}
                </div>}
                {hasMoney && <div style={{ fontSize: 6, fontWeight: 700, color: T.grn, marginTop: 1 }}>{fmt(items.filter(it => it.tipo === "incasso").reduce((s, x) => s + (x.importo || 0), 0))}</div>}
              </div>;
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" as any }}>
          {[{c:T.grn,l:"Incasso"},{c:T.orange,l:"Pagamento"},{c:"#007aff",l:"Montaggio"},{c:"#af52de",l:"Consegna"},{c:"#5856d6",l:"Evento"}].map(x => (
            <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} /><span style={{ fontSize: 8, color: T.sub }}>{x.l}</span></div>
          ))}
        </div>
        
        {/* LISTA GIORNO PER GIORNO */}
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 8 }}> Dettaglio {meseLbl}</div>
        {Object.keys(calMap).sort((a, b) => Number(a) - Number(b)).map(dayStr => {
          const day = Number(dayStr);
          const items = calMap[day];
          const dateStr = contabMese + "-" + String(day).padStart(2, "0");
          const isLate = dateStr < today.toISOString().split("T")[0];
          const dayLbl = new Date(cY, cM - 1, day).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
          return <div key={dayStr} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 4, textTransform: "capitalize" as const }}>{dayLbl}</div>
            {items.map((it, si) => (
              <div key={si} style={{ display: "flex", alignItems: "center", padding: "8px 10px", background: T.card, borderRadius: 8, border: "1px solid " + (isLate && (it.tipo === "incasso" || it.tipo === "pagamento") ? T.red + "60" : T.bdr), marginBottom: 3 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: it.col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{it.ico}</div>
                <div style={{ flex: 1, marginLeft: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{it.label}</div>
                  <div style={{ fontSize: 9, color: T.sub }}>{it.detail}</div>
                </div>
                {it.importo && it.importo > 0 && <div style={{ fontSize: 13, fontWeight: 900, color: isLate && it.tipo === "incasso" ? T.red : it.col }}>{fmt(it.importo)}</div>}
              </div>
            ))}
          </div>;
        })}
        {Object.keys(calMap).length === 0 && <div style={{ textAlign: "center", padding: 32, color: T.sub }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}></div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Nessun evento questo mese</div>
        </div>}
        </>;
      })()}
      
      {/*  SPESE OPERATORI  */}
      {contabTab === "spese" && (() => {
        const CATEGORIE = [
          { id: "carburante", label: "Carburante", color: "#E8A020" },
          { id: "pranzo", label: "Pranzo", color: "#1A9E73" },
          { id: "materiale", label: "Materiale", color: "#3B7FE0" },
          { id: "attrezzatura", label: "Attrezzatura", color: "#8B5CF6" },
          { id: "trasferta", label: "Trasferta", color: "#DC4444" },
          { id: "telefono", label: "Telefono", color: "#0EA5E9" },
          { id: "varie", label: "Varie", color: "#6B7280" },
        ];
        const CATEGORIE_COLORS: Record<string, string> = Object.fromEntries(CATEGORIE.map(c => [c.id, c.color]));
        if (!speseLoaded) {
          setSpeseLoaded(true);
          supabase.from("spese_operatori").select("*").order("created_at", { ascending: false }).limit(50)
            .then(({ data }) => { setSpese(data || []); setLoadingSpese(false); })
            .catch(() => { setLoadingSpese(false); });
        }
        const tutteSpese = spese;
        const inAttesa = tutteSpese.filter(s => s.stato === "in_attesa");
        const approvate = tutteSpese.filter(s => s.stato === "approvata");
        const rifiutate = tutteSpese.filter(s => s.stato === "rifiutata");
        const totMese = approvate.reduce((s, x) => s + (x.importo || 0), 0);
        const totAttesa = inAttesa.reduce((s, x) => s + (x.importo || 0), 0);

        const aggiuntaLocale = (spesa: any) => {
          setSpese(prev => [spesa, ...prev]);
        };

        return <>
          {/* Header con bottone + Nuova spesa */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Gestione spese</div>
            <div onClick={() => setShowNuovaSpesaForm(f => !f)}
              style={{ padding: "8px 14px", borderRadius: 10, background: "#1A9E73", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 3px 0 #0D7C6B", display: "flex", alignItems: "center", gap: 6 }}>
              + Nuova spesa
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            <div style={{ background: "#fff3e0", borderRadius: 10, border: "1px solid #ff980030", padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Attesa</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#E8A020", fontFamily: "'JetBrains Mono',monospace" }}>€{totAttesa.toFixed(0)}</div>
              <div style={{ fontSize: 10, color: "#E8A020" }}>{inAttesa.length} spese</div>
            </div>
            <div style={{ background: "#e8f5e9", borderRadius: 10, border: "1px solid #1A9E7330", padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#1A9E73", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Approvate</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#1A9E73", fontFamily: "'JetBrains Mono',monospace" }}>€{totMese.toFixed(0)}</div>
              <div style={{ fontSize: 10, color: "#1A9E73" }}>{approvate.length} spese</div>
            </div>
            <div style={{ background: "#fce4ec", borderRadius: 10, border: "1px solid #DC444430", padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: "#DC4444", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>Rifiutate</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#DC4444", fontFamily: "'JetBrains Mono',monospace" }}>€{rifiutate.reduce((s,x)=>s+(x.importo||0),0).toFixed(0)}</div>
              <div style={{ fontSize: 10, color: "#DC4444" }}>{rifiutate.length} spese</div>
            </div>
          </div>

          {/* Form aggiunta rapida spesa manuale */}
          {showNuovaSpesaForm && (
            <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: 14, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 12 }}>Nuova spesa manuale</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4 }}>Descrizione</label>
                    <input value={nuovaSpesaNota} onChange={e => setNuovaSpesaNota(e.target.value)}
                      placeholder="Es. Pranzo cantiere Rossi..."
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontFamily: "Inter", background: T.bg, color: T.text, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 4 }}>Importo €</label>
                    <input inputMode="decimal" value={nuovaSpesaImporto} onChange={e => setNuovaSpesaImporto(e.target.value)}
                      placeholder="0.00"
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 16, fontFamily: "'JetBrains Mono',monospace", textAlign: "right", background: T.bg, color: T.text, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Categoria</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CATEGORIE.map(cat => (
                      <div key={cat.id} onClick={() => setNuovaSpesaCat(cat.id)}
                        style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${nuovaSpesaCat === cat.id ? cat.color : T.bdr}`,
                          background: nuovaSpesaCat === cat.id ? cat.color + "18" : T.bg, fontSize: 12, fontWeight: 600,
                          color: nuovaSpesaCat === cat.id ? cat.color : T.sub, cursor: "pointer",
                          boxShadow: nuovaSpesaCat === cat.id ? `0 2px 0 ${cat.color}40` : "none" }}>
                        {cat.label}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div onClick={() => { setShowNuovaSpesaForm(false); setNuovaSpesaNota(""); setNuovaSpesaImporto(""); setNuovaSpesaCat("varie"); }}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, textAlign: "center", fontSize: 13, fontWeight: 600, cursor: "pointer", background: T.bg, border: `1px solid ${T.bdr}`, color: T.sub }}>
                    Annulla
                  </div>
                  <div onClick={async () => {
                    if (!nuovaSpesaImporto || parseFloat(nuovaSpesaImporto) <= 0) return;
                    const nuova = { operatore_id: "titolare", operatore_nome: "Titolare", importo: parseFloat(nuovaSpesaImporto), categoria: nuovaSpesaCat, nota: nuovaSpesaNota, stato: "approvata", created_at: new Date().toISOString(), azienda_id: "local" };
                    const { data } = await supabase.from("spese_operatori").insert(nuova).select().single().catch(() => ({ data: { ...nuova, id: Date.now().toString() } }));
                    setSpese(prev => [data || nuova, ...prev]);
                    setShowNuovaSpesaForm(false); setNuovaSpesaNota(""); setNuovaSpesaImporto(""); setNuovaSpesaCat("varie");
                  }}
                    style={{ flex: 2, padding: "10px", borderRadius: 10, textAlign: "center", fontSize: 13, fontWeight: 800, cursor: "pointer", background: "#1A9E73", color: "#fff",
                      boxShadow: "0 3px 0 #0D7C6B" }}>
                    Salva spesa approvata
                  </div>
                </div>
              </div>
            </div>
          )}

          {loadingSpese && <div style={{ textAlign: "center", padding: 24, color: T.sub, fontSize: 13 }}>Caricamento...</div>}

          {/* Da approvare */}
          {inAttesa.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#E8A020", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Da approvare ({inAttesa.length})</div>
            {inAttesa.map(s => (
              <div key={s.id} style={{ background: T.card, borderRadius: 12, border: `1.5px solid #E8A02030`, marginBottom: 8, overflow: "hidden",
                boxShadow: "0 3px 0 #E8A02020" }}>
                {s.foto_url && <img src={s.foto_url} style={{ width: "100%", maxHeight: 120, objectFit: "cover" }} />}
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{s.operatore_nome || "Operatore"}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: CATEGORIE_COLORS[s.categoria] || "#888", fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: (CATEGORIE_COLORS[s.categoria] || "#888") + "15" }}>{s.categoria}</span>
                        <span style={{ fontSize: 10, color: T.sub }}>{new Date(s.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {s.nota && <div style={{ fontSize: 12, color: T.sub, marginTop: 4, fontStyle: "italic" }}>{s.nota}</div>}
                      {s.cm_id && <div style={{ fontSize: 10, color: "#3B7FE0", marginTop: 2 }}>Commessa collegata</div>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#E8A020", fontFamily: "'JetBrains Mono',monospace" }}>€{(s.importo||0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div onClick={async () => { await supabase.from("spese_operatori").update({ stato: "rifiutata" }).eq("id", s.id); setSpese(prev => prev.map(x => x.id === s.id ? { ...x, stato: "rifiutata" } : x)); }}
                      style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#DC444415", color: "#DC4444", fontSize: 13, fontWeight: 700, textAlign: "center", cursor: "pointer", border: "1px solid #DC444430",
                        boxShadow: "0 2px 0 #DC444430" }}>
                      Rifiuta
                    </div>
                    <div onClick={async () => { await supabase.from("spese_operatori").update({ stato: "approvata" }).eq("id", s.id); setSpese(prev => prev.map(x => x.id === s.id ? { ...x, stato: "approvata" } : x)); }}
                      style={{ flex: 2, padding: "10px", borderRadius: 10, background: "#1A9E73", color: "#fff", fontSize: 13, fontWeight: 800, textAlign: "center", cursor: "pointer",
                        boxShadow: "0 3px 0 #0D7C6B" }}>
                      ✓ Approva
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>}

          {/* Approvate */}
          {approvate.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, margin: "16px 0 8px" }}>Approvate ({approvate.length})</div>
            {approvate.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 6,
                boxShadow: "0 2px 0 rgba(0,0,0,0.06)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: CATEGORIE_COLORS[s.categoria] || "#888", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.operatore_nome || "Titolare"}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{s.categoria} · {new Date(s.created_at).toLocaleDateString("it-IT")}</div>
                  {s.nota && <div style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.nota}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#1A9E73", fontFamily: "'JetBrains Mono',monospace" }}>€{(s.importo||0).toFixed(2)}</div>
              </div>
            ))}
          </>}

          {!loadingSpese && spese.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: T.sub }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Nessuna spesa ancora</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Aggiungi la prima spesa con il tasto qui sopra</div>
              <div onClick={() => setShowNuovaSpesaForm(true)}
                style={{ marginTop: 16, padding: "12px 24px", borderRadius: 12, background: "#1A9E73", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-block",
                  boxShadow: "0 3px 0 #0D7C6B" }}>
                + Aggiungi prima spesa
              </div>
            </div>
          )}
        </>;
      })()}

      {/*  SDI  */}
      {contabTab === "sdi" && <>
        <div style={{ background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 4 }}> Fatturazione Elettronica</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Genera XML FatturaPA 1.2 per il Sistema di Interscambio (SDI).</div>
          <div style={{ fontSize: 9, color: T.sub }}>Formato: FPR12 · Regime: RF01 · I file possono essere caricati su AdE, Aruba, Fatture in Cloud.</div>
        </div>
        {allEmesse.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", padding: "10px 12px", background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>N. {f.numero}/{f.anno} — {f.cliente}</div>
              <div style={{ fontSize: 9, color: T.sub }}>{f.tipo} · {f.dataISO} · {fmt(f.importo)}</div>
            </div>
            <div onClick={() => generaXmlSDI(f)} style={{ padding: "8px 14px", borderRadius: 8, background: T.purpleLt, color: T.purple, fontSize: 11, fontWeight: 700, cursor: "pointer" }}> XML</div>
          </div>
        ))}
      </>}
      
      </div>
    </div>
    );

}
