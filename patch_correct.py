import sys, subprocess, re
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
text = result.stdout.decode('utf-8')

# FF
text = text.replace(
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n',
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n  const FF = "Inter, system-ui, sans-serif";\n',
    1
)

def patch_tab(txt, search_str, listino_tag):
    # Trova la riga con search_str e inserisce listino_tag prima di </> sulla riga successiva
    lines = txt.splitlines(keepends=True)
    for i,l in enumerate(lines):
        if search_str in l:
            # Trova la riga con '</>' dopo questa
            for j in range(i+1, min(i+4, len(lines))):
                if lines[j].strip() == '</>':
                    lines.insert(j, listino_tag + '\n')
                    print(f"  Inserito dopo riga {i+1}, prima di </> a riga {j+1}")
                    return ''.join(lines)
    print(f"  NON TROVATO: {search_str}")
    return txt

patches = [
    ('Aggiungi vetro',
     '            <ListinoSettore titolo="Listino Vetri" emoji="vetri" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />'),
    ('Aggiungi coprifilo',
     '            <ListinoSettore titolo="Listino Coprifili" emoji="coprifili" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />'),
    ('Aggiungi lamiera',
     '            <ListinoSettore titolo="Listino Lamiere" emoji="lamiere" storageKey="lamiereListino" T={T} PRI={PRI} FF={FF} />'),
    ('Aggiungi tipo cassonetto',
     '            <ListinoSettore titolo="Listino Cassonetti" emoji="cassonetti" storageKey="cassonettoListino" T={T} PRI={PRI} FF={FF} />'),
]

for search, tag in patches:
    print(f"Patch: {search}")
    text = patch_tab(text, search, tag)

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print(f"\nFile scritto: {text.count(chr(10))} righe")
