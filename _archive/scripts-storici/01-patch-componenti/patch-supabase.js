// patch-supabase.js — Connect MastroERP to Supabase
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// 1. Add import for supabase-sync after React import
const reactImport = 'import React, { useState, useRef, useCallback, useEffect } from "react";';
c = c.replace(reactImport, reactImport + '\nimport { getAziendaId, loadAllData, saveCantiere, saveEvent, deleteEvent, saveContatto, saveTeamMember, saveTask, saveAzienda, saveVano, deleteVano, saveMateriali, savePipeline } from "@/lib/supabase-sync";');
console.log('✓ Import added');

// 2. Add azId state + loading state + Supabase load effect after the tutoStep block
const tutoAnchor = 'const closeTuto = () => { setTutoStep(0);';
const tutoIdx = c.indexOf(tutoAnchor);
if (tutoIdx === -1) { console.error('tutoAnchor not found'); process.exit(1); }
// Find end of nextTuto line
let insertAfter = c.indexOf('const nextTuto', tutoIdx);
insertAfter = c.indexOf('\n', insertAfter) + 1;

const supabaseLoad = `
  // === SUPABASE DATA LAYER ===
  const [azId, setAzId] = useState<string | null>(null);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const id = await getAziendaId();
        if (!mounted || !id) { setDbLoading(false); return; }
        setAzId(id);
        const data = await loadAllData(id);
        if (!mounted) return;
        if (data.cantieri.length > 0) setCantieri(data.cantieri);
        if (data.events.length > 0) setEvents(data.events);
        if (data.contatti.length > 0) setContatti(data.contatti);
        if (data.team.length > 0) setTeam(data.team);
        if (data.tasks.length > 0) setTasks(data.tasks);
        if (data.msgs.length > 0) setMsgs(data.msgs);
        if (data.sistemi) setSistemiDB(data.sistemi);
        if (data.colori) setColoriDB(data.colori);
        if (data.vetri) setVetriDB(data.vetri);
        if (data.coprifili) setCoprifiliDB(data.coprifili);
        if (data.lamiere) setLamiereDB(data.lamiere);
        if (data.pipeline) setPipelineDB(data.pipeline);
        if (data.azienda) setAziendaInfo(prev => ({
          ...prev,
          ragione: data.azienda.ragione || prev.ragione,
          piva: data.azienda.piva || prev.piva,
          indirizzo: data.azienda.indirizzo || prev.indirizzo,
          telefono: data.azienda.telefono || prev.telefono,
          email: data.azienda.email || prev.email,
        }));
      } catch (e) { console.error('Supabase load error:', e); }
      if (mounted) setDbLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // Supabase auto-save: cantieri
  useEffect(() => {
    if (!azId || dbLoading) return;
    cantieri.forEach(c => saveCantiere(azId, c));
  }, [cantieri, azId, dbLoading]);

  // Supabase auto-save: events
  useEffect(() => {
    if (!azId || dbLoading) return;
    events.forEach(ev => saveEvent(azId, ev));
  }, [events, azId, dbLoading]);

  // Supabase auto-save: contatti
  useEffect(() => {
    if (!azId || dbLoading) return;
    contatti.forEach(ct => saveContatto(azId, ct));
  }, [contatti, azId, dbLoading]);

  // Supabase auto-save: team
  useEffect(() => {
    if (!azId || dbLoading) return;
    team.forEach(t => saveTeamMember(azId, t));
  }, [team, azId, dbLoading]);

  // Supabase auto-save: azienda info
  useEffect(() => {
    if (!azId || dbLoading) return;
    saveAzienda(azId, aziendaInfo);
  }, [aziendaInfo, azId, dbLoading]);

  // Supabase auto-save: pipeline
  useEffect(() => {
    if (!azId || dbLoading) return;
    savePipeline(azId, pipelineDB);
  }, [pipelineDB, azId, dbLoading]);

`;

c = c.substring(0, insertAfter) + supabaseLoad + c.substring(insertAfter);
console.log('✓ Supabase load + auto-save effects added');

fs.writeFileSync(file, c);
console.log('\n✅ Supabase connected!');
console.log('Lines: ' + c.split('\n').length);
