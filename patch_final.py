import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
text = f.read()
f.close()

# 1. Inietta chiamate ListinoSettore nelle tab vetri, coprifili, cassonetto
# e ListinoSettoreLamiere nella tab lamiere
patches = [
    (
        '>+ Aggiungi vetro</div>\n          </>\n        )}',
        '\n            <ListinoSettore titolo="Listino Vetri" emoji="\U0001f4a0" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
    (
        '>+ Aggiungi coprifilo</div>\n          </>\n        )}',
        '\n            <ListinoSettore titolo="Listino Coprifili" emoji="\U0001f4cf" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
    (
        '>+ Aggiungi lamiera</div>\n          </>\n        )}',
        '\n            <ListinoSettoreLamiere T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
    (
        '>+ Aggiungi tipo cassonetto</div>\n          </>\n        )}',
        '\n            <ListinoSettore titolo="Listino Cassonetti e Controtelai" emoji="\U0001f4e6" storageKey="cassonettoListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
]

for old, new in patches:
    found = old in text
    print(f"Patch {'OK' if found else 'MANCANTE'}: {old[:50]}")
    if found:
        text = text.replace(old, new, 1)

# 2. Aggiungi FF dopo PRI15 (dentro SettingsPanel)
if 'const FF = ' not in text:
    text = text.replace(
        '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n',
        '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n  const FF = "Inter, system-ui, sans-serif";\n',
        1
    )
    print("FF aggiunta")

# 3. Aggiungi componente ListinoSettoreLamiere prima di export default
LAMIERE = '''
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
    id: Date.now().toString(), nome: "Nuova lamiera", tipo,
    fornitore: "", spessore: "", prezzoKg: 0, prezzoMl: 0, pieghe: []
  }]);
  const update = (id: string, upd: any) => save(lamiere.map((lm: any) => lm.id === id ? { ...lm, ...upd } : lm));
  const remove = (id: string) => save(lamiere.filter((lm: any) => lm.id !== id));

  const exportCSV = () => {
    let rows = ["Tipo;Nome;Fornitore;Spessore(mm);Euro/kg;Euro/ml base;Piega;Euro/ml piega"];
    lamiere.forEach((lm: any) => {
      if (lm.pieghe && lm.pieghe.length > 0) {
        lm.pieghe.forEach((pg: any) => {
          rows.push([lm.tipo,lm.nome,lm.fornitore||"",lm.spessore||"",lm.prezzoKg||0,lm.prezzoMl||0,pg.nome,pg.prezzoMl].join(";"));
        });
      } else {
        rows.push([lm.tipo,lm.nome,lm.fornitore||"",lm.spessore||"",lm.prezzoKg||0,lm.prezzoMl||0,"",""].join(";"));
      }
    });
    const blob = new Blob([rows.join("\\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "listino_lamiere.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{"\\u{1F527}"} Listino Lamiere</div>
        <div style={{ display: "flex", gap: 6 }}>
          {lamiere.length > 0 && <div onClick={exportCSV} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid " + PRI, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Esporta</div>}
          {["Ferro preverniciato", "Alluminio"].map((t: string) => (
            <div key={t} onClick={() => addLamiera(t)} style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              + {t === "Ferro preverniciato" ? "Ferro" : "Alluminio"}
            </div>
          ))}
        </div>
      </div>
      {lamiere.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>Nessuna lamiera — clicca + Ferro o + Alluminio</div>
      ) : (
        lamiere.map((lam: any) => (
          <div key={lam.id} style={{ border: "1px solid " + T.bdr, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === lam.id ? null : lam.id)}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: T.text }}>{lam.tipo} — {lam.nome}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: PRI }}>
                {lam.prezzoKg > 0 ? "e" + lam.prezzoKg + "/kg" : ""}{lam.prezzoMl > 0 ? " · e" + lam.prezzoMl + "/ml" : ""}
              </div>
              <div onClick={(e: any) => { e.stopPropagation(); remove(lam.id); }} style={{ color: "#DC4444", cursor: "pointer", fontSize: 16 }}>x</div>
              <div style={{ fontSize: 10, color: T.sub }}>{expanded === lam.id ? "A" : "V"}</div>
            </div>
            {expanded === lam.id && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid " + T.bdr }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" as any }}>
                  <div style={{ flex: "1 1 45%" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Nome</div>
                    <input value={lam.nome} onChange={(e: any) => update(lam.id, { nome: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                    <input value={lam.fornitore || ""} placeholder="es. Marcegaglia" onChange={(e: any) => update(lam.id, { fornitore: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Spessore (mm)</div>
                    <input value={lam.spessore || ""} placeholder="es. 0.6" onChange={(e: any) => update(lam.id, { spessore: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%" }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Tipo</div>
                    <select value={lam.tipo} onChange={(e: any) => update(lam.id, { tipo: e.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }}>
                      <option>Ferro preverniciato</option>
                      <option>Alluminio</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo euro/kg</div>
                    <input type="number" step="0.01" value={lam.prezzoKg || ""} placeholder="0"
                      onChange={(e: any) => update(lam.id, { prezzoKg: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo euro/ml base</div>
                    <input type="number" step="0.01" value={lam.prezzoMl || ""} placeholder="0"
                      onChange={(e: any) => update(lam.id, { prezzoMl: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 8 }}>Pieghe — prezzo aggiuntivo euro/ml</div>
                {(lam.pieghe || []).map((pg: any, pi: number) => (
                  <div key={pi} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <input value={pg.nome} placeholder="es. Piega semplice"
                      onChange={(e: any) => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], nome: e.target.value }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 2, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                    <input type="number" step="0.01" value={pg.prezzoMl || ""} placeholder="0"
                      onChange={(e: any) => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], prezzoMl: parseFloat(e.target.value) || 0 }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 11, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                    <div onClick={() => update(lam.id, { pieghe: lam.pieghe.filter((_: any, ii: number) => ii !== pi) })}
                      style={{ color: "#DC4444", cursor: "pointer", fontSize: 14 }}>x</div>
                  </div>
                ))}
                <div onClick={() => update(lam.id, { pieghe: [...(lam.pieghe || []), { nome: "", prezzoMl: 0 }] })}
                  style={{ padding: "6px 12px", borderRadius: 7, border: "1px dashed " + PRI, textAlign: "center" as any, fontSize: 10, color: PRI, cursor: "pointer", fontWeight: 700 }}>
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

if 'function ListinoSettoreLamiere(' not in text:
    marker = 'export default function SettingsPanel()'
    idx = text.find(marker)
    text = text[:idx] + LAMIERE + text[idx:]
    print("ListinoSettoreLamiere inserito")

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print(f"File scritto: {text.count(chr(10))} righe")
print("DONE")
