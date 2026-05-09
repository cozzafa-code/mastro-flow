// app/api/v1/cnc/[commessaId]/route.ts
// MASTRO API - Genera e invia programma CNC da commessa
// Header: Authorization: Bearer mk_live_xxx
// Scope richiesto: cnc:write

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';
import {
  generaProgrammaTaglio,
  inviaProgrammaACnc,
  type VanoTaglio,
  type ProfiloTaglio,
} from '@/lib/integrations/cnc-emmegi';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const POST = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const commessaId = url.pathname.split('/').slice(-1)[0];

  if (!commessaId) {
    return NextResponse.json({ error: 'missing_commessa_id' }, { status: 400 });
  }

  // 1. Recupera commessa
  const { data: commessa, error: cErr } = await supabaseAdmin
    .from('commesse')
    .select('id, numero, stato')
    .eq('id', commessaId)
    .eq('azienda_id', ctx.aziendaId)
    .maybeSingle();

  if (cErr || !commessa) {
    return NextResponse.json({ error: 'commessa_not_found' }, { status: 404 });
  }

  // 2. Recupera vani con liste taglio
  const { data: vani } = await supabaseAdmin
    .from('vani')
    .select(`
      id, codice, larghezza, altezza,
      sistema_id,
      sistemi:sistema_id(nome),
      liste_taglio(*)
    `)
    .eq('commessa_id', commessaId);

  if (!vani || vani.length === 0) {
    return NextResponse.json(
      { error: 'no_vani', message: 'Nessun vano da tagliare per questa commessa' },
      { status: 400 }
    );
  }

  // 3. Recupera config CNC azienda
  const { data: integ } = await supabaseAdmin
    .from('user_integrazioni')
    .select('config')
    .eq('azienda_id', ctx.aziendaId)
    .eq('tipo', 'cnc_emmegi')
    .maybeSingle();

  if (!integ?.config) {
    return NextResponse.json(
      { error: 'cnc_not_configured', message: 'CNC Emmegi non configurato' },
      { status: 400 }
    );
  }

  const cncConfig = integ.config;

  // 4. Mappa vani → struttura taglio
  const vaniTaglio: VanoTaglio[] = vani.map((v: any) => {
    const profili: ProfiloTaglio[] = (v.liste_taglio || []).map((lt: any) => ({
      codice: lt.profilo_codice,
      descrizione: lt.profilo_descrizione || '',
      lunghezza_mm: lt.lunghezza_mm,
      quantita: lt.quantita || 1,
      angolo_sx_deg: lt.angolo_sx ?? 45,
      angolo_dx_deg: lt.angolo_dx ?? 45,
      lavorazioni: lt.lavorazioni || [],
    }));

    return {
      vano_id: v.id,
      vano_codice: v.codice || `V${v.id.slice(0, 4)}`,
      sistema: v.sistemi?.nome || 'unknown',
      larghezza_mm: v.larghezza || 0,
      altezza_mm: v.altezza || 0,
      profili,
    };
  });

  // 5. Genera programma
  const programma = generaProgrammaTaglio(vaniTaglio, cncConfig.formato || 'enea-xml', {
    commessa_numero: commessa.numero,
    data: new Date().toISOString().slice(0, 10),
  });

  // 6. Invia alla macchina (se URL endpoint configurato)
  let cncResult: any = { success: false, message: 'CNC offline o non configurato' };
  if (cncConfig.endpoint_url) {
    cncResult = await inviaProgrammaACnc(
      cncConfig,
      programma,
      `${commessa.numero}.${cncConfig.formato === 'gcode' ? 'nc' : cncConfig.formato === 'enea-xml' ? 'xml' : 'emm'}`
    );
  }

  // 7. Log timeline
  await supabaseAdmin.from('timeline_universale').insert({
    azienda_id: ctx.aziendaId,
    entita_tipo: 'commessa',
    entita_id: commessaId,
    evento_tipo: cncResult.success ? 'cnc_inviato' : 'cnc_generato',
    descrizione: cncResult.success
      ? `Programma CNC inviato (job_id: ${cncResult.job_id})`
      : `Programma CNC generato ma non inviato: ${cncResult.message}`,
    meta: { formato: cncConfig.formato, vani: vaniTaglio.length },
  });

  return NextResponse.json({
    success: true,
    commessa: commessa.numero,
    vani: vaniTaglio.length,
    formato: cncConfig.formato,
    cnc: cncResult,
    programma_preview: programma.slice(0, 500) + (programma.length > 500 ? '...' : ''),
  });
}, { scope: 'cnc:write' });
