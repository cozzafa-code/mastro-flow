"use client";
// hooks/useSquadre.ts
// Legge squadre con membri/mezzo/saturazione/prossimi montaggi

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SquadraDetail {
  id: string;
  nome: string;
  colore: string;
  zona: string | null;
  specializzazione: string | null;
  attiva: boolean;
  membri: { id: string; nome: string; cognome: string; ruolo: string }[];
  mezzo: { id: string; nome: string; targa: string; tipo: string; stato: string } | null;
  // Calcolati
  capacita_settimana_h: number; // standard 40h per squadra completa
  ore_settimana_occupate: number;
  saturazione_pct: number;
  km_settimana: number; // stimati
  stato: 'libero' | 'carico' | 'pieno';
  prossimi_montaggi: { id: string; commessa_code: string; cliente: string; data: string; ore: number }[];
}

export function useSquadre(aziendaId: string | null) {
  const [squadre, setSquadre] = useState<SquadraDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Squadre
      const { data: sqData } = await supabase
        .from('squadre')
        .select('*')
        .eq('azienda_id', aziendaId)
        .eq('attiva', true)
        .order('nome');

      if (!sqData || sqData.length === 0) {
        setSquadre([]);
        setLoading(false);
        return;
      }

      const sqIds = sqData.map((s: any) => s.id);

      // Membri di tutte le squadre
      const { data: membriData } = await supabase
        .from('squadre_membri')
        .select('squadra_id, team_id, ruolo_in_squadra')
        .in('squadra_id', sqIds)
        .is('data_uscita', null);

      const teamIds = Array.from(new Set((membriData || []).map((m: any) => m.team_id))).filter(Boolean);
      const { data: opData } = teamIds.length > 0
        ? await supabase.from('operatori').select('id, nome, cognome').in('id', teamIds)
        : { data: [] };
      const opMap: Record<string, any> = {};
      (opData || []).forEach((o: any) => { opMap[o.id] = o; });

      // Mezzi
      const { data: mezziData } = await supabase
        .from('prod_mezzi')
        .select('*')
        .eq('azienda_id', aziendaId)
        .eq('attivo', true);

      // Montaggi prossimi 7 gg
      const today = new Date();
      const week = new Date(today);
      week.setDate(week.getDate() + 7);
      const todayStr = today.toISOString().slice(0, 10);
      const weekStr = week.toISOString().slice(0, 10);

      const { data: montData } = await supabase
        .from('montaggi')
        .select('id, commessa_id, data_montaggio, ora_inizio, ore_preventivate, squadra')
        .eq('azienda_id', aziendaId)
        .gte('data_montaggio', todayStr)
        .lte('data_montaggio', weekStr);

      // Commesse dei montaggi (per code/cliente)
      const cmIds = Array.from(new Set((montData || []).map((m: any) => m.commessa_id))).filter(Boolean);
      const { data: cmData } = cmIds.length > 0
        ? await supabase.from('commesse').select('id, code, cliente, cognome').in('id', cmIds)
        : { data: [] };
      const cmMap: Record<string, any> = {};
      (cmData || []).forEach((c: any) => { cmMap[c.id] = c; });

      // Costruisco SquadraDetail
      const result: SquadraDetail[] = sqData.map((s: any) => {
        // Membri
        const myMembri = (membriData || []).filter((m: any) => m.squadra_id === s.id)
          .map((m: any) => {
            const op = opMap[m.team_id] || {};
            return { id: m.team_id, nome: op.nome || '?', cognome: op.cognome || '', ruolo: m.ruolo_in_squadra };
          });

        // Mezzo (match per nome squadra)
        const mezzoMatch = (mezziData || []).find((mz: any) => 
          (mz.nome || '').toUpperCase().includes(s.nome.toUpperCase())
        );
        const mezzo = mezzoMatch ? {
          id: mezzoMatch.id, nome: mezzoMatch.nome, targa: mezzoMatch.targa || '',
          tipo: mezzoMatch.tipo || '', stato: mezzoMatch.stato || 'libero'
        } : null;

        // Montaggi che hanno questa squadra nel json `squadra`
        const sqMontaggi = (montData || []).filter((m: any) => {
          if (!Array.isArray(m.squadra)) return false;
          return m.squadra.some((mb: any) => 
            mb.nome && myMembri.some(om => `${om.nome} ${om.cognome}`.includes(mb.nome) || mb.nome.includes(om.nome))
          );
        });

        const ore_occupate = sqMontaggi.reduce((sum: number, m: any) => sum + (Number(m.ore_preventivate) || 4), 0);
        const capacita = myMembri.length * 8 * 5; // membri × 8h × 5gg
        const saturazione = capacita > 0 ? Math.round((ore_occupate / capacita) * 100) : 0;
        const stato: 'libero' | 'carico' | 'pieno' = saturazione >= 90 ? 'pieno' : saturazione >= 50 ? 'carico' : 'libero';

        const prossimi_montaggi = sqMontaggi.map((m: any) => {
          const cm = cmMap[m.commessa_id] || {};
          return {
            id: m.id,
            commessa_code: cm.code || '?',
            cliente: `${cm.cliente || ''} ${cm.cognome || ''}`.trim(),
            data: m.data_montaggio || '',
            ore: Number(m.ore_preventivate) || 4,
          };
        }).sort((a, b) => a.data.localeCompare(b.data));

        // Km stimati: 25km per montaggio (placeholder, sarà calcolato da indirizzi)
        const km_settimana = sqMontaggi.length * 25;

        return {
          id: s.id,
          nome: s.nome,
          colore: s.colore || '#1E3A5F',
          zona: s.zona,
          specializzazione: s.specializzazione,
          attiva: s.attiva,
          membri: myMembri,
          mezzo,
          capacita_settimana_h: capacita,
          ore_settimana_occupate: ore_occupate,
          saturazione_pct: saturazione,
          km_settimana,
          stato,
          prossimi_montaggi,
        };
      });

      setSquadre(result);
    } catch (e) {
      console.warn('[useSquadre]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`squadre-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squadre' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'squadre_membri' }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'montaggi' }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, reload]);

  return { squadre, loading, reload };
}
