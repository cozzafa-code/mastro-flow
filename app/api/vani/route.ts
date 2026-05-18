import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function mapVano(row: any) {
  if (!row) return null
  return {
    id: row.id, rilievo_id: row.rilievo_id, commessa_id: row.commessa_id,
    nome: row.nome || '', ordine: row.ordine || 1, tipo: row.tipo || '',
    pezzi: row.pezzi || 1, stanza: row.stanza || '', piano: row.piano || '',
    sistema: row.sistema || '', vetro: row.vetro || '',
    coloreInt: row.colore_int || '', coloreEst: row.colore_est || '',
    bicolore: row.bicolore || false, coloreAcc: row.colore_acc || '',
    telaio: row.telaio || '', coprifilo: row.coprifilo || '', lamiera: row.lamiera || '',
    accessori: row.accessori || { tapparella:{attivo:false}, persiana:{attivo:false}, zanzariera:{attivo:false} },
    note: row.note || '', misure: row.misure_json || {},
    created_at: row.created_at, updated_at: row.updated_at,
  }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rilievo_id, commessa_id, nome, numero } = body
    const sb = createAdminClient()
    const { data, error } = await sb.from('vani').insert({
      rilievo_id, commessa_id,
      nome: nome || ('Vano ' + (numero || 1)),
      ordine: numero || 1,
      misure_json: { lCentro:'', lAlto:'', lBasso:'', hCentro:'', hSx:'', hDx:'', diag1:'', diag2:'', spallSx:'', spallDx:'', note:'' },
      accessori: { tapparella:{attivo:false}, persiana:{attivo:false}, zanzariera:{attivo:false} },
      note: '', pezzi: 1,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vano: mapVano(data) })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, misure, coloreInt, coloreEst, bicolore, coloreAcc, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })
    console.log('PATCH body:', JSON.stringify(body)); console.log('PATCH rest:', JSON.stringify(rest)); const patch: any = { ...rest, updated_at: new Date().toISOString() }
    if (misure !== undefined) patch.misure_json = misure
    if (coloreInt !== undefined) patch.colore_int = coloreInt
    if (coloreEst !== undefined) patch.colore_est = coloreEst
    if (bicolore !== undefined) patch.bicolore = bicolore
    if (coloreAcc !== undefined) patch.colore_acc = coloreAcc
    const sb = createAdminClient()
    const { data, error } = await sb.from('vani').update(patch).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vano: mapVano(data) })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
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
      return NextResponse.json({ vano: mapVano(data) })
    }
    if (rilievo_id) {
      const { data, error } = await sb.from('vani').select('*').eq('rilievo_id', rilievo_id).order('ordine')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ vani: (data || []).map(mapVano) })
    }
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }) }
}


