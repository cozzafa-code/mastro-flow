import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Righe 386-403 da sostituire (0-indexed: 385-402)
# Trova inizio e fine del blocco exportCSV in ListinoSettoreLamiere
start = None
end = None
for i,l in enumerate(lines):
    if 'const remove = (id: string) => save(lamiere.filter' in l and start is None:
        start = i
    if start and i > start and '  };' in l and end is None:
        end = i
        break

print(f"Blocco da riga {start+1} a {end+1}")
for i in range(start, min(end+5, len(lines))):
    print(i+1, repr(lines[i]))

new_block = [
    '  const remove = (id: string) => save(lamiere.filter((lm: any) => lm.id !== id));\n',
    '\n',
    '  const exportCSV = () => {\n',
    '    let csv = "Tipo;Nome;Fornitore;Spessore(mm);Euro/kg;Euro/ml base;Piega;Euro/ml piega\\n";\n',
    '    lamiere.forEach((lm: any) => {\n',
    '      if (lm.pieghe && lm.pieghe.length > 0) {\n',
    '        lm.pieghe.forEach((pg: any) => {\n',
    '          csv += lm.tipo+";"+lm.nome+";"+(lm.fornitore||"")+";"+(lm.spessore||"")+";"+(lm.prezzoKg||0)+";"+(lm.prezzoMl||0)+";"+pg.nome+";"+pg.prezzoMl+"\\n";\n',
    '        });\n',
    '      } else {\n',
    '        csv += lm.tipo+";"+lm.nome+";"+(lm.fornitore||"")+";"+(lm.spessore||"")+";"+(lm.prezzoKg||0)+";"+(lm.prezzoMl||0)+";;\\n";\n',
    '      }\n',
    '    });\n',
]

# Trova fine del forEach (la riga con '    });' dopo exportCSV)
csv_end = None
for i in range(start+2, len(lines)):
    if lines[i].strip() == '});' and 'forEach' not in lines[i]:
        csv_end = i
        break
    if '    });' == lines[i].rstrip() and i > start+5:
        csv_end = i
        break

print(f"\nFine forEach a riga {csv_end+1 if csv_end else 'N/A'}")

# Sostituzione righe start fino a dopo 'csv_end'
if start is not None and csv_end is not None:
    # Trova esattamente la riga '    });' che chiude il forEach di lamiere
    # Cerca da riga start+2 la prima occorrenza di '    });'
    fe = None
    for i in range(start+3, len(lines)):
        if lines[i].rstrip() == '    });':
            fe = i
            break
    print(f"forEach end a riga {fe+1 if fe else 'N/A'}")
    if fe:
        lines[start:fe+1] = new_block
        f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
        f.writelines(lines)
        f.close()
        print("PATCHED")
    else:
        print("forEach end non trovato")
