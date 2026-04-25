'use client'

import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// COSTANTI
// ─────────────────────────────────────────────────────────────────────────────
const MESI = {Gen:0,Feb:1,Mar:2,Apr:3,Mag:4,Giu:5,Lug:6,Ago:7,Set:8,Ott:9,Nov:10,Dic:11};
const OGGI = new Date();
const OGGI_STR = OGGI.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
const SPESE_INIT = [
  {id:"s1",cat:"Famiglia",desc:"Affitto Poznań",imp:1200,freq:"mensile",attiva:true},
  {id:"s2",cat:"SaaS Tools",desc:"Vercel Pro",imp:20,freq:"mensile",attiva:true},
  {id:"s3",cat:"SaaS Tools",desc:"Supabase Pro",imp:25,freq:"mensile",attiva:true},
  {id:"s4",cat:"SaaS Tools",desc:"Dominio + DNS",imp:15,freq:"mensile",attiva:true},
  {id:"s5",cat:"Famiglia",desc:"Vitto e spesa",imp:600,freq:"mensile",attiva:true},
  {id:"s6",cat:"Famiglia",desc:"Trasporti",imp:150,freq:"mensile",attiva:true},
  {id:"s7",cat:"Famiglia",desc:"Varie",imp:490,freq:"mensile",attiva:true},
  {id:"s8",cat:"Marketing",desc:"Google Ads",imp:187,freq:"mensile",attiva:true},
  {id:"s9",cat:"Marketing",desc:"Meta Ads",imp:134,freq:"mensile",attiva:true},
];
const CAT_SPESA = {Famiglia:"#2563EB",SaaS_Tools:"#7C3AED","SaaS Tools":"#7C3AED",Marketing:"#D97706",Abbonamenti:"#16A34A",Personale:"#111",Altro:"#9CA3AF"};

const PRI = {
  urgente:{dot:"#555",text:"#111",bg:"#F4F4F4",border:"#E5E5E5"},
  alta:   {dot:"#6B7280",text:"#374151",bg:"#F5F5F5",border:"#E5E5E5"},
  media:  {dot:"#9CA3AF",text:"#6B7280",bg:"#F9F9F9",border:"#E5E5E5"},
  bassa:  {dot:"#D1D5DB",text:"#9CA3AF",bg:"#F9F9F9",border:"#E5E5E5"},
};
const STATO_P = {sviluppo:{l:"In sviluppo",bg:"#F4F4F4",c:"#555"},mvp:{l:"MVP Live",bg:"#111",c:"#fff"},live:{l:"Live",bg:"#111",c:"#fff"}};
const STATO_L = {attiva:{bg:"#F0FDF4",text:"#15803D",dot:"#22C55E",label:"Attiva"},trial:{bg:"#F4F4F4",text:"#555",dot:"#9CA3AF",label:"Trial"},scaduta:{bg:"#F4F4F4",text:"#6B7280",dot:"#9CA3AF",label:"Scaduta"}};
const CAT_EMAIL = {lead:{l:"Lead",bg:"#F0FDF4",c:"#15803D",dot:"#22C55E"},supporto:{l:"Supporto",bg:"#F4F4F4",c:"#555",dot:"#9CA3AF"},pagamento:{l:"Pagamento",bg:"#F4F4F4",c:"#374151",dot:"#111"},ops:{l:"OPS",bg:"#F4F4F4",c:"#374151",dot:"#555"},sistema:{l:"Sistema",bg:"#F4F4F4",c:"#9CA3AF",dot:"#D1D5DB"}};
const REGOLE = [{p:/trial/i,cat:"lead",az:"Rispondi con offerta piano annuale"},{p:/pagamento|fattura|bonifico/i,cat:"pagamento",az:"Registra in Finanza"},{p:/vercel|supabase|deploy|build/i,cat:"sistema",az:"Archivia automaticamente"},{p:/problema|errore|non funziona|non riesco/i,cat:"supporto",az:"Crea task Fabio urgente"},{p:/interesse|vorrei|capire/i,cat:"lead",az:"Crea task Lidia — contatta entro 24h"}];

// ─────────────────────────────────────────────────────────────────────────────
// DATI INIZIALI
// ─────────────────────────────────────────────────────────────────────────────
const T0 = {note:"",subtasks:[],commenti:[],link:"",followup:""};
const INIT_TASKS = {
  fabio:[
    {id:1,testo:"MASTRO ERP — Deploy su Vercel",app:"MASTRO ERP",priorita:"urgente",fatto:false,scadenza:"Oggi",...T0,note:"Zero errori. Solo da pushare.",subtasks:[{t:"Verifica env Vercel",ok:false},{t:"Push branch main",ok:false},{t:"Controlla build log",ok:false}]},
    {id:2,testo:"FRAMEFLOW Session 2 — anagrafica clienti",app:"FRAMEFLOW",priorita:"alta",fatto:false,scadenza:"22 Feb",...T0,subtasks:[{t:"Schema DB clienti",ok:false},{t:"CRUD base",ok:false}]},
    {id:3,testo:"MASTRO MISURE — import Excel per vano",app:"MISURE",priorita:"alta",fatto:false,scadenza:"24 Feb",...T0,note:"3 aziende beta aspettano.",subtasks:[{t:"Parser XLSX",ok:false},{t:"Mapping colonne",ok:false}]},
    {id:4,testo:"Fix bug timer sospensione MONTAGGI",app:"MONTAGGI",priorita:"media",fatto:false,scadenza:"25 Feb",...T0},
    {id:5,testo:"Setup repository GitHub FRAMEFLOW",app:"FRAMEFLOW",priorita:"bassa",fatto:true,scadenza:"",...T0,link:"https://github.com"},
  ],
  lidia:[
    {id:6,testo:"Landing page MONTAGGI con screenshot reali",app:"MONTAGGI",priorita:"urgente",fatto:false,scadenza:"Oggi",...T0,note:"MVP pronto — ogni giorno senza pagina è MRR perso.",subtasks:[{t:"Screenshot da telefono",ok:false},{t:"Carica su landing",ok:false}]},
    {id:7,testo:"Chiama Calabria Infissi — feedback demo",app:"MONTAGGI",priorita:"alta",fatto:false,scadenza:"21 Feb",...T0},
    {id:8,testo:"Trova 5 aziende beta MISURE (ne abbiamo 3)",app:"MISURE",priorita:"alta",fatto:false,scadenza:"28 Feb",...T0,subtasks:[{t:"Russo Serramenti",ok:false},{t:"Ferrara Infissi",ok:false}]},
    {id:9,testo:"Avvia iter apertura SRL Poznań",app:"OPS",priorita:"urgente",fatto:false,scadenza:"Oggi",...T0,note:"Commercialista contattato. Preventivo €800.",subtasks:[{t:"Conferma appuntamento",ok:false},{t:"Prepara documenti",ok:false}]},
    {id:10,testo:"Iscrizione Walter e Lucrezia — scuola",app:"OPS",priorita:"media",fatto:false,scadenza:"Mar 2026",...T0},
    {id:11,testo:"Crea pagina LinkedIn aziendale MASTRO",app:"MKT",priorita:"bassa",fatto:false,scadenza:"",...T0},
  ],
};
const INIT_PROJ = [
  {id:"erp",nome:"MASTRO ERP",cat:"MASTRO",col:"#111",stato:"sviluppo",sess:8,max:53,mrr:0,pr:149,beta:0,sc:"Mese 12",note:"2.379 righe, zero errori. Deploy imminente."},
  {id:"montaggi",nome:"MASTRO MONTAGGI",cat:"MASTRO",col:"#16A34A",stato:"mvp",sess:7,max:8,mrr:117,pr:39,beta:3,sc:"Pronto",note:"Timer + doppia firma live. 3 team attivi."},
  {id:"misure",nome:"MASTRO MISURE",cat:"MASTRO",col:"#D97706",stato:"sviluppo",sess:3,max:8,mrr:0,pr:29,beta:0,sc:"Mese 3",note:"Manca import Excel. TODO: foto per vano."},
  {id:"frameflow",nome:"FRAMEFLOW",cat:"ERP",col:"#2563EB",stato:"sviluppo",sess:1,max:10,mrr:0,pr:149,beta:0,sc:"Mese 8",note:"Session 1 fatta. Piano 10 sessioni completo."},
  {id:"butta",nome:"BUTTA v2",cat:"CONSUMER",col:"#7C3AED",stato:"mvp",sess:6,max:7,mrr:0,pr:9,beta:0,sc:"Mese 4",note:"UI da rivedere. Tab bar mobile in corso."},
  {id:"poltrona",nome:"POLTRONA",cat:"VERTICALE",col:"#DB2777",stato:"mvp",sess:10,max:10,mrr:0,pr:79,beta:0,sc:"Mese 6",note:"10 moduli pronti. Cercare 5 saloni beta."},
];
const INIT_LIC = [
  {id:"l1",prodotto:"MASTRO MONTAGGI",cliente:"Rossi Serramenti",email:"rossi@serr.it",piano:"Pro",pr:39,stato:"attiva",pag:"15 Feb 2026",sc:"15 Mar 2026",seg:[]},
  {id:"l2",prodotto:"MASTRO MONTAGGI",cliente:"Ferrara Infissi",email:"ferrara@inf.it",piano:"Pro",pr:39,stato:"attiva",pag:"10 Feb 2026",sc:"10 Mar 2026",seg:[{id:1,testo:"Timer non funziona su iOS",stato:"aperta",data:"18 Feb",risposta:""}]},
  {id:"l3",prodotto:"MASTRO MONTAGGI",cliente:"Greco & C.",email:"greco@gc.it",piano:"Basic",pr:19,stato:"trial",pag:"—",sc:"25 Feb 2026",seg:[]},
  {id:"l4",prodotto:"MASTRO MISURE",cliente:"Calabria Infissi",email:"info@ci.it",piano:"Pro",pr:29,stato:"trial",pag:"—",sc:"27 Feb 2026",seg:[]},
  {id:"l5",prodotto:"MASTRO MISURE",cliente:"Sud Serramenti",email:"sud@serr.it",piano:"Pro",pr:29,stato:"trial",pag:"—",sc:"01 Mar 2026",seg:[{id:2,testo:"Import Excel non parte",stato:"aperta",data:"20 Feb",risposta:""}]},
];
const INIT_MSG = [
  {id:1,da:"fabio",testo:"Lidia, puoi chiamare Calabria Infissi oggi? Voglio sapere se sono pronti per il beta.",ts:"09:14",trasformato:false},
  {id:2,da:"lidia",testo:"Sì, lo faccio nel pomeriggio. Intanto ho caricato i primi screenshot su Notion per la landing.",ts:"09:31",trasformato:false},
  {id:3,da:"fabio",testo:"Perfetto. Ho deployato la nuova versione MONTAGGI — testala dal telefono.",ts:"10:02",trasformato:false},
  {id:4,da:"lidia",testo:"Ho visto! Il timer ora funziona bene. Una cosa: il PDF finale non si apre su iOS.",ts:"10:28",trasformato:false},
];
const INIT_MOV = [
  {id:1,data:"15 Feb",tipo:"entrata",cat:"MRR",desc:"MONTAGGI — Rossi Serramenti",imp:39},
  {id:2,data:"10 Feb",tipo:"entrata",cat:"MRR",desc:"MONTAGGI — Ferrara Infissi",imp:39},
  {id:3,data:"10 Feb",tipo:"entrata",cat:"Passiva",desc:"NASpI mensile",imp:1200},
  {id:4,data:"01 Feb",tipo:"entrata",cat:"Passiva",desc:"Affitto casa Cosenza",imp:900},
  {id:5,data:"20 Feb",tipo:"uscita",cat:"SaaS",desc:"Vercel Pro",imp:20},
  {id:6,data:"20 Feb",tipo:"uscita",cat:"SaaS",desc:"Supabase Pro",imp:25},
  {id:7,data:"01 Feb",tipo:"uscita",cat:"Affitto",desc:"Appartamento Poznań",imp:1200},
  {id:8,data:"05 Feb",tipo:"uscita",cat:"Vitto",desc:"Spesa famiglia",imp:600},
];
const INIT_EMAIL = [
  {id:1,da:"info@calabriainfissi.it",nome:"Calabria Infissi",oggetto:"Re: Demo MASTRO MISURE",corpo:"Ciao, abbiamo testato la demo. Funziona bene ma vorremmo capire meglio il modulo misure. Possiamo fare una chiamata questa settimana?",data:"20 Feb 10:14",letto:false,cat:"lead",azione:null,prog:"misure"},
  {id:2,da:"rossi@serr.it",nome:"Rossi Serramenti",oggetto:"Problema accesso app",corpo:"Buongiorno, da ieri non riesco ad accedere all'app dal tablet del mio operaio. Dice 'sessione scaduta'. Come si risolve?",data:"20 Feb 09:31",letto:false,cat:"supporto",azione:null,prog:"montaggi"},
  {id:3,da:"ferrara@inf.it",nome:"Ferrara Infissi",oggetto:"Fattura Febbraio",corpo:"Ciao Fabio, ti mando la conferma del pagamento di febbraio. Stiamo valutando di passare al piano Business per avere più utenti.",data:"19 Feb 16:55",letto:true,cat:"pagamento",azione:"registrato",prog:"montaggi"},
  {id:4,da:"marco.greco@gc.it",nome:"Marco Greco",oggetto:"Fine periodo trial",corpo:"Il trial sta per scadere. Volevamo capire se c'è un piano annuale con sconto. Siamo 3 persone in ufficio.",data:"19 Feb 14:20",letto:false,cat:"lead",azione:null,prog:"montaggi"},
  {id:5,da:"noreply@vercel.com",nome:"Vercel",oggetto:"Build #847 succeeded",corpo:"Your deployment fabio-os has been deployed successfully to production.",data:"19 Feb 12:00",letto:true,cat:"sistema",azione:"archiviato",prog:"erp"},
  {id:6,da:"commercialista@studio.it",nome:"Studio Bianchi",oggetto:"Documenti SRL Poznań",corpo:"Ho preparato la documentazione per la SRL. Ho bisogno di: 1) Copia passaporto 2) Codice fiscale 3) Indirizzo Poznań definitivo.",data:"18 Feb 11:00",letto:false,cat:"ops",azione:null,prog:null},
];
const TEMPLATES = [
  {id:"t1",nome:"Benvenuto trial",cat:"onboarding",oggetto:"Benvenuto in {{prodotto}} — inizia subito!",corpo:"Ciao {{nome}},\n\nGrazie per aver attivato il trial di {{prodotto}}. Hai 14 giorni per scoprire tutte le funzionalità.\n\nSe hai domande, rispondi pure a questa email. Siamo qui!\n\nFabio\nMASTRO"},
  {id:"t2",nome:"Scadenza trial",cat:"commercial",oggetto:"Il tuo trial {{prodotto}} scade tra 3 giorni",corpo:"Ciao {{nome}},\n\nIl tuo trial di {{prodotto}} scade tra 3 giorni.\n\nPer continuare senza interruzioni, attiva il piano Pro a €{{prezzo}}/mese.\n\n👉 Attiva ora: https://mastro.app/upgrade\n\nHai domande sul piano? Rispondi a questa email.\n\nFabio"},
  {id:"t3",nome:"Offerta annuale",cat:"commercial",oggetto:"Risparmia il 20% con il piano annuale",corpo:"Ciao {{nome}},\n\nSolo per questa settimana: attiva il piano annuale di {{prodotto}} e risparmia il 20%.\n\n✅ Piano annuale: €{{prezzoAnnuale}}/anno (invece di €{{prezzoMensile*12}})\n\nL'offerta scade venerdì 28 febbraio.\n\nFabio"},
  {id:"t4",nome:"Auguri compleanno",cat:"relazione",oggetto:"🎂 Tanti auguri {{nome}}!",corpo:"Ciao {{nome}},\n\nTanti auguri di buon compleanno!\n\nIn occasione del tuo compleanno, abbiamo attivato 30 giorni gratuiti aggiuntivi sul tuo account.\n\nBuona giornata!\nFabio & team MASTRO"},
  {id:"t5",nome:"Aggiornamento prodotto",cat:"update",oggetto:"Novità {{prodotto}} — Versione {{versione}}",corpo:"Ciao {{nome}},\n\nAbbiamo rilasciato una nuova versione di {{prodotto}} con queste novità:\n\n• [funzione 1]\n• [funzione 2]\n• [bug fix]\n\nL'aggiornamento è già attivo sul tuo account. Nessuna azione richiesta.\n\nFabio"},
  {id:"t6",nome:"Richiesta feedback",cat:"relazione",oggetto:"Come stai trovando {{prodotto}}?",corpo:"Ciao {{nome}},\n\nSono Fabio, il fondatore di MASTRO. Stai usando {{prodotto}} da un po' e mi piacerebbe sapere come va.\n\nUna domanda sola: cosa cambieresti?\n\nRispondi direttamente a questa email — leggo tutto personalmente.\n\nGrazie,\nFabio"},
  {id:"t7",nome:"Offerta massiva",cat:"commercial",oggetto:"Offerta speciale MASTRO — Solo per te",corpo:"Ciao {{nome}},\n\nTi scrivo perché sei già cliente MASTRO e voglio darti un'offerta riservata.\n\n🔥 Aggiungi un modulo aggiuntivo a metà prezzo per i prossimi 30 giorni.\n\nRispondi a questa email per attivare l'offerta.\n\nFabio"},
  {id:"t8",nome:"Follow-up silenzio",cat:"commercial",oggetto:"Ancora disponibile per una chiamata",corpo:"Ciao {{nome}},\n\nSettimana scorsa ti avevo scritto per [motivo]. Non ho ricevuto risposta.\n\nSe non è il momento giusto va benissimo — dimmelo e non disturbo più.\n\nAltrimenti sono disponibile questa settimana per una chiamata di 15 minuti.\n\nFabio"},
];
const CAT_TEMPLATE = {onboarding:{l:"Onboarding",c:"#2563EB"},commercial:{l:"Commercial",c:"#D97706"},relazione:{l:"Relazione",c:"#7C3AED"},update:{l:"Update",c:"#16A34A"}};

const LAB = [
  {id:"filo",nome:"FILO",tag:"Consumer · AI",stelle:5,quando:"Dopo MASTRO",nota:"Universal inbox — WhatsApp, Gmail, voice."},
  {id:"voce",nome:"MASTRO VOCE",tag:"MASTRO · AI",stelle:5,quando:"Fase 2",nota:"AI vocale che guida il sopralluogo."},
  {id:"marketplace",nome:"MASTRO MARKETPLACE",tag:"MASTRO · B2B",stelle:5,quando:"Mese 12-15",nota:"Commissioni 2-5%. Richiede massa critica."},
  {id:"risolto",nome:"RISOLTO",tag:"B2B · AI",stelle:4,quando:"Media priorità",nota:"Problem mgmt PMI. Segnala→triage→archivio."},
  {id:"pratiche",nome:"MASTRO PRATICHE",tag:"MASTRO · Burocratica",stelle:4,quando:"Mese 8",nota:"ENEA, Ecobonus, SCIA."},
  {id:"mio",nome:"MIO v11",tag:"Consumer · Social",stelle:3,quando:"Bassa priorità",nota:"Social privato. Cose Decise come killer."},
  {id:"scuola",nome:"SCUOLA VIVA",tag:"EdTech · Family",stelle:3,quando:"Uso familiare",nota:"Homeschooling AI per Walter e Lucrezia."},
  {id:"famiglia",nome:"PROGETTO FAMIGLIA",tag:"Consumer · Travel",stelle:2,quando:"Bassa priorità",nota:"Diario viaggi privato. €3/mese."},
];

