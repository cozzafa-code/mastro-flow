"use client";
// hooks/useFurgoni.ts - Furgoni + carichi giornalieri

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Furgone {
  id: string;
  nome: string;
  targa: string;
  modello: string;
  capacita_kg: number;
  capacita_m3: number;
  autista_predefinito: string;
  squadra_predefinita_id: string | null;
  squadra_nome?: string;
  squadra_colore?: string;
  stato: string;
  attivo: boolean;
}

export interface Carico {
  id: string;
  furgone_id: string;
  furgone_nome?: string;
  furgone_targa?: string;
  furgone_capacita_kg?: number;
  data_carico: string;
  data_partenza_prevista: string | null;
  squadra_id: string | null;
  squadra_nome?: string;
  squadra_colore?: string;
  autista: string | null;
  stato: string;
  peso_totale_kg: number;
  volume_totale_m3: number;
  saturazione_peso_pct: number;
  saturazione_volume_pct: number;
  commesse_ids: string[];
  percorso_montaggi: any[];
  warnings: any[];
  partito_at: string | null;
  arrivato_at: string | null;
  note: string | null;
  // Stats articoli
  articoli_count?: number;
  articoli_verificati?: number;
  articoli_caricati?: number;
}

export interface CaricoArticolo {
  id: string;
  carico_id: string;
  commessa_id: string | null;
  commessa_code?: string | null;
  commessa_cliente?: string | null;
  articolo_descrizione: string;
  categoria: string;
  quantita: number;
  peso_kg: number | null;
  volume_m3: number | null;
  scaffale_origine: string | null;
  qr_code: string | null;
  verificato: boolean;
  verificato_at: string | null;
  verificato_da_nome: string | null;
  caricato: boolean;
  caricato_at: string | null;
  caricato_da_nome: string | null;
  foto_url: string | null;
  note: string | null;
}

