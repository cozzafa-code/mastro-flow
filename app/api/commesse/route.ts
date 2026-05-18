import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

function genCode() {
  return `S-${Math.floor(1000 + Math.random() * 9000)}`
}

export async function POST(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const body = await req.json()
    const {
      cliente, cognome, indirizzo, telefono, email, note,
      fase, tipo, difficolta_salita, piano_edificio,
      foro_scale, mezzo_salita, tipo_edificio,
      tipo_problema, tipo_infisso, urgenza, problema, chi_segnala,
    } = body

    if (!cliente) return NextResponse.json({ error: 'Nome cliente obbligatorio' }, { status: 400 })

    // Genera codice univoco con retry
    let data = null, error = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = genCode()
      const res = await sb.from('commesse').insert({
        azienda_id: AZIENDA_ID,
        code,
        cliente,
        cognome: cognome || null,
        indirizzo: indirizzo || null,
        telefono: telefono || null,
        email: email || null,
        note: note || null,
        fase: fase || 'sopralluogo',
        tipo: tipo || null,
        difficolta_salita: difficolta_salita || null,
        piano_edificio: piano_edificio || null,
        foro_scale: foro_scale || null,
        mezzo_salita: mezzo_salita || null,
        tipo_edificio: tipo_edificio || null,
        tipo_problema: tipo_problema || null,
        tipo_infisso: tipo_infisso || null,
        urgenza: urgenza || null,
        problema: problema || null,
        chi_segnala: chi_segnala || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).select().single()

      if (!res.error) { data = res.data; break }
      if (!res.error.message.includes('duplicate key')) { error = res.error; break }
      error = res.error
    }

    if (error) {
      console.error('[POST /api/commesse]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ commessa: data }, { status: 201 })
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
      .select('id,code,cliente,cognome,indirizzo,fase,created_at,updated_at,totale_finale,totale_preventivo,note,tipo')
      .eq('azienda_id', AZIENDA_ID)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commesse: data || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
