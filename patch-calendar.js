// patch-calendar.js — Run: node patch-calendar.js
const fs = require('fs');
const file = 'components/MastroERP.tsx';
let code = fs.readFileSync(file, 'utf8');

const startMarker = 'calendario: (() => {';
const startIdx = code.indexOf(startMarker);
if (startIdx === -1) { console.error('ERROR: calendario marker not found'); process.exit(1); }
const lineStart = code.lastIndexOf('\n', startIdx) + 1;

// Find end by matching braces/parens from the IIFE start
const afterStart = code.substring(startIdx);
let depth = 0;
let endOffset = -1;
for (let i = 0; i < afterStart.length; i++) {
  const ch = afterStart[i];
  if (ch === '(' || ch === '{') depth++;
  if (ch === ')' || ch === '}') depth--;
  if (depth === 0 && i > 10) {
    const rest = afterStart.substring(i);
    const commaIdx = rest.indexOf(',');
    if (commaIdx >= 0 && commaIdx < 5) {
      endOffset = i + commaIdx + 1;
      break;
    }
  }
}
if (endOffset === -1) { console.error('ERROR: could not find end of calendario block'); process.exit(1); }
const absoluteEnd = startIdx + endOffset;
console.log('Found block: ' + code.substring(lineStart, absoluteEnd).split('\n').length + ' lines');

