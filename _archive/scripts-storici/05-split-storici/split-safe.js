const fs = require('fs');
const f = 'components/MastroERP.tsx';
const c = fs.readFileSync(f, 'utf8');
const lines = c.split('\n');

// 1. Trova dove inizia il componente
let componentLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('export default function MastroMisure')) {
    componentLine = i;
    break;
  }
}
if (componentLine === -1) { console.log('ERRORE: componente non trovato'); process.exit(1); }
console.log('Componente inizia a riga:', componentLine + 1);

// 2. Separa: imports (righe con import/from), cloud sync, costanti
// Le prime righe fino al componente sono: "use client", commenti, imports, costanti
// Strategia: TUTTO prima di "export default function" va nel file costanti,
// TRANNE le righe di import e "use client" e cloud sync che restano nel principale

const beforeComponent = lines.slice(0, componentLine);
const afterComponent = lines.slice(componentLine);

// Identifica le righe che devono RESTARE nel file principale
const mainKeep = []; // righe che restano in MastroERP.tsx
const constLines = []; // righe che vanno in mastro-constants.tsx

for (let i = 0; i < beforeComponent.length; i++) {
  const line = beforeComponent[i];
  const trimmed = line.trim();
  
  // Queste restano nel file principale
  if (trimmed.startsWith('"use client"') ||
      trimmed.startsWith("'use client'") ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('// import ') ||
      trimmed.startsWith('import{') ||
      (trimmed.startsWith('//') && i < 10) || // commenti header
      trimmed === '') {
    mainKeep.push(line);
  }
  // Cloud sync helpers restano nel principale (usano supabase)
  else if (trimmed.startsWith('const SYNC_KEYS') ||
           trimmed.startsWith('let _sync') ||
           trimmed.startsWith('const cloudSave') ||
           trimmed.startsWith('const cloudLoadAll') ||
           trimmed.startsWith('const cloudDelete')) {
    mainKeep.push(line);
  }
  // Tutto il resto va nelle costanti
  else {
    constLines.push(line);
  }
}

// Gestisci blocchi multi-riga per cloud sync (funzioni che continuano su più righe)
// Ricostruiamo: prendiamo TUTTO da riga 0 a componentLine, poi separiamo meglio
// Approccio più sicuro: trova i blocchi precisi

// Reset
mainKeep.length = 0;
constLines.length = 0;

// Trova inizio/fine dei blocchi cloud sync
let inCloudSync = false;
let braceCount = 0;

for (let i = 0; i < beforeComponent.length; i++) {
  const line = beforeComponent[i];
  const trimmed = line.trim();
  
  // Header e imports
  if (i < 20 && (trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'") ||
      trimmed.startsWith('import ') || trimmed.startsWith('// import') ||
      trimmed.startsWith('// =') || trimmed.startsWith('// components') ||
      trimmed.startsWith('// MASTRO') || trimmed.startsWith('// Righe') ||
      trimmed.startsWith('// Continuazione') || trimmed === '')) {
    mainKeep.push(line);
    continue;
  }
  
  // Cloud sync section (da SYNC_KEYS fino a fine funzioni)
  if (trimmed.startsWith('// === CLOUD SYNC') || trimmed.startsWith('const SYNC_KEYS')) {
    inCloudSync = true;
  }
  
  if (inCloudSync) {
    mainKeep.push(line);
    // Conta le graffe per sapere quando finisce il blocco
    for (const ch of line) {
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    }
    // Fine della sezione cloud sync: quando troviamo una riga vuota dopo braceCount = 0
    // e la prossima riga non è parte di cloud sync
    if (braceCount <= 0 && i + 1 < beforeComponent.length) {
      const nextTrimmed = beforeComponent[i + 1]?.trim() || '';
      if (nextTrimmed === '' || 
          (!nextTrimmed.startsWith('const cloud') && 
           !nextTrimmed.startsWith('let _') &&
           !nextTrimmed.startsWith('const _') &&
           nextTrimmed.startsWith('/*') || nextTrimmed.startsWith('const ') || nextTrimmed === '')) {
        // Check se la prossima riga è ancora cloud sync
        if (!nextTrimmed.startsWith('const cloud') && !nextTrimmed.startsWith('let _sync')) {
          inCloudSync = false;
          braceCount = 0;
        }
      }
    }
    continue;
  }
  
  // Import lines (possono essere sparse)
  if (trimmed.startsWith('import ') || trimmed.startsWith('import{')) {
    mainKeep.push(line);
    continue;
  }
  
  // Tutto il resto → costanti
  constLines.push(line);
}

console.log('Righe per file principale (header+imports+cloud):', mainKeep.length);
console.log('Righe per file costanti:', constLines.length);

// 3. Crea file costanti
// Identifica le top-level const/function che devono essere esportate
const exportPrefixes = [
  'const PIPELINE_DEFAULT', 'const CANTIERI_INIT', 'const FATTURE_INIT',
  'const TASKS_INIT', 'const TEAM_INIT', 'const CONTATTI_INIT', 'const MONTAGGI_INIT',
  'const ICO', 'const Ico', 'const AFASE', 'const MOTIVI_BLOCCO',
  'const TIPI_EVENTO', 'const tipoEvColor', 'const THEMES', 'const PLANS',
  'const VIS', 'const MACRO_FASI', 'const genCode', 'const fmt',
  'const TIPOLOGIE', 'const ACCESSORI_DEFAULT', 'const S =',
  'function useDragOrder', 'const useDragOrder'
];

let exportedConst = constLines.map(line => {
  for (const prefix of exportPrefixes) {
    if (line.startsWith(prefix)) {
      return 'export ' + line;
    }
  }
  return line;
}).join('\n');

// Aggiungi React import per JSX (Ico component)
const constantsFile = 'import React from "react";\n\n' + exportedConst;

fs.writeFileSync('components/mastro-constants.tsx', constantsFile);
console.log('File creato: components/mastro-constants.tsx');

// 4. Costruisci gli import necessari
// Trova tutti i nomi esportati
const exportedNames = [];
for (const line of constLines) {
  for (const prefix of exportPrefixes) {
    if (line.startsWith(prefix)) {
      const name = prefix.replace('const ', '').replace('function ', '').replace(' =', '').trim();
      if (!exportedNames.includes(name)) exportedNames.push(name);
    }
  }
}

console.log('Costanti esportate:', exportedNames.join(', '));

const importLine = `import { ${exportedNames.join(', ')} } from "./mastro-constants";`;

// 5. Scrivi file principale
const mainFile = [
  ...mainKeep,
  '',
  importLine,
  '',
  ...afterComponent
].join('\n');

fs.writeFileSync(f, mainFile);

console.log('\nRisultato:');
console.log('  File principale:', mainFile.split('\n').length, 'righe');
console.log('  File costanti:', constantsFile.split('\n').length, 'righe');
console.log('  Import:', importLine.substring(0, 80) + '...');
console.log('\nTest: ricarica il browser!');
