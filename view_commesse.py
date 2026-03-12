import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/CommessePanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines[20:150],21):
    print(i, repr(l[:130]))
