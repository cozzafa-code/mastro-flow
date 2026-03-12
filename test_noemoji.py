import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
text = result.stdout.decode('utf-8')

# Solo FF
text = text.replace(
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n',
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n  const FF = "Inter, system-ui, sans-serif";\n',
    1
)
print("FF:", 'const FF' in text)

# Patch coprifili - senza emoji
old = '>+ Aggiungi coprifilo</div>\n          </>\n        )}'
new = '\n            <ListinoSettore titolo="Listino Coprifili" emoji="box" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
print("coprifili:", old in text)
if old in text:
    text = text.replace(old, new, 1)

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print(f"Scritto: {text.count(chr(10))} righe")
