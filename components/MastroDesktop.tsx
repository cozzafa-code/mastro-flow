"use client";
// @ts-nocheck
// MASTRO — MastroDesktop v5 — Control Room completa
// Aggrega ERP + MISURE + RETE + PRODUZIONE + MONTAGGI

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, Ico, ICO, I } from "./mastro-constants";
import DesktopDashboard from "./DesktopDashboard";
import DesktopCommesse from "./DesktopCommesse";
import DesktopContabilita from "./DesktopContabilita";
import DesktopMontaggi from "./DesktopMontaggi";
import DesktopTeam from "./DesktopTeam";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import ClientiPanel from "./ClientiPanel";
import SettingsPanel from "./SettingsPanel";
import MontaggiCalendar from "./MontaggiCalendar";

const TEAL="#1A9E73", DARK="#1A1A1C";

const NAV_GROUPS = [
  { label:"Cantiere", items:[
    { key:"home",       ico:"home",     label:"Dashboard" },
    { key:"commesse",   ico:"folder",   label:"Commesse" },
    { key:"agenda",     ico:"calendar", label:"Agenda" },
    { key:"montaggi",   ico:"wrench",   label:"Montaggi" },
  ]},
  { label:"Gestione", items:[
    { key:"clienti",    ico:"users",    label:"Clienti" },
    { key:"messaggi",   ico:"inbox",    label:"Messaggi" },
    { key:"contabilita",ico:"wallet",   label:"Contabilità" },
    { key:"fatture",    ico:"fileText", label:"Fatture SDI", soon:true },
    { key:"ordini",     ico:"package",  label:"Ordini", sub:"Trasformatore" },
  ]},
  { label:"Produzione", items:[
    { key:"cnc",        ico:"cpu",      label:"CNC Emmegi",   soon:true },
    { key:"listini",    ico:"barChart", label:"Listini",      soon:true },
    { key:"enea",       ico:"shield",   label:"ENEA/CAM 2026",soon:true },
  ]},
  { label:"Crescita", items:[
    { key:"leads",      ico:"zap",      label:"Trova Clienti",soon:true },
    { key:"infissiora", ico:"globe",    label:"InfissiOra",   soon:true },
    { key:"rete",       ico:"share2",   label:"RETE Agenti",  soon:true },
    { key:"cliente",    ico:"monitor",  label:"Portale B2C",  soon:true },
  ]},
  { label:"Sistema", items:[
    { key:"team",       ico:"shield",   label:"Team" },
    { key:"settings",   ico:"settings", label:"Impostazioni" },
  ]},
];

const PLACEHOLDER_DATA: Record<string,{title:string,desc:string,tag:string,color:string,icon:string}> = {
  fatture:    {title:"Fatture SDI",         tag:"SDI · FatturaPA",           color:"#E8A020", icon:"fileText",  desc:"Fatturazione elettronica integrata. XML FatturaPA già generato. Integrazione con fattura-elettronica-api.it."},
  ordini:     {title:"Trasformatore Ordini",tag:"Universale",                color:"#3B7FE0", icon:"package",   desc:"Converte ogni ordine nel formato nativo del produttore. Emmegi, Metra, Schüco, Reynaers — zero ridigitazione."},
  cnc:        {title:"MASTRO CNC",          tag:"Emmegi CENTRO 2 · TCUT v1.7",color:"#DC4444",icon:"cpu",       desc:"Genera file EWX/XML per macchine CNC Emmegi direttamente dalle commesse. Ottimizzazione barre, gestione barcode."},
  listini:    {title:"MASTRO LISTINI",      tag:"Catalogo fornitori",         color:"#E8A020", icon:"barChart",  desc:"Importa listini fornitore in Excel/PDF. Prezzi aggiornati automaticamente nei preventivi."},
  enea:       {title:"ENEA / CAM 2026",     tag:"Ecobonus · U-value · CE",    color:TEAL,      icon:"shield",    desc:"CAM 2026, U-value per zona A–F, Dichiarazione Prestazione, etichetta CE. Vantaggio UNICO — Opera/FPPRO non ce l'hanno."},
  leads:      {title:"TROVA CLIENTI",       tag:"Differenziatore unico",      color:TEAL,      icon:"zap",       desc:"Scraping da Habitissimo, Instapro, Subito.it per zona. Lead B2C con crediti. Nessun competitor porta lavoro nuovo."},
  infissiora: {title:"InfissiOra · Mercato",tag:"F4 · Marketplace inverso B2C",color:"#3B7FE0",icon:"globe",    desc:"Privati cercano preventivi, serramentisti rispondono. Lead caldi. Network effect. Brand doppio InfissiOra.it."},
  rete:       {title:"MASTRO RETE",         tag:"Agenti commerciali",         color:"#8B5CF6", icon:"share2",    desc:"App dedicata agenti. Ognuno vede i suoi preventivi, clienti, provvigioni. Deploy separato Vercel."},
  cliente:    {title:"Portale CLIENTE B2C", tag:"Sostituisce Promotech €10K", color:"#E8A020", icon:"monitor",   desc:"Il cliente configura la finestra → preventivo arriva nel gestionale. Incluso nell'abbonamento."},
};

