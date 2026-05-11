"use client";
// hooks/usePrevisioneCollassi.ts
// Previsione collassi: calcola saturazione 14gg + alert proattivi

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface GiornoSaturazione {
  data: string;
  giorno_label: string;
  ore_pianificate: number;
  capacita_ore: number;
  saturazione_pct: number;
  livello: 'libero' | 'normale' | 'carico' | 'pieno' | 'saturo';
  n_montaggi: number;
}

export interface AlertCollasso {
  severity: 'block' | 'warn' | 'info';
  code: string;
  message: string;
  giorno?: string;
}

export function usePrevisioneCollassi(aziendaId: string | null) {
  const [giorni, setGiorni] = useState<GiornoSaturazione[]>([]);
  const [alerts, setAlerts] = useState<AlertCollasso[]>([]);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fromDate = today.toISOString().slice(0, 10);
      const toDt = new Date(today);
      toDt.setDate(toDt.getDate() + 14);
      const toDate = toDt.toISOString().slice(0, 10);

      // Numero squadre attive = capacità
      const { count: nSquadre } = await supabase
        .from('squadre')
        .select('id', { count: 'exact', head: true })
        .eq('azienda_id', aziendaId)
        .eq('attiva', true);

      const capacitaSquadre = Math.max(1, nSquadre || 1);
      const capacitaOreGiorno = capacitaSquadre * 8;

      // Carica montaggi nei 14gg
      const { data: montaggi } = await supabase
        .from('montaggi')
        .select('data_montaggio, ore_preventivate, commessa_id')
        .eq('azienda_id', aziendaId)
        .gte('data_montaggio', fromDate)
        .lte('data_montaggio', toDate);

      // Aggrega ore per giorno
      const oreByDay: Record<string, number> = {};
      const countByDay: Record<string, number> = {};
      (montaggi || []).forEach((m: any) => {
        if (!m.data_montaggio) return;
        const ore = Number(m.ore_preventivate) || 4;
        oreByDay[m.data_montaggio] = (oreByDay[m.data_montaggio] || 0) + ore;
        countByDay[m.data_montaggio] = (countByDay[m.data_montaggio] || 0) + 1;
      });

      // Costruisce array 14gg
      const giorniArr: GiornoSaturazione[] = [];
      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const ds = d.toISOString().slice(0, 10);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        const capacita = isWeekend ? 0 : capacitaOreGiorno;
        const ore = oreByDay[ds] || 0;
        const pct = capacita > 0 ? Math.round((ore / capacita) * 100) : 0;
        
        const livello: GiornoSaturazione['livello'] = 
          isWeekend ? 'libero' :
          pct >= 100 ? 'saturo' :
          pct >= 90 ? 'pieno' :
          pct >= 75 ? 'carico' :
          pct >= 40 ? 'normale' : 'libero';

        giorniArr.push({
          data: ds,
          giorno_label: d.toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' }),
          ore_pianificate: ore,
          capacita_ore: capacita,
          saturazione_pct: pct,
          livello,
          n_montaggi: countByDay[ds] || 0,
        });
      }
      setGiorni(giorniArr);

      // Genera alert
      const alertsArr: AlertCollasso[] = [];

      // Alert 1: giorni saturi (>= 100%)
      const saturi = giorniArr.filter(g => g.livello === 'saturo');
      saturi.forEach(g => {
        const daysFromNow = Math.ceil((new Date(g.data).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alertsArr.push({
          severity: 'block', code: 'GIORNO_SATURO', giorno: g.data,
          message: daysFromNow === 0 
            ? `OGGI saturo: ${g.ore_pianificate}h pianificate vs ${g.capacita_ore}h disponibili`
            : `Tra ${daysFromNow}gg (${g.giorno_label}) — produzione SATURA al ${g.saturazione_pct}%`
        });
      });

      // Alert 2: trend collasso (3+ giorni consecutivi >= 90%)
      let consec = 0;
      let consecStart: string | null = null;
      for (let i = 0; i < giorniArr.length; i++) {
        const g = giorniArr[i];
        if (g.saturazione_pct >= 90 && g.capacita_ore > 0) {
          if (consec === 0) consecStart = g.data;
          consec++;
          if (consec >= 3 && (i === giorniArr.length - 1 || giorniArr[i + 1].saturazione_pct < 90)) {
            alertsArr.push({
              severity: 'block', code: 'TREND_COLLASSO', giorno: consecStart || undefined,
              message: `Trend collasso: ${consec} giorni consecutivi >= 90% (da ${new Date(consecStart!).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })})`
            });
            consec = 0;
          }
        } else {
          consec = 0;
        }
      }

      // Alert 3: giorni carichi (75-89%)
      const carichi = giorniArr.filter(g => g.livello === 'carico');
      if (carichi.length > 0 && saturi.length === 0) {
        const primo = carichi[0];
        const daysFromNow = Math.ceil((new Date(primo.data).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alertsArr.push({
          severity: 'warn', code: 'GIORNO_CARICO', giorno: primo.data,
          message: `Tra ${daysFromNow}gg (${primo.giorno_label}) carico al ${primo.saturazione_pct}% — attenzione`
        });
      }

      // Alert 4: bassa saturazione (capacità sprecata)
      const liberiProssimi7 = giorniArr.slice(0, 7).filter(g => g.livello === 'libero' && g.capacita_ore > 0);
      if (liberiProssimi7.length >= 4) {
        alertsArr.push({
          severity: 'info', code: 'CAPACITA_LIBERA',
          message: `${liberiProssimi7.length} giorni feriali liberi prossimi 7gg — capacità disponibile per nuovi montaggi`
        });
      }

      setAlerts(alertsArr);
    } catch (e) {
      console.warn('[usePrevisioneCollassi]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { compute(); }, [compute]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`prev-coll-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'montaggi' }, compute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squadre' }, compute)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, compute]);

  return { giorni, alerts, loading };
}
