'use client';

// ============================================================
// MASTRO — useTimerLavoro
// Logica condivisa: start / pause / resume / stop / realtime
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  OraLavoro,
  StatoTimer,
  TimerSnapshot,
  FaseLavoro,
} from '@/lib/timer-lavoro-types';

interface UseTimerLavoroOpts {
  operatoreId: string | null;
  aziendaId: string | null;
}

interface StartArgs {
  commessaId: string;
  fase: FaseLavoro | string;
  sottofase?: string | null;
}

const TICK_MS = 1000;

export function useTimerLavoro({ operatoreId, aziendaId }: UseTimerLavoroOpts) {
  const [sessione, setSessione] = useState<OraLavoro | null>(null);
  const [storico, setStorico] = useState<OraLavoro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ---- Tick 1Hz solo se c'è una sessione attiva ----
  useEffect(() => {
    if (!sessione || sessione.stop_at) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [sessione]);

  // ---- Fetch sessione attiva + ultimo storico ----
  const refresh = useCallback(async () => {
    if (!operatoreId) {
      setSessione(null);
      setStorico([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [attivaRes, storicoRes] = await Promise.all([
        supabase
          .from('ore_lavoro')
          .select('*')
          .eq('operatore_id', operatoreId)
          .is('stop_at', null)
          .order('start_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ore_lavoro')
          .select('*')
          .eq('operatore_id', operatoreId)
          .not('stop_at', 'is', null)
          .order('start_at', { ascending: false })
          .limit(20),
      ]);

      if (attivaRes.error) throw attivaRes.error;
      if (storicoRes.error) throw storicoRes.error;

      setSessione((attivaRes.data as OraLavoro) ?? null);
      setStorico((storicoRes.data as OraLavoro[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Errore caricamento timer');
    } finally {
      setLoading(false);
    }
  }, [operatoreId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // ---- Realtime: aggiornamenti su ore_lavoro per questo operatore ----
  useEffect(() => {
    if (!operatoreId) return;
    const ch = supabase
      .channel(`ore_lavoro_${operatoreId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ore_lavoro',
          filter: `operatore_id=eq.${operatoreId}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [operatoreId, refresh]);

  // ---- Snapshot derivato ----
  const snapshot: TimerSnapshot = useMemo(() => {
    if (!sessione || sessione.stop_at) {
      return { stato: 'idle', sessione: null, elapsedSeconds: 0, pausedSeconds: 0 };
    }
    const startMs = new Date(sessione.start_at).getTime();
    const totalElapsed = Math.floor((now - startMs) / 1000);
    const pauseAccumulated = sessione.pause_total_seconds || 0;

    if (sessione.pause_started_at) {
      const pauseStartMs = new Date(sessione.pause_started_at).getTime();
      const currentPause = Math.floor((now - pauseStartMs) / 1000);
      const elapsed = Math.max(0, totalElapsed - pauseAccumulated - currentPause);
      return {
        stato: 'paused',
        sessione,
        elapsedSeconds: elapsed,
        pausedSeconds: currentPause,
      };
    }
    return {
      stato: 'running',
      sessione,
      elapsedSeconds: Math.max(0, totalElapsed - pauseAccumulated),
      pausedSeconds: 0,
    };
  }, [sessione, now]);

  // ---- START ----
  const start = useCallback(
    async ({ commessaId, fase, sottofase }: StartArgs) => {
      if (!operatoreId || !aziendaId) {
        setError('Operatore o azienda non identificati');
        return null;
      }
      if (sessione && !sessione.stop_at) {
        setError('Timer già attivo. Stoppalo prima di iniziarne un altro.');
        return null;
      }
      setError(null);
      const { data, error: insErr } = await supabase
        .from('ore_lavoro')
        .insert({
          azienda_id: aziendaId,
          operatore_id: operatoreId,
          commessa_id: commessaId,
          fase,
          sottofase: sottofase ?? null,
          start_at: new Date().toISOString(),
        })
        .select('*')
        .single();
      if (insErr) {
        setError(insErr.message);
        return null;
      }
      setSessione(data as OraLavoro);
      return data as OraLavoro;
    },
    [operatoreId, aziendaId, sessione],
  );

  // ---- PAUSE ----
  const pause = useCallback(async () => {
    if (!sessione || sessione.stop_at || sessione.pause_started_at) return;
    const { data, error: upErr } = await supabase
      .from('ore_lavoro')
      .update({ pause_started_at: new Date().toISOString() })
      .eq('id', sessione.id)
      .select('*')
      .single();
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setSessione(data as OraLavoro);
  }, [sessione]);

  // ---- RESUME ----
  const resume = useCallback(async () => {
    if (!sessione || sessione.stop_at || !sessione.pause_started_at) return;
    const pausedFor = Math.floor(
      (Date.now() - new Date(sessione.pause_started_at).getTime()) / 1000,
    );
    const newTotal = (sessione.pause_total_seconds || 0) + pausedFor;
    const { data, error: upErr } = await supabase
      .from('ore_lavoro')
      .update({
        pause_started_at: null,
        pause_total_seconds: newTotal,
      })
      .eq('id', sessione.id)
      .select('*')
      .single();
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setSessione(data as OraLavoro);
  }, [sessione]);

  // ---- STOP ----
  const stop = useCallback(
    async (note?: string) => {
      if (!sessione || sessione.stop_at) return null;
      // Se in pausa, chiudi prima la pausa
      let pauseTotal = sessione.pause_total_seconds || 0;
      if (sessione.pause_started_at) {
        pauseTotal += Math.floor(
          (Date.now() - new Date(sessione.pause_started_at).getTime()) / 1000,
        );
      }
      const { data, error: upErr } = await supabase
        .from('ore_lavoro')
        .update({
          stop_at: new Date().toISOString(),
          pause_started_at: null,
          pause_total_seconds: pauseTotal,
          note: note ?? sessione.note,
        })
        .eq('id', sessione.id)
        .select('*')
        .single();
      if (upErr) {
        setError(upErr.message);
        return null;
      }
      setSessione(null);
      setStorico((prev) => [data as OraLavoro, ...prev].slice(0, 20));
      return data as OraLavoro;
    },
    [sessione],
  );

  // ---- ANNULLA (timer attivo erroneo) ----
  const annulla = useCallback(async () => {
    if (!sessione || sessione.stop_at) return;
    const { error: delErr } = await supabase
      .from('ore_lavoro')
      .delete()
      .eq('id', sessione.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setSessione(null);
  }, [sessione]);

  return {
    snapshot,
    storico,
    loading,
    error,
    start,
    pause,
    resume,
    stop,
    annulla,
    refresh,
  };
}

// ---- Helper formatter ----
export function formatHMS(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatDuration(minuti: number | null): string {
  if (minuti == null) return '—';
  const h = Math.floor(minuti / 60);
  const m = minuti % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
