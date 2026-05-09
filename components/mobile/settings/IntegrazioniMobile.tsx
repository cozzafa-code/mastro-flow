// components/mobile/settings/IntegrazioniMobile.tsx
// Hub integrazioni - lista 4 provider con setup modali

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import SetupIntegrazioneModal, { INTEGRAZIONI_CONFIG } from './SetupIntegrazioneModal';

const C = {
  navy: '#1E3A5F',
  navyDark: '#0F1B2D',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  textMuted: '#6b6358',
};

interface Props {
  aziendaId: string;
  onBack: () => void;
}

type IntegrazioneTipo = keyof typeof INTEGRAZIONI_CONFIG;

export default function IntegrazioniMobile({ aziendaId, onBack }: Props) {
  const [integrazioni, setIntegrazioni] = useState<any[]>([]);
  const [setupTipo, setSetupTipo] = useState<IntegrazioneTipo | null>(null);
  const [reload, setReload] = useState(0);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
      else {
        // Fallback: legge userId dal localStorage MASTRO custom
        try {
          const az = localStorage.getItem('mastro:user_id') || localStorage.getItem('mastro_user_id');
          if (az) setUserId(az);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('user_integrazioni')
        .select('id, servizio, stato, updated_at')
        .eq('azienda_id', aziendaId);
      setIntegrazioni(data || []);
    })();
  }, [aziendaId, reload]);

  function getStatusFor(tipo: string) {
    const found = integrazioni.find(i => i.servizio === tipo);
    if (!found) return { stato: 'da_configurare', label: 'CONFIGURA', color: C.amber };
    if (found.stato !== 'attiva') return { stato: 'disattiva', label: 'DISATTIVA', color: C.textMuted };
    return { stato: 'attiva', label: 'ATTIVA', color: C.greenText };
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, paddingBottom: 100, fontFamily: 'Inter, sans-serif' }}>
      <div style={{
        background: 'linear-gradient(135deg, #0F1B2D 0%, #1E3A5F 100%)',
        color: '#FFF', padding: '20px 16px 24px',
        borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.18)', border: 'none',
            width: 36, height: 36, borderRadius: 10,
            color: '#FFF', fontSize: 18, fontWeight: 700, cursor: 'pointer',
          }}>‹</button>
          <div style={{ fontWeight: 600, fontSize: 13, opacity: 0.85 }}>SETTINGS</div>
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>Integrazioni</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
          Connetti MASTRO ai servizi esterni
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(Object.keys(INTEGRAZIONI_CONFIG) as IntegrazioneTipo[]).map(tipo => {
          const cfg = INTEGRAZIONI_CONFIG[tipo];
          const status = getStatusFor(tipo);
          return (
            <button
              key={tipo}
              onClick={() => setSetupTipo(tipo)}
              style={{
                background: C.white,
                border: `1px solid ${C.borderWarm}`,
                borderRadius: 16, padding: 16,
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', width: '100%', textAlign: 'left',
                boxShadow: '0 1px 0 rgba(15,27,45,0.04)',
              }}
            >
              <div style={{ fontSize: 32 }}>{cfg.icona}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: C.navy, fontSize: 15 }}>{cfg.titolo}</strong>
                  <span style={{
                    background: status.color, color: C.white,
                    padding: '2px 7px', borderRadius: 4,
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  }}>
                    {status.label}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: C.textMuted }}>
                  {cfg.descrizione}
                </p>
              </div>
              <span style={{ color: C.textMuted, fontSize: 18 }}>›</span>
            </button>
          );
        })}

        <div style={{
          marginTop: 12, padding: 16,
          background: 'linear-gradient(135deg, #1E3A5F 0%, #0F1B2D 100%)',
          color: C.cream, borderRadius: 16,
        }}>
          <p style={{ margin: 0, color: C.amber, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>
            💡 ALTRE INTEGRAZIONI?
          </p>
          <p style={{ margin: '6px 0 12px', fontSize: 13, lineHeight: 1.5 }}>
            Mancano le integrazioni che ti servono? La nostra API REST è aperta — puoi connettere
            MASTRO a qualsiasi servizio.
          </p>
          <a
            href="https://mastro-erp.vercel.app/integrazioni"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block', background: C.amber, color: C.navyDark,
              padding: '8px 14px', borderRadius: 8,
              textDecoration: 'none', fontWeight: 700, fontSize: 12,
            }}
          >
            VEDI TUTTE
          </a>
        </div>
      </div>

      {setupTipo && userId && (
        <SetupIntegrazioneModal
          tipo={setupTipo}
          aziendaId={aziendaId}
          userId={userId}
          onClose={() => setSetupTipo(null)}
          onSaved={() => setReload(r => r + 1)}
        />
      )}
    </div>
  );
}
