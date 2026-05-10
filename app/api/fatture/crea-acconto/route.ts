// app/api/fatture/crea-acconto/route.ts
// Crea fattura ACCONTO (o saldo/altro) persistente su fin_fatture_emesse.
// Numero progressivo per anno + tipo. Stato iniziale = 'bozza'.
// Body: { aziendaId, commessaId, tipo: 'acconto'|'saldo'|'altro', importo, ivaPerc?, scadenzaGiorni?, note? }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aziendaId, commessaId, tipo = 'acconto', importo, ivaPerc = 10, scadenzaGiorni = 30, note } = body;

    if (!aziendaId || !UUID_RE.test(aziendaId)) {
      return NextResponse.json({ error: 'aziendaId invalido' }, { status: 400 });
    }
    if (!commessaId && !body.commessaCode) {
      return NextResponse.json({ error: 'commessaId o commessaCode richiesto' }, { status: 400 });
    }
    if (!['acconto','saldo','altro'].includes(tipo)) {
      return NextResponse.json({ error: 'tipo invalido' }, { status: 400 });
    }
    const totaleFat = Number(importo);
    if (!totaleFat || totaleFat <= 0) {
      return NextResponse.json({ error: 'importo invalido' }, { status: 400 });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Carica commessa per cliente / code: prova per UUID, poi fallback per code se commessaCode passato
    let cm: any = null;
    if (UUID_RE.test(commessaId)) {
      const { data } = await sb
        .from('commesse')
        .select('id, code, cliente, telefono, email, indirizzo, cf, piva')
        .eq('id', commessaId)
        .eq('azienda_id', aziendaId)
        .maybeSingle();
      cm = data;
    }
    // Fallback: cerca per code (campo aggiunto al body)
    if (!cm && body.commessaCode) {
      const { data } = await sb
        .from('commesse')
        .select('id, code, cliente, telefono, email, indirizzo, cf, piva')
        .eq('code', body.commessaCode)
        .eq('azienda_id', aziendaId)
        .maybeSingle();
      cm = data;
    }
    if (!cm) {
      return NextResponse.json({ error: 'commessa non trovata' }, { status: 404 });
    }
    // Override commessaId con quello DB reale
    const commessaIdDb = cm.id;

    // Numero progressivo: ACC/SAL/FAT-YYYY-NNNN per azienda+tipo+anno
    const anno = new Date().getFullYear();
    const prefix = tipo === 'acconto' ? 'ACC' : tipo === 'saldo' ? 'SAL' : 'FAT';
    const { data: ultimo } = await sb
      .from('fin_fatture_emesse')
      .select('numero')
      .eq('azienda_id', aziendaId)
      .ilike('numero', `${prefix}-${anno}-%`)
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle();

    let prossimoNum = 1;
    if (ultimo?.numero) {
      const m = String(ultimo.numero).match(/-(\d+)$/);
      if (m) prossimoNum = Number(m[1]) + 1;
    }
    const numero = `${prefix}-${anno}-${String(prossimoNum).padStart(4,'0')}`;

    // Calcoli importi
    const imponibile = Math.round((totaleFat / (1 + ivaPerc / 100)) * 100) / 100;
    const iva = Math.round((totaleFat - imponibile) * 100) / 100;

    const oggi = new Date();
    const scadenza = new Date(oggi); scadenza.setDate(oggi.getDate() + scadenzaGiorni);

    const { data: fat, error: errIns } = await sb
      .from('fin_fatture_emesse')
      .insert({
        azienda_id: aziendaId,
        numero,
        tipo,
        data_emissione: oggi.toISOString().slice(0,10),
        data_scadenza: scadenza.toISOString().slice(0,10),
        cliente: [cm.cliente].filter(Boolean).join(' ').trim() || 'Cliente',
        cliente_piva: cm.piva || null,
        cliente_cf: cm.cf || null,
        cliente_indirizzo: cm.indirizzo || null,
        imponibile,
        iva_percent: ivaPerc,
        iva,
        totale: totaleFat,
        stato: 'bozza',
        pagato: 0,
        residuo: totaleFat,
        commessa_id: commessaIdDb,
        commessa_code: cm.code,
        note: note || (tipo === 'acconto' ? 'Acconto su ordine' : tipo === 'saldo' ? 'Saldo a completamento' : ''),
      })
      .select('id, numero, totale, stato, tipo, commessa_id, commessa_code, data_emissione, data_scadenza')
      .single();

    if (errIns) {
      console.error('[crea-acconto] insert error:', errIns);
      return NextResponse.json({ error: errIns.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, fattura: fat });
  } catch (e: any) {
    console.error('[crea-acconto] exception:', e);
    return NextResponse.json({ error: e.message || 'errore server' }, { status: 500 });
  }
}
