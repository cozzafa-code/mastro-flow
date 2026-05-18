import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })
    const sb = createAdminClient()
    const { data, error } = await sb.from('impegni_task').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ task: data })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sb = createAdminClient()
    const { data, error } = await sb.from('impegni_task').insert({
      ...body, fatto: false, created_at: new Date().toISOString(),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ task: data })
  } catch {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
