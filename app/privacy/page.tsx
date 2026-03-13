export const metadata = {
  title: 'Privacy Policy | MASTRO Suite',
  description: 'Informativa sul trattamento dei dati personali ai sensi del GDPR (Reg. UE 2016/679)',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F2F1EC]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1A1A1C] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Ultimo aggiornamento: 13 marzo 2026</p>

        <Section title="1. Titolare del Trattamento">
          <p>Il titolare del trattamento dei dati personali Ã¨:</p>
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 text-sm space-y-1">
            <p className="font-semibold">[RAGIONE SOCIALE DA COMPILARE]</p>
            <p>P.IVA: [DA COMPILARE]</p>
            <p>Indirizzo: [DA COMPILARE]</p>
            <p>Email: <a href="mailto:privacy@mastrosuite.com" className="text-[#D08008]">privacy@mastrosuite.com</a></p>
          </div>
        </Section>

        <Section title="2. Dati Raccolti">
          <p>Raccogliamo i seguenti dati personali:</p>
          <SubList items={[
            'Dati di registrazione: nome, cognome, indirizzo email, ragione sociale, Partita IVA, numero di telefono, cittÃ ',
            'Dati operativi: commesse, misurazioni, contatti clienti, documenti, eventi calendario inseriti nell\'applicazione',
            'Dati tecnici: indirizzo IP, tipo di browser, sistema operativo, log di accesso e sicurezza',
            'Dati di pagamento: gestiti direttamente da Stripe Inc. â€” MASTRO non conserva mai i dati delle carte di credito',
          ]} />
        </Section>

        <Section title="3. FinalitÃ  e Base Giuridica del Trattamento">
          <TableComp rows={[
            ['FinalitÃ ', 'Base giuridica'],
            ['Erogazione del servizio MASTRO Suite', 'Esecuzione del contratto (art. 6.1.b GDPR)'],
            ['Fatturazione e gestione pagamenti', 'Obbligo legale (art. 6.1.c GDPR)'],
            ['Assistenza tecnica e supporto clienti', 'Esecuzione del contratto (art. 6.1.b GDPR)'],
            ['Comunicazioni di servizio (aggiornamenti, manutenzioni)', 'Legittimo interesse (art. 6.1.f GDPR)'],
            ['Comunicazioni commerciali e newsletter', 'Consenso (art. 6.1.a GDPR)'],
            ['Sicurezza, prevenzione frodi, audit log', 'Legittimo interesse (art. 6.1.f GDPR)'],
          ]} />
        </Section>

        <Section title="4. Conservazione dei Dati">
          <SubList items={[
            'Dati account e operativi: per tutta la durata del contratto e per 12 mesi successivi alla cancellazione (per consentire l\'export completo)',
            'Dati di fatturazione: 10 anni come richiesto dalla normativa fiscale italiana',
            'Log tecnici e di sicurezza: 90 giorni',
            'Dati marketing (consenso newsletter): fino alla revoca del consenso',
          ]} />
        </Section>

        <Section title="5. Sub-Responsabili del Trattamento">
          <p className="mb-3">Il Titolare si avvale dei seguenti sub-responsabili, tutti conformi al GDPR con dati conservati nell'Unione Europea:</p>
          <TableComp rows={[
            ['Fornitore', 'Ruolo', 'Sede dati'],
            ['Supabase Inc.', 'Database e autenticazione', 'AWS eu-west (Irlanda/Francoforte)'],
            ['Vercel Inc.', 'Hosting applicazione', 'EU (Francoforte)'],
            ['Stripe Inc.', 'Gestione pagamenti', 'EU'],
          ]} />
          <p className="mt-3">Con ciascun sub-responsabile Ã¨ stipulato un Data Processing Agreement (DPA) conforme all'art. 28 GDPR.</p>
        </Section>

        <Section title="6. Trasferimenti Extra-UE">
          <p>Eventuali trasferimenti di dati verso paesi terzi avvengono esclusivamente nel rispetto delle garanzie previste dal GDPR: Clausole Contrattuali Standard (SCC) approvate dalla Commissione Europea o decisioni di adeguatezza equivalenti.</p>
        </Section>

        <Section title="7. Diritti dell'Interessato">
          <p className="mb-3">Ai sensi degli artt. 15â€“22 GDPR, l'utente ha diritto a:</p>
          <SubList items={[
            'Accesso (art. 15): ottenere conferma del trattamento e copia dei propri dati',
            'Rettifica (art. 16): correggere dati inesatti o incompleti',
            'Cancellazione (art. 17): richiedere la cancellazione dei propri dati nei casi previsti dalla legge',
            'Limitazione (art. 18): richiedere la limitazione del trattamento',
            'PortabilitÃ  (art. 20): ricevere i propri dati in formato strutturato CSV/JSON â€” disponibile in qualsiasi momento dall\'interno dell\'applicazione',
            'Opposizione (art. 21): opporsi al trattamento basato su legittimo interesse',
            'Revoca del consenso: in qualsiasi momento per i trattamenti basati su consenso, senza pregiudizio per la liceitÃ  del trattamento precedente',
          ]} />
          <p className="mt-3">Per esercitare i propri diritti scrivere a: <a href="mailto:privacy@mastrosuite.com" className="text-[#D08008]">privacy@mastrosuite.com</a>. Risponderemo entro 30 giorni dalla ricezione della richiesta.</p>
        </Section>

        <Section title="8. Reclamo all'AutoritÃ  di Controllo">
          <p>L'utente ha diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" className="text-[#D08008]" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).</p>
        </Section>

        <Section title="9. Cookie">
          <p>MASTRO Suite utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio (gestione sessione autenticata). Non utilizziamo cookie di profilazione nÃ© tracker pubblicitari di terze parti. Per i soli cookie tecnici non Ã¨ richiesto il consenso ai sensi del Provvedimento del Garante dell'8 maggio 2014 e successive linee guida.</p>
        </Section>

        <Section title="10. Misure di Sicurezza">
          <p>Adottiamo misure tecniche e organizzative adeguate per proteggere i dati personali, tra cui: crittografia in transito (TLS 1.3), crittografia a riposo, autenticazione a due fattori (2FA/TOTP), Row Level Security sul database con isolamento dati per tenant, audit log delle operazioni sensibili, rate limiting sugli accessi, accesso ai dati limitato al solo personale autorizzato.</p>
        </Section>

        <Section title="11. Modifiche alla Privacy Policy">
          <p>Eventuali modifiche sostanziali alla presente informativa saranno comunicate agli utenti via email con almeno 15 giorni di preavviso. La versione aggiornata sarÃ  sempre disponibile a questo indirizzo con indicazione della data di aggiornamento.</p>
        </Section>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400">
          <p>[RAGIONE SOCIALE] Â· P.IVA [DA COMPILARE] Â· <a href="mailto:privacy@mastrosuite.com" className="text-[#D08008]">privacy@mastrosuite.com</a></p>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-[#1A1A1C] mb-3 pb-1 border-b border-gray-200">{title}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

function SubList({ items }: { items: string[] }) {
  return (
    <ul className="list-none space-y-1 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-[#D08008] mt-0.5 shrink-0">â€º</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function TableComp({ rows }: { rows: string[][] }) {
  const [header, ...body] = rows
  return (
    <div className="overflow-x-auto mt-2">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1A1A1C] text-white">
            {header.map((h, i) => <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {body.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {row.map((cell, j) => <td key={j} className="px-3 py-2 border-b border-gray-100">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

