import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const { searchParams } = new URL(req.url)
    const clienteId = searchParams.get('cliente_id')
    if (!clienteId) return NextResponse.json({ error: 'cliente_id obbligatorio' }, { status: 400 })

    const { data, error } = await sb
      .from('diary_entries')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const body = await req.json()
    const { cliente_id, testo, categoria, importanza, action_required, action_type, related_commessa_id } = body

    if (!cliente_id || !testo?.trim()) return NextResponse.json({ error: 'cliente_id e testo obbligatori' }, { status: 400 })

    const { data, error } = await sb
      .from('diary_entries')
      .insert({
        org_id: ORG_ID,
        cliente_id,
        source: 'manual',
        testo: testo.trim(),
        categoria: categoria || null,
        importanza: importanza ?? 1,
        action_required: action_required ?? false,
        action_type: action_type || null,
        related_commessa_id: related_commessa_id || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entry: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 })

    const { data, error } = await sb
      .from('diary_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entry: data })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
