const fs = require('fs');
const f = 'components/MastroERP.tsx';
let c = fs.readFileSync(f, 'utf8');

const START = '// Dettaglio cliente selezionato';
const END = '// Nuovo cliente modal';

const s = c.indexOf(START);
const e = c.indexOf(END);

if (s === -1 || e === -1) { console.log('Markers non trovati!', s, e); process.exit(1); }

const lineStart = c.lastIndexOf('\n', s) + 1;
const lineEnd = c.lastIndexOf('\n', e) + 1;

const NEW = `    // Dettaglio cliente selezionato
    if (selectedCliente) {
      const c = selectedCliente;
      const cmList = cantieri.filter(cm => cm.cliente === c.nome || (c.cognome && cm.cognome === c.cognome));
      const evList = events.filter(ev => ev.persona === c.nome || ev.persona === (c.nome + " " + (c.cognome||"")).trim());
      const fatList = fattureDB.filter(f => f.cliente === c.nome);
      const totFatturato = fatList.reduce((s, f) => s + f.importo, 0);
      const totIncassato = fatList.filter(f => f.pagata).reduce((s, f) => s + f.importo, 0);
      const totPreventivi = cmList.reduce((s, cm) => s + (cm.totale || 0), 0);
      const cTab = clienteDetailTab || "info";
      return (
        <div style={{ padding: "0 0 100px" }}>
          {/* HEADER */}
          <div style={{ ...S.header, display: "flex", alignItems: "center", gap: 10 }}>
            <div onClick={() => setSelectedCliente(null)} style={{ cursor: "pointer", padding: 4 }}>
              <Ico d={ICO.back} s={22} c={T.text} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{c.nome} {c.cognome || ""}</div>
              <div style={{ fontSize: 11, color: T.sub }}>{c.tipo === "cliente" ? "\u{1F464} Cliente" : c.tipo === "fornitore" ? "\u{1F3ED} Fornitore" : "\u{1F477} Professionista"}</div>
            </div>
            <div onClick={() => { setEditingCliente({...c}); }} style={{ padding: "6px 10px", borderRadius: 8, background: T.accLt, color: T.acc, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️ Modifica</div>
            <div onClick={() => { const idx = contatti.findIndex(x => x.id === c.id); if (idx >= 0) { const updated = { ...c, preferito: !c.preferito }; setContatti(prev => prev.map(x => x.id === c.id ? updated : x)); setSelectedCliente(updated); } }} style={{ fontSize: 22, cursor: "pointer" }}>
              {c.preferito ? "⭐" : "☆"}
            </div>
          </div>

          {/* TAB BAR */}
          <div style={{ display: "flex", margin: "0 16px 12px", background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, overflow: "hidden" }}>
            {[{id:"info",l:"Info"},{id:"storia",l:"Storia"},{id:"soldi",l:"€ Fatturato"},{id:"note",l:"\u{1F4DD} Note"}].map(tab => (
              <div key={tab.id} onClick={() => setClienteDetailTab(tab.id)}
                style={{ flex: 1, padding: "10px 4px", textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer",
                  color: cTab === tab.id ? T.acc : T.sub,
                  background: cTab === tab.id ? T.accLt : "transparent",
                  borderBottom: cTab === tab.id ? \`2px solid \${T.acc}\` : "2px solid transparent"
                }}>{tab.l}</div>
            ))}
          </div>

          {/* === TAB INFO === */}
          {cTab === "info" && (<>
            <div style={{ margin: "0 16px 12px", background: T.card, borderRadius: 14, padding: "16px", border: \`1px solid \${T.bdr}\` }}>
              {c.telefono && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}>\u{1F4DE}</div>
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.telefono}</div>
                <div onClick={() => { window.location.href="tel:" + c.telefono; }} style={{ padding: "6px 12px", borderRadius: 8, background: T.grnLt, color: T.grn, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Chiama</div>
                <div onClick={() => window.open("https://wa.me/" + c.telefono.replace(/\\s/g, ""))} style={{ padding: "6px 12px", borderRadius: 8, background: "#dcf8c6", color: "#128c7e", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>WA</div>
              </div>}
              {c.email && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}>\u{1F4E7}</div>
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.email}</div>
                <div onClick={() => window.open("mailto:" + c.email)} style={{ padding: "6px 12px", borderRadius: 8, background: T.blueLt || "#e8f0fe", color: T.blue || "#1a73e8", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Email</div>
              </div>}
              {c.indirizzo && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 14 }}>\u{1F4CD}</div>
                <div style={{ flex: 1, fontSize: 13, color: T.text }}>{c.indirizzo}</div>
                <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(c.indirizzo))} style={{ padding: "6px 12px", borderRadius: 8, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Mappa</div>
              </div>}
              {c.piva && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}>\u{1F3E2}</div>
                <div style={{ fontSize: 13, color: T.sub, fontFamily: "'JetBrains Mono',monospace" }}>{c.piva}</div>
              </div>}
              {c.cf && <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ fontSize: 14 }}>\u{1F4B3}</div>
                <div style={{ fontSize: 13, color: T.sub, fontFamily: "'JetBrains Mono',monospace" }}>CF: {c.cf}</div>
              </div>}
              {c.note && <div style={{ marginTop: 8, padding: "8px 10px", background: T.bg, borderRadius: 8, fontSize: 12, color: T.sub, fontStyle: "italic" }}>\u{1F4DD} {c.note}</div>}
            </div>

            {/* KPI */}
            <div style={{ display: "flex", gap: 8, margin: "0 16px 12px" }}>
              <div style={{ flex: 1, background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Commesse</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.text }}>{cmList.length}</div>
              </div>
              <div style={{ flex: 1, background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Preventivi</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: T.acc }}>€{totPreventivi.toLocaleString("it-IT")}</div>
              </div>
              <div style={{ flex: 1, background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, padding: "10px", textAlign: "center" }}>
                <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Fatturato</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#34c759" }}>€{totFatturato.toLocaleString("it-IT")}</div>
              </div>
            </div>

            {/* Commesse */}
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>\u{1F4C1} Commesse ({cmList.length})</span>
                <div onClick={() => { setNewCM(prev => ({ ...prev, cliente: c.nome, telefono: c.telefono || "", indirizzo: c.indirizzo || "" } as any)); setTab("commesse"); }} style={{ fontSize: 11, fontWeight: 700, color: T.acc, cursor: "pointer" }}>+ Nuova commessa</div>
              </div>
              {cmList.length === 0 && <div style={{ padding: "16px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna commessa</div>}
              {cmList.map(cm => (
                <div key={cm.id} onClick={() => { setSelectedCM(cm); setTab("commesse"); }} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: (PIPELINE.find(p => p.id === cm.fase)?.color || T.acc) + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {PIPELINE.find(p => p.id === cm.fase)?.icon || "\u{1F4C1}"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{cm.code}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>{PIPELINE.find(p => p.id === cm.fase)?.nome || cm.fase} · {cm.indirizzo || "—"}</div>
                  </div>
                  {cm.totale > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: T.grn }}>€{cm.totale?.toLocaleString("it-IT")}</div>}
                </div>
              ))}
            </div>

            {/* Appuntamenti */}
            <div style={{ margin: "0 16px 12px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 8 }}>\u{1F4C5} Appuntamenti ({evList.length})</div>
              {evList.length === 0 && <div style={{ padding: "16px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessun appuntamento</div>}
              {evList.slice(0, 5).map(ev => (
                <div key={ev.id} style={{ padding: "8px 12px", background: T.card, borderRadius: 8, border: \`1px solid \${T.bdr}\`, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 4, height: 28, borderRadius: 2, background: tipoEvColor(ev.tipo) }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{ev.text}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{ev.date} {ev.time && "· " + ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </>)}

          {/* === TAB STORIA === */}
          {cTab === "storia" && (<>
            <div style={{ margin: "0 16px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Timeline attività</div>
              {(() => {
                const tl = [];
                cmList.forEach(cm => {
                  tl.push({ date: cm.dataCreazione || cm.data || "2025-01-01", ico: "\u{1F4C1}", text: "Commessa " + cm.code + " creata", sub: cm.indirizzo || "", color: T.acc });
                  if (cm.dataFirma) tl.push({ date: cm.dataFirma, ico: "✍️", text: "Preventivo " + cm.code + " firmato", sub: "€" + (cm.totale||0).toLocaleString("it-IT"), color: T.grn });
                });
                evList.forEach(ev => {
                  tl.push({ date: ev.dateISO || ev.date || "2025-01-01", ico: "\u{1F4C5}", text: ev.text, sub: ev.date + (ev.time ? " " + ev.time : ""), color: "#007aff" });
                });
                fatList.forEach(f => {
                  tl.push({ date: f.dataISO || f.data, ico: "\u{1F9FE}", text: "Fattura N." + f.numero + "/" + f.anno, sub: "€" + f.importo.toLocaleString("it-IT") + " – " + (f.pagata ? "Pagata" : "Da incassare"), color: f.pagata ? "#34c759" : "#ff3b30" });
                });
                tl.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
                if (tl.length === 0) return <div style={{ padding: "20px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna attività registrata</div>;
                return tl.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 2 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, flexShrink: 0 }} />
                      {i < tl.length - 1 && <div style={{ width: 2, flex: 1, background: T.bdr }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{t.ico} {t.text}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{t.sub}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </>)}

          {/* === TAB FATTURATO === */}
          {cTab === "soldi" && (<>
            <div style={{ margin: "0 16px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Preventivato</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: T.acc }}>€{totPreventivi.toLocaleString("it-IT")}</div>
                </div>
                <div style={{ flex: 1, background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Fatturato</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: T.text }}>€{totFatturato.toLocaleString("it-IT")}</div>
                </div>
                <div style={{ flex: 1, background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, padding: 12, textAlign: "center" }}>
                  <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Incassato</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#34c759" }}>€{totIncassato.toLocaleString("it-IT")}</div>
                </div>
              </div>
              {totFatturato > 0 && totIncassato < totFatturato && (
                <div style={{ background: "#fff3cd", borderRadius: 10, padding: "10px 14px", marginBottom: 12, border: "1px solid #ffc107", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚠️</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#856404" }}>Da incassare: €{(totFatturato - totIncassato).toLocaleString("it-IT")}</span>
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Fatture ({fatList.length})</div>
              {fatList.length === 0 && <div style={{ padding: "20px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessuna fattura emessa</div>}
              {fatList.sort((a,b) => b.numero - a.numero).map(f => (
                <div key={f.id} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>N. {f.numero}/{f.anno}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{f.data} · {f.tipo}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>€{f.importo.toLocaleString("it-IT")}</div>
                    <div style={{ fontSize: 9, color: f.pagata ? "#34c759" : "#ff3b30", fontWeight: 700 }}>{f.pagata ? "✅ Pagata" : "⏳ Da incassare"}</div>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, marginTop: 16 }}>Preventivi da commesse</div>
              {cmList.filter(cm => cm.totale > 0).length === 0 && <div style={{ padding: "20px", background: T.card, borderRadius: 10, textAlign: "center", fontSize: 12, color: T.sub }}>Nessun preventivo</div>}
              {cmList.filter(cm => cm.totale > 0).map(cm => (
                <div key={cm.id} onClick={() => { setSelectedCM(cm); setTab("commesse"); }} style={{ padding: "10px 12px", background: T.card, borderRadius: 10, border: \`1px solid \${T.bdr}\`, marginBottom: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{cm.code}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{cm.indirizzo || "—"}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{cm.totale?.toLocaleString("it-IT")}</div>
                </div>
              ))}
            </div>
          </>)}

          {/* === TAB NOTE PRIVATE === */}
          {cTab === "note" && (<>
            <div style={{ margin: "0 16px" }}>
              <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Note private visibili solo a te. Usa per promemoria, preferenze, avvertenze.</div>
              <textarea value={c.notePrivate || ""} placeholder="es: Paga sempre in ritardo... Vuole sempre lo sconto... Persona molto disponibile..."
                onChange={e => {
                  const updated = { ...c, notePrivate: e.target.value };
                  setContatti(prev => prev.map(x => x.id === c.id ? updated : x));
                  setSelectedCliente(updated);
                }}
                style={{ ...S.input, width: "100%", minHeight: 120, fontSize: 13, lineHeight: 1.6, boxSizing: "border-box", resize: "vertical", marginBottom: 12 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Tag rapidi</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {["\u{1F7E2} Paga puntuale", "\u{1F7E1} Paga in ritardo", "\u{1F534} Insolvente", "⭐ VIP", "\u{1F44D} Facile", "\u{1F62C} Difficile", "\u{1F4B0} Vuole sconti", "\u{1F4DE} Chiama spesso", "\u{1F3D7}️ Cantiere complesso"].map(tag => (
                  <div key={tag} onClick={() => {
                    const cur = c.notePrivate || "";
                    const has = cur.includes(tag);
                    const updated = { ...c, notePrivate: has ? cur.replace(tag + "\\n", "").replace(tag, "").trim() : (tag + "\\n" + cur).trim() };
                    setContatti(prev => prev.map(x => x.id === c.id ? updated : x));
                    setSelectedCliente(updated);
                  }}
                    style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      background: (c.notePrivate || "").includes(tag) ? T.acc + "20" : T.bg,
                      color: (c.notePrivate || "").includes(tag) ? T.acc : T.sub,
                      border: \`1px solid \${(c.notePrivate || "").includes(tag) ? T.acc : T.bdr}\`
                    }}>{tag}</div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}>\u{1F514} Promemoria</div>
              <input value={c.promemoria || ""} placeholder="es: Richiamare a marzo per manutenzione..."
                onChange={e => {
                  const updated = { ...c, promemoria: e.target.value };
                  setContatti(prev => prev.map(x => x.id === c.id ? updated : x));
                  setSelectedCliente(updated);
                }}
                style={{ ...S.input, width: "100%", fontSize: 12, boxSizing: "border-box", marginBottom: 12 }} />
            </div>
          </>)}

          {/* Azioni fisse in basso */}
          <div style={{ margin: "16px 16px 0", display: "flex", gap: 8 }}>
            <div onClick={() => { setEditingCliente({...c}); }} style={{ flex: 1, padding: "12px", borderRadius: 10, background: T.accLt, color: T.acc, textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>✏️ Modifica</div>
            <div onClick={() => { setContatti(prev => prev.filter(x => x.id !== c.id)); setSelectedCliente(null); }} style={{ flex: 1, padding: "12px", borderRadius: 10, background: T.redLt || "#fee", color: T.red || "#ff3b30", textAlign: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>\u{1F5D1} Elimina</div>
          </div>
        </div>
      );
    }

    `;

c = c.substring(0, lineStart) + NEW + c.substring(lineEnd);

// Aggiungi state
if (!c.includes('clienteDetailTab')) {
  const idx = c.indexOf('const [selectedCliente, setSelectedCliente]');
  if (idx > -1) {
    const nl = c.indexOf('\\n', idx);
    c = c.substring(0, nl + 1) +
      '  const [clienteDetailTab, setClienteDetailTab] = useState("info");\\n' +
      '  const [editingCliente, setEditingCliente] = useState<any>(null);\\n' +
      c.substring(nl + 1);
    console.log('State aggiunte');
  }
}

fs.writeFileSync(f, c);
console.log('\\nScheda cliente arricchita!');
console.log('- Tab Info: contatti + KPI + commesse + appuntamenti');
console.log('- Tab Storia: timeline');
console.log('- Tab Fatturato: preventivato/fatturato/incassato');
console.log('- Tab Note: note private + tag rapidi + promemoria');
console.log('- Bottone Modifica');
