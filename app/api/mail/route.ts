import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const AZIENDA_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') || 'tutte'
  const vista = searchParams.get('vista') || 'inbox'
  const search = searchParams.get('q') || ''
  const sb = createAdminClient()

  let query = sb
    .from('emails')
    .select('*, attachments:email_attachments(id,filename,mime_type,size_bytes,storage_url)')
    .eq('azienda_id', AZIENDA_ID)
    .eq('is_archived', false)
    .eq('is_trashed', false)
    .order('received_at', { ascending: false })
    .limit(100)

  if (vista === 'lead_board') {
    query = query.eq('category', 'lead').not('lead_stage', 'is', null)
  }

  if (filter === 'non_lette') query = query.eq('is_read', false)
  else if (filter === 'lead') query = query.eq('category', 'lead')
  else if (filter === 'clienti') query = query.eq('category', 'cliente')
  else if (filter === 'fornitori') query = query.eq('category', 'fornitore')
  else if (filter === 'fatture') query = query.eq('category', 'fattura')
  else if (filter === 'starred') query = query.eq('is_starred', true)

  if (search.length >= 2) {
    query = query.or(`subject.ilike.%${search}%,from_address.ilike.%${search}%,preview.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ emails: data || [] })
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('emails')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ email: data })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
