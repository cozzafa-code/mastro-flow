import sys, re
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/CMDetailPanel.tsx', 'r', encoding='utf-8')
src = f.read()
f.close()

# ── PATCH 1: Badge "📄 Fattura" nell'header sticky (riga ~173)
# Cerca il div con background T.acc (badge fase) e aggiunge badge fattura prima
OLD1 = '            <div style={{ background: T.acc, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, color: "#fff", f'
# Vediamo cosa c'è esattamente su quella riga
idx = src.find('background: T.acc, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, color: "#fff"')
if idx >= 0:
    print(f"Trovato badge fase a indice {idx}")
    print(repr(src[idx-50:idx+150]))
else:
    print("Badge fase NON trovato con questa stringa")
    # Cerca alternativo
    idx2 = src.find('"5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900')
    print(f"Alternativo: {idx2}")
    if idx2 >= 0:
        print(repr(src[idx2-80:idx2+150]))
