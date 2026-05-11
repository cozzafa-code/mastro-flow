"use client";
// components/CentroControlloOrdini.tsx
// BLOCCO 2 + 3 - Header KPI + Alert + Kanban 9 colonne + Lista + drag&drop

import React, { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useOrdini, type OrdineRow } from "../hooks/useOrdini";
import TrasformatoreOrdiniModal from "./TrasformatoreOrdiniModal";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

type ViewMode = 'alert' | 'kanban' | 'lista';
type StatoCol = 'da_ordinare' | 'approvazione' | 'inviato' | 'confermato' | 'in_produzione' | 'in_transito' | 'arrivato' | 'verificato' | 'errore';

interface ColumnDef {
  key: StatoCol;
  title: string;
  color: string;
  icon: string;
}

const COLS: ColumnDef[] = [
  { key: 'da_ordinare',   title: 'DA ORDINARE',  color: MUTED,     icon: '📋' },
  { key: 'approvazione',  title: 'APPROVAZIONE', color: AMBER,     icon: '✓'  },
  { key: 'inviato',       title: 'INVIATO',      color: BLUE,      icon: '📤' },
  { key: 'confermato',    title: 'CONFERMATO',   color: PURPLE,    icon: '🤝' },
  { key: 'in_produzione', title: 'IN PRODUZIONE',color: TEAL,      icon: '🏭' },
  { key: 'in_transito',   title: 'IN TRANSITO',  color: '#0EA5E9', icon: '🚚' },
  { key: 'arrivato',      title: 'ARRIVATO',     color: TEAL_DEEP, icon: '📦' },
  { key: 'verificato',    title: 'VERIFICATO',   color: GREEN,     icon: '✅' },
  { key: 'errore',        title: 'ERRORE',       color: RED,       icon: '⚠️'  },
];

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

