"use client";
import React, { useState, useMemo } from "react";
import { useFinanze, formatEuro, formatEuroShort } from "../hooks/useFinanze";
import { useFattureFinanze, type FatturaFin, type FiltroFatture } from "../hooks/useFattureFinanze";
import { useSpese, CATEGORIE_SPESA, METODI_PAGAMENTO, statoFattRicLabel, type SpesaRow, type FatturaRicevutaRow, type FiltroSpese, type FiltroFattRic } from "../hooks/useSpese";
import { useCommessaPL, statoPLMeta, type CommessaPLRow } from "../hooks/useCommessaPL";
import { useTasse, tipoEventoMeta, type LiquidazioneIva, type EventoFiscale } from "../hooks/useTasse";
import HeroKPIFinanze from "./finanze/HeroKPIFinanze";
import CalendarioTimelineFinanze from "./finanze/CalendarioTimelineFinanze";
import { PASTEL, BG_APP, MUTED, TEXT } from "../lib/modaleColors";
import { IcoFile, IcoEuro, IcoAlertTriangle, IcoSparkles, IcoCheck, IcoChevronLeft, IcoTrendingUp, IcoTruck, IcoUser, IcoBuilding, IcoChat } from "./IconLib";

function IcoPlus({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>;}
function IcoX({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round"><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>;}
function IcoSearch({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/></svg>;}
function IcoCam({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx={12} cy={13} r={4}/></svg>;}
function IcoCalendar({size=14,color="currentColor"}:any){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>;}

interface Props {
  aziendaId: string;
  onClose: () => void;
}

export default function CentroFinanze({ aziendaId, onClose }: Props) {
  const { kpi, heroKpi, alerts, cashflow, loading, dismissAlert } = useFinanze(aziendaId);
  const fattHook = useFattureFinanze(aziendaId);
  const speseHook = useSpese(aziendaId);
  const plHook = useCommessaPL(aziendaId);
  const tasseHook = useTasse(aziendaId);
  const [tab, setTab] = useState<'home'|'fatture'|'uscite'|'pl'|'tasse'|'cashflow'|'scadenze'|'alert'>('home');
  const [showFab, setShowFab] = useState(false);

  const [showNuovaFattura, setShowNuovaFattura] = useState(false);
  const [showPagamento, setShowPagamento] = useState<{open: boolean; fatturaId?: string}>({open: false});
  const [dettaglioId, setDettaglioId] = useState<string | null>(null);

  const [showSpesa, setShowSpesa] = useState(false);
  const [showPagFornit, setShowPagFornit] = useState<{open: boolean; fatturaId?: string}>({open: false});
  const [showNuovaFatturaRic, setShowNuovaFatturaRic] = useState(false);
  const [dettaglioFattRicId, setDettaglioFattRicId] = useState<string | null>(null);

  const [plDettaglio, setPlDettaglio] = useState<CommessaPLRow | null>(null);

  const [filtroF, setFiltroF] = useState<FiltroFatture>('tutte');
  const [searchF, setSearchF] = useState('');

  const [subTabUscite, setSubTabUscite] = useState<'spese'|'fornitori'|'storico'>('spese');
  const [filtroSpese, setFiltroSpese] = useState<FiltroSpese>('mese');
  const [searchSpese, setSearchSpese] = useState('');
  const [filtroFornit, setFiltroFornit] = useState<FiltroFattRic>('da_pagare');
  const [searchFornit, setSearchFornit] = useState('');

  const scadenzeProssime = useMemo(() => {
    const items: any[] = [];
    cashflow.forEach(g => g.eventi.forEach(e => items.push({ ...e, data: g.data })));
    return items.sort((a,b) => a.data.localeCompare(b.data)).slice(0, 12);
  }, [cashflow]);

  const fattureFiltrate = useMemo(() => fattHook.filtra(filtroF, searchF), [fattHook.fatture, filtroF, searchF]);
  const speseFiltrate = useMemo(() => speseHook.filtraSpese(filtroSpese, searchSpese), [speseHook.spese, filtroSpese, searchSpese]);
  const fornitFiltrate = useMemo(() => speseHook.filtraFattRicevute(filtroFornit, searchFornit), [speseHook.fattRicevute, filtroFornit, searchFornit]);

  const fatturaCorrente = dettaglioId ? fattHook.fatture.find(f => f.id === dettaglioId) : null;
  const fatturaRicCorrente = dettaglioFattRicId ? speseHook.fattRicevute.find(f => f.id === dettaglioFattRicId) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG_APP, zIndex: 9800, display: 'flex', flexDirection: 'column' as const }}>

      <div style={{ background: '#fff', padding: '14px 16px 12px', borderBottom: '1px solid #E5EAF0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoChevronLeft size={18} color={TEXT} />
          </button>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: PASTEL.green.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoEuro size={22} color={PASTEL.green.text} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.3, color: MUTED, fontWeight: 800 }}>CONTABILIT├Ç</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginTop: 1 }}>Centro Finanze</div>
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

        <div style={{ display: 'flex', gap: 3, marginTop: 12, background: '#F1F4F7', padding: 3, borderRadius: 10, overflowX: 'auto' as const }}>
          {[
            { val: 'home', label: 'Sintesi' },
            { val: 'fatture', label: `Fatture${fattHook.kpi ? ` ┬À ${fattHook.kpi.n_aperte}` : ''}` },
            { val: 'uscite', label: `Uscite${speseHook.kpiFatt ? ` ┬À ${speseHook.kpiFatt.n_da_pagare}` : ''}` },
            { val: 'pl', label: `P&L${plHook.kpi ? ` ┬À ${plHook.kpi.n_commesse_totali}` : ''}` },
            { val: 'tasse', label: `Tasse${tasseHook.kpi ? ` ┬À ${tasseHook.kpi.n_aperte}` : ''}` },
            { val: 'cashflow', label: 'Cashflow' },
            { val: 'scadenze', label: 'Scadenze' },
            { val: 'alert', label: `Alert${alerts.length ? ` ┬À ${alerts.length}` : ''}` },
          ].map(t => (
            <button key={t.val} onClick={() => setTab(t.val as any)} style={{
              flex: '1 0 auto', padding: '8px 10px',
              background: tab === t.val ? '#fff' : 'transparent',
              color: tab === t.val ? TEXT : MUTED,
              border: 'none', borderRadius: 7,
              fontSize: 11, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
              boxShadow: tab === t.val ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' as const, padding: '12px 14px 90px' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED }}>Caricamento dati finanziari...</div>
        ) : (
          <>
            {tab === 'home' && heroKpi && kpi && (
              <>
                <HeroKPIFinanze heroKpi={heroKpi} />
                <div style={{ marginTop: 14 }}><CalendarioTimelineFinanze cashflow={cashflow} /></div>
                {alerts.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <SectionLabel Ico={IcoSparkles} title="ALERT FINANZIARI AI" sub={`${alerts.length} attivi`} />
                    {alerts.slice(0, 3).map(a => <AlertCard key={a.id} alert={a} onDismiss={dismissAlert} />)}
                    {alerts.length > 3 && (
                      <button onClick={() => setTab('alert')} style={{ width: '100%', padding: '10px 0', background: 'transparent', color: PASTEL.violet.solid, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Vedi tutti gli alert ({alerts.length}) ÔåÆ
                      </button>
                    )}
                  </div>
                )}
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

            {tab === 'fatture' && (
              <TabFatture
                fatture={fattureFiltrate}
                kpi={fattHook.kpi}
                filtro={filtroF}
                setFiltro={setFiltroF}
                search={searchF}
                setSearch={setSearchF}
                onApriDettaglio={(id) => setDettaglioId(id)}
                onApriPagamento={(id) => setShowPagamento({ open: true, fatturaId: id })}
              />
            )}

            {tab === 'uscite' && (
              <TabUscite
                subTab={subTabUscite}
                setSubTab={setSubTabUscite}
                kpiSpese={speseHook.kpiSpese}
                kpiFatt={speseHook.kpiFatt}
                categorieSpese={speseHook.categorieSpese}
                spese={speseFiltrate}
                fornit={fornitFiltrate}
                pagamentiStorico={speseHook.fattRicevute}
                filtroSpese={filtroSpese}
                setFiltroSpese={setFiltroSpese}
                searchSpese={searchSpese}
                setSearchSpese={setSearchSpese}
                filtroFornit={filtroFornit}
                setFiltroFornit={setFiltroFornit}
                searchFornit={searchFornit}
                setSearchFornit={setSearchFornit}
                onEliminaSpesa={async (id) => {
                  if (!confirm('Eliminare questa spesa?')) return;
                  await speseHook.eliminaSpesa(id);
                }}
                onApriFornit={(id) => setDettaglioFattRicId(id)}
                onPagaFornit={(id) => setShowPagFornit({ open: true, fatturaId: id })}
                onNuovaFattRic={() => setShowNuovaFatturaRic(true)}
                onNuovaSpesa={() => setShowSpesa(true)}
              />
            )}

            {tab === 'pl' && (
              <TabPL
                kpi={plHook.kpi}
                top5={plHook.top5}
                bottom5={plHook.bottom5}
                inPerdita={plHook.inPerdita}
                bassoMargine={plHook.bassoMargine}
                commesseAttive={plHook.commesseAttive}
                onApriDettaglio={(c) => setPlDettaglio(c)}
              />
            )}

            {tab === 'tasse' && (
              <TabTasse
                kpi={tasseHook.kpi}
                liquidazioni={tasseHook.liquidazioni}
                eventiProssimi={tasseHook.eventiProssimi}
                eventiScaduti={tasseHook.eventiScaduti}
                onMarcaVersata={async (id) => {
                  const rif = prompt('Riferimento F24 (opzionale):') || undefined;
                  const res = await tasseHook.marcaVersata(id, rif);
                  if (!res.ok) alert('Errore: ' + (res.error || 'sconosciuto'));
                }}
              />
            )}

            {tab === 'cashflow' && <CalendarioTimelineFinanze cashflow={cashflow} />}

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
            <FabBtn Ico={IcoFile}        label="Nuova fattura"       color={PASTEL.peach}  onClick={() => { setShowFab(false); setShowNuovaFattura(true); }} />
            <FabBtn Ico={IcoEuro}        label="Pagamento ricevuto"  color={PASTEL.green}  onClick={() => { setShowFab(false); setShowPagamento({ open: true }); }} />
            <FabBtn Ico={IcoCam}         label="Nuova spesa"         color={PASTEL.amber}  onClick={() => { setShowFab(false); setShowSpesa(true); }} />
            <FabBtn Ico={IcoBuilding}    label="Pagamento fornitore" color={PASTEL.red}    onClick={() => { setShowFab(false); setShowPagFornit({ open: true }); }} />
            <FabBtn Ico={IcoChat}        label="Fattura ricevuta"    color={PASTEL.violet} onClick={() => { setShowFab(false); setShowNuovaFatturaRic(true); }} />
            <FabBtn Ico={IcoCalendar}    label="Vai a Tasse"         color={PASTEL.blue}   onClick={() => { setShowFab(false); setTab('tasse'); }} />
          </div>
        </>
      )}

      {showNuovaFattura && (
        <ModalNuovaFattura
          onClose={() => setShowNuovaFattura(false)}
          onCrea={async (data) => {
            const res = await fattHook.creaFattura(data);
            if (res.ok) { setShowNuovaFattura(false); setTab('fatture'); }
            else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}
      {showPagamento.open && (
        <ModalRegistraPagamento
          fatture={fattHook.fatture.filter(f => f.stato_calcolato === 'aperta' || f.stato_calcolato === 'parziale' || f.stato_calcolato === 'scaduta')}
          fatturaIdPreselect={showPagamento.fatturaId}
          onClose={() => setShowPagamento({ open: false })}
          onRegistra={async (args) => {
            const res = await fattHook.registraPagamento(args);
            if (res.ok) setShowPagamento({ open: false });
            else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}
      {fatturaCorrente && (
        <ModalDettaglioFattura
          fattura={fatturaCorrente}
          getPagamenti={() => fattHook.getPagamentiPerFattura(fatturaCorrente.id)}
          onClose={() => setDettaglioId(null)}
          onRegistraPagamento={() => { setDettaglioId(null); setShowPagamento({ open: true, fatturaId: fatturaCorrente.id }); }}
          onAnnulla={async () => {
            if (!confirm('Annullare definitivamente la fattura ' + fatturaCorrente.numero + ' ?')) return;
            const res = await fattHook.annullaFattura(fatturaCorrente.id);
            if (res.ok) setDettaglioId(null); else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}

      {showSpesa && (
        <ModalNuovaSpesa
          aziendaId={aziendaId}
          onClose={() => setShowSpesa(false)}
          onCrea={async (data) => {
            const res = await speseHook.creaSpesa(data);
            if (res.ok) { setShowSpesa(false); setTab('uscite'); setSubTabUscite('spese'); }
            else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}
      {showPagFornit.open && (
        <ModalPagamentoFornitore
          fatture={speseHook.fattRicevute.filter(f => f.stato_calcolato === 'da_pagare' || f.stato_calcolato === 'parziale' || f.stato_calcolato === 'scaduta')}
          fatturaIdPreselect={showPagFornit.fatturaId}
          onClose={() => setShowPagFornit({ open: false })}
          onRegistra={async (args) => {
            const res = await speseHook.registraPagamentoFornitore(args);
            if (res.ok) setShowPagFornit({ open: false });
            else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}
      {showNuovaFatturaRic && (
        <ModalNuovaFatturaRicevuta
          onClose={() => setShowNuovaFatturaRic(false)}
          onCrea={async (data) => {
            const res = await speseHook.creaFatturaRicevuta(data);
            if (res.ok) { setShowNuovaFatturaRic(false); setTab('uscite'); setSubTabUscite('fornitori'); }
            else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}
      {fatturaRicCorrente && (
        <ModalDettaglioFattRic
          fattura={fatturaRicCorrente}
          getPagamenti={() => speseHook.getPagamentiFatturaRicevuta(fatturaRicCorrente.id)}
          onClose={() => setDettaglioFattRicId(null)}
          onPaga={() => { setDettaglioFattRicId(null); setShowPagFornit({ open: true, fatturaId: fatturaRicCorrente.id }); }}
          onAnnulla={async () => {
            if (!confirm('Annullare la fattura ' + fatturaRicCorrente.numero + ' ?')) return;
            const res = await speseHook.annullaFatturaRicevuta(fatturaRicCorrente.id);
            if (res.ok) setDettaglioFattRicId(null); else alert('Errore: ' + (res.error || 'sconosciuto'));
          }}
        />
      )}

      {plDettaglio && (
        <ModalDettaglioPL
          commessa={plDettaglio}
          onClose={() => setPlDettaglio(null)}
        />
      )}
    </div>
  );
}

export function SectionLabel({ Ico, title, sub }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
      <Ico size={11} color={MUTED} />
      <div style={{ fontSize: 10, color: MUTED, letterSpacing: 1, fontWeight: 800, flex: 1 }}>{title}</div>
      {sub && <div style={{ fontSize: 9, color: MUTED, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

export function AlertCard({ alert, onDismiss, expanded }: any) {
  const sevMeta: Record<string, any> = { critical: PASTEL.red, warning: PASTEL.amber, info: PASTEL.blue };
  const m = sevMeta[alert.severity] || PASTEL.blue;
  const tipoIco: Record<string, any> = {
    liquidita: IcoEuro, margine: IcoTrendingUp, spesa_anomala: IcoAlertTriangle,
    cliente_lento: IcoUser, iva: IcoBuilding, suggerimento: IcoSparkles,
  };
  const Ico = tipoIco[alert.tipo] || IcoSparkles;
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 6, borderLeft: `4px solid ${m.solid}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
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
            ÔåÆ {alert.azione_suggerita}
          </div>
        )}
      </div>
      <button onClick={() => onDismiss(alert.id)} aria-label="Chiudi" style={{ width: 26, height: 26, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IcoCheck size={14} color={MUTED} />
      </button>
    </div>
  );
}

function ScadenzaRiga({ ev, expanded }: any) {
  const isIn = ev.direzione === 'in';
  const col = isIn ? PASTEL.green : PASTEL.red;
  const d = new Date(ev.data);
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const gg = Math.round((d.getTime() - oggi.getTime()) / 86400000);
  const dataFmt = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  const labelGg = gg === 0 ? 'oggi' : gg === 1 ? 'domani' : `+${gg}gg`;
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${col.solid}` }}>
      <div style={{ width: 50, padding: '6px 0', textAlign: 'center' as const, background: col.bg, color: col.text, borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: 0.3 }}>
        <div>{dataFmt}</div>
        <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>{labelGg}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }}>{ev.descrizione}</div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 1, fontWeight: 600 }}>{(ev.tipo || '').toUpperCase().replace(/_/g, ' ')}</div>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: col.solid }}>{isIn ? '+' : 'ÔêÆ'}{formatEuro(ev.importo)}</div>
      </div>
    </div>
  );
}

export function CashflowChart({ cashflow, kpi }: any) {
  if (cashflow.length === 0) return <div style={{ padding: 30, color: MUTED, textAlign: 'center' as const }}>Nessun dato cashflow</div>;
  const max = Math.max(...cashflow.map((g: any) => g.saldo_previsto), 0);
  const min = Math.min(...cashflow.map((g: any) => g.saldo_previsto), 0);
  const range = max - min || 1;
  const W = 320, H = 140, margin = 6;
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
      <SectionLabel Ico={IcoTrendingUp} title="CASHFLOW 90 GIORNI" sub={`oggi ÔåÆ ${new Date(Date.now() + 90*86400000).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`} />
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
          {sogliaY > 0 && sogliaY < H && <rect x={0} y={sogliaY} width={W} height={H - sogliaY} fill={PASTEL.red.bg} opacity={0.4} />}
          <line x1={0} y1={sogliaY} x2={W} y2={sogliaY} stroke={PASTEL.red.solid} strokeDasharray="3 3" strokeWidth={0.8} opacity={0.6} />
          {zeroY > 0 && zeroY < H && <line x1={0} y1={zeroY} x2={W} y2={zeroY} stroke={MUTED} strokeWidth={0.5} strokeDasharray="2 2" opacity={0.5} />}
          <polyline points={pts} fill="none" stroke={PASTEL.teal.solid} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={`${margin},${H-margin} ${pts} ${W-margin},${H-margin}`} fill={PASTEL.teal.solid} opacity={0.12} />
          {cashflow.map((g: any, i: number) => {
            if (g.eventi.length === 0) return null;
            const x = margin + (i / (cashflow.length - 1)) * (W - margin * 2);
            const y = margin + (H - margin * 2) * (1 - (g.saldo_previsto - min) / range);
            const hasIn = g.eventi.some((e: any) => e.direzione === 'in');
            return <circle key={i} cx={x} cy={y} r={3} fill={hasIn ? PASTEL.green.solid : PASTEL.red.solid} stroke="#fff" strokeWidth={1.2} />;
          })}
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: MUTED, fontWeight: 600 }}>
          <span>oggi</span><span>+30gg</span><span>+60gg</span><span>+90gg</span>
        </div>
      </div>
      {minSaldo < 5000 && minGiorno && (
        <div style={{ background: PASTEL.red.bg, borderRadius: 12, padding: 12, borderLeft: `4px solid ${PASTEL.red.solid}`, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PASTEL.red.text }}>ÔÜá Rischio liquidit├á rilevato</div>
          <div style={{ fontSize: 11, color: PASTEL.red.text, marginTop: 4, lineHeight: 1.35 }}>
            Il {new Date(minGiorno.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} il saldo previsto scende a <strong>{formatEuro(minSaldo)}</strong>. Verifica incassi e rinvia spese non urgenti.
          </div>
        </div>
      )}
    </>
  );
}

export function FabBtn({ Ico, label, color, onClick }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ background: '#fff', color: TEXT, padding: '7px 12px', borderRadius: 10, fontSize: 11, fontWeight: 700, boxShadow: '0 2px 8px rgba(15,27,45,0.18)' }}>{label}</div>
      <button onClick={onClick} style={{
        width: 44, height: 44, borderRadius: 22, background: color.solid, color: '#fff', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${color.solid}55`,
      }}>
        <Ico size={18} color="#fff" />
      </button>
    </div>
  );
}

function KpiMini({ color, label, valore, sub }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 10, borderLeft: `4px solid ${color.solid}` }}>
      <div style={{ fontSize: 8, color: MUTED, letterSpacing: 0.9, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: color.solid, marginTop: 3, letterSpacing: -0.3 }}>{valore}</div>
      <div style={{ fontSize: 9, color: MUTED, marginTop: 1, fontWeight: 600 }}>{sub}</div>
    </div>
  );
}

function TabFatture({ fatture, kpi, filtro, setFiltro, search, setSearch, onApriDettaglio, onApriPagamento }: any) {
  const filtri: { val: FiltroFatture; label: string; count?: number }[] = [
    { val: 'tutte',    label: 'Tutte',       count: kpi?.n_totali  },
    { val: 'aperte',   label: 'Da incassare',count: kpi?.n_aperte  },
    { val: 'scadute',  label: 'Scadute',     count: kpi?.n_scadute },
    { val: 'pagate',   label: 'Pagate',      count: kpi?.n_pagate  },
  ];
  return (
    <>
      {kpi && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <KpiMini color={PASTEL.teal}  label="DA INCASSARE" valore={formatEuroShort(kpi.importo_aperto)} sub={`${kpi.n_aperte} fatture aperte`} />
          <KpiMini color={PASTEL.red}   label="SCADUTO"      valore={formatEuroShort(kpi.importo_scaduto)} sub={`${kpi.n_scadute} fatture scadute`} />
          <KpiMini color={PASTEL.green} label="INCASSATO"    valore={formatEuroShort(kpi.importo_pagato)} sub={`${kpi.n_pagate} fatture pagate`} />
          <KpiMini color={PASTEL.navy}  label="TOTALE EMESSO" valore={formatEuroShort(kpi.importo_totale)} sub={`${kpi.n_totali} fatture totali`} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto' as const, paddingBottom: 2 }}>
        {filtri.map(f => (
          <button key={f.val} onClick={() => setFiltro(f.val)} style={{
            flex: '0 0 auto', padding: '6px 12px', borderRadius: 8,
            background: filtro === f.val ? TEXT : '#fff',
            color: filtro === f.val ? '#fff' : MUTED,
            border: '1px solid ' + (filtro === f.val ? TEXT : '#E5EAF0'),
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
          }}>
            {f.label}{f.count !== undefined ? ` ┬À ${f.count}` : ''}
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, border: '1px solid #E5EAF0' }}>
        <IcoSearch size={14} color={MUTED} />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca cliente, numero, commessa..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, fontFamily: 'inherit', background: 'transparent' }}
        />
        {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}><IcoX size={12} color={MUTED} /></button>}
      </div>
      {fatture.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>Nessuna fattura trovata</div>
      ) : (
        fatture.map((f: FatturaFin) => <FatturaRiga key={f.id} fattura={f} onApri={() => onApriDettaglio(f.id)} onPagamento={() => onApriPagamento(f.id)} />)
      )}
    </>
  );
}

export function FatturaRiga({ fattura, onApri, onPagamento }: any) {
  const statoMeta: Record<string, any> = {
    pagata: { col: PASTEL.green, label: 'PAGATA' },
    scaduta: { col: PASTEL.red, label: 'SCADUTA' },
    parziale: { col: PASTEL.amber, label: 'ACCONTO' },
    aperta: { col: PASTEL.teal, label: 'DA INCASSARE' },
    annullata: { col: PASTEL.navy, label: 'ANNULLATA' },
  };
  const m = statoMeta[fattura.stato_calcolato] || statoMeta.aperta;
  const isApribile = fattura.stato_calcolato !== 'pagata' && fattura.stato_calcolato !== 'annullata';
  const dataEm = new Date(fattura.data_emissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  const ggLabel = fattura.giorni_a_scadenza === null ? '' :
    fattura.giorni_a_scadenza < 0 ? `scaduta da ${fattura.giorni_ritardo}gg` :
    fattura.giorni_a_scadenza === 0 ? 'scade oggi' :
    `tra ${fattura.giorni_a_scadenza}gg`;

  return (
    <div onClick={onApri} style={{ background: '#fff', borderRadius: 12, padding: 11, marginBottom: 6, borderLeft: `4px solid ${m.col.solid}`, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>{fattura.cliente_display}</span>
          {fattura.commessa_code && <span style={{ fontSize: 8, color: PASTEL.navy.solid, background: PASTEL.navy.bg, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{fattura.commessa_code}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginTop: 3 }}>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>n.{fattura.numero}</span>
          <span style={{ fontSize: 10, color: MUTED }}>┬À</span>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{dataEm}</span>
          {ggLabel && <><span style={{ fontSize: 10, color: MUTED }}>┬À</span><span style={{ fontSize: 10, color: fattura.giorni_a_scadenza !== null && fattura.giorni_a_scadenza < 0 ? PASTEL.red.solid : MUTED, fontWeight: 700 }}>{ggLabel}</span></>}
        </div>
        <div style={{ display: 'inline-block', marginTop: 5, fontSize: 8, color: m.col.text, background: m.col.bg, padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: 0.5 }}>{m.label}</div>
      </div>
      <div style={{ textAlign: 'right' as const, minWidth: 90 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{formatEuro(fattura.totale)}</div>
        {fattura.pagato > 0 && fattura.residuo > 0 && <div style={{ fontSize: 9, color: PASTEL.green.solid, marginTop: 2, fontWeight: 700 }}>incassato {formatEuro(fattura.pagato)}</div>}
        {fattura.residuo > 0 && <div style={{ fontSize: 10, color: PASTEL.amber.solid, marginTop: 2, fontWeight: 700 }}>resta {formatEuro(fattura.residuo)}</div>}
        {isApribile && <button onClick={(e) => { e.stopPropagation(); onPagamento(); }} style={{ marginTop: 6, padding: '4px 8px', background: PASTEL.green.solid, color: '#fff', border: 'none', borderRadius: 6, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>+ PAGAMENTO</button>}
      </div>
    </div>
  );
}
function TabUscite({
  subTab, setSubTab, kpiSpese, kpiFatt, categorieSpese,
  spese, fornit, pagamentiStorico,
  filtroSpese, setFiltroSpese, searchSpese, setSearchSpese,
  filtroFornit, setFiltroFornit, searchFornit, setSearchFornit,
  onEliminaSpesa, onApriFornit, onPagaFornit, onNuovaFattRic, onNuovaSpesa,
}: any) {
  const subTabs = [
    { val: 'spese',     label: `Spese${kpiSpese ? ` ┬À ${kpiSpese.n_mese}` : ''}` },
    { val: 'fornitori', label: `Fornitori${kpiFatt ? ` ┬À ${kpiFatt.n_da_pagare}` : ''}` },
    { val: 'storico',   label: 'Pagati' },
  ];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {kpiSpese && <KpiMini color={PASTEL.amber} label="SPESE MESE" valore={formatEuroShort(kpiSpese.totale_mese)} sub={`${kpiSpese.n_mese} spese ┬À ${formatEuroShort(kpiSpese.totale_mese_scorso)} mese -1`} />}
        {kpiFatt && (
          <>
            <KpiMini color={PASTEL.red}   label="DA PAGARE"     valore={formatEuroShort(kpiFatt.importo_da_pagare)} sub={`${kpiFatt.n_da_pagare} fatture aperte`} />
            <KpiMini color={PASTEL.peach} label="SCADUTO"       valore={formatEuroShort(kpiFatt.importo_scaduto)} sub={`${kpiFatt.n_scadute} fatture scadute`} />
            <KpiMini color={PASTEL.green} label="PAGATO TOTALE" valore={formatEuroShort(kpiFatt.importo_pagato)} sub={`${kpiFatt.n_pagate} fatture pagate`} />
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 3, marginBottom: 12, background: '#fff', padding: 3, borderRadius: 10, border: '1px solid #E5EAF0' }}>
        {subTabs.map(t => (
          <button key={t.val} onClick={() => setSubTab(t.val)} style={{
            flex: 1, padding: '8px 6px',
            background: subTab === t.val ? PASTEL.amber.solid : 'transparent',
            color: subTab === t.val ? '#fff' : MUTED,
            border: 'none', borderRadius: 7,
            fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </div>

      {subTab === 'spese' && (
        <>
          <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto' as const, paddingBottom: 2 }}>
            {[
              { val: 'mese',        label: 'Questo mese' },
              { val: 'mese_scorso', label: 'Mese scorso' },
              { val: '90gg',        label: '90 giorni' },
              { val: 'tutte',       label: 'Tutte' },
            ].map(f => (
              <button key={f.val} onClick={() => setFiltroSpese(f.val)} style={{
                flex: '0 0 auto', padding: '6px 12px', borderRadius: 8,
                background: filtroSpese === f.val ? TEXT : '#fff',
                color: filtroSpese === f.val ? '#fff' : MUTED,
                border: '1px solid ' + (filtroSpese === f.val ? TEXT : '#E5EAF0'),
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
              }}>{f.label}</button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, border: '1px solid #E5EAF0' }}>
            <IcoSearch size={14} color={MUTED} />
            <input
              type="text" value={searchSpese} onChange={(e) => setSearchSpese(e.target.value)}
              placeholder="Cerca categoria, fornitore, descrizione..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, fontFamily: 'inherit', background: 'transparent' }}
            />
            {searchSpese && <button onClick={() => setSearchSpese('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}><IcoX size={12} color={MUTED} /></button>}
          </div>

          {categorieSpese.length > 0 && filtroSpese === 'mese' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' as const, marginBottom: 12, paddingBottom: 2 }}>
              {categorieSpese.map((c: any) => {
                const meta = CATEGORIE_SPESA.find(x => x.val === c.categoria);
                return (
                  <div key={c.categoria} style={{ flex: '0 0 auto', background: '#fff', borderRadius: 10, padding: '8px 10px', border: '1px solid #E5EAF0', minWidth: 80 }}>
                    <div style={{ fontSize: 9, color: MUTED, fontWeight: 700, letterSpacing: 0.5 }}>{(meta?.label || c.categoria).toUpperCase()}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: TEXT, marginTop: 2 }}>{formatEuroShort(c.totale)}</div>
                    <div style={{ fontSize: 9, color: MUTED, marginTop: 1 }}>{c.n_spese} spese</div>
                  </div>
                );
              })}
            </div>
          )}

          {spese.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
              Nessuna spesa nel periodo
              <button onClick={onNuovaSpesa} style={{ display: 'block', margin: '12px auto 0', padding: '8px 16px', background: PASTEL.amber.solid, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Aggiungi spesa
              </button>
            </div>
          ) : (
            spese.map((s: SpesaRow) => <SpesaRiga key={s.id} spesa={s} onElimina={() => onEliminaSpesa(s.id)} />)
          )}
        </>
      )}

      {subTab === 'fornitori' && (
        <>
          <div style={{ display: 'flex', gap: 5, marginBottom: 10, overflowX: 'auto' as const, paddingBottom: 2 }}>
            {[
              { val: 'da_pagare', label: 'Da pagare',  count: kpiFatt?.n_da_pagare },
              { val: 'scadute',   label: 'Scadute',    count: kpiFatt?.n_scadute },
              { val: 'pagate',    label: 'Pagate',     count: kpiFatt?.n_pagate },
              { val: 'tutte',     label: 'Tutte',      count: kpiFatt?.n_totali },
            ].map((f: any) => (
              <button key={f.val} onClick={() => setFiltroFornit(f.val)} style={{
                flex: '0 0 auto', padding: '6px 12px', borderRadius: 8,
                background: filtroFornit === f.val ? TEXT : '#fff',
                color: filtroFornit === f.val ? '#fff' : MUTED,
                border: '1px solid ' + (filtroFornit === f.val ? TEXT : '#E5EAF0'),
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
              }}>
                {f.label}{f.count !== undefined ? ` ┬À ${f.count}` : ''}
              </button>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, border: '1px solid #E5EAF0' }}>
            <IcoSearch size={14} color={MUTED} />
            <input
              type="text" value={searchFornit} onChange={(e) => setSearchFornit(e.target.value)}
              placeholder="Cerca fornitore, numero, commessa..."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, fontFamily: 'inherit', background: 'transparent' }}
            />
            {searchFornit && <button onClick={() => setSearchFornit('')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}><IcoX size={12} color={MUTED} /></button>}
          </div>

          {fornit.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
              Nessuna fattura fornitore nel periodo
              <button onClick={onNuovaFattRic} style={{ display: 'block', margin: '12px auto 0', padding: '8px 16px', background: PASTEL.violet.solid, color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Registra fattura fornitore
              </button>
            </div>
          ) : (
            fornit.map((f: FatturaRicevutaRow) => <FattRicevutaRiga key={f.id} fattura={f} onApri={() => onApriFornit(f.id)} onPaga={() => onPagaFornit(f.id)} />)
          )}
        </>
      )}

      {subTab === 'storico' && (
        <>
          <SectionLabel Ico={IcoCheck} title="FATTURE FORNITORI PAGATE" sub={`${(pagamentiStorico || []).filter((f: any) => f.stato_calcolato === 'pagata').length} fatture`} />
          {(pagamentiStorico || []).filter((f: any) => f.stato_calcolato === 'pagata').length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
              Nessuna fattura ancora pagata
            </div>
          ) : (
            pagamentiStorico.filter((f: FatturaRicevutaRow) => f.stato_calcolato === 'pagata').map((f: FatturaRicevutaRow) =>
              <FattRicevutaRiga key={f.id} fattura={f} onApri={() => onApriFornit(f.id)} onPaga={null} />
            )
          )}
        </>
      )}
    </>
  );
}

export function SpesaRiga({ spesa, onElimina }: any) {
  const meta = CATEGORIE_SPESA.find(c => c.val === spesa.categoria);
  const d = new Date(spesa.data).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 11, marginBottom: 6, borderLeft: `4px solid ${PASTEL.amber.solid}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: PASTEL.amber.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
        {meta?.icon || 'ÔÇó'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>{meta?.label || spesa.categoria}</div>
        {spesa.descrizione && <div style={{ fontSize: 11, color: MUTED, marginTop: 1, lineHeight: 1.3 }}>{spesa.descrizione}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{d}</span>
          {spesa.fornitore && (<>
            <span style={{ fontSize: 10, color: MUTED }}>┬À</span>
            <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{spesa.fornitore}</span>
          </>)}
          {spesa.commessa_id && (<>
            <span style={{ fontSize: 10, color: MUTED }}>┬À</span>
            <span style={{ fontSize: 9, color: PASTEL.navy.solid, background: PASTEL.navy.bg, padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>{spesa.commessa_id}</span>
          </>)}
        </div>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: PASTEL.amber.solid }}>ÔêÆ{formatEuro(spesa.importo)}</div>
        {spesa.foto_url && <div style={{ fontSize: 8, color: MUTED, marginTop: 2, fontWeight: 600 }}>­ƒôÄ foto</div>}
        <button onClick={(e) => { e.stopPropagation(); onElimina(); }} style={{ marginTop: 4, padding: '2px 6px', background: 'transparent', color: PASTEL.red.solid, border: '1px solid ' + PASTEL.red.bg, borderRadius: 5, fontSize: 9, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          ELIMINA
        </button>
      </div>
    </div>
  );
}

function FattRicevutaRiga({ fattura, onApri, onPaga }: any) {
  const statoMeta: Record<string, any> = {
    pagata: { col: PASTEL.green, label: 'PAGATA' },
    scaduta: { col: PASTEL.red, label: 'SCADUTA' },
    parziale: { col: PASTEL.amber, label: 'PARZIALE' },
    da_pagare: { col: PASTEL.peach, label: 'DA PAGARE' },
    annullata: { col: PASTEL.navy, label: 'ANNULLATA' },
  };
  const m = statoMeta[fattura.stato_calcolato] || statoMeta.da_pagare;
  const isPagabile = fattura.stato_calcolato !== 'pagata' && fattura.stato_calcolato !== 'annullata';
  const dataRic = new Date(fattura.data_ricezione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  const ggLabel = fattura.giorni_a_scadenza === null ? '' :
    fattura.giorni_a_scadenza < 0 ? `scaduta da ${fattura.giorni_ritardo}gg` :
    fattura.giorni_a_scadenza === 0 ? 'scade oggi' :
    `tra ${fattura.giorni_a_scadenza}gg`;

  return (
    <div onClick={onApri} style={{ background: '#fff', borderRadius: 12, padding: 11, marginBottom: 6, borderLeft: `4px solid ${m.col.solid}`, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>{fattura.fornitore}</span>
          {fattura.commessa_code && <span style={{ fontSize: 8, color: PASTEL.navy.solid, background: PASTEL.navy.bg, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{fattura.commessa_code}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginTop: 3 }}>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>n.{fattura.numero}</span>
          <span style={{ fontSize: 10, color: MUTED }}>┬À</span>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>{dataRic}</span>
          {ggLabel && <><span style={{ fontSize: 10, color: MUTED }}>┬À</span><span style={{ fontSize: 10, color: fattura.giorni_a_scadenza !== null && fattura.giorni_a_scadenza < 0 ? PASTEL.red.solid : MUTED, fontWeight: 700 }}>{ggLabel}</span></>}
        </div>
        <div style={{ display: 'inline-block', marginTop: 5, fontSize: 8, color: m.col.text, background: m.col.bg, padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: 0.5 }}>{m.label}</div>
      </div>
      <div style={{ textAlign: 'right' as const, minWidth: 90 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEXT }}>{formatEuro(fattura.totale)}</div>
        {fattura.pagato > 0 && fattura.residuo > 0 && <div style={{ fontSize: 9, color: PASTEL.green.solid, marginTop: 2, fontWeight: 700 }}>pagato {formatEuro(fattura.pagato)}</div>}
        {fattura.residuo > 0 && <div style={{ fontSize: 10, color: PASTEL.red.solid, marginTop: 2, fontWeight: 700 }}>resta {formatEuro(fattura.residuo)}</div>}
        {isPagabile && onPaga && (
          <button onClick={(e) => { e.stopPropagation(); onPaga(); }} style={{ marginTop: 6, padding: '4px 8px', background: PASTEL.red.solid, color: '#fff', border: 'none', borderRadius: 6, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
            + PAGA
          </button>
        )}
      </div>
    </div>
  );
}

// =============== TAB P&L (Blocco 8) ===============
function TabPL({ kpi, top5, bottom5, inPerdita, bassoMargine, commesseAttive, onApriDettaglio }: any) {
  if (!kpi || commesseAttive.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
        Nessun dato P&L disponibile.<br/>
        Crea fatture e collega costi/spese alle commesse per vedere il margine reale.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <KpiMini color={PASTEL.green} label="UTILE TOTALE" valore={formatEuroShort(kpi.utile_totale)} sub={`${kpi.n_commesse_totali} commesse ┬À ${formatEuroShort(kpi.ricavi_totali)} ricavi`} />
        <KpiMini color={PASTEL.teal} label="MARGINE MEDIO" valore={kpi.margine_medio_pct !== null ? `${kpi.margine_medio_pct.toFixed(1)}%` : 'ÔÇö'} sub={`${kpi.n_margine_ottimo} ottime ┬À ${kpi.n_margine_ok} ok`} />
        <KpiMini color={PASTEL.red} label="IN PERDITA" valore={String(kpi.n_in_perdita)} sub={kpi.n_in_perdita > 0 ? 'Attenzione!' : 'Tutto OK'} />
        <KpiMini color={PASTEL.amber} label="BASSO MARGINE" valore={String(kpi.n_basso_margine)} sub="margine < 10%" />
      </div>

      {inPerdita.length > 0 && (
        <div style={{ background: PASTEL.red.bg, borderRadius: 12, padding: 12, borderLeft: `4px solid ${PASTEL.red.solid}`, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PASTEL.red.text }}>­ƒö┤ {inPerdita.length} commesse in perdita</div>
          <div style={{ fontSize: 11, color: PASTEL.red.text, marginTop: 4, lineHeight: 1.35 }}>
            Costi superano i ricavi su <strong>{inPerdita.map((c: CommessaPLRow) => c.commessa_code).join(', ')}</strong>. Verifica fatturazione mancante o sovra-costi.
          </div>
        </div>
      )}

      <SectionLabel Ico={IcoTrendingUp} title="TOP 5 PER UTILE" sub="commesse pi├╣ redditizie" />
      {top5.map((c: CommessaPLRow) => <PLRiga key={c.commessa_id} commessa={c} onApri={() => onApriDettaglio(c)} />)}

      {bottom5.length > 0 && bottom5[0].commessa_code !== top5[top5.length - 1]?.commessa_code && (
        <>
          <div style={{ height: 12 }} />
          <SectionLabel Ico={IcoAlertTriangle} title="BOTTOM 5 PER UTILE" sub="commesse da monitorare" />
          {bottom5.filter((c: CommessaPLRow) => !top5.find((t: CommessaPLRow) => t.commessa_id === c.commessa_id))
                  .map((c: CommessaPLRow) => <PLRiga key={c.commessa_id} commessa={c} onApri={() => onApriDettaglio(c)} />)}
        </>
      )}
    </>
  );
}

function PLRiga({ commessa, onApri }: any) {
  const m = statoPLMeta(commessa.stato_pl);
  const col = (PASTEL as any)[m.tone] || PASTEL.navy;
  const inUtile = commessa.utile_reale >= 0;

  return (
    <div onClick={onApri} style={{ background: '#fff', borderRadius: 12, padding: 11, marginBottom: 6, borderLeft: `4px solid ${col.solid}`, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 9, color: PASTEL.navy.solid, background: PASTEL.navy.bg, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>{commessa.commessa_code}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: TEXT, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, whiteSpace: 'nowrap' as const }}>{commessa.cliente || 'ÔÇö'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const, marginTop: 4 }}>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>Ricavi {formatEuroShort(commessa.ricavi_fatturati)}</span>
          <span style={{ fontSize: 10, color: MUTED }}>┬À</span>
          <span style={{ fontSize: 10, color: PASTEL.red.solid, fontWeight: 700 }}>Costi {formatEuroShort(commessa.costi_totali)}</span>
        </div>
        <div style={{ display: 'inline-block', marginTop: 5, fontSize: 8, color: col.text, background: col.bg, padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: 0.5 }}>
          {m.emoji} {m.label.toUpperCase()}
        </div>
      </div>
      <div style={{ textAlign: 'right' as const, minWidth: 95 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: inUtile ? PASTEL.green.solid : PASTEL.red.solid, letterSpacing: -0.3 }}>
          {inUtile ? '+' : ''}{formatEuroShort(commessa.utile_reale)}
        </div>
        {commessa.margine_pct_reale !== null && (
          <div style={{ fontSize: 11, color: inUtile ? PASTEL.green.solid : PASTEL.red.solid, fontWeight: 700, marginTop: 1 }}>
            {commessa.margine_pct_reale.toFixed(1)}%
          </div>
        )}
        {commessa.delta_margine_pct !== null && (
          <div style={{ fontSize: 9, color: commessa.delta_margine_pct >= 0 ? PASTEL.green.solid : PASTEL.red.solid, marginTop: 2, fontWeight: 700 }}>
            {commessa.delta_margine_pct >= 0 ? '+' : ''}{commessa.delta_margine_pct.toFixed(1)}% vs atteso
          </div>
        )}
      </div>
    </div>
  );
}

export function ModalDettaglioPL({ commessa, onClose }: any) {
  const m = statoPLMeta(commessa.stato_pl);
  const col = (PASTEL as any)[m.tone] || PASTEL.navy;
  const inUtile = commessa.utile_reale >= 0;

  return (
    <ModalShell color={col} icon={IcoTrendingUp} title={`P&L ${commessa.commessa_code}`} sub={commessa.cliente || 'ÔÇö'} onClose={onClose}>
      <Sezione titolo="MARGINE REALE">
        <div style={{ background: col.bg, borderRadius: 12, padding: 14, textAlign: 'center' as const }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: inUtile ? PASTEL.green.solid : PASTEL.red.solid, letterSpacing: -1 }}>
            {inUtile ? '+' : ''}{formatEuro(commessa.utile_reale)}
          </div>
          {commessa.margine_pct_reale !== null && (
            <div style={{ fontSize: 16, fontWeight: 800, color: inUtile ? PASTEL.green.solid : PASTEL.red.solid, marginTop: 4 }}>
              {commessa.margine_pct_reale.toFixed(1)}% margine
            </div>
          )}
          {commessa.delta_margine_pct !== null && (
            <div style={{ fontSize: 11, color: commessa.delta_margine_pct >= 0 ? PASTEL.green.solid : PASTEL.red.solid, marginTop: 6, fontWeight: 700 }}>
              {commessa.delta_margine_pct >= 0 ? '+' : ''}{commessa.delta_margine_pct.toFixed(1)}% vs preventivato ({commessa.margine_atteso_pct?.toFixed(0)}%)
            </div>
          )}
          <div style={{ display: 'inline-block', marginTop: 8, fontSize: 10, color: col.text, background: '#fff', padding: '4px 10px', borderRadius: 6, fontWeight: 800, letterSpacing: 0.5 }}>
            {m.emoji} {m.label.toUpperCase()}
          </div>
        </div>
      </Sezione>

      <Sezione titolo="RICAVI">
        <RigaInfo label="Fatturato totale" value={formatEuro(commessa.ricavi_fatturati, 2)} bold />
        <RigaInfo label="Gi├á incassato" value={formatEuro(commessa.ricavi_incassati, 2)} color={PASTEL.green.solid} />
        <RigaInfo label="Da incassare" value={formatEuro(commessa.ricavi_da_incassare, 2)} color={PASTEL.amber.solid} last />
      </Sezione>

      <Sezione titolo="COSTI">
        <RigaInfo label={`Materiali fornitori (${commessa.n_fatt_fornitore} fatt.)`} value={formatEuro(commessa.costi_materiali, 2)} />
        <RigaInfo label={`Spese titolare (${commessa.n_spese} voci)`} value={formatEuro(commessa.costi_spese, 2)} />
        <RigaInfo label="TOTALE COSTI" value={formatEuro(commessa.costi_totali, 2)} bold color={PASTEL.red.solid} last />
      </Sezione>

      <Sezione titolo="CASSA REALE (solo incassato - solo pagato)">
        <div style={{ background: '#F1F4F7', borderRadius: 8, padding: 10 }}>
          <RigaInfo label="Incassato" value={formatEuro(commessa.ricavi_incassati, 2)} color={PASTEL.green.solid} />
          <RigaInfo label="Pagato fornitori" value={formatEuro(commessa.costi_materiali_pagati, 2)} color={PASTEL.red.solid} />
          <RigaInfo label="Cassa netta" value={formatEuro(commessa.utile_cassa, 2)} bold color={commessa.utile_cassa >= 0 ? PASTEL.green.solid : PASTEL.red.solid} last />
        </div>
      </Sezione>

      {commessa.prezzo_finale_eur && (
        <Sezione titolo="PREVENTIVATO vs REALE">
          <RigaInfo label="Prezzo concordato" value={formatEuro(commessa.prezzo_finale_eur, 2)} />
          <RigaInfo label="Fatturato finora" value={formatEuro(commessa.ricavi_fatturati, 2)} />
          <RigaInfo label="Margine atteso" value={commessa.margine_atteso_pct ? `${commessa.margine_atteso_pct.toFixed(0)}%` : 'ÔÇö'} />
          <RigaInfo label="Margine reale" value={commessa.margine_pct_reale !== null ? `${commessa.margine_pct_reale.toFixed(1)}%` : 'ÔÇö'} bold color={inUtile ? PASTEL.green.solid : PASTEL.red.solid} last />
        </Sezione>
      )}

      <ModalFooter>
        <BtnPrimary color={col} onClick={onClose}>Chiudi</BtnPrimary>
      </ModalFooter>
    </ModalShell>
  );
}

// =============== TAB TASSE (Blocco 7) ===============
function TabTasse({ kpi, liquidazioni, eventiProssimi, eventiScaduti, onMarcaVersata }: any) {
  if (!kpi || liquidazioni.length === 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 12, padding: 30, textAlign: 'center' as const, color: MUTED, fontSize: 12 }}>
        Nessuna liquidazione IVA disponibile.<br/>
        Le liquidazioni vengono calcolate automaticamente dalle fatture emesse e ricevute.
      </div>
    );
  }

  const prossimaSc = kpi.prossima_scadenza ? new Date(kpi.prossima_scadenza) : null;
  const giorniProssima = prossimaSc ? Math.round((prossimaSc.getTime() - new Date().setHours(0,0,0,0)) / 86400000) : null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <KpiMini color={PASTEL.red} label="DA VERSARE" valore={formatEuroShort(kpi.importo_da_versare)} sub={`${kpi.n_aperte} liquidazioni aperte`} />
        <KpiMini color={PASTEL.peach} label="SCADUTO" valore={formatEuroShort(kpi.importo_scaduto)} sub={`${kpi.n_scadute} scadute`} />
        <KpiMini color={PASTEL.green} label="VERSATO TOTALE" valore={formatEuroShort(kpi.importo_versato_totale)} sub={`${kpi.n_versate} liquidazioni`} />
        <KpiMini color={PASTEL.blue} label="PROSSIMA SCADENZA" valore={giorniProssima !== null ? (giorniProssima === 0 ? 'OGGI' : giorniProssima < 0 ? `${-giorniProssima}gg fa` : `+${giorniProssima}gg`) : 'ÔÇö'} sub={prossimaSc ? prossimaSc.toLocaleDateString('it-IT') : ''} />
      </div>

      {kpi.importo_scaduto > 0 && (
        <div style={{ background: PASTEL.red.bg, borderRadius: 12, padding: 12, borderLeft: `4px solid ${PASTEL.red.solid}`, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PASTEL.red.text }}>­ƒö┤ Hai {formatEuro(kpi.importo_scaduto)} di tasse SCADUTE</div>
          <div style={{ fontSize: 11, color: PASTEL.red.text, marginTop: 4, lineHeight: 1.35 }}>
            Versa subito per evitare sanzioni e interessi. Ravvedimento operoso disponibile entro 30/90/365 giorni.
          </div>
        </div>
      )}

      {giorniProssima !== null && giorniProssima >= 0 && giorniProssima <= 14 && (
        <div style={{ background: PASTEL.amber.bg, borderRadius: 12, padding: 12, borderLeft: `4px solid ${PASTEL.amber.solid}`, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: PASTEL.amber.text }}>ÔÅ░ Scadenza tra {giorniProssima} gg: {formatEuro(kpi.importo_da_versare)}</div>
          <div style={{ fontSize: 11, color: PASTEL.amber.text, marginTop: 4, lineHeight: 1.35 }}>
            Prepara F24 e bonifico, ricorda di lasciare la liquidit├á sul conto.
          </div>
        </div>
      )}

      <SectionLabel Ico={IcoEuro} title="LIQUIDAZIONI IVA" sub={`${liquidazioni.length} totali`} />
      {liquidazioni.map((l: LiquidazioneIva) => <LiquidazioneIvaRiga key={l.id} liq={l} onMarcaVersata={() => onMarcaVersata(l.id)} />)}

      <div style={{ height: 12 }} />
      <SectionLabel Ico={IcoCalendar} title="CALENDARIO FISCALE 60GG" sub={`${eventiProssimi.length} eventi prossimi`} />
      {eventiProssimi.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20, textAlign: 'center' as const, color: MUTED, fontSize: 11 }}>
          Nessun evento fiscale nei prossimi 60 giorni
        </div>
      ) : (
        eventiProssimi.map((e: EventoFiscale) => <EventoFiscaleRiga key={e.id_evento} ev={e} />)
      )}
    </>
  );
}

function LiquidazioneIvaRiga({ liq, onMarcaVersata }: any) {
  const statoMeta: Record<string, any> = {
    versata:  { col: PASTEL.green, label: 'VERSATA' },
    scaduta:  { col: PASTEL.red, label: 'SCADUTA' },
    urgente:  { col: PASTEL.amber, label: 'URGENTE' },
    da_versare: { col: PASTEL.blue, label: 'DA VERSARE' },
  };
  const m = statoMeta[liq.stato_calcolato] || statoMeta.da_versare;
  const isPagabile = liq.stato_calcolato !== 'versata';
  const ggLabel = liq.giorni_a_scadenza === null ? '' :
    liq.giorni_a_scadenza < 0 ? `scaduta da ${liq.giorni_ritardo}gg` :
    liq.giorni_a_scadenza === 0 ? 'scade oggi' :
    `tra ${liq.giorni_a_scadenza}gg`;

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: 11, marginBottom: 6, borderLeft: `4px solid ${m.col.solid}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: TEXT }}>IVA {liq.periodo}</span>
          <span style={{ fontSize: 8, color: PASTEL.navy.solid, background: PASTEL.navy.bg, padding: '1px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' as const }}>{liq.tipo_periodo}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, marginTop: 3 }}>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>Vendite {formatEuroShort(liq.iva_vendite)}</span>
          <span style={{ fontSize: 10, color: MUTED }}>┬À</span>
          <span style={{ fontSize: 10, color: MUTED, fontWeight: 600 }}>Acquisti {formatEuroShort(liq.iva_acquisti)}</span>
          {liq.data_versamento && <><span style={{ fontSize: 10, color: MUTED }}>┬À</span><span style={{ fontSize: 10, color: liq.giorni_a_scadenza !== null && liq.giorni_a_scadenza < 0 ? PASTEL.red.solid : MUTED, fontWeight: 700 }}>{ggLabel}</span></>}
        </div>
        <div style={{ display: 'inline-block', marginTop: 5, fontSize: 8, color: m.col.text, background: m.col.bg, padding: '2px 6px', borderRadius: 4, fontWeight: 800, letterSpacing: 0.5 }}>{m.label}</div>
        {liq.f24_riferimento && <div style={{ fontSize: 9, color: MUTED, marginTop: 3, fontWeight: 600 }}>F24: {liq.f24_riferimento}</div>}
      </div>
      <div style={{ textAlign: 'right' as const, minWidth: 95 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: liq.debito_versare > 0 ? PASTEL.red.solid : PASTEL.green.solid, letterSpacing: -0.3 }}>
          {formatEuro(liq.debito_versare)}
        </div>
        {liq.data_versamento && (
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2, fontWeight: 600 }}>
            {new Date(liq.data_versamento).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
          </div>
        )}
        {isPagabile && (
          <button onClick={(e) => { e.stopPropagation(); onMarcaVersata(); }} style={{ marginTop: 6, padding: '4px 8px', background: PASTEL.green.solid, color: '#fff', border: 'none', borderRadius: 6, fontSize: 9, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
            Ô£ô VERSATA
          </button>
        )}
      </div>
    </div>
  );
}

function EventoFiscaleRiga({ ev }: any) {
  const meta = tipoEventoMeta(ev.tipo);
  const col = (PASTEL as any)[meta.tone] || PASTEL.navy;
  const d = new Date(ev.data);
  const oggi = new Date(); oggi.setHours(0,0,0,0);
  const gg = Math.round((d.getTime() - oggi.getTime()) / 86400000);
  const dataFmt = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  const labelGg = gg === 0 ? 'oggi' : gg === 1 ? 'domani' : gg < 0 ? `${-gg}gg fa` : `+${gg}gg`;

  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 10, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${col.solid}` }}>
      <div style={{ width: 50, padding: '6px 0', textAlign: 'center' as const, background: col.bg, color: col.text, borderRadius: 8, fontSize: 9, fontWeight: 800, letterSpacing: 0.3 }}>
        <div>{dataFmt}</div>
        <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>{labelGg}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>{meta.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }}>{ev.descrizione}</span>
        </div>
        <div style={{ fontSize: 9, color: MUTED, marginTop: 1, fontWeight: 600 }}>{meta.label}</div>
      </div>
      <div style={{ textAlign: 'right' as const }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: col.solid }}>{formatEuro(ev.importo)}</div>
      </div>
    </div>
  );
}

// =============== MODALI ===============
export function ModalNuovaFattura({ onClose, onCrea }: any) {
  const [cliente, setCliente] = useState('');
  const [piva, setPiva] = useState('');
  const [email, setEmail] = useState('');
  const [indirizzo, setIndirizzo] = useState('');
  const [citta, setCitta] = useState('');
  const [provincia, setProvincia] = useState('');
  const [dataEm, setDataEm] = useState(new Date().toISOString().split('T')[0]);
  const [dataScad, setDataScad] = useState(new Date(Date.now() + 30*86400000).toISOString().split('T')[0]);
  const [imponibile, setImponibile] = useState('');
  const [ivaP, setIvaP] = useState(22);
  const [tipo, setTipo] = useState<'acconto'|'saldo'|'sal'|'unica'|'altro'>('unica');
  const [commessa, setCommessa] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const imp = parseFloat(imponibile.replace(',', '.')) || 0;
  const iva = +(imp * ivaP / 100).toFixed(2);
  const tot = +(imp + iva).toFixed(2);
  const valido = cliente.trim().length > 0 && imp > 0 && dataEm.length === 10;

  async function submit() {
    if (!valido || submitting) return;
    setSubmitting(true);
    await onCrea({
      cliente: cliente.trim(),
      cliente_piva: piva.trim() || undefined,
      cliente_email: email.trim() || undefined,
      cliente_indirizzo: indirizzo.trim() || undefined,
      cliente_citta: citta.trim() || undefined,
      cliente_provincia: provincia.trim() || undefined,
      data_emissione: dataEm,
      data_scadenza: dataScad || null,
      imponibile: imp, iva_percent: ivaP, tipo,
      commessa_code: commessa.trim() || null,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell color={PASTEL.peach} icon={IcoFile} title="Nuova fattura" sub="Emetti fattura a cliente" onClose={onClose}>
      <Sezione titolo="CLIENTE">
        <Field label="Nome cliente / Ragione sociale *" value={cliente} setValue={setCliente} placeholder="Es. Rossi Mario o Edilcasa Srl" />
        <FieldRow>
          <Field label="P.IVA" value={piva} setValue={setPiva} placeholder="Opzionale" />
          <Field label="Email" value={email} setValue={setEmail} placeholder="Opzionale" type="email" />
        </FieldRow>
        <Field label="Indirizzo" value={indirizzo} setValue={setIndirizzo} placeholder="Via, numero" />
        <FieldRow>
          <Field label="Citt├á" value={citta} setValue={setCitta} />
          <Field label="Prov." value={provincia} setValue={setProvincia} placeholder="CS" />
        </FieldRow>
      </Sezione>
      <Sezione titolo="DATI FATTURA">
        <FieldRow>
          <Field label="Data emissione *" value={dataEm} setValue={setDataEm} type="date" />
          <Field label="Data scadenza" value={dataScad} setValue={setDataScad} type="date" />
        </FieldRow>
        <FieldRow>
          <Field label="Imponibile Ôé¼ *" value={imponibile} setValue={setImponibile} placeholder="0,00" type="number" />
          <Field label="IVA %" value={String(ivaP)} setValue={(v: any) => setIvaP(Number(v) || 0)} type="number" />
        </FieldRow>
        <div style={{ background: '#F1F4F7', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}><span>Imponibile</span><span style={{ fontWeight: 700, color: TEXT }}>{formatEuro(imp, 2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}><span>IVA {ivaP}%</span><span style={{ fontWeight: 700, color: TEXT }}>{formatEuro(iva, 2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT, fontWeight: 800, paddingTop: 5, borderTop: '1px solid #D8DEE5', marginTop: 4 }}><span>TOTALE</span><span>{formatEuro(tot, 2)}</span></div>
        </div>
      </Sezione>
      <Sezione titolo="TIPO E COLLEGAMENTI">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 8 }}>
          {(['unica','acconto','saldo','sal','altro'] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{
              padding: '8px 0', borderRadius: 8,
              background: tipo === t ? PASTEL.peach.solid : '#fff',
              color: tipo === t ? '#fff' : MUTED,
              border: '1px solid ' + (tipo === t ? PASTEL.peach.solid : '#E5EAF0'),
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase' as const,
            }}>{t}</button>
          ))}
        </div>
        <Field label="Codice commessa (opzionale)" value={commessa} setValue={setCommessa} placeholder="Es. S-0060" />
        <TextareaField label="Note" value={note} setValue={setNote} placeholder="Note interne o per il cliente..." />
      </Sezione>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Annulla</BtnSecondary>
        <BtnPrimary color={PASTEL.peach} onClick={submit} disabled={!valido || submitting}>{submitting ? 'Creazione...' : 'Crea fattura'}</BtnPrimary>
      </ModalFooter>
    </ModalShell>
  );
}

export function ModalRegistraPagamento({ fatture, fatturaIdPreselect, onClose, onRegistra }: any) {
  const [fatturaId, setFatturaId] = useState(fatturaIdPreselect || '');
  const [importo, setImporto] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState('bonifico');
  const [riferimento, setRiferimento] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fatturaSel = fatture.find((f: FatturaFin) => f.id === fatturaId);
  React.useEffect(() => {
    if (fatturaSel && !importo) setImporto(String(fatturaSel.residuo).replace('.', ','));
  }, [fatturaSel]);

  const imp = parseFloat(importo.replace(',', '.')) || 0;
  const valido = fatturaId && imp > 0 && data.length === 10;
  const supero = fatturaSel && imp > fatturaSel.residuo + 0.01;

  async function submit() {
    if (!valido || submitting) return;
    setSubmitting(true);
    await onRegistra({
      fatturaId, importo: imp, data, metodo,
      riferimento: riferimento.trim() || undefined,
      note: note.trim() || undefined,
      cliente: fatturaSel?.cliente_display,
      commessaCode: fatturaSel?.commessa_code,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell color={PASTEL.green} icon={IcoEuro} title="Pagamento ricevuto" sub="Registra incasso fattura" onClose={onClose}>
      <Sezione titolo="FATTURA">
        <div style={{ fontSize: 10, color: MUTED, marginBottom: 5, fontWeight: 700 }}>Seleziona fattura *</div>
        <select value={fatturaId} onChange={(e) => setFatturaId(e.target.value)} style={selectStyle}>
          <option value="">-- Seleziona --</option>
          {fatture.map((f: FatturaFin) => (<option key={f.id} value={f.id}>n.{f.numero} ┬À {f.cliente_display} ┬À resta {formatEuro(f.residuo)}</option>))}
        </select>
        {fatturaSel && (
          <div style={{ background: PASTEL.green.bg, borderRadius: 8, padding: 10, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: PASTEL.green.text, fontWeight: 700 }}>{fatturaSel.cliente_display}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
              Totale {formatEuro(fatturaSel.totale)} ┬À Pagato {formatEuro(fatturaSel.pagato)} ┬À <strong style={{ color: PASTEL.amber.solid }}>Resta {formatEuro(fatturaSel.residuo)}</strong>
            </div>
          </div>
        )}
      </Sezione>
      <Sezione titolo="PAGAMENTO">
        <FieldRow>
          <Field label="Importo Ôé¼ *" value={importo} setValue={setImporto} placeholder="0,00" type="number" />
          <Field label="Data *" value={data} setValue={setData} type="date" />
        </FieldRow>
        {supero && <div style={{ fontSize: 10, color: PASTEL.red.solid, marginTop: 4, fontWeight: 700 }}>ÔÜá Importo superiore al residuo</div>}
        <div style={{ fontSize: 10, color: MUTED, marginTop: 8, marginBottom: 5, fontWeight: 700 }}>Metodo pagamento</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
          {METODI_PAGAMENTO.map(m => (
            <button key={m} onClick={() => setMetodo(m)} style={{
              padding: '8px 0', borderRadius: 8,
              background: metodo === m ? PASTEL.green.solid : '#fff',
              color: metodo === m ? '#fff' : MUTED,
              border: '1px solid ' + (metodo === m ? PASTEL.green.solid : '#E5EAF0'),
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' as const,
            }}>{m}</button>
          ))}
        </div>
        <Field label="Riferimento (es. CRO bonifico)" value={riferimento} setValue={setRiferimento} placeholder="Opzionale" />
        <TextareaField label="Note" value={note} setValue={setNote} />
      </Sezione>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Annulla</BtnSecondary>
        <BtnPrimary color={PASTEL.green} onClick={submit} disabled={!valido || submitting}>{submitting ? 'Registrazione...' : 'Registra pagamento'}</BtnPrimary>
      </ModalFooter>
    </ModalShell>
  );
}

export function ModalDettaglioFattura({ fattura, getPagamenti, onClose, onRegistraPagamento, onAnnulla }: any) {
  const [pagamenti, setPagamenti] = React.useState<any[]>([]);
  React.useEffect(() => { getPagamenti().then(setPagamenti); }, []);
  const statoMeta: Record<string, any> = {
    pagata: { col: PASTEL.green, label: 'PAGATA' },
    scaduta: { col: PASTEL.red, label: 'SCADUTA' },
    parziale: { col: PASTEL.amber, label: 'ACCONTO' },
    aperta: { col: PASTEL.teal, label: 'DA INCASSARE' },
    annullata: { col: PASTEL.navy, label: 'ANNULLATA' },
  };
  const m = statoMeta[fattura.stato_calcolato] || statoMeta.aperta;
  const isApribile = fattura.stato_calcolato !== 'pagata' && fattura.stato_calcolato !== 'annullata';

  return (
    <ModalShell color={m.col} icon={IcoFile} title={`Fattura n.${fattura.numero}`} sub={fattura.cliente_display} onClose={onClose}>
      <Sezione titolo="STATO">
        <div style={{ display: 'inline-block', fontSize: 10, color: m.col.text, background: m.col.bg, padding: '4px 10px', borderRadius: 6, fontWeight: 800, letterSpacing: 0.5 }}>{m.label}</div>
        <div style={{ background: '#F1F4F7', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <RigaInfo label="Totale" value={formatEuro(fattura.totale, 2)} bold />
          <RigaInfo label="Incassato" value={formatEuro(fattura.pagato, 2)} color={PASTEL.green.solid} />
          <RigaInfo label="Residuo" value={formatEuro(fattura.residuo, 2)} color={PASTEL.amber.solid} bold last />
        </div>
      </Sezione>
      <Sezione titolo="DATI FATTURA">
        <RigaInfo label="Data emissione" value={new Date(fattura.data_emissione).toLocaleDateString('it-IT')} />
        {fattura.data_scadenza && <RigaInfo label="Scadenza" value={new Date(fattura.data_scadenza).toLocaleDateString('it-IT')} />}
        <RigaInfo label="Tipo" value={fattura.tipo} />
        {fattura.commessa_code && <RigaInfo label="Commessa" value={fattura.commessa_code} />}
        <RigaInfo label="Imponibile" value={formatEuro(fattura.imponibile, 2)} />
        <RigaInfo label={`IVA ${fattura.iva_percent}%`} value={formatEuro(fattura.iva, 2)} last />
      </Sezione>
      <Sezione titolo="CLIENTE">
        <RigaInfo label="Nome" value={fattura.cliente_display} />
        {fattura.cliente_piva && <RigaInfo label="P.IVA" value={fattura.cliente_piva} />}
        {fattura.cliente_email && <RigaInfo label="Email" value={fattura.cliente_email} />}
        {fattura.cliente_indirizzo && <RigaInfo label="Indirizzo" value={fattura.cliente_indirizzo} last />}
      </Sezione>
      <Sezione titolo={`STORICO PAGAMENTI (${pagamenti.length})`}>
        {pagamenti.length === 0 ? (
          <div style={{ fontSize: 11, color: MUTED, textAlign: 'center' as const, padding: 14 }}>Nessun pagamento registrato</div>
        ) : (
          pagamenti.map(p => (
            <div key={p.id} style={{ background: '#F1F4F7', borderRadius: 8, padding: 10, marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{new Date(p.data_pagamento).toLocaleDateString('it-IT')}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{p.metodo}{p.riferimento ? ` ┬À ${p.riferimento}` : ''}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: PASTEL.green.solid }}>+{formatEuro(p.importo)}</div>
            </div>
          ))
        )}
      </Sezione>
      {fattura.note && <Sezione titolo="NOTE"><div style={{ fontSize: 11, color: TEXT, lineHeight: 1.4 }}>{fattura.note}</div></Sezione>}
      <ModalFooter>
        {isApribile && <BtnSecondary onClick={onAnnulla}>Annulla fattura</BtnSecondary>}
        {isApribile && <BtnPrimary color={PASTEL.green} onClick={onRegistraPagamento}>+ Registra pagamento</BtnPrimary>}
        {!isApribile && <BtnPrimary color={m.col} onClick={onClose}>Chiudi</BtnPrimary>}
      </ModalFooter>
    </ModalShell>
  );
}

export function ModalNuovaSpesa({ aziendaId, onClose, onCrea }: any) {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [importo, setImporto] = useState('');
  const [categoria, setCategoria] = useState('carburante');
  const [descrizione, setDescrizione] = useState('');
  const [fornitore, setFornitore] = useState('');
  const [commessa, setCommessa] = useState('');
  const [ivaP, setIvaP] = useState(22);
  const [detraibile, setDetraibile] = useState(true);
  const [fotoUrl, setFotoUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const imp = parseFloat(importo.replace(',', '.')) || 0;
  const valido = imp > 0 && data.length === 10 && categoria;

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      const ext = file.name.split('.').pop();
      const path = `${aziendaId}/spese/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('commesse-foto').upload(path, file);
      if (error) { alert('Errore upload: ' + error.message); setUploading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from('commesse-foto').getPublicUrl(path);
      setFotoUrl(publicUrl);
    } catch (err: any) {
      alert('Errore upload: ' + (err?.message || 'sconosciuto'));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!valido || submitting) return;
    setSubmitting(true);
    await onCrea({
      data, importo: imp, categoria,
      descrizione: descrizione.trim() || undefined,
      fornitore: fornitore.trim() || undefined,
      commessa_code: commessa.trim() || null,
      iva_percent: ivaP, detraibile_iva: detraibile,
      foto_url: fotoUrl || null,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell color={PASTEL.amber} icon={IcoCam} title="Nuova spesa" sub="Registra spesa titolare" onClose={onClose}>
      <Sezione titolo="CATEGORIA *">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
          {CATEGORIE_SPESA.map(c => (
            <button key={c.val} onClick={() => setCategoria(c.val)} style={{
              padding: '10px 4px', borderRadius: 8,
              background: categoria === c.val ? PASTEL.amber.solid : '#fff',
              color: categoria === c.val ? '#fff' : MUTED,
              border: '1px solid ' + (categoria === c.val ? PASTEL.amber.solid : '#E5EAF0'),
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3,
            }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </Sezione>

      <Sezione titolo="DATI">
        <FieldRow>
          <Field label="Importo Ôé¼ *" value={importo} setValue={setImporto} placeholder="0,00" type="number" />
          <Field label="Data *" value={data} setValue={setData} type="date" />
        </FieldRow>
        <Field label="Descrizione" value={descrizione} setValue={setDescrizione} placeholder="Es. Pieno Ducato + lavaggio" />
        <FieldRow>
          <Field label="Fornitore" value={fornitore} setValue={setFornitore} placeholder="Es. Eni Cosenza" />
          <Field label="Commessa" value={commessa} setValue={setCommessa} placeholder="S-0055" />
        </FieldRow>
        <FieldRow>
          <Field label="IVA %" value={String(ivaP)} setValue={(v: any) => setIvaP(Number(v) || 0)} type="number" />
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: MUTED, marginBottom: 3, fontWeight: 700 }}>Detraibile IVA</div>
            <button onClick={() => setDetraibile(!detraibile)} style={{
              width: '100%', padding: '9px 0', borderRadius: 7,
              background: detraibile ? PASTEL.green.solid : '#fff',
              color: detraibile ? '#fff' : MUTED,
              border: '1px solid ' + (detraibile ? PASTEL.green.solid : '#E5EAF0'),
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>{detraibile ? 'S├î DETRAIBILE' : 'NO'}</button>
          </div>
        </FieldRow>
      </Sezione>

      <Sezione titolo="FOTO SCONTRINO">
        {fotoUrl ? (
          <div style={{ position: 'relative' as const }}>
            <img src={fotoUrl} alt="scontrino" style={{ width: '100%', borderRadius: 8, maxHeight: 180, objectFit: 'cover' as const }} />
            <button onClick={() => setFotoUrl('')} style={{ position: 'absolute' as const, top: 6, right: 6, background: PASTEL.red.solid, color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Rimuovi</button>
          </div>
        ) : (
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 0', background: PASTEL.amber.bg, color: PASTEL.amber.text,
            borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, border: `1px dashed ${PASTEL.amber.solid}`,
          }}>
            <IcoCam size={18} color={PASTEL.amber.text} />
            {uploading ? 'Caricamento...' : 'Scatta foto / scegli file'}
            <input type="file" accept="image/*" capture="environment" onChange={handleFotoUpload} style={{ display: 'none' }} />
          </label>
        )}
        <TextareaField label="Note" value={note} setValue={setNote} placeholder="Note opzionali..." />
      </Sezione>

      <ModalFooter>
        <BtnSecondary onClick={onClose}>Annulla</BtnSecondary>
        <BtnPrimary color={PASTEL.amber} onClick={submit} disabled={!valido || submitting}>{submitting ? 'Registrazione...' : 'Registra spesa'}</BtnPrimary>
      </ModalFooter>
    </ModalShell>
  );
}

export function ModalPagamentoFornitore({ fatture, fatturaIdPreselect, onClose, onRegistra }: any) {
  const [fatturaId, setFatturaId] = useState(fatturaIdPreselect || '');
  const [importo, setImporto] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [metodo, setMetodo] = useState('bonifico');
  const [riferimento, setRiferimento] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fatturaSel = fatture.find((f: FatturaRicevutaRow) => f.id === fatturaId);
  React.useEffect(() => {
    if (fatturaSel && !importo) setImporto(String(fatturaSel.residuo).replace('.', ','));
  }, [fatturaSel]);

  const imp = parseFloat(importo.replace(',', '.')) || 0;
  const valido = fatturaId && imp > 0 && data.length === 10;
  const supero = fatturaSel && imp > fatturaSel.residuo + 0.01;

  async function submit() {
    if (!valido || submitting) return;
    setSubmitting(true);
    await onRegistra({
      fatturaRicevutaId: fatturaId,
      importo: imp, data, metodo,
      riferimento: riferimento.trim() || undefined,
      note: note.trim() || undefined,
      fornitore: fatturaSel?.fornitore,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell color={PASTEL.red} icon={IcoBuilding} title="Pagamento fornitore" sub="Registra pagamento fattura ricevuta" onClose={onClose}>
      <Sezione titolo="FATTURA FORNITORE">
        <div style={{ fontSize: 10, color: MUTED, marginBottom: 5, fontWeight: 700 }}>Seleziona fattura *</div>
        <select value={fatturaId} onChange={(e) => setFatturaId(e.target.value)} style={selectStyle}>
          <option value="">-- Seleziona --</option>
          {fatture.map((f: FatturaRicevutaRow) => (<option key={f.id} value={f.id}>n.{f.numero} ┬À {f.fornitore} ┬À resta {formatEuro(f.residuo)}</option>))}
        </select>
        {fatturaSel && (
          <div style={{ background: PASTEL.red.bg, borderRadius: 8, padding: 10, marginTop: 8 }}>
            <div style={{ fontSize: 11, color: PASTEL.red.text, fontWeight: 700 }}>{fatturaSel.fornitore}</div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>
              Totale {formatEuro(fatturaSel.totale)} ┬À Pagato {formatEuro(fatturaSel.pagato)} ┬À <strong style={{ color: PASTEL.amber.solid }}>Resta {formatEuro(fatturaSel.residuo)}</strong>
            </div>
          </div>
        )}
      </Sezione>
      <Sezione titolo="PAGAMENTO">
        <FieldRow>
          <Field label="Importo Ôé¼ *" value={importo} setValue={setImporto} placeholder="0,00" type="number" />
          <Field label="Data *" value={data} setValue={setData} type="date" />
        </FieldRow>
        {supero && <div style={{ fontSize: 10, color: PASTEL.red.solid, marginTop: 4, fontWeight: 700 }}>ÔÜá Importo superiore al residuo</div>}
        <div style={{ fontSize: 10, color: MUTED, marginTop: 8, marginBottom: 5, fontWeight: 700 }}>Metodo pagamento</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
          {METODI_PAGAMENTO.map(m => (
            <button key={m} onClick={() => setMetodo(m)} style={{
              padding: '8px 0', borderRadius: 8,
              background: metodo === m ? PASTEL.red.solid : '#fff',
              color: metodo === m ? '#fff' : MUTED,
              border: '1px solid ' + (metodo === m ? PASTEL.red.solid : '#E5EAF0'),
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' as const,
            }}>{m}</button>
          ))}
        </div>
        <Field label="Riferimento (es. CRO bonifico)" value={riferimento} setValue={setRiferimento} placeholder="Opzionale" />
        <TextareaField label="Note" value={note} setValue={setNote} />
      </Sezione>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Annulla</BtnSecondary>
        <BtnPrimary color={PASTEL.red} onClick={submit} disabled={!valido || submitting}>{submitting ? 'Registrazione...' : 'Registra pagamento'}</BtnPrimary>
      </ModalFooter>
    </ModalShell>
  );
}

export function ModalNuovaFatturaRicevuta({ onClose, onCrea }: any) {
  const [numero, setNumero] = useState('');
  const [dataRic, setDataRic] = useState(new Date().toISOString().split('T')[0]);
  const [dataScad, setDataScad] = useState(new Date(Date.now() + 30*86400000).toISOString().split('T')[0]);
  const [fornitore, setFornitore] = useState('');
  const [piva, setPiva] = useState('');
  const [imponibile, setImponibile] = useState('');
  const [ivaP, setIvaP] = useState(22);
  const [categoria, setCategoria] = useState('materiali');
  const [commessa, setCommessa] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const imp = parseFloat(imponibile.replace(',', '.')) || 0;
  const iva = +(imp * ivaP / 100).toFixed(2);
  const tot = +(imp + iva).toFixed(2);
  const valido = numero.trim().length > 0 && fornitore.trim().length > 0 && imp > 0;

  async function submit() {
    if (!valido || submitting) return;
    setSubmitting(true);
    await onCrea({
      numero: numero.trim(),
      data_ricezione: dataRic,
      data_scadenza: dataScad || null,
      fornitore: fornitore.trim(),
      fornitore_piva: piva.trim() || undefined,
      imponibile: imp, iva_percent: ivaP,
      categoria, commessa_code: commessa.trim() || null,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
  }

  return (
    <ModalShell color={PASTEL.violet} icon={IcoChat} title="Fattura ricevuta" sub="Registra fattura fornitore" onClose={onClose}>
      <Sezione titolo="FORNITORE">
        <Field label="Nome fornitore *" value={fornitore} setValue={setFornitore} placeholder="Es. Schuco Italia SpA" />
        <Field label="P.IVA" value={piva} setValue={setPiva} placeholder="Opzionale" />
      </Sezione>
      <Sezione titolo="DATI FATTURA">
        <Field label="Numero fattura *" value={numero} setValue={setNumero} placeholder="Es. 2024/1850" />
        <FieldRow>
          <Field label="Data ricezione *" value={dataRic} setValue={setDataRic} type="date" />
          <Field label="Data scadenza" value={dataScad} setValue={setDataScad} type="date" />
        </FieldRow>
        <FieldRow>
          <Field label="Imponibile Ôé¼ *" value={imponibile} setValue={setImponibile} placeholder="0,00" type="number" />
          <Field label="IVA %" value={String(ivaP)} setValue={(v: any) => setIvaP(Number(v) || 0)} type="number" />
        </FieldRow>
        <div style={{ background: '#F1F4F7', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}><span>Imponibile</span><span style={{ fontWeight: 700, color: TEXT }}>{formatEuro(imp, 2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}><span>IVA {ivaP}%</span><span style={{ fontWeight: 700, color: TEXT }}>{formatEuro(iva, 2)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT, fontWeight: 800, paddingTop: 5, borderTop: '1px solid #D8DEE5', marginTop: 4 }}><span>TOTALE</span><span>{formatEuro(tot, 2)}</span></div>
        </div>
      </Sezione>
      <Sezione titolo="CATEGORIA">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5, marginBottom: 8 }}>
          {['materiali', 'utenze', 'leasing', 'consulenze', 'assicurazione', 'altro'].map(c => (
            <button key={c} onClick={() => setCategoria(c)} style={{
              padding: '8px 4px', borderRadius: 8,
              background: categoria === c ? PASTEL.violet.solid : '#fff',
              color: categoria === c ? '#fff' : MUTED,
              border: '1px solid ' + (categoria === c ? PASTEL.violet.solid : '#E5EAF0'),
              fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' as const,
            }}>{c}</button>
          ))}
        </div>
        <Field label="Codice commessa (opzionale)" value={commessa} setValue={setCommessa} placeholder="Es. S-0055" />
        <TextareaField label="Note" value={note} setValue={setNote} />
      </Sezione>
      <ModalFooter>
        <BtnSecondary onClick={onClose}>Annulla</BtnSecondary>
        <BtnPrimary color={PASTEL.violet} onClick={submit} disabled={!valido || submitting}>{submitting ? 'Registrazione...' : 'Registra fattura'}</BtnPrimary>
      </ModalFooter>
    </ModalShell>
  );
}

export function ModalDettaglioFattRic({ fattura, getPagamenti, onClose, onPaga, onAnnulla }: any) {
  const [pagamenti, setPagamenti] = React.useState<any[]>([]);
  React.useEffect(() => { getPagamenti().then(setPagamenti); }, []);

  const statoMeta: Record<string, any> = {
    pagata: { col: PASTEL.green, label: 'PAGATA' },
    scaduta: { col: PASTEL.red, label: 'SCADUTA' },
    parziale: { col: PASTEL.amber, label: 'PARZIALE' },
    da_pagare: { col: PASTEL.peach, label: 'DA PAGARE' },
    annullata: { col: PASTEL.navy, label: 'ANNULLATA' },
  };
  const m = statoMeta[fattura.stato_calcolato] || statoMeta.da_pagare;
  const isPagabile = fattura.stato_calcolato !== 'pagata' && fattura.stato_calcolato !== 'annullata';

  return (
    <ModalShell color={m.col} icon={IcoBuilding} title={`Fatt. n.${fattura.numero}`} sub={fattura.fornitore} onClose={onClose}>
      <Sezione titolo="STATO">
        <div style={{ display: 'inline-block', fontSize: 10, color: m.col.text, background: m.col.bg, padding: '4px 10px', borderRadius: 6, fontWeight: 800, letterSpacing: 0.5 }}>{m.label}</div>
        <div style={{ background: '#F1F4F7', borderRadius: 8, padding: 10, marginTop: 8 }}>
          <RigaInfo label="Totale" value={formatEuro(fattura.totale, 2)} bold />
          <RigaInfo label="Pagato" value={formatEuro(fattura.pagato, 2)} color={PASTEL.green.solid} />
          <RigaInfo label="Residuo" value={formatEuro(fattura.residuo, 2)} color={PASTEL.red.solid} bold last />
        </div>
      </Sezione>
      <Sezione titolo="DATI FATTURA">
        <RigaInfo label="Data ricezione" value={new Date(fattura.data_ricezione).toLocaleDateString('it-IT')} />
        {fattura.data_scadenza && <RigaInfo label="Scadenza" value={new Date(fattura.data_scadenza).toLocaleDateString('it-IT')} />}
        {fattura.categoria && <RigaInfo label="Categoria" value={fattura.categoria} />}
        {fattura.commessa_code && <RigaInfo label="Commessa" value={fattura.commessa_code} />}
        <RigaInfo label="Imponibile" value={formatEuro(fattura.imponibile, 2)} />
        <RigaInfo label="IVA" value={formatEuro(fattura.iva, 2)} last />
      </Sezione>
      <Sezione titolo="FORNITORE">
        <RigaInfo label="Nome" value={fattura.fornitore} last={!fattura.fornitore_piva} />
        {fattura.fornitore_piva && <RigaInfo label="P.IVA" value={fattura.fornitore_piva} last />}
      </Sezione>
      <Sezione titolo={`STORICO PAGAMENTI (${pagamenti.length})`}>
        {pagamenti.length === 0 ? (
          <div style={{ fontSize: 11, color: MUTED, textAlign: 'center' as const, padding: 14 }}>Nessun pagamento registrato</div>
        ) : (
          pagamenti.map(p => (
            <div key={p.id} style={{ background: '#F1F4F7', borderRadius: 8, padding: 10, marginBottom: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: TEXT }}>{new Date(p.data_pagamento).toLocaleDateString('it-IT')}</div>
                <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{p.metodo}{p.riferimento ? ` ┬À ${p.riferimento}` : ''}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: PASTEL.red.solid }}>ÔêÆ{formatEuro(p.importo)}</div>
            </div>
          ))
        )}
      </Sezione>
      {fattura.note && <Sezione titolo="NOTE"><div style={{ fontSize: 11, color: TEXT, lineHeight: 1.4 }}>{fattura.note}</div></Sezione>}
      <ModalFooter>
        {isPagabile && <BtnSecondary onClick={onAnnulla}>Annulla</BtnSecondary>}
        {isPagabile && <BtnPrimary color={PASTEL.red} onClick={onPaga}>+ Registra pagamento</BtnPrimary>}
        {!isPagabile && <BtnPrimary color={m.col} onClick={onClose}>Chiudi</BtnPrimary>}
      </ModalFooter>
    </ModalShell>
  );
}

// =============== UI HELPERS ===============
const selectStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #E5EAF0',
  borderRadius: 8, fontSize: 12, color: TEXT, fontFamily: 'inherit', background: '#fff',
};

export function ModalShell({ color, icon: Ico, title, sub, onClose, children }: any) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.6)', zIndex: 9900 }} />
      <div style={{
        position: 'fixed' as const, bottom: 0, left: 0, right: 0, zIndex: 9910,
        background: BG_APP, borderRadius: '20px 20px 0 0',
        maxHeight: '94vh', display: 'flex', flexDirection: 'column' as const,
      }}>
        <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 4, background: '#C5CED6', borderRadius: 2 }}/>
        </div>
        <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #E5EAF0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: color.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ico size={22} color={color.text} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>{title}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>{sub}</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F4F7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcoX size={14} color={TEXT} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' as const, padding: '12px 14px' }}>{children}</div>
      </div>
    </>
  );
}

export function Sezione({ titolo, children }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 800, marginBottom: 6 }}>{titolo}</div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 10 }}>{children}</div>
    </div>
  );
}

export function FieldRow({ children }: any) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{children}</div>;
}

export function Field({ label, value, setValue, placeholder, type = 'text' }: any) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: MUTED, marginBottom: 3, fontWeight: 700 }}>{label}</div>
      <input
        type={type} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 11px', border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 12, color: TEXT, fontFamily: 'inherit', background: '#FAFBFC', boxSizing: 'border-box' as const }}
      />
    </div>
  );
}

export function TextareaField({ label, value, setValue, placeholder }: any) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: MUTED, marginBottom: 3, fontWeight: 700 }}>{label}</div>
      <textarea
        value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} rows={3}
        style={{ width: '100%', padding: '9px 11px', border: '1px solid #E5EAF0', borderRadius: 7, fontSize: 12, color: TEXT, fontFamily: 'inherit', background: '#FAFBFC', resize: 'vertical' as const, boxSizing: 'border-box' as const }}
      />
    </div>
  );
}

export function ModalFooter({ children }: any) {
  return (
    <div style={{ background: '#fff', borderTop: '1px solid #E5EAF0', padding: '12px 14px', display: 'flex', gap: 8, position: 'sticky' as const, bottom: 0, marginTop: 8, marginLeft: -14, marginRight: -14 }}>{children}</div>
  );
}

export function BtnPrimary({ color, onClick, disabled, children }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: disabled ? '#C5CED6' : color.solid, color: '#fff', border: 'none', fontSize: 12, fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>{children}</button>
  );
}

export function BtnSecondary({ onClick, children }: any) {
  return (
    <button onClick={onClick} style={{ flex: 1, padding: '12px 14px', borderRadius: 10, background: '#fff', color: TEXT, border: '1px solid #E5EAF0', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{children}</button>
  );
}

function RigaInfo({ label, value, color, bold, last }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: last ? 'none' : '1px solid #F1F4F7' }}>
      <span style={{ fontSize: 11, color: MUTED }}>{label}</span>
      <span style={{ fontSize: 12, color: color || TEXT, fontWeight: bold ? 800 : 700 }}>{value}</span>
    </div>
  );
}
