// components/settings-mobile/mastro-win/CrudDimensioniPortate.tsx
// Tab DIM/PORTATE: master/detail. Catalogo (azienda) + sotto-tabelle dimensioni e portate.

'use client';

import { useState, useEffect } from 'react';
import type {
  CatalogoFerramenta,
  CatalogoFerramentaDimensione,
  CatalogoFerramentaPortata,
} from '@/lib/types/mastro-win';

interface Props {
  catalogo: CatalogoFerramenta[];
  dimensioni: CatalogoFerramentaDimensione[];
  portate: CatalogoFerramentaPortata[];
  loading: boolean;
  onReloadDP: (ferramenta_id?: string) => Promise<void>;
  onSaveCatalogo: (c: Partial<CatalogoFerramenta>) => Promise<{ ok: boolean; error?: string }>;
  onDeleteCatalogo: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onSaveDimensione: (d: Partial<CatalogoFerramentaDimensione>) => Promise<{ ok: boolean; error?: string }>;
  onDeleteDimensione: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onSavePortata: (p: Partial<CatalogoFerramentaPortata>) => Promise<{ ok: boolean; error?: string }>;
  onDeletePortata: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

export default function CrudDimensioniPortate(p: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editCat, setEditCat] = useState<Partial<CatalogoFerramenta> | null>(null);

  useEffect(() => {
    if (selectedId) p.onReloadDP(selectedId);
  }, [selectedId, p]);

  const selected = p.catalogo.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="p-4 space-y-3">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div className="text-xs font-semibold tracking-wider opacity-60">
          CATALOGO FERRAMENTA · {p.catalogo.length}
        </div>
        <button
          onClick={() =>
            setEditCat({
              codice: '',
              descrizione: '',
              tipo: 'cerniera',
              attivo: true,
            })
          }
          className="px-3 py-1.5 rounded font-bold text-xs"
          style={{
            background: '#28A0A0',
            color: '#0D1F1F',
            boxShadow: '0 2px 0 0 #1F7575',
          }}
        >
          + NEW
        </button>
      </div>

      {p.loading && <div className="text-center opacity-60 py-4">Caricamento...</div>}

