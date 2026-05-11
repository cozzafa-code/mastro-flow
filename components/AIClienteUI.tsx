"use client";
// components/AIClienteUI.tsx - Componenti AI Memory + Mobile WOW (BLOCCO 5)

import React, { useState, useEffect } from "react";
import { parlaTesto, stopParlato, type AIInsight } from "../hooks/useClienteAI";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF", PURPLE = "#7E22CE";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

// =========== BANNER AI INSIGHTS ===========
// Card collassabile con tutti gli insights AI
export function BannerAIInsights({ insights, countByTipo }: { insights: AIInsight[]; countByTipo: any }) {
  const [open, setOpen] = useState(true);
  
  if (insights.length === 0) return null;
  
  // Alerts in alto sempre visibili
  const alertHigh = insights.filter(i => i.priorita === 'alta');
  
  return (
    <div style={{ background: '#fff', margin: '10px 14px 0', borderRadius: 12, overflow: 'hidden' as const, border: alertHigh.length > 0 ? `2px solid ${RED}` : 'none', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
      {/* Header cliccabile */}
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '12px 14px', background: open ? `linear-gradient(90deg, ${PURPLE}, #5B21B6)` : '#fff',
        color: open ? '#fff' : TEXT, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: open ? 'rgba(255,255,255,0.2)' : '#F3E8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🧠
        </div>
        <div style={{ flex: 1, textAlign: 'left' as const }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>AI MEMORY · {insights.length} insight{insights.length === 1 ? '' : 's'}</div>
          <div style={{ fontSize: 10, opacity: 0.85, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {countByTipo.alert > 0 && <span>⚠️ {countByTipo.alert} alert</span>}
            {countByTipo.suggerimento > 0 && <span>💡 {countByTipo.suggerimento} suggerimenti</span>}
            {countByTipo.preferenza > 0 && <span>🎯 {countByTipo.preferenza} preferenze</span>}
            {countByTipo.upsell > 0 && <span>💰 {countByTipo.upsell} upsell</span>}
          </div>
        </div>
        <span style={{ fontSize: 16 }}>{open ? '▾' : '▸'}</span>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: 10 }}>
          {insights.map(ins => <CardInsight key={ins.id} ins={ins} />)}
        </div>
      )}
    </div>
  );
}

function CardInsight({ ins }: { ins: AIInsight }) {
  const tipoBadge: Record<string, { col: string; bg: string; label: string }> = {
    alert:         { col: RED,    bg: '#FEE2E2', label: 'ALERT' },
    suggerimento:  { col: BLUE,   bg: '#DBEAFE', label: 'SUGGER.' },
    preferenza:    { col: AMBER,  bg: '#FEF3C7', label: 'PREF.' },
    upsell:        { col: GREEN,  bg: '#D1FAE5', label: 'UPSELL' },
    memo:          { col: MUTED,  bg: '#F1F4F7', label: 'MEMO' },
  };
  const tb = tipoBadge[ins.tipo] || tipoBadge.memo;
  
  return (
    <div style={{ background: '#F8FAFA', borderRadius: 8, padding: 10, marginBottom: 6, borderLeft: `3px solid ${ins.colore}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ fontSize: 22, lineHeight: 1 }}>{ins.icona}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2, flexWrap: 'wrap' as const }}>
            <span style={{ background: tb.bg, color: tb.col, padding: '2px 6px', borderRadius: 3, fontSize: 8, fontWeight: 800 }}>{tb.label}</span>
            {ins.priorita === 'alta' && <span style={{ background: '#FEE2E2', color: RED, padding: '2px 6px', borderRadius: 3, fontSize: 8, fontWeight: 800 }}>🔴 ALTA</span>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{ins.titolo}</div>
          <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4, marginTop: 3 }}>{ins.descrizione}</div>
        </div>
      </div>
    </div>
  );
}

// =========== PILL SINTESI ===========
// Striscia sintesi top con 3 dati operativi più importanti
export function PillSintesi({ alertCount, prossimaAzione, saldoAperto, problemaAperto }: any) {
  const items = [];
  
  if (problemaAperto) {
    items.push({ icon: '⚠️', label: 'PROBLEMA', val: problemaAperto, col: RED });
  }
  if (saldoAperto > 0) {
    items.push({ icon: '💸', label: 'SALDO APERTO', val: `€${Math.round(saldoAperto).toLocaleString('it-IT')}`, col: AMBER });
  }
  if (prossimaAzione) {
    items.push({ icon: '➜', label: 'AZIONE', val: prossimaAzione, col: TEAL });
  }
  if (alertCount > 0) {
    items.push({ icon: '🧠', label: 'AI ALERT', val: `${alertCount} attivi`, col: PURPLE });
  }
  
  if (items.length === 0) return null;
  
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto' as const, padding: '0 14px', marginBottom: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          flexShrink: 0, background: '#fff', padding: '6px 10px', borderRadius: 16,
          border: `1.5px solid ${it.col}`, display: 'flex', alignItems: 'center', gap: 5,
          maxWidth: 200,
        }}>
          <span style={{ fontSize: 13 }}>{it.icon}</span>
          <span style={{ fontSize: 8, color: it.col, fontWeight: 800, letterSpacing: 0.5 }}>{it.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const }}>{it.val}</span>
        </div>
      ))}
    </div>
  );
}

// =========== BOTTONE ASCOLTA ===========
// TTS legge il riassunto vocale del dossier
export function BottoneAscolta({ testo, onModalitaAuto }: { testo: string; onModalitaAuto?: () => void }) {
  const [parlando, setParlando] = useState(false);
  
  useEffect(() => {
    return () => { stopParlato(); };
  }, []);

  function toggle() {
    if (parlando) {
      stopParlato();
      setParlando(false);
    } else {
      const ok = parlaTesto(testo, () => setParlando(false));
      if (ok) setParlando(true);
      else alert('TTS non supportato dal browser. Prova Chrome o Safari.');
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 14px', marginBottom: 8 }}>
      <button onClick={toggle} style={{
        flex: 1, padding: '11px 14px',
        background: parlando ? `linear-gradient(90deg, ${RED}, #991B1B)` : `linear-gradient(90deg, ${PURPLE}, #5B21B6)`,
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 13, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 3px 10px rgba(126,34,206,0.3)',
      }}>
        <span style={{ fontSize: 18 }}>{parlando ? '⏹' : '🎙️'}</span>
        <span>{parlando ? 'STOP LETTURA' : 'ASCOLTA DOSSIER 30s'}</span>
        {parlando && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', animation: 'pulse-ai 1s infinite' }} />}
      </button>
      {onModalitaAuto && (
        <button onClick={onModalitaAuto} style={{
          padding: '0 14px', background: '#fff', color: TEAL_DEEP,
          border: `1.5px solid ${TEAL_DEEP}`, borderRadius: 10,
          fontSize: 12, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          🚗 AUTO
        </button>
      )}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse-ai { 0%,100%{opacity:1} 50%{opacity:0.3} }' }} />
    </div>
  );
}

// =========== MODALITÀ AUTO (voice-only) ===========
// UI semplificata + font giganti + voice-only
export function ModalitaAuto({ cliente, testo, onClose }: any) {
  const [parlando, setParlando] = useState(false);
  const [chiusoNote, setChiusoNote] = useState(false);
  
  useEffect(() => {
    // Auto-leggi all'apertura
    const t = setTimeout(() => {
      parlaTesto(testo, () => setParlando(false));
      setParlando(true);
    }, 500);
    return () => { clearTimeout(t); stopParlato(); };
  }, [testo]);

  function ripeti() {
    stopParlato();
    setTimeout(() => {
      parlaTesto(testo, () => setParlando(false));
      setParlando(true);
    }, 100);
  }

  function pausa() {
    stopParlato();
    setParlando(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: `linear-gradient(135deg, ${NAVY_DEEP}, #000)`, zIndex: 10000, display: 'flex', flexDirection: 'column' as const, color: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🚗</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>MODALITÀ IN MACCHINA</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{cliente?.nome} {cliente?.cognome}</div>
        </div>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 22, fontWeight: 700 }}>×</button>
      </div>

      {/* Visualizzazione contenuto */}
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 16 }}>
        {/* Wave animation */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{
              width: 6, borderRadius: 3,
              background: parlando ? TEAL : 'rgba(255,255,255,0.2)',
              height: parlando ? Math.random() * 40 + 20 : 8,
              transition: 'all 0.2s ease',
              animation: parlando ? `wave-${i} 0.8s ease-in-out infinite` : 'none',
            }} />
          ))}
        </div>

        {!chiusoNote && (
          <>
            {/* Tag emozionali grandi */}
            {cliente?.tag_emozionali?.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, fontWeight: 800, marginBottom: 8 }}>💡 RICORDA</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                  {cliente.tag_emozionali.slice(0, 4).map((t: string) => (
                    <span key={t} style={{ background: 'rgba(245,158,11,0.2)', color: '#FCD34D', padding: '8px 14px', borderRadius: 8, fontSize: 16, fontWeight: 700 }}>{t.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Prossima azione */}
            {cliente?.prossima_azione && (
              <div style={{ background: 'rgba(245,158,11,0.15)', border: `2px solid ${AMBER}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, color: '#FCD34D', letterSpacing: 1.5, fontWeight: 800, marginBottom: 6 }}>➜ PROSSIMA AZIONE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{cliente.prossima_azione}</div>
              </div>
            )}

            {/* Telefono gigante */}
            {cliente?.telefono && (
              <a href={`tel:${cliente.telefono}`} style={{
                background: `linear-gradient(135deg, ${TEAL_DEEP}, #047857)`,
                color: '#fff', padding: 20, borderRadius: 14, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              }}>
                <span style={{ fontSize: 32 }}>📞</span>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700, letterSpacing: 1 }}>TOCCA PER CHIAMARE</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{cliente.telefono}</div>
                </div>
              </a>
            )}
          </>
        )}
      </div>

      {/* Footer azioni - 4 bottoni giganti */}
      <div style={{ padding: 16, background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={parlando ? pausa : ripeti} style={{
          padding: '18px 0',
          background: parlando ? `linear-gradient(135deg, ${RED}, #991B1B)` : `linear-gradient(135deg, ${PURPLE}, #5B21B6)`,
          color: '#fff', border: 'none', borderRadius: 14,
          fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <span style={{ fontSize: 22 }}>{parlando ? '⏸' : '🔁'}</span>
          <span>{parlando ? 'PAUSA' : 'RIPETI'}</span>
        </button>
        <button onClick={() => setChiusoNote(!chiusoNote)} style={{
          padding: '18px 0',
          background: 'rgba(255,255,255,0.12)',
          color: '#fff', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14,
          fontSize: 15, fontWeight: 800, letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          cursor: 'pointer',
        }}>
          <span style={{ fontSize: 22 }}>{chiusoNote ? '👁️' : '🙈'}</span>
          <span>{chiusoNote ? 'MOSTRA' : 'NASCONDI'}</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wave-1 { 0%,100%{height:15px} 50%{height:55px} }
        @keyframes wave-2 { 0%,100%{height:30px} 50%{height:20px} }
        @keyframes wave-3 { 0%,100%{height:50px} 50%{height:25px} }
        @keyframes wave-4 { 0%,100%{height:20px} 50%{height:60px} }
        @keyframes wave-5 { 0%,100%{height:40px} 50%{height:15px} }
        @keyframes wave-6 { 0%,100%{height:25px} 50%{height:45px} }
        @keyframes wave-7 { 0%,100%{height:35px} 50%{height:18px} }
      ` }} />
    </div>
  );
}
