import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
print("=== righe 50-70 ===")
for i,l in enumerate(lines[49:72],50):
    print(i, repr(l))
