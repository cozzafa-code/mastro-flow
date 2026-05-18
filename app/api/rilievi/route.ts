import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('rilievi')
      .insert({
        ...body,
        stato: 'bozza',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ rilievo: data })
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
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ rilievo: data })
    }
    if (commessa_id) {
      const { data, error } = await sb.from('rilievi').select('*').eq('commessa_id', commessa_id).order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ rilievi: data })
    }
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
