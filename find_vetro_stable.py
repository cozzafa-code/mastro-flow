import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')
result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
lines = result.stdout.decode('utf-8').splitlines(keepends=True)

# Trova la riga con "Aggiungi vetro"
for i,l in enumerate(lines):
    if 'Aggiungi vetro' in l:
        print(f"\n=== riga {i+1} ===")
        for j in range(max(0,i-2), min(len(lines),i+6)):
            print(j+1, repr(lines[j]))
        break
