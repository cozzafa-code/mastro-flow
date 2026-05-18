'use client';
// components/StrumentiVanoPanel.tsx
// Pannello modale slide-in per scegliere quali strumenti mostrare nel vano.
// V2: include strumenti standard hardcoded + widget configuratori dal registry.
// Stile fliwoX: teal #28A0A0, Inter, no emoji, SVG inline.

import { useState, useEffect } from 'react';
import { WIDGETS } from '@/lib/widgets/widgetRegistry';
import type { WidgetId } from '@/lib/widgets/widgetTypes';

// ─── Definizione strumenti standard del vano ────────────────────────────
// (Sono le card hardcoded di VanoDetailPanel: Accesso, Tipologia, ecc.)
const STRUMENTI_STANDARD = [
  { id: 'accesso',      nome: 'Accesso / Difficoltà', desc: 'Scale, montacarichi, parcheggio',     iconPath: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22 9 12 15 12 15 22' },
  { id: 'tipologia',    nome: 'Tipologia',            desc: 'Categoria serramento, dimensioni',     iconPath: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { id: 'stanza',       nome: 'Stanza / Piano',       desc: "Posizione nell'edificio",              iconPath: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
  { id: 'sistema',      nome: 'Sistema / Vetro',      desc: 'Profilo, vetro, pacchetto',            iconPath: 'M2 3h20v14H2z M8 21h8 M12 17v4' },
  { id: 'colori',       nome: 'Colori profili',       desc: 'RAL interno/esterno',                  iconPath: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { id: 'telaio',       nome: 'Telaio / Rifilato',    desc: 'Fasce decorative, rifilato',           iconPath: 'M3 3h18v18H3z M3 9h18' },
  { id: 'coprifilo',    nome: 'Coprifilo',            desc: 'Coprifilo perimetrale',                iconPath: 'M3 3h18v18H3z' },
  { id: 'lamiera',      nome: 'Lamiera',              desc: 'Soglie, scossaline',                   iconPath: 'M12 19l7-7-3-3L9 16z M14 7l3 3' },
  { id: 'controtelaio', nome: 'Controtelaio',         desc: 'Falso telaio per posa',                iconPath: 'M3 3h18v18H3z M3 9h18 M3 15h18' },
  { id: 'ferro',        nome: 'Ferro',                desc: 'Lavorazioni in ferro',                 iconPath: 'M5 3v18 M19 3v18 M5 12h14' },
  { id: 'strutture',    nome: 'Strutture',            desc: 'Pergole, verande, box (legacy)',       iconPath: 'M3 9l4-4h10l4 4 M3 9v11h18V9 M3 9h18 M9 14h6' },
  { id: 'tendaggi',     nome: 'Tendaggi',             desc: 'Tende interno, esterno, motorizzate',  iconPath: 'M4 4h16v4H4z M4 8v12h16V8 M8 8v12 M16 8v12' },
] as const;

interface StrumentoLayoutItem {
  id: string;
  attivo: boolean;
  ordine: number;
  tipo?: 'standard' | 'widget';
}

interface Props {
  vano: any;
  onClose: () => void;
  onSave: (layout: StrumentoLayoutItem[]) => void;
}

const T = {
  acc: '#28A0A0',
  accDeep: '#156060',
  accDark: '#0F6E56',
  accLight: '#E8F5F5',
  bg: '#F4F1EA',
  card: '#FFFFFF',
  text: '#0D1F1F',
  muted: '#88928F',
  bdr: '#C8E4E4',
  bdrLight: '#EEF8F8',
  shadow: '0 2px 8px rgba(0,0,0,0.05)',
};

// Default layout: TUTTI gli strumenti standard ATTIVI, widget DISATTIVI
function buildDefaultLayout(): StrumentoLayoutItem[] {
  const out: StrumentoLayoutItem[] = [];
  STRUMENTI_STANDARD.forEach((s, i) => {
    out.push({ id: s.id, attivo: true, ordine: i, tipo: 'standard' });
  });
  Object.values(WIDGETS).forEach((w, i) => {
    out.push({ id: w.id, attivo: false, ordine: STRUMENTI_STANDARD.length + i, tipo: 'widget' });
  });
  return out;
}

// Merge layout salvato + default (preserva ordine e spunte salvate, aggiunge nuovi che mancano)
function mergeLayout(saved: StrumentoLayoutItem[] | undefined): StrumentoLayoutItem[] {
  const def = buildDefaultLayout();
  if (!saved || !Array.isArray(saved) || saved.length === 0) return def;
  const validIds = new Set([
    ...STRUMENTI_STANDARD.map(s => s.id),
    ...Object.keys(WIDGETS),
  ]);
  const out: StrumentoLayoutItem[] = [];
  // 1) prima: elementi salvati che esistono ancora
  saved.forEach((s) => {
    if (validIds.has(s.id)) {
      const isStd = STRUMENTI_STANDARD.some(x => x.id === s.id);
      out.push({
        id: s.id,
        attivo: !!s.attivo,
        ordine: out.length,
        tipo: isStd ? 'standard' : 'widget',
      });
    }
  });
  // 2) aggiungi quelli nuovi (non presenti nel saved)
  const savedIds = new Set(out.map(x => x.id));
  def.forEach((d) => {
    if (!savedIds.has(d.id)) out.push({ ...d, ordine: out.length });
  });
  return out;
}

function getInfo(id: string) {
  const std = STRUMENTI_STANDARD.find(s => s.id === id);
  if (std) return { tipo: 'standard' as const, nome: std.nome, desc: std.desc, iconPath: std.iconPath, minPlan: 'BASE' };
  const w = WIDGETS[id as WidgetId];
  if (w) return { tipo: 'widget' as const, nome: w.label, desc: w.sublabel, iconPath: w.iconSvg, minPlan: w.minPlan };
  return null;
}

export default function StrumentiVanoPanel({ vano, onClose, onSave }: Props) {
  const initial = mergeLayout(vano?.strumenti_layout);
  const [items, setItems] = useState<StrumentoLayoutItem[]>(initial);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setOpen(false);
    setTimeout(onClose, 280);
  }

  function toggleAttivo(id: string) {
    setItems(arr => arr.map(x => x.id === id ? { ...x, attivo: !x.attivo } : x));
  }

  function handleSave() {
    const cleaned = items.map((x, i) => ({ id: x.id, attivo: x.attivo, ordine: i, tipo: x.tipo }));
    onSave(cleaned);
    handleClose();
  }

  function handleReset() {
    setItems(buildDefaultLayout());
  }

  function onDragStart(id: string) { setDraggingId(id); }
  function onDragEnd() { setDraggingId(null); setDropTargetId(null); }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== draggingId) setDropTargetId(id);
  }
  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    setItems(arr => {
      const fromIdx = arr.findIndex(x => x.id === draggingId);
      const toIdx = arr.findIndex(x => x.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return arr;
      const out = arr.slice();
      const [moved] = out.splice(fromIdx, 1);
      out.splice(toIdx, 0, moved);
      return out;
    });
    setDropTargetId(null);
  }

  const nAttivi = items.filter(x => x.attivo).length;

  // Trovo gli indici dove si "transita" da uno standard a un widget e viceversa,
  // per inserire il divider della sezione (sezione cambia dinamicamente in base
  // a come l'utente ha riordinato).
  function renderRows() {
    const rows: JSX.Element[] = [];
    let lastTipo: string | null = null;
    items.forEach((it, idx) => {
      const info = getInfo(it.id);
      if (!info) return;
      // Divider sezione
      if (info.tipo !== lastTipo) {
        rows.push(
          <div
            key={'div-' + idx}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.muted,
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: idx === 0 ? '6px 4px 8px' : '14px 4px 8px',
            }}
          >
            {info.tipo === 'standard' ? 'Strumenti standard' : 'Widget configuratori'}
          </div>
        );
        lastTipo = info.tipo;
      }
      const isDragging = draggingId === it.id;
      const isDropTarget = dropTargetId === it.id;
      rows.push(
        <div
          key={it.id}
          draggable
          onDragStart={() => onDragStart(it.id)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOver(e, it.id)}
          onDragLeave={() => setDropTargetId(null)}
          onDrop={(e) => onDrop(e, it.id)}
          onClick={() => !isDragging && toggleAttivo(it.id)}
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 8,
            boxShadow: T.shadow,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            cursor: isDragging ? 'grabbing' : 'pointer',
            border: it.attivo
              ? `1px solid ${T.acc}`
              : isDropTarget
              ? `1px dashed ${T.acc}`
              : '1px solid transparent',
            opacity: isDragging ? 0.5 : 1,
            transition: 'border 0.15s, opacity 0.15s',
            userSelect: 'none',
          }}
        >
          {/* Grip */}
          <div style={{
            color: T.muted, fontSize: 14, fontWeight: 900, letterSpacing: -2,
            width: 18, textAlign: 'center', lineHeight: 1, flexShrink: 0, cursor: 'grab',
          }}>⋮⋮</div>

          {/* Checkbox */}
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            border: `2px solid ${it.attivo ? T.acc : T.bdr}`,
            background: it.attivo ? T.acc : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}>
            {it.attivo && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>

          {/* Icona */}
          <div style={{ width: 18, height: 18, color: T.text, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={info.iconPath} />
            </svg>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 600, color: T.text,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{info.nome}</div>
            <div style={{
              fontSize: 10, color: T.muted, marginTop: 1,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{info.desc}</div>
          </div>

          {/* Pill piano */}
          {info.minPlan === 'PRO' || info.minPlan === 'TITAN' ? (
            <div style={{
              padding: '2px 7px', borderRadius: 6,
              background: '#FFB060', color: '#fff',
              fontSize: 9, fontWeight: 800, letterSpacing: 0.5, flexShrink: 0,
            }}>{info.minPlan}</div>
          ) : null}
        </div>
      );
    });
    return rows;
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        opacity: open ? 1 : 0,
        transition: 'opacity 0.25s',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        width: '88%', maxWidth: 460, background: T.bg,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${T.acc} 0%, ${T.accDeep} 100%)`,
          color: '#fff', padding: '18px 18px 14px',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div onClick={handleClose} style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 22, fontWeight: 300, flexShrink: 0,
            userSelect: 'none',
          }}>×</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 1,
              opacity: 0.85, textTransform: 'uppercase',
            }}>CONFIGURA</div>
            <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>
              Strumenti del vano
            </div>
          </div>
          <div style={{
            padding: '6px 12px', borderRadius: 14,
            background: 'rgba(255,255,255,0.22)',
            fontSize: 11, fontWeight: 700,
          }}>{nAttivi} attivi</div>
        </div>

        {/* Banner istruzioni */}
        <div style={{
          background: T.accLight, color: T.accDark,
          fontSize: 11, lineHeight: 1.5,
          padding: '10px 14px', borderBottom: `1px solid ${T.bdr}`,
        }}>
          Clicca su una riga per <b>attivare/disattivare</b> uno strumento.
          Trascina dal grip <b>⋮⋮</b> per <b>riordinare</b>. Le scelte valgono per questo vano.
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
          {renderRows()}
        </div>

        {/* Footer */}
        <div style={{
          background: T.card, borderTop: `1px solid ${T.bdr}`,
          padding: 14, flexShrink: 0, display: 'flex', gap: 10,
        }}>
          <button type="button" onClick={handleReset} style={{
            flex: 1, padding: 14, borderRadius: 12,
            background: 'transparent', color: T.text,
            fontSize: 13, fontWeight: 600,
            border: `1.5px solid ${T.bdr}`, cursor: 'pointer',
            fontFamily: 'inherit',
          }}>Ripristina default</button>
          <button type="button" onClick={handleSave} style={{
            flex: 2, padding: 14, borderRadius: 12,
            background: T.acc, color: '#fff',
            fontSize: 14, fontWeight: 800, border: 'none',
            cursor: 'pointer', letterSpacing: 0.3,
            boxShadow: `0 4px 0 0 ${T.accDark}`,
            fontFamily: 'inherit',
          }}>Salva</button>
        </div>
      </div>
    </div>
  );
}
