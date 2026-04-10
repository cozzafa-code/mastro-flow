"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v10 — Centro di Comando
// Widget 3D draggabili + Compiti + Tutto espandibile
import React, { useState, useMemo, useRef } from "react";
import { useMastro } from "../../MastroContext";

const DS = {
  teal: '#28A0A0', tealDark: '#156060', dark: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', bg: '#E8F4F4',
  white: '#FFFFFF', red: '#DC4444', green: '#1A9E73',
  amber: '#F59E0B', blue: '#3B7FE0', purple: '#8B5CF6', pink: '#EC4899',
};

const PIPELINE = [
  { key: 'RILIEVO', label: 'Sopralluogo', color: DS.blue },
  { key: 'PREVENTIVO', label: 'Preventivo', color: DS.amber },
  { key: 'CONFERMA ORDINE', label: 'Conferma', color: DS.teal },
  { key: 'ORDINE CONFERMATO', label: 'Ordini', color: DS.purple },
  { key: 'IN_PRODUZIONE', label: 'Produzione', color: DS.pink },
  { key: 'POSA', label: 'Posa', color: DS.green },
  { key: 'COLLAUDO', label: 'Collaudo', color: DS.teal },
  { key: 'FATTURA', label: 'Chiusura', color: '#6B7280' },
];

const widget3d = {
  background: DS.white, borderRadius: 14, border: `1px solid ${DS.border}`,
  boxShadow: `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`,
  overflow: 'hidden', cursor: 'grab', transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative',
};

const btn3d = (bg, shadow) => ({
  padding: '11px 20px', fontSize: 12, fontWeight: 700, color: DS.white, background: bg,
  border: 'none', borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
  fontFamily: "'Inter', sans-serif", boxShadow: `0 4px 0 ${shadow}, 0 6px 10px rgba(0,0,0,0.12)`, transition: 'transform 0.08s',
});

const btn3dOutline = { ...btn3d(DS.white, DS.border), color: DS.teal, border: `2px solid ${DS.teal}`, boxShadow: `0 4px 0 ${DS.border}, 0 6px 8px rgba(0,0,0,0.06)` };

