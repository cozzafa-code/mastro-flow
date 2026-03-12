import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Trova inizio e fine di ListinoSettoreLamiere
start = end = None
for i,l in enumerate(lines):
    if 'function ListinoSettoreLamiere(' in l:
        start = i
    if start and i > start and l.strip() == '}' and end is None:
        # Controlla se è la chiusura della funzione (livello 0)
        end = i
        break

print(f"ListinoSettoreLamiere: righe {start+1}-{end+1}")

# Analizza parentesi graffe
p = c = 0
for i in range(start, end+1):
    for ch in lines[i]:
        if ch == '{': c += 1
        elif ch == '}': c -= 1
        if ch == '(': p += 1
        elif ch == ')': p -= 1

print(f"Fine: p={p} c={c}")

# Cerca il pattern \u escape che ho usato
for i in range(start, end+1):
    if r'\u{' in lines[i] or 'u{1F' in lines[i]:
        print(f"Unicode escape R{i+1}: {repr(lines[i][:80])}")
    if '\\n' in lines[i] and 'rows.join' in lines[i]:
        print(f"Escaped newline R{i+1}: {repr(lines[i][:80])}")
