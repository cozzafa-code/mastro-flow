"use client";
// @ts-nocheck
// MASTRO ERP — MastroDesktop v4 — Control Room completa
// Tutti i moduli da MASTRO_BRAIN v3.0

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, Ico, ICO, I } from "./mastro-constants";
import HomePanel from "./HomePanel";
import CommessePanel from "./CommessePanel";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import ClientiPanel from "./ClientiPanel";
import ContabilitaPanel from "./ContabilitaPanel";
import SettingsPanel from "./SettingsPanel";
import MontaggiCalendar from "./MontaggiCalendar";

const TEAL = "#1A9E73";
const DARK = "#1A1A1C";

const NAV_GROUPS = [
  { label: "Cantiere", items: [
    { key: "home",        ico: "home",       label: "Dashboard" },
    { key: "commesse",    ico: "folder",     label: "Commesse" },
    { key: "agenda",      ico: "calendar",   label: "Agenda" },
    { key: "montaggi",    ico: "wrench",     label: "Montaggi" },
    { key: "misure",      ico: "ruler",      label: "MISURE", sub: "App tablet" },
  ]},
  { label: "Gestione", items: [
    { key: "clienti",     ico: "users",      label: "Clienti" },
    { key: "messaggi",    ico: "inbox",      label: "Messaggi" },
    { key: "contabilita", ico: "wallet",     label: "Contabilità" },
    { key: "fatture",     ico: "fileText",   label: "Fatture SDI", soon: true },
    { key: "ordini",      ico: "package",    label: "Ordini", sub: "Trasformatore" },
  ]},
  { label: "Produzione", items: [
    { key: "cnc",         ico: "cpu",        label: "CNC Emmegi", soon: true },
    { key: "listini",     ico: "barChart",   label: "Listini", soon: true },
    { key: "enea",        ico: "shield",     label: "ENEA / CAM 2026", soon: true },
  ]},
  { label: "Crescita", items: [
    { key: "leads",       ico: "zap",        label: "TROVA CLIENTI", soon: true },
    { key: "infissiora",  ico: "globe",      label: "InfissiOra Mercato", soon: true },
    { key: "rete",        ico: "share2",     label: "RETE Agenti", soon: true },
    { key: "cliente",     ico: "monitor",    label: "Portale CLIENTE B2C", soon: true },
  ]},
  { label: "Sistema", items: [
    { key: "team",        ico: "shield",     label: "Team & Permessi" },
    { key: "settings",    ico: "settings",   label: "Impostazioni" },
  ]},
];

