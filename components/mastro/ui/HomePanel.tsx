"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v9 — Full-width + Bottoni 3D fliwoX
// Sessione 5: eliminati spazi laterali, bottoni grandi in rilievo
import React, { useMemo } from "react";
import { useMastro } from "../../MastroContext";
import { ICO } from "../../mastro-constants";

// ─── Design System fliwoX (immutabile) ────────────────────────
const DS = {
  teal: '#28A0A0',
  tealDark: '#156060',
  dark: '#0D1F1F',
  ink: '#0D1F1F',
  light: '#EEF8F8',
  border: '#C8E4E4',
  bg: '#E8F4F4',
  white: '#FFFFFF',
  red: '#DC4444',
  green: '#1A9E73',
  amber: '#F59E0B',
  blue: '#3B7FE0',
};

// ─── Stile bottone 3D fliwoX (riutilizzabile) ────────────────
const btn3d = (color: string, darkColor: string): React.CSSProperties => ({
  padding: '14px 28px',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
  color: DS.white,
  background: color,
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  boxShadow: `0 4px 0 ${darkColor}, 0 6px 12px rgba(0,0,0,0.15)`,
  transform: 'translateY(0)',
  transition: 'all 0.1s ease',
  letterSpacing: 0.3,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
});

const btn3dOutline = (color: string): React.CSSProperties => ({
  padding: '14px 28px',
  fontSize: 14,
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
  color: color,
  background: DS.white,
  border: `2px solid ${color}`,
  borderRadius: 10,
  cursor: 'pointer',
  boxShadow: `0 4px 0 ${DS.border}, 0 6px 12px rgba(0,0,0,0.08)`,
  transform: 'translateY(0)',
  transition: 'all 0.1s ease',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
});

// ─── SVG Icons inline ────────────────────────────────────────
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M8 3v10M3 8h10" />
  </svg>
);

const TaskIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="2" width="12" height="12" rx="2" />
    <path d="M5 8l2 2 4-4" />
  </svg>
);

const MsgIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 3h10a1 1 0 011 1v6a1 1 0 01-1 1H7l-3 2v-2H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
  </svg>
);

// ─── Pipeline stages ────────────────────────────────────────
const PIPELINE = [
  { key: 'RILIEVO', label: 'Sopralluogo', color: DS.blue },
  { key: 'PREVENTIVO', label: 'Preventivo', color: DS.amber },
  { key: 'CONFERMA ORDINE', label: 'Conferma', color: DS.teal },
  { key: 'ORDINE CONFERMATO', label: 'Misure', color: DS.tealDark },
  { key: 'PRODUZIONE', label: 'Ordini', color: '#8B5CF6' },
  { key: 'IN_PRODUZIONE', label: 'Produzione', color: '#EC4899' },
  { key: 'POSA', label: 'Posa', color: DS.green },
  { key: 'FATTURA', label: 'Chiusura', color: '#6B7280' },
];

// ═══════════════════════════════════════════════════════════
// HOME PANEL
// ═══════════════════════════════════════════════════════════

