// ── TIPOLOGIE IMPEGNO ────────────────────────────────────────────
export type TipoImpegno = 'sopralluogo' | 'montaggio' | 'conferma' | 'promemoria' | 'scadenza'

export const TIPI_IMPEGNO: {
  id: TipoImpegno; label: string; color: string; bg: string; dot: string
}[] = [
  { id: 'sopralluogo', label: 'Sopralluogo', color: 'var(--teal-deep)', bg: 'linear-gradient(160deg, var(--teal-bg), var(--teal-soft))', dot: 'var(--teal)' },
  { id: 'montaggio',   label: 'Montaggio',   color: 'var(--ocra-deep)', bg: 'linear-gradient(160deg, var(--ocra-bg), var(--ocra-mid))', dot: 'var(--ocra)' },
  { id: 'conferma',    label: 'Conferma',    color: 'var(--blue-deep)', bg: 'linear-gradient(160deg, var(--blue-bg), #BCC7E5)', dot: 'var(--blue)' },
  { id: 'promemoria',  label: 'Promemoria',  color: 'var(--violet-deep)', bg: 'linear-gradient(160deg, var(--violet-bg), #D5C5E5)', dot: 'var(--violet)' },
  { id: 'scadenza',    label: 'Scadenza',    color: 'var(--red-deep)', bg: 'linear-gradient(160deg, var(--red-bg), var(--red-mid))', dot: 'var(--red)' },
]

// ── TASK ─────────────────────────────────────────────────────────
export type Priorita = 'alta' | 'media' | 'bassa'

export interface SubTask {
  id: string
  testo: string
  fatto: boolean
}

export interface Task {
  id: string
  impegno_id: string
  testo: string
  fatto: boolean
  priorita: Priorita
  assegnato_a: string   // nome operatore
  assegnato_avatar: string  // iniziali
  data_scadenza: string | null
  sub_tasks: SubTask[]
  created_at: string
}

// ── IMPEGNO ──────────────────────────────────────────────────────
export interface Impegno {
  id: string
  titolo: string
  tipo: TipoImpegno
  data: string          // ISO date YYYY-MM-DD
  ora_inizio: string    // HH:MM
  durata_min: number    // minuti
  commessa_id: string | null
  commessa_codice: string | null
  commessa_cliente: string | null
  note: string
  luogo: string
  operatori: string[]   // nomi
  tasks: Task[]
  push_reminder: boolean
  reminder_min: number  // minuti prima
  stato: 'programmato' | 'completato' | 'annullato'
  created_at: string
  updated_at: string
}

// ── VISTA AGENDA ─────────────────────────────────────────────────
export type VistaAgenda = 'mese' | 'giorno' | 'lista'

// ── HELPERS CALENDARIO ───────────────────────────────────────────

export function generateMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Inizia dal lunedì
  const start = new Date(firstDay)
  const dow = (firstDay.getDay() + 6) % 7 // 0=lun
  start.setDate(start.getDate() - dow)

  const days: Date[] = []
  const current = new Date(start)
  while (current <= lastDay || days.length % 7 !== 0) {
    days.push(new Date(current))
    current.setDate(current.getDate() + 1)
    if (days.length > 42) break
  }
  return days
}

export function getDotsForDay(impegni: Impegno[], date: Date): TipoImpegno[] {
  const iso = toISODate(date)
  return impegni
    .filter(i => i.data === iso)
    .map(i => i.tipo)
    .slice(0, 3)
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

export function isToday(d: Date): boolean {
  return isSameDay(d, new Date())
}

export function formatOra(ora: string): string {
  return ora.slice(0, 5)
}

export function formatData(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatDataLunga(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function groupByData(impegni: Impegno[]): Record<string, Impegno[]> {
  return impegni.reduce((acc, i) => {
    if (!acc[i.data]) acc[i.data] = []
    acc[i.data].push(i)
    return acc
  }, {} as Record<string, Impegno[]>)
}

export const MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']
export const GIORNI_SHORT = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
export const DURATE = [30, 60, 90, 120, 180, 240]

export function genImpegnoId(): string {
  return 'imp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}
export function genTaskId(): string {
  return 'tsk-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
}
