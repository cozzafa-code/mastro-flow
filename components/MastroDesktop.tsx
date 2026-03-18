"use client";
// @ts-nocheck
// MASTRO — MastroDesktop v6 — Control Room Completa
// ERP + MISURE + RETE + PRODUZIONE + MONTAGGI — Un'unica piattaforma, viste per ruolo

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, Ico, ICO, I } from "./mastro-constants";
import DesktopDashboard from "./DesktopDashboard";
import DesktopCommesse from "./DesktopCommesse";
import DesktopContabilita from "./DesktopContabilita";
import DesktopMontaggiV2 from "./DesktopMontaggiV2";
import DesktopProduzione from "./DesktopProduzione";
import DesktopTeam from "./DesktopTeam";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import ClientiPanel from "./ClientiPanel";
import SettingsPanel from "./SettingsPanel";
import ConfiguratoreCommessa from "./ConfiguratoreCommessa";

const TEAL="#1A9E73", DARK="#1A1A1C", ORANGE="#F97316", PURPLE="#8B5CF6";

const NAV_GROUPS = [
  { label:"Cantiere", items:[
    { key:"home",         ico:"home",      label:"Dashboard" },
    { key:"commesse",     ico:"folder",    label:"Commesse" },
    { key:"configuratore",ico:"settings",  label:"Configuratore" },
    { key:"agenda",       ico:"calendar",  label:"Agenda" },
  ]},
  { label:"Produzione", items:[
    { key:"produzione",   ico:"cpu",       label:"Produzione",    sub:"Barra → Finestra" },
    { key:"montaggi",     ico:"wrench",    label:"Montaggi" },
    { key:"ordini",       ico:"package",   label:"Ordini fornitori" },
  ]},
  { label:"Gestione", items:[
    { key:"clienti",      ico:"users",     label:"Clienti" },
    { key:"messaggi",     ico:"inbox",     label:"Messaggi" },
    { key:"contabilita",  ico:"wallet",    label:"Contabilità" },
    { key:"fatture",      ico:"fileText",  label:"Fatture SDI",   soon:true },
  ]},
  { label:"Crescita", items:[
    { key:"enea",         ico:"shield",    label:"ENEA / CAM 2026", soon:true },
    { key:"leads",        ico:"zap",       label:"Trova Clienti",  soon:true },
    { key:"infissiora",   ico:"globe",     label:"InfissiOra",     soon:true },
    { key:"rete",         ico:"share2",    label:"RETE Agenti",    soon:true },
    { key:"cliente_b2c",  ico:"monitor",   label:"Portale Cliente",soon:true },
  ]},
  { label:"Sistema", items:[
    { key:"team",         ico:"shield",    label:"Team" },
    { key:"settings",     ico:"settings",  label:"Impostazioni" },
  ]},
];

const PLACEHOLDERS: Record<string,{title:string,desc:string,color:string,tag:string}> = {
  ordini:      {title:"Trasformatore Ordini",  color:TEAL,    tag:"Universale · Zero ridigitazione",    desc:"Converte ogni ordine nel formato del produttore. Emmegi, Schüco, Reynaers. Un click → file pronto."},
  fatture:     {title:"Fatture SDI",           color:ORANGE,  tag:"FatturaPA · SDI",                    desc:"XML FatturaPA già generato. Integrazione fattura-elettronica-api.it. Piani M50/M500/M5000."},
  enea:        {title:"ENEA / CAM 2026",       color:TEAL,    tag:"Ecobonus · Uw · Marcatura CE",       desc:"CAM 2026 obbligatorio dal 1 Feb 2026. Uw per zona A–F, etichetta CE, dichiarazione prestazione. Opera/FPPRO non ce l'hanno."},
  leads:       {title:"TROVA CLIENTI",         color:TEAL,    tag:"Differenziatore unico",              desc:"Scraping Habitissimo, Instapro, Subito.it per zona. Lead B2C con crediti. Nessun competitor porta lavoro nuovo."},
  infissiora:  {title:"InfissiOra",            color:"#3B7FE0",tag:"Marketplace inverso B2C",           desc:"Privati cercano preventivi, tu rispondi. Lead caldi. Brand pubblico InfissiOra.it."},
  rete:        {title:"MASTRO RETE",           color:PURPLE,  tag:"Agenti commerciali",                desc:"App dedicata agenti. Ognuno vede i suoi preventivi, clienti, provvigioni. Deploy separato."},
  cliente_b2c: {title:"Portale Cliente",       color:ORANGE,  tag:"B2C · Sostituisce Promotech €10K",  desc:"Il cliente vede lo stato del suo lavoro, documenti, pagamenti, chat. Incluso nell'abbonamento."},
};