export default function HomePanel() {
  const { state, dispatch } = useMastro();
  const commesse = state?.commesse || [];
  const messaggi = state?.messaggi || [];
  const user = state?.user;

  const stats = useMemo(() => {
    const attive = commesse.filter((c: any) => !['FATTURA', 'PAGATA'].includes(c.stato));
    const ferme = commesse.filter((c: any) => c.stato === 'RILIEVO' || c.stato === 'PREVENTIVO');
    const pipeline = commesse.reduce((s: number, c: any) => s + (c.valore_totale || 0), 0);
    const daIncassare = commesse.filter((c: any) => c.stato === 'FATTURA').reduce((s: number, c: any) => s + (c.valore_totale || 0), 0);
    const nonLetti = (messaggi || []).filter((m: any) => !m.letto).length;
    return { attive: attive.length, ferme: ferme.length, pipeline, daIncassare, nonLetti };
  }, [commesse, messaggi]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE.forEach(p => { counts[p.key] = 0; });
    commesse.forEach((c: any) => { if (counts[c.stato] !== undefined) counts[c.stato]++; });
    return counts;
  }, [commesse]);

  const totalPipeline = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  const now = new Date();
  const saluto = now.getHours() < 12 ? 'Buongiorno' : now.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera';

  // 3D button press handler
  const handlePress = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = 'translateY(3px)';
    btn.style.boxShadow = '0 1px 0 ' + DS.tealDark + ', 0 2px 4px rgba(0,0,0,0.1)';
    setTimeout(() => {
      btn.style.transform = 'translateY(0)';
      btn.style.boxShadow = '';
    }, 150);
  };

  return (
    <div style={{ padding: 0, width: '100%', fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header + Azioni ── */}
      <div style={{ padding: '24px 28px 20px', background: DS.white, borderBottom: `1px solid ${DS.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: DS.ink }}>
              {saluto}, {user?.nome || 'FABIO COZZA'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: DS.tealDark }}>
              {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Bottoni 3D */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              style={btn3dOutline(DS.teal)}
              onMouseDown={handlePress}
              onClick={() => dispatch?.({ type: 'SET_PANEL', panel: 'task' })}
            >
              <TaskIcon />
              {stats.attive} task aperte
            </button>
            <button
              style={btn3d(DS.teal, DS.tealDark)}
              onMouseDown={handlePress}
              onClick={() => dispatch?.({ type: 'MODAL', modal: 'nuovaTask' })}
            >
              <PlusIcon />
              Nuova task
            </button>
            <button
              style={btn3d(DS.blue, '#2563EB')}
              onMouseDown={handlePress}
              onClick={() => dispatch?.({ type: 'MODAL', modal: 'nuovaCommessa' })}
            >
              <PlusIcon />
              Nuova commessa
            </button>
            <button
              style={btn3d(DS.dark, '#000')}
              onMouseDown={handlePress}
              onClick={() => dispatch?.({ type: 'SET_PANEL', panel: 'messaggi' })}
            >
              <MsgIcon />
              Messaggio
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat cards — FULL WIDTH ── */}
      <div style={{ padding: '20px 28px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
        {[
          { label: 'COMMESSE ATTIVE', value: stats.attive, sub: `${commesse.filter((c: any) => c.confermata).length} confermate`, color: DS.blue },
          { label: 'COMMESSE FERME', value: stats.ferme, sub: 'Soglia 5gg', color: DS.amber },
          { label: 'PIPELINE', value: `\u20AC${(stats.pipeline / 1000).toFixed(stats.pipeline > 9999 ? 0 : 1)}k`, sub: `\u20AC${commesse.filter((c: any) => c.confermata).reduce((s: number, c: any) => s + (c.valore_totale || 0), 0).toLocaleString('it-IT')} confermato`, color: DS.green },
          { label: 'DA INCASSARE', value: `\u20AC${stats.daIncassare.toLocaleString('it-IT')}`, sub: `${commesse.filter((c: any) => c.stato === 'FATTURA').length} scadute`, color: DS.red },
          { label: 'MESSAGGI', value: stats.nonLetti, sub: `${messaggi?.length || 0} totali`, color: DS.teal },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '20px 22px',
            background: DS.white,
            borderRadius: 12,
            border: `1px solid ${DS.border}`,
            boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: s.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: DS.tealDark, marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid: Pipeline + Scadenze ── */}
      <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 20 }}>

        {/* Pipeline commesse */}
        <div style={{
          background: DS.white,
          borderRadius: 14,
          border: `1px solid ${DS.border}`,
          boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: DS.ink }}>Pipeline commesse</span>
              <span style={{ fontSize: 12, color: DS.tealDark, fontWeight: 500 }}>{totalPipeline} attive</span>
            </div>
            <button style={{ fontSize: 12, color: DS.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Vedi tutto →
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ padding: '12px 22px 0', display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: DS.light, margin: '0 22px' }}>
            {PIPELINE.map(p => {
              const pct = totalPipeline > 0 ? (pipelineCounts[p.key] / totalPipeline) * 100 : 0;
              return pct > 0 ? <div key={p.key} style={{ width: `${pct}%`, background: p.color, transition: 'width 0.3s' }} /> : null;
            })}
          </div>

          {/* Pipeline grid */}
          <div style={{ padding: '16px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {PIPELINE.map(p => (
              <div key={p.key} style={{
                padding: '14px 16px',
                borderRadius: 10,
                background: DS.light,
                border: `1px solid ${DS.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = DS.white; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.light; }}
              >
                <div style={{ fontSize: 11, color: DS.tealDark, fontWeight: 500, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: DS.ink, fontFamily: 'JetBrains Mono, monospace' }}>
                  {pipelineCounts[p.key]}
                </div>
                <div style={{ fontSize: 10, color: p.color, fontWeight: 600, marginTop: 2 }}>
                  {totalPipeline > 0 ? Math.round((pipelineCounts[p.key] / totalPipeline) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonna destra */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Scadenze */}
          <div style={{
            background: DS.white,
            borderRadius: 14,
            border: `1px solid ${DS.border}`,
            boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
            padding: 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: DS.ink }}>Scadenze</span>
              <span style={{ fontSize: 12, color: DS.tealDark }}>— 15gg</span>
            </div>
            {[
              { label: 'CONSEGNE', count: 0, text: 'Nessuna consegna programmata' },
              { label: 'FATTURE IN SCADENZA', count: 0, text: 'Nessuna fattura in scadenza' },
              { label: 'MONTAGGI', count: 0, text: 'Nessun montaggio programmato' },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, letterSpacing: 0.8, textTransform: 'uppercase' }}>{s.label} ({s.count})</div>
                <div style={{ fontSize: 12, color: DS.ink, marginTop: 3 }}>{s.text}</div>
              </div>
            ))}
          </div>

          {/* Oggi */}
          <div style={{
            background: DS.white,
            borderRadius: 14,
            border: `1px solid ${DS.border}`,
            boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
            padding: 22,
          }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: DS.ink, marginBottom: 12 }}>Oggi</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ textAlign: 'center', padding: 16, background: DS.light, borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: DS.ink, fontFamily: 'JetBrains Mono, monospace' }}>0</div>
                <div style={{ fontSize: 11, color: DS.tealDark, marginTop: 4 }}>montaggi oggi</div>
              </div>
              <div style={{ textAlign: 'center', padding: 16, background: DS.light, borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: DS.ink, fontFamily: 'JetBrains Mono, monospace' }}>0</div>
                <div style={{ fontSize: 11, color: DS.tealDark, marginTop: 4 }}>task oggi</div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div style={{
            background: DS.white,
            borderRadius: 14,
            border: `1px solid ${DS.border}`,
            boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
            padding: 22,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: DS.ink }}>Team — adesso</span>
              <button style={{ fontSize: 12, color: DS.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Vedi tutto →
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: DS.teal, color: DS.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 14,
              }}>T</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: DS.ink }}>Titolare</div>
                <div style={{ fontSize: 11, color: DS.tealDark }}>Titolare</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Riga inferiore: Produzione + Pratiche + Commesse da sbloccare ── */}
      <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>

        {/* Produzione */}
        <div style={{
          background: DS.white,
          borderRadius: 14,
          border: `1px solid ${DS.border}`,
          boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.red }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: DS.ink }}>Produzione</span>
            <span style={{ fontSize: 12, color: DS.red, fontWeight: 500 }}>0 attive</span>
          </div>
          {[
            { label: 'In produzione', pct: 0, count: 0 },
            { label: 'In attesa ordini', pct: 0, count: 0 },
            { label: 'Pronte per posa', pct: 0, count: 0 },
            { label: 'Ordini fornitori', pct: 0, count: 0 },
          ].map((r, i) => (
            <div key={i} style={{
              padding: '12px 22px',
              borderBottom: `1px solid ${DS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, color: DS.ink }}>{r.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: DS.amber, fontWeight: 600 }}>{r.pct}%</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: DS.ink, fontFamily: 'JetBrains Mono, monospace' }}>{r.count}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pratiche fiscali */}
        <div style={{
          background: DS.white,
          borderRadius: 14,
          border: `1px solid ${DS.border}`,
          boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.blue }} />
            <span style={{ fontWeight: 800, fontSize: 14, color: DS.ink }}>Pratiche fiscali</span>
          </div>
          {[
            { label: 'Ristrutturazione 50%', commesse: 0, valore: 0, pct: 0 },
            { label: 'Ecobonus 65%', commesse: 0, valore: 0, pct: 0 },
            { label: 'Barriere 75%', commesse: 0, valore: 0, pct: 0 },
          ].map((r, i) => (
            <div key={i} style={{
              padding: '12px 22px',
              borderBottom: `1px solid ${DS.border}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.ink }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: DS.ink, fontFamily: 'JetBrains Mono, monospace' }}>{r.commesse}</span>
              </div>
              <div style={{ fontSize: 11, color: DS.tealDark, marginTop: 2 }}>
                {r.commesse} commesse · \u20AC{r.valore}
              </div>
              <div style={{ fontSize: 10, color: DS.green, fontWeight: 600 }}>{r.pct}%</div>
            </div>
          ))}
        </div>

        {/* Commesse da sbloccare */}
        <div style={{
          background: DS.white,
          borderRadius: 14,
          border: `1px solid ${DS.border}`,
          boxShadow: `0 3px 0 ${DS.border}, 0 4px 10px rgba(0,0,0,0.06)`,
          padding: 22,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: DS.ink }}>Commesse da sbloccare</span>
            <button style={{ fontSize: 12, color: DS.teal, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Vedi tutto →
            </button>
          </div>
          <div style={{ textAlign: 'center', padding: '24px 0', color: DS.green, fontSize: 14 }}>
            Tutto in ordine
          </div>
        </div>
      </div>
    </div>
  );
}
