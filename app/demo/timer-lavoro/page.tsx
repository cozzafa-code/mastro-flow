'use client';

// ============================================================
// MASTRO — Demo TimerLavoro
// Switcher device per testare le 3 viste in isolamento
// ============================================================

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import TimerLavoroMobile from '@/components/domain/timer-lavoro/TimerLavoroMobile';
import TimerLavoroTablet from '@/components/domain/timer-lavoro/TimerLavoroTablet';
import TimerLavoroDesktop from '@/components/domain/timer-lavoro/TimerLavoroDesktop';
import type { CommessaMinima } from '@/lib/timer-lavoro-types';

// IDs di test — Walter Cozza (da memorie)
const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29';
const OPERATORE_TEST_ID = '2a98547f-338b-4926-aa7b-0859cde5a1bf';

type Device = 'mobile' | 'tablet' | 'desktop';

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

      const me = (ops as any[])?.find((o) => o.id === OPERATORE_TEST_ID);
      if (me?.ruolo) setRuolo(me.ruolo);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Bar switcher */}
      <div
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3"
        style={{ background: '#0F172A', color: 'white' }}
      >
        <div className="text-xs uppercase tracking-widest opacity-70">Demo TimerLavoro</div>
        <div className="ml-auto flex gap-2">
          {(['mobile', 'tablet', 'desktop'] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className="px-4 py-1.5 rounded-md text-sm font-medium transition"
              style={{
                background: device === d ? '#28A0A0' : 'transparent',
                color: device === d ? '#0D1F1F' : 'white',
                border: '1px solid #28A0A0',
              }}
            >
              {d.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Frame device */}
      <div className="flex justify-center py-8" style={{ background: '#1E293B', minHeight: 'calc(100vh - 56px)' }}>
        {device === 'mobile' && (
          <div
            className="rounded-3xl overflow-hidden shadow-2xl"
            style={{ width: 380, minHeight: 760, background: '#0D1F1F' }}
          >
            <TimerLavoroMobile
              operatoreId={OPERATORE_TEST_ID}
              aziendaId={AZIENDA_ID}
              commesseDisponibili={commesse}
            />
          </div>
        )}
        {device === 'tablet' && (
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: 1024, minHeight: 768, background: '#F8FAFC' }}
          >
            <TimerLavoroTablet
              operatoreId={OPERATORE_TEST_ID}
              aziendaId={AZIENDA_ID}
              commesseDisponibili={commesse}
            />
          </div>
        )}
        {device === 'desktop' && (
          <div
            className="rounded-xl overflow-hidden shadow-2xl w-full"
            style={{ maxWidth: 1280, background: '#F8FAFC' }}
          >
            <TimerLavoroDesktop
              aziendaId={AZIENDA_ID}
              utenteCorrenteId={OPERATORE_TEST_ID}
              utenteCorrenteRuolo={ruolo}
              operatori={operatori}
              commesse={commesse.map((c) => ({ id: c.id, numero: c.numero, cliente_nome: c.cliente_nome }))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
