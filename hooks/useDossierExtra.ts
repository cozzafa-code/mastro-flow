"use client";
// hooks/useDossierExtra.ts - Commesse, Pagamenti, Relazione (BLOCCO 4)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface CommessaCliente {
  id: string;
  code: string;
  fase: string;
  totale: number;
  importo_pagato: number;
  data_inizio: string | null;
  data_consegna_prevista: string | null;
  num_vani: number;
  num_problemi: number;
  perc_avanzamento: number;
  materiale: string | null;
  indirizzo: string | null;
}

export interface FatturaCliente {
  id: string;
  numero: string;
  commessa_code: string | null;
  data_emissione: string;
  data_scadenza: string | null;
  totale: number;
  stato: string;
  pagata: boolean;
  pagata_at: string | null;
  giorni_ritardo: number;
}

export interface Decisore {
  nome: string;
  ruolo: string;
  peso_decisionale: 'alto' | 'medio' | 'basso';
  note?: string;
}

export interface PagamentiStats {
  totale_fatturato: number;
  totale_pagato: number;
  saldo_aperto: number;
  num_fatture: number;
  num_pagate: number;
  giorni_ritardo_medio: number;
  affidabilita_calcolata: number;
}

export function useCommesseCliente(clienteId: string | null) {
  const [commesse, setCommesse] = useState<CommessaCliente[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: cm } = await supabase.from('commesse')
        .select('id, code, fase, totale, importo_pagato, data_inizio, data_consegna_prevista, materiale, indirizzo')
        .eq('cliente_contatto_id', clienteId)
        .order('created_at', { ascending: false });

      const ids = (cm || []).map((c: any) => c.id);
      const { data: vn } = ids.length > 0
        ? await supabase.from('vani').select('commessa_id').in('commessa_id', ids)
        : { data: [] };
      const { data: ev } = ids.length > 0
        ? await supabase.from('cliente_eventi').select('commessa_id, categoria, severity').in('commessa_id', ids).eq('categoria', 'problema')
        : { data: [] };
      
      const vnMap: Record<string, number> = {};
      const probMap: Record<string, number> = {};
      (vn || []).forEach((v: any) => { vnMap[v.commessa_id] = (vnMap[v.commessa_id] || 0) + 1; });
      (ev || []).forEach((e: any) => {
        if (e.severity !== 'success') probMap[e.commessa_id] = (probMap[e.commessa_id] || 0) + 1;
      });

      // Calcola avanzamento da fase
      const faseToPerc: Record<string, number> = {
        rilievo: 10, preventivo: 20, ordine: 35, acconto_pagato: 50, 
        produzione: 70, montaggio: 85, consegnato: 95, completato: 100, annullato: 0,
      };

      setCommesse((cm || []).map((c: any) => ({
        ...c,
        totale: Number(c.totale || 0),
        importo_pagato: Number(c.importo_pagato || 0),
        num_vani: vnMap[c.id] || 0,
        num_problemi: probMap[c.id] || 0,
        perc_avanzamento: faseToPerc[c.fase] || 0,
      })));
    } catch (e) {
      console.warn('[useCommesseCliente]', e);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);
  return { commesse, loading, reload: load };
}

