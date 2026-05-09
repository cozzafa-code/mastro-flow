// components/mobile/settings/ApiKeysMobile.tsx
// MASTRO fliwoX mobile - Sviluppatori (API Keys)

'use client';

import { useState } from 'react';
import { useApiKeys } from '@/hooks/useApiKeys';
import type { ApiKey } from '@/lib/types';

// Palette dal mockup MASTRO (fliwoX reale)
const C = {
  navy: '#1E3A5F',
  navyDark: '#122440',
  navyMute: '#B8C5D6',
  cream: '#F5F0E8',
  white: '#FFFFFF',
  amber: '#E89F3F',
  red: '#C44545',
  greenBg: '#E8F0E5',
  greenText: '#2D5F3F',
  borderWarm: '#d8cfc0',
  borderSoft: '#ebe5d9',
  textMuted: '#6b6358',
};

const FONT_MONO = "'JetBrains Mono', monospace";

interface Props {
  aziendaId: string;
  onBack: () => void;
  onOpenGenera: () => void;
  onRevoke: (key: ApiKey) => void;
}

export default function ApiKeysMobile({ aziendaId, onBack, onOpenGenera, onRevoke }: Props) {
  const { keys, loading, stats } = useApiKeys(aziendaId);

  return (
    <div style={{ minHeight: '100vh', background: C.cream }}>
      {/* Header navy con bordi inferiori arrotondati */}
      <header
        style={{
          background: C.navy,
          padding: '16px 20px 24px',
          borderRadius: '0 0 24px 24px',
          margin: '0 12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            onClick={onBack}
            style={{ background: 'transparent', border: 'none', color: C.cream, padding: 0, cursor: 'pointer' }}
            aria-label="Indietro"
          >
            <ChevronLeft />
          </button>
          <p
            style={{
              margin: 0,
              color: C.navyMute,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              fontWeight: 600,
            }}
          >
            SETTINGS
          </p>
        </div>
        <h1
          style={{
            margin: 0,
            color: C.cream,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          Sviluppatori
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{ color: C.cream, fontSize: 14, fontWeight: 500 }}>
            {stats.activeKeys} {stats.activeKeys === 1 ? 'attiva' : 'attive'}
          </span>
          <span
            style={{
              background: C.amber,
              color: C.navy,
              fontSize: 11,
              padding: '3px 9px',
              borderRadius: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
            }}
          >
            {stats.planName}
          </span>
        </div>
      </header>

      {/* Stats */}
      <section
        style={{
          padding: '16px 20px 8px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <StatCard
          label="Chiamate mese"
          value={stats.callsMonth.toLocaleString('it-IT')}
          subtitle={`su ${stats.planLimit.toLocaleString('it-IT')}`}
          subtitleColor={C.textMuted}
        />
        <StatCard
          label="Chiavi attive"
          value={String(stats.activeKeys)}
          subtitle={stats.expiringKeys > 0 ? `${stats.expiringKeys} in scadenza` : 'tutte ok'}
          subtitleColor={stats.expiringKeys > 0 ? C.red : C.textMuted}
          subtitleBold={stats.expiringKeys > 0}
        />
      </section>

      {/* CTA primario */}
      <div style={{ padding: '8px 20px 16px' }}>
        <button
          onClick={onOpenGenera}
          style={{
            width: '100%',
            background: C.navy,
            color: C.cream,
            border: 'none',
            borderRadius: 16,
            padding: 17,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 0 ${C.navyDark}, 0 6px 14px rgba(30,58,95,0.25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            letterSpacing: '0.3px',
          }}
        >
          <PlusIcon />
          GENERA NUOVA API KEY
        </button>
      </div>

      {/* Section title */}
      <div style={{ padding: '4px 20px 8px' }}>
        <h2
          style={{
            margin: 0,
            color: C.navy,
            fontSize: 14,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Le tue chiavi
        </h2>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ padding: '32px 20px', textAlign: 'center', color: C.textMuted }}>
          Caricamento…
        </p>
      ) : keys.length === 0 ? (
        <EmptyState onGenera={onOpenGenera} />
      ) : (
        <div style={{ padding: '0 20px' }}>
          {keys.map((k) => (
            <ApiKeyCard key={k.id} apiKey={k} onRevoke={() => onRevoke(k)} />
          ))}
        </div>
      )}

      {/* Documentazione card navy */}
      <a
        href="/api/docs"
        target="_blank"
        rel="noopener"
        style={{
          display: 'flex',
          margin: '16px 20px 24px',
          padding: 14,
          background: C.navy,
          borderRadius: 16,
          alignItems: 'center',
          gap: 12,
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: C.amber,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BookIcon color={C.navy} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, color: C.cream, fontSize: 14, fontWeight: 700 }}>
            Documentazione API
          </p>
          <p style={{ margin: '2px 0 0', color: C.navyMute, fontSize: 11 }}>
            Endpoint, esempi, webhook
          </p>
        </div>
        <ExternalIcon color={C.amber} />
      </a>
    </div>
  );
}

// ---------- Sub-components ----------

function StatCard({
  label,
  value,
  subtitle,
  subtitleColor,
  subtitleBold,
}: {
  label: string;
  value: string;
  subtitle: string;
  subtitleColor: string;
  subtitleBold?: boolean;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.borderWarm}`,
        borderRadius: 16,
        padding: 14,
      }}
    >
      <p
        style={{
          margin: 0,
          color: C.textMuted,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: '6px 0 0',
          color: C.navy,
          fontSize: 24,
          fontWeight: 700,
          fontFamily: FONT_MONO,
        }}
      >
        {value}
      </p>
      <p
        style={{
          margin: '2px 0 0',
          color: subtitleColor,
          fontSize: 10,
          fontWeight: subtitleBold ? 500 : 400,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}

function EmptyState({ onGenera }: { onGenera: () => void }) {
  return (
    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
      <p style={{ color: C.textMuted, marginBottom: 12 }}>Nessuna API key generata.</p>
      <button
        onClick={onGenera}
        style={{
          background: 'transparent',
          border: 'none',
          color: C.navy,
          fontWeight: 700,
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Genera la prima
      </button>
    </div>
  );
}

function ApiKeyCard({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: () => void }) {
  const isExpiring = apiKey.expires_at
    ? new Date(apiKey.expires_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
    : false;

  const borderStyle = isExpiring ? `2px solid ${C.red}` : `1px solid ${C.borderWarm}`;
  const iconBg = isExpiring ? C.red : C.navy;
  const iconColor = isExpiring ? C.cream : C.amber;
  const badgeBg = isExpiring ? C.red : C.greenBg;
  const badgeText = isExpiring ? C.cream : C.greenText;

  return (
    <div
      style={{
        background: C.white,
        border: borderStyle,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyIcon color={iconColor} />
          </div>
          <div>
            <p style={{ margin: 0, color: C.navy, fontSize: 14, fontWeight: 700 }}>{apiKey.name}</p>
            <p
              style={{
                margin: '2px 0 0',
                color: isExpiring ? C.red : C.textMuted,
                fontSize: 11,
                fontWeight: isExpiring ? 600 : 400,
              }}
            >
              {isExpiring && apiKey.expires_at
                ? `Scade ${formatDaysUntil(apiKey.expires_at)}`
                : `Creata ${formatDate(apiKey.created_at)}`}
            </p>
          </div>
        </div>
        <span
          style={{
            background: badgeBg,
            color: badgeText,
            fontSize: 10,
            padding: '4px 9px',
            borderRadius: 10,
            fontWeight: 700,
            letterSpacing: '0.3px',
          }}
        >
          {isExpiring ? 'SCADENZA' : 'ATTIVA'}
        </span>
      </div>

      <div
        style={{
          background: C.cream,
          border: `1px solid ${C.borderWarm}`,
          borderRadius: 10,
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <code style={{ color: C.navy, fontSize: 12, fontFamily: FONT_MONO, fontWeight: 600 }}>
          {apiKey.key_prefix}…••••••••
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(apiKey.key_prefix)}
          style={{ background: 'transparent', border: 'none', color: C.navy, padding: 2, cursor: 'pointer' }}
          aria-label="Copia"
        >
          <CopyIcon />
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {apiKey.scopes.slice(0, 2).map((s) => (
          <span
            key={s}
            style={{
              background: C.navy,
              color: C.cream,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 6,
              fontFamily: FONT_MONO,
              fontWeight: 600,
            }}
          >
            {s}
          </span>
        ))}
        {apiKey.scopes.length > 2 && (
          <span
            style={{
              background: C.borderWarm,
              color: C.navy,
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 6,
              fontWeight: 700,
            }}
          >
            +{apiKey.scopes.length - 2}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          paddingTop: 8,
          borderTop: `1px solid ${C.borderSoft}`,
        }}
      >
        <span style={{ color: C.textMuted }}>
          {apiKey.last_used_at ? formatRelative(apiKey.last_used_at) : 'mai usata'}
        </span>
        <button
          onClick={onRevoke}
          style={{ background: 'transparent', border: 'none', color: C.red, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
        >
          Revoca
        </button>
      </div>
    </div>
  );
}

// ---------- Icons SVG inline ----------

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function KeyIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function BookIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ExternalIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

// ---------- Helpers ----------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

function formatDaysUntil(iso: string): string {
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return `tra ${days} ${days === 1 ? 'giorno' : 'giorni'}`;
}
