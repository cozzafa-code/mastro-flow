"use client";
// components/DossierCliente.tsx
// BLOCCO 1 - Header dossier + Timeline viva

import React, { useState, useMemo } from "react";
import { useDossierCliente, type ClienteEvento, togglePin } from "../hooks/useDossierCliente";
import ModalNuovaNota from "./ModalNuovaNota";
import TabComunicazioni from "./centro/TabComunicazioni";
import TabImmobili from "./centro/TabImmobili";
import TabCommesse from "./centro/TabCommesse";
import TabPagamenti from "./centro/TabPagamenti";
import TabRete from "./centro/TabRete";
import { useClienteAI } from "../hooks/useClienteAI";
import { useComunicazioni } from "../hooks/useComunicazioni";
import { usePagamentiCliente } from "../hooks/useDossierExtra";
import { useImmobiliCliente } from "../hooks/useImmobili";
import { BannerAIInsights, PillSintesi, BottoneAscolta, ModalitaAuto } from "./AIClienteUI";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

const STATO_META: Record<string, { col: string; bg: string; label: string }> = {
  attivo:    { col: TEAL_DEEP, bg: '#D1FAE5', label: 'ATTIVO' },
  storico:   { col: BLUE,      bg: '#DBEAFE', label: 'STORICO' },
  dormiente: { col: AMBER,     bg: '#FEF3C7', label: 'DORMIENTE' },
  prospect:  { col: PURPLE,    bg: '#F3E8FF', label: 'PROSPECT' },
  perso:     { col: RED,       bg: '#FEE2E2', label: 'PERSO' },
};

const PRIORITA_META: Record<string, { col: string; bg: string; label: string; icon: string }> = {
  premium: { col: '#7E22CE', bg: '#F3E8FF', label: 'PREMIUM', icon: '👑' },
  alto:    { col: AMBER,     bg: '#FEF3C7', label: 'ALTO',    icon: '⭐' },
  medio:   { col: '#5C6B7A', bg: '#F1F4F7', label: 'MEDIO',   icon: '•' },
  basso:   { col: '#5C6B7A', bg: '#F8FAFA', label: 'BASSO',   icon: '·' },
};

const CATEGORIA_META: Record<string, { col: string; bg: string; label: string }> = {
  commerciale:   { col: TEAL,      bg: '#E1F5EE', label: 'Commerciale' },
  tecnico:       { col: BLUE,      bg: '#DBEAFE', label: 'Tecnico' },
  pagamento:     { col: GREEN,     bg: '#D1FAE5', label: 'Pagamento' },
  comunicazione: { col: '#0EA5E9', bg: '#E0F2FE', label: 'Comunicazione' },
  problema:      { col: RED,       bg: '#FEE2E2', label: 'Problema' },
  nota:          { col: PURPLE,    bg: '#F3E8FF', label: 'Nota' },
  sistema:       { col: MUTED,     bg: '#F1F4F7', label: 'Sistema' },
};

type FiltroCategoria = 'tutti' | keyof typeof CATEGORIA_META;

interface Props {
  clienteId: string;
  onClose: () => void;
  onApriCommessa?: (cmId: string) => void;
}