export function usePagamentiCliente(clienteId: string | null) {
  const [fatture, setFatture] = useState<FatturaCliente[]>([]);
  const [stats, setStats] = useState<PagamentiStats>({
    totale_fatturato: 0, totale_pagato: 0, saldo_aperto: 0,
    num_fatture: 0, num_pagate: 0, giorni_ritardo_medio: 0,
    affidabilita_calcolata: 100,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: cm } = await supabase.from('commesse').select('id, code').eq('cliente_contatto_id', clienteId);
      const cmIds = (cm || []).map((c: any) => c.id);
      const cmMap: Record<string, string> = {};
      (cm || []).forEach((c: any) => { cmMap[c.id] = c.code; });
      
      if (cmIds.length === 0) {
        setFatture([]);
        setStats({ totale_fatturato: 0, totale_pagato: 0, saldo_aperto: 0, num_fatture: 0, num_pagate: 0, giorni_ritardo_medio: 0, affidabilita_calcolata: 100 });
        setLoading(false);
        return;
      }

      const { data: ft } = await supabase.from('fatture')
        .select('*')
        .in('commessa_id', cmIds)
        .in('stato', ['consegnata','accettata','inviata'])
        .order('data_emissione', { ascending: false });

      const today = new Date();
      const fattureEnriched: FatturaCliente[] = (ft || []).map((f: any) => {
        let giorniRitardo = 0;
        if (f.data_scadenza) {
          const scadenza = new Date(f.data_scadenza);
          if (f.pagata && f.pagata_at) {
            const pagatoAt = new Date(f.pagata_at);
            giorniRitardo = Math.floor((pagatoAt.getTime() - scadenza.getTime()) / 86400000);
          } else if (!f.pagata && scadenza < today) {
            giorniRitardo = Math.floor((today.getTime() - scadenza.getTime()) / 86400000);
          }
        }
        return {
          ...f,
          commessa_code: cmMap[f.commessa_id] || null,
          totale: Number(f.totale || 0),
          giorni_ritardo: giorniRitardo,
        };
      });

      // Stats
      const totFatt = fattureEnriched.reduce((s, f) => s + f.totale, 0);
      const pagate = fattureEnriched.filter(f => f.pagata);
      const totPagato = pagate.reduce((s, f) => s + f.totale, 0);
      const ritardi = pagate.filter(f => f.giorni_ritardo > 0).map(f => f.giorni_ritardo);
      const ritMedio = ritardi.length > 0 ? Math.round(ritardi.reduce((a, b) => a + b, 0) / ritardi.length) : 0;
      
      // Affidabilità calcolata
      let aff = 100;
      const nonPagate = fattureEnriched.filter(f => !f.pagata).length;
      aff -= nonPagate * 15;
      if (ritMedio > 0) aff -= Math.min(30, ritMedio);
      aff = Math.max(0, Math.min(100, aff));

      setFatture(fattureEnriched);
      setStats({
        totale_fatturato: totFatt,
        totale_pagato: totPagato,
        saldo_aperto: Math.max(0, totFatt - totPagato),
        num_fatture: fattureEnriched.length,
        num_pagate: pagate.length,
        giorni_ritardo_medio: ritMedio,
        affidabilita_calcolata: aff,
      });
    } catch (e) {
      console.warn('[usePagamentiCliente]', e);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!clienteId) return;
    const ch = supabase.channel(`pag-${clienteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fatture' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clienteId, load]);

  return { fatture, stats, loading, reload: load };
}

export interface ReteData {
  decisori: Decisore[];
  settore_lavorativo: string | null;
  professione: string | null;
  circolo_sociale: string | null;
  portato_da: { id: string; nome: string; cognome: string } | null;
  referenziati: { id: string; nome: string; cognome: string; stato_cliente: string; valore_storico_eur: number }[];
}

export function useReteCliente(clienteId: string | null) {
  const [data, setData] = useState<ReteData>({
    decisori: [], settore_lavorativo: null, professione: null, circolo_sociale: null,
    portato_da: null, referenziati: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: cli } = await supabase.from('contatti')
        .select('decisori, settore_lavorativo, professione, circolo_sociale, referral_from_id')
        .eq('id', clienteId).single();

      let portatoDa = null;
      if (cli?.referral_from_id) {
        const { data: rf } = await supabase.from('contatti').select('id, nome, cognome').eq('id', cli.referral_from_id).single();
        if (rf) portatoDa = rf;
      }

      const { data: ref } = await supabase.from('contatti')
        .select('id, nome, cognome, stato_cliente, valore_storico_eur')
        .eq('referral_from_id', clienteId);

      setData({
        decisori: Array.isArray(cli?.decisori) ? cli.decisori : [],
        settore_lavorativo: cli?.settore_lavorativo || null,
        professione: cli?.professione || null,
        circolo_sociale: cli?.circolo_sociale || null,
        portato_da: portatoDa,
        referenziati: (ref || []).map((r: any) => ({
          ...r, valore_storico_eur: Number(r.valore_storico_eur || 0),
        })),
      });
    } catch (e) {
      console.warn('[useReteCliente]', e);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);
  return { ...data, loading, reload: load };
}
