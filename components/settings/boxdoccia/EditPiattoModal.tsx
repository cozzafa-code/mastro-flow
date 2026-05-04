"use client";

import { useState } from "react";
import { FornitorePiatto, MATERIALI, COLORI } from "@/lib/boxdoccia/catalogo";

export default function EditPiattoModal({
  piatto,
  onSave,
  onCancel,
}: {
  piatto: FornitorePiatto;
  onSave: (p: FornitorePiatto) => void;
  onCancel: () => void;
}) {
  const [p, setP] = useState(piatto);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full md:w-[560px] max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="font-bold text-slate-900">
            {piatto.id ? "Modifica piatto" : "Nuovo piatto"}
          </div>
          <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <Field label="Marca">
            <input
              value={p.brand}
              onChange={(e) => setP({ ...p, brand: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Es. Kaldewei"
            />
          </Field>
          <Field label="Modello">
            <input
              value={p.model}
              onChange={(e) => setP({ ...p, model: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Es. SuperPlan Plus - acciaio smaltato"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Materiale">
              <select
                value={p.mat}
                onChange={(e) => setP({ ...p, mat: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {MATERIALI.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </Field>
            <Field label="Colore default">
              <select
                value={p.col}
                onChange={(e) => setP({ ...p, col: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {COLORI.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prezzo listino (€/m²)">
              <input
                type="number"
                value={p.prezzo_listino || ""}
                onChange={(e) => setP({ ...p, prezzo_listino: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="280"
              />
            </Field>
            <Field label="Sconto fornitore (%)">
              <input
                type="number"
                value={p.sconto || ""}
                onChange={(e) => setP({ ...p, sconto: parseFloat(e.target.value) || undefined })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="40"
              />
            </Field>
          </div>
          <Field label="URL certificato">
            <input
              value={p.certificato_url || ""}
              onChange={(e) => setP({ ...p, certificato_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="https://..."
            />
          </Field>
          <Field label="URL scheda tecnica">
            <input
              value={p.scheda_tecnica_url || ""}
              onChange={(e) => setP({ ...p, scheda_tecnica_url: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email fornitore">
              <input
                value={p.fornitore_email || ""}
                onChange={(e) => setP({ ...p, fornitore_email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="ordini@..."
              />
            </Field>
            <Field label="Telefono fornitore">
              <input
                value={p.fornitore_tel || ""}
                onChange={(e) => setP({ ...p, fornitore_tel: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder="+39..."
              />
            </Field>
          </div>
          <Field label="Note interne">
            <textarea
              value={p.note || ""}
              onChange={(e) => setP({ ...p, note: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm h-20 resize-none"
              placeholder="Tempi consegna, note tecniche..."
            />
          </Field>
        </div>
        <div className="px-4 py-3 border-t border-slate-200 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold text-sm text-slate-700"
          >
            Annulla
          </button>
          <button
            onClick={() => {
              if (!p.brand || !p.model) { alert("Marca e modello obbligatori"); return; }
              onSave(p);
            }}
            className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg font-bold text-sm"
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
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
