"use client";
// hooks/useMaterialiCommessa.ts - Legge righe_ordine per commessa raggruppate per 7 categorie

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type CategoriaOp = 'TELAI' | 'ANTE' | 'VETRI' | 'FERRAMENTA' | 'ACCESSORI' | 'MOTORI' | 'KIT_POSA';

export const CATEGORIE: CategoriaOp[] = ['TELAI','ANTE','VETRI','FERRAMENTA','ACCESSORI','MOTORI','KIT_POSA'];

export interface MaterialeRow {
  id: string;
  ordine_id: string;
  ordine_numero?: string;
  categoria: string;
  descrizione: string;
  qta_richiesta: number;
  qta_confermata: number;
  qta_ricevuta: number;
  prezzo_unitario: number;
  totale_riga: number;
  stato: string; // 12 stati operativi
  data_prevista: string | null;
  data_ricevuta: string | null;
  fornitore_nome?: string;
}

export interface CategoriaStats {
  totale_righe: number;
  totale_qta: number;
  qta_ricevuta: number;
  perc_completamento: number;
  stato_globale: 'pronto' | 'parziale' | 'attesa' | 'vuoto';
  righe: MaterialeRow[];
}

export function useMaterialiCommessa(commessaId: string | null) {
  const [byCategoria, setByCategoria] = useState<Record<string, CategoriaStats>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!commessaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: righe } = await supabase
        .from('righe_ordine')
        .select('id, ordine_id, categoria, descrizione, qta_richiesta, qta_confermata, qta_ricevuta, prezzo_unitario, totale_riga, stato, data_prevista, data_ricevuta')
        .eq('commessa_id', commessaId);

      // Carica numeri ordini + fornitori
      const ordIds = Array.from(new Set((righe || []).map((r: any) => r.ordine_id).filter(Boolean)));
      const { data: ord } = ordIds.length > 0
        ? await supabase.from('ordini_fornitore').select('id, numero, fornitore').in('id', ordIds)
        : { data: [] };
      const ordMap: Record<string, any> = {};
      (ord || []).forEach((o: any) => { ordMap[o.id] = o; });

      // Raggruppa per categoria (normalizzo per upper case)
      const groups: Record<string, MaterialeRow[]> = {};
      (righe || []).forEach((r: any) => {
        const cat = (r.categoria || '').toUpperCase();
        // Mappa eventuali categorie legacy
        const catMapped = mapCategoria(cat);
        if (!groups[catMapped]) groups[catMapped] = [];
        groups[catMapped].push({
          ...r,
          ordine_numero: ordMap[r.ordine_id]?.numero,
          fornitore_nome: ordMap[r.ordine_id]?.fornitore,
        });
      });

      // Costruisci stats per ogni categoria spec
      const result: Record<string, CategoriaStats> = {};
      CATEGORIE.forEach(cat => {
        const righeCat = groups[cat] || [];
        const totale_qta = righeCat.reduce((s, r) => s + Number(r.qta_richiesta || 0), 0);
        const qta_ricevuta = righeCat.reduce((s, r) => s + Number(r.qta_ricevuta || 0), 0);
        const perc = totale_qta > 0 ? Math.round((qta_ricevuta / totale_qta) * 100) : 0;
        const stato_globale: CategoriaStats['stato_globale'] = 
          totale_qta === 0 ? 'vuoto' :
          perc >= 100 ? 'pronto' :
          perc > 0 ? 'parziale' : 'attesa';
        
        result[cat] = {
          totale_righe: righeCat.length,
          totale_qta,
          qta_ricevuta,
          perc_completamento: perc,
          stato_globale,
          righe: righeCat,
        };
      });

      setByCategoria(result);
    } catch (e) {
      console.warn('[useMaterialiCommessa]', e);
    } finally {
      setLoading(false);
    }
  }, [commessaId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!commessaId) return;
    const ch = supabase.channel(`mat-cm-${commessaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'righe_ordine', filter: `commessa_id=eq.${commessaId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [commessaId, load]);

  return { byCategoria, loading, reload: load };
}

function mapCategoria(cat: string): CategoriaOp {
  const c = cat.toUpperCase();
  if (['TELAI', 'TELAIO', 'BARRE_ALLUMINIO', 'PROFILI'].includes(c)) return 'TELAI';
  if (['ANTE', 'ANTA'].includes(c)) return 'ANTE';
  if (['VETRI', 'VETRO'].includes(c)) return 'VETRI';
  if (['FERRAMENTA', 'MINUTERIE'].includes(c)) return 'FERRAMENTA';
  if (['ACCESSORI', 'ACCESSORIO', 'LAMIERE'].includes(c)) return 'ACCESSORI';
  if (['MOTORI', 'MOTORE'].includes(c)) return 'MOTORI';
  if (['KIT_POSA', 'KIT POSA', 'POSA'].includes(c)) return 'KIT_POSA';
  return c as CategoriaOp;
}
