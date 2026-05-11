"use client";
// hooks/useMagazzino.ts - Legge scaffali + articoli + stats

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Scaffale {
  id: string;
  codice: string;
  nome: string;
  zona: string;
  posizione_x: number;
  posizione_y: number;
  capacita: number;
  attivo: boolean;
  articoli_count?: number;
  articoli_sotto_scorta?: number;
  saturazione_pct?: number;
}

export interface ArticoloMag {
  id: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  categoria_operativa: string | null;
  scaffale_id: string | null;
  stato_operativo: string;
  scorta_attuale: number;
  scorta_minima: number;
  unita_misura: string;
  prezzo_acquisto: number;
  foto_url: string | null;
  qr_code: string | null;
  fornitore_id: string | null;
}

export interface MagazzinoStats {
  commesse_pronte: number;
  commesse_parziali: number;
  commesse_bloccate: number;
  perc_organizzato: number;
  articoli_non_verificati: number;
  totale_articoli: number;
  totale_scaffali: number;
}

export function useMagazzino(aziendaId: string | null) {
  const [scaffali, setScaffali] = useState<Scaffale[]>([]);
  const [articoli, setArticoli] = useState<ArticoloMag[]>([]);
  const [stats, setStats] = useState<MagazzinoStats>({
    commesse_pronte: 0, commesse_parziali: 0, commesse_bloccate: 0,
    perc_organizzato: 0, articoli_non_verificati: 0,
    totale_articoli: 0, totale_scaffali: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Scaffali
      const { data: sc } = await supabase
        .from('scaffali')
        .select('*')
        .eq('azienda_id', aziendaId)
        .eq('attivo', true)
        .order('zona', { ascending: true });

      // Articoli
      const { data: art } = await supabase
        .from('articoli_magazzino')
        .select('*')
        .eq('azienda_id', aziendaId)
        .eq('attivo', true);

      // Commesse attive per stats
      const { data: cm } = await supabase
        .from('commesse')
        .select('materiali_status')
        .eq('azienda_id', aziendaId)
        .in('fase', ['ordine','acconto_pagato','produzione','montaggio']);

      // Conta articoli per scaffale + sotto scorta
      const articoliByScaff: Record<string, ArticoloMag[]> = {};
      (art || []).forEach((a: any) => {
        if (a.scaffale_id) {
          if (!articoliByScaff[a.scaffale_id]) articoliByScaff[a.scaffale_id] = [];
          articoliByScaff[a.scaffale_id].push(a);
        }
      });

      const scaffaliEnriched: Scaffale[] = (sc || []).map((s: any) => {
        const arts = articoliByScaff[s.id] || [];
        const sottoScorta = arts.filter(a => Number(a.scorta_attuale) < Number(a.scorta_minima)).length;
        const capacita = s.capacita || 50;
        const occupati = arts.length;
        const satPct = capacita > 0 ? Math.min(100, Math.round((occupati / capacita) * 100)) : 0;
        return {
          ...s,
          articoli_count: arts.length,
          articoli_sotto_scorta: sottoScorta,
          saturazione_pct: satPct,
        };
      });

      setScaffali(scaffaliEnriched);
      setArticoli((art || []) as ArticoloMag[]);

      // Stats
      const cmPronte = (cm || []).filter((c: any) => c.materiali_status === 'completo').length;
      const cmParziali = (cm || []).filter((c: any) => c.materiali_status === 'parziale').length;
      const cmBloccate = (cm || []).filter((c: any) => c.materiali_status === 'in_attesa').length;
      const articoliConPos = (art || []).filter((a: any) => a.scaffale_id || a.posizione_magazzino).length;
      const percOrg = (art || []).length > 0 ? Math.round((articoliConPos / (art || []).length) * 100) : 0;
      const nonVerif = (art || []).filter((a: any) => 
        a.stato_operativo === 'ordinato' || a.stato_operativo === 'in_viaggio' || a.stato_operativo === 'arrivato'
      ).length;

      setStats({
        commesse_pronte: cmPronte,
        commesse_parziali: cmParziali,
        commesse_bloccate: cmBloccate,
        perc_organizzato: percOrg,
        articoli_non_verificati: nonVerif,
        totale_articoli: (art || []).length,
        totale_scaffali: scaffaliEnriched.length,
      });
    } catch (e) {
      console.warn('[useMagazzino]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`magazzino-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'articoli_magazzino' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scaffali' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, load]);

  return { scaffali, articoli, stats, loading, reload: load };
}
