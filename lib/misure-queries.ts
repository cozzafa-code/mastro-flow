import type { Rilievo, Vano, MisureVano, TipoRilievo, TipoMisure } from '@/lib/misure-types'

// ── RILIEVI ──────────────────────────────────────────────────────

export async function createRilievo(params: {
  commessa_id: string; commessa_codice: string; commessa_cliente: string
  tipo: TipoRilievo; tipo_misure: TipoMisure; rilevatore: string; note: string
}): Promise<Rilievo | null> {
  const res = await fetch('/api/rilievi', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = await res.json()
  if (!res.ok) { console.error('createRilievo', json.error); return null }
  return json.rilievo
}

export async function getRilievo(id: string): Promise<Rilievo | null> {
  const res = await fetch(`/api/rilievi?id=${id}`)
  const json = await res.json()
  if (!res.ok) return null
  return json.rilievo
}

export async function getRilieviCommessa(commessa_id: string): Promise<Rilievo[]> {
  const res = await fetch(`/api/rilievi?commessa_id=${commessa_id}`)
  const json = await res.json()
  if (!res.ok) return []
  return json.rilievi || []
}

// ── VANI ─────────────────────────────────────────────────────────

export async function createVano(params: {
  rilievo_id: string; nome: string; settore: string
  numero: number; piano?: string; zona?: string; tipo_misure: TipoMisure
}): Promise<Vano | null> {
  const res = await fetch('/api/vani', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = await res.json()
  if (!res.ok) { console.error('createVano', json.error); return null }
  return json.vano
}

export async function getVano(id: string): Promise<Vano | null> {
  const res = await fetch(`/api/vani?id=${id}`)
  const json = await res.json()
  if (!res.ok) return null
  return json.vano
}

export async function getVaniRilievo(rilievo_id: string): Promise<Vano[]> {
  const res = await fetch(`/api/vani?rilievo_id=${rilievo_id}`)
  const json = await res.json()
  if (!res.ok) return []
  return json.vani || []
}

export async function saveMisure(vanoId: string, misure: MisureVano): Promise<void> {
  const lC = misure.lCentro, hC = misure.hCentro
  const stato = lC && hC ? 'completo' : Object.values(misure).some(v => v) ? 'parziale' : 'vuoto'
  await fetch('/api/vani', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: vanoId, misure, stato }),
  })
}

export async function saveVanoNote(vanoId: string, note: string): Promise<void> {
  await fetch('/api/vani', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: vanoId, note }),
  })
}

export async function saveVanoField(vanoId: string, field: string, value: unknown): Promise<void> {
  await fetch('/api/vani', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: vanoId, [field]: value }),
  })
}

// ── FOTO ─────────────────────────────────────────────────────────

export async function uploadFotoVano(vanoId: string, file: File): Promise<string | null> {
  // Prima carica su Supabase Storage via API
  const { createClient } = await import('@/lib/supabase/client')
  const sb = createClient()
  const ext = file.name.split('.').pop()
  const path = `vani/${vanoId}/${Date.now()}.${ext}`

  const { error } = await sb.storage.from('foto-misure').upload(path, file)
  if (error) { console.error('uploadFotoVano', error); return null }

  const { data: { publicUrl } } = sb.storage.from('foto-misure').getPublicUrl(path)

  // Aggiorna foto_ids
  const vano = await getVano(vanoId)
  if (vano) {
    await saveVanoField(vanoId, 'foto_ids', [...(vano.foto_ids || []), path])
  }
  return publicUrl
}

export async function getFotoVano(vanoId: string): Promise<string[]> {
  const vano = await getVano(vanoId)
  if (!vano?.foto_ids?.length) return []
  const { createClient } = await import('@/lib/supabase/client')
  const sb = createClient()
  return vano.foto_ids.map(path => sb.storage.from('foto-misure').getPublicUrl(path).data.publicUrl)
}
