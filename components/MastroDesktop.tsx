"use client";
// @ts-nocheck
// MASTRO — MastroDesktop v7 — Control Room COMPLETA
// ERP + MISURE + RETE + PRODUZIONE + MONTAGGI — Unica piattaforma, viste per ruolo

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, Ico, ICO, I } from "./mastro-constants";
import DesktopDashboard from "./DesktopDashboard";
import DesktopCommesse from "./DesktopCommesse";
import DesktopContabilita from "./DesktopContabilita";
import DesktopMontaggi from "./DesktopMontaggi";
import DesktopProduzione from "./DesktopProduzione";
import DesktopClienti from "./DesktopClienti";
import DesktopAgente from "./DesktopAgente";
import DesktopTeam from "./DesktopTeam";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import SettingsPanel from "./SettingsPanel";
import ConfiguratoreCommessa from "./ConfiguratoreCommessa";

const TEAL="#1A9E73", DARK="#1A1A1C", ORANGE="#F97316", PURPLE="#8B5CF6", RED="#DC4444";

const NAV = [
  { group:"Cantiere", items:[
    { key:"home",         ico:"home",     label:"Dashboard" },
    { key:"commesse",     ico:"folder",   label:"Commesse" },
    { key:"configuratore",ico:"grid",     label:"Configuratore" },
    { key:"agenda",       ico:"calendar", label:"Agenda" },
  ]},
  { group:"Produzione", items:[
    { key:"produzione",   ico:"cpu",      label:"Produzione",   sub:"Barra → Finestra" },
    { key:"montaggi",     ico:"wrench",   label:"Montaggi" },
    { key:"ordini",       ico:"package",  label:"Ordini",       soon:true },
  ]},
  { group:"Gestione", items:[
    { key:"clienti",      ico:"users",    label:"Clienti" },
    { key:"agente",       ico:"zap",      label:"AI Agente" },
    { key:"messaggi",     ico:"inbox",    label:"Messaggi" },
    { key:"contabilita",  ico:"wallet",   label:"Contabilità" },
    { key:"fatture",      ico:"fileText", label:"Fatture SDI",  soon:true },
  ]},
  { group:"Crescita", items:[
    { key:"enea",         ico:"shield",   label:"ENEA / CAM",   soon:true },
    { key:"leads",        ico:"zap",      label:"Trova Clienti",soon:true },
    { key:"infissiora",   ico:"globe",    label:"InfissiOra",   soon:true },
    { key:"rete",         ico:"share2",   label:"RETE Agenti",  soon:true },
    { key:"cliente_b2c",  ico:"monitor",  label:"Portale B2C",  soon:true },
  ]},
  { group:"Sistema", items:[
    { key:"team",         ico:"users",    label:"Team" },
    { key:"settings",     ico:"settings", label:"Impostazioni" },
  ]},
];

const PLACEHOLDERS:Record<string,string[]> = {
  ordini:     ["Trasformatore Ordini","Conversione automatica per Schüco, Emmegi, Reynaers. Zero ridigitazione.","#1A9E73","package"],
  fatture:    ["Fatture SDI","FatturaPA XML già generato. Integrazione SDI intermediario.","#F97316","fileText"],
  enea:       ["ENEA / CAM 2026","Uw per zona A–F, CAM 2026, etichetta CE. Opera/FPPRO non ce l'hanno.","#1A9E73","shield"],
  leads:      ["TROVA CLIENTI","Scraping Habitissimo/Instapro per zona. Lead B2C con crediti.","#1A9E73","zap"],
  infissiora: ["InfissiOra","Marketplace inverso B2C. Brand pubblico InfissiOra.it.","#3B7FE0","globe"],
  rete:       ["MASTRO RETE","App agenti. Preventivi, clienti, provvigioni per zona.","#8B5CF6","share2"],
  cliente_b2c:["Portale Cliente","Il cliente vede stato lavoro, doc, pagamenti, chat.","#F97316","monitor"],
};

