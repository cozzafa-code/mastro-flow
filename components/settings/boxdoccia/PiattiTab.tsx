"use client";

import { FornitorePiatto, MATERIALI, COLORI } from "@/lib/boxdoccia/catalogo";

export default function PiattiTab({
  piatti,
  loading,
  onEdit,
  onDelete,
  onToggle,
  onAddNew,
  onImportCSV,
}: {
  piatti: FornitorePiatto[];
  loading: boolean;
  onEdit: (p: FornitorePiatto) => void;
  onDelete: (id: string) => void;
  onToggle: (p: FornitorePiatto) => void;
  onAddNew: () => void;
  onImportCSV: (file: File) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={onAddNew}
          className="flex-1 py-2.5 bg-teal-600 text-white rounded-lg font-bold text-sm"
        >
          + Aggiungi piatto
        </button>
        <label className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-bold text-sm cursor-pointer">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportCSV(f);
            }}
          />
          Import CSV
        </label>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-xs text-amber-900">
        <b>Formato CSV:</b> id,brand,model,mat,col,prezzo_listino,sconto,fornitore_email
        <br />
        <span className="text-amber-700">
          Materiali: effpietra, ceramica, marmoresina, acrilico, resina, stoneulti, mineralm
        </span>
      </div>

      {loading && <div className="text-center py-8 text-slate-500">Caricamento...</div>}

      {!loading && piatti.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">
          Nessun piatto in catalogo. Aggiungine uno o importa un CSV.
        </div>
      )}

      <div className="space-y-2">
        {piatti.map((p) => (
          <div
            key={p.id}
            className={`border rounded-lg p-3 flex items-start gap-3 ${
              p.attivo ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"
            }`}
          >
            <button
              onClick={() => onToggle(p)}
              className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                p.attivo ? "border-teal-600 bg-teal-600" : "border-slate-300"
              }`}
            >
              {p.attivo && <span className="text-white text-xs">✓</span>}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-900">{p.brand}</div>
              <div className="text-xs text-slate-600 truncate">{p.model}</div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                  {MATERIALI.find((m) => m.id === p.mat)?.nome || p.mat}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded">
                  {COLORI.find((c) => c.id === p.col)?.nome || p.col}
                </span>
                {p.prezzo_listino && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-teal-50 text-teal-700 font-bold rounded">
                    € {p.prezzo_listino}
                  </span>
                )}
                {p.sconto && p.sconto > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold rounded">
                    -{p.sconto}%
                  </span>
                )}
                {p.certificato_url && (
                  <a href={p.certificato_url} target="_blank" rel="noreferrer"
                    className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                    Certificato
                  </a>
                )}
                {p.scheda_tecnica_url && (
                  <a href={p.scheda_tecnica_url} target="_blank" rel="noreferrer"
                    className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                    Scheda tec.
                  </a>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onEdit(p)}
                className="text-xs px-2 py-1 text-teal-700 hover:bg-teal-50 rounded font-bold"
              >
                Modifica
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded font-bold"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
