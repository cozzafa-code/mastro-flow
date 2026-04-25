'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import SecuritySettings from '@/components/SecuritySettings'

type Tab = 'account' | 'sicurezza' | 'dati' | 'azienda'

export default function ImpostazioniPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('account')
  const [user, setUser] = useState<any>(null)
  const [profilo, setProfilo] = useState<any>(null)
  const [azienda, setAzienda] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Delete account flow
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm1' | 'confirm2'>('idle')
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Export
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    const { data: profilo } = await supabase
      .from('profili')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfilo(profilo)

    if (profilo?.azienda_id) {
      const { data: az } = await supabase
        .from('aziende')
        .select('*')
        .eq('id', profilo.azienda_id)
        .single()
      setAzienda(az)
    }
    setLoading(false)
  }

  // â”€â”€ EXPORT DATI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleExport() {
    setExportLoading(true)
    try {
      const azId = profilo?.azienda_id
      if (!azId) return

      const [commesse, contatti, misure, team] = await Promise.all([
        supabase.from('commesse').select('*').eq('azienda_id', azId),
        supabase.from('contatti').select('*').eq('azienda_id', azId),
        supabase.from('misure').select('*'),
        supabase.from('team').select('id, nome, cognome, ruolo, email, created_at').eq('azienda_id', azId),
      ])

      const exportData = {
        esportato_il: new Date().toISOString(),
        azienda: azienda,
        commesse: commesse.data || [],
        contatti: contatti.data || [],
        misure: misure.data || [],
        team: team.data || [],
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mastro-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    } finally {
      setExportLoading(false)
    }
  }

  // â”€â”€ CANCELLAZIONE ACCOUNT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleDeleteAccount() {
    if (deleteInput !== 'ELIMINA') {
      setDeleteError('Scrivi ELIMINA per confermare')
      return
    }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/mastro/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, azId: profilo?.azienda_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore cancellazione')
      await supabase.auth.signOut()
      router.push('/?deleted=1')
    } catch (e: any) {
      setDeleteError(e.message)
      setDeleteLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F2F1EC] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#D08008] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'account', label: 'Account' },
    { id: 'sicurezza', label: 'Sicurezza' },
    { id: 'dati', label: 'I miei dati' },
    { id: 'azienda', label: 'Azienda' },
  ]

  return (
    <div className="min-h-screen bg-[#F2F1EC]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-[#1A1A1C] mb-8">Impostazioni</h1>

        {/* TAB NAV */}
        <div className="flex gap-1 mb-8 bg-white rounded-lg p-1 border border-gray-200 w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-[#1A1A1C] text-white'
                  : 'text-gray-600 hover:text-[#1A1A1C]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* â”€â”€ TAB: ACCOUNT â”€â”€ */}
        {tab === 'account' && (
          <div className="space-y-6">
            <Card title="Informazioni account">
              <Row label="Email" value={user?.email} />
              <Row label="Nome" value={profilo?.nome || 'â€”'} />
              <Row label="Telefono" value={profilo?.telefono || 'â€”'} />
              <Row label="Membro dal" value={user?.created_at ? new Date(user.created_at).toLocaleDateString('it-IT') : 'â€”'} />
            </Card>

            {/* ZONA PERICOLO */}
            <Card title="Zona pericolosa" danger>
              {deleteStep === 'idle' && (
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    La cancellazione dell'account è <strong>irreversibile</strong>. Tutti i tuoi dati saranno eliminati entro 30 giorni.
                    Prima di procedere ti consigliamo di esportare i tuoi dati dalla sezione <strong>I miei dati</strong>.
                  </p>
                  <button
                    onClick={() => setDeleteStep('confirm1')}
                    className="px-4 py-2 bg-[#DC4444] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Elimina account
                  </button>
                </div>
              )}

              {deleteStep === 'confirm1' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-1">âš ï¸ Stai per eliminare il tuo account</p>
                    <p className="text-sm text-red-700">Questa azione eliminerà permanentemente:</p>
                    <ul className="text-sm text-red-700 mt-2 space-y-1">
                      <li>â€º Tutte le commesse e i cantieri</li>
                      <li>â€º Tutti i contatti e i clienti</li>
                      <li>â€º Tutte le misurazioni e i documenti</li>
                      <li>â€º Il tuo account e le credenziali di accesso</li>
                    </ul>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteStep('confirm2')}
                      className="px-4 py-2 bg-[#DC4444] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Sì, voglio eliminare
                    </button>
                    <button
                      onClick={() => setDeleteStep('idle')}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 'confirm2' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    Scrivi <strong className="font-mono text-[#DC4444]">ELIMINA</strong> per confermare la cancellazione definitiva:
                  </p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={e => { setDeleteInput(e.target.value); setDeleteError('') }}
                    placeholder="ELIMINA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-[#DC4444]"
                  />
                  {deleteError && <p className="text-sm text-[#DC4444]">{deleteError}</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading}
                      className="px-4 py-2 bg-[#DC4444] text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {deleteLoading ? 'Eliminazione...' : 'Elimina definitivamente'}
                    </button>
                    <button
                      onClick={() => { setDeleteStep('idle'); setDeleteInput('') }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* â”€â”€ TAB: SICUREZZA â”€â”€ */}
        {tab === 'sicurezza' && (
          <SecuritySettings />
        )}

        {/* â”€â”€ TAB: I MIEI DATI â”€â”€ */}
        {tab === 'dati' && (
          <div className="space-y-6">
            <Card title="Portabilità dei dati">
              <p className="text-sm text-gray-600 mb-4">
                Hai diritto di ricevere tutti i tuoi dati in formato strutturato (art. 20 GDPR).
                L'export include commesse, contatti, misurazioni e informazioni azienda in formato JSON.
              </p>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="px-4 py-2 bg-[#1A9E73] text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {exportLoading ? 'Esportazione...' : 'â¬‡ Esporta tutti i dati (JSON)'}
              </button>
            </Card>

            <Card title="I tuoi dati personali">
              <p className="text-sm text-gray-600 mb-3">
                Per richiedere la rettifica, la limitazione o la cancellazione di specifici dati personali
                scrivi a <a href="mailto:privacy@mastrosuite.com" className="text-[#D08008]">privacy@mastrosuite.com</a>.
                Risponderemo entro 30 giorni.
              </p>
              <Row label="Titolare trattamento" value="[RAGIONE SOCIALE DA COMPILARE]" />
              <Row label="Privacy Policy" value="" link={{ href: '/privacy', label: 'Leggi â†’' }} />
              <Row label="Termini di Servizio" value="" link={{ href: '/termini', label: 'Leggi â†’' }} />
            </Card>
          </div>
        )}

        {/* â”€â”€ TAB: AZIENDA â”€â”€ */}
        {tab === 'azienda' && (
          <Card title="Informazioni azienda">
            <Row label="Ragione sociale" value={azienda?.ragione_sociale || 'â€”'} />
            <Row label="P.IVA" value={azienda?.piva || 'â€”'} />
            <Row label="Città" value={azienda?.citta || 'â€”'} />
            <Row label="Settori" value={azienda?.settori?.join(', ') || 'â€”'} />
            <Row label="Piano attivo" value={azienda?.piano || 'START'} />
          </Card>
        )}
      </div>
    </div>
  )
}

function Card({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-6 ${danger ? 'border-red-200' : 'border-gray-200'}`}>
      <h2 className={`text-base font-semibold mb-4 ${danger ? 'text-[#DC4444]' : 'text-[#1A1A1C]'}`}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value, link }: { label: string; value: string; link?: { href: string; label: string } }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      {link
        ? <a href={link.href} className="text-sm text-[#D08008] hover:underline">{link.label}</a>
        : <span className="text-sm text-[#1A1A1C] font-medium">{value}</span>
      }
    </div>
  )
}


