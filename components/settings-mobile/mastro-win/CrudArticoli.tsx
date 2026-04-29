// components/settings-mobile/mastro-win/CrudArticoli.tsx
// Tab ARTICOLI: lista filtrata + form add/edit + delete su ferramenta_articoli.

'use client';

import { useState, useMemo } from 'react';
import type { FerramentaArticolo } from '@/lib/types/mastro-win';
import { CATEGORIE_LABEL } from '@/lib/types/mastro-win';

interface Props {
  articoli: FerramentaArticolo[];
  loading: boolean;
  onSave: (a: Partial<FerramentaArticolo>) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

const CATEGORIE = Object.keys(CATEGORIE_LABEL);

export default function CrudArticoli({ articoli, loading, onSave, onDelete }: Props) {
  const [filtro, setFiltro] = useState('');
  const [editing, setEditing] = useState<Partial<FerramentaArticolo> | null>(null);

  const filtrati = useMemo(() => {
    const f = filtro.toLowerCase().trim();
    if (!f) return articoli;
    return articoli.filter(
      (a) =>
        a.codice.toLowerCase().includes(f) ||
        a.nome.toLowerCase().includes(f) ||
        a.fornitore.toLowerCase().includes(f) ||
        a.categoria.toLowerCase().includes(f)
    );
  }, [articoli, filtro]);

  return (
    <div className="p-4 space-y-3">
      {/* FILTRO + ADD */}
      <div className="flex gap-2">
        <input
          placeholder="Cerca codice / nome / fornitore..."
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
              categoria: 'cerniera',
              codice: '',
              nome: '',
              attivo: true,
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

      {/* LISTA */}
      <div className="space-y-2">
        {filtrati.map((a) => (
          <div
            key={a.id}
            onClick={() => setEditing(a)}
            className="rounded-lg p-3 cursor-pointer"
            style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-sm font-bold">{a.codice}</div>
                <div className="text-xs opacity-70 truncate">{a.nome}</div>
                <div className="text-[10px] opacity-50 mt-1">
                  {a.fornitore} · {a.sistema} · {CATEGORIE_LABEL[a.categoria as keyof typeof CATEGORIE_LABEL] ?? a.categoria}
                </div>
              </div>
              <div className="text-right ml-2">
                <div className="font-mono text-sm" style={{ color: '#28A0A0' }}>
                  € {(a.prezzo_netto ?? a.prezzo_listino ?? 0).toFixed(2)}
                </div>
                {!a.attivo && (
                  <div className="text-[9px] opacity-60 uppercase">disattivo</div>
                )}
              </div>
            </div>
            {(a.hbb_min || a.hbb_max || a.peso_max_kg) && (
              <div className="text-[10px] opacity-50 mt-1 font-mono">
                {a.hbb_min ?? '–'}–{a.hbb_max ?? '–'} mm · max {a.peso_max_kg ?? '–'} kg
              </div>
            )}
          </div>
        ))}
        {filtrati.length === 0 && !loading && (
          <div className="text-center opacity-60 py-8 text-sm">Nessun articolo.</div>
        )}
      </div>

      {/* MODAL EDIT */}
      {editing && (
        <ArticoloForm
          a={editing}
          onClose={() => setEditing(null)}
          onSave={async (a) => {
            const r = await onSave(a);
            if (r.ok) setEditing(null);
            else alert(r.error);
          }}
          onDelete={
            editing.id
              ? async () => {
                  if (!confirm('Eliminare questo articolo?')) return;
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

function ArticoloForm({
  a,
  onClose,
  onSave,
  onDelete,
}: {
  a: Partial<FerramentaArticolo>;
  onClose: () => void;
  onSave: (a: Partial<FerramentaArticolo>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Partial<FerramentaArticolo>>(a);
  const set = <K extends keyof FerramentaArticolo>(k: K, v: FerramentaArticolo[K]) =>
    setF((p) => ({ ...p, [k]: v }));

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
          <div className="font-bold">{a.id ? 'MODIFICA ARTICOLO' : 'NUOVO ARTICOLO'}</div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#28A0A0' }}>
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Row>
            <Field label="Fornitore" v={f.fornitore} on={(x) => set('fornitore', x)} />
            <Field label="Sistema" v={f.sistema} on={(x) => set('sistema', x)} />
          </Row>
          <Sel
            label="Categoria"
            v={f.categoria ?? 'cerniera'}
            on={(x) => set('categoria', x)}
            opts={CATEGORIE.map((c) => ({ v: c, l: CATEGORIE_LABEL[c as keyof typeof CATEGORIE_LABEL] }))}
          />
          <Row>
            <Field label="Codice" v={f.codice} on={(x) => set('codice', x)} />
            <Field label="Nome" v={f.nome} on={(x) => set('nome', x)} />
          </Row>
          <Field label="Descrizione" v={f.descrizione ?? ''} on={(x) => set('descrizione', x)} />

          <Row>
            <Num label="HBB min" v={f.hbb_min} on={(x) => set('hbb_min', x)} />
            <Num label="HBB max" v={f.hbb_max} on={(x) => set('hbb_max', x)} />
          </Row>
          <Row>
            <Num label="LBB min" v={f.lbb_min} on={(x) => set('lbb_min', x)} />
            <Num label="LBB max" v={f.lbb_max} on={(x) => set('lbb_max', x)} />
          </Row>
          <Row>
            <Num label="Peso max (kg)" v={f.peso_max_kg} on={(x) => set('peso_max_kg', x)} />
            <Field label="Materiale" v={f.materiale ?? ''} on={(x) => set('materiale', x)} />
          </Row>
          <Row>
            <Num label="Lung. (mm)" v={f.lunghezza_mm} on={(x) => set('lunghezza_mm', x)} />
            <Num label="Quota e (mm)" v={f.e_mm} on={(x) => set('e_mm', x)} />
          </Row>
          <Row>
            <Num label="Prezzo listino" v={f.prezzo_listino} on={(x) => set('prezzo_listino', x)} step="0.01" />
            <Num label="Prezzo netto" v={f.prezzo_netto} on={(x) => set('prezzo_netto', x)} step="0.01" />
          </Row>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={f.attivo ?? true}
              onChange={(e) => set('attivo', e.target.checked)}
            />
            Attivo
          </label>
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

// ---------- mini helpers ----------
function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}
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
  step,
}: {
  label: string;
  v: number | null | undefined;
  on: (x: number | null) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <div className="text-[10px] tracking-wider opacity-60 mb-1">{label}</div>
      <input
        type="number"
        inputMode="decimal"
        step={step ?? '1'}
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
