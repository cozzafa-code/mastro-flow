import sys
sys.stdout.reconfigure(encoding='utf-8')

# Componente ListinoSettore da inserire prima di export default
LISTINO_COMPONENT = r'''
// ─── ListinoSettore — componente riutilizzabile per ogni tab ─────────────────
function ListinoSettore({ titolo, emoji, storageKey, T, PRI, FF }: any) {
  const ctx = (window as any).__mastroCtx;
  const [listino, setListino] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("mastro_listino_" + storageKey) || "[]"); } catch { return []; }
  });
  const [expanded, setExpanded] = React.useState<string|null>(null);
  const [nlState, setNlState] = React.useState<Record<string,string>>({});
  const [nhState, setNhState] = React.useState<Record<string,string>>({});
  const [npState, setNpState] = React.useState<Record<string,string>>({});

  const save = (next: any[]) => {
    setListino(next);
    try { localStorage.setItem("mastro_listino_" + storageKey, JSON.stringify(next)); } catch {}
  };

  const addProdotto = () => save([...listino, {
    id: Date.now().toString(),
    nome: "Nuovo prodotto",
    fornitore: "",
    materiale: "",
    pesoStecca: "",
    euroMq: 0,
    minimoMq: 0,
    griglia: []
  }]);

  const updateProdotto = (id: string, upd: any) =>
    save(listino.map((p: any) => p.id === id ? { ...p, ...upd } : p));

  const deleteProdotto = (id: string) =>
    save(listino.filter((p: any) => p.id !== id));

  // Export CSV
  const exportCSV = () => {
    let csv = "Nome;Fornitore;Materiale;Peso Stecca (kg/m);Euro/mq;Minimo mq;Griglia L;Griglia H;Griglia Prezzo\n";
    listino.forEach((p: any) => {
      if (p.griglia && p.griglia.length > 0) {
        p.griglia.forEach((g: any) => {
          csv += `${p.nome};${p.fornitore||""};${p.materiale||""};${p.pesoStecca||""};${p.euroMq||0};${p.minimoMq||0};${g.l};${g.h};${g.prezzo}\n`;
        });
      } else {
        csv += `${p.nome};${p.fornitore||""};${p.materiale||""};${p.pesoStecca||""};${p.euroMq||0};${p.minimoMq||0};;;`+"\n";
      }
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `listino_${storageKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Export template vuoto
  const exportTemplate = () => {
    const csv = "Nome;Fornitore;Materiale;Peso Stecca (kg/m);Euro/mq;Minimo mq;Griglia L;Griglia H;Griglia Prezzo\n" +
      "Tapparella PVC Standard;Fornitore SRL;PVC;1.2;28;0.5;800;1200;22.50\n" +
      "Tapparella PVC Standard;Fornitore SRL;PVC;1.2;28;0.5;1000;1500;35.00\n" +
      "Tapparella Alluminio;Fornitore SRL;Alluminio;1.8;45;0.5;800;1200;36.00\n" +
      "Tapparella Alluminio;Fornitore SRL;Alluminio;1.8;45;0.5;1000;1500;55.00\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `template_listino_${storageKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV/Excel (universal parser)
  const importFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    const processRows = (rows: string[][]) => {
      // Salta header
      const dataRows = rows.filter((r, i) => i > 0 && r.length >= 2 && r[0]?.trim());
      const prodMap: Record<string, any> = {};
      dataRows.forEach(r => {
        const nome = r[0]?.trim() || "Prodotto";
        const key = nome + "|" + (r[1]?.trim()||"");
        if (!prodMap[key]) {
          prodMap[key] = {
            id: Date.now().toString() + Math.random(),
            nome,
            fornitore: r[1]?.trim() || "",
            materiale: r[2]?.trim() || "",
            pesoStecca: r[3]?.trim() || "",
            euroMq: parseFloat(r[4]?.replace(",",".") || "0") || 0,
            minimoMq: parseFloat(r[5]?.replace(",",".") || "0") || 0,
            griglia: []
          };
        }
        // Se ha griglia L, H, Prezzo
        if (r[6] && r[7] && r[8]) {
          const l = parseInt(r[6]); const h = parseInt(r[7]); const prezzo = parseFloat(r[8].replace(",","."));
          if (!isNaN(l) && !isNaN(h) && !isNaN(prezzo)) {
            prodMap[key].griglia.push({ l, h, prezzo });
          }
        }
      });
      const prods = Object.values(prodMap);
      prods.forEach((p: any) => p.griglia.sort((a: any, b: any) => a.l - b.l || a.h - b.h));
      save([...listino, ...prods]);
      alert("✅ Importati " + prods.length + " prodotti");
    };

    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        const rows = text.split(/\r?\n/).map(r => r.split(/[;,\t]/));
        processRows(rows);
      };
      reader.readAsText(file, "utf-8");
    } else if (ext === "xlsx" || ext === "xls") {
      // Usa SheetJS se disponibile
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = ev.target?.result;
          // Fallback: tratta come CSV con tab
          const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);
          const rows = text.split(/\r?\n/).map(r => r.split(/[\t;,]/));
          processRows(rows);
        } catch {
          alert("Formato non supportato. Usa CSV (salva il file Excel come CSV con separatore ;)");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Formato supportato: CSV (.csv), Excel (.xlsx), testo (.txt)\nSeparatore colonne: punto e virgola (;)");
    }
    e.target.value = "";
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* Header sezione */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{emoji} {titolo}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <div onClick={exportTemplate}
            style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${PRI}`, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            📥 Template
          </div>
          {listino.length > 0 && (
            <div onClick={exportCSV}
              style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${PRI}`, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              📤 Esporta
            </div>
          )}
          <div onClick={addProdotto}
            style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            + Prodotto
          </div>
        </div>
      </div>

      {/* Import file */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input type="file" accept=".csv,.xlsx,.xls,.txt"
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }}
          onChange={importFile} />
        <div style={{ padding: "10px 14px", borderRadius: 8, border: `1px dashed ${PRI}`, background: PRI + "08",
          textAlign: "center", fontSize: 11, color: PRI, cursor: "pointer" }}>
          📂 Importa listino fornitore (CSV, Excel, TXT) — trascina qui o clicca
        </div>
      </div>

      {/* Info formato */}
      <div style={{ fontSize: 9, color: T.sub, marginBottom: 12, lineHeight: 1.6 }}>
        Formato CSV: Nome ; Fornitore ; Materiale ; Peso(kg/m) ; €/mq ; Minimo mq ; L(mm) ; H(mm) ; Prezzo€
        <br />Scarica il Template per vedere il formato corretto. Puoi anche inserire i prodotti manualmente.
      </div>

      {/* Lista prodotti */}
      {listino.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>
          Nessun prodotto — importa un listino o clicca + Prodotto
        </div>
      ) : (
        listino.map((prod: any) => (
          <div key={prod.id} style={{ border: `1px solid ${T.bdr}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
            {/* Header prodotto */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === prod.id ? null : prod.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{prod.nome}</div>
                {prod.fornitore && <div style={{ fontSize: 9, color: T.sub }}>{prod.fornitore}{prod.materiale ? " · " + prod.materiale : ""}</div>}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: PRI }}>
                {prod.griglia?.length > 0
                  ? `Griglia ${prod.griglia.length} prezzi`
                  : prod.euroMq > 0 ? `€${prod.euroMq}/mq` : "Nessun prezzo"}
              </div>
              <div onClick={e => { e.stopPropagation(); deleteProdotto(prod.id); }}
                style={{ color: "#DC4444", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</div>
              <div style={{ fontSize: 10, color: T.sub }}>{expanded === prod.id ? "▲" : "▼"}</div>
            </div>

            {expanded === prod.id && (
              <div style={{ padding: "12px 14px", background: T.bg, borderTop: `1px solid ${T.bdr}` }}>
                {/* Campi prodotto */}
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {[
                    { label: "Nome prodotto", key: "nome", placeholder: "es. Tapparella PVC Standard" },
                    { label: "Fornitore", key: "fornitore", placeholder: "es. Rollplast SRL" },
                    { label: "Materiale", key: "materiale", placeholder: "es. PVC / Alluminio" },
                    { label: "Peso stecca (kg/m)", key: "pesoStecca", placeholder: "es. 1.2" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} style={{ flex: "1 1 45%", minWidth: 120 }}>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>{label}</div>
                      <input value={(prod as any)[key] || ""} placeholder={placeholder}
                        onChange={e => updateProdotto(prod.id, { [key]: e.target.value })}
                        style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                          fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                    </div>
                  ))}
                </div>

                {/* Euro/mq e minimo */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>€/mq (se no griglia)</div>
                    <input type="number" value={prod.euroMq || ""} placeholder="0"
                      onChange={e => updateProdotto(prod.id, { euroMq: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                        fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Minimo fatturazione (mq)</div>
                    <input type="number" step="0.1" value={prod.minimoMq || ""} placeholder="0"
                      onChange={e => updateProdotto(prod.id, { minimoMq: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                        fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                  </div>
                </div>
                {prod.minimoMq > 0 && (
                  <div style={{ fontSize: 9, color: PRI, marginBottom: 8 }}>
                    Minimo {prod.minimoMq} mq — sotto soglia si fattura comunque {prod.minimoMq} mq
                  </div>
                )}

                {/* Griglia L x H */}
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                  Griglia L×H ({prod.griglia?.length || 0} righe)
                  <span style={{ fontSize: 9, color: T.sub, fontWeight: 400, marginLeft: 6 }}>Ha priorita su €/mq</span>
                </div>

                {prod.griglia?.length > 0 && (
                  <div style={{ overflowX: "auto", marginBottom: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                      <thead>
                        <tr style={{ background: T.card }}>
                          <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 700 }}>L (mm)</th>
                          <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 700 }}>H (mm)</th>
                          <th style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>Prezzo €</th>
                          <th style={{ width: 24 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {prod.griglia.map((g: any, gi: number) => (
                          <tr key={gi} style={{ borderBottom: `1px solid ${T.bdr}20` }}>
                            <td style={{ padding: "3px 8px" }}>{g.l}</td>
                            <td style={{ padding: "3px 8px" }}>{g.h}</td>
                            <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700, color: PRI }}>€{g.prezzo}</td>
                            <td>
                              <div onClick={() => updateProdotto(prod.id, { griglia: prod.griglia.filter((_: any, i: number) => i !== gi) })}
                                style={{ color: "#DC4444", cursor: "pointer", fontSize: 12, textAlign: "center" }}>×</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Aggiungi riga griglia */}
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8 }}>
                  <input type="number" value={nlState[prod.id]||""} onChange={e => setNlState(s=>({...s,[prod.id]:e.target.value}))}
                    placeholder="L mm" style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                  <input type="number" value={nhState[prod.id]||""} onChange={e => setNhState(s=>({...s,[prod.id]:e.target.value}))}
                    placeholder="H mm" style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                  <input type="number" value={npState[prod.id]||""} onChange={e => setNpState(s=>({...s,[prod.id]:e.target.value}))}
                    placeholder="€" style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                  <div onClick={() => {
                    const nl = nlState[prod.id]; const nh = nhState[prod.id]; const np = npState[prod.id];
                    if (!nl || !nh || !np) return;
                    const ng = [...(prod.griglia||[]), { l: parseInt(nl), h: parseInt(nh), prezzo: parseFloat(np.replace(",",".")) }]
                      .sort((a: any, b: any) => a.l - b.l || a.h - b.h);
                    updateProdotto(prod.id, { griglia: ng });
                    setNlState(s=>({...s,[prod.id]:""})); setNhState(s=>({...s,[prod.id]:""})); setNpState(s=>({...s,[prod.id]:""}));
                  }} style={{ padding: "6px 10px", borderRadius: 6, background: PRI, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Riga</div>
                </div>

                {/* Import CSV griglia singola */}
                <div style={{ position: "relative" }}>
                  <input type="file" accept=".csv,.txt"
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }}
                    onChange={e2 => {
                      const file2 = e2.target.files?.[0]; if (!file2) return;
                      const reader2 = new FileReader();
                      reader2.onload = ev2 => {
                        const text2 = ev2.target?.result as string;
                        const rows2 = text2.split(/\r?\n/).map(r => r.split(/[;,\t]/));
                        const ng2 = rows2
                          .filter(r => r.length >= 3 && !isNaN(parseFloat(r[0])))
                          .map(r => ({ l: parseInt(r[0]), h: parseInt(r[1]), prezzo: parseFloat(r[2].replace(",",".")) }))
                          .sort((a, b) => a.l - b.l || a.h - b.h);
                        if (ng2.length > 0) { updateProdotto(prod.id, { griglia: ng2 }); alert("Importate " + ng2.length + " righe griglia"); }
                      };
                      reader2.readAsText(file2);
                      e2.target.value = "";
                    }} />
                  <div style={{ padding: "6px 10px", borderRadius: 6, border: `1px dashed ${PRI}`, background: PRI + "08",
                    textAlign: "center", fontSize: 10, color: PRI, cursor: "pointer" }}>
                    📂 Importa CSV griglia (L ; H ; Prezzo)
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

'''

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Verifica se ListinoSettore esiste già
if 'function ListinoSettore' in c:
    print("ListinoSettore già presente — salto inserimento componente")
