import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Cerca pattern problematici
problems = []
for i,l in enumerate(lines):
    # Doppi apici consecutivi
    if '""' in l and 'src=""' not in l and 'placeholder=""' not in l and 'value=""' not in l and 'href=""' not in l:
        problems.append((i+1, 'DOUBLE QUOTE', repr(l[:100])))
    # Template literal spezzato (backtick in stringa normale)
    if l.count('`') % 2 != 0:
        problems.append((i+1, 'ODD BACKTICK', repr(l[:100])))

for row, tipo, text in problems[:30]:
    print(f"R{row} [{tipo}]: {text}")
