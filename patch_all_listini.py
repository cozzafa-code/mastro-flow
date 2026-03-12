import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Ogni patch: testo da trovare alla fine del blocco, e listino da inserire prima della chiusura
patches = [
    {
        "tab": "vetri",
        "old": '>+ Aggiungi vetro</div>\n          </>\n        )}',
        "listino": '\n            <ListinoSettore titolo="Listino Vetri" emoji="\U0001f4a0" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />'
    },
    {
        "tab": "coprifili",
        "old": '>+ Aggiungi coprifilo</div>\n          </>\n        )}',
        "listino": '\n            <ListinoSettore titolo="Listino Coprifili" emoji="\U0001f4cf" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />'
    },
    {
        "tab": "lamiere",
        "old": '>+ Aggiungi lamiera</div>\n          </>\n        )}',
        "listino": '\n            <ListinoSettoreLamiere T={T} PRI={PRI} FF={FF} />'
    },
    {
        "tab": "cassonetto",
        "old": '>+ Aggiungi tipo cassonetto</div>\n          </>\n        )}',
        "listino": '\n            <ListinoSettore titolo="Listino Cassonetti e Controtelai" emoji="\U0001f4e6" storageKey="cassonettoListino" T={T} PRI={PRI} FF={FF} />'
    },
]

for p in patches:
    old_full = p["old"]
    new_full = p["listino"] + '\n          </>\n        )}'
    found = old_full in c
    print(f"Tab {p['tab']}: {found}")
    if found:
        c = c.replace(old_full, new_full, 1)

