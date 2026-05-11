"use client";
// components/ModalNuovaNota.tsx
// BLOCCO 2 - Modal aggiunta nota diario con tag emozionali + voce + foto

import React, { useState, useRef, useEffect } from "react";
import { creaEvento } from "../hooks/useDossierCliente";
import FotoGrid from "./FotoGrid";
import { IcoFile, IcoMic, IcoStop, IcoClose, IcoPin, IcoPin as IPin, IcoCheck, IcoTag, IcoCamera, IcoEye, IcoAlertTriangle, IcoSparkles, IcoRefresh, IcoTool } from "./IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const TAG_EMOZIONALI_PRESET: { val: string; col: string }[] = [
  { val: 'preciso',             col: '#1E40AF' },
  { val: 'puntuale',            col: '#0F6E56' },
  { val: 'ansioso',             col: '#D97706' },
  { val: 'decisivo',            col: '#1E3A5F' },
  { val: 'esigente',            col: '#1E40AF' },
  { val: 'attento_dettagli',    col: '#1E40AF' },
  { val: 'pagamento_lento',     col: '#D97706' },
  { val: 'problematico',        col: '#DC2626' },
  { val: 'fedele',              col: '#0F6E56' },
  { val: 'referral_potenziale', col: '#0F6E56' },
];

function BLUE_DARK() { return '#1E40AF'; }

const TIPI_NOTA_RAW = [
  { val: 'memo', label: 'Memo importante', col: NAVY_LOC() },
  { val: 'osservazione', label: 'Osservazione', col: BLUE_DARK() },
  { val: 'problema', label: 'Problema', col: RED, categoria: 'problema' as const },
  { val: 'preferenza', label: 'Preferenza cliente', col: AMBER },
  { val: 'follow_up', label: 'Da ricontattare', col: TEAL_LOC() },
  { val: 'tecnico', label: 'Nota tecnica', col: BLUE_DARK(), categoria: 'tecnico' as const },
];

function NAVY_LOC() { return '#1E3A5F'; }
function TEAL_LOC() { return '#0F6E56'; }

// Sostituiamo l'array originale con icone SVG
const TIPI_NOTA = TIPI_NOTA_RAW.map(t => ({ ...t, icon: '' }));

