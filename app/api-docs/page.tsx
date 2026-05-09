// app/api-docs/page.tsx
// MASTRO API - Documentazione pubblica interattiva
// fliwoX design - navy + cream + amber

'use client';

import { useState } from 'react';

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

const FONT_MONO = "'JetBrains Mono', 'Courier New', monospace";

type Endpoint = {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  scope: string;
  desc: string;
  body?: any;
  response: any;
};

const ENDPOINTS: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/v1/leads',
    scope: 'leads:write',
    desc: 'Crea un nuovo lead in MASTRO da fonte esterna (sito web, landing page, scraping)',
    body: {
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 1234567',
      email: 'mario@example.com',
      indirizzo: 'Via Roma 1',
      comune: 'Cosenza',
      provincia: 'CS',
      richiesta: 'Vorrei preventivo per finestre PVC casa 80mq',
      fonte: 'sito_web',
      fonte_ref: 'form-contatti-homepage',
    },
    response: {
      success: true,
      data: {
        id: 'uuid',
        nome: 'Mario',
        cognome: 'Rossi',
        telefono: '+39 333 1234567',
        email: 'mario@example.com',
        fonte: 'sito_web',
        stato: 'nuovo',
        creato_il: '2026-05-09T14:30:00Z',
      },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/commesse',
    scope: 'commesse:read',
    desc: 'Lista commesse aziendali con paginazione',
    response: {
      data: [
        {
          id: 'uuid',
          numero: 'S-0006',
          cliente_nome: 'Fabio Cozza',
          stato: 'CONFERMATA',
          totale: 4500.0,
          created_at: '2026-04-15T10:00:00Z',
        },
      ],
      pagination: { limit: 50, offset: 0, total: 10 },
    },
  },
  {
    method: 'GET',
    path: '/api/v1/fatture',
    scope: 'fatture:read',
    desc: 'Lista fatture emesse. Filtri: from, to (date range)',
    response: {
      data: [
        {
          id: 'uuid',
          numero: '2026/0042',
          cliente: 'Mario Rossi',
          imponibile: 3500.0,
          iva: 770.0,
          totale: 4270.0,
          stato: 'pagata',
        },
      ],
      pagination: { limit: 50, offset: 0, total: 1 },
    },
  },
];

const SNIPPETS = {
  curl: (ep: Endpoint) => {
    const url = `https://mastro-erp.vercel.app${ep.path}`;
    if (ep.method === 'POST') {
      return `curl -X POST ${url} \\
  -H "Authorization: Bearer mk_live_xxxxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(ep.body, null, 2)}'`;
    }
    return `curl ${url} \\
  -H "Authorization: Bearer mk_live_xxxxxxxxxx"`;
  },
  javascript: (ep: Endpoint) => {
    const url = `https://mastro-erp.vercel.app${ep.path}`;
    if (ep.method === 'POST') {
      return `fetch('${url}', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer mk_live_xxxxxxxxxx',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(ep.body, null, 2)})
})
  .then(r => r.json())
  .then(data => console.log(data));`;
    }
    return `fetch('${url}', {
  headers: { 'Authorization': 'Bearer mk_live_xxxxxxxxxx' }
})
  .then(r => r.json())
  .then(data => console.log(data));`;
  },
  php: (ep: Endpoint) => {
    const url = `https://mastro-erp.vercel.app${ep.path}`;
    if (ep.method === 'POST') {
      return `<?php
$ch = curl_init('${url}');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  'Authorization: Bearer mk_live_xxxxxxxxxx',
  'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${PHP_array(ep.body)}));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
?>`;
    }
    return `<?php
$ch = curl_init('${url}');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer mk_live_xxxxxxxxxx']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
?>`;
  },
};

function PHP_array(obj: any): string {
  if (!obj) return '[]';
  const lines = Object.entries(obj).map(([k, v]) => `  '${k}' => '${v}'`);
  return `[\n${lines.join(',\n')}\n]`;
}

