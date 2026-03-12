import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Trova inizio blocco IIFE listini
start_marker = '        {/* === LISTINI === */}\n        {settingsTab === "listini" && (() => {'
# Trova fine blocco - })()}
end_marker = '        })()}'

start_idx = c.find(start_marker)
end_idx = c.find(end_marker, start_idx) + len(end_marker)

print(f"Start: {start_idx}, End: {end_idx}")

if start_idx == -1 or end_idx <= start_idx:
    print("MARKERS NOT FOUND")
    sys.exit(1)

# Blocco da inserire PRIMA di export default function SettingsPanel
listini_component = '''
// ─── ListiniPanel (estratto per evitare hooks in IIFE) ───────────────────────
function AddGrigliaRow({ prod, onUpdate, PRI, T, FF }: any) {
  const [nl, setNl] = React.useState("");
  const [nh, setNh] = React.useState("");
  const [np, setNp] = React.useState("");
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
      <input type="number" value={nl} onChange={e => setNl(e.target.value)} placeholder="L mm"
        style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF }} />
      <input type="number" value={nh} onChange={e => setNh(e.target.value)} placeholder="H mm"
        style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF }} />
      <input type="number" value={np} onChange={e => setNp(e.target.value)} placeholder="€"
        style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF }} />
      <div onClick={() => {
        if (!nl || !nh || !np) return;
        const ng = [...(prod.griglia || []), { l: parseInt(nl), h: parseInt(nh), prezzo: parseFloat(np.replace(",", ".")) }]
          .sort((a: any, b: any) => a.l - b.l || a.h - b.h);
        onUpdate({ griglia: ng }); setNl(""); setNh(""); setNp("");
      }} style={{ padding: "6px 10px", borderRadius: 6, background: PRI, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Riga</div>
    </div>
  );
}

function ListiniPanel({ ctx, T, S, PRI, PRI08 }: any) {
  const FF = "Inter, sans-serif";
  const [listinoTab, setListinoTab] = React.useState("tapparelle");
  const [expandedProd, setExpandedProd] = React.useState<string|null>(null);
  const { settoriAttivi, aziendaInfo, setAziendaInfo } = ctx;
  const az = aziendaInfo || {};
  const updAz = (upd: any) => setAziendaInfo((prev: any) => ({ ...prev, ...upd }));

  const ProdottoCard = ({ prod, onUpdate, onDelete }: any) => {
    const isOpen = expandedProd === prod.id;
    return (
      <div style={{ border: `1px solid ${T.bdr}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
          onClick={() => setExpandedProd(isOpen ? null : prod.id)}>
          <div style={{ flex: 1 }}>
            <input value={prod.nome} onChange={e => { e.stopPropagation(); onUpdate({ nome: e.target.value }); }}
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 12, fontWeight: 700, color: T.text, background: "transparent", border: "none", outline: "none", width: "100%" }}
              placeholder="Nome prodotto (es: PVC Avvolgibile)" />
          </div>
          <div style={{ fontSize: 11, fontWeight: 800, color: PRI }}>
            {prod.griglia?.length > 0 ? `Griglia ${prod.griglia.length} prezzi` : prod.euroMq > 0 ? `€${prod.euroMq}/mq` : "Nessun prezzo"}
          </div>
          <div onClick={e => { e.stopPropagation(); onDelete(); }} style={{ color: "#DC4444", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</div>
          <div style={{ fontSize: 10, color: T.sub }}>{isOpen ? "▲" : "▼"}</div>
        </div>
        {isOpen && (
          <div style={{ padding: "12px 14px", background: T.bg, borderTop: `1px solid ${T.bdr}` }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: T.sub, marginBottom: 4 }}>€/mq (usato se no griglia)</div>
                <input type="number" value={prod.euroMq || ""} placeholder="0" onChange={e => onUpdate({ euroMq: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: T.sub, marginBottom: 4 }}>Minimo fatturazione (mq)</div>
                <input type="number" step="0.1" value={prod.minimoMq || ""} placeholder="0" onChange={e => onUpdate({ minimoMq: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" }} />
              </div>
            </div>
            {prod.minimoMq > 0 && (
              <div style={{ fontSize: 9, color: PRI, marginBottom: 8 }}>
                ✓ Minimo {prod.minimoMq} mq — sotto questa soglia si fattura comunque {prod.minimoMq} mq
              </div>
            )}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 6 }}>
              Griglia L×H ({prod.griglia?.length || 0} prezzi)
              <span style={{ fontSize: 9, color: T.sub, fontWeight: 400, marginLeft: 6 }}>Se compilata, ha priorità su €/mq</span>
            </div>
            {prod.griglia?.length > 0 && (
              <div style={{ overflowX: "auto", marginBottom: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                  <thead>
                    <tr style={{ background: T.card }}>
                      <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 700 }}>L (mm)</th>
                      <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 700 }}>H (mm)</th>
                      <th style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>€</th>
                      <th style={{ width: 24 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {prod.griglia.map((g: any, gi: number) => (
                      <tr key={gi} style={{ borderBottom: `1px solid ${T.bdr}20` }}>
                        <td style={{ padding: "3px 8px" }}>{g.l}</td>
                        <td style={{ padding: "3px 8px" }}>{g.h}</td>
                        <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700, color: PRI }}>€{g.prezzo}</td>
                        <td><div onClick={() => onUpdate({ griglia: prod.griglia.filter((_: any, i: number) => i !== gi) })}
                          style={{ color: "#DC4444", cursor: "pointer", fontSize: 12, textAlign: "center" }}>×</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <AddGrigliaRow prod={prod} onUpdate={onUpdate} PRI={PRI} T={T} FF={FF} />
            <div style={{ marginTop: 8, position: "relative" }}>
              <input type="file" accept=".csv,.txt" style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }}
                onChange={e => {
                  const file = e.target.files?.[0]; if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const text = ev.target?.result as string;
                    const rows = text.split("\\n").map(r => r.split(/[;,\\t]/));
                    const ng = rows.filter(r => r.length >= 3 && !isNaN(parseFloat(r[0]))).map(r => ({ l: parseInt(r[0]), h: parseInt(r[1]), prezzo: parseFloat(r[2].replace(",", ".")) })).sort((a, b) => a.l - b.l || a.h - b.h);
                    if (ng.length > 0) { onUpdate({ griglia: ng }); alert(`✅ ${ng.length} prezzi importati`); }
                  };
                  reader.readAsText(file);
                }} />
              <div style={{ padding: "6px 10px", borderRadius: 6, border: `1px dashed ${PRI}`, background: PRI + "08", textAlign: "center", fontSize: 10, color: PRI, cursor: "pointer" }}>
                📂 Importa CSV griglia (L;H;Prezzo)
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SETTORI_LISTINO = [
    { id: "tapparelle", label: "⬇ Tapparelle", db: ctx.tapparelleListino || [], set: ctx.setTapparelleListino, attivo: settoriAttivi?.includes("tapparelle") },
    { id: "persiane", label: "🏠 Persiane", db: ctx.persianeListino || [], set: ctx.setPersianeListino, attivo: settoriAttivi?.includes("persiane") },
    { id: "zanzariere", label: "🦟 Zanzariere", db: ctx.zanzariereListino || [], set: ctx.setZanzariereListino, attivo: settoriAttivi?.includes("zanzariere") },
    { id: "tende", label: "☀️ Tende da sole", db: ctx.tendeListino || [], set: ctx.setTendeListino, attivo: settoriAttivi?.includes("tende") },
    { id: "pergole", label: "🏗 Pergole", db: ctx.pergoleListino || [], set: ctx.setPergoleListino, attivo: settoriAttivi?.includes("strutture") },
  ].filter(s => s.attivo);

  const curSettore = SETTORI_LISTINO.find(s => s.id === listinoTab) || SETTORI_LISTINO[0];

  return (
    <div>
      <div style={{ background: PRI, borderRadius: 12, padding: "14px 16px", color: "#fff", marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 900 }}>💰 Listini per Settore</div>
        <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>€/mq + minimo fatturazione + griglia L×H per ogni prodotto</div>
      </div>
      {SETTORI_LISTINO.length > 0 ? (
        <>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 12, paddingBottom: 2 }}>
            {SETTORI_LISTINO.map(s => (
              <div key={s.id} onClick={() => setListinoTab(s.id)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  background: listinoTab === s.id ? PRI : T.card, color: listinoTab === s.id ? "#fff" : T.sub,
                  border: `1px solid ${listinoTab === s.id ? PRI : T.bdr}` }}>
                {s.label} {s.db.length > 0 && <span style={{ fontSize: 9, opacity: 0.8 }}>({s.db.length})</span>}
              </div>
            ))}
          </div>
          {curSettore && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{curSettore.label}</div>
                <div onClick={() => curSettore.set((p: any[]) => [...(p||[]), { id: Date.now().toString(), nome: "Nuovo prodotto", euroMq: 0, minimoMq: 0, griglia: [] }])}
                  style={{ padding: "6px 12px", borderRadius: 8, background: PRI, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Prodotto</div>
              </div>
              {(curSettore.db || []).map((prod: any) => (
                <ProdottoCard key={prod.id} prod={prod}
                  onUpdate={(upd: any) => curSettore.set((p: any[]) => (p||[]).map(x => x.id === prod.id ? { ...x, ...upd } : x))}
                  onDelete={() => curSettore.set((p: any[]) => (p||[]).filter(x => x.id !== prod.id))} />
              ))}
              {(!curSettore.db || curSettore.db.length === 0) && (
                <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>
                  Nessun prodotto — clicca + Prodotto per aggiungere
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>
          Nessun settore attivo con listino. Attiva i settori in Impostazioni → Settori.
        </div>
      )}

      {/* Accessori globali */}
      <div style={{ marginTop: 16, padding: "14px 16px", background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 12 }}>Accessori finestra</div>
        <div style={{ fontSize: 9, color: T.sub, marginBottom: 10 }}>Calcolati automaticamente in base alle misure del vano</div>
        {[
          { label: "Tapparella", sub: "Calcolata su superficie tapparella", key: "prezzoTapparella", unit: "€/mq" },
          { label: "Persiana", sub: "Calcolata su superficie persiana", key: "prezzoPersiana", unit: "€/mq" },
          { label: "Zanzariera", sub: "Calcolata su superficie zanzariera", key: "prezzoZanzariera", unit: "€/mq" },
          { label: "Controtelaio", sub: "Aggiunto per vano con controtelaio ≠ Nessuno", key: "prezzoControtelaio", unit: "€/cad" },
        ].map(({ label, sub, key, unit }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
              <div style={{ fontSize: 9, color: T.sub }}>{sub}</div>
            </div>
            <input type="number" value={(az as any)[key] || ""} placeholder="0"
              onChange={e => updAz({ [key]: parseFloat(e.target.value) || 0 })}
              style={{ width: 80, padding: "8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" }} />
            <div style={{ fontSize: 10, color: T.sub, marginLeft: 6, width: 36 }}>{unit}</div>
          </div>
        ))}
      </div>

      {/* Posa e smaltimento */}
      <div style={{ marginTop: 12, padding: "14px 16px", background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 12 }}>Posa e smaltimento</div>
        {[
          { label: "Posa per vano", sub: "Moltiplicato per numero pezzi", key: "prezzoPosaVano", unit: "€/vano" },
          { label: "Smaltimento infisso", sub: "Rimozione e smaltimento vecchio infisso", key: "prezzoSmaltimento", unit: "€/vano" },
        ].map(({ label, sub, key, unit }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{label}</div>
              <div style={{ fontSize: 9, color: T.sub }}>{sub}</div>
            </div>
            <input type="number" value={(az as any)[key] || ""} placeholder="0"
              onChange={e => updAz({ [key]: parseFloat(e.target.value) || 0 })}
              style={{ width: 80, padding: "8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" }} />
            <div style={{ fontSize: 10, color: T.sub, marginLeft: 6, width: 36 }}>{unit}</div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Includi posa nel preventivo</div>
            <div style={{ fontSize: 9, color: T.sub }}>Se attivo, la posa viene aggiunta automaticamente al totale</div>
          </div>
          <div onClick={() => updAz({ includePosaInPreventivo: !az.includePosaInPreventivo })}
            style={{ width: 44, height: 24, borderRadius: 12, background: az.includePosaInPreventivo ? PRI : T.bdr, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute", top: 3, left: az.includePosaInPreventivo ? 23 : 3, transition: "left 0.2s" }} />
          </div>
        </div>
      </div>

      {/* Sconto globale */}
      <div style={{ marginTop: 12, padding: "14px 16px", background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}` }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 4 }}>Sconto / maggiorazione globale</div>
        <div style={{ fontSize: 9, color: T.sub, marginBottom: 10 }}>Applicato su tutti i sistemi che usano €/mq (non sulle griglie L×H)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" step="0.5" value={az.scontoGlobale || ""} placeholder="0"
            onChange={e => updAz({ scontoGlobale: parseFloat(e.target.value) || 0 })}
            style={{ width: 80, padding: "8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" }} />
          <div style={{ fontSize: 11, color: T.sub }}>% (negativo = sconto, positivo = maggiorazione)</div>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

'''

# Sostituisci il blocco IIFE con chiamata al componente
replacement = '        {/* === LISTINI === */}\n        {settingsTab === "listini" && <ListiniPanel ctx={ctx} T={T} S={S} PRI={PRI} PRI08={PRI08} />}'
c = c[:start_idx] + replacement + c[end_idx:]

# Inserisci il componente ListiniPanel prima di "export default function SettingsPanel"
insert_marker = 'export default function SettingsPanel()'
insert_idx = c.find(insert_marker)
if insert_idx == -1:
    print("CANNOT FIND export default function SettingsPanel()")
    sys.exit(1)

c = c[:insert_idx] + listini_component + c[insert_idx:]

f = open('components/SettingsPanel.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print("DONE - ListiniPanel estratto come componente separato")
