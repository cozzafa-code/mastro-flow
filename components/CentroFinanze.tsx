"use client";
import React, { useState, useMemo } from "react";
import { useFinanze, formatEuro, formatEuroShort } from "../hooks/useFinanze";
import HeroKPIFinanze from "./finanze/HeroKPIFinanze";
import { PASTEL, BG_APP, MUTED, TEXT } from "../lib/modaleColors";
import { IcoFile, IcoEuro, IcoAlertTriangle, IcoSparkles, IcoCheck, IcoChevronLeft, IcoTrendingUp, IcoTruck, IcoUser, IcoBuilding, IcoChat } from "./IconLib";

function IcoPlus({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>;}

interface Props {
  aziendaId: string;
  onClose: () => void;
}

export default function CentroFinanze({ aziendaId, onClose }: Props) {
  const { kpi, heroKpi, alerts, cashflow, loading, dismissAlert } = useFinanze(aziendaId);
  const [tab, setTab] = useState<'home'|'cashflow'|'scadenze'|'alert'>('home');
  const [showFab, setShowFab] = useState(false);

  // Prossime 8 scadenze unificate (in + out)
  const scadenzeProssime = useMemo(() => {
    const items: any[] = [];
    cashflow.forEach(g => g.eventi.forEach(e => items.push({ ...e, data: g.data })));
    return items.sort((a,b) => a.data.localeCompare(b.data)).slice(0, 12);
  }, [cashflow]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG_APP, zIndex: 9800, display: 'flex', flexDirection: 'column' as const }}>

      {/* Header */}
      <div style={{ background: '#fff', padding: '14px 16px 12px', borderBottom: '1px solid #E5EAF0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoChevronLeft size={18} color={TEXT} />
          </button>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: PASTEL.green.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoEuro size={22} color={PASTEL.green.text} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.3, color: MUTED, fontWeight: 800 }}>CENTRO FINANZE</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginTop: 1 }}>Controllo economico</div>
          </div>
          {kpi && (
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: 8, color: MUTED, letterSpacing: 0.8, fontWeight: 700 }}>UTILE MESE</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: kpi.utile_mese >= 0 ? PASTEL.green.solid : PASTEL.red.solid }}>
                {kpi.utile_mese >= 0 ? '+' : ''}{formatEuroShort(kpi.utile_mese)}
              </div>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 4, marginTop: 12, background: '#F1F4F7', padding: 3, borderRadius: 10 }}>
          {[
            { val: 'home', label: 'Panoramica' },
            { val: 'cashflow', label: 'Cashflow' },
            { val: 'scadenze', label: 'Scadenze' },
            { val: 'alert', label: `Alert${alerts.length ? ` · ${alerts.length}` : ''}` },
          ].map(t => (
            <button key={t.val} onClick={() => setTab(t.val as any)} style={{
              flex: 1, padding: '8px 0',
              background: tab === t.val ? '#fff' : 'transparent',
              color: tab === t.val ? TEXT : MUTED,
              border: 'none', borderRadius: 7,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: tab === t.val ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto' as const, padding: '12px 14px 90px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED }}>Caricamento dati finanziari...</div>
        ) : (
          <>
            {tab === 'home' && heroKpi && kpi && (
              <>
                <HeroKPIFinanze heroKpi={heroKpi} />

                {/* Top 3 alert AI */}
                {alerts.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <SectionLabel Ico={IcoSparkles} title="ALERT FINANZIARI AI" sub={`${alerts.length} attivi`} />
                    {alerts.slice(0, 3).map(a => <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} />)}
                    {alerts.length > 3 && (
                      <button onClick={() => setTab('alert')} style={{ width: '100%', padding: '10px 0', background: 'transparent', color: PASTEL.violet.solid, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Vedi tutti gli alert ({alerts.length}) →
                      </button>
                    )}
                  </div>
                )}

                {/* Scadenze prossime */}
                <div style={{ marginTop: 14 }}>
                  <SectionLabel Ico={IcoAlertTriangle} title="PROSSIME SCADENZE" sub="30 giorni" />
                  {scadenzeProssime.length === 0 ? (
                    <div style={{ background: '#fff', borderRadius: 12, padding: 24, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
                      Nessuna scadenza imminente
                    </div>
                  ) : (
                    scadenzeProssime.slice(0, 5).map((e, i) => <ScadenzaRiga key={i} ev={e} />)
                  )}
                </div>
              </>
            )}

            {tab === 'cashflow' && (
              <CashflowChart cashflow={cashflow} kpi={kpi} />
            )}

            {tab === 'scadenze' && (
              <>
                <SectionLabel Ico={IcoAlertTriangle} title="TUTTE LE SCADENZE" sub={`${scadenzeProssime.length} prossime`} />
                {scadenzeProssime.map((e, i) => <ScadenzaRiga key={i} ev={e} expanded />)}
              </>
            )}

            {tab === 'alert' && (
              <>
                <SectionLabel Ico={IcoSparkles} title="ALERT FINANZIARI AI" sub={`${alerts.length} attivi`} />
                {alerts.length === 0 ? (
                  <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
                    Nessun alert attivo. Tutto sotto controllo.
                  </div>
                ) : alerts.map(a => <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} expanded />)}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB azioni rapide */}
      <button onClick={() => setShowFab(!showFab)} style={{
        position: 'fixed' as const, bottom: 22, right: 18, zIndex: 9850,
        width: 58, height: 58, borderRadius: 29,
        background: showFab ? PASTEL.red.solid : PASTEL.green.solid,
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: `0 6px 20px ${PASTEL.green.solid}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: showFab ? 'rotate(45deg)' : 'rotate(0)',
        transition: 'transform 0.2s, background 0.2s',
      }}>
        <IcoPlus size={22} color="#fff" />
      </button>

      {showFab && (
        <>
          <div onClick={() => setShowFab(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.5)', zIndex: 9840 }} />
          <div style={{ position: 'fixed', bottom: 90, right: 18, zIndex: 9845, display: 'flex', flexDirection: 'column' as const, gap: 8, alignItems: 'flex-end' }}>
            <FabBtn Ico={IcoFile}     label="Nuova fattura"   color={PASTEL.peach}  onClick={() => alert('Apri Centro Fatture (BLOCCO 2)')} />
            <FabBtn Ico={IcoEuro}     label="Pagamento ricevuto" color={PASTEL.green} onClick={() => alert('Apri Modale Pagamento (BLOCCO 2)')} />
            <FabBtn Ico={IcoChat}     label="Nuova spesa"     color={PASTEL.amber}  onClick={() => alert('Apri Modale Spesa (BLOCCO 3)')} />
            <FabBtn Ico={IcoTrendingUp} label="Movimento banca" color={PASTEL.blue}   onClick={() => alert('Apri Modale Movimento (BLOCCO 2)')} />
            <FabBtn Ico={IcoUser}     label="Nuovo dipendente" color={PASTEL.violet} onClick={() => alert('Apri MASTRO TEAM')} />
            <FabBtn Ico={IcoTruck}    label="Nuovo mezzo"     color={PASTEL.navy}   onClick={() => alert('Apri Centro Mezzi (BLOCCO 4)')} />
          </div>
        </>
      )}
    </div>
  );
}

// =============== SECTION LABEL ===============
function SectionLabel({ Ico, title, sub }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
      <Ico size={11} color={MUTED} />
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, fontWeight: 800, flex: 1 }}>{title}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// =============== ALERT CARD ===============
function AlertCard({ alert, onDismiss, expanded }: any) {
  const sevMeta: Record<string, any> = {
    critical: PASTEL.red,
    warning:  PASTEL.amber,
    info:     PASTEL.blue,
  };
  const m = sevMeta[alert.severity] || PASTEL.blue;
  const tipoIco: Record<string, any> = {
    liquidita:     IcoEuro,
    margine:       IcoTrendingUp,
    spesa_anomala: IcoAlertTriangle,
    cliente_lento: IcoUser,
    iva:           IcoBuilding,
    suggerimento:  IcoSparkles,
  };
  const Ico = tipoIco[alert.tipo] || IcoSparkles;

  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 12,
      marginBottom: 6, borderLeft: `4px solid ${m.solid}`,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ico size={18} color={m.text} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: TEXT, lineHeight: 1.25 }}>{alert.titolo}</div>
        {(expanded || alert.descrizione) && alert.descrizione && (
          <div style={{ fontSize: 11, color: MUTED, marginTop: 3, lineHeight: 1.35 }}>{alert.descrizione}</div>
        )}
        {alert.azione_suggerita && expanded && (
          <div style={{ marginTop: 6, padding: '6px 10px', background: m.bg, color: m.text, borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
            → {alert.azione_suggerita}
          </div>
        )}
      </div>
      <button onClick={() => onDismiss(alert.id)} aria-label="Chiudi" style={{
        width: 26, height: 26, borderRadius: 6, background: 'transparent',
        border: 'none', cursor: 'pointer', color: MUTED,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <IcoCheck size={14} color={MUTED} />
      </button>
    </div>
  );
}

// =============== SCADENZA RIGA ===============
function ScadenzaRiga({ ev, expanded }: any) {
  const isIn = ev.direzione === 'in';
  const col = isIn ? PASTEL.green : PASTEL.red;
  const d = new Date(ev.data);
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const gg = Math.round((d.getTime() - oggi.getTime()) / 86400000);
  const dataFmt = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  const labelGg = gg === 0 ? 'oggi' : gg === 1 ? 'domani' : `+${gg}gg`;

  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: 10,
      marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10,
      borderLeft: `3px solid ${col.solid}`,
    }}>
      <div style={{
        width: 50, padding: '6px 0', textAlign: 'center' as const,
        background: col.bg, color: col.text,
        borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: 0.3,
      }}>
        <div>{dataFmt}</div>
        <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>{labelGg}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }}>{ev.descrizione}</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 1, fontWeight: 600 }}>{(ev.tipo || '').toUpperCase().replace(/_/g, ' ')}</div>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: col.solid }}>{isIn ? '+' : '−'}{formatEuro(ev.importo)}</div>
      </div>
    </div>
  );
}

// =============== CASHFLOW CHART ===============
function CashflowChart({ cashflow, kpi }: any) {
  if (cashflow.length === 0) return <div style={{ padding: 30, color: MUTED, textAlign: 'center' as const }}>Nessun dato cashflow</div>;

  const max = Math.max(...cashflow.map((g: any) => g.saldo_previsto), 0);
  const min = Math.min(...cashflow.map((g: any) => g.saldo_previsto), 0);
  const range = max - min || 1;
  const W = 320, H = 140;
  const margin = 6;

  const pts = cashflow.map((g: any, i: number) => {
    const x = margin + (i / (cashflow.length - 1)) * (W - margin * 2);
    const y = margin + (H - margin * 2) * (1 - (g.saldo_previsto - min) / range);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const zeroY = margin + (H - margin * 2) * (1 - (0 - min) / range);
  const sogliaY = margin + (H - margin * 2) * (1 - (5000 - min) / range);
  const finale = cashflow[cashflow.length - 1].saldo_previsto;
  const minSaldo = Math.min(...cashflow.map((g: any) => g.saldo_previsto));
  const minGiorno = cashflow.find((g: any) => g.saldo_previsto === minSaldo);

  return (
    <>
      <SectionLabel Ico={IcoTrendingUp} title="CASHFLOW 90 GIORNI" sub={`oggi → ${new Date(Date.now() + 90*86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`} />

      <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 0.8, fontWeight: 700 }}>OGGI</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginTop: 2 }}>{formatEuroShort(kpi?.liquidita_totale || 0)}</div>
          </div>
          <div style={{ textAlign: 'right' as const }}>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 0.8, fontWeight: 700 }}>TRA 90 GG</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: finale >= 0 ? PASTEL.green.solid : PASTEL.red.solid, marginTop: 2 }}>{formatEuroShort(finale)}</div>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Zona rossa sotto soglia 5k */}
          {sogliaY > 0 && sogliaY < H && (
            <rect x={0} y={sogliaY} width={W} height={H - sogliaY} fill={PASTEL.red.bg} opacity={0.4} />
          )}
          {/* Linea soglia */}
          <line x1={0} y1={sogliaY} x2={W} y2={sogliaY} stroke={PASTEL.red.solid} strokeDasharray="3 3" strokeWidth={0.8} opacity={0.6} />
          {/* Linea zero */}
          {zeroY > 0 && zeroY < H && (
            <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={MUTED} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.5} />
          )}
          {/* Polilinea */}
          <polyline points={pts} fill="none" stroke={PASTEL.teal.solid} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          {/* Area sotto */}
          <polyline points={`${margin},${H-margin} ${pts} ${W-margin},${H-margin}`} fill={PASTEL.teal.solid} opacity={0.12} />
          {/* Punti eventi (in/out) */}
          {cashflow.map((g: any, i: number) => {
            if (g.eventi.length === 0) return null;
            const x = margin + (i / (cashflow.length - 1)) * (W - margin * 2);
            const y = margin + (H - margin * 2) * (1 - (g.saldo_previsto - min) / range);
            const hasIn = g.eventi.some((e: any) => e.direzione === 'in');
            return <circle key={i} cx={x} cy={y} r={3} fill={hasIn ? PASTEL.green.solid : PASTEL.red.solid} stroke="#fff" strokeWidth={1.2} />;
          })}
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: MUTED, fontWeight: 600 }}>
          <span>oggi</span>
          <span>+30gg</span>
          <span>+60gg</span>
          <span>+90gg</span>
        </div>
      </div>

      {minSaldo < 5000 && minGiorno && (
        <div style={{ background: PASTEL.red.bg, borderRadius: 12, padding: 12, borderLeft: `4px solid ${PASTEL.red.solid}`, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PASTEL.red.text }}>⚠ Rischio liquidità rilevato</div>
          <div style={{ fontSize: 11, color: PASTEL.red.text, marginTop: 4, lineHeight: 1.35 }}>
            Il {new Date(minGiorno.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} il saldo previsto scende a <strong>{formatEuro(minSaldo)}</strong>. Verifica incassi e rinvia spese non urgenti.
          </div>
        </div>
      )}
    </>
  );
}

// =============== FAB BUTTON ===============
function FabBtn({ Ico, label, color, onClick }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ background: '#fff', color: TEXT, padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, boxShadow: '0 2px 8px rgba(15,27,45,0.18)' }}>{label}</div>
      <button onClick={onClick} style={{
        width: 44, height: 44, borderRadius: 22,
        background: color.solid, color: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${color.solid}55`,
      }}>
        <Ico size={18} color="#fff" />
      </button>
    </div>
  );
}