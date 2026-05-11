"use client";
// hooks/useAutoScheduling.ts
// Auto Scheduling: suggerisce le 3 migliori combinazioni squadra+giorno

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Suggerimento {
  squadra_id: string;
  squadra_nome: string;
  squadra_colore: string;
  squadra_zona: string | null;
  giorno: string;
  giorno_label: string;
  ora_inizio: string;
  ore_stimate: number;
  score: number;
  motivazione: string[];
  warnings: string[];
}

export function useAutoScheduling() {
  const [suggerimenti, setSuggerimenti] = useState<Suggerimento[]>([]);
  const [loading, setLoading] = useState(false);

  const calcola = useCallback(async (aziendaId: string, commessaId: string) => {
    setLoading(true);
    setSuggerimenti([]);
    try {
      // 1. Carica commessa
      const { data: cm } = await supabase
        .from('commesse')
        .select('id, code, indirizzo, tipo_infisso, materiali_status, produzione_completata_at')
        .eq('id', commessaId)
        .single();

      if (!cm) { setLoading(false); return; }

      // Estraggo città dall'indirizzo
      const citta = (cm.indirizzo || '').match(/,\s*([^,]+)$/)?.[1]?.trim().toLowerCase() || '';

      // 2. Carica squadre attive
      const { data: squadre } = await supabase
        .from('squadre')
        .select('id, nome, colore, zona, specializzazione')
        .eq('azienda_id', aziendaId)
        .eq('attiva', true);

      if (!squadre || squadre.length === 0) { setLoading(false); return; }

      // Membri (per stimare ore disponibili)
      const sqIds = squadre.map((s: any) => s.id);
      const { data: membri } = await supabase
        .from('squadre_membri')
        .select('squadra_id')
        .in('squadra_id', sqIds)
        .is('data_uscita', null);
      const membriCount: Record<string, number> = {};
      (membri || []).forEach((m: any) => { membriCount[m.squadra_id] = (membriCount[m.squadra_id] || 0) + 1; });

      // 3. Carica montaggi prossimi 14gg per saturazione
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fromDate = today.toISOString().slice(0, 10);
      const toDt = new Date(today);
      toDt.setDate(toDt.getDate() + 14);
      const toDate = toDt.toISOString().slice(0, 10);

      const { data: montaggi } = await supabase
        .from('montaggi')
        .select('data_montaggio, ore_preventivate, squadra')
        .eq('azienda_id', aziendaId)
        .gte('data_montaggio', fromDate)
        .lte('data_montaggio', toDate);

      // Mappa ore occupate per squadra+giorno
      const oreBySqDay: Record<string, number> = {};
      (montaggi || []).forEach((m: any) => {
        if (!m.data_montaggio || !Array.isArray(m.squadra)) return;
        const ore = Number(m.ore_preventivate) || 4;
        m.squadra.forEach((s: any) => {
          if (!s.nome) return;
          const key = `${s.nome}|${m.data_montaggio}`;
          oreBySqDay[key] = (oreBySqDay[key] || 0) + ore;
        });
      });

      // 4. Ore stimate per il montaggio (placeholder 4h, dipende da vani)
      const oreStimate = 4;

      // 5. Genera suggerimenti per ogni squadra × ogni giorno feriale prossimo
      const tutti: Suggerimento[] = [];

      for (const sq of squadre) {
        const capacitaGiorno = (membriCount[sq.id] || 1) * 8;
        let scoreBase = 0;
        const motivi: string[] = [];
        const warnings: string[] = [];

        // Match zona
        if (citta && sq.zona && sq.zona.toLowerCase().includes(citta)) {
          scoreBase += 30;
          motivi.push(`Zona ${sq.zona} = match perfetto`);
        } else if (sq.zona) {
          motivi.push(`Zona squadra: ${sq.zona}`);
        }

        // Match specializzazione
        if (cm.tipo_infisso && sq.specializzazione && 
            sq.specializzazione.toLowerCase().includes(cm.tipo_infisso.toLowerCase())) {
          scoreBase += 20;
          motivi.push(`Specializzata in ${cm.tipo_infisso}`);
        }

        // Warning: materiali / produzione
        if (cm.materiali_status !== 'completo') {
          warnings.push(cm.materiali_status === 'in_attesa' 
            ? 'Materiali non arrivati — completare prima'
            : `Materiali parziali — attendere`);
        }
        if (!cm.produzione_completata_at) {
          warnings.push('Produzione non completata');
        }

        // Itera giorni feriali
        for (let i = 1; i < 14; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          if (d.getDay() === 0 || d.getDay() === 6) continue; // skip weekend
          const ds = d.toISOString().slice(0, 10);

          const oreOccupate = oreBySqDay[`${sq.nome}|${ds}`] || 0;
          const pct = (oreOccupate / capacitaGiorno) * 100;
          if (pct >= 90) continue; // squadra piena, scarta

          let score = scoreBase;
          const motiviDay = [...motivi];

          if (pct < 40) {
            score += 20;
            motiviDay.push(`Squadra libera (${Math.round(pct)}% saturazione)`);
          } else if (pct < 75) {
            score += 10;
            motiviDay.push(`Saturazione ok (${Math.round(pct)}%)`);
          } else {
            motiviDay.push(`Quasi piena (${Math.round(pct)}%)`);
          }

          // Bonus prossimità (preferisco giorni più vicini)
          score += Math.max(0, 15 - i);

          tutti.push({
            squadra_id: sq.id,
            squadra_nome: sq.nome,
            squadra_colore: sq.colore || '#1E3A5F',
            squadra_zona: sq.zona,
            giorno: ds,
            giorno_label: d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long' }),
            ora_inizio: '08:00',
            ore_stimate: oreStimate,
            score,
            motivazione: motiviDay,
            warnings,
          });
        }
      }

      // Ordina per score, prendi TOP 3
      tutti.sort((a, b) => b.score - a.score);
      setSuggerimenti(tutti.slice(0, 3));
    } catch (e) {
      console.warn('[useAutoScheduling]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const applica = useCallback(async (aziendaId: string, commessaId: string, sug: Suggerimento) => {
    // Cerca montaggio esistente o crea nuovo
    const { data: existing } = await supabase
      .from('montaggi')
      .select('id')
      .eq('commessa_id', commessaId)
      .limit(1)
      .maybeSingle();

    const squadraJson = [{ id: sug.squadra_id, nome: sug.squadra_nome }];
    const oraFine = `${String(parseInt(sug.ora_inizio.split(':')[0]) + sug.ore_stimate).padStart(2, '0')}:00`;

    if (existing) {
      await supabase.from('montaggi').update({
        data_montaggio: sug.giorno,
        ora_inizio: sug.ora_inizio,
        ora_fine: oraFine,
        ore_preventivate: sug.ore_stimate,
        squadra: squadraJson,
      }).eq('id', existing.id);
    } else {
      await supabase.from('montaggi').insert({
        azienda_id: aziendaId,
        commessa_id: commessaId,
        data_montaggio: sug.giorno,
        ora_inizio: sug.ora_inizio,
        ora_fine: oraFine,
        ore_preventivate: sug.ore_stimate,
        squadra: squadraJson,
        stato: 'pianificato',
      });
    }
    return true;
  }, []);

  return { suggerimenti, loading, calcola, applica };
}