export function useFurgoni(aziendaId: string | null) {
  const [furgoni, setFurgoni] = useState<Furgone[]>([]);
  const [carichi, setCarichi] = useState<Carico[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [f, c, s] = await Promise.all([
        supabase.from('furgoni').select('*').eq('azienda_id', aziendaId).eq('attivo', true).order('nome'),
        supabase.from('carichi_furgone').select('*').eq('azienda_id', aziendaId).order('data_carico', { ascending: true }),
        supabase.from('squadre').select('id, nome, colore').eq('azienda_id', aziendaId),
      ]);

      const sqMap: Record<string, any> = {};
      (s.data || []).forEach((x: any) => { sqMap[x.id] = x; });

      const furgEnriched: Furgone[] = (f.data || []).map((fu: any) => ({
        ...fu,
        squadra_nome: fu.squadra_predefinita_id ? sqMap[fu.squadra_predefinita_id]?.nome : undefined,
        squadra_colore: fu.squadra_predefinita_id ? sqMap[fu.squadra_predefinita_id]?.colore : undefined,
      }));

      // Carichi enriched: aggiungo conteggi articoli
      const carIds = (c.data || []).map((cc: any) => cc.id);
      const { data: artCount } = carIds.length > 0
        ? await supabase.from('carico_articoli').select('carico_id, verificato, caricato').in('carico_id', carIds)
        : { data: [] };
      const countMap: Record<string, { tot: number; ver: number; car: number }> = {};
      (artCount || []).forEach((a: any) => {
        if (!countMap[a.carico_id]) countMap[a.carico_id] = { tot: 0, ver: 0, car: 0 };
        countMap[a.carico_id].tot++;
        if (a.verificato) countMap[a.carico_id].ver++;
        if (a.caricato) countMap[a.carico_id].car++;
      });

      const furgMapById: Record<string, Furgone> = {};
      furgEnriched.forEach(fu => { furgMapById[fu.id] = fu; });

      const carEnriched: Carico[] = (c.data || []).map((cc: any) => ({
        ...cc,
        furgone_nome: furgMapById[cc.furgone_id]?.nome,
        furgone_targa: furgMapById[cc.furgone_id]?.targa,
        furgone_capacita_kg: furgMapById[cc.furgone_id]?.capacita_kg,
        squadra_nome: cc.squadra_id ? sqMap[cc.squadra_id]?.nome : undefined,
        squadra_colore: cc.squadra_id ? sqMap[cc.squadra_id]?.colore : undefined,
        articoli_count: countMap[cc.id]?.tot || 0,
        articoli_verificati: countMap[cc.id]?.ver || 0,
        articoli_caricati: countMap[cc.id]?.car || 0,
      }));

      setFurgoni(furgEnriched);
      setCarichi(carEnriched);
    } catch (e) {
      console.warn('[useFurgoni]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`furgoni-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carichi_furgone' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carico_articoli' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  return { furgoni, carichi, loading, reload: load };
}

// Hook singolo carico dettaglio
export function useCarico(caricoId: string | null) {
  const [carico, setCarico] = useState<Carico | null>(null);
  const [articoli, setArticoli] = useState<CaricoArticolo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!caricoId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        supabase.from('carichi_furgone').select('*').eq('id', caricoId).single(),
        supabase.from('carico_articoli').select('*').eq('carico_id', caricoId).order('categoria').order('articolo_descrizione'),
      ]);

      // Enrich articoli con dati commessa
      const cmIds = Array.from(new Set((aRes.data || []).map((a: any) => a.commessa_id).filter(Boolean)));
      const { data: cm } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code, cliente, cognome, indirizzo').in('id', cmIds)
        : { data: [] };
      const cmMap: Record<string, any> = {};
      (cm || []).forEach((x: any) => { cmMap[x.id] = x; });

      const artEnriched: CaricoArticolo[] = (aRes.data || []).map((a: any) => ({
        ...a,
        commessa_code: a.commessa_id ? cmMap[a.commessa_id]?.code : null,
        commessa_cliente: a.commessa_id ? `${cmMap[a.commessa_id]?.cliente || ''} ${cmMap[a.commessa_id]?.cognome || ''}`.trim() : null,
      }));

      setCarico(cRes.data as Carico);
      setArticoli(artEnriched);
    } catch (e) {
      console.warn('[useCarico]', e);
    } finally {
      setLoading(false);
    }
  }, [caricoId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!caricoId) return;
    const ch = supabase.channel(`carico-${caricoId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carico_articoli', filter: `carico_id=eq.${caricoId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carichi_furgone', filter: `id=eq.${caricoId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [caricoId, load]);

  return { carico, articoli, loading, reload: load };
}

function getNomeOperatore(): string {
  if (typeof window === 'undefined') return 'Sistema';
  return localStorage.getItem('mastro:nome_operatore') 
    || sessionStorage.getItem('mastro:user_name')
    || 'Operatore';
}

export async function toggleVerificato(articoloId: string, verificato: boolean) {
  const nome = getNomeOperatore();
  const updates: any = { 
    verificato, 
    verificato_at: verificato ? new Date().toISOString() : null,
    verificato_da_nome: verificato ? nome : null,
  };
  await supabase.from('carico_articoli').update(updates).eq('id', articoloId);
}

export async function toggleCaricato(articoloId: string, caricato: boolean) {
  const nome = getNomeOperatore();
  const updates: any = { 
    caricato, 
    caricato_at: caricato ? new Date().toISOString() : null,
    caricato_da_nome: caricato ? nome : null,
  };
  await supabase.from('carico_articoli').update(updates).eq('id', articoloId);
}

export async function verificaPartenza(caricoId: string) {
  const updates: any = {
    verificato_partenza: true,
    verificato_partenza_at: new Date().toISOString(),
    stato: 'caricato',
  };
  return await supabase.from('carichi_furgone').update(updates).eq('id', caricoId);
}
