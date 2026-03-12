import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroERP.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca il map delle commesse nella lista (ERP panel)
for i,l in enumerate(lines):
    if 'cantieri.map' in l and 'key' in l and i > 2000:
        print(f"\n=== cantieri.map a R{i+1} ===")
        for j in range(i, min(i+60, len(lines))):
            print(j+1, repr(lines[j][:130]))
        break
