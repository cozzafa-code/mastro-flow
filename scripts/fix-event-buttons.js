// fix-event-buttons.js — Fix icons + add action buttons
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// Find the selectedEvent detail panel buttons (the first set - in renderEventCard)
// Pattern: line with "Mappa" then "Chiama" then "Mail" then "Elimina"
// These are in the expanded event detail

// FIX BLOCK 1: The prossimi eventi / selectedEvent detail buttons (around line 4100-4137)
// Find the div with Mappa/Chiama/Mail/Elimina inside the renderEventCard
const mappaChiama = '}} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.accLt, border: `1px solid ${T.acc}30`, textAlign: "center", cursor:';

// Let's find all button blocks by searching for "Mappa" near "Chiama"
const lines = c.split('\n');
let fixed = 0;

for (let i = 0; i < lines.length; i++) {
  // Fix Mappa icon: replace any broken emoji before "Mappa"
  if (lines[i].includes('Mappa') && (lines[i].includes('maps.google') || lines[i].includes('borderRadius'))) {
    // Replace the display text for Mappa buttons
    lines[i] = lines[i].replace(/>[^<]*Mappa</, '>📍 Mappa<');
    fixed++;
  }
  
  // Fix Chiama icon
  if (lines[i].includes('Chiama') && lines[i].includes('borderRadius')) {
    lines[i] = lines[i].replace(/>[^<]*Chiama</, '>📞 Chiama<');
    fixed++;
  }
}

// Now add Rilievo/Misure/Intervento buttons
// Find the first button block (selectedEvent detail)
// It's after the selectedEvent panel, before </div> closing
// Look for the pattern: selectedEvent expand with Mappa/Chiama/Mail/Elimina

for (let i = 0; i < lines.length; i++) {
  // Find the closing of button row + closing of detail panel
  // Pattern: "Elimina</div>" then next line "</div>" then "</div>" then ")}"
  if (lines[i].includes('Elimina') && lines[i].includes('deleteEvent') && lines[i].includes('selectedEvent')) {
    // This is the Elimina button in the main selectedEvent detail
    // After this line and its closing </div>, add action buttons
    // Find the </div> that closes the button row
    let rowClose = i + 1;
    while (rowClose < lines.length && !lines[rowClose].trim().startsWith('</div>')) rowClose++;
    
    // Insert action buttons row after the existing button row's closing </div>
    const actionRow = `
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <div onClick={(e) => { e.stopPropagation(); if (!ev.cm) { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "" }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setTab("commesse"); } else { const cm = cantieri.find(c => c.code === ev.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); } } setSelectedEvent(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#f0f4ff", border: "1px solid #007aff30", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#007aff" }}>📁 Commessa</div>
                    <div onClick={(e) => { e.stopPropagation(); const cm = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cm) { setSelectedCM(cm); setTab("commesse"); } else { setShowNewEvent(false); setSelectedEvent(null); setShowModal("commessa"); } }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#fff5eb", border: "1px solid #ff950030", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#ff9500" }}>📏 Misure</div>
                    <div onClick={(e) => { e.stopPropagation(); const code = ev.cm || "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento da evento: " + ev.text }; if (!ev.cm) { setCantieri(prev => [...prev, nc]); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#f0fff4", border: "1px solid #34c75930", textAlign: "center", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#34c759" }}>🔧 Intervento</div>
                  </div>`;
    
    lines.splice(rowClose + 1, 0, actionRow);
    console.log('+ Added action buttons to selectedEvent detail at line ' + (rowClose + 2));
    break; // Only add to first block
  }
}

// Also add to the day event list expanded view
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('Elimina') && lines[i].includes('deleteEvent') && lines[i].includes('setSelectedEvent(null)') && !lines[i].includes('selectedEvent.id')) {
    // This is the inline event list Elimina button
    let rowClose = i + 1;
    while (rowClose < lines.length && !lines[rowClose].trim().startsWith('</div>')) rowClose++;
    
    const actionRow2 = `
                                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                      <div onClick={(e) => { e.stopPropagation(); const cm = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cm) { setSelectedCM(cm); setTab("commesse"); } else { setShowModal("commessa"); } setSelectedEvent(null); }} style={{ flex: 1, padding: "6px", borderRadius: 6, background: "#f0f4ff", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#007aff" }}>📏 Misure</div>
                                      <div onClick={(e) => { e.stopPropagation(); setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "6px", borderRadius: 6, background: "#f0fff4", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#34c759" }}>🔧 Intervento</div>
                                    </div>`;
    
    lines.splice(rowClose + 1, 0, actionRow2);
    console.log('+ Added action buttons to day event list at line ' + (rowClose + 2));
    break;
  }
}

c = lines.join('\n');
fs.writeFileSync(file, c);
console.log('\n✅ All event buttons fixed! Icons: ' + fixed + ' fixed');
console.log('Lines: ' + lines.length);
