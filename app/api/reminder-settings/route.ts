import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET() {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('cliente_reminder_settings')
      .select('*')
      .eq('org_id', ORG_ID)
      .is('user_id', null)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const body = await req.json()

    const { data, error } = await sb
      .from('cliente_reminder_settings')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('org_id', ORG_ID)
      .is('user_id', null)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
