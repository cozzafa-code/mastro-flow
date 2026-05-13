// patch-all-v2.js — ALL patches in one safe script
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');
let lines;

// ═══════════════════════════════════════
// 1. ADD SUPABASE IMPORT
// ═══════════════════════════════════════
const reactImport = 'import React, { useState, useRef, useCallback, useEffect } from "react";';
if (!c.includes('supabase-sync')) {
  c = c.replace(reactImport, reactImport + '\nimport { getAziendaId, loadAllData, saveCantiere, saveEvent, deleteEvent as deleteEventDB, saveContatto, saveTeamMember, saveTask, saveAzienda, saveVano, deleteVano, saveMateriali, savePipeline } from "@/lib/supabase-sync";');
  console.log('✓ 1. Supabase import added');
} else {
  console.log('- 1. Import already exists');
}

// ═══════════════════════════════════════
// 2. ADD SUPABASE DATA LAYER (after localStorage effects)
// ═══════════════════════════════════════
if (!c.includes('SUPABASE DATA LAYER')) {
  const anchor = "useEffect(()=>{try{localStorage.setItem(\"mastro:azienda\"";
  const anchorIdx = c.indexOf(anchor);
  if (anchorIdx === -1) { console.error('✗ azienda localStorage not found'); process.exit(1); }
  const lineEnd = c.indexOf('\n', anchorIdx) + 1;

  const supaBlock = `
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

  useEffect(() => { if (!azId || dbLoading) return; cantieri.forEach(ct => saveCantiere(azId, ct)); }, [cantieri, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; events.forEach(ev => saveEvent(azId, ev)); }, [events, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; contatti.forEach(ct => saveContatto(azId, ct)); }, [contatti, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; team.forEach(t => saveTeamMember(azId, t)); }, [team, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; saveAzienda(azId, aziendaInfo); }, [aziendaInfo, azId, dbLoading]);
  useEffect(() => { if (!azId || dbLoading) return; savePipeline(azId, pipelineDB); }, [pipelineDB, azId, dbLoading]);

`;
  c = c.substring(0, lineEnd) + supaBlock + c.substring(lineEnd);
  console.log('✓ 2. Supabase data layer added');
} else {
  console.log('- 2. Supabase data layer already exists');
}

// ═══════════════════════════════════════
// 3. REPLACE FAB MENU (WhatsApp/Email/SMS/Telegram → Quick Actions)
// ═══════════════════════════════════════
if (c.includes('ch: "whatsapp", ico:')) {
  c = c.replace(
    '{ ch: "whatsapp", ico: "\u{1F4AC}", l: "WhatsApp", c: "#25d366" }',
    '{ id: "evento", ico: "\u{1F4C5}", l: "Appuntamento", c: "#007aff", action: () => { setFabOpen(false); setShowNewEvent(true); } }'
  );
  c = c.replace(
    '{ ch: "email", ico: "\u{1F4E7}", l: "Email", c: "#007aff" }',
    '{ id: "cliente", ico: "\u{1F464}", l: "Nuovo cliente", c: "#34c759", action: () => { setFabOpen(false); setShowModal("contatto"); } }'
  );
  c = c.replace(
    '{ ch: "sms", ico: "\u{1F4F1}", l: "SMS", c: "#ff9500" }',
    '{ id: "commessa", ico: "\u{1F4C1}", l: "Nuova commessa", c: "#ff9500", action: () => { setFabOpen(false); setShowModal("commessa"); } }'
  );
  c = c.replace(
    '{ ch: "telegram", ico: "\u{2708}\u{FE0F}", l: "Telegram", c: "#0088cc" }',
    '{ id: "messaggio", ico: "\u{1F4AC}", l: "Messaggio", c: "#5856d6", action: () => { setFabOpen(false); setShowCompose(true); } }'
  );
  // Fix the map key and onClick
  c = c.replace(
    '<div key={item.ch} onClick={() => { setFabOpen(false); setComposeMsg(c => ({ ...c, canale: item.ch })); setShowCompose(true); }}',
    '<div key={item.id} onClick={item.action}'
  );
  console.log('✓ 3. FAB menu replaced with quick actions');
} else {
  console.log('- 3. FAB already replaced or not found');
}

