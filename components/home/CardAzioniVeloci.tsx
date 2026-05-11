"use client";
// components/home/CardAzioniVeloci.tsx
// Bottoni grandi per aprire moduli rapidamente dalla home

import React from "react";

interface Props {
  onMagazzino?: () => void;
  onMontaggi?: () => void;
  onProduzione?: () => void;
  onMateriali?: () => void;
  onClienti?: () => void;
  onPianificazione?: () => void;
  onAgenda?: () => void;
  onTeam?: () => void;
}

const NAVY = "#1E3A5F";
const TEAL = "#28A0A0";
const TEXT = "#0F1F33";
const MUTED = "#5C6B7A";

export default function CardAzioniVeloci(props: Props) {
  const actions = [
    { key: 'produzione',     icon: 'tool',       label: 'Produzione',   bg: '#DBEAFE', fg: '#1E3A8A', onClick: props.onProduzione },
    { key: 'montaggi',       icon: 'truck',      label: 'Montaggi',     bg: '#E1F5EE', fg: '#0F6E56', onClick: props.onMontaggi },
    { key: 'materiali',      icon: 'box',        label: 'Materiali',    bg: '#FEF3C7', fg: '#92400E', onClick: props.onMateriali },
    { key: 'magazzino',      icon: 'archive',    label: 'Magazzino',    bg: '#F3E8FF', fg: '#6B21A8', onClick: props.onMagazzino },
    { key: 'pianificazione', icon: 'calendar',   label: 'Pianifica',    bg: '#FCE7F3', fg: '#9F1239', onClick: props.onPianificazione },
    { key: 'clienti',        icon: 'users',      label: 'Clienti',      bg: '#FFEDD5', fg: '#9A3412', onClick: props.onClienti },
    { key: 'agenda',         icon: 'calendar-week', label: 'Agenda',    bg: '#CFFAFE', fg: '#155E75', onClick: props.onAgenda },
    { key: 'team',           icon: 'user-group', label: 'Team',         bg: '#FEE2E2', fg: '#991B1B', onClick: props.onTeam },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth={2}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
        <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Azioni veloci</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {actions.map(a => (
          <button
            key={a.key}
            onClick={a.onClick}
            disabled={!a.onClick}
            style={{
              background: a.bg,
              color: a.fg,
              border: 'none',
              borderRadius: 12,
              padding: '14px 6px',
              cursor: a.onClick ? 'pointer' : 'not-allowed',
              opacity: a.onClick ? 1 : 0.4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit',
              minHeight: 72,
            }}
          >
            <IconSvg name={a.icon} size={22} color={a.fg} />
            <div style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.1 }}>{a.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function IconSvg({ name, size, color }: { name: string; size: number; color: string }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case 'tool':       return <svg {...common}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
    case 'truck':      return <svg {...common}><rect x={1} y={3} width={15} height={13}/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx={5.5} cy={18.5} r={2.5}/><circle cx={18.5} cy={18.5} r={2.5}/></svg>;
    case 'box':        return <svg {...common}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1={12} y1={22.08} x2={12} y2={12}/></svg>;
    case 'archive':    return <svg {...common}><polyline points="21 8 21 21 3 21 3 8"/><rect x={1} y={3} width={22} height={5}/><line x1={10} y1={12} x2={14} y2={12}/></svg>;
    case 'calendar':   return <svg {...common}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={16} y1={2} x2={16} y2={6}/><line x1={8} y1={2} x2={8} y2={6}/><line x1={3} y1={10} x2={21} y2={10}/></svg>;
    case 'users':      return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'calendar-week': return <svg {...common}><rect x={3} y={4} width={18} height={18} rx={2}/><line x1={3} y1={10} x2={21} y2={10}/><line x1={9} y1={14} x2={9} y2={18}/><line x1={15} y1={14} x2={15} y2={18}/></svg>;
    case 'user-group': return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx={9} cy={7} r={4}/></svg>;
    default: return null;
  }
}
