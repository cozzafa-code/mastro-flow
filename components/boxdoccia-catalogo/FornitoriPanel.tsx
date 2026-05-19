// components/boxdoccia-catalogo/FornitoriPanel.tsx
'use client';

import { useState } from 'react';
import { useFornitori } from '@/hooks/useCatalogoBoxDoccia';
import type { Fornitore } from '@/lib/types/boxdoccia';

export default function FornitoriPanel() {
  const { items, loading, error, create, update, delete: del, toggleAttivo } = useFornitori();
  const [editing, setEditing] = useState<Partial<Fornitore> | null>(null);

  if (loading && !items.length) return <div className="p-6 text-slate-400">Caricamento...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Fornitori Box Doccia</h2>
        <button
          onClick={() => setEditing({ nome: '', attivo: true })}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700"
        >
          + Nuovo fornitore
        </button>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      {items.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-12 text-center">
          <p className="text-slate-500 mb-4">Nessun fornitore in catalogo.</p>
          <p className="text-sm text-slate-400">Aggiungi il tuo primo fornitore per iniziare.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map(f => (
            <div key={f.id} className={`bg-white border rounded-xl p-4 flex items-center gap-4 ${f.attivo ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
              {f.logo_url ? (
                <img src={f.logo_url} alt={f.nome} className="w-14 h-14 object-contain rounded-lg bg-slate-50" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xl">
                  {f.nome[0]}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">{f.nome}</h3>
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  {f.sito_web && <span>{f.sito_web}</span>}
                  {f.contatto_email && <span>{f.contatto_email}</span>}
                  {f.contatto_telefono && <span>{f.contatto_telefono}</span>}
                </div>
              </div>
              <button
                onClick={() => toggleAttivo(f.id, !f.attivo)}
                className={`text-xs px-3 py-1 rounded-full ${f.attivo ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}
              >
                {f.attivo ? 'Attivo' : 'Disattivato'}
              </button>
              <button onClick={() => setEditing(f)} className="text-teal-600 hover:text-teal-700 px-3 py-1 text-sm font-medium">Modifica</button>
              <button onClick={() => { if (confirm(`Eliminare ${f.nome}? Verranno cancellate anche serie e modelli associati.`)) del(f.id); }} className="text-red-600 hover:text-red-700 px-3 py-1 text-sm">Elimina</button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <FornitoreForm
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

function FornitoreForm({
  initial, onSave, onCancel,
}: {
  initial: Partial<Fornitore>;
  onSave: (data: Partial<Fornitore>) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<Partial<Fornitore>>(initial);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900">{initial.id ? 'Modifica fornitore' : 'Nuovo fornitore'}</h3>
        <div className="space-y-3">
          <Field label="Nome *">
            <input
              type="text"
              value={data.nome || ''}
              onChange={e => setData({ ...data, nome: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </Field>
          <Field label="Sito web">
            <input
              type="url"
              value={data.sito_web || ''}
              onChange={e => setData({ ...data, sito_web: e.target.value })}
              placeholder="https://..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                value={data.contatto_email || ''}
                onChange={e => setData({ ...data, contatto_email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              />
            </Field>
            <Field label="Telefono">
              <input
                type="tel"
                value={data.contatto_telefono || ''}
                onChange={e => setData({ ...data, contatto_telefono: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
              />
            </Field>
          </div>
          <Field label="Logo URL">
            <input
              type="url"
              value={data.logo_url || ''}
              onChange={e => setData({ ...data, logo_url: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none"
            />
          </Field>
          <Field label="Note">
            <textarea
              rows={2}
              value={data.note || ''}
              onChange={e => setData({ ...data, note: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none resize-none"
            />
          </Field>
        </div>
        <div className="flex gap-2 justify-end mt-6">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Annulla</button>
          <button
            onClick={() => data.nome && onSave(data)}
            disabled={!data.nome}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            Salva
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