// ═══════════════════════════════════════
// 4. MOVE FAB TO MAIN RENDER
// ═══════════════════════════════════════
lines = c.split('\n');
let fabStartLine = -1;
let fabEndLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* FAB') && lines[i].includes('Compose')) {
    // Check if previous line has <style>
    if (lines[i-1] && lines[i-1].includes('<style>')) fabStartLine = i - 1;
    else fabStartLine = i;
    break;
  }
}

if (fabStartLine >= 0) {
  // Find the end: line with fabPulse 2s infinite, then +1 for </div>, +1 for </div>
  for (let i = fabStartLine; i < lines.length; i++) {
    if (lines[i].includes('fabPulse 2s infinite')) {
      // Find next </div> (closing the inner div)
      let closings = 0;
      for (let j = i + 1; j < i + 6; j++) {
        if (lines[j].trim() === '</div>') {
          closings++;
          if (closings === 1) { fabEndLine = j; break; }
        }
      }
      break;
    }
  }
}

// Check if FAB is inside renderMessaggi (before SETTINGS TAB)
let settingsTabLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('/* == SETTINGS TAB ==')) { settingsTabLine = i; break; }
}

if (fabStartLine >= 0 && fabEndLine >= 0 && settingsTabLine >= 0 && fabStartLine < settingsTabLine) {
  // FAB is inside renderMessaggi, need to move it
  const fabBlock = lines.slice(fabStartLine, fabEndLine + 1);
  
  // Remove from current position
  lines.splice(fabStartLine, fabEndLine - fabStartLine + 1);
  
  // Find new insert point: after tab === "settings" && renderSettings()
  let insertAt = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('tab === "settings" && renderSettings()')) { insertAt = i + 1; break; }
  }
  
  if (insertAt >= 0) {
    // Also need to close the div that was before FAB in renderMessaggi
    // Check if renderMessaggi lost its closing
    // Insert FAB at main render
    lines.splice(insertAt, 0, '', '        {/* FAB — Quick Actions */}', ...fabBlock);
    console.log('✓ 4. FAB moved to main render');
    
    // Fix renderMessaggi: might need to add back closing </div>
    // Find the renderMessaggi return closing
    for (let i = fabStartLine - 5; i < fabStartLine + 5 && i < lines.length; i++) {
      if (i >= 0 && lines[i] && lines[i].trim() === '</>)}') {
        // Check if next non-blank line is ); (end of renderMessaggi)
        let nextIdx = i + 1;
        while (nextIdx < lines.length && lines[nextIdx].trim() === '') nextIdx++;
        if (lines[nextIdx] && lines[nextIdx].trim() === ');') {
          // Need to add </div> before );
          lines.splice(nextIdx, 0, '      </div>');
          console.log('  + Added closing </div> to renderMessaggi');
        }
        break;
      }
    }
  }
  c = lines.join('\n');
} else {
  console.log('- 4. FAB already in main render or not found');
}

// ═══════════════════════════════════════
// 5. ADD CLIENT FIELD TO EVENT FORM
// ═══════════════════════════════════════
if (!c.includes('__new__')) {
  const collegaLabel = '<label style={S.fieldLabel}>Collega a commessa</label>';
  if (c.includes(collegaLabel)) {
    const clientBlock = `<label style={S.fieldLabel}>Cliente</label>
                <select style={S.select} value={newEvent.persona || ""} onChange={e => {
                  const val = e.target.value;
                  if (val === "__new__") { setNewEvent(ev => ({ ...ev, persona: "", _newCliente: true } as any)); }
                  else { const ct = contatti.find(c => c.nome === val); setNewEvent(ev => ({ ...ev, persona: val, addr: ct?.indirizzo || ev.addr, text: ev.text || ("Appuntamento " + val), _newCliente: false } as any)); }
                }}>
                  <option value="">— Seleziona cliente —</option>
                  {contatti.filter(ct => ct.tipo === "cliente").map(ct => <option key={ct.id || ct.nome} value={ct.nome}>{ct.nome}{ct.cognome ? " " + ct.cognome : ""}</option>)}
                  <option value="__new__">\u{2795} Nuovo cliente...</option>
                </select>
                {(newEvent as any)._newCliente && (
                  <div style={{ background: T.bgSec, borderRadius: 10, padding: 12, marginTop: 8, border: \`1px solid \${T.bdr}\` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>\u{1F464} Nuovo cliente</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={{ ...S.input, flex: 1 }} placeholder="Nome" value={(newEvent as any)._nomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _nomeCliente: e.target.value } as any))} />
                      <input style={{ ...S.input, flex: 1 }} placeholder="Cognome" value={(newEvent as any)._cognomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _cognomeCliente: e.target.value } as any))} />
                    </div>
                    <input style={{ ...S.input, marginBottom: 8 }} placeholder="Telefono" value={(newEvent as any)._telCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _telCliente: e.target.value } as any))} />
                    <input style={S.input} placeholder="Indirizzo" value={(newEvent as any)._addrCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _addrCliente: e.target.value, addr: e.target.value } as any))} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                `;
    c = c.replace(collegaLabel, clientBlock + collegaLabel);
    console.log('✓ 5. Client fields added to event form');
  }
} else {
  console.log('- 5. Client fields already exist');
}

