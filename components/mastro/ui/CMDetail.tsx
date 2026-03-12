// ═══ MASTRO ERP — CMDetail (Phase B) ═══
import { useMastro } from "../../MastroContext";

export default function CMDetail() {
  const { T, S, Ico, SectionHead, cmSubTab, setCmSubTab, nvView, setNvView, nvStep, setNvStep, nvData, setNvData, nvTipo, setNvTipo, nvMotivoModifica, setNvMotivoModifica, nvVani, setNvVani, nvBlocchi, setNvBlocchi, nvNote, setNvNote, cantieri, setCantieri, problemi, setShowProblemaModal, setProblemaForm, setShowProblemiView, setShowPreventivoModal, fattureDB, setFattureDB, ordiniFornDB, setOrdiniFornDB, squadreDB, montaggiDB, setMontaggiDB, montFormOpen, setMontFormOpen, montFormData, setMontFormData, ccConfirm, setCcConfirm, ccDone, setCcDone, firmaStep, setFirmaStep, firmaFileUrl, setFirmaFileUrl, firmaFileName, setFirmaFileName, fattPerc, setFattPerc, montGiorni, setMontGiorni, selectedCM, setSelectedCM, selectedRilievo, setSelectedRilievo, setSelectedVano, setShowModal, setShowRiepilogo, setVanoStep, setEvents, setShowAllegatiModal, setAllegatiText, playingId, playProgress, viewingVideoId, setViewingVideoId, viewingPhotoId, setViewingPhotoId, isTablet, isDesktop, renderCMCard } = useMastro();

    const c = selectedCM;
    const r = selectedRilievo; // rilievo corrente
    const fase = PIPELINE.find(p => p.id === c.fase);

    // Vani del rilievo corrente
    const vaniList = r?.vani || [];
    // Compatibilità wizard vecchio
    const viste = []; // non più usato con nuova arch
    const vaniM: number[] = [];
    const vaniA = vaniList;
    const tipoRil = r?.tipo || "rilievo";
    const tipoColRil = tipoRil === "definitiva" ? T.grn : tipoRil === "modifica" ? T.orange : T.blue;
    const tipoIcoRil = tipoRil === "definitiva" ? "✅" : tipoRil === "modifica" ? "🔧" : "📐";
    const tipoLblRil = tipoRil === "definitiva" ? "Misure Definitive" : tipoRil === "modifica" ? "Modifica" : "Rilievo Misure";

    // Calcolo avanzamento misure
    const vaniMisurati = vaniList.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6);
    const vaniBloccati = vaniList.filter(v => v.note?.startsWith("🔴 BLOCCATO"));
    const vaniDaFare   = vaniList.filter(v => vaniMisurati.every(m => m.id !== v.id));
    const progVani = vaniList.length > 0 ? Math.round(vaniMisurati.length / vaniList.length * 100) : 0;
    const tutteMis = vaniMisurati.length === vaniList.length && vaniList.length > 0;

    // == Wizard helpers (legacy) ==
    function togV(id) { setNvVani(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
    function togB(id) {
      setNvBlocchi(b => b[id]
        ? (()=>{ const n = {...b}; delete n[id]; return n; })()
        : { ...b, [id]: { motivo: "", note: "" } }
      );
    }
    function sbF(id, f, v) { setNvBlocchi(b => ({ ...b, [id]: { ...b[id], [f]: v } })); }
    function salvaVisita() {
      const vaniBloccati = Object.entries(nvBlocchi).map(([id, b]) => ({
        vanoId: parseInt(id), motivo: b.motivo || "Altro", note: b.note || ""
      }));
      const stato = nvTipo === "modifica" ? "modifica" :
        nvVani.length === vaniA.length && vaniBloccati.length === 0 ? "completo" : "parziale";
      const nuova = {
        id: Date.now(), n: viste.length + 1,
        data: nvData.data || new Date().toISOString().split("T")[0],
        ora: nvData.ora || "", rilevatore: nvData.rilevatore || "",
        tipo: nvTipo, motivoModifica: nvMotivoModifica,
        stato, vaniMisurati: nvVani.map(Number), vaniBloccati, note: nvNote
      };
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, visite: [...(x.visite||[]), nuova] } : x));
      setSelectedCM(prev => ({ ...prev, visite: [...(prev.visite||[]), nuova] }));
      setNvView(false); setNvStep(1);
      setNvData({ data: "", ora: "", rilevatore: "" });
      setNvTipo("rilievo"); setNvMotivoModifica("");
      setNvVani([]); setNvBlocchi({}); setNvNote("");
    }

    // == VISTA WIZARD ==
    if (nvView) return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header wizard */}
        <div style={{ ...S.header }}>
          <div onClick={() => { setNvView(false); setNvStep(1); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Nuova visita</div>
            <div style={S.headerSub}>{c.code} · {c.cliente}</div>
          </div>
          <div style={{ fontSize: 11, color: T.sub }}>Step {nvStep}/5</div>
        </div>
        {/* Tab step */}
        <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          {["Tipo", "Dati", "Vani", "Blocchi", "Salva"].map((l, i) => (
            <div key={i} onClick={() => i < nvStep && setNvStep(i+1)}
              style={{ flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 10, fontWeight: 600,
                borderBottom: `2px solid ${nvStep===i+1 ? T.acc : "transparent"}`,
                color: nvStep===i+1 ? T.acc : T.sub, cursor: i < nvStep ? "pointer" : "default" }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ padding: "16px" }}>
          {/* STEP 1 — Tipo visita */}
          {nvStep === 1 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>🏷 Tipo di visita</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Seleziona il tipo di sopralluogo</div>
            {[
              { k: "rilievo",    ico: "📐", label: "Rilievo misure",     desc: "Prima visita o misure di vani mancanti" },
              { k: "definitiva", ico: "✅", label: "Misure definitive",  desc: "Conferma finale di tutte le misure" },
              { k: "modifica",   ico: "🔧", label: "Modifica cantiere",  desc: "Variazione, problema o sopralluogo post-vendita" },
            ].map(t => (
              <div key={t.k} onClick={() => setNvTipo(t.k)}
                style={{ ...S.card, padding: "13px 14px", marginBottom: 10, cursor: "pointer",
                  border: `1.5px solid ${nvTipo === t.k ? T.acc : T.bdr}`,
                  background: nvTipo === t.k ? T.accLt : T.card,
                  display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>{t.ico}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: nvTipo === t.k ? T.acc : T.text }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{t.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${nvTipo === t.k ? T.acc : T.bdr}`,
                  background: nvTipo === t.k ? T.acc : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12 }}>{nvTipo === t.k ? "✓" : ""}</div>
              </div>
            ))}
            {nvTipo === "modifica" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>MOTIVO MODIFICA</div>
                <input style={S.input} placeholder="Es: cliente ha cambiato idea su un vano, problema rilevato..." value={nvMotivoModifica} onChange={e => setNvMotivoModifica(e.target.value)} />
              </div>
            )}
            <button onClick={() => setNvStep(2)} style={{ ...S.btn, marginTop: 12, width: "100%" }}>Avanti →</button>
          </>}
          {/* STEP 2 — Dati */}
          {nvStep === 2 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📋 Dati della visita</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>DATA</div>
                <input style={S.input} type="date" value={nvData.data} onChange={e => setNvData(d => ({...d, data: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>ORA</div>
                <input style={S.input} type="time" value={nvData.ora} onChange={e => setNvData(d => ({...d, ora: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>RILEVATORE</div>
                <input style={S.input} placeholder="Chi ha eseguito il rilievo..." value={nvData.rilevatore} onChange={e => setNvData(d => ({...d, rilevatore: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={() => setNvStep(1)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(3)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 2 — Vani misurati */}
          {nvStep === 3 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>✅ Vani misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Seleziona i vani che hai misurato</div>
            {vaniA.length === 0
              ? <div style={{ textAlign: "center", padding: "20px", color: T.sub }}>Tutti già misurati!</div>
              : vaniA.map(v => (
                <div key={v.id} onClick={() => togV(v.id)} style={{
                  ...S.card, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                  border: `1.5px solid ${nvVani.includes(v.id) ? T.grn : T.bdr}`,
                  background: nvVani.includes(v.id) ? T.grnLt : T.card,
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>~{v.mq}m²</div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: 6,
                    border: `2px solid ${nvVani.includes(v.id) ? T.grn : T.bdr}`,
                    background: nvVani.includes(v.id) ? T.grn : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14 }}>
                    {nvVani.includes(v.id) ? "✓" : ""}
                  </div>
                </div>
              ))
            }
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setNvStep(2)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(4)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 4 — Vani bloccati */}
          {nvStep === 4 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>🔴 Vani non misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Indica il motivo per ogni vano saltato</div>
            {vaniA.filter(v => !nvVani.includes(v.id)).map(v => {
              const hB = !!nvBlocchi[v.id];
              return (
                <div key={v.id} style={{ ...S.card, marginBottom: 10, overflow: "hidden", border: `1.5px solid ${hB ? T.red : T.bdr}` }}>
                  <div onClick={() => togB(v.id)} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: hB ? T.redLt : T.card }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{hB ? "Indica motivo" : "Tocca per segnare bloccato"}</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${hB ? T.red : T.bdr}`, background: hB ? T.red : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>
                      {hB ? "✓" : ""}
                    </div>
                  </div>
                  {hB && (
                    <div style={{ padding: "0 14px 12px", background: T.redLt }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8, paddingTop: 8 }}>
                        {MOTIVI_BLOCCO.map(m => (
                          <div key={m} onClick={() => sbF(v.id, "motivo", m)} style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                            background: nvBlocchi[v.id]?.motivo === m ? T.red : T.card,
                            border: `1.5px solid ${nvBlocchi[v.id]?.motivo === m ? T.red : T.bdr}`,
                            color: nvBlocchi[v.id]?.motivo === m ? "#fff" : T.sub
                          }}>{m}</div>
                        ))}
                      </div>
                      <input style={S.input} placeholder="Note aggiuntive..." value={nvBlocchi[v.id]?.note || ""} onChange={e => sbF(v.id, "note", e.target.value)} />
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>NOTE GENERALI</div>
              <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} placeholder="Osservazioni sull'intera visita..." value={nvNote} onChange={e => setNvNote(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setNvStep(3)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(5)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 5 — Riepilogo */}
          {nvStep === 5 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>📋 Riepilogo</div>
            <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.sub }}>📅 {nvData.data ? new Date(nvData.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : "—"} · 🕐 {nvData.ora || "--:--"}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>👤 {nvData.rilevatore || "Non specificato"}</div>
            </div>
            {nvVani.length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.grn}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.grn, marginBottom: 7 }}>✅ Misurati</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {nvVani.map(id => { const v = vaniA.find(x => x.id === id); return <span key={id} style={S.badge(T.grnLt, T.grn)}>{v?.nome}</span>; })}
                </div>
              </div>
            )}
            {Object.keys(nvBlocchi).length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.red}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 7 }}>🔴 Bloccati</div>
                {Object.entries(nvBlocchi).map(([id, b]) => {
                  const v = vaniA.find(x => x.id === parseInt(id));
                  return <div key={id} style={{ fontSize: 11, marginBottom: 4 }}><strong>{v?.nome}</strong>: {b.motivo || "—"}{b.note && ` — ${b.note}`}</div>;
                })}
              </div>
            )}
            {nvNote && <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, fontStyle: "italic", fontSize: 11, color: T.sub }}>"{nvNote}"</div>}
            <div style={{ ...S.card, padding: "10px 14px", marginBottom: 10, background: T.accLt, border: `1px solid ${T.acc}30` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Tipo visita</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc }}>
                {nvTipo === "rilievo" ? "📐 Rilievo misure" : nvTipo === "definitiva" ? "✅ Misure definitive" : "🔧 Modifica cantiere"}
              </div>
              {nvTipo === "modifica" && nvMotivoModifica && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{nvMotivoModifica}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setNvStep(4)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Modifica</button>
              <button onClick={salvaVisita} style={{ ...S.btn, flex: 2, background: T.grn }}>✓ Salva visita</button>
            </div>
          </>}
        </div>
      </div>
    );

    // == VISTA RILIEVO CON VANI ==
    return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header rilievo */}
        <div style={{ ...S.header }}>
          <div onClick={() => { setSelectedRilievo(null); setCmSubTab("rilievi"); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>{tipoIcoRil}</span>
              <div style={S.headerTitle}>{tipoLblRil} — R{r?.n}</div>
            </div>
            <div style={S.headerSub}>{c.code} · {c.cliente} {c.cognome || ""} · {r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) : ""}</div>
          </div>
          {vaniList.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tipoColRil }}>{progVani}%</div>
              <div style={{ fontSize: 10, color: T.sub }}>{vaniMisurati.length}/{vaniList.length} vani</div>
            </div>
          )}
          <div onClick={() => setShowRiepilogo(true)} style={{ padding: "6px 10px", borderRadius: 6, background: T.accLt, cursor: "pointer", marginLeft: 6 }}>
            <span style={{ fontSize: 14 }}>📋</span>
          </div>
          <div onClick={exportPDF} style={{ padding: "6px 10px", borderRadius: 6, background: T.redLt, cursor: "pointer" }}>
            <Ico d={ICO.file} s={16} c={T.red} />
          </div>
        </div>

        {/* Banner rilievo info */}
        {r?.motivoModifica && (
          <div style={{ margin: "4px 16px 0", padding: "8px 12px", background: T.orangeLt, borderRadius: 8, border: `1px solid ${T.orange}30`, fontSize: 12, color: T.orange }}>
            🔧 <strong>Modifica:</strong> {r.motivoModifica}
          </div>
        )}

        {/* Barra progresso vani */}
        {vaniList.length > 0 && (
          <div style={{ padding: "8px 16px" }}>
            <div style={{ height: 5, background: T.bdr, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${progVani}%`, background: progVani === 100 ? T.grn : tipoColRil, borderRadius: 3 }} />
            </div>
            {vaniDaFare.filter(v => !v.note?.startsWith("🔴")).length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Mancano misure: {vaniDaFare.filter(v => !v.note?.startsWith("🔴")).map(v => v.nome).join(", ")}</div>}
            {tutteMis && <div style={{ fontSize: 11, color: T.grn, fontWeight: 600 }}>✅ Tutte le misure raccolte</div>}
          </div>
        )}

        {/* Info badges */}
        <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}>🔧 Riparazione</span>}
          {c.tipo === "nuova" && <span style={S.badge(T.grnLt, T.grn)}>🆕 Nuova</span>}
          {c.sistema && <span style={S.badge(T.blueLt, T.blue)}>{c.sistema}</span>}
          {c.difficoltaSalita && <span style={S.badge(c.difficoltaSalita === "facile" ? T.grnLt : c.difficoltaSalita === "media" ? T.orangeLt : T.redLt, c.difficoltaSalita === "facile" ? T.grn : c.difficoltaSalita === "media" ? T.orange : T.red)}>Salita: {c.difficoltaSalita}</span>}
          {c.mezzoSalita && <span style={S.badge(T.purpleLt, T.purple)}>🪜 {c.mezzoSalita}</span>}
          {c.pianoEdificio && <span style={S.badge(T.blueLt, T.blue)}>Piano: {c.pianoEdificio}</span>}
          {c.foroScale && <span style={S.badge(T.redLt, T.red)}>Foro: {c.foroScale}</span>}
          {c.telefono && <span onClick={() => window.location.href=`tel:${c.telefono}`} style={{ ...S.badge(T.grnLt, T.grn), cursor: "pointer" }}>📞 {c.telefono}</span>}
        </div>
        {c.note && <div style={{ padding: "0 16px", marginBottom: 6 }}><div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.sub, lineHeight: 1.4 }}>📝 {c.note}</div></div>}

        {/* Centro Comando inline — replaces old phase panels */}
        {(() => {
          const vaniCC = getVaniAttivi(c);
          const rilieviCC = c.rilievi || [];
          const vaniConPrezzoCC = vaniCC.filter(v => calcolaVanoPrezzo(v, c) > 0);
          const totVaniCC = vaniCC.reduce((s, v) => s + calcolaVanoPrezzo(v, c), 0);
          const totVociCC = (c.vociLibere || []).reduce((s, vl) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
          const totPrevCC = totVaniCC + totVociCC;
          const ivaPercCC = c.ivaPerc || 10;
          const totIvaCC = totPrevCC * (1 + ivaPercCC / 100);
          const hasFirmaCC = !!c.firmaCliente;
          const fattCC = fattureDB.filter(f => f.cmId === c.id);
          const hasFattCC = fattCC.some(f => f.tipo === "acconto" || f.tipo === "unica");
          const ordCC = ordiniFornDB.filter(o => o.cmId === c.id);
          const hasOrdCC = ordCC.length > 0;
          const ordConfCC = ordCC.some(o => o.conferma?.ricevuta);
          const confFirmCC = ordCC.some(o => o.conferma?.firmata);
          const montCC = montaggiDB.filter(m => m.cmId === c.id);
          const hasMontCC = montCC.length > 0;
          const hasSaldoCC = fattCC.some(f => f.tipo === "saldo");
          const saldoPagCC = fattCC.find(f => f.tipo === "saldo")?.pagata;
          const unicaPagCC = fattCC.find(f => f.tipo === "unica")?.pagata;
          const tuttoCC = (hasSaldoCC && saldoPagCC) || (fattCC.some(f => f.tipo === "unica") && unicaPagCC) || (cm.fase === "chiusura" && incassatoCC >= totIvaCC) || (incassatoCC >= totIvaCC && fattCC.length > 0 && fattCC.every(f => f.pagata));
          const incassatoCC = fattCC.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
          const fmtCC = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";

          const stepsCC = [
            { id: "rilievo", icon: "📐", l: "Rilievo", done: rilieviCC.length > 0 },
            { id: "misure", icon: "📏", l: "Preventivo", done: vaniCC.length > 0 && vaniConPrezzoCC.length > 0 },
            { id: "firma", icon: "✍️", l: "Firma", done: hasFirmaCC },
            { id: "fattura", icon: "💰", l: "Fattura", done: hasFattCC },
            { id: "ordine", icon: "📦", l: "Ordine", done: hasOrdCC },
            { id: "conferma", icon: "📄", l: "Conferma", done: confFirmCC },
            { id: "montaggio", icon: "🔧", l: "Montaggio", done: hasMontCC },
            { id: "saldo", icon: "💶", l: "Chiusura", done: tuttoCC },
          ];
          const doneCC = stepsCC.filter(s => s.done).length;
          const curIdxCC = stepsCC.findIndex(s => !s.done);
          const curCC = curIdxCC >= 0 ? stepsCC[curIdxCC] : null;
          const progCC = Math.round((doneCC / stepsCC.length) * 100);

          return (
            <div style={{ margin: "8px 16px 4px" }}>
              {/* Progress dots */}
              <div style={{ display: "flex", gap: 3, marginBottom: 6, justifyContent: "center" }}>
                {stepsCC.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
                      background: s.done ? "#34c759" : i === curIdxCC ? T.acc : T.bg,
                      color: s.done || i === curIdxCC ? "#fff" : T.sub, fontWeight: 700,
                    }}>{s.done ? "✓" : s.icon}</div>
                    {i < stepsCC.length - 1 && <div style={{ width: 8, height: 2, background: s.done ? "#34c759" : T.bdr }} />}
                  </div>
                ))}
              </div>
              {/* Current action */}
              {curCC && (
                <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{curCC.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: T.text, flex: 1 }}>{curCC.l}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>{doneCC}/{stepsCC.length}</span>
                  </div>
                  {/* Success flash */}
                  {ccDone && <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#34c75918", border: "1px solid #34c75940", fontSize: 12, fontWeight: 700, color: "#34c759", textAlign: "center" }}>{ccDone}</div>}
                  {/* FIRMA */}
                  {curCC.id === "firma" && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>€{fmtCC(totPrevCC)} + IVA = €{fmtCC(totIvaCC)}</div>
                      {firmaStep === 0 ? (
                        <div>
                          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                            <button onClick={() => generaPreventivoPDF(c)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📄 PDF</button>
                            <button onClick={() => setShowPreventivoModal(true)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>👁 Anteprima</button>
                          </div>
                          <button onClick={() => {
                            const tel = (c.telefono || "").replace(/\D/g, "");
                            window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${encodeURIComponent(`Gentile ${c.cliente}, in allegato il preventivo. Totale: €${fmtCC(totIvaCC)} IVA inclusa. Prego firmare e rinviare.`)}`, "_blank");
                            setFirmaStep(1);
                          }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#25d366", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>📤 INVIA AL CLIENTE →</button>
                          <div style={{ textAlign: "center", marginTop: 4 }}><span onClick={() => setFirmaStep(1)} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Già inviato?</span></div>
                        </div>
                      ) : !firmaFileUrl ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Carica il documento firmato</div>
                          <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/pdf,image/*"; inp.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (!f) return; setFirmaFileName(f.name); const r = new FileReader(); r.onload = (e) => setFirmaFileUrl(e.target?.result as string); r.readAsDataURL(f); }; inp.click(); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: `2px dashed ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>📥 CARICA FIRMATO</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ padding: 8, borderRadius: 8, background: "#34c75912", marginBottom: 6, fontSize: 11, color: "#34c759", fontWeight: 700 }}>📎 {firmaFileName} <span onClick={() => { setFirmaFileUrl(null); setFirmaFileName(""); }} style={{ cursor: "pointer", marginLeft: 6 }}>✕</span></div>
                          <button onClick={() => {
                            const all = { id: Date.now(), tipo: "firma", nome: firmaFileName, dataUrl: firmaFileUrl };
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0], firmaDocumento: all, allegati: [...(cm.allegati || []), all] } : cm));
                            setSelectedCM(prev => ({ ...prev, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0] }));
                            setFirmaStep(0); setFirmaFileUrl(null); setFirmaFileName("");
                            setCcDone("✅ Firma registrata!"); setTimeout(() => setCcDone(null), 3000);
                          }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CONFERMA FIRMA →</button>
                        </div>
                      )}
                    </div>
                  )}
                  {/* FATTURA */}
                  {curCC.id === "fattura" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Totale: €{fmtCC(totIvaCC)}</div>
                      <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" as any }}>
                        {[30, 40, 50, 60, 100].map(p => (
                          <div key={p} onClick={() => setFattPerc(p)} style={{ padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 800, background: fattPerc === p ? T.acc : T.card, color: fattPerc === p ? "#fff" : T.text, border: `2px solid ${fattPerc === p ? T.acc : T.bdr}` }}>
                            {p === 100 ? "100%" : p + "%"}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: T.acc, textAlign: "center", marginBottom: 8 }}>€{fmtCC(Math.round(totIvaCC * fattPerc / 100))}</div>
                      <button onClick={() => { creaFattura(c, fattPerc === 100 ? "unica" : "acconto"); setCcDone("✅ Fattura creata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💰 CREA FATTURA →</button>
                    </div>
                  )}
                  {/* ORDINE */}
                  {curCC.id === "ordine" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.sistema || "—"}</div>
                      <div style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 120, overflow: "auto" }}>
                        {vaniCC.map((v, vi) => (
                          <div key={vi} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: vi < vaniCC.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                            <span style={{ color: T.text, fontWeight: 600 }}>{v.nome || v.tipo || `Vano ${vi + 1}`}</span>
                            <span style={{ color: T.acc, fontWeight: 700 }}>{(v.larghezza || v.l || 0)}×{(v.altezza || v.h || 0)}</span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => { creaOrdineFornitore(c, c.sistema?.split(" ")[0] || ""); setSelectedCM(prev => ({ ...prev })); setCcDone("✅ Ordine creato!"); setTimeout(() => setCcDone(null), 3000); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>📦 CONFERMA ORDINE →</button>
                    </div>
                  )}
                  {/* CONFERMA */}
                  {curCC.id === "conferma" && (
                    <div>
                      {!ordConfCC ? (
                        <button onClick={() => apriInboxDocumento()} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#af52de", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>📥 CARICA CONFERMA →</button>
                      ) : ccConfirm !== "conferma_ok" ? (
                        <button onClick={() => setCcConfirm("conferma_ok")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ APPROVA CONFERMA →</button>
                      ) : (
                        <div style={{ background: "#34c75912", borderRadius: 10, padding: 12, border: "1px solid #34c75930" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#34c759", marginBottom: 4 }}>Approvi la conferma?</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                            <button onClick={() => { setOrdiniFornDB(prev => prev.map(o => o.cmId === c.id ? { ...o, conferma: { ...o.conferma, firmata: true } } : o)); setCcConfirm(null); setCcDone("✅ Confermato!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ APPROVO</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* MONTAGGIO */}
                  {curCC.id === "montaggio" && (
                    <div>
                      {!montFormOpen ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.indirizzo || "—"}</div>
                          <button onClick={() => { setMontFormOpen(true); setMontGiorni(1); setMontFormData({ data: "", orario: "08:00", durata: "giornata", squadraId: squadreDB[0]?.id || "", note: "" }); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>🔧 PIANIFICA MONTAGGIO →</button>
                        </div>
                      ) : (
                        <div style={{ background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
                          <input type="date" value={montFormData.data} onChange={e => setMontFormData(p => ({ ...p, data: e.target.value }))} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as any, marginBottom: 6 }} />
                          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                            <select value={montFormData.orario} onChange={e => setMontFormData(p => ({ ...p, orario: e.target.value }))} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: "inherit" }}>
                              {["06:00","07:00","07:30","08:00","08:30","09:00","10:00","14:00"].map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                              <button onClick={() => setMontGiorni(Math.max(0.5, montGiorni - 0.5))} style={{ width: 32, height: 38, border: `1px solid ${T.bdr}`, borderRadius: "8px 0 0 8px", background: T.card, fontSize: 16, cursor: "pointer" }}>−</button>
                              <div style={{ flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}`, fontSize: 14, fontWeight: 800 }}>{montGiorni === 0.5 ? "½" : montGiorni}g</div>
                              <button onClick={() => setMontGiorni(montGiorni + 0.5)} style={{ width: 32, height: 38, border: `1px solid ${T.bdr}`, borderRadius: "0 8px 8px 0", background: T.card, fontSize: 16, cursor: "pointer" }}>+</button>
                            </div>
                          </div>
                          {squadreDB.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" as any }}>{squadreDB.map(sq => (
                            <div key={sq.id} onClick={() => setMontFormData(p => ({ ...p, squadraId: sq.id }))} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: montFormData.squadraId === sq.id ? T.acc : T.card, color: montFormData.squadraId === sq.id ? "#fff" : T.text, border: `1px solid ${montFormData.squadraId === sq.id ? T.acc : T.bdr}` }}>{sq.nome || sq.id}</div>
                          ))}</div>}
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setMontFormOpen(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                            <button onClick={() => {
                              if (!montFormData.data) { alert("Scegli una data"); return; }
                              const nuovoM = { id: "m_" + Date.now(), cmId: c.id, cmCode: c.code, cliente: c.cliente, indirizzo: c.indirizzo || "", vani: vaniCC.length, data: montFormData.data, orario: montFormData.orario, durata: montGiorni + "g", giorni: montGiorni, squadraId: montFormData.squadraId, stato: "programmato", note: montFormData.note };
                              setMontaggiDB(prev => [...prev, nuovoM]);
                              setEvents(prev => [...prev, { id: "ev_m_" + Date.now(), date: montFormData.data, time: montFormData.orario, text: `🔧 Montaggio ${c.cliente} (${montGiorni}g)`, tipo: "montaggio", persona: c.cliente, cm: c.code, addr: c.indirizzo || "", done: false }]);
                              setMontFormOpen(false);
                              setCcDone("✅ Montaggio pianificato!"); setTimeout(() => setCcDone(null), 3000);
                            }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CONFERMA</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* SALDO */}
                  {curCC.id === "saldo" && (() => {
                    const saldoFatCC = fattCC.find(f => f.tipo === "saldo" || f.tipo === "unica");
                    const saldoPagatoCC = saldoFatCC?.pagata;
                    const restoCC = totIvaCC - incassatoCC;
                    return (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>
                        Incassato €{fmtCC(incassatoCC)} su €{fmtCC(totIvaCC)} {restoCC > 0 ? `· Resta €${fmtCC(restoCC)}` : "· ✅ Tutto incassato"}
                      </div>
                      {/* Phase 1: Create saldo fattura */}
                      {!saldoFatCC && restoCC > 0 && (
                        ccConfirm !== "saldo" ? (
                          <button onClick={() => setCcConfirm("saldo")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>💶 FATTURA SALDO €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: T.acc + "10", borderRadius: 10, padding: 12, border: `1px solid ${T.acc}30` }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.acc, marginBottom: 4 }}>Fattura saldo €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => { creaFattura(c, restoCC === totIvaCC ? "unica" : "saldo"); setCcConfirm(null); setCcDone("✅ Fattura saldo creata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CREA FATTURA</button>
                            </div>
                          </div>
                        )
                      )}
                      {/* Phase 2: Mark as paid */}
                      {saldoFatCC && !saldoPagatoCC && (
                        ccConfirm !== "pagata" ? (
                          <button onClick={() => setCcConfirm("pagata")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ SEGNA PAGATA €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: "#34c75912", borderRadius: 10, padding: 12, border: "1px solid #34c75930" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#34c759", marginBottom: 4 }}>Conferma pagamento €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => {
                                setFattureDB(prev => prev.map(f => f.cmId === cm.id && !f.pagata ? { ...f, pagata: true, dataPagamento: new Date().toISOString().split("T")[0], metodoPagamento: "Bonifico" } : f));
                                setFaseTo(cm.id, "chiusura");
                                setCcConfirm(null); setCcDone("🎉 Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000);
                              }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CONFERMO INCASSO</button>
                            </div>
                          </div>
                        )
                      )}
                      {/* Phase 3: All paid, just close */}
                      {!saldoFatCC && restoCC <= 0 && (
                        <button onClick={() => { setFaseTo(cm.id, "chiusura"); setCcDone("🎉 Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>🎉 CHIUDI COMMESSA →</button>
                      )}
                    </div>
                    );
                  })()}
                  {/* MISURE — solo se è il passo corrente */}
                  {curCC.id === "misure" && vaniConPrezzoCC.length > 0 && (
                    <div style={{ fontSize: 12, color: T.acc, fontWeight: 700, textAlign: "center" }}>✅ Prezzi OK · Totale €{fmtCC(totPrevCC)} — Pronto per la firma</div>
                  )}
                </div>
              )}
              {/* Totale */}
              {totPrevCC > 0 && (
                <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Totale IVA incl.</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{fmtCC(totIvaCC)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Contact actions */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          {[
            { ico: ICO.phone, label: "Chiama",   col: T.grn,  act: () => window.location.href=`tel:${c.telefono || ""}` },
            { ico: ICO.map,   label: "Naviga",   col: T.blue, act: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(c.indirizzo || "")}`) },
            { ico: ICO.send,  label: "WhatsApp", col: "#25d366", act: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Commessa ${c.code} - ${c.cliente}`)}`) },
          ].map((a, i) => (
            <div key={i} onClick={a.act} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, cursor: "pointer" }}>
              <Ico d={a.ico} s={18} c={a.col} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.sub }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* == TAB: vani / info == */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, margin: "0 0 0 0" }}>
          {[{k:"sopralluoghi",l:`🪟 Vani (${vaniList.length})`},{k:"info",l:"ℹ Info rilievo"}].map(t => (
            <div key={t.k} onClick={() => setCmSubTab(t.k)} style={{
              flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderBottom: `2px solid ${cmSubTab === t.k ? T.acc : "transparent"}`,
              color: cmSubTab === t.k ? T.acc : T.sub
            }}>{t.l}</div>
          ))}
        </div>

        {/* == TAB VANI (lista vani del rilievo) == */}
        {cmSubTab === "sopralluoghi" && (
          <div style={{ padding: "0 16px 14px" }}>
            {vaniList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🪟</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 6 }}>Nessun vano in questo rilievo</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 18 }}>Aggiungi i vani da misurare</div>
                <button onClick={() => setShowModal("vano")} style={{ ...S.btn, margin: "0 auto" }}>+ Aggiungi vano</button>
              </div>
            ) : vaniList.map(v => {
              const nMisure = Object.values(v.misure||{}).filter(x=>(x as number)>0).length;
              const completo = nMisure >= 6;
              const bloccato = v.note?.startsWith("🔴 BLOCCATO");
              const colore = bloccato ? T.red : completo ? T.grn : T.orange;
              return (
                <div key={v.id} onClick={() => { setSelectedVano(v); setVanoStep(0); }}
                  style={{ ...S.card, marginBottom: 8, padding: "12px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12,
                    borderLeft: `3px solid ${colore}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{v.nome}</span>
                      {/* Badge rilievo di appartenenza */}
                      {(() => {
                        const rIdx = c.rilievi?.findIndex(r => r.vani?.some(vv => vv.id === v.id));
                        if (rIdx < 0) return null;
                        const ril = c.rilievi[rIdx];
                        const questoBloccato = v.note?.startsWith("🔴 BLOCCATO");
                        const questoIncompleto = !questoBloccato && Object.values(v.misure||{}).filter(x=>(x as number)>0).length > 0 && Object.values(v.misure||{}).filter(x=>(x as number)>0).length < 6;
                        const haProblema = questoBloccato || questoIncompleto;
                        return (
                          <span style={{
                            fontSize: 9, fontWeight: 800, borderRadius: 6, padding: "1px 6px",
                            background: haProblema ? T.redLt : T.bg,
                            color: haProblema ? T.red : T.sub,
                            border: `1px solid ${haProblema ? T.red+"40" : T.bdr}`
                          }}>
                            R{rIdx + 1} · {ril.data || ril.dataRilievo || "—"}
                            {haProblema && " ⚠"}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>{v.tipo} · {v.stanza} · {v.piano}</div>
                    {bloccato && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>{v.note?.replace("🔴 BLOCCATO: ","")}</div>}
                  </div>
                  <div style={{ textAlign: "right", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    {/* Badge pezzi */}
                    <span style={{ fontSize:12, fontWeight:800, color:"#fff",
                      background: bloccato ? T.red : completo ? T.grn : T.orange,
                      borderRadius:8, padding:"2px 8px", minWidth:28, textAlign:"center" }}>
                      {v.pezzi||1} pz
                    </span>
                    {bloccato
                      ? <span style={S.badge(T.redLt, T.red)}>🔴 Bloccato</span>
                      : completo
                      ? <span style={S.badge(T.grnLt, T.grn)}>✅ {nMisure} mis.</span>
                      : <span style={S.badge(T.orangeLt, T.orange)}>⚠ {nMisure} mis.</span>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14 }}>›</span>
                </div>
              );
            })}
            {vaniList.length > 0 && (
              <div onClick={() => setShowModal("vano")}
                style={{ ...S.card, padding: "11px 14px", marginTop: 6, cursor: "pointer",
                  border: `1px dashed ${T.bdr}`, background: "transparent",
                  display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                <span style={{ fontSize: 18, color: T.acc }}>+</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>Aggiungi vano</span>
              </div>
            )}
          </div>
        )}

        {/* == TAB MISURE (stato per vano) == */}
        {vaniList.length > 0 && cmSubTab === "misure_tab" && (
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Stato per vano</div>
            {vaniList.map(v => {
              const mis = vaniM.includes(v.id);
              const blk = !mis && ulB(v.id);
              let daV = null;
              for (let i = viste.length - 1; i >= 0; i--) {
                if (viste[i].vaniMisurati?.includes(v.id)) { daV = viste[i]; break; }
              }
              return (
                <div key={v.id} style={{ ...S.card, marginBottom: 8 }}>
                  <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: mis ? T.grnLt : blk ? T.redLt : T.bdr, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {mis ? "✅" : blk ? "🔴" : "⏳"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
                        <span style={{ fontSize: 10, color: T.sub }}>~{v.mq}m²</span>
                      </div>
                      {mis && daV && <div style={{ fontSize: 11, color: T.sub }}>{daV.n}ª visita · {new Date(daV.data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</div>}
                      {!mis && blk && <div style={{ fontSize: 11, color: T.red }}>{blk.motivo}{blk.note && <span style={{ color: T.sub }}> — {blk.note}</span>}</div>}
                      {!mis && !blk && <div style={{ fontSize: 11, color: T.sub }}>Non ancora visitato</div>}
                    </div>
                    {!mis && <span style={{ ...S.badge(T.redLt, T.red), flexShrink: 0, fontSize: 9 }}>DA FARE</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* == TAB INFO RILIEVO == */}
        {cmSubTab === "info" && (
          <div style={{ padding: "14px 16px" }}>
            {/* Info rilievo */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Dettagli Rilievo</div>
            {[
              ["Tipo",       tipoLblRil],
              ["Data",       r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : "—"],
              ["Ora",        r?.ora || "—"],
              ["Rilevatore", r?.rilevatore || "—"],
              ["N. vani",    `${vaniList.length} vani`],
              ["Avanzamento",`${progVani}% (${vaniMisurati.length}/${vaniList.length})`],
              ...(r?.motivoModifica ? [["Motivo", r.motivoModifica]] : []),
              ...(r?.note ? [["Note", r.note]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 }}>Commessa</div>
            {[
              ["Cliente",   `${c.cliente} ${c.cognome || ""}`],
              ["Codice",    c.code],
              ["Indirizzo", c.indirizzo],
              ["Telefono",  c.telefono || "—"],
              ["Sistema",   c.sistema || "—"],
              ...(c.euro ? [["Importo", `€${c.euro.toLocaleString("it-IT")}`]] : []),
              ["Rilievi",   `${(c.rilievi||[]).length} totali`],
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const a={id:Date.now(),tipo:"file",nome:f.name,data:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),dataUrl:ev.target.result};setCantieri(cs=>cs.map(x=>x.id===selectedCM.id?{...x,allegati:[...(x.allegati||[]),a]}:x));setSelectedCM(p=>({...p,allegati:[...(p.allegati||[]),a]}));};r.readAsDataURL(f);e.target.value="";}}/> 
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const a={id:Date.now(),tipo:"foto",nome:f.name,data:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),dataUrl:ev.target.result};setCantieri(cs=>cs.map(x=>x.id===selectedCM.id?{...x,allegati:[...(x.allegati||[]),a]}:x));setSelectedCM(p=>({...p,allegati:[...(p.allegati||[]),a]}));};r.readAsDataURL(f);e.target.value="";}}/> 


        {/* SEGNALA PROBLEMA */}
        <div style={{ padding: "0 16px", marginBottom: 8, display: "flex", gap: 8 }}>
          <button onClick={() => { setProblemaForm({ titolo: "", descrizione: "", tipo: "materiale", priorita: "media", assegnato: "" }); setShowProblemaModal(true); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #FF3B30", background: "#FF3B3008", color: "#FF3B30", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, position: "relative" }}>
            🚨 Segnala problema
            {problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto").length > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: "50%", background: "#FF3B30", color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto").length}</span>}
          </button>
          {problemi.filter(p => p.commessaId === c.id).length > 0 && (
            <button onClick={() => { setShowProblemiView(true); }} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.text, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", gap: 6 }}>
              📋 {problemi.filter(p => p.commessaId === c.id).length}
            </button>
          )}
        </div>

        {/* Allegati / Note / Vocali / Video */}
        <div style={{ padding: "0 16px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { ico: "📎", label: "File", act: () => fileInputRef.current?.click() },
              { ico: "📷", label: "Foto", act: () => fotoInputRef.current?.click() },
              { ico: "📝", label: "Nota", act: () => { setShowAllegatiModal("nota"); setAllegatiText(""); }},
              { ico: "🎤", label: "Vocale", act: () => { setShowAllegatiModal("vocale"); }},
              { ico: "🎬", label: "Video", act: () => { setShowAllegatiModal("video"); }},
            ].map((b, i) => (
              <div key={i} onClick={b.act} style={{ flex: 1, padding: "10px 4px", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 18 }}>{b.ico}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.sub, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
          {/* Lista allegati */}
          {(c.allegati || []).length > 0 && (
            <div style={{ marginTop: 6, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {(c.allegati || []).map(a => (
                <div key={a.id} style={{ borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 16 }}>{a.tipo === "nota" ? "📝" : a.tipo === "vocale" ? "🎤" : a.tipo === "video" ? "🎬" : a.tipo === "foto" ? "📷" : "📎"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.nome}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{a.data ? new Date(a.data+'T12:00:00').toLocaleDateString('it-IT') : a.data}{a.durata ? ` · ${a.durata}` : ""}</div>
                    </div>
                    {/* Audio: play inline */}
                    {a.tipo === "vocale" && (
                      <div onClick={() => playAllegato(a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: playingId === a.id ? T.redLt : T.accLt, fontSize: 10, fontWeight: 600, color: playingId === a.id ? T.red : T.acc, cursor: "pointer" }}>
                        {playingId === a.id ? "⏸ Stop" : "▶ Play"}
                      </div>
                    )}
                    {/* Video: open/close inline player */}
                    {a.tipo === "video" && a.dataUrl && (
                      <div onClick={() => setViewingVideoId(viewingVideoId === a.id ? null : a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: viewingVideoId === a.id ? T.blueLt : T.accLt, fontSize: 10, fontWeight: 600, color: viewingVideoId === a.id ? T.blue : T.acc, cursor: "pointer" }}>
                        {viewingVideoId === a.id ? "✕ Chiudi" : "▶ Guarda"}
                      </div>
                    )}
                    {a.tipo === "video" && a.dataUrl && (
                      <a href={a.dataUrl} download={a.nome || "video.webm"} style={{ padding: "3px 8px", borderRadius: 6, background: T.bg, fontSize: 10, fontWeight: 600, color: T.sub, cursor: "pointer", textDecoration: "none" }}>⬇</a>
                    )}
                    {/* Photo: toggle inline preview */}
                    {a.tipo === "foto" && a.dataUrl && (
                      <div onClick={() => setViewingPhotoId(viewingPhotoId === a.id ? null : a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer" }}>
                        {viewingPhotoId === a.id ? "✕ Chiudi" : "👁 Vedi"}
                      </div>
                    )}
                    {a.tipo === "foto" && a.dataUrl && <img src={a.dataUrl} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} alt="" />}
                    {a.tipo === "file" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer", textDecoration: "none" }}>📂 Apri</a>}
                    {/* Delete */}
                    <div onClick={() => { setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, allegati: (x.allegati || []).filter(al => al.id !== a.id) } : x)); setSelectedCM(p => ({ ...p, allegati: (p.allegati || []).filter(al => al.id !== a.id) })); }} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={12} c={T.sub} /></div>
                  </div>
                  {/* Audio progress bar */}
                  {a.tipo === "vocale" && playingId === a.id && (
                    <div style={{ height: 3, background: T.bdr, margin: "0 12px 6px" }}>
                      <div style={{ height: "100%", background: T.acc, borderRadius: 2, width: `${playProgress}%`, transition: "width 0.1s linear" }} />
                    </div>
                  )}
                  {/* Inline VIDEO player */}
                  {a.tipo === "video" && viewingVideoId === a.id && a.dataUrl && (
                    <div style={{ padding: "6px 12px 10px" }}>
                      <video src={a.dataUrl} controls playsInline autoPlay
                        style={{ width: "100%", maxHeight: 280, borderRadius: 10, background: "#000" }} />
                    </div>
                  )}
                  {/* Inline PHOTO full preview */}
                  {a.tipo === "foto" && viewingPhotoId === a.id && a.dataUrl && (
                    <div style={{ padding: "6px 12px 10px" }}>
                      <img src={a.dataUrl} style={{ width: "100%", borderRadius: 10 }} alt={a.nome} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vani */}
        <div style={S.section}>
          <div style={S.sectionTitle}>Vani R{r?.n} ({vaniList.length})</div>
          <button style={S.sectionBtn} onClick={() => {
              if (!selectedCM) return;
              const tipObj = TIPOLOGIE_RAPIDE[0];
              if (!selectedRilievo) return;
              const v = { id: Date.now(), nome: `Vano ${(selectedRilievo.vani?.length||0)+1}`, tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
              const updR1 = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
              setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR1 : r2), aggiornato: "Oggi" } : c));
              setSelectedRilievo(updR1);
              setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR1 : r2) }));
              setSelectedVano(v);
              setVanoStep(0);
            }}>+ Nuovo vano</button>
        </div>
        <div style={{ padding: "0 16px", ...((isTablet || isDesktop) && vaniList.length > 0 ? { display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 } : {}) }}>
          {vaniList.length === 0 ? (
            <div onClick={() => {
              if (!selectedCM) return;
              const v = { id: Date.now(), nome: `Vano 1`, tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
              if (selectedRilievo) { const updR2 = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] }; setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR2 : r2) } : c)); setSelectedRilievo(updR2); setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR2 : r2) })); }
              setSelectedVano(v);
              setVanoStep(0);
            }} style={{ padding: "20px", textAlign: "center", background: T.card, borderRadius: T.r, border: `1px dashed ${T.bdr}`, cursor: "pointer", color: T.sub, fontSize: 13 }}>
              Nessun vano. Tocca per aggiungerne uno.
            </div>
          ) : vaniList.map(v => {
            const filled = Object.values(v.misure || {}).filter(x => (x as number) > 0).length;
            const total = 8;
            const fotoCount = Object.values(v.foto || {}).filter(Boolean).length;
            return (
              <div key={v.id} style={{ ...S.card, margin: "0 0 8px" }} onClick={() => setSelectedVano(v)}>
                <div style={S.cardInner}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: T.accLt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.icon || "🪟"}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{v.nome}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>{TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo} · {v.stanza} · {v.piano}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: filled >= 6 ? T.grn : T.orange }}>{filled}/{total}<div style={{ fontSize: 10, color: T.sub, fontWeight: 400 }}>misure</div></div>
                      <div onClick={e => { e.stopPropagation(); deleteVano(v.id); }} style={{ width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", background: T.redLt, cursor: "pointer" }}><Ico d={ICO.trash} s={13} c={T.red} /></div>
                    </div>
                  </div>
                  {/* Tags */}
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {fotoCount > 0 && <span style={S.badge(T.blueLt, T.blue)}>{fotoCount} foto</span>}
                    {v.controtelaio?.tipo && <span style={S.badge("#dbeafe", "#2563eb")}>🔲 CT {v.controtelaio.tipo==="singolo"?"Sing.":v.controtelaio.tipo==="doppio"?"Doppio":"Cass."}</span>}
                    {v.cassonetto && <span style={S.badge(T.orangeLt, T.orange)}>Cassonetto</span>}
                    {v.accessori?.tapparella?.attivo && <span style={S.badge(T.grnLt, T.grn)}>Tapparella</span>}
                    {v.accessori?.zanzariera?.attivo && <span style={S.badge(T.purpleLt, T.purple)}>Zanzariera</span>}
                    {v.vociLibere?.length > 0 && <span style={S.badge("#fff3e0", "#ff9500")}>📦 {v.vociLibere.length} voci</span>}
                    {v.note && <span style={S.badge(T.cyanLt, T.cyan)}>Note</span>}
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 3, background: T.bdr, borderRadius: 2, marginTop: 8 }}>
                    <div style={{ height: "100%", borderRadius: 2, background: filled >= 6 ? T.grn : T.acc, width: `${(filled / total) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline/Log */}
        {c.log && c.log.length > 0 && (
          <>
            <div style={{ ...S.section, marginTop: 8 }}>
              <div style={S.sectionTitle}>Cronologia</div>
            </div>
            <div style={{ padding: "0 16px" }}>
              {c.log.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                    {i < c.log.length - 1 && <div style={{ width: 1, flex: 1, background: T.bdr, marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.3 }}><strong>{l.chi}</strong> {l.cosa}</div>
                    <div style={{ fontSize: 10, color: T.sub2, marginTop: 1 }}>{l.quando}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Elimina — bottom, small */}
        <div style={{ padding: "16px", textAlign: "center" }}>
          <span onClick={() => deleteCommessa(c.id)} style={{ fontSize: 11, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>🗝‘ Elimina commessa</span>
        </div>
      </div>
    );
}
