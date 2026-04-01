'use client';
const COMPANY = 'GALASSIA MASTRO';
const EMAIL_PRIVACY = 'privacy@mastrosuite.com';
const DATA = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });

export default function PrivacyPage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 760, margin: '0 auto', padding: '48px 24px', color: '#1A1A1C', lineHeight: 1.7 }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>MASTRO <span style={{ color: '#D08008' }}>SUITE</span></div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Informativa Privacy & GDPR</h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Ultimo aggiornamento: {DATA} · Art. 13 Reg. UE 2016/679</p>
      </div>

      {SEZIONI_PRIVACY.map(s => (
        <div key={s.titolo} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #D08008', paddingBottom: 8, marginBottom: 12 }}>{s.titolo}</h2>
          <p style={{ color: '#374151', fontSize: 15 }}>{s.testo}</p>
        </div>
      ))}

      <div style={{ background: '#F2F1EC', borderRadius: 10, padding: '16px 20px', marginTop: 40, fontSize: 14, color: '#6B7280' }}>
        DPO / Responsabile Privacy: <a href={`mailto:${EMAIL_PRIVACY}`} style={{ color: '#D08008' }}>{EMAIL_PRIVACY}</a>
      </div>
    </div>
  );
}

const SEZIONI_PRIVACY = [
  {
    titolo: '1. Titolare del Trattamento',
    testo: `${COMPANY}, con sede legale in Italia. Contatto: privacy@mastrosuite.com. Il Titolare tratta i dati personali degli utenti nel rispetto del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.`,
  },
  {
    titolo: '2. Dati Raccolti',
    testo: 'Raccogliamo: (a) Dati di registrazione: nome, cognome, email, ragione sociale, P.IVA; (b) Dati di utilizzo: log di accesso, funzionalità utilizzate, timestamp; (c) Dati inseriti dall\'utente: clienti, commesse, misure, documenti — trattati in qualità di Responsabile del trattamento per conto dell\'utente (che è il Titolare per i propri clienti); (d) Dati di pagamento: gestiti esclusivamente da Stripe Inc. — non conserviamo dati di carta.',
  },
  {
    titolo: '3. Finalità e Base Giuridica',
    testo: 'Trattiamo i dati per: erogazione del Servizio (base: esecuzione contratto, art. 6.1.b GDPR); fatturazione e obblighi fiscali (base: obbligo legale, art. 6.1.c); miglioramento del Servizio con dati aggregati e anonimizzati (base: legittimo interesse, art. 6.1.f); invio comunicazioni di servizio (base: esecuzione contratto); marketing, solo previo consenso esplicito (base: consenso, art. 6.1.a).',
  },
  {
    titolo: '4. Conservazione dei Dati',
    testo: 'I dati di account sono conservati per tutta la durata del contratto e per 10 anni successivi per obblighi fiscali. I log di accesso sono conservati per 12 mesi. In caso di disdetta, i dati operativi sono disponibili per l\'esportazione per 30 giorni, poi eliminati in modo sicuro.',
  },
  {
    titolo: '5. Responsabili del Trattamento (Sub-Processor)',
    testo: 'Utilizziamo: Supabase Inc. (database, hosting dati — USA, con garanzie GDPR tramite DPA); Vercel Inc. (hosting applicazione — USA, con garanzie GDPR); Stripe Inc. (pagamenti — USA, certificato PCI DSS); Sentry (monitoraggio errori — dati anonimizzati). Tutti i fornitori hanno firmato un DPA conforme GDPR.',
  },
  {
    titolo: '6. Diritti dell\'Interessato',
    testo: 'Ai sensi degli artt. 15-22 GDPR, l\'utente ha diritto di: accedere ai propri dati; rettificarli; cancellarli ("diritto all\'oblio"); limitarne il trattamento; portabilità dei dati in formato strutturato (JSON/CSV); opposizione al trattamento; revocare il consenso in qualsiasi momento. Per esercitare i diritti: privacy@mastrosuite.com. Risposta entro 30 giorni.',
  },
  {
    titolo: '7. Trasferimenti Extra-UE',
    testo: 'I dati possono essere trasferiti negli USA (Supabase, Vercel, Stripe) sulla base delle Standard Contractual Clauses (SCC) approvate dalla Commissione Europea, ai sensi dell\'art. 46 GDPR. L\'utente può richiedere copia delle garanzie adottate scrivendo a privacy@mastrosuite.com.',
  },
  {
    titolo: '8. Cookie',
    testo: 'Utilizziamo cookie tecnici essenziali per il funzionamento dell\'applicazione (sessione, autenticazione). Non utilizziamo cookie di profilazione o di terze parti a scopo pubblicitario. Per l\'applicazione autenticata non è richiesto il banner cookie in quanto i cookie sono strettamente necessari.',
  },
  {
    titolo: '9. Reclami',
    testo: 'L\'utente ha il diritto di presentare reclamo all\'Autorità Garante per la protezione dei dati personali (Garante Privacy Italia — www.garanteprivacy.it) qualora ritenga che il trattamento dei propri dati violi il GDPR.',
  },
];
