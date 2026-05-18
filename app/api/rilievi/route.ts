import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { commessa_id, tipo_rilievo, tipo_misure, rilevatore, note } = body

    if (!commessa_id) return NextResponse.json({ error: 'commessa_id obbligatorio' }, { status: 400 })

    const sb = createAdminClient()
    const { data, error } = await sb
      .from('rilievi')
      .insert({
        commessa_id,
        azienda_id: AZIENDA_ID,
        tipo: tipo_misure || 'provvisorie',       // colonna DB = tipo
        complesso: tipo_rilievo === 'complesso',   // colonna DB = complesso boolean
        rilevatore: rilevatore || null,
        note: note || null,
        data: new Date().toISOString().split('T')[0],
        ora: new Date().toTimeString().slice(0,5),
        completato: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/rilievi]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ rilievo: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const commessa_id = searchParams.get('commessa_id')
    const sb = createAdminClient()

    if (id) {
      const { data, error } = await sb.from('rilievi').select('*').eq('id', id).single()
      if (error) return NextResponse.json({ error: error.message }, { status: 404 })
      return NextResponse.json({ rilievo: data })
    }
    if (commessa_id) {
      const { data, error } = await sb
        .from('rilievi')
        .select('*, vani(*)')
        .eq('commessa_id', commessa_id)
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      // Normalizza: aggiungi campo tipo_rilievo e tipo_misure per la UI
      const rilievi = (data || []).map((r: any) => ({
        ...r,
        tipo_rilievo: r.complesso ? 'complesso' : 'semplice',
        tipo_misure: r.tipo || 'provvisorie',
      }))
      return NextResponse.json({ rilievi })
    }
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
