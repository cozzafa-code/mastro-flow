import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const { searchParams } = new URL(req.url)
    const stato = searchParams.get('stato')
    const q = searchParams.get('q')
    const vip = searchParams.get('vip')

    let query = sb
      .from('clienti')
      .select('id,codice,tipo,nome,email_principale,telefono_principale,foto_url,stato,livello_vip,num_commesse,fatturato_totale,citta_principale,cliente_dal,data_nascita,created_at,updated_at')
      .eq('org_id', ORG_ID)
      .eq('archived', false)
      .order('nome', { ascending: true })
      .limit(500)

    if (stato && stato !== 'tutti') query = query.eq('stato', stato)
    if (vip === '1') query = query.gt('livello_vip', 0)
    if (q) query = query.ilike('nome', `%${q}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ clienti: data || [] })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const body = await req.json()
    const {
      tipo, nome, email_principale, telefono_principale, whatsapp_numero,
      data_nascita, codice_fiscale, partita_iva,
      citta_principale, provincia_principale,
      stato, livello_vip, nota_breve, origine, canale_preferito,
      foto_url, tags,
    } = body

    if (!nome?.trim()) return NextResponse.json({ error: 'Nome obbligatorio' }, { status: 400 })

    const { data, error } = await sb
      .from('clienti')
      .insert({
        org_id: ORG_ID,
        tipo: tipo || 'privato',
        nome: nome.trim(),
        email_principale: email_principale || null,
        telefono_principale: telefono_principale || null,
        whatsapp_numero: whatsapp_numero || null,
        data_nascita: data_nascita || null,
        codice_fiscale: codice_fiscale || null,
        partita_iva: partita_iva || null,
        citta_principale: citta_principale || null,
        provincia_principale: provincia_principale || null,
        stato: stato || 'attivo',
        livello_vip: livello_vip ?? 0,
        nota_breve: nota_breve || null,
        origine: origine || null,
        canale_preferito: canale_preferito || 'whatsapp',
        foto_url: foto_url || null,
        tags: tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ cliente: data }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
