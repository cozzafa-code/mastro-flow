import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroContext.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines):
    if 'fattureDB' in l:
        print(f"R{i+1}: {repr(l[:120])}")
