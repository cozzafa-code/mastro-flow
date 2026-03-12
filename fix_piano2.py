import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

for i,l in enumerate(lines):
    if 'Piano""' in l:
        print(f"Trovato riga {i+1}: {repr(l)}")
        lines[i] = l.replace('Piano""', 'Piano"', 1)
        print("Fixato")

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.writelines(lines)
f.close()
print("done")
