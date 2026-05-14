"use client";
// hooks/useFattureFinanze.ts - Blocco 2 Centro Finanze: fatture emesse + pagamenti
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface FatturaFin {
  id: string;
  azienda_id: string;
  numero: string;
  data_emissione: string;
  data_scadenza: string | null;
  cliente: string | null;
  cliente_ragione_sociale: string | null;
  cliente_nome: string | null;
  cliente_email: string | null;
  cliente_citta: string | null;
  cliente_provincia: string | null;
  cliente_indirizzo: string | null;
  cliente_piva: string | null;
  cliente_cf: string | null;
  cliente_display: string;
  imponibile: number;
  iva_percent: number;
  iva: number;
  totale: number;
  pagato: number;
  residuo: number;
  stato: string;
  stato_calcolato: 'pagata' | 'scaduta' | 'parziale' | 'aperta' | 'annullata';
  giorni_a_scadenza: number | null;
  giorni_ritardo: number;
  tipo: string;
  commessa_code: string | null;
  commessa_id: string | null;
  sdi_inviata: boolean;
  sdi_stato: string | null;
  sdi_status: string | null;
  pdf_url: string | null;
  note: string | null;
  righe: any;
  created_at: string;
  updated_at: string;
}

export interface FattureKPI {
  n_totali: number;
  n_pagate: number;
  n_aperte: number;
  n_scadute: number;
  importo_totale: number;
  importo_pagato: number;
  importo_aperto: number;
  importo_scaduto: number;
}

export interface PagamentoRow {
  id: string;
  azienda_id: string;
  fattura_emessa_id: string | null;
  data_pagamento: string;
  importo: number;
  metodo: string;
  conto_id: string | null;
  cliente: string | null;
  commessa_id: string | null;
  riferimento: string | null;
  note: string | null;
  created_at: string;
}

export interface ClienteAffidabilita {
  cliente_key: string;
  n_pagamenti: number;
  giorni_medi_pagamento: number;
  giorni_medi_ritardo_su_scadenza: number;
  totale_pagato: number;
}

export type FiltroFatture = 'tutte' | 'aperte' | 'scadute' | 'pagate' | 'parziali';

