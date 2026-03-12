import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines,1):
    if 'settingsTab === "tapparella"' in l:
        print(f"TROVATO a riga {i}")
        # Mostra righe intorno alla fine del blocco
        for j in range(i-1, min(i+20, len(lines))):
            print(j+1, repr(lines[j]))
        break
