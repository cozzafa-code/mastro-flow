// hooks/useScadenzeEnea.ts
// Legge scadenze ENEA imminenti per l'azienda corrente + trigger manuale rescan.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface ScadenzaEnea {
  praticaId: string;
  commessaId: string;
  commessaNumero: string;
  clienteNome: string;
  detrazione: '65' | '75';
  dataFineLavori: string;
  dataScadenza: Date;
  giorniAllaScadenza: number;
  statoEnea: string;
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
        id, commessa_id, detrazione, data_fine_lavori, stato_enea,
        commessa:commessa_id(numero, cliente:cliente_id(nome, cognome))
      `)
      .eq('azienda_id', aziendaId)
      .in('detrazione', ['65', '75'])
      .not('data_fine_lavori', 'is', null)
      .in('stato_enea', ['da_inviare', 'errore', 'scaduta']);

    if (error) { setError(error.message); setLoading(false); return; }

    const oggi = new Date();
    const mapped: ScadenzaEnea[] = (data || []).map((p: any) => {
      const fine = new Date(p.data_fine_lavori);
      const scad = new Date(fine);
      scad.setDate(scad.getDate() + 90);
      const giorni = Math.ceil((scad.getTime() - oggi.getTime()) / (1000 * 60 * 60 * 24));
      const cl = p.commessa?.cliente;
      return {
        praticaId: p.id,
        commessaId: p.commessa_id,
        commessaNumero: p.commessa?.numero || '',
        clienteNome: cl ? `${cl.nome || ''} ${cl.cognome || ''}`.trim() : '',
        detrazione: p.detrazione,
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
