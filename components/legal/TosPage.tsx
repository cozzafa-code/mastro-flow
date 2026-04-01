'use client';
const COMPANY = 'GALASSIA MASTRO';
const EMAIL = 'legal@mastrosuite.com';
const DATA = new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });

export default function TosPage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 760, margin: '0 auto', padding: '48px 24px', color: '#1A1A1C', lineHeight: 1.7 }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>MASTRO <span style={{ color: '#D08008' }}>SUITE</span></div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Termini di Servizio</h1>
        <p style={{ color: '#6B7280', fontSize: 14 }}>Ultimo aggiornamento: {DATA}</p>
      </div>

      {SEZIONI_TOS.map(s => (
        <div key={s.titolo} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, borderBottom: '2px solid #D08008', paddingBottom: 8, marginBottom: 12 }}>{s.titolo}</h2>
          <p style={{ color: '#374151', fontSize: 15 }}>{s.testo}</p>
        </div>
      ))}

      <div style={{ background: '#F2F1EC', borderRadius: 10, padding: '16px 20px', marginTop: 40, fontSize: 14, color: '#6B7280' }}>
        Per qualsiasi domanda: <a href={`mailto:${EMAIL}`} style={{ color: '#D08008' }}>{EMAIL}</a>
      </div>
    </div>
  );
}

const SEZIONI_TOS = [
  {
    titolo: '1. Accettazione dei Termini',
    testo: `Utilizzando MASTRO SUITE ("il Servizio"), gestito da ${COMPANY}, l'utente accetta integralmente i presenti Termini di Servizio. Se non si accettano questi termini, non è possibile utilizzare il Servizio. L'utilizzo continuato del Servizio dopo eventuali modifiche ai Termini costituisce accettazione delle modifiche stesse.`,
  },
  {
    titolo: '2. Descrizione del Servizio',
    testo: 'MASTRO SUITE è una piattaforma SaaS (Software as a Service) per la gestione operativa di imprese artigiane del settore serramentistico e affini. Il Servizio include moduli per la gestione di commesse, preventivi, cantieri, team, fatturazione e comunicazioni con i clienti.',
  },
  {
    titolo: '3. Account e Accesso',
    testo: "L'utente è responsabile della sicurezza delle proprie credenziali di accesso. È vietato condividere l'account con soggetti non autorizzati. In caso di accesso non autorizzato, l'utente deve notificarlo immediatamente a " + EMAIL + '. Ogni account è associato a una singola azienda. L\'utilizzo multi-azienda richiede account separati.',
  },
  {
    titolo: '4. Piani e Abbonamento',
    testo: 'Il Servizio è disponibile in piani a pagamento mensile (BASE, START, PRO, TITAN) con un periodo di prova gratuita di 30 giorni. Al termine del periodo di prova, il piano scelto viene attivato con addebito automatico. La disdetta è possibile in qualsiasi momento dall\'area abbonamento. Non sono previsti rimborsi per periodi già fatturati, salvo obblighi di legge.',
  },
  {
    titolo: '5. Proprietà dei Dati',
    testo: "I dati inseriti dall'utente (clienti, commesse, documenti) rimangono di proprietà esclusiva dell'utente. ${COMPANY} non rivendica diritti sui dati degli utenti. In caso di disdetta, l'utente può richiedere l'esportazione dei propri dati entro 30 giorni dalla cessazione del servizio.",
  },
  {
    titolo: '6. Limitazioni di Responsabilità',
    testo: `${COMPANY} non è responsabile per eventuali perdite di dati derivanti da guasti tecnici, attacchi informatici o cause di forza maggiore. Il Servizio è fornito "così com'è". La responsabilità massima di ${COMPANY} è limitata all'importo pagato dall'utente negli ultimi 3 mesi di servizio.`,
  },
  {
    titolo: '7. Uso Accettabile',
    testo: "È vietato utilizzare il Servizio per attività illegali, per violare diritti di terzi, per distribuire malware o spam, o per sovraccaricare intenzionalmente l'infrastruttura. ${COMPANY} si riserva il diritto di sospendere account che violano queste condizioni senza preavviso.",
  },
  {
    titolo: '8. Modifiche al Servizio',
    testo: `${COMPANY} si riserva il diritto di modificare, sospendere o interrompere qualsiasi parte del Servizio con un preavviso di 30 giorni via email. Modifiche sostanziali ai Termini saranno comunicate via email con almeno 15 giorni di preavviso.`,
  },
  {
    titolo: '9. Legge Applicabile',
    testo: 'I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Tribunale del luogo di residenza del consumatore, ai sensi del D.Lgs. 206/2005 (Codice del Consumo) e del Regolamento UE 2016/679 (GDPR).',
  },
];
