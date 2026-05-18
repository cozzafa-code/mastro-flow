import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = await req.json()
    if (!to || !subject) return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 })

    // Salva in DB come outbound (SMTP non ancora configurato)
    const sb = createAdminClient()
    await sb.from('emails').insert({
      azienda_id: AZIENDA_ID,
      direction: 'outbound',
      from_address: 'info@fliwox.it',
      to_addresses: [to],
      subject,
      body_text: body,
      preview: body.slice(0, 140),
      sent_at: new Date().toISOString(),
      is_read: true,
    })

    // TODO: integrare SMTP/Postmark
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