export default function CentroControlloOrdini({ aziendaId, onClose, onApriOrdine, onApriCommessa }: any) {
  const resolved = resolveAziendaId(aziendaId);
  const [view, setView] = useState<ViewMode>('alert');
  const [showTrasformatore, setShowTrasformatore] = useState(false);
  const [filter, setFilter] = useState<'tutti' | 'urgenti' | 'bloccanti' | 'in_ritardo'>('tutti');
  const [search, setSearch] = useState('');
  const { ordini, stats, loading } = useOrdini(resolved);

  const filtered = useMemo(() => {
    let arr = ordini;
    const today = new Date().toISOString().slice(0, 10);
    if (filter === 'urgenti') arr = arr.filter(o => o.urgente);
    else if (filter === 'bloccanti') arr = arr.filter(o => o.bloccante);
    else if (filter === 'in_ritardo') arr = arr.filter(o => 
      o.consegna_prevista && o.consegna_prevista < today &&
      !['arrivato','verificato','completato'].includes(o.stato)
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(o =>
        (o.numero || '').toLowerCase().includes(q) ||
        (o.fornitore || '').toLowerCase().includes(q) ||
        (o.commessa_code || '').toLowerCase().includes(q) ||
        (o.commessa_cliente || '').toLowerCase().includes(q) ||
        (o.categoria_materiale || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [ordini, filter, search]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 22px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CENTRO CONTROLLO</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Ordini & Catena Operativa</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          <KpiHero icon="🔴" label="BLOCCANTI" val={stats.bloccanti} color={RED} />
          <KpiHero icon="🟠" label="IN RITARDO" val={stats.in_ritardo} color={AMBER} />
          <KpiHero icon="🟢" label="ARRIVI OGGI" val={stats.arrivi_oggi} color={TEAL} />
          <KpiHero icon="🔴" label="CM. FERME" val={stats.commesse_ferme} color={RED} />
          <KpiHero icon="💶" label="ATTIVI" val={`€${(stats.totale_euro_attivi / 1000).toFixed(1)}k`} color={GREEN} small />
        </div>
      </div>

      <div style={{ background: '#fff', margin: '-12px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative' as const, zIndex: 2 }}>
        <TabBtn active={view === 'alert'} onClick={() => setView('alert')} label="🚨 Alert" badge={stats.bloccanti + stats.in_ritardo} />
        <TabBtn active={view === 'kanban'} onClick={() => setView('kanban')} label="Kanban" badge={ordini.length} />
        <TabBtn active={view === 'lista'} onClick={() => setView('lista')} label="Lista" badge={ordini.length} />
      </div>

      {view !== 'alert' && (
        <>
          <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
              <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
            </svg>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cerca numero, fornitore, commessa, categoria..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
            {search && <button onClick={() => setSearch('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>}
          </div>

          <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', gap: 6, overflowX: 'auto' as const }}>
            <FChip active={filter==='tutti'} onClick={() => setFilter('tutti')} label="TUTTI" n={ordini.length} activeBg={NAVY} />
            <FChip active={filter==='bloccanti'} onClick={() => setFilter('bloccanti')} label="BLOCCANTI" n={stats.bloccanti} activeBg={RED} bg="#FFE4E4" />
            <FChip active={filter==='urgenti'} onClick={() => setFilter('urgenti')} label="URGENTI" n={ordini.filter(o=>o.urgente).length} activeBg={AMBER} bg="#FEF3C7" />
            <FChip active={filter==='in_ritardo'} onClick={() => setFilter('in_ritardo')} label="RITARDO" n={stats.in_ritardo} activeBg="#991B1B" bg="#FEE2E2" />
          </div>
        </>
      )}

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         view === 'alert' ? <ViewAlert ordini={ordini} onApriOrdine={onApriOrdine} onApriCommessa={onApriCommessa} /> :
         view === 'kanban' ? <ViewKanban ordini={filtered} onApriOrdine={onApriOrdine} onApriCommessa={onApriCommessa} /> :
         <ViewLista ordini={filtered} onApriOrdine={onApriOrdine} onApriCommessa={onApriCommessa} />}
      </div>

      {/* FAB Trasformatore */}
      <button onClick={() => setShowTrasformatore(true)} style={{
        position: 'fixed', bottom: 90, right: 18, zIndex: 9850,
        height: 56, padding: '0 20px', borderRadius: 28,
        background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`,
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(40,160,160,0.5)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
      }}>
        <span style={{ fontSize: 22 }}>⚡</span>
        <span>NUOVO ORDINE</span>
      </button>

      {showTrasformatore && (
        <TrasformatoreOrdiniModal
          aziendaId={resolved}
          onClose={() => setShowTrasformatore(false)}
          onCreati={() => setShowTrasformatore(false)}
        />
      )}
    </div>
  );
}

// =============== VIEW ALERT ===============
function ViewAlert({ ordini, onApriOrdine, onApriCommessa }: any) {
  const today = new Date().toISOString().slice(0, 10);
  const bloccantiAttivi = ordini.filter((o: OrdineRow) => 
    o.bloccante && !['arrivato', 'verificato', 'completato'].includes(o.stato)
  );

  const ritardiPerFornitore: Record<string, OrdineRow[]> = {};
  ordini.forEach((o: OrdineRow) => {
    if (o.consegna_prevista && o.consegna_prevista < today &&
        !['arrivato', 'verificato', 'completato'].includes(o.stato)) {
      if (!ritardiPerFornitore[o.fornitore]) ritardiPerFornitore[o.fornitore] = [];
      ritardiPerFornitore[o.fornitore].push(o);
    }
  });

  const ordiniErrore = ordini.filter((o: OrdineRow) => o.stato === 'errore');
  const arriviOggi = ordini.filter((o: OrdineRow) => o.consegna_prevista === today);
  const hasAnyAlert = bloccantiAttivi.length + Object.keys(ritardiPerFornitore).length + ordiniErrore.length > 0;

  if (!hasAnyAlert && arriviOggi.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: TEAL_DEEP, marginBottom: 4 }}>Tutto sotto controllo</div>
        <div style={{ fontSize: 12, color: MUTED }}>Nessun ordine bloccante, ritardo o errore</div>
      </div>
    );
  }

  return (
    <>
      {bloccantiAttivi.map((o: OrdineRow) => (
        <CardAlertGiant key={o.id} icon="🔴" severity="block" title="MONTAGGIO BLOCCATO"
          subtitle={`Mancano ${o.categoria_materiale || 'materiali'} commessa ${o.commessa_code || ''}`}
          ordine={o} onClick={() => onApriOrdine?.(o.id)}
          onOpenCm={o.commessa_id ? () => onApriCommessa?.(o.commessa_id) : undefined} />
      ))}

      {Object.entries(ritardiPerFornitore).map(([forn, ords]) => {
        const giorniRitardo = Math.max(...ords.map(o => 
          Math.floor((new Date(today).getTime() - new Date(o.consegna_prevista!).getTime()) / (1000*60*60*24))
        ));
        return (
          <CardAlertGiant key={forn} icon="🟠" severity="warn" title="FORNITORE IN RITARDO"
            subtitle={`${forn} ETA +${giorniRitardo} giorni · ${ords.length} ordine${ords.length>1?'i':''}`}
            ordine={ords[0]} onClick={() => onApriOrdine?.(ords[0].id)} />
        );
      })}

      {ordiniErrore.map((o: OrdineRow) => (
        <CardAlertGiant key={o.id} icon="🔴" severity="block" title="ORDINE IN ERRORE"
          subtitle={o.errore_descrizione || `${o.numero} richiede verifica`}
          ordine={o} onClick={() => onApriOrdine?.(o.id)}
          onOpenCm={o.commessa_id ? () => onApriCommessa?.(o.commessa_id) : undefined} />
      ))}

      {arriviOggi.length > 0 && (
        <div style={{ background: 'linear-gradient(135deg, ' + TEAL + '15, ' + TEAL + '08)', border: `2px solid ${TEAL}`, borderRadius: 12, padding: 14, marginTop: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>📦</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: TEAL_DEEP }}>ARRIVI PREVISTI OGGI</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginTop: 2 }}>{arriviOggi.length} consegne in giornata</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {arriviOggi.map((o: OrdineRow) => (
              <div key={o.id} onClick={() => onApriOrdine?.(o.id)} style={{ background: 'rgba(255,255,255,0.7)', padding: '8px 10px', borderRadius: 7, fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <span style={{ background: TEAL_DEEP, color: '#fff', padding: '2px 7px', borderRadius: 4, fontWeight: 700, fontSize: 9 }}>{o.numero}</span>
                <span style={{ flex: 1, color: TEXT, fontWeight: 600 }}>{o.fornitore}</span>
                <span style={{ color: MUTED, fontWeight: 600 }}>€{Number(o.totale_euro || o.totale_stimato).toLocaleString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// =============== VIEW KANBAN 9 COLONNE ===============
function ViewKanban({ ordini, onApriOrdine, onApriCommessa }: any) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoverCol, setHoverCol] = useState<StatoCol | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Mappa stati DB → colonna Kanban (alcuni stati legacy mappati)
  function ordineToColumn(o: OrdineRow): StatoCol {
    const s = o.stato;
    if (s === 'bozza') return 'da_ordinare';
    if (s === 'completato') return 'verificato';
    if (s === 'annullato') return 'errore';
    return (s as StatoCol);
  }

  async function moveOrder(ordId: string, newStato: StatoCol) {
    const o = ordini.find((x: OrdineRow) => x.id === ordId);
    if (!o) return;
    
    const updates: any = { stato: newStato };
    if (newStato === 'arrivato' && !o.arrivato_at) updates.arrivato_at = new Date().toISOString();
    if (newStato === 'verificato' && !o.verificato_at) updates.verificato_at = new Date().toISOString();
    if (newStato === 'inviato' && !o.inviato_at) updates.inviato_at = new Date().toISOString();
    if (newStato === 'errore') {
      const desc = typeof window !== 'undefined' ? window.prompt('Descrizione errore (opzionale):', o.errore_descrizione || '') : null;
      if (desc !== null) updates.errore_descrizione = desc;
    }

    const { error } = await supabase.from('ordini_fornitore').update(updates).eq('id', ordId);
    if (error) {
      setToast({ msg: 'Errore: ' + error.message, ok: false });
    } else {
      const colDef = COLS.find(c => c.key === newStato);
      setToast({ msg: `${o.numero} → ${colDef?.title}`, ok: true });
    }
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 100, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? TEAL_DEEP : RED, color: '#fff',
          padding: '10px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600,
          zIndex: 9999, boxShadow: '0 6px 20px rgba(0,0,0,0.25)', maxWidth: '90%',
        }}>
          {toast.ok ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, overflowX: 'auto' as const, paddingBottom: 8 }}>
        {COLS.map(col => {
          const items = ordini.filter((o: OrdineRow) => ordineToColumn(o) === col.key);
          const isHover = hoverCol === col.key && draggedId !== null;
          const totEuro = items.reduce((s: number, o: OrdineRow) => s + (Number(o.totale_euro) || Number(o.totale_stimato) || 0), 0);

          return (
            <div key={col.key}
              onDragOver={(e) => { e.preventDefault(); setHoverCol(col.key); }}
              onDragLeave={() => setHoverCol(prev => prev === col.key ? null : prev)}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData('text/plain') || draggedId;
                if (id) moveOrder(id, col.key);
                setDraggedId(null);
                setHoverCol(null);
              }}
              style={{
                minWidth: 300, flexShrink: 0,
                padding: isHover ? 6 : 0,
                borderRadius: 10,
                background: isHover ? col.color + '22' : 'transparent',
                border: isHover ? `2px dashed ${col.color}` : '2px dashed transparent',
                transition: 'all 0.15s',
              }}>
              <div style={{ background: col.color, color: '#fff', padding: '8px 10px', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{col.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{col.title}</div>
                  <div style={{ fontSize: 9, opacity: 0.85 }}>€{totEuro.toLocaleString('it-IT')}</div>
                </div>
                <span style={{ background: 'rgba(255,255,255,0.25)', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 60 }}>
                {items.length === 0 ?
                  <div style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: 25, textAlign: 'center' as const, fontSize: 10, color: MUTED, border: '1px dashed #E5EAF0' }}>
                    {isHover ? '⤵ Rilascia qui' : 'Vuoto'}
                  </div> :
                  items.map((o: OrdineRow) => (
                    <div key={o.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedId(o.id);
                        e.dataTransfer.setData('text/plain', o.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => { setDraggedId(null); setHoverCol(null); }}
                      style={{ opacity: draggedId === o.id ? 0.4 : 1, cursor: 'grab', transition: 'opacity 0.15s' }}>
                      <CardOrdine ord={o} compact onClick={() => onApriOrdine?.(o.id)} onOpenCm={o.commessa_id ? () => onApriCommessa?.(o.commessa_id) : undefined} />
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// =============== VIEW LISTA ===============
function ViewLista({ ordini, onApriOrdine, onApriCommessa }: any) {
  if (ordini.length === 0) return <Empty label="Nessun ordine corrisponde ai filtri" />;
  return (
    <>
      {ordini.map((o: OrdineRow) => (
        <CardOrdine key={o.id} ord={o} onClick={() => onApriOrdine?.(o.id)} onOpenCm={o.commessa_id ? () => onApriCommessa?.(o.commessa_id) : undefined} />
      ))}
    </>
  );
}

// =============== CARD ORDINE PESANTE OPERATIVA ===============
function CardOrdine({ ord, compact, onClick, onOpenCm }: any) {
  const today = new Date().toISOString().slice(0, 10);
  const isLate = ord.consegna_prevista && ord.consegna_prevista < today && !['arrivato','verificato','completato'].includes(ord.stato);
  const isToday = ord.consegna_prevista === today;
  
  const colDef = COLS.find(c => c.key === ord.stato) || COLS[0];
  const rating = Number(ord.fornitore_rating) || 0;
  const affidabilita = Number(ord.fornitore_affidabilita) || 0;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${colDef.color}`, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
      {/* HEADER: numero + flags + totale */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const, marginBottom: 3 }}>
            <span style={{ background: colDef.color, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{ord.numero}</span>
            {ord.urgente && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>URGENTE</span>}
            {ord.bloccante && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>BLOCCANTE</span>}
            {isLate && <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>RITARDO</span>}
            {isToday && <span style={{ background: '#E1F5EE', color: TEAL_DEEP, padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>OGGI</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{ord.fornitore}</div>
          {/* Rating + affidabilità */}
          {(rating > 0 || affidabilita > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 9, color: s <= rating ? AMBER : '#E5EAF0' }}>★</span>)}
                  <span style={{ fontSize: 9, color: MUTED, marginLeft: 2 }}>{rating.toFixed(1)}</span>
                </div>
              )}
              {affidabilita > 0 && (
                <span style={{ fontSize: 9, color: affidabilita >= 85 ? TEAL_DEEP : affidabilita >= 70 ? AMBER : RED, fontWeight: 700 }}>
                  {affidabilita}% affid.
                </span>
              )}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, lineHeight: 1 }}>€{Math.round(Number(ord.totale_euro || ord.totale_stimato || 0)).toLocaleString('it-IT')}</div>
          {ord.categoria_materiale && <div style={{ fontSize: 9, color: MUTED, marginTop: 4, textTransform: 'uppercase' as const, fontWeight: 700 }}>{ord.categoria_materiale}</div>}
        </div>
      </div>

      {/* CENTRO: commessa + ETA */}
      <div style={{ background: '#F8FAFA', padding: '8px 10px', borderRadius: 7, marginBottom: !compact ? 8 : 0 }}>
        {ord.commessa_code && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11 }}>
            <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={TEXT} strokeWidth={2}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span style={{ fontWeight: 700, color: TEXT }}>{ord.commessa_code}</span>
            <span style={{ color: MUTED }}>· {ord.commessa_cliente}</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: MUTED }}>
          {ord.consegna_prevista && (
            <span>📅 ETA: <span style={{ fontWeight: 700, color: isLate ? RED : isToday ? TEAL_DEEP : TEXT }}>
              {new Date(ord.consegna_prevista).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
            </span></span>
          )}
          {ord.inviato_at && <span>📤 {new Date(ord.inviato_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
          {ord.arrivato_at && <span style={{ color: TEAL_DEEP, fontWeight: 700 }}>📦 Arrivato {new Date(ord.arrivato_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>}
        </div>
        {ord.errore_descrizione && (
          <div style={{ marginTop: 6, padding: '4px 8px', background: '#FEE2E2', borderRadius: 4, fontSize: 10, color: '#991B1B', fontWeight: 600 }}>
            ⚠ {ord.errore_descrizione}
          </div>
        )}
      </div>

      {/* BOTTOM: azioni */}
      {!compact && onOpenCm && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{ flex: 1, padding: '7px 0', background: colDef.color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            Dettaglio →
          </button>
          <button onClick={(e) => { e.stopPropagation(); onOpenCm(); }} style={{ flex: 1, padding: '7px 0', background: '#fff', color: colDef.color, border: `1.5px solid ${colDef.color}`, borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
            Commessa
          </button>
        </div>
      )}
    </div>
  );
}

// =============== CARD ALERT GIGANTE (BLOCCO 2) ===============
function CardAlertGiant({ icon, severity, title, subtitle, ordine, onClick, onOpenCm }: any) {
  const col = severity === 'block' ? RED : severity === 'warn' ? AMBER : TEAL;
  const bg = severity === 'block' ? '#FEE2E2' : severity === 'warn' ? '#FEF3C7' : '#E1F5EE';
  const fg = severity === 'block' ? '#991B1B' : severity === 'warn' ? '#92400E' : TEAL_DEEP;

  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderLeft: `6px solid ${col}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 50, height: 50, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, letterSpacing: 1.3, color: fg, fontWeight: 800, marginBottom: 3 }}>{title}</div>
          <div style={{ fontSize: 14, color: TEXT, fontWeight: 700, lineHeight: 1.3 }}>{subtitle}</div>
        </div>
      </div>

      <div style={{ background: '#F8FAFA', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
        <span style={{ background: col, color: '#fff', padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>{ordine.numero}</span>
        <span style={{ fontSize: 11, color: TEXT, fontWeight: 600 }}>{ordine.fornitore}</span>
        {ordine.commessa_code && (
          <span style={{ background: '#fff', color: TEXT, padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, border: '1px solid #E5EAF0' }}>{ordine.commessa_code} · {ordine.commessa_cliente}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: TEXT, fontWeight: 700 }}>€{Number(ordine.totale_euro || ordine.totale_stimato).toLocaleString('it-IT')}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        <button onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{ flex: 1, padding: '9px 0', background: col, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
          Apri ordine →
        </button>
        {onOpenCm && (
          <button onClick={(e) => { e.stopPropagation(); onOpenCm(); }} style={{ flex: 1, padding: '9px 0', background: '#fff', color: col, border: `2px solid ${col}`, borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Apri commessa
          </button>
        )}
      </div>
    </div>
  );
}

// =============== HELPERS ===============
function KpiHero({ icon, label, val, color, small }: any) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${color}55`, padding: '8px 6px', borderRadius: 10, textAlign: 'center' as const }}>
      <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
      <div style={{ fontSize: small ? 14 : 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 7, color: color, fontWeight: 700, letterSpacing: 0.6, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, label, badge }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 600,
      color: active ? '#fff' : MUTED, background: active ? NAVY : 'transparent',
      border: 'none', borderRadius: 7, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#F1F4F7', color: active ? '#fff' : TEXT, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{badge}</span>
      )}
    </button>
  );
}

function FChip({ active, onClick, label, n, activeBg, bg }: any) {
  return (
    <button onClick={onClick} style={{
      background: active ? activeBg : (bg || '#F1F4F7'),
      color: active ? '#fff' : TEXT,
      border: 'none', borderRadius: 8, padding: '7px 11px',
      fontSize: 11, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      whiteSpace: 'nowrap' as const, flexShrink: 0,
    }}>
      {label}
      <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: active ? '#fff' : TEXT, padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{n}</span>
    </button>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
