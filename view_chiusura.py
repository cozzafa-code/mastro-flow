import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CMDetailPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines):
    if 'curCC.id === "chiusura"' in l:
        print(f"chiusura a riga {i+1}")
        for j in range(i, min(i+80,len(lines))):
            print(j+1, repr(lines[j][:130]))
        break
