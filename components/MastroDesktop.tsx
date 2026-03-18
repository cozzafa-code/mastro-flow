"use client";
// @ts-nocheck
// MASTRO — MastroDesktop v10 — DEFINITIVO
// 17 moduli attivi, sidebar collassabile, badge live, routing completo

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, Ico, ICO, I } from "./mastro-constants";
import DesktopDashboard from "./DesktopDashboard";
import DesktopCommesse from "./DesktopCommesse";
import DesktopProduzione from "./DesktopProduzione";
import DesktopMontaggi from "./DesktopMontaggi";
import DesktopClienti from "./DesktopClienti";
import DesktopAgente from "./DesktopAgente";
import DesktopContabilita from "./DesktopContabilita";
import DesktopReport from "./DesktopReport";
import DesktopOrdini from "./DesktopOrdini";
import DesktopENEA from "./DesktopENEA";
import DesktopFatture from "./DesktopFatture";
import DesktopTeam from "./DesktopTeam";
import DesktopLeads from "./DesktopLeads";
import DesktopRete from "./DesktopRete";
import DesktopMisure from "./DesktopMisure";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import SettingsPanel from "./SettingsPanel";
import ConfiguratoreCommessa from "./ConfiguratoreCommessa";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", PURPLE="#8B5CF6";

const NAV = [
  { group:"Cantiere", items:[
    { key:"home",         ico:"home",     label:"Dashboard" },
    { key:"commesse",     ico:"folder",   label:"Commesse" },
    { key:"configuratore",ico:"grid",     label:"Configuratore" },
    { key:"misure",       ico:"ruler",    label:"Misure" },
    { key:"agenda",       ico:"calendar", label:"Agenda" },
  ]},
  { group:"Produzione", items:[
    { key:"produzione",   ico:"cpu",      label:"Produzione",   sub:"Barra → Finestra" },
    { key:"montaggi",     ico:"wrench",   label:"Montaggi" },
    { key:"ordini",       ico:"package",  label:"Ordini fornitori" },
  ]},
  { group:"Gestione", items:[
    { key:"clienti",      ico:"users",    label:"Clienti" },
    { key:"agente",       ico:"zap",      label:"AI Agente" },
    { key:"messaggi",     ico:"inbox",    label:"Messaggi" },
    { key:"contabilita",  ico:"wallet",   label:"Contabilità" },
    { key:"fatture",      ico:"fileText", label:"Fatture SDI" },
    { key:"report",       ico:"barChart", label:"Analytics" },
  ]},
  { group:"Compliance", items:[
    { key:"enea",         ico:"shield",   label:"ENEA / CAM 2026" },
  ]},
  { group:"Crescita", items:[
    { key:"leads",        ico:"zap",      label:"Trova Clienti" },
    { key:"rete",         ico:"share2",   label:"RETE Agenti" },
    { key:"infissiora",   ico:"globe",    label:"InfissiOra",    soon:true },
    { key:"cliente_b2c",  ico:"monitor",  label:"Portale B2C",   soon:true },
  ]},
  { group:"Sistema", items:[
    { key:"team",         ico:"users",    label:"Team" },
    { key:"settings",     ico:"settings", label:"Impostazioni" },
  ]},
];

const SOON_INFO:Record<string,[string,string,string]> = {
  infissiora:  ["InfissiOra","Marketplace inverso B2C. Brand pubblico InfissiOra.it.","#3B7FE0"],
  cliente_b2c: ["Portale Cliente B2C","Il cliente vede stato lavoro, doc, pagamenti, chat.","#F97316"],
};

