"use client";
// components/CentroControlloMagazzino.tsx
// BLOCCO 4 - Header KPI + Mappa visuale scaffali 2D + drawer scaffale

import React, { useState, useMemo } from "react";
import { useMagazzino, type Scaffale, type ArticoloMag } from "../hooks/useMagazzino";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

// Colori per zona
const ZONA_COLOR: Record<string, { bg: string; border: string; fg: string; icon: string }> = {
  vetri:       { bg: '#DBEAFE', border: BLUE,      fg: '#1E40AF', icon: '🪟' },
  profili:     { bg: '#E0E7FF', border: '#4F46E5', fg: '#3730A3', icon: '🔧' },
  ferramenta:  { bg: '#FEF3C7', border: AMBER,     fg: '#92400E', icon: '⚙️' },
  motori:      { bg: '#FECACA', border: RED,       fg: '#991B1B', icon: '⚡' },
  accessori:   { bg: '#E1F5EE', border: TEAL,      fg: TEAL_DEEP, icon: '📎' },
  kit_posa:    { bg: '#F3E8FF', border: PURPLE,    fg: '#6B21A8', icon: '📦' },
  area_carico: { bg: '#F1F5F9', border: '#64748B', fg: '#334155', icon: '🚚' },
  difetti:     { bg: '#FEE2E2', border: RED,       fg: '#991B1B', icon: '❌' },
  default:     { bg: '#F1F4F7', border: MUTED,     fg: TEXT,      icon: '📦' },
};

type ViewMode = 'mappa' | 'lista_scaff' | 'articoli';

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

function getZonaCol(zona: string | null) {
  return ZONA_COLOR[zona || 'default'] || ZONA_COLOR.default;
}

export default function CentroControlloMagazzino({ aziendaId, onClose, onApriCommessa }: any) {
  const resolved = resolveAziendaId(aziendaId);
  const [view, setView] = useState<ViewMode>('mappa');
  const [zonaFilter, setZonaFilter] = useState<string>('tutti');
  const [search, setSearch] = useState('');
  const [scaffaleAperto, setScaffaleAperto] = useState<Scaffale | null>(null);
  const { scaffali, articoli, stats, loading } = useMagazzino(resolved);

  const filteredScaffali = useMemo(() => {
    let arr = scaffali;
    if (zonaFilter !== 'tutti') arr = arr.filter(s => s.zona === zonaFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(s => 
        (s.codice || '').toLowerCase().includes(q) ||
        (s.nome || '').toLowerCase().includes(q) ||
        (s.zona || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [scaffali, zonaFilter, search]);

  // Articoli dello scaffale aperto
  const articoliScaffale = useMemo(() => {
    if (!scaffaleAperto) return [];
    return articoli.filter(a => a.scaffale_id === scaffaleAperto.id);
  }, [articoli, scaffaleAperto]);

  // Zone uniche
  const zoneDistinte = useMemo(() => {
    const z = new Set<string>(scaffali.map(s => s.zona).filter(Boolean) as string[]);
    return Array.from(z);
  }, [scaffali]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HEADER HERO con 5 KPI */}
      <div style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)', background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 22px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CENTRO CONTROLLO</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>Magazzino Operativo</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          <KpiHero icon="🟢" label="PRONTE" val={stats.commesse_pronte} color={TEAL} />
          <KpiHero icon="🟠" label="PARZIALI" val={stats.commesse_parziali} color={AMBER} />
          <KpiHero icon="🔴" label="BLOCCATE" val={stats.commesse_bloccate} color={RED} />
          <KpiHero icon="🟢" label="ORG." val={`${stats.perc_organizzato}%`} color={TEAL} small />
          <KpiHero icon="🟠" label="NON VER." val={stats.articoli_non_verificati} color={AMBER} />
        </div>
      </div>

      {/* TAB SWITCHER */}
      <div style={{ background: '#fff', margin: '-12px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative' as const, zIndex: 2 }}>
        <TabBtn active={view === 'mappa'} onClick={() => setView('mappa')} label="🗺️ Mappa" badge={stats.totale_scaffali} />
        <TabBtn active={view === 'lista_scaff'} onClick={() => setView('lista_scaff')} label="Scaffali" badge={stats.totale_scaffali} />
        <TabBtn active={view === 'articoli'} onClick={() => setView('articoli')} label="Articoli" badge={stats.totale_articoli} />
      </div>

      {/* Search */}
      <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
          <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
        </svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cerca scaffale, articolo, codice..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>}
      </div>

      {/* Filtri zona */}
      {zoneDistinte.length > 0 && (
        <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', gap: 6, overflowX: 'auto' as const }}>
          <FChip active={zonaFilter==='tutti'} onClick={() => setZonaFilter('tutti')} label="TUTTE" n={scaffali.length} activeBg={NAVY} />
          {zoneDistinte.map(z => {
            const col = getZonaCol(z);
            const count = scaffali.filter(s => s.zona === z).length;
            return (
              <FChip key={z} active={zonaFilter===z} onClick={() => setZonaFilter(z)} 
                label={(col.icon + ' ' + z.toUpperCase()).replace('_', ' ')} 
                n={count} activeBg={col.border} bg={col.bg} />
            );
          })}
        </div>
      )}

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         view === 'mappa' ? <ViewMappa scaffali={filteredScaffali} onClickScaff={setScaffaleAperto} /> :
         view === 'lista_scaff' ? <ViewListaScaffali scaffali={filteredScaffali} onClickScaff={setScaffaleAperto} /> :
         <ViewArticoli articoli={articoli} scaffali={scaffali} search={search} />}
      </div>

      {/* Drawer scaffale */}
      {scaffaleAperto && (
        <DrawerScaffale scaffale={scaffaleAperto} articoli={articoliScaffale} onClose={() => setScaffaleAperto(null)} />
      )}
    </div>
  );
}