# Aggiungi componente ListinoSettoreLamiere prima di export default
LAMIERE_COMPONENT = '''
// ─── ListinoSettoreLamiere ────────────────────────────────────────────────────
function ListinoSettoreLamiere({ T, PRI, FF }: any) {
  const [lamiere, setLamiere] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("mastro_listino_lamiereListino") || "[]"); } catch { return []; }
  });
  const [expanded, setExpanded] = React.useState<string|null>(null);

  const save = (next: any[]) => {
    setLamiere(next);
    try { localStorage.setItem("mastro_listino_lamiereListino", JSON.stringify(next)); } catch {}
  };

  const addLamiera = (tipo: string) => save([...lamiere, {
    id: Date.now().toString(),
    nome: "Nuova lamiera",
    tipo,
    fornitore: "",
    spessore: "",
    prezzoKg: 0,
    prezzoMl: 0,
    pieghe: []
  }]);

  const update = (id: string, upd: any) => save(lamiere.map((l: any) => l.id === id ? { ...l, ...upd } : l));
  const remove = (id: string) => save(lamiere.filter((l: any) => l.id !== id));

  const exportCSV = () => {
    let csv = "Tipo;Nome;Fornitore;Spessore(mm);Euro/kg;Euro/ml base;Piega;Euro/ml piega\n";
    lamiere.forEach((l: any) => {
      if (l.pieghe && l.pieghe.length > 0) {
        l.pieghe.forEach((p: any) => {
          csv += `${l.tipo};${l.nome};${l.fornitore||""};${l.spessore||""};${l.prezzoKg||0};${l.prezzoMl||0};${p.nome};${p.prezzoMl}\n`;
        });
      } else {
        csv += `${l.tipo};${l.nome};${l.fornitore||""};${l.spessore||""};${l.prezzoKg||0};${l.prezzoMl||0};;\n`;
      }
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "listino_lamiere.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const tipi = ["Ferro preverniciato", "Alluminio"];

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>🔩 Listino Lamiere</div>
        <div style={{ display: "flex", gap: 6 }}>
          {lamiere.length > 0 && <div onClick={exportCSV} style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${PRI}`, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>📤 Esporta</div>}
          {tipi.map(t => (
            <div key={t} onClick={() => addLamiera(t)}
              style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              + {t === "Ferro preverniciato" ? "Ferro" : "Alluminio"}
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: T.sub, marginBottom: 12, lineHeight: 1.6 }}>
        Per ogni lamiera: prezzo €/kg (peso materiale) + prezzo €/ml per ogni tipo di piega.<br/>
        Aggiungere le pieghe disponibili (es. piega semplice, doppia, bordatura ecc.)
      </div>

      {lamiere.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>
          Nessuna lamiera — clicca + Ferro o + Alluminio
        </div>
      ) : (
        lamiere.map((lam: any) => (
          <div key={lam.id} style={{ border: `1px solid ${T.bdr}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === lam.id ? null : lam.id)}>
              <div style={{ fontSize: 9, fontWeight: 800, color: lam.tipo === "Ferro preverniciato" ? "#8B4513" : "#708090",
                background: lam.tipo === "Ferro preverniciato" ? "#8B451320" : "#70809020",
                padding: "2px 6px", borderRadius: 4 }}>{lam.tipo}</div>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: T.text }}>{lam.nome}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: PRI }}>
                {lam.prezzoKg > 0 ? `€${lam.prezzoKg}/kg` : ""}{lam.prezzoMl > 0 ? ` · €${lam.prezzoMl}/ml` : ""}
              </div>
              <div onClick={e => { e.stopPropagation(); remove(lam.id); }} style={{ color: "#DC4444", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</div>
              <div style={{ fontSize: 10, color: T.sub }}>{expanded === lam.id ? "▲" : "▼"}</div>
            </div>
            {expanded === lam.id && (
              <div style={{ padding: "12px 14px", background: T.bg, borderTop: `1px solid ${T.bdr}` }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Nome</div>
                    <input value={lam.nome} onChange={e => update(lam.id, { nome: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                    <input value={lam.fornitore || ""} placeholder="es. Marcegaglia" onChange={e => update(lam.id, { fornitore: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Spessore (mm)</div>
                    <input value={lam.spessore || ""} placeholder="es. 0.6" onChange={e => update(lam.id, { spessore: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Tipo</div>
                    <select value={lam.tipo} onChange={e => update(lam.id, { tipo: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }}>
                      <option>Ferro preverniciato</option>
                      <option>Alluminio</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo €/kg</div>
                    <input type="number" step="0.01" value={lam.prezzoKg || ""} placeholder="0"
                      onChange={e => update(lam.id, { prezzoKg: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo €/ml base</div>
                    <input type="number" step="0.01" value={lam.prezzoMl || ""} placeholder="0"
                      onChange={e => update(lam.id, { prezzoMl: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                  </div>
                </div>

                {/* Pieghe */}
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                  Pieghe ({lam.pieghe?.length || 0}) — prezzo aggiuntivo €/ml per piega
                </div>
                {(lam.pieghe || []).map((p: any, pi: number) => (
                  <div key={pi} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <input value={p.nome} placeholder="es. Piega semplice"
                      onChange={e => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], nome: e.target.value }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 2, padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                    <input type="number" step="0.01" value={p.prezzoMl || ""} placeholder="€/ml"
                      onChange={e => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], prezzoMl: parseFloat(e.target.value) || 0 }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                    <div style={{ fontSize: 10, color: T.sub, minWidth: 24 }}>€/ml</div>
                    <div onClick={() => update(lam.id, { pieghe: lam.pieghe.filter((_: any, i: number) => i !== pi) })}
                      style={{ color: "#DC4444", cursor: "pointer", fontSize: 14 }}>×</div>
                  </div>
                ))}
                <div onClick={() => update(lam.id, { pieghe: [...(lam.pieghe || []), { nome: "", prezzoMl: 0 }] })}
                  style={{ padding: "6px 12px", borderRadius: 7, border: `1px dashed ${PRI}`, textAlign: "center", fontSize: 10, color: PRI, cursor: "pointer", fontWeight: 700 }}>
                  + Aggiungi piega
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

# Inserisci componente prima di export default
if 'function ListinoSettoreLamiere' not in c:
    insert_marker = 'export default function SettingsPanel()'
    idx = c.find(insert_marker)
    c = c[:idx] + LAMIERE_COMPONENT + c[idx:]
    print("Componente ListinoSettoreLamiere inserito")
else:
    print("ListinoSettoreLamiere già presente")

f = open('components/SettingsPanel.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print("DONE")
