"use client";
// hooks/useImmobili.ts - Immobili cliente + storico tecnico infissi

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Immobile {
  id: string;
  cliente_id: string;
  nome: string;
  tipo: 'casa' | 'villa' | 'appartamento' | 'ufficio' | 'negozio' | 'capannone' | 'altro';
  indirizzo: string | null;
  citta: string | null;
  cap: string | null;
  provincia: string | null;
  lat: number | null;
  lng: number | null;
  foto_url: string | null;
  planimetria_url: string | null;
  galleria: any[];
  mq_totali: number | null;
  num_piani: number;
  num_vani_totali: number;
  anno_costruzione: number | null;
  note: string | null;
  primario: boolean;
  num_infissi?: number;
  valore_infissi?: number;
}

export interface InfissoInstallato {
  id: string;
  immobile_id: string | null;
  cliente_id: string;
  commessa_id: string | null;
  commessa_code?: string | null;
  nome_vano: string | null;
  stanza: string | null;
  piano: string | null;
  tipo: string | null;
  sistema: string | null;
  sottosistema: string | null;
  pezzi: number;
  larghezza_mm: number | null;
  altezza_mm: number | null;
  marca_profilo: string | null;
  serie_profilo: string | null;
  colore_int: string | null;
  colore_est: string | null;
  ral_int: string | null;
  ral_est: string | null;
  vetro_tipo: string | null;
  vetro_uw: number | null;
  vetro_ug: number | null;
  ferramenta_marca: string | null;
  ferramenta_modello: string | null;
  motore_marca: string | null;
  motore_modello: string | null;
  cassonetto: boolean;
  persiana: boolean;
  zanzariera: boolean;
  data_installazione: string;
  garanzia_fino: string | null;
  modificato: boolean;
  ultima_modifica_descr: string | null;
  foto_urls: string[];
  note: string | null;
}

export interface InfissoModifica {
  id: string;
  infisso_id: string;
  tipo_modifica: string;
  descrizione: string;
  costo: number | null;
  data_modifica: string;
  autore: string | null;
}

export function useImmobiliCliente(clienteId: string | null) {
  const [immobili, setImmobili] = useState<Immobile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase.from('clienti_immobili')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('primario', { ascending: false })
        .order('created_at', { ascending: false });

      const ids = (data || []).map((i: any) => i.id);
      const { data: inf } = ids.length > 0
        ? await supabase.from('infissi_installati').select('immobile_id, pezzi').in('immobile_id', ids)
        : { data: [] };
      const count: Record<string, number> = {};
      (inf || []).forEach((x: any) => { count[x.immobile_id] = (count[x.immobile_id] || 0) + Number(x.pezzi || 1); });

      setImmobili((data || []).map((i: any) => ({
        ...i,
        galleria: Array.isArray(i.galleria) ? i.galleria : [],
        num_infissi: count[i.id] || 0,
      })));
    } catch (e) {
      console.warn('[useImmobili]', e);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!clienteId) return;
    const ch = supabase.channel(`imm-${clienteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clienti_immobili', filter: `cliente_id=eq.${clienteId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'infissi_installati', filter: `cliente_id=eq.${clienteId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clienteId, load]);

  return { immobili, loading, reload: load };
}

export function useInfissiImmobile(immobileId: string | null) {
  const [infissi, setInfissi] = useState<InfissoInstallato[]>([]);
  const [modifiche, setModifiche] = useState<InfissoModifica[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!immobileId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: inf } = await supabase.from('infissi_installati')
        .select('*')
        .eq('immobile_id', immobileId)
        .order('piano')
        .order('stanza');

      const cmIds = Array.from(new Set((inf || []).map((i: any) => i.commessa_id).filter(Boolean)));
      const { data: cm } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code').in('id', cmIds)
        : { data: [] };
      const cmMap: Record<string, string> = {};
      (cm || []).forEach((c: any) => { cmMap[c.id] = c.code; });

      const infIds = (inf || []).map((i: any) => i.id);
      const { data: mods } = infIds.length > 0
        ? await supabase.from('infissi_modifiche').select('*').in('infisso_id', infIds).order('data_modifica', { ascending: false })
        : { data: [] };

      setInfissi((inf || []).map((i: any) => ({
        ...i,
        commessa_code: i.commessa_id ? cmMap[i.commessa_id] || null : null,
        foto_urls: Array.isArray(i.foto_urls) ? i.foto_urls : [],
      })));
      setModifiche(mods || []);
    } catch (e) {
      console.warn('[useInfissi]', e);
    } finally {
      setLoading(false);
    }
  }, [immobileId]);

  useEffect(() => { load(); }, [load]);
  return { infissi, modifiche, loading, reload: load };
}

export async function creaImmobile(payload: Partial<Immobile> & { azienda_id: string; cliente_id: string; nome: string }) {
  return await supabase.from('clienti_immobili').insert(payload).select().single();
}

export async function aggiungiModificaInfisso(payload: { azienda_id: string; infisso_id: string; tipo_modifica: string; descrizione: string; costo?: number; autore?: string }) {
  return await supabase.from('infissi_modifiche').insert(payload).select().single();
}
