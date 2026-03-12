import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CMDetailPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines[2830:2920],2831):
    print(i, repr(l[:120]))
