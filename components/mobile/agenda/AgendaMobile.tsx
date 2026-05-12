// components/mobile/agenda/AgendaMobile.tsx
// Vista operativa MASTRO - 3 viste (Giorno/Settimana/Mese) + filtri + task
// Sostituisce AgendaMobile vecchio mantenendo stesse props
"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import AgendaEventSheetMobile from "./AgendaEventSheetMobile";
import AgendaBottomNav from "./AgendaBottomNav";
import { useAgendaMobile } from "../../../hooks/useAgendaMobile";
import { supabase } from "../../../lib/supabase";

const NAVY = '#1B3A5C', NAVY_DEEP = '#0F1F33';
const TEAL = '#28A0A0', TEAL_DARK = '#1B6B6B';
const RED = '#C73E1D', AMBER = '#BA7517', GREEN = '#0F6E56';
const TEXT = '#0F1F33', MUTED = '#5C6B7A', BORDER = '#E5E7EB';
const BG_SOFT = '#F7F9FB', BG_PALE = '#F1F4F7';
const SWIPE_THRESHOLD = 50;
const MESI = ['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'];
const DOW = ['L','M','M','G','V','S','D'];
const DOW_FULL = ['LUN','MAR','MER','GIO','VEN','SAB','DOM'];

const TIPI: Record<string, { label: string; color: string; gradientFrom: string; gradientTo: string }> = {
  montaggio: { label: 'MONTAGGIO', color: NAVY, gradientFrom: NAVY, gradientTo: NAVY_DEEP },
  sopralluogo: { label: 'SOPRALLUOGO', color: AMBER, gradientFrom: AMBER, gradientTo: '#8B5500' },
  rilievo: { label: 'RILIEVO', color: AMBER, gradientFrom: AMBER, gradientTo: '#8B5500' },
  firma: { label: 'FIRMA', color: GREEN, gradientFrom: GREEN, gradientTo: '#0A4D3C' },
  consegna: { label: 'CONSEGNA', color: TEAL, gradientFrom: TEAL, gradientTo: TEAL_DARK },
  default: { label: 'EVENTO', color: MUTED, gradientFrom: MUTED, gradientTo: NAVY_DEEP },
};

const FILTRI = [
  { id: 'tutti', label: 'TUTTI', color: NAVY },
  { id: 'eventi', label: 'EVENTI', color: NAVY },
  { id: 'task', label: 'TASK', color: TEAL },
  { id: 'montaggio', label: 'MONTAGGI', color: NAVY },
  { id: 'sopralluogo', label: 'SOPRALL.', color: AMBER },
  { id: 'firma', label: 'FIRME', color: GREEN },
  { id: 'consegna', label: 'CONSEGNE', color: TEAL },
];

function getTipo(e: any) {
  const t = (e?.tipo || e?.type || '').toLowerCase();
  if (t.includes('mont') || t.includes('posa')) return 'montaggio';
  if (t.includes('sopral') || t.includes('rilievo') || t.includes('misure')) return 'sopralluogo';
  if (t.includes('firma') || t.includes('contratto')) return 'firma';
  if (t.includes('conseg')) return 'consegna';
  return 'default';
}

function parseEventDate(e: any): Date {
  if (e?.data) {
    const d = new Date(e.data);
    const ora = e?.ora_inizio || e?.ora || e?.time;
    if (ora) { const [h, m] = String(ora).split(':').map(Number); if (!isNaN(h)) d.setHours(h || 0, m || 0); }
    return d;
  }
  if (e?.date) {
    const d = new Date(e.date);
    if (e?.time) { const [h, m] = String(e.time).split(':').map(Number); if (!isNaN(h)) d.setHours(h || 0, m || 0); }
    return d;
  }
  return new Date(e?.start || 0);
}
function parseEventEndDate(e: any): Date {
  const start = parseEventDate(e);
  if (e?.ora_fine) {
    const d = new Date(start);
    const [h, m] = String(e.ora_fine).split(':').map(Number);
    if (!isNaN(h)) d.setHours(h || 0, m || 0);
    return d;
  }
  if (e?.durata_min) return new Date(start.getTime() + Number(e.durata_min) * 60000);
  return new Date(start.getTime() + 60 * 60000);
}
function eventTitle(e: any) { return e?.titolo || e?.text || e?.title || 'Evento'; }
function eventLuogo(e: any) { return e?.indirizzo || e?.addr || e?.luogo || ''; }
function eventImporto(e: any, cm: any) {
  if (e?.importo) return Number(e.importo);
  if (cm?.totale) return Number(cm.totale);
  return 0;
}
function fmtEuro(n: number) {
  if (!n) return '';
  if (n >= 1000) return `€${(n / 1000).toFixed(1)}k`;
  return `€${Math.round(n)}`;
}

