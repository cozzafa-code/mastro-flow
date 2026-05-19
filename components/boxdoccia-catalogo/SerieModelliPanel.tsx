// components/boxdoccia-catalogo/SerieModelliPanel.tsx
'use client';

import { useState } from 'react';
import { useFornitori, useSerie, useModelli } from '@/hooks/useCatalogoBoxDoccia';
import type { Serie, Modello, ConfigurazioneBox, TipoApertura } from '@/lib/types/boxdoccia';
import { CONFIGURAZIONI_LABEL, APERTURE_LABEL } from '@/lib/types/boxdoccia';

const CONFIGURAZIONI = Object.keys(CONFIGURAZIONI_LABEL) as ConfigurazioneBox[];
const APERTURE = Object.keys(APERTURE_LABEL) as TipoApertura[];

export default function SerieModelliPanel() {
  const { items: fornitori } = useFornitori();
  const [fornitoreId, setFornitoreId] = useState<string | null>(null);
  const { items: serie, create: createSerie, update: updateSerie, delete: delSerie } = useSerie(fornitoreId);
  const [serieId, setSerieId] = useState<string | null>(null);
  const { items: modelli, create: createModello, update: updateModello, delete: delModello } = useModelli(serieId);
  const [editingSerie, setEditingSerie] = useState<Partial<Serie> | null>(null);
  const [editingModello, setEditingModello] = useState<Partial<Modello> | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Serie & Modelli</h2>
        <select value={fornitoreId || ''} onChange={e => { setFornitoreId(e.target.value || null); setSerieId(null); }}
          className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
          <option value="">Seleziona fornitore</option>
          {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
      </header>

      {!fornitoreId ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">Seleziona un fornitore per gestire serie e modelli.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-900">Serie</h3>
              <button onClick={() => setEditingSerie({ nome: '', realizzazione: 'STANDARD', spessore_cristallo_mm: [8], altezza_min_cm: 200, attivo: true })}
                className="text-sm bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700">+ Serie</button>
            </div>
            {serie.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Nessuna serie</p>
            ) : (
              <div className="space-y-2">
                {serie.map(s => (
                  <div key={s.id}
                    className={`p-3 rounded-lg border cursor-pointer transition ${serieId === s.id ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                    onClick={() => setSerieId(s.id)}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">{s.nome}</h4>
                        <div className="flex gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                          {s.spessore_cristallo_mm?.map(sp => <span key={sp} className="bg-slate-200 px-2 py-0.5 rounded">{sp}mm</span>)}
                          {s.realizzazione === 'SU_MISURA' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">su misura</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={e => { e.stopPropagation(); setEditingSerie(s); }} className="text-xs text-teal-600 hover:text-teal-700 px-2">edit</button>
                        <button onClick={e => { e.stopPropagation(); if (confirm(`Eliminare serie ${s.nome}?`)) delSerie(s.id); }} className="text-xs text-red-600 hover:text-red-700 px-2">×</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-slate-900">Modelli</h3>
              <button
                onClick={() => serieId && setEditingModello({ nome: '', configurazione: 'NICCHIA', tipo_apertura: 'SCORREVOLE', h_min_cm: 200, h_max_cm: 200, su_misura: false, attivo: true })}
                disabled={!serieId}
                className="text-sm bg-teal-600 text-white px-3 py-1 rounded-lg hover:bg-teal-700 disabled:opacity-50">
                + Modello
              </button>
            </div>
            {!serieId ? (
              <p className="text-sm text-slate-400 py-6 text-center">Seleziona una serie</p>
            ) : modelli.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">Nessun modello</p>
            ) : (
              <div className="space-y-2">
                {modelli.map(m => (
                  <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900">
                          {m.codice_articolo && <span className="font-mono text-teal-600 mr-2">{m.codice_articolo}</span>}
                          {m.nome}
                        </h4>
                        <div className="flex gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="bg-slate-200 px-2 py-0.5 rounded">{CONFIGURAZIONI_LABEL[m.configurazione]}</span>
                          {m.tipo_apertura && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{APERTURE_LABEL[m.tipo_apertura]}</span>}
                          {m.w_min_cm && <span>{m.w_min_cm}-{m.w_max_cm}cm</span>}
                          {m.su_misura && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded">su misura</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingModello(m)} className="text-xs text-teal-600 hover:text-teal-700 px-2">edit</button>
                        <button onClick={() => { if (confirm(`Eliminare modello ${m.nome}?`)) delModello(m.id); }} className="text-xs text-red-600 hover:text-red-700 px-2">×</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {editingSerie && (
        <SerieForm initial={editingSerie} onCancel={() => setEditingSerie(null)}
          onSave={async (d) => { if (editingSerie.id) await updateSerie(editingSerie.id, d); else await createSerie(d); setEditingSerie(null); }} />
      )}
      {editingModello && (
        <ModelloForm initial={editingModello} onCancel={() => setEditingModello(null)}
          onSave={async (d) => { if (editingModello.id) await updateModello(editingModello.id, d); else await createModello(d); setEditingModello(null); }} />
      )}
    </div>
  );
}

function SerieForm({ initial, onSave, onCancel }: { initial: Partial<Serie>; onSave: (d: Partial<Serie>) => void; onCancel: () => void }) {
  const [d, setD] = useState<Partial<Serie>>(initial);
  const SPESS = [4, 5, 6, 8, 10, 12];
  const toggleSp = (n: number) => {
    const arr = d.spessore_cristallo_mm || [];
    setD({ ...d, spessore_cristallo_mm: arr.includes(n) ? arr.filter(x => x !== n) : [...arr, n] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900">{initial.id ? 'Modifica serie' : 'Nuova serie'}</h3>
        <div className="space-y-3">
          <Field label="Nome *">
            <input type="text" value={d.nome || ''} onChange={e => setD({ ...d, nome: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
          </Field>
          <Field label="Descrizione">
            <textarea rows={2} value={d.descrizione || ''} onChange={e => setD({ ...d, descrizione: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500 resize-none" />
          </Field>
          <Field label="Spessori cristallo disponibili">
            <div className="flex flex-wrap gap-2">
              {SPESS.map(s => {
                const active = (d.spessore_cristallo_mm || []).includes(s);
                return <button key={s} type="button" onClick={() => toggleSp(s)}
                  className={`px-3 py-1 rounded-full text-xs ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{s}mm</button>;
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Altezza min (cm)">
              <input type="number" value={d.altezza_min_cm || 200} onChange={e => setD({ ...d, altezza_min_cm: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Altezza max (cm)">
              <input type="number" value={d.altezza_max_cm || 220} onChange={e => setD({ ...d, altezza_max_cm: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Realizzazione">
              <select value={d.realizzazione || 'STANDARD'} onChange={e => setD({ ...d, realizzazione: e.target.value as any })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
                <option value="STANDARD">Standard</option>
                <option value="SU_MISURA">Su misura</option>
                <option value="SOLO_STANDARD">Solo standard</option>
                <option value="MISTO">Misto</option>
              </select>
            </Field>
            <Field label="Tempi consegna (gg)">
              <input type="number" value={d.tempi_consegna_giorni || ''} onChange={e => setD({ ...d, tempi_consegna_giorni: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Annulla</button>
          <button onClick={() => d.nome && onSave(d)} disabled={!d.nome}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">Salva</button>
        </div>
      </div>
    </div>
  );
}

function ModelloForm({ initial, onSave, onCancel }: { initial: Partial<Modello>; onSave: (d: Partial<Modello>) => void; onCancel: () => void }) {
  const [d, setD] = useState<Partial<Modello>>(initial);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900">{initial.id ? 'Modifica modello' : 'Nuovo modello'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Codice articolo">
              <input type="text" value={d.codice_articolo || ''} onChange={e => setD({ ...d, codice_articolo: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500 font-mono" />
            </Field>
            <Field label="Nome *">
              <input type="text" value={d.nome || ''} onChange={e => setD({ ...d, nome: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
          <Field label="Configurazione *">
            <select value={d.configurazione || 'NICCHIA'} onChange={e => setD({ ...d, configurazione: e.target.value as ConfigurazioneBox })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
              {CONFIGURAZIONI.map(c => <option key={c} value={c}>{CONFIGURAZIONI_LABEL[c]}</option>)}
            </select>
          </Field>
          <Field label="Tipo apertura">
            <select value={d.tipo_apertura || ''} onChange={e => setD({ ...d, tipo_apertura: e.target.value ? e.target.value as TipoApertura : null })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
              <option value="">— nessuna —</option>
              {APERTURE.map(a => <option key={a} value={a}>{APERTURE_LABEL[a]}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-4 gap-3">
            <Field label="W min"><input type="number" value={d.w_min_cm || ''} onChange={e => setD({ ...d, w_min_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-300 rounded-lg px-2 py-2 outline-none focus:border-teal-500" /></Field>
            <Field label="W max"><input type="number" value={d.w_max_cm || ''} onChange={e => setD({ ...d, w_max_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-300 rounded-lg px-2 py-2 outline-none focus:border-teal-500" /></Field>
            <Field label="D min"><input type="number" value={d.d_min_cm || ''} onChange={e => setD({ ...d, d_min_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-300 rounded-lg px-2 py-2 outline-none focus:border-teal-500" /></Field>
            <Field label="D max"><input type="number" value={d.d_max_cm || ''} onChange={e => setD({ ...d, d_max_cm: e.target.value ? Number(e.target.value) : null })} className="w-full border border-slate-300 rounded-lg px-2 py-2 outline-none focus:border-teal-500" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Prezzo acquisto">
              <input type="number" step="0.01" value={d.prezzo_acquisto || ''} onChange={e => setD({ ...d, prezzo_acquisto: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Prezzo vendita">
              <input type="number" step="0.01" value={d.prezzo_vendita || ''} onChange={e => setD({ ...d, prezzo_vendita: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Margine %">
              <input type="number" step="0.1" value={d.margine_pct || ''} onChange={e => setD({ ...d, margine_pct: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={!!d.su_misura} onChange={e => setD({ ...d, su_misura: e.target.checked })} />
            Realizzabile su misura
          </label>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Annulla</button>
          <button onClick={() => d.nome && onSave(d)} disabled={!d.nome}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">Salva</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700 mb-1 block">{label}</span>{children}</label>;
}
