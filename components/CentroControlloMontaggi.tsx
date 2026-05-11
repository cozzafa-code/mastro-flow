"use client";
// components/CentroControlloMontaggi.tsx
// Centro Controllo Montaggi - mockup approvato:
// - DA PIANIFICARE: commesse pronte materiali senza data
// - GIORNO: timeline orari per squadra
// - SETTIMANA: matrice squadre x giorni con saturazione
// - MESE: griglia con pallini + riepilogo

import React, { useState, useMemo } from "react";
import { useCentroMontaggi, type MontaggioRow } from "../hooks/useCentroMontaggi";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

type ViewMode = 'da-pianificare' | 'giorno' | 'settimana' | 'mese';

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

function fmtDate(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function startOfWeek(d: Date): Date { const x = new Date(d); x.setHours(0,0,0,0); const dow = x.getDay(); const diff = dow === 0 ? -6 : 1 - dow; x.setDate(x.getDate() + diff); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth()+1, 0); }

const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const GIORNI_ABBR = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];

function getMatColor(status: string) {
  if (status === 'completo') return TEAL;
  if (status === 'parziale') return AMBER;
  if (status === 'in_attesa') return RED;
  return MUTED;
}

export default function CentroControlloMontaggi({ aziendaId, onClose, onApriCommessa }: any) {
  const [view, setView] = useState<ViewMode>('da-pianificare');
  const [currentDate, setCurrentDate] = useState(new Date());
  const resolved = resolveAziendaId(aziendaId);

  const { from, to, label } = useMemo(() => {
    if (view === 'giorno') return { from: fmtDate(currentDate), to: fmtDate(currentDate), label: currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) };
    if (view === 'settimana') { const s = startOfWeek(currentDate); const e = addDays(s, 6); return { from: fmtDate(s), to: fmtDate(e), label: `${s.getDate()}-${e.getDate()} ${MESI[s.getMonth()]}` }; }
    if (view === 'mese') { const s = startOfMonth(currentDate); const e = endOfMonth(currentDate); return { from: fmtDate(s), to: fmtDate(e), label: `${MESI[currentDate.getMonth()]} ${currentDate.getFullYear()}` }; }
    // da-pianificare: tutto il mese corrente
    const s = startOfMonth(currentDate); const e = addDays(endOfMonth(currentDate), 30);
    return { from: fmtDate(s), to: fmtDate(e), label: 'Tutte da pianificare' };
  }, [view, currentDate]);

  const { montaggi, loading } = useCentroMontaggi(resolved, from, to);

  const nav = (delta: number) => {
    const d = new Date(currentDate);
    if (view === 'giorno') d.setDate(d.getDate() + delta);
    else if (view === 'settimana') d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setCurrentDate(d);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto', paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>CENTRO CONTROLLO</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>Montaggi · {label}</div>
          </div>
        </div>
        {view !== 'da-pianificare' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => nav(-1)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Oggi</button>
            <button onClick={() => nav(+1)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', margin: '-10px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative', zIndex: 2, overflowX: 'auto' }}>
        {([
          { k: 'da-pianificare', l: 'Da pianificare' },
          { k: 'giorno', l: 'Giorno' },
          { k: 'settimana', l: 'Settimana' },
          { k: 'mese', l: 'Mese' },
        ] as { k: ViewMode; l: string }[]).map(opt => (
          <button key={opt.k} onClick={() => setView(opt.k)} style={{ flex: 1, padding: '9px 0', fontSize: 11, fontWeight: 500, color: view === opt.k ? '#fff' : MUTED, background: view === opt.k ? NAVY : 'transparent', border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>{opt.l}</button>
        ))}
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         view === 'da-pianificare' ? <ViewDaPianificare aziendaId={resolved} onApri={onApriCommessa} /> :
         view === 'giorno' ? <ViewGiorno montaggi={montaggi} onApri={onApriCommessa} /> :
         view === 'settimana' ? <ViewSettimana montaggi={montaggi} fromDate={from} onApri={onApriCommessa} /> :
         <ViewMese montaggi={montaggi} currentDate={currentDate} onClickDay={(d: Date) => { setCurrentDate(d); setView('giorno'); }} />}
      </div>
    </div>
  );
}

// =============== VISTA DA PIANIFICARE ===============
function ViewDaPianificare({ aziendaId, onApri }: any) {
  const [commesse, setCommesse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!aziendaId) { setLoading(false); return; }
    (async () => {
      const { supabase } = await import("@/lib/supabase");
      const { data } = await supabase
        .from('commesse')
        .select('id, code, cliente, cognome, indirizzo, materiali_status, materiali_perc, fase, totale_finale, total_vani')
        .eq('azienda_id', aziendaId)
        .in('fase', ['ordine','acconto_pagato','produzione','montaggio'])
        .order('materiali_perc', { ascending: false });
      setCommesse(data || []);
      setLoading(false);
    })();
  }, [aziendaId]);

  if (loading) return <Empty label="Caricamento..." />;
  if (commesse.length === 0) return <Empty label="Nessuna commessa da pianificare" />;

  return (
    <>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>COMMESSE ({commesse.length})</div>
      {commesse.map(c => (
        <div key={c.id} onClick={() => onApri?.(c.id)} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `4px solid ${getMatColor(c.materiali_status)}`, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{c.code} · {c.cliente} {c.cognome || ''}</div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{c.indirizzo || 'no indirizzo'} · {c.total_vani || 0} vani</div>
            </div>
            <span style={{ background: getMatColor(c.materiali_status) + '22', color: getMatColor(c.materiali_status), fontSize: 9, padding: '3px 7px', borderRadius: 5, fontWeight: 600 }}>{c.materiali_perc}% MAT</span>
          </div>
          <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${c.materiali_perc}%`, height: '100%', background: getMatColor(c.materiali_status) }} />
          </div>
        </div>
      ))}
    </>
  );
}

// =============== VISTA GIORNO ===============
function ViewGiorno({ montaggi, onApri }: any) {
  const bySquadra = useMemo(() => {
    const map: Record<string, MontaggioRow[]> = {};
    montaggi.forEach((m: MontaggioRow) => {
      const k = m.squadra_label || 'Da assegnare';
      if (!map[k]) map[k] = [];
      map[k].push(m);
    });
    return map;
  }, [montaggi]);

  if (montaggi.length === 0) return <Empty label="Nessun montaggio oggi" />;

  return (
    <>
      {Object.entries(bySquadra).map(([sq, items]) => {
        const ore = (items as MontaggioRow[]).reduce((s, m) => s + m.ore_preventivate, 0);
        const isFull = ore >= 8;
        return (
          <div key={sq} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: isFull ? RED : TEAL, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{sq.slice(0,3).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Sq. {sq}</div>
                <div style={{ fontSize: 9, color: MUTED }}>{ore}h · {items.length} montaggi</div>
              </div>
              <span style={{ background: isFull ? '#FEE2E2' : '#E1F5EE', color: isFull ? '#991B1B' : '#0F6E56', fontSize: 9, padding: '3px 7px', borderRadius: 5, fontWeight: 600 }}>{isFull ? 'PIENO' : 'OK'}</span>
            </div>
            <div style={{ background: '#F8FAFA', borderRadius: 8, padding: 8 }}>
              {Array.from({length: 10}, (_, i) => 8 + i).map(hour => {
                const block = (items as MontaggioRow[]).find(m => {
                  const start = m.ora_inizio ? parseInt(m.ora_inizio.split(':')[0]) : 8;
                  const end = m.ora_fine ? parseInt(m.ora_fine.split(':')[0]) : start + m.ore_preventivate;
                  return hour >= start && hour < end;
                });
                const isPranzo = hour === 13;
                return (
                  <div key={hour} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                    <div style={{ fontSize: 9, color: MUTED, textAlign: 'right' as const, fontWeight: 500 }}>{hour}</div>
                    <div onClick={() => block && onApri?.(block.commessa_id)} style={{ height: 28, background: block ? getMatColor(block.materiali_status) : (isPranzo ? '#FEF3C7' : '#F8FAFA'), borderRadius: 5, border: block ? 'none' : '1px solid #EFF2F4', display: 'flex', alignItems: 'center', padding: '0 8px', cursor: block ? 'pointer' : 'default' }}>
                      {block && <div style={{ color: '#fff', fontSize: 9, fontWeight: 600 }}>{block.commessa_code} {block.commessa_cliente} · {block.ore_preventivate}h</div>}
                      {isPranzo && !block && <div style={{ color: '#92400E', fontSize: 8, fontWeight: 600 }}>PRANZO</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

// =============== VISTA SETTIMANA ===============
function ViewSettimana({ montaggi, fromDate, onApri }: any) {
  const dates = Array.from({length: 5}, (_, i) => fmtDate(addDays(new Date(fromDate), i)));
  const squadre = Array.from(new Set(montaggi.map((m: MontaggioRow) => m.squadra_label || 'Da assegnare')));
  if (squadre.length === 0) squadre.push('Da assegnare');

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gap: 3, fontSize: 8, color: MUTED, textAlign: 'center' as const, fontWeight: 600, marginBottom: 6 }}>
        <div></div>
        {dates.map(d => {
          const dt = new Date(d);
          return <div key={d}>{GIORNI_ABBR[(dt.getDay()+6)%7]}<div style={{ fontSize: 11, color: TEXT, marginTop: 2 }}>{dt.getDate()}</div></div>;
        })}
      </div>
      {(squadre as string[]).map(sq => (
        <div key={sq} style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: NAVY, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 600 }}>{sq.slice(0,3).toUpperCase()}</div>
          </div>
          {dates.map(d => {
            const cell = montaggi.find((m: MontaggioRow) => m.data_montaggio === d && (m.squadra_label || 'Da assegnare') === sq);
            const ore = cell?.ore_preventivate || 0;
            const bg = !cell ? '#F8FAFA' : ore >= 8 ? '#FEE2E2' : '#FEF3C7';
            const fg = !cell ? MUTED : ore >= 8 ? '#991B1B' : '#92400E';
            return (
              <div key={d} onClick={() => cell && onApri?.(cell.commessa_id)} style={{ background: bg, padding: '5px 3px', borderRadius: 5, minHeight: 50, cursor: cell ? 'pointer' : 'default' }}>
                {cell ? (
                  <>
                    <div style={{ fontSize: 8, fontWeight: 600, color: fg }}>{ore}h</div>
                    <div style={{ fontSize: 8, color: fg, marginTop: 2 }}>{cell.commessa_code}</div>
                  </>
                ) : <div style={{ fontSize: 8, color: MUTED }}>libero</div>}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, fontSize: 9, color: MUTED, justifyContent: 'center' }}>
        <Legend color="#FEE2E2" label="Pieno" />
        <Legend color="#FEF3C7" label="Parziale" />
        <Legend color="#F8FAFA" label="Libero" />
      </div>
    </div>
  );
}

// =============== VISTA MESE ===============
function ViewMese({ montaggi, currentDate, onClickDay }: any) {
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const firstDow = (start.getDay() + 6) % 7;
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDow; i++) days.push(null);
  for (let d = 1; d <= end.getDate(); d++) days.push(new Date(start.getFullYear(), start.getMonth(), d));

  const byDay: Record<string, MontaggioRow[]> = {};
  montaggi.forEach((m: MontaggioRow) => {
    if (!m.data_montaggio) return;
    if (!byDay[m.data_montaggio]) byDay[m.data_montaggio] = [];
    byDay[m.data_montaggio].push(m);
  });

  const today = fmtDate(new Date());
  const tot = montaggi.length;
  const ritardo = montaggi.filter((m: MontaggioRow) => m.materiali_status === 'in_attesa').length;
  const attenz = montaggi.filter((m: MontaggioRow) => m.materiali_status === 'parziale').length;
  const tempo = Math.max(0, tot - ritardo - attenz);

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: 10, marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, fontSize: 8, color: MUTED, textAlign: 'center' as const, fontWeight: 600, marginBottom: 5 }}>
          {['L','M','M','G','V','S','D'].map((g,i) => <div key={i}>{g}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {days.map((d, i) => {
            if (!d) return <div key={i} style={{ aspectRatio: '1', background: 'transparent', minHeight: 40 }} />;
            const ds = fmtDate(d);
            const items = byDay[ds] || [];
            const isToday = ds === today;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <div key={i} onClick={() => onClickDay?.(d)} style={{ aspectRatio: '1', background: isToday ? NAVY : '#fff', borderRadius: 6, padding: '4px 3px', fontSize: 8, position: 'relative' as const, minHeight: 40, opacity: isWeekend && !isToday ? 0.5 : 1, cursor: 'pointer', border: '1px solid #F1F4F7' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: isToday ? '#fff' : TEXT }}>{d.getDate()}</div>
                <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap' as const, gap: 1 }}>
                  {items.slice(0,3).map((m, j) => (
                    <span key={j} style={{ width: 5, height: 5, borderRadius: '50%', background: isToday ? '#fff' : getMatColor(m.materiali_status), display: 'inline-block' }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ padding: 12, background: '#fff', borderRadius: 12 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>RIEPILOGO MESE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <RiepCell n={tempo} label="in tempo" color={TEAL_DEEP} />
          <RiepCell n={attenz} label="attenz." color={AMBER} />
          <RiepCell n={ritardo} label="ritardo" color={RED} />
        </div>
      </div>
    </>
  );
}

function Empty({ label }: any) { return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>{label}</div>; }
function Legend({ color, label }: any) { return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: color, borderRadius: 3 }} />{label}</div>; }
function RiepCell({ n, label, color }: any) { return <div style={{ textAlign: 'center' as const }}><div style={{ fontSize: 20, fontWeight: 600, color }}>{n}</div><div style={{ fontSize: 9, color: MUTED }}>{label}</div></div>; }
