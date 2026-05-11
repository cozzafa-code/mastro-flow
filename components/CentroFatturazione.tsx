"use client";
// components/CentroFatturazione.tsx
// Pre-lancio - Centro Fatturazione Elettronica SDI

import React, { useState, useMemo } from "react";
import { useFatture, inviaSDI, marcaPronta, marcaPagata, generaXmlPreview, type Fattura } from "../hooks/useFatture";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const STATO_META: Record<string, { col: string; bg: string; label: string; icon: string }> = {
  bozza:          { col: MUTED,     bg: '#F1F4F7', label: 'BOZZA',          icon: '📝' },
  pronta:         { col: AMBER,     bg: '#FEF3C7', label: 'PRONTA',         icon: '📋' },
  inviata:        { col: BLUE,      bg: '#DBEAFE', label: 'INVIATA SDI',    icon: '📤' },
  consegnata:     { col: TEAL_DEEP, bg: '#D1FAE5', label: 'CONSEGNATA',     icon: '✅' },
  accettata:      { col: GREEN,     bg: '#D1FAE5', label: 'ACCETTATA',      icon: '✅' },
  scartata:       { col: RED,       bg: '#FEE2E2', label: 'SCARTATA',       icon: '❌' },
  non_consegnata: { col: AMBER,     bg: '#FEF3C7', label: 'NON CONSEGNATA', icon: '⚠️' },
  annullata:      { col: MUTED,     bg: '#F1F4F7', label: 'ANNULLATA',      icon: '🚫' },
};

type ViewMode = 'da_inviare' | 'in_transito' | 'storico';

function resolveAziendaId(propId: string | null): string {
  if (propId) return propId;
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro:aziendaId') 
    || localStorage.getItem('mastro_azienda_id') 
    || '';
}

