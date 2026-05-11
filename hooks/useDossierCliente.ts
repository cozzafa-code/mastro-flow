"use client";
// hooks/useDossierCliente.ts - Dossier vivo del cliente

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface ClienteDossier {
  id: string;
  azienda_id: string;
  nome: string;
  cognome: string;
  tipo: string;
  telefono: string | null;
  email: string | null;
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  codice_fiscale: string | null;
  foto_url: string | null;
  
  stato_cliente: 'attivo' | 'storico' | 'dormiente' | 'prospect' | 'perso';
  livello_priorita: 'premium' | 'alto' | 'medio' | 'basso';
  tipologia_relazione: string[];
  affidabilita_pct: number;
  
  tag_emozionali: string[];
  preferenze_contatto: any;
  
  ultimo_contatto_at: string | null;
  prossima_azione: string | null;
  prossima_azione_data: string | null;
  
  valore_storico_eur: number;
  
  created_at: string;
}

export interface ClienteEvento {
  id: string;
  cliente_id: string;
  commessa_id: string | null;
  commessa_code?: string | null;
  categoria: 'commerciale' | 'tecnico' | 'pagamento' | 'comunicazione' | 'problema' | 'nota' | 'sistema';
  tipo: string;
  titolo: string;
  descrizione: string | null;
  importo: number | null;
  icona: string | null;
  colore: string | null;
  severity: 'info' | 'success' | 'warning' | 'error' | 'critical';
  automatico: boolean;
  source: string | null;
  data_evento: string;
  autore: string | null;
  pinnato: boolean;
  foto_urls?: string[];
}

export interface CommessaCliente {
  id: string;
  code: string;
  fase: string;
  totale: number | null;
  importo_pagato: number | null;
  data_inizio: string | null;
  data_consegna_prevista: string | null;
  num_vani: number;
}

export interface DossierData {
  cliente: ClienteDossier | null;
  eventi: ClienteEvento[];
  commesse: CommessaCliente[];
  giorni_da_ultimo_contatto: number;
  totale_pagato: number;
  totale_saldo_aperto: number;
  num_commesse_attive: number;
  num_problemi_aperti: number;
}

export function useDossierCliente(clienteId: string | null) {
  const [data, setData] = useState<DossierData>({
    cliente: null, eventi: [], commesse: [],
    giorni_da_ultimo_contatto: 0,
    totale_pagato: 0, totale_saldo_aperto: 0,
    num_commesse_attive: 0, num_problemi_aperti: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Cliente
      const { data: cli } = await supabase.from('contatti').select('*').eq('id', clienteId).single();
      if (!cli) { setLoading(false); return; }

      // Eventi timeline
      const { data: ev } = await supabase.from('cliente_eventi')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('pinnato', { ascending: false })
        .order('data_evento', { ascending: false });

      // Arricchisci eventi con commessa code
      const cmIds = Array.from(new Set((ev || []).map((e: any) => e.commessa_id).filter(Boolean)));
      const { data: cmEv } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code').in('id', cmIds)
        : { data: [] };
      const cmEvMap: Record<string, string> = {};
      (cmEv || []).forEach((c: any) => { cmEvMap[c.id] = c.code; });
      
      const eventiEnriched: ClienteEvento[] = (ev || []).map((e: any) => ({
        ...e,
        commessa_code: e.commessa_id ? cmEvMap[e.commessa_id] || null : null,
      }));

      // Commesse cliente
      const { data: cm } = await supabase.from('commesse')
        .select('id, code, fase, totale, importo_pagato, data_inizio, data_consegna_prevista')
        .eq('cliente_contatto_id', clienteId)
        .order('created_at', { ascending: false });

      // Vani count per commessa
      const cmIdsAll = (cm || []).map((c: any) => c.id);
      const { data: vn } = cmIdsAll.length > 0
        ? await supabase.from('vani').select('commessa_id').in('commessa_id', cmIdsAll)
        : { data: [] };
      const vnCount: Record<string, number> = {};
      (vn || []).forEach((v: any) => { vnCount[v.commessa_id] = (vnCount[v.commessa_id] || 0) + 1; });
      
      const commesseEnriched: CommessaCliente[] = (cm || []).map((c: any) => ({
        ...c,
        num_vani: vnCount[c.id] || 0,
      }));

      // Calcola KPI
      const totPagato = commesseEnriched.reduce((s, c) => s + Number(c.importo_pagato || 0), 0);
      const totFatturato = commesseEnriched.reduce((s, c) => s + Number(c.totale || 0), 0);
      const saldo = Math.max(0, totFatturato - totPagato);
      const cmAttive = commesseEnriched.filter(c => !['completato','annullato','consegnato'].includes(c.fase)).length;
      const problemiAperti = eventiEnriched.filter(e => e.categoria === 'problema' && e.severity !== 'success').length;

      const ultContatto = cli.ultimo_contatto_at ? new Date(cli.ultimo_contatto_at) : null;
      const giorni = ultContatto ? Math.floor((Date.now() - ultContatto.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      setData({
        cliente: {
          ...cli,
          tipologia_relazione: Array.isArray(cli.tipologia_relazione) ? cli.tipologia_relazione : [],
          tag_emozionali: Array.isArray(cli.tag_emozionali) ? cli.tag_emozionali : [],
          preferenze_contatto: cli.preferenze_contatto || {},
          valore_storico_eur: Number(cli.valore_storico_eur || 0),
        },
        eventi: eventiEnriched,
        commesse: commesseEnriched,
        giorni_da_ultimo_contatto: giorni,
        totale_pagato: totPagato,
        totale_saldo_aperto: saldo,
        num_commesse_attive: cmAttive,
        num_problemi_aperti: problemiAperti,
      });
    } catch (e) {
      console.warn('[useDossierCliente]', e);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!clienteId) return;
    const ch = supabase.channel(`dossier-${clienteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cliente_eventi', filter: `cliente_id=eq.${clienteId}` }, load)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'contatti', filter: `id=eq.${clienteId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clienteId, load]);

  return { ...data, loading, reload: load };
}

// Lista clienti per Centro Clienti
export function useClienti(aziendaId: string | null) {
  const [clienti, setClienti] = useState<ClienteDossier[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('contatti')
      .select('*')
      .eq('azienda_id', aziendaId)
      .eq('tipo', 'cliente')
      .order('valore_storico_eur', { ascending: false });
    setClienti((data || []).map((c: any) => ({
      ...c,
      tipologia_relazione: Array.isArray(c.tipologia_relazione) ? c.tipologia_relazione : [],
      tag_emozionali: Array.isArray(c.tag_emozionali) ? c.tag_emozionali : [],
      preferenze_contatto: c.preferenze_contatto || {},
      valore_storico_eur: Number(c.valore_storico_eur || 0),
    })));
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);
  return { clienti, loading, reload: load };
}

export async function creaEvento(payload: Partial<ClienteEvento> & { azienda_id: string; cliente_id: string }) {
  return await supabase.from('cliente_eventi').insert(payload).select().single();
}

export async function togglePin(eventoId: string, pinnato: boolean) {
  return await supabase.from('cliente_eventi').update({ pinnato }).eq('id', eventoId);
}
