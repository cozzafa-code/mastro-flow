const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

// 1. Add clienteDetailTab state near selectedCliente
const stateMarker = 'const [selectedCliente, setSelectedCliente] = useState<any>(null);';
if (!c.includes('clienteDetailTab')) {
  c = c.replace(stateMarker, stateMarker + '\n  const [clienteDetailTab, setClienteDetailTab] = useState("info");\n  const [clienteNotes, setClienteNotes] = useState<Record<string,string>>({});');
  console.log('1. State aggiunto');
} else {
  console.log('1. State gia presente');
}

// 2. Replace client detail section
const START = '    // Dettaglio cliente selezionato\n    if (selectedCliente) {';
const END = '          </div>\n        </div>\n      );\n    }';

const startIdx = c.indexOf(START);
if (startIdx === -1) { console.log('ERRORE: START non trovato'); process.exit(1); }

// Find the correct END - it's the closing of the selectedCliente if block
// We need to find the pattern after "Elimina" button
const eliminaIdx = c.indexOf("Elimina</div>", startIdx);
if (eliminaIdx === -1) { console.log('ERRORE: Elimina non trovato'); process.exit(1); }

// Find the closing pattern after Elimina
const afterElimina = c.indexOf("    }", eliminaIdx);
const endIdx = c.indexOf("\n", afterElimina) + 1;

console.log('2. Sezione trovata:', startIdx, '-', endIdx, '(', endIdx - startIdx, 'chars)');