export default function DossierCliente({ clienteId, onClose, onApriCommessa }: Props) {
  const { cliente, eventi, commesse, giorni_da_ultimo_contatto, totale_pagato, totale_saldo_aperto, num_commesse_attive, num_problemi_aperti, loading } = useDossierCliente(clienteId);
  const [filtro, setFiltro] = useState<FiltroCategoria>('tutti');
  const [search, setSearch] = useState('');
  const [showNota, setShowNota] = useState(false);
  const [showAuto, setShowAuto] = useState(false);
  const [view, setView] = useState<'timeline' | 'comunicazioni' | 'immobili' | 'commesse' | 'pagamenti' | 'rete'>('timeline');

  const eventiFiltered = useMemo(() => {
    let arr = eventi;
    if (filtro !== 'tutti') arr = arr.filter(e => e.categoria === filtro);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter(e => 
        (e.titolo || '').toLowerCase().includes(q) ||
        (e.descrizione || '').toLowerCase().includes(q) ||
        (e.commessa_code || '').toLowerCase().includes(q)
      );
    }
    return arr;
  }, [eventi, filtro, search]);

  // Pinnati separati per mostrare in alto
  const pinnati = eventiFiltered.filter(e => e.pinnato);
  const normali = eventiFiltered.filter(e => !e.pinnato);

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: MUTED, fontSize: 14 }}>Caricamento dossier...</div>
      </div>
    );
  }
  if (!cliente) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: MUTED, fontSize: 14 }}>Cliente non trovato</div>
      </div>
    );
  }

  // === AI DATA AGGREGATION ===
  const { com: aiComunicazioni } = useComunicazioni(cliente.id);
  const { fatture: aiFatture, stats: aiPagamentiStats } = usePagamentiCliente(cliente.id);
  const { immobili: aiImmobili } = useImmobiliCliente(cliente.id);
  // Tutti gli infissi attraverso gli immobili (semplificato: aggrego per cliente)
  const aiInfissi: any[] = [];
  const ai = useClienteAI({
    cliente,
    eventi,
    comunicazioni: aiComunicazioni,
    commesse,
    fatture: aiFatture,
    pagamentiStats: aiPagamentiStats,
    immobili: aiImmobili,
    infissi: aiInfissi,
  });
  
  const ultimoProblemaTitolo = eventi.find(e => e.categoria === 'problema' && e.severity !== 'success')?.titolo || null;

  const statoMeta = STATO_META[cliente.stato_cliente] || STATO_META.attivo;
  const prioMeta = PRIORITA_META[cliente.livello_priorita] || PRIORITA_META.medio;
  const affidabilita = cliente.affidabilita_pct;
  const affidColore = affidabilita >= 85 ? TEAL_DEEP : affidabilita >= 60 ? AMBER : RED;
  const affidIcona = affidabilita >= 85 ? '🟢' : affidabilita >= 60 ? '🟠' : '🔴';

  const conteggiCat: Record<string, number> = {};
  eventi.forEach(e => { conteggiCat[e.categoria] = (conteggiCat[e.categoria] || 0) + 1; });

  return (
    <div style={{ position: 'fixed', inset: 0, background: BG, zIndex: 9800, overflowY: 'auto' as const, paddingBottom: 80 }}>
      {/* HERO HEADER */}
      <div style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`, padding: '14px 14px 20px', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>DOSSIER CLIENTE</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Memoria storica viva</div>
          </div>
        </div>

        {/* Identità: avatar + nome + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {cliente.foto_url ? (
            <img src={cliente.foto_url} alt={cliente.nome} style={{ width: 70, height: 70, borderRadius: 16, objectFit: 'cover' as const, border: '2px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{ width: 70, height: 70, borderRadius: 16, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {(cliente.nome?.[0] || '?') + (cliente.cognome?.[0] || '')}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.2 }}>{cliente.nome} {cliente.cognome}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
              📍 {cliente.citta || '—'} {cliente.provincia ? `(${cliente.provincia})` : ''}
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' as const }}>
              <span style={{ background: statoMeta.bg, color: statoMeta.col, padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{statoMeta.label}</span>
              <span style={{ background: prioMeta.bg, color: prioMeta.col, padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>{prioMeta.icon} {prioMeta.label}</span>
              {cliente.tipologia_relazione.slice(0, 2).map(t => (
                <span key={t} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700 }}>{t.replace('_', ' ')}</span>
              ))}
            </div>
          </div>
        </div>

        {/* 4 KPI HERO */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <KpiHero icon="💰" label="VALORE" val={`€${Math.round(cliente.valore_storico_eur / 1000)}k`} color={GREEN} small />
          <KpiHero icon={affidIcona} label="AFFID." val={`${affidabilita}%`} color={affidColore} />
          <KpiHero icon="🏗️" label="ATTIVE" val={num_commesse_attive} color={TEAL} />
          <KpiHero icon="⚠️" label="PROBL." val={num_problemi_aperti} color={num_problemi_aperti > 0 ? RED : MUTED} />
        </div>

        {/* Ultimo contatto + prossima azione */}
        <div style={{ marginTop: 10, background: 'rgba(255,255,255,0.08)', padding: '8px 10px', borderRadius: 8, display: 'flex', gap: 10, fontSize: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 0.4 }}>ULTIMO CONTATTO</div>
            <div style={{ color: '#fff', fontWeight: 700, marginTop: 2 }}>
              {cliente.ultimo_contatto_at ? `${giorni_da_ultimo_contatto} ${giorni_da_ultimo_contatto === 1 ? 'giorno' : 'giorni'} fa` : 'Mai'}
            </div>
          </div>
          {cliente.prossima_azione && (
            <div style={{ flex: 1.4, borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: 10 }}>
              <div style={{ color: AMBER, fontWeight: 700, letterSpacing: 0.4 }}>➜ PROSSIMA AZIONE</div>
              <div style={{ color: '#fff', fontWeight: 700, marginTop: 2 }}>{cliente.prossima_azione}</div>
            </div>
          )}
        </div>
      </div>

      {/* 4 BOTTONI AZIONE RAPIDA */}
      <div style={{ background: '#fff', margin: '-10px 14px 0', padding: 8, borderRadius: 12, display: 'flex', gap: 6, position: 'relative' as const, zIndex: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
        <AzioneBtn icon="📞" label="Chiama" col={TEAL} onClick={() => cliente.telefono && window.open(`tel:${cliente.telefono}`)} disabled={!cliente.telefono} />
        <AzioneBtn icon="💬" label="WhatsApp" col={GREEN} onClick={() => cliente.telefono && window.open(`https://wa.me/${cliente.telefono.replace(/[^\d]/g, '')}`)} disabled={!cliente.telefono} />
        <AzioneBtn icon="✉️" label="Email" col={BLUE} onClick={() => cliente.email && window.open(`mailto:${cliente.email}`)} disabled={!cliente.email} />
        <AzioneBtn icon="📝" label="Nota" col={PURPLE} onClick={() => setShowNota(true)} />
      </div>

      {/* TAG EMOZIONALI */}
      {cliente.tag_emozionali.length > 0 && (
        <div style={{ background: '#fff', margin: '10px 14px 0', padding: '10px 12px', borderRadius: 10 }}>
          <div style={{ fontSize: 9, color: MUTED, letterSpacing: 0.8, fontWeight: 700, marginBottom: 6 }}>💡 PROFILO CLIENTE</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
            {cliente.tag_emozionali.map(t => (
              <span key={t} style={{ background: '#F3E8FF', color: '#7E22CE', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                {t}
              </span>
            ))}
          </div>
          {cliente.preferenze_contatto?.no_dopo && (
            <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF3C7', borderRadius: 5, fontSize: 10, color: '#92400E', fontWeight: 700 }}>
              ⏰ Non chiamare dopo le {cliente.preferenze_contatto.no_dopo}
            </div>
          )}
        </div>
      )}

      {/* PAGAMENTI MINI-SUMMARY */}
      <div style={{ background: '#fff', margin: '10px 14px 0', padding: 12, borderRadius: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div style={{ textAlign: 'center' as const, background: '#F8FAFA', padding: '8px 6px', borderRadius: 8 }}>
          <div style={{ fontSize: 8, color: MUTED, fontWeight: 700, letterSpacing: 0.5 }}>TOTALE PAGATO</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: TEAL_DEEP, marginTop: 4 }}>€{Math.round(totale_pagato).toLocaleString('it-IT')}</div>
        </div>
        <div style={{ textAlign: 'center' as const, background: totale_saldo_aperto > 0 ? '#FEF3C7' : '#F8FAFA', padding: '8px 6px', borderRadius: 8 }}>
          <div style={{ fontSize: 8, color: totale_saldo_aperto > 0 ? '#92400E' : MUTED, fontWeight: 700, letterSpacing: 0.5 }}>SALDO APERTO</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: totale_saldo_aperto > 0 ? '#92400E' : MUTED, marginTop: 4 }}>€{Math.round(totale_saldo_aperto).toLocaleString('it-IT')}</div>
        </div>
      </div>

      {/* PILL SINTESI - 3 dati operativi top */}
      <div style={{ marginTop: 10 }}>
        <PillSintesi
          alertCount={ai.countByTipo.alert}
          prossimaAzione={cliente.prossima_azione}
          saldoAperto={totale_saldo_aperto}
          problemaAperto={ultimoProblemaTitolo}
        />
      </div>

      {/* BOTTONE ASCOLTA TTS + MODALITÀ AUTO */}
      <BottoneAscolta testo={ai.riassuntoVocale} onModalitaAuto={() => setShowAuto(true)} />

      {/* BANNER AI INSIGHTS */}
      <BannerAIInsights insights={ai.insights} countByTipo={ai.countByTipo} />

      {/* TAB SWITCHER 6 viste */}
      <div style={{ background: '#fff', margin: '10px 14px 0', padding: 4, borderRadius: 10, display: 'flex', gap: 2, overflowX: 'auto' as const }}>
        <ViewTabBtn active={view === 'timeline'} onClick={() => setView('timeline')} label="📅 Timeline" badge={eventi.length} />
        <ViewTabBtn active={view === 'comunicazioni'} onClick={() => setView('comunicazioni')} label="💬 Messaggi" />
        <ViewTabBtn active={view === 'commesse'} onClick={() => setView('commesse')} label="🏗️ Commesse" badge={commesse.length} />
        <ViewTabBtn active={view === 'pagamenti'} onClick={() => setView('pagamenti')} label="💰 Pagamenti" />
        <ViewTabBtn active={view === 'immobili'} onClick={() => setView('immobili')} label="🏠 Immobili" />
        <ViewTabBtn active={view === 'rete'} onClick={() => setView('rete')} label="🤝 Rete" />
      </div>

      {/* CONTENT in base a view */}
      {view === 'comunicazioni' ? (
        <div style={{ padding: 14 }}>
          <TabComunicazioni clienteId={cliente.id} clienteTelefono={cliente.telefono} clienteEmail={cliente.email} onApriCommessa={onApriCommessa} />
        </div>
      ) : view === 'commesse' ? (
        <div style={{ padding: 14 }}>
          <TabCommesse clienteId={cliente.id} onApriCommessa={onApriCommessa} />
        </div>
      ) : view === 'pagamenti' ? (
        <div style={{ padding: 14 }}>
          <TabPagamenti clienteId={cliente.id} onApriCommessa={onApriCommessa} />
        </div>
      ) : view === 'immobili' ? (
        <div style={{ padding: 14 }}>
          <TabImmobili clienteId={cliente.id} onApriCommessa={onApriCommessa} />
        </div>
      ) : view === 'rete' ? (
        <div style={{ padding: 14 }}>
          <TabRete clienteId={cliente.id} />
        </div>
      ) : (
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 4, height: 22, background: NAVY, borderRadius: 2 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>📅 STORIA CLIENTE</div>
            <div style={{ fontSize: 10, color: MUTED }}>{eventi.length} eventi in cronologia</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth={2}>
            <circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cerca nel passato del cliente..."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 12, color: TEXT, background: 'transparent' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: '#F1F4F7', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 11, color: MUTED, cursor: 'pointer', fontWeight: 700 }}>×</button>}
        </div>

        {/* Filtri categoria */}
        <div style={{ background: '#fff', padding: 8, borderRadius: 10, display: 'flex', gap: 6, overflowX: 'auto' as const, marginBottom: 12 }}>
          <Chip active={filtro === 'tutti'} onClick={() => setFiltro('tutti')} label="TUTTI" n={eventi.length} col={NAVY} />
          {Object.entries(CATEGORIA_META).map(([k, v]) => {
            const n = conteggiCat[k] || 0;
            if (n === 0) return null;
            return <Chip key={k} active={filtro === k} onClick={() => setFiltro(k as FiltroCategoria)} label={v.label} n={n} col={v.col} bg={v.bg} />;
          })}
        </div>

        {/* Pinnati */}
        {pinnati.length > 0 && (
          <>
            <div style={{ fontSize: 9, color: AMBER, letterSpacing: 1, marginBottom: 6, fontWeight: 800 }}>📌 DA RICORDARE SEMPRE</div>
            {pinnati.map(e => <EventoCard key={e.id} ev={e} onApriCommessa={onApriCommessa} onUnpin={() => togglePin(e.id, false)} />)}
            <div style={{ height: 1, background: '#E5EAF0', margin: '12px 0' }} />
          </>
        )}

        {/* Timeline normale */}
        {normali.length === 0 && pinnati.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center' as const, color: MUTED, fontSize: 13 }}>
            Nessun evento trovato
          </div>
        ) : (
          <div style={{ position: 'relative' as const }}>
            {/* Linea verticale timeline */}
            <div style={{ position: 'absolute' as const, left: 24, top: 6, bottom: 6, width: 2, background: '#E5EAF0' }} />
            {normali.map(e => <EventoCard key={e.id} ev={e} onApriCommessa={onApriCommessa} onPin={() => togglePin(e.id, true)} timeline />)}
          </div>
        )}
      </div>
      )}

      {/* FAB Nuova Nota */}
      <button onClick={() => setShowNota(true)} style={{
        position: 'fixed', bottom: 90, right: 18, zIndex: 9850,
        height: 56, padding: '0 18px', borderRadius: 28,
        background: `linear-gradient(135deg, ${PURPLE}, #5B21B6)`,
        color: '#fff', border: 'none', cursor: 'pointer',
        boxShadow: '0 6px 20px rgba(126,34,206,0.5)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 800, letterSpacing: 0.5,
      }}>
        <span style={{ fontSize: 20 }}>📝</span>
        <span>NOTA</span>
      </button>

      {showAuto && (
        <ModalitaAuto cliente={cliente} testo={ai.riassuntoVocale} onClose={() => setShowAuto(false)} />
      )}

      {showNota && (
        <ModalNuovaNota
          aziendaId={cliente.azienda_id || (typeof window !== 'undefined' ? (sessionStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro:aziendaId') || localStorage.getItem('mastro_azienda_id') || '') : '')}
          clienteId={cliente.id}
          onClose={() => setShowNota(false)}
        />
      )}
    </div>
  );
}

function ViewTabBtn({ active, onClick, label, badge }: any) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '10px 0', fontSize: 11, fontWeight: 700,
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

// =============== CARD EVENTO TIMELINE ===============
function EventoCard({ ev, onApriCommessa, onPin, onUnpin, timeline }: any) {
  const sevCol = ev.severity === 'success' ? TEAL_DEEP :
                  ev.severity === 'warning' ? AMBER :
                  ev.severity === 'error' || ev.severity === 'critical' ? RED :
                  ev.colore || BLUE;
  const sevBg = ev.severity === 'success' ? '#D1FAE5' :
                 ev.severity === 'warning' ? '#FEF3C7' :
                 ev.severity === 'error' || ev.severity === 'critical' ? '#FEE2E2' :
                 '#F1F4F7';
  
  const d = new Date(ev.data_evento);
  const giorni = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
  const dataFmt = giorni === 0 ? 'OGGI' : giorni === 1 ? 'IERI' : giorni < 7 ? `${giorni}g fa` : d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' });
  const oraFmt = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ position: 'relative' as const, marginBottom: 8, paddingLeft: timeline ? 48 : 0 }}>
      {/* Pallino timeline */}
      {timeline && (
        <div style={{
          position: 'absolute' as const, left: 16, top: 12,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff', border: `3px solid ${sevCol}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, zIndex: 1,
        }} />
      )}

      <div style={{ background: '#fff', borderRadius: 10, padding: 12, borderLeft: `4px solid ${sevCol}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: sevBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            {ev.icona || '•'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
              <span style={{ background: sevBg, color: sevCol, padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{(CATEGORIA_META as any)[ev.categoria]?.label || ev.categoria}</span>
              {ev.commessa_code && (
                <button onClick={(e) => { e.stopPropagation(); onApriCommessa?.(ev.commessa_id); }} style={{ background: NAVY, color: '#fff', padding: '2px 7px', borderRadius: 3, fontSize: 9, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                  {ev.commessa_code}
                </button>
              )}
              {ev.automatico && <span style={{ background: '#F1F4F7', color: MUTED, padding: '2px 6px', borderRadius: 3, fontSize: 8, fontWeight: 700 }}>AUTO</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{ev.titolo}</div>
            {ev.descrizione && (
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4, marginTop: 4 }}>{ev.descrizione}</div>
            )}
            <div style={{ fontSize: 9, color: MUTED, marginTop: 6, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📅 {dataFmt} · {oraFmt}</span>
              {ev.autore && <span>· {ev.autore}</span>}
            </div>
          </div>
          {(onPin || onUnpin) && (
            <button onClick={(e) => { e.stopPropagation(); onPin?.(); onUnpin?.(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16, color: ev.pinnato ? AMBER : MUTED, opacity: ev.pinnato ? 1 : 0.4 }} title={ev.pinnato ? 'Rimuovi pin' : 'Pinna'}>
              📌
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============== HELPERS ===============
function KpiHero({ icon, label, val, color, small }: any) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${color}55`, padding: '8px 6px', borderRadius: 10, textAlign: 'center' as const }}>
      <div style={{ fontSize: 12, marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: small ? 14 : 18, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 7, color, fontWeight: 700, letterSpacing: 0.4, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function AzioneBtn({ icon, label, col, onClick, disabled }: any) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex: 1, padding: '10px 0', background: disabled ? '#F8FAFA' : col + '15',
      border: `1.5px solid ${disabled ? '#E5EAF0' : col}`,
      borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 3,
      opacity: disabled ? 0.4 : 1,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 9, fontWeight: 800, color: disabled ? MUTED : col, letterSpacing: 0.3 }}>{label}</span>
    </button>
  );
}

function Chip({ active, onClick, label, n, col, bg }: any) {
  return (
    <button onClick={onClick} style={{
      background: active ? col : (bg || '#F1F4F7'),
      color: active ? '#fff' : TEXT,
      border: 'none', borderRadius: 7, padding: '7px 10px',
      fontSize: 10, fontWeight: 700, cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 5,
      whiteSpace: 'nowrap' as const, flexShrink: 0,
    }}>
      {label}
      <span style={{ background: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)', color: active ? '#fff' : TEXT, padding: '2px 5px', borderRadius: 3, fontSize: 9, fontWeight: 800 }}>{n}</span>
    </button>
  );
}
