// ═══ MASTRO ERP — FasePanel (Phase B) ═══
import { useMastro } from "../../MastroContext";

export default function FasePanel({ c }: { c: any }) {
  const { T, S, Ico, setCantieri, cantieri, setSelectedCM, fasePanelOpen, setFasePanelOpen, faseIndex, PIPELINE } = useMastro();

    const fi = faseIndex(c.fase);
    const nextFase = PIPELINE[fi + 1];
    const fase = PIPELINE[fi];

    // Helper: aggiorna campo dentro la commessa selezionata
    const updateCM = (field, val) => {
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
      setSelectedCM(prev => ({ ...prev, [field]: val }));
    };
    const updateCMNested = (obj) => {
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, ...obj } : x));
      setSelectedCM(prev => ({ ...prev, ...obj }));
    };

    // Chip checklist riusabile
    const Chip = ({ label, done, onClick }) => (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
        borderRadius:8, border:`1.5px solid ${done ? T.grn : T.bdr}`, background: done ? T.grn+"12" : T.card,
        cursor:"pointer", marginBottom:6 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${done ? T.grn : T.bdr}`,
          background: done ? T.grn : "transparent", display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0 }}>
          {done && <span style={{fontSize:10,color:"white",fontWeight:800}}>✓</span>}
        </div>
        <span style={{fontSize:12, fontWeight:600, color: done ? T.grn : T.text}}>{label}</span>
      </div>
    );

    // Campo input riusabile — defaultValue+onBlur per evitare focus loss
    const Field = ({ label, field, placeholder, type="text" }) => (
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
        <input type={type} placeholder={placeholder||""} defaultValue={c[field]||""}
          key={`${c.id}-${field}`}
          onBlur={e => { const v = e.target.value; if (v !== (c[field]||"")) updateCM(field, v); }}
          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.bdr}`,
            background:T.card,fontSize:13,color:T.text,fontFamily:FF,boxSizing:"border-box"}}/>
      </div>
    );

    const panelStyle = {
      margin:"0 16px 12px", borderRadius:12, border:`1.5px solid ${fase?.color}30`,
      background:T.card, overflow:"hidden"
    };
    const headerStyle = {
      padding:"10px 14px", background:fase?.color+"15", borderBottom:`1px solid ${fase?.color}25`,
      display:"flex", alignItems:"center", gap:8
    };

    // Toggle accordion per id fase
    const isOpen = (id) => fasePanelOpen[id] !== false; // default aperto
    const togglePanel = (id) => setFasePanelOpen(s => ({...s, [id]: !isOpen(id)}));

    // Wrapper accordion semplice — stessa UI di prima, solo con toggle
    const FasePanel = ({ id, children, taskNonFatti = 0 }) => (
      <div style={panelStyle}>
        <div onClick={() => togglePanel(id)} style={{ ...headerStyle, cursor:"pointer",
          borderBottom: isOpen(id) ? `1px solid ${fase?.color}25` : "none", userSelect:"none" }}>
          {/* Contenuto header originale passato come primo child */}
          <div style={{display:"flex",alignItems:"center",gap:8,flex:1,pointerEvents:"none"}}>
            {(children as any[])[0]}
          </div>
          {/* Badge alert se task non completati */}
          {taskNonFatti > 0 && (
            <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6,flexShrink:0}}/>
          )}
          <span style={{fontSize:13,color:T.sub,transform:isOpen(id)?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s",flexShrink:0}}>▾</span>
        </div>
        {isOpen(id) && (
          <div style={{padding:"12px 14px"}}>
            {(children as any[]).slice(1)}
          </div>
        )}
      </div>
    );

    // === SOPRALLUOGO ===
    if (c.fase === "sopralluogo") {
      const vaniAttivi2 = getVaniAttivi(c); const vaniCompletati = vaniAttivi2.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
      const tuttiCompletati = vaniCompletati === vaniAttivi2.length && vaniAttivi2.length > 0;
      const ndone = [!c.ck_foto, !c.ck_accesso, !c.ck_riepilogo_inviato, !tuttiCompletati].filter(Boolean).length;
      const open_sopr = fasePanelOpen["sopralluogo"] !== false;
      return (
        <div style={panelStyle}>
          <div onClick={()=>togglePanel("sopralluogo")} style={{...headerStyle,cursor:"pointer",borderBottom:open_sopr?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
            <span style={{fontSize:16}}>🔍</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Sopralluogo</span>
            <span style={{fontSize:11,fontWeight:700,color:tuttiCompletati?T.grn:T.orange,marginRight:4}}>{vaniCompletati}/{vaniAttivi2.length} vani ✓</span>
            {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
            <span style={{fontSize:13,color:T.sub,transform:open_sopr?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
          </div>
          {open_sopr && <div style={{padding:"12px 14px"}}>
            <Chip label="Fotografie scattate" done={c.ck_foto} onClick={()=>updateCM("ck_foto",!c.ck_foto)}/>
            <Chip label="Difficoltà accesso rilevata" done={c.ck_accesso} onClick={()=>updateCM("ck_accesso",!c.ck_accesso)}/>
            <Chip label="Riepilogo inviato al cliente" done={c.ck_riepilogo_inviato} onClick={()=>updateCM("ck_riepilogo_inviato",!c.ck_riepilogo_inviato)}/>
            <Chip label={`Tutte le misure inserite (${vaniCompletati}/${vaniAttivi2.length})`} done={tuttiCompletati} onClick={()=>{}}/>
            <Field label="Data sopralluogo" field="dataSopralluogo" type="date"/>
            <Field label="Note sopralluogo" field="noteSopralluogo" placeholder="Annotazioni rapide..."/>
            {tuttiCompletati && (
              <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:T.grn+"15",border:`1px solid ${T.grn}30`,fontSize:12,color:T.grn,fontWeight:600,textAlign:"center"}}>
                ✅ Pronto per il preventivo
              </div>
            )}
          </div>}
        </div>
      );
    }

    // === PREVENTIVO ===
    if (c.fase === "preventivo") {
      const vaniCalc = getVaniAttivi(c); const totale = vaniCalc.reduce((sum, v) => sum + calcolaVanoPrezzo(v, c), 0);
      const iva = totale * 0.1;
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}>📋</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Preventivo</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <Field label="Prezzo base €/mq" field="prezzoMq" placeholder="350" type="number"/>
            <Field label="Sconto %" field="sconto" placeholder="0" type="number"/>
            <Field label="Note preventivo" field="notePreventivo" placeholder="Condizioni, garanzie..."/>
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.bdr}`,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                <span>Totale imponibile</span><span style={{fontWeight:700,color:T.text}}>€ {totale.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                <span>IVA 10%</span><span>€ {iva.toFixed(2)}</span>
              </div>
              {c.sconto > 0 && (
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.orange,marginBottom:4}}>
                  <span>Sconto {c.sconto}%</span><span>- € {(totale * c.sconto/100).toFixed(2)}</span>
                </div>
              )}
              <div style={{borderTop:`1px solid ${T.bdr}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800}}>
                <span>TOTALE IVA inclusa</span>
                <span style={{color:T.acc}}>€ {(totale + iva - (totale*(c.sconto||0)/100)).toFixed(2)}</span>
              </div>
            </div>
            <Chip label="Preventivo inviato al cliente" done={c.ck_prev_inviato} onClick={()=>updateCM("ck_prev_inviato",!c.ck_prev_inviato)}/>
            <Chip label="Cliente ha accettato verbalmente" done={c.ck_prev_accettato} onClick={()=>updateCM("ck_prev_accettato",!c.ck_prev_accettato)}/>
          </div>
        </div>
      );
    }

    // === CONFERMA ===
    if (c.fase === "conferma") {
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}>✍️</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Conferma Ordine</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <Field label="Data conferma" field="dataConferma" type="date"/>
            <Field label="Acconto ricevuto €" field="accontoRicevuto" placeholder="0" type="number"/>
            <Field label="Metodo pagamento" field="metodoPagamento" placeholder="Bonifico / Contanti / Carta..."/>
            <Field label="Data prevista posa" field="dataPosaPrevista" type="date"/>
            <Chip label="Contratto firmato" done={c.ck_contratto} onClick={()=>updateCM("ck_contratto",!c.ck_contratto)}/>
            <Chip label="Acconto incassato" done={c.ck_acconto_inc} onClick={()=>updateCM("ck_acconto_inc",!c.ck_acconto_inc)}/>
            <Chip label="Data posa concordata" done={c.ck_data_posa} onClick={()=>updateCM("ck_data_posa",!c.ck_data_posa)}/>
          </div>
        </div>
      );
    }

    // === MISURE ===
    if (c.fase === "misure") {
      const vaniCalc = getVaniAttivi(c);
      const vaniOk = vaniCalc.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 9).length;
      return (
        (() => {
          const ndone = [!c.ck_misure_ok,!c.ck_diag_ok,!c.ck_pdf_prod,!c.ck_sistema_ok].filter(Boolean).length;
          const open = fasePanelOpen["misure"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("misure")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>📐</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Rilievo Misure Definitivo</span>
                <span style={{fontSize:11,fontWeight:700,color:vaniOk===vaniCalc.length?T.grn:T.orange,marginRight:4}}>{vaniOk}/{vaniCalc.length}</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Chip label="Tutte le misure verificate" done={c.ck_misure_ok} onClick={()=>updateCM("ck_misure_ok",!c.ck_misure_ok)}/>
                <Chip label="Diagonali controllate" done={c.ck_diag_ok} onClick={()=>updateCM("ck_diag_ok",!c.ck_diag_ok)}/>
                <Chip label="Riepilogo PDF inviato a produzione" done={c.ck_pdf_prod} onClick={()=>updateCM("ck_pdf_prod",!c.ck_pdf_prod)}/>
                <Chip label="Conferma sistema/colori approvata" done={c.ck_sistema_ok} onClick={()=>updateCM("ck_sistema_ok",!c.ck_sistema_ok)}/>
                <Field label="Tecnico misuratore" field="tecnicoMisure" placeholder="Nome tecnico..."/>
                <Field label="Data rilievo definitivo" field="dataRilievo" type="date"/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === ORDINI ===
    if (c.fase === "ordini") {
      return (
        (() => {
          const ndone = [!c.ck_ordine_inviato,!c.ck_ordine_confermato,!c.ck_cliente_avvisato].filter(Boolean).length;
          const open = fasePanelOpen["ordini"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("ordini")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>📦</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Ordini Fornitore</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Fornitore" field="fornitore" placeholder="Es. Schüco, Rehau..."/>
                <Field label="N° Ordine fornitore" field="numOrdine" placeholder="ORD-2026-XXXX"/>
                <Field label="Data ordine" field="dataOrdine" type="date"/>
                <Field label="Data consegna prevista" field="dataConsegna" type="date"/>
                <Chip label="Ordine inviato" done={c.ck_ordine_inviato} onClick={()=>updateCM("ck_ordine_inviato",!c.ck_ordine_inviato)}/>
                <Chip label="Conferma ricezione da fornitore" done={c.ck_ordine_confermato} onClick={()=>updateCM("ck_ordine_confermato",!c.ck_ordine_confermato)}/>
                <Chip label="Materiale in arrivo comunicato al cliente" done={c.ck_cliente_avvisato} onClick={()=>updateCM("ck_cliente_avvisato",!c.ck_cliente_avvisato)}/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === PRODUZIONE ===
    if (c.fase === "produzione") {
      return (
        (() => {
          const ndone = [!c.ck_mat_ricevuto,!c.ck_colori_ok,!c.ck_accessori_ok,!c.ck_posa_confermata].filter(Boolean).length;
          const open = fasePanelOpen["produzione"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("produzione")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>🏭</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Produzione</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Data consegna in magazzino" field="dataInMagazzino" type="date"/>
                <Chip label="Materiale ricevuto e controllato" done={c.ck_mat_ricevuto} onClick={()=>updateCM("ck_mat_ricevuto",!c.ck_mat_ricevuto)}/>
                <Chip label="Colori verificati" done={c.ck_colori_ok} onClick={()=>updateCM("ck_colori_ok",!c.ck_colori_ok)}/>
                <Chip label="Accessori completi (maniglie, guarnizioni)" done={c.ck_accessori_ok} onClick={()=>updateCM("ck_accessori_ok",!c.ck_accessori_ok)}/>
                <Chip label="Data posa confermata al cliente" done={c.ck_posa_confermata} onClick={()=>updateCM("ck_posa_confermata",!c.ck_posa_confermata)}/>
                <Field label="Note magazzino" field="noteMagazzino" placeholder="Anomalie, sostituzioni..."/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === POSA ===
    if (c.fase === "posa") {
      return (
        (() => {
          const ndone = [!c.ck_posati,!c.ck_finiture,!c.ck_pulizia,!c.ck_test,!c.ck_foto_posa,!c.ck_cliente_ok].filter(Boolean).length;
          const open = fasePanelOpen["posa"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("posa")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}>🔧</span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Posa in Opera</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>▾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Data posa effettiva" field="dataPosa" type="date"/>
                <Field label="Squadra posatori" field="squadraPosa" placeholder="Marco + Luigi..."/>
                <Chip label="Tutti i vani posati" done={c.ck_posati} onClick={()=>updateCM("ck_posati",!c.ck_posati)}/>
                <Chip label="Sigillature e finiture completate" done={c.ck_finiture} onClick={()=>updateCM("ck_finiture",!c.ck_finiture)}/>
                <Chip label="Pulizia cantiere" done={c.ck_pulizia} onClick={()=>updateCM("ck_pulizia",!c.ck_pulizia)}/>
                <Chip label="Test funzionamento maniglie/chiusure" done={c.ck_test} onClick={()=>updateCM("ck_test",!c.ck_test)}/>
                <Chip label="Foto lavoro completato scattate" done={c.ck_foto_posa} onClick={()=>updateCM("ck_foto_posa",!c.ck_foto_posa)}/>
                <Chip label="Cliente presente e soddisfatto" done={c.ck_cliente_ok} onClick={()=>updateCM("ck_cliente_ok",!c.ck_cliente_ok)}/>
                <Field label="Note posa" field="notePosa" placeholder="Problemi riscontrati, extra..."/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === CHIUSURA ===
    if (c.fase === "chiusura") {
      const vaniCalc2 = getVaniAttivi(c); const totale = vaniCalc2.reduce((sum, v) => {
        const m = v.misure||{};
        const mq = ((m.lCentro||0)/1000) * ((m.hCentro||0)/1000);
        return sum + mq * parseFloat(c.prezzoMq||350);
      }, 0);
      const iva = totale * 0.1;
      const totIva = totale + iva - (totale*(c.sconto||0)/100);
      const saldo = totIva - parseFloat(c.accontoRicevuto||0);
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}>✅</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Chiusura Commessa</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.bdr}`,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:T.sub}}>Totale commessa</span><span style={{fontWeight:700}}>€ {totIva.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:T.sub}}>Acconto ricevuto</span><span style={{color:T.grn,fontWeight:700}}>- € {parseFloat(c.accontoRicevuto||0).toFixed(2)}</span>
              </div>
              <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:6,marginTop:2,display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800}}>
                <span>Saldo da incassare</span><span style={{color:saldo>0?T.red:T.grn}}>€ {saldo.toFixed(2)}</span>
              </div>
            </div>
            <Field label="Data chiusura" field="dataChiusura" type="date"/>
            <Field label="Saldo incassato €" field="saldoIncassato" placeholder="0" type="number"/>
            <Field label="Metodo saldo" field="metodoSaldo" placeholder="Bonifico / Contanti..."/>
            <Chip label="Saldo incassato" done={c.ck_saldo} onClick={()=>updateCM("ck_saldo",!c.ck_saldo)}/>
            <Chip label="Fattura emessa" done={c.ck_fattura} onClick={()=>updateCM("ck_fattura",!c.ck_fattura)}/>
            <Chip label="Garanzia consegnata al cliente" done={c.ck_garanzia} onClick={()=>updateCM("ck_garanzia",!c.ck_garanzia)}/>
            <Chip label="Scheda commessa archiviata" done={c.ck_archiviata} onClick={()=>updateCM("ck_archiviata",!c.ck_archiviata)}/>
            {c.ck_saldo && c.ck_fattura && (
              <div style={{marginTop:8,padding:"12px",borderRadius:8,background:T.grn+"15",border:`1px solid ${T.grn}30`,textAlign:"center"}}>
                <div style={{fontSize:22}}>🎉</div>
                <div style={{fontSize:13,fontWeight:800,color:T.grn,marginTop:4}}>Commessa completata!</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>{c.code} · {c.cliente} {c.cognome||""}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
}
