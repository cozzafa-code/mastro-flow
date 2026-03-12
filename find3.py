import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Mostra righe 740-850
for i,l in enumerate(lines[739:900],740):
    print(i, l.rstrip())
