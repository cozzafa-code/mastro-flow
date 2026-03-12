import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/CMDetailPanel.tsx', 'r', encoding='utf-8')
src = f.read()
f.close()

changes = 0

# ── PATCH 1: Badge "📄 Fattura" nell'header del Centro Comando (accanto al badge fase)
# L'header sticky ha: ← | nome/indirizzo | badge €totale
# Aggiungiamo il badge fattura DOPO il div indirizzo (riga ~171), DENTRO il div flex:1
# Cerca il div indirizzo nell'header sticky
OLD1 = '<div style={{ fontSize: 10, color: "#ffffff60" }}>{c.indirizzo || ""}</div>\n            </div>\n            <div style={{ background: T.acc, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>€{pwFmt(pwTotale)}</div>'
NEW1 = '<div style={{ fontSize: 10, color: "#ffffff60" }}>{c.indirizzo || ""}</div>\n            </div>\n            {fattureDB.filter(f => f.cmId === c.id).length > 0 && (\n              <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "#1A9E7330" : "#D0800830", color: fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "#1A9E73" : "#D08008", flexShrink: 0 }}>\n                {fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "✅ Pagata" : "📄 Fattura"}\n              </span>\n            )}\n            <div style={{ background: T.acc, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>€{pwFmt(pwTotale)}</div>'

if OLD1 in src:
    src = src.replace(OLD1, NEW1, 1)
    changes += 1
    print("PATCH 1 OK: badge fattura header workspace")
else:
    print("PATCH 1 SKIP: stringa non trovata (probabile multiriga)")

# ── PATCH 2: Badge "📄 Fattura" nel Centro Comando header (quando NON è nel workspace)
# L'header del CC è il div con background T.topbar (riga ~167 CMDetailPanel)
# In realtà CMDetailPanel mostra il workspace; il CC è in CMDetailPanel stessa
# Il badge fattura nel CC: aggiungiamo accanto al badge "doneCC/stepsCC.length" 
# Riga ~2890: <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>{doneCC}/{stepsCC.length}</span>
OLD2 = '<span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>{doneCC}/{stepsCC.length}</span>'
NEW2 = '<span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>{doneCC}/{stepsCC.length}</span>\n                    {hasFattCC && (\n                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: tuttoCC ? "#1A9E7320" : "#D0800820", color: tuttoCC ? "#1A9E73" : "#D08008", marginLeft: 4 }}>\n                        {tuttoCC ? "✅ Pagata" : "📄 Fatt."}\n                      </span>\n                    )}'

if OLD2 in src:
    src = src.replace(OLD2, NEW2, 1)
    changes += 1
    print("PATCH 2 OK: badge fattura nel CC progress header")
else:
    print("PATCH 2 SKIP: non trovato")

# ── PATCH 3: Avviso "Fattura non pagata" prima di avanzare da conferma
# Nel blocco curCC.id === "conferma" c'è il bottone AVANTI → Conferma ordine
# Aggiungiamo un avviso se hasFattCC ma nessuna fattura pagata
# Cerca il bottone AVANTI nel blocco conferma
OLD3 = 'AVANTI \u2192 Conferma ordine</button>\n                    </div>\n                  )}\n\n                  {/* \u2550\u2550 ORDINI'
NEW3 = 'AVANTI \u2192 Conferma ordine</button>\n                    </div>\n                  )}\n\n                  {/* \u2550\u2550 ORDINI'

# Alternativa: cerca il setFaseTo conferma nel blocco firma
# Al secondo setFaseTo(c.id, "conferma") (riga 2407) aggiungiamo controllo fattura
# Ma e' meglio non bloccare - solo mostrare avviso
# Invece aggiungiamo un banner sotto il totale nel passo conferma se c'e' fattura non pagata

OLD3 = '<div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale: \u20ac{fmtCC(totI'
print(f"\nPATCH 3: cerca '{OLD3[:60]}'")
idx3 = src.find('<div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale:')
if idx3 >= 0:
    print(f"  Trovato a indice {idx3}")
    print(repr(src[idx3:idx3+200]))
else:
    print("  NON trovato")

# Salva
if changes > 0:
    open('components/CMDetailPanel.tsx', 'w', encoding='utf-8').write(src)
    print(f"\n{changes} patch applicate e salvate")
else:
    print("\n0 patch applicate")
