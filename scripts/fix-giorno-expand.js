// fix-giorno-expand.js — Make timeline events expand as popup
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// The timeline container has overflowY:"auto" which clips the expanded card
// Solution: change the timeline container to allow overflow visible for expanded cards
// Find the timeline container div
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('agendaView === "giorno"') && lines[i].includes('&&')) {
    // Find the scrollable container (a few lines after)
    for (let j = i; j < i + 10; j++) {
      if (lines[j].includes('overflowY: "auto"') && lines[j].includes('overflowX')) {
        // Remove the overflow restrictions
        lines[j] = lines[j].replace('overflowY: "auto", overflowX: "hidden"', 'overflowY: "visible", overflowX: "visible"');
        lines[j] = lines[j].replace('overflowY: "auto", overflowX: "hi', 'overflowY: "visible", overflowX: "vi');
        console.log('✓ Fixed timeline overflow at line ' + (j + 1));
        break;
      }
    }
    break;
  }
}

// Also make sure the hour row allows expansion
// The minHeight: 48 is fine, but ensure no overflow hidden on rows
// No action needed for this

// Now add a selectedEvent popup that shows OUTSIDE the timeline
// This is more reliable than inline expansion in a scrollable container
// Find the end of the giorno view section (before "Unscheduled")
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Unscheduled */}')) {
    // Insert a floating event detail panel before Unscheduled
    const panel = [
      '              {/* Floating event detail for timeline */}',
      '              {selectedEvent && agendaView === "giorno" && (() => {',
      '                const ev = selectedEvent;',
      '                const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null;',
      '                return (',
      '                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: 14, margin: "8px 0" }}>',
      '                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>',
      '                      <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{ev.text}</div>',
      '                      <div onClick={() => setSelectedEvent(null)} style={{ cursor: "pointer", fontSize: 18, color: T.sub }}>\u{2715}</div>',
      '                    </div>',
      '                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>',
      '                      {ev.time && <span style={{ fontSize: 11, fontWeight: 700, color: T.sub, fontFamily: FM }}>{ev.time}</span>}',
      '                      {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}>{"\u{1F464}"} {ev.persona}</span>}',
      '                      {ev.addr && <span style={{ fontSize: 11, color: T.sub }}>{"\u{1F4CD}"} {ev.addr}</span>}',
      '                      {ev.cm && <span style={S.badge(T.blueLt, T.blue)}>{"\u{1F4C1}"} {ev.cm}</span>}',
      '                      <span style={S.badge(ev.tipo==="appuntamento"?T.blueLt:ev.tipo==="task"?T.accLt:T.redLt, ev.tipo==="appuntamento"?T.blue:ev.tipo==="task"?T.acc:T.red)}>{ev.tipo}</span>',
      '                    </div>',
      '                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 6 }}>',
      '                      {ev.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr))} style={{ padding: "10px 4px", borderRadius: 8, background: T.blueLt, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.blue }}>{"\u{1F4CD}"} Mappa</div>}',
      '                      <div onClick={() => { const tel = cmObj?.telefono || contatti.find(c => c.nome === ev.persona)?.telefono; if (tel) window.open("tel:" + tel); }} style={{ padding: "10px 4px", borderRadius: 8, background: T.grnLt, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.grn }}>{"\u{1F4DE}"} Chiama</div>',
      '                      <div onClick={() => { const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente"); const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }); setMailBody(`Gentile ${cliente},\\n\\nLe confermo l\'appuntamento:\\n\\n${dataFmt}${ev.time ? " alle " + ev.time : ""}\\n${ev.addr || ""}\\n\\n${ev.text}\\n\\nCordiali saluti,\\nFabio Cozza`); setShowMailModal({ ev, cm: cmObj }); }} style={{ padding: "10px 4px", borderRadius: 8, background: T.accLt, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.acc }}>{"\u{2709}\u{FE0F}"} Mail</div>',
      '                      <div onClick={() => { deleteEvent(ev.id); setSelectedEvent(null); }} style={{ padding: "10px 4px", borderRadius: 8, background: T.redLt, textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: T.red }}>{"\u{1F5D1}\u{FE0F}"} Elimina</div>',
      '                    </div>',
      '                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>',
      '                      <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#007aff" }}>{"\u{1F4C1}"} Commessa</div>',
      '                      <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#ff9500" }}>{"\u{1F4CF}"} Misure</div>',
      '                      <div onClick={() => { const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#34c759" }}>{"\u{1F527}"} Intervento</div>',
      '                    </div>',
      '                  </div>',
      '                );',
      '              })()}',
    ];
    lines.splice(i, 0, ...panel);
    console.log('✓ Added floating event panel before Unscheduled at line ' + (i + 1));
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ Done! Lines: ' + lines.length);
