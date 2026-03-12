import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

# Estrai file dal commit stabile
result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
lines = result.stdout.decode('utf-8').splitlines(keepends=True)
print(f"Righe nel commit stabile: {len(lines)}")

# Cerca export default
for i,l in enumerate(lines):
    if 'export default function SettingsPanel' in l:
        print(f"export default a riga {i+1}")
        # Mostra prime 65 righe della funzione
        for j in range(i, min(i+65, len(lines))):
            print(j+1, repr(lines[j]))
        break
