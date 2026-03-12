import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/mastro/lib/pdf-generators.ts','r',encoding='utf-8')
lines=f.readlines()
f.close()
print("=== R260-340 ===")
for i,l in enumerate(lines[259:340],260):
    print(i, repr(l[:130]))
