"use client";
// components/AIClienteUI.tsx - BLOCCO 5 ridisegnato in stile professionale
// Palette unica NAVY/TEAL/AMBER/BLUE - icone SVG monocrome

import React, { useState, useEffect } from "react";
import { parlaTesto, stopParlato, type AIInsight } from "../hooks/useClienteAI";
import { IcoBrain, IcoChevronDown, IcoChevronUp, IcoAlertTriangle, IcoSparkles, IcoInfo, IcoTrendingUp, IcoVolume, IcoStop, IcoCar, IcoRefresh, IcoPause, IcoClose, IcoEye, IcoEyeOff, IcoPhone } from "./IconLib";

const NAVY = "#1E3A5F", NAVY_DEEP = "#0F1B2D";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const GREEN = "#10B981", BLUE = "#1E40AF";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";
const BG = "#F4F1EA";

// =========== BANNER AI INSIGHTS ===========
export function BannerAIInsights({ insights, countByTipo }: { insights: AIInsight[]; countByTipo: any }) {
  const [open, setOpen] = useState(true);
  if (insights.length === 0) return null;
  const alertHigh = insights.filter(i => i.priorita === 'alta');

  return (
    <div style={{ background: '#fff', margin: '10px 14px 0', borderRadius: 12, overflow: 'hidden' as const, border: alertHigh.length > 0 ? `1.5px solid ${AMBER}` : '1px solid #E5EAF0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '12px 14px',
        background: open ? `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` : '#fff',
        color: open ? '#fff' : TEXT, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: open ? 'rgba(255,255,255,0.15)' : '#F1F4F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IcoBrain size={17} color={open ? '#fff' : NAVY} />
        </div>
        <div style={{ flex: 1, textAlign: 'left' as const }}>
          <div style={{ fontSize: 9, letterSpacing: 1.2, color: open ? 'rgba(255,255,255,0.6)' : MUTED, fontWeight: 700 }}>AI MEMORY</div>
          <div style={{ fontSize: 13, fontWeight: 800, marginTop: 1 }}>{insights.length} insight{insights.length === 1 ? '' : 's'} attivi</div>
          <div style={{ fontSize: 9, opacity: 0.85, marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' as const, color: open ? 'rgba(255,255,255,0.7)' : MUTED, fontWeight: 600 }}>
            {countByTipo.alert > 0 && <span>{countByTipo.alert} alert</span>}
            {countByTipo.suggerimento > 0 && <span>{countByTipo.suggerimento} suggerimenti</span>}
            {countByTipo.preferenza > 0 && <span>{countByTipo.preferenza} preferenze</span>}
            {countByTipo.upsell > 0 && <span>{countByTipo.upsell} upsell</span>}
          </div>
        </div>
        {open ? <IcoChevronUp size={18} color={open ? '#fff' : MUTED} /> : <IcoChevronDown size={18} color={MUTED} />}
      </button>

      {open && (
        <div style={{ padding: 10 }}>
          {insights.map(ins => <CardInsight key={ins.id} ins={ins} />)}
        </div>
      )}
    </div>
  );
}

function CardInsight({ ins }: { ins: AIInsight }) {
  // Mapping tipo -> ico + colors coerenti
  const tipoMeta: Record<string, { Ico: any; col: string; bg: string; label: string }> = {
    alert:        { Ico: IcoAlertTriangle, col: RED,       bg: '#FEE2E2', label: 'ALERT' },
    suggerimento: { Ico: IcoSparkles,      col: AMBER,     bg: '#FEF3C7', label: 'SUGGERIMENTO' },
    preferenza:   { Ico: IcoInfo,          col: BLUE,      bg: '#DBEAFE', label: 'PREFERENZA' },
    upsell:       { Ico: IcoTrendingUp,    col: TEAL_DEEP, bg: '#D1FAE5', label: 'UPSELL' },
    memo:         { Ico: IcoInfo,          col: MUTED,     bg: '#F1F4F7', label: 'MEMO' },
  };
  const tm = tipoMeta[ins.tipo] || tipoMeta.memo;
  const Ico = tm.Ico;

  return (
    <div style={{ background: '#F8FAFA', borderRadius: 8, padding: 11, marginBottom: 6, borderLeft: `3px solid ${tm.col}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: tm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Ico size={16} color={tm.col} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3, flexWrap: 'wrap' as const }}>
            <span style={{ background: tm.bg, color: tm.col, padding: '2px 7px', borderRadius: 3, fontSize: 8, fontWeight: 800, letterSpacing: 0.4 }}>{tm.label}</span>
            {ins.priorita === 'alta' && <span style={{ background: '#FEE2E2', color: RED, padding: '2px 6px', borderRadius: 3, fontSize: 8, fontWeight: 800, letterSpacing: 0.4 }}>ALTA</span>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>{ins.titolo}</div>
          <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4, marginTop: 3 }}>{ins.descrizione}</div>
        </div>
      </div>
    </div>
  );
}

// =========== PILL SINTESI ===========
export function PillSintesi({ alertCount, prossimaAzione, saldoAperto, problemaAperto }: any) {
  const items = [];
  if (problemaAperto) items.push({ Ico: IcoAlertTriangle, label: 'PROBLEMA', val: problemaAperto, col: RED });
  if (saldoAperto > 0) items.push({ Ico: IcoInfo, label: 'SALDO APERTO', val: `€${Math.round(saldoAperto).toLocaleString('it-IT')}`, col: AMBER });
  if (prossimaAzione) items.push({ Ico: IcoSparkles, label: 'AZIONE', val: prossimaAzione, col: TEAL_DEEP });
  if (alertCount > 0) items.push({ Ico: IcoBrain, label: 'AI ALERT', val: `${alertCount} attivi`, col: NAVY });

  if (items.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto' as const, padding: '0 14px', marginBottom: 8 }}>
      {items.map((it, i) => {
        const Ico = it.Ico;
        return (
          <div key={i} style={{
            flexShrink: 0, background: '#fff', padding: '7px 10px', borderRadius: 16,
            border: `1.5px solid ${it.col}`, display: 'flex', alignItems: 'center', gap: 6, maxWidth: 220,
          }}>
            <Ico size={13} color={it.col} />
            <span style={{ fontSize: 8, color: it.col, fontWeight: 800, letterSpacing: 0.5 }}>{it.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: TEXT, whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const, maxWidth: 140 }}>{it.val}</span>
          </div>
        );
      })}
    </div>
  );
}

// =========== BOTTONE ASCOLTA ===========
export function BottoneAscolta({ testo, onModalitaAuto }: { testo: string; onModalitaAuto?: () => void }) {
  const [parlando, setParlando] = useState(false);

  useEffect(() => () => { stopParlato(); }, []);

  function toggle() {
    if (parlando) { stopParlato(); setParlando(false); }
    else {
      const ok = parlaTesto(testo, () => setParlando(false));
      if (ok) setParlando(true);
      else alert('TTS non supportato dal browser. Prova Chrome o Safari.');
    }
  }

  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 14px', marginBottom: 8 }}>
      <button onClick={toggle} style={{
        flex: 1, padding: '11px 14px',
        background: parlando ? `linear-gradient(90deg, ${RED}, #991B1B)` : `linear-gradient(90deg, ${NAVY}, ${NAVY_DEEP})`,
        color: '#fff', border: 'none', borderRadius: 10,
        fontSize: 12, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 2px 8px rgba(15,27,45,0.25)',
      }}>
        {parlando ? <IcoStop size={16} color="#fff" /> : <IcoVolume size={16} color="#fff" />}
        <span>{parlando ? 'STOP LETTURA' : 'ASCOLTA DOSSIER (30s)'}</span>
        {parlando && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse-ai 1s infinite' }} />}
      </button>
      {onModalitaAuto && (
        <button onClick={onModalitaAuto} style={{
          padding: '0 14px', background: '#fff', color: TEAL_DEEP,
          border: `1.5px solid ${TEAL_DEEP}`, borderRadius: 10,
          fontSize: 11, fontWeight: 800, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <IcoCar size={14} color={TEAL_DEEP} />
          <span>AUTO</span>
        </button>
      )}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes pulse-ai { 0%,100%{opacity:1} 50%{opacity:0.3} }' }} />
    </div>
  );
}

// =========== MODALITÀ AUTO ===========
export function ModalitaAuto({ cliente, testo, onClose }: any) {
  const [parlando, setParlando] = useState(false);
  const [chiusoNote, setChiusoNote] = useState(false);

  useEffect(() => {
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
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IcoCar size={24} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>MODALITÀ IN MACCHINA</div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{cliente?.nome} {cliente?.cognome}</div>
        </div>
        <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IcoClose size={22} color="#fff" />
        </button>
      </div>

      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', gap: 16, overflowY: 'auto' as const }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 10, height: 60 }}>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{
              width: 6, borderRadius: 3,
              background: parlando ? TEAL : 'rgba(255,255,255,0.2)',
              height: parlando ? 32 : 8,
              transition: 'all 0.2s ease',
              animation: parlando ? `wave-${i} 0.8s ease-in-out infinite` : 'none',
            }} />
          ))}
        </div>

        {!chiusoNote && (
          <>
            {cliente?.tag_emozionali?.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5, fontWeight: 800, marginBottom: 8 }}>PROFILO CLIENTE</div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                  {cliente.tag_emozionali.slice(0, 4).map((t: string) => (
                    <span key={t} style={{ background: 'rgba(217,119,6,0.2)', color: '#FCD34D', padding: '8px 14px', borderRadius: 8, fontSize: 16, fontWeight: 700 }}>{t.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}

            {cliente?.prossima_azione && (
              <div style={{ background: 'rgba(217,119,6,0.15)', border: `2px solid ${AMBER}`, borderRadius: 14, padding: 16 }}>
                <div style={{ fontSize: 10, color: '#FCD34D', letterSpacing: 1.5, fontWeight: 800, marginBottom: 6 }}>PROSSIMA AZIONE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{cliente.prossima_azione}</div>
              </div>
            )}

            {cliente?.telefono && (
              <a href={`tel:${cliente.telefono}`} style={{
                background: `linear-gradient(135deg, ${TEAL_DEEP}, #047857)`,
                color: '#fff', padding: 20, borderRadius: 14, textDecoration: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
              }}>
                <IcoPhone size={32} color="#fff" />
                <div>
                  <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700, letterSpacing: 1 }}>TOCCA PER CHIAMARE</div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{cliente.telefono}</div>
                </div>
              </a>
            )}
          </>
        )}
      </div>

      <div style={{ padding: 16, background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={parlando ? pausa : ripeti} style={{
          padding: '18px 0',
          background: parlando ? `linear-gradient(135deg, ${RED}, #991B1B)` : `linear-gradient(135deg, ${NAVY}, ${NAVY_DEEP})`,
          color: '#fff', border: 'none', borderRadius: 14,
          fontSize: 14, fontWeight: 800, letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
        }}>
          {parlando ? <IcoPause size={20} color="#fff" /> : <IcoRefresh size={20} color="#fff" />}
          <span>{parlando ? 'PAUSA' : 'RIPETI'}</span>
        </button>
        <button onClick={() => setChiusoNote(!chiusoNote)} style={{
          padding: '18px 0', background: 'rgba(255,255,255,0.12)',
          color: '#fff', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14,
          fontSize: 14, fontWeight: 800, letterSpacing: 0.5,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
        }}>
          {chiusoNote ? <IcoEye size={20} color="#fff" /> : <IcoEyeOff size={20} color="#fff" />}
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
