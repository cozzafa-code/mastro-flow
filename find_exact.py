import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Righe 776-786
for i,l in enumerate(lines[775:787],776):
    print(i, repr(l))
