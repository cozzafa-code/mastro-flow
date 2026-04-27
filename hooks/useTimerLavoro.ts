'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { creaAlertProblema } from '@/lib/timer-lavoro-alerts';
import type {
  OraLavoro, StatoTimer, TimerSnapshot, FaseLavoro, StopArgs,
} from '@/lib/timer-lavoro-types';
import { MOTIVI_CHE_NOTIFICANO } from '@/lib/timer-lavoro-types';

interface UseTimerLavoroOpts {
  operatoreId: string | null;
  aziendaId: string | null;
}

interface StartArgs {
  commessaId: string;
  fase: FaseLavoro | string;
  sottofase?: string | null;
}

export type StatoSforamento = 'verde' | 'giallo' | 'rosso' | 'critico' | 'non_definito';

const TICK_MS = 1000;

export function useTimerLavoro({ operatoreId, aziendaId }: UseTimerLavoroOpts) {
  const [sessione, setSessione] = useState<OraLavoro | null>(null);
  const [storico, setStorico] = useState<OraLavoro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [stimePerFase, setStimePerFase] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!aziendaId) return;
    supabase.from('ops_workflow_fasi')
      .select('codice, tempo_stimato_min')
      .eq('azienda_id', aziendaId).eq('attiva', true)
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((r: any) => {
          if (r.codice && r.tempo_stimato_min) {
            map[r.codice.toLowerCase()] = r.tempo_stimato_min;
          }
        });
        setStimePerFase(map);
      });
  }, [aziendaId]);

  useEffect(() => {
    if (!sessione || sessione.stop_at) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }
    tickRef.current = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [sessione]);

  const refresh = useCallback(async () => {
    if (!operatoreId) {
      setSessione(null); setStorico([]); setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const [attivaRes, storicoRes] = await Promise.all([
        supabase.from('ore_lavoro').select('*').eq('operatore_id', operatoreId)
          .is('stop_at', null).order('start_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('ore_lavoro').select('*').eq('operatore_id', operatoreId)
          .not('stop_at', 'is', null).order('start_at', { ascending: false }).limit(20),
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

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!operatoreId) return;
    const ch = supabase.channel(`ore_lavoro_${operatoreId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ore_lavoro', filter: `operatore_id=eq.${operatoreId}` },
        () => refresh(),
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [operatoreId, refresh]);

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
      return {
        stato: 'paused', sessione,
        elapsedSeconds: Math.max(0, totalElapsed - pauseAccumulated - currentPause),
        pausedSeconds: currentPause,
      };
    }
    return {
      stato: 'running', sessione,
      elapsedSeconds: Math.max(0, totalElapsed - pauseAccumulated),
      pausedSeconds: 0,
    };
  }, [sessione, now]);

  const sforamento = useMemo(() => {
    if (!sessione || sessione.stop_at) {
      return { stato: 'non_definito' as StatoSforamento, percentuale: 0, stimaMin: null as number | null, restantiMin: null as number | null };
    }
    const stima = stimePerFase[String(sessione.fase).toLowerCase()];
    if (!stima || stima <= 0) {
      return { stato: 'non_definito' as StatoSforamento, percentuale: 0, stimaMin: null, restantiMin: null };
    }
    const elapsedMin = snapshot.elapsedSeconds / 60;
    const perc = (elapsedMin / stima) * 100;
    const restanti = Math.max(0, stima - elapsedMin);
    let stato: StatoSforamento = 'verde';
    if (perc >= 125) stato = 'critico';
    else if (perc >= 100) stato = 'rosso';
    else if (perc >= 75) stato = 'giallo';
    return { stato, percentuale: Math.round(perc), stimaMin: stima, restantiMin: Math.round(restanti) };
  }, [sessione, snapshot.elapsedSeconds, stimePerFase]);

  const start = useCallback(
    async ({ commessaId, fase, sottofase }: StartArgs) => {
      if (!operatoreId || !aziendaId) {
        setError('Operatore o azienda non identificati'); return null;
      }
      if (sessione && !sessione.stop_at) {
        setError('Timer già attivo. Stoppalo prima.'); return null;
      }
      setError(null);
      const nowIso = new Date().toISOString();
      const optimistic: OraLavoro = {
        id: `temp-${Date.now()}`,
        azienda_id: aziendaId, operatore_id: operatoreId, commessa_id: commessaId,
        fase: fase as string, sottofase: sottofase ?? null,
        start_at: nowIso, stop_at: null,
        pause_total_seconds: 0, pause_started_at: null, durata_minuti: null,
        note: null, motivo_stop: null, motivo_stop_dettaglio: null,
        parent_ora_id: null, auto_started_da: null,
        approvata_da: null, approvata_at: null,
        created_at: nowIso, updated_at: nowIso,
      };
      setSessione(optimistic);
      const { data, error: insErr } = await supabase
        .from('ore_lavoro')
        .insert({
          azienda_id: aziendaId, operatore_id: operatoreId, commessa_id: commessaId,
          fase, sottofase: sottofase ?? null, start_at: nowIso,
        }).select('*').single();
      if (insErr) { setSessione(null); setError(insErr.message); return null; }
      setSessione(data as OraLavoro);
      return data as OraLavoro;
    },
    [operatoreId, aziendaId, sessione],
  );

  const pause = useCallback(async () => {
    if (!sessione || sessione.stop_at || sessione.pause_started_at) return;
    const { data, error: upErr } = await supabase.from('ore_lavoro')
      .update({ pause_started_at: new Date().toISOString() })
      .eq('id', sessione.id).select('*').single();
    if (upErr) { setError(upErr.message); return; }
    setSessione(data as OraLavoro);
  }, [sessione]);

  const resume = useCallback(async () => {
    if (!sessione || sessione.stop_at || !sessione.pause_started_at) return;
    const pausedFor = Math.floor((Date.now() - new Date(sessione.pause_started_at).getTime()) / 1000);
    const newTotal = (sessione.pause_total_seconds || 0) + pausedFor;
    const { data, error: upErr } = await supabase.from('ore_lavoro')
      .update({ pause_started_at: null, pause_total_seconds: newTotal })
      .eq('id', sessione.id).select('*').single();
    if (upErr) { setError(upErr.message); return; }
    setSessione(data as OraLavoro);
  }, [sessione]);

  const stop = useCallback(
    async ({ motivo, dettaglio }: StopArgs) => {
      if (!sessione || sessione.stop_at) return null;
      let pauseTotal = sessione.pause_total_seconds || 0;
      if (sessione.pause_started_at) {
        pauseTotal += Math.floor((Date.now() - new Date(sessione.pause_started_at).getTime()) / 1000);
      }
      const { data, error: upErr } = await supabase.from('ore_lavoro')
        .update({
          stop_at: new Date().toISOString(),
          pause_started_at: null, pause_total_seconds: pauseTotal,
          motivo_stop: motivo,
          motivo_stop_dettaglio: dettaglio?.trim() || null,
        }).eq('id', sessione.id).select('*').single();
      if (upErr) { setError(upErr.message); return null; }
      if (MOTIVI_CHE_NOTIFICANO.includes(motivo) && aziendaId) {
        await creaAlertProblema({
          aziendaId, commessaId: sessione.commessa_id,
          operatoreId: sessione.operatore_id, oraId: sessione.id,
          fase: sessione.fase, dettaglio: dettaglio ?? '',
        });
      }
      setSessione(null);
      setStorico(prev => [data as OraLavoro, ...prev].slice(0, 20));
      return data as OraLavoro;
    },
    [sessione, aziendaId],
  );

  const annulla = useCallback(async () => {
    if (!sessione || sessione.stop_at) return;
    await supabase.from('ore_lavoro').delete().eq('id', sessione.id);
    setSessione(null);
  }, [sessione]);

  return {
    snapshot, storico, loading, error, sforamento,
    start, pause, resume, stop, annulla, refresh,
  };
}

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
