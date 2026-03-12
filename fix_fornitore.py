import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Fix 1: label kg/m -> kg/mq nel CSV header (2 posti)
c = c.replace('Peso Stecca (kg/m)', 'Peso Stecca (kg/mq)', 2)

# Fix 2: label nel form
c = c.replace('{ label: "Peso stecca (kg/m)", key: "pesoStecca", placeholder: "es. 1.2" }', 
              '{ label: "Peso stecca (kg/mq)", key: "pesoStecca", placeholder: "es. 1.2" }')

# Fix 3: sostituisci il campo fornitore (input text) con dropdown + crea nuovo
old_fornitore_field = '''                {[
                    { label: "Nome prodotto", key: "nome", placeholder: "es. Tapparella PVC Standard" },
                    { label: "Fornitore", key: "fornitore", placeholder: "es. Rollplast SRL" },
                    { label: "Materiale", key: "materiale", placeholder: "es. PVC / Alluminio" },
                    { label: "Peso stecca (kg/mq)", key: "pesoStecca", placeholder: "es. 1.2" },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} style={{ flex: "1 1 45%", minWidth: 120 }}>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>{label}</div>
                      <input value={(prod as any)[key] || ""} placeholder={placeholder}
                        onChange={e => updateProdotto(prod.id, { [key]: e.target.value })}
                        style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                          fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                    </div>
                  ))}'''

new_fornitore_field = '''                {/* Nome prodotto */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Nome prodotto</div>
                  <input value={prod.nome || ""} placeholder="es. Tapparella PVC Standard"
                    onChange={e => updateProdotto(prod.id, { nome: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>
                {/* Fornitore dropdown */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                  <select value={prod.fornitore || ""}
                    onChange={e => {
                      if (e.target.value === "__nuovo__") {
                        let n; try { n = window.prompt("Nome nuovo fornitore:"); } catch(err) {}
                        if (n?.trim()) {
                          const newF = { id: "forn_" + Date.now(), nome: n.trim(), email: "", tel: "", piva: "", note: "" };
                          setFornitori((prev: any[]) => [...prev, newF]);
                          updateProdotto(prod.id, { fornitore: n.trim() });
                        }
                      } else {
                        updateProdotto(prod.id, { fornitore: e.target.value });
                      }
                    }}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }}>
                    <option value="">— Seleziona fornitore —</option>
                    {(fornitori || []).map((fo: any) => (
                      <option key={fo.id} value={fo.nome}>{fo.nome}</option>
                    ))}
                    <option value="__nuovo__">+ Crea nuovo fornitore...</option>
                  </select>
                </div>
                {/* Materiale */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Materiale</div>
                  <input value={prod.materiale || ""} placeholder="es. PVC / Alluminio"
                    onChange={e => updateProdotto(prod.id, { materiale: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>
                {/* Peso stecca */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Peso stecca (kg/mq)</div>
                  <input value={prod.pesoStecca || ""} placeholder="es. 1.2"
                    onChange={e => updateProdotto(prod.id, { pesoStecca: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>'''

found = old_fornitore_field in c
print("fornitore field found:", found)
if found:
    c = c.replace(old_fornitore_field, new_fornitore_field, 1)

f = open('components/SettingsPanel.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print("DONE")
