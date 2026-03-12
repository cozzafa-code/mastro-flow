import sys, subprocess
sys.stdout.reconfigure(encoding='utf-8')

# Estrai file stabile
result = subprocess.run(['git', 'show', '727a4d9:components/SettingsPanel.tsx'], capture_output=True)
stable = result.stdout  # bytes

# Converti in testo
stable_text = stable.decode('utf-8')

# Estrai i due nuovi componenti dal file corrente
f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
current = f.read()
f.close()

# I componenti nuovi stanno tra inizio file e 'export default function SettingsPanel'
marker = 'export default function SettingsPanel()'
idx_current = current.find(marker)
new_components = current[:idx_current]  # tutto prima dell'export default

print(f"Componenti nuovi: {len(new_components)} chars, {new_components.count(chr(10))} righe")

# Verifica che ListinoSettore e ListinoSettoreLamiere siano presenti
assert 'function ListinoSettore(' in new_components, "ListinoSettore mancante"
assert 'function ListinoSettoreLamiere(' in new_components, "ListinoSettoreLamiere mancante"

# Rimuovi FF dal file stabile se presente (non deve esserci)
idx_stable = stable_text.find(marker)
stable_body = stable_text[idx_stable:]  # dal export default in poi

# Costruisci il nuovo file: imports/dichiarazioni stabili + nuovi componenti + corpo stabile
# Le prime righe del file stabile (imports) stanno prima di qualsiasi 'function '
# Cerca prima funzione nel file stabile
import re
first_func = re.search(r'^function |^export default function ', stable_text, re.MULTILINE)
imports_section = stable_text[:first_func.start()]

print(f"Import section: {imports_section.count(chr(10))} righe")

# Ora dobbiamo anche aggiungere i listini nelle tab del corpo stabile
# Prima ricostruiamo il file base
new_file = imports_section + new_components + stable_body

# Ora inietta i listini nelle tab (stesso pattern di prima)
patches = [
    ('>+ Aggiungi vetro</div>\n          </>\n        )}',
     '\n            <ListinoSettore titolo="Listino Vetri" emoji="\U0001f4a0" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'),
    ('>+ Aggiungi coprifilo</div>\n          </>\n        )}',
     '\n            <ListinoSettore titolo="Listino Coprifili" emoji="\U0001f4cf" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'),
    ('>+ Aggiungi lamiera</div>\n          </>\n        )}',
     '\n            <ListinoSettoreLamiere T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'),
    ('>+ Aggiungi tipo cassonetto</div>\n          </>\n        )}',
     '\n            <ListinoSettore titolo="Listino Cassonetti e Controtelai" emoji="\U0001f4e6" storageKey="cassonettoListino" T={T} PRI={PRI} FF={FF} />\n          </>\n        )}'),
]

for old, new in patches:
    found = old in new_file
    print(f"Patch {'OK' if found else 'MANCANTE'}: {old[:40]}")
    if found:
        new_file = new_file.replace(old, new, 1)

# Aggiungi FF nel corpo
new_file = new_file.replace(
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n\n  // Aggiungi',
    '  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";\n  const FF = "Inter, system-ui, sans-serif";\n\n  // Aggiungi',
    1
)

# Scrivi
open('components/SettingsPanel.tsx', 'w', encoding='utf-8').write(new_file)
print(f"\nFile scritto: {new_file.count(chr(10))} righe totali")
print("DONE")
