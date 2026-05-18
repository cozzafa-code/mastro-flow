import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // body.rows = array di oggetti parsati lato client con SheetJS
    const { rows } = body as { rows: Record<string, string>[] }

    if (!rows?.length) return NextResponse.json({ error: 'Nessuna riga' }, { status: 400 })

    const sb = createAdminClient()

    const toInsert = rows
      .filter(r => r.nome?.trim())
      .map(r => ({
        org_id: ORG_ID,
        tipo: r.tipo || 'privato',
        nome: r.nome.trim(),
        email_principale: r.email || null,
        telefono_principale: r.telefono || null,
        citta_principale: r.citta || null,
        provincia_principale: r.provincia || null,
        codice_fiscale: r.codice_fiscale || null,
        partita_iva: r.piva || null,
        stato: 'attivo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

    const { data, error } = await sb
      .from('clienti')
      .insert(toInsert)
      .select('id,codice,nome')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ importati: data?.length ?? 0, clienti: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