function WHead({ title, badge, badgeColor, dot, onAction, actionLabel }) {
  return (
    <div style={{ padding: '12px 16px 12px 28px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: DS.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
        {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
        {title}
        {badge && <span style={{ fontSize: 10, color: badgeColor || DS.tealDark, fontWeight: 500, marginLeft: 4 }}>{badge}</span>}
      </div>
      {onAction && <button onClick={onAction} style={{ fontSize: 10, color: DS.teal, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif" }}>{actionLabel || 'Vedi tutto \u2192'}</button>}
    </div>
  );
}

function DragHandle() {
  return (
    <div style={{ position: 'absolute', top: 12, left: 5, display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.25, cursor: 'grab', padding: '2px 4px' }}>
      {[0,1,2].map(i => <span key={i} style={{ width: 12, height: 2, background: DS.tealDark, borderRadius: 1, display: 'block' }} />)}
    </div>
  );
}

function ExpandBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 9, background: DS.light, border: 'none',
      borderTop: `1px solid ${DS.border}`, cursor: 'pointer',
      fontSize: 10, fontWeight: 600, color: DS.teal, fontFamily: "'Inter', sans-serif",
    }}>{label}</button>
  );
}

function RowItem({ label, value, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '9px 16px', borderBottom: `1px solid ${DS.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      cursor: 'pointer', transition: 'background 0.1s', fontSize: 12, color: DS.dark,
    }}
      onMouseEnter={e => (e.currentTarget.style.background = DS.light)}
      onMouseLeave={e => (e.currentTarget.style.background = DS.white)}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

function CompitiWidget({ onNavigate }) {
  const [compiti, setCompiti] = useState([
    { id: '1', title: 'Sopralluogo \u2014 Rossi Mario', type: 'Sopralluogo', typeColor: DS.blue, typeBg: '#EBF5FF', address: 'Via Roma 12', time: '9:00', priority: 'urgente', done: false },
    { id: '2', title: 'Misure \u2014 Bianchi Luigi', type: 'Misure', typeColor: DS.amber, typeBg: '#FFF8E1', address: 'Corso Mazzini 8', time: '11:00', priority: 'normale', done: false },
    { id: '3', title: 'Consegna \u2014 Verdi Anna', type: 'Consegna', typeColor: DS.green, typeBg: '#E8F5E9', address: 'Via Napoli 3', time: '8:30', priority: 'bassa', done: true },
  ]);

  const toggleDone = (id) => setCompiti(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const prioColor = { urgente: DS.red, normale: DS.amber, bassa: DS.green };

  return (
    <>
      <WHead title="Compiti oggi" badge={`${compiti.filter(c => !c.done).length} da fare`} dot={DS.amber} onAction={() => onNavigate('team')} actionLabel="Team Command \u2192" />
      {compiti.map(c => (
        <div key={c.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.1s', opacity: c.done ? 0.5 : 1 }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.light)} onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
          <div style={{ width: 5, height: 32, borderRadius: 3, background: prioColor[c.priority], flexShrink: 0 }} />
          <div onClick={(e) => { e.stopPropagation(); toggleDone(c.id); }} style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            border: c.done ? 'none' : `2px solid ${DS.border}`, background: c.done ? DS.green : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {c.done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={DS.white} strokeWidth="2.5" strokeLinecap="round"><path d="M2 6l3 3 5-5" /></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: DS.dark, textDecoration: c.done ? 'line-through' : 'none' }}>{c.title}</div>
            <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 8, fontWeight: 700, background: c.typeBg, color: c.typeColor, textTransform: 'uppercase' }}>{c.type}</span>
              {c.address && <span>{c.address}</span>}
              {c.time && <span>ore {c.time}</span>}
            </div>
          </div>
        </div>
      ))}
      <ExpandBtn label="Espandi compiti settimana \u2193" onClick={() => onNavigate('team')} />
    </>
  );
}

const DEFAULT_ORDER = ['compiti', 'pipeline', 'scadenze', 'oggi', 'team', 'produzione', 'contabilita', 'pratiche'];

export default function HomePanel() {
  const { state, dispatch } = useMastro();
  const commesse = state?.commesse || [];
  const messaggi = state?.messaggi || [];
  const user = state?.user;
  const nav = (panel) => dispatch?.({ type: 'SET_PANEL', panel });

  const [widgetOrder, setWidgetOrder] = useState(DEFAULT_ORDER);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (id) => { dragItem.current = id; };
  const handleDragOver = (id) => { dragOverItem.current = id; };
  const handleDrop = () => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) return;
    setWidgetOrder(prev => {
      const arr = [...prev];
      const fi = arr.indexOf(dragItem.current);
      const ti = arr.indexOf(dragOverItem.current);
      arr.splice(fi, 1);
      arr.splice(ti, 0, dragItem.current);
      return arr;
    });
    dragItem.current = null; dragOverItem.current = null;
  };

  const stats = useMemo(() => {
    const attive = commesse.filter(c => !['FATTURA', 'PAGATA'].includes(c.stato));
    const ferme = commesse.filter(c => c.stato === 'RILIEVO' || c.stato === 'PREVENTIVO');
    const pipeline = commesse.reduce((s, c) => s + (c.valore_totale || 0), 0);
    const daIncassare = commesse.filter(c => c.stato === 'FATTURA').reduce((s, c) => s + (c.valore_totale || 0), 0);
    const nonLetti = (messaggi || []).filter(m => !m.letto).length;
    return { attive: attive.length, ferme: ferme.length, pipeline, daIncassare, nonLetti };
  }, [commesse, messaggi]);

  const pipelineCounts = useMemo(() => {
    const c = {};
    PIPELINE.forEach(p => { c[p.key] = 0; });
    commesse.forEach(cm => { if (c[cm.stato] !== undefined) c[cm.stato]++; });
    return c;
  }, [commesse]);
  const totalPipe = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  const now = new Date();
  const saluto = now.getHours() < 12 ? 'Buongiorno' : now.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera';

  const sizeMap = {
    compiti: 'calc(50% - 7px)', pipeline: 'calc(50% - 7px)',
    scadenze: 'calc(33.33% - 10px)', oggi: 'calc(33.33% - 10px)', team: 'calc(33.33% - 10px)',
    produzione: 'calc(33.33% - 10px)', contabilita: 'calc(33.33% - 10px)', pratiche: 'calc(33.33% - 10px)',
  };

  const renderWidget = (id) => {
    const w = (children) => (
      <div key={id} draggable onDragStart={() => handleDragStart(id)} onDragOver={(e) => { e.preventDefault(); handleDragOver(id); }} onDrop={handleDrop}
        style={{ ...widget3d, width: sizeMap[id] || '100%' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 7px 0 ${DS.teal}, 0 10px 20px rgba(0,0,0,0.1)`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`; e.currentTarget.style.transform = 'none'; }}>
        <DragHandle />{children}
      </div>
    );

    switch (id) {
      case 'compiti': return w(<CompitiWidget onNavigate={nav} />);
      case 'pipeline': return w(<>
        <WHead title="Pipeline commesse" badge={`${totalPipe} attive`} onAction={() => nav('commesse')} />
        <div style={{ padding: '14px 16px' }}>
          <div style={{ height: 7, borderRadius: 4, background: DS.light, display: 'flex', overflow: 'hidden', marginBottom: 10 }}>
            {PIPELINE.map(p => { const pct = totalPipe > 0 ? (pipelineCounts[p.key] / totalPipe) * 100 : 0; return pct > 0 ? <div key={p.key} style={{ width: `${pct}%`, background: p.color }} /> : null; })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
            {PIPELINE.map(p => (
              <div key={p.key} onClick={() => nav('commesse')} style={{ padding: '10px 12px', borderRadius: 9, background: DS.light, border: `1px solid ${DS.border}`, cursor: 'pointer', transition: 'all 0.12s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = DS.white; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.light; }}>
                <div style={{ fontSize: 9, color: DS.tealDark }}>{p.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: DS.dark }}>{pipelineCounts[p.key]}</div>
                <div style={{ fontSize: 8, fontWeight: 600, color: p.color }}>{totalPipe > 0 ? Math.round((pipelineCounts[p.key] / totalPipe) * 100) : 0}%</div>
              </div>
            ))}
          </div>
        </div>
        <ExpandBtn label="Espandi con lista commesse \u2193" onClick={() => nav('commesse')} />
      </>);
      case 'scadenze': return w(<>
        <WHead title="Scadenze 15gg" dot={DS.amber} />
        <div style={{ padding: '14px 16px', fontSize: 11, color: DS.dark }}>
          {['Consegne', 'Fatture', 'Montaggi'].map(s => (<div key={s} style={{ marginBottom: 8 }}><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: DS.tealDark, marginBottom: 2 }}>{s} (0)</div><div>Nessuna programmata</div></div>))}
        </div>
        <ExpandBtn label="Espandi scadenze 30gg \u2193" onClick={() => nav('agenda')} />
      </>);
      case 'oggi': return w(<>
        <WHead title="Oggi" dot={DS.blue} />
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ n: 0, l: 'montaggi' }, { n: 3, l: 'compiti' }].map(t => (
            <div key={t.l} onClick={() => nav('team')} style={{ textAlign: 'center', padding: 12, background: DS.light, borderRadius: 9, cursor: 'pointer' }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: DS.dark }}>{t.n}</div>
              <div style={{ fontSize: 9, color: DS.tealDark, marginTop: 2 }}>{t.l}</div>
            </div>
          ))}
        </div>
      </>);
      case 'team': return w(<>
        <WHead title="Team" onAction={() => nav('team')} />
        <div style={{ padding: '10px 16px' }}>
          <div onClick={() => nav('team')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: DS.teal, color: DS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>T</div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: DS.dark }}>Titolare</div><div style={{ fontSize: 9, color: DS.green }}>Online \u2014 3 compiti</div></div>
          </div>
        </div>
        <ExpandBtn label="Espandi team \u2193" onClick={() => nav('team')} />
      </>);
      case 'produzione': return w(<>
        <WHead title="Produzione" badge="0 attive" badgeColor={DS.red} dot={DS.red} onAction={() => nav('distinte')} />
        <RowItem label="In produzione" value={0} onClick={() => nav('distinte')} />
        <RowItem label="In attesa ordini" value={0} onClick={() => nav('ordini')} />
        <RowItem label="Pronte per posa" value={0} onClick={() => nav('montaggi')} />
        <ExpandBtn label="Espandi produzione \u2193" onClick={() => nav('distinte')} />
      </>);
      case 'contabilita': return w(<>
        <WHead title="Contabilita" onAction={() => nav('contabilita')} />
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ l: 'Fatturato', v: '\u20AC0', c: DS.green }, { l: 'Incassato', v: '\u20AC0', c: DS.teal }, { l: 'Spese', v: '\u20AC0', c: DS.red }, { l: 'Margine', v: '\u2014', c: DS.dark }].map(s => (
            <div key={s.l} onClick={() => nav('contabilita')} style={{ padding: 10, background: DS.light, borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: DS.tealDark }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
        </div>
        <ExpandBtn label="Espandi con grafico 6 mesi \u2193" onClick={() => nav('contabilita')} />
      </>);
      case 'pratiche': return w(<>
        <WHead title="Pratiche fiscali" dot={DS.blue} />
        <RowItem label="Ristrutturazione 50%" value={0} onClick={() => nav('enea')} />
        <RowItem label="Ecobonus 65%" value={0} onClick={() => nav('enea')} />
        <RowItem label="Barriere 75%" value={0} onClick={() => nav('enea')} />
        <ExpandBtn label="Espandi pratiche \u2193" onClick={() => nav('enea')} />
      </>);
      default: return null;
    }
  };

  const press = (e) => { e.currentTarget.style.transform = 'translateY(3px)'; };
  const release = (e) => { e.currentTarget.style.transform = 'none'; };

  return (
    <div style={{ padding: 0, width: '100%', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: '18px 22px 14px', background: DS.white, borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: DS.dark }}>{saluto}, {user?.nome || 'FABIO COZZA'}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: DS.tealDark }}>{now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} \u2014 trascina i widget per riordinare</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn3dOutline} onMouseDown={press} onMouseUp={release} onClick={() => nav('task')}>{stats.attive} task</button>
          <button style={btn3d(DS.teal, DS.tealDark)} onMouseDown={press} onMouseUp={release} onClick={() => dispatch?.({ type: 'MODAL', modal: 'nuovaTask' })}>+ Task</button>
          <button style={btn3d(DS.blue, '#2563EB')} onMouseDown={press} onMouseUp={release} onClick={() => dispatch?.({ type: 'MODAL', modal: 'nuovaCommessa' })}>+ Commessa</button>
          <button style={btn3d(DS.dark, '#000')} onMouseDown={press} onMouseUp={release} onClick={() => nav('messaggi')}>Messaggio</button>
        </div>
      </div>
      <div style={{ padding: '14px 22px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          { l: 'Commesse attive', v: stats.attive, c: DS.blue, s: '0 confermate', p: 'commesse' },
          { l: 'Ferme', v: stats.ferme, c: DS.amber, s: 'Soglia 5gg', p: 'commesse' },
          { l: 'Pipeline', v: `\u20AC${(stats.pipeline/1000).toFixed(stats.pipeline>9999?0:1)}k`, c: DS.green, s: '\u20AC0 confermato', p: 'commesse' },
          { l: 'Da incassare', v: `\u20AC${stats.daIncassare.toLocaleString('it-IT')}`, c: DS.red, s: '0 scadute', p: 'fatture' },
          { l: 'Messaggi', v: stats.nonLetti, c: DS.teal, s: `${messaggi?.length||0} totali`, p: 'messaggi' },
          { l: 'Compiti', v: 3, c: DS.dark, s: '1 urgente', p: 'team' },
        ].map((s, i) => (
          <div key={i} onClick={() => nav(s.p)} style={{
            flex: 1, minWidth: 120, padding: '14px 16px', background: DS.white, borderRadius: 12,
            border: `1px solid ${DS.border}`, cursor: 'pointer',
            boxShadow: `0 4px 0 ${DS.border}, 0 5px 10px rgba(0,0,0,0.05)`,
            transition: 'border-color 0.15s, transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = DS.teal; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: DS.tealDark, marginBottom: 5 }}>{s.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 9, color: DS.tealDark, marginTop: 3 }}>{s.s}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '0 22px 22px', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {widgetOrder.map(id => renderWidget(id))}
      </div>
    </div>
  );
}
