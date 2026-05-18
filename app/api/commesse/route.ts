import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { codice, cliente_nome, note, sotto_stato } = body

    if (!cliente_nome || !codice) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const sb = createAdminClient()

    // Legge prima le colonne esistenti per evitare errori schema
    const insertData: Record<string, unknown> = { codice, cliente_nome }

    // Aggiungi solo campi che esistono nella tabella mastro-erp
    // I nomi esatti delle colonne vengono dalla struttura mastro-erp esistente
    if (body.indirizzo) insertData['indirizzo'] = body.indirizzo
    if (body.telefono)  insertData['telefono']  = body.telefono
    if (body.email)     insertData['email']     = body.email
    if (note)           insertData['note']      = note
    if (sotto_stato)    insertData['sotto_stato'] = sotto_stato

    // Colonne standard presenti in mastro-erp
    insertData['fase'] = 'APP'

    const { data, error } = await sb
      .from('commesse')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/commesse]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ commessa: data })
  } catch (err) {
    console.error('[POST /api/commesse] unexpected', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const sb = createAdminClient()
    const { data, error } = await sb
      .from('commesse')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commesse: data })
  } catch (err) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
