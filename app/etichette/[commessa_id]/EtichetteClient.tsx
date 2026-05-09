// app/etichette/[commessa_id]/EtichetteClient.tsx
'use client';

import { useState, useMemo } from 'react';
import FoglioA4, { EtichettaData } from '@/components/codici/etichette/FoglioA4';

type Props = {
  commessaId: string;
  codici: Array<{
    short: string;
    tipo: string;
    payload: any;
    stato: string;
  }>;
};

const TIPI_DISPONIBILI = [
  { id: 'vano', label: 'Vani' },
  { id: 'pezzo_cnc', label: 'Pezzi CNC' },
  { id: 'collo', label: 'Colli' },
  { id: 'commessa', label: 'Commessa' },
  { id: 'articolo', label: 'Articoli' },
];

export default function EtichetteClient({ commessaId, codici }: Props) {
  const [tipiAttivi, setTipiAttivi] = useState<string[]>(
    Array.from(new Set(codici.map(c => c.tipo)))
  );
  const [mostraAnteprima, setMostraAnteprima] = useState(false);

  const etichetteFiltrate: EtichettaData[] = useMemo(() => {
    return codici
      .filter(c => tipiAttivi.includes(c.tipo))
      .map(c => ({
        short: c.short,
        tipo: c.tipo,
        titolo: c.payload?.nome || c.payload?.titolo || c.short,
        sottotitolo: c.payload?.misure
          ? `${c.payload.misure.larghezza} × ${c.payload.misure.altezza} mm`
          : c.payload?.tipologia,
        commessa: c.payload?.commessa,
        cliente: c.payload?.cliente,
      }));
  }, [codici, tipiAttivi]);

  function toggleTipo(tipo: string) {
    setTipiAttivi(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  }

  function stampa() {
    setMostraAnteprima(true);
    setTimeout(() => window.print(), 300);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D1F1F',
      color: '#EEF8F8',
      fontFamily: '-apple-system, sans-serif',
    }}>
      {/* Toolbar non stampabile */}
      <div className="no-print" style={{
        padding: 24, borderBottom: '1px solid #28A0A033',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
          Stampa Etichette
        </h1>
        <p style={{ color: '#EEF8F899', fontSize: 13, marginTop: 4 }}>
          Commessa: <span style={{ fontFamily: 'monospace' }}>{commessaId.slice(0, 8)}</span>
          {' · '}
          {etichetteFiltrate.length} etichette · {Math.ceil(etichetteFiltrate.length / 24)} fogli A4
        </p>

        <div style={{
          marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8,
        }}>
          {TIPI_DISPONIBILI.map(t => {
            const attivo = tipiAttivi.includes(t.id);
            const conteggio = codici.filter(c => c.tipo === t.id).length;
            if (conteggio === 0) return null;
            return (
              <button
                key={t.id}
                onClick={() => toggleTipo(t.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: attivo ? '#28A0A0' : '#EEF8F822',
                  color: attivo ? 'white' : '#EEF8F8',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t.label} ({conteggio})
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
          <button
            onClick={stampa}
            disabled={etichetteFiltrate.length === 0}
            style={{
              padding: '14px 24px', borderRadius: 12,
              background: '#28A0A0', color: 'white', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 0 #1a6b6b',
              opacity: etichetteFiltrate.length === 0 ? 0.4 : 1,
            }}
          >
            STAMPA {etichetteFiltrate.length} ETICHETTE →
          </button>
          <button
            onClick={() => setMostraAnteprima(!mostraAnteprima)}
            style={{
              padding: '14px 24px', borderRadius: 12,
              background: '#EEF8F822', color: '#EEF8F8', border: 'none',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {mostraAnteprima ? 'Nascondi' : 'Anteprima'}
          </button>
        </div>
      </div>

      {/* Anteprima A4 */}
      {mostraAnteprima && etichetteFiltrate.length > 0 && (
        <div style={{ padding: 24, background: '#444', minHeight: '100vh' }}>
          <FoglioA4 etichette={etichetteFiltrate} />
        </div>
      )}

      {!mostraAnteprima && (
        <div style={{
          padding: 40, textAlign: 'center', color: '#EEF8F899',
        }}>
          <p>Clicca <strong>Anteprima</strong> per vedere il foglio prima di stampare</p>
          <p style={{ fontSize: 13, marginTop: 16 }}>
            Layout: A4 · 24 etichette per foglio (3 × 8) · 70 × 37 mm cad
          </p>
        </div>
      )}
    </div>
  );
}
