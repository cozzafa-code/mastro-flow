'use client';

// ============================================================
// MASTRO — TimerLavoroDesktop
// Light Google-style. Control Room titolare/caposquadra.
// KPI in alto, filtri, tabella ore con avatar e approvazioni.
// ============================================================

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatHMS } from '@/hooks/useTimerLavoro';
import { MC, MF, MS, MR, MP, sectionLabel, btnPrimary, stateBadge, inputStyle } from '@/constants/design-system';
import { MastroCard, KpiCard, SectionLabel, MastroEmpty, OperatoreAvatar } from './_ui';
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
  root: { minHeight: '100vh', background: MC.bg, color: MC.text, fontFamily: MF.ui } as CSSProperties,
  container: { maxWidth: 1280, margin: '0 auto', padding: MP.s6 } as CSSProperties,
  hLabel: { ...sectionLabel, marginBottom: 4 } as CSSProperties,
  hTitle: { fontSize: 26, fontWeight: 600, margin: 0, color: MC.text } as CSSProperties,
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: MP.s4, margin: `${MP.s6}px 0` } as CSSProperties,
  filtersBox: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: MP.s3, marginBottom: MP.s4 } as CSSProperties,
  fLabel: { ...sectionLabel, marginBottom: 6, letterSpacing: 1.2 } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 } as CSSProperties,
  th: { padding: '12px 16px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2, color: MC.muted, textAlign: 'left' as const, background: MC.bgSoft, borderBottom: `1px solid ${MC.border}` } as CSSProperties,
  td: { padding: '14px 16px', color: MC.text, verticalAlign: 'middle' as const } as CSSProperties,
  approveBtn: {
    padding: '6px 14px', fontSize: 12, fontWeight: 600, letterSpacing: 0.3,
    background: MC.tealDark, color: '#fff', border: 'none', borderRadius: MR.md,
    cursor: 'pointer', fontFamily: 'inherit', boxShadow: MS.button,
  } as CSSProperties,
  opCell: { display: 'flex', alignItems: 'center', gap: 10 } as CSSProperties,
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

  const opGet = (id: string) => operatori.find(o => o.id === id);
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

        {/* KPI control room */}
        <div style={S.kpiRow}>
          <KpiCard
            label="In esecuzione"
            value={kpi.attivi}
            sub={`${kpi.opUnici} ${kpi.opUnici === 1 ? 'operatore' : 'operatori'} attivi`}
            variant={kpi.attivi > 0 ? 'teal' : 'neutral'}
          />
          <KpiCard
            label="Da approvare"
            value={kpi.daApprovare}
            sub="sessioni in attesa"
            variant={kpi.daApprovare > 0 ? 'warn' : 'neutral'}
          />
          <KpiCard
            label="Totale ore (periodo)"
            value={formatDuration(kpi.totMin)}
            sub={`${ore.length} sessioni totali`}
          />
          <KpiCard
            label="Operatori censiti"
            value={operatori.length}
            sub="nella squadra"
          />
        </div>

        {/* Filtri */}
        <MastroCard padding={MP.s4} style={{ marginBottom: MP.s4 }}>
          <div style={S.filtersBox}>
            <div>
              <div style={S.fLabel}>Operatore</div>
              <select style={inputStyle} value={filtroOp} onChange={e => setFiltroOp(e.target.value)}>
                <option value="">Tutti</option>
                {operatori.map(o => <option key={o.id} value={o.id}>{o.nome ?? '—'}</option>)}
              </select>
            </div>
            <div>
              <div style={S.fLabel}>Commessa</div>
              <select style={inputStyle} value={filtroCm} onChange={e => setFiltroCm(e.target.value)}>
                <option value="">Tutte</option>
                {commesse.map(c => <option key={c.id} value={c.id}>{c.numero ?? '—'} · {c.cliente_nome ?? ''}</option>)}
              </select>
            </div>
            <div>
              <div style={S.fLabel}>Periodo</div>
              <select style={inputStyle} value={filtroPer} onChange={e => setFiltroPer(e.target.value as any)}>
                <option value="7g">Ultimi 7 giorni</option>
                <option value="30g">Ultimi 30 giorni</option>
                <option value="tutti">Tutti</option>
              </select>
            </div>
            <div>
              <div style={S.fLabel}>Stato</div>
              <select style={inputStyle} value={filtroSt} onChange={e => setFiltroSt(e.target.value as any)}>
                <option value="tutti">Tutti</option>
                <option value="attivi">In esecuzione</option>
                <option value="da_approvare">Da approvare</option>
                <option value="approvati">Approvati</option>
              </select>
            </div>
          </div>
        </MastroCard>

        {/* Tabella */}
        <MastroCard padding={0}>
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
              {loading && (
                <tr><td colSpan={canApprove ? 8 : 7}>
                  <MastroEmpty title="Caricamento…" />
                </td></tr>
              )}
              {!loading && oreFiltrate.length === 0 && (
                <tr><td colSpan={canApprove ? 8 : 7}>
                  <MastroEmpty title="Nessun risultato" hint="Cambia filtri o avvia un timer dal mobile." />
                </td></tr>
              )}
              {oreFiltrate.map((o, i) => {
                const attivo = !o.stop_at;
                const elapsed = attivo
                  ? Math.floor((Date.now() - new Date(o.start_at).getTime()) / 1000) - (o.pause_total_seconds || 0)
                  : 0;
                const op = opGet(o.operatore_id);
                const variant = attivo ? 'attivo' : o.approvata_at ? 'success' : 'pending';
                const label = attivo ? '● in corso' : o.approvata_at ? '✓ approvato' : 'da approvare';
                return (
                  <tr key={o.id} style={{ borderTop: i > 0 ? `1px solid ${MC.border}` : 'none' }}>
                    <Td>
                      <div style={S.opCell}>
                        <OperatoreAvatar nome={op?.nome ?? '?'} size={28} />
                        <span>{op?.nome ?? '—'}</span>
                      </div>
                    </Td>
                    <Td>{cmLabel(o.commessa_id)}</Td>
                    <Td>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</Td>
                    <Td>{new Date(o.start_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Td>
                    <Td>{o.stop_at ? new Date(o.stop_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</Td>
                    <Td align="right">
                      <span style={{ fontFamily: MF.mono, fontWeight: 600, color: attivo ? MC.tealDark : MC.text }}>
                        {attivo ? formatHMS(elapsed) : formatDuration(o.durata_minuti)}
                      </span>
                    </Td>
                    <Td><span style={stateBadge(variant)}>{label}</span></Td>
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
        </MastroCard>
      </div>
    </div>
  );
}
