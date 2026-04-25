const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add state variables
const stateMarker = 'const [selectedCliente, setSelectedCliente] = useState<any>(null);';
if (!c.includes('clienteDetailTab')) {
  c = c.replace(stateMarker, stateMarker + '\r\n  const [clienteDetailTab, setClienteDetailTab] = useState("info");\r\n  const [clienteNotes, setClienteNotes] = useState<Record<string,string>>({});');
  console.log('1. State aggiunto');
} else {
  console.log('1. State gia presente');
}

// 2. Find the section to replace using indexOf
const startMarker = '// Dettaglio cliente selezionato';
const startPos = c.indexOf(startMarker);
if (startPos === -1) { console.log('ERRORE: marker non trovato'); process.exit(1); }

// Go back to start of line
let lineStart = startPos;
while (lineStart > 0 && c[lineStart - 1] !== '\n') lineStart--;

// Find end: after "Elimina</div>" closing tags
const eliminaPos = c.indexOf('Elimina</div>', startPos);
if (eliminaPos === -1) { console.log('ERRORE: Elimina non trovato'); process.exit(1); }

// Find the closing "}" of the if (selectedCliente) block
// Pattern: after Elimina, find the "    }" that closes the return block
let endPos = eliminaPos;
let depth = 0;
let foundEnd = false;
// Skip to after the Elimina line
endPos = c.indexOf('\n', eliminaPos) + 1;
// Now find the closing of the if block - look for pattern "    }\n"
for (let i = 0; i < 20; i++) {
  const nextLine = c.indexOf('\n', endPos);
  const line = c.substring(endPos, nextLine).replace('\r', '').trim();
  endPos = nextLine + 1;
  if (line === '}') {
    foundEnd = true;
    break;
  }
}
if (!foundEnd) { console.log('ERRORE: fine blocco non trovata'); process.exit(1); }

console.log('2. Sezione trovata:', lineStart, '-', endPos);

