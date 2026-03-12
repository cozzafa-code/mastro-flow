import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines,1):
    if 'React.useState' in l or '(() => {' in l:
        print(i, l.rstrip())
