// ═══ MASTRO ERP — VanoDetail (Phase B extraction) ═══
import { useMastro } from "../../MastroContext";

export default function VanoDetail() {
  const ctx = useMastro();
  const {
    setCantieri, coloriDB, sistemiDB, vetriDB, coprifiliDB, lamiereDB,
    libreriaDB, telaiPersianaDB, posPersianaDB, tipoMisuraDB,
    tipoMisuraTappDB, tipoMisuraZanzDB, tipoCassonettoDB,
    ctProfDB, ctSezioniDB, ctCieliniDB, ctOffset,
    selectedCM, setSelectedCM, selectedRilievo, setSelectedRilievo,
    selectedVano, setSelectedVano, vanoStep, setVanoStep,
    spDrawing, setSpDrawing, setShowAIPhoto, setAiPhotoStep,
    viewingPhotoId, setViewingPhotoId, pendingFotoCat, setPendingFotoCat,
    isDrawing, setIsDrawing, drawTool, setDrawTool,
    drawPages, setDrawPages, drawPageIdx, setDrawPageIdx,
    drawFullscreen, setDrawFullscreen, penColor, setPenColor,
    penSize, setPenSize, fabOpen, vanoInfoOpen, setVanoInfoOpen,
    tipCat, setTipCat, mezziSalita, T, S, Ico, cantieri,
    isTablet, isDesktop,
  } = ctx;

    const v = selectedVano;
    const m = v.misure || {};
    const step = STEPS[vanoStep];
    const filled = Object.values(m).filter(x => (x as number) > 0).length;
    const TIPO_TIPS = { Scorrevole: { t: "Scorrevole (alzante/traslante)", dim: "2000 × 2200 mm", w: ["Binario inferiore: serve spazio incasso", "Verifica portata parete"] }, Portafinestra: { t: "Portafinestra standard", dim: "800-900 × 2200 mm", w: ["Soglia a taglio termico", "Verifica altezza architrave"] }, Finestra: { t: "Finestra", dim: "1200 × 1400 mm", w: ["Verifica spazio per anta"] } };
    const tip = TIPO_TIPS[v.tipo] || null;
    const hasWarnings = !m.lAlto && !m.lCentro && !m.lBasso;
    const hasHWarnings = !m.hSx && !m.hCentro && !m.hDx;
    const fSq = m.d1 > 0 && m.d2 > 0 ? Math.abs(m.d1 - m.d2) : null;

    // Mini SVG per step
    const MiniSVG = ({ type }) => {
      const w = 60, h = 70;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
          <rect x={5} y={5} width={w-10} height={h-10} fill={step.color + "12"} stroke={step.color + "40"} strokeWidth={1.5} rx={3} />
          {type === "larghezze" && <>
            <line x1={10} y1={18} x2={w-10} y2={18} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={10} y1={h/2} x2={w-10} y2={h/2} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={10} y1={h-18} x2={w-10} y2={h-18} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "altezze" && <>
            <line x1={14} y1={10} x2={14} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w/2} y1={10} x2={w/2} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w-14} y1={10} x2={w-14} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "diagonali" && <>
            <line x1={10} y1={10} x2={w-10} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w-10} y1={10} x2={10} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "spallette" && <>
            <rect x={2} y={5} width={10} height={h-10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
            <rect x={w-12} y={5} width={10} height={h-10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
            <rect x={5} y={2} width={w-10} height={8} fill={step.color + "18"} stroke={step.color+"40"} rx={1} />
          </>}
          {type === "davanzale" && <>
            <rect x={5} y={h-16} width={w-10} height={10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
          </>}
        </svg>
      );
    };

    // Inline input renderer (no sub-component = no focus loss)
    const bInput = (label, field) => (
      <div key={field} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{label}</div>
        <input
          key={`input-${field}`}
          style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 500, fontFamily: FM, textAlign: "center", border: `1px solid ${T.bdr}`, borderRadius: 12, background: m[field] > 0 ? step.color + "08" : T.card, color: T.text, outline: "none", boxSizing: "border-box" }}
          type="number" inputMode="numeric" placeholder="Tocca per inserire" value={m[field] || ""}
          onChange={e => updateMisura(v.id, field, e.target.value)}
        />
      </div>
    );

    return (
      <div style={{ paddingBottom: 80, background: T.bg }}>
        {/* Back + vano name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          <div onClick={() => { setSelectedVano(null); setVanoStep(0); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo} · {v.stanza} · {v.piano}</div>
          </div>
          <div onClick={() => { setShowAIPhoto(true); setAiPhotoStep(0); }} style={{ padding: "5px 10px", borderRadius: 8, background: "linear-gradient(135deg, #af52de20, #007aff20)", border: "1px solid #af52de40", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#af52de" }}>AI</span>
          </div>
        </div>

        {/* == INFO VANO — fisarmoniche (solo step 0) == */}
        {vanoStep === 0 && (() => {
          const updateV = (field, val) => {
            const updRil = selectedRilievo ? { ...selectedRilievo, vani: selectedRilievo.vani.map(vn => vn.id === v.id ? { ...vn, [field]: val } : vn) } : null;
            setCantieri(cs => cs.map(c => c.id === selectedCM?.id
              ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? (updRil || r2) : r2) } : c));
            if (updRil) setSelectedRilievo(updRil);
            setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo?.id ? (updRil || r) : r) }) : prev);
            setSelectedVano(prev => ({ ...prev, [field]: val }));
          };
          const cats = [...new Set(tipologieFiltrate.map(t => t.cat))];
          const pianiList = ["S2","S1","PT","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15","P16","P17","P18","P19","P20","M"];
          const coloriRAL = ["RAL 9010","RAL 9016","RAL 9001","RAL 7016","RAL 7021","RAL 8014","RAL 8016","RAL 1013","Altro"];

          const sections = [
            { id:"accesso", icon:"🏗", label:"Accesso / Difficoltà",
              badge: v.difficoltaSalita||null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"facile",l:"Facile",c:T.grn,e:"✅"},{id:"media",l:"Media",c:T.orange,e:"⚠️"},{id:"difficile",l:"Difficile",c:T.red,e:"🔴"}].map(d=>(
                    <div key={d.id} onClick={()=>updateV("difficoltaSalita",d.id)}
                      style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1.5px solid ${v.difficoltaSalita===d.id?d.c:T.bdr}`,background:v.difficoltaSalita===d.id?d.c+"15":T.card,textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:13}}>{d.e}</div>
                      <div style={{fontSize:10,fontWeight:700,color:v.difficoltaSalita===d.id?d.c:T.sub}}>{d.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:2}}>MEZZO DI SALITA</div>
                <select style={S.select} value={v.mezzoSalita||""} onChange={e=>updateV("mezzoSalita",e.target.value)}>
                  <option value="">— Seleziona —</option>
                  {mezziSalita.map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            },
            { id:"tipologia", icon:"🪟", label:"Tipologia",
              badge: v.tipo||null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bdr}`,paddingBottom:0,marginBottom:4}}>
                  {cats.map(cat=>(
                    <div key={cat} onClick={()=>setTipCat(cat)}
                      style={{padding:"5px 8px",fontSize:10,fontWeight:700,cursor:"pointer",color:tipCat===cat?T.acc:T.sub,borderBottom:`2px solid ${tipCat===cat?T.acc:"transparent"}`,marginBottom:-1,whiteSpace:"nowrap"}}>
                      {cat}
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
                  {tipologieFiltrate.filter(t=>t.cat===tipCat).map(t=>(
                    <div key={t.code} onClick={()=>updateV("tipo",t.code)}
                      style={{padding:"7px 10px",borderRadius:10,border:`1.5px solid ${v.tipo===t.code?T.acc:T.bdr}`,background:v.tipo===t.code?T.accLt:T.card,fontSize:11,fontWeight:700,color:v.tipo===t.code?T.acc:T.text,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      {t.icon} {t.code}
                    </div>
                  ))}
                </div>
              </div>
            },
            { id:"posizione", icon:"🏠", label:"Stanza / Piano",
              badge: v.stanza?`${v.stanza} · ${v.piano}`:null,
              body: <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>STANZA</div>
                  <select style={S.select} value={v.stanza||""} onChange={e=>updateV("stanza",e.target.value)}>
                    {["Soggiorno","Cucina","Camera","Bagno","Studio","Ingresso","Corridoio","Altro"].map(x=><option key={x}>{x}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>PIANO</div>
                  <select style={S.select} value={v.piano||""} onChange={e=>updateV("piano",e.target.value)}>
                    {pianiList.map(p=><option key={p} value={p}>{p==="S2"?"S2 — 2° Seminterrato":p==="S1"?"S1 — Seminterrato":p==="PT"?"PT — Piano Terra":p==="M"?"M — Mansarda":`${p} — ${p.replace("P","")}° Piano`}</option>)}
                  </select>
                </div>
                <div style={{width:80}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>PEZZI</div>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <div onClick={()=>updateV("pezzi",Math.max(1,(v.pezzi||1)-1))} style={{width:28,height:32,borderRadius:6,background:T.bg,border:`1px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,fontWeight:700,color:T.sub}}>−</div>
                    <div style={{flex:1,textAlign:"center",fontSize:16,fontWeight:800,color:T.acc}}>{v.pezzi||1}</div>
                    <div onClick={()=>updateV("pezzi",(v.pezzi||1)+1)} style={{width:28,height:32,borderRadius:6,background:T.bg,border:`1px solid ${T.bdr}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,fontWeight:700,color:T.sub}}>+</div>
                  </div>
                </div>
              </div>
            },
            { id:"sistema", icon:"⚙️", label:"Sistema / Vetro",
              badge: v.sistema?v.sistema.split(" ").slice(0,2).join(" · "):null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>SISTEMA</div>
                  <select style={S.select} value={v.sistema||""} onChange={e=>updateV("sistema",e.target.value)}>
                    <option value="">— Seleziona —</option>
                    {sistemiDB.map(s=><option key={s.id} value={`${s.marca} ${s.sistema}`}>{s.marca} {s.sistema}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>VETRO</div>
                  <select style={S.select} value={v.vetro||""} onChange={e=>updateV("vetro",e.target.value)}>
                    <option value="">— Seleziona —</option>
                    {vetriDB.map(g=><option key={g.id} value={g.code}>{g.code} Ug={g.ug}</option>)}
                  </select>
                </div>
              </div>
            },
            { id:"colori", icon:"🎨", label:"Colori profili",
              badge: v.coloreInt||null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub}}>INT</div>
                  <div onClick={()=>updateV("bicolore",!v.bicolore)}
                    style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:v.bicolore?T.accLt:"transparent",border:`1px solid ${v.bicolore?T.acc:T.bdr}`,color:v.bicolore?T.acc:T.sub,cursor:"pointer",fontWeight:600}}>
                    Bicolore {v.bicolore?"✓":""}
                  </div>
                </div>
                {!v.bicolore
                  ? <select style={S.select} value={v.coloreInt||""} onChange={e=>updateV("coloreInt",e.target.value)}>
                      <option value="">— Seleziona —</option>
                      {coloriDB.map(c=><option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                    </select>
                  : <div style={{display:"flex",gap:6}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:T.sub,marginBottom:2}}>INT</div>
                        <select style={S.select} value={v.coloreInt||""} onChange={e=>updateV("coloreInt",e.target.value)}>
                          <option value="">—</option>{coloriDB.map(c=><option key={c.id} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:T.sub,marginBottom:2}}>EST</div>
                        <select style={S.select} value={v.coloreEst||""} onChange={e=>updateV("coloreEst",e.target.value)}>
                          <option value="">—</option>{coloriDB.map(c=><option key={c.id} value={c.code}>{c.code}</option>)}
                        </select>
                      </div>
                    </div>
                }
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>ACCESSORI</div>
                  <select style={S.select} value={v.coloreAcc||""} onChange={e=>updateV("coloreAcc",e.target.value)}>
                    <option value="">— Come profili —</option>
                    {coloriDB.map(c=><option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                  </select>
                </div>
              </div>
            },
            { id:"telaio", icon:"📐", label:"Telaio / Rifilato",
              badge: v.telaio?(v.telaio==="Z"?"Telaio Z":"Telaio L"):(v.rifilato?"Rifilato":null),
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6}}>
                  {[{id:"Z",l:"Telaio a Z"},{id:"L",l:"Telaio a L"}].map(t=>(
                    <div key={t.id} onClick={()=>updateV("telaio",v.telaio===t.id?"":t.id)}
                      style={{flex:1,padding:"9px",borderRadius:8,border:`1.5px solid ${v.telaio===t.id?T.acc:T.bdr}`,background:v.telaio===t.id?T.accLt:T.card,textAlign:"center",fontSize:12,fontWeight:700,color:v.telaio===t.id?T.acc:T.sub,cursor:"pointer"}}>
                      {t.l}
                    </div>
                  ))}
                </div>
                {v.telaio==="Z" && <div>
                  <div style={{fontSize:10,color:T.sub,fontWeight:600,marginBottom:2}}>Lunghezza ala (mm)</div>
                  <input style={S.input} type="number" inputMode="numeric" placeholder="es. 35" value={v.telaioAlaZ||""} onChange={e=>updateV("telaioAlaZ",e.target.value)}/>
                </div>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div onClick={()=>updateV("rifilato",!v.rifilato)}
                    style={{width:40,height:22,borderRadius:11,background:v.rifilato?T.acc:T.bdr,cursor:"pointer",position:"relative",flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:v.rifilato?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.15s"}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:T.text}}>Rifilato</span>
                </div>
                {v.rifilato && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {[["rifilSx","↙ Sx"],["rifilDx","↘ Dx"],["rifilSopra","↑ Sopra"],["rifilSotto","↓ Sotto"]].map(([f,l])=>(
                    <div key={f}><div style={{fontSize:9,color:T.sub,fontWeight:600,marginBottom:2}}>{l} (mm)</div>
                    <input style={S.input} type="number" inputMode="numeric" placeholder="0" value={v[f]||""} onChange={e=>updateV(f,e.target.value)}/></div>
                  ))}
                </div>}
              </div>
            },
            { id:"finiture", icon:"🔩", label:"Coprifilo / Lamiera",
              badge: (v.coprifilo||v.lamiera)?"✓":null,
              body: <div style={{display:"flex",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>COPRIFILO</div>
                  <select style={S.select} value={v.coprifilo||""} onChange={e=>updateV("coprifilo",e.target.value)}>
                    <option value="">— No —</option>
                    {coprifiliDB.map(c=><option key={c.id} value={c.cod}>{c.cod} — {c.nome}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>LAMIERA</div>
                  <select style={S.select} value={v.lamiera||""} onChange={e=>updateV("lamiera",e.target.value)}>
                    <option value="">— No —</option>
                    {lamiereDB.map(l=><option key={l.id} value={l.cod}>{l.cod} — {l.nome}</option>)}
                  </select>
                </div>
              </div>
            },
            { id:"controtelaio", icon:"🔲", label:"Controtelaio",
              badge: v.controtelaio?.tipo ? (v.controtelaio.tipo==="singolo"?"Singolo":v.controtelaio.tipo==="doppio"?"Doppio":"Con cassonetto") : null,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:2}}>TIPO CONTROTELAIO</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {[{id:"",l:"Nessuno",c:T.sub},{id:"singolo",l:"Singolo",c:"#2563eb"},{id:"doppio",l:"Doppio",c:"#7c3aed"},{id:"cassonetto",l:"Con Cassonetto",c:"#b45309"}].map(ct=>(
                    <div key={ct.id} onClick={()=>updateV("controtelaio",{...(v.controtelaio||{}),tipo:ct.id})}
                      style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1.5px solid ${v.controtelaio?.tipo===ct.id?ct.c:T.bdr}`,background:v.controtelaio?.tipo===ct.id?ct.c+"15":T.card,textAlign:"center",cursor:"pointer",minWidth:70}}>
                      <div style={{fontSize:11,fontWeight:700,color:v.controtelaio?.tipo===ct.id?ct.c:T.sub}}>{ct.l}</div>
                    </div>
                  ))}
                </div>
                {v.controtelaio?.tipo==="singolo" && <>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>LARGHEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.l||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,l:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>ALTEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.h||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,h:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>PROFONDITÀ</div>
                    <select style={S.select} value={v.controtelaio?.prof||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,prof:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctProfDB.map(p=><option key={p.id} value={p.code}>{p.code} mm</option>)}
                    </select></div>
                  {v.controtelaio?.l > 0 && v.controtelaio?.h > 0 && (
                    <div onClick={()=>{
                      const off = ctOffset;
                      const cl = v.controtelaio.l - off*2;
                      const ch = v.controtelaio.h - off*2;
                      updateMisureBatch(v.id, { lAlto: cl, lCentro: cl, lBasso: cl });
                      updateMisureBatch(v.id, { hSx: ch, hCentro: ch, hDx: ch });
                    }} style={{padding:"10px",borderRadius:10,background:"#2563eb15",border:"1.5px solid #2563eb40",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>⚡ Calcola infisso (offset −{ctOffset}mm/lato)</div>
                      <div style={{fontSize:10,color:"#2563eb80",marginTop:2}}>{v.controtelaio.l-ctOffset*2} × {v.controtelaio.h-ctOffset*2} mm</div>
                    </div>
                  )}
                </>}
                {v.controtelaio?.tipo==="doppio" && <>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>LARGHEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.l||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,l:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>ALTEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.h||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,h:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SEZIONE INTERNA (infisso interno)</div>
                    <select style={S.select} value={v.controtelaio?.sezInt||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,sezInt:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctSezioniDB.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                    </select></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SEZIONE ESTERNA (infisso esterno)</div>
                    <select style={S.select} value={v.controtelaio?.sezEst||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,sezEst:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctSezioniDB.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                    </select></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>DISTANZIALE</div>
                    <input style={S.input} type="text" placeholder="es. 30mm" value={v.controtelaio?.distanziale||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,distanziale:e.target.value})}/></div>
                  {v.controtelaio?.l > 0 && v.controtelaio?.h > 0 && (
                    <div onClick={()=>{
                      const off = ctOffset;
                      const cl = v.controtelaio.l - off*2;
                      const ch = v.controtelaio.h - off*2;
                      updateMisureBatch(v.id, { lAlto: cl, lCentro: cl, lBasso: cl });
                      updateMisureBatch(v.id, { hSx: ch, hCentro: ch, hDx: ch });
                    }} style={{padding:"10px",borderRadius:10,background:"#7c3aed15",border:"1.5px solid #7c3aed40",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>⚡ Calcola infisso (offset −{ctOffset}mm/lato)</div>
                      <div style={{fontSize:10,color:"#7c3aed80",marginTop:2}}>{v.controtelaio.l-ctOffset*2} × {v.controtelaio.h-ctOffset*2} mm</div>
                    </div>
                  )}
                </>}
                {v.controtelaio?.tipo==="cassonetto" && <>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>LARGH. VANO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.l||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,l:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>ALT. MAX VANO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.h||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,h:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div style={{marginTop:4,padding:"6px 0",borderTop:`1px dashed ${T.bdr}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4}}>CASSONETTO</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>H CASSONETTO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.hCass||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,hCass:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>P CASSONETTO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.pCass||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,pCass:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SEZIONE CONTROTELAIO</div>
                    <select style={S.select} value={v.controtelaio?.sezione||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,sezione:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctSezioniDB.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                    </select></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SPALLA CONTROTELAIO</div>
                    <input style={S.input} type="text" placeholder="es. 120mm" value={v.controtelaio?.spalla||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,spalla:e.target.value})}/></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>MODELLO CIELINO</div>
                    <select style={S.select} value={v.controtelaio?.cielino||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,cielino:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctCieliniDB.map(c=><option key={c.id} value={c.code}>{c.code}</option>)}
                    </select></div>
                  {v.controtelaio?.l > 0 && v.controtelaio?.h > 0 && (
                    <div onClick={()=>{
                      const off = ctOffset;
                      const cl = v.controtelaio.l - off*2;
                      const hInf = v.controtelaio.h - (v.controtelaio.hCass||0) - off*2;
                      updateMisureBatch(v.id, { lAlto: cl, lCentro: cl, lBasso: cl });
                      updateMisura(v.id,"hSx",hInf); updateMisura(v.id,"hCentro",hInf); updateMisura(v.id,"hDx",hInf);
                    }} style={{padding:"10px",borderRadius:10,background:"#b4530915",border:"1.5px solid #b4530940",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#b45309"}}>⚡ Calcola infisso (offset −{ctOffset}mm/lato)</div>
                      <div style={{fontSize:10,color:"#b4530980",marginTop:2}}>L: {v.controtelaio.l-ctOffset*2} · H: {v.controtelaio.h-(v.controtelaio.hCass||0)-ctOffset*2} mm</div>
                    </div>
                  )}
                </>}
              </div>
            },
          ];

          return (
            <div style={{padding:"6px 16px 2px"}}>
              {sections.map(sec=>{
                const isOpen = vanoInfoOpen===sec.id;
                return (
                  <div key={sec.id} style={{marginBottom:3,borderRadius:10,border:`1px solid ${isOpen?T.acc+"50":T.bdr}`,overflow:"hidden"}}>
                    <div onClick={()=>setVanoInfoOpen(isOpen?null:sec.id)}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",background:isOpen?T.acc+"06":T.card,cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:14}}>{sec.icon}</span>
                        <span style={{fontSize:12,fontWeight:600,color:T.text}}>{sec.label}</span>
                        {sec.badge && <span style={{...S.badge(T.accLt,T.acc),fontSize:9,padding:"1px 6px"}}>{sec.badge}</span>}
                      </div>
                      <span style={{fontSize:9,color:T.sub,display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
                    </div>
                    {isOpen && <div style={{padding:"12px",background:T.bg,borderTop:`1px solid ${T.bdr}`}}>{sec.body}</div>}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Dots progress */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 16px 6px" }}>
          {STEPS.map((s, i) => (
            <div key={i} onClick={() => setVanoStep(i)} style={{ width: i === vanoStep ? 18 : 8, height: 8, borderRadius: 4, background: i === vanoStep ? s.color : i < vanoStep ? s.color + "60" : T.bdr, cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>

        <div style={{ padding: "8px 16px" }}>
          {/* Step header card */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: step.color + "10", borderRadius: 14, border: `1px solid ${step.color}25`, marginBottom: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: step.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{step.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: step.color }}>{step.icon} {step.title}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{step.desc}</div>
              {vanoStep === 0 && <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginTop: 2 }}>{["lAlto","lCentro","lBasso","hSx","hCentro","hDx","d1","d2"].filter(f => m[f] > 0).length}/8 inserite</div>}
            </div>
          </div>

          {/* Warnings */}
          {vanoStep === 0 && (hasWarnings || hasHWarnings) && (
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "#fff3e0", border: "1px solid #ffe0b2", marginBottom: 12, fontSize: 11, color: "#e65100" }}>
              {hasWarnings && <div>⚠ Nessuna larghezza inserita</div>}
              {hasHWarnings && <div>⚠ Nessuna altezza inserita</div>}
            </div>
          )}

          {/* === STEP 0: MISURE (larghezze + altezze + diagonali) === */}
          {vanoStep === 0 && (
            <>
              {/* LARGHEZZE */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#507aff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>📏 Larghezze</div>
              {bInput("Larghezza ALTO", "lAlto")}
              {m.lAlto > 0 && !m.lCentro && !m.lBasso && (
                <div onClick={() => { updateMisura(v.id, "lCentro", m.lAlto); updateMisura(v.id, "lBasso", m.lAlto); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.lAlto} mm)
                </div>
              )}
              {bInput("Larghezza CENTRO (luce netta)", "lCentro")}
              {bInput("Larghezza BASSO", "lBasso")}

              {/* ALTEZZE */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#34c759", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 16, display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>📐 Altezze</div>
              {bInput("Altezza SINISTRA", "hSx")}
              {m.hSx > 0 && !m.hCentro && !m.hDx && (
                <div onClick={() => { updateMisura(v.id, "hCentro", m.hSx); updateMisura(v.id, "hDx", m.hSx); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.hSx} mm)
                </div>
              )}
              {bInput("Altezza CENTRO", "hCentro")}
              {bInput("Altezza DESTRA", "hDx")}

              {/* DIAGONALI */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#ff9500", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 16, display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>✕ Diagonali</div>
              {bInput("Diagonale 1 ↗", "d1")}
              {bInput("Diagonale 2 ↘", "d2")}
              {fSq !== null && fSq > 3 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#ffebee", border: "1px solid #ef9a9a", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#c62828" }}>⚠ Fuori squadra: {fSq}mm</div>
                  <div style={{ fontSize: 11, color: "#b71c1c" }}>Differenza superiore a 3mm — segnalare in ufficio</div>
                </div>
              )}
              {fSq !== null && fSq <= 3 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>✅ In squadra — differenza: {fSq}mm</div>
                </div>
              )}
            </>
          )}

          {/* === STEP 1: DETTAGLI (accordion) === */}
          {vanoStep === 1 && (
            <>
              {/* Spallette */}
              <div onClick={() => setDetailOpen(d => ({...d, spallette: !d.spallette}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.spallette ? "#32ade6" : T.bdr}`, background: detailOpen.spallette ? "#32ade608" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🧱</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.spallette ? "#32ade6" : T.text }}>Spallette</span>
                  {(m.spSx||m.spDx||m.spSopra||m.imbotte) && <span style={{ fontSize: 10, color: "#32ade6", fontWeight: 700, background: "#32ade615", padding: "2px 8px", borderRadius: 6 }}>{[m.spSx,m.spDx,m.spSopra,m.imbotte].filter(x=>x>0).length}/4</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.spallette ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.spallette && (
                <div style={{ marginBottom: 12 }}>
              {bInput("Spalletta SINISTRA", "spSx")}
              {bInput("Spalletta DESTRA", "spDx")}
              {bInput("Spalletta SOPRA", "spSopra")}
              {bInput("Profondità IMBOTTE", "imbotte")}
              {/* DISEGNO LIBERO SPALLETTE */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginTop: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#32ade6" }}>✏️ Disegno spallette</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { const ctx = spCanvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, 380, 200); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗝‘ Pulisci</button>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: T.grn, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                  </div>
                </div>
                <canvas ref={spCanvasRef} width={380} height={200} style={{ width: "100%", height: 200, background: "#fff", touchAction: "none", cursor: "crosshair" }}
                  onPointerDown={e=>{spCanvasRef.current?.setPointerCapture(e.pointerId);setSpDrawing(true);const cv=spCanvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.strokeStyle=penColor;ctx.lineWidth=penSize;ctx.lineCap="round";ctx.lineJoin="round";}}}
                  onPointerMove={e=>{if(!spDrawing)return;const cv=spCanvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}}}
                  onPointerUp={() => setSpDrawing(false)}
                  onPointerLeave={() => setSpDrawing(false)}
                />
                <div style={{ padding: "6px 14px", display: "flex", gap: 4 }}>
                  {["#1d1d1f", "#ff3b30", "#007aff", "#34c759", "#ff9500"].map(c => (
                    <div key={c} onClick={() => setPenColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: penColor === c ? `3px solid ${T.acc}` : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                    {[1, 2, 4].map(s => (
                      <div key={s} onClick={() => setPenSize(s)} style={{ width: 22, height: 22, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <div style={{ width: s * 2 + 2, height: s * 2 + 2, borderRadius: "50%", background: T.text }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
                </div>
              )}
              {/* Davanzale + Cassonetto */}
              <div onClick={() => setDetailOpen(d => ({...d, davanzale: !d.davanzale}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.davanzale ? "#ff2d55" : T.bdr}`, background: detailOpen.davanzale ? "#ff2d5508" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⬇</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.davanzale ? "#ff2d55" : T.text }}>Davanzale + Cassonetto</span>
                  {(m.davProf||m.davSporg||m.soglia||v.cassonetto) && <span style={{ fontSize: 10, color: "#ff2d55", fontWeight: 700, background: "#ff2d5515", padding: "2px 8px", borderRadius: 6 }}>{v.cassonetto ? "🧊" : ""} {[m.davProf,m.davSporg,m.soglia].filter(x=>x>0).length}/3</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.davanzale ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.davanzale && (
                <div style={{ marginBottom: 12 }}>
              {bInput("Davanzale PROFONDITÀ", "davProf")}
              {bInput("Davanzale SPORGENZA", "davSporg")}
              {bInput("Altezza SOGLIA", "soglia")}
              {/* Cassonetto toggle */}
              <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, border: `1px dashed ${T.bdr}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => {
                const nv = { ...v, cassonetto: !v.cassonetto };
                setSelectedVano(nv);
                if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);}
              }}>
                <span style={{ fontSize: 12, color: T.sub }}>+</span>
                <span style={{ fontSize: 14 }}>🧊</span>
                <span style={{ fontSize: 13, color: T.sub }}>{v.cassonetto ? "Cassonetto attivo" : "Ha un cassonetto? Tocca per aggiungere"}</span>
              </div>
              {v.cassonetto && (
                <div style={{ marginTop: 8 }}>
                  {bInput("Cassonetto LARGHEZZA", "casL")}
                  {bInput("Cassonetto ALTEZZA", "casH")}
                  {bInput("Cassonetto PROFONDITÀ", "casP")}
                  {bInput("Cielino LARGHEZZA", "casLCiel")}
                  {bInput("Cielino PROFONDITÀ", "casPCiel")}
                </div>
              )}
                </div>
              )}
              {/* Accessori */}
              <div onClick={() => setDetailOpen(d => ({...d, accessori: !d.accessori}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.accessori ? "#af52de" : T.bdr}`, background: detailOpen.accessori ? "#af52de08" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✚</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.accessori ? "#af52de" : T.text }}>Accessori</span>
                  {(v.accessori?.tapparella?.attivo||v.accessori?.persiana?.attivo||v.accessori?.zanzariera?.attivo) && <span style={{ fontSize: 10, color: "#af52de", fontWeight: 700, background: "#af52de15", padding: "2px 8px", borderRadius: 6 }}>{[v.accessori?.tapparella?.attivo,v.accessori?.persiana?.attivo,v.accessori?.zanzariera?.attivo].filter(Boolean).length} attivi</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.accessori ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.accessori && (
                <div style={{ marginBottom: 12 }}>
              {["tapparella", "persiana", "zanzariera", "cassonetto"].map(acc => {
                if (acc === "cassonetto") {
                  const casColor = "#b45309";
                  const focusNext = (ids, cur) => { const i = ids.indexOf(cur); if (i < ids.length - 1) { const el = document.getElementById(ids[i + 1]); if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } } };
                  const casIds = [`cas-L-${v.id}`, `cas-H-${v.id}`, `cas-P-${v.id}`, `cas-LC-${v.id}`, `cas-PC-${v.id}`];
                  const casInput = (label, field, idx) => (
                    <div key={field} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>{label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input id={casIds[idx]} style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" enterKeyHint={idx < 4 ? "next" : "done"} placeholder="" value={m[field] || ""} onChange={e => updateMisura(v.id, field, e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); focusNext(casIds, casIds[idx]); } }} />
                        <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                        {idx < 4 && <div onClick={() => focusNext(casIds, casIds[idx])} style={{ padding: "8px 12px", borderRadius: 8, background: casColor, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>→</div>}
                      </div>
                    </div>
                  );
                  return (
                    <div key={acc} style={{ marginBottom: 8, borderRadius: 12, border: `1px ${v.cassonetto ? "solid" : "dashed"} ${v.cassonetto ? casColor + "40" : T.bdr}`, overflow: "hidden", background: T.card }}>
                      {!v.cassonetto ? (
                        <div onClick={() => { const nv = { ...v, cassonetto: true }; setSelectedVano(nv); if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);} }} style={{ padding: "14px 16px", textAlign: "center", cursor: "pointer" }}>
                          <span style={{ fontSize: 12, color: T.sub }}>+ 🧊 Aggiungi Cassonetto</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bdr}` }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: casColor }}>🧊 Cassonetto</span>
                            <div onClick={() => { const nv = { ...v, cassonetto: false }; setSelectedVano(nv); if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);} }} style={{ fontSize: 11, color: T.sub, cursor: "pointer" }}>▲ Chiudi</div>
                          </div>
                          <div style={{ padding: "12px 16px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Cassonetto</div>
                            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                              {tipoCassonettoDB.map(tc => (
                                <div key={tc.id} onClick={() => updateVanoField(v.id, "casTipo", tc.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.casTipo === tc.code ? casColor : T.bdr}`, background: v.casTipo === tc.code ? casColor + "18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.casTipo === tc.code ? 700 : 400, color: v.casTipo === tc.code ? casColor : T.text }}>{tc.code}</div>
                              ))}
                            </div>
                            {casInput("Larghezza", "casL", 0)}
                            {casInput("Altezza", "casH", 1)}
                            {casInput("Profondità", "casP", 2)}
                            <div style={{ marginTop: 4, marginBottom: 4, padding: "6px 0", borderTop: `1px dashed ${T.bdr}` }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 2 }}>Cielino</div>
                            </div>
                            {casInput("Larghezza Cielino", "casLCiel", 3)}
                            {casInput("Profondità Cielino", "casPCiel", 4)}
                            <div onClick={() => { const nv = { ...v, cassonetto: false }; setSelectedVano(nv); if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);} }} style={{ marginTop: 10, padding: "8px", borderRadius: 8, border: `1px dashed #ef5350`, textAlign: "center", fontSize: 11, color: "#ef5350", cursor: "pointer" }}>
                              🗑 Rimuovi cassonetto
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                const a = v.accessori?.[acc] || { attivo: false };
                const accColors = { tapparella: "#ff9500", persiana: "#007aff", zanzariera: "#ff2d55" };
                const accIcons = { tapparella: "🪟", persiana: "🏠", zanzariera: "🦟" };
                const focusNextAcc = (ids, cur) => { const i = ids.indexOf(cur); if (i < ids.length - 1) { const el = document.getElementById(ids[i + 1]); if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } } };
                const accInputIds = [`${acc}-L-${v.id}`, `${acc}-H-${v.id}`];
                return (
                  <div key={acc} style={{ marginBottom: 8, borderRadius: 12, border: `1px ${a.attivo ? "solid" : "dashed"} ${a.attivo ? accColors[acc] + "40" : T.bdr}`, overflow: "hidden", background: T.card }}>
                    {!a.attivo ? (
                      <div onClick={() => toggleAccessorio(v.id, acc)} style={{ padding: "14px 16px", textAlign: "center", cursor: "pointer" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>+ {accIcons[acc]} Aggiungi {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bdr}` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: accColors[acc] }}>{accIcons[acc]} {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                          <div onClick={() => toggleAccessorio(v.id, acc)} style={{ fontSize: 11, color: T.sub, cursor: "pointer" }}>▲ Chiudi</div>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Larghezza</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input id={accInputIds[0]} style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" enterKeyHint="next" placeholder="" value={v.accessori?.[acc]?.l || ""} onChange={e => updateAccessorio(v.id, acc, "l", parseInt(e.target.value) || 0)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); focusNextAcc(accInputIds, accInputIds[0]); } }} />
                              <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                              <div onClick={() => focusNextAcc(accInputIds, accInputIds[0])} style={{ padding: "8px 12px", borderRadius: 8, background: accColors[acc], color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>→</div>
                            </div>
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Altezza</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input id={accInputIds[1]} style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" enterKeyHint="done" placeholder="" value={v.accessori?.[acc]?.h || ""} onChange={e => updateAccessorio(v.id, acc, "h", parseInt(e.target.value) || 0)} />
                              <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                            </div>
                          </div>
                          {acc === "tapparella" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Materiale</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {["PVC", "Alluminio", "Acciaio", "Legno"].map(mat => (
                                  <div key={mat} onClick={() => updateAccessorio(v.id, acc, "materiale", mat)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.materiale === mat ? "#ff9500" : T.bdr}`, background: v.accessori?.[acc]?.materiale === mat ? "#ff950018" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.materiale === mat ? 700 : 400, color: v.accessori?.[acc]?.materiale === mat ? "#ff9500" : T.text }}>{mat}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Motorizzata</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                                {["Sì", "No"].map(mot => (
                                  <div key={mot} onClick={() => updateAccessorio(v.id, acc, "motorizzata", mot)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.motorizzata === mot ? "#34c759" : T.bdr}`, background: v.accessori?.[acc]?.motorizzata === mot ? "#34c75918" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.motorizzata === mot ? 700 : 400, color: v.accessori?.[acc]?.motorizzata === mot ? "#34c759" : T.text }}>{mot}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraTappDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          {acc === "persiana" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipologia Telaio</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {telaiPersianaDB.map(tp => (
                                  <div key={tp.id} onClick={() => updateAccessorio(v.id, acc, "telaio", tp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.telaio === tp.code ? "#007aff" : T.bdr}`, background: v.accessori?.[acc]?.telaio === tp.code ? "#007aff18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.telaio === tp.code ? 700 : 400, color: v.accessori?.[acc]?.telaio === tp.code ? "#007aff" : T.text }}>{tp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>4° Lato / Posizionamento</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {posPersianaDB.map(pp => (
                                  <div key={pp.id} onClick={() => updateAccessorio(v.id, acc, "posizionamento", pp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff" : T.bdr}`, background: v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.posizionamento === pp.code ? 700 : 400, color: v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff" : T.text }}>{pp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          {acc === "zanzariera" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraZanzDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Colore</div>
                          <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF }} value={v.accessori?.[acc]?.colore || ""} onChange={e => updateAccessorio(v.id, acc, "colore", e.target.value)}>
                            <option value="">Colore</option>
                            {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                          </select>
                          <div onClick={() => toggleAccessorio(v.id, acc)} style={{ marginTop: 10, padding: "8px", borderRadius: 8, border: `1px dashed #ef5350`, textAlign: "center", fontSize: 11, color: "#ef5350", cursor: "pointer" }}>
                            🗝‘ Rimuovi {acc}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
                </div>
              )}
              {/* Voci Libere */}
              <div onClick={() => setDetailOpen(d => ({...d, vociLibere: !d.vociLibere}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.vociLibere ? "#ff9500" : T.bdr}`, background: detailOpen.vociLibere ? "#ff950008" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📦</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.vociLibere ? "#ff9500" : T.text }}>Voci libere</span>
                  {v.vociLibere?.length > 0 && <span style={{ fontSize: 10, color: "#ff9500", fontWeight: 700, background: "#ff950015", padding: "2px 8px", borderRadius: 6 }}>{v.vociLibere.length} voc{v.vociLibere.length === 1 ? "e" : "i"}</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.vociLibere ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.vociLibere && (
                <div style={{ marginBottom: 12, padding: "0 4px" }}>
                  {(v.vociLibere || []).map((voce, vi) => (
                    <div key={voce.id || vi} style={{ padding: 10, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9500" }}>Voce {vi + 1}</span>
                        <div onClick={() => {
                          const newVoci = (v.vociLibere || []).filter((_, i) => i !== vi);
                          updateVanoField(v.id, "vociLibere", newVoci);
                        }} style={{ fontSize: 10, color: T.red, cursor: "pointer", fontWeight: 600 }}>✕ Rimuovi</div>
                      </div>
                      {/* Foto */}
                      <div style={{ marginBottom: 6 }}>
                        {voce.foto ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={voce.foto} style={{ height: 50, maxWidth: 80, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.bdr}` }} alt="" />
                            <div onClick={() => {
                              const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], foto: undefined };
                              updateVanoField(v.id, "vociLibere", newVoci);
                            }} style={{ fontSize: 9, color: T.red, cursor: "pointer" }}>✕</div>
                          </div>
                        ) : (
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#ff950012", color: "#ff9500", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                            📷 Foto
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => {
                                const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], foto: ev.target?.result as string };
                                updateVanoField(v.id, "vociLibere", newVoci);
                              };
                              reader.readAsDataURL(file);
                            }} />
                          </label>
                        )}
                      </div>
                      {/* Descrizione */}
                      <input style={{ ...S.input, marginBottom: 6, fontSize: 12 }} placeholder="Descrizione (es. Controtelaio, Davanzale, Soglia...)" defaultValue={voce.descrizione || ""} onBlur={e => {
                        const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], descrizione: e.target.value };
                        updateVanoField(v.id, "vociLibere", newVoci);
                      }} />
                      {/* Prezzo + Unità + Quantità */}
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Prezzo €</label>
                          <input style={{ ...S.input, fontSize: 12, fontFamily: FM }} type="number" step="0.01" placeholder="0.00" defaultValue={voce.prezzo || ""} onBlur={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], prezzo: parseFloat(e.target.value) || 0 };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }} />
                        </div>
                        <div style={{ width: 80 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Unità</label>
                          <select style={{ ...S.select, fontSize: 11 }} value={voce.unita || "pz"} onChange={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], unita: e.target.value };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }}>
                            <option value="pz">Pezzo</option>
                            <option value="mq">mq</option>
                            <option value="ml">ml</option>
                            <option value="kg">kg</option>
                            <option value="forfait">Forfait</option>
                          </select>
                        </div>
                        <div style={{ width: 60 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Qtà</label>
                          <input style={{ ...S.input, fontSize: 12, fontFamily: FM, textAlign: "center" }} type="number" step="0.1" defaultValue={voce.qta || 1} onBlur={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], qta: parseFloat(e.target.value) || 1 };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }} />
                        </div>
                      </div>
                      {voce.prezzo > 0 && <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: T.grn, fontFamily: FM, marginTop: 4 }}>= €{((voce.prezzo || 0) * (voce.qta || 1)).toFixed(2)}</div>}
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <div onClick={() => {
                      const newVoci = [...(v.vociLibere || []), { id: Date.now(), descrizione: "", prezzo: 0, unita: "pz", qta: 1 }];
                      updateVanoField(v.id, "vociLibere", newVoci);
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed #ff9500`, textAlign: "center", cursor: "pointer", color: "#ff9500", fontSize: 12, fontWeight: 600 }}>+ Voce vuota</div>
                    <div onClick={() => {
                      setDetailOpen(d => ({ ...d, showLibreria: !d.showLibreria }));
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>📦 Da libreria</div>
                  </div>
                  {detailOpen.showLibreria && libreriaDB.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, borderRadius: 10, border: `1px solid ${T.acc}30`, background: T.acc + "06" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.acc, marginBottom: 6, textTransform: "uppercase" }}>Scegli dalla libreria</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {libreriaDB.map(item => (
                          <div key={item.id} onClick={() => {
                            const newVoce = { id: Date.now(), descrizione: item.nome, prezzo: item.prezzo || 0, unita: item.unita || "pz", qta: 1, foto: item.foto || undefined, libreriaId: item.id };
                            const newVoci = [...(v.vociLibere || []), newVoce];
                            updateVanoField(v.id, "vociLibere", newVoci);
                            setDetailOpen(d => ({ ...d, showLibreria: false }));
                          }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, cursor: "pointer" }}>
                            {item.foto ? (
                              <img src={item.foto} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} alt="" />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: 4, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📦</div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nome}</div>
                              <div style={{ fontSize: 9, color: T.sub }}>{item.categoria}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.grn, fontFamily: FM, flexShrink: 0 }}>€{item.prezzo}/{item.unita || "pz"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Foto + Note */}
              <div onClick={() => setDetailOpen(d => ({...d, disegno: !d.disegno}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.disegno ? "#ff6b6b" : T.bdr}`, background: detailOpen.disegno ? "#ff6b6b08" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📷</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.disegno ? "#ff6b6b" : T.text }}>Foto + Note</span>
                  {(v.note) && <span style={{ fontSize: 10, color: "#ff6b6b", fontWeight: 700, background: "#ff6b6b15", padding: "2px 8px", borderRadius: 6 }}>📝</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.disegno ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.disegno && (
                <div style={{ marginBottom: 12 }}>
{/* Disegno mano libera — Enhanced: eraser, multi-page, fullscreen */}
              {(() => {
                const W = drawFullscreen ? 760 : 380;
                const H = drawFullscreen ? 680 : 340;
                const savePageData = () => { const cv = canvasRef.current; if (cv) { setDrawPages(prev => { const n = [...prev]; n[drawPageIdx] = cv.toDataURL(); return n; }); } };
                const loadPageData = (idx: number) => { const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx && cv) { ctx.clearRect(0, 0, cv.width, cv.height); if (drawPages[idx]) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = drawPages[idx]; } } };
                const addPage = () => { savePageData(); setDrawPages(prev => [...prev, ""]); setDrawPageIdx(drawPages.length); setTimeout(() => { const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx && cv) ctx.clearRect(0, 0, cv.width, cv.height); }, 50); };
                const switchPage = (idx: number) => { if (idx === drawPageIdx) return; savePageData(); setDrawPageIdx(idx); setTimeout(() => loadPageData(idx), 50); };
                const canvasEl = (
                  <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: drawFullscreen ? "calc(100vh - 140px)" : 340, background: "#fff", touchAction: "none", cursor: drawTool === "eraser" ? "cell" : "crosshair" }}
                    onPointerDown={e => {
                      canvasRef.current?.setPointerCapture(e.pointerId); setIsDrawing(true);
                      const cv = canvasRef.current; const ctx = cv?.getContext("2d");
                      if (ctx && cv) {
                        const r = cv.getBoundingClientRect(); const sx = cv.width / r.width, sy = cv.height / r.height;
                        ctx.beginPath(); ctx.moveTo((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
                        if (drawTool === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = penSize * 8; }
                        else { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = penColor; ctx.lineWidth = penSize; }
                        ctx.lineCap = "round"; ctx.lineJoin = "round";
                      }
                    }}
                    onPointerMove={e => {
                      if (!isDrawing) return; const cv = canvasRef.current; const ctx = cv?.getContext("2d");
                      if (ctx && cv) { const r = cv.getBoundingClientRect(); const sx = cv.width / r.width, sy = cv.height / r.height; ctx.lineTo((e.clientX - r.left) * sx, (e.clientY - r.top) * sy); ctx.stroke(); }
                    }}
                    onPointerUp={() => { setIsDrawing(false); const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx) ctx.globalCompositeOperation = "source-over"; }}
                    onPointerLeave={() => { setIsDrawing(false); const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx) ctx.globalCompositeOperation = "source-over"; }}
                  />
                );
                const toolbar = (
                  <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
                    {["#1d1d1f", "#ff3b30", "#007aff", "#34c759", "#ff9500", "#af52de", "#ff2d55", "#ffffff"].map(c => (
                      <div key={c} onClick={() => { setPenColor(c); setDrawTool("pen"); }} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: penColor === c && drawTool === "pen" ? `3px solid ${T.acc}` : c === "#ffffff" ? `1px solid ${T.bdr}` : "2px solid transparent", cursor: "pointer" }} />
                    ))}
                    <div style={{ width: 1, height: 20, background: T.bdr, margin: "0 4px" }} />
                    {/* Gomma */}
                    <div onClick={() => setDrawTool(drawTool === "eraser" ? "pen" : "eraser")}
                      style={{ width: 32, height: 32, borderRadius: 8, background: drawTool === "eraser" ? "#ff3b30" + "18" : T.bg, border: drawTool === "eraser" ? "2px solid #ff3b30" : `1px solid ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: 14 }}>{drawTool === "eraser" ? "✕" : "🧹"}</span>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                      {[1, 2, 4, 6].map(s => (
                        <div key={s} onClick={() => setPenSize(s)} style={{ width: 24, height: 24, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <div style={{ width: s * 2 + 1, height: s * 2 + 1, borderRadius: "50%", background: drawTool === "eraser" ? "#ff3b30" : T.text }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
                const pageStrip = (
                  <div style={{ padding: "6px 14px", borderTop: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" as const }}>Fogli:</span>
                    {drawPages.map((_: string, i: number) => (
                      <div key={i} onClick={() => switchPage(i)}
                        style={{ minWidth: drawPageIdx === i ? 22 : 8, height: 8, borderRadius: 4, background: drawPageIdx === i ? T.acc : T.bdr, cursor: "pointer", transition: "all 0.15s", position: "relative" as const }}>
                        {drawPageIdx === i && <span style={{ position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 700, color: T.acc }}>{i + 1}</span>}
                      </div>
                    ))}
                    <div onClick={addPage} style={{ width: 22, height: 22, borderRadius: "50%", background: T.bg, border: `1.5px dashed ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.sub, cursor: "pointer", fontWeight: 700 }}>+</div>
                    <span style={{ fontSize: 9, color: T.sub }}>{drawPageIdx + 1}/{drawPages.length}</span>
                    <div style={{ marginLeft: "auto" }} />
                    <div onClick={() => { savePageData(); setDrawFullscreen(!drawFullscreen); }}
                      style={{ padding: "3px 8px", borderRadius: 6, background: drawFullscreen ? T.acc + "12" : T.bg, border: `1px solid ${drawFullscreen ? T.acc : T.bdr}`, fontSize: 10, fontWeight: 700, color: drawFullscreen ? T.acc : T.sub, cursor: "pointer" }}>
                      {drawFullscreen ? "↙ Riduci" : "↗ Ingrandisci"}
                    </div>
                  </div>
                );

                if (drawFullscreen) return (
                  <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#fff", display: "flex", flexDirection: "column" as const }}>
                    <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ff6b6b" }}>✏️ Disegno — Foglio {drawPageIdx + 1}/{drawPages.length}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, W, H); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗑 Pulisci foglio</button>
                        <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ff3b30", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                        <button onClick={() => { savePageData(); setDrawFullscreen(false); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>✕ Chiudi</button>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>{canvasEl}</div>
                    {toolbar}
                    {pageStrip}
                  </div>
                );

                return (
                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b" }}>✏️ Disegno a mano libera</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, W, H); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗑 Pulisci foglio</button>
                        <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ff3b30", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                      </div>
                    </div>
                    {canvasEl}
                    {toolbar}
                    {pageStrip}
                  </div>
                );
              })()}
              {/* Foto */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>📷 FOTO ({(v.foto && Object.keys(v.foto).length) || 0})</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openCamera("foto", null)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.acc, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>📷 Foto</button>
                    <button onClick={() => openCamera("video", null)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.blue, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🎬 Video</button>
                  </div>
                </div>
                {/* Hidden file inputs as fallback */}
                <input ref={fotoVanoRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={e => {
                    const cat = pendingFotoCat;
                    Array.from(e.target.files || []).forEach(file => {
                      const r = new FileReader();
                      r.onload = async ev => {
                        const compressed = await compressImage(ev.target.result as string);
                        const key = "foto_" + Date.now() + "_" + file.name;
                        const fotoObj = { dataUrl: compressed, nome: file.name, tipo: "foto", categoria: cat || null };
                        setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
                        setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
                      };
                      r.readAsDataURL(file);
                    });
                    setPendingFotoCat(null);
                    e.target.value = "";
                  }}/>
                <input ref={videoVanoRef} type="file" accept="video/*" capture="environment" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const key = "video_" + Date.now();
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const vObj = { nome: file.name, tipo: "video", dataUrl: ev.target?.result };
                      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: vObj } } : vn) } : r2) } : c));
                      setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: vObj } }));
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}/>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{Object.keys(v.foto||{}).length} allegati</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { n: "Panoramica", r: true, c: "#ff3b30" }, { n: "Spalle muro", r: true, c: "#007aff" }, { n: "Soglia", r: true, c: "#007aff" },
                    { n: "Cassonetto", r: false, c: "#34c759" }, { n: "Dettagli critici", r: true, c: "#ff3b30" }, { n: "Imbotto", r: false, c: "#34c759" },
                    { n: "Contesto", r: false, c: "#34c759" }, { n: "Altro", r: false, c: "#34c759" },
                  ].map((cat, i) => {
                    const fotoCount = Object.values(v.foto||{}).filter(f=>f.categoria===cat.n).length;
                    return (
                    <div key={i} onClick={()=>{ openCamera("foto", cat.n); }}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${fotoCount>0 ? "#34c759" : cat.r ? cat.c + "40" : T.bdr}`, background: fotoCount>0 ? "#34c75915" : cat.r ? cat.c + "08" : "transparent", fontSize: 10, fontWeight: 600, color: fotoCount>0 ? "#1a9e40" : cat.r ? cat.c : T.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, position:"relative" }}>
                      {fotoCount>0 ? <span style={{fontSize:8,background:"#34c759",color:"#fff",borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{fotoCount}</span> : cat.r ? <span style={{ fontSize: 8 }}>✕</span> : null}
                      <span style={{ fontSize: 10 }}>📷</span> {cat.n}
                    </div>
                    );
                  })}
                </div>
                {Object.keys(v.foto||{}).length === 0
                  ? <div style={{ textAlign: "center", padding: "16px 0", color: T.sub, fontSize: 11 }}>Nessun allegato — tocca 📷 Foto o 🎬 Video</div>
                  : <>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {Object.entries(v.foto||{}).map(([k, f]) => (
                        <div key={k} onClick={() => { if (f.dataUrl) setViewingPhotoId(viewingPhotoId === k ? null : k as any); }}
                          style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: T.bg, border: viewingPhotoId === k ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, cursor: f.dataUrl ? "pointer" : "default" }}>
                          {f.tipo === "foto" && f.dataUrl
                            ? <img src={f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={f.nome}/>
                            : f.tipo === "video" && f.dataUrl
                              ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
                                  <span style={{ fontSize: 28, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>▶</span>
                                </div>
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                                  <span style={{ fontSize: 24 }}>🎬</span>
                                  <span style={{ fontSize: 8, color: T.sub, textAlign: "center", padding: "0 4px" }}>{f.nome?.slice(0,12)}</span>
                                </div>
                          }
                          {f.categoria && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:7,fontWeight:700,padding:"2px 3px",textAlign:"center",lineHeight:1.2}}>{f.categoria}</div>}
                          <div onClick={(ev) => {
                            ev.stopPropagation();
                            const newFoto = { ...(v.foto||{}) }; delete newFoto[k];
                            setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: newFoto } : vn) } : r2) } : c));
                            setSelectedVano(prev => ({ ...prev, foto: newFoto }));
                          }} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</div>
                        </div>
                      ))}
                    </div>
                    {/* Inline viewer for tapped photo/video */}
                    {viewingPhotoId && (v.foto||{})[viewingPhotoId as any] && (
                      <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", background: "#000", position: "relative" as const }}>
                        {(v.foto||{})[viewingPhotoId as any]?.tipo === "video"
                          ? <video src={(v.foto||{})[viewingPhotoId as any]?.dataUrl} controls playsInline autoPlay style={{ width: "100%", maxHeight: 300 }} />
                          : <img src={(v.foto||{})[viewingPhotoId as any]?.dataUrl} style={{ width: "100%", maxHeight: 300, objectFit: "contain" }} alt="" />
                        }
                        <div onClick={() => setViewingPhotoId(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</div>
                      </div>
                    )}
                  </>
                }
              </div>

              {/* Note */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ff9500", marginBottom: 8 }}>📝 NOTE</div>
                <textarea style={{ width: "100%", padding: 10, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, minHeight: 60, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Note sul vano..." defaultValue={v.note || ""} />
              </div>
                </div>
              )}
            </>
          )}


          {/* === STEP 7: RIEPILOGO === */}
          {vanoStep === 2 && (
            <>
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 16, marginBottom: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v.nome}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{v.tipo} • {v.stanza} • {v.piano}</div>
                </div>
                {/* Larghezze */}
                <div style={{ borderRadius: 10, border: `1px solid #507aff25`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#507aff10", fontSize: 11, fontWeight: 700, color: "#507aff" }}>📏 LARGHEZZE</div>
                  {[["Alto", m.lAlto], ["Centro", m.lCentro], ["Basso", m.lBasso]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span style={{ color: T.text }}>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Altezze */}
                <div style={{ borderRadius: 10, border: `1px solid #34c75925`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#34c75910", fontSize: 11, fontWeight: 700, color: "#34c759" }}>📐 ALTEZZE</div>
                  {[["Sinistra", m.hSx], ["Centro", m.hCentro], ["Destra", m.hDx]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Diagonali */}
                <div style={{ borderRadius: 10, border: `1px solid #ff950025`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#ff950010", fontSize: 11, fontWeight: 700, color: "#ff9500" }}>✕ DIAGONALI</div>
                  {[["D1", m.d1], ["D2", m.d2], ["Fuori squadra", fSq !== null ? `${fSq}mm` : ""]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: l === "Fuori squadra" && fSq > 3 ? "#ff3b30" : val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Controtelaio */}
                {v.controtelaio?.tipo && (
                  <div style={{ borderRadius: 10, border: `1px solid #2563eb25`, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ padding: "6px 12px", background: "#2563eb10", fontSize: 11, fontWeight: 700, color: "#2563eb" }}>🔲 CONTROTELAIO {v.controtelaio.tipo==="singolo"?"SINGOLO":v.controtelaio.tipo==="doppio"?"DOPPIO":"CON CASSONETTO"}</div>
                    {[["Larghezza", v.controtelaio.l], ["Altezza", v.controtelaio.h]].map(([l, val]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                        <span>{l}</span>
                        <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                      </div>
                    ))}
                    {v.controtelaio.tipo==="singolo" && v.controtelaio.prof && (
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                        <span>Profondità</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.prof}mm</span>
                      </div>
                    )}
                    {v.controtelaio.tipo==="doppio" && <>
                      {v.controtelaio.sezInt && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>Sez. interna</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.sezInt}</span></div>}
                      {v.controtelaio.sezEst && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>Sez. esterna</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.sezEst}</span></div>}
                      {v.controtelaio.distanziale && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>Distanziale</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.distanziale}</span></div>}
                    </>}
                    {v.controtelaio.tipo==="cassonetto" && <>
                      {v.controtelaio.hCass && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>H Cassonetto</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.hCass}</span></div>}
                      {v.controtelaio.pCass && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>P Cassonetto</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.pCass}</span></div>}
                      {v.controtelaio.sezione && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>Sezione</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.sezione}</span></div>}
                      {v.controtelaio.spalla && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>Spalla</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.spalla}</span></div>}
                      {v.controtelaio.cielino && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}><span>Cielino</span><span style={{ fontFamily: FM, fontWeight: 600 }}>{v.controtelaio.cielino}</span></div>}
                    </>}
                  </div>
                )}
                {/* Spallette */}
                <div style={{ borderRadius: 10, border: `1px solid #32ade625`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#32ade610", fontSize: 11, fontWeight: 700, color: "#32ade6" }}>🧱 SPALLETTE</div>
                  {[["Sinistra", m.spSx], ["Destra", m.spDx], ["Sopra", m.spSopra], ["Imbotte", m.imbotte]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Davanzale */}
                <div style={{ borderRadius: 10, border: `1px solid #ff2d5525`, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ padding: "6px 12px", background: "#ff2d5510", fontSize: 11, fontWeight: 700, color: "#ff2d55" }}>⬇ DAVANZALE</div>
                  {[["Profondità", m.davProf], ["Sporgenza", m.davSporg], ["Soglia", m.soglia]].map(([l, val]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                      <span>{l}</span>
                      <span style={{ fontFamily: FM, fontWeight: 600, color: val ? T.text : T.sub2 }}>{val || "—"}</span>
                    </div>
                  ))}
                </div>
                {/* Accessori */}
                {(v.accessori?.tapparella?.attivo || v.accessori?.persiana?.attivo || v.accessori?.zanzariera?.attivo) && (
                  <div style={{ borderRadius: 10, border: `1px solid #af52de25`, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ padding: "6px 12px", background: "#af52de10", fontSize: 11, fontWeight: 700, color: "#af52de" }}>✚ ACCESSORI</div>
                    {v.accessori?.tapparella?.attivo && <div style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>🪟 Tapparella</div>}
                    {v.accessori?.persiana?.attivo && <div style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>🏠 Persiana</div>}
                    {v.accessori?.zanzariera?.attivo && <div style={{ padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>🦟 Zanzariera</div>}
                  </div>
                )}
                {/* Foto gallery */}
                {Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).length > 0 && (
                  <div style={{ borderRadius: 10, border: `1px solid #007aff25`, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ padding: "6px 12px", background: "#007aff10", fontSize: 11, fontWeight: 700, color: "#007aff" }}>📷 FOTO ({Object.values(v.foto || {}).filter(f => f.tipo === "foto").length})</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: 8 }}>
                      {Object.entries(v.foto || {}).filter(([, f]) => f.tipo === "foto" && f.dataUrl).map(([k, f]) => (
                        <div key={k} style={{ position: "relative", width: 64, height: 48, borderRadius: 6, overflow: "hidden" }}>
                          <img src={f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          {f.categoria && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 6, textAlign: "center", padding: "1px" }}>{f.categoria}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {vanoStep > 0 && (
              <button onClick={() => setVanoStep(s => s - 1)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.text }}>← Indietro</button>
            )}
            {vanoStep < 2 && (
              <button onClick={() => setVanoStep(s => s + 1)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: step.color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>{vanoStep === 0 ? "Dettagli →" : "Riepilogo →"}</button>
            )}
            {vanoStep === 0 && (
              <button onClick={() => setVanoStep(2)} style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${T.grn}`, background: T.grn + "15", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF, color: T.grn }}>✓ Fine</button>
            )}
            {vanoStep === 2 && (
              <button onClick={() => { setVanoStep(0); goBack(); }} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>💾 SALVA TUTTO</button>
            )}
          </div>

          {/* === RIEPILOGO RAPIDO === */}
          <div style={{ marginTop: 12, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Riepilogo rapido</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[
                ["L", m.lCentro || m.lAlto || m.lBasso],
                ["H", m.hCentro || m.hSx || m.hDx],
                ["D1", m.d1], ["D2", m.d2],
                ["F.sq", fSq !== null ? `${fSq}` : null],
              ].map(([l, val]) => (
                <div key={l} style={{ padding: "3px 8px", borderRadius: 4, background: T.bg, fontSize: 10, fontFamily: FM, color: val ? T.text : T.sub2 }}>
                  {l}: {val || "—"}
                </div>
              ))}
            </div>
          </div>

          {/* === FAB QUICK EDIT PANEL === */}
          {detailOpen.fabOpen && <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 998 }} />}
          {detailOpen.fabOpen && (
            <div style={{ position: "fixed", bottom: 80, left: 12, right: 12, zIndex: 999, background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.25)", padding: "14px 16px", maxHeight: "75vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>⚡ Accesso rapido</span>
                <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{ padding: "4px 10px", borderRadius: 6, background: T.bg, fontSize: 11, color: T.sub, cursor: "pointer", fontWeight: 600 }}>✕ Chiudi</div>
              </div>

              {/* TIPOLOGIA — chips scroll */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 4 }}>🪟 Tipologia</div>
                <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {tipologieFiltrate.map(tp => (
                    <div key={tp.code} onClick={() => updateVanoField(v.id, "tipo", tp.code)} style={{
                      padding: "6px 10px", borderRadius: 8, flexShrink: 0, cursor: "pointer",
                      border: `1.5px solid ${v.tipo === tp.code ? "#ff9500" : T.bdr}`,
                      background: v.tipo === tp.code ? "#ff950015" : T.card,
                    }}>
                      <div style={{ fontSize: 14, textAlign: "center" }}>{tp.icon}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: v.tipo === tp.code ? "#ff9500" : T.sub, textAlign: "center", whiteSpace: "nowrap" }}>{tp.code}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SISTEMA + VETRO */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>⚙️ Sistema</div>
                  <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.sistema || ""} onChange={e => updateVanoField(v.id, "sistema", e.target.value)}>
                    <option value="">— Sistema —</option>
                    {sistemiDB.map(s => <option key={s.id} value={`${s.marca} ${s.sistema}`}>{s.marca} {s.sistema}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>🪟 Vetro</div>
                  <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.vetro || ""} onChange={e => updateVanoField(v.id, "vetro", e.target.value)}>
                    <option value="">— Vetro —</option>
                    {vetriDB.map(g => <option key={g.id} value={g.code}>{g.code}</option>)}
                  </select>
                </div>
              </div>

              {/* COLORI */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>🎨 Colore</div>
                  <div onClick={() => updateVanoField(v.id, "bicolore", !v.bicolore)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: v.bicolore ? T.accLt : T.bg, border: `1px solid ${v.bicolore ? T.acc : T.bdr}`, color: v.bicolore ? T.acc : T.sub, cursor: "pointer", fontWeight: 600 }}>
                    Bicolore {v.bicolore ? "✓" : ""}
                  </div>
                </div>
                {!v.bicolore ? (
                  <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.coloreInt || ""} onChange={e => updateVanoField(v.id, "coloreInt", e.target.value)}>
                    <option value="">— Colore —</option>
                    {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                  </select>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>INT</div>
                      <select style={{ ...S.select, fontSize: 11, padding: "7px" }} value={v.coloreInt || ""} onChange={e => updateVanoField(v.id, "coloreInt", e.target.value)}>
                        <option value="">—</option>
                        {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>EST</div>
                      <select style={{ ...S.select, fontSize: 11, padding: "7px" }} value={v.coloreEst || ""} onChange={e => updateVanoField(v.id, "coloreEst", e.target.value)}>
                        <option value="">—</option>
                        {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* COLORE ACCESSORI */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>🔩 Colore accessori</div>
                <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.coloreAcc || ""} onChange={e => updateVanoField(v.id, "coloreAcc", e.target.value)}>
                  <option value="">— Come profili —</option>
                  {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                </select>
              </div>

              {/* MISURE RAPIDE — L (tutte e 3) × H (tutte e 3) */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 4 }}>📏 Misure (mm) — compila L e H, inserisce Alto/Centro/Basso e Sx/Centro/Dx</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: "#507aff", marginBottom: 2, fontWeight: 700 }}>LARGHEZZA</div>
                    <input type="number" inputMode="numeric" style={{ ...S.input, fontSize: 16, fontFamily: FM, fontWeight: 700, textAlign: "center", padding: "10px", borderColor: "#507aff50" }} value={m.lCentro || ""} placeholder="L" onChange={e => { const val = parseInt(e.target.value) || 0; updateMisureBatch(v.id, { lAlto: val, lCentro: val, lBasso: val }); }} />
                    <div style={{ fontSize: 8, color: T.sub, marginTop: 2, textAlign: "center" }}>→ Alto · Centro · Basso</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", paddingTop: 8, fontSize: 18, color: T.sub, fontWeight: 300 }}>×</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: "#507aff", marginBottom: 2, fontWeight: 700 }}>ALTEZZA</div>
                    <input type="number" inputMode="numeric" style={{ ...S.input, fontSize: 16, fontFamily: FM, fontWeight: 700, textAlign: "center", padding: "10px", borderColor: "#507aff50" }} value={m.hCentro || ""} placeholder="H" onChange={e => { const val = parseInt(e.target.value) || 0; updateMisureBatch(v.id, { hSx: val, hCentro: val, hDx: val }); }} />
                    <div style={{ fontSize: 8, color: T.sub, marginTop: 2, textAlign: "center" }}>→ Sx · Centro · Dx</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 8 }}>
                    {m.lCentro > 0 && m.hCentro > 0 && (
                      <div style={{ fontSize: 13, color: T.grn, fontWeight: 800, fontFamily: FM }}>{((m.lCentro/1000)*(m.hCentro/1000)).toFixed(2)}</div>
                    )}
                    {m.lCentro > 0 && m.hCentro > 0 && (
                      <div style={{ fontSize: 8, color: T.grn, fontWeight: 600 }}>mq</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pezzi — chips 1-5 + input libero */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Pezzi:</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} onClick={() => updateVanoField(v.id, "pezzi", n)} style={{
                      width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, fontFamily: FM, cursor: "pointer",
                      background: (v.pezzi || 1) === n ? T.acc : T.bg,
                      color: (v.pezzi || 1) === n ? "#fff" : T.sub,
                      border: `1px solid ${(v.pezzi || 1) === n ? T.acc : T.bdr}`
                    }}>{n}</div>
                  ))}
                </div>
                <input type="number" inputMode="numeric" min="1" style={{
                  width: 48, padding: "4px 6px", fontSize: 13, fontFamily: FM, fontWeight: 700, textAlign: "center",
                  border: `1.5px solid ${(v.pezzi || 1) > 5 ? T.acc : T.bdr}`, borderRadius: 6,
                  color: (v.pezzi || 1) > 5 ? T.acc : T.text,
                  background: (v.pezzi || 1) > 5 ? T.accLt : T.bg
                }} value={v.pezzi || 1} onChange={e => updateVanoField(v.id, "pezzi", parseInt(e.target.value) || 1)} />
              </div>
            </div>
          )}
          <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: !d.fabOpen }))} style={{
            position: "fixed", bottom: 260, right: 20, zIndex: 999,
            width: 52, height: 52, borderRadius: "50%",
            background: detailOpen.fabOpen ? T.red : "linear-gradient(135deg, #34c759, #28a745)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px rgba(52,199,89,0.45)", cursor: "pointer",
            transition: "transform 0.2s, background 0.2s",
            transform: detailOpen.fabOpen ? "rotate(45deg)" : "none"
          }}>
            <span style={{ fontSize: 20, color: "#fff" }}>⚡</span>
          </div>

        </div>
      </div>
    );

}
