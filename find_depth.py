import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Analizza profondità parentesi tonde, quadre, graffe e JSX tag
# nelle righe 1-517 (componenti nuovi)
# Cerca qualsiasi riga dove la profondità cumulativa scende sotto 0

print("=== Analisi profondità parentesi righe 1-517 ===")
p = 0  # tonde
b = 0  # quadre  
c = 0  # graffe

for i in range(0, 517):
    l = lines[i]
    # Ignora commenti
    stripped = l.strip()
    if stripped.startswith('//'):
        continue
    
    for ch in l:
        if ch == '(': p += 1
        elif ch == ')': p -= 1
        elif ch == '[': b += 1
        elif ch == ']': b -= 1
        elif ch == '{': c += 1
        elif ch == '}': c -= 1
    
    if p < 0 or b < 0 or c < 0:
        print(f"R{i+1} ERRORE p={p} b={b} c={c}: {repr(l[:80])}")
        p = max(p, 0)
        b = max(b, 0)
        c = max(c, 0)

print(f"\nFine analisi: p={p} b={b} c={c}")
if p != 0 or b != 0 or c != 0:
    print("SBILANCIATE!")
else:
    print("OK - parentesi bilanciate")
