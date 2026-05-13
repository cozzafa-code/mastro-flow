const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Rimuovi il blocco persistenza dalla posizione sbagliata
const startMarker = '// ═══ PERSISTENZA LOCALSTORAGE ═══';
const endMarker = '}, [dataLoaded, contatti, cantieri, events, fattureDB, pipelineDB, team, tasks, problemi, messaggi, squadreDB, montaggiDB, coloriDB, sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, sogliaDays, theme]);';

const startIdx = c.indexOf(startMarker);
const endIdx = c.indexOf(endMarker);

if (startIdx === -1) {
  console.log('Blocco persistenza non trovato!');
  process.exit(1);
}

// Trova inizio riga del marker
const lineStart = c.lastIndexOf('\n', startIdx);
// Trova fine riga dopo endMarker
const lineEnd = c.indexOf('\n', endIdx + endMarker.length);

const removedBlock = c.substring(lineStart, lineEnd + 1);
c = c.substring(0, lineStart) + c.substring(lineEnd + 1);
console.log('1. Rimosso blocco persistenza da riga sbagliata');

// Rimuovi anche dataLoaded state se presente nella posizione sbagliata
// (potrebbe essere stato aggiunto dal blocco)

// 2. Inserisci nella posizione giusta: dopo selectedCliente useState
const insertAfter = 'const [editingCliente, setEditingCliente] = useState(null);';
const insertIdx = c.indexOf(insertAfter);

if (insertIdx === -1) {
  // Prova dopo selectedCliente
  const alt = 'const [selectedCliente, setSelectedCliente] = useState<any>(null);';
  const altIdx = c.indexOf(alt);
  if (altIdx === -1) {
    console.log('Punto inserimento non trovato!');
    process.exit(1);
  }
  const nl = c.indexOf('\n', altIdx);
  c = c.substring(0, nl + 1) + '\n' + removedBlock.trim() + '\n\n' + c.substring(nl + 1);
} else {
  const nl = c.indexOf('\n', insertIdx);
  c = c.substring(0, nl + 1) + '\n' + removedBlock.trim() + '\n\n' + c.substring(nl + 1);
}

console.log('2. Blocco persistenza spostato dopo useState');

fs.writeFileSync(f, c);
console.log('\nFatto! Persistenza ora dentro il componente');
