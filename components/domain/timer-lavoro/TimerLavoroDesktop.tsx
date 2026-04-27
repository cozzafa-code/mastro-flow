'use client';

// ============================================================
// MASTRO — TimerLavoroDesktop
// Read-only tabella ore con filtri + approvazione caposquadra
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDuration, formatHMS } from '@/hooks/useTimerLavoro';
import {
  FASI_LAVORO_LABEL,
  type FaseLavoro,
  type OraLavoro,
} from '@/lib/timer-lavoro-types';
import { FilterSelect, Th, Td, Badge } from './TimerLavoroDesktopParts';

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

export default function TimerLavoroDesktop({
  aziendaId, utenteCorrenteId, utenteCorrenteRuolo, operatori, commesse,
}: Props) {
  const [ore, setOre] = useState<OraLavoro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroOperatore, setFiltroOperatore] = useState('');
  const [filtroCommessa, setFiltroCommessa] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState<'7g' | '30g' | 'tutti'>('7g');
  const [filtroStato, setFiltroStato] = useState<'tutti' | 'attivi' | 'da_approvare' | 'approvati'>('tutti');
  const canApprove = ['titolare', 'caposquadra', 'resp_produzione', 'admin'].includes(utenteCorrenteRuolo);

  useEffect(() => {
    let cancelled = false;
    const fetchOre = async () => {
      setLoading(true);
      const since = new Date();
      if (filtroPeriodo === '7g') since.setDate(since.getDate() - 7);
      else if (filtroPeriodo === '30g') since.setDate(since.getDate() - 30);
      else since.setFullYear(since.getFullYear() - 5);

      let q = supabase
        .from('ore_lavoro')
        .select('*')
        .eq('azienda_id', aziendaId)
        .gte('start_at', since.toISOString())
        .order('start_at', { ascending: false });

      if (filtroOperatore) q = q.eq('operatore_id', filtroOperatore);
      if (filtroCommessa) q = q.eq('commessa_id', filtroCommessa);

      const { data, error } = await q;
      if (cancelled) return;
      if (!error && data) setOre(data as OraLavoro[]);
      setLoading(false);
    };
    fetchOre();

    const ch = supabase
      .channel(`ore_lavoro_desktop_${aziendaId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'ore_lavoro', filter: `azienda_id=eq.${aziendaId}` },
        () => fetchOre(),
      )
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [aziendaId, filtroOperatore, filtroCommessa, filtroPeriodo]);

  const oreFiltrate = useMemo(() => ore.filter((o) => {
    if (filtroStato === 'attivi') return !o.stop_at;
    if (filtroStato === 'da_approvare') return o.stop_at && !o.approvata_at;
    if (filtroStato === 'approvati') return !!o.approvata_at;
    return true;
  }), [ore, filtroStato]);

  const totaliOperatore = useMemo(() => {
    const map = new Map<string, number>();
    oreFiltrate.forEach((o) => {
      if (o.durata_minuti != null) {
        map.set(o.operatore_id, (map.get(o.operatore_id) ?? 0) + o.durata_minuti);
      }
    });
    return map;
  }, [oreFiltrate]);

  const handleApprova = async (id: string) => {
    await supabase
      .from('ore_lavoro')
      .update({ approvata_da: utenteCorrenteId, approvata_at: new Date().toISOString() })
      .eq('id', id);
  };

  const operatoreNome = (id: string) => operatori.find((o) => o.id === id)?.nome ?? '—';
  const commessaLabel = (id: string) => {
    const c = commesse.find((x) => x.id === id);
    return c ? `${c.numero ?? '—'} · ${c.cliente_nome ?? ''}` : '—';
  };

  return (
    <div style={{ background: TT.bg, color: TT.text }} className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs uppercase tracking-widest mb-1" style={{ color: TT.muted }}>
              Ore lavorate
            </div>
            <h1 className="text-2xl font-semibold">Timer Lavoro — Riepilogo</h1>
          </div>
        </div>

        <div
          className="rounded-xl p-4 mb-4 grid grid-cols-4 gap-3"
          style={{ background: TT.card, border: `1px solid ${TT.bdr}` }}
        >
          <FilterSelect
            label="Operatore" value={filtroOperatore} onChange={setFiltroOperatore}
            options={[{ v: '', l: 'Tutti' }, ...operatori.map((o) => ({ v: o.id, l: o.nome ?? '—' }))]}
          />
          <FilterSelect
            label="Commessa" value={filtroCommessa} onChange={setFiltroCommessa}
            options={[
              { v: '', l: 'Tutte' },
              ...commesse.map((c) => ({ v: c.id, l: `${c.numero ?? '—'} · ${c.cliente_nome ?? ''}` })),
            ]}
          />
          <FilterSelect
            label="Periodo" value={filtroPeriodo} onChange={(v) => setFiltroPeriodo(v as any)}
            options={[
              { v: '7g', l: 'Ultimi 7 giorni' },
              { v: '30g', l: 'Ultimi 30 giorni' },
              { v: 'tutti', l: 'Tutti' },
            ]}
          />
          <FilterSelect
            label="Stato" value={filtroStato} onChange={(v) => setFiltroStato(v as any)}
            options={[
              { v: 'tutti', l: 'Tutti' },
              { v: 'attivi', l: 'Timer attivi' },
              { v: 'da_approvare', l: 'Da approvare' },
              { v: 'approvati', l: 'Approvati' },
            ]}
          />
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: TT.card, border: `1px solid ${TT.bdr}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${TT.bdr}`, color: TT.muted }}>
                <Th>Operatore</Th><Th>Commessa</Th><Th>Fase</Th>
                <Th>Inizio</Th><Th>Fine</Th>
                <Th align="right">Durata</Th><Th>Stato</Th>
                {canApprove && <Th align="right">Azioni</Th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={canApprove ? 8 : 7} className="p-6 text-center" style={{ color: TT.muted }}>
                  Caricamento…
                </td></tr>
              )}
              {!loading && oreFiltrate.length === 0 && (
                <tr><td colSpan={canApprove ? 8 : 7} className="p-6 text-center" style={{ color: TT.muted }}>
                  Nessun risultato.
                </td></tr>
              )}
              {oreFiltrate.map((o, idx) => {
                const attivo = !o.stop_at;
                const elapsed = attivo
                  ? Math.floor((Date.now() - new Date(o.start_at).getTime()) / 1000) - (o.pause_total_seconds || 0)
                  : 0;
                return (
                  <tr key={o.id} style={{ borderBottom: idx < oreFiltrate.length - 1 ? `1px solid ${TT.bdr}` : 'none' }}>
                    <Td>{operatoreNome(o.operatore_id)}</Td>
                    <Td>{commessaLabel(o.commessa_id)}</Td>
                    <Td>{FASI_LAVORO_LABEL[o.fase as FaseLavoro] ?? o.fase}</Td>
                    <Td>{new Date(o.start_at).toLocaleString('it-IT', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}</Td>
                    <Td>{o.stop_at
                      ? new Date(o.stop_at).toLocaleString('it-IT', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}</Td>
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
                          <button
                            onClick={() => handleApprova(o.id)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold transition active:scale-95"
                            style={{ background: TT.acc, color: 'white' }}
                          >
                            Approva
                          </button>
                        )}
                      </Td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totaliOperatore.size > 0 && (
          <div className="mt-6">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: TT.muted }}>
              Totale ore per operatore (filtri attivi)
            </div>
            <div
              className="rounded-xl p-4 grid grid-cols-3 gap-3"
              style={{ background: TT.card, border: `1px solid ${TT.bdr}` }}
            >
              {Array.from(totaliOperatore.entries()).map(([opId, min]) => (
                <div
                  key={opId}
                  className="flex justify-between items-center px-3 py-2 rounded-lg"
                  style={{ background: TT.bg }}
                >
                  <span>{operatoreNome(opId)}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: TT.acc }}>
                    {formatDuration(min)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
