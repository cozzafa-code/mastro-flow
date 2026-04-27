'use client';

// ============================================================
// MASTRO — useVoceStop
// Hands-free: "stop", "ferma", "pausa", "riprendi"
// Web Speech API con lang it-IT
// ============================================================

import { useEffect, useRef, useState } from 'react';

interface ComandoVoce {
  azione: 'stop' | 'pausa' | 'riprendi' | null;
  raw: string;
}

interface UseVoceStopOpts {
  attivo: boolean;
  onComando: (cmd: ComandoVoce) => void;
}

const WAKE_STOP = ['stop', 'ferma', 'fermati', 'fermo', 'finito', 'chiudi'];
const WAKE_PAUSE = ['pausa', 'in pausa', 'pausetta', 'fermo un attimo'];
const WAKE_RESUME = ['riprendi', 'riprendo', 'continua', 'riparti', 'riparto'];

export function useVoceStop({ attivo, onComando }: UseVoceStopOpts) {
  const [supportata, setSupportata] = useState(false);
  const [inAscolto, setInAscolto] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupportata(!!SR);
  }, []);

  const start = () => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setErrore('Voce non supportata su questo browser'); return; }
    if (recRef.current) return;

    const rec = new SR();
    rec.lang = 'it-IT';
    rec.continuous = true;
    rec.interimResults = false;

    rec.onstart = () => { setInAscolto(true); setErrore(null); };
    rec.onend = () => { setInAscolto(false); recRef.current = null; };
    rec.onerror = (e: any) => {
      setErrore(e?.error || 'errore voce');
      setInAscolto(false);
    };
    rec.onresult = (e: any) => {
      let testo = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) testo += e.results[i][0].transcript;
      }
      const t = testo.toLowerCase().trim();
      if (!t) return;

      let azione: ComandoVoce['azione'] = null;
      if (WAKE_STOP.some(w => t.includes(w))) azione = 'stop';
      else if (WAKE_PAUSE.some(w => t.includes(w))) azione = 'pausa';
      else if (WAKE_RESUME.some(w => t.includes(w))) azione = 'riprendi';

      if (azione) onComando({ azione, raw: t });
    };

    try { rec.start(); recRef.current = rec; }
    catch (e: any) { setErrore(e?.message || 'errore avvio voce'); }
  };

  const stop = () => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch {}
      recRef.current = null;
    }
    setInAscolto(false);
  };

  useEffect(() => {
    if (attivo && supportata && !inAscolto) start();
    if (!attivo && inAscolto) stop();
    return () => { stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attivo, supportata]);

  return { supportata, inAscolto, errore, startManuale: start, stopManuale: stop };
}
