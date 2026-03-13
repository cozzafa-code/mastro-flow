import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit, getIpFromRequest } from '@/lib/audit-log'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, azId } = await req.json()

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  try {
    // 1. Log prima di eliminare
    await logAudit({
      azienda_id: azId,
      user_id: userId,
      action: 'account_delete_requested',
      entity: 'profili',
      entity_id: userId,
      ip: getIpFromRequest(req),
    })

    // 2. Anonimizza profilo (GDPR: conserva record ma rimuove PII)
    await supabase.from('profili').update({
      nome: '[eliminato]',
      cognome: '[eliminato]',
      telefono: null,
      deleted_at: new Date().toISOString(),
    }).eq('id', userId)

    // 3. Inserisce in coda di cancellazione GDPR (eliminazione definitiva dopo 30gg)
    await supabase.from('gdpr_deletion_log').insert({
      user_id: userId,
      azienda_id: azId || null,
      requested_at: new Date().toISOString(),
      scheduled_delete_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    })

    // 4. Revoca sessioni attive
    await supabase.auth.admin.signOut(userId)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Errore interno' }, { status: 500 })
  }
}
