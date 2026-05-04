// components/boxdoccia-catalogo/FinituriPanel.tsx
'use client';

import { useState } from 'react';
import { useFornitori, useFiniture } from '@/hooks/useCatalogoBoxDoccia';
import type { Finitura, CategoriaFinitura } from '@/lib/types/boxdoccia';

const CATEGORIE: CategoriaFinitura[] = ['STANDARD', 'ANODIZZATO', 'LACCATO', 'ACCIAIO', 'VERNICIATO', 'PERSONALIZZATO'];

export default function FinituriPanel() {
  const { items: fornitori } = useFornitori();
  const [fornitoreId, setFornitoreId] = useState<string | null>(null);
  const { items, loading, error, create, update, delete: del } = useFiniture(fornitoreId);
  const [editing, setEditing] = useState<Partial<Finitura> | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-slate-900">Finiture profili</h2>
        <div className="flex gap-3 items-center">
          <select
            value={fornitoreId || ''}
            onChange={e => setFornitoreId(e.target.value || null)}
            className="border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500"
          >
            <option value="">Seleziona fornitore</option>
            {fornitori.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <button
            onClick={() => fornitoreId && setEditing({ nome: '', categoria: 'STANDARD', prezzo_supplemento: 0, attivo: true })}
            disabled={!fornitoreId}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            + Nuova finitura
          </button>
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>}
      {!fornitoreId ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500">Seleziona un fornitore per gestire le finiture.</p>
        </div>
      ) : loading && !items.length ? (
        <div className="text-slate-400">Caricamento...</div>
      ) : items.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500 mb-2">Nessuna finitura per questo fornitore.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map(f => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-xl p-3 group hover:shadow-md transition">
              <div
                className="w-full aspect-square rounded-lg mb-2 border-2 border-white shadow-inner"
                style={{ backgroundColor: f.hex_color || '#999' }}
              />
              <h4 className="font-medium text-sm text-slate-900 truncate">{f.nome}</h4>
              <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                <span>{f.ral || f.categoria}</span>
                {f.prezzo_supplemento > 0 && <span className="text-amber-600 font-medium">+€{f.prezzo_supplemento}</span>}
              </div>
              <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => setEditing(f)} className="text-xs flex-1 bg-teal-50 text-teal-700 py-1 rounded hover:bg-teal-100">Modifica</button>
                <button onClick={() => { if (confirm(`Eliminare ${f.nome}?`)) del(f.id); }} className="text-xs flex-1 bg-red-50 text-red-700 py-1 rounded hover:bg-red-100">Elimina</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FinituraForm
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

function FinituraForm({
  initial, onSave, onCancel,
}: {
  initial: Partial<Finitura>;
  onSave: (data: Partial<Finitura>) => void;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Partial<Finitura>>(initial);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900">{initial.id ? 'Modifica finitura' : 'Nuova finitura'}</h3>
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
            <Field label="Categoria">
              <select value={d.categoria || 'STANDARD'} onChange={e => setD({ ...d, categoria: e.target.value as CategoriaFinitura })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500">
                {CATEGORIE.map(c => <option key={c} value={c}>{c.toLowerCase()}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="RAL">
              <input type="text" value={d.ral || ''} onChange={e => setD({ ...d, ral: e.target.value })}
                placeholder="es. RAL 9005"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
            </Field>
            <Field label="Colore HEX">
              <div className="flex gap-2">
                <input type="color" value={d.hex_color || '#999999'} onChange={e => setD({ ...d, hex_color: e.target.value })}
                  className="w-12 h-10 border border-slate-300 rounded-lg cursor-pointer" />
                <input type="text" value={d.hex_color || ''} onChange={e => setD({ ...d, hex_color: e.target.value })}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-teal-500" />
              </div>
            </Field>
          </div>
          <Field label="Supplemento (€)">
            <input type="number" step="0.01" value={d.prezzo_supplemento || 0} onChange={e => setD({ ...d, prezzo_supplemento: Number(e.target.value) })}
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
