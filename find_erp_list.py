import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroERP.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca onClick che apre una commessa (setCurCantiere o simile)
for i,l in enumerate(lines):
    if ('setCurCantiere' in l or 'setSelCm' in l or 'setPrevWorkspace(true)' in l or 'onClick.*cantiere' in l) and i > 1000:
        print(f"R{i+1}: {repr(l[:120])}")
# Cerca la card con c.cliente e c.fase insieme
for i,l in enumerate(lines):
    if 'c.cliente' in l and ('c.fase' in l or 'faseLabel' in l or 'progCC' in l):
        print(f"R{i+1} cliente+fase: {repr(l[:120])}")
