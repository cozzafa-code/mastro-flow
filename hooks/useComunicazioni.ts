"use client";
// hooks/useComunicazioni.ts - Comunicazioni unificate cliente

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Comunicazione {
  id: string;
  cliente_id: string;
  commessa_id: string | null;
  commessa_code?: string | null;
  canale: 'whatsapp' | 'email' | 'chiamata' | 'vocale' | 'sms' | 'manuale';
  direzione: 'in' | 'out' | 'interno';
  oggetto: string | null;
  contenuto: string;
  trascrizione: string | null;
  durata_secondi: number | null;
  allegati: any[];
  foto_url: string | null;
  audio_url: string | null;
  letto: boolean;
  rispondere: boolean;
  data_comunicazione: string;
  autore: string | null;
}

export function useComunicazioni(clienteId: string | null) {
  const [com, setCom] = useState<Comunicazione[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clienteId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase.from('cliente_comunicazioni')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('data_comunicazione', { ascending: false });

      const cmIds = Array.from(new Set((data || []).map((c: any) => c.commessa_id).filter(Boolean)));
      const { data: cm } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code').in('id', cmIds)
        : { data: [] };
      const cmMap: Record<string, string> = {};
      (cm || []).forEach((c: any) => { cmMap[c.id] = c.code; });

      setCom((data || []).map((c: any) => ({
        ...c,
        commessa_code: c.commessa_id ? cmMap[c.commessa_id] || null : null,
        allegati: Array.isArray(c.allegati) ? c.allegati : [],
      })));
    } catch (e) {
      console.warn('[useComunicazioni]', e);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!clienteId) return;
    const ch = supabase.channel(`com-${clienteId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cliente_comunicazioni', filter: `cliente_id=eq.${clienteId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clienteId, load]);

  return { com, loading, reload: load };
}

export async function creaComunicazione(payload: Partial<Comunicazione> & { azienda_id: string; cliente_id: string; canale: any; direzione: any; contenuto: string }) {
  return await supabase.from('cliente_comunicazioni').insert(payload).select().single();
}

export async function marcaLetto(id: string, letto: boolean = true) {
  return await supabase.from('cliente_comunicazioni').update({ letto, letto_at: letto ? new Date().toISOString() : null }).eq('id', id);
}

export async function toggleRispondere(id: string, rispondere: boolean) {
  return await supabase.from('cliente_comunicazioni').update({ rispondere }).eq('id', id);
}
