// components/codici/EtichetteButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { codiciClient } from '@/lib/codici/client';

const C = {
  teal: '#28A0A0',
  tealDark: '#1a6b6b',
  tealLight: '#C8E4E4',
  bg: '#0D1F1F',
  light: '#EEF8F8',
  amber: '#BA7517',
};

type Props = {
  commessaId: string;
  variant?: 'large' | 'compact' | 'icon';
  onGenerated?: (count: number) => void;
};

export default function EtichetteButton({
  commessaId,
  variant = 'large',
  onGenerated,
}: Props) {
  const [stato, setStato] = useState<'check' | 'pronto' | 'genera' | 'mancano' | 'error'>('check');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Verifica stato codici al mount
  useEffect(() => {
    let cancelled = false;
    
    async function verifica() {
      const { count: c, error } = await codiciClient
        .from('codici')
        .select('id', { count: 'exact', head: true })
        .or(`entita_id.eq.${commessaId},payload->>commessa_id.eq.${commessaId}`);
      
      if (cancelled) return;
      
      if (error) {
        setStato('error');
        setErrorMsg(error.message);
        return;
      }
      
      const totale = c ?? 0;
      setCount(totale);
      setStato(totale > 0 ? 'pronto' : 'genera');
    }
    
    verifica();
    return () => { cancelled = true; };
  }, [commessaId]);

  async function generaCodici() {
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { data, error } = await codiciClient.rpc('genera_codici_commessa', {
        p_commessa_id: commessaId,
      });
      
      if (error) throw error;
      
      const result = data as any;
      if (!result?.ok) {
        throw new Error(result?.error || 'errore_sconosciuto');
      }
      
      const generati = result.generati ?? 0;
      const skipped = result.skipped ?? 0;
      const totale = generati + skipped;
      
      setCount(totale);
      onGenerated?.(generati);
      
      if (totale === 0) {
        setStato('mancano');
      } else {
        setStato('pronto');
      }
    } catch (e: any) {
      setStato('error');
      setErrorMsg(e.message || 'errore generico');
    } finally {
      setLoading(false);
    }
  }

  function apriEtichette() {
    window.open(`/etichette/${commessaId}`, '_blank');
  }

  // ============ RENDERING per variant ============

  if (variant === 'icon') {
    return (
      <button
        onClick={stato === 'pronto' ? apriEtichette : generaCodici}
        disabled={loading || stato === 'check'}
        title={
          stato === 'pronto' ? `Stampa ${count} etichette` :
          stato === 'genera' ? 'Genera codici e stampa' :
          stato === 'mancano' ? 'Nessun vano in commessa' :
          'Caricamento...'
        }
        style={{
          width: 44, height: 44, borderRadius: 12, border: 'none',
          background: stato === 'pronto' ? C.teal : C.tealLight,
          color: stato === 'pronto' ? 'white' : C.bg,
          cursor: 'pointer', fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: stato === 'pronto' ? `0 3px 0 ${C.tealDark}` : 'none',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? '...' : '🏷️'}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={stato === 'pronto' ? apriEtichette : generaCodici}
        disabled={loading || stato === 'check' || stato === 'mancano'}
        style={{
          padding: '10px 16px', borderRadius: 10, border: 'none',
          background: stato === 'pronto' ? C.teal : stato === 'mancano' ? '#ccc' : C.tealLight,
          color: stato === 'pronto' ? 'white' : C.bg,
          fontSize: 13, fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          boxShadow: stato === 'pronto' ? `0 3px 0 ${C.tealDark}` : 'none',
          opacity: loading ? 0.5 : 1,
        }}
      >
        <span>🏷️</span>
        {stato === 'check' ? 'Verifica...' :
         stato === 'pronto' ? `Stampa (${count})` :
         stato === 'mancano' ? 'No vani' :
         loading ? 'Genero...' : 'Etichette'}
      </button>
    );
  }

  // variant 'large' (default)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button
        onClick={stato === 'pronto' ? apriEtichette : generaCodici}
        disabled={loading || stato === 'check'}
        style={{
          padding: '16px 24px', borderRadius: 14, border: 'none',
          background: stato === 'pronto' ? C.teal :
                      stato === 'mancano' ? '#999' :
                      stato === 'error' ? '#C73E1D' :
                      C.tealLight,
          color: stato === 'pronto' || stato === 'mancano' || stato === 'error' ? 'white' : C.bg,
          fontSize: 15, fontWeight: 700,
          cursor: loading ? 'wait' : (stato === 'mancano' ? 'not-allowed' : 'pointer'),
          display: 'inline-flex', alignItems: 'center', gap: 12,
          boxShadow: stato === 'pronto' ? `0 5px 0 ${C.tealDark}` : 'none',
          opacity: loading ? 0.5 : 1,
          transition: 'transform 0.1s',
        }}
        onPointerDown={(e) => {
          if (stato === 'pronto') {
            e.currentTarget.style.transform = 'translateY(2px)';
            e.currentTarget.style.boxShadow = `0 3px 0 ${C.tealDark}`;
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = stato === 'pronto' ? `0 5px 0 ${C.tealDark}` : 'none';
        }}
      >
        <span style={{ fontSize: 20 }}>🏷️</span>
        <span>
          {stato === 'check' ? 'Verifico codici...' :
           stato === 'pronto' ? `STAMPA ETICHETTE (${count})` :
           stato === 'genera' ? 'GENERA CODICI E STAMPA' :
           stato === 'mancano' ? 'Nessun vano in commessa' :
           stato === 'error' ? 'Errore' :
           loading ? 'In corso...' : 'Etichette'}
          {stato === 'pronto' && ' →'}
        </span>
      </button>
      
      {errorMsg && (
        <p style={{ fontSize: 11, color: '#C73E1D', margin: 0 }}>{errorMsg}</p>
      )}
      {stato === 'mancano' && (
        <p style={{ fontSize: 11, color: '#666', margin: 0 }}>
          Aggiungi prima i vani alla commessa
        </p>
      )}
    </div>
  );
}
