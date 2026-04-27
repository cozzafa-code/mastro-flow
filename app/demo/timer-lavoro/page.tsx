'use client';

// ============================================================
// MASTRO — Demo TimerLavoro
// Switcher device per validare in isolamento
// ============================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import TimerLavoroMobile from '@/components/domain/timer-lavoro/TimerLavoroMobile';
import TimerLavoroTablet from '@/components/domain/timer-lavoro/TimerLavoroTablet';
import TimerLavoroDesktop from '@/components/domain/timer-lavoro/TimerLavoroDesktop';
import { C, FONT, RADIUS, SHADOW } from '@/lib/timer-lavoro-ui';
import type { CommessaMinima } from '@/lib/timer-lavoro-types';

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29';
const OPERATORE_TEST_ID = '2a98547f-338b-4926-aa7b-0859cde5a1bf';

type Device = 'mobile' | 'tablet' | 'desktop';

const S = {
  page: { minHeight: '100vh', background: C.bg, fontFamily: FONT.ui, margin: 0 } as CSSProperties,
  bar: {
    position: 'sticky' as const, top: 0, zIndex: 50,
    padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16,
    background: C.topbar, color: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as CSSProperties,
  barLeft: { display: 'flex', alignItems: 'center', gap: 12 } as CSSProperties,
  barTitle: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' as const, opacity: 0.7, fontWeight: 600 } as CSSProperties,
  barName: { fontSize: 16, fontWeight: 600 } as CSSProperties,
  barRight: { marginLeft: 'auto', display: 'flex', gap: 8 } as CSSProperties,
  pill: {
    padding: '7px 18px', fontSize: 13, fontWeight: 600,
    borderRadius: RADIUS.md, border: `1px solid ${C.teal}`,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
    transition: 'background 0.15s, color 0.15s',
  } as CSSProperties,
  frameWrap: {
    display: 'flex', justifyContent: 'center', padding: 32,
    minHeight: 'calc(100vh - 56px)', boxSizing: 'border-box',
  } as CSSProperties,
  mobileFrame: {
    width: 380, minHeight: 760,
    borderRadius: 28, overflow: 'hidden',
    boxShadow: SHADOW.modal, background: C.bg,
    border: `1px solid ${C.border}`,
  } as CSSProperties,
  tabletFrame: {
    width: 1100, minHeight: 768,
    borderRadius: 16, overflow: 'hidden',
    boxShadow: SHADOW.modal, background: C.bg,
    border: `1px solid ${C.border}`,
  } as CSSProperties,
  desktopFrame: {
    width: '100%', maxWidth: 1280,
    borderRadius: 12, overflow: 'hidden',
    boxShadow: SHADOW.modal, background: C.bg,
    border: `1px solid ${C.border}`,
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
        <div style={S.barLeft}>
          <div style={S.barName}>MASTRO</div>
          <div style={S.barTitle}>Demo · Timer Lavoro</div>
        </div>
        <div style={S.barRight}>
          {(['mobile', 'tablet', 'desktop'] as Device[]).map(d => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              style={{
                ...S.pill,
                background: device === d ? C.teal : 'transparent',
                color: device === d ? '#0B1F2A' : '#fff',
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