function SwipeArea({ children, onSwipeLeft, onSwipeRight, style }: any) {
  const sX = useRef<number | null>(null), sY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { sX.current = e.touches[0].clientX; sY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (sX.current == null || sY.current == null) return;
    const dx = e.changedTouches[0].clientX - sX.current;
    const dy = e.changedTouches[0].clientY - sY.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onSwipeLeft?.(); else onSwipeRight?.();
    }
    sX.current = null; sY.current = null;
  };
  return <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={style}>{children}</div>;
}

interface Props {
  bottomNav?: React.ReactNode;
  hideBottomNav?: boolean;
  cantieri?: any[];
  onOpenCommessa?: (cmId: string | undefined, code: string | undefined) => void;
  onCreateEvent?: (kind: string, dateIso: string) => void;
}

export default function AgendaMobile({ bottomNav, hideBottomNav, cantieri = [], onOpenCommessa, onCreateEvent }: Props) {
  const a: any = useAgendaMobile(cantieri);
  const [view, setView] = useState<'giorno' | 'settimana' | 'mese'>('giorno');
  const [cursor, setCursor] = useState(new Date());
  const [filtro, setFiltro] = useState<string>('tutti');
  const [sheetEvento, setSheetEvento] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksDone, setTasksDone] = useState<Record<string, boolean>>({});
  const [eventiDB, setEventiDB] = useState<any[]>([]);
  const today = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  // Fetch eventi diretti da Supabase (sincronizzati con HOME)
  useEffect(() => {
    let mounted = true;
    const loadEventi = async () => {
      try {
        const az = (typeof window !== 'undefined' ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id') || '') : '');
        if (!az) return;
        const { data, error } = await supabase
          .from('eventi')
          .select('*')
          .eq('azienda_id', az)
          .order('data', { ascending: true });
        if (error) { console.error('load eventi', error); return; }
        if (mounted) setEventiDB(data || []);
      } catch (err) { console.error('eventi fetch', err); }
    };
    loadEventi();
    // Auto-refresh ogni 30s per sincro con HOME
    const interval = setInterval(loadEventi, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Fetch tasks
  useEffect(() => {
    let mounted = true;
    const loadTasks = async () => {
      try {
        const az = (typeof window !== 'undefined' ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id') || '') : '');
        if (!az) return;
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('azienda_id', az)
          .eq('done', false)
          .order('data', { ascending: true });
        if (error) { console.error('load tasks', error); return; }
        if (mounted) setTasks(data || []);
      } catch (err) { console.error('tasks fetch', err); }
    };
    loadTasks();
    return () => { mounted = false; };
  }, []);

  const toggleTask = async (id: string, currentDone: boolean) => {
    setTasksDone(prev => ({ ...prev, [id]: !currentDone }));
    try {
      await supabase.from('tasks').update({ done: !currentDone, done_at: !currentDone ? new Date().toISOString() : null }).eq('id', id);
    } catch (err) {
      console.error('toggle task', err);
      setTasksDone(prev => ({ ...prev, [id]: currentDone }));
    }
  };

  const eventi = useMemo(() => {
    // PRIORITÀ: eventi reali da Supabase (sincronizzati con HOME)
    const evs = eventiDB.filter((e: any) => !e?.completato && !e?.annullato && !e?.deleted_at).map((e: any) => ({ ...e, _kind: 'evento' }));
    const tks = tasks.filter((t: any) => !t?.done && !tasksDone[t?.id]).map((t: any) => ({ ...t, _kind: 'task', titolo: t?.testo, data: t?.data || t?.scadenza }));
    return [...evs, ...tks];
  }, [eventiDB, tasks, tasksDone]);

  const team = a?.team || [];

  const eventiFiltrati = useMemo(() => {
    if (filtro === 'tutti') return eventi;
    if (filtro === 'eventi') return eventi.filter((e: any) => e._kind === 'evento');
    if (filtro === 'task') return eventi.filter((e: any) => e._kind === 'task');
    return eventi.filter((e: any) => e._kind === 'evento' && getTipo(e) === filtro);
  }, [eventi, filtro]);

  const eventByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    eventiFiltrati.forEach((e: any) => {
      const d = parseEventDate(e);
      if (isNaN(d.getTime())) return;
      const k = d.toDateString();
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    Object.keys(map).forEach(k => map[k].sort((a, b) => parseEventDate(a).getTime() - parseEventDate(b).getTime()));
    return map;
  }, [eventiFiltrati]);

  const eventiSel = eventByDay[cursor.toDateString()] || [];

  const kpiGiorno = useMemo(() => {
    const evs = eventByDay[cursor.toDateString()] || [];
    const valore = evs.reduce((s, e) => {
      const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
      return s + eventImporto(e, cm);
    }, 0);
    const completati = evs.filter((e: any) => e?.completato).length;
    return { count: evs.length, valore, completati };
  }, [eventByDay, cursor, cantieri]);

  const weekDays = useMemo(() => {
    const dow = (cursor.getDay() + 6) % 7;
    const start = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - dow);
    return Array.from({ length: 7 }).map((_, i) => new Date(start.getTime() + i * 86400000));
  }, [cursor]);

  const kpiSettimana = useMemo(() => {
    let count = 0, valore = 0;
    weekDays.forEach(d => {
      const evs = eventByDay[d.toDateString()] || [];
      count += evs.length;
      evs.forEach((e: any) => {
        const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
        valore += eventImporto(e, cm);
      });
    });
    const maxCount = Math.max(...weekDays.map(d => (eventByDay[d.toDateString()] || []).length), 1);
    return { count, valore, maxCount };
  }, [eventByDay, weekDays, cantieri]);

  const monthDays = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const last = new Date(y, m + 1, 0);
    const startDow = (new Date(y, m, 1).getDay() + 6) % 7;
    const days: { date: Date; muted: boolean }[] = [];
    for (let i = startDow; i > 0; i--) days.push({ date: new Date(y, m, 1 - i), muted: true });
    for (let d = 1; d <= last.getDate(); d++) days.push({ date: new Date(y, m, d), muted: false });
    while (days.length % 7 !== 0) {
      const ld = days[days.length - 1].date;
      days.push({ date: new Date(ld.getFullYear(), ld.getMonth(), ld.getDate() + 1), muted: true });
    }
    return days;
  }, [cursor]);

  const kpiMese = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const monthEvs = eventiFiltrati.filter((e: any) => {
      const d = parseEventDate(e); return d.getFullYear() === y && d.getMonth() === m;
    });
    const valore = monthEvs.reduce((s, e) => {
      const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
      return s + eventImporto(e, cm);
    }, 0);
    const perTipo: Record<string, number> = { montaggio: 0, sopralluogo: 0, firma: 0, consegna: 0 };
    monthEvs.forEach((e: any) => { const t = getTipo(e); if (perTipo[t] !== undefined) perTipo[t]++; });
    const counts = monthDays.map(d => (eventByDay[d.date.toDateString()] || []).length);
    const maxDay = Math.max(...counts, 1);
    return { count: monthEvs.length, valore, perTipo, maxDay };
  }, [eventiFiltrati, eventByDay, monthDays, cursor, cantieri]);

  const goPrev = () => {
    if (view === 'mese') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    else if (view === 'settimana') setCursor(new Date(cursor.getTime() - 7 * 86400000));
    else setCursor(new Date(cursor.getTime() - 86400000));
  };
  const goNext = () => {
    if (view === 'mese') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
    else if (view === 'settimana') setCursor(new Date(cursor.getTime() + 7 * 86400000));
    else setCursor(new Date(cursor.getTime() + 86400000));
  };
  const goOggi = () => setCursor(new Date());

  const apriEvento = (e: any) => {
    setSheetEvento(e);
  };

  const apriCommessa = (cmId: string) => {
    const cm = cantieri.find((c: any) => c?.id === cmId);
    onOpenCommessa?.(cmId, cm?.code || cm?.codice);
  };

  return (
    <div style={{ background: BG_SOFT, minHeight: '100vh' }}>
      {/* Header navy gradient con safe-area */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <HeaderCal
          view={view} setView={setView}
          cursor={cursor} goPrev={goPrev} goNext={goNext} goOggi={goOggi}
          isToday={isSameDay(cursor, today)}
          kpiGiorno={kpiGiorno} kpiSettimana={kpiSettimana} kpiMese={kpiMese}
          weekDays={weekDays}
          onCreateEvent={() => onCreateEvent?.('evento', cursor.toISOString())}
        />
      </div>

      <FiltriBar filtro={filtro} setFiltro={setFiltro} />

      <div style={{ paddingBottom: 140 }}>
      {view === 'giorno' && (
        <SwipeArea onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <VistaGiorno eventi={eventiSel} cantieri={cantieri} team={team} onApriEvento={apriEvento} onToggleTask={toggleTask} cursor={cursor} today={today} />
        </SwipeArea>
      )}

      {view === 'settimana' && (
        <SwipeArea onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <VistaSettimana
            weekDays={weekDays} cursor={cursor} setCursor={setCursor}
            eventByDay={eventByDay} cantieri={cantieri}
            maxCount={kpiSettimana.maxCount} today={today}
            onApriEvento={apriEvento} onToggleTask={toggleTask}
          />
        </SwipeArea>
      )}

      {view === 'mese' && (
        <SwipeArea onSwipeLeft={goNext} onSwipeRight={goPrev}>
          <VistaMese
            monthDays={monthDays} cursor={cursor} setCursor={setCursor}
            eventByDay={eventByDay} cantieri={cantieri}
            maxDay={kpiMese.maxDay} today={today}
            onApriEvento={apriEvento} onToggleTask={toggleTask}
            eventiSel={eventiSel}
          />
        </SwipeArea>
      )}
      </div>

      {sheetEvento && (
        <AgendaEventSheetMobile
          event={sheetEvento}
          cantieri={cantieri}
          onClose={() => setSheetEvento(null)}
          onOpenCommessa={onOpenCommessa}
          onUpdate={a?.updateEvent}
          onDelete={a?.deleteEvent}
        />
      )}

      {!hideBottomNav && bottomNav}
    </div>
  );
}

