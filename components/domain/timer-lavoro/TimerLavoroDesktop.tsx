'use client';

// ============================================================
// MASTRO — TimerLavoroDesktop (light Google-style)
// Control room titolare/caposquadra: tabella + KPI + approvazioni
// ============================================================

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatHMS } from '@/hooks/useTimerLavoro';
import { C, FONT, SHADOW, RADIUS, stateBadge } from '@/lib/timer-lavoro-ui';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type OraLavoro,
} from '@/lib/timer-lavoro-types';

interface OperatoreLite { id: string; nome: string | null; ruolo: string | null; }
interface CommessaLite { id: string; numero: string | null; cliente_nome: string | null; }

interface Props {
  aziendaId: string;
  utenteCorrenteId: string;
  utenteCorrenteRuolo: string;
  operatori: OperatoreLite[];
  commesse: CommessaLite[];
}

const S = {
  root: { minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT.ui, boxSizing: 'border-box' } as CSSProperties,
  container: { maxWidth: 1280, margin: '0 auto', padding: 24 } as CSSProperties,
  hLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, marginBottom: 4, fontWeight: 600 } as CSSProperties,
  hTitle: { fontSize: 26, fontWeight: 600, margin: 0, color: C.text } as CSSProperties,
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, margin: '24px 0' } as CSSProperties,
  kpiCard: {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg,
    padding: 18, boxShadow: SHADOW.card,
  } as CSSProperties,
  kpiLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted, fontWeight: 600 } as CSSProperties,
  kpiValue: { fontFamily: FONT.mono, fontSize: 28, fontWeight: 600, color: C.text, marginTop: 8 } as CSSProperties,
  kpiSub: { fontSize: 12, color: C.muted, marginTop: 4 } as CSSProperties,
  filtersBox: {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
    boxShadow: SHADOW.card,
  } as CSSProperties,
  fLabel: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muted, marginBottom: 6, fontWeight: 600 } as CSSProperties,
  fSelect: {
    width: '100%', padding: '8px 12px', fontSize: 14,
    background: '#fff', color: C.text, border: `1px solid ${C.border}`,
    borderRadius: RADIUS.md, outline: 'none', boxSizing: 'border-box', fontFamily: FONT.ui,
  } as CSSProperties,
  tableBox: { background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, overflow: 'hidden', boxShadow: SHADOW.card } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 } as CSSProperties,
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: C.muted, textAlign: 'left' as const, background: C.bgSoft } as CSSProperties,
  td: { padding: '14px 16px', color: C.text } as CSSProperties,
  approveBtn: {
    padding: '6px 14px', fontSize: 12, fontWeight: 600, letterSpacing: 0.5,
    background: C.tealDark, color: '#fff', border: 'none', borderRadius: RADIUS.md,
    cursor: 'pointer', fontFamily: 'inherit', boxShadow: SHADOW.button,
  } as CSSProperties,
  empty: { padding: 40, textAlign: 'center' as const, color: C.muted } as CSSProperties,
};

