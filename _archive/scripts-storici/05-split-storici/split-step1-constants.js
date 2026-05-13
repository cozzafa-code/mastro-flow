const fs = require('fs');
const f = 'components/MastroERP.tsx';
const c = fs.readFileSync(f, 'utf8');
const lines = c.split('\n');

// 1. Trova inizio costanti (PIPELINE_DEFAULT) e fine (export default function)
let constStart = -1;
let constEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('const PIPELINE_DEFAULT')) { constStart = i; }
  if (lines[i].startsWith('export default function MastroMisure')) { constEnd = i; break; }
}

if (constStart === -1 || constEnd === -1) {
  console.log('ERRORE: marcatori non trovati', constStart, constEnd);
  process.exit(1);
}

console.log('Costanti: righe', constStart + 1, '-', constEnd);

// 2. Estrai le costanti
const constantLines = lines.slice(constStart, constEnd);

// 3. Crea il file delle costanti
const constantsFile = [
  '// mastro-constants.ts — Costanti e dati demo MASTRO ERP',
  '// Estratto automaticamente da MastroERP.tsx',
  '',
  ...constantLines,
  ''
].join('\n');

// 4. Aggiungi "export" alle dichiarazioni const di primo livello
let exportedFile = constantsFile;
const topLevelConsts = [
  'const PIPELINE_DEFAULT',
  'const CANTIERI_INIT',
  'const FATTURE_INIT', 
  'const TASKS_INIT',
  'const TEAM_INIT',
  'const CONTATTI_INIT',
  'const MONTAGGI_INIT',
  'const ICO',
  'const AFASE',
  'const MOTIVI_BLOCCO',
  'const TIPI_EVENTO',
  'const tipoEvColor',
  'const THEMES',
  'const VIS',
  'const MACRO_FASI',
  'const genCode',
  'const fmt',
  'const TIPOLOGIE',
  'const ACCESSORI_DEFAULT',
];

let exportCount = 0;
for (const prefix of topLevelConsts) {
  // Solo se inizia a colonna 0 (top-level, non dentro funzione)
  const regex = new RegExp('^(' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gm');
  const before = exportedFile;
  exportedFile = exportedFile.replace(regex, 'export $1');
  if (exportedFile !== before) exportCount++;
}

console.log('Export aggiunti:', exportCount);

fs.writeFileSync('components/mastro-constants.ts', exportedFile);
console.log('File creato: components/mastro-constants.ts');

// 5. Nel file principale: sostituisci le costanti con import
const importLine = 'import { PIPELINE_DEFAULT, CANTIERI_INIT, FATTURE_INIT, TASKS_INIT, TEAM_INIT, CONTATTI_INIT, MONTAGGI_INIT, ICO, AFASE, MOTIVI_BLOCCO, TIPI_EVENTO, tipoEvColor, THEMES, genCode, fmt } from "./mastro-constants";';

// Rimuovi le righe delle costanti e inserisci l'import
const newLines = [
  ...lines.slice(0, constStart),
  '',
  importLine,
  '',
  ...lines.slice(constEnd)
];

fs.writeFileSync(f, newLines.join('\n'));

const saved = lines.length - newLines.length;
console.log('\nRighe rimosse dal file principale:', saved);
console.log('Nuove righe file principale:', newLines.length);
console.log('\nTest: npm run dev e verifica che tutto funziona identico');
