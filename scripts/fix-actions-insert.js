// fix-actions-insert.js — Insert action row after line 4137
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Verify line 4137 is the closing </div> of buttons row
const line4137 = lines[4136]; // 0-indexed
console.log('Line 4137: ' + line4137.trim());

if (!line4137.trim() === '</div>') {
  console.error('Unexpected content at line 4137');
  process.exit(1);
}

// Insert new action buttons row after line 4137
const actionRow = [
  '            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>',
  '              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#007aff" }}>{"\u{1F4C1}"} Commessa</div>',
  '              <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#ff9500" }}>{"\u{1F4CF}"} Misure</div>',
  '              <div onClick={(e) => { e.stopPropagation(); const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "10px 4px", borderRadius: 10, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 800, color: "#34c759" }}>{"\u{1F527}"} Intervento</div>',
  '            </div>',
];

lines.splice(4137, 0, ...actionRow); // Insert after line 4137
console.log('+ Inserted 5 lines after line 4137');

fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ Action buttons added!');
console.log('Lines: ' + lines.length);
