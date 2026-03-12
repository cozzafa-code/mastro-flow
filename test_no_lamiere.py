import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
text = result.stdout.decode('utf-8')

# Aggiungi solo FF
text = text.replace(
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n',
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n  const FF = "Inter, system-ui, sans-serif";\n',
    1
)

# Aggiungi solo le 3 chiamate ListinoSettore (senza ListinoSettoreLamiere)
patches = [
    (
        '>+ Aggiungi vetro</div>\n          </>\n        )}',
        '\n            <ListinoSettore titolo="Listino Vetri" emoji="💠" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
    (
        '>+ Aggiungi coprifilo</div>\n          </>\n        )}',
        '\n            <ListinoSettore titolo="Listino Coprifili" emoji="📏" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
    (
        '>+ Aggiungi tipo cassonetto</div>\n          </>\n        )}',
        '\n            <ListinoSettore titolo="Listino Cassonetti" emoji="📦" storageKey="cassonettoListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
    ),
]

for old, new in patches:
    found = old in text
    print(f"{'OK' if found else 'MISS'}: {old[:40]}")
    if found:
        text = text.replace(old, new, 1)

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print(f"Scritto: {text.count(chr(10))} righe")