const PLACEHOLDERS: Record<string, {icon: string, title: string, desc: string, tag: string, color: string}> = {
  misure:     { icon: "ruler",    title: "MASTRO MISURE",     color: "#8B5CF6", tag: "App Tablet dedicata",    desc: "Rilievi dal cantiere con tablet. Vano per vano, misure luce netta, imbotte, davanzale. Sincronizzazione automatica con la commessa." },
  fatture:    { icon: "fileText", title: "Fatture SDI",       color: "#E8A020", tag: "SDI · FatturaPA",        desc: "Fatturazione elettronica integrata via intermediario SDI. XML FatturaPA già generato. Integrazione con fattura-elettronica-api.it (M50 €10/mese)." },
  ordini:     { icon: "package",  title: "Trasformatore Ordini", color: "#3B7FE0", tag: "Universale",         desc: "Converte ogni ordine fornitore nel formato nativo del produttore. Emmegi, Metra, Schüco, Reynaers — zero ridigitazione." },
  cnc:        { icon: "cpu",      title: "MASTRO CNC",        color: "#DC4444", tag: "Emmegi CENTRO 2 · TCUT v1.7+", desc: "Genera file EWX/XML per macchine CNC Emmegi direttamente dalle commesse. Ottimizzazione barre, gestione codice a barre, zero errori manuali." },
  listini:    { icon: "barChart", title: "MASTRO LISTINI",    color: "#E8A020", tag: "Catalogo fornitori",     desc: "Importa listini fornitore in Excel/PDF. Prezzi aggiornati automaticamente nei preventivi. Gap critico vs Opera/FPPRO — da colmare." },
  enea:       { icon: "shield",   title: "MASTRO ENEA",       color: TEAL,      tag: "CAM 2026 · Ecobonus · U-value", desc: "Pratiche ENEA automatizzate. CAM 2026 (DM 24/11/2025 in vigore 1 Feb 2026), contenuto riciclato, UNI 11673-1, trasmittanza U-value per zona climatica A–F. Vantaggio UNICO — Opera/FPPRO non ce l'hanno." },
  leads:      { icon: "zap",      title: "TROVA CLIENTI",     color: TEAL,      tag: "F3 post-lancio · Differenziatore unico", desc: "Scraping automatico da Habitissimo, Instapro, Subito.it, Immobiliare.it per zona. Lead B2C con sistema crediti. Nessun gestionale concorrente porta lavoro nuovo al serramentista. MASTRO lo fa." },
  infissiora: { icon: "globe",    title: "InfissiOra · MASTRO MERCATO", color: "#3B7FE0", tag: "F4 · Marketplace inverso B2C", desc: "Privati si iscrivono e aspettano offerte dai serramentisti — non il contrario. Lead caldi per definizione. Network effect: più serramentisti = più clienti. Brand doppio: InfissiOra.it (B2C) + MASTRO MERCATO (dentro l'app)." },
  rete:       { icon: "share2",   title: "MASTRO RETE",       color: "#8B5CF6", tag: "Agenti commerciali",    desc: "App dedicata per agenti di vendita. Ogni agente vede i suoi preventivi, i suoi clienti, le sue provvigioni. Deploy separato Vercel, Supabase condiviso, PIN login." },
  cliente:    { icon: "monitor",  title: "MASTRO CLIENTE",    color: "#E8A020", tag: "Configuratore B2C · Sostituce Promotech €10K", desc: "Il cliente finale configura la finestra dal portale pubblico → il preventivo arriva direttamente nel gestionale. Modello B2C2B. Incluso nell'abbonamento — zero costi aggiuntivi." },
  team:       { icon: "shield",   title: "Team & Permessi",   color: TEAL,      tag: "Multi-utente",          desc: "Gestisci operatori, ruoli e permessi. Marchio Posa Qualità. Ogni membro del team vede solo quello che gli serve." },
};

