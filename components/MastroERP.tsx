'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Root Router
// Sessione 5: Desktop + Mobile, SettingsPanel integrato
// ═══════════════════════════════════════════════════════════

// Dynamic imports per code splitting
const MastroDesktop = dynamic(() => import('./MastroDesktop'), { ssr: false });
const SettingsPanel = dynamic(() => import('./SettingsPanel'), { ssr: false });

// Hook per device detection
function useDeviceType() {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    function check() {
      const w = window.innerWidth;
      if (w >= 1024) setDevice('desktop');
      else if (w >= 768) setDevice('tablet');
      else setDevice('mobile');
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return device;
}

// ── Design System ──
const DS = {
  teal: '#28A0A0',
  tealDark: '#156060',
  dark: '#0D1F1F',
  ink: '#0D1F1F',
  light: '#EEF8F8',
  border: '#C8E4E4',
  bg: '#E8F4F4',
  white: '#FFFFFF',
};

// ═══════════════════════════════════════════════════════════
// MOBILE SHELL (smartphone / tablet)
// ═══════════════════════════════════════════════════════════

function MobileMastro() {
  const [tab, setTab] = useState('home');

  const bottomNav = [
    { id: 'home', label: 'Home', icon: '□' },
    { id: 'commesse', label: 'Commesse', icon: '☰' },
    { id: 'agenda', label: 'Agenda', icon: '◫' },
    { id: 'altro', label: 'Altro', icon: '⋯' },
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", background: DS.bg }}>
      {/* Topbar mobile */}
      <header style={{
        height: 56,
        background: DS.dark,
        color: DS.white,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 12,
      }}>
        <svg width="24" height="24" viewBox="0 0 40 40">
          <rect width="40" height="40" rx="8" fill={DS.teal} />
          <path d="M10 28V12l10 8-10 8z" fill={DS.white} />
          <path d="M20 28V12l10 8-10 8z" fill={DS.white} opacity="0.6" />
        </svg>
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: 2 }}>MASTRO</span>
      </header>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div style={{ textAlign: 'center', paddingTop: 60, color: DS.tealDark }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Versione mobile</div>
          <div style={{ fontSize: 13, marginTop: 8, opacity: 0.6 }}>Per la Control Room completa usa il desktop</div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav style={{
        height: 60,
        background: DS.white,
        borderTop: `1px solid ${DS.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        {bottomNav.map(n => (
          <button
            key={n.id}
            onClick={() => setTab(n.id)}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: tab === n.id ? DS.teal : DS.tealDark,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: tab === n.id ? 700 : 400,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <span style={{ fontSize: 20 }}>{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DESKTOP WRAPPER — Integra SettingsPanel nel Desktop
// ═══════════════════════════════════════════════════════════

function DesktopWrapper() {
  // MastroDesktop gestisce il routing interno.
  // SettingsPanel viene iniettato come panel "settings" dentro MastroDesktop.
  // Il collegamento avviene tramite il prop onNavigate nel SettingsPanel
  // e il setActivePanel nel MastroDesktop.
  //
  // Per ora esportiamo MastroDesktop direttamente.
  // Il SettingsPanel si integra quando activePanel === 'settings'.
  return <MastroDesktop />;
}

// ═══════════════════════════════════════════════════════════
// ROOT EXPORT
// ═══════════════════════════════════════════════════════════

export default function MastroERP() {
  const device = useDeviceType();

  if (device === 'mobile') return <MobileMastro />;
  // tablet e desktop usano la versione desktop
  return <DesktopWrapper />;
}
