import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
old = '{ id: "piano", l: "💎 Piano"" }'
new = '{ id: "piano", l: "💎 Piano" }'
for i,l in enumerate(lines):
    if old in l:
        print(f"Trovato riga {i+1}")
        lines[i] = l.replace(old, new, 1)
        print("Fixato")
        break
f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.writelines(lines)
f.close()
print("done")