// 3. Build replacement
const NL = c.includes('\r\n') ? '\r\n' : '\n';
const N = NL; // shortcut
const replacement = [
  '    // Dettaglio cliente selezionato — ENRICHED v2',
  '    if (selectedCliente) {',
  '      const c = selectedCliente;',
  '      const cmList = cantieri.filter(cm => cm.cliente === c.nome || (c.cognome && cm.cognome === c.cognome));',
  '      const evList = events.filter(ev => ev.persona === c.nome || ev.persona === (c.nome + " " + (c.cognome||"")).trim());',
  '      const fattureTot = fattureDB.filter(f => cmList.some(cm => cm.id === f.cmId)).reduce((s, f) => s + (f.importo || 0), 0);',
  '      const cmAttive = cmList.filter(cm => cm.fase !== "chiusura").length;',
  '      const tabs = [',
  '        { id: "info", label: "Info", icon: "\uD83D\uDCCB" },',
  '        { id: "storia", label: "Storia", icon: "\uD83D\uDCC5" },',
  '        { id: "fatturato", label: "€ Fatturato", icon: "" },',
  '        { id: "note", label: "\uD83D\uDCDD Note", icon: "" }',
  '      ];',
  '      return (',
  '        <div style={{ padding: "0 0 100px" }}>',
  '          {/* Header */}',
  '          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>',
  '            <div onClick={() => { setSelectedCliente(null); setClienteDetailTab("info"); }} style={{ cursor: "pointer", padding: 4 }}>',
  '              <Ico d={ICO.back} s={22} c={T.text} />',
  '            </div>',
  '            <div style={{ flex: 1 }}>',
  '              <div style={{ fontSize: 17, fontWeight: 800 }}>{c.nome} {c.cognome || ""}</div>',
  '              <div style={{ fontSize: 11, color: T.sub }}>{c.tipo === "cliente" ? "\uD83D\uDC64 Cliente" : c.tipo === "fornitore" ? "\uD83C\uDFED Fornitore" : "\uD83D\uDC77 Professionista"}</div>',
  '            </div>',
  '            <div onClick={() => { const idx = contatti.findIndex(x => x.id === c.id); if (idx >= 0) { const updated = { ...c, preferito: !c.preferito }; setContatti(prev => prev.map(x => x.id === c.id ? updated : x)); setSelectedCliente(updated); } }} style={{ fontSize: 22, cursor: "pointer" }}>',
  '              {c.preferito ? "\u2B50" : "\u2606"}',
  '            </div>',
  '          </div>',
  '',
  '          {/* KPI Cards */}',
  '          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "0 16px 12px" }}>',
  '            <div style={{ background: T.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + T.bdr }}>',
  '              <div style={{ fontSize: 20, fontWeight: 800, color: T.acc }}>{cmList.length}</div>',
  '              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Commesse</div>',
  '            </div>',
  '            <div style={{ background: T.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + T.bdr }}>',
  '              <div style={{ fontSize: 20, fontWeight: 800, color: T.grn }}>{cmAttive}</div>',
  '              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Attive</div>',
  '            </div>',
  '            <div style={{ background: T.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + T.bdr }}>',
  '              <div style={{ fontSize: 20, fontWeight: 800, color: T.orange }}>{fattureTot > 0 ? (fattureTot / 1000).toFixed(1) + "k" : "0"}</div>',
  '              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>€ Totale</div>',
  '            </div>',
  '          </div>',
  '',
  '          {/* Tab bar */}',
  '          <div style={{ display: "flex", gap: 0, margin: "0 16px 12px", background: T.bg, borderRadius: 10, padding: 3 }}>',
  '            {tabs.map(t => (',
  '              <div key={t.id} onClick={() => setClienteDetailTab(t.id)}',
  '                style={{ flex: 1, padding: "8px 4px", textAlign: "center", borderRadius: 8, fontSize: 11, fontWeight: 700,',
  '                  cursor: "pointer", transition: "all .2s",',
  '                  background: clienteDetailTab === t.id ? T.card : "transparent",',
  '                  color: clienteDetailTab === t.id ? T.acc : T.sub,',
  '                  boxShadow: clienteDetailTab === t.id ? T.cardSh : "none"',
  '                }}>',
  '                {t.icon} {t.label}',
  '              </div>',
  '            ))}',
  '          </div>',
  '',
  '          {/* TAB: Info */}',
  '          {clienteDetailTab === "info" && <>',
  '            <div style={{ margin: "0 16px 12px", background: T.card, borderRadius: 14, padding: 16, border: "1px solid " + T.bdr }}>',
  '              {c.telefono && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>',
  '                <div style={{ fontSize: 14 }}>\uD83D\uDCDE</div>',
  '                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.telefono}</div>',
  '                <div onClick={() => { window.location.href="tel:" + c.telefono; }} style={{ padding: "6px 12px", borderRadius: 8, background: T.grnLt, color: T.grn, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chiama</div>',
  '                <div onClick={() => window.open("https://wa.me/" + c.telefono.replace(/\\s/g, ""))} style={{ padding: "6px 12px", borderRadius: 8, background: "#dcf8c6", color: "#128c7e", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>WA</div>',
  '              </div>}',
  '              {c.email && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>',
  '                <div style={{ fontSize: 14 }}>\uD83D\uDCE7</div>',
  '                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.email}</div>',
  '                <div onClick={() => window.open("mailto:" + c.email)} style={{ padding: "6px 12px", borderRadius: 8, background: T.blueLt, color: T.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Email</div>',
  '              </div>}',
  '              {c.indirizzo && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>',
  '                <div style={{ fontSize: 14 }}>\uD83D\uDCCD</div>',
  '                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.indirizzo}</div>',
  '                <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(c.indirizzo))} style={{ padding: "6px 12px", borderRadius: 8, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mappa</div>',
  '              </div>}',
  '              {c.piva && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>',
  '                <div style={{ fontSize: 14 }}>\uD83C\uDFE2</div>',
  '                <div style={{ fontSize: 13, color: T.sub, fontFamily: "\'JetBrains Mono\',monospace" }}>{c.piva}</div>',
  '              </div>}',
  '              {c.cf && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>',
  '                <div style={{ fontSize: 14 }}>\uD83C\uDD94</div>',
  '                <div style={{ fontSize: 13, color: T.sub, fontFamily: "\'JetBrains Mono\',monospace" }}>{c.cf}</div>',
  '              </div>}',
  '            </div>',
  '            <div style={{ margin: "0 16px 12px" }}>',
  '              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>',
  '                <span>\uD83D\uDCC2 Commesse ({cmList.length})</span>',
  '                <div onClick={() => { setNewCM(prev => ({ ...prev, cliente: c.nome, telefono: c.telefono || "", indirizzo: c.indirizzo || "" } as any)); setTab("commesse"); }} style={{ fontSize: 11, fontWeight: 700, color: T.acc, cursor: "pointer" }}>+ Nuova commessa</div>',
  '              </div>',
  '              {cmList.length === 0 && <div style={{ padding: 16, background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna commessa</div>}',
  '              {cmList.map(cm => (',
  '                <div key={cm.id} onClick={() => { setSelectedCM(cm); setTab("commesse"); }} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: "1px solid " + T.bdr, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>',
  '                  <div style={{ width: 36, height: 36, borderRadius: 8, background: (PIPELINE.find(p => p.id === cm.fase)?.color || T.acc) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>',
  '                    {PIPELINE.find(p => p.id === cm.fase)?.icon || "\uD83D\uDCC2"}',
  '                  </div>',
  '                  <div style={{ flex: 1 }}>',
  '                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cm.code}</div>',
  '                    <div style={{ fontSize: 11, color: T.sub }}>{PIPELINE.find(p => p.id === cm.fase)?.nome || cm.fase} · {cm.indirizzo || "—"}</div>',
  '                  </div>',
  '                </div>',
  '              ))}',
  '            </div>',
  '          </>}',
  '',
  '          {/* TAB: Storia */}',
  '          {clienteDetailTab === "storia" && <>',
  '            <div style={{ margin: "0 16px 12px" }}>',
  '              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>\uD83D\uDCC5 Timeline</div>',
  '              {[...evList].sort((a, b) => (b.date || "").localeCompare(a.date || "")).length === 0 &&',
  '                <div style={{ padding: 24, background: T.card, borderRadius: 12, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna attivit\u00E0 registrata</div>',
  '              }',
  '              {[...evList].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((ev, i) => (',
  '                <div key={ev.id || i} style={{ display: "flex", gap: 12, marginBottom: 2 }}>',
  '                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>',
  '                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: tipoEvColor(ev.tipo), border: "2px solid " + T.card }} />',
  '                    {i < evList.length - 1 && <div style={{ width: 2, flex: 1, background: T.bdr }} />}',
  '                  </div>',
  '                  <div style={{ flex: 1, paddingBottom: 16 }}>',
  '                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ev.text}</div>',
  '                    <div style={{ fontSize: 11, color: T.sub }}>{ev.date} {ev.time && "· " + ev.time} {ev.tipo && "· " + ev.tipo}</div>',
  '                  </div>',
  '                </div>',
  '              ))}',
  '            </div>',
  '          </>}',
  '',
  '          {/* TAB: Fatturato */}',
  '          {clienteDetailTab === "fatturato" && <>',
  '            <div style={{ margin: "0 16px 12px" }}>',
  '              {(() => {',
  '                const fattList = fattureDB.filter(f => cmList.some(cm => cm.id === f.cmId));',
  '                const totaleFatt = fattList.reduce((s, f) => s + (f.importo || 0), 0);',
  '                const totalePagato = fattList.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);',
  '                const totaleNonPagato = totaleFatt - totalePagato;',
  '                return <>',
  '                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>',
  '                    <div style={{ background: T.card, borderRadius: 12, padding: 14, border: "1px solid " + T.bdr }}>',
  '                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginBottom: 4 }}>Fatturato totale</div>',
  '                      <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>€ {totaleFatt.toLocaleString("it-IT")}</div>',
  '                    </div>',
  '                    <div style={{ background: T.card, borderRadius: 12, padding: 14, border: "1px solid " + T.bdr }}>',
  '                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginBottom: 4 }}>Da incassare</div>',
  '                      <div style={{ fontSize: 22, fontWeight: 800, color: totaleNonPagato > 0 ? T.red : T.grn }}>€ {totaleNonPagato.toLocaleString("it-IT")}</div>',
  '                    </div>',
  '                  </div>',
  '                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>Fatture ({fattList.length})</div>',
  '                  {fattList.length === 0 && <div style={{ padding: 24, background: T.card, borderRadius: 12, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna fattura</div>}',
  '                  {fattList.map(f => (',
  '                    <div key={f.id} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: "1px solid " + T.bdr, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>',
  '                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.pagata ? T.grn : T.red }} />',
  '                      <div style={{ flex: 1 }}>',
  '                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>€ {(f.importo || 0).toLocaleString("it-IT")}</div>',
  '                        <div style={{ fontSize: 11, color: T.sub }}>{f.numero || "N/D"} · {f.data || ""}</div>',
  '                      </div>',
  '                      <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: f.pagata ? T.grnLt : T.redLt, color: f.pagata ? T.grn : T.red }}>{f.pagata ? "Pagata" : "Da pagare"}</div>',
  '                    </div>',
  '                  ))}',
  '                </>;',
  '              })()}',
  '            </div>',
  '          </>}',
  '',
  '          {/* TAB: Note */}',
  '          {clienteDetailTab === "note" && <>',
  '            <div style={{ margin: "0 16px 12px" }}>',
  '              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>\uD83D\uDCDD Note private</div>',
  '              <textarea',
  '                value={clienteNotes[c.id] || c.note || ""}',
  '                onChange={e => setClienteNotes(prev => ({ ...prev, [c.id]: e.target.value }))}',
  '                onBlur={() => { const noteVal = clienteNotes[c.id]; if (noteVal !== undefined) { setContatti(prev => prev.map(x => x.id === c.id ? { ...x, note: noteVal } : x)); setSelectedCliente({ ...c, note: noteVal }); } }}',
  '                placeholder="Scrivi note private su questo cliente..."',
  '                style={{ width: "100%", minHeight: 120, padding: 12, borderRadius: 12, border: "1px solid " + T.bdr, background: T.card, color: T.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }}',
  '              />',
  '              {c.note && <div style={{ marginTop: 6, fontSize: 10, color: T.sub }}>Le note si salvano automaticamente</div>}',
  '            </div>',
  '          </>}',
  '',
  '          {/* Azioni */}',
  '          <div style={{ margin: "12px 16px 0", display: "flex", gap: 8 }}>',
  '            <div onClick={() => { if(confirm("Eliminare " + c.nome + "?")) { setContatti(prev => prev.filter(x => x.id !== c.id)); setSelectedCliente(null); }}} style={{ flex: 1, padding: 12, borderRadius: 10, background: T.redLt, color: T.red, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\uD83D\uDDD1 Elimina</div>',
  '          </div>',
  '        </div>',
  '      );',
  '    }',
].join(NL);

c = c.substring(0, lineStart) + replacement + NL + c.substring(endPos);
fs.writeFileSync(f, c);
console.log('FATTO! Scheda cliente arricchita con 4 tab: Info, Storia, Fatturato, Note');