export default function ApiDocsPage() {
  const [selectedEp, setSelectedEp] = useState(0);
  const [lang, setLang] = useState<'curl' | 'javascript' | 'php'>('curl');
  const [copied, setCopied] = useState(false);

  const ep = ENDPOINTS[selectedEp];
  const code = SNIPPETS[lang](ep);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Inter, sans-serif' }}>
      {/* Hero */}
      <header
        style={{
          background: C.navy,
          color: C.cream,
          padding: '60px 24px 80px',
          textAlign: 'center',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <p style={{ margin: 0, color: C.amber, fontSize: 13, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
          MASTRO API v1
        </p>
        <h1 style={{ margin: '12px 0 16px', fontSize: 48, fontWeight: 800, letterSpacing: '-1px' }}>
          Connetti MASTRO a tutto.
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 600, fontSize: 18, color: C.navyMute, lineHeight: 1.5 }}>
          Sito web, Zapier, Fatture in Cloud, CNC, WhatsApp, Power BI.
          REST API per integrare il tuo gestionale serramenti con qualsiasi servizio.
        </p>
      </header>

      <main style={{ maxWidth: 1100, margin: '-40px auto 0', padding: '0 24px 80px', position: 'relative' }}>
        {/* Quick start */}
        <section
          style={{
            background: C.white,
            borderRadius: 20,
            padding: 32,
            boxShadow: '0 4px 24px rgba(30,58,95,0.08)',
            marginBottom: 40,
            border: `1px solid ${C.borderWarm}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 22, color: C.navy, fontWeight: 700 }}>
            🚀 Quick Start
          </h2>
          <ol style={{ margin: '20px 0 0', paddingLeft: 20, color: C.navy, fontSize: 15, lineHeight: 1.8 }}>
            <li>Apri MASTRO → <strong>Settings → Sviluppatori</strong></li>
            <li>Tap <strong>"Genera nuova API key"</strong></li>
            <li>Seleziona i permessi necessari (es. <code style={inlineCode}>leads:write</code>)</li>
            <li>Copia la key <code style={inlineCode}>mk_live_xxxxx</code> (visibile una sola volta!)</li>
            <li>Includi la key nell'header <code style={inlineCode}>Authorization: Bearer mk_live_xxx</code></li>
          </ol>
        </section>

        {/* Endpoints */}
        <h2 style={{ fontSize: 28, color: C.navy, fontWeight: 800, margin: '0 0 20px' }}>
          Endpoints
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          {/* Sidebar endpoints */}
          <aside>
            {ENDPOINTS.map((e, i) => (
              <button
                key={i}
                onClick={() => setSelectedEp(i)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '14px 16px',
                  marginBottom: 8,
                  background: selectedEp === i ? C.navy : C.white,
                  color: selectedEp === i ? C.cream : C.navy,
                  border: `1px solid ${selectedEp === i ? C.navy : C.borderWarm}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    background: e.method === 'POST' ? C.amber : selectedEp === i ? C.amber : C.navy,
                    color: e.method === 'POST' ? C.navy : selectedEp === i ? C.navy : C.cream,
                    padding: '2px 8px',
                    borderRadius: 5,
                    fontSize: 10,
                    marginRight: 8,
                    fontWeight: 800,
                  }}
                >
                  {e.method}
                </span>
                {e.path}
              </button>
            ))}
          </aside>

          {/* Endpoint detail */}
          <article
            style={{
              background: C.white,
              borderRadius: 20,
              padding: 28,
              border: `1px solid ${C.borderWarm}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  background: ep.method === 'POST' ? C.amber : C.navy,
                  color: ep.method === 'POST' ? C.navy : C.cream,
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  fontFamily: FONT_MONO,
                }}
              >
                {ep.method}
              </span>
              <code style={{ fontSize: 18, fontWeight: 700, color: C.navy, fontFamily: FONT_MONO }}>
                {ep.path}
              </code>
            </div>

            <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
              {ep.desc}
            </p>

            <div style={{ marginBottom: 20 }}>
              <span style={{ color: C.textMuted, fontSize: 12, fontWeight: 600, marginRight: 8 }}>
                SCOPE RICHIESTO:
              </span>
              <code
                style={{
                  background: C.greenBg,
                  color: C.greenText,
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                }}
              >
                {ep.scope}
              </code>
            </div>

            {/* Lang tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: `1px solid ${C.borderSoft}` }}>
              {(['curl', 'javascript', 'php'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '10px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONT_MONO,
                    color: lang === l ? C.navy : C.textMuted,
                    borderBottom: `3px solid ${lang === l ? C.amber : 'transparent'}`,
                    cursor: 'pointer',
                    marginBottom: -1,
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Code block */}
            <div
              style={{
                background: C.navy,
                color: C.cream,
                padding: 20,
                borderRadius: '0 0 12px 12px',
                position: 'relative',
                overflowX: 'auto',
              }}
            >
              <button
                onClick={copy}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: copied ? C.greenBg : C.amber,
                  color: copied ? C.greenText : C.navy,
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                {copied ? '✓ COPIATO' : 'COPIA'}
              </button>
              <pre
                style={{
                  margin: 0,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {code}
              </pre>
            </div>

            {/* Response example */}
            <details style={{ marginTop: 20 }}>
              <summary
                style={{
                  cursor: 'pointer',
                  color: C.navy,
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '8px 0',
                }}
              >
                Esempio risposta
              </summary>
              <pre
                style={{
                  background: C.cream,
                  border: `1px solid ${C.borderWarm}`,
                  padding: 16,
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: FONT_MONO,
                  color: C.navy,
                  overflowX: 'auto',
                  marginTop: 8,
                }}
              >
                {JSON.stringify(ep.response, null, 2)}
              </pre>
            </details>
          </article>
        </div>

        {/* Use cases */}
        <h2 style={{ fontSize: 28, color: C.navy, fontWeight: 800, margin: '60px 0 24px' }}>
          Casi d'uso più richiesti
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <UseCaseCard
            icon="🌐"
            title="Sito web → Lead"
            desc="Form contatti sito serramentista crea lead diretto in MASTRO. Setup: 5 min."
          />
          <UseCaseCard
            icon="⚡"
            title="Zapier automation"
            desc="Connetti MASTRO a 5000+ app: Slack, Telegram, Mailchimp, Notion."
          />
          <UseCaseCard
            icon="📄"
            title="Fatture in Cloud"
            desc="Push fatture MASTRO → invio SDI automatico. Risparmio 15min/fattura."
          />
          <UseCaseCard
            icon="💳"
            title="Stripe acconti online"
            desc="Cliente paga acconto via link. Webhook segna 'pagata' in MASTRO."
          />
          <UseCaseCard
            icon="📊"
            title="Power BI dashboard"
            desc="Connessione live ai dati MASTRO per report fatturato/marginalità."
          />
          <UseCaseCard
            icon="💬"
            title="WhatsApp Business"
            desc="Invia preventivi su WhatsApp. Cliente legge e risponde in 30 sec."
          />
        </div>

        {/* Footer */}
        <footer
          style={{
            marginTop: 60,
            padding: 32,
            background: C.navy,
            borderRadius: 20,
            color: C.cream,
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: 16, color: C.navyMute }}>
            Hai bisogno di aiuto?
          </p>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: C.navyMute }}>
            Email{' '}
            <a href="mailto:api@mastro.app" style={{ color: C.amber, textDecoration: 'none', fontWeight: 700 }}>
              api@mastro.app
            </a>
            {' · '}
            Stato API{' '}
            <a href="/api/v1/status" style={{ color: C.amber, textDecoration: 'none', fontWeight: 700 }}>
              status.mastro.app
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

const inlineCode = {
  background: '#F5F0E8',
  padding: '2px 6px',
  borderRadius: 4,
  fontSize: 13,
  fontFamily: FONT_MONO,
  color: '#1E3A5F',
};

function UseCaseCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.borderWarm}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <h3 style={{ margin: 0, fontSize: 16, color: C.navy, fontWeight: 700 }}>
        {title}
      </h3>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
        {desc}
      </p>
    </div>
  );
}
