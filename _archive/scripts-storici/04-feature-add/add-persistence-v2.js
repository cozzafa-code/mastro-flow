const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');
const lines = c.split('\n');

// Trova "const renderClienti"
let insertLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const renderClienti')) {
    insertLine = i;
    break;
  }
}
if (insertLine === -1) { console.log('ERRORE: renderClienti non trovato'); process.exit(1); }
console.log('Inserimento a riga:', insertLine + 1);

// Variabili che ESISTONO nel componente:
// contatti, cantieri, events, fattureDB, pipelineDB, team, tasks, problemi,
// squadreDB, montaggiDB, aziendaInfo, sogliaDays, theme
// NON esistono: messaggi, coloriDB, sistemiDB, vetriDB, coprifiliDB, lamiereDB

const BLOCK = [
  '',
  '  // === PERSISTENZA LOCALSTORAGE ===',
  '  const STORAGE_KEY = "mastro_erp_data";',
  '  const [dataLoaded, setDataLoaded] = useState(false);',
  '',
  '  useEffect(() => {',
  '    try {',
  '      const saved = localStorage.getItem(STORAGE_KEY);',
  '      if (saved) {',
  '        const d = JSON.parse(saved);',
  '        if (d.contatti) setContatti(d.contatti);',
  '        if (d.cantieri) setCantieri(d.cantieri);',
  '        if (d.events) setEvents(d.events);',
  '        if (d.fattureDB) setFattureDB(d.fattureDB);',
  '        if (d.pipelineDB) setPipelineDB(d.pipelineDB);',
  '        if (d.team) setTeam(d.team);',
  '        if (d.tasks) setTasks(d.tasks);',
  '        if (d.problemi) setProblemi(d.problemi);',
  '        if (d.squadreDB) setSquadreDB(d.squadreDB);',
  '        if (d.montaggiDB) setMontaggiDB(d.montaggiDB);',
  '        if (d.aziendaInfo) setAziendaInfo(d.aziendaInfo);',
  '        if (d.sogliaDays !== undefined) setSogliaDays(d.sogliaDays);',
  '        if (d.theme) setTheme(d.theme);',
  '        console.log("MASTRO: dati caricati da localStorage");',
  '      }',
  '    } catch (e) { console.warn("Errore caricamento:", e); }',
  '    setDataLoaded(true);',
  '  }, []);',
  '',
  '  useEffect(() => {',
  '    if (!dataLoaded) return;',
  '    const timer = setTimeout(() => {',
  '      try {',
  '        localStorage.setItem(STORAGE_KEY, JSON.stringify({',
  '          contatti, cantieri, events, fattureDB, pipelineDB,',
  '          team, tasks, problemi, squadreDB, montaggiDB,',
  '          aziendaInfo, sogliaDays, theme,',
  '          _savedAt: new Date().toISOString()',
  '        }));',
  '      } catch (e) { console.warn("Errore salvataggio:", e); }',
  '    }, 1000);',
  '    return () => clearTimeout(timer);',
  '  }, [dataLoaded, contatti, cantieri, events, fattureDB, pipelineDB, team, tasks, problemi, squadreDB, montaggiDB, aziendaInfo, sogliaDays, theme]);',
  '',
];

lines.splice(insertLine, 0, ...BLOCK);
let final = lines.join('\n');

// Doppia conferma reset
const ripIdx = final.indexOf('Ripristina predefinita');
if (ripIdx > -1) {
  const before = final.substring(Math.max(0, ripIdx - 800), ripIdx);
  const onClickPos = before.lastIndexOf('onClick={()');
  if (onClickPos > -1) {
    const absPos = Math.max(0, ripIdx - 800) + onClickPos;
    const bracePos = final.indexOf('{', final.indexOf('=>', absPos));
    if (bracePos > -1 && bracePos < absPos + 200) {
      final = final.substring(0, bracePos + 1) +
        ' if(!confirm("ATTENZIONE: Sei sicuro di voler ripristinare tutti i dati?")) return; if(!confirm("ULTIMA CONFERMA: Tutti i dati torneranno ai dati demo. Confermi?")) return; localStorage.removeItem("mastro_erp_data"); ' +
        final.substring(bracePos + 1);
      console.log('Doppia conferma reset aggiunta');
    }
  }
}

fs.writeFileSync(f, final);
console.log('FATTO! Persistenza con variabili corrette');
