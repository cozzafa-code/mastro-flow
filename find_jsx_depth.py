import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Analisi semplice: conta < e > ignorando operatori
# Meglio: cerca righe con pattern problematici specifici di JSX
# Pattern: onClick con arrow function che contiene JSX annidato non chiuso

# Controlla ogni riga per backtick in string literals che potrebbero essere spezzati
print("=== Backtick aperti (conteggio dispari) in range 149-358 ===")
running = 0
for i in range(148, 358):
    l = lines[i]
    # Conta backtick non escaped
    cnt = l.count('`') - l.count('\\`')
    if cnt % 2 != 0:
        running += 1
        print(f"R{i+1} (backtick dispari): {repr(l[:100])}")

print(f"\nTotale righe con backtick dispari: {running}")

# Cerca anche </> senza apertura e <> senza chiusura
print("\n=== Fragment tags ===")
frags_open = 0
for i in range(148, 358):
    l = lines[i]
    frags_open += l.count('<>') - l.count('</>')
    if '<>' in l or '</>' in l:
        print(f"R{i+1} (net={frags_open}): {repr(l[:80])}")
