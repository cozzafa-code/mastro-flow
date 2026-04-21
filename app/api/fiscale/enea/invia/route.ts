// app/api/fiscale/enea/invia/route.ts
// POST /api/fiscale/enea/invia { praticaId }
// Invia pratica ENEA (Ecobonus 65/75) e salva numero_pratica + data_invio.
// Richiede credenziali ENEA in aziende_info.

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

    // 1. Leggi pratica + azienda + commessa
    const { data: pratica, error: pErr } = await supabase
      .from('fiscale_pratica')
      .select(`
        id, azienda_id, commessa_id, detrazione, data_fine_lavori, stato_enea,
        commessa:commessa_id(numero, cliente_id, importo_totale,
          cliente:cliente_id(nome, cognome, codice_fiscale, indirizzo)
        )
      `)
      .eq('id', praticaId)
      .single();

    if (pErr || !pratica) {
      return NextResponse.json({ error: pErr?.message || 'pratica non trovata' }, { status: 404 });
    }

    if (!['65', '75'].includes(pratica.detrazione)) {
      return NextResponse.json({ error: 'ENEA obbligatoria solo per detrazioni 65% e 75%' }, { status: 400 });
    }

    if (pratica.stato_enea === 'inviata' || pratica.stato_enea === 'confermata') {
      return NextResponse.json({ error: 'pratica già inviata a ENEA' }, { status: 409 });
    }

    // 2. Credenziali azienda
    const { data: azienda, error: aErr } = await supabase
      .from('aziende_info')
      .select('enea_user, enea_token, enea_codice_fiscale, ragione_sociale, piva')
      .eq('id', pratica.azienda_id)
      .single();

    if (aErr || !azienda?.enea_user || !azienda?.enea_token) {
      return NextResponse.json({
        error: 'Credenziali ENEA mancanti: configurale in Impostazioni → Fiscale',
      }, { status: 400 });
    }

    // 3. Payload ENEA (struttura da adeguare alla API ufficiale quando disponibile)
    const payload = {
      soggetto_beneficiario: {
        codice_fiscale: (pratica.commessa as any)?.cliente?.codice_fiscale,
        nome: (pratica.commessa as any)?.cliente?.nome,
        cognome: (pratica.commessa as any)?.cliente?.cognome,
        indirizzo_immobile: (pratica.commessa as any)?.cliente?.indirizzo,
      },
      intervento: {
        tipo: 'sostituzione_serramenti',
        detrazione: pratica.detrazione,
        importo: (pratica.commessa as any)?.importo_totale,
        data_fine_lavori: pratica.data_fine_lavori,
      },
      impresa: {
        piva: azienda.piva,
        ragione_sociale: azienda.ragione_sociale,
        codice_fiscale: azienda.enea_codice_fiscale,
      },
      commessa_riferimento: (pratica.commessa as any)?.numero,
    };

    // 4. Chiamata ENEA
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

    // 5. Aggiorna pratica + log
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

    const nuovoLog = [...(current?.log_enea || []), logEntry];

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
