"use client";
// components/CentroControlloMontaggi.tsx
// Mockup approvato - 4 viste:
// 1. DA PIANIFICARE + MAPPA
// 2. GIORNO: timeline orari per squadra + slider durata
// 3. SETTIMANA: matrice squadre x giorni (ALF/BET/SAM stile) saturazione colorata
// 4. MESE: griglia con pallini colorati + RIEPILOGO MESE (numeri grandi 23/6/3) + legenda

import React, { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
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
    if (view === 'settimana') { const s = startOfWeek(currentDate); const e = addDays(s, 6); return { from: fmtDate(s), to: fmtDate(e), label: `Sett. ${s.getDate()}-${e.getDate()} ${MESI[s.getMonth()].slice(0,3).toLowerCase()}` }; }
    if (view === 'mese') { const s = startOfMonth(currentDate); const e = endOfMonth(currentDate); return { from: fmtDate(s), to: fmtDate(e), label: `${MESI[currentDate.getMonth()]} ${currentDate.getFullYear()}` }; }
    const s = startOfMonth(currentDate); const e = addDays(endOfMonth(currentDate), 30);
    return { from: fmtDate(s), to: fmtDate(e), label: 'Da pianificare' };
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
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>MONTAGGI</div>
            <div style={{ fontSize: 17, fontWeight: 600, marginTop: 2 }}>{label}</div>
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

      <div style={{ background: '#fff', margin: '-10px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, position: 'relative' as const, zIndex: 2, overflowX: 'auto' as const }}>
        {([
          { k: 'da-pianificare' as ViewMode, l: 'Pianifica' },
          { k: 'giorno' as ViewMode, l: 'Giorno' },
          { k: 'settimana' as ViewMode, l: 'Settimana' },
          { k: 'mese' as ViewMode, l: 'Mese' },
        ]).map(opt => (
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

// =============== VISTA 1: DA PIANIFICARE + MAPPA ===============
function ViewDaPianificare({ aziendaId, onApri }: any) {
  const [commesse, setCommesse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!aziendaId) { setLoading(false); return; }
    (async () => {
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

  const pronte = commesse.filter(c => c.materiali_status === 'completo').length;
  const parziali = commesse.filter(c => c.materiali_status === 'parziale').length;
  const attesa = commesse.filter(c => c.materiali_status === 'in_attesa').length;

  return (
    <>
      <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>STATO MATERIALI</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          <StatoBadge n={pronte} label="PRONTE" bg="#E1F5EE" border={TEAL} fg={TEAL_DEEP} />
          <StatoBadge n={parziali} label="PARZIALI" bg="#FEF3C7" border={AMBER} fg="#92400E" />
          <StatoBadge n={attesa} label="IN ATTESA" bg="#FEE2E2" border={RED} fg="#991B1B" />
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, position: 'relative' as const }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>MAPPA CANTIERI</div>
        <div style={{ background: 'linear-gradient(135deg, #F0F7F4 0%, #E1F5EE 100%)', borderRadius: 8, height: 140, position: 'relative' as const, overflow: 'hidden' as const, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {commesse.slice(0, 6).map((c, i) => {
            const x = 15 + (i * 13) % 75;
            const y = 20 + (i * 17) % 60;
            return (
              <div key={c.id} onClick={() => onApri?.(c.id)} style={{ position: 'absolute' as const, left: `${x}%`, top: `${y}%`, width: 18, height: 18, borderRadius: '50%', background: getMatColor(c.materiali_status), border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700 }}>
                {i+1}
              </div>
            );
          })}
          <div style={{ position: 'absolute' as const, bottom: 8, right: 8, background: 'rgba(255,255,255,0.9)', padding: '4px 8px', borderRadius: 5, fontSize: 9, fontWeight: 600, color: TEXT }}>{commesse.length} cantieri</div>
        </div>
      </div>

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
          <div style={{ height: 5, background: '#F1F4F7', borderRadius: 3, overflow: 'hidden' as const }}>
            <div style={{ width: `${c.materiali_perc}%`, height: '100%', background: getMatColor(c.materiali_status) }} />
          </div>
        </div>
      ))}
    </>
  );
}

// =============== VISTA 2: GIORNO con slider durata ===============
function ViewGiorno({ montaggi, onApri }: any) {
  const [selectedMont, setSelectedMont] = useState<MontaggioRow | null>(null);
  const [durata, setDurata] = useState(4);
  const [oraInizio, setOraInizio] = useState(8);

  useEffect(() => {
    if (selectedMont) {
      setDurata(selectedMont.ore_preventivate || 4);
      setOraInizio(selectedMont.ora_inizio ? parseInt(selectedMont.ora_inizio.split(':')[0]) : 8);
    }
  }, [selectedMont]);

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

  const oraFine = oraInizio + durata;
  const oraFineFmt = oraFine > 24 ? `${oraFine - 24}:00` : `${oraFine}:00`;

  return (
    <>
      {selectedMont && (
        <div style={{ background: NAVY, color: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
          <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>PIANIFICA · {selectedMont.commessa_code}</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{selectedMont.commessa_cliente}</div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 6 }}>Durata: <strong>{durata}h</strong> · Orario: <strong>{oraInizio}:00 → {oraFineFmt}</strong></div>
            <input type="range" min={1} max={10} value={durata} onChange={(e) => setDurata(Number(e.target.value))} style={{ width: '100%', accentColor: TEAL }} />
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 8 }}>
            <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 6 }}>Ora inizio</div>
            <input type="range" min={7} max={18} value={oraInizio} onChange={(e) => setOraInizio(Number(e.target.value))} style={{ width: '100%', accentColor: TEAL }} />
          </div>
          <button onClick={() => setSelectedMont(null)} style={{ marginTop: 10, width: '100%', background: TEAL, color: '#fff', border: 'none', padding: 10, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Chiudi</button>
        </div>
      )}

      {Object.entries(bySquadra).map(([sq, items]) => {
        const ore = (items as MontaggioRow[]).reduce((s, m) => s + m.ore_preventivate, 0);
        const isFull = ore >= 8;
        const isMedium = ore >= 4 && ore < 8;
        const sqColor = isFull ? RED : isMedium ? AMBER : TEAL;
        return (
          <div key={sq} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: sqColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{sq.slice(0,3).toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>Sq. {sq}</div>
                <div style={{ fontSize: 9, color: MUTED }}>{ore}h · {items.length} montaggi</div>
              </div>
              <span style={{ background: isFull ? '#FEE2E2' : isMedium ? '#FEF3C7' : '#E1F5EE', color: isFull ? '#991B1B' : isMedium ? '#92400E' : TEAL_DEEP, fontSize: 9, padding: '3px 7px', borderRadius: 5, fontWeight: 600 }}>{isFull ? 'PIENO' : isMedium ? 'MEDIO' : 'OK'}</span>
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
                    <div onClick={() => block && setSelectedMont(block)} style={{ height: 28, background: block ? getMatColor(block.materiali_status) : (isPranzo ? '#FEF3C7' : '#F8FAFA'), borderRadius: 5, border: block ? 'none' : '1px solid #EFF2F4', display: 'flex', alignItems: 'center', padding: '0 8px', cursor: block ? 'pointer' : 'default' }}>
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

// =============== VISTA 3: SETTIMANA matrice squadre × giorni ===============
function ViewSettimana({ montaggi, fromDate, onApri }: any) {
  const dates = Array.from({length: 5}, (_, i) => fmtDate(addDays(new Date(fromDate), i)));
  
  // Estrai squadre uniche, con almeno una di default
  let squadre = Array.from(new Set(montaggi.map((m: MontaggioRow) => m.squadra_label || 'Da assegnare'))) as string[];
  if (squadre.length === 0) squadre = ['ALF', 'BET', 'SAM'];

  const colorPerSquadra = (sq: string) => {
    const seed = sq.charCodeAt(0);
    return [NAVY, TEAL, RED, AMBER, TEAL_DEEP][seed % 5];
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gap: 3, fontSize: 8, color: MUTED, textAlign: 'center' as const, fontWeight: 600, marginBottom: 6 }}>
        <div></div>
        {dates.map(d => {
          const dt = new Date(d);
          return <div key={d}>{GIORNI_ABBR[(dt.getDay()+6)%7]}<div style={{ fontSize: 11, color: TEXT, marginTop: 2 }}>{dt.getDate()}</div></div>;
        })}
      </div>
      {squadre.map(sq => (
        <div key={sq} style={{ display: 'grid', gridTemplateColumns: '40px repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: colorPerSquadra(sq), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700 }}>{sq.slice(0,3).toUpperCase()}</div>
          </div>
          {dates.map(d => {
            const cell = montaggi.find((m: MontaggioRow) => m.data_montaggio === d && (m.squadra_label || 'Da assegnare') === sq);
            const ore = cell?.ore_preventivate || 0;
            const bg = !cell ? '#F8FAFA' : ore >= 8 ? '#FEE2E2' : ore >= 4 ? '#FEF3C7' : '#E1F5EE';
            const fg = !cell ? MUTED : ore >= 8 ? '#991B1B' : ore >= 4 ? '#92400E' : TEAL_DEEP;
            return (
              <div key={d} onClick={() => cell && onApri?.(cell.commessa_id)} style={{ background: bg, padding: '5px 3px', borderRadius: 5, minHeight: 50, cursor: cell ? 'pointer' : 'default', textAlign: 'center' as const }}>
                {cell ? (
                  <>
                    <div style={{ fontSize: 9, fontWeight: 700, color: fg }}>{ore}h</div>
                    <div style={{ fontSize: 8, color: fg, marginTop: 2 }}>{cell.commessa_code}</div>
                  </>
                ) : <div style={{ fontSize: 8, color: MUTED, marginTop: 14 }}>libero</div>}
              </div>
            );
          })}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 12, fontSize: 9, color: MUTED, justifyContent: 'center' }}>
        <Legend color="#FEE2E2" label="Pieno" />
        <Legend color="#FEF3C7" label="Parziale" />
        <Legend color="#E1F5EE" label="Libero" />
      </div>
    </div>
  );
}

// =============== VISTA 4: MESE con riepilogo ===============
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

      <div style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 10, fontWeight: 600 }}>RIEPILOGO MESE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          <RiepCell n={tempo} label="in tempo" color={TEAL_DEEP} />
          <RiepCell n={attenz} label="attenz." color={AMBER} />
          <RiepCell n={ritardo} label="ritardo" color={RED} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, fontSize: 9, color: MUTED, justifyContent: 'center', padding: '8px 0' }}>
        <LegendDot color={TEAL} label="In tempo" />
        <LegendDot color={AMBER} label="Attenz." />
        <LegendDot color={RED} label="Ritardo" />
      </div>
    </>
  );
}

function Empty({ label }: any) { return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>{label}</div>; }
function Legend({ color, label }: any) { return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, background: color, borderRadius: 3 }} />{label}</div>; }
function LegendDot({ color, label }: any) { return <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, background: color, borderRadius: '50%' }} />{label}</div>; }
function RiepCell({ n, label, color }: any) { return <div style={{ textAlign: 'center' as const, padding: '8px 4px' }}><div style={{ fontSize: 28, fontWeight: 600, color, lineHeight: 1 }}>{n}</div><div style={{ fontSize: 10, color: MUTED, marginTop: 6 }}>{label}</div></div>; }
function StatoBadge({ n, label, bg, border, fg }: any) { return <div style={{ background: bg, border: `1.5px solid ${border}`, borderRadius: 8, padding: 8, textAlign: 'center' as const }}><div style={{ fontSize: 9, color: fg, fontWeight: 700, letterSpacing: 0.5 }}>{label}</div><div style={{ fontSize: 22, fontWeight: 700, color: fg, marginTop: 4 }}>{n}</div></div>; }
