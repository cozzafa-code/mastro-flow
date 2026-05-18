import { createClient } from '@/lib/supabase/client'
import type { Rilievo, Vano, MisureVano, TipoRilievo, TipoMisure } from '@/lib/misure-types'
import { emptyMisure } from '@/lib/misure-types'

// ── RILIEVO ──────────────────────────────────────────────────────

export async function createRilievo(params: {
  commessa_id: string
  commessa_codice: string
  commessa_cliente: string
  tipo: TipoRilievo
  tipo_misure: TipoMisure
  rilevatore: string
  note: string
}): Promise<Rilievo | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('rilievi')
    .insert({
      ...params,
      stato: 'bozza',
      vani: [],
    })
    .select()
    .single()

  if (error) { console.error('createRilievo', error); return null }
  return data as Rilievo
}

export async function getRilievo(id: string): Promise<Rilievo | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('rilievi')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Rilievo
}

export async function getRilieviCommessa(commessa_id: string): Promise<Rilievo[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('rilievi')
    .select('*')
    .eq('commessa_id', commessa_id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as Rilievo[]
}

// ── VANO ─────────────────────────────────────────────────────────

export async function createVano(params: {
  rilievo_id: string
  nome: string
  settore: string
  numero: number
  piano?: string
  zona?: string
  tipo_misure: TipoMisure
}): Promise<Vano | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('vani')
    .insert({
      ...params,
      misure: emptyMisure(),
      foto_ids: [],
      stato: 'vuoto',
      note: '',
    })
    .select()
    .single()

  if (error) { console.error('createVano', error); return null }
  return data as Vano
}

export async function getVano(id: string): Promise<Vano | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('vani')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Vano
}

export async function getVaniRilievo(rilievo_id: string): Promise<Vano[]> {
  const sb = createClient()
  const { data, error } = await sb
    .from('vani')
    .select('*')
    .eq('rilievo_id', rilievo_id)
    .order('numero', { ascending: true })

  if (error) return []
  return data as Vano[]
}

export async function saveMisure(vanoId: string, misure: MisureVano): Promise<void> {
  const sb = createClient()
  const { larghezza_cx, altezza_cx } = misure
  const stato = larghezza_cx && altezza_cx ? 'completo' : Object.values(misure).some(v => v) ? 'parziale' : 'vuoto'

  await sb.from('vani').update({
    misure,
    stato,
    updated_at: new Date().toISOString(),
  }).eq('id', vanoId)
}

export async function saveVanoNote(vanoId: string, note: string): Promise<void> {
  const sb = createClient()
  await sb.from('vani').update({ note }).eq('id', vanoId)
}

// ── FOTO ─────────────────────────────────────────────────────────

export async function uploadFotoVano(
  vanoId: string,
  file: File
): Promise<string | null> {
  const sb = createClient()
  const ext = file.name.split('.').pop()
  const path = `vani/${vanoId}/${Date.now()}.${ext}`

  const { error: uploadError } = await sb.storage
    .from('foto-misure')
    .upload(path, file)

  if (uploadError) { console.error('uploadFotoVano', uploadError); return null }

  const { data: { publicUrl } } = sb.storage
    .from('foto-misure')
    .getPublicUrl(path)

  // Aggiorna foto_ids nel vano
  const vano = await getVano(vanoId)
  if (vano) {
    await sb.from('vani').update({
      foto_ids: [...(vano.foto_ids || []), path]
    }).eq('id', vanoId)
  }

  return publicUrl
}

export async function getFotoVano(vanoId: string): Promise<string[]> {
  const sb = createClient()
  const vano = await getVano(vanoId)
  if (!vano?.foto_ids?.length) return []

  return vano.foto_ids.map(path => {
    const { data: { publicUrl } } = sb.storage
      .from('foto-misure')
      .getPublicUrl(path)
    return publicUrl
  })
}