function HeaderCal({ view, setView, cursor, goPrev, goNext, goOggi, isToday, kpiGiorno, kpiSettimana, kpiMese, weekDays, onCreateEvent }: any) {
  const titolo = view === 'giorno'
    ? cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : view === 'settimana'
      ? `${weekDays[0].getDate()}–${weekDays[6].getDate()} ${MESI[weekDays[6].getMonth()]}`
      : `${MESI[cursor.getMonth()]} ${cursor.getFullYear()}`;

  const subtitle = view === 'giorno' ? (isToday ? 'OGGI' : 'GIORNO')
    : view === 'settimana' ? 'SETTIMANA'
    : 'MESE';

  const kpiCount = view === 'giorno' ? kpiGiorno.count : view === 'settimana' ? kpiSettimana.count : kpiMese.count;
  const kpiVal = view === 'giorno' ? kpiGiorno.valore : view === 'settimana' ? kpiSettimana.valore : kpiMese.valore;
  const kpiLabel = view === 'giorno' ? 'lavori' : view === 'settimana' ? 'lavori' : 'commesse';

  return (
    <div style={{ padding: '12px 16px 14px', color: '#FFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 14, color: '#FFF', fontWeight: 700, letterSpacing: 0.5 }}>AGENDA</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={goPrev} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={goOggi} style={{ padding: '0 12px', borderRadius: 16, background: isToday ? TEAL : 'rgba(255,255,255,0.12)', color: '#FFF', fontSize: 11, fontWeight: 700, border: 'none', letterSpacing: 0.5, cursor: 'pointer', height: 32, boxShadow: isToday ? '0 2px 8px rgba(40,160,160,0.4)' : 'none' }}>OGGI</button>
          <button onClick={goNext} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button onClick={onCreateEvent} style={{ background: TEAL, border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(40,160,160,0.4)' }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 9, marginBottom: 14 }}>
        {(['giorno','settimana','mese'] as const).map(v => (
          <div key={v} onClick={() => setView(v)} style={{
            flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 10, fontWeight: 700,
            color: view === v ? '#FFF' : 'rgba(255,255,255,0.55)',
            background: view === v ? TEAL : 'transparent',
            borderRadius: 6, letterSpacing: 0.5, cursor: 'pointer',
            boxShadow: view === v ? '0 2px 6px rgba(40,160,160,0.4)' : 'none',
          }}>{v.toUpperCase()}</div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, fontWeight: 700, textTransform: 'uppercase' }}>{subtitle} · {titolo}</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 2, letterSpacing: -0.5, lineHeight: 1 }}>{kpiCount} {kpiLabel}</div>
        </div>
        {kpiVal > 0 ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: TEAL, fontFeatureSettings: '"tnum"', lineHeight: 1 }}>{fmtEuro(kpiVal)}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginTop: 4 }}>VALORE</div>
          </div>
        ) : null}
      </div>

      {view === 'giorno' && kpiGiorno.count > 0 ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: kpiGiorno.count }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 4, background: i < kpiGiorno.completati ? TEAL : 'rgba(255,255,255,0.2)', borderRadius: 2 }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{kpiGiorno.completati} COMPLETATI</span>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>{kpiGiorno.count - kpiGiorno.completati} IN ARRIVO</span>
          </div>
        </div>
      ) : null}

      {view === 'mese' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 14 }}>
          {(['montaggio','sopralluogo','firma','consegna'] as const).map(t => (
            <div key={t} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
              <div style={{ fontSize: 15, color: '#FFF', fontWeight: 700, fontFeatureSettings: '"tnum"', lineHeight: 1 }}>{kpiMese.perTipo[t] || 0}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: 50, background: TIPI[t].color }}/>
                <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 0.3 }}>{TIPI[t].label}</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FiltriBar({ filtro, setFiltro }: any) {
  return (
    <div style={{ background: '#FFF', padding: '10px 0', borderBottom: `1px solid ${BORDER}`, overflowX: 'auto', display: 'flex', gap: 6 }}>
      <style>{`.mastro-fchip::-webkit-scrollbar{display:none}`}</style>
      <div style={{ width: 12, flexShrink: 0 }}/>
      {FILTRI.map(f => (
        <button key={f.id} onClick={() => setFiltro(f.id)} style={{
          padding: '6px 12px', borderRadius: 14, border: 'none',
          background: filtro === f.id ? f.color : BG_PALE,
          color: filtro === f.id ? '#FFF' : MUTED,
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5, cursor: 'pointer', flexShrink: 0,
          boxShadow: filtro === f.id ? `0 2px 6px ${f.color}40` : 'none',
        }}>{f.label}</button>
      ))}
      <div style={{ width: 12, flexShrink: 0 }}/>
    </div>
  );
}

