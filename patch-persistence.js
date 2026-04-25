const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');
let changes = 0;

// ═══ 1. SALVATAGGIO AUTOMATICO SU LOCALSTORAGE ═══
// Cerchiamo dove finiscono le dichiarazioni useState principali
// e aggiungiamo useEffect per save/load

const SAVE_LOAD_CODE = `
  // ═══ PERSISTENZA LOCALSTORAGE ═══
  const STORAGE_KEY = "mastro_erp_data";
  const [dataLoaded, setDataLoaded] = useState(false);

  // Carica dati salvati al mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.contatti) setContatti(d.contatti);
        if (d.cantieri) setCantieri(d.cantieri);
        if (d.events) setEvents(d.events);
        if (d.fattureDB) setFattureDB(d.fattureDB);
        if (d.pipelineDB) setPipelineDB(d.pipelineDB);
        if (d.team) setTeam(d.team);
        if (d.tasks) setTasks(d.tasks);
        if (d.problemi) setProblemi(d.problemi);
        if (d.messaggi) setMessaggi(d.messaggi);
        if (d.squadreDB) setSquadreDB(d.squadreDB);
        if (d.montaggiDB) setMontaggiDB(d.montaggiDB);
        if (d.coloriDB) setColoriDB(d.coloriDB);
        if (d.sistemiDB) setSistemiDB(d.sistemiDB);
        if (d.vetriDB) setVetriDB(d.vetriDB);
        if (d.coprifiliDB) setCoprifiliDB(d.coprifiliDB);
        if (d.lamiereDB) setLamiereDB(d.lamiereDB);
        if (d.aziendaInfo) setAziendaInfo(d.aziendaInfo);
        if (d.sogliaDays !== undefined) setSogliaDays(d.sogliaDays);
        if (d.theme) setTheme(d.theme);
        console.log("\✅ MASTRO: dati caricati da localStorage");
      }
    } catch (e) { console.warn("Errore caricamento dati:", e); }
    setDataLoaded(true);
  }, []);

  // Salva dati ad ogni modifica (con debounce)
  useEffect(() => {
    if (!dataLoaded) return;
    const timer = setTimeout(() => {
      try {
        const d = {
          contatti, cantieri, events, fattureDB, pipelineDB,
          team, tasks, problemi, messaggi, squadreDB, montaggiDB,
          coloriDB, sistemiDB, vetriDB, coprifiliDB, lamiereDB,
          aziendaInfo, sogliaDays, theme,
          _savedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
      } catch (e) { console.warn("Errore salvataggio:", e); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [dataLoaded, contatti, cantieri, events, fattureDB, pipelineDB, team, tasks, problemi, messaggi, squadreDB, montaggiDB, coloriDB, sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, sogliaDays, theme]);
`;

// Trova un buon punto per inserire il codice (dopo gli useState, prima dei render)
// Cerchiamo "// Derived data" o "const today" o simile
const insertPoints = [
  'const oggi =',
  'const today =',
  'const PIPELINE =',
  '// Derived',
  '// Calendar',
  '// Helper'
];

let insertIdx = -1;
for (const marker of insertPoints) {
  const idx = c.indexOf(marker);
  if (idx > -1 && idx < 15000) {
    insertIdx = c.lastIndexOf('\n', idx) + 1;
    break;
  }
}

if (insertIdx === -1) {
  // Fallback: cerca dopo l'ultimo useState
  const lastUseState = c.lastIndexOf('useState(');
  if (lastUseState > -1) {
    const nl = c.indexOf('\n', lastUseState);
    insertIdx = nl + 1;
  }
}

if (insertIdx > -1) {
  c = c.substring(0, insertIdx) + SAVE_LOAD_CODE + '\n' + c.substring(insertIdx);
  changes++;
  console.log('1. Persistenza localStorage aggiunta');
} else {
  console.log('1. ERRORE: punto inserimento non trovato');
}

// ═══ 2. DOPPIA CONFERMA RESET ═══
// Cerca il bottone "Ripristina predefinita" o simile reset
const resetPatterns = [
  'Ripristina predefinita',
  'Reset dati',
  'Pulisci tutto',
  'Cancella tutto'
];

let resetFixed = false;
for (const pat of resetPatterns) {
  const idx = c.indexOf(pat);
  if (idx > -1) {
    // Cerca il onClick più vicino prima di questo testo
    const searchBack = c.substring(Math.max(0, idx - 500), idx);
    const onClickIdx = searchBack.lastIndexOf('onClick');
    if (onClickIdx > -1) {
      const absIdx = Math.max(0, idx - 500) + onClickIdx;
      // Trova la fine dell'onClick handler
      const arrowIdx = c.indexOf('=>', absIdx);
      if (arrowIdx > -1 && arrowIdx < absIdx + 100) {
        // Trova il contenuto dell'handler
        const braceStart = c.indexOf('{', arrowIdx);
        if (braceStart > -1 && braceStart < arrowIdx + 10) {
          // Wrap con confirm
          const oldHandler = c.substring(absIdx, braceStart + 1);
          const newHandler = oldHandler.replace(
            '{',
            '{ if(!window.confirm("\⚠\️ ATTENZIONE\\n\\nSei sicuro di voler cancellare TUTTI i dati?\\nQuesta azione non \è reversibile.")) return; if(!window.confirm("\\u{1F534} ULTIMA CONFERMA\\n\\nTutti i clienti, commesse, fatture e impostazioni verranno eliminati.\\nConfermi?")) return; localStorage.removeItem("mastro_erp_data");'
          );
          c = c.substring(0, absIdx) + newHandler + c.substring(absIdx + oldHandler.length);
          resetFixed = true;
          changes++;
          console.log('2. Doppia conferma reset aggiunta per: ' + pat);
          break;
        }
      }
    }
  }
}

if (!resetFixed) {
  console.log('2. Reset handler non trovato (da aggiungere manualmente)');
}

// ═══ 3. AGGIUNGI useEffect all'import se manca ═══
if (!c.includes('useEffect')) {
  c = c.replace(
    "import { useState } from 'react'",
    "import { useState, useEffect } from 'react'"
  );
  c = c.replace(
    'import { useState } from "react"',
    'import { useState, useEffect } from "react"'
  );
  // Anche pattern con altre importazioni
  if (c.includes('useState') && !c.includes('useEffect')) {
    c = c.replace(/import\s*{([^}]*useState[^}]*)}\s*from\s*['"]react['"]/,
      (match, imports) => {
        if (!imports.includes('useEffect')) {
          return match.replace(imports, imports + ', useEffect');
        }
        return match;
      }
    );
  }
  changes++;
  console.log('3. useEffect aggiunto agli import');
} else {
  console.log('3. useEffect gia importato');
}

fs.writeFileSync(f, c);
console.log('\n' + changes + ' modifiche applicate');
console.log('\nOra i dati vengono:');
console.log('  - SALVATI automaticamente ad ogni modifica (debounce 1s)');
console.log('  - CARICATI automaticamente al refresh pagina');
console.log('  - RESET richiede DOPPIA conferma + pulisce localStorage');
console.log('\nTest: modifica un cliente, refresh pagina, verifica che i dati ci sono!');
