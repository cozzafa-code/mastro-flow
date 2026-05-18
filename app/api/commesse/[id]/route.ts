import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('commesse')
      .select('*')
      .eq('id', params.id)
      .eq('azienda_id', AZIENDA_ID)
      .is('deleted_at', null)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ commessa: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sb = createAdminClient()
    const body = await req.json()
    const { data, error } = await sb
      .from('commesse')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('azienda_id', AZIENDA_ID)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commessa: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
