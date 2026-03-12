import sys
sys.stdout.reconfigure(encoding='utf-8')
f=open('components/SettingsPanel.tsx','r',encoding='utf-8')
lines=f.readlines()
f.close()

# Cerca dove PRI viene definita dentro SettingsPanel
for i,l in enumerate(lines):
    if "const PRI = T.acc" in l:
        print(f"PRI a riga {i+1}: {repr(l)}")
        # Controlla se FF esiste nei dintorni
        for j in range(i, min(i+10, len(lines))):
            if 'FF' in lines[j]:
                print(f"  FF trovata a riga {j+1}: {repr(lines[j])}")
        # Aggiungi FF dopo PRI15
        if 'const PRI15' in lines[i+2]:
            target = i+2
            print(f"\nInserirò FF dopo riga {target+1}")
            lines.insert(target+1, '  const FF = "Inter, system-ui, sans-serif";\n')
            break
        elif 'const PRI08' in lines[i+1]:
            # cerca PRI15
            for j in range(i+1, i+6):
                if 'const PRI15' in lines[j]:
                    lines.insert(j+1, '  const FF = "Inter, system-ui, sans-serif";\n')
                    print(f"FF inserita dopo riga {j+1}")
                    break
            break

f=open('components/SettingsPanel.tsx','w',encoding='utf-8')
f.writelines(lines)
f.close()
print("done")
