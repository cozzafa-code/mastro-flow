import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()
# Mostra ultime 3 righe di ogni blocco
for tab, end in [('colori',1034),('vetri',1054),('coprifili',1096),('lamiere',1113),('controtelaio',1218),('cassonetto',1232)]:
    print(f"\n--- {tab} (righe {end-3} a {end}) ---")
    for i in range(end-4, end):
        print(i+1, repr(lines[i]))