// =============== VIEW MAPPA 2D (FEATURE WOW) ===============
function ViewMappa({ scaffali, onClickScaff }: any) {
  if (scaffali.length === 0) return <Empty label="Nessuno scaffale in questa zona" />;

  // Calcola dimensioni griglia
  const maxX = Math.max(0, ...scaffali.map((s: Scaffale) => s.posizione_x));
  const maxY = Math.max(0, ...scaffali.map((s: Scaffale) => s.posizione_y));
  const cols = maxX + 1;
  const rows = maxY + 1;

  // Crea matrice
  const grid: (Scaffale | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  scaffali.forEach((s: Scaffale) => {
    if (s.posizione_y < rows && s.posizione_x < cols) {
      grid[s.posizione_y][s.posizione_x] = s;
    }
  });

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>MAPPA MAGAZZINO</div>
      
      {/* Griglia visuale */}
      <div style={{ background: '#F8FAFA', padding: 12, borderRadius: 10, border: '2px dashed #E5EAF0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
          {grid.flat().map((s, idx) => {
            if (!s) return <div key={idx} style={{ minHeight: 90 }} />;
            const col = getZonaCol(s.zona);
            const stato = (s.articoli_sotto_scorta || 0) > 0 ? 'attesa' :
                          (s.saturazione_pct || 0) >= 80 ? 'pieno' :
                          (s.articoli_count || 0) > 0 ? 'pronto' : 'libero';
            const statoCol = stato === 'pronto' ? TEAL : stato === 'pieno' ? AMBER : stato === 'attesa' ? RED : MUTED;

            return (
              <div key={s.id} onClick={() => onClickScaff(s)}
                style={{
                  background: col.bg, border: `2px solid ${col.border}`, borderRadius: 10,
                  padding: 8, minHeight: 90, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', position: 'relative' as const,
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 14 }}>{col.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: col.fg }}>{s.codice}</span>
                  <span style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: statoCol }} />
                </div>
                <div style={{ fontSize: 9, color: col.fg, fontWeight: 600, marginBottom: 6, lineHeight: 1.2 }}>{s.nome}</div>
                
                {/* Stats inline */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 9, color: col.fg, fontWeight: 700 }}>
                    {s.articoli_count || 0} {(s.articoli_count || 0) === 1 ? 'art.' : 'art.'}
                  </div>
                  {/* Barra saturazione */}
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.6)', borderRadius: 2, overflow: 'hidden' as const }}>
                    <div style={{ width: `${s.saturazione_pct || 0}%`, height: '100%', background: col.border }} />
                  </div>
                  {(s.articoli_sotto_scorta || 0) > 0 && (
                    <div style={{ fontSize: 8, color: RED, fontWeight: 800 }}>⚠ {s.articoli_sotto_scorta} sotto scorta</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 9, color: MUTED, justifyContent: 'center', flexWrap: 'wrap' as const }}>
        <LegDot col={TEAL} label="Pronto" />
        <LegDot col={AMBER} label="Pieno" />
        <LegDot col={RED} label="Sotto scorta" />
        <LegDot col={MUTED} label="Libero" />
      </div>
    </div>
  );
}

// =============== VIEW LISTA SCAFFALI ===============
function ViewListaScaffali({ scaffali, onClickScaff }: any) {
  if (scaffali.length === 0) return <Empty label="Nessuno scaffale" />;
  return (
    <>
      {scaffali.map((s: Scaffale) => {
        const col = getZonaCol(s.zona);
        return (
          <div key={s.id} onClick={() => onClickScaff(s)} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${col.border}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 50, height: 50, borderRadius: 10, background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{col.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: col.border, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>{s.codice}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{s.nome}</span>
                </div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{(s.zona || '').replace('_', ' ').toUpperCase()} · {s.articoli_count || 0} articoli</div>
                <div style={{ height: 6, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' as const, marginTop: 6 }}>
                  <div style={{ width: `${s.saturazione_pct || 0}%`, height: '100%', background: col.border }} />
                </div>
              </div>
              {(s.articoli_sotto_scorta || 0) > 0 && (
                <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '4px 8px', borderRadius: 5, fontSize: 9, fontWeight: 800 }}>⚠ {s.articoli_sotto_scorta}</span>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

// =============== VIEW ARTICOLI ===============
function ViewArticoli({ articoli, scaffali, search }: any) {
  let filtered = articoli;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = articoli.filter((a: ArticoloMag) =>
      (a.codice || '').toLowerCase().includes(q) ||
      (a.nome || '').toLowerCase().includes(q) ||
      (a.descrizione || '').toLowerCase().includes(q) ||
      (a.categoria_operativa || '').toLowerCase().includes(q)
    );
  }
  if (filtered.length === 0) return <Empty label="Nessun articolo" />;

  const scaffMap: Record<string, Scaffale> = {};
  scaffali.forEach((s: Scaffale) => { scaffMap[s.id] = s; });

  return (
    <>
      {filtered.map((a: ArticoloMag) => {
        const sc = a.scaffale_id ? scaffMap[a.scaffale_id] : null;
        const col = sc ? getZonaCol(sc.zona) : ZONA_COLOR.default;
        const sottoScorta = Number(a.scorta_attuale) < Number(a.scorta_minima);
        return (
          <div key={a.id} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `4px solid ${sottoScorta ? RED : col.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 8, background: col.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{col.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ background: '#F1F4F7', color: TEXT, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{a.codice}</span>
                  {sc && <span style={{ background: col.bg, color: col.fg, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{sc.codice}</span>}
                  {sottoScorta && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>SCORTA BASSA</span>}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{a.nome}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{(a.categoria_operativa || '').toUpperCase()} · {a.scorta_attuale} {a.unita_misura}</div>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{a.scorta_attuale}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>min {a.scorta_minima}</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// =============== DRAWER SCAFFALE (CONTENUTO) ===============
function DrawerScaffale({ scaffale, articoli, onClose }: any) {
  const col = getZonaCol(scaffale.zona);
  const totValue = articoli.reduce((s: number, a: ArticoloMag) => s + (Number(a.prezzo_acquisto) * Number(a.scorta_attuale)), 0);
  const sottoScorta = articoli.filter((a: ArticoloMag) => Number(a.scorta_attuale) < Number(a.scorta_minima));

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto' as const, paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ background: col.border, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{col.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>SCAFFALE</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{scaffale.codice} · {scaffale.nome}</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{(scaffale.zona || '').replace('_', ' ').toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
        </div>

        {/* Stats */}
        <div style={{ padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 14 }}>
            <StatBox label="ARTICOLI" val={articoli.length} bg="#F1F4F7" fg={TEXT} />
            <StatBox label="VALORE" val={`€${Math.round(totValue).toLocaleString('it-IT')}`} bg="#E1F5EE" fg={TEAL_DEEP} />
            <StatBox label="SOTTO SCORTA" val={sottoScorta.length} bg={sottoScorta.length > 0 ? '#FEE2E2' : '#F1F4F7'} fg={sottoScorta.length > 0 ? '#991B1B' : MUTED} />
          </div>

          {/* Lista articoli */}
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>ARTICOLI ({articoli.length})</div>
          {articoli.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
              Scaffale vuoto
            </div>
          ) : (
            articoli.map((a: ArticoloMag) => {
              const sotto = Number(a.scorta_attuale) < Number(a.scorta_minima);
              return (
                <div key={a.id} style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 6, borderLeft: `3px solid ${sotto ? RED : col.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                        <span style={{ background: '#F1F4F7', color: TEXT, padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{a.codice}</span>
                        {sotto && <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>⚠ SCORTA</span>}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: TEXT }}>{a.nome}</div>
                      <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{(a.categoria_operativa || '').toUpperCase()} · €{Number(a.prezzo_acquisto).toFixed(2)}/{a.unita_misura}</div>
                    </div>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: sotto ? RED : TEXT }}>{a.scorta_attuale}</div>
                      <div style={{ fontSize: 9, color: MUTED }}>min {a.scorta_minima} {a.unita_misura}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
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

function StatBox({ label, val, bg, fg }: any) {
  return (
    <div style={{ background: bg, padding: '10px 8px', borderRadius: 8, textAlign: 'center' as const }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: fg }}>{val}</div>
      <div style={{ fontSize: 8, color: fg, fontWeight: 700, letterSpacing: 0.5, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function LegDot({ col, label }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, background: col, borderRadius: '50%' }} />
      <span style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
