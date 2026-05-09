// hooks/useApiKeys.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ApiKey, ApiKeyStats } from '@/lib/types';

export function useApiKeys(aziendaId: string) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<ApiKeyStats>({
    callsMonth: 0,
    activeKeys: 0,
    expiringKeys: 0,
    planLimit: 1000,
    planName: 'START',
  });
  const [loading, setLoading] = useState(true);

  const fetchKeys = useCallback(async () => {
    if (!aziendaId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: keysData } = await supabase
      .from('api_keys')
      .select('*')
      .eq('azienda_id', aziendaId)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });

    const startMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count: callsMonth } = await supabase
      .from('api_logs')
      .select('id', { count: 'exact', head: true })
      .eq('azienda_id', aziendaId)
      .gte('created_at', startMonth);

    const { data: az } = await supabase
      .from('aziende')
      .select('piano')
      .eq('id', aziendaId)
      .maybeSingle();

    const planLimits: Record<string, number> = {
      base: 0, start: 1000, pro: 10000, titan: 100000, trial: 1000,
    };
    const piano = (az?.piano ?? 'start').toLowerCase();
    const planLimit = planLimits[piano] ?? 1000;

    const list = (keysData ?? []) as ApiKey[];
    const sevenDaysFromNow = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const expiring = list.filter(
      (k) => k.expires_at && new Date(k.expires_at).getTime() < sevenDaysFromNow
    ).length;

    setKeys(list);
    setStats({
      callsMonth: callsMonth ?? 0,
      activeKeys: list.length,
      expiringKeys: expiring,
      planLimit,
      planName: piano.toUpperCase(),
    });
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  return { keys, stats, loading, refresh: fetchKeys };
}