function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <th style={{ ...S.th, textAlign: align }}>{children}</th>;
}
function Td({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <td style={{ ...S.td, textAlign: align }}>{children}</td>;
}

export default function TimerLavoroDesktop({
  aziendaId, utenteCorrenteId, utenteCorrenteRuolo, operatori, commesse,
}: Props) {
  const [ore, setOre] = useState<OraLavoro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroOp, setFiltroOp] = useState('');
  const [filtroCm, setFiltroCm] = useState('');
  const [filtroPer, setFiltroPer] = useState<'7g' | '30g' | 'tutti'>('7g');
  const [filtroSt, setFiltroSt] = useState<'tutti' | 'attivi' | 'da_approvare' | 'approvati'>('tutti');
  const canApprove = ['titolare','caposquadra','resp_produzione','admin'].includes(utenteCorrenteRuolo);

  useEffect(() => {
    let cancelled = false;
    const fetchOre = async () => {
      setLoading(true);
      const since = new Date();
      if (filtroPer === '7g') since.setDate(since.getDate() - 7);
      else if (filtroPer === '30g') since.setDate(since.getDate() - 30);
      else since.setFullYear(since.getFullYear() - 5);

      let q = supabase.from('ore_lavoro').select('*')
        .eq('azienda_id', aziendaId)
        .gte('start_at', since.toISOString())
        .order('start_at', { ascending: false });
      if (filtroOp) q = q.eq('operatore_id', filtroOp);
      if (filtroCm) q = q.eq('commessa_id', filtroCm);
      const { data, error } = await q;
      if (cancelled) return;
      if (!error && data) setOre(data as OraLavoro[]);
      setLoading(false);
    };
    fetchOre();
    const ch = supabase.channel(`ore_lavoro_d_${aziendaId}`).on('postgres_changes',
      { event: '*', schema: 'public', table: 'ore_lavoro', filter: `azienda_id=eq.${aziendaId}` },
      () => fetchOre()).subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [aziendaId, filtroOp, filtroCm, filtroPer]);

  const oreFiltrate = useMemo(() => ore.filter(o => {
    if (filtroSt === 'attivi') return !o.stop_at;
    if (filtroSt === 'da_approvare') return o.stop_at && !o.approvata_at;
    if (filtroSt === 'approvati') return !!o.approvata_at;
    return true;
  }), [ore, filtroSt]);

  // KPI
  const kpi = useMemo(() => {
    const attivi = ore.filter(o => !o.stop_at).length;
    const daApprovare = ore.filter(o => o.stop_at && !o.approvata_at).length;
    const totMin = ore.reduce((s, o) => s + (o.durata_minuti ?? 0), 0);
    const opUnici = new Set(ore.filter(o => !o.stop_at).map(o => o.operatore_id)).size;
    return { attivi, daApprovare, totMin, opUnici };
  }, [ore]);

  const handleApprova = async (id: string) => {
    await supabase.from('ore_lavoro').update({
      approvata_da: utenteCorrenteId, approvata_at: new Date().toISOString(),
    }).eq('id', id);
  };

  const opNome = (id: string) => operatori.find(o => o.id === id)?.nome ?? '—';
  const cmLabel = (id: string) => {
    const c = commesse.find(x => x.id === id);
    return c ? `${c.numero ?? '—'} · ${c.cliente_nome ?? ''}` : '—';
  };

  return (
    <div style={S.root}>
      <div style={S.container}>
        <div>
          <div style={S.hLabel}>Manodopera · ore lavorate</div>
          <h1 style={S.hTitle}>Timer Lavoro</h1>
        </div>

        {/* KPI */}
        <div style={S.kpiRow}>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>In esecuzione</div>
            <div style={{ ...S.kpiValue, color: kpi.attivi > 0 ? C.tealDark : C.text }}>{kpi.attivi}</div>
            <div style={S.kpiSub}>{kpi.opUnici} {kpi.opUnici === 1 ? 'operatore' : 'operatori'} attivi</div>
          </div>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>Da approvare</div>
            <div style={{ ...S.kpiValue, color: kpi.daApprovare > 0 ? C.warn : C.text }}>{kpi.daApprovare}</div>
            <div style={S.kpiSub}>sessioni in attesa</div>
          </div>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>Totale ore (periodo)</div>
            <div style={S.kpiValue}>{formatDuration(kpi.totMin)}</div>
            <div style={S.kpiSub}>{ore.length} sessioni totali</div>
          </div>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>Operatori censiti</div>
            <div style={S.kpiValue}>{operatori.length}</div>
            <div style={S.kpiSub}>nella squadra</div>
          </div>
        </div>

        {/* Filtri */}
        <div style={S.filtersBox}>
          <div>
            <div style={S.fLabel}>Operatore</div>
            <select style={S.fSelect} value={filtroOp} onChange={e => setFiltroOp(e.target.value)}>
              <option value="">Tutti</option>
              {operatori.map(o => <option key={o.id} value={o.id}>{o.nome ?? '—'}</option>)}
            </select>
          </div>
          <div>
            <div style={S.fLabel}>Commessa</div>
            <select style={S.fSelect} value={filtroCm} onChange={e => setFiltroCm(e.target.value)}>
              <option value="">Tutte</option>
              {commesse.map(c => <option key={c.id} value={c.id}>{c.numero ?? '—'} · {c.cliente_nome ?? ''}</option>)}
            </select>
          </div>
          <div>
            <div style={S.fLabel}>Periodo</div>
            <select style={S.fSelect} value={filtroPer} onChange={e => setFiltroPer(e.target.value as any)}>
              <option value="7g">Ultimi 7 giorni</option>
              <option value="30g">Ultimi 30 giorni</option>
              <option value="tutti">Tutti</option>
            </select>
          </div>
          <div>
            <div style={S.fLabel}>Stato</div>
            <select style={S.fSelect} value={filtroSt} onChange={e => setFiltroSt(e.target.value as any)}>
              <option value="tutti">Tutti</option>
              <option value="attivi">In esecuzione</option>
              <option value="da_approvare">Da approvare</option>
              <option value="approvati">Approvati</option>
            </select>
          </div>
        </div>

        {/* Tabella */}
        <div style={S.tableBox}>
          <table style={S.table}>
            <thead>
              <tr>
                <Th>Operatore</Th><Th>Commessa</Th><Th>Fase</Th>
                <Th>Inizio</Th><Th>Fine</Th>
                <Th align="right">Durata</Th><Th>Stato</Th>
                {canApprove && <Th align="right">Azioni</Th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={canApprove ? 8 : 7} style={S.empty}>Caricamento…</td></tr>}
              {!loading && oreFiltrate.length === 0 && (
                <tr><td colSpan={canApprove ? 8 : 7} style={S.empty}>Nessun risultato.</td></tr>
              )}
              {oreFiltrate.map((o, i) => {
                const attivo = !o.stop_at;
                const elapsed = attivo
                  ? Math.floor((Date.now() - new Date(o.start_at).getTime()) / 1000) - (o.pause_total_seconds || 0)
                  : 0;
                const variant = attivo ? 'attivo' : o.approvata_at ? 'approvato' : 'da_approvare';
                const label = attivo ? '● in corso' : o.approvata_at ? '✓ approvato' : 'da approvare';
                return (
                  <tr key={o.id} style={{ borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
                    <Td>{opNome(o.operatore_id)}</Td>
                    <Td>{cmLabel(o.commessa_id)}</Td>
                    <Td>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</Td>
                    <Td>{new Date(o.start_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Td>
                    <Td>{o.stop_at ? new Date(o.stop_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                    <Td align="right">
                      <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: attivo ? C.tealDark : C.text }}>
                        {attivo ? formatHMS(elapsed) : formatDuration(o.durata_minuti)}
                      </span>
                    </Td>
                    <Td>
                      <span style={stateBadge(variant)}>{label}</span>
                    </Td>
                    {canApprove && (
                      <Td align="right">
                        {!attivo && !o.approvata_at && (
                          <button onClick={() => handleApprova(o.id)} style={S.approveBtn}>Approva</button>
                        )}
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
