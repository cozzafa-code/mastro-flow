// app/api/ordini/trasforma/route.ts
// Trasformatore Ordini V1a:
// commessa -> vani snapshot -> raggruppa per fornitore (prima parola sistema) -> N bozze ordini_fornitore
// Aggiorna commesse.materiale_ordinato_at solo a esito OK.
//
// Body: { aziendaId, commessaId }
// Return: { ok: true, ordini: [...], n_ordini }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Stima costo fornitore per mq, V1a placeholder.
// In V2 leggera prezzo_mq da catalogo_listino_prodotti / sistemi.
const STIMA_COSTO_MQ = 180;

function inferisciFornitore(sistemaVano: string | null | undefined, sistemaCommessa: string | null | undefined): string {
  const src = (sistemaVano && sistemaVano.trim()) || (sistemaCommessa && sistemaCommessa.trim()) || '';
  if (!src) return 'Generico';
  const first = src.split(/\s+/)[0];
  return first || 'Generico';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aziendaId, commessaId } = body;

    if (!aziendaId || !UUID_RE.test(aziendaId)) {
      return NextResponse.json({ error: 'aziendaId invalido' }, { status: 400 });
    }
    if (!commessaId || !UUID_RE.test(commessaId)) {
      return NextResponse.json({ error: 'commessaId invalido' }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Carica commessa
    const { data: cm, error: errCm } = await sb
      .from('commesse')
      .select('id, code, cliente, sistema, fase, indirizzo')
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId)
      .maybeSingle();
    if (errCm || !cm) {
      return NextResponse.json({ error: 'commessa non trovata' }, { status: 404 });
    }

    // 2. Trova preventivo piu recente (versione max)
    const { data: prev } = await sb
      .from('preventivi')
      .select('id, versione')
      .eq('commessa_id', commessaId)
      .eq('azienda_id', aziendaId)
      .order('versione', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!prev) {
      return NextResponse.json({ error: 'nessun preventivo trovato per questa commessa' }, { status: 404 });
    }

    // 3. Carica vani snapshot
    const { data: vani, error: errV } = await sb
      .from('preventivo_vani_snapshot')
      .select('id, nome, tipo, pezzi, stanza, piano, misure_complete, misure_json, sistema, sottosistema, vetro, colore_int, colore_est, accessori, note')
      .eq('preventivo_id', prev.id)
      .order('ordine', { ascending: true });

    if (errV) {
      return NextResponse.json({ error: 'errore lettura vani: ' + errV.message }, { status: 500 });
    }
    if (!vani || vani.length === 0) {
      return NextResponse.json({ error: 'nessun vano trovato nel preventivo' }, { status: 404 });
    }

    // 4. Raggruppa per fornitore inferito
    const gruppi: Record<string, any[]> = {};
    for (const v of vani) {
      const forn = inferisciFornitore(v.sistema as any, cm.sistema as any);
      if (!gruppi[forn]) gruppi[forn] = [];
      gruppi[forn].push(v);
    }

    // 5. Numero progressivo: ORD-YYYY-NNNN per azienda
    const anno = new Date().getFullYear();
    const { data: ultimoOrd } = await sb
      .from('ordini_fornitore')
      .select('numero')
      .eq('azienda_id', aziendaId)
      .ilike('numero', 'ORD-' + anno + '-%')
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle();
    let prossimoNum = 1;
    if (ultimoOrd?.numero) {
      const m = String(ultimoOrd.numero).match(/-(\d+)$/);
      if (m) prossimoNum = Number(m[1]) + 1;
    }

    // 6. Crea 1 bozza per gruppo
    const ordiniCreati: any[] = [];
    for (const [fornitore, vaniGruppo] of Object.entries(gruppi)) {
      const numero = 'ORD-' + anno + '-' + String(prossimoNum).padStart(4, '0');
      prossimoNum++;

      // Costruisco righe + totale stimato
      let totaleStimato = 0;
      const righe = vaniGruppo.map((v: any) => {
        const mis = (v.misure_complete || v.misure_json || {}) as any;
        const lmm = Number(mis.lCentro || mis.larghezza || 0);
        const hmm = Number(mis.hCentro || mis.altezza || 0);
        const mq = (lmm / 1000) * (hmm / 1000);
        const pezzi = Number(v.pezzi || 1);
        const costoRiga = Math.round(mq * pezzi * STIMA_COSTO_MQ * 100) / 100;
        totaleStimato += costoRiga;
        return {
          vano_id: v.id,
          desc: (v.tipo || 'Vano') + ' - ' + (v.stanza || '') + ' ' + (v.piano || ''),
          misure: lmm > 0 && hmm > 0 ? lmm + 'x' + hmm : 'da definire',
          qta: pezzi,
          sistema: v.sistema || cm.sistema || '',
          colore_int: v.colore_int || '',
          colore_est: v.colore_est || '',
          vetro: v.vetro || '',
          costo_stimato: costoRiga,
          note: v.note || '',
        };
      });
      totaleStimato = Math.round(totaleStimato * 100) / 100;

      const { data: ordIns, error: errIns } = await sb
        .from('ordini_fornitore')
        .insert({
          azienda_id: aziendaId,
          commessa_id: commessaId,
          numero,
          fornitore,
          tipo: 'finito',
          tipo_ordine: 'finito',
          stato: 'bozza',
          bozza: true,
          righe,
          totale_stimato: totaleStimato,
          vani_inclusi: vaniGruppo.map((v: any) => v.id),
          note: 'Bozza auto-generata dal trasformatore. Rivedi prima di inviare.',
        })
        .select('id, numero, fornitore, totale_stimato, stato, bozza')
        .single();

      if (errIns) {
        console.error('[trasforma] insert err:', errIns);
        // Continuiamo: altri gruppi non bloccati
        continue;
      }
      ordiniCreati.push(ordIns);
    }

    if (ordiniCreati.length === 0) {
      return NextResponse.json({ error: 'nessun ordine creato (insert falliti)' }, { status: 500 });
    }

    // 7. Update commesse.materiale_ordinato_at
    await sb
      .from('commesse')
      .update({ materiale_ordinato_at: new Date().toISOString() })
      .eq('id', commessaId)
      .eq('azienda_id', aziendaId);

    return NextResponse.json({
      ok: true,
      ordini: ordiniCreati,
      n_ordini: ordiniCreati.length,
      n_fornitori: Object.keys(gruppi).length,
      n_vani: vani.length,
    });
  } catch (e: any) {
    console.error('[trasforma] exception:', e);
    return NextResponse.json({ error: e.message || 'errore server' }, { status: 500 });
  }
}
