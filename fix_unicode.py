import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

i = 400  # riga 401, 0-indexed
print("Prima:", repr(lines[i][:80]))
lines[i] = lines[i].replace('{"\\u{1F527}"}', '"🔩"', 1)
print("Dopo: ", repr(lines[i][:80]))

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.writelines(lines)
f.close()
print("done")
