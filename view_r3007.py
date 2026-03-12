import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CMDetailPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
print("=== intorno R3007 ===")
for i,l in enumerate(lines[3000:3025],3001):
    print(i, repr(l[:130]))

# Cerca l'header commessa (dove si vede fase, nome cliente ecc)
print("\n=== Cerca header con fase badge ===")
for i,l in enumerate(lines):
    if 'c.fase' in l and ('badge' in l.lower() or 'chip' in l.lower() or 'pill' in l.lower()):
        print(f"R{i+1}: {repr(l[:120])}")
        break
# Cerca dove viene mostrato il nome commessa nell'header
for i,l in enumerate(lines):
    if 'c.code' in l and 'fontSize' in l and i < 200:
        print(f"R{i+1} header: {repr(l[:120])}")