export default function CentroFatturazione({ aziendaId, onClose, onApriCommessa }: any) {
  const resolved = resolveAziendaId(aziendaId);
  const [view, setView] = useState<ViewMode>('da_inviare');
  const [search, setSearch] = useState('');
  const [fAperta, setFAperta] = useState<Fattura | null>(null);
  const { fatture, stats, loading } = useFatture(resolved);

  const filtered = useMemo(() => {
    let arr = fatture;
    if (view === 'da_inviare') arr = arr.filter(f => ['bozza','pronta','scartata'].includes(f.stato));
    else if (view === 'in_transito') arr = arr.filter(f => f.stato === 'inviata');
    else arr = arr.filter(f => ['consegnata','accettata','annullata','non_consegnata'].includes(f.stato));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(f =>
        f.numero.toLowerCase().includes(q) ||
        f.cliente_denominazione.toLowerCase().includes(q) ||
        (f.commessa_code || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [fatture, view, search]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HEADER */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CENTRO</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>📄 Fatturazione Elettronica</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          <KpiHero icon="📝" label="BOZZE" val={stats.bozze} color={MUTED} />
          <KpiHero icon="📋" label="PRONTE" val={stats.pronte} color={AMBER} />
          <KpiHero icon="📤" label="IN SDI" val={stats.inviate} color={BLUE} />
          <KpiHero icon="✅" label="CONSEG." val={stats.consegnate} color={TEAL} />
          <KpiHero icon="❌" label="SCART." val={stats.scartate} color={RED} />
        </div>

        {/* Totale mese */}
        <div style={{ marginTop: 10, background: 'rgba(40,160,160,0.18)', border: `1px solid ${TEAL}88`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>💶</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: 0.5 }}>FATTURATO QUESTO MESE</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>€{Math.round(stats.totale_fatturato_mese).toLocaleString('it-IT')}</div>
          </div>
          {stats.totale_non_pagato > 0 && (
            <div style={{ textAlign: 'right' as const, fontSize: 10 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>NON PAGATO</div>
              <div style={{ fontSize: 14, color: AMBER, fontWeight: 800 }}>€{Math.round(stats.totale_non_pagato).toLocaleString('it-IT')}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ background: '#fff', margin: '8px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2 }}>
        <TabBtn active={view === 'da_inviare'} onClick={() => setView('da_inviare')} label="Da Inviare" badge={stats.bozze + stats.pronte + stats.scartate} />
        <TabBtn active={view === 'in_transito'} onClick={() => setView('in_transito')} label="In SDI" badge={stats.inviate} />
        <TabBtn active={view === 'storico'} onClick={() => setView('storico')} label="Storico" badge={stats.consegnate} />
      </div>

      {/* Search */}
      <div style={{ background: '#fff', margin: '8px 14px 0', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
          <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Numero, cliente, commessa..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
        {search && <button onClick={() => setSearch('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>}
      </div>

      <div style={{ padding: 14 }}>
        {loading ? <Empty label="Caricamento..." /> :
         filtered.length === 0 ? <Empty label="Nessuna fattura in questa sezione" /> :
         filtered.map(f => <CardFattura key={f.id} f={f} onClick={() => setFAperta(f)} />)}
      </div>

      {/* Drawer dettaglio */}
      {fAperta && <DettaglioFattura f={fAperta} onClose={() => setFAperta(null)} onApriCommessa={onApriCommessa} />}
    </div>
  );
}

// =============== CARD FATTURA ===============
function CardFattura({ f, onClick }: { f: Fattura; onClick: () => void }) {
  const st = STATO_META[f.stato] || STATO_META.bozza;
  return (
    <div onClick={onClick} style={{ background: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeft: `5px solid ${st.col}`, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: st.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{st.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' as const }}>
            <span style={{ background: NAVY, color: '#fff', padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 800 }}>{f.numero}</span>
            {f.commessa_code && <span style={{ background: '#F1F4F7', color: TEXT, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 700 }}>{f.commessa_code}</span>}
            {f.pagata && <span style={{ background: '#D1FAE5', color: TEAL_DEEP, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>💰 PAGATA</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{f.cliente_denominazione}</div>
          <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>
            📅 {new Date(f.data_emissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' })}
            {f.data_scadenza && ` · Scad. ${new Date(f.data_scadenza).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}`}
          </div>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: TEXT }}>€{Math.round(Number(f.totale)).toLocaleString('it-IT')}</div>
          <span style={{ display: 'inline-block', background: st.bg, color: st.col, padding: '3px 7px', borderRadius: 4, fontSize: 9, fontWeight: 800, marginTop: 4 }}>{st.label}</span>
        </div>
      </div>
      {f.sdi_messaggio && f.stato === 'scartata' && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEE2E2', borderRadius: 6, fontSize: 10, color: '#991B1B', fontWeight: 600 }}>
          ⚠ {f.sdi_messaggio}
        </div>
      )}
    </div>
  );
}

// =============== DETTAGLIO FATTURA ===============
function DettaglioFattura({ f, onClose, onApriCommessa }: any) {
  const st = STATO_META[f.stato] || STATO_META.bozza;
  const [salvando, setSalvando] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const xml = useMemo(() => generaXmlPreview(f), [f]);

  async function handleInvia() {
    if (!confirm(`Inviare fattura ${f.numero} a SDI?`)) return;
    setSalvando(true);
    const res = await inviaSDI(f.id);
    setSalvando(false);
    if (res.success) {
      alert(`Fattura inviata! ID SDI: ${res.sdiId}`);
      onClose();
    } else {
      alert('Errore: ' + (res.error || 'invio fallito'));
    }
  }

  async function handleMarcaPronta() {
    setSalvando(true);
    await marcaPronta(f.id);
    setSalvando(false);
    onClose();
  }

  async function handleMarcaPagata() {
    if (!confirm(`Marcare fattura ${f.numero} come pagata?`)) return;
    setSalvando(true);
    await marcaPagata(f.id);
    setSalvando(false);
    onClose();
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 600, maxHeight: '92vh', overflowY: 'auto' as const, paddingBottom: 24 }}>
        <div style={{ background: st.col, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{st.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>FATTURA · {st.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{f.numero}</div>
              <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>{new Date(f.data_emissione).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.25)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
          </div>
        </div>

        <div style={{ padding: 14 }}>
          {/* Cliente */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>CLIENTE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{f.cliente_denominazione}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>
              {f.cliente_cf && <span>CF: {f.cliente_cf}</span>}
              {f.cliente_piva && <span> · P.IVA: {f.cliente_piva}</span>}
            </div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
              {f.cliente_indirizzo}, {f.cliente_cap} {f.cliente_comune} ({f.cliente_provincia})
            </div>
            <div style={{ fontSize: 10, color: BLUE, marginTop: 4, fontWeight: 700 }}>
              📨 Cod. dest.: <code>{f.cliente_codice_destinatario || '0000000'}</code>
              {f.cliente_codice_destinatario === '0000000' && f.cliente_pec && ` (PEC: ${f.cliente_pec})`}
            </div>
          </div>

          {/* Righe */}
          <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>RIGHE FATTURA</div>
            {(f.righe || []).map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 0', borderBottom: i < f.righe.length - 1 ? '1px solid #F1F4F7' : 'none' }}>
                <div style={{ flex: 1, fontSize: 12, fontWeight: 600, color: TEXT }}>{r.descrizione}</div>
                <div style={{ textAlign: 'right' as const, fontSize: 11, color: MUTED, marginLeft: 10 }}>
                  <div>{r.qta} × €{Number(r.prezzo_unit).toFixed(2)}</div>
                  <div style={{ fontWeight: 700, color: TEXT, marginTop: 2 }}>€{(Number(r.qta) * Number(r.prezzo_unit)).toFixed(2)}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '2px solid #E5EAF0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 4 }}>
                <span>Imponibile</span>
                <strong>€{Number(f.imponibile).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MUTED, marginBottom: 6 }}>
                <span>IVA {f.iva_pct}%</span>
                <strong>€{Number(f.iva_importo).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: TEXT, fontWeight: 800 }}>
                <span>TOTALE</span>
                <span style={{ color: NAVY }}>€{Number(f.totale).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tracking SDI */}
          {(f.sdi_identificativo || f.sdi_data_invio) && (
            <div style={{ background: '#fff', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, marginBottom: 6, fontWeight: 700 }}>TRACKING SDI</div>
              {f.sdi_identificativo && <div style={{ fontSize: 11, fontFamily: 'monospace' as const, color: BLUE, marginBottom: 4 }}>ID: {f.sdi_identificativo}</div>}
              {f.sdi_data_invio && <div style={{ fontSize: 11, color: MUTED }}>📤 Inviata: {new Date(f.sdi_data_invio).toLocaleString('it-IT')}</div>}
              {f.sdi_data_consegna && <div style={{ fontSize: 11, color: TEAL_DEEP, fontWeight: 700, marginTop: 3 }}>✅ Consegnata: {new Date(f.sdi_data_consegna).toLocaleString('it-IT')}</div>}
              {f.sdi_messaggio && (
                <div style={{ marginTop: 6, padding: '6px 10px', background: f.stato === 'scartata' ? '#FEE2E2' : '#F1F4F7', borderRadius: 5, fontSize: 10, color: f.stato === 'scartata' ? '#991B1B' : TEXT }}>
                  {f.sdi_messaggio}
                </div>
              )}
            </div>
          )}

          {/* XML preview toggle */}
          <button onClick={() => setShowXml(!showXml)} style={{ width: '100%', padding: '8px 12px', background: '#fff', color: NAVY, border: '1.5px solid #E5EAF0', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
            {showXml ? '▼' : '▶'} {showXml ? 'Nascondi' : 'Mostra'} XML FatturaPA
          </button>
          {showXml && (
            <pre style={{ background: NAVY_DEEP, color: '#A7F3D0', padding: 10, borderRadius: 8, fontSize: 9, overflow: 'auto' as const, maxHeight: 250, whiteSpace: 'pre-wrap' as const, fontFamily: 'monospace' as const, marginBottom: 10 }}>{xml}</pre>
          )}

          {/* Azioni */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {f.stato === 'bozza' && (
              <button onClick={handleMarcaPronta} disabled={salvando} style={{ padding: '14px 0', background: AMBER, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                📋 SEGNA COME PRONTA
              </button>
            )}
            {(f.stato === 'pronta' || f.stato === 'scartata') && (
              <button onClick={handleInvia} disabled={salvando} style={{ padding: '16px 0', background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DEEP})`, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                📤 {salvando ? 'INVIO IN CORSO...' : 'INVIA A SDI'}
              </button>
            )}
            {['consegnata','accettata'].includes(f.stato) && !f.pagata && (
              <button onClick={handleMarcaPagata} disabled={salvando} style={{ padding: '14px 0', background: TEAL_DEEP, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                💰 MARCA COME PAGATA
              </button>
            )}
            {f.commessa_id && (
              <button onClick={() => { onClose(); onApriCommessa?.(f.commessa_id); }} style={{ padding: '12px 0', background: '#fff', color: NAVY, border: '1.5px solid #E5EAF0', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Apri commessa →
              </button>
            )}
          </div>
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
      <div style={{ fontSize: 7, color, fontWeight: 700, letterSpacing: 0.6, marginTop: 4 }}>{label}</div>
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

function Empty({ label }: any) {
  return <div style={{ padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>{label}</div>;
}
