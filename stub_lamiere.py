import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Trova inizio e fine del componente
start = end = None
for i,l in enumerate(lines):
    if 'function ListinoSettoreLamiere(' in l:
        start = i
    if start and i > start and l.strip() == '}':
        # Verifica che sia la chiusura della funzione contando le graffe
        chunk = ''.join(lines[start:i+1])
        if chunk.count('{') == chunk.count('}'):
            end = i
            break

print(f"Componente: righe {start+1}-{end+1 if end else '?'}")

STUB = '''function ListinoSettoreLamiere({ T, PRI, FF }: any) {
  return <div style={{ marginTop: 20, color: T.sub, fontSize: 12 }}>Listino Lamiere - coming soon</div>;
}
'''

if start is not None and end is not None:
    lines[start:end+1] = [STUB]
    f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
    f.writelines(lines)
    f.close()
    print(f"Stub inserito, file: {len(lines)} righe")
else:
    print("Non trovato")
