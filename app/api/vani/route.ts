import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function mapVano(row: any) {
  if (!row) return null
  return {
    id: row.id,
    rilievo_id: row.rilievo_id,
    commessa_id: row.commessa_id,
    nome: row.nome || '',
    ordine: row.ordine || 1,
    tipo: row.tipo || '',
    pezzi: row.pezzi || 1,
    stanza: row.stanza || '',
    piano: row.piano || '',
    sistema: row.sistema || '',
    sottosistema: row.sottosistema || '',
    vetro: row.vetro || '',
    coloreInt: row.colore_int || '',
    coloreEst: row.colore_est || '',
    bicolore: row.bicolore || false,
    coloreAcc: row.colore_acc || '',
    telaio: row.telaio || '',
    telaioAlaZ: row.telaio_ala_z || '',
    rifilato: row.rifilato || false,
    rifilSx: row.rifil_sx || '',
    rifilDx: row.rifil_dx || '',
    rifilSopra: row.rifil_sopra || '',
    rifilSotto: row.rifil_sotto || '',
    coprifilo: row.coprifilo || '',
    lamiera: row.lamiera || '',
    ctProfilo: row.ct_profilo || '',
    ctSezione: row.ct_sezione || '',
    ctCielino: row.ct_cielino || '',
    ctNote: row.ct_note || '',
    cassonetto: row.cassonetto || false,
    cassonettoTipo: row.cassonetto_tipo || '',
    accessori: row.accessori || { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
    difficoltaSalita: row.difficolta_salita || '',
    mezzoSalita: row.mezzo_salita || '',
    note: row.note || '',
    misure: row.misure_json || {},
    vetroConfig: row.vetro_config || {},
    controtelaioConfig: row.controtelaio_config || {},
    cassonettoConfig: row.cassonetto_config || {},
    persianaConfig: row.persiana_config || {},
    tapparellaConfig: row.tapparella_config || {},
    zanzarieraConfig: row.zanzariera_config || {},
    livello1: row.livello_1 || '',
    livello2: row.livello_2 || '',
    livello3: row.livello_3 || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { rilievo_id, commessa_id, nome, numero } = body
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('vani')
      .insert({
        rilievo_id,
        commessa_id,
        nome: nome || 'Vano ' + (numero || 1),
        ordine: numero || 1,
        misure_json: { lCentro: '', lAlto: '', lBasso: '', hCentro: '', hSx: '', hDx: '', diag1: '', diag2: '', spallSx: '', spallDx: '', note: '' },
        accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
        note: '',
        pezzi: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vano: mapVano(data) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, misure, coloreInt, coloreEst, bicolore, coloreAcc, telaioAlaZ, rifilato, rifilSx, rifilDx, rifilSopra, rifilSotto, ...rest } = body
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })
    const patch: any = { ...rest, updated_at: new Date().toISOString() }
    if (misure !== undefined) patch.misure_json = misure
    if (coloreInt !== undefined) patch.colore_int = coloreInt
    if (coloreEst !== undefined) patch.colore_est = coloreEst
    if (bicolore !== undefined) patch.bicolore = bicolore
    if (coloreAcc !== undefined) patch.colore_acc = coloreAcc
    if (telaioAlaZ !== undefined) patch.telaio_ala_z = telaioAlaZ
    if (rifilato !== undefined) patch.rifilato = rifilato
    if (rifilSx !== undefined) patch.rifil_sx = rifilSx
    if (rifilDx !== undefined) patch.rifil_dx = rifilDx
    if (rifilSopra !== undefined) patch.rifil_sopra = rifilSopra
    if (rifilSotto !== undefined) patch.rifil_sotto = rifilSotto
    const sb = createAdminClient()
    const { data, error } = await sb.from('vani').update(patch).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ vano: mapVano(data) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
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
      return NextResponse.json({ vano: mapVano(data) })
    }
    if (rilievo_id) {
      const { data, error } = await sb.from('vani').select('*').eq('rilievo_id', rilievo_id).order('ordine')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ vani: (data || []).map(mapVano) })
    }
    return NextResponse.json({ error: 'Parametri mancanti' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Errore interno' }, { status: 500 })
  }
}
