"use client";
// hooks/useSpese.ts - Blocco 3 Centro Finanze: Spese titolare + Fatture ricevute + Pagamenti fornitori
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// =============== TYPES ===============
export interface SpesaRow {
  id: string;
  azienda_id: string;
  data: string;
  importo: number;
  categoria: string;
  sotto_categoria: string | null;
  descrizione: string | null;
  fornitore: string | null;
  commessa_id: string | null;
  mezzo_id: string | null;
  operatore_id: string | null;
  foto_url: string | null;
  detraibile_iva: boolean;
  iva_percent: number;
  imponibile: number | null;
  iva: number | null;
  metodo_pagamento: string | null;
  conto_id: string | null;
  note: string | null;
  created_at: string;
}

export interface SpeseKPI {
  n_totali: number;
  n_mese: number;
  totale_globale: number;
  totale_mese: number;
  totale_mese_scorso: number;
  totale_90gg: number;
}

export interface SpesaCategoriaRow {
  categoria: string;
  n_spese: number;
  totale: number;
  imponibile: number;
  iva_detraibile: number;
}

export interface FatturaRicevutaRow {
  id: string;
  azienda_id: string;
  numero: string;
  data_ricezione: string;
  data_scadenza: string | null;
  fornitore: string;
  fornitore_piva: string | null;
  imponibile: number;
  iva: number;
  totale: number;
  pagato: number;
  residuo: number;
  stato: string;
  stato_calcolato: 'pagata' | 'scaduta' | 'parziale' | 'da_pagare' | 'annullata';
  giorni_a_scadenza: number | null;
  giorni_ritardo: number;
  categoria: string | null;
  commessa_code: string | null;
  note: string | null;
  created_at: string;
}

export interface FattRicevuteKPI {
  n_totali: number;
  n_pagate: number;
  n_da_pagare: number;
  n_scadute: number;
  importo_totale: number;
  importo_pagato: number;
  importo_da_pagare: number;
  importo_scaduto: number;
}

export type FiltroSpese = 'tutte' | 'mese' | 'mese_scorso' | '90gg';
export type FiltroFattRic = 'tutte' | 'da_pagare' | 'scadute' | 'pagate';

