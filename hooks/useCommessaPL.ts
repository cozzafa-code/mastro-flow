"use client";
// hooks/useCommessaPL.ts - Blocco 8 Centro Finanze: P&L margine reale per commessa
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface CommessaPLRow {
  commessa_id: string;
  azienda_id: string;
  commessa_code: string;
  cliente: string | null;
  fase: string | null;
  indirizzo: string | null;
  totale_preventivo: number | null;
  totale_finale: number | null;
  prezzo_finale_eur: number | null;
  margine_atteso_pct: number | null;
  created_at: string;
  // Ricavi
  ricavi_fatturati: number;
  ricavi_incassati: number;
  ricavi_da_incassare: number;
  n_fatture: number;
  // Costi
  costi_materiali: number;
  costi_materiali_pagati: number;
  costi_spese: number;
  n_spese: number;
  n_fatt_fornitore: number;
  costi_totali: number;
  // Utile
  utile_reale: number;
  utile_cassa: number;
  margine_pct_reale: number | null;
  delta_margine_pct: number | null;
  stato_pl: 'solo_costi' | 'no_dati' | 'in_perdita' | 'basso_margine' | 'margine_ok' | 'margine_ottimo';
}

export interface PLKPIAzienda {
  n_commesse_totali: number;
  n_margine_ottimo: number;
  n_margine_ok: number;
  n_basso_margine: number;
  n_in_perdita: number;
  n_no_dati: number;
  ricavi_totali: number;
  costi_totali: number;
  utile_totale: number;
  margine_medio_pct: number | null;
}

export function useCommessaPL(aziendaId: string | null) {
  const [commesse, setCommesse] = useState<CommessaPLRow[]>([]);
  const [kpi, setKpi] = useState<PLKPIAzienda | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    try {
      const [listRes, kpiRes] = await Promise.all([
        supabase.from('v_fin_commessa_pl').select('*').eq('azienda_id', aziendaId).order('utile_reale', { ascending: false }),
        supabase.from('v_fin_pl_kpi_azienda').select('*').eq('azienda_id', aziendaId).maybeSingle(),
      ]);

      const list = (listRes.data || []).map((r: any) => ({
        ...r,
        ricavi_fatturati:       Number(r.ricavi_fatturati || 0),
        ricavi_incassati:       Number(r.ricavi_incassati || 0),
        ricavi_da_incassare:    Number(r.ricavi_da_incassare || 0),
        costi_materiali:        Number(r.costi_materiali || 0),
        costi_materiali_pagati: Number(r.costi_materiali_pagati || 0),
        costi_spese:            Number(r.costi_spese || 0),
        costi_totali:           Number(r.costi_totali || 0),
        utile_reale:            Number(r.utile_reale || 0),
        utile_cassa:            Number(r.utile_cassa || 0),
        margine_pct_reale:      r.margine_pct_reale !== null ? Number(r.margine_pct_reale) : null,
        delta_margine_pct:      r.delta_margine_pct !== null ? Number(r.delta_margine_pct) : null,
        totale_preventivo:      r.totale_preventivo !== null ? Number(r.totale_preventivo) : null,
        totale_finale:          r.totale_finale !== null ? Number(r.totale_finale) : null,
        prezzo_finale_eur:      r.prezzo_finale_eur !== null ? Number(r.prezzo_finale_eur) : null,
        margine_atteso_pct:     r.margine_atteso_pct !== null ? Number(r.margine_atteso_pct) : null,
        n_fatture:              Number(r.n_fatture || 0),
        n_spese:                Number(r.n_spese || 0),
        n_fatt_fornitore:       Number(r.n_fatt_fornitore || 0),
      })) as CommessaPLRow[];
      setCommesse(list);

      setKpi(kpiRes.data ? {
        n_commesse_totali:  Number(kpiRes.data.n_commesse_totali || 0),
        n_margine_ottimo:   Number(kpiRes.data.n_margine_ottimo || 0),
        n_margine_ok:       Number(kpiRes.data.n_margine_ok || 0),
        n_basso_margine:    Number(kpiRes.data.n_basso_margine || 0),
        n_in_perdita:       Number(kpiRes.data.n_in_perdita || 0),
        n_no_dati:          Number(kpiRes.data.n_no_dati || 0),
        ricavi_totali:      Number(kpiRes.data.ricavi_totali || 0),
        costi_totali:       Number(kpiRes.data.costi_totali || 0),
        utile_totale:       Number(kpiRes.data.utile_totale || 0),
        margine_medio_pct:  kpiRes.data.margine_medio_pct !== null ? Number(kpiRes.data.margine_medio_pct) : null,
      } : null);
    } catch (e) {
      console.warn('[useCommessaPL]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`pl-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_fatture_emesse', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_fatture_ricevute', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_spese', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  // Solo commesse con dati significativi (ricavi o costi)
  const commesseAttive = commesse.filter(c => c.ricavi_fatturati > 0 || c.costi_totali > 0);
  
  const top5 = [...commesseAttive].sort((a, b) => b.utile_reale - a.utile_reale).slice(0, 5);
  const bottom5 = [...commesseAttive].sort((a, b) => a.utile_reale - b.utile_reale).slice(0, 5);
  const inPerdita = commesseAttive.filter(c => c.stato_pl === 'in_perdita');
  const bassoMargine = commesseAttive.filter(c => c.stato_pl === 'basso_margine');

  function getCommessa(code: string): CommessaPLRow | null {
    return commesse.find(c => c.commessa_code === code) || null;
  }

  return {
    commesse,
    commesseAttive,
    kpi,
    loading,
    top5,
    bottom5,
    inPerdita,
    bassoMargine,
    getCommessa,
    reload: load,
  };
}

export function statoPLMeta(stato: CommessaPLRow['stato_pl']): { label: string; emoji: string; tone: 'green' | 'red' | 'amber' | 'navy' | 'teal' } {
  switch (stato) {
    case 'margine_ottimo':  return { label: 'Margine ottimo',  emoji: '🟢', tone: 'green' };
    case 'margine_ok':      return { label: 'Margine ok',      emoji: '✓',  tone: 'teal' };
    case 'basso_margine':   return { label: 'Margine basso',   emoji: '⚠',  tone: 'amber' };
    case 'in_perdita':      return { label: 'IN PERDITA',      emoji: '🔴', tone: 'red' };
    case 'solo_costi':      return { label: 'Solo costi',      emoji: '⏳', tone: 'navy' };
    default:                return { label: 'Nessun dato',     emoji: '•',  tone: 'navy' };
  }
}mpl