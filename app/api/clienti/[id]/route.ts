import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('clienti')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', ORG_ID)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    // Indirizzi
    const { data: indirizzi } = await sb
      .from('cliente_indirizzi')
      .select('*')
      .eq('cliente_id', params.id)
      .order('is_default', { ascending: false })

    // Commesse collegate per nome/telefono
    const { data: commesse } = await sb
      .from('commesse')
      .select('id,code,cliente,cognome,fase,created_at,totale_finale')
      .eq('azienda_id', ORG_ID)
      .or(`cliente.ilike.${data.nome},telefono.eq.${data.telefono_principale ?? ''}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({ cliente: data, indirizzi: indirizzi || [], commesse: commesse || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = createAdminClient()
    const body = await req.json()

    const { data, error } = await sb
      .from('clienti')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('org_id', ORG_ID)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cliente: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = createAdminClient()
    const { error } = await sb
      .from('clienti')
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('org_id', ORG_ID)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
