import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Cerca })() dopo ogni IIFE
targets = [1609, 1845, 1919]
for t in targets:
    print(f"\n--- IIFE a riga {t} ---")
    # Mostra 3 righe di contesto
    for i in range(t-1, min(t+3, len(lines))):
        print(i+1, lines[i].rstrip())
    # Cerca la chiusura })()
    for i in range(t, min(t+300, len(lines))):
        if '})()' in lines[i]:
            print(f"  -> chiude a riga {i+1}: {lines[i].rstrip()}")
            break
