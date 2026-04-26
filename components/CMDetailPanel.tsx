"use client";
// @ts-nocheck
// 
// MASTRO ERP · CMDetailPanel
// Estratto S6: ~938 righe (Dettaglio commessa)
// 
import React, { useState } from "react";
import PassaggiSaltati from "./PassaggiSaltati";
import VanoCardPreventivo from "./VanoCardPreventivo";
import BulkEditBar from "./BulkEditBar";
import { saveCantiereSync, getAziendaId as getAziendaIdDB } from "../lib/supabase-sync";
import ModalFirma from "./ModalFirma";
import { useMastro } from "./MastroContext";
import { FF, ICO, Ico, I, MOTIVI_BLOCCO, TIPOLOGIE_RAPIDE , IcoKey } from "./mastro-constants";
import { buildSnapshot, creaFascicolo, getFascicoliCommessa, revocaFascicolo } from "../lib/fascicolo-service";
import { generaFascicoloGeometraPDF } from "../lib/pdf-fascicolo";
import { generaExcelFascicolo } from "../lib/excel-fascicolo";
import InterventoTab from "./InterventoTab";
import InterventoFlowPanel from "./InterventoFlowPanel";
import PreventivoConfiguratoreTab from "./PreventivoConfiguratoreTab";
import GuidaIvaDetrazioni from "./GuidaIvaDetrazioni";
import TabFiscale from "./TabFiscale";
import DisegnoTecnico from "./DisegnoTecnico";
// @cadDraw state added below

