"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — CMDetailPanel
// Estratto S6: ~938 righe (Dettaglio commessa)
// ═══════════════════════════════════════════════════════════
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, ICO, Ico, I, MOTIVI_BLOCCO, TIPOLOGIE_RAPIDE } from "./mastro-constants";
import { buildSnapshot, creaFascicolo, getFascicoliCommessa, revocaFascicolo } from "../lib/fascicolo-service";
import { generaFascicoloGeometraPDF } from "../lib/pdf-fascicolo";
import { generaExcelFascicolo } from "../lib/excel-fascicolo";
import InterventoTab from "./InterventoTab";
import InterventoFlowPanel from "./InterventoFlowPanel";

export default function CMDetailPanel() {
  const {
    T, S, isDesktop, isTablet, fs, PIPELINE,
    // State
    selectedCM, setSelectedCM, cantieri, setCantieri,
    selectedRilievo, setSelectedRilievo,
    cmSubTab, setCmSubTab,
    fattureDB, setFattureDB, ordiniFornDB, setOrdiniFornDB,
    montaggiDB, setMontaggiDB, squadreDB,
    ccConfirm, setCcConfirm, ccDone, setCcDone,
    firmaStep, setFirmaStep, firmaFileUrl, setFirmaFileUrl, firmaFileName, setFirmaFileName,
    fattPerc, setFattPerc, montGiorni, setMontGiorni,
    voceTempDesc, setVoceTempDesc, voceTempImporto, setVoceTempImporto, voceTempQta, setVoceTempQta,
    prevWorkspace, setPrevWorkspace, prevTab, setPrevTab,
    editingVanoId, setEditingVanoId,
    drawingVanoId, setDrawingVanoId,
    sistemiDB, coloriDB, vetriDB,
    montFormOpen, setMontFormOpen, montFormData, setMontFormData,
    viewingPhotoId, setViewingPhotoId, viewingVideoId, setViewingVideoId,
    playProgress, playingId,
    problemi,
    // NuovoVano wizard
    nvStep, setNvStep, nvTipo, setNvTipo, nvVani, setNvVani,
    nvNote, setNvNote, nvData, setNvData, nvView, setNvView,
    nvBlocchi, setNvBlocchi, nvMotivoModifica, setNvMotivoModifica,
    // Modals
    showPreventivoModal, setShowPreventivoModal,
    showModal, setShowModal, showRiepilogo, setShowRiepilogo,
    showAllegatiModal, setShowAllegatiModal, allegatiText, setAllegatiText,
    showProblemaModal, setShowProblemaModal, problemaForm, setProblemaForm,
    showProblemiView, setShowProblemiView,
    // Events
    events, setEvents,
    // Helpers
    getVaniAttivi, calcolaVanoPrezzo, deleteCommessa, deleteVano,
    exportPDF, playAllegato, setFaseTo, addAllegato, faseIndex,
    fileInputRef, fotoInputRef,
    // Navigation
    setSelectedVano, setVanoStep,
    // Business logic
    generaPreventivoPDF, creaFattura, creaOrdineFornitore,
    generaPreventivoCondivisibile,
    apriInboxDocumento,
    aziendaInfo,
  } = useMastro();

    const [fabSecOpen, setFabSecOpen] = React.useState(false);
    const [workWeekend, setWorkWeekend] = useState<boolean | null>(null); // null=non chiesto, true=sì, false=no
    const [showAccontoModal, setShowAccontoModal] = useState(false);
    const [accontoImporto, setAccontoImporto] = useState<string>("");
    const [showOrdinePreview, setShowOrdinePreview] = useState(false);
    const [interventoOpen, setInterventoOpen] = useState(null);
    const [showFascicoloModal, setShowFascicoloModal] = useState(false);
    const [fascicoloLoading, setFascicoloLoading] = useState(false);
    const [fascicoloLink, setFascicoloLink] = useState<string | null>(null);
    const [fascicoloLinkCopied, setFascicoloLinkCopied] = useState(false);
    const [fascicoloStep, setFascicoloStep] = useState<"idle"|"generato">("idle");
    const [fascicoliStorico, setFascicoliStorico] = useState<any[]>([]);

    if (!selectedCM) return null;
    const c = selectedCM;
    const r = selectedRilievo; // rilievo corrente
    const fase = PIPELINE.find(p => p.id === c.fase);
    // ═══ READ-ONLY: solo l'ultimo rilievo è modificabile ═══
    const lastRilievo = (c.rilievi || []).length > 0 ? c.rilievi[c.rilievi.length - 1] : null;
    const isLastRilievo = !r || !lastRilievo || r.id === lastRilievo.id;
    const isStorico = r && !isLastRilievo;

    // ═══ PREVENTIVO WORKSPACE CONSTANTS ═══
    const CONTROT_OPT = ["Nessuno", "Standard", "Monoblocco", "Monoblocco coibentato", "Monoblocco Termico"];
    const CASS_OPT = ["", "Standard", "Coibentato", "Monoblocco", "Monoblocco Termico"];
    const COPRIFILO_OPT = ["", "PVC 40mm", "PVC 60mm", "PVC 70mm", "Alluminio 40mm", "Alluminio 60mm", "Alluminio 70mm", "Alluminio 90mm"];
    const SOGLIA_OPT = ["", "Standard", "Ribassata", "A filo pavimento", "Alluminio", "Marmo"];
    const DAVANZALE_OPT = ["", "Alluminio 150mm", "Alluminio 200mm", "Alluminio 250mm", "Alluminio 300mm", "Alluminio 350mm", "Marmo", "Pietra"];
    const ZANZ_TIPO = ["Laterale", "Verticale", "Plissé", "A rullo"];
    const PERS_TIPO = ["Alluminio", "PVC", "Legno", "Blindata"];
    const TAPP_TIPO = ["PVC", "Alluminio coibentato", "Alluminio", "Acciaio"];
    const DETRAZIONI_OPT = [
      { id: "nessuna", l: "Nessuna", perc: 0 },
      { id: "50", l: "Ristrutt. 50%", perc: 50 },
      { id: "65", l: "Ecobonus 65%", perc: 65 },
      { id: "75", l: "Barriere 75%", perc: 75 },
    ];
    const TIPI_VANO = ["F1A","F2A","F3A","PF1A","PF2A","PF3A","VAS","FISSO","SC2A","SC3A","PORTA","SCOR","BOX"];

    // ═══ PREVENTIVO WORKSPACE VIEW ═══
    if (prevWorkspace) {
      const pwVani = getVaniAttivi(c);
      const pwRilievi = c.rilievi || [];
      const pwIvaDefault = c.ivaPerc || 10;
      const pwSconto = c.scontoPerc || 0;
      const pwDetr = c.detrazione || "nessuna";
      const pwDetrObj = DETRAZIONI_OPT.find(d => d.id === pwDetr);
      const pwVociLibere = c.vociLibere || [];

      const pwTotVani = pwVani.reduce((s, v) => s + calcolaVanoPrezzo(v, c) * (v.pezzi || 1), 0);
      const pwTotVoci = pwVociLibere.reduce((s, vl) => s + (vl.importo || 0) * (vl.qta || 1), 0);
      const pwSubtot = pwTotVani + pwTotVoci;
      const pwScontoVal = pwSubtot * pwSconto / 100;
      const pwImponibile = pwSubtot - pwScontoVal;
      const pwIvaCalc = pwImponibile * pwIvaDefault / 100;
      const pwTotale = pwImponibile + pwIvaCalc;
      const pwVaniNonConf = pwVani.filter(v => (v.statoMisure || "provvisorie") !== "confermate");
      const pwBloccato = pwVaniNonConf.length > 0;
      const pwDetraibile = pwDetrObj && pwDetrObj.perc > 0 ? pwImponibile * pwDetrObj.perc / 100 : 0;
      const pwFmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";

      const updCM = (field, val) => {
        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, [field]: val } : cm));
        setSelectedCM(prev => ({ ...prev, [field]: val }));
      };
      const pwUpdVano = (vanoId, field, val) => {
        setCantieri(cs => cs.map(cm => {
          if (cm.id !== c.id) return cm;
          const rilievi = (cm.rilievi || []).map(r => ({
            ...r, vani: (r.vani || []).map(v => v.id === vanoId ? { ...v, [field]: val } : v)
          }));
          return { ...cm, rilievi };
        }));
        setSelectedCM(prev => ({
          ...prev, rilievi: (prev.rilievi || []).map(r => ({
            ...r, vani: (r.vani || []).map(v => v.id === vanoId ? { ...v, [field]: val } : v)
          }))
        }));
      };
      // Duplica vano come "modifica" (versioning)
      const pwDuplicaVano = (v, isModifica) => {
        const newV = { ...JSON.parse(JSON.stringify(v)), id: Date.now(), nome: v.nome + (isModifica ? " (mod.)" : " (copia)"), versione: (v.versione || 1) + (isModifica ? 1 : 0), parentId: isModifica ? v.id : undefined, dataModifica: isModifica ? new Date().toISOString().split("T")[0] : undefined };
        // Aggiungi al primo rilievo
        setCantieri(cs => cs.map(cm => {
          if (cm.id !== c.id) return cm;
          const ril = [...(cm.rilievi || [])];
          if (ril.length > 0) ril[0] = { ...ril[0], vani: [...(ril[0].vani || []), newV] };
          return { ...cm, rilievi: ril };
        }));
        setSelectedCM(prev => {
          const ril = [...(prev.rilievi || [])];
          if (ril.length > 0) ril[0] = { ...ril[0], vani: [...(ril[0].vani || []), newV] };
          return { ...prev, rilievi: ril };
        });
        setEditingVanoId(newV.id);
      };

      const chipPw = (on) => ({ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: on ? `${T.acc}15` : T.card, color: on ? T.acc : T.sub, border: `1.5px solid ${on ? T.acc : T.bdr}` });
      const chipPwGrn = (on) => ({ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: on ? `${T.grn}15` : T.card, color: on ? T.grn : T.sub, border: `1.5px solid ${on ? T.grn : T.bdr}` });
      const inputPw = { width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" as any, background: T.card };
      const tabPw = (t) => ({ flex: 1, padding: "10px 4px", textAlign: "center" as any, fontSize: 11, fontWeight: 700, cursor: "pointer", borderBottom: `2.5px solid ${prevTab === t ? T.acc : "transparent"}`, color: prevTab === t ? T.acc : T.sub });

      return (
        <div style={{ paddingBottom: 80 }}>
          {/* Header sticky */}
          <div style={{ background: T.topbar || "#1A1A1C", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
            <div onClick={() => setPrevWorkspace(false)} style={{ fontSize: 18, cursor: "pointer", color: "#fff" }}>←</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.code} · {c.cliente} {c.cognome || ""}</div>
              <div style={{ fontSize: 10, color: "#ffffff60" }}>{c.indirizzo || ""}</div>
            </div>
            {fattureDB.filter(f => f.cmId === c.id).length > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "#1A9E7330" : "#D0800830", color: fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "#1A9E73" : "#D08008", flexShrink: 0 }}>
                {fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "✅ Pagata" : "📄 Fattura"}
              </span>
            )}
            <div style={{ background: T.acc, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>€{pwFmt(pwTotale)}</div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.bdr}`, position: "sticky", top: 52, zIndex: 10 }}>
            <div onClick={() => setPrevTab("sopralluogo")} style={tabPw("sopralluogo")}><I d={ICO.search} /> Report</div>
            <div onClick={() => setPrevTab("preventivo")} style={tabPw("preventivo")}><I d={ICO.clipboard} /> Preventivo</div>
            <div onClick={() => setPrevTab("riepilogo")} style={tabPw("riepilogo")}><I d={ICO.barChart} /> Riepilogo</div>
            <div onClick={() => setPrevTab("importa")} style={tabPw("importa")}><I d={ICO.download} /> Importa</div>
          </div>

          <div style={{ paddingTop: 12 }}>

          {/* ════════ TAB SOPRALLUOGO (REPORT + DIFF) ════════ */}
          {prevTab === "sopralluogo" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ padding: 14, background: `${T.blue}10`, borderRadius: 12, marginBottom: 14, border: `1px solid ${T.blue}20` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.blue }}><I d={ICO.clipboard} /> Report Sopralluogo</div>
                  <div style={{ fontSize: 10, color: T.sub, background: T.card, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>R{pwRilievi.length} · {pwRilievi[0]?.data || "—"}</div>
                </div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{c.cliente} {c.cognome || ""} · {c.indirizzo || ""}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                {[
                  { l: "Vani", v: pwVani.length, col: T.acc },
                  { l: "Pezzi", v: pwVani.reduce((s, v) => s + (v.pezzi || 1), 0), col: T.blue },
                  { l: "Foto", v: pwVani.reduce((s, v) => s + (Array.isArray(v.foto) ? v.foto.length : 0), 0), col: T.grn },
                  { l: "⚠️", v: pwVani.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length < 6).length, col: T.red },
                ].map((st, i) => (
                  <div key={i} style={{ background: T.card, borderRadius: 10, padding: "10px 6px", textAlign: "center", border: `1px solid ${T.bdr}` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: st.col }}>{st.v}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.sub }}>{st.l}</div>
                  </div>
                ))}
              </div>

              {pwVani.map(v => {
                const mis = v.misure || {};
                const nMis = Object.values(mis).filter(x => (x as number) > 0).length;
                const misOk = nMis >= 6;
                const lv = mis.lCentro || v.larghezza || v.l || 0;
                const hv = mis.hCentro || v.altezza || v.h || 0;
                const hasModifica = v.parentId || pwVani.some(vx => vx.parentId === v.id);
                return (
                  <div key={v.id} style={{ background: T.card, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${T.bdr}`, borderLeft: `4px solid ${misOk ? T.grn : T.orange}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{v.nome || `Vano ${v.id}`}
                          {v.versione > 1 && <span style={{ fontSize: 9, background: `${T.purple}15`, color: T.purple, padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>v{v.versione}</span>}
                          {v.parentId && <span style={{ fontSize: 9, background: `${T.orange}15`, color: T.orange, padding: "2px 6px", borderRadius: 4, marginLeft: 4 }}>MODIFICA</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.sub }}>{v.tipo || "F2A"} · {v.stanza || "—"} · {v.piano || "PT"} · {v.pezzi || 1}pz</div>
                      </div>
                      <span style={{ fontSize: 10, background: misOk ? `${T.grn}15` : `${T.red}15`, color: misOk ? T.grn : T.red, padding: "3px 8px", borderRadius: 6, fontWeight: 700, height: "fit-content" }}>{misOk ? `✅ ${nMis}` : `⚠️ ${nMis}/6`}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
                      {[{ l: "Larg.", val: lv }, { l: "Alt.", val: hv }, { l: "mq", val: ((lv * hv) / 1000000).toFixed(2) }].map((m, mi) => (
                        <div key={mi} style={{ background: T.bg, borderRadius: 8, padding: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.sub }}>{m.l}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: mi === 2 ? T.acc : T.text }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.8 }}>
                      <I d={ICO.building} /> {v.sistema || c.sistema || "—"} · <I d={ICO.palette} /> {v.colore || "Bianco"} · <I d={ICO.grid} /> {v.vetro || "Standard"}
                      {v.controtelaio && v.controtelaio !== "Nessuno" && ` · 🔲 ${v.controtelaio}`}
                      {v.accessori?.tapparella?.attivo && ` · Tapp. ${v.accessori.tapparella.tipo || ""}`}
                      {v.accessori?.persiana?.attivo && ` · Pers. ${v.accessori.persiana.tipo || ""}`}
                      {v.accessori?.zanzariera?.attivo && ` · Zanz. ${v.accessori.zanzariera.tipo || ""}`}
                      {v.coprifilo && ` · Coprifilo ${v.coprifilo}`}
                      {v.soglia && ` · Soglia ${v.soglia}`}
                      {v.davanzale && ` · Davanz. ${v.davanzale}`}
                    </div>
                    {v.note && <div style={{ fontSize: 11, color: T.orange, fontWeight: 600, marginTop: 4 }}><I d={ICO.mapPin} /> {v.note}</div>}

                    {/* PDF Tecnico Fornitore badge */}
                    {v.pdfFornitore ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "7px 10px", borderRadius: 8, background: "#3B7FE010", border: "1px solid #3B7FE030" }}>
                        <span style={{ fontSize: 14 }}>📐</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#3B7FE0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.pdfFornitoreNome || "Disegno tecnico.pdf"}
                          </div>
                          <div style={{ fontSize: 9, color: T.sub }}>{v.pdfFornitoreData || ""}</div>
                        </div>
                        <div onClick={() => {
                          const link = document.createElement("a");
                          link.href = v.pdfFornitore;
                          link.download = v.pdfFornitoreNome || "disegno_tecnico.pdf";
                          link.click();
                        }} style={{ padding: "4px 10px", borderRadius: 6, background: "#3B7FE015", border: "1px solid #3B7FE040", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#3B7FE0", whiteSpace: "nowrap" as const }}>
                          ⬇ Apri
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "#D0800808", border: "1px dashed #D0800840", fontSize: 10, color: T.sub, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📐</span> PDF tecnico fornitore non caricato — aprire il vano per aggiungerlo
                      </div>
                    )}

                    {/* Foto gallery */}
                    {(Array.isArray(v.foto) && v.foto.length > 0) && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                        {v.foto.map((f, fi) => (
                          <div key={fi} style={{ minWidth: 64, height: 64, borderRadius: 8, background: `${T.blue}08`, border: `1px solid ${T.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 22 }}><I d={ICO.camera} /></span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Diff: se c'è una modifica, mostra differenze */}
                    {v.parentId && (() => {
                      const orig = pwVani.find(vx => vx.id === v.parentId);
                      if (!orig) return null;
                      const diffs = [];
                      if ((orig.tipo || "") !== (v.tipo || "")) diffs.push({ l: "Tipo", da: orig.tipo, a: v.tipo });
                      if ((orig.colore || "") !== (v.colore || "")) diffs.push({ l: "Colore", da: orig.colore, a: v.colore });
                      if ((orig.vetro || "") !== (v.vetro || "")) diffs.push({ l: "Vetro", da: orig.vetro, a: v.vetro });
                      if ((orig.sistema || "") !== (v.sistema || "")) diffs.push({ l: "Sistema", da: orig.sistema, a: v.sistema });
                      if ((orig.controtelaio || "") !== (v.controtelaio || "")) diffs.push({ l: "Controtelaio", da: orig.controtelaio, a: v.controtelaio });
                      const origL = orig.misure?.lCentro || orig.larghezza || orig.l || 0;
                      const origH = orig.misure?.hCentro || orig.altezza || orig.h || 0;
                      if (origL !== lv) diffs.push({ l: "Larghezza", da: origL, a: lv });
                      if (origH !== hv) diffs.push({ l: "Altezza", da: origH, a: hv });
                      if (diffs.length === 0) return null;
                      return (
                        <div style={{ marginTop: 8, padding: 8, background: `${T.purple}08`, borderRadius: 8, border: `1px solid ${T.purple}20` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.purple, marginBottom: 4 }}><I d={ICO.refreshCw} /> Differenze da originale</div>
                          {diffs.map((d, di) => (
                            <div key={di} style={{ fontSize: 10, display: "flex", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, color: T.sub, width: 70 }}>{d.l}:</span>
                              <span style={{ color: T.red, textDecoration: "line-through" }}>{d.da || "—"}</span>
                              <span style={{ color: T.sub }}>→</span>
                              <span style={{ color: T.grn, fontWeight: 700 }}>{d.a || "—"}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Quick actions */}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <div onClick={() => { setPrevTab("preventivo"); setEditingVanoId(v.id); }} style={{ flex: 1, padding: "6px 0", borderRadius: 6, textAlign: "center", fontSize: 10, fontWeight: 700, color: T.acc, background: `${T.acc}08`, cursor: "pointer", border: `1px solid ${T.acc}20` }}><I d={ICO.clipboard} /> Modifica nel preventivo</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ════════ TAB PREVENTIVO (EDITOR) ════════ */}
          {prevTab === "preventivo" && (
            <div style={{ padding: "0 12px 20px" }}>
              {/* Pratica fiscale */}
              <div style={{ background: T.card, borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}><I d={ICO.building} /> Pratica fiscale</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any }}>
                  {DETRAZIONI_OPT.map(d => (
                    <div key={d.id} onClick={() => updCM("detrazione", d.id)} style={{
                      padding: "7px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer",
                      background: pwDetr === d.id ? (d.perc > 0 ? `${T.grn}15` : T.bg) : T.bg,
                      color: pwDetr === d.id ? (d.perc > 0 ? T.grn : T.text) : T.sub,
                      border: `1.5px solid ${pwDetr === d.id ? (d.perc > 0 ? T.grn : T.bdr) : T.bdr}`,
                    }}>{d.l}</div>
                  ))}
                </div>

                {/* ── CHECKLIST DOCUMENTI CON UPLOAD ── */}
                {pwDetr !== "nessuna" && (() => {
                  const DOCS_MAP = {
                    "50": [
                      { doc: "Carta d'identità committente", obblig: true },
                      { doc: "Codice fiscale committente", obblig: true },
                      { doc: "CILA / SCIA / Permesso", obblig: true },
                      { doc: "Bonifico parlante (bancario/postale)", obblig: true },
                      { doc: "Fatture con dicitura detrazione", obblig: true },
                      { doc: "Comunicazione ENEA (entro 90gg)", obblig: true },
                      { doc: "Visura catastale immobile", obblig: false },
                      { doc: "Consenso proprietario (se inquilino)", obblig: false },
                    ],
                    "65": [
                      { doc: "Carta d'identità committente", obblig: true },
                      { doc: "Codice fiscale committente", obblig: true },
                      { doc: "APE pre-intervento", obblig: true },
                      { doc: "APE post-intervento", obblig: true },
                      { doc: "Certificazione trasmittanza termica (Uw)", obblig: true },
                      { doc: "Asseverazione tecnico abilitato", obblig: true },
                      { doc: "Comunicazione ENEA (entro 90gg)", obblig: true },
                      { doc: "Schede tecniche prodotti installati", obblig: true },
                      { doc: "Fatture + bonifico parlante", obblig: true },
                      { doc: "Visura catastale immobile", obblig: false },
                    ],
                    "75": [
                      { doc: "Carta d'identità committente", obblig: true },
                      { doc: "Codice fiscale committente", obblig: true },
                      { doc: "Certificazione conformità barriere architettoniche", obblig: true },
                      { doc: "Asseverazione tecnico abilitato", obblig: true },
                      { doc: "Comunicazione ENEA (entro 90gg)", obblig: true },
                      { doc: "Fatture + bonifico parlante", obblig: true },
                      { doc: "Schede tecniche prodotti", obblig: false },
                      { doc: "Visura catastale immobile", obblig: false },
                    ],
                  };
                  const baseDocs = DOCS_MAP[pwDetr] || [];
                  const customDocs = (c.praticaDocsCustom || []) as Array<{doc: string, obblig: boolean}>;
                  const allDocs = [...baseDocs, ...customDocs];
                  const checkedDocs = c.praticaChecklist || {};
                  const uploadedFiles = c.praticaFiles || {}; // { docName: { name, dataUrl, date } }
                  const obligCount = allDocs.filter(d => d.obblig).length;
                  const checkedCount = allDocs.filter(d => checkedDocs[d.doc] || uploadedFiles[d.doc]).length;
                  const obligChecked = allDocs.filter(d => d.obblig && (checkedDocs[d.doc] || uploadedFiles[d.doc])).length;

                  const uploadDoc = (docName) => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.accept = "image/*,application/pdf,.doc,.docx";
                    inp.onchange = (ev) => {
                      const file = (ev.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const newFiles = { ...uploadedFiles, [docName]: { name: file.name, dataUrl: reader.result, date: new Date().toISOString().split("T")[0], size: file.size } };
                        updCM("praticaFiles", newFiles);
                        // Auto-check when uploaded
                        updCM("praticaChecklist", { ...checkedDocs, [docName]: true });
                      };
                      reader.readAsDataURL(file);
                    };
                    inp.click();
                  };

                  const scanDoc = (docName) => {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.accept = "image/*";
                    inp.capture = "environment";
                    inp.onchange = (ev) => {
                      const file = (ev.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const newFiles = { ...uploadedFiles, [docName]: { name: `scan_${docName.replace(/\s/g,"_")}.jpg`, dataUrl: reader.result, date: new Date().toISOString().split("T")[0], size: file.size } };
                        updCM("praticaFiles", newFiles);
                        updCM("praticaChecklist", { ...checkedDocs, [docName]: true });
                      };
                      reader.readAsDataURL(file);
                    };
                    inp.click();
                  };

                  return (
                    <div style={{ marginTop: 8, padding: 10, background: `${T.grn}06`, borderRadius: 10, border: `1px solid ${T.grn}20` }}>
                      {/* Header con conteggio */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: T.grn }}>
                          <I d={ICO.clipboard} /> Documenti ({obligChecked}/{obligCount} obbl.)
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <div onClick={() => {
                            const nome = prompt("Nome documento da aggiungere:");
                            if (!nome) return;
                            updCM("praticaDocsCustom", [...customDocs, { doc: nome, obblig: false }]);
                          }} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 9, fontWeight: 700, cursor: "pointer", background: `${T.grn}15`, color: T.grn, border: `1px solid ${T.grn}30` }}>+ Aggiungi</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 4, background: T.bdr, borderRadius: 2, marginBottom: 8 }}>
                        <div style={{ height: "100%", borderRadius: 2, background: obligChecked === obligCount ? T.grn : T.acc, width: `${obligCount > 0 ? (obligChecked / obligCount) * 100 : 0}%`, transition: "width 0.3s" }} />
                      </div>

                      {/* Lista documenti */}
                      {allDocs.map((d, di) => {
                        const isChecked = checkedDocs[d.doc] || !!uploadedFiles[d.doc];
                        const hasFile = !!uploadedFiles[d.doc];
                        const isCustom = di >= baseDocs.length;
                        return (
                          <div key={di} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "6px 0",
                            borderBottom: di < allDocs.length - 1 ? `1px solid ${T.bdr}30` : "none",
                          }}>
                            {/* Checkbox */}
                            <div onClick={() => updCM("praticaChecklist", { ...checkedDocs, [d.doc]: !isChecked })} style={{
                              width: 22, height: 22, borderRadius: 5, flexShrink: 0, cursor: "pointer",
                              border: `1.5px solid ${isChecked ? T.grn : T.bdr}`,
                              background: isChecked ? `${T.grn}18` : "transparent",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, color: T.grn, fontWeight: 800,
                            }}>{isChecked ? "✓" : ""}</div>

                            {/* Doc name + file info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{
                                fontSize: 11, fontWeight: 600,
                                textDecoration: isChecked ? "line-through" : "none",
                                color: isChecked ? T.sub : T.text, lineHeight: 1.3,
                              }}>{d.doc}</div>
                              {hasFile && (
                                <div style={{ fontSize: 9, color: T.grn, marginTop: 1 }}>
                                  <I d={ICO.paperclip} /> {uploadedFiles[d.doc].name} · {uploadedFiles[d.doc].date}
                                </div>
                              )}
                            </div>

                            {/* Badge obblig/opz */}
                            {d.obblig
                              ? <span style={{ fontSize: 7, fontWeight: 800, color: T.red, background: `${T.red}10`, padding: "2px 5px", borderRadius: 3, flexShrink: 0 }}>OBBL.</span>
                              : <span style={{ fontSize: 7, fontWeight: 700, color: T.sub, background: T.bg, padding: "2px 5px", borderRadius: 3, flexShrink: 0 }}>OPZ.</span>
                            }

                            {/* Action buttons */}
                            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                              <div onClick={() => scanDoc(d.doc)} title="Scansiona" style={{
                                width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, cursor: "pointer", background: hasFile ? `${T.grn}12` : `${T.blue}08`, border: `1px solid ${hasFile ? T.grn + "30" : T.blue + "20"}`,
                              }}><I d={ICO.camera} /></div>
                              <div onClick={() => uploadDoc(d.doc)} title="Carica file" style={{
                                width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, cursor: "pointer", background: hasFile ? `${T.grn}12` : `${T.acc}08`, border: `1px solid ${hasFile ? T.grn + "30" : T.acc + "20"}`,
                              }}><I d={ICO.paperclip} /></div>
                              {hasFile && <div onClick={() => {
                                const f = uploadedFiles[d.doc];
                                if (f.dataUrl) { const w = window.open(""); w?.document.write(`<img src="${f.dataUrl}" style="max-width:100%"/>`); }
                              }} title="Visualizza" style={{
                                width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, cursor: "pointer", background: `${T.blue}08`, border: `1px solid ${T.blue}20`,
                              }}><I d={ICO.eye} /></div>}
                              {isCustom && <div onClick={() => {
                                updCM("praticaDocsCustom", customDocs.filter((_, i) => i !== di - baseDocs.length));
                              }} title="Rimuovi" style={{
                                width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 13, cursor: "pointer", background: `${T.red}08`, border: `1px solid ${T.red}20`,
                              }}>✕</div>}
                            </div>
                          </div>
                        );
                      })}

                      {/* Completamento */}
                      {obligChecked === obligCount && obligCount > 0 && (
                        <div style={{ marginTop: 8, padding: 8, background: `${T.grn}15`, borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 800, color: T.grn }}>
                          ✅ Tutti i documenti obbligatori raccolti!
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* IVA + Sconto */}
              <div style={{ background: T.card, borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${T.bdr}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, flex: 1 }}>IVA Infissi</span>
                  {[4, 10, 22].map(iv => (<div key={iv} onClick={() => updCM("ivaPerc", iv)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: pwIvaDefault === iv ? T.acc : T.card, color: pwIvaDefault === iv ? "#fff" : T.text, border: `1.5px solid ${pwIvaDefault === iv ? T.acc : T.bdr}` }}>{iv}%</div>))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, flex: 1 }}>Sconto</span>
                  {[0, 5, 10, 15, 20].map(s => (<div key={s} onClick={() => updCM("scontoPerc", s)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: pwSconto === s ? T.acc : T.card, color: pwSconto === s ? "#fff" : T.text, border: `1.5px solid ${pwSconto === s ? T.acc : T.bdr}` }}>{s === 0 ? "No" : s + "%"}</div>))}
                </div>
              </div>

              {/* Vani editor - accordion */}
              {pwVani.map((v, vi) => {
                const isEd = editingVanoId === v.id;
                const pUnit = calcolaVanoPrezzo(v, c);
                const pTot = pUnit * (v.pezzi || 1);
                const lv = v.misure?.lCentro || v.larghezza || v.l || 0;
                const hv = v.misure?.hCentro || v.altezza || v.h || 0;
                const acc = v.accessori || {};
                return (
                  <div key={v.id} style={{ background: T.card, borderRadius: 12, marginBottom: 6, border: `1.5px solid ${isEd ? T.acc : T.bdr}`, overflow: "hidden" }}>
                    {/* Row compatta */}
                    <div onClick={() => setEditingVanoId(isEd ? null : v.id)} style={{ display: "flex", alignItems: "center", padding: 12, cursor: "pointer", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${T.acc}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900, color: T.acc, flexShrink: 0 }}>{vi + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {v.nome || `Vano ${vi + 1}`}
                          <span style={{ fontWeight: 400, color: T.sub, fontSize: 10 }}> {v.tipo || "F2A"} · {v.pezzi || 1}pz</span>
                          {v.parentId && <span style={{ fontSize: 8, background: `${T.orange}15`, color: T.orange, padding: "1px 4px", borderRadius: 3, marginLeft: 4 }}>MOD</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lv}×{hv} · {v.colore || "Bianco"}{v.controtelaio && v.controtelaio !== "Nessuno" ? " · CT" : ""}{acc.tapparella?.attivo ? " · T" : ""}{acc.persiana?.attivo ? " · P" : ""}{acc.zanzariera?.attivo ? " · Z" : ""}</div>
                      </div>
                      <div style={{ textAlign: "right" as any, flexShrink: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{pwFmt(pTot)}</div>
                        {(v.pezzi || 1) > 1 && <div style={{ fontSize: 9, color: T.sub }}>€{pwFmt(pUnit)}/pz</div>}
                      </div>
                      <span style={{ fontSize: 12, color: T.sub, transform: isEd ? "rotate(180deg)" : "", transition: "0.2s" }}>▾</span>
                    </div>

                    {/* ══ EXPANDED EDITOR ══ */}
                    {isEd && (
                      <div style={{ padding: "0 12px 14px", borderTop: `1px solid ${T.bdr}` }}>

                        {/* ── FOTO · DISEGNI · PRODOTTO ── */}
                        <div id={`pw-sec-foto-${v.id}`} style={{ marginTop: 10, marginBottom: 12 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.sub, marginBottom: 6 }}><I d={ICO.camera} /> FOTO · DISEGNI · PRODOTTO</div>
                          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                            {(Array.isArray(v.foto) ? v.foto : []).map((f, fi) => (
                              <div key={fi} onClick={() => setViewingPhotoId && setViewingPhotoId(f)} style={{ minWidth: 72, height: 72, borderRadius: 8, background: `${T.blue}08`, border: `1px solid ${T.blue}20`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                                {f?.dataUrl ? <img src={f.dataUrl} style={{ width: 68, height: 58, objectFit: "cover", borderRadius: 6 }} /> : <><span style={{ fontSize: 24 }}><I d={ICO.camera} /></span><span style={{ fontSize: 7, color: T.blue }}>Foto {fi + 1}</span></>}
                              </div>
                            ))}
                            {/* Disegno tecnico */}
                            <div onClick={() => setDrawingVanoId(drawingVanoId === v.id ? null : v.id)} style={{ minWidth: 72, height: 72, borderRadius: 8, background: drawingVanoId === v.id ? `${T.purple}15` : `${T.purple}08`, border: `1.5px solid ${drawingVanoId === v.id ? T.purple : T.purple + "20"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                              <span style={{ fontSize: 24 }}><I d={ICO.edit} /></span>
                              <span style={{ fontSize: 7, color: T.purple, fontWeight: 700 }}>Disegno</span>
                            </div>
                            {/* Tipo prodotto schematic */}
                            <div style={{ minWidth: 72, height: 72, borderRadius: 8, background: `${T.grn}08`, border: `1px solid ${T.grn}20`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", position: "relative" }}>
                              <div style={{ fontSize: 20 }} dangerouslySetInnerHTML={{ __html: (() => {
                                const tipo = v.tipo || "F2A";
                                const w = 36, h = 44;
                                if (tipo.includes("2A")) return `<svg width="${w}" height="${h}"><rect x="2" y="2" width="${w-4}" height="${h-4}" fill="#e8f0fe" stroke="#333" stroke-width="2" rx="1"/><line x1="${w/2}" y1="2" x2="${w/2}" y2="${h-2}" stroke="#333" stroke-width="1.5"/><line x1="4" y1="4" x2="${w/2-1}" y2="${h-4}" stroke="#ccc" stroke-width="0.5"/><line x1="${w/2+1}" y1="4" x2="${w-4}" y2="${h-4}" stroke="#ccc" stroke-width="0.5"/></svg>`;
                                if (tipo.includes("1A") || tipo.includes("PF1A")) return `<svg width="${w}" height="${h}"><rect x="2" y="2" width="${w-4}" height="${h-4}" fill="#e8f0fe" stroke="#333" stroke-width="2" rx="1"/><line x1="4" y1="4" x2="${w-4}" y2="${h-4}" stroke="#ccc" stroke-width="0.5"/><line x1="${w-4}" y1="4" x2="4" y2="${h-4}" stroke="#ccc" stroke-width="0.5"/></svg>`;
                                if (tipo === "BOX") return `<svg width="${w}" height="${h}"><rect x="4" y="8" width="${w-14}" height="${h-18}" fill="none" stroke="#333" stroke-width="2"/><rect x="14" y="14" width="${w-14}" height="${h-18}" fill="#e8f0e8" stroke="#333" stroke-width="1.5"/><text x="${w/2}" y="${h-4}" text-anchor="middle" font-size="7" fill="#333" font-weight="700">BOX</text></svg>`;
                                return `<svg width="${w}" height="${h}"><rect x="2" y="2" width="${w-4}" height="${h-4}" fill="#e8f0fe" stroke="#333" stroke-width="2" rx="1"/></svg>`;
                              })() }} />
                              <span style={{ fontSize: 7, color: T.grn, fontWeight: 700 }}>{v.tipo || "F2A"}</span>
                            </div>
                            {/* + foto */}
                            <div onClick={() => {
                              const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.capture = "environment";
                              inp.onchange = (ev) => {
                                const file = ev.target.files[0]; if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  const nuovaFoto = { id: Date.now(), tipo: "foto", dataUrl: reader.result, nome: file.name };
                                  const fotoAttuali = Array.isArray(v.foto) ? v.foto : [];
                                  pwUpdVano(v.id, "foto", [...fotoAttuali, nuovaFoto]);
                                };
                                reader.readAsDataURL(file);
                              };
                              inp.click();
                            }} style={{ minWidth: 72, height: 72, borderRadius: 8, border: `2px dashed ${T.blue}40`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, color: T.blue, flexShrink: 0 }}>+</div>
                          </div>

                          {/* ═══ DISEGNO TECNICO v6 — CELLE + MONTANTI/TRAVERSI ═══ */}
                          {drawingVanoId === v.id && (() => {
                            const dw = v.disegno || { elements: [], selectedId: null, drawMode: null, history: [] };
                            const els = dw.elements || [];
                            const selId = dw.selectedId || null;
                            const drawMode = dw.drawMode || null; // "line"|"apertura"|"place-anta"|"place-vetro"|"place-ap"
                            const placeApType = dw._placeApType || "SX";
                            const zoom = dw._zoom || 1;
                            const panX = dw._panX || 0, panY = dw._panY || 0;
                            const canvasW = Math.min(window.innerWidth - 32, 500);
                            const GRID = 10;
                            const SNAP_R = 18;

                            const realW = lv || 1200;
                            const realH = hv || 1000;
                            const aspect = realW / realH;
                            const PAD = 24, PAD_DIM = 28;
                            const maxW = canvasW - PAD * 2 - PAD_DIM;
                            // Compute content bounds (considering multiple frames and freeLines)
                            let contentW = maxW, contentH = maxW / aspect;
                            // No height cap — use full space
                            if (contentH > maxW * 1.5) { contentH = maxW * 1.5; contentW = contentH * aspect; }
                            let fW = contentW, fH = contentH;
                            // For multi-frame: compute bounding box of all frames
                            const allFrames = els.filter(e => e.type === "rect");
                            if (allFrames.length > 1) {
                              const bx1 = Math.min(...allFrames.map(f => f.x));
                              const by1 = Math.min(...allFrames.map(f => f.y));
                              const bx2 = Math.max(...allFrames.map(f => f.x + f.w));
                              const by2 = Math.max(...allFrames.map(f => f.y + f.h));
                              fW = bx2 - bx1 + PAD; fH = by2 - by1 + PAD;
                            }
                            const baseCanvasH = Math.max(280, fH + PAD * 2 + PAD_DIM);
                            const canvasH = baseCanvasH;
                            const fX = PAD, fY = PAD;
                            const snap = (v2) => Math.round(v2 / GRID) * GRID;

                            // ══ CELL DETECTION ══
                            const frames = els.filter(e => e.type === "rect");
                            const frame = frames[0] || null; // primary frame for compat
                            const allMontanti = els.filter(e => e.type === "montante");
                            const allTraversi = els.filter(e => e.type === "traverso");
                            const TK_FRAME = 6, TK_MONT = 4, TK_ANTA = 4, TK_PORTA = 7;
                            const HM = TK_MONT / 2;

                            // ══ POLYGON from freeLines ══
                            const getPolygon = () => {
                              const lines = els.filter(e => e.type === "freeLine");
                              if (lines.length < 3) return null;
                              const pts = [];
                              const used = new Set();
                              const addP = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                              addP(lines[0].x1, lines[0].y1); addP(lines[0].x2, lines[0].y2); used.add(0);
                              for (let it = 0; it < lines.length; it++) {
                                const last = pts[pts.length - 1];
                                for (let li = 0; li < lines.length; li++) {
                                  if (used.has(li)) continue;
                                  const l = lines[li];
                                  if (Math.hypot(l.x1 - last[0], l.y1 - last[1]) < 15) { addP(l.x2, l.y2); used.add(li); break; }
                                  if (Math.hypot(l.x2 - last[0], l.y2 - last[1]) < 15) { addP(l.x1, l.y1); used.add(li); break; }
                                }
                              }
                              return pts.length >= 3 ? pts : null;
                            };
                            const poly = !frame ? getPolygon() : null;

                            // ══ Line-segment intersection helpers ══
                            const segIntersectV = (x, pts2) => {
                              // Find Y values where vertical line x=X intersects polygon edges
                              const ys = [];
                              for (let i = 0; i < pts2.length; i++) {
                                const a = pts2[i], b = pts2[(i + 1) % pts2.length];
                                const minX = Math.min(a[0], b[0]), maxX = Math.max(a[0], b[0]);
                                if (x >= minX - 1 && x <= maxX + 1 && Math.abs(b[0] - a[0]) > 0.5) {
                                  const t = (x - a[0]) / (b[0] - a[0]);
                                  if (t >= -0.01 && t <= 1.01) ys.push(a[1] + t * (b[1] - a[1]));
                                }
                              }
                              ys.sort((a2, b2) => a2 - b2);
                              return ys.length >= 2 ? [ys[0], ys[ys.length - 1]] : null;
                            };
                            const segIntersectH = (y, pts2) => {
                              const xs = [];
                              for (let i = 0; i < pts2.length; i++) {
                                const a = pts2[i], b = pts2[(i + 1) % pts2.length];
                                const minY = Math.min(a[1], b[1]), maxY = Math.max(a[1], b[1]);
                                if (y >= minY - 1 && y <= maxY + 1 && Math.abs(b[1] - a[1]) > 0.5) {
                                  const t = (y - a[1]) / (b[1] - a[1]);
                                  if (t >= -0.01 && t <= 1.01) xs.push(a[0] + t * (b[0] - a[0]));
                                }
                              }
                              xs.sort((a2, b2) => a2 - b2);
                              return xs.length >= 2 ? [xs[0], xs[xs.length - 1]] : null;
                            };

                            // ══ BSP Cell Splitting ══
                            const bspSplit = (startCells) => {
                              let cl = startCells;
                              allMontanti.forEach((m, mi) => {
                                const next = [];
                                cl.forEach(c => {
                                  const my1 = m.y1 !== undefined ? m.y1 : c.y;
                                  const my2 = m.y2 !== undefined ? m.y2 : c.y + c.h;
                                  if (m.x > c.x + HM + 2 && m.x < c.x + c.w - HM - 2 && my1 <= c.y + 2 && my2 >= c.y + c.h - 2) {
                                    next.push({ x: c.x, y: c.y, w: m.x - HM - c.x, h: c.h, id: c.id + "L" + mi });
                                    next.push({ x: m.x + HM, y: c.y, w: c.x + c.w - m.x - HM, h: c.h, id: c.id + "R" + mi });
                                  } else { next.push(c); }
                                });
                                cl = next;
                              });
                              allTraversi.forEach((t, ti) => {
                                const next = [];
                                cl.forEach(c => {
                                  const tx1 = t.x1 !== undefined ? t.x1 : c.x;
                                  const tx2 = t.x2 !== undefined ? t.x2 : c.x + c.w;
                                  if (t.y > c.y + HM + 2 && t.y < c.y + c.h - HM - 2 && tx1 <= c.x + 2 && tx2 >= c.x + c.w - 2) {
                                    next.push({ x: c.x, y: c.y, w: c.w, h: t.y - HM - c.y, id: c.id + "T" + ti });
                                    next.push({ x: c.x, y: t.y + HM, w: c.w, h: c.y + c.h - t.y - HM, id: c.id + "B" + ti });
                                  } else { next.push(c); }
                                });
                                cl = next;
                              });
                              return cl;
                            };
                            const getCells = () => {
                              // Multi-frame support (zoppi): each frame gets its own cells
                              if (frames.length > 0) {
                                let allCells = [];
                                frames.forEach((fr, fi) => {
                                  const iX = fr.x + TK_FRAME, iY = fr.y + TK_FRAME;
                                  const iW = fr.w - TK_FRAME * 2, iH = fr.h - TK_FRAME * 2;
                                  if (iW < 4 || iH < 4) return;
                                  const startCells = [{ x: iX, y: iY, w: iW, h: iH, id: `F${fi}` }];
                                  allCells = allCells.concat(bspSplit(startCells));
                                });
                                return allCells;
                              }
                              // Polygon cells
                              if (poly) {
                                const allX2 = poly.map(p => p[0]), allY2 = poly.map(p => p[1]);
                                const pL = Math.min(...allX2) + 2, pR = Math.max(...allX2) - 2;
                                const pT = Math.min(...allY2) + 2, pB = Math.max(...allY2) - 2;
                                return bspSplit([{ x: pL, y: pT, w: pR - pL, h: pB - pT, id: "P0" }]);
                              }
                              return [];
                            };
                            const cells = getCells();

                            const findCellAt = (mx, my) => {
                              return cells.find(c2 => mx >= c2.x && mx <= c2.x + c2.w && my >= c2.y && my <= c2.y + c2.h);
                            };

                            // ══ Snap points ══
                            const getSnapPoints = () => {
                              const pts = [];
                              frames.forEach(fr => {
                                const fx = fr.x, fy = fr.y, fw = fr.w, fh2 = fr.h;
                                pts.push({x:fx,y:fy},{x:fx+fw,y:fy},{x:fx,y:fy+fh2},{x:fx+fw,y:fy+fh2});
                                pts.push({x:fx+fw/2,y:fy},{x:fx+fw/2,y:fy+fh2},{x:fx,y:fy+fh2/2},{x:fx+fw,y:fy+fh2/2});
                              });
                              cells.forEach(c2 => {
                                pts.push({x:c2.x,y:c2.y},{x:c2.x+c2.w,y:c2.y},{x:c2.x,y:c2.y+c2.h},{x:c2.x+c2.w,y:c2.y+c2.h});
                                pts.push({x:c2.x+c2.w/2,y:c2.y},{x:c2.x+c2.w/2,y:c2.y+c2.h});
                                pts.push({x:c2.x,y:c2.y+c2.h/2},{x:c2.x+c2.w,y:c2.y+c2.h/2});
                              });
                              els.filter(e => e.type === "freeLine" || e.type === "apLine").forEach(l => {
                                pts.push({x:l.x1,y:l.y1},{x:l.x2,y:l.y2});
                              });
                              return pts;
                            };
                            const findSnap = (mx, my) => {
                              const pts = getSnapPoints();
                              let best = null, bestD = SNAP_R;
                              pts.forEach(p => { const d = Math.hypot(p.x - mx, p.y - my); if (d < bestD) { bestD = d; best = p; } });
                              return best;
                            };

                            // ══ State helpers ══
                            const pushHistory = () => {
                              const hist = dw.history || [];
                              return [...hist.slice(-20), JSON.stringify(els)];
                            };
                            const setDW = (newEls, extra = {}) => {
                              const hist = pushHistory();
                              pwUpdVano(v.id, "disegno", { ...dw, elements: newEls, history: hist, ...extra });
                            };
                            const setMode = (extra) => pwUpdVano(v.id, "disegno", { ...dw, ...extra });

                            const undo = () => {
                              const hist = dw.history || [];
                              if (hist.length === 0) return;
                              const prev = JSON.parse(hist[hist.length - 1]);
                              pwUpdVano(v.id, "disegno", { ...dw, elements: prev, history: hist.slice(0, -1), selectedId: null });
                            };

                            const getSvgXY = (e2, svg) => {
                              const r2 = svg.getBoundingClientRect();
                              const clientX = e2.touches ? e2.touches[0].clientX : e2.clientX;
                              const clientY = e2.touches ? e2.touches[0].clientY : e2.clientY;
                              // Convert screen coords to viewBox coords
                              const px = clientX - r2.left;
                              const py = clientY - r2.top;
                              const vbW = canvasW / zoom, vbH = canvasH / zoom;
                              return { mx: panX + px / r2.width * vbW, my: panY + py / r2.height * vbH };
                            };

                            // ── Drag ──
                            const onDrag = (e2, elId) => {
                              if (drawMode) return;
                              e2.stopPropagation(); e2.preventDefault();
                              const svg = e2.currentTarget.closest("svg");
                              if (!svg) return;
                              const el = els.find(x => x.id === elId);
                              if (!el) return;
                              setMode({ selectedId: elId });
                              const { mx: sx, my: sy } = getSvgXY(e2, svg);
                              const orig = { ...el };
                              let latestEls = els;
                              const onM = (ev) => {
                                ev.preventDefault();
                                const { mx, my } = getSvgXY(ev, svg);
                                const dx = snap(mx - sx), dy = snap(my - sy);
                                const upd = els.map(x => {
                                  if (x.id !== elId) return x;
                                  if (x.type === "montante") {
                                    const newX = snap(orig.x + dx);
                                    // Recalculate y1/y2 from polygon if present
                                    if (poly) {
                                      const ys = segIntersectV(newX, poly);
                                      if (ys) return { ...x, x: newX, y1: ys[0], y2: ys[1] };
                                    }
                                    return { ...x, x: newX };
                                  }
                                  if (x.type === "traverso") {
                                    const newY = snap(orig.y + dy);
                                    if (poly) {
                                      const xs2 = segIntersectH(newY, poly);
                                      if (xs2) return { ...x, y: newY, x1: xs2[0], x2: xs2[1] };
                                    }
                                    return { ...x, y: newY };
                                  }
                                  if (x.type === "circle") return { ...x, cx: orig.cx + dx, cy: orig.cy + dy };
                                  if (x.x1 !== undefined) return { ...x, x1: orig.x1 + dx, y1: orig.y1 + dy, x2: orig.x2 + dx, y2: orig.y2 + dy };
                                  if (x.x !== undefined) return { ...x, x: orig.x + dx, y: orig.y + dy };
                                  return x;
                                });
                                latestEls = upd;
                                // Live dim for montante/traverso
                                let dragDim = null;
                                if (el.type === "montante") {
                                  const newX = snap(orig.x + dx);
                                  if (frame) {
                                    const innerW = frame.w - TK_FRAME * 2;
                                    const posRatio = innerW > 0 ? (newX - frame.x - TK_FRAME) / innerW : 0.5;
                                    const leftMM = Math.round(Math.max(0, Math.min(realW, posRatio * realW)));
                                    const rightMM = realW - leftMM;
                                    const my1 = el.y1 !== undefined ? el.y1 : frame.y;
                                    const my2 = el.y2 !== undefined ? el.y2 : frame.y + frame.h;
                                    dragDim = { type: "v", x: newX, y1: my1, y2: my2, leftMM, rightMM };
                                  } else if (poly) {
                                    const pxs = poly.map(p => p[0]);
                                    const pL = Math.min(...pxs), pR = Math.max(...pxs);
                                    const posRatio = pR > pL ? (newX - pL) / (pR - pL) : 0.5;
                                    const leftMM = Math.round(Math.max(0, Math.min(realW, posRatio * realW)));
                                    const rightMM = realW - leftMM;
                                    const ys = segIntersectV(newX, poly);
                                    const my1 = ys ? ys[0] : Math.min(...poly.map(p => p[1]));
                                    const my2 = ys ? ys[1] : Math.max(...poly.map(p => p[1]));
                                    dragDim = { type: "v", x: newX, y1: my1, y2: my2, leftMM, rightMM };
                                  }
                                }
                                if (el.type === "traverso") {
                                  const newY = snap(orig.y + dy);
                                  if (frame) {
                                    const innerH = frame.h - TK_FRAME * 2;
                                    const posRatio = innerH > 0 ? (newY - frame.y - TK_FRAME) / innerH : 0.5;
                                    const topMM = Math.round(Math.max(0, Math.min(realH, posRatio * realH)));
                                    const botMM = realH - topMM;
                                    const tx1 = el.x1 !== undefined ? el.x1 : frame.x;
                                    const tx2 = el.x2 !== undefined ? el.x2 : frame.x + frame.w;
                                    dragDim = { type: "h", y: newY, x1: tx1, x2: tx2, topMM, botMM };
                                  } else if (poly) {
                                    const pys = poly.map(p => p[1]);
                                    const pT = Math.min(...pys), pB = Math.max(...pys);
                                    const posRatio = pB > pT ? (newY - pT) / (pB - pT) : 0.5;
                                    const topMM = Math.round(Math.max(0, Math.min(realH, posRatio * realH)));
                                    const botMM = realH - topMM;
                                    const xs2 = segIntersectH(newY, poly);
                                    const tx1 = xs2 ? xs2[0] : Math.min(...poly.map(p => p[0]));
                                    const tx2 = xs2 ? xs2[1] : Math.max(...poly.map(p => p[0]));
                                    dragDim = { type: "h", y: newY, x1: tx1, x2: tx2, topMM, botMM };
                                  }
                                }
                                pwUpdVano(v.id, "disegno", { ...dw, elements: upd, selectedId: elId, _dragDim: dragDim });
                              };
                              const onU = () => {
                                document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU);
                                document.removeEventListener("touchmove", onM); document.removeEventListener("touchend", onU);
                                pwUpdVano(v.id, "disegno", { ...dw, elements: latestEls, selectedId: elId, _dragDim: null });
                              };
                              document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
                              document.addEventListener("touchmove", onM, { passive: false }); document.addEventListener("touchend", onU);
                            };

                            // ── SVG Click ──
                            const onSvgClick = (e2) => {
                              const svg = e2.currentTarget;
                              const { mx, my } = getSvgXY(e2, svg);

                              // Place montante/traverso — click on cell OR polygon
                              if (drawMode === "place-mont") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cx = snap(mx);
                                  const clampedX = Math.max(cell.x + 10, Math.min(cell.x + cell.w - 10, cx));
                                  // If polygon exists, clip montante to polygon edges
                                  if (poly) {
                                    const ys = segIntersectV(clampedX, poly);
                                    if (ys) setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: ys[0], y2: ys[1] }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "montante", x: clampedX, y1: cell.y, y2: cell.y + cell.h }]);
                                  }
                                } else if (poly) {
                                  // No cells yet but polygon exists — clip to polygon
                                  const cx = snap(mx);
                                  const ys = segIntersectV(cx, poly);
                                  if (ys) setDW([...els, { id: Date.now(), type: "montante", x: cx, y1: ys[0], y2: ys[1] }]);
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "montante", x: snap(mx), y1: fY, y2: fY + fH }]);
                                }
                                return;
                              }
                              if (drawMode === "place-trav") {
                                const cell = findCellAt(mx, my);
                                if (cell) {
                                  const cy = snap(my);
                                  const clampedY = Math.max(cell.y + 10, Math.min(cell.y + cell.h - 10, cy));
                                  if (poly) {
                                    const xs = segIntersectH(clampedY, poly);
                                    if (xs) setDW([...els, { id: Date.now(), type: "traverso", y: clampedY, x1: xs[0], x2: xs[1] }]);
                                  } else {
                                    setDW([...els, { id: Date.now(), type: "traverso", y: clampedY, x1: cell.x, x2: cell.x + cell.w }]);
                                  }
                                } else if (poly) {
                                  const cy = snap(my);
                                  const xs = segIntersectH(cy, poly);
                                  if (xs) setDW([...els, { id: Date.now(), type: "traverso", y: cy, x1: xs[0], x2: xs[1] }]);
                                } else if (!frame) {
                                  setDW([...els, { id: Date.now(), type: "traverso", y: snap(my), x1: fX, x2: fX + fW }]);
                                }
                                return;
                              }

                              // Place modes — click on cell OR polygon fallback for complex shapes
                              if (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") {
                                let cell = findCellAt(mx, my);
                                if (!cell && cells.length === 0) {
                                  // Extract polygon from freeLines
                                  const lines = els.filter(e => e.type === "freeLine");
                                  if (lines.length >= 3) {
                                    // Build ordered point chain from connected lines
                                    const pts = [];
                                    const used = new Set();
                                    const addPt = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                    // Start with first line
                                    addPt(lines[0].x1, lines[0].y1);
                                    addPt(lines[0].x2, lines[0].y2);
                                    used.add(0);
                                    for (let iter = 0; iter < lines.length; iter++) {
                                      const last = pts[pts.length - 1];
                                      for (let li = 0; li < lines.length; li++) {
                                        if (used.has(li)) continue;
                                        const l = lines[li];
                                        const d1 = Math.hypot(l.x1 - last[0], l.y1 - last[1]);
                                        const d2 = Math.hypot(l.x2 - last[0], l.y2 - last[1]);
                                        if (d1 < 15) { addPt(l.x2, l.y2); used.add(li); break; }
                                        if (d2 < 15) { addPt(l.x1, l.y1); used.add(li); break; }
                                      }
                                    }
                                    if (pts.length >= 3) {
                                      cell = { id: "poly", poly: pts };
                                    }
                                  }
                                  // Fallback to bbox if polygon extraction failed
                                  if (!cell) {
                                    const allLines = els.filter(e => e.type === "freeLine" || e.type === "apLine");
                                    if (allLines.length > 0) {
                                      const allX = allLines.flatMap(l => [l.x1, l.x2]);
                                      const allY = allLines.flatMap(l => [l.y1, l.y2]);
                                      cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                    }
                                  }
                                }
                                if (!cell) return;
                                
                                // Polygon shape handling
                                if (cell.poly) {
                                  if (drawMode === "place-anta" || drawMode === "place-porta") {
                                    const newEls = els.filter(e => e.type !== "polyAnta");
                                    newEls.push({ id: Date.now(), type: "polyAnta", poly: cell.poly, subType: drawMode === "place-porta" ? "porta" : undefined });
                                    setDW(newEls);
                                  } else if (drawMode === "place-vetro") {
                                    const newEls = els.filter(e => e.type !== "polyGlass");
                                    newEls.push({ id: Date.now(), type: "polyGlass", poly: cell.poly });
                                    setDW(newEls);
                                  } else if (drawMode === "place-persiana") {
                                    const newEls = els.filter(e => e.type !== "polyPersiana");
                                    newEls.push({ id: Date.now(), type: "polyPersiana", poly: cell.poly });
                                    setDW(newEls);
                                  }
                                  return;
                                }
                                
                                // Match elements to cell by position overlap (BSP IDs change dynamically)
                                const inCell = (el2) => el2.x !== undefined && el2.w !== undefined &&
                                  el2.x >= cell.x - 2 && el2.y >= cell.y - 2 &&
                                  el2.x + el2.w <= cell.x + cell.w + 2 && el2.y + el2.h <= cell.y + cell.h + 2;
                                
                                // Regular cell handling
                                if (drawMode === "place-anta") {
                                  const existingAnta = els.find(e => (e.type === "innerRect" || e.type === "persiana") && inCell(e));
                                  if (existingAnta) {
                                    const midX = snap(cell.x + cell.w / 2);
                                    const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana" || e.type === "glass") && inCell(e)));
                                    newEls.push({ id: Date.now(), type: "montante", x: midX, y1: cell.y - HM, y2: cell.y + cell.h + HM });
                                    setDW(newEls);
                                  } else {
                                    const newEls = [...els];
                                    newEls.push({ id: Date.now(), type: "innerRect", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                    setDW(newEls);
                                  }
                                } else if (drawMode === "place-porta") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "innerRect", subType: "porta", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                  setDW(newEls);
                                } else if (drawMode === "place-persiana") {
                                  const newEls = els.filter(e => !((e.type === "innerRect" || e.type === "persiana") && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "persiana", x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2, cellId: cell.id });
                                  setDW(newEls);
                                } else if (drawMode === "place-vetro") {
                                  const anta = els.find(e => (e.type === "innerRect") && inCell(e));
                                  const tk = anta ? (anta.subType === "porta" ? TK_PORTA : TK_ANTA) : 1;
                                  const base = anta || { x: cell.x + 1, y: cell.y + 1, w: cell.w - 2, h: cell.h - 2 };
                                  const newEls = els.filter(e => !(e.type === "glass" && inCell(e)));
                                  newEls.push({ id: Date.now(), type: "glass", x: base.x + tk, y: base.y + tk, w: base.w - tk * 2, h: base.h - tk * 2, cellId: cell.id });
                                  setDW(newEls);
                                }
                                return;
                              }

                              if (drawMode === "place-ap") {
                                let cell = findCellAt(mx, my);
                                if (!cell && cells.length === 0) {
                                  const lines = els.filter(e => e.type === "freeLine" || e.type === "apLine");
                                  if (lines.length > 0) {
                                    const allX = lines.flatMap(l => [l.x1, l.x2]);
                                    const allY = lines.flatMap(l => [l.y1, l.y2]);
                                    cell = { x: Math.min(...allX), y: Math.min(...allY), w: Math.max(...allX) - Math.min(...allX), h: Math.max(...allY) - Math.min(...allY), id: "bbox" };
                                  }
                                }
                                if (!cell) return;
                                const t = Date.now();
                                // Remove old aperture elements in this cell by position
                                const inC = (el2) => el2.x !== undefined ? (el2.x >= cell.x - 3 && el2.x <= cell.x + cell.w + 3 && el2.y >= cell.y - 3 && el2.y <= cell.y + cell.h + 3) :
                                  (el2.x1 !== undefined && el2.x1 >= cell.x - 3 && el2.x1 <= cell.x + cell.w + 3 && el2.y1 >= cell.y - 3 && el2.y1 <= cell.y + cell.h + 3);
                                const newEls = els.filter(e => !((e.type === "apLine" || e.type === "apLabel") && inC(e)));
                                const P = 6;
                                const L = cell.x + P, R = cell.x + cell.w - P;
                                const T2 = cell.y + P, B = cell.y + cell.h - P;
                                const MX = cell.x + cell.w / 2, MY = cell.y + cell.h / 2;
                                const ap = placeApType;
                                if (ap === "SX") {
                                  // Cardine sinistro: triangolo simmetrico, cardine a SX
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: R, y2: B, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: L, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX - cell.w * 0.2, y: MY + 5, label: "← SX", cellId: cell.id });
                                } else if (ap === "DX") {
                                  // Cardine destro: triangolo simmetrico, cardine a DX
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: R, y2: B, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX + cell.w * 0.2, y: MY + 5, label: "DX →", cellId: cell.id });
                                } else if (ap === "RIB") {
                                  // Ribalta: triangolo simmetrico dal basso-centro verso alto
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: T2, x2: R, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 1, type: "apLine", x1: MX, y1: B, x2: L, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: MX, y1: B, x2: R, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY + 5, label: "↕ RIB", cellId: cell.id });
                                } else if (ap === "OB") {
                                  // Anta-ribalta: SX simmetrico (solido) + RIB (tratteggiato)
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: B, x2: MX, y2: T2, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: MX, y1: B, x2: L, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 2, type: "apLine", x1: MX, y1: B, x2: R, y2: T2, cellId: cell.id, dash: true });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY, label: "↙↕ OB", cellId: cell.id });
                                } else if (ap === "ALZ") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: MY, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R - 12, y1: MY - 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: R - 12, y1: MY + 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY - 14, label: "→ ALZ", cellId: cell.id });
                                } else if (ap === "SCO") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: MY, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: L + 10, y1: MY - 8, x2: L, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLine", x1: R - 10, y1: MY - 8, x2: R, y2: MY, cellId: cell.id });
                                  newEls.push({ id: t + 3, type: "apLabel", x: MX, y: MY - 14, label: "↔ SCO", cellId: cell.id });
                                } else if (ap === "FISSO") {
                                  newEls.push({ id: t, type: "apLine", x1: L, y1: T2, x2: R, y2: B, cellId: cell.id });
                                  newEls.push({ id: t + 1, type: "apLine", x1: R, y1: T2, x2: L, y2: B, cellId: cell.id });
                                  newEls.push({ id: t + 2, type: "apLabel", x: MX, y: MY, label: "FISSO", cellId: cell.id });
                                }
                                setDW(newEls);
                                return;
                              }

                              // Line / apertura draw modes
                              if (drawMode === "line" || drawMode === "apertura") {
                                const sp = findSnap(mx, my);
                                let px = sp ? sp.x : snap(mx);
                                let py = sp ? sp.y : snap(my);
                                const pending = dw._pendingLine;
                                if (pending) {
                                  // Snap to H/V if within 8px
                                  const adx = Math.abs(px - pending.x1), ady = Math.abs(py - pending.y1);
                                  if (adx < 8 && ady > 8) px = pending.x1; // vertical snap
                                  if (ady < 8 && adx > 8) py = pending.y1; // horizontal snap
                                }
                                if (!pending) {
                                  setMode({ _pendingLine: { x1: px, y1: py } });
                                } else {
                                  if (px === pending.x1 && py === pending.y1) return;
                                  const lineType = drawMode === "apertura" ? "apLine" : "freeLine";
                                  setDW([...els, { id: Date.now(), type: lineType, x1: pending.x1, y1: pending.y1, x2: px, y2: py }], { _pendingLine: { x1: px, y1: py } });
                                }
                                return;
                              }

                              // Default — deselect
                              setMode({ selectedId: null });
                            };

                            // ══ Styles ══
                            const bs = (active = false) => ({ padding: "5px 9px", borderRadius: 6, border: `1.5px solid ${active ? T.purple : T.bdr}`, background: active ? `${T.purple}12` : T.card, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: active ? T.purple : T.text });
                            const bAp = (active = false) => ({ padding: "5px 9px", borderRadius: 6, border: `1.5px solid ${active ? T.blue : T.blue + "30"}`, background: active ? `${T.blue}12` : `${T.blue}05`, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: T.blue });
                            const bDel = (c2 = T.red) => ({ padding: "5px 9px", borderRadius: 6, border: `1px solid ${c2}30`, background: `${c2}08`, fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as any, color: c2 });

                            const cursorMode = drawMode === "line" || drawMode === "apertura" ? "crosshair" : drawMode ? "pointer" : "default";

                            return (
                              <div style={{ marginTop: 8, background: T.card, borderRadius: 12, border: `1.5px solid ${T.purple}`, overflow: "hidden" }}>
                                {/* Header */}
                                <div style={{ padding: "8px 12px", background: `${T.purple}10`, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14 }}><I d={ICO.edit} /></span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: T.purple, flex: 1 }}>Disegno — {v.nome || "Vano"} ({realW}×{realH})</span>
                                  {drawMode === "line" && <span style={{ fontSize: 9, background: "#333", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>╱ STRUTTURA</span>}
                                  {drawMode === "apertura" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}>↗ APERTURA</span>}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") && <span style={{ fontSize: 9, background: T.grn, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}><I d={ICO.chevronUp} /> CLICK su cella</span>}
                                  {(drawMode === "place-mont" || drawMode === "place-trav") && <span style={{ fontSize: 9, background: "#555", color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}><I d={ICO.chevronUp} /> {drawMode === "place-mont" ? "MONTANTE" : "TRAVERSO"} — click cella</span>}
                                  {drawMode === "place-ap" && <span style={{ fontSize: 9, background: T.blue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 800 }}><I d={ICO.chevronUp} /> {placeApType} — click cella</span>}
                                  <span onClick={() => setDrawingVanoId(null)} style={{ fontSize: 16, cursor: "pointer", color: T.sub, padding: "2px 6px" }}>✕</span>
                                </div>

                                {/* Row 1: Struttura */}
                                <div style={{ display: "flex", gap: 3, padding: "5px 8px", overflowX: "auto" }}>
                                  <div onClick={() => {
                                    if (frames.length === 0) {
                                      // First telaio: fill canvas
                                      setDW([...els, { id: Date.now(), type: "rect", x: fX, y: fY, w: fW, h: fH }]);
                                    } else {
                                      // Additional telaio (zoppo): add offset
                                      const lastF = frames[frames.length - 1];
                                      const nw = lastF.w * 0.6, nh = lastF.h * 0.5;
                                      const nx = lastF.x + lastF.w - TK_FRAME;
                                      const ny = lastF.y + lastF.h - nh;
                                      setDW([...els, { id: Date.now(), type: "rect", x: snap(nx), y: snap(ny), w: snap(nw), h: snap(nh) }]);
                                    }
                                  }} style={bs()}>▭ Telaio</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-mont" ? null : "place-mont", _pendingLine: null })} style={bs(drawMode === "place-mont")}>┃ Mont.</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-trav" ? null : "place-trav", _pendingLine: null })} style={bs(drawMode === "place-trav")}>━ Trav.</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-anta" ? null : "place-anta", _pendingLine: null })} style={bs(drawMode === "place-anta")}><I d={ICO.grid} /> Anta</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-porta" ? null : "place-porta", _pendingLine: null })} style={bs(drawMode === "place-porta")}><I d={ICO.square} /> Porta</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-persiana" ? null : "place-persiana", _pendingLine: null })} style={bs(drawMode === "place-persiana")}>▤ Pers.</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "place-vetro" ? null : "place-vetro", _pendingLine: null })} style={bs(drawMode === "place-vetro")}><I d={ICO.gem} /> Vetro</div>

                                  <div onClick={() => {
                                    const cx = frame ? frame.x + frame.w / 2 : fX + fW / 2;
                                    const cy = frame ? frame.y + frame.h / 2 : fY + fH / 2;
                                    setDW([...els, { id: Date.now(), type: "circle", cx, cy, r: Math.min(fW, fH) / 4 }]);
                                  }} style={bs()}>⭕ Oblò</div>

                                  <div onClick={() => setMode({ drawMode: drawMode === "line" ? null : "line", _pendingLine: null })} style={bs(drawMode === "line")}>╱ Linea</div>

                                  <div onClick={() => {
                                    const txt = prompt("Testo etichetta:");
                                    if (!txt) return;
                                    const cx2 = frame ? frame.x + frame.w / 2 : fX + fW / 2;
                                    const cy2 = frame ? frame.y + frame.h / 2 : fY + fH / 2;
                                    setDW([...els, { id: Date.now(), type: "label", x: cx2, y: cy2, text: txt, fontSize: 11 }]);
                                  }} style={bs()}>Aa Testo</div>

                                  <div onClick={() => {
                                    const nEls = els.filter(e => e.type !== "dim");
                                    if (frame) {
                                      nEls.push(
                                        { id: Date.now() + 300, type: "dim", x1: frame.x, y1: frame.y + frame.h + 14, x2: frame.x + frame.w, y2: frame.y + frame.h + 14, label: String(realW) },
                                        { id: Date.now() + 301, type: "dim", x1: frame.x + frame.w + 14, y1: frame.y, x2: frame.x + frame.w + 14, y2: frame.y + frame.h, label: String(realH) }
                                      );
                                      const iT = frame.y + TK_FRAME, iL = frame.x + TK_FRAME;
                                      const topCells = cells.filter(c2 => Math.abs(c2.y - iT) < 4).sort((a, b) => a.x - b.x);
                                      if (topCells.length > 1) topCells.forEach((c2, i) => nEls.push({ id: Date.now() + 310 + i, type: "dim", x1: c2.x, y1: frame.y - 10, x2: c2.x + c2.w, y2: frame.y - 10, label: String(Math.round(c2.w / fW * realW)) }));
                                      const leftCells = cells.filter(c2 => Math.abs(c2.x - iL) < 4).sort((a, b) => a.y - b.y);
                                      if (leftCells.length > 1) leftCells.forEach((c2, i) => nEls.push({ id: Date.now() + 330 + i, type: "dim", x1: frame.x - 14, y1: c2.y, x2: frame.x - 14, y2: c2.y + c2.h, label: String(Math.round(c2.h / fH * realH)) }));
                                    } else if (poly) {
                                      const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
                                      const bL = Math.min(...xs), bR = Math.max(...xs), bT = Math.min(...ys), bB = Math.max(...ys);
                                      // Bounding box total dims
                                      nEls.push(
                                        { id: Date.now() + 300, type: "dim", x1: bL, y1: bB + 14, x2: bR, y2: bB + 14, label: String(realW) },
                                        { id: Date.now() + 301, type: "dim", x1: bR + 14, y1: bT, x2: bR + 14, y2: bB, label: String(realH) }
                                      );
                                      // Per-segment dimensions (each freeLine side)
                                      const freeLines = els.filter(e => e.type === "freeLine");
                                      const totalPx = Math.hypot(bR - bL, bB - bT);
                                      freeLines.forEach((fl, fi) => {
                                        const dx2 = fl.x2 - fl.x1, dy2 = fl.y2 - fl.y1;
                                        const segPx = Math.hypot(dx2, dy2);
                                        // Convert px to mm using diagonal ratio
                                        const diagMM = Math.hypot(realW, realH);
                                        const segMM = Math.round(segPx / totalPx * diagMM);
                                        // Offset dim line outward from polygon center
                                        const cx = (bL + bR) / 2, cy = (bT + bB) / 2;
                                        const mx = (fl.x1 + fl.x2) / 2, my = (fl.y1 + fl.y2) / 2;
                                        const toCx = cx - mx, toCy = cy - my;
                                        const dist = Math.hypot(toCx, toCy) || 1;
                                        const offX = -toCx / dist * 16, offY = -toCy / dist * 16;
                                        nEls.push({ id: Date.now() + 350 + fi, type: "dim", x1: fl.x1 + offX, y1: fl.y1 + offY, x2: fl.x2 + offX, y2: fl.y2 + offY, label: String(segMM) });
                                      });
                                      // Per-cell dims
                                      if (cells.length > 1) {
                                        const topCells = cells.filter(c2 => Math.abs(c2.y - bT) < 6).sort((a, b) => a.x - b.x);
                                        if (topCells.length > 1) topCells.forEach((c2, i) => nEls.push({ id: Date.now() + 370 + i, type: "dim", x1: c2.x, y1: bT - 10, x2: c2.x + c2.w, y2: bT - 10, label: String(Math.round(c2.w / (bR - bL) * realW)) }));
                                        const leftCells = cells.filter(c2 => Math.abs(c2.x - bL) < 6).sort((a, b) => a.y - b.y);
                                        if (leftCells.length > 1) leftCells.forEach((c2, i) => nEls.push({ id: Date.now() + 390 + i, type: "dim", x1: bL - 14, y1: c2.y, x2: bL - 14, y2: c2.y + c2.h, label: String(Math.round(c2.h / (bB - bT) * realH)) }));
                                      }
                                    }
                                    setDW(nEls);
                                  }} style={bs()}>↔ Misure</div>
                                </div>

                                {/* Row 2: Aperture (blu) */}
                                <div style={{ display: "flex", gap: 3, padding: "2px 8px 5px", overflowX: "auto" }}>
                                  <div onClick={() => setMode({ drawMode: drawMode === "apertura" ? null : "apertura", _pendingLine: null })} style={bAp(drawMode === "apertura")}>↗ Disegna</div>
                                  <span style={{ fontSize: 9, color: T.sub, alignSelf: "center" }}>|</span>
                                  {[
                                    { id: "SX", l: "← SX" }, { id: "DX", l: "DX →" }, { id: "RIB", l: "↕ Rib." },
                                    { id: "OB", l: "↙↕ OB" }, { id: "ALZ", l: "→ Alz." }, { id: "SCO", l: "↔ Sco." }, { id: "FISSO", l: "✕ Fisso" },
                                  ].map(ap => (
                                    <div key={ap.id} onClick={() => setMode({ drawMode: "place-ap", _placeApType: ap.id, _pendingLine: null })} style={bAp(drawMode === "place-ap" && placeApType === ap.id)}>{ap.l}</div>
                                  ))}
                                </div>

                                {/* Row 3: Azioni */}
                                <div style={{ display: "flex", gap: 3, padding: "0 8px 6px", borderBottom: `1px solid ${T.bdr}` }}>
                                  <div onClick={undo} style={bDel(T.acc)}>↩ Annulla</div>
                                  {selId && <div onClick={() => setDW(els.filter(e => e.id !== selId), { selectedId: null })} style={bDel()}><I d={ICO.trash} /> Elimina sel.</div>}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setDW([], { selectedId: null, drawMode: null, _pendingLine: null, history: [] })} style={bDel()}><I d={ICO.trash} /> Reset</div>
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => setMode({ _zoom: Math.max(0.5, (zoom || 1) - 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>−</div>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: T.sub, minWidth: 32, textAlign: "center" }}>{Math.round(zoom * 100)}%</div>
                                  <div onClick={() => setMode({ _zoom: Math.min(4, (zoom || 1) + 0.25) })} style={{ ...bs(), fontSize: 14, padding: "3px 8px" }}>+</div>
                                  <div onClick={() => setMode({ _zoom: 1, _panX: 0, _panY: 0 })} style={{ ...bs(), fontSize: 9 }}>Fit</div>
                                </div>

                                {/* SVG Canvas — zoomable with wheel + pannable */}
                                <div style={{ overflow: "auto", position: "relative", maxHeight: "70vh", border: `1px solid ${T.bdr}` }}>
                                <svg width={canvasW * Math.max(1, zoom)} height={canvasH * Math.max(1, zoom)}
                                  viewBox={`${panX} ${panY} ${canvasW / zoom} ${canvasH / zoom}`}
                                  style={{ display: "block", background: "#fff", touchAction: "none", cursor: drawMode ? cursorMode : (zoom > 1 ? "grab" : "default") }}
                                  onClick={onSvgClick}
                                  onWheel={(e2) => {
                                    e2.preventDefault();
                                    const newZoom = Math.max(0.5, Math.min(4, zoom + (e2.deltaY < 0 ? 0.15 : -0.15)));
                                    setMode({ _zoom: newZoom });
                                  }}
                                  onMouseDown={(e2) => {
                                    // Pan with middle mouse or shift+left
                                    if (e2.button === 1 || (e2.shiftKey && e2.button === 0)) {
                                      e2.preventDefault();
                                      const sx = e2.clientX, sy = e2.clientY;
                                      const sp = panX, spp = panY;
                                      const onPM = (ev) => {
                                        const ndx = (ev.clientX - sx) / zoom;
                                        const ndy = (ev.clientY - sy) / zoom;
                                        pwUpdVano(v.id, "disegno", { ...dw, _panX: sp - ndx, _panY: spp - ndy });
                                      };
                                      const onPU = () => { document.removeEventListener("mousemove", onPM); document.removeEventListener("mouseup", onPU); };
                                      document.addEventListener("mousemove", onPM);
                                      document.addEventListener("mouseup", onPU);
                                    }
                                  }}
                                  onMouseMove={(e2) => {
                                    if (!dw._pendingLine || !(drawMode === "line" || drawMode === "apertura")) return;
                                    const svg = e2.currentTarget;
                                    const { mx: gmx, my: gmy } = getSvgXY(e2, svg);
                                    let gx = snap(gmx), gy = snap(gmy);
                                    const p = dw._pendingLine;
                                    if (Math.abs(gx - p.x1) < 8 && Math.abs(gy - p.y1) > 8) gx = p.x1;
                                    if (Math.abs(gy - p.y1) < 8 && Math.abs(gx - p.x1) > 8) gy = p.y1;
                                    const deg = Math.round(Math.atan2(-(gy - p.y1), gx - p.x1) * 180 / Math.PI);
                                    const len = Math.round(Math.hypot(gx - p.x1, gy - p.y1) / fW * realW);
                                    if (dw._guideX !== gx || dw._guideY !== gy) {
                                      pwUpdVano(v.id, "disegno", { ...dw, _guideX: gx, _guideY: gy, _guideDeg: deg, _guideLen: len });
                                    }
                                  }}
                                  onMouseLeave={() => { if (dw._guideX != null) pwUpdVano(v.id, "disegno", { ...dw, _guideX: null, _guideY: null }); }}>
                                  <defs>
                                    <pattern id={`dg-${v.id}`} width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                                      <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                                    </pattern>
                                    {poly && <clipPath id={`polyClip-${v.id}`}><polygon points={poly.map(p => p.join(",")).join(" ")} /></clipPath>}
                                  </defs>
                                  <rect width={canvasW} height={canvasH} fill={`url(#dg-${v.id})`} />

                                  {/* Cell highlights in place mode — clipped to polygon if present */}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-ap" || drawMode === "place-mont" || drawMode === "place-trav" || drawMode === "place-porta" || drawMode === "place-persiana") && cells.length > 0 && (
                                    <g clipPath={poly ? `url(#polyClip-${v.id})` : undefined}>
                                      {cells.map(c2 => (
                                        <rect key={`cell-${c2.id}`} x={c2.x + 1} y={c2.y + 1} width={c2.w - 2} height={c2.h - 2}
                                          fill={drawMode === "place-ap" ? T.blue : drawMode === "place-mont" || drawMode === "place-trav" ? "#555" : T.grn} fillOpacity={0.06}
                                          stroke={drawMode === "place-ap" ? T.blue : drawMode === "place-mont" || drawMode === "place-trav" ? "#555" : T.grn} strokeWidth={1} strokeDasharray="4,3" rx={2} />
                                      ))}
                                    </g>
                                  )}
                                  {/* Polygon shape highlight when no cells but freeLines exist */}
                                  {(drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-ap" || drawMode === "place-porta" || drawMode === "place-persiana") && cells.length === 0 && (() => {
                                    const lines = els.filter(e => e.type === "freeLine");
                                    if (lines.length < 2) return null;
                                    // Build point chain from connected lines
                                    const pts = [];
                                    const used = new Set();
                                    const addPt = (x, y) => { const k = `${Math.round(x)},${Math.round(y)}`; if (!pts.length || k !== `${Math.round(pts[pts.length-1][0])},${Math.round(pts[pts.length-1][1])}`) pts.push([x, y]); };
                                    addPt(lines[0].x1, lines[0].y1); addPt(lines[0].x2, lines[0].y2); used.add(0);
                                    for (let iter = 0; iter < lines.length; iter++) {
                                      const last = pts[pts.length - 1];
                                      for (let li = 0; li < lines.length; li++) {
                                        if (used.has(li)) continue;
                                        const l = lines[li];
                                        if (Math.hypot(l.x1 - last[0], l.y1 - last[1]) < 15) { addPt(l.x2, l.y2); used.add(li); break; }
                                        if (Math.hypot(l.x2 - last[0], l.y2 - last[1]) < 15) { addPt(l.x1, l.y1); used.add(li); break; }
                                      }
                                    }
                                    const clr = drawMode === "place-ap" ? T.blue : T.grn;
                                    if (pts.length >= 3) {
                                      return <polygon points={pts.map(p => p.join(",")).join(" ")} fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" />;
                                    }
                                    // Fallback to bbox
                                    const allX = lines.flatMap(l => [l.x1, l.x2]), allY = lines.flatMap(l => [l.y1, l.y2]);
                                    return <rect x={Math.min(...allX)+1} y={Math.min(...allY)+1} width={Math.max(...allX)-Math.min(...allX)-2} height={Math.max(...allY)-Math.min(...allY)-2}
                                      fill={clr} fillOpacity={0.08} stroke={clr} strokeWidth={1.5} strokeDasharray="6,4" rx={2} />;
                                  })()}

                                  {/* Snap points in draw mode */}
                                  {(drawMode === "line" || drawMode === "apertura") && getSnapPoints().map((p, pi) => (
                                    <circle key={`sp${pi}`} cx={p.x} cy={p.y} r={3} fill={drawMode === "apertura" ? T.blue : T.purple} fillOpacity={0.2} />
                                  ))}

                                  {/* ══ CLOSED POLYGON PROFILE (proper mitered corners) ══ */}
                                  {poly && poly.length >= 3 && (() => {
                                    const n = poly.length;
                                    const halfT = TK_FRAME;
                                    // Compute centroid for inner/outer direction
                                    const cx = poly.reduce((s, p) => s + p[0], 0) / n;
                                    const cy = poly.reduce((s, p) => s + p[1], 0) / n;
                                    // Offset each vertex outward and inward
                                    const outerPts = [];
                                    const innerPts = [];
                                    for (let i = 0; i < n; i++) {
                                      const prev = poly[(i - 1 + n) % n];
                                      const curr = poly[i];
                                      const next = poly[(i + 1) % n];
                                      // Edge normals (pointing outward from centroid)
                                      const d1x = curr[0] - prev[0], d1y = curr[1] - prev[1];
                                      const d2x = next[0] - curr[0], d2y = next[1] - curr[1];
                                      const len1 = Math.hypot(d1x, d1y) || 1;
                                      const len2 = Math.hypot(d2x, d2y) || 1;
                                      let n1x = -d1y / len1, n1y = d1x / len1;
                                      let n2x = -d2y / len2, n2y = d2x / len2;
                                      // Ensure normals point outward (away from centroid)
                                      const midE1x = (prev[0] + curr[0]) / 2, midE1y = (prev[1] + curr[1]) / 2;
                                      if ((midE1x + n1x - cx) * (midE1x + n1x - cx) + (midE1y + n1y - cy) * (midE1y + n1y - cy) <
                                          (midE1x - n1x - cx) * (midE1x - n1x - cx) + (midE1y - n1y - cy) * (midE1y - n1y - cy)) {
                                        n1x = -n1x; n1y = -n1y;
                                      }
                                      const midE2x = (curr[0] + next[0]) / 2, midE2y = (curr[1] + next[1]) / 2;
                                      if ((midE2x + n2x - cx) * (midE2x + n2x - cx) + (midE2y + n2y - cy) * (midE2y + n2y - cy) <
                                          (midE2x - n2x - cx) * (midE2x - n2x - cx) + (midE2y - n2y - cy) * (midE2y - n2y - cy)) {
                                        n2x = -n2x; n2y = -n2y;
                                      }
                                      // Average normal at vertex (bisector)
                                      let bx = n1x + n2x, by = n1y + n2y;
                                      const bLen = Math.hypot(bx, by) || 1;
                                      bx /= bLen; by /= bLen;
                                      // Miter length
                                      const dot = n1x * bx + n1y * by;
                                      const miter = dot > 0.3 ? halfT / dot : halfT;
                                      outerPts.push([curr[0] + bx * miter, curr[1] + by * miter]);
                                      innerPts.push([curr[0] - bx * miter, curr[1] - by * miter]);
                                    }
                                    const outerStr = outerPts.map(p => p.join(",")).join(" ");
                                    const innerStr = innerPts.map(p => p.join(",")).join(" ");
                                    return (
                                      <g>
                                        {/* Fill between outer and inner */}
                                        <polygon points={outerStr} fill="#f0efe8" stroke="none" />
                                        <polygon points={innerStr} fill="#fff" stroke="none" />
                                        {/* Outer stroke */}
                                        <polygon points={outerStr} fill="none" stroke="#1A1A1C" strokeWidth={1.5} strokeLinejoin="miter" />
                                        {/* Inner stroke */}
                                        <polygon points={innerStr} fill="none" stroke="#1A1A1C" strokeWidth={1} strokeLinejoin="miter" />
                                        {/* Corner dots */}
                                        {poly.map((p, pi) => <circle key={`pc${pi}`} cx={p[0]} cy={p[1]} r={3.5} fill="#333" />)}
                                      </g>
                                    );
                                  })()}

                                  {/* ══ ELEMENTS ══ */}
                                  {els.map(el => {
                                    const sel = el.id === selId;
                                    const hc = sel ? T.purple : undefined;
                                    const dp = !drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id), onTouchStart: (e3) => onDrag(e3, el.id), style: { cursor: "move" } } : {};

                                    // ═══ TELAIO — doppio rettangolo con spessore ═══
                                    if (el.type === "rect") return (
                                      <g key={el.id} {...dp}>
                                        <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#f8f8f6" stroke={hc || "#1A1A1C"} strokeWidth={1.5} rx={1} />
                                        <rect x={el.x + TK_FRAME} y={el.y + TK_FRAME} width={el.w - TK_FRAME * 2} height={el.h - TK_FRAME * 2} fill="none" stroke={hc || "#1A1A1C"} strokeWidth={1} rx={0.5} />
                                        {sel && [[el.x,el.y],[el.x+el.w,el.y],[el.x,el.y+el.h],[el.x+el.w,el.y+el.h]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={T.purple} />)}
                                      </g>
                                    );

                                    // ═══ MONTANTE — clipped to polygon ═══
                                    if (el.type === "montante") {
                                      const my1 = el.y1 !== undefined ? el.y1 : (frame ? frame.y : fY);
                                      const my2 = el.y2 !== undefined ? el.y2 : (frame ? frame.y + frame.h : fY + fH);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${v.id})` : undefined} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ew-resize" }}>
                                          <rect x={el.x - TK_MONT / 2} y={my1} width={TK_MONT} height={my2 - my1} fill="#e8e8e4" stroke={hc || "#555"} strokeWidth={0.8} />
                                          {sel && <><circle cx={el.x} cy={my1} r={4} fill={T.purple}/><circle cx={el.x} cy={my2} r={4} fill={T.purple}/></>}
                                        </g>
                                      );
                                    }

                                    // ═══ TRAVERSO — clipped to polygon ═══
                                    if (el.type === "traverso") {
                                      const tx1 = el.x1 !== undefined ? el.x1 : (frame ? frame.x : fX);
                                      const tx2 = el.x2 !== undefined ? el.x2 : (frame ? frame.x + frame.w : fX + fW);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${v.id})` : undefined} onClick={(e3) => { e3.stopPropagation(); setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})} style={{ cursor: drawMode ? undefined : "ns-resize" }}>
                                          <rect x={tx1} y={el.y - TK_MONT / 2} width={tx2 - tx1} height={TK_MONT} fill="#e8e8e4" stroke={hc || "#555"} strokeWidth={0.8} />
                                          {sel && <><circle cx={tx1} cy={el.y} r={4} fill={T.purple}/><circle cx={tx2} cy={el.y} r={4} fill={T.purple}/></>}
                                        </g>
                                      );
                                    }

                                    // ═══ ANTA — doppio rettangolo, clipped to polygon ═══
                                    if (el.type === "innerRect") {
                                      const tk = el.subType === "porta" ? TK_PORTA : TK_ANTA;
                                      const clr = hc || (el.subType === "porta" ? "#444" : "#777");
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${v.id})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="none" stroke={clr} strokeWidth={1} />
                                          <rect x={el.x + tk} y={el.y + tk} width={el.w - tk * 2} height={el.h - tk * 2} fill="none" stroke={clr} strokeWidth={0.6} />
                                          {el.subType === "porta" && <text x={el.x + el.w / 2} y={el.y + 12} textAnchor="middle" fontSize={7} fill="#555" fontWeight={700}>PORTA</text>}
                                        </g>
                                      );
                                    }

                                    // ═══ PERSIANA — clipped to polygon ═══
                                    if (el.type === "persiana") {
                                      const slats = [];
                                      const gap = 8;
                                      const pk = 3;
                                      for (let sy = el.y + pk + gap; sy < el.y + el.h - pk; sy += gap) slats.push(sy);
                                      return (
                                        <g key={el.id} clipPath={poly ? `url(#polyClip-${v.id})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#f5f0e8" stroke={hc || "#8a7a60"} strokeWidth={1} />
                                          <rect x={el.x + pk} y={el.y + pk} width={el.w - pk * 2} height={el.h - pk * 2} fill="none" stroke={hc || "#8a7a60"} strokeWidth={0.5} />
                                          {slats.map((sy2, si) => <line key={si} x1={el.x + pk + 1} y1={sy2} x2={el.x + el.w - pk - 1} y2={sy2} stroke={hc || "#a09080"} strokeWidth={0.8} />)}
                                          <text x={el.x + el.w / 2} y={el.y + 10} textAnchor="middle" fontSize={6} fill="#8a7a60" fontWeight={700}>PERSIANA</text>
                                        </g>
                                      );
                                    }

                                    // ═══ VETRO — clipped to polygon ═══
                                    if (el.type === "glass") return (
                                      <g key={el.id} clipPath={poly ? `url(#polyClip-${v.id})` : undefined} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <rect x={el.x} y={el.y} width={el.w} height={el.h} fill="#d8ecf8" fillOpacity={0.25} stroke={hc || "#8bb8e8"} strokeWidth={0.5} />
                                        <line x1={el.x} y1={el.y} x2={el.x + Math.min(el.w, el.h) * 0.3} y2={el.y + Math.min(el.w, el.h) * 0.3} stroke="#b0d4f0" strokeWidth={0.5} />
                                      </g>
                                    );

                                    // ═══ POLYGON ANTA — follows actual shape ═══
                                    if (el.type === "polyAnta" && el.poly) {
                                      const pts = el.poly;
                                      const tk = el.subType === "porta" ? TK_PORTA : TK_ANTA;
                                      // Outer polygon
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      // Inner polygon — shrink by tk toward centroid
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const innerPts = pts.map(p => {
                                        const dx2 = cx2 - p[0], dy2 = cy2 - p[1];
                                        const dist = Math.hypot(dx2, dy2) || 1;
                                        return [(p[0] + dx2 / dist * tk), (p[1] + dy2 / dist * tk)];
                                      });
                                      const innerStr = innerPts.map(p => p.join(",")).join(" ");
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <polygon points={outerPts} fill="#f8f8f6" fillOpacity={0.3} stroke={hc || "#777"} strokeWidth={1} />
                                          <polygon points={innerStr} fill="none" stroke={hc || "#777"} strokeWidth={0.6} />
                                          {el.subType === "porta" && <text x={cx2} y={cy2} textAnchor="middle" fontSize={8} fill="#555" fontWeight={700}>PORTA</text>}
                                        </g>
                                      );
                                    }

                                    // ═══ POLYGON VETRO — glass following shape ═══
                                    if (el.type === "polyGlass" && el.poly) {
                                      const pts = el.poly;
                                      const cx2 = pts.reduce((s, p) => s + p[0], 0) / pts.length;
                                      const cy2 = pts.reduce((s, p) => s + p[1], 0) / pts.length;
                                      const shrink = TK_ANTA + 2;
                                      const glassPts = pts.map(p => {
                                        const dx2 = cx2 - p[0], dy2 = cy2 - p[1];
                                        const dist = Math.hypot(dx2, dy2) || 1;
                                        return [(p[0] + dx2 / dist * shrink), (p[1] + dy2 / dist * shrink)];
                                      });
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <polygon points={glassPts.map(p => p.join(",")).join(" ")} fill="#d8ecf8" fillOpacity={0.25} stroke={hc || "#8bb8e8"} strokeWidth={0.5} />
                                          <line x1={glassPts[0][0]} y1={glassPts[0][1]} x2={cx2} y2={cy2} stroke="#b0d4f0" strokeWidth={0.4} />
                                        </g>
                                      );
                                    }

                                    // ═══ POLYGON PERSIANA — slats following shape ═══
                                    if (el.type === "polyPersiana" && el.poly) {
                                      const pts = el.poly;
                                      const outerPts = pts.map(p => p.join(",")).join(" ");
                                      const allY2 = pts.map(p => p[1]);
                                      const minY2 = Math.min(...allY2), maxY2 = Math.max(...allY2);
                                      const allX2 = pts.map(p => p[0]);
                                      const minX2 = Math.min(...allX2), maxX2 = Math.max(...allX2);
                                      const clipId = `pers-${el.id}`;
                                      const slats = [];
                                      for (let sy = minY2 + 10; sy < maxY2 - 4; sy += 8) slats.push(sy);
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <defs><clipPath id={clipId}><polygon points={outerPts} /></clipPath></defs>
                                          <polygon points={outerPts} fill="#f5f0e8" stroke={hc || "#8a7a60"} strokeWidth={1} />
                                          <g clipPath={`url(#${clipId})`}>
                                            {slats.map((sy, si) => <line key={si} x1={minX2 + 4} y1={sy} x2={maxX2 - 4} y2={sy} stroke="#a09080" strokeWidth={0.8} />)}
                                          </g>
                                        </g>
                                      );
                                    }

                                    if (el.type === "circle") return (
                                      <g key={el.id} {...dp}>
                                        <circle cx={el.cx} cy={el.cy} r={el.r} fill="#e8f4fc" fillOpacity={0.2} stroke={hc || "#4a90d9"} strokeWidth={sel ? 2.5 : 1.5} />
                                        {sel && [[el.cx,el.cy-el.r],[el.cx+el.r,el.cy],[el.cx,el.cy+el.r],[el.cx-el.r,el.cy]].map(([px,py],pi) => <circle key={pi} cx={px} cy={py} r={4} fill={T.purple} />)}
                                      </g>
                                    );

                                    // ═══ TEXT LABEL — draggable, editable on double-click ═══
                                    if (el.type === "label") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}
                                        {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})}
                                        onDoubleClick={() => {
                                          const newTxt = prompt("Modifica testo:", el.text);
                                          if (newTxt !== null) setDW(els.map(x => x.id === el.id ? { ...x, text: newTxt } : x));
                                        }}
                                        style={{ cursor: drawMode ? undefined : "move" }}>
                                        {sel && <rect x={el.x - 4} y={el.y - (el.fontSize || 11) - 2} width={Math.max(40, (el.text || "").length * 6)} height={(el.fontSize || 11) + 8} fill={`${T.purple}10`} stroke={T.purple} strokeWidth={1} strokeDasharray="3,2" rx={3} />}
                                        <text x={el.x} y={el.y} fontSize={el.fontSize || 11} fontWeight={700} fill={hc || "#333"} fontFamily="Inter, sans-serif">{el.text}</text>
                                      </g>
                                    );

                                    if (el.type === "freeLine") {
                                      const dx2 = el.x2 - el.x1, dy2 = el.y2 - el.y1;
                                      const len = Math.hypot(dx2, dy2) || 1;
                                      const halfT = TK_FRAME;
                                      const nx = -dy2 / len * halfT, ny = dx2 / len * halfT;
                                      // Dimension in mm
                                      const refLen = frame ? Math.max(frame.w, frame.h) : fW;
                                      const refReal = frame ? (frame.w >= frame.h ? realW : realH) : realW;
                                      const mmLen = Math.round(len / refLen * refReal);
                                      const midX = (el.x1 + el.x2) / 2, midY = (el.y1 + el.y2) / 2;
                                      const ang = Math.atan2(dy2, dx2) * 180 / Math.PI;
                                      const lx = midX + nx * 2, ly = midY + ny * 2;
                                      const isPartOfPoly = poly && poly.length >= 3;
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }} {...(!drawMode ? { onMouseDown: (e3) => onDrag(e3, el.id) } : {})}>
                                          {/* Wide transparent hit area */}
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke="transparent" strokeWidth={14} />
                                          {/* Individual profile only if NOT part of closed polygon */}
                                          {!isPartOfPoly && <polygon points={`${el.x1+nx},${el.y1+ny} ${el.x2+nx},${el.y2+ny} ${el.x2-nx},${el.y2-ny} ${el.x1-nx},${el.y1-ny}`} fill="#f0efe8" stroke="#1A1A1C" strokeWidth={1} strokeLinejoin="miter" />}
                                          {sel && <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={T.purple} strokeWidth={3} opacity={0.4} />}
                                          {/* Dimension label */}
                                          <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${lx}, ${ly})`}>
                                            <rect x={lx - 18} y={ly - 7} width={36} height={14} fill="#fff" rx={3} stroke={T.acc} strokeWidth={0.6} opacity={0.9} />
                                            <text x={lx} y={ly + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={T.acc} fontFamily="monospace">{mmLen}</text>
                                          </g>
                                          {sel && <><circle cx={el.x1} cy={el.y1} r={5} fill={T.purple} /><circle cx={el.x2} cy={el.y2} r={5} fill={T.purple} /></>}
                                        </g>
                                      );
                                    }

                                    if (el.type === "apLine") return (
                                      <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                        <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={hc || T.blue} strokeWidth={sel ? 3 : 2} strokeDasharray={el.dash ? "6,4" : "none"} />
                                        <circle cx={el.x1} cy={el.y1} r={sel ? 5 : 3} fill={hc || T.blue} />
                                        <circle cx={el.x2} cy={el.y2} r={sel ? 5 : 3} fill={hc || T.blue} />
                                      </g>
                                    );

                                    if (el.type === "apLabel") {
                                      const tw = String(el.label).length * 7 + 14;
                                      return (
                                        <g key={el.id} onClick={(e3) => { e3.stopPropagation(); if (!drawMode) setMode({ selectedId: el.id }); }}>
                                          <rect x={el.x - tw / 2} y={el.y - 8} width={tw} height={16} fill={hc || T.blue} rx={3} fillOpacity={0.85} />
                                          <text x={el.x} y={el.y + 4} textAnchor="middle" fontSize={9} fontWeight={800} fill="#fff">{el.label}</text>
                                        </g>
                                      );
                                    }

                                    if (el.type === "dim") {
                                      const isH = Math.abs(el.y1 - el.y2) < 2;
                                      const mx2 = (el.x1 + el.x2) / 2, my2 = (el.y1 + el.y2) / 2;
                                      const tw = String(el.label).length * 6.5 + 16;
                                      return (
                                        <g key={el.id} onClick={(e3) => {
                                          e3.stopPropagation();
                                          const nv = prompt("Misura (mm):", el.label);
                                          if (nv === null || !nv.trim()) return;
                                          const newVal = parseInt(nv.trim());
                                          const oldVal = parseInt(el.label);
                                          let upd = els.map(x => x.id === el.id ? { ...x, label: nv.trim() } : x);
                                          
                                          // If this is a sub-dimension (column width or row height), adjust structure
                                          if (!isNaN(newVal) && !isNaN(oldVal) && newVal !== oldVal && frame) {
                                            // Is this a column width? (horizontal dim above or below frame)
                                            const isColDim = isH && el.y1 < frame.y + frame.h / 2;
                                            // Is this a row height? (vertical dim left of frame)
                                            const isRowDim = !isH && el.x1 < frame.x + frame.w / 2;
                                            // Is this total width/height?
                                            const isTotalW = isH && Math.abs(el.x2 - el.x1 - frame.w) < 5;
                                            const isTotalH = !isH && Math.abs(el.y2 - el.y1 - frame.h) < 5;
                                            
                                            if (isColDim && !isTotalW) {
                                              // Find which column this dim spans, adjust montante
                                              const dimLeft = el.x1;
                                              const oldPixelW = el.x2 - el.x1;
                                              const scale = newVal / oldVal;
                                              const newPixelW = oldPixelW * scale;
                                              const diff = newPixelW - oldPixelW;
                                              // Move all montanti and elements that are to the right of this dim's right edge
                                              upd = upd.map(x => {
                                                if (x.type === "montante" && x.x >= el.x2 - 3) return { ...x, x: snap(x.x + diff) };
                                                if (x.type === "dim" && x !== el && x.x1 >= el.x2 - 3) return { ...x, x1: x.x1 + diff, x2: x.x2 + diff };
                                                if ((x.type === "innerRect" || x.type === "glass") && x.x >= el.x2 - 5) return { ...x, x: x.x + diff };
                                                return x;
                                              });
                                              // Update frame width
                                              upd = upd.map(x => x.type === "rect" ? { ...x, w: x.w + diff } : x);
                                            }
                                            if (isRowDim && !isTotalH) {
                                              const oldPixelH = el.y2 - el.y1;
                                              const scale = newVal / oldVal;
                                              const newPixelH = oldPixelH * scale;
                                              const diff = newPixelH - oldPixelH;
                                              upd = upd.map(x => {
                                                if (x.type === "traverso" && x.y >= el.y2 - 3) return { ...x, y: snap(x.y + diff) };
                                                if (x.type === "dim" && x !== el && x.y1 >= el.y2 - 3) return { ...x, y1: x.y1 + diff, y2: x.y2 + diff };
                                                if ((x.type === "innerRect" || x.type === "glass") && x.y >= el.y2 - 5) return { ...x, y: x.y + diff };
                                                return x;
                                              });
                                              upd = upd.map(x => x.type === "rect" ? { ...x, h: x.h + diff } : x);
                                            }
                                          }
                                          setDW(upd);
                                          // Sync total dimensions to main fields
                                          if (frame) {
                                            const isTW = isH && Math.abs(el.x2 - el.x1 - frame.w) < 5;
                                            const isTH = !isH && Math.abs(el.y2 - el.y1 - frame.h) < 5;
                                            if (isTW && !isNaN(newVal)) pwUpdVano(v.id, "larghezza", newVal);
                                            if (isTH && !isNaN(newVal)) pwUpdVano(v.id, "altezza", newVal);
                                          }
                                        }} style={{ cursor: "pointer" }}>
                                          <line x1={el.x1} y1={el.y1} x2={el.x2} y2={el.y2} stroke={T.acc} strokeWidth={0.8} />
                                          {isH ? <><line x1={el.x1} y1={el.y1-5} x2={el.x1} y2={el.y1+5} stroke={T.acc} strokeWidth={0.8}/><line x1={el.x2} y1={el.y2-5} x2={el.x2} y2={el.y2+5} stroke={T.acc} strokeWidth={0.8}/></>
                                            : <><line x1={el.x1-5} y1={el.y1} x2={el.x1+5} y2={el.y1} stroke={T.acc} strokeWidth={0.8}/><line x1={el.x2-5} y1={el.y2} x2={el.x2+5} y2={el.y2} stroke={T.acc} strokeWidth={0.8}/></>}
                                          <rect x={mx2-tw/2} y={my2-9} width={tw} height={18} fill="#fff" rx={3} stroke={T.acc} strokeWidth={0.6}/>
                                          <text x={mx2} y={my2+4} textAnchor="middle" fontSize={10} fontWeight={800} fill={T.acc} fontFamily="monospace">{el.label}</text>
                                        </g>
                                      );
                                    }
                                    return null;
                                  })}

                                  {/* Pending line point + GUIDE */}
                                  {dw._pendingLine && (() => {
                                    const clr = drawMode === "apertura" ? T.blue : "#333";
                                    const p = dw._pendingLine;
                                    const gx = dw._guideX, gy = dw._guideY;
                                    return <>
                                      {/* H/V guide lines from pending point */}
                                      <line x1={0} y1={p.y1} x2={canvasW} y2={p.y1} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      <line x1={p.x1} y1={0} x2={p.x1} y2={canvasH} stroke="#ccc" strokeWidth={0.5} strokeDasharray="4,4" />
                                      {/* Live guide line to mouse */}
                                      {gx != null && gy != null && <>
                                        <line x1={p.x1} y1={p.y1} x2={gx} y2={gy} stroke={clr} strokeWidth={1} strokeDasharray="6,3" opacity={0.5} />
                                        {/* H/V snap indicator */}
                                        {gx === p.x1 && <line x1={gx} y1={0} x2={gx} y2={canvasH} stroke={T.grn} strokeWidth={0.7} strokeDasharray="2,2" opacity={0.5} />}
                                        {gy === p.y1 && <line x1={0} y1={gy} x2={canvasW} y2={gy} stroke={T.grn} strokeWidth={0.7} strokeDasharray="2,2" opacity={0.5} />}
                                        {/* Angle + length label */}
                                        <rect x={gx + 8} y={gy - 20} width={72} height={18} fill="#333" rx={4} opacity={0.85} />
                                        <text x={gx + 44} y={gy - 8} textAnchor="middle" fontSize={9} fontWeight={700} fill="#fff" fontFamily="monospace">
                                          {dw._guideDeg != null ? `${dw._guideDeg}° ${dw._guideLen}mm` : ""}
                                        </text>
                                      </>}
                                      <circle cx={p.x1} cy={p.y1} r={6} fill={clr} fillOpacity={0.4} />
                                      <circle cx={p.x1} cy={p.y1} r={10} fill="none" stroke={clr} strokeWidth={1.5} strokeDasharray="3,2" />
                                    </>;
                                  })()}

                                  {/* Live drag dimension */}
                                  {dw._dragDim && (() => {
                                    const dd = dw._dragDim;
                                    const midY = (dd.y1 + dd.y2) / 2;
                                    if (dd.type === "v") {
                                      // Vertical montante — show ← left mm | right mm →
                                      return <>
                                        <rect x={dd.x - 62} y={midY - 8} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={dd.x - 34} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">← {dd.leftMM}</text>
                                        <rect x={dd.x + 6} y={midY - 8} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={dd.x + 34} y={midY + 4} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">{dd.rightMM} →</text>
                                      </>;
                                    }
                                    if (dd.type === "h") {
                                      const midX = (dd.x1 + dd.x2) / 2;
                                      return <>
                                        <rect x={midX - 28} y={dd.y - 22} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={midX} y={dd.y - 10} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">↑ {dd.topMM}</text>
                                        <rect x={midX - 28} y={dd.y + 6} width={56} height={16} fill={T.acc} rx={3} />
                                        <text x={midX} y={dd.y + 18} textAnchor="middle" fontSize={10} fontWeight={800} fill="#fff" fontFamily="monospace">{dd.botMM} ↓</text>
                                      </>;
                                    }
                                    return null;
                                  })()}
                                </svg>
                                </div>

                                {/* Footer */}
                                <div style={{ padding: "4px 10px 5px", fontSize: 9, textAlign: "center", color: (drawMode === "place-anta" || drawMode === "place-vetro" || drawMode === "place-porta" || drawMode === "place-persiana") ? T.grn : (drawMode === "apertura" || drawMode === "place-ap") ? T.blue : (drawMode === "line" || drawMode === "place-mont" || drawMode === "place-trav") ? "#555" : T.sub, fontWeight: drawMode ? 700 : 400 }}>
                                  {drawMode === "line" ? "● Click per tracciare struttura · Le linee si concatenano"
                                    : drawMode === "apertura" ? "● Click libero per disegnare apertura in blu"
                                    : drawMode === "place-mont" ? "⬛ Click su una CELLA per aggiungere il montante verticale"
                                    : drawMode === "place-trav" ? "⬛ Click su una CELLA per aggiungere il traverso orizzontale"
                                    : drawMode === "place-anta" ? "✅ Click sulla CELLA per inserire l'anta"
                                    : drawMode === "place-porta" ? "✅ Click sulla CELLA per inserire anta porta (profilo spesso)"
                                    : drawMode === "place-persiana" ? "✅ Click sulla CELLA per inserire persiana con stecche"
                                    : drawMode === "place-vetro" ? "✅ Click sulla CELLA per inserire il vetro (dentro l'anta)"
                                    : drawMode === "place-ap" ? `🔵 Click sulla CELLA per apertura ${placeApType}`
                                    : `${els.length} el. · ${cells.length} celle · Click per selezionare`}
                                </div>
                              </div>
                            );
                          })()}

                          {/* ═══ BOX PIANTA — Vista dall'alto per box doccia/caldaia/pergole ═══ */}
                          {drawingVanoId === v.id && (v.tipo === "BOX") && (() => {
                            const box = v.boxPianta || { forma: "L", pareti: [], selectedFace: null };
                            const updBox = (upd) => pwUpdVano(v.id, "boxPianta", { ...box, ...upd });
                            const bW = Math.min(window.innerWidth - 32, 400);
                            const bH = 300;
                            const sc = 0.15; // scale mm → px
                            const wallTk = 8; // wall thickness px
                            const oxB = 40, oyB = 40; // offset

                            // Predefined shapes
                            const presets = {
                              "RETT": [
                                { id: "F", x1: 0, y1: 0, x2: 1200, y2: 0, label: "Frontale" },
                                { id: "D", x1: 1200, y1: 0, x2: 1200, y2: 800, label: "Destro" },
                                { id: "P", x1: 1200, y1: 800, x2: 0, y2: 800, label: "Posteriore" },
                                { id: "S", x1: 0, y1: 800, x2: 0, y2: 0, label: "Sinistro" },
                              ],
                              "L": [
                                { id: "F1", x1: 0, y1: 0, x2: 1200, y2: 0, label: "Front 1" },
                                { id: "D", x1: 1200, y1: 0, x2: 1200, y2: 500, label: "Destro" },
                                { id: "F2", x1: 1200, y1: 500, x2: 600, y2: 500, label: "Front 2" },
                                { id: "I", x1: 600, y1: 500, x2: 600, y2: 800, label: "Interno" },
                                { id: "P", x1: 600, y1: 800, x2: 0, y2: 800, label: "Posteriore" },
                                { id: "S", x1: 0, y1: 800, x2: 0, y2: 0, label: "Sinistro" },
                              ],
                              "U": [
                                { id: "F", x1: 0, y1: 0, x2: 1400, y2: 0, label: "Frontale" },
                                { id: "D", x1: 1400, y1: 0, x2: 1400, y2: 400, label: "Destro" },
                                { id: "I1", x1: 1400, y1: 400, x2: 1000, y2: 400, label: "Interno DX" },
                                { id: "B", x1: 1000, y1: 400, x2: 1000, y2: 800, label: "Base" },
                                { id: "I2", x1: 1000, y1: 800, x2: 400, y2: 800, label: "Base Int" },
                                { id: "C", x1: 400, y1: 800, x2: 400, y2: 400, label: "Centro" },
                                { id: "I3", x1: 400, y1: 400, x2: 0, y2: 400, label: "Interno SX" },
                                { id: "S", x1: 0, y1: 400, x2: 0, y2: 0, label: "Sinistro" },
                              ],
                              "ANG": [
                                { id: "F", x1: 0, y1: 0, x2: 900, y2: 0, label: "Frontale" },
                                { id: "A", x1: 900, y1: 0, x2: 1200, y2: 400, label: "Angolo" },
                                { id: "L", x1: 1200, y1: 400, x2: 1200, y2: 900, label: "Laterale" },
                                { id: "P", x1: 1200, y1: 900, x2: 0, y2: 900, label: "Posteriore" },
                                { id: "S", x1: 0, y1: 900, x2: 0, y2: 0, label: "Sinistro" },
                              ],
                            };

                            const forma = box.forma || "L";
                            const pareti = box.pareti && box.pareti.length > 0 ? box.pareti : (presets[forma] || presets["L"]);
                            const selFace = box.selectedFace;

                            return (
                              <div style={{ marginTop: 8, background: T.card, borderRadius: 12, border: `1.5px solid ${T.acc}`, overflow: "hidden" }}>
                                <div style={{ padding: "8px 12px", background: `${T.acc}10`, display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ fontSize: 14 }}><I d={ICO.package} /></span>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: T.acc, flex: 1 }}>Box Pianta — {v.nome || "Box"}</span>
                                </div>

                                {/* Forma presets + LIBERO */}
                                <div style={{ display: "flex", gap: 4, padding: "6px 8px", flexWrap: "wrap" }}>
                                  {["RETT", "L", "U", "ANG", "LIBERO"].map(f => (
                                    <div key={f} onClick={() => { if (f === "LIBERO") { updBox({ forma: f, pareti: [], selectedFace: null, _drawing: true, _pendingPt: null }); } else { updBox({ forma: f, pareti: presets[f], selectedFace: null, _drawing: false }); } }}
                                      style={{ padding: "5px 12px", borderRadius: 6, border: `1.5px solid ${forma === f ? T.acc : T.bdr}`, background: forma === f ? `${T.acc}12` : T.card, fontSize: 11, fontWeight: 800, cursor: "pointer", color: forma === f ? T.acc : T.text }}>
                                      {f === "RETT" ? "▭ Rett." : f === "L" ? "⌐ L" : f === "U" ? "⊔ U" : f === "ANG" ? "◿ Ang." : "✏ Libero"}
                                    </div>
                                  ))}
                                  <div style={{ flex: 1 }} />
                                  <div onClick={() => updBox({ _show3D: !box._show3D })} style={{ padding: "5px 10px", borderRadius: 6, border: `1.5px solid ${box._show3D ? T.purple : T.bdr}`, background: box._show3D ? `${T.purple}12` : T.card, fontSize: 11, fontWeight: 800, cursor: "pointer", color: box._show3D ? T.purple : T.sub }}>
                                    <I d={ICO.box} /> 3D
                                  </div>
                                </div>

                                {/* Drawing mode hint */}
                                {box._drawing && (
                                  <div style={{ padding: "4px 8px", fontSize: 9, color: T.grn, fontWeight: 700, background: `${T.grn}08` }}>
                                    ✏️ Click per disegnare vertici. Click sul primo punto per chiudere. {pareti.length > 0 ? `${pareti.length} pareti` : "Inizia a cliccare"}
                                  </div>
                                )}

                                {/* SVG Plan view */}
                                <svg width={bW} height={box._show3D ? bH + 120 : bH} style={{ display: "block", background: "#fafaf8" }}
                                  onClick={(e2) => {
                                    if (!box._drawing) return;
                                    const r2 = e2.currentTarget.getBoundingClientRect();
                                    const px = e2.clientX - r2.left, py = e2.clientY - r2.top;
                                    // Convert back to mm
                                    const mmX = Math.round((px - oxB) / sc / 50) * 50;
                                    const mmY = Math.round((py - oyB) / sc / 50) * 50;
                                    const pending = box._pendingPt;
                                    if (!pending) {
                                      updBox({ _pendingPt: { x: mmX, y: mmY }, _firstPt: { x: mmX, y: mmY } });
                                    } else {
                                      // Check if closing (clicking near first point)
                                      const first = box._firstPt;
                                      if (first && pareti.length >= 2 && Math.hypot(mmX - first.x, mmY - first.y) < 80) {
                                        // Close polygon — add last wall back to first
                                        const newWall = { id: `W${pareti.length}`, x1: pending.x, y1: pending.y, x2: first.x, y2: first.y, label: `Parete ${pareti.length + 1}` };
                                        updBox({ pareti: [...pareti, newWall], _drawing: false, _pendingPt: null, _firstPt: null });
                                      } else {
                                        const newWall = { id: `W${pareti.length}`, x1: pending.x, y1: pending.y, x2: mmX, y2: mmY, label: `Parete ${pareti.length + 1}` };
                                        updBox({ pareti: [...pareti, newWall], _pendingPt: { x: mmX, y: mmY } });
                                      }
                                    }
                                  }}>
                                  <defs>
                                    <pattern id={`bg-${v.id}`} width={20} height={20} patternUnits="userSpaceOnUse">
                                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#eee" strokeWidth="0.5" />
                                    </pattern>
                                  </defs>
                                  <rect width={bW} height={bH} fill={`url(#bg-${v.id})`} />

                                  {/* Walls — 2D plan */}
                                  {pareti.map((w, wi) => {
                                    const x1 = oxB + w.x1 * sc, y1 = oyB + w.y1 * sc;
                                    const x2 = oxB + w.x2 * sc, y2 = oyB + w.y2 * sc;
                                    const dx = x2 - x1, dy = y2 - y1;
                                    const len = Math.hypot(dx, dy) || 1;
                                    const nx = -dy / len * wallTk / 2, ny = dx / len * wallTk / 2;
                                    const isSel = selFace === w.id;
                                    const mx2 = (x1 + x2) / 2, my2 = (y1 + y2) / 2;
                                    const wallLen = Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1));
                                    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
                                    return (
                                      <g key={w.id} onClick={(e3) => { e3.stopPropagation(); if (!box._drawing) updBox({ selectedFace: isSel ? null : w.id }); }} style={{ cursor: "pointer" }}>
                                        <polygon points={`${x1+nx},${y1+ny} ${x2+nx},${y2+ny} ${x2-nx},${y2-ny} ${x1-nx},${y1-ny}`}
                                          fill={isSel ? `${T.acc}30` : "#e8e6e0"} stroke={isSel ? T.acc : "#555"} strokeWidth={isSel ? 2 : 1} />
                                        {/* Editable label — click to rename, double-click to edit mm */}
                                        <g transform={`rotate(${ang > 90 || ang < -90 ? ang + 180 : ang}, ${mx2 + nx * 2.5}, ${my2 + ny * 2.5})`}
                                          onDoubleClick={(e3) => {
                                            e3.stopPropagation();
                                            const newLen = prompt(`Lunghezza ${w.label} (mm):`, String(wallLen));
                                            if (!newLen || isNaN(parseInt(newLen))) return;
                                            const newMM = parseInt(newLen);
                                            const ratio = newMM / wallLen;
                                            const ndx = w.x2 - w.x1, ndy = w.y2 - w.y1;
                                            const updW = { ...w, x2: Math.round(w.x1 + ndx * ratio), y2: Math.round(w.y1 + ndy * ratio) };
                                            updBox({ pareti: pareti.map(p => p.id === w.id ? updW : p) });
                                          }}>
                                          <text x={mx2 + nx * 2.5} y={my2 + ny * 2.5} textAnchor="middle" dominantBaseline="middle"
                                            fontSize={8} fontWeight={700} fill={isSel ? T.acc : "#666"}>
                                            {w.label} ({wallLen})
                                          </text>
                                        </g>
                                      </g>
                                    );
                                  })}

                                  {/* Corner dots */}
                                  {pareti.map((w, wi) => (
                                    <circle key={`c${wi}`} cx={oxB + w.x1 * sc} cy={oyB + w.y1 * sc} r={3} fill="#333" />
                                  ))}

                                  {/* Pending point while drawing */}
                                  {box._pendingPt && (
                                    <circle cx={oxB + box._pendingPt.x * sc} cy={oyB + box._pendingPt.y * sc} r={5} fill={T.grn} stroke="#fff" strokeWidth={2} />
                                  )}
                                  {box._firstPt && box._drawing && pareti.length >= 2 && (
                                    <circle cx={oxB + box._firstPt.x * sc} cy={oyB + box._firstPt.y * sc} r={8} fill="none" stroke={T.grn} strokeWidth={2} strokeDasharray="3,2" />
                                  )}

                                  {/* ══ 3D ISOMETRIC PREVIEW ══ */}
                                  {box._show3D && pareti.length >= 3 && (() => {
                                    const isoY = bH + 10; // start below plan
                                    const iSc = sc * 0.7; // smaller scale
                                    const hgt = 60; // height in px
                                    const shX = 0.4, shY = -0.3; // isometric shear
                                    const toIso = (mx2, my2, mz) => ({
                                      x: oxB + mx2 * iSc + mz * shX,
                                      y: isoY + my2 * iSc - mz + mz * shY
                                    });
                                    return (
                                      <g>
                                        <text x={10} y={isoY - 5} fontSize={9} fontWeight={700} fill={T.purple}>Vista 3D</text>
                                        {/* Floor */}
                                        <polygon points={pareti.map(w => { const p = toIso(w.x1, w.y1, 0); return `${p.x},${p.y}`; }).join(" ")}
                                          fill="#f0efe8" fillOpacity={0.5} stroke="#999" strokeWidth={0.5} />
                                        {/* Walls as vertical faces */}
                                        {pareti.map((w, wi) => {
                                          const b1 = toIso(w.x1, w.y1, 0);
                                          const b2 = toIso(w.x2, w.y2, 0);
                                          const t1 = toIso(w.x1, w.y1, hgt);
                                          const t2 = toIso(w.x2, w.y2, hgt);
                                          const isSel = selFace === w.id;
                                          return (
                                            <g key={`3d${wi}`}>
                                              <polygon points={`${b1.x},${b1.y} ${b2.x},${b2.y} ${t2.x},${t2.y} ${t1.x},${t1.y}`}
                                                fill={isSel ? `${T.acc}40` : `hsl(${wi * 40}, 20%, 85%)`} stroke="#555" strokeWidth={0.8} />
                                              <text x={(b1.x + b2.x + t1.x + t2.x) / 4} y={(b1.y + b2.y + t1.y + t2.y) / 4}
                                                textAnchor="middle" fontSize={7} fill="#555" fontWeight={600}>{w.label}</text>
                                            </g>
                                          );
                                        })}
                                        {/* Top edges */}
                                        <polygon points={pareti.map(w => { const p = toIso(w.x1, w.y1, hgt); return `${p.x},${p.y}`; }).join(" ")}
                                          fill="none" stroke="#333" strokeWidth={1} />
                                      </g>
                                    );
                                  })()}
                                </svg>

                                {/* Selected face info */}
                                {selFace && (() => {
                                  const face = pareti.find(p => p.id === selFace);
                                  if (!face) return null;
                                  const faceLen = Math.round(Math.hypot(face.x2 - face.x1, face.y2 - face.y1));
                                  const faceH = hv || 2200;
                                  // Each face has its own disegno stored in boxFaces
                                  const boxFaces = v.boxFaces || {};
                                  const faceDrawing = boxFaces[selFace] || { elements: [] };
                                  return (
                                    <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.bdr}` }}>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 12, fontWeight: 800, color: T.acc }}><I d={ICO.wrench} /> {face.label}</span>
                                        <span style={{ fontSize: 10, color: T.sub }}>({faceLen} × {faceH} mm)</span>
                                        <div style={{ flex: 1 }} />
                                        <div onClick={() => {
                                          // Open face in main drawing editor by creating temp vano dimensions
                                          pwUpdVano(v.id, "larghezza", faceLen);
                                          pwUpdVano(v.id, "altezza", faceH);
                                          pwUpdVano(v.id, "disegno", faceDrawing);
                                          pwUpdVano(v.id, "_editingBoxFace", selFace);
                                          setDrawingVanoId(v.id);
                                        }} style={{ padding: "4px 12px", borderRadius: 6, background: T.acc, color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>
                                          <I d={ICO.edit} /> Disegna faccia
                                        </div>
                                      </div>
                                      {/* Mini preview */}
                                      {faceDrawing.elements && faceDrawing.elements.length > 0 && (
                                        <div style={{ fontSize: 9, color: T.grn }}>✅ {faceDrawing.elements.length} elementi disegnati</div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Save face back hint */}
                                {v._editingBoxFace && (
                                  <div style={{ padding: "6px 12px", background: `${T.grn}10`, borderTop: `1px solid ${T.grn}30`, display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 9, color: T.grn, fontWeight: 700, flex: 1 }}><I d={ICO.ruler} /> Stai editando faccia: {v._editingBoxFace}</span>
                                    <div onClick={() => {
                                      // Save current disegno back to boxFaces
                                      const boxFaces = { ...(v.boxFaces || {}), [v._editingBoxFace]: v.disegno };
                                      pwUpdVano(v.id, "boxFaces", boxFaces);
                                      pwUpdVano(v.id, "_editingBoxFace", null);
                                    }} style={{ padding: "4px 10px", borderRadius: 6, background: T.grn, color: "#fff", fontSize: 10, fontWeight: 800, cursor: "pointer" }}>
                                      <I d={ICO.save} /> Salva faccia
                                    </div>
                                  </div>
                                )}

                                <div style={{ padding: "4px 8px", fontSize: 8, color: T.sub }}>
                                  Click su una parete per selezionarla → "Disegna faccia" apre l'editor frontale
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* ── TIPO + NOME + PEZZI ── */}
                        <div id={`pw-sec-tipo-${v.id}`} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Tipo</div><select value={v.tipo || "F2A"} onChange={e => pwUpdVano(v.id, "tipo", e.target.value)} style={inputPw}>{TIPI_VANO.map(t => <option key={t}>{t}</option>)}</select></div>
                          <div style={{ flex: 2 }}><div style={{ fontSize: 9, color: T.sub2 }}>Nome</div><input value={v.nome || ""} onChange={e => pwUpdVano(v.id, "nome", e.target.value)} style={inputPw} /></div>
                          <div style={{ width: 50 }}><div style={{ fontSize: 9, color: T.sub2 }}>Pz</div><input type="number" value={v.pezzi || 1} onChange={e => pwUpdVano(v.id, "pezzi", Math.max(1, parseInt(e.target.value) || 1))} style={inputPw} /></div>
                        </div>

                        {/* ── MISURE ── */}
                        <div id={`pw-sec-misure-${v.id}`} style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Larg. mm</div><input type="number" value={lv} onChange={e => pwUpdVano(v.id, "larghezza", parseInt(e.target.value) || 0)} style={inputPw} /></div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Alt. mm</div><input type="number" value={hv} onChange={e => pwUpdVano(v.id, "altezza", parseInt(e.target.value) || 0)} style={inputPw} /></div>
                          <div style={{ width: 56, textAlign: "center", paddingTop: 14 }}><div style={{ fontSize: 9, color: T.sub2 }}>mq</div><div style={{ fontSize: 15, fontWeight: 900, color: T.acc }}>{((lv * hv) / 1000000).toFixed(2)}</div></div>
                        </div>

                        {/* ── SISTEMA + COLORE + VETRO ── */}
                        <div id={`pw-sec-sistema-${v.id}`} style={{ marginBottom: 6 }}><div style={{ fontSize: 9, color: T.sub2 }}>Sistema</div><select value={v.sistema || c.sistema || ""} onChange={e => pwUpdVano(v.id, "sistema", e.target.value)} style={inputPw}>{(sistemiDB || []).map(s => <option key={s.nome || s.sistema} value={s.nome || `${s.marca} ${s.sistema}`}>{s.nome || `${s.marca} ${s.sistema}`}</option>)}</select></div>
                        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Colore</div><select value={v.colore || ""} onChange={e => pwUpdVano(v.id, "colore", e.target.value)} style={inputPw}>{(coloriDB || []).map(cl => <option key={cl.nome} value={cl.nome}>{cl.nome}</option>)}</select></div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Vetro</div><select value={v.vetro || ""} onChange={e => pwUpdVano(v.id, "vetro", e.target.value)} style={inputPw}>{(vetriDB || []).map(vt => <option key={vt.nome || vt.code} value={vt.nome || vt.code}>{vt.nome || vt.code}</option>)}</select></div>
                        </div>

                        {/* ══════ CONTROTELAIO (SEZIONE AMPIA CON MISURE) ══════ */}
                        <div id={`pw-sec-ct-${v.id}`} style={{ background: `${T.acc}05`, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${T.acc}15` }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: T.acc, marginBottom: 8 }}><I d={ICO.square} /> CONTROTELAIO</div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any, marginBottom: 8 }}>
                            {CONTROT_OPT.map(ct => (<div key={ct} onClick={() => pwUpdVano(v.id, "controtelaio", ct)} style={chipPw((v.controtelaio || "Nessuno") === ct)}>{ct}</div>))}
                          </div>
                          {v.controtelaio && v.controtelaio !== "Nessuno" && (
                            <div>
                              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Marca</div><input value={v.ctMarca || ""} onChange={e => pwUpdVano(v.id, "ctMarca", e.target.value)} placeholder="Alphacan, Aluk..." style={inputPw} /></div>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Modello</div><input value={v.ctModello || ""} onChange={e => pwUpdVano(v.id, "ctModello", e.target.value)} placeholder="Serie..." style={inputPw} /></div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 6 }}>
                                <div><div style={{ fontSize: 9, color: T.sub2 }}>Larg. CT (mm)</div><input type="number" value={v.ctLarghezza || ""} onChange={e => pwUpdVano(v.id, "ctLarghezza", parseInt(e.target.value) || 0)} placeholder={String(lv)} style={inputPw} /></div>
                                <div><div style={{ fontSize: 9, color: T.sub2 }}>Alt. CT (mm)</div><input type="number" value={v.ctAltezza || ""} onChange={e => pwUpdVano(v.id, "ctAltezza", parseInt(e.target.value) || 0)} placeholder={String(hv)} style={inputPw} /></div>
                                <div><div style={{ fontSize: 9, color: T.sub2 }}>Spessore (mm)</div><input type="number" value={v.ctSpessore || ""} onChange={e => pwUpdVano(v.id, "ctSpessore", parseInt(e.target.value) || 0)} placeholder="50" style={inputPw} /></div>
                              </div>
                              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Posizione</div>
                                  <div style={{ display: "flex", gap: 3 }}>
                                    {["Interno", "Mezzeria", "Esterno"].map(pos => (<div key={pos} onClick={() => pwUpdVano(v.id, "ctPosizione", pos)} style={{ ...chipPw(v.ctPosizione === pos), padding: "5px 8px", fontSize: 9 }}>{pos}</div>))}
                                  </div>
                                </div>
                              </div>
                              <div><div style={{ fontSize: 9, color: T.sub2 }}>Note CT</div><input value={v.ctNote || ""} onChange={e => pwUpdVano(v.id, "ctNote", e.target.value)} placeholder="Fissaggio, spallette, note muratura..." style={inputPw} /></div>
                            </div>
                          )}
                        </div>

                        {/* ══════ ACCESSORI (ESPANSO CON MISURE) ══════ */}
                        <div id={`pw-sec-acc-${v.id}`} style={{ background: `${T.grn}05`, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${T.grn}15` }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: T.grn, marginBottom: 8 }}><I d={ICO.home} /> ACCESSORI</div>

                          {/* ── TAPPARELLA ── */}
                          <div style={{ marginBottom: 10 }}>
                            <div onClick={() => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...(acc.tapparella || {}), attivo: !acc.tapparella?.attivo } })} style={{ ...chipPwGrn(acc.tapparella?.attivo), display: "inline-block" }}><I d={ICO.grid} /> Tapparella</div>
                            {acc.tapparella?.attivo && (
                              <div style={{ marginTop: 6, padding: 10, background: T.card, borderRadius: 8, border: `1px solid ${T.grn}15` }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Larghezza mm</div><input type="number" value={acc.tapparella.l || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...acc.tapparella, l: parseInt(e.target.value) || 0 } })} placeholder={String(lv)} style={inputPw} /></div>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Altezza mm</div><input type="number" value={acc.tapparella.h || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...acc.tapparella, h: parseInt(e.target.value) || 0 } })} placeholder={String(hv)} style={inputPw} /></div>
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}>MATERIALE</div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any, marginBottom: 6 }}>
                                  {TAPP_TIPO.map(tt => (<div key={tt} onClick={() => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...acc.tapparella, tipo: tt } })} style={{ padding: "5px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", background: acc.tapparella.tipo === tt ? `${T.grn}15` : T.bg, color: acc.tapparella.tipo === tt ? T.grn : T.sub, border: `1px solid ${acc.tapparella.tipo === tt ? T.grn : T.bdr}` }}>{tt}</div>))}
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}>MOTORIZZATA</div>
                                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                                  {["Sì", "No"].map(m => (<div key={m} onClick={() => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...acc.tapparella, motorizzata: m === "Sì" } })} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", background: (acc.tapparella.motorizzata ? "Sì" : "No") === m ? `${T.grn}15` : T.bg, color: (acc.tapparella.motorizzata ? "Sì" : "No") === m ? T.grn : T.sub, border: `1px solid ${(acc.tapparella.motorizzata ? "Sì" : "No") === m ? T.grn : T.bdr}` }}>{m}</div>))}
                                </div>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Tipo misura</div><select value={acc.tapparella.tipoMisura || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...acc.tapparella, tipoMisura: e.target.value } })} style={inputPw}><option value="">Standard</option><option>Su misura</option><option>Fuori misura</option></select></div>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Colore</div><select value={acc.tapparella.colore || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { ...acc.tapparella, colore: e.target.value } })} style={{ width: "100%", padding: "8px", fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card }}><option value="">— Colore —</option>{coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}</select></div>
                                </div>
                                <div onClick={() => pwUpdVano(v.id, "accessori", { ...acc, tapparella: { attivo: false } })} style={{ padding: "5px 0", textAlign: "center", fontSize: 9, color: T.red, fontWeight: 700, cursor: "pointer" }}>↩ Rimuovi tapparella</div>
                              </div>
                            )}
                          </div>

                          {/* ── PERSIANA ── */}
                          <div style={{ marginBottom: 10 }}>
                            <div onClick={() => pwUpdVano(v.id, "accessori", { ...acc, persiana: { ...(acc.persiana || {}), attivo: !acc.persiana?.attivo } })} style={{ ...chipPwGrn(acc.persiana?.attivo), display: "inline-block" }}><I d={ICO.home} /> Persiana</div>
                            {acc.persiana?.attivo && (
                              <div style={{ marginTop: 6, padding: 10, background: T.card, borderRadius: 8, border: `1px solid ${T.grn}15` }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Larghezza mm</div><input type="number" value={acc.persiana.l || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, persiana: { ...acc.persiana, l: parseInt(e.target.value) || 0 } })} placeholder={String(lv)} style={inputPw} /></div>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Altezza mm</div><input type="number" value={acc.persiana.h || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, persiana: { ...acc.persiana, h: parseInt(e.target.value) || 0 } })} placeholder={String(hv)} style={inputPw} /></div>
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}>MATERIALE</div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any, marginBottom: 6 }}>
                                  {PERS_TIPO.map(pt => (<div key={pt} onClick={() => pwUpdVano(v.id, "accessori", { ...acc, persiana: { ...acc.persiana, tipo: pt } })} style={{ padding: "5px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", background: acc.persiana.tipo === pt ? `${T.grn}15` : T.bg, color: acc.persiana.tipo === pt ? T.grn : T.sub, border: `1px solid ${acc.persiana.tipo === pt ? T.grn : T.bdr}` }}>{pt}</div>))}
                                </div>
                                <div style={{ display: "flex", gap: 6 }}>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>N° ante</div><input type="number" value={acc.persiana.ante || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, persiana: { ...acc.persiana, ante: parseInt(e.target.value) || 0 } })} placeholder="2" style={inputPw} /></div>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Colore</div><select value={acc.persiana.colore || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, persiana: { ...acc.persiana, colore: e.target.value } })} style={{ width: "100%", padding: "8px", fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card }}><option value="">— Colore —</option>{coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}</select></div>
                                </div>
                                <div onClick={() => pwUpdVano(v.id, "accessori", { ...acc, persiana: { attivo: false } })} style={{ marginTop: 6, padding: "5px 0", textAlign: "center", fontSize: 9, color: T.red, fontWeight: 700, cursor: "pointer" }}>↩ Rimuovi persiana</div>
                              </div>
                            )}
                          </div>

                          {/* ── ZANZARIERA ── */}
                          <div style={{ marginBottom: 10 }}>
                            <div onClick={() => pwUpdVano(v.id, "accessori", { ...acc, zanzariera: { ...(acc.zanzariera || {}), attivo: !acc.zanzariera?.attivo } })} style={{ ...chipPwGrn(acc.zanzariera?.attivo), display: "inline-block" }}><I d={ICO.bug} /> Zanzariera</div>
                            {acc.zanzariera?.attivo && (
                              <div style={{ marginTop: 6, padding: 10, background: T.card, borderRadius: 8, border: `1px solid ${T.grn}15` }}>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Larghezza mm</div><input type="number" value={acc.zanzariera.l || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, zanzariera: { ...acc.zanzariera, l: parseInt(e.target.value) || 0 } })} placeholder={String(lv)} style={inputPw} /></div>
                                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Altezza mm</div><input type="number" value={acc.zanzariera.h || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, zanzariera: { ...acc.zanzariera, h: parseInt(e.target.value) || 0 } })} placeholder={String(hv)} style={inputPw} /></div>
                                </div>
                                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 4 }}>TIPO</div>
                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any, marginBottom: 6 }}>
                                  {ZANZ_TIPO.map(zt => (<div key={zt} onClick={() => pwUpdVano(v.id, "accessori", { ...acc, zanzariera: { ...acc.zanzariera, tipo: zt } })} style={{ padding: "5px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", background: acc.zanzariera.tipo === zt ? `${T.grn}15` : T.bg, color: acc.zanzariera.tipo === zt ? T.grn : T.sub, border: `1px solid ${acc.zanzariera.tipo === zt ? T.grn : T.bdr}` }}>{zt}</div>))}
                                </div>
                                <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Colore</div><select value={acc.zanzariera.colore || ""} onChange={e => pwUpdVano(v.id, "accessori", { ...acc, zanzariera: { ...acc.zanzariera, colore: e.target.value } })} style={{ width: "100%", padding: "8px", fontSize: 11, border: `1px solid ${T.bdr}`, borderRadius: 6, background: T.card }}><option value="">— Colore —</option>{coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}</select></div>
                                <div onClick={() => pwUpdVano(v.id, "accessori", { ...acc, zanzariera: { attivo: false } })} style={{ marginTop: 6, padding: "5px 0", textAlign: "center", fontSize: 9, color: T.red, fontWeight: 700, cursor: "pointer" }}>↩ Rimuovi zanzariera</div>
                              </div>
                            )}
                          </div>

                          {/* Cassonetto + Coprifilo + Soglia + Davanzale */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
                            <div><div style={{ fontSize: 9, color: T.sub2 }}>Cassonetto</div><select value={v.cassonetto || ""} onChange={e => pwUpdVano(v.id, "cassonetto", e.target.value)} style={inputPw}>{CASS_OPT.map(co => <option key={co} value={co}>{co || "Nessuno"}</option>)}</select></div>
                            <div><div style={{ fontSize: 9, color: T.sub2 }}>Coprifilo</div><select value={v.coprifilo || ""} onChange={e => pwUpdVano(v.id, "coprifilo", e.target.value)} style={inputPw}>{COPRIFILO_OPT.map(cf => <option key={cf} value={cf}>{cf || "Nessuno"}</option>)}</select></div>
                            <div><div style={{ fontSize: 9, color: T.sub2 }}>Soglia</div><select value={v.soglia || ""} onChange={e => pwUpdVano(v.id, "soglia", e.target.value)} style={inputPw}>{SOGLIA_OPT.map(sg => <option key={sg} value={sg}>{sg || "Nessuna"}</option>)}</select></div>
                            <div><div style={{ fontSize: 9, color: T.sub2 }}>Davanzale</div><select value={v.davanzale || ""} onChange={e => pwUpdVano(v.id, "davanzale", e.target.value)} style={inputPw}>{DAVANZALE_OPT.map(dv => <option key={dv} value={dv}>{dv || "Nessuno"}</option>)}</select></div>
                          </div>
                        </div>

                        {/* ── PREZZO ── */}
                        <div id={`pw-sec-prezzo-${v.id}`} style={{ display: "flex", gap: 6, alignItems: "flex-end", marginBottom: 6 }}>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Da listino</div><div style={{ padding: 10, background: T.bg, borderRadius: 8, fontSize: 13, fontWeight: 700, color: T.sub }}>€{pwFmt(pUnit)}</div></div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: T.sub2 }}>Override €</div><input type="number" placeholder={String(pUnit)} value={v.prezzoManuale ?? ""} onChange={e => pwUpdVano(v.id, "prezzoManuale", e.target.value ? parseFloat(e.target.value) : null)} style={{ ...inputPw, fontWeight: 800, color: T.acc }} /></div>
                        </div>
                        <div style={{ textAlign: "right" as any, fontSize: 11, color: T.sub, marginBottom: 10 }}>× {v.pezzi || 1}pz = <span style={{ fontSize: 16, fontWeight: 900, color: T.acc }}>€{pwFmt(pTot)}</span></div>

                        {/* ── NOTE ── */}
                        <input placeholder="Note vano..." value={v.note || ""} onChange={e => pwUpdVano(v.id, "note", e.target.value)} style={{ ...inputPw, marginBottom: 10 }} />

                        {/* ── AZIONI ── */}
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => pwDuplicaVano(v, true)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.orange}30`, background: `${T.orange}10`, color: T.orange, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.refreshCw} /> Crea modifica</button>
                          <button onClick={() => pwDuplicaVano(v, false)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.blue}30`, background: `${T.blue}10`, color: T.blue, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.clipboard} /> Duplica</button>
                          <button onClick={() => { if (confirm("Elimina " + (v.nome || "vano") + "?")) deleteVano(c.id, v.id); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${T.red}30`, background: `${T.red}10`, color: T.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.trash} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* + Aggiungi vano */}
              <div onClick={() => { setPrevTab("preventivo"); }} style={{ padding: 14, textAlign: "center", borderRadius: 12, border: `2px dashed ${T.acc}40`, color: T.acc, fontSize: 13, fontWeight: 800, cursor: "pointer", marginBottom: 14, background: `${T.acc}05` }}>+ Aggiungi vano</div>

              {/* ═══ RIEPILOGO PDF TECNICI FORNITORE ═══ */}
              {(() => {
                const vaniConPdf = pwVani.filter(v => v.pdfFornitore);
                const vaniSenzaPdf = pwVani.filter(v => !v.pdfFornitore);
                if (pwVani.length === 0) return null;
                return (
                  <div style={{ marginBottom: 14, background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", background: vaniConPdf.length === pwVani.length ? "#1A9E7310" : "#3B7FE010", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14 }}>📐</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: T.text, flex: 1 }}>Disegni Tecnici Fornitore</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: vaniConPdf.length === pwVani.length ? "#1A9E73" : "#D08008" }}>
                        {vaniConPdf.length}/{pwVani.length} vani
                      </span>
                    </div>
                    {vaniConPdf.map(v => (
                      <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: `1px solid ${T.bdr}` }}>
                        <span style={{ fontSize: 18 }}>📄</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v.nome || `Vano ${v.id}`}</div>
                          <div style={{ fontSize: 10, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{v.pdfFornitoreNome || "disegno_tecnico.pdf"} · {v.pdfFornitoreData || ""}</div>
                        </div>
                        <div onClick={() => {
                          const link = document.createElement("a");
                          link.href = v.pdfFornitore;
                          link.download = v.pdfFornitoreNome || `disegno_${v.nome || v.id}.pdf`;
                          link.click();
                        }} style={{ padding: "5px 12px", borderRadius: 7, background: "#3B7FE015", border: "1px solid #3B7FE040", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#3B7FE0", whiteSpace: "nowrap" as const }}>
                          ⬇ Apri
                        </div>
                      </div>
                    ))}
                    {vaniSenzaPdf.length > 0 && (
                      <div style={{ padding: "8px 14px", fontSize: 10, color: T.sub }}>
                        {vaniSenzaPdf.map(v => v.nome || `Vano ${v.id}`).join(", ")} — PDF mancante
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Voci extra */}
              <div style={{ fontSize: 12, fontWeight: 800, marginTop: 8, marginBottom: 8 }}><I d={ICO.paperclip} /> Voci extra</div>
              {pwVociLibere.map((vl, vli) => (
                <div key={vl.id || vli} style={{ display: "flex", alignItems: "center", gap: 4, padding: 10, background: T.card, borderRadius: 10, marginBottom: 4, border: `1px solid ${T.bdr}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{vl.desc}</div><div style={{ fontSize: 9, color: T.sub }}>€{vl.importo} × {vl.qta || 1}</div></div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.acc }}>€{pwFmt((vl.importo || 0) * (vl.qta || 1))}</div>
                  <div onClick={() => updCM("vociLibere", pwVociLibere.filter((_, i) => i !== vli))} style={{ fontSize: 16, color: T.red, cursor: "pointer", padding: "0 4px" }}>✕</div>
                </div>
              ))}
              {ccConfirm === "addVoce" ? (
                <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 8, border: `1px solid ${T.bdr}` }}>
                  <input placeholder="Descrizione" value={voceTempDesc || ""} onChange={e => setVoceTempDesc(e.target.value)} style={{ ...inputPw, marginBottom: 4 }} />
                  <div style={{ display: "flex", gap: 4 }}>
                    <input type="number" placeholder="€" value={voceTempImporto || ""} onChange={e => setVoceTempImporto(e.target.value)} style={{ ...inputPw, flex: 2 }} />
                    <input type="number" placeholder="Qt" value={voceTempQta || "1"} onChange={e => setVoceTempQta(e.target.value)} style={{ ...inputPw, flex: 1 }} />
                    <button onClick={() => {
                      if (!voceTempDesc || !voceTempImporto) return;
                      updCM("vociLibere", [...pwVociLibere, { id: Date.now(), desc: voceTempDesc, importo: parseFloat(voceTempImporto) || 0, qta: parseInt(voceTempQta) || 1 }]);
                      setCcConfirm(null); setVoceTempDesc(""); setVoceTempImporto(""); setVoceTempQta("1");
                    }} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: T.grn, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓</button>
                  </div>
                </div>
              ) : (<div onClick={() => setCcConfirm("addVoce")} style={{ padding: 12, textAlign: "center", fontSize: 12, color: T.acc, fontWeight: 700, cursor: "pointer" }}>+ Aggiungi voce</div>)}

              <textarea value={c.notePreventivo || ""} onChange={e => updCM("notePreventivo", e.target.value)} rows={3} placeholder="Condizioni, tempi, garanzie..." style={{ ...inputPw, resize: "vertical" as any, lineHeight: 1.5, marginTop: 8 }} />

              {/* ═══ CTA AZIONI PREVENTIVO ═══ */}
              {pwVani.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1.5px solid ${T.bdr}` }}>
                  {/* Totale riepilogo */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Totale IVA inclusa</span>
                    <span style={{ fontSize: 20, fontWeight: 900, color: T.acc }}>€{pwFmt(pwTotale)}</span>
                  </div>
                  {/* Buttons */}
                  {pwBloccato && (
                    <div style={{ background: "#DC444410", border: "1.5px solid #DC444440", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 11, color: "#DC4444", fontWeight: 700 }}>
                      🔒 {pwVaniNonConf.length} vano/i con misure non confermate — apri i vani per confermarle
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <button onClick={() => { if(!pwBloccato) generaPreventivoPDF(c); }} style={{ flex: 1, padding: 14, borderRadius: 10, background: pwBloccato ? "#DC444415" : `${T.acc}10`, color: pwBloccato ? "#DC4444" : T.acc, border: `1.5px solid ${pwBloccato ? "#DC444460" : T.acc}`, fontSize: 13, fontWeight: 800, cursor: pwBloccato ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: pwBloccato ? 0.7 : 1 }}><I d={ICO.fileText} /> {pwBloccato ? "🔒 Misure" : "Scarica PDF"}</button>
                    <button onClick={() => setShowPreventivoModal(true)} style={{ flex: 1, padding: 14, borderRadius: 10, background: T.card, color: T.sub, border: `1.5px solid ${T.bdr}`, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.eye} /> Anteprima</button>
                  </div>
                  {/* Step 1: Genera link + PDF + WhatsApp */}
                  <button onClick={async () => {
                    if (pwBloccato) return;
                    // 1. Genera PDF scaricabile
                    generaPreventivoPDF(c);
                    // 2. Genera pagina condivisibile con firma
                    const url = await generaPreventivoCondivisibile(c);
                    // 3. Segna come inviato
                    updCM("preventivoInviato", true);
                    updCM("dataPreventivoInvio", new Date().toISOString().split("T")[0]);
                    if (url) updCM("linkPreventivo", url);
                  }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: pwBloccato ? "#8e8e93" : "#25d366", color: "#fff", fontSize: 15, fontWeight: 800, cursor: pwBloccato ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: pwBloccato ? 0.6 : 1 }}><I d={ICO.upload} /> {pwBloccato ? "🔒 Conferma misure prima di inviare" : "GENERA PDF + INVIA CON FIRMA →"}</button>
                  <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 6, lineHeight: 1.5 }}>
                    Scarica il PDF e apre WhatsApp con il link per la firma elettronica del cliente
                  </div>
                  {/* Avanti — solo se preventivo inviato e fase prima di conferma */}
                  {c.preventivoInviato && faseIndex(c.fase) < faseIndex("conferma") && (
                    <button onClick={() => { setFaseTo(c.id, "conferma"); setPrevWorkspace(false); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}><I d={ICO.edit} />️ AVANTI → Conferma ordine</button>
                  )}
                  {!c.preventivoInviato && (
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <span onClick={() => { updCM("preventivoInviato", true); }} style={{ fontSize: 11, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>✅ Già inviato al cliente</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════ TAB RIEPILOGO ════════ */}
          {prevTab === "riepilogo" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ background: T.topbar || "#1A1A1C", borderRadius: 12, padding: 16, marginBottom: 12, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 10, color: "#ffffff60" }}>PREVENTIVO</div><div style={{ fontSize: 26, fontWeight: 900, marginTop: 2 }}>€{pwFmt(pwTotale)}</div></div>
                  {pwDetrObj && pwDetrObj.perc > 0 && (<div style={{ background: `${T.grn}30`, borderRadius: 8, padding: "6px 10px", textAlign: "right" as any }}><div style={{ fontSize: 9, color: "#ffffffa0" }}>{pwDetrObj.l}</div><div style={{ fontSize: 14, fontWeight: 900, color: "#4ade80" }}>-€{pwFmt(pwDetraibile)}</div></div>)}
                </div>
                <div style={{ fontSize: 10, color: "#ffffff60", marginTop: 6 }}>{c.code} · {c.cliente} · {pwVani.length} vani · {pwVani.reduce((s, v) => s + (v.pezzi || 1), 0)}pz</div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>INFISSI</div>
              {pwVani.map(v => {
                const pv = calcolaVanoPrezzo(v, c) * (v.pezzi || 1);
                const lv = v.misure?.lCentro || v.larghezza || v.l || 0;
                const hv = v.misure?.hCentro || v.altezza || v.h || 0;
                const ac = v.accessori || {};
                return (
                  <div key={v.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.bdr}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ fontWeight: 700 }}>{v.nome || "Vano"}{v.parentId ? " <I d={ICO.refreshCw} />" : ""}</span>
                      <span style={{ fontWeight: 800, color: T.acc }}>€{pwFmt(pv)}</span>
                    </div>
                    <div style={{ fontSize: 9, color: T.sub }}>{v.tipo} · {lv}×{hv} · {v.pezzi || 1}pz · {v.colore || "B."} · {v.vetro || "Std"}{v.controtelaio && v.controtelaio !== "Nessuno" ? ` · CT: ${v.controtelaio}` : ""}{ac.tapparella?.attivo ? ` · Tapp. ${ac.tapparella.tipo || ""}` : ""}{ac.persiana?.attivo ? ` · Pers. ${ac.persiana.tipo || ""}` : ""}{ac.zanzariera?.attivo ? ` · Zanz. ${ac.zanzariera.tipo || ""}` : ""}{v.coprifilo ? ` · CF: ${v.coprifilo}` : ""}{v.soglia ? ` · Soglia: ${v.soglia}` : ""}</div>
                  </div>
                );
              })}

              {pwVociLibere.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>LAVORI</div>
                {pwVociLibere.map((vl, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}><span>{vl.desc} <span style={{ color: T.sub, fontSize: 9 }}>×{vl.qta || 1}</span></span><span style={{ fontWeight: 700 }}>€{pwFmt((vl.importo || 0) * (vl.qta || 1))}</span></div>))}</>)}

              <div style={{ background: T.card, borderRadius: 12, padding: 14, marginTop: 14, border: `1px solid ${T.bdr}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: T.sub }}>Subtotale</span><span>€{pwFmt(pwSubtot)}</span></div>
                {pwSconto > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: T.grn }}>Sconto {pwSconto}%</span><span style={{ color: T.grn, fontWeight: 700 }}>-€{pwFmt(pwScontoVal)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: T.sub }}>Imponibile</span><span style={{ fontWeight: 700 }}>€{pwFmt(pwImponibile)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}><span style={{ color: T.sub }}>IVA {pwIvaDefault}%</span><span>€{pwFmt(pwIvaCalc)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${T.acc}`, paddingTop: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 900 }}>TOTALE</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: T.acc }}>€{pwFmt(pwTotale)}</span>
                </div>
                {pwDetrObj && pwDetrObj.perc > 0 && (<>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "8px 10px", background: `${T.grn}10`, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.grn }}><I d={ICO.building} /> {pwDetrObj.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: T.grn }}>-€{pwFmt(pwDetraibile)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Costo effettivo</span>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>€{pwFmt(pwTotale - pwDetraibile)}</span>
                  </div>
                </>)}
              </div>

              {c.notePreventivo && (<div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 10, fontSize: 10, color: T.sub, lineHeight: 1.6, whiteSpace: "pre-wrap" as any }}><div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>NOTE E CONDIZIONI</div>{c.notePreventivo}</div>)}

              <div style={{ marginTop: 16, display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => generaPreventivoPDF(c)} style={{ flex: 1, padding: 14, borderRadius: 10, background: `${T.acc}10`, color: T.acc, border: `1.5px solid ${T.acc}`, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.fileText} /> PDF</button>
                <button onClick={() => setShowPreventivoModal(true)} style={{ flex: 1, padding: 14, borderRadius: 10, background: T.card, color: T.sub, border: `1.5px solid ${T.bdr}`, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.eye} /> Anteprima</button>
              </div>
              <button onClick={async () => {
                generaPreventivoPDF(c);
                const url = await generaPreventivoCondivisibile(c);
                updCM("preventivoInviato", true);
                updCM("dataPreventivoInvio", new Date().toISOString().split("T")[0]);
                if (url) updCM("linkPreventivo", url);
                setCcDone("📤 PDF scaricato + link firma inviato!"); setTimeout(() => setCcDone(null), 3000);
              }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: "#25d366", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.upload} /> GENERA PDF + INVIA CON FIRMA →</button>
              <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>Scarica PDF e apre WhatsApp con link firma elettronica</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                <span onClick={() => { updCM("preventivoInviato", true); setCcDone("✅ Completato"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000); }} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>✅ Segna completato</span>
              </div>

              {/* ═══ FASCICOLO GEOMETRA ═══ */}
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.bdr}`, paddingTop: 14 }}>
                <button
                  onClick={async () => {
                    setShowFascicoloModal(true);
                    setFascicoloStep("idle");
                    setFascicoloLink(null);
                    const storico = await getFascicoliCommessa(c.id);
                    setFascicoliStorico(storico);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2D7A6B 0%, #1A9E73 100%)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <span style={{ fontSize: 16 }}>📐</span> Fascicolo Geometra
                </button>
                <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>PDF tecnico · Link cliente · Excel ENEA</div>
              </div>
              {/* Avanti dopo invio — solo se non ancora confermato */}
              {c.preventivoInviato && faseIndex(c.fase) < faseIndex("conferma") && (
                <button onClick={() => { setFaseTo(c.id, "conferma"); setPrevWorkspace(false); setCcDone(null); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}><I d={ICO.edit} />️ AVANTI → Conferma ordine</button>
              )}
              {ccDone && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#34c75918", border: "1px solid #34c75940", fontSize: 12, fontWeight: 700, color: "#34c759", textAlign: "center" }}>{ccDone}</div>}
            </div>
          )}

          {/* ════════ TAB IMPORTA (da competitor / documento) ════════ */}
          {prevTab === "importa" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ padding: 16, background: `${T.blue}08`, borderRadius: 12, marginBottom: 12, border: `1px solid ${T.blue}20` }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.blue, marginBottom: 4 }}><I d={ICO.download} /> Importa preventivo competitor</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>Scansiona o carica il preventivo di un competitor. MASTRO rileverà automaticamente misure, colori, tipologie, coprifili e creerà un preventivo da rivedere.</div>
              </div>

              {/* Upload options */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: 20, background: T.card, borderRadius: 12, border: `2px dashed ${T.blue}40`, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}><I d={ICO.camera} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>Scatta foto</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Inquadra il preventivo</div>
                </div>
                <div style={{ flex: 1, padding: 20, background: T.card, borderRadius: 12, border: `2px dashed ${T.acc}40`, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}><I d={ICO.fileText} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>Carica file</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>PDF, Word, immagine</div>
                </div>
              </div>

              {/* Esempio risultato AI */}
              <div style={{ background: T.card, borderRadius: 12, padding: 14, border: `1px solid ${T.bdr}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.purple, marginBottom: 8 }}><I d={ICO.cpu} /> Esempio: cosa rileva MASTRO</div>
                <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.8 }}>
                  <div style={{ marginBottom: 6 }}>Dal documento competitor, MASTRO estrae:</div>
                  {[
                    { icon: "📐", t: "Misure", d: "Larghezza × altezza per ogni vano" },
                    { icon: "🎨", t: "Colori", d: "Bianco, Antracite, Rovere, ecc." },
                    { icon: "⊞", t: "Tipologie", d: "F2A, PF2A, Scorrevole, ecc." },
                    { icon: "◻", t: "Controtelai", d: "Standard, Monoblocco" },
                    { icon: "🏠", t: "Accessori", d: "Tapparelle, persiane, zanzariere" },
                    { icon: "📦", t: "Complementi", d: "Coprifili, soglie, davanzali" },
                    { icon: "€", t: "Prezzi competitor", d: "Per confronto (non importati)" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span>{r.icon}</span>
                      <span style={{ fontWeight: 700, color: T.text, width: 80 }}>{r.t}</span>
                      <span style={{ color: T.sub }}>{r.d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 12, background: `${T.grn}08`, borderRadius: 10, border: `1px solid ${T.grn}20`, fontSize: 11, color: T.grn, fontWeight: 600, textAlign: "center" }}>
                <I d={ICO.sparkles} /> MASTRO crea il preventivo, tu rivedi solo sistema e prezzi
              </div>
            </div>
          )}

          </div>

          {/* FAB — navigate sections — GRANDE con menu espandibile */}
          {editingVanoId && prevTab === "preventivo" && (() => {
            const secs = [
              { id: "foto", ico: <I d={ICO.camera} />, label: "Foto" },
              { id: "tipo", ico: <I d={ICO.fileText} />, label: "Tipo" },
              { id: "misure", ico: <I d={ICO.ruler} />, label: "Misure" },
              { id: "sistema", ico: <I d={ICO.building} />, label: "Sistema" },
              { id: "ct", ico: <I d={ICO.square} />, label: "Controtelaio" },
              { id: "acc", ico: <I d={ICO.home} />, label: "Accessori" },
              { id: "prezzo", ico: <I d={ICO.euro} />, label: "Prezzo" },
            ];
            const fabOpen = fabSecOpen;
            const setFabOpen = setFabSecOpen;
            return (
              <>
                {/* Overlay quando aperto */}
                {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.15)" }} />}
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                <div style={{ position: "fixed", bottom: 84, right: 16, zIndex: 99, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  {/* Menu espanso */}
                  {fabOpen && secs.map((s, si) => (
                    <div key={s.id} onClick={() => {
                      document.getElementById(`pw-sec-${s.id}-${editingVanoId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      setFabOpen(false);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                      animation: `fadeIn 0.15s ease ${si * 0.03}s both`,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.65)", padding: "5px 10px", borderRadius: 8, backdropFilter: "blur(4px)" }}>{s.label}</span>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, background: T.card, border: `1.5px solid ${T.bdr}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                      }}>{s.ico}</div>
                    </div>
                  ))}

                  {/* FAB principale */}
                  <div onClick={() => setFabOpen(!fabOpen)} style={{
                    width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", background: T.acc, boxShadow: "0 4px 20px rgba(208,128,8,0.35)",
                    transition: "transform 0.2s", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}>
                    <span style={{ fontSize: 26, color: "#fff", lineHeight: 1 }}>+</span>
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      );
    }

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
    const vaniBloccati = vaniList.filter(v => v.note?.startsWith("⚠ BLOCCATO"));
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}><I d={ICO.tag} /> Tipo di visita</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Seleziona il tipo di sopralluogo</div>
            {[
              { k: "rilievo",    ico: <I d={ICO.ruler} />, label: "Rilievo misure",     desc: "Prima visita o misure di vani mancanti" },
              { k: "definitiva", ico: "✅", label: "Misure definitive",  desc: "Conferma finale di tutte le misure" },
              { k: "modifica",   ico: <I d={ICO.wrench} />, label: "Modifica cantiere",  desc: "Variazione, problema o sopralluogo post-vendita" },
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}><I d={ICO.clipboard} /> Dati della visita</div>
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}><I d={ICO.alertTriangle} /> Vani non misurati</div>
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
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}><I d={ICO.clipboard} /> Riepilogo</div>
            <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.sub }}><I d={ICO.calendar} /> {nvData.data ? new Date(nvData.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : "—"} · <I d={ICO.clock} /> {nvData.ora || "--:--"}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}><I d={ICO.user} /> {nvData.rilevatore || "Non specificato"}</div>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 7 }}><I d={ICO.alertTriangle} /> Bloccati</div>
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
            <span style={{ fontSize: 14 }}><I d={ICO.clipboard} /></span>
          </div>
          <div onClick={exportPDF} style={{ padding: "6px 10px", borderRadius: 6, background: T.redLt, cursor: "pointer" }}>
            <Ico d={ICO.file} s={16} c={T.red} />
          </div>
        </div>

        {/* Banner rilievo info */}
        {r?.motivoModifica && (
          <div style={{ margin: "4px 16px 0", padding: "8px 12px", background: T.orangeLt, borderRadius: 8, border: `1px solid ${T.orange}30`, fontSize: 12, color: T.orange }}>
            <I d={ICO.wrench} /> <strong>Modifica:</strong> {r.motivoModifica}
          </div>
        )}

        {/* Barra progresso vani */}
        {vaniList.length > 0 && (
          <div style={{ padding: "8px 16px" }}>
            <div style={{ height: 5, background: T.bdr, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${progVani}%`, background: progVani === 100 ? T.grn : tipoColRil, borderRadius: 3 }} />
            </div>
            {vaniDaFare.filter(v => !v.note?.startsWith("⚠")).length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Mancano misure: {vaniDaFare.filter(v => !v.note?.startsWith("⚠")).map(v => v.nome).join(", ")}</div>}
            {tutteMis && <div style={{ fontSize: 11, color: T.grn, fontWeight: 600 }}>✅ Tutte le misure raccolte</div>}
          </div>
        )}

        {/* Info badges */}
        <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}><I d={ICO.wrench} /> Riparazione</span>}
          {c.tipo === "nuova" && <span style={S.badge(T.grnLt, T.grn)}>🆕 Nuova</span>}
          {c.sistema && <span style={S.badge(T.blueLt, T.blue)}>{c.sistema}</span>}
          {c.difficoltaSalita && <span style={S.badge(c.difficoltaSalita === "facile" ? T.grnLt : c.difficoltaSalita === "media" ? T.orangeLt : T.redLt, c.difficoltaSalita === "facile" ? T.grn : c.difficoltaSalita === "media" ? T.orange : T.red)}>Salita: {c.difficoltaSalita}</span>}
          {c.mezzoSalita && <span style={S.badge(T.purpleLt, T.purple)}>🪜 {c.mezzoSalita}</span>}
          {c.pianoEdificio && <span style={S.badge(T.blueLt, T.blue)}>Piano: {c.pianoEdificio}</span>}
          {c.foroScale && <span style={S.badge(T.redLt, T.red)}>Foro: {c.foroScale}</span>}
          {c.telefono && <span onClick={() => window.location.href=`tel:${c.telefono}`} style={{ ...S.badge(T.grnLt, T.grn), cursor: "pointer" }}><I d={ICO.phone} /> {c.telefono}</span>}
        </div>
        {c.note && <div style={{ padding: "0 16px", marginBottom: 6 }}><div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.sub, lineHeight: 1.4 }}><I d={ICO.fileText} /> {c.note}</div></div>}

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
          const incassatoCC = fattCC.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
          const tuttoCC = (hasSaldoCC && saldoPagCC) || (fattCC.some(f => f.tipo === "unica") && unicaPagCC) || (c.fase === "chiusura" && incassatoCC >= totIvaCC) || (incassatoCC >= totIvaCC && fattCC.length > 0 && fattCC.every(f => f.pagata));
          const fmtCC = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";

          const skipped = (id) => (c.skipLog || []).some(s => s.fase === id);
          const stepsCC = [
            { id: "sopralluogo", icon: "🔍", l: "Sopralluogo", done: (rilieviCC.length > 0 && vaniCC.length > 0) || skipped("sopralluogo"), skipped: skipped("sopralluogo"), desc: "Misure, foto, note dal cantiere" },
            { id: "preventivo", icon: "📋", l: "Preventivo", done: !!c.preventivoInviato || skipped("preventivo"), skipped: skipped("preventivo"), desc: "Rivedi prezzi, sconti, condizioni" },
            { id: "conferma", icon: "✏️", l: "Conferma", done: hasFirmaCC || skipped("conferma"), skipped: skipped("conferma"), desc: "Firma cliente e conferma ordine" },
            { id: "ordini", icon: "📦", l: "Ordini", done: hasOrdCC || skipped("ordini"), skipped: skipped("ordini"), desc: "Ordina materiali ai fornitori" },
            { id: "produzione", icon: "🏭", l: "Produzione", done: confFirmCC || skipped("produzione"), skipped: skipped("produzione"), desc: "Attesa materiali e lavorazione" },
            { id: "posa", icon: "🔧", l: "Posa", done: montCC.some(m => ["completato","collaudo","chiuso"].includes(m.interventoStato || m.stato)) || skipped("posa"), skipped: skipped("posa"), desc: "Montaggio al cantiere" },
            { id: "collaudo", icon: "🔍", l: "Collaudo", done: !!c.collaudoOk || montCC.some(m => ["collaudo","chiuso"].includes(m.interventoStato)) || skipped("collaudo"), skipped: skipped("collaudo"), desc: "Verifica lavoro, foto finale" },
            { id: "chiusura", icon: "€", l: "Chiusura", done: tuttoCC, desc: "Fattura saldo e chiudi" },
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
                      background: s.skipped ? "#ff9500" : s.done ? "#34c759" : i === curIdxCC ? T.acc : T.bg,
                      color: s.done || s.skipped || i === curIdxCC ? "#fff" : T.sub, fontWeight: 700,
                    }}>{s.skipped ? "⏭" : s.done ? "✓" : s.icon}</div>
                    {i < stepsCC.length - 1 && <div style={{ width: 8, height: 2, background: s.done ? "#34c759" : T.bdr }} />}
                  </div>
                ))}
              </div>
              {/* Current action */}
              {curCC && (
                <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{curCC.icon}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{curCC.l}</span>
                      <div style={{ fontSize: 10, color: T.sub }}>{curCC.desc}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>{doneCC}/{stepsCC.length}</span>
                    {hasFattCC && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: tuttoCC ? "#1A9E7320" : "#D0800820", color: tuttoCC ? "#1A9E73" : "#D08008", marginLeft: 4 }}>
                        {tuttoCC ? "✅ Pagata" : "📄 Fatt."}
                      </span>
                    )}
                  </div>
                  {/* Success flash */}
                  {ccDone && <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#34c75918", border: "1px solid #34c75940", fontSize: 12, fontWeight: 700, color: "#34c759", textAlign: "center" }}>{ccDone}</div>}

                  {/* Skipped steps log */}
                  {(c.skipLog || []).length > 0 && (
                    <div style={{ marginBottom: 8, padding: "6px 10px", borderRadius: 8, background: "#ff950010", border: "1px solid #ff950030" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#ff9500", textTransform: "uppercase", marginBottom: 3 }}>Passaggi saltati</div>
                      {(c.skipLog || []).map((skip, si) => {
                        const stepInfo = stepsCC.find(s => s.id === skip.fase);
                        return (
                          <div key={si} style={{ fontSize: 10, color: T.text, display: "flex", gap: 6, padding: "2px 0" }}>
                            <span style={{ color: "#ff9500", fontWeight: 700 }}>⏭ {stepInfo?.l || skip.fase}</span>
                            <span style={{ color: T.sub, flex: 1 }}>{skip.motivo || "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ══ SOPRALLUOGO ══ */}
                  {curCC.id === "sopralluogo" && (
                    <div>
                      {rilieviCC.length === 0 ? (
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Vai al cantiere e prendi le misure dei vani</div>
                      ) : (
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                          {rilieviCC.length} rilievo · {vaniCC.length} vani {vaniCC.length > 0 ? "— aggiungi misure a tutti i vani" : "— aggiungi i vani"}
                        </div>
                      )}
                      {vaniCC.length === 0 ? (
                        <button onClick={() => { /* scroll to rilievo section */ }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#1A9E73", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.mapPin} /> AVVIA SOPRALLUOGO</button>
                      ) : (
                        <div style={{ fontSize: 12, color: T.grn, fontWeight: 700, textAlign: "center" }}>✅ {vaniCC.length} vani misurati — Vai al preventivo</div>
                      )}
                    </div>
                  )}

                  {/* ══ PREVENTIVO (CUORE — LINK A WORKSPACE) ══ */}
                  {curCC.id === "preventivo" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{vaniCC.length} vani · {vaniConPrezzoCC.length} con prezzo</div>
                      
                      {/* Totale rapido */}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: `${T.acc}10`, borderRadius: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Totale + IVA {ivaPercCC}%</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{fmtCC(totIvaCC)}</span>
                      </div>

                      {/* BOTTONE PRINCIPALE */}
                      <button onClick={() => { setPrevWorkspace(true); setPrevTab("preventivo"); setEditingVanoId(null); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}><I d={ICO.clipboard} /> APRI PREVENTIVO →</button>

                      <div style={{ textAlign: "center", marginTop: 2 }}>
                        <span onClick={() => {
                          setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoInviato: true, dataPreventivoInvio: new Date().toISOString().split("T")[0] } : cm));
                          setSelectedCM(prev => ({ ...prev, preventivoInviato: true }));
                          setCcDone("✅ Completato"); setTimeout(() => setCcDone(null), 3000);
                        }} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Già inviato? Segna come completato</span>
                      </div>
                    </div>
                  )}

                  {/* ══ CONFERMA (firma + fattura acconto) ══ */}
                  {curCC.id === "conferma" && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale: €{fmtCC(totIvaCC)} (IVA {ivaPercCC}% incl.)</div>
                      {hasFattCC && !fattCC.every(f => f.pagata) && (
                        <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#D0800815", border: "1px solid #D0800830", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13 }}>📄</span>
                          <span style={{ fontSize: 11, color: "#D08008", fontWeight: 600 }}>Fattura acconto emessa — verifica pagamento in Contabilità</span>
                        </div>
                      )}
                      {firmaStep === 0 ? (
                        <div>
                          <button onClick={async () => {
                            generaPreventivoPDF(c);
                            await generaPreventivoCondivisibile(c);
                            setFirmaStep(1);
                          }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#25d366", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 4 }}><I d={ICO.upload} /> GENERA PDF + INVIA CON FIRMA →</button>
                          <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginBottom: 6 }}>Scarica PDF e invia link firma elettronica via WhatsApp</div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <span onClick={() => generaPreventivoPDF(c)} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}><I d={ICO.fileText} /> Solo PDF</span>
                            <span onClick={() => setFirmaStep(1)} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Già inviato? Carica firma</span>
                          </div>
                        </div>
                      ) : !firmaFileUrl ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Carica il documento firmato dal cliente</div>
                          <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/pdf,image/*"; inp.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (!f) return; setFirmaFileName(f.name); const r = new FileReader(); r.onload = (e) => setFirmaFileUrl(e.target?.result as string); r.readAsDataURL(f); }; inp.click(); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: `2px dashed ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.download} /> CARICA FIRMATO</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ padding: 8, borderRadius: 8, background: "#34c75912", marginBottom: 6, fontSize: 11, color: "#34c759", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            <I d={ICO.paperclip} />
                            <span onClick={() => { if (firmaFileUrl) { const w = window.open(""); w?.document.write(`<iframe src="${firmaFileUrl}" style="width:100%;height:100vh;border:none"></iframe>`); } }} style={{ flex: 1, cursor: "pointer", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{firmaFileName}</span>
                            <a href={firmaFileUrl || "#"} download={firmaFileName} style={{ fontSize: 10, color: "#34c759", cursor: "pointer", textDecoration: "none", flexShrink: 0 }}>⬇</a>
                            <span onClick={() => { setFirmaFileUrl(null); setFirmaFileName(""); }} style={{ cursor: "pointer", flexShrink: 0 }}>✕</span>
                          </div>
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

                  {/* ══ ORDINI ══ */}
                  {curCC.id === "ordini" && (
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
                      {!hasFattCC && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Fattura acconto (opzionale)</div>
                          <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" as any }}>
                            {[30, 40, 50, 60, 100].map(p => (
                              <div key={p} onClick={() => setFattPerc(p)} style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 800, background: fattPerc === p ? T.acc : T.card, color: fattPerc === p ? "#fff" : T.text, border: `1.5px solid ${fattPerc === p ? T.acc : T.bdr}` }}>
                                {p === 100 ? "Unica" : p + "%"}
                              </div>
                            ))}
                          </div>
                          <button onClick={() => { setAccontoImporto(String(Math.round(totIvaCC * fattPerc / 100))); setShowAccontoModal(true); }} style={{ width: "100%", padding: 11, borderRadius: 8, border: `1px solid ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}><I d={ICO.euro} /> Crea fattura €{fmtCC(Math.round(totIvaCC * fattPerc / 100))}</button>

                          {/* ── MODAL IMPORTO ACCONTO ── */}
                          {showAccontoModal && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                              <div style={{ background: T.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>Fattura {fattPerc === 100 ? "unica" : "acconto"}</div>
                                <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Totale commessa IVA incl.: <strong>€{fmtCC(totIvaCC)}</strong></div>
                                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 600 }}>Importo da fatturare (€)</div>
                                <input
                                  type="number"
                                  value={accontoImporto}
                                  onChange={e => setAccontoImporto(e.target.value)}
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.acc}`, fontSize: 18, fontWeight: 800, color: T.acc, background: T.bg, fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box" as any, outline: "none" }}
                                  autoFocus
                                />
                                <div style={{ fontSize: 10, color: T.sub, marginBottom: 16 }}>
                                  {[30,40,50,60,100].map(p => (
                                    <span key={p} onClick={() => setAccontoImporto(String(Math.round(totIvaCC * p / 100)))} style={{ marginRight: 6, cursor: "pointer", color: T.acc, fontWeight: 700, textDecoration: "underline" }}>
                                      {p === 100 ? "Tutto" : p + "%"} (€{fmtCC(Math.round(totIvaCC * p / 100))})
                                    </span>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => setShowAccontoModal(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                                  <button onClick={() => {
                                    const imp = parseFloat(accontoImporto);
                                    if (!imp || imp <= 0) return;
                                    creaFattura(c, fattPerc === 100 ? "unica" : "acconto", imp);
                                    setShowAccontoModal(false);
                                    setCcDone("✅ Fattura creata!");
                                    setTimeout(() => setCcDone(null), 3000);
                                  }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CREA FATTURA €{fmtCC(parseFloat(accontoImporto) || 0)}</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <button onClick={() => setShowOrdinePreview(true)} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.package} /> CREA ORDINE FORNITORE →</button>

                      {/* ── MODAL ANTEPRIMA ORDINE FORNITORE ── */}
                      {showOrdinePreview && (() => {
                        const prevVani = getVaniAttivi(c);
                        const prevRighe = prevVani.map(v => {
                          const tipLabel = TIPOLOGIE_RAPIDE.find((t: any) => t.code === v.tipo)?.label || v.tipo || "—";
                          const m = v.misure || {};
                          const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
                          const prezzo = calcolaVanoPrezzo(v, c);
                          return {
                            desc: `${tipLabel} — ${v.stanza || ""} ${v.piano || ""}`.trim(),
                            misure: lmm > 0 && hmm > 0 ? `${lmm}×${hmm}` : "da definire",
                            qta: v.pezzi || 1,
                            prezzoUnit: Math.round(prezzo * 100) / 100,
                            totale: Math.round(prezzo * (v.pezzi || 1) * 100) / 100,
                            colore: v.coloreEst || "",
                          };
                        });
                        const prevTot = prevRighe.reduce((s, r) => s + r.totale, 0);
                        const prevTotIva = Math.round(prevTot * 1.22 * 100) / 100;
                        const fmtOrd = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";
                        return (
                          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
                            <div style={{ background: T.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 20, boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>
                              {/* Header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Anteprima Ordine Fornitore</div>
                                  <div style={{ fontSize: 11, color: T.sub }}>Commessa {c.code} · {c.cliente}</div>
                                </div>
                                <div onClick={() => setShowOrdinePreview(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: T.sub }}>✕</div>
                              </div>

                              {/* Info fornitore */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>Fornitore</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.sistema?.split(" ")[0] || "—"}</div>
                                <div style={{ fontSize: 11, color: T.sub }}>Sistema: {c.sistema || "non specificato"}</div>
                              </div>

                              {/* Righe ordine */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>Righe ordine ({prevRighe.length} vani)</div>
                                {prevRighe.length === 0 ? (
                                  <div style={{ fontSize: 12, color: T.sub, textAlign: "center", padding: 8 }}>Nessun vano con misure</div>
                                ) : prevRighe.map((r, ri) => (
                                  <div key={ri} style={{ padding: "8px 0", borderBottom: ri < prevRighe.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.desc || `Vano ${ri + 1}`}</div>
                                        <div style={{ fontSize: 10, color: T.sub }}>
                                          {r.misure} · Qta: {r.qta}{r.colore ? ` · ${r.colore}` : ""}
                                        </div>
                                      </div>
                                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: T.acc }}>€{fmtOrd(r.totale)}</div>
                                        {r.qta > 1 && <div style={{ fontSize: 9, color: T.sub }}>€{fmtOrd(r.prezzoUnit)} cad.</div>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Totali */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                  <span style={{ color: T.sub }}>Imponibile</span>
                                  <span style={{ fontWeight: 700, color: T.text }}>€{fmtOrd(prevTot)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                  <span style={{ color: T.sub }}>IVA 22%</span>
                                  <span style={{ fontWeight: 700, color: T.text }}>€{fmtOrd(Math.round((prevTotIva - prevTot) * 100) / 100)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, borderTop: `1px solid ${T.bdr}`, paddingTop: 6, marginTop: 4 }}>
                                  <span style={{ fontWeight: 700, color: T.text }}>Totale IVA incl.</span>
                                  <span style={{ fontWeight: 900, color: T.acc }}>€{fmtOrd(prevTotIva)}</span>
                                </div>
                              </div>

                              {/* Avviso se vani senza prezzo */}
                              {prevRighe.some(r => r.prezzoUnit === 0) && (
                                <div style={{ background: "#E8A02015", border: "1px solid #E8A02040", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: "#E8A020", fontWeight: 600 }}>
                                  ⚠️ Alcuni vani non hanno prezzo — verranno inclusi come €0,00
                                </div>
                              )}

                              {/* Bottoni */}
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setShowOrdinePreview(false)} style={{ flex: 1, padding: 13, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                                <button onClick={() => {
                                  creaOrdineFornitore(c, c.sistema?.split(" ")[0] || "");
                                  setSelectedCM((prev: any) => ({ ...prev }));
                                  setShowOrdinePreview(false);
                                  setCcDone("✅ Ordine creato!");
                                  setTimeout(() => setCcDone(null), 3000);
                                }} style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                                  <I d={ICO.package} /> CONFERMA E CREA ORDINE
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* ══ PRODUZIONE ══ */}
                  {curCC.id === "produzione" && (
                    <div>
                      {ordCC.length > 0 && (
                        <div style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                          {ordCC.map((o, oi) => (
                            <div key={oi} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                              <span style={{ fontWeight: 600 }}>{typeof o.fornitore === "object" ? (o.fornitore?.nome || "Fornitore") : (o.fornitore || "Fornitore")}</span>
                              <span style={{ color: o.conferma?.ricevuta ? T.grn : T.orange, fontWeight: 700 }}>
                                {o.conferma?.firmata ? "✅ Confermato" : o.conferma?.ricevuta ? "📄 Conferma ricevuta" : "🕐 In attesa"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!ordConfCC ? (
                        <button onClick={() => apriInboxDocumento(c.id, "conferma")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#af52de", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.download} /> CARICA CONFERMA FORNITORE →</button>
                      ) : ccConfirm !== "conferma_ok" ? (
                        <button onClick={() => setCcConfirm("conferma_ok")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ APPROVA E AVVIA PRODUZIONE →</button>
                      ) : (
                        <div style={{ background: "#34c75912", borderRadius: 10, padding: 12, border: "1px solid #34c75930" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#34c759", marginBottom: 4 }}>Confermi avvio produzione?</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                            <button onClick={() => { setOrdiniFornDB(prev => prev.map(o => o.cmId === c.id ? { ...o, conferma: { ...o.conferma, firmata: true } } : o)); setCcConfirm(null); setCcDone("✅ Produzione avviata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CONFERMO</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ══ POSA ══ */}
                  {curCC.id === "posa" && (
                    <div>
                      {!montFormOpen ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.indirizzo || "—"}</div>
                          <button onClick={() => { setMontFormOpen(true); setMontGiorni(1); setMontFormData({ data: "", orario: "08:00", durata: "giornata", squadraId: squadreDB[0]?.id || "", note: "" }); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.wrench} /> PIANIFICA MONTAGGIO →</button>
                        </div>
                      ) : (
                        <div style={{ background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
                          <input type="date" value={montFormData.data} onChange={e => { setMontFormData(p => ({ ...p, data: e.target.value })); setWorkWeekend(null); }} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as any, marginBottom: 6 }} />

                          {/* Mini calendario squadre — 3 settimane + anteprima */}
                          {(() => {
                            const selDate = montFormData.data ? new Date(montFormData.data + 'T12:00:00') : new Date();
                            const todayISO = new Date().toISOString().split('T')[0];
                            const baseDay = new Date(selDate);
                            baseDay.setDate(baseDay.getDate() - (baseDay.getDay() === 0 ? 6 : baseDay.getDay() - 1));
                            baseDay.setDate(baseDay.getDate() - 7);
                            const WEEKS = 3;
                            const allDays = Array.from({ length: WEEKS * 7 }, (_, i) => { const d = new Date(baseDay); d.setDate(d.getDate() + i); return d; });
                            const fmtD = (d) => d.toISOString().split('T')[0];
                            const dayN = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
                            const squads = squadreDB.length > 0 ? squadreDB : [{ id: 'default', nome: 'Squadra', colore: '#007aff' }];
                            const previewDays = new Set();
                            if (montFormData.data && montGiorni > 0) {
                              let added = 0;
                              const pStart = new Date(montFormData.data + 'T12:00:00');
                              for (let i = 0; added < Math.ceil(montGiorni) && i < 30; i++) {
                                const pd = new Date(pStart); pd.setDate(pd.getDate() + i);
                                const dow = pd.getDay();
                                if ((dow === 0 || dow === 6) && workWeekend !== true) continue;
                                previewDays.add(fmtD(pd)); added++;
                              }
                            }
                            const selSquadId = montFormData.squadraId || (squads.length === 1 ? squads[0].id : null);
                            return (
                              <div style={{ marginBottom: 8, borderRadius: 8, border: '1px solid ' + T.bdr, overflow: 'hidden', background: T.card }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px 0' }}>
                                  <span onClick={() => { const p = new Date(baseDay); p.setDate(p.getDate() - 7); setMontFormData(prev => ({ ...prev, data: fmtD(p) })); }} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: T.acc, padding: '4px 8px' }}>{"‹"}</span>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Disponibilità squadre
                                  </span>
                                  <span onClick={() => { const n = new Date(baseDay); n.setDate(n.getDate() + 21); setMontFormData(prev => ({ ...prev, data: fmtD(n) })); }} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: T.acc, padding: '4px 8px' }}>{"›"}</span>
                                </div>
                                {Array.from({ length: WEEKS }, (_, wi) => {
                                  const weekDays = allDays.slice(wi * 7, wi * 7 + 7);
                                  const weekStart = weekDays[0];
                                  return (
                                    <div key={wi} style={{ borderTop: wi > 0 ? '1px solid ' + T.bdr + '50' : 'none', paddingTop: wi > 0 ? 2 : 0 }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', fontSize: 9, padding: '2px 4px 0' }}>
                                        <div style={{ fontSize: 8, fontWeight: 600, color: T.sub + '80', padding: '1px 0' }}>
                                          {weekStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                        </div>
                                        {weekDays.map((d, i) => {
                                          const iso = fmtD(d);
                                          const isSel = iso === montFormData.data;
                                          const isToday = iso === todayISO;
                                          const isPast = iso < todayISO;
                                          return (
                                            <div key={i} onClick={() => !isPast && setMontFormData(p => ({ ...p, data: iso }))} style={{
                                              textAlign: 'center', cursor: isPast ? 'default' : 'pointer', padding: '1px 0', borderRadius: 4,
                                              background: isSel ? T.acc + '25' : isToday ? T.grn + '12' : 'transparent',
                                              border: isSel ? '1.5px solid ' + T.acc : '1.5px solid transparent',
                                              opacity: isPast ? 0.3 : 1,
                                            }}>
                                              {wi === 0 && <div style={{ fontSize: 8, fontWeight: 600, color: isSel ? T.acc : isToday ? T.grn : i >= 5 ? T.sub + '60' : T.sub }}>{dayN[i]}</div>}
                                              <div style={{ fontSize: 10, fontWeight: isSel || isToday ? 800 : 500, color: isSel ? T.acc : isToday ? T.grn : T.text }}>{d.getDate()}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {squads.map((sq, si) => {
                                        const sqC = sq.colore || '#007aff';
                                        return (
                                          <div key={sq.id} style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', fontSize: 7, padding: '0 4px' }}>
                                            <div style={{ fontSize: 8, fontWeight: 700, color: sqC, padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wi === 0 ? sq.nome : ''}</div>
                                            {weekDays.map((d, di) => {
                                              const iso = fmtD(d);
                                              const dayM = (montaggiDB || []).filter(m => m.data === iso && (m.squadraId === sq.id || (!m.squadraId && squads.length === 1)));
                                              const isPreview = previewDays.has(iso) && (selSquadId === sq.id);
                                              const hasWork = dayM.length > 0;
                                              const isConflict = hasWork && isPreview;
                                              return (
                                                <div key={di} onClick={() => { if (fmtD(d) >= todayISO) setMontFormData(p => ({ ...p, data: iso, squadraId: sq.id })); }} style={{
                                                  textAlign: 'center', padding: '1px', cursor: 'pointer', borderRadius: 3, margin: '0 1px', minHeight: 13,
                                                  background: isConflict ? '#ff3b3020' : isPreview ? T.acc + '18' : hasWork ? sqC + '10' : 'transparent',
                                                  border: isPreview ? '1px dashed ' + (isConflict ? '#ff3b30' : T.acc) : '1px solid transparent',
                                                }}>
                                                  {hasWork ? dayM.map((m, mi) => (
                                                    <div key={mi} style={{ fontSize: 7, fontWeight: 700, color: isConflict ? '#ff3b30' : sqC, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                      {(m.cliente || '').split(' ')[0] || 'Occ'}
                                                    </div>
                                                  )) : isPreview ? (
                                                    <div style={{ fontSize: 8, fontWeight: 800, color: T.acc }}>{"●"}</div>
                                                  ) : null}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '3px 8px 5px', fontSize: 8, color: T.sub }}>
                                  {previewDays.size > 0 && <span><span style={{ color: T.acc, fontWeight: 800 }}>{"●"}</span> Nuovo montaggio ({montGiorni}g)</span>}
                                  {previewDays.size > 0 && Array.from(previewDays).some(pd => (montaggiDB || []).some(m => m.data === pd && (m.squadraId === selSquadId))) && <span style={{ color: '#ff3b30', fontWeight: 700 }}>{"⚠"} Sovrapposizione!</span>}
                                  <span style={{ marginLeft: 'auto', cursor: 'pointer', color: T.acc, fontWeight: 700, fontSize: 9 }} onClick={() => setMontFormData(prev => ({ ...prev, data: todayISO }))}>Oggi</span>
                                </div>
                                {/* Banner weekend */}
                                {(() => {
                                  if (!montFormData.data || montGiorni <= 0) return null;
                                  // Controlla se il range (senza weekend) attraversa un sab/dom
                                  const pStart = new Date(montFormData.data + 'T12:00:00');
                                  let hasWeekendInRange = false;
                                  let added = 0;
                                  for (let i = 0; added < Math.ceil(montGiorni) && i < 30; i++) {
                                    const pd = new Date(pStart); pd.setDate(pd.getDate() + i);
                                    const dow = pd.getDay();
                                    if (dow === 0 || dow === 6) { hasWeekendInRange = true; break; }
                                    added++;
                                  }
                                  // Oppure se la data di partenza è sab/dom
                                  const startDow = pStart.getDay();
                                  if (startDow === 6 || startDow === 0) hasWeekendInRange = true;
                                  if (!hasWeekendInRange) { if (workWeekend !== null) setWorkWeekend(null); return null; }
                                  if (workWeekend !== null) return null; // già risposto
                                  return (
                                    <div style={{ margin: '4px 8px 6px', padding: '8px 10px', borderRadius: 8, background: '#FF9F0A18', border: '1px solid #FF9F0A60' }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F0A', marginBottom: 6 }}>🗓 Il periodo include sabato/domenica. Lavori anche nel weekend?</div>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setWorkWeekend(true)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: '#FF9F0A', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✅ Sì, lavoro</button>
                                        <button onClick={() => setWorkWeekend(false)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #FF9F0A60', background: 'transparent', color: '#FF9F0A', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>No, solo feriali</button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })()}
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

                  {/* ══ COLLAUDO ══ */}
                  {curCC.id === "collaudo" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Verifica il montaggio, scatta foto finale e fai firmare il collaudo</div>
                      <button onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, collaudoOk: true, dataCollaudo: new Date().toISOString().split("T")[0] } : cm));
                        setSelectedCM(prev => ({ ...prev, collaudoOk: true, dataCollaudo: new Date().toISOString().split("T")[0] }));
                        setCcDone("✅ Collaudo completato!"); setTimeout(() => setCcDone(null), 3000);
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#5856d6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.search} /> SEGNA COLLAUDO OK →</button>
                    </div>
                  )}

                  {/* ══ CHIUSURA ══ */}
                  {curCC.id === "chiusura" && (() => {
                    const saldoFatCC = fattCC.find(f => f.tipo === "saldo" || f.tipo === "unica");
                    const saldoPagatoCC = saldoFatCC?.pagata;
                    const restoCC = totIvaCC - incassatoCC;
                    return (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>
                        Incassato €{fmtCC(incassatoCC)} su €{fmtCC(totIvaCC)} {restoCC > 0 ? `· Resta €${fmtCC(restoCC)}` : "· ✅ Tutto incassato"}
                      </div>
                      {!saldoFatCC && restoCC > 0 && (
                        ccConfirm !== "saldo" ? (
                          <button onClick={() => setCcConfirm("saldo")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.euro} /> FATTURA SALDO €{fmtCC(restoCC)} →</button>
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
                      {saldoFatCC && !saldoPagatoCC && (
                        ccConfirm !== "pagata" ? (
                          <button onClick={() => setCcConfirm("pagata")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ SEGNA PAGATA €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: "#34c75912", borderRadius: 10, padding: 12, border: "1px solid #34c75930" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#34c759", marginBottom: 4 }}>Conferma pagamento €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => {
                                setFattureDB(prev => prev.map(f => f.cmId === c.id && !f.pagata ? { ...f, pagata: true, dataPagamento: new Date().toISOString().split("T")[0], metodoPagamento: "Bonifico" } : f));
                                setFaseTo(c.id, "chiusura");
                                setCcConfirm(null); setCcDone("✨ Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000);
                              }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✅ CONFERMO INCASSO</button>
                            </div>
                          </div>
                        )
                      )}
                      {!saldoFatCC && restoCC <= 0 && (
                        <button onClick={() => { setFaseTo(c.id, "chiusura"); setCcDone("✨ Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✨ CHIUDI COMMESSA →</button>
                      )}
                    </div>
                    );
                  })()}

                  {/* ══ PULSANTE SALTA ══ */}
                  {curCC && !curCC.done && curCC.id !== "chiusura" && (
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <span onClick={() => {
                        const skipIdx = stepsCC.findIndex(s => s.id === curCC.id);
                        if (skipIdx >= 0 && skipIdx < stepsCC.length - 1) {
                          const skipNote = prompt("Motivo per saltare '" + curCC.l + "':");
                          if (skipNote !== null) {
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, skipLog: [...(cm.skipLog || []), { fase: curCC.id, motivo: skipNote, quando: new Date().toISOString() }] } : cm));
                            const nextStep = stepsCC[skipIdx + 1];
                            if (nextStep) setFaseTo(c.id, nextStep.id);
                            setCcDone(`⏭️ ${curCC.l} saltato`); setTimeout(() => setCcDone(null), 3000);
                          }
                        }
                      }} style={{ fontSize: 10, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>⏭️ Salta questo passaggio</span>
                    </div>
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

        {/* == TAB: vani / visite / info == */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, margin: "0 0 0 0" }}>
          {[
            {k:"sopralluoghi",l:`🪟 Vani (${vaniList.length})`},
            {k:"visite",l:`📐 Visite (${(c.rilievi||[]).length})`},
            {k:"info",l:"ℹ Info"},
          ].map(t => (
            <div key={t.k} onClick={() => setCmSubTab(t.k)} style={{
              flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderBottom: `2px solid ${cmSubTab === t.k ? T.acc : "transparent"}`,
              color: cmSubTab === t.k ? T.acc : T.sub
            }}>{t.l}</div>
          ))}
        </div>

        {/* == TAB VISITE (timeline sopralluoghi) == */}
        {cmSubTab === "visite" && (
          <div style={{ padding: "12px 16px" }}>
            {/* Stato misure globale */}
            <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, textAlign: "center", fontSize: 12, fontWeight: 700,
              background: c.firmaCliente ? "#34c75912" : "#ff950012",
              color: c.firmaCliente ? "#34c759" : "#ff9500",
              border: `1px solid ${c.firmaCliente ? "#34c75930" : "#ff950030"}`,
            }}>
              {c.firmaCliente
                ? "✅ Misure definitive — cliente ha firmato"
                : `⚠ Misure indicative — ${(c.rilievi||[]).length} ${(c.rilievi||[]).length === 1 ? "visita" : "visite"} effettuate`}
            </div>

            {/* Timeline visite */}
            {(c.rilievi||[]).length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px", color: T.sub }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}><I d={ICO.ruler} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Nessuna visita ancora</div>
                <div style={{ fontSize: 12 }}>Crea il primo rilievo dal Centro Comando</div>
              </div>
            ) : [...(c.rilievi||[])].reverse().map((ril, idx) => {
              const isLast = idx === 0;
              const nVani = (ril.vani||[]).length;
              const nMisurati = (ril.vani||[]).filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
              const tipoCol = ril.tipo === "modifica" ? "#ff9500" : isLast ? T.acc : T.blue;
              const isSelected = r?.id === ril.id;
              return (
                <div key={ril.id} onClick={() => { setSelectedRilievo(ril); setCmSubTab("sopralluoghi"); }}
                  style={{ display: "flex", gap: 12, marginBottom: 14, cursor: "pointer", padding: "10px 12px", borderRadius: 12,
                    background: isSelected ? `${tipoCol}10` : T.card,
                    border: `1.5px solid ${isSelected ? tipoCol : T.bdr}`,
                  }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${tipoCol}15`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1.5px solid ${tipoCol}30`, flexShrink: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: tipoCol }}>R{ril.n}</div>
                      <div style={{ fontSize: 12 }}>{ril.tipo === "modifica" ? "🔧" : "📐"}</div>
                    </div>
                    {idx < (c.rilievi||[]).length - 1 && <div style={{ width: 2, flex: 1, background: T.bdr, marginTop: 4, minHeight: 8 }} />}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                        {ril.data ? new Date(ril.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "—"}
                      </span>
                      {ril.ora && <span style={{ fontSize: 11, color: T.sub }}>ore {ril.ora}</span>}
                      {isLast && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: tipoCol, color: "#fff" }}>ATTUALE</span>}
                      {ril.tipo === "modifica" && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#ff9500", color: "#fff" }}>MODIFICA</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>
                      👤 {ril.rilevatore || "—"} · 🪟 {nVani} vani · {nMisurati === nVani && nVani > 0 ? "✅ tutte le misure" : `${nMisurati}/${nVani} misurati`}
                    </div>
                    {ril.motivoModifica && <div style={{ fontSize: 11, color: "#ff9500", marginTop: 2 }}><I d={ICO.wrench} /> {ril.motivoModifica}</div>}
                    {ril.note && <div style={{ fontSize: 11, color: T.sub, marginTop: 2, fontStyle: "italic" }}>"{ril.note}"</div>}
                    {ril._ereditatiCount > 0 && <div style={{ fontSize: 10, color: "#34c759", marginTop: 2 }}><I d={ICO.clipboard} /> {ril._ereditatiCount} vani ereditati da R{ril.n - 1}</div>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14, alignSelf: "center" }}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {/* == TAB VANI (lista vani del rilievo) == */}
        {cmSubTab === "sopralluoghi" && (
          <div style={{ padding: "0 16px 14px" }}>
            {/* Rilievo selector - mostra quale stai guardando */}
            {(c.rilievi||[]).length > 1 && r && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0 10px", borderBottom: `1px solid ${T.bdr}`, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginRight: 4 }}>Visita:</div>
                {(c.rilievi||[]).map((ril, ridx) => {
                  const isSel = ril.id === r.id;
                  const isLast = ridx === (c.rilievi||[]).length - 1;
                  const col = isSel ? (isLast ? T.acc : "#5856d6") : T.sub;
                  return (
                    <div key={ril.id} onClick={() => setSelectedRilievo(ril)}
                      style={{ padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                        background: isSel ? col : T.bg,
                        color: isSel ? "#fff" : T.sub,
                        border: `1.5px solid ${isSel ? col : "transparent"}`,
                      }}>
                      R{ril.n} {!isLast && isSel ? "🔒" : ""}
                    </div>
                  );
                })}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 10, color: isStorico ? "#5856d6" : T.sub, fontWeight: isStorico ? 700 : 400 }}>
                  {isStorico ? "🔒 sola lettura" : `${(r.vani||[]).length} vani`}
                </div>
              </div>
            )}
            {/* ═══ BANNER STORICO ═══ */}
            {isStorico && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 10, background: "#5856d610", border: "1.5px solid #5856d630", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}><I d={ICO.lock} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#5856d6" }}>Rilievo storico R{r?.n} — sola lettura</div>
                  <div style={{ fontSize: 10, color: T.sub }}>Questo rilievo è archiviato. Solo l'ultimo rilievo (R{lastRilievo?.n}) è modificabile.</div>
                </div>
                <div onClick={() => { if (lastRilievo) setSelectedRilievo(lastRilievo); }} style={{ padding: "6px 12px", borderRadius: 8, background: T.acc, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Vai a R{lastRilievo?.n} →
                </div>
              </div>
            )}
            {vaniList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}><I d={ICO.grid} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Nessun vano in questo rilievo</div>
                {isStorico ? (
                  <div style={{ fontSize: 12, color: T.sub }}>Nessun vano era presente in questa visita</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 18, lineHeight: 1.5 }}>Aggiungi il primo vano: finestra, porta, fisso...<br/>Poi inserirai le misure e le foto</div>
                    <button onClick={() => {
                  if (!selectedCM || !selectedRilievo) return;
                  const v = { id: Date.now(), nome: `Vano 1`, tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
                  const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                  setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                  setSelectedRilievo(updR);
                  setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }));
                  setSelectedVano(v);
                  setVanoStep(0);
                }} style={{ ...S.btn, margin: "0 auto", padding: "14px 32px", fontSize: 15 }}>+ Aggiungi primo vano</button>
                  </>
                )}
              </div>
            ) : vaniList.map(v => {
              const nMisure = Object.values(v.misure||{}).filter(x=>(x as number)>0).length;
              const completo = nMisure >= 6;
              const bloccato = v.note?.startsWith("⚠ BLOCCATO");
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
                        if (rIdx == null || rIdx < 0) return null;
                        const ril = c.rilievi[rIdx];
                        const questoBloccato = v.note?.startsWith("⚠ BLOCCATO");
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
                            {haProblema && " <I d={ICO.alertTriangle} />"}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>{v.tipo} · {v.stanza} · {v.piano}</div>
                    {bloccato && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>{v.note?.replace("⚠ BLOCCATO: ","")}</div>}
                  </div>
                  <div style={{ textAlign: "right", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    {/* Badge pezzi */}
                    <span style={{ fontSize:12, fontWeight:800, color:"#fff",
                      background: bloccato ? T.red : completo ? T.grn : T.orange,
                      borderRadius:8, padding:"2px 8px", minWidth:28, textAlign:"center" }}>
                      {v.pezzi||1} pz
                    </span>
                    {bloccato
                      ? <span style={S.badge(T.redLt, T.red)}><I d={ICO.alertTriangle} /> Bloccato</span>
                      : completo
                      ? <span style={S.badge(T.grnLt, T.grn)}>✅ {nMisure} mis.</span>
                      : <span style={S.badge(T.orangeLt, T.orange)}><I d={ICO.alertTriangle} /> {nMisure} mis.</span>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14 }}>›</span>
                </div>
              );
            })}
            {vaniList.length > 0 && !isStorico && (
              <div onClick={() => {
                if (!selectedCM || !selectedRilievo) return;
                const v = { id: Date.now(), nome: `Vano ${(selectedRilievo.vani?.length||0)+1}`, tipo: "F1A", stanza: "Soggiorno", piano: "PT", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
                const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                setSelectedRilievo(updR);
                setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }));
                setSelectedVano(v);
                setVanoStep(0);
              }}
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
                      {mis ? "✅" : blk ? "⚠" : "🕐"}
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
            <I d={ICO.alertTriangle} /> Segnala problema
            {problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto").length > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: "50%", background: "#FF3B30", color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto").length}</span>}
          </button>
          {problemi.filter(p => p.commessaId === c.id).length > 0 && (
            <button onClick={() => { setShowProblemiView(true); }} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.text, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", gap: 6 }}>
              <I d={ICO.clipboard} /> {problemi.filter(p => p.commessaId === c.id).length}
            </button>
          )}
        </div>

        {/* Allegati / Note / Vocali / Video */}
        <div style={{ padding: "0 16px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { ico: <I d={ICO.paperclip} />, label: "File", act: () => fileInputRef.current?.click() },
              { ico: <I d={ICO.camera} />, label: "Foto", act: () => fotoInputRef.current?.click() },
              { ico: <I d={ICO.fileText} />, label: "Nota", act: () => { setShowAllegatiModal("nota"); setAllegatiText(""); }},
              { ico: <I d={ICO.mic} />, label: "Vocale", act: () => { setShowAllegatiModal("vocale"); }},
              { ico: <I d={ICO.clapperboard} />, label: "Video", act: () => { setShowAllegatiModal("video"); }},
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
                    <span style={{ fontSize: 16 }}>{a.tipo === "nota" ? "📄" : a.tipo === "vocale" ? "🎤" : a.tipo === "video" ? "🎬" : a.tipo === "foto" ? "📷" : "📎"}</span>
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
                    {a.tipo === "file" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer", textDecoration: "none" }}><I d={ICO.folder} /> Apri</a>}
                    {a.tipo === "firma" && a.dataUrl && <span onClick={() => { const w = window.open(""); w?.document.write(`<iframe src="${a.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`); }} style={{ padding: "3px 8px", borderRadius: 6, background: "#34c75912", fontSize: 10, fontWeight: 600, color: "#34c759", cursor: "pointer" }}>👁 Apri</span>}
                    {a.tipo === "firma" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.bg, fontSize: 10, fontWeight: 600, color: T.sub, cursor: "pointer", textDecoration: "none" }}>⬇</a>}
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

        {/* ══ SEZIONE INTERVENTI ══ */}
        {montaggiDB.filter(m => String(m.cmId) === String(c.id)).length > 0 && (
          <>
            <div style={{ ...S.section, marginTop: 8 }}>
              <div style={S.sectionTitle}><I d={ICO.wrench} /> Interventi ({montaggiDB.filter(m => String(m.cmId) === String(c.id)).length})</div>
            </div>
            <div style={{ padding: "0 16px" }}>
              <InterventoTab
                montaggiDB={montaggiDB}
                cmId={c.id}
                squadreDB={squadreDB}
                T={T}
                onOpenIntervento={(m) => setInterventoOpen(m)}
              />
            </div>
          </>
        )}

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

        {/* Elimina */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {c.fase === "chiusura" && <div style={{ fontSize: 12, fontWeight: 700, color: T.grn }}>✅ Commessa chiusa</div>}
          <span onClick={() => deleteCommessa(c.id)} style={{ fontSize: 11, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>Elimina commessa</span>
        </div>

        {/* ══ INTERVENTO FLOW PANEL (fixed overlay) ══ */}
        {interventoOpen && (
          <InterventoFlowPanel
            montaggio={interventoOpen}
            onClose={() => setInterventoOpen(null)}
            onUpdate={(updated) => {
              setMontaggiDB(prev => prev.map(m => m.id === updated.id ? updated : m));
              setInterventoOpen(updated);
            }}
          />
        )}

        {/* ══ MODAL FASCICOLO GEOMETRA ══ */}
        {showFascicoloModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 580, maxHeight: "88vh", overflowY: "auto", padding: "20px 16px 32px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #2D7A6B, #1A9E73)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 10 }}>📐</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Fascicolo Geometra</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{(getVaniAttivi(c) || []).length} vani · {c.code || c.id}</div>
                </div>
                <div onClick={() => setShowFascicoloModal(false)} style={{ fontSize: 20, color: T.sub, cursor: "pointer", padding: "0 4px" }}>✕</div>
              </div>

              {/* Stato generazione */}
              {fascicoloStep === "generato" && fascicoloLink && (
                <div style={{ background: "#E8F5E9", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1px solid #A5D6A7" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D32", marginBottom: 6 }}>✅ Fascicolo generato!</div>
                  <div style={{ fontSize: 11, color: "#388E3C", wordBreak: "break-all" as const, marginBottom: 8 }}>{fascicoloLink}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => {
                      navigator.clipboard.writeText(fascicoloLink);
                      setFascicoloLinkCopied(true);
                      setTimeout(() => setFascicoloLinkCopied(false), 2000);
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#2E7D32", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      {fascicoloLinkCopied ? "✓ Copiato!" : "📋 Copia link"}
                    </button>
                    <button onClick={() => {
                      const text = encodeURIComponent(`Gentile cliente, ecco il fascicolo tecnico della sua commessa: ${fascicoloLink}`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#25d366", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      📱 WhatsApp
                    </button>
                    {c.email && (
                      <button onClick={() => {
                        const sub = encodeURIComponent(`Fascicolo Tecnico – ${c.code || "Commessa"}`);
                        const body = encodeURIComponent(`Gentile ${[c.cliente, c.cognome].filter(Boolean).join(" ") || "cliente"},\n\nLe invio il fascicolo tecnico della sua commessa:\n${fascicoloLink}\n\nIl link è valido per 30 giorni.\n\nCordiali saluti,\n${aziendaInfo?.ragione || ""}`);
                        window.open(`mailto:${c.email}?subject=${sub}&body=${body}`, "_blank");
                      }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.blue, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        ✉ Email
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Azioni principali */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 16 }}>

                {/* Genera link condivisibile */}
                <button
                  onClick={async () => {
                    setFascicoloLoading(true);
                    try {
                      const vani = getVaniAttivi(c) || [];
                      const snap = buildSnapshot(c, vani, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                      const result = await creaFascicolo(snap, c.id, aziendaInfo?.id || "");
                      if (result) {
                        setFascicoloLink(result.url);
                        setFascicoloStep("generato");
                        // Ricarica storico
                        const storico = await getFascicoliCommessa(c.id);
                        setFascicoliStorico(storico);
                      }
                    } finally {
                      setFascicoloLoading(false);
                    }
                  }}
                  disabled={fascicoloLoading}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2D7A6B, #1A9E73)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: fascicoloLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: fascicoloLoading ? 0.7 : 1 }}
                >
                  {fascicoloLoading ? "⏳ Generazione..." : "🔗 Genera link condivisibile (30gg)"}
                </button>

                {/* Scarica PDF */}
                <button
                  onClick={() => {
                    const vani = getVaniAttivi(c) || [];
                    const snap = buildSnapshot(c, vani, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                    generaFascicoloGeometraPDF(snap);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: `1.5px solid ${T.teal}`, background: `${T.teal}10`, color: T.teal, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  📄 Scarica PDF Fascicolo
                </button>

                {/* Scarica Excel ENEA */}
                <button
                  onClick={() => {
                    const vani = getVaniAttivi(c) || [];
                    const snap = buildSnapshot(c, vani, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                    generaExcelFascicolo(snap);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: `1.5px solid ${T.grn}`, background: `${T.grn}10`, color: T.grn, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  📊 Scarica Excel ENEA/AdE
                </button>
              </div>

              {/* Storico link generati */}
              {fascicoliStorico.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link precedenti</div>
                  {fascicoliStorico.map((fs) => {
                    const scaduto = new Date(fs.expires_at) < new Date();
                    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                    const link = `${baseUrl}/fascicolo/${fs.token}`;
                    return (
                      <div key={fs.token} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: T.card, borderRadius: 10, marginBottom: 6, border: `1px solid ${T.bdr}`, opacity: scaduto ? 0.5 : 1 }}>
                        <span style={{ fontSize: 12 }}>{scaduto ? "🔒" : "🔗"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{new Date(fs.created_at).toLocaleDateString("it-IT")} · {fs.view_count || 0} visualizzazioni</div>
                          <div style={{ fontSize: 10, color: scaduto ? T.red : T.green }}>{scaduto ? "Scaduto" : `Valido fino al ${new Date(fs.expires_at).toLocaleDateString("it-IT")}`}</div>
                        </div>
                        {!scaduto && (
                          <>
                            <button onClick={() => { navigator.clipboard.writeText(link); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.bg, fontSize: 10, cursor: "pointer", color: T.text }}>Copia</button>
                            <button onClick={async () => { await revocaFascicolo(fs.token); const s = await getFascicoliCommessa(c.id); setFascicoliStorico(s); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.red}30`, background: `${T.red}10`, fontSize: 10, cursor: "pointer", color: T.red }}>Revoca</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );

}
