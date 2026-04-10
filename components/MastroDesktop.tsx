'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// MASTRO DESKTOP — fliwoX Design System
// Sessione 5: Sidebar riorg + Tipologie SVG + Configuratore
// ═══════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Design System fliwoX (immutabile) ──
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

// ── SVG Icons (mastro-constants style) ──
const Icons = {
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="4" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="8" width="7" height="10" rx="1.5" />
    </svg>
  ),
  commesse: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 5h14M3 10h14M3 15h8" />
      <circle cx="15" cy="15" r="3" />
    </svg>
  ),
  messaggi: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h12a2 2 0 012 2v6a2 2 0 01-2 2H8l-4 3v-3a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  ),
  agenda: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M7 2v4M13 2v4M3 9h14" />
    </svg>
  ),
  distinte: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3h12v14H4z" />
      <path d="M7 7h6M7 10h6M7 13h4" />
    </svg>
  ),
  cnc: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="16" height="10" rx="2" />
      <circle cx="7" cy="11" r="2" />
      <path d="M11 9h4M11 13h4" />
    </svg>
  ),
  team: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="3" />
      <circle cx="14" cy="8" r="2.5" />
      <path d="M2 17c0-3 2.5-5 5-5s5 2 5 5M11 17c0-2.5 1.5-4 3-4s3 1.5 3 4" />
    </svg>
  ),
  ordini: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3h2l2 10h8l2-6H7" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="14" cy="16" r="1.5" />
    </svg>
  ),
  clienti: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7" r="4" />
      <path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  ),
  contabilita: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 6v8l8 4 8-4V6l-8-4z" />
      <path d="M4 6l8 4M12 10v8M12 10l8-4" />
    </svg>
  ),
  fatture: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 2h10a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M8 6h4M8 9h4M8 12h2" />
      <path d="M12 14l1.5 1.5L16 13" stroke={DS.green} />
    </svg>
  ),
  analytics: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17V10M7 17V7M11 17V12M15 17V5" />
    </svg>
  ),
  profili: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M7 3v14" />
    </svg>
  ),
  listini: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2v16M6 6l4-4 4 4M6 14l4 4 4-4" />
    </svg>
  ),
  archivio: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3h14v4H3zM4 7v10h12V7" />
      <path d="M8 11h4" />
    </svg>
  ),
  enea: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </svg>
  ),
  trova: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" />
    </svg>
  ),
  rete: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="4" r="2" />
      <circle cx="4" cy="14" r="2" />
      <circle cx="16" cy="14" r="2" />
      <path d="M10 6v4M7 12l-1.5 1M13 12l1.5 1" />
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
    </svg>
  ),
  misure: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17L17 3M5 15l2-2M8 12l2-2M11 9l2-2M14 6l2-2" />
    </svg>
  ),
  infissiora: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 10h14M10 3v14" />
    </svg>
  ),
  portale: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="12" rx="2" />
      <path d="M6 18h8M10 15v3" />
    </svg>
  ),
  trasporti: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 11h12V5H2zM14 11h3l2 3v3h-5" />
      <circle cx="6" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.2 4.2l2.1 2.1M13.7 13.7l2.1 2.1M4.2 15.8l2.1-2.1M13.7 6.3l2.1-2.1" />
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6l4 4 4-4" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4l4 4-4 4" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  config: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <path d="M14 11v6M11 14h6" />
    </svg>
  ),
};

