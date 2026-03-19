// app/api/commesse/route.ts
// Lista commesse per pagina Ordini
// GET /api/commesse?stato=attiva&hasMisure=true

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const url    = new URL(req.url)
    const stato  = url.searchParams.get('stato')      // 'attiva' | null
    const hasMis = url.searchParams.get('hasMisure')  // 'true' | null

    let query = supabase
      .from('commesse')
      .select('id, code, cliente, cognome, stato, sistema, rilievi, azienda_id')
      .order('created_at', { ascending: false })

    if (stato) query = query.eq('stato', stato)

    const { data, error } = await query

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    let commesse = data || []

    // Filtra commesse che hanno almeno un vano misurato
    if (hasMis === 'true') {
      commesse = commesse.filter(c => {
        const rilievi = c.rilievi || []
        const ultimo = rilievi[rilievi.length - 1]
        if (!ultimo) return false
        const vani = ultimo.vani || []
        return vani.some((v: any) =>
          Object.values(v.misure || {}).filter((x: any) => (x as number) > 0).length >= 2
        )
      })
    }

    return NextResponse.json({ commesse, totale: commesse.length })
  } catch (err: any) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
