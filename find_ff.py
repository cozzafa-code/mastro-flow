import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
print("=== righe 518-535 ===")
for i,l in enumerate(lines[517:535],518):
    print(i, repr(l))

# Cerca dove FF viene definita
print("\n=== FF definition ===")
for i,l in enumerate(lines):
    if 'const FF' in l or 'FF =' in l:
        print(i+1, repr(l))
        break

# Cerca tutti i backtick dispari nelle prime 520 righe
print("\n=== backtick dispari righe 1-520 ===")
for i,l in enumerate(lines[:520]):
    if l.count('`') % 2 != 0:
        print(i+1, repr(l[:120]))
