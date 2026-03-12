import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/mastro/lib/pdf-generators.ts','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Vedi righe 180-260 (loop vani nel PDF preventivo)
print("=== R180-260 ===")
for i,l in enumerate(lines[179:260],180):
    print(i, repr(l[:130]))
