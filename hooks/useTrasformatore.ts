"use client";
// hooks/useTrasformatore.ts
// Logica trasformazione commessa → ordini fornitore (distinta auto)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type TipoOrdine = 'COMPLETO' | 'TELAI' | 'VETRI' | 'FERRAMENTA' | 'KIT_POSA' | 'MOTORI';

export interface CommessaSource {
  id: string;
  code: string;
  cliente: string;
  cognome: string | null;
  fase: string;
  materiale: string | null;
  num_vani: number;
  num_pezzi: number;
  sistema_principale: string | null;
}

export interface RigaDistinta {
  categoria: string;
  descrizione: string;
  qta_richiesta: number;
  prezzo_unitario: number;
  fornitore_id: string | null;
  fornitore_nome: string | null;
  unita_misura: string;
}

export interface FornitoreOpt {
  id: string;
  nome: string;
  categorie_fornite: string[];
  affidabilita_pct: number;
  rating: number;
}

// Stime medie per pezzo (basate su tipologie standard serramenti)
const STIME: Record<string, { cat: string; descr: (sys: string) => string; qta_per_pezzo: number; prezzo: number; um: string }[]> = {
  TELAI: [
    { cat: 'TELAI', descr: s => `Telaio ${s || 'PVC'} bianco`, qta_per_pezzo: 1, prezzo: 165, um: 'pz' },
    { cat: 'ANTE',  descr: s => `Anta ${s || 'PVC'} bianco`,  qta_per_pezzo: 1, prezzo: 145, um: 'pz' },
  ],
  VETRI: [
    { cat: 'VETRI', descr: () => 'Vetrocamera 4/16/4 bassoemissivo', qta_per_pezzo: 1, prezzo: 380, um: 'pz' },
  ],
  FERRAMENTA: [
    { cat: 'FERRAMENTA', descr: () => 'Cerniera multipunto Hoppe set', qta_per_pezzo: 2, prezzo: 12, um: 'pz' },
    { cat: 'FERRAMENTA', descr: () => 'Maniglia DK argento Hoppe',    qta_per_pezzo: 1, prezzo: 22, um: 'pz' },
    { cat: 'ACCESSORI',  descr: () => 'Guarnizione EPDM nera 4mm',    qta_per_pezzo: 8, prezzo: 0.80, um: 'm' },
  ],
  KIT_POSA: [
    { cat: 'KIT_POSA', descr: () => 'Kit posa Klimahouse Classe A', qta_per_pezzo: 1, prezzo: 89, um: 'kit' },
  ],
  MOTORI: [
    { cat: 'MOTORI', descr: () => 'Motore Somfy Oximo 50/12 RTS', qta_per_pezzo: 1, prezzo: 145, um: 'pz' },
  ],
};

// Mapping categoria → categoria_fornita fornitori
const CAT_TO_FORN: Record<string, string[]> = {
  TELAI: ['telai', 'profili'],
  ANTE: ['telai', 'profili'],
  VETRI: ['vetri'],
  FERRAMENTA: ['ferramenta'],
  ACCESSORI: ['ferramenta', 'accessori'],
  KIT_POSA: ['kit_posa', 'posa', 'accessori'],
  MOTORI: ['motori', 'automazione'],
};

export function useCommesseAttive(aziendaId: string | null) {
  const [commesse, setCommesse] = useState<CommessaSource[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!aziendaId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: cm } = await supabase
        .from('commesse')
        .select('id, code, cliente, cognome, fase, materiale')
        .eq('azienda_id', aziendaId)
        .in('fase', ['preventivo','ordine','acconto_pagato','produzione'])
        .order('created_at', { ascending: false });

      const ids = (cm || []).map((c: any) => c.id);
      const { data: vn } = ids.length > 0
        ? await supabase.from('vani').select('id, commessa_id, sistema, pezzi').in('commessa_id', ids)
        : { data: [] };

      const vanCount: Record<string, { vani: number; pezzi: number; sistema: string | null }> = {};
      (vn || []).forEach((v: any) => {
        if (!vanCount[v.commessa_id]) vanCount[v.commessa_id] = { vani: 0, pezzi: 0, sistema: null };
        vanCount[v.commessa_id].vani++;
        vanCount[v.commessa_id].pezzi += Number(v.pezzi) || 1;
        if (!vanCount[v.commessa_id].sistema && v.sistema) vanCount[v.commessa_id].sistema = v.sistema;
      });

      const result: CommessaSource[] = (cm || []).map((c: any) => ({
        ...c,
        num_vani: vanCount[c.id]?.vani || 0,
        num_pezzi: vanCount[c.id]?.pezzi || 0,
        sistema_principale: vanCount[c.id]?.sistema || c.materiale,
      }));

      setCommesse(result);
    } catch (e) {
      console.warn('[useCommesseAttive]', e);
    } finally {
      setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => { load(); }, [load]);
  return { commesse, loading };
}

