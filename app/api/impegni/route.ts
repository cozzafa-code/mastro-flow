import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const mese = searchParams.get('mese')   // YYYY-MM
  const data = searchParams.get('data')   // YYYY-MM-DD
  const sb = createAdminClient()

  if (id) {
    const { data: d, error } = await sb.from('impegni').select('*, tasks:impegni_task(*)').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ impegno: d })
  }

  if (data) {
    const { data: d, error } = await sb.from('impegni').select('*, tasks:impegni_task(*)').eq('data', data).order('ora_inizio')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ impegni: d || [] })
  }

  if (mese) {
    const [y, m] = mese.split('-')
    const from = `${y}-${m}-01`
    const to = `${y}-${m}-31`
    const { data: d, error } = await sb.from('impegni').select('*, tasks:impegni_task(*)').gte('data', from).lte('data', to).order('data').order('ora_inizio')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ impegni: d || [] })
  }

  // Tutti (ultimi 200)
  const { data: d, error } = await sb.from('impegni').select('*, tasks:impegni_task(*)').order('data', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ impegni: d || [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tasks: taskList, ...impegnoData } = body
    const sb = createAdminClient()

    // Crea impegno
    const { data: impegno, error } = await sb.from('impegni').insert({
      ...impegnoData,
      stato: 'programmato',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Crea tasks se presenti
    if (taskList?.length > 0) {
      const tasksToInsert = taskList.map((t: any) => ({
        ...t,
        impegno_id: impegno.id,
        fatto: false,
        created_at: new Date().toISOString(),
      }))
      await sb.from('impegni_task').insert(tasksToInsert)
    }

    return NextResponse.json({ impegno })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })

    const sb = createAdminClient()
    const { data, error } = await sb.from('impegni').update({
      ...updates,
      updated_at: new Date().toISOString(),
    }).eq('id', id).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ impegno: data })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })

  const sb = createAdminClient()
  await sb.from('impegni_task').delete().eq('impegno_id', id)
  await sb.from('impegni').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
