// fix-popup-overlay.js — True popup overlay like Google Calendar
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Find and remove old floating panel
let panelStart = -1;
let panelEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Floating event detail for timeline')) {
    panelStart = i;
    // Find end: ()()}
    for (let j = i; j < i + 40; j++) {
      if (lines[j].trim() === '})()}') {
        panelEnd = j;
        break;
      }
    }
    break;
  }
}
if (panelStart >= 0 && panelEnd >= 0) {
  lines.splice(panelStart, panelEnd - panelStart + 1);
  console.log('- Removed old floating panel (lines ' + (panelStart+1) + '-' + (panelEnd+1) + ')');
}

// Now add a REAL popup overlay at the end of the agenda return, before the final closing divs
// Find the closing of the agenda tab: the line with "paddingBottom: 80"
// Actually, let's add it right before the last </div></div> of the agenda return
// Find: {tab === "agenda" && renderAgenda()} or the end of renderAgenda

// Better approach: add popup inside the main return, so it shows as overlay
// Find the FAB button area (it's near the end of the main return)
let fabLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('fabOpen') && lines[i].includes('setFabOpen') && lines[i].includes('position: "fixed"')) {
    fabLine = i;
    break;
  }
}

if (fabLine === -1) {
  // Try alternate: find FAB by looking for the fab container
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{/* FAB */}') || (lines[i].includes('fabOpen') && lines[i].includes('bottom:'))) {
      fabLine = i;
      break;
    }
  }
}

console.log('FAB found at line: ' + (fabLine + 1));

// Insert popup overlay BEFORE the FAB
if (fabLine > 0) {
  const popup = [
    '        {/* EVENT POPUP OVERLAY — Google Calendar style */}',
    '        {selectedEvent && tab === "agenda" && (() => {',
    '          const ev = selectedEvent;',
    '          const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null;',
    '          return (',
    '            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedEvent(null)}>',
    '              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)" }} />',
    '              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", zIndex: 9999, background: T.bg, borderRadius: 16, padding: 20, width: "90%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>',
    '                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>',
    '                  <div>',
    '                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{ev.text}</div>',
    '                    <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>',
    '                      {new Date(ev.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}',
    '                      {ev.time && ` alle ${ev.time}`}',
    '                    </div>',
    '                  </div>',
    '                  <div onClick={() => setSelectedEvent(null)} style={{ cursor: "pointer", fontSize: 22, color: T.sub, padding: "0 4px" }}>{"\u{2715}"}</div>',
    '                </div>',
    '                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>',
    '                  {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>{"\u{1F464}"} {ev.persona}</span>}',
    '                  {ev.addr && <span style={{ fontSize: 11, color: T.sub, background: T.blueLt, padding: "3px 8px", borderRadius: 6 }}>{"\u{1F4CD}"} {ev.addr}</span>}',
    '                  {ev.cm && <span style={S.badge(T.blueLt, T.blue)}>{"\u{1F4C1}"} {ev.cm}</span>}',
    '                  <span style={S.badge(ev.tipo==="appuntamento"?T.blueLt:ev.tipo==="task"?T.accLt:T.redLt, ev.tipo==="appuntamento"?T.blue:ev.tipo==="task"?T.acc:T.red)}>{ev.tipo}</span>',
    '                </div>',
    '                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>',
    '                  {ev.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr))} style={{ padding: "12px 4px", borderRadius: 10, background: T.blueLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.blue }}>{"\u{1F4CD}"} Mappa</div>}',
    '                  <div onClick={() => { const tel = cmObj?.telefono || contatti.find(c => c.nome === ev.persona)?.telefono; if (tel) window.open("tel:" + tel); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.grnLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.grn }}>{"\u{1F4DE}"} Chiama</div>',
    '                  <div onClick={() => { const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente"); const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }); setMailBody(`Gentile ${cliente},\\n\\nLe confermo l\'appuntamento:\\n\\n${dataFmt}${ev.time ? " alle " + ev.time : ""}\\n${ev.addr || ""}\\n\\n${ev.text}\\n\\nCordiali saluti,\\nFabio Cozza`); setShowMailModal({ ev, cm: cmObj }); setSelectedEvent(null); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.accLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.acc }}>{"\u{2709}\u{FE0F}"} Mail</div>',
    '                  <div onClick={() => { deleteEvent(ev.id); setSelectedEvent(null); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.redLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.red }}>{"\u{1F5D1}\u{FE0F}"} Elimina</div>',
    '                </div>',
    '                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>',
    '                  <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#007aff" }}>{"\u{1F4C1}"} Commessa</div>',
    '                  <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#ff9500" }}>{"\u{1F4CF}"} Misure</div>',
    '                  <div onClick={() => { const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#34c759" }}>{"\u{1F527}"} Intervento</div>',
    '                </div>',
    '              </div>',
    '            </div>',
    '          );',
    '        })()}',
  ];
  lines.splice(fabLine, 0, ...popup);
  console.log('✓ Added popup overlay before FAB at line ' + (fabLine + 1));
}

fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ Event popup overlay added!');
console.log('Lines: ' + lines.length);
