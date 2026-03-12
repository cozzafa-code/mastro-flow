import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CMDetailPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Cerca dove viene mostrato il badge fase nella card
for i,l in enumerate(lines):
    if 'preventivoInviato' in l and 'badge' in l.lower():
        print(f"R{i+1}: {repr(l[:120])}")
# Cerca anche dove la card mostra stato fattura
for i,l in enumerate(lines):
    if 'hasFattCC' in l or ('fattCC' in l and 'badge' in l.lower()):
        print(f"R{i+1}: {repr(l[:120])}")
# Cerca il punto dove curCC.id === "posa" per vedere il blocco step
for i,l in enumerate(lines):
    if 'curCC.id === "posa"' in l:
        print(f"\nposa a R{i+1}")
        for j in range(i, min(i+20,len(lines))):
            print(j+1, repr(lines[j][:120]))
        break
