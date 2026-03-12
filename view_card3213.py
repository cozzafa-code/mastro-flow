import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/MastroERP.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines[3170:3290],3171):
    print(i, repr(l[:130]))
