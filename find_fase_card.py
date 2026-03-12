import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroERP.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca righe con c.fase e c.code vicine (card commessa)
for i,l in enumerate(lines):
    if 'c.fase' in l and ('borderRadius' in l or 'c.code' in l):
        print(f"R{i+1}: {repr(l[:120])}")
