'use client';

// ============================================================
// MASTRO - Demo TimerLavoro (switcher device)
// 100% inline CSS
// ============================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import TimerLavoroMobile from '@/components/domain/timer-lavoro/TimerLavoroMobile';
import TimerLavoroTablet from '@/components/domain/timer-lavoro/TimerLavoroTablet';
import TimerLavoroDesktop from '@/components/domain/timer-lavoro/TimerLavoroDesktop';
import type { CommessaMinima } from '@/lib/timer-lavoro-types';

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29';
const OPERATORE_TEST_ID = '2a98547f-338b-4926-aa7b-0859cde5a1bf';

type Device = 'mobile' | 'tablet' | 'desktop';

const S = {
  page: {
    minHeight: '100vh',
    background: '#1E293B',
    fontFamily: 'Inter, system-ui, sans-serif',
    margin: 0,
  } as CSSProperties,
  bar: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    padding: '12px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: '#0F172A',
    color: '#fff',
  } as CSSProperties,
  barTitle: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    opacity: 0.7,
  } as CSSProperties,
  barRight: { marginLeft: 'auto', display: 'flex', gap: 8 } as CSSProperties,
  pill: {
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    border: '1px solid #28A0A0',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  } as CSSProperties,
  frameWrap: {
    display: 'flex',
    justifyContent: 'center',
    padding: 32,
    minHeight: 'calc(100vh - 56px)',
    boxSizing: 'border-box',
  } as CSSProperties,
  mobileFrame: {
    width: 380,
    minHeight: 760,
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    background: '#0D1F1F',
  } as CSSProperties,
  tabletFrame: {
    width: 1100,
    minHeight: 768,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    background: '#F8FAFC',
  } as CSSProperties,
  desktopFrame: {
    width: '100%',
    maxWidth: 1280,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    background: '#F8FAFC',
  } as CSSProperties,
};

export default function DemoTimerLavoroPage() {
  const [device, setDevice] = useState<Device>('mobile');
  const [commesse, setCommesse] = useState<CommessaMinima[]>([]);
  const [operatori, setOperatori] = useState<{ id: string; nome: string | null; ruolo: string | null }[]>([]);
  const [ruolo, setRuolo] = useState<string>('titolare');

  useEffect(() => {
    const load = async () => {
      const { data: cs } = await supabase
        .from('commesse')
        .select('id, numero, cliente_nome, indirizzo')
        .eq('azienda_id', AZIENDA_ID)
        .order('created_at', { ascending: false })
        .limit(20);
      setCommesse((cs as CommessaMinima[]) ?? []);

      const { data: ops } = await supabase
        .from('operatori')
        .select('id, nome, ruolo')
        .eq('azienda_id', AZIENDA_ID);
      setOperatori((ops as any) ?? []);

      const me = (ops as any[])?.find(o => o.id === OPERATORE_TEST_ID);
      if (me?.ruolo) setRuolo(me.ruolo);
    };
    load();
  }, []);

  return (
    <div style={S.page}>
      <div style={S.bar}>
        <div style={S.barTitle}>Demo TimerLavoro</div>
        <div style={S.barRight}>
          {(['mobile', 'tablet', 'desktop'] as Device[]).map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              style={{
                ...S.pill,
                background: device === d ? '#28A0A0' : 'transparent',
                color: device === d ? '#0D1F1F' : '#fff',
              }}
            >{d.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={S.frameWrap}>
        {device === 'mobile' && (
          <div style={S.mobileFrame}>
            <TimerLavoroMobile
              operatoreId={OPERATORE_TEST_ID}
              aziendaId={AZIENDA_ID}
              commesseDisponibili={commesse}
            />
          </div>
        )}
        {device === 'tablet' && (
          <div style={S.tabletFrame}>
            <TimerLavoroTablet
              operatoreId={OPERATORE_TEST_ID}
              aziendaId={AZIENDA_ID}
              commesseDisponibili={commesse}
            />
          </div>
        )}
        {device === 'desktop' && (
          <div style={S.desktopFrame}>
            <TimerLavoroDesktop
              aziendaId={AZIENDA_ID}
              utenteCorrenteId={OPERATORE_TEST_ID}
              utenteCorrenteRuolo={ruolo}
              operatori={operatori}
              commesse={commesse.map(c => ({ id: c.id, numero: c.numero, cliente_nome: c.cliente_nome }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
