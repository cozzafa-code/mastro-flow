// app/api/catalogo-tende/seed/route.ts
// Importa template demo del catalogo tendaggi per uno o piu fornitori.
// POST body: { fornitori: ['pratic', 'gibus', 'ke', 'mottura'] }
// Insert idempotente via ON CONFLICT (azienda_id, fornitore, modello).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import { TEMPLATE_FORNITORI, type FornitoreTemplate } from '@/lib/catalogo-tende-templates';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    const aziendaId = auth.aziendaId;

    const body = await req.json().catch(() => ({}));
    const fornitoriRichiesti: string[] = Array.isArray(body.fornitori) ? body.fornitori : [];
    if (fornitoriRichiesti.length === 0) {
      return NextResponse.json({ error: 'Specifica almeno un fornitore in body.fornitori' }, { status: 400 });
    }

    const result = { modelli: 0, accessori: 0, colori: 0, fornitori_importati: [] as string[], salta_gia_presenti: [] as string[] };

    for (const fornKey of fornitoriRichiesti) {
      const tpl = TEMPLATE_FORNITORI[fornKey];
      if (!tpl) continue;

      // Verifica se gia importato (versione)
      const { data: gia } = await supabase
        .from('catalogo_tende_imports')
        .select('id')
        .eq('azienda_id', aziendaId)
        .eq('fornitore', tpl.fornitore)
        .eq('versione', tpl.versione)
        .maybeSingle();
      if (gia) {
        result.salta_gia_presenti.push(tpl.fornitore);
        continue;
      }

      // Inserisco modelli
      let modelliCount = 0;
      if (tpl.modelli && tpl.modelli.length > 0) {
        const rows = tpl.modelli.map(m => ({ ...m, azienda_id: aziendaId, fornitore: tpl.fornitore }));
        const { error } = await supabase.from('catalogo_tendaggi').upsert(rows, { onConflict: 'azienda_id,fornitore,modello', ignoreDuplicates: true });
        if (!error) modelliCount = rows.length;
        else console.error('seed modelli:', error);
      }

      // Inserisco accessori
      let accessoriCount = 0;
      if (tpl.accessori && tpl.accessori.length > 0) {
        const rows = tpl.accessori.map(a => ({ ...a, azienda_id: aziendaId, fornitore: tpl.fornitore }));
        const { error } = await supabase.from('accessori_tendaggi').insert(rows);
        if (!error) accessoriCount = rows.length;
        else console.error('seed accessori:', error);
      }

      // Inserisco colori
      let coloriCount = 0;
      if (tpl.colori && tpl.colori.length > 0) {
        const rows = tpl.colori.map(c => ({ ...c, azienda_id: aziendaId, fornitore: tpl.fornitore }));
        const { error } = await supabase.from('colori_tendaggi').insert(rows);
        if (!error) coloriCount = rows.length;
        else console.error('seed colori:', error);
      }

      // Salvo metadato import
      await supabase.from('catalogo_tende_imports').insert([{
        azienda_id: aziendaId,
        fornitore: tpl.fornitore,
        versione: tpl.versione,
        modelli_inseriti: modelliCount,
        accessori_inseriti: accessoriCount,
        colori_inseriti: coloriCount,
      }]);

      result.modelli += modelliCount;
      result.accessori += accessoriCount;
      result.colori += coloriCount;
      result.fornitori_importati.push(tpl.fornitore);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('catalogo-tende/seed:', e);
    return NextResponse.json({ error: e?.message || 'Errore server' }, { status: 500 });
  }
}

// GET: ritorna la lista dei template disponibili (per UI mostrare i fornitori importabili)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth.ok) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });

    // Lista import gia fatti
    const { data: imports } = await supabase
      .from('catalogo_tende_imports')
      .select('fornitore, versione, data_import, modelli_inseriti, accessori_inseriti, colori_inseriti')
      .eq('azienda_id', auth.aziendaId);

    const giaFatti = new Set((imports || []).map(i => `${i.fornitore}|${i.versione}`));

    const lista = Object.entries(TEMPLATE_FORNITORI).map(([key, tpl]) => ({
      key,
      fornitore: tpl.fornitore,
      descrizione: tpl.descrizione,
      versione: tpl.versione,
      modelli_count: tpl.modelli?.length || 0,
      accessori_count: tpl.accessori?.length || 0,
      colori_count: tpl.colori?.length || 0,
      gia_importato: giaFatti.has(`${tpl.fornitore}|${tpl.versione}`),
    }));

    return NextResponse.json({ ok: true, templates: lista, imports });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore server' }, { status: 500 });
  }
}
