// components/boxdoccia-catalogo/CristalliPanel.tsx
'use client';

import { useState } from 'react';
import { useFornitori, useCristalli } from '@/hooks/useCatalogoBoxDoccia';
import type { Cristallo, TipologiaCristallo, MaterialeCristallo } from '@/lib/types/boxdoccia';

const TIPOLOGIE: TipologiaCristallo[] = ['BASE', 'SERIGRAFIA', 'DECORO_ARTISTICO', 'PERSONALIZZATO'];
const MATERIALI: MaterialeCristallo[] = ['VETRO_TEMPERATO', 'VETRO_STRATIFICATO', 'ACRILICO', 'POLICARBONATO'];
const TRATTAMENTI = ['anticalcare', 'easyclean', 'anti_impronta', 'brillbox', 'antibatterico', 'autopulente'];

export default function CristalliPanel() {
  const { items: fornitori } = useFornitori();
  const [fornitoreId, setFornitoreId] = useState<string | null>(null);
  const { items, loading, error, create, update, delete: del } = useCristalli(fornitoreId);
  const [editing, setEditing] = useState<Partial<Cristallo> | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Cristalli</h2>
        <div className="flex gap-3">
          <select value={fornitoreId || ''} onChange={e => setFornitoreId(e.target.value || null)}
            className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
            <option value="">Seleziona fornitore</option>
            {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <button
            onClick={() => fornitoreId && setEditing({ nome: '', tipologia: 'BASE', spessore_mm: 8, materiale: 'VETRO_TEMPERATO', trattamenti: [], attivo: true })}
            disabled={!fornitoreId}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            + Nuovo cristallo
          </button>
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      {!fornitoreId ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">Seleziona un fornitore per gestire i cristalli.</p>
        </div>
      ) : loading && !items.length ? (
        <div className="text-slate-400">Caricamento...</div>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">Nessun cristallo per questo fornitore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  c.tipologia === 'BASE' ? 'bg-slate-100 text-slate-700' :
                  c.tipologia === 'SERIGRAFIA' ? 'bg-blue-50 text-blue-700' :
                  c.tipologia === 'DECORO_ARTISTICO' ? 'bg-purple-50 text-purple-700' :
                  'bg-amber-50 text-amber-700'
                }`}>{c.tipologia.replace(/_/g, ' ').toLowerCase()}</span>
                <span className="text-xs font-bold text-teal-600">{c.spessore_mm}mm</span>
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">{c.nome}</h4>
              <p className="text-xs text-slate-500 mb-2">{c.materiale.replace(/_/g, ' ').toLowerCase()}</p>
              {c.trattamenti && c.trattamenti.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.trattamenti.map(t => <span key={t} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded">{t}</span>)}
                </div>
              )}
              <div className="flex justify-between items-center">
                {c.prezzo_mq ? <span className="text-sm font-medium">€{c.prezzo_mq}/m²</span> : <span />}
                <div className="flex gap-2">
                  <button onClick={() => setEditing(c)} className="text-xs text-teal-600 hover:text-teal-700 font-medium">Modifica</button>
                  <button onClick={() => { if (confirm(`Eliminare ${c.nome}?`)) del(c.id); }} className="text-xs text-red-600 hover:text-red-700">Elimina</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <CristalloForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSave={async (data) => {
            if (editing.id) await update(editing.id, data);
            else await create(data);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CristalloForm({
  initial, onSave, onCancel,
}: {
  initial: Partial<Cristallo>;
  onSave: (data: Partial<Cristallo>) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<Cristallo>>(initial);

  const toggleTratt = (t: string) => {
    const arr = d.trattamenti || [];
    setD({ ...d, trattamenti: arr.includes(t) ? arr.filter(x => x !== t) : [...arr, t] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900">{initial.id ? 'Modifica cristallo' : 'Nuovo cristallo'}</h3>
        <div className="space-y-3">
          <Field label="Nome *">
            <input type="text" value={d.nome || ''} onChange={e => setD({ ...d, nome: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Codice articolo">
              <input type="text" value={d.codice_articolo || ''} onChange={e => setD({ ...d, codice_articolo: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Tipologia">
              <select value={d.tipologia || 'BASE'} onChange={e => setD({ ...d, tipologia: e.target.value as TipologiaCristallo })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
                {TIPOLOGIE.map(t => <option key={t} value={t}>{t.toLowerCase().replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Spessore (mm)">
              <input type="number" value={d.spessore_mm || 8} onChange={e => setD({ ...d, spessore_mm: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Materiale">
              <select value={d.materiale || 'VETRO_TEMPERATO'} onChange={e => setD({ ...d, materiale: e.target.value as MaterialeCristallo })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
                {MATERIALI.map(m => <option key={m} value={m}>{m.toLowerCase().replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Trattamenti (multi)">
            <div className="flex flex-wrap gap-2">
              {TRATTAMENTI.map(t => {
                const active = (d.trattamenti || []).includes(t);
                return (
                  <button key={t} type="button" onClick={() => toggleTratt(t)}
                    className={`px-3 py-1 rounded-full text-xs ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {t.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Altezza max (cm)">
              <input type="number" value={d.altezza_max_cm || ''} onChange={e => setD({ ...d, altezza_max_cm: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Larghezza max (cm)">
              <input type="number" value={d.larghezza_max_cm || ''} onChange={e => setD({ ...d, larghezza_max_cm: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
          <Field label="Prezzo €/m²">
            <input type="number" step="0.01" value={d.prezzo_mq || ''} onChange={e => setD({ ...d, prezzo_mq: e.target.value ? Number(e.target.value) : null })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
          </Field>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Annulla</button>
          <button onClick={() => d.nome && onSave(d)} disabled={!d.nome}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50">
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700 mb-1 block">{label}</span>{children}</label>;
}
