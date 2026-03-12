import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
c=f.read()
f.close()

# Sostituisci il blocco fornitore dropdown con semplice input text
old = '''                {/* Fornitore dropdown */}
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
                </div>'''

new = '''                {/* Fornitore input */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                  <input value={prod.fornitore || ""} placeholder="es. Rollplast SRL"
                    onChange={e => updateProdotto(prod.id, { fornitore: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>'''

found = old in c
print("found:", found)
if found:
    c = c.replace(old, new, 1)
    print("replaced")

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.write(c)
f.close()
print("done")