export default function MastroDesktop() {
  const ctx = useMastro();
  const { T, cantieri=[], msgs=[], fattureDB=[], montaggiDB=[], aziendaInfo, setTab, tab, giorniFermaCM, sogliaDays=7 } = ctx;
  const [collapsed, setCollapsed] = useState(false);
  const [cfgCommessa, setCfgCommessa] = useState<any>(null);

  const sw = collapsed ? 50 : 220;
  const activeNav = tab||"home";
  const unread = msgs.filter((m:any)=>!m.letto).length;
  const TODAY = new Date().toISOString().split("T")[0];
  const ferme = cantieri.filter(c=>giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura").length;
  const fatScad = fattureDB.filter((f:any)=>!f.pagata&&f.scadenza<TODAY).length;
  const montaggiOggi = montaggiDB.filter((m:any)=>m.data===TODAY).length;

  const getBadge = (key:string) => {
    if(key==="messaggi") return unread;
    if(key==="commesse") return ferme;
    if(key==="contabilita"||key==="fatture") return fatScad;
    if(key==="montaggi") return montaggiOggi;
    return 0;
  };

  const currentItem = NAV_GROUPS.flatMap(g=>g.items).find(n=>n.key===activeNav);

  const Placeholder = ({k}:{k:string}) => {
    const p = PLACEHOLDERS[k];
    if(!p) return <div style={{padding:40,textAlign:"center" as any,color:T.sub,fontSize:13}}>Modulo non disponibile</div>;
    return (
      <div style={{display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",height:"70vh",gap:14,padding:40,textAlign:"center" as any}}>
        <div style={{width:72,height:72,borderRadius:20,background:p.color+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
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
    if(cfgCommessa) return <ConfiguratoreCommessa commessa={cfgCommessa} onClose={()=>setCfgCommessa(null)}/>;
    switch(tab) {
      case "home":          return <DesktopDashboard/>;
      case "commesse":      return <DesktopCommesse/>;
      case "configuratore": return <ConfiguratoreCommessa commessa={cantieri[0]||null} onClose={()=>setTab("commesse")}/>;
      case "agenda":        return <AgendaPanel/>;
      case "produzione":    return <DesktopProduzione/>;
      case "montaggi":      return <DesktopMontaggiV2/>;
      case "clienti":       return <ClientiPanel/>;
      case "messaggi":      return <MessaggiPanel/>;
      case "contabilita":   return <DesktopContabilita/>;
      case "team":          return <DesktopTeam/>;
      case "settings":      return <SettingsPanel/>;
      default:              return <Placeholder k={tab||""}/>;
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",background:T.bg,fontFamily:FF,color:T.text,overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:sw,flexShrink:0,background:DARK,display:"flex",flexDirection:"column" as any,transition:"width 0.18s ease",overflow:"hidden",zIndex:10,borderRight:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{height:54,display:"flex",alignItems:"center",padding:"0 12px",gap:10,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          <div style={{width:30,height:30,borderRadius:8,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0,letterSpacing:-1}}>M</div>
          {!collapsed&&<span style={{fontSize:12,fontWeight:800,color:"#fff",letterSpacing:1.5,whiteSpace:"nowrap" as any}}>MASTRO</span>}
        </div>
        <nav style={{flex:1,overflowY:"auto" as any,padding:"4px 0"}}>
          {NAV_GROUPS.map(group=>(
            <div key={group.label}>
              {!collapsed&&<div style={{fontSize:9,fontWeight:700,letterSpacing:1.5,textTransform:"uppercase" as any,color:"rgba(255,255,255,0.2)",padding:"10px 14px 3px"}}>{group.label}</div>}
              {group.items.map(({key,ico,label,sub,soon})=>{
                const active=activeNav===key;
                const badge=getBadge(key);
                return (
                  <div key={key} onClick={()=>setTab(key)}
                    style={{display:"flex",alignItems:"center",gap:9,padding:collapsed?"8px 0 8px 14px":"8px 12px 8px 14px",cursor:"pointer",position:"relative",background:active?"rgba(255,255,255,0.08)":"transparent"}}
                    onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
                    onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                    {active&&<div style={{position:"absolute",left:0,top:"15%",bottom:"15%",width:2,borderRadius:"0 2px 2px 0",background:TEAL}}/>}
                    <Ico d={ICO[ico as keyof typeof ICO]} s={15} c={active?"#fff":"rgba(255,255,255,0.38)"}/>
                    {!collapsed&&(
                      <>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:active?600:400,color:active?"#fff":"rgba(255,255,255,0.5)",whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{label}</div>
                          {sub&&<div style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>{sub}</div>}
                        </div>
                        {badge>0&&<span style={{background:"#DC4444",color:"#fff",fontSize:9,fontWeight:700,borderRadius:10,padding:"1px 5px",minWidth:16,textAlign:"center" as any,flexShrink:0}}>{badge}</span>}
                        {soon&&badge===0&&<span style={{background:TEAL+"18",color:TEAL,fontSize:9,fontWeight:600,borderRadius:5,padding:"1px 5px",flexShrink:0}}>Presto</span>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          {!collapsed&&(
            <div style={{padding:"10px 14px",display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:TEAL+"25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:TEAL,flexShrink:0}}>
                {(aziendaInfo?.nome||aziendaInfo?.ragione||"M")[0].toUpperCase()}
              </div>
              <div style={{overflow:"hidden",flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:"#fff",whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{aziendaInfo?.nome||aziendaInfo?.ragione||"La mia azienda"}</div>
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
      <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",minWidth:0}}>
        <div style={{height:54,flexShrink:0,background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",padding:"0 20px",gap:14}}>
          <span style={{fontSize:14,fontWeight:500,color:T.text,whiteSpace:"nowrap" as any}}>{currentItem?.label||"Dashboard"}</span>
          {currentItem?.sub&&<span style={{fontSize:10,color:T.sub,background:T.bg,padding:"2px 7px",borderRadius:5,border:`0.5px solid ${T.bdr}`}}>{currentItem.sub}</span>}
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            {ferme>0&&<div onClick={()=>setTab("commesse")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:"#DC444412",border:"1px solid #DC444428",cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#DC4444"}}/><span style={{fontSize:11,fontWeight:500,color:"#DC4444"}}>{ferme} ferme</span></div>}
            {montaggiOggi>0&&<div onClick={()=>setTab("montaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:PURPLE+"12",border:`1px solid ${PURPLE}28`,cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:PURPLE}}/><span style={{fontSize:11,fontWeight:500,color:PURPLE}}>{montaggiOggi} montaggi oggi</span></div>}
            {unread>0&&<div onClick={()=>setTab("messaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:7,background:"#3B7FE012",border:"1px solid #3B7FE028",cursor:"pointer"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#3B7FE0"}}/><span style={{fontSize:11,fontWeight:500,color:"#3B7FE0"}}>{unread} msg</span></div>}
            <div style={{width:30,height:30,borderRadius:"50%",background:TEAL+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:TEAL,cursor:"pointer"}} onClick={()=>setTab("settings")}>{(aziendaInfo?.nome||"M")[0].toUpperCase()}</div>
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden"}}>{renderContent()}</div>
      </div>
    </div>
  );
}
