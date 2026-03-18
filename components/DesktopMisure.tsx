"use client";
// @ts-nocheck
// MASTRO — DesktopMisure.tsx
// Riepilogo sopralluoghi e misure: lista rilievi, foto vani, misure dettagliate, export PDF

import { useState, useMemo } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0";

const STATI_MISURE = [
  { id:"provvisorie",  label:"Provvisorie",  c:AMBER, desc:"Prese a mano, da verificare" },
  { id:"verificate",   label:"Verificate",   c:BLUE,  desc:"Controllate in ufficio" },
  { id:"confermate",   label:"Confermate",   c:TEAL,  desc:"Approvate, si può procedere" },
  { id:"da_rivedere",  label:"Da rivedere",  c:RED,   desc:"Errore o modifica richiesta" },
];

export default function DesktopMisure() {
  const { T, cantieri=[], setSelectedCM, setTab } = useMastro();
  const [selCommessa, setSelCommessa] = useState<any>(null);
  const [selVano, setSelVano] = useState<any>(null);
  const [filtroStato, setFiltroStato] = useState("tutti");
  const [search, setSearch] = useState("");

  // Commesse con vani che hanno misure
  const commesseMisure = useMemo(()=>cantieri.filter(c=>{
    const vani=(c.vani||[]).filter((v:any)=>!v.eliminato);
    return vani.length>0;
  }).map(c=>{
    const vani=(c.vani||[]).filter((v:any)=>!v.eliminato);
    const statoMisure = vani.every((v:any)=>v.misureConfermate)?"confermate":vani.some((v:any)=>v.misureVerificate)?"verificate":vani.some((v:any)=>v.misureDaRivedere)?"da_rivedere":"provvisorie";
    const completezza = Math.round(vani.filter((v:any)=>{const m=v.misure||{};return m.lCentro&&m.hCentro;}).length/Math.max(vani.length,1)*100);
    return { ...c, vani, statoMisure, completezza, nVani:vani.length };
  }),[cantieri]);

  const filtered = useMemo(()=>commesseMisure.filter(c=>{
    if(filtroStato!=="tutti"&&c.statoMisure!==filtroStato) return false;
    if(search&&!`${c.cliente} ${c.cognome||""} ${c.code}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }),[commesseMisure,filtroStato,search]);

  const statoInfo=(id:string)=>STATI_MISURE.find(s=>s.id===id)||STATI_MISURE[0];
  const fmtMisura=(v:any,key:string)=>v?.misure?.[key]?`${v.misure[key]} mm`:"—";

  const statsTotali = {
    conMisure: commesseMisure.length,
    confermate: commesseMisure.filter(c=>c.statoMisure==="confermate").length,
    provvisorie: commesseMisure.filter(c=>c.statoMisure==="provvisorie").length,
    daRivedere: commesseMisure.filter(c=>c.statoMisure==="da_rivedere").length,
  };

  const CAMPI_MISURA = [
    {k:"lAlto",   l:"L alto"},
    {k:"lCentro", l:"L centro"},
    {k:"lBasso",  l:"L basso"},
    {k:"hSx",     l:"H sinistra"},
    {k:"hDx",     l:"H destra"},
    {k:"d1",      l:"Spalletta SX"},
    {k:"d2",      l:"Spalletta DX"},
    {k:"arch",    l:"Arco"},
    {k:"davInt",  l:"Davanzale int."},
    {k:"davEst",  l:"Davanzale est."},
  ];

  return (
    <div style={{display:"flex",height:"100%",flexDirection:"column" as any,background:"#F4F6F8",overflow:"hidden"}}>
      {/* TOPBAR */}
      <div style={{background:"#fff",borderBottom:`0.5px solid ${T.bdr}`,padding:"10px 20px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
        <span style={{fontSize:15,fontWeight:500,color:T.text}}>Misure & Sopralluoghi</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto"}}>
          {[{l:"Con misure",v:statsTotali.conMisure,c:T.text},{l:"Confermate",v:statsTotali.confermate,c:TEAL},{l:"Provvisorie",v:statsTotali.provvisorie,c:AMBER},{l:"Da rivedere",v:statsTotali.daRivedere,c:statsTotali.daRivedere>0?RED:TEAL}].map((k,i)=>(
            <div key={i} style={{textAlign:"center",padding:"4px 10px",borderRadius:7,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`}}>
              <div style={{fontSize:16,fontWeight:500,color:k.c,fontFamily:FM}}>{k.v}</div>
              <div style={{fontSize:9,color:T.sub}}>{k.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        {/* LISTA COMMESSE CON MISURE */}
        <div style={{width:280,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          <div style={{padding:"10px 12px 8px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",background:"#F8FAFC",borderRadius:7,border:`0.5px solid ${T.bdr}`,marginBottom:8}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca..." style={{border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",width:"100%",fontFamily:FF}}/>
            </div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap" as any}}>
              {["tutti",...STATI_MISURE.map(s=>s.id)].map(id=>{
                const info=STATI_MISURE.find(s=>s.id===id);
                return (
                  <div key={id} onClick={()=>setFiltroStato(id)} style={{padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",background:filtroStato===id?(info?.c||DARK):"transparent",color:filtroStato===id?"#fff":T.sub,border:`0.5px solid ${filtroStato===id?(info?.c||DARK):T.bdr}`}}>
                    {id==="tutti"?"Tutti":info?.label}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{flex:1,overflowY:"auto" as any}}>
            {filtered.length===0&&<div style={{padding:20,textAlign:"center" as any,fontSize:12,color:T.sub}}>Nessuna commessa con misure</div>}
            {filtered.map((c:any)=>{
              const st=statoInfo(c.statoMisure);
              return (
                <div key={c.id} onClick={()=>{setSelCommessa(c);setSelVano(null);}}
                  style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selCommessa?.id===c.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selCommessa?.id===c.id?TEAL:"transparent"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:30,height:30,borderRadius:8,background:st.c+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:st.c,flexShrink:0}}>{c.nVani}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as any}}>{c.cliente} {c.cognome||""}</div>
                      <div style={{fontSize:10,color:T.sub}}>{c.code} · {c.nVani} vani</div>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{flex:1,height:3,background:"#F4F6F8",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${c.completezza}%`,background:st.c,borderRadius:2}}/>
                    </div>
                    <span style={{fontSize:9,color:T.sub,minWidth:28,textAlign:"right" as any}}>{c.completezza}%</span>
                    <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:st.c+"12",color:st.c,fontWeight:500,flexShrink:0}}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VANI DELLA COMMESSA */}
        <div style={{width:280,flexShrink:0,background:"#fff",borderRight:`0.5px solid ${T.bdr}`,display:"flex",flexDirection:"column" as any,overflow:"hidden"}}>
          {!selCommessa?(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as any,gap:8,color:T.sub,padding:20,textAlign:"center" as any}}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              <span style={{fontSize:12}}>Seleziona una commessa</span>
            </div>
          ):(
            <>
              <div style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:500,color:T.text}}>{selCommessa.cliente} {selCommessa.cognome||""}</div>
                <div style={{fontSize:10,color:T.sub}}>{selCommessa.code} · {selCommessa.nVani} vani</div>
              </div>
              <div style={{flex:1,overflowY:"auto" as any}}>
                {selCommessa.vani.map((v:any,i:number)=>{
                  const m=v.misure||{};
                  const hasL=m.lCentro&&m.hCentro;
                  return (
                    <div key={v.id||i} onClick={()=>setSelVano(selVano?.id===v.id?null:v)}
                      style={{padding:"10px 12px",borderBottom:`0.5px solid ${T.bdr}`,cursor:"pointer",background:selVano?.id===v.id?"rgba(26,158,115,0.06)":"transparent",borderLeft:`2px solid ${selVano?.id===v.id?TEAL:"transparent"}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:26,height:26,borderRadius:6,background:hasL?TEAL+"12":AMBER+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:hasL?TEAL:AMBER,flexShrink:0}}>{i+1}</div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:500,color:T.text}}>{v.nome||`Vano ${i+1}`}</div>
                          <div style={{fontSize:10,color:T.sub}}>{v.tipo||"—"}{m.lCentro&&m.hCentro?` · ${m.lCentro}×${m.hCentro} mm`:""}</div>
                        </div>
                        <span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:hasL?TEAL+"12":AMBER+"12",color:hasL?TEAL:AMBER,fontWeight:500,flexShrink:0}}>{hasL?"OK":"Inc."}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{padding:"10px 12px",borderTop:`0.5px solid ${T.bdr}`,flexShrink:0,display:"flex",gap:6}}>
                <button onClick={()=>{setSelectedCM(selCommessa);setTab("commesse");}} style={{flex:1,padding:"7px",borderRadius:7,border:`0.5px solid ${T.bdr}`,background:"transparent",fontSize:11,color:T.text,cursor:"pointer",fontFamily:FF}}>Vai alla commessa</button>
                <button style={{flex:1,padding:"7px",borderRadius:7,border:"none",background:TEAL,fontSize:11,fontWeight:500,color:"#fff",cursor:"pointer",fontFamily:FF}}>Export PDF misure</button>
              </div>
            </>
          )}
        </div>

        {/* MISURE DETTAGLIATE VANO */}
        <div style={{flex:1,display:"flex",flexDirection:"column" as any,overflow:"hidden",background:"#fff"}}>
          {!selVano?(
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column" as any,gap:8,color:T.sub,padding:20,textAlign:"center" as any}}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
              <span style={{fontSize:13}}>Seleziona un vano per vedere le misure</span>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto" as any,padding:20}}>
              <div style={{fontSize:15,fontWeight:500,color:T.text,marginBottom:4}}>{selVano.nome||"Vano"}</div>
              <div style={{fontSize:11,color:T.sub,marginBottom:16}}>{selVano.tipo||"—"} · {selVano.sistema||"—"}</div>

              {/* Misure tabella */}
              <div style={{background:"#fff",borderRadius:10,border:`0.5px solid ${T.bdr}`,overflow:"hidden",marginBottom:16}}>
                <div style={{padding:"8px 14px",background:"#F8FAFC",borderBottom:`0.5px solid ${T.bdr}`,fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.4}}>Misure rilevate</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0}}>
                  {CAMPI_MISURA.map((c,i)=>{
                    const val=selVano.misure?.[c.k];
                    return (
                      <div key={c.k} style={{padding:"8px 14px",borderBottom:i<CAMPI_MISURA.length-2?`0.5px solid ${T.bdr}`:"none",borderRight:i%2===0?`0.5px solid ${T.bdr}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <span style={{fontSize:11,color:T.sub}}>{c.l}</span>
                        <span style={{fontSize:12,fontWeight:500,color:val?T.text:"#D1D5DB",fontFamily:FM}}>{val?`${val} mm`:"—"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info vano */}
              <div style={{background:"#F8FAFC",borderRadius:10,padding:"12px 14px",border:`0.5px solid ${T.bdr}`,marginBottom:14}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Configurazione</div>
                {[
                  {l:"Sistema",v:selVano.sistema||"—"},
                  {l:"Colore esterno",v:selVano.coloreExt||selVano.colore||"—"},
                  {l:"Colore interno",v:selVano.coloreInt||"—"},
                  {l:"Vetro",v:selVano.vetro||"—"},
                  {l:"Apertura",v:selVano.apertura||"—"},
                  {l:"Tapparella",v:selVano.tapparella?"Sì":"No"},
                  {l:"Zanzariera",v:selVano.zanzariera?"Sì":"No"},
                ].map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:i<6?`0.5px solid ${T.bdr}`:"none"}}>
                    <span style={{fontSize:11,color:T.sub}}>{r.l}</span>
                    <span style={{fontSize:11,fontWeight:500,color:T.text}}>{r.v}</span>
                  </div>
                ))}
              </div>

              {/* Foto vano placeholder */}
              <div style={{fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:8}}>Foto cantiere</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                {(selVano.foto||[]).slice(0,4).map((f:any,i:number)=>(
                  <div key={i} style={{aspectRatio:"1",borderRadius:8,background:"#F4F6F8",border:`0.5px solid ${T.bdr}`,overflow:"hidden"}}>
                    {f.url&&<img src={f.url} style={{width:"100%",height:"100%",objectFit:"cover" as any}} alt=""/>}
                  </div>
                ))}
                {(selVano.foto||[]).length===0&&[0,1,2,3].map(i=>(
                  <div key={i} style={{aspectRatio:"1",borderRadius:8,background:"#F4F6F8",border:`0.5px dashed ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:T.bdr}}>
                    📷
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
