import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Nomi colonne reali della tabella commesse (da schema Supabase)
    // code, cliente, cognome, indirizzo, telefono, email, note, fase
    const { codice, cliente_nome, note, sotto_stato, indirizzo, telefono, email } = body

    if (!cliente_nome || !codice) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    // Separa nome e cognome da cliente_nome
    const parti = cliente_nome.trim().split(' ')
    const cliente = parti[0] || ''
    const cognome = parti.slice(1).join(' ') || ''

    // Genera codice unico basato su timestamp
    const ts = Date.now().toString(36).toUpperCase().slice(-4)
    const rnd = Math.floor(Math.random() * 100).toString().padStart(2, '0')
    const codiceUnico = codice || `S-${ts}${rnd}`

    const sb = createAdminClient()
    const { data, error } = await sb
      .from('commesse')
      .insert({
        azienda_id: 'ccca51c1-656b-4e7c-a501-55753e20da29',
        code: codiceUnico,
        cliente,
        cognome,
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

    if (error) {
      console.error('[POST /api/commesse]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commesse: data })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
