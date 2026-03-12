import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('components/MastroERP.tsx', encoding='utf-8').readlines()

print("=== R850-880 (creazione commessa) ===")
for i in range(849, 880):
    print(f"R{i+1}: {repr(lines[i][:180])}")

print("\n=== Ricerca clienteId in newCM ===")
for i, l in enumerate(lines):
    if 'clienteId' in l:
        print(f"R{i+1}: {repr(l[:180])}")