export function useFornitoriOpt(aziendaId: string | null) {
  const [fornitori, setFornitori] = useState<FornitoreOpt[]>([]);

  useEffect(() => {
    if (!aziendaId) return;
    (async () => {
      const { data } = await supabase
        .from('fornitori')
        .select('id, nome, categorie_fornite, affidabilita_pct, rating')
        .eq('azienda_id', aziendaId)
        .eq('attivo', true);
      setFornitori((data || []).map((f: any) => ({
        ...f,
        categorie_fornite: Array.isArray(f.categorie_fornite) ? f.categorie_fornite : [],
      })));
    })();
  }, [aziendaId]);

  return fornitori;
}

// Calcola distinta dato commessa+tipo
export function calcolaDistinta(cm: CommessaSource, tipi: TipoOrdine[], fornitori: FornitoreOpt[]): RigaDistinta[] {
  const pezzi = Math.max(cm.num_pezzi, cm.num_vani);
  const righe: RigaDistinta[] = [];

  tipi.forEach(tipo => {
    const tipiDaIncludere: string[] = tipo === 'COMPLETO' 
      ? ['TELAI', 'VETRI', 'FERRAMENTA', 'KIT_POSA']
      : [tipo];

    tipiDaIncludere.forEach(t => {
      const stime = STIME[t] || [];
      stime.forEach(s => {
        const qta = s.qta_per_pezzo * pezzi;
        const prezzo = s.prezzo;

        // Trova fornitore migliore per categoria
        const catKeys = CAT_TO_FORN[s.cat] || [];
        const fornCandidates = fornitori.filter(f => 
          f.categorie_fornite.some(c => catKeys.includes(c.toLowerCase()))
        );
        const best = fornCandidates.sort((a, b) => 
          (b.affidabilita_pct - a.affidabilita_pct) + (b.rating - a.rating) * 10
        )[0];

        righe.push({
          categoria: s.cat,
          descrizione: s.descr(cm.sistema_principale || 'PVC'),
          qta_richiesta: qta,
          prezzo_unitario: prezzo,
          fornitore_id: best?.id || null,
          fornitore_nome: best?.nome || null,
          unita_misura: s.um,
        });
      });
    });
  });

  return righe;
}

// Crea ordini fornitore reali raggruppando per fornitore
export async function creaOrdiniDaDistinta(
  aziendaId: string,
  commessaId: string,
  commessaCode: string,
  righe: RigaDistinta[],
  dataConsegna: string,
  note: string,
): Promise<{ success: boolean; ordineIds: string[]; error?: string }> {
  try {
    // Raggruppa per fornitore_id
    const byForn: Record<string, RigaDistinta[]> = {};
    righe.forEach(r => {
      const k = r.fornitore_id || 'NO_FORN';
      if (!byForn[k]) byForn[k] = [];
      byForn[k].push(r);
    });

    const ordineIds: string[] = [];

    for (const [fornId, grpRighe] of Object.entries(byForn)) {
      const totale = grpRighe.reduce((s, r) => s + r.qta_richiesta * r.prezzo_unitario, 0);
      const fornNome = grpRighe[0]?.fornitore_nome || 'Da assegnare';
      const cat = grpRighe[0]?.categoria;

      // Numero ordine progressivo
      const numero = `ORD-${commessaCode}-${Date.now().toString().slice(-5)}-${fornId.slice(0, 4)}`;

      const { data: ord, error: ordErr } = await supabase
        .from('ordini_fornitore')
        .insert({
          azienda_id: aziendaId,
          numero,
          commessa_id: commessaId,
          fornitore_id: fornId === 'NO_FORN' ? null : fornId,
          fornitore: fornNome,
          categoria_materiale: cat,
          stato: 'da_ordinare',
          totale_stimato: totale,
          totale_euro: totale,
          consegna_prevista: dataConsegna,
          note,
          urgente: false,
          bloccante: cat === 'VETRI' || cat === 'TELAI',
        })
        .select('id')
        .single();

      if (ordErr || !ord) throw ordErr || new Error('insert fallito');
      ordineIds.push(ord.id);

      // Inserisci righe
      const righeIns = grpRighe.map(r => ({
        azienda_id: aziendaId,
        ordine_id: ord.id,
        commessa_id: commessaId,
        commessa_code: commessaCode,
        categoria: r.categoria,
        descrizione: r.descrizione,
        qta_richiesta: r.qta_richiesta,
        qta_confermata: 0,
        qta_ricevuta: 0,
        prezzo_unitario: r.prezzo_unitario,
        totale_riga: r.qta_richiesta * r.prezzo_unitario,
        stato: 'ordinato',
        data_prevista: dataConsegna,
      }));

      const { error: rErr } = await supabase.from('righe_ordine').insert(righeIns);
      if (rErr) throw rErr;
    }

    return { success: true, ordineIds };
  } catch (e: any) {
    return { success: false, ordineIds: [], error: e?.message || 'errore creazione' };
  }
}
