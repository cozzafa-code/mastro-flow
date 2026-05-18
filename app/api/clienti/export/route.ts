import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ORG_ID = 'ccca51c1-656b-4e7c-a501-55753e20da29'

export async function GET(req: NextRequest) {
  try {
    const sb = createAdminClient()
    const { searchParams } = new URL(req.url)
    const stato = searchParams.get('stato')

    let query = sb
      .from('clienti')
      .select('codice,tipo,nome,email_principale,telefono_principale,citta_principale,provincia_principale,stato,cliente_dal,num_commesse,fatturato_totale,nota_breve')
      .eq('org_id', ORG_ID)
      .eq('archived', false)
      .order('nome')

    if (stato && stato !== 'tutti') query = query.eq('stato', stato)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const cols = ['codice','tipo','nome','email_principale','telefono_principale','citta_principale','provincia_principale','stato','cliente_dal','num_commesse','fatturato_totale','nota_breve']
    const header = cols.join(';')
    const rows = (data || []).map(r =>
      cols.map(c => {
        const v = (r as Record<string,unknown>)[c]
        if (v == null) return ''
        const s = String(v).replace(/"/g, '""')
        return s.includes(';') ? `"${s}"` : s
      }).join(';')
    )
    const csv = [header, ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clienti-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
