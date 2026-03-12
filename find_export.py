import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Cerca la riga con export default e le 20 righe prima
for i,l in enumerate(lines):
    if 'export default function SettingsPanel' in l:
        print(f"export default a riga {i+1}")
        print("Righe precedenti:")
        for j in range(max(0,i-15), i+3):
            print(j+1, repr(lines[j]))
        break
