"use client";
// components/ModalNuovaNota.tsx
// BLOCCO 2 - Modal aggiunta nota diario con tag emozionali + voce + foto

import React, { useState, useRef, useEffect } from "react";
import { creaEvento } from "../hooks/useDossierCliente";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const TAG_EMOZIONALI_PRESET = [
  { val: 'preciso', icon: '🎯', col: BLUE_DARK() },
  { val: 'puntuale', icon: '⏱️', col: TEAL_DEEP },
  { val: 'ansioso', icon: '😰', col: AMBER },
  { val: 'decisivo', icon: '💪', col: PURPLE },
  { val: 'esigente', icon: '🔍', col: '#7E22CE' },
  { val: 'attento_dettagli', icon: '🧐', col: '#1E40AF' },
  { val: 'pagamento_lento', icon: '🐌', col: AMBER },
  { val: 'problematico', icon: '⚠️', col: RED },
  { val: 'fedele', icon: '💎', col: TEAL },
  { val: 'referral_potenziale', icon: '🤝', col: GREEN },
];

function BLUE_DARK() { return '#1E40AF'; }

const TIPI_NOTA = [
  { val: 'memo', icon: '📌', label: 'Memo importante', col: PURPLE },
  { val: 'osservazione', icon: '👁️', label: 'Osservazione', col: BLUE_DARK() },
  { val: 'problema', icon: '⚠️', label: 'Problema', col: RED, categoria: 'problema' },
  { val: 'preferenza', icon: '💡', label: 'Preferenza cliente', col: AMBER },
  { val: 'follow_up', icon: '🔁', label: 'Da ricontattare', col: TEAL },
  { val: 'tecnico', icon: '🔧', label: 'Nota tecnica', col: '#1E40AF', categoria: 'tecnico' },
];

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
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(126,34,206,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📝</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>DIARIO CLIENTE</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Nuova nota</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>×</button>
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
                  border: `2px solid ${sel ? t.col : '#E5EAF0'}`,
                  borderRadius: 10, padding: '8px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
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
              padding: '5px 10px', borderRadius: 6,
              background: recording ? RED : TEAL,
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {recording ? '⏹ STOP' : '🎤 DETTA'}
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
                    borderRadius: 6, padding: '5px 9px',
                    fontSize: 10, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span>{t.icon}</span>
                    <span>{t.val.replace(/_/g, ' ')}</span>
                  </button>
                );
              })}
            </div>
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
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: pinnato ? '#92400E' : TEXT }}>📌 Pinna in alto</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>Resta sempre visibile in cima al dossier (DA RICORDARE)</div>
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
            background: salvando ? MUTED : `linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP})`,
            color: '#fff', border: 'none', borderRadius: 10,
            fontSize: 13, fontWeight: 800, cursor: salvando ? 'wait' : 'pointer',
          }}>{salvando ? 'Salvataggio...' : '✓ SALVA NEL DIARIO'}</button>
        </div>

        <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }' }} />
      </div>
    </div>
  );
}
