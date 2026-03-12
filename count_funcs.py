import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
print(f"Righe totali: {len(lines)}")

# Conta le occorrenze di funzioni React
funcs = [(i+1, l.rstrip()) for i,l in enumerate(lines) if l.startswith('function ') or l.startswith('export default function')]
print(f"\nFunzioni trovate ({len(funcs)}):")
for r,l in funcs:
    print(f"  R{r}: {l[:80]}")
