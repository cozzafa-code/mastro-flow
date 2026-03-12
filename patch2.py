import sys
sys.stdout.reconfigure(encoding='utf-8')

f = open('components/SettingsPanel.tsx', 'r', encoding='utf-8')
c = f.read()
f.close()

LISTINO_TAPP = '\n            <ListinoSettore titolo="Listino Tapparelle" emoji="\u2b07\ufe0f" storageKey="tapparelleListino" T={T} PRI={PRI} FF={FF} />\n'
LISTINO_ZANZ = '\n            <ListinoSettore titolo="Listino Zanzariere" emoji="\U0001f99f" storageKey="zanzariereListino" T={T} PRI={PRI} FF={FF} />\n'
LISTINO_PERS = '\n            <ListinoSettore titolo="Listino Persiane" emoji="\U0001f3e0" storageKey="persianeListino" T={T} PRI={PRI} FF={FF} />\n'

# Tapparella
old1 = '>+ Aggiungi tipo misura</div>\n          </>\n        )}\n\n        {settingsTab === "zanzariera"'
new1 = '>+ Aggiungi tipo misura</div>' + LISTINO_TAPP + '          </>\n        )}\n\n        {settingsTab === "zanzariera"'
print("tapparella:", old1 in c)
c = c.replace(old1, new1, 1)

# Zanzariera
old2 = '>+ Aggiungi tipo misura</div>\n          </>\n        )}\n\n        {settingsTab === "persiana"'
new2 = '>+ Aggiungi tipo misura</div>' + LISTINO_ZANZ + '          </>\n        )}\n\n        {settingsTab === "persiana"'
print("zanzariera:", old2 in c)
c = c.replace(old2, new2, 1)

# Persiana - cerca fine blocco persiana
old3 = '>+ Aggiungi tipo misura</div>\n          </>\n        )}\n\n        {/* === SALITA'
new3 = '>+ Aggiungi tipo misura</div>' + LISTINO_PERS + '          </>\n        )}\n\n        {/* === SALITA'
print("persiana:", old3 in c)
c = c.replace(old3, new3, 1)

f = open('components/SettingsPanel.tsx', 'w', encoding='utf-8')
f.write(c)
f.close()
print("DONE")
