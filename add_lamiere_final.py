import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
text = f.read()
f.close()

# 1. Sostituisce la chiamata ListinoSettore nella tab lamiere con ListinoSettoreLamiere
old_call = '            <ListinoSettore titolo="Listino Lamiere" emoji="lamiere" storageKey="lamiereListino" T={T} PRI={PRI} FF={FF} />'
new_call = '            <ListinoSettoreLamiere T={T} PRI={PRI} FF={FF} />'
if old_call in text:
    text = text.replace(old_call, new_call, 1)
    print("Chiamata lamiere sostituita")
else:
    print("MISS chiamata lamiere")

# 2. Inserisce componente ListinoSettoreLamiere prima di export default
LAMIERE = r'''
// --- ListinoSettoreLamiere ---
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
    const rows: string[] = ["Tipo;Nome;Fornitore;Spessore;Euro/kg;Euro/ml;Piega;Euro/ml piega"];
    lamiere.forEach((lm: any) => {
      if (lm.pieghe && lm.pieghe.length > 0) {
        lm.pieghe.forEach((pg: any) => {
          rows.push([lm.tipo, lm.nome, lm.fornitore||"", lm.spessore||"", lm.prezzoKg||0, lm.prezzoMl||0, pg.nome, pg.prezzoMl].join(";"));
        });
      } else {
        rows.push([lm.tipo, lm.nome, lm.fornitore||"", lm.spessore||"", lm.prezzoKg||0, lm.prezzoMl||0, "", ""].join(";"));
      }
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "listino_lamiere.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Listino Lamiere</div>
        <div style={{ display: "flex", gap: 6 }}>
          {lamiere.length > 0 && (
            <div onClick={exportCSV} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid " + PRI, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Esporta</div>
          )}
          {["Ferro preverniciato", "Alluminio"].map((tipo: string) => (
            <div key={tipo} onClick={() => addLamiera(tipo)} style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              + {tipo === "Ferro preverniciato" ? "Ferro" : "Alluminio"}
            </div>
          ))}
        </div>
      </div>
      {lamiere.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>Nessuna lamiera aggiunta</div>
      ) : (
        lamiere.map((lam: any) => (
          <div key={lam.id} style={{ border: "1px solid " + T.bdr, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === lam.id ? null : lam.id)}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: T.text }}>{lam.tipo} - {lam.nome}</div>
              <div style={{ fontSize: 10, color: PRI, fontWeight: 800 }}>
                {lam.prezzoKg > 0 ? (lam.prezzoKg + " e/kg") : ""}{lam.prezzoMl > 0 ? (" / " + lam.prezzoMl + " e/ml") : ""}
              </div>
              <div onClick={(ev: any) => { ev.stopPropagation(); remove(lam.id); }} style={{ color: "#DC4444", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>x</div>
            </div>
            {expanded === lam.id && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid " + T.bdr }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" as any }}>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Nome</div>
                    <input value={lam.nome} onChange={(ev: any) => update(lam.id, { nome: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                    <input value={lam.fornitore || ""} placeholder="es. Marcegaglia"
                      onChange={(ev: any) => update(lam.id, { fornitore: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Spessore (mm)</div>
                    <input value={lam.spessore || ""} placeholder="es. 0.6"
                      onChange={(ev: any) => update(lam.id, { spessore: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Tipo</div>
                    <select value={lam.tipo} onChange={(ev: any) => update(lam.id, { tipo: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }}>
                      <option>Ferro preverniciato</option>
                      <option>Alluminio</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo euro/kg</div>
                    <input type="number" step="0.01" value={lam.prezzoKg || ""}
                      onChange={(ev: any) => update(lam.id, { prezzoKg: parseFloat(ev.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo euro/ml base</div>
                    <input type="number" step="0.01" value={lam.prezzoMl || ""}
                      onChange={(ev: any) => update(lam.id, { prezzoMl: parseFloat(ev.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 8 }}>Pieghe - prezzo aggiuntivo euro/ml</div>
                {(lam.pieghe || []).map((pg: any, pi: number) => (
                  <div key={pi} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <input value={pg.nome} placeholder="es. Piega semplice"
                      onChange={(ev: any) => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], nome: ev.target.value }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 2, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                    <input type="number" step="0.01" value={pg.prezzoMl || ""}
                      onChange={(ev: any) => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], prezzoMl: parseFloat(ev.target.value) || 0 }; update(lam.id, { pieghe: pp }); }}
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
// --- fine ListinoSettoreLamiere ---

'''

marker = 'export default function SettingsPanel()'
if 'function ListinoSettoreLamiere(' not in text:
    idx = text.find(marker)
    text = text[:idx] + LAMIERE + text[idx:]
    print("ListinoSettoreLamiere inserito")

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print(f"File scritto: {text.count(chr(10))} righe")
