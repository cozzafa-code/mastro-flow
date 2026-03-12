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

open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(text)
print("FF aggiunta, nessuna patch tab")
print(f"Righe: {text.count(chr(10))}")
