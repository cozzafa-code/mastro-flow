import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CMDetailPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines[155:200],156):
    print(i, repr(l[:130]))