else:
    # Inserisci prima di export default function SettingsPanel
    insert_marker = 'export default function SettingsPanel()'
    idx = c.find(insert_marker)
    if idx == -1:
        print("ERROR: export default non trovato")
        sys.exit(1)
    c = c[:idx] + LISTINO_COMPONENT + c[idx:]
    print("Componente ListinoSettore inserito")

# Ora inietta il componente nelle 3 tab
patches = [
    {
        "tab": "tapparella",
        "old": '">+ Aggiungi tipo misura</div>\n          </>\n        )}\n\n        {settingsTab === "zanzariera"',
        "storageKey": "tapparelleListino",
        "emoji": "⬇️",
        "titolo": "Listino Tapparelle"
    },
    {
        "tab": "zanzariera", 
        "old": '">+ Aggiungi tipo misura</div>\n          </>\n        )}\n\n        {settingsTab === "persiana"',
        "storageKey": "zanzariereListino",
        "emoji": "🦟",
        "titolo": "Listino Zanzariere"
    },
    {
        "tab": "persiana",
        "old": '">+ Aggiungi tipo misura</div>\n          </>\n        )}\n\n        {/* === SALITA',
        "storageKey": "persianeListino",
        "emoji": "🏠",
        "titolo": "Listino Persiane"
    },
]

for patch in patches:
    found = patch["old"] in c
    print(f"Tab {patch['tab']} marker found: {found}")

f = open('components/SettingsPanel.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print("Salvato")
