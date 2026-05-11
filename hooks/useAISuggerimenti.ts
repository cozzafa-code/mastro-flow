"use client";
// hooks/useAISuggerimenti.ts
// AI Assistant L1: genera suggerimenti operativi da regole deterministiche

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type SuggerimentoTipo = 
  | 'solleciter_fornitore'
  | 'avvia_produzione'
  | 'sollecita_acconto'
  | 'sposta_montaggio'
  | 'capacita_libera'
  | 'conflitto_operatore'
  | 'rischio_collasso'
  | 'commessa_ferma';

export interface AISuggerimento {
  id: string;
  tipo: SuggerimentoTipo;
  priorita: 'alta' | 'media' | 'bassa';
  titolo: string;
  descrizione: string;
  azione: string;
  commessa_id?: string;
  commessa_code?: string;
  icona: string; // emoji o nome
  color: string; // hex
}

export function useAISuggerimenti(aziendaId: string | null) {
  const [suggerimenti, setSuggerimenti] = useState<AISuggerimento[]>([]);
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const out: AISuggerimento[] = [];

      // 1. Carica commesse attive
      const { data: commesse } = await supabase
        .from('commesse')
        .select('id, code, cliente, cognome, fase, materiali_status, materiali_perc, produzione_iniziata_at, produzione_completata_at, fattura_acconto_pagata_at, fase_start')
        .eq('azienda_id', aziendaId)
        .in('fase', ['ordine','acconto_pagato','produzione','montaggio']);

      const cmIds = (commesse || []).map((c: any) => c.id);

      // 2. Montaggi prossimi 14gg
      const today = new Date();
      const fromDate = today.toISOString().slice(0, 10);
      const toDt = new Date(today);
      toDt.setDate(toDt.getDate() + 14);
      const toDate = toDt.toISOString().slice(0, 10);

      const { data: montaggi } = cmIds.length > 0 ? await supabase
        .from('montaggi')
        .select('commessa_id, data_montaggio, ore_preventivate, squadra')
        .eq('azienda_id', aziendaId)
        .gte('data_montaggio', fromDate)
        .lte('data_montaggio', toDate) : { data: [] };

      // 3. Squadre attive
      const { count: nSquadre } = await supabase
        .from('squadre')
        .select('id', { count: 'exact', head: true })
        .eq('azienda_id', aziendaId)
        .eq('attiva', true);

      const capacitaGiorno = Math.max(1, nSquadre || 1) * 8;

      // === REGOLE ===

      (commesse || []).forEach((c: any) => {
        const clienteFull = `${c.cliente || ''} ${c.cognome || ''}`.trim();
        const hasMontaggio = (montaggi || []).some((m: any) => m.commessa_id === c.id);

        // REGOLA 1: materiali in attesa con montaggio pianificato → sollecita
        if (c.materiali_status === 'in_attesa' && hasMontaggio) {
          out.push({
            id: `mat-${c.id}`,
            tipo: 'solleciter_fornitore',
            priorita: 'alta',
            titolo: `Solleciter fornitore per ${c.code}`,
            descrizione: `Materiali NON arrivati ma montaggio già pianificato — cliente ${clienteFull}`,
            azione: 'Apri commessa e verifica ordini fornitore',
            commessa_id: c.id,
            commessa_code: c.code,
            icona: '📦',
            color: '#DC2626',
          });
        }

        // REGOLA 2: materiali completi + acconto pagato + produzione non iniziata → avvia produzione
        if (c.materiali_status === 'completo' && c.fattura_acconto_pagata_at && !c.produzione_iniziata_at) {
          out.push({
            id: `prod-${c.id}`,
            tipo: 'avvia_produzione',
            priorita: 'alta',
            titolo: `Avvia produzione ${c.code}`,
            descrizione: `Materiali pronti, acconto pagato — pronta per partire — cliente ${clienteFull}`,
            azione: 'Apri commessa e clicca AVVIA PRODUZIONE',
            commessa_id: c.id,
            commessa_code: c.code,
            icona: '🏭',
            color: '#28A0A0',
          });
        }

        // REGOLA 3: acconto non pagato in fase ordine
        if (!c.fattura_acconto_pagata_at && c.fase === 'ordine') {
          out.push({
            id: `acc-${c.id}`,
            tipo: 'sollecita_acconto',
            priorita: 'media',
            titolo: `Sollecita acconto ${c.code}`,
            descrizione: `Conferma ordine firmata ma acconto non ancora arrivato — cliente ${clienteFull}`,
            azione: 'Chiama o invia reminder al cliente',
            commessa_id: c.id,
            commessa_code: c.code,
            icona: '💶',
            color: '#D97706',
          });
        }

        // REGOLA 4: commessa ferma da troppi giorni (>14gg in stessa fase)
        if (c.fase_start) {
          const diasFermo = (Date.now() - new Date(c.fase_start).getTime()) / (1000 * 60 * 60 * 24);
          if (diasFermo > 14 && c.fase !== 'montaggio') {
            out.push({
              id: `fermo-${c.id}`,
              tipo: 'commessa_ferma',
              priorita: 'media',
              titolo: `${c.code} ferma da ${Math.floor(diasFermo)} giorni`,
              descrizione: `In fase ${c.fase} da troppo tempo — cliente ${clienteFull}`,
              azione: 'Apri e verifica cosa sta bloccando l\\'avanzamento',
              commessa_id: c.id,
              commessa_code: c.code,
              icona: '⏰',
              color: '#D97706',
            });
          }
        }
      });

      // REGOLA 5: saturazione giorni - capacità libera
      const oreByDay: Record<string, number> = {};
      (montaggi || []).forEach((m: any) => {
        if (!m.data_montaggio) return;
        oreByDay[m.data_montaggio] = (oreByDay[m.data_montaggio] || 0) + (Number(m.ore_preventivate) || 4);
      });

      let giorniLiberi = 0;
      for (let i = 1; i < 8; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        const ds = d.toISOString().slice(0, 10);
        const pct = ((oreByDay[ds] || 0) / capacitaGiorno) * 100;
        if (pct < 40) giorniLiberi++;
      }
      if (giorniLiberi >= 3) {
        out.push({
          id: 'cap-libera',
          tipo: 'capacita_libera',
          priorita: 'bassa',
          titolo: `${giorniLiberi} giorni liberi prossima settimana`,
          descrizione: 'Capacità disponibile — accetta nuovi montaggi o programma quelli in attesa',
          azione: 'Vai a Centro Montaggi → tab Pianifica',
          icona: '📅',
          color: '#28A0A0',
        });
      }

      // REGOLA 6: saturazione - giorni saturi
      const saturiCount = Object.entries(oreByDay).filter(([_, ore]) => ore >= capacitaGiorno).length;
      if (saturiCount >= 2) {
        out.push({
          id: 'collasso',
          tipo: 'rischio_collasso',
          priorita: 'alta',
          titolo: `Rischio collasso: ${saturiCount} giorni saturi`,
          descrizione: 'Più giorni a >= 100% saturazione nei prossimi 14gg — rivedere pianificazione',
          azione: 'Vai a Centro Montaggi e sposta montaggi a giorni liberi',
          icona: '🔥',
          color: '#DC2626',
        });
      }

      // Ordino per priorità: alta > media > bassa
      const order = { alta: 0, media: 1, bassa: 2 };
      out.sort((a, b) => order[a.priorita] - order[b.priorita]);

      setSuggerimenti(out);
    } catch (e) {
      console.warn('[useAISuggerimenti]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { compute(); }, [compute]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`ai-sugg-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commesse' }, compute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'montaggi' }, compute)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, compute]);

  return { suggerimenti, loading };
}