const NEW_SECTION = `    // Dettaglio cliente selezionato — ENRICHED
    if (selectedCliente) {
      const c = selectedCliente;
      const cmList = cantieri.filter(cm => cm.cliente === c.nome || (c.cognome && cm.cognome === c.cognome));
      const evList = events.filter(ev => ev.persona === c.nome || ev.persona === (c.nome + " " + (c.cognome||"")).trim());
      const fattureTot = fattureDB.filter(f => cmList.some(cm => cm.id === f.cmId)).reduce((s, f) => s + (f.importo || 0), 0);
      const cmAttive = cmList.filter(cm => cm.fase !== "chiusura").length;
      const tabs = [
        { id: "info", label: "Info", icon: "\\u{1F4CB}" },
        { id: "storia", label: "Storia", icon: "\\u{1F4C5}" },
        { id: "fatturato", label: "\€ Fatturato", icon: "" },
        { id: "note", label: "\\u{1F4DD} Note", icon: "" }
      ];
      return (
        <div style={{ padding: "0 0 100px" }}>
          {/* Header */}
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => { setSelectedCliente(null); setClienteDetailTab("info"); }} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={T.text} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{c.nome} {c.cognome || ""}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{c.tipo === "cliente" ? "\\u{1F464} Cliente" : c.tipo === "fornitore" ? "\\u{1F3ED} Fornitore" : "\\u{1F477} Professionista"}</div>
            </div>
            <div onClick={() => { const idx = contatti.findIndex(x => x.id === c.id); if (idx >= 0) { const updated = { ...c, preferito: !c.preferito }; setContatti(prev => prev.map(x => x.id === c.id ? updated : x)); setSelectedCliente(updated); } }} style={{ fontSize: 22, cursor: "pointer" }}>
              {c.preferito ? "\⭐" : "\☆"}
            </div>
          </div>

          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "0 16px 12px" }}>
            <div style={{ background: T.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + T.bdr }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.acc }}>{cmList.length}</div>
              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Commesse</div>
            </div>
            <div style={{ background: T.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + T.bdr }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.grn }}>{cmAttive}</div>
              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Attive</div>
            </div>
            <div style={{ background: T.card, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + T.bdr }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.orange }}>{fattureTot > 0 ? (fattureTot / 1000).toFixed(1) + "k" : "0"}</div>
              <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>\€ Totale</div>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, margin: "0 16px 12px", background: T.bg, borderRadius: 10, padding: 3 }}>
            {tabs.map(t => (
              <div key={t.id} onClick={() => setClienteDetailTab(t.id)}
                style={{ flex: 1, padding: "8px 4px", textAlign: "center", borderRadius: 8, fontSize: 11, fontWeight: 700,
                  cursor: "pointer", transition: "all .2s",
                  background: clienteDetailTab === t.id ? T.card : "transparent",
                  color: clienteDetailTab === t.id ? T.acc : T.sub,
                  boxShadow: clienteDetailTab === t.id ? T.cardSh : "none"
                }}>
                {t.icon} {t.label}
              </div>
            ))}
          </div>

          {/* TAB: Info */}
          {clienteDetailTab === "info" && <>
            <div style={{ margin: "0 16px 12px", background: T.card, borderRadius: 14, padding: 16, border: "1px solid " + T.bdr }}>
              {c.telefono && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}>\\u{1F4DE}</div>
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.telefono}</div>
                <div onClick={() => { window.location.href="tel:" + c.telefono; }} style={{ padding: "6px 12px", borderRadius: 8, background: T.grnLt, color: T.grn, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chiama</div>
                <div onClick={() => window.open("https://wa.me/" + c.telefono.replace(/\\s/g, ""))} style={{ padding: "6px 12px", borderRadius: 8, background: "#dcf8c6", color: "#128c7e", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>WA</div>
              </div>}
              {c.email && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}>\\u{1F4E7}</div>
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.email}</div>
                <div onClick={() => window.open("mailto:" + c.email)} style={{ padding: "6px 12px", borderRadius: 8, background: T.blueLt, color: T.blue, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Email</div>
              </div>}
              {c.indirizzo && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}>\\u{1F4CD}</div>
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.indirizzo}</div>
                <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(c.indirizzo))} style={{ padding: "6px 12px", borderRadius: 8, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mappa</div>
              </div>}
              {c.piva && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}>\\u{1F3E2}</div>
                <div style={{ fontSize: 13, color: T.sub, fontFamily: "'JetBrains Mono',monospace" }}>{c.piva}</div>
              </div>}
              {c.cf && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}>\\u{1F194}</div>
                <div style={{ fontSize: 13, color: T.sub, fontFamily: "'JetBrains Mono',monospace" }}>{c.cf}</div>
              </div>}
            </div>
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>\\u{1F4C2} Commesse ({cmList.length})</span>
                <div onClick={() => { setNewCM(prev => ({ ...prev, cliente: c.nome, telefono: c.telefono || "", indirizzo: c.indirizzo || "" } as any)); setTab("commesse"); }} style={{ fontSize: 11, fontWeight: 700, color: T.acc, cursor: "pointer" }}>+ Nuova commessa</div>
              </div>
              {cmList.length === 0 && <div style={{ padding: 16, background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna commessa</div>}
              {cmList.map(cm => (
                <div key={cm.id} onClick={() => { setSelectedCM(cm); setTab("commesse"); }} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: "1px solid " + T.bdr, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: (PIPELINE.find(p => p.id === cm.fase)?.color || T.acc) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {PIPELINE.find(p => p.id === cm.fase)?.icon || "\\u{1F4C2}"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cm.code}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{PIPELINE.find(p => p.id === cm.fase)?.nome || cm.fase} \· {cm.indirizzo || "\—"}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* TAB: Storia (timeline) */}
          {clienteDetailTab === "storia" && <>
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>\\u{1F4C5} Timeline attivit\à</div>
              {[...evList].sort((a, b) => (b.date || "").localeCompare(a.date || "")).length === 0 && 
                <div style={{ padding: 24, background: T.card, borderRadius: 12, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna attivit\à registrata</div>
              }
              {[...evList].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((ev, i) => (
                <div key={ev.id || i} style={{ display: "flex", gap: 12, marginBottom: 2 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: tipoEvColor(ev.tipo), border: "2px solid " + T.card }} />
                    {i < evList.length - 1 && <div style={{ width: 2, flex: 1, background: T.bdr }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ev.text}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{ev.date} {ev.time && "\· " + ev.time} {ev.tipo && "\· " + ev.tipo}</div>
                  </div>
                </div>
              ))}
            </div>
          </>}

          {/* TAB: Fatturato */}
          {clienteDetailTab === "fatturato" && <>
            <div style={{ margin: "0 16px 12px" }}>
              {(() => {
                const fattList = fattureDB.filter(f => cmList.some(cm => cm.id === f.cmId));
                const totaleFatt = fattList.reduce((s, f) => s + (f.importo || 0), 0);
                const totalePagato = fattList.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
                const totaleNonPagato = totaleFatt - totalePagato;
                return <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                    <div style={{ background: T.card, borderRadius: 12, padding: 14, border: "1px solid " + T.bdr }}>
                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginBottom: 4 }}>Fatturato totale</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>\€ {totaleFatt.toLocaleString("it-IT")}</div>
                    </div>
                    <div style={{ background: T.card, borderRadius: 12, padding: 14, border: "1px solid " + T.bdr }}>
                      <div style={{ fontSize: 10, color: T.sub, fontWeight: 600, marginBottom: 4 }}>Da incassare</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: totaleNonPagato > 0 ? T.red : T.grn }}>\€ {totaleNonPagato.toLocaleString("it-IT")}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>Fatture ({fattList.length})</div>
                  {fattList.length === 0 && <div style={{ padding: 24, background: T.card, borderRadius: 12, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna fattura</div>}
                  {fattList.map(f => (
                    <div key={f.id} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: "1px solid " + T.bdr, marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: f.pagata ? T.grn : T.red }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>\€ {(f.importo || 0).toLocaleString("it-IT")}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>{f.numero || "N/D"} \· {f.data || ""}</div>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: f.pagata ? T.grnLt : T.redLt, color: f.pagata ? T.grn : T.red }}>{f.pagata ? "Pagata" : "Da pagare"}</div>
                    </div>
                  ))}
                </>;
              })()}
            </div>
          </>}

          {/* TAB: Note private */}
          {clienteDetailTab === "note" && <>
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>\\u{1F4DD} Note private</div>
              <textarea
                value={clienteNotes[c.id] || c.note || ""}
                onChange={e => setClienteNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                onBlur={() => { const noteVal = clienteNotes[c.id]; if (noteVal !== undefined) { setContatti(prev => prev.map(x => x.id === c.id ? { ...x, note: noteVal } : x)); setSelectedCliente({ ...c, note: noteVal }); } }}
                placeholder="Scrivi note private su questo cliente..."
                style={{ width: "100%", minHeight: 120, padding: 12, borderRadius: 12, border: "1px solid " + T.bdr, background: T.card, color: T.text, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none" }}
              />
              {c.note && <div style={{ marginTop: 6, fontSize: 10, color: T.sub }}>Le note si salvano automaticamente</div>}
            </div>
          </>}

          {/* Azioni rapide — always visible */}
          <div style={{ margin: "12px 16px 0", display: "flex", gap: 8 }}>
            <div onClick={() => { if(confirm("Eliminare " + c.nome + "?")) { setContatti(prev => prev.filter(x => x.id !== c.id)); setSelectedCliente(null); }}} style={{ flex: 1, padding: 12, borderRadius: 10, background: T.redLt, color: T.red, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\\u{1F5D1} Elimina</div>
          </div>
        </div>
      );
    }
`;

c = c.substring(0, startIdx) + NEW_SECTION + c.substring(endIdx);
fs.writeFileSync(f, c);
console.log('FATTO! Scheda cliente arricchita con 4 tab');
console.log('Tab: Info, Storia, Fatturato, Note');