export default function MastroDesktop() {
  const ctx = useMastro();
  const { T, cantieri=[], tasks=[], fattureDB=[], msgs=[], aziendaInfo,
    setTab, tab, giorniFermaCM, sogliaDays=7, setSelectedCM, setFilterFase, setSearchQ } = ctx;

  const [collapsed, setCollapsed] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const sw = collapsed ? 52 : 224;

  const activeNav = tab === "montaggi_cal" ? "montaggi" : (tab || "home");
  const unread = msgs.filter(m => !m.letto).length;
  const ferme = cantieri.filter(c => giorniFermaCM(c) >= sogliaDays && c.fase !== "chiusura").length;
  const taskOpen = tasks.filter(t => !t.done).length;
  const fatScad = fattureDB.filter(f => !f.pagata && f.scadenza < new Date().toISOString().split("T")[0]).length;

  const navTo = (key: string) => {
    const map: Record<string,string> = { montaggi:"montaggi_cal", misure:"commesse", fatture:"contabilita", ordini:"commesse", cnc:"cnc", listini:"listini", enea:"enea", leads:"leads", infissiora:"infissiora", rete:"rete", cliente:"cliente", team:"settings" };
    setTab(map[key] || key);
  };

  const getBadge = (key: string) => {
    if (key === "messaggi") return unread;
    if (key === "commesse") return ferme;
    if (key === "contabilita" || key === "fatture") return fatScad;
    return 0;
  };

  const placeholder = (key: string) => {
    const p = PLACEHOLDERS[key];
    if (!p) return null;
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"70vh", gap:16, padding:40, textAlign:"center" }}>
        <div style={{ width:72, height:72, borderRadius:20, background:p.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <I d={ICO[p.icon as keyof typeof ICO]} s={32} c={p.color} />
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ fontSize:22, fontWeight:900, color:T.text }}>{p.title}</div>
          <div style={{ padding:"3px 10px", borderRadius:100, background:p.color+"15", fontSize:11, fontWeight:700, color:p.color }}>{p.tag}</div>
        </div>
        <div style={{ fontSize:15, color:T.sub, maxWidth:480, lineHeight:1.7 }}>{p.desc}</div>
        <div style={{ padding:"10px 24px", borderRadius:10, background:p.color+"12", border:`1px solid ${p.color}30`, fontSize:13, fontWeight:700, color:p.color }}>In sviluppo — disponibile presto</div>
      </div>
    );
  };

  const renderContent = () => {
    switch (tab) {
      case "home":        return <HomePanel />;
      case "commesse":    return <CommessePanel />;
      case "agenda":      return <AgendaPanel />;
      case "montaggi_cal":return <MontaggiCalendar />;
      case "clienti":     return <ClientiPanel />;
      case "messaggi":    return <MessaggiPanel />;
      case "contabilita": return <ContabilitaPanel />;
      case "settings":    return <SettingsPanel />;
      default:            return placeholder(tab) || placeholder(activeNav) || <HomePanel />;
    }
  };

  const currentItem = NAV_GROUPS.flatMap(g => g.items).find(n => n.key === activeNav);
  const KPI = [
    { l:"Commesse attive", v:cantieri.filter(c=>c.fase!=="chiusura").length, c:TEAL, k:"commesse" },
    { l:"Commesse ferme",  v:ferme,    c:ferme>0?"#DC4444":TEAL, k:"commesse" },
    { l:"Task aperti",     v:taskOpen, c:taskOpen>0?"#E8A020":TEAL, k:"" },
    { l:"Fatture scadute", v:fatScad,  c:fatScad>0?"#DC4444":TEAL, k:"contabilita" },
    { l:"Messaggi",        v:unread,   c:unread>0?"#3B7FE0":TEAL, k:"messaggi" },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", width:"100vw", background:T.bg, fontFamily:FF, color:T.text, overflow:"hidden" }}>

      {/* SIDEBAR */}
      <div style={{ width:sw, flexShrink:0, background:DARK, display:"flex", flexDirection:"column", transition:"width 0.18s ease", overflow:"hidden", zIndex:10, borderRight:"1px solid rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div style={{ height:56, display:"flex", alignItems:"center", padding:"0 14px", gap:10, borderBottom:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:TEAL, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:900, color:"#fff", flexShrink:0 }}>M</div>
          {!collapsed && <span style={{ fontSize:13, fontWeight:800, color:"#fff", letterSpacing:1.5, whiteSpace:"nowrap" }}>MASTRO</span>}
        </div>
        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"4px 0" }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label}>
              {!collapsed && <div style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.2)", padding:"10px 14px 3px" }}>{group.label}</div>}
              {group.items.map(({ key, ico, label, sub, soon }) => {
                const active = activeNav === key;
                const badge = getBadge(key);
                return (
                  <div key={key} onClick={() => navTo(key)}
                    style={{ display:"flex", alignItems:"center", gap:9, padding:collapsed?"8px 0 8px 16px":"8px 12px 8px 14px", cursor:"pointer", position:"relative", background:active?"rgba(255,255,255,0.08)":"transparent", transition:"background 0.1s" }}
                    onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
                    onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                    {active && <div style={{ position:"absolute", left:0, top:"15%", bottom:"15%", width:2, borderRadius:"0 2px 2px 0", background:TEAL }} />}
                    <Ico d={ICO[ico as keyof typeof ICO]} s={16} c={active?"#fff":"rgba(255,255,255,0.38)"} />
                    {!collapsed && (
                      <>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:active?600:400, color:active?"#fff":"rgba(255,255,255,0.5)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{label}</div>
                          {sub && <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", marginTop:1 }}>{sub}</div>}
                        </div>
                        {badge > 0 && <span style={{ background:"#DC4444", color:"#fff", fontSize:9, fontWeight:700, borderRadius:10, padding:"1px 5px", minWidth:16, textAlign:"center", flexShrink:0 }}>{badge}</span>}
                        {soon && badge===0 && <span style={{ background:TEAL+"18", color:TEAL, fontSize:9, fontWeight:700, borderRadius:5, padding:"1px 5px", flexShrink:0 }}>Presto</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        {/* User */}
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", flexShrink:0 }}>
          {!collapsed && (
            <div style={{ padding:"10px 14px", display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:TEAL+"25", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:TEAL, flexShrink:0 }}>
                {(aziendaInfo?.nome||aziendaInfo?.ragione||"M")[0].toUpperCase()}
              </div>
              <div style={{ overflow:"hidden" }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#fff", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{aziendaInfo?.nome||aziendaInfo?.ragione||"La mia azienda"}</div>
                <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>Piano START</div>
              </div>
            </div>
          )}
          <div onClick={()=>setCollapsed(c=>!c)} style={{ height:36, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.25)", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform:collapsed?"rotate(0deg)":"rotate(180deg)", transition:"transform 0.18s" }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {/* Topbar */}
        <div style={{ height:56, flexShrink:0, background:"#fff", borderBottom:`1px solid ${T.bdr}`, display:"flex", alignItems:"center", padding:"0 20px", gap:14 }}>
          <span style={{ fontSize:15, fontWeight:800, color:T.text, letterSpacing:-0.3, whiteSpace:"nowrap" }}>{currentItem?.label||"Dashboard"}</span>
          {currentItem?.sub && <span style={{ fontSize:11, color:T.sub, background:T.bg, padding:"2px 8px", borderRadius:6, border:`1px solid ${T.bdr}` }}>{currentItem.sub}</span>}
          <div style={{ flex:1, maxWidth:360, display:"flex", alignItems:"center", background:T.bg, borderRadius:8, padding:"7px 12px", gap:8, border:`1px solid ${T.bdr}` }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ flex:1, border:"none", background:"transparent", fontSize:13, color:T.text, outline:"none", fontFamily:FF }} placeholder="Cerca commesse, clienti..." value={localSearch} onChange={e=>{ setLocalSearch(e.target.value); if(setSearchQ) setSearchQ(e.target.value); }} />
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
            {ferme>0 && <div onClick={()=>navTo("commesse")} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, background:"#DC444412", border:"1px solid #DC444428", cursor:"pointer" }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#DC4444" }}/><span style={{ fontSize:11, fontWeight:700, color:"#DC4444" }}>{ferme} ferme</span></div>}
            {unread>0 && <div onClick={()=>navTo("messaggi")} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:7, background:"#3B7FE012", border:"1px solid #3B7FE028", cursor:"pointer" }}><div style={{ width:5, height:5, borderRadius:"50%", background:"#3B7FE0" }}/><span style={{ fontSize:11, fontWeight:700, color:"#3B7FE0" }}>{unread} msg</span></div>}
            <div style={{ width:32, height:32, borderRadius:"50%", background:TEAL+"18", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:TEAL, cursor:"pointer" }}>{(aziendaInfo?.nome||"M")[0].toUpperCase()}</div>
          </div>
        </div>

        {/* KPI bar — solo home */}
        {(tab==="home"||tab===undefined) && (
          <div style={{ display:"flex", background:"#fff", borderBottom:`1px solid ${T.bdr}`, flexShrink:0 }}>
            {KPI.map((k,i)=>(
              <div key={i} onClick={()=>k.k&&navTo(k.k)} style={{ flex:1, padding:"10px 20px", borderRight:i<KPI.length-1?`1px solid ${T.bdr}`:"none", display:"flex", alignItems:"center", gap:10, cursor:k.k?"pointer":"default" }}>
                <div style={{ width:36, height:36, borderRadius:10, background:k.c+"15", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ fontSize:16, fontWeight:900, color:k.c, fontFamily:FM }}>{k.v}</span>
                </div>
                <div style={{ fontSize:11, color:k.v>0&&k.c!==TEAL?k.c:T.sub, lineHeight:1.3 }}>{k.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto" }}>{renderContent()}</div>
      </div>
    </div>
  );
}
