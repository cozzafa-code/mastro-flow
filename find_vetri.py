import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
for i,l in enumerate(lines):
    if 'vetriListino' in l:
        print(f"\n=== riga {i+1} ===")
        for j in range(max(0,i-3), min(len(lines),i+4)):
            print(j+1, repr(lines[j]))