function VistaGiorno({ eventi, cantieri, team, onApriEvento, onToggleTask, cursor, today }: any) {
  const isToday = cursor.toDateString() === today.toDateString();
  const nowMin = isToday ? today.getHours() * 60 + today.getMinutes() : -1;
  return (
    <div style={{ padding: '12px 0' }}>
      {eventi.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: MUTED, fontSize: 13 }}>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={BORDER} strokeWidth={1.8} style={{ display: 'block', margin: '0 auto 8px' }}><rect x={3} y={4} width={18} height={18} rx={2}/></svg>
          Nessun lavoro programmato
        </div>
      ) : null}
      {eventi.map((e: any, i: number) => {
        const start = parseEventDate(e), end = parseEventEndDate(e);
        const tipo = getTipo(e);
        const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
        const importo = eventImporto(e, cm);
        const startMin = start.getHours() * 60 + start.getMinutes();
        const endMin = end.getHours() * 60 + end.getMinutes();
        const isPast = nowMin > endMin;
        const isCurrent = nowMin >= startMin && nowMin <= endMin;
        const isUrgent = e?.urgente;
        if (e._kind === 'task') {
          return <BloccoTask key={e?.id || i} e={e} cm={cm} start={start} onApriEvento={onApriEvento} onToggle={onToggleTask} />;
        }
        return (
          <BloccoEvento key={e?.id || i} e={e} cm={cm} tipo={tipo} importo={importo} isPast={isPast} isCurrent={isCurrent} isUrgent={isUrgent} start={start} end={end} onApriEvento={onApriEvento} />
        );
      })}
      {isToday && nowMin > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', margin: '8px 0' }}>
          <div style={{ width: 38, fontSize: 10, color: TEAL, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{String(Math.floor(nowMin/60)).padStart(2,'0')}:{String(nowMin%60).padStart(2,'0')}</div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 50, background: TEAL, boxShadow: `0 0 0 4px rgba(40,160,160,0.2)` }}/>
            <div style={{ flex: 1, height: 2, background: TEAL }}/>
            <span style={{ fontSize: 9, color: TEAL, fontWeight: 700, letterSpacing: 1, marginLeft: 4 }}>ADESSO</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BloccoTask({ e, cm, start, onApriEvento, onToggle }: any) {
  const prio = (e?.priorita || '').toLowerCase();
  const prioColor = prio === 'alta' ? RED : prio === 'media' ? AMBER : null;
  const hasOra = e?.ora_inizio || e?.ora || (start && (start.getHours() > 0 || start.getMinutes() > 0));
  const oraLabel = hasOra ? String(start.getHours()).padStart(2,'0') : '—';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 16px 8px' }}>
      <div style={{ width: 38, fontSize: 10, color: MUTED, fontWeight: 700, fontFeatureSettings: '"tnum"', paddingTop: 4 }}>{oraLabel}</div>
      <div style={{ flex: 1, borderLeft: `2px solid ${BORDER}`, paddingLeft: 12 }}>
        <div style={{
          background: '#FFF', borderRadius: 10, padding: '10px 12px',
          borderLeft: `3px solid ${TEAL}`, boxShadow: '0 1px 4px rgba(15,31,51,0.06)',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: -1, left: -14, width: 12, height: 2, background: TEAL }}/>
          <button
            onClick={(ev) => { ev.stopPropagation(); onToggle?.(e?.id, false); }}
            style={{ width: 22, height: 22, borderRadius: 50, border: `2px solid ${TEAL}`, background: '#FFF', flexShrink: 0, cursor: 'pointer', padding: 0 }}
            aria-label="Completa task"
          />
          <div onClick={() => onApriEvento?.(e)} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 8, color: '#FFF', background: TEAL, padding: '2px 6px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }}>TASK</span>
              {prioColor ? <span style={{ fontSize: 8, color: '#FFF', background: prioColor, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{prio.toUpperCase()}</span> : null}
            </div>
            <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, marginTop: 3, lineHeight: 1.3 }}>{(e?.testo || e?.titolo || 'Task').replace(/[\u2705\u2611\u2713\u2714\uD83D\uDCC5]/g, '').trim()}</div>
            {cm ? <div style={{ fontSize: 9, color: NAVY, marginTop: 2, fontWeight: 600 }}>↗ {cm?.codice || cm?.code}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BloccoEvento({ e, cm, tipo, importo, isPast, isCurrent, isUrgent, start, end, onApriEvento }: any) {
  const t = TIPI[tipo] || TIPI.default;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '0 16px 8px' }}>
      <div style={{ width: 38, fontSize: 10, color: isCurrent ? TEAL : MUTED, fontWeight: 700, fontFeatureSettings: '"tnum"', paddingTop: 4 }}>{String(start.getHours()).padStart(2,'0')}</div>
      <div style={{ flex: 1, borderLeft: `2px solid ${BORDER}`, paddingLeft: 12 }}>
        <div onClick={() => onApriEvento?.(e)} style={{
          background: `linear-gradient(135deg, ${t.gradientFrom} 0%, ${t.gradientTo} 100%)`,
          borderRadius: 10, padding: '10px 12px', color: '#FFF',
          boxShadow: isCurrent ? `0 4px 16px ${t.color}50` : `0 2px 8px ${t.color}25`,
          border: isCurrent ? `2px solid ${TEAL}` : 'none',
          opacity: isPast ? 0.55 : 1, position: 'relative', cursor: 'pointer',
        }}>
          <div style={{ position: 'absolute', top: -1, left: -14, width: 12, height: 2, background: t.color }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: 0.5 }}>{t.label}{cm ? ` · ${cm?.codice || cm?.code}` : ''}</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {isUrgent ? <span style={{ fontSize: 8, color: '#FFF', background: RED, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>URGENTE</span> : null}
              {isPast ? <span style={{ fontSize: 8, color: '#FFF', background: 'rgba(40,160,160,0.5)', padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>FATTO</span> : null}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{cm?.cliente || cm?.cliente_nome || eventTitle(e)}</div>
          {eventLuogo(e) ? <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={9} height={9} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/></svg>
            {eventLuogo(e)}
          </div> : null}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.18)' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontFeatureSettings: '"tnum"' }}>
              {String(start.getHours()).padStart(2,'0')}:{String(start.getMinutes()).padStart(2,'0')} — {String(end.getHours()).padStart(2,'0')}:{String(end.getMinutes()).padStart(2,'0')}
            </span>
            {importo > 0 ? <span style={{ fontSize: 12, color: TEAL, fontWeight: 700, fontFeatureSettings: '"tnum"', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 4 }}>{fmtEuro(importo)}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function VistaSettimana({ weekDays, cursor, setCursor, eventByDay, cantieri, maxCount, today, onApriEvento, onToggleTask }: any) {
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return (
    <div>
      <div style={{ background: '#FFF', padding: '14px 12px', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, borderBottom: `1px solid ${BORDER}` }}>
        {weekDays.map((d: Date, i: number) => {
          const isT = isSameDay(d, today), isS = isSameDay(d, cursor);
          const count = (eventByDay[d.toDateString()] || []).length;
          const carico = maxCount > 0 ? count / maxCount : 0;
          return (
            <div key={i} onClick={() => setCursor(d)} style={{
              textAlign: 'center', padding: '8px 4px', cursor: 'pointer',
              background: isS && !isT ? 'rgba(40,160,160,0.1)' : 'transparent',
              border: isS && !isT ? `1.5px solid ${TEAL}` : '1.5px solid transparent',
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 9, color: isT ? TEAL : MUTED, fontWeight: 700, letterSpacing: 0.5 }}>{DOW_FULL[i].slice(0,3)}</div>
              {isT
                ? <div style={{ width: 26, height: 26, background: TEAL, borderRadius: 50, margin: '4px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 13, fontWeight: 700, fontFeatureSettings: '"tnum"', boxShadow: '0 2px 8px rgba(40,160,160,0.5)' }}>{d.getDate()}</div>
                : <div style={{ fontSize: 16, color: d.getDay() === 0 || d.getDay() === 6 ? '#C8D2DA' : TEXT, fontWeight: 600, marginTop: 4, fontFeatureSettings: '"tnum"' }}>{d.getDate()}</div>
              }
              <div style={{ margin: '6px auto 0', width: 14, height: 22, background: 'rgba(40,160,160,0.12)', borderRadius: 2, position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${Math.max(carico * 22, count > 0 ? 4 : 0)}px`, background: TEAL, borderRadius: 2 }}/>
              </div>
              <div style={{ fontSize: 8, color: count > 0 ? TEAL_DARK : '#C8D2DA', fontWeight: 700, marginTop: 3, fontFeatureSettings: '"tnum"' }}>{count || '·'}</div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
          {cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' }).toUpperCase()} · {(eventByDay[cursor.toDateString()] || []).length} LAVORI
        </div>
        {(eventByDay[cursor.toDateString()] || []).map((e: any, i: number) => {
          if (e._kind === 'task') {
            const prio = (e?.priorita || '').toLowerCase();
            const prioColor = prio === 'alta' ? RED : prio === 'media' ? AMBER : null;
            const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
            return (
              <div key={e?.id || i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', alignItems: 'center' }}>
                <button onClick={(ev) => { ev.stopPropagation(); onToggleTask?.(e?.id, false); }} style={{ width: 22, height: 22, borderRadius: 50, border: `2px solid ${TEAL}`, background: '#FFF', flexShrink: 0, cursor: 'pointer', padding: 0 }} aria-label="Completa task" />
                <div onClick={() => onApriEvento?.(e)} style={{ flex: 1, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 8, color: '#FFF', background: TEAL, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>TASK</span>
                    {prioColor ? <span style={{ fontSize: 8, color: '#FFF', background: prioColor, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{prio.toUpperCase()}</span> : null}
                    <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{(e?.testo || e?.titolo || 'Task').replace(/[\u2705\u2611\u2713\u2714\uD83D\uDCC5]/g, '').trim()}</span>
                  </div>
                  {cm ? <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>↗ {cm?.codice || cm?.code}</div> : null}
                </div>
              </div>
            );
          }
          const tipo = getTipo(e), t = TIPI[tipo] || TIPI.default;
          const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
          const start = parseEventDate(e);
          const importo = eventImporto(e, cm);
          return (
            <div key={e?.id || i} onClick={() => onApriEvento?.(e)} style={{ display: 'flex', gap: 10, padding: '10px 0', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer' }}>
              <div style={{ width: 3, background: t.color, borderRadius: 2 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: TEXT, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{String(start.getHours()).padStart(2,'0')}:{String(start.getMinutes()).padStart(2,'0')}</span>
                  <span style={{ fontSize: 8, color: '#FFF', background: t.color, padding: '1px 6px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }}>{t.label}</span>
                  <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{cm?.cliente || cm?.cliente_nome || eventTitle(e)}</span>
                  {importo > 0 ? <span style={{ marginLeft: 'auto', fontSize: 11, color: t.color, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{fmtEuro(importo)}</span> : null}
                </div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{cm?.codice || cm?.code || ''} · {eventLuogo(e) || '—'}</div>
              </div>
            </div>
          );
        })}
        {(eventByDay[cursor.toDateString()] || []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: MUTED, fontSize: 12 }}>Nessun lavoro questo giorno</div>
        ) : null}
      </div>
    </div>
  );
}

function VistaMese({ monthDays, cursor, setCursor, eventByDay, cantieri, maxDay, today, onApriEvento, onToggleTask, eventiSel }: any) {
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return (
    <div style={{ background: '#FFF' }}>
      <div style={{ padding: '12px 12px 4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {DOW.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 9, color: i >= 5 ? '#C8D2DA' : '#8FA8B8', fontWeight: 700 }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {monthDays.map((d: any, i: number) => {
            const isT = isSameDay(d.date, today);
            const isS = isSameDay(d.date, cursor);
            const count = (eventByDay[d.date.toDateString()] || []).length;
            const intensita = maxDay > 0 && count > 0 ? count / maxDay : 0;
            const bg = d.muted ? BG_SOFT
              : isT ? TEAL
              : count === 0 ? BG_SOFT
              : `rgba(40,160,160,${0.1 + intensita * 0.5})`;
            return (
              <div key={i} onClick={() => !d.muted && setCursor(d.date)} style={{
                aspectRatio: '1/1', background: bg, borderRadius: 6,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                cursor: d.muted ? 'default' : 'pointer',
                border: isS && !isT ? `1.5px solid ${TEAL}` : 'none',
                boxShadow: isT ? '0 4px 12px rgba(40,160,160,0.4)' : 'none',
                transform: isT ? 'scale(1.05)' : 'none',
                position: 'relative', transition: 'all 0.15s',
              }}>
                <div style={{ fontSize: 11, color: d.muted ? '#C8D2DA' : isT ? '#FFF' : TEXT, fontWeight: isT || count > 0 ? 700 : 500, fontFeatureSettings: '"tnum"' }}>{d.date.getDate()}</div>
                {count > 0 && !d.muted ? <div style={{ fontSize: 7, color: isT ? '#FFF' : TEAL_DARK, fontWeight: 700, marginTop: 1, fontFeatureSettings: '"tnum"' }}>{count}</div> : null}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 4px 4px' }}>
          <span style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.5 }}>CARICO</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 8, color: MUTED, fontWeight: 600 }}>basso</span>
            {[0.1, 0.25, 0.4, 0.55].map(o => <div key={o} style={{ width: 12, height: 8, background: `rgba(40,160,160,${o})`, borderRadius: 2 }}/>)}
            <span style={{ fontSize: 8, color: MUTED, fontWeight: 600 }}>alto</span>
          </div>
        </div>
      </div>

      {eventiSel.length > 0 ? (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${BORDER}`, background: BG_SOFT }}>
          <div style={{ fontSize: 11, color: MUTED, fontWeight: 700, letterSpacing: 0.5, marginBottom: 10 }}>
            {cursor.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric' }).toUpperCase()} · {eventiSel.length} LAVORI
          </div>
          {eventiSel.map((e: any, i: number) => {
            if (e._kind === 'task') {
              const prio = (e?.priorita || '').toLowerCase();
              const prioColor = prio === 'alta' ? RED : prio === 'media' ? AMBER : null;
              const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
              return (
                <div key={e?.id || i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', alignItems: 'center', background: '#FFF' }}>
                  <button onClick={(ev) => { ev.stopPropagation(); onToggleTask?.(e?.id, false); }} style={{ width: 22, height: 22, borderRadius: 50, border: `2px solid ${TEAL}`, background: '#FFF', flexShrink: 0, cursor: 'pointer', padding: 0 }} aria-label="Completa task" />
                  <div onClick={() => onApriEvento?.(e)} style={{ flex: 1, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 8, color: '#FFF', background: TEAL, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>TASK</span>
                      {prioColor ? <span style={{ fontSize: 8, color: '#FFF', background: prioColor, padding: '2px 6px', borderRadius: 3, fontWeight: 700 }}>{prio.toUpperCase()}</span> : null}
                      <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{(e?.testo || e?.titolo || 'Task').replace(/[\u2705\u2611\u2713\u2714\uD83D\uDCC5]/g, '').trim()}</span>
                    </div>
                    {cm ? <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>↗ {cm?.codice || cm?.code}</div> : null}
                  </div>
                </div>
              );
            }
            const tipo = getTipo(e), t = TIPI[tipo] || TIPI.default;
            const cm = cantieri.find((c: any) => c?.id === e?.commessa_id);
            const start = parseEventDate(e);
            return (
              <div key={e?.id || i} onClick={() => onApriEvento?.(e)} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderTop: i > 0 ? `1px solid ${BORDER}` : 'none', cursor: 'pointer', background: '#FFF' }}>
                <div style={{ width: 3, background: t.color, borderRadius: 2 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 11, color: TEXT, fontWeight: 700, fontFeatureSettings: '"tnum"' }}>{String(start.getHours()).padStart(2,'0')}:{String(start.getMinutes()).padStart(2,'0')}</span>
                    <span style={{ fontSize: 8, color: '#FFF', background: t.color, padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>{t.label}</span>
                    <span style={{ fontSize: 12, color: TEXT, fontWeight: 600 }}>{cm?.cliente || eventTitle(e)}</span>
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{eventLuogo(e) || ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
