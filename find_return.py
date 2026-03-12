import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Conta parentesi graffe aperte/chiuse dal primo return fino alla fine della funzione ListinoSettore
# ListinoSettore va da riga 16 a ~362
start = 15  # 0-indexed
end = 362

depth = 0
in_return = False
return_start = None

for i in range(start, end):
    l = lines[i]
    if '  return (' in l and not in_return:
        in_return = True
        return_start = i+1
        depth = 0
    if in_return:
        depth += l.count('<div') + l.count('<>') + l.count('<span') + l.count('<input') + l.count('<select') + l.count('<option') + l.count('<label')
        depth -= l.count('</div>') + l.count('</>') + l.count('</span>') + l.count('</select>') + l.count('</option>') + l.count('</label>')
        
# Non è affidabile — meglio cercare manualmente la fine
print(f"return di ListinoSettore inizia a riga: {return_start}")

# Mostra le ultime 20 righe prima della riga 363
print("\n=== righe 345-365 ===")
for i,l in enumerate(lines[344:366],345):
    print(i, repr(l))
