import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CMDetailPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca dove viene mostrata la lista commesse con card
for i,l in enumerate(lines):
    if 'c.code' in l and 'map' in l:
        print(f"R{i+1}: {repr(l[:120])}")
# Cerca card commessa nella lista
for i,l in enumerate(lines):
    if ('commesse.map' in l or 'cantieri.map' in l or 'filteredCM' in l) and i < 2800:
        print(f"R{i+1}: {repr(l[:120])}")
