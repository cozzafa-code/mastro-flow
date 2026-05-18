'use client'
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MastroProvider â€” fornisce tutto lo state che useMastro() si aspetta
// Basato su MastroContext.tsx originale + state di VanoDetailPanel + RilieviListPanel
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { MastroContext } from './MastroContext'
import { createClient } from '@/lib/supabase/client'
import { SISTEMI_INIT, TIPOLOGIE_RAPIDE } from './mastro-constants'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export default function MastroProvider({ children, initialCM, initialRilievo, initialVano }: {
  children: React.ReactNode
  initialCM?: any
  initialRilievo?: any
  initialVano?: any
}) {
  // â”€â”€ CORE STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [selectedCM, setSelectedCM] = useState<any>(initialCM || null)
  const [cantieri, setCantieri] = useState<any[]>([])
  const [selectedRilievo, setSelectedRilievo] = useState<any>(initialRilievo || null)
  const [selectedVano, setSelectedVano] = useState<any>(initialVano || null)
  const [isStorico, setIsStorico] = useState(false)
  const [tab, setTab] = useState('rilievi')
  const [cmSubTab, setCmSubTab] = useState('centro')
  const [dossierTab, setDossierTab] = useState(0)
  const [vanoStep, setVanoStep] = useState(0)
  const [vanoInfoOpen, setVanoInfoOpen] = useState(false)
  const [tipCat, setTipCat] = useState<any>(null)

  // â”€â”€ DRAWING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [spDrawing, setSpDrawing] = useState<any>(null)
  const [viewingPhotoId, setViewingPhotoId] = useState<string|null>(null)
  const [pendingFotoCat, setPendingFotoCat] = useState<any>(null)
  const [showAIPhoto, setShowAIPhoto] = useState(false)
  const [aiPhotoStep, setAiPhotoStep] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawTool, setDrawTool] = useState('pen')
  const [drawPages, setDrawPages] = useState<any[]>([])
  const [drawPageIdx, setDrawPageIdx] = useState(0)
  const [drawFullscreen, setDrawFullscreen] = useState(false)
  const [penColor, setPenColor] = useState('#000000')
  const [penSize, setPenSize] = useState(2)
  const spCanvasRef = useRef<any>(null)
  const canvasRef = useRef<any>(null)
  const fotoVanoRef = useRef<any>(null)
  const videoVanoRef = useRef<any>(null)

  // â”€â”€ VOICE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const startVoice = useCallback(() => setVoiceActive(true), [])
  const stopVoice = useCallback(() => { setVoiceActive(false); setVoiceTranscript('') }, [])

  // â”€â”€ STRUTTURE / TENDAGGI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showStrutture, setShowStrutture] = useState(false)
  const [showTendaggi, setShowTendaggi] = useState(false)
  const [fabOpen, setFabOpen] = useState(false)

  // â”€â”€ NUOVO RILIEVO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showNuovoRilievo, setShowNuovoRilievo] = useState(false)
  const [nuovoRilTipo, setNuovoRilTipo] = useState('semplice')
  const [nuovoRilData, setNuovoRilData] = useState<any>({ tipoRilievo: 'semplice', tipoMisure: 'provvisorie' })

  // â”€â”€ CENTRO COMANDO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [ccConfirm, setCcConfirm] = useState<any>(null)
  const [ccDone, setCcDone] = useState<Set<string>>(new Set())
  const [ccExpandStep, setCcExpandStep] = useState<string|null>(null)
  const [confSett, setConfSett] = useState<any>(null)
  const [firmaStep, setFirmaStep] = useState(0)
  const [firmaFileUrl, setFirmaFileUrl] = useState<string|null>(null)
  const [firmaFileName, setFirmaFileName] = useState<string|null>(null)
  const [fattPerc, setFattPerc] = useState(30)
  const [montGiorni, setMontGiorni] = useState(1)
  const [montFormOpen, setMontFormOpen] = useState(false)
  const [montFormData, setMontFormData] = useState<any>({})

  // â”€â”€ CATALOGHI (da Supabase) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sistemiDB, setSistemiDB] = useState<any[]>(SISTEMI_INIT)
  const [coloriDB, setColoriDB] = useState<any[]>([])
  const [vetriDB, setVetriDB] = useState<any[]>([])
  const [coprifiliDB, setCoprifiliDB] = useState<any[]>([])
  const [lamiereDB, setLamiereDB] = useState<any[]>([])
  const [libreriaDB, setLibreriaDB] = useState<any[]>([])
  const [tipoMisuraDB, setTipoMisuraDB] = useState<any[]>([])
  const [tipoMisuraTappDB, setTipoMisuraTappDB] = useState<any[]>([])
  const [tipoMisuraZanzDB, setTipoMisuraZanzDB] = useState<any[]>([])
  const [tipoCassonettoDB, setTipoCassonettoDB] = useState<any[]>([])
  const [posPersianaDB, setPosPersianaDB] = useState<any[]>([])
  const [telaiPersianaDB, setTelaiPersianaDB] = useState<any[]>([])
  const [ctProfDB, setCtProfDB] = useState<any[]>([])
  const [ctSezioniDB, setCtSezioniDB] = useState<any[]>([])
  const [ctCieliniDB, setCtCieliniDB] = useState<any[]>([])
  const [ctOffset, setCtOffset] = useState(0)
  const [mezziSalita, setMezziSalita] = useState<any[]>([])
  const [aziendaInfo, setAziendaInfo] = useState<any>(null)
  const [settoriAttivi, setSettoriAttivi] = useState<string[]>(['serramenti'])
  const [tipologieFiltrate, setTipologieFiltrate] = useState<any[]>(TIPOLOGIE_RAPIDE)
  const [aziendaId] = useState(AZIENDA_ID)

  // Cataloghi accessori
  const [zanzModelliDB, setZanzModelliDB] = useState<any[]>([])
  const [zanzRetiDB, setZanzRetiDB] = useState<any[]>([])
  const [cassModelliDB, setCassModelliDB] = useState<any[]>([])
  const [cassIspezioneDB, setCassIspezioneDB] = useState<any[]>([])
  const [cassTappoDB, setCassTappoDB] = useState<any[]>([])
  const [cassSpallDB, setCassSpallDB] = useState<any[]>([])
  const [tdSoleModelliDB, setTdSoleModelliDB] = useState<any[]>([])
  const [tdSoleMontaggioDB, setTdSoleMontaggioDB] = useState<any[]>([])
  const [tdSoleComandoDB, setTdSoleComandoDB] = useState<any[]>([])
  const [tdIntCategorieDB, setTdIntCategorieDB] = useState<any[]>([])
  const [tdIntTessutoDB, setTdIntTessutoDB] = useState<any[]>([])
  const [tdIntMontaggioDB, setTdIntMontaggioDB] = useState<any[]>([])
  const [tdIntFinituraDB, setTdIntFinituraDB] = useState<any[]>([])
  const [bxDocAperturaDB, setBxDocAperturaDB] = useState<any[]>([])
  const [bxDocVetroDB, setBxDocVetroDB] = useState<any[]>([])
  const [bxDocProfiloDB, setBxDocProfiloDB] = useState<any[]>([])
  const [cancSistemaDB, setCancSistemaDB] = useState<any[]>([])
  const [cancAutoDB, setCancAutoDB] = useState<any[]>([])
  const [porteMaterialeDB, setPorteMaterialeDB] = useState<any[]>([])
  const [porteAperturaDB, setPorteAperturaDB] = useState<any[]>([])
  const [porteFinituraDB, setPorteFinituraDB] = useState<any[]>([])
  const [porteVetroDB, setPorteVetroDB] = useState<any[]>([])
  const [porteColoreDB, setPorteColoreDB] = useState<any[]>([])
  const [porteControtelaioDB, setPorteControtelaioDB] = useState<any[]>([])
  const [porteManiglia, setPorteManiglia] = useState<any[]>([])
  const [porteClasseEI, setPorteClasseEI] = useState<any[]>([])
  const [porteClasseRC, setPorteClasseRC] = useState<any[]>([])

  // Misc state
  const [events, setEvents] = useState<any[]>([])
  const [msgs, setMsgs] = useState<any[]>([])
  const [fattureDB, setFattureDB] = useState<any[]>([])
  const [ordiniFornDB, setOrdiniFornDB] = useState<any[]>([])
  const [montaggiDB, setMontaggiDB] = useState<any[]>([])
  const [squadreDB, setSquadreDB] = useState<any[]>([])
  const [fornitori, setFornitori] = useState<any[]>([])
  const [showPreventivoModal, setShowPreventivoModal] = useState(false)

  // GUI tokens (T = theme, S = styles) â€” usati da VanoDetailPanel
  const T = {
    bg: '#ECE6D6', surface: '#F5F0E2', surface2: '#EAE3D1',
    ink: '#1F2937', inkDim: '#6B7280', inkSoft: '#9CA3AF',
    teal: '#1F6F78', tealDeep: '#155159', tealBg: '#DCECED',
    ocra: '#E8A726', ocraBg: '#F5E9CC',
    red: '#C84941', redBg: '#F4DEDC',
    success: '#2F7D57', successBg: '#D7E8DD',
    blue: '#2E3F8F', blueBg: '#DCE0EF',
  }
  const S = {
    card: { background: 'linear-gradient(160deg,#F5F0E2,#EAE3D1)', borderRadius: 18, padding: 14, boxShadow: '0 6px 14px rgba(60,50,30,0.12),inset 0 3px 5px rgba(255,255,255,0.6)' },
  }
  const isDesktop = false
  const fs = (n: number) => n
  const PIPELINE: any[] = []
  const PipelineBar = () => null
  const ORDINE_STATI: any[] = []

  // â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const goBack = useCallback(() => {
    setSelectedVano(null)
    setVanoStep(0)
  }, [])

  const updateVanoField = useCallback((field: string, value: any) => {
    setSelectedVano((prev: any) => {
      if (!prev) return prev
      const updated = { ...prev, [field]: value }
      // Salva via API con mapping snake_case
      fetch('/api/vani', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prev.id, [field]: value }) }).catch(e => console.error('updateVanoField error:', e))
      // Aggiorna anche nel rilievo
      setSelectedRilievo((r: any) => {
        if (!r) return r
        return { ...r, vani: (r.vani || []).map((v: any) => v.id === prev.id ? updated : v) }
      })
      return updated
    })
  }, [])

  const updateMisura = useCallback((campo: string, valore: any) => {
    setSelectedVano((prev: any) => {
      if (!prev) return prev
      const misure = { ...(prev.misure || {}), [campo]: valore }
      const updated = { ...prev, misure }
      fetch('/api/vani', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: prev.id, misure }) }).catch(e => console.error('updateMisura error:', e))
      setSelectedRilievo((r: any) => {
        if (!r) return r
        return { ...r, vani: (r.vani || []).map((v: any) => v.id === prev.id ? updated : v) }
      })
      return updated
    })
  }, [])

  const updateMisureBatch = useCallback((patch: Record<string, any>) => {
    setSelectedVano((prev: any) => {
      if (!prev) return prev
      const misure = { ...(prev.misure || {}), ...patch }
      const updated = { ...prev, misure }
      const sb = createClient()
      sb.from('vani').update({ misure }).eq('id', prev.id).then(({ error }) => {
        if (error) console.error('updateMisureBatch error:', error)
      })
      setSelectedRilievo((r: any) => {
        if (!r) return r
        return { ...r, vani: (r.vani || []).map((v: any) => v.id === prev.id ? updated : v) }
      })
      return updated
    })
  }, [])

  const toggleAccessorio = useCallback((acc: string, value: boolean) => {
    updateVanoField(`accessori.${acc}.attivo`, value)
  }, [updateVanoField])

  const updateAccessorio = useCallback((acc: string, field: string, value: any) => {
    setSelectedVano((prev: any) => {
      if (!prev) return prev
      const accessori = { ...(prev.accessori || {}), [acc]: { ...(prev.accessori?.[acc] || {}), [field]: value } }
      return { ...prev, accessori }
    })
  }, [])

  const compressImage = useCallback(async (file: File) => file, [])
  const openCamera = useCallback(() => {}, [])

  const calcolaVanoPrezzo = useCallback(() => 0, [])
  const getVaniAttivi = useCallback(() => [], [])
  const deleteCommessa = useCallback(async () => {}, [])
  const setFaseTo = useCallback(async () => {}, [])
  const generaPreventivoPDF = useCallback(async () => {}, [])
  const generaPreventivoCondivisibile = useCallback(async () => {}, [])
  const creaFattura = useCallback(async () => {}, [])
  const creaOrdineFornitore = useCallback(async () => {}, [])
  const apriInboxDocumento = useCallback(async () => {}, [])

  const ctx = {
    T, S, isDesktop, fs, PIPELINE, PipelineBar, ORDINE_STATI,
    tipologieFiltrate, settoriAttivi, aziendaId, aziendaInfo,
    // Commessa
    selectedCM, setSelectedCM, cantieri, setCantieri,
    tab, setTab, cmSubTab, setCmSubTab, dossierTab, setDossierTab,
    // Rilievo
    selectedRilievo, setSelectedRilievo, isStorico,
    showNuovoRilievo, setShowNuovoRilievo, nuovoRilTipo, setNuovoRilTipo,
    nuovoRilData, setNuovoRilData,
    // Vano
    selectedVano, setSelectedVano, vanoStep, setVanoStep,
    vanoInfoOpen, setVanoInfoOpen, tipCat, setTipCat,
    // Drawing
    spDrawing, setSpDrawing, viewingPhotoId, setViewingPhotoId,
    pendingFotoCat, setPendingFotoCat,
    showAIPhoto, setShowAIPhoto, aiPhotoStep, setAiPhotoStep,
    isDrawing, setIsDrawing, drawTool, setDrawTool,
    drawPages, setDrawPages, drawPageIdx, setDrawPageIdx,
    drawFullscreen, setDrawFullscreen,
    penColor, setPenColor, penSize, setPenSize,
    spCanvasRef, canvasRef, fotoVanoRef, videoVanoRef, openCamera,
    // Voice
    voiceActive, voiceTranscript, startVoice, stopVoice,
    // Strutture/Tendaggi
    showStrutture, setShowStrutture, showTendaggi, setShowTendaggi, fabOpen,
    // Centro comando
    ccConfirm, setCcConfirm, ccDone, setCcDone, ccExpandStep, setCcExpandStep,
    confSett, setConfSett, firmaStep, setFirmaStep,
    firmaFileUrl, setFirmaFileUrl, firmaFileName, setFirmaFileName,
    fattPerc, setFattPerc, montGiorni, setMontGiorni,
    montFormOpen, setMontFormOpen, montFormData, setMontFormData,
    // Cataloghi
    sistemiDB, coloriDB, vetriDB, coprifiliDB, lamiereDB, libreriaDB,
    tipoMisuraDB, tipoMisuraTappDB, tipoMisuraZanzDB, tipoCassonettoDB,
    posPersianaDB, telaiPersianaDB, ctProfDB, ctSezioniDB, ctCieliniDB, ctOffset,
    mezziSalita,
    zanzModelliDB, zanzRetiDB, cassModelliDB, cassIspezioneDB, cassTappoDB, cassSpallDB,
    tdSoleModelliDB, tdSoleMontaggioDB, tdSoleComandoDB,
    tdIntCategorieDB, tdIntTessutoDB, tdIntMontaggioDB, tdIntFinituraDB,
    bxDocAperturaDB, bxDocVetroDB, bxDocProfiloDB,
    cancSistemaDB, cancAutoDB,
    porteMaterialeDB, porteAperturaDB, porteFinituraDB, porteVetroDB,
    porteColoreDB, porteControtelaioDB, porteManiglia, porteClasseEI, porteClasseRC,
    // Misc
    events, setEvents, msgs, fattureDB, setFattureDB,
    ordiniFornDB, setOrdiniFornDB, montaggiDB, setMontaggiDB,
    squadreDB, fornitori, setShowPreventivoModal,
    // Helpers
    goBack, updateMisura, updateMisureBatch, updateVanoField,
    toggleAccessorio, updateAccessorio, compressImage,
    calcolaVanoPrezzo, getVaniAttivi, deleteCommessa, setFaseTo,
    generaPreventivoPDF, generaPreventivoCondivisibile,
    creaFattura, creaOrdineFornitore, apriInboxDocumento,
  }

  return (
    <MastroContext.Provider value={ctx}>
      {children}
    </MastroContext.Provider>
  )
}



