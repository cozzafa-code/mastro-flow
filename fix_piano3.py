import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Riga 600 = indice 599
i = 599
print("Prima:", repr(lines[i][:120]))
lines[i] = lines[i].replace('Piano""', 'Piano"', 1)
print("Dopo: ", repr(lines[i][:120]))

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.writelines(lines)
f.close()
print("done")
