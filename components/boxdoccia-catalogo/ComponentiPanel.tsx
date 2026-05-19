// components/boxdoccia-catalogo/ComponentiPanel.tsx
'use client';

import { useState } from 'react';
import { useFornitori, useComponenti } from '@/hooks/useCatalogoBoxDoccia';
import type { Componente, CategoriaComponente } from '@/lib/types/boxdoccia';
import { CATEGORIE_COMPONENTE_LABEL } from '@/lib/types/boxdoccia';

const CATEGORIE: CategoriaComponente[] = Object.keys(CATEGORIE_COMPONENTE_LABEL) as CategoriaComponente[];
const SPESSORI = [4, 5, 6, 8, 10, 12];
const APERTURE_C = ['battente', 'scorrevole', 'saloon', 'soffietto', 'pivot', 'pieghevole'];
const MATERIALI_C = ['vetro', 'alluminio', 'acciaio_inox'];

export default function ComponentiPanel() {
  const { items: fornitori } = useFornitori();
  const [fornitoreId, setFornitoreId] = useState<string | null>(null);
  const [filtroCat, setFiltroCat] = useState<CategoriaComponente | ''>('');
  const { items, loading, error, create, update, delete: del } = useComponenti(fornitoreId);
  const [editing, setEditing] = useState<Partial<Componente> | null>(null);

  const filtered = filtroCat ? items.filter(c => c.categoria === filtroCat) : items;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Componenti & Ricambi</h2>
        <div className="flex gap-3 flex-wrap">
          <select value={fornitoreId || ''} onChange={e => setFornitoreId(e.target.value || null)}
            className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
            <option value="">Tutti i fornitori</option>
            {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <select value={filtroCat} onChange={e => setFiltroCat(e.target.value as CategoriaComponente | '')}
            className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
            <option value="">Tutte le categorie</option>
            {CATEGORIE.map(c => <option key={c} value={c}>{CATEGORIE_COMPONENTE_LABEL[c]}</option>)}
          </select>
          <button
            onClick={() => setEditing({ nome: '', categoria: 'GUARNIZIONE_VERTICALE', spessore_vetro_compatibile_mm: [], tipo_apertura_compatibile: [], materiale_compatibile: [], attivo: true })}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700"
          >
            + Nuovo componente
          </button>
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      {loading && !items.length ? (
        <div className="text-slate-400">Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">Nessun componente {filtroCat ? `nella categoria ${CATEGORIE_COMPONENTE_LABEL[filtroCat]}` : 'in catalogo'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700 font-medium">
                  {CATEGORIE_COMPONENTE_LABEL[c.categoria]}
                </span>
                {c.codice_articolo && <span className="text-xs text-slate-400 font-mono">{c.codice_articolo}</span>}
              </div>
              <h4 className="font-semibold text-slate-900 mb-1">{c.nome}</h4>
              <div className="text-xs text-slate-500 space-y-0.5 mb-3">
                {c.spessore_vetro_compatibile_mm && c.spessore_vetro_compatibile_mm.length > 0 && (
                  <div>Vetri: {c.spessore_vetro_compatibile_mm.join('/')}mm</div>
                )}
                {c.tipo_apertura_compatibile && c.tipo_apertura_compatibile.length > 0 && (
                  <div>Apertura: {c.tipo_apertura_compatibile.join(', ')}</div>
                )}
                {c.colore && <div>Colore: {c.colore}</div>}
                {c.diametro_mm && <div>Ø {c.diametro_mm}mm</div>}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                {c.prezzo_vendita ? <span className="text-sm font-medium">€{c.prezzo_vendita}</span> : <span />}
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
        <ComponenteForm
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

function ComponenteForm({
  initial, onSave, onCancel,
}: {
  initial: Partial<Componente>;
  onSave: (data: Partial<Componente>) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<Componente>>(initial);

  const toggleSpess = (n: number) => {
    const arr = d.spessore_vetro_compatibile_mm || [];
    setD({ ...d, spessore_vetro_compatibile_mm: arr.includes(n) ? arr.filter(x => x !== n) : [...arr, n] });
  };
  const toggleApert = (s: string) => {
    const arr = d.tipo_apertura_compatibile || [];
    setD({ ...d, tipo_apertura_compatibile: arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s] });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900">{initial.id ? 'Modifica componente' : 'Nuovo componente'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nome *">
              <input type="text" value={d.nome || ''} onChange={e => setD({ ...d, nome: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Codice articolo">
              <input type="text" value={d.codice_articolo || ''} onChange={e => setD({ ...d, codice_articolo: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
          <Field label="Categoria *">
            <select value={d.categoria || 'GUARNIZIONE_VERTICALE'} onChange={e => setD({ ...d, categoria: e.target.value as CategoriaComponente })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
              {CATEGORIE.map(c => <option key={c} value={c}>{CATEGORIE_COMPONENTE_LABEL[c]}</option>)}
            </select>
          </Field>

          <Field label="Spessori vetro compatibili (mm)">
            <div className="flex flex-wrap gap-2">
              {SPESSORI.map(s => {
                const active = (d.spessore_vetro_compatibile_mm || []).includes(s);
                return (
                  <button key={s} type="button" onClick={() => toggleSpess(s)}
                    className={`px-3 py-1 rounded-full text-xs ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {s}mm
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Tipo apertura compatibile">
            <div className="flex flex-wrap gap-2">
              {APERTURE_C.map(a => {
                const active = (d.tipo_apertura_compatibile || []).includes(a);
                return (
                  <button key={a} type="button" onClick={() => toggleApert(a)}
                    className={`px-3 py-1 rounded-full text-xs ${active ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                    {a}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Diametro (mm)">
              <input type="number" step="0.1" value={d.diametro_mm || ''} onChange={e => setD({ ...d, diametro_mm: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Spessore (mm)">
              <input type="number" step="0.1" value={d.spessore_mm || ''} onChange={e => setD({ ...d, spessore_mm: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Lunghezza (mm)">
              <input type="number" step="0.1" value={d.lunghezza_mm || ''} onChange={e => setD({ ...d, lunghezza_mm: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Colore">
              <input type="text" value={d.colore || ''} onChange={e => setD({ ...d, colore: e.target.value })}
                placeholder="trasparente, bianco..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Materiale costruzione">
              <input type="text" value={d.materiale_costruzione || ''} onChange={e => setD({ ...d, materiale_costruzione: e.target.value })}
                placeholder="pvc, acciaio_inox..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Prezzo acquisto (€)">
              <input type="number" step="0.01" value={d.prezzo_acquisto || ''} onChange={e => setD({ ...d, prezzo_acquisto: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Prezzo vendita (€)">
              <input type="number" step="0.01" value={d.prezzo_vendita || ''} onChange={e => setD({ ...d, prezzo_vendita: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
          </div>
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
