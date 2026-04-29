// components/settings-mobile/mastro-win/CrudCremonesi.tsx
// Tab CREMONESI: lista filtrata + form add/edit + delete su ferramenta_cremonesi.

'use client';

import { useState, useMemo } from 'react';
import type { FerramentaCremonese } from '@/lib/types/mastro-win';

interface Props {
  cremonesi: FerramentaCremonese[];
  loading: boolean;
  onSave: (c: Partial<FerramentaCremonese>) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const TIPI_CREM = [
  { v: 'anta', l: 'Anta' },
  { v: 'anta_ribalta', l: 'Anta-ribalta' },
  { v: 'porta', l: 'Porta' },
  { v: 'universale', l: 'Universale' },
];

export default function CrudCremonesi({ cremonesi, loading, onSave, onDelete }: Props) {
  const [filtro, setFiltro] = useState('');
  const [editing, setEditing] = useState<Partial<FerramentaCremonese> | null>(null);

  const filtrati = useMemo(() => {
    const f = filtro.toLowerCase().trim();
    if (!f) return cremonesi;
    return cremonesi.filter(
      (c) =>
        c.codice.toLowerCase().includes(f) ||
        c.fornitore.toLowerCase().includes(f) ||
        c.sistema.toLowerCase().includes(f) ||
        c.tipo.toLowerCase().includes(f)
    );
  }, [cremonesi, filtro]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        <input
          placeholder="Cerca codice / fornitore / sistema..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="flex-1 px-3 py-2 rounded-md text-sm"
          style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
        />
        <button
          onClick={() =>
            setEditing({
              fornitore: '',
              sistema: '',
              tipo: 'anta_ribalta',
              codice: '',
              hbb_da: 0,
              hbb_a: 0,
              altezza_maniglia: 1000,
              n_chiusure_centrali: 0,
            })
          }
          className="px-4 py-2 rounded-md font-bold text-sm"
          style={{
            background: '#28A0A0',
            color: '#0D1F1F',
            boxShadow: '0 3px 0 0 #1F7575',
          }}
        >
          + NEW
        </button>
      </div>

      {loading && <div className="text-center opacity-60 py-8">Caricamento...</div>}

      <div className="space-y-2">
        {filtrati.map((c) => (
          <div
            key={c.id}
            onClick={() => setEditing(c)}
            className="rounded-lg p-3 cursor-pointer"
            style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold">{c.codice}</div>
                <div className="text-[10px] opacity-50 mt-1">
                  {c.fornitore} · {c.sistema} · {c.tipo}
                </div>
              </div>
              <div className="text-right ml-2 font-mono">
                <div className="text-xs">
                  HBB {c.hbb_da}–{c.hbb_a}
                </div>
                <div className="text-[10px] opacity-60">
                  h.man {c.altezza_maniglia}mm
                </div>
              </div>
            </div>
            {(c.n_chiusure_centrali || c.passo_chiusure) && (
              <div className="text-[10px] opacity-50 mt-1 font-mono">
                {c.n_chiusure_centrali ?? 0} chiusure
                {c.passo_chiusure ? ` · passo ${c.passo_chiusure}mm` : ''}
                {c.con_bilanciere ? ' · bilanciere' : ''}
                {c.con_scrocco_porta ? ' · scrocco' : ''}
              </div>
            )}
          </div>
        ))}
        {filtrati.length === 0 && !loading && (
          <div className="text-center opacity-60 py-8 text-sm">Nessuna cremonese.</div>
        )}
      </div>

      {editing && (
        <CremoneseForm
          c={editing}
          onClose={() => setEditing(null)}
          onSave={async (c) => {
            const r = await onSave(c);
            if (r.ok) setEditing(null);
            else alert(r.error);
          }}
          onDelete={
            editing.id
              ? async () => {
                  if (!confirm('Eliminare questa cremonese?')) return;
                  const r = await onDelete(editing.id!);
                  if (r.ok) setEditing(null);
                  else alert(r.error);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function CremoneseForm({
  c,
  onClose,
  onSave,
  onDelete,
}: {
  c: Partial<FerramentaCremonese>;
  onClose: () => void;
  onSave: (c: Partial<FerramentaCremonese>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Partial<FerramentaCremonese>>(c);
  const set = <K extends keyof FerramentaCremonese>(
    k: K,
    v: FerramentaCremonese[K]
  ) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2"
      style={{ background: 'rgba(13,31,31,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl max-h-[92vh] overflow-y-auto"
        style={{ background: '#EEF8F8' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-3 flex justify-between items-center border-b"
          style={{ background: '#0D1F1F', color: '#EEF8F8', borderColor: '#28A0A0' }}
        >
          <div className="font-bold">
            {c.id ? 'MODIFICA CREMONESE' : 'NUOVA CREMONESE'}
          </div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#28A0A0' }}>
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Fornitore" v={f.fornitore} on={(x) => set('fornitore', x)} />
            <Field label="Sistema" v={f.sistema} on={(x) => set('sistema', x)} />
          </div>
          <Sel
            label="Tipo"
            v={f.tipo ?? 'anta_ribalta'}
            on={(x) => set('tipo', x)}
            opts={TIPI_CREM}
          />
          <Field label="Codice" v={f.codice} on={(x) => set('codice', x)} />

          <div className="grid grid-cols-2 gap-2">
            <Num label="HBB da (mm)" v={f.hbb_da} on={(x) => set('hbb_da', x ?? 0)} />
            <Num label="HBB a (mm)" v={f.hbb_a} on={(x) => set('hbb_a', x ?? 0)} />
          </div>
          <Num
            label="Altezza maniglia (mm)"
            v={f.altezza_maniglia}
            on={(x) => set('altezza_maniglia', x ?? 0)}
          />

          <div className="grid grid-cols-2 gap-2">
            <Num
              label="N° chiusure centrali"
              v={f.n_chiusure_centrali}
              on={(x) => set('n_chiusure_centrali', x)}
            />
            <Num
              label="Passo chiusure (mm)"
              v={f.passo_chiusure}
              on={(x) => set('passo_chiusure', x)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.con_bilanciere ?? false}
              onChange={(e) => set('con_bilanciere', e.target.checked)}
            />
            Con bilanciere
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.con_scrocco_porta ?? false}
              onChange={(e) => set('con_scrocco_porta', e.target.checked)}
            />
            Con scrocco porta
          </label>

          <Field
            label="Note"
            v={f.note ?? ''}
            on={(x) => set('note', x)}
          />
        </div>

        <div className="p-4 flex gap-2 border-t" style={{ borderColor: '#C8E4E4' }}>
          {onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-2 rounded font-bold text-sm"
              style={{ background: '#FFEBEB', color: '#D14545' }}
            >
              ELIMINA
            </button>
          )}
          <button
            onClick={() => onSave(f)}
            className="flex-1 py-2 rounded font-bold text-sm"
            style={{
              background: '#28A0A0',
              color: '#0D1F1F',
              boxShadow: '0 3px 0 0 #1F7575',
            }}
          >
            SALVA
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- helpers ----------
function Field({
  label,
  v,
  on,
}: {
  label: string;
  v: string | null | undefined;
  on: (x: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-wider opacity-60 mb-1">{label}</div>
      <input
        type="text"
        value={v ?? ''}
        onChange={(e) => on(e.target.value)}
        className="w-full px-2 py-2 rounded text-sm"
        style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
      />
    </label>
  );
}
function Num({
  label,
  v,
  on,
}: {
  label: string;
  v: number | null | undefined;
  on: (x: number | null) => void;
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-wider opacity-60 mb-1">{label}</div>
      <input
        type="number"
        inputMode="numeric"
        value={v ?? ''}
        onChange={(e) => on(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full px-2 py-2 rounded text-sm font-mono"
        style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
      />
    </label>
  );
}
function Sel({
  label,
  v,
  on,
  opts,
}: {
  label: string;
  v: string;
  on: (x: string) => void;
  opts: { v: string; l: string }[];
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-wider opacity-60 mb-1">{label}</div>
      <select
        value={v}
        onChange={(e) => on(e.target.value)}
        className="w-full px-2 py-2 rounded text-sm"
        style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
      >
        {opts.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}
