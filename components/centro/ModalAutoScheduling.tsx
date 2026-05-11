"use client";
// components/centro/ModalAutoScheduling.tsx
// Modal con TOP 3 suggerimenti scheduling + bottone "Usa questo"

import React, { useEffect } from "react";
import { useAutoScheduling, type Suggerimento } from "../../hooks/useAutoScheduling";

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0", TEAL_DEEP = "#0F6E56";
const AMBER = "#D97706", RED = "#DC2626";
const TEXT = "#0F1F33", MUTED = "#5C6B7A";

interface Props {
  aziendaId: string;
  commessaId: string;
  commessaCode: string;
  onClose: () => void;
  onApplied?: () => void;
}

export default function ModalAutoScheduling({ aziendaId, commessaId, commessaCode, onClose, onApplied }: Props) {
  const { suggerimenti, loading, calcola, applica } = useAutoScheduling();
  const [applying, setApplying] = React.useState<string | null>(null);

  useEffect(() => {
    calcola(aziendaId, commessaId);
  }, [aziendaId, commessaId, calcola]);

  const handleApply = async (sug: Suggerimento) => {
    setApplying(sug.giorno + '|' + sug.squadra_id);
    try {
      await applica(aziendaId, commessaId, sug);
      onApplied?.();
      onClose();
    } catch (e) {
      console.warn('apply error', e);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,27,45,0.7)', zIndex: 9900, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#F4F1EA', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 540, maxHeight: '85vh', overflowY: 'auto' as const, paddingBottom: 24 }}>
        {/* Header */}
        <div style={{ background: NAVY, color: '#fff', padding: '14px 16px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(40,160,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth={2}>
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>AUTO SCHEDULING AI</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{commessaCode}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ padding: 30, textAlign: 'center', color: MUTED, fontSize: 13 }}>
              <div style={{ marginBottom: 8 }}>Analisi in corso…</div>
              <div style={{ fontSize: 10 }}>Squadre · Saturazione · Conflitti · Zona · Specializzazione</div>
            </div>
          ) : suggerimenti.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: MUTED, fontSize: 13 }}>
              <div>Nessun suggerimento disponibile.</div>
              <div style={{ fontSize: 11, marginTop: 6 }}>Tutte le squadre sono piene nei prossimi 14gg.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 12, lineHeight: 1.4 }}>
                Top 3 combinazioni squadra + giorno basate su zona, specializzazione, saturazione e conflitti.
              </div>

              {suggerimenti.map((s, i) => {
                const isApplying = applying === (s.giorno + '|' + s.squadra_id);
                return (
                  <div key={i} style={{ background: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderLeft: `5px solid ${s.squadra_colore}`, boxShadow: i === 0 ? '0 2px 8px rgba(40,160,160,0.25)' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                    {/* Header card */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: s.squadra_colore, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>
                        {s.squadra_nome.slice(0, 3).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Sq. {s.squadra_nome}</div>
                        <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{s.squadra_zona || 'Zona n/a'}</div>
                      </div>
                      {i === 0 && (
                        <span style={{ background: TEAL, color: '#fff', fontSize: 9, padding: '4px 9px', borderRadius: 5, fontWeight: 700 }}>MIGLIORE</span>
                      )}
                    </div>

                    {/* Quando */}
                    <div style={{ background: '#EFF6FF', padding: '10px 12px', borderRadius: 8, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#1E40AF" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>{s.giorno_label}</div>
                        <div style={{ fontSize: 10, color: '#1E40AF', marginTop: 2 }}>{s.ora_inizio} · durata {s.ore_stimate}h</div>
                      </div>
                      <div style={{ background: '#1E40AF', color: '#fff', padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>Score {s.score}</div>
                    </div>

                    {/* Motivazione */}
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: MUTED, letterSpacing: 1, fontWeight: 700, marginBottom: 5 }}>PERCHE</div>
                      {s.motivazione.map((m, j) => (
                        <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 11, color: TEXT }}>
                          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>

                    {/* Warnings */}
                    {s.warnings.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        {s.warnings.map((w, j) => (
                          <div key={j} style={{ background: '#FEF3C7', borderLeft: `3px solid ${AMBER}`, padding: '6px 10px', borderRadius: 6, marginBottom: 4, fontSize: 10, color: '#92400E', fontWeight: 600 }}>
                            ⚠ {w}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottone applica */}
                    <button onClick={() => handleApply(s)} disabled={isApplying}
                      style={{
                        width: '100%', padding: '12px 0',
                        background: i === 0 ? TEAL : '#fff',
                        color: i === 0 ? '#fff' : TEAL,
                        border: i === 0 ? 'none' : `2px solid ${TEAL}`,
                        borderRadius: 10, fontSize: 13, fontWeight: 700,
                        cursor: isApplying ? 'wait' : 'pointer',
                        opacity: isApplying ? 0.6 : 1,
                      }}>
                      {isApplying ? 'Applicazione…' : (i === 0 ? '✓ USA QUESTO' : 'Usa questo')}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