// ═══ v58 · Cronologia app-nell-app ═══
function CronologiaBlock({ log, EV_COLORS, detectType, initials, commessa, T, S, operatoriDB }: any) {
  const [expanded, setExpanded] = React.useState<number | null>(null);

  // Helper per trovare contatti operatore se log contiene ref
  const findOp = (nome: string): any => {
    if (!operatoriDB || !Array.isArray(operatoriDB)) return null;
    const n = (nome || "").toLowerCase().trim();
    return operatoriDB.find((o: any) => {
      const full = ((o?.nome || "") + " " + (o?.cognome || "")).toLowerCase().trim();
      return full === n || (o?.nome || "").toLowerCase() === n;
    });
  };

  const telLink = (t: string | null | undefined) => t ? `tel:${t}` : "#";
  const waLink = (t: string | null | undefined, msg: string = "") => t ? `https://wa.me/${t.replace(/\D/g, "")}${msg ? "?text=" + encodeURIComponent(msg) : ""}` : "#";

  return (
    <>
      <div style={{ ...S.section, marginTop: 8 }}>
        <div style={S.sectionTitle}>Cronologia · {log.length}</div>
      </div>
      <div style={{ padding: "0 16px 8px", display: "flex", flexDirection: "column" as const, gap: 6, position: "relative" as any }}>
        {/* Linea timeline verticale */}
        <div style={{
          position: "absolute" as any,
          left: 36, top: 20, bottom: 20,
          width: 2,
          background: "linear-gradient(180deg, rgba(127,119,221,0.25), rgba(29,158,117,0.25), rgba(239,159,39,0.25), rgba(55,138,221,0.25), rgba(212,83,126,0.25))",
          borderRadius: 1,
          pointerEvents: "none" as any,
          zIndex: 0,
        }} />

        {log.map((l: any, i: number) => {
          const tipo = detectType(l.cosa);
          const ev = EV_COLORS[tipo] || EV_COLORS.creazione;
          const isOpen = expanded === i;
          const op = findOp(l.chi);
          const tel = op?.telefono || op?.phone;
          const mail = op?.email;

          return (
            <div key={i} style={{
              display: "flex", gap: 10,
              position: "relative" as any,
              zIndex: 1,
            }}>
              {/* Bubble icona tipo */}
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: ev.grad,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 16, fontWeight: 900,
                flexShrink: 0,
                boxShadow: `0 3px 8px ${ev.tint}, inset 0 1px 1px rgba(255,255,255,0.25)`,
                textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                marginTop: 2,
              }}>{ev.icon}</div>

              {/* Card contenuto */}
              <div
                onClick={() => setExpanded(isOpen ? null : i)}
                style={{
                  flex: 1, minWidth: 0,
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid rgba(200,228,228,0.5)",
                  borderLeft: `3px solid ${ev.solid}`,
                  padding: "9px 11px",
                  cursor: "pointer",
                  boxShadow: isOpen ? `0 6px 16px ${ev.tint}` : "0 2px 6px rgba(13,31,31,0.04)",
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {/* Avatar iniziali chi */}
                  <div style={{
                    width: 24, height: 24, borderRadius: 8,
                    background: ev.tint, color: ev.dark,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 900, flexShrink: 0,
                    letterSpacing: "-0.1px",
                  }}>{initials(l.chi)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "#0F2525", lineHeight: 1.3, fontWeight: 700 }}>
                      <strong style={{ color: ev.dark, fontWeight: 900 }}>{l.chi}</strong>{" "}
                      <span style={{ fontWeight: 600, color: "#5A7878" }}>{l.cosa}</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#8FA8A8", fontWeight: 600, marginTop: 2, letterSpacing: "0.2px" }}>{l.quando}</div>
                  </div>
                  <span style={{
                    color: ev.solid, fontSize: 13, fontWeight: 900,
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                    flexShrink: 0,
                  }}>▾</span>
                </div>

                {isOpen && (
                  <div style={{
                    marginTop: 9, paddingTop: 9,
                    borderTop: "1px dashed rgba(200,228,228,0.6)",
                  }}>
                    <div style={{
                      padding: "6px 10px", marginBottom: 8,
                      background: ev.tint, color: ev.dark,
                      borderRadius: 7,
                      fontSize: 10, fontWeight: 800,
                      letterSpacing: "0.4px",
                      textTransform: "uppercase" as any,
                      display: "inline-block",
                    }}>{ev.icon} {tipo}</div>

                    {op && (
                      <div style={{ fontSize: 11, color: "#5A7878", fontWeight: 600, marginBottom: 8 }}>
                        Operatore: <strong style={{ color: "#0F2525" }}>{op.nome} {op.cognome || ""}</strong>
                        {op.ruolo && <span style={{ opacity: 0.7 }}> · {op.ruolo}</span>}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 6 }}>
                      {tel && (
                        <a href={telLink(tel)} onClick={(e: any) => e.stopPropagation()} style={{
                          flex: 1, padding: "7px", borderRadius: 8, textDecoration: "none",
                          background: "rgba(29,158,117,0.1)", color: "#04342C",
                          fontSize: 10, fontWeight: 900, textAlign: "center" as any,
                          letterSpacing: "0.3px",
                          border: "1px solid rgba(29,158,117,0.3)",
                        }}>☎ CHIAMA</a>
                      )}
                      {tel && (
                        <a href={waLink(tel, `Ciao ${l.chi}, ti scrivo per la commessa ${commessa?.code || ""}`)} target="_blank" rel="noopener noreferrer" onClick={(e: any) => e.stopPropagation()} style={{
                          flex: 1, padding: "7px", borderRadius: 8, textDecoration: "none",
                          background: "rgba(37,211,102,0.12)", color: "#075E54",
                          fontSize: 10, fontWeight: 900, textAlign: "center" as any,
                          letterSpacing: "0.3px",
                          border: "1px solid rgba(37,211,102,0.3)",
                        }}>💬 CHAT</a>
                      )}
                      {mail && (
                        <a href={`mailto:${mail}?subject=Commessa ${commessa?.code || ""}`} onClick={(e: any) => e.stopPropagation()} style={{
                          flex: 1, padding: "7px", borderRadius: 8, textDecoration: "none",
                          background: "rgba(55,138,221,0.1)", color: "#042C53",
                          fontSize: 10, fontWeight: 900, textAlign: "center" as any,
                          letterSpacing: "0.3px",
                          border: "1px solid rgba(55,138,221,0.3)",
                        }}>✉ EMAIL</a>
                      )}
                      {!tel && !mail && (
                        <div style={{
                          flex: 1, padding: "7px", borderRadius: 8,
                          background: "rgba(200,228,228,0.25)", color: "#8FA8A8",
                          fontSize: 10, fontWeight: 700, textAlign: "center" as any,
                          letterSpacing: "0.3px",
                          fontStyle: "italic" as any,
                        }}>Nessun contatto disponibile</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

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

  // AUTO_PICK: se ci sono rilievi, seleziona l'ultimo. NON crea pi+ bozze automatiche.
  const [autoPickDoneForCm, setAutoPickDoneForCm] = React.useState<number | null>(null);
  const [cronOpenV70, setCronOpenV70] = React.useState<boolean>(false);
  const [centroApertoV70, setCentroApertoV70] = React.useState<string | null>(null);
  const [diarioFormOpenV74, setDiarioFormOpenV74] = React.useState<boolean>(false);
  const [diarioChiV74, setDiarioChiV74] = React.useState<"IO" | "CLIENTE">("IO");
  const [diarioTagV74, setDiarioTagV74] = React.useState<string>("NOTA");
  const [diarioTestoV74, setDiarioTestoV74] = React.useState<string>(""); // 'cliente' | 'allegati' | 'note' | 'azioni' | null
  const [azioniOpenV66, setAzioniOpenV66] = React.useState<boolean>(false);
  const [cronOpenV67, setCronOpenV67] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (!selectedCM) { setAutoPickDoneForCm(null); return; }
    if (selectedRilievo) return;
    if (autoPickDoneForCm === selectedCM.id) return;
    const rilievi = selectedCM.rilievi || [];
    if (rilievi.length > 0) {
      setSelectedRilievo(rilievi[rilievi.length - 1]);
      setAutoPickDoneForCm(selectedCM.id);
      return;
    }
    // 0 rilievi: NON creare bozza. L'utente deve cliccare "Crea rilievo" in Centro Comando.
    setAutoPickDoneForCm(selectedCM.id);
  }, [selectedCM?.id, selectedRilievo, autoPickDoneForCm]);

  // -- AUTO-SYNC SUPABASE (top-level, fuori da qualsiasi condizione) --
  const _isUuidCM = (v: any): boolean => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
  const _syncTimerRef = React.useRef<any>(null);
  const _syncedKeyRef = React.useRef<string>('');

  React.useEffect(() => {
    const cm = selectedCM;
    console.log("[autosync] effect fired. cm?", !!cm, "code?", cm?.code, "id type:", typeof cm?.id);
    if (!cm || !cm.code) return;
    const key = JSON.stringify({ id: cm.id, fase: cm.fase, tot: cm.totalePreventivo, sc: cm.scontoPerc, detr: cm.detrazione, iva: cm.ivaPerc, sent: cm.preventivoInviato });
    if (key === _syncedKeyRef.current) return;
    _syncedKeyRef.current = key;

    if (_syncTimerRef.current) clearTimeout(_syncTimerRef.current);
    _syncTimerRef.current = setTimeout(async () => {
      try {
        const azId = await getAziendaIdDB();
        if (!azId) return;
        const saved = await saveCantiereSync(azId, cm);
        if (saved && saved.id && !_isUuidCM(cm.id)) {
          const newId = saved.id;
          setCantieri((cs: any[]) => cs.map((c: any) => c.id === cm.id ? { ...c, id: newId } : c));
          setSelectedCM((prev: any) => prev && prev.id === cm.id ? { ...prev, id: newId } : prev);
          console.log('[autosync] ID:', cm.id, '->', newId);
        }
      } catch (err) { console.warn('[autosync] fail:', err); }
    }, 800);
    return () => { if (_syncTimerRef.current) clearTimeout(_syncTimerRef.current); };
  }, [selectedCM?.id, selectedCM?.fase, selectedCM?.totalePreventivo, selectedCM?.scontoPerc, selectedCM?.detrazione, selectedCM?.ivaPerc, selectedCM?.preventivoInviato]);



  // STATES (tutti prima del null guard — React Rules of Hooks)
    const [fabSecOpen, setFabSecOpen] = React.useState(false);
    const [selectedVaniBulk, setSelectedVaniBulk] = React.useState<number[]>([]);
    const [quickEditCliente, setQuickEditCliente] = React.useState<null | "telefono" | "email">(null);
    const [quickEditValue, setQuickEditValue] = React.useState("");
    const [firmaLinkCopiato, setFirmaLinkCopiato] = React.useState(false);
    const [firmaToken, setFirmaToken] = React.useState<string | null>(null);
    // v77 · stati tab fiscale guidato
    const [fiscDestV77, setFiscDestV77] = React.useState<"prima" | "seconda" | null>(null);
    const [fiscZonaV77, setFiscZonaV77] = React.useState<"AB" | "C" | "D" | "E" | "F">("C");
    const [fiscCopied, setFiscCopied] = React.useState<string | null>(null);
    const [rispostaCliente, setRispostaCliente] = React.useState<any>(null);
    const [showSendModal, setShowSendModal] = React.useState<null | { link: string; nome: string; tel: string; email: string; code: string }>(null);
    const [pdfBusy, setPdfBusy] = React.useState<null | "pdf" | "anteprima" | "invia">(null);
    React.useEffect(() => {
      const id = "mastro-pdf-spin-keyframes";
      if (typeof document !== "undefined" && !document.getElementById(id)) {
        const s = document.createElement("style");
        s.id = id;
        s.textContent = "@keyframes mastrospin { to { transform: rotate(360deg); } }";
        document.head.appendChild(s);
      }
    }, []);
    React.useEffect(() => {
      if (!selectedCM?.preventivoInviato || !selectedCM?.id) { setRispostaCliente(null); return; }
      let alive = true;
      const fetchRisposta = () => {
        fetch("/api/preventivo-link?cm_id=" + encodeURIComponent(selectedCM.id))
          .then(r => r.json())
          .then(d => { if (alive && d?.found) setRispostaCliente(d); })
          .catch(() => {});
      };
      fetchRisposta();
      const iv = setInterval(fetchRisposta, 15000);
      return () => { alive = false; clearInterval(iv); };
    }, [selectedCM?.id, selectedCM?.preventivoInviato]);
    const [workWeekend, setWorkWeekend] = useState<boolean | null>(null);
    const [showAccontoModal, setShowAccontoModal] = useState(false);
    const [showModalFirma, setShowModalFirma] = useState(false);
    const [accontoImporto, setAccontoImporto] = useState<string>("");
    const [showOrdinePreview, setShowOrdinePreview] = useState(false);
  const [noteOrdine, setNoteOrdine] = useState("");
    const [showCadDraw, setShowCadDraw] = useState(false);
    const [interventoOpen, setInterventoOpen] = useState(null);
    const [showFascicoloModal, setShowFascicoloModal] = useState(false);
    const [fascicoloLoading, setFascicoloLoading] = useState(false);
    const [fascicoloLink, setFascicoloLink] = useState<string | null>(null);
    const [fascicoloLinkCopied, setFascicoloLinkCopied] = useState(false);
    const [fascicoloStep, setFascicoloStep] = useState<"idle"|"generato">("idle");
    const [fascicoliStorico, setFascicoliStorico] = useState<any[]>([]);
    // Modal "Crea nuovo rilievo" dentro Centro Comando
    const [showNuovoRilievoModal, setShowNuovoRilievoModal] = useState(false);
    const [nuovoRilievoComplesso, setNuovoRilievoComplesso] = useState(false);
    const [showAggiungiVanoModal, setShowAggiungiVanoModal] = useState(false);
    const [nvL1, setNvL1] = useState("");
    const [nvL2, setNvL2] = useState("");
    const [nvL3, setNvL3] = useState("");
    const [nvStanza, setNvStanza] = useState("");
    const [nvCustom, setNvCustom] = useState<Array<{label:string,value:string}>>([]);
    const [nuovoRilievoTipo, setNuovoRilievoTipo] = useState<"provvisorio"|"verificato"|"definitivo"|"da_rivedere"|"personalizzato">("provvisorio");
    const [nuovoRilievoRilevatore, setNuovoRilievoRilevatore] = useState("");
    const [nuovoRilievoNote, setNuovoRilievoNote] = useState("");

  // NULL GUARD: tutti gli hook devono essere dichiarati prima di questo return
  if (!selectedCM) return null;

  // =====================================================
  // v70 · EARLY RETURN · Pannello mockup v8 completo
  // Bypassa il render normale e mostra il nuovo pannello guidato.
  // Per tornare al vecchio layout: rimuovi questo blocco o aggiungi un flag.
  // =====================================================
  if (selectedCM && !(typeof showCadDraw !== "undefined" && showCadDraw) && !prevWorkspace) {
    const cV70 = selectedCM as any;

    // ═══ Banner "Cliente ha accettato — Manda conferma" ═══
    const _accettatoBanner = (rispostaCliente?.risposta === "accettato" && faseIndex(cV70.fase) < faseIndex("conferma")) ? (
      <div style={{
        position: "sticky" as any,
        top: 0,
        zIndex: 50,
        background: "linear-gradient(135deg, #28A268 0%, #1F8050 100%)",
        color: "#fff",
        padding: "14px 16px",
        boxShadow: "0 4px 14px rgba(40,162,104,0.35)",
        animation: "mastropulse 1.6s infinite",
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }} onClick={() => { setFaseTo(cV70.id, "conferma"); }}>
        <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>✓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 0.3 }}>CLIENTE HA ACCETTATO IL PREVENTIVO</div>
          <div style={{ fontSize: 11, opacity: 0.92, marginTop: 2 }}>{rispostaCliente?.risposta_at ? new Date(rispostaCliente.risposta_at).toLocaleString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""} · Tocca qui per creare la conferma d’ordine</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, flexShrink: 0 }}>→</div>
      </div>
    ) : null;

    const rListV70: any[] = cV70.rilievi || [];
    const rCurV70: any = selectedRilievo || (rListV70.length > 0 ? rListV70[rListV70.length - 1] : null);
    const vaniV70: any[] = rCurV70?.vani || [];
    const vaniCompletiV70 = vaniV70.filter((v: any) => Object.values(v.misure || {}).filter((x: any) => (x as number) > 0).length >= 6).length;
    const fotoCountV70 = vaniV70.reduce((a: number, v: any) => a + Object.keys(v.foto || {}).length, 0);
    const fotoGlobalV70 = (cV70.allegati || []).filter((a: any) => a.tipo === "foto").length;
    const audioGlobalV70 = (cV70.allegati || []).filter((a: any) => a.tipo === "vocale").length;
    const noteGlobalV70 = (cV70.allegati || []).filter((a: any) => a.tipo === "nota").length;
    const fileGlobalV70 = (cV70.allegati || []).filter((a: any) => a.tipo === "file").length;
    const allegatiTotV70 = fotoGlobalV70 + audioGlobalV70 + noteGlobalV70 + fileGlobalV70;
    // v73 · rilievo completo ==> mostro pagina preventivo verde
    const rilievoCompletoV73 = vaniV70.length > 0 && vaniCompletiV70 === vaniV70.length;
    const stimaLavoroV73 = (() => {
      try {
        if (typeof calcolaVanoPrezzo !== "function") return 0;
        return vaniV70.reduce((s: number, v: any) => s + (calcolaVanoPrezzo(v, cV70) || 0), 0);
      } catch (e) { return 0; }
    })();
    const fmtEurV73 = (n: number) => n >= 1000 ? `~€${(n/1000).toFixed(1).replace(".", ",")}k` : `~€${Math.round(n)}`;

    // Tipo edificio
    const tEdifV70 = cV70.tipoEdificio || cV70.tipo_edificio || "";
    const tEdifLabelV70 = (() => {
      switch (tEdifV70) {
        case "palazzo": return "Palazzo residenziale";
        case "condominio": return "Condominio";
        case "scuola": return "Scuola";
        case "ospedale": return "Ospedale / Clinica";
        case "ufficio": return "Ufficio / Direzionale";
        case "hotel": return "Hotel / RSA";
        case "centro_comm": return "Centro commerciale";
        case "industriale": return "Capannone / Industriale";
        case "personalizzato": return "Personalizzato";
        default: return "Casa singola";
      }
    })();
    const tEdifStructV70 = (() => {
      switch (tEdifV70) {
        case "palazzo": return "Scala · Piano · Interno";
        case "condominio": return "Piano · Interno";
        case "scuola": return "Edificio/Plesso · Piano · Aula";
        case "ospedale": return "Padiglione · Piano · Reparto";
        case "ufficio": return "Edificio · Piano · Ufficio";
        case "hotel": return "Edificio · Piano · Camera";
        case "centro_comm": return "Livello · Negozio";
        case "industriale": return "Corpo · Settore";
        case "personalizzato": return [cV70.livello1Label || "Livello 1", cV70.livello2Label || "Livello 2", cV70.livello3Label || "Livello 3"].join(" · ");
        default: return "Zona · Piano · Locale";
      }
    })();

    // Titolo dinamico
    const titoloV70 = rListV70.length === 0
      ? "Crea il primo\nsopralluogo"
      : vaniV70.length === 0
        ? "Aggiungi\nil primo vano"
        : vaniCompletiV70 < vaniV70.length
          ? "Completa\nle misure"
          : "Rilievo\ncompleto";
    const descV70 = rListV70.length === 0
      ? "Vai in cantiere e fai il rilievo delle misure."
      : vaniV70.length === 0
        ? "Compila 8 misure per ogni vano. Inizia dal primo."
        : vaniCompletiV70 < vaniV70.length
          ? `${vaniCompletiV70}/${vaniV70.length} vani completi · continua`
          : "Passa al preventivo!";
    const btnV70 = rListV70.length === 0
      ? "CREA RILIEVO"
      : vaniV70.length === 0
        ? "AGGIUNGI PRIMO VANO"
        : vaniCompletiV70 < vaniV70.length
          ? "APRI RILIEVO"
          : "VAI AL PREVENTIVO";

    const onClickBtnV70 = () => {
      if (rListV70.length === 0) {
        // Apri modal nuovo rilievo
        if (typeof setNuovoRilievoTipo !== "undefined") {
          try {
            (setNuovoRilievoTipo as any)("provvisorio");
            (setNuovoRilievoRilevatore as any)("");
            (setNuovoRilievoComplesso as any)(false);
            (setNuovoRilievoNote as any)("");
            (setShowNuovoRilievoModal as any)(true);
          } catch (e) { console.warn("v70 modal nuovo rilievo setters mancanti", e); }
        }
        return;
      }
      // C'e' un rilievo: selezionalo
      setSelectedRilievo(rCurV70);
      if (rCurV70.complesso && vaniV70.length === 0) {
        try {
          (setNvL1 as any)(""); (setNvL2 as any)(""); (setNvL3 as any)("");
          (setNvStanza as any)(""); (setNvCustom as any)([]);
          (setShowAggiungiVanoModal as any)(true);
        } catch (e) { console.warn("v70 modal aggiungi vano complesso setters mancanti", e); }
        return;
      }
      if (vaniV70.length > 0) {
        setSelectedVano(vaniV70[0]);
        setVanoStep(0);
        return;
      }
      // Rilievo semplice, 0 vani: crea primo vano e apri
      const nuovoVano = { id: Date.now(), nome: "Vano 1", tipo: "", stanza: "", piano: "", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
      const updR = { ...rCurV70, vani: [...(rCurV70.vani || []), nuovoVano] };
      setCantieri(cs => cs.map(cm => cm.id === cV70.id ? { ...cm, rilievi: cm.rilievi.map((r2: any) => r2.id === rCurV70.id ? updR : r2), aggiornato: "Oggi" } : cm));
      setSelectedCM((prev: any) => ({ ...prev, rilievi: (prev.rilievi || []).map((r2: any) => r2.id === rCurV70.id ? updR : r2) }));
      setSelectedRilievo(updR);
      setSelectedVano(nuovoVano);
      setVanoStep(0);
    };

    // log cronologia
    const logV70: any[] = cV70.log || [];

    return (
      <>
      <div style={{ minHeight: "100vh", background: "#E8F0F0", paddingBottom: 20 }}>
        {_accettatoBanner}
        {/* ============ HEADER TEAL ============ */}
        <div style={{
          background: "linear-gradient(135deg, #2FB2A8 0%, #28A0A0 45%, #1E8080 100%)",
          padding: "22px 18px 26px",
          color: "#fff",
          position: "relative",
          borderRadius: "0 0 26px 26px",
          boxShadow: "0 4px 20px rgba(40,160,160,0.2)",
        }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 65%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
            <div onClick={() => setSelectedCM(null)} style={{
              width: 40, height: 40, borderRadius: 13,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.35), 0 2px 8px rgba(0,0,0,0.1)",
              flexShrink: 0, cursor: "pointer",
            }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, opacity: 0.92, letterSpacing: "1px", textTransform: "uppercase" as any }}>
                {cV70.code || "Commessa"}{rCurV70 ? ` · RILIEVO MISURE R${rCurV70.n || 1}` : ""}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.6px", textShadow: "0 2px 5px rgba(0,0,0,0.18)", marginTop: 2, lineHeight: 1.05 }}>
                {(cV70.cliente || "CLIENTE").toUpperCase()}
              </div>
              <div style={{ fontSize: 11, opacity: 0.88, marginTop: 3, fontWeight: 600, textTransform: "uppercase" as any }}>
                {cV70.indirizzo || ""}
              </div>
            </div>
            <div style={{ textAlign: "right" as any, flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.4px", textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>
                {vaniV70.length > 0 ? Math.round((vaniCompletiV70 / vaniV70.length) * 100) : 0}%
              </div>
              <div style={{ fontSize: 10, opacity: 0.88, fontWeight: 700, marginTop: 2 }}>
                {vaniCompletiV70}/{vaniV70.length} vani
              </div>
            </div>
          </div>
        </div>

        {/* ============ BODY ============ */}
        <div style={{ padding: "16px 16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* MINI STEPPER 8 puntini (dinamico v73) */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 6px" }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: "#5A7878", letterSpacing: "0.4px", textTransform: "uppercase" as any, flexShrink: 0 }}>{rilievoCompletoV73 ? "Passo 2/8" : "Passo 1/8"}</div>
            <div style={{ display: "flex", gap: 3, flex: 1 }}>
              {rilievoCompletoV73 ? (
                <>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #3ABDBD, #28A0A0)", boxShadow: "0 0 4px rgba(40,160,160,0.4)" }} />
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #5DCAA5, #1D9E75)", boxShadow: "0 0 6px rgba(29,158,117,0.5)" }} />
                  {[1,2,3,4,5,6].map(i => (<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.5)" }} />))}
                </>
              ) : (
                <>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #AFA9EC, #7F77DD)", boxShadow: "0 0 6px rgba(127,119,221,0.5)" }} />
                  {[1,2,3,4,5,6,7].map(i => (<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.5)" }} />))}
                </>
              )}
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: rilievoCompletoV73 ? "#1D9E75" : "#7F77DD", letterSpacing: "0.4px", textTransform: "uppercase" as any, flexShrink: 0 }}>{rilievoCompletoV73 ? "Preventivo" : "Rilievo"}</div>
          </div>

          {/* v73 · BIG ACTION condizionale: VIOLA se rilievo in corso, VERDE se completo */}
          {!rilievoCompletoV73 && (
          <div style={{
            borderRadius: 26, padding: "22px 20px 20px",
            background: "linear-gradient(155deg, #B5B0EE 0%, #7F77DD 55%, #6961CB 100%)",
            color: "#fff",
            boxShadow: "0 18px 40px rgba(0,0,0,0.18), 0 6px 12px rgba(0,0,0,0.1)",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.24), transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -70, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)", pointerEvents: "none" }} />

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
              padding: "5px 12px", background: "rgba(255,255,255,0.22)",
              borderRadius: 50, fontSize: 9, fontWeight: 900, letterSpacing: "1.1px",
              textTransform: "uppercase" as any, position: "relative",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 6.6L22 9.3l-5.8 4.7 1.8 7.5L12 17.8l-6 3.7 1.8-7.5L2 9.3l7.6-.7z"/></svg>
              Prossima mossa
            </div>

            <div style={{
              fontSize: 24, fontWeight: 900, marginTop: 14,
              letterSpacing: "-0.6px", lineHeight: 1.15, whiteSpace: "pre-line" as any,
              textShadow: "0 2px 4px rgba(0,0,0,0.2)", position: "relative",
            }}>{titoloV70}</div>

            <div style={{
              fontSize: 12.5, opacity: 0.94, marginTop: 8,
              lineHeight: 1.4, fontWeight: 500, position: "relative",
            }}>{descV70}</div>

            {/* Pill tipo edificio */}
            <div style={{
              marginTop: 14, background: "rgba(255,255,255,0.18)",
              borderRadius: 14, padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12, position: "relative",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M10 22v-4h4v4"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Immobile</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 1, letterSpacing: "-0.1px" }}>{tEdifLabelV70}</div>
                <div style={{ fontSize: 10.5, opacity: 0.88, marginTop: 2, fontWeight: 600 }}>{tEdifStructV70}</div>
              </div>
            </div>

            {/* Meta tiles */}
            <div style={{
              marginTop: 14, display: "grid",
              gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative",
            }}>
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Vani</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3, letterSpacing: "-0.3px" }}>{vaniCompletiV70}/{vaniV70.length || "—"}</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>{vaniV70.length === 0 ? "da creare" : (vaniCompletiV70 === vaniV70.length ? "tutti OK" : "in corso")}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Misure</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3, letterSpacing: "-0.3px" }}>{vaniCompletiV70 * 8}/{(vaniV70.length * 8) || 8}</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>per vano</div>
              </div>
            </div>

            {/* BIG BTN */}
            <button onClick={onClickBtnV70} style={{
              marginTop: 18, width: "100%", padding: 17,
              background: "#fff", color: "#3C3489",
              border: "none", borderRadius: 18,
              fontSize: 15, fontWeight: 900, letterSpacing: "0.4px",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: "0 6px 18px rgba(0,0,0,0.2), inset 0 -3px 0 rgba(60,52,137,0.08)",
              position: "relative",
            }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {btnV70}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
          )}

          {/* v73 · BIG ACTION VERDE - 2 STRADE quando rilievo completo */}
          {rilievoCompletoV73 && (
          <div style={{
            borderRadius: 26, padding: "22px 20px 20px",
            background: "linear-gradient(155deg, #6BD9B0 0%, #1D9E75 55%, #0F8060 100%)",
            color: "#fff",
            boxShadow: "0 18px 40px rgba(29,158,117,0.35), 0 6px 12px rgba(29,158,117,0.2)",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column",
          }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.24), transparent 65%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -70, left: -40, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)", pointerEvents: "none" }} />

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
              padding: "5px 12px", background: "rgba(255,255,255,0.22)",
              borderRadius: 50, fontSize: 9, fontWeight: 900, letterSpacing: "1.1px",
              textTransform: "uppercase" as any, position: "relative",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Rilievo completo
            </div>

            <div style={{
              fontSize: 24, fontWeight: 900, marginTop: 14,
              letterSpacing: "-0.6px", lineHeight: 1.15, whiteSpace: "pre-line" as any,
              textShadow: "0 2px 4px rgba(0,0,0,0.2)", position: "relative",
            }}>Scegli come{"\n"}vuoi procedere</div>

            <div style={{
              fontSize: 12.5, opacity: 0.94, marginTop: 8,
              lineHeight: 1.4, fontWeight: 500, position: "relative",
            }}>Hai {vaniV70.length} {vaniV70.length === 1 ? "vano" : "vani"} con tutte le misure. Due strade per il preventivo:</div>

            {/* STRADE */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
              {/* STRADA 1 - Preventivo al volo (CONSIGLIATO) */}
              <div onClick={(ev) => {
                ev.stopPropagation();
                console.log("[v79 click] Preventivo al volo triggered", { setPrevWorkspace: typeof setPrevWorkspace, setPrevTab: typeof setPrevTab });
                try {
                  setPrevWorkspace(true);
                  setPrevTab("fiscale");
                  setEditingVanoId(null);
                  console.log("[v79 click] setState OK");
                } catch (e) {
                  console.error("[v79 click] ERROR", e);
                  alert("Errore apertura preventivo: " + (e as any)?.message);
                }
              }} style={{
                background: "#fff",
                borderRadius: 16,
                padding: 14,
                cursor: "pointer",
                position: "relative",
                zIndex: 10,
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 8px 22px rgba(0,0,0,0.22), inset 0 -3px 0 rgba(4,52,44,0.06)",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: "linear-gradient(145deg, #5DCAA5, #1D9E75)",
                  boxShadow: "0 4px 10px rgba(29,158,117,0.35), inset 0 1px 1px rgba(255,255,255,0.3)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#04342C", letterSpacing: "-0.1px" }}>Preventivo al volo</div>
                  <div style={{ fontSize: 11, color: "#516B68", fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>Hai già i prezzi, invia subito al cliente in 2 tap</div>
                  <div style={{
                    fontSize: 8.5, fontWeight: 900, color: "#04342C",
                    background: "linear-gradient(145deg, rgba(93,202,165,0.3), rgba(29,158,117,0.18))",
                    padding: "3px 8px", borderRadius: 50,
                    letterSpacing: "0.4px", display: "inline-block", marginTop: 6,
                    border: "1px solid rgba(29,158,117,0.25)",
                  }}>⚡ CONSIGLIATO</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* STRADA 2 - Chiudi rilievo e basta */}
              <div onClick={() => {
                // chiude il rilievo, lascia la commessa in fase sopralluogo, torna alla lista
                try {
                  setSelectedRilievo(null);
                  setSelectedCM(null);
                } catch (e) { console.warn("v73 chiudi rilievo", e); }
              }} style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: 16,
                padding: 14,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                border: "2px solid transparent",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 13,
                  background: "linear-gradient(145deg, rgba(93,202,165,0.2), rgba(29,158,117,0.1))",
                  boxShadow: "inset 0 1px 2px rgba(255,255,255,0.5)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#04342C", letterSpacing: "-0.1px" }}>Chiudi rilievo e basta</div>
                  <div style={{ fontSize: 11, color: "#516B68", fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>Salva il rilievo, il preventivo lo fai dopo in azienda con calma</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>

            {/* Meta tiles */}
            <div style={{
              marginTop: 14, display: "grid",
              gridTemplateColumns: "1fr 1fr", gap: 10, position: "relative",
            }}>
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Vani pronti</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3, letterSpacing: "-0.3px" }}>{vaniCompletiV70}/{vaniV70.length}</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>tutte misure OK</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 14, padding: "11px 13px" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Stima lavoro</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3, letterSpacing: "-0.3px" }}>{stimaLavoroV73 > 0 ? fmtEurV73(stimaLavoroV73) : "—"}</div>
                <div style={{ fontSize: 10, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>{stimaLavoroV73 > 0 ? "da verificare" : "non calcolata"}</div>
              </div>
            </div>
          </div>
          )}

          {/* MENU 4 CENTRI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { id: "cliente", label: "Cliente", color: "#1D9E75", tintFrom: "rgba(93,202,165,0.22)", tintTo: "rgba(29,158,117,0.12)", badge: 0, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { id: "allegati", label: "Allegati", color: "#7F77DD", tintFrom: "rgba(175,169,236,0.22)", tintTo: "rgba(127,119,221,0.12)", badge: allegatiTotV70, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> },
              { id: "note", label: "Note", color: "#EF9F27", tintFrom: "rgba(250,199,117,0.25)", tintTo: "rgba(239,159,39,0.12)", badge: 0, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
              { id: "azioni", label: "Azioni", color: "#378ADD", tintFrom: "rgba(133,183,235,0.22)", tintTo: "rgba(55,138,221,0.12)", badge: 0, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="M1 12h6m6 0h6"/></svg> },
            ].map((m) => (
              <div key={m.id} onClick={() => setCentroApertoV70((v) => v === m.id ? null : m.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "14px 6px",
                background: centroApertoV70 === m.id ? `linear-gradient(145deg, ${m.tintFrom}, ${m.tintTo})` : "#fff",
                border: centroApertoV70 === m.id ? `1.5px solid ${m.color}66` : "1px solid rgba(200,228,228,0.4)",
                borderRadius: 16,
                cursor: "pointer",
                boxShadow: centroApertoV70 === m.id ? `0 6px 14px ${m.color}22` : "0 3px 8px rgba(13,31,31,0.04)",
                position: "relative",
                transition: "all 0.15s",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 11,
                  background: `linear-gradient(145deg, ${m.tintFrom}, ${m.tintTo})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: m.color,
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                }}>
                  {m.icon}
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 900, color: "#0F2525", letterSpacing: "0.2px" }}>{m.label}</span>
                {m.badge > 0 && (
                  <div style={{
                    position: "absolute", top: 8, right: 10,
                    fontSize: 9, fontWeight: 900,
                    background: "linear-gradient(145deg, #E24B4A, #C53030)",
                    color: "#fff", padding: "1px 6px", borderRadius: 50,
                    boxShadow: "0 2px 6px rgba(226,75,74,0.35)",
                    minWidth: 16, textAlign: "center" as any,
                  }}>{m.badge}</div>
                )}
              </div>
            ))}
          </div>

          {/* PANNELLO CENTRO ATTIVO */}
          {centroApertoV70 === "cliente" && (() => {
            const diarioList: any[] = (cV70.diarioCliente || []).slice().sort((a: any, b: any) => (b.ts || 0) - (a.ts || 0));
            const TAG_COLORS: any = {
              ACCORDO:      { bg: "rgba(239,159,39,0.14)",  fg: "#854F0B" },
              TELEFONATA:   { bg: "rgba(127,119,221,0.14)", fg: "#3C3489" },
              SOPRALLUOGO:  { bg: "rgba(55,138,221,0.14)",  fg: "#042C53" },
              WHATSAPP:     { bg: "rgba(37,211,102,0.14)",  fg: "#075E54" },
              EMAIL:        { bg: "rgba(55,138,221,0.14)",  fg: "#042C53" },
              NOTA:         { bg: "rgba(95,94,90,0.14)",    fg: "#2C2C2A" },
              RECLAMO:      { bg: "rgba(226,75,74,0.14)",   fg: "#8B1A1A" },
            };
            const fmtQuandoV74 = (ts: number) => {
              try {
                const d = new Date(ts); const now = new Date();
                const dOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                const nOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                const diffD = Math.round((nOnly - dOnly) / 86400000);
                const hhmm = d.toTimeString().slice(0,5);
                if (diffD === 0) return `Oggi ${hhmm}`;
                if (diffD === 1) return `Ieri ${hhmm}`;
                if (diffD < 7) return `${diffD} gg fa ${hhmm}`;
                return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) + " " + hhmm;
              } catch (e) { return ""; }
            };
            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Scheda cliente */}
                <div style={{ background: "linear-gradient(155deg, #E8F8F3 0%, #C4EAD9 100%)", border: "1px solid rgba(29,158,117,0.18)", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: "linear-gradient(145deg, #5DCAA5, #1D9E75)",
                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, fontWeight: 900,
                    boxShadow: "0 4px 12px rgba(29,158,117,0.35), inset 0 1px 1px rgba(255,255,255,0.3)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.15)", flexShrink: 0,
                  }}>
                    {((cV70.cliente || "?").split(/\s+/).slice(0, 2).map((w: string) => w[0] || "").join("") || "?").toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.2px" }}>{cV70.cliente || "Cliente"}</div>
                    <div style={{ fontSize: 11, color: "#5A7878", fontWeight: 700, marginTop: 2 }}>
                      {[cV70.telefono, cV70.email].filter(Boolean).join(" · ") || "Nessun contatto"}
                    </div>
                    {cV70.indirizzo && <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 2 }}>{cV70.indirizzo}</div>}
                  </div>
                </div>

                {/* Azioni rapide */}
                <div style={{ display: "flex", gap: 6 }}>
                  {cV70.telefono && <a href={`tel:${cV70.telefono}`} style={{ flex: 1, padding: "9px 8px", background: "rgba(29,158,117,0.12)", color: "#04342C", borderRadius: 10, textAlign: "center" as any, textDecoration: "none", fontSize: 10, fontWeight: 900, letterSpacing: "0.3px", border: "1px solid rgba(29,158,117,0.25)" }}>☎ CHIAMA</a>}
                  {cV70.telefono && <a href={`https://wa.me/${(cV70.telefono || "").replace(/\D/g, "")}`} target="_blank" rel="noopener" style={{ flex: 1, padding: "9px 8px", background: "rgba(37,211,102,0.12)", color: "#075E54", borderRadius: 10, textAlign: "center" as any, textDecoration: "none", fontSize: 10, fontWeight: 900, letterSpacing: "0.3px", border: "1px solid rgba(37,211,102,0.25)" }}>💬 WA</a>}
                  {cV70.email && <a href={`mailto:${cV70.email}?subject=Commessa ${cV70.code || ""}`} style={{ flex: 1, padding: "9px 8px", background: "rgba(55,138,221,0.1)", color: "#042C53", borderRadius: 10, textAlign: "center" as any, textDecoration: "none", fontSize: 10, fontWeight: 900, letterSpacing: "0.3px", border: "1px solid rgba(55,138,221,0.25)" }}>✉ EMAIL</a>}
                  {cV70.indirizzo && <a href={`https://maps.google.com/?q=${encodeURIComponent(cV70.indirizzo)}`} target="_blank" rel="noopener" style={{ flex: 1, padding: "9px 8px", background: "rgba(55,138,221,0.1)", color: "#042C53", borderRadius: 10, textAlign: "center" as any, textDecoration: "none", fontSize: 10, fontWeight: 900, letterSpacing: "0.3px", border: "1px solid rgba(55,138,221,0.25)" }}>🗺 NAVIGA</a>}
                </div>

                {/* DIARIO DEL CANTIERE */}
                <div style={{ background: "#fff", border: "1px solid rgba(200,228,228,0.4)", borderRadius: 16, padding: 14, boxShadow: "0 3px 10px rgba(13,31,31,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.1px" }}>Diario del cantiere</div>
                      <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 2 }}>{diarioList.length} {diarioList.length === 1 ? "voce" : "voci"}</div>
                    </div>
                    <div onClick={() => { setDiarioFormOpenV74(v => !v); setDiarioTestoV74(""); setDiarioChiV74("IO"); setDiarioTagV74("NOTA"); }} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "7px 12px",
                      background: diarioFormOpenV74 ? "rgba(226,75,74,0.12)" : "linear-gradient(145deg, #5DCAA5, #1D9E75)",
                      color: diarioFormOpenV74 ? "#8B1A1A" : "#fff",
                      borderRadius: 50, fontSize: 10, fontWeight: 900, letterSpacing: "0.3px",
                      cursor: "pointer",
                      boxShadow: diarioFormOpenV74 ? "none" : "0 3px 8px rgba(29,158,117,0.3)",
                      border: diarioFormOpenV74 ? "1px solid rgba(226,75,74,0.3)" : "none",
                    }}>
                      {diarioFormOpenV74 ? "✕ CHIUDI" : "+ SCRIVI"}
                    </div>
                  </div>

                  {/* Form scrittura */}
                  {diarioFormOpenV74 && (
                    <div style={{ marginBottom: 10, padding: 12, background: "rgba(200,228,228,0.15)", borderRadius: 12, border: "1px dashed rgba(200,228,228,0.6)" }}>
                      {/* Chi */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <div onClick={() => setDiarioChiV74("IO")} style={{
                          flex: 1, padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                          background: diarioChiV74 === "IO" ? "rgba(127,119,221,0.18)" : "#fff",
                          border: `1.5px solid ${diarioChiV74 === "IO" ? "#7F77DD" : "rgba(200,228,228,0.5)"}`,
                          textAlign: "center" as any, fontSize: 11, fontWeight: 900,
                          color: diarioChiV74 === "IO" ? "#3C3489" : "#5A7878",
                          letterSpacing: "0.3px",
                        }}>IO</div>
                        <div onClick={() => setDiarioChiV74("CLIENTE")} style={{
                          flex: 1, padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                          background: diarioChiV74 === "CLIENTE" ? "rgba(29,158,117,0.14)" : "#fff",
                          border: `1.5px solid ${diarioChiV74 === "CLIENTE" ? "#1D9E75" : "rgba(200,228,228,0.5)"}`,
                          textAlign: "center" as any, fontSize: 11, fontWeight: 900,
                          color: diarioChiV74 === "CLIENTE" ? "#04342C" : "#5A7878",
                          letterSpacing: "0.3px",
                        }}>CLIENTE</div>
                      </div>

                      {/* Tag */}
                      <div style={{ display: "flex", flexWrap: "wrap" as any, gap: 5, marginBottom: 8 }}>
                        {Object.keys(TAG_COLORS).map((t: string) => {
                          const c = TAG_COLORS[t];
                          const on = diarioTagV74 === t;
                          return (
                            <div key={t} onClick={() => setDiarioTagV74(t)} style={{
                              padding: "4px 9px", borderRadius: 6,
                              background: on ? c.bg : "#fff",
                              border: `1px solid ${on ? c.fg + "55" : "rgba(200,228,228,0.5)"}`,
                              color: on ? c.fg : "#8FA8A8",
                              fontSize: 9.5, fontWeight: 900, letterSpacing: "0.4px",
                              cursor: "pointer",
                            }}>{t}</div>
                          );
                        })}
                      </div>

                      {/* Testo */}
                      <textarea
                        value={diarioTestoV74}
                        onChange={(e) => setDiarioTestoV74(e.target.value)}
                        placeholder="Cosa è successo? Es. Ho chiamato per spiegare il preventivo, resta in attesa della firma..."
                        style={{
                          width: "100%", minHeight: 70, padding: 10,
                          borderRadius: 10, border: "1px solid rgba(200,228,228,0.6)",
                          fontSize: 12, fontFamily: "inherit", resize: "vertical" as any,
                          boxSizing: "border-box" as any, background: "#fff",
                          lineHeight: 1.4, color: "#0F2525",
                        }}
                      />

                      {/* Salva */}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <div onClick={() => { setDiarioFormOpenV74(false); setDiarioTestoV74(""); }} style={{
                          flex: 1, padding: "9px 10px", borderRadius: 10, cursor: "pointer",
                          background: "#fff", border: "1px solid rgba(200,228,228,0.5)",
                          textAlign: "center" as any, fontSize: 11, fontWeight: 800,
                          color: "#5A7878", letterSpacing: "0.3px",
                        }}>Annulla</div>
                        <div onClick={() => {
                          const testo = diarioTestoV74.trim();
                          if (!testo) return;
                          const newEntry = {
                            id: Date.now(),
                            ts: Date.now(),
                            chi: diarioChiV74,
                            tag: diarioTagV74,
                            testo: testo,
                          };
                          setCantieri((cs: any[]) => cs.map((x: any) => x.id === selectedCM!.id ? { ...x, diarioCliente: [...(x.diarioCliente || []), newEntry] } : x));
                          setSelectedCM((p: any) => p ? ({ ...p, diarioCliente: [...(p.diarioCliente || []), newEntry] }) : p);
                          setDiarioFormOpenV74(false); setDiarioTestoV74("");
                        }} style={{
                          flex: 2, padding: "9px 10px", borderRadius: 10, cursor: "pointer",
                          background: diarioTestoV74.trim() ? "linear-gradient(145deg, #5DCAA5, #1D9E75)" : "#ccc",
                          textAlign: "center" as any, fontSize: 11, fontWeight: 900,
                          color: "#fff", letterSpacing: "0.3px",
                          boxShadow: diarioTestoV74.trim() ? "0 3px 8px rgba(29,158,117,0.3)" : "none",
                        }}>SALVA VOCE</div>
                      </div>
                    </div>
                  )}

                  {/* Lista voci */}
                  {diarioList.length === 0 ? (
                    <div style={{ padding: "22px 12px", background: "rgba(200,228,228,0.15)", borderRadius: 12, fontSize: 11.5, color: "#5A7878", fontWeight: 600, textAlign: "center" as any, lineHeight: 1.5 }}>
                      Nessuna voce ancora.<br/>Tocca <strong>+ SCRIVI</strong> per aggiungere la prima conversazione col cliente.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {diarioList.map((ev: any) => {
                        const tagC = TAG_COLORS[ev.tag] || TAG_COLORS.NOTA;
                        const isIo = ev.chi === "IO";
                        return (
                          <div key={ev.id} style={{
                            background: "#fff",
                            border: "1px solid rgba(200,228,228,0.4)",
                            borderRadius: 12, padding: "10px 12px",
                            boxShadow: "0 2px 5px rgba(13,31,31,0.03)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" as any }}>
                              <span style={{
                                fontSize: 10, fontWeight: 900,
                                color: isIo ? "#3C3489" : "#04342C",
                                background: isIo ? "rgba(127,119,221,0.14)" : "rgba(29,158,117,0.14)",
                                padding: "2px 8px", borderRadius: 6, letterSpacing: "0.2px",
                              }}>{ev.chi}</span>
                              <span style={{
                                fontSize: 9, fontWeight: 900,
                                color: tagC.fg, background: tagC.bg,
                                padding: "2px 7px", borderRadius: 5, letterSpacing: "0.4px",
                              }}>{ev.tag}</span>
                              <span style={{ flex: 1, fontSize: 10, color: "#8FA8A8", fontWeight: 700, letterSpacing: "0.2px", textAlign: "right" as any }}>{fmtQuandoV74(ev.ts)}</span>
                              <span onClick={() => {
                                if (!window.confirm("Elimina questa voce?")) return;
                                setCantieri((cs: any[]) => cs.map((x: any) => x.id === selectedCM!.id ? { ...x, diarioCliente: (x.diarioCliente || []).filter((e: any) => e.id !== ev.id) } : x));
                                setSelectedCM((p: any) => p ? ({ ...p, diarioCliente: (p.diarioCliente || []).filter((e: any) => e.id !== ev.id) }) : p);
                              }} style={{ fontSize: 11, color: "#C53030", cursor: "pointer", fontWeight: 700, padding: "2px 6px" }}>✕</span>
                            </div>
                            <div style={{ fontSize: 12.5, color: "#0F2525", fontWeight: 500, lineHeight: 1.45 }}>{ev.testo}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {centroApertoV70 === "allegati" && (
            <div style={{ background: "#fff", border: "1px solid rgba(200,228,228,0.4)", borderRadius: 16, padding: 14, boxShadow: "0 3px 10px rgba(13,31,31,0.05)" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F2525", marginBottom: 10 }}>Cosa vuoi allegare?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { k: "foto", l: "Foto", c: "#7F77DD", cDark: "#3C3489", tintA: "#AFA9EC", tintB: "#7F77DD", n: fotoGlobalV70, act: () => { try { (fotoInputRef as any).current?.click(); } catch (e) {} } },
                  { k: "audio", l: "Audio", c: "#EF9F27", cDark: "#854F0B", tintA: "#FAC775", tintB: "#EF9F27", n: audioGlobalV70, act: () => { try { (setShowAllegatiModal as any)("vocale"); } catch (e) {} } },
                  { k: "nota", l: "Nota", c: "#1D9E75", cDark: "#04342C", tintA: "#5DCAA5", tintB: "#1D9E75", n: noteGlobalV70, act: () => { try { (setShowAllegatiModal as any)("nota"); (setAllegatiText as any)(""); } catch (e) {} } },
                  { k: "file", l: "File", c: "#378ADD", cDark: "#042C53", tintA: "#85B7EB", tintB: "#378ADD", n: fileGlobalV70, act: () => { try { (fileInputRef as any).current?.click(); } catch (e) {} } },
                ].map((a: any) => (
                  <div key={a.k} onClick={a.act} style={{
                    background: "#fff", border: "1px solid rgba(200,228,228,0.4)",
                    borderRadius: 16, padding: "14px 12px", cursor: "pointer",
                    boxShadow: "0 3px 8px rgba(13,31,31,0.04)",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 13,
                      background: `linear-gradient(145deg, ${a.tintA}, ${a.tintB})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", marginBottom: 10,
                      boxShadow: `0 4px 10px ${a.tintB}55, inset 0 1px 1px rgba(255,255,255,0.3)`,
                    }}>
                      {a.k === "foto" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>}
                      {a.k === "audio" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
                      {a.k === "nota" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                      {a.k === "file" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#0F2525" }}>{a.l}</div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: "#5A7878", marginTop: 2 }}>{a.n} salvati</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {centroApertoV70 === "note" && (
            <div style={{ background: "#fff", border: "1px solid rgba(200,228,228,0.4)", borderRadius: 16, padding: 14, boxShadow: "0 3px 10px rgba(13,31,31,0.05)" }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: "#0F2525", marginBottom: 4 }}>Appunti del lavoro</div>
              <div style={{ fontSize: 11, color: "#5A7878", fontWeight: 600, marginBottom: 10 }}>Tutte le note tecniche di questa commessa</div>
              {(cV70.note && cV70.note.trim()) ? (
                <div style={{ padding: "10px 12px", background: "rgba(250,199,117,0.1)", border: "1px solid rgba(239,159,39,0.22)", borderRadius: 10, fontSize: 12.5, color: "#0F2525", lineHeight: 1.4 }}>
                  {cV70.note}
                </div>
              ) : (
                <div style={{ padding: "14px 12px", background: "rgba(200,228,228,0.25)", borderRadius: 10, fontSize: 12, color: "#5A7878", fontWeight: 600, textAlign: "center" as any }}>
                  Nessuna nota ancora. Scrivi dal centro Allegati &gt; Nota.
                </div>
              )}
            </div>
          )}

          {centroApertoV70 === "azioni" && (
            <div style={{ background: "#fff", border: "1px solid rgba(200,228,228,0.4)", borderRadius: 16, padding: 10, boxShadow: "0 3px 10px rgba(13,31,31,0.05)", display: "flex", flexDirection: "column", gap: 6 }}>
              {rCurV70 && (
                <div onClick={() => { setSelectedRilievo(rCurV70); (setShowRiepilogo as any)(true); }} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer",
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(55,138,221,0.15), rgba(55,138,221,0.08))", color: "#378ADD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Riepilogo rilievo</div>
                    <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1 }}>Vedi scheda completa</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              )}
              {rCurV70 && (
                <div onClick={() => { setSelectedRilievo(rCurV70); exportPDF(); }} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer",
                }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(29,158,117,0.15), rgba(29,158,117,0.08))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Esporta PDF</div>
                    <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1 }}>Scheda tecnica per officina</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              )}
              {/* v75 · EXPORT CSV */}
              <div onClick={() => {
                try {
                  const rows: string[] = [];
                  rows.push(["Commessa","Cliente","Rilievo","Vano","Stanza","Sistema","Colore int","Colore est","Telaio","Vetro","L centro","H centro","L alto","H sx","Pezzi","Note"].join(";"));
                  const rilievi = cV70.rilievi || [];
                  rilievi.forEach((ril: any) => {
                    (ril.vani || []).forEach((v: any) => {
                      const m = v.misure || {};
                      rows.push([
                        cV70.code || "",
                        cV70.cliente || "",
                        `R${ril.n || ""}`,
                        v.nome || "",
                        v.stanza || "",
                        v.sistema || "",
                        v.coloreInt || "",
                        v.coloreEst || "",
                        v.telaio || "",
                        v.vetro || "",
                        m.lCentro || "",
                        m.hCentro || "",
                        m.lAlto || "",
                        m.hSx || "",
                        v.pezzi || 1,
                        (v.note || "").replace(/[;\n\r]/g, " "),
                      ].map(x => `"${String(x).replace(/"/g, '""')}"`).join(";"));
                    });
                  });
                  const csv = "﻿" + rows.join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `commessa_${cV70.code || cV70.id}_${new Date().toISOString().slice(0,10)}.csv`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) { console.error("Export CSV", e); alert("Errore export CSV"); }
              }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(99,153,34,0.15), rgba(99,153,34,0.08))", color: "#639922", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Esporta CSV</div>
                  <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1 }}>Tabella vani per Excel / Google Sheets</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#639922" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* v75 · EXPORT JSON */}
              <div onClick={() => {
                try {
                  const payload = {
                    exportedAt: new Date().toISOString(),
                    app: "MASTRO ERP",
                    commessa: cV70,
                  };
                  const json = JSON.stringify(payload, null, 2);
                  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `commessa_${cV70.code || cV70.id}_${new Date().toISOString().slice(0,10)}.json`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) { console.error("Export JSON", e); alert("Errore export JSON"); }
              }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(127,119,221,0.15), rgba(127,119,221,0.08))", color: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Esporta JSON</div>
                  <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1 }}>Backup completo commessa (sviluppatori)</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              {/* v75 · EXPORT HTML */}
              <div onClick={() => {
                try {
                  const esc = (s: any) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                  const rilievi = cV70.rilievi || [];
                  let vaniRows = "";
                  rilievi.forEach((ril: any) => {
                    (ril.vani || []).forEach((v: any) => {
                      const m = v.misure || {};
                      vaniRows += `<tr><td>R${esc(ril.n)}</td><td>${esc(v.nome)}</td><td>${esc(v.stanza)}</td><td>${esc(v.sistema)}</td><td>${esc(v.coloreInt)} / ${esc(v.coloreEst)}</td><td>${esc(v.telaio)}</td><td>${esc(v.vetro)}</td><td>${esc(m.lCentro || m.lAlto || "")} × ${esc(m.hCentro || m.hSx || "")}</td><td>${esc(v.pezzi || 1)}</td></tr>`;
                    });
                  });
                  const html = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><title>Commessa ${esc(cV70.code || cV70.id)}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0D1F1F;max-width:900px;margin:40px auto;padding:20px;}
h1{color:#28A0A0;border-bottom:3px solid #28A0A0;padding-bottom:8px;}
h2{color:#1E8080;margin-top:30px;}
table{width:100%;border-collapse:collapse;margin-top:12px;}
th{background:#28A0A0;color:#fff;padding:10px;text-align:left;font-size:12px;}
td{padding:8px 10px;border-bottom:1px solid #E4F2F2;font-size:13px;}
tr:nth-child(even){background:#F4F6F5;}
.meta{background:#F4F6F5;padding:14px;border-radius:10px;margin-top:10px;}
.meta div{margin:4px 0;font-size:13px;}
.meta strong{color:#1A7A7A;margin-right:8px;}</style></head><body>
<h1>Commessa ${esc(cV70.code || cV70.id)}</h1>
<div class="meta">
<div><strong>Cliente:</strong> ${esc(cV70.cliente || "")}</div>
<div><strong>Indirizzo:</strong> ${esc(cV70.indirizzo || "")}</div>
<div><strong>Telefono:</strong> ${esc(cV70.telefono || "")}</div>
<div><strong>Email:</strong> ${esc(cV70.email || "")}</div>
<div><strong>Tipo edificio:</strong> ${esc(tEdifLabelV70)}</div>
<div><strong>Data export:</strong> ${new Date().toLocaleString("it-IT")}</div>
</div>
<h2>Vani e misure</h2>
${vaniRows ? `<table><thead><tr><th>Rilievo</th><th>Vano</th><th>Stanza</th><th>Sistema</th><th>Colori</th><th>Telaio</th><th>Vetro</th><th>Misure</th><th>Pz</th></tr></thead><tbody>${vaniRows}</tbody></table>` : "<p><em>Nessun vano rilevato.</em></p>"}
${cV70.note ? `<h2>Note</h2><p>${esc(cV70.note)}</p>` : ""}
<p style="margin-top:40px;color:#8FA8A8;font-size:11px;">Generato da MASTRO Suite · ${new Date().toISOString()}</p>
</body></html>`;
                  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `commessa_${cV70.code || cV70.id}_${new Date().toISOString().slice(0,10)}.html`;
                  document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) { console.error("Export HTML", e); alert("Errore export HTML"); }
              }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(212,83,126,0.15), rgba(212,83,126,0.08))", color: "#D4537E", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Esporta HTML</div>
                  <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1 }}>Report leggibile da browser</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4537E" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>

              <div onClick={() => {
                try {
                  (setProblemaForm as any)({ titolo: "", descrizione: "", tipo: "materiale", priorita: "media", assegnato: "" });
                  (setShowProblemaModal as any)(true);
                } catch (e) {}
              }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(239,159,39,0.15), rgba(239,159,39,0.08))", color: "#EF9F27", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Segnala problema</div>
                  <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 1 }}>Imprevisto, materiale mancante</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              <div onClick={() => { if (window.confirm("Eliminare definitivamente la commessa?")) deleteCommessa(cV70.id); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                cursor: "pointer",
              }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, #F09595, #E24B4A)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 3px 8px rgba(226,75,74,0.3)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#8B1A1A" }}>Elimina commessa</div>
                  <div style={{ fontSize: 10, color: "#E24B4A", fontWeight: 700, marginTop: 1 }}>Azione irreversibile</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          )}

          {/* CRONOLOGIA ACCORDION */}
          <div>
            <div onClick={() => setCronOpenV70(v => !v)} style={{
              background: "#fff",
              border: "1px solid rgba(200,228,228,0.4)",
              borderRadius: cronOpenV70 ? "14px 14px 0 0" : 14,
              borderBottomColor: cronOpenV70 ? "transparent" : "rgba(200,228,228,0.4)",
              padding: "12px 14px",
              display: "flex", alignItems: "center", gap: 12,
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(13,31,31,0.04)",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(145deg, rgba(127,119,221,0.18), rgba(29,158,117,0.12))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#3C3489",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.1px" }}>Cronologia</div>
                <div style={{ fontSize: 10.5, color: "#5A7878", fontWeight: 600, marginTop: 2 }}>
                  {logV70.length > 0 ? `${logV70.length} eventi · ultima ${logV70[logV70.length - 1]?.quando || "Adesso"}` : "1 evento · ultima Adesso"}
                </div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 900, color: "#3C3489",
                background: "linear-gradient(145deg, rgba(175,169,236,0.28), rgba(127,119,221,0.15))",
                padding: "4px 10px", borderRadius: 50, letterSpacing: "0.3px",
                border: "1px solid rgba(127,119,221,0.22)",
              }}>{logV70.length || 1}</div>
              <div style={{
                width: 24, height: 24, borderRadius: 8,
                background: "rgba(40,160,160,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#1A7A7A",
                transform: cronOpenV70 ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
            {cronOpenV70 && (
              <div style={{
                background: "#fff",
                border: "1px solid rgba(200,228,228,0.4)",
                borderTop: "1px dashed rgba(200,228,228,0.6)",
                borderRadius: "0 0 14px 14px",
                padding: "14px 12px 12px",
                position: "relative",
                boxShadow: "0 3px 8px rgba(13,31,31,0.04)",
              }}>
                <div style={{ position: "absolute", left: 30, top: 22, bottom: 22, width: 2, background: "linear-gradient(180deg, #AFA9EC 0%, #5DCAA5 50%, #FAC775 100%)", borderRadius: 1, opacity: 0.3 }} />
                {(logV70.length > 0 ? logV70.slice().reverse() : [{ chi: cV70.creatoDa || "Tu", cosa: "creato la commessa", quando: "Adesso" }]).map((ev: any, k: number) => (
                  <div key={k} style={{ display: "flex", gap: 12, padding: "7px 0", position: "relative" }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 11,
                      background: "linear-gradient(145deg, #AFA9EC, #7F77DD)",
                      color: "#fff", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 3px 8px rgba(127,119,221,0.3), inset 0 1px 1px rgba(255,255,255,0.25)",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.4 8.6L22 9.3l-5.8 4.7 1.8 7.5L12 17.8l-6 3.7 1.8-7.5L2 9.3l7.6-.7z"/></svg>
                    </div>
                    <div style={{ flex: 1, background: "linear-gradient(145deg, rgba(127,119,221,0.04), rgba(200,228,228,0.08))", borderRadius: 10, padding: "8px 11px", border: "1px solid rgba(200,228,228,0.35)" }}>
                      <div style={{ fontSize: 11.5, color: "#0F2525", fontWeight: 700, lineHeight: 1.35 }}>
                        <strong style={{ color: "#3C3489", fontWeight: 900 }}>{ev.chi || "Sistema"}</strong> · {ev.cosa || ev.tipo || "evento"}
                      </div>
                      <div style={{ fontSize: 9.5, color: "#8FA8A8", fontWeight: 700, marginTop: 2, letterSpacing: "0.3px" }}>{ev.quando || ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* v71 · MODAL NUOVO RILIEVO */}
      {showNuovoRilievoModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowNuovoRilievoModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: 20, boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0D1F1F" }}>Nuovo rilievo</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Commessa {selectedCM.code} · {selectedCM.cliente}</div>
              </div>
              <div onClick={() => setShowNuovoRilievoModal(false)} style={{ width: 32, height: 32, borderRadius: 16, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: T.sub }}>✕</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 8 }}>Tipo rilievo</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <div onClick={() => setNuovoRilievoComplesso(false)} style={{
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: !nuovoRilievoComplesso ? "#28A0A015" : T.card,
                  border: `1.5px solid ${!nuovoRilievoComplesso ? "#28A0A0" : T.bdr}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: !nuovoRilievoComplesso ? "#28A0A0" : T.text }}>Semplice</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Vani senza gerarchia</div>
                </div>
                <div onClick={() => setNuovoRilievoComplesso(true)} style={{
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  background: nuovoRilievoComplesso ? "#3C348915" : T.card,
                  border: `1.5px solid ${nuovoRilievoComplesso ? "#3C3489" : T.bdr}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: nuovoRilievoComplesso ? "#3C3489" : T.text }}>Complesso</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Organizza per zone/piani</div>
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 8 }}>Tipo misure</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { id: "provvisorio",    l: "Provvisorie",   d: "Prima visita, misure indicative",    c: "#D08008" },
                  { id: "verificato",     l: "Verificate",    d: "Controllate sul posto",              c: "#185FA5" },
                  { id: "definitivo",     l: "Definitive",    d: "Misure finali, preventivo sbloccato", c: "#0F6E56" },
                  { id: "da_rivedere",    l: "Da rivedere",   d: "Discrepanze, ricontrollare",         c: "#DC4444" },
                  { id: "personalizzato", l: "Personalizzato", d: "Tipo a scelta, descrivi nelle note", c: "#3C3489" },
                ].map(t => {
                  const on = nuovoRilievoTipo === t.id;
                  return (
                    <div key={t.id} onClick={() => setNuovoRilievoTipo(t.id as any)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                      background: on ? `${t.c}15` : T.card,
                      border: `1.5px solid ${on ? t.c : T.bdr}`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: on ? t.c : T.text }}>{t.l}</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{t.d}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 6 }}>Chi ha fatto il rilievo</div>
              <input type="text" value={nuovoRilievoRilevatore} onChange={e => setNuovoRilievoRilevatore(e.target.value)} placeholder="Nome rilevatore" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as any, background: T.card }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 6 }}>Note (opzionale)</div>
              <textarea value={nuovoRilievoNote} onChange={e => setNuovoRilievoNote(e.target.value)} placeholder="Es. Seconda visita dopo modifiche" style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 12, fontFamily: "inherit", resize: "vertical" as any, boxSizing: "border-box" as any, background: T.card }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowNuovoRilievoModal(false)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
              <button onClick={() => {
                const oggiISO = new Date().toISOString().split("T")[0];
                const rilieviAtt = selectedCM.rilievi || [];
                const nextN = rilieviAtt.length + 1;
                const newR = {
                  id: Date.now(),
                  n: nextN,
                  tipo: nuovoRilievoTipo,
                  data: oggiISO,
                  ora: new Date().toTimeString().slice(0,5),
                  rilevatore: nuovoRilievoRilevatore || "",
                  note: nuovoRilievoNote || "",
                  vani: [],
                  complesso: nuovoRilievoComplesso,
                };
                setCantieri((cs: any[]) => cs.map(cm => cm.id === selectedCM.id ? { ...cm, rilievi: [...(cm.rilievi || []), newR] } : cm));
                setSelectedCM((prev: any) => prev ? ({ ...prev, rilievi: [...(prev.rilievi || []), newR] }) : prev);
                setSelectedRilievo(newR);
                setShowNuovoRilievoModal(false);
                setCmSubTab("sopralluoghi");
              }} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                Crea rilievo · Aggiungi vani
              </button>
            </div>
          </div>
        </div>
      )}

      {/* v71 · MODAL AGGIUNGI VANO COMPLESSO */}
      {showAggiungiVanoModal && (() => {
        const tEdifMV = (selectedCM as any).tipoEdificio || (selectedCM as any).tipo_edificio || "";
        const labelsMV = (() => {
          switch (tEdifMV) {
            case "palazzo": return { l1: "Scala", l2: "Piano", l3: "Interno" };
            case "condominio": return { l1: "", l2: "Piano", l3: "Interno" };
            case "scuola": return { l1: "Edificio/Plesso", l2: "Piano", l3: "Aula" };
            case "ospedale": return { l1: "Padiglione", l2: "Piano", l3: "Reparto" };
            case "ufficio": return { l1: "Edificio", l2: "Piano", l3: "Ufficio" };
            case "hotel": return { l1: "Edificio", l2: "Piano", l3: "Camera" };
            case "centro_comm": return { l1: "", l2: "Livello", l3: "Negozio" };
            case "industriale": return { l1: "Corpo", l2: "", l3: "Settore" };
            case "personalizzato": return { l1: (selectedCM as any).livello1Label || "Livello 1", l2: (selectedCM as any).livello2Label || "Livello 2", l3: (selectedCM as any).livello3Label || "Livello 3" };
            default: return { l1: "Zona", l2: "Piano", l3: "Locale" };
          }
        })();
        const canCreateMV = (!labelsMV.l1 || nvL1.trim()) && (!labelsMV.l2 || nvL2.trim()) && (!labelsMV.l3 || nvL3.trim());
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowAggiungiVanoModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: 20, boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#0D1F1F" }}>Nuovo vano · posizione</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Indica dove si trova dentro lo stabile</div>
                </div>
                <div onClick={() => setShowAggiungiVanoModal(false)} style={{ width: 30, height: 30, borderRadius: 15, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>✕</div>
              </div>
              {labelsMV.l1 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>{labelsMV.l1} *</div>
                  <input style={S.input} placeholder={`Es. ${labelsMV.l1} A`} value={nvL1} onChange={e => setNvL1(e.target.value)} />
                </div>
              )}
              {labelsMV.l2 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>{labelsMV.l2} *</div>
                  <input style={S.input} placeholder={`Es. 1, Terra, 3`} value={nvL2} onChange={e => setNvL2(e.target.value)} />
                </div>
              )}
              {labelsMV.l3 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>{labelsMV.l3} *</div>
                  <input style={S.input} placeholder={`Es. ${labelsMV.l3} 5`} value={nvL3} onChange={e => setNvL3(e.target.value)} />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>Stanza / ambiente</div>
                <input style={S.input} placeholder="Es. Cucina, Bagno, Camera, Aula magna…" value={nvStanza} onChange={e => setNvStanza(e.target.value)} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowAggiungiVanoModal(false)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                <button disabled={!canCreateMV} onClick={() => {
                  if (!selectedCM || !selectedRilievo) return;
                  const posStr = [nvL1, nvL2, nvL3].filter(Boolean).join(" · ");
                  const baseNome = [posStr, nvStanza].filter(Boolean).join(" · ");
                  const v = {
                    id: Date.now(),
                    nome: baseNome || `Vano ${(selectedRilievo.vani?.length||0)+1}`,
                    tipo: "", stanza: nvStanza, piano: nvL2,
                    livello_1: nvL1, livello_2: nvL2, livello_3: nvL3,
                    sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "",
                    misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1,
                    accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
                  };
                  const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                  setCantieri(cs => cs.map(cm => cm.id === selectedCM.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                  setSelectedRilievo(updR);
                  setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }) : prev);
                  setSelectedVano(v);
                  setVanoStep(0);
                  setShowAggiungiVanoModal(false);
                }} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: canCreateMV ? T.acc : "#ccc", color: "#fff", fontSize: 14, fontWeight: 800, cursor: canCreateMV ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                  + Crea vano
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* v72 · INPUT hidden per File e Foto - servono per i bottoni Allegati */}
      <input ref={fileInputRef} type="file" style={{display:"none"}} onChange={e=>{
        const f = (e.target as any).files?.[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (ev: any) => {
          const a = { id: Date.now(), tipo: "file", nome: f.name, data: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), dataUrl: ev.target.result };
          setCantieri((cs: any[]) => cs.map(x => x.id === selectedCM!.id ? { ...x, allegati: [...(x.allegati || []), a] } : x));
          setSelectedCM((p: any) => ({ ...p, allegati: [...(p.allegati || []), a] }));
        };
        r.readAsDataURL(f);
        (e.target as any).value = "";
      }} />
      <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{
        const f = (e.target as any).files?.[0]; if (!f) return;
        const r = new FileReader();
        r.onload = (ev: any) => {
          const a = { id: Date.now(), tipo: "foto", nome: f.name, data: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), dataUrl: ev.target.result };
          setCantieri((cs: any[]) => cs.map(x => x.id === selectedCM!.id ? { ...x, allegati: [...(x.allegati || []), a] } : x));
          setSelectedCM((p: any) => ({ ...p, allegati: [...(p.allegati || []), a] }));
        };
        r.readAsDataURL(f);
        (e.target as any).value = "";
      }} />
      </>
    );
  }


  // · CAD DRAW FULLSCREEN ·
  if (showCadDraw) {
    const m = selectedCM?.misure || {};
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 10px) 16px 10px", background: "#1A1A1C", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#28A0A0", fontWeight: 700, fontSize: 14 }}><I d={ICO.ruler} /> {selectedCM?.nome || "Disegno"}</span>
          <button onClick={() => setShowCadDraw(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <DisegnoTecnico
            vanoId={selectedCM?.id || ""}
            vanoNome={selectedCM?.nome || "Disegno"}
            vanoDisegno={selectedCM?.cadData}
            realW={m.lCentro || m.lAlto || 1200}
            realH={m.hCentro || m.hSx || 1400}
            onUpdate={(newDisegno: any) => {
              setCantieri((cs: any[]) => cs.map(x => x.id === selectedCM?.id ? { ...x, cadData: newDisegno } : x));
              setSelectedCM((p: any) => ({ ...p, cadData: newDisegno }));
            }}
          />
        </div>
      </div>
    );
  }
    const c = selectedCM;
    const r = selectedRilievo; // rilievo corrente
    const fase = PIPELINE.find(p => p.id === c.fase);
    //  READ-ONLY: solo l'ultimo rilievo  modificabile 
    const lastRilievo = (c.rilievi || []).length > 0 ? c.rilievi[c.rilievi.length - 1] : null;
    const isLastRilievo = !r || !lastRilievo || r.id === lastRilievo.id;
    const isStorico = r && !isLastRilievo;

    //  PREVENTIVO WORKSPACE CONSTANTS 
    const CONTROT_OPT = ["Nessuno", "Standard", "Monoblocco", "Monoblocco coibentato", "Monoblocco Termico"];
    const CASS_OPT = ["", "Standard", "Coibentato", "Monoblocco", "Monoblocco Termico"];
    const COPRIFILO_OPT = ["", "PVC 40mm", "PVC 60mm", "PVC 70mm", "Alluminio 40mm", "Alluminio 60mm", "Alluminio 70mm", "Alluminio 90mm"];
    const SOGLIA_OPT = ["", "Standard", "Ribassata", "A filo pavimento", "Alluminio", "Marmo"];
    const DAVANZALE_OPT = ["", "Alluminio 150mm", "Alluminio 200mm", "Alluminio 250mm", "Alluminio 300mm", "Alluminio 350mm", "Marmo", "Pietra"];
    const ZANZ_TIPO = ["Laterale", "Verticale", "Plissè", "A rullo"];
    const PERS_TIPO = ["Alluminio", "PVC", "Legno", "Blindata"];
    const TAPP_TIPO = ["PVC", "Alluminio coibentato", "Alluminio", "Acciaio"];
    const DETRAZIONI_OPT = [
      { id: "nessuna", l: "Nessuna", perc: 0 },
      { id: "50", l: "Ristrutt. 50%", perc: 50 },
      { id: "65", l: "Ecobonus 65%", perc: 65 },
      { id: "75", l: "Barriere 75%", perc: 75 },
    ];
    const TIPI_VANO = ["F1A","F2A","F3A","PF1A","PF2A","PF3A","VAS","FISSO","SC2A","SC3A","PORTA","SCOR","BOX"];

    //  PREVENTIVO WORKSPACE VIEW 
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
      const tabPw = (t) => ({ flex: 1, padding: "10px 6px", textAlign: "center" as any, fontSize: 11, fontWeight: 700, cursor: "pointer", color: prevTab === t ? "#fff" : "#6A8484", background: prevTab === t ? "#28A0A0" : "transparent", borderRadius: 8, margin: "4px 2px", transition: "all .15s" });

      return (
        <div style={{ paddingBottom: 80 }}>
          {/* v81 · HEADER ULTRA HD identico pannello v8 */}
          <div style={{
            background: "linear-gradient(135deg, #2FB2A8 0%, #28A0A0 45%, #1E8080 100%)",
            padding: "calc(env(safe-area-inset-top, 0px) + 22px) 18px 22px",
            color: "#fff", position: "sticky", top: 0, zIndex: 30, overflow: "hidden",
            boxShadow: "0 10px 32px rgba(30,128,128,0.35), 0 4px 12px rgba(30,128,128,0.15)",
          }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 40%, transparent 70%)", pointerEvents: "none" as any }} />
            <div style={{ position: "absolute", bottom: -80, left: -50, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)", pointerEvents: "none" as any }} />
            <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
              <div onClick={() => { setPrevWorkspace(false); setPrevTab && setPrevTab("riepilogo"); }} style={{
                width: 42, height: 42, borderRadius: 14,
                background: "rgba(255,255,255,0.22)", backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)" as any,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "inset 0 1px 1.5px rgba(255,255,255,0.45), inset 0 -1px 1px rgba(0,0,0,0.08), 0 3px 8px rgba(0,0,0,0.14)",
                cursor: "pointer", flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.92, letterSpacing: "1.3px", textTransform: "uppercase" as any }}>{c.code} &middot; Preventivo</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.8px", marginTop: 3, lineHeight: 1.05, textTransform: "uppercase" as any, textShadow: "0 2px 6px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>
                  {(c.cliente || "") + (c.cognome ? " " + c.cognome : "")}
                </div>
                <div style={{ fontSize: 10.5, opacity: 0.9, marginTop: 4, fontWeight: 600, textTransform: "uppercase" as any, letterSpacing: "0.4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as any }}>{c.indirizzo || ""}</div>
              </div>
              <div style={{ textAlign: "right" as any, flexShrink: 0 }}>
                <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1, textShadow: "0 2px 5px rgba(0,0,0,0.18)" }}>&euro; {pwFmt(pwTotale)}</div>
                <div style={{ fontSize: 9, opacity: 0.88, fontWeight: 700, marginTop: 4, letterSpacing: "0.4px" }}>IVA {pwIvaDefault}% incl.</div>
              </div>
            </div>
          </div>

          {/* v81 · STEPPER 8 puntini */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px 0" }}>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: "#5A7878", letterSpacing: "0.5px", textTransform: "uppercase" as any, flexShrink: 0 }}>Passo 2/8</div>
            <div style={{ display: "flex", gap: 3, flex: 1 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #3ABDBD, #28A0A0)", boxShadow: "0 0 5px rgba(40,160,160,0.5)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #5DCAA5, #1D9E75)", boxShadow: "0 0 7px rgba(29,158,117,0.6)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.55)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.55)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.55)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.55)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.55)" }} />
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.55)" }} />
            </div>
            <div style={{ fontSize: 9.5, fontWeight: 900, color: "#1D9E75", letterSpacing: "0.5px", textTransform: "uppercase" as any, flexShrink: 0 }}>Preventivo</div>
          </div>

          {/* v81 · 2 TAB SOLTANTO */}
          <div style={{ display: "flex", gap: 6, padding: "13px 14px 0" }}>
            <div onClick={() => setPrevTab("fiscale")} style={{
              flex: 1, padding: "12px 10px", borderRadius: 13, fontSize: 11, fontWeight: 900,
              textAlign: "center" as any, cursor: "pointer",
              background: prevTab === "fiscale"
                ? "linear-gradient(145deg, #2FB2A8 0%, #1E8080 100%)"
                : "#fff",
              color: prevTab === "fiscale" ? "#fff" : "#5A7878",
              letterSpacing: "0.4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: prevTab === "fiscale" ? "1px solid transparent" : "1px solid rgba(200,228,228,0.5)",
              textTransform: "uppercase" as any,
              boxShadow: prevTab === "fiscale"
                ? "0 6px 16px rgba(30,128,128,0.35), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -2px 2px rgba(0,0,0,0.08)"
                : "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 11 11 13 15 9"/></svg>
              Fiscale &amp; Condizioni
            </div>
            <div onClick={() => setPrevTab("riepilogo")} style={{
              flex: 1, padding: "12px 10px", borderRadius: 13, fontSize: 11, fontWeight: 900,
              textAlign: "center" as any, cursor: "pointer",
              background: prevTab === "riepilogo"
                ? "linear-gradient(145deg, #2FB2A8 0%, #1E8080 100%)"
                : "#fff",
              color: prevTab === "riepilogo" ? "#fff" : "#5A7878",
              letterSpacing: "0.4px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              border: prevTab === "riepilogo" ? "1px solid transparent" : "1px solid rgba(200,228,228,0.5)",
              textTransform: "uppercase" as any,
              boxShadow: prevTab === "riepilogo"
                ? "0 6px 16px rgba(30,128,128,0.35), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -2px 2px rgba(0,0,0,0.08)"
                : "0 2px 6px rgba(13,31,31,0.04)",
            }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Riepilogo &amp; Invio
            </div>
          </div>

          <div style={{ paddingTop: 12 }}>

          {/*  TAB SOPRALLUOGO (REPORT + DIFF)  */}
          {prevTab === "sopralluogo" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ padding: 14, background: `${T.blue}10`, borderRadius: 12, marginBottom: 14, border: `1px solid ${T.blue}20` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.blue }}><I d={ICO.clipboard} /> Report Sopralluogo</div>
                  <div style={{ fontSize: 10, color: T.sub, background: T.card, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>R{pwRilievi.length} · {pwRilievi[0]?.data || "·"}</div>
                </div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{c.cliente} {c.cognome || ""} · {c.indirizzo || ""}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                {[
                  { l: "Vani", v: pwVani.length, col: T.acc },
                  { l: "Pezzi", v: pwVani.reduce((s, v) => s + (v.pezzi || 1), 0), col: T.blue },
                  { l: "Foto", v: pwVani.reduce((s, v) => s + (Array.isArray(v.foto) ? v.foto.length : 0), 0), col: T.grn },
                  { l: "⏹+", v: pwVani.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length < 6).length, col: T.red },
                ].map((st, i) => (
                  <div key={i} style={{ background: T.card, borderRadius: 10, padding: "10px 6px", textAlign: "center", border: `1px solid ${T.bdr}` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: st.col }}>{st.v}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.sub }}>{st.l}</div>
                  </div>
                ))}
              </div>

              {pwVani.length > 0 && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button
                    onClick={() => setSelectedVaniBulk(selectedVaniBulk.length === pwVani.length ? [] : pwVani.map(v => v.id))}
                    style={{
                      padding: "6px 12px", borderRadius: 6,
                      background: selectedVaniBulk.length === pwVani.length ? "#28A0A0" : "#fff",
                      color: selectedVaniBulk.length === pwVani.length ? "#fff" : "#28A0A0",
                      border: "1px solid #28A0A0",
                      fontSize: 11, fontWeight: 700, cursor: "pointer",
                      fontFamily: "inherit",
                    }}>
                    {selectedVaniBulk.length === pwVani.length ? "✓ Tutti selezionati" : "☐ Seleziona tutti"}
                  </button>
                </div>
              )}
              {pwVani.map((v, idx) => (
                <VanoCardPreventivo
                  key={v.id}
                  vano={v}
                  commessa={c}
                  index={idx}
                  isSelected={selectedVaniBulk.includes(v.id)}
                  onToggleSelect={() => setSelectedVaniBulk(p => p.includes(v.id) ? p.filter(x => x !== v.id) : [...p, v.id])}
                  onClickEdit={() => { if (selectedVaniBulk.length > 0) { setSelectedVaniBulk(p => p.includes(v.id) ? p.filter(x => x !== v.id) : [...p, v.id]); return; } setSelectedVano(v); }}
                  onCalcPrezzo={(vv) => calcolaVanoPrezzo(vv, c)}
                />
              ))}
              <BulkEditBar
                selectedIds={selectedVaniBulk}
                totalVani={pwVani.length}
                onClearSelection={() => setSelectedVaniBulk([])}
                onSelectAll={() => setSelectedVaniBulk(pwVani.map(v => v.id))}
                onApply={(action, value) => {
                  const ids = selectedVaniBulk;
                  if (action === "elimina") {
                    pwVani.filter(v => ids.includes(v.id)).forEach(v => deleteVano(c.id, v.id));
                    setSelectedVaniBulk([]);
                    return;
                  }
                  if (action === "duplica") {
                    const toDup = pwVani.filter(v => ids.includes(v.id));
                    for (let i = 0; i < (value as number); i++) {
                      toDup.forEach(v => pwDuplicaVano(v, false));
                    }
                    setSelectedVaniBulk([]);
                    return;
                  }
                  ids.forEach(id => {
                    if (action === "sconto_perc") {
                      const vv = pwVani.find(x => x.id === id);
                      if (vv) {
                        const prezzoBase = calcolaVanoPrezzo(vv, c);
                        const nuovo = prezzoBase * (1 + (value / 100));
                        pwUpdVano(id, "prezzoManuale", Math.round(nuovo * 100) / 100);
                      }
                      return;
                    }
                    if (action === "note_append") {
                      const vv = pwVani.find(x => x.id === id);
                      const prev = vv?.note || "";
                      pwUpdVano(id, "note", prev ? prev + "\n" + value : value);
                      return;
                    }
                    if (action === "tapparella" || action === "persiana" || action === "zanzariera") {
                      const vv = pwVani.find(x => x.id === id);
                      const prevAcc = vv?.accessori || {};
                      pwUpdVano(id, "accessori", { ...prevAcc, [action]: value });
                      return;
                    }
                    pwUpdVano(id, action, value);
                  });
                }}
              />
              <div style={{ marginTop: 24, padding: "16px 0" }}>
                <button onClick={() => setPrevTab("fiscale")} style={{ width: "100%", padding: 18, borderRadius: 12, background: "#28A0A0", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(40,160,160,0.25)" }}>
                  Prossimo: Imposta fiscalità
                </button>
              </div>
            </div>
          )}

          {/* v77 · TAB FISCALE GUIDATO (mockup v3) */}
          {prevTab === "fiscale" && (() => {
            // ─── Setup variabili del pannello ───
            const destV77 = fiscDestV77 || (c.destImmobile === "seconda" ? "seconda" : "prima");
            const bonusV77 = c.detrazione || "50";  // "50" = Bonus Casa (default)
            // Aliquota effettiva in base a destinazione
            const aliquotaV77 = (() => {
              if (bonusV77 === "nessuna") return 0;
              if (bonusV77 === "75") return 75;
              return destV77 === "prima" ? 50 : 36;
            })();
            // Subtotali
            const subtotV77 = pwImponibile;
            const recuperoV77 = subtotV77 * aliquotaV77 / 100;
            const costoRealeV77 = pwTotale - recuperoV77;
            const perAnnoV77 = recuperoV77 / 10;
            const fmtV77 = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            // Uw limite per zona (DM 6 agosto 2020)
            const uwLimit: any = { "AB": 3.00, "C": 2.20, "D": 1.80, "E": 1.40, "F": 1.10 };
            const uwZonaLbl: any = { "AB": "A/B", "C": "C", "D": "D", "E": "E", "F": "F" };
            // Uw prodotto (dal primo vano, se esiste)
            const uwProd = (() => {
              const firstSystem = pwVani[0]?.sistema || "";
              const sysRec = sistemiDB.find((s: any) => (s.marca + " " + s.sistema) === firstSystem || s.sistema === firstSystem);
              return parseFloat(sysRec?.uw || "1.1");
            })();
            const uwOk = uwProd <= uwLimit[fiscZonaV77];

            // Checklist dinamica per bonus
            const checklistV77 = (() => {
              const base = [
                { id: "fatt", name: "Fattura parlante", sub: "Descrizione chiara + riferimento normativo", obblig: true },
                { id: "bon", name: "Ricevuta bonifico parlante", sub: "Causale con CF beneficiario + P.IVA fornitore", obblig: true },
                { id: "sched", name: "Scheda tecnica infissi", sub: "Uw, marcatura CE, vetro · dal produttore", obblig: true },
                { id: "ce", name: "Dichiarazione conformità CE", sub: "Prodotto serramenti · dal produttore", obblig: false },
                { id: "cat", name: "Dati catastali immobile", sub: "Foglio, particella, subalterno", obblig: false },
                { id: "cf", name: "Codice fiscale cliente", sub: "Copia tessera o documento identità", obblig: true },
                { id: "foto_pre", name: "Foto PRIMA della sostituzione", sub: "Prova stato vecchi infissi", obblig: false, consigl: true },
                { id: "foto_post", name: "Foto DOPO la posa", sub: "Prova installazione completata", obblig: false, consigl: true },
              ];
              if (bonusV77 === "65") {
                // Ecobonus aggiunge
                base.push({ id: "ape_ante", name: "APE ante operam", sub: "Attestato prestazione energetica pre-lavori", obblig: false, consigl: true } as any);
                base.push({ id: "ape_post", name: "APE post operam", sub: "Attestato prestazione energetica post-lavori", obblig: false, consigl: true } as any);
                base.push({ id: "ass", name: "Asseverazione tecnico", sub: "Firmata e timbrata · obbligatoria per Ecobonus", obblig: true } as any);
              }
              if (bonusV77 === "75") {
                base.push({ id: "rel", name: "Relazione tecnica asseverata", sub: "Conformità norme abbattimento barriere", obblig: true } as any);
              }
              return base;
            })();
            const checkSaved = c.checklistDocs || {};
            const nDone = checklistV77.filter((d: any) => checkSaved[d.id]).length;
            const pctDone = Math.round((nDone / checklistV77.length) * 100);

            // Causale bonifico pre-compilata
            const causaleV77 = (() => {
              const az = aziendaInfo || {};
              const nomeDitta = (az.ragioneSociale || az.nome || "DITTA").toUpperCase();
              const pivaDitta = az.piva || az.partitaIva || "P.IVA";
              const nomeCli = (c.cliente || "CLIENTE").toUpperCase();
              const cfCli = c.codiceFiscale || "CF CLIENTE";
              if (bonusV77 === "65") {
                return `Intervento di riqualificazione energetica ai sensi dell'art. 1, commi 344-347, Legge 296/2006 - Fattura n. [NUMERO] del [DATA] - Beneficiario detrazione: ${nomeCli} (CF: ${cfCli}) - Beneficiario pagamento: ${nomeDitta} (P.IVA: ${pivaDitta})`;
              }
              if (bonusV77 === "75") {
                return `Intervento superamento barriere architettoniche art. 119-ter DL 34/2020 - Fattura n. [NUMERO] del [DATA] - Beneficiario detrazione: ${nomeCli} (CF: ${cfCli}) - Beneficiario pagamento: ${nomeDitta} (P.IVA: ${pivaDitta})`;
              }
              return `Lavori di ristrutturazione edilizia ai sensi dell'art. 16-bis del DPR 917/1986 - Fattura n. [NUMERO] del [DATA] - Beneficiario detrazione: ${nomeCli} (CF: ${cfCli}) - Beneficiario pagamento: ${nomeDitta} (P.IVA: ${pivaDitta})`;
            })();

            // Template messaggi
            const tel = (c.telefono || "").replace(/\D/g, "");
            const waUrl = (msg: string) => `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
            const bonusLblV77: any = { "nessuna": "nessuna detrazione", "50": "Bonus Casa 50%", "65": "Ecobonus 50%", "75": "Barriere 75%" };
            const templates = [
              {
                id: "checklist",
                icon: "check",
                color: "blue",
                nome: "Checklist documenti richiesti",
                sub: "Tutti i documenti che servono per il bonus",
                msg: `Ciao ${c.cliente || ""}, per ottenere il ${bonusLblV77[bonusV77]} ti servono questi documenti da conservare per 10 anni:\n\n${checklistV77.filter((d: any) => d.obblig).map((d: any, i: number) => `${i + 1}. ${d.name}`).join("\n")}\n\nTi aggiorno appena abbiamo tutto. Grazie!`,
              },
              {
                id: "bonifico",
                icon: "euro",
                color: "violet",
                nome: "Istruzioni bonifico parlante",
                sub: "Causale pronta + passi per home banking",
                msg: `Ciao ${c.cliente || ""}, per non perdere la detrazione il bonifico DEVE essere \"parlante\". Nella tua home banking seleziona \"Bonifico per agevolazioni fiscali\" e copia ESATTAMENTE questa causale:\n\n${causaleV77}\n\nMi raccomando: importo esatto come in fattura. Conserva la ricevuta!`,
              },
              {
                id: "recupero",
                icon: "bolt",
                color: "green",
                nome: "Riepilogo detrazione recuperabile",
                sub: "Quanto risparmia il cliente",
                msg: `Ciao ${c.cliente || ""}, riepilogo economico del preventivo:\n\nTotale: € ${fmtV77(pwTotale)} IVA incl.\n${bonusLblV77[bonusV77]} recuperabile: € ${fmtV77(recuperoV77)} in 10 anni (€ ${fmtV77(perAnnoV77)}/anno)\nCosto reale per te: € ${fmtV77(costoRealeV77)}\n\nResto a disposizione per qualsiasi chiarimento.`,
              },
              {
                id: "promemoria",
                icon: "clock",
                color: "amber",
                nome: "Promemoria conservazione 10 anni",
                sub: "Agenzia Entrate può controllare fino al 2036",
                msg: `Ciao ${c.cliente || ""}, importante: l'Agenzia delle Entrate può richiedere i documenti del ${bonusLblV77[bonusV77]} fino a 10 anni dopo. Conserva in un unico luogo:\n\n- Fattura\n- Ricevuta bonifico parlante\n- Scheda tecnica infissi\n- Dichiarazione CE\n\nConsiglio: scansiona tutto e metti una copia in cloud. Gli scontrini termici sbiadiscono.`,
              },
              {
                id: "conferma",
                icon: "calendar",
                color: "pink",
                nome: "Conferma sopralluogo e data lavori",
                sub: "Comunicazione inizio lavori",
                msg: `Ciao ${c.cliente || ""}, confermo il sopralluogo e i dati del cantiere:\n\nIndirizzo: ${c.indirizzo || "[da confermare]"}\nCommessa: ${c.code}\n\nTi aggiorno a breve con la data definitiva dei lavori. Per qualsiasi modifica contattami.`,
              },
              {
                id: "catastali",
                icon: "user",
                color: "slate",
                nome: "Richiesta dati catastali",
                sub: "Foglio, particella, subalterno",
                msg: `Ciao ${c.cliente || ""}, per preparare la pratica mi servono i dati catastali dell'immobile. Li trovi sulla visura catastale o sull'atto di acquisto. Mi servono:\n\n- Foglio\n- Particella\n- Subalterno\n\nSe non li hai posso aiutarti a recuperarli. Grazie!`,
              },
            ];

            const setCheckDoc = (docId: string, val: boolean) => {
              const updated = { ...checkSaved, [docId]: val };
              updCM("checklistDocs", updated);
            };

            const tplColor: any = {
              blue: "linear-gradient(145deg, #85B7EB, #378ADD)",
              violet: "linear-gradient(145deg, #AFA9EC, #7F77DD)",
              green: "linear-gradient(145deg, #5DCAA5, #1D9E75)",
              amber: "linear-gradient(145deg, #FAC775, #EF9F27)",
              pink: "linear-gradient(145deg, #ED93B1, #D4537E)",
              slate: "linear-gradient(145deg, #8BA8A8, #5F7878)",
            };

            return (
              <div style={{ padding: "0 12px 20px", display: "flex", flexDirection: "column", gap: 13 }}>

                {/* ══════ SEZIONE 1: DESTINAZIONE IMMOBILE ══════ */}
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  Passo 1 &middot; Destinazione immobile
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: 14, border: "1px solid rgba(200,228,228,0.4)", boxShadow: "0 4px 14px rgba(13,31,31,0.05)" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0F2525", marginBottom: 5, letterSpacing: "-0.1px" }}>L'immobile è abitazione principale del cliente?</div>
                  <div style={{ fontSize: 10.5, color: "#5A7878", fontWeight: 600, marginBottom: 11, lineHeight: 1.4 }}>Decide l'aliquota: 50% (prima casa) o 36% (seconda/affitto/azienda)</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { k: "prima", big: "Prima casa", sub: "Residenza del cliente · detrazione 50%" },
                      { k: "seconda", big: "Seconda casa", sub: "Affitto, villeggiatura, aziendale · 36%" },
                    ].map((o: any) => {
                      const on = destV77 === o.k;
                      return (
                        <div key={o.k} onClick={() => { setFiscDestV77(o.k as any); updCM("destImmobile", o.k); }} style={{
                          padding: "13px 11px 11px", borderRadius: 13, cursor: "pointer",
                          border: on ? "1.5px solid #1D9E75" : "1.5px solid rgba(200,228,228,0.5)",
                          background: on ? "linear-gradient(145deg, rgba(93,202,165,0.1), rgba(29,158,117,0.04))" : "linear-gradient(145deg, #fff, #FAFCFC)",
                          boxShadow: on ? "0 5px 14px rgba(29,158,117,0.18)" : "none",
                          position: "relative",
                        }}>
                          {on && (
                            <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(145deg, #5DCAA5, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(29,158,117,0.4)" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                          <div style={{ fontSize: 15, fontWeight: 900, color: on ? "#04342C" : "#0F2525", letterSpacing: "-0.3px", lineHeight: 1.1 }}>{o.big}</div>
                          <div style={{ fontSize: 9.5, color: "#5A7878", fontWeight: 700, marginTop: 4, lineHeight: 1.35 }}>{o.sub}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ══════ SEZIONE 2: BONUS FISCALE ══════ */}
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L15.09 8.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
                  </div>
                  Passo 2 &middot; Bonus fiscale
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: 14, border: "1px solid rgba(200,228,228,0.4)", boxShadow: "0 4px 14px rgba(13,31,31,0.05)" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0F2525", marginBottom: 5, letterSpacing: "-0.1px" }}>Quale detrazione applichi?</div>
                  <div style={{ fontSize: 10.5, color: "#5A7878", fontWeight: 600, marginBottom: 11, lineHeight: 1.4 }}>Ogni bonus ha documenti diversi. Ti guido io, passo-passo.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                    {[
                      { k: "50", icoBg: "linear-gradient(145deg, #5DCAA5, #1D9E75)", nome: "Bonus Casa", perc: "50%", percBg: "rgba(29,158,117,0.14)", percCol: "#04342C", desc: "Ristrutturazione edilizia · art. 16-bis DPR 917/86 · scelta più comune, più semplice", stats: "MAX € 96.000 · 10 ANNI · NO LIMITI Uw" },
                      { k: "65", icoBg: "linear-gradient(145deg, #FAC775, #EF9F27)", nome: "Ecobonus", perc: "50%", percBg: "rgba(239,159,39,0.14)", percCol: "#854F0B", desc: "Risparmio energetico · L. 296/2006 · richiede Uw compatibile + ENEA obbligatoria", stats: "DETRAZIONE MAX € 60.000 · ENEA SÌ" },
                      { k: "75", icoBg: "linear-gradient(145deg, #AFA9EC, #7F77DD)", nome: "Barriere architettoniche", perc: "75%", percBg: "rgba(239,159,39,0.14)", percCol: "#854F0B", desc: "Art. 119-ter DL 34/2020 · richiede relazione tecnica asseverata", stats: "SOLO CONDOMINI 2026" },
                      { k: "nessuna", icoBg: "linear-gradient(145deg, #B8C5C5, #7A9090)", nome: "Nessuna detrazione", perc: "0%", percBg: "rgba(122,144,144,0.14)", percCol: "#3C4F4F", desc: "Cliente non vuole o non può · bonifico ordinario, nessuna pratica", stats: "" },
                    ].map((b: any) => {
                      const on = bonusV77 === b.k;
                      return (
                        <div key={b.k} onClick={() => updCM("detrazione", b.k)} style={{
                          padding: "13px 14px", borderRadius: 15, cursor: "pointer",
                          border: on ? "1.5px solid #1D9E75" : "1.5px solid rgba(200,228,228,0.5)",
                          background: on ? "linear-gradient(145deg, rgba(93,202,165,0.08), rgba(29,158,117,0.02))" : "#fff",
                          display: "flex", gap: 12, alignItems: "flex-start",
                          boxShadow: on ? "0 6px 16px rgba(29,158,117,0.15)" : "0 3px 8px rgba(13,31,31,0.04)",
                          position: "relative",
                        }}>
                          <div style={{ width: 44, height: 44, borderRadius: 13, background: b.icoBg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 1px 2px rgba(255,255,255,0.35)" }}>
                            {b.k === "50" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
                            {b.k === "65" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
                            {b.k === "75" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>}
                            {b.k === "nessuna" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.2px", display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" as any }}>
                              {b.nome}
                              <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 8px", borderRadius: 50, letterSpacing: "0.3px", background: b.percBg, color: b.percCol }}>{b.perc}</span>
                            </div>
                            <div style={{ fontSize: 10.5, color: "#5A7878", fontWeight: 600, marginTop: 3, lineHeight: 1.4 }}>{b.desc}</div>
                            {b.stats && <div style={{ fontSize: 9, color: "#5A7878", fontWeight: 800, letterSpacing: "0.3px", marginTop: 6 }}>{b.stats}</div>}
                          </div>
                          {on && (
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "linear-gradient(145deg, #5DCAA5, #1D9E75)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 5px rgba(29,158,117,0.4)" }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ══════ BOX RECUPERO ══════ */}
                {bonusV77 !== "nessuna" && recuperoV77 > 0 && (
                  <div style={{ background: "linear-gradient(155deg, #FFF7E6 0%, #FFE8C2 100%)", border: "1.5px solid rgba(239,159,39,0.3)", borderRadius: 16, padding: "13px 14px", display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(250,199,117,0.4), transparent 65%)", pointerEvents: "none" as any }} />
                    <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(145deg, #FAC775, #EF9F27)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(239,159,39,0.3), inset 0 1px 2px rgba(255,255,255,0.35)" }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <div style={{ flex: 1, position: "relative" }}>
                      <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "1px", textTransform: "uppercase" as any, color: "#854F0B", opacity: 0.85 }}>IL CLIENTE RECUPERA IN 10 ANNI</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#854F0B", letterSpacing: "-0.5px", lineHeight: 1.1, marginTop: 2 }}>€ {fmtV77(recuperoV77)}</div>
                      <div style={{ fontSize: 10, color: "#6A4810", fontWeight: 700, marginTop: 3, lineHeight: 1.35 }}>{aliquotaV77}% di € {fmtV77(subtotV77)} imponibile · € {fmtV77(perAnnoV77)}/anno per 10 anni</div>
                    </div>
                  </div>
                )}

                {/* ══════ WIDGET Uw (solo Ecobonus) ══════ */}
                {bonusV77 === "65" && (
                  <>
                    <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
                      </div>
                      Requisiti tecnici
                    </div>

                    <div style={{ background: "#fff", borderRadius: 16, padding: 14, border: "1px solid rgba(200,228,228,0.4)", boxShadow: "0 3px 10px rgba(13,31,31,0.04)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(145deg, rgba(55,138,221,0.2), rgba(55,138,221,0.08))", color: "#378ADD", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17.66 3.72l-5.29 8.05-3.62-1.57 1.57-3.62L18.38 1l-.72 2.72z"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.1px" }}>Trasmittanza Uw</div>
                          <div style={{ fontSize: 9.5, color: "#5A7878", fontWeight: 700, marginTop: 2 }}>Richiesta per Ecobonus · DM 6 agosto 2020</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 9.5, fontWeight: 800, color: "#4A6E6E", letterSpacing: "0.6px", marginBottom: 5 }}>ZONA CLIMATICA</div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 11 }}>
                        {(["AB", "C", "D", "E", "F"] as const).map(z => {
                          const on = fiscZonaV77 === z;
                          return (
                            <div key={z} onClick={() => setFiscZonaV77(z)} style={{
                              flex: 1, padding: "7px 4px", borderRadius: 8, textAlign: "center" as any,
                              fontSize: 10.5, fontWeight: 900,
                              color: on ? "#fff" : "#5A7878",
                              background: on ? "linear-gradient(145deg, #85B7EB, #378ADD)" : "#F4F8F8",
                              border: `1px solid ${on ? "#378ADD" : "rgba(200,228,228,0.4)"}`,
                              cursor: "pointer",
                              boxShadow: on ? "0 3px 8px rgba(55,138,221,0.3)" : "none",
                            }}>{uwZonaLbl[z]}</div>
                          );
                        })}
                      </div>
                      <div style={{ padding: "11px 12px", background: uwOk ? "rgba(29,158,117,0.08)" : "rgba(226,75,74,0.08)", border: `1.5px solid ${uwOk ? "rgba(29,158,117,0.3)" : "rgba(226,75,74,0.3)"}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: uwOk ? "linear-gradient(145deg, #5DCAA5, #1D9E75)" : "linear-gradient(145deg, #F09595, #E24B4A)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {uwOk
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                        </div>
                        <div style={{ flex: 1, fontSize: 10.5, color: uwOk ? "#04342C" : "#8B1A1A", fontWeight: 800, lineHeight: 1.4 }}>
                          <strong>{pwVani[0]?.sistema || "Sistema"} · Uw {uwProd.toFixed(1)}</strong><br/>
                          Richiesto ≤ {uwLimit[fiscZonaV77].toFixed(2)} per Zona {uwZonaLbl[fiscZonaV77]} · {uwOk ? "ampiamente conforme" : "NON CONFORME"}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ══════ CHECKLIST DOCUMENTI ══════ */}
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                  </div>
                  Documenti da raccogliere <span style={{ background: "rgba(29,158,117,0.14)", color: "#1D9E75", padding: "1px 7px", borderRadius: 50, fontSize: 9, fontWeight: 900, letterSpacing: "0.3px" }}>{nDone}/{checklistV77.length}</span>
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: 14, border: "1px solid rgba(200,228,228,0.4)", boxShadow: "0 4px 14px rgba(13,31,31,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.1px" }}>Checklist {bonusLblV77[bonusV77]}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 60, height: 6, background: "rgba(200,228,228,0.5)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pctDone}%`, background: "linear-gradient(90deg, #5DCAA5, #1D9E75)", borderRadius: 3, boxShadow: "0 0 6px rgba(29,158,117,0.4)" }} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#1D9E75", letterSpacing: "0.3px" }}>{nDone}/{checklistV77.length}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>Conservare tutto per 10 anni · L'Agenzia delle Entrate può chiederli fino al {new Date().getFullYear() + 10}</div>

                  {checklistV77.map((d: any) => {
                    const isDone = !!checkSaved[d.id];
                    return (
                      <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: "1px solid rgba(200,228,228,0.3)" }}>
                        <div onClick={() => setCheckDoc(d.id, !isDone)} style={{
                          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: isDone ? "1.5px solid #1D9E75" : "1.5px solid rgba(200,228,228,0.6)",
                          background: isDone ? "linear-gradient(145deg, #5DCAA5, #1D9E75)" : "#fff",
                          cursor: "pointer",
                          boxShadow: isDone ? "0 3px 7px rgba(29,158,117,0.3)" : "none",
                        }}>
                          {isDone
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C8D4D4" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/></svg>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: "#0F2525", letterSpacing: "-0.05px" }}>
                            {d.name}
                            {d.obblig && <span style={{ display: "inline-block", background: "rgba(226,75,74,0.12)", color: "#8B1A1A", fontSize: 8.5, fontWeight: 900, padding: "1px 6px", borderRadius: 4, letterSpacing: "0.3px", marginLeft: 5, verticalAlign: 1 }}>OBBLIG</span>}
                            {d.consigl && <span style={{ display: "inline-block", background: "rgba(239,159,39,0.12)", color: "#854F0B", fontSize: 8.5, fontWeight: 900, padding: "1px 6px", borderRadius: 4, letterSpacing: "0.3px", marginLeft: 5, verticalAlign: 1 }}>CONSIGL</span>}
                          </div>
                          <div style={{ fontSize: 9.5, color: "#5A7878", fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{d.sub}</div>
                        </div>
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <div onClick={() => { try { (fotoInputRef as any).current?.click(); } catch (e) {} }} style={{
                            width: 28, height: 28, borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            background: isDone ? "rgba(29,158,117,0.1)" : "rgba(200,228,228,0.25)",
                            color: isDone ? "#1D9E75" : "#4A6E6E",
                            border: `1px solid ${isDone ? "rgba(29,158,117,0.3)" : "rgba(200,228,228,0.4)"}`,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                          </div>
                          <div onClick={() => { try { (fileInputRef as any).current?.click(); } catch (e) {} }} style={{
                            width: 28, height: 28, borderRadius: 8,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            background: isDone ? "rgba(29,158,117,0.1)" : "rgba(200,228,228,0.25)",
                            color: isDone ? "#1D9E75" : "#4A6E6E",
                            border: `1px solid ${isDone ? "rgba(29,158,117,0.3)" : "rgba(200,228,228,0.4)"}`,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ══════ CAUSALE BONIFICO ══════ */}
                {bonusV77 !== "nessuna" && (<>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    </div>
                    Causale bonifico parlante
                  </div>

                  <div style={{ background: "linear-gradient(155deg, #F7FAF9 0%, #EAF2F0 100%)", borderRadius: 16, padding: 14, border: "1px solid rgba(200,228,228,0.5)" }}>
                    <div style={{ fontSize: 11.5, color: "#0F2525", fontWeight: 800, lineHeight: 1.4 }}>Questa è la causale che il cliente deve copiare <strong>ESATTAMENTE</strong> nel bonifico, altrimenti rischia di perdere la detrazione.</div>
                    <div style={{ background: "#0F2525", color: "#AEE9E9", padding: "12px 14px", borderRadius: 11, fontFamily: "SF Mono, Monaco, Consolas, monospace", fontSize: 10.5, lineHeight: 1.55, marginTop: 10, fontWeight: 500, letterSpacing: "0.1px" }}>{causaleV77}</div>
                    <button onClick={() => {
                      navigator.clipboard?.writeText(causaleV77).then(() => {
                        setFiscCopied("causale"); setTimeout(() => setFiscCopied(null), 2500);
                      }).catch(() => { setFiscCopied("causale"); setTimeout(() => setFiscCopied(null), 2500); });
                    }} style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      width: "100%", padding: 11,
                      background: fiscCopied === "causale" ? "#1D9E75" : "#0F2525",
                      color: "#fff", borderRadius: 11, fontSize: 11.5, fontWeight: 900, marginTop: 10, cursor: "pointer", letterSpacing: "0.3px", border: "none", fontFamily: "inherit",
                      boxShadow: "0 5px 12px rgba(15,37,37,0.25)",
                    }}>
                      {fiscCopied === "causale"
                        ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> COPIATO!</>
                        : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> COPIA CAUSALE PER IL CLIENTE</>}
                    </button>
                  </div>
                </>)}

                {/* ══════ TEMPLATE MESSAGGI ══════ */}
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  Messaggi pronti per il cliente
                </div>

                <div style={{ background: "#fff", borderRadius: 18, padding: 14, border: "1px solid rgba(200,228,228,0.4)", boxShadow: "0 4px 14px rgba(13,31,31,0.05)" }}>
                  <div style={{ fontSize: 10.5, color: "#5A7878", fontWeight: 600, marginBottom: 12, lineHeight: 1.4 }}>Testi già preparati, con dati commessa pre-compilati. Tap per inviare su WhatsApp.</div>

                  {templates.map((tpl: any) => (
                    <div key={tpl.id} onClick={() => {
                      if (!tel) { alert("Numero telefono cliente mancante"); return; }
                      window.open(waUrl(tpl.msg), "_blank");
                    }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 0", borderBottom: "1px solid rgba(200,228,228,0.3)", cursor: "pointer" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: tplColor[tpl.color], boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)" }}>
                        {tpl.icon === "check" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
                        {tpl.icon === "euro" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
                        {tpl.icon === "bolt" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                        {tpl.icon === "clock" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                        {tpl.icon === "calendar" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/></svg>}
                        {tpl.icon === "user" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.1px" }}>{tpl.nome}</div>
                        <div style={{ fontSize: 10, color: "#5A7878", fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{tpl.sub}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", background: "linear-gradient(145deg, rgba(37,211,102,0.14), rgba(27,160,80,0.05))", border: "1px solid rgba(37,211,102,0.3)", color: "#1BA050", borderRadius: 50, fontSize: 9.5, fontWeight: 900, letterSpacing: "0.3px", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#1BA050"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5z"/></svg>
                        INVIA
                      </div>
                    </div>
                  ))}
                </div>

                {/* ══════ PRATICA ENEA ══════ */}
                {bonusV77 !== "nessuna" && (<>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: "#4A6E6E", letterSpacing: "1.3px", textTransform: "uppercase" as any, padding: "4px 6px 0", display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "linear-gradient(145deg, rgba(93,202,165,0.28), rgba(29,158,117,0.14))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/></svg>
                    </div>
                    Pratica ENEA
                  </div>

                  <div style={{ background: "linear-gradient(155deg, #1E8080 0%, #0F5555 100%)", borderRadius: 20, padding: 18, color: "#fff", boxShadow: "0 14px 32px rgba(15,68,68,0.3)", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: -40, right: -30, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(95,208,208,0.25), transparent 65%)", pointerEvents: "none" as any }} />
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", background: "rgba(255,255,255,0.2)", borderRadius: 50, fontSize: 9, fontWeight: 900, letterSpacing: "1.1px", textTransform: "uppercase" as any, position: "relative" }}>
                      {bonusV77 === "65" ? "OBBLIGATORIA ENTRO 90 GG" : "NON OBBLIGATORIA PER " + bonusLblV77[bonusV77].toUpperCase()}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, marginTop: 10, letterSpacing: "-0.4px", lineHeight: 1.15, position: "relative", textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}>
                      {bonusV77 === "65" ? "ENEA è obbligatoria" : "ENEA qui è consigliata, non dovuta"}
                    </div>
                    <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 6, fontWeight: 500, lineHeight: 1.4, position: "relative" }}>
                      {bonusV77 === "65"
                        ? "Per Ecobonus va inviata entro 90 giorni dalla fine lavori, pena decadenza della detrazione."
                        : `Hai scelto ${bonusLblV77[bonusV77]}. Prepariamo comunque la scheda: se cambi idea, è pronta.`}
                    </div>
                    <button style={{ marginTop: 14, width: "100%", padding: 14, background: "#fff", color: "#0F5555", border: "none", borderRadius: 14, fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, letterSpacing: "0.3px", boxShadow: "0 6px 14px rgba(0,0,0,0.2), inset 0 -2px 0 rgba(15,85,85,0.08)", position: "relative" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      PREPARA SCHEDA ENEA PDF
                    </button>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, padding: "10px 11px", background: "rgba(0,0,0,0.25)", borderRadius: 10, position: "relative" }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      </div>
                      <div style={{ fontSize: 10, lineHeight: 1.4, fontWeight: 600, opacity: 0.92 }}>Il cliente carica la pratica su <strong>bonusfiscali.enea.it</strong> solo con SPID o CIE. Nessun documento va caricato, solo la scheda descrittiva.</div>
                    </div>
                  </div>
                </>)}

                {/* ══════ TOTALE + COSTO REALE ══════ */}
                <div style={{ background: "linear-gradient(155deg, #8FE5C5 0%, #1D9E75 55%, #0F7A58 100%)", borderRadius: 24, padding: 18, color: "#fff", boxShadow: "0 18px 40px rgba(15,122,88,0.35)", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent 65%)", pointerEvents: "none" as any }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 11, position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700 }}><span>Imponibile</span> <span>€ {fmtV77(subtotV77)}</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, opacity: 0.75 }}><span>+ IVA {pwIvaDefault}%</span> <span>€ {fmtV77(pwIvaCalc)}</span></div>
                    <div style={{ height: 1, background: "rgba(255,255,255,0.22)", margin: "4px 0" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", position: "relative", paddingTop: 4 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: "0.5px", textTransform: "uppercase" as any, opacity: 0.92 }}>Totale IVA incl.</div>
                    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.9px", textShadow: "0 2px 6px rgba(0,0,0,0.18)" }}>€ {fmtV77(pwTotale)}</div>
                  </div>
                  {bonusV77 !== "nessuna" && recuperoV77 > 0 && (
                    <div style={{ marginTop: 11, padding: "11px 13px", background: "rgba(255,255,255,0.2)", borderRadius: 13, position: "relative", display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.88, letterSpacing: "0.3px", textTransform: "uppercase" as any }}>Costo reale per il cliente</div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.9, marginTop: 2, lineHeight: 1.3 }}><strong style={{ fontWeight: 900, fontSize: 14.5 }}>€ {fmtV77(costoRealeV77)}</strong> dopo bonus {aliquotaV77}% in 10 anni</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* NAV BOTTOM */}
                <div style={{ display: "flex", gap: 8, padding: "10px 0 8px" }}>
                  <button onClick={() => setPrevTab("sopralluogo")} style={{ padding: 14, borderRadius: 12, background: "#fff", color: "#4A6E6E", border: "1px solid rgba(200,228,228,0.5)", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", minWidth: 90 }}>
                    Indietro
                  </button>
                  <button onClick={() => setPrevTab("condizioni")} style={{ flex: 1, padding: 14, borderRadius: 12, background: "linear-gradient(145deg, #1D9E75, #0F7A58)", color: "#fff", border: "none", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 14px rgba(15,122,88,0.3), inset 0 -2px 0 rgba(0,0,0,0.08)", letterSpacing: "0.3px" }}>
                    Prossimo: Condizioni →
                  </button>
                </div>

              </div>
            );
          })()}

          {/*  TAB CONDIZIONI (pagamento · consegna · garanzia)  */}
          {prevTab === "condizioni" && (
            <div style={{ padding: "0 12px 20px" }}>
              {/* CARD PAGAMENTO */}
              <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 16, marginBottom: 12, boxShadow: "0 2px 10px rgba(40,160,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(40,160,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ICO.euro} s={14} c="#28A0A0" /></div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F" }}>Modalit+ di pagamento</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                  {[
                    { id: "30-70", l: "30% + 70%", d: "Acconto 30% · saldo a consegna" },
                    { id: "50-50", l: "50% + 50%", d: "Acconto 50% · saldo a consegna" },
                    { id: "30-40-30", l: "30+40+30", d: "Acconto · produzione · saldo" },
                    { id: "unico", l: "Pagamento unico", d: "100% a consegna" },
                  ].map(p => (
                    <div key={p.id} onClick={() => updCM("condPagamento", p.id)} style={{
                      padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                      background: c.condPagamento === p.id ? `${T.acc}15` : T.card,
                      border: `1.5px solid ${c.condPagamento === p.id ? T.acc : T.bdr}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: c.condPagamento === p.id ? T.acc : T.text }}>{p.l}</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{p.d}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 4 }}>METODO</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as any }}>
                    {["Bonifico", "Assegno", "Contanti", "POS"].map(m => (
                      <div key={m} onClick={() => updCM("metodoPag", m)} style={{
                        padding: "7px 12px", borderRadius: 20, cursor: "pointer",
                        background: c.metodoPag === m ? T.acc : T.card,
                        border: `1.5px solid ${c.metodoPag === m ? T.acc : T.bdr}`,
                        color: c.metodoPag === m ? "#fff" : T.text,
                        fontSize: 11, fontWeight: 700,
                      }}>{m}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CARD CONSEGNA */}
              <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 16, marginBottom: 12, boxShadow: "0 2px 10px rgba(40,160,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(123,107,165,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ICO.package} s={14} c="#7B6BA5" /></div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F" }}>Tempi di consegna</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {["30gg", "45gg", "60gg", "90gg"].map(t => (
                    <div key={t} onClick={() => updCM("tempiConsegna", t)} style={{
                      padding: "12px 4px", borderRadius: 10, cursor: "pointer", textAlign: "center" as any,
                      background: c.tempiConsegna === t ? "#7B6BA5" : T.card,
                      border: `1.5px solid ${c.tempiConsegna === t ? "#7B6BA5" : T.bdr}`,
                      color: c.tempiConsegna === t ? "#fff" : T.text,
                      fontSize: 13, fontWeight: 800,
                    }}>{t}</div>
                  ))}
                </div>
              </div>

              {/* CARD GARANZIA */}
              <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 16, marginBottom: 12, boxShadow: "0 2px 10px rgba(40,160,160,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}><I d={ICO.shieldCheck} s={14} c="#10B981" /></div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F" }}>Garanzia</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {["2 anni", "5 anni", "10 anni", "15 anni"].map(g => (
                    <div key={g} onClick={() => updCM("garanzia", g)} style={{
                      padding: "12px 4px", borderRadius: 10, cursor: "pointer", textAlign: "center" as any,
                      background: c.garanzia === g ? "#10B981" : T.card,
                      border: `1.5px solid ${c.garanzia === g ? "#10B981" : T.bdr}`,
                      color: c.garanzia === g ? "#fff" : T.text,
                      fontSize: 12, fontWeight: 800,
                    }}>{g}</div>
                  ))}
                </div>
              </div>

              {/* NOTE */}
              <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: 16, boxShadow: "0 2px 10px rgba(40,160,160,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, letterSpacing: "0.5px", marginBottom: 6 }}>NOTE PREVENTIVO (visibili al cliente)</div>
                <textarea value={c.notePreventivo || ""} onChange={e => updCM("notePreventivo", e.target.value)} placeholder="Es. Prezzo comprensivo di posa in opera standard. Lavori supplementari da concordare." style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: "inherit", resize: "vertical" as any, boxSizing: "border-box" as any }} />
              </div>
              <div style={{ marginTop: 24, padding: "16px 0", display: "flex", gap: 8 }}>
                <button onClick={() => setPrevTab("fiscale")} style={{ padding: 18, borderRadius: 12, background: "#fff", color: "#6A8484", border: "1px solid #C8E4E4", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", minWidth: 90 }}>
                  Indietro
                </button>
                <button onClick={() => setPrevTab("riepilogo")} style={{ flex: 1, padding: 18, borderRadius: 12, background: "#28A0A0", color: "#fff", border: "none", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 12px rgba(40,160,160,0.25)" }}>
                  Prossimo: Vedi riepilogo
                </button>
              </div>
            </div>
          )}

          {/*  TAB RIEPILOGO  */}
          {prevTab === "riepilogo" && (
            <div style={{ padding: "0 12px 20px", background: "#EEF8F8", minHeight: "100%" }}>
              <div style={{ background: "linear-gradient(135deg, #0D1F1F 0%, #143636 100%)", borderRadius: 14, padding: 18, marginBottom: 10, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 10, color: "#ffffff60" }}>PREVENTIVO</div><div style={{ fontSize: 26, fontWeight: 900, marginTop: 2 }}>€{pwFmt(pwTotale)}</div></div>
                  {pwDetrObj && pwDetrObj.perc > 0 && (<div style={{ background: "#28A0A030", borderRadius: 8, padding: "6px 10px", textAlign: "right" as any, border: "1px solid #28A0A060" }}><div style={{ fontSize: 9, color: "#ffffffa0", fontWeight: 700 }}>{pwDetrObj.l}</div><div style={{ fontSize: 14, fontWeight: 900, color: "#7FE5E5" }}>−€{pwFmt(pwDetraibile)}</div></div>)}
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
                    <div style={{ fontSize: 9, color: T.sub }}>{v.tipo} · {lv}{hv} · {v.pezzi || 1}pz · {v.colore || "B."} · {v.vetro || "Std"}{v.controtelaio && v.controtelaio !== "Nessuno" ? ` · CT: ${v.controtelaio}` : ""}{ac.tapparella?.attivo ? ` · Tapp. ${ac.tapparella.tipo || ""}` : ""}{ac.persiana?.attivo ? ` · Pers. ${ac.persiana.tipo || ""}` : ""}{ac.zanzariera?.attivo ? ` · Zanz. ${ac.zanzariera.tipo || ""}` : ""}{v.coprifilo ? ` · CF: ${v.coprifilo}` : ""}{v.soglia ? ` · Soglia: ${v.soglia}` : ""}</div>
                  </div>
                );
              })}

              {pwVociLibere.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>LAVORI</div>
                {pwVociLibere.map((vl, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}><span>{vl.desc} <span style={{ color: T.sub, fontSize: 9 }}>{vl.qta || 1}</span></span><span style={{ fontWeight: 700 }}>€{pwFmt((vl.importo || 0) * (vl.qta || 1))}</span></div>))}</>)}

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
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "8px 10px", background: "#28A0A010", borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#28A0A0" }}><I d={ICO.building} /> {pwDetrObj.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: "#28A0A0" }}>-€{pwFmt(pwDetraibile)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Costo effettivo</span>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>€{pwFmt(pwTotale - pwDetraibile)}</span>
                  </div>
                </>)}
              </div>

              {c.notePreventivo && (
                <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 10, fontSize: 10, color: T.sub, lineHeight: 1.8 }}>
                  <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>NOTE</div>
                  <div style={{ whiteSpace: "pre-wrap" as any }}>{c.notePreventivo}</div>
                </div>
              )}

              {/* SCHEDE COMMERCIALI */}
              <div style={{ marginTop: 14, background: T.card, borderRadius: 12, padding: 14, border: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#28A0A0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>SCHEDE COMMERCIALI</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div onClick={() => alert("Scheda tecnica in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Scheda tecnica</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Tutti i vani in 1 PDF</div>
                  </div>
                  <div onClick={() => alert("Simulazione fiscale in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Simulazione fiscale</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Risparmio detrazione</div>
                  </div>
                  <div onClick={() => alert("Tempi e garanzie in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Tempi e garanzie</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Consegna + posa + gar.</div>
                  </div>
                  <div onClick={() => alert("Condizioni in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Condizioni</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Pagamento e accordi</div>
                  </div>
                </div>
              </div>
              {/* SCHEDE TECNICHE */}
              <div style={{ marginTop: 10, background: T.card, borderRadius: 12, padding: 14, border: `1px solid ${T.bdr}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#28A0A0", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>SCHEDE TECNICHE DETTAGLIATE</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div onClick={() => alert("Trasmittanze in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Trasmittanze</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Uw / Ug / Uf per vano</div>
                  </div>
                  <div onClick={() => alert("Profilo in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Profilo</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Sezioni e camere</div>
                  </div>
                  <div onClick={() => alert("Vetro in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Vetro</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Stratigrafia e gas</div>
                  </div>
                  <div onClick={() => alert("Disegni in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Disegni tecnici</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>CAD per ogni vano</div>
                  </div>
                  <div onClick={() => alert("Accessori in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Accessori</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>Tapp./zanz./pers.</div>
                  </div>
                  <div onClick={() => alert("Certificazioni in arrivo")} style={{ padding: 12, border: "1px solid #C8E4E4", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "#fff" }}>
                    <div style={{ fontWeight: 700, color: "#0D1F1F" }}>Certificazioni</div>
                    <div style={{ color: "#6A8484", fontSize: 10, marginTop: 2 }}>CE acustico/termico</div>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", gap: 8, marginBottom: 8 }}>
                <button disabled={!!pdfBusy} onClick={async () => {
                  if (pdfBusy) return;
                  setPdfBusy("pdf");
                  try {
                    await Promise.race([
                      generaPreventivoPDF(c, { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [], calcolaVanoPrezzo, getVaniAttivi }),
                      new Promise((_r, rej) => setTimeout(() => rej(new Error("Timeout (20s)")), 20000)),
                    ]);
                  } catch(err: any) {
                    console.error("[PDF]", err);
                    alert("Errore generazione PDF: " + (err?.message || err));
                  } finally {
                    setPdfBusy(null);
                  }
                }} style={{ flex: 1, padding: 14, borderRadius: 10, background: pdfBusy === "pdf" ? "#28A0A018" : "#fff", color: "#28A0A0", border: "1px solid #C8E4E4", fontSize: 13, fontWeight: 800, cursor: pdfBusy ? "wait" : "pointer", fontFamily: "inherit", opacity: pdfBusy && pdfBusy !== "pdf" ? 0.5 : 1 }}>{pdfBusy === "pdf" ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid #28A0A0", borderTopColor: "transparent", borderRadius: "50%", animation: "mastrospin 0.8s linear infinite", marginRight: 6, verticalAlign: "middle" }} /> Generazione...</> : <><I d={ICO.fileText} /> PDF</>}</button>
                <button disabled={!!pdfBusy} onClick={async () => {
                  if (pdfBusy) return;
                  setPdfBusy("anteprima");
                  try {
                    await Promise.race([
                      generaPreventivoCondivisibile(c, { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [], calcolaVanoPrezzo, getVaniAttivi }),
                      new Promise((_r, rej) => setTimeout(() => rej(new Error("Timeout (20s)")), 20000)),
                    ]);
                  } catch(err: any) {
                    console.error("[Anteprima]", err);
                    alert("Errore Anteprima: " + (err?.message || err));
                  } finally {
                    setPdfBusy(null);
                  }
                }} style={{ flex: 1, padding: 14, borderRadius: 10, background: pdfBusy === "anteprima" ? "#28A0A018" : T.card, color: T.sub, border: `1.5px solid ${T.bdr}`, fontSize: 13, fontWeight: 800, cursor: pdfBusy ? "wait" : "pointer", fontFamily: "inherit", opacity: pdfBusy && pdfBusy !== "anteprima" ? 0.5 : 1 }}>{pdfBusy === "anteprima" ? <><span style={{ display: "inline-block", width: 12, height: 12, border: "2px solid " + T.sub, borderTopColor: "transparent", borderRadius: "50%", animation: "mastrospin 0.8s linear infinite", marginRight: 6, verticalAlign: "middle" }} /> Generazione...</> : <><I d={ICO.eye} /> Anteprima</>}</button>
              </div>
              <button disabled={!!pdfBusy} onClick={async () => {
                if (pdfBusy) return;
                setPdfBusy("invia");
                try {
                  // 1. Genera PDF con timeout 20s
                  try {
                    await Promise.race([
                      generaPreventivoPDF(c, { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [], calcolaVanoPrezzo, getVaniAttivi }),
                      new Promise((_r, rej) => setTimeout(() => rej(new Error("Timeout PDF (20s)")), 20000)),
                    ]);
                  } catch(e: any) {
                    console.error("[PDF fail]", e);
                    alert("Generazione PDF non riuscita: " + (e?.message || e) + "\n\nIl preventivo viene comunque inviato senza allegato.");
                  }

                  // 2. Segna inviato (in stato locale)
                  try {
                    setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoInviato: true, dataPreventivoInvio: new Date().toISOString().split("T")[0] } : cm));
                    setSelectedCM((prev: any) => prev ? ({ ...prev, preventivoInviato: true, dataPreventivoInvio: new Date().toISOString().split("T")[0] }) : prev);
                  } catch(e) { console.error("[setCantieri fail]", e); }

                  // 3. Genera link pubblico (non bloccante, timeout 8s)
                  let linkPubblico = "";
                  try {
                    const snapshot = {
                      cliente: (c.cliente || "") + (c.cognome ? " " + c.cognome : ""),
                      totale: (c.totalePreventivo || (typeof calcolaTotaleCommessa === "function" ? calcolaTotaleCommessa(c) : 0)) || 0,
                      vani: ((typeof getVaniAttivi === "function" ? getVaniAttivi(c) : (c.vani || [])) || []).map((v: any, i: number) => ({
                        nome: v.nome || v.tipo || "Vano " + (i+1),
                        tipo: v.tipo,
                        misure: (v.misure?.lCentro || v.larghezza || 0) + "x" + (v.misure?.hCentro || v.altezza || 0),
                        prezzo: (typeof calcolaVanoPrezzo === "function" ? calcolaVanoPrezzo(v, c) : 0) || 0,
                      })),
                      azienda: { ragione: aziendaInfo?.ragione || aziendaInfo?.nome, telefono: aziendaInfo?.telefono },
                    };
                    const ctrl = new AbortController();
                    const t = setTimeout(() => ctrl.abort(), 8000);
                    const r = await fetch("/api/preventivo-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cm_id: c.id, cm_code: c.code, snapshot, azienda_id: aziendaInfo?.id }), signal: ctrl.signal });
                    clearTimeout(t);
                    if (r.ok) { const d = await r.json(); linkPubblico = window.location.origin + d.url; }
                  } catch(e) { console.error("[link fail]", e); }

                  // 4. Apri modal SEMPRE
                  const nome = c.cliente || "";
                  const tel = (c.telefono || "").replace(/[^0-9+]/g, "");
                  setShowSendModal({ link: linkPubblico, nome, tel, email: c.email || "", code: c.code || "" });
                } finally {
                  setPdfBusy(null);
                }
              }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: pdfBusy === "invia" ? "#0D1F1F" : "linear-gradient(135deg, #0D1F1F 0%, #28A0A0 100%)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: pdfBusy ? "wait" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(40,160,160,0.25)", opacity: pdfBusy && pdfBusy !== "invia" ? 0.5 : 1 }}>{pdfBusy === "invia" ? <><span style={{ display: "inline-block", width: 14, height: 14, border: "2.5px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "mastrospin 0.8s linear infinite", marginRight: 8, verticalAlign: "middle" }} /> Generazione PDF e link...</> : <><I d={ICO.upload} /> INVIA PREVENTIVO AL CLIENTE {"->"}</>}</button>
              <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>Invia PDF via WhatsApp. La firma verrà richiesta solo dopo la conferma del cliente.</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                <span onClick={() => { updCM("preventivoInviato", true); setCcDone("✓ Completato"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000); }} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>✓ Segna completato</span>
              </div>

              {/*  FASCICOLO GEOMETRA  */}
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.bdr}`, paddingTop: 14 }}>
                <button
                  onClick={async () => {
                    setShowFascicoloModal(true);
                    setFascicoloStep("idle");
                    setFascicoloLink(null);
                    const storico = await getFascicoliCommessa(c.id);
                    setFascicoliStorico(storico);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid #28A0A0", background: "#fff", color: "#0D1F1F", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <span style={{ fontSize: 16 }}><I d={ICO.ruler} /></span> Documenti tecnici commessa
                </button>
                <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>PDF tecnico Uw · Link cliente firma · Excel pratica ENEA</div>
              </div>
              {/* Avanti dopo invio · solo se non ancora confermato */}
              {c.preventivoInviato && faseIndex(c.fase) < faseIndex("conferma") && (() => {
                const accettato = rispostaCliente?.risposta === "accettato";
                return (
                  <div style={{ marginTop: 8 }}>
                    {accettato && (
                      <div style={{ background: "linear-gradient(135deg, #DDF5E6 0%, #C8EBD3 100%)", border: "1px solid #28A268", borderRadius: 12, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ fontSize: 22 }}>✓</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0E5E33", letterSpacing: 0.3 }}>CLIENTE HA ACCETTATO</div>
                          <div style={{ fontSize: 10, color: "#0E5E33", opacity: 0.85, marginTop: 1 }}>{rispostaCliente?.risposta_at ? new Date(rispostaCliente.risposta_at).toLocaleString("it-IT") : ""}{rispostaCliente?.risposta_ip ? " · IP " + rispostaCliente.risposta_ip : ""}</div>
                        </div>
                      </div>
                    )}
                    <button onClick={() => { setFaseTo(c.id, "conferma"); setPrevWorkspace(false); setCcDone(null); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: accettato ? "linear-gradient(135deg, #28A268 0%, #1F8050 100%)" : T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: accettato ? "0 4px 14px rgba(40,162,104,0.35)" : undefined, animation: accettato ? "mastropulse 1.6s infinite" : undefined }}><I d={ICO.edit} /> {accettato ? "→ CREA CONFERMA D’ORDINE" : "€+ AVANTI → Conferma ordine"}</button>
                  </div>
                );
              })()}
              {ccDone && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#28A0A018", border: "1px solid #28A0A040", fontSize: 12, fontWeight: 700, color: "#28A0A0", textAlign: "center" }}>{ccDone}</div>}
            </div>
          )}

          {/*  TAB IMPORTA (da competitor / documento)  */}
          {prevTab === "cad" && (
            <div style={{ padding: 16 }}>
              <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓+</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>Disegnatore tecnico</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 16, lineHeight: 1.6 }}>
                  Disegna profili, telai, forme libere direttamente sul tablet.<br/>
                  Ogni linea diventa un profilo serramentistico con quote automatiche.
                </div>
                <button
                  onClick={() => setShowCadDraw(true)}
                  style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  ✓+ Apri disegnatore
                </button>
                {c.cadData && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#28A0A012", borderRadius: 10, border: "1px solid #28A0A030" }}>
                    <div style={{ fontSize: 11, color: "#28A0A0", fontWeight: 700 }}>
                      ✓ {c.cadData.oggetti?.length || 0} elementi disegnati
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {prevTab === "importa" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ padding: 16, background: `${T.blue}08`, borderRadius: 12, marginBottom: 12, border: `1px solid ${T.blue}20` }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.blue, marginBottom: 4 }}><I d={ICO.download} /> Importa preventivo competitor</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>Scansiona o carica il preventivo di un competitor. MASTRO rilever+ automaticamente misure, colori, tipologie, coprifili e creer+ un preventivo da rivedere.</div>
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
                    { icon: "📐", t: "Misure", d: "Larghezza  altezza per ogni vano" },
                    { icon: "🎵", t: "Colori", d: "Bianco, Antracite, Rovere, ecc." },
                    { icon: "?", t: "Tipologie", d: "F2A, PF2A, Scorrevole, ecc." },
                    { icon: "", t: "Controtelai", d: "Standard, Monoblocco" },
                    { icon: "🏭", t: "Accessori", d: "Tapparelle, persiane, zanzariere" },
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

          {/* FAB · navigate sections · GRANDE con menu espandibile */}
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
    // Compatibilit+ wizard vecchio
    const viste = []; // non più usato con nuova arch
    const vaniM: number[] = [];
    const vaniA = vaniList;
    const tipoRil = r?.tipo || "rilievo";
    const tipoColRil = tipoRil === "definitiva" ? T.grn : tipoRil === "modifica" ? T.orange : T.blue;
    const tipoIcoRil = tipoRil === "definitiva" ? "checkCircle" : tipoRil === "modifica" ? "wrench" : "mapPin";
    const tipoLblRil = tipoRil === "definitiva" ? "Misure Definitive" : tipoRil === "modifica" ? "Modifica" : "Rilievo Misure";

    // Calcolo avanzamento misure
    const vaniMisurati = vaniList.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6);
    const vaniBloccati = vaniList.filter(v => v.note?.startsWith("+ BLOCCATO"));
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
          {/* STEP 1 · Tipo visita */}
          {nvStep === 1 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}><I d={ICO.tag} /> Tipo di visita</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Seleziona il tipo di sopralluogo</div>
            {[
              { k: "rilievo",    ico: <I d={ICO.ruler} />, label: "Rilievo misure",     desc: "Prima visita o misure di vani mancanti" },
              { k: "definitiva", ico: "✓", label: "Misure definitive",  desc: "Conferma finale di tutte le misure" },
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
          {/* STEP 2 · Dati */}
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
          {/* STEP 2 · Vani misurati */}
          {nvStep === 3 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>✓ Vani misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Seleziona i vani che hai misurato</div>
            {vaniA.length === 0
              ? <div style={{ textAlign: "center", padding: "20px", color: T.sub }}>Tutti gi+ misurati!</div>
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
          {/* STEP 4 · Vani bloccati */}
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
          {/* STEP 5 · Riepilogo */}
          {nvStep === 5 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}><I d={ICO.clipboard} /> Riepilogo</div>
            <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.sub }}><I d={ICO.calendar} /> {nvData.data ? new Date(nvData.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : "·"} · <I d={ICO.clock} /> {nvData.ora || "--:--"}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}><I d={ICO.user} /> {nvData.rilevatore || "Non specificato"}</div>
            </div>
            {nvVani.length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.grn}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.grn, marginBottom: 7 }}>✓ Misurati</div>
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
                  return <div key={id} style={{ fontSize: 11, marginBottom: 4 }}><strong>{v?.nome}</strong>: {b.motivo || "·"}{b.note && ` · ${b.note}`}</div>;
                })}
              </div>
            )}
            {nvNote && <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, fontStyle: "italic", fontSize: 11, color: T.sub }}>"{nvNote}"</div>}
            <div style={{ ...S.card, padding: "10px 14px", marginBottom: 10, background: T.accLt, border: `1px solid ${T.acc}30` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Tipo visita</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc }}>
                {nvTipo === "rilievo" ? "📐 Rilievo misure" : nvTipo === "definitiva" ? "✓ Misure definitive" : "🔧 Modifica cantiere"}
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
        {/* HERO_TEAL_CM2_V2 - hero fliwoX + ripristino tutti gli elementi */}
        <div style={{ padding: "calc(env(safe-area-inset-top, 0px) + 8px) 12px 0", background: "#E4F2F2" }}>
          <div style={{
            background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
            borderRadius: 22, padding: "34px 22px 70px",
            position: "relative", overflow: "hidden",
            boxShadow: "0 10px 26px rgba(31,120,120,0.35), inset 0 2px 3px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.12)",
            marginBottom: 10,
          }}>
            <div style={{ position: "absolute", top: -40, right: -30, width: 130, height: 130, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.2), transparent)", borderRadius: "22px 22px 0 0", pointerEvents: "none" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}>
              <div onClick={() => { setSelectedRilievo(null); setCmSubTab("rilievi"); setSelectedCM(null); }} style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", flexShrink: 0,
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "1px", textTransform: "uppercase" }}>{c.code}{r ? ` · ${tipoLblRil} R${r?.n}` : ""}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.4px", marginTop: 1, textShadow: "0 2px 4px rgba(0,0,0,0.2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.cliente} {c.cognome || ""}
                </div>
                {c.indirizzo && (
                  <div style={{ fontSize: 11, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.indirizzo}
                  </div>
                )}
              </div>
              {vaniList.length > 0 && (
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>{progVani}%</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 2 }}>{vaniMisurati.length}/{vaniList.length} vani</div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Contact actions - hide when selectedRilievo active (v67) */}
        {!selectedRilievo && (
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
        )}

        {/* Banner rilievo info - modifica riparazione */}
        {r?.motivoModifica && (
          <div style={{ margin: "4px 12px 8px", padding: "8px 12px", background: T.orangeLt, borderRadius: 10, border: `1px solid ${T.orange}30`, fontSize: 12, color: T.orange, fontWeight: 600 }}>
            <I d={ICO.wrench} /> <strong>Modifica:</strong> {r.motivoModifica}
          </div>
        )}

        {/* Barra progresso vani */}
        {vaniList.length > 0 && (
          <div style={{ padding: "0 12px 8px" }}>
            <div style={{ height: 5, background: T.bdr, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${progVani}%`, background: progVani === 100 ? T.grn : tipoColRil, borderRadius: 3, transition: "width 0.3s" }} />
            </div>
            {vaniDaFare.filter(v => !v.note?.startsWith("+")).length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Mancano misure: {vaniDaFare.filter(v => !v.note?.startsWith("+")).map(v => v.nome).join(", ")}</div>}
            {tutteMis && <div style={{ fontSize: 11, color: T.grn, fontWeight: 700 }}>✓ Tutte le misure raccolte</div>}
          </div>
        )}

        {/* Info badges: riparazione / nuova / sistema / salita / mezzo / piano / foro / telefono */}
        <div style={{ padding: "0 12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}><I d={ICO.wrench} /> Riparazione</span>}
          {c.sistema && <span style={S.badge(T.blueLt, T.blue)}>{c.sistema}</span>}
          {c.difficoltaSalita && <span style={S.badge(c.difficoltaSalita === "facile" ? T.grnLt : c.difficoltaSalita === "media" ? T.orangeLt : T.redLt, c.difficoltaSalita === "facile" ? T.grn : c.difficoltaSalita === "media" ? T.orange : T.red)}>Salita: {c.difficoltaSalita}</span>}
          {c.mezzoSalita && <span style={S.badge(T.purpleLt, T.purple)}>{c.mezzoSalita}</span>}
          {c.pianoEdificio && <span style={S.badge(T.blueLt, T.blue)}>Piano: {c.pianoEdificio}</span>}
          {c.foroScale && <span style={S.badge(T.redLt, T.red)}>Foro: {c.foroScale}</span>}
        </div>

        {/* Note commessa */}
        {c.note && (
          <div style={{ padding: "0 12px", marginBottom: 6 }}>
            <div style={{ padding: "8px 12px", borderRadius: 10, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.sub, lineHeight: 1.4 }}>
              <I d={ICO.fileText} /> {c.note}
            </div>
          </div>
        )}

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
            {vaniDaFare.filter(v => !v.note?.startsWith("+")).length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Mancano misure: {vaniDaFare.filter(v => !v.note?.startsWith("+")).map(v => v.nome).join(", ")}</div>}
            {tutteMis && <div style={{ fontSize: 11, color: T.grn, fontWeight: 600 }}>✓ Tutte le misure raccolte</div>}
          </div>
        )}

        {c.note && <div style={{ padding: "0 16px", marginBottom: 6 }}><div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.sub, lineHeight: 1.4 }}><I d={ICO.fileText} /> {c.note}</div></div>}

        {/* Stato lavoro inline · replaces old phase panels */}
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
          const fmtCC = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";

          const skipped = (id) => (c.skipLog || []).some(s => s.fase === id);
          const stepsCC = [
            { id: "sopralluogo", icon: "mapPin", l: "Rilievo",    done: (rilieviCC.length > 0 && vaniCC.length > 0) || skipped("sopralluogo"), skipped: skipped("sopralluogo"), desc: "Misure, foto, note dal cantiere" },
            { id: "preventivo",  icon: "fileText", l: "Preventivo", done: !!c.preventivoInviato || skipped("preventivo"),  skipped: skipped("preventivo"),  desc: "Rivedi prezzi, sconti, condizioni" },
            { id: "conferma",    icon: "edit",  l: "Firma",      done: hasFirmaCC || skipped("conferma"),               skipped: skipped("conferma"),    desc: "Firma cliente e conferma ordine" },
            { id: "ordini",      icon: "package", l: "Ordine",     done: hasOrdCC || skipped("ordini"),                   skipped: skipped("ordini"),      desc: "Ordina materiali ai fornitori" },
            { id: "produzione",  icon: "building", l: "Produzione", done: confFirmCC || skipped("produzione"),             skipped: skipped("produzione"),  desc: "Attesa materiali e lavorazione" },
            { id: "posa",        icon: "wrench", l: "Posa",       done: montCC.some(m => ["completato","collaudo","chiuso"].includes(m.interventoStato || m.stato)) || skipped("posa"), skipped: skipped("posa"), desc: "Montaggio al cantiere" },
            { id: "collaudo",    icon: "checkCircle", l: "Collaudo",   done: !!c.collaudoOk || montCC.some(m => ["collaudo","chiuso"].includes(m.interventoStato)) || skipped("collaudo"), skipped: skipped("collaudo"), desc: "Verifica lavoro, foto finale" },
            { id: "chiusura",    icon: "tag", l: "Chiusura",   done: tuttoCC, desc: "Fattura saldo e chiudi" },
          ];
          const doneCC = stepsCC.filter(s => s.done).length;
          const curIdxCC = stepsCC.findIndex(s => !s.done);
          const curCC = curIdxCC >= 0 ? stepsCC[curIdxCC] : null;
          const progCC = Math.round((doneCC / stepsCC.length) * 100);

          return (
            <div style={{ margin: "14px 16px 8px", padding: "18px 16px", background: "#fff", borderRadius: 16, border: "1px solid #E4F2F2", boxShadow: "0 2px 8px rgba(40,160,160,0.08)" }}>
              {/* Stato lavoro header - hide when selectedRilievo (v67) */}
              {!selectedRilievo && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#28A0A0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(40,160,160,0.3)" }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "#0D1F1F", letterSpacing: "-0.3px" }}>Stato lavoro</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#1A7A7A", background: "#fff", padding: "4px 11px", borderRadius: 10, boxShadow: "0 2px 4px rgba(0,0,0,0.12)" }}>{doneCC}/{stepsCC.length} · {progCC}%</span>
              </div>
              )}
              {/* Progress dots con label - hide when selectedRilievo (v67) */}
              {!selectedRilievo && (
              <div style={{ display: "flex", gap: 0, marginBottom: 14, marginTop: 4, justifyContent: "space-between", alignItems: "flex-start", padding: 0, width: "100%" }}>
                {stepsCC.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 0, flex: "1 1 0", minWidth: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                        background: s.skipped ? "#ff9500" : s.done ? "#28A0A0" : i === curIdxCC ? T.acc : "#F0EDE5",
                        color: s.done || s.skipped || i === curIdxCC ? "#fff" : T.sub, fontWeight: 700,
                        boxShadow: i === curIdxCC ? "0 2px 8px rgba(40,160,160,0.35)" : "none",
                        border: i === curIdxCC ? "2px solid #fff" : s.done ? "2px solid #28A0A0" : "2px solid transparent",
                      }}>{s.skipped ? <I d={ICO.check} s={14} c="#fff" /> : s.done ? <I d={ICO.check} s={14} c="#fff" /> : <Ico d={ICO[s.icon as keyof typeof ICO] || ICO.edit} s={14} c={i === curIdxCC ? "#fff" : T.sub} />}</div>
                      <div style={{ fontSize: 9, color: i === curIdxCC ? "#0D1F1F" : s.done ? "#0F6E56" : T.sub, fontWeight: i === curIdxCC ? 800 : 600, whiteSpace: "nowrap", maxWidth: 42, overflow: "hidden", textOverflow: "ellipsis", textAlign: "center", marginTop: 4 }}>{s.l}</div>
                    </div>
                    {i < stepsCC.length - 1 && <div style={{ flex: 1, minWidth: 4, height: 2, background: s.done ? "#28A0A0" : T.bdr, borderRadius: 2, marginBottom: 18, marginTop: 0 }} />}
                  </div>
                ))}
              </div>
              )}
              {/* Mini-card Rilievo collassata — visibile quando fase > sopralluogo */}
              {curIdxCC > 0 && rilieviCC.length > 0 && (
                <div onClick={() => { setPrevWorkspace(true); setPrevTab("sopralluogo"); }} style={{
                  background: "#fff", borderRadius: 14, border: "1px solid " + T.bdr,
                  padding: "12px 14px", marginBottom: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "#28A0A015", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <I d={ICO.mapPin} s={14} c="#28A0A0" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#0D1F1F" }}>Rilievo</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "#28A0A0", color: "#fff" }}>✓ FATTO</span>
                    </div>
                    <div style={{ fontSize: 10, color: T.sub }}>{rilieviCC.length} rilievi · {vaniCC.length} vani · tap per consultare</div>
                  </div>
                  <I d={ICO.chevronRight} s={14} c={T.sub} />
                </div>
              )}

              {/* Current action - hide when selectedRilievo (v67) */}
              {!selectedRilievo && curCC && (
                <div style={{ background: T.card, borderRadius: 14, border: `1.5px solid #C8E4E4`, padding: "14px 16px", boxShadow: "0 2px 12px rgba(40,160,160,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(40,160,160,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IcoKey name={curCC.icon} s={16} c="#28A0A0" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "#0D1F1F" }}>{curCC.l}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 6, background: "#28A0A0", color: "#fff", letterSpacing: "0.04em" }}>DA FARE</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{curCC.desc}</div>
                    </div>
                    {hasFattCC && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: tuttoCC ? "#28A0A020" : "#D0800820", color: tuttoCC ? "#28A0A0" : "#D08008" }}>
                        {tuttoCC ? "✓ Pagata" : <I d={ICO.fileText} />}
                      </span>
                    )}
                  </div>
                  {/* Success flash */}
                  {ccDone && <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#28A0A018", border: "1px solid #28A0A040", fontSize: 12, fontWeight: 700, color: "#28A0A0", textAlign: "center" }}>{ccDone}</div>}

                  {/* Skipped steps log */}
                  <PassaggiSaltati
                    skipLog={c.skipLog || []}
                    steps={stepsCC}
                    onRiprendi={(si, faseId) => {
                      setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, skipLog: (cm.skipLog || []).filter((_, i) => i !== si), fase: faseId } : cm));
                      setSelectedCM((prev: any) => ({ ...prev, skipLog: (prev.skipLog || []).filter((_: any, i: number) => i !== si), fase: faseId }));
                      setCcDone("Riaperto"); setTimeout(() => setCcDone(null), 2500);
                    }}
                  />

                  {/*  SOPRALLUOGO · Lista rilievi + Crea nuovo  */}
                  {curCC.id === "sopralluogo" && (
                    <div>
                      {/* Lista rilievi esistenti */}
                      {rilieviCC.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          {rilieviCC.map((ril, ri) => {
                            const vaniDelRil = (ril.vani || []).length;
                            const tipoR = ril.tipo || "provvisorio";
                            const tipoMap: any = {
                              provvisorio: { l: "Provvisorio", c: "#412402", bg: "#FAC775" },
                              verificato:  { l: "Verificato",  c: "#0A2842", bg: "#9FC6F0" },
                              definitivo:  { l: "Definitivo",  c: "#04342C", bg: "#A5DCC6" },
                              da_rivedere: { l: "Da rivedere", c: "#4B1515", bg: "#F7B5B5" },
                              indicativa:  { l: "Provvisorio", c: "#412402", bg: "#FAC775" },
                              personalizzato: { l: "Personalizzato", c: "#26215C", bg: "#B5B0E8" },
                            };
                            const tt = tipoMap[tipoR] || tipoMap.provvisorio;
                            return (
                              <React.Fragment key={ril.id}>
                              <div onClick={(e) => {
                                e.stopPropagation();
                                console.log("[CLICK RILIEVO]", ril.id, "vani:", (ril.vani||[]).length);
                                setSelectedRilievo(ril);
                                setCmSubTab("sopralluoghi");
                                // Scroll alla sezione vani dopo render
                                setTimeout(() => {
                                  const el = document.getElementById("cm-tab-vani") || document.querySelector('[data-tab="sopralluoghi"]');
                                  if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "start" });
                                  else window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                                }, 150);
                              }} style={{
                                background: tt.bg, border: "none", borderRadius: 12,
                                padding: "12px 14px", marginBottom: 8, cursor: "pointer", boxShadow: `0 2px 8px ${tt.c}20`,
                                display: "flex", alignItems: "center", gap: 10,
                              }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l4-4"/><path d="M16 8l2 2"/><path d="M8 12a4 4 0 1 1 4 4"/><circle cx="12" cy="12" r="1.5" fill="#fff"/></svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.15)" }}>R{ril.n || ri + 1}</span>
                                    <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 9px", borderRadius: 6, background: "#fff", color: tt.c, textTransform: "uppercase" as any, letterSpacing: "0.4px" }}>{tt.l}</span>
                                  </div>
                                  <div style={{ fontSize: 11, color: "#fff", opacity: 0.9, marginTop: 2, fontWeight: 600 }}>
                                    {ril.data ? new Date(ril.data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "·"}
                                    {ril.rilevatore ? ` · ${ril.rilevatore}` : ""}
                                    {` · ${vaniDelRil} ${vaniDelRil === 1 ? "vano" : "vani"}`}
                                  </div>
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>

                              {/* v66 · Dettaglio rilievo espanso · Design mockup v8 */}
                              {selectedRilievo?.id === ril.id && (() => {
                                // --- Tipo edificio: lettura identica a MODAL AGGIUNGI VANO COMPLESSO ---
                                const tEdifV66 = (c as any).tipoEdificio || (c as any).tipo_edificio || "";
                                const tEdifLabelV66 = (() => {
                                  switch (tEdifV66) {
                                    case "palazzo": return "Palazzo residenziale";
                                    case "condominio": return "Condominio";
                                    case "scuola": return "Scuola";
                                    case "ospedale": return "Ospedale / Clinica";
                                    case "ufficio": return "Ufficio / Direzionale";
                                    case "hotel": return "Hotel / RSA";
                                    case "centro_comm": return "Centro commerciale";
                                    case "industriale": return "Capannone / Industriale";
                                    case "personalizzato": return "Personalizzato";
                                    default: return "Casa singola";
                                  }
                                })();
                                const tEdifLabelsV66 = (() => {
                                  switch (tEdifV66) {
                                    case "palazzo": return { l1: "Scala", l2: "Piano", l3: "Interno" };
                                    case "condominio": return { l1: "", l2: "Piano", l3: "Interno" };
                                    case "scuola": return { l1: "Edificio/Plesso", l2: "Piano", l3: "Aula" };
                                    case "ospedale": return { l1: "Padiglione", l2: "Piano", l3: "Reparto" };
                                    case "ufficio": return { l1: "Edificio", l2: "Piano", l3: "Ufficio" };
                                    case "hotel": return { l1: "Edificio", l2: "Piano", l3: "Camera" };
                                    case "centro_comm": return { l1: "", l2: "Livello", l3: "Negozio" };
                                    case "industriale": return { l1: "Corpo", l2: "", l3: "Settore" };
                                    case "personalizzato": return { l1: (c as any).livello1Label || "Livello 1", l2: (c as any).livello2Label || "Livello 2", l3: (c as any).livello3Label || "Livello 3" };
                                    default: return { l1: "Zona", l2: "Piano", l3: "Locale" };
                                  }
                                })();
                                const tEdifStructV66 = [tEdifLabelsV66.l1, tEdifLabelsV66.l2, tEdifLabelsV66.l3].filter(Boolean).join(" · ");

                                // --- KPI ---
                                const vaniCountV66 = (ril.vani || []).length;
                                const vaniCompletiV66 = (ril.vani || []).filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6).length;
                                const fotoCountV66 = (ril.vani || []).reduce((a, v) => a + Object.keys(v.foto || {}).length, 0);

                                // --- Titolo dinamico prossima azione ---
                                const nextActionTitleV66 = vaniCountV66 === 0 ? "Aggiungi il primo vano" : (vaniCompletiV66 < vaniCountV66 ? "Completa le misure" : "Rilievo completo");
                                const nextActionDescV66 = vaniCountV66 === 0 ? "Compila 8 misure per ogni vano. Inizia dal primo." : `${vaniCompletiV66}/${vaniCountV66} vani completi · continua il rilievo`;
                                const nextActionBtnV66 = vaniCountV66 === 0 ? "AGGIUNGI PRIMO VANO" : "APRI RILIEVO";

                                return (
                                <div style={{
                                  marginTop: 0, marginBottom: 10,
                                  background: "transparent",
                                  display: "flex", flexDirection: "column", gap: 12,
                                }}>
                                  {/* MINI STEPPER 8 puntini */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px" }}>
                                    <div style={{ fontSize: 9.5, fontWeight: 900, color: T.sub, letterSpacing: "0.4px", textTransform: "uppercase" as any, flexShrink: 0 }}>Passo 1/8</div>
                                    <div style={{ display: "flex", gap: 3, flex: 1 }}>
                                      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #AFA9EC, #7F77DD)", boxShadow: "0 0 6px rgba(127,119,221,0.5)" }} />
                                      {[1,2,3,4,5,6,7].map(i => (<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.5)" }} />))}
                                    </div>
                                    <div style={{ fontSize: 9.5, fontWeight: 900, color: "#7F77DD", letterSpacing: "0.4px", textTransform: "uppercase" as any, flexShrink: 0 }}>Rilievo</div>
                                  </div>

                                  {/* BIG ACTION viola */}
                                  <div style={{
                                    borderRadius: 22, padding: "20px 18px 18px",
                                    background: "linear-gradient(155deg, #B5B0EE 0%, #7F77DD 55%, #6961CB 100%)",
                                    color: "#fff",
                                    boxShadow: "0 14px 32px rgba(127,119,221,0.35), 0 6px 12px rgba(127,119,221,0.2)",
                                    position: "relative", overflow: "hidden",
                                    display: "flex", flexDirection: "column",
                                  }}>
                                    {/* glow decorativi */}
                                    <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent 65%)", pointerEvents: "none" }} />
                                    <div style={{ position: "absolute", bottom: -60, left: -30, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)", pointerEvents: "none" }} />

                                    {/* Tag */}
                                    <div style={{
                                      display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
                                      padding: "5px 11px", background: "rgba(255,255,255,0.22)",
                                      borderRadius: 50, fontSize: 8.5, fontWeight: 900, letterSpacing: "1.1px",
                                      textTransform: "uppercase" as any, position: "relative",
                                    }}>
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 6.6L22 9.3l-5.8 4.7 1.8 7.5L12 17.8l-6 3.7 1.8-7.5L2 9.3l7.6-.7z"/></svg>
                                      Prossima mossa
                                    </div>

                                    {/* Titolo */}
                                    <div style={{
                                      fontSize: 22, fontWeight: 900, marginTop: 12,
                                      letterSpacing: "-0.5px", lineHeight: 1.15,
                                      textShadow: "0 2px 4px rgba(0,0,0,0.2)", position: "relative",
                                    }}>{nextActionTitleV66}</div>

                                    {/* Desc */}
                                    <div style={{
                                      fontSize: 11.5, opacity: 0.94, marginTop: 6,
                                      lineHeight: 1.4, fontWeight: 500, position: "relative",
                                    }}>{nextActionDescV66}</div>

                                    {/* Pill tipo edificio */}
                                    <div style={{
                                      marginTop: 12, background: "rgba(255,255,255,0.18)",
                                      borderRadius: 12, padding: "10px 12px",
                                      display: "flex", alignItems: "center", gap: 10, position: "relative",
                                    }}>
                                      <div style={{
                                        width: 36, height: 36, borderRadius: 11,
                                        background: "rgba(255,255,255,0.22)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        flexShrink: 0, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
                                      }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M10 22v-4h4v4"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/></svg>
                                      </div>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Immobile</div>
                                        <div style={{ fontSize: 13, fontWeight: 900, marginTop: 1, letterSpacing: "-0.1px" }}>{tEdifLabelV66}</div>
                                        {tEdifStructV66 && <div style={{ fontSize: 10, opacity: 0.88, marginTop: 1, fontWeight: 600 }}>{tEdifStructV66}</div>}
                                      </div>
                                    </div>

                                    {/* Meta tiles */}
                                    <div style={{
                                      marginTop: 12, display: "grid",
                                      gridTemplateColumns: fotoCountV66 > 0 ? "1fr 1fr 1fr" : "1fr 1fr",
                                      gap: 8, position: "relative",
                                    }}>
                                      <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "9px 11px" }}>
                                        <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Vani</div>
                                        <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2, letterSpacing: "-0.3px" }}>{vaniCompletiV66}/{vaniCountV66 || "—"}</div>
                                        <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>{vaniCountV66 === 0 ? "da configurare" : (vaniCompletiV66 === vaniCountV66 ? "tutti OK" : "in corso")}</div>
                                      </div>
                                      <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "9px 11px" }}>
                                        <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Misure</div>
                                        <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2, letterSpacing: "-0.3px" }}>{vaniCompletiV66 * 8}/{vaniCountV66 * 8 || 8}</div>
                                        <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>per vano</div>
                                      </div>
                                      {fotoCountV66 > 0 && (
                                        <div style={{ background: "rgba(255,255,255,0.18)", borderRadius: 12, padding: "9px 11px" }}>
                                          <div style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Foto</div>
                                          <div style={{ fontSize: 17, fontWeight: 900, marginTop: 2, letterSpacing: "-0.3px" }}>{fotoCountV66}</div>
                                          <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 1, fontWeight: 600 }}>totali</div>
                                        </div>
                                      )}
                                    </div>

                                    {/* BIG BTN — onClick IDENTICO all'originale */}
                                    <button onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedRilievo(ril);
                                      if (ril.complesso && (ril.vani || []).length === 0) {
                                        setNvL1(""); setNvL2(""); setNvL3(""); setNvStanza(""); setNvCustom([]);
                                        setShowAggiungiVanoModal(true);
                                        return;
                                      }
                                      const vaniR = ril.vani || [];
                                      if (vaniR.length > 0) {
                                        setSelectedVano(vaniR[0]);
                                        setVanoStep(0);
                                      } else {
                                        const nuovoVano = { id: Date.now(), nome: "Vano 1", tipo: "", stanza: "", piano: "", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
                                        const updR = { ...ril, vani: [...(ril.vani || []), nuovoVano] };
                                        setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === ril.id ? updR : r2), aggiornato: "Oggi" } : cm));
                                        setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === ril.id ? updR : r2) }));
                                        setSelectedRilievo(updR);
                                        setSelectedVano(nuovoVano);
                                        setVanoStep(0);
                                      }
                                    }} style={{
                                      marginTop: 14, width: "100%", padding: 15,
                                      background: "#fff", color: "#3C3489",
                                      border: "none", borderRadius: 14,
                                      fontSize: 13.5, fontWeight: 900, letterSpacing: "0.4px",
                                      cursor: "pointer", fontFamily: "inherit",
                                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                      boxShadow: "0 6px 16px rgba(0,0,0,0.2), inset 0 -3px 0 rgba(60,52,137,0.08)",
                                      position: "relative",
                                    }}>
                                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                      {nextActionBtnV66}
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                    </button>
                                  </div>

                                  {/* MENU 4 CENTRI */}
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                                    {/* CLIENTE - placeholder v67 */}
                                    <button onClick={(e) => { e.stopPropagation(); }} style={{
                                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                      padding: "11px 4px", background: "#fff",
                                      border: "1px solid rgba(200,228,228,0.4)", borderRadius: 13,
                                      cursor: "pointer", fontFamily: "inherit",
                                      boxShadow: "0 2px 6px rgba(13,31,31,0.04)", position: "relative",
                                    }}>
                                      <div style={{ width: 30, height: 30, borderRadius: 9,
                                        background: "linear-gradient(145deg, rgba(93,202,165,0.22), rgba(29,158,117,0.12))",
                                        color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                                      }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                      </div>
                                      <span style={{ fontSize: 9.5, fontWeight: 900, color: "#0F2525", letterSpacing: "0.2px" }}>Cliente</span>
                                    </button>

                                    {/* ALLEGATI - per ora fotoInputRef (preserva onClick Foto) */}
                                    <button onClick={(e) => { e.stopPropagation(); fotoInputRef.current?.click(); }} style={{
                                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                      padding: "11px 4px", background: "#fff",
                                      border: "1px solid rgba(200,228,228,0.4)", borderRadius: 13,
                                      cursor: "pointer", fontFamily: "inherit",
                                      boxShadow: "0 2px 6px rgba(13,31,31,0.04)", position: "relative",
                                    }}>
                                      <div style={{ width: 30, height: 30, borderRadius: 9,
                                        background: "linear-gradient(145deg, rgba(175,169,236,0.22), rgba(127,119,221,0.12))",
                                        color: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                                      }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                      </div>
                                      <span style={{ fontSize: 9.5, fontWeight: 900, color: "#0F2525", letterSpacing: "0.2px" }}>Allegati</span>
                                      {fotoCountV66 > 0 && (
                                        <div style={{ position: "absolute", top: 6, right: 8, fontSize: 9, fontWeight: 900, background: "linear-gradient(145deg, #E24B4A, #C53030)", color: "#fff", padding: "1px 6px", borderRadius: 50, boxShadow: "0 2px 4px rgba(226,75,74,0.3)", minWidth: 16, textAlign: "center" as any }}>{fotoCountV66}</div>
                                      )}
                                    </button>

                                    {/* NOTE - placeholder v67 */}
                                    <button onClick={(e) => { e.stopPropagation(); }} style={{
                                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                      padding: "11px 4px", background: "#fff",
                                      border: "1px solid rgba(200,228,228,0.4)", borderRadius: 13,
                                      cursor: "pointer", fontFamily: "inherit",
                                      boxShadow: "0 2px 6px rgba(13,31,31,0.04)", position: "relative",
                                    }}>
                                      <div style={{ width: 30, height: 30, borderRadius: 9,
                                        background: "linear-gradient(145deg, rgba(250,199,117,0.25), rgba(239,159,39,0.12))",
                                        color: "#EF9F27", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                                      }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                                      </div>
                                      <span style={{ fontSize: 9.5, fontWeight: 900, color: "#0F2525", letterSpacing: "0.2px" }}>Note</span>
                                    </button>

                                    {/* AZIONI - toggle mini menu con onClick originali */}
                                    <button onClick={(e) => { e.stopPropagation(); setAzioniOpenV66(v => !v); }} style={{
                                      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                                      padding: "11px 4px", background: "#fff",
                                      border: "1px solid rgba(200,228,228,0.4)", borderRadius: 13,
                                      cursor: "pointer", fontFamily: "inherit",
                                      boxShadow: "0 2px 6px rgba(13,31,31,0.04)", position: "relative",
                                    }}>
                                      <div style={{ width: 30, height: 30, borderRadius: 9,
                                        background: "linear-gradient(145deg, rgba(133,183,235,0.22), rgba(55,138,221,0.12))",
                                        color: "#378ADD", display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                                      }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6"/><path d="M1 12h6m6 0h6"/></svg>
                                      </div>
                                      <span style={{ fontSize: 9.5, fontWeight: 900, color: "#0F2525", letterSpacing: "0.2px" }}>Azioni</span>
                                    </button>
                                  </div>

                                  {/* AZIONI · pannello inline espandibile (mini menu temporaneo) */}
                                  {azioniOpenV66 && (
                                    <div style={{
                                      background: "#fff", border: "1px solid rgba(200,228,228,0.4)",
                                      borderRadius: 14, padding: 10,
                                      boxShadow: "0 3px 10px rgba(13,31,31,0.06)",
                                      display: "flex", flexDirection: "column", gap: 6,
                                    }}>
                                      {/* Riepilogo */}
                                      <button onClick={(e) => { e.stopPropagation(); setSelectedRilievo(ril); setShowRiepilogo(true); setAzioniOpenV66(false); }} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 12px", background: "transparent",
                                        border: "none", borderBottom: "1px solid rgba(200,228,228,0.3)",
                                        cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" as any,
                                      }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(55,138,221,0.15), rgba(55,138,221,0.08))", color: "#378ADD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/></svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Riepilogo rilievo</div>
                                          <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 1 }}>Vedi scheda completa</div>
                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#378ADD" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                      </button>

                                      {/* PDF */}
                                      <button onClick={(e) => { e.stopPropagation(); setSelectedRilievo(ril); exportPDF(); setAzioniOpenV66(false); }} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 12px", background: "transparent",
                                        border: "none", borderBottom: "1px solid rgba(200,228,228,0.3)",
                                        cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" as any,
                                      }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(29,158,117,0.15), rgba(29,158,117,0.08))", color: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Esporta PDF rilievo</div>
                                          <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 1 }}>Scheda tecnica per officina</div>
                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                      </button>

                                      {/* Duplica */}
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        const rilieviCor = selectedCM?.rilievi || [];
                                        const nextN = rilieviCor.length + 1;
                                        const vaniCopia = (ril.vani || []).map(v => ({
                                          ...v,
                                          id: Date.now() + Math.floor(Math.random()*1000) + (v.id || 0),
                                          misure: { ...(v.misure || {}) },
                                          foto: { ...(v.foto || {}) },
                                          accessori: v.accessori ? {
                                            tapparella: { ...(v.accessori.tapparella || { attivo: false }) },
                                            persiana: { ...(v.accessori.persiana || { attivo: false }) },
                                            zanzariera: { ...(v.accessori.zanzariera || { attivo: false }) },
                                          } : { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
                                        }));
                                        const nuovoR = {
                                          id: Date.now(),
                                          n: nextN,
                                          data: new Date().toISOString().split("T")[0],
                                          tipo: "da_rivedere",
                                          rilevatore: ril.rilevatore || "",
                                          note: `Duplicato da R${ril.n || ""}`,
                                          vani: vaniCopia,
                                          duplicatoDa: ril.id,
                                        };
                                        setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: [...(cm.rilievi||[]), nuovoR], aggiornato: "Oggi" } : cm));
                                        setSelectedCM(prev => prev ? ({ ...prev, rilievi: [...(prev.rilievi||[]), nuovoR] }) : prev);
                                        setSelectedRilievo(nuovoR);
                                        setAzioniOpenV66(false);
                                      }} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 12px", background: "transparent",
                                        border: "none", borderBottom: "1px solid rgba(200,228,228,0.3)",
                                        cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" as any,
                                      }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(127,119,221,0.15), rgba(127,119,221,0.08))", color: "#7F77DD", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1 -2 -2V4a2 2 0 0 1 2 -2h9a2 2 0 0 1 2 2v1"/></svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Duplica rilievo</div>
                                          <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 1 }}>Crea R{((selectedCM?.rilievi||[]).length)+1} partendo da questo</div>
                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7F77DD" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                      </button>

                                      {/* Segnala problema */}
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        setProblemaForm({ titolo: "", descrizione: "", tipo: "materiale", priorita: "media", assegnato: "" });
                                        setShowProblemaModal(true);
                                        setAzioniOpenV66(false);
                                      }} style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        padding: "10px 12px", background: "transparent",
                                        border: "none", cursor: "pointer", fontFamily: "inherit",
                                        width: "100%", textAlign: "left" as any,
                                      }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(145deg, rgba(239,159,39,0.15), rgba(239,159,39,0.08))", color: "#EF9F27", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <div style={{ fontSize: 12.5, fontWeight: 900, color: "#0D1F1F" }}>Segnala problema</div>
                                          <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginTop: 1 }}>Imprevisto, materiale mancante</div>
                                        </div>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF9F27" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                      </button>
                                    </div>
                                  )}

                                  {/* CRONOLOGIA accordion v67 - come mockup v8 */}
                                  {(() => {
                                    const storicoCron = (c.storico || []) as any[];
                                    const lastEvt = storicoCron[storicoCron.length - 1];
                                    const lastTxt = lastEvt ? (lastEvt.quando || "poco fa") : "Adesso";
                                    return (
                                      <div>
                                        <div onClick={(e) => { e.stopPropagation(); setCronOpenV67(v => !v); }} style={{
                                          background: "#fff",
                                          border: "1px solid rgba(200,228,228,0.4)",
                                          borderRadius: cronOpenV67 ? "14px 14px 0 0" : 14,
                                          borderBottomColor: cronOpenV67 ? "transparent" : "rgba(200,228,228,0.4)",
                                          padding: "12px 14px",
                                          display: "flex", alignItems: "center", gap: 12,
                                          cursor: "pointer",
                                          boxShadow: "0 3px 8px rgba(13,31,31,0.04)",
                                        }}>
                                          <div style={{
                                            width: 34, height: 34, borderRadius: 10,
                                            background: "linear-gradient(145deg, rgba(127,119,221,0.18), rgba(29,158,117,0.12))",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#3C3489",
                                            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
                                          }}>
                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                          </div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 13, fontWeight: 900, color: "#0F2525", letterSpacing: "-0.1px" }}>Cronologia</div>
                                            <div style={{ fontSize: 10.5, color: T.sub, fontWeight: 600, marginTop: 2 }}>
                                              {storicoCron.length > 0 ? `${storicoCron.length} eventi · ultima ${lastTxt}` : "1 evento · ultima Adesso"}
                                            </div>
                                          </div>
                                          <div style={{
                                            fontSize: 10, fontWeight: 900, color: "#3C3489",
                                            background: "linear-gradient(145deg, rgba(175,169,236,0.28), rgba(127,119,221,0.15))",
                                            padding: "4px 10px", borderRadius: 50, letterSpacing: "0.3px",
                                            border: "1px solid rgba(127,119,221,0.22)",
                                          }}>{storicoCron.length || 1}</div>
                                          <div style={{
                                            width: 24, height: 24, borderRadius: 8,
                                            background: "rgba(40,160,160,0.08)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#1A7A7A",
                                            transform: cronOpenV67 ? "rotate(180deg)" : "none",
                                            transition: "transform 0.2s",
                                          }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                          </div>
                                        </div>
                                        {cronOpenV67 && (
                                          <div style={{
                                            background: "#fff",
                                            border: "1px solid rgba(200,228,228,0.4)",
                                            borderTop: "1px dashed rgba(200,228,228,0.6)",
                                            borderRadius: "0 0 14px 14px",
                                            padding: "14px 12px 12px",
                                            position: "relative",
                                            boxShadow: "0 3px 8px rgba(13,31,31,0.04)",
                                          }}>
                                            <div style={{ position: "absolute", left: 30, top: 22, bottom: 22, width: 2, background: "linear-gradient(180deg, #AFA9EC 0%, #5DCAA5 50%, #FAC775 100%)", borderRadius: 1, opacity: 0.3 }} />
                                            {storicoCron.length > 0 ? storicoCron.slice().reverse().map((ev, k) => (
                                              <div key={k} style={{ display: "flex", gap: 12, padding: "7px 0", position: "relative" }}>
                                                <div style={{
                                                  width: 36, height: 36, borderRadius: 11,
                                                  background: "linear-gradient(145deg, #AFA9EC, #7F77DD)",
                                                  color: "#fff", flexShrink: 0,
                                                  display: "flex", alignItems: "center", justifyContent: "center",
                                                  boxShadow: "0 3px 8px rgba(127,119,221,0.3), inset 0 1px 1px rgba(255,255,255,0.25)",
                                                }}>
                                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.4 8.6L22 9.3l-5.8 4.7 1.8 7.5L12 17.8l-6 3.7 1.8-7.5L2 9.3l7.6-.7z"/></svg>
                                                </div>
                                                <div style={{ flex: 1, background: "linear-gradient(145deg, rgba(127,119,221,0.04), rgba(200,228,228,0.08))", borderRadius: 10, padding: "8px 11px", border: "1px solid rgba(200,228,228,0.35)" }}>
                                                  <div style={{ fontSize: 11.5, color: "#0F2525", fontWeight: 700, lineHeight: 1.35 }}>
                                                    <strong style={{ color: "#3C3489", fontWeight: 900 }}>{ev.chi || "Sistema"}</strong> · {ev.cosa || ev.tipo || "evento"}
                                                  </div>
                                                  <div style={{ fontSize: 9.5, color: "#8FA8A8", fontWeight: 700, marginTop: 2, letterSpacing: "0.3px" }}>{ev.quando || ""}</div>
                                                </div>
                                              </div>
                                            )) : (
                                              <div style={{ display: "flex", gap: 12, padding: "7px 0", position: "relative" }}>
                                                <div style={{
                                                  width: 36, height: 36, borderRadius: 11,
                                                  background: "linear-gradient(145deg, #AFA9EC, #7F77DD)",
                                                  color: "#fff", flexShrink: 0,
                                                  display: "flex", alignItems: "center", justifyContent: "center",
                                                  boxShadow: "0 3px 8px rgba(127,119,221,0.3), inset 0 1px 1px rgba(255,255,255,0.25)",
                                                }}>
                                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L14.4 8.6L22 9.3l-5.8 4.7 1.8 7.5L12 17.8l-6 3.7 1.8-7.5L2 9.3l7.6-.7z"/></svg>
                                                </div>
                                                <div style={{ flex: 1, background: "linear-gradient(145deg, rgba(127,119,221,0.04), rgba(200,228,228,0.08))", borderRadius: 10, padding: "8px 11px", border: "1px solid rgba(200,228,228,0.35)" }}>
                                                  <div style={{ fontSize: 11.5, color: "#0F2525", fontWeight: 700, lineHeight: 1.35 }}>
                                                    <strong style={{ color: "#3C3489", fontWeight: 900 }}>Tu</strong> · creato la commessa
                                                  </div>
                                                  <div style={{ fontSize: 9.5, color: "#8FA8A8", fontWeight: 700, marginTop: 2, letterSpacing: "0.3px" }}>Adesso</div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}

                                  {/* CHIUDI DETTAGLIO - invariato */}
                                  <button onClick={(e) => { e.stopPropagation(); setSelectedRilievo(null); setAzioniOpenV66(false); }} style={{
                                    padding: "11px", borderRadius: 10,
                                    background: "linear-gradient(145deg, #3C3489 0%, #26215C 100%)",
                                    color: "#fff", border: "none",
                                    fontSize: 11, fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
                                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, letterSpacing: "0.4px",
                                    boxShadow: "0 4px 12px rgba(60,52,137,0.4), inset 0 1px 1px rgba(255,255,255,0.2)",
                                    textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                                  }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                                    CHIUDI DETTAGLIO
                                  </button>
                                </div>
                                );
                              })()}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}

                      {/* v68 · BIG ACTION VIOLA quando zero rilievi */}
                      {!selectedRilievo && rilieviCC.length === 0 && (() => {
                        const tEdifV68 = (c as any).tipoEdificio || (c as any).tipo_edificio || "";
                        const tEdifLabelV68 = (() => {
                          switch (tEdifV68) {
                            case "palazzo": return "Palazzo residenziale";
                            case "condominio": return "Condominio";
                            case "scuola": return "Scuola";
                            case "ospedale": return "Ospedale / Clinica";
                            case "ufficio": return "Ufficio / Direzionale";
                            case "hotel": return "Hotel / RSA";
                            case "centro_comm": return "Centro commerciale";
                            case "industriale": return "Capannone / Industriale";
                            case "personalizzato": return "Personalizzato";
                            default: return "Casa singola";
                          }
                        })();
                        const tEdifStructV68 = (() => {
                          switch (tEdifV68) {
                            case "palazzo": return "Scala · Piano · Interno";
                            case "condominio": return "Piano · Interno";
                            case "scuola": return "Edificio/Plesso · Piano · Aula";
                            case "ospedale": return "Padiglione · Piano · Reparto";
                            case "ufficio": return "Edificio · Piano · Ufficio";
                            case "hotel": return "Edificio · Piano · Camera";
                            case "centro_comm": return "Livello · Negozio";
                            case "industriale": return "Corpo · Settore";
                            case "personalizzato": return [(c as any).livello1Label || "Livello 1", (c as any).livello2Label || "Livello 2", (c as any).livello3Label || "Livello 3"].join(" · ");
                            default: return "Zona · Piano · Locale";
                          }
                        })();
                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 6 }}>
                            {/* mini stepper 8 puntini */}
                            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 2px" }}>
                              <div style={{ fontSize: 9.5, fontWeight: 900, color: T.sub, letterSpacing: "0.4px", textTransform: "uppercase" as any, flexShrink: 0 }}>Passo 1/8</div>
                              <div style={{ display: "flex", gap: 3, flex: 1 }}>
                                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "linear-gradient(90deg, #AFA9EC, #7F77DD)", boxShadow: "0 0 6px rgba(127,119,221,0.5)" }} />
                                {[1,2,3,4,5,6,7].map(i => (<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(200,228,228,0.5)" }} />))}
                              </div>
                              <div style={{ fontSize: 9.5, fontWeight: 900, color: "#7F77DD", letterSpacing: "0.4px", textTransform: "uppercase" as any, flexShrink: 0 }}>Rilievo</div>
                            </div>

                            {/* big action viola */}
                            <div style={{
                              borderRadius: 22, padding: "20px 18px 18px",
                              background: "linear-gradient(155deg, #B5B0EE 0%, #7F77DD 55%, #6961CB 100%)",
                              color: "#fff",
                              boxShadow: "0 14px 32px rgba(127,119,221,0.35), 0 6px 12px rgba(127,119,221,0.2)",
                              position: "relative", overflow: "hidden",
                              display: "flex", flexDirection: "column",
                            }}>
                              <div style={{ position: "absolute", top: -50, right: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.22), transparent 65%)", pointerEvents: "none" }} />
                              <div style={{ position: "absolute", bottom: -60, left: -30, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%)", pointerEvents: "none" }} />

                              <div style={{
                                display: "inline-flex", alignItems: "center", gap: 6, alignSelf: "flex-start",
                                padding: "5px 11px", background: "rgba(255,255,255,0.22)",
                                borderRadius: 50, fontSize: 8.5, fontWeight: 900, letterSpacing: "1.1px",
                                textTransform: "uppercase" as any, position: "relative",
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.4 6.6L22 9.3l-5.8 4.7 1.8 7.5L12 17.8l-6 3.7 1.8-7.5L2 9.3l7.6-.7z"/></svg>
                                Prima mossa
                              </div>

                              <div style={{
                                fontSize: 22, fontWeight: 900, marginTop: 12,
                                letterSpacing: "-0.5px", lineHeight: 1.15,
                                textShadow: "0 2px 4px rgba(0,0,0,0.2)", position: "relative",
                              }}>Crea il primo<br/>sopralluogo</div>

                              <div style={{
                                fontSize: 11.5, opacity: 0.94, marginTop: 6,
                                lineHeight: 1.4, fontWeight: 500, position: "relative",
                              }}>Vai in cantiere e fai il rilievo delle misure.</div>

                              {/* Pill tipo edificio */}
                              <div style={{
                                marginTop: 12, background: "rgba(255,255,255,0.18)",
                                borderRadius: 12, padding: "10px 12px",
                                display: "flex", alignItems: "center", gap: 10, position: "relative",
                              }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: 11,
                                  background: "rgba(255,255,255,0.22)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0, boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3)",
                                }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M10 22v-4h4v4"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/></svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: "0.8px", textTransform: "uppercase" as any, opacity: 0.85 }}>Immobile</div>
                                  <div style={{ fontSize: 13, fontWeight: 900, marginTop: 1, letterSpacing: "-0.1px" }}>{tEdifLabelV68}</div>
                                  <div style={{ fontSize: 10, opacity: 0.88, marginTop: 1, fontWeight: 600 }}>{tEdifStructV68}</div>
                                </div>
                              </div>

                              <button onClick={() => {
                                setNuovoRilievoTipo("provvisorio");
                                setNuovoRilievoRilevatore("");
                                setNuovoRilievoComplesso(false);
                                setNuovoRilievoNote("");
                                setShowNuovoRilievoModal(true);
                              }} style={{
                                marginTop: 14, width: "100%", padding: 15,
                                background: "#fff", color: "#3C3489",
                                border: "none", borderRadius: 14,
                                fontSize: 13.5, fontWeight: 900, letterSpacing: "0.4px",
                                cursor: "pointer", fontFamily: "inherit",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                                boxShadow: "0 6px 16px rgba(0,0,0,0.2), inset 0 -3px 0 rgba(60,52,137,0.08)",
                                position: "relative",
                              }}>
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                CREA RILIEVO
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3C3489" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Bottone CREA NUOVO RILIEVO compatto - solo quando ci sono gia' rilievi ma nessuno selezionato */}
                      {!selectedRilievo && rilieviCC.length > 0 && <button onClick={() => {
                        setNuovoRilievoTipo("provvisorio");
                        setNuovoRilievoRilevatore("");
                        setNuovoRilievoComplesso(false);
                        setNuovoRilievoNote("");
                        setShowNuovoRilievoModal(true);
                      }} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> CREA NUOVO RILIEVO
                      </button>}

                      {vaniCC.length > 0 && (
                        <div style={{ fontSize: 12, color: "#28A0A0", fontWeight: 700, textAlign: "center", marginTop: 8 }}>✓ {vaniCC.length} vani misurati · Vai al preventivo</div>
                      )}
                    </div>
                  )}

                  {/*  BIVIO SECONDARIO · CHIUDI RILIEVO (chiudi e vai / azioni extra)  */}
                  {curCC.id === "preventivo" && c.preventivoModoScelto === "chiuso_bivio" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoModoScelto: null } : cm));
                        setSelectedCM((prev: any) => ({ ...prev, preventivoModoScelto: null }));
                      }} style={{ fontSize: 11, color: T.sub, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        ← Torna alla scelta
                      </div>

                      <div style={{ fontSize: 11, color: T.sub, textAlign: "center" as any, marginBottom: 4 }}>Come vuoi chiudere il rilievo?</div>

                      {/* OPZIONE A · CHIUDI E VAI */}
                      <div onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoModoScelto: "chiuso" } : cm));
                        setSelectedCM((prev: any) => ({ ...prev, preventivoModoScelto: "chiuso" }));
                        setPrevWorkspace(false);
                        setSelectedRilievo(null);
                        setCmSubTab && setCmSubTab("rilievi");
                        setSelectedCM(null);
                        setCcDone("✓ Rilievo chiuso · vai al prossimo"); setTimeout(() => setCcDone(null), 2500);
                      }} style={{
                        padding: "16px 14px", borderRadius: 14, cursor: "pointer",
                        background: "#fff", border: "2px solid " + T.bdr,
                        display: "flex", alignItems: "center", gap: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: T.grnLt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <I d={ICO.checkCircle} s={18} c={T.grn} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "#0D1F1F", marginBottom: 2 }}>Chiudi e vai al prossimo</div>
                          <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.3 }}>Salva · il preventivo lo faccio dopo in azienda</div>
                        </div>
                        <I d={ICO.chevronRight} s={14} c={T.sub} />
                      </div>

                      {/* OPZIONE B · AZIONI EXTRA */}
                      <div style={{
                        padding: "14px 14px", borderRadius: 14,
                        background: "#fff", border: "2px solid " + T.bdr,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.blueLt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <I d={ICO.send} s={18} c={T.blue} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: "#0D1F1F" }}>Azioni extra prima di chiudere</div>
                            <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>Stampa · invia · esporta per altro gestionale</div>
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {/* Stampa PDF */}
                          <button onClick={() => {
                            try { exportPDF && exportPDF(); } catch(e) { console.warn(e); }
                            setCcDone("✓ PDF pronto"); setTimeout(() => setCcDone(null), 2500);
                          }} style={{
                            padding: "12px 8px", borderRadius: 10, border: "1.5px solid " + T.bdr, background: T.card, cursor: "pointer", fontFamily: "inherit",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          }}>
                            <I d={ICO.fileText} s={18} c={T.text} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: T.text }}>Stampa PDF</span>
                          </button>

                          {/* WhatsApp */}
                          <button onClick={() => {
                            const tel = (c.telefono || "").replace(/[^0-9+]/g, "");
                            const msg = `Ciao ${c.cliente || ""}, ti mando il riepilogo del rilievo fatto oggi.`;
                            const wa = `https://wa.me/${tel.startsWith("+") ? tel.slice(1) : "39" + tel}?text=${encodeURIComponent(msg)}`;
                            window.open(wa, "_blank");
                            setCcDone("✓ WhatsApp aperto"); setTimeout(() => setCcDone(null), 2500);
                          }} style={{
                            padding: "12px 8px", borderRadius: 10, border: "1.5px solid #25d36630", background: "#25d36608", cursor: "pointer", fontFamily: "inherit",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          }}>
                            <I d={ICO.send} s={18} c="#25d366" />
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#25d366" }}>WhatsApp</span>
                          </button>

                          {/* Export Excel gestionale */}
                          <button onClick={() => {
                            try { generaExcelFascicolo && generaExcelFascicolo(c, r); } catch(e) { console.warn(e); }
                            setCcDone("✓ Excel pronto per gestionale"); setTimeout(() => setCcDone(null), 2500);
                          }} style={{
                            padding: "12px 8px", borderRadius: 10, border: "1.5px solid #28A0A030", background: "#28A0A008", cursor: "pointer", fontFamily: "inherit",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          }}>
                            <I d={ICO.clipboard} s={18} c={T.acc} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: T.acc }}>Export gestionale</span>
                          </button>

                          {/* Invia a MASTRO Desktop */}
                          <button onClick={() => {
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, inviatoDesktop: true, dataInvioDesktop: new Date().toISOString().split("T")[0] } : cm));
                            setSelectedCM((prev: any) => ({ ...prev, inviatoDesktop: true }));
                            setCcDone("✓ Rilievo in coda MASTRO Desktop"); setTimeout(() => setCcDone(null), 2500);
                          }} style={{
                            padding: "12px 8px", borderRadius: 10, border: "1.5px solid #3B7FE030", background: "#3B7FE008", cursor: "pointer", fontFamily: "inherit",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          }}>
                            <I d={ICO.monitor} s={18} c={T.blue} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: T.blue }}>A MASTRO Desktop</span>
                          </button>
                        </div>

                        <div style={{ fontSize: 10, color: T.sub, marginTop: 10, textAlign: "center" as any, fontStyle: "italic" as any }}>
                          Quando hai fatto, torna indietro e premi "Chiudi e vai"
                        </div>
                      </div>
                    </div>
                  )}

                  {/*  PREVENTIVO (CUORE · LINK A WORKSPACE)  */}
                  {curCC.id === "preventivo" && !c.preventivoModoScelto && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 4, textAlign: "center" }}>Rilievo completato · Scegli cosa fare</div>

                      {/* CARD 1 — CHIUDI RILIEVO (ora apre bivio secondario) */}
                      <div onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoModoScelto: "chiuso_bivio" } : cm));
                        setSelectedCM((prev: any) => ({ ...prev, preventivoModoScelto: "chiuso_bivio" }));
                      }} style={{
                        padding: "18px 16px", borderRadius: 14, cursor: "pointer",
                        background: "#fff", border: "2px solid " + T.bdr,
                        display: "flex", alignItems: "center", gap: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#7B6BA515", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <I d={ICO.folder} s={20} c="#7B6BA5" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#0D1F1F", marginBottom: 2 }}>Chiudi rilievo</div>
                          <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.3 }}>Salva e vai al prossimo cliente · preventivo lo fai dopo in azienda</div>
                        </div>
                        <I d={ICO.chevronRight} s={16} c={T.sub} />
                      </div>

                      {/* CARD 2 — FAI PREVENTIVO */}
                      <div onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoModoScelto: "preventivo" } : cm));
                        setSelectedCM((prev: any) => ({ ...prev, preventivoModoScelto: "preventivo" }));
                      }} style={{
                        padding: "18px 16px", borderRadius: 14, cursor: "pointer",
                        background: T.acc, border: "2px solid " + T.acc,
                        display: "flex", alignItems: "center", gap: 12,
                        boxShadow: "0 4px 14px rgba(40,160,160,0.3)",
                      }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <I d={ICO.euro} s={20} c="#fff" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 2 }}>Preventivo al volo</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.3 }}>Hai già i prezzi · invia subito al cliente</div>
                        </div>
                        <I d={ICO.chevronRight} s={16} c="#fff" />
                      </div>
                    </div>
                  )}

                  {curCC.id === "preventivo" && c.preventivoModoScelto === "preventivo" && (
                    <div>
                      <div onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoModoScelto: null } : cm));
                        setSelectedCM((prev: any) => ({ ...prev, preventivoModoScelto: null }));
                      }} style={{ fontSize: 11, color: T.sub, cursor: "pointer", marginBottom: 10, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        ← Torna alla scelta
                      </div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{vaniCC.length} vani · {vaniConPrezzoCC.length} con prezzo</div>
                      
                      {/* Totale rapido */}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: `${T.acc}10`, borderRadius: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Totale + IVA {ivaPercCC}%</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{fmtCC(totIvaCC)}</span>
                      </div>

                      {/* SHORTCUT FISCALE · IVA · Detrazione · Documenti da allegare */}
                      {(() => {
                        const DETRAZIONI_LBL: any = { nessuna: "Nessuna detr.", "50": "Ristrutt. 50%", "65": "Ecobonus 65%", "75": "Barriere 75%" };
                        const ivaCur = c.ivaPerc || 10;
                        const detrCur = c.detrazione || "nessuna";
                        return (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                            <div onClick={() => { setPrevWorkspace(true); setPrevTab("fiscale"); }} style={{
                              padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                              background: "rgba(59,127,224,0.08)", border: "1.5px solid #3B7FE030",
                              display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#3B7FE015", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <I d={ICO.euro} s={13} c="#3B7FE0" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: "#3B7FE0" }}>Fiscale</div>
                                <div style={{ fontSize: 9, color: T.sub }}>IVA {ivaCur}% · {DETRAZIONI_LBL[detrCur] || "—"}</div>
                              </div>
                            </div>
                            <div onClick={() => { setPrevWorkspace(true); setPrevTab("condizioni"); }} style={{
                              padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                              background: "rgba(123,107,165,0.08)", border: "1.5px solid #7B6BA530",
                              display: "flex", alignItems: "center", gap: 8,
                            }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#7B6BA515", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <I d={ICO.fileText} s={13} c="#7B6BA5" />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 800, color: "#7B6BA5" }}>Condizioni</div>
                                <div style={{ fontSize: 9, color: T.sub }}>{c.condPagamento || "—"} · {c.tempiConsegna || "—"}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* BOTTONE PRINCIPALE */}
                      <button onClick={() => { setPrevWorkspace(true); setPrevTab("sopralluogo"); setEditingVanoId(null); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}><I d={ICO.clipboard} /> APRI PREVENTIVO →</button>

                      {/* BOTTONE INVIA DOCUMENTI AL CLIENTE */}
                      {(() => {
                        const detrCur = c.detrazione || "nessuna";
                        if (detrCur === "nessuna") return null;
                        const detrLbl: any = { "50": "Ristrutt. 50%", "65": "Ecobonus 65%", "75": "Barriere 75%" };
                        const docMap: any = {
                          "50": ["Bonifico parlante con causale specifica", "Fattura intestata al proprietario", "Comunicazione ENEA entro 90 gg fine lavori", "Codice fiscale proprietario"],
                          "65": ["Bonifico parlante", "Fattura intestata beneficiario", "Scheda tecnica infisso con Uw", "Asseverazione tecnico (geometra/ingegnere/arch)", "Trasmissione ENEA entro 90 gg"],
                          "75": ["Bonifico parlante", "Fattura con descrizione specifica intervento", "Eventuale CILA/SCIA al Comune"],
                        };
                        const docs = docMap[detrCur] || [];
                        return (
                          <button onClick={() => {
                            const tel = c.telefono || "";
                            const nome = c.cliente || "";
                            const msg = `Ciao ${nome},\n\nPer poter usufruire della *${detrLbl[detrCur]}* sui tuoi nuovi infissi, servono questi documenti:\n\n${docs.map((d: string, i: number) => `${i+1}. ${d}`).join("\n")}\n\nTi invio anche il preventivo in PDF. Se hai domande sulla pratica fiscale, chiamami.\n\nGrazie!`;
                            const cleanTel = tel.replace(/[^0-9+]/g, "");
                            const wa = `https://wa.me/${cleanTel.startsWith("+") ? cleanTel.slice(1) : "39" + cleanTel}?text=${encodeURIComponent(msg)}`;
                            window.open(wa, "_blank");
                            setCcDone("✓ WhatsApp aperto con documenti");
                            setTimeout(() => setCcDone(null), 3000);
                          }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "1.5px solid #25d366", background: "#25d36610", color: "#25d366", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 6 }}>
                            📋 Invia checklist documenti {detrLbl[detrCur]} via WhatsApp
                          </button>
                        );
                      })()}

                      <div style={{ textAlign: "center", marginTop: 2 }}>
                        <span onClick={() => {
                          setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoInviato: true, dataPreventivoInvio: new Date().toISOString().split("T")[0] } : cm));
                          setSelectedCM(prev => ({ ...prev, preventivoInviato: true }));
                          setCcDone("✓ Completato"); setTimeout(() => setCcDone(null), 3000);
                        }} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Già inviato? Segna come completato</span>
                      </div>

                      {/* STATO POST-INVIO: attesa cliente */}
                      {c.preventivoInviato && (
                        <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#fff8e1", border: "1px solid #ffc107" }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "#b8860b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>In attesa risposta cliente</div>
                          <div style={{ fontSize: 10, color: T.sub, marginBottom: 10 }}>
                            Preventivo inviato{c.dataPreventivoInvio ? ` il ${new Date(c.dataPreventivoInvio).toLocaleDateString("it-IT")}` : ""}. Segna la risposta quando arriva.
                          </div>
                          {rispostaCliente && rispostaCliente.risposta && (
                            <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: rispostaCliente.risposta === "accettato" ? "#D1FAE5" : rispostaCliente.risposta === "modifiche" ? "#FEF3C7" : "#DBEAFE", border: "1px solid " + (rispostaCliente.risposta === "accettato" ? "#10B981" : rispostaCliente.risposta === "modifiche" ? "#F59E0B" : "#3B82F6") }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: "#0D1F1F", marginBottom: 4 }}>
                                {rispostaCliente.risposta === "accettato" && "✓ Cliente ha accettato dal link!"}
                                {rispostaCliente.risposta === "modifiche" && "↻ Cliente chiede modifiche dal link"}
                                {rispostaCliente.risposta === "chiamare" && "📞 Cliente vuole essere chiamato"}
                              </div>
                              {rispostaCliente.risposta_nota && (
                                <div style={{ fontSize: 11, color: T.text, fontStyle: "italic", marginBottom: 4 }}>
                                  "{rispostaCliente.risposta_nota}"
                                </div>
                              )}
                              <div style={{ fontSize: 9, color: T.sub }}>
                                {rispostaCliente.risposta_at ? new Date(rispostaCliente.risposta_at).toLocaleString("it-IT") : ""}
                              </div>
                            </div>
                          )}
                          {rispostaCliente && !rispostaCliente.risposta && rispostaCliente.visualizzato && (
                            <div style={{ marginBottom: 10, padding: 8, borderRadius: 8, background: "#F3F4F6", fontSize: 10, color: T.sub }}>
                              👁 Cliente ha visualizzato il link{rispostaCliente.visualizzato_at ? " " + new Date(rispostaCliente.visualizzato_at).toLocaleString("it-IT") : ""} — sta decidendo
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <button onClick={() => {
                              setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoAccettato: true, dataPreventivoAccett: new Date().toISOString().split("T")[0] } : cm));
                              setSelectedCM((prev: any) => ({ ...prev, preventivoAccettato: true, dataPreventivoAccett: new Date().toISOString().split("T")[0] }));
                              setFaseTo(c.id, "conferma");
                              setCcDone("✓ Cliente accettato → Conferma"); setTimeout(() => setCcDone(null), 3000);
                            }} style={{ padding: "12px 10px", borderRadius: 8, border: "none", background: "#28A0A0", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                              ✓ Cliente OK
                            </button>
                            <button onClick={() => {
                              const nota = prompt("Cosa vuole modificare il cliente?");
                              if (nota === null) return;
                              const revEntry = { motivo: nota || "Modifiche richieste", quando: new Date().toISOString() };
                              setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoInviato: false, preventivoRevisioni: [...(cm.preventivoRevisioni || []), revEntry] } : cm));
                              setSelectedCM((prev: any) => ({ ...prev, preventivoInviato: false, preventivoRevisioni: [...(prev.preventivoRevisioni || []), revEntry] }));
                              setCcDone("Riaperto per modifiche"); setTimeout(() => setCcDone(null), 3000);
                            }} style={{ padding: "12px 10px", borderRadius: 8, border: "1.5px solid #ff9500", background: "#fff", color: "#ff9500", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                              ↻ Richiede modifiche
                            </button>
                          </div>
                          {(c.preventivoRevisioni && c.preventivoRevisioni.length > 0) && (
                            <div style={{ marginTop: 10, padding: "6px 8px", background: "#fff", borderRadius: 6, fontSize: 10, color: T.sub }}>
                              <strong>Revisioni ({c.preventivoRevisioni.length})</strong>: {c.preventivoRevisioni[c.preventivoRevisioni.length-1].motivo}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CARD TAVOLA TECNICA */}
                      {(() => {
                        const vaniAttivi = (selectedRilievo?.vani || []).filter((v) => !!v.sistema && (v.misure?.lCentro || v.misure?.lAlto) && (v.misure?.hCentro || v.misure?.hSx));
                        const canGenerate = vaniAttivi.length > 0;
                        return (
                          <div style={{ marginTop: 14, padding: 14, background: "#F4F9F9", borderRadius: 12, border: `1px solid ${T.bdr}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: canGenerate ? "linear-gradient(135deg, #2D7A6B, #1A9E73)" : "#C8D4D4", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                                <I d={ICO.ruler} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Tavola Tecnica</div>
                                <div style={{ fontSize: 10, color: T.sub }}>Vista frontale - Nodi - Specifiche - Trasmittanza Uw</div>
                              </div>
                              {canGenerate && <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: `${T.grn}15`, color: T.grn }}>{vaniAttivi.length} vani</span>}
                            </div>
                            {canGenerate ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                {vaniAttivi.map((v) => (
                                  <button key={v.id} onClick={() => {
                                    try {
                                      const ctx = { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [],
                                        cliente: c.cliente || c.nome || "", cognome: c.cognome || "",
                                        commessaCode: c.code || c.id || "", commessaData: c.data || "" };
                                      generaTavolaTecnica(v, ctx);
                                    } catch(err) {
                                      alert("Errore Tavola Tecnica: " + (err?.message || err));
                                    }
                                  }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{v.nome || `Vano ${v.id}`}</div>
                                      <div style={{ fontSize: 9, color: T.sub }}>{v.tipo || "-"} - {v.sistema || "-"} - {v.misure?.lCentro || v.misure?.lAlto || "?"}x{v.misure?.hCentro || v.misure?.hSx || "?"}mm</div>
                                    </div>
                                    <span style={{ fontSize: 11, color: T.acc, fontWeight: 800 }}>PDF</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: T.sub, textAlign: "center", padding: "10px 4px", fontStyle: "italic" }}>Completa misure e sistema di almeno un vano per generare</div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/*  CONFERMA (firma + fattura acconto)  */}
                  {curCC.id === "conferma" && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale: €{fmtCC(totIvaCC)} (IVA {ivaPercCC}% incl.)</div>
                      {c.firmaCliente && (
                        <div style={{ marginBottom: 10, padding: 12, borderRadius: 10, background: "#28A0A012", border: "1px solid #28A0A030" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 18 }}>✓</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 800, color: "#28A0A0" }}>Firma ricevuta</div>
                              <div style={{ fontSize: 10, color: T.sub }}>{c.dataFirma ? new Date(c.dataFirma).toLocaleDateString("it-IT") : ""}</div>
                            </div>
                          </div>
                          {c.firmaDocumento?.dataUrl && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => {
                                if (!c.firmaDocumento?.dataUrl) return;
                                const w = window.open("");
                                w?.document.write(`<iframe src="${c.firmaDocumento.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`);
                              }} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #28A0A0", background: "#fff", color: "#28A0A0", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                Vedi documento
                              </button>
                              <a href={c.firmaDocumento.dataUrl} download={c.firmaDocumento.nome || "documento_firmato.pdf"} style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #28A0A0", background: "#28A0A0", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "center", textDecoration: "none", boxSizing: "border-box" as const }}>
                                Scarica PDF
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {fattCC.length > 0 && (
                        <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#fff", border: "1px solid " + T.bdr }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Fatture emesse</div>
                          {fattCC.map((f, i) => (
                            <div key={f.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < fattCC.length - 1 ? "1px solid " + T.bdr : "none" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>N° {f.numero}/{f.anno} · €{fmtCC(f.importo || 0)}</div>
                                <div style={{ fontSize: 10, color: T.sub }}>{f.tipo} · {f.data}</div>
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: f.pagata ? "#D1FAE5" : "#FEF3C7", color: f.pagata ? "#10B981" : "#D08008" }}>
                                {f.pagata ? "Pagata" : "Da incassare"}
                              </span>
                            </div>
                          ))}
                          <button onClick={() => { if (typeof setTab === "function") setTab("contabilita"); }} style={{ marginTop: 8, width: "100%", padding: "7px 10px", borderRadius: 6, border: "1px solid " + T.acc, background: "#fff", color: T.acc, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                            Apri contabilità →
                          </button>
                        </div>
                      )}
                      {firmaStep === 0 ? (
                        <div>
                          <button onClick={() => setShowModalFirma(true)} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 4 }}><I d={ICO.upload} /> GENERA PDF + INVIA CON FIRMA {"->"}</button>
                          <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginBottom: 6 }}>Scarica PDF e invia link firma elettronica via WhatsApp</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button onClick={() => generaPreventivoPDF(c, { aziendaInfo: aziendaInfo || {}, sistemiDB: sistemiDB || [], vetriDB: vetriDB || [] })} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #28A0A0", background: "#28A0A012", color: "#28A0A0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.fileText} /> Solo PDF</button>
                            <button onClick={() => setFirmaStep(1)} style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #28A0A0", background: "#28A0A012", color: "#28A0A0", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Già firmato? Carica</button>
                          </div>
                        </div>
                      ) : !firmaFileUrl ? (
                        <div>
                          {/* Bottone link firma digitale */}
                          <div style={{ marginBottom: 12 }}>
                            <button onClick={async () => {
                              try {
                                const res = await fetch("/api/firma", { method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "genera", data: { cmId: c.id, cmCode: c.code, cliente: `${c.cliente} ${c.cognome||""}`.trim(), importo: totIvaCC, descrizione: `Preventivo ${c.code} - ${vaniCC.length} vani` } }) });
                                const d = await res.json();
                                if (d.url) {
                                  setFirmaToken(d.token);
                                  const fullUrl = window.location.origin + d.url;
                                  await navigator.clipboard.writeText(fullUrl).catch(() => {});
                                  setFirmaLinkCopiato(true);
                                  setTimeout(() => setFirmaLinkCopiato(false), 4000);
                                  // Polling per verificare se cliente ha firmato
                                  const poll = setInterval(async () => {
                                    const r2 = await fetch("/api/firma", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", token: d.token }) });
                                    const d2 = await r2.json();
                                    if (d2.firmato) {
                                      clearInterval(poll);
                                      setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, firmaCliente: true, dataFirma: d2.firmaDataOra } : cm));
                                      setSelectedCM(prev => ({ ...prev, firmaCliente: true }));
                                      setCcDone("Firma ricevuta!");
                                      setTimeout(() => setCcDone(null), 3000);
                                    }
                                  }, 5000);
                                  setTimeout(() => clearInterval(poll), 10 * 60 * 1000); // max 10 min
                                }
                              } catch { setCcDone("Errore generazione link"); }
                            }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
                              Invia link firma al cliente
                            </button>
                            {firmaLinkCopiato && (
                              <div style={{ background: "#F0FDF9", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.grn, fontWeight: 600, textAlign: "center" }}>
                                Link copiato! Incollalo su WhatsApp al cliente
                              </div>
                            )}
                            {firmaToken && !firmaLinkCopiato && (
                              <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>
                                In attesa della firma del cliente...
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginBottom: 8 }}>oppure</div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Carica il documento firmato dal cliente</div>
                          <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/pdf,image/*"; inp.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (!f) return; setFirmaFileName(f.name); const r = new FileReader(); r.onload = (e) => setFirmaFileUrl(e.target?.result as string); r.readAsDataURL(f); }; inp.click(); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: `2px dashed ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.download} /> CARICA FIRMATO</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ padding: 8, borderRadius: 8, background: "#28A0A012", marginBottom: 6, fontSize: 11, color: "#28A0A0", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            <I d={ICO.paperclip} />
                            <span onClick={() => { if (firmaFileUrl) { const w = window.open(""); w?.document.write(`<iframe src="${firmaFileUrl}" style="width:100%;height:100vh;border:none"></iframe>`); } }} style={{ flex: 1, cursor: "pointer", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{firmaFileName}</span>
                            <a href={firmaFileUrl || "#"} download={firmaFileName} style={{ fontSize: 10, color: "#28A0A0", cursor: "pointer", textDecoration: "none", flexShrink: 0 }}>🔗</a>
                            <span onClick={() => { setFirmaFileUrl(null); setFirmaFileName(""); }} style={{ cursor: "pointer", flexShrink: 0 }}>✓</span>
                          </div>
                          <button onClick={() => {
                            const all = { id: Date.now(), tipo: "firma", nome: firmaFileName, dataUrl: firmaFileUrl };
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0], firmaDocumento: all, allegati: [...(cm.allegati || []), all] } : cm));
                            setSelectedCM(prev => ({ ...prev, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0] }));
                            setFirmaStep(0); setFirmaFileUrl(null); setFirmaFileName("");
                            setCcDone("✓ Firma registrata!"); setTimeout(() => setCcDone(null), 3000);
                          }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMA FIRMA →</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/*  ORDINI  */}
                  {curCC.id === "ordini" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.sistema || "·"}</div>
                      <div style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 120, overflow: "auto" }}>
                        {vaniCC.map((v, vi) => (
                          <div key={vi} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: vi < vaniCC.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                            <span style={{ color: T.text, fontWeight: 600 }}>{v.nome || v.tipo || `Vano ${vi + 1}`}</span>
                            <span style={{ color: T.acc, fontWeight: 700 }}>{(v.larghezza || v.l || 0)}{(v.altezza || v.h || 0)}</span>
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

                          {/* · MODAL IMPORTO ACCONTO · */}
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
                                    setCcDone("✓ Fattura creata!");
                                    setTimeout(() => setCcDone(null), 3000);
                                  }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CREA FATTURA €{fmtCC(parseFloat(accontoImporto) || 0)}</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {ordCC.length > 0 && (
                        <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#fff", border: "1px solid " + T.bdr }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Ordini creati</div>
                          {ordCC.map((o, i) => {
                            const fornNome = typeof o.fornitore === "object" ? (o.fornitore?.nome || "Fornitore") : (o.fornitore || "Fornitore");
                            return (
                              <div key={o.id || i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < ordCC.length - 1 ? "1px solid " + T.bdr : "none" }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>N {o.numero}/{o.anno} - {fornNome || "Da assegnare"}</div>
                                  <div style={{ fontSize: 10, color: T.sub }}>{(o.righe?.length) || 0} voci - {o.dataOrdine}</div>
                                </div>
                                <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 5, background: o.conferma?.ricevuta ? "#D1FAE5" : "#FEF3C7", color: o.conferma?.ricevuta ? "#10B981" : "#D08008" }}>
                                  {o.conferma?.ricevuta ? "Confermato" : "Inviato"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button onClick={() => setShowOrdinePreview(true)} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.package} /> CREA ORDINE FORNITORE →</button>

                      {/* · MODAL ANTEPRIMA ORDINE FORNITORE · */}
                      {showOrdinePreview && (() => {
                        const prevVani = getVaniAttivi(c);
                        const prevRighe = prevVani.map(v => {
                          const tipLabel = TIPOLOGIE_RAPIDE.find((t: any) => t.code === v.tipo)?.label || v.tipo || "·";
                          const m = v.misure || {};
                          const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
                          const prezzo = calcolaVanoPrezzo(v, c);
                          return {
                            desc: `${tipLabel} · ${v.stanza || ""} ${v.piano || ""}`.trim(),
                            misure: lmm > 0 && hmm > 0 ? `${lmm}x${hmm} mm` : "da definire",
                            qta: v.pezzi || 1,
                            prezzoUnit: Math.round(prezzo * 100) / 100,
                            totale: Math.round(prezzo * (v.pezzi || 1) * 100) / 100,
                            colore: v.coloreEst || "",
                          };
                        });
                        const prevTot = prevRighe.reduce((s, r) => s + r.totale, 0);
                        const ivaPercOrd = (c.ivaPerc || 22) / 100; const prevTotIva = Math.round(prevTot * (1 + ivaPercOrd) * 100) / 100;
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
                                <div onClick={() => setShowOrdinePreview(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: T.sub }}>✓</div>
                              </div>

                              {/* Info fornitore */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>Fornitore</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.sistema?.split(" ")[0] || "·"}</div>
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
                                  <span style={{ color: T.sub }}>IVA {c.ivaPerc || 22}%</span>
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
                                  ⏹+ Alcuni vani non hanno prezzo · verranno inclusi come €0,00
                                </div>
                              )}

                              {/* Note ordine */}
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as any }}>Note per il fornitore</div>
                                <textarea value={noteOrdine} onChange={e => setNoteOrdine(e.target.value)} placeholder="Consegna urgente, RAL, riferimento..." rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.bg, color: T.text, fontSize: 11, resize: "none" as any, boxSizing: "border-box" as any, fontFamily: "inherit" }} />
                              </div>
                              {/* Bottoni */}
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setShowOrdinePreview(false)} style={{ flex: 1, padding: 13, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                                <button onClick={() => {
                                  creaOrdineFornitore(c, c.sistema?.split(" ")[0] || "", noteOrdine || ""); setNoteOrdine("");
                                  setSelectedCM((prev: any) => ({ ...prev }));
                                  setShowOrdinePreview(false);
                                  setCcDone("✓ Ordine creato!");
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

                  {/*  PRODUZIONE  */}
                  {curCC.id === "produzione" && (
                    <div>
                      {ordCC.length > 0 && (
                        <div style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                          {ordCC.map((o, oi) => (
                            <div key={oi} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                              <span style={{ fontWeight: 600 }}>{typeof o.fornitore === "object" ? (o.fornitore?.nome || "Fornitore") : (o.fornitore || "Fornitore")}</span>
                              <span style={{ color: o.conferma?.ricevuta ? T.grn : T.orange, fontWeight: 700 }}>
                                {o.conferma?.firmata ? "✓ Confermato" : o.conferma?.ricevuta ? "📋 Conferma ricevuta" : "📐 In attesa"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!ordConfCC ? (
                        <button onClick={() => apriInboxDocumento(c.id, "conferma")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#af52de", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.download} /> CARICA CONFERMA FORNITORE →</button>
                      ) : ccConfirm !== "conferma_ok" ? (
                        <button onClick={() => setCcConfirm("conferma_ok")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ APPROVA E AVVIA PRODUZIONE →</button>
                      ) : (
                        <div style={{ background: "#28A0A012", borderRadius: 10, padding: 12, border: "1px solid #28A0A030" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#28A0A0", marginBottom: 4 }}>Confermi avvio produzione?</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                            <button onClick={() => { setOrdiniFornDB(prev => prev.map(o => o.cmId === c.id ? { ...o, conferma: { ...o.conferma, firmata: true } } : o)); setCcConfirm(null); setCcDone("✓ Produzione avviata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMO</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/*  POSA  */}
                  {curCC.id === "posa" && (
                    <div>
                      {/* Montaggi gi+ pianificati */}
                      {montCC.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          {montCC.map((m, mi) => {
                            const st = m.interventoStato || m.stato || "programmato";
                            const isDone = ["completato","collaudo","chiuso"].includes(st);
                            const sq = squadreDB.find(s => s.id === m.squadraId);
                            return (
                              <div key={mi} style={{ background: T.card, border: `1.5px solid ${isDone ? "#28A0A040" : T.bdr}`, borderRadius: 10, padding: "10px 12px", marginBottom: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <div>
                                    <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>
                                      {m.data ? new Date(m.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "Data da definire"} · {m.orario || ""}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>
                                      {sq?.nome || "Squadra"} · {m.durata || `${m.giorni || 1}g`}
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: isDone ? "#28A0A020" : "#F5A62320", color: isDone ? "#28A0A0" : "#D08008", textTransform: "uppercase" as any, letterSpacing: "0.3px" }}>
                                    {st}
                                  </span>
                                </div>
                                {!isDone && (
                                  <button onClick={() => {
                                    setMontaggiDB(prev => prev.map(x => x.id === m.id ? { ...x, stato: "completato", interventoStato: "completato", dataCompletamento: new Date().toISOString() } : x));
                                    setCcDone("✓ Montaggio completato!"); setTimeout(() => setCcDone(null), 3000);
                                  }} style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: "#28A0A0", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                                    <I d={ICO.check} /> Montaggio completato
                                  </button>
                                )}
                                {isDone && (
                                  <div style={{ fontSize: 11, color: "#28A0A0", fontWeight: 700, textAlign: "center", padding: "4px 0" }}>
                                    ✓ Completato · vai al Collaudo
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {!montFormOpen ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.indirizzo || "·"}</div>
                          <button onClick={() => { setMontFormOpen(true); setMontGiorni(1); setMontFormData({ data: "", orario: "08:00", durata: "giornata", squadraId: squadreDB[0]?.id || "", note: "" }); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.wrench} /> {montCC.length > 0 ? "AGGIUNGI MONTAGGIO →" : "PIANIFICA MONTAGGIO →"}</button>
                        </div>
                      ) : (
                        <div style={{ background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
                          <input type="date" value={montFormData.data} onChange={e => { setMontFormData(p => ({ ...p, data: e.target.value })); setWorkWeekend(null); }} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as any, marginBottom: 6 }} />

                          {/* Mini calendario squadre · 3 settimane + anteprima */}
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
                                  <span onClick={() => { const p = new Date(baseDay); p.setDate(p.getDate() - 7); setMontFormData(prev => ({ ...prev, data: fmtD(p) })); }} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: T.acc, padding: '4px 8px' }}>{"📅"}</span>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Disponibilit+ squadre
                                  </span>
                                  <span onClick={() => { const n = new Date(baseDay); n.setDate(n.getDate() + 21); setMontFormData(prev => ({ ...prev, data: fmtD(n) })); }} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: T.acc, padding: '4px 8px' }}>{"📷"}</span>
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
                                                    <div style={{ fontSize: 8, fontWeight: 800, color: T.acc }}>{"+"}</div>
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
                                  {previewDays.size > 0 && <span><span style={{ color: T.acc, fontWeight: 800 }}>{"+"}</span> Nuovo montaggio ({montGiorni}g)</span>}
                                  {previewDays.size > 0 && Array.from(previewDays).some(pd => (montaggiDB || []).some(m => m.data === pd && (m.squadraId === selSquadId))) && <span style={{ color: '#ff3b30', fontWeight: 700 }}>{"+"} Sovrapposizione!</span>}
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
                                  // Oppure se la data di partenza  sab/dom
                                  const startDow = pStart.getDay();
                                  if (startDow === 6 || startDow === 0) hasWeekendInRange = true;
                                  if (!hasWeekendInRange) { if (workWeekend !== null) setWorkWeekend(null); return null; }
                                  if (workWeekend !== null) return null; // gi+ risposto
                                  return (
                                    <div style={{ margin: '4px 8px 6px', padding: '8px 10px', borderRadius: 8, background: '#FF9F0A18', border: '1px solid #FF9F0A60' }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F0A', marginBottom: 6 }}>📐 Il periodo include sabato/domenica. Lavori anche nel weekend?</div>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setWorkWeekend(true)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: '#FF9F0A', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✓ S, lavoro</button>
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
                              <button onClick={() => setMontGiorni(Math.max(0.5, montGiorni - 0.5))} style={{ width: 32, height: 38, border: `1px solid ${T.bdr}`, borderRadius: "8px 0 0 8px", background: T.card, fontSize: 16, cursor: "pointer" }}>✕</button>
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
                              setCcDone("✓ Montaggio pianificato!"); setTimeout(() => setCcDone(null), 3000);
                            }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMA</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/*  COLLAUDO  */}
                  {curCC.id === "collaudo" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Verifica il montaggio, scatta foto finale e fai firmare il collaudo</div>
                      <button onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, collaudoOk: true, dataCollaudo: new Date().toISOString().split("T")[0] } : cm));
                        setSelectedCM(prev => ({ ...prev, collaudoOk: true, dataCollaudo: new Date().toISOString().split("T")[0] }));
                        setCcDone("✓ Collaudo completato!"); setTimeout(() => setCcDone(null), 3000);
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#5856d6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.search} /> SEGNA COLLAUDO OK →</button>
                    </div>
                  )}

                  {/*  CHIUSURA  */}
                  {curCC.id === "chiusura" && (() => {
                    const saldoFatCC = fattCC.find(f => f.tipo === "saldo" || f.tipo === "unica");
                    const saldoPagatoCC = saldoFatCC?.pagata;
                    const restoCC = totIvaCC - incassatoCC;
                    return (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>
                        Incassato €{fmtCC(incassatoCC)} su €{fmtCC(totIvaCC)} {restoCC > 0 ? `· Resta €${fmtCC(restoCC)}` : "· ✓ Tutto incassato"}
                      </div>
                      {!saldoFatCC && restoCC > 0 && (
                        ccConfirm !== "saldo" ? (
                          <button onClick={() => setCcConfirm("saldo")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.euro} /> FATTURA SALDO €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: T.acc + "10", borderRadius: 10, padding: 12, border: `1px solid ${T.acc}30` }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.acc, marginBottom: 4 }}>Fattura saldo €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => { creaFattura(c, restoCC === totIvaCC ? "unica" : "saldo"); setCcConfirm(null); setCcDone("✓ Fattura saldo creata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CREA FATTURA</button>
                            </div>
                          </div>
                        )
                      )}
                      {saldoFatCC && !saldoPagatoCC && (
                        ccConfirm !== "pagata" ? (
                          <button onClick={() => setCcConfirm("pagata")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ SEGNA PAGATA €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: "#28A0A012", borderRadius: 10, padding: 12, border: "1px solid #28A0A030" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#28A0A0", marginBottom: 4 }}>Conferma pagamento €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => {
                                setFattureDB(prev => prev.map(f => f.cmId === c.id && !f.pagata ? { ...f, pagata: true, dataPagamento: new Date().toISOString().split("T")[0], metodoPagamento: "Bonifico" } : f));
                                setFaseTo(c.id, "chiusura");
                                setCcConfirm(null); setCcDone("✓ Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000);
                              }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMO INCASSO</button>
                            </div>
                          </div>
                        )
                      )}
                      {!saldoFatCC && restoCC <= 0 && (
                        <button onClick={() => { setFaseTo(c.id, "chiusura"); setCcDone("✓ Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CHIUDI COMMESSA →</button>
                      )}
                    </div>
                    );
                  })()}

                  {/*  PULSANTE SALTA  */}
                  {curCC && !curCC.done && curCC.id !== "chiusura" && (
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <span onClick={() => {
                        const skipIdx = stepsCC.findIndex(s => s.id === curCC.id);
                        if (skipIdx >= 0 && skipIdx < stepsCC.length - 1) {
                          const skipNote = prompt("Motivo per saltare '" + curCC.l + "':");
                          if (skipNote !== null) {
                            const nuovoSkip = { fase: curCC.id, motivo: skipNote, quando: new Date().toISOString() };
                            const nextStep = stepsCC[skipIdx + 1];
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, skipLog: [...(cm.skipLog || []), nuovoSkip], fase: nextStep?.id || cm.fase } : cm));
                            setSelectedCM((prev: any) => ({ ...prev, skipLog: [...(prev.skipLog || []), nuovoSkip], fase: nextStep?.id || prev.fase }));
                            if (nextStep) setFaseTo(c.id, nextStep.id);
                            setCcDone(`⏭ ${curCC.l} saltato`); setTimeout(() => setCcDone(null), 3000);
                          }
                        }
                      }} style={{ display: "inline-block", marginTop: 8, padding: "6px 14px", borderRadius: 6, border: "1px solid #ff950050", background: "#ff950012", color: "#ff9500", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>⏭ Salta questo passaggio</span>
                    </div>
                  )}
                </div>
              )}
              {/* Totale - hide when selectedRilievo (v67) */}
              {!selectedRilievo && totPrevCC > 0 && (
                <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Totale IVA incl.</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{fmtCC(totIvaCC)}</span>
                </div>
              )}
            </div>
          );
        })()}


        {/* == TAB: vani / visite / info - hide when selectedRilievo active (v67) == */}
        {!selectedRilievo && (
        <div id="cm-tab-vani" style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, margin: "0 0 0 0" }}>
          {[
            {k:"visite",l:`Rilievi (${(c.rilievi||[]).length})`},
            {k:"sopralluoghi",l:`Vani (${vaniList.length})`},
            {k:"info",l:"ℹ Info"},
          ].map(t => (
            <div key={t.k} onClick={() => setCmSubTab(t.k)} style={{
              flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderBottom: `2px solid ${cmSubTab === t.k ? T.acc : "transparent"}`,
              color: cmSubTab === t.k ? T.acc : T.sub
            }}>{t.l}</div>
          ))}
        </div>
        )}

        {/* == TAB VISITE (timeline sopralluoghi) == */}
        {cmSubTab === "visite" && (
          <div style={{ padding: "12px 16px" }}>
            {/* Stato misure globale */}
            <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, textAlign: "center", fontSize: 12, fontWeight: 700,
              background: c.firmaCliente ? "#28A0A012" : "#ff950012",
              color: c.firmaCliente ? "#28A0A0" : "#ff9500",
              border: `1px solid ${c.firmaCliente ? "#28A0A030" : "#ff950030"}`,
            }}>
              {c.firmaCliente
                ? "✓ Misure definitive · cliente ha firmato"
                : `+ Misure indicative · ${(c.rilievi||[]).length} ${(c.rilievi||[]).length === 1 ? "visita" : "visite"} effettuate`}
            </div>

            {/* Bottone nuovo rilievo in tab Visite */}
            {!c.firmaCliente && (
              <button onClick={() => {
                setNuovoRilievoTipo("provvisorio");
                setNuovoRilievoRilevatore("");
                setNuovoRilievoNote("");
                setShowNuovoRilievoModal(true);
              }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "#28A0A0", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}>
                + NUOVO RILIEVO
              </button>
            )}

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
                        {ril.data ? new Date(ril.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "·"}
                      </span>
                      {ril.ora && <span style={{ fontSize: 11, color: T.sub }}>ore {ril.ora}</span>}
                      {isLast && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: tipoCol, color: "#fff" }}>ATTUALE</span>}
                      {ril.tipo === "modifica" && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#ff9500", color: "#fff" }}>MODIFICA</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>
                      {ril.rilevatore || "·"} · {nVani} vani · {nMisurati === nVani && nVani > 0 ? "✓ tutte le misure" : `${nMisurati}/${nVani} misurati`}
                    </div>
                    {ril.motivoModifica && <div style={{ fontSize: 11, color: "#ff9500", marginTop: 2 }}><I d={ICO.wrench} /> {ril.motivoModifica}</div>}
                    {ril.note && <div style={{ fontSize: 11, color: T.sub, marginTop: 2, fontStyle: "italic" }}>"{ril.note}"</div>}
                    {ril._ereditatiCount > 0 && <div style={{ fontSize: 10, color: "#28A0A0", marginTop: 2 }}><I d={ICO.clipboard} /> {ril._ereditatiCount} vani ereditati da R{ril.n - 1}</div>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14, alignSelf: "center" }}>📷</span>
                </div>
              );
            })}
          </div>
        )}

        {/* == TAB VANI (lista vani del rilievo) == */}
        {cmSubTab === "sopralluoghi" && (
          <div style={{ padding: "0 16px 14px" }}>
            {/* ═══ SUB-HERO RILIEVO (v52 · coerente con pagina 1) ═══ */}
            {r && (() => {
              const nVani = (r.vani || []).length;
              const nMisurati = (r.vani || []).filter((v: any) => Object.values(v.misure || {}).filter((x: any) => (x as number) > 0).length >= 6).length;
              const prog = nVani > 0 ? Math.round((nMisurati / nVani) * 100) : 0;
              const tipoMap: any = {
                provvisorio: { l: "Provvisorio", bg: "#FAC775", c: "#412402" },
                verificato:  { l: "Verificato",  bg: "#9FC6F0", c: "#0A2842" },
                definitivo:  { l: "Definitivo",  bg: "#A5DCC6", c: "#04342C" },
                da_rivedere: { l: "Da rivedere", bg: "#F7B5B5", c: "#4B1515" },
                indicativa:  { l: "Provvisorio", bg: "#FAC775", c: "#412402" },
                personalizzato: { l: "Personalizzato", bg: "#B5B0E8", c: "#26215C" },
              };
              const tt = tipoMap[r.tipo || "provvisorio"] || tipoMap.provvisorio;
              const dataFmt = r.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }) : null;
              return (
                <div style={{
                  background: "linear-gradient(145deg, #5FD0D0 0%, #28A0A0 50%, #1A7A7A 100%)",
                  borderRadius: 16, padding: "14px 16px", marginBottom: 12,
                  boxShadow: "0 6px 18px rgba(31,120,120,0.25), inset 0 1px 2px rgba(255,255,255,0.25)",
                  position: "relative" as any, overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: -20, right: -15, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.15), transparent 70%)", pointerEvents: "none" as any }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12,
                      background: "rgba(255,255,255,0.22)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.15)",
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>R{r.n || 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: "-0.2px", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>Rilievo R{r.n || 1}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 6, background: tt.bg, color: tt.c, textTransform: "uppercase" as any, letterSpacing: "0.3px" }}>{tt.l}</span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                        {dataFmt || "senza data"}
                        {r.rilevatore ? ` · ${r.rilevatore}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" as any, flexShrink: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", lineHeight: 1, textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{prog}%</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", fontWeight: 600, marginTop: 2 }}>{nMisurati}/{nVani} vani</div>
                    </div>
                  </div>
                  {nVani > 0 && (
                    <div style={{ marginTop: 10, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog}%`, background: "rgba(255,255,255,0.9)", borderRadius: 2, transition: "width 0.3s" }} />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Rilievo selector - mostra quale stai guardando */}
            {(c.rilievi||[]).length > 1 && r && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0 12px", marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: T.sub, letterSpacing: "0.5px", textTransform: "uppercase" as any, marginRight: 2 }}>Altri rilievi:</div>
                {(c.rilievi||[]).map((ril, ridx) => {
                  const isSel = ril.id === r.id;
                  const isLast = ridx === (c.rilievi||[]).length - 1;
                  return (
                    <div key={ril.id} onClick={() => setSelectedRilievo(ril)}
                      style={{
                        padding: "5px 11px", borderRadius: 9, cursor: "pointer",
                        fontSize: 11, fontWeight: 800,
                        background: isSel ? "linear-gradient(145deg, #5FD0D0, #1A7A7A)" : "#fff",
                        color: isSel ? "#fff" : T.sub,
                        border: `1.5px solid ${isSel ? "transparent" : T.bdr}`,
                        boxShadow: isSel ? "0 3px 8px rgba(40,160,160,0.35)" : "none",
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                      R{ril.n} {!isLast && isSel ? "🔒" : ""}
                    </div>
                  );
                })}
              </div>
            )}
            {/*  BANNER STORICO  */}
            {isStorico && (
              <div style={{
                padding: "12px 14px", borderRadius: 12, marginBottom: 12,
                background: "linear-gradient(145deg, #F3F1FE, #EEEDFE)",
                border: "1.5px solid #B5B0E8",
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 2px 8px rgba(88,86,214,0.1)",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(88,86,214,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <I d={ICO.lock} s={18} c="#5856d6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#3C3489", letterSpacing: "0.2px" }}>Rilievo storico R{r?.n} · sola lettura</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#5856d6aa", marginTop: 2 }}>Solo R{lastRilievo?.n} (più recente) è modificabile</div>
                </div>
                <div onClick={() => { if (lastRilievo) setSelectedRilievo(lastRilievo); }} style={{
                  padding: "7px 12px", borderRadius: 9,
                  background: "linear-gradient(145deg, #5FD0D0, #1A7A7A)",
                  color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer",
                  whiteSpace: "nowrap" as any,
                  boxShadow: "0 3px 8px rgba(40,160,160,0.35)",
                  flexShrink: 0,
                }}>
                  R{lastRilievo?.n} →
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
                  <></>
                )}
              </div>
            ) : vaniList.map(v => {
              const nMisure = Object.values(v.misure||{}).filter(x=>(x as number)>0).length;
              const completo = nMisure >= 6;
              const bloccato = v.note?.startsWith("+ BLOCCATO");
              const colore = bloccato ? T.red : completo ? T.grn : T.orange;
              const coloreBg = bloccato ? T.redLt : completo ? T.grnLt : T.orangeLt;
              const nFoto = Object.keys(v.foto || {}).length;
              return (
                <div key={v.id} onClick={() => { console.log("CLICK VANO", v?.id, v?.nome); setSelectedVano(v); setVanoStep(0); }}
                  style={{
                    background: "#fff",
                    borderRadius: 14,
                    marginBottom: 10,
                    padding: "14px 14px",
                    cursor: "pointer",
                    boxShadow: "0 3px 10px rgba(31,120,120,0.08)",
                    border: `1px solid ${T.bdr}`,
                    borderLeft: `4px solid ${colore}`,
                    display: "flex", alignItems: "center", gap: 12,
                    transition: "transform 0.15s",
                  }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 11,
                    background: coloreBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, border: `1.5px solid ${colore}35`,
                  }}>
                    <I d={bloccato ? ICO.alertTriangle : completo ? ICO.checkCircle : ICO.grid} s={20} c={colore} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0D1F1F", whiteSpace: "nowrap" as any, overflow: "hidden", textOverflow: "ellipsis" }}>{v.nome}</span>
                      {(() => {
                        const rIdx = c.rilievi?.findIndex(r2 => r2.vani?.some(vv => vv.id === v.id));
                        if (rIdx == null || rIdx < 0) return null;
                        return (
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
                            background: T.bg, color: T.sub, letterSpacing: "0.3px",
                          }}>R{rIdx + 1}</span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as any }}>
                      {v.tipo && <span>{v.tipo}</span>}
                      {v.tipo && v.stanza && <span>·</span>}
                      {v.stanza && <span>{v.stanza}</span>}
                      {(v.stanza || v.tipo) && v.piano && <span>·</span>}
                      {v.piano && <span>piano {v.piano}</span>}
                      {!v.tipo && !v.stanza && !v.piano && <span style={{ fontStyle: "italic" as any }}>da configurare</span>}
                    </div>
                    {bloccato && (
                      <div style={{ fontSize: 10, color: T.red, marginTop: 4, fontWeight: 700 }}>
                        <I d={ICO.alertTriangle} s={10} /> {v.note?.replace("+ BLOCCATO: ", "")}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" as any, alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, color: "#fff",
                      background: `linear-gradient(145deg, ${colore}, ${colore}dd)`,
                      borderRadius: 6, padding: "3px 9px",
                      boxShadow: `0 2px 5px ${colore}40`,
                      letterSpacing: "0.3px", textTransform: "uppercase" as any,
                    }}>
                      {v.pezzi || 1} {(v.pezzi || 1) === 1 ? "pz" : "pz"}
                    </span>
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      {nFoto > 0 && (
                        <span style={{ fontSize: 10, color: T.sub, fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>
                          <I d={ICO.camera} s={10} /> {nFoto}
                        </span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, color: colore }}>
                        {bloccato ? "bloccato" : completo ? `${nMisure} mis.` : nMisure === 0 ? "da misurare" : `${nMisure}/6 mis.`}
                      </span>
                    </div>
                  </div>
                  <I d={ICO.chevronRight} s={16} c={T.sub} />
                </div>
              );
            })}
            {vaniList.length > 0 && !isStorico && (
              <div onClick={() => {
                if (!selectedCM || !selectedRilievo) return;
                // Se rilievo complesso, apri modal invece di creare direttamente
                if (selectedRilievo.complesso) {
                  setNvL1(""); setNvL2(""); setNvL3(""); setNvStanza(""); setNvCustom([]);
                  setShowAggiungiVanoModal(true);
                  return;
                }
                const v = { id: Date.now(), nome: `Vano ${(selectedRilievo.vani?.length||0)+1}`, tipo: "", stanza: "", piano: "", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
                const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                setSelectedRilievo(updR);
                setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }));
                setSelectedVano(v);
                setVanoStep(0);
              }}
                style={{
                  padding: "13px 14px", marginTop: 8, cursor: "pointer",
                  borderRadius: 12,
                  border: `1.5px dashed ${T.acc}40`,
                  background: `${T.acc}06`,
                  display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(31,120,120,0.04)",
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: `linear-gradient(145deg, #5FD0D0, #28A0A0)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 5px rgba(40,160,160,0.35)",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.acc, letterSpacing: "0.2px" }}>Aggiungi vano</span>
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
                      {mis ? "✓" : blk ? "+" : "📐"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
                        <span style={{ fontSize: 10, color: T.sub }}>~{v.mq}m²</span>
                      </div>
                      {mis && daV && <div style={{ fontSize: 11, color: T.sub }}>{daV.n}·· visita · {new Date(daV.data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</div>}
                      {!mis && blk && <div style={{ fontSize: 11, color: T.red }}>{blk.motivo}{blk.note && <span style={{ color: T.sub }}> · {blk.note}</span>}</div>}
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
              ["Data",       r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : "·"],
              ["Ora",        r?.ora || "·"],
              ["Rilevatore", r?.rilevatore || "·"],
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
              ["Telefono",  c.telefono || "·"],
              ["Sistema",   c.sistema || "·"],
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



        {/* Allegati / Note / Vocali / Video - hide when selectedRilievo (v68) */}
        {!selectedRilievo && (
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
                    <span style={{ fontSize: 16 }}>{a.tipo === "nota" ? "📋" : a.tipo === "vocale" ? "🎵" : a.tipo === "video" ? "🎵" : a.tipo === "foto" ? "📐" : "🎵"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.nome}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{a.data ? new Date(a.data+'T12:00:00').toLocaleDateString('it-IT') : a.data}{a.durata ? ` · ${a.durata}` : ""}</div>
                    </div>
                    {/* Audio: play inline */}
                    {a.tipo === "vocale" && (
                      <div onClick={() => playAllegato(a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: playingId === a.id ? T.redLt : T.accLt, fontSize: 10, fontWeight: 600, color: playingId === a.id ? T.red : T.acc, cursor: "pointer" }}>
                        {playingId === a.id ? "⏹ Stop" : "▶ Play"}
                      </div>
                    )}
                    {/* Video: open/close inline player */}
                    {a.tipo === "video" && a.dataUrl && (
                      <div onClick={() => setViewingVideoId(viewingVideoId === a.id ? null : a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: viewingVideoId === a.id ? T.blueLt : T.accLt, fontSize: 10, fontWeight: 600, color: viewingVideoId === a.id ? T.blue : T.acc, cursor: "pointer" }}>
                        {viewingVideoId === a.id ? "✓ Chiudi" : "▶ Guarda"}
                      </div>
                    )}
                    {a.tipo === "video" && a.dataUrl && (
                      <a href={a.dataUrl} download={a.nome || "video.webm"} style={{ padding: "3px 8px", borderRadius: 6, background: T.bg, fontSize: 10, fontWeight: 600, color: T.sub, cursor: "pointer", textDecoration: "none" }}>🔗</a>
                    )}
                    {/* Photo: toggle inline preview */}
                    {a.tipo === "foto" && a.dataUrl && (
                      <div onClick={() => setViewingPhotoId(viewingPhotoId === a.id ? null : a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer" }}>
                        {viewingPhotoId === a.id ? "✓ Chiudi" : "📸 Vedi"}
                      </div>
                    )}
                    {a.tipo === "foto" && a.dataUrl && <img src={a.dataUrl} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} alt="" />}
                    {a.tipo === "file" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer", textDecoration: "none" }}><I d={ICO.folder} /> Apri</a>}
                    {a.tipo === "firma" && a.dataUrl && <span onClick={() => { const w = window.open(""); w?.document.write(`<iframe src="${a.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`); }} style={{ padding: "3px 8px", borderRadius: 6, background: "#28A0A012", fontSize: 10, fontWeight: 600, color: "#28A0A0", cursor: "pointer" }}>📸 Apri</span>}
                    {a.tipo === "firma" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.bg, fontSize: 10, fontWeight: 600, color: T.sub, cursor: "pointer", textDecoration: "none" }}>🔗</a>}
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
        )}

        {/*  SEZIONE INTERVENTI  */}
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

        {/* Timeline/Log v58 - app-nell-app - hide when selectedRilievo (v68) */}
        {!selectedRilievo && c.log && c.log.length > 0 && (() => {
          // Colori per tipo evento (palette mockup v3)
          const EV_COLORS: any = {
            creazione:    { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", icon: "✦" },
            rilievo:      { grad: "linear-gradient(155deg, #AFA9EC 0%, #7F77DD 100%)", solid: "#7F77DD", dark: "#3C3489", tint: "rgba(127,119,221,0.12)", icon: "◆" },
            preventivo:   { grad: "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)", solid: "#1D9E75", dark: "#04342C", tint: "rgba(29,158,117,0.12)", icon: "€" },
            firma:        { grad: "linear-gradient(155deg, #5DCAA5 0%, #1D9E75 100%)", solid: "#1D9E75", dark: "#04342C", tint: "rgba(29,158,117,0.12)", icon: "✓" },
            ordine:       { grad: "linear-gradient(155deg, #FAC775 0%, #EF9F27 100%)", solid: "#EF9F27", dark: "#854F0B", tint: "rgba(239,159,39,0.15)", icon: "▶" },
            produzione:   { grad: "linear-gradient(155deg, #85B7EB 0%, #378ADD 100%)", solid: "#378ADD", dark: "#042C53", tint: "rgba(55,138,221,0.12)", icon: "⚙" },
            posa:         { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", icon: "⬒" },
            collaudo:     { grad: "linear-gradient(155deg, #ED93B1 0%, #D4537E 100%)", solid: "#D4537E", dark: "#4B1528", tint: "rgba(212,83,126,0.14)", icon: "✓" },
            fattura:      { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)", icon: "€" },
            pagamento:    { grad: "linear-gradient(155deg, #97C459 0%, #639922 100%)", solid: "#639922", dark: "#173404", tint: "rgba(99,153,34,0.14)", icon: "✓" },
            ferma:        { grad: "linear-gradient(155deg, #F09595 0%, #E24B4A 100%)", solid: "#E24B4A", dark: "#8B1A1A", tint: "rgba(226,75,74,0.14)", icon: "⚠" },
            nota:         { grad: "linear-gradient(155deg, #888780 0%, #5F5E5A 100%)", solid: "#5F5E5A", dark: "#2C2C2A", tint: "rgba(95,94,90,0.14)", icon: "✎" },
          };
          const detectType = (cosa: string): string => {
            const s = (cosa || "").toLowerCase();
            if (s.includes("creat") || s.includes("aperto") || s.includes("apertura")) return "creazione";
            if (s.includes("rilievo") || s.includes("sopralluogo") || s.includes("misur")) return "rilievo";
            if (s.includes("preventivo")) return "preventivo";
            if (s.includes("firm") || s.includes("confermat")) return "firma";
            if (s.includes("ordine") || s.includes("ordin")) return "ordine";
            if (s.includes("produzione") || s.includes("produ")) return "produzione";
            if (s.includes("posa") || s.includes("install") || s.includes("montag")) return "posa";
            if (s.includes("collaudo")) return "collaudo";
            if (s.includes("pagat") || s.includes("pagament") || s.includes("saldo")) return "pagamento";
            if (s.includes("fattur")) return "fattura";
            if (s.includes("ferma") || s.includes("bloccat") || s.includes("sospes")) return "ferma";
            if (s.includes("nota") || s.includes("comment")) return "nota";
            return "creazione";
          };
          const initials = (s: string): string => {
            if (!s) return "—";
            const parts = s.trim().split(/\s+/).slice(0, 2);
            return parts.map(p => p[0]?.toUpperCase() || "").join("") || s[0]?.toUpperCase() || "—";
          };

          return (
            <CronologiaBlock
              log={c.log}
              EV_COLORS={EV_COLORS}
              detectType={detectType}
              initials={initials}
              commessa={c}
              T={T}
              S={S}
              operatoriDB={typeof operatoriDB !== "undefined" ? operatoriDB : []}
            />
          );
        })()}

        {/* Elimina - hide when selectedRilievo (v68) */}
        {!selectedRilievo && (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {c.fase === "chiusura" && <div style={{ fontSize: 12, fontWeight: 700, color: T.grn }}>✓ Commessa chiusa</div>}
          <span onClick={() => deleteCommessa(c.id)} style={{ fontSize: 11, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>Elimina commessa</span>
        </div>
        )}

        {/*  MODAL AGGIUNGI VANO COMPLESSO  */}
        {showAggiungiVanoModal && (() => {
          const tEdif = (c as any).tipoEdificio || (c as any).tipo_edificio || "";
          const labels = (() => {
            switch (tEdif) {
              case "palazzo": return { l1: "Scala", l2: "Piano", l3: "Interno" };
              case "condominio": return { l1: "", l2: "Piano", l3: "Interno" };
              case "scuola": return { l1: "Edificio/Plesso", l2: "Piano", l3: "Aula" };
              case "ospedale": return { l1: "Padiglione", l2: "Piano", l3: "Reparto" };
              case "ufficio": return { l1: "Edificio", l2: "Piano", l3: "Ufficio" };
              case "hotel": return { l1: "Edificio", l2: "Piano", l3: "Camera" };
              case "centro_comm": return { l1: "", l2: "Livello", l3: "Negozio" };
              case "industriale": return { l1: "Corpo", l2: "", l3: "Settore" };
              case "personalizzato": return { l1: (c as any).livello1Label || "Livello 1", l2: (c as any).livello2Label || "Livello 2", l3: (c as any).livello3Label || "Livello 3" };
              default: return { l1: "Zona", l2: "Piano", l3: "Locale" };
            }
          })();
          const canCreate = (!labels.l1 || nvL1.trim()) && (!labels.l2 || nvL2.trim()) && (!labels.l3 || nvL3.trim());
          return (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowAggiungiVanoModal(false)}>
              <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: 20, boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#0D1F1F" }}>Nuovo vano · posizione</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Indica dove si trova dentro lo stabile</div>
                  </div>
                  <div onClick={() => setShowAggiungiVanoModal(false)} style={{ width: 30, height: 30, borderRadius: 15, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}>✕</div>
                </div>

                {labels.l1 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>{labels.l1} *</div>
                    <input style={S.input} placeholder={`Es. ${labels.l1} A`} value={nvL1} onChange={e => setNvL1(e.target.value)} />
                  </div>
                )}
                {labels.l2 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>{labels.l2} *</div>
                    <input style={S.input} placeholder={`Es. 1, Terra, 3`} value={nvL2} onChange={e => setNvL2(e.target.value)} />
                  </div>
                )}
                {labels.l3 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>{labels.l3} *</div>
                    <input style={S.input} placeholder={`Es. ${labels.l3} 5`} value={nvL3} onChange={e => setNvL3(e.target.value)} />
                  </div>
                )}

                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 4 }}>Stanza / ambiente</div>
                  <input style={S.input} placeholder="Es. Cucina, Bagno, Camera, Aula magna…" value={nvStanza} onChange={e => setNvStanza(e.target.value)} />
                </div>

                {/* Campi personalizzati ripetibili */}
                {nvCustom.length > 0 && (
                  <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {nvCustom.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input style={{ ...S.input, flex: 1 }} placeholder="Etichetta" value={f.label} onChange={e => {
                          const n = [...nvCustom]; n[i] = { ...n[i], label: e.target.value }; setNvCustom(n);
                        }} />
                        <input style={{ ...S.input, flex: 2 }} placeholder="Valore" value={f.value} onChange={e => {
                          const n = [...nvCustom]; n[i] = { ...n[i], value: e.target.value }; setNvCustom(n);
                        }} />
                        <div onClick={() => setNvCustom(nvCustom.filter((_, ii) => ii !== i))} style={{ width: 30, height: 30, borderRadius: 8, background: "#FFE8E8", color: "#DC4444", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, fontWeight: 800 }}>×</div>
                      </div>
                    ))}
                  </div>
                )}

                <div onClick={() => setNvCustom([...nvCustom, { label: "", value: "" }])} style={{
                  marginBottom: 14, padding: "10px 12px", borderRadius: 10, border: `1.5px dashed ${T.bdr}`,
                  background: "transparent", cursor: "pointer", textAlign: "center" as any,
                  fontSize: 12, fontWeight: 700, color: T.acc,
                }}>
                  + Aggiungi campo personalizzato
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setShowAggiungiVanoModal(false)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                  <button disabled={!canCreate} onClick={() => {
                    if (!selectedCM || !selectedRilievo) return;
                    const customValidi = nvCustom.filter(f => f.label.trim() && f.value.trim());
                    const customStr = customValidi.map(f => f.value).join(" · ");
                    const posStr = [nvL1, nvL2, nvL3].filter(Boolean).join(" · ");
                    const baseNome = [posStr, nvStanza, customStr].filter(Boolean).join(" · ");
                    const v = {
                      id: Date.now(),
                      nome: baseNome || `Vano ${(selectedRilievo.vani?.length||0)+1}`,
                      tipo: "",
                      stanza: nvStanza,
                      piano: nvL2,
                      livello_1: nvL1,
                      livello_2: nvL2,
                      livello_3: nvL3,
                      campi_custom: nvCustom.filter(f => f.label.trim() && f.value.trim()),
                      sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "",
                      misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1,
                      accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
                    };
                    const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                    setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                    setSelectedRilievo(updR);
                    setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }) : prev);
                    setSelectedVano(v);
                    setVanoStep(0);
                    setShowAggiungiVanoModal(false);
                  }} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: canCreate ? T.acc : "#ccc", color: "#fff", fontSize: 14, fontWeight: 800, cursor: canCreate ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                    + Crea vano
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/*  MODAL NUOVO RILIEVO  */}
        {showNuovoRilievoModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9500, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowNuovoRilievoModal(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, padding: 20, boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "#0D1F1F" }}>Nuovo rilievo</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>Commessa {c.code} · {c.cliente}</div>
                </div>
                <div onClick={() => setShowNuovoRilievoModal(false)} style={{ width: 32, height: 32, borderRadius: 16, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, color: T.sub }}>✕</div>
              </div>

              {/* TOGGLE RILIEVO SEMPLICE / COMPLESSO */}
              {true && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 8 }}>Tipo rilievo</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <div onClick={() => setNuovoRilievoComplesso(false)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                      background: !nuovoRilievoComplesso ? "#28A0A015" : T.card,
                      border: `1.5px solid ${!nuovoRilievoComplesso ? "#28A0A0" : T.bdr}`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: !nuovoRilievoComplesso ? "#28A0A0" : T.text }}>Semplice</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Vani senza gerarchia</div>
                    </div>
                    <div onClick={() => setNuovoRilievoComplesso(true)} style={{
                      padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                      background: nuovoRilievoComplesso ? "#3C348915" : T.card,
                      border: `1.5px solid ${nuovoRilievoComplesso ? "#3C3489" : T.bdr}`,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: nuovoRilievoComplesso ? "#3C3489" : T.text }}>Complesso</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Organizza per zone/piani</div>
                    </div>
                  </div>
                </div>
              )}
              {/* TIPO RILIEVO */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 8 }}>Tipo misure</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {[
                    { id: "provvisorio",    l: "Provvisorie",   d: "Prima visita, misure indicative",    c: "#D08008" },
                    { id: "verificato",     l: "Verificate",    d: "Controllate sul posto",              c: "#185FA5" },
                    { id: "definitivo",     l: "Definitive",    d: "Misure finali, preventivo sbloccato", c: "#0F6E56" },
                    { id: "da_rivedere",    l: "Da rivedere",   d: "Discrepanze, ricontrollare",         c: "#DC4444" },
                    { id: "personalizzato", l: "Personalizzato", d: "Tipo a scelta, descrivi nelle note", c: "#3C3489" },
                  ].map(t => {
                    const on = nuovoRilievoTipo === t.id;
                    return (
                      <div key={t.id} onClick={() => setNuovoRilievoTipo(t.id as any)} style={{
                        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                        background: on ? `${t.c}15` : T.card,
                        border: `1.5px solid ${on ? t.c : T.bdr}`,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: on ? t.c : T.text }}>{t.l}</div>
                        <div style={{ fontSize: 9, color: T.sub, marginTop: 2, lineHeight: 1.4 }}>{t.d}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RILEVATORE */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 6 }}>Chi ha fatto il rilievo</div>
                <input type="text" value={nuovoRilievoRilevatore} onChange={e => setNuovoRilievoRilevatore(e.target.value)} placeholder="Nome rilevatore" style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as any, background: T.card }} />
              </div>

              {/* NOTE */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.sub, textTransform: "uppercase" as any, letterSpacing: "0.5px", marginBottom: 6 }}>Note (opzionale)</div>
                <textarea value={nuovoRilievoNote} onChange={e => setNuovoRilievoNote(e.target.value)} placeholder="Es. Seconda visita dopo modifiche richieste dal cliente" style={{ width: "100%", minHeight: 60, padding: 10, borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 12, fontFamily: "inherit", resize: "vertical" as any, boxSizing: "border-box" as any, background: T.card }} />
              </div>

              {/* Azioni */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowNuovoRilievoModal(false)} style={{ flex: 1, padding: 13, borderRadius: 12, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                <button onClick={() => {
                  const oggiISO = new Date().toISOString().split("T")[0];
                  const rilieviAtt = c.rilievi || [];
                  const nextN = rilieviAtt.length + 1;
                  const newR = {
                    id: Date.now(),
                    n: nextN,
                    tipo: nuovoRilievoTipo,
                    data: oggiISO,
                    ora: new Date().toTimeString().slice(0,5),
                    rilevatore: nuovoRilievoRilevatore || "",
                    note: nuovoRilievoNote || "",
                    vani: [],
                    complesso: nuovoRilievoComplesso,
                  };
                  setCantieri((cs: any[]) => cs.map(cm => cm.id === c.id ? { ...cm, rilievi: [...(cm.rilievi || []), newR] } : cm));
                  setSelectedCM((prev: any) => prev ? ({ ...prev, rilievi: [...(prev.rilievi || []), newR] }) : prev);
                  setSelectedRilievo(newR);
                  setShowNuovoRilievoModal(false);
                  setCmSubTab("sopralluoghi");
                }} style={{ flex: 2, padding: 13, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  Crea rilievo · Aggiungi vani
                </button>
              </div>
            </div>
          </div>
        )}

        {/*  INTERVENTO FLOW PANEL (fixed overlay)  */}
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

        {/*  MODAL FASCICOLO GEOMETRA  */}
        {showFascicoloModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 580, maxHeight: "88vh", overflowY: "auto", padding: "20px 16px 32px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#28A0A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 10 }}><I d={ICO.ruler} s={18} c="#fff" /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Fascicolo Geometra</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{(getVaniAttivi(c) || []).length} vani · {c.code || c.id}</div>
                </div>
                <div onClick={() => setShowFascicoloModal(false)} style={{ fontSize: 20, color: T.sub, cursor: "pointer", padding: "0 4px" }}>✓</div>
              </div>

              {/* Stato generazione */}
              {fascicoloStep === "generato" && fascicoloLink && (
                <div style={{ background: "#E8F5E9", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1px solid #A5D6A7" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D32", marginBottom: 6 }}>✓ Fascicolo generato!</div>
                  <div style={{ fontSize: 11, color: "#388E3C", wordBreak: "break-all" as const, marginBottom: 8 }}>{fascicoloLink}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => {
                      navigator.clipboard.writeText(fascicoloLink);
                      setFascicoloLinkCopied(true);
                      setTimeout(() => setFascicoloLinkCopied(false), 2000);
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#2E7D32", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      {fascicoloLinkCopied ? "✓ Copiato!" : "🔗 Copia link"}
                    </button>
                    <button onClick={() => {
                      const text = encodeURIComponent(`Gentile cliente, ecco il fascicolo tecnico della sua commessa: ${fascicoloLink}`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#25d366", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      💬 WhatsApp
                    </button>
                    {c.email && (
                      <button onClick={() => {
                        const sub = encodeURIComponent(`Fascicolo Tecnico · ${c.code || "Commessa"}`);
                        const body = encodeURIComponent(`Gentile ${[c.cliente, c.cognome].filter(Boolean).join(" ") || "cliente"},\n\nLe invio il fascicolo tecnico della sua commessa:\n${fascicoloLink}\n\nIl link  valido per 30 giorni.\n\nCordiali saluti,\n${aziendaInfo?.ragione || ""}`);
                        window.open(`mailto:${c.email}?subject=${sub}&body=${body}`, "_blank");
                      }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.blue, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        📧 Email
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
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: fascicoloLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: fascicoloLoading ? 0.7 : 1 }}
                >
                  {fascicoloLoading ? "+▶ Generazione..." : "🔧 Genera link condivisibile (30gg)"}
                </button>

                {/* Scarica PDF */}
                <button
                  onClick={async () => {
                    const vani = getVaniAttivi(c) || [];
                    // Passa cadData di ogni vano per il disegno nel PDF
                    const vaniConDisegno = vani.map(v => ({
                      ...v,
                      cadData: v.cadData || (c.rilievi || [])
                        .flatMap(r => r.vani || [])
                        .find(rv => rv.id === v.id)?.cadData || null,
                    }));
                    const snap = buildSnapshot(c, vaniConDisegno, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                    await generaFascicoloGeometraPDF(snap);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "1.5px solid #031631", background: "#03163110", color: "#031631", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  📋 Scarica PDF Fascicolo
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
                        <span style={{ fontSize: 12 }}>{scaduto ? "🔒" : "🔧"}</span>
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
      {showSendModal && (
        <div onClick={() => setShowSendModal(null)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(13,31,31,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 420, width: "100%" }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#0D1F1F", marginBottom: 4 }}>Invia preventivo al cliente</div>
            <div style={{ fontSize: 12, color: "#6A8484", marginBottom: 16 }}>{showSendModal.nome} {showSendModal.tel ? "- " + showSendModal.tel : ""}</div>
            {!showSendModal.link && (
              <div style={{ padding: 10, borderRadius: 8, background: "#FEF3C7", color: "#92400E", fontSize: 11, marginBottom: 12 }}>
                Il link cliente non e stato generato. Verra inviato solo il testo base.
              </div>
            )}
            <div style={{ display: "grid", gap: 8 }}>
              {showSendModal.tel && (
                <button onClick={() => {
                  const msg = showSendModal.link ? `Ciao ${showSendModal.nome}, ecco il preventivo ${showSendModal.code}. Clicca qui per vedere i dettagli e rispondere: ${showSendModal.link}` : `Ciao ${showSendModal.nome}, ecco il tuo preventivo. Rispondi OK se va bene o dimmi cosa modificare. Grazie!`;
                  const t = showSendModal.tel;
                  const wa = `https://wa.me/${t.startsWith("+") ? t.slice(1) : "39" + t}?text=` + encodeURIComponent(msg);
                  window.open(wa, "_blank");
                  setShowSendModal(null); setCcDone("Inviato via WhatsApp"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000);
                }} style={{ padding: 14, borderRadius: 12, border: "none", background: "#25D366", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>
                  WhatsApp - {showSendModal.tel}
                </button>
              )}
              {showSendModal.email && (
                <button onClick={() => {
                  const subj = `Preventivo ${showSendModal.code}`;
                  const body = showSendModal.link ? `Gentile ${showSendModal.nome},\n\ntrovi qui il preventivo ${showSendModal.code}:\n${showSendModal.link}\n\nDal link puoi accettare, chiedere modifiche o richiedere di essere chiamato.\n\nCordiali saluti.` : `Gentile ${showSendModal.nome},\n\nin allegato trovi il preventivo ${showSendModal.code}.\n\nFammi sapere come procedere.\n\nCordiali saluti.`;
                  const mailto = `mailto:${showSendModal.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
                  window.open(mailto, "_blank");
                  setShowSendModal(null); setCcDone("Email aperta"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000);
                }} style={{ padding: 14, borderRadius: 12, border: "none", background: "#3B7FE0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>
                  Email - {showSendModal.email}
                </button>
              )}
              {showSendModal.tel && (
                <button onClick={() => {
                  const msg = showSendModal.link ? `Preventivo ${showSendModal.code}: ${showSendModal.link}` : `Preventivo ${showSendModal.code} disponibile`;
                  const t = showSendModal.tel;
                  const sms = `sms:${t}?body=` + encodeURIComponent(msg);
                  window.open(sms, "_blank");
                  setShowSendModal(null); setCcDone("SMS aperto"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000);
                }} style={{ padding: 14, borderRadius: 12, border: "1.5px solid #C8E4E4", background: "#fff", color: "#0D1F1F", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>
                  SMS - {showSendModal.tel}
                </button>
              )}
              {showSendModal.link && (
                <button onClick={() => {
                  navigator.clipboard.writeText(showSendModal.link).then(() => {
                    setShowSendModal(null); setCcDone("Link copiato negli appunti"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000);
                  });
                }} style={{ padding: 14, borderRadius: 12, border: "1.5px solid #C8E4E4", background: "#fff", color: "#0D1F1F", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left" as const }}>
                  Copia link
                </button>
              )}
              {!showSendModal.tel && !showSendModal.email && (
                <div style={{ padding: 14, borderRadius: 10, background: "#FEE2E2", color: "#991B1B", fontSize: 12 }}>
                  Nessun contatto disponibile. Aggiungi telefono o email al cliente per inviare.
                </div>
              )}
            </div>
            <button onClick={() => setShowSendModal(null)} style={{ marginTop: 14, width: "100%", padding: 10, borderRadius: 10, background: "#fff", color: "#6A8484", border: "1px solid #C8E4E4", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Annulla
            </button>
          </div>
        </div>
      )}
      {quickEditCliente && (
        <div onClick={() => setQuickEditCliente(null)} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(13,31,31,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: 20, maxWidth: 420, width: "100%" }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, color: "#0D1F1F" }}>
              Aggiungi {quickEditCliente === "telefono" ? "telefono" : "email"} cliente
            </div>
            <div style={{ fontSize: 11, color: "#6A8484", marginBottom: 14 }}>{c.cliente} {c.cognome || ""}</div>
            <input
              type={quickEditCliente === "email" ? "email" : "tel"}
              value={quickEditValue}
              onChange={(e) => setQuickEditValue(e.target.value)}
              placeholder={quickEditCliente === "telefono" ? "es. 3401234567" : "es. cliente@esempio.it"}
              autoFocus
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #C8E4E4", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as const, marginBottom: 14 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setQuickEditCliente(null)} style={{ flex: 1, padding: 12, borderRadius: 10, background: "#fff", color: "#6A8484", border: "1px solid #C8E4E4", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
              <button onClick={() => {
                if (!quickEditValue.trim()) return;
                const field = quickEditCliente as string;
                updCM(field, quickEditValue.trim());
                setQuickEditCliente(null);
                setCcDone("Dato salvato!");
                setTimeout(() => { setCcDone(null); setShowModalFirma(true); }, 800);
              }} style={{ flex: 2, padding: 12, borderRadius: 10, background: "#28A0A0", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Salva e torna a firma</button>
            </div>
          </div>
        </div>
      )}
      {showModalFirma && c && (
        <ModalFirma
          commessaId={c.id || c.cm_id || ""}
          clienteNome={c.cliente || c.nomeCliente || "Cliente"}
          clienteTelefono={c.telefono || null}
          clienteEmail={c.email || null}
          onClose={() => setShowModalFirma(false)}
          onSuccess={() => {
            updCM("preventivoInviato", true);
            updCM("dataPreventivoInvio", new Date().toISOString().split("T")[0]);
            setCcDone("Firma inviata al cliente");
            setTimeout(() => setCcDone(null), 3000);
          }}
        />
      )}
      </div>
    );

}