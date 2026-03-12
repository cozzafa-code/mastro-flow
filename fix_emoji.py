import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

i = 400
print("Prima:", repr(lines[i]))
# Deve essere: <div ...>🔩 Listino Lamiere</div>
lines[i] = lines[i].replace('"🔩" Listino Lamiere', '🔩 Listino Lamiere', 1)
print("Dopo: ", repr(lines[i]))

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.writelines(lines)
f.close()
print("done")