export default function MastroDesktop() {
  const ctx = useMastro();
  const { T, cantieri=[], msgs=[], fattureDB=[], montaggiDB=[], tasks=[], aziendaInfo, setTab, tab, giorniFermaCM, sogliaDays=7 } = ctx;
  const [collapsed, setCollapsed] = useState(false);
  const sw = collapsed ? 50 : 220;

  const activeNav = tab==="montaggi_cal"?"montaggi":(tab||"home");
  const unread = msgs.filter((m:any)=>!m.letto).length;
  const ferme = cantieri.filter(c=>giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura").length;
  const TODAY = new Date().toISOString().split("T")[0];
  const fatScad = fattureDB.filter((f:any)=>!f.pagata&&f.scadenza<TODAY).length;

  const navTo = (key:string) => {
    const map:Record<string,string> = { montaggi:"montaggi_cal", fatture:"contabilita", ordini:"commesse", cnc:"cnc", listini:"listini", enea:"enea", leads:"leads", infissiora:"infissiora", rete:"rete", cliente:"cliente", team:"settings" };
    setTab(map[key]||key);
  };

  const getBadge = (key:string) => {
    if(key==="messaggi") return unread;
    if(key==="commesse") return ferme;
    if(key==="contabilita"||key==="fatture") return fatScad;
    return 0;
  };

  const Placeholder = ({k}:{k:string}) => {
    const p = PLACEHOLDER_DATA[k];
    if(!p) return <div style={{padding:40,textAlign:"center",color:T.sub,fontSize:13}}>Modulo non disponibile</div>;
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"70vh",gap:14,padding:40,textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:20,background:p.color+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <I d={ICO[p.icon as keyof typeof ICO]} s={32} c={p.color}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:22,fontWeight:500,color:T.text}}>{p.title}</div>
          <div style={{padding:"3px 10px",borderRadius:100,background:p.color+"12",fontSize:11,fontWeight:500,color:p.color}}>{p.tag}</div>
        </div>
        <div style={{fontSize:14,color:T.sub,maxWidth:480,lineHeight:1.7}}>{p.desc}</div>
        <div style={{padding:"8px 20px",borderRadius:8,background:p.color+"10",border:`1px solid ${p.color}25`,fontSize:12,fontWeight:500,color:p.color}}>In sviluppo</div>
      </div>
    );
  };

  const renderContent = () => {
    switch(tab) {
      case "home":         return <DesktopDashboard/>;
      case "commesse":     return <DesktopCommesse/>;
      case "agenda":       return <AgendaPanel/>;
      case "montaggi_cal": return <DesktopMontaggi/>;
      case "clienti":      return <ClientiPanel/>;
      case "messaggi":     return <MessaggiPanel/>;
      case "contabilita":  return <DesktopContabilita/>;
      case "settings":     return <SettingsPanel/>;
      case "team":         return <DesktopTeam/>;
      default:             return <Placeholder k={tab||""}/>;
    }
  };

  const currentItem = NAV_GROUPS.flatMap(g=>g.items).find(n=>n.key===activeNav||(activeNav==="montaggi_cal"&&n.key==="montaggi"));

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",background:T.bg,fontFamily:FF,color:T.text,overflow:"hidden"}}>

      {/* SIDEBAR */}
      <div style={{width:sw,flexShrink:0,background:DARK,display:"flex",flexDirection:"column",transition:"width 0.18s ease",overflow:"hidden",zIndex:10,borderRight:"1px solid rgba(255,255,255,0.05)"}}>
        {/* Logo */}
        <div style={{height:54,display:"flex",alignItems:"center",padding:"0 12px",gap:10,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:8,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0,letterSpacing:-1}}>M</div>
          {!collapsed&&<span style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:1.5,whiteSpace:"nowrap"}}>MASTRO</span>}
        </div>
        {/* Nav */}
        <nav style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
          {NAV_GROUPS.map(group=>(
            <div key={group.label}>
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",color:"rgba(255,255,255,0.2)",padding:"10px 14px 3px"}}>{group.label}</div>}
              {group.items.map(({key,ico,label,sub,soon})=>{
                const active=activeNav===key||(activeNav==="montaggi_cal"&&key==="montaggi");
                const badge=getBadge(key);
                return (
                  <div key={key} onClick={()=>navTo(key)}
                    style={{display:"flex",alignItems:"center",gap:9,padding:collapsed?"8px 0 8px 14px":"8px 12px 8px 14px",cursor:"pointer",position:"relative",background:active?"rgba(255,255,255,0.08)":"transparent",transition:"background .1s"}}
                    onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
                    onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                    {active&&<div style={{position:"absolute",left:0,top:"15%",bottom:"15%",width:2,borderRadius:"0 2px 2px 0",background:TEAL}}/>}
                    <Ico d={ICO[ico as keyof typeof ICO]} s={15} c={active?"#fff":"rgba(255,255,255,0.38)"}/>
                    {!collapsed&&(
                      <>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:active?600:400,color:active?"#fff":"rgba(255,255,255,0.5)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                          {sub&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>{sub}</div>}
                        </div>
                        {badge>0&&<span style={{background:"#DC4444",color:"#fff",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center",flexShrink:0}}>{badge}</span>}
                        {soon&&badge===0&&<span style={{background:TEAL+"18",color:TEAL,fontSize:9,fontWeight:600,borderRadius:5,padding:"1px 5px",flexShrink:0}}>Presto</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        {/* User */}
        <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          {!collapsed&&(
            <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:TEAL+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:TEAL,flexShrink:0}}>
                {(aziendaInfo?.nome||aziendaInfo?.ragione||"M")[0].toUpperCase()}
              </div>
              <div style={{overflow:"hidden",flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:"#fff",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{aziendaInfo?.nome||aziendaInfo?.ragione||"La mia azienda"}</div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>Piano START</div>
              </div>
            </div>
          )}
          <div onClick={()=>setCollapsed(c=>!c)} style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.25)",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform:collapsed?"rotate(0deg)":"rotate(180deg)",transition:"transform 0.18s"}}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        {/* Topbar */}
        <div style={{height:54,flexShrink:0,background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",padding:"0 20px",gap:14}}>
          <span style={{fontSize:14,fontWeight:500,color:T.text,letterSpacing:-0.2,whiteSpace:"nowrap"}}>{currentItem?.label||"Dashboard"}</span>
          {currentItem?.sub&&<span style={{fontSize:10,color:T.sub,background:T.bg,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${T.bdr}`}}>{currentItem.sub}</span>}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {ferme>0&&<div onClick={()=>setTab("commesse")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:"#DC444412",border:"1px solid #DC444428",cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#DC4444"}}/><span style={{fontSize:11,fontWeight:500,color:"#DC4444"}}>{ferme} ferme</span></div>}
            {unread>0&&<div onClick={()=>setTab("messaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:"#3B7FE012",border:"1px solid #3B7FE028",cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#3B7FE0"}}/><span style={{fontSize:11,fontWeight:500,color:"#3B7FE0"}}>{unread} msg</span></div>}
            <div style={{width:30,height:30,borderRadius:"50%",background:TEAL+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:TEAL,cursor:"pointer"}}>{(aziendaInfo?.nome||"M")[0].toUpperCase()}</div>
          </div>
        </div>
        {/* Content */}
        <div style={{flex:1,overflow:"hidden"}}>{renderContent()}</div>
      </div>
    </div>
  );
}
