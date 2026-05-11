"use client";
// hooks/useTasse.ts - Blocco 7 Centro Finanze: Liquidazioni IVA + Calendario fiscale
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface LiquidazioneIva {
  id: string;
  azienda_id: string;
  periodo: string;
  tipo_periodo: string;
  iva_vendite: number;
  iva_acquisti: number;
  iva_dovuta: number;
  credito_precedente: number;
  debito_versare: number;
  stato: string;
  data_versamento: string | null;
  f24_riferimento: string | null;
  note: string | null;
  stato_calcolato: 'versata' | 'scaduta' | 'urgente' | 'da_versare' | 'altro';
  giorni_a_scadenza: number | null;
  giorni_ritardo: number;
  created_at: string;
}

export interface TasseKPI {
  n_liquidazioni: number;
  n_aperte: number;
  n_versate: number;
  n_scadute: number;
  importo_da_versare: number;
  importo_scaduto: number;
  importo_versato_totale: number;
  prossima_scadenza: string | null;
}

export interface EventoFiscale {
  id_evento: string;
  azienda_id: string;
  data: string;
  tipo: string;
  descrizione: string;
  importo: number;
  stato: string;
  riferimento: string;
  stato_calcolato: 'versata' | 'scaduta' | 'urgente' | 'da_versare' | 'altro';
}

export function useTasse(aziendaId: string | null) {
  const [liquidazioni, setLiquidazioni] = useState<LiquidazioneIva[]>([]);
  const [kpi, setKpi] = useState<TasseKPI | null>(null);
  const [calendario, setCalendario] = useState<EventoFiscale[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    try {
      const [liqRes, kpiRes, calRes] = await Promise.all([
        supabase.from('v_fin_liquidazione_iva_lista').select('*').eq('azienda_id', aziendaId).order('data_versamento', { ascending: false }),
        supabase.from('v_fin_tasse_kpi').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('v_fin_calendario_fiscale').select('*').eq('azienda_id', aziendaId).order('data', { ascending: true }),
      ]);

      setLiquidazioni((liqRes.data || []).map((r: any) => ({
        ...r,
        iva_vendite:        Number(r.iva_vendite || 0),
        iva_acquisti:       Number(r.iva_acquisti || 0),
        iva_dovuta:         Number(r.iva_dovuta || 0),
        credito_precedente: Number(r.credito_precedente || 0),
        debito_versare:     Number(r.debito_versare || 0),
        giorni_a_scadenza:  r.giorni_a_scadenza !== null ? Number(r.giorni_a_scadenza) : null,
        giorni_ritardo:     Number(r.giorni_ritardo || 0),
      })) as LiquidazioneIva[]);

      setKpi(kpiRes.data ? {
        n_liquidazioni:         Number(kpiRes.data.n_liquidazioni || 0),
        n_aperte:               Number(kpiRes.data.n_aperte || 0),
        n_versate:              Number(kpiRes.data.n_versate || 0),
        n_scadute:              Number(kpiRes.data.n_scadute || 0),
        importo_da_versare:     Number(kpiRes.data.importo_da_versare || 0),
        importo_scaduto:        Number(kpiRes.data.importo_scaduto || 0),
        importo_versato_totale: Number(kpiRes.data.importo_versato_totale || 0),
        prossima_scadenza:      kpiRes.data.prossima_scadenza || null,
      } : null);

      setCalendario((calRes.data || []).map((r: any) => ({
        ...r,
        importo: Number(r.importo || 0),
      })) as EventoFiscale[]);
    } catch (e) {
      console.warn('[useTasse]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`tasse-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_liquidazione_iva', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_scadenze', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  async function marcaVersata(liquidazioneId: string, f24Rif?: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase
      .from('fin_liquidazione_iva')
      .update({ stato: 'versata', f24_riferimento: f24Rif || null })
      .eq('id', liquidazioneId);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  // Eventi prossimi 60gg
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const limite = new Date(oggi.getTime() + 60*86400000);
  const eventiProssimi = calendario.filter(e => {
    const d = new Date(e.data); d.setHours(0,0,0,0);
    return d >= oggi && d <= limite && e.stato_calcolato !== 'versata';
  });

  const eventiScaduti = calendario.filter(e => e.stato_calcolato === 'scaduta');

  return {
    liquidazioni,
    kpi,
    calendario,
    eventiProssimi,
    eventiScaduti,
    loading,
    reload: load,
    marcaVersata,
  };
}

export function tipoEventoMeta(tipo: string): { label: string; emoji: string; tone: 'red' | 'amber' | 'blue' | 'violet' | 'navy' } {
  switch (tipo.toLowerCase()) {
    case 'iva':       return { label: 'IVA',          emoji: '🟦', tone: 'blue' };
    case 'inps':      return { label: 'INPS',         emoji: '👥', tone: 'red' };
    case 'inail':     return { label: 'INAIL',        emoji: '🛡', tone: 'red' };
    case 'contributi':return { label: 'Contributi',   emoji: '👥', tone: 'red' };
    case 'irpef':     return { label: 'IRPEF',        emoji: '💰', tone: 'amber' };
    case 'ires':      return { label: 'IRES',         emoji: '💰', tone: 'amber' };
    case 'irap':      return { label: 'IRAP',         emoji: '💰', tone: 'amber' };
    case 'ritenuta':
    case 'ritenute':  return { label: 'Ritenute',     emoji: '📋', tone: 'violet' };
    case 'imu':       return { label: 'IMU',          emoji: '🏠', tone: 'navy' };
    case 'tasi':      return { label: 'TASI',         emoji: '🏠', tone: 'navy' };
    case 'f24':       return { label: 'F24',          emoji: '📄', tone: 'blue' };
    default:          return { label: tipo.toUpperCase(), emoji: '•', tone: 'navy' };
  }
}