const NB = `          calendario: (() => {
            const dateStr2 = (d) => d.toISOString().split("T")[0];
            const todayISO = dateStr2(today);
            const dashY = selDate.getFullYear(), dashMo = selDate.getMonth();
            const calTouchStartRef = React.useRef(0);
            const calTouchEndRef = React.useRef(0);
            const handleCalSwipe = () => {
              const diff = calTouchStartRef.current - calTouchEndRef.current;
              if (Math.abs(diff) < 50) return;
              const d = new Date(selDate); const dir = diff > 0 ? 1 : -1;
              if (agendaView === "giorno") d.setDate(d.getDate() + dir);
              else if (agendaView === "settimana") d.setDate(d.getDate() + dir * 7);
              else d.setMonth(d.getMonth() + dir);
              setSelDate(d);
            };
            const navPrev = () => { const d = new Date(selDate); if (agendaView === "giorno") d.setDate(d.getDate()-1); else if (agendaView === "settimana") d.setDate(d.getDate()-7); else d.setMonth(d.getMonth()-1); setSelDate(d); };
            const navNext = () => { const d = new Date(selDate); if (agendaView === "giorno") d.setDate(d.getDate()+1); else if (agendaView === "settimana") d.setDate(d.getDate()+7); else d.setMonth(d.getMonth()+1); setSelDate(d); };
            const getWeekDays = () => { const d = new Date(selDate); const day = d.getDay(); const mo = day === 0 ? -6 : 1 - day; return Array.from({length:7}, (_,i) => { const wd = new Date(d); wd.setDate(d.getDate() + mo + i); return wd; }); };
            const weekDays = getWeekDays();
            const firstDay = new Date(dashY, dashMo, 1).getDay();
            const calOff = firstDay === 0 ? 6 : firstDay - 1;
            const dIM = new Date(dashY, dashMo+1, 0).getDate();
            const cells = Array.from({length: calOff + dIM}, (_,i) => i < calOff ? null : i - calOff + 1);
            const hdrL = agendaView === "giorno" ? selDate.toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }) : agendaView === "settimana" ? weekDays[0].getDate() + "\–" + weekDays[6].getDate() + " " + selDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" }) : selDate.toLocaleDateString("it-IT", { month:"long", year:"numeric" });
            const hours = [7,8,9,10,11,12,13,14,15,16,17,18,19];
            const dayEvs = events.filter(e => e.date === dateStr2(selDate)).sort((a,b) => (a.time||"99").localeCompare(b.time||"99"));
            return (<div style={{ marginBottom:12 }}>
                <div style={S.section}><div style={S.sectionTitle}>Calendario</div><div onClick={() => { setTab("agenda"); }} style={{ padding:"4px 10px", borderRadius:6, fontSize:10, fontWeight:700, cursor:"pointer", color:T.acc }}>Apri \→</div></div>
                <div style={{ padding:"0 16px" }}>
                  <div style={{ background:T.card, borderRadius:T.r, border:` + '`1px solid ${T.bdr}`' + `, overflow:"hidden" }}
                    onTouchStart={(e) => { calTouchStartRef.current = e.targetTouches[0].clientX; }}
                    onTouchMove={(e) => { calTouchEndRef.current = e.targetTouches[0].clientX; }}
                    onTouchEnd={handleCalSwipe}>
                    <div style={{ display:"flex", borderBottom:` + '`1px solid ${T.bdr}`' + `, background:T.bg }}>
                      {["giorno","settimana","mese"].map(v => (<div key={v} onClick={() => setAgendaView(v)} style={{ flex:1, padding:"8px 4px", textAlign:"center", fontSize:11, fontWeight:700, background: agendaView === v ? T.acc : "transparent", color: agendaView === v ? "#fff" : T.sub, cursor:"pointer", textTransform:"capitalize", transition:"all 0.2s" }}>{v}</div>))}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", borderBottom:` + '`1px solid ${T.bdr}`' + ` }}>
                      <div onClick={navPrev} style={{ width:28, height:28, borderRadius:8, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14, color:T.sub }}>\‹</div>
                      <div onClick={() => setSelDate(new Date())} style={{ fontSize:12, fontWeight:700, color:T.text, textTransform:"capitalize", cursor:"pointer" }}>{hdrL}</div>
                      <div onClick={navNext} style={{ width:28, height:28, borderRadius:8, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14, color:T.sub }}>\›</div>
                    </div>
                    {agendaView === "giorno" && (<div style={{ maxHeight:360, overflowY:"auto" }}>
                        {dayEvs.length === 0 ? (<div style={{ padding:"24px 16px", textAlign:"center", color:T.sub, fontSize:13 }}>Nessun evento</div>) : (<div style={{ padding:"8px 0" }}>
                            {hours.map(h => { const hStr = String(h).padStart(2,"0"); const hEvs = dayEvs.filter(e => e.time && e.time.startsWith(hStr));
                              return (<div key={h} style={{ display:"flex", minHeight: hEvs.length > 0 ? 48 : 28, borderBottom:` + '`1px solid ${T.bdr}20`' + ` }}>
                                  <div style={{ width:42, fontSize:10, fontWeight:600, color:T.sub, textAlign:"right", padding:"4px 8px 0 0" }}>{hStr}:00</div>
                                  <div style={{ flex:1, padding:"2px 8px 2px 0" }}>
                                    {hEvs.map(ev => (<div key={ev.id} onClick={() => setSelectedEvent(ev)} style={{ padding:"6px 10px", borderRadius:8, marginBottom:2, background:(ev.color||T.acc)+"15", borderLeft:` + '`3px solid ${ev.color||T.acc}`' + `, cursor:"pointer" }}>
                                        <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{ev.text}</div>
                                        <div style={{ fontSize:10, color:T.sub }}>{[ev.time, ev.persona, ev.cm, ev.addr].filter(Boolean).join(" \· ")}</div>
                                      </div>))}
                                  </div></div>); })}
                          </div>)}
                      </div>)}
                    {agendaView === "settimana" && (<div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:` + '`1px solid ${T.bdr}`' + ` }}>
                          {weekDays.map((wd,i) => { const wdISO = dateStr2(wd); const isT = wdISO === todayISO; const wEvs = events.filter(e => e.date === wdISO);
                            return (<div key={i} onClick={() => { setSelDate(new Date(wd)); setAgendaView("giorno"); }}
                                style={{ textAlign:"center", padding:"6px 2px", cursor:"pointer", borderRight: i<6 ? ` + '`1px solid ${T.bdr}`' + ` : "none", background: isT ? T.accLt : "transparent" }}>
                                <div style={{ fontSize:9, fontWeight:600, color: i>=5 ? T.orange : T.sub, textTransform:"uppercase" }}>{wd.toLocaleDateString("it-IT",{weekday:"short"}).slice(0,3)}</div>
                                <div style={{ fontSize:14, fontWeight: isT ? 800 : 500, marginTop:2, width:24, height:24, borderRadius:"50%", display:"inline-flex", alignItems:"center", justifyContent:"center", background: isT ? T.acc : "transparent", color: isT ? "#fff" : T.text }}>{wd.getDate()}</div>
                                {wEvs.length > 0 && <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:3 }}>{wEvs.slice(0,3).map((ev,j) => <div key={j} style={{ width:5, height:5, borderRadius:"50%", background:ev.color||T.acc }}/>)}</div>}
                              </div>); })}
                        </div>
                        <div style={{ maxHeight:200, overflowY:"auto", padding:"6px 0" }}>
                          {weekDays.map(wd => { const wdISO = dateStr2(wd); const wEvs = events.filter(e => e.date === wdISO).sort((a,b) => (a.time||"99").localeCompare(b.time||"99"));
                            if (wEvs.length === 0) return null;
                            return wEvs.map(ev => (<div key={ev.id} onClick={() => { setSelDate(new Date(wd)); setAgendaView("giorno"); }}
                                style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 12px", cursor:"pointer", borderBottom:` + '`1px solid ${T.bdr}20`' + ` }}>
                                <div style={{ width:4, height:24, borderRadius:2, background:ev.color||T.acc, flexShrink:0 }}/>
                                <div style={{ flex:1, minWidth:0 }}><div style={{ fontSize:11, fontWeight:700, color:T.text, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>{ev.text}</div>
                                  <div style={{ fontSize:10, color:T.sub }}>{wd.toLocaleDateString("it-IT",{weekday:"short",day:"numeric"}).slice(0,6)} {ev.time ? "\· "+ev.time : ""}</div></div>
                              </div>)); })}
                        </div></div>)}
                    {agendaView === "mese" && (<div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:` + '`1px solid ${T.bdr}`' + ` }}>
                          {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map((d,i) => (<div key={i} style={{ textAlign:"center", fontSize:9, fontWeight:700, color: i>=5 ? T.orange : T.sub, padding:"5px 2px", borderRight: i<6 ? ` + '`1px solid ${T.bdr}`' + ` : "none" }}>{d}</div>))}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
                          {cells.map((day,i) => {
                            if (!day) return <div key={i} style={{ borderRight:` + '`1px solid ${T.bdr}`' + `, borderBottom:` + '`1px solid ${T.bdr}`' + `, minHeight:44 }}/>;
                            const iso = dashY + "-" + String(dashMo+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
                            const isT = iso === todayISO; const evs = events.filter(e => e.date === iso); const col = i % 7; const isW = col >= 5;
                            return (<div key={i} onClick={() => { setSelDate(new Date(iso+"T12:00:00")); setAgendaView("giorno"); }}
                                style={{ minHeight:44, padding:"3px 2px", borderRight: col<6 ? ` + '`1px solid ${T.bdr}`' + ` : "none", borderBottom:` + '`1px solid ${T.bdr}`' + `, background: isW ? T.bg+"80" : T.card, cursor:"pointer" }}>
                                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div style={{ width:20, height:20, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight: isT ? 800 : 400, background: isT ? T.acc : "transparent", color: isT ? "#fff" : isW ? T.orange : T.text }}>{day}</div>
                                  {evs.length > 0 && <div style={{ fontSize:8, fontWeight:700, color:"#fff", background:evs[0].color||T.acc, borderRadius:8, padding:"1px 4px" }}>{evs.length}</div>}
                                </div>
                                {evs.slice(0,1).map(ev => (<div key={ev.id} style={{ fontSize:8, fontWeight:600, padding:"1px 2px", borderRadius:2, marginTop:1, background:(ev.color||T.acc)+"20", borderLeft:` + '`2px solid ${ev.color||T.acc}`' + `, overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis", color:ev.color||T.acc }}>{ev.time?.slice(0,5)} {ev.text}</div>))}
                              </div>); })}
                        </div></div>)}
                  </div></div></div>);
          })(),`;

const newCode = code.substring(0, lineStart) + NB + code.substring(absoluteEnd);
fs.writeFileSync(file, newCode);
console.log('✅ Calendario aggiornato! Righe: ' + newCode.split('\n').length);
console.log('Fai: npm run dev');
