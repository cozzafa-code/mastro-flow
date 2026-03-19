"use client";
// @ts-nocheck
// MASTRO — DesktopSettings v1
// Impostazioni desktop: layout a 2 colonne, sezioni logiche, design system corretto

import { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, I, Ico } from "./mastro-constants";

const TEAL="#1A9E73",DARK="#1A1A1C",RED="#DC4444",AMB="#D08008",BLU="#3B7FE0",PUR="#8B5CF6";

// Sezioni nav sinistra
const NAV_SECTIONS = [
  { group:"Azienda", items:[
    { id:"generali",  label:"Generali",     icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
    { id:"azienda",   label:"Dati azienda", icon:"M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
    { id:"team",      label:"Team",         icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" },
    { id:"squadre",   label:"Squadre",      icon:"M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
    { id:"piano",     label:"Piano",        icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  ]},
  { group:"Archivi prodotto", items:[
    { id:"sistemi",   label:"Sistemi profilo", icon:"M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id:"colori",    label:"Colori",          icon:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" },
    { id:"vetri",     label:"Vetri",           icon:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" },
    { id:"accessori", label:"Accessori",       icon:"M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
    { id:"coprifili", label:"Coprifili",       icon:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
    { id:"lamiere",   label:"Lamiere",         icon:"M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
  ]},
  { group:"Complementari", items:[
    { id:"tapparella",   label:"Tapparelle",   icon:"M4 6h16M4 12h16M4 18h7" },
    { id:"persiana",     label:"Persiane",     icon:"M4 6h16M4 12h16M4 18h16" },
    { id:"zanzariera",   label:"Zanzariere",   icon:"M4 6h16M4 10h16M4 14h16M4 18h16" },
    { id:"controtelaio", label:"Controtelaio", icon:"M4 4h16v16H4z M8 4v16 M16 4v16 M4 8h16 M4 16h16" },
    { id:"cassonetto",   label:"Cassonetti",   icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  ]},
  { group:"Workflow", items:[
    { id:"pipeline",   label:"Pipeline",    icon:"M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" },
    { id:"manodopera", label:"Manodopera",  icon:"M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
    { id:"fatture",    label:"Fatture SDI", icon:"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ]},
  { group:"Sistema", items:[
    { id:"settore",  label:"Settore",     icon:"M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id:"importa",  label:"Importa",     icon:"M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
    { id:"temi",     label:"Tema",        icon:"M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343" },
    { id:"reset",    label:"Reset dati",  icon:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  ]},
];

const Svg=({path,s=16,c="currentColor"}:any)=>(
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {path.split(' M').map((p:string,i:number)=><path key={i} d={i===0?p:'M'+p}/>)}
  </svg>
);

// ── Riga archivio generica ────────────────────────────────────
function ArchivioRow({item,onEdit,onDelete,children}:any){
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:`1px solid #F2F1EC`,background:"#fff"}}
      onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
      onMouseLeave={e=>((e.currentTarget as any).style.background="#fff")}>
      {children}
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        {onEdit&&<div onClick={onEdit} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:BLU+"12",color:BLU}}>Modifica</div>}
        {onDelete&&<div onClick={onDelete} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>}
      </div>
    </div>
  );
}

// ── Sezione con titolo ────────────────────────────────────────
function Sezione({title,sub="",action=null,children}:any){
  return (
    <div style={{marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:DARK}}>{title}</div>
          {sub&&<div style={{fontSize:12,color:"#86868b",marginTop:2}}>{sub}</div>}
        </div>
        {action&&<div onClick={action.fn} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
          <Svg path="M12 4v16m8-8H4" c="#fff" s={13}/>
          {action.label}
        </div>}
      </div>
      <div style={{background:"#fff",borderRadius:12,border:`1px solid #E5E3DC`,overflow:"hidden"}}>
        {children}
      </div>
    </div>
  );
}

export default function DesktopSettings(){
  const {T,settingsTab,setSettingsTab,
    aziendaInfo,setAziendaInfo,
    sistemiDB,setSistemiDB,
    coloriDB,setColoriDB,
    vetriDB,setVetriDB,
    coprifiliDB,setCoprifiliDB,
    lamiereDB,setLamiereDB,
    team,setTeam,
    squadreDB,setSquadreDB,
    pipelineDB,setPipelineDB,
    cantieri,tasks,
    setTheme,theme,
    tab,setTab,
  }=useMastro();

  const [search,setSearch]=useState("");

  const active=settingsTab||"generali";

  const S={
    input:{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid #E5E3DC`,fontSize:13,fontFamily:FF,background:"#F8F7F2",color:DARK,outline:"none",boxSizing:"border-box" as const},
    label:{fontSize:11,fontWeight:700,color:"#86868b",textTransform:"uppercase" as const,letterSpacing:.7,marginBottom:4,display:"block"},
    badge:(bg:string,c:string)=>({fontSize:10,padding:"2px 8px",borderRadius:10,background:bg,color:c,fontWeight:700}),
  };

  const renderContent=()=>{
    switch(active){

      // ── GENERALI ──────────────────────────────────────────
      case "generali": return (
        <div>
          <Sezione title="Informazioni azienda" sub="Nome, ragione sociale, indirizzo">
            <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {l:"Nome azienda",k:"nome",ph:"Es. Walter Cozza Serramenti"},
                  {l:"Ragione sociale",k:"ragione",ph:"Es. Walter Cozza Serramenti SRL"},
                  {l:"Partita IVA",k:"piva",ph:"IT12345678901"},
                  {l:"Codice fiscale",k:"cf",ph:""},
                  {l:"Telefono",k:"telefono",ph:"+39 0984 000000"},
                  {l:"Email",k:"email",ph:"info@azienda.it"},
                  {l:"PEC",k:"pec",ph:"azienda@pec.it"},
                  {l:"Sito web",k:"web",ph:"www.azienda.it"},
                ].map(f=>(
                  <div key={f.k}>
                    <label style={S.label}>{f.l}</label>
                    <input style={S.input} placeholder={f.ph} value={aziendaInfo?.[f.k]||""} onChange={e=>setAziendaInfo?.((p:any)=>({...p,[f.k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <div>
                <label style={S.label}>Indirizzo</label>
                <input style={S.input} placeholder="Via, numero, CAP, Città" value={aziendaInfo?.indirizzo||""} onChange={e=>setAziendaInfo?.((p:any)=>({...p,indirizzo:e.target.value}))}/>
              </div>
            </div>
          </Sezione>
          <Sezione title="Impostazioni operative" sub="Soglia ferma, IVA default">
            <div style={{padding:"16px 18px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              {[
                {l:"Soglia commesse ferme (giorni)",k:"sogliaDays",type:"number",ph:"7"},
                {l:"IVA default %",k:"ivaDefault",type:"number",ph:"10"},
                {l:"Sconto max %",k:"scontoMax",type:"number",ph:"20"},
                {l:"Margine target %",k:"margineTarget",type:"number",ph:"35"},
              ].map(f=>(
                <div key={f.k}>
                  <label style={S.label}>{f.l}</label>
                  <input type={f.type} style={S.input} placeholder={f.ph} value={aziendaInfo?.[f.k]||""} onChange={e=>setAziendaInfo?.((p:any)=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
            </div>
          </Sezione>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:8}}>
            {[{l:"Commesse",v:cantieri?.length||0,c:TEAL},{l:"Vani totali",v:(cantieri||[]).reduce((s:number,c:any)=>s+(c.vani||[]).length,0),c:BLU},{l:"Task aperte",v:(tasks||[]).filter((t:any)=>!t.done).length,c:AMB}].map((k,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:10,padding:"14px 16px",border:`1px solid #E5E3DC`}}>
                <div style={{fontSize:11,color:"#86868b",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{k.l}</div>
                <div style={{fontSize:28,fontWeight:800,color:k.c,fontFamily:FM,marginTop:4}}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      );

      // ── SISTEMI ───────────────────────────────────────────
      case "sistemi": return (
        <div>
          <Sezione title="Sistemi profilo" sub="Marche, sistemi, prezzi, griglie listino"
            action={{label:"Aggiungi sistema",fn:()=>{}}}>
            {(sistemiDB||[]).map((s:any)=>(
              <div key={s.id} style={{borderBottom:`1px solid #F2F1EC`}}>
                <div style={{padding:"14px 18px",display:"flex",alignItems:"flex-start",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:10,background:TEAL+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16,fontWeight:800,color:TEAL}}>
                    {(s.marca||"S")[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:800,color:DARK}}>{s.marca} <span style={{color:"#86868b",fontWeight:500}}>{s.sistema}</span></div>
                    <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                      <span style={S.badge(TEAL+"12",TEAL)}>€/mq {s.euroMq||s.prezzoMq||"—"}</span>
                      {s.sovRAL>0&&<span style={S.badge(AMB+"12",AMB)}>+{s.sovRAL}% RAL</span>}
                      {s.sovLegno>0&&<span style={S.badge(PUR+"12",PUR)}>+{s.sovLegno}% Legno</span>}
                      {s.griglia?.length>0&&<span style={S.badge(BLU+"12",BLU)}>{s.griglia.length} prezzi griglia</span>}
                    </div>
                    {s.colori?.length>0&&(
                      <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}}>
                        {s.colori.slice(0,8).map((c:string)=>{
                          const col=(coloriDB||[]).find((x:any)=>x.code===c);
                          return <span key={c} style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:col?.hex?"#"+col.hex.replace("#","")+"20":"#F2F1EC",border:`1px solid ${col?.hex||"#E5E3DC"}40`,color:DARK,display:"flex",alignItems:"center",gap:3}}>
                            {col?.hex&&<div style={{width:8,height:8,borderRadius:"50%",background:col.hex,flexShrink:0}}/>}{c}
                          </span>;
                        })}
                        {s.colori.length>8&&<span style={{fontSize:10,color:"#86868b"}}>+{s.colori.length-8}</span>}
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <div style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:BLU+"12",color:BLU}}>Modifica</div>
                    <div onClick={()=>setSistemiDB?.((p:any[])=>p.filter((x:any)=>x.id!==s.id))} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>
                  </div>
                </div>
              </div>
            ))}
            {(!sistemiDB||sistemiDB.length===0)&&(
              <div style={{padding:"32px",textAlign:"center",color:"#86868b",fontSize:14}}>
                Nessun sistema configurato — aggiungine uno
              </div>
            )}
          </Sezione>
        </div>
      );

      // ── COLORI ───────────────────────────────────────────
      case "colori": return (
        <div>
          <Sezione title="Colori disponibili" sub="Codici RAL, colori standard e speciali"
            action={{label:"Aggiungi colore",fn:()=>{}}}>
            <div style={{padding:"12px 16px",borderBottom:`1px solid #F2F1EC`,display:"flex",gap:8}}>
              <input style={{...S.input,maxWidth:280}} placeholder="Cerca colore..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:1,padding:1}}>
              {(coloriDB||[]).filter((c:any)=>!search||c.code?.toLowerCase().includes(search.toLowerCase())||c.nome?.toLowerCase().includes(search.toLowerCase())).map((c:any)=>(
                <div key={c.id||c.code} style={{padding:"12px 14px",background:"#fff",display:"flex",alignItems:"center",gap:10,cursor:"pointer",border:"1px solid #F2F1EC"}}
                  onMouseEnter={e=>((e.currentTarget as any).style.background="#F8F7F2")}
                  onMouseLeave={e=>((e.currentTarget as any).style.background="#fff")}>
                  <div style={{width:32,height:32,borderRadius:8,background:c.hex||"#ccc",flexShrink:0,border:`1px solid rgba(0,0,0,0.08)`}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:DARK,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.code||c.nome}</div>
                    <div style={{fontSize:10,color:"#86868b"}}>{c.hex||""}</div>
                  </div>
                  <div onClick={()=>setColoriDB?.((p:any[])=>p.filter((x:any)=>x.id!==c.id&&x.code!==c.code))} style={{color:RED,cursor:"pointer",opacity:.5}} onMouseEnter={e=>((e.currentTarget as any).style.opacity="1")} onMouseLeave={e=>((e.currentTarget as any).style.opacity=".5")}>
                    <Svg path="M6 18L18 6M6 6l12 12" c={RED} s={14}/>
                  </div>
                </div>
              ))}
            </div>
            {(!coloriDB||coloriDB.length===0)&&<div style={{padding:"32px",textAlign:"center",color:"#86868b",fontSize:14}}>Nessun colore configurato</div>}
          </Sezione>
        </div>
      );

      // ── VETRI ────────────────────────────────────────────
      case "vetri": return (
        <div>
          <Sezione title="Vetri e vetrocamere" sub="Codici vetro, composizioni, prezzi €/mq"
            action={{label:"Aggiungi vetro",fn:()=>{}}}>
            {(vetriDB||[]).map((v:any)=>(
              <div key={v.id||v.code} style={{padding:"12px 18px",borderBottom:`1px solid #F2F1EC`,display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:40,height:40,borderRadius:8,background:BLU+"12",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <Svg path="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" c={BLU} s={18}/>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:DARK}}>{v.code||v.nome}</div>
                  <div style={{fontSize:11,color:"#86868b",marginTop:2}}>{v.composizione||v.descrizione||""}</div>
                </div>
                {v.euroMq&&<span style={S.badge(TEAL+"12",TEAL)}>€{v.euroMq}/mq</span>}
                {v.uw&&<span style={S.badge(BLU+"12",BLU)}>Uw {v.uw}</span>}
                <div style={{display:"flex",gap:6}}>
                  <div style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:BLU+"12",color:BLU}}>Modifica</div>
                  <div onClick={()=>setVetriDB?.((p:any[])=>p.filter((x:any)=>x.id!==v.id&&x.code!==v.code))} style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Elimina</div>
                </div>
              </div>
            ))}
            {(!vetriDB||vetriDB.length===0)&&<div style={{padding:"32px",textAlign:"center",color:"#86868b",fontSize:14}}>Nessun vetro configurato</div>}
          </Sezione>
        </div>
      );

      // ── TEAM ─────────────────────────────────────────────
      case "team": return (
        <div>
          <Sezione title="Team" sub="Operatori, ruoli, PIN di accesso"
            action={{label:"Aggiungi operatore",fn:()=>{}}}>
            {(team||[]).map((m:any,i:number)=>{
              const col=m.colore||TEAL;
              return (
                <div key={m.id||i} style={{padding:"14px 18px",borderBottom:`1px solid #F2F1EC`,display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:42,height:42,borderRadius:12,background:col+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:col,flexShrink:0,border:`1.5px solid ${col}30`}}>{(m.nome||"?")[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:DARK}}>{m.nome}</div>
                    <div style={{display:"flex",gap:8,marginTop:4}}>
                      <span style={S.badge(col+"12",col)}>{m.ruolo||"—"}</span>
                      {m.pin&&<span style={S.badge("#F2F1EC","#86868b")}>PIN ****</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:BLU+"12",color:BLU}}>Modifica</div>
                    <div style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:RED+"12",color:RED}}>Rimuovi</div>
                  </div>
                </div>
              );
            })}
            {(!team||team.length===0)&&<div style={{padding:"32px",textAlign:"center",color:"#86868b",fontSize:14}}>Nessun operatore configurato</div>}
          </Sezione>
        </div>
      );

      // ── PIPELINE ─────────────────────────────────────────
      case "pipeline": return (
        <div>
          <Sezione title="Pipeline fasi" sub="Ordine fasi, gate bloccanti, notifiche automatiche">
            {(pipelineDB||[]).map((p:any,i:number)=>{
              const col=p.color||TEAL;
              const hasGate=(p.gateRequisiti||[]).length>0;
              const hasAuto=(p.automazioni||[]).length>0;
              return (
                <div key={p.id} style={{padding:"14px 18px",borderBottom:`1px solid #F2F1EC`,display:"flex",alignItems:"flex-start",gap:12}}>
                  <div style={{display:"flex",flexDirection:"column",gap:3,paddingTop:4}}>
                    <div onClick={()=>{if(i===0)return;const a=[...pipelineDB];[a[i-1],a[i]]=[a[i],a[i-1]];setPipelineDB?.(a);}} style={{cursor:i===0?"default":"pointer",opacity:i===0?.2:1,color:"#86868b",fontSize:10,lineHeight:1}}>▲</div>
                    <div onClick={()=>{if(i===pipelineDB.length-1)return;const a=[...pipelineDB];[a[i],a[i+1]]=[a[i+1],a[i]];setPipelineDB?.(a);}} style={{cursor:i===pipelineDB.length-1?"default":"pointer",opacity:i===pipelineDB.length-1?.2:1,color:"#86868b",fontSize:10,lineHeight:1}}>▼</div>
                  </div>
                  <div style={{width:10,height:10,borderRadius:"50%",background:col,flexShrink:0,marginTop:6}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:DARK}}>{p.nome||p.id}</div>
                    <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                      {hasGate&&<span style={S.badge(RED+"12",RED)}>⛔ {p.gateRequisiti.length} gate</span>}
                      {p.gateBloccante&&<span style={S.badge(RED+"20",RED)}>Bloccante</span>}
                      {hasAuto&&<span style={S.badge(PUR+"12",PUR)}>⚡ {p.automazioni.length} auto</span>}
                      {p.emailTemplate&&<span style={S.badge(BLU+"12",BLU)}>Email</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div onClick={()=>setPipelineDB?.((db:any[])=>db.map((x:any,j:number)=>j===i?{...x,attiva:!x.attiva}:x))} style={{width:36,height:20,borderRadius:10,background:p.attiva!==false?TEAL:"#E5E3DC",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                      <div style={{position:"absolute",top:2,left:p.attiva!==false?18:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .2s"}}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </Sezione>
        </div>
      );

      // ── TEMA ─────────────────────────────────────────────
      case "temi": return (
        <div>
          <Sezione title="Tema interfaccia" sub="Scegli il tema visivo">
            <div style={{padding:"16px 18px",display:"flex",gap:12}}>
              {["chiaro","scuro","oceano"].map(t=>(
                <div key={t} onClick={()=>setTheme?.(t)} style={{flex:1,padding:"16px",borderRadius:10,border:`2px solid ${theme===t?TEAL:"#E5E3DC"}`,cursor:"pointer",textAlign:"center",background:theme===t?TEAL+"08":"#fff",transition:"all .15s"}}>
                  <div style={{fontSize:24,marginBottom:8}}>{t==="chiaro"?"☀️":t==="scuro"?"🌙":"🌊"}</div>
                  <div style={{fontSize:13,fontWeight:700,color:theme===t?TEAL:DARK,textTransform:"capitalize"}}>{t}</div>
                </div>
              ))}
            </div>
          </Sezione>
        </div>
      );

      // ── RESET ────────────────────────────────────────────
      case "reset": return (
        <div>
          <Sezione title="Zona reset" sub="Operazioni irreversibili — usare con cautela">
            <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
              <div style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${AMB}40`,background:AMB+"06"}}>
                <div style={{fontSize:13,fontWeight:700,color:AMB,marginBottom:4}}>Ricarica dati demo</div>
                <div style={{fontSize:12,color:"#86868b",marginBottom:12}}>Ricarica i 4 clienti demo con tutti i dati precompilati per testare il flusso completo.</div>
                <div onClick={()=>{if(!confirm("Ricaricare i dati demo?"))return;}} style={{padding:"9px 18px",borderRadius:8,background:AMB,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-block"}}>Ricarica dati demo (4 clienti)</div>
              </div>
              <div style={{padding:"14px 16px",borderRadius:10,border:`1px solid ${RED}40`,background:RED+"06"}}>
                <div style={{fontSize:13,fontWeight:700,color:RED,marginBottom:4}}>Pulisci tutto</div>
                <div style={{fontSize:12,color:"#86868b",marginBottom:12}}>Elimina tutti i dati e parti da zero. Operazione irreversibile.</div>
                <div onClick={()=>{if(!confirm("ATTENZIONE: eliminare tutti i dati?"))return;if(!confirm("ULTIMA CONFERMA: sei sicuro?"))return;localStorage.removeItem("mastro_erp_data");window.location.reload();}} style={{padding:"9px 18px",borderRadius:8,background:RED,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",display:"inline-block"}}>Pulisci tutto — Parti da zero</div>
              </div>
            </div>
          </Sezione>
        </div>
      );

      default: return (
        <div style={{padding:"40px",textAlign:"center",color:"#86868b",fontSize:14}}>
          Sezione in sviluppo — disponibile presto
        </div>
      );
    }
  };

  return (
    <div style={{display:"flex",height:"100%",background:"#F2F1EC",fontFamily:FF}}>

      {/* SIDEBAR NAV */}
      <div style={{width:220,flexShrink:0,background:"#fff",borderRight:`1px solid #E5E3DC`,display:"flex",flexDirection:"column",overflowY:"auto"}}>
        <div style={{padding:"16px 16px 8px",fontSize:10,fontWeight:800,color:"#86868b",textTransform:"uppercase",letterSpacing:1}}>Impostazioni</div>
        {NAV_SECTIONS.map(section=>(
          <div key={section.group} style={{marginBottom:4}}>
            <div style={{padding:"6px 16px 3px",fontSize:9,fontWeight:800,color:"#C0C0C5",textTransform:"uppercase",letterSpacing:1.2}}>{section.group}</div>
            {section.items.map(item=>{
              const isActive=active===item.id;
              return (
                <div key={item.id} onClick={()=>setSettingsTab?.(item.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"8px 16px",cursor:"pointer",background:isActive?TEAL+"10":"transparent",borderLeft:`3px solid ${isActive?TEAL:"transparent"}`,transition:"background .1s"}}
                  onMouseEnter={e=>!isActive&&((e.currentTarget as any).style.background="#F8F7F2")}
                  onMouseLeave={e=>!isActive&&((e.currentTarget as any).style.background="transparent")}>
                  <Svg path={item.icon} c={isActive?TEAL:"#86868b"} s={15}/>
                  <span style={{fontSize:13,fontWeight:isActive?700:400,color:isActive?TEAL:DARK}}>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* CONTENUTO */}
      <div style={{flex:1,overflowY:"auto",padding:"24px 28px"}}>
        {renderContent()}
      </div>

    </div>
  );
}
