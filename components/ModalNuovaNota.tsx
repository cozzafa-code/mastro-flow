"use client";
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import FotoGrid from "./FotoGrid";
import { IcoFile, IcoMic, IcoStop, IcoPin, IcoCheck, IcoCamera, IcoEye, IcoAlertTriangle, IcoSparkles, IcoRefresh, IcoTool } from "./IconLib";
import { CAT, PASTEL } from "../lib/modaleColors";
import ModalShell, { Sezione, BtnSecondary, BtnPrimary } from "./ModalShell";

const TIPI_NOTA = [
  { val: 'memo',         label: 'Memo importante', col: PASTEL.navy.solid,   bg: PASTEL.navy.bg,   Ico: IcoPin },
  { val: 'osservazione', label: 'Osservazione',    col: PASTEL.blue.solid,   bg: PASTEL.blue.bg,   Ico: IcoEye },
  { val: 'problema',     label: 'Problema',        col: PASTEL.red.solid,    bg: PASTEL.red.bg,    Ico: IcoAlertTriangle, categoria: 'problema' as const },
  { val: 'preferenza',   label: 'Preferenza',      col: PASTEL.amber.solid,  bg: PASTEL.amber.bg,  Ico: IcoSparkles },
  { val: 'follow_up',    label: 'Da ricontattare', col: PASTEL.teal.solid,   bg: PASTEL.teal.bg,   Ico: IcoRefresh },
  { val: 'tecnico',      label: 'Nota tecnica',    col: PASTEL.violet.solid, bg: PASTEL.violet.bg, Ico: IcoTool, categoria: 'tecnico' as const },
];

const TAG_PRESET = [
  { val: 'preciso',             col: PASTEL.blue.solid },
  { val: 'puntuale',            col: PASTEL.teal.solid },
  { val: 'ansioso',             col: PASTEL.amber.solid },
  { val: 'decisivo',            col: PASTEL.navy.solid },
  { val: 'esigente',            col: PASTEL.violet.solid },
  { val: 'attento_dettagli',    col: PASTEL.blue.solid },
  { val: 'pagamento_lento',     col: PASTEL.amber.solid },
  { val: 'problematico',        col: PASTEL.red.solid },
  { val: 'fedele',              col: PASTEL.teal.solid },
  { val: 'referral_potenziale', col: PASTEL.green.solid },
];

