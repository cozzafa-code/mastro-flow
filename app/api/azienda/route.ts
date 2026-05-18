import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET() {
  const sb = createAdminClient()
  const { data, error } = await sb
    .from('aziende')
    .select('id,ragione,nome,piva,partita_iva,codice_fiscale,indirizzo,citta,cap,provincia,telefono,email,website,iban,cciaa,logo_url,enea_user,enea_codice_fiscale')
    .eq('id', AZIENDA_ID)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ azienda: data })
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('aziende')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', AZIENDA_ID)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ azienda: data })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
