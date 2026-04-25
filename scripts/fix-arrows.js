// fix-arrows.js
const fs = require('fs');
let c = fs.readFileSync('components/MastroERP.tsx', 'utf8');

// 1. Fix navPrev arrows (empty → ‹)
c = c.replace(/onClick=\{navPrev\}([^>]+)><\/div>/g, 'onClick={navPrev}$1>‹</div>');

// 2. Fix navNext arrows (empty → ›)
c = c.replace(/onClick=\{navNext\}([^>]+)><\/div>/g, 'onClick={navNext}$1>›</div>');

// 3. Fix "Apri" links — add →
c = c.replace(/>Apri\s*<\/div>/g, '>Apri →</div>');

// 4. Fix en-dash in week range (empty → –)
c = c.replace(/getDate\(\) \+ "" \+/g, 'getDate() + "–" + ');

// 5. Fix middle dots in join
c = c.replace(/\.join\(" "\)/g, '.join(" · ")');

// 6. Add "Oggi" button in dashboard calendar
c = c.replace(
  '}}>{hdrL} </div>',
  '}}>{hdrL}</div><div onClick={() => setSelDate(new Date())} style={{ fontSize:10, fontWeight:700, color:"#fff", background:T.acc, cursor:"pointer", padding:"3px 10px", borderRadius:12, marginLeft:8 }}>Oggi</div>'
);

// 7. Add "Oggi" button in Agenda page too — find the agenda nav
// The agenda has a similar pattern with the date label
const agendaNavPattern = /agendaView === "giorno" \? selDate\.toLocaleDateString\("it-IT", \{ weekday: "long", day: "numeric", month: "long" \}\)/;
// Just search for the agenda section arrows too
c = c.replace(/onClick=\{\(\) => \{ const d=new Date\(selDate\);d\.setDate\(d\.getDate\(\)-1\)/g, function(m) { return m; });

fs.writeFileSync('components/MastroERP.tsx', c);
console.log('✅ Fix completato: frecce + Oggi + simboli');
console.log('Fai: npm run dev');