interface Props {
  aziendaId: string;
  clienteId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ModalNuovaNota({ aziendaId, clienteId, onClose, onSaved }: Props) {
  const cat = CAT.nota;
  const [tipo, setTipo] = useState('memo');
  const [titolo, setTitolo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [tagSelezionati, setTagSelezionati] = useState<string[]>([]);
  const [pinnato, setPinnato] = useState(false);
  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const recogRef = useRef<any>(null);

  useEffect(() => () => { try { recogRef.current?.stop(); } catch {} }, []);

  function toggleTag(t: string) {
    setTagSelezionati(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  }

  function toggleRecording() {
    if (recording) {
      try { recogRef.current?.stop(); } catch {}
      setRecording(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Riconoscimento vocale non supportato. Usa Chrome o Safari.'); return; }
    const r = new SR();
    r.lang = 'it-IT';
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e: any) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) txt += e.results[i][0].transcript + ' ';
      }
      if (txt) setDescrizione(prev => prev + (prev ? ' ' : '') + txt.trim());
    };
    r.onend = () => setRecording(false);
    r.start();
    recogRef.current = r;
    setRecording(true);
  }

  async function handleSave() {
    if (!titolo.trim()) { alert('Titolo obbligatorio'); return; }
    setSalvando(true);
    const meta = TIPI_NOTA.find(t => t.val === tipo)!;
    const categoria = (meta as any).categoria || 'nota';
    const res = await supabase.from('cliente_eventi').insert({
      azienda_id: aziendaId,
      cliente_id: clienteId,
      categoria,
      tipo: tipo,
      titolo: titolo.trim(),
      descrizione: descrizione.trim() || null,
      colore: meta.col,
      severity: tipo === 'problema' ? 'warning' : 'info',
      pinnato,
      automatico: false,
      source: 'manuale',
      tag_emozionali: tagSelezionati,
      foto_urls: fotoUrls.length ? fotoUrls : null,
      autore: typeof window !== 'undefined' ? (localStorage.getItem('mastro:nome_operatore') || 'Walter') : 'Walter',
    });
    setSalvando(false);
    if (res.error) { alert('Errore: ' + res.error.message); return; }
    onSaved?.();
    onClose();
  }

  return (
    <ModalShell
      cat={cat} Ico={IcoFile}
      kicker="DIARIO CLIENTE" title="Nuova nota"
      onClose={onClose} maxWidth={560}
      footer={
        <>
          <BtnSecondary onClick={onClose} disabled={salvando}>Annulla</BtnSecondary>
          <BtnPrimary onClick={handleSave} disabled={salvando} cat={cat}>
            <IcoCheck size={16} color="#fff" />
            <span>{salvando ? 'Salvataggio...' : 'SALVA NEL DIARIO'}</span>
          </BtnPrimary>
        </>
      }
    >
      <Sezione titolo="TIPO DI NOTA" accent={cat.solid}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {TIPI_NOTA.map(t => {
            const sel = tipo === t.val;
            return (
              <button key={t.val} onClick={() => setTipo(t.val)} style={{
                background: sel ? t.bg : '#fff',
                color: sel ? t.col : '#0F1F33',
                border: `1.5px solid ${sel ? t.col : '#E5EAF0'}`,
                borderRadius: 10, padding: '10px 4px',
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 5,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <t.Ico size={18} color={sel ? t.col : t.col} />
                <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.1, textAlign: 'center' as const }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </Sezione>

      <Sezione titolo="CONTENUTO">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, marginBottom: 4, letterSpacing: 0.3 }}>TITOLO *</div>
          <input value={titolo} onChange={e => setTitolo(e.target.value)} placeholder="Es. Cliente preoccupato per tempi consegna"
            style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid #E5EAF0', borderRadius: 9, fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff' }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: '#5C6B7A', fontWeight: 700, letterSpacing: 0.3 }}>DESCRIZIONE</div>
            <button onClick={toggleRecording} style={{
              padding: '6px 11px', borderRadius: 6,
              background: recording ? PASTEL.red.solid : cat.solid,
              color: '#fff', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
              display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
            }}>
              {recording ? <IcoStop size={11} color="#fff" /> : <IcoMic size={11} color="#fff" />}
              {recording ? 'STOP' : 'DETTA'}
              {recording && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'pulse 1s infinite' }} />}
            </button>
          </div>
          <textarea value={descrizione} onChange={e => setDescrizione(e.target.value)}
            placeholder={recording ? 'Sto ascoltando...' : 'Descrizione dettagliata (o premi DETTA per dettare a voce)'}
            rows={5} style={{ width: '100%', padding: '11px 13px', fontSize: 13, border: '1.5px solid #E5EAF0', borderRadius: 9, fontFamily: 'inherit', boxSizing: 'border-box' as const, background: '#fff', resize: 'vertical' as const, lineHeight: 1.4 }} />
        </div>
      </Sezione>

      <Sezione titolo={`TAG EMOZIONALI · ${tagSelezionati.length}`}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {TAG_PRESET.map(t => {
            const sel = tagSelezionati.includes(t.val);
            return (
              <button key={t.val} onClick={() => toggleTag(t.val)} style={{
                background: sel ? t.col : '#F8FAFA',
                color: sel ? '#fff' : '#0F1F33',
                border: `1.5px solid ${sel ? t.col : '#E5EAF0'}`,
                borderRadius: 6, padding: '6px 11px',
                fontSize: 10, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>{t.val.replace(/_/g, ' ')}</button>
            );
          })}
        </div>
      </Sezione>

      <Sezione titolo="OPZIONI">
        <div onClick={() => setPinnato(!pinnato)} style={{
          padding: '11px 13px',
          background: pinnato ? PASTEL.amber.bg : '#F8FAFA',
          border: `1.5px solid ${pinnato ? PASTEL.amber.solid : '#E5EAF0'}`,
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 5,
            background: pinnato ? PASTEL.amber.solid : 'transparent',
            border: `2px solid ${pinnato ? PASTEL.amber.solid : '#CBD5E1'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{pinnato && <IcoCheck size={13} color="#fff" />}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcoPin size={14} color={pinnato ? PASTEL.amber.text : '#5C6B7A'} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: pinnato ? PASTEL.amber.text : '#0F1F33' }}>Pinna in alto</div>
              <div style={{ fontSize: 10, color: '#5C6B7A', marginTop: 1 }}>Resta sempre visibile in cima al dossier</div>
            </div>
          </div>
        </div>
      </Sezione>

      <Sezione titolo={`FOTO ALLEGATE · ${fotoUrls.length}`}>
        <FotoGrid foto={fotoUrls} onChange={setFotoUrls} uploadFolder={`notes/${clienteId}`} size="md" maxFoto={6} />
      </Sezione>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }' }} />
    </ModalShell>
  );
}