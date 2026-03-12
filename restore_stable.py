import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

# Ripristina file stabile puro
result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
open('components/SettingsPanel.tsx', 'wb').write(result.stdout)
print(f"File stabile ripristinato: {result.stdout.count(b'chr(10)')} bytes")
print("DONE")
