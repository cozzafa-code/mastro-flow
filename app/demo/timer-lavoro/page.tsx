'use client';

// ============================================================
// MASTRO — Demo TimerLavoro (switcher device)
// FIX v4.1: schema commesse corretto (code, cliente, cognome)
// FIX v4.1: operatore lookup via user_id corretto
// ============================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { supabase } from '@/lib/supabase';
import TimerLavoroMobile from '@/components/domain/timer-lavoro/TimerLavoroMobile';
import TimerLavoroTablet from '@/components/domain/timer-lavoro/TimerLavoroTablet';
import TimerLavoroDesktop from '@/components/domain/timer-lavoro/TimerLavoroDesktop';
import { MC, MF, MR, MS, MP } from '@/constants/design-system';
import { MastroTopbar } from '@/components/domain/timer-lavoro/_ui';
import type { CommessaMinima } from '@/lib/timer-lavoro-types';

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29';
// user_id Fabio (auth.users)
const USER_ID_FABIO = '2a98547f-338b-4926-aa7b-0859cde5a1bf';

type Device = 'mobile' | 'tablet' | 'desktop';

const S = {
  page: { minHeight: '100vh', background: MC.bg, fontFamily: MF.ui, margin: 0 } as CSSProperties,
  pill: {
    padding: '7px 18px', fontSize: 13, fontWeight: 600,
    borderRadius: MR.md, border: `1px solid ${MC.teal}`,
    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5,
    transition: 'background 0.15s, color 0.15s',
  } as CSSProperties,
  frameWrap: {
    display: 'flex', justifyContent: 'center', padding: MP.s8,
    minHeight: 'calc(100vh - 56px)', boxSizing: 'border-box',
  } as CSSProperties,
  mobileFrame: {
    width: 380, minHeight: 760,
    borderRadius: 28, overflow: 'hidden',
    boxShadow: MS.modal, background: MC.bg,
    border: `1px solid ${MC.border}`,
  } as CSSProperties,
  tabletFrame: {
    width: 1100, minHeight: 768,
    borderRadius: 16, overflow: 'hidden',
    boxShadow: MS.modal, background: MC.bg,
    border: `1px solid ${MC.border}`,
  } as CSSProperties,
  desktopFrame: {
    width: '100%', maxWidth: 1280,
    borderRadius: 12, overflow: 'hidden',
    boxShadow: MS.modal, background: MC.bg,
    border: `1px solid ${MC.border}`,
  } as CSSProperties,
};

// Helper: combina cliente + cognome in un nome leggibile
function makeClienteName(cliente: string | null, cognome: string | null): string | null {
  const c = (cliente ?? '').trim();
  const cog = (cognome ?? '').trim();
  if (c && cog) return `${c} ${cog}`.toUpperCase();
  return c || cog || null;
}

export default function DemoTimerLavoroPage() {
  const [device, setDevice] = useState<Device>('mobile');
  const [commesse, setCommesse] = useState<CommessaMinima[]>([]);
  const [operatori, setOperatori] = useState<{ id: string; nome: string | null; ruolo: string | null }[]>([]);
  const [meId, setMeId] = useState<string>(''); // ID operatore reale (non user_id)
  const [meNome, setMeNome] = useState<string | null>(null);
  const [meRuolo, setMeRuolo] = useState<string>('titolare');

  useEffect(() => {
    const load = async () => {
      // 1) Commesse — usa schema reale: code, cliente, cognome, indirizzo
      const { data: cs } = await supabase
        .from('commesse')
        .select('id, code, cliente, cognome, indirizzo')
        .eq('azienda_id', AZIENDA_ID)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(20);

      const mapped: CommessaMinima[] = (cs ?? []).map((c: any) => ({
        id: c.id,
        numero: c.code ?? null,
        cliente_nome: makeClienteName(c.cliente, c.cognome),
        indirizzo: c.indirizzo ?? null,
      }));
      setCommesse(mapped);

      // 2) Operatori
      const { data: ops } = await supabase
        .from('operatori')
        .select('id, nome, cognome, ruolo, user_id')
        .eq('azienda_id', AZIENDA_ID);

      const mappedOps = (ops ?? []).map((o: any) => ({
        id: o.id,
        nome: [o.nome, o.cognome].filter(Boolean).join(' ') || null,
        ruolo: o.ruolo,
      }));
      setOperatori(mappedOps);

      // 3) Trova ME = operatore con user_id = USER_ID_FABIO
      const me = (ops ?? []).find((o: any) => o.user_id === USER_ID_FABIO);
      if (me) {
        setMeId(me.id);
        setMeNome([me.nome, me.cognome].filter(Boolean).join(' ') || null);
        setMeRuolo(me.ruolo ?? 'titolare');
      } else if ((ops ?? []).length > 0) {
        // Fallback: primo operatore
        const first = ops![0] as any;
        setMeId(first.id);
        setMeNome([first.nome, first.cognome].filter(Boolean).join(' ') || null);
        setMeRuolo(first.ruolo ?? 'titolare');
      }
    };
    load();
  }, []);

  const switcher = (
    <>
      {(['mobile', 'tablet', 'desktop'] as Device[]).map(d => (
        <button
          key={d}
          onClick={() => setDevice(d)}
          style={{
            ...S.pill,
            background: device === d ? MC.teal : 'transparent',
            color: device === d ? MC.topbar : '#fff',
          }}
        >{d.toUpperCase()}</button>
      ))}
    </>
  );

  // Aspetto di avere l'operatore prima di renderizzare i componenti
  if (!meId) {
    return (
      <div style={S.page}>
        <MastroTopbar breadcrumb="Demo · Timer Lavoro" right={switcher} />
        <div style={{ padding: 48, textAlign: 'center', color: MC.muted, fontSize: 14 }}>
          Caricamento operatore…
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <MastroTopbar breadcrumb="Demo · Timer Lavoro" right={switcher} />

      <div style={S.frameWrap}>
        {device === 'mobile' && (
          <div style={S.mobileFrame}>
            <TimerLavoroMobile
              operatoreId={meId}
              aziendaId={AZIENDA_ID}
              operatoreNome={meNome}
              commesseDisponibili={commesse}
            />
          </div>
        )}
        {device === 'tablet' && (
          <div style={S.tabletFrame}>
            <TimerLavoroTablet
              operatoreId={meId}
              aziendaId={AZIENDA_ID}
              commesseDisponibili={commesse}
            />
          </div>
        )}
        {device === 'desktop' && (
          <div style={S.desktopFrame}>
            <TimerLavoroDesktop
              aziendaId={AZIENDA_ID}
              utenteCorrenteId={meId}
              utenteCorrenteRuolo={meRuolo}
              operatori={operatori}
              commesse={commesse.map(c => ({ id: c.id, numero: c.numero, cliente_nome: c.cliente_nome }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
