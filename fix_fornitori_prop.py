import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# Fix 1: aggiunge fornitori e setFornitori alla firma del componente
c = c.replace(
    'function ListinoSettore({ titolo, emoji, storageKey, T, PRI, FF }: any)',
    'function ListinoSettore({ titolo, emoji, storageKey, T, PRI, FF, fornitori, setFornitori }: any)'
)

# Fix 2: passa fornitori e setFornitori nelle 3 chiamate
for settore in [
    ('tapparelleListino', 'Tapparelle', '\u2b07\ufe0f'),
    ('zanzariereListino', 'Zanzariere', '\U0001f99f'),
    ('persianeListino', 'Persiane', '\U0001f3e0'),
]:
    old = f'<ListinoSettore titolo="Listino {settore[1]}" emoji="{settore[2]}" storageKey="{settore[0]}" T={{T}} PRI={{PRI}} FF={{FF}} />'
    new = f'<ListinoSettore titolo="Listino {settore[1]}" emoji="{settore[2]}" storageKey="{settore[0]}" T={{T}} PRI={{PRI}} FF={{FF}} fornitori={{fornitori}} setFornitori={{setFornitori}} />'
    found = old in c
    print(f"{settore[1]} found: {found}")
    if found:
        c = c.replace(old, new, 1)

f = open('components/SettingsPanel.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print("DONE")
