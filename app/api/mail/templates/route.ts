import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET() {
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('email_templates')
    .select('*')
    .eq('azienda_id', AZIENDA_ID)
    .order('ordine')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ templates: data || [] })
}
