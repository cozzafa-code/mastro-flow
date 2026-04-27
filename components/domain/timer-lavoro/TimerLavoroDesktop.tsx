'use client';

// ============================================================
// MASTRO - TimerLavoroDesktop
// Read-only tabella - 100% inline CSS
// ============================================================

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatHMS } from '@/hooks/useTimerLavoro';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type OraLavoro,
} from '@/lib/timer-lavoro-types';

const TT = {
  bg: '#F8FAFC', card: '#FFFFFF', bdr: '#E2E8F0',
  text: '#0F172A', muted: '#64748B',
  acc: '#0F766E', accSoft: '#CCFBF1',
  warn: '#D97706', danger: '#DC2626',
};

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
  root: { background: TT.bg, color: TT.text, minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', boxSizing: 'border-box' } as CSSProperties,
  container: { maxWidth: 1280, margin: '0 auto', padding: 24 } as CSSProperties,
  hWrap: { marginBottom: 24 } as CSSProperties,
  hLabel: { fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: TT.muted, marginBottom: 4 } as CSSProperties,
  hTitle: { fontSize: 24, fontWeight: 600, margin: 0 } as CSSProperties,
  filtersBox: {
    background: TT.card, border: `1px solid ${TT.bdr}`, borderRadius: 12,
    padding: 16, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
  } as CSSProperties,
  fLabel: { fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: TT.muted, marginBottom: 6 } as CSSProperties,
  fSelect: {
    width: '100%', padding: '8px 12px', fontSize: 14,
    background: '#fff', color: TT.text, border: `1px solid ${TT.bdr}`,
    borderRadius: 8, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  } as CSSProperties,
  tableBox: { background: TT.card, border: `1px solid ${TT.bdr}`, borderRadius: 12, overflow: 'hidden' } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 } as CSSProperties,
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: TT.muted, textAlign: 'left' as const } as CSSProperties,
  td: { padding: '12px 16px' } as CSSProperties,
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 } as CSSProperties,
  approveBtn: {
    padding: '6px 12px', fontSize: 12, fontWeight: 600,
    background: TT.acc, color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
  } as CSSProperties,
  totaliBox: {
    marginTop: 24, background: TT.card, border: `1px solid ${TT.bdr}`,
    borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
  } as CSSProperties,
  totRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 12px', borderRadius: 8, background: TT.bg, fontSize: 14,
  } as CSSProperties,
  empty: { padding: 24, textAlign: 'center' as const, color: TT.muted } as CSSProperties,
};

function Th({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <th style={{ ...S.th, textAlign: align }}>{children}</th>;
}
function Td({ children, align = 'left' }: { children: ReactNode; align?: 'left' | 'right' }) {
  return <td style={{ ...S.td, textAlign: align }}>{children}</td>;
}
function Badge({ children, color, bg }: { children: ReactNode; color: string; bg: string }) {
  return <span style={{ ...S.badge, color, background: bg }}>{children}</span>;
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

  const totali = useMemo(() => {
    const m = new Map<string, number>();
    oreFiltrate.forEach(o => {
      if (o.durata_minuti != null) m.set(o.operatore_id, (m.get(o.operatore_id) ?? 0) + o.durata_minuti);
    });
    return m;
  }, [oreFiltrate]);

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
        <div style={S.hWrap}>
          <div style={S.hLabel}>Ore lavorate</div>
          <h1 style={S.hTitle}>Timer Lavoro — Riepilogo</h1>
        </div>

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
              <option value="attivi">Timer attivi</option>
              <option value="da_approvare">Da approvare</option>
              <option value="approvati">Approvati</option>
            </select>
          </div>
        </div>

        <div style={S.tableBox}>
          <table style={S.table}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${TT.bdr}` }}>
                <Th>Operatore</Th><Th>Commessa</Th><Th>Fase</Th>
                <Th>Inizio</Th><Th>Fine</Th>
                <Th align="right">Durata</Th><Th>Stato</Th>
                {canApprove && <Th align="right">Azioni</Th>}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={canApprove ? 8 : 7} style={S.empty}>Caricamento...</td></tr>}
              {!loading && oreFiltrate.length === 0 && (
                <tr><td colSpan={canApprove ? 8 : 7} style={S.empty}>Nessun risultato.</td></tr>
              )}
              {oreFiltrate.map((o, i) => {
                const attivo = !o.stop_at;
                const elapsed = attivo
                  ? Math.floor((Date.now() - new Date(o.start_at).getTime()) / 1000) - (o.pause_total_seconds || 0)
                  : 0;
                return (
                  <tr key={o.id} style={{ borderBottom: i < oreFiltrate.length - 1 ? `1px solid ${TT.bdr}` : 'none' }}>
                    <Td>{opNome(o.operatore_id)}</Td>
                    <Td>{cmLabel(o.commessa_id)}</Td>
                    <Td>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</Td>
                    <Td>{new Date(o.start_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Td>
                    <Td>{o.stop_at ? new Date(o.stop_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                    <Td align="right">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                        {attivo ? formatHMS(elapsed) : formatDuration(o.durata_minuti)}
                      </span>
                    </Td>
                    <Td>
                      {attivo && <Badge color={TT.acc} bg={TT.accSoft}>● ATTIVO</Badge>}
                      {!attivo && o.approvata_at && <Badge color={TT.acc} bg={TT.accSoft}>✓ Approvato</Badge>}
                      {!attivo && !o.approvata_at && <Badge color={TT.warn} bg="#FEF3C7">Da approvare</Badge>}
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

        {totali.size > 0 && (
          <>
            <div style={{ ...S.hLabel, marginTop: 24, marginBottom: 12 }}>Totale ore per operatore</div>
            <div style={S.totaliBox}>
              {Array.from(totali.entries()).map(([opId, min]) => (
                <div key={opId} style={S.totRow}>
                  <span>{opNome(opId)}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: TT.acc }}>
                    {formatDuration(min)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
