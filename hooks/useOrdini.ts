"use client";
// hooks/useOrdini.ts - Legge ordini fornitore con fornitore + commessa + stats

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface OrdineRow {
  id: string;
  numero: string;
  fornitore: string;
  fornitore_id: string | null;
  fornitore_rating?: number;
  fornitore_affidabilita?: number;
  categoria_materiale: string | null;
  stato: string;
  urgente: boolean;
  bloccante: boolean;
  totale_euro: number;
  totale_stimato: number;
  consegna_prevista: string | null;
  commessa_id: string | null;
  commessa_code?: string | null;
  commessa_cliente?: string | null;
  errore_descrizione: string | null;
  arrivato_at: string | null;
  verificato_at: string | null;
  inviato_at: string | null;
  data_invio: string | null;
  data_ricezione: string | null;
  risk_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrdiniStats {
  bloccanti: number;
  in_ritardo: number;
  arrivi_oggi: number;
  commesse_ferme: number;
  totale_attivi: number;
  totale_euro_attivi: number;
}

export function useOrdini(aziendaId: string | null) {
  const [ordini, setOrdini] = useState<OrdineRow[]>([]);
  const [stats, setStats] = useState<OrdiniStats>({
    bloccanti: 0, in_ritardo: 0, arrivi_oggi: 0,
    commesse_ferme: 0, totale_attivi: 0, totale_euro_attivi: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Carica ordini
      const { data: ord } = await supabase
        .from('ordini_fornitore')
        .select('id, numero, fornitore, fornitore_id, categoria_materiale, stato, urgente, bloccante, totale_euro, totale_stimato, consegna_prevista, commessa_id, errore_descrizione, arrivato_at, verificato_at, inviato_at, data_invio, data_ricezione, risk_score, created_at, updated_at')
        .eq('azienda_id', aziendaId)
        .order('created_at', { ascending: false });

      if (!ord || ord.length === 0) {
        setOrdini([]);
        setLoading(false);
        return;
      }

      // Arricchisci con fornitori
      const fornIds = Array.from(new Set(ord.map((o: any) => o.fornitore_id).filter(Boolean)));
      const { data: forn } = fornIds.length > 0
        ? await supabase.from('fornitori').select('id, rating, affidabilita_pct').in('id', fornIds)
        : { data: [] };
      const fornMap: Record<string, any> = {};
      (forn || []).forEach((f: any) => { fornMap[f.id] = f; });

      // Arricchisci con commesse
      const cmIds = Array.from(new Set(ord.map((o: any) => o.commessa_id).filter(Boolean)));
      const { data: cm } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code, cliente, cognome').in('id', cmIds)
        : { data: [] };
      const cmMap: Record<string, any> = {};
      (cm || []).forEach((c: any) => { cmMap[c.id] = c; });

      const enriched: OrdineRow[] = ord.map((o: any) => ({
        ...o,
        fornitore_rating: o.fornitore_id ? fornMap[o.fornitore_id]?.rating : undefined,
        fornitore_affidabilita: o.fornitore_id ? fornMap[o.fornitore_id]?.affidabilita_pct : undefined,
        commessa_code: o.commessa_id ? cmMap[o.commessa_id]?.code : null,
        commessa_cliente: o.commessa_id ? `${cmMap[o.commessa_id]?.cliente || ''} ${cmMap[o.commessa_id]?.cognome || ''}`.trim() : null,
      }));

      setOrdini(enriched);

      // Stats
      const today = new Date().toISOString().slice(0, 10);
      const attivi = enriched.filter(o => !['completato', 'annullato', 'verificato'].includes(o.stato));
      const inRitardo = enriched.filter(o => 
        o.consegna_prevista && o.consegna_prevista < today && 
        !['arrivato', 'verificato', 'completato'].includes(o.stato)
      );
      const arriviOggi = enriched.filter(o => o.consegna_prevista === today);
      const bloccanti = enriched.filter(o => o.bloccante && !['arrivato', 'verificato', 'completato'].includes(o.stato));
      const commesseFerme = new Set(bloccanti.map(o => o.commessa_id).filter(Boolean)).size;
      const totEuro = attivi.reduce((s, o) => s + (Number(o.totale_euro) || Number(o.totale_stimato) || 0), 0);

      setStats({
        bloccanti: bloccanti.length,
        in_ritardo: inRitardo.length,
        arrivi_oggi: arriviOggi.length,
        commesse_ferme: commesseFerme,
        totale_attivi: attivi.length,
        totale_euro_attivi: totEuro,
      });
    } catch (e) {
      console.warn('[useOrdini]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`ordini-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordini_fornitore' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  return { ordini, stats, loading, reload: load };
}
