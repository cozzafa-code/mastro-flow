"use client";
// hooks/useConflitti.ts
// Conflict engine: calcola alert/blocchi per ogni commessa

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Conflitto {
  severity: 'block' | 'warn';
  code: string;
  message: string;
}

export interface ConflittiPerCommessa {
  [commessaId: string]: Conflitto[];
}

export function useConflitti(aziendaId: string | null) {
  const [conflitti, setConflitti] = useState<ConflittiPerCommessa>({});
  const [loading, setLoading] = useState(true);

  const compute = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: commesse } = await supabase
        .from('commesse')
        .select('id, code, fase, materiali_status, materiali_perc, produzione_completata_at, fattura_acconto_pagata_at, indirizzo')
        .eq('azienda_id', aziendaId)
        .in('fase', ['ordine','acconto_pagato','produzione','montaggio']);

      const cmIds = (commesse || []).map((c: any) => c.id);
      if (cmIds.length === 0) { setConflitti({}); setLoading(false); return; }

      // Carico montaggi per detect doppia assegnazione e sovraccarico squadra
      const { data: montaggi } = await supabase
        .from('montaggi')
        .select('id, commessa_id, data_montaggio, ora_inizio, ora_fine, ore_preventivate, squadra')
        .in('commessa_id', cmIds);

      // INDICE: operatori occupati per giorno+orario
      type Slot = { commessa_id: string; commessa_code: string; data: string; ora_start: number; ora_end: number };
      const occupazioniByOp: Record<string, Slot[]> = {};
      const oreBySquadraData: Record<string, number> = {}; // chiave "squadra_label|data"

      (montaggi || []).forEach((m: any) => {
        if (!m.data_montaggio) return;
        const cm = (commesse || []).find((c: any) => c.id === m.commessa_id);
        const code = cm?.code || '?';

        const ora_start = m.ora_inizio ? parseInt(m.ora_inizio.split(':')[0]) : 8;
        const ora_end = m.ora_fine ? parseInt(m.ora_fine.split(':')[0]) : ora_start + (Number(m.ore_preventivate) || 4);

        const squadraArr = Array.isArray(m.squadra) ? m.squadra : [];

        squadraArr.forEach((s: any) => {
          const opKey = (s.id || s.nome || '').toString();
          if (!opKey) return;
          if (!occupazioniByOp[opKey]) occupazioniByOp[opKey] = [];
          occupazioniByOp[opKey].push({
            commessa_id: m.commessa_id, commessa_code: code,
            data: m.data_montaggio, ora_start, ora_end,
          });
        });

        const sqLabel = squadraArr.map((s: any) => s.nome).filter(Boolean).join(',') || 'Da assegnare';
        const key = `${sqLabel}|${m.data_montaggio}`;
        oreBySquadraData[key] = (oreBySquadraData[key] || 0) + (Number(m.ore_preventivate) || 4);
      });

      // Costruisco conflitti per commessa
      const result: ConflittiPerCommessa = {};

      (commesse || []).forEach((c: any) => {
        const cmConflitti: Conflitto[] = [];

        // Solo per commesse con montaggio pianificato controllo materiali/prod
        const montCm = (montaggi || []).find((m: any) => m.commessa_id === c.id && m.data_montaggio);

        if (montCm) {
          // 1. BLOCK: materiali non completi
          if (c.materiali_status !== 'completo') {
            cmConflitti.push({
              severity: 'block', code: 'MAT_NOT_READY',
              message: c.materiali_status === 'in_attesa' 
                ? 'Materiali NON arrivati — montaggio non assegnabile'
                : `Materiali parziali (${c.materiali_perc}%) — completare prima del montaggio`
            });
          }

          // 2. BLOCK: produzione non finita
          if (!c.produzione_completata_at && c.fase !== 'montaggio') {
            cmConflitti.push({
              severity: 'block', code: 'PROD_NOT_DONE',
              message: 'Produzione non completata — montaggio non pronto'
            });
          }

          // 3. WARN: acconto non pagato
          if (!c.fattura_acconto_pagata_at) {
            cmConflitti.push({
              severity: 'warn', code: 'ACCONTO_PENDING',
              message: 'Acconto cliente non ancora pagato'
            });
          }

          // 4. BLOCK: doppia assegnazione operatore
          const squadraArr = Array.isArray(montCm.squadra) ? montCm.squadra : [];
          squadraArr.forEach((s: any) => {
            const opKey = (s.id || s.nome || '').toString();
            if (!opKey) return;
            const slot = occupazioniByOp[opKey] || [];
            const conflittoOp = slot.find(o => 
              o.commessa_id !== c.id &&
              o.data === montCm.data_montaggio &&
              !(o.ora_end <= (montCm.ora_inizio ? parseInt(montCm.ora_inizio.split(':')[0]) : 8) ||
                o.ora_start >= (montCm.ora_fine ? parseInt(montCm.ora_fine.split(':')[0]) : 16))
            );
            if (conflittoOp) {
              cmConflitti.push({
                severity: 'block', code: 'DUP_ASSIGN',
                message: `${s.nome || 'Operatore'} già assegnato a ${conflittoOp.commessa_code} il ${conflittoOp.data}`
              });
            }
          });

          // 5. WARN: sovraccarico squadra
          const sqLabel = squadraArr.map((s: any) => s.nome).filter(Boolean).join(',') || 'Da assegnare';
          const oreDay = oreBySquadraData[`${sqLabel}|${montCm.data_montaggio}`] || 0;
          if (oreDay > 8) {
            cmConflitti.push({
              severity: 'warn', code: 'SQUADRA_FULL',
              message: `Squadra ${sqLabel} sovraccarica: ${oreDay}h pianificate (max 8h/giorno)`
            });
          }

          // 6. WARN: squadra non assegnata
          if (squadraArr.length === 0) {
            cmConflitti.push({
              severity: 'warn', code: 'NO_SQUADRA',
              message: 'Nessuna squadra assegnata al montaggio'
            });
          }
        }

        if (cmConflitti.length > 0) result[c.id] = cmConflitti;
      });

      setConflitti(result);
    } catch (e) {
      console.warn('[useConflitti]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { compute(); }, [compute]);

  useEffect(() => {
    if (!aziendaId) return;
    const ch = supabase.channel(`conflitti-${aziendaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commesse' }, compute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'montaggi' }, compute)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordini_fornitore' }, compute)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [aziendaId, compute]);

  // Helper: conteggi globali
  const totBlock = Object.values(conflitti).reduce((s, arr) => s + arr.filter(c => c.severity === 'block').length, 0);
  const totWarn = Object.values(conflitti).reduce((s, arr) => s + arr.filter(c => c.severity === 'warn').length, 0);
  const commesseBloccate = Object.entries(conflitti).filter(([_, arr]) => arr.some(c => c.severity === 'block')).map(([id]) => id);

  return { conflitti, loading, compute, totBlock, totWarn, commesseBloccate };
}
