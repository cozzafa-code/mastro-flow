import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rilievo_id, nome, settore, numero, tipo_misure } = body

    const sb = createAdminClient()
    const { data, error } = await sb
      .from('vani')
      .insert({
        rilievo_id, nome, settore, numero,
        tipo_misure: tipo_misure || 'provvisorie',
        misure: { lCentro: '', lAlto: '', lBasso: '', hCentro: '', hSx: '', hDx: '', diag1: '', diag2: '', spallSx: '', spallDx: '', note: '' },
        foto_ids: [], stato: 'vuoto', note: '',
        tipo: '', stanza: '', piano: '', sistema: '',
        coloreInt: '', coloreEst: '', bicolore: false, coloreAcc: '',
        vetro: '', telaio: '', telaioAlaZ: '', rifilato: false,
        rifilSx: '', rifilDx: '', rifilSopra: '', rifilSotto: '',
        coprifilo: '', lamiera: '', difficoltaSalita: '', mezzoSalita: '',
        controtelaio: '', ferro: '', pezzi: 1,
        accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vano: data })
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
    const { data, error } = await sb
      .from('vani')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vano: data })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const rilievo_id = searchParams.get('rilievo_id')
    const id = searchParams.get('id')

    const sb = createAdminClient()
    if (id) {
      const { data, error } = await sb.from('vani').select('*').eq('id', id).single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ vano: data })
    }
    if (rilievo_id) {
      const { data, error } = await sb.from('vani').select('*').eq('rilievo_id', rilievo_id).order('numero')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ vani: data })
    }
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