// ═══════════════════════════════════════
// 6. FIX addEvent TO AUTO-FILL TITLE + CREATE CLIENT
// ═══════════════════════════════════════
const oldAddEvent = 'if (!newEvent.text.trim()) return;';
if (c.includes(oldAddEvent)) {
  c = c.replace(oldAddEvent, `const _evTitle = newEvent.text.trim() || (newEvent.persona ? "Appuntamento " + newEvent.persona : "");
    if (!_evTitle) return;
    newEvent.text = _evTitle;
    if ((newEvent as any)._newCliente && (newEvent as any)._nomeCliente) {
      const nc = { id: "CT-" + Date.now(), nome: (newEvent as any)._nomeCliente, cognome: (newEvent as any)._cognomeCliente || "", tipo: "cliente", telefono: (newEvent as any)._telCliente || "", indirizzo: (newEvent as any)._addrCliente || "" };
      setContatti(prev => [...prev, nc]);
      newEvent.persona = nc.nome + (nc.cognome ? " " + nc.cognome : "");
    }`);
  console.log('✓ 6. addEvent auto-fill title + create client');
}

// ═══════════════════════════════════════
// 7. ADD CONTATTO MODAL
// ═══════════════════════════════════════
if (!c.includes('showModal === "contatto"')) {
  const commessaModal = '{showModal === "commessa" && (';
  if (c.includes(commessaModal)) {
    const contattoModal = `{showModal === "contatto" && (
            <div style={{ padding: "20px 0" }}>
              <div style={S.modalTitle}>Nuovo cliente</div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Nome *</label>
                <input style={S.input} placeholder="Nome" value={(newCM as any)._ctNome || ""} onChange={e => setNewCM(p => ({ ...p, _ctNome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Cognome</label>
                <input style={S.input} placeholder="Cognome" value={(newCM as any)._ctCognome || ""} onChange={e => setNewCM(p => ({ ...p, _ctCognome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Telefono</label>
                <input style={S.input} type="tel" placeholder="333 1234567" value={(newCM as any)._ctTel || ""} onChange={e => setNewCM(p => ({ ...p, _ctTel: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Email</label>
                <input style={S.input} type="email" placeholder="nome@email.it" value={(newCM as any)._ctEmail || ""} onChange={e => setNewCM(p => ({ ...p, _ctEmail: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Indirizzo</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza" value={(newCM as any)._ctAddr || ""} onChange={e => setNewCM(p => ({ ...p, _ctAddr: e.target.value } as any))} /></div>
              <div onClick={() => {
                const nome = ((newCM as any)._ctNome || "").trim();
                if (!nome) return;
                setContatti(prev => [...prev, { id: "CT-" + Date.now(), nome, cognome: (newCM as any)._ctCognome || "", tipo: "cliente", telefono: (newCM as any)._ctTel || "", email: (newCM as any)._ctEmail || "", indirizzo: (newCM as any)._ctAddr || "", preferito: false }]);
                setNewCM({ cliente: "", indirizzo: "", telefono: "", sistema: "", tipo: "nuova" });
                setShowModal(null);
              }} style={{ padding: "14px", borderRadius: 12, background: \`linear-gradient(135deg, \${T.acc}, #b86e06)\`, color: "#fff", textAlign: "center", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Salva cliente \u{2713}
              </div>
            </div>
          )}

          `;
    c = c.replace(commessaModal, contattoModal + commessaModal);
    console.log('✓ 7. Contatto modal added');
  }
}

fs.writeFileSync(file, c);
console.log('\n\u{2705} ALL PATCHES APPLIED!');
console.log('Lines: ' + c.split('\n').length);