      {/* LISTA CATALOGO */}
      <div className="space-y-2">
        {p.catalogo.map((c) => {
          const isSel = c.id === selectedId;
          return (
            <div
              key={c.id}
              className="rounded-lg overflow-hidden"
              style={{
                background: '#FFFFFF',
                border: `1px solid ${isSel ? '#28A0A0' : '#C8E4E4'}`,
              }}
            >
              <div
                onClick={() => setSelectedId(isSel ? null : c.id)}
                className="p-3 cursor-pointer flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm font-bold">{c.codice}</div>
                  <div className="text-xs opacity-70">{c.descrizione}</div>
                  <div className="text-[10px] opacity-50 mt-1">
                    {c.tipo ?? '–'}
                    {c.portata_max_kg && ` · max ${c.portata_max_kg}kg`}
                    {c.larghezza_anta_max_mm && ` · L ${c.larghezza_anta_max_mm}`}
                    {c.altezza_anta_max_mm && ` · H ${c.altezza_anta_max_mm}`}
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2 items-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCat(c);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{ background: '#EEF8F8', color: '#28A0A0' }}
                  >
                    edit
                  </button>
                  <div className="text-[10px] opacity-40">{isSel ? '▾' : '▸'}</div>
                </div>
              </div>

              {/* DETTAGLIO ESPANSO */}
              {isSel && (
                <div
                  className="p-3 border-t space-y-3"
                  style={{ background: '#EEF8F8', borderColor: '#C8E4E4' }}
                >
                  <DimensioniBlock
                    ferramenta_id={c.id}
                    items={p.dimensioni.filter((d) => d.ferramenta_id === c.id)}
                    onSave={p.onSaveDimensione}
                    onDelete={p.onDeleteDimensione}
                  />
                  <PortateBlock
                    ferramenta_id={c.id}
                    items={p.portate.filter((pp) => pp.ferramenta_id === c.id)}
                    onSave={p.onSavePortata}
                    onDelete={p.onDeletePortata}
                  />
                </div>
              )}
            </div>
          );
        })}
        {p.catalogo.length === 0 && !p.loading && (
          <div className="text-center opacity-60 py-6 text-sm">
            Nessun elemento nel catalogo.
          </div>
        )}
      </div>

      {/* MODAL CATALOGO */}
      {editCat && (
        <CatalogoForm
          c={editCat}
          onClose={() => setEditCat(null)}
          onSave={async (c) => {
            const r = await p.onSaveCatalogo(c);
            if (r.ok) setEditCat(null);
            else alert(r.error);
          }}
          onDelete={
            editCat.id
              ? async () => {
                  if (!confirm('Eliminare?')) return;
                  const r = await p.onDeleteCatalogo(editCat.id!);
                  if (r.ok) setEditCat(null);
                  else alert(r.error);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

// ============ BLOCCHI INLINE ============

function DimensioniBlock({
  ferramenta_id,
  items,
  onSave,
  onDelete,
}: {
  ferramenta_id: string;
  items: CatalogoFerramentaDimensione[];
  onSave: (d: Partial<CatalogoFerramentaDimensione>) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [draft, setDraft] = useState<Partial<CatalogoFerramentaDimensione> | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] tracking-wider font-bold opacity-70">DIMENSIONI</div>
        <button
          onClick={() => setDraft({ ferramenta_id, n_cerniere: 2 })}
          className="text-[10px] px-2 py-0.5 rounded"
          style={{ background: '#28A0A0', color: '#0D1F1F' }}
        >
          + dim
        </button>
      </div>
      <div className="space-y-1">
        {items.map((d) => (
          <div
            key={d.id}
            className="flex justify-between items-center text-xs px-2 py-1.5 rounded font-mono"
            style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
          >
            <span>
              {d.n_cerniere ?? '–'} cern · {d.larghezza_max_mm ?? '–'} × {d.altezza_max_mm ?? '–'} mm
            </span>
            <button
              onClick={() => onDelete(d.id)}
              className="text-[10px] opacity-50"
              style={{ color: '#D14545' }}
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[10px] opacity-50 italic">Nessuna dimensione.</div>
        )}
      </div>

      {draft && (
        <div
          className="mt-2 p-2 rounded space-y-2"
          style={{ background: '#FFFFFF', border: '1px solid #28A0A0' }}
        >
          <div className="grid grid-cols-3 gap-2">
            <MiniNum
              ph="N° cern"
              v={draft.n_cerniere}
              on={(x) => setDraft({ ...draft, n_cerniere: x })}
            />
            <MiniNum
              ph="L max"
              v={draft.larghezza_max_mm}
              on={(x) => setDraft({ ...draft, larghezza_max_mm: x })}
            />
            <MiniNum
              ph="H max"
              v={draft.altezza_max_mm}
              on={(x) => setDraft({ ...draft, altezza_max_mm: x })}
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={async () => {
                const r = await onSave(draft);
                if (r.ok) setDraft(null);
                else alert(r.error);
              }}
              className="flex-1 py-1 rounded text-xs font-bold"
              style={{ background: '#28A0A0', color: '#0D1F1F' }}
            >
              salva
            </button>
            <button
              onClick={() => setDraft(null)}
              className="px-3 py-1 rounded text-xs"
              style={{ background: '#EEF8F8' }}
            >
              annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PortateBlock({
  ferramenta_id,
  items,
  onSave,
  onDelete,
}: {
  ferramenta_id: string;
  items: CatalogoFerramentaPortata[];
  onSave: (p: Partial<CatalogoFerramentaPortata>) => Promise<{ ok: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [draft, setDraft] = useState<Partial<CatalogoFerramentaPortata> | null>(null);

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="text-[10px] tracking-wider font-bold opacity-70">PORTATE (% per altezza)</div>
        <button
          onClick={() => setDraft({ ferramenta_id })}
          className="text-[10px] px-2 py-0.5 rounded"
          style={{ background: '#28A0A0', color: '#0D1F1F' }}
        >
          + port
        </button>
      </div>
      <div className="space-y-1">
        {items.map((pr) => (
          <div
            key={pr.id}
            className="flex justify-between items-center text-xs px-2 py-1.5 rounded font-mono"
            style={{ background: '#FFFFFF', border: '1px solid #C8E4E4' }}
          >
            <span>
              h {pr.altezza_mm ?? '–'} mm → {pr.portata_pct ?? '–'}%
            </span>
            <button
              onClick={() => onDelete(pr.id)}
              className="text-[10px] opacity-50"
              style={{ color: '#D14545' }}
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[10px] opacity-50 italic">Nessuna portata.</div>
        )}
      </div>

      {draft && (
        <div
          className="mt-2 p-2 rounded space-y-2"
          style={{ background: '#FFFFFF', border: '1px solid #28A0A0' }}
        >
          <div className="grid grid-cols-2 gap-2">
            <MiniNum
              ph="Altezza"
              v={draft.altezza_mm}
              on={(x) => setDraft({ ...draft, altezza_mm: x })}
            />
            <MiniNum
              ph="% portata"
              v={draft.portata_pct}
              on={(x) => setDraft({ ...draft, portata_pct: x })}
            />
          </div>
          <div className="flex gap-1">
            <button
              onClick={async () => {
                const r = await onSave(draft);
                if (r.ok) setDraft(null);
                else alert(r.error);
              }}
              className="flex-1 py-1 rounded text-xs font-bold"
              style={{ background: '#28A0A0', color: '#0D1F1F' }}
            >
              salva
            </button>
            <button
              onClick={() => setDraft(null)}
              className="px-3 py-1 rounded text-xs"
              style={{ background: '#EEF8F8' }}
            >
              annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ MODAL CATALOGO ============

function CatalogoForm({
  c,
  onClose,
  onSave,
  onDelete,
}: {
  c: Partial<CatalogoFerramenta>;
  onClose: () => void;
  onSave: (c: Partial<CatalogoFerramenta>) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}) {
  const [f, setF] = useState<Partial<CatalogoFerramenta>>(c);
  const set = <K extends keyof CatalogoFerramenta>(k: K, v: CatalogoFerramenta[K]) =>
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
          <div className="font-bold">{c.id ? 'MODIFICA' : 'NUOVO'} CATALOGO</div>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: '#28A0A0' }}>
            ×
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Field label="Codice" v={f.codice} on={(x) => set('codice', x)} />
          <Field label="Descrizione" v={f.descrizione} on={(x) => set('descrizione', x)} />
          <Field label="Tipo" v={f.tipo ?? ''} on={(x) => set('tipo', x)} />
          <div className="grid grid-cols-3 gap-2">
            <NumF
              label="Portata kg"
              v={f.portata_max_kg}
              on={(x) => set('portata_max_kg', x)}
            />
            <NumF
              label="L max"
              v={f.larghezza_anta_max_mm}
              on={(x) => set('larghezza_anta_max_mm', x)}
            />
            <NumF
              label="H max"
              v={f.altezza_anta_max_mm}
              on={(x) => set('altezza_anta_max_mm', x)}
            />
          </div>
          <Field label="Note" v={f.note ?? ''} on={(x) => set('note', x)} />
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

// ============ helpers ============
function MiniNum({
  ph,
  v,
  on,
}: {
  ph: string;
  v: number | null | undefined;
  on: (x: number | null) => void;
}) {
  return (
    <input
      type="number"
      placeholder={ph}
      inputMode="numeric"
      value={v ?? ''}
      onChange={(e) => on(e.target.value === '' ? null : Number(e.target.value))}
      className="w-full px-2 py-1 rounded text-xs font-mono"
      style={{ background: '#EEF8F8', border: '1px solid #C8E4E4' }}
    />
  );
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
function NumF({
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
