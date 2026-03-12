import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroERP.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca tutte le occorrenze di setSelectedCM con contesto
for i,l in enumerate(lines):
    if 'setSelectedCM' in l and i > 500 and i < 3000:
        print(f"R{i+1}: {repr(l[:100])}")
