import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/CMDetailPanel.tsx', 'r', encoding='utf-8')
src = f.read()
f.close()

# Aggiunge avviso "Fattura acconto non pagata" nel passo conferma, dopo il totale
OLD = '<div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale: \u20ac{fmtCC(totIvaCC)} (IVA {ivaPercCC}% incl.)</div>'
NEW = '''<div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale: \u20ac{fmtCC(totIvaCC)} (IVA {ivaPercCC}% incl.)</div>
                      {hasFattCC && !fattCC.every(f => f.pagata) && (
                        <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#D0800815", border: "1px solid #D0800830", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13 }}>📄</span>
                          <span style={{ fontSize: 11, color: "#D08008", fontWeight: 600 }}>Fattura acconto emessa — verifica pagamento in Contabilit\u00e0</span>
                        </div>
                      )}'''

if OLD in src:
    src = src.replace(OLD, NEW, 1)
    open('components/CMDetailPanel.tsx', 'w', encoding='utf-8').write(src)
    print("PATCH 3 OK: avviso fattura acconto nel passo conferma")
else:
    print("PATCH 3 SKIP: stringa non trovata")
    idx = src.find('Totale: \u20ac{fmtCC(totIvaCC)}')
    if idx >= 0:
        print("Trovato alternativo:", repr(src[idx-50:idx+100]))
