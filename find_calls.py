import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines):
    if 'ListinoSettore' in l and 'function' not in l:
        print(i+1, repr(l[:120]))