export function useFattureFinanze(aziendaId: string | null) {
  const [fatture, setFatture] = useState<FatturaFin[]>([]);
  const [kpi, setKpi] = useState<FattureKPI | null>(null);
  const [pagamenti, setPagamenti] = useState<PagamentoRow[]>([]);
  const [affidabilita, setAffidabilita] = useState<ClienteAffidabilita[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    try {
      const [fattRes, kpiRes, pagRes, affRes] = await Promise.all([
        supabase.from('v_fin_fatture_lista').select('*').eq('azienda_id', aziendaId).order('data_emissione', { ascending: false }),
        supabase.from('v_fin_fatture_kpi').select('*').eq('azienda_id', aziendaId).maybeSingle(),
        supabase.from('fin_pagamenti').select('*').eq('azienda_id', aziendaId).order('data_pagamento', { ascending: false }).limit(50),
        supabase.from('v_fin_cliente_affidabilita').select('*').eq('azienda_id', aziendaId).order('totale_pagato', { ascending: false }),
      ]);
      setFatture((fattRes.data || []) as FatturaFin[]);
      setKpi(kpiRes.data ? {
        n_totali:        Number(kpiRes.data.n_totali || 0),
        n_pagate:        Number(kpiRes.data.n_pagate || 0),
        n_aperte:        Number(kpiRes.data.n_aperte || 0),
        n_scadute:       Number(kpiRes.data.n_scadute || 0),
        importo_totale:  Number(kpiRes.data.importo_totale || 0),
        importo_pagato:  Number(kpiRes.data.importo_pagato || 0),
        importo_aperto:  Number(kpiRes.data.importo_aperto || 0),
        importo_scaduto: Number(kpiRes.data.importo_scaduto || 0),
      } : null);
      setPagamenti((pagRes.data || []) as PagamentoRow[]);
      setAffidabilita((affRes.data || []) as ClienteAffidabilita[]);
    } catch (e) {
      console.warn('[useFattureFinanze]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`fatt-fin-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_fatture_emesse', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fin_pagamenti', filter: `azienda_id=eq.${aziendaId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  async function registraPagamento(args: {
    fatturaId: string;
    importo: number;
    data: string;
    metodo: string;
    contoId?: string | null;
    riferimento?: string;
    note?: string;
    cliente?: string;
    commessaCode?: string | null;
  }): Promise<{ ok: boolean; error?: string }> {
    if (!aziendaId) return { ok: false, error: 'Azienda non definita' };
    const { error } = await supabase.from('fin_pagamenti').insert({
      azienda_id: aziendaId,
      fattura_emessa_id: args.fatturaId,
      data_pagamento: args.data,
      importo: args.importo,
      metodo: args.metodo,
      conto_id: args.contoId || null,
      cliente: args.cliente || null,
      commessa_id: args.commessaCode || null,
      riferimento: args.riferimento || null,
      note: args.note || null,
    });
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function eliminaPagamento(pagamentoId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from('fin_pagamenti').delete().eq('id', pagamentoId);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function creaFattura(args: {
    cliente: string;
    cliente_ragione_sociale?: string;
    cliente_piva?: string;
    cliente_cf?: string;
    cliente_email?: string;
    cliente_indirizzo?: string;
    cliente_citta?: string;
    cliente_provincia?: string;
    data_emissione: string;
    data_scadenza?: string | null;
    imponibile: number;
    iva_percent: number;
    tipo: 'acconto' | 'saldo' | 'sal' | 'unica' | 'altro';
    commessa_code?: string | null;
    note?: string;
    righe?: any[];
    // PRO multi-riga
    cliente_sdi?: string;
    tipo_documento_sdi?: string;
    bollo?: number;
    ecobonus_tipo?: string;
    sconto_in_fattura?: boolean;
    riepilogo_iva?: any[];
    bene_significativo_calc?: any;
    causale_forfettario?: string;
    modalita_pagamento?: string;
    perc_acconto?: number;
    totale_imponibile?: number;
    totale_iva?: number;
    totale?: number;
  }): Promise<{ ok: boolean; id?: string; error?: string }> {
    if (!aziendaId) return { ok: false, error: 'Azienda non definita' };

    const { data: ultimaFatt } = await supabase
      .from('fin_fatture_emesse')
      .select('numero')
      .eq('azienda_id', aziendaId)
      .order('created_at', { ascending: false })
      .limit(1);

    let nuovoNumero = `2026/001`;
    if (ultimaFatt && ultimaFatt[0]?.numero) {
      const match = String(ultimaFatt[0].numero).match(/(\d{4})\/(\d+)/);
      if (match) {
        const anno = match[1];
        const prog = parseInt(match[2]) + 1;
        nuovoNumero = `${anno}/${String(prog).padStart(3, '0')}`;
      }
    }

    const iva_importo = +(args.imponibile * args.iva_percent / 100).toFixed(2);
    const totale = +(args.imponibile + iva_importo).toFixed(2);

    // PRO: se ricevuto totale_imponibile da modal multi-riga, uso quello
    const finalImp     = args.totale_imponibile != null ? args.totale_imponibile : args.imponibile;
    const finalIva     = args.totale_iva != null ? args.totale_iva : iva_importo;
    const finalTotale  = args.totale != null ? args.totale : totale;
    const finalIvaPct  = args.iva_percent != null ? args.iva_percent : 22;
    const finalBollo   = args.bollo || 0;

    const { data, error } = await supabase.from('fin_fatture_emesse').insert({
      azienda_id: aziendaId,
      numero: nuovoNumero,
      data_emissione: args.data_emissione,
      data_scadenza: args.data_scadenza || null,
      cliente: args.cliente,
      cliente_ragione_sociale: args.cliente_ragione_sociale || null,
      cliente_nome: args.cliente_ragione_sociale ? null : args.cliente,
      cliente_email: args.cliente_email || null,
      cliente_piva: args.cliente_piva || null,
      cliente_cf: args.cliente_cf || null,
      cliente_indirizzo: args.cliente_indirizzo || null,
      cliente_citta: args.cliente_citta || null,
      cliente_provincia: args.cliente_provincia || null,
      cliente_sdi: args.cliente_sdi || null,
      imponibile: finalImp,
      iva_percent: finalIvaPct,
      iva: finalIva,
      totale: finalTotale,
      pagato: 0,
      residuo: finalTotale,
      stato: 'emessa',
      tipo: args.tipo || 'unica',
      commessa_code: args.commessa_code || null,
      note: args.note || null,
      righe: args.righe ? JSON.stringify(args.righe) : null,
      // === Campi PRO ===
      tipo_documento_sdi: args.tipo_documento_sdi || 'TD01',
      bollo: finalBollo,
      ecobonus_tipo: args.ecobonus_tipo || null,
      sconto_in_fattura: args.sconto_in_fattura || false,
      riepilogo_iva: args.riepilogo_iva ? JSON.stringify(args.riepilogo_iva) : null,
      bene_significativo_calc: args.bene_significativo_calc ? JSON.stringify(args.bene_significativo_calc) : null,
      causale_forfettario: args.causale_forfettario || null,
      modalita_pagamento: args.modalita_pagamento || null,
      perc_acconto: args.perc_acconto || null,
    }).select('id').single();

    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, id: data?.id };
  }

  async function annullaFattura(fatturaId: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.from('fin_fatture_emesse').update({ stato: 'annullata' }).eq('id', fatturaId);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true };
  }

  async function getPagamentiPerFattura(fatturaId: string): Promise<PagamentoRow[]> {
    const { data } = await supabase
      .from('fin_pagamenti')
      .select('*')
      .eq('fattura_emessa_id', fatturaId)
      .order('data_pagamento', { ascending: false });
    return (data || []) as PagamentoRow[];
  }

  function filtra(filtro: FiltroFatture, search?: string): FatturaFin[] {
    let list = [...fatture];
    if (filtro === 'aperte')    list = list.filter(f => f.stato_calcolato === 'aperta' || f.stato_calcolato === 'parziale');
    if (filtro === 'scadute')   list = list.filter(f => f.stato_calcolato === 'scaduta');
    if (filtro === 'pagate')    list = list.filter(f => f.stato_calcolato === 'pagata');
    if (filtro === 'parziali')  list = list.filter(f => f.stato_calcolato === 'parziale');

    if (search && search.trim().length > 0) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        (f.cliente_display || '').toLowerCase().includes(q) ||
        (f.numero || '').toLowerCase().includes(q) ||
        (f.commessa_code || '').toLowerCase().includes(q)
      );
    }
    return list;
  }

  return {
    fatture,
    kpi,
    pagamenti,
    affidabilita,
    loading,
    reload: load,
    filtra,
    registraPagamento,
    eliminaPagamento,
    creaFattura,
    annullaFattura,
    getPagamentiPerFattura,
  };
}

export function statoLabel(s: FatturaFin['stato_calcolato']): string {
  switch (s) {
    case 'pagata':    return 'Pagata';
    case 'scaduta':   return 'Scaduta';
    case 'parziale':  return 'Acconto';
    case 'annullata': return 'Annullata';
    default:          return 'Da incassare';
  }
}