interface Props {
  aziendaId: string;
  clienteId: string;
  commessaId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalNuovaNota({ aziendaId, clienteId, commessaId, onClose, onSaved }: Props) {
  const [tipo, setTipo] = useState(TIPI_NOTA[0].val);
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [tagSel, setTagSel] = useState<string[]>([]);
  const [pinnato, setPinnato] = useState(false);
  const [recording, setRecording] = useState(false);
  const [trascrizione, setTrascrizione] = useState('');
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [salvando, setSalvando] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Audio recording via Web Speech API (trascrizione live)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    
    const r = new SR();
    r.lang = 'it-IT';
    r.continuous = true;
    r.interimResults = true;
    
    r.onresult = (event: any) => {
      let final = '';
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      if (final) setDescrizione(prev => (prev + ' ' + final).trim());
      setTrascrizione(interim);
    };
    
    r.onerror = () => setRecording(false);
    r.onend = () => setRecording(false);
    
    recognitionRef.current = r;
    return () => { try { r.stop(); } catch {} };
  }, []);

  function toggleRecording() {
    const r = recognitionRef.current;
    if (!r) { alert('Riconoscimento vocale non supportato. Usa Chrome o Safari.'); return; }
    if (recording) {
      try { r.stop(); } catch {}
      setRecording(false);
    } else {
      try { r.start(); setRecording(true); setTrascrizione(''); } catch {}
    }
  }

  function toggleTag(tag: string) {
    setTagSel(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  async function handleSave() {
    if (!titolo.trim() && !descrizione.trim()) {
      alert('Scrivi almeno un titolo o una descrizione');
      return;
    }
    setSalvando(true);
    
    const tipoMeta = TIPI_NOTA.find(t => t.val === tipo) || TIPI_NOTA[0];
    
    // Costruisco descrizione finale con tag inline
    let descFinale = descrizione.trim();
    if (tagSel.length > 0) {
      descFinale = (descFinale ? descFinale + '\n\n' : '') + 'Tag: ' + tagSel.map(t => '#' + t).join(' ');
    }
    
    const { error } = await creaEvento({
      azienda_id: aziendaId,
      cliente_id: clienteId,
      commessa_id: commessaId || null,
      categoria: (tipoMeta as any).categoria || 'nota',
      tipo: tipoMeta.val,
      titolo: titolo.trim() || tipoMeta.label,
      descrizione: descFinale,
      icona: tipoMeta.icon,
      colore: tipoMeta.col,
      severity: tipo === 'problema' ? 'warning' : 'info',
      automatico: false,
      source: 'manuale',
      autore: typeof window !== 'undefined' ? (localStorage.getItem('mastro:nome_operatore') || 'Walter') : 'Walter',
      pinnato,
      metadata: { tag_emozionali: tagSel },
      foto_urls: fotoUrls,
    });
    
    setSalvando(false);
    if (error) {
      alert('Errore: ' + error.message);
      return;
    }
    onSaved?.();
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9950, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP}, ${NAVY})`, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoFile size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>DIARIO CLIENTE</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Nuova nota</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoClose size={18} color="#fff" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: 14, overflowY: 'auto' as const }}>
          {/* TIPO NOTA */}
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, marginBottom: 8, letterSpacing: 0.5 }}>TIPO NOTA</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 14 }}>
            {TIPI_NOTA.map(t => {
              const sel = tipo === t.val;
              return (
                <button key={t.val} onClick={() => setTipo(t.val)} style={{
                  background: sel ? t.col : '#fff',
                  color: sel ? '#fff' : TEXT,
                  border: `1.5px solid ${sel ? t.col : '#E5EAF0'}`,
                  borderRadius: 10, padding: '10px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <IcoTipoNota tipo={t.val} color={sel ? '#fff' : t.col} />
                  <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.1, textAlign: 'center' as const }}>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* TITOLO */}
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>TITOLO</div>
          <input value={titolo} onChange={e => setTitolo(e.target.value)}
            placeholder="Es: Cliente preferisce contatto WhatsApp"
            style={{ width: '100%', padding: '11px 12px', fontSize: 13, fontWeight: 600, border: '1.5px solid #E5EAF0', borderRadius: 8, marginBottom: 12, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />

          {/* DESCRIZIONE + RECORDING */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, letterSpacing: 0.5, flex: 1 }}>DESCRIZIONE</div>
            <button onClick={toggleRecording} style={{
              padding: '6px 11px', borderRadius: 6,
              background: recording ? RED : TEAL_DEEP,
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              {recording ? <IcoStop size={11} color="#fff" /> : <IcoMic size={11} color="#fff" />}
              {recording ? 'STOP' : 'DETTA'}
              {recording && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />}
            </button>
          </div>
          <textarea value={descrizione} onChange={e => setDescrizione(e.target.value)}
            placeholder={recording ? 'Sto ascoltando...' : 'Descrizione dettagliata (o premi 🎤 e detta a voce)'}
            rows={5}
            style={{ width: '100%', padding: '11px 12px', fontSize: 12, lineHeight: 1.4, border: '1.5px solid ' + (recording ? RED : '#E5EAF0'), borderRadius: 8, marginBottom: 4, fontFamily: 'inherit', boxSizing: 'border-box' as const, resize: 'vertical' as const }} />
          {recording && trascrizione && (
            <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 10px', borderRadius: 5, fontSize: 11, marginBottom: 8, fontStyle: 'italic' as const }}>
              "{trascrizione}"
            </div>
          )}
          {!recording && <div style={{ height: 8 }} />}

          {/* TAG EMOZIONALI */}
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5 }}>TAG EMOZIONALI · {tagSel.length} selezionati</div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 8, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
              {TAG_EMOZIONALI_PRESET.map(t => {
                const sel = tagSel.includes(t.val);
                return (
                  <button key={t.val} onClick={() => toggleTag(t.val)} style={{
                    background: sel ? t.col : '#F8FAFA',
                    color: sel ? '#fff' : TEXT,
                    border: `1.5px solid ${sel ? t.col : '#E5EAF0'}`,
                    borderRadius: 6, padding: '6px 11px',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  }}>
                    {t.val.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FOTO */}
          <div style={{ fontSize: 10, color: MUTED, fontWeight: 700, marginBottom: 6, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}><IcoCamera size={11} color={MUTED} />FOTO ALLEGATE · {fotoUrls.length}</div>
          <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 14 }}>
            <FotoGrid foto={fotoUrls} onChange={setFotoUrls} uploadFolder="notes" size="md" maxFoto={6} />
          </div>

          {/* PIN */}
          <div onClick={() => setPinnato(!pinnato)} style={{
            background: pinnato ? '#FEF3C7' : '#fff',
            border: `1.5px solid ${pinnato ? AMBER : '#E5EAF0'}`,
            borderRadius: 10, padding: '10px 12px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 5,
              background: pinnato ? AMBER : 'transparent',
              border: `2px solid ${pinnato ? AMBER : '#E5EAF0'}`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800,
            }}>{pinnato && '✓'}</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              <IcoPin size={14} color={pinnato ? '#92400E' : MUTED} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: pinnato ? '#92400E' : TEXT }}>Pinna in alto</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Resta sempre visibile in cima al dossier</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: '#fff', padding: 12, borderTop: '1px solid #E5EAF0', display: 'flex', gap: 8 }}>
          <button onClick={onClose} disabled={salvando} style={{
            flex: 1, padding: '14px 0', background: '#fff', color: MUTED,
            border: '1.5px solid #E5EAF0', borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>Annulla</button>
          <button onClick={handleSave} disabled={salvando} style={{
            flex: 2, padding: '14px 0',
            background: salvando ? MUTED : `linear-gradient(90deg, ${TEAL_DEEP}, #047857)`,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>{salvando ? 'Salvataggio...' : (<><IcoCheck size={16} color='#fff' /><span>SALVA NEL DIARIO</span></>)}</button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }' }} />
      </div>
    </div>
  );
}


// Helper per icone tipi nota
function IcoTipoNota({ tipo, color }: { tipo: string; color: string }) {
  const size = 18;
  if (tipo === 'memo') return <IPin size={size} color={color} />;
  if (tipo === 'osservazione') return <IcoEye size={size} color={color} />;
  if (tipo === 'problema') return <IcoAlertTriangle size={size} color={color} />;
  if (tipo === 'preferenza') return <IcoSparkles size={size} color={color} />;
  if (tipo === 'follow_up') return <IcoRefresh size={size} color={color} />;
  if (tipo === 'tecnico') return <IcoTool size={size} color={color} />;
  return <IPin size={size} color={color} />;
}
