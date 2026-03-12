import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('components/MastroERP.tsx', encoding='utf-8').readlines()
print(f"Tot righe: {len(lines)}")
for i, l in enumerate(lines):
    if 'newCM' in l and any(k in l for k in ['clienteId', 'cliente:', 'setCantieri', 'addCM', 'push', 'salva', 'save']):
        print(f"R{i+1}: {repr(l[:160])}")
