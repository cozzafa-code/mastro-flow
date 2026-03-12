import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

# Ripristina stabile
result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
text = result.stdout.decode('utf-8')
print(f"File stabile: {text.count(chr(10))} righe")

# Verifica cosa c'è già nel file stabile
print("ListinoSettore:", "function ListinoSettore(" in text)
print("ListinoSettoreLamiere:", "function ListinoSettoreLamiere(" in text)

# Controlla quali tab hanno già il listino
tabs_check = ['vetriListino', 'coprifiliListino', 'lamiereListino', 'cassonettoListino']
for t in tabs_check:
    print(f"  {t}: {'presente' if t in text else 'MANCANTE'}")
