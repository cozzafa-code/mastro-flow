import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
text = result.stdout.decode('utf-8')

text = text.replace(
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n',
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n  const FF = "Inter, system-ui, sans-serif";\n',
    1
)

# Patch vetri
old = '>+ Aggiungi vetro</div>\n          </>\n        )}'
new = '\n            <ListinoSettore titolo="Listino Vetri" emoji="vetri" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'
if old in text:
    text = text.replace(old, new, 1)
    print("vetri: OK")
else:
    print("vetri: MISS")

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print(f"Righe: {text.count(chr(10))}")
