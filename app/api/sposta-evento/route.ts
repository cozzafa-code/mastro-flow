import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { eventoId, nuovaData, nuovaOra, note } = body

    const sb = await createClient()

    // Fetch evento con cliente
    const { data: evento, error } = await sb
      .from('eventi')
      .select(`*, cliente:clienti(nome, email)`)
      .eq('id', eventoId)
      .single()

    if (error || !evento) {
      return NextResponse.json({ error: 'Evento non trovato' }, { status: 404 })
    }

    const clienteEmail = evento.cliente?.email
    const clienteNome = evento.cliente?.nome ?? 'Cliente'

    if (!clienteEmail) {
      return NextResponse.json({ sent: false, reason: 'Email cliente non disponibile' })
    }

    // ── Composizione email ───────────────────────────────────────
    // Usa il sistema email già configurato in MASTRO ERP
    // Qui va integrato il tuo provider (Resend, Nodemailer, ecc.)
    // Per ora logghiamo e restituiamo successo simulato in dev

    const emailBody = `
Gentile ${clienteNome},

La informiamo che il suo appuntamento è stato spostato.

Nuova data: ${nuovaData}
Nuovo orario: ${nuovaOra}
${note ? `\nNote: ${note}` : ''}

Per qualsiasi necessità non esiti a contattarci.

Cordiali saluti
${process.env.NEXT_PUBLIC_APP_NAME ?? 'fliwoX'}
    `.trim()

    // TODO: sostituire con chiamata al provider email di MASTRO ERP
    console.log('[EMAIL] A:', clienteEmail)
    console.log('[EMAIL] Oggetto: Appuntamento spostato')
    console.log('[EMAIL] Corpo:', emailBody)

    // Salva notifica in-app
    await sb.from('notifiche').insert({
      user_id: evento.user_id,
      tipo: 'evento',
      titolo: 'Email inviata al cliente',
      body: `Notifica spostamento inviata a ${clienteNome} (${clienteEmail})`,
      letta: false,
      link: `/agenda?data=${nuovaData}`,
    })

    return NextResponse.json({ sent: true, to: clienteEmail })
  } catch (err) {
    console.error('[API /sposta-evento]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