export default function MastroDesktop() {
  const { T, cantieri=[], msgs=[], fattureDB=[], montaggiDB=[], aziendaInfo, setTab, tab, giorniFermaCM, sogliaDays=7 } = useMastro();
  const [collapsed, setCollapsed] = useState(false);
  const sw = collapsed ? 50 : 220;
  const active = tab||"home";
  const TODAY = new Date().toISOString().split("T")[0];

  const ferme   = cantieri.filter(c=>giorniFermaCM(c)>=sogliaDays&&c.fase!=="chiusura").length;
  const unread  = msgs.filter((m:any)=>!m.letto).length;
  const fatScad = fattureDB.filter((f:any)=>!f.pagata&&f.scadenza&&f.scadenza<TODAY).length;
  const montOggi= montaggiDB.filter((m:any)=>m.data===TODAY).length;

  const badge=(k:string)=>({messaggi:unread,commesse:ferme,contabilita:fatScad,fatture:fatScad,montaggi:montOggi}[k]||0);
  const label= NAV.flatMap(g=>g.items).find(n=>n.key===active)?.label||"Dashboard";

  const SoonView=({k}:{k:string})=>{
    const p=SOON_INFO[k];
    if(!p) return <div style={{padding:60,textAlign:"center" as any,color:T.sub}}>In sviluppo</div>;
    return (
      <div style={{display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",height:"70vh",gap:14,padding:40,textAlign:"center" as any}}>
        <div style={{width:72,height:72,borderRadius:20,background:p[2]+"15",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p[2]} strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div style={{fontSize:22,fontWeight:500,color:T.text}}>{p[0]}</div>
        <div style={{fontSize:14,color:T.sub,maxWidth:440,lineHeight:1.7}}>{p[1]}</div>
        <div style={{padding:"8px 20px",borderRadius:8,background:p[2]+"10",border:`1px solid ${p[2]}25`,fontSize:12,fontWeight:500,color:p[2]}}>In sviluppo — Lancio 2026</div>
      </div>
    );
  };

  const content=()=>{
    switch(active){
      case "home":          return <DesktopDashboard/>;
      case "commesse":      return <DesktopCommesse/>;
      case "configuratore": return <ConfiguratoreCommessa commessa={cantieri[0]||null} onClose={()=>setTab("commesse")}/>;
      case "misure":        return <DesktopMisure/>;
      case "agenda":        return <AgendaPanel/>;
      case "produzione":    return <DesktopProduzione/>;
      case "montaggi":      return <DesktopMontaggi/>;
      case "ordini":        return <DesktopOrdini/>;
      case "clienti":       return <DesktopClienti/>;
      case "agente":        return <DesktopAgente/>;
      case "messaggi":      return <MessaggiPanel/>;
      case "contabilita":   return <DesktopContabilita/>;
      case "fatture":       return <DesktopFatture/>;
      case "report":        return <DesktopReport/>;
      case "enea":          return <DesktopENEA/>;
      case "leads":         return <DesktopLeads/>;
      case "rete":          return <DesktopRete/>;
      case "team":          return <DesktopTeam/>;
      case "settings":      return <SettingsPanel/>;
      default:              return <SoonView k={active}/>;
    }
  };

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",background:T.bg,fontFamily:FF,overflow:"hidden"}}>
      {/* SIDEBAR */}
      <div style={{width:sw,flexShrink:0,background:DARK,display:"flex",flexDirection:"column" as any,transition:"width .18s ease",overflow:"hidden",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{height:52,display:"flex",alignItems:"center",padding:"0 12px",gap:10,borderBottom:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>M</div>
          {!collapsed&&<span style={{fontSize:11,fontWeight:800,color:"#fff",letterSpacing:2,whiteSpace:"nowrap" as any}}>MASTRO</span>}
        </div>
        <nav style={{flex:1,overflowY:"auto" as any,padding:"4px 0",scrollbarWidth:"none" as any}}>
          {NAV.map(({group,items})=>(
            <div key={group}>
              {!collapsed&&<div style={{fontSize:8,fontWeight:800,letterSpacing:2,textTransform:"uppercase" as any,color:"rgba(255,255,255,0.16)",padding:"10px 14px 2px"}}>{group}</div>}
              {items.map(({key,ico,label:lbl,sub,soon})=>{
                const on=active===key; const b=badge(key);
                return (
                  <div key={key} onClick={()=>setTab(key)}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",cursor:"pointer",position:"relative",background:on?"rgba(255,255,255,0.09)":"transparent",transition:"background .1s"}}
                    onMouseEnter={e=>{if(!on)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.04)";}}
                    onMouseLeave={e=>{if(!on)(e.currentTarget as HTMLElement).style.background="transparent";}}>
                    {on&&<div style={{position:"absolute",left:0,top:"10%",bottom:"10%",width:2,borderRadius:"0 2px 2px 0",background:TEAL}}/>}
                    <Ico d={ICO[ico as keyof typeof ICO]} s={14} c={on?"#fff":"rgba(255,255,255,0.32)"}/>
                    {!collapsed&&<>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:on?500:400,color:on?"#fff":"rgba(255,255,255,0.45)",whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{lbl}</div>
                        {sub&&<div style={{fontSize:8,color:"rgba(255,255,255,0.18)"}}>{sub}</div>}
                      </div>
                      {b>0&&<div style={{minWidth:16,height:16,borderRadius:8,background:RED,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:9,fontWeight:700,color:"#fff",lineHeight:1}}>{b}</span>
                      </div>}
                      {soon&&b===0&&<span style={{background:TEAL+"14",color:TEAL,fontSize:8,fontWeight:700,borderRadius:4,padding:"1px 5px",flexShrink:0,letterSpacing:0.5}}>PRESTO</span>}
                    </>}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
        <div style={{borderTop:"1px solid rgba(255,255,255,0.07)",flexShrink:0}}>
          {!collapsed&&<div style={{padding:"9px 12px",display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:TEAL+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:TEAL,flexShrink:0}}>{(aziendaInfo?.nome||aziendaInfo?.ragione||"M")[0].toUpperCase()}</div>
            <div style={{overflow:"hidden",flex:1}}>
              <div style={{fontSize:11,fontWeight:500,color:"rgba(255,255,255,0.8)",whiteSpace:"nowrap" as any,overflow:"hidden",textOverflow:"ellipsis"}}>{aziendaInfo?.nome||aziendaInfo?.ragione||"Azienda"}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.25)"}}>Piano START · {cantieri.length} commesse</div>
            </div>
          </div>}
          <div onClick={()=>setCollapsed(c=>!c)} style={{height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"rgba(255,255,255,0.2)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{transform:collapsed?"rotate(0deg)":"rotate(180deg)",transition:"transform .18s"}}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",minWidth:0}}>
        <div style={{height:50,flexShrink:0,background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,display:"flex",alignItems:"center",padding:"0 18px",gap:10}}>
          <span style={{fontSize:14,fontWeight:500,color:T.text,whiteSpace:"nowrap" as any}}>{label}</span>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7}}>
            {ferme>0&&<div onClick={()=>setTab("commesse")} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:6,background:RED+"0E",border:`1px solid ${RED}20`,cursor:"pointer"}}><div style={{width:4,height:4,borderRadius:"50%",background:RED}}/><span style={{fontSize:11,fontWeight:500,color:RED}}>{ferme} ferme</span></div>}
            {montOggi>0&&<div onClick={()=>setTab("montaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:6,background:PURPLE+"0E",border:`1px solid ${PURPLE}20`,cursor:"pointer"}}><div style={{width:4,height:4,borderRadius:"50%",background:PURPLE}}/><span style={{fontSize:11,fontWeight:500,color:PURPLE}}>{montOggi} oggi</span></div>}
            {fatScad>0&&<div onClick={()=>setTab("fatture")} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:6,background:"#F9731610",border:"1px solid #F9731620",cursor:"pointer"}}><div style={{width:4,height:4,borderRadius:"50%",background:"#F97316"}}/><span style={{fontSize:11,fontWeight:500,color:"#F97316"}}>{fatScad} scad.</span></div>}
            {unread>0&&<div onClick={()=>setTab("messaggi")} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 9px",borderRadius:6,background:"#3B7FE010",border:"1px solid #3B7FE020",cursor:"pointer"}}><div style={{width:4,height:4,borderRadius:"50%",background:"#3B7FE0"}}/><span style={{fontSize:11,fontWeight:500,color:"#3B7FE0"}}>{unread}</span></div>}
            <div style={{width:28,height:28,borderRadius:"50%",background:TEAL+"16",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:TEAL,cursor:"pointer",marginLeft:4}} onClick={()=>setTab("settings")}>{(aziendaInfo?.nome||aziendaInfo?.ragione||"M")[0].toUpperCase()}</div>
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden"}}>{content()}</div>
      </div>
    </div>
  );
}