// ─────────────────────────────────────────────────────────────────────────────
// DATI CAMPAGNE
// ─────────────────────────────────────────────────────────────────────────────
const CANALI = {
  google:   {l:"Google Ads",   col:"#4285F4", icon:"G"},
  meta:     {l:"Meta Ads",     col:"#1877F2", icon:"M"},
  linkedin: {l:"LinkedIn Ads", col:"#0A66C2", icon:"in"},
  email:    {l:"Email Mkt",    col:"#111",    icon:"@"},
  seo:      {l:"SEO Organico", col:"#16A34A", icon:"↑"},
  youtube:  {l:"YouTube Ads",  col:"#FF0000", icon:"▶"},
};
const OBJ = {lead:"Leads",trial:"Trial",brand:"Brand",traffico:"Traffico",retention:"Retention"};
const INIT_CAMP = [
  {
    id:"c1",nome:"MONTAGGI — Google Search",canale:"google",progetto:"montaggi",
    obiettivo:"trial",stato:"attiva",
    budget_totale:500,speso:187,
    data_inizio:"01 Feb 2026",data_fine:"28 Feb 2026",
    impressioni:12400,click:341,conversioni:8,leads:8,trial:3,
    cpc:0.55,ctr:2.75,cpa:23.38,roas:0,
    note:"Parole chiave: 'software montaggio serramenti', 'app tecnici infissi'. CTR buono, CPA da ottimizzare.",
    creativita:[
      {id:"cr1",tipo:"testo",titolo:"Gestisci i tuoi montaggi da mobile",stato:"attiva",click:198,conversioni:5},
      {id:"cr2",tipo:"testo",titolo:"Timer e report PDF automatici",stato:"attiva",click:143,conversioni:3},
    ],
    storia:[
      {data:"01 Feb",speso:0,click:0,conv:0},
      {data:"07 Feb",speso:42,click:78,conv:2},
      {data:"14 Feb",speso:98,click:187,conv:5},
      {data:"20 Feb",speso:187,click:341,conv:8},
    ],
  },
  {
    id:"c2",nome:"MONTAGGI — Meta Retargeting",canale:"meta",progetto:"montaggi",
    obiettivo:"trial",stato:"attiva",
    budget_totale:200,speso:134,
    data_inizio:"05 Feb 2026",data_fine:"28 Feb 2026",
    impressioni:48200,click:512,conversioni:6,leads:6,trial:2,
    cpc:0.26,ctr:1.06,cpa:22.33,roas:0,
    note:"Audience: proprietari attività edili, 30-55 anni, Italia. Retargeting su chi ha visitato la landing.",
    creativita:[
      {id:"cr3",tipo:"immagine",titolo:"Video demo timer 30sec",stato:"attiva",click:321,conversioni:4},
      {id:"cr4",tipo:"carosello",titolo:"3 problemi → 3 soluzioni",stato:"pausa",click:191,conversioni:2},
    ],
    storia:[
      {data:"05 Feb",speso:0,click:0,conv:0},
      {data:"10 Feb",speso:38,click:142,conv:1},
      {data:"15 Feb",speso:87,click:312,conv:4},
      {data:"20 Feb",speso:134,click:512,conv:6},
    ],
  },
  {
    id:"c3",nome:"MISURE — LinkedIn B2B",canale:"linkedin",progetto:"misure",
    obiettivo:"lead",stato:"pausa",
    budget_totale:300,speso:78,
    data_inizio:"10 Feb 2026",data_fine:"15 Mar 2026",
    impressioni:5800,click:87,conversioni:3,leads:3,trial:1,
    cpc:0.90,ctr:1.50,cpa:26.00,roas:0,
    note:"Target: titolari aziende serramenti 5-50 dipendenti. CPL alto ma qualità lead buona. In pausa per ottimizzare copy.",
    creativita:[
      {id:"cr5",tipo:"testo",titolo:"Dai foglio Excel all'app misure",stato:"pausa",click:87,conversioni:3},
    ],
    storia:[
      {data:"10 Feb",speso:0,click:0,conv:0},
      {data:"15 Feb",speso:78,click:87,conv:3},
      {data:"20 Feb",speso:78,click:87,conv:3},
    ],
  },
  {
    id:"c4",nome:"Email — Onboarding trial MONTAGGI",canale:"email",progetto:"montaggi",
    obiettivo:"retention",stato:"attiva",
    budget_totale:0,speso:0,
    data_inizio:"01 Feb 2026",data_fine:"—",
    impressioni:0,click:0,conversioni:0,leads:0,trial:0,
    aperture:18,click_email:7,tasso_apertura:60,tasso_click:39,disiscritti:0,
    cpc:0,ctr:0,cpa:0,roas:0,
    note:"Sequenza 5 email automatica per nuovi trial. Giorno 1 benvenuto, giorno 3 tip avanzato, giorno 7 offerta conversione.",
    creativita:[
      {id:"cr6",tipo:"email",titolo:"Benvenuto — come iniziare",stato:"attiva",click:18,conversioni:0},
      {id:"cr7",tipo:"email",titolo:"Tip: come usare i report PDF",stato:"attiva",click:12,conversioni:0},
      {id:"cr8",tipo:"email",titolo:"Il tuo trial scade tra 3 giorni",stato:"attiva",click:7,conversioni:2},
    ],
    storia:[
      {data:"01 Feb",speso:0,click:0,conv:0},
      {data:"10 Feb",speso:0,click:4,conv:0},
      {data:"15 Feb",speso:0,click:7,conv:1},
      {data:"20 Feb",speso:0,click:7,conv:2},
    ],
  },
  {
    id:"c5",nome:"SEO — Blog serramenti digitali",canale:"seo",progetto:"erp",
    obiettivo:"traffico",stato:"pianificata",
    budget_totale:200,speso:0,
    data_inizio:"01 Mar 2026",data_fine:"01 Sep 2026",
    impressioni:0,click:0,conversioni:0,leads:0,trial:0,
    cpc:0,ctr:0,cpa:0,roas:0,
    note:"Piano editoriale: 2 articoli/mese su software gestionale serramenti, digitalizzazione PMI, ERP artigiani. Da iniziare a Marzo.",
    creativita:[
      {id:"cr9",tipo:"articolo",titolo:"Come digitalizzare una serramenteria in 30 giorni",stato:"bozza",click:0,conversioni:0},
      {id:"cr10",tipo:"articolo",titolo:"Excel vs ERP: quando è il momento di cambiare",stato:"bozza",click:0,conversioni:0},
    ],
    storia:[],
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function parseData(str) {
  if(!str||str==="—") return null;
  if(str==="Oggi") return OGGI;
  const m1=str.match(/^(\d+)\s+(\w+)/);
  if(m1){const mi=MESI[m1[2]];if(mi!==undefined)return new Date(2026,mi,parseInt(m1[1]));}
  const m2=str.match(/^(\w+)\s+(\d{4})/);
  if(m2){const mi=MESI[m2[1]];if(mi!==undefined)return new Date(parseInt(m2[2]),mi,1);}
  return null;
}
function buildCF(mrrBase,risparmio,spese,passive){
  const sc={ott:0.25,real:0.12,pess:0.04};
  let cassa={ott:risparmio,real:risparmio,pess:risparmio};
  let mrr={ott:mrrBase,real:mrrBase,pess:mrrBase};
  const mesi=["Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic","Gen27","Feb27"];
  return mesi.map(m=>{
    Object.keys(sc).forEach(k=>{mrr[k]*=(1+sc[k]);const b=Math.max(0,spese-passive-mrr[k]);cassa[k]=Math.max(0,cassa[k]-b);});
    return{mese:m,ott:Math.round(mrr.ott),real:Math.round(mrr.real),pess:Math.round(mrr.pess),cOtt:Math.round(cassa.ott),cReal:Math.round(cassa.real),cPess:Math.round(cassa.pess)};
  });
}
const fmt = s=>`${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor(s/60)%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const FILE_ICONS = {jsx:"⚛",js:"📜",ts:"📘",tsx:"⚛",json:"{}",css:"🎨",html:"🌐",md:"📝",txt:"📄",github:"🐙",drive:"📁",notion:"◻",link:"🔗",binary:"📎"};

// ─────────────────────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ICONS = {
  oggi:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  progetti:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  calendario:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  messaggi:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  email:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  licenze:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>,
  finanza:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  lab:       <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 3h6M10 3v6l-4 9a1 1 0 00.93 1.36h10.14A1 1 0 0018 18L14 9V3"/></svg>,
  file:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>,
  campagne:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
};
const NAV = [
  {id:"oggi",l:"Oggi"},{id:"progetti",l:"Progetti"},{id:"calendario",l:"Calendario"},
  {id:"messaggi",l:"Messaggi"},{id:"email",l:"Email"},{id:"licenze",l:"Licenze"},
  {id:"finanza",l:"Finanza"},{id:"campagne",l:"Campagne"},{id:"lab",l:"Lab Idee"},{id:"file",l:"File"},
];

// ─────────────────────────────────────────────────────────────────────────────
// MICRO COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const Lbl  = ({c})=><div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>{c}</div>;
const Nota = ({c})=><div style={{fontSize:12,color:"#C5C5C5",fontStyle:"italic",marginBottom:6}}>{c}</div>;
const Btn  = ({onClick,children,style:s={}})=><button onClick={onClick} style={{padding:"6px 12px",background:"#111",color:"#fff",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",...s}}>{children}</button>;
const BtnG = ({onClick,children,style:s={}})=><button onClick={onClick} style={{padding:"6px 12px",background:"#fff",color:"#6B7280",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,cursor:"pointer",...s}}>{children}</button>;
const Chevron = ({open})=><svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{flexShrink:0,transform:open?"rotate(180deg)":"rotate(0)",transition:"transform .2s",color:"#9CA3AF"}}><path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────────────────────────────────────
function TaskCard({t,chi,onCheck,onPatch,onCoinvolgi}){
  const [open,setOpen]=useState(false);
  const [editNote,setEditNote]=useState(false);
  const [noteV,setNoteV]=useState(t.note);
  const [linkV,setLinkV]=useState(t.link);
  const [fuV,setFuV]=useState(t.followup);
  const [scV,setScV]=useState(t.scadenza);
  const [newSub,setNewSub]=useState("");
  const [newCom,setNewCom]=useState("");
  const p=PRI[t.priorita]||PRI.media;
  const sd=t.subtasks.filter(s=>s.ok).length;
  const addSub=()=>{if(!newSub.trim())return;onPatch(chi,t.id,{subtasks:[...t.subtasks,{t:newSub.trim(),ok:false}]});setNewSub("");};
  const togSub=i=>{const s=[...t.subtasks];s[i]={...s[i],ok:!s[i].ok};onPatch(chi,t.id,{subtasks:s});};
  const delSub=i=>onPatch(chi,t.id,{subtasks:t.subtasks.filter((_,j)=>j!==i)});
  const addCom=()=>{if(!newCom.trim())return;const ora=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});onPatch(chi,t.id,{commenti:[...t.commenti,{testo:newCom.trim(),chi,ora}]});setNewCom("");};
  return(
    <div style={{border:`1px solid ${open?"#111":p.border}`,borderRadius:11,background:"#fff",marginBottom:7,overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
        <div onClick={e=>{e.stopPropagation();onCheck(chi,t.id);}} style={{width:18,height:18,borderRadius:5,border:`2px solid ${t.fatto?"#22C55E":"#D1D5DB"}`,background:t.fatto?"#22C55E":"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          {t.fatto&&<svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:t.fatto?"#9CA3AF":"#111",textDecoration:t.fatto?"line-through":"none",lineHeight:1.4}}>{t.testo}</div>
          {!t.fatto&&(
            <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:p.bg,color:p.text}}>
                <span style={{width:5,height:5,borderRadius:"50%",background:p.dot,display:"inline-block"}}/>{t.priorita}
              </span>
              <span style={{fontSize:10,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>{t.app}</span>
              {t.scadenza&&<span style={{fontSize:10,color:t.scadenza==="Oggi"?"#555":"#9CA3AF",fontWeight:600}}>📅 {t.scadenza}</span>}
              {t.subtasks.length>0&&<span style={{fontSize:10,color:"#9CA3AF"}}>◻ {sd}/{t.subtasks.length}</span>}
              {t.commenti.length>0&&<span style={{fontSize:10,color:"#9CA3AF"}}>💬 {t.commenti.length}</span>}
              {t.link&&<span style={{fontSize:10,color:"#9CA3AF"}}>🔗</span>}
              {t.followup&&<span style={{fontSize:10,color:"#7C3AED",fontWeight:600}}>↩</span>}
            </div>
          )}
        </div>
        <Chevron open={open}/>
      </div>
      {open&&(
        <div style={{borderTop:"1px solid #F0F0F0",background:"#FAFAFA",padding:16}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
            <div>
              <Lbl c="Subtask"/>
              {t.subtasks.map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #F0F0F0"}}>
                  <div onClick={()=>togSub(i)} style={{width:15,height:15,borderRadius:4,border:`2px solid ${s.ok?"#22C55E":"#D1D5DB"}`,background:s.ok?"#22C55E":"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {s.ok&&<svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3.5 6L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{flex:1,fontSize:12,color:s.ok?"#9CA3AF":"#374151",textDecoration:s.ok?"line-through":"none"}}>{s.t}</span>
                  <button onClick={()=>delSub(i)} style={{background:"none",border:"none",color:"#D1D5DB",fontSize:15,cursor:"pointer"}}>×</button>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <input value={newSub} onChange={e=>setNewSub(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSub()} placeholder="Aggiungi subtask..."
                  style={{flex:1,padding:"6px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,outline:"none",background:"#fff"}}/>
                <Btn onClick={addSub}>+</Btn>
              </div>
              <div style={{marginTop:14}}>
                <Lbl c="Note"/>
                {editNote?(
                  <div>
                    <textarea value={noteV} onChange={e=>setNoteV(e.target.value)} rows={3} style={{width:"100%",padding:"7px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,outline:"none",resize:"none",background:"#fff"}}/>
                    <div style={{display:"flex",gap:6,marginTop:6}}>
                      <Btn onClick={()=>{onPatch(chi,t.id,{note:noteV});setEditNote(false);}}>Salva</Btn>
                      <BtnG onClick={()=>setEditNote(false)}>Annulla</BtnG>
                    </div>
                  </div>
                ):(
                  <div onClick={()=>setEditNote(true)} style={{fontSize:12,color:t.note?"#374151":"#C0BFBD",padding:"8px 10px",border:"1px dashed #E5E5E5",borderRadius:7,cursor:"text",lineHeight:1.6,background:"#fff",minHeight:52}}>
                    {t.note||"Aggiungi una nota..."}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Lbl c="Dettagli"/>
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
                {[["Progetto",<b style={{fontSize:12}}>{t.app}</b>],["Priorità",<span style={{fontSize:12,fontWeight:700,color:p.text}}>{t.priorita}</span>],["Assegnato",<span style={{fontSize:12,fontWeight:600}}>{chi==="fabio"?"Fabio":"Lidia"}</span>]].map(([k,v])=>(
                  <div key={k} style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:11,color:"#9CA3AF",width:68,flexShrink:0}}>{k}</span><div style={{flex:1}}>{v}</div></div>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:"#9CA3AF",width:68,flexShrink:0}}>Scadenza</span>
                  <input value={scV} onChange={e=>setScV(e.target.value)} onBlur={()=>onPatch(chi,t.id,{scadenza:scV})}
                    style={{border:"none",borderBottom:"1px solid #E5E5E5",background:"transparent",fontSize:12,fontWeight:600,color:"#374151",outline:"none",width:90}} placeholder="Aggiungi..."/>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:"#9CA3AF",width:68,flexShrink:0}}>Coinvolgi</span>
                  <button onClick={()=>onCoinvolgi(chi,t)} style={{padding:"3px 10px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,fontWeight:600,color:"#555",cursor:"pointer"}}>
                    → Chiedi a {chi==="fabio"?"Lidia":"Fabio"}
                  </button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,color:"#9CA3AF",width:68,flexShrink:0}}>Link</span>
                  <input value={linkV} onChange={e=>setLinkV(e.target.value)} onBlur={()=>onPatch(chi,t.id,{link:linkV})}
                    style={{border:"none",borderBottom:"1px solid #E5E5E5",background:"transparent",fontSize:12,color:"#2563EB",outline:"none",flex:1}} placeholder="Incolla URL..."/>
                </div>
                {t.link&&<div style={{paddingLeft:78}}><a href={t.link} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#2563EB"}}>Apri link ↗</a></div>}
              </div>
              <Lbl c="Follow-up"/>
              <div style={{display:"flex",gap:6,marginBottom:4}}>
                <input value={""} placeholder="📅 Data follow-up" type="date"
                  style={{padding:"5px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,outline:"none",color:"#7C3AED",width:150}}/>
                <input placeholder="Ora" type="time"
                  style={{padding:"5px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,outline:"none",color:"#7C3AED",width:90}}/>
              </div>
              <textarea value={fuV} onChange={e=>setFuV(e.target.value)} onBlur={()=>onPatch(chi,t.id,{followup:fuV})} rows={2} placeholder="Es: Richiamare martedì…" 
                style={{width:"100%",padding:"7px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,outline:"none",resize:"none",background:"#fff",color:"#7C3AED",marginBottom:12}}/>
              <Lbl c="Commenti"/>
              <div style={{maxHeight:90,overflowY:"auto",marginBottom:8}}>
                {t.commenti.length===0?<Nota c="Nessun commento"/>:t.commenti.map((c,i)=>(
                  <div key={i} style={{padding:"5px 0",borderBottom:"1px solid #F0F0F0"}}>
                    <span style={{fontSize:11,fontWeight:700}}>{c.chi==="fabio"?"Fabio":"Lidia"}</span>
                    <span style={{fontSize:10,color:"#9CA3AF",marginLeft:6}}>{c.ora}</span>
                    <div style={{fontSize:12,color:"#374151",marginTop:2}}>{c.testo}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:6}}>
                <input value={newCom} onChange={e=>setNewCom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCom()} placeholder="Aggiungi commento..."
                  style={{flex:1,padding:"6px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,outline:"none",background:"#fff"}}/>
                <Btn onClick={addCom}>↵</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────
export default function FabioOS(){
  // ── State ──────────────────────────────────────────────────────────────────
  const [sez,setSez]=useState("oggi");
  const [tasks,setTasks]=useState(INIT_TASKS);
  const [proj,setProj]=useState(INIT_PROJ);
  const [lic,setLic]=useState(INIT_LIC);
  const [msg,setMsg]=useState(INIT_MSG);
  const [mov,setMov]=useState(INIT_MOV);
  const [emails,setEmails]=useState(INIT_EMAIL);
  const [persona,setPersona]=useState("entrambi");
  const [sess,setSess]=useState(null);
  const [sesT,setSesT]=useState(0);
  const [openP,setOpenP]=useState(null);
  const [projTab,setProjTab]=useState({});
  const [newLink,setNewLink]=useState({});
  const [files,setFiles]=useState({});
  const [viewFile,setViewFile]=useState(null);
  const [openLab,setOpenLab]=useState(null);
  const [filtroL,setFiltroL]=useState("tutti");
  const [licAp,setLicAp]=useState(null);
  const [newSeg,setNewSeg]=useState({});
  const [risp,setRisp]=useState({});
  const [msgIn,setMsgIn]=useState("");
  const [utente,setUtente]=useState("fabio");
  const [emailTab,setEmailTab]=useState("inbox");
  const [emailAp,setEmailAp]=useState(null);
  const [newEmailOpen,setNewEmailOpen]=useState(false);
  const [draft,setDraft]=useState({a:"",oggetto:"",corpo:"",allegati:[],programmata:"",tplId:null});
  const [calMese,setCalMese]=useState(new Date(2026,1,1));
  const [calVista,setCalVista]=useState("mese");
  const [calGiorno,setCalGiorno]=useState(new Date(2026,1,20));
  const [selGio,setSelGio]=useState(null);
  const [evAp,setEvAp]=useState(null);
  const [finTab,setFinTab]=useState("overview");
  const [simCli,setSimCli]=useState({erp:0,montaggi:0,misure:0,frameflow:0});
  const [newMov,setNewMov]=useState(false);
  const [nmF,setNmF]=useState({tipo:"entrata",desc:"",imp:""});
  const [newT,setNewT]=useState(false);
  const [nf,setNf]=useState({chi:"fabio",testo:"",app:"",priorita:"alta",scadenza:""});
  const [showImp,setShowImp]=useState(false);
  const [impTxt,setImpTxt]=useState("");
  const [impMsg,setImpMsg]=useState(null);
  const [storOk,setStorOk]=useState(false);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [spese,setSpese]=useState(SPESE_INIT);
  const [newSpesa,setNewSpesa]=useState({desc:"",cat:"Famiglia",imp:"",freq:"mensile"});
  const [speseOpen,setSpeseOpen]=useState(false);
  const [finSection,setFinSection]=useState("overview");
  const [movSection,setMovSection]=useState("tutti");
  const [newMovOpen,setNewMovOpen]=useState(false);
  const [nm,setNm]=useState({tipo:"uscita",cat:"SaaS Tools",desc:"",imp:""});
  const [camp,setCamp]=useState(INIT_CAMP);
  const [campAp,setCampAp]=useState(null);
  const [campTab,setCampTab]=useState("panoramica");
  const [campDetTab,setCampDetTab]=useState({});
  const [newCampOpen,setNewCampOpen]=useState(false);
  const [nc,setNc]=useState({nome:"",canale:"google",progetto:"",obiettivo:"trial",budget_totale:0,data_inizio:"",data_fine:"",note:""});
  const [emailSection,setEmailSection]=useState("inbox"); // inbox|template|massive|programmata
  const [templateAp,setTemplateAp]=useState(null);
  const [templates,setTemplates]=useState(TEMPLATES);
  const [editTpl,setEditTpl]=useState(null); // {id,nome,oggetto,corpo}
  const [massiveOpen,setMassiveOpen]=useState(false);
  const [massiveTpl,setMassiveTpl]=useState(null);
  const [massiveDest,setMassiveDest]=useState([]);
  const [massive3Data,setMassive3Data]=useState("");
  const [scheduledEmails,setScheduledEmails]=useState([]);
  const sesRef=useRef(null);
  const msgEnd=useRef(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  const mrr=proj.reduce((s,p)=>s+p.mrr,0);
  const speseAttive=spese.filter(s=>s.attiva);
  const speseTot=speseAttive.reduce((s,x)=>s+x.imp,0);
  const entratePas=2100; // NASpI + affitto passivo
  const burn=Math.max(0,speseTot-entratePas-mrr);
  const runway=burn>0?Math.floor(130000/burn):459;
  const bk=Math.min(100,Math.round(mrr/2500*100));
  const cf=buildCF(mrr,130000,speseTot,2100);
  const urgenti=[...tasks.fabio,...tasks.lidia].filter(t=>!t.fatto&&t.priorita==="urgente");
  const msgUnread=msg.filter(m=>m.da!==utente&&!m.trasformato).length;
  const emailUnread=emails.filter(e=>!e.letto&&!e.azione).length;

  // Calendario eventi
  const evAll=[];
  [...tasks.fabio.map(t=>({...t,chi:"fabio"})),...tasks.lidia.map(t=>({...t,chi:"lidia"}))].forEach(t=>{
    if(t.fatto||!t.scadenza)return;
    const d=parseData(t.scadenza);if(!d)return;
    evAll.push({id:"t"+t.id,tipo:"task",data:d,titolo:t.testo,chi:t.chi,priorita:t.priorita,col:t.chi==="fabio"?"#111":"#555"});
  });
  lic.forEach(l=>{const d=parseData(l.sc);if(d)evAll.push({id:"l"+l.id,tipo:"licenza",data:d,titolo:l.cliente+" — "+l.prodotto,col:l.stato==="trial"?"#9CA3AF":"#15803D"});});

  // Calendario mese
  const calAnno=calMese.getFullYear(),calM=calMese.getMonth();
  const nomeMese=calMese.toLocaleDateString("it-IT",{month:"long",year:"numeric"});
  const primoGio=new Date(calAnno,calM,1).getDay();
  const inizioLun=(primoGio+6)%7;
  const giorniM=new Date(calAnno,calM+1,0).getDate();
  const evPerGio={};
  evAll.forEach(ev=>{if(ev.data.getFullYear()===calAnno&&ev.data.getMonth()===calM){const g=ev.data.getDate();if(!evPerGio[g])evPerGio[g]=[];evPerGio[g].push(ev);}});
  const evSel=selGio?(evPerGio[selGio]||[]):[];
  const prossimi=evAll.filter(ev=>ev.data>=OGGI).sort((a,b)=>a.data-b.data).slice(0,10);
  const cells=[];for(let i=0;i<inizioLun;i++)cells.push(null);for(let i=1;i<=giorniM;i++)cells.push(i);while(cells.length%7!==0)cells.push(null);
  const weeks=[];for(let i=0;i<cells.length;i+=7)weeks.push(cells.slice(i,i+7));

  // Settimana
  const lunSett=new Date(calGiorno);lunSett.setDate(calGiorno.getDate()-((calGiorno.getDay()+6)%7));
  const giorniSett=Array.from({length:7},(_,i)=>{const d=new Date(lunSett);d.setDate(lunSett.getDate()+i);return d;});
  const oreGiorno=Array.from({length:14},(_,i)=>i+8);

  // Finanza
  const totEnt=mov.filter(m=>m.tipo==="entrata").reduce((s,m)=>s+m.imp,0);
  const totUsc=mov.filter(m=>m.tipo==="uscita").reduce((s,m)=>s+m.imp,0);
  const simMRR=mrr+simCli.erp*149+simCli.montaggi*39+simCli.misure*29+simCli.frameflow*149;
  const simBurn=Math.max(0,speseTot-2100-simMRR);
  const simRun=simBurn>0?Math.floor(130000/simBurn):99;

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(sess)sesRef.current=setInterval(()=>setSesT(t=>t+1),1000);
    else clearInterval(sesRef.current);
    return()=>clearInterval(sesRef.current);
  },[sess]);
useEffect(()=>{try{const raw=localStorage.getItem("fabios_state_v1");if(raw){const d=JSON.parse(raw);if(d.tasks)setTasks(d.tasks);if(d.progetti)setProj(d.progetti);if(d.licenze)setLic(d.licenze);if(d.movimenti)setMov(d.movimenti);if(d.spese)setSpese(d.spese);if(d.messaggi)setMsg(d.messaggi);if(d.campagne)setCamp(d.campagne);}}catch(e){}finally{setDbLoaded(true);}},[]);
useEffect(()=>{if(!dbLoaded)return;try{localStorage.setItem("fabios_state_v1",JSON.stringify({tasks,progetti:proj,licenze:lic,movimenti:mov,spese,messaggi:msg,campagne:camp}));}catch(e){}},[tasks,proj,lic,mov,spese,msg,camp,dbLoaded]);
  useEffect(()=>{if(!storOk)return;(async()=>{try{await window.storage.set("fabios-files",JSON.stringify(files));}catch(e){}})();},[files,storOk]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const checkTask=(c,id)=>setTasks(t=>({...t,[c]:t[c].map(x=>x.id===id?{...x,fatto:!x.fatto}:x)}));
  const patchTask=(c,id,d)=>setTasks(t=>({...t,[c]:t[c].map(x=>x.id===id?{...x,...d}:x)}));
  const addTask=()=>{
    if(!nf.testo)return;
    const n={id:Date.now(),testo:nf.testo,app:nf.app||"—",priorita:nf.priorita,scadenza:nf.scadenza,fatto:false,...T0};
    setTasks(t=>({...t,[nf.chi]:[n,...t[nf.chi]]}));
    setNewT(false);setNf({chi:"fabio",testo:"",app:"",priorita:"alta",scadenza:""});
  };
  const coinvolgi=(chi,t)=>{
    const ts=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
    setMsg(ms=>[...ms,{id:Date.now(),da:chi,testo:`Ho bisogno del tuo aiuto su: "${t.testo}"`,ts,trasformato:false,taskRef:t.id}]);
    setSez("messaggi");
  };
  const inviaMsg=()=>{
    if(!msgIn.trim())return;
    const ts=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
    setMsg(ms=>[...ms,{id:Date.now(),da:utente,testo:msgIn.trim(),ts,trasformato:false}]);
    setMsgIn("");
    setTimeout(()=>msgEnd.current?.scrollIntoView({behavior:"smooth"}),50);
  };
  const trasforma=(m,assegnaA)=>{
    const neo={id:Date.now(),testo:m.testo,app:"Messaggi",priorita:"alta",scadenza:"",fatto:false,...T0,note:`Da msg di ${m.da==="fabio"?"Fabio":"Lidia"} (${m.ts})`};
    setTasks(t=>({...t,[assegnaA]:[neo,...t[assegnaA]]}));
    setMsg(ms=>ms.map(x=>x.id===m.id?{...x,trasformato:true,taskChi:assegnaA}:x));
  };
  const chiudiSess=()=>{setProj(ps=>ps.map(p=>p.id===sess.id?{...p,sess:Math.min(p.sess+1,p.max)}:p));setSess(null);setSesT(0);};
  const doImport=()=>{
    try{
      const d=JSON.parse(impTxt);
      if(d.progetti)setProj(ps=>{const ids=ps.map(p=>p.id);return[...ps.map(p=>{const a=d.progetti.find(x=>x.id===p.id);return a?{...p,...a}:p;}),...d.progetti.filter(p=>!ids.includes(p.id))];});
      if(d.taskFabio)setTasks(t=>({...t,fabio:[...d.taskFabio.map((x,i)=>({id:Date.now()+i,...T0,...x})),...t.fabio]}));
      if(d.taskLidia)setTasks(t=>({...t,lidia:[...d.taskLidia.map((x,i)=>({id:Date.now()+100+i,...T0,...x})),...t.lidia]}));
      setImpMsg({ok:true,msg:"✓ Importato con successo"});
      setTimeout(()=>{setShowImp(false);setImpTxt("");setImpMsg(null);},2000);
    }catch(e){setImpMsg({ok:false,msg:"✗ JSON non valido"});}
  };
  const addFile=(pid,f)=>setFiles(fs=>({...fs,[pid]:[...(fs[pid]||[]),f]}));
  const removeFile=(pid,fid)=>setFiles(fs=>({...fs,[pid]:(fs[pid]||[]).filter(x=>x.id!==fid)}));
  const getPT=(id)=>projTab[id]||"info";
  const setPT=(pid,tab)=>setProjTab(p=>({...p,[pid]:tab}));

  // Etichetta calendario
  const etVista=calVista==="mese"?nomeMese:calVista==="settimana"?`${lunSett.getDate()} — ${giorniSett[6].getDate()} ${giorniSett[6].toLocaleDateString("it-IT",{month:"long"})}`
    :calGiorno.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"});
  const navCal=(dir)=>{
    if(calVista==="mese")setCalMese(new Date(calAnno,calM+dir,1));
    else if(calVista==="settimana"){const d=new Date(calGiorno);d.setDate(d.getDate()+dir*7);setCalGiorno(d);}
    else{const d=new Date(calGiorno);d.setDate(d.getDate()+dir);setCalGiorno(d);}
  };

  // CSS
  const css=`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}button{cursor:pointer;font-family:inherit;}input,textarea,select{font-family:inherit;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#DDD;border-radius:4px;}
.fade{animation:fd .18s ease;}@keyframes fd{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.card{background:#fff;border:1px solid #E5E5E5;border-radius:14px;}
.bar{height:5px;background:#EBEBEB;border-radius:99px;overflow:hidden;}
.bf{height:100%;border-radius:99px;transition:width .5s;}
.inp{width:100%;padding:8px 12px;border:1px solid #E5E5E5;border-radius:9px;font-size:13px;outline:none;background:#FAFAFA;}
.inp:focus{border-color:#111;background:#fff;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
input[type=range]{-webkit-appearance:none;height:4px;border-radius:99px;background:#E5E5E5;outline:none;}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;cursor:pointer;}`;

  // ── EVENTO CALENDARIO (espandibile) ───────────────────────────────────────
  const EvRow=({ev,mini=false})=>{
    const isAp=evAp===ev.id;
    const diff=Math.round((ev.data-OGGI)/86400000);
    const lab=diff<0?"Scaduto":diff===0?"Oggi":diff===1?"Domani":"tra "+diff+"gg";
    const labCol=diff<0?"#9CA3AF":diff===0?"#555":diff<=3?"#777":"#9CA3AF";
    return(
      <div style={{border:`1px solid ${isAp?"#111":"#E5E5E5"}`,borderRadius:9,background:"#fff",marginBottom:5,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:mini?"7px 10px":"10px 14px",cursor:"pointer"}} onClick={()=>setEvAp(isAp?null:ev.id)}>
          <div style={{width:4,height:mini?28:36,borderRadius:99,background:ev.col,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:mini?11:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:diff<0?"#9CA3AF":"#111",textDecoration:diff<0?"line-through":"none"}}>{ev.titolo}</div>
            <div style={{fontSize:10,marginTop:1}}>
              <span style={{color:labCol,fontWeight:600}}>{lab}</span>
              <span style={{color:"#D1D5DB",margin:"0 4px"}}>·</span>
              <span style={{color:"#9CA3AF",textTransform:"capitalize"}}>{ev.tipo}{ev.chi&&" · "+ev.chi}</span>
            </div>
          </div>
          <Chevron open={isAp}/>
        </div>
        {isAp&&(
          <div style={{borderTop:"1px solid #F0F0F0",background:"#FAFAFA",padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {[["Tipo",ev.tipo],["Data",ev.data.toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"long"})],ev.chi&&["Assegnato",ev.chi],ev.priorita&&["Priorità",ev.priorita]].filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{display:"flex",gap:8}}><span style={{color:"#9CA3AF",width:70,flexShrink:0}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
                ))}
              </div>
              <div>
                <div style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,background:"#F4F4F4",fontSize:11,fontWeight:700,color:labCol}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:labCol,display:"inline-block"}}/>{lab}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return(
    <div style={{display:"flex",height:"100vh",fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#F4F4F4",color:"#111",overflow:"hidden"}}>
      <style suppressHydrationWarning>{css}</style>

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <div style={{width:220,background:"#fff",borderRight:"1px solid #E5E5E5",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"18px 18px 14px",borderBottom:"1px solid #F0F0F0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:"#111",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{color:"#fff",fontWeight:800,fontSize:17}}>F</span>
            </div>
            <div><div style={{fontWeight:800,fontSize:15,letterSpacing:"-.02em"}}>FABIO OS</div><div style={{fontSize:10,color:"#9CA3AF"}}>Poznań 2026</div></div>
          </div>
        </div>
        <button onClick={()=>setShowImp(true)} style={{margin:"10px 12px 0",padding:"8px 12px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,fontWeight:600,color:"#555",display:"flex",alignItems:"center",gap:6}}>
          <span>↓</span> Importa progetto
        </button>
        <div style={{margin:"10px 12px",padding:"12px 14px",background:"#111",borderRadius:10}}>
          <div style={{fontSize:9,fontWeight:700,color:"#666",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>MRR Attuale</div>
          <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}>€{mrr}</div>
          <div style={{height:4,background:"#333",borderRadius:99,overflow:"hidden",margin:"8px 0 4px"}}><div style={{height:"100%",background:"#fff",borderRadius:99,width:`${bk}%`,transition:"width .5s"}}/></div>
          <div style={{fontSize:10,color:"#666"}}>{bk}% del break-even</div>
        </div>
        <nav style={{padding:"4px 8px",flex:1,overflowY:"auto"}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setSez(n.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:10,border:"none",background:sez===n.id?"#F4F4F4":"transparent",color:sez===n.id?"#111":"#9CA3AF",fontWeight:sez===n.id?700:500,fontSize:13,marginBottom:1,borderLeft:sez===n.id?"3px solid #111":"3px solid transparent",textAlign:"left"}}>
              <span style={{display:"flex",color:sez===n.id?"#111":"#9CA3AF",flexShrink:0}}>{NAV_ICONS[n.id]}</span>
              <span style={{flex:1}}>{n.l}</span>
              {n.id==="messaggi"&&msgUnread>0&&<span style={{minWidth:18,height:18,background:"#111",borderRadius:99,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",padding:"0 4px"}}>{msgUnread}</span>}
              {n.id==="email"&&emailUnread>0&&<span style={{minWidth:18,height:18,background:"#111",borderRadius:99,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",padding:"0 4px"}}>{emailUnread}</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:"0 12px 18px"}}>
          <div style={{padding:"12px 14px",background:"#1A1A1A",borderRadius:10}}>
            <div style={{fontSize:9,fontWeight:700,color:"#666",letterSpacing:".1em",textTransform:"uppercase",marginBottom:4}}>Runway</div>
            <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}>{runway} mesi</div>
            <div style={{fontSize:10,color:"#666",marginTop:3}}>Burn €{burn}/mese</div>
          </div>
        </div>
      </div>

      {/* ── MODAL IMPORT ───────────────────────────────────────────────────── */}
      {showImp&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowImp(false)}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:560,maxWidth:"92vw",boxShadow:"0 24px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:800,fontSize:18,marginBottom:4}}>Importa progetto</div>
            <div style={{fontSize:13,color:"#6B7280",marginBottom:14}}>Chiedi a Claude di generare il JSON, poi incollalo qui.</div>
            <div style={{background:"#F8F8F8",borderRadius:9,padding:"10px 14px",marginBottom:12,fontSize:11,fontFamily:"monospace",lineHeight:1.9,color:"#555",border:"1px solid #E5E5E5",whiteSpace:"pre"}}>
{`{ "nome":"...", "progetti":[{...}],
  "taskFabio":[{...}], "taskLidia":[{...}] }`}
            </div>
            <textarea className="inp" rows={4} value={impTxt} onChange={e=>setImpTxt(e.target.value)} placeholder="Incolla il JSON qui..." style={{resize:"none",fontFamily:"monospace",fontSize:12,marginBottom:10}}/>
            {impMsg&&<div style={{padding:"8px 12px",borderRadius:8,background:impMsg.ok?"#F0FDF4":"#F5F5F5",color:impMsg.ok?"#15803D":"#555",fontSize:13,fontWeight:600,marginBottom:10}}>{impMsg.msg}</div>}
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={doImport} style={{flex:1,padding:10}}>Importa</Btn>
              <BtnG onClick={()=>{setShowImp(false);setImpTxt("");setImpMsg(null);}} style={{padding:"10px 18px"}}>Annulla</BtnG>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRA SESSIONE ─────────────────────────────────────────────────── */}
      <div style={{flex:1,overflow:"auto",display:"flex",flexDirection:"column"}}>
        {sess&&(
          <div style={{background:"#fff",borderBottom:"1px solid #E5E5E5",padding:"9px 24px",display:"flex",alignItems:"center",gap:14,flexShrink:0}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#111",animation:"pulse 1.5s infinite",flexShrink:0}}/>
            <span style={{fontWeight:700,fontSize:13}}>Sessione — {sess.nome}</span>
            <span style={{fontFamily:"monospace",fontSize:16,fontWeight:800}}>{fmt(sesT)}</span>
            <Btn style={{marginLeft:"auto",padding:"6px 14px"}} onClick={chiudiSess}>✓ Chiudi</Btn>
            <BtnG style={{fontSize:11,padding:"6px 12px"}} onClick={()=>setSess(null)}>⏸</BtnG>
          </div>
        )}

        <div style={{padding:26,flex:1,overflow:"auto"}}>

          {/* ══════════════════════════════════════════════════════════════════
              OGGI
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="oggi"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:4}}>Buongiorno</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em",textTransform:"capitalize"}}>{OGGI_STR}</div>
                </div>
                <Btn onClick={()=>setNewT(true)}>+ Nuovo task</Btn>
              </div>
              {newT&&(
                <div className="card fade" style={{padding:16,marginBottom:18,border:"1px solid #111"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:8}}>
                    <select className="inp" value={nf.chi} onChange={e=>setNf(f=>({...f,chi:e.target.value}))}><option value="fabio">Fabio</option><option value="lidia">Lidia</option></select>
                    <input className="inp" placeholder="App" value={nf.app} onChange={e=>setNf(f=>({...f,app:e.target.value}))}/>
                    <select className="inp" value={nf.priorita} onChange={e=>setNf(f=>({...f,priorita:e.target.value}))}><option value="urgente">Urgente</option><option value="alta">Alta</option><option value="media">Media</option><option value="bassa">Bassa</option></select>
                    <input className="inp" placeholder="Scadenza" value={nf.scadenza} onChange={e=>setNf(f=>({...f,scadenza:e.target.value}))}/>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <input className="inp" style={{flex:1}} placeholder="Descrizione task..." value={nf.testo} onChange={e=>setNf(f=>({...f,testo:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addTask()}/>
                    <Btn onClick={addTask}>Aggiungi</Btn>
                    <BtnG onClick={()=>setNewT(false)}>✕</BtnG>
                  </div>
                </div>
              )}
              {urgenti.length>0&&(
                <div style={{marginBottom:22}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#555",textTransform:"uppercase",letterSpacing:".08em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:7,height:7,background:"#555",borderRadius:"50%",display:"inline-block"}}/> Urgente ora — {urgenti.length} task
                  </div>
                  {urgenti.map(t=>{const c=tasks.fabio.find(x=>x.id===t.id)?"fabio":"lidia";return <TaskCard key={t.id} t={t} chi={c} onCheck={checkTask} onPatch={patchTask} onCoinvolgi={coinvolgi}/>;  })}
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:persona==="entrambi"?"1fr 1fr":"1fr",gap:20}}>
                {[{c:"fabio",l:"Fabio",s:"Sviluppo & Tecnico"},{c:"lidia",l:"Lidia",s:"Business, Ops & Marketing"}]
                  .filter(x=>persona==="entrambi"||persona===x.c)
                  .map(({c,l,s})=>(
                  <div key={c}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,padding:"0 2px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <div style={{width:9,height:9,background:"#111",borderRadius:"50%"}}/>
                        <span style={{fontWeight:800,fontSize:15}}>{l}</span>
                        <span style={{fontSize:11,color:"#9CA3AF"}}>{s}</span>
                      </div>
                      <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>{tasks[c].filter(t=>!t.fatto).length} da fare</span>
                    </div>
                    {tasks[c].map(t=><TaskCard key={t.id} t={t} chi={c} onCheck={checkTask} onPatch={patchTask} onCoinvolgi={coinvolgi}/>)}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:6,marginTop:18,justifyContent:"center"}}>
                {[["entrambi","Entrambi"],["fabio","Solo Fabio"],["lidia","Solo Lidia"]].map(([v,lab])=>(
                  <button key={v} style={{padding:"7px 16px",borderRadius:9,fontSize:12,fontWeight:700,border:"1px solid #E5E5E5",background:persona===v?"#111":"#fff",color:persona===v?"#fff":"#6B7280",cursor:"pointer"}} onClick={()=>setPersona(v)}>{lab}</button>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PROGETTI
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="progetti"&&(
            <div className="fade">
              <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em",marginBottom:22}}>Progetti attivi</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {proj.map(p=>{
                  const io=openP===p.id;
                  const st=STATO_P[p.stato]||STATO_P.sviluppo;
                  const pct=Math.round(p.sess/p.max*100);
                  const taskP=[...tasks.fabio,...tasks.lidia].filter(t=>
                    t.app===p.nome||
                    (p.id==="montaggi"&&t.app==="MONTAGGI")||
                    (p.id==="misure"&&t.app==="MISURE")||
                    (p.id==="erp"&&t.app==="MASTRO ERP")||
                    (p.id==="frameflow"&&t.app==="FRAMEFLOW")
                  );
                  const licP=lic.filter(l=>l.prodotto===p.nome);
                  const pFiles=files[p.id]||[];
                  return(
                    <div key={p.id} style={{background:"#fff",border:`1px solid ${io?p.col:"#E5E5E5"}`,borderRadius:14,overflow:"hidden",transition:"border-color .15s",boxShadow:io?`0 4px 20px ${p.col}22`:"none"}}>
                      <div style={{padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}} onClick={()=>setOpenP(io?null:p.id)}>
                        <div style={{width:42,height:42,borderRadius:12,background:p.col+"18",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <div style={{width:14,height:14,borderRadius:"50%",background:p.col}}/>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                            <span style={{fontWeight:800,fontSize:15}}>{p.nome}</span>
                            <span style={{fontSize:10,fontWeight:700,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>{p.cat}</span>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{flex:1,height:6,background:"#F0F0F0",borderRadius:99,overflow:"hidden",maxWidth:200}}><div style={{height:"100%",background:p.col,borderRadius:99,width:`${pct}%`,transition:"width .5s"}}/></div>
                            <span style={{fontSize:11,color:"#9CA3AF",whiteSpace:"nowrap"}}>Sessione {p.sess}/{p.max}</span>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                          {p.mrr>0&&<span style={{fontSize:14,fontWeight:800,color:p.col}}>€{p.mrr} MRR</span>}
                          <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:st.bg,color:st.c}}>{st.l}</span>
                          <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>{p.sc}</span>
                          <Chevron open={io}/>
                        </div>
                      </div>
                      {io&&(
                        <div style={{borderTop:"1px solid #F5F5F5",background:"#FAFAFA"}} onClick={e=>e.stopPropagation()}>
                          <div style={{display:"flex",gap:0,borderBottom:"1px solid #F0F0F0",background:"#fff"}}>
                            {[["info","Info"],["task",`Task (${taskP.length})`],["licenze",`Licenze (${licP.length})`],["file",`File (${pFiles.length})`]].map(([v,l])=>(
                              <button key={v} onClick={()=>setPT(p.id,v)} style={{padding:"10px 18px",border:"none",borderBottom:`2px solid ${getPT(p.id)===v?p.col:"transparent"}`,background:"transparent",fontSize:12,fontWeight:getPT(p.id)===v?700:500,color:getPT(p.id)===v?"#111":"#9CA3AF",cursor:"pointer"}}>{l}</button>
                            ))}
                          </div>
                          {getPT(p.id)==="info"&&(
                            <div style={{padding:"18px 20px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
                              <div>
                                <Lbl c="Note"/>
                                <div style={{fontSize:12,color:"#555",lineHeight:1.8,marginBottom:16,background:"#fff",padding:"10px 12px",borderRadius:9,border:"1px solid #F0F0F0"}}>{p.note}</div>
                                {[["Prezzo",`€${p.pr}/mese`],["Clienti",p.beta],["MRR",`€${p.mrr}`],["Sessioni",`${p.sess}/${p.max} (${pct}%)`],["Target",p.sc]].map(([k,v])=>(
                                  <div key={k} style={{display:"flex",gap:8,fontSize:12,marginBottom:6}}><span style={{color:"#9CA3AF",width:90,flexShrink:0}}>{k}</span><span style={{fontWeight:700}}>{v}</span></div>
                                ))}
                              </div>
                              <div>
                                <Lbl c="Azioni"/>
                                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                                  {!sess&&<button onClick={()=>{setSess(p);setSesT(0);}} style={{padding:"10px 16px",background:p.col,color:"#fff",border:"none",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer"}}>▶ Avvia sessione {p.sess+1}</button>}
                                  <BtnG onClick={()=>setProj(ps=>ps.map(q=>q.id===p.id?{...q,mrr:q.mrr+q.pr,beta:q.beta+1}:q))}>+ Aggiungi cliente €{p.pr}</BtnG>
                                  {p.beta>0&&<BtnG onClick={()=>setProj(ps=>ps.map(q=>q.id===p.id&&q.beta>0?{...q,mrr:Math.max(0,q.mrr-q.pr),beta:q.beta-1}:q))}>− Rimuovi cliente</BtnG>}
                                  {p.beta>0&&<div style={{fontSize:11,color:"#9CA3AF"}}>{p.beta} clienti · €{p.mrr} MRR</div>}
                                </div>
                              </div>
                            </div>
                          )}
                          {getPT(p.id)==="task"&&(
                            <div style={{padding:"18px 20px"}}>
                              {taskP.length===0?<div style={{textAlign:"center",padding:"24px 0",color:"#C5C5C5"}}>Nessun task collegato</div>
                              :taskP.map(t=>{
                                const c=tasks.fabio.find(x=>x.id===t.id)?"fabio":"lidia";
                                return(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #F5F5F5"}}>
                                  <div style={{width:7,height:7,borderRadius:"50%",background:t.fatto?"#22C55E":PRI[t.priorita]?.dot||"#9CA3AF",flexShrink:0}}/>
                                  <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:13,fontWeight:600,color:t.fatto?"#9CA3AF":"#111",textDecoration:t.fatto?"line-through":"none"}}>{t.testo}</div>
                                    <div style={{fontSize:10,color:"#9CA3AF"}}>{c==="fabio"?"Fabio":"Lidia"} · {t.priorita}{t.scadenza&&" · "+t.scadenza}</div>
                                  </div>
                                </div>);
                              })}
                            </div>
                          )}
                          {getPT(p.id)==="licenze"&&(
                            <div style={{padding:"18px 20px"}}>
                              {licP.length===0?<div style={{textAlign:"center",padding:"24px 0",color:"#C5C5C5"}}>Nessun cliente ancora</div>
                              :licP.map(l=>{
                                const sl=STATO_L[l.stato]||STATO_L.attiva;
                                return(<div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #F5F5F5"}}>
                                  <div style={{width:32,height:32,background:"#F4F4F4",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:13,fontWeight:800,color:"#555"}}>{l.cliente[0]}</span></div>
                                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{l.cliente}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{l.piano} · €{l.pr}/mese</div></div>
                                  <span style={{fontSize:11,fontWeight:700,color:sl.text,background:sl.bg,padding:"3px 10px",borderRadius:20}}>{sl.label}</span>
                                </div>);
                              })}
                              {licP.length>0&&<div style={{marginTop:12,padding:"10px 14px",background:p.col+"12",borderRadius:10,fontSize:13,fontWeight:700,color:p.col}}>MRR: €{licP.filter(l=>l.stato==="attiva").reduce((s,l)=>s+l.pr,0)}</div>}
                            </div>
                          )}
                          {getPT(p.id)==="file"&&(
                            <div style={{padding:"18px 20px"}}>
                              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                                <label style={{padding:"7px 14px",background:"#111",color:"#fff",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                                  ↑ Carica file
                                  <input type="file" style={{display:"none"}} multiple onChange={ev=>{
                                    Array.from(ev.target.files).forEach(f=>{
                                      const ext=f.name.split(".").pop().toLowerCase();
                                      const isCode=["jsx","js","ts","tsx","json","css","html","md","txt"].includes(ext);
                                      const reader=new FileReader();
                                      reader.onload=e2=>addFile(p.id,{id:Date.now()+Math.random(),nome:f.name,ext,tipo:isCode?"code":"binary",contenuto:e2.target.result,url:null,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}),size:Math.round(f.size/1024)});
                                      if(isCode)reader.readAsText(f);else reader.readAsDataURL(f);
                                    });
                                    ev.target.value="";
                                  }}/>
                                </label>
                                <input placeholder="URL (GitHub, Drive…)" value={newLink[p.id]?.url||""} onChange={e=>setNewLink(n=>({...n,[p.id]:{...n[p.id],url:e.target.value}}))}
                                  style={{flex:1,minWidth:140,padding:"7px 12px",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,outline:"none"}}/>
                                <input placeholder="Nome" value={newLink[p.id]?.nome||""} onChange={e=>setNewLink(n=>({...n,[p.id]:{...n[p.id],nome:e.target.value}}))}
                                  style={{width:110,padding:"7px 12px",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,outline:"none"}}/>
                                <Btn onClick={()=>{
                                  const lnk=newLink[p.id];if(!lnk?.url)return;
                                  const ext=lnk.url.includes("github")?"github":lnk.url.includes("drive")?"drive":lnk.url.includes("notion")?"notion":"link";
                                  addFile(p.id,{id:Date.now(),nome:lnk.nome||lnk.url.replace(/^https?:\/\//,"").split("/")[0],ext,tipo:"link",contenuto:null,url:lnk.url,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}),size:null});
                                  setNewLink(n=>({...n,[p.id]:{url:"",nome:""}}));
                                }}>+ Link</Btn>
                              </div>
                              {pFiles.length===0
                                ?<div style={{textAlign:"center",padding:"28px 0",color:"#C5C5C5"}}><div style={{fontSize:28,marginBottom:8}}>📂</div><div style={{fontSize:13}}>Nessun file ancora</div></div>
                                :<div style={{display:"flex",flexDirection:"column",gap:6}}>
                                  {pFiles.map(f=>(
                                    <div key={f.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#fff",border:"1px solid #E5E5E5",borderRadius:10}}>
                                      <div style={{width:36,height:36,background:"#F4F4F4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>{FILE_ICONS[f.ext]||"📄"}</div>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.nome}</div>
                                        <div style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{f.data}{f.size&&` · ${f.size}KB`} · .{f.ext}</div>
                                      </div>
                                      <div style={{display:"flex",gap:6,flexShrink:0}}>
                                        {f.tipo==="code"&&<button onClick={()=>setViewFile(f)} style={{padding:"5px 12px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",color:"#555"}}>Visualizza</button>}
                                        {f.tipo==="link"&&<a href={f.url} target="_blank" rel="noreferrer" style={{padding:"5px 12px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,fontWeight:700,color:"#555",textDecoration:"none"}}>Apri ↗</a>}
                                        {f.tipo==="binary"&&f.contenuto&&<a href={f.contenuto} download={f.nome} style={{padding:"5px 12px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,fontWeight:700,color:"#555",textDecoration:"none"}}>↓ Scarica</a>}
                                        <button onClick={()=>removeFile(p.id,f.id)} style={{padding:"5px 10px",background:"none",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              CALENDARIO
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="calendario"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <button onClick={()=>navCal(-1)} style={{width:32,height:32,border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
                  <span style={{fontWeight:800,fontSize:16,textTransform:"capitalize",minWidth:180}}>{etVista}</span>
                  <button onClick={()=>navCal(1)} style={{width:32,height:32,border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
                  <button onClick={()=>{setCalMese(new Date(2026,1,1));setCalGiorno(new Date(2026,1,20));}} style={{padding:"6px 12px",border:"1px solid #E5E5E5",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,color:"#555"}}>Oggi</button>
                </div>
                <div style={{display:"flex",gap:3,background:"#F4F4F4",borderRadius:10,padding:4}}>
                  {[["giorno","Giorno"],["settimana","Settimana"],["mese","Mese"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setCalVista(v)} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,background:calVista===v?"#fff":"transparent",color:calVista===v?"#111":"#6B7280",boxShadow:calVista===v?"0 1px 4px rgba(0,0,0,.08)":"none",cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 280px",gap:20}}>
                <div>
                  {calVista==="mese"&&(
                    <div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
                        {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(g=><div key={g} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"#9CA3AF",padding:"4px 0"}}>{g}</div>)}
                      </div>
                      {weeks.map((w,wi)=>(
                        <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:3}}>
                          {w.map((g,gi)=>{
                            if(!g)return <div key={gi}/>;
                            const isOggi=g===20&&calM===1&&calAnno===2026;
                            const evs=evPerGio[g]||[];
                            const isSel=selGio===g;
                            return(
                              <div key={gi} onClick={()=>{setSelGio(isSel?null:g);if(!isSel)setCalGiorno(new Date(calAnno,calM,g));}}
                                style={{minHeight:64,padding:"6px 7px",background:isSel?"#111":isOggi?"#F9F9F9":"#fff",border:`1px solid ${isSel?"#111":isOggi?"#555":"#E5E5E5"}`,borderRadius:9,cursor:"pointer"}}>
                                <div style={{fontSize:12,fontWeight:isOggi||isSel?800:500,color:isSel?"#fff":isOggi?"#111":"#374151",marginBottom:3}}>{g}</div>
                                {evs.slice(0,2).map((ev,i)=>(
                                  <div key={i} style={{fontSize:9,fontWeight:600,color:isSel?"rgba(255,255,255,.8)":ev.col,background:isSel?"rgba(255,255,255,.1)":ev.col+"18",borderRadius:4,padding:"1px 4px",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                    {ev.titolo.split("—")[0].trim().split(" ").slice(0,3).join(" ")}
                                  </div>
                                ))}
                                {evs.length>2&&<div style={{fontSize:9,color:isSel?"rgba(255,255,255,.6)":"#9CA3AF",fontWeight:600}}>+{evs.length-2}</div>}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {calVista==="settimana"&&(
                    <div style={{overflowX:"auto"}}>
                      <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",minWidth:600}}>
                        <div/>
                        {giorniSett.map((d,i)=>{
                          const isOggi=d.toDateString()===OGGI.toDateString();
                          return(
                            <div key={i} onClick={()=>{setCalGiorno(d);setCalVista("giorno");}} style={{textAlign:"center",padding:"8px 4px",borderBottom:"2px solid #F0F0F0",cursor:"pointer",background:isOggi?"#F9F9F9":"transparent",borderRadius:"8px 8px 0 0"}}>
                              <div style={{fontSize:10,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase"}}>{d.toLocaleDateString("it-IT",{weekday:"short"})}</div>
                              <div style={{fontSize:16,fontWeight:isOggi?800:600,color:isOggi?"#111":"#374151",marginTop:2}}>{d.getDate()}</div>
                            </div>
                          );
                        })}
                        {oreGiorno.map(ora=>[
                          <div key={"ora"+ora} style={{fontSize:10,color:"#C5C5C5",padding:"0 6px",height:52,display:"flex",alignItems:"flex-start",paddingTop:4,borderRight:"1px solid #F0F0F0"}}>{ora}:00</div>,
                          ...giorniSett.map((d,di)=>{
                            const isOggi=d.toDateString()===OGGI.toDateString();
                            const evsD=evAll.filter(ev=>ev.data.toDateString()===d.toDateString());
                            return(
                              <div key={"cell"+di} style={{height:52,borderBottom:"1px solid #F8F8F8",borderRight:"1px solid #F5F5F5",background:isOggi?"#FAFAFA":"transparent",padding:"2px 3px"}}>
                                {ora===8&&evsD.map((ev,ei)=>(
                                  <div key={ei} onClick={()=>setEvAp(evAp===ev.id?null:ev.id)}
                                    style={{fontSize:9,fontWeight:700,color:"#fff",background:ev.col,borderRadius:5,padding:"2px 5px",marginBottom:2,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                    {ev.titolo.split("—")[0].trim().split(" ").slice(0,4).join(" ")}
                                  </div>
                                ))}
                              </div>
                            );
                          })
                        ])}
                      </div>
                    </div>
                  )}
                  {calVista==="giorno"&&(
                    <div>
                      <div style={{fontWeight:800,fontSize:15,marginBottom:14,textTransform:"capitalize"}}>
                        {calGiorno.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                      </div>
                      {evAll.filter(ev=>ev.data.toDateString()===calGiorno.toDateString()).length===0
                        ?<div style={{textAlign:"center",padding:"40px 0",color:"#C5C5C5",fontSize:14}}><div style={{fontSize:32,marginBottom:8}}>○</div>Nessun evento</div>
                        :evAll.filter(ev=>ev.data.toDateString()===calGiorno.toDateString()).map(ev=><EvRow key={ev.id} ev={ev}/>)
                      }
                      <div style={{marginTop:20}}>
                        <Lbl c="Naviga giorno"/>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                          {Array.from({length:7},(_,i)=>{const d=new Date(calGiorno);d.setDate(calGiorno.getDate()-3+i);return d;}).map((d,i)=>{
                            const isS=d.toDateString()===calGiorno.toDateString();
                            const evs=evAll.filter(ev=>ev.data.toDateString()===d.toDateString());
                            return(
                              <div key={i} onClick={()=>setCalGiorno(d)} style={{padding:"7px 4px",borderRadius:9,background:isS?"#111":"#fff",border:"1px solid #E5E5E5",cursor:"pointer",textAlign:"center"}}>
                                <div style={{fontSize:9,color:isS?"#ccc":"#9CA3AF",fontWeight:600,textTransform:"uppercase"}}>{d.toLocaleDateString("it-IT",{weekday:"short"})}</div>
                                <div style={{fontSize:13,fontWeight:700,color:isS?"#fff":"#374151",marginTop:2}}>{d.getDate()}</div>
                                {evs.length>0&&<div style={{width:4,height:4,borderRadius:"50%",background:isS?"#fff":"#111",margin:"3px auto 0"}}/>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {calVista==="mese"&&selGio&&(
                    <div className="card" style={{padding:14}}>
                      <div style={{fontWeight:800,fontSize:13,marginBottom:10}}>{selGio} {nomeMese.split(" ")[0]}</div>
                      {evSel.length===0?<Nota c="Nessun evento"/>:evSel.map(ev=><EvRow key={ev.id} ev={ev} mini/>)}
                    </div>
                  )}
                  <div className="card" style={{padding:14,flex:1}}>
                    <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>Prossime scadenze</div>
                    {prossimi.length===0?<Nota c="Nessuna"/>:prossimi.map(ev=><EvRow key={ev.id} ev={ev} mini/>)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              MESSAGGI
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="messaggi"&&(
            <div className="fade" style={{height:"calc(100vh - 120px)",display:"flex",flexDirection:"column"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexShrink:0}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Chat interna</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em"}}>Fabio ↔ Lidia</div>
                </div>
                <div style={{display:"flex",gap:4,background:"#F4F4F4",borderRadius:10,padding:4}}>
                  {[["fabio","Fabio"],["lidia","Lidia"]].map(([v,l])=>(
                    <button key={v} onClick={()=>setUtente(v)} style={{padding:"7px 16px",borderRadius:8,border:"none",fontSize:12,fontWeight:700,background:utente===v?"#111":"transparent",color:utente===v?"#fff":"#6B7280",cursor:"pointer"}}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,paddingBottom:8}}>
                {msg.map(m=>{
                  const mine=m.da===utente;
                  return(
                    <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:mine?"flex-end":"flex-start"}}>
                      <div style={{maxWidth:"68%"}}>
                        <div style={{padding:"10px 14px",borderRadius:mine?"14px 14px 4px 14px":"14px 14px 14px 4px",background:mine?"#111":"#fff",border:mine?"none":"1px solid #E5E5E5",color:mine?"#fff":"#111"}}>
                          <div style={{fontSize:13,lineHeight:1.5}}>{m.testo}</div>
                        </div>
                        <div style={{fontSize:10,color:"#9CA3AF",marginTop:3,textAlign:mine?"right":"left"}}>
                          {m.da==="fabio"?"Fabio":"Lidia"} · {m.ts}
                          {m.trasformato&&<span style={{marginLeft:6,color:"#15803D",fontWeight:700}}>✓ Task di {m.taskChi==="fabio"?"Fabio":"Lidia"}</span>}
                        </div>
                      </div>
                      {!mine&&!m.trasformato&&(
                        <div style={{display:"flex",gap:6,marginTop:4}}>
                          <button onClick={()=>trasforma(m,utente)} style={{padding:"3px 12px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:20,fontSize:11,fontWeight:700,color:"#374151",cursor:"pointer"}}>+ Task mio</button>
                          <button onClick={()=>trasforma(m,m.da)} style={{padding:"3px 12px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:20,fontSize:11,fontWeight:700,color:"#374151",cursor:"pointer"}}>+ Assegna a {m.da==="fabio"?"Fabio":"Lidia"}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={msgEnd}/>
              </div>
              <div style={{borderTop:"1px solid #E5E5E5",paddingTop:14,flexShrink:0}}>
                <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
                  <div style={{flex:1,background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,overflow:"hidden"}}>
                    <textarea value={msgIn} onChange={e=>setMsgIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();inviaMsg();}}}
                      placeholder={`Scrivi a ${utente==="fabio"?"Lidia":"Fabio"}…`} rows={2}
                      style={{width:"100%",padding:"8px 12px",border:"none",fontSize:13,outline:"none",resize:"none",background:"transparent",lineHeight:1.5}}/>
                  </div>
                  <button onClick={inviaMsg} style={{width:44,height:44,background:"#111",border:"none",borderRadius:11,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              EMAIL
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="email"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Gestione automatica</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em"}}>Email</div>
                </div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:12,color:"#9CA3AF"}}><b style={{color:"#111"}}>{emails.filter(e=>!e.letto).length}</b> non lette · <b style={{color:"#15803D"}}>{emails.filter(e=>e.cat==="lead"&&!e.azione).length} lead</b> da gestire</span>
                  <Btn style={{fontSize:11}} onClick={()=>setNewEmailOpen(true)}>✉ Nuova</Btn>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:16}}>
                <div>
                  {/* Nav sezione email */}
                  <div style={{display:"flex",gap:3,background:"#F4F4F4",borderRadius:10,padding:4,marginBottom:14,width:"fit-content"}}>
                    {[["inbox","📥 In arrivo"],["template","📋 Template"],["massive","📢 Massiva"],["programmata","⏰ Programmate"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setEmailSection(v)} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,background:emailSection===v?"#fff":"transparent",color:emailSection===v?"#111":"#6B7280",boxShadow:emailSection===v?"0 1px 4px rgba(0,0,0,.08)":"none",cursor:"pointer"}}>{l}</button>
                    ))}
                  </div>

                  {/* Sub-tab filtro inbox */}
                  {emailSection==="inbox"&&(
                  <div style={{display:"flex",gap:3,background:"#F4F4F4",borderRadius:10,padding:4,marginBottom:14,width:"fit-content"}}>
                    {[["inbox","In arrivo"],["lead","Lead"],["supporto","Supporto"],["ops","OPS"],["archiviata","Archivio"]].map(([v,l])=>(
                      <button key={v} onClick={()=>setEmailTab(v)} style={{padding:"6px 14px",borderRadius:8,border:"none",fontSize:11,fontWeight:600,background:emailTab===v?"#fff":"transparent",color:emailTab===v?"#111":"#6B7280",boxShadow:emailTab===v?"0 1px 4px rgba(0,0,0,.08)":"none",cursor:"pointer"}}>{l}</button>
                    ))}
                  </div>
                  )}
                  {emailSection==="inbox"&&(<div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {emails.filter(e=>emailTab==="inbox"?e.azione!=="archiviato":emailTab==="archiviata"?e.azione==="archiviato":e.cat===emailTab&&e.azione!=="archiviato").map(e=>{
                      const cat=CAT_EMAIL[e.cat]||CAT_EMAIL.sistema;
                      const ap=emailAp===e.id;
                      const regola=REGOLE.find(r=>r.p.test(e.oggetto+" "+e.corpo));
                      return(
                        <div key={e.id} style={{background:"#fff",border:`1px solid ${ap?"#111":"#E5E5E5"}`,borderRadius:12,overflow:"hidden"}}>
                          <div style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",cursor:"pointer"}} onClick={()=>{setEmailAp(ap?null:e.id);if(!e.letto)setEmails(es=>es.map(x=>x.id===e.id?{...x,letto:true}:x));}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:e.letto?"#E5E5E5":cat.dot,flexShrink:0}}/>
                            <div style={{width:36,height:36,background:"#F4F4F4",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontWeight:800,fontSize:15,color:"#555"}}>{e.nome[0]}</span>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:2}}>
                                <span style={{fontWeight:e.letto?500:700,fontSize:13}}>{e.nome}</span>
                                <span style={{fontSize:10,color:"#9CA3AF",flexShrink:0,marginLeft:8}}>{e.data}</span>
                              </div>
                              <div style={{fontSize:12,color:e.letto?"#9CA3AF":"#374151",fontWeight:e.letto?400:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.oggetto}</div>
                              {!ap&&<div style={{fontSize:11,color:"#C5C5C5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{e.corpo.slice(0,80)}…</div>}
                            </div>
                            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                              {e.azione&&<span style={{fontSize:10,fontWeight:700,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>✓ {e.azione}</span>}
                              <span style={{fontSize:10,fontWeight:700,color:cat.c,background:cat.bg,padding:"2px 8px",borderRadius:20}}>{cat.l}</span>
                              <Chevron open={ap}/>
                            </div>
                          </div>
                          {ap&&(
                            <div style={{borderTop:"1px solid #F0F0F0",padding:16}} onClick={ev=>ev.stopPropagation()}>
                              <div style={{fontSize:12,color:"#374151",lineHeight:1.8,background:"#FAFAFA",padding:"12px 16px",borderRadius:9,marginBottom:14,border:"1px solid #F0F0F0"}}>
                                <div style={{fontSize:10,color:"#9CA3AF",marginBottom:8,display:"flex",gap:12}}><span>Da: {e.da}</span>{e.prog&&<span>Progetto: {e.prog}</span>}</div>
                                {e.corpo}
                              </div>
                              {regola&&(
                                <div style={{padding:"10px 14px",background:"#F4F4F4",borderRadius:9,marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
                                  <span style={{fontSize:16}}>🤖</span>
                                  <div><div style={{fontSize:11,fontWeight:700,color:"#111",marginBottom:2}}>Azione suggerita automaticamente</div><div style={{fontSize:12,color:"#555"}}>{regola.az}</div></div>
                                </div>
                              )}
                              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                                {e.cat==="lead"&&!e.azione&&(
                                  <Btn style={{fontSize:11,padding:"6px 12px",background:"#15803D"}} onClick={()=>{
                                    const neo={id:Date.now(),testo:`Rispondi a ${e.nome} — ${e.oggetto}`,app:"MKT",priorita:"alta",scadenza:"Oggi",fatto:false,...T0,note:e.corpo.slice(0,100),link:`mailto:${e.da}`};
                                    setTasks(t=>({...t,lidia:[neo,...t.lidia]}));
                                    setEmails(es=>es.map(x=>x.id===e.id?{...x,azione:"task creato"}:x));
                                  }}>+ Task Lidia</Btn>
                                )}
                                {e.cat==="supporto"&&!e.azione&&(
                                  <Btn style={{fontSize:11,padding:"6px 12px",background:"#374151"}} onClick={()=>{
                                    const neo={id:Date.now(),testo:`Fix: ${e.oggetto} — ${e.nome}`,app:(e.prog||"ops").toUpperCase(),priorita:"urgente",scadenza:"Oggi",fatto:false,...T0,note:e.corpo.slice(0,100)};
                                    setTasks(t=>({...t,fabio:[neo,...t.fabio]}));
                                    setEmails(es=>es.map(x=>x.id===e.id?{...x,azione:"task Fabio"}:x));
                                  }}>+ Task Fabio urgente</Btn>
                                )}
                                {e.cat==="pagamento"&&!e.azione&&(
                                  <Btn style={{fontSize:11,padding:"6px 12px"}} onClick={()=>{
                                    setEmails(es=>es.map(x=>x.id===e.id?{...x,azione:"registrato"}:x));
                                  }}>€ Registra pagamento</Btn>
                                )}
                                <BtnG style={{fontSize:11,padding:"6px 12px"}} onClick={()=>setEmails(es=>es.map(x=>x.id===e.id?{...x,azione:"archiviato",letto:true}:x))}>Archivia</BtnG>
                              </div>
                              <div style={{marginTop:14,borderTop:"1px solid #F0F0F0",paddingTop:14}}>
                                <Lbl c="Risposta rapida"/>
                                <textarea placeholder={`Rispondi a ${e.nome}…`} rows={3} style={{width:"100%",padding:"9px 12px",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,outline:"none",resize:"none",lineHeight:1.6,marginBottom:8}}/>
                                <div style={{display:"flex",gap:8}}>
                                  <Btn style={{fontSize:11,padding:"6px 14px"}}>Invia risposta</Btn>
                                  <BtnG style={{fontSize:11,padding:"6px 12px"}} onClick={()=>{
                                    const ts=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
                                    setMsg(ms=>[...ms,{id:Date.now(),da:"fabio",testo:`📧 Email da ${e.nome}: "${e.oggetto}"`,ts,trasformato:false}]);
                                    setSez("messaggi");
                                  }}>→ Invia a Lidia</BtnG>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>)}

                  {/* ── TEMPLATE ── */}
                  {emailSection==="template"&&(
                    <div>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div style={{fontSize:14,fontWeight:700}}>Template email ({templates.length})</div>
                        <Btn style={{fontSize:11}} onClick={()=>setEditTpl({id:"new"+Date.now(),nome:"Nuovo template",cat:"commercial",oggetto:"",corpo:""})}>+ Nuovo template</Btn>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {templates.map(tpl=>{
                          const ct=CAT_TEMPLATE[tpl.cat]||{l:tpl.cat,c:"#9CA3AF"};
                          const isEd=editTpl?.id===tpl.id;
                          return(
                            <div key={tpl.id} style={{background:"#fff",border:`1px solid ${isEd?"#111":"#E5E5E5"}`,borderRadius:12,overflow:"hidden"}}>
                              <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                                    <span style={{fontWeight:700,fontSize:13}}>{tpl.nome}</span>
                                    <span style={{fontSize:10,fontWeight:700,color:ct.c,background:ct.c+"15",padding:"2px 8px",borderRadius:20}}>{ct.l}</span>
                                  </div>
                                  <div style={{fontSize:11,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.oggetto}</div>
                                </div>
                                <div style={{display:"flex",gap:6,flexShrink:0}}>
                                  <Btn style={{fontSize:11,padding:"5px 12px"}} onClick={()=>{
                                    setDraft({a:"",oggetto:tpl.oggetto,corpo:tpl.corpo,allegati:[],programmata:"",tplId:tpl.id});
                                    setNewEmailOpen(true);
                                  }}>Usa</Btn>
                                  <BtnG style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setEditTpl(isEd?null:{...tpl})}>Modifica</BtnG>
                                  <button onClick={()=>setTemplates(ts=>ts.filter(t=>t.id!==tpl.id))} style={{padding:"5px 10px",background:"none",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                                </div>
                              </div>
                              {isEd&&(
                                <div style={{borderTop:"1px solid #F0F0F0",padding:"14px 16px",background:"#FAFAFA"}} onClick={e=>e.stopPropagation()}>
                                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                                    <div style={{display:"flex",gap:8}}>
                                      <input className="inp" style={{flex:1}} placeholder="Nome template" value={editTpl.nome} onChange={e=>setEditTpl(t=>({...t,nome:e.target.value}))}/>
                                      <select className="inp" style={{width:140}} value={editTpl.cat} onChange={e=>setEditTpl(t=>({...t,cat:e.target.value}))}>
                                        {Object.entries(CAT_TEMPLATE).map(([v,{l}])=><option key={v} value={v}>{l}</option>)}
                                      </select>
                                    </div>
                                    <input className="inp" placeholder="Oggetto (usa {{nome}}, {{prodotto}}, {{prezzo}})" value={editTpl.oggetto} onChange={e=>setEditTpl(t=>({...t,oggetto:e.target.value}))}/>
                                    <textarea className="inp" rows={6} style={{resize:"none",lineHeight:1.7,fontFamily:"monospace",fontSize:12}} placeholder="Corpo email…" value={editTpl.corpo} onChange={e=>setEditTpl(t=>({...t,corpo:e.target.value}))}/>
                                    <div style={{display:"flex",gap:8}}>
                                      <Btn onClick={()=>{
                                        if(editTpl.id.startsWith("new")) setTemplates(ts=>[...ts,{...editTpl}]);
                                        else setTemplates(ts=>ts.map(t=>t.id===editTpl.id?{...editTpl}:t));
                                        setEditTpl(null);
                                      }}>Salva</Btn>
                                      <BtnG onClick={()=>setEditTpl(null)}>Annulla</BtnG>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── MASSIVA ── */}
                  {emailSection==="massive"&&(
                    <div>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Email massiva</div>
                      <div style={{fontSize:12,color:"#9CA3AF",marginBottom:14}}>Invia un'email a tutti i tuoi clienti o a un gruppo selezionato.</div>
                      <div style={{display:"flex",flexDirection:"column",gap:12}}>
                        {/* Step 1: Scegli template */}
                        <div className="card" style={{padding:16}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>1. Scegli template</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            {templates.filter(t=>t.cat!=="onboarding").map(tpl=>(
                              <div key={tpl.id} onClick={()=>setMassiveTpl(tpl)} style={{padding:"10px 14px",border:`1px solid ${massiveTpl?.id===tpl.id?"#111":"#E5E5E5"}`,borderRadius:10,cursor:"pointer",background:massiveTpl?.id===tpl.id?"#111":"#fff"}}>
                                <div style={{fontSize:12,fontWeight:700,color:massiveTpl?.id===tpl.id?"#fff":"#111"}}>{tpl.nome}</div>
                                <div style={{fontSize:10,color:massiveTpl?.id===tpl.id?"#ccc":"#9CA3AF",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{tpl.oggetto}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Step 2: Destinatari */}
                        <div className="card" style={{padding:16}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>2. Destinatari ({massiveDest.length} selezionati)</div>
                          <div style={{display:"flex",gap:8,marginBottom:10}}>
                            <BtnG style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setMassiveDest(lic.map(l=>l.id))}>Tutti ({lic.length})</BtnG>
                            <BtnG style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setMassiveDest(lic.filter(l=>l.stato==="attiva").map(l=>l.id))}>Solo attivi ({lic.filter(l=>l.stato==="attiva").length})</BtnG>
                            <BtnG style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setMassiveDest(lic.filter(l=>l.stato==="trial").map(l=>l.id))}>Solo trial ({lic.filter(l=>l.stato==="trial").length})</BtnG>
                            <BtnG style={{fontSize:11,padding:"5px 12px"}} onClick={()=>setMassiveDest([])}>Deseleziona</BtnG>
                          </div>
                          {lic.map(l=>(
                            <div key={l.id} onClick={()=>setMassiveDest(ds=>ds.includes(l.id)?ds.filter(x=>x!==l.id):[...ds,l.id])}
                              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid #F5F5F5",cursor:"pointer"}}>
                              <div style={{width:16,height:16,borderRadius:4,border:`2px solid ${massiveDest.includes(l.id)?"#111":"#D1D5DB"}`,background:massiveDest.includes(l.id)?"#111":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                {massiveDest.includes(l.id)&&<svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3.5 6L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </div>
                              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{l.cliente}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{l.email} · {l.prodotto}</div></div>
                              <span style={{fontSize:10,color:STATO_L[l.stato]?.text||"#555",background:STATO_L[l.stato]?.bg||"#F4F4F4",padding:"2px 8px",borderRadius:20,fontWeight:700}}>{STATO_L[l.stato]?.label||l.stato}</span>
                            </div>
                          ))}
                        </div>
                        {/* Step 3: Data programmata */}
                        <div className="card" style={{padding:16}}>
                          <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>3. Quando inviare?</div>
                          <div style={{display:"flex",gap:10,alignItems:"center"}}>
                            <input type="datetime-local" value={massive3Data} onChange={e=>setMassive3Data(e.target.value)} style={{padding:"7px 12px",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,outline:"none"}}/>
                            <span style={{fontSize:12,color:"#9CA3AF"}}>lascia vuoto per invio immediato</span>
                          </div>
                        </div>
                        {/* Step 4: Invia */}
                        <Btn style={{padding:"12px 0",fontSize:14}} onClick={()=>{
                          if(!massiveTpl||massiveDest.length===0)return;
                          const ora=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
                          const nuove=massiveDest.map(lid=>{
                            const ll=lic.find(x=>x.id===lid);
                            const sogg=massiveTpl.oggetto.replace(/{{nome}}/g,ll.cliente).replace(/{{prodotto}}/g,ll.prodotto).replace(/{{prezzo}}/g,ll.pr);
                            const bod=massiveTpl.corpo.replace(/{{nome}}/g,ll.cliente).replace(/{{prodotto}}/g,ll.prodotto).replace(/{{prezzo}}/g,ll.pr);
                            return{id:Date.now()+Math.random(),da:"fabio@mastro.app",nome:"Fabio",oggetto:sogg,corpo:bod,data:ora,letto:true,cat:"ops",azione:massive3Data?"programmata":"inviata",prog:null,allegati:[]};
                          });
                          if(!massive3Data) setEmails(es=>[...nuove,...es]);
                          else setScheduledEmails(se=>[...se,...nuove.map(n=>({...n,programmata:massive3Data,stato:"in attesa"}))]);
                          alert(massive3Data?`${massiveDest.length} email programmate per ${massive3Data}`:`${massiveDest.length} email inviate!`);
                          setMassiveDest([]);setMassiveTpl(null);setMassive3Data("");
                        }}>
                          {massive3Data?"📅 Programma invio":"📢 Invia ora"} a {massiveDest.length} clienti
                        </Btn>
                      </div>
                    </div>
                  )}

                  {/* ── PROGRAMMATE ── */}
                  {emailSection==="programmata"&&(
                    <div>
                      <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>Email programmate ({scheduledEmails.length})</div>
                      {scheduledEmails.length===0
                        ?<div style={{textAlign:"center",padding:"40px 0",color:"#C5C5C5"}}><div style={{fontSize:36,marginBottom:8}}>⏰</div><div style={{fontSize:14}}>Nessuna email programmata</div><div style={{fontSize:12,marginTop:4}}>Usa "Programma invio" quando scrivi una nuova email</div></div>
                        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {scheduledEmails.map(se=>(
                            <div key={se.id} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,padding:"14px 18px",display:"flex",alignItems:"center",gap:14}}>
                              <div style={{width:36,height:36,background:"#F4F4F4",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}>⏰</div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>{se.oggetto||se.nome}</div>
                                <div style={{fontSize:11,color:"#9CA3AF"}}>A: {se.a||se.nome} · Invio: {se.programmata||"—"}</div>
                              </div>
                              <div style={{display:"flex",gap:6,flexShrink:0}}>
                                <span style={{fontSize:11,fontWeight:700,background:"#F4F4F4",color:"#555",padding:"3px 10px",borderRadius:20}}>{se.stato}</span>
                                <button onClick={()=>setScheduledEmails(ss=>ss.filter(x=>x.id!==se.id))} style={{padding:"5px 10px",background:"none",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      }
                    </div>
                  )}

                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div className="card" style={{padding:16}}>
                    <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>Regole automatiche</div>
                    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:12,lineHeight:1.6}}>Ogni email viene analizzata e categorizzata automaticamente in base a queste regole.</div>
                    {REGOLE.map((r,i)=>(
                      <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #F5F5F5",display:"flex",gap:8,alignItems:"flex-start"}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:"#22C55E",marginTop:4,flexShrink:0}}/>
                        <div><div style={{fontSize:11,fontWeight:600,color:"#555",fontFamily:"monospace",marginBottom:2}}>"{r.p.source.replace(/\\/g,"")}"</div><div style={{fontSize:11,color:"#9CA3AF"}}>{r.az}</div></div>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{padding:16}}>
                    <div style={{fontWeight:800,fontSize:13,marginBottom:12}}>Statistiche</div>
                    {[["Ricevute",emails.length],["Non lette",emails.filter(e=>!e.letto).length],["Lead",emails.filter(e=>e.cat==="lead").length],["Task creati",emails.filter(e=>e.azione&&e.azione.includes("task")).length],["Archiviate",emails.filter(e=>e.azione==="archiviato").length]].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F5F5F5",fontSize:12}}>
                        <span style={{color:"#6B7280"}}>{k}</span><span style={{fontWeight:700}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {newEmailOpen&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewEmailOpen(false)}>
                  <div style={{background:"#fff",borderRadius:16,padding:28,width:640,maxWidth:"96vw",boxShadow:"0 24px 60px rgba(0,0,0,.2)",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                      <div style={{fontWeight:800,fontSize:18}}>✉ Nuova email</div>
                      {/* Selettore template */}
                      <select onChange={e=>{const tpl=templates.find(t=>t.id===e.target.value);if(tpl)setDraft(d=>({...d,oggetto:tpl.oggetto,corpo:tpl.corpo,tplId:tpl.id}));}} style={{padding:"6px 12px",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,outline:"none",maxWidth:200}}>
                        <option value="">📋 Usa template...</option>
                        {templates.map(t=><option key={t.id} value={t.id}>{t.nome}</option>)}
                      </select>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                      <input className="inp" placeholder="A: email@destinatario.it" value={draft.a} onChange={e=>setDraft(d=>({...d,a:e.target.value}))}/>
                      <input className="inp" placeholder="Oggetto" value={draft.oggetto} onChange={e=>setDraft(d=>({...d,oggetto:e.target.value}))}/>
                      <textarea className="inp" rows={7} placeholder="Messaggio… (usa {{nome}}, {{prodotto}}, {{prezzo}} come segnaposto)" value={draft.corpo} onChange={e=>setDraft(d=>({...d,corpo:e.target.value}))} style={{resize:"none",lineHeight:1.7,fontFamily:"inherit"}}/>
                    </div>
                    {/* Allegati */}
                    <div style={{marginBottom:12}}>
                      <label style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",border:"1px dashed #E5E5E5",borderRadius:8,fontSize:12,color:"#6B7280",cursor:"pointer"}}>
                        📎 Allega file
                        <input type="file" multiple style={{display:"none"}} onChange={ev=>{
                          const nomi=Array.from(ev.target.files).map(f=>f.name);
                          setDraft(d=>({...d,allegati:[...d.allegati,...nomi]}));
                          ev.target.value="";
                        }}/>
                      </label>
                      {draft.allegati.length>0&&(
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                          {draft.allegati.map((a,i)=>(
                            <span key={i} style={{padding:"3px 10px",background:"#F4F4F4",borderRadius:20,fontSize:11,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                              📎 {a}
                              <button onClick={()=>setDraft(d=>({...d,allegati:d.allegati.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"#9CA3AF",cursor:"pointer",fontSize:12,lineHeight:1}}>×</button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Data programmata */}
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18,padding:"10px 14px",background:"#F9F9F9",borderRadius:10}}>
                      <span style={{fontSize:12,color:"#6B7280",fontWeight:600}}>⏰ Programma invio:</span>
                      <input type="datetime-local" value={draft.programmata} onChange={e=>setDraft(d=>({...d,programmata:e.target.value}))}
                        style={{padding:"5px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,outline:"none",color:"#111"}}/>
                      {draft.programmata&&<button onClick={()=>setDraft(d=>({...d,programmata:""}))} style={{background:"none",border:"none",color:"#9CA3AF",fontSize:14,cursor:"pointer"}}>×</button>}
                      {!draft.programmata&&<span style={{fontSize:11,color:"#C5C5C5"}}>lascia vuoto per invio immediato</span>}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn style={{flex:1,padding:10}} onClick={()=>{
                        const ora=new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"});
                        if(draft.programmata){
                          setScheduledEmails(se=>[...se,{id:Date.now(),a:draft.a,oggetto:draft.oggetto,corpo:draft.corpo,allegati:draft.allegati,programmata:draft.programmata,stato:"in attesa"}]);
                        } else {
                          setEmails(es=>[{id:Date.now(),da:"fabio@mastro.app",nome:"Fabio",oggetto:draft.oggetto,corpo:draft.corpo,data:ora,letto:true,cat:"ops",azione:"inviata",prog:null,allegati:draft.allegati},...es]);
                        }
                        setDraft({a:"",oggetto:"",corpo:"",allegati:[],programmata:"",tplId:null});setNewEmailOpen(false);
                      }}>{draft.programmata?"📅 Programma invio":"Invia ora"}</Btn>
                      <BtnG style={{padding:"10px 18px"}} onClick={()=>setNewEmailOpen(false)}>Annulla</BtnG>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              LICENZE
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="licenze"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Centro di Comando</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em"}}>Licenze & Segnalazioni</div>
                </div>
                <div style={{fontSize:12,color:"#9CA3AF"}}>{lic.filter(l=>l.stato==="attiva").length} attive · {lic.filter(l=>l.stato==="trial").length} trial · <span style={{fontWeight:700,color:"#555"}}>{lic.reduce((s,l)=>s+l.seg.filter(sg=>sg.stato==="aperta").length,0)} segnalazioni</span></div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
                {["tutti",...new Set(lic.map(l=>l.prodotto))].map(f=>(
                  <button key={f} style={{padding:"6px 14px",borderRadius:9,border:"1px solid #E5E5E5",fontSize:11,fontWeight:600,background:filtroL===f?"#111":"#fff",color:filtroL===f?"#fff":"#6B7280",cursor:"pointer"}} onClick={()=>setFiltroL(f)}>{f==="tutti"?"Tutti":f}</button>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {lic.filter(l=>filtroL==="tutti"||l.prodotto===filtroL).map(l=>{
                  const io=licAp===l.id;const sl=STATO_L[l.stato]||STATO_L.attiva;const segAp=l.seg.filter(s=>s.stato==="aperta").length;
                  return(
                    <div key={l.id} style={{background:"#fff",border:`1px solid ${io?"#111":"#E5E5E5"}`,borderRadius:12,overflow:"hidden"}}>
                      <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px",cursor:"pointer"}} onClick={()=>setLicAp(io?null:l.id)}>
                        <div style={{width:36,height:36,background:"#F4F4F4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><span style={{fontSize:14,fontWeight:800,color:"#555"}}>{l.cliente[0]}</span></div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{l.cliente}</div>
                          <div style={{fontSize:11,color:"#9CA3AF"}}>{l.prodotto} · Piano {l.piano} · €{l.pr}/mese</div>
                        </div>
                        <div style={{display:"flex",gap:10,alignItems:"center",flexShrink:0}}>
                          {segAp>0&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:"#F4F4F4",color:"#555",border:"1px solid #E5E5E5"}}>⚠ {segAp}</span>}
                          <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:sl.bg,color:sl.text,display:"flex",alignItems:"center",gap:4}}><span style={{width:5,height:5,borderRadius:"50%",background:sl.dot,display:"inline-block"}}/>{sl.label}</span>
                          <div style={{textAlign:"right",minWidth:80}}><div style={{fontSize:10,color:"#9CA3AF"}}>Scade</div><div style={{fontSize:12,fontWeight:700}}>{l.sc}</div></div>
                          <Chevron open={io}/>
                        </div>
                      </div>
                      {io&&(
                        <div style={{borderTop:"1px solid #F0F0F0",background:"#FAFAFA",padding:"16px 18px"}} onClick={e=>e.stopPropagation()}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                            <div>
                              <Lbl c="Dettagli licenza"/>
                              {[["Email",l.email],["Piano",l.piano+" · €"+l.pr+"/mese"],["Stato",sl.label],["Ultimo pag.",l.pag],["Scadenza",l.sc]].map(([k,v])=>(
                                <div key={k} style={{display:"flex",gap:10,fontSize:12,marginBottom:6}}><span style={{color:"#9CA3AF",width:100,flexShrink:0}}>{k}</span><span style={{fontWeight:600}}>{v}</span></div>
                              ))}
                              <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
                                <Btn style={{fontSize:12,padding:"6px 14px"}} onClick={()=>setLic(ls=>ls.map(x=>x.id===l.id?{...x,stato:"attiva",pag:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"})}:x))}>✓ Pagato</Btn>
                                <BtnG style={{fontSize:12,padding:"6px 14px"}} onClick={()=>setLic(ls=>ls.map(x=>x.id===l.id?{...x,stato:"scaduta"}:x))}>Sospendi</BtnG>
                                <BtnG style={{fontSize:12,padding:"6px 14px"}} onClick={()=>{
                                  setDraft({a:l.email,oggetto:"",corpo:"",allegati:[],programmata:"",tplId:null});
                                  setNewEmailOpen(true);setSez("email");
                                }}>✉ Scrivi email</BtnG>
                                <BtnG style={{fontSize:12,padding:"6px 14px"}} onClick={()=>{
                                  const aug=templates.find(t=>t.id==="t4");
                                  if(aug)setDraft({a:l.email,oggetto:aug.oggetto.replace("{{nome}}",l.cliente),corpo:aug.corpo.replace(/{{nome}}/g,l.cliente),allegati:[],programmata:"",tplId:"t4"});
                                  setNewEmailOpen(true);setSez("email");
                                }}>🎂 Auguri</BtnG>
                              </div>
                            </div>
                            <div>
                              <Lbl c={`Segnalazioni (${l.seg.length})`}/>
                              {l.seg.length===0?<Nota c="Nessuna segnalazione"/>:l.seg.map(sg=>(
                                <div key={sg.id} style={{padding:"8px 10px",background:"#fff",border:"1px solid #E5E5E5",borderRadius:8,marginBottom:6}}>
                                  <div style={{display:"flex",justifyContent:"space-between"}}>
                                    <div style={{fontSize:12,fontWeight:600,color:"#374151"}}>{sg.testo}</div>
                                    <span style={{fontSize:10,color:sg.stato==="aperta"?"#555":"#9CA3AF",fontWeight:700,flexShrink:0,marginLeft:8}}>{sg.stato}</span>
                                  </div>
                                  <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{sg.data}</div>
                                  {sg.risposta&&<div style={{fontSize:11,color:"#2563EB",marginTop:4,background:"#EFF6FF",padding:"4px 8px",borderRadius:6}}>↩ {sg.risposta}</div>}
                                </div>
                              ))}
                              <div style={{display:"flex",gap:6,marginTop:8}}>
                                <input value={newSeg[l.id]||""} onChange={e=>setNewSeg(s=>({...s,[l.id]:e.target.value}))} placeholder="Aggiungi segnalazione..."
                                  style={{flex:1,padding:"6px 10px",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,outline:"none",background:"#fff"}}/>
                                <Btn onClick={()=>{
                                  if(!newSeg[l.id]?.trim())return;
                                  setLic(ls=>ls.map(x=>x.id===l.id?{...x,seg:[...x.seg,{id:Date.now(),testo:newSeg[l.id].trim(),stato:"aperta",data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),risposta:""}]}:x));
                                  setNewSeg(s=>({...s,[l.id]:""}));
                                }}>+</Btn>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FINANZA
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="finanza"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Gestione economica</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em"}}>Finanza</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <BtnG onClick={()=>setNewMovOpen(true)}>+ Movimento</BtnG>
                  <BtnG onClick={()=>setSpeseOpen(true)}>⚙ Spese correnti</BtnG>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
                {(()=>{
                  const entM=mov.filter(m=>m.tipo==="entrata").reduce((s,m)=>s+m.imp,0);
                  const usM=mov.filter(m=>m.tipo==="uscita").reduce((s,m)=>s+m.imp,0);
                  const saldo=entM-usM;
                  return[
                    {l:"Risparmi",v:"€130.000",s:"Disponibili",bt:"#111"},
                    {l:"Runway",v:runway+" mesi",s:"Burn €"+burn+"/mese",bt:burn===0?"#22C55E":"#9CA3AF"},
                    {l:"MRR",v:"€"+mrr,s:bk+"% break-even",bt:"#E5E5E5"},
                    {l:"Break-Even",v:"Mese 12-15",s:"Mancano €"+Math.max(0,2500-mrr),bt:"#E5E5E5"},
                    {l:"Cash flow",v:(saldo>=0?"+":"−")+"€"+Math.abs(saldo),s:"Entrate €"+entM+" / Uscite €"+usM,bt:saldo>=0?"#22C55E":"#EF4444"},
                  ].map((k,i)=>(
                    <div key={i} className="card" style={{padding:"14px 16px",borderTop:"3px solid "+k.bt}}>
                      <div style={{fontSize:9,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>{k.l}</div>
                      <div style={{fontSize:20,fontWeight:800,lineHeight:1}}>{k.v}</div>
                      <div style={{fontSize:11,color:"#9CA3AF",marginTop:5}}>{k.s}</div>
                    </div>
                  ));
                })()}
              </div>
              <div className="card" style={{padding:"12px 20px",marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <span style={{fontWeight:700,fontSize:13}}>Break-Even · Target €2.500/mese</span>
                  <span style={{fontWeight:800}}>€{mrr} / €2.500</span>
                </div>
                <div style={{height:9,background:"#F0F0F0",borderRadius:99,overflow:"hidden",marginBottom:5}}>
                  <div style={{height:"100%",background:"#111",borderRadius:99,width:bk+"%",transition:"width .5s"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9CA3AF"}}>
                  <span>{bk}% raggiunto</span><span>Mancano €{Math.max(0,2500-mrr)}/mese</span>
                </div>
              </div>
              <div style={{display:"flex",gap:3,marginBottom:14,background:"#F4F4F4",borderRadius:10,padding:4,width:"fit-content"}}>
                {[["overview","📊 Overview"],["spese","💸 Spese"],["movimenti","📋 Movimenti"],["cashflow","📈 Cashflow"],["simulatore","🎯 Simulatore"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setFinSection(v)} style={{padding:"7px 14px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,background:finSection===v?"#fff":"transparent",color:finSection===v?"#111":"#6B7280",boxShadow:finSection===v?"0 1px 4px rgba(0,0,0,.08)":"none",cursor:"pointer"}}>{l}</button>
                ))}
              </div>
              {finSection==="overview"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="card" style={{padding:20}}>
                    <Lbl c="MRR per progetto"/>
                    {proj.map(p=>{
                      const pct=Math.min(100,Math.round(p.mrr/2500*100));
                      return(
                        <div key={p.id} style={{marginBottom:13}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}>
                            <div style={{display:"flex",alignItems:"center",gap:7}}>
                              <div style={{width:9,height:9,borderRadius:"50%",background:p.col}}/>
                              <span style={{fontWeight:600}}>{p.nome}</span>
                            </div>
                            <span style={{fontWeight:800}}>€{p.mrr}/mese</span>
                          </div>
                          <div style={{height:6,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                            <div style={{height:"100%",background:p.col,borderRadius:99,width:pct+"%"}}/>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{marginTop:10,paddingTop:10,borderTop:"2px solid #E5E5E5",display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:15}}>
                      <span>MRR Totale</span><span>€{mrr}/mese</span>
                    </div>
                  </div>
                  <div className="card" style={{padding:20}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                      <Lbl c="Spese per categoria"/>
                      <button onClick={()=>setSpeseOpen(true)} style={{fontSize:10,color:"#9CA3AF",background:"none",border:"1px solid #E5E5E5",borderRadius:7,padding:"3px 10px",cursor:"pointer"}}>modifica</button>
                    </div>
                    {Object.entries(spese.filter(s=>s.attiva).reduce((acc,s)=>{acc[s.cat]=(acc[s.cat]||0)+s.imp;return acc;},{})
                    ).sort(([,a],[,b])=>b-a).map(([cat,tot])=>{
                      const col=CAT_SPESA[cat]||"#9CA3AF";
                      const pct=Math.round(tot/speseTot*100);
                      return(
                        <div key={cat} style={{marginBottom:9}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:col}}/>
                              <span style={{fontWeight:600}}>{cat}</span>
                            </div>
                            <span style={{fontWeight:700}}>€{tot}</span>
                          </div>
                          <div style={{height:4,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                            <div style={{height:"100%",background:col,borderRadius:99,width:pct+"%"}}/>
                          </div>
                        </div>
                      );
                    })}
                    <div style={{marginTop:10,paddingTop:10,borderTop:"2px solid #E5E5E5",display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14}}>
                      <span>Totale uscite</span><span>€{speseTot}/mese</span>
                    </div>
                  </div>
                  <div className="card" style={{padding:20,gridColumn:"1/-1"}}>
                    <Lbl c="Bilancio mensile"/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#15803D",textTransform:"uppercase",marginBottom:8}}>Entrate</div>
                        {[["MRR prodotti","€"+mrr],["NASpI","€1.200"],["Affitto Cosenza","€900"]].map(([k,v])=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F5F5F5"}}>
                            <span style={{color:"#555"}}>{k}</span><span style={{fontWeight:700,color:"#15803D"}}>{v}</span>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14,marginTop:8}}><span>Totale</span><span style={{color:"#15803D"}}>€{mrr+2100}</span></div>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:"#EF4444",textTransform:"uppercase",marginBottom:8}}>Uscite</div>
                        {Object.entries(spese.filter(s=>s.attiva).reduce((acc,s)=>{acc[s.cat]=(acc[s.cat]||0)+s.imp;return acc;},{})).map(([k,v])=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F5F5F5"}}>
                            <span style={{color:"#555"}}>{k}</span><span style={{fontWeight:700}}>€{v}</span>
                          </div>
                        ))}
                        <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:14,marginTop:8}}><span>Totale</span><span style={{color:"#EF4444"}}>€{speseTot}</span></div>
                      </div>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:8}}>Risultato</div>
                        {[["Entrate","€"+(mrr+2100)],["Uscite","€"+speseTot],["Saldo",(mrr+2100-speseTot>=0?"+":"−")+"€"+Math.abs(mrr+2100-speseTot)],["Burn","€"+burn+"/mese"],["Runway",runway+" mesi"]].map(([k,v])=>(
                          <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"5px 0",borderBottom:"1px solid #F5F5F5"}}>
                            <span style={{color:"#555"}}>{k}</span>
                            <span style={{fontWeight:800,color:k==="Saldo"?mrr+2100-speseTot>=0?"#15803D":"#EF4444":"#111"}}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {finSection==="spese"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:14,fontWeight:700}}>Spese ricorrenti ({spese.length})</div>
                    <Btn style={{fontSize:11}} onClick={()=>setSpeseOpen(true)}>+ Aggiungi</Btn>
                  </div>
                  {Object.entries(spese.reduce((acc,s)=>{if(!acc[s.cat])acc[s.cat]=[];acc[s.cat].push(s);return acc;},{})).map(([cat,items])=>{
                    const col=CAT_SPESA[cat]||"#9CA3AF";
                    const catTot=items.filter(s=>s.attiva).reduce((s,x)=>s+x.imp,0);
                    return(
                      <div key={cat} style={{marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7,padding:"7px 12px",background:"#F9F9F9",borderRadius:9}}>
                          <div style={{width:9,height:9,borderRadius:"50%",background:col}}/>
                          <span style={{fontWeight:700,fontSize:13}}>{cat}</span>
                          <span style={{marginLeft:"auto",fontWeight:800,color:col}}>€{catTot}/mese</span>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          {items.map(sp=>(
                            <div key={sp.id} style={{display:"flex",alignItems:"center",gap:12,padding:"9px 14px",background:"#fff",border:"1px solid #E5E5E5",borderRadius:9,opacity:sp.attiva?1:0.5}}>
                              <div onClick={()=>setSpese(ss=>ss.map(x=>x.id===sp.id?{...x,attiva:!x.attiva}:x))} style={{width:17,height:17,borderRadius:5,border:"2px solid "+(sp.attiva?"#111":"#D1D5DB"),background:sp.attiva?"#111":"#fff",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                                {sp.attiva&&<svg width="9" height="8" viewBox="0 0 9 8" fill="none"><path d="M1 4L3.5 6.5L8 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:13,fontWeight:600}}>{sp.desc}</div>
                                <div style={{fontSize:10,color:"#9CA3AF"}}>{sp.freq}</div>
                              </div>
                              <div style={{fontWeight:800,fontSize:15}}>€{sp.imp}</div>
                              <button onClick={()=>setSpese(ss=>ss.filter(x=>x.id!==sp.id))} style={{padding:"2px 8px",background:"none",border:"1px solid #F0F0F0",borderRadius:6,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{marginTop:14,padding:"11px 16px",background:"#F4F4F4",borderRadius:10,display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:700}}>Totale attive</span>
                    <span style={{fontWeight:800,fontSize:18}}>€{speseTot}/mese</span>
                  </div>
                </div>
              )}
              {finSection==="movimenti"&&(
                <div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",gap:3,background:"#F4F4F4",borderRadius:10,padding:4}}>
                      {[["tutti","Tutti"],["entrata","Entrate"],["uscita","Uscite"]].map(([v,l])=>(
                        <button key={v} onClick={()=>setMovSection(v)} style={{padding:"6px 12px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,background:movSection===v?"#fff":"transparent",color:movSection===v?"#111":"#6B7280",cursor:"pointer"}}>{l}</button>
                      ))}
                    </div>
                    <Btn style={{fontSize:11}} onClick={()=>setNewMovOpen(true)}>+ Nuovo</Btn>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {mov.filter(m=>movSection==="tutti"||m.tipo===movSection).map(m=>(
                      <div key={m.id} style={{display:"flex",alignItems:"center",gap:14,padding:"11px 16px",background:"#fff",border:"1px solid #E5E5E5",borderRadius:11}}>
                        <div style={{width:34,height:34,borderRadius:9,background:m.tipo==="entrata"?"#F0FDF4":"#FFF5F5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:15}}>
                          {m.tipo==="entrata"?"↑":"↓"}
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700}}>{m.desc}</div>
                          <div style={{fontSize:10,color:"#9CA3AF"}}>{m.cat} · {m.data}</div>
                        </div>
                        <div style={{fontWeight:800,fontSize:15,color:m.tipo==="entrata"?"#15803D":"#374151"}}>
                          {m.tipo==="entrata"?"+":"−"}€{m.imp}
                        </div>
                        <button onClick={()=>setMov(ms=>ms.filter(x=>x.id!==m.id))} style={{padding:"2px 8px",background:"none",border:"1px solid #F0F0F0",borderRadius:6,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {finSection==="cashflow"&&(
                <div style={{display:"flex",flexDirection:"column",gap:14}}>
                  <div className="card" style={{padding:20}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Cassa disponibile — realistico</div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={cf} margin={{top:5,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
                        <XAxis dataKey="mese" tick={{fontSize:11,fill:"#9CA3AF"}}/>
                        <YAxis tickFormatter={v=>"€"+Math.round(v/1000)+"k"} tick={{fontSize:11,fill:"#9CA3AF"}} width={52}/>
                        <Tooltip formatter={v=>["€"+v.toLocaleString("it-IT")]} contentStyle={{borderRadius:8,border:"1px solid #E5E5E5",fontSize:12}}/>
                        <Line type="monotone" dataKey="cReal" name="Cassa" stroke="#111" strokeWidth={2.5} dot={{r:3,fill:"#111"}}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card" style={{padding:20}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Confronto scenari</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={cf} margin={{top:5,right:10,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
                        <XAxis dataKey="mese" tick={{fontSize:11,fill:"#9CA3AF"}}/>
                        <YAxis tickFormatter={v=>"€"+Math.round(v/1000)+"k"} tick={{fontSize:11,fill:"#9CA3AF"}} width={52}/>
                        <Tooltip contentStyle={{borderRadius:8,border:"1px solid #E5E5E5",fontSize:12}}/>
                        <Legend wrapperStyle={{fontSize:12}}/>
                        <Line type="monotone" dataKey="cOtt" name="Ottimistico" stroke="#111" strokeWidth={2} dot={false}/>
                        <Line type="monotone" dataKey="cReal" name="Realistico" stroke="#6B7280" strokeWidth={2} dot={false} strokeDasharray="6 3"/>
                        <Line type="monotone" dataKey="cPess" name="Pessimistico" stroke="#D1D5DB" strokeWidth={2} dot={false} strokeDasharray="3 3"/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {finSection==="simulatore"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="card" style={{padding:20}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Simulatore MRR</div>
                    {proj.map(p=>(
                      <div key={p.id} style={{marginBottom:16}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            <div style={{width:8,height:8,borderRadius:"50%",background:p.col}}/>
                            <span style={{fontWeight:600}}>{p.nome}</span>
                          </div>
                          <span style={{fontWeight:700}}>€{p.prezzo}×{p.betaClienti} = €{p.mrr}</span>
                        </div>
                        <input type="range" min={0} max={30} value={p.betaClienti}
                          onChange={e=>setProj(ps=>ps.map(x=>x.id===p.id?{...x,betaClienti:parseInt(e.target.value),mrr:parseInt(e.target.value)*x.prezzo}:x))}
                          style={{width:"100%",accentColor:p.col}}/>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#C5C5C5",marginTop:2}}>
                          <span>0</span><span>{p.betaClienti} clienti</span><span>30</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="card" style={{padding:20}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Risultato</div>
                    {(()=>{
                      const simMrr=proj.reduce((s,p)=>s+p.mrr,0);
                      const simBurn=Math.max(0,speseTot-entratePas-simMrr);
                      const simRunway=simBurn>0?Math.floor(130000/simBurn):459;
                      const simBk=Math.min(100,Math.round(simMrr/2500*100));
                      return(
                        <div>
                          {[["MRR simulato","€"+simMrr+"/mese"],["Break-even",simBk+"%"],["Burn","€"+simBurn+"/mese"],["Runway",simRunway+" mesi"]].map(([k,v])=>(
                            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F5F5F5",fontSize:13}}>
                              <span style={{color:"#555"}}>{k}</span><span style={{fontWeight:800}}>{v}</span>
                            </div>
                          ))}
                          <div style={{marginTop:12,height:8,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                            <div style={{height:"100%",background:"#111",borderRadius:99,width:simBk+"%",transition:"width .3s"}}/>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              {speseOpen&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setSpeseOpen(false)}>
                  <div style={{background:"#fff",borderRadius:16,padding:28,width:480,maxWidth:"95vw",boxShadow:"0 24px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontWeight:800,fontSize:18,marginBottom:18}}>+ Spesa corrente</div>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                      <input className="inp" placeholder="Descrizione (es. Figma Pro)" value={newSpesa.desc} onChange={e=>setNewSpesa(n=>({...n,desc:e.target.value}))}/>
                      <div style={{display:"flex",gap:8}}>
                        <select className="inp" style={{flex:1}} value={newSpesa.cat} onChange={e=>setNewSpesa(n=>({...n,cat:e.target.value}))}>
                          {["Famiglia","SaaS Tools","Marketing","Abbonamenti","Personale","Altro"].map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                        <input className="inp" style={{width:90}} type="number" placeholder="€" value={newSpesa.imp} onChange={e=>setNewSpesa(n=>({...n,imp:e.target.value}))}/>
                        <select className="inp" style={{width:120}} value={newSpesa.freq} onChange={e=>setNewSpesa(n=>({...n,freq:e.target.value}))}>
                          {["mensile","annuale","una tantum"].map(f=><option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn style={{flex:1,padding:10}} onClick={()=>{
                        if(!newSpesa.desc||!newSpesa.imp)return;
                        setSpese(ss=>[...ss,{id:"s"+Date.now(),cat:newSpesa.cat,desc:newSpesa.desc,imp:parseInt(newSpesa.imp)||0,freq:newSpesa.freq,attiva:true}]);
                        setNewSpesa({desc:"",cat:"Famiglia",imp:"",freq:"mensile"});
                        setSpeseOpen(false);
                      }}>Aggiungi</Btn>
                      <BtnG style={{padding:"10px 18px"}} onClick={()=>setSpeseOpen(false)}>Annulla</BtnG>
                    </div>
                  </div>
                </div>
              )}
              {newMovOpen&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewMovOpen(false)}>
                  <div style={{background:"#fff",borderRadius:16,padding:28,width:440,maxWidth:"95vw",boxShadow:"0 24px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontWeight:800,fontSize:18,marginBottom:18}}>+ Movimento</div>
                    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                      <div style={{display:"flex",gap:6}}>
                        {[["entrata","↑ Entrata"],["uscita","↓ Uscita"]].map(([v,l])=>(
                          <button key={v} onClick={()=>setNm(n=>({...n,tipo:v}))} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer",background:nm.tipo===v?(v==="entrata"?"#F0FDF4":"#FFF5F5"):"#F4F4F4",color:nm.tipo===v?(v==="entrata"?"#15803D":"#EF4444"):"#9CA3AF"}}>{l}</button>
                        ))}
                      </div>
                      <input className="inp" placeholder="Descrizione" value={nm.desc} onChange={e=>setNm(n=>({...n,desc:e.target.value}))}/>
                      <div style={{display:"flex",gap:8}}>
                        <select className="inp" style={{flex:1}} value={nm.cat} onChange={e=>setNm(n=>({...n,cat:e.target.value}))}>
                          {["MRR","Passiva","SaaS Tools","Marketing","Famiglia","Altro"].map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                        <input className="inp" style={{width:100}} type="number" placeholder="€" value={nm.imp} onChange={e=>setNm(n=>({...n,imp:e.target.value}))}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn style={{flex:1,padding:10}} onClick={()=>{
                        if(!nm.desc||!nm.imp)return;
                        setMov(ms=>[{id:Date.now(),data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),tipo:nm.tipo,cat:nm.cat,desc:nm.desc,imp:parseInt(nm.imp)||0},...ms]);
                        setNm({tipo:"uscita",cat:"SaaS Tools",desc:"",imp:""});
                        setNewMovOpen(false);
                      }}>Aggiungi</Btn>
                      <BtnG style={{padding:"10px 18px"}} onClick={()=>setNewMovOpen(false)}>Annulla</BtnG>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {sez==="campagne"&&(
            <div className="fade">

              {/* HEADER */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Marketing · Growth</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em"}}>Campagne Pubblicitarie</div>
                </div>
                <Btn onClick={()=>setNewCampOpen(true)} style={{fontSize:14,padding:"10px 20px"}}>＋ Nuova campagna</Btn>
              </div>

              {/* KPI BAR 7 card */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:16}}>
                {(()=>{
                  const att=camp.filter(c=>c.stato==="attiva");
                  const totS=camp.reduce((s,c)=>s+c.speso,0);
                  const totB=camp.reduce((s,c)=>s+c.budget_totale,0);
                  const totI=camp.reduce((s,c)=>s+(c.impressioni||0),0);
                  const totCl=camp.reduce((s,c)=>s+(c.click||0),0);
                  const totL=camp.reduce((s,c)=>s+(c.leads||0),0);
                  const totT=camp.reduce((s,c)=>s+(c.trial||0),0);
                  const cpa=totL>0?(totS/totL).toFixed(0):"—";
                  return[
                    {l:"Attive",v:att.length,s:"di "+camp.length,bt:"#111"},
                    {l:"Speso",v:"€"+totS,s:"budget €"+totB,bt:"#9CA3AF"},
                    {l:"Impressioni",v:totI>999?(totI/1000).toFixed(1)+"k":totI,s:"copertura",bt:"#3B82F6"},
                    {l:"Click",v:totCl,s:totI>0?((totCl/totI)*100).toFixed(2)+"% CTR":"—",bt:"#3B82F6"},
                    {l:"Lead",v:totL,s:"generati",bt:"#22C55E"},
                    {l:"Trial",v:totT,s:totL>0?Math.round(totT/totL*100)+"% da lead":"—",bt:"#22C55E"},
                    {l:"CPA",v:cpa!=="—"?"€"+cpa:"—",s:"costo/lead",bt:cpa!=="—"&&parseInt(cpa)<50?"#22C55E":"#F59E0B"},
                  ].map((k,i)=>(
                    <div key={i} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,padding:"11px 13px",borderTop:"3px solid "+k.bt}}>
                      <div style={{fontSize:9,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>{k.l}</div>
                      <div style={{fontSize:18,fontWeight:800,color:"#111"}}>{k.v}</div>
                      <div style={{fontSize:9,color:"#9CA3AF",marginTop:2}}>{k.s}</div>
                    </div>
                  ));
                })()}
              </div>

              {/* TABS */}
              <div style={{display:"flex",gap:3,background:"#F4F4F4",borderRadius:10,padding:4,marginBottom:16,width:"fit-content"}}>
                {[["lista","📋 Campagne"],["confronto","📊 Canali"],["roi","💰 ROI & Funnel"],["creativita","🎨 Creatività"],["materiali","📁 Materiali"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setCampTab(v)} style={{padding:"7px 15px",borderRadius:8,border:"none",fontSize:12,fontWeight:600,background:campTab===v?"#fff":"transparent",color:campTab===v?"#111":"#6B7280",boxShadow:campTab===v?"0 1px 4px rgba(0,0,0,.08)":"none",cursor:"pointer"}}>{l}</button>
                ))}
              </div>

              {/* ══ TAB LISTA ══ */}
              {campTab==="lista"&&(
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {camp.map(c=>{
                    const can=CANALI[c.canale]||{l:c.canale,col:"#9CA3AF",icon:"?"};
                    const isAp=campAp===c.id;
                    const pct=c.budget_totale>0?Math.min(100,Math.round(c.speso/c.budget_totale*100)):0;
                    const stCol={attiva:"#22C55E",pausa:"#9CA3AF",pianificata:"#D97706",completata:"#111"}[c.stato]||"#9CA3AF";
                    const stBg={attiva:"#F0FDF4",pausa:"#F4F4F4",pianificata:"#FFF7ED",completata:"#F4F4F4"}[c.stato]||"#F4F4F4";
                    const detT=campDetTab[c.id]||"dati";
                    const campFiles=files["camp_"+c.id]||[];
                    return(
                      <div key={c.id} style={{background:"#fff",border:"1px solid "+(isAp?can.col:"#E5E5E5"),borderRadius:16,overflow:"hidden",boxShadow:isAp?"0 6px 24px "+can.col+"30":"0 1px 4px rgba(0,0,0,.04)"}}>

                        {/* ROW header */}
                        <div style={{padding:"15px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}} onClick={()=>setCampAp(isAp?null:c.id)}>
                          <div style={{width:42,height:42,borderRadius:12,background:can.col,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 2px 8px "+can.col+"50"}}>
                            <span style={{color:"#fff",fontWeight:900,fontSize:13}}>{can.icon}</span>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5,flexWrap:"wrap"}}>
                              <span style={{fontWeight:800,fontSize:15}}>{c.nome}</span>
                              <span style={{fontSize:10,fontWeight:700,color:stCol,background:stBg,padding:"2px 9px",borderRadius:20}}>{c.stato}</span>
                              <span style={{fontSize:10,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>{OBJ[c.obiettivo]||c.obiettivo}</span>
                              <span style={{fontSize:10,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>{can.l}</span>
                              {campFiles.length>0&&<span style={{fontSize:10,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>📎 {campFiles.length}</span>}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{flex:1,maxWidth:240,height:6,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                                <div style={{height:"100%",background:can.col,borderRadius:99,width:pct+"%",transition:"width .4s"}}/>
                              </div>
                              <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>€{c.speso} / {c.budget_totale===0?"free":"€"+c.budget_totale}</span>
                              <span style={{fontSize:11,color:"#C5C5C5"}}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:18,flexShrink:0}}>
                            {[["Impr.",c.impressioni>999?(c.impressioni/1000).toFixed(1)+"k":c.impressioni||0],["Click",c.click||0],["Lead",c.leads||0],["Trial",c.trial||0],["CPA",c.cpa>0?"€"+c.cpa:"—"]].map(([lk,vk])=>(
                              <div key={lk} style={{textAlign:"center"}}>
                                <div style={{fontSize:14,fontWeight:800}}>{vk}</div>
                                <div style={{fontSize:9,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",letterSpacing:".05em"}}>{lk}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                            <span style={{fontSize:10,color:"#9CA3AF"}}>{c.data_inizio}→{c.data_fine||"∞"}</span>
                            <Chevron open={isAp}/>
                          </div>
                        </div>

                        {/* DETAIL ESPANSO */}
                        {isAp&&(
                          <div style={{borderTop:"1px solid #F0F0F0",background:"#FAFAFA"}} onClick={e=>e.stopPropagation()}>

                            {/* sotto-tab bar */}
                            <div style={{display:"flex",borderBottom:"1px solid #F0F0F0",background:"#fff"}}>
                              {[["dati","📊 Dati"],["metriche","✏️ Aggiorna"],["creativita","🎨 Creatività"],["storia","📈 Storico"],["file","📁 File"],["note","📝 Note"]].map(([tv,tl])=>(
                                <button key={tv} onClick={()=>setCampDetTab(p=>({...p,[c.id]:tv}))} style={{padding:"9px 15px",border:"none",borderBottom:"2px solid "+(detT===tv?can.col:"transparent"),background:"transparent",fontSize:11,fontWeight:detT===tv?700:500,color:detT===tv?"#111":"#9CA3AF",cursor:"pointer",whiteSpace:"nowrap"}}>{tl}</button>
                              ))}
                              <div style={{marginLeft:"auto",padding:"5px 14px",display:"flex",gap:5,alignItems:"center"}}>
                                {c.stato==="attiva"&&<button onClick={()=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,stato:"pausa"}:x))} style={{padding:"3px 10px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,fontWeight:700,color:"#555",cursor:"pointer"}}>⏸</button>}
                                {c.stato==="pausa"&&<button onClick={()=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,stato:"attiva"}:x))} style={{padding:"3px 10px",background:"#111",border:"none",borderRadius:7,fontSize:11,fontWeight:700,color:"#fff",cursor:"pointer"}}>▶</button>}
                                <button onClick={()=>setCamp(cs=>cs.filter(x=>x.id!==c.id))} style={{padding:"3px 8px",background:"none",border:"1px solid #F0F0F0",borderRadius:7,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                              </div>
                            </div>

                            {/* TAB DATI */}
                            {detT==="dati"&&(
                              <div style={{padding:"18px 22px",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:18}}>
                                <div>
                                  <Lbl c="Budget & Periodo"/>
                                  <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"13px 15px"}}>
                                    <div style={{height:8,background:"#F0F0F0",borderRadius:99,overflow:"hidden",marginBottom:10}}>
                                      <div style={{height:"100%",background:can.col,borderRadius:99,width:pct+"%"}}/>
                                    </div>
                                    {[["Budget","€"+c.budget_totale],["Speso","€"+c.speso],["Rimanente","€"+(c.budget_totale-c.speso)],["Consumo",pct+"%"],["Inizio",c.data_inizio],["Fine",c.data_fine||"∞"],["Canale",can.l],["Obiettivo",OBJ[c.obiettivo]||c.obiettivo],["Progetto",c.progetto||"—"]].map(([rk,rv])=>(
                                      <div key={rk} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #F8F8F8",fontSize:11}}>
                                        <span style={{color:"#9CA3AF"}}>{rk}</span>
                                        <span style={{fontWeight:700}}>{rv}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Lbl c="Performance"/>
                                  <div style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:12,padding:"13px 15px"}}>
                                    {(c.canale==="email"
                                      ?[["Email inviate",c.impressioni||0],["Aperture",c.aperture||0],["Tasso apertura",(c.tasso_apertura||0)+"%"],["Click email",c.click_email||0],["Tasso click",(c.tasso_click||0)+"%"],["Disiscritti",c.disiscritti||0]]
                                      :[["Impressioni",(c.impressioni||0).toLocaleString("it-IT")],["Click",(c.click||0).toLocaleString("it-IT")],["CTR",(c.ctr||0)+"%"],["CPC","€"+(c.cpc||0)],["Conversioni",c.conversioni||0],["Lead",c.leads||0],["Trial",c.trial||0]]
                                    ).map(([pk,pv])=>(
                                      <div key={pk} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #F8F8F8",fontSize:11}}>
                                        <span style={{color:"#9CA3AF"}}>{pk}</span>
                                        <span style={{fontWeight:700}}>{pv}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <Lbl c="Indicatori efficienza"/>
                                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                    {[
                                      {ek:"CPA",ev:c.cpa>0?"€"+c.cpa:"—",good:c.cpa>0&&c.cpa<50},
                                      {ek:"CPC",ev:c.cpc>0?"€"+c.cpc:"—",good:c.cpc>0&&c.cpc<1},
                                      {ek:"CTR",ev:c.ctr>0?c.ctr+"%":"—",good:c.ctr>1.5},
                                      {ek:"Lead→Trial",ev:c.leads>0?Math.round((c.trial||0)/c.leads*100)+"%":"—",good:((c.trial||0)/Math.max(1,c.leads))>0.3},
                                      {ek:"€/trial",ev:c.trial>0&&c.speso>0?"€"+Math.round(c.speso/c.trial):"—",good:c.trial>0&&c.speso/c.trial<100},
                                      {ek:"ROAS",ev:c.roas>0?c.roas+"x":"—",good:c.roas>2},
                                    ].map(ef=>(
                                      <div key={ef.ek} style={{background:"#fff",border:"1px solid "+(ef.ev!=="—"&&ef.good?"#BBF7D0":"#F0F0F0"),borderRadius:9,padding:"8px 12px"}}>
                                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                                          <span style={{fontSize:10,color:"#9CA3AF",fontWeight:600}}>{ef.ek}</span>
                                          <span style={{fontSize:16,fontWeight:800,color:ef.ev!=="—"&&ef.good?"#15803D":"#111"}}>{ef.ev}</span>
                                        </div>
                                        {ef.ev!=="—"&&<div style={{fontSize:9,fontWeight:700,color:ef.good?"#15803D":"#9CA3AF",marginTop:2}}>{ef.good?"✓ Buono":"↗ Ottimizzare"}</div>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* TAB AGGIORNA METRICHE */}
                            {detT==="metriche"&&(
                              <div style={{padding:"18px 22px"}}>
                                <Lbl c="Aggiorna metriche campagna"/>
                                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
                                  {[
                                    {k:"budget_totale",l:"Budget €",t:"number"},
                                    {k:"speso",l:"Speso €",t:"number"},
                                    {k:"impressioni",l:"Impressioni",t:"number"},
                                    {k:"click",l:"Click",t:"number"},
                                    {k:"leads",l:"Lead",t:"number"},
                                    {k:"trial",l:"Trial",t:"number"},
                                    {k:"ctr",l:"CTR %",t:"number"},
                                    {k:"cpc",l:"CPC €",t:"number"},
                                    {k:"cpa",l:"CPA €",t:"number"},
                                    {k:"roas",l:"ROAS x",t:"number"},
                                    {k:"data_inizio",l:"Data inizio",t:"text"},
                                    {k:"data_fine",l:"Data fine",t:"text"},
                                  ].map(({k,l,t})=>(
                                    <div key={k}>
                                      <div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{l}</div>
                                      <input className="inp" type={t} defaultValue={c[k]||""} style={{fontSize:12}}
                                        onBlur={e=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,[k]:t==="number"?parseFloat(e.target.value)||0:e.target.value}:x))}/>
                                    </div>
                                  ))}
                                </div>
                                <div style={{display:"flex",gap:8}}>
                                  <select className="inp" style={{maxWidth:160}} defaultValue={c.stato} onBlur={e=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,stato:e.target.value}:x))}>
                                    {["attiva","pausa","pianificata","completata"].map(s=><option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <select className="inp" style={{maxWidth:160}} defaultValue={c.canale} onBlur={e=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,canale:e.target.value}:x))}>
                                    {Object.entries(CANALI).map(([k,can])=><option key={k} value={k}>{can.l}</option>)}
                                  </select>
                                  <select className="inp" style={{maxWidth:160}} defaultValue={c.obiettivo} onBlur={e=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,obiettivo:e.target.value}:x))}>
                                    {Object.entries(OBJ).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                                  </select>
                                </div>
                                <div style={{marginTop:12,padding:"10px 14px",background:"#F0FDF4",borderRadius:9,fontSize:12,color:"#15803D",fontWeight:600}}>
                                  ✓ Ogni modifica viene salvata automaticamente quando esci dal campo (Tab o click fuori)
                                </div>
                              </div>
                            )}

                            {/* TAB CREATIVITA */}
                            {detT==="creativita"&&(
                              <div style={{padding:"18px 22px"}}>
                                <Lbl c={"Annunci e creatività ("+c.creativita.length+")"}/>
                                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                  {c.creativita.map(cr=>{
                                    const crSt={attiva:"#15803D",pausa:"#9CA3AF",bozza:"#D97706"}[cr.stato]||"#9CA3AF";
                                    return(
                                      <div key={cr.id} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:11,padding:"12px 16px"}}>
                                        <div style={{display:"flex",alignItems:"center",gap:11}}>
                                          <div style={{width:32,height:32,background:"#F4F4F4",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>
                                            {cr.tipo==="testo"?"✍️":cr.tipo==="immagine"?"🖼️":cr.tipo==="carosello"?"📊":cr.tipo==="email"?"✉️":cr.tipo==="articolo"?"📝":"📌"}
                                          </div>
                                          <div style={{flex:1}}>
                                            <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{cr.titolo}</div>
                                            <span style={{fontSize:9,color:crSt,background:crSt+"18",padding:"2px 7px",borderRadius:20,fontWeight:700}}>{cr.stato}</span>
                                            <span style={{fontSize:9,color:"#9CA3AF",marginLeft:6}}>{cr.tipo}</span>
                                          </div>
                                          <div style={{display:"flex",gap:12,flexShrink:0}}>
                                            {[["Click",cr.click],["Conv.",cr.conversioni]].map(([ck,cv])=>(
                                              <div key={ck} style={{textAlign:"center"}}>
                                                <div style={{fontSize:13,fontWeight:800}}>{cv}</div>
                                                <div style={{fontSize:9,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase"}}>{ck}</div>
                                              </div>
                                            ))}
                                          </div>
                                          <button onClick={()=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,creativita:x.creativita.map(y=>y.id===cr.id?{...y,stato:y.stato==="attiva"?"pausa":"attiva"}:y)}:x))}
                                            style={{padding:"3px 10px",background:"#F4F4F4",border:"1px solid #E5E5E5",borderRadius:7,fontSize:11,fontWeight:700,color:"#555",cursor:"pointer",flexShrink:0}}>
                                            {cr.stato==="attiva"?"⏸":"▶"}
                                          </button>
                                        </div>
                                        {cr.click>0&&(
                                          <div style={{marginTop:8}}>
                                            <div style={{height:3,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                                              <div style={{height:"100%",background:can.col,borderRadius:99,width:Math.min(100,Math.round(cr.click/Math.max(1,c.click)*100))+"%"}}/>
                                            </div>
                                            <div style={{fontSize:9,color:"#9CA3AF",marginTop:2}}>{Math.round(cr.click/Math.max(1,c.click)*100)}% click totali</div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {c.creativita.length===0&&<div style={{textAlign:"center",padding:"20px 0",color:"#C5C5C5",fontSize:12}}>Nessun annuncio ancora</div>}
                                </div>
                              </div>
                            )}

                            {/* TAB STORICO */}
                            {detT==="storia"&&(
                              <div style={{padding:"18px 22px"}}>
                                <Lbl c="Andamento nel tempo"/>
                                {c.storia.length===0
                                  ?<div style={{textAlign:"center",padding:"24px 0",color:"#C5C5C5",fontSize:12}}>Campagna non ancora avviata</div>
                                  :<div>
                                    <ResponsiveContainer width="100%" height={180}>
                                      <LineChart data={c.storia} margin={{top:5,right:10,left:0,bottom:5}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0"/>
                                        <XAxis dataKey="data" tick={{fontSize:10,fill:"#9CA3AF"}}/>
                                        <YAxis tick={{fontSize:10,fill:"#9CA3AF"}} width={32}/>
                                        <Tooltip contentStyle={{borderRadius:8,border:"1px solid #E5E5E5",fontSize:11}}/>
                                        <Legend wrapperStyle={{fontSize:11}}/>
                                        <Line type="monotone" dataKey="click" name="Click" stroke={can.col} strokeWidth={2} dot={{r:3}}/>
                                        <Line type="monotone" dataKey="speso" name="€ Speso" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 3" dot={false}/>
                                        <Line type="monotone" dataKey="conv" name="Conv." stroke="#22C55E" strokeWidth={2} dot={{r:3}}/>
                                      </LineChart>
                                    </ResponsiveContainer>
                                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginTop:10}}>
                                      {c.storia.map((st,si)=>(
                                        <div key={si} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:8,padding:"8px 10px",fontSize:11}}>
                                          <div style={{fontWeight:700,color:"#9CA3AF",marginBottom:3}}>{st.data}</div>
                                          <div>€{st.speso}</div>
                                          <div>{st.click} click · {st.conv} conv.</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                }
                              </div>
                            )}

                            {/* TAB FILE */}
                            {detT==="file"&&(
                              <div style={{padding:"18px 22px"}}>
                                <Lbl c={"File allegati a questa campagna ("+campFiles.length+")"}/>
                                <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                                  {campFiles.map(f=>(
                                    <div key={f.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",border:"1px solid #E5E5E5",borderRadius:10}}>
                                      <span style={{fontSize:20,flexShrink:0}}>{FILE_ICONS[f.ext]||"📄"}</span>
                                      <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.nome}</div>
                                        <div style={{fontSize:10,color:"#9CA3AF"}}>{f.data}{f.size&&" · "+f.size+"KB"}</div>
                                      </div>
                                      {f.tipo==="code"&&<button onClick={()=>setViewFile(f)} style={{padding:"4px 10px",background:"#111",color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>Apri</button>}
                                      {f.tipo==="link"&&<a href={f.url} target="_blank" rel="noreferrer" style={{padding:"4px 10px",background:"#111",color:"#fff",borderRadius:7,fontSize:11,fontWeight:700,textDecoration:"none",flexShrink:0}}>↗ Apri</a>}
                                      {f.tipo==="binary"&&f.contenuto&&<a href={f.contenuto} download={f.nome} style={{padding:"4px 10px",background:"#111",color:"#fff",borderRadius:7,fontSize:11,fontWeight:700,textDecoration:"none",flexShrink:0}}>↓ Scarica</a>}
                                      <button onClick={()=>removeFile("camp_"+c.id,f.id)} style={{padding:"3px 7px",background:"none",border:"1px solid #F0F0F0",borderRadius:6,fontSize:12,color:"#D1D5DB",cursor:"pointer",flexShrink:0}}>×</button>
                                    </div>
                                  ))}
                                  {campFiles.length===0&&<div style={{textAlign:"center",padding:"16px 0",color:"#C5C5C5",fontSize:12}}>Nessun file allegato</div>}
                                </div>
                                <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",border:"2px dashed #E5E5E5",borderRadius:11,cursor:"pointer",background:"#fff",marginBottom:8}}>
                                  <span style={{fontSize:20}}>📎</span>
                                  <div>
                                    <div style={{fontSize:12,fontWeight:700,color:"#555"}}>Allega file alla campagna</div>
                                    <div style={{fontSize:10,color:"#9CA3AF"}}>PDF, immagini, screenshot, brief, report...</div>
                                  </div>
                                  <input type="file" multiple style={{display:"none"}} onChange={e=>{
                                    Array.from(e.target.files).forEach(f=>{
                                      const ext=f.name.split(".").pop().toLowerCase();
                                      const isCode=["js","jsx","ts","tsx","py","html","css","json","md","txt","sql","csv"].includes(ext);
                                      const reader=new FileReader();
                                      if(isCode){
                                        reader.onload=ev=>addFile("camp_"+c.id,{id:Date.now()+Math.random(),nome:f.name,ext,tipo:"code",contenuto:ev.target.result,url:null,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),size:Math.round(f.size/1024)});
                                        reader.readAsText(f);
                                      } else {
                                        reader.onload=ev=>addFile("camp_"+c.id,{id:Date.now()+Math.random(),nome:f.name,ext,tipo:"binary",contenuto:ev.target.result,url:null,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),size:Math.round(f.size/1024)});
                                        reader.readAsDataURL(f);
                                      }
                                    });
                                    e.target.value="";
                                  }}/>
                                </label>
                                <input className="inp" placeholder="+ Link (https://...) · Premi Invio" style={{fontSize:11}} onKeyDown={e=>{
                                  if(e.key==="Enter"&&e.target.value.trim()){
                                    const url=e.target.value.trim();
                                    addFile("camp_"+c.id,{id:Date.now(),nome:url.replace(/^https?:\/\//,"").split("/")[0],ext:"url",tipo:"link",contenuto:null,url,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),size:null});
                                    e.target.value="";
                                  }
                                }}/>
                              </div>
                            )}

                            {/* TAB NOTE */}
                            {detT==="note"&&(
                              <div style={{padding:"18px 22px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                                <div>
                                  <Lbl c="Note libere"/>
                                  <textarea defaultValue={c.note} rows={7} onBlur={e=>setCamp(cs=>cs.map(x=>x.id===c.id?{...x,note:e.target.value}:x))}
                                    style={{width:"100%",padding:"10px 13px",border:"1px solid #E5E5E5",borderRadius:10,fontSize:12,lineHeight:1.7,outline:"none",resize:"none",background:"#fff"}}/>
                                </div>
                                <div>
                                  <Lbl c="Suggerimenti automatici"/>
                                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                                    {c.ctr>0&&c.ctr<1&&<div style={{padding:"10px 13px",background:"#FFF7ED",borderRadius:9,fontSize:12,borderLeft:"3px solid #D97706"}}>💡 CTR {c.ctr}% — sotto media. Prova headline diversi.</div>}
                                    {c.cpa>50&&c.cpa>0&&<div style={{padding:"10px 13px",background:"#FFF7ED",borderRadius:9,fontSize:12,borderLeft:"3px solid #D97706"}}>💡 CPA alto (€{c.cpa}). Ottimizza la landing page.</div>}
                                    {c.leads>0&&(c.trial||0)===0&&<div style={{padding:"10px 13px",background:"#FFF7ED",borderRadius:9,fontSize:12,borderLeft:"3px solid #D97706"}}>💡 {c.leads} lead, 0 trial. Controlla l&apos;onboarding.</div>}
                                    {c.ctr>2&&c.leads>3&&<div style={{padding:"10px 13px",background:"#F0FDF4",borderRadius:9,fontSize:12,borderLeft:"3px solid #22C55E"}}>✓ Ottimo CTR e lead. Valuta di aumentare il budget.</div>}
                                    {c.speso===0&&c.stato==="pianificata"&&<div style={{padding:"10px 13px",background:"#F4F4F4",borderRadius:9,fontSize:12,borderLeft:"3px solid #9CA3AF"}}>📅 Non ancora iniziata. Prepara creatività in anticipo.</div>}
                                    {c.budget_totale>0&&pct>=90&&<div style={{padding:"10px 13px",background:"#FFF5F5",borderRadius:9,fontSize:12,borderLeft:"3px solid #EF4444"}}>⚠️ Budget quasi esaurito ({pct}%). Rinnova o pianifica.</div>}
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        )}
                      </div>
                    );
                  })}
                  {camp.length===0&&(
                    <div style={{textAlign:"center",padding:"60px 0",color:"#C5C5C5"}}>
                      <div style={{fontSize:48,marginBottom:12}}>📣</div>
                      <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Nessuna campagna ancora</div>
                      <div style={{fontSize:13}}>Crea la tua prima campagna con il bottone in alto a destra</div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ TAB CONFRONTO ══ */}
              {campTab==="confronto"&&(
                <div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                    {Object.entries(CANALI).map(([key,can])=>{
                      const cc=camp.filter(c=>c.canale===key);
                      if(cc.length===0)return null;
                      const tS=cc.reduce((s,c)=>s+c.speso,0);
                      const tL=cc.reduce((s,c)=>s+(c.leads||0),0);
                      const tCl=cc.reduce((s,c)=>s+(c.click||0),0);
                      const tLAll=camp.reduce((s,c)=>s+(c.leads||0),0);
                      return(
                        <div key={key} className="card" style={{padding:"15px 18px",borderTop:"3px solid "+can.col}}>
                          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                            <div style={{width:30,height:30,borderRadius:8,background:can.col,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{color:"#fff",fontWeight:800,fontSize:11}}>{can.icon}</span>
                            </div>
                            <span style={{fontWeight:800,fontSize:13}}>{can.l}</span>
                          </div>
                          {[["Campagne",cc.length],["Speso","€"+tS],["Click",tCl.toLocaleString("it-IT")],["Lead",tL],["CPA",tL>0?"€"+(tS/tL).toFixed(0):"—"]].map(([rk,rv])=>(
                            <div key={rk} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"4px 0",borderBottom:"1px solid #F5F5F5"}}>
                              <span style={{color:"#9CA3AF"}}>{rk}</span><span style={{fontWeight:700}}>{rv}</span>
                            </div>
                          ))}
                          <div style={{marginTop:9}}>
                            <div style={{height:4,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                              <div style={{height:"100%",background:can.col,borderRadius:99,width:Math.min(100,Math.round(tL/Math.max(1,tLAll)*100))+"%"}}/>
                            </div>
                            <div style={{fontSize:9,color:"#9CA3AF",marginTop:2}}>{Math.round(tL/Math.max(1,tLAll)*100)}% dei lead totali</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="card" style={{overflow:"hidden"}}>
                    <div style={{padding:"10px 16px",borderBottom:"1px solid #F0F0F0",display:"grid",gridTemplateColumns:"2fr 1fr 70px 70px 70px 60px 60px 70px",gap:6,fontSize:9,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase"}}>
                      {["Campagna","Canale","Budget","Speso","Click","Lead","Trial","CPA"].map(h=><div key={h}>{h}</div>)}
                    </div>
                    {camp.map(c=>{
                      const can=CANALI[c.canale]||{l:c.canale,col:"#9CA3AF",icon:"?"};
                      return(
                        <div key={c.id} style={{padding:"10px 16px",borderBottom:"1px solid #F8F8F8",display:"grid",gridTemplateColumns:"2fr 1fr 70px 70px 70px 60px 60px 70px",gap:6,fontSize:12,alignItems:"center"}}>
                          <div style={{fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:11}}>{c.nome}</div>
                          <div><span style={{fontSize:9,color:"#fff",background:can.col,padding:"2px 7px",borderRadius:20,fontWeight:700}}>{can.icon}</span></div>
                          <div style={{color:"#9CA3AF",fontSize:11}}>€{c.budget_totale}</div>
                          <div style={{fontWeight:600}}>€{c.speso}</div>
                          <div style={{fontSize:11}}>{(c.click||0).toLocaleString("it-IT")}</div>
                          <div style={{fontWeight:700,color:"#15803D"}}>{c.leads||0}</div>
                          <div>{c.trial||0}</div>
                          <div style={{fontWeight:700}}>{c.cpa>0?"€"+c.cpa:"—"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ TAB ROI ══ */}
              {campTab==="roi"&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div className="card" style={{padding:20}}>
                    <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>Funnel di conversione</div>
                    {(()=>{
                      const tI=camp.reduce((s,c)=>s+(c.impressioni||0),0);
                      const tCl=camp.reduce((s,c)=>s+(c.click||0),0);
                      const tL=camp.reduce((s,c)=>s+(c.leads||0),0);
                      const tT=camp.reduce((s,c)=>s+(c.trial||0),0);
                      const tP=Math.round(tT*0.3);
                      return[
                        {fl:"Impressioni",fv:tI,fpct:100,fc:"#E5E5E5"},
                        {fl:"Click",fv:tCl,fpct:tI>0?Math.round(tCl/tI*100):0,fc:"#9CA3AF"},
                        {fl:"Lead",fv:tL,fpct:tCl>0?Math.round(tL/tCl*100):0,fc:"#555"},
                        {fl:"Trial",fv:tT,fpct:tL>0?Math.round(tT/tL*100):0,fc:"#374151"},
                        {fl:"Paganti (stima 30%)",fv:tP,fpct:tT>0?30:0,fc:"#15803D"},
                      ].map((step,si)=>(
                        <div key={si} style={{marginBottom:12}}>
                          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                            <span style={{fontWeight:600}}>{step.fl}</span>
                            <span style={{fontWeight:800}}>{step.fv.toLocaleString("it-IT")} <span style={{color:"#9CA3AF",fontSize:10,fontWeight:400}}>({step.fpct}%)</span></span>
                          </div>
                          <div style={{height:9,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                            <div style={{height:"100%",background:step.fc,borderRadius:99,width:step.fpct+"%"}}/>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <div className="card" style={{padding:20}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>ROI stimato</div>
                      {(()=>{
                        const tS=camp.reduce((s,c)=>s+c.speso,0);
                        const tT=camp.reduce((s,c)=>s+(c.trial||0),0);
                        const pg=Math.round(tT*0.3);
                        const mrr2=pg*39;
                        const ltv=mrr2*12;
                        const roi=tS>0?((ltv-tS)/tS*100).toFixed(0):"—";
                        return[["Spesa ads","€"+tS],["Trial generati",""+tT],["Paganti stimati","~"+pg],["MRR aggiuntivo","€"+mrr2+"/mese"],["LTV 12 mesi","€"+ltv],["ROI stimato",roi!=="—"?roi+"%":"—"]].map(([rk,rv])=>(
                          <div key={rk} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #F5F5F5",fontSize:12}}>
                            <span style={{color:"#6B7280"}}>{rk}</span><span style={{fontWeight:800}}>{rv}</span>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="card" style={{padding:20}}>
                      <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Obiettivi mensili</div>
                      {[{ol:"Lead",oa:camp.reduce((s,c)=>s+(c.leads||0),0),ot:20,oc:"#111"},{ol:"Trial",oa:camp.reduce((s,c)=>s+(c.trial||0),0),ot:8,oc:"#16A34A"},{ol:"Budget €",oa:camp.reduce((s,c)=>s+c.speso,0),ot:1000,oc:"#2563EB"}].map(ob=>{
                        const op=Math.min(100,Math.round(ob.oa/ob.ot*100));
                        return(
                          <div key={ob.ol} style={{marginBottom:12}}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                              <span style={{fontWeight:600}}>{ob.ol}</span><span>{ob.oa}/{ob.ot} ({op}%)</span>
                            </div>
                            <div style={{height:6,background:"#F0F0F0",borderRadius:99,overflow:"hidden"}}>
                              <div style={{height:"100%",background:ob.oc,borderRadius:99,width:op+"%"}}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ TAB CREATIVITA GLOBALE ══ */}
              {campTab==="creativita"&&(
                <div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Tutti gli annunci ({camp.reduce((s,c)=>s+c.creativita.length,0)})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {camp.flatMap(c=>c.creativita.map(cr=>({...cr,campNome:c.nome,campCol:CANALI[c.canale]?.col||"#9CA3AF"}))).map(cr=>{
                      const gSt={attiva:"#15803D",pausa:"#9CA3AF",bozza:"#D97706"}[cr.stato]||"#9CA3AF";
                      return(
                        <div key={cr.id} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:11,padding:"11px 16px",display:"flex",alignItems:"center",gap:12}}>
                          <div style={{width:32,height:32,background:"#F4F4F4",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14}}>
                            {cr.tipo==="testo"?"✍️":cr.tipo==="immagine"?"🖼️":cr.tipo==="carosello"?"📊":cr.tipo==="email"?"✉️":cr.tipo==="articolo"?"📝":"📌"}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:12,fontWeight:700}}>{cr.titolo}</div>
                            <div style={{fontSize:9,color:"#9CA3AF",marginTop:1}}>
                              <span style={{color:cr.campCol,fontWeight:700}}>{cr.campNome}</span>
                              <span style={{margin:"0 5px"}}>·</span>
                              <span>{cr.tipo}</span>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:12,flexShrink:0}}>
                            {[["Click",cr.click],["Conv.",cr.conversioni]].map(([gk,gv])=>(
                              <div key={gk} style={{textAlign:"center"}}>
                                <div style={{fontSize:13,fontWeight:800}}>{gv}</div>
                                <div style={{fontSize:9,color:"#9CA3AF",fontWeight:600,textTransform:"uppercase"}}>{gk}</div>
                              </div>
                            ))}
                          </div>
                          <span style={{fontSize:9,fontWeight:700,color:gSt,padding:"2px 9px",background:gSt+"18",borderRadius:20,flexShrink:0}}>{cr.stato}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ══ TAB MATERIALI GLOBALE ══ */}
              {campTab==="materiali"&&(
                <div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:14}}>
                    File allegati a tutte le campagne ({camp.reduce((s,c)=>s+(files["camp_"+c.id]||[]).length,0)})
                  </div>
                  {camp.map(c=>{
                    const cf=files["camp_"+c.id]||[];
                    if(cf.length===0)return null;
                    const can=CANALI[c.canale]||{l:c.canale,col:"#9CA3AF",icon:"?"};
                    return(
                      <div key={c.id} style={{marginBottom:16}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,padding:"7px 12px",background:"#F9F9F9",borderRadius:9}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:can.col}}/>
                          <span style={{fontWeight:700,fontSize:12}}>{c.nome}</span>
                          <span style={{fontSize:10,color:"#9CA3AF",marginLeft:"auto"}}>{cf.length} file</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                          {cf.map(f=>(
                            <div key={f.id} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",gap:9}}>
                              <span style={{fontSize:20,flexShrink:0}}>{FILE_ICONS[f.ext]||"📄"}</span>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.nome}</div>
                                <div style={{fontSize:9,color:"#9CA3AF"}}>{f.data}{f.size&&" · "+f.size+"KB"}</div>
                              </div>
                              {f.tipo==="code"&&<button onClick={()=>setViewFile(f)} style={{padding:"2px 8px",background:"#111",color:"#fff",border:"none",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>Apri</button>}
                              {f.tipo==="link"&&<a href={f.url} target="_blank" rel="noreferrer" style={{padding:"2px 8px",background:"#111",color:"#fff",borderRadius:6,fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>↗</a>}
                              {f.tipo==="binary"&&f.contenuto&&<a href={f.contenuto} download={f.nome} style={{padding:"2px 8px",background:"#111",color:"#fff",borderRadius:6,fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>↓</a>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {camp.reduce((s,c)=>s+(files["camp_"+c.id]||[]).length,0)===0&&(
                    <div style={{textAlign:"center",padding:"48px 0",color:"#C5C5C5"}}>
                      <div style={{fontSize:40,marginBottom:10}}>📁</div>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Nessun file ancora</div>
                      <div style={{fontSize:12}}>Apri una campagna, vai sul tab File e allegalo</div>
                    </div>
                  )}
                </div>
              )}

              {/* MODAL NUOVA CAMPAGNA */}
              {newCampOpen&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setNewCampOpen(false)}>
                  <div style={{background:"#fff",borderRadius:18,padding:30,width:580,maxWidth:"95vw",boxShadow:"0 24px 60px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontWeight:800,fontSize:18,marginBottom:20}}>＋ Nuova campagna</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                      <div style={{gridColumn:"1/-1"}}>
                        <input className="inp" placeholder="Nome campagna (es. MONTAGGI — Google Search Apr 2026)" value={nc.nome} onChange={e=>setNc(n=>({...n,nome:e.target.value}))}/>
                      </div>
                      <select className="inp" value={nc.canale} onChange={e=>setNc(n=>({...n,canale:e.target.value}))}>
                        {Object.entries(CANALI).map(([k,can])=><option key={k} value={k}>{can.l}</option>)}
                      </select>
                      <select className="inp" value={nc.obiettivo} onChange={e=>setNc(n=>({...n,obiettivo:e.target.value}))}>
                        {Object.entries(OBJ).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                      </select>
                      <input className="inp" type="number" placeholder="Budget totale €" value={nc.budget_totale||""} onChange={e=>setNc(n=>({...n,budget_totale:parseInt(e.target.value)||0}))}/>
                      <input className="inp" placeholder="Data inizio (es. 01 Mar 2026)" value={nc.data_inizio||""} onChange={e=>setNc(n=>({...n,data_inizio:e.target.value}))}/>
                      <div style={{gridColumn:"1/-1"}}>
                        <textarea className="inp" rows={3} placeholder="Note, obiettivi, target audience..." value={nc.note||""} onChange={e=>setNc(n=>({...n,note:e.target.value}))} style={{resize:"none",lineHeight:1.6}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <Btn style={{flex:1,padding:"11px 0",fontSize:14}} onClick={()=>{
                        if(!nc.nome)return;
                        const newId="c"+Date.now();
                        setCamp(cs=>[...cs,{id:newId,nome:nc.nome,canale:nc.canale,progetto:"",obiettivo:nc.obiettivo,stato:"pianificata",budget_totale:nc.budget_totale||0,speso:0,data_inizio:nc.data_inizio||"—",data_fine:"—",impressioni:0,click:0,conversioni:0,leads:0,trial:0,cpc:0,ctr:0,cpa:0,roas:0,note:nc.note||"",creativita:[],storia:[]}]);
                        setNc({nome:"",canale:"google",progetto:"",obiettivo:"trial",budget_totale:0,data_inizio:"",data_fine:"",note:""});
                        setNewCampOpen(false);
                        setCampAp(newId);
                      }}>Crea campagna</Btn>
                      <BtnG style={{padding:"11px 20px",fontSize:14}} onClick={()=>setNewCampOpen(false)}>Annulla</BtnG>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {sez==="lab"&&(
            <div className="fade">
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:".08em",marginBottom:3}}>Futuro</div>
                  <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em"}}>Lab Idee</div>
                </div>
                <div style={{fontSize:12,color:"#9CA3AF",textAlign:"right",lineHeight:1.6}}>Nessuna idea si perde.<br/>Si sviluppano quando MASTRO genera revenue.</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:9}}>
                {LAB.map(idea=>{
                  const io=openLab===idea.id;
                  const labFiles=files["lab_"+idea.id]||[];
                  return(
                    <div key={idea.id} style={{background:"#fff",border:"1px solid "+(io?"#111":"#E5E5E5"),borderRadius:14,overflow:"hidden",boxShadow:io?"0 4px 20px rgba(0,0,0,.08)":"none"}}>
                      <div style={{padding:"13px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}} onClick={()=>setOpenLab(io?null:idea.id)}>
                        <div style={{fontSize:18,flexShrink:0}}>{"⭐".repeat(idea.stelle)}</div>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                            <span style={{fontWeight:800,fontSize:14}}>{idea.nome}</span>
                            <span style={{fontSize:9,fontWeight:700,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>{idea.tag}</span>
                          </div>
                          <div style={{fontSize:12,color:"#9CA3AF"}}>{idea.nota}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
                          {labFiles.length>0&&<span style={{fontSize:10,color:"#9CA3AF",background:"#F4F4F4",padding:"2px 8px",borderRadius:20}}>📎 {labFiles.length}</span>}
                          <span style={{fontSize:11,color:"#9CA3AF",fontWeight:600}}>{idea.quando}</span>
                          <Chevron open={io}/>
                        </div>
                      </div>
                      {io&&(
                        <div style={{borderTop:"1px solid #F0F0F0",background:"#FAFAFA",padding:"16px 18px"}} onClick={e=>e.stopPropagation()}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                            <div>
                              <Lbl c="Note & Sviluppo"/>
                              <textarea defaultValue={idea.nota} rows={5}
                                style={{width:"100%",padding:"9px 12px",border:"1px solid #E5E5E5",borderRadius:9,fontSize:12,lineHeight:1.7,outline:"none",resize:"none",background:"#fff"}}
                                placeholder="Descrivi l'idea, target, monetizzazione..."/>
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}>
                                {[["Priorità",idea.stelle+" stelle"],["Timing",idea.quando],["Tag",idea.tag]].map(([k,v])=>(
                                  <div key={k} style={{background:"#fff",border:"1px solid #F0F0F0",borderRadius:8,padding:"7px 10px"}}>
                                    <div style={{fontSize:9,color:"#9CA3AF",fontWeight:700,textTransform:"uppercase",marginBottom:2}}>{k}</div>
                                    <div style={{fontSize:11,fontWeight:700}}>{v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <Lbl c={"File allegati ("+labFiles.length+")"}/>
                              <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:7}}>
                                {labFiles.map(f=>(
                                  <div key={f.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",background:"#fff",border:"1px solid #E5E5E5",borderRadius:8}}>
                                    <span style={{fontSize:15,flexShrink:0}}>{FILE_ICONS[f.ext]||"📄"}</span>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontSize:11,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.nome}</div>
                                      <div style={{fontSize:9,color:"#9CA3AF"}}>{f.data}{f.size&&" · "+f.size+"KB"}</div>
                                    </div>
                                    {f.tipo==="code"&&<button onClick={()=>setViewFile(f)} style={{padding:"2px 8px",background:"#111",color:"#fff",border:"none",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>Apri</button>}
                                    {f.tipo==="link"&&<a href={f.url} target="_blank" rel="noreferrer" style={{padding:"2px 8px",background:"#111",color:"#fff",borderRadius:6,fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>↗</a>}
                                    {f.tipo==="binary"&&f.contenuto&&<a href={f.contenuto} download={f.nome} style={{padding:"2px 8px",background:"#111",color:"#fff",borderRadius:6,fontSize:10,fontWeight:700,textDecoration:"none",flexShrink:0}}>↓</a>}
                                    <button onClick={()=>removeFile("lab_"+idea.id,f.id)} style={{padding:"2px 6px",background:"none",border:"1px solid #F0F0F0",borderRadius:6,fontSize:11,color:"#D1D5DB",cursor:"pointer",flexShrink:0}}>×</button>
                                  </div>
                                ))}
                              </div>
                              <label style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",border:"2px dashed #E5E5E5",borderRadius:9,cursor:"pointer",background:"#fff",marginBottom:7}}>
                                <span style={{fontSize:16}}>📎</span>
                                <span style={{fontSize:12,color:"#9CA3AF"}}>Clicca per allegare file</span>
                                <input type="file" multiple style={{display:"none"}} onChange={e=>{
                                  Array.from(e.target.files).forEach(f=>{
                                    const ext=f.name.split(".").pop().toLowerCase();
                                    const isCode=["js","jsx","ts","tsx","py","html","css","json","md","txt","sql","sh"].includes(ext);
                                    const reader=new FileReader();
                                    if(isCode){
                                      reader.onload=ev=>addFile("lab_"+idea.id,{id:Date.now()+Math.random(),nome:f.name,ext,tipo:"code",contenuto:ev.target.result,url:null,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),size:Math.round(f.size/1024)});
                                      reader.readAsText(f);
                                    } else {
                                      reader.onload=ev=>addFile("lab_"+idea.id,{id:Date.now()+Math.random(),nome:f.name,ext,tipo:"binary",contenuto:ev.target.result,url:null,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),size:Math.round(f.size/1024)});
                                      reader.readAsDataURL(f);
                                    }
                                  });
                                  e.target.value="";
                                }}/>
                              </label>
                              <input className="inp" placeholder="+ Link (https://...) · Premi Invio" style={{fontSize:11}} onKeyDown={e=>{
                                if(e.key==="Enter"&&e.target.value.trim()){
                                  const url=e.target.value.trim();
                                  addFile("lab_"+idea.id,{id:Date.now(),nome:url.replace(/^https?:\/\//,"").split("/")[0],ext:"url",tipo:"link",contenuto:null,url,data:new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"short"}),size:null});
                                  e.target.value="";
                                }
                              }}/>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              FILE
          ══════════════════════════════════════════════════════════════════ */}
          {sez==="file"&&(
            <div className="fade">
              <div style={{fontSize:25,fontWeight:800,letterSpacing:"-.03em",marginBottom:6}}>File</div>
              <div style={{fontSize:13,color:"#9CA3AF",marginBottom:22}}>Tutti i file e link salvati, organizzati per progetto.</div>
              {proj.map(p=>{
                const pFiles=files[p.id]||[];
                // mostra sempre
                return(
                  <div key={p.id} style={{marginBottom:22}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><button onClick={()=>{const n=prompt("Nome file/link:");if(!n)return;const t=prompt("Tipo","link");const c=prompt("URL o contenuto:");setFiles((f:any)=>({...f,[p.id]:[...(f[p.id]||[]),{id:String(Date.now()),nome:n,tipo:t||"link",contenuto:c||"",url:c||"",data:new Date().toLocaleDateString("it-IT"),size:0,ext:t||"link"}]}))}} style={{marginLeft:"auto",padding:"3px 10px",background:"#111",color:"#fff",border:"none",borderRadius:5,fontSize:11,cursor:"pointer"}}>+ file</button>
                      <div style={{width:8,height:8,borderRadius:"50%",background:p.col}}/>
                      <span style={{fontWeight:700,fontSize:14}}>{p.nome}</span>
                      <span style={{fontSize:11,color:"#9CA3AF"}}>{pFiles.length} file</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                      {pFiles.map(f=>(
                        <div key={f.id} style={{background:"#fff",border:"1px solid #E5E5E5",borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:8}}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                            <div style={{width:36,height:36,background:"#F4F4F4",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:16}}>{FILE_ICONS[f.ext]||"📄"}</div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.nome}</div>
                              <div style={{fontSize:10,color:"#9CA3AF",marginTop:2}}>{f.data}{f.size&&` · ${f.size}KB`}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:6}}>
                            {f.tipo==="code"&&<button onClick={()=>setViewFile(f)} style={{flex:1,padding:"5px 0",background:"#111",color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>Visualizza</button>}
                            {f.tipo==="link"&&<a href={f.url} target="_blank" rel="noreferrer" style={{flex:1,padding:"5px 0",background:"#111",color:"#fff",borderRadius:7,fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center",display:"block"}}>Apri ↗</a>}
                            {f.tipo==="binary"&&f.contenuto&&<a href={f.contenuto} download={f.nome} style={{flex:1,padding:"5px 0",background:"#111",color:"#fff",borderRadius:7,fontSize:11,fontWeight:700,textDecoration:"none",textAlign:"center",display:"block"}}>↓ Scarica</a>}
                            <button onClick={()=>removeFile(p.id,f.id)} style={{padding:"5px 10px",background:"none",border:"1px solid #E5E5E5",borderRadius:7,fontSize:12,color:"#D1D5DB",cursor:"pointer"}}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {Object.values(files).every(arr=>arr.length===0)&&(
                <div style={{textAlign:"center",padding:"60px 0",color:"#C5C5C5"}}>
                  <div style={{fontSize:48,marginBottom:12}}>📂</div>
                  <div style={{fontSize:15,fontWeight:600,marginBottom:6}}>Nessun file ancora</div>
                  <div style={{fontSize:13}}>Apri un progetto dalla sezione Progetti e carica i tuoi file dalla tab File</div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEWER CODICE
      ══════════════════════════════════════════════════════════════════════ */}
      {viewFile&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:1000,display:"flex",alignItems:"stretch",flexDirection:"column"}} onClick={()=>setViewFile(null)}>
          <div style={{background:"#1A1A1A",flex:1,display:"flex",flexDirection:"column",maxHeight:"100vh"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px",borderBottom:"1px solid #333",flexShrink:0}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontFamily:"monospace",fontSize:13,color:"#E5E5E5",fontWeight:700}}>{viewFile.nome}</span>
                <span style={{fontSize:10,color:"#666",background:"#333",padding:"2px 8px",borderRadius:20}}>.{viewFile.ext}</span>
                {viewFile.size&&<span style={{fontSize:10,color:"#666"}}>{viewFile.size}KB</span>}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>navigator.clipboard.writeText(viewFile.contenuto)} style={{padding:"6px 14px",background:"#333",color:"#ccc",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>Copia</button>
                <button onClick={()=>setViewFile(null)} style={{padding:"6px 14px",background:"#444",color:"#fff",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>✕ Chiudi</button>
              </div>
            </div>
            <div style={{flex:1,overflow:"auto",padding:20}}>
              <pre style={{fontFamily:"'Fira Code','Courier New',monospace",fontSize:12,lineHeight:1.8,color:"#E5E5E5",margin:0,whiteSpace:"pre-wrap",wordBreak:"break-all"}}>
                {viewFile.contenuto}
              </pre>
            </div>
            <div style={{padding:"8px 20px",borderTop:"1px solid #333",fontSize:10,color:"#555",flexShrink:0}}>
              {(viewFile.contenuto||"").split("\n").length} righe · {viewFile.data}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

