import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
tabs = ['cassonetto','controtelaio','vetri','lamiere','coprifili','colori']
for i,l in enumerate(lines,1):
    for t in tabs:
        if f'settingsTab === "{t}"' in l:
            print(f"TAB {t} -> riga {i}")
            # mostra fine blocco (cerca chiusura)
            for j in range(i, min(i+50, len(lines))):
                if lines[j].strip() == ')}\n' or lines[j].strip() == ')}':
                    print(f"  fine a riga {j+1}: {repr(lines[j])}")
                    break
