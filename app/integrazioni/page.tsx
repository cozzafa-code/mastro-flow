// app/integrazioni/page.tsx
// MASTRO - Pagina marketing pubblica delle integrazioni

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
  textMuted: '#6b6358',
};

type Integrazione = {
  id: string;
  nome: string;
  desc: string;
  icona: string;
  categoria: string;
  stato: 'live' | 'soon' | 'beta';
  killer?: string;
};

const CATEGORIE = [
  { id: 'tutti', label: 'Tutti', count: 100 },
  { id: 'lead', label: 'Lead & Vendita' },
  { id: 'fiscale', label: 'Fiscale' },
  { id: 'produzione', label: 'Produzione' },
  { id: 'fornitori', label: 'Fornitori' },
  { id: 'comunicazione', label: 'Comunicazione' },
  { id: 'finanza', label: 'Pagamenti' },
];

const INTEGRAZIONI: Integrazione[] = [
  // LIVE
  { id: 'sito', nome: 'Form sito web', desc: 'Lead automatici dal tuo sito vetrina', icona: '🌐', categoria: 'lead', stato: 'live', killer: 'Setup 5 min' },
  { id: 'zapier', nome: 'Zapier', desc: 'Connetti MASTRO a 5000+ app', icona: '⚡', categoria: 'comunicazione', stato: 'live', killer: 'No-code' },
  { id: 'stripe', nome: 'Stripe', desc: 'Acconti pagati online via link', icona: '💳', categoria: 'finanza', stato: 'live' },
  { id: 'fic', nome: 'Fatture in Cloud', desc: 'Push fatture a SDI automatico', icona: '📄', categoria: 'fiscale', stato: 'live', killer: '15 min/fattura' },
  { id: 'cnc-emmegi', nome: 'CNC Emmegi Centro 2', desc: 'Programmi taglio diretti dalla commessa', icona: '⚙️', categoria: 'produzione', stato: 'live', killer: 'Zero re-input' },
  { id: 'enea', nome: 'Bonus ENEA', desc: 'Detrazione 50/65% pratica auto', icona: '🌿', categoria: 'fiscale', stato: 'live', killer: 'Closing +30%' },
  { id: 'soisy', nome: 'Soisy', desc: 'Finanziamento al cliente al checkout', icona: '💰', categoria: 'finanza', stato: 'live', killer: 'Closing +25%' },

  // BETA
  { id: 'whatsapp', nome: 'WhatsApp Business', desc: 'Invia preventivi direttamente su WhatsApp', icona: '💬', categoria: 'comunicazione', stato: 'beta' },
  { id: 'powerbi', nome: 'Power BI', desc: 'Dashboard fatturato e marginalità', icona: '📊', categoria: 'fiscale', stato: 'beta' },

  // SOON
  { id: 'aluplast', nome: 'Aluplast Portal', desc: 'Ordini sistema profili automatici', icona: '🪟', categoria: 'fornitori', stato: 'soon' },
  { id: 'twin', nome: 'Twin Systems', desc: 'Listini live + ordini push', icona: '🔧', categoria: 'fornitori', stato: 'soon' },
  { id: 'maico', nome: 'Maico Ferramenta', desc: 'Ordini ferramenta da MASTRO Win', icona: '🔩', categoria: 'fornitori', stato: 'soon' },
  { id: 'docusign', nome: 'DocuSign', desc: 'Firma digitale contratti', icona: '✍️', categoria: 'fiscale', stato: 'soon' },
  { id: 'gcal', nome: 'Google Calendar', desc: 'Sync agenda montaggi', icona: '📅', categoria: 'comunicazione', stato: 'soon' },
  { id: 'slack', nome: 'Slack', desc: 'Notifiche eventi commessa', icona: '🔔', categoria: 'comunicazione', stato: 'soon' },
  { id: 'mailchimp', nome: 'Mailchimp', desc: 'Newsletter ai clienti', icona: '📧', categoria: 'comunicazione', stato: 'soon' },
  { id: 'cofidis', nome: 'Cofidis', desc: 'Finanziamento alternativo Soisy', icona: '💵', categoria: 'finanza', stato: 'soon' },
  { id: 'habitissimo', nome: 'Habitissimo', desc: 'Lead da marketplace ristrutturazioni', icona: '🏠', categoria: 'lead', stato: 'soon' },
  { id: 'gmaps', nome: 'Google Maps', desc: 'Calcolo costo trasferta automatico', icona: '🗺️', categoria: 'produzione', stato: 'soon' },
  { id: 'leica', nome: 'Leica Disto', desc: 'Distanziometro Bluetooth → MASTRO', icona: '📏', categoria: 'produzione', stato: 'soon' },
];