// =============== HOOK ===============
export function useSpese(aziendaId: string | null) {
  const [spese, setSpese] = useState<SpesaRow[]>([]);
  const [kpiSpese, setKpiSpese] = useState<SpeseKPI | null>(null);
  const [categorieSpese, setCategorieSpese] = useState<SpesaCategoriaRow[]>([]);
  const [fattRicevute, setFattRicevute] = useState<FatturaRicevutaRow[]>([]);
  const [kpiFatt, setKpiFatt] = useState<FattRicevuteKPI | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    try {
      const [spRes, kpiSpRes, catRes, fRes, kpiFRes] = await Promise.all([
        supabase.from('fin_spese').select('*').eq('azienda_id', aziendaId).order('data', { ascending: false }).limit(100),
        supabase.from('v_fin_spese_kpi').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('v_fin_spese_categorie_mese').select('*').eq('azienda_id', aziendaId),
        supabase.from('v_fin_fatture_ricevute_lista').select('*').eq('azienda_id', aziendaId).order('data_scadenza', { ascending: true }),
        supabase.from('v_fin_fatture_ricevute_kpi').select('*').eq('azienda_id', aziendaId).maybeSingle(),
      ]);

      setSpese((spRes.data || []) as SpesaRow[]);
      setKpiSpese(kpiSpRes.data ? {
        n_totali:           Number(kpiSpRes.data.n_totali || 0),
        n_mese:             Number(kpiSpRes.data.n_mese || 0),
        totale_globale:     Number(kpiSpRes.data.totale_globale || 0),
        totale_mese:        Number(kpiSpRes.data.totale_mese || 0),
        totale_mese_scorso: Number(kpiSpRes.data.totale_mese_scorso || 0),
        totale_90gg:        Number(kpiSpRes.data.totale_90gg || 0),
      } : null);
      setCategorieSpese((catRes.data || []) as SpesaCategoriaRow[]);
      setFattRicevute((fRes.data || []) as FatturaRicevutaRow[]);
      setKpiFatt(kpiFRes.data ? {
        n_totali:          Number(kpiFRes.data.n_totali || 0),
        n_pagate:          Number(kpiFRes.data.n_pagate || 0),
        n_da_pagare:       Number(kpiFRes.data.n_da_pagare || 0),
        n_scadute:         Number(kpiFRes.data.n_scadute || 0),
        importo_totale:    Number(kpiFRes.data.importo_totale || 0),
        importo_pagato:    Number(kpiFRes.data.importo_pagato || 0),
        importo_da_pagare: Number(kpiFRes.data.importo_da_pagare || 0),
        importo_scaduto:   Number(kpiFRes.data.importo_scaduto || 0),
      } : null);
    } catch (e) {
      console.warn('[useSpese]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`spese-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_spese', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_fatture_ricevute', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_pagamenti', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  // ============== AZIONI SPESE ==============
  async function creaSpesa(args: {
    data: string;
    importo: number;
    categoria: string;
    sotto_categoria?: string;
    descrizione?: string;
    fornitore?: string;
    commessa_code?: string | null;
    mezzo_id?: string | null;
    detraibile_iva?: boolean;
    iva_percent?: number;
    foto_url?: string | null;
    note?: string;
  }): Promise<{ ok: boolean; error?: string; id?: string }> {
    if (!aziendaId) return { ok: false, error: 'Azienda non definita' };
    const iva_p = args.iva_percent !== undefined ? args.iva_percent : 22;
    const imponibile = +((args.importo / (1 + iva_p / 100))).toFixed(2);
    const iva_amt = +(args.importo - imponibile).toFixed(2);

    const { data, error } = await supabase.from('fin_spese').insert({
      azienda_id: aziendaId,
      data: args.data,
      importo: args.importo,
      categoria: args.categoria,
      sotto_categoria: args.sotto_categoria || null,
      descrizione: args.descrizione || null,
      fornitore: args.fornitore || null,
      commessa_id: args.commessa_code || null,
      mezzo_id: args.mezzo_id || null,
      foto_url: args.foto_url || null,
      detraibile_iva: args.detraibile_iva !== false,
      iva_percent: iva_p,
      imponibile,
      iva: iva_amt,
      note: args.note || null,
    }).select('id').single();

    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, id: data?.id };
  }

  async function eliminaSpesa(spesaId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from('fin_spese').delete().eq('id', spesaId);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  // ============== AZIONI FATTURE RICEVUTE ==============
  async function creaFatturaRicevuta(args: {
    numero: string;
    data_ricezione: string;
    data_scadenza?: string | null;
    fornitore: string;
    fornitore_piva?: string;
    imponibile: number;
    iva_percent: number;
    categoria?: string;
    commessa_code?: string | null;
    note?: string;
  }): Promise<{ ok: boolean; error?: string; id?: string }> {
    if (!aziendaId) return { ok: false, error: 'Azienda non definita' };

    const iva_amt = +(args.imponibile * args.iva_percent / 100).toFixed(2);
    const totale = +(args.imponibile + iva_amt).toFixed(2);

    const { data, error } = await supabase.from('fin_fatture_ricevute').insert({
      azienda_id: aziendaId,
      numero: args.numero,
      data_ricezione: args.data_ricezione,
      data_scadenza: args.data_scadenza || null,
      fornitore: args.fornitore,
      fornitore_piva: args.fornitore_piva || null,
      imponibile: args.imponibile,
      iva: iva_amt,
      totale,
      pagato: 0,
      residuo: totale,
      stato: 'da_pagare',
      categoria: args.categoria || null,
      commessa_code: args.commessa_code || null,
      note: args.note || null,
    }).select('id').single();

    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, id: data?.id };
  }

  // ============== PAGAMENTO FORNITORE ==============
  async function registraPagamentoFornitore(args: {
    fatturaRicevutaId: string;
    importo: number;
    data: string;
    metodo: string;
    contoId?: string | null;
    riferimento?: string;
    fornitore?: string;
    note?: string;
  }): Promise<{ ok: boolean; error?: string }> {
    if (!aziendaId) return { ok: false, error: 'Azienda non definita' };
    const { error } = await supabase.from('fin_pagamenti').insert({
      azienda_id: aziendaId,
      fattura_ricevuta_id: args.fatturaRicevutaId,
      data_pagamento: args.data,
      importo: args.importo,
      metodo: args.metodo,
      conto_id: args.contoId || null,
      fornitore: args.fornitore || null,
      riferimento: args.riferimento || null,
      note: args.note || null,
    });
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function annullaFatturaRicevuta(fatturaId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from('fin_fatture_ricevute').update({ stato: 'annullata' }).eq('id', fatturaId);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function getPagamentiFatturaRicevuta(fatturaId: string): Promise<any[]> {
    const { data } = await supabase
      .from('fin_pagamenti')
      .select('*')
      .eq('fattura_ricevuta_id', fatturaId)
      .order('data_pagamento', { ascending: false });
    return data || [];
  }

  // ============== FILTRI ==============
  function filtraSpese(filtro: FiltroSpese, search?: string): SpesaRow[] {
    let list = [...spese];
    const oggi = new Date();
    const meseStart = new Date(oggi.getFullYear(), oggi.getMonth(), 1).toISOString().split('T')[0];
    const meseScorsoStart = new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1).toISOString().split('T')[0];
    const giorni90Start = new Date(oggi.getTime() - 90 * 86400000).toISOString().split('T')[0];

    if (filtro === 'mese')        list = list.filter(s => s.data >= meseStart);
    if (filtro === 'mese_scorso') list = list.filter(s => s.data >= meseScorsoStart && s.data < meseStart);
    if (filtro === '90gg')        list = list.filter(s => s.data >= giorni90Start);

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        (s.categoria || '').toLowerCase().includes(q) ||
        (s.descrizione || '').toLowerCase().includes(q) ||
        (s.fornitore || '').toLowerCase().includes(q) ||
        (s.commessa_id || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  function filtraFattRicevute(filtro: FiltroFattRic, search?: string): FatturaRicevutaRow[] {
    let list = [...fattRicevute];
    if (filtro === 'da_pagare') list = list.filter(f => f.stato_calcolato === 'da_pagare' || f.stato_calcolato === 'parziale');
    if (filtro === 'scadute')   list = list.filter(f => f.stato_calcolato === 'scaduta');
    if (filtro === 'pagate')    list = list.filter(f => f.stato_calcolato === 'pagata');

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        (f.fornitore || '').toLowerCase().includes(q) ||
        (f.numero || '').toLowerCase().includes(q) ||
        (f.commessa_code || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  return {
    spese,
    kpiSpese,
    categorieSpese,
    fattRicevute,
    kpiFatt,
    loading,
    reload: load,
    filtraSpese,
    filtraFattRicevute,
    creaSpesa,
    eliminaSpesa,
    creaFatturaRicevuta,
    annullaFatturaRicevuta,
    registraPagamentoFornitore,
    getPagamentiFatturaRicevuta,
  };
}

// =============== UTILS ===============
export const CATEGORIE_SPESA = [
  { val: 'carburante',     label: 'Carburante',      icon: '⛽' },
  { val: 'materiali',      label: 'Materiali',       icon: '📦' },
  { val: 'attrezzi',       label: 'Attrezzi',        icon: '🔧' },
  { val: 'manutenzione',   label: 'Manutenzione',    icon: '🛠' },
  { val: 'vitto_lavoro',   label: 'Vitto lavoro',    icon: '🍽' },
  { val: 'cancelleria',    label: 'Cancelleria',     icon: '📝' },
  { val: 'telefonia',      label: 'Telefonia',       icon: '📱' },
  { val: 'utenze',         label: 'Utenze',          icon: '💡' },
  { val: 'assicurazione',  label: 'Assicurazione',   icon: '🛡' },
  { val: 'consulenze',     label: 'Consulenze',      icon: '👔' },
  { val: 'pubblicita',     label: 'Pubblicità',      icon: '📢' },
  { val: 'altro',          label: 'Altro',           icon: '•••' },
];

export const METODI_PAGAMENTO = ['bonifico', 'contanti', 'carta', 'assegno', 'addebito', 'altro'];

export function statoFattRicLabel(s: FatturaRicevutaRow['stato_calcolato']): string {
  switch (s) {
    case 'pagata':    return 'Pagata';
    case 'scaduta':   return 'Scaduta';
    case 'parziale':  return 'Acconto';
    case 'annullata': return 'Annullata';
    default:          return 'Da pagare';
  }
}