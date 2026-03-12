import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines,1):
    if 'ListinoSettore' in l:
        print(i, repr(l))
