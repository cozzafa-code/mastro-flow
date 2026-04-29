// components/SezioneModelloTenda.tsx
// Sezione "Modello e Prezzo" che appare nel VanoDetailPanel quando il vano e' di settore tende.
// Permette: (1) scegliere modello dal catalogo aziendale, (2) scegliere accessori, (3) vedere prezzo live.

'use client'

import React, { useMemo, useEffect, useRef } from 'react'
import { useCatalogoTendaggi, modelliPerTipoMastro, accessoriPerModello, calcolaPrezzoTenda, type CatalogoTendaItem, type AccessorioTenda } from '@/hooks/useCatalogoTendaggi'

type Vano = {
  id: string
  tipo: string
  misure?: { lCentro?: number; hCentro?: number; sporgenza?: number }
  tendaModelloId?: string
  tendaAccessori?: Array<{ id: string; quantita?: number }>
  tendaColore?: string
  prezzoTendaCalcolato?: number
}

type Props = {
  vano: Vano
  onUpdate: (patch: Partial<Vano>) => void
  T: any
  ICO: any
  I: any
}

export default function SezioneModelloTenda({ vano, onUpdate, T, ICO, I }: Props) {
  const { catalogo, accessori, loading } = useCatalogoTendaggi()
  const m = vano.misure || {}
  const lMm = m.lCentro || 0
  const hMm = m.hCentro || 0
  const sMm = m.sporgenza || 0

  const modelliCompat = useMemo(() => modelliPerTipoMastro(catalogo, vano.tipo), [catalogo, vano.tipo])
  const modelloAttivo = useMemo(() => catalogo.find(c => c.id === vano.tendaModelloId), [catalogo, vano.tendaModelloId])
  const accessoriCompat = useMemo(() => modelloAttivo ? accessoriPerModello(accessori, modelloAttivo.tipo_modello) : [], [accessori, modelloAttivo])
  const accessoriScelti = vano.tendaAccessori || []

  const prezzo = useMemo(() => calcolaPrezzoTenda(modelloAttivo, lMm, hMm, sMm, accessoriScelti, accessori), [modelloAttivo, lMm, hMm, sMm, accessoriScelti, accessori])

  // Sync prezzo calcolato in v.prezzoTendaCalcolato ogni volta che cambia (per calcolaVanoPrezzo a livello commessa)
  const lastSavedPrice = useRef<number | null>(null)
  useEffect(() => {
    if (prezzo.totale !== lastSavedPrice.current && prezzo.totale !== (vano.prezzoTendaCalcolato || 0)) {
      lastSavedPrice.current = prezzo.totale
      onUpdate({ prezzoTendaCalcolato: prezzo.totale })
    }
  }, [prezzo.totale])

  // Avviso fuori range
  const fuoriRange = modelloAttivo ? (
    (modelloAttivo.l_min_mm && lMm > 0 && lMm < modelloAttivo.l_min_mm) ||
    (modelloAttivo.l_max_mm && lMm > modelloAttivo.l_max_mm) ||
    (modelloAttivo.h_min_mm && hMm > 0 && hMm < modelloAttivo.h_min_mm) ||
    (modelloAttivo.h_max_mm && hMm > modelloAttivo.h_max_mm)
  ) : false

  const toggleAccessorio = (accId: string) => {
    const exists = accessoriScelti.find(a => a.id === accId)
    const nuovi = exists ? accessoriScelti.filter(a => a.id !== accId) : [...accessoriScelti, { id: accId, quantita: 1 }]
    onUpdate({ tendaAccessori: nuovi })
  }

  const setModello = (modId: string) => {
    const mod = catalogo.find(c => c.id === modId)
    onUpdate({
      tendaModelloId: modId,
      tendaColore: mod?.colore_default || vano.tendaColore,
      // Reset accessori per evitare incompatibilita
      tendaAccessori: [],
    })
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ padding: "10px 14px", borderRadius: 10, background: "#28A0A010", border: "1px solid #28A0A030", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#28A0A0" }}>MODELLO E PREZZO</div>
        <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>Scegli dal tuo catalogo aziendale, poi accessori. Prezzo automatico.</div>
      </div>

      {loading && <div style={{ padding: 12, fontSize: 12, color: T.sub }}>Caricamento catalogo…</div>}

      {!loading && modelliCompat.length === 0 && (
        <div style={{ padding: 14, borderRadius: 10, background: "#FEF2F2", border: "1px solid #FECACA", fontSize: 12, color: "#991B1B" }}>
          Nessun modello compatibile per questa tipologia nel tuo catalogo. Vai in <b>Impostazioni → Catalogo Tendaggi</b> e aggiungi i modelli che vendi.
        </div>
      )}

      {!loading && modelliCompat.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#28A0A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Modello</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginBottom: 14 }}>
            {modelliCompat.map(mod => (
              <button key={mod.id} onClick={() => setModello(mod.id)} style={{
                padding: "10px 12px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                border: vano.tendaModelloId === mod.id ? `2px solid #28A0A0` : `1px solid ${T.bdr}`,
                background: vano.tendaModelloId === mod.id ? "#28A0A010" : T.card,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{mod.fornitore} · {mod.modello}</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>
                  {mod.colore_default || ""}{mod.colore_default ? " · " : ""}
                  {mod.l_min_mm && mod.l_max_mm ? `L ${mod.l_min_mm}-${mod.l_max_mm}mm` : ""}
                  {mod.h_min_mm && mod.h_max_mm ? ` · H ${mod.h_min_mm}-${mod.h_max_mm}mm` : ""}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#28A0A0", marginTop: 4 }}>
                  €{mod.prezzo_base_eur || "—"}/{mod.unita_prezzo || "mq"}
                  {mod.minimo_mq ? ` · min ${mod.minimo_mq}m²` : ""}
                </div>
              </button>
            ))}
          </div>

          {modelloAttivo && (
            <>
              {fuoriRange && (
                <div style={{ padding: 10, borderRadius: 8, background: "#FEF3C7", border: "1px solid #FCD34D", fontSize: 11, color: "#92400E", marginBottom: 12 }}>
                  ⚠ Misure inserite fuori dai limiti del modello ({modelloAttivo.l_min_mm}-{modelloAttivo.l_max_mm} × {modelloAttivo.h_min_mm}-{modelloAttivo.h_max_mm} mm). Verifica con fornitore.
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: 800, color: "#28A0A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 12 }}>Colore tenda</div>
              <input value={vano.tendaColore || ""} onChange={e => onUpdate({ tendaColore: e.target.value })}
                placeholder="Es. RAL 7016 Antracite"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${T.bdr}`, fontSize: 13, background: T.card, color: T.text, boxSizing: "border-box", marginBottom: 14 }} />

              {accessoriCompat.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#28A0A0", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Accessori e Optional</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6, marginBottom: 14 }}>
                    {accessoriCompat.map(acc => {
                      const sel = !!accessoriScelti.find(a => a.id === acc.id)
                      return (
                        <button key={acc.id} onClick={() => toggleAccessorio(acc.id)} style={{
                          padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left",
                          border: sel ? `2px solid #28A0A0` : `1px solid ${T.bdr}`,
                          background: sel ? "#28A0A010" : T.card,
                        }}>
                          <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${sel ? '#28A0A0' : T.bdr}`, background: sel ? '#28A0A0' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <span style={{ color: '#FFF', fontSize: 13, fontWeight: 800 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{acc.nome}</div>
                            <div style={{ fontSize: 10, color: T.sub }}>{acc.fornitore || ""} · {acc.categoria}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#28A0A0", whiteSpace: "nowrap" }}>
                            €{acc.prezzo_unitario || 0}/{acc.unita}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              <div style={{ padding: 14, borderRadius: 12, background: "#28A0A010", border: "2px solid #28A0A0", marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#28A0A0", fontWeight: 800, marginBottom: 8 }}>RIEPILOGO PREZZO</div>
                {prezzo.dettaglio.map((d, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.text, marginBottom: 4 }}>
                    <span>{d.voce}</span>
                    <span style={{ fontWeight: 600 }}>€ {d.importo.toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #28A0A040", paddingTop: 8, marginTop: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>TOTALE</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#28A0A0" }}>€ {prezzo.totale.toFixed(2)}</span>
                </div>
                {(lMm <= 0 || hMm <= 0) && (
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 6, fontStyle: "italic" }}>Inserisci prima le misure per calcolare il prezzo</div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
