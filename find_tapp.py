import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines,1):
    if 'tapparella' in l.lower() and ('settingstab' in l.lower() or 'tab ===' in l.lower()):
        print(i, l.rstrip())
