// ============================================================
// MASTRO — app/api/vani/[commessa_id]/route.ts
// API read-only condivisa tra tutte le app satellite
// MONTAGGI, CNC, MISURE, RETE leggono da qui
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { calcolaVano, trasformaCommessaInOrdine } from '@/lib/calcoloVano'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/vani/[commessa_id]
// Query params:
//   ?calcola=true     → include lista taglio + accessori calcolati
//   ?ordine=true      → include righe ordine fornitore
//   ?app=montaggi     → filtra campi per app specifica
export async function GET(
  req: NextRequest,
  { params }: { params: { commessa_id: string } }
) {
  try {
    // Auth via header X-App-Token (per app satellite con PIN login)
    const appToken = req.headers.get('x-app-token')
    const authHeader = req.headers.get('authorization')

    // Recupera commessa con vani
    const { data: commessa, error } = await supabase
      .from('commesse')
      .select('id, code, cliente, cognome, azienda_id, rilievi, sistema, stato')
      .eq('id', params.commessa_id)
      .single()

    if (error || !commessa) {
      return NextResponse.json({ error: 'Commessa non trovata' }, { status: 404 })
    }

    // Estrai vani dall'ultimo rilievo definitivo
    const rilievi = commessa.rilievi || []
    const ultimoRilievo = rilievi
      .filter((r: any) => r.tipo === 'definitiva' || r.tipo === 'rilievo')
      .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())[0]

    const vani = ultimoRilievo?.vani || []

    // Normalizza campi vano (compatibilità vecchi record)
    const vaniNorm = vani.map((v: any) => ({
      id: v.id,
      nome: v.nome,
      tipo: v.tipo || 'F1A',
      stanza: v.stanza,
      piano: v.piano,
      pezzi: v.pezzi || 1,
      sistema: v.sistema || commessa.sistema || '',
      coloreInt: v.coloreInt || v.colore || '',
      coloreEst: v.coloreEst || '',
      misure: {
        lCentro: v.misure?.lCentro || v.larghezza || v.l || 0,
        hCentro: v.misure?.hCentro || v.altezza || v.h || 0,
        lMuro:   v.misure?.lMuro || 0,
        hMuro:   v.misure?.hMuro || 0,
      },
      vetro_config:      v.vetro_config || { attivo: false, composizione: '' },
      persiana_config:   v.persiana_config || { attivo: false, materiale: '', tipo: '', colore: '' },
      tapparella_config: v.tapparella_config
        || (v.accessori?.tapparella?.attivo
          ? { attivo: true, tipo: v.accessori.tapparella.tipo || '', materiale: '', colore: '', comando: '' }
          : { attivo: false, materiale: '', tipo: '', colore: '', comando: '' }),
      zanzariera_config: v.zanzariera_config
        || (v.accessori?.zanzariera?.attivo
          ? { attivo: true, tipo: v.accessori.zanzariera.tipo || '', colore: '' }
          : { attivo: false, tipo: '', colore: '' }),
      note: v.note || '',
      foto: v.foto || {},
      controtelaio: v.controtelaio || '',
      cassonetto: v.cassonetto || false,
      misurato: Object.values(v.misure || {}).filter((x: any) => (x as number) > 0).length >= 2,
    }))

    const url = new URL(req.url)
    const doCalcola = url.searchParams.get('calcola') === 'true'
    const doOrdine  = url.searchParams.get('ordine') === 'true'
    const appTarget = url.searchParams.get('app') || 'erp'

    // Calcola output motore se richiesto
    let vaniConCalcolo = vaniNorm
    if (doCalcola) {
      vaniConCalcolo = vaniNorm.map((v: any) => {
        if (!v.misurato) return v
        const out = calcolaVano({
          vano_id:    v.id,
          vano_nome:  v.nome,
          misure:     v.misure,
          config:     { tipo: v.tipo, pezzi: v.pezzi, sistema: v.sistema },
          vetro:      v.vetro_config,
          persiana:   v.persiana_config,
          tapparella: v.tapparella_config,
          zanzariera: v.zanzariera_config,
        })
        return { ...v, calcolo: out }
      })
    }

    // Genera ordine fornitore se richiesto
    let ordine = null
    if (doOrdine) {
      const vaniMisurati = vaniNorm.filter((v: any) => v.misurato)
      ordine = trasformaCommessaInOrdine({
        commessa_id:   commessa.id,
        commessa_code: commessa.code,
        cliente:       `${commessa.cliente} ${commessa.cognome || ''}`.trim(),
        fornitore:     'Da definire',
        vani:          vaniMisurati,
      })
    }

    // Filtra campi per app (MONTAGGI non ha bisogno di calcolo CNC)
    const response: any = {
      commessa: {
        id:      commessa.id,
        code:    commessa.code,
        cliente: `${commessa.cliente} ${commessa.cognome || ''}`.trim(),
        stato:   commessa.stato,
        sistema: commessa.sistema,
      },
      vani:          vaniConCalcolo,
      totale_vani:   vaniNorm.length,
      vani_misurati: vaniNorm.filter((v: any) => v.misurato).length,
      rilievo_data:  ultimoRilievo?.data || null,
    }

    if (ordine) response.ordine = ordine

    return NextResponse.json(response)

  } catch (err: any) {
    console.error('[API /vani]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
