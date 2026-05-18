import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { codice, cliente_nome, note, sotto_stato, indirizzo, telefono, email } = body

    if (!cliente_nome || !codice) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const parti = cliente_nome.trim().split(' ')
    const cliente = parti[0] || ''
    const cognome = parti.slice(1).join(' ') || ''

    // Genera codice unico basato su timestamp
    const ts = Date.now().toString(36).toUpperCase().slice(-4)
    const rnd = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    const codiceUnico = codice || `S-${ts}${rnd}`

    const sb = createAdminClient()

    // Verifica che il service_role key sia presente
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[POST /api/commesse] SUPABASE_SERVICE_ROLE_KEY non configurata!')
      return NextResponse.json({ error: 'Configurazione server mancante' }, { status: 500 })
    }

    // Usa rpc per bypassare RLS completamente
    const { data, error } = await sb.rpc('insert_commessa_bypass', {
      p_azienda_id: AZIENDA_ID,
      p_code: codiceUnico,
      p_cliente: cliente,
      p_cognome: cognome,
      p_indirizzo: indirizzo || null,
      p_telefono: telefono || null,
      p_email: email || null,
      p_note: note || null,
      p_fase: 'sopralluogo',
    })

    if (error) {
      // Fallback: insert diretto
      console.error('[RPC fallback]', error.message)
      const { data: d2, error: e2 } = await sb
        .from('commesse')
        .insert({
          azienda_id: AZIENDA_ID,
          code: codiceUnico,
          cliente, cognome,
          indirizzo: indirizzo || null,
          telefono: telefono || null,
          email: email || null,
          note: note || null,
          fase: 'sopralluogo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (e2) {
        console.error('[POST /api/commesse] insert error:', e2)
        return NextResponse.json({ error: e2.message }, { status: 500 })
      }
      return NextResponse.json({ commessa: d2 })
    }

    return NextResponse.json({ commessa: data })
  } catch (err) {
    console.error('[POST /api/commesse] unexpected', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('commesse')
      .select('*')
      .eq('azienda_id', AZIENDA_ID)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commesse: data })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
