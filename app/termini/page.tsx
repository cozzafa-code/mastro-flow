export const metadata = {
  title: 'Termini di Servizio | MASTRO Suite',
  description: 'Condizioni generali di utilizzo di MASTRO Suite',
}

export default function TerminiPage() {
  return (
    <main className="min-h-screen bg-[#F2F1EC]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#1A1A1C] mb-2">Termini di Servizio</h1>
        <p className="text-sm text-gray-500 mb-10">Ultimo aggiornamento: 13 marzo 2026 Â· In vigore dal 1Â° giugno 2026</p>

        <Section title="1. Parti Contraenti">
          <p>Il presente contratto Ã¨ stipulato tra:</p>
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 text-sm space-y-1">
            <p><span className="font-semibold">Fornitore:</span> [RAGIONE SOCIALE], P.IVA [DA COMPILARE], [INDIRIZZO DA COMPILARE] â€” di seguito "MASTRO"</p>
            <p><span className="font-semibold">Cliente:</span> la persona fisica o giuridica che si registra e utilizza MASTRO Suite</p>
          </div>
          <p className="mt-3">Completando la registrazione e spuntando la casella di accettazione, il Cliente conclude un contratto vincolante con MASTRO e accetta integralmente i presenti Termini.</p>
        </Section>

        <Section title="2. Descrizione del Servizio">
          <p>MASTRO Suite Ã¨ un software gestionale SaaS (Software as a Service) verticale per PMI artigiane nei settori: serramentistica, tendaggi, fabbro, zanzariere e pergole. Il servizio include i moduli attivati in base al piano sottoscritto (ERP, Misure, Montaggi, Calendario, Messaggi e altri). L'elenco aggiornato dei moduli per piano Ã¨ disponibile nella pagina prezzi.</p>
        </Section>

        <Section title="3. Piani e Prezzi">
          <TableComp rows={[
            ['Piano', 'Prezzo mensile', 'Note'],
            ['BASE', 'â‚¬9/mese', 'FunzionalitÃ  essenziali'],
            ['START', 'â‚¬29/mese', 'Piano piÃ¹ utilizzato'],
            ['PRO', 'â‚¬59/mese', 'FunzionalitÃ  avanzate'],
            ['TITAN', 'â‚¬89/mese', 'Accesso completo'],
          ]} />
          <p className="mt-3">I prezzi sono IVA inclusa per i clienti italiani in regime ordinario. Il piano attivo Ã¨ sempre visibile nell'area account. MASTRO si riserva il diritto di modificare i prezzi con preavviso scritto di 30 giorni.</p>
        </Section>

        <Section title="4. Trial Gratuito">
          <p>Ogni nuovo account beneficia di un periodo di prova gratuito di <strong>30 giorni</strong> senza necessitÃ  di inserire dati di pagamento. Al termine del trial, per continuare a utilizzare il servizio Ã¨ necessario sottoscrivere un piano a pagamento. I dati inseriti durante il trial sono conservati per ulteriori 15 giorni dopo la scadenza, poi eliminati definitivamente salvo diversa indicazione.</p>
        </Section>

        <Section title="5. Pagamenti e Fatturazione">
          <SubList items={[
            'I pagamenti sono gestiti tramite Stripe Inc. â€” MASTRO non conserva i dati delle carte di credito',
            'Il piano si rinnova automaticamente alla scadenza (mensile o annuale secondo la scelta)',
            'Le fatture sono disponibili nell\'area account e inviate via email a ogni rinnovo',
            'In caso di mancato pagamento, il sistema notifica il Cliente via email',
            'Dopo 30 giorni di mancato pagamento (grace period) l\'accesso Ã¨ sospeso ma i dati conservati per ulteriori 30 giorni',
            'Dopo 60 giorni totali di mancato pagamento i dati possono essere eliminati definitivamente, previa notifica via email con 15 giorni di preavviso',
          ]} />
        </Section>

        <Section title="6. ProprietÃ  dei Dati">
          <p className="font-medium text-[#1A1A1C]">I dati inseriti dal Cliente in MASTRO Suite sono e rimangono di esclusiva proprietÃ  del Cliente.</p>
          <p className="mt-2">MASTRO non vende, non cede e non utilizza a fini commerciali i dati operativi del Cliente. I dati sono utilizzati esclusivamente per erogare il servizio e per obblighi di legge.</p>
        </Section>

        <Section title="7. PortabilitÃ  ed Export dei Dati">
          <p>Il Cliente ha diritto di esportare in qualsiasi momento tutti i propri dati in formato CSV e/o JSON direttamente dall'applicazione, senza costi aggiuntivi. La funzione di export Ã¨ disponibile nell'area Impostazioni per tutti i piani. In caso di cancellazione dell'account, il Cliente puÃ² richiedere l'export completo entro 30 giorni dalla cancellazione scrivendo a <a href="mailto:support@mastrosuite.com" className="text-[#D08008]">support@mastrosuite.com</a>.</p>
        </Section>

        <Section title="8. DisponibilitÃ  del Servizio (SLA)">
          <SubList items={[
            'MASTRO garantisce un uptime target del 99,5% su base mensile, escluse le manutenzioni programmate',
            'Le manutenzioni programmate sono comunicate con almeno 24 ore di preavviso via email e/o banner nell\'app',
            'In caso di interruzioni prolungate non pianificate (oltre 4 ore consecutive) il Cliente riceve un credito proporzionale sul successivo rinnovo',
            'Lo stato del servizio in tempo reale Ã¨ disponibile alla pagina status.mastrosuite.com',
          ]} />
        </Section>

        <Section title="9. Obblighi del Cliente">
          <SubList items={[
            'Il Cliente Ã¨ responsabile della correttezza e liceitÃ  dei dati inseriti nell\'applicazione',
            'Il Cliente si impegna a non utilizzare MASTRO per attivitÃ  illecite o contrarie alla legge italiana',
            'Il Cliente Ã¨ responsabile della custodia delle proprie credenziali di accesso',
            'Il Cliente non puÃ² cedere, sublicenziare o rivendere l\'accesso a MASTRO a terzi senza autorizzazione scritta',
            'Il numero di utenti (membri del team) deve corrispondere al piano sottoscritto',
          ]} />
        </Section>

        <Section title="10. Limitazione di ResponsabilitÃ ">
          <p>MASTRO Ã¨ uno strumento di supporto gestionale. Il Cliente Ã¨ il solo responsabile delle decisioni aziendali prese sulla base dei dati presenti nell'applicazione. MASTRO non Ã¨ responsabile per:</p>
          <SubList items={[
            'Perdite di dati dovute a cause di forza maggiore o comportamento del Cliente',
            'Danni indiretti, perdita di profitto o lucro cessante',
            'Errori di calcolo derivanti da dati inseriti in modo errato dal Cliente',
            'Interruzioni del servizio causate da terze parti (Supabase, Vercel, Stripe, operatori di rete)',
          ]} />
          <p className="mt-3">La responsabilitÃ  massima di MASTRO nei confronti del Cliente Ã¨ limitata all'importo pagato negli ultimi 3 mesi di servizio.</p>
        </Section>

        <Section title="11. ProprietÃ  Intellettuale">
          <p>MASTRO Suite, il suo codice sorgente, il design, i loghi, il marchio e tutti i contenuti prodotti da MASTRO sono di esclusiva proprietÃ  del Fornitore e protetti dalle leggi sul diritto d'autore. Il Cliente riceve una licenza d'uso non esclusiva, non trasferibile, limitata alla durata del contratto.</p>
        </Section>

        <Section title="12. Cancellazione dell'Account">
          <SubList items={[
            'Il Cliente puÃ² cancellare il proprio account in qualsiasi momento dall\'area Impostazioni â†’ Account â†’ Elimina account',
            'La cancellazione Ã¨ effettiva immediatamente; l\'accesso viene revocato',
            'I dati sono conservati per 30 giorni dalla cancellazione per consentire un eventuale ripensamento o export',
            'Trascorsi 30 giorni i dati vengono eliminati in modo irreversibile, nel rispetto del diritto alla cancellazione (art. 17 GDPR)',
            'MASTRO si riserva il diritto di sospendere o cancellare account che violano i presenti Termini, previa notifica salvo casi gravi',
          ]} />
        </Section>

        <Section title="13. Modifiche ai Termini">
          <p>MASTRO puÃ² modificare i presenti Termini con preavviso scritto di <strong>30 giorni</strong> via email. Se il Cliente non accetta le modifiche, puÃ² cancellare il proprio account prima della data di entrata in vigore. Il proseguimento dell'utilizzo del servizio dopo tale data costituisce accettazione delle modifiche.</p>
        </Section>

        <Section title="14. Legge Applicabile e Foro Competente">
          <p>Il presente contratto Ã¨ regolato dalla legge italiana. Per qualsiasi controversia derivante dall'interpretazione o esecuzione del presente contratto, le parti eleggono come foro competente esclusivo il Tribunale di [CITTÃ€ DA COMPILARE]. Per i Clienti consumatori (persone fisiche non titolari di P.IVA) si applica il foro del luogo di residenza del consumatore ai sensi del D.Lgs. 206/2005 (Codice del Consumo).</p>
        </Section>

        <Section title="15. Contatti">
          <div className="p-4 bg-white rounded-lg border border-gray-200 text-sm space-y-1">
            <p><span className="font-semibold">Supporto tecnico:</span> <a href="mailto:support@mastrosuite.com" className="text-[#D08008]">support@mastrosuite.com</a></p>
            <p><span className="font-semibold">Questioni legali e contratti:</span> <a href="mailto:legal@mastrosuite.com" className="text-[#D08008]">legal@mastrosuite.com</a></p>
            <p><span className="font-semibold">Privacy e GDPR:</span> <a href="mailto:privacy@mastrosuite.com" className="text-[#D08008]">privacy@mastrosuite.com</a></p>
          </div>
        </Section>

        <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400">
          <p>[RAGIONE SOCIALE] Â· P.IVA [DA COMPILARE] Â· <a href="/privacy" className="text-[#D08008]">Privacy Policy</a> Â· <a href="mailto:legal@mastrosuite.com" className="text-[#D08008]">legal@mastrosuite.com</a></p>
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

