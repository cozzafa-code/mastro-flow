// hooks/useScadenzeEnea.ts
// Legge scadenze ENEA imminenti per l'azienda corrente + trigger manuale rescan.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ScadenzaEnea {
  praticaId: string;
  commessaId: string;
  commessaCode: string;
  clienteNome: string;
  detrazione: '65' | '75';
  dataFineLavori: string;
  dataScadenza: Date;
  giorniAllaScadenza: number;
  statoEnea: string | null;
}

export function useScadenzeEnea(aziendaId: string | null) {
  const [scadenze, setScadenze] = useState<ScadenzaEnea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('fiscale_pratica')
      .select(`
        id, commessa_id, detrazione_raccomandata, data_fine_lavori, stato_enea,
        commessa:commessa_id!inner(code, azienda_id, cliente, cognome)
      `)
      .in('detrazione_raccomandata', ['65', '75'])
      .not('data_fine_lavori', 'is', null);

    if (error) { setError(error.message); setLoading(false); return; }

    const oggi = new Date();
    const mapped: ScadenzaEnea[] = (data || [])
      .filter((p: any) => p.commessa?.azienda_id === aziendaId)
      .filter((p: any) => p.stato_enea !== 'inviata' && p.stato_enea !== 'confermata')
      .map((p: any) => {
        const fine = new Date(p.data_fine_lavori);
        const scad = new Date(fine);
        scad.setDate(scad.getDate() + 90);
        const giorni = Math.ceil((scad.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
        const nome = [p.commessa?.cliente, p.commessa?.cognome].filter(Boolean).join(' ').trim();
        return {
          praticaId: p.id,
          commessaId: p.commessa_id,
          commessaCode: p.commessa?.code || '',
          clienteNome: nome,
          detrazione: p.detrazione_raccomandata,
          dataFineLavori: p.data_fine_lavori,
          dataScadenza: scad,
          giorniAllaScadenza: giorni,
          statoEnea: p.stato_enea,
        };
      });

    mapped.sort((a, b) => a.giorniAllaScadenza - b.giorniAllaScadenza);
    setScadenze(mapped);
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);

  const rescan = useCallback(async () => {
    setLoading(true);
    try {
      await fetch('/api/fiscale/enea/scadenze', { method: 'POST' });
      await load();
    } finally {
      setLoading(false);
    }
  }, [load]);

  const imminenti = scadenze.filter(s => s.giorniAllaScadenza <= 14 && s.giorniAllaScadenza >= 0);
  const scadute = scadenze.filter(s => s.giorniAllaScadenza < 0 || s.statoEnea === 'scaduta');

  return { scadenze, imminenti, scadute, loading, error, reload: load, rescan };
}
