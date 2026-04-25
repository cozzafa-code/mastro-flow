// fix-giorno-gcal.js — Google Calendar style day view
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// Step 1: Replace renderEventCard in timeline with compact Google Calendar style blocks
// Find: {hourEvents.map(ev => renderEventCard(ev))}
let found = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('hourEvents.map(ev => renderEventCard(ev))')) {
    // Replace with compact inline event block
    const newRender = [
      '                        {hourEvents.map(ev => (',
      '                          <div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "6px 10px", marginBottom: 2, borderRadius: 6, background: selectedEvent?.id === ev.id ? (ev.color || T.acc) + "30" : (ev.color || T.acc) + "18", borderLeft: `3px solid ${ev.color || T.acc}`, cursor: "pointer", transition: "all 0.15s" }}>',
      '                            <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{ev.text} {ev.persona && <span style={{ fontWeight: 400, color: T.sub }}>· {ev.persona}</span>}</div>',
      '                            {ev.addr && <div style={{ fontSize: 10, color: T.sub, marginTop: 1 }}>{ev.addr}</div>}',
      '                          </div>',
      '                        ))}',
    ];
    lines.splice(i, 1, ...newRender);
    console.log('✓ Replaced timeline render with compact blocks at line ' + (i + 1));
    found = true;
    break;
  }
}
if (!found) console.log('! hourEvents.map(renderEventCard) not found');

// Step 2: Verify the floating action panel exists
let hasPanel = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Floating event detail for timeline')) {
    hasPanel = true;
    console.log('✓ Floating panel already exists at line ' + (i + 1));
    break;
  }
}
if (!hasPanel) console.log('! Floating panel not found — was it added?');

// Step 3: Remove the old renderEventCard expansion from showing in giorno
// The renderEventCard has {selectedEvent?.id === ev.id && (...)} expansion
// But since we're not using renderEventCard in giorno anymore, this is fine

// Step 4: Also make the Unscheduled section use compact blocks too
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('dayEvents.filter(e => !e.time).map(renderEventCard)')) {
    lines[i] = lines[i].replace(
      'dayEvents.filter(e => !e.time).map(renderEventCard)',
      'dayEvents.filter(e => !e.time).map(ev => (<div key={ev.id} onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)} style={{ padding: "8px 12px", marginBottom: 4, borderRadius: 8, background: selectedEvent?.id === ev.id ? (ev.color || T.acc) + "30" : (ev.color || T.acc) + "18", borderLeft: `3px solid ${ev.color || T.acc}`, cursor: "pointer" }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ev.text}</div>{ev.persona && <div style={{ fontSize: 11, color: T.sub }}>{ev.persona} {ev.addr ? "· " + ev.addr : ""}</div>}</div>))'
    );
    console.log('✓ Unscheduled also uses compact blocks');
    break;
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('\n✅ Giorno = Google Calendar style!');
console.log('Lines: ' + lines.length);
