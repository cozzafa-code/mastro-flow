// app/api/fiscale/enea/invia/route.ts
// POST { praticaId } — invia pratica ENEA (Ecobonus 65/75) e salva numero pratica.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ENEA_ENDPOINT = process.env.ENEA_API_ENDPOINT || 'https://detrazionifiscali.enea.it/api/ecobonus/v1';

export async function POST(req: NextRequest) {
  try {
    const { praticaId } = await req.json();
    if (!praticaId) return NextResponse.json({ error: 'praticaId mancante' }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // 1. Leggi pratica + commessa (per avere azienda_id e dati cliente via contatto)
    const { data: pratica, error: pErr } = await supabase
      .from('fiscale_pratica')
      .select(`
        id, commessa_id, detrazione_raccomandata, data_fine_lavori, stato_enea, importo_totale,
        commessa:commessa_id(
          code, azienda_id, cliente, cognome, indirizzo, contatto_id,
          contatto:contatto_id(nome, cognome, indirizzo, citta, cap)
        )
      `)
      .eq('id', praticaId)
      .single();

    if (pErr || !pratica) {
      return NextResponse.json({ error: pErr?.message || 'pratica non trovata' }, { status: 404 });
    }

    const detrazione = (pratica as any).detrazione_raccomandata;
    if (!['65', '75'].includes(detrazione)) {
      return NextResponse.json({ error: 'ENEA obbligatoria solo per detrazioni 65% e 75%' }, { status: 400 });
    }

    if (pratica.stato_enea === 'inviata' || pratica.stato_enea === 'confermata') {
      return NextResponse.json({ error: 'pratica già inviata a ENEA' }, { status: 409 });
    }

    const commessa = (pratica as any).commessa;
    if (!commessa?.azienda_id) {
      return NextResponse.json({ error: 'commessa senza azienda_id' }, { status: 500 });
    }

    // 2. Credenziali ENEA azienda
    const { data: azienda, error: aErr } = await supabase
      .from('aziende')
      .select('enea_user, enea_token, enea_codice_fiscale, ragione, piva')
      .eq('id', commessa.azienda_id)
      .single();

    if (aErr || !azienda?.enea_user || !azienda?.enea_token) {
      return NextResponse.json({
        error: 'Credenziali ENEA mancanti. Configurale in Impostazioni → Fiscale.',
      }, { status: 400 });
    }

    // Dati cliente: prova dal contatto, fallback sui campi della commessa
    const contatto = commessa.contatto;
    const nomeCliente = contatto?.nome || commessa.cliente || '';
    const cognomeCliente = contatto?.cognome || commessa.cognome || '';
    const indirizzoImmobile = contatto?.indirizzo || commessa.indirizzo || '';

    const payload = {
      beneficiario: {
        nome: nomeCliente,
        cognome: cognomeCliente,
        indirizzo_immobile: indirizzoImmobile,
      },
      intervento: {
        tipo: 'sostituzione_serramenti',
        detrazione,
        importo: (pratica as any).importo_totale,
        data_fine_lavori: pratica.data_fine_lavori,
      },
      impresa: {
        piva: azienda.piva,
        ragione_sociale: azienda.ragione,
        codice_fiscale: azienda.enea_codice_fiscale,
      },
      commessa_riferimento: commessa.code,
    };

    let numeroPratica: string | null = null;
    let statoEnea: 'inviata' | 'errore' = 'errore';
    let errorMessage: string | null = null;

    try {
      const res = await fetch(`${ENEA_ENDPOINT}/pratiche`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${azienda.enea_token}`,
          'X-ENEA-User': azienda.enea_user,
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body?.numero_pratica) {
        numeroPratica = body.numero_pratica;
        statoEnea = 'inviata';
      } else {
        errorMessage = body?.error || body?.message || `HTTP ${res.status}`;
      }
    } catch (err: any) {
      errorMessage = err.message || 'errore di rete verso ENEA';
    }

    const logEntry = {
      ts: new Date().toISOString(),
      azione: 'invio_enea',
      esito: statoEnea,
      numero_pratica: numeroPratica,
      errore: errorMessage,
    };

    const { data: current } = await supabase
      .from('fiscale_pratica')
      .select('log_enea')
      .eq('id', praticaId)
      .single();
    const nuovoLog = [...((current?.log_enea as any[]) || []), logEntry];

    await supabase
      .from('fiscale_pratica')
      .update({
        stato_enea: statoEnea,
        numero_pratica_enea: numeroPratica,
        data_invio_enea: statoEnea === 'inviata' ? new Date().toISOString() : null,
        log_enea: nuovoLog,
      })
      .eq('id', praticaId);

    if (statoEnea === 'inviata') {
      return NextResponse.json({ ok: true, numero_pratica: numeroPratica });
    }
    return NextResponse.json({ ok: false, error: errorMessage }, { status: 502 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'errore interno' }, { status: 500 });
  }
}
