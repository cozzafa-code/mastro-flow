// app/api/v1/enea/[commessaId]/route.ts
// MASTRO API - Generazione + invio pratica ENEA per detrazioni 50/65/Superbonus
// Header: Authorization: Bearer mk_live_xxx
// Scope: enea:write (da aggiungere ai scopes)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withApiAuth } from '@/lib/api/auth-middleware';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const ENEA_BASE = 'https://detrazionifiscali.enea.it/api/v1';

export const POST = withApiAuth(async (req, ctx) => {
  const url = new URL(req.url);
  const commessaId = url.pathname.split('/').slice(-1)[0];

  // 1. Recupera commessa + dati ENEA
  const { data: commessa } = await supabaseAdmin
    .from('commesse')
    .select(`
      id, numero, stato, totale,
      cliente_nome, cliente_cf, cliente_email,
      indirizzo_intervento, comune_intervento, provincia_intervento, cap_intervento,
      enea_tipo_intervento, enea_zona_climatica
    `)
    .eq('id', commessaId)
    .eq('azienda_id', ctx.aziendaId)
    .maybeSingle();

  if (!commessa) {
    return NextResponse.json({ error: 'commessa_not_found' }, { status: 404 });
  }

  // 2. Recupera credenziali ENEA dell'azienda
  const { data: azienda } = await supabaseAdmin
    .from('aziende')
    .select('enea_user, enea_token, enea_codice_fiscale, ragione, piva')
    .eq('id', ctx.aziendaId)
    .single();

  if (!azienda?.enea_user || !azienda?.enea_token) {
    return NextResponse.json(
      {
        error: 'enea_not_configured',
        message: 'Credenziali ENEA non configurate. Vai in Settings → ENEA.',
      },
      { status: 400 }
    );
  }

  // 3. Recupera vani con dati prestazioni (Uw, area, ecc.)
  const { data: vani } = await supabaseAdmin
    .from('vani')
    .select('id, codice, larghezza, altezza, uw, ug, ggw, ggw_riferimento, prestazioni')
    .eq('commessa_id', commessaId);

  if (!vani || vani.length === 0) {
    return NextResponse.json(
      { error: 'no_vani', message: 'Commessa senza vani' },
      { status: 400 }
    );
  }

  // 4. Costruisci payload ENEA
  const totaleAreaInfissi = vani.reduce(
    (sum, v) => sum + ((v.larghezza ?? 0) * (v.altezza ?? 0)) / 1_000_000,
    0
  ); // mq

  const payload = {
    intestatario: {
      codice_fiscale: commessa.cliente_cf,
      nome_completo: commessa.cliente_nome,
      email: commessa.cliente_email,
    },
    immobile: {
      indirizzo: commessa.indirizzo_intervento,
      comune: commessa.comune_intervento,
      provincia: commessa.provincia_intervento,
      cap: commessa.cap_intervento,
      zona_climatica: commessa.enea_zona_climatica || 'D',
    },
    intervento: {
      tipo: commessa.enea_tipo_intervento || 'sostituzione_infissi',
      data_inizio_lavori: new Date().toISOString().slice(0, 10),
      area_totale_mq: Number(totaleAreaInfissi.toFixed(2)),
      detrazione_richiesta: 65, // % - default 65% efficienza energetica
    },
    serramenti: vani.map((v) => ({
      codice: v.codice,
      larghezza_mm: v.larghezza,
      altezza_mm: v.altezza,
      uw_w_m2k: v.uw,
      ug_w_m2k: v.ug,
      area_mq: ((v.larghezza ?? 0) * (v.altezza ?? 0)) / 1_000_000,
    })),
    importo_totale: commessa.totale,
    fornitore: {
      ragione_sociale: azienda.ragione,
      partita_iva: azienda.piva,
    },
  };

  // 5. Invio a ENEA
  try {
    const eneaRes = await fetch(`${ENEA_BASE}/pratiche`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${azienda.enea_token}`,
        'X-ENEA-User': azienda.enea_user,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!eneaRes.ok) {
      const errBody = await eneaRes.text();
      return NextResponse.json(
        {
          error: 'enea_rejected',
          status: eneaRes.status,
          message: errBody.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const eneaData = await eneaRes.json();
    const codicePratica = eneaData.codice_pratica;
    const tokenInvio = eneaData.token_invio;

    // 6. Salva su MASTRO
    await supabaseAdmin.from('fiscale_pratica').insert({
      azienda_id: ctx.aziendaId,
      commessa_id: commessaId,
      tipo: 'enea_detrazione',
      stato: 'inviata',
      provider: 'enea',
      provider_codice: codicePratica,
      provider_token: tokenInvio,
      payload: payload,
      response: eneaData,
      inviata_il: new Date().toISOString(),
    });

    // 7. Timeline
    await supabaseAdmin.from('timeline_universale').insert({
      azienda_id: ctx.aziendaId,
      entita_tipo: 'commessa',
      entita_id: commessaId,
      evento_tipo: 'enea_inviata',
      descrizione: `Pratica ENEA inviata - codice ${codicePratica}`,
      meta: { detrazione: 65, area_mq: totaleAreaInfissi.toFixed(2) },
    });

    return NextResponse.json({
      success: true,
      codice_pratica: codicePratica,
      token: tokenInvio,
      detrazione: '65%',
      area_mq: Number(totaleAreaInfissi.toFixed(2)),
      importo_detraibile: Number((commessa.totale * 0.65).toFixed(2)),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'enea_error', message: e?.message ?? 'Errore comunicazione ENEA' },
      { status: 502 }
    );
  }
}, { scope: 'enea:write' });
