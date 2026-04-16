'use client';
import HomePanel from './HomePanel';
import CostruttorePanel from './CostruttorePanel';
import CommessaIntegrata from './CommessaIntegrata';
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




// DashboardPanel RIMOSSA (v11) — Il router usa HomePanel per 'dashboard'

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


// ── Lista Commesse per selezionare quale aprire ──
function CommesseLista({ onSelect }: { onSelect: (id: string) => void }) {
  const [commesse, setCommesse] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    supabase.from("commesse").select("id, cliente, indirizzo, citta, stato, codice, created_at")
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { setCommesse(data || []); setLoading(false); });
  }, []);
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#86868b" }}>Caricamento commesse...</div>;
  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0D1F1F', marginBottom: 16 }}>Commesse</h2>
      <div style={{ fontSize: 12, color: '#86868b', marginBottom: 16 }}>Clicca su una commessa per vedere foto, firme, disegni, misure, alert e tutto il resto.</div>
      {commesse.length === 0 ? <div style={{ padding: 30, textAlign: "center", color: "#86868b" }}>Nessuna commessa</div> :
        commesse.map(c => (
          <div key={c.id} onClick={() => onSelect(c.id)} style={{ background: '#fff', border: '1px solid #C8E4E4', borderRadius: 12, padding: 14, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0D1F1F' }}>{c.cliente || c.codice || 'Commessa'}</div>
              <div style={{ fontSize: 11, color: '#86868b', marginTop: 2 }}>{c.indirizzo || ''} {c.citta || ''}</div>
            </div>
            <div style={{ fontSize: 11, color: '#28A0A0', fontWeight: 700 }}>{c.stato || '—'}</div>
          </div>
        ))
      }
    </div>
  );
}

export default function MastroDesktop() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCommessaId, setSelectedCommessaId] = useState<string | null>(null);

  const sidebarW = sidebarCollapsed ? 68 : 280;

  // Panel router
  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard': return <HomePanel onNavigate={setActivePanel} />;
      case 'commessa_dettaglio': return selectedCommessaId ? <CommessaIntegrata commessaId={selectedCommessaId} /> : <CommesseLista onSelect={(id) => { setSelectedCommessaId(id); setActivePanel('commessa_dettaglio'); }} />;
      case 'commesse': return <CommesseLista onSelect={(id) => { setSelectedCommessaId(id); setActivePanel('commessa_dettaglio'); }} />;
      case 'configuratore': return <CostruttorePanel onBack={() => setActivePanel('settings')} />;
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
