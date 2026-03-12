import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroERP.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca dove viene resa la card commessa con fase/cliente
for i,l in enumerate(lines):
    if ('c.fase' in l or 'cm.fase' in l) and ('card' in l.lower() or 'background' in l or 'borderRadius' in l):
        print(f"R{i+1}: {repr(l[:120])}")
# Cerca onClick che apre CMDetailPanel (setPrevWorkspace o simile)
for i,l in enumerate(lines):
    if 'setPrevWorkspace' in l or 'openCommessa' in l or 'setSelCantiere' in l:
        print(f"R{i+1}: {repr(l[:120])}")
        if i > 10: break