export default function IntegrazioniPage() {
  const [categoria, setCategoria] = useState('tutti');

  const filtered = categoria === 'tutti'
    ? INTEGRAZIONI
    : INTEGRAZIONI.filter((i) => i.categoria === categoria);

  const liveCount = INTEGRAZIONI.filter((i) => i.stato === 'live').length;

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: 'Inter, sans-serif' }}>
      {/* Hero */}
      <header
        style={{
          background: C.navy,
          color: C.cream,
          padding: '80px 24px 100px',
          textAlign: 'center',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <p style={{ margin: 0, color: C.amber, fontSize: 13, fontWeight: 700, letterSpacing: '2px' }}>
          INTEGRAZIONI
        </p>
        <h1 style={{ margin: '12px 0 16px', fontSize: 56, fontWeight: 800, letterSpacing: '-1.5px', lineHeight: 1.05 }}>
          MASTRO si collega<br />a tutto.
        </h1>
        <p style={{ margin: '0 auto', maxWidth: 640, fontSize: 19, color: C.navyMute, lineHeight: 1.5 }}>
          Sito web, fatture elettroniche, CNC, finanziamenti, WhatsApp, BI.
          {' '}<strong style={{ color: C.amber }}>{liveCount} integrazioni attive oggi</strong>,{' '}
          <strong>+100 sulla roadmap</strong>.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/api-docs"
            style={{
              background: C.amber,
              color: C.navy,
              padding: '14px 28px',
              borderRadius: 14,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 4px 0 #B87E2A',
            }}
          >
            DOCUMENTAZIONE API
          </a>
          <a
            href="https://mastro-erp.vercel.app"
            style={{
              background: 'transparent',
              color: C.cream,
              padding: '14px 28px',
              borderRadius: 14,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 15,
              border: `1px solid ${C.cream}`,
            }}
          >
            Apri MASTRO →
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '-50px auto 0', padding: '0 24px 80px', position: 'relative' }}>
        {/* Filtri */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.borderWarm}`,
            borderRadius: 16,
            padding: 8,
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            marginBottom: 32,
            boxShadow: '0 4px 24px rgba(30,58,95,0.08)',
          }}
        >
          {CATEGORIE.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoria(cat.id)}
              style={{
                background: categoria === cat.id ? C.navy : 'transparent',
                color: categoria === cat.id ? C.cream : C.navy,
                border: 'none',
                padding: '10px 18px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid integrazioni */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((i) => (
            <IntegrazioneCard key={i.id} item={i} />
          ))}
        </div>

        {/* CTA finale */}
        <section
          style={{
            marginTop: 80,
            padding: 48,
            background: C.navy,
            borderRadius: 24,
            color: C.cream,
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px' }}>
            Manca un'integrazione?
          </h2>
          <p style={{ margin: '12px 0 24px', fontSize: 16, color: C.navyMute, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto' }}>
            La nostra API REST è aperta. Puoi connettere MASTRO a qualsiasi servizio.
            Scrivici cosa ti serve, lo aggiungiamo.
          </p>
          <a
            href="mailto:integrazioni@mastro.app"
            style={{
              display: 'inline-block',
              background: C.amber,
              color: C.navy,
              padding: '16px 32px',
              borderRadius: 14,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 4px 0 #B87E2A',
              letterSpacing: '0.3px',
            }}
          >
            RICHIEDI INTEGRAZIONE
          </a>
        </section>
      </main>
    </div>
  );
}

function IntegrazioneCard({ item }: { item: Integrazione }) {
  const stateColor =
    item.stato === 'live' ? C.greenText
      : item.stato === 'beta' ? C.amber
      : C.textMuted;

  const stateBg =
    item.stato === 'live' ? C.greenBg
      : item.stato === 'beta' ? '#FFF8E5'
      : C.borderWarm;

  const stateLabel =
    item.stato === 'live' ? 'ATTIVA'
      : item.stato === 'beta' ? 'BETA'
      : 'IN ARRIVO';

  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.borderWarm}`,
        borderRadius: 16,
        padding: 20,
        position: 'relative',
        opacity: item.stato === 'soon' ? 0.7 : 1,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 36 }}>{item.icona}</div>
        <span
          style={{
            background: stateBg,
            color: stateColor,
            fontSize: 9,
            padding: '3px 8px',
            borderRadius: 6,
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
        >
          {stateLabel}
        </span>
      </div>

      <h3 style={{ margin: 0, fontSize: 17, color: C.navy, fontWeight: 700 }}>
        {item.nome}
      </h3>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
        {item.desc}
      </p>

      {item.killer && (
        <div
          style={{
            marginTop: 12,
            display: 'inline-block',
            background: C.amber,
            color: C.navy,
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.3px',
          }}
        >
          ⚡ {item.killer}
        </div>
      )}
    </div>
  );
}
