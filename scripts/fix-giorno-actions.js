// fix-giorno-actions.js
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 1. SET DEFAULT TIME when creating event
// Find addEvent and add default time
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const addEvent = () => {')) {
    // Find the line that builds the event object (setEvents)
    for (let j = i; j < i + 20; j++) {
      if (lines[j].includes('setEvents(ev => [...ev, {')) {
        // Add default time before setEvents
        lines.splice(j, 0, '    if (!newEvent.time) newEvent.time = "09:00";');
        console.log('+ Default time 09:00 at line ' + (j + 1));
        break;
      }
    }
    break;
  }
}

// 2. ADD Commessa/Misure/Intervento to GIORNO inline view
// Find the deleteEvent in giorno view (inside hourEvents.map)
// It's the one with stopPropagation + deleteEvent(ev.id) + setSelectedEvent(null) 
// that does NOT have selectedEvent.id (that one is in renderEventCard)
let giornoFixed = false;
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('deleteEvent(ev.id)') && 
      lines[i].includes('setSelectedEvent(null)') &&
      lines[i].includes('stopPropagation') &&
      !lines[i].includes('selectedEvent.id')) {
    // Found giorno inline Elimina button
    // Find the closing </div> of the button row
    for (let j = i + 1; j < i + 5; j++) {
      if (lines[j].trim() === '</div>') {
        // Check if action buttons already exist after
        if (lines[j+1] && lines[j+1].includes('Commessa')) {
          console.log('- Giorno actions already exist');
          giornoFixed = true;
          break;
        }
        const indent = '                                  ';
        const actionLines = [
          indent + '<div style={{ display: "flex", gap: 4, marginTop: 4 }}>',
          indent + '  <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "6px", borderRadius: 6, background: "linear-gradient(135deg, #007aff15, #007aff08)", border: "1px solid #007aff25", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#007aff" }}>{"\u{1F4C1}"} Commessa</div>',
          indent + '  <div onClick={(e) => { e.stopPropagation(); const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null; if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "misure", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "6px", borderRadius: 6, background: "linear-gradient(135deg, #ff950015, #ff950008)", border: "1px solid #ff950025", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#ff9500" }}>{"\u{1F4CF}"} Misure</div>',
          indent + '  <div onClick={(e) => { e.stopPropagation(); const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ flex: 1, padding: "6px", borderRadius: 6, background: "linear-gradient(135deg, #34c75915, #34c75908)", border: "1px solid #34c75925", textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 700, color: "#34c759" }}>{"\u{1F527}"} Intervento</div>',
          indent + '</div>',
        ];
        lines.splice(j + 1, 0, ...actionLines);
        console.log('+ Added Commessa/Misure/Intervento to giorno view at line ' + (j + 2));
        giornoFixed = true;
        break;
      }
    }
    break;
  }
}
if (!giornoFixed) console.log('! Giorno inline buttons not found');

// 3. CHECK for duplicate action rows in renderEventCard
// Count how many "Commessa</div>" lines exist near deleteEvent(selectedEvent
let dupeCount = 0;
let firstDupe = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Commessa</div>') && lines[i].includes('deleteEvent') === false) {
    dupeCount++;
    if (dupeCount === 1) firstDupe = i;
  }
}
console.log('Commessa button rows found: ' + dupeCount);

// If there are duplicates in renderEventCard, remove the second set
if (dupeCount > 2) {
  // Find the renderEventCard section and remove duplicate
  let inCard = false;
  let foundFirst = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('renderEventCard')) inCard = true;
    if (inCard && lines[i].includes('Commessa') && lines[i].includes('007aff')) {
      if (!foundFirst) {
        foundFirst = true;
        // Find the extent of this action row (look for closing </div> with same indent)
        // Skip this set - it's the first one, keep it
      } else {
        // This is the duplicate - find the extent and remove
        // Go back to find the opening div
        let rowStart = i;
        for (let k = i - 1; k > i - 5; k--) {
          if (lines[k].includes('display: "flex"') && lines[k].includes('marginTop')) {
            rowStart = k;
            break;
          }
        }
        // Find the end
        let rowEnd = i;
        for (let k = i; k < i + 10; k++) {
          if (lines[k].includes('Intervento')) {
            // Next line should be closing div
            for (let m = k + 1; m < k + 3; m++) {
              if (lines[m].trim() === '</div>') { rowEnd = m; break; }
            }
            break;
          }
        }
        if (rowEnd > rowStart) {
          console.log('- Removing duplicate at lines ' + (rowStart+1) + '-' + (rowEnd+1));
          lines.splice(rowStart, rowEnd - rowStart + 1);
        }
        break;
      }
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ Done! Lines: ' + lines.length);