// ── Sidebar structure (riorganizzata S5) ──
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: number;
  disabled?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: 'LAVORO QUOTIDIANO',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
      { id: 'commesse', label: 'Commesse', icon: Icons.commesse },
      { id: 'messaggi', label: 'Messaggi', icon: Icons.messaggi },
      { id: 'agenda', label: 'Agenda', icon: Icons.agenda },
      { id: 'distinte', label: 'Distinte taglio', icon: Icons.distinte },
      { id: 'cnc', label: 'CNC / Macchine', icon: Icons.cnc, subtitle: 'Emmegi CENTRO 2' },
      { id: 'ordini', label: 'Ordini fornitori', icon: Icons.ordini },
    ],
  },
  {
    title: 'GESTIONE TEAM',
    items: [
      { id: 'team', label: 'Squadre e operatori', icon: Icons.team },
      { id: 'montaggi', label: 'Montaggi', icon: Icons.misure },
      { id: 'misure', label: 'Rilievi e misure', icon: Icons.misure },
    ],
  },
  {
    title: 'AMMINISTRAZIONE',
    items: [
      { id: 'clienti', label: 'Clienti', icon: Icons.clienti },
      { id: 'contabilita', label: 'Contabilita', icon: Icons.contabilita },
      { id: 'fatture', label: 'Fatture SDI', icon: Icons.fatture },
      { id: 'analytics', label: 'Analytics', icon: Icons.analytics },
    ],
  },
  {
    title: 'CONFIGURAZIONE',
    items: [
      { id: 'settings', label: 'Profili e Tipologie', icon: Icons.profili },
      { id: 'configuratore', label: 'Configuratore', icon: Icons.config },
      { id: 'listini', label: 'Listini', icon: Icons.listini },
      { id: 'archivio', label: 'Archivi tecnici', icon: Icons.archivio, subtitle: 'Nodi - Vetri - Colori' },
    ],
  },
  {
    title: 'EXTRA',
    items: [
      { id: 'enea', label: 'ENEA / CAM', icon: Icons.enea },
      { id: 'trovaClienti', label: 'Trova Clienti', icon: Icons.trova },
      { id: 'rete', label: 'RETE Agenti', icon: Icons.rete },
      { id: 'aiAgente', label: 'AI Agente', icon: Icons.ai },
    ],
  },
  {
    title: 'ROADMAP',
    items: [
      { id: 'infissiora', label: 'InfissiOra', icon: Icons.infissiora, subtitle: 'Marketplace B2C', disabled: true },
      { id: 'portale', label: 'Portale Cliente', icon: Icons.portale, subtitle: 'In roadmap', disabled: true },
      { id: 'trasporti', label: 'Trasporti', icon: Icons.trasporti, subtitle: 'F5 - 2027', disabled: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// TIPOLOGIE SVG — Disegni tecnici quotati
// ═══════════════════════════════════════════════════════════

type TipologiaCode = '1A' | '2A' | '2A_RIB' | '1A_VASISTAS' | 'PORTA_1A' | 'SCORR_2A' | 'FISSO' | 'ANTA_ANTA' | 'BILICO' | '3A';

interface Tipologia {
  code: TipologiaCode;
  name: string;
  desc: string;
  ante: number;
  hasFisso?: boolean;
}

const TIPOLOGIE: Tipologia[] = [
  { code: '1A', name: 'Finestra 1 anta', desc: 'Battente singola', ante: 1 },
  { code: '2A', name: 'Finestra 2 ante', desc: 'Battente doppia', ante: 2 },
  { code: '2A_RIB', name: '2 ante ribalta', desc: 'Doppia anta ribalta', ante: 2 },
  { code: '1A_VASISTAS', name: 'Vasistas', desc: 'Apertura a bilico sup.', ante: 1 },
  { code: 'PORTA_1A', name: 'Portafinestra 1 anta', desc: 'Battente singola alta', ante: 1 },
  { code: 'SCORR_2A', name: 'Scorrevole 2 ante', desc: 'Traslante parallela', ante: 2 },
  { code: 'FISSO', name: 'Fisso', desc: 'Vetro fisso non apribile', ante: 0, hasFisso: true },
  { code: 'ANTA_ANTA', name: 'Anta + anta', desc: 'Due ante con traverso', ante: 2 },
  { code: 'BILICO', name: 'Bilico verticale', desc: 'Rotazione asse verticale', ante: 1 },
  { code: '3A', name: 'Finestra 3 ante', desc: 'Tre ante battenti', ante: 3 },
];

// ── SVG renderer per ogni tipologia ──
function TipologiaSVG({ code, w = 160, h = 180, showQuote = false, larghezza, altezza }: {
  code: TipologiaCode;
  w?: number;
  h?: number;
  showQuote?: boolean;
  larghezza?: number;
  altezza?: number;
}) {
  const pad = showQuote ? 30 : 8;
  const fw = w - pad * 2;
  const fh = h - pad * 2;
  const x0 = pad;
  const y0 = pad;

  const frame = (
    <rect x={x0} y={y0} width={fw} height={fh} fill="none" stroke={DS.dark} strokeWidth="2.5" />
  );

  const quote = showQuote && larghezza && altezza ? (
    <g fontSize="10" fill={DS.tealDark} fontFamily="JetBrains Mono, monospace">
      {/* quota orizzontale */}
      <line x1={x0} y1={h - 8} x2={x0 + fw} y2={h - 8} stroke={DS.tealDark} strokeWidth="0.8" markerStart="url(#arrowL)" markerEnd="url(#arrowR)" />
      <text x={w / 2} y={h - 1} textAnchor="middle">{larghezza}</text>
      {/* quota verticale */}
      <line x1={8} y1={y0} x2={8} y2={y0 + fh} stroke={DS.tealDark} strokeWidth="0.8" markerStart="url(#arrowU)" markerEnd="url(#arrowD)" />
      <text x={4} y={h / 2} textAnchor="middle" transform={`rotate(-90,4,${h / 2})`}>{altezza}</text>
    </g>
  ) : null;

  const defs = (
    <defs>
      <marker id="arrowL" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto">
        <path d="M6,0 L0,3 L6,6" fill="none" stroke={DS.tealDark} strokeWidth="0.8" />
      </marker>
      <marker id="arrowR" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
        <path d="M0,0 L6,3 L0,6" fill="none" stroke={DS.tealDark} strokeWidth="0.8" />
      </marker>
      <marker id="arrowU" markerWidth="6" markerHeight="6" refX="3" refY="0" orient="auto">
        <path d="M0,6 L3,0 L6,6" fill="none" stroke={DS.tealDark} strokeWidth="0.8" />
      </marker>
      <marker id="arrowD" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
        <path d="M0,0 L3,6 L6,0" fill="none" stroke={DS.tealDark} strokeWidth="0.8" />
      </marker>
    </defs>
  );

  // Cerniere (palline piccole)
  const hinge = (hx: number, hy: number) => (
    <circle cx={hx} cy={hy} r="3" fill={DS.dark} />
  );

  // Freccia apertura anta
  const openArc = (ax: number, ay: number, toRight: boolean, arcH: number) => {
    const dir = toRight ? 1 : -1;
    const endX = ax + dir * arcH * 0.6;
    return (
      <path
        d={`M${ax},${ay} Q${ax + dir * arcH * 0.3},${ay - arcH * 0.4} ${endX},${ay - arcH * 0.15}`}
        fill="none" stroke={DS.teal} strokeWidth="1" strokeDasharray="4,3"
      />
    );
  };

  // Diagonale anta (da maniglia a cerniera opposta)
  const diagonal = (dx1: number, dy1: number, dx2: number, dy2: number) => (
    <line x1={dx1} y1={dy1} x2={dx2} y2={dy2} stroke={DS.dark} strokeWidth="0.8" />
  );

  // Maniglia
  const handle = (hx: number, hy: number) => (
    <rect x={hx - 2} y={hy - 8} width="4" height="16" rx="1.5" fill={DS.tealDark} />
  );

  let inner: React.ReactNode = null;

  switch (code) {
    case '1A': {
      // 1 anta battente sx: cerniere a sx, diagonale, maniglia dx
      const margin = 4;
      inner = (
        <g>
          <rect x={x0 + margin} y={y0 + margin} width={fw - margin * 2} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + margin, y0 + fh * 0.25)}
          {hinge(x0 + margin, y0 + fh * 0.75)}
          {diagonal(x0 + margin, y0 + margin, x0 + fw - margin, y0 + fh / 2)}
          {diagonal(x0 + margin, y0 + fh - margin, x0 + fw - margin, y0 + fh / 2)}
          {handle(x0 + fw - margin - 8, y0 + fh / 2)}
          {openArc(x0 + fw - margin, y0 + fh, true, fw * 0.5)}
        </g>
      );
      break;
    }
    case '2A': {
      const margin = 4;
      const halfW = (fw - margin * 2) / 2;
      const cx = x0 + fw / 2;
      inner = (
        <g>
          {/* anta sx */}
          <rect x={x0 + margin} y={y0 + margin} width={halfW} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + margin, y0 + fh * 0.25)}
          {hinge(x0 + margin, y0 + fh * 0.75)}
          {diagonal(x0 + margin, y0 + margin, cx, y0 + fh / 2)}
          {diagonal(x0 + margin, y0 + fh - margin, cx, y0 + fh / 2)}
          {handle(cx - 8, y0 + fh / 2)}
          {/* anta dx */}
          <rect x={cx} y={y0 + margin} width={halfW} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + fw - margin, y0 + fh * 0.25)}
          {hinge(x0 + fw - margin, y0 + fh * 0.75)}
          {diagonal(x0 + fw - margin, y0 + margin, cx, y0 + fh / 2)}
          {diagonal(x0 + fw - margin, y0 + fh - margin, cx, y0 + fh / 2)}
          {handle(cx + 4, y0 + fh / 2)}
        </g>
      );
      break;
    }
    case '2A_RIB': {
      const margin = 4;
      const halfW = (fw - margin * 2) / 2;
      const cx = x0 + fw / 2;
      inner = (
        <g>
          {/* anta sx con ribalta */}
          <rect x={x0 + margin} y={y0 + margin} width={halfW} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + margin, y0 + fh * 0.25)}
          {hinge(x0 + margin, y0 + fh * 0.75)}
          {diagonal(x0 + margin, y0 + margin, cx, y0 + fh / 2)}
          {diagonal(x0 + margin, y0 + fh - margin, cx, y0 + fh / 2)}
          {/* freccia ribalta in alto */}
          <path d={`M${x0 + margin + halfW * 0.3},${y0 + margin} L${x0 + margin + halfW / 2},${y0 + margin + fh * 0.15} L${x0 + margin + halfW * 0.7},${y0 + margin}`}
            fill="none" stroke={DS.teal} strokeWidth="1" strokeDasharray="3,2" />
          {handle(cx - 8, y0 + fh / 2)}
          {/* anta dx */}
          <rect x={cx} y={y0 + margin} width={halfW} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + fw - margin, y0 + fh * 0.25)}
          {hinge(x0 + fw - margin, y0 + fh * 0.75)}
          {diagonal(x0 + fw - margin, y0 + margin, cx, y0 + fh / 2)}
          {diagonal(x0 + fw - margin, y0 + fh - margin, cx, y0 + fh / 2)}
          {handle(cx + 4, y0 + fh / 2)}
        </g>
      );
      break;
    }
    case '1A_VASISTAS': {
      const margin = 4;
      inner = (
        <g>
          <rect x={x0 + margin} y={y0 + margin} width={fw - margin * 2} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {/* cerniere in alto */}
          {hinge(x0 + fw * 0.25, y0 + margin)}
          {hinge(x0 + fw * 0.75, y0 + margin)}
          {/* diagonali da alto */}
          {diagonal(x0 + margin, y0 + margin, x0 + fw / 2, y0 + fh - margin)}
          {diagonal(x0 + fw - margin, y0 + margin, x0 + fw / 2, y0 + fh - margin)}
          {handle(x0 + fw / 2, y0 + fh - margin - 10)}
        </g>
      );
      break;
    }
    case 'PORTA_1A': {
      const margin = 4;
      inner = (
        <g>
          <rect x={x0 + margin} y={y0 + margin} width={fw - margin * 2} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {/* soglia */}
          <rect x={x0} y={y0 + fh - 3} width={fw} height="6" fill={DS.tealDark} opacity="0.3" />
          {hinge(x0 + margin, y0 + fh * 0.2)}
          {hinge(x0 + margin, y0 + fh * 0.5)}
          {hinge(x0 + margin, y0 + fh * 0.8)}
          {diagonal(x0 + margin, y0 + margin, x0 + fw - margin, y0 + fh / 2)}
          {diagonal(x0 + margin, y0 + fh - margin, x0 + fw - margin, y0 + fh / 2)}
          {handle(x0 + fw - margin - 8, y0 + fh * 0.45)}
        </g>
      );
      break;
    }
    case 'SCORR_2A': {
      const margin = 4;
      const halfW = (fw - margin * 2) / 2;
      const cx = x0 + fw / 2;
      inner = (
        <g>
          {/* binario superiore */}
          <line x1={x0 + margin} y1={y0 + margin + 4} x2={x0 + fw - margin} y2={y0 + margin + 4} stroke={DS.dark} strokeWidth="1.5" />
          {/* anta fissa sx */}
          <rect x={x0 + margin} y={y0 + margin + 6} width={halfW + 8} height={fh - margin * 2 - 6} fill="none" stroke={DS.dark} strokeWidth="1" />
          {/* anta scorrevole dx */}
          <rect x={cx - 8} y={y0 + margin + 6} width={halfW + 8} height={fh - margin * 2 - 6} fill="none" stroke={DS.dark} strokeWidth="1" strokeDasharray="6,3" />
          {/* frecce scorrevole */}
          <path d={`M${cx + halfW * 0.2},${y0 + fh / 2} L${cx - halfW * 0.2},${y0 + fh / 2}`} stroke={DS.teal} strokeWidth="1.5" markerEnd="url(#arrowL)" />
          <path d={`M${cx - halfW * 0.2},${y0 + fh / 2 + 10} L${cx + halfW * 0.2},${y0 + fh / 2 + 10}`} stroke={DS.teal} strokeWidth="1.5" markerEnd="url(#arrowR)" />
          {handle(x0 + fw - margin - 8, y0 + fh / 2)}
          {/* binario inferiore */}
          <line x1={x0 + margin} y1={y0 + fh - margin} x2={x0 + fw - margin} y2={y0 + fh - margin} stroke={DS.dark} strokeWidth="1.5" />
        </g>
      );
      break;
    }
    case 'FISSO': {
      const margin = 4;
      inner = (
        <g>
          <rect x={x0 + margin} y={y0 + margin} width={fw - margin * 2} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {/* croce = fisso */}
          <line x1={x0 + margin} y1={y0 + margin} x2={x0 + fw - margin} y2={y0 + fh - margin} stroke={DS.dark} strokeWidth="0.6" />
          <line x1={x0 + fw - margin} y1={y0 + margin} x2={x0 + margin} y2={y0 + fh - margin} stroke={DS.dark} strokeWidth="0.6" />
        </g>
      );
      break;
    }
    case 'ANTA_ANTA': {
      const margin = 4;
      const halfH = (fh - margin * 2) / 2;
      const cy = y0 + fh / 2;
      inner = (
        <g>
          {/* traverso centrale */}
          <line x1={x0 + margin} y1={cy} x2={x0 + fw - margin} y2={cy} stroke={DS.dark} strokeWidth="2" />
          {/* anta sup */}
          <rect x={x0 + margin} y={y0 + margin} width={fw - margin * 2} height={halfH} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + margin, y0 + margin + halfH * 0.3)}
          {hinge(x0 + margin, y0 + margin + halfH * 0.7)}
          {diagonal(x0 + margin, y0 + margin, x0 + fw - margin, y0 + margin + halfH / 2)}
          {diagonal(x0 + margin, cy, x0 + fw - margin, y0 + margin + halfH / 2)}
          {handle(x0 + fw - margin - 8, y0 + margin + halfH / 2)}
          {/* anta inf */}
          <rect x={x0 + margin} y={cy} width={fw - margin * 2} height={halfH} fill="none" stroke={DS.dark} strokeWidth="1" />
          {hinge(x0 + margin, cy + halfH * 0.3)}
          {hinge(x0 + margin, cy + halfH * 0.7)}
          {diagonal(x0 + margin, cy, x0 + fw - margin, cy + halfH / 2)}
          {diagonal(x0 + margin, y0 + fh - margin, x0 + fw - margin, cy + halfH / 2)}
          {handle(x0 + fw - margin - 8, cy + halfH / 2)}
        </g>
      );
      break;
    }
    case 'BILICO': {
      const margin = 4;
      inner = (
        <g>
          <rect x={x0 + margin} y={y0 + margin} width={fw - margin * 2} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
          {/* perni centrali */}
          {hinge(x0 + margin, y0 + fh / 2)}
          {hinge(x0 + fw - margin, y0 + fh / 2)}
          {/* linea perno */}
          <line x1={x0 + margin} y1={y0 + fh / 2} x2={x0 + fw - margin} y2={y0 + fh / 2} stroke={DS.dark} strokeWidth="0.5" strokeDasharray="3,3" />
          {/* archi rotazione */}
          <path d={`M${x0 + fw / 2},${y0 + margin} A${fw * 0.3},${fh * 0.3} 0 0,1 ${x0 + fw - margin - 5},${y0 + fh / 2}`} fill="none" stroke={DS.teal} strokeWidth="1" strokeDasharray="4,3" />
          {handle(x0 + fw / 2, y0 + margin + 12)}
        </g>
      );
      break;
    }
    case '3A': {
      const margin = 4;
      const thirdW = (fw - margin * 2) / 3;
      inner = (
        <g>
          {[0, 1, 2].map(i => {
            const ax = x0 + margin + thirdW * i;
            const isLeft = i === 0 || i === 2;
            const hingeX = i === 1 ? ax + thirdW : ax;
            return (
              <g key={i}>
                <rect x={ax} y={y0 + margin} width={thirdW} height={fh - margin * 2} fill="none" stroke={DS.dark} strokeWidth="1" />
                {hinge(hingeX, y0 + fh * 0.3)}
                {hinge(hingeX, y0 + fh * 0.7)}
                {diagonal(hingeX, y0 + margin, ax + thirdW / 2, y0 + fh / 2)}
                {diagonal(hingeX, y0 + fh - margin, ax + thirdW / 2, y0 + fh / 2)}
                {handle(i === 1 ? ax + 4 : ax + thirdW - 6, y0 + fh / 2)}
              </g>
            );
          })}
        </g>
      );
      break;
    }
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} xmlns="http://www.w3.org/2000/svg">
      {defs}
      {frame}
      {inner}
      {quote}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════
