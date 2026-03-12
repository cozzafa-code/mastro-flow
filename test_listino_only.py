import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

# Ripristina stabile
result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
text = result.stdout.decode('utf-8')

# Prendi ListinoSettore dal file precedente (sessione 3)
# Lo ricreiamo minimale senza problemi noti
LISTINO_COMPONENT = r'''
// ─── ListinoSettore ───────────────────────────────────────────────────────────
function ListinoSettore({ titolo, emoji, storageKey, T, PRI, FF }: any) {
  const [listino, setListino] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("mastro_listino_" + storageKey) || "[]"); } catch { return []; }
  });

  const save = (next: any[]) => {
    setListino(next);
    try { localStorage.setItem("mastro_listino_" + storageKey, JSON.stringify(next)); } catch {}
  };

  const addProd = () => save([...listino, { id: Date.now().toString(), nome: "Nuovo prodotto", fornitore: "", euroMq: 0, minimoMq: 0, griglia: [] }]);
  const removeProd = (id: string) => save(listino.filter((p: any) => p.id !== id));
  const updateProd = (id: string, upd: any) => save(listino.map((p: any) => p.id === id ? { ...p, ...upd } : p));

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{emoji} {titolo}</div>
        <div onClick={addProd} style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>+ Aggiungi</div>
      </div>
      {listino.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>Nessun prodotto nel listino</div>
      ) : (
        listino.map((prod: any) => (
          <div key={prod.id} style={{ border: "1px solid " + T.bdr, borderRadius: 8, padding: "10px 12px", marginBottom: 6, background: T.card }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input value={prod.nome} onChange={e => updateProd(prod.id, { nome: e.target.value })}
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.bg, color: T.text }} />
              <input value={prod.fornitore || ""} placeholder="Fornitore" onChange={e => updateProd(prod.id, { fornitore: e.target.value })}
                style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.bg, color: T.text }} />
              <input type="number" value={prod.euroMq || ""} placeholder="€/mq" onChange={e => updateProd(prod.id, { euroMq: parseFloat(e.target.value) || 0 })}
                style={{ width: 70, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, textAlign: "right", background: T.bg, color: T.text }} />
              <div onClick={() => removeProd(prod.id)} style={{ color: "#DC4444", cursor: "pointer", fontSize: 16 }}>x</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

'''

marker = 'export default function SettingsPanel()'
idx = text.find(marker)
new_text = text[:idx] + LISTINO_COMPONENT + text[idx:]

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(new_text)
print(f"File scritto: {new_text.count(chr(10))} righe")
print("DONE")
