import type { Cliente, DiaryEntry, ReminderSettings } from './clienti-types'

// ── LISTA CLIENTI ────────────────────────────────────────
export async function fetchClienti(params?: { stato?: string; q?: string; vip?: boolean }): Promise<Cliente[]> {
  const sp = new URLSearchParams()
  if (params?.stato && params.stato !== 'tutti') sp.set('stato', params.stato)
  if (params?.q) sp.set('q', params.q)
  if (params?.vip) sp.set('vip', '1')

  const res = await fetch(`/api/clienti?${sp}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.clienti
}

// ── CREA CLIENTE ─────────────────────────────────────────
export async function createCliente(data: Partial<Cliente>): Promise<Cliente> {
  const res = await fetch('/api/clienti', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.cliente
}

// ── DETTAGLIO CLIENTE ────────────────────────────────────
export async function fetchCliente(id: string) {
  const res = await fetch(`/api/clienti/${id}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json // { cliente, indirizzi, commesse }
}

// ── AGGIORNA CLIENTE ─────────────────────────────────────
export async function updateCliente(id: string, data: Partial<Cliente>): Promise<Cliente> {
  const res = await fetch(`/api/clienti/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.cliente
}

// ── ARCHVIA CLIENTE ───────────────────────────────────────
export async function archiviaCliente(id: string): Promise<void> {
  const res = await fetch(`/api/clienti/${id}`, { method: 'DELETE' })
  if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
}

// ── DIARY ────────────────────────────────────────────────
export async function fetchDiary(clienteId: string): Promise<DiaryEntry[]> {
  const res = await fetch(`/api/diary?cliente_id=${clienteId}`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.entries
}

export async function createDiaryEntry(data: {
  cliente_id: string; testo: string; categoria?: string;
  importanza?: number; action_required?: boolean; action_type?: string;
}): Promise<DiaryEntry> {
  const res = await fetch('/api/diary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.entry
}

export async function dismissDiaryEntry(id: string): Promise<void> {
  const res = await fetch('/api/diary', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, dismissed: true, dismissed_at: new Date().toISOString() }),
  })
  if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
}

export async function markDiaryActionTaken(id: string, action_type: string): Promise<void> {
  const res = await fetch('/api/diary', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action_taken: true, action_type, action_taken_at: new Date().toISOString() }),
  })
  if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
}

// ── REMINDER SETTINGS ────────────────────────────────────
export async function fetchReminderSettings(): Promise<ReminderSettings> {
  const res = await fetch('/api/reminder-settings')
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.settings
}

export async function updateReminderSettings(data: Partial<ReminderSettings>): Promise<ReminderSettings> {
  const res = await fetch('/api/reminder-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error)
  return json.settings
}

// ── EXPORT CSV ───────────────────────────────────────────
export function exportClientiCSV(stato?: string) {
  const url = `/api/clienti/export${stato ? `?stato=${stato}` : ''}`
  const a = document.createElement('a')
  a.href = url; a.download = `clienti.csv`; a.click()
}
