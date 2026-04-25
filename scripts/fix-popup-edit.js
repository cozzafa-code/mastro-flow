// fix-popup-edit.js — Add edit functionality to event popup
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let c = fs.readFileSync(file, 'utf8');

// Find the popup title line and replace with editable version
// Current: <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{ev.text}</div>
// Replace the popup content section

const oldTitle = `<div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{ev.text}</div>
                    <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
                      {new Date(ev.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                      {ev.time && \` alle \${ev.time}\`}
                    </div>`;

const newTitle = `<input defaultValue={ev.text} onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== ev.text) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, text: val } : x)); setSelectedEvent({ ...ev, text: val }); } }} style={{ fontSize: 18, fontWeight: 800, color: T.text, border: "none", background: "transparent", width: "100%", outline: "none", padding: 0, fontFamily: "inherit" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <input type="date" defaultValue={ev.date} onChange={(e) => { if (e.target.value) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, date: e.target.value } : x)); setSelectedEvent({ ...ev, date: e.target.value }); } }} style={{ fontSize: 13, color: T.sub, border: \`1px solid \${T.bdr}\`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                      <input type="time" defaultValue={ev.time || ""} onChange={(e) => { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, time: e.target.value } : x)); setSelectedEvent({ ...ev, time: e.target.value }); }} style={{ fontSize: 13, color: T.sub, border: \`1px solid \${T.bdr}\`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                    </div>`;

if (c.includes(oldTitle)) {
  c = c.replace(oldTitle, newTitle);
  console.log('✓ Replaced title/date with editable fields');
} else {
  console.log('! Exact title block not found, trying partial match...');
  
  // Try replacing just the title div
  const oldT2 = '{ev.text}</div>\n                    <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>';
  if (c.includes(oldT2)) {
    // Find the popup section by looking for the unique pattern
    const popupMark = 'EVENT POPUP OVERLAY';
    const popupIdx = c.indexOf(popupMark);
    if (popupIdx > -1) {
      // Find the title line after popup mark
      const titleMark = 'fontSize: 18, fontWeight: 800';
      const titleIdx = c.indexOf(titleMark, popupIdx);
      if (titleIdx > -1) {
        // Find the start of this line
        let lineStart = c.lastIndexOf('\n', titleIdx) + 1;
        // Find where the date display ends (next </div> after "alle")
        const alleIdx = c.indexOf('alle', titleIdx);
        const closeDivAfterAlle = c.indexOf('</div>', alleIdx);
        let lineEnd = closeDivAfterAlle + 6;
        
        const oldBlock = c.substring(lineStart, lineEnd);
        const newBlock = `                    <input defaultValue={ev.text} onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== ev.text) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, text: val } : x)); setSelectedEvent({ ...ev, text: val }); } }} style={{ fontSize: 18, fontWeight: 800, color: T.text, border: "none", background: "transparent", width: "100%", outline: "none", padding: 0, fontFamily: "inherit" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <input type="date" defaultValue={ev.date} onChange={(e) => { if (e.target.value) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, date: e.target.value } : x)); setSelectedEvent({ ...ev, date: e.target.value }); } }} style={{ fontSize: 13, color: T.sub, border: \`1px solid \${T.bdr}\`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                      <input type="time" defaultValue={ev.time || ""} onChange={(e) => { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, time: e.target.value } : x)); setSelectedEvent({ ...ev, time: e.target.value }); }} style={{ fontSize: 13, color: T.sub, border: \`1px solid \${T.bdr}\`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                    </div>`;
        
        c = c.substring(0, lineStart) + newBlock + c.substring(lineEnd);
        console.log('✓ Replaced via partial match');
      }
    }
  }
}

fs.writeFileSync(file, c);
console.log('\n✅ Popup now has editable title, date & time!');
console.log('Lines: ' + c.split('\n').length);
