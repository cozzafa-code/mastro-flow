import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('lib/pdf-preventivo.ts','r',encoding='utf-8')
lines=f.readlines()
f.close()
print("=== R140-240 ===")
for i,l in enumerate(lines[139:240],140):
    print(i, repr(l[:130]))