// CONFIGURATORE TIPOLOGIE
// ═══════════════════════════════════════════════════════════

interface Profilo {
  id: string;
  nome: string;
  serie: string;
  materiale: string;
  battuta: number;
  aria: number;
  frontale: number;
  sede_fv: number;
}

function ConfiguratorePanel({ onBack }: { onBack: () => void }) {
  const [tipologia, setTipologia] = useState<TipologiaCode | null>(null);
  const [profili, setProfili] = useState<Profilo[]>([]);
  const [profiloId, setProfiloId] = useState('');
  const [larghezza, setLarghezza] = useState(1200);
  const [altezza, setAltezza] = useState(1400);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('archivio_profili').select('id,nome,serie,materiale,battuta,aria,frontale,sede_fv').order('serie');
      if (data) setProfili(data);
      setLoading(false);
    })();
  }, []);

  const profiloSel = useMemo(() => profili.find(p => p.id === profiloId), [profili, profiloId]);

  // Calcolo distinta taglio
  const distinta = useMemo(() => {
    if (!tipologia || !profiloSel) return null;
    const tip = TIPOLOGIE.find(t => t.code === tipologia);
    if (!tip) return null;

    // Delta formule (CX600 / PVC generico)
    const isPVC = profiloSel.materiale === 'PVC';
    const deltaTelaio = isPVC ? 84 : 44;
    const deltaAnta = isPVC ? 84 : 44;

    const telW = larghezza - deltaTelaio;
    const telH = altezza - deltaTelaio;

    const antaW = tip.ante > 0 ? Math.round((larghezza / Math.max(tip.ante, 1)) - deltaAnta) : 0;
    const antaH = altezza - deltaAnta;

    const items = [];
    // Telaio
    items.push({ pezzo: 'Traverso superiore telaio', qty: 1, lung: telW, profilo: profiloSel.nome });
    items.push({ pezzo: 'Traverso inferiore telaio', qty: 1, lung: telW, profilo: profiloSel.nome });
    items.push({ pezzo: 'Montante telaio', qty: 2, lung: telH, profilo: profiloSel.nome });

    // Ante
    if (tip.ante > 0) {
      for (let i = 0; i < tip.ante; i++) {
        items.push({ pezzo: `Traverso anta ${i + 1}`, qty: 2, lung: antaW, profilo: profiloSel.nome });
        items.push({ pezzo: `Montante anta ${i + 1}`, qty: 2, lung: antaH, profilo: profiloSel.nome });
      }
    }

    // Vetro
    const vetroW = antaW > 0 ? antaW - profiloSel.sede_fv * 2 : telW - profiloSel.sede_fv * 2;
    const vetroH = (antaH > 0 ? antaH : telH) - profiloSel.sede_fv * 2;
    const vetroQty = Math.max(tip.ante, 1);
    items.push({ pezzo: 'Vetro camera', qty: vetroQty, lung: vetroW, profilo: `${vetroW} x ${vetroH}` });

    return { items, vetroW, vetroH, telW, telH, antaW, antaH };
  }, [tipologia, profiloSel, larghezza, altezza]);

  if (loading) return <div style={{ padding: 32, color: DS.ink }}>Caricamento profili...</div>;

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: `1px solid ${DS.border}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.teal, fontSize: 14, fontWeight: 600 }}>
          Indietro
        </button>
        <h2 style={{ margin: 0, fontSize: 18, color: DS.ink }}>Configuratore Tipologie</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 0, minHeight: 'calc(100vh - 120px)' }}>
        {/* Colonna sx: selezione */}
        <div style={{ borderRight: `1px solid ${DS.border}`, padding: 20, overflowY: 'auto' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: DS.tealDark, textTransform: 'uppercase', letterSpacing: 1 }}>Tipologia</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 8 }}>
            {TIPOLOGIE.map(t => (
              <button
                key={t.code}
                onClick={() => setTipologia(t.code)}
                style={{
                  padding: 8,
                  border: `2px solid ${tipologia === t.code ? DS.teal : DS.border}`,
                  borderRadius: 8,
                  background: tipologia === t.code ? DS.light : DS.white,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <TipologiaSVG code={t.code} w={80} h={90} />
                <div style={{ fontSize: 10, fontWeight: 600, color: DS.ink, marginTop: 4 }}>{t.name}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: DS.tealDark, textTransform: 'uppercase', letterSpacing: 1 }}>Profilo</label>
            <select
              value={profiloId}
              onChange={e => setProfiloId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', marginTop: 6, border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 13, background: DS.white }}
            >
              <option value="">-- Seleziona profilo --</option>
              {profili.map(p => (
                <option key={p.id} value={p.id}>{p.serie} - {p.nome} ({p.materiale})</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: DS.tealDark }}>Larghezza (mm)</label>
              <input type="number" value={larghezza} onChange={e => setLarghezza(+e.target.value)}
                style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: DS.tealDark }}>Altezza (mm)</label>
              <input type="number" value={altezza} onChange={e => setAltezza(+e.target.value)}
                style={{ width: '100%', padding: '6px 10px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }} />
            </div>
          </div>

          {profiloSel && (
            <div style={{ marginTop: 16, padding: 12, background: DS.light, borderRadius: 8, border: `1px solid ${DS.border}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: DS.tealDark, marginBottom: 6 }}>SEZIONE PROFILO</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: DS.ink }}>
                <span>Battuta: {profiloSel.battuta}mm</span>
                <span>Aria: {profiloSel.aria}mm</span>
                <span>Frontale: {profiloSel.frontale}mm</span>
                <span>Sede FV: {profiloSel.sede_fv}mm</span>
              </div>
            </div>
          )}
        </div>

        {/* Colonna dx: anteprima + distinta */}
        <div style={{ padding: 24, background: DS.white }}>
          {tipologia ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', background: '#FAFFFE', borderRadius: 12, border: `1px solid ${DS.border}`, marginBottom: 20 }}>
                <TipologiaSVG code={tipologia} w={280} h={320} showQuote larghezza={larghezza} altezza={altezza} />
              </div>

              {distinta && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: DS.ink, marginBottom: 12 }}>DISTINTA DI TAGLIO</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: DS.dark, color: DS.white }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Pezzo</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Lunghezza</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>Profilo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distinta.items.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${DS.border}`, background: i % 2 === 0 ? DS.white : DS.light }}>
                          <td style={{ padding: '8px 12px' }}>{item.pezzo}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>{item.qty}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: DS.teal }}>{item.lung} mm</td>
                          <td style={{ padding: '8px 12px', fontSize: 11, color: DS.tealDark }}>{item.profilo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: DS.tealDark, fontSize: 14 }}>
              Seleziona una tipologia per iniziare
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// DASHBOARD PANEL — Full-width, no margins
// ═══════════════════════════════════════════════════════════

function DashboardPanel() {
  const [stats, setStats] = useState({ commesse: 0, attive: 0, valore: 0, montaggi: 0, scadenze: 0 });
  const [recentCommesse, setRecentCommesse] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: comm } = await supabase.from('commesse').select('id,nome_cliente,indirizzo,stato,valore_totale,created_at').order('created_at', { ascending: false }).limit(8);
      if (comm) {
        setRecentCommesse(comm);
        const attive = comm.filter(c => !['FATTURA', 'PAGATA'].includes(c.stato));
        const totVal = comm.reduce((s: number, c: any) => s + (c.valore_totale || 0), 0);
        setStats({
          commesse: comm.length,
          attive: attive.length,
          valore: totVal,
          montaggi: 0,
          scadenze: 0,
        });
      }
    })();
  }, []);

  const statCards = [
    { label: 'Commesse totali', value: stats.commesse, color: DS.teal, icon: Icons.commesse },
    { label: 'In lavorazione', value: stats.attive, color: DS.amber, icon: Icons.distinte },
    { label: 'Valore totale', value: `${(stats.valore / 1000).toFixed(1)}k`, color: DS.green, icon: Icons.contabilita },
    { label: 'Montaggi mese', value: stats.montaggi, color: DS.blue, icon: Icons.team },
  ];

  const statiLabel: Record<string, { color: string; bg: string }> = {
    RILIEVO: { color: DS.blue, bg: '#EBF5FF' },
    PREVENTIVO: { color: DS.amber, bg: '#FFF8E1' },
    'CONFERMA ORDINE': { color: DS.teal, bg: DS.light },
    'ORDINE CONFERMATO': { color: DS.tealDark, bg: DS.bg },
    FATTURA: { color: DS.green, bg: '#E8F5E9' },
    PAGATA: { color: DS.green, bg: '#C8E6C9' },
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            padding: '20px 24px',
            background: DS.white,
            borderRadius: 12,
            border: `1px solid ${DS.border}`,
            boxShadow: `0 2px 8px ${DS.border}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: DS.tealDark, fontWeight: 500, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
              </div>
              <div style={{ opacity: 0.3, color: s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Two columns: commesse recenti + azioni rapide */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Commesse recenti */}
        <div style={{ background: DS.white, borderRadius: 12, border: `1px solid ${DS.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: DS.ink }}>Commesse recenti</span>
            <span style={{ fontSize: 12, color: DS.teal, cursor: 'pointer' }}>Vedi tutte</span>
          </div>
          {recentCommesse.map((c, i) => {
            const st = statiLabel[c.stato] || { color: DS.ink, bg: DS.light };
            return (
              <div key={c.id} style={{
                padding: '12px 20px',
                borderBottom: i < recentCommesse.length - 1 ? `1px solid ${DS.border}` : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = DS.light)}
                onMouseLeave={e => (e.currentTarget.style.background = DS.white)}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DS.ink }}>{c.nome_cliente}</div>
                  <div style={{ fontSize: 11, color: DS.tealDark }}>{c.indirizzo || 'Nessun indirizzo'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {c.valore_totale > 0 && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: DS.ink, fontFamily: 'JetBrains Mono, monospace' }}>
                      {c.valore_totale.toLocaleString('it-IT')}
                    </span>
                  )}
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    color: st.color,
                    background: st.bg,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {c.stato}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Azioni rapide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Nuova commessa', icon: Icons.plus, action: 'commesse' },
            { label: 'Configuratore', icon: Icons.config, action: 'configuratore' },
            { label: 'Distinta taglio', icon: Icons.distinte, action: 'distinte' },
          ].map((a, i) => (
            <button key={i} style={{
              padding: '16px 20px',
              background: DS.white,
              border: `1px solid ${DS.border}`,
              borderRadius: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.15s',
              boxShadow: `0 2px 6px ${DS.border}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = DS.light; e.currentTarget.style.borderColor = DS.teal; }}
              onMouseLeave={e => { e.currentTarget.style.background = DS.white; e.currentTarget.style.borderColor = DS.border; }}
            >
              <span style={{ color: DS.teal }}>{a.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: DS.ink }}>{a.label}</span>
            </button>
          ))}

          {/* Tipologie preview */}
          <div style={{ background: DS.white, borderRadius: 10, border: `1px solid ${DS.border}`, padding: 16, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: DS.tealDark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Tipologie disponibili</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {TIPOLOGIE.slice(0, 6).map(t => (
                <div key={t.code} style={{ textAlign: 'center', padding: 4 }}>
                  <TipologiaSVG code={t.code} w={52} h={58} />
                  <div style={{ fontSize: 8, color: DS.tealDark, marginTop: 2 }}>{t.code}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER PANELS
// ═══════════════════════════════════════════════════════════

function PlaceholderPanel({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: DS.tealDark, gap: 12 }}>
      <div style={{ opacity: 0.3, transform: 'scale(2)' }}>{icon}</div>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 12, opacity: 0.5 }}>In arrivo</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MASTRO DESKTOP — Main Layout
// ═══════════════════════════════════════════════════════════

// Inline wrapper per SettingsPanel (evita circular import)
function SettingsPanelInline({ onNavigate }: { onNavigate: (p: string) => void }) {
  // Lazy import
  const [SP, setSP] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    import('./SettingsPanel').then(mod => setSP(() => mod.default));
  }, []);
  if (!SP) return <div style={{ padding: 32, color: DS.tealDark }}>Caricamento impostazioni...</div>;
  return <SP onNavigate={onNavigate} />;
}

export default function MastroDesktop() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarW = sidebarCollapsed ? 68 : 280;

  // Panel router
  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard': return <DashboardPanel />;
      case 'configuratore': return <ConfiguratorePanel onBack={() => setActivePanel('settings')} />;
      case 'settings': return <SettingsPanelInline onNavigate={setActivePanel} />;
      default: {
        const allItems = SIDEBAR_GROUPS.flatMap(g => g.items);
        const item = allItems.find(i => i.id === activePanel);
        return <PlaceholderPanel title={item?.label || activePanel} icon={item?.icon || Icons.dashboard} />;
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: DS.dark,
        color: DS.white,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Logo fliwoX + Toggle */}
        <div style={{ padding: '18px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}>
            {/* fliwoX icon — exact brand SVG */}
            <svg width="34" height="34" viewBox="0 0 200 200" fill="none">
              <g transform="rotate(8 100 100)">
                <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
                <path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
                <path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
              </g>
            </svg>
            {!sidebarCollapsed && (
              <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>
                <span style={{ color: DS.white }}>fliwo</span>
                <span style={{ color: DS.teal }}>X</span>
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = DS.teal; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none'; }}
              title="Chiudi menu"
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 4l-8 6 8 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '6px 0' }}>
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              {!sidebarCollapsed && (
                <div style={{
                  padding: '18px 22px 6px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: DS.teal,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item, idx) => {
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && setActivePanel(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      width: sidebarCollapsed ? '100%' : 'calc(100% - 16px)',
                      margin: sidebarCollapsed ? '2px 0' : '3px 8px',
                      padding: sidebarCollapsed ? '16px 0' : '15px 18px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      background: isActive ? 'rgba(40,160,160,0.2)' : 'rgba(255,255,255,0.03)',
                      border: 'none',
                      borderLeft: isActive ? `4px solid ${DS.teal}` : '4px solid transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: item.disabled ? 'rgba(255,255,255,0.25)' : isActive ? DS.teal : 'rgba(255,255,255,0.8)',
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      fontSize: 15,
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.12s',
                      fontFamily: "'Inter', sans-serif",
                      textAlign: 'left',
                      borderRadius: sidebarCollapsed ? 0 : 10,
                      minHeight: 48,
                    }}
                    onMouseEnter={e => { if (!item.disabled && !isActive) { e.currentTarget.style.background = 'rgba(40,160,160,0.12)'; e.currentTarget.style.color = DS.teal; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = item.disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)'; } }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                        {item.subtitle && (
                          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1 }}>{item.subtitle}</div>
                        )}
                      </div>
                    )}
                    {!sidebarCollapsed && item.badge && item.badge > 0 && (
                      <span style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        background: DS.red,
                        color: DS.white,
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: DS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>F</div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>FABIO COZZA</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Piano START</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
              title="Comprimi sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3l-6 6 6 6" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: DS.bg,
        overflow: 'hidden',
      }}>
        {/* Topbar */}
        <header style={{
          height: 52,
          minHeight: 52,
          background: DS.white,
          borderBottom: `1px solid ${DS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.tealDark, padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = DS.light; e.currentTarget.style.color = DS.teal; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = DS.tealDark; }}
                title="Apri menu"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M4 6h14M4 11h14M4 16h14" />
                </svg>
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DS.ink, textTransform: 'capitalize' }}>
              {SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === activePanel)?.label || activePanel}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: DS.tealDark }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Content area — full width, no padding (panels handle their own) */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}