export default function MastroDesktop() {
  const { T, cantieri=[], msgs=[], fattureDB=[], montaggiDB=[], aziendaInfo, setTab, tab, giorniFermaCM, sogliaDays=7 } = useMastro();
  const [collapsed, setCollapsed] = useState(false);
  const sw = collapsed ? 50 : 220;

  const TODAY = new Date().toISOString().split("T")[0];
  const active = tab||"home";
  const unread = msgs.filter((m:any)=>!m.letto).length;
  const ferme = cantieri.filter(c=>giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura").length;
  const fatScad = fattureDB.filter((f:any)=>!f.pagata&&f.scadenza&&f.scadenza<TODAY).length;
  const montaggiOggi = montaggiDB.filter((m:any)=>m.data===TODAY).length;

  const badge = (k:string) => ({ messaggi:unread, commesse:ferme, contabilita:fatScad, fatture:fatScad, montaggi:montaggiOggi }[k]||0);

  const currentLabel = NAV.flatMap(g=>g.items).find(n=>n.key===active)?.label||"Dashboard";

  const PlaceholderView = ({k}:{k:string}) => {
    const p=PLACEHOLDERS[k];
    if(!p) return <div style={{padding:60,textAlign:"center" as any,color:T.sub}}>Modulo non disponibile</div>;
    return (
      <div style={{display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",height:"70vh",gap:14,padding:40,textAlign:"center" as any}}>
        <div style={{width:72,height:72,borderRadius:20,background:p[2]+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <I d={ICO[p[3] as keyof typeof ICO]} s={32} c={p[2]}/>
        </div>
        <div style={{fontSize:22,fontWeight:500,color:T.text}}>{p[0]}</div>
        <div style={{fontSize:14,color:T.sub,maxWidth:440,lineHeight:1.7}}>{p[1]}</div>
        <div style={{padding:"8px 20px",borderRadius:8,background:p[2]+"10",border:`1px solid ${p[2]}25`,fontSize:12,fontWeight:500,color:p[2]}}>In sviluppo</div>
      </div>
    );
  };

  const content = () => {
    switch(tab) {
      case "home":          return <DesktopDashboard/>;
      case "commesse":      return <DesktopCommesse/>;
      case "configuratore": {
        const cm=cantieri[0]||null;
        return <ConfiguratoreCommessa commessa={cm} onClose={()=>setTab("commesse")}/>;
      }
      case "agenda":        return <AgendaPanel/>;
      case "produzione":    return <DesktopProduzione/>;
      case "montaggi":      return <DesktopMontaggi/>;
      case "clienti":       return <DesktopClienti/>;
      case "agente":        return <DesktopAgente/>;
      case "messaggi":      return <MessaggiPanel/>;
      case "contabilita":   return <DesktopContabilita/>;
      case "team":          return <DesktopTeam/>;
      case "settings":      return <SettingsPanel/>;
      default:              return <PlaceholderView k={tab||""}/>;
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",background:T.bg,fontFamily:FF,overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:sw,flexShrink:0,background:DARK,display:"flex",flexDirection:"column" as any,transition:"width .18s",overflow:"hidden",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
        {/* Logo */}
        <div style={{height:54,display:"flex",alignItems:"center",padding:"0 12px",gap:10,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:8,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>M</div>
          {!collapsed&&<span style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:1.5,whiteSpace:"nowrap" as any}}>MASTRO</span>}
        </div>
        {/* Nav */}
        <nav style={{flex:1,overflowY:"auto" as any,padding:"4px 0"}}>
          {NAV.map(({group,items})=>(
            <div key={group}>
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" as any,color:"rgba(255,255,255,0.2)",padding:"10px 14px 3px"}}>{group}</div>}
              {items.map(({key,ico,label,sub,soon})=>{
                const on=active===key;
                const b=badge(key);
                return (
                  <div key={key} onClick={()=>setTab(key)}
                    style={{display:"flex",alignItems:"center",gap:9,padding:collapsed?"8px 14px":"8px 14px",cursor:"pointer",position:"relative",background:on?"rgba(255,255,255,0.08)":"transparent"}}
                    onMouseEnter={e=>{if(!on)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
                    onMouseLeave={e=>{if(!on)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                    {on&&<div style={{position:"absolute",left:0,top:"15%",bottom:"15%",width:2,borderRadius:"0 2px 2px 0",background:TEAL}}/>}
                    <Ico d={ICO[ico as keyof typeof ICO]} s={15} c={on?"#fff":"rgba(255,255,255,0.38)"}/>
                    {!collapsed&&<>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:on?600:400,color:on?"#fff":"rgba(255,255,255,0.5)",whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                        {sub&&<div style={{fontSize:9,color:"rgba(255,255,255,0.22)"}}>{sub}</div>}
                      </div>
                      {b>0&&<span style={{background:RED,color:"#fff",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 5px",flexShrink:0}}>{b}</span>}
                      {soon&&b===0&&<span style={{background:TEAL+"18",color:TEAL,fontSize:9,fontWeight:600,borderRadius:5,padding:"1px 5px",flexShrink:0}}>Presto</span>}
                    </>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        {/* User */}
        <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          {!collapsed&&<div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:9}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:TEAL+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:TEAL,flexShrink:0}}>{(aziendaInfo?.nome||"M")[0].toUpperCase()}</div>
            <div style={{overflow:"hidden",flex:1}}>
              <div style={{fontSize:11,fontWeight:600,color:"#fff",whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{aziendaInfo?.nome||aziendaInfo?.ragione||"La mia azienda"}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>Piano START</div>
            </div>
          </div>}
          <div onClick={()=>setCollapsed(c=>!c)} style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.25)",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform:collapsed?"rotate(0deg)":"rotate(180deg)",transition:"transform .18s"}}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",minWidth:0}}>
        {/* Topbar */}
        <div style={{height:54,flexShrink:0,background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",padding:"0 20px",gap:12}}>
          <span style={{fontSize:14,fontWeight:500,color:T.text,whiteSpace:"nowrap" as any}}>{currentLabel}</span>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {ferme>0&&<div onClick={()=>setTab("commesse")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:RED+"10",border:`1px solid ${RED}25`,cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:RED}}/><span style={{fontSize:11,fontWeight:500,color:RED}}>{ferme} ferme</span></div>}
            {montaggiOggi>0&&<div onClick={()=>setTab("montaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:PURPLE+"10",border:`1px solid ${PURPLE}25`,cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:PURPLE}}/><span style={{fontSize:11,fontWeight:500,color:PURPLE}}>{montaggiOggi} oggi</span></div>}
            {unread>0&&<div onClick={()=>setTab("messaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:"#3B7FE010",border:"1px solid #3B7FE025",cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#3B7FE0"}}/><span style={{fontSize:11,fontWeight:500,color:"#3B7FE0"}}>{unread} msg</span></div>}
            <div style={{width:30,height:30,borderRadius:"50%",background:TEAL+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:TEAL,cursor:"pointer"}} onClick={()=>setTab("settings")}>{(aziendaInfo?.nome||"M")[0].toUpperCase()}</div>
          </div>
        </div>
        {/* Content */}
        <div style={{flex:1,overflow:"hidden"}}>{content()}</div>
      </div>
    </div>
  );
